import type { ParamValues, RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, material, sky, sphere, starfield, vignette,
} from "@ui/scene";

/**
 * Heat Transfer — Grade 6, Unit C topics C3 (thermal energy transfer) and
 * C5 (engineering with thermal energy). Also serves Grade 8 B4.3.
 *
 * One cutaway house on a cold day, with all three ways energy moves in it
 * running at once:
 *
 *   conduction  a bar bridges a hot block and a cold block on the bench. Heat
 *               crawls along it node by node — a real 1-D solution of
 *               ∂T/∂t = α ∂²T/∂x² — and the two blocks drift toward the same
 *               temperature, which is the mass-weighted mean of everything the
 *               bar connects. Swap copper for wood and the crawl stops dead.
 *   convection  the heater drives a circulation loop: warm air rises, spreads
 *               along the ceiling, cools at the window and sinks back down.
 *   radiation   sunlight crosses the vacuum of space, where there are no
 *               particles at all to carry it, and warms a plate on the floor.
 *               A matt black plate warms; a shiny one hardly notices.
 *
 * The design task (C5) is the mug on the table: choose a jacket material and
 * thickness to keep a hot drink above temperature for as long as possible.
 * The mug obeys Newton's law of cooling exactly, with a time constant set by
 * the insulation the student chose.
 *
 * Every material property below is a textbook value at room temperature.
 * Because real thermal processes take minutes to hours, the sim runs at
 * `timeScale` sim-seconds per real second — the clock on screen is honest.
 */

/* ------------------------------------------------------------------ *
 * Material data — all textbook values, SI
 * ------------------------------------------------------------------ */

export interface BarMaterial {
  label: string;
  /** Thermal conductivity, W/(m·K). */
  k: number;
  /** Density, kg/m³. */
  rho: number;
  /** Specific heat capacity, J/(kg·K). */
  c: number;
}

export const BAR_MATERIALS: Record<string, BarMaterial> = {
  copper: { label: "Copper", k: 401, rho: 8960, c: 385 },
  aluminium: { label: "Aluminium", k: 237, rho: 2700, c: 897 },
  steel: { label: "Steel", k: 50, rho: 7850, c: 466 },
  glass: { label: "Glass", k: 1.0, rho: 2500, c: 840 },
  wood: { label: "Wood", k: 0.15, rho: 700, c: 1700 },
};

/** Thermal diffusivity α = k/(ρc), m²/s — how fast a temperature front moves. */
export function diffusivity(m: BarMaterial): number {
  return m.k / (m.rho * m.c);
}

export interface Jacket {
  label: string;
  /** Thermal conductivity of the jacket, W/(m·K). */
  k: number;
  /**
   * Combined convection + radiation film coefficient at the outer surface,
   * W/(m²·K). A shiny foil face cuts the radiative half of it.
   */
  film: number;
}

export const JACKETS: Record<string, Jacket> = {
  none: { label: "Nothing", k: 1e9, film: 12 },
  paper: { label: "Paper", k: 0.05, film: 12 },
  cotton: { label: "Cotton wool", k: 0.04, film: 12 },
  wool: { label: "Wool felt", k: 0.038, film: 12 },
  foam: { label: "Polystyrene foam", k: 0.033, film: 12 },
  foil: { label: "Foil-faced foam", k: 0.033, film: 5 },
};

/* ------------------------------------------------------------------ *
 * Apparatus constants
 * ------------------------------------------------------------------ */

const BAR_LENGTH = 0.2;      // m
const BAR_AREA = 1e-4;       // m², a 1 cm² strip
const NODES = 24;
const BLOCK_C = 100;         // J/K, each end block

const ROOM_C = 72360;        // J/K — 60 m³ of air at 1.2 kg/m³ and 1005 J/(kg·K)
const WALL_AREA = 60;        // m²
/** Wall resistance: brick, 100 mm of mineral wool, and both surface films. */
const WALL_R = 0.31 + 0.1 / 0.04;
const ROOM_HEIGHT = 2.5;     // m, the height the convection loop climbs
const PLUME_AREA = 0.06;     // m², cross-section of the rising plume

const PLATE_AREA = 0.04;     // m², a 20 cm square
const PLATE_C = 179;         // J/K, 0.2 kg of aluminium
const PLATE_FILM = 8;        // W/(m²·K), still air on the plate

const MUG_C = 1047;          // J/K, 250 ml of water
const MUG_AREA = 0.035;      // m²

export const EMISSIVITY: Record<string, number> = {
  matt: 0.95,
  grey: 0.5,
  shiny: 0.05,
};

/** The convection animation runs this many times slower than the thermal clock. */
const FLOW_SLOWDOWN = 900;

/* ------------------------------------------------------------------ *
 * Closed-form physics the tests pin
 * ------------------------------------------------------------------ */

/**
 * The single temperature a set of thermally connected bodies must end up at:
 * the heat-capacity-weighted mean. Nothing is created or destroyed, so the
 * total energy ΣCᵢTᵢ simply gets shared out until every T is the same.
 */
export function equilibriumTemperature(parts: { C: number; T: number }[]): number {
  let num = 0, den = 0;
  for (const p of parts) { num += p.C * p.T; den += p.C; }
  return den > 0 ? num / den : 0;
}

/** Newton's law of cooling in closed form, temperatures in kelvin. */
export function newtonCooling(T0: number, ambient: number, tau: number, t: number): number {
  return ambient + (T0 - ambient) * Math.exp(-t / tau);
}

/** Heat-loss conductance of the mug and its jacket, W/K. */
export function mugConductance(jacket: Jacket, thickness: number): number {
  // Series resistances: through the jacket, then off the outer surface.
  const r = thickness / jacket.k + 1 / jacket.film;
  return MUG_AREA / r;
}

/** Time constant of the mug's cooling, seconds. */
export function mugTimeConstant(jacket: Jacket, thickness: number): number {
  return MUG_C / mugConductance(jacket, thickness);
}

/** Net power radiated from a surface at T to surroundings at Tamb, watts. */
export function netRadiation(emissivity: number, area: number, T: number, Tamb: number): number {
  return emissivity * CONSTANTS.sigma * area * (T ** 4 - Tamb ** 4);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface Sample {
  t: number;
  hot: number;
  cold: number;
  room: number;
  plate: number;
  mug: number;
}

interface State {
  t: number;
  /** Bar node temperatures, kelvin, hot end first. */
  bar: number[];
  hotT: number;
  coldT: number;
  roomT: number;
  plateT: number;
  mugT: number;
  /** The drink's temperature the moment half an hour was up, kelvin. */
  mugAt30: number;
  samples: Sample[];
}

const SAMPLE_EVERY = 5;   // sim seconds
const MAX_SAMPLES = 500;
const ROOM_START = 293.15; // K, 20 °C

function freshState(params: ParamValues): State {
  const hot = params.hotStart as number;
  const cold = params.coldStart as number;
  const bar = new Array<number>(NODES).fill(ROOM_START);
  return {
    t: 0,
    bar,
    hotT: hot,
    coldT: cold,
    roomT: ROOM_START,
    plateT: ROOM_START,
    mugT: hot,
    mugAt30: hot,
    samples: [{ t: 0, hot, cold, room: ROOM_START, plate: ROOM_START, mug: hot }],
  };
}

/** Every body the conduction bench connects, for the equilibrium calculation. */
function benchParts(state: State, mat: BarMaterial): { C: number; T: number }[] {
  const dx = BAR_LENGTH / NODES;
  const nodeC = mat.rho * mat.c * BAR_AREA * dx;
  return [
    { C: BLOCK_C, T: state.hotT },
    ...state.bar.map((T) => ({ C: nodeC, T })),
    { C: BLOCK_C, T: state.coldT },
  ];
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    // Restarting on a material swap is the point: you want the same crawl
    // raced again. The environment controls stay live.
    const keys = ["barMaterial", "hotStart", "coldStart"];
    if (keys.some((k) => params[k] !== prev[k])) return freshState(params);
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const mat = BAR_MATERIALS[params.barMaterial as string] ?? BAR_MATERIALS.copper;
    const jacket = JACKETS[params.jacket as string] ?? JACKETS.none;
    const thickness = params.jacketThickness as number;
    const outside = params.outsideT as number;
    const heater = params.heaterPower as number;
    const sun = params.sunPower as number;
    const emissivity = EMISSIVITY[params.plateFinish as string] ?? EMISSIVITY.matt;

    /* ---- conduction along the bar: explicit 1-D heat equation ---- */
    const dx = BAR_LENGTH / NODES;
    const nodeC = mat.rho * mat.c * BAR_AREA * dx;
    const gInner = (mat.k * BAR_AREA) / dx;
    // The end blocks sit half a cell from the first and last node.
    const gEnd = (2 * mat.k * BAR_AREA) / dx;
    // Explicit stepping is only stable below C/(ΣG); stay well inside it.
    const stable = 0.35 * Math.min(
      nodeC / (gInner + gEnd),
      nodeC / (2 * gInner),
      BLOCK_C / gEnd,
    );
    const sub = Math.min(96, Math.max(1, Math.ceil(dt / stable)));
    const h = dt / sub;

    let bar = state.bar.slice();
    let hotT = state.hotT;
    let coldT = state.coldT;
    for (let s = 0; s < sub; s++) {
      const next = bar.slice();
      for (let i = 0; i < NODES; i++) {
        let flow = 0;
        flow += i === 0 ? gEnd * (hotT - bar[0]) : gInner * (bar[i - 1] - bar[i]);
        flow += i === NODES - 1 ? gEnd * (coldT - bar[i]) : gInner * (bar[i + 1] - bar[i]);
        next[i] = bar[i] + (flow / nodeC) * h;
      }
      const hotFlow = gEnd * (hotT - bar[0]);
      const coldFlow = gEnd * (coldT - bar[NODES - 1]);
      hotT -= (hotFlow / BLOCK_C) * h;
      coldT -= (coldFlow / BLOCK_C) * h;
      bar = next;
    }

    /* ---- the room: heater in, walls out ---- */
    const wallUA = WALL_AREA / WALL_R;
    const roomT = state.roomT + ((heater - wallUA * (state.roomT - outside)) / ROOM_C) * dt;

    /* ---- the plate: sunlight in, radiation and still air out ---- */
    const absorbed = emissivity * sun * PLATE_AREA;
    const lost = netRadiation(emissivity, PLATE_AREA, state.plateT, roomT)
      + PLATE_FILM * PLATE_AREA * (state.plateT - roomT);
    const plateT = state.plateT + ((absorbed - lost) / PLATE_C) * dt;

    /* ---- the mug: Newton's law of cooling into the room ---- */
    // Newton's law of cooling. The fraction of a watt the mug sheds is left out
    // of the room's balance: against a 72 kJ/K room it moves the air by under a
    // hundredth of a degree in half an hour.
    const ua = mugConductance(jacket, thickness);
    const mugT = state.mugT - ((ua * (state.mugT - roomT)) / MUG_C) * dt;

    const t = state.t + dt;
    let samples = state.samples;
    const last = samples[samples.length - 1];
    if (!last || t - last.t >= SAMPLE_EVERY) {
      samples = samples.length >= MAX_SAMPLES ? samples.slice(1) : samples.slice();
      samples.push({ t, hot: hotT, cold: coldT, room: roomT, plate: plateT, mug: mugT });
    }

    // The half-hour reading the design brief is judged on, captured once.
    const mugAt30 = state.t < 1800 && t >= 1800 ? mugT : state.mugAt30;

    return { ...state, t, bar, hotT, coldT, roomT, plateT, mugT, mugAt30, samples };
  },

  readouts(state, params) {
    const mat = BAR_MATERIALS[params.barMaterial as string] ?? BAR_MATERIALS.copper;
    const jacket = JACKETS[params.jacket as string] ?? JACKETS.none;
    const thickness = params.jacketThickness as number;
    const emissivity = EMISSIVITY[params.plateFinish as string] ?? EMISSIVITY.matt;
    const dx = BAR_LENGTH / NODES;
    const barFlow = (mat.k * BAR_AREA * (state.bar[0] - state.bar[NODES - 1]))
      / (BAR_LENGTH - dx);

    return [
      { key: "hotT", label: "Hot block", quantity: q(state.hotT, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      { key: "coldT", label: "Cold block", quantity: q(state.coldT, "temperature"), unit: "°C", semantic: "cold", graphable: true },
      { key: "gap", label: "Temperature difference", quantity: q(state.hotT - state.coldT, "temperature"), unit: "K", semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"] },
      { key: "barFlow", label: "Heat flowing along the bar", quantity: q(barFlow, "power"), unit: "W", semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"] },
      { key: "roomT", label: "Room air", quantity: q(state.roomT, "temperature"), unit: "°C", semantic: "energy-thermal", graphable: true },
      { key: "plateT", label: "Sunlit plate", quantity: q(state.plateT, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      { key: "mugT", label: "Drink in the mug", quantity: q(state.mugT, "temperature"), unit: "°C", semantic: "hot", graphable: true },
      {
        key: "mugTau", label: "Mug cooling time constant",
        quantity: q(mugTimeConstant(jacket, thickness), "time"), unit: "min",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "plateRadiated", label: "Power the plate radiates away",
        quantity: q(netRadiation(emissivity, PLATE_AREA, state.plateT, state.roomT), "power"),
        unit: "W", semantic: "light", graphable: true, bands: ["9-12"],
      },
      {
        key: "diffusivity", label: "Bar diffusivity (m²/s)",
        quantity: q(diffusivity(mat), "ratio"),
        semantic: "energy-thermal", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const mat = BAR_MATERIALS[params.barMaterial as string] ?? BAR_MATERIALS.copper;
    const jacket = JACKETS[params.jacket as string] ?? JACKETS.none;
    const thickness = params.jacketThickness as number;
    const eq = equilibriumTemperature(benchParts(state, mat));
    return {
      t: state.t,
      hotT: state.hotT,
      coldT: state.coldT,
      gap: state.hotT - state.coldT,
      equilibriumT: eq,
      converged: Math.abs(state.hotT - state.coldT) < 1,
      barHotEnd: state.bar[0],
      barColdEnd: state.bar[NODES - 1],
      barMoved: state.bar[NODES - 1] - ROOM_START,
      roomT: state.roomT,
      plateT: state.plateT,
      mugT: state.mugT,
      mugTau: mugTimeConstant(jacket, thickness),
      mugUA: mugConductance(jacket, thickness),
      jacketThickness: thickness,
      minutes: state.t / 60,
      // The design brief: still drinkable after half an hour?
      halfHourDone: state.t >= 1800,
      mugAt30: state.mugAt30,
      diffusivity: diffusivity(mat),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

interface Rect { x: number; y: number; w: number; h: number }

/** The one thermal ramp the whole sim reads temperature through. */
function thermal(theme: ThemeColors, T: number, lo: number, hi: number): string {
  const f = Math.max(0, Math.min(1, (T - lo) / Math.max(1e-6, hi - lo)));
  return mixHex(theme.sci["cold"], theme.sci["hot"], f);
}

const C = (K: number) => K - 273.15;

function panel(
  ctx: CanvasRenderingContext2D, r: Rect, theme: ThemeColors, title: string, compact: boolean,
) {
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? hexA(theme.surface, 0.55) : hexA(theme.surface, 0.75);
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  if (!compact) caption(ctx, r.x + 8, r.y + 12, title, theme, { size: 11, weight: 700 });
}

/** A bulb thermometer showing one temperature, on the thermal ramp. */
function thermometer(
  ctx: CanvasRenderingContext2D, x: number, y: number, h: number,
  T: number, lo: number, hi: number, theme: ThemeColors, label?: string,
) {
  const w = 7;
  const f = Math.max(0, Math.min(1, (T - lo) / Math.max(1e-6, hi - lo)));
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.9);
  roundRect(ctx, x - w / 2, y - h, w, h, w / 2);
  ctx.fill();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = thermal(theme, T, lo, hi);
  roundRect(ctx, x - w / 2 + 1.5, y - 2 - (h - 4) * f, w - 3, (h - 4) * f, (w - 3) / 2);
  ctx.fill();
  ctx.restore();
  sphere(ctx, x, y, w * 0.85, thermal(theme, T, lo, hi));
  if (label) {
    caption(ctx, x, y + 14, label, theme, { align: "center", size: 9, color: theme.inkSoft });
  }
}

/* ---- station 1: the conduction bench ---- */
function drawConduction(
  ctx: CanvasRenderingContext2D, r: Rect, state: State, params: ParamValues,
  theme: ThemeColors, compact: boolean, overlays: Record<string, boolean>,
) {
  const mat = BAR_MATERIALS[params.barMaterial as string] ?? BAR_MATERIALS.copper;
  const lo = 273.15, hi = 373.15;
  const blockW = Math.min(52, r.w * 0.2);
  const barY = r.y + r.h * 0.52;
  const barH = Math.max(10, Math.min(26, r.h * 0.14));
  const x0 = r.x + 10 + blockW;
  const x1 = r.x + r.w - 10 - blockW;

  // The bar, painted node by node: this is the crawl.
  const segW = (x1 - x0) / NODES;
  for (let i = 0; i < NODES; i++) {
    ctx.save();
    ctx.fillStyle = thermal(theme, state.bar[i], lo, hi);
    ctx.fillRect(x0 + i * segW, barY - barH / 2, segW + 0.6, barH);
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.35);
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, barY - barH / 2, x1 - x0, barH);
  ctx.restore();

  // The two blocks, drawn at their own temperature.
  material(ctx, r.x + 8, barY - blockW / 2 - 4, blockW, blockW + 8,
    thermal(theme, state.hotT, lo, hi), 4);
  material(ctx, r.x + r.w - 8 - blockW, barY - blockW / 2 - 4, blockW, blockW + 8,
    thermal(theme, state.coldT, lo, hi), 4);

  if (overlays.arrows !== false && state.hotT - state.coldT > 0.5) {
    const mid = (x0 + x1) / 2;
    arrow(ctx, mid - 26, barY - barH - 10, mid + 26, barY - barH - 10,
      theme.sci["energy-thermal"], { width: 2.4 });
  }

  if (!compact) {
    badge(ctx, r.x + 8 + blockW / 2, barY - blockW / 2 - 18, `${C(state.hotT).toFixed(0)} °C`,
      theme, { align: "center", color: theme.sci["hot"] });
    badge(ctx, r.x + r.w - 8 - blockW / 2, barY - blockW / 2 - 18, `${C(state.coldT).toFixed(0)} °C`,
      theme, { align: "center", color: theme.sci["cold"] });
    caption(ctx, r.x + r.w / 2, barY + barH / 2 + 16,
      `${mat.label} bar · k = ${mat.k} W/m·K`, theme,
      { align: "center", size: 10, color: theme.inkSoft });
    caption(ctx, r.x + r.w / 2, r.y + r.h - 8,
      `both blocks head for ${C(equilibriumTemperature(benchParts(state, mat))).toFixed(1)} °C`,
      theme, { align: "center", size: 10, color: theme.sci["energy-thermal"] });
  }
  if (!compact && r.h > 150) {
    for (let i = 2; i < NODES; i += 7) {
      thermometer(ctx, x0 + (i + 0.5) * segW, barY - barH / 2 - 6, 26, state.bar[i], lo, hi, theme);
    }
  }
}

/* ---- station 2: the convecting room ---- */
function drawConvection(
  ctx: CanvasRenderingContext2D, r: Rect, state: State, params: ParamValues,
  theme: ThemeColors, compact: boolean, overlays: Record<string, boolean>,
) {
  const heater = params.heaterPower as number;
  const outside = params.outsideT as number;
  const lo = outside - 2, hi = outside + 40;

  // The plume above the heater runs roughly 30 K hotter than the room, and that
  // buoyancy is what drives the loop: u ≈ √(g·β·ΔT·H), with β = 1/T for air.
  const speed = Math.sqrt((9.81 * 30 * ROOM_HEIGHT) / state.roomT);
  // Every watt the heater delivers rides up in that plume, so the air it
  // carries is warmed by ΔT = P / (ṁ·c) — a few degrees, which is why a
  // convecting room is very nearly all one temperature.
  const massFlow = 1.2 * PLUME_AREA * speed;
  const strat = heater > 0 ? heater / (massFlow * 1005) : 0;
  const warm = state.roomT + strat;

  // Room shell.
  const inset = { x: r.x + 12, y: r.y + 16, w: r.w - 24, h: r.h - 34 };
  ctx.save();
  ctx.fillStyle = hexA(thermal(theme, state.roomT, lo, hi), 0.28);
  roundRect(ctx, inset.x, inset.y, inset.w, inset.h, 5);
  ctx.fill();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // The heater, glowing on the left wall.
  const hx = inset.x + inset.w * 0.16;
  const hy = inset.y + inset.h - 14;
  if (heater > 0) glow(ctx, hx, hy, 34, theme.sci["hot"], 0.5);
  material(ctx, hx - 16, hy - 12, 32, 14, thermal(theme, warm + 20, lo, hi), 3);

  // The window, cold on the right wall.
  const wx = inset.x + inset.w - 6;
  material(ctx, wx - 6, inset.y + inset.h * 0.2, 10, inset.h * 0.45,
    thermal(theme, outside, lo, hi), 2);

  /* The loop the air actually travels: up over the heater, along the ceiling,
     down the cold window, back across the floor. */
  const pad = 16;
  const lx = inset.x + inset.w * 0.16;
  const rx = inset.x + inset.w - pad;
  const ty = inset.y + pad;
  const by = inset.y + inset.h - pad;
  const loop = (s: number): { x: number; y: number } => {
    const u = ((s % 1) + 1) % 1;
    if (u < 0.3) return { x: lx, y: by + ((ty - by) * u) / 0.3 };
    if (u < 0.5) return { x: lx + ((rx - lx) * (u - 0.3)) / 0.2, y: ty };
    if (u < 0.8) return { x: rx, y: ty + ((by - ty) * (u - 0.5)) / 0.3 };
    return { x: rx + ((lx - rx) * (u - 0.8)) / 0.2, y: by };
  };
  // Warmest at the top of the rise, coldest at the foot of the window.
  const hotness = (s: number): number => {
    const u = ((s % 1) + 1) % 1;
    if (u >= 0.3 && u < 0.8) return 1 - (u - 0.3) / 0.5;
    return Math.min(1, (((u - 0.8 + 1) % 1)) / 0.5);
  };

  if (overlays.particles !== false) {
    // Animated for viewing: the real current is far quicker than the eye wants.
    const phase = (state.t * speed) / (FLOW_SLOWDOWN * 0.1);
    const count = compact ? 16 : 30;
    for (let i = 0; i < count; i++) {
      const s = (i / count + phase) % 1;
      const p = loop(s);
      const T = state.roomT + strat * hotness(s);
      sphere(ctx, p.x, p.y, compact ? 3 : 4.5, thermal(theme, T, lo, hi), { glow: 0.25 });
    }
  }
  if (overlays.arrows !== false) {
    for (const s of [0.15, 0.4, 0.65, 0.9]) {
      const a = loop(s - 0.03), b = loop(s + 0.03);
      arrow(ctx, a.x, a.y, b.x, b.y, hexA(theme.sci["energy-thermal"], 0.9), { width: 2 });
    }
  }

  if (!compact) {
    caption(ctx, inset.x + inset.w / 2, inset.y - 4, "warm air rises, cool air sinks", theme, {
      align: "center", size: 11, weight: 700, color: theme.sci["hot"],
    });
    badge(ctx, inset.x + inset.w / 2, inset.y + inset.h / 2, `${C(state.roomT).toFixed(1)} °C`,
      theme, { align: "center", color: theme.sci["energy-thermal"], sub: "room air" });
    caption(ctx, r.x + 10, r.y + r.h - 6,
      `current ≈ ${speed.toFixed(2)} m/s · shown slowed`, theme,
      { size: 9, color: theme.inkSoft });
    caption(ctx, r.x + r.w - 10, r.y + r.h - 6, `outside ${C(outside).toFixed(0)} °C`, theme, {
      align: "right", size: 9, color: theme.sci["cold"],
    });
  }
}

/* ---- station 3: radiation across a vacuum ---- */
function drawRadiation(
  ctx: CanvasRenderingContext2D, r: Rect, state: State, params: ParamValues,
  theme: ThemeColors, compact: boolean, overlays: Record<string, boolean>,
) {
  const sun = params.sunPower as number;
  const emissivity = EMISSIVITY[params.plateFinish as string] ?? EMISSIVITY.matt;
  const lo = 273.15, hi = 353.15;

  // The vacuum gap, drawn as what it is: space, with nothing in it.
  const gapW = r.w * 0.45;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, gapW, r.h);
  ctx.clip();
  sky(ctx, r.x + gapW, r.y + r.h, theme, "space", r.y + r.h);
  starfield(ctx, r.x + gapW, r.y + r.h, compact ? 24 : 60, 7);
  ctx.restore();

  const sx = r.x + gapW * 0.22;
  const sy = r.y + r.h * 0.3;
  glow(ctx, sx, sy, compact ? 26 : 42, theme.sci["hot"], 0.75);
  sphere(ctx, sx, sy, compact ? 12 : 18, theme.sci["hot"], { glow: 0.6 });

  // The plate inside, warming.
  const px = r.x + r.w * 0.76;
  const py = r.y + r.h * 0.55;
  const pw = Math.max(10, r.w * 0.09);
  const ph = Math.max(24, r.h * 0.34);
  material(ctx, px - pw / 2, py - ph / 2, pw, ph, thermal(theme, state.plateT, lo, hi), 3);

  // The window in the wall between them.
  const wallX = r.x + gapW;
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.85);
  ctx.fillRect(wallX - 4, r.y, 8, r.h);
  ctx.fillStyle = hexA(theme.sci["light"], 0.28);
  ctx.fillRect(wallX - 4, r.y + r.h * 0.24, 8, r.h * 0.46);
  ctx.restore();

  // Photon packets crossing, at a rate that follows the real irradiance.
  if (overlays.arrows !== false && sun > 0) {
    const rays = compact ? 3 : 5;
    for (let i = 0; i < rays; i++) {
      const frac = ((state.t * (0.25 + sun / 1400) + i / rays) % 1);
      const x = sx + (px - sx) * frac;
      const y = sy + (py - sy) * frac;
      sphere(ctx, x, y, compact ? 2.5 : 3.5, theme.sci["light"], { glow: 0.9 });
    }
    arrow(ctx, sx + 22, sy + 8, px - pw / 2 - 6, py - 6, hexA(theme.sci["light"], 0.55),
      { width: 1.6, dashed: true });
  }

  if (!compact) {
    caption(ctx, r.x + gapW * 0.5, r.y + r.h - 10, "vacuum — no particles at all", theme, {
      align: "center", size: 10, color: theme.sci["light"],
    });
    badge(ctx, px, py - ph / 2 - 16, `${C(state.plateT).toFixed(0)} °C`, theme, {
      align: "center", color: theme.sci["hot"],
      sub: `${(emissivity * 100).toFixed(0)}% absorbing`,
    });
    caption(ctx, r.x + r.w - 8, r.y + 14, `${sun.toFixed(0)} W/m²`, theme, {
      align: "right", size: 10, color: theme.sci["light"],
    });
  }
}

/* ---- station 4: the insulation design task ---- */
function drawInsulation(
  ctx: CanvasRenderingContext2D, r: Rect, state: State, params: ParamValues,
  theme: ThemeColors, compact: boolean,
) {
  const jacket = JACKETS[params.jacket as string] ?? JACKETS.none;
  const thickness = params.jacketThickness as number;
  const lo = 293.15, hi = 373.15;
  const tau = mugTimeConstant(jacket, thickness);

  const cx = r.x + r.w * 0.32;
  const cy = r.y + r.h * 0.62;
  const mugW = Math.min(70, r.w * 0.26);
  const mugH = Math.min(84, r.h * 0.5);
  const jacketPx = Math.max(2, (thickness / 0.03) * (compact ? 8 : 16));

  // The jacket, drawn as the real thickness the student chose.
  if (jacket.k < 1e6 && thickness > 0) {
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["cold"], 0.35);
    roundRect(ctx, cx - mugW / 2 - jacketPx, cy - mugH / 2 - jacketPx,
      mugW + jacketPx * 2, mugH + jacketPx * 2, 6);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  material(ctx, cx - mugW / 2, cy - mugH / 2, mugW, mugH,
    thermal(theme, state.mugT, lo, hi), 5);
  glow(ctx, cx, cy - mugH / 2, mugW * 0.6, theme.sci["hot"],
    Math.max(0, Math.min(0.5, (state.mugT - 313.15) / 120)));

  // Escaping heat, thinned by whatever the jacket stops.
  const leak = Math.min(1, mugConductance(jacket, thickness) / 0.45);
  const arrows = Math.max(1, Math.round(leak * 5));
  for (let i = 0; i < arrows; i++) {
    const ay = cy - mugH / 2 + (i + 0.5) * (mugH / arrows);
    arrow(ctx, cx + mugW / 2 + jacketPx + 4, ay,
      cx + mugW / 2 + jacketPx + 12 + leak * 26, ay,
      hexA(theme.sci["energy-thermal"], 0.4 + leak * 0.5), { width: 1.8 });
  }

  if (!compact) {
    badge(ctx, cx, cy - mugH / 2 - jacketPx - 18, `${C(state.mugT).toFixed(1)} °C`, theme, {
      align: "center", color: theme.sci["hot"], sub: "the drink",
    });
    caption(ctx, r.x + r.w - 10, r.y + r.h * 0.32,
      `${jacket.label}, ${(thickness * 1000).toFixed(0)} mm`, theme,
      { align: "right", size: 11, weight: 700 });
    caption(ctx, r.x + r.w - 10, r.y + r.h * 0.32 + 16,
      `cools with a time constant of ${(tau / 60).toFixed(0)} min`, theme,
      { align: "right", size: 10, color: theme.inkSoft });
    caption(ctx, r.x + r.w - 10, r.y + r.h * 0.32 + 32,
      `${(state.t / 60).toFixed(0)} min gone`, theme,
      { align: "right", size: 10, color: theme.sci["time"] });
  }
}

/* ---- the temperature graph: where equilibrium becomes visible ---- */
function drawGraph(
  ctx: CanvasRenderingContext2D, r: Rect, state: State, theme: ThemeColors, compact: boolean,
) {
  panel(ctx, r, theme, "temperature against time", compact);
  const gx = r.x + (compact ? 22 : 34);
  const gy = r.y + (compact ? 8 : 20);
  const gw = r.w - (compact ? 30 : 48);
  const gh = r.h - (compact ? 20 : 34);

  let lo = 273.15, hi = 373.15;
  for (const s of state.samples) {
    lo = Math.min(lo, s.cold, s.room, s.plate, s.mug, s.hot);
    hi = Math.max(hi, s.cold, s.room, s.plate, s.mug, s.hot);
  }
  lo = Math.floor((lo - 2) / 10) * 10;
  hi = Math.ceil((hi + 2) / 10) * 10;

  const tEnd = Math.max(600, state.t);
  const tStart = Math.max(0, tEnd - 3600);
  const X = (t: number) => gx + ((t - tStart) / Math.max(1, tEnd - tStart)) * gw;
  const Y = (T: number) => gy + gh - ((T - lo) / Math.max(1e-6, hi - lo)) * gh;

  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.stroke();
  ctx.restore();

  const series: [string, (s: Sample) => number, string][] = [
    ["hot block", (s) => s.hot, theme.sci["hot"]],
    ["cold block", (s) => s.cold, theme.sci["cold"]],
    ["room", (s) => s.room, theme.sci["energy-thermal"]],
    ["plate", (s) => s.plate, theme.sci["light"]],
    ["drink", (s) => s.mug, theme.accent],
  ];
  for (const [, pick, color] of series) {
    if (state.samples.length < 2) break;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const s of state.samples) {
      if (s.t < tStart) continue;
      const px = X(s.t), py = Y(pick(s));
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (!compact) {
    ctx.save();
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let T = lo; T <= hi + 1e-6; T += Math.max(10, Math.round((hi - lo) / 5 / 10) * 10)) {
      ctx.fillText(`${C(T).toFixed(0)}`, gx - 4, Y(T));
    }
    ctx.restore();
    caption(ctx, gx + gw, gy + gh + 11, `${(tEnd / 60).toFixed(0)} min`, theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
    let lx = gx + 6;
    for (const [name, , color] of series) {
      caption(ctx, lx, gy + 8, name, theme, { size: 9, color });
      lx += Math.max(46, gw / 6);
    }
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const compact = width < 460 || height < 300;
  const station = params.station as string;

  /* ---- the place ---- */
  sky(ctx, width, height, theme, "indoor", height);

  const showGraph = overlays.graph !== false && band !== "3-5";
  const graphH = showGraph ? Math.max(70, Math.min(height * 0.32, 190)) : 0;
  const sceneH = height - graphH - (showGraph ? 8 : 0);
  const pad = compact ? 6 : 12;

  const stations: [string, (r: Rect) => void][] = [];
  const add = (key: string, fn: (r: Rect) => void) => {
    if (station === "all" || station === key) stations.push([key, fn]);
  };
  add("conduction", (r) => drawConduction(ctx, r, state, params, theme, compact, overlays));
  add("convection", (r) => drawConvection(ctx, r, state, params, theme, compact, overlays));
  add("radiation", (r) => drawRadiation(ctx, r, state, params, theme, compact, overlays));
  add("insulation", (r) => drawInsulation(ctx, r, state, params, theme, compact));
  if (stations.length === 0) {
    add("conduction", (r) => drawConduction(ctx, r, state, params, theme, compact, overlays));
  }

  const titles: Record<string, string> = {
    conduction: "conduction · through the bar",
    convection: "convection · the air circulates",
    radiation: "radiation · across empty space",
    insulation: "insulation · keep the drink hot",
  };

  const n = stations.length;
  const cellW = (width - pad * (n + 1)) / n;
  stations.forEach(([key, draw], i) => {
    const r: Rect = { x: pad + i * (cellW + pad), y: pad, w: cellW, h: sceneH - pad * 2 };
    panel(ctx, r, theme, titles[key] ?? key, compact);
    const inner: Rect = {
      x: r.x + 4, y: r.y + (compact ? 6 : 18), w: r.w - 8, h: r.h - (compact ? 10 : 24),
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    draw(inner);
    ctx.restore();
  });

  if (showGraph) {
    drawGraph(ctx, { x: pad, y: sceneH, w: width - pad * 2, h: graphH - pad }, state, theme, compact);
  }

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const heatTransferSim: SimManifest<State> = {
  id: "phys.heat-transfer",
  title: "Heat Transfer",
  tagline: "Watch heat crawl along a bar, ride the air around a room and cross empty space — then insulate against it.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10],
  standards: {
    ngss: ["MS-PS3-3", "MS-PS3-4", "MS-PS3-5", "MS-ETS1-3", "MS-ETS1-4", "HS-PS3-4"],
  },
  learningGoals: [
    "Tell conduction, convection and radiation apart by how the energy moves.",
    "Explain why energy always flows from the hotter body to the cooler one.",
    "Predict which materials conduct heat quickly and which are good insulators.",
    "Show that two connected bodies end up at the same temperature, and work out which one.",
    "Choose materials and thicknesses to slow heat loss down for a design brief.",
  ],
  misconceptions: [
    "Cold flows into a warm object",
    "Metal is colder than wood at the same temperature",
    "A blanket makes things hot rather than slowing heat loss",
    "Heat cannot cross a vacuum",
    "Hot air rises because heat itself rises",
    "Two touching objects stop exchanging energy once they feel the same",
  ],
  // One real second is a minute of bench time: real thermal processes take
  // minutes to hours, and the clock on screen says so honestly. The tick
  // rate is matched to that so each model step is a twentieth of a second
  // of a minute — 50 ms of bench time, comfortably inside the explicit
  // solver's stability limit for every material offered.
  timeScale: 60,
  tickRate: 20,
  interactionHint: "Pick a bar material and watch how far the heat gets, then jacket the mug and keep it hot.",
  params: {
    station: {
      type: "option", label: "Show",
      options: [
        { value: "all", label: "The whole house" },
        { value: "conduction", label: "Conduction only" },
        { value: "convection", label: "Convection only" },
        { value: "radiation", label: "Radiation only" },
        { value: "insulation", label: "Insulation task" },
      ],
      default: "all",
    },
    barMaterial: {
      type: "option", label: "Bar material",
      options: Object.entries(BAR_MATERIALS).map(([value, m]) => ({ value, label: m.label })),
      default: "copper",
      help: "Copper conducts about 2700 times better than wood. Watch the difference.",
    },
    hotStart: {
      type: "number", label: "Hot block start", kind: "temperature", unit: "°C",
      min: 313.15, max: 393.15, step: 1, default: 363.15,
    },
    coldStart: {
      type: "number", label: "Cold block start", kind: "temperature", unit: "°C",
      min: 273.15, max: 313.15, step: 1, default: 283.15,
    },
    heaterPower: {
      type: "number", label: "Room heater", kind: "power", unit: "W",
      min: 0, max: 2000, step: 50, default: 600, bands: ["6-8", "9-12"],
    },
    outsideT: {
      type: "number", label: "Outside temperature", kind: "temperature", unit: "°C",
      min: 253.15, max: 298.15, step: 1, default: 273.15, bands: ["6-8", "9-12"],
    },
    sunPower: {
      type: "number", label: "Sunlight on the plate (W/m²)", kind: "ratio",
      min: 0, max: 1000, step: 25, default: 500, bands: ["6-8", "9-12"],
    },
    plateFinish: {
      type: "option", label: "Plate surface",
      options: [
        { value: "matt", label: "Matt black" },
        { value: "grey", label: "Grey" },
        { value: "shiny", label: "Shiny metal" },
      ],
      default: "matt",
      help: "A matt black surface absorbs almost everything that lands on it. A shiny one turns it away.",
    },
    jacket: {
      type: "option", label: "Mug jacket",
      options: Object.entries(JACKETS).map(([value, j]) => ({ value, label: j.label })),
      default: "none",
    },
    jacketThickness: {
      type: "number", label: "Jacket thickness", kind: "length", unit: "mm",
      min: 0, max: 0.03, step: 0.001, default: 0.01,
      help: "Thicker is slower — but the design brief only allows 20 mm of space.",
    },
  },
  overlays: [
    { key: "graph", label: "Temperature graph", default: true, bands: ["6-8", "9-12"] },
    { key: "arrows", label: "Heat flow arrows", default: true },
    { key: "particles", label: "Moving air", default: true },
  ],
  labs: [
    {
      id: "conductors",
      title: "Which materials carry heat?",
      question: "Why is a saucepan made of metal but its handle made of wood?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-3"],
      setup: { station: "conduction", barMaterial: "copper", hotStart: 363.15, coldStart: 283.15 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Rank them before you test",
          instruction: "You will race the same heat along bars of copper, steel and wood.",
          predict: {
            prompt: "Which bar gets its far end warm first?",
            options: ["Wood", "Steel", "Copper", "They all take the same time"],
            correct: 2,
            reveal: "Copper conducts about eight times better than steel and nearly three thousand times better than wood. That is why pans are metal and handles are not.",
          },
        },
        {
          id: "copper",
          phase: "measure",
          title: "Run the copper bar",
          instruction: "Play until the cold block starts climbing, then record.",
          requireData: 1,
        },
        {
          id: "wood",
          phase: "measure",
          title: "Now swap in wood",
          instruction: "Change the bar to wood, let it run for the same time and record again.",
          requireData: 2,
          check: {
            describe: "The bar is wood",
            test: (v) => v.params.barMaterial === "wood",
          },
          hints: ["Nothing much happens — that is the result, not a fault."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two runs",
          instruction: "Look at how far along each bar the colour changed.",
          write: {
            prompt: "What did the wooden bar do differently, and why?",
            placeholder: "In the wooden bar the heat ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the two groups",
          instruction: "Sort materials into conductors and insulators and give an everyday example of each.",
          write: {
            prompt: "Which materials are good thermal conductors, and where would you want an insulator instead?",
            placeholder: "Good conductors are ... I would use an insulator when ...",
          },
        },
      ],
    },
    {
      id: "equilibrium",
      title: "Where do they meet?",
      question: "Two blocks at different temperatures are joined. What temperature do they end up at?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-4"],
      setup: { station: "conduction", barMaterial: "copper", hotStart: 363.15, coldStart: 283.15 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the meeting point",
          instruction: "A 90 °C block and a 10 °C block are joined by a copper bar.",
          predict: {
            prompt: "What happens in the end?",
            options: [
              "The hot block stays hot and the cold block stays cold",
              "They both end up at the same temperature, part way between",
              "The cold block ends up hotter than the hot one",
              "Both end up at 90 °C",
            ],
            correct: 1,
            reveal: "Energy keeps flowing while there is any difference at all, so the difference shrinks to nothing. They finish at the same temperature — the heat-capacity-weighted average of everything that was joined.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Run it to the end",
          instruction: "Play until the two curves on the graph meet, recording twice on the way.",
          requireData: 2,
          hints: [
            "Use the fast-forward control — this takes several minutes of bench time.",
            "Watch the gap readout shrink toward zero.",
          ],
        },
        {
          id: "converged",
          phase: "analyze",
          title: "Confirm they met",
          instruction: "Keep going until the two blocks are within one degree of each other.",
          check: {
            describe: "The two blocks agree to within 1 K",
            test: (v) => Boolean(v.facts.converged),
          },
        },
        {
          id: "where",
          phase: "analyze",
          title: "Why there?",
          instruction: "The blocks are identical, so compare the final temperature with the average of 90 and 10.",
          write: {
            prompt: "What was the final temperature, and how does it compare with the simple average?",
            placeholder: "They met at about ... which is a little below 50 °C because the bar ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Say what thermal equilibrium means, without using the word 'cold'.",
          write: {
            prompt: "Write your own definition of thermal equilibrium.",
            placeholder: "Two objects are in thermal equilibrium when ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "keep-it-hot",
      title: "Keep the drink hot",
      brief: "Using no more than 20 mm of jacket, keep the drink above 75 °C after half an hour.",
      bands: ["6-8", "9-12"],
      setup: { station: "insulation", jacket: "none", jacketThickness: 0.01, hotStart: 363.15 },
      goal: {
        describe: "Above 75 °C at 30 minutes with a jacket of 20 mm or less",
        test: (v) => Boolean(v.facts.halfHourDone)
          && (v.facts.jacketThickness as number) <= 0.0201
          && (v.facts.mugAt30 as number) >= 348.15,
      },
      stars: {
        two: {
          describe: "Above 81 °C at 30 minutes",
          test: (v) => Boolean(v.facts.halfHourDone)
            && (v.facts.jacketThickness as number) <= 0.0201
            && (v.facts.mugAt30 as number) >= 354.15,
        },
        three: {
          describe: "Above 84.5 °C at 30 minutes",
          test: (v) => Boolean(v.facts.halfHourDone)
            && (v.facts.jacketThickness as number) <= 0.0201
            && (v.facts.mugAt30 as number) >= 357.65,
        },
      },
      hints: [
        "Fast-forward: half an hour of bench time goes quickly at high speed.",
        "Two things matter — which material, and how thick you make it.",
        "A shiny outer face also turns back the heat the mug radiates away.",
      ],
    },
    {
      id: "solar-plate",
      title: "Solar collector",
      brief: "Get the plate above 55 °C using sunlight alone.",
      bands: ["6-8", "9-12"],
      setup: { station: "radiation", sunPower: 500, plateFinish: "shiny" },
      goal: {
        describe: "The plate reaches 55 °C",
        test: (v) => (v.facts.plateT as number) >= 328.15,
      },
      stars: {
        two: {
          describe: "The plate reaches 65 °C",
          test: (v) => (v.facts.plateT as number) >= 338.15,
        },
        three: {
          describe: "The plate reaches 75 °C",
          test: (v) => (v.facts.plateT as number) >= 348.15,
        },
      },
      hints: [
        "A shiny plate turns most of the sunlight straight back out again.",
        "The surface finish changes both how much it absorbs and how much it radiates away.",
      ],
    },
  ],
  model,
  render,
};
