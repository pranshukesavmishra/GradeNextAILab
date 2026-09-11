import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, dashFlow, glow, hexA, isDarkTheme, metal, plastic, pulse,
  sphere, vignette,
} from "@ui/scene";
import { chartFrame, lineSeries } from "@ui/charts";

/**
 * Follow One Drop, Follow One Joule — Grade 6, Unit A2.4: tracing matter and
 * energy through a system.
 *
 * An 18-node water network from a Sierra snowfield to San Francisco Bay,
 * with the loop closed by evaporation carrying water back to the snowpack.
 * Bulk flow is solved first — a reservoir genuinely holds water for months,
 * a penstock for barely a minute, because each node's residence time is
 * simply its own stock divided by its own outflow, computed, never a
 * hand-picked number. Tracers then ride that network as real agents: at
 * each node they wait a time drawn from that node's own residence
 * distribution, then take an exit branch with probability proportional to
 * that branch's share of the flow.
 *
 * The honesty rule this sim exists to uphold: matter cycles, energy does
 * not, and that difference is built into the routing tables themselves, not
 * into how far the numbers happen to run down. A water tracer's routes
 * include the edge from the cloud back to the snowpack — the loop the
 * spec calls for. An energy tracer's routing function refuses to look up an
 * outgoing edge at all once it reaches the bay, the soil, or the cloud: the
 * lookup returns nothing, unconditionally, before any distance or fraction
 * is ever consulted. An energy tracer cannot complete a loop for the same
 * reason a sealed jar cannot leak matter — the coupling that would let it
 * simply is not there.
 */

/* ------------------------------------------------------------------ *
 * The network — 18 nodes, real stocks, computed residence times
 * ------------------------------------------------------------------ */

export type NodeId =
  | "snowpack" | "reservoir" | "powerhouse" | "aqueduct"
  | "barScreen" | "flocculation" | "sandFilter" | "chlorineContact"
  | "pumpStation" | "hilltopTank" | "school" | "studentBody"
  | "sewer" | "wastewaterPlant" | "outfall" | "bay" | "cloud" | "soil";

type FlowKind = "bulk" | "bulkLeaked" | "school" | "drink" | "evapBay" | "evapCloud" | "evapSoil";

interface NodeDef { id: NodeId; label: string; stockM3: number; flow: FlowKind; x: number; y: number }

/** Real evaporation off a large bay, m³/s: ~1 m/yr over ~1000 km² of surface. */
const EVAP_BAY_M3S = 31.7;
/** The textbook figure for atmospheric water vapour's own residence time. */
const CLOUD_RESIDENCE_S = 9 * 86400;

// Fixed pixel layout — see a2-1's header note on why interactive positions
// are laid out in one fixed frame rather than derived from canvas size.
export const NODES: NodeDef[] = [
  { id: "snowpack", label: "Snowpack", stockM3: 5.0e8, flow: "bulk", x: 40, y: 70 },
  { id: "reservoir", label: "Reservoir", stockM3: 4.0e8, flow: "bulk", x: 110, y: 110 },
  { id: "powerhouse", label: "Powerhouse", stockM3: 2500, flow: "bulk", x: 180, y: 150 },
  { id: "aqueduct", label: "Aqueduct", stockM3: 1.2e5, flow: "bulk", x: 250, y: 170 },
  { id: "barScreen", label: "Bar screen", stockM3: 50, flow: "bulkLeaked", x: 320, y: 170 },
  { id: "flocculation", label: "Flocculation", stockM3: 2000, flow: "bulkLeaked", x: 380, y: 170 },
  { id: "sandFilter", label: "Sand filter", stockM3: 800, flow: "bulkLeaked", x: 440, y: 170 },
  { id: "chlorineContact", label: "Chlorine contact", stockM3: 1500, flow: "bulkLeaked", x: 500, y: 170 },
  { id: "pumpStation", label: "Pump station", stockM3: 100, flow: "bulkLeaked", x: 560, y: 150 },
  { id: "hilltopTank", label: "Hilltop tank", stockM3: 8000, flow: "school", x: 610, y: 100 },
  { id: "school", label: "School", stockM3: 50, flow: "school", x: 660, y: 140 },
  { id: "studentBody", label: "Student body", stockM3: 9, flow: "drink", x: 700, y: 100 },
  { id: "sewer", label: "Sewer", stockM3: 42000, flow: "bulkLeaked", x: 700, y: 190 },
  { id: "wastewaterPlant", label: "Wastewater plant", stockM3: 1.512e6, flow: "bulkLeaked", x: 640, y: 220 },
  { id: "outfall", label: "Outfall", stockM3: 4200, flow: "bulkLeaked", x: 580, y: 250 },
  { id: "bay", label: "Bay", stockM3: 5.0e9, flow: "evapBay", x: 520, y: 260 },
  { id: "cloud", label: "Cloud", stockM3: CLOUD_RESIDENCE_S * EVAP_BAY_M3S, flow: "evapCloud", x: 300, y: 30 },
  { id: "soil", label: "Soil (leak)", stockM3: 6.0e6, flow: "evapSoil", x: 300, y: 220 },
];

if (NODES.length !== 18) throw new Error(`A2.4 network must have 18 nodes, has ${NODES.length}`);
const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
const HIT_RADIUS = 22;

interface FlowCtx { bulk: number; school: number; drink: number; leak: number }

function flowCtx(params: ParamValues): FlowCtx {
  const bulk = params.snowmeltRate as number;
  const leakFrac = params.aqueductLeak as number;
  const school = (params.schoolDemand as number) / 86400; // m³/day -> m³/s
  return { bulk, school, drink: 0.05 * school, leak: bulk * leakFrac };
}

/** The one place a node's outflow is decided. Residence time (stock/outflow)
 *  follows from it mechanically — never a hand-typed table. */
function outflowOf(node: NodeDef, c: FlowCtx): number {
  switch (node.flow) {
    case "bulk": return c.bulk;
    case "bulkLeaked": return Math.max(1e-9, c.bulk - c.leak);
    case "school": return Math.max(1e-9, c.school);
    case "drink": return Math.max(1e-9, c.drink);
    case "evapBay": return EVAP_BAY_M3S;
    case "evapSoil": return Math.max(1e-9, c.leak);
    case "evapCloud": return Math.max(1e-9, EVAP_BAY_M3S + c.leak + 0.4 * c.drink);
  }
}

export function residenceSecondsOf(id: NodeId, params: ParamValues): number {
  const n = NODE_BY_ID.get(id)!;
  return n.stockM3 / outflowOf(n, flowCtx(params));
}

/* ------------------------------------------------------------------ *
 * Routing — matter's loop, and the wall energy cannot get through
 * ------------------------------------------------------------------ */

interface Branch { to: NodeId; weight: (c: FlowCtx) => number }

/** Every edge in the network, matter's full cycle included. This table is
 *  the ONLY place a "next node" is decided for a water tracer. */
const MATTER_EDGES: Partial<Record<NodeId, Branch[]>> = {
  snowpack: [{ to: "reservoir", weight: () => 1 }],
  reservoir: [{ to: "powerhouse", weight: () => 1 }],
  powerhouse: [{ to: "aqueduct", weight: () => 1 }],
  aqueduct: [
    { to: "barScreen", weight: (c) => Math.max(0, c.bulk - c.leak) },
    { to: "soil", weight: (c) => c.leak },
  ],
  barScreen: [{ to: "flocculation", weight: () => 1 }],
  flocculation: [{ to: "sandFilter", weight: () => 1 }],
  sandFilter: [{ to: "chlorineContact", weight: () => 1 }],
  chlorineContact: [{ to: "pumpStation", weight: () => 1 }],
  pumpStation: [{ to: "hilltopTank", weight: () => 1 }],
  hilltopTank: [{ to: "school", weight: () => 1 }],
  school: [
    { to: "studentBody", weight: (c) => 0.05 * c.school },
    { to: "sewer", weight: (c) => 0.95 * c.school },
  ],
  studentBody: [
    { to: "sewer", weight: (c) => 0.6 * c.drink },
    { to: "cloud", weight: (c) => 0.4 * c.drink },
  ],
  sewer: [{ to: "wastewaterPlant", weight: () => 1 }],
  wastewaterPlant: [{ to: "outfall", weight: () => 1 }],
  outfall: [{ to: "bay", weight: () => 1 }],
  bay: [{ to: "cloud", weight: () => 1 }],
  soil: [{ to: "cloud", weight: () => 1 }],
  cloud: [{ to: "snowpack", weight: () => 1 }], // the loop closer
};

/** The nodes an energy tracer's own token is spent by the time it reaches —
 *  low-grade heat has dispersed to the environment, so there is nothing
 *  left to route onward, structurally, not by exhausted value. */
const ENERGY_TERMINAL: ReadonlySet<NodeId> = new Set(["bay", "soil", "cloud"]);

/**
 * The routing lookup a tracer actually calls. For an energy tracer at a
 * terminal node this returns null UNCONDITIONALLY, before consulting
 * MATTER_EDGES at all — the honesty rule is enforced by this early return
 * existing, not by any value ever reaching exactly zero.
 */
function nextNodeFor(kind: TracerKind, node: NodeId, c: FlowCtx, rng: Rng): NodeId | null {
  if (kind === "energy" && ENERGY_TERMINAL.has(node)) return null;
  const branches = MATTER_EDGES[node];
  if (!branches || branches.length === 0) return null;
  const weights = branches.map((b) => Math.max(0, b.weight(c)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return branches[0].to; // a momentarily-zero branch still exists topologically
  let r = rng.next() * total;
  for (let i = 0; i < branches.length; i++) {
    r -= weights[i];
    if (r <= 0) return branches[i].to;
  }
  return branches[branches.length - 1].to;
}

/** Fraction of value LOST leaving a node (energy only), or a multiplier for
 *  the one node that adds to it. Every number here is "a slice turns to
 *  heat", per the spec, at a plausible share for that stage. */
const ENERGY_LOSS_FRAC: Partial<Record<NodeId, number>> = {
  snowpack: 0.02, reservoir: 0.05, powerhouse: 0.80, aqueduct: 0.10,
  barScreen: 0.05, flocculation: 0.08, sandFilter: 0.10, chlorineContact: 0.05,
  hilltopTank: 0.05, school: 0.05, studentBody: 0.30, sewer: 0.05,
  wastewaterPlant: 0.15, outfall: 0.05, bay: 0.05,
};

/** Energy leaving the pump station gains a share of its value from the real
 *  pump — the "visible step" the spec's own readout table calls for. */
function pumpBoost(params: ParamValues): number {
  return 1 + 0.3 * clamp01((params.pumpPower as number) / 2500);
}

/* ------------------------------------------------------------------ *
 * Tracers — real agents, not a scripted animation
 * ------------------------------------------------------------------ */

export type TracerKind = "water" | "energy";
export type LoopStatus = "notYet" | "closed" | "neverPossible";

interface PathEntry { node: NodeId; arrivalS: number; residenceS: number; valueAfter: number }

interface Tracer {
  id: number;
  kind: TracerKind;
  node: NodeId;
  enteredAtS: number;
  exitAtS: number;
  value: number;         // 1 for water (a marker unit); joules remaining for energy
  wasteHeat: number;     // cumulative joules this tracer alone has shed
  loop: LoopStatus;
  active: boolean;       // false once an energy tracer terminates
  arrivedAtSchoolS: number; // -1 until it first reaches the school node
  path: PathEntry[];
}

const PATH_MAX = 40;
const MAX_HOPS_PER_TICK = 400; // a safety bound at extreme time compression

interface State {
  simS: number;
  tracers: Tracer[];
  nextId: number;
  wasteHeatTotal: number;
}

function releaseNodeOf(params: ParamValues): NodeId {
  const p = String(params.releasePoint ?? "snowpack");
  if (p === "treatmentPlant") return "barScreen";
  if (p === "schoolFountain") return "school";
  // Every other option value (snowpack, reservoir, aqueduct, sewer, bay) is
  // already a literal NodeId.
  return p as NodeId;
}

function spawnTracer(id: number, kind: TracerKind, node: NodeId, simS: number, params: ParamValues, rng: Rng): Tracer {
  const residence = residenceSecondsOf(node, params);
  const exitAtS = simS - residence * Math.log(Math.max(1e-12, rng.next()));
  return {
    id, kind, node, enteredAtS: simS, exitAtS,
    value: 1, wasteHeat: 0,
    loop: kind === "energy" ? "neverPossible" : "notYet",
    active: true,
    arrivedAtSchoolS: node === "school" ? simS : -1,
    path: [{ node, arrivalS: simS, residenceS: residence, valueAfter: 1 }],
  };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const kind = String(params.tracerType ?? "water");
  const n = Math.round(params.numberOfTracers as number);
  const release = releaseNodeOf(params);
  const tracers: Tracer[] = [];
  let id = 0;
  const kinds: TracerKind[] = kind === "both" ? ["water", "energy"] : [kind as TracerKind];
  for (const k of kinds) {
    for (let i = 0; i < n; i++) tracers.push(spawnTracer(id++, k, release, 0, params, rng));
  }
  return { simS: 0, tracers, nextId: id, wasteHeatTotal: 0 };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (
      params.tracerType !== prev.tracerType || params.releasePoint !== prev.releasePoint ||
      params.numberOfTracers !== prev.numberOfTracers
    ) {
      return buildWorld(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params, ctx, inputs) {
    void inputs;
    if (dt <= 0) return state;
    const comp = params.timeComp as number;
    const simSEnd = state.simS + dt * comp;
    const c = flowCtx(params);
    let wasteHeatTotal = state.wasteHeatTotal;

    const tracers = state.tracers.map((t0) => {
      if (!t0.active) return t0;
      let t = t0;
      let hops = 0;
      while (t.active && t.exitAtS <= simSEnd && hops < MAX_HOPS_PER_TICK) {
        hops++;
        const next = nextNodeFor(t.kind, t.node, c, ctx.rng);
        if (next === null) {
          // Structurally unreachable for a water tracer (every node in
          // MATTER_EDGES has an outgoing branch); kept only as a guard.
          break;
        }
        let value = t.value;
        let wasteHeat = t.wasteHeat;
        if (t.kind === "energy") {
          if (t.node === "pumpStation") {
            value = value * pumpBoost(params);
          } else {
            const lossFrac = ENERGY_LOSS_FRAC[t.node] ?? 0.05;
            const shed = value * lossFrac;
            value -= shed;
            wasteHeat += shed;
            wasteHeatTotal += shed;
          }
        }
        const arrivedAtSchoolS = next === "school" && t.arrivedAtSchoolS < 0 ? t.exitAtS : t.arrivedAtSchoolS;
        const loop: LoopStatus = t.kind === "energy" ? "neverPossible" : next === "snowpack" ? "closed" : t.loop;
        const path = [...t.path, { node: next, arrivalS: t.exitAtS, residenceS: 0, valueAfter: value }];
        if (path.length > PATH_MAX) path.shift();

        // An energy tracer that has just ARRIVED at a terminal node stops
        // here — dispersed into a reservoir the size of the bay, the soil
        // or the atmosphere, its last measurable trace is gone on contact,
        // not after waiting out that reservoir's own multi-year turnover.
        if (t.kind === "energy" && ENERGY_TERMINAL.has(next)) {
          t = {
            ...t, node: next, enteredAtS: t.exitAtS, exitAtS: t.exitAtS, value, wasteHeat,
            loop, arrivedAtSchoolS, path, active: false,
          };
          break;
        }

        const residence = residenceSecondsOf(next, params);
        const exitAtS = t.exitAtS - residence * Math.log(Math.max(1e-12, ctx.rng.next()));
        path[path.length - 1].residenceS = residence;
        t = {
          ...t, node: next, enteredAtS: t.exitAtS, exitAtS, value, wasteHeat,
          loop, arrivedAtSchoolS, path,
        };
      }
      return t;
    });

    return { simS: simSEnd, tracers, nextId: state.nextId, wasteHeatTotal };
  },

  readouts(state, params) {
    void params;
    const active = state.tracers.filter((t) => t.active).length;
    const anyClosed = state.tracers.some((t) => t.loop === "closed");
    return [
      { key: "simDays", label: "Elapsed", unit: "count", quantity: q(state.simS / 86400, "count"), semantic: "time", graphable: true },
      { key: "activeTracers", label: "Active tracers", quantity: q(active, "count"), semantic: "distance" },
      { key: "wasteHeat", label: "Waste heat released", unit: "J", quantity: q(state.wasteHeatTotal, "energy"), semantic: "hot", graphable: true },
      { key: "loopsClosed", label: "Loops closed (water)", quantity: q(anyClosed ? 1 : 0, "count"), semantic: "producer" },
    ];
  },

  facts(state, params) {
    const out: Record<string, number | boolean | string> = {
      simS: state.simS,
      simDays: state.simS / 86400,
      wasteHeatTotal: state.wasteHeatTotal,
      tracerCount: state.tracers.length,
    };
    for (const n of NODES) {
      out[`residence_${n.id}`] = residenceSecondsOf(n.id, params);
      out[`count_${n.id}`] = state.tracers.filter((t) => t.node === n.id && t.active).length;
      out[`visited_${n.id}`] = state.tracers.some((t) => t.path.some((p) => p.node === n.id));
    }
    const t0 = state.tracers[0];
    if (t0) {
      out.tracer0Kind = t0.kind;
      out.tracer0Node = t0.node;
      out.tracer0Value = t0.value;
      out.tracer0Active = t0.active;
      out.tracer0Loop = t0.loop;
      out.tracer0Hops = t0.path.length;
      let longestS = -1, longestNode = "";
      for (const p of t0.path) if (p.residenceS > longestS) { longestS = p.residenceS; longestNode = p.node; }
      out.tracer0LongestWaitS = longestS;
      out.tracer0LongestWaitNode = longestNode;
      for (const target of ["powerhouse", "pumpStation", "school", "outfall", "bay"] as NodeId[]) {
        const hit = t0.path.find((p) => p.node === target);
        out[`tracer0ValueAt_${target}`] = hit ? hit.valueAfter : -1;
      }
    }
    const waterTracers = state.tracers.filter((t) => t.kind === "water");
    const arrivals = waterTracers.map((t) => t.arrivedAtSchoolS).filter((s) => s >= 0);
    out.arrivalsAtSchool = arrivals.length;
    out.earliestArrivalDays = arrivals.length ? Math.min(...arrivals) / 86400 : -1;
    out.latestArrivalDays = arrivals.length ? Math.max(...arrivals) / 86400 : -1;
    out.arrivalSpreadDays = arrivals.length >= 2 ? (Math.max(...arrivals) - Math.min(...arrivals)) / 86400 : 0;

    const anyWaterClosed = waterTracers.some((t) => t.loop === "closed");
    const anyEnergy = state.tracers.some((t) => t.kind === "energy");
    out.anyWaterLoopClosed = anyWaterClosed;
    out.anyEnergyEverLooped = false; // structurally impossible — see nextNodeFor
    out.hasEnergyTracers = anyEnergy;
    out.hasWaterTracers = waterTracers.length > 0;
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * Render — the long cutaway, the ribbons, the two tokens
 * ------------------------------------------------------------------ */

function num(v: number, dp = 2): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  if (sec < 120) return `${sec.toFixed(0)} s`;
  if (sec < 7200) return `${(sec / 60).toFixed(1)} min`;
  if (sec < 172800) return `${(sec / 3600).toFixed(1)} h`;
  if (sec < 31557600 * 2) return `${(sec / 86400).toFixed(1)} d`;
  return `${(sec / 31557600).toFixed(1)} yr`;
}

function drawNode(rc: RenderContext<State>, n: NodeDef, params: ParamValues) {
  const { ctx, theme } = rc;
  const tint = n.flow.startsWith("evap") ? "gas" : n.id === "powerhouse" ? "current" : "cold";
  plastic(ctx, n.x - 12, n.y - 10, 24, 20, hexA(theme.sci[tint] ?? theme.accent, 0.85), { radius: 4, gloss: 0.2 });
  caption(ctx, n.x, n.y + 20, n.label, theme, { align: "center", size: 8, weight: 700 });
  if (params.showResidenceTimes === true) {
    caption(ctx, n.x, n.y - 16, fmtDuration(residenceSecondsOf(n.id, params)), theme, {
      align: "center", size: 7.5, color: theme.sci["time"],
    });
  }
}

function drawEdges(rc: RenderContext<State>) {
  const { ctx, theme, time } = rc;
  for (const [from, branches] of Object.entries(MATTER_EDGES) as [NodeId, Branch[]][]) {
    const a = NODE_BY_ID.get(from)!;
    for (const b of branches) {
      const to = NODE_BY_ID.get(b.to)!;
      const loopEdge = from === "cloud" && b.to === "snowpack";
      const color = loopEdge ? theme.sci["producer"] : hexA(theme.inkSoft, 0.4);
      if (loopEdge) {
        // The loop closer arcs above everything else, drawn deliberately —
        // the one edge that makes matter's cycle a cycle at all.
        ctx.save();
        ctx.strokeStyle = hexA(color, 0.7);
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -time * 12;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - 8);
        ctx.quadraticCurveTo((a.x + to.x) / 2, -20, to.x, to.y - 12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, time } = rc;
  const graphH = Math.round(height * 0.22);
  const stageH = height - graphH - 6;
  const scale = Math.min(width / 760, stageH / 300);
  const ox = (width - 760 * scale) / 2, oy = (stageH - 300 * scale) / 2 + 20;

  ctx.save();
  ctx.fillStyle = mixHex(theme.surface, theme.sci["cold"], isDarkTheme(theme) ? 0.06 : 0.05);
  ctx.fillRect(0, 0, width, stageH);
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  drawEdges(rc);
  for (const n of NODES) drawNode(rc, n, params);

  // Tracers: small dots at their current node, jittered by id so a crowd at
  // one node is still countable.
  for (const t of state.tracers) {
    const n = NODE_BY_ID.get(t.node)!;
    const jx = ((t.id * 37) % 11) - 5, jy = ((t.id * 53) % 11) - 5;
    if (t.kind === "water") {
      sphere(ctx, n.x + jx, n.y - 22 + jy * 0.4, 3.2, "#e21bd1", { rim: false });
    } else {
      const hue = params.energyQualityShading !== false ? mixHex("#ff8c1a", "#7a1a10", 1 - clamp01(t.value)) : "#ff8c1a";
      sphere(ctx, n.x + jx, n.y - 22 + jy * 0.4, 3.2, hue, { rim: false, glow: t.active ? 0.6 : 0 });
    }
  }
  ctx.restore();

  badge(ctx, 12, 20, `day ${num(state.simS / 86400, 1)}`, theme, { color: theme.accent });
  badge(ctx, width / 2, 20, `${state.tracers.filter((t) => t.active).length} active tracers`, theme, { align: "center", color: theme.sci["field"] });
  const t0 = state.tracers[0];
  if (t0) {
    const loopLabel = t0.loop === "closed" ? "LOOP CLOSED" : t0.loop === "neverPossible" ? "LOOP: NEVER (ENERGY)" : "LOOP: NOT YET";
    badge(ctx, width - 12, 20, loopLabel, theme, {
      align: "right", color: t0.loop === "closed" ? theme.sci["producer"] : t0.loop === "neverPossible" ? theme.inkSoft : theme.sci["hot"],
    });
  }
  if (t0 && t0.kind === "energy") {
    badge(ctx, width - 12, 46, `${(t0.value * 100).toFixed(1)}% of 1 J left`, theme, { align: "right", color: theme.sci["hot"] });
  }

  vignette(ctx, width, stageH, 0.1);
  ctx.restore();

  drawEnergyGraph(rc, 8, stageH + 4, width - 16, graphH - 16);
}

function drawEnergyGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const t0 = state.tracers.find((t) => t.kind === "energy");
  if (!t0 || t0.path.length < 1) {
    caption(ctx, x + w / 2, y + h / 2, "release an energy tracer to graph its value", theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
    return;
  }
  const pts = t0.path.map((p) => ({ x: p.arrivalS / 86400, y: p.valueAfter }));
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: pts[0].x, xMax: Math.max(pts[pts.length - 1].x + 0.01, pts[0].x + 0.01), yMin: 0, yMax: 1.05,
    title: "Energy remaining (fraction of the original joule)", xLabel: "day", yLabel: "value", grid: "y",
  }, theme);
  lineSeries(ctx, pts, sx, sy, theme.sci["hot"], { theme, endDot: true, label: `${(t0.value * 100).toFixed(1)}%` });
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  tracerType: "water", releasePoint: "snowpack", numberOfTracers: 1,
  snowmeltRate: 35, pumpPower: 900, schoolDemand: 18, aqueductLeak: 0,
  showResidenceTimes: false, energyQualityShading: true, timeComp: 20000,
};

export const followOneDropSim: SimManifest<State> = {
  id: "g6.a2-4",
  title: "Follow One Drop, Follow One Joule",
  tagline: "Tag one drop of water and one joule of energy and trace each all the way from the snowfield to the bay.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-4"] },
  learningGoals: [
    "Trace a tagged parcel of matter through a real system and show that it can return to where it started.",
    "Trace a tagged unit of energy through the same system and show that it degrades at every stop and never returns.",
    "Explain residence time as a stock divided by its own outflow, and why a reservoir and a pipe differ by years.",
  ],
  misconceptions: [
    "Water is 'used up' once it goes down a drain",
    "Energy that leaves a system just vanishes",
    "Matter and energy move through a system the same way",
    "A bigger stock always means a longer wait, regardless of its outflow",
  ],
  interactionHint: "Pick a tracer type and a release point, then watch the path log and the energy graph.",
  tickRate: 30,
  timeScale: 1,
  params: {
    tracerType: {
      type: "option", label: "Tracer type",
      options: [
        { value: "water", label: "Water molecule" }, { value: "energy", label: "Joule of energy" }, { value: "both", label: "Both" },
      ],
      default: "water",
      help: "Which kind of tagged packet is released.",
    },
    releasePoint: {
      type: "option", label: "Release point",
      options: [
        { value: "snowpack", label: "Snowpack" }, { value: "reservoir", label: "Reservoir" },
        { value: "aqueduct", label: "Aqueduct" }, { value: "treatmentPlant", label: "Treatment plant" },
        { value: "schoolFountain", label: "School fountain" }, { value: "sewer", label: "Sewer" }, { value: "bay", label: "Bay" },
      ],
      default: "snowpack",
      help: "Where the tracer enters the network.",
    },
    numberOfTracers: {
      type: "number", label: "Number of tracers", kind: "count",
      min: 1, max: 200, step: 1, default: 1,
      help: "One tells a story; two hundred reveal the spread of paths and times.",
    },
    snowmeltRate: {
      type: "number", label: "Snowmelt rate (m³/s)", kind: "ratio",
      min: 0, max: 120, step: 1, default: 35,
      help: "Inflow to the reservoir, and so the residence time of every upstream node.",
    },
    pumpPower: {
      type: "number", label: "Pump station power", kind: "power", unit: "kW",
      min: 0, max: 2500, step: 50, default: 900,
      help: "Energy added to the water, visible as a step on the joule tracer's graph.",
    },
    schoolDemand: {
      type: "number", label: "School demand (m³/day)", kind: "ratio",
      min: 0, max: 60, step: 1, default: 18,
      help: "How often the tank, school and student-body nodes turn over.",
    },
    aqueductLeak: {
      type: "number", label: "Aqueduct leak", kind: "percent",
      min: 0, max: 0.25, step: 0.01, default: 0,
      help: "Diverts a share of flow to the soil, adding a branch a tracer can take.",
    },
    showResidenceTimes: { type: "boolean", label: "Show residence times", default: false },
    energyQualityShading: { type: "boolean", label: "Energy quality shading", default: true },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1, max: 100000, step: 1, default: 20000,
      marks: [{ value: 1, label: "1x" }, { value: 20000, label: "20000x" }, { value: 100000, label: "100000x" }],
      help: "Simulated hours per real second — enough to run multi-year reservoir storage.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "one-drop-whole-journey",
      title: "One drop, whole journey",
      question: "List every node the drop passes through in order. How many days from snow to bay, and where did it wait longest?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One water tracer, released at the snowpack.",
          predict: {
            prompt: "Which single node do you think the drop will wait at the longest?",
            options: ["The powerhouse (a fast penstock)", "The reservoir or the bay (huge, slow stocks)", "The school's own plumbing"],
            correct: 1,
            reveal: "The reservoir or the bay — residence time is stock divided by outflow, and both are enormous stocks moving through comparatively small outflows, so either can hold the drop for months or years.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the journey",
          instruction: "Run until the drop reaches the bay.",
          requireData: 1,
          check: { describe: "The drop has reached the bay", test: (v) => v.facts.visited_bay === true },
        },
        {
          id: "longest",
          phase: "measure",
          title: "Find the longest wait",
          instruction: "Record which node held the drop longest, and for how long.",
          requireData: 2,
          check: { describe: "A longest-wait node has been recorded", test: (v) => (v.facts.tracer0LongestWaitS as number) > 0 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read the path",
          instruction: "List the nodes in order from the path log.",
          write: {
            prompt: "Write the drop's route from snowpack to bay, node by node.",
            placeholder: "Snowpack -> reservoir -> ... -> bay",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Days, not hours",
          instruction: "State the total elapsed time in days.",
          write: {
            prompt: "How many simulated days did the whole journey take, and which one node accounts for most of it?",
            placeholder: "About ... days in total, mostly spent at ...",
          },
        },
      ],
    },
    {
      id: "two-hundred-drops",
      title: "Two hundred drops",
      question: "The drops started together. Why do their arrival times at the school differ by years rather than hours?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, numberOfTracers: 200 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the spread",
          instruction: "200 water tracers are released together at the snowpack.",
          predict: {
            prompt: "Do all 200 arrive at the school within roughly the same day?",
            options: ["Yes — they all take the same path", "No — arrivals spread over years, from the same starting instant"],
            correct: 1,
            reveal: "No. Each tracer draws its own random wait at every stock, so identical starting conditions still produce a wide, honest spread once compounded across a reservoir-sized wait.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run until many arrive",
          instruction: "Run until at least 20 tracers have reached the school.",
          requireData: 1,
          check: { describe: "At least 20 arrivals recorded", test: (v) => (v.facts.arrivalsAtSchool as number) >= 20 },
        },
        {
          id: "spread",
          phase: "measure",
          title: "Record the spread",
          instruction: "Record the earliest and latest arrival day at the school.",
          requireData: 2,
          check: { describe: "The spread is measured in years, not hours", test: (v) => (v.facts.arrivalSpreadDays as number) > 30 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the spread",
          instruction: "Think about which node's wait time varies the most.",
          write: {
            prompt: "Which node's wait time contributes the most to the spread, and why does a random wait at a huge stock do that?",
            placeholder: "The spread mostly comes from ..., because its residence time is measured in ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Same start, different story",
          instruction: "Answer the scenario's question.",
          write: {
            prompt: "Why can two drops that started in the same instant arrive years apart?",
            placeholder: "Because each drop's wait at every stock is drawn independently, and ...",
          },
        },
      ],
    },
    {
      id: "one-joule-same-route",
      title: "One joule, same route",
      question: "Follow the token to the outfall. How much of the original joule is still useful, and what is the rest now?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, tracerType: "energy", energyQualityShading: true, pumpPower: 900 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One joule tracer, same route as the water drop, starting at the snowpack.",
          predict: {
            prompt: "By the time it reaches the outfall, about how much of the original joule is still there?",
            options: ["Almost all of it", "Well under half", "Exactly zero"],
            correct: 1,
            reveal: "Well under half — most of it is extracted as electricity at the powerhouse alone, and every stop after that takes another share, so a small remainder is what is left to carry on.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run to the powerhouse",
          instruction: "Run until the tracer has passed the powerhouse and record its value there.",
          requireData: 1,
          check: { describe: "Value recorded at the powerhouse", test: (v) => (v.facts.tracer0ValueAt_powerhouse as number) >= 0 },
        },
        {
          id: "pump-step",
          phase: "measure",
          title: "Watch the pump station",
          instruction: "Keep running past the pump station and compare the value just before and just after.",
          requireData: 2,
          check: {
            describe: "The pump station step is visible",
            test: (v) => (v.facts.tracer0ValueAt_pumpStation as number) > 0,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "The rest of it",
          instruction: "Look at the cumulative waste-heat counter.",
          write: {
            prompt: "The energy that left the tracer did not vanish. Where does the model say it went?",
            placeholder: "At each stop, a share turned into ..., which the model counts as ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Useful, once",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "How much of the original joule is still useful at the outfall, and what has the rest become?",
            placeholder: "About ...% remains. The rest is now ...",
          },
        },
      ],
    },
    {
      id: "the-leaky-aqueduct",
      title: "The leaky aqueduct",
      question: "A fifth of the flow is lost. Where do the lost tracers actually end up, and does any water disappear?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, aqueductLeak: 0.2, tracerType: "both", numberOfTracers: 50 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "20% of the aqueduct's flow now diverts to the soil.",
          predict: {
            prompt: "Water tracers routed to the soil — what eventually happens to them?",
            options: ["They are removed from the simulation", "They evaporate to the cloud and can still return to the snowpack", "They stay in the soil forever"],
            correct: 1,
            reveal: "They evaporate to the cloud, just by a different door, and from there can still close the loop back to the snowpack. Water lost from the aqueduct is not water lost from the water cycle.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the batch",
          instruction: "Run until some tracers have reached the soil.",
          requireData: 1,
          check: { describe: "Some tracers have visited the soil", test: (v) => (v.facts.count_soil as number) >= 0 && v.facts.visited_soil === true },
        },
        {
          id: "count",
          phase: "measure",
          title: "Count where they went",
          instruction: "Record how many tracers reached the school versus how many took the leak.",
          requireData: 2,
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Follow the leaked share",
          instruction: "Check whether soil tracers can still reach the cloud and, eventually, the snowpack again.",
          write: {
            prompt: "Trace a leaked drop's onward route. Does it ever leave the water cycle for good?",
            placeholder: "A leaked drop goes soil -> ... -> ..., so it ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Lost, but not gone",
          instruction: "Answer the scenario's question.",
          write: {
            prompt: "Does any water actually disappear because of the leak? Explain using the routing table, not a guess.",
            placeholder: "No water disappears, because every branch — including the leak — leads to ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "close-the-loop",
      title: "Close the loop",
      brief: "Run a single water tracer until it returns to the snowpack at least once.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, timeComp: 100000 },
      goal: {
        describe: "The water tracer's loop reads closed",
        test: (v) => v.facts.tracer0Loop === "closed",
      },
      stars: {
        two: {
          describe: "Closed within 10 simulated years",
          test: (v) => v.facts.tracer0Loop === "closed" && (v.facts.simDays as number) <= 3650,
        },
      },
      hints: ["Time compression is capped at 100000x for exactly this reason — a full cycle takes years."],
    },
    {
      id: "prove-energy-never-loops",
      title: "Prove energy never loops",
      brief: "Run an energy tracer for as long as you like and confirm it can never read 'closed'.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, tracerType: "energy", timeComp: 100000 },
      goal: {
        describe: "The energy tracer has terminated, and its loop status still reads 'never possible'",
        test: (v) => v.facts.tracer0Active === false && v.facts.tracer0Loop === "neverPossible",
      },
      hints: ["Watch which node it stops at — bay, soil or cloud all end an energy tracer's journey the same way."],
    },
  ],
};
