import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, dashFlow, easeInOut, glass,
  glow, gradient, groundPlane, hexA, innerGlow, isDarkTheme, labelLeader,
  lerp, material, metal, noiseWash, particleField, plastic, pulse, ribbon, rimLight,
  sky, softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 6 · Unit A · Topic A2 — Boundaries, inputs and outputs.
 *
 * A system is not something you find lying about in the world. It is a line
 * you decide to draw, and everything else — what counts as an input, what
 * counts as an output, what is "just internal plumbing" — follows from where
 * you put that line. Move the line and not one atom changes, yet the answer
 * to your question changes completely.
 *
 *   A2.1  Drawing a system's boundary         → Draw the Boundary
 *   A2.2  Open vs closed systems              → Open, Closed, Sealed
 *   A2.3  Inputs and outputs                  → Crossing Check
 *   A2.4  Tracing matter and energy           → Follow the Atom
 *   A2.5  Choosing a boundary for a purpose   → Where Do You Draw the Line
 *
 * Every number on these stages is one a student could check in a textbook:
 * 900 W/m² of midday sunshine, a 150 W grow lamp, water's 2260 J/g latent
 * heat, 4.18 J/(g·K) for liquid water, 2310 g of CO2 from a litre of petrol,
 * the ten-percent rule between one feeding level and the next.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

/** Fixed decimals. Nothing on a stage is ever a raw float. */
function fx(v: number, dp = 1): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

/** A watt value written the way an engineer would say it aloud. */
function watts(w: number): string {
  if (Math.abs(w) >= 1000) return `${fx(w / 1000, 2)} kW`;
  return `${fx(w, 0)} W`;
}

interface Rect { x: number; y: number; w: number; h: number }
interface Pt { x: number; y: number }

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t),
  };
}

/** A quadratic bend from a to b, sampled for ribbons and marching dashes. */
function curve(a: Pt, b: Pt, bend: number, n = 20): Pt[] {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({
      x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
      y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
    });
  }
  return out;
}

/** Shorten a path at both ends so arrows start clear of the parts they join. */
function trimPath(pts: Pt[], head: number, tail: number): Pt[] {
  if (pts.length < 3) return pts;
  const n = pts.length;
  const a = Math.min(n - 2, Math.max(0, Math.round(head)));
  const b = Math.max(a + 2, n - Math.max(0, Math.round(tail)));
  return pts.slice(a, b);
}

/**
 * A design-space to screen-space fit. Every scene here is laid out on a fixed
 * 1000 x 620 board, then scaled to whatever canvas the shell hands over, so
 * the model can animate geometry it will never have to measure.
 */
interface Fit { s: number; X: (x: number) => number; Y: (y: number) => number; L: (v: number) => number }

function fitBoard(width: number, height: number, bw = 1000, bh = 620): Fit {
  const s = Math.min(width / bw, height / bh);
  const ox = (width - bw * s) / 2;
  const oy = (height - bh * s) / 2;
  return { s, X: (x) => ox + x * s, Y: (y) => oy + y * s, L: (v) => v * s };
}

/** Three chips naming what the colours on the stage mean. */
function crossingKey(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  theme: RenderContext<unknown>["theme"],
  items: { label: string; color: string }[],
) {
  ctx.save();
  ctx.font = '600 11px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textBaseline = "middle";
  let cx = x;
  for (const it of items) {
    const w = ctx.measureText(it.label).width + 26;
    softShadow(ctx, () => {
      ctx.fillStyle = isDarkTheme(theme) ? "rgba(16,22,30,0.86)" : "rgba(255,255,255,0.9)";
      roundRect(ctx, cx, y, w, 22, 7);
      ctx.fill();
    }, { blur: 7, dy: 2, alpha: 0.18 });
    ctx.strokeStyle = hexA(it.color, 0.5);
    ctx.lineWidth = 1;
    roundRect(ctx, cx + 0.5, y + 0.5, w - 1, 21, 6.5);
    ctx.stroke();
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(cx + 12, y + 11, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    ctx.fillText(it.label, cx + 21, y + 11.5);
    cx += w + 7;
  }
  ctx.restore();
}

/* ================================================================== *
 * 1 · Draw the Boundary  (A2.1, A2.3, A2.5)
 *
 * A hobby greenhouse at the end of a garden. Nothing on the stage moves
 * when the student changes the boundary — the sun still shines, the pump
 * still waters, the leaves still breathe. Only the bookkeeping changes.
 * ================================================================== */

interface GNode { x: number; y: number; name: string }

const G_NODES: Record<string, GNode> = {
  sun: { x: 112, y: 118, name: "Sun" },
  cloud: { x: 812, y: 100, name: "Rain cloud" },
  grid: { x: 58, y: 318, name: "Mains supply" },
  outAir: { x: 934, y: 246, name: "Outside air" },
  outSoil: { x: 150, y: 552, name: "Garden soil" },
  compost: { x: 828, y: 470, name: "Compost heap" },
  air: { x: 352, y: 326, name: "Greenhouse air" },
  lamp: { x: 470, y: 302, name: "Grow lamp" },
  tank: { x: 306, y: 450, name: "Water butt" },
  pot: { x: 560, y: 472, name: "Pot soil" },
  plant: { x: 560, y: 372, name: "Tomato plant" },
};

interface GBoundary { key: string; name: string; sub: string; rect: Rect; members: string[] }

const G_BOUNDS: GBoundary[] = [
  {
    key: "plant", name: "The plant only", sub: "leaves, stem and roots",
    rect: { x: 502, y: 318, w: 118, h: 136 },
    members: ["plant"],
  },
  {
    key: "pot", name: "Plant and pot", sub: "the plant with its soil",
    rect: { x: 492, y: 312, w: 138, h: 200 },
    members: ["plant", "pot"],
  },
  {
    key: "greenhouse", name: "The greenhouse", sub: "everything under the glass",
    rect: { x: 226, y: 218, w: 490, h: 300 },
    members: ["plant", "pot", "air", "lamp", "tank"],
  },
  {
    key: "garden", name: "The whole garden", sub: "glasshouse, heap and soil",
    rect: { x: 100, y: 200, w: 792, h: 386 },
    members: ["plant", "pot", "air", "lamp", "tank", "compost", "outSoil"],
  },
];

/** Live flow rates, in watts for energy and grams per hour for matter. */
interface GEnv {
  solar: number; toLeaves: number; toAir: number;
  lampW: number; lampLight: number; lampHeat: number;
  stored: number; heatOut: number;
  water: number; transpire: number; ventOut: number; condense: number;
  co2: number; o2: number; rain: number; litter: number; humus: number; decay: number;
}

function gEnv(params: Record<string, number | boolean | string>): GEnv {
  const cloud = clamp01((params.cloud as number) / 100);
  const lampW = params.lampPower as number;
  const water = params.watering as number;
  const vent = params.vent as boolean;
  const raining = params.rain as boolean;

  // 900 W/m² midday sun, 6 m² of floor, 78 % of it through horticultural glass.
  const irradiance = 900 * (1 - 0.85 * cloud);
  const solar = irradiance * 6 * 0.78;
  const toLeaves = solar * 0.25;
  const toAir = solar * 0.75;
  const lampLight = lampW * 0.4;
  const lampHeat = lampW * 0.6;
  // Crops bank roughly 1.5 % of the light that lands on a leaf as sugar.
  const stored = 0.015 * (toLeaves + lampLight);
  const heatOut = solar + lampW - stored;

  const transpire = water * 0.97;
  const ventOut = vent ? water * 0.94 : water * 0.06;
  const condense = transpire - ventOut;
  const co2 = 1.2 * clamp01((toLeaves + lampLight) / 1110);
  return {
    solar, toLeaves, toAir, lampW, lampLight, lampHeat, stored, heatOut,
    water, transpire, ventOut, condense,
    co2, o2: co2 * 0.727, rain: raining ? 420 : 0,
    litter: 1.3, humus: 0.9, decay: 0.4,
  };
}

type GKind = "energy" | "matter";
type GClass = "input" | "output" | "internal" | "outside";

interface GFlow {
  id: string; from: string; to: string; kind: GKind;
  label: string; bend: number; rate: (e: GEnv) => number;
}

const G_FLOWS: GFlow[] = [
  { id: "sunLeaf", from: "sun", to: "plant", kind: "energy", label: "Sunlight on the leaves", bend: -46, rate: (e) => e.toLeaves },
  { id: "sunAir", from: "sun", to: "air", kind: "energy", label: "Sun warming the air", bend: 34, rate: (e) => e.toAir },
  { id: "mains", from: "grid", to: "lamp", kind: "energy", label: "Mains electricity", bend: -58, rate: (e) => e.lampW },
  { id: "lampLight", from: "lamp", to: "plant", kind: "energy", label: "Lamp light", bend: 20, rate: (e) => e.lampLight },
  { id: "lampHeat", from: "lamp", to: "air", kind: "energy", label: "Lamp waste heat", bend: 26, rate: (e) => e.lampHeat },
  { id: "heatOut", from: "air", to: "outAir", kind: "energy", label: "Heat through the glass", bend: -40, rate: (e) => e.heatOut },
  { id: "co2", from: "air", to: "plant", kind: "matter", label: "Carbon dioxide in", bend: -30, rate: (e) => e.co2 },
  { id: "o2", from: "plant", to: "air", kind: "matter", label: "Oxygen out", bend: 34, rate: (e) => e.o2 },
  { id: "water", from: "tank", to: "pot", kind: "matter", label: "Watering", bend: 40, rate: (e) => e.water },
  { id: "uptake", from: "pot", to: "plant", kind: "matter", label: "Water and nutrients", bend: 14, rate: (e) => e.water },
  { id: "transpire", from: "plant", to: "air", kind: "matter", label: "Water vapour from leaves", bend: -22, rate: (e) => e.transpire },
  { id: "vent", from: "air", to: "outAir", kind: "matter", label: "Vapour out of the vent", bend: 44, rate: (e) => e.ventOut },
  { id: "condense", from: "air", to: "pot", kind: "matter", label: "Condensation running back", bend: -52, rate: (e) => e.condense },
  { id: "rain", from: "cloud", to: "tank", kind: "matter", label: "Rain into the butt", bend: 74, rate: (e) => e.rain },
  { id: "litter", from: "plant", to: "compost", kind: "matter", label: "Fallen leaves", bend: -34, rate: (e) => e.litter },
  { id: "humus", from: "compost", to: "outSoil", kind: "matter", label: "Humus into the soil", bend: 58, rate: (e) => e.humus },
  { id: "decay", from: "compost", to: "outAir", kind: "matter", label: "CO2 from decomposers", bend: -26, rate: (e) => e.decay },
];

function gBoundary(key: string): GBoundary {
  return G_BOUNDS.find((b) => b.key === key) ?? G_BOUNDS[2];
}

function gClassify(f: GFlow, members: readonly string[]): GClass {
  const a = members.includes(f.from);
  const b = members.includes(f.to);
  if (a && b) return "internal";
  if (!a && b) return "input";
  if (a && !b) return "output";
  return "outside";
}

interface G1State {
  t: number;
  key: string;
  ring: Rect;
  target: Rect;
  changedAt: number;
  /** Marching-dash phase, advanced by dt so replay is exact. */
  phase: number;
}

const g1Model: SimModel<G1State> = {
  init(params) {
    const b = gBoundary(params.boundary as string);
    return { t: 0, key: b.key, ring: { ...b.rect }, target: { ...b.rect }, changedAt: -9, phase: 0 };
  },

  applyParams(state, params) {
    const b = gBoundary(params.boundary as string);
    if (b.key === state.key) return state;
    return { ...state, key: b.key, target: { ...b.rect }, changedAt: state.t };
  },

  step(state, dt) {
    const k = 1 - Math.exp(-7 * dt);
    return {
      ...state,
      t: state.t + dt,
      phase: state.phase + dt * 34,
      ring: lerpRect(state.ring, state.target, k),
    };
  },

  readouts(state, params) {
    const e = gEnv(params);
    const b = gBoundary(state.key);
    let inputs = 0, outputs = 0, internal = 0;
    let eIn = 0, eOut = 0, mIn = 0, mOut = 0;
    for (const f of G_FLOWS) {
      const c = gClassify(f, b.members);
      const r = f.rate(e);
      if (c === "input") { inputs++; if (f.kind === "energy") eIn += r; else mIn += r; }
      else if (c === "output") { outputs++; if (f.kind === "energy") eOut += r; else mOut += r; }
      else if (c === "internal") internal++;
    }
    return [
      { key: "crossings", label: "Flows crossing the boundary", quantity: q(inputs + outputs, "count"), semantic: "distance", graphable: true },
      { key: "inputs", label: "Inputs", quantity: q(inputs, "count"), semantic: "cold", graphable: true },
      { key: "outputs", label: "Outputs", quantity: q(outputs, "count"), semantic: "hot", graphable: true },
      { key: "internal", label: "Stays inside", quantity: q(internal, "count"), semantic: "mass" },
      { key: "energyIn", label: "Energy in", quantity: q(eIn, "power"), unit: "W", semantic: "energy-total", graphable: true },
      { key: "energyOut", label: "Energy out", quantity: q(eOut, "power"), unit: "W", semantic: "energy-thermal", graphable: true },
      { key: "matterIn", label: "Matter in (g/h)", quantity: q(mIn, "ratio"), semantic: "mass", graphable: true },
      { key: "matterOut", label: "Matter out (g/h)", quantity: q(mOut, "ratio"), semantic: "mass", graphable: true },
      {
        key: "matterNet", label: "Matter kept (g/h)", quantity: q(mIn - mOut, "ratio"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const e = gEnv(params);
    const b = gBoundary(state.key);
    const cls: Record<string, GClass> = {};
    let inputs = 0, outputs = 0, internal = 0, outside = 0;
    let eIn = 0, eOut = 0, mIn = 0, mOut = 0;
    for (const f of G_FLOWS) {
      const c = gClassify(f, b.members);
      cls[f.id] = c;
      const r = f.rate(e);
      if (c === "input") { inputs++; if (f.kind === "energy") eIn += r; else mIn += r; }
      else if (c === "output") { outputs++; if (f.kind === "energy") eOut += r; else mOut += r; }
      else if (c === "internal") internal++;
      else outside++;
    }
    return {
      boundary: b.key,
      inputs, outputs, internal, outside,
      crossings: inputs + outputs,
      energyIn: eIn, energyOut: eOut, energyStored: e.stored,
      matterIn: mIn, matterOut: mOut, matterNet: mIn - mOut,
      clsMains: cls.mains, clsLampLight: cls.lampLight, clsSunLeaf: cls.sunLeaf,
      clsVent: cls.vent, clsLitter: cls.litter, clsUptake: cls.uptake,
      clsWater: cls.water, clsHumus: cls.humus,
      ventOpen: params.vent as boolean,
      lampOn: (params.lampPower as number) > 0,
    };
  },
};

function g1Render(rc: RenderContext<G1State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const f = fitBoard(width, height);
  const { X, Y, L } = f;
  const e = gEnv(params);
  const b = gBoundary(state.key);
  const horizon = Y(372);

  const IN = theme.sci["cold"];
  const OUT = theme.sci["hot"];
  const INSIDE = theme.sci["producer"];

  /* ---- the place ---- */
  sky(ctx, width, height, theme, "day", horizon);
  groundPlane(ctx, horizon, 0, width, height, theme, "grass");
  noiseWash(ctx, 0, horizon, width, height - horizon, { alpha: 0.05, seed: 21, count: 260 });

  // A hedge along the far boundary of the garden, so the lawn has a back wall.
  ctx.save();
  ctx.fillStyle = gradient(ctx, 0, horizon - L(46), width, L(46),
    [mixHex(theme.sci["producer"], "#000000", 0.42), mixHex(theme.sci["producer"], "#000000", 0.62)], 90);
  ctx.beginPath();
  for (let x = -20; x < width + 20; x += L(34)) {
    ctx.moveTo(x, horizon);
    ctx.arc(x, horizon - L(16), L(22), Math.PI, 0);
  }
  ctx.fill();
  ctx.restore();

  /* ---- the sun ---- */
  const sunX = X(G_NODES.sun.x), sunY = Y(G_NODES.sun.y);
  glow(ctx, sunX, sunY, L(120), theme.sci["light"], 0.5);
  sphere(ctx, sunX, sunY, L(34), theme.sci["light"], { glow: 0.7 });

  /* ---- rain cloud ---- */
  const cX = X(G_NODES.cloud.x), cY = Y(G_NODES.cloud.y);
  const cloudy = clamp01((params.cloud as number) / 100);
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.4 * cloudy;
  for (const o of [[-38, 4, 26], [0, -8, 34], [34, 6, 24], [-12, 12, 22]]) {
    sphere(ctx, cX + L(o[0]), cY + L(o[1]), L(o[2]), mixHex(theme.surface, theme.ink, 0.18 + 0.22 * cloudy));
  }
  ctx.restore();
  if (params.rain as boolean) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["liquid"], 0.7);
    ctx.lineWidth = Math.max(1, L(2));
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 22; i++) {
      const px = cX + L(-44 + (i * 89) % 92);
      const drop = (state.t * 210 + i * 43) % 340;
      const py = cY + L(22 + drop);
      if (py > Y(452)) continue;
      ctx.moveTo(px, py);
      ctx.lineTo(px - L(3), py + L(13));
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---- mains pole and the cable to the eaves ---- */
  const pX = X(G_NODES.grid.x);
  metal(ctx, pX - L(7), Y(300), L(14), L(200), theme.inkSoft, { radius: 2, polish: 0.6 });
  metal(ctx, pX - L(26), Y(304), L(52), L(8), theme.inkSoft, { radius: 2, polish: 0.7 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.lineWidth = Math.max(1.2, L(2.6));
  ctx.beginPath();
  ctx.moveTo(pX, Y(308));
  ctx.quadraticCurveTo(X(150), Y(356), X(238), Y(310));
  ctx.stroke();
  ctx.restore();

  /* ---- compost heap ---- */
  const hX = X(G_NODES.compost.x), hY = Y(G_NODES.compost.y);
  spriteShadowEllipse(ctx, hX, hY + L(30), L(64), L(13), { alpha: 0.3 });
  ctx.save();
  ctx.fillStyle = gradient(ctx, hX - L(60), hY - L(34), L(120), L(64),
    ["#8a6b3f", "#4c3820"].map((c) => mixHex(theme.ink, c, 0.9)), 90);
  ctx.beginPath();
  ctx.moveTo(hX - L(62), hY + L(30));
  ctx.quadraticCurveTo(hX - L(34), hY - L(36), hX + L(4), hY - L(30));
  ctx.quadraticCurveTo(hX + L(44), hY - L(24), hX + L(62), hY + L(30));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Decomposers are working: warm haze off the heap.
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.1 * pulse(state.t, 0.3);
  ctx.fillStyle = theme.sci["gas"];
  for (let i = 0; i < 5; i++) {
    const rise = (state.t * 26 + i * 21) % 76;
    ctx.beginPath();
    ctx.arc(hX + L(-24 + i * 12 + Math.sin(state.t * 0.9 + i) * 7), hY - L(28 + rise), L(6 + rise * 0.1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* ---- garden soil patch ---- */
  const sX = X(G_NODES.outSoil.x), sY = Y(G_NODES.outSoil.y);
  ctx.save();
  ctx.fillStyle = hexA(mixHex(theme.ink, "#6b4f2a", 0.85), 0.85);
  ctx.beginPath();
  ctx.ellipse(sX, sY, L(66), L(20), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* ---- greenhouse: contents first, glass over them ---- */
  const gL = X(226), gR = X(714), gT = Y(300), gB = Y(506), ridge = Y(232);
  // Floor shadow
  spriteShadowEllipse(ctx, (gL + gR) / 2, gB + L(8), (gR - gL) * 0.52, L(16), { alpha: 0.3 });

  // Water butt
  const tX = X(G_NODES.tank.x);
  plastic(ctx, tX - L(40), Y(396), L(80), L(110), theme.sci["liquid"], { radius: L(9) });
  metal(ctx, tX - L(42), Y(414), L(84), L(6), theme.inkSoft, { radius: 2, polish: 0.5 });
  metal(ctx, tX - L(42), Y(474), L(84), L(6), theme.inkSoft, { radius: 2, polish: 0.5 });

  // Pot and soil
  const potX = X(G_NODES.pot.x);
  ctx.save();
  ctx.fillStyle = gradient(ctx, potX - L(48), Y(438), L(96), L(68),
    [mixHex(theme.sci["hot"], "#ffffff", 0.15), mixHex(theme.sci["hot"], "#000000", 0.45)], 90);
  ctx.beginPath();
  ctx.moveTo(potX - L(48), Y(438));
  ctx.lineTo(potX + L(48), Y(438));
  ctx.lineTo(potX + L(35), Y(506));
  ctx.lineTo(potX - L(35), Y(506));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  material(ctx, potX - L(50), Y(432), L(100), L(12), mixHex(theme.sci["hot"], "#000000", 0.2), L(3));

  // Plant: a stem with paired leaves that sway
  ctx.save();
  ctx.strokeStyle = mixHex(theme.sci["producer"], "#000000", 0.3);
  ctx.lineWidth = Math.max(2, L(6));
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(potX, Y(438));
  ctx.quadraticCurveTo(potX + L(6), Y(390), potX + L(2), Y(334));
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const ly = 342 + i * 22;
    const side = i % 2 === 0 ? 1 : -1;
    const sway = Math.sin(state.t * 0.8 + i * 1.3) * 3;
    ctx.save();
    ctx.fillStyle = gradient(ctx, potX, Y(ly - 14), L(58) * side, L(28),
      [mixHex(theme.sci["producer"], "#ffffff", 0.25), mixHex(theme.sci["producer"], "#000000", 0.28)], 100);
    ctx.beginPath();
    ctx.moveTo(potX, Y(ly));
    ctx.quadraticCurveTo(potX + L((26 + sway) * side), Y(ly - 20), potX + L((54 + sway) * side), Y(ly - 2));
    ctx.quadraticCurveTo(potX + L((26 + sway) * side), Y(ly + 12), potX, Y(ly));
    ctx.fill();
    ctx.restore();
  }
  // Two ripening tomatoes, because a system with a product reads as a system.
  sphere(ctx, potX + L(22), Y(404), L(9), theme.sci["hot"]);
  sphere(ctx, potX - L(20), Y(418), L(7.5), theme.sci["hot"]);

  // Grow lamp with its cone of light
  const lampX = X(G_NODES.lamp.x);
  const lampOn = (params.lampPower as number) > 0;
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.5);
  ctx.lineWidth = Math.max(1, L(2));
  ctx.beginPath();
  ctx.moveTo(lampX, ridge + L(6));
  ctx.lineTo(lampX, Y(288));
  ctx.stroke();
  ctx.restore();
  if (lampOn) {
    const strength = clamp01((params.lampPower as number) / 400);
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.3 * strength * (0.85 + 0.15 * pulse(state.t, 0.7));
    ctx.fillStyle = gradient(ctx, lampX - L(90), Y(306), L(180), L(140),
      [hexA(theme.sci["light"], 0.9), hexA(theme.sci["light"], 0)], 90);
    ctx.beginPath();
    ctx.moveTo(lampX - L(32), Y(306));
    ctx.lineTo(lampX + L(32), Y(306));
    ctx.lineTo(lampX + L(96), Y(446));
    ctx.lineTo(lampX - L(96), Y(446));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  metal(ctx, lampX - L(36), Y(286), L(72), L(18), theme.inkSoft, { radius: L(4), polish: 0.9 });
  if (lampOn) glow(ctx, lampX, Y(308), L(40), theme.sci["light"], 0.6);

  // Airborne moisture inside the glass, denser when the vent is shut
  const ventOpen = params.vent as boolean;
  const motes: { x: number; y: number; r: number; a: number }[] = [];
  const moteCount = ventOpen ? 26 : 54;
  for (let i = 0; i < moteCount; i++) {
    const seed = i * 97.13;
    const px = 250 + ((seed * 7.3 + state.t * 9 + i * 31) % 440);
    const py = 490 - ((state.t * (14 + (i % 5) * 4) + i * 53) % 250);
    motes.push({ x: X(px), y: Y(py), r: L(1.6 + (i % 3) * 0.8), a: 0.25 + 0.45 * ((i % 4) / 4) });
  }
  particleField(ctx, motes, theme.sci["liquid"], { size: L(2), alpha: ventOpen ? 0.5 : 0.8 });

  // The glass itself
  glass(ctx, gL, gT, gR - gL, gB - gT, L(4), theme, { alpha: isDarkTheme(theme) ? 0.12 : 0.2 });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(gL, gT);
  ctx.lineTo(X(470), ridge);
  ctx.lineTo(gR, gT);
  ctx.closePath();
  ctx.fillStyle = hexA(isDarkTheme(theme) ? "#9ec8e8" : "#ffffff", isDarkTheme(theme) ? 0.14 : 0.3);
  ctx.fill();
  ctx.restore();
  rimLight(ctx, (c) => {
    c.beginPath();
    c.moveTo(gL, gB); c.lineTo(gL, gT); c.lineTo(X(470), ridge); c.lineTo(gR, gT); c.lineTo(gR, gB);
  }, "#ffffff", { width: Math.max(1, L(2)), alpha: 0.7, bounds: { x: gL, y: ridge, w: gR - gL, h: gB - ridge } });
  // Glazing bars
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = Math.max(1, L(2.2));
  ctx.beginPath();
  for (const x of [226, 348, 470, 592, 714]) { ctx.moveTo(X(x), gT); ctx.lineTo(X(x), gB); }
  for (const y of [300, 370, 440, 506]) { ctx.moveTo(gL, Y(y)); ctx.lineTo(gR, Y(y)); }
  ctx.moveTo(gL, gT); ctx.lineTo(X(470), ridge); ctx.lineTo(gR, gT);
  ctx.moveTo(X(470), ridge); ctx.lineTo(X(470), gT);
  ctx.stroke();
  ctx.restore();

  // The roof vent — the one hinge that decides whether matter can leave
  const flap = ventOpen ? 1 : 0;
  ctx.save();
  ctx.translate(X(560), Y(268));
  ctx.rotate(lerp(0.32, -0.5, easeInOut(flap)));
  ctx.fillStyle = hexA(isDarkTheme(theme) ? "#bfe0f5" : "#ffffff", 0.55);
  roundRect(ctx, 0, -L(4), L(92), L(8), L(3));
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  /* ---- the boundary ring ---- */
  const r = state.ring;
  const rx = X(r.x), ry = Y(r.y), rw = L(r.w), rh = L(r.h);
  const settle = clamp01((state.t - state.changedAt) / 0.9);
  ctx.save();
  innerGlow(ctx, (c) => roundRect(c, rx, ry, rw, rh, L(16)), theme.accent, { inset: L(16), alpha: 0.2, steps: 3 });
  ctx.setLineDash([L(13), L(9)]);
  ctx.lineDashOffset = -state.phase;
  ctx.lineWidth = Math.max(2, L(3.4));
  ctx.strokeStyle = hexA(theme.accent, 0.55 + 0.35 * (1 - easeInOut(settle)) + 0.1 * pulse(state.t, 0.45));
  roundRect(ctx, rx, ry, rw, rh, L(16));
  ctx.stroke();
  ctx.setLineDash([]);
  // Corner brackets: this line was drawn on purpose, by someone.
  ctx.strokeStyle = hexA(theme.accent, 0.95);
  ctx.lineWidth = Math.max(2, L(3.6));
  ctx.lineCap = "round";
  const c0 = L(22);
  for (const [cx, cy, dx, dy] of [
    [rx, ry, 1, 1], [rx + rw, ry, -1, 1], [rx, ry + rh, 1, -1], [rx + rw, ry + rh, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * c0, cy);
    ctx.lineTo(cx + dx * L(6), cy);
    ctx.moveTo(cx, cy + dy * c0);
    ctx.lineTo(cx, cy + dy * L(6));
    ctx.stroke();
  }
  ctx.restore();

  /* ---- flows ---- */
  const showE = overlays.energy !== false;
  const showM = overlays.matter !== false;
  const chips: { x: number; y: number; text: string; color: string; sub: string }[] = [];
  for (const fl of G_FLOWS) {
    if (fl.kind === "energy" && !showE) continue;
    if (fl.kind === "matter" && !showM) continue;
    const rate = fl.rate(e);
    if (rate < 0.02) continue;
    const cls = gClassify(fl, b.members);
    const a = G_NODES[fl.from], z = G_NODES[fl.to];
    const pts = trimPath(
      curve({ x: X(a.x), y: Y(a.y) }, { x: X(z.x), y: Y(z.y) }, L(fl.bend), 26),
      2, 2,
    );
    const color = cls === "input" ? IN : cls === "output" ? OUT : cls === "internal" ? INSIDE : theme.inkSoft;
    const alpha = cls === "outside" ? 0.16 : cls === "internal" ? 0.5 : 0.95;
    const thick = fl.kind === "energy"
      ? Math.max(1.6, L(2.2 + 4.6 * clamp01(rate / 4500)))
      : Math.max(1.4, L(2 + 4 * clamp01(rate / 120)));

    ctx.save();
    ctx.globalAlpha = alpha;
    if (fl.kind === "energy") {
      ribbon(ctx, pts, thick * 2.1, hexA(color, 0.45), hexA(color, 0.12), { taper: 0.9, alpha: 0.75 });
    }
    dashFlow(ctx, pts, color, state.phase * (fl.kind === "energy" ? 1.5 : 1), {
      width: thick,
      dash: fl.kind === "energy" ? L(12) : L(4),
      gap: fl.kind === "energy" ? L(7) : L(7),
      alpha: 0.95,
      glow: cls === "outside" ? 0 : L(5),
    });
    const tip = pts[pts.length - 1], prev = pts[pts.length - 3];
    arrow(ctx, prev.x, prev.y, tip.x, tip.y, color, { width: thick * 0.8, head: L(11) });
    ctx.restore();

    if ((cls === "input" || cls === "output") && overlays.values !== false && band !== "K-2") {
      const mid = pts[Math.floor(pts.length * 0.5)];
      chips.push({
        x: mid.x, y: mid.y,
        text: fl.kind === "energy" ? watts(rate) : `${fx(rate, rate < 10 ? 2 : 0)} g/h`,
        color,
        sub: cls === "input" ? "in" : "out",
      });
    }
  }
  for (const c of chips) badge(ctx, c.x, c.y, c.text, theme, { align: "center", color: c.color, sub: c.sub });

  /* ---- named parts, out in the margins where nothing collides ---- */
  if (overlays.labels !== false) {
    const leaders: [string, number, number][] = [
      ["plant", 758, 396], ["lamp", 700, 214], ["tank", 92, 430],
      ["compost", 700, 556], ["air", 92, 300],
    ];
    for (const [key, lx, ly] of leaders) {
      const n = G_NODES[key];
      const insideRing = b.members.includes(key);
      labelLeader(ctx, X(n.x), Y(n.y), X(lx), Y(ly), n.name, theme, {
        color: insideRing ? theme.accent : theme.inkSoft,
        sub: insideRing ? "inside the boundary" : "outside",
        size: Math.max(10, L(12)),
      });
    }
  }

  /* ---- the headline: what did the boundary decide? ---- */
  let inputs = 0, outputs = 0, internal = 0, eIn = 0, eOut = 0;
  for (const fl of G_FLOWS) {
    const cls = gClassify(fl, b.members);
    if (cls === "input") { inputs++; if (fl.kind === "energy") eIn += fl.rate(e); }
    else if (cls === "output") { outputs++; if (fl.kind === "energy") eOut += fl.rate(e); }
    else if (cls === "internal") internal++;
  }
  caption(ctx, 16, 24, `System boundary: ${b.name}`, theme, { size: 17, weight: 800 });
  caption(ctx, 16, 44, b.sub, theme, { size: 12, color: theme.inkSoft });
  crossingKey(ctx, 16, 58, theme, [
    { label: `${inputs} inputs`, color: IN },
    { label: `${outputs} outputs`, color: OUT },
    { label: `${internal} internal`, color: INSIDE },
  ]);
  if (band !== "K-2") {
    badge(ctx, width - 14, 30, `${watts(eIn)}  in`, theme, { align: "right", color: IN, sub: "energy across the line" });
    badge(ctx, width - 14, 68, `${watts(eOut)}  out`, theme, { align: "right", color: OUT, sub: `stored in sugar ${watts(e.stored)}` });
  }

  vignette(ctx, width, height, 0.15);
}

export const g6a2BoundaryDrawer: SimManifest<G1State> = {
  id: "g6a2-boundary-drawer",
  title: "Draw the Boundary",
  tagline: "Move one line around a greenhouse and watch the same sunlight turn from an input into background scenery.",
  subject: "engineering",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-ETS1-1", "MS-PS3-3"] },
  learningGoals: [
    "Draw a system boundary and say exactly what is inside it and what is outside.",
    "Classify each flow as an input, an output, or something that stays inside.",
    "Show that moving the boundary changes the bookkeeping without changing the world.",
  ],
  misconceptions: [
    "A system is a real object you can point at, not a boundary you choose",
    "Every arrow on a system diagram is an input or an output",
    "Making the system bigger always means more inputs",
  ],
  interactionHint: "Pick a boundary, then watch which arrows change colour.",
  params: {
    boundary: {
      type: "option", label: "Where is the boundary?",
      options: [
        { value: "plant", label: "The plant only" },
        { value: "pot", label: "Plant and pot" },
        { value: "greenhouse", label: "The greenhouse" },
        { value: "garden", label: "The whole garden" },
      ],
      default: "greenhouse",
      help: "Nothing physical changes when you move this. Only the labels do.",
    },
    cloud: {
      type: "number", label: "Cloud cover", kind: "percent", unit: "%",
      min: 0, max: 100, step: 5, default: 15,
      marks: [{ value: 0, label: "clear" }, { value: 100, label: "overcast" }],
    },
    lampPower: {
      type: "number", label: "Grow lamp", kind: "power", unit: "W",
      min: 0, max: 400, step: 10, default: 150,
      marks: [{ value: 0, label: "off" }, { value: 150, label: "150 W" }],
    },
    watering: {
      type: "number", label: "Watering rate (g/h)", kind: "ratio",
      min: 0, max: 120, step: 2, default: 62,
      help: "A greenhouse tomato drinks about 1.5 litres a day, near enough 62 g every hour.",
      bands: ["6-8", "9-12"],
    },
    vent: {
      type: "boolean", label: "Roof vent open", default: true,
      help: "Shut the vent and the water vapour has nowhere to go.",
    },
    rain: { type: "boolean", label: "Rain falling", default: false, bands: ["6-8", "9-12"] },
  },
  overlays: [
    { key: "energy", label: "Energy flows", default: true },
    { key: "matter", label: "Matter flows", default: true },
    { key: "values", label: "Flow values", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "labels", label: "Part names", default: true },
  ],
  model: g1Model,
  render: g1Render,
  labs: [
    {
      id: "move-the-line",
      title: "One garden, four systems",
      question: "Does making the system bigger always give it more inputs?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS1-6"],
      setup: { boundary: "plant", cloud: 15, lampPower: 150, watering: 62, vent: true, rain: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit before you look",
          instruction: "You are about to grow the boundary from the plant to the whole garden.",
          predict: {
            prompt: "As the boundary gets bigger, what happens to the number of flows crossing it?",
            options: [
              "It keeps going up — a bigger system has more inputs",
              "It keeps going down — a bigger system swallows its own flows",
              "It goes down, because flows that used to cross end up inside",
            ],
            correct: 2,
            reveal: "Widening a boundary swallows crossings. Watering was an input to the pot; once the water butt is inside the greenhouse, that same water never crosses the line at all.",
          },
        },
        {
          id: "count-plant",
          phase: "measure",
          title: "Start tight: the plant alone",
          instruction: "Set the boundary to The plant only and record the crossings, inputs and outputs.",
          requireData: 1,
          check: { describe: "Boundary is the plant only", test: (v) => v.facts.boundary === "plant" },
        },
        {
          id: "count-house",
          phase: "measure",
          title: "Now the greenhouse",
          instruction: "Move the boundary out to The greenhouse. Record again — change nothing else.",
          requireData: 2,
          check: { describe: "Boundary is the greenhouse", test: (v) => v.facts.boundary === "greenhouse" },
          hints: ["Leave the lamp, the vent and the cloud exactly where they were. Only the line moves."],
        },
        {
          id: "count-garden",
          phase: "measure",
          title: "And the whole garden",
          instruction: "Widen it once more to The whole garden and record a third row.",
          requireData: 3,
          check: { describe: "Boundary is the whole garden", test: (v) => v.facts.boundary === "garden" },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the flow that changed job",
          instruction: "Watering went from an input to something else. Find it and name the change.",
          write: {
            prompt: "Name one flow that was an input for the small boundary and internal for the big one. Why did it change?",
            placeholder: "The flow ... changed because both ends of it ended up ...",
          },
          hints: ["A flow only crosses the line if one end is inside and the other end is outside."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "State the rule that decides whether a flow is an input, an output, or internal.",
          write: {
            prompt: "Write a rule anyone could follow to sort a flow into input, output or internal.",
            placeholder: "A flow is an input when ... an output when ... and internal when ...",
          },
        },
      ],
    },
    {
      id: "shut-the-vent",
      title: "Shut the vent",
      question: "Can you stop matter leaving a system without stopping energy leaving it?",
      bands: ["6-8", "9-12"],
      minutes: 15,
      setup: { boundary: "greenhouse", cloud: 15, lampPower: 150, watering: 62, vent: true, rain: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the two numbers",
          instruction: "You are going to close the roof vent with the boundary on the greenhouse.",
          predict: {
            prompt: "When the vent shuts, what happens to matter out and energy out?",
            options: [
              "Both drop to almost nothing",
              "Matter out drops hard, energy out barely changes",
              "Energy out drops hard, matter out barely changes",
            ],
            correct: 1,
            reveal: "Glass stops water vapour but not heat. Shutting the vent nearly closes the greenhouse to matter while leaving it wide open to energy — the definition of a closed system.",
          },
        },
        {
          id: "open",
          phase: "measure",
          title: "Vent open",
          instruction: "With the vent open, record matter out and energy out.",
          requireData: 1,
          check: { describe: "The vent is open", test: (v) => v.params.vent === true },
        },
        {
          id: "closed",
          phase: "measure",
          title: "Vent shut",
          instruction: "Close the vent, wait for the arrows to settle, and record again.",
          requireData: 2,
          check: { describe: "The vent is shut", test: (v) => v.params.vent === false },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Where did the water go?",
          instruction: "The plant is still transpiring. Follow the vapour with the vent shut.",
          write: {
            prompt: "With the vent shut, where does the water vapour end up, and what does that arrow get called?",
            placeholder: "It condenses on ... and runs back to ... so it is now an ... flow.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the system",
          instruction: "Use the words open and closed.",
          write: {
            prompt: "Is the shut greenhouse open or closed? Say what it is open to and what it is closed to.",
            placeholder: "It is closed to ... and open to ... because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "make-mains-an-input",
      title: "Make the wire matter",
      brief: "Find a boundary where mains electricity is an input but the lamp's light never crosses the line.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { boundary: "plant", lampPower: 150, vent: true },
      goal: {
        describe: "Mains electricity is an input and lamp light is internal",
        test: (v) => v.facts.clsMains === "input" && v.facts.clsLampLight === "internal",
      },
      stars: {
        two: {
          describe: "Also keep the fallen leaves as an output",
          test: (v) => v.facts.clsMains === "input" && v.facts.clsLampLight === "internal" && v.facts.clsLitter === "output",
        },
        three: {
          describe: "Do it with fewer than nine crossings",
          test: (v) => v.facts.clsMains === "input" && v.facts.clsLampLight === "internal" &&
            v.facts.clsLitter === "output" && (v.facts.crossings as number) < 9,
        },
      },
      hints: [
        "The lamp has to be inside the line and the pole outside it.",
        "The greenhouse boundary puts the lamp under the glass and leaves the pole in the garden.",
      ],
    },
    {
      id: "seal-the-matter",
      title: "Seal it for matter",
      brief: "Get the greenhouse down to less than 5 g/h of matter leaving, while it still loses more than 3 kW of energy.",
      bands: ["6-8", "9-12"],
      setup: { boundary: "greenhouse", cloud: 15, lampPower: 150, watering: 62, vent: true, rain: false },
      goal: {
        describe: "Matter out under 5 g/h with energy out over 3000 W",
        test: (v) => v.facts.boundary === "greenhouse" &&
          (v.facts.matterOut as number) < 5 && (v.facts.energyOut as number) > 3000,
      },
      stars: {
        two: {
          describe: "Hold it under 2 g/h",
          test: (v) => v.facts.boundary === "greenhouse" &&
            (v.facts.matterOut as number) < 2 && (v.facts.energyOut as number) > 3000,
        },
        three: {
          describe: "Under 2 g/h with over 4 kW of energy leaving",
          test: (v) => v.facts.boundary === "greenhouse" &&
            (v.facts.matterOut as number) < 2 && (v.facts.energyOut as number) > 4000,
        },
      },
      hints: [
        "Matter leaves through one opening only. Find it.",
        "Energy leaves through the glass whatever you do — turn the clouds down to push it higher.",
      ],
    },
  ],
};
