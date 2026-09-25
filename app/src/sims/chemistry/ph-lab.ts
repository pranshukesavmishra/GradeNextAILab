import type {
  ParamValues, RenderContext, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { beaker, clampStand, flask as flaskGlass } from "@ui/labware";
import { callout, depthWash } from "@ui/organic";
import {
  contactShadow, groundPlane, hexA, isDarkTheme, metal, softShadow, sphere, vignette,
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

/**
 * Universal indicator, as it actually behaves in a flask.
 *
 * The real dye does not run red-to-blue through grey: it goes red, orange,
 * yellow, green, teal, blue, violet, and a student who has watched a titration
 * flip is looking for exactly those bands. Every stop is a theme token, so the
 * ramp still tracks light and dark mode.
 */
function indicatorColor(ph: number, theme: ThemeColors): string {
  const stops: [number, string][] = [
    [0, theme.sci["acid"]],
    [2.5, theme.sci["acid"]],
    [4.2, theme.sci["energy-thermal"]],
    [5.6, theme.sci["light"]],
    [7, theme.sci["neutral"]],
    [8.6, theme.sci["distance"]],
    [11, theme.sci["base"]],
    [14, theme.sci["field"]],
  ];
  const p = clamp(ph, 0, 14);
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return blend(c0, c1, (p - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** A stable pseudo-random value per index — no allocation, no rng in render. */
function jitter(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * The palette's light and dark ends, whichever mode is running.
 *
 * Speculars are light and instrument faces are dark whatever the theme does,
 * and a simulation may only take colour from the theme — so these two roles
 * swap between `surface` and `ink` rather than being written down as hexes.
 */
function lightOf(theme: ThemeColors): string {
  return isDarkTheme(theme) ? theme.ink : theme.surface;
}

function darkOf(theme: ThemeColors): string {
  return isDarkTheme(theme) ? theme.surface : theme.ink;
}

/**
 * The outline of the conical flask the labware module draws.
 *
 * Glass on a pale bench has almost no silhouette of its own; with the shape in
 * hand the flask can cast a shadow and carry a dark edge, which is what stops
 * it dissolving into the backdrop.
 */
function flaskPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
) {
  const neckW = w * 0.26, neckH = h * 0.3, mid = x + w / 2;
  ctx.beginPath();
  ctx.moveTo(mid - neckW / 2, y);
  ctx.lineTo(mid - neckW / 2, y + neckH);
  ctx.lineTo(x + w * 0.04, y + h - w * 0.1);
  ctx.quadraticCurveTo(x, y + h, x + w * 0.14, y + h);
  ctx.lineTo(x + w * 0.86, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w * 0.96, y + h - w * 0.1);
  ctx.lineTo(mid + neckW / 2, y + neckH);
  ctx.lineTo(mid + neckW / 2, y);
  ctx.closePath();
}

/**
 * A 50 mL burette: graduated bore, standing titrant with its own meniscus,
 * a stopcock with a knurled tap, and a drawn-out tip.
 *
 * Returns the y of the tip, which is where the next drop leaves from.
 */
function burette(
  ctx: CanvasRenderingContext2D,
  cx: number, top: number, barrelBot: number, w: number, tipBot: number,
  drained: number, titrant: string, theme: ThemeColors,
): number {
  const dark = isDarkTheme(theme);
  const light = lightOf(theme);
  const x = cx - w / 2;
  const h = barrelBot - top;

  softShadow(ctx, () => {
    ctx.fillStyle = hexA(theme.surface, dark ? 0.4 : 0.7);
    roundRect(ctx, x, top, w, h, w * 0.3);
    ctx.fill();
  }, { blur: 12, dy: 3, alpha: dark ? 0.5 : 0.22 });

  // Bore, then the titrant standing in it.
  ctx.save();
  roundRect(ctx, x, top, w, h, w * 0.3);
  ctx.clip();
  const bore = ctx.createLinearGradient(x, 0, x + w, 0);
  bore.addColorStop(0, hexA(light, dark ? 0.14 : 0.4));
  bore.addColorStop(0.45, hexA(light, dark ? 0.05 : 0.16));
  bore.addColorStop(1, hexA(light, dark ? 0.12 : 0.24));
  ctx.fillStyle = bore;
  ctx.fillRect(x, top, w, h);

  const colTop = top + h * clamp(drained, 0, 1);
  const col = ctx.createLinearGradient(x, 0, x + w, 0);
  col.addColorStop(0, hexA(titrant, 0.62));
  col.addColorStop(0.35, hexA(titrant, 0.95));
  col.addColorStop(1, hexA(titrant, 0.6));
  ctx.fillStyle = col;
  ctx.fillRect(x, colTop, w, barrelBot - colTop);
  ctx.beginPath();
  ctx.moveTo(x, colTop + w * 0.26);
  ctx.quadraticCurveTo(cx, colTop - w * 0.16, x + w, colTop + w * 0.26);
  ctx.strokeStyle = hexA(light, 0.85);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Graduations: an instrument, not a coloured bar.
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.55 : 0.42);
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const ty = top + w * 0.5 + (i / 20) * (h - w);
    const long = i % 5 === 0;
    ctx.lineWidth = long ? 1.4 : 0.9;
    ctx.moveTo(x + w * 0.55, ty);
    ctx.lineTo(x + w * (long ? 0.96 : 0.82), ty);
  }
  ctx.stroke();
  // The vertical highlight that turns a rectangle into a round glass tube.
  ctx.fillStyle = hexA(light, 0.7);
  ctx.fillRect(x + w * 0.2, top + w * 0.4, Math.max(1.5, w * 0.1), h - w * 0.8);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.55 : 0.35);
  ctx.lineWidth = 1.4;
  roundRect(ctx, x, top, w, h, w * 0.3);
  ctx.stroke();
  ctx.restore();

  // Stopcock: a barrel across the tube with a tap on the side.
  const scH = w * 0.9;
  metal(ctx, cx - w * 0.95, barrelBot, w * 1.9, scH, theme.sci["mass"], { radius: w * 0.2 });
  sphere(ctx, cx + w * 1.05, barrelBot + scH * 0.5, w * 0.42, theme.sci["mass"]);

  // Drawn-out tip.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.32, barrelBot + scH);
  ctx.lineTo(cx + w * 0.32, barrelBot + scH);
  ctx.lineTo(cx + w * 0.1, tipBot);
  ctx.lineTo(cx - w * 0.1, tipBot);
  ctx.closePath();
  const tip = ctx.createLinearGradient(cx - w * 0.32, 0, cx + w * 0.32, 0);
  tip.addColorStop(0, hexA(light, dark ? 0.2 : 0.55));
  tip.addColorStop(0.5, hexA(light, dark ? 0.06 : 0.2));
  tip.addColorStop(1, hexA(light, dark ? 0.16 : 0.36));
  ctx.fillStyle = tip;
  ctx.fill();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.5 : 0.3);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  return tipBot;
}

/** A dark instrument face inside a machined shell — the bench-top console. */
function consoleFace(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, theme: ThemeColors,
) {
  const shell = theme.sci["mass"];
  softShadow(ctx, () => {
    metal(ctx, x, y, w, h, shell, { radius: Math.min(14, h * 0.05) });
  }, { blur: 18, dy: 8, alpha: 0.32 });
  const pad = Math.max(9, w * 0.022);
  ctx.save();
  ctx.fillStyle = hexA(darkOf(theme), 0.92);
  roundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, Math.min(9, h * 0.03));
  ctx.fill();
  ctx.strokeStyle = hexA(lightOf(theme), 0.16);
  ctx.lineWidth = 1;
  ctx.stroke();
  // A diagonal sweep of room light across the cover glass.
  ctx.clip();
  const sweep = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  sweep.addColorStop(0, hexA(lightOf(theme), 0.1));
  sweep.addColorStop(0.35, hexA(lightOf(theme), 0.015));
  sweep.addColorStop(1, hexA(lightOf(theme), 0));
  ctx.fillStyle = sweep;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  return { x: x + pad * 2, y: y + pad * 2, w: w - pad * 4, h: h - pad * 4 };
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band, time } = rc;
  const dark = isDarkTheme(theme);
  const light = lightOf(theme);
  const M = Math.min(width, height);
  const tint = indicatorColor(state.ph, theme);
  const contents = FLASK[params.substance as string] ?? FLASK.water;
  const titrantColour = params.titrant === "acid" ? theme.sci["acid"] : theme.sci["base"];

  /* ---- the room and the bench ---- */
  depthWash(ctx, width, height, theme);
  const benchY = height * 0.855;
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  /* ---- the stand the burette is clamped to ---- */
  const flaskW = Math.min(width * 0.185, height * 0.325);
  const flaskH = flaskW * 1.16;
  const flaskX = width * 0.115;
  const flaskY = benchY - flaskH;
  const cx = flaskX + flaskW / 2;

  const standX = width * 0.062;
  clampStand(ctx, standX, benchY, height * 0.84, M * 0.155);

  // The clamp arm goes on behind the glass; only its jaw wraps in front.
  const jawY = height * 0.16;
  metal(ctx, standX, jawY, cx - standX + M * 0.02, M * 0.028, theme.sci["mass"],
    { radius: 3 });

  /* ---- the burette ---- */
  const tubeW = Math.max(12, M * 0.052);
  const barrelTop = height * 0.06;
  const barrelBot = height * 0.335;
  const tipBot = height * 0.44;
  const drained = clamp(state.added / CURVE_MAX, 0, 1);
  const tipY = burette(ctx, cx, barrelTop, barrelBot, tubeW, tipBot,
    drained, titrantColour, theme);

  // The jaw wraps the tube, so the burette is held rather than floating.
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["mass"], 0.95);
  ctx.lineWidth = Math.max(3, M * 0.011);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, jawY + M * 0.014, tubeW * 0.8, Math.PI * 1.72, Math.PI * 1.28);
  ctx.stroke();
  ctx.restore();

  /* ---- the flask, its indicator colour, and what is dissolved in it ---- */
  contactShadow(ctx, cx, benchY + 1, flaskW * 0.42, 0);
  const level = clamp(state.totalVolume / (CURVE_MAX + 5e-5), 0.18, 0.62);
  softShadow(ctx, () => {
    flaskPath(ctx, flaskX, flaskY, flaskW, flaskH);
    ctx.fillStyle = hexA(theme.surface, dark ? 0.42 : 0.82);
    ctx.fill();
  }, { blur: 18, dy: 8, alpha: dark ? 0.5 : 0.26 });
  flaskGlass(ctx, flaskX, flaskY, flaskW, flaskH, theme, {
    level, color: tint, t: time, bubbles: 0,
  });
  ctx.save();
  flaskPath(ctx, flaskX, flaskY, flaskW, flaskH);
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.6 : 0.42);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // Ions, drawn on a log scale inside the body of the liquid.
  const surfaceY = flaskY + flaskH * (1 - level);
  if (overlays.ions && band !== "K-2") {
    const nH = Math.round(clamp(((14 - state.ph) / 14) * 24, 0, 24));
    const nOH = Math.round(clamp((state.ph / 14) * 24, 0, 24));
    const rIon = Math.max(2.4, M * 0.011);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(flaskX + flaskW * 0.04, surfaceY + rIon * 2);
    ctx.lineTo(flaskX + flaskW * 0.96, surfaceY + rIon * 2);
    ctx.lineTo(flaskX + flaskW * 0.9, benchY - 2);
    ctx.lineTo(flaskX + flaskW * 0.1, benchY - 2);
    ctx.closePath();
    ctx.clip();
    for (let i = 0; i < nH + nOH; i++) {
      const isH = i < nH;
      const k = isH ? i : i - nH;
      const drift = (jitter(k, isH ? 2 : 4) + state.swirl * (isH ? 1 : 0.8)) % 1;
      const ix = flaskX + flaskW * (0.12 + jitter(k, isH ? 1 : 3) * 0.76);
      const iy = surfaceY + rIon * 3 + drift * Math.max(6, benchY - surfaceY - rIon * 6);
      sphere(ctx, ix, iy, rIon, isH ? theme.sci["acid"] : theme.sci["base"]);
    }
    ctx.restore();
  }

  /* ---- the drop on its way down ---- */
  if (state.added > 0) {
    const fall = state.dropPhase;
    const dy = tipY + fall * (surfaceY - tipY);
    const squash = 1 + fall * 0.45;
    ctx.save();
    ctx.translate(cx, dy);
    ctx.scale(1 / squash, squash);
    sphere(ctx, 0, 0, Math.max(2.6, M * 0.011), titrantColour, { glow: 0.7 });
    ctx.restore();
    // The ripple where the last drop landed.
    const ring = (fall + 0.9) % 1;
    ctx.save();
    ctx.globalAlpha = 0.4 * (1 - ring);
    ctx.strokeStyle = hexA(light, 0.9);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, surfaceY, flaskW * 0.1 + ring * flaskW * 0.3,
      (flaskW * 0.1 + ring * flaskW * 0.3) * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* ---- a spare sample of the same solution, standing on the bench ---- */
  const sbW = Math.min(width * 0.075, height * 0.13);
  const sbH = sbW * 1.15;
  const sbX = width * 0.335;
  const sbY = benchY - sbH;
  contactShadow(ctx, sbX + sbW / 2, benchY + 1, sbW * 0.5, 0);
  softShadow(ctx, () => {
    ctx.fillStyle = hexA(theme.surface, dark ? 0.4 : 0.8);
    roundRect(ctx, sbX, sbY, sbW, sbH, sbW * 0.1);
    ctx.fill();
  }, { blur: 12, dy: 6, alpha: dark ? 0.45 : 0.22 });
  beaker(ctx, sbX, sbY, sbW, sbH, theme, { level: 0.52, color: tint, t: time });
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.55 : 0.36);
  ctx.lineWidth = 1.4;
  roundRect(ctx, sbX, sbY, sbW, sbH, sbW * 0.1);
  ctx.stroke();
  ctx.restore();

  /* ---- callouts, in the clear strip between glassware and console ---- */
  const calloutX = width * 0.315;
  callout(ctx, cx, jawY + M * 0.11, calloutX, height * 0.14,
    `${(params.titrantConc as number).toFixed(2)} M ${params.titrant === "acid" ? "HCl" : "NaOH"}`, theme,
    { sub: "in the burette", side: "right", accent: titrantColour });
  callout(ctx, cx + flaskW * 0.18, surfaceY + (benchY - surfaceY) * 0.45,
    calloutX, height * 0.55, contents.label, theme,
    { sub: `${(state.totalVolume * 1e6).toFixed(0)} mL in the flask`, side: "right", accent: tint });

  /* ---- the bench-top console ---- */
  const conX = width * 0.475;
  const conY = height * 0.075;
  const con = consoleFace(ctx, conX, conY, width * 0.5, benchY - conY, theme);

  const rowGap = con.h * 0.035;
  const chartH = con.h * 0.5;
  const chartY = con.y + con.h * 0.09;
  const rampY = chartY + chartH + rowGap * 2.2;
  const rampH = Math.max(14, con.h * 0.075);
  const readY = rampY + rampH + con.h * 0.11;

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(light, 0.72);
  ctx.font = `600 ${Math.max(10, M * 0.023)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.fillText("TITRATION CURVE", con.x, con.y + con.h * 0.03);
  ctx.textAlign = "right";
  ctx.fillStyle = hexA(light, 0.55);
  ctx.font = `500 ${Math.max(9, M * 0.021)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText(`${(state.added * 1e6).toFixed(1)} mL added`, con.x + con.w, con.y + con.h * 0.03);
  ctx.restore();

  /* ---- chart ---- */
  const chartX = con.x + M * 0.055;
  const chartW = con.w - M * 0.055;
  const curveX = (v: number) => chartX + (v / CURVE_MAX) * chartW;
  const curveY = (p: number) => chartY + chartH - (clamp(p, 0, 14) / 14) * chartH;

  ctx.save();
  ctx.strokeStyle = hexA(light, 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let p = 0; p <= 14; p += 2) {
    ctx.moveTo(chartX, curveY(p));
    ctx.lineTo(chartX + chartW, curveY(p));
  }
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.sci["neutral"], 0.85);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(chartX, curveY(7));
  ctx.lineTo(chartX + chartW, curveY(7));
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = hexA(light, 0.6);
  ctx.font = `600 ${Math.max(9, M * 0.02)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  for (const p of [0, 7, 14]) ctx.fillText(String(p), chartX - 6, curveY(p));
  ctx.save();
  ctx.translate(con.x + M * 0.012, chartY + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = hexA(light, 0.5);
  ctx.font = `600 ${Math.max(9, M * 0.021)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.fillText("pH", 0, 0);
  ctx.restore();
  ctx.restore();

  if (overlays.equivalence && state.equivalence > 0 && state.equivalence <= CURVE_MAX) {
    const ex = curveX(state.equivalence);
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["neutral"], 0.8);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, chartY);
    ctx.lineTo(ex, chartY + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = theme.sci["neutral"];
    ctx.font = `600 ${Math.max(9, M * 0.02)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillText("equivalence", ex, chartY + 3);
    ctx.restore();
  }

  const lastIdx = Math.min(CURVE_N - 1, Math.round((state.maxAdded / CURVE_MAX) * (CURVE_N - 1)));
  if (lastIdx > 0) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.9);
    ctx.shadowColor = hexA(theme.accent, 0.8);
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= lastIdx; i++) {
      const v = (i / (CURVE_N - 1)) * CURVE_MAX;
      const sx = curveX(v);
      const sy = curveY(state.curve[i]);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }
  sphere(ctx, curveX(state.added), curveY(state.ph), Math.max(4.5, M * 0.014), tint, { glow: 0.9 });

  /* ---- the universal-indicator chart, in the colours of the dye ---- */
  const SEG = 56;
  ctx.save();
  roundRect(ctx, chartX, rampY, chartW, rampH, rampH * 0.28);
  ctx.clip();
  for (let i = 0; i < SEG; i++) {
    ctx.fillStyle = indicatorColor((i / (SEG - 1)) * 14, theme);
    ctx.fillRect(chartX + (i / SEG) * chartW, rampY, chartW / SEG + 1, rampH);
  }
  const gloss = ctx.createLinearGradient(0, rampY, 0, rampY + rampH);
  gloss.addColorStop(0, hexA(light, 0.3));
  gloss.addColorStop(0.5, hexA(light, 0));
  ctx.fillStyle = gloss;
  ctx.fillRect(chartX, rampY, chartW, rampH);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(light, 0.25);
  ctx.lineWidth = 1;
  roundRect(ctx, chartX, rampY, chartW, rampH, rampH * 0.28);
  ctx.stroke();
  // The pointer riding the scale at the pH the solver just returned.
  const markX = chartX + (clamp(state.ph, 0, 14) / 14) * chartW;
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(markX, rampY - 1);
  ctx.lineTo(markX - rampH * 0.4, rampY - rampH * 0.62);
  ctx.lineTo(markX + rampH * 0.4, rampY - rampH * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.max(9, M * 0.02)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(theme.sci["acid"], 0.95);
  ctx.fillText("0  acid", chartX, rampY + rampH + 5);
  ctx.textAlign = "center";
  ctx.fillStyle = hexA(theme.sci["neutral"], 0.95);
  ctx.fillText("7  neutral", chartX + chartW / 2, rampY + rampH + 5);
  ctx.textAlign = "right";
  ctx.fillStyle = hexA(theme.sci["base"], 0.95);
  ctx.fillText("14  base", chartX + chartW, rampY + rampH + 5);
  ctx.restore();

  /* ---- the meter readout ---- */
  const readH = con.y + con.h - readY;
  ctx.save();
  ctx.fillStyle = hexA(darkOf(theme), 0.75);
  roundRect(ctx, con.x, readY, con.w, readH, readH * 0.16);
  ctx.fill();
  ctx.strokeStyle = hexA(tint, 0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = tint;
  ctx.shadowColor = hexA(tint, 0.75);
  ctx.shadowBlur = 18;
  ctx.font = `700 ${Math.max(24, readH * 0.6)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText(`pH ${state.ph.toFixed(band === "9-12" ? 2 : 1)}`,
    con.x + con.w * 0.045, readY + readH * 0.5);
  ctx.shadowBlur = 0;
  ctx.textAlign = "right";
  ctx.fillStyle = hexA(light, 0.72);
  ctx.font = `600 ${Math.max(10, M * 0.023)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.fillText(contents.label, con.x + con.w * 0.96, readY + readH * 0.34);
  ctx.fillStyle = hexA(light, 0.45);
  ctx.font = `500 ${Math.max(9, M * 0.02)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.fillText(contents.note, con.x + con.w * 0.96, readY + readH * 0.66);
  ctx.restore();

  vignette(ctx, width, height, 0.16);
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
        { value: "acid", label: "Acid — HCl (strong)" },
        { value: "base", label: "Base — NaOH (strong)" },
      ],
      default: "base",
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
