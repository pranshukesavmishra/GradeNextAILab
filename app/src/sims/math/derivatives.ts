import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { disc, label } from "@ui/draw";

/**
 * Limits & Derivatives Visualizer — Grades 11-12.
 *
 * A secant line pinned at one point and reaching across a gap h, with the true
 * tangent drawn beside it. Shrink h and the two lines converge on screen while
 * the difference quotient converges numerically underneath — the limit is shown
 * happening, not asserted.
 *
 * Every tangent slope here is the analytic derivative, differentiated by hand
 * per function family. Nothing in this sim estimates a derivative numerically,
 * so "how close is the secant?" is a question with an exact answer.
 */

export type Fn = "square" | "cubic" | "sine" | "exp";

const X_MIN = -3;
const X_MAX = 3;

/* ------------------------------------------------------------------ *
 * The functions and their exact derivatives
 * ------------------------------------------------------------------ */

export function f(fn: Fn, x: number): number {
  switch (fn) {
    case "square": return x * x;
    case "cubic": return (x * x * x) / 3 - x;
    case "sine": return Math.sin(x);
    case "exp": return Math.exp(x);
  }
}

/** The analytic derivative — differentiated symbolically, never estimated. */
export function df(fn: Fn, x: number): number {
  switch (fn) {
    case "square": return 2 * x;              // d/dx x²      = 2x
    case "cubic": return x * x - 1;           // d/dx x³/3 − x = x² − 1
    case "sine": return Math.cos(x);          // d/dx sin x    = cos x
    case "exp": return Math.exp(x);           // d/dx eˣ       = eˣ
  }
}

export const FN_LABEL: Record<Fn, string> = {
  square: "f(x) = x²",
  cubic: "f(x) = x³/3 − x",
  sine: "f(x) = sin x",
  exp: "f(x) = eˣ",
};

export const DF_LABEL: Record<Fn, string> = {
  square: "f ′(x) = 2x",
  cubic: "f ′(x) = x² − 1",
  sine: "f ′(x) = cos x",
  exp: "f ′(x) = eˣ",
};

/** Where the derivative is exactly zero, inside the graphed domain. */
export const CRITICAL: Record<Fn, number[]> = {
  square: [0],
  cubic: [-1, 1],
  sine: [-Math.PI / 2, Math.PI / 2],
  exp: [],
};

/** The forward (or backward) difference quotient — the thing h controls. */
export function secantSlope(fn: Fn, x: number, h: number): number {
  if (h === 0) return df(fn, x);
  return (f(fn, x + h) - f(fn, x)) / h;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  fn: Fn;
  x: number;
  dir: number;
  /** Mirror of the point parameter, so only a slider move re-seats the point. */
  seed: number;
  /** The interval of x the point has swept, which is what has been traced. */
  lo: number;
  hi: number;
  /** Critical points the student has actually visited with a small h. */
  zeros: number[];
}

const SWEEP_SPEED = 1.1; // graph units per second
/** How flat the tangent must read before a point counts as a zero. */
const ZERO_TOL = 0.02;
/** And how small the gap must be, so the finding is a limit, not a guess. */
const ZERO_H = 0.25;
/**
 * Slack on the h thresholds in challenges. The slider stores log₁₀ h, and
 * 10**-2 lands a few ulps above 0.01, so an exact comparison would deny a star
 * to a student sitting precisely on the mark.
 */
const H_SLACK = 1e-9;

/**
 * The gap, signed by the approach direction.
 *
 * The slider holds log₁₀ h rather than h: the interesting part of h → 0 is the
 * last few orders of magnitude, and a linear slider spends all its travel on
 * the part where nothing happens.
 */
function signedH(params: ParamValues): number {
  const h = Math.pow(10, params.hExp as number);
  return params.fromLeft ? -h : h;
}

function fresh(params: ParamValues): State {
  const fn = params.fn as Fn;
  const x = params.x0 as number;
  return { fn, x, dir: 1, seed: x, lo: x, hi: x, zeros: [] };
}

/** Record a critical point once the student is genuinely sitting on one. */
function noteZero(state: State, params: ParamValues): State {
  if (Math.abs(df(state.fn, state.x)) > ZERO_TOL) return state;
  if (Math.abs(signedH(params)) > ZERO_H) return state;
  if (state.zeros.some((z) => Math.abs(z - state.x) < 0.25)) return state;
  return { ...state, zeros: [...state.zeros, state.x].sort((a, b) => a - b) };
}

const model: SimModel<State> = {
  init(params) {
    return fresh(params);
  },

  applyParams(state, params) {
    const fn = params.fn as Fn;
    // A new function means a new derivative; the old trace would be a lie.
    if (fn !== state.fn) return fresh(params);

    const seed = params.x0 as number;
    let next = state;
    if (seed !== state.seed) {
      next = {
        ...state, x: seed, seed,
        lo: Math.min(state.lo, seed), hi: Math.max(state.hi, seed),
      };
    }
    // Parking on a flat point while paused should still count.
    return noteZero(next, params);
  },

  step(state, dt, params) {
    if (dt === 0) return noteZero(state, params);
    let x = state.x + state.dir * SWEEP_SPEED * dt;
    let dir = state.dir;
    if (x > X_MAX) { x = X_MAX; dir = -1; }
    if (x < X_MIN) { x = X_MIN; dir = 1; }
    const swept: State = {
      ...state, x, dir,
      lo: Math.min(state.lo, x), hi: Math.max(state.hi, x),
    };
    return noteZero(swept, params);
  },

  readouts(state, params) {
    const h = signedH(params);
    const fx = f(state.fn, state.x);
    const sec = secantSlope(state.fn, state.x, h);
    const tan = df(state.fn, state.x);
    return [
      { key: "x", label: "x", quantity: q(state.x, "ratio"), semantic: "distance", graphable: true },
      { key: "fx", label: "f(x)", quantity: q(fx, "ratio"), semantic: "energy-potential", graphable: true },
      { key: "h", label: "Gap h", quantity: q(h, "ratio"), semantic: "mass", graphable: true },
      {
        key: "secant", label: "Secant slope", quantity: q(sec, "ratio"),
        semantic: "velocity", graphable: true,
      },
      {
        key: "tangent", label: "Tangent slope  f ′(x)", quantity: q(tan, "ratio"),
        semantic: "force", graphable: true,
      },
      {
        key: "error", label: "Secant − tangent", quantity: q(Math.abs(sec - tan), "ratio"),
        semantic: "acceleration", graphable: true,
      },
      {
        key: "zerosFound", label: "Flat points found",
        quantity: q(state.zeros.length, "count"), semantic: "energy-kinetic",
      },
    ];
  },

  facts(state, params) {
    const h = signedH(params);
    const sec = secantSlope(state.fn, state.x, h);
    const tan = df(state.fn, state.x);
    const expected = CRITICAL[state.fn].length;
    return {
      fn: state.fn,
      x: state.x,
      fx: f(state.fn, state.x),
      h,
      absH: Math.abs(h),
      secant: sec,
      tangent: tan,
      error: Math.abs(sec - tan),
      sweptSpan: state.hi - state.lo,
      zerosFound: state.zeros.length,
      zerosExpected: expected,
      allZerosFound: expected > 0 && state.zeros.length >= expected,
      onFlatPoint: Math.abs(tan) <= ZERO_TOL,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

function windowFor(fn: Fn, deriv: boolean): { lo: number; hi: number } {
  let lo = 0;
  let hi = 0;
  for (let i = 0; i <= 96; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / 96;
    const y = deriv ? df(fn, x) : f(fn, x);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  const pad = Math.max(0.4, (hi - lo) * 0.12);
  return { lo: lo - pad, hi: hi + pad };
}

function fmt(v: number, places = 4): string {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1e5) return v.toExponential(2);
  const r = Number(v.toFixed(places));
  return String(Object.is(r, -0) ? 0 : r);
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const fn = state.fn;
  const h = signedH(params);
  const x = state.x;
  const fx = f(fn, x);
  const fxh = f(fn, x + h);
  const sec = secantSlope(fn, x, h);
  const tan = df(fn, x);

  const colF = theme.accent;
  const colSecant = theme.sci["velocity"];
  const colTangent = theme.sci["force"];
  const colDeriv = theme.sci["acceleration"];
  const colZero = theme.sci["energy-kinetic"];

  const marginL = 40;
  const marginR = 12;
  const plotW = Math.max(40, width - marginL - marginR);
  const px = (v: number) => marginL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW;

  const showDeriv = overlays.derivative;
  const topT = 26;
  const topB = showDeriv ? height * 0.58 : height - 40;
  const botT = height * 0.64;
  const botB = height - 34;

  const wf = windowFor(fn, false);
  const wd = windowFor(fn, true);
  const pyF = (v: number) => topB - ((v - wf.lo) / (wf.hi - wf.lo)) * (topB - topT);
  const pyD = (v: number) => botB - ((v - wd.lo) / (wd.hi - wd.lo)) * (botB - botT);

  const axes = (yOf: (v: number) => number, lo: number, hi: number, top: number, bottom: number) => {
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let v = Math.ceil(X_MIN); v <= X_MAX; v++) {
      const sx = Math.round(px(v)) + 0.5;
      ctx.moveTo(sx, top); ctx.lineTo(sx, bottom);
    }
    ctx.stroke();
    ctx.strokeStyle = theme.ink;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (lo < 0 && hi > 0) {
      const zy = Math.round(yOf(0)) + 0.5;
      ctx.moveTo(marginL, zy); ctx.lineTo(width - marginR, zy);
    }
    const ax = Math.round(px(0)) + 0.5;
    ctx.moveTo(ax, top); ctx.lineTo(ax, bottom);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const step = hi - lo > 12 ? 5 : hi - lo > 5 ? 2 : 1;
    for (let v = Math.ceil(lo); v <= hi; v += step) {
      const yy = yOf(v);
      if (yy < top || yy > bottom) continue;
      ctx.fillText(String(v), marginL - 4, yy);
    }
    ctx.restore();
  };

  const curve = (
    g: (v: number) => number, yOf: (v: number) => number, color: string,
    from: number, to: number, wdt: number, alpha = 1,
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = wdt;
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const steps = 360;
    for (let i = 0; i <= steps; i++) {
      const v = from + ((to - from) * i) / steps;
      const sy = yOf(g(v));
      if (i === 0) ctx.moveTo(px(v), sy); else ctx.lineTo(px(v), sy);
    }
    ctx.stroke();
    ctx.restore();
  };

  /* --- top panel: the function, the secant and the tangent --------- */
  axes(pyF, wf.lo, wf.hi, topT, topB);
  curve((v) => f(fn, v), pyF, colF, X_MIN, X_MAX, 2.6);

  const pX = px(x);
  const pY = pyF(fx);
  const qX = px(x + h);
  const qY = pyF(fxh);

  // The rise-over-run triangle: what the difference quotient actually measures.
  if (overlays.riseRun && Math.abs(h) > 1e-4) {
    ctx.save();
    ctx.strokeStyle = colSecant;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pX, pY); ctx.lineTo(qX, pY); ctx.lineTo(qX, qY);
    ctx.stroke();
    ctx.restore();
    label(ctx, `h = ${fmt(h, 4)}`, (pX + qX) / 2, pY + 12, theme, {
      align: "center", size: 10, color: colSecant,
    });
  }

  // The tangent, drawn full width so its slope is unmistakable.
  ctx.save();
  ctx.strokeStyle = colTangent;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(marginL, pyF(fx + tan * (X_MIN - x)));
  ctx.lineTo(width - marginR, pyF(fx + tan * (X_MAX - x)));
  ctx.stroke();
  ctx.restore();

  // The secant, dashed, through both points.
  ctx.save();
  ctx.strokeStyle = colSecant;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(marginL, pyF(fx + sec * (X_MIN - x)));
  ctx.lineTo(width - marginR, pyF(fx + sec * (X_MAX - x)));
  ctx.stroke();
  ctx.restore();

  disc(ctx, qX, qY, 5, colSecant, { stroke: theme.surface, lineWidth: 2 });
  disc(ctx, pX, pY, 6.5, colF, { stroke: theme.surface, lineWidth: 2 });

  label(ctx, FN_LABEL[fn], marginL + 4, topT + 4, theme, { size: 12, color: colF });
  label(ctx, `secant ${fmt(sec, 4)}`, width - marginR - 4, topT + 4, theme, {
    align: "right", size: 12, color: colSecant,
  });
  label(ctx, `tangent ${fmt(tan, 4)}`, width - marginR - 4, topT + 21, theme, {
    align: "right", size: 12, color: colTangent,
  });

  // The difference quotient, spelled out with this frame's numbers.
  const quotient = `( f(${fmt(x, 2)} + ${fmt(h, 4)}) − f(${fmt(x, 2)}) ) / ${fmt(h, 4)} = ${fmt(sec, 5)}`;
  label(ctx, quotient, marginL + 4, 12, theme, { size: 11, color: theme.inkSoft });
  label(ctx, `error |secant − f ′| = ${fmt(Math.abs(sec - tan), 6)}`, width - marginR - 4, 12, theme, {
    align: "right", size: 11, color: colDeriv,
  });

  /* --- bottom panel: the derivative, revealed by the sweep --------- */
  if (!showDeriv) return;

  axes(pyD, wd.lo, wd.hi, botT, botB);
  // The whole derivative, faint: where the sweep has not been yet.
  curve((v) => df(fn, v), pyD, colDeriv, X_MIN, X_MAX, 1.5, 0.22);
  // And the part the point has actually swept, solid.
  if (state.hi - state.lo > 1e-6) {
    curve((v) => df(fn, v), pyD, colDeriv, state.lo, state.hi, 2.6, 1);
  }

  // Zero line and the flat points the student has landed on.
  ctx.save();
  ctx.strokeStyle = colZero;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginL, pyD(0));
  ctx.lineTo(width - marginR, pyD(0));
  ctx.stroke();
  ctx.restore();

  for (const z of state.zeros) {
    disc(ctx, px(z), pyD(0), 5.5, colZero, { stroke: theme.surface, lineWidth: 2 });
    // The same x on the curve above, so the link is unmissable.
    disc(ctx, px(z), pyF(f(fn, z)), 4, colZero, { stroke: theme.surface, lineWidth: 1.5 });
  }

  disc(ctx, pX, pyD(tan), 6, colTangent, { stroke: theme.surface, lineWidth: 2 });
  label(ctx, DF_LABEL[fn], marginL + 4, botT + 4, theme, { size: 12, color: colDeriv });
  const expected = CRITICAL[fn].length;
  if (expected > 0) {
    label(ctx, `flat points: ${state.zeros.length} of ${expected}`, width - marginR - 4, botT + 4, theme,
      { align: "right", size: 11, color: colZero });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const derivativesSim: SimManifest<State> = {
  id: "math.derivatives",
  title: "Limits & Derivatives Visualizer",
  tagline: "Shrink the gap and watch a secant line become a tangent, while the derivative draws itself underneath.",
  subject: "math",
  bands: ["9-12"],
  grades: [11, 12],
  standards: {
    ccssMath: ["HSF.IF.B.6", "HSF.IF.C.7", "HSF.BF.A.1", "HSF.LE.A.1"],
  },
  learningGoals: [
    "Read the difference quotient as the slope of a secant line between two real points.",
    "Explain the derivative as the limit the secant slope approaches as h shrinks to zero.",
    "Connect the sign and the zeros of f ′ to the shape of f.",
  ],
  misconceptions: [
    "The tangent line is the line that touches a curve at exactly one point",
    "The derivative is the same thing as the slope between two nearby points",
    "h = 0 can simply be substituted into the difference quotient",
  ],
  interactionHint: "Shrink h and watch the dashed secant swing onto the solid tangent.",
  params: {
    fn: {
      type: "option", label: "Function",
      options: [
        { value: "square", label: "x²" },
        { value: "cubic", label: "x³/3 − x" },
        { value: "sine", label: "sin x" },
        { value: "exp", label: "eˣ" },
      ],
      default: "square",
    },
    x0: {
      type: "number", label: "Point x", kind: "ratio",
      min: X_MIN, max: X_MAX, step: 0.01, default: 1,
      help: "Press play and the point sweeps, drawing the derivative below.",
    },
    hExp: {
      type: "number", label: "Gap h  (h = 10ᵉ)", kind: "ratio",
      min: -6, max: 0.3, step: 0.1, default: 0,
      marks: [
        { value: 0, label: "1" },
        { value: -1, label: "0.1" },
        { value: -2, label: "0.01" },
        { value: -4, label: "10⁻⁴" },
      ],
      help: "The distance to the second point. It can get as small as you like, but never 0.",
    },
    fromLeft: {
      type: "boolean", label: "Take h from the left", default: false,
      help: "Approach from the other side. The limit had better be the same.",
    },
  },
  overlays: [
    { key: "derivative", label: "Derivative graph", default: true },
    { key: "riseRun", label: "Rise and run", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "h-to-zero",
      title: "What happens as h gets tiny?",
      question: "The secant needs two points. The tangent has one. How do you get from one to the other?",
      bands: ["9-12"],
      minutes: 25,
      standards: ["HSF.IF.B.6"],
      setup: { fn: "square", x0: 1, hExp: 0, fromLeft: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the limit",
          instruction: "The point sits at x = 1 on y = x². Predict the secant slope as h shrinks towards 0.",
          predict: {
            prompt: "As h shrinks towards 0 at x = 1 on y = x², the secant slope heads towards what?",
            options: ["0", "1", "2", "It grows without limit"],
            correct: 2,
            reveal: "It heads to 2. The difference quotient simplifies to 2 + h exactly, so the limit as h → 0 is 2.",
          },
        },
        {
          id: "shrink",
          phase: "measure",
          title: "Shrink the gap",
          instruction: "Set h to 1, then 0.1, then 0.01, then 0.001, recording the secant slope each time.",
          requireData: 4,
          hints: [
            "Watch the dashed secant swing onto the solid tangent.",
            "At h = 0.1 the secant slope should read 2.1.",
          ],
        },
        {
          id: "close",
          phase: "analyze",
          title: "Get inside a thousandth",
          instruction: "Shrink h until the secant and tangent slopes differ by no more than 0.001.",
          check: {
            describe: "Secant within 0.001 of the tangent",
            test: (v) => (v.facts.error as number) <= 0.001 + H_SLACK,
          },
          hints: ["The error for x² is exactly h, so h = 0.001 does it."],
        },
        {
          id: "other-side",
          phase: "analyze",
          title: "Come from the left",
          instruction: "Turn on 'Take h from the left'. The slope approaches the same 2 from below.",
          check: {
            describe: "Approaching from the left",
            test: (v) => v.params.fromLeft === true,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why h is never 0",
          instruction: "Write what the derivative is, and why h can approach 0 but never reach it.",
          write: {
            prompt: "Why can h get as small as you like but never equal 0?",
            placeholder: "The difference quotient divides by h, so ...",
          },
        },
      ],
    },
    {
      id: "where-derivative-zero",
      title: "Where is the derivative zero?",
      question: "What is happening to the curve exactly where its derivative crosses zero?",
      bands: ["9-12"],
      minutes: 25,
      standards: ["HSF.IF.C.7"],
      setup: { fn: "cubic", x0: -3, hExp: -1.3, fromLeft: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before sweeping",
          instruction: "The function is x³/3 − x. Predict how many points have a horizontal tangent.",
          predict: {
            prompt: "How many points between −3 and 3 have f ′(x) = 0 for f(x) = x³/3 − x?",
            options: ["None", "One", "Two", "Three"],
            correct: 2,
            reveal: "Two. f ′(x) = x² − 1, which is zero at x = −1 and x = 1 — the local maximum and the local minimum.",
          },
        },
        {
          id: "sweep",
          phase: "measure",
          title: "Sweep the whole domain",
          instruction: "Press play and let the point cross from one end to the other, drawing the derivative.",
          check: {
            describe: "The whole domain has been swept",
            test: (v) => (v.facts.sweptSpan as number) >= 5.5,
          },
        },
        {
          id: "land",
          phase: "measure",
          title: "Land on both flat points",
          instruction: "Pause and park the point on each flat spot with h below 0.25.",
          check: {
            describe: "Both flat points found",
            test: (v) => v.facts.allZerosFound === true,
          },
          hints: [
            "Look for where the lower graph crosses the dashed zero line.",
            "The tangent above goes horizontal at exactly those two x values.",
          ],
        },
        {
          id: "sign",
          phase: "analyze",
          title: "Read the sign",
          instruction: "Between −1 and 1 the derivative is negative. Check that the curve above is falling there.",
          check: {
            describe: "The point is between the two flat points and the slope is negative",
            test: (v) =>
              (v.facts.tangent as number) < -0.05 &&
              Math.abs(v.facts.x as number) < 1,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Connect the two graphs",
          instruction: "Write what f is doing wherever f ′ is positive, negative, and zero.",
          write: {
            prompt: "What does the sign of f ′ tell you about f?",
            placeholder: "When f ′ is positive the curve ... When f ′ is zero the curve ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-flat-points",
      title: "Find every flat point",
      brief: "Locate every place where the tangent goes horizontal.",
      bands: ["9-12"],
      setup: { fn: "cubic", x0: -3, hExp: -1, fromLeft: false },
      goal: {
        describe: "Every point with f ′(x) = 0 has been visited",
        test: (v) => v.facts.allZerosFound === true,
      },
      stars: {
        two: {
          describe: "Found with a gap of 0.05 or less",
          test: (v) => v.facts.allZerosFound === true && (v.facts.absH as number) <= 0.05 + H_SLACK,
        },
        three: {
          describe: "Found with a gap of 0.01 or less",
          test: (v) => v.facts.allZerosFound === true && (v.facts.absH as number) <= 0.01 + H_SLACK,
        },
      },
      hints: [
        "The lower graph is the derivative. Its crossings of zero are what you are hunting.",
        "For x³/3 − x the derivative is x² − 1, so look near x = −1 and x = 1.",
      ],
    },
    {
      id: "squeeze-the-error",
      title: "Squeeze the error",
      brief: "Make the secant slope agree with the true derivative to four decimal places.",
      bands: ["9-12"],
      setup: { fn: "exp", x0: 1, hExp: 0, fromLeft: false },
      goal: {
        describe: "Secant within 0.01 of the tangent",
        test: (v) => (v.facts.error as number) <= 0.01,
      },
      stars: {
        two: {
          describe: "Within 0.001",
          test: (v) => (v.facts.error as number) <= 0.001,
        },
        three: {
          describe: "Within 0.0001",
          test: (v) => (v.facts.error as number) <= 0.0001,
        },
      },
      hints: [
        "The error shrinks roughly in proportion to h.",
        "For eˣ at x = 1 the error is about 1.36 h, so h near 10⁻⁵ clears three stars.",
      ],
    },
  ],
};
