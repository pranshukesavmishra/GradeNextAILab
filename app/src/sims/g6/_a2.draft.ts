import type {
  ParamValues, RenderContext, SimContext, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  badge, bevelRect, caption, clamp01, comet, contactShadow, dashFlow, easeInOut, glass,
  glow, gradientFill, groundPlane, hatchFill, hexA, innerGlow, isDarkTheme, labelLeader,
  lerp, material, metal, noiseWash, particleField, plastic, pulse, ribbon, rimLight, sky,
  softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 6 · Unit A · Topic A2 — Boundaries, inputs and outputs.
 *
 * Five simulations, one topic. A system is not a thing you find in the world;
 * it is a line you decide to draw around part of the world, and every input,
 * every output, and every "that's internal, ignore it" follows from where you
 * put that line. Move the line and nothing physical changes — but the answer
 * to the question you were asking changes completely.
 *
 *   A2.1  Drawing a system's boundary          → Boundary Drawer
 *   A2.2  Open vs closed systems               → Open, Closed or Isolated
 *   A2.3  Inputs and outputs                   → Input, Output, Inside
 *   A2.4  Tracing matter and energy            → Trace the Flow
 *   A2.5  Choosing a boundary for a purpose    → Where Do You Draw the Line
 *
 * Every number on screen is a value a student could look up: a 150 W LED grow
 * lamp, water's latent heat of vaporisation at 2.26 MJ/kg, petrol at 2392 g of
 * CO2 per litre burned, an average grid at 380 g CO2 per kWh.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

/** Fixed-decimal formatting. Nothing on a stage is ever a raw float. */
function fx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(dp);
}

/** Thousands separators for the big numbers (grams of CO2, kilometres). */
function group(v: number): string {
  const r = Math.round(v);
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface Rect { x: number; y: number; w: number; h: number }

function inflate(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 };
}

function unionRect(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function centerOf(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** A quadratic bend from a to b, sampled so a ribbon or a dash flow can use it. */
function curve(
  ax: number, ay: number, bx: number, by: number, bend: number, n = 22,
): { x: number; y: number }[] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({
      x: u * u * ax + 2 * u * t * cx + t * t * bx,
      y: u * u * ay + 2 * u * t * cy + t * t * by,
    });
  }
  return pts;
}

/** Where a sampled path first steps across a rectangle's edge. */
function crossingPoint(
  pts: { x: number; y: number }[], box: Rect,
): { x: number; y: number } | null {
  let was = inside(box, pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const now = inside(box, pts[i].x, pts[i].y);
    if (now !== was) {
      return { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 };
    }
    was = now;
  }
  return null;
}

/**
 * A badge placer that refuses to let two readouts overlap.
 *
 * Text laid over text is the fastest way to make a careful diagram look
 * careless, so every stage that puts more than two numbers down uses this.
 */
class BadgeField {
  private placed: Rect[] = [];

  /** Nudge a candidate box up and down in 13 px steps until it is clear. */
  place(x: number, y: number, w: number, h: number): { x: number; y: number } {
    for (let step = 0; step < 22; step++) {
      for (const dir of step === 0 ? [0] : [-1, 1]) {
        const cy = y + dir * step * 13;
        const box: Rect = { x: x - w / 2, y: cy - h / 2, w, h };
        if (!this.placed.some((p) => overlaps(p, box))) {
          this.placed.push(box);
          return { x, y: cy };
        }
      }
    }
    return { x, y };
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Semantic colour for a carrier. Matter is mass-coloured, energy is not. */
function carrierColor(theme: ThemeColors, tint: string): string {
  return theme.sci[tint] ?? theme.accent;
}

/** Saturation vapour pressure of water in kPa (Tetens, over liquid water). */
export function satVapourPressure(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

const KELVIN = 273.15;

/* ================================================================== *
 * A2.1 + A2.3 — Boundary Drawer
 *
 * A cutaway of a school with a rooftop greenhouse on it. The student slides
 * one boundary in and out through five real nesting levels — the tomato plant,
 * the grow bed, the greenhouse, the building, the grounds — and watches the
 * very same arrows change their names. Nothing about the water, the sunlight
 * or the tomatoes changes. Only the line does.
 *
 * The energy figures close: 700 W of sunlight through the glass plus 150 W of
 * mains power to the LED lamp is 850 W in, and 850 W leaves again through the
 * vent and the glass, because in steady state a greenhouse cannot store it.
 * The water figures close too: 12 L a day of rain in, 11.1 L out as vapour and
 * 0.9 L locked in the tomatoes that leave in a crate.
 * ================================================================== */

type Carrier = "matter" | "energy";

interface GhNode {
  key: string;
  /** Smallest boundary level that contains this part. 9 = never inside. */
  level: number;
}

const GH_NODES: Record<string, GhNode> = {
  plant: { key: "plant", level: 1 },
  bed: { key: "bed", level: 2 },
  tank: { key: "tank", level: 3 },
  lamp: { key: "lamp", level: 3 },
  shell: { key: "shell", level: 3 },
  kitchen: { key: "kitchen", level: 4 },
  compost: { key: "compost", level: 5 },
  sun: { key: "sun", level: 9 },
  cloud: { key: "cloud", level: 9 },
  mains: { key: "mains", level: 9 },
  air: { key: "air", level: 9 },
};

interface GhFlow {
  id: string;
  from: string;
  to: string;
  carrier: Carrier;
  label: string;
  /** Semantic palette key, so colour always means the same quantity. */
  tint: string;
  unit: string;
  /** How far the path bows, in pixels, so parallel flows stay apart. */
  bend: number;
  value: (lamp: boolean, fan: boolean) => number;
  live: (lamp: boolean, fan: boolean) => boolean;
}

/** Sunlight through greenhouse glass onto roughly 3 m2 of bed, in watts. */
const GH_SUN_W = 700;
/** A 150 W LED grow bar — the size a school greenhouse actually buys. */
const GH_LAMP_W = 150;
/** Warm air pushed out by the vent fan while it runs, in watts. */
const GH_VENT_W = 300;
/** Rain caught off the greenhouse roof into the tank, litres per day. */
const GH_RAIN_LPD = 12;
/** Transpiration from the tomato canopy, litres per day. */
const GH_VAPOUR_LPD = 11.1;
/** Tomatoes carried down to the school kitchen, kilograms per day. */
const GH_CROP_KGPD = 0.9;
/** Trimmings that go back out to the compost bin, kilograms per day. */
const GH_SCRAPS_KGPD = 0.25;

const GH_FLOWS: GhFlow[] = [
  {
    id: "sun", from: "sun", to: "plant", carrier: "energy", tint: "light",
    label: "sunlight", unit: "W", bend: 26,
    value: () => GH_SUN_W, live: () => true,
  },
  {
    id: "mains", from: "mains", to: "lamp", carrier: "energy", tint: "current",
    label: "mains power", unit: "W", bend: -34,
    value: () => GH_LAMP_W, live: (lamp) => lamp,
  },
  {
    id: "lamplight", from: "lamp", to: "plant", carrier: "energy", tint: "light",
    label: "grow light", unit: "W", bend: 8,
    value: () => GH_LAMP_W, live: (lamp) => lamp,
  },
  {
    id: "bedheat", from: "plant", to: "shell", carrier: "energy", tint: "energy-thermal",
    label: "heat off the bed", unit: "W", bend: -18,
    value: (lamp) => GH_SUN_W + (lamp ? GH_LAMP_W : 0), live: () => true,
  },
  {
    id: "glassheat", from: "shell", to: "air", carrier: "energy", tint: "energy-thermal",
    label: "heat through the glass", unit: "W", bend: 22,
    value: (lamp, fan) => GH_SUN_W + (lamp ? GH_LAMP_W : 0) - (fan ? GH_VENT_W : 0),
    live: () => true,
  },
  {
    id: "ventheat", from: "shell", to: "air", carrier: "energy", tint: "energy-thermal",
    label: "warm air out the vent", unit: "W", bend: -30,
    value: () => GH_VENT_W, live: (_l, fan) => fan,
  },
  {
    id: "rain", from: "cloud", to: "tank", carrier: "matter", tint: "liquid",
    label: "rainwater", unit: "L/day", bend: 30,
    value: () => GH_RAIN_LPD, live: () => true,
  },
  {
    id: "irrigation", from: "tank", to: "bed", carrier: "matter", tint: "liquid",
    label: "irrigation", unit: "L/day", bend: 16,
    value: () => GH_RAIN_LPD, live: () => true,
  },
  {
    id: "uptake", from: "bed", to: "plant", carrier: "matter", tint: "liquid",
    label: "water and minerals", unit: "L/day", bend: -10,
    value: () => GH_RAIN_LPD, live: () => true,
  },
  {
    id: "vapour", from: "plant", to: "shell", carrier: "matter", tint: "gas",
    label: "water vapour", unit: "L/day", bend: 14,
    value: () => GH_VAPOUR_LPD, live: (_l, fan) => fan,
  },
  {
    id: "humidout", from: "shell", to: "air", carrier: "matter", tint: "gas",
    label: "humid air out", unit: "L/day", bend: -8,
    value: () => GH_VAPOUR_LPD, live: (_l, fan) => fan,
  },
  {
    id: "condense", from: "plant", to: "bed", carrier: "matter", tint: "liquid",
    label: "condensation drips back", unit: "L/day", bend: 22,
    value: () => GH_VAPOUR_LPD, live: (_l, fan) => !fan,
  },
  {
    id: "crop", from: "plant", to: "kitchen", carrier: "matter", tint: "producer",
    label: "tomatoes", unit: "kg/day", bend: -26,
    value: () => GH_CROP_KGPD, live: () => true,
  },
  {
    id: "scraps", from: "kitchen", to: "compost", carrier: "matter", tint: "decomposer",
    label: "peelings", unit: "kg/day", bend: 18,
    value: () => GH_SCRAPS_KGPD, live: () => true,
  },
  {
    id: "compost", from: "compost", to: "bed", carrier: "matter", tint: "decomposer",
    label: "compost", unit: "kg/day", bend: -40,
    value: () => GH_SCRAPS_KGPD, live: () => true,
  },
];

const GH_LEVELS = [
  { value: "plant", level: 1, name: "The tomato plant" },
  { value: "bed", level: 2, name: "The grow bed" },
  { value: "greenhouse", level: 3, name: "The greenhouse" },
  { value: "building", level: 4, name: "The school building" },
  { value: "grounds", level: 5, name: "The school grounds" },
];

function ghLevel(params: ParamValues): number {
  return GH_LEVELS.find((l) => l.value === params.boundary)?.level ?? 3;
}

function ghLevelName(params: ParamValues): string {
  return GH_LEVELS.find((l) => l.value === params.boundary)?.name ?? "The greenhouse";
}

type FlowRole = "input" | "output" | "internal" | "outside";

function classify(flow: GhFlow, level: number): FlowRole {
  const a = GH_NODES[flow.from].level <= level;
  const b = GH_NODES[flow.to].level <= level;
  if (a && b) return "internal";
  if (!a && b) return "input";
  if (a && !b) return "output";
  return "outside";
}

interface GhTally {
  inputs: number; outputs: number; internal: number;
  energyIn: number; energyOut: number;
  waterIn: number; waterOut: number;
  massIn: number; massOut: number;
}

export function ghTally(params: ParamValues): GhTally {
  const level = ghLevel(params);
  const lamp = params.lamp !== false;
  const fan = params.fan !== false;
  const t: GhTally = {
    inputs: 0, outputs: 0, internal: 0,
    energyIn: 0, energyOut: 0, waterIn: 0, waterOut: 0, massIn: 0, massOut: 0,
  };
  for (const f of GH_FLOWS) {
    if (!f.live(lamp, fan)) continue;
    const role = classify(f, level);
    const v = f.value(lamp, fan);
    if (role === "internal") { t.internal++; continue; }
    if (role === "outside") continue;
    if (role === "input") {
      t.inputs++;
      if (f.carrier === "energy") t.energyIn += v;
      else if (f.unit === "L/day") t.waterIn += v;
      else t.massIn += v;
    } else {
      t.outputs++;
      if (f.carrier === "energy") t.energyOut += v;
      else if (f.unit === "L/day") t.waterOut += v;
      else t.massOut += v;
    }
  }
  return t;
}

interface Mote { x: number; y: number; vx: number; vy: number }

interface GhState {
  t: number;
  /** Dust motes drifting in the greenhouse light — seeded, never random. */
  motes: Mote[];
  /** Eased 0-1 progress of the boundary settling on a new level. */
  settle: number;
}

const ghModel: SimModel<GhState> = {
  init(_params, ctx) {
    const motes: Mote[] = [];
    for (let i = 0; i < 34; i++) {
      motes.push({
        x: ctx.rng.range(0, 1), y: ctx.rng.range(0, 1),
        vx: ctx.rng.range(-0.02, 0.02), vy: ctx.rng.range(-0.015, -0.003),
      });
    }
    return { t: 0, motes, settle: 1 };
  },

  applyParams(state, params, prev) {
    if (params.boundary !== prev.boundary) return { ...state, settle: 0 };
    return state;
  },

  step(state, dt) {
    const motes = state.motes.map((m) => {
      let x = m.x + m.vx * dt;
      let y = m.y + m.vy * dt;
      if (y < 0) y += 1;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      return { ...m, x, y };
    });
    return { t: state.t + dt, motes, settle: Math.min(1, state.settle + dt * 2.2) };
  },

  readouts(state, params) {
    const t = ghTally(params);
    return [
      { key: "inputs", label: "Inputs crossing in", quantity: q(t.inputs, "count"), semantic: "producer", graphable: true },
      { key: "outputs", label: "Outputs crossing out", quantity: q(t.outputs, "count"), semantic: "decomposer", graphable: true },
      { key: "internal", label: "Internal transfers", quantity: q(t.internal, "count"), semantic: "distance", graphable: true },
      { key: "energyIn", label: "Energy in (W)", quantity: q(t.energyIn, "ratio"), semantic: "light", graphable: true },
      { key: "energyOut", label: "Energy out (W)", quantity: q(t.energyOut, "ratio"), semantic: "energy-thermal", graphable: true },
      {
        key: "waterIn", label: "Water in (L/day)", quantity: q(t.waterIn, "ratio"),
        semantic: "liquid", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "waterOut", label: "Water out (L/day)", quantity: q(t.waterOut, "ratio"),
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "massOut", label: "Food out (kg/day)", quantity: q(t.massOut, "ratio"),
        semantic: "producer", graphable: false, bands: ["6-8", "9-12"],
      },
      { key: "level", label: "Boundary level", quantity: q(ghLevel(params), "count"), semantic: "distance", graphable: false },
      { key: "clock", label: "Time", quantity: q(state.t, "time"), unit: "s", semantic: "time", graphable: false, bands: ["9-12"] },
    ];
  },

  facts(state, params) {
    const t = ghTally(params);
    const level = ghLevel(params);
    return {
      boundary: String(params.boundary),
      boundaryLevel: level,
      boundaryName: ghLevelName(params),
      inputs: t.inputs,
      outputs: t.outputs,
      internal: t.internal,
      crossings: t.inputs + t.outputs,
      energyIn: t.energyIn,
      energyOut: t.energyOut,
      energyBalanced: Math.abs(t.energyIn - t.energyOut) < 1,
      waterIn: t.waterIn,
      waterOut: t.waterOut,
      matterOut: t.waterOut + t.massOut,
      closedToMatter: t.waterOut + t.massOut === 0 && t.waterIn === 0 && t.massIn === 0,
      noMatterLeaves: t.waterOut + t.massOut === 0,
      lampOn: params.lamp !== false,
      fanOn: params.fan !== false,
      settled: state.settle >= 1,
    };
  },
};

/* ---- layout -------------------------------------------------------- */

interface GhLayout {
  groundY: number;
  bldg: Rect; gh: Rect; bed: Rect; plant: Rect; tank: Rect; lampBar: Rect;
  kitchen: Rect; compost: Rect; grounds: Rect;
  anchor: Record<string, { x: number; y: number }>;
}

function ghLayout(w: number, h: number): GhLayout {
  const bldg: Rect = { x: w * 0.22, y: h * 0.46, w: w * 0.5, h: h * 0.42 };
  const gh: Rect = { x: w * 0.29, y: h * 0.18, w: w * 0.34, h: h * 0.28 };
  const bed: Rect = { x: gh.x + gh.w * 0.1, y: gh.y + gh.h * 0.66, w: gh.w * 0.52, h: gh.h * 0.2 };
  const plant: Rect = { x: bed.x + bed.w * 0.16, y: gh.y + gh.h * 0.26, w: bed.w * 0.66, h: gh.h * 0.42 };
  const tank: Rect = { x: gh.x + gh.w * 0.74, y: gh.y + gh.h * 0.5, w: gh.w * 0.17, h: gh.h * 0.36 };
  const lampBar: Rect = { x: bed.x + bed.w * 0.06, y: gh.y + gh.h * 0.14, w: bed.w * 0.8, h: h * 0.018 };
  const kitchen: Rect = { x: bldg.x + bldg.w * 0.1, y: bldg.y + bldg.h * 0.38, w: bldg.w * 0.42, h: bldg.h * 0.36 };
  const compost: Rect = { x: w * 0.79, y: h * 0.79, w: w * 0.09, h: h * 0.09 };
  const grounds: Rect = { x: w * 0.05, y: h * 0.145, w: w * 0.87, h: h * 0.79 };
  return {
    groundY: h * 0.88,
    bldg, gh, bed, plant, tank, lampBar, kitchen, compost, grounds,
    anchor: {
      plant: centerOf(plant),
      bed: centerOf(bed),
      tank: centerOf(tank),
      lamp: centerOf(lampBar),
      shell: { x: gh.x + gh.w * 0.5, y: gh.y + 7 },
      kitchen: centerOf(kitchen),
      compost: centerOf(compost),
      sun: { x: w * 0.1, y: h * 0.1 },
      cloud: { x: w * 0.76, y: h * 0.1 },
      mains: { x: w * 0.965, y: h * 0.32 },
      air: { x: w * 0.02, y: h * 0.4 },
    },
  };
}

function ghBoundaryRect(L: GhLayout, level: number): Rect {
  switch (level) {
    case 1: return inflate(L.plant, 9);
    case 2: return inflate(unionRect(L.bed, L.plant), 11);
    case 3: return inflate(L.gh, 7);
    case 4: return inflate(unionRect(L.gh, L.bldg), 9);
    default: return L.grounds;
  }
}

/* ---- the place ----------------------------------------------------- */

function ghDrawPlace(rc: RenderContext<GhState>, L: GhLayout) {
  const { ctx, theme, width, height, state, params } = rc;
  const t = state.t;
  const lampOn = params.lamp !== false;
  const fanOn = params.fan !== false;

  sky(ctx, width, height, theme, "day", L.groundY);
  groundPlane(ctx, L.groundY, 0, width, height, theme, "grass");

  /* sun */
  const sun = L.anchor.sun;
  glow(ctx, sun.x, sun.y, 74, theme.sci["light"], 0.45);
  sphere(ctx, sun.x, sun.y, 17, theme.sci["light"], { glow: 0.9 });

  /* rain cloud, drifting */
  const cl = L.anchor.cloud;
  const drift = Math.sin(t * 0.18) * 8;
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, isDarkTheme(theme) ? 0.5 : 0.32);
  for (const [ox, oy, r] of [[-24, 4, 15], [-2, -6, 20], [22, 3, 14], [8, 8, 13]] as const) {
    ctx.beginPath();
    ctx.arc(cl.x + ox + drift, cl.y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.6);
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const phase = (t * 60 + i * 19) % 46;
    const x = cl.x - 22 + i * 8 + drift;
    ctx.globalAlpha = 0.75 * (1 - phase / 46);
    ctx.beginPath();
    ctx.moveTo(x, cl.y + 16 + phase);
    ctx.lineTo(x - 1.5, cl.y + 24 + phase);
    ctx.stroke();
  }
  ctx.restore();

  /* the power pole feeding the lamp */
  const pole = L.anchor.mains;
  metal(ctx, pole.x - 4, pole.y - 26, 8, height * 0.56, theme.inkSoft, { radius: 2 });
  metal(ctx, pole.x - 22, pole.y - 26, 44, 6, theme.inkSoft, { radius: 2 });
  sphere(ctx, pole.x - 16, pole.y - 30, 3.4, theme.sci["current"]);
  sphere(ctx, pole.x + 16, pole.y - 30, 3.4, theme.sci["current"]);

  /* the building: a cutaway so the kitchen is visible */
  softShadow(ctx, () => {
    material(ctx, L.bldg.x, L.bldg.y, L.bldg.w, L.bldg.h, mixHex(theme.inkSoft, "#ffffff", 0.35), 4);
  }, { blur: 18, dy: 8, alpha: 0.3 });
  hatchFill(ctx, L.bldg.x, L.bldg.y, L.bldg.w, L.bldg.h, theme.inkSoft, { gap: 16, alpha: 0.1 });
  // roof slab the greenhouse stands on
  material(ctx, L.bldg.x - 8, L.bldg.y - 8, L.bldg.w + 16, 10, mixHex(theme.inkSoft, "#000000", 0.1), 3);

  // classroom windows
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const wx = L.bldg.x + L.bldg.w * (0.6 + c * 0.09);
      const wy = L.bldg.y + L.bldg.h * (0.12 + r * 0.3);
      glass(ctx, wx, wy, L.bldg.w * 0.06, L.bldg.h * 0.18, 2, theme, { tint: theme.sci["light"], alpha: 0.3 });
    }
  }

  // the kitchen, lit from inside
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["hot"], 0.14);
  roundRect(ctx, L.kitchen.x, L.kitchen.y, L.kitchen.w, L.kitchen.h, 4);
  ctx.fill();
  ctx.restore();
  bevelRect(ctx, L.kitchen.x, L.kitchen.y, L.kitchen.w, L.kitchen.h, 4,
    mixHex(theme.surfaceAlt, theme.sci["hot"], 0.12), { depth: -1 });
  // a bench and a stock pot
  material(ctx, L.kitchen.x + 8, L.kitchen.y + L.kitchen.h * 0.62, L.kitchen.w - 16, 5, theme.inkSoft, 2);
  metal(ctx, L.kitchen.x + L.kitchen.w * 0.5, L.kitchen.y + L.kitchen.h * 0.4,
    L.kitchen.w * 0.2, L.kitchen.h * 0.22, theme.inkSoft, { radius: 3 });

  /* the greenhouse shell */
  const g = L.gh;
  // interior wash first, then glass over it
  gradientFill(ctx, g.x, g.y, g.w, g.h, [
    hexA(theme.sci["light"], 0.16), hexA(theme.sci["producer"], 0.06),
  ], 90);

  // grow bed
  material(ctx, L.bed.x, L.bed.y, L.bed.w, L.bed.h, mixHex(theme.sci["decomposer"], "#000000", 0.15), 3);
  noiseWash(ctx, L.bed.x, L.bed.y, L.bed.w, L.bed.h, { alpha: 0.12, seed: 4, count: 90 });

  // the tomato plant: a stem that sways, three trusses of fruit
  const px = L.plant.x + L.plant.w * 0.5;
  const baseY = L.bed.y + 2;
  ctx.save();
  ctx.strokeStyle = theme.sci["producer"];
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, baseY);
  for (let i = 1; i <= 10; i++) {
    const f = i / 10;
    ctx.lineTo(px + Math.sin(t * 0.9 + f * 2.2) * f * 4, baseY - f * L.plant.h);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 7; i++) {
    const f = 0.15 + (i / 7) * 0.85;
    const side = i % 2 === 0 ? 1 : -1;
    const lx = px + Math.sin(t * 0.9 + f * 2.2) * f * 4 + side * (7 + f * L.plant.w * 0.36);
    const ly = baseY - f * L.plant.h;
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["producer"], 0.9);
    ctx.beginPath();
    ctx.ellipse(lx, ly, 9 + f * 5, 4.6, side * (0.32 + Math.sin(t + i) * 0.05), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    const f = 0.34 + i * 0.2;
    const fx2 = px + Math.sin(t * 0.9 + f * 2.2) * f * 4 + (i % 2 === 0 ? -1 : 1) * 9;
    sphere(ctx, fx2, baseY - f * L.plant.h + 6, 4.6, theme.sci["acceleration"]);
  }

  // water tank with a moving surface
  const tk = L.tank;
  const fill = tk.h * 0.62;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, tk.x + 2, tk.y + tk.h - fill, tk.w - 4, fill, 3);
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.75);
  ctx.fill();
  ctx.restore();
  glass(ctx, tk.x, tk.y, tk.w, tk.h, 4, theme, { tint: theme.sci["liquid"] });

  // LED grow bar
  const lb = L.lampBar;
  if (lampOn) {
    glow(ctx, lb.x + lb.w / 2, lb.y + lb.h, lb.w * 0.62, theme.sci["light"], 0.34 + 0.05 * pulse(t, 0.7));
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["light"], 0.13);
    ctx.beginPath();
    ctx.moveTo(lb.x, lb.y + lb.h);
    ctx.lineTo(lb.x + lb.w, lb.y + lb.h);
    ctx.lineTo(L.bed.x + L.bed.w + 6, L.bed.y);
    ctx.lineTo(L.bed.x - 6, L.bed.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  metal(ctx, lb.x, lb.y, lb.w, lb.h, theme.inkSoft, { radius: 2 });
  if (lampOn) material(ctx, lb.x + 2, lb.y + lb.h - 2, lb.w - 4, 2.5, theme.sci["light"], 1);

  // vent fan on the right-hand gable
  const fx3 = g.x + g.w - 13;
  const fy3 = g.y + g.h * 0.2;
  metal(ctx, fx3 - 11, fy3 - 11, 22, 22, theme.inkSoft, { radius: 3 });
  ctx.save();
  ctx.translate(fx3, fy3);
  ctx.rotate(fanOn ? t * 6.2 : 0.3);
  ctx.fillStyle = hexA(theme.surface, 0.85);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, -5.5, 2.6, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  sphere(ctx, fx3, fy3, 2.4, theme.inkSoft);

  // dust motes hanging in the greenhouse light
  const motes = state.motes.map((m) => ({
    x: g.x + 6 + m.x * (g.w - 12),
    y: g.y + 6 + m.y * (g.h - 12),
    r: 1.1,
    a: 0.4 + 0.4 * pulse(t + m.x * 6, 0.4),
  }));
  particleField(ctx, motes, theme.sci["light"], { size: 1.2, alpha: 0.55 });

  // the glass itself, drawn over its contents
  glass(ctx, g.x, g.y, g.w, g.h, 5, theme, { tint: theme.sci["gas"] });
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 1.4;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(g.x + (g.w * i) / 4, g.y);
    ctx.lineTo(g.x + (g.w * i) / 4, g.y + g.h);
    ctx.stroke();
  }
  ctx.restore();
  rimLight(ctx, (c) => roundRect(c, g.x, g.y, g.w, g.h, 5), theme.sci["light"],
    { width: 1.6, bounds: g, alpha: 0.7 });

  /* compost bin out on the grounds */
  const cb = L.compost;
  spriteShadowEllipse(ctx, cb.x + cb.w / 2, cb.y + cb.h + 2, cb.w * 0.6, 5);
  plastic(ctx, cb.x, cb.y, cb.w, cb.h, theme.sci["decomposer"], { radius: 4 });
  material(ctx, cb.x - 3, cb.y - 5, cb.w + 6, 6, mixHex(theme.sci["decomposer"], "#000000", 0.25), 2);
}

function ghRender(rc: RenderContext<GhState>) {
  const { ctx, theme, width, height, state, params, overlays, band } = rc;
  const L = ghLayout(width, height);
  const level = ghLevel(params);
  const lampOn = params.lamp !== false;
  const fanOn = params.fan !== false;
  const t = state.t;
  const carrierFilter = String(params.carrier ?? "both");

  ghDrawPlace(rc, L);

  /* ---- the boundary, and everything outside it stepping back ---- */
  const box = ghBoundaryRect(L, level);
  const settle = easeInOut(clamp01(state.settle));
  const k = lerp(0.94, 1, settle);
  const bw = box.w * k, bh = box.h * k;
  const bx = box.x + (box.w - bw) / 2, by = box.y + (box.h - bh) / 2;

  if (overlays.dim !== false) {
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, 0.52);
    ctx.fillRect(0, 0, width, Math.max(0, by));
    ctx.fillRect(0, by + bh, width, Math.max(0, height - by - bh));
    ctx.fillRect(0, by, Math.max(0, bx), bh);
    ctx.fillRect(bx + bw, by, Math.max(0, width - bx - bw), bh);
    ctx.restore();
  }

  /* ---- flows ---- */
  const placer = new BadgeField();
  const crossings: { f: GhFlow; role: FlowRole; at: { x: number; y: number }; v: number }[] = [];

  for (const f of GH_FLOWS) {
    if (!f.live(lampOn, fanOn)) continue;
    if (carrierFilter !== "both" && f.carrier !== carrierFilter) continue;
    const role = classify(f, level);
    if (role === "outside") continue;
    if (role === "internal" && overlays.internal === false) continue;

    const a = L.anchor[f.from], b = L.anchor[f.to];
    const pts = curve(a.x, a.y, b.x, b.y, f.bend);
    const col = carrierColor(theme, f.tint);
    const isCross = role === "input" || role === "output";
    const v = f.value(lampOn, fanOn);

    if (isCross) {
      ribbon(ctx, pts, 9, hexA(col, 0.3), hexA(col, 0.04), { taper: 1 });
      dashFlow(ctx, pts, col, t * 42, { width: 2.8, dash: 8, gap: 8, alpha: 0.95, glow: 4 });
      const tip = pts[pts.length - 1], prev = pts[pts.length - 4];
      arrow(ctx, prev.x, prev.y, tip.x, tip.y, col, { width: 2.4, head: 9 });
      const at = crossingPoint(pts, box) ?? pts[Math.floor(pts.length / 2)];
      crossings.push({ f, role, at, v });
    } else {
      dashFlow(ctx, pts, col, t * 22, { width: 1.6, dash: 4, gap: 7, alpha: 0.42 });
    }
  }

  /* ---- the line itself ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.14 + 0.09 * pulse(t, 0.45));
  ctx.lineWidth = 13;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.stroke();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.4;
  ctx.setLineDash([12, 7]);
  ctx.lineDashOffset = -t * 16;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const arm = Math.min(20, bw * 0.22, bh * 0.22);
  for (const [cx2, cy2, sx, sy] of [
    [bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx2 + sx * arm, cy2);
    ctx.lineTo(cx2, cy2);
    ctx.lineTo(cx2, cy2 + sy * arm);
    ctx.stroke();
  }
  ctx.restore();
  caption(ctx, bx + 4, by - 12, ghLevelName(params).toUpperCase(), theme, {
    size: 11, color: theme.accent, weight: 800,
  });

  /* ---- one badge per crossing, never overlapping ---- */
  for (const c of crossings) {
    const col = carrierColor(theme, c.f.tint);
    const outward = c.role === "input" ? -1 : 1;
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(c.at.x, c.at.y, 4.6 + 1.2 * pulse(t + c.at.x * 0.01, 1.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.surface, 0.9);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (band === "K-2") continue;
    const dp = c.f.unit === "W" ? 0 : c.f.unit === "kg/day" ? 2 : 1;
    const text = `${fx(c.v, dp)} ${c.f.unit}`;
    const spot = placer.place(
      Math.min(width - 62, Math.max(62, c.at.x + outward * 34)),
      Math.min(height - 26, Math.max(26, c.at.y - 24)),
      Math.max(96, text.length * 7 + 22), 34,
    );
    ctx.save();
    ctx.strokeStyle = hexA(col, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(c.at.x, c.at.y);
    ctx.lineTo(spot.x, spot.y);
    ctx.stroke();
    ctx.restore();
    badge(ctx, spot.x, spot.y, text, theme, {
      align: "center", color: col,
      sub: `${c.role === "input" ? "in" : "out"} · ${c.f.label}`,
    });
  }

  /* ---- part labels, out in the calm margin ---- */
  if (overlays.labels !== false && band !== "K-2") {
    labelLeader(ctx, L.anchor.plant.x, L.anchor.plant.y, 14, height * 0.32,
      "Tomato plant", theme, { color: theme.sci["producer"], size: 11, align: "right" });
    labelLeader(ctx, L.anchor.bed.x, L.bed.y + L.bed.h, 14, height * 0.44,
      "Grow bed", theme, { color: theme.sci["decomposer"], size: 11, align: "right" });
    labelLeader(ctx, L.gh.x + L.gh.w, L.gh.y + L.gh.h * 0.55, width - 16, height * 0.2,
      "Greenhouse", theme, { color: theme.accent, size: 11, align: "left" });
    labelLeader(ctx, L.anchor.kitchen.x, L.anchor.kitchen.y, width - 16, height * 0.6,
      "School kitchen", theme, { color: theme.sci["hot"], size: 11, align: "left" });
    labelLeader(ctx, L.anchor.compost.x, L.compost.y, width - 16, height * 0.74,
      "Compost bin", theme, { color: theme.sci["decomposer"], size: 11, align: "left" });
  }

  /* ---- the tally, on the stage ---- */
  const tal = ghTally(params);
  const hud = { x: 12, y: 10, w: 210, h: 62 };
  softShadow(ctx, () => {
    ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.8 : 0.86);
    roundRect(ctx, hud.x, hud.y, hud.w, hud.h, 9);
    ctx.fill();
  }, { blur: 12, dy: 3, alpha: 0.22 });
  innerGlow(ctx, (c) => roundRect(c, hud.x, hud.y, hud.w, hud.h, 9), theme.accent,
    { inset: 6, alpha: 0.18, steps: 2 });
  caption(ctx, hud.x + 12, hud.y + 16, "CROSSING THE LINE", theme, {
    size: 9.5, color: theme.inkSoft, weight: 800,
  });
  const cells: [string, number, string][] = [
    ["in", tal.inputs, theme.sci["producer"]],
    ["out", tal.outputs, theme.sci["decomposer"]],
    ["inside", tal.internal, theme.inkSoft],
  ];
  cells.forEach(([name, n, col], i) => {
    const cx3 = hud.x + 34 + i * 68;
    caption(ctx, cx3, hud.y + 38, String(n), theme, {
      align: "center", size: 21, color: col, weight: 800,
    });
    caption(ctx, cx3, hud.y + 53, name, theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  });

  if (band !== "K-2") {
    badge(ctx, width - 12, height - 22, `${fx(tal.energyIn, 0)} W in · ${fx(tal.energyOut, 0)} W out`,
      theme, { align: "right", color: theme.sci["energy-total"], sub: "energy across the boundary" });
  }

  noiseWash(ctx, 0, 0, width, height, { alpha: 0.03, seed: 12 });
  vignette(ctx, width, height, 0.16);
}

export const g6a2BoundaryDrawer: SimManifest<GhState> = {
  id: "g6a2-boundary-drawer",
  title: "Boundary Drawer",
  tagline: "Slide one line in and out of a rooftop greenhouse and watch the same arrows change from inputs to internal flows.",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [4, 5, 6, 7, 8],
  standards: { ngss: ["MS-ETS1-1", "MS-LS2-3", "MS-PS3-3"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Draw a boundary around a system and say what is inside it.",
    "Name the inputs and outputs that cross that boundary.",
    "Show that moving the boundary turns some flows into internal transfers.",
  ],
  misconceptions: [
    "A system's boundary is a real wall you can find in the world",
    "Inputs and outputs belong to the object, not to the boundary you chose",
    "A bigger boundary always means more inputs",
    "Flows inside the system do not count as anything",
  ],
  interactionHint: "Change the boundary and watch the arrows change name.",
  params: {
    boundary: {
      type: "option", label: "Draw the boundary around",
      options: GH_LEVELS.map((l) => ({ value: l.value, label: l.name })),
      default: "greenhouse",
      help: "Nothing physical changes. Only the line moves.",
    },
    carrier: {
      type: "option", label: "Show flows of",
      options: [
        { value: "both", label: "Matter and energy" },
        { value: "matter", label: "Matter only" },
        { value: "energy", label: "Energy only" },
      ],
      default: "both",
      bands: ["6-8"],
    },
    lamp: {
      type: "boolean", label: "Grow lamp on", default: true,
      help: "A 150 W LED bar. Switch it off and one input disappears.",
    },
    fan: {
      type: "boolean", label: "Vent fan running", default: true,
      help: "Shut the vent and the water vapour condenses and drips back instead of leaving.",
    },
  },
  overlays: [
    { key: "internal", label: "Internal transfers", default: true },
    { key: "labels", label: "Part labels", default: true, bands: ["3-5", "6-8"] },
    { key: "dim", label: "Dim what is outside", default: true },
  ],
  model: ghModel,
  render: ghRender,
  labs: [
    {
      id: "move-the-line",
      title: "Move the line, change the answer",
      question: "Does making the system bigger always give it more inputs?",
      bands: ["3-5", "6-8"],
      minutes: 20,
      standards: ["MS-ETS1-1"],
      setup: { boundary: "plant", carrier: "both", lamp: true, fan: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you move anything.",
          predict: {
            prompt: "You move the boundary out from the plant to the whole school grounds. What happens to the number of inputs?",
            options: ["It goes up", "It stays the same", "It goes down"],
            correct: 2,
            reveal: "It goes down. A bigger boundary swallows flows that used to cross it — water, compost and grow light all become internal transfers.",
          },
        },
        {
          id: "plant",
          phase: "measure",
          title: "Start at the plant",
          instruction: "With the boundary on the plant, record the inputs, outputs and internal transfers.",
          requireData: 1,
          check: { describe: "Boundary is the tomato plant", test: (v) => v.params.boundary === "plant" },
        },
        {
          id: "greenhouse",
          phase: "measure",
          title: "Now the greenhouse",
          instruction: "Move the boundary to the greenhouse and record the three numbers again.",
          requireData: 2,
          check: { describe: "Boundary is the greenhouse", test: (v) => v.params.boundary === "greenhouse" },
          hints: ["The water in the tank never crosses the greenhouse wall — it was already inside."],
        },
        {
          id: "grounds",
          phase: "measure",
          title: "Out to the grounds",
          instruction: "Move the boundary to the school grounds and record once more.",
          requireData: 3,
          check: { describe: "Boundary is the school grounds", test: (v) => v.params.boundary === "grounds" },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read your table",
          instruction: "Look at how internal transfers changed as inputs fell.",
          write: {
            prompt: "Where did the flows that stopped being inputs actually go?",
            placeholder: "When the boundary got bigger, the flows that used to cross it became ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "One sentence another student could use.",
          write: {
            prompt: "Write a rule linking the size of the boundary to the number of inputs and outputs.",
            placeholder: "The bigger the boundary, the ... because ...",
          },
        },
      ],
    },
    {
      id: "shut-the-vent",
      title: "Shut the vent",
      question: "What happens to the outputs when you close the greenhouse vent?",
      bands: ["3-5", "6-8"],
      minutes: 15,
      setup: { boundary: "greenhouse", carrier: "both", lamp: true, fan: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you touch the switch.",
          predict: {
            prompt: "You shut the vent fan. What happens to the water vapour the plant gives off?",
            options: [
              "It disappears",
              "It condenses inside and drips back into the bed",
              "It still leaves through the glass",
            ],
            correct: 1,
            reveal: "It condenses on the cold glass and runs back down into the bed. The water is still there — it just stopped crossing the boundary.",
          },
        },
        {
          id: "vent-on",
          phase: "measure",
          title: "Vent running",
          instruction: "With the fan on, record the outputs and the water leaving each day.",
          requireData: 1,
          check: { describe: "Vent fan is on", test: (v) => v.params.fan === true },
        },
        {
          id: "vent-off",
          phase: "measure",
          title: "Vent shut",
          instruction: "Switch the fan off and record the same numbers.",
          requireData: 2,
          check: { describe: "Vent fan is off", test: (v) => v.params.fan === false },
          hints: ["Watch the energy readouts too — heat still has to get out somehow."],
        },
        {
          id: "energy",
          phase: "analyze",
          title: "Follow the heat",
          instruction: "Energy in still equals energy out. Find where the extra 300 W went.",
          check: {
            describe: "Energy in equals energy out at this boundary",
            test: (v) => Boolean(v.facts.energyBalanced),
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say what closing the vent did and did not change.",
          write: {
            prompt: "Closing the vent stopped one output. Which one, and what took its place?",
            placeholder: "Closing the vent stopped ... but the energy still left by ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "exactly-two",
      title: "Exactly two inputs",
      brief: "Find a boundary and a set of switches that leaves exactly two flows crossing inwards.",
      bands: ["3-5", "6-8"],
      setup: { boundary: "greenhouse", lamp: true, fan: true },
      goal: {
        describe: "Exactly two inputs cross the boundary",
        test: (v) => v.readouts.inputs === 2,
      },
      stars: {
        two: {
          describe: "Two inputs and no more than two outputs",
          test: (v) => v.readouts.inputs === 2 && v.readouts.outputs <= 2,
        },
        three: {
          describe: "Two inputs with five or more internal transfers",
          test: (v) => v.readouts.inputs === 2 && v.readouts.internal >= 5,
        },
      },
      hints: [
        "Switching the grow lamp off removes one electrical input straight away.",
        "A bigger boundary turns crossings into internal transfers.",
      ],
    },
    {
      id: "nothing-leaves",
      title: "Stop the matter leaving",
      brief: "Set up a boundary where no matter at all crosses out — while energy still does.",
      bands: ["6-8"],
      setup: { boundary: "greenhouse", lamp: true, fan: true },
      goal: {
        describe: "No matter leaves, but energy still does",
        test: (v) => Boolean(v.facts.noMatterLeaves) && (v.readouts.energyOut as number) > 0,
      },
      stars: {
        two: {
          describe: "No matter out and at least six internal transfers",
          test: (v) => Boolean(v.facts.noMatterLeaves) && v.readouts.internal >= 6,
        },
        three: {
          describe: "No matter out, energy balanced, boundary at the school grounds",
          test: (v) =>
            Boolean(v.facts.noMatterLeaves) && Boolean(v.facts.energyBalanced) &&
            v.params.boundary === "grounds",
        },
      },
      hints: [
        "The tomatoes and the peelings both travel. Can you get them both inside the line?",
        "Water vapour only leaves while the vent is running.",
      ],
    },
  ],
};

/* ================================================================== *
 * A2.2 — Open, Closed or Isolated
 *
 * Two identical portions of hot water, side by side on digital balances,
 * under whatever vessel the student picks. The open beaker loses mass and
 * cools fastest. The sealed jar's balance reading never moves — and it still
 * cools, because energy walks straight through a lid. The vacuum flask stops
 * very nearly everything, and still loses a few degrees an hour, because
 * nothing is perfectly isolated.
 *
 * The model is textbook: Newton cooling through the walls, Tetens' saturation
 * vapour pressure driving evaporation, and 2.26 MJ of latent heat carried away
 * by every kilogram that leaves.
 * ================================================================== */

type VesselKind = "open" | "sealed" | "flask";

interface VesselSpec {
  name: string;
  short: string;
  /** Heat transfer coefficient of the walls, W per square metre per kelvin. */
  u: number;
  /** Can matter cross this boundary? */
  openToMatter: boolean;
  /** Label a student would write in the "system type" column. */
  classification: string;
}

const VESSELS: Record<VesselKind, VesselSpec> = {
  open: {
    name: "Open beaker", short: "open", u: 20, openToMatter: true,
    classification: "open system",
  },
  sealed: {
    name: "Sealed jar", short: "sealed", u: 18, openToMatter: false,
    classification: "closed system",
  },
  flask: {
    name: "Vacuum flask", short: "flask", u: 1, openToMatter: false,
    classification: "nearly isolated",
  },
};

/** Specific heat capacity of liquid water, J per kilogram per kelvin. */
const C_WATER = 4186;
/** Latent heat of vaporisation of water near 100 degrees Celsius, J per kg. */
const LATENT_VAP = 2.26e6;
/** Density of liquid water, kg per cubic metre. */
const RHO_WATER = 1000;
/** Evaporation coefficient, kg per second per square metre per kilopascal. */
const EVAP_K = 4.69e-5;

interface Geometry { radius: number; topArea: number; wallArea: number }

function vesselGeometry(volume: number): Geometry {
  // A squat cylinder with height equal to its diameter: h = 2r, V = 2 pi r^3.
  const radius = Math.cbrt(Math.max(1e-6, volume) / (2 * Math.PI));
  const topArea = Math.PI * radius * radius;
  return { radius, topArea, wallArea: 6 * Math.PI * radius * radius };
}

interface JarState {
  m: number;      // kg of water still in the vessel
  T: number;      // K
  lost: number;   // kg that has left through the boundary
  cycled: number; // kg that evaporated and condensed back inside
}

interface Puff { x: number; y: number; seed: number }

interface OcState {
  t: number;
  left: JarState;
  right: JarState;
  puffs: Puff[];
}

function freshJar(params: ParamValues): JarState {
  const volume = params.volume as number;
  return { m: volume * RHO_WATER, T: params.startTemp as number, lost: 0, cycled: 0 };
}

function kindOf(params: ParamValues, side: "left" | "right"): VesselKind {
  const v = String(params[side === "left" ? "leftVessel" : "rightVessel"]);
  return (v === "open" || v === "sealed" || v === "flask" ? v : "open") as VesselKind;
}

/** One vessel, advanced by dt seconds. Pure arithmetic, no state mutated. */
export function stepJar(
  jar: JarState, kind: VesselKind, dt: number,
  ambient: number, humidity: number, volume: number, lampWatts: number,
): JarState {
  const spec = VESSELS[kind];
  const geo = vesselGeometry(volume);
  const tempC = jar.T - KELVIN;
  const ambientC = ambient - KELVIN;

  const drive = Math.max(0, satVapourPressure(tempC) - humidity * satVapourPressure(ambientC));
  const evapRate = EVAP_K * geo.topArea * drive; // kg/s

  const qEnv = spec.u * geo.wallArea * (jar.T - ambient);
  const qEvap = spec.openToMatter ? evapRate * LATENT_VAP : 0;
  const heatCapacity = Math.max(1e-6, jar.m * C_WATER);

  const T = jar.T + ((lampWatts - qEnv - qEvap) / heatCapacity) * dt;
  const floor = volume * RHO_WATER * 0.05;
  const m = spec.openToMatter ? Math.max(floor, jar.m - evapRate * dt) : jar.m;

  return {
    m,
    T,
    lost: jar.lost + (spec.openToMatter ? jar.m - m : 0),
    // A sealed vessel still evaporates — the vapour simply condenses and
    // returns, which is exactly why the balance reading never moves.
    cycled: jar.cycled + (spec.openToMatter ? 0 : evapRate * dt),
  };
}

const ocModel: SimModel<OcState> = {
  init(params, ctx) {
    const puffs: Puff[] = [];
    for (let i = 0; i < 18; i++) {
      puffs.push({ x: ctx.rng.range(-1, 1), y: ctx.rng.range(0, 1), seed: ctx.rng.range(0, 6.28) });
    }
    return { t: 0, left: freshJar(params), right: freshJar(params), puffs };
  },

  applyParams(state, params, prev) {
    const restart =
      params.startTemp !== prev.startTemp || params.volume !== prev.volume ||
      params.leftVessel !== prev.leftVessel || params.rightVessel !== prev.rightVessel;
    if (!restart) return state;
    return { ...state, t: 0, left: freshJar(params), right: freshJar(params) };
  },

  step(state, dt, params) {
    const ambient = params.roomTemp as number;
    const humidity = params.humidity as number;
    const volume = params.volume as number;
    const lamp = params.lamp === true ? 12 : 0;
    return {
      ...state,
      t: state.t + dt,
      left: stepJar(state.left, kindOf(params, "left"), dt, ambient, humidity, volume, lamp),
      right: stepJar(state.right, kindOf(params, "right"), dt, ambient, humidity, volume, lamp),
    };
  },

  readouts(state, params) {
    const start = params.startTemp as number;
    return [
      { key: "leftTemp", label: "Left temperature", quantity: q(state.left.T, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      { key: "rightTemp", label: "Right temperature", quantity: q(state.right.T, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      { key: "leftMass", label: "Left balance", quantity: q(state.left.m, "mass"), unit: "g", semantic: "mass", graphable: true },
      { key: "rightMass", label: "Right balance", quantity: q(state.right.m, "mass"), unit: "g", semantic: "mass", graphable: true },
      {
        key: "leftLost", label: "Left mass lost", quantity: q(state.left.lost, "mass"), unit: "g",
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "rightLost", label: "Right mass lost", quantity: q(state.right.lost, "mass"), unit: "g",
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "leftDrop", label: "Left cooling", quantity: q(start - state.left.T, "temperature"), unit: "K",
        semantic: "cold", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "rightDrop", label: "Right cooling", quantity: q(start - state.right.T, "temperature"), unit: "K",
        semantic: "cold", graphable: true, bands: ["6-8", "9-12"],
      },
      { key: "elapsed", label: "Elapsed", quantity: q(state.t, "time"), unit: "min", semantic: "time", graphable: false },
    ];
  },

  facts(state, params) {
    const start = params.startTemp as number;
    const lk = kindOf(params, "left"), rk = kindOf(params, "right");
    return {
      leftVessel: lk,
      rightVessel: rk,
      leftType: VESSELS[lk].classification,
      rightType: VESSELS[rk].classification,
      leftOpenToMatter: VESSELS[lk].openToMatter,
      rightOpenToMatter: VESSELS[rk].openToMatter,
      leftLostG: state.left.lost * 1000,
      rightLostG: state.right.lost * 1000,
      maxLostG: Math.max(state.left.lost, state.right.lost) * 1000,
      leftTempC: state.left.T - KELVIN,
      rightTempC: state.right.T - KELVIN,
      leftDropK: start - state.left.T,
      rightDropK: start - state.right.T,
      minDropK: Math.min(start - state.left.T, start - state.right.T),
      leftCycledG: state.left.cycled * 1000,
      rightCycledG: state.right.cycled * 1000,
      elapsedMin: state.t / 60,
      sameVessel: lk === rk,
      energyLeftBoth: true,
    };
  },
};

/* ---- view ---------------------------------------------------------- */

interface Station { cx: number; base: number; w: number; h: number }

function ocStations(width: number, height: number): [Station, Station] {
  const benchY = height * 0.78;
  const w = Math.min(width * 0.2, 132);
  const h = Math.min(height * 0.34, 170);
  return [
    { cx: width * 0.3, base: benchY, w, h },
    { cx: width * 0.7, base: benchY, w, h },
  ];
}

function ocDrawVessel(
  rc: RenderContext<OcState>, st: Station, kind: VesselKind, jar: JarState,
  params: ParamValues, side: "left" | "right",
) {
  const { ctx, theme, state } = rc;
  const t = state.t;
  const spec = VESSELS[kind];
  const volume = params.volume as number;
  const start = params.startTemp as number;
  const ambient = params.roomTemp as number;

  const balanceH = 20;
  const topY = st.base - balanceH - st.h;
  const x = st.cx - st.w / 2;

  /* the balance the vessel stands on */
  spriteShadowEllipse(ctx, st.cx, st.base + 3, st.w * 0.72, 7);
  metal(ctx, x - 12, st.base - balanceH, st.w + 24, balanceH, theme.inkSoft, { radius: 4 });
  bevelRect(ctx, x + st.w * 0.28, st.base - balanceH + 4, st.w * 0.44, balanceH - 8, 3,
    mixHex(theme.ink, theme.surface, 0.15), { depth: -1 });
  caption(ctx, st.cx + st.w * 0.5 - 4, st.base - balanceH / 2, `${fx(jar.m * 1000, 1)} g`, theme, {
    align: "right", size: 10.5, color: theme.sci["mass"], weight: 700,
  });

  /* the liquid, drawn before the wall so the wall reads as translucent */
  const fillFrac = jar.m / Math.max(1e-9, volume * RHO_WATER);
  const innerX = x + 5, innerW = st.w - 10;
  const waterH = (st.h - 14) * (0.28 + 0.6 * fillFrac);
  const waterY = topY + st.h - 7 - waterH;
  const hotness = clamp01((jar.T - ambient) / Math.max(1, start - ambient));
  const waterCol = mixHex(theme.sci["cold"], theme.sci["hot"], hotness);
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, innerX, waterY, innerW, waterH, 4);
  ctx.fillStyle = hexA(waterCol, 0.68);
  ctx.fill();
  // a moving meniscus so the liquid never looks like a painted block
  ctx.beginPath();
  ctx.moveTo(innerX, waterY + 2);
  for (let px2 = 0; px2 <= innerW; px2 += 4) {
    ctx.lineTo(innerX + px2, waterY + 2 + Math.sin(px2 * 0.16 + t * 2.2) * 1.4);
  }
  ctx.lineTo(innerX + innerW, waterY + 8);
  ctx.lineTo(innerX, waterY + 8);
  ctx.closePath();
  ctx.fillStyle = hexA(waterCol, 0.9);
  ctx.fill();
  ctx.restore();

  /* convection swirls inside the water */
  ctx.save();
  ctx.strokeStyle = hexA(mixHex(waterCol, "#ffffff", 0.5), 0.4 * hotness);
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    const yy = waterY + waterH * (0.3 + i * 0.22);
    ctx.beginPath();
    for (let px2 = 4; px2 <= innerW - 4; px2 += 4) {
      ctx.lineTo(innerX + px2, yy + Math.sin(px2 * 0.11 + t * 1.6 + i * 2) * 3);
    }
    ctx.stroke();
  }
  ctx.restore();

  /* vessel-specific body */
  if (kind === "flask") {
    // metal skin with a cutaway showing the evacuated gap
    metal(ctx, x, topY, st.w, st.h, theme.inkSoft, { radius: 6 });
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x + 3, topY + 6, st.w * 0.34, st.h - 12, 4);
    ctx.clip();
    ctx.fillStyle = hexA(theme.surface, 0.5);
    ctx.fillRect(x, topY, st.w, st.h);
    ctx.restore();
    hatchFill(ctx, x + 3, topY + 6, st.w * 0.34, st.h - 12, theme.inkSoft, { gap: 5, alpha: 0.4 });
    glass(ctx, x + 3 + st.w * 0.34, topY + 6, st.w * 0.6, st.h - 12, 4, theme, { tint: theme.sci["cold"] });
    material(ctx, x - 4, topY - 12, st.w + 8, 13, mixHex(theme.inkSoft, "#000000", 0.15), 4);
  } else {
    glass(ctx, x, topY, st.w, st.h, 5, theme, { tint: theme.sci["liquid"] });
    // graduation marks: this is a measuring vessel, not a tumbler
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const yy = topY + st.h - 7 - ((st.h - 14) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x + st.w - 4, yy);
      ctx.lineTo(x + st.w - (i % 2 === 0 ? 16 : 10), yy);
      ctx.stroke();
    }
    ctx.restore();
    if (kind === "sealed") {
      material(ctx, x - 5, topY - 11, st.w + 10, 12, mixHex(theme.accent, "#000000", 0.2), 4);
      // condensation running back down the inside of the glass
      for (let i = 0; i < 9; i++) {
        const dx = x + 8 + ((i * 37) % Math.max(1, innerW - 12));
        const slide = ((t * 12 + i * 21) % (waterY - topY - 8));
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = hexA(theme.sci["liquid"], 0.9);
        ctx.beginPath();
        ctx.ellipse(dx, topY + 10 + slide, 1.7, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /* steam leaving an open vessel: matter crossing the boundary, visibly */
  if (spec.openToMatter && jar.T - ambient > 3) {
    const strength = clamp01((jar.T - ambient) / 55);
    const puffs = state.puffs.map((p, i) => {
      const rise = ((t * 26 + i * 13) % 74);
      return {
        x: st.cx + p.x * innerW * 0.32 + Math.sin(t * 1.1 + p.seed) * 7,
        y: waterY - rise,
        r: 2.2 + rise * 0.09,
        a: strength * (1 - rise / 74) * 0.7,
      };
    });
    particleField(ctx, puffs, theme.sci["gas"], { size: 3, alpha: 0.55, buckets: 3 });
  }

  /* thermometer probe */
  const probeX = st.cx + innerW * 0.3;
  metal(ctx, probeX - 1.6, topY - 26, 3.2, st.h * 0.6 + 26, theme.inkSoft, { radius: 1.5 });
  sphere(ctx, probeX, topY + st.h * 0.6, 3.4, theme.sci["hot"]);

  /* the boundary of this system, with its two gates */
  const bx = x - 20, by = topY - 30, bw = st.w + 40, bh = st.h + 34 + balanceH;
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.75);
  ctx.lineWidth = 1.8;
  ctx.setLineDash([9, 6]);
  ctx.lineDashOffset = -t * 10;
  roundRect(ctx, bx, by, bw, bh, 9);
  ctx.stroke();
  ctx.restore();

  const gateY = topY + st.h * 0.3;
  const outSide = side === "left" ? -1 : 1;
  const gx = side === "left" ? bx : bx + bw;
  // energy always crosses
  arrow(ctx, gx - outSide * 4, gateY, gx + outSide * 26, gateY, theme.sci["energy-thermal"], { width: 2.4 });
  caption(ctx, gx + outSide * 30, gateY, "energy", theme, {
    align: side === "left" ? "right" : "left", size: 10, color: theme.sci["energy-thermal"],
  });
  // matter only crosses an open boundary
  const mGateY = gateY + 26;
  if (spec.openToMatter) {
    arrow(ctx, gx - outSide * 4, mGateY, gx + outSide * 26, mGateY, theme.sci["gas"], { width: 2.4 });
    caption(ctx, gx + outSide * 30, mGateY, "matter", theme, {
      align: side === "left" ? "right" : "left", size: 10, color: theme.sci["gas"],
    });
  } else {
    ctx.save();
    ctx.strokeStyle = theme.sci["acceleration"];
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(gx + outSide * 4, mGateY - 7);
    ctx.lineTo(gx + outSide * 18, mGateY + 7);
    ctx.moveTo(gx + outSide * 18, mGateY - 7);
    ctx.lineTo(gx + outSide * 4, mGateY + 7);
    ctx.stroke();
    ctx.restore();
    caption(ctx, gx + outSide * 24, mGateY, "matter blocked", theme, {
      align: side === "left" ? "right" : "left", size: 10, color: theme.sci["acceleration"],
    });
  }

  /* live numbers, beside the thing they describe */
  badge(ctx, st.cx, topY - 44, `${fx(jar.T - KELVIN, 1)} °C`, theme, {
    align: "center", color: theme.sci["hot"], sub: spec.name,
  });
  if (!spec.openToMatter && jar.cycled > 1e-5) {
    badge(ctx, st.cx, st.base + 26, `${fx(jar.cycled * 1000, 1)} g`, theme, {
      align: "center", color: theme.sci["liquid"], sub: "evaporated and came back",
    });
  } else if (spec.openToMatter) {
    badge(ctx, st.cx, st.base + 26, `-${fx(jar.lost * 1000, 2)} g`, theme, {
      align: "center", color: theme.sci["gas"], sub: "matter that left",
    });
  }
}

function ocRender(rc: RenderContext<OcState>) {
  const { ctx, theme, width, height, state, params, band, overlays } = rc;
  const benchY = height * 0.78;
  const t = state.t;

  sky(ctx, width, height, theme, "indoor", benchY);
  // a tiled back wall, so the room has a surface rather than a colour
  ctx.save();
  ctx.strokeStyle = hexA(theme.grid, 0.55);
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, benchY);
    ctx.stroke();
  }
  for (let y = 24; y < benchY; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  /* the heat lamp, when it is on */
  if (params.lamp === true) {
    const lx = width * 0.5, ly = height * 0.09;
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["hot"], 0.12);
    ctx.beginPath();
    ctx.moveTo(lx - 20, ly + 12);
    ctx.lineTo(lx + 20, ly + 12);
    ctx.lineTo(width * 0.88, benchY);
    ctx.lineTo(width * 0.12, benchY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    metal(ctx, lx - 26, ly - 6, 52, 16, theme.inkSoft, { radius: 5 });
    glow(ctx, lx, ly + 12, 36, theme.sci["hot"], 0.5 + 0.08 * pulse(t, 0.8));
    sphere(ctx, lx, ly + 12, 8, theme.sci["hot"], { glow: 0.6 });
  }

  const [ls, rs] = ocStations(width, height);
  ocDrawVessel(rc, ls, kindOf(params, "left"), state.left, params, "left");
  ocDrawVessel(rc, rs, kindOf(params, "right"), state.right, params, "right");

  /* room conditions, stated plainly on the stage */
  const roomC = (params.roomTemp as number) - KELVIN;
  caption(ctx, width / 2, height * 0.06,
    `room ${fx(roomC, 0)} °C  ·  humidity ${fx((params.humidity as number) * 100, 0)} %`, theme, {
    align: "center", size: 11.5, color: theme.inkSoft, weight: 700,
  });

  /* the verdict strip: which boundary let what through */
  if (band !== "K-2" && overlays.verdict !== false) {
    const stripY = height - 30;
    const items: [string, VesselKind, number][] = [
      [ls.cx < rs.cx ? "left" : "right", kindOf(params, "left"), ls.cx],
      ["right", kindOf(params, "right"), rs.cx],
    ];
    items.forEach(([, kind, cx]) => {
      const spec = VESSELS[kind];
      const label = spec.classification;
      const col = kind === "open" ? theme.sci["gas"]
        : kind === "sealed" ? theme.accent : theme.sci["cold"];
      softShadow(ctx, () => {
        ctx.fillStyle = hexA(theme.surface, 0.9);
        roundRect(ctx, cx - 82, stripY - 13, 164, 26, 13);
        ctx.fill();
      }, { blur: 8, dy: 2, alpha: 0.2 });
      ctx.save();
      ctx.strokeStyle = hexA(col, 0.55);
      ctx.lineWidth = 1.2;
      roundRect(ctx, cx - 82, stripY - 13, 164, 26, 13);
      ctx.stroke();
      ctx.restore();
      caption(ctx, cx, stripY, label, theme, { align: "center", size: 11.5, color: col, weight: 700 });
    });
  }

  /* elapsed clock */
  badge(ctx, 14, 22, `${fx(state.t / 60, 1)} min`, theme, { color: theme.sci["time"] });

  if (overlays.labels !== false && band !== "K-2") {
    const [a] = ocStations(width, height);
    labelLeader(ctx, a.cx - a.w / 2 - 12, a.base - 10, 14, height * 0.6,
      "Digital balance", theme, { size: 11, align: "right", color: theme.sci["mass"] });
  }

  noiseWash(ctx, 0, 0, width, height, { alpha: 0.03, seed: 31 });
  vignette(ctx, width, height, 0.16);
}

export const g6a2OpenOrClosed: SimManifest<OcState> = {
  id: "g6a2-open-or-closed",
  title: "Open, Closed or Isolated",
  tagline: "Run two vessels of hot water side by side and find out exactly what a lid does and does not stop.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9],
  standards: { ngss: ["MS-PS1-4", "MS-PS3-4", "MS-PS3-5"], ccssMath: ["6.SP.B.5"] },
  learningGoals: [
    "Tell an open system from a closed one by what crosses its boundary.",
    "Show that a closed boundary stops matter but not energy.",
    "Explain why no real system is perfectly isolated.",
  ],
  misconceptions: [
    "A closed system is one where nothing at all happens",
    "A lid stops energy as well as matter",
    "Water that evaporates from a sealed jar has been destroyed",
    "A vacuum flask keeps a drink hot forever",
  ],
  interactionHint: "Pick a different vessel for each side, then press play.",
  timeScale: 60,
  params: {
    leftVessel: {
      type: "option", label: "Left vessel",
      options: (Object.keys(VESSELS) as VesselKind[]).map((k) => ({ value: k, label: VESSELS[k].name })),
      default: "open",
    },
    rightVessel: {
      type: "option", label: "Right vessel",
      options: (Object.keys(VESSELS) as VesselKind[]).map((k) => ({ value: k, label: VESSELS[k].name })),
      default: "sealed",
    },
    startTemp: {
      type: "number", label: "Starting temperature", kind: "temperature", unit: "°C",
      min: 313.15, max: 368.15, step: 1, default: 353.15,
      marks: [
        { value: 313.15, label: "40 °C" },
        { value: 353.15, label: "80 °C" },
        { value: 368.15, label: "95 °C" },
      ],
    },
    roomTemp: {
      type: "number", label: "Room temperature", kind: "temperature", unit: "°C",
      min: 283.15, max: 303.15, step: 0.5, default: 295.15, bands: ["6-8", "9-12"],
    },
    humidity: {
      type: "number", label: "Room humidity", kind: "percent", unit: "%",
      min: 0.1, max: 0.9, step: 0.05, default: 0.45, bands: ["6-8", "9-12"],
      help: "Damp air slows evaporation, because there is less room in it for more vapour.",
    },
    volume: {
      type: "number", label: "Water", kind: "volume", unit: "mL",
      min: 1e-4, max: 5e-4, step: 5e-5, default: 2.5e-4,
    },
    lamp: {
      type: "boolean", label: "Heat lamp on", default: false, bands: ["6-8", "9-12"],
      help: "Adds 12 W to each vessel — energy crossing every boundary, lid or no lid.",
    },
  },
  overlays: [
    { key: "verdict", label: "System type", default: true },
    { key: "labels", label: "Apparatus labels", default: true },
  ],
  model: ocModel,
  render: ocRender,
  labs: [
    {
      id: "what-a-lid-stops",
      title: "What does a lid actually stop?",
      question: "If the balance reading does not change, has the system stopped changing?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-4"],
      setup: {
        leftVessel: "open", rightVessel: "sealed", startTemp: 353.15,
        roomTemp: 295.15, humidity: 0.45, volume: 2.5e-4, lamp: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit to an answer before you press play.",
          predict: {
            prompt: "After twenty minutes, what will the sealed jar's balance and thermometer show?",
            options: [
              "Mass down, temperature down",
              "Mass the same, temperature down",
              "Mass the same, temperature the same",
            ],
            correct: 1,
            reveal: "The lid stops matter, so the mass holds. It does nothing to energy, so the water still cools.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run for ten minutes",
          instruction: "Press play and record both temperatures and both balances at least four times.",
          requireData: 4,
          check: { describe: "At least ten minutes have passed", test: (v) => (v.facts.elapsedMin as number) >= 10 },
          hints: [
            "One minute of the experiment takes one second of your time.",
            "Record a row every few minutes so the pattern shows up in your table.",
          ],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two balances",
          instruction: "One reading moved and one did not. Say which, and by how much.",
          write: {
            prompt: "How much mass did each vessel lose, and what does that tell you about its boundary?",
            placeholder: "The open beaker lost ... g and the sealed jar lost ... g, which means ...",
          },
        },
        {
          id: "energy",
          phase: "analyze",
          title: "Now look at the thermometers",
          instruction: "Both fell. Explain how energy got out of a jar with a lid on.",
          write: {
            prompt: "The sealed jar cooled down. Where did its energy go, and how did it get past the lid?",
            placeholder: "The energy left by ... through the ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the two systems",
          instruction: "Write the definition you would give another class.",
          write: {
            prompt: "Finish both sentences: an open system lets ... cross its boundary. A closed system lets ... but not ...",
            placeholder: "An open system lets ...",
          },
        },
      ],
    },
    {
      id: "nothing-is-isolated",
      title: "Is anything truly isolated?",
      question: "Can a vacuum flask stop energy completely?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      setup: {
        leftVessel: "sealed", rightVessel: "flask", startTemp: 353.15,
        roomTemp: 295.15, humidity: 0.45, volume: 2.5e-4, lamp: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before running anything.",
          predict: {
            prompt: "After a full hour, what will the vacuum flask's thermometer read?",
            options: [
              "Exactly 80 °C — nothing escapes",
              "A few degrees below 80 °C",
              "About the same as the sealed jar",
            ],
            correct: 1,
            reveal: "A good flask slows heat loss roughly twentyfold, but the vacuum gap is not perfect and the stopper conducts. It loses a few degrees an hour.",
          },
        },
        {
          id: "long-run",
          phase: "measure",
          title: "Run for an hour",
          instruction: "Play until sixty minutes have gone by, recording as you go.",
          requireData: 4,
          check: { describe: "Sixty minutes elapsed", test: (v) => (v.facts.elapsedMin as number) >= 60 },
        },
        {
          id: "measure-drop",
          phase: "analyze",
          title: "How much did the flask lose?",
          instruction: "Read the flask's cooling in kelvin and compare it with the jar's.",
          check: {
            describe: "The better vessel has still lost some heat",
            test: (v) => (v.facts.minDropK as number) > 0.2,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why perfect is impossible",
          instruction: "Explain what an isolated system would need, and why you cannot build one.",
          write: {
            prompt: "What would a truly isolated system need, and why can no real container manage it?",
            placeholder: "A truly isolated system would have to ... but every real container ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "lose-five-grams",
      title: "Lose five grams",
      brief: "Set the conditions so an open beaker loses at least 5 g of water in twenty minutes.",
      bands: ["6-8", "9-12"],
      setup: {
        leftVessel: "open", rightVessel: "open", startTemp: 353.15,
        roomTemp: 295.15, humidity: 0.45, volume: 2.5e-4, lamp: false,
      },
      goal: {
        describe: "At least 5 g lost within twenty minutes",
        test: (v) => (v.facts.maxLostG as number) >= 5 && (v.facts.elapsedMin as number) <= 20,
      },
      stars: {
        two: {
          describe: "At least 8 g lost within twenty minutes",
          test: (v) => (v.facts.maxLostG as number) >= 8 && (v.facts.elapsedMin as number) <= 20,
        },
        three: {
          describe: "At least 12 g lost within fifteen minutes",
          test: (v) => (v.facts.maxLostG as number) >= 12 && (v.facts.elapsedMin as number) <= 15,
        },
      },
      hints: [
        "Hotter water pushes far more vapour pressure into the air.",
        "Dry air has more room for vapour than damp air.",
      ],
    },
    {
      id: "hold-the-heat",
      title: "Hold the heat",
      brief: "Keep a vessel within 3 K of its starting temperature for a full hour.",
      bands: ["6-8", "9-12"],
      setup: {
        leftVessel: "open", rightVessel: "flask", startTemp: 353.15,
        roomTemp: 295.15, humidity: 0.45, volume: 5e-4, lamp: false,
      },
      goal: {
        describe: "One hour gone and the better vessel has lost under 3 K",
        test: (v) => (v.facts.elapsedMin as number) >= 60 && (v.facts.minDropK as number) < 3,
      },
      stars: {
        two: {
          describe: "Two hours with under 5 K lost",
          test: (v) => (v.facts.elapsedMin as number) >= 120 && (v.facts.minDropK as number) < 5,
        },
        three: {
          describe: "Three hours with under 7 K lost",
          test: (v) => (v.facts.elapsedMin as number) >= 180 && (v.facts.minDropK as number) < 7,
        },
      },
      hints: [
        "The vacuum gap cuts heat loss by about twenty times.",
        "More water means more stored energy for the same wall area, so it cools more slowly.",
      ],
    },
  ],
};

/* ================================================================== *
 * A2.3 — Input, Output, Inside
 *
 * A sorting line in a workshop. Crates ride a belt past a scanner, each one
 * carrying something to do with a chosen system, and the student drops it down
 * one of three chutes: it crosses the boundary going in, it crosses going out,
 * or it never crosses at all because it is a part of the system.
 *
 * The third chute is the one that does the teaching. Students who can list
 * inputs and outputs fluently still put "the heating wire" in the input pile,
 * because they are sorting objects rather than sorting flows.
 * ================================================================== */

type SortRole = "input" | "output" | "inside";
type SortCarrier = "matter" | "energy" | "part";

interface SortItem {
  label: string;
  role: SortRole;
  carrier: SortCarrier;
  why: string;
}

interface SortSystem {
  key: string;
  name: string;
  boundary: string;
  items: SortItem[];
}

const SORT_SYSTEMS: SortSystem[] = [
  {
    key: "toaster", name: "A toaster on the counter", boundary: "the toaster's metal case",
    items: [
      { label: "Electricity from the socket", role: "input", carrier: "energy", why: "Electrical energy travels in along the flex and crosses the case." },
      { label: "A slice of bread", role: "input", carrier: "matter", why: "Bread is matter that you push in through the slot." },
      { label: "Air pulled in through the slots", role: "input", carrier: "matter", why: "Cool air is drawn in at the bottom — matter crossing inwards." },
      { label: "Hot toast lifted out", role: "output", carrier: "matter", why: "The same matter leaves again, changed and hotter." },
      { label: "Heat into the kitchen", role: "output", carrier: "energy", why: "Thermal energy leaves through the case and the slots." },
      { label: "Steam off the bread", role: "output", carrier: "matter", why: "Water from the bread leaves as vapour." },
      { label: "The nichrome heating wire", role: "inside", carrier: "part", why: "A part of the toaster. Parts sit inside the boundary; they do not cross it." },
      { label: "The spring-loaded lever", role: "inside", carrier: "part", why: "Another part. It moves, but it never leaves the system." },
      { label: "Crumbs in the crumb tray", role: "inside", carrier: "part", why: "They fall inside and stay inside until someone empties the tray." },
      { label: "Red glow from the element", role: "output", carrier: "energy", why: "Light is energy, and it shines out of the slots." },
    ],
  },
  {
    key: "bike", name: "A rider on a bicycle", boundary: "the rider and the bike together",
    items: [
      { label: "Breakfast eaten before the ride", role: "input", carrier: "matter", why: "Food is matter carrying stored chemical energy in." },
      { label: "Oxygen breathed in", role: "input", carrier: "matter", why: "Oxygen crosses in at every breath." },
      { label: "Water from the bottle", role: "input", carrier: "matter", why: "The bottle is on the bike, but the water crosses into the rider." },
      { label: "Carbon dioxide breathed out", role: "output", carrier: "matter", why: "Waste matter from respiration, leaving with every breath." },
      { label: "Sweat evaporating off the skin", role: "output", carrier: "matter", why: "Water leaves the system as vapour, taking heat with it." },
      { label: "Heat from working muscles", role: "output", carrier: "energy", why: "About three quarters of the food energy leaves as heat." },
      { label: "The chain and the gears", role: "inside", carrier: "part", why: "Parts of the bike. They transfer energy inside the boundary." },
      { label: "Sound of tyres on the road", role: "output", carrier: "energy", why: "Sound is energy radiating away from the system." },
      { label: "Chemical energy in the muscles", role: "inside", carrier: "part", why: "Stored inside the boundary. Storage is not a crossing." },
      { label: "The rider's lungs", role: "inside", carrier: "part", why: "A part of the rider, and the rider is inside the line you drew." },
    ],
  },
  {
    key: "plant", name: "A potted plant on a windowsill", boundary: "the pot, the soil and the plant",
    items: [
      { label: "Sunlight through the window", role: "input", carrier: "energy", why: "Light energy crosses in and drives photosynthesis." },
      { label: "Carbon dioxide from the room", role: "input", carrier: "matter", why: "CO2 enters through pores on the leaves." },
      { label: "Water poured into the pot", role: "input", carrier: "matter", why: "Matter crossing in at the soil surface." },
      { label: "Oxygen given off by the leaves", role: "output", carrier: "matter", why: "A waste product of photosynthesis, leaving the plant." },
      { label: "Water vapour from the leaves", role: "output", carrier: "matter", why: "Transpiration — most of the water taken up leaves again as vapour." },
      { label: "Chlorophyll in the leaves", role: "inside", carrier: "part", why: "A substance inside the plant, not a flow across the line." },
      { label: "Sugar made in the leaves", role: "inside", carrier: "part", why: "Built and stored inside. It only becomes an output if something removes it." },
      { label: "Minerals in the potting mix", role: "inside", carrier: "part", why: "Already inside the boundary from the start." },
      { label: "A dead leaf swept off the sill", role: "output", carrier: "matter", why: "Matter that leaves the system when it is taken away." },
      { label: "Heat from the warm leaves", role: "output", carrier: "energy", why: "Most of the absorbed sunlight leaves again as low-grade heat." },
    ],
  },
  {
    key: "fridge", name: "A kitchen refrigerator", boundary: "the insulated cabinet and its motor",
    items: [
      { label: "Electricity from the wall socket", role: "input", carrier: "energy", why: "The only energy input the fridge has." },
      { label: "Warm milk put on the shelf", role: "input", carrier: "matter", why: "Matter crossing in, carrying thermal energy with it." },
      { label: "Heat pumped out at the back coils", role: "output", carrier: "energy", why: "A fridge is a heat mover: everything it removes leaves at the back." },
      { label: "Cold milk taken out again", role: "output", carrier: "matter", why: "The same matter crossing back out, colder." },
      { label: "The compressor", role: "inside", carrier: "part", why: "A working part. It is inside the boundary you drew." },
      { label: "The foam inside the door", role: "inside", carrier: "part", why: "Insulation is part of the boundary itself, not a flow through it." },
      { label: "Frost on the freezer shelf", role: "inside", carrier: "part", why: "Water that has moved around inside without ever leaving." },
      { label: "Warm air rushing in at the open door", role: "input", carrier: "matter", why: "Matter and energy both cross in the moment you open the door." },
      { label: "The hum of the motor", role: "output", carrier: "energy", why: "Sound energy radiating out into the kitchen." },
      { label: "The little bulb behind the door", role: "inside", carrier: "part", why: "A component of the fridge, sitting inside the line." },
    ],
  },
  {
    key: "phone", name: "A phone being charged", boundary: "the phone's glass and metal shell",
    items: [
      { label: "Electricity from the charger", role: "input", carrier: "energy", why: "Energy crossing in along the charging cable." },
      { label: "Radio signal from the mast", role: "input", carrier: "energy", why: "The phone absorbs energy from the incoming signal." },
      { label: "Light from the screen", role: "output", carrier: "energy", why: "Every photon you read by has left the system." },
      { label: "Sound from the speaker", role: "output", carrier: "energy", why: "Sound energy crossing out through the case." },
      { label: "Heat from the processor", role: "output", carrier: "energy", why: "The reason a phone gets warm while it charges." },
      { label: "The lithium battery", role: "inside", carrier: "part", why: "A component. It stores energy inside the boundary." },
      { label: "A tap of your finger on the glass", role: "input", carrier: "energy", why: "A tiny push of mechanical energy crossing in." },
      { label: "Radio signal sent back to the mast", role: "output", carrier: "energy", why: "The phone transmits as well as receives." },
      { label: "The camera lens", role: "inside", carrier: "part", why: "A part of the phone, not something crossing its boundary." },
      { label: "Charge stored in the battery", role: "inside", carrier: "part", why: "Stored, not crossing. Storage happens inside the line." },
    ],
  },
];

const SORT_INDEX: Record<string, SortSystem> = Object.fromEntries(
  SORT_SYSTEMS.map((s) => [s.key, s]),
);

function sortSystemOf(params: ParamValues): SortSystem {
  return SORT_INDEX[String(params.system)] ?? SORT_SYSTEMS[0];
}

/* Fixed console geometry, shared by the model's hit test and the renderer. */
const BELT_Y = 118;
const SPAWN_X = 660;
const GATE_X = 96;
const CHUTE_Y = 236;
const CHUTE_W = 152;
const CHUTE_H = 76;
const CHUTE_GAP = 14;
const CHUTE_X0 = 28;

const CHUTE_ROLES: SortRole[] = ["input", "output", "inside"];

function chuteRect(i: number): Rect {
  return { x: CHUTE_X0 + i * (CHUTE_W + CHUTE_GAP), y: CHUTE_Y, w: CHUTE_W, h: CHUTE_H };
}

export function chuteHit(x: number, y: number): SortRole | null {
  for (let i = 0; i < 3; i++) {
    if (inside(chuteRect(i), x, y)) return CHUTE_ROLES[i];
  }
  return null;
}

interface SortFeedback {
  role: SortRole;
  correctRole: SortRole;
  itemLabel: string;
  why: string;
  right: boolean;
  age: number;
  /** Which chute the crate is dropping into, so the animation has a target. */
  chute: number;
}

interface SortState {
  t: number;
  order: number[];
  cursor: number;
  x: number;
  correct: number;
  wrong: number;
  missed: number;
  streak: number;
  best: number;
  feedback: SortFeedback | null;
  done: boolean;
}

function shuffled(n: number, ctx: SimContext): number[] {
  const a: number[] = [];
  for (let i = 0; i < n; i++) a.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = ctx.rng.int(0, i);
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function freshSort(params: ParamValues, ctx: SimContext): SortState {
  const sys = sortSystemOf(params);
  return {
    t: 0,
    order: shuffled(sys.items.length, ctx),
    cursor: 0,
    x: SPAWN_X,
    correct: 0, wrong: 0, missed: 0, streak: 0, best: 0,
    feedback: null,
    done: false,
  };
}

const sortModel: SimModel<SortState> = {
  init(params, ctx) {
    return freshSort(params, ctx);
  },

  applyParams(state, params, prev, ctx) {
    if (params.system !== prev.system || params.itemCount !== prev.itemCount) {
      return freshSort(params, ctx);
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const sys = sortSystemOf(params);
    const total = Math.min(params.itemCount as number, sys.items.length);
    if (s.done) return { ...s, t: s.t + dt };

    const advance = (next: SortState): SortState => {
      const cursor = next.cursor + 1;
      return { ...next, cursor, x: SPAWN_X, feedback: next.feedback, done: cursor >= total };
    };

    /* --- the student choosing a chute --- */
    for (const input of inputs) {
      if (input.type !== "pointerdown" || s.feedback) continue;
      const picked = chuteHit(input.x, input.y);
      if (!picked) continue;
      const item = sys.items[s.order[s.cursor]];
      const right = picked === item.role;
      const streak = right ? s.streak + 1 : 0;
      s = {
        ...s,
        correct: s.correct + (right ? 1 : 0),
        wrong: s.wrong + (right ? 0 : 1),
        streak,
        best: Math.max(s.best, streak),
        feedback: {
          role: picked, correctRole: item.role, itemLabel: item.label, why: item.why,
          right, age: 0, chute: CHUTE_ROLES.indexOf(picked),
        },
      };
    }

    /* --- feedback plays out, then the next crate rides in --- */
    if (s.feedback) {
      const age = s.feedback.age + dt;
      if (age > 1.6) return advance({ ...s, t: s.t + dt, feedback: null });
      return { ...s, t: s.t + dt, feedback: { ...s.feedback, age } };
    }

    /* --- the belt --- */
    const speed = params.beltSpeed as number;
    const x = s.x - speed * dt;
    if (x < GATE_X - 40) {
      const item = sys.items[s.order[s.cursor]];
      return advance({
        ...s, t: s.t + dt, x, missed: s.missed + 1, streak: 0,
        feedback: {
          role: item.role, correctRole: item.role, itemLabel: item.label, why: item.why,
          right: false, age: 1.2, chute: -1,
        },
      });
    }
    return { ...s, t: s.t + dt, x };
  },

  readouts(state, params) {
    const sys = sortSystemOf(params);
    const total = Math.min(params.itemCount as number, sys.items.length);
    const judged = state.correct + state.wrong + state.missed;
    return [
      { key: "correct", label: "Sorted correctly", quantity: q(state.correct, "count"), semantic: "producer", graphable: true },
      { key: "wrong", label: "Wrong chute", quantity: q(state.wrong, "count"), semantic: "acceleration", graphable: true },
      { key: "missed", label: "Fell off the belt", quantity: q(state.missed, "count"), semantic: "distance", graphable: false },
      { key: "streak", label: "Streak", quantity: q(state.streak, "count"), semantic: "energy-kinetic", graphable: true },
      {
        key: "accuracy", label: "Accuracy",
        quantity: q(judged > 0 ? state.correct / judged : 0, "percent"), unit: "%",
        semantic: "energy-total", graphable: true,
      },
      { key: "remaining", label: "Crates left", quantity: q(Math.max(0, total - state.cursor), "count"), semantic: "time", graphable: false },
    ];
  },

  facts(state, params) {
    const sys = sortSystemOf(params);
    const total = Math.min(params.itemCount as number, sys.items.length);
    const judged = state.correct + state.wrong + state.missed;
    return {
      system: sys.key,
      systemName: sys.name,
      boundaryText: sys.boundary,
      total,
      correct: state.correct,
      wrong: state.wrong,
      missed: state.missed,
      judged,
      bestStreak: state.best,
      streak: state.streak,
      accuracy: judged > 0 ? state.correct / judged : 0,
      perfect: state.done && state.wrong === 0 && state.missed === 0,
      done: state.done,
    };
  },
};

/* ---- view ---------------------------------------------------------- */

const ROLE_LOOK: Record<SortRole, { title: string; sub: string; tint: string }> = {
  input: { title: "INPUT", sub: "crosses in", tint: "producer" },
  output: { title: "OUTPUT", sub: "crosses out", tint: "decomposer" },
  inside: { title: "INSIDE", sub: "never crosses", tint: "distance" },
};

/** Break a label onto at most two lines that fit a given width. */
function wrapTwo(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  if (ctx.measureText(text).width <= maxW) return [text];
  const words = text.split(" ");
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    if (ctx.measureText(a).width <= maxW) best = i;
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function drawSystemArt(
  ctx: CanvasRenderingContext2D, theme: ThemeColors, key: string,
  x: number, y: number, w: number, h: number, t: number,
) {
  const cx = x + w / 2, cy = y + h / 2;
  const s = Math.min(w, h);
  spriteShadowEllipse(ctx, cx, y + h - 6, s * 0.36, 8);
  switch (key) {
    case "toaster": {
      metal(ctx, cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.4, theme.inkSoft, { radius: 8 });
      for (const dx of [-0.11, 0.05]) {
        ctx.save();
        ctx.fillStyle = hexA(theme.sci["hot"], 0.5 + 0.3 * pulse(t, 0.6));
        roundRect(ctx, cx + dx * s, cy - s * 0.22, s * 0.06, s * 0.05, 2);
        ctx.fill();
        ctx.restore();
      }
      glow(ctx, cx, cy - s * 0.2, s * 0.28, theme.sci["hot"], 0.3 + 0.08 * pulse(t, 0.6));
      metal(ctx, cx + s * 0.24, cy - s * 0.08, s * 0.05, s * 0.18, theme.inkSoft, { radius: 2 });
      break;
    }
    case "bike": {
      const r = s * 0.15;
      for (const dx of [-s * 0.2, s * 0.2]) {
        ctx.save();
        ctx.strokeStyle = theme.inkSoft;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + s * 0.12, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const a = t * 3 + (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(cx + dx, cy + s * 0.12);
          ctx.lineTo(cx + dx + Math.cos(a) * r, cy + s * 0.12 + Math.sin(a) * r);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy + s * 0.12);
      ctx.lineTo(cx - s * 0.02, cy - s * 0.06);
      ctx.lineTo(cx + s * 0.2, cy + s * 0.12);
      ctx.lineTo(cx, cy + s * 0.12);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      sphere(ctx, cx - s * 0.02, cy - s * 0.2, s * 0.07, theme.sci["primary-consumer"]);
      break;
    }
    case "plant": {
      plastic(ctx, cx - s * 0.14, cy + s * 0.06, s * 0.28, s * 0.2, theme.sci["decomposer"], { radius: 4 });
      ctx.save();
      ctx.strokeStyle = theme.sci["producer"];
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.06);
      ctx.lineTo(cx + Math.sin(t) * 3, cy - s * 0.2);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        const f = 0.2 + i * 0.18;
        const side = i % 2 === 0 ? 1 : -1;
        ctx.save();
        ctx.fillStyle = hexA(theme.sci["producer"], 0.9);
        ctx.beginPath();
        ctx.ellipse(cx + side * s * 0.09, cy + s * 0.06 - f * s * 0.26, s * 0.08, s * 0.035,
          side * 0.4 + Math.sin(t + i) * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "fridge": {
      metal(ctx, cx - s * 0.18, cy - s * 0.3, s * 0.36, s * 0.6, theme.inkSoft, { radius: 6 });
      ctx.save();
      ctx.strokeStyle = hexA(theme.surface, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.18, cy - s * 0.02);
      ctx.lineTo(cx + s * 0.18, cy - s * 0.02);
      ctx.stroke();
      ctx.restore();
      metal(ctx, cx + s * 0.1, cy - s * 0.24, s * 0.03, s * 0.14, theme.surface, { radius: 2 });
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["hot"], 0.5 + 0.2 * pulse(t, 0.5));
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const yy = cy - s * 0.2 + i * s * 0.09;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.19, yy);
        ctx.lineTo(cx + s * 0.29, yy);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    default: {
      const pw = s * 0.24, ph = s * 0.46;
      plastic(ctx, cx - pw / 2, cy - ph / 2, pw, ph, theme.inkSoft, { radius: 7 });
      ctx.save();
      ctx.fillStyle = hexA(theme.sci["light"], 0.35 + 0.12 * pulse(t, 0.5));
      roundRect(ctx, cx - pw / 2 + 4, cy - ph / 2 + 7, pw - 8, ph - 16, 3);
      ctx.fill();
      ctx.restore();
      glow(ctx, cx, cy, s * 0.3, theme.sci["light"], 0.22);
      break;
    }
  }
}

function sortRender(rc: RenderContext<SortState>) {
  const { ctx, theme, width, height, state, params, band, overlays } = rc;
  const sys = sortSystemOf(params);
  const t = state.t;
  const total = Math.min(params.itemCount as number, sys.items.length);

  /* --- the workshop --- */
  sky(ctx, width, height, theme, "indoor", height);
  gradientFill(ctx, 0, 0, width, height, [
    hexA(theme.surfaceAlt, 0.0), hexA(theme.ink, isDarkTheme(theme) ? 0.18 : 0.06),
  ], 90);
  ctx.save();
  ctx.strokeStyle = hexA(theme.grid, 0.5);
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  ctx.restore();
  // two work lamps hanging over the line
  for (const lx of [GATE_X + 40, CHUTE_X0 + CHUTE_W * 2]) {
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["light"], 0.07);
    ctx.beginPath();
    ctx.moveTo(lx - 12, 0);
    ctx.lineTo(lx + 12, 0);
    ctx.lineTo(lx + 120, height);
    ctx.lineTo(lx - 120, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* --- the system this line is sorting for --- */
  if (width > 700) {
    const artX = CHUTE_X0 + 3 * (CHUTE_W + CHUTE_GAP) + 24;
    const artW = width - artX - 20;
    const artY = CHUTE_Y - 60;
    const artH = Math.min(height - artY - 20, 210);
    if (artW > 130) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.accent, 0.7);
      ctx.lineWidth = 1.8;
      ctx.setLineDash([9, 6]);
      ctx.lineDashOffset = -t * 9;
      roundRect(ctx, artX, artY, artW, artH, 10);
      ctx.stroke();
      ctx.restore();
      drawSystemArt(ctx, theme, sys.key, artX, artY, artW, artH, t);
      caption(ctx, artX + artW / 2, artY - 12, "THE SYSTEM", theme, {
        align: "center", size: 9.5, color: theme.accent, weight: 800,
      });
      caption(ctx, artX + artW / 2, artY + artH + 14, sys.boundary, theme, {
        align: "center", size: 10.5, color: theme.inkSoft,
      });
    }
  }

  /* --- the conveyor --- */
  const beltX1 = Math.max(SPAWN_X + 40, width - 8);
  metal(ctx, 8, BELT_Y + 20, beltX1 - 8, 12, theme.inkSoft, { radius: 4 });
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, isDarkTheme(theme) ? 0.55 : 0.28);
  roundRect(ctx, 8, BELT_Y + 4, beltX1 - 8, 18, 6);
  ctx.fill();
  ctx.restore();
  dashFlow(ctx, [{ x: beltX1 - 6, y: BELT_Y + 13 }, { x: 12, y: BELT_Y + 13 }],
    theme.inkSoft, t * (params.beltSpeed as number), { width: 10, dash: 9, gap: 13, alpha: 0.35 });
  for (let i = 0; i < 9; i++) {
    const rx = 22 + i * ((beltX1 - 44) / 8);
    if (rx > beltX1 - 12) continue;
    sphere(ctx, rx, BELT_Y + 26, 6, theme.inkSoft);
    ctx.save();
    ctx.strokeStyle = hexA(theme.surface, 0.6);
    ctx.lineWidth = 1.4;
    const a = -t * ((params.beltSpeed as number) / 6);
    ctx.beginPath();
    ctx.moveTo(rx, BELT_Y + 26);
    ctx.lineTo(rx + Math.cos(a) * 4.4, BELT_Y + 26 + Math.sin(a) * 4.4);
    ctx.stroke();
    ctx.restore();
  }

  // the scanner gate the crate must be judged at
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.55 + 0.2 * pulse(t, 0.9));
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(GATE_X, BELT_Y - 42);
  ctx.lineTo(GATE_X, CHUTE_Y - 8);
  ctx.stroke();
  ctx.restore();
  caption(ctx, GATE_X, BELT_Y - 50, "boundary", theme, {
    align: "center", size: 10, color: theme.accent, weight: 800,
  });

  /* --- the crate on the belt --- */
  const fb = state.feedback;
  if (!state.done && state.cursor < total) {
    const item = sys.items[state.order[state.cursor]];
    let cx = state.x;
    let cy = BELT_Y - 10;
    let tilt = 0;
    if (fb) {
      const p = easeInOut(clamp01(fb.age / 1.1));
      if (fb.chute >= 0) {
        const target = chuteRect(fb.chute);
        cx = lerp(state.x, target.x + target.w / 2, p);
        cy = lerp(BELT_Y - 10, target.y + 24, p);
        tilt = p * (fb.right ? 0.1 : -0.25);
      } else {
        cy = BELT_Y - 10 + p * 90;
        tilt = p * 0.6;
      }
    }
    const cw = 132, ch = 54;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    spriteShadowEllipse(ctx, 0, ch / 2 + 8, cw * 0.42, 6);
    const crateCol = fb
      ? (fb.right ? theme.sci["producer"] : theme.sci["acceleration"])
      : theme.surfaceAlt;
    plastic(ctx, -cw / 2, -ch / 2, cw, ch, crateCol, { radius: 6, gloss: 0.45 });
    rimLight(ctx, (c) => roundRect(c, -cw / 2, -ch / 2, cw, ch, 6), theme.sci["light"],
      { width: 1.4, alpha: 0.5 });
    ctx.font = "600 11px \"Bricolage Grotesque\", system-ui, sans-serif";
    const lines = wrapTwo(ctx, item.label, cw - 16);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.ink;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, 0, (lines.length === 1 ? 0 : -7 + i * 14) - 4);
    });
    if (params.showCarrier !== false && item.carrier !== "part") {
      const chip = item.carrier === "matter" ? theme.sci["mass"] : theme.sci["energy-total"];
      ctx.fillStyle = hexA(chip, 0.9);
      roundRect(ctx, -26, ch / 2 - 17, 52, 12, 6);
      ctx.fill();
      ctx.font = "700 8px ui-monospace, monospace";
      ctx.fillStyle = theme.surface;
      ctx.fillText(item.carrier.toUpperCase(), 0, ch / 2 - 11);
    }
    ctx.restore();
  }

  /* --- the three chutes --- */
  for (let i = 0; i < 3; i++) {
    const r = chuteRect(i);
    if (r.x + r.w > width) continue;
    const role = CHUTE_ROLES[i];
    const look = ROLE_LOOK[role];
    const col = theme.sci[look.tint];
    const live = !state.done && !fb;
    const glowAmt = live ? 0.16 + 0.08 * pulse(t + i * 0.4, 0.6) : 0.08;
    softShadow(ctx, () => {
      bevelRect(ctx, r.x, r.y, r.w, r.h, 9, mixHex(theme.surfaceAlt, col, 0.16), { depth: 1.4 });
    }, { blur: 12, dy: 4, alpha: 0.28 });
    innerGlow(ctx, (c) => roundRect(c, r.x, r.y, r.w, r.h, 9), col,
      { inset: 9, alpha: glowAmt, steps: 3 });
    // the mouth of the chute
    ctx.save();
    ctx.fillStyle = hexA(theme.ink, isDarkTheme(theme) ? 0.5 : 0.22);
    roundRect(ctx, r.x + 10, r.y + 8, r.w - 20, 14, 6);
    ctx.fill();
    ctx.restore();
    caption(ctx, r.x + r.w / 2, r.y + 40, look.title, theme, {
      align: "center", size: 16, color: col, weight: 800,
    });
    caption(ctx, r.x + r.w / 2, r.y + 58, look.sub, theme, {
      align: "center", size: 10.5, color: theme.inkSoft,
    });
    // an arrow that says which way this chute means
    const ax = r.x + 18, ay = r.y + 15;
    if (role === "input") arrow(ctx, ax - 8, ay, ax + 10, ay, col, { width: 2, head: 7 });
    else if (role === "output") arrow(ctx, ax + 10, ay, ax - 8, ay, col, { width: 2, head: 7 });
    else sphere(ctx, ax + 1, ay, 4, col);
  }

  /* --- scoreboard --- */
  const hudW = 168, hudX = width - hudW - 12;
  softShadow(ctx, () => {
    ctx.fillStyle = hexA(theme.surface, 0.9);
    roundRect(ctx, hudX, 12, hudW, 64, 9);
    ctx.fill();
  }, { blur: 10, dy: 3, alpha: 0.24 });
  caption(ctx, hudX + 12, 27, sys.name, theme, { size: 10.5, color: theme.inkSoft, weight: 700 });
  caption(ctx, hudX + 12, 50, `${state.correct}`, theme, {
    size: 22, color: theme.sci["producer"], weight: 800,
  });
  caption(ctx, hudX + 12, 66, "right", theme, { size: 9.5, color: theme.inkSoft });
  caption(ctx, hudX + 72, 50, `${state.wrong + state.missed}`, theme, {
    size: 22, color: theme.sci["acceleration"], weight: 800,
  });
  caption(ctx, hudX + 72, 66, "wrong", theme, { size: 9.5, color: theme.inkSoft });
  caption(ctx, hudX + 128, 50, `${state.streak}`, theme, {
    size: 22, color: theme.sci["energy-kinetic"], weight: 800,
  });
  caption(ctx, hudX + 128, 66, "streak", theme, { size: 9.5, color: theme.inkSoft });

  /* --- what just happened, and why --- */
  if (fb && band !== "K-2" && overlays.explain !== false) {
    const panelY = height - 62;
    const panelW = Math.min(width - 24, 620);
    const panelX = 12;
    const col = fb.right ? theme.sci["producer"] : theme.sci["acceleration"];
    const appear = easeInOut(clamp01(fb.age / 0.35));
    ctx.save();
    ctx.globalAlpha = appear;
    softShadow(ctx, () => {
      ctx.fillStyle = hexA(theme.surface, 0.94);
      roundRect(ctx, panelX, panelY, panelW, 50, 9);
      ctx.fill();
    }, { blur: 12, dy: 3, alpha: 0.26 });
    ctx.strokeStyle = hexA(col, 0.6);
    ctx.lineWidth = 1.4;
    roundRect(ctx, panelX, panelY, panelW, 50, 9);
    ctx.stroke();
    ctx.fillStyle = col;
    roundRect(ctx, panelX, panelY, 4, 50, 2);
    ctx.fill();
    const head = fb.chute < 0
      ? `Missed — "${fb.itemLabel}" was an ${ROLE_LOOK[fb.correctRole].title.toLowerCase()}`
      : fb.right
        ? `Correct — ${ROLE_LOOK[fb.correctRole].title.toLowerCase()}`
        : `Not quite — that was an ${ROLE_LOOK[fb.correctRole].title.toLowerCase()}`;
    caption(ctx, panelX + 14, panelY + 17, head, theme, { size: 12, color: col, weight: 800 });
    ctx.font = "500 11px \"Bricolage Grotesque\", system-ui, sans-serif";
    const why = wrapTwo(ctx, fb.why, panelW - 30);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.inkSoft;
    why.forEach((ln, i) => ctx.fillText(ln, panelX + 14, panelY + 33 + i * 13));
    ctx.restore();
  }

  /* --- end of the run --- */
  if (state.done) {
    const judged = state.correct + state.wrong + state.missed;
    const pct = judged > 0 ? (state.correct / judged) * 100 : 0;
    const bw2 = 320, bh2 = 108;
    const bx2 = (width - bw2) / 2, by2 = height / 2 - bh2 / 2;
    softShadow(ctx, () => {
      ctx.fillStyle = hexA(theme.surface, 0.96);
      roundRect(ctx, bx2, by2, bw2, bh2, 12);
      ctx.fill();
    }, { blur: 22, dy: 8, alpha: 0.34 });
    innerGlow(ctx, (c) => roundRect(c, bx2, by2, bw2, bh2, 12), theme.accent,
      { inset: 12, alpha: 0.2, steps: 3 });
    caption(ctx, bx2 + bw2 / 2, by2 + 26, "Line complete", theme, {
      align: "center", size: 16, color: theme.accent, weight: 800,
    });
    caption(ctx, bx2 + bw2 / 2, by2 + 60, `${fx(pct, 0)} %`, theme, {
      align: "center", size: 34, color: theme.sci["producer"], weight: 800,
    });
    caption(ctx, bx2 + bw2 / 2, by2 + 88,
      `${state.correct} of ${judged} sorted correctly · best streak ${state.best}`, theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
  }

  noiseWash(ctx, 0, 0, width, height, { alpha: 0.035, seed: 8 });
  vignette(ctx, width, height, 0.2);
}

export const g6a2FlowSorter: SimManifest<SortState> = {
  id: "g6a2-flow-sorter",
  title: "Input, Output, Inside",
  tagline: "Sort what crosses the line from what never leaves, one crate at a time.",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [4, 5, 6, 7, 8],
  standards: { ngss: ["MS-ETS1-1", "MS-LS1-6", "MS-PS3-3"] },
  learningGoals: [
    "Name the inputs and outputs of an everyday system.",
    "Tell a flow that crosses the boundary from a part that sits inside it.",
    "Say whether each flow is matter or energy.",
  ],
  misconceptions: [
    "Anything inside the system counts as an input",
    "Only matter can be an input or an output",
    "Heat and sound leaving a device are not really outputs",
    "Something stored inside a system has left it",
  ],
  interactionHint: "Tap the chute where the crate belongs.",
  params: {
    system: {
      type: "option", label: "System on the line",
      options: SORT_SYSTEMS.map((s) => ({ value: s.key, label: s.name })),
      default: "toaster",
    },
    beltSpeed: {
      type: "number", label: "Belt speed", kind: "ratio",
      min: 12, max: 70, step: 2, default: 30,
      help: "Faster belt, less thinking time.",
    },
    itemCount: {
      type: "number", label: "Crates in the run", kind: "count",
      min: 5, max: 10, step: 1, default: 10,
    },
    showCarrier: {
      type: "boolean", label: "Show matter / energy tag", default: true, bands: ["3-5", "6-8"],
    },
  },
  overlays: [
    { key: "explain", label: "Explain each answer", default: true },
  ],
  model: sortModel,
  render: sortRender,
  labs: [
    {
      id: "parts-are-not-flows",
      title: "A part is not an input",
      question: "Is the heating wire inside a toaster one of the toaster's inputs?",
      bands: ["3-5", "6-8"],
      minutes: 15,
      setup: { system: "toaster", beltSpeed: 22, itemCount: 10, showCarrier: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before the belt starts.",
          predict: {
            prompt: "Which chute does the nichrome heating wire belong in?",
            options: ["Input", "Output", "Inside"],
            correct: 2,
            reveal: "It is a part of the toaster. Parts sit inside the boundary; only flows cross it.",
          },
        },
        {
          id: "sort",
          phase: "measure",
          title: "Sort the toaster line",
          instruction: "Work through all ten crates. Aim for at least seven right.",
          check: {
            describe: "Seven or more sorted correctly",
            test: (v) => (v.facts.correct as number) >= 7,
          },
          hints: [
            "Ask yourself: does this thing move across the case, or does it live inside it?",
            "Heat, light and sound all leave the toaster, so they are outputs.",
          ],
        },
        {
          id: "list",
          phase: "analyze",
          title: "Write the two lists",
          instruction: "List the toaster's inputs and its outputs from what you sorted.",
          write: {
            prompt: "Inputs of the toaster: ... Outputs of the toaster: ...",
            placeholder: "Inputs: ... Outputs: ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say the difference",
          instruction: "One sentence separating a part from a flow.",
          write: {
            prompt: "How do you decide whether something is an input or just a part of the system?",
            placeholder: "Something is an input only if ...",
          },
        },
      ],
    },
    {
      id: "living-system",
      title: "The same rules for a living system",
      question: "Does a rider on a bicycle have inputs and outputs like a machine does?",
      bands: ["3-5", "6-8"],
      minutes: 18,
      setup: { system: "bike", beltSpeed: 24, itemCount: 10, showCarrier: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you sort anything.",
          predict: {
            prompt: "Roughly how much of the food energy a cyclist uses leaves the system as heat?",
            options: ["About a tenth", "About a quarter", "About three quarters"],
            correct: 2,
            reveal: "Around three quarters. Human muscle turns only about 20 to 25 percent of food energy into movement.",
          },
        },
        {
          id: "sort",
          phase: "measure",
          title: "Sort the rider and bike",
          instruction: "Sort all ten crates with at least seventy percent accuracy.",
          check: {
            describe: "Run finished with 70 percent or better",
            test: (v) => Boolean(v.facts.done) && (v.facts.accuracy as number) >= 0.7,
          },
          hints: ["The chain never leaves the system, however fast it turns."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare with the toaster",
          instruction: "Switch to the toaster and sort a few crates, then compare.",
          write: {
            prompt: "What do a toaster and a cyclist have in common when you look at their inputs and outputs?",
            placeholder: "Both systems take in ... and both give out ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "State it for any system at all.",
          write: {
            prompt: "Write one rule about inputs and outputs that works for machines and living things alike.",
            placeholder: "Every system ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "ten-in-a-row",
      title: "Ten in a row",
      brief: "Sort ten crates in a row without a single mistake.",
      bands: ["3-5", "6-8"],
      setup: { system: "plant", beltSpeed: 30, itemCount: 10, showCarrier: true },
      goal: {
        describe: "A streak of five",
        test: (v) => (v.facts.bestStreak as number) >= 5,
      },
      stars: {
        two: { describe: "A streak of eight", test: (v) => (v.facts.bestStreak as number) >= 8 },
        three: { describe: "A streak of ten", test: (v) => (v.facts.bestStreak as number) >= 10 },
      },
      hints: [
        "Slow the belt down while you build the streak.",
        "Storage — sugar, charge, frost — always belongs in the INSIDE chute.",
      ],
    },
    {
      id: "clean-sweep",
      title: "Clean sweep at speed",
      brief: "Finish a whole run with nothing wrong and nothing missed, on a fast belt.",
      bands: ["6-8"],
      setup: { system: "phone", beltSpeed: 46, itemCount: 10, showCarrier: false },
      goal: {
        describe: "A finished run with no mistakes",
        test: (v) => Boolean(v.facts.perfect),
      },
      stars: {
        two: {
          describe: "Perfect with the belt at 40 or faster",
          test: (v) => Boolean(v.facts.perfect) && (v.params.beltSpeed as number) >= 40,
        },
        three: {
          describe: "Perfect at 40 or faster with the matter and energy tags hidden",
          test: (v) =>
            Boolean(v.facts.perfect) && (v.params.beltSpeed as number) >= 40 &&
            v.params.showCarrier === false,
        },
      },
      hints: [
        "Radio signals travel both ways: one crate is an input and one is an output.",
        "Anything the phone stores rather than sends stays inside the line.",
      ],
    },
  ],
};
