import type {
  ParamValues, RenderContext, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import type { Rng } from "@engine/rng";
import { CONSTANTS, q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { callout, depthWash } from "@ui/organic";
import {
  caption, contactShadow, glow, groundPlane, hexA, isDarkTheme, metal, plastic,
  softShadow, sphere, vignette,
} from "@ui/scene";

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
/**
 * Mobility at the melting point, measured from this very model: run it at each
 * substance's melting temperature and the particles wander this much per unit
 * reduced time. Because the dynamics run in reduced units, the value is the
 * same for water, oxygen and neon — which is what lets one threshold serve all
 * three. Calibrated rather than guessed: at 0.06 the lattice held together far
 * past freezing, so the sim showed liquid water at 250 K while its own readout
 * announced a melting point of 273.15 K.
 */
const SOLID_MOBILITY = 0.45;
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

function phaseColor(state: State, theme: ThemeColors): string {
  if (state.phase === 2) return theme.sci["gas"];
  if (state.phase === 1) return theme.sci["liquid"];
  return theme.sci["solid"];
}

function phaseName(state: State): string {
  if (state.coexist && state.phase !== 0) return "Liquid + gas";
  return state.phase === 2 ? "Gas" : state.phase === 1 ? "Liquid" : "Solid";
}

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

/**
 * The lightest colour the palette owns, whichever mode is running.
 *
 * A specular highlight is *light*, not a hue, and a simulation may only take
 * colour from the theme — so the light mode's near-white surface and the dark
 * mode's near-white ink are the two ends of the same role.
 */
function lightOf(theme: ThemeColors): string {
  return isDarkTheme(theme) ? theme.ink : theme.surface;
}

/**
 * One particle: a lit sphere, a specular dot, and a smear along its velocity.
 *
 * A flat disc reads as a token on a diagram. A shaded ball with a highlight on
 * it and a blur behind it reads as a piece of matter that is going somewhere,
 * which is the entire claim this simulation is making.
 */
function atom(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  colour: string, light: string,
  vx: number, vy: number, heat: number,
) {
  const speed = Math.hypot(vx, vy);
  // The smear is scaled by how hot the particle is, not by raw pixels per
  // frame: real motion blur here would be sub-pixel, and a long tail on a
  // vibrating solid reads as a spike rather than as movement.
  const len = r * heat * 1.15;
  if (speed > 1e-6 && len > r * 0.18) {
    const ux = vx / speed, uy = vy / speed;
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x - ux * len * 2, y - uy * len * 2);
    g.addColorStop(0, hexA(colour, 0.42));
    g.addColorStop(1, hexA(colour, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = r * 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * len * 2, y - uy * len * 2);
    ctx.stroke();
    ctx.restore();
  }
  sphere(ctx, x, y, r, colour, { glow: heat > 0.45 ? (heat - 0.45) * 1.5 : 0 });
  if (r > 2.6) {
    ctx.save();
    ctx.fillStyle = hexA(light, 0.9);
    ctx.beginPath();
    ctx.ellipse(x - r * 0.33, y - r * 0.38, r * 0.27, r * 0.19, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * The front face of the sealed cell, drawn over its contents.
 *
 * Real glass gives itself away with three things at once: a bright vertical
 * highlight down the lit side, a dimmer one down the far side, and a wall with
 * thickness you can see through. Draw the contents first and this over them.
 */
function cellGlass(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, wall: number,
  theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const light = lightOf(theme);
  const r = wall * 0.8;

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  const pane = ctx.createLinearGradient(x, 0, x + w, 0);
  pane.addColorStop(0, hexA(light, dark ? 0.16 : 0.4));
  pane.addColorStop(0.13, hexA(light, 0.05));
  pane.addColorStop(0.84, hexA(light, 0.03));
  pane.addColorStop(1, hexA(light, dark ? 0.12 : 0.24));
  ctx.fillStyle = pane;
  ctx.fill();

  // The room reflected across the top of the front face.
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, y, 0, y + h * 0.4);
  sheen.addColorStop(0, hexA(light, dark ? 0.16 : 0.32));
  sheen.addColorStop(1, hexA(light, 0));
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h * 0.4);
  ctx.restore();

  // The wall itself: thick, translucent, bright where the light lands.
  ctx.strokeStyle = hexA(theme.sci["solid"], dark ? 0.34 : 0.24);
  ctx.lineWidth = wall * 2;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.6 : 0.42);
  ctx.lineWidth = 1.6;
  roundRect(ctx, x - wall, y - wall, w + wall * 2, h + wall * 2, r + wall);
  ctx.stroke();
  ctx.strokeStyle = hexA(light, dark ? 0.5 : 0.9);
  ctx.lineWidth = 1.8;
  roundRect(ctx, x - wall + 2, y - wall + 2, w + wall * 2 - 4, h + wall * 2 - 4, r + wall);
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.55 : 0.28);
  ctx.lineWidth = 1.2;
  roundRect(ctx, x + wall, y + wall, w - wall * 2, h - wall * 2, Math.max(1, r - wall * 0.5));
  ctx.stroke();

  ctx.fillStyle = hexA(light, 0.62);
  ctx.fillRect(x + w * 0.04, y + h * 0.05, Math.max(2, w * 0.013), h * 0.87);
  ctx.fillStyle = hexA(light, 0.3);
  ctx.fillRect(x + w * 0.08, y + h * 0.1, Math.max(1, w * 0.006), h * 0.74);
  ctx.fillStyle = hexA(light, 0.24);
  ctx.fillRect(x + w * 0.955, y + h * 0.13, Math.max(1, w * 0.008), h * 0.72);
  ctx.restore();

  // Machined collars: this cell is sealed, which is why the gas cannot leave.
  const steel = theme.sci["mass"];
  metal(ctx, x - wall * 2.4, y - wall * 2.8, w + wall * 4.8, wall * 2.4, steel, { radius: wall * 0.6 });
  metal(ctx, x - wall * 1.9, y + h + wall * 0.5, w + wall * 3.8, wall * 1.7, steel, { radius: wall * 0.5 });
}

/**
 * A mercury-in-glass thermometer on an enamel scale plate.
 *
 * The bulb, the bore, the rising column and the printed ticks are all here
 * because a student has held one of these — the picture does not need decoding.
 */
function thermometer(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, botY: number, w: number,
  frac: number, mercury: string, theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const light = lightOf(theme);
  const bulbR = w * 1.25;
  const bulbY = botY - bulbR;
  const stemTop = topY;
  const stemBot = bulbY;

  const plateL = cx - w * 4.6;
  const plateW = w * 8.0;
  const plateT = stemTop - w * 3.4;
  const plateH = bulbY + bulbR * 1.5 - plateT;
  softShadow(ctx, () => {
    plastic(ctx, plateL, plateT, plateW, plateH, theme.surfaceAlt, {
      radius: w * 1.4, gloss: 0.32,
    });
  }, { blur: 16, dy: 6, alpha: dark ? 0.45 : 0.22 });

  // Ticks up the right of the bore: every 50 K, long and numbered every 200 K.
  ctx.save();
  ctx.lineCap = "butt";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (let k = 0; k <= 700; k += 50) {
    const ty = stemBot - (k / 700) * (stemBot - stemTop);
    const major = k % 200 === 0;
    ctx.strokeStyle = hexA(theme.ink, major ? 0.65 : 0.32);
    ctx.lineWidth = major ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.62, ty);
    ctx.lineTo(cx + w * (major ? 1.55 : 1.1), ty);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = hexA(theme.ink, 0.72);
      ctx.font = `600 ${Math.max(8, w * 0.62)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(String(k), cx + w * 1.8, ty);
    }
  }
  ctx.restore();

  // The bore: glass with a dark back, so the column has something to sit in.
  ctx.save();
  roundRect(ctx, cx - w / 2, stemTop, w, stemBot - stemTop + w, w / 2);
  const bore = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  bore.addColorStop(0, hexA(theme.ink, dark ? 0.5 : 0.2));
  bore.addColorStop(0.4, hexA(light, 0.42));
  bore.addColorStop(1, hexA(theme.ink, dark ? 0.4 : 0.16));
  ctx.fillStyle = bore;
  ctx.fill();
  ctx.restore();

  // The column, and the bulb it rises out of.
  const colH = (stemBot - stemTop) * frac;
  ctx.save();
  roundRect(ctx, cx - w * 0.31, stemBot - colH, w * 0.62, colH + w, w * 0.31);
  const col = ctx.createLinearGradient(cx - w * 0.31, 0, cx + w * 0.31, 0);
  col.addColorStop(0, blend(mercury, theme.ink, 0.35));
  col.addColorStop(0.35, mercury);
  col.addColorStop(1, blend(mercury, theme.ink, 0.28));
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();

  sphere(ctx, cx, bulbY, bulbR, mercury, { glow: frac > 0.55 ? (frac - 0.55) * 1.2 : 0 });
  ctx.save();
  ctx.strokeStyle = hexA(light, 0.7);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, bulbY, bulbR, 0, Math.PI * 2);
  ctx.stroke();
  // The bright vertical line down the bore that says "this is round glass".
  ctx.fillStyle = hexA(light, 0.75);
  ctx.fillRect(cx - w * 0.34, stemTop + w * 0.6, Math.max(1, w * 0.12), stemBot - stemTop - w * 0.8);
  ctx.restore();

  return { plateL, plateW, plateT, plateH, stemTop, stemBot };
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band, time } = rc;
  const s = substanceOf(params);
  const setT = params.temperature as number;
  const tStar = toReduced(setT, s);
  const dark = isDarkTheme(theme);
  const light = lightOf(theme);
  const M = Math.min(width, height);

  const accent = phaseColor(state, theme);
  const cold = theme.sci["cold"];
  const hot = theme.sci["hot"];
  const steel = theme.sci["mass"];
  const T_MAX = 700;

  /* ---- the room the apparatus is standing in ---- */
  depthWash(ctx, width, height, theme);
  const benchY = height * 0.925;
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  /* ---- layout: the cell owns the middle of the stage ---- */
  const wall = Math.max(5, M * 0.016);
  const innerW = Math.min(width * 0.565, height * 0.70 * (BOX_W / BOX_H));
  const innerH = innerW * (BOX_H / BOX_W);
  const inL = width * 0.155;
  const inB = height * 0.785;
  const inT = inB - innerH;
  const inR = inL + innerW;
  const wx = (x: number) => inL + (x / BOX_W) * innerW;
  const wy = (y: number) => inB - (y / BOX_H) * innerH;
  const pScale = innerW / BOX_W;

  /* ---- the heating stage the cell sits on ---- */
  const heatFrac = clamp((setT - 300) / 400, 0, 1);
  const chillFrac = clamp((300 - setT) / 300, 0, 1);
  const plateT = inB + wall * 3.2;
  const plateH = Math.max(11, M * 0.05);
  const plateL = inL - wall * 4.2;
  const plateW = innerW + wall * 8.4;
  contactShadow(ctx, (inL + inR) / 2, benchY, innerW * 0.4, 0);
  for (const lx of [plateL + plateW * 0.1, plateL + plateW * 0.9]) {
    const legW = wall * 1.7;
    metal(ctx, lx - legW / 2, plateT + plateH * 0.7, legW,
      benchY - plateT - plateH * 0.7, steel, { radius: 2, angle: 0 });
    metal(ctx, lx - legW, benchY - wall * 0.5, legW * 2, wall * 0.7, steel, { radius: 2 });
  }
  // A cast body with a recessed element well, so the stage has a machined face
  // rather than reading as a second rail under the cell's own flange.
  softShadow(ctx, () => {
    metal(ctx, plateL, plateT, plateW, plateH, blend(steel, theme.ink, 0.35),
      { radius: plateH * 0.22, polish: 0.75 });
  }, { blur: 12, dy: 5, alpha: 0.3 });
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, dark ? 0.6 : 0.42);
  roundRect(ctx, plateL + plateW * 0.05, plateT + plateH * 0.22,
    plateW * 0.9, plateH * 0.34, plateH * 0.16);
  ctx.fill();
  ctx.restore();
  // A real element does not sit at one brightness — it breathes as it cycles.
  const breathe = 0.88 + 0.12 * Math.sin(time * 2.3) + 0.05 * Math.sin(time * 5.7);
  if (heatFrac > 0.02 || chillFrac > 0.02) {
    const eColour = heatFrac >= chillFrac ? hot : cold;
    const eStrength = Math.max(heatFrac, chillFrac) * breathe;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = hexA(eColour, 0.85 * eStrength);
    roundRect(ctx, plateL + plateW * 0.07, plateT + plateH * 0.27,
      plateW * 0.86, plateH * 0.24, plateH * 0.12);
    ctx.fill();
    glow(ctx, (inL + inR) / 2, plateT + plateH * 0.4, innerW * 0.55, eColour, 0.5 * eStrength);
    ctx.restore();
    // Heat haze between the element and the base of the cell.
    if (heatFrac > 0.15) {
      ctx.save();
      ctx.globalAlpha = 0.3 * heatFrac;
      ctx.strokeStyle = hexA(hot, 0.6);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) {
        const hx = plateL + plateW * (0.12 + 0.09 * i);
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) {
          const f = k / 8;
          const hy = plateT - f * (plateT - inB - wall);
          const wob = Math.sin(time * 3.4 + i * 1.7 + f * 5.5) * wall * 0.7 * f;
          if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx + wob, hy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---- inside the cell, before the glass goes over it ---- */
  // The cell's own drop shadow goes down first, under everything it holds:
  // paint it afterwards and it wipes out the contents.
  softShadow(ctx, () => {
    ctx.fillStyle = hexA(theme.surface, dark ? 0.5 : 0.75);
    roundRect(ctx, inL - wall, inT - wall, innerW + wall * 2, innerH + wall * 2, wall * 1.8);
    ctx.fill();
  }, { blur: wall * 3.5, dy: wall * 0.9, alpha: dark ? 0.55 : 0.3 });

  ctx.save();
  roundRect(ctx, inL, inT, innerW, innerH, wall * 0.8);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, inT, 0, inB);
  wash.addColorStop(0, hexA(accent, dark ? 0.16 : 0.07));
  wash.addColorStop(1, hexA(accent, dark ? 0.36 : 0.2));
  ctx.fillStyle = wash;
  ctx.fillRect(inL, inT, innerW, innerH);
  if (heatFrac > 0.02) {
    glow(ctx, (inL + inR) / 2, inB, innerW * 0.62, hot, 0.34 * heatFrac * breathe);
  }
  if (chillFrac > 0.05) {
    glow(ctx, (inL + inR) / 2, inT, innerW * 0.6, cold, 0.24 * chillFrac);
  }

  /* ---- bonds: the thing that holds a solid together ---- */
  if (overlays.bonds && band !== "K-2" && state.phase !== 2) {
    ctx.save();
    ctx.strokeStyle = hexA(accent, 0.42);
    ctx.lineWidth = Math.max(1.2, pScale * 0.14);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < state.n - 1; i++) {
      const xi = state.x[i], yi = state.y[i];
      for (let j = i + 1; j < state.n; j++) {
        const dx = xi - state.x[j];
        const dy = yi - state.y[j];
        if (dx * dx + dy * dy > NEIGHBOUR2) continue;
        ctx.moveTo(wx(xi), wy(yi));
        ctx.lineTo(wx(state.x[j]), wy(state.y[j]));
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---- particles ---- */
  const r = Math.max(3, pScale * 0.58);
  const BUCKETS = 8;
  const ramp: string[] = new Array(BUCKETS);
  for (let b = 0; b < BUCKETS; b++) ramp[b] = blend(cold, hot, b / (BUCKETS - 1));
  const vScale = 1 / (2 * Math.sqrt(2 * Math.max(tStar, 0.08)));
  let cxSum = 0, cySum = 0;
  for (let i = 0; i < state.n; i++) {
    const speed = Math.hypot(state.vx[i], state.vy[i]);
    const b = Math.min(BUCKETS - 1, Math.max(0, Math.round(speed * vScale * (BUCKETS - 1))));
    const px = wx(state.x[i]), py = wy(state.y[i]);
    cxSum += px; cySum += py;
    atom(ctx, px, py, r, ramp[b], light,
      state.vx[i], -state.vy[i], b / (BUCKETS - 1));
  }
  ctx.restore();

  /* ---- the glass, over the contents ---- */
  cellGlass(ctx, inL, inT, innerW, innerH, wall, theme);

  /* ---- the thermometer, clamped to the left of the cell ---- */
  const tW = Math.max(9, M * 0.028);
  const tCx = width * 0.077;
  const frac = clamp(setT / T_MAX, 0, 1);
  const mercury = blend(cold, hot, frac);
  const th = thermometer(ctx, tCx, height * 0.185, height * 0.85, tW, frac, mercury, theme);

  // A digital head on the plate: the number the student set, where they look.
  const headH = tW * 2.2;
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, dark ? 0.65 : 0.86);
  roundRect(ctx, th.plateL + tW * 0.5, th.plateT + tW * 0.5, th.plateW - tW, headH, tW * 0.4);
  ctx.fill();
  ctx.strokeStyle = hexA(mercury, 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(12, tW * 1.15)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.shadowColor = hexA(mercury, 0.8);
  ctx.shadowBlur = 10;
  ctx.fillStyle = mercury;
  ctx.fillText(`${setT.toFixed(0)} K`, th.plateL + th.plateW / 2, th.plateT + tW * 0.5 + headH / 2);
  ctx.restore();

  /* ---- calibration marks the student can hunt for ---- */
  if (overlays.points) {
    for (const [value, text, colour] of [
      [s.melting, "melts", theme.sci["liquid"]],
      [s.boiling, "boils", theme.sci["gas"]],
    ] as [number, string, string][]) {
      const yy = th.stemBot - (th.stemBot - th.stemTop) * clamp(value / T_MAX, 0, 1);
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tCx - tW * 3.9, yy);
      ctx.lineTo(tCx - tW * 0.6, yy);
      ctx.stroke();
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.moveTo(tCx - tW * 0.6, yy);
      ctx.lineTo(tCx - tW * 1.3, yy - tW * 0.4);
      ctx.lineTo(tCx - tW * 1.3, yy + tW * 0.4);
      ctx.closePath();
      ctx.fill();
      if (band !== "K-2") {
        caption(ctx, tCx - tW * 1.5, yy - tW * 0.95, `${text} ${value.toFixed(0)} K`, theme, {
          size: Math.max(9, tW * 0.62), align: "right", color: colour,
        });
      }
      ctx.restore();
    }
  }

  /* ---- callouts, out in the clear right margin ---- */
  const calloutX = inR + Math.max(18, width * 0.022);
  callout(ctx, inR - innerW * 0.05, inT + innerH * 0.1, calloutX, height * 0.16,
    `${s.label}  ${s.formula}`, theme, { sub: "sealed cell, fixed volume", side: "right" });


  const parts = state.phase === 0
    ? "locked in place, vibrating"
    : state.coexist
      ? "fast ones escaping"
      : state.phase === 1
        ? "touching, but free to slide"
        : "far apart, filling the cell";
  callout(ctx, cxSum / Math.max(1, state.n), cySum / Math.max(1, state.n),
    calloutX, height * 0.35, phaseName(state), theme,
    { sub: band === "K-2" ? undefined : parts, side: "right", accent });

  callout(ctx, inR - innerW * 0.14, plateT + plateH * 0.5, calloutX, height * 0.62,
    `${setT.toFixed(0)} K`, theme,
    { sub: "heating stage", side: "right", accent: mercury });

  vignette(ctx, width, height, 0.18);
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
