import type { Readout, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { disc, label } from "@ui/draw";

/**
 * Unit Circle & Trig Waves — Grades 9-12.
 *
 * A point travels around the unit circle while the wave unrolls beside it at
 * exactly the same height. The circle and the wave share one vertical scale and
 * one baseline, so the dashed connector between them is literally horizontal:
 * the wave is not a picture of the circle, it is the circle's height, plotted
 * against angle.
 *
 * Confronts the belief that sine and cosine are ratios that only live inside
 * right triangles, and the belief that tangent is "undefined" for no reason.
 */

const TAU = Math.PI * 2;
/** Two full turns fit on the wave panel, so periodicity is visible at a glance. */
const MAX_ANGLE = 2 * TAU;

/* ------------------------------------------------------------------ *
 * Exact values at the special angles
 * ------------------------------------------------------------------ */

interface Exact { sin: string; cos: string; tan: string }

const S3 = "√3/2";
const S2 = "√2/2";
const H = "1/2";
const T3 = "√3/3";

/** Exact sine, cosine and tangent at every special angle, keyed by degrees. */
export const EXACT: Record<number, Exact> = {
  0: { sin: "0", cos: "1", tan: "0" },
  30: { sin: H, cos: S3, tan: T3 },
  45: { sin: S2, cos: S2, tan: "1" },
  60: { sin: S3, cos: H, tan: "√3" },
  90: { sin: "1", cos: "0", tan: "undefined" },
  120: { sin: S3, cos: `−${H}`, tan: "−√3" },
  135: { sin: S2, cos: `−${S2}`, tan: "−1" },
  150: { sin: H, cos: `−${S3}`, tan: `−${T3}` },
  180: { sin: "0", cos: "−1", tan: "0" },
  210: { sin: `−${H}`, cos: `−${S3}`, tan: T3 },
  225: { sin: `−${S2}`, cos: `−${S2}`, tan: "1" },
  240: { sin: `−${S3}`, cos: `−${H}`, tan: "√3" },
  270: { sin: "−1", cos: "0", tan: "undefined" },
  300: { sin: `−${S3}`, cos: H, tan: "−√3" },
  315: { sin: `−${S2}`, cos: S2, tan: "−1" },
  330: { sin: `−${H}`, cos: S3, tan: `−${T3}` },
};

const RADIAN_LABEL: Record<number, string> = {
  0: "0", 30: "π/6", 45: "π/4", 60: "π/3", 90: "π/2",
  120: "2π/3", 135: "3π/4", 150: "5π/6", 180: "π",
  210: "7π/6", 225: "5π/4", 240: "4π/3", 270: "3π/2",
  300: "5π/3", 315: "7π/4", 330: "11π/6",
};

/** Degrees in [0, 360) for an angle in radians, rounded to a tenth. */
export function degreesOf(angle: number): number {
  const deg = ((angle * 180) / Math.PI) % 360;
  return Math.round(((deg + 360) % 360) * 10) / 10;
}

/** The exact-value entry for this angle, or null if it is not a special one. */
export function exactAt(angle: number): { deg: number; exact: Exact; radians: string } | null {
  const deg = degreesOf(angle);
  const near = Math.round(deg / 15) * 15;
  if (Math.abs(deg - near) > 0.2) return null;
  const key = near % 360;
  const exact = EXACT[key];
  if (!exact) return null;
  return { deg: key, exact, radians: RADIAN_LABEL[key] ?? "" };
}

/** Tangent, clamped so a readout is always a finite number. */
export function safeTan(angle: number): number {
  const c = Math.cos(angle);
  if (Math.abs(c) < 1e-9) return Math.sin(angle) >= 0 ? 1e6 : -1e6;
  const t = Math.sin(angle) / c;
  return Math.max(-1e6, Math.min(1e6, t));
}

/** Mystery angles for the challenge, in degrees. */
const MYSTERY_DEG: Record<string, number> = { "1": 210, "2": 135, "3": 300 };

/** Signed difference between two angles in degrees, in (−180, 180]. */
export function angleGap(aDeg: number, bDeg: number): number {
  return ((((aDeg - bDeg) % 360) + 540) % 360) - 180;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  angle: number;
  /** Mirror of the angle parameter, so only a slider move re-seats the point. */
  seed: number;
}

function snapAngle(angle: number, snap: boolean): number {
  if (!snap) return angle;
  const step = Math.PI / 12; // 15°
  return Math.round(angle / step) * step;
}

const model: SimModel<State> = {
  init(params) {
    const seed = params.angle as number;
    return { angle: snapAngle(seed, params.snap as boolean), seed };
  },

  applyParams(state, params) {
    const seed = params.angle as number;
    if (seed === state.seed) return state;
    return { angle: snapAngle(seed, params.snap as boolean), seed };
  },

  step(state, dt, params) {
    const spin = params.spin as number;
    if (spin === 0 || dt === 0) return state;
    // Wrap after two turns so the unrolled wave restarts rather than running
    // off the panel — the repeat is the point being made.
    let angle = state.angle + spin * dt;
    if (angle >= MAX_ANGLE) angle -= MAX_ANGLE;
    if (angle < 0) angle += MAX_ANGLE;
    return { ...state, angle };
  },

  readouts(state, params) {
    const a = state.angle;
    const out: Readout[] = [
      { key: "angleDeg", label: "Angle", quantity: q(a, "angle"), unit: "°", semantic: "time", graphable: true },
      { key: "angleRad", label: "Angle (radians)", quantity: q(a, "angle"), unit: "rad", semantic: "time" },
      { key: "sin", label: "sin θ", quantity: q(Math.sin(a), "ratio"), semantic: "acceleration", graphable: true },
      { key: "cos", label: "cos θ", quantity: q(Math.cos(a), "ratio"), semantic: "velocity", graphable: true },
      { key: "tan", label: "tan θ", quantity: q(safeTan(a), "ratio"), semantic: "force", graphable: true },
    ];
    const target = MYSTERY_DEG[params.mystery as string];
    if (target !== undefined) {
      out.push({
        key: "mysteryGap", label: "Degrees from the mystery angle",
        quantity: q(Math.abs(angleGap(degreesOf(a), target)) * (Math.PI / 180), "angle"),
        unit: "°", semantic: "distance", graphable: true,
      });
    }
    return out;
  },

  facts(state, params) {
    const a = state.angle;
    const deg = degreesOf(a);
    const special = exactAt(a);
    const target = MYSTERY_DEG[params.mystery as string];
    return {
      angleDeg: deg,
      sin: Math.sin(a),
      cos: Math.cos(a),
      tan: safeTan(a),
      absTan: Math.abs(safeTan(a)),
      tanUndefined: Math.abs(Math.cos(a)) < 1e-6,
      isSpecial: special !== null,
      specialDeg: special ? special.deg : -1,
      mysteryOn: target !== undefined,
      mysteryGap: target === undefined ? 999 : Math.abs(angleGap(deg, target)),
      turns: a / TAU,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return v > 0 ? "> 1000" : "< −1000";
  const r = Math.round(v * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toFixed(3);
}

/** π-fraction tick labels along the wave's angle axis. */
const WAVE_TICKS: { at: number; text: string }[] = [
  { at: Math.PI / 2, text: "π/2" },
  { at: Math.PI, text: "π" },
  { at: (3 * Math.PI) / 2, text: "3π/2" },
  { at: TAU, text: "2π" },
  { at: (5 * Math.PI) / 2, text: "5π/2" },
  { at: 3 * Math.PI, text: "3π" },
  { at: (7 * Math.PI) / 2, text: "7π/2" },
  { at: 2 * TAU, text: "4π" },
];

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const a = state.angle;
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  const mode = params.trace as string;

  const colSin = theme.sci["acceleration"];
  const colCos = theme.sci["velocity"];
  const colTan = theme.sci["force"];

  // One shared vertical scale and baseline: this is what makes the dashed
  // connector between circle and wave exactly horizontal, and therefore true.
  const circleW = Math.min(width * 0.42, height * 1.05);
  const cx = circleW / 2;
  const cy = height / 2;
  const r = Math.min(circleW * 0.36, (height - 64) * 0.36);

  const waveLeft = circleW + 22;
  const waveRight = width - 14;
  const waveW = Math.max(40, waveRight - waveLeft);
  const toWaveX = (u: number) => waveLeft + (u / MAX_ANGLE) * waveW;
  const toY = (v: number) => cy - v * r;
  const clampV = (height / 2 - 18) / r;

  /* --- the circle ------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.28, cy); ctx.lineTo(cx + r * 1.28, cy);
  ctx.moveTo(cx, cy - r * 1.28); ctx.lineTo(cx, cy + r * 1.28);
  ctx.stroke();
  ctx.strokeStyle = theme.ink;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.restore();

  const px = cx + cos * r;
  const py = cy - sin * r;

  // Reference triangle: cosine along the x-axis, sine standing on it.
  if (overlays.triangle) {
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.10;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = colCos;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
    ctx.strokeStyle = colSin;
    ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.restore();
  }

  // The radius, and the swept angle.
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, -(a % TAU), a % TAU > 0);
  ctx.stroke();
  ctx.restore();

  // The tangent segment lives on the vertical line x = 1: its length is tan θ.
  if (mode === "tangent") {
    const t = Math.max(-clampV, Math.min(clampV, safeTan(a)));
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy - r * 1.28); ctx.lineTo(cx + r, cy + r * 1.28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = colTan;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy); ctx.lineTo(cx + r, toY(t));
    ctx.stroke();
    ctx.restore();
  }

  disc(ctx, px, py, 7, theme.accent, { stroke: theme.surface, lineWidth: 2 });

  // Exact values, only where they exist.
  const special = overlays.exact ? exactAt(a) : null;
  if (special) {
    const lines = [
      `θ = ${special.deg}° = ${special.radians}`,
      `sin θ = ${special.exact.sin}`,
      `cos θ = ${special.exact.cos}`,
      `tan θ = ${special.exact.tan}`,
    ];
    lines.forEach((line, i) => {
      label(ctx, line, 8, 18 + i * 17, theme, {
        size: 12,
        color: i === 0 ? theme.ink : i === 1 ? colSin : i === 2 ? colCos : colTan,
      });
    });
  } else {
    label(ctx, `θ = ${degreesOf(a).toFixed(1)}° = ${(a).toFixed(3)} rad`, 8, 18, theme, { size: 12 });
  }

  /* --- the wave --------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(waveLeft, cy); ctx.lineTo(waveRight, cy);
  ctx.moveTo(waveLeft, toY(1.25)); ctx.lineTo(waveLeft, toY(-1.25));
  ctx.stroke();
  // ±1 guide lines: the ceiling sine and cosine can never cross.
  ctx.setLineDash([3, 5]);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(waveLeft, toY(1)); ctx.lineTo(waveRight, toY(1));
  ctx.moveTo(waveLeft, toY(-1)); ctx.lineTo(waveRight, toY(-1));
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const tick of WAVE_TICKS) {
    if (tick.at > MAX_ANGLE + 1e-9) continue;
    ctx.fillText(tick.text, toWaveX(tick.at), cy + 5);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("1", waveLeft - 4, toY(1));
  ctx.fillText("−1", waveLeft - 4, toY(-1));
  ctx.restore();

  const drawTrace = (fn: (u: number) => number, color: string, dash: boolean) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    if (dash) ctx.setLineDash([6, 4]);
    let drawing = false;
    ctx.beginPath();
    const steps = 480;
    for (let i = 0; i <= steps; i++) {
      const u = (a * i) / steps;
      const v = fn(u);
      if (!Number.isFinite(v) || Math.abs(v) > clampV) { drawing = false; continue; }
      const x = toWaveX(u);
      const y = toY(v);
      if (!drawing) { ctx.moveTo(x, y); drawing = true; } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
    ctx.restore();
  };

  if (mode === "tangent") {
    // Vertical asymptotes, drawn before the curve so the curve sits on top.
    ctx.save();
    ctx.strokeStyle = colTan;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let u = Math.PI / 2; u <= MAX_ANGLE; u += Math.PI) {
      ctx.moveTo(toWaveX(u), toY(clampV));
      ctx.lineTo(toWaveX(u), toY(-clampV));
    }
    ctx.stroke();
    ctx.restore();
    drawTrace((u) => Math.tan(u), colTan, false);
  } else {
    if (mode === "sine" || mode === "both") drawTrace(Math.sin, colSin, false);
    if (mode === "cosine" || mode === "both") drawTrace(Math.cos, colCos, mode === "both");
  }

  /* --- the connector: circle height equals wave height ------------- */
  const value = mode === "cosine" ? cos : mode === "tangent" ? safeTan(a) : sin;
  const shown = Math.max(-clampV, Math.min(clampV, value));
  const endX = toWaveX(a);
  const endY = toY(shown);

  if (mode === "cosine") {
    // Swing the cosine leg a quarter turn up onto the vertical axis, so the
    // horizontal connector below is measuring the same length.
    ctx.save();
    ctx.strokeStyle = colCos;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = (Math.PI / 2) * (i / 24);
      const x = cx + cos * Math.cos(t) * r;
      const y = cy - cos * Math.sin(t) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = mode === "cosine" ? colCos : mode === "tangent" ? colTan : colSin;
  ctx.globalAlpha = 0.75;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mode === "cosine" ? cx : px, endY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(endX, cy);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();

  disc(ctx, endX, endY, 6, mode === "cosine" ? colCos : mode === "tangent" ? colTan : colSin,
    { stroke: theme.surface, lineWidth: 2 });

  if (mode === "tangent" && Math.abs(cos) < 0.02) {
    label(ctx, "tan θ is undefined here", endX, toY(clampV * 0.8), theme, {
      align: "center", size: 12, color: colTan,
    });
  }

  // Numeric readout of all three, always on, always the same three colours.
  const rowY = height - 16;
  label(ctx, `sin θ = ${fmt(sin)}`, waveLeft, rowY, theme, { size: 12, color: colSin });
  label(ctx, `cos θ = ${fmt(cos)}`, waveLeft + waveW * 0.34, rowY, theme, { size: 12, color: colCos });
  label(ctx, Math.abs(cos) < 1e-6 ? "tan θ undefined" : `tan θ = ${fmt(safeTan(a))}`,
    waveLeft + waveW * 0.68, rowY, theme, { size: 12, color: colTan });

  // The mystery angle for the challenge: the values, never the angle.
  const target = MYSTERY_DEG[params.mystery as string];
  if (target !== undefined) {
    const trad = (target * Math.PI) / 180;
    label(ctx, `mystery: sin = ${fmt(Math.sin(trad))}, cos = ${fmt(Math.cos(trad))}`,
      width - 10, 18, theme, { align: "right", size: 12, color: theme.sci["field"] });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const unitCircleSim: SimManifest<State> = {
  id: "math.unit-circle",
  title: "Unit Circle & Trig Waves",
  tagline: "Walk a point around the circle and watch the sine wave unroll from its height.",
  subject: "math",
  bands: ["9-12"],
  grades: [9, 10, 11, 12],
  standards: {
    ccssMath: [
      "HSF.TF.A.1", "HSF.TF.A.2", "HSF.TF.A.3", "HSF.TF.A.4",
      "HSF.TF.B.5", "HSF.TF.C.8", "HSG.SRT.C.6",
    ],
  },
  learningGoals: [
    "Explain the sine wave as the height of a point moving around the unit circle.",
    "State sine, cosine and tangent exactly at the special angles, in degrees and radians.",
    "Explain why tangent is undefined wherever cosine is zero.",
  ],
  misconceptions: [
    "Sine and cosine only make sense for angles inside a right triangle",
    "Angles beyond 90° have no sine or cosine",
    "Tangent is undefined at 90° for no particular reason",
  ],
  interactionHint: "Drag the angle, or press play to let the point walk around.",
  params: {
    angle: {
      type: "number", label: "Angle θ", kind: "angle", unit: "°",
      min: 0, max: MAX_ANGLE, step: Math.PI / 180, default: Math.PI / 6,
      marks: [
        { value: Math.PI / 6, label: "30°" },
        { value: Math.PI / 4, label: "45°" },
        { value: Math.PI / 3, label: "60°" },
        { value: Math.PI / 2, label: "90°" },
        { value: Math.PI, label: "180°" },
        { value: (3 * Math.PI) / 2, label: "270°" },
        { value: TAU, label: "360°" },
      ],
    },
    trace: {
      type: "option", label: "Trace",
      options: [
        { value: "sine", label: "Sine" },
        { value: "cosine", label: "Cosine" },
        { value: "both", label: "Both" },
        { value: "tangent", label: "Tangent" },
      ],
      default: "sine",
    },
    spin: {
      type: "number", label: "Spin speed", kind: "ratio",
      min: 0, max: 2, step: 0.05, default: 0.6,
      help: "Radians per second once you press play. Set it to 0 to hold still.",
    },
    snap: {
      type: "boolean", label: "Snap to special angles", default: true,
      help: "Holds the slider to multiples of 15°, where exact values exist.",
    },
    mystery: {
      type: "option", label: "Mystery angle",
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
    { key: "triangle", label: "Reference triangle", default: true },
    { key: "exact", label: "Exact values", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "where-sine-comes-from",
      title: "Where does the sine wave come from?",
      question: "Why does going round and round in a circle produce a wave?",
      bands: ["9-12"],
      minutes: 20,
      standards: ["HSF.TF.A.2"],
      setup: { angle: 0, trace: "sine", spin: 0.6, snap: false, mystery: "off" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the shape",
          instruction: "The point will walk once around the circle. Predict the shape its height traces.",
          predict: {
            prompt: "Plotting the point's height against the angle, what shape appears?",
            options: [
              "A straight slanted line",
              "A hump that rises and stops",
              "A wave rising to 1, falling to −1, and returning",
              "A circle again",
            ],
            correct: 2,
            reveal: "A wave. Height rises to 1 at 90°, back to 0 at 180°, down to −1 at 270°, and home at 360°.",
          },
        },
        {
          id: "trace",
          phase: "measure",
          title: "Walk it all the way round",
          instruction: "Press play and let the point complete a full turn. Watch the dashed connector stay level.",
          check: {
            describe: "Past 300°",
            test: (v) => (v.facts.angleDeg as number) >= 300,
          },
          hints: ["The connector is horizontal because the wave's height is the circle's height."],
        },
        {
          id: "quarters",
          phase: "measure",
          title: "Record the quarter points",
          instruction: "Stop at 0°, 90°, 180° and 270° and record sine each time.",
          requireData: 4,
          hints: ["Turn snapping on to land exactly on the quarter angles."],
        },
        {
          id: "cosine",
          phase: "analyze",
          title: "Now trace cosine",
          instruction: "Switch the trace to Both. Cosine is the same wave, started a quarter turn earlier.",
          check: {
            describe: "Tracing both waves",
            test: (v) => v.params.trace === "both",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the wave",
          instruction: "Write where the wave's height, its zeros and its repeat all come from.",
          write: {
            prompt: "Where does each part of the sine wave come from on the circle?",
            placeholder: "The height of the wave is ... It repeats because ...",
          },
        },
      ],
    },
    {
      id: "tangent-undefined",
      title: "Why is tangent undefined at 90°?",
      question: "Tangent grows without limit near 90°. What breaks?",
      bands: ["9-12"],
      minutes: 20,
      standards: ["HSF.TF.A.3"],
      setup: { angle: Math.PI / 4, trace: "tangent", spin: 0, snap: false, mystery: "off" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you slide",
          instruction: "Tangent is sine divided by cosine. Predict what happens as the angle approaches 90°.",
          predict: {
            prompt: "As θ climbs from 80° to 89.9°, tan θ does what?",
            options: [
              "Settles down to 1",
              "Grows without limit",
              "Falls towards 0",
              "Stays about the same",
            ],
            correct: 1,
            reveal: "It grows without limit. Cosine is heading to 0, and dividing by a shrinking number gives an exploding result.",
          },
        },
        {
          id: "approach",
          phase: "measure",
          title: "Creep up on 90°",
          instruction: "Turn snapping off and slide the angle to within a degree of 90°.",
          check: {
            describe: "tan θ above 50",
            test: (v) => (v.facts.absTan as number) > 50,
          },
          hints: ["Watch the tangent segment on the line x = 1 stretch off the screen."],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Record the climb",
          instruction: "Record tan θ at 80°, 85°, 89° and 89.5°.",
          requireData: 4,
        },
        {
          id: "other-side",
          phase: "analyze",
          title: "Cross over",
          instruction: "Go past 90° to 91°. Tangent reappears as a large negative number, never as infinity.",
          check: {
            describe: "Angle past 90°",
            test: (v) => (v.facts.angleDeg as number) > 90 && (v.facts.angleDeg as number) < 180,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what is undefined",
          instruction: "Write why tan 90° has no value at all, rather than an infinite one.",
          write: {
            prompt: "Why is tan 90° undefined rather than infinite?",
            placeholder: "At 90° cosine is exactly 0, so ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "name-that-angle",
      title: "Name that angle",
      brief: "You are given sin θ and cos θ. Find the angle.",
      bands: ["9-12"],
      setup: { mystery: "1", angle: 0, trace: "both", spin: 0, snap: true },
      goal: {
        describe: "Within 2° of the mystery angle",
        test: (v) => v.facts.mysteryOn === true && (v.facts.mysteryGap as number) <= 2,
      },
      stars: {
        two: {
          describe: "Within 0.5°",
          test: (v) => v.facts.mysteryOn === true && (v.facts.mysteryGap as number) <= 0.5,
        },
        three: {
          describe: "Exactly on a special angle",
          test: (v) =>
            v.facts.mysteryOn === true && (v.facts.mysteryGap as number) <= 0.2 &&
            v.facts.isSpecial === true,
        },
      },
      hints: [
        "The signs of sine and cosine tell you the quadrant before anything else.",
        "Both negative means the third quadrant, between 180° and 270°.",
        "A value of √3/2 ≈ 0.866 belongs to a 30° or 60° reference angle.",
      ],
    },
    {
      id: "same-sine",
      title: "Two angles, one sine",
      brief: "Find a second angle beyond 90° with exactly the same sine as 30°.",
      bands: ["9-12"],
      setup: { angle: Math.PI / 6, trace: "sine", spin: 0, snap: true, mystery: "off" },
      goal: {
        describe: "sin θ = 1/2 with θ between 90° and 360°",
        test: (v) =>
          Math.abs((v.facts.sin as number) - 0.5) < 0.005 &&
          (v.facts.angleDeg as number) > 90 && (v.facts.angleDeg as number) < 360,
      },
      hints: [
        "Sine is a height. Two different points on the circle can sit at the same height.",
        "Reflect the point across the vertical axis: 180° − 30°.",
      ],
    },
  ],
};
