import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, roundRect } from "@ui/draw";

/**
 * Fraction Lab — Grades 2-7.
 *
 * Two fractions are shown at the same instant in three linked representations:
 * partitioned bars, partitioned circles, and a shared number line. Changing a
 * numerator moves all three together, which is the whole point — a fraction is
 * one number with many faces, not three unrelated pictures.
 *
 * Confronts the two most durable fraction misconceptions: that a bigger
 * denominator means a bigger fraction, and that you may add numerators and
 * denominators straight across.
 */

/* ------------------------------------------------------------------ *
 * Exact rational arithmetic — no floating point anywhere in the answer
 * ------------------------------------------------------------------ */

export interface Frac {
  /** Numerator, carrying the sign. */
  n: number;
  /** Denominator, always positive. */
  d: number;
}

/** Euclid's algorithm. Returns 1 for gcd(0, 0) so callers can always divide. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x === 0 ? 1 : x;
}

export function lcm(a: number, b: number): number {
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}

/** Lowest terms, with the sign pushed onto the numerator. */
export function reduce(f: Frac): Frac {
  const sign = f.d < 0 ? -1 : 1;
  const n = f.n * sign;
  const d = f.d * sign;
  if (n === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function addFractions(a: Frac, b: Frac): Frac {
  return reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}

export function subFractions(a: Frac, b: Frac): Frac {
  return reduce({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
}

export function mulFractions(a: Frac, b: Frac): Frac {
  return reduce({ n: a.n * b.n, d: a.d * b.d });
}

export function fracValue(f: Frac): number {
  return f.d === 0 ? 0 : f.n / f.d;
}

/** Cross-multiplication equality: exact, so 3/6 and 1/2 always agree. */
export function equivalent(a: Frac, b: Frac): boolean {
  return a.n * b.d === b.n * a.d;
}

/** −1, 0 or +1 by exact comparison (denominators are positive). */
export function compareFractions(a: Frac, b: Frac): number {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function fracText(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}

const OP_SYMBOL: Record<string, string> = {
  compare: "?",
  add: "+",
  subtract: "−",
  multiply: "×",
};

/** The exact answer for the chosen operation, in lowest terms. */
export function operate(a: Frac, b: Frac, op: string): Frac {
  switch (op) {
    case "add": return addFractions(a, b);
    case "subtract": return subFractions(a, b);
    case "multiply": return mulFractions(a, b);
    default: return compareFractions(a, b) >= 0 ? reduce(a) : reduce(b);
  }
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  a: Frac;
  b: Frac;
  /** Exact result of the selected operation, already in lowest terms. */
  result: Frac;
  /** The unreduced result, so students can see 8/12 before 2/3. */
  raw: Frac;
  op: string;
  /** Least common denominator of the two fractions. */
  lcd: number;
  same: boolean;
  /** Seconds the two fractions have been equal, used for a calm pulse. */
  glow: number;
}

function readFracs(params: ParamValues): { a: Frac; b: Frac; op: string } {
  return {
    a: { n: params.n1 as number, d: Math.max(1, params.d1 as number) },
    b: { n: params.n2 as number, d: Math.max(1, params.d2 as number) },
    op: params.op as string,
  };
}

/** The unreduced result — the form a student writes down before simplifying. */
function rawResult(a: Frac, b: Frac, op: string): Frac {
  switch (op) {
    case "add": return { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
    case "subtract": return { n: a.n * b.d - b.n * a.d, d: a.d * b.d };
    case "multiply": return { n: a.n * b.n, d: a.d * b.d };
    default: return compareFractions(a, b) >= 0 ? a : b;
  }
}

function build(params: ParamValues, glow: number): State {
  const { a, b, op } = readFracs(params);
  return {
    a,
    b,
    result: operate(a, b, op),
    raw: rawResult(a, b, op),
    op,
    lcd: lcm(a.d, b.d),
    same: equivalent(a, b),
    glow,
  };
}

const model: SimModel<State> = {
  init(params) {
    return build(params, 0);
  },

  applyParams(state, params) {
    // Every control change rebuilds the exact arithmetic immediately, so all
    // three representations can never disagree with each other.
    const next = build(params, state.glow);
    return next.same === state.same ? next : { ...next, glow: 0 };
  },

  step(state, dt) {
    // The only thing that evolves in time is the equality highlight.
    const glow = state.same ? Math.min(state.glow + dt, 4) : 0;
    return glow === state.glow ? state : { ...state, glow };
  },

  readouts(state) {
    const av = fracValue(state.a);
    const bv = fracValue(state.b);
    const rv = fracValue(state.result);
    return [
      {
        key: "a", label: `First fraction ${fracText(state.a)}`,
        quantity: q(av, "ratio"), semantic: "velocity", graphable: true,
      },
      {
        key: "b", label: `Second fraction ${fracText(state.b)}`,
        quantity: q(bv, "ratio"), semantic: "acceleration", graphable: true,
      },
      {
        key: "result",
        label: state.op === "compare" ? `Larger ${fracText(state.result)}` : `${OP_SYMBOL[state.op]} gives ${fracText(state.result)}`,
        quantity: q(rv, "ratio"), semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "difference", label: "Gap between them",
        quantity: q(Math.abs(av - bv), "ratio"), semantic: "distance",
        graphable: true, bands: ["3-5", "6-8"],
      },
      {
        key: "lcd", label: "Common denominator",
        quantity: q(state.lcd, "count"), semantic: "mass", bands: ["3-5", "6-8"],
      },
      {
        key: "resultTop", label: "Answer top number",
        quantity: q(state.result.n, "count"), bands: ["6-8"],
      },
      {
        key: "resultBottom", label: "Answer bottom number",
        quantity: q(state.result.d, "count"), bands: ["6-8"],
      },
    ];
  },

  facts(state) {
    const ra = reduce(state.a);
    const rb = reduce(state.b);
    return {
      equal: state.same,
      // "Different looking" is what makes the equivalence challenge non-trivial.
      differentLooking: state.a.n !== state.b.n || state.a.d !== state.b.d,
      bothUnreduced: (ra.d !== state.a.d) && (rb.d !== state.b.d),
      denominatorsDiffer: state.a.d !== state.b.d,
      aValue: fracValue(state.a),
      bValue: fracValue(state.b),
      resultValue: fracValue(state.result),
      resultTop: state.result.n,
      resultBottom: state.result.d,
      rawTop: state.raw.n,
      rawBottom: state.raw.d,
      needsSimplifying: state.raw.d !== state.result.d,
      lcd: state.lcd,
      op: state.op,
      comparison: compareFractions(state.a, state.b),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Drawing — three representations, one truth
 * ------------------------------------------------------------------ */

/** Above this many parts, cell-by-cell partitioning stops being readable. */
const MAX_VISIBLE_CELLS = 40;

function drawBar(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  f: Frac, span: number, color: string, theme: RenderContext<State>["theme"],
  opts: { lcdTicks?: number } = {},
) {
  const value = fracValue(f);
  const cells = span * f.d;

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();

  const unit = w / span;
  const filled = Math.min(Math.abs(value), span) * unit;

  if (cells <= MAX_VISIBLE_CELLS) {
    // Draw the shaded parts one at a time: the partition is the idea.
    const cw = w / cells;
    const count = Math.min(Math.abs(f.n), cells);
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      roundRect(ctx, x + i * cw + 1, y + 1, Math.max(0, cw - 2), h - 2, 2);
      ctx.fill();
    }
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < cells; i++) {
      const cx = Math.round(x + i * cw) + 0.5;
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + h);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    roundRect(ctx, x + 1, y + 1, Math.max(0, filled - 2), h - 2, 2);
    ctx.fill();
  }

  // Faint marks at the common denominator: the re-partition that makes
  // adding possible. Only ever drawn when it differs from this fraction's own.
  if (opts.lcdTicks && opts.lcdTicks !== f.d && span * opts.lcdTicks <= MAX_VISIBLE_CELLS * 2) {
    ctx.save();
    ctx.strokeStyle = theme.ink;
    ctx.globalAlpha = 0.28;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tw = w / (span * opts.lcdTicks);
    for (let i = 1; i < span * opts.lcdTicks; i++) {
      const cx = Math.round(x + i * tw) + 0.5;
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + h);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Whole-unit boundaries, so an improper fraction reads as "one and a bit".
  ctx.strokeStyle = theme.ink;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 1; i < span; i++) {
    const cx = Math.round(x + i * unit) + 0.5;
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + h);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.restore();
}

function drawCircles(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  f: Frac, color: string, theme: RenderContext<State>["theme"],
) {
  const value = Math.abs(fracValue(f));
  const wholes = Math.min(3, Math.max(1, Math.ceil(value - 1e-9)));
  const rr = wholes > 1 ? r / (wholes * 0.75) : r;
  const gapX = rr * 2.25;
  const startX = cx - ((wholes - 1) * gapX) / 2;

  for (let i = 0; i < wholes; i++) {
    const x = startX + i * gapX;
    const portion = Math.max(0, Math.min(1, value - i));

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, cy, rr, 0, Math.PI * 2);
    ctx.fillStyle = theme.surfaceAlt;
    ctx.fill();

    if (portion > 0) {
      ctx.beginPath();
      ctx.moveTo(x, cy);
      // Start at 12 o'clock and sweep clockwise, the way students draw them.
      ctx.arc(x, cy, rr, -Math.PI / 2, -Math.PI / 2 + portion * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (f.d <= 24) {
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < f.d; k++) {
        const ang = -Math.PI / 2 + (k / f.d) * Math.PI * 2;
        ctx.moveTo(x, cy);
        ctx.lineTo(x + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, cy, rr, 0, Math.PI * 2);
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  if (value > 3) {
    label(ctx, `+${(value - 3).toFixed(2)} more`, cx, cy + r + 12, theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }
}

function marker(
  ctx: CanvasRenderingContext2D, x: number, y: number, color: string, up: boolean,
) {
  const s = 7;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * 0.62, y + (up ? -s : s));
  ctx.lineTo(x + s * 0.62, y + (up ? -s : s));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;
  const colA = theme.sci["velocity"];
  const colB = theme.sci["acceleration"];
  const colR = theme.sci["energy-kinetic"];

  const av = fracValue(state.a);
  const bv = fracValue(state.b);
  const rv = fracValue(state.result);
  const showResult = state.op !== "compare";

  // One shared scale keeps the bars honest: 3/4 must look bigger than 1/2.
  const span = Math.max(1, Math.ceil(Math.max(av, bv, showResult ? rv : 0) - 1e-9));

  // Equation banner.
  const eq = showResult
    ? `${fracText(state.a)}  ${OP_SYMBOL[state.op]}  ${fracText(state.b)}  =  ${fracText(state.raw)}`
    : `${fracText(state.a)}  ${state.same ? "=" : compareFractions(state.a, state.b) > 0 ? ">" : "<"}  ${fracText(state.b)}`;
  ctx.save();
  ctx.font = `700 ${Math.min(26, Math.max(16, width * 0.032))}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.ink;
  ctx.fillText(eq, width / 2, 10);
  ctx.restore();

  if (showResult && state.raw.d !== state.result.d) {
    label(ctx, `= ${fracText(state.result)} in lowest terms`, width / 2, 44, theme, {
      align: "center", size: 12, color: colR,
    });
  } else if (state.same) {
    // A calm pulse, not a flash: the equality is the finding, not a reward.
    const pulse = 0.65 + 0.35 * Math.sin(state.glow * 2.2);
    ctx.save();
    ctx.globalAlpha = pulse;
    label(ctx, "these two are the same amount", width / 2, 44, theme, {
      align: "center", size: 12, color: theme.accent,
    });
    ctx.restore();
  }

  const gutter = Math.min(74, width * 0.15);
  const left = gutter;
  // Comparing leaves room on the right for the < = > symbol between the bars.
  const barW = width - gutter - (showResult ? 18 : 36);
  const rows = showResult ? 3 : 2;
  const barTop = 62;
  const barH = Math.min(30, (height * 0.30) / rows - 8);
  const rowGap = barH + 16;

  const entries: { f: Frac; color: string; name: string }[] = [
    { f: state.a, color: colA, name: fracText(state.a) },
    { f: state.b, color: colB, name: fracText(state.b) },
  ];
  if (showResult) entries.push({ f: state.result, color: colR, name: fracText(state.result) });

  const lcdTicks = overlays.commonDenominator && (state.op === "add" || state.op === "subtract")
    ? state.lcd : 0;

  entries.forEach((e, i) => {
    const y = barTop + i * rowGap;
    drawBar(ctx, left, y, barW, barH, e.f, span, e.color, theme,
      i < 2 ? { lcdTicks } : {});
    label(ctx, e.name, left - 8, y + barH / 2, theme, {
      align: "right", size: 13, color: e.color, plate: false,
    });
    if (fracValue(e.f) < 0) {
      label(ctx, "below zero", left + barW - 4, y + barH / 2, theme, {
        align: "right", size: 10, color: theme.inkSoft,
      });
    }
  });

  // Comparison symbol sits between the two bars when comparing.
  if (!showResult && band !== "K-2") {
    const sym = state.same ? "=" : compareFractions(state.a, state.b) > 0 ? ">" : "<";
    ctx.save();
    ctx.font = "700 22px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = state.same ? theme.accent : theme.ink;
    ctx.fillText(sym, left + barW + 18, barTop + rowGap / 2 + barH / 2 - 2);
    ctx.restore();
  }

  // Circles: the same fractions again, area instead of length.
  const circleTop = barTop + rows * rowGap + 12;
  const circleBottom = height - 78;
  const cy = (circleTop + circleBottom) / 2;
  const r = Math.max(18, Math.min((circleBottom - circleTop) / 2 - 14, width / (entries.length * 3.4)));
  entries.forEach((e, i) => {
    const cx = ((i + 0.5) / entries.length) * width;
    drawCircles(ctx, cx, cy, r, e.f, e.color, theme);
    label(ctx, e.name, cx, cy + r + (Math.abs(fracValue(e.f)) > 3 ? 26 : 14), theme, {
      align: "center", size: 12, color: e.color,
    });
  });

  // Number line: the representation that survives into algebra.
  const lineY = height - 44;
  const lo = Math.min(0, Math.floor(Math.min(av, bv, showResult ? rv : 0)));
  const hi = Math.max(span, 1);
  const px = (v: number) => 18 + ((v - lo) / (hi - lo)) * (width - 36);

  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px(lo), lineY);
  ctx.lineTo(px(hi), lineY);
  ctx.stroke();

  // Fine ticks at the common denominator, whole numbers labelled.
  const fine = state.lcd;
  if ((hi - lo) * fine <= 60) {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= (hi - lo) * fine; i++) {
      const x = px(lo + i / fine);
      ctx.moveTo(x, lineY - 5);
      ctx.lineTo(x, lineY + 5);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let w = lo; w <= hi; w++) {
    ctx.moveTo(px(w), lineY - 9);
    ctx.lineTo(px(w), lineY + 9);
  }
  ctx.stroke();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let w = lo; w <= hi; w++) ctx.fillText(String(w), px(w), lineY + 12);
  ctx.restore();

  marker(ctx, px(av), lineY - 10, colA, true);
  marker(ctx, px(bv), lineY + 10, colB, false);
  if (showResult) marker(ctx, px(rv), lineY - 10, colR, true);

  if (state.same) {
    // One marker sitting on top of another is the visual proof of equivalence.
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px(av), lineY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const fractionsSim: SimManifest<State> = {
  id: "math.fractions",
  title: "Fraction Lab",
  tagline: "Build two fractions, see them as bars, circles and points at once, and find out when they are really the same.",
  subject: "math",
  bands: ["K-2", "3-5", "6-8"],
  grades: [2, 3, 4, 5, 6, 7],
  standards: {
    ccssMath: [
      "3.NF.A.1", "3.NF.A.3", "4.NF.A.1", "4.NF.B.3", "4.NF.B.4",
      "5.NF.A.1", "5.NF.B.4", "6.NS.A.1",
    ],
  },
  learningGoals: [
    "Read the same fraction as a length, an area and a point on a number line.",
    "Decide whether two fractions are equal without converting to decimals.",
    "Explain why adding fractions needs a common denominator but multiplying does not.",
  ],
  misconceptions: [
    "A bigger denominator always means a bigger fraction",
    "You add fractions by adding tops and adding bottoms",
    "Two fractions that look different must be different amounts",
  ],
  interactionHint: "Change the top and bottom numbers and watch all three pictures move together.",
  params: {
    n1: {
      type: "number", label: "First fraction: top", kind: "count",
      min: 0, max: 12, step: 1, default: 1,
      help: "How many parts you have.",
    },
    d1: {
      type: "number", label: "First fraction: bottom", kind: "count",
      min: 1, max: 12, step: 1, default: 2,
      help: "How many equal parts the whole is cut into.",
    },
    n2: {
      type: "number", label: "Second fraction: top", kind: "count",
      min: 0, max: 12, step: 1, default: 1,
    },
    d2: {
      type: "number", label: "Second fraction: bottom", kind: "count",
      min: 1, max: 12, step: 1, default: 3,
    },
    op: {
      type: "option", label: "What to do",
      options: [
        { value: "compare", label: "Compare" },
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
        { value: "multiply", label: "Multiply" },
      ],
      default: "compare",
    },
  },
  overlays: [
    { key: "commonDenominator", label: "Common-denominator marks", default: true, bands: ["3-5", "6-8"] },
  ],
  model,
  render,
  labs: [
    {
      id: "when-equal",
      title: "When are two fractions equal?",
      question: "Two fractions look completely different. How can they be the same amount?",
      bands: ["3-5", "6-8"],
      minutes: 20,
      standards: ["4.NF.A.1"],
      setup: { n1: 1, d1: 2, n2: 1, d2: 3, op: "compare" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you change anything.",
          predict: {
            prompt: "Which fraction is the same amount as 1/2?",
            options: ["2/3", "3/6", "1/4", "2/5"],
            correct: 1,
            reveal: "3/6 is 1/2. Cutting each half into three pieces gives six pieces, and you keep three of them.",
          },
        },
        {
          id: "test",
          phase: "measure",
          title: "Make them line up",
          instruction: "Set the second fraction to 3/6. Watch the number line.",
          check: {
            describe: "The two fractions are equal",
            test: (v) => v.facts.equal === true,
          },
          hints: [
            "Change the bottom number of the second fraction first.",
            "Six parts are half the size of three parts.",
            "Try top 3 and bottom 6.",
          ],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Find three more",
          instruction: "Find three more fractions equal to 1/2. Record each one.",
          requireData: 3,
          hints: ["Double the top and the bottom together.", "2/4, 4/8, 5/10 all work."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say how you can tell without drawing.",
          write: {
            prompt: "How can you check whether two fractions are equal just from the numbers?",
            placeholder: "Two fractions are equal when ...",
          },
        },
      ],
    },
    {
      id: "common-denominator",
      title: "Why do we need a common denominator?",
      question: "Why can you not just add the tops and add the bottoms?",
      bands: ["6-8"],
      minutes: 25,
      standards: ["5.NF.A.1"],
      setup: { n1: 1, d1: 2, n2: 1, d2: 3, op: "add" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Do not compute it yet. Choose the answer you believe.",
          predict: {
            prompt: "What is 1/2 + 1/3?",
            options: ["2/5", "5/6", "1/6", "2/6"],
            correct: 1,
            reveal: "5/6. Adding tops and bottoms gives 2/5, which is smaller than 1/2 — adding cannot shrink a number.",
          },
        },
        {
          id: "see",
          phase: "measure",
          title: "Look at the bars",
          instruction: "Halves and thirds are different sizes, so the pieces will not stack. Turn on the common-denominator marks.",
          check: {
            describe: "Adding two fractions with different denominators",
            test: (v) => v.params.op === "add" && v.facts.denominatorsDiffer === true,
          },
          hints: ["The faint dashed lines cut both bars into the same size pieces."],
        },
        {
          id: "sixths",
          phase: "analyze",
          title: "Rewrite both in sixths",
          instruction: "Set the first fraction to 3/6 and the second to 2/6. The bars now match, and the answer is 5/6.",
          check: {
            describe: "Both fractions are written in sixths",
            test: (v) => (v.params.d1 as number) === 6 && (v.params.d2 as number) === 6,
          },
        },
        {
          id: "multiply",
          phase: "analyze",
          title: "Now try multiplying",
          instruction: "Switch the operation to Multiply with different bottom numbers. Multiplying needs no common denominator at all.",
          check: {
            describe: "Multiplying two fractions",
            test: (v) => v.params.op === "multiply",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "Write why adding needs matching pieces and multiplying does not.",
          write: {
            prompt: "Why does adding fractions need a common denominator when multiplying does not?",
            placeholder: "Adding counts pieces, so ... Multiplying takes a part of a part, so ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "same-but-different",
      title: "Same amount, different look",
      brief: "Make two fractions that look nothing alike but land on exactly the same point.",
      bands: ["3-5", "6-8"],
      setup: { n1: 1, d1: 2, n2: 1, d2: 3, op: "compare" },
      goal: {
        describe: "Two different-looking fractions that are equal",
        test: (v) => v.facts.equal === true && v.facts.differentLooking === true,
      },
      stars: {
        two: {
          describe: "The bottom numbers differ by at least 4",
          test: (v) =>
            v.facts.equal === true && v.facts.differentLooking === true &&
            Math.abs((v.params.d1 as number) - (v.params.d2 as number)) >= 4,
        },
        three: {
          describe: "Neither fraction is already in lowest terms",
          test: (v) =>
            v.facts.equal === true && v.facts.differentLooking === true &&
            v.facts.bothUnreduced === true,
        },
      },
      hints: [
        "Multiply the top and the bottom of a fraction by the same number.",
        "2/4 and 3/6 are both one half, and neither is in lowest terms.",
      ],
    },
    {
      id: "make-one",
      title: "Add up to exactly one",
      brief: "Add two fractions with different bottom numbers so the answer is exactly 1.",
      bands: ["6-8"],
      setup: { n1: 1, d1: 2, n2: 1, d2: 3, op: "add" },
      goal: {
        describe: "The sum is exactly 1 with different denominators",
        test: (v) =>
          v.params.op === "add" &&
          (v.facts.resultTop as number) === 1 && (v.facts.resultBottom as number) === 1 &&
          v.facts.denominatorsDiffer === true,
      },
      stars: {
        two: {
          describe: "Neither denominator is a multiple of the other",
          test: (v) => {
            const a = v.params.d1 as number;
            const b = v.params.d2 as number;
            return v.params.op === "add" &&
              (v.facts.resultTop as number) === 1 && (v.facts.resultBottom as number) === 1 &&
              a % b !== 0 && b % a !== 0;
          },
        },
      },
      hints: [
        "1/4 + 3/4 works, but those bottoms are the same.",
        "Look for two fractions that are each exactly one half.",
        "2/4 + 3/6 = 1, and neither 4 nor 6 divides the other.",
      ],
    },
  ],
};
