import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { CONSTANTS, q } from "@engine/units";
import { camera, roundRect } from "@ui/draw";
import {
  badge, caption, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Gas Properties — Grades 6-12.
 *
 * A chamber of molecules with a piston you can push. The pressure gauge is not
 * fed by PV = nRT. It counts momentum: every time a molecule bounces off a wall
 * it hands the wall 2m|v⊥|, and the gauge divides the total by the wall area
 * and the time it has been averaging over — which is exactly what pressure is.
 *
 * PV/nT then comes out at 8.31 J/(mol·K) all by itself, from any combination of
 * the four dials. Students can watch the gas constant appear out of nothing but
 * bouncing.
 *
 * Confronts the belief that pressure is something the gas "contains", that a
 * gas has weight pushing down on the piston, and that squeezing a gas makes the
 * molecules themselves smaller.
 */

/* ------------------------------------------------------------------ *
 * Model ↔ real-world scaling
 *
 * The dynamics run in model units where every molecule has mass 1 and
 * Boltzmann's constant is 1, which keeps the arithmetic clean and fast. Four
 * scale factors carry the results back to kelvin, litres, pascals and moles.
 * Three of them are chosen for readable numbers; the fourth is then fixed by
 * the requirement that they stay mutually consistent — which is why PV/nT lands
 * on R rather than on some arbitrary constant.
 * ------------------------------------------------------------------ */

const K_T = 100;                 // kelvin per model temperature unit
const VOLUME_PER_AREA = 5e-6;    // m³ per model area unit (a fixed chamber depth)
const K_P = 8e4;                 // pascals per model pressure unit
/** Moles each drawn molecule stands for; fixed by the other three. */
const MOL_PER_DOT = (K_P * VOLUME_PER_AREA) / (CONSTANTS.R * K_T);

/** Chamber height in model units; only the piston moves. */
const BOX_H = 12;
const MIN_W = 5;
const MAX_W = 25;

/**
 * Positions advance at MOTION times the physical velocity so the animation is
 * watchable. That is a pure time rescaling: it multiplies the collision rate by
 * MOTION, so the pressure gauge divides it straight back out.
 */
const MOTION = 3;

/**
 * The collision cross-section is kept deliberately small so the gas stays close
 * to ideal (excluded volume would bend Boyle's law). Molecules are drawn larger
 * than they collide, because invisible molecules teach nothing.
 */
const R_COLL = 0.06;
const R_DRAW = 0.22;

/** How long the gauge's very first reading is seeded for before measurement takes over. */
const PRIOR_TIME = 0.3;

interface State {
  n: number;
  x: number[]; y: number[];
  vx: number[]; vy: number[];
  /** Chamber width in model units — the piston position. */
  width: number;
  /** Running pressure average: total impulse per unit wall length, and its window. */
  impSum: number;
  timeSum: number;
  /** Model-unit pressure the piston servo is holding, when it is floating. */
  holdPressure: number;
  /** Measured model temperature. */
  tModel: number;
}

function widthFor(volumeM3: number): number {
  return clamp(volumeM3 / (VOLUME_PER_AREA * BOX_H), MIN_W, MAX_W);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Ideal-gas model pressure, used only to seed the gauge's first reading. */
function idealPressure(n: number, tModel: number, width: number): number {
  return (n * tModel) / (width * BOX_H);
}

function seed(params: ParamValues, rng: Rng): State {
  const n = Math.round(params.particles as number);
  const width = widthFor(params.volume as number);
  const tModel = (params.temperature as number) / K_T;
  const x: number[] = new Array(n);
  const y: number[] = new Array(n);
  const vx: number[] = new Array(n);
  const vy: number[] = new Array(n);

  // Maxwell-Boltzmann: each velocity component is normal with variance k_B T/m.
  const sigma = Math.sqrt(tModel);
  for (let i = 0; i < n; i++) {
    x[i] = rng.range(0, width);
    y[i] = rng.range(0, BOX_H);
    vx[i] = rng.normal(0, sigma);
    vy[i] = rng.normal(0, sigma);
  }

  const p0 = idealPressure(n, tModel, width);
  return {
    n, x, y, vx, vy, width,
    impSum: p0 * MOTION * PRIOR_TIME,
    timeSum: PRIOR_TIME,
    holdPressure: p0,
    tModel,
  };
}

function measuredPressure(state: State): number {
  return state.timeSum > 1e-9 ? state.impSum / (state.timeSum * MOTION) : 0;
}

const model: SimModel<State> = {
  init(params, ctx) {
    return seed(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (params.particles !== prev.particles) return seed(params, ctx.rng);

    let next = state;
    if (params.piston !== prev.piston && params.piston === "float") {
      // Start floating from whatever pressure the gas is at right now.
      next = { ...next, holdPressure: Math.max(1e-6, measuredPressure(next)) };
    }
    if (
      params.volume !== prev.volume ||
      params.temperature !== prev.temperature ||
      params.piston !== prev.piston
    ) {
      // Restart the gauge's average, carrying its current reading forward for a
      // moment so the needle glides instead of dropping to zero.
      const p = measuredPressure(next);
      next = { ...next, impSum: p * MOTION * PRIOR_TIME, timeSum: PRIOR_TIME };
    }
    return next;
  },

  step(state, dt, params) {
    const n = state.n;
    if (n === 0 || dt <= 0) return state;

    const tTarget = (params.temperature as number) / K_T;
    const x = state.x.slice();
    const y = state.y.slice();
    const vx = state.vx.slice();
    const vy = state.vy.slice();

    /* ---- thermostat: the chamber sits in a bath at the chosen temperature ---- */
    let sumV2 = 0;
    for (let i = 0; i < n; i++) sumV2 += vx[i] * vx[i] + vy[i] * vy[i];
    const tNow = sumV2 / (2 * n);
    const ratio = tNow > 1e-9 ? tTarget / tNow : 4;
    const lambda = clamp(Math.sqrt(Math.max(0, 1 + (dt / 0.5) * (ratio - 1))), 0.9, 1.12);
    for (let i = 0; i < n; i++) { vx[i] *= lambda; vy[i] *= lambda; }

    /* ---- move the piston ---- */
    const pNow = measuredPressure(state);
    let width = state.width;
    if (params.piston === "float") {
      // Servo: too much pressure pushes the piston out, too little pulls it in.
      const target = Math.max(1e-6, state.holdPressure);
      const drive = clamp(0.35 * width * ((pNow - target) / target), -2.5, 2.5);
      width = clamp(width + drive * dt, MIN_W, MAX_W);
    } else {
      const want = widthFor(params.volume as number);
      const travel = 7 * dt;
      width = Math.abs(want - width) <= travel ? want : width + Math.sign(want - width) * travel;
    }

    /* ---- move the molecules, and count what the walls feel ---- */
    const h = dt * MOTION;
    let impulse = 0;
    for (let i = 0; i < n; i++) {
      x[i] += vx[i] * h;
      y[i] += vy[i] * h;
      // Walls are hit by molecule CENTRES, so the gas fills exactly the volume
      // the gauge reports. Bouncing at the drawn radius instead would confine
      // the gas to a smaller box than the readout claims and push PV/nT a few
      // percent above R. Molecules are only inset when they are drawn.
      if (x[i] < 0) { x[i] = 0; impulse += 2 * Math.abs(vx[i]); vx[i] = Math.abs(vx[i]); }
      else if (x[i] > width) {
        x[i] = width; impulse += 2 * Math.abs(vx[i]); vx[i] = -Math.abs(vx[i]);
      }
      if (y[i] < 0) { y[i] = 0; impulse += 2 * Math.abs(vy[i]); vy[i] = Math.abs(vy[i]); }
      else if (y[i] > BOX_H) {
        y[i] = BOX_H; impulse += 2 * Math.abs(vy[i]); vy[i] = -Math.abs(vy[i]);
      }
    }

    /* ---- molecule-molecule collisions: equal masses swap normal velocities ---- */
    const contact = 2 * R_COLL;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const d2 = dx * dx + dy * dy;
        if (d2 >= contact * contact || d2 < 1e-12) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const vn = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
        if (vn > 0) continue;
        vx[i] += vn * nx; vy[i] += vn * ny;
        vx[j] -= vn * nx; vy[j] -= vn * ny;
      }
    }

    let v2 = 0;
    for (let i = 0; i < n; i++) v2 += vx[i] * vx[i] + vy[i] * vy[i];

    const perimeter = 2 * (width + BOX_H);
    return {
      ...state,
      x, y, vx, vy, width,
      impSum: state.impSum + impulse / perimeter,
      timeSum: state.timeSum + dt,
      tModel: v2 / (2 * n),
    };
  },

  readouts(state) {
    const pressure = measuredPressure(state) * K_P;
    const volume = state.width * BOX_H * VOLUME_PER_AREA;
    const temperature = state.tModel * K_T;
    const moles = state.n * MOL_PER_DOT;
    const pvnt = moles > 0 && temperature > 0 ? (pressure * volume) / (moles * temperature) : 0;
    return [
      {
        key: "pressure", label: "Pressure", quantity: q(pressure, "pressure"), unit: "kPa",
        semantic: "force", graphable: true,
      },
      {
        key: "volume", label: "Volume", quantity: q(volume, "volume"), unit: "L",
        semantic: "distance", graphable: true,
      },
      {
        key: "temperature", label: "Temperature", quantity: q(temperature, "temperature"), unit: "K",
        semantic: "hot", graphable: true,
      },
      {
        key: "particles", label: "Molecules", quantity: q(state.n, "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "moles", label: "Amount", quantity: q(moles, "amount"), unit: "mol",
        semantic: "mass", graphable: true, bands: ["9-12"],
      },
      {
        key: "pv", label: "P × V", quantity: q(pressure * volume, "energy"), unit: "J",
        semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "pvnt", label: "PV / nT", quantity: q(pvnt, "ratio"),
        semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const pressure = measuredPressure(state) * K_P;
    const volume = state.width * BOX_H * VOLUME_PER_AREA;
    const temperature = state.tModel * K_T;
    const moles = state.n * MOL_PER_DOT;
    return {
      pressure,
      volume,
      temperature,
      pv: pressure * volume,
      pvnt: moles > 0 && temperature > 0 ? (pressure * volume) / (moles * temperature) : 0,
      settled: state.timeSum > 6,
      floating: params.piston === "float",
      particles: state.n,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const WORLD_W = 29.4;
const WORLD_H = 16;
const CHAMBER_X = 1.0;
const CHAMBER_Y = 2.6;
const GAUGE_MAX = 6e5; // Pa, the top of the drawn gauge
/** Bench height, in world units. The cylinder is bolted to this. */
const BENCH_Y = 1.7;

/** Mix two theme colours into a hex, so the result can feed the scene kit. */
function blend(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const ca = a.replace("#", "");
  const cb = b.replace("#", "");
  let out = "#";
  for (let i = 0; i < 3; i++) {
    const va = parseInt(ca.slice(i * 2, i * 2 + 2), 16) || 0;
    const vb = parseInt(cb.slice(i * 2, i * 2 + 2), 16) || 0;
    out += Math.round(va + (vb - va) * k).toString(16).padStart(2, "0");
  }
  return out;
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band } = rc;
  const cam = camera({ x0: -0.4, y0: -0.3, x1: WORLD_W + 0.4, y1: WORLD_H + 0.6, width, height });
  const px = (x: number) => cam.toScreenX(x);
  const py = (y: number) => cam.toScreenY(y);
  const scale = cam.scale;
  const dark = isDarkTheme(theme);

  const pressure = measuredPressure(state) * K_P;
  const temperature = state.tModel * K_T;
  const volumeL = state.width * BOX_H * VOLUME_PER_AREA * 1000;
  const gasTint = blend(theme.sci["cold"], theme.sci["hot"], clamp(temperature / 800, 0, 1));
  const steel = theme.sci["mass"];
  const glass = theme.sci["solid"];

  /* ---- the bench the apparatus is bolted to ---- */
  sky(ctx, width, height, theme, "indoor");
  const benchY = py(BENCH_Y);
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  /* ---- the cylinder body ---- */
  const chL = px(CHAMBER_X), chR = px(CHAMBER_X + MAX_W);
  const chT = py(CHAMBER_Y + BOX_H), chB = py(CHAMBER_Y);
  const shell = Math.max(4, scale * 0.3);

  contactShadow(ctx, (chL + chR) / 2, benchY + 1, (chR - chL) * 0.28, 0);
  material(ctx, chL - shell, chT - shell, (chR - chL) + shell * 2, (chB - chT) + shell * 2, steel, 8);

  // The bore: a dark cavity with the gas glowing inside it.
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, chL, chT, chR - chL, chB - chT, 4);
  ctx.clip();
  const cavity = ctx.createLinearGradient(0, chT, 0, chB);
  cavity.addColorStop(0, hexA(theme.ink, dark ? 0.5 : 0.16));
  cavity.addColorStop(0.5, hexA(theme.ink, dark ? 0.32 : 0.06));
  cavity.addColorStop(1, hexA(theme.ink, dark ? 0.5 : 0.16));
  ctx.fillStyle = cavity;
  ctx.fillRect(chL, chT, chR - chL, chB - chT);

  // The gas itself only occupies the space left of the piston.
  const gasR = px(CHAMBER_X + state.width);
  const hot = ctx.createLinearGradient(chL, 0, gasR, 0);
  hot.addColorStop(0, hexA(gasTint, dark ? 0.26 : 0.2));
  hot.addColorStop(1, hexA(gasTint, dark ? 0.14 : 0.1));
  ctx.fillStyle = hot;
  ctx.fillRect(chL, chT, gasR - chL, chB - chT);
  ctx.restore();

  /* ---- molecules, as lit spheres with the fast ones haloed ---- */
  const BUCKETS = 8;
  const ramp: string[] = new Array(BUCKETS);
  for (let b = 0; b < BUCKETS; b++) {
    ramp[b] = blend(theme.sci["cold"], theme.sci["hot"], b / (BUCKETS - 1));
  }
  const vRef = 2 * Math.sqrt(2 * Math.max(state.tModel, 0.2));
  const r = Math.max(2.5, R_DRAW * scale);
  for (let i = 0; i < state.n; i++) {
    const speed = Math.hypot(state.vx[i], state.vy[i]);
    const b = clamp(Math.round((speed / vRef) * (BUCKETS - 1)), 0, BUCKETS - 1);
    // Centres reach the walls; the sphere is nudged inside so it never spills over.
    const dx = clamp(state.x[i], R_DRAW, Math.max(R_DRAW, state.width - R_DRAW));
    const dy = clamp(state.y[i], R_DRAW, BOX_H - R_DRAW);
    const heat = b / (BUCKETS - 1);
    sphere(ctx, px(CHAMBER_X + dx), py(CHAMBER_Y + dy), r, ramp[b], {
      glow: heat > 0.6 ? (heat - 0.6) * 1.5 : 0,
    });
  }

  /* ---- the piston, and the glass front of the cylinder ---- */
  const pistonX = CHAMBER_X + state.width;
  const headW = Math.max(6, 0.6 * scale);
  material(ctx, px(pistonX), chT - shell * 0.4, headW, (chB - chT) + shell * 0.8, steel, 3);
  material(
    ctx, px(pistonX) + headW, py(CHAMBER_Y + BOX_H / 2 + 0.32),
    Math.max(0, (MAX_W - state.width) * scale + shell), 0.64 * scale, steel, 3,
  );
  // A seal ring where the head meets the bore.
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["force"], 0.75);
  ctx.fillRect(px(pistonX), chT, Math.max(2, headW * 0.28), chB - chT);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, chL, chT, chR - chL, chB - chT, 4);
  ctx.strokeStyle = hexA(glass, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  const sheen = ctx.createLinearGradient(0, chT, 0, chB);
  sheen.addColorStop(0, "rgba(255,255,255,0.16)");
  sheen.addColorStop(0.18, "rgba(255,255,255,0.02)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(chL, chT, chR - chL, (chB - chT) * 0.5);
  ctx.restore();

  /* ---- pressure gauge, as an instrument on the bench ---- */
  const gx = CHAMBER_X + MAX_W + 1.5;
  const gw = 1.9;
  const gh = BOX_H;
  const gL = px(gx), gT = py(CHAMBER_Y + gh), gB = py(CHAMBER_Y);
  material(ctx, gL - 4, gT - 4, gw * scale + 8, (gB - gT) + 8, steel, 6);
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, dark ? 0.45 : 0.12);
  roundRect(ctx, gL, gT, gw * scale, gB - gT, 4);
  ctx.fill();
  ctx.restore();

  const frac = clamp(pressure / GAUGE_MAX, 0, 1);
  ctx.save();
  const col = ctx.createLinearGradient(0, gB, 0, gT);
  col.addColorStop(0, hexA(theme.sci["force"], 0.75));
  col.addColorStop(1, hexA(theme.sci["force"], 1));
  ctx.fillStyle = col;
  roundRect(ctx, gL + 3, gB - (gB - gT) * frac, gw * scale - 6, (gB - gT) * frac, 3);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const ty = gB - (i / 6) * (gB - gT);
    ctx.moveTo(gL, ty);
    ctx.lineTo(gL + gw * scale * (i % 2 === 0 ? 0.42 : 0.24), ty);
  }
  ctx.stroke();
  ctx.restore();

  if (params.piston === "float" && state.holdPressure > 0) {
    const ty = clamp((state.holdPressure * K_P) / GAUGE_MAX, 0, 1);
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(gL - 8, gB - (gB - gT) * ty);
    ctx.lineTo(gL + gw * scale + 8, gB - (gB - gT) * ty);
    ctx.stroke();
    ctx.restore();
  }

  badge(ctx, gL + (gw * scale) / 2, gT - 20, `${(pressure / 1000).toFixed(0)}`, theme, {
    align: "center", color: theme.sci["force"], sub: "kPa",
  });
  caption(ctx, gL + (gw * scale) / 2, gB + 16, "Pressure", theme, {
    align: "center", size: 11, color: theme.inkSoft,
  });

  /* ---- live numbers, on the scene beside what they describe ---- */
  const topY = py(CHAMBER_Y + BOX_H + 1.1);
  badge(ctx, px(CHAMBER_X + state.width / 2), topY, `${volumeL.toFixed(2)} L`, theme, {
    align: "center", color: theme.sci["distance"],
  });
  badge(ctx, px(CHAMBER_X), topY, `${temperature.toFixed(0)} K`, theme, { color: gasTint });

  if (band !== "3-5") {
    caption(
      ctx, px(CHAMBER_X), py(0.75),
      params.piston === "float"
        ? "Piston floating — it moves until the pressure matches the dashed line"
        : "Piston locked to the volume slider",
      theme, { size: 11, color: theme.inkSoft, weight: 500 },
    );
    caption(
      ctx, px(gx + gw), py(0.75),
      `gauge averaging over ${state.timeSum.toFixed(1)} s`, theme,
      { align: "right", size: 10, color: theme.inkSoft, weight: 500 },
    );
  }

  vignette(ctx, width, height, 0.15);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const gasLawsSim: SimManifest<State> = {
  id: "chem.gas-laws",
  title: "Gas Properties",
  tagline: "Squeeze the piston, heat the chamber, and watch the gas laws fall out of molecules bouncing off walls.",
  subject: "chemistry",
  bands: ["3-5", "6-8", "9-12"],
  grades: [6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS1-4", "HS-PS3-2"], ccssMath: ["HSA.CED.A.4", "HSF.LE.A.1"] },
  learningGoals: [
    "Explain pressure as the total push of molecules bouncing off the container walls.",
    "Show that pressure and volume are inversely related at constant temperature (Boyle).",
    "Show that volume rises in proportion to absolute temperature at constant pressure (Charles).",
    "Use PV = nRT and recognise R as the constant that falls out of the measurements.",
    "Explain why absolute zero is where the volume line meets the temperature axis.",
  ],
  misconceptions: [
    "Pressure is a substance the gas contains",
    "Squeezing a gas makes each molecule smaller",
    "Gas pressure comes from the weight of the gas",
    "Halving the volume adds energy to the molecules",
  ],
  tickRate: 60,
  interactionHint: "Move the volume slider to push the piston in and out.",
  params: {
    volume: {
      type: "number", label: "Volume", kind: "volume", unit: "L",
      min: 3e-4, max: 1.5e-3, step: 1e-5, default: 1.2e-3,
      help: "Where the piston sits. Ignored while the piston is floating.",
    },
    temperature: {
      type: "number", label: "Temperature", kind: "temperature", unit: "K",
      min: 100, max: 800, step: 5, default: 300,
      help: "Sets how fast the molecules move. Nothing else about them changes.",
    },
    particles: {
      type: "number", label: "Molecules", kind: "count",
      min: 20, max: 150, step: 1, default: 100,
      help: "Each dot stands for about 2.9 × 10²⁰ real molecules.",
      bands: ["6-8", "9-12"],
    },
    piston: {
      type: "option", label: "Piston",
      options: [
        { value: "fixed", label: "Locked — you set the volume" },
        { value: "float", label: "Floating — holds the pressure steady" },
      ],
      default: "fixed",
      bands: ["6-8", "9-12"],
      help: "Let it float and the piston finds its own position, so the pressure stays put while you change the temperature.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "boyle",
      title: "Boyle's law",
      question: "If you squeeze a gas into half the space, what happens to the pressure?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4"],
      setup: { volume: 1.5e-3, temperature: 300, particles: 100, piston: "fixed" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you move the piston.",
          predict: {
            prompt: "You halve the volume at the same temperature. The pressure will...",
            options: ["Halve", "Stay the same", "Double", "Go up by a small amount"],
            correct: 2,
            reveal: "It doubles. The molecules are just as fast, but the wall is half as far away, so each one hits twice as often.",
          },
        },
        {
          id: "start",
          phase: "setup",
          title: "Start wide open",
          instruction: "Set the volume to 1.5 L at 300 K and let the gauge settle.",
          check: {
            describe: "Volume near 1.5 L, temperature 300 K, gauge settled",
            test: (v) =>
              (v.params.volume as number) >= 1.4e-3 &&
              (v.params.temperature as number) === 300 &&
              Boolean(v.facts.settled),
          },
          hints: ["Watch the 'gauge averaging over' note — pressure is a time average, so give it a few seconds."],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Five volumes, same temperature",
          instruction: "Record pressure at five volumes between 1.5 L and 0.3 L. Keep the temperature at 300 K.",
          requireData: 5,
          hints: [
            "Wait for the gauge to settle after each move before recording.",
            "A fair test changes only the volume.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Multiply them",
          instruction: "Work out P × V for each row. What do you notice?",
          write: {
            prompt: "What is P × V for each of your five rows? Is it the same each time?",
            placeholder: "Row 1: ... × ... = ... Row 2: ...",
          },
          hints: ["The P × V readout does this for you — check your arithmetic against it."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it with molecules",
          instruction: "Say why P × V stays constant, in terms of the bouncing.",
          write: {
            prompt: "Why does squeezing the gas raise the pressure, if the molecules are moving at the same speed?",
            placeholder: "The molecules still move at ... but the walls are ... so each molecule ...",
          },
        },
      ],
    },
    {
      id: "charles",
      title: "Charles's law",
      question: "If you heat a gas but keep the pressure the same, what happens to its volume?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4", "HS-PS3-2"],
      setup: { volume: 6e-4, temperature: 200, particles: 100, piston: "float" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The piston is free to slide, so the pressure cannot change.",
          predict: {
            prompt: "You double the temperature from 200 K to 400 K. The volume will...",
            options: ["Stay the same", "Double", "Halve", "Go up by a tiny amount"],
            correct: 1,
            reveal: "It doubles — as long as you count temperature from absolute zero. Volume is proportional to temperature in kelvin, not in degrees Celsius.",
          },
        },
        {
          id: "float",
          phase: "setup",
          title: "Let the piston float",
          instruction: "Set the piston to Floating and wait for it to stop drifting.",
          check: {
            describe: "The piston is floating",
            test: (v) => Boolean(v.facts.floating) && Boolean(v.facts.settled),
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Five temperatures, same pressure",
          instruction: "Record volume at five temperatures from 150 K to 700 K.",
          requireData: 5,
          hints: [
            "Give the piston time to finish sliding before recording.",
            "Check that the pressure really is staying near the dashed line.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Divide them",
          instruction: "Work out V ÷ T for each row. Then think about T = 0.",
          write: {
            prompt: "Is V ÷ T the same in every row? If you extended your graph down, at what temperature would the volume reach zero?",
            placeholder: "V ÷ T came out about ... The line would hit zero at ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Why kelvin?",
          instruction: "Explain why this law only works with kelvin, not Celsius.",
          write: {
            prompt: "Why does volume double when the kelvin temperature doubles, but not when the Celsius temperature doubles?",
            placeholder: "Kelvin counts from ... whereas Celsius counts from ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "double-pressure",
      title: "Double the pressure",
      brief: "Get the gauge to 200 kPa without changing the temperature.",
      bands: ["6-8", "9-12"],
      setup: { volume: 1.2e-3, temperature: 300, particles: 100, piston: "fixed" },
      goal: {
        describe: "Pressure at or above 200 kPa with the temperature still near 300 K",
        test: (v) =>
          v.readouts.pressure >= 2.0e5 &&
          Math.abs(v.readouts.temperature - 300) <= 10 &&
          Boolean(v.facts.settled),
      },
      stars: {
        two: {
          describe: "Between 195 and 210 kPa — no overshooting",
          test: (v) =>
            v.readouts.pressure >= 1.95e5 && v.readouts.pressure <= 2.1e5 &&
            Math.abs(v.readouts.temperature - 300) <= 10 && Boolean(v.facts.settled),
        },
        three: {
          describe: "Done by halving the volume, with the same molecules",
          test: (v) =>
            v.readouts.pressure >= 1.95e5 && v.readouts.pressure <= 2.1e5 &&
            Math.abs(v.readouts.temperature - 300) <= 10 &&
            (v.params.particles as number) === 100 &&
            (v.params.volume as number) <= 6.2e-4 && Boolean(v.facts.settled),
        },
      },
      hints: [
        "Heating is off the table, so you have two dials left.",
        "Twice as many molecules in the same space hit the walls twice as often.",
        "So does the same number of molecules in half the space.",
      ],
    },
    {
      id: "find-r",
      title: "Find the gas constant",
      brief: "Get PV/nT to read 8.31 J/(mol·K) — and then break it if you can.",
      bands: ["9-12"],
      setup: { volume: 9e-4, temperature: 450, particles: 120, piston: "fixed" },
      goal: {
        describe: "PV/nT within 3% of 8.314 J/(mol·K)",
        test: (v) => Boolean(v.facts.settled) && Math.abs((v.facts.pvnt as number) - CONSTANTS.R) <= 0.25,
      },
      stars: {
        two: {
          describe: "Within 1.5%",
          test: (v) => Boolean(v.facts.settled) && Math.abs((v.facts.pvnt as number) - CONSTANTS.R) <= 0.125,
        },
      },
      hints: [
        "Let the gauge average for a good ten seconds — pressure is a time average.",
        "Try changing the volume, then the temperature, then the number of molecules. The ratio should not budge.",
      ],
    },
  ],
};
