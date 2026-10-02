import type { ParamValues, Readout, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { camera, disc, grid, label } from "@ui/draw";

/**
 * Function Grapher & Transformer — Grades 7-12.
 *
 * One family of functions, one standard form: y = a·p(b(x − h)) + k. The parent
 * p is drawn faintly underneath the transformed curve, so every slider move is
 * a visible before-and-after rather than a new picture. Key features (roots,
 * vertex, intercepts, asymptote, amplitude, period) are computed in closed form
 * and marked on the curve, never found by numerical search.
 *
 * Confronts the two transformation misconceptions that survive into calculus:
 * that h shifts the graph the way its sign reads, and that b stretches the
 * graph horizontally rather than compressing it.
 */

export type Family = "linear" | "quadratic" | "exponential" | "sine" | "abs";

/** The domain the sim graphs and searches for roots over. */
const X_MIN = -8;
const X_MAX = 8;

/* ------------------------------------------------------------------ *
 * The function itself
 * ------------------------------------------------------------------ */

/** The untransformed parent: p(u). */
export function parent(family: Family, u: number): number {
  switch (family) {
    case "linear": return u;
    case "quadratic": return u * u;
    case "exponential": return Math.pow(2, u);
    case "sine": return Math.sin(u);
    case "abs": return Math.abs(u);
  }
}

export interface Coeffs { a: number; b: number; h: number; k: number }

/** y = a·p(b(x − h)) + k — the single form every family is expressed in. */
export function evaluate(family: Family, c: Coeffs, x: number): number {
  return c.a * parent(family, c.b * (x - c.h)) + c.k;
}

/* ------------------------------------------------------------------ *
 * Key features, in closed form
 * ------------------------------------------------------------------ */

export interface Features {
  roots: number[];
  yIntercept: number;
  vertex: { x: number; y: number } | null;
  /** Horizontal asymptote (exponential only). */
  asymptote: number | null;
  period: number | null;
  amplitude: number | null;
  slope: number | null;
}

const EPS = 1e-12;

function inDomain(x: number): boolean {
  return Number.isFinite(x) && x >= X_MIN - 1e-9 && x <= X_MAX + 1e-9;
}

export function features(family: Family, c: Coeffs): Features {
  const { a, b, h, k } = c;
  const f: Features = {
    roots: [],
    yIntercept: evaluate(family, c, 0),
    vertex: null,
    asymptote: null,
    period: null,
    amplitude: null,
    slope: null,
  };
  const flat = Math.abs(a) < EPS || Math.abs(b) < EPS;

  switch (family) {
    case "linear": {
      const m = a * b;
      f.slope = m;
      // a·b(x − h) + k = 0  ⇒  x = h − k/(ab)
      if (Math.abs(m) > EPS) f.roots = [h - k / m].filter(inDomain);
      break;
    }
    case "quadratic": {
      f.vertex = { x: h, y: k };
      // a(b(x − h))² + k = 0  ⇒  (b(x − h))² = −k/a
      if (!flat) {
        const t = -k / a;
        if (t > EPS) {
          const s = Math.sqrt(t) / Math.abs(b);
          f.roots = [h - s, h + s].filter(inDomain);
        } else if (Math.abs(t) <= EPS) {
          f.roots = [h].filter(inDomain);
        }
      }
      break;
    }
    case "abs": {
      f.vertex = { x: h, y: k };
      // a|b(x − h)| + k = 0  ⇒  |b(x − h)| = −k/a
      if (!flat) {
        const t = -k / a;
        if (t > EPS) {
          const s = t / Math.abs(b);
          f.roots = [h - s, h + s].filter(inDomain);
        } else if (Math.abs(t) <= EPS) {
          f.roots = [h].filter(inDomain);
        }
      }
      break;
    }
    case "exponential": {
      f.asymptote = k;
      // a·2^(b(x − h)) + k = 0  ⇒  2^(b(x − h)) = −k/a, which needs −k/a > 0
      if (!flat) {
        const r = -k / a;
        if (r > EPS) f.roots = [h + Math.log2(r) / b].filter(inDomain);
      }
      break;
    }
    case "sine": {
      f.amplitude = Math.abs(a);
      f.period = Math.abs(b) > EPS ? (2 * Math.PI) / Math.abs(b) : null;
      // a·sin(b(x − h)) + k = 0  ⇒  sin(u) = −k/a
      if (!flat) {
        const r = -k / a;
        if (Math.abs(r) <= 1) {
          const base = Math.asin(r);
          const out: number[] = [];
          // Both branches of the sine, swept far enough to cover the domain.
          for (let n = -6; n <= 6; n++) {
            for (const u of [base + 2 * Math.PI * n, Math.PI - base + 2 * Math.PI * n]) {
              const x = h + u / b;
              if (inDomain(x)) out.push(x);
            }
          }
          out.sort((p, r2) => p - r2);
          // Collapse duplicates that the two branches share (r = ±1).
          f.roots = out.filter((x, i) => i === 0 || Math.abs(x - out[i - 1]) > 1e-6);
        }
      }
      break;
    }
  }
  return f;
}

/* ------------------------------------------------------------------ *
 * Equation text
 * ------------------------------------------------------------------ */

function num(v: number): string {
  const r = Math.round(v * 1000) / 1000;
  if (Object.is(r, -0) || r === 0) return "0";
  // A real minus sign, not a hyphen — this text is typeset mathematics.
  return String(r).replace("-", "−");
}

/** The inner expression b(x − h), plus whether it is safe to leave unwrapped. */
function inner(b: number, h: number): { text: string; simple: boolean } {
  const core = h === 0 ? "x" : `(x ${h > 0 ? "−" : "+"} ${num(Math.abs(h))})`;
  if (b === 1) return { text: core, simple: true };
  const bs = b === -1 ? "−" : num(b);
  return { text: `${bs}${core}`, simple: false };
}

export function equationText(family: Family, c: Coeffs): string {
  if (Math.abs(c.a) < EPS) return `y = ${num(c.k)}`;
  const inn = inner(c.b, c.h);
  const wrapped = inn.simple ? inn.text : `(${inn.text})`;
  let body: string;
  switch (family) {
    case "linear": body = inn.text; break;
    case "quadratic": body = `${wrapped}²`; break;
    // The bars already group the expression, so a second pair of brackets
    // inside them would be noise: |x + 2|, not |(x + 2)|.
    case "abs": body = `|${inn.simple && inn.text.startsWith("(") ? inn.text.slice(1, -1) : inn.text}|`; break;
    case "sine": body = `sin(${inn.text})`; break;
    case "exponential": body = `2^${wrapped}`; break;
  }
  const prefix = c.a === 1 ? "" : c.a === -1 ? "−" : num(c.a);
  const tail = c.k === 0 ? "" : ` ${c.k > 0 ? "+" : "−"} ${num(Math.abs(c.k))}`;
  return `y = ${prefix}${body}${tail}`;
}

/* ------------------------------------------------------------------ *
 * Mystery curves — fixed presets so a challenge is reproducible
 * ------------------------------------------------------------------ */

const MYSTERY: Record<Family, Coeffs[]> = {
  linear: [
    { a: 2, b: 1, h: 1, k: -3 },
    { a: -0.5, b: 1, h: -2, k: 2 },
    { a: 1, b: 2, h: 0, k: 4 },
  ],
  quadratic: [
    { a: -1, b: 1, h: 2, k: 4 },
    { a: 0.5, b: 1, h: -3, k: -2 },
    { a: 2, b: 0.5, h: 1, k: 1 },
  ],
  exponential: [
    { a: 1, b: 1, h: 2, k: -3 },
    { a: 2, b: -1, h: 0, k: 1 },
    { a: -1, b: 1, h: -1, k: 5 },
  ],
  sine: [
    { a: 2, b: 1, h: 0, k: 1 },
    { a: 1, b: 2, h: 1, k: 0 },
    { a: -1.5, b: 0.5, h: -2, k: -1 },
  ],
  abs: [
    { a: 1, b: 1, h: -2, k: -3 },
    { a: -2, b: 1, h: 1, k: 4 },
    { a: 0.5, b: 2, h: 3, k: 0 },
  ],
};

export function mysteryCurve(family: Family, which: string): Coeffs | null {
  const index = Number(which) - 1;
  const list = MYSTERY[family];
  return Number.isInteger(index) && index >= 0 && index < list.length ? list[index] : null;
}

/**
 * Mean absolute vertical gap between two curves over the graphed domain.
 *
 * Each sample is clamped so an exponential that runs off the top of the screen
 * cannot swamp the score — matching the visible curve is what is being asked.
 */
export function curveError(family: Family, c: Coeffs, target: Coeffs): number {
  const samples = 81;
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / (samples - 1);
    const d = Math.abs(evaluate(family, c, x) - evaluate(family, target, x));
    sum += Number.isFinite(d) ? Math.min(d, 20) : 20;
  }
  return sum / samples;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** The sweeping trace point. */
  x: number;
  dir: number;
  /** Mirror of the point parameter, so a slider move re-seats the trace. */
  seed: number;
}

const SWEEP_SPEED = 2.6; // graph units per second

function coeffsOf(params: ParamValues): Coeffs {
  return {
    a: params.a as number,
    b: params.b as number,
    h: params.h as number,
    k: params.k as number,
  };
}

const model: SimModel<State> = {
  init(params) {
    const x = params.point as number;
    return { x, dir: 1, seed: x };
  },

  applyParams(state, params) {
    const seed = params.point as number;
    // Dragging the point slider re-seats the sweep; other sliders leave it be.
    return seed === state.seed ? state : { x: seed, dir: 1, seed };
  },

  step(state, dt) {
    let x = state.x + state.dir * SWEEP_SPEED * dt;
    let dir = state.dir;
    if (x > X_MAX) { x = X_MAX; dir = -1; }
    if (x < X_MIN) { x = X_MIN; dir = 1; }
    return { ...state, x, dir };
  },

  readouts(state, params) {
    const family = params.family as Family;
    const c = coeffsOf(params);
    const f = features(family, c);
    const y = evaluate(family, c, state.x);

    const out: Readout[] = [
      { key: "x", label: "x", quantity: q(state.x, "ratio"), semantic: "distance", graphable: true },
      {
        key: "y", label: "f(x)", quantity: q(Number.isFinite(y) ? y : 0, "ratio"),
        semantic: "velocity", graphable: true,
      },
      {
        key: "yIntercept", label: "y-intercept",
        quantity: q(Number.isFinite(f.yIntercept) ? f.yIntercept : 0, "ratio"),
        semantic: "velocity",
      },
      { key: "rootCount", label: "Roots in view", quantity: q(f.roots.length, "count") },
    ];
    if (f.roots.length > 0) {
      out.push({
        key: "firstRoot", label: "First root", quantity: q(f.roots[0], "ratio"),
        semantic: "acceleration",
      });
    }
    if (f.slope !== null) {
      out.push({ key: "slope", label: "Slope", quantity: q(f.slope, "ratio"), semantic: "velocity", graphable: true });
    }
    if (f.vertex) {
      out.push({ key: "vertexX", label: "Vertex x", quantity: q(f.vertex.x, "ratio"), semantic: "force" });
      out.push({ key: "vertexY", label: "Vertex y", quantity: q(f.vertex.y, "ratio"), semantic: "force" });
    }
    if (f.amplitude !== null) {
      out.push({ key: "amplitude", label: "Amplitude", quantity: q(f.amplitude, "ratio"), semantic: "wave" });
    }
    if (f.period !== null) {
      out.push({ key: "period", label: "Period", quantity: q(f.period, "ratio"), semantic: "wave" });
    }
    if (f.asymptote !== null) {
      out.push({ key: "asymptote", label: "Asymptote y =", quantity: q(f.asymptote, "ratio"), semantic: "mass" });
    }
    const target = mysteryCurve(family, params.mystery as string);
    if (target) {
      out.push({
        key: "matchError", label: "Distance from mystery curve",
        quantity: q(curveError(family, c, target), "ratio"), semantic: "distance", graphable: true,
      });
    }
    return out;
  },

  facts(state, params) {
    const family = params.family as Family;
    const c = coeffsOf(params);
    const f = features(family, c);
    const target = mysteryCurve(family, params.mystery as string);
    // `mysteryOn` is the validity flag; with no mystery curve the distance
    // reads 0 and every check that uses it must also require mysteryOn.
    const err = target ? curveError(family, c, target) : 0;
    return {
      family,
      rootCount: f.roots.length,
      firstRoot: f.roots.length ? f.roots[0] : 0,
      yIntercept: Number.isFinite(f.yIntercept) ? f.yIntercept : 0,
      vertexX: f.vertex ? f.vertex.x : 0,
      vertexY: f.vertex ? f.vertex.y : 0,
      amplitude: f.amplitude ?? 0,
      period: f.period ?? 0,
      slope: f.slope ?? 0,
      mysteryOn: target !== null,
      matchError: err,
      traceX: state.x,
      equation: equationText(family, c),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

/** A y-window that keeps the transformed curve on screen without jitter. */
function verticalWindow(family: Family, c: Coeffs): { lo: number; hi: number } {
  let lo = 0;
  let hi = 0;
  for (let i = 0; i <= 64; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / 64;
    const y = evaluate(family, c, x);
    if (!Number.isFinite(y) || Math.abs(y) > 60) continue;
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  // Round outwards to whole units so the window does not twitch as sliders move.
  lo = Math.floor(Math.min(lo, -3));
  hi = Math.ceil(Math.max(hi, 3));
  const span = hi - lo;
  if (span > 40) {
    const mid = (lo + hi) / 2;
    lo = mid - 20;
    hi = mid + 20;
  }
  return { lo, hi };
}

function plot(
  ctx: CanvasRenderingContext2D,
  cam: { toScreenX: (x: number) => number; toScreenY: (y: number) => number },
  family: Family, c: Coeffs, lo: number, hi: number, steps: number,
) {
  let drawing = false;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps;
    const y = evaluate(family, c, x);
    // Leave the path when the curve runs far outside the window, so the
    // polyline never cuts a false chord across the screen.
    if (!Number.isFinite(y) || y < lo - (hi - lo) || y > hi + (hi - lo)) {
      drawing = false;
      continue;
    }
    const sx = cam.toScreenX(x);
    const sy = cam.toScreenY(y);
    if (!drawing) { ctx.moveTo(sx, sy); drawing = true; } else { ctx.lineTo(sx, sy); }
  }
  ctx.stroke();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const family = params.family as Family;
  const c = coeffsOf(params);
  const win = verticalWindow(family, c);
  const cam = camera({
    x0: X_MIN, y0: win.lo, x1: X_MAX, y1: win.hi, width, height, square: false,
  });

  if (overlays.grid) {
    grid(ctx, cam, theme, { spacing: 1, x0: X_MIN, y0: win.lo, x1: X_MAX, y1: win.hi });
  }

  // Axes.
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  const y0 = Math.round(cam.toScreenY(0)) + 0.5;
  const x0 = Math.round(cam.toScreenX(0)) + 0.5;
  ctx.moveTo(0, y0); ctx.lineTo(width, y0);
  ctx.moveTo(x0, 0); ctx.lineTo(x0, height);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = X_MIN + 1; x < X_MAX; x++) {
    if (x === 0) continue;
    ctx.fillText(String(x), cam.toScreenX(x), y0 + 3);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yStep = win.hi - win.lo > 24 ? 5 : win.hi - win.lo > 12 ? 2 : 1;
  for (let y = Math.ceil(win.lo); y <= win.hi; y += yStep) {
    if (y === 0) continue;
    ctx.fillText(String(y), x0 - 4, cam.toScreenY(y));
  }
  ctx.restore();

  // The parent, faint. Its whole job is to make "what did a do?" answerable.
  if (overlays.parent) {
    ctx.save();
    ctx.strokeStyle = theme.inkSoft;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    plot(ctx, cam, family, { a: 1, b: 1, h: 0, k: 0 }, win.lo, win.hi, 400);
    ctx.restore();
  }

  // The mystery target.
  const target = mysteryCurve(family, params.mystery as string);
  if (target) {
    ctx.save();
    ctx.strokeStyle = theme.sci["field"];
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    plot(ctx, cam, family, target, win.lo, win.hi, 400);
    ctx.restore();
  }

  // The transformed curve.
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = "round";
  plot(ctx, cam, family, c, win.lo, win.hi, 600);
  ctx.restore();

  const f = features(family, c);

  if (overlays.features) {
    // Horizontal asymptote.
    if (f.asymptote !== null) {
      ctx.save();
      ctx.strokeStyle = theme.sci["mass"];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      const ay = cam.toScreenY(f.asymptote);
      ctx.beginPath();
      ctx.moveTo(0, ay);
      ctx.lineTo(width, ay);
      ctx.stroke();
      ctx.restore();
      label(ctx, `y = ${num(f.asymptote)}`, width - 8, ay - 10, theme, {
        align: "right", size: 11, color: theme.sci["mass"],
      });
    }
    // Roots.
    for (const r of f.roots) {
      disc(ctx, cam.toScreenX(r), cam.toScreenY(0), 5, theme.sci["acceleration"], {
        stroke: theme.surface, lineWidth: 2,
      });
    }
    if (f.roots.length && band === "9-12") {
      label(ctx, `x = ${num(f.roots[0])}`, cam.toScreenX(f.roots[0]), cam.toScreenY(0) + 20, theme, {
        align: "center", size: 11, color: theme.sci["acceleration"],
      });
    }
    // Vertex.
    if (f.vertex) {
      disc(ctx, cam.toScreenX(f.vertex.x), cam.toScreenY(f.vertex.y), 5.5, theme.sci["force"], {
        stroke: theme.surface, lineWidth: 2,
      });
      label(ctx, `(${num(f.vertex.x)}, ${num(f.vertex.y)})`,
        cam.toScreenX(f.vertex.x), cam.toScreenY(f.vertex.y) - 16, theme,
        { align: "center", size: 11, color: theme.sci["force"] });
    }
    // y-intercept.
    if (Number.isFinite(f.yIntercept) && f.yIntercept >= win.lo && f.yIntercept <= win.hi) {
      disc(ctx, cam.toScreenX(0), cam.toScreenY(f.yIntercept), 4.5, theme.sci["velocity"], {
        stroke: theme.surface, lineWidth: 2,
      });
    }
    // Amplitude and period, drawn as measurements rather than stated as text.
    if (f.amplitude !== null && f.period !== null && f.amplitude > 0.05) {
      ctx.save();
      ctx.strokeStyle = theme.sci["wave"];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, cam.toScreenY(c.k + f.amplitude));
      ctx.lineTo(width, cam.toScreenY(c.k + f.amplitude));
      ctx.moveTo(0, cam.toScreenY(c.k - f.amplitude));
      ctx.lineTo(width, cam.toScreenY(c.k - f.amplitude));
      ctx.stroke();
      ctx.restore();
      label(ctx, `amplitude ${num(f.amplitude)} · period ${num(Math.round(f.period * 100) / 100)}`,
        width - 8, 20, theme, { align: "right", size: 11, color: theme.sci["wave"] });
    }
  }

  // The sweeping point, and the value it currently reads.
  const py = evaluate(family, c, state.x);
  if (Number.isFinite(py) && py >= win.lo && py <= win.hi) {
    const sx = cam.toScreenX(state.x);
    const sy = cam.toScreenY(py);
    ctx.save();
    ctx.strokeStyle = theme.sci["velocity"];
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx, cam.toScreenY(0));
    ctx.moveTo(sx, sy); ctx.lineTo(cam.toScreenX(0), sy);
    ctx.stroke();
    ctx.restore();
    disc(ctx, sx, sy, 6, theme.sci["velocity"], { stroke: theme.surface, lineWidth: 2 });
    if (band === "9-12") {
      label(ctx, `(${num(Math.round(state.x * 100) / 100)}, ${num(Math.round(py * 100) / 100)})`,
        sx + 10, sy - 12, theme, { size: 11, color: theme.sci["velocity"] });
    }
  }

  // The equation, always visible, always the current one.
  ctx.save();
  ctx.font = "700 17px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.surface;
  ctx.globalAlpha = 0.85;
  const text = equationText(family, c);
  const w = ctx.measureText(text).width;
  ctx.fillRect(6, 6, w + 14, 26);
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.accent;
  ctx.fillText(text, 13, 11);
  ctx.restore();

  if (target) {
    label(ctx, `mystery: ${curveError(family, c, target).toFixed(3)} away`, 13, 46, theme, {
      size: 11, color: theme.sci["field"],
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const functionGrapherSim: SimManifest<State> = {
  id: "math.functions",
  title: "Function Grapher & Transformer",
  tagline: "Slide a, b, h and k and watch a parent function stretch, flip and slide into a new curve.",
  subject: "math",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: {
    ccssMath: [
      "8.F.A.3", "8.F.B.4", "HSF.IF.B.4", "HSF.IF.C.7", "HSF.BF.B.3",
      "HSA.SSE.A.1", "HSF.TF.B.5",
    ],
  },
  learningGoals: [
    "Predict the effect of each coefficient in y = a·f(b(x − h)) + k before moving the slider.",
    "Read roots, intercepts, vertex, asymptote, amplitude and period straight off a graph.",
    "Recover an equation from a curve by matching transformations one coefficient at a time.",
  ],
  misconceptions: [
    "y = f(x − 3) shifts the graph left because of the minus sign",
    "Multiplying x by 2 stretches the graph sideways instead of squashing it",
    "A negative a moves the graph down rather than flipping it",
  ],
  interactionHint: "Move one slider at a time and compare with the faint parent curve.",
  params: {
    family: {
      type: "option", label: "Function family",
      options: [
        { value: "linear", label: "Linear  x" },
        { value: "quadratic", label: "Quadratic  x²" },
        { value: "abs", label: "Absolute value  |x|" },
        { value: "exponential", label: "Exponential  2ˣ" },
        { value: "sine", label: "Sine  sin x" },
      ],
      default: "quadratic",
    },
    a: {
      type: "number", label: "a — vertical stretch", kind: "ratio",
      min: -3, max: 3, step: 0.1, default: 1,
      marks: [{ value: -1, label: "flip" }, { value: 1, label: "parent" }],
      help: "Stretches the graph away from the x-axis. Negative flips it over.",
    },
    b: {
      type: "number", label: "b — horizontal squeeze", kind: "ratio",
      min: -3, max: 3, step: 0.1, default: 1,
      marks: [{ value: 1, label: "parent" }, { value: 2, label: "half as wide" }],
      help: "Bigger b squeezes the graph towards the y-axis, not away from it.",
    },
    h: {
      type: "number", label: "h — shift right", kind: "ratio",
      min: -5, max: 5, step: 0.1, default: 0,
      help: "Positive h moves the graph right, even though the form says x − h.",
    },
    k: {
      type: "number", label: "k — shift up", kind: "ratio",
      min: -5, max: 5, step: 0.1, default: 0,
    },
    point: {
      type: "number", label: "Point on the curve", kind: "ratio",
      min: X_MIN, max: X_MAX, step: 0.1, default: 0, bands: ["9-12"],
      help: "Press play and the point sweeps the curve.",
    },
    mystery: {
      type: "option", label: "Mystery curve", bands: ["9-12"],
      options: [
        { value: "off", label: "Off" },
        { value: "1", label: "Mystery 1" },
        { value: "2", label: "Mystery 2" },
        { value: "3", label: "Mystery 3" },
      ],
      default: "off",
    },
  },
  overlays: [
    { key: "parent", label: "Parent function", default: true },
    { key: "features", label: "Key features", default: true },
    { key: "grid", label: "Grid", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "what-each-slider-does",
      title: "What does each slider do?",
      question: "Which coefficient moves the graph, which stretches it, and which flips it?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["HSF.BF.B.3"],
      setup: { family: "quadratic", a: 1, b: 1, h: 0, k: 0, mystery: "off" },
      steps: [
        {
          id: "predict-h",
          phase: "hypothesis",
          title: "Predict h",
          instruction: "The form says x − h. Commit before you touch the slider.",
          predict: {
            prompt: "Setting h = 3 in y = (x − 3)² moves the parabola which way?",
            options: ["Left 3", "Right 3", "Up 3", "Down 3"],
            correct: 1,
            reveal: "Right 3. The graph reaches its vertex when x − h = 0, which now happens at x = 3.",
          },
        },
        {
          id: "test-h",
          phase: "measure",
          title: "Move h and watch the vertex",
          instruction: "Set h to 3. Compare with the faint parent curve.",
          check: {
            describe: "The vertex sits at x = 3",
            test: (v) => Math.abs((v.facts.vertexX as number) - 3) < 0.05,
          },
          hints: ["The vertex readout tells you where the turning point is."],
        },
        {
          id: "predict-a",
          phase: "hypothesis",
          title: "Predict a",
          instruction: "Now predict what a negative a does.",
          predict: {
            prompt: "What does a = −1 do to y = x²?",
            options: ["Slides it down", "Flips it upside down", "Makes it wider", "Nothing"],
            correct: 1,
            reveal: "It reflects the curve in the x-axis. Every output changes sign, so the vertex becomes a maximum.",
          },
        },
        {
          id: "test-a",
          phase: "measure",
          title: "Stretch and flip",
          instruction: "Try a = 2, then a = 0.5, then a = −1. Record each one.",
          requireData: 3,
          hints: ["Keep h and k at 0 so only a is changing."],
        },
        {
          id: "test-b",
          phase: "analyze",
          title: "The surprising one",
          instruction: "Set b = 2 and compare the width with the parent. Bigger b makes the graph narrower.",
          check: {
            describe: "b is set to 2 or more",
            test: (v) => Math.abs(v.params.b as number) >= 2,
          },
          hints: ["b multiplies x before the function acts, so x only has to travel half as far."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the four rules",
          instruction: "One sentence for each of a, b, h and k.",
          write: {
            prompt: "Write what each of a, b, h and k does to the parent graph.",
            placeholder: "a ... b ... h ... k ...",
          },
        },
      ],
    },
    {
      id: "match-mystery",
      title: "Match the mystery graph",
      question: "Given only a curve, can you recover its equation?",
      bands: ["9-12"],
      minutes: 25,
      standards: ["HSF.IF.C.7"],
      setup: { family: "quadratic", a: 1, b: 1, h: 0, k: 0, mystery: "1" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Read it before you slide",
          instruction: "The dashed mystery curve is a parabola opening downwards with its vertex at (2, 4). Predict its equation.",
          predict: {
            prompt: "Which equation matches a downward parabola with vertex (2, 4)?",
            options: ["y = (x + 2)² + 4", "y = −(x − 2)² + 4", "y = −(x + 2)² − 4", "y = (x − 2)² − 4"],
            correct: 1,
            reveal: "y = −(x − 2)² + 4. Opening downwards needs a < 0, and the vertex form puts h and k straight into the equation.",
          },
        },
        {
          id: "vertex-first",
          phase: "setup",
          title: "Place the vertex",
          instruction: "Move h and k until your vertex sits on the mystery curve's vertex.",
          check: {
            describe: "Vertex within 0.2 of (2, 4)",
            test: (v) =>
              Math.abs((v.facts.vertexX as number) - 2) < 0.2 &&
              Math.abs((v.facts.vertexY as number) - 4) < 0.2,
          },
          hints: ["h moves it sideways, k moves it up and down.", "Vertex (2, 4) means h = 2 and k = 4."],
        },
        {
          id: "shape",
          phase: "measure",
          title: "Now fix the shape",
          instruction: "Adjust a until the two curves lie on top of each other.",
          check: {
            describe: "The curves are within 0.05 everywhere",
            test: (v) => v.facts.mysteryOn === true && (v.facts.matchError as number) < 0.05,
          },
          hints: ["The mystery curve opens downwards, so a is negative.", "Try a = −1."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write your method",
          instruction: "Say which feature you read first and why that order works.",
          write: {
            prompt: "In what order did you find a, h and k, and why does that order help?",
            placeholder: "I found ... first because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "match-curve",
      title: "Match the mystery curve",
      brief: "Turn on a mystery curve and lay your graph exactly on top of it.",
      bands: ["9-12"],
      setup: { family: "sine", a: 1, b: 1, h: 0, k: 0, mystery: "1" },
      goal: {
        describe: "Within 0.15 of the mystery curve everywhere",
        test: (v) => v.facts.mysteryOn === true && (v.facts.matchError as number) <= 0.15,
      },
      stars: {
        two: {
          describe: "Within 0.05 everywhere",
          test: (v) => v.facts.mysteryOn === true && (v.facts.matchError as number) <= 0.05,
        },
        three: {
          describe: "An exact match",
          test: (v) => v.facts.mysteryOn === true && (v.facts.matchError as number) <= 0.005,
        },
      },
      hints: [
        "Match the height of the wave first — that is a.",
        "Then count how far apart the peaks are to get b.",
        "Shift last: h slides sideways, k slides up.",
      ],
    },
    {
      id: "two-roots",
      title: "Two roots, one vertex",
      brief: "Build a parabola with roots at −3 and 1 without touching the x-slider by trial and error.",
      bands: ["9-12"],
      setup: { family: "quadratic", a: 1, b: 1, h: 0, k: 0, mystery: "off" },
      goal: {
        describe: "Roots at −3 and 1",
        test: (v) =>
          v.facts.family === "quadratic" &&
          (v.facts.rootCount as number) === 2 &&
          Math.abs((v.facts.firstRoot as number) + 3) < 0.06 &&
          Math.abs((v.facts.vertexX as number) + 1) < 0.06,
      },
      hints: [
        "The vertex always sits halfway between the roots.",
        "Halfway between −3 and 1 is −1, so h = −1.",
        "The roots are 2 away from the vertex, so pick k to make a·(2)² = −k.",
      ],
    },
  ],
};
