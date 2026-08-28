import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { CONSTANTS, q } from "@engine/units";
import { camera, disc, label, mixHex, roundRect } from "@ui/draw";

/**
 * States of Matter: Particle View — Grades 1-12.
 *
 * A sealed box of particles held at a temperature you choose. Nothing in this
 * simulation switches between "solid mode" and "gas mode": every particle obeys
 * the same Lennard-Jones force law at every temperature, and the phase is
 * *measured* out of the resulting motion the same way a scientist would measure
 * it — from how tightly packed the neighbours are and how far particles wander.
 *
 * Confronts the two beliefs that break most students' particle model: that
 * particles in a solid are frozen still, and that the particles themselves
 * melt, expand or change into something else when the substance changes state.
 *
 * ── How the physics maps onto real substances ──────────────────────────────
 * The molecular dynamics runs in reduced Lennard-Jones units (σ = ε = m = 1),
 * which is how real MD is done. That system has its own melting and boiling
 * points, T*_melt and T*_boil, which we measured from this exact model. The
 * temperature axis is then calibrated affinely for the chosen substance so that
 * those two emergent transitions land on that substance's real melting and
 * boiling points. The transitions are never imposed — they emerge — but the
 * thermometer is calibrated, exactly like calibrating a real thermometer
 * against ice water and steam.
 */

/* ------------------------------------------------------------------ *
 * The model system
 * ------------------------------------------------------------------ */

/** Box size in particle diameters (σ). Wide enough for a droplet plus vapour. */
const BOX_W = 28;
const BOX_H = 18;
const WALL = 0.5;                 // particle radius, in σ
const PERIMETER = 2 * (BOX_W + BOX_H);

const CUT2 = 2.5 * 2.5;           // Lennard-Jones cutoff, σ²
const CORE2 = 0.80;               // softened core, so one bad overlap cannot explode
const TAU_PER_SECOND = 2.4;       // reduced time units per second of screen time
const MAX_STEP_TAU = 0.008;       // largest stable reduced timestep
const THERMOSTAT_TAU = 1.0;       // Berendsen coupling time, in reduced units
const NEIGHBOUR2 = 1.45 * 1.45;   // "touching" distance for coordination counting
const REF_TAU = 2.0;              // window over which wandering is measured

/**
 * Where this model system actually changes state, measured from long runs of
 * this very code at the densities the box allows. See chemistry.test.ts.
 */
const T_STAR_MELT = 0.42;
const T_STAR_BOIL = 0.90;

/** Mean-square wander per unit reduced time that separates solid from liquid. */
const SOLID_MOBILITY = 0.06;
/** Fraction of free particles above which the box counts as fully gas. */
const GAS_FRACTION = 0.72;
/** Fraction of free particles above which liquid and gas visibly coexist. */
const COEXIST_FRACTION = 0.14;

/**
 * Reduced 2-D wall pressure this model shows at its boiling transition. A
 * substance boils, by definition, when its vapour pressure reaches one
 * atmosphere, so this single number calibrates the pressure gauge for every
 * substance at once.
 */
const P_STAR_AT_BOILING = 0.30;
const PRESSURE_SCALE = CONSTANTS.atm / P_STAR_AT_BOILING;

interface Substance {
  label: string;
  formula: string;
  /** Real melting point, K. */
  melting: number;
  /** Real boiling point at 1 atm, K. */
  boiling: number;
}

const SUBSTANCES: Record<string, Substance> = {
  water: { label: "Water", formula: "H₂O", melting: 273.15, boiling: 373.15 },
  oxygen: { label: "Oxygen", formula: "O₂", melting: 54.36, boiling: 90.19 },
  neon: { label: "Neon", formula: "Ne", melting: 24.56, boiling: 27.1 },
};

function substanceOf(params: ParamValues): Substance {
  return SUBSTANCES[params.substance as string] ?? SUBSTANCES.water;
}

/** Real temperature → the reduced temperature this model system runs at. */
function toReduced(kelvin: number, s: Substance): number {
  const t = T_STAR_MELT + ((T_STAR_BOIL - T_STAR_MELT) * (kelvin - s.melting)) / (s.boiling - s.melting);
  return Math.max(0, Math.min(4, t));
}

/** The inverse, so a measured reduced temperature reads back in kelvin. */
function toKelvin(tStar: number, s: Substance): number {
  const span = (s.boiling - s.melting) / (T_STAR_BOIL - T_STAR_MELT);
  return Math.max(0, s.melting + (tStar - T_STAR_MELT) * span);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  n: number;
  x: number[]; y: number[];
  vx: number[]; vy: number[];
  /** Reference positions for the wandering (melting) measurement. */
  rx: number[]; ry: number[];
  /** Reduced time elapsed, and when the reference positions were taken. */
  tau: number;
  refTau: number;
  /** Smoothed measurements, all in reduced units. */
  mobility: number;
  tKin: number;
  pStar: number;
  /** Fraction of particles with almost no neighbours — the vapour. */
  vaporFrac: number;
  /** Mean number of touching neighbours. */
  coord: number;
  /** 0 solid · 1 liquid · 2 gas, measured not switched. */
  phase: number;
  /** True while a droplet and its vapour are both present. */
  coexist: boolean;
}

function seed(params: ParamValues, rng: Rng): State {
  const n = Math.round(params.particles as number);
  const s = substanceOf(params);
  const tStar = toReduced(params.temperature as number, s);

  // Start from a triangular lattice: the arrangement a real solid actually has.
  const spacing = 1.1;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * (BOX_W / BOX_H))));
  const rows = Math.ceil(n / cols);
  const blockW = (cols - 1) * spacing + spacing / 2;
  const blockH = (rows - 1) * spacing * 0.866;
  const x0 = (BOX_W - blockW) / 2;
  const y0 = (BOX_H - blockH) / 2;

  const x: number[] = new Array(n);
  const y: number[] = new Array(n);
  const vx: number[] = new Array(n);
  const vy: number[] = new Array(n);
  const v0 = Math.sqrt(2 * Math.max(tStar, 0.05));

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i - r * cols;
    x[i] = clamp(x0 + c * spacing + (r % 2) * spacing * 0.5, WALL, BOX_W - WALL);
    y[i] = clamp(y0 + r * spacing * 0.866, WALL, BOX_H - WALL);
    const angle = rng.range(0, Math.PI * 2);
    vx[i] = Math.cos(angle) * v0;
    vy[i] = Math.sin(angle) * v0;
  }
  // Remove any net drift, so the whole box does not sail sideways.
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += vx[i]; sy += vy[i]; }
  for (let i = 0; i < n; i++) { vx[i] -= sx / n; vy[i] -= sy / n; }

  return {
    n, x, y, vx, vy,
    rx: x.slice(), ry: y.slice(),
    tau: 0, refTau: 0,
    mobility: 0, tKin: tStar, pStar: 0,
    vaporFrac: 0, coord: 6, phase: 0, coexist: false,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Lennard-Jones pair forces, accumulated in place.
 *
 * Newton's third law is used to halve the work: each pair is visited once and
 * its force applied to both partners with opposite signs.
 */
function accumulateForces(n: number, x: number[], y: number[], ax: number[], ay: number[]): void {
  for (let i = 0; i < n; i++) { ax[i] = 0; ay[i] = 0; }
  for (let i = 0; i < n - 1; i++) {
    const xi = x[i], yi = y[i];
    let fxi = 0, fyi = 0;
    for (let j = i + 1; j < n; j++) {
      const dx = xi - x[j];
      const dy = yi - y[j];
      let r2 = dx * dx + dy * dy;
      if (r2 > CUT2) continue;
      if (r2 < CORE2) r2 = CORE2;
      const inv2 = 1 / r2;
      const inv6 = inv2 * inv2 * inv2;
      // F/r for 4ε[(σ/r)¹² − (σ/r)⁶] is 24(2r⁻¹⁴ − r⁻⁸).
      const fOverR = 24 * inv2 * inv6 * (2 * inv6 - 1);
      const fx = fOverR * dx;
      const fy = fOverR * dy;
      fxi += fx; fyi += fy;
      ax[j] -= fx; ay[j] -= fy;
    }
    ax[i] += fxi; ay[i] += fyi;
  }
}

const model: SimModel<State> = {
  init(params, ctx) {
    return seed(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    // Only the particle count changes the shape of the system.
    if (params.particles !== prev.particles) return seed(params, ctx.rng);
    return state;
  },

  step(state, dt, params) {
    const n = state.n;
    if (n === 0 || dt <= 0) return state;

    const s = substanceOf(params);
    const tTarget = toReduced(params.temperature as number, s);

    const dtau = dt * TAU_PER_SECOND;
    const sub = Math.max(1, Math.min(16, Math.ceil(dtau / MAX_STEP_TAU)));
    const h = dtau / sub;

    const x = state.x.slice();
    const y = state.y.slice();
    const vx = state.vx.slice();
    const vy = state.vy.slice();
    // Two scratch arrays per tick, reused across every substep.
    const ax: number[] = new Array(n);
    const ay: number[] = new Array(n);

    let impulse = 0;

    for (let k = 0; k < sub; k++) {
      accumulateForces(n, x, y, ax, ay);

      // Semi-implicit Euler: stable, cheap, and exactly time-reversible enough.
      let sumV2 = 0;
      for (let i = 0; i < n; i++) {
        vx[i] += ax[i] * h;
        vy[i] += ay[i] * h;
        sumV2 += vx[i] * vx[i] + vy[i] * vy[i];
      }

      // Berendsen thermostat. In two dimensions ⟨½mv²⟩ = k_B T, so the kinetic
      // temperature is simply the mean of ½v² in reduced units.
      const tCur = (0.5 * sumV2) / n;
      const ratio = tCur > 1e-9 ? tTarget / tCur : 4;
      const lambda = clamp(Math.sqrt(Math.max(0, 1 + (h / THERMOSTAT_TAU) * (ratio - 1))), 0.85, 1.18);
      for (let i = 0; i < n; i++) { vx[i] *= lambda; vy[i] *= lambda; }

      for (let i = 0; i < n; i++) {
        x[i] += vx[i] * h;
        y[i] += vy[i] * h;
        // Walls: every bounce hands the container 2m|v⊥| of momentum, which is
        // exactly what a pressure gauge feels.
        if (x[i] < WALL) { x[i] = WALL; if (vx[i] < 0) { impulse += 2 * -vx[i]; vx[i] = -vx[i]; } }
        else if (x[i] > BOX_W - WALL) { x[i] = BOX_W - WALL; if (vx[i] > 0) { impulse += 2 * vx[i]; vx[i] = -vx[i]; } }
        if (y[i] < WALL) { y[i] = WALL; if (vy[i] < 0) { impulse += 2 * -vy[i]; vy[i] = -vy[i]; } }
        else if (y[i] > BOX_H - WALL) { y[i] = BOX_H - WALL; if (vy[i] > 0) { impulse += 2 * vy[i]; vy[i] = -vy[i]; } }
      }
    }

    /* ---- measurements, once per tick ---- */

    let sumV2 = 0;
    for (let i = 0; i < n; i++) sumV2 += vx[i] * vx[i] + vy[i] * vy[i];
    const tKinNow = (0.5 * sumV2) / n;

    let bonds = 0;
    let free = 0;
    for (let i = 0; i < n; i++) {
      let c = 0;
      const xi = x[i], yi = y[i];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = xi - x[j];
        const dy = yi - y[j];
        if (dx * dx + dy * dy < NEIGHBOUR2) c++;
      }
      bonds += c;
      if (c <= 1) free++;
    }
    const coord = bonds / n;
    const vaporFrac = free / n;

    // How far particles have wandered since the last reference snapshot: the
    // difference between vibrating in place (solid) and flowing (liquid).
    const tau = state.tau + dtau;
    let rx = state.rx, ry = state.ry, refTau = state.refTau, mobility = state.mobility;
    if (tau - refTau >= REF_TAU) {
      let msd = 0;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - rx[i];
        const dy = y[i] - ry[i];
        msd += dx * dx + dy * dy;
      }
      const rate = msd / n / (tau - refTau);
      mobility = state.refTau === 0 ? rate : mobility + (rate - mobility) * 0.5;
      rx = x.slice(); ry = y.slice(); refTau = tau;
    }

    // Exponentially smoothed gauges — pressure and temperature are averages.
    const blend = 1 - Math.exp(-dt / 0.7);
    const pInst = impulse / (PERIMETER * dtau);
    const pStar = state.pStar + (pInst - state.pStar) * (1 - Math.exp(-dt / 4));
    const tKin = state.tKin + (tKinNow - state.tKin) * blend;

    let phase: number;
    if (vaporFrac > GAS_FRACTION) phase = 2;
    else if (mobility < SOLID_MOBILITY) phase = 0;
    else phase = 1;
    const coexist = vaporFrac > COEXIST_FRACTION && vaporFrac <= GAS_FRACTION;

    return {
      n, x, y, vx, vy, rx, ry, tau, refTau,
      mobility, tKin, pStar, vaporFrac, coord, phase, coexist,
    };
  },

  readouts(state, params) {
    const s = substanceOf(params);
    const measured = toKelvin(state.tKin, s);
    // Two degrees of freedom in this view, so ⟨KE⟩ = k_B T exactly.
    const ke = CONSTANTS.k_B * measured;
    return [
      {
        key: "temperature", label: "Temperature", quantity: q(measured, "temperature"),
        unit: "K", semantic: "hot", graphable: true,
      },
      {
        key: "ke", label: "Average particle energy", quantity: q(ke, "energy"),
        unit: "eV", semantic: "energy-kinetic", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "pressure", label: "Pressure on the walls", quantity: q(state.pStar * PRESSURE_SCALE, "pressure"),
        unit: "kPa", semantic: "force", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "phase", label: "Phase (0 solid, 1 liquid, 2 gas)", quantity: q(state.phase, "count"),
        semantic: state.phase === 0 ? "solid" : state.phase === 1 ? "liquid" : "gas", graphable: true,
      },
      {
        key: "vapor", label: "Particles broken free", quantity: q(state.vaporFrac, "percent"),
        unit: "%", semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "neighbours", label: "Touching neighbours", quantity: q(state.coord, "count"),
        semantic: "solid", graphable: true, bands: ["9-12"],
      },
      {
        key: "wander", label: "How far particles wander", quantity: q(state.mobility, "ratio"),
        semantic: "distance", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const s = substanceOf(params);
    const setT = params.temperature as number;
    return {
      phase: state.phase === 0 ? "solid" : state.phase === 1 ? "liquid" : "gas",
      phaseIndex: state.phase,
      coexisting: state.coexist,
      meltingPoint: s.melting,
      boilingPoint: s.boiling,
      meltingError: Math.abs(setT - s.melting),
      boilingError: Math.abs(setT - s.boiling),
      vaporFraction: state.vaporFrac,
      substance: params.substance as string,
      settled: state.tau > 6,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function phaseColor(state: State, theme: RenderContext<State>["theme"]): string {
  if (state.phase === 2) return theme.sci["gas"];
  if (state.phase === 1) return theme.sci["liquid"];
  return theme.sci["solid"];
}

function phaseName(state: State): string {
  if (state.coexist && state.phase !== 0) return "Liquid + gas";
  return state.phase === 2 ? "Gas" : state.phase === 1 ? "Liquid" : "Solid";
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const s = substanceOf(params);
  const setT = params.temperature as number;
  const tStar = toReduced(setT, s);

  // The thermometer lives in world units to the left of the box, so one camera
  // covers the whole stage and everything scales together.
  const cam = camera({
    x0: -8.4, y0: -1.6, x1: BOX_W + 1.0, y1: BOX_H + 2.6,
    width, height,
  });
  const px = (x: number) => cam.toScreenX(x);
  const py = (y: number) => cam.toScreenY(y);
  const scale = cam.scale;

  const accent = phaseColor(state, theme);

  /* ---- container ---- */
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, px(0), py(BOX_H), BOX_W * scale, BOX_H * scale, 6);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  /* ---- bonds between touching particles: the thing that holds a solid together ---- */
  if (overlays.bonds && band !== "K-2" && state.phase !== 2) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = Math.max(1, scale * 0.09);
    ctx.beginPath();
    for (let i = 0; i < state.n - 1; i++) {
      const xi = state.x[i], yi = state.y[i];
      for (let j = i + 1; j < state.n; j++) {
        const dx = xi - state.x[j];
        const dy = yi - state.y[j];
        if (dx * dx + dy * dy > NEIGHBOUR2) continue;
        ctx.moveTo(px(xi), py(yi));
        ctx.lineTo(px(state.x[j]), py(state.y[j]));
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---- particles, coloured by how much energy they carry ---- */
  const cold = theme.sci["cold"];
  const hot = theme.sci["hot"];
  const r = Math.max(2.5, scale * 0.46);
  // One colour per speed bucket, so the ramp costs eight string builds a frame.
  const BUCKETS = 8;
  const ramp: string[] = new Array(BUCKETS);
  for (let b = 0; b < BUCKETS; b++) ramp[b] = mixHex(cold, hot, b / (BUCKETS - 1));
  const vScale = 1 / (2 * Math.sqrt(2 * Math.max(tStar, 0.08)));

  for (let i = 0; i < state.n; i++) {
    const speed = Math.hypot(state.vx[i], state.vy[i]);
    const b = Math.min(BUCKETS - 1, Math.max(0, Math.round(speed * vScale * (BUCKETS - 1))));
    disc(ctx, px(state.x[i]), py(state.y[i]), r, ramp[b], { stroke: theme.surface, lineWidth: 1 });
  }

  /* ---- thermometer ---- */
  const tubeX = px(-6.2);
  const tubeW = Math.max(10, scale * 0.9);
  const tubeTop = py(BOX_H);
  const tubeBot = py(0.6);
  const tubeH = tubeBot - tubeTop;
  const tMax = 700;
  const frac = clamp(setT / tMax, 0, 1);

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, tubeX, tubeTop, tubeW, tubeH, tubeW / 2);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = mixHex(cold, hot, frac);
  roundRect(ctx, tubeX + 2, tubeBot - tubeH * frac, tubeW - 4, tubeH * frac, (tubeW - 4) / 2);
  ctx.fill();
  ctx.restore();

  if (overlays.points) {
    for (const [value, text, colour] of [
      [s.melting, "melts", theme.sci["liquid"]],
      [s.boiling, "boils", theme.sci["gas"]],
    ] as [number, string, string][]) {
      const yy = tubeBot - tubeH * clamp(value / tMax, 0, 1);
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(tubeX - 6, yy);
      ctx.lineTo(tubeX + tubeW + 6, yy);
      ctx.stroke();
      ctx.restore();
      if (band !== "K-2") {
        label(ctx, `${text} ${value.toFixed(0)} K`, tubeX + tubeW + 9, yy, theme, { size: 10, color: colour });
      }
    }
  }

  label(ctx, `${setT.toFixed(1)} K`, tubeX + tubeW / 2, tubeTop - 14, theme, { align: "center", size: 12 });

  /* ---- captions ---- */
  const titleY = py(BOX_H + 1.1);
  label(ctx, `${s.label}  ${s.formula}`, px(0), titleY, theme, { size: band === "K-2" ? 17 : 14 });
  label(ctx, phaseName(state), px(BOX_W), titleY, theme, {
    align: "right", size: band === "K-2" ? 20 : 16, color: accent,
  });

  if (band !== "K-2") {
    const footY = py(-0.7);
    const parts = state.phase === 0
      ? "Locked in place — but still vibrating."
      : state.coexist
        ? "Fast particles are escaping the liquid."
        : state.phase === 1
          ? "Still touching, but free to slide past each other."
          : "Far apart, filling the whole container.";
    label(ctx, parts, px(0), footY, theme, { size: 12, color: theme.inkSoft });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const statesOfMatterSim: SimManifest<State> = {
  id: "chem.states",
  title: "States of Matter: Particle View",
  tagline: "Turn the heat up and watch the particles decide, all by themselves, whether to be a solid, a liquid or a gas.",
  subject: "chemistry",
  bands: ["K-2", "3-5", "6-8", "9-12"],
  grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["2-PS1-1", "2-PS1-4", "5-PS1-1", "MS-PS1-4", "HS-PS1-3"] },
  learningGoals: [
    "Describe what the particles are doing in a solid, a liquid and a gas.",
    "Explain melting and boiling as particles gaining enough energy to break away from their neighbours.",
    "Find the melting and boiling point of a substance by experiment.",
    "Explain why heating a sealed container raises the pressure inside it.",
  ],
  misconceptions: [
    "Particles in a solid are completely still",
    "Particles themselves melt, expand or change shape",
    "Heating adds new particles or makes them bigger",
    "There is air in the gaps between particles",
  ],
  tickRate: 60,
  interactionHint: "Drag the temperature slider and watch what the particles do.",
  params: {
    temperature: {
      type: "number", label: "Temperature", kind: "temperature", unit: "K",
      min: 0, max: 700, step: 0.5, default: 300,
      hideValueBands: ["K-2"],
      help: "How much energy each particle carries. Nothing else about the particles changes.",
    },
    substance: {
      type: "option", label: "Substance",
      options: [
        { value: "water", label: "Water (H₂O)" },
        { value: "oxygen", label: "Oxygen (O₂)" },
        { value: "neon", label: "Neon (Ne)" },
      ],
      default: "water",
      bands: ["3-5", "6-8", "9-12"],
      help: "Different substances hold on to each other with different strength, so they melt and boil at different temperatures.",
    },
    particles: {
      type: "number", label: "Number of particles", kind: "count",
      min: 40, max: 120, step: 1, default: 70,
      bands: ["6-8", "9-12"],
      help: "More particles in the same box means a denser substance and a higher pressure.",
    },
  },
  overlays: [
    { key: "bonds", label: "Show attractions", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "points", label: "Mark melting & boiling points", default: false, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "heat-it",
      title: "What happens to the particles as you heat them?",
      question: "When you heat a substance, what actually changes about the particles?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS1-4"],
      setup: { temperature: 120, substance: "water", particles: 70 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you touch the heat.",
          predict: {
            prompt: "As you heat a solid, what happens to its particles?",
            options: [
              "They get bigger",
              "They start moving faster and further apart",
              "They melt into liquid particles",
              "They stop moving",
            ],
            correct: 1,
            reveal: "The particles never change. They only move faster, and once they move fast enough they break away from their neighbours. That breaking away is what melting and boiling are.",
          },
        },
        {
          id: "cold",
          phase: "measure",
          title: "Start it cold",
          instruction: "Set the temperature to 120 K and press play. Watch one particle closely.",
          check: { describe: "Temperature is below 200 K", test: (v) => (v.params.temperature as number) < 200 },
          hints: ["Even in a solid, no particle is ever completely still — look for the shivering."],
        },
        {
          id: "warm",
          phase: "measure",
          title: "Now heat it up",
          instruction: "Raise the temperature slowly. Record data at five different temperatures.",
          requireData: 5,
          hints: [
            "Give the box a few seconds to settle after each change.",
            "Watch the Phase readout as well as the picture.",
          ],
        },
        {
          id: "hot",
          phase: "analyze",
          title: "Boil it",
          instruction: "Get the box to a gas. What is the pressure doing?",
          check: { describe: "The substance has become a gas", test: (v) => v.facts.phase === "gas" },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say what heating does to particles, and what it does not do.",
          write: {
            prompt: "What changes about the particles when you heat them, and what stays exactly the same?",
            placeholder: "Heating makes the particles ... but the particles themselves ...",
          },
        },
      ],
    },
    {
      id: "find-points",
      title: "Find the melting and boiling point",
      question: "At what temperature does this substance melt, and at what temperature does it boil?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4", "HS-PS1-3"],
      setup: { temperature: 30, substance: "oxygen", particles: 70 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Oxygen is a gas in this room. Where do you think it melts?",
          predict: {
            prompt: "Oxygen melts at about...",
            options: ["−218 °C (55 K)", "0 °C (273 K)", "100 °C (373 K)", "It has no melting point"],
            correct: 0,
            reveal: "Oxygen melts at 54.4 K and boils at 90.2 K. Everything has a melting point — you just have to get cold enough.",
          },
        },
        {
          id: "scan-melt",
          phase: "measure",
          title: "Hunt for the melting point",
          instruction: "Warm the box in small steps until the Phase readout changes from 0 to 1. Record each step.",
          requireData: 5,
          hints: [
            "Wait a few seconds after each change — the box needs time to settle.",
            "Melting is when particles stop being locked in place and start sliding past each other.",
            "Try steps of 5 K, then narrow in with steps of 1 K.",
          ],
        },
        {
          id: "found-melt",
          phase: "setup",
          title: "Sit right on the melting point",
          instruction: "Set the temperature within 2 K of where melting began.",
          check: {
            describe: "Temperature is within 2 K of the melting point",
            test: (v) => (v.facts.meltingError as number) <= 2,
          },
        },
        {
          id: "scan-boil",
          phase: "measure",
          title: "Now hunt for the boiling point",
          instruction: "Keep warming until particles break away and fill the box. Record as you go.",
          requireData: 9,
          check: {
            describe: "Temperature is within 2 K of the boiling point",
            test: (v) => (v.facts.boilingError as number) <= 2,
          },
          hints: ["Watch the 'Particles broken free' readout climb before the phase flips."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Report your two numbers",
          instruction: "Write both temperatures and how you decided on each one.",
          write: {
            prompt: "What are the melting and boiling points you measured, and what did you look at to decide?",
            placeholder: "It melted at about ... K because ... It boiled at about ... K because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hold-boiling",
      title: "Hold it exactly at boiling",
      brief: "Balance the substance right on its boiling point, where liquid and gas exist together.",
      bands: ["6-8", "9-12"],
      setup: { substance: "water", temperature: 300, particles: 70 },
      goal: {
        describe: "Temperature within 1 K of the boiling point",
        test: (v) => (v.facts.boilingError as number) <= 1,
      },
      stars: {
        two: {
          describe: "Within 0.5 K, and held long enough to settle",
          test: (v) => (v.facts.boilingError as number) <= 0.5 && Boolean(v.facts.settled),
        },
        three: {
          describe: "Within 0.25 K, with liquid and gas both present",
          test: (v) =>
            (v.facts.boilingError as number) <= 0.25 && Boolean(v.facts.settled) && Boolean(v.facts.coexisting),
        },
      },
      hints: [
        "Turn on 'Mark melting & boiling points' if you need the target drawn for you.",
        "Right at the boiling point you should see a droplet with particles escaping from it — not one or the other.",
        "Use the arrow keys on the slider for the last fraction of a degree.",
      ],
    },
    {
      id: "deep-freeze",
      title: "Deep freeze the neon",
      brief: "Neon is a gas everywhere on Earth. Freeze it into an ordered solid.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { substance: "neon", temperature: 60, particles: 70 },
      goal: {
        describe: "Neon is solid",
        test: (v) => v.facts.substance === "neon" && v.facts.phase === "solid",
      },
      stars: {
        two: {
          describe: "Solid neon with almost nothing evaporating",
          test: (v) =>
            v.facts.substance === "neon" && v.facts.phase === "solid" && (v.facts.vaporFraction as number) < 0.05,
        },
      },
      hints: ["Neon boils at 27 K — you will have to go colder than that.", "Neon freezes at 24.6 K."],
    },
  ],
};
