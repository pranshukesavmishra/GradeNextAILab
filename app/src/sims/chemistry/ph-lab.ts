import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { camera, roundRect } from "@ui/draw";
import {
  caption, contactShadow, groundPlane, hexA, isDarkTheme, lifted, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * pH & Acid-Base Lab — Grades 5-12.
 *
 * Put a real household solution in the flask, then drip acid or base into it
 * from the burette and watch the pH move. Every number on screen comes out of
 * one equilibrium solver — there is no lookup table of answers anywhere in this
 * file. Choose lemon juice and the solver is told "0.05 M of an acid with
 * Ka = 7.4 × 10⁻⁴"; the pH of 2.2 is its answer, not ours.
 *
 * Confronts the belief that pH is a linear scale, that "neutral" means "no
 * ions", and that a strong acid and a concentrated acid are the same thing.
 */

/* ------------------------------------------------------------------ *
 * The chemistry
 * ------------------------------------------------------------------ */

/** Ion product of water at 25 °C. */
export const KW = 1.0e-14;

/** Everything dissolved in the beaker, in mol/L of the *formal* amount added. */
export interface Solution {
  strongAcid: number;
  strongBase: number;
  weakAcid: number;
  /** Acid dissociation constant of the weak acid. */
  ka: number;
  weakBase: number;
  /** Base dissociation constant of the weak base. */
  kb: number;
}

export const PURE_WATER: Solution = {
  strongAcid: 0, strongBase: 0, weakAcid: 0, ka: 0, weakBase: 0, kb: 0,
};

/**
 * Charge balance for the mixture, as a function of [H⁺].
 *
 *   [Na⁺] + [BH⁺] + [H⁺]  =  [Cl⁻] + [OH⁻] + [A⁻]
 *
 * with [A⁻] = C_HA·Ka/(Ka + h) and [BH⁺] = C_B·h/(h + Kw/Kb). The function is
 * strictly increasing in h, which is what makes plain bisection bullet-proof:
 * strong or weak, acid or base, dilute or concentrated, it always converges.
 */
export function chargeBalance(h: number, s: Solution): number {
  const weakAcidAnion = s.weakAcid > 0 && s.ka > 0 ? (s.weakAcid * s.ka) / (s.ka + h) : 0;
  const weakBaseCation = s.weakBase > 0 && s.kb > 0 ? (s.weakBase * h) / (h + KW / s.kb) : 0;
  return s.strongBase + weakBaseCation + h - s.strongAcid - KW / h - weakAcidAnion;
}

/** Exact [H⁺] for the mixture, by bisection in log space. */
export function solveH(s: Solution): number {
  let lo = -15;   // log10 [H⁺]
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (chargeBalance(Math.pow(10, mid), s) < 0) lo = mid;
    else hi = mid;
  }
  return Math.pow(10, (lo + hi) / 2);
}

/** pH = −log₁₀[H⁺]. The definition, applied to the solved concentration. */
export function pHOf(s: Solution): number {
  return -Math.log10(solveH(s));
}

/* ------------------------------------------------------------------ *
 * What can go in the flask
 * ------------------------------------------------------------------ */

interface FlaskContents extends Solution {
  label: string;
  note: string;
}

/**
 * Real household solutions, each described by what is actually dissolved in it
 * rather than by its pH. The pH follows from the solver.
 */
const FLASK: Record<string, FlaskContents> = {
  stomach: {
    label: "Stomach acid", note: "0.1 M hydrochloric acid — a strong acid",
    ...PURE_WATER, strongAcid: 0.1,
  },
  lemon: {
    label: "Lemon juice", note: "0.05 M citric acid, Ka₁ = 7.4 × 10⁻⁴",
    ...PURE_WATER, weakAcid: 0.05, ka: 7.4e-4,
  },
  vinegar: {
    label: "Vinegar", note: "0.83 M acetic acid (5%), Ka = 1.8 × 10⁻⁵",
    ...PURE_WATER, weakAcid: 0.83, ka: 1.8e-5,
  },
  coffee: {
    label: "Black coffee", note: "weak organic acids, Ka ≈ 1 × 10⁻⁶",
    ...PURE_WATER, weakAcid: 3.0e-4, ka: 1.0e-6,
  },
  milk: {
    label: "Milk", note: "a trace of very weak acid",
    ...PURE_WATER, weakAcid: 1.0e-4, ka: 6.3e-10,
  },
  water: {
    label: "Pure water", note: "nothing dissolved — but not ion-free",
    ...PURE_WATER,
  },
  blood: {
    label: "Blood", note: "buffered slightly basic",
    ...PURE_WATER, weakBase: 1.0e-4, kb: 6.3e-10,
  },
  baking: {
    label: "Baking soda", note: "0.1 M sodium hydrogen carbonate",
    ...PURE_WATER, weakBase: 0.1, kb: 4.6e-11,
  },
  soap: {
    label: "Hand soap", note: "0.01 M weak base, Kb = 1 × 10⁻⁶",
    ...PURE_WATER, weakBase: 0.01, kb: 1.0e-6,
  },
  ammonia: {
    label: "Ammonia cleaner", note: "0.1 M ammonia, Kb = 1.8 × 10⁻⁵",
    ...PURE_WATER, weakBase: 0.1, kb: 1.8e-5,
  },
  bleach: {
    label: "Bleach", note: "0.7 M hypochlorite plus 0.03 M free NaOH",
    ...PURE_WATER, weakBase: 0.7, kb: 3.4e-7, strongBase: 0.03,
  },
  lye: {
    label: "Drain cleaner", note: "0.1 M sodium hydroxide — a strong base",
    ...PURE_WATER, strongBase: 0.1,
  },
};

const FLASK_OPTIONS = Object.entries(FLASK).map(([value, c]) => ({ value, label: c.label }));

/** Litres from the platform's SI cubic metres. */
const L = 1000;

/** The mixture after `addedM3` of titrant has been run in. */
function mixtureAt(params: ParamValues, addedM3: number): Solution {
  const flask = FLASK[params.substance as string] ?? FLASK.water;
  const vFlask = (params.flaskVolume as number) * L;
  const vAdded = addedM3 * L;
  const total = vFlask + vAdded;
  const keep = vFlask / total;      // everything already there gets diluted
  const grow = vAdded / total;      // everything added arrives diluted too
  const c = params.titrantConc as number;
  const addingAcid = params.titrant === "acid";
  return {
    strongAcid: flask.strongAcid * keep + (addingAcid ? c * grow : 0),
    strongBase: flask.strongBase * keep + (addingAcid ? 0 : c * grow),
    weakAcid: flask.weakAcid * keep,
    ka: flask.ka,
    weakBase: flask.weakBase * keep,
    kb: flask.kb,
  };
}

/** Titrant volume at which the flask's acid or base is exactly used up. */
function equivalenceVolume(params: ParamValues): number {
  const flask = FLASK[params.substance as string] ?? FLASK.water;
  const vFlask = params.flaskVolume as number;
  const c = params.titrantConc as number;
  if (c <= 0) return 0;
  const equivalents = params.titrant === "acid"
    ? flask.strongBase + flask.weakBase
    : flask.strongAcid + flask.weakAcid;
  return (equivalents * vFlask) / c;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

/** Sample points across the burette's full range, precomputed once. */
const CURVE_N = 121;
const CURVE_MAX = 6e-5; // m³, i.e. 60 mL

interface State {
  ph: number;
  h: number;
  oh: number;
  added: number;        // m³
  totalVolume: number;  // m³
  equivalence: number;  // m³
  /** pH at CURVE_N evenly spaced burette volumes. */
  curve: number[];
  /** The furthest the student has actually titrated — only that much is drawn. */
  maxAdded: number;
  /** Purely cosmetic. */
  dropPhase: number;
  swirl: number;
}

function measure(params: ParamValues, prevMax: number): State {
  const added = params.volumeAdded as number;
  const h = solveH(mixtureAt(params, added));
  const curve: number[] = new Array(CURVE_N);
  for (let i = 0; i < CURVE_N; i++) {
    curve[i] = -Math.log10(solveH(mixtureAt(params, (i / (CURVE_N - 1)) * CURVE_MAX)));
  }
  return {
    ph: -Math.log10(h),
    h,
    oh: KW / h,
    added,
    totalVolume: (params.flaskVolume as number) + added,
    equivalence: equivalenceVolume(params),
    curve,
    maxAdded: Math.max(prevMax, added),
    dropPhase: 0,
    swirl: 0,
  };
}

const model: SimModel<State> = {
  init(params) {
    return measure(params, params.volumeAdded as number);
  },

  applyParams(state, params, prev) {
    // The chemistry is a pure function of the controls, so it is recomputed the
    // moment anything moves — the beaker is correct even while paused.
    // Changing what is in the flask starts a fresh titration, so the trace of
    // what has actually been measured is cleared.
    const sameRun =
      params.substance === prev.substance &&
      params.titrant === prev.titrant &&
      params.titrantConc === prev.titrantConc &&
      params.flaskVolume === prev.flaskVolume;
    const next = measure(params, sameRun ? state.maxAdded : (params.volumeAdded as number));
    next.dropPhase = state.dropPhase;
    next.swirl = state.swirl;
    return next;
  },

  step(state, dt, params) {
    // Nothing chemical happens over time; this only drives the drip and swirl.
    const dripping = (params.volumeAdded as number) > 0 ? 1 : 0;
    return {
      ...state,
      dropPhase: (state.dropPhase + dt * 1.6 * dripping) % 1,
      swirl: (state.swirl + dt * 0.35) % 1,
    };
  },

  readouts(state) {
    const pOH = 14 - state.ph;
    return [
      { key: "ph", label: "pH", quantity: q(state.ph, "ph"), unit: "pH", semantic: "acid", graphable: true },
      {
        key: "poh", label: "pOH", quantity: q(pOH, "ph"), unit: "pH",
        semantic: "base", graphable: true, bands: ["9-12"],
      },
      {
        key: "hplus", label: "[H⁺]", quantity: q(state.h, "concentration"), unit: "M",
        semantic: "acid", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "ohminus", label: "[OH⁻]", quantity: q(state.oh, "concentration"), unit: "M",
        semantic: "base", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "added", label: "Volume added", quantity: q(state.added, "volume"), unit: "mL",
        semantic: "distance", graphable: true,
      },
      {
        key: "total", label: "Total volume", quantity: q(state.totalVolume, "volume"), unit: "mL",
        semantic: "distance", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const flask = FLASK[params.substance as string] ?? FLASK.water;
    const strong = flask.strongAcid > 0 || flask.strongBase > 0;
    return {
      ph: state.ph,
      pHError: Math.abs(state.ph - 7),
      substance: params.substance as string,
      strongFlask: strong,
      equivalenceVolume: state.equivalence,
      /** How far the burette is from the equivalence point, in mL. */
      equivalenceError: state.equivalence > 0 ? Math.abs(state.added - state.equivalence) * 1e6 : 999,
      hasEquivalence: state.equivalence > 0 && state.equivalence <= CURVE_MAX,
      acidic: state.ph < 6.5,
      basic: state.ph > 7.5,
      explored: state.maxAdded * 1e6,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

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

/** The universal-indicator ramp: acid → neutral → base, nothing decorative. */
function indicatorColor(ph: number, theme: RenderContext<State>["theme"]): string {
  const a = theme.sci["acid"];
  const n = theme.sci["neutral"];
  const b = theme.sci["base"];
  if (ph <= 7) return blend(a, n, clamp(ph / 7, 0, 1));
  return blend(n, b, clamp((ph - 7) / 7, 0, 1));
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** A stable pseudo-random value per index — no allocation, no rng in render. */
function jitter(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// World is 24 wide by 15 tall: the glassware on the left, the curve on the right.
const W = 24;
const H = 15;

/** Bench height, in world units. Everything glass stands on this line. */
const BENCH_Y = 2.9;

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const cam = camera({ x0: -0.4, y0: -1.3, x1: W + 0.4, y1: H + 0.4, width, height });
  const px = (x: number) => cam.toScreenX(x);
  const py = (y: number) => cam.toScreenY(y);
  const scale = cam.scale;
  const dark = isDarkTheme(theme);
  const tint = indicatorColor(state.ph, theme);
  const glass = theme.sci["solid"];

  /* ---- the room and the bench everything is standing on ---- */
  sky(ctx, width, height, theme, "indoor");
  const benchY = py(BENCH_Y);
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  /* ---- burette ---- */
  const buretteX = 4.3;
  const tubeW = 0.92;
  const barrelTop = py(H - 0.1);
  const barrelBot = py(10.6);
  const bxL = px(buretteX - tubeW / 2);
  const bWpx = tubeW * scale;

  // The titrant left in the burette drains as the student adds more.
  const drained = clamp(state.added / CURVE_MAX, 0, 1);
  const titrantColour = params.titrant === "acid" ? theme.sci["acid"] : theme.sci["base"];
  const colH = (barrelBot - barrelTop - 6) * (1 - drained);

  ctx.save();
  const bore = ctx.createLinearGradient(bxL, 0, bxL + bWpx, 0);
  bore.addColorStop(0, hexA(glass, dark ? 0.34 : 0.2));
  bore.addColorStop(0.35, hexA(theme.surface, 0.55));
  bore.addColorStop(1, hexA(glass, dark ? 0.4 : 0.26));
  ctx.fillStyle = bore;
  roundRect(ctx, bxL, barrelTop, bWpx, barrelBot - barrelTop, 4);
  ctx.fill();
  ctx.restore();

  ctx.save();
  const col = ctx.createLinearGradient(bxL, 0, bxL + bWpx, 0);
  col.addColorStop(0, hexA(titrantColour, 0.5));
  col.addColorStop(0.35, hexA(titrantColour, 0.9));
  col.addColorStop(1, hexA(titrantColour, 0.55));
  ctx.fillStyle = col;
  roundRect(ctx, bxL + 2, barrelBot - 3 - colH, bWpx - 4, colH, 3);
  ctx.fill();
  ctx.restore();

  // Graduations, so the burette reads as an instrument rather than a bar.
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const ty = barrelTop + 4 + (i / 10) * (barrelBot - barrelTop - 8);
    const long = i % 2 === 0;
    ctx.moveTo(bxL + 1.5, ty);
    ctx.lineTo(bxL + (long ? bWpx * 0.55 : bWpx * 0.34), ty);
  }
  ctx.stroke();
  ctx.strokeStyle = hexA(glass, 0.75);
  ctx.lineWidth = 1.6;
  roundRect(ctx, bxL, barrelTop, bWpx, barrelBot - barrelTop, 4);
  ctx.stroke();
  ctx.restore();

  // Stopcock and tapering tip.
  material(ctx, bxL - bWpx * 0.42, barrelBot, bWpx * 1.84, Math.max(5, scale * 0.42), theme.inkSoft, 3);
  const tipTop = barrelBot + Math.max(5, scale * 0.42);
  const tipBot = py(9.95);
  ctx.save();
  ctx.fillStyle = hexA(glass, 0.7);
  ctx.beginPath();
  ctx.moveTo(bxL + bWpx * 0.3, tipTop);
  ctx.lineTo(bxL + bWpx * 0.7, tipTop);
  ctx.lineTo(px(buretteX) + 2, tipBot);
  ctx.lineTo(px(buretteX) - 2, tipBot);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (band !== "K-2") {
    caption(ctx, bxL + bWpx + 10, py(13.2), params.titrant === "acid" ? "Acid (HCl)" : "Base (NaOH)",
      theme, { size: 11, color: titrantColour });
  }

  /* ---- beaker ---- */
  const bx = 1.2, bw = 6.3, bhMax = 6.1;
  const level = clamp(state.totalVolume / (CURVE_MAX + 5e-5), 0.1, 1) * bhMax;
  const gl = px(bx), gr = px(bx + bw);
  const gTop = py(BENCH_Y + bhMax);
  const gBot = benchY;
  const liqTop = py(BENCH_Y + level);
  const wallW = Math.max(2.5, scale * 0.11);

  contactShadow(ctx, (gl + gr) / 2, benchY + 1, (gr - gl) * 0.32, 0);

  // The liquid: a body of colour with a real surface line, not a flat block.
  ctx.save();
  ctx.beginPath();
  ctx.rect(gl, liqTop, gr - gl, gBot - liqTop);
  ctx.clip();
  const body = ctx.createLinearGradient(0, liqTop, 0, gBot);
  body.addColorStop(0, hexA(tint, 0.62));
  body.addColorStop(1, hexA(tint, 0.94));
  ctx.fillStyle = body;
  ctx.fillRect(gl, liqTop, gr - gl, gBot - liqTop);
  ctx.restore();

  /* ---- ions, drawn on a log scale ---- */
  if (overlays.ions && band !== "K-2") {
    const nH = Math.round(clamp(((14 - state.ph) / 14) * 26, 0, 26));
    const nOH = Math.round(clamp((state.ph / 14) * 26, 0, 26));
    const rIon = Math.max(2.5, scale * 0.15);
    for (let i = 0; i < nH; i++) {
      const ix = bx + 0.45 + jitter(i, 1) * (bw - 0.9);
      const iy = BENCH_Y + 0.35 + ((jitter(i, 2) + state.swirl) % 1) * Math.max(0.2, level - 0.7);
      sphere(ctx, px(ix), py(iy), rIon, theme.sci["acid"]);
    }
    for (let i = 0; i < nOH; i++) {
      const ix = bx + 0.45 + jitter(i, 3) * (bw - 0.9);
      const iy = BENCH_Y + 0.35 + ((jitter(i, 4) + state.swirl * 0.8) % 1) * Math.max(0.2, level - 0.7);
      sphere(ctx, px(ix), py(iy), rIon, theme.sci["base"]);
    }
  }

  // Surface: a lit meniscus ellipse, which is what says "looking into a beaker".
  ctx.save();
  ctx.fillStyle = hexA(tint, 0.5);
  ctx.beginPath();
  ctx.ellipse((gl + gr) / 2, liqTop, (gr - gl) / 2, Math.max(3, scale * 0.24), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse((gl + gr) / 2, liqTop, (gr - gl) / 2 - 1, Math.max(3, scale * 0.24), 0, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  /* ---- falling drop, on its way in ---- */
  if (state.added > 0) {
    const dropY = 9.7 - state.dropPhase * (9.7 - (BENCH_Y + level + 0.2));
    sphere(ctx, px(buretteX), py(dropY), Math.max(2.5, scale * 0.19), titrantColour, { glow: 0.5 });
  }

  /* ---- the glass, drawn over the contents ---- */
  ctx.save();
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(gl, gTop);
  ctx.lineTo(gl, gBot - 2);
  ctx.quadraticCurveTo(gl, gBot, gl + 6, gBot);
  ctx.lineTo(gr - 6, gBot);
  ctx.quadraticCurveTo(gr, gBot, gr, gBot - 2);
  ctx.lineTo(gr, gTop);
  ctx.strokeStyle = hexA(glass, 0.65);
  ctx.lineWidth = wallW;
  ctx.stroke();
  // Rim and pouring spout.
  ctx.strokeStyle = hexA(glass, 0.95);
  ctx.lineWidth = Math.max(2, wallW * 0.7);
  ctx.beginPath();
  ctx.moveTo(gl - 3, gTop);
  ctx.lineTo(gr - (gr - gl) * 0.22, gTop);
  ctx.quadraticCurveTo(gr + 4, gTop - 3, gr + 7, gTop + 3);
  ctx.stroke();
  // Graduation marks and a specular streak.
  ctx.strokeStyle = hexA(theme.ink, 0.28);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i <= 4; i++) {
    const ty = gBot - (i / 5) * (gBot - gTop);
    ctx.moveTo(gl + wallW, ty);
    ctx.lineTo(gl + wallW + (gr - gl) * 0.12, ty);
  }
  ctx.stroke();
  const sheen = ctx.createLinearGradient(gl, 0, gl + (gr - gl) * 0.4, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0.28)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(gl + wallW, gTop + 4, (gr - gl) * 0.16, gBot - gTop - 6);
  ctx.restore();

  const flask = FLASK[params.substance as string] ?? FLASK.water;
  caption(ctx, (gl + gr) / 2, gTop - 16, flask.label, theme, { align: "center", size: 14 });

  /* ---- the bench meter: the big pH number, on the front of the bench ---- */
  const meterX = px(0.9), meterW = px(8.0) - px(0.9);
  const meterY = py(2.35), meterH = py(0.25) - py(2.35);
  material(ctx, meterX, meterY, meterW, meterH, theme.surfaceAlt, 8);
  ctx.save();
  ctx.font = `700 ${Math.max(22, scale * 1.45)}px system-ui, sans-serif`;
  ctx.fillStyle = tint;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = hexA(tint, 0.55);
  ctx.shadowBlur = 14;
  ctx.fillText(
    `pH ${state.ph.toFixed(band === "9-12" ? 2 : 1)}`,
    meterX + meterW / 2, meterY + meterH * (band === "9-12" ? 0.38 : 0.5),
  );
  ctx.restore();
  if (band === "9-12") {
    caption(ctx, meterX + meterW / 2, meterY + meterH * 0.78, flask.note, theme, {
      align: "center", size: 10, color: theme.inkSoft, weight: 500,
    });
  }

  /* ---- titration curve ---- */
  const gx = 9.9, gy = 3.6, gw = W - gx - 0.7, gh = 10.1;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, dark ? 0.42 : 0.62);
  roundRect(ctx, px(gx), py(gy + gh), gw * scale, gh * scale, 7);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let p = 2; p <= 12; p += 2) {
    const yy = py(gy + (p / 14) * gh);
    ctx.moveTo(px(gx), yy);
    ctx.lineTo(px(gx + gw), yy);
  }
  ctx.stroke();
  ctx.restore();

  // pH 7 line: the reference students are always hunting for.
  ctx.save();
  ctx.strokeStyle = theme.sci["neutral"];
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(px(gx), py(gy + (7 / 14) * gh));
  ctx.lineTo(px(gx + gw), py(gy + (7 / 14) * gh));
  ctx.stroke();
  ctx.restore();

  const curveX = (v: number) => gx + (v / CURVE_MAX) * gw;
  const curveY = (p: number) => gy + (clamp(p, 0, 14) / 14) * gh;

  // Only the part actually titrated is drawn — the rest is still unknown.
  const lastIdx = Math.min(CURVE_N - 1, Math.round((state.maxAdded / CURVE_MAX) * (CURVE_N - 1)));
  if (lastIdx > 0) {
    lifted(ctx, 8, 2, () => {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i <= lastIdx; i++) {
        const v = (i / (CURVE_N - 1)) * CURVE_MAX;
        const sx = px(curveX(v));
        const sy = py(curveY(state.curve[i]));
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
    }, 0.3);
  }

  if (overlays.equivalence && state.equivalence > 0 && state.equivalence <= CURVE_MAX) {
    const ex = px(curveX(state.equivalence));
    ctx.save();
    ctx.strokeStyle = theme.sci["neutral"];
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, py(gy));
    ctx.lineTo(ex, py(gy + gh));
    ctx.stroke();
    ctx.restore();
    caption(ctx, ex, py(gy) + 14, "equivalence", theme, {
      align: "center", size: 10, color: theme.sci["neutral"],
    });
  }

  sphere(ctx, px(curveX(state.added)), py(curveY(state.ph)), Math.max(4.5, scale * 0.26), tint,
    { glow: 0.6 });

  caption(ctx, px(gx) - 6, py(gy + gh), "14", theme, { align: "right", size: 10, color: theme.inkSoft });
  caption(ctx, px(gx) - 6, py(gy), "0", theme, { align: "right", size: 10, color: theme.inkSoft });
  caption(ctx, px(gx) - 6, py(gy + gh / 2), "pH", theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });
  caption(ctx, px(gx), py(gy + gh) - 14, "Titration curve", theme, { size: 13 });
  caption(ctx, px(gx + gw), py(gy) + 15, `${(state.added * 1e6).toFixed(1)} mL added`, theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });

  /* ---- the universal-indicator chart, under the curve it explains ---- */
  const rampX = gx, rampW = gw, rampTop = py(2.3), rampBot = py(1.45);
  for (let i = 0; i < 28; i++) {
    const p = (i / 27) * 14;
    ctx.fillStyle = indicatorColor(p, theme);
    ctx.fillRect(px(rampX + (i / 28) * rampW), rampTop, (rampW / 28) * scale + 1, rampBot - rampTop);
  }
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.35);
  ctx.lineWidth = 1;
  ctx.strokeRect(px(rampX), rampTop, rampW * scale, rampBot - rampTop);
  ctx.restore();
  const markX = px(rampX + (clamp(state.ph, 0, 14) / 14) * rampW);
  ctx.save();
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.moveTo(markX, rampTop - 1);
  ctx.lineTo(markX - 5, rampTop - 9);
  ctx.lineTo(markX + 5, rampTop - 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (band !== "K-2") {
    caption(ctx, px(rampX), rampBot + 12, "0 acid", theme, { size: 10, color: theme.sci["acid"] });
    caption(ctx, px(rampX + rampW / 2), rampBot + 12, "7", theme, {
      size: 10, align: "center", color: theme.sci["neutral"],
    });
    caption(ctx, px(rampX + rampW), rampBot + 12, "14 base", theme, {
      size: 10, align: "right", color: theme.sci["base"],
    });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const phLabSim: SimManifest<State> = {
  id: "chem.ph",
  title: "pH & Acid-Base Lab",
  tagline: "Test everything under the kitchen sink, then drip acid into base until the colour flips.",
  subject: "chemistry",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["5-PS1-3", "MS-PS1-2", "HS-PS1-6"], ccssMath: ["HSF.LE.A.4"] },
  learningGoals: [
    "Read the pH scale and sort everyday substances as acidic, neutral or basic.",
    "Explain that each pH step is a factor of ten in [H⁺].",
    "Use pH = −log₁₀[H⁺] and pH + pOH = 14.",
    "Find the equivalence point of a titration and explain why the pH leaps there.",
    "Tell the difference between a strong acid and a concentrated one.",
  ],
  misconceptions: [
    "pH 4 is twice as acidic as pH 8",
    "Neutral means there are no ions in the solution",
    "Strong and concentrated mean the same thing",
    "Adding twice as much acid halves the pH",
  ],
  interactionHint: "Pick a substance, then turn the burette tap with the Volume added slider.",
  tickRate: 60,
  params: {
    substance: {
      type: "option", label: "In the flask", options: FLASK_OPTIONS, default: "lemon",
      help: "Each one is described by what is actually dissolved in it. The pH is worked out from that.",
    },
    titrant: {
      type: "option", label: "In the burette",
      options: [
        { value: "acid", label: "Acid — 0.1 M HCl (strong)" },
        { value: "base", label: "Base — 0.1 M NaOH (strong)" },
      ],
      default: "acid",
      bands: ["6-8", "9-12"],
    },
    volumeAdded: {
      type: "number", label: "Volume added", kind: "volume", unit: "mL",
      min: 0, max: 6e-5, step: 1e-7, default: 0,
      help: "How much has run out of the burette into the flask.",
    },
    titrantConc: {
      type: "number", label: "Burette concentration", kind: "concentration", unit: "M",
      min: 0.01, max: 1, step: 0.01, default: 0.1,
      bands: ["9-12"],
      help: "Concentration is how much is dissolved. Strength is how completely it splits apart. They are not the same thing.",
    },
    flaskVolume: {
      type: "number", label: "Volume in the flask", kind: "volume", unit: "mL",
      min: 1e-5, max: 5e-5, step: 1e-6, default: 2.5e-5,
      bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "ions", label: "Show ions (log scale)", default: true, bands: ["6-8", "9-12"] },
    { key: "equivalence", label: "Mark the equivalence point", default: false, bands: ["9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "sort-substances",
      title: "Sort the household substances",
      question: "Which things in your kitchen are acids, which are bases, and which are neither?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["5-PS1-3", "MS-PS1-2"],
      setup: { substance: "water", volumeAdded: 0, titrant: "acid", titrantConc: 0.1, flaskVolume: 2.5e-5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit to an order before you test anything.",
          predict: {
            prompt: "Which of these is the most acidic?",
            options: ["Milk", "Lemon juice", "Bleach", "Baking soda"],
            correct: 1,
            reveal: "Lemon juice sits near pH 2. Bleach and baking soda are on the other side of the scale — they are bases.",
          },
        },
        {
          id: "neutral",
          phase: "setup",
          title: "Start with the middle of the scale",
          instruction: "Test pure water first. That is your neutral marker.",
          check: {
            describe: "Pure water is in the flask with nothing added",
            test: (v) => v.params.substance === "water" && (v.params.volumeAdded as number) === 0,
          },
          hints: ["Pure water is pH 7 — but it still contains H⁺ and OH⁻, at 10⁻⁷ M each."],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Test six substances",
          instruction: "Work through six different substances and record the pH of each.",
          requireData: 6,
          hints: [
            "Keep Volume added at zero so you are testing the substance itself.",
            "Press Record data after switching each substance.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Put them in order",
          instruction: "Rank your six from most acidic to most basic.",
          write: {
            prompt: "List your six substances in order of pH, and mark where 7 falls.",
            placeholder: "Most acidic: ... then ... Neutral: ... Most basic: ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "How big is one pH step?",
          instruction: "Compare [H⁺] for two substances three pH units apart.",
          write: {
            prompt: "Lemon juice is about pH 2 and coffee about pH 5. How many times more H⁺ is in the lemon juice?",
            placeholder: "Each pH step is ... so three steps is ...",
          },
        },
      ],
    },
    {
      id: "equivalence",
      title: "Find the equivalence point",
      question: "How much acid does it take to exactly cancel out a base, and what happens to the pH there?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["HS-PS1-6"],
      setup: { substance: "lye", titrant: "acid", titrantConc: 0.1, flaskVolume: 2.5e-5, volumeAdded: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the shape",
          instruction: "You will drip acid into 25 mL of 0.1 M NaOH. Predict the curve.",
          predict: {
            prompt: "As acid is added drop by drop, the pH will...",
            options: [
              "Fall steadily in a straight line",
              "Stay high, then plunge suddenly, then flatten out low",
              "Fall fast at first, then slow down",
              "Stay at 14 until all the acid is in",
            ],
            correct: 1,
            reveal: "Because pH is a logarithm, the last drops before the equivalence point change [OH⁻] by a factor of ten each time. That is the vertical cliff.",
          },
        },
        {
          id: "start",
          phase: "setup",
          title: "Check the starting pH",
          instruction: "With nothing added, 0.1 M NaOH should read pH 13.",
          check: {
            describe: "Drain cleaner in the flask, burette closed",
            test: (v) => v.params.substance === "lye" && (v.params.volumeAdded as number) === 0,
          },
        },
        {
          id: "titrate",
          phase: "measure",
          title: "Titrate and record",
          instruction: "Add acid in steps and record at least eight points, including a few near the cliff.",
          requireData: 8,
          hints: [
            "Take big steps until the pH starts to move, then switch to 0.1 mL steps.",
            "Moles of acid added = concentration × volume. When that equals the moles of base, you are there.",
            "0.1 M × 25 mL of base needs 0.1 M × 25 mL of acid.",
          ],
        },
        {
          id: "hit",
          phase: "analyze",
          title: "Land on it",
          instruction: "Set the burette within 0.2 mL of the equivalence point.",
          check: {
            describe: "Within 0.2 mL of the equivalence volume",
            test: (v) => (v.facts.equivalenceError as number) <= 0.2,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the cliff",
          instruction: "Say why the pH barely moves for 24 mL and then jumps.",
          write: {
            prompt: "Why does the pH change so slowly at first and then so fast near the equivalence point?",
            placeholder: "At the start there is so much OH⁻ that ... but near the end each drop ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "neutralise",
      title: "Neutralise it",
      brief: "Bring the drain cleaner to exactly pH 7.0 with the acid burette.",
      bands: ["6-8", "9-12"],
      setup: { substance: "lye", titrant: "acid", titrantConc: 0.1, flaskVolume: 2.5e-5, volumeAdded: 0 },
      goal: {
        describe: "pH within 0.1 of 7.0",
        test: (v) => (v.facts.pHError as number) <= 0.1,
      },
      stars: {
        two: { describe: "pH within 0.05 of 7.0", test: (v) => (v.facts.pHError as number) <= 0.05 },
        three: { describe: "pH within 0.01 of 7.0", test: (v) => (v.facts.pHError as number) <= 0.01 },
      },
      hints: [
        "Work out the moles of NaOH in the flask first.",
        "Equal moles of a strong acid and a strong base leave nothing but salt and water — pH exactly 7.",
        "0.1 M in 25 mL is 2.5 mmol. How many mL of 0.1 M acid is 2.5 mmol?",
      ],
    },
    {
      id: "half-equivalence",
      title: "Build a buffer",
      brief: "Half-neutralise the ammonia cleaner, where the solution resists pH change the hardest.",
      bands: ["9-12"],
      setup: { substance: "ammonia", titrant: "acid", titrantConc: 0.1, flaskVolume: 2.5e-5, volumeAdded: 0 },
      goal: {
        describe: "pH equals the pKa of the ammonium ion, 9.26",
        test: (v) => Math.abs((v.facts.ph as number) - 9.2553) <= 0.1,
      },
      stars: {
        two: { describe: "Within 0.03 of the pKa", test: (v) => Math.abs((v.facts.ph as number) - 9.2553) <= 0.03 },
        three: {
          describe: "Exactly at half the equivalence volume",
          test: (v) =>
            Math.abs((v.facts.ph as number) - 9.2553) <= 0.03 &&
            Math.abs((v.params.volumeAdded as number) - (v.facts.equivalenceVolume as number) / 2) < 5e-8,
        },
      },
      hints: [
        "Ammonia is a weak base, so its equivalence point sits below pH 7, not at it.",
        "Halfway to the equivalence point, exactly half the ammonia has become ammonium.",
        "When [NH₃] = [NH₄⁺], the Henderson-Hasselbalch equation says pH = pKa.",
      ],
    },
  ],
};
