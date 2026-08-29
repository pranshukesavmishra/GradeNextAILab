import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, dashFlow, easeInOut, glass,
  glow, gradient, gradientFill, groundPlane, hatchFill, hexA, innerGlow, isDarkTheme, labelLeader,
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

/* ================================================================== *
 * 2 · Open, Closed, Sealed  (A2.2)
 *
 * Three vessels of hot water on one bench, under one clock. The open
 * beaker leaks matter and energy, the stoppered flask leaks only energy,
 * the vacuum flask leaks energy so slowly you have to wait to see it. The
 * student runs all three at once and watches the curves separate.
 * ================================================================== */

/** Specific heat of liquid water, J/(g·K), and its latent heat of vaporisation. */
const C_WATER = 4.18;
const L_VAP = 2260;

interface Vessel { T: number; m: number; heatOut: number; massOut: number }

interface G2State {
  t: number;                       // minutes of lab time
  open: Vessel; closed: Vessel; sealed: Vessel;
  hist: { t: number; a: number; b: number; c: number }[];
  sampleAt: number;
  m0: number;
}

function g2Fresh(params: Record<string, number | boolean | string>): G2State {
  const T0 = (params.startTemp as number) - 273.15;
  const m0 = (params.waterMass as number) * 1000;
  const v = (): Vessel => ({ T: T0, m: m0, heatOut: 0, massOut: 0 });
  return {
    t: 0, open: v(), closed: v(), sealed: v(),
    hist: [{ t: 0, a: T0, b: T0, c: T0 }], sampleAt: 0, m0,
  };
}

/** Newton time constants in minutes, measured the way a school actually measures them. */
function g2Tau(which: "open" | "closed" | "sealed", stopper: boolean, cap: boolean): number {
  if (which === "open") return 55;
  if (which === "closed") return stopper ? 60 : 52;
  return cap ? 600 : 90;
}

function g2Evaporates(which: "open" | "closed" | "sealed", stopper: boolean, cap: boolean): boolean {
  if (which === "open") return true;
  if (which === "closed") return !stopper;
  return !cap;
}

function g2Advance(
  v: Vessel, dt: number, Ta: number, tau: number, evaporating: boolean, ctx: { rng: { normal: (m: number, s: number) => number } }, messy: number,
): Vessel {
  if (v.m <= 1) return v;
  const dT = v.T - Ta;
  const conduction = dT / tau;                       // K per minute
  const evap = evaporating ? 0.028 * Math.exp(dT / 22) : 0;  // g per minute
  const latent = (evap * L_VAP) / (v.m * C_WATER);   // K per minute
  const wobble = messy > 0 ? ctx.rng.normal(0, 0.02 * messy) : 0;
  const T = v.T - (conduction + latent) * dt * (1 + wobble);
  const m = Math.max(0, v.m - evap * dt);
  return {
    T: Math.max(Ta, T),
    m,
    heatOut: v.heatOut + (v.m * C_WATER * conduction + evap * L_VAP) * dt,
    massOut: v.massOut + evap * dt,
  };
}

const g2Model: SimModel<G2State> = {
  init(params) { return g2Fresh(params); },

  applyParams(state, params, prev) {
    // Changing the water itself is a new experiment; opening a lid is not.
    if (params.startTemp !== prev.startTemp || params.waterMass !== prev.waterMass) {
      return g2Fresh(params);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    const Ta = (params.roomTemp as number) - 273.15;
    const stopper = params.stopper as boolean;
    const cap = params.cap as boolean;
    const t = state.t + dt;
    const open = g2Advance(state.open, dt, Ta, g2Tau("open", stopper, cap), g2Evaporates("open", stopper, cap), ctx, ctx.messiness);
    const closed = g2Advance(state.closed, dt, Ta, g2Tau("closed", stopper, cap), g2Evaporates("closed", stopper, cap), ctx, ctx.messiness);
    const sealed = g2Advance(state.sealed, dt, Ta, g2Tau("sealed", stopper, cap), g2Evaporates("sealed", stopper, cap), ctx, ctx.messiness);

    let hist = state.hist;
    let sampleAt = state.sampleAt;
    if (t - sampleAt >= 0.5) {
      sampleAt = t;
      hist = hist.length >= 480 ? hist.slice(1) : hist.slice();
      hist.push({ t, a: open.T, b: closed.T, c: sealed.T });
    }
    return { ...state, t, open, closed, sealed, hist, sampleAt };
  },

  readouts(state) {
    return [
      { key: "elapsed", label: "Time", quantity: q(state.t * 60, "time"), unit: "min", semantic: "time", graphable: false },
      { key: "tOpen", label: "Open beaker", quantity: q(state.open.T + 273.15, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      { key: "tClosed", label: "Stoppered flask", quantity: q(state.closed.T + 273.15, "temperature"), unit: "°C", semantic: "producer", graphable: true },
      { key: "tSealed", label: "Vacuum flask", quantity: q(state.sealed.T + 273.15, "temperature"), unit: "°C", semantic: "cold", graphable: true },
      { key: "mOpen", label: "Water left, beaker", quantity: q(state.open.m / 1000, "mass"), unit: "g", semantic: "mass", graphable: true },
      { key: "mClosed", label: "Water left, flask", quantity: q(state.closed.m / 1000, "mass"), unit: "g", semantic: "mass", graphable: true, bands: ["6-8", "9-12"] },
      { key: "mSealed", label: "Water left, vacuum flask", quantity: q(state.sealed.m / 1000, "mass"), unit: "g", semantic: "mass", graphable: true, bands: ["6-8", "9-12"] },
      { key: "heatOpen", label: "Energy lost, beaker", quantity: q(state.open.heatOut, "energy"), unit: "kJ", semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"] },
      { key: "heatSealed", label: "Energy lost, vacuum flask", quantity: q(state.sealed.heatOut, "energy"), unit: "kJ", semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"] },
    ];
  },

  facts(state, params) {
    const Ta = (params.roomTemp as number) - 273.15;
    return {
      elapsedMin: state.t,
      tOpen: state.open.T, tClosed: state.closed.T, tSealed: state.sealed.T,
      mOpen: state.open.m, mClosed: state.closed.m, mSealed: state.sealed.m,
      massLostOpen: state.open.massOut,
      massLostClosed: state.closed.massOut,
      massLostSealed: state.sealed.massOut,
      heatOpen: state.open.heatOut, heatClosed: state.closed.heatOut, heatSealed: state.sealed.heatOut,
      gapSealedOpen: state.sealed.T - state.open.T,
      aboveRoomSealed: state.sealed.T - Ta,
      stopper: params.stopper as boolean,
      cap: params.cap as boolean,
    };
  },
};

interface G2Column {
  key: "open" | "closed" | "sealed";
  cx: number; name: string; verdict: string;
  matter: string; energy: string;
}

const G2_COLS: G2Column[] = [
  { key: "open", cx: 196, name: "Open beaker", verdict: "OPEN SYSTEM", matter: "matter crosses", energy: "energy crosses" },
  { key: "closed", cx: 498, name: "Stoppered flask", verdict: "CLOSED SYSTEM", matter: "matter cannot cross", energy: "energy crosses" },
  { key: "sealed", cx: 790, name: "Vacuum flask", verdict: "NEARLY ISOLATED", matter: "matter cannot cross", energy: "energy leaks slowly" },
];

function g2Render(rc: RenderContext<G2State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const f = fitBoard(width, height);
  const { X, Y, L } = f;
  const Ta = (params.roomTemp as number) - 273.15;
  const T0 = (params.startTemp as number) - 273.15;
  const stopper = params.stopper as boolean;
  const cap = params.cap as boolean;
  const benchY = Y(430);
  const dark = isDarkTheme(theme);

  const COL: Record<string, string> = {
    open: theme.sci["hot"], closed: theme.sci["producer"], sealed: theme.sci["cold"],
  };
  const vess: Record<string, Vessel> = { open: state.open, closed: state.closed, sealed: state.sealed };

  /* ---- the room ---- */
  sky(ctx, width, height, theme, "indoor", benchY);
  gradientFill(ctx, 0, 0, width, benchY, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.1 : 0.06),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.24 : 0.16),
  ], 90);
  // Wall tiling, quiet enough to stay behind everything.
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = Y(40); y < benchY; y += L(58)) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  for (let x = 0; x < width; x += L(76)) { ctx.moveTo(x, Y(20)); ctx.lineTo(x, benchY); }
  ctx.stroke();
  ctx.restore();
  groundPlane(ctx, Y(500), 0, width, height, theme, "lab");

  /* ---- the wall-mounted data logger ---- */
  const px0 = X(56), py0 = Y(18), pw = L(888), ph = L(178);
  softShadow(ctx, () => {
    bevelRect(ctx, px0, py0, pw, ph, L(10), mixHex(theme.surfaceAlt, theme.ink, dark ? 0.3 : 0.24), { depth: 1.4 });
  }, { blur: L(18), dy: L(7), alpha: 0.3 });
  const sx0 = px0 + L(10), sy0 = py0 + L(10), sw = pw - L(20), sh = ph - L(20);
  ctx.save();
  ctx.fillStyle = gradient(ctx, sx0, sy0, sw, sh,
    [mixHex(theme.ink, "#000000", dark ? 0.2 : 0.62), mixHex(theme.ink, "#000000", dark ? 0.45 : 0.78)], 110);
  roundRect(ctx, sx0, sy0, sw, sh, L(5));
  ctx.fill();
  ctx.restore();
  noiseWash(ctx, sx0, sy0, sw, sh, { alpha: 0.035, seed: 91, count: 220 });

  // Plot area inside the screen
  const ax0 = sx0 + L(52), ay0 = sy0 + L(26), aw = sw - L(74), ah = sh - L(50);
  const spanMin = Math.max(30, Math.ceil((state.t + 4) / 15) * 15);
  const tHi = Math.max(T0 + 4, 40), tLo = Math.min(Ta - 3, 18);
  const px = (t: number) => ax0 + (t / spanMin) * aw;
  const py = (T: number) => ay0 + ah - ((T - tLo) / (tHi - tLo)) * ah;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let T = Math.ceil(tLo / 20) * 20; T <= tHi; T += 20) {
    ctx.moveTo(ax0, Math.round(py(T)) + 0.5);
    ctx.lineTo(ax0 + aw, Math.round(py(T)) + 0.5);
  }
  for (let t = 0; t <= spanMin; t += spanMin / 6) {
    ctx.moveTo(Math.round(px(t)) + 0.5, ay0);
    ctx.lineTo(Math.round(px(t)) + 0.5, ay0 + ah);
  }
  ctx.stroke();
  ctx.font = `500 ${Math.max(8, L(10))}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let T = Math.ceil(tLo / 20) * 20; T <= tHi; T += 20) ctx.fillText(`${T}`, ax0 - L(6), py(T));
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let t = 0; t <= spanMin + 0.01; t += spanMin / 6) ctx.fillText(`${Math.round(t)}`, px(t), ay0 + ah + L(5));
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `700 ${Math.max(9, L(12))}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.fillText("Water temperature  (°C  vs  minutes)", ax0, sy0 + L(7));
  ctx.restore();

  // Ambient line: nothing can cool past the room.
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.setLineDash([L(5), L(5)]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax0, py(Ta));
  ctx.lineTo(ax0 + aw, py(Ta));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `500 ${Math.max(8, L(10))}px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`room ${fx(Ta, 0)} °C`, ax0 + L(6), py(Ta) - L(3));
  ctx.restore();

  // The three traces
  const series: [keyof typeof COL, (h: { a: number; b: number; c: number }) => number][] = [
    ["open", (h) => h.a], ["closed", (h) => h.b], ["sealed", (h) => h.c],
  ];
  for (const [key, pick] of series) {
    if (state.hist.length < 2) break;
    ctx.save();
    ctx.strokeStyle = COL[key];
    ctx.lineWidth = Math.max(1.6, L(2.4));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = hexA(COL[key], 0.6);
    ctx.shadowBlur = L(6);
    ctx.beginPath();
    for (let i = 0; i < state.hist.length; i++) {
      const h = state.hist[i];
      const sxp = px(h.t), syp = py(pick(h));
      if (i === 0) ctx.moveTo(sxp, syp); else ctx.lineTo(sxp, syp);
    }
    ctx.stroke();
    ctx.restore();
    const last = state.hist[state.hist.length - 1];
    sphere(ctx, px(last.t), py(pick(last)), Math.max(2.5, L(4)), COL[key], { glow: 0.5 });
  }

  /* ---- the bench ---- */
  gradientFill(ctx, 0, benchY, width, L(22), [
    mixHex(theme.ink, "#6d5138", 0.72), mixHex(theme.ink, "#3d2d1e", 0.78),
  ], 90);
  ctx.save();
  ctx.fillStyle = hexA("#ffffff", dark ? 0.14 : 0.3);
  ctx.fillRect(0, benchY, width, Math.max(1, L(2.5)));
  ctx.restore();
  gradientFill(ctx, 0, benchY + L(22), width, L(48), [
    mixHex(theme.ink, "#4a3625", 0.8), mixHex(theme.ink, "#2a1e14", 0.86),
  ], 90);

  /* ---- the three vessels ---- */
  for (const col of G2_COLS) {
    const v = vess[col.key];
    const cx = X(col.cx);
    const tint = mixHex(theme.sci["cold"], theme.sci["hot"], clamp01((v.T - 18) / 78));
    const fill = clamp01(v.m / Math.max(1, state.m0));

    if (col.key === "open") {
      const w = L(132), h = L(142);
      const bx = cx - w / 2, by = benchY - h;
      spriteShadowEllipse(ctx, cx, benchY + L(3), w * 0.55, L(8), { alpha: 0.32 });
      const wh = (h - L(12)) * fill;
      ctx.save();
      ctx.fillStyle = gradient(ctx, bx, benchY - wh, w, wh,
        [mixHex(tint, "#ffffff", 0.3), tint, mixHex(tint, "#000000", 0.28)], 90);
      roundRect(ctx, bx + L(3), benchY - wh, w - L(6), wh, L(4));
      ctx.fill();
      ctx.restore();
      glass(ctx, bx, by, w, h, L(5), theme, { alpha: dark ? 0.13 : 0.22 });
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
      ctx.lineWidth = Math.max(1, L(1.6));
      ctx.beginPath();
      for (let i = 1; i <= 3; i++) {
        const gy = benchY - (h - L(12)) * (i / 4);
        ctx.moveTo(bx + w - L(26), gy);
        ctx.lineTo(bx + w - L(6), gy);
      }
      ctx.stroke();
      ctx.restore();
    } else if (col.key === "closed") {
      const halfBase = L(76), halfNeck = L(20), top = benchY - L(162), shoulder = benchY - L(96);
      spriteShadowEllipse(ctx, cx, benchY + L(3), halfBase * 0.95, L(9), { alpha: 0.32 });
      const shape = (c: CanvasRenderingContext2D) => {
        c.beginPath();
        c.moveTo(cx - halfBase, benchY);
        c.lineTo(cx - halfNeck, shoulder);
        c.lineTo(cx - halfNeck, top);
        c.lineTo(cx + halfNeck, top);
        c.lineTo(cx + halfNeck, shoulder);
        c.lineTo(cx + halfBase, benchY);
        c.closePath();
      };
      const wh = (benchY - shoulder) * fill;
      ctx.save();
      shape(ctx);
      ctx.clip();
      ctx.fillStyle = gradient(ctx, cx - halfBase, benchY - wh, halfBase * 2, wh,
        [mixHex(tint, "#ffffff", 0.3), tint, mixHex(tint, "#000000", 0.28)], 90);
      ctx.fillRect(cx - halfBase, benchY - wh, halfBase * 2, wh);
      ctx.restore();
      ctx.save();
      shape(ctx);
      ctx.fillStyle = hexA(dark ? "#9ec8e8" : "#ffffff", dark ? 0.12 : 0.24);
      ctx.fill();
      ctx.restore();
      rimLight(ctx, shape, "#ffffff", {
        width: Math.max(1.2, L(2)), alpha: 0.75,
        bounds: { x: cx - halfBase, y: top, w: halfBase * 2, h: benchY - top },
      });
      // The stopper: one rubber bung is the whole difference between open and closed.
      const lift = stopper ? 0 : L(46);
      plastic(ctx, cx - halfNeck - L(5), top - L(20) - lift, halfNeck * 2 + L(10), L(26), theme.sci["decomposer"], { radius: L(5) });
    } else {
      const w = L(112), h = L(186), bx = cx - w / 2, by = benchY - h;
      spriteShadowEllipse(ctx, cx, benchY + L(3), w * 0.56, L(9), { alpha: 0.34 });
      metal(ctx, bx, by, w, h, theme.inkSoft, { radius: L(9), polish: 1 });
      // A cutaway showing the vacuum gap that does the work.
      const iw = w - L(30), ix = bx + L(15);
      hatchFill(ctx, bx + L(5), by + L(10), L(10), h - L(20), theme.accent, { gap: L(5), alpha: 0.5 });
      hatchFill(ctx, bx + w - L(15), by + L(10), L(10), h - L(20), theme.accent, { gap: L(5), alpha: 0.5 });
      const wh = (h - L(24)) * fill;
      ctx.save();
      ctx.fillStyle = gradient(ctx, ix, benchY - L(10) - wh, iw, wh,
        [mixHex(tint, "#ffffff", 0.28), tint, mixHex(tint, "#000000", 0.3)], 90);
      roundRect(ctx, ix, benchY - L(10) - wh, iw, wh, L(3));
      ctx.fill();
      ctx.restore();
      innerGlow(ctx, (c) => roundRect(c, ix, by + L(12), iw, h - L(22), L(3)), tint, { inset: L(7), alpha: 0.35, steps: 2 });
      const lift = cap ? 0 : L(52);
      plastic(ctx, bx + L(6), by - L(16) - lift, w - L(12), L(22), theme.sci["decomposer"], { radius: L(6) });
    }

    // Thermometer standing in the water
    const thX = cx + (col.key === "closed" ? L(0) : L(44));
    const thTop = benchY - L(196), thBot = benchY - L(16);
    ctx.save();
    ctx.fillStyle = hexA(dark ? "#cfe6f7" : "#ffffff", 0.5);
    roundRect(ctx, thX - L(4), thTop, L(8), thBot - thTop, L(4));
    ctx.fill();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
    const colH = (thBot - thTop - L(10)) * clamp01((v.T - 10) / 95);
    ctx.fillStyle = theme.sci["hot"];
    roundRect(ctx, thX - L(2.2), thBot - L(6) - colH, L(4.4), colH, L(2));
    ctx.fill();
    ctx.restore();
    sphere(ctx, thX, thBot - L(4), L(6), theme.sci["hot"]);

    // Steam, only where matter is actually leaving
    const evapNow = g2Evaporates(col.key, stopper, cap) ? 0.028 * Math.exp((v.T - Ta) / 22) : 0;
    if (evapNow > 0.05 && v.m > 1) {
      const puffs: { x: number; y: number; r: number; a: number }[] = [];
      const n = Math.min(30, Math.round(evapNow * 34));
      const topY = col.key === "open" ? benchY - L(142) : col.key === "closed" ? benchY - L(182) : benchY - L(202);
      for (let i = 0; i < n; i++) {
        const rise = (state.t * 46 + i * 27) % 130;
        puffs.push({
          x: cx + L(Math.sin(state.t * 1.6 + i * 1.9) * (7 + rise * 0.2) + ((i % 5) - 2) * 6),
          y: topY - L(rise),
          r: L(4 + rise * 0.09),
          a: 0.55 * (1 - rise / 130),
        });
      }
      particleField(ctx, puffs, theme.sci["gas"], { alpha: 0.55, buckets: 3 });
    }

    // Energy leaving: the arrows never stop, they only get thinner
    const tau = g2Tau(col.key, stopper, cap);
    const flux = (v.T - Ta) / tau;
    if (flux > 0.005 && overlays.flows !== false) {
      const wArrow = Math.max(1.4, L(1.6 + 7 * clamp01(flux / 1.4)));
      for (const dir of [-1, 1]) {
        const sxp = cx + dir * L(col.key === "closed" ? 86 : 74);
        const pts = curve({ x: sxp, y: benchY - L(70) }, { x: sxp + dir * L(66), y: benchY - L(108) }, L(10), 10);
        dashFlow(ctx, pts, theme.sci["energy-thermal"], state.t * 26 * dir, {
          width: wArrow, dash: L(7), gap: L(6), alpha: 0.85, glow: L(4),
        });
        const tip = pts[pts.length - 1], prev = pts[pts.length - 3];
        arrow(ctx, prev.x, prev.y, tip.x, tip.y, theme.sci["energy-thermal"], { width: wArrow * 0.8, head: L(10) });
      }
    }

    // Boundary ring plus verdict plate
    if (overlays.rings !== false) {
      const ringTop = benchY - L(col.key === "sealed" ? 216 : col.key === "closed" ? 202 : 168);
      const rw = L(col.key === "closed" ? 200 : 176);
      ctx.save();
      ctx.setLineDash([L(10), L(7)]);
      ctx.lineDashOffset = -state.t * 26;
      ctx.lineWidth = Math.max(1.6, L(2.6));
      ctx.strokeStyle = hexA(COL[col.key], 0.85);
      roundRect(ctx, cx - rw / 2, ringTop, rw, benchY + L(10) - ringTop, L(12));
      ctx.stroke();
      ctx.restore();
    }

    const plateY = benchY + L(34);
    softShadow(ctx, () => {
      ctx.fillStyle = dark ? "rgba(16,22,30,0.9)" : "rgba(255,255,255,0.94)";
      roundRect(ctx, cx - L(122), plateY, L(244), L(52), L(8));
      ctx.fill();
    }, { blur: L(9), dy: L(3), alpha: 0.3 });
    ctx.save();
    ctx.strokeStyle = hexA(COL[col.key], 0.6);
    ctx.lineWidth = 1;
    roundRect(ctx, cx - L(122), plateY, L(244), L(52), L(8));
    ctx.stroke();
    ctx.restore();
    caption(ctx, cx, plateY + L(15), col.verdict, theme, { align: "center", size: Math.max(10, L(13)), weight: 800, color: COL[col.key] });
    const matterNow = g2Evaporates(col.key, stopper, cap) ? "matter crosses" : col.matter;
    caption(ctx, cx, plateY + L(33), `${matterNow}  ·  ${col.energy}`, theme, {
      align: "center", size: Math.max(8, L(10)), color: theme.inkSoft,
    });

    // Live values beside the glassware, never on top of it
    if (band !== "K-2") {
      badge(ctx, cx, benchY - L(col.key === "sealed" ? 236 : col.key === "closed" ? 222 : 190), `${fx(v.T, 1)} °C`, theme, {
        align: "center", color: COL[col.key], sub: `${fx(v.m, 1)} g of water`,
      });
    }
  }

  /* ---- headline ---- */
  caption(ctx, 16, Y(212), `Lab clock  ${fx(state.t, 1)} min`, theme, { size: Math.max(11, L(14)), weight: 800 });
  if (band !== "K-2") {
    caption(ctx, 16, Y(232),
      `beaker has lost ${fx(state.open.massOut, 1)} g of water · vacuum flask has lost ${fx(state.sealed.massOut, 2)} g`,
      theme, { size: Math.max(9, L(11)), color: theme.inkSoft });
  }
  if (overlays.labels !== false) {
    labelLeader(ctx, X(790) - L(48), benchY - L(120), X(946), Y(292), "Vacuum gap", theme, {
      color: theme.accent, sub: "no air, so almost no conduction", size: Math.max(9, L(11)), align: "left",
    });
  }
  vignette(ctx, width, height, 0.16);
}

export const g6a2OpenClosed: SimManifest<G2State> = {
  id: "g6a2-open-closed",
  title: "Open, Closed, Sealed",
  tagline: "Three vessels of hot water, one clock: find out what an open system leaks that a closed one does not.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9],
  standards: { ngss: ["MS-PS3-4", "MS-PS3-5", "MS-ETS1-3"] },
  learningGoals: [
    "Tell an open, a closed and an isolated system apart by what crosses the boundary.",
    "Show that a closed system still exchanges energy even though matter cannot leave.",
    "Argue from data that a truly isolated system is an idealisation, not a lab object.",
  ],
  misconceptions: [
    "A closed system cannot exchange anything at all",
    "A sealed container keeps its contents hot forever",
    "Hot water only cools because heat conducts away; evaporation does nothing",
  ],
  interactionHint: "Press play and let the clock run — the curves only separate with time.",
  tickRate: 60,
  timeScale: 1,
  params: {
    startTemp: {
      type: "number", label: "Starting temperature", kind: "temperature", unit: "°C",
      min: 303.15, max: 368.15, step: 1, default: 363.15,
      marks: [{ value: 323.15, label: "50 °C" }, { value: 363.15, label: "90 °C" }],
    },
    waterMass: {
      type: "number", label: "Water in each vessel", kind: "mass", unit: "g",
      min: 0.05, max: 0.5, step: 0.01, default: 0.2,
      help: "Changing this starts the run again — it is a new experiment.",
    },
    roomTemp: {
      type: "number", label: "Room temperature", kind: "temperature", unit: "°C",
      min: 283.15, max: 303.15, step: 0.5, default: 295.15, bands: ["6-8", "9-12"],
    },
    stopper: {
      type: "boolean", label: "Stopper in the flask", default: true,
      help: "Pull the bung and the closed system becomes an open one.",
    },
    cap: { type: "boolean", label: "Cap on the vacuum flask", default: true },
  },
  overlays: [
    { key: "flows", label: "Heat-loss arrows", default: true },
    { key: "rings", label: "System boundaries", default: true },
    { key: "labels", label: "Part names", default: true },
  ],
  model: g2Model,
  render: g2Render,
  labs: [
    {
      id: "which-keeps-heat",
      title: "Which vessel keeps its heat?",
      question: "How much difference does the boundary make to how fast water cools?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-4"],
      setup: { startTemp: 363.15, waterMass: 0.2, roomTemp: 295.15, stopper: true, cap: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Rank them first",
          instruction: "All three start at 90 °C in the same room.",
          predict: {
            prompt: "After 30 minutes, which vessel is coolest?",
            options: [
              "The open beaker, because steam carries heat away as well",
              "The stoppered flask, because the bung traps the heat inside",
              "The vacuum flask, because metal conducts heat quickly",
            ],
            correct: 0,
            reveal: "The open beaker loses heat two ways at once: conduction through the glass and evaporation. Every gram that leaves as vapour takes 2260 J with it.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the clock to 30 minutes",
          instruction: "Press play and record a row every five minutes or so.",
          requireData: 5,
          check: { describe: "At least 30 minutes of lab time", test: (v) => (v.facts.elapsedMin as number) >= 30 },
          hints: ["The curves on the wall screen are drawn live — you are recording points off a real trace."],
        },
        {
          id: "gap",
          phase: "analyze",
          title: "Measure the gap",
          instruction: "Subtract the beaker temperature from the vacuum flask temperature.",
          check: {
            describe: "The vacuum flask leads the beaker by more than 20 °C",
            test: (v) => (v.facts.gapSealedOpen as number) > 20,
          },
          write: {
            prompt: "How many degrees apart are the vacuum flask and the open beaker, and what is causing the gap?",
            placeholder: "The gap is about ... °C because the beaker loses heat by ... and by ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what the boundary did",
          instruction: "Write about the boundary, not about the water.",
          write: {
            prompt: "Two vessels held the same water at the same start temperature. Why did they end up different?",
            placeholder: "The water was the same. The boundary was different because ...",
          },
        },
      ],
    },
    {
      id: "where-mass-goes",
      title: "Where does the mass go?",
      question: "Does a cooling system always lose mass?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      setup: { startTemp: 363.15, waterMass: 0.2, roomTemp: 295.15, stopper: true, cap: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the balance",
          instruction: "You will weigh the water in all three vessels after twenty minutes.",
          predict: {
            prompt: "Which vessels will have lost measurable water?",
            options: [
              "All three — hot water always evaporates",
              "Only the open beaker",
              "None — water cannot escape from any of them",
            ],
            correct: 1,
            reveal: "Matter needs a gap to cross. The bung and the cap close that gap, so only the open beaker loses water even though all three lose heat.",
          },
        },
        {
          id: "run20",
          phase: "measure",
          title: "Twenty minutes on the clock",
          instruction: "Run to 20 minutes and record the mass in each vessel.",
          requireData: 2,
          check: { describe: "At least 20 minutes elapsed", test: (v) => (v.facts.elapsedMin as number) >= 20 },
        },
        {
          id: "pull-bung",
          phase: "measure",
          title: "Now pull the bung",
          instruction: "Take the stopper out of the flask and run another ten minutes. Record again.",
          requireData: 4,
          check: {
            describe: "Stopper out and the flask has lost more than 1 g",
            test: (v) => v.params.stopper === false && (v.facts.massLostClosed as number) > 1,
          },
          hints: ["Watch the steam appear over the flask the moment the bung comes out."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read the two curves",
          instruction: "Look at the flask's trace on the screen at the moment you pulled the bung.",
          write: {
            prompt: "What happened to the flask's cooling rate when the stopper came out, and why?",
            placeholder: "It cooled faster because a second exit opened for ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Define it in one line",
          instruction: "Use both words: matter and energy.",
          write: {
            prompt: "Finish the sentence: a closed system is one where ... but ...",
            placeholder: "A closed system is one where matter ... but energy ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hold-seventy",
      title: "Still hot at forty",
      brief: "Keep at least one vessel above 70 °C when the clock passes 40 minutes.",
      bands: ["6-8", "9-12"],
      setup: { startTemp: 363.15, waterMass: 0.2, roomTemp: 295.15, stopper: true, cap: true },
      goal: {
        describe: "Vacuum flask above 70 °C at 40 minutes",
        test: (v) => (v.facts.elapsedMin as number) >= 40 && (v.facts.tSealed as number) > 70,
      },
      stars: {
        two: {
          describe: "Above 80 °C at 40 minutes",
          test: (v) => (v.facts.elapsedMin as number) >= 40 && (v.facts.tSealed as number) > 80,
        },
        three: {
          describe: "Above 80 °C at 90 minutes",
          test: (v) => (v.facts.elapsedMin as number) >= 90 && (v.facts.tSealed as number) > 80,
        },
      },
      hints: [
        "One of the three vessels was built for exactly this job.",
        "Leaving the cap off turns the best insulator in the room into an ordinary flask.",
      ],
    },
    {
      id: "break-the-seal",
      title: "Break the seal",
      brief: "Turn the closed flask into an open system and prove it with mass, not with words.",
      bands: ["6-8", "9-12"],
      setup: { startTemp: 363.15, waterMass: 0.2, roomTemp: 295.15, stopper: true, cap: true },
      goal: {
        describe: "The flask has lost more than 3 g of water",
        test: (v) => (v.facts.massLostClosed as number) > 3,
      },
      stars: {
        two: {
          describe: "More than 8 g gone from the flask",
          test: (v) => (v.facts.massLostClosed as number) > 8,
        },
        three: {
          describe: "More than 8 g gone while the vacuum flask has lost under 0.5 g",
          test: (v) => (v.facts.massLostClosed as number) > 8 && (v.facts.massLostSealed as number) < 0.5,
        },
      },
      hints: [
        "Mass can only leave through an opening. Make one.",
        "Hotter water evaporates far faster — start the run near 90 °C.",
      ],
    },
  ],
};

/* ================================================================== *
 * 3 · Crossing Check  (A2.3)
 *
 * An inspection bay: one system up on a lit plinth, its boundary drawn
 * round it, and a card rail feeding the inspector one flow at a time.
 * Input, output, or never crosses at all — three buttons, no hedging.
 * ================================================================== */

type G3Answer = "input" | "output" | "inside";

interface G3Item { text: string; kind: "matter" | "energy"; answer: G3Answer; why: string }
interface G3System { key: string; name: string; boundary: string; items: G3Item[] }

const G3_SYSTEMS: G3System[] = [
  {
    key: "oven", name: "Wood-fired oven", boundary: "the brick dome, the fire and the food inside it",
    items: [
      { text: "Dry oak logs pushed through the mouth", kind: "matter", answer: "input", why: "Fuel starts in the courtyard and ends up inside the dome." },
      { text: "Air drawn in through the mouth to feed the flames", kind: "matter", answer: "input", why: "Burning needs oxygen, and the oxygen comes from outside." },
      { text: "Smoke leaving up the chimney", kind: "matter", answer: "output", why: "Carbon dioxide, water vapour and soot all end up outside." },
      { text: "Heat radiating onto the baker standing nearby", kind: "energy", answer: "output", why: "Energy crossing outwards is an output even though no matter moves." },
      { text: "Heat soaking from the flame into the brick dome", kind: "energy", answer: "inside", why: "Flame and bricks are both inside the line, so nothing crosses it." },
      { text: "Heat spreading through the stone floor into the pizza base", kind: "energy", answer: "inside", why: "Floor and pizza are both inside the boundary." },
      { text: "Ash raked out the next morning", kind: "matter", answer: "output", why: "Solid matter leaving the dome is still an output." },
      { text: "Starch in the dough turning brown and crisp", kind: "matter", answer: "inside", why: "A change happening wholly inside the boundary crosses nothing." },
      { text: "Firelight thrown onto the courtyard wall", kind: "energy", answer: "output", why: "Light carries energy out through the mouth of the oven." },
    ],
  },
  {
    key: "tank", name: "Home aquarium", boundary: "the glass tank and everything living in the water",
    items: [
      { text: "A pinch of fish flakes dropped on the surface", kind: "matter", answer: "input", why: "Food starts outside the tank and ends up in it." },
      { text: "Electricity down the cable to the pump", kind: "energy", answer: "input", why: "The energy comes from the wall socket, which is outside the tank." },
      { text: "Light from the hood lamp shining down", kind: "energy", answer: "input", why: "The lamp sits above the glass, so its light crosses in." },
      { text: "Oxygen dissolving in from the air at the surface", kind: "matter", answer: "input", why: "Gas crossing the water surface is matter crossing the boundary." },
      { text: "Warmth leaking through the glass into the room", kind: "energy", answer: "output", why: "The room is colder, so energy drifts outwards through the glass." },
      { text: "Water evaporating from the open surface", kind: "matter", answer: "output", why: "The tank needs topping up every week for exactly this reason." },
      { text: "The pump pushing water through the filter sponge", kind: "energy", answer: "inside", why: "Pump and filter are both under the rim, so nothing crosses." },
      { text: "Bacteria turning fish waste into nitrate", kind: "matter", answer: "inside", why: "Atoms are rearranged inside the tank, not moved across its wall." },
      { text: "A litre of old water siphoned out on Sunday", kind: "matter", answer: "output", why: "You physically carry that water outside the boundary." },
    ],
  },
  {
    key: "rider", name: "Cyclist's body", boundary: "the rider's body only, not the bicycle",
    items: [
      { text: "A bowl of porridge eaten at breakfast", kind: "matter", answer: "input", why: "Food crosses from the kitchen into the body." },
      { text: "Oxygen breathed in at the top of the hill", kind: "matter", answer: "input", why: "Air crosses the boundary every single breath." },
      { text: "Carbon dioxide breathed out", kind: "matter", answer: "output", why: "The carbon leaving came from the food, and it is now outside." },
      { text: "Sweat evaporating off the forearms", kind: "matter", answer: "output", why: "Water and its 2260 J per gram both leave the body." },
      { text: "Body heat radiating into the cool air", kind: "energy", answer: "output", why: "About three quarters of the food energy leaves as heat." },
      { text: "Blood carrying glucose to the calf muscle", kind: "matter", answer: "inside", why: "Both ends of that journey are inside the rider." },
      { text: "Nerve signals running from brain to legs", kind: "energy", answer: "inside", why: "The whole path stays inside the body." },
      { text: "The pedal pushing back up on the rider's foot", kind: "energy", answer: "input", why: "A force from the bicycle, which is outside the chosen boundary." },
      { text: "The rider's leg pushing down on the pedal", kind: "energy", answer: "output", why: "Work done on something outside the boundary is an output." },
    ],
  },
];

function g3System(key: string): G3System {
  return G3_SYSTEMS.find((s) => s.key === key) ?? G3_SYSTEMS[0];
}

/** Fisher-Yates from the sim's own stream, so a shared link deals the same deck. */
function g3Deck(n: number, rng: { int: (a: number, b: number) => number }): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  return order;
}

interface G3State {
  t: number;
  system: string;
  order: number[];
  pos: number;
  asked: number; correct: number; streak: number; best: number;
  verdict: "" | "right" | "wrong";
  verdictAt: number;
  chosen: G3Answer | "";
  dealtAt: number;
  wrongIds: number[];
}

/** The verdict buttons live in fixed pixels from the top-left, so the model can hit-test them. */
const G3_BTN = [
  { key: "input" as G3Answer, x: 16, y: 80, w: 148, h: 56, label: "Input", sub: "crosses inwards" },
  { key: "output" as G3Answer, x: 172, y: 80, w: 148, h: 56, label: "Output", sub: "crosses outwards" },
  { key: "inside" as G3Answer, x: 328, y: 80, w: 148, h: 56, label: "Stays inside", sub: "never crosses" },
];

function g3Fresh(params: Record<string, number | boolean | string>, rng: { int: (a: number, b: number) => number }): G3State {
  const sys = g3System(params.system as string);
  return {
    t: 0, system: sys.key, order: g3Deck(sys.items.length, rng), pos: 0,
    asked: 0, correct: 0, streak: 0, best: 0,
    verdict: "", verdictAt: 0, chosen: "", dealtAt: 0, wrongIds: [],
  };
}

const g3Model: SimModel<G3State> = {
  init(params, ctx) { return g3Fresh(params, ctx.rng); },

  applyParams(state, params, prev, ctx) {
    if (params.system === prev.system) return state;
    return g3Fresh(params, ctx.rng);
  },

  step(state, dt, _params, ctx, inputs) {
    let s = { ...state, t: state.t + dt };
    const sys = g3System(s.system);
    const item = sys.items[s.order[s.pos % s.order.length]];

    for (const input of inputs) {
      if (input.type !== "pointerdown" || s.verdict !== "") continue;
      const hit = G3_BTN.find(
        (b) => input.x >= b.x && input.x <= b.x + b.w && input.y >= b.y && input.y <= b.y + b.h,
      );
      if (!hit) continue;
      const right = hit.key === item.answer;
      s = {
        ...s,
        verdict: right ? "right" : "wrong",
        verdictAt: s.t,
        chosen: hit.key,
        asked: s.asked + 1,
        correct: s.correct + (right ? 1 : 0),
        streak: right ? s.streak + 1 : 0,
        best: right ? Math.max(s.best, s.streak + 1) : s.best,
        wrongIds: right ? s.wrongIds : [...s.wrongIds, s.order[s.pos % s.order.length]],
      };
    }

    const hold = s.verdict === "wrong" ? 3.4 : 1.5;
    if (s.verdict !== "" && s.t - s.verdictAt > hold) {
      let pos = s.pos + 1;
      let order = s.order;
      if (pos >= order.length) { order = g3Deck(sys.items.length, ctx.rng); pos = 0; }
      s = { ...s, pos, order, verdict: "", chosen: "", dealtAt: s.t };
    }
    return s;
  },

  readouts(state) {
    const acc = state.asked > 0 ? (state.correct / state.asked) * 100 : 0;
    return [
      { key: "asked", label: "Cards judged", quantity: q(state.asked, "count"), semantic: "distance", graphable: true },
      { key: "correct", label: "Correct", quantity: q(state.correct, "count"), semantic: "producer", graphable: true },
      { key: "accuracy", label: "Accuracy", quantity: q(acc / 100, "percent"), unit: "%", semantic: "energy-total", graphable: true },
      { key: "streak", label: "Current streak", quantity: q(state.streak, "count"), semantic: "hot", graphable: true },
      { key: "best", label: "Best streak", quantity: q(state.best, "count"), semantic: "hot" },
    ];
  },

  facts(state) {
    const sys = g3System(state.system);
    return {
      system: state.system,
      asked: state.asked, correct: state.correct,
      streak: state.streak, best: state.best,
      accuracy: state.asked > 0 ? (state.correct / state.asked) * 100 : 0,
      wrong: state.asked - state.correct,
      deckSize: sys.items.length,
      fullDeck: state.asked >= sys.items.length,
      lastVerdict: state.verdict,
    };
  },
};

/** Greedy word wrap against the current font. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function g3Render(rc: RenderContext<G3State>) {
  const { ctx, state, theme, width, height, overlays } = rc;
  const dark = isDarkTheme(theme);
  const sys = g3System(state.system);
  const item = sys.items[state.order[state.pos % state.order.length]];
  const hudH = 150;

  const IN = theme.sci["cold"], OUT = theme.sci["hot"], KEEP = theme.sci["producer"];
  const answerColor: Record<G3Answer, string> = { input: IN, output: OUT, inside: KEEP };

  /* ---- the inspection bay ---- */
  const bw = 1000, bh = 430;
  const s = Math.min(width / bw, (height - hudH) / bh);
  const ox = (width - bw * s) / 2;
  const oy = hudH + (height - hudH - bh * s) / 2;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;
  const L = (v: number) => v * s;
  const floorY = Y(330);

  sky(ctx, width, height, theme, "indoor", floorY);
  gradientFill(ctx, 0, 0, width, floorY, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.16 : 0.1),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.34 : 0.24),
  ], 90);
  groundPlane(ctx, floorY, 0, width, height, theme, "lab");

  // Pegboard on the back wall
  ctx.save();
  ctx.globalAlpha = 0.5;
  bevelRect(ctx, X(52), Y(46), L(230), L(158), L(6), mixHex(theme.surfaceAlt, theme.ink, 0.22), { depth: -1 });
  ctx.fillStyle = hexA(theme.ink, 0.28);
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 9; c++) {
      ctx.beginPath();
      ctx.arc(X(70 + c * 25), Y(64 + r * 25), Math.max(1, L(2)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
  ctx.lineWidth = Math.max(1.4, L(4));
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(X(96), Y(70)); ctx.lineTo(X(96), Y(126));
  ctx.moveTo(X(150), Y(70)); ctx.lineTo(X(150), Y(112));
  ctx.moveTo(X(208), Y(70)); ctx.lineTo(X(232), Y(118));
  ctx.stroke();
  ctx.restore();

  // Pendant lamp and its cone
  const lampX = X(500), lampY = Y(24);
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.lineWidth = Math.max(1, L(2));
  ctx.beginPath(); ctx.moveTo(lampX, Y(0)); ctx.lineTo(lampX, lampY); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.05 * pulse(state.t, 0.25);
  ctx.fillStyle = gradient(ctx, lampX - L(230), lampY, L(460), L(320),
    [hexA(theme.sci["light"], 0.9), hexA(theme.sci["light"], 0)], 90);
  ctx.beginPath();
  ctx.moveTo(lampX - L(38), lampY + L(16));
  ctx.lineTo(lampX + L(38), lampY + L(16));
  ctx.lineTo(lampX + L(232), floorY);
  ctx.lineTo(lampX - L(232), floorY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  metal(ctx, lampX - L(40), lampY, L(80), L(20), theme.inkSoft, { radius: L(6), polish: 1 });
  glow(ctx, lampX, lampY + L(22), L(44), theme.sci["light"], 0.7);

  // The plinth
  spriteShadowEllipse(ctx, X(500), floorY + L(12), L(232), L(34), { alpha: 0.36 });
  ctx.save();
  ctx.fillStyle = gradient(ctx, X(290), floorY - L(6), L(420), L(52),
    [mixHex(theme.inkSoft, "#ffffff", 0.3), mixHex(theme.inkSoft, "#000000", 0.42)], 90);
  ctx.beginPath();
  ctx.ellipse(X(500), floorY + L(18), L(212), L(40), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mixHex(theme.inkSoft, "#000000", 0.5);
  ctx.fillRect(X(288), floorY + L(18), L(424), L(22));
  ctx.beginPath();
  ctx.ellipse(X(500), floorY + L(40), L(212), L(40), 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.35 + 0.3 * pulse(state.t, 0.35));
  ctx.lineWidth = Math.max(1.4, L(2.6));
  ctx.setLineDash([L(14), L(10)]);
  ctx.lineDashOffset = -state.t * 26;
  ctx.beginPath();
  ctx.ellipse(X(500), floorY + L(18), L(198), L(36), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* ---- the system on the plinth ---- */
  const cx = X(500), base = floorY + L(4);
  if (sys.key === "oven") {
    const domeR = L(122);
    ctx.save();
    ctx.fillStyle = gradient(ctx, cx - domeR, base - domeR, domeR * 2, domeR,
      [mixHex(theme.sci["hot"], "#ffffff", 0.14), mixHex(theme.sci["hot"], "#000000", 0.52)], 100);
    ctx.beginPath();
    ctx.ellipse(cx, base, domeR, domeR * 0.94, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    // Brick courses
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.3);
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, base, domeR * (1 - i * 0.17), domeR * 0.94 * (1 - i * 0.17), 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
    // Mouth with fire behind it
    const fire = 0.75 + 0.25 * pulse(state.t, 1.6);
    glow(ctx, cx, base - L(22), L(72) * fire, theme.sci["hot"], 0.8);
    ctx.save();
    ctx.fillStyle = mixHex(theme.ink, "#000000", 0.7);
    ctx.beginPath();
    ctx.ellipse(cx, base, L(52), L(48), 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    const flames: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const rise = (state.t * 62 + i * 19) % 54;
      flames.push({
        x: cx + L(Math.sin(state.t * 3 + i) * 16),
        y: base - L(6 + rise),
        r: L(9 - rise * 0.11),
        a: 0.85 * (1 - rise / 54),
      });
    }
    particleField(ctx, flames, theme.sci["hot"], { alpha: 0.85, buckets: 3, glow: L(9) });
    // Chimney and smoke
    material(ctx, cx + L(66), base - L(178), L(38), L(78), mixHex(theme.sci["hot"], "#000000", 0.4), L(4));
    const smoke: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const rise = (state.t * 30 + i * 17) % 118;
      smoke.push({
        x: cx + L(85 + Math.sin(state.t * 0.8 + i * 0.7) * (5 + rise * 0.14)),
        y: base - L(182 + rise),
        r: L(6 + rise * 0.11),
        a: 0.5 * (1 - rise / 118),
      });
    }
    particleField(ctx, smoke, theme.inkSoft, { alpha: 0.45, buckets: 3 });
    // Logs waiting outside the mouth
    for (let i = 0; i < 3; i++) {
      material(ctx, cx - L(216 + i * 6), base - L(10 + i * 13), L(74), L(12), mixHex(theme.ink, "#7a5a34", 0.85), L(5));
    }
  } else if (sys.key === "tank") {
    const w = L(300), h = L(178), bx = cx - w / 2, by = base - h;
    material(ctx, bx - L(10), base, w + L(20), L(18), mixHex(theme.ink, "#6b4a2c", 0.85), L(4));
    // Water, gravel, fish, bubbles — then the glass over the lot
    ctx.save();
    ctx.fillStyle = gradient(ctx, bx, by + L(14), w, h - L(14),
      [mixHex(theme.sci["liquid"], "#ffffff", 0.22), mixHex(theme.sci["liquid"], "#000000", 0.35)], 90);
    ctx.fillRect(bx + L(4), by + L(14), w - L(8), h - L(18));
    ctx.restore();
    ctx.save();
    ctx.fillStyle = mixHex(theme.ink, "#9c8a63", 0.75);
    ctx.beginPath();
    ctx.moveTo(bx + L(4), base - L(4));
    for (let i = 0; i <= 10; i++) {
      ctx.lineTo(bx + L(4) + ((w - L(8)) * i) / 10, base - L(18) - Math.sin(i * 1.7) * L(5));
    }
    ctx.lineTo(bx + w - L(4), base - L(4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const fx0 = bx + L(40) + ((w - L(80)) * ((Math.sin(state.t * 0.5 + i * 1.9) + 1) / 2));
      const fy0 = by + L(46) + L(28) * Math.sin(state.t * 0.9 + i * 2.3);
      const dir = Math.cos(state.t * 0.5 + i * 1.9) >= 0 ? 1 : -1;
      const col = i % 2 === 0 ? theme.sci["hot"] : theme.sci["light"];
      ctx.save();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(fx0, fy0, L(13), L(7), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx0 - dir * L(12), fy0);
      ctx.lineTo(fx0 - dir * L(24), fy0 - L(8));
      ctx.lineTo(fx0 - dir * L(24), fy0 + L(8));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      sphere(ctx, fx0 + dir * L(8), fy0 - L(2), L(1.8), theme.ink);
    }
    const bubbles: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const rise = (state.t * 52 + i * 21) % (h - L(26));
      bubbles.push({
        x: bx + L(44) + L(Math.sin(state.t * 2 + i) * 5),
        y: base - L(16) - rise,
        r: L(2.4 + (i % 3)),
        a: 0.75,
      });
    }
    particleField(ctx, bubbles, "#ffffff", { alpha: 0.5, buckets: 2 });
    glass(ctx, bx, by, w, h, L(4), theme, { alpha: dark ? 0.12 : 0.2 });
    metal(ctx, bx - L(6), by - L(16), w + L(12), L(20), theme.inkSoft, { radius: L(4), polish: 0.9 });
    glow(ctx, cx, by - L(4), L(120), theme.sci["light"], 0.4);
  } else {
    // Cyclist: wheels turn, legs drive, the bicycle stays outside the boundary
    const wheelR = L(56);
    const rear = cx - L(96), front = cx + L(96), axle = base - wheelR;
    for (const wx of [rear, front]) {
      ctx.save();
      ctx.strokeStyle = mixHex(theme.inkSoft, "#000000", 0.25);
      ctx.lineWidth = Math.max(2, L(6));
      ctx.beginPath(); ctx.arc(wx, axle, wheelR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
      ctx.lineWidth = Math.max(1, L(1.6));
      for (let i = 0; i < 8; i++) {
        const a = state.t * 3.4 + (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(wx, axle);
        ctx.lineTo(wx + Math.cos(a) * wheelR * 0.92, axle + Math.sin(a) * wheelR * 0.92);
        ctx.stroke();
      }
      ctx.restore();
    }
    const crank = cx - L(6);
    ctx.save();
    ctx.strokeStyle = mixHex(theme.accent, "#000000", 0.1);
    ctx.lineWidth = Math.max(2, L(7));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rear, axle); ctx.lineTo(crank, base - L(34));
    ctx.lineTo(cx - L(28), base - L(112)); ctx.lineTo(rear, axle);
    ctx.moveTo(cx - L(28), base - L(112)); ctx.lineTo(front, axle);
    ctx.moveTo(cx - L(28), base - L(112)); ctx.lineTo(cx + L(48), base - L(126));
    ctx.stroke();
    ctx.restore();
    metal(ctx, crank - L(20), base - L(38), L(40), L(9), theme.inkSoft, { radius: L(4), polish: 1 });
    // Rider
    const pedal = state.t * 3.4;
    const hip = { x: cx - L(34), y: base - L(126) };
    const knee = { x: hip.x + L(34) + L(12) * Math.cos(pedal), y: hip.y + L(46) };
    const foot = { x: crank + L(18) * Math.cos(pedal), y: base - L(34) + L(18) * Math.sin(pedal) };
    ctx.save();
    ctx.strokeStyle = theme.sci["primary-consumer"];
    ctx.lineWidth = Math.max(3, L(11));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(4, L(20));
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(cx + L(28), base - L(168));
    ctx.stroke();
    ctx.strokeStyle = theme.sci["primary-consumer"];
    ctx.lineWidth = Math.max(2.5, L(9));
    ctx.beginPath();
    ctx.moveTo(cx + L(26), base - L(164)); ctx.lineTo(cx + L(52), base - L(128));
    ctx.stroke();
    ctx.restore();
    sphere(ctx, cx + L(40), base - L(190), L(20), theme.sci["primary-consumer"]);
    // Breath and sweat, the two flows the eye can actually see
    const breath: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const d = (state.t * 58 + i * 22) % 90;
      breath.push({ x: cx + L(58 + d), y: base - L(192 + d * 0.22), r: L(3 + d * 0.07), a: 0.6 * (1 - d / 90) });
    }
    particleField(ctx, breath, theme.sci["gas"], { alpha: 0.55, buckets: 2 });
  }

  /* ---- boundary ring round the system ---- */
  if (overlays.ring !== false) {
    const box = sys.key === "oven"
      ? { x: 340, y: 132, w: 320, h: 218 }
      : sys.key === "tank"
        ? { x: 322, y: 148, w: 356, h: 202 }
        : { x: 396, y: 118, w: 210, h: 232 };
    ctx.save();
    ctx.setLineDash([L(13), L(9)]);
    ctx.lineDashOffset = -state.t * 30;
    ctx.lineWidth = Math.max(1.8, L(3));
    ctx.strokeStyle = hexA(theme.accent, 0.9);
    roundRect(ctx, X(box.x), Y(box.y), L(box.w), L(box.h), L(16));
    ctx.stroke();
    ctx.restore();
    innerGlow(ctx, (c) => roundRect(c, X(box.x), Y(box.y), L(box.w), L(box.h), L(16)),
      theme.accent, { inset: L(14), alpha: 0.16, steps: 2 });
    caption(ctx, X(box.x + box.w / 2), Y(box.y) - L(12), `boundary: ${sys.boundary}`, theme, {
      align: "center", size: Math.max(9, L(11)), color: theme.inkSoft,
    });
  }

  /* ---- HUD: the card ---- */
  const cardX = 16, cardY = 10, cardW = Math.max(320, width - 32), cardH = 58;
  const flashAge = clamp01((state.t - state.verdictAt) / 0.5);
  const flash = state.verdict === "" ? 0 : 1 - easeInOut(flashAge);
  const shake = state.verdict === "wrong" ? Math.sin(state.t * 42) * 5 * flash : 0;
  const cardTint = state.verdict === "right" ? KEEP : state.verdict === "wrong" ? OUT : theme.accent;
  ctx.save();
  ctx.translate(shake, 0);
  softShadow(ctx, () => {
    ctx.fillStyle = dark ? "rgba(18,24,33,0.95)" : "rgba(255,255,255,0.97)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 10);
    ctx.fill();
  }, { blur: 14, dy: 4, alpha: 0.3 });
  ctx.strokeStyle = hexA(cardTint, 0.4 + 0.5 * flash);
  ctx.lineWidth = 1.5 + 2 * flash;
  roundRect(ctx, cardX + 0.75, cardY + 0.75, cardW - 1.5, cardH - 1.5, 9.5);
  ctx.stroke();
  const kindCol = item.kind === "energy" ? theme.sci["energy-thermal"] : theme.sci["mass"];
  ctx.fillStyle = kindCol;
  roundRect(ctx, cardX + 1, cardY + 1, 5, cardH - 2, 3);
  ctx.fill();
  ctx.font = '600 11px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = kindCol;
  ctx.fillText(item.kind === "energy" ? "ENERGY" : "MATTER", cardX + 18, cardY + 16);
  ctx.fillStyle = theme.inkSoft;
  ctx.fillText(`${sys.name}  ·  card ${state.pos + 1} of ${sys.items.length}`, cardX + 84, cardY + 16);
  ctx.font = '700 16px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.fillStyle = theme.ink;
  ctx.fillText(item.text, cardX + 18, cardY + 39);
  ctx.restore();

  /* ---- HUD: the three verdict buttons ---- */
  for (const b of G3_BTN) {
    const isPick = state.chosen === b.key;
    const isTruth = state.verdict !== "" && item.answer === b.key;
    const col = answerColor[b.key];
    const lift = isPick ? 1 - easeInOut(flashAge) : 0;
    softShadow(ctx, () => {
      bevelRect(ctx, b.x, b.y, b.w, b.h, 10, mixHex(col, dark ? "#0d1218" : "#ffffff", 0.72), { depth: 1.6 });
    }, { blur: 10 + 8 * lift, dy: 4, alpha: 0.26, color: col });
    ctx.save();
    ctx.strokeStyle = hexA(col, isTruth ? 1 : 0.5);
    ctx.lineWidth = isTruth ? 3 : 1.5;
    roundRect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, 9);
    ctx.stroke();
    if (isTruth) {
      ctx.fillStyle = hexA(col, 0.16 + 0.14 * pulse(state.t, 2));
      roundRect(ctx, b.x, b.y, b.w, b.h, 10);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '800 15px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillStyle = col;
    ctx.fillText(b.label, b.x + b.w / 2, b.y + 22);
    ctx.font = '500 10px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillStyle = theme.inkSoft;
    ctx.fillText(b.sub, b.x + b.w / 2, b.y + 40);
    ctx.restore();
  }

  /* ---- HUD: score ---- */
  const acc = state.asked > 0 ? state.correct / state.asked : 0;
  const gx = Math.max(500, width - 132);
  arcGauge(ctx, gx, 108, 30, acc, theme.accent, theme,
    state.asked > 0 ? `${Math.round(acc * 100)}%` : "--", { sub: "accuracy", width: 7, ticks: 5 });
  badge(ctx, width - 16, 96, `${state.correct} / ${state.asked}`, theme, { align: "right", color: KEEP, sub: "cards judged" });
  badge(ctx, width - 16, 128, `streak ${state.streak}`, theme, { align: "right", color: OUT, sub: `best ${state.best}` });

  /* ---- the explanation, only after the student has committed ---- */
  if (state.verdict !== "") {
    const msg = state.verdict === "right" ? `Correct. ${item.why}` : `Not quite. ${item.why}`;
    ctx.save();
    ctx.font = '600 13px "Bricolage Grotesque", system-ui, sans-serif';
    const lines = wrapText(ctx, msg, Math.min(560, width - 80));
    const bw2 = Math.min(600, width - 60);
    const bh2 = 18 + lines.length * 18;
    const bx2 = (width - bw2) / 2, by2 = height - bh2 - 18;
    softShadow(ctx, () => {
      ctx.fillStyle = dark ? "rgba(18,24,33,0.95)" : "rgba(255,255,255,0.97)";
      roundRect(ctx, bx2, by2, bw2, bh2, 10);
      ctx.fill();
    }, { blur: 14, dy: 4, alpha: 0.32 });
    ctx.strokeStyle = hexA(state.verdict === "right" ? KEEP : OUT, 0.6);
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx2 + 0.75, by2 + 0.75, bw2 - 1.5, bh2 - 1.5, 9.5);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.ink;
    lines.forEach((ln, i) => ctx.fillText(ln, bx2 + 16, by2 + 18 + i * 18));
    ctx.restore();
  }

  vignette(ctx, width, height, 0.18);
}

export const g6a2CrossingCheck: SimManifest<G3State> = {
  id: "g6a2-crossing-check",
  title: "Crossing Check",
  tagline: "One system up on the plinth, one flow card at a time: does it come in, go out, or never cross at all?",
  subject: "engineering",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-PS3-3", "MS-ETS1-1"] },
  learningGoals: [
    "Sort a flow into input, output, or internal by checking both of its ends.",
    "Recognise that energy crossings count even when no matter moves.",
    "Explain why forces and signals inside a system are not inputs or outputs.",
  ],
  misconceptions: [
    "Anything that moves inside a system is an input or an output",
    "Only stuff you can weigh can be an input",
    "A force from outside the boundary is not an input because nothing enters",
  ],
  interactionHint: "Read the card, then tap Input, Output or Stays inside.",
  params: {
    system: {
      type: "option", label: "System on the plinth",
      options: [
        { value: "oven", label: "Wood-fired oven" },
        { value: "tank", label: "Home aquarium" },
        { value: "rider", label: "Cyclist's body" },
      ],
      default: "oven",
      help: "Each system comes with its own boundary. Read it before you judge a card.",
    },
  },
  overlays: [{ key: "ring", label: "Show the boundary", default: true }],
  model: g3Model,
  render: g3Render,
  labs: [
    {
      id: "check-both-ends",
      title: "Check both ends",
      question: "What is the one test that sorts every flow correctly?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 15,
      setup: { system: "oven" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the hard one",
          instruction: "One card reads: heat soaking from the flame into the brick dome.",
          predict: {
            prompt: "Is that an input, an output, or does it never cross the boundary?",
            options: ["Input, because heat is being supplied", "Output, because heat is moving", "It never crosses — flame and bricks are both inside"],
            correct: 2,
            reveal: "Both ends of that flow are inside the oven, so it crosses nothing. Movement is not the test; crossing the line is.",
          },
        },
        {
          id: "run-oven",
          phase: "measure",
          title: "Judge the whole oven deck",
          instruction: "Work through all nine oven cards. Take your time on the ones about heat.",
          check: { describe: "Nine cards judged on the oven", test: (v) => v.facts.system === "oven" && (v.facts.asked as number) >= 9 },
          hints: ["Say the flow out loud as a sentence: it starts at ... and ends at ...", "If both ends are inside the dashed line, nothing crosses."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Look at what you got wrong",
          instruction: "Your accuracy dial is on the right of the button row.",
          write: {
            prompt: "Which card fooled you, and what were you using as your test instead of the two-ends rule?",
            placeholder: "I got ... wrong because I was really asking myself whether ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the two-ends rule",
          instruction: "One sentence, no examples.",
          write: {
            prompt: "Write the test for sorting any flow into input, output or internal.",
            placeholder: "Look at where the flow starts and where it ends. If ...",
          },
        },
      ],
    },
    {
      id: "same-flow-new-system",
      title: "Same flow, different system",
      question: "Can one flow be an output in one system and internal in another?",
      bands: ["6-8", "9-12"],
      minutes: 18,
      setup: { system: "rider" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Think about the pedal",
          instruction: "The boundary here is the rider's body only. The bicycle is outside it.",
          predict: {
            prompt: "The rider's leg pushes down on the pedal. For the body-only system, that is:",
            options: ["An output — energy leaves the body", "Internal — the leg is part of the rider", "Neither, because a push is not matter"],
            correct: 0,
            reveal: "Work done on something outside the boundary is energy leaving. Draw the boundary round rider plus bicycle instead and that same push becomes internal.",
          },
        },
        {
          id: "rider-deck",
          phase: "measure",
          title: "Judge the cyclist deck",
          instruction: "Work through the nine cyclist cards.",
          check: { describe: "Nine cards judged on the cyclist", test: (v) => v.facts.system === "rider" && (v.facts.asked as number) >= 9 },
        },
        {
          id: "tank-deck",
          phase: "measure",
          title: "Now the aquarium",
          instruction: "Switch the plinth to the home aquarium and judge that deck too.",
          check: { describe: "Six or more aquarium cards judged", test: (v) => v.facts.system === "tank" && (v.facts.asked as number) >= 6 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the two boundaries",
          instruction: "The pump moving water is internal. The lamp shining in is an input. Both involve energy.",
          write: {
            prompt: "Why is the lamp an input but the pump internal, when the pump uses more energy?",
            placeholder: "It is not about how much energy. It is about ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the dependency",
          instruction: "Finish the sentence honestly.",
          write: {
            prompt: "Whether a flow is an input depends on ... and not on ...",
            placeholder: "It depends on where the boundary is drawn, not on ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "clean-run",
      title: "Clean run",
      brief: "Judge a full deck of nine cards with at least eight right.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { system: "oven" },
      goal: {
        describe: "Nine cards judged, eight or more correct",
        test: (v) => (v.facts.asked as number) >= 9 && (v.facts.correct as number) >= 8,
      },
      stars: {
        two: { describe: "All nine correct", test: (v) => (v.facts.asked as number) >= 9 && (v.facts.correct as number) >= 9 },
        three: {
          describe: "A streak of twelve without a single slip",
          test: (v) => (v.facts.best as number) >= 12,
        },
      },
      hints: ["The energy cards catch people out. Ask where the energy starts and where it stops."],
    },
    {
      id: "inspector-badge",
      title: "Inspector's badge",
      brief: "Reach eighty per cent accuracy across at least twenty cards from more than one system.",
      bands: ["6-8", "9-12"],
      setup: { system: "tank" },
      goal: {
        describe: "Twenty cards judged at 80 per cent or better",
        test: (v) => (v.facts.asked as number) >= 20 && (v.facts.accuracy as number) >= 80,
      },
      stars: {
        two: { describe: "Twenty cards at 90 per cent", test: (v) => (v.facts.asked as number) >= 20 && (v.facts.accuracy as number) >= 90 },
        three: { describe: "Thirty cards at 90 per cent", test: (v) => (v.facts.asked as number) >= 30 && (v.facts.accuracy as number) >= 90 },
      },
      hints: [
        "Switching the system reshuffles the deck but keeps your score.",
        "Read the boundary line under the plinth before the first card of a new system.",
      ],
    },
  ],
};
