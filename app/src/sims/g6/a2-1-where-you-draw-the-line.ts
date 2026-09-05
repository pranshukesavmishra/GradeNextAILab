import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import {
  badge, caption, dashFlow, gridPaper, hexA, isDarkTheme, plastic, vignette,
} from "@ui/scene";
import { barSeries, chartFrame, legend } from "@ui/charts";

/**
 * Where You Draw the Line — Grade 6, Unit A2.1: drawing a system's boundary.
 *
 * A Sierra-foothills middle-school campus is a genuine directed flow network:
 * 14 nodes, 26 typed edges, each edge carrying water, electricity, food,
 * waste or people at a rate that follows its own daily schedule. None of that
 * depends in any way on where a boundary is drawn. The boundary is purely a
 * geometric classifier evaluated fresh every tick: an edge with both ends on
 * the inside is an internal transfer, one crossing inward is an input, one
 * crossing outward is an output. Moving the boundary reclassifies edges; it
 * can never touch a rate.
 *
 * The honesty rule this sim exists to uphold: `classify()` is the only place
 * a role is ever decided, and it reads node membership only. `edgeRate()` is
 * the only place a rate is ever decided, and it never reads the boundary.
 * Those two functions do not call each other, so it is structurally
 * impossible for a dragged boundary to change what is flowing — only what a
 * flow counts as. A student can click any node to fold it into a custom
 * boundary — even the water main itself — and watch the ledger prove that
 * even a utility connection can become "internal" once the line encloses it.
 */

/* ------------------------------------------------------------------ *
 * The network — 14 nodes, 26 edges, five carriers
 * ------------------------------------------------------------------ */

export type Carrier = "water" | "electricity" | "food" | "waste" | "people";

export type NodeId =
  | "grid" | "waterMain" | "sewer" | "foodSupplier" | "hauler" | "home"
  | "classrooms" | "cafeteria" | "solar" | "washrooms" | "garden" | "trash"
  | "busLoop" | "field";

/** Fixed stage pixels. Pointer events arrive in canvas pixels and the model
 *  is never told the canvas size (see electric-force.ts for the precedent),
 *  so every interactive position — node hit-boxes, the drawn diagram — is
 *  laid out in one fixed pixel frame that step() and render() both share. */
interface CampusNode { id: NodeId; label: string; external: boolean; x: number; y: number }

export const NODES: CampusNode[] = [
  // Off-site utilities and the street edge — never inside a fixed preset.
  { id: "grid", label: "Grid", external: true, x: 40, y: 140 },
  { id: "waterMain", label: "Water main", external: true, x: 40, y: 220 },
  { id: "sewer", label: "Sewer", external: true, x: 40, y: 300 },
  { id: "foodSupplier", label: "Food supplier", external: true, x: 560, y: 110 },
  { id: "hauler", label: "Waste hauler", external: true, x: 560, y: 300 },
  { id: "home", label: "Homes", external: true, x: 300, y: 40 },
  // On the site.
  { id: "busLoop", label: "Bus loop", external: false, x: 260, y: 110 },
  { id: "classrooms", label: "Classrooms", external: false, x: 200, y: 190 },
  { id: "solar", label: "Solar (gym roof)", external: false, x: 340, y: 110 },
  { id: "cafeteria", label: "Cafeteria", external: false, x: 340, y: 190 },
  { id: "washrooms", label: "Washrooms", external: false, x: 200, y: 270 },
  { id: "garden", label: "Garden + compost", external: false, x: 420, y: 270 },
  { id: "trash", label: "Trash + recycling", external: false, x: 460, y: 190 },
  { id: "field", label: "Field (irrigated)", external: false, x: 200, y: 350 },
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
const ON_SITE: NodeId[] = NODES.filter((n) => !n.external).map((n) => n.id);
const HIT_RADIUS = 24; // px, generous enough for a middle-schooler's fingertip

/** School-day occupancy, 0 to 1: ramps 07:45→08:00, flat, ramps 15:00→15:15.
 *  Its exact integral over the day is EFFECTIVE_OCC_H, used below so a rate
 *  built from it integrates to a clean daily total. */
function occFrac(hour: number): number {
  if (hour < 7.75 || hour >= 15.25) return 0;
  if (hour < 8.0) return (hour - 7.75) / 0.25;
  if (hour > 15.0) return (15.25 - hour) / 0.25;
  return 1;
}
const EFFECTIVE_OCC_H = 7.25; // 7 h flat + two 0.25 h ramps averaging 0.5

/** The 45-minute lunch window, a flat pulse (object #3: "on a lunch-hour schedule"). */
function lunchFrac(hour: number): number {
  return hour >= 11.5 && hour < 12.25 ? 1 : 0;
}
const EFFECTIVE_LUNCH_H = 0.75;

/** A triangular pulse of half-width `hw`, integral exactly `hw`. */
function trianglePulse(hour: number, center: number, hw: number): number {
  const d = Math.abs(hour - center);
  return d >= hw ? 0 : 1 - d / hw;
}

function inWindow(hour: number, a: number, b: number): number {
  return hour >= a && hour < b ? 1 : 0;
}

/** The rooftop array's daily curve, peaking at the slider's kW at solar noon —
 *  object #4: "output following a daily curve." */
function solarKWNow(hour: number, peakKW: number): number {
  if (hour <= 6 || hour >= 18) return 0;
  return peakKW * Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12));
}

const WINDOW_H = 12; // the modelled school day, 06:00-18:00 (spec's scrubber range)

/* ---- per-student / per-day constants, reasoned where the spec is silent -- */
const WASH_M3_PER_STUDENT_DAY = 0.014;    // ~14 L/day: toilets and handwashing
const KITCHEN_M3_PER_STUDENT_DAY = 0.006; // food prep and dishwashing
const IRRIGATION_FIELD_SHARE = 0.7;       // spec: irrigation "to the field and garden"
const IRRIGATION_GARDEN_SHARE = 0.3;

const CLASSROOM_BASE_KW = 8;      // security lighting, idle HVAC standby
const CLASSROOM_OCC_KW = 22;      // full lighting, HVAC and devices, per k
const KITCHEN_BASE_KW = 2;        // fridges and chillers, always on
const KITCHEN_PREP_KW = 3;        // prep and refrigeration through the day
const KITCHEN_LUNCH_KW = 15;      // ovens and dishwashers at service
const WASHROOM_KW = 0.8;          // lighting and the hot-water heater
const IRRIGATION_PUMP_KW_PER_M3D = 0.05; // pump draw scales with flow moved

// spec object #8: "240 kg of food" delivered at the syllabus's default 520
// students, so a truck that scales with enrolment.
const FOOD_KG_PER_STUDENT_DAY = 240 / 520;
const GARDEN_YIELD_KG_PER_DAY = 3; // spec: "a small vegetable yield"
const SCRAP_FRACTION = 0.12;       // share of delivered food mass, scraps
const PACKAGING_FRACTION = 0.05;   // share of delivered food mass, packaging
const CLASSROOM_TRASH_KG_PER_STUDENT_DAY = 0.05;
const HAUL_INTERVAL_DAYS = 3.5;    // spec: "empties them twice a week"
const RECYCLE_SHARE = 0.35;        // of hauled mass that is recycling, not trash

const BUS_SHARE = 0.55;    // fraction of enrolment the two buses carry
const WALK_SHARE = 1 - BUS_SHARE;
const BUS_ARRIVE_H = 7 + 50 / 60;  // spec object #9: 07:50
const BUS_DEPART_H = 15 + 10 / 60; // spec object #9: 15:10
const BUS_PULSE_HW = 0.1;          // 6-minute boarding window
const WALK_AM = [7.5, 8.25] as const;
const WALK_PM = [15.0, 15.75] as const;

/* ------------------------------------------------------------------ *
 * Edges
 * ------------------------------------------------------------------ */

interface EdgeCtx { k: number; solarKW: number; irrigation: number; composting: boolean }

interface FlowEdge {
  id: string;
  from: NodeId;
  to: NodeId;
  carrier: Carrier;
  label: string;
  unit: string;
  /** Instantaneous rate in <unit> per hour. Reads hour + params ONLY —
   *  never the boundary. This is the half of the honesty rule that keeps
   *  every rate real. */
  rate(hour: number, c: EdgeCtx): number;
}

/** Water and kitchen inflow drive their own outflow 1:1 (what comes in as
 *  supply leaves as wastewater), so the two pairs share one function. */
function washInflow(hour: number, c: EdgeCtx): number {
  return (WASH_M3_PER_STUDENT_DAY * c.k * 520 * occFrac(hour)) / EFFECTIVE_OCC_H;
}
function kitchenWaterInflow(hour: number, c: EdgeCtx): number {
  return (KITCHEN_M3_PER_STUDENT_DAY * c.k * 520 * occFrac(hour)) / EFFECTIVE_OCC_H;
}
function enrolmentOf(c: EdgeCtx): number {
  return c.k * 520;
}
function classroomDemandKW(hour: number, c: EdgeCtx): number {
  return CLASSROOM_BASE_KW + CLASSROOM_OCC_KW * c.k * occFrac(hour);
}
function cafeteriaDemandKW(hour: number, c: EdgeCtx): number {
  return KITCHEN_BASE_KW + KITCHEN_PREP_KW * c.k * occFrac(hour) + KITCHEN_LUNCH_KW * c.k * lunchFrac(hour);
}
function solarAllocation(hour: number, c: EdgeCtx) {
  const gen = solarKWNow(hour, c.solarKW);
  const classroom = classroomDemandKW(hour, c);
  const cafeteria = cafeteriaDemandKW(hour, c);
  const covered = Math.min(gen, classroom + cafeteria);
  const toClassrooms = Math.min(covered, classroom);
  const toCafeteria = Math.min(covered - toClassrooms, cafeteria);
  const exportKW = Math.max(0, gen - classroom - cafeteria);
  return { gen, classroom, cafeteria, toClassrooms, toCafeteria, exportKW };
}
function scrapsRate(hour: number, c: EdgeCtx): number {
  const dailyScraps = SCRAP_FRACTION * FOOD_KG_PER_STUDENT_DAY * enrolmentOf(c);
  return (dailyScraps * lunchFrac(hour)) / EFFECTIVE_LUNCH_H;
}
function packagingRate(hour: number, c: EdgeCtx): number {
  const dailyPackaging = PACKAGING_FRACTION * FOOD_KG_PER_STUDENT_DAY * enrolmentOf(c);
  return (dailyPackaging * lunchFrac(hour)) / EFFECTIVE_LUNCH_H;
}

export const EDGES: FlowEdge[] = [
  // ---- water (6) ----
  { id: "waterWash", from: "waterMain", to: "washrooms", carrier: "water", unit: "m³",
    label: "water main to washrooms", rate: washInflow },
  { id: "waterKitchen", from: "waterMain", to: "cafeteria", carrier: "water", unit: "m³",
    label: "water main to kitchen", rate: kitchenWaterInflow },
  { id: "waterField", from: "waterMain", to: "field", carrier: "water", unit: "m³",
    label: "irrigation to the field",
    rate: (_h, c) => (c.irrigation * IRRIGATION_FIELD_SHARE) / WINDOW_H },
  { id: "waterGarden", from: "waterMain", to: "garden", carrier: "water", unit: "m³",
    label: "irrigation to the garden",
    rate: (_h, c) => (c.irrigation * IRRIGATION_GARDEN_SHARE) / WINDOW_H },
  { id: "waterWashOut", from: "washrooms", to: "sewer", carrier: "water", unit: "m³",
    label: "washroom outflow to sewer", rate: washInflow },
  { id: "waterKitchenOut", from: "cafeteria", to: "sewer", carrier: "water", unit: "m³",
    label: "kitchen outflow to sewer", rate: kitchenWaterInflow },

  // ---- electricity (7) ----
  { id: "elecGridClass", from: "grid", to: "classrooms", carrier: "electricity", unit: "kWh",
    label: "grid to classrooms",
    rate: (h, c) => classroomDemandKW(h, c) - solarAllocation(h, c).toClassrooms },
  { id: "elecGridCafe", from: "grid", to: "cafeteria", carrier: "electricity", unit: "kWh",
    label: "grid to kitchen",
    rate: (h, c) => cafeteriaDemandKW(h, c) - solarAllocation(h, c).toCafeteria },
  { id: "elecGridField", from: "grid", to: "field", carrier: "electricity", unit: "kWh",
    label: "grid to irrigation pump",
    rate: (_h, c) => IRRIGATION_PUMP_KW_PER_M3D * c.irrigation },
  { id: "elecGridWash", from: "grid", to: "washrooms", carrier: "electricity", unit: "kWh",
    label: "grid to washrooms", rate: (h) => WASHROOM_KW * occFrac(h) },
  { id: "elecSolarClass", from: "solar", to: "classrooms", carrier: "electricity", unit: "kWh",
    label: "solar to classrooms", rate: (h, c) => solarAllocation(h, c).toClassrooms },
  { id: "elecSolarCafe", from: "solar", to: "cafeteria", carrier: "electricity", unit: "kWh",
    label: "solar to kitchen", rate: (h, c) => solarAllocation(h, c).toCafeteria },
  { id: "elecSolarGrid", from: "solar", to: "grid", carrier: "electricity", unit: "kWh",
    label: "solar export to grid", rate: (h, c) => solarAllocation(h, c).exportKW },

  // ---- food (2) ----
  { id: "foodTruck", from: "foodSupplier", to: "cafeteria", carrier: "food", unit: "kg",
    label: "delivery truck to kitchen",
    rate: (h, c) => (FOOD_KG_PER_STUDENT_DAY * enrolmentOf(c) / 0.25) * trianglePulse(h, 7.5, 0.25) },
  { id: "foodGarden", from: "garden", to: "cafeteria", carrier: "food", unit: "kg",
    label: "garden yield to kitchen", rate: () => GARDEN_YIELD_KG_PER_DAY / WINDOW_H },

  // ---- waste (5) ----
  { id: "wasteCompost", from: "cafeteria", to: "garden", carrier: "waste", unit: "kg",
    label: "scraps to compost", rate: (h, c) => (c.composting ? scrapsRate(h, c) : 0) },
  { id: "wasteTrashCafe", from: "cafeteria", to: "trash", carrier: "waste", unit: "kg",
    label: "kitchen waste to bins",
    rate: (h, c) => packagingRate(h, c) + (c.composting ? 0 : scrapsRate(h, c)) },
  { id: "wasteTrashClass", from: "classrooms", to: "trash", carrier: "waste", unit: "kg",
    label: "classroom trash to bins",
    rate: (h, c) => (CLASSROOM_TRASH_KG_PER_STUDENT_DAY * enrolmentOf(c) * occFrac(h)) / EFFECTIVE_OCC_H },
  // The next two are discrete "twice a week" events, not a schedule of the
  // hour — their live rate depends on the trash stock, so step() computes it
  // directly (see haulRates()) rather than through this generic table. They
  // still need an entry so classify()/render() can treat them like any edge.
  { id: "wasteHaulTrash", from: "trash", to: "hauler", carrier: "waste", unit: "kg",
    label: "bin to hauler (trash)", rate: () => 0 },
  { id: "wasteHaulRecycle", from: "trash", to: "hauler", carrier: "waste", unit: "kg",
    label: "bin to hauler (recycling)", rate: () => 0 },

  // ---- people (6) ----
  { id: "peopleBusIn", from: "home", to: "busLoop", carrier: "people", unit: "people",
    label: "buses arrive",
    rate: (h, c) => (BUS_SHARE * enrolmentOf(c) / BUS_PULSE_HW) * trianglePulse(h, BUS_ARRIVE_H, BUS_PULSE_HW) },
  { id: "peopleBusOut", from: "busLoop", to: "home", carrier: "people", unit: "people",
    label: "buses depart",
    rate: (h, c) => (BUS_SHARE * enrolmentOf(c) / BUS_PULSE_HW) * trianglePulse(h, BUS_DEPART_H, BUS_PULSE_HW) },
  { id: "peopleBusToClass", from: "busLoop", to: "classrooms", carrier: "people", unit: "people",
    label: "bus riders walk in",
    rate: (h, c) => (BUS_SHARE * enrolmentOf(c) / BUS_PULSE_HW) * trianglePulse(h, BUS_ARRIVE_H, BUS_PULSE_HW) },
  { id: "peopleClassToBus", from: "classrooms", to: "busLoop", carrier: "people", unit: "people",
    label: "bus riders walk out",
    rate: (h, c) => (BUS_SHARE * enrolmentOf(c) / BUS_PULSE_HW) * trianglePulse(h, BUS_DEPART_H, BUS_PULSE_HW) },
  { id: "peopleWalkIn", from: "home", to: "classrooms", carrier: "people", unit: "people",
    label: "walkers and drop-offs arrive",
    rate: (h, c) => (WALK_SHARE * enrolmentOf(c) / (WALK_AM[1] - WALK_AM[0])) * inWindow(h, WALK_AM[0], WALK_AM[1]) },
  { id: "peopleWalkOut", from: "classrooms", to: "home", carrier: "people", unit: "people",
    label: "walkers head home",
    rate: (h, c) => (WALK_SHARE * enrolmentOf(c) / (WALK_PM[1] - WALK_PM[0])) * inWindow(h, WALK_PM[0], WALK_PM[1]) },
];

if (EDGES.length !== 26) throw new Error(`A2.1 network must have 26 edges, has ${EDGES.length}`);
if (NODES.length !== 14) throw new Error(`A2.1 network must have 14 nodes, has ${NODES.length}`);

const EDGE_BY_ID = new Map(EDGES.map((e) => [e.id, e]));
const HAUL_TRASH = EDGE_BY_ID.get("wasteHaulTrash")!;
const HAUL_RECYCLE = EDGE_BY_ID.get("wasteHaulRecycle")!;

/* ------------------------------------------------------------------ *
 * The boundary — a geometric classifier, nothing else
 * ------------------------------------------------------------------ */

export type Role = "input" | "output" | "internal" | "outside";

const PRESET_INSIDE: Record<string, NodeId[]> = {
  campus: [...ON_SITE],
  cafeteria: ["cafeteria"],
  buildings: ["classrooms", "cafeteria", "washrooms"],
  campusPlusBuses: [...ON_SITE, "home", "foodSupplier"],
};

function insideSetFor(params: ParamValues, customInside: NodeId[] | null): Set<NodeId> {
  const preset = params.boundaryPreset as string;
  if (preset === "custom") return new Set(customInside ?? PRESET_INSIDE.campus);
  return new Set(PRESET_INSIDE[preset] ?? PRESET_INSIDE.campus);
}

/** THE classifier. Reads only which nodes are inside — never a rate, never
 *  an hour. This is the other half of the honesty rule. */
export function classify(edge: { from: NodeId; to: NodeId }, inside: Set<NodeId>): Role {
  const a = inside.has(edge.from);
  const b = inside.has(edge.to);
  if (a && b) return "internal";
  if (!a && b) return "input";
  if (a && !b) return "output";
  return "outside";
}

function boundarySignature(params: ParamValues, customInside: NodeId[] | null): string {
  const preset = params.boundaryPreset as string;
  if (preset !== "custom") return preset;
  return `custom:${[...(customInside ?? [])].sort().join(",")}`;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  day: number;
  clockH: number; // 6..18
  customInside: NodeId[] | null;
  prevSignature: string;
  prevRoles: Record<string, Role>;
  reclassifiedCount: number;
  /** Running per-carrier net (inputs - outputs), reset on a boundary change
   *  or a new day — the "accumulation" ledger row, a real integral. */
  acc: Record<Carrier, number>;
  /** A genuinely tracked physical stock: kilograms sitting in the bins right
   *  now, independent of any boundary. Cross-checked against the waste
   *  ledger so "accumulation" has real teeth for at least one carrier. */
  trashStockKg: number;
  haulCount: number;
  haulFlash: number; // sim-hours left to show the pickup on stage
  lastHaulTrashKg: number;
  lastHaulRecycleKg: number;
  /** Lifetime totals, kept only so the conservation check below can compare
   *  an independent running sum against the live stock — never read by
   *  anything else. */
  lifetimeIntoTrash: number;
  lifetimeHauledAway: number;
}

const CARRIERS: Carrier[] = ["water", "electricity", "food", "waste", "people"];
const DAY_LENGTH_REAL_S = 90; // a school day (06:00-18:00) plays out in 90 s at 1x
const PACE_H_PER_S = WINDOW_H / DAY_LENGTH_REAL_S;

function freshAcc(): Record<Carrier, number> {
  return { water: 0, electricity: 0, food: 0, waste: 0, people: 0 };
}

function buildInitialState(params: ParamValues): State {
  return {
    day: 0,
    clockH: (params.timeOfDay as number) / 3600,
    customInside: null,
    prevSignature: "campus",
    prevRoles: {},
    reclassifiedCount: 0,
    acc: freshAcc(),
    trashStockKg: 0,
    haulCount: 0,
    haulFlash: 0,
    lastHaulTrashKg: 0,
    lastHaulRecycleKg: 0,
    lifetimeIntoTrash: 0,
    lifetimeHauledAway: 0,
  };
}

/** Every edge's live rate and role together, computed once per tick and
 *  shared by step(), readouts(), facts() and render() so nobody ever sees
 *  two different numbers for the same edge. */
function computeTick(state: State, params: ParamValues) {
  const c: EdgeCtx = {
    k: (params.enrolment as number) / 520,
    solarKW: (params.solarOutput as number) / 1000,
    irrigation: params.irrigation as number,
    composting: params.composting === true,
  };
  const inside = insideSetFor(params, state.customInside);
  const rates: Record<string, number> = {};
  const roles: Record<string, Role> = {};
  for (const e of EDGES) {
    rates[e.id] = e === HAUL_TRASH || e === HAUL_RECYCLE ? 0 : Math.max(0, e.rate(state.clockH, c));
    roles[e.id] = classify(e, inside);
  }
  // The twice-weekly haul: a discrete event, not an hourly schedule. Its
  // rate is nonzero only in the flash window right after a pickup, sized so
  // the flash's own time-integral empties exactly what was in the bin.
  const flashLen = 0.5;
  if (state.haulFlash > 0) {
    rates.wasteHaulTrash = state.lastHaulTrashKg / flashLen;
    rates.wasteHaulRecycle = state.lastHaulRecycleKg / flashLen;
  }
  return { c, inside, rates, roles };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return buildInitialState(params);
  },

  applyParams(state, params, prev) {
    let s = state;
    if (params.timeOfDay !== prev.timeOfDay) {
      s = { ...s, clockH: (params.timeOfDay as number) / 3600 };
    }
    if (params.boundaryPreset === "custom" && prev.boundaryPreset !== "custom" && s.customInside === null) {
      s = { ...s, customInside: [...PRESET_INSIDE.campus] };
    }
    return s;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;

    // Click a node while drawing a custom boundary to fold it in or out.
    // Fixed pixel hit-boxes shared with render() — see the header comment.
    if ((params.boundaryPreset as string) === "custom") {
      for (const input of inputs) {
        if (input.type !== "pointerdown") continue;
        for (const n of NODES) {
          const d = Math.hypot(input.x - n.x, input.y - n.y);
          if (d > HIT_RADIUS) continue;
          const cur = s.customInside ?? [...PRESET_INSIDE.campus];
          const has = cur.includes(n.id);
          s = { ...s, customInside: has ? cur.filter((id) => id !== n.id) : [...cur, n.id] };
          break;
        }
      }
    }

    if (dt <= 0) return s;

    const hoursAdvanced = dt * PACE_H_PER_S;
    let clockH = s.clockH + hoursAdvanced;
    let day = s.day;
    while (clockH >= 18) {
      clockH -= WINDOW_H;
      day += 1;
    }
    s = { ...s, clockH, day };

    const { rates, roles } = computeTick(s, params);

    // Reclassification: comparing this tick's roles against the roles the
    // very same edges held last tick. Roles only ever move because the
    // boundary moved, so a nonzero count here IS "the boundary just changed
    // and this many edges flipped column" — no separate change-detector
    // needed.
    let reclassified = 0;
    for (const e of EDGES) if (s.prevRoles[e.id] && s.prevRoles[e.id] !== roles[e.id]) reclassified++;
    const signature = boundarySignature(params, s.customInside);
    const boundaryMoved = signature !== s.prevSignature;
    const acc = boundaryMoved ? freshAcc() : { ...s.acc };
    for (const e of EDGES) {
      const role = roles[e.id];
      const delta = rates[e.id] * hoursAdvanced;
      if (role === "input") acc[e.carrier] += delta;
      else if (role === "output") acc[e.carrier] -= delta;
    }

    // The trash bin: a real stock, filled by every waste inflow to `trash`,
    // independent of any boundary at all.
    let trashStockKg = s.trashStockKg;
    let lifetimeIntoTrash = s.lifetimeIntoTrash;
    for (const e of EDGES) {
      if (e.to === "trash" && e.carrier === "waste") {
        const delta = rates[e.id] * hoursAdvanced;
        trashStockKg += delta;
        lifetimeIntoTrash += delta;
      }
    }
    let haulFlash = Math.max(0, s.haulFlash - hoursAdvanced);
    let haulCount = s.haulCount;
    let lastHaulTrashKg = s.lastHaulTrashKg;
    let lastHaulRecycleKg = s.lastHaulRecycleKg;
    let lifetimeHauledAway = s.lifetimeHauledAway;
    if (haulDue(day, clockH, haulCount)) {
      lastHaulRecycleKg = trashStockKg * RECYCLE_SHARE;
      lastHaulTrashKg = trashStockKg - lastHaulRecycleKg;
      lifetimeHauledAway += trashStockKg;
      trashStockKg = 0;
      haulCount += 1;
      haulFlash = 0.5;
      // What just left the site is itself an output crossing whatever
      // boundary currently encloses the bin — credit it into the running
      // waste accumulation exactly like any other output.
      const role = classify(HAUL_TRASH, insideSetFor(params, s.customInside));
      if (role === "input") acc.waste += lastHaulTrashKg + lastHaulRecycleKg;
      else if (role === "output") acc.waste -= lastHaulTrashKg + lastHaulRecycleKg;
    }

    return {
      ...s,
      prevSignature: signature,
      prevRoles: roles,
      reclassifiedCount: reclassified,
      acc,
      trashStockKg,
      haulCount,
      haulFlash,
      lastHaulTrashKg,
      lastHaulRecycleKg,
      lifetimeIntoTrash,
      lifetimeHauledAway,
    };
  },

  readouts(state, params) {
    const { roles } = computeTick(state, params);
    let inputs = 0, outputs = 0, internal = 0;
    for (const e of EDGES) {
      const r = roles[e.id];
      if (r === "input") inputs++;
      else if (r === "output") outputs++;
      else if (r === "internal") internal++;
    }
    return [
      { key: "inputs", label: "Inputs crossing in", quantity: q(inputs, "count"), semantic: "producer", graphable: true },
      { key: "outputs", label: "Outputs crossing out", quantity: q(outputs, "count"), semantic: "decomposer", graphable: true },
      { key: "internal", label: "Internal transfers", quantity: q(internal, "count"), semantic: "field", graphable: true },
      { key: "reclassified", label: "Reclassified by last move", quantity: q(state.reclassifiedCount, "count"), semantic: "time" },
      {
        key: "accWater", label: "Water accumulation (m³)", quantity: q(state.acc.water, "ratio"),
        semantic: "liquid", graphable: true,
      },
      {
        key: "accElectricity", label: "Electricity accumulation (kWh)", quantity: q(state.acc.electricity, "ratio"),
        semantic: "current", graphable: true,
      },
      {
        key: "accWaste", label: "Waste accumulation (kg)", quantity: q(state.acc.waste, "ratio"),
        semantic: "decomposer", graphable: true, bands: ["6-8", "9-12"],
      },
      { key: "trashStock", label: "Trash bin level (kg)", quantity: q(state.trashStockKg, "mass"), semantic: "mass" },
      { key: "day", label: "Day", quantity: q(state.day, "count"), semantic: "time" },
      {
        key: "clock", label: "Time", unit: "h", quantity: q(state.clockH, "ratio"), semantic: "time",
        bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const { rates, roles, inside } = computeTick(state, params);
    let inputs = 0, outputs = 0, internal = 0, outside = 0;
    for (const e of EDGES) {
      const r = roles[e.id];
      if (r === "input") inputs++;
      else if (r === "output") outputs++;
      else if (r === "internal") internal++;
      else outside++;
    }
    const out: Record<string, number | boolean | string> = {
      day: state.day,
      hour: state.clockH,
      boundaryPreset: params.boundaryPreset as string,
      insideCount: inside.size,
      inputsCount: inputs,
      outputsCount: outputs,
      internalCount: internal,
      outsideCount: outside,
      crossingCount: inputs + outputs,
      reclassifiedCount: state.reclassifiedCount,
      accWater: state.acc.water,
      accElectricity: state.acc.electricity,
      accFood: state.acc.food,
      accWaste: state.acc.waste,
      accPeople: state.acc.people,
      trashStockKg: state.trashStockKg,
      haulCount: state.haulCount,
      // Real conservation check on the one carrier with a tracked physical
      // stock: the bin level plus everything ever hauled away must equal
      // everything that ever arrived, to a tight tolerance. Independently
      // accumulated running sums, not a definitional identity.
      binConserves: Math.abs(
        state.trashStockKg + state.lifetimeHauledAway - state.lifetimeIntoTrash,
      ) < 1e-6,
    };
    for (const e of EDGES) {
      out[`rate_${e.id}`] = rates[e.id];
      out[`role_${e.id}`] = roles[e.id];
    }
    return out;
  },
};

/** Whether the twice-weekly hauler is due, checked once per tick against a
 *  fixed calendar of pickup times so the event fires exactly once. */
function haulDue(day: number, clockH: number, haulCount: number): boolean {
  const HAUL_HOUR = 7; // the truck comes before the gates open
  const nowIndex = Math.floor((day * 24 + clockH) / (HAUL_INTERVAL_DAYS * 24) + 1e-9);
  return nowIndex > haulCount && clockH >= HAUL_HOUR && clockH < HAUL_HOUR + 1;
}

/* ------------------------------------------------------------------ *
 * Render — the site plan, the boundary, the ledger
 * ------------------------------------------------------------------ */

const TINT: Record<Carrier, string> = {
  water: "liquid", electricity: "current", food: "producer", waste: "decomposer", people: "primary-consumer",
};

function carrierColor(theme: RenderContext<State>["theme"], carrier: Carrier): string {
  return theme.sci[TINT[carrier]] ?? theme.accent;
}

/** Andrew's monotone-chain convex hull. Pure and deterministic. */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length <= 2) return pts;
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: { x: number; y: number }[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function inflateHull(hull: { x: number; y: number }[], margin: number): { x: number; y: number }[] {
  if (hull.length === 0) return hull;
  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
  return hull.map((p) => {
    const dx = p.x - cx, dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * margin, y: p.y + (dy / len) * margin };
  });
}

function drawBoundary(rc: RenderContext<State>, inside: Set<NodeId>) {
  const { ctx, theme, time } = rc;
  const pts = NODES.filter((n) => inside.has(n.id)).map((n) => ({ x: n.x, y: n.y }));
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -time * 14;
  if (pts.length === 0) {
    ctx.restore();
    return;
  }
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, 30, 0, Math.PI * 2);
    ctx.stroke();
  } else if (pts.length === 2) {
    ctx.lineWidth = 24;
    ctx.globalAlpha = 0.18;
    ctx.lineCap = "round";
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
  } else {
    const hull = inflateHull(convexHull(pts), 30);
    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawNode(rc: RenderContext<State>, n: CampusNode, inside: boolean) {
  const { ctx, theme } = rc;
  const dark = isDarkTheme(theme);
  const r = n.id === "field" || n.id === "garden" ? 20 : 16;
  ctx.save();
  if (n.external) {
    ctx.globalAlpha = inside ? 1 : 0.55;
    ctx.fillStyle = hexA(theme.inkSoft, 0.18);
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const tint = n.id === "solar" ? "light" : n.id === "trash" ? "decomposer" : "field";
    plastic(ctx, n.x - r, n.y - r, r * 2, r * 2, hexA(theme.sci[tint] ?? theme.accent, 0.9), { radius: 6, gloss: 0.25 });
    if (inside) {
      ctx.strokeStyle = hexA(theme.accent, 0.9);
      ctx.lineWidth = 1.6;
      roundRect(ctx, n.x - r, n.y - r, r * 2, r * 2, 6);
      ctx.stroke();
    }
  }
  ctx.restore();
  caption(ctx, n.x, n.y + r + 11, n.label, theme, {
    align: "center", size: 9.5, color: dark ? theme.inkSoft : theme.inkSoft, weight: 700,
  });
}

function drawEdges(
  rc: RenderContext<State>, rates: Record<string, number>, roles: Record<string, Role>, params: ParamValues,
) {
  const { ctx, theme, time } = rc;
  const showCrossingsOnly = params.showCrossingsOnly === true;
  const showFlag: Record<Carrier, boolean> = {
    water: params.showWater !== false,
    electricity: params.showElectricity !== false,
    food: params.showFood !== false,
    waste: params.showWaste !== false,
    people: params.showPeople !== false,
  };
  for (const e of EDGES) {
    if (!showFlag[e.carrier]) continue;
    const role = roles[e.id];
    if (role === "outside") continue;
    if (showCrossingsOnly && role === "internal") continue;
    const a = NODE_BY_ID.get(e.from)!, b = NODE_BY_ID.get(e.to)!;
    const col = carrierColor(theme, e.carrier);
    const rate = rates[e.id];
    const live = rate > 1e-6;
    if (role === "internal") {
      ctx.save();
      ctx.strokeStyle = hexA(col, live ? 0.5 : 0.16);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    } else if (live) {
      dashFlow(ctx, [{ x: a.x, y: a.y }, { x: b.x, y: b.y }], col, time * 30, {
        width: 2.2, dash: 6, gap: 6, alpha: 0.85,
      });
    } else {
      ctx.save();
      ctx.strokeStyle = hexA(col, 0.22);
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

function windowHours(agg: string): number {
  if (agg === "minute") return 1 / 60;
  if (agg === "year") return 24 * 180;
  return 24;
}
function windowLabel(agg: string): string {
  return agg === "minute" ? "/min" : agg === "year" ? "/yr" : "/day";
}

function drawLedger(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  rates: Record<string, number>, roles: Record<string, Role>, params: ParamValues,
) {
  const { ctx, theme } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(12,17,24,0.82)" : "rgba(255,255,255,0.88)";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const agg = params.aggregationWindow as string;
  const winH = windowHours(agg);
  caption(ctx, x + 12, y + 16, "LEDGER", theme, { size: 11, weight: 800, color: theme.inkSoft });
  caption(ctx, x + w - 10, y + 16, windowLabel(agg), theme, { size: 10, color: theme.inkSoft, align: "right" });

  const cols: { role: Role; label: string; color: string }[] = [
    { role: "input", label: "INPUTS", color: theme.sci["producer"] },
    { role: "output", label: "OUTPUTS", color: theme.sci["decomposer"] },
    { role: "internal", label: "INTERNAL", color: theme.inkSoft },
  ];
  const rows = EDGES.filter((e) => roles[e.id] !== "outside");
  const rowH = 13;
  let cy = y + 34;
  const maxRows = Math.max(3, Math.floor((h - 40) / (rowH * 3)));
  for (const col of cols) {
    caption(ctx, x + 12, cy, col.label, theme, { size: 9.5, weight: 800, color: col.color });
    cy += rowH;
    const list = rows.filter((e) => roles[e.id] === col.role).slice(0, maxRows);
    for (const e of list) {
      const val = rates[e.id] * winH;
      const dp = e.unit === "people" || e.unit === "kg" ? 1 : 2;
      ctx.save();
      ctx.font = "500 9.5px ui-monospace, monospace";
      ctx.fillStyle = theme.inkSoft;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(e.label, x + 14, cy);
      ctx.textAlign = "right";
      ctx.fillStyle = carrierColor(theme, e.carrier);
      ctx.fillText(`${val.toFixed(dp)} ${e.unit}`, x + w - 12, cy);
      ctx.restore();
      cy += rowH;
    }
    const extra = rows.filter((e) => roles[e.id] === col.role).length - list.length;
    if (extra > 0) {
      caption(ctx, x + 14, cy, `+ ${extra} more`, theme, { size: 8.5, color: theme.inkSoft });
      cy += rowH;
    }
    cy += 4;
  }
  ctx.restore();
}

function drawBarChart(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  rates: Record<string, number>, roles: Record<string, Role>, params: ParamValues,
) {
  const { ctx, theme } = rc;
  const agg = params.aggregationWindow as string;
  const winH = windowHours(agg);
  const inTot: Record<Carrier, number> = { water: 0, electricity: 0, food: 0, waste: 0, people: 0 };
  const outTot: Record<Carrier, number> = { water: 0, electricity: 0, food: 0, waste: 0, people: 0 };
  for (const e of EDGES) {
    const r = roles[e.id];
    if (r === "input") inTot[e.carrier] += rates[e.id] * winH;
    else if (r === "output") outTot[e.carrier] += rates[e.id] * winH;
  }
  const cats = CARRIERS;
  const vals = cats.flatMap((c) => [inTot[c], outTot[c]]);
  const maxV = Math.max(1e-6, ...vals);
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: -0.5, xMax: cats.length * 2 - 0.5, yMin: 0, yMax: maxV * 1.15,
    title: "Inputs vs outputs by type", grid: "y", xTicks: 1,
    xFormat: () => "",
  }, theme);
  // Two interleaved series (input at even slots, output at odd), each drawn
  // with the other half NaN so barSeries — which has no grouped-bar mode —
  // skips it cleanly, giving a genuine two-colour comparison per category.
  const inBars = cats.flatMap((c) => [inTot[c], NaN]);
  const outBars = cats.flatMap((c) => [NaN, outTot[c]]);
  barSeries(ctx, inBars, sx, sy, theme.sci["producer"], { theme, maxWidth: 14 });
  barSeries(ctx, outBars, sx, sy, theme.sci["decomposer"], { theme, maxWidth: 14 });
  for (let i = 0; i < cats.length; i++) {
    const label = cats[i][0].toUpperCase() + cats[i].slice(1, 4);
    caption(ctx, sx(i * 2 + 0.5), y + h - 2, label, theme, { align: "center", size: 8, color: theme.inkSoft });
  }
  legend(ctx, x + 8, y + h + 4, [
    { label: "input", color: theme.sci["producer"], shape: "swatch" },
    { label: "output", color: theme.sci["decomposer"], shape: "swatch" },
  ], theme, { size: 9 });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const { rates, roles, inside } = computeTick(state, params);

  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, width, height);
  gridPaper(ctx, width, height, theme, { step: 22, major: 4, alpha: 0.5 });

  drawBoundary(rc, inside);
  drawEdges(rc, rates, roles, params);
  for (const n of NODES) drawNode(rc, n, inside.has(n.id));

  const hh = Math.floor(state.clockH).toString().padStart(2, "0");
  const mm = Math.floor((state.clockH % 1) * 60).toString().padStart(2, "0");
  badge(ctx, 12, 20, `Day ${state.day} · ${hh}:${mm}`, theme, { color: theme.accent });
  const presetLabel = (params.boundaryPreset as string) === "custom"
    ? `Custom (${inside.size} nodes)`
    : String(params.boundaryPreset);
  badge(ctx, width / 2, 20, presetLabel, theme, { align: "center", color: theme.accent, sub: "boundary" });
  if (state.reclassifiedCount > 0) {
    badge(ctx, width - 12, 20, `${state.reclassifiedCount} flipped`, theme, {
      align: "right", color: theme.sci["hot"], sub: "just reclassified",
    });
  }
  if (state.haulFlash > 0) {
    badge(ctx, width / 2, 46, "hauler emptied the bins", theme, { align: "center", color: theme.sci["decomposer"] });
  }

  const ledgerW = Math.min(240, width * 0.28);
  drawLedger(rc, width - ledgerW - 12, 56, ledgerW, height - 190, rates, roles, params);
  drawBarChart(rc, width - ledgerW - 12, height - 128, ledgerW, 96, rates, roles, params);

  caption(ctx, 12, height - 12, "click a node to toggle it, drawing a custom boundary", theme, {
    size: 9.5, color: theme.inkSoft,
  });
  vignette(ctx, width, height, 0.1);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const HOUR_S = 3600;

const BASE_SETUP: ParamValues = {
  boundaryPreset: "campus", timeOfDay: 12 * HOUR_S, solarOutput: 42000, enrolment: 520,
  irrigation: 12, composting: true, showCrossingsOnly: false, aggregationWindow: "day",
  showWater: true, showElectricity: true, showFood: true, showWaste: true, showPeople: true,
};

export const whereYouDrawTheLineSim: SimManifest<State> = {
  id: "g6.a2-1",
  title: "Where You Draw the Line",
  tagline: "Drag a boundary across a working school campus and watch the same 26 flows change column without a single rate moving.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS3-3"] },
  learningGoals: [
    "Classify a flow as an input, an output or an internal transfer from where the boundary sits, not from what the flow is.",
    "Show that moving a boundary reclassifies flows without changing any flow's rate.",
    "Choose a boundary size and explain what it swallows into 'internal'.",
  ],
  misconceptions: [
    "A system boundary is a real wall found in the world",
    "Whether something is an input depends on the thing, not on the line drawn around it",
    "A bigger boundary always has more crossings",
    "Moving the boundary changes how much is actually flowing",
  ],
  interactionHint: "Switch boundary presets, or pick Custom and click nodes to draw your own line.",
  tickRate: 30,
  timeScale: 1,
  params: {
    boundaryPreset: {
      type: "option", label: "Boundary preset",
      options: [
        { value: "campus", label: "Whole campus" },
        { value: "cafeteria", label: "Cafeteria only" },
        { value: "buildings", label: "Buildings only" },
        { value: "campusPlusBuses", label: "Campus plus buses and supplier" },
        { value: "custom", label: "Custom (click nodes)" },
      ],
      default: "campus",
      help: "Jumps the boundary to a saved shape, or lets you build your own by clicking nodes.",
    },
    timeOfDay: {
      type: "number", label: "Time of day", kind: "time", unit: "h",
      min: 6 * HOUR_S, max: 18 * HOUR_S, step: 15 * 60, default: 12 * HOUR_S,
      help: "Scrub the school day. Every flow rate follows its own schedule.",
    },
    solarOutput: {
      type: "number", label: "Solar output (peak)", kind: "power", unit: "kW",
      min: 0, max: 60000, step: 1000, default: 42000,
      help: "Rooftop generation at solar noon. Can turn grid import into export.",
    },
    enrolment: {
      type: "number", label: "Enrolment", kind: "population",
      min: 200, max: 900, step: 10, default: 520,
      help: "Scales water use, food, waste and bus and walk-in trips together.",
    },
    irrigation: {
      type: "number", label: "Irrigation (m³/day)", kind: "ratio",
      min: 0, max: 40, step: 1, default: 12,
      help: "Water sent to the field and garden instead of the sewer.",
    },
    composting: {
      type: "boolean", label: "Composting", default: true,
      help: "On sends kitchen scraps to the garden; off sends them to the trash bins.",
    },
    showCrossingsOnly: {
      type: "boolean", label: "Show crossings only", default: false,
      help: "Hides internal ribbons so only boundary crossings remain visible.",
    },
    aggregationWindow: {
      type: "option", label: "Aggregation window",
      options: [
        { value: "minute", label: "Per minute" },
        { value: "day", label: "Per day" },
        { value: "year", label: "Per school year" },
      ],
      default: "day",
      help: "Units the ledger reports every flow in (180 school days per year).",
    },
    showWater: { type: "boolean", label: "Show water", default: true, bands: ["6-8", "9-12"] },
    showElectricity: { type: "boolean", label: "Show electricity", default: true, bands: ["6-8", "9-12"] },
    showFood: { type: "boolean", label: "Show food", default: true, bands: ["6-8", "9-12"] },
    showWaste: { type: "boolean", label: "Show waste", default: true, bands: ["6-8", "9-12"] },
    showPeople: { type: "boolean", label: "Show people", default: true, bands: ["6-8", "9-12"] },
  },
  model,
  render,
  labs: [
    {
      id: "whole-campus",
      title: "The whole campus",
      question: "List every input and every output. How many flows cross the line, and how many are purely internal?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Before you count anything: the boundary is the whole campus, all 26 flows tracked.",
          predict: {
            prompt: "Of the 26 tracked flows, about how many are purely internal (never touching the line)?",
            options: ["Fewer than 5", "Between 8 and 14", "More than 22"],
            correct: 1,
            reveal: "8 are internal — mostly solar power feeding the buildings it sits among, and waste moving between the kitchen, garden and bins. The other 18 all cross the line one way or the other.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the setup",
          instruction: "Check the boundary reads 'campus' and the clock is near midday.",
          requireData: 1,
          check: {
            describe: "Whole-campus boundary at midday",
            test: (v) => v.params.boundaryPreset === "campus" && Math.abs((v.facts.hour as number) - 12) < 1.5,
          },
        },
        {
          id: "count",
          phase: "measure",
          title: "Count the columns",
          instruction: "Record the inputs, outputs and internal-transfer counts from the ledger.",
          requireData: 2,
          check: {
            describe: "Counts recorded for the campus boundary",
            test: (v) => (v.facts.inputsCount as number) + (v.facts.outputsCount as number) + (v.facts.internalCount as number) === 26,
          },
          hints: ["Every one of the 26 edges lands in exactly one of the three columns here — none are 'outside' when the boundary is the whole site."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name two of each",
          instruction: "Pick two internal transfers and two inputs from the ledger.",
          write: {
            prompt: "Name two flows that stay internal at this boundary, and two that are inputs. What do the two internal ones have in common?",
            placeholder: "Internal: ... and ... , both start and end on-site. Input: ... and ... , which start off-site.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write the classification rule in your own words.",
          write: {
            prompt: "Finish the rule: a flow is internal when ___; it is an input when ___.",
            placeholder: "A flow is internal when both its ends are ___. It is an input when ___.",
          },
        },
      ],
    },
    {
      id: "just-the-cafeteria",
      title: "Just the cafeteria",
      question: "The compost ribbon was internal a moment ago. Which column is it in now, and what physically changed?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP, boundaryPreset: "cafeteria", composting: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the flip",
          instruction: "Under the whole campus, scraps-to-compost (cafeteria to garden) was internal.",
          predict: {
            prompt: "Shrink the boundary to the cafeteria alone. What does the compost flow become?",
            options: ["Still internal", "An output — the garden is now outside the line", "An input"],
            correct: 1,
            reveal: "An output. The garden is no longer inside anything, so the same scraps, moving the same way, now cross the line outward.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the boundary",
          instruction: "Check the boundary preset reads 'Cafeteria only'.",
          requireData: 1,
          check: { describe: "Cafeteria-only boundary", test: (v) => v.params.boundaryPreset === "cafeteria" },
        },
        {
          id: "check-role",
          phase: "measure",
          title: "Read the compost row",
          instruction: "Find the compost flow in the ledger and record which column it sits in.",
          requireData: 2,
          check: {
            describe: "Compost flow now reads as an output",
            test: (v) => v.facts.role_wasteCompost === "output",
          },
          hints: ["It is the waste-carrier flow running from the kitchen to the garden."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Nothing left, nothing arrived",
          instruction: "Compare the internal-transfer count here with the whole-campus count.",
          check: {
            describe: "No internal transfers remain with only the cafeteria inside",
            test: (v) => v.facts.internalCount === 0,
          },
          write: {
            prompt: "With only the cafeteria inside the line, why can nothing be classified as internal any more?",
            placeholder: "Internal needs both ends inside. With one building inside, ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What actually changed",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "The compost flow moved from internal to output. What physically changed about the scraps themselves?",
            placeholder: "Nothing about the scraps changed. What changed was ...",
          },
        },
      ],
    },
    {
      id: "solar-left-outside",
      title: "Solar left outside",
      question: "The array is 8 m away, on the gym roof, outside the line. Why does the ledger now show electricity as an input?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP, boundaryPreset: "buildings", solarOutput: 42000 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the reclassification",
          instruction: "The 'Buildings only' preset draws the line around the classrooms, kitchen and washrooms — not the standalone solar roof.",
          predict: {
            prompt: "Under this boundary, is solar power to the classrooms input, output or internal?",
            options: ["Still internal — it's the same campus", "An input — the array is now outside the line", "An output"],
            correct: 1,
            reveal: "An input. The panel never moved; the line moved. Power now arrives from a source the boundary places outside it.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the boundary",
          instruction: "Check the preset reads 'Buildings only'.",
          requireData: 1,
          check: { describe: "Buildings-only boundary", test: (v) => v.params.boundaryPreset === "buildings" },
        },
        {
          id: "check-role",
          phase: "measure",
          title: "Read both solar rows",
          instruction: "Find solar-to-classrooms and solar-to-kitchen in the ledger.",
          requireData: 2,
          check: {
            describe: "Both solar flows now read as inputs",
            test: (v) => v.facts.role_elecSolarClass === "input" && v.facts.role_elecSolarCafe === "input",
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare with the whole campus",
          instruction: "Switch back to 'Whole campus' and note the same two flows' column, then return to 'Buildings only'.",
          write: {
            prompt: "Under the whole campus, are the solar flows internal or crossing? What is the only thing different between the two boundaries?",
            placeholder: "Under the whole campus they are ..., because the array is ... . Only the ... moved.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "The eight metres",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "Why does an array that never moved switch from internal to input just because the line moved eight metres?",
            placeholder: "The panel's output did not change. What changed was ...",
          },
        },
      ],
    },
    {
      id: "draw-it-wide",
      title: "Draw it wide",
      question: "Bus diesel and the supplier depot are now inside. Does the total crossing count go up or down, and why?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP, boundaryPreset: "campusPlusBuses", aggregationWindow: "year" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the total",
          instruction: "The boundary grows to swallow the homes buses start from and the food supplier.",
          predict: {
            prompt: "Does the TOTAL number of crossings (inputs plus outputs) go up, down, or stay the same?",
            options: ["Up", "Down", "Stays exactly the same"],
            correct: 1,
            reveal: "Down. Five flows that used to cross the old line — the bus and walk-in people flows, and the food truck — now start and end inside the bigger one, so they become internal instead.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the wide boundary",
          instruction: "Check the preset reads 'Campus plus buses and supplier'.",
          requireData: 1,
          check: { describe: "Wide boundary selected", test: (v) => v.params.boundaryPreset === "campusPlusBuses" },
        },
        {
          id: "count",
          phase: "measure",
          title: "Count crossings",
          instruction: "Record inputs + outputs here, then compare with the 18 you counted for the whole campus.",
          requireData: 2,
          check: {
            describe: "Crossing count has fallen below 18",
            test: (v) => (v.facts.crossingCount as number) < 18,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name what moved column",
          instruction: "Check the food-truck flow and one bus flow.",
          check: {
            describe: "The food truck and a bus flow both now read internal",
            test: (v) => v.facts.role_foodTruck === "internal" && v.facts.role_peopleBusIn === "internal",
          },
          write: {
            prompt: "Name the five flows that became internal when the boundary widened.",
            placeholder: "The food truck delivery, and four of the six people flows: ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the general rule",
          instruction: "Generalise beyond this one campus.",
          write: {
            prompt: "Write a rule linking boundary size to the number of crossings, for any system at all.",
            placeholder: "The bigger the boundary grows, the ... its number of crossings, because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "eight-or-fewer",
      title: "Eight crossings or fewer",
      brief: "Find a preset or a custom boundary that leaves eight or fewer total crossings, with at least three internal transfers.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Crossings ≤ 8 with at least 3 internal transfers",
        test: (v) => (v.facts.crossingCount as number) <= 8 && (v.facts.internalCount as number) >= 3,
      },
      stars: {
        two: {
          describe: "Also using the Custom boundary tool, not a saved preset",
          test: (v) => (v.facts.crossingCount as number) <= 8 && (v.facts.internalCount as number) >= 3 && v.params.boundaryPreset === "custom",
        },
        three: {
          describe: "And at least 6 internal transfers",
          test: (v) => (v.facts.crossingCount as number) <= 8 && (v.facts.internalCount as number) >= 6,
        },
      },
      hints: [
        "A boundary around a single small building has few crossings but also few internal transfers — try folding in a neighbour.",
        "Two buildings that trade heavily with each other and lightly with the outside is the shape you want.",
      ],
    },
    {
      id: "water-goes-internal",
      title: "Make water internal",
      brief: "Draw a custom boundary in which at least one water flow is classified internal rather than input or output.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, boundaryPreset: "custom" },
      goal: {
        describe: "A water-carrier flow reads internal",
        test: (v) =>
          v.facts.role_waterWash === "internal" || v.facts.role_waterKitchen === "internal" ||
          v.facts.role_waterField === "internal" || v.facts.role_waterGarden === "internal" ||
          v.facts.role_waterWashOut === "internal" || v.facts.role_waterKitchenOut === "internal",
      },
      hints: [
        "Internal needs BOTH ends of the flow inside your line — even an off-site utility node.",
        "Click the water main itself, plus whatever it feeds, into your custom boundary.",
      ],
    },
  ],
};
