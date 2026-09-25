import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { energyBars, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Heating Curve — Grades 6-12.
 *
 * Put a steady heater under a lump of ice and plot its temperature against the
 * energy you have poured in. The line climbs, and then — with the heater still
 * running at full power — it stops climbing. It sits flat at 0 °C for 334
 * kilojoules per kilogram, and flat again at 100 °C for 2260 kilojoules per
 * kilogram, and then climbs once more.
 *
 * The particles beside the graph explain the flat parts, which is the whole
 * reason they are there: during a plateau the particles do not speed up at all.
 * Every joule is going into pulling them away from their neighbours instead.
 * Energy in does not always mean temperature up, and this is the picture that
 * makes that survivable.
 *
 * ── Where the numbers come from ────────────────────────────────────────────
 * Melting and boiling points, specific heat capacities and latent heats are the
 * standard measured values, in SI. Water: 0 °C and 100 °C, 2090 / 4186 / 2010
 * J·kg⁻¹·K⁻¹ for ice, water and steam, 334 kJ/kg to melt and 2260 kJ/kg to
 * boil. Two capacities are quoted as approximate in the table below because the
 * literature values drift with temperature; each is flagged where it is used.
 */

export interface Substance {
  id: string;
  label: string;
  formula: string;
  /** Melting point, K. */
  melting: number;
  /** Boiling point at 1 atm, K. */
  boiling: number;
  /** Specific heat capacity of the solid, liquid and gas, J/(kg·K). */
  cSolid: number;
  cLiquid: number;
  cGas: number;
  /** Latent heat of fusion and of vaporisation, J/kg. */
  latentFusion: number;
  latentVapor: number;
  /** Where the experiment starts, K — always below the melting point. */
  start: number;
  /** Hidden substances keep their identity off the stage until revealed. */
  secret?: boolean;
}

export const SUBSTANCES: Record<string, Substance> = {
  water: {
    id: "water", label: "Water", formula: "H₂O",
    melting: 273.15, boiling: 373.15,
    cSolid: 2090, cLiquid: 4186, cGas: 2010,
    latentFusion: 334_000, latentVapor: 2_260_000,
    start: 253.15,
  },
  ethanol: {
    id: "ethanol", label: "Ethanol", formula: "C₂H₅OH",
    melting: 159.05, boiling: 351.52,
    // The solid capacity is an approximate value near the melting point; the
    // liquid and vapour figures are the standard measured ones.
    cSolid: 1200, cLiquid: 2440, cGas: 1420,
    latentFusion: 108_000, latentVapor: 841_000,
    start: 130,
  },
  lead: {
    id: "lead", label: "Lead", formula: "Pb",
    melting: 600.61, boiling: 2022,
    // Molten lead is about 138 J/(kg·K); lead vapour is monatomic, so its Cp is
    // 5R/2 divided by the molar mass, which is close to 100 J/(kg·K).
    cSolid: 128, cLiquid: 138, cGas: 100,
    latentFusion: 23_200, latentVapor: 858_000,
    start: 300,
  },
  mystery: {
    id: "mystery", label: "Substance X", formula: "?",
    // Naphthalene — the mothball in every school cooling-curve experiment.
    melting: 353.4, boiling: 491.1,
    cSolid: 1300, cLiquid: 1720, cGas: 1050,
    latentFusion: 148_000, latentVapor: 337_000,
    start: 300,
    secret: true,
  },
};

export function substanceOf(params: ParamValues): Substance {
  return SUBSTANCES[params.substance as string] ?? SUBSTANCES.water;
}

/** How far above the boiling point the experiment is allowed to run. */
const SUPERHEAT = 60;

export interface CurvePoint {
  /** Temperature, K. */
  temperature: number;
  /** 0 solid · 1 melting · 2 liquid · 3 boiling · 4 gas. */
  stage: number;
  /** Fraction of the sample that is no longer solid, 0-1. */
  melted: number;
  /** Fraction of the sample that has become gas, 0-1. */
  vaporised: number;
  /** Energy so far that went into making particles move faster, J. */
  sensible: number;
  /** Energy so far that went into pulling particles apart, J. */
  latent: number;
}

/** The four energies that mark the corners of the curve, J. */
export function milestones(s: Substance, mass: number) {
  const q1 = mass * s.cSolid * (s.melting - s.start);
  const q2 = q1 + mass * s.latentFusion;
  const q3 = q2 + mass * s.cLiquid * (s.boiling - s.melting);
  const q4 = q3 + mass * s.latentVapor;
  const qMax = q4 + mass * s.cGas * SUPERHEAT;
  return { q1, q2, q3, q4, qMax };
}

/**
 * The state of the sample after a given amount of energy has been added. This
 * is the whole physics of the simulation, written as one pure function so a
 * test can check it against q = mcΔT and q = mL by hand.
 */
export function curveAt(s: Substance, mass: number, energy: number): CurvePoint {
  const { q1, q2, q3, q4, qMax } = milestones(s, mass);
  const e = Math.max(0, Math.min(energy, qMax));

  if (e <= q1) {
    return {
      temperature: s.start + e / (mass * s.cSolid),
      stage: 0, melted: 0, vaporised: 0, sensible: e, latent: 0,
    };
  }
  if (e <= q2) {
    return {
      temperature: s.melting,
      stage: 1, melted: (e - q1) / (q2 - q1), vaporised: 0,
      sensible: q1, latent: e - q1,
    };
  }
  if (e <= q3) {
    return {
      temperature: s.melting + (e - q2) / (mass * s.cLiquid),
      stage: 2, melted: 1, vaporised: 0,
      sensible: q1 + (e - q2), latent: q2 - q1,
    };
  }
  if (e <= q4) {
    return {
      temperature: s.boiling,
      stage: 3, melted: 1, vaporised: (e - q3) / (q4 - q3),
      sensible: q1 + (q3 - q2), latent: (q2 - q1) + (e - q3),
    };
  }
  return {
    temperature: s.boiling + (e - q4) / (mass * s.cGas),
    stage: 4, melted: 1, vaporised: 1,
    sensible: q1 + (q3 - q2) + (e - q4),
    latent: (q2 - q1) + (q4 - q3),
  };
}

export function stageName(stage: number): string {
  return ["Solid", "Melting", "Liquid", "Boiling", "Gas"][stage] ?? "Solid";
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

const N = 54;
const BOX_W = 20;
const BOX_H = 15;
/** Everything below this line is where a liquid pools. */
const POOL_TOP = BOX_H * 0.46;
/** Reference speed of a particle at 300 K, box units per second. */
const SPEED_REF = 2.6;

interface State {
  /** Energy added so far, J. */
  energy: number;
  t: number;
  x: number[]; y: number[];
  vx: number[]; vy: number[];
  hx: number[]; hy: number[];
  phase: number[];
}

function seed(rng: Rng): Pick<State, "x" | "y" | "vx" | "vy" | "hx" | "hy" | "phase"> {
  const cols = 9;
  const rows = Math.ceil(N / cols);
  const spacing = Math.min((BOX_W * 0.7) / (cols - 1), (POOL_TOP * 0.8) / Math.max(1, rows - 1));
  const x0 = BOX_W / 2 - ((cols - 1) * spacing) / 2;
  const y0 = 1.2;
  const x: number[] = [], y: number[] = [], vx: number[] = [], vy: number[] = [];
  const hx: number[] = [], hy: number[] = [], phase: number[] = [];
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / cols);
    const c = i - r * cols;
    const px = x0 + c * spacing + (r % 2) * spacing * 0.5;
    const py = y0 + r * spacing * 0.9;
    hx.push(px); hy.push(py);
    x.push(px); y.push(py);
    const a = rng.range(0, Math.PI * 2);
    vx.push(Math.cos(a)); vy.push(Math.sin(a));
    phase.push(rng.range(0, Math.PI * 2));
  }
  return { x, y, vx, vy, hx, hy, phase };
}

const model: SimModel<State> = {
  init(_params, ctx) {
    return { energy: 0, t: 0, ...seed(ctx.rng) };
  },

  applyParams(state, params, prev) {
    // A new substance or a new sample size is a new experiment.
    if (params.substance !== prev.substance || params.mass !== prev.mass) {
      return { ...state, energy: 0, t: 0 };
    }
    return state;
  },

  step(state, dt, params) {
    const s = substanceOf(params);
    const mass = params.mass as number;
    const power = params.power as number;
    const { qMax } = milestones(s, mass);
    const energy = Math.max(0, Math.min(qMax, state.energy + power * dt));
    const point = curveAt(s, mass, energy);

    /* ---- the particles ---- */
    const meltedCount = Math.round(N * point.melted);
    const vaporCount = Math.round(N * point.vaporised);
    // Speed follows the temperature, and nothing else. During a plateau the
    // temperature does not move, so neither does this.
    const speed = SPEED_REF * Math.sqrt(Math.max(20, point.temperature) / 300);

    const x = state.x.slice(), y = state.y.slice();
    const vx = state.vx.slice(), vy = state.vy.slice();

    for (let i = 0; i < N; i++) {
      const isGas = i < vaporCount;
      const isLiquid = !isGas && i < meltedCount;
      if (!isGas && !isLiquid) {
        // Bound in the lattice: vibrating about a fixed home, never still.
        const amp = 0.14 * Math.sqrt(Math.max(20, point.temperature) / 300);
        x[i] = state.hx[i] + Math.cos(state.t * 9 + state.phase[i]) * amp;
        y[i] = state.hy[i] + Math.sin(state.t * 11 + state.phase[i] * 1.7) * amp;
        vx[i] = 0; vy[i] = 0;
        continue;
      }
      const v = isGas ? speed * 1.7 : speed * 0.55;
      const norm = Math.hypot(vx[i], vy[i]) || 1;
      let ux = (vx[i] / norm) * v;
      let uy = (vy[i] / norm) * v;
      let nx = x[i] + ux * dt;
      let ny = y[i] + uy * dt;
      const floor = 0.4;
      const ceiling = isGas ? BOX_H - 0.4 : POOL_TOP;
      if (nx < 0.4) { nx = 0.4; ux = Math.abs(ux); }
      if (nx > BOX_W - 0.4) { nx = BOX_W - 0.4; ux = -Math.abs(ux); }
      if (ny < floor) { ny = floor; uy = Math.abs(uy); }
      if (ny > ceiling) { ny = ceiling; uy = -Math.abs(uy); }
      x[i] = nx; y[i] = ny; vx[i] = ux; vy[i] = uy;
    }

    return { ...state, energy, t: state.t + dt, x, y, vx, vy };
  },

  readouts(state, params) {
    const s = substanceOf(params);
    const mass = params.mass as number;
    const point = curveAt(s, mass, state.energy);
    return [
      {
        key: "temperature", label: "Temperature", quantity: q(point.temperature, "temperature"),
        unit: "°C", semantic: "hot", graphable: true,
      },
      {
        key: "energy", label: "Energy added", quantity: q(state.energy, "energy"),
        unit: "kJ", semantic: "energy-total", graphable: true,
      },
      {
        key: "stage", label: "Stage (0 solid … 4 gas)", quantity: q(point.stage, "count"),
        semantic: point.stage <= 1 ? "solid" : point.stage <= 2 ? "liquid" : "gas",
        graphable: true,
      },
      {
        key: "melted", label: "Fraction melted", quantity: q(point.melted, "percent"),
        unit: "%", semantic: "liquid", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "vaporised", label: "Fraction boiled away", quantity: q(point.vaporised, "percent"),
        unit: "%", semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "sensible", label: "Energy that raised the temperature",
        quantity: q(point.sensible, "energy"), unit: "kJ",
        semantic: "energy-kinetic", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "latent", label: "Energy that broke attractions",
        quantity: q(point.latent, "energy"), unit: "kJ",
        semantic: "energy-potential", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const s = substanceOf(params);
    const mass = params.mass as number;
    const point = curveAt(s, mass, state.energy);
    const m = milestones(s, mass);
    return {
      substance: s.id,
      temperatureK: point.temperature,
      temperatureC: point.temperature - 273.15,
      stage: point.stage,
      stageName: stageName(point.stage),
      onPlateau: point.stage === 1 || point.stage === 3,
      melting: s.melting,
      boiling: s.boiling,
      meltingC: s.melting - 273.15,
      boilingC: s.boiling - 273.15,
      energy: state.energy,
      melted: point.melted,
      vaporised: point.vaporised,
      sensible: point.sensible,
      latent: point.latent,
      energyToMelt: mass * s.latentFusion,
      energyToBoil: mass * s.latentVapor,
      qMax: m.qMax,
      complete: state.energy >= m.qMax - 1e-6,
      secret: Boolean(s.secret),
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function phaseColorOf(stage: number, theme: RenderContext<State>["theme"]): string {
  if (stage >= 4) return theme.sci["gas"];
  if (stage >= 2) return theme.sci["liquid"];
  return theme.sci["solid"];
}

function drawParticles(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const s = substanceOf(params);
  const point = curveAt(s, params.mass as number, state.energy);

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.8);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(phaseColorOf(point.stage, theme), 0.8);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const sx = w / BOX_W;
  const sy = h / BOX_H;
  const px = (v: number) => x + v * sx;
  // The box's y runs up from the floor, the canvas runs down from the top.
  const py = (v: number) => y + h - v * sy;
  const r = Math.max(2.2, Math.min(sx, sy) * 0.42);

  const meltedCount = Math.round(N * point.melted);
  const vaporCount = Math.round(N * point.vaporised);

  // Attractions still holding the solid together, drawn only while they exist.
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["solid"], 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = meltedCount; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = state.x[i] - state.x[j];
      const dy = state.y[i] - state.y[j];
      if (dx * dx + dy * dy > 1.5 * 1.5) continue;
      ctx.moveTo(px(state.x[i]), py(state.y[i]));
      ctx.lineTo(px(state.x[j]), py(state.y[j]));
    }
  }
  ctx.stroke();
  ctx.restore();

  for (let i = N - 1; i >= 0; i--) {
    const isGas = i < vaporCount;
    const isLiquid = !isGas && i < meltedCount;
    const color = isGas ? theme.sci["gas"] : isLiquid ? theme.sci["liquid"] : theme.sci["solid"];
    sphere(ctx, px(state.x[i]), py(state.y[i]), r, color, { glow: isGas ? 0.3 : 0 });
  }

  const label = point.stage === 1
    ? "Melting — the lattice is coming apart, one particle at a time"
    : point.stage === 3
      ? "Boiling — particles are breaking free of the liquid"
      : point.stage === 0
        ? "Solid — vibrating in place, never still"
        : point.stage === 2
          ? "Liquid — touching, but free to slide"
          : "Gas — far apart, filling the space";
  caption(ctx, x + 6, y + h + 14, label, theme, { size: 10, color: theme.inkSoft });
}

function drawThermometer(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const s = substanceOf(params);
  const point = curveAt(s, params.mass as number, state.energy);
  const lo = s.start - 20;
  const hi = s.boiling + SUPERHEAT + 20;
  const frac = Math.max(0, Math.min(1, (point.temperature - lo) / (hi - lo)));

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, w / 2);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = mixHex(theme.sci["cold"], theme.sci["hot"], frac);
  roundRect(ctx, x + 2, y + h - h * frac, w - 4, h * frac, (w - 4) / 2);
  ctx.fill();
  ctx.restore();

  for (const [value, color] of [
    [s.melting, theme.sci["liquid"]], [s.boiling, theme.sci["gas"]],
  ] as [number, string][]) {
    const f = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
    const yy = y + h - h * f;
    ctx.save();
    ctx.strokeStyle = hexA(color, 0.9);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x - 3, yy);
    ctx.lineTo(x + w + 3, yy);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Temperature against energy added. The flat sections are the point of the
 * whole simulation, so they are shaded, labelled, and drawn wide.
 */
function drawGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme, overlays, band } = rc;
  const s = substanceOf(params);
  const mass = params.mass as number;
  const m = milestones(s, mass);
  const point = curveAt(s, mass, state.energy);
  const revealMelt = !s.secret || state.energy > m.q1;
  const revealBoil = !s.secret || state.energy > m.q3;

  const padL = 46, padR = 14, padT = 22, padB = 30;
  const plotX = x + padL, plotY = y + padT;
  const plotW = Math.max(40, w - padL - padR);
  const plotH = Math.max(40, h - padT - padB);
  const tLo = s.start - 15;
  const tHi = s.boiling + SUPERHEAT + 15;
  const gx = (e: number) => plotX + (e / m.qMax) * plotW;
  const gy = (t: number) => plotY + plotH - ((t - tLo) / (tHi - tLo)) * plotH;
  const toC = (k: number) => k - 273.15;

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.55);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.restore();

  /* ---- the plateaus, shaded so they read as regions, not accidents ---- */
  for (const [q0, q1, name, sci] of [
    [m.q1, m.q2, "melting", "liquid"], [m.q3, m.q4, "boiling", "gas"],
  ] as [number, number, string, string][]) {
    ctx.save();
    ctx.fillStyle = hexA(theme.sci[sci], 0.14);
    ctx.fillRect(gx(q0), plotY, Math.max(1, gx(q1) - gx(q0)), plotH);
    ctx.restore();
    if (gx(q1) - gx(q0) > 34 && (name === "melting" ? revealMelt : revealBoil)) {
      caption(ctx, (gx(q0) + gx(q1)) / 2, plotY + 10, name, theme, {
        align: "center", size: 10, color: theme.sci[sci], weight: 700,
      });
    }
  }

  /* ---- axes ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();
  ctx.font = "600 9px ui-monospace, monospace";
  ctx.fillStyle = theme.inkSoft;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const t = tLo + ((tHi - tLo) * i) / ticks;
    ctx.fillText(toC(t).toFixed(0), plotX - 5, gy(t));
    ctx.strokeStyle = hexA(theme.grid, 0.9);
    ctx.beginPath();
    ctx.moveTo(plotX, gy(t));
    ctx.lineTo(plotX + plotW, gy(t));
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= 4; i++) {
    const e = (m.qMax * i) / 4;
    ctx.fillText((e / 1000).toFixed(0), gx(e), plotY + plotH + 5);
  }
  ctx.restore();
  caption(ctx, plotX, y + 11, "Temperature (°C)", theme, { size: 10, color: theme.inkSoft });
  caption(ctx, plotX + plotW, y + h - 6, "Energy added (kJ)", theme, {
    align: "right", size: 10, color: theme.inkSoft,
  });

  /* ---- the melting and boiling lines ---- */
  for (const [value, sci, name, show] of [
    [s.melting, "liquid", "melts", revealMelt], [s.boiling, "gas", "boils", revealBoil],
  ] as [number, string, string, boolean][]) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci[sci], show ? 0.75 : 0.25);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plotX, gy(value));
    ctx.lineTo(plotX + plotW, gy(value));
    ctx.stroke();
    ctx.restore();
    if (show && band !== "3-5") {
      caption(ctx, plotX + plotW - 4, gy(value) - 8, `${name} at ${toC(value).toFixed(1)} °C`, theme, {
        align: "right", size: 10, color: theme.sci[sci], weight: 700,
      });
    }
  }

  /* ---- the whole curve, faint, when the student asks for it ---- */
  const corners: [number, number][] = [
    [0, s.start], [m.q1, s.melting], [m.q2, s.melting],
    [m.q3, s.boiling], [m.q4, s.boiling], [m.qMax, curveAt(s, mass, m.qMax).temperature],
  ];
  if (overlays.predicted && !s.secret) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    corners.forEach(([e, t], i) => (i === 0 ? ctx.moveTo(gx(e), gy(t)) : ctx.lineTo(gx(e), gy(t))));
    ctx.stroke();
    ctx.restore();
  }

  /* ---- the curve traced so far ---- */
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(gx(0), gy(s.start));
  for (const [e, t] of corners) {
    if (e <= state.energy) {
      ctx.lineTo(gx(e), gy(t));
    } else {
      ctx.lineTo(gx(state.energy), gy(point.temperature));
      break;
    }
  }
  ctx.stroke();
  ctx.restore();

  const cx = gx(state.energy);
  const cy = gy(point.temperature);
  glow(ctx, cx, cy, 16, phaseColorOf(point.stage, theme), 0.5);
  sphere(ctx, cx, cy, 6, phaseColorOf(point.stage, theme));
  badge(ctx, Math.min(cx, plotX + plotW - 40), cy - 20, `${toC(point.temperature).toFixed(1)} °C`, theme, {
    align: "center", color: phaseColorOf(point.stage, theme),
  });

  if ((point.stage === 1 || point.stage === 3) && band !== "3-5") {
    caption(
      ctx, plotX + plotW / 2, plotY + plotH - 10,
      "Heater still on. Temperature not moving.",
      theme, { align: "center", size: 12, weight: 800, color: theme.sci["acceleration"] },
    );
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const s = substanceOf(params);
  const mass = params.mass as number;
  const point = curveAt(s, mass, state.energy);

  sky(ctx, width, height, theme, "indoor");

  /* ---- header ---- */
  const title = s.secret ? "Substance X — unknown" : `${s.label}  ${s.formula}`;
  caption(ctx, 14, 20, title, theme, { size: 15, weight: 800 });
  badge(ctx, width - 14, 20, stageName(point.stage), theme, {
    align: "right", color: phaseColorOf(point.stage, theme),
  });
  caption(ctx, 14, 36, `${(mass * 1000).toFixed(0)} g · heater ${(params.power as number).toFixed(0)} W`, theme, {
    size: 11, color: theme.inkSoft,
  });

  const showParticles = overlays.particles && width >= 560;
  const leftW = showParticles ? Math.min(320, width * 0.36) : 0;
  const top = 48;

  if (showParticles) {
    const thermoW = 14;
    const boxX = 14 + thermoW + 8;
    const boxW = leftW - thermoW - 22;
    const boxH = Math.max(90, Math.min(height - top - 130, boxW * 0.75));
    drawThermometer(rc, 14, top, thermoW, boxH);
    drawParticles(rc, boxX, top, boxW, boxH);

    /* ---- the heater plate, glowing with whatever power is set ---- */
    const power = params.power as number;
    const plateY = top + boxH + 2;
    if (power !== 0) {
      const hot = power > 0;
      const strength = Math.min(1, Math.abs(power) / 3000);
      glow(ctx, boxX + boxW / 2, plateY + 4, boxW * 0.5,
        hot ? theme.sci["hot"] : theme.sci["cold"], 0.25 + 0.45 * strength);
    }
    material(ctx, boxX, plateY, boxW, 7,
      power > 0 ? theme.sci["energy-thermal"] : power < 0 ? theme.sci["cold"] : theme.inkSoft, 3);

    /* ---- where the energy actually went ---- */
    if (overlays.energy && height - top - boxH > 96) {
      const by = plateY + 34;
      caption(ctx, 14, by - 8, "Every joule you have added", theme, { size: 11, weight: 700 });
      energyBars(ctx, 14, by, leftW - 14, 18, [
        { label: "moving", value: point.sensible, color: theme.sci["energy-kinetic"] },
        { label: "breaking", value: point.latent, color: theme.sci["energy-potential"] },
      ], theme);
      caption(ctx, 14, by + 32, `made particles move faster: ${(point.sensible / 1000).toFixed(1)} kJ`, theme, {
        size: 10, color: theme.sci["energy-kinetic"],
      });
      caption(ctx, 14, by + 46, `pulled particles apart: ${(point.latent / 1000).toFixed(1)} kJ`, theme, {
        size: 10, color: theme.sci["energy-potential"],
      });
      if (band !== "3-5") {
        caption(ctx, 14, by + 62, point.stage === 1 || point.stage === 3
          ? "Right now, all of it is going into the second bar."
          : "Right now, all of it is going into the first bar.", theme, {
          size: 10, color: theme.inkSoft,
        });
      }
    }
  }

  const graphX = 14 + leftW + (showParticles ? 12 : 0);
  const graphW = width - graphX - 14;
  if (graphW > 140 && height - top > 120) {
    drawGraph(rc, graphX, top, graphW, height - top - 12);
  }

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const heatingCurveSim: SimManifest<State> = {
  id: "chem.heating-curve",
  title: "Heating Curve",
  tagline: "Heat it steadily, watch the graph — and find out why the temperature stops rising while the heater is still on.",
  subject: "chemistry",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS1-4", "MS-PS3-4", "HS-PS3-4"] },
  learningGoals: [
    "Read a heating curve and name the state of matter in every section.",
    "Explain why the temperature holds steady while a substance melts or boils.",
    "Use q = mcΔT and q = mL to account for the energy in each section.",
    "Predict the shape of the heating curve for a substance you have not met.",
  ],
  misconceptions: [
    "Adding energy always raises the temperature",
    "A substance stops absorbing energy once it reaches its melting point",
    "Temperature and heat energy are the same thing",
    "Boiling takes about as much energy as melting",
  ],
  tickRate: 60,
  timeScale: 4,
  interactionHint: "Press play. Watch the graph and the particles at the same time.",
  params: {
    substance: {
      type: "option", label: "Substance",
      options: [
        { value: "water", label: "Water" },
        { value: "ethanol", label: "Ethanol" },
        { value: "lead", label: "Lead" },
        { value: "mystery", label: "Substance X" },
      ],
      default: "water",
      help: "Substance X keeps its melting and boiling points hidden until your experiment finds them.",
    },
    power: {
      type: "number", label: "Heater power", kind: "power", unit: "W",
      min: -2000, max: 3000, step: 50, default: 1200,
      marks: [
        { value: -1200, label: "cooling" },
        { value: 0, label: "off" },
        { value: 1200, label: "hotplate" },
        { value: 3000, label: "kettle" },
      ],
      help: "Joules per second. Negative takes energy back out again.",
    },
    mass: {
      type: "number", label: "Sample mass", kind: "mass", unit: "g",
      min: 0.01, max: 0.2, step: 0.005, default: 0.05,
      help: "A bigger sample needs proportionally more energy for every section of the curve.",
    },
  },
  overlays: [
    { key: "particles", label: "Particle view", default: true },
    { key: "energy", label: "Where the energy went", default: true },
    { key: "predicted", label: "Show the whole curve", default: false },
  ],
  model,
  render,
  labs: [
    {
      id: "why-it-flattens",
      title: "Why does the temperature stop rising?",
      question: "The heater is still on. Why has the thermometer stopped moving?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4"],
      setup: { substance: "water", power: 1200, mass: 0.05 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Ice at −20 °C, a steady heater, and a thermometer.",
          predict: {
            prompt: "What will the temperature do between the first ice melting and the last ice melting?",
            options: [
              "Keep climbing at the same rate",
              "Climb, but more slowly",
              "Stay at exactly 0 °C the whole time",
              "Drop, because melting is cooling",
            ],
            correct: 2,
            reveal: "It holds at exactly 0 °C. Every joule is going into pulling the particles out of the ice lattice, and none of it into making them move faster — and temperature only measures how fast they move.",
          },
        },
        {
          id: "run-to-melt",
          phase: "measure",
          title: "Heat it until it stalls",
          instruction: "Press play. Record data at least five times as the curve climbs and then flattens.",
          requireData: 5,
          hints: [
            "Use the speed control if you do not want to wait.",
            "Watch the two energy bars: one of them stops growing.",
          ],
        },
        {
          id: "on-the-plateau",
          phase: "analyze",
          title: "Sit on the plateau",
          instruction: "Pause while it is half melted. Look at the particle box.",
          check: {
            describe: "Half way through melting",
            test: (v) => v.facts.stage === 1 && (v.facts.melted as number) > 0.25 && (v.facts.melted as number) < 0.75,
          },
          hints: ["Turn the heater power right down to creep up on it."],
        },
        {
          id: "boil",
          phase: "measure",
          title: "Now keep going to the second plateau",
          instruction: "Heat it until the water boils. Record data on the way.",
          requireData: 9,
          check: {
            describe: "The water is boiling",
            test: (v) => v.facts.stage === 3,
          },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two flat parts",
          instruction: "One plateau is far longer than the other. Which, and by how much?",
          write: {
            prompt: "Which takes more energy for the same 50 g of water — melting it or boiling it?",
            placeholder: "Melting took about ... kJ and boiling took about ... kJ, which is ... times as much.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the flat parts",
          instruction: "Say where the energy goes while the temperature is not changing.",
          write: {
            prompt: "The heater is still delivering energy. Where is it going during a plateau?",
            placeholder: "During melting the energy is used to ... instead of ...",
          },
        },
      ],
    },
    {
      id: "predict-substance-x",
      title: "Predict the curve for Substance X",
      question: "Can you find the melting and boiling points of a substance nobody has told you about?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4"],
      setup: { substance: "mystery", power: 900, mass: 0.05 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the shape first",
          instruction: "You know nothing about Substance X except that it starts as a solid.",
          predict: {
            prompt: "What shape will its heating curve have?",
            options: [
              "A straight line all the way up",
              "A curve that gets steeper and steeper",
              "Rising sections separated by two flat sections",
              "Flat, then one big jump",
            ],
            correct: 2,
            reveal: "Every substance gives the same shape: rise, plateau at the melting point, rise, plateau at the boiling point, rise. Only the heights and the lengths change.",
          },
        },
        {
          id: "find-melt",
          phase: "measure",
          title: "Find the first plateau",
          instruction: "Heat it until the curve flattens, then read the temperature. Record it.",
          requireData: 4,
          check: {
            describe: "Substance X is melting",
            test: (v) => v.facts.substance === "mystery" && v.facts.stage === 1,
          },
        },
        {
          id: "find-boil",
          phase: "measure",
          title: "Keep going to the second plateau",
          instruction: "Heat past the liquid section until it flattens again. Record it.",
          requireData: 8,
          check: {
            describe: "Substance X is boiling",
            test: (v) => v.facts.substance === "mystery" && v.facts.stage === 3,
          },
          hints: ["The liquid section is steeper than you might expect — this substance heats up quickly."],
        },
        {
          id: "report",
          phase: "analyze",
          title: "Report your two numbers",
          instruction: "Write down the melting point and boiling point you measured, in °C.",
          write: {
            prompt: "What are the melting and boiling points of Substance X, and how did you decide?",
            placeholder: "It melted at about ... °C and boiled at about ... °C, because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name it if you can",
          instruction: "Substance X melts at 80 °C and boils at 218 °C. It is naphthalene — mothballs.",
          write: {
            prompt: "How close were your two measurements, and what would make them more precise?",
            placeholder: "I measured ... The real values are 80.3 °C and 217.9 °C. To do better I would ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hold-half-melted",
      title: "Half ice, half water",
      brief: "Stop the heater at the exact moment half the ice has melted, and hold it there.",
      bands: ["6-8", "9-12"],
      setup: { substance: "water", power: 1200, mass: 0.05 },
      goal: {
        describe: "Somewhere on the melting plateau",
        test: (v) => v.facts.stage === 1 && (v.facts.melted as number) > 0.2 && (v.facts.melted as number) < 0.8,
      },
      stars: {
        two: {
          describe: "Between 40% and 60% melted",
          test: (v) => v.facts.stage === 1 && (v.facts.melted as number) > 0.4 && (v.facts.melted as number) < 0.6,
        },
        three: {
          describe: "Between 45% and 55% melted",
          test: (v) => v.facts.stage === 1 && (v.facts.melted as number) > 0.45 && (v.facts.melted as number) < 0.55,
        },
      },
      hints: [
        "Melting 50 g of ice takes 16.7 kJ. Half of that is 8.35 kJ.",
        "Turn the power down as you get close — a low power gives you finer control.",
        "Setting the power to zero stops the experiment exactly where it is.",
      ],
    },
    {
      id: "melt-the-lead",
      title: "Melt the lead",
      brief: "Lead melts at 327 °C and boils at 1749 °C. See how far you can push it.",
      bands: ["6-8", "9-12"],
      setup: { substance: "lead", power: 3000, mass: 0.05 },
      goal: {
        describe: "Lead completely melted",
        test: (v) => v.facts.substance === "lead" && (v.facts.stage as number) >= 2,
      },
      stars: {
        two: {
          describe: "Molten lead above 1000 °C",
          test: (v) => v.facts.substance === "lead" && (v.facts.temperatureC as number) > 1000,
        },
        three: {
          describe: "Lead boiling",
          test: (v) => v.facts.substance === "lead" && (v.facts.stage as number) >= 3,
        },
      },
      hints: [
        "Lead's specific heat capacity is tiny — 128 J/(kg·K) — so the solid section is steep.",
        "Its melting plateau is short too: only 23.2 kJ/kg against water's 334.",
        "Boiling it is another matter entirely: 858 kJ/kg. Use full power and the fast-forward.",
      ],
    },
  ],
};
