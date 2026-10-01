import type { ParamValues, RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, caption, comet, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere,
  vignette,
} from "@ui/scene";

/**
 * Motion Graphs — Grade 8, Unit A topics A1 and A2.
 *
 * A cart runs along a bench track while its position-time and velocity-time
 * graphs draw themselves live, side by side with the motion itself. The whole
 * design exists to make one link visible: the *slope* of the position-time
 * graph is the *height* of the velocity-time graph at the same instant, and
 * the *area* under the velocity-time graph is the displacement.
 *
 * Three ways to make the cart move:
 *   script — assemble a three-part motion story from named behaviours,
 *   drive  — hold a speed dial and steer the cart yourself,
 *   match  — a target position-time graph is drawn; reproduce it by driving.
 *
 * Distance and displacement are tracked separately and diverge the moment the
 * cart reverses, which is exactly subtopic A1.1. A moving-observer toggle
 * re-plots everything in a second reference frame (A1.4): the same motion,
 * a different graph.
 */

/* ------------------------------------------------------------------ *
 * The motion script
 * ------------------------------------------------------------------ */

/** Metres of usable bench track. End stops park the cart. */
export const TRACK_LENGTH = 20;
/** Seconds each named behaviour in the script runs for. */
export const SEGMENT_SECONDS = 4;
const SCRIPT_SECONDS = SEGMENT_SECONDS * 3;

/**
 * Target velocity of each named behaviour, in m/s. The cart never jumps to
 * these: it accelerates toward them at the chosen rate, so every change of
 * behaviour appears as a real ramp on the velocity-time graph and a real
 * curve on the position-time graph.
 */
export const SEGMENT_TARGETS: Record<string, number> = {
  rest: 0,
  slow: 1,
  fast: 2.5,
  back: -1.5,
};

const SEGMENT_LABELS: Record<string, string> = {
  rest: "at rest",
  slow: "slow forward",
  fast: "fast forward",
  back: "reverse",
};

/** Velocity the script asks for at time t. After the script, it comes to rest. */
export function scriptTarget(params: ParamValues, t: number): number {
  const index = Math.floor(t / SEGMENT_SECONDS);
  if (index < 0 || index >= 3) return 0;
  const key = [params.segA, params.segB, params.segC][index] as string;
  return SEGMENT_TARGETS[key] ?? 0;
}

/** The graph the student must reproduce in Match mode: corners in (s, m). */
export const MATCH_TARGET: { t: number; x: number }[] = [
  { t: 0, x: 4 },
  { t: 2, x: 4 },
  { t: 6, x: 14 },
  { t: 9, x: 14 },
  { t: 13, x: 6 },
  { t: 18, x: 6 },
];

/** How close, in metres, counts as being on the target graph. */
export const MATCH_TOLERANCE = 1;
const MATCH_SECONDS = MATCH_TARGET[MATCH_TARGET.length - 1].t;

/** Position the target graph demands at time t (piecewise linear, clamped). */
export function matchTargetPosition(t: number): number {
  const pts = MATCH_TARGET;
  if (t <= pts[0].t) return pts[0].x;
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i].t) {
      const f = (t - pts[i - 1].t) / (pts[i].t - pts[i - 1].t);
      return pts[i - 1].x + f * (pts[i].x - pts[i - 1].x);
    }
  }
  return pts[pts.length - 1].x;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface Sample {
  t: number;
  x: number;
  v: number;
}

interface State {
  t: number;
  /** Position along the bench, metres from the left end stop. */
  x: number;
  v: number;
  /** Where this run started, so displacement has a reference. */
  x0: number;
  /** Path length actually travelled — grows even when the cart reverses. */
  distance: number;
  /** Recorded trace, in the ground frame. Down-sampled for the graphs. */
  samples: Sample[];
  /** Seconds spent inside the tolerance band in Match mode. */
  onTargetTime: number;
  /** True while the cart is pinned against an end stop. */
  parked: boolean;
}

const SAMPLE_INTERVAL = 0.05;
const MAX_SAMPLES = 1200;
/** Seconds of history the graphs show before they start scrolling. */
const GRAPH_WINDOW = 20;

function freshState(params: ParamValues): State {
  const x0 = params.startX as number;
  return {
    t: 0, x: x0, v: 0, x0,
    distance: 0,
    samples: [{ t: 0, x: x0, v: 0 }],
    onTargetTime: 0,
    parked: false,
  };
}

/**
 * Velocity the current mode is asking for right now. The speed dial always
 * wins while it is off zero: nudging it mid-script takes over the driving,
 * and returning it to zero hands control back to the script.
 */
function demandedVelocity(state: State, params: ParamValues): number {
  const drive = params.drive as number;
  if (params.mode !== "script" || drive !== 0) return drive;
  return scriptTarget(params, state.t);
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    // Changing what the motion *is* restarts the run so the graph is honest
    // about a single story. Changing how it is *viewed* leaves it alone.
    const restarts = ["mode", "startX", "segA", "segB", "segC"];
    if (restarts.some((k) => params[k] !== prev[k])) return freshState(params);
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;

    const accel = params.accel as number;
    const target = demandedVelocity(state, params);

    // Approach the demanded velocity at a fixed acceleration, never overshoot.
    const gap = target - state.v;
    const dv = Math.sign(gap) * Math.min(Math.abs(gap), accel * dt);
    const v1 = state.v + dv;

    // Trapezoid step: exact for a constant acceleration, so a student checking
    // x = ½at² against the graph finds the textbook number, not a rounding.
    const avg = (state.v + v1) / 2;
    let x1 = state.x + avg * dt;

    // Path length. When the velocity changes sign inside one step the average
    // is not the distance travelled, so split the step at the turning point.
    let travelled: number;
    if (state.v * v1 < 0) {
      const a = dv / dt;
      const tZero = Math.abs(state.v / a);
      travelled = (Math.abs(state.v) * tZero + Math.abs(v1) * (dt - tZero)) / 2;
    } else {
      travelled = Math.abs(avg) * dt;
    }

    let v = v1;
    let parked = false;
    if (x1 <= 0) {
      travelled -= -x1;
      x1 = 0;
      if (v < 0) { v = 0; parked = true; }
    } else if (x1 >= TRACK_LENGTH) {
      travelled -= x1 - TRACK_LENGTH;
      x1 = TRACK_LENGTH;
      if (v > 0) { v = 0; parked = true; }
    }

    const t = state.t + dt;

    let onTargetTime = state.onTargetTime;
    if (params.mode === "match" && t <= MATCH_SECONDS) {
      if (Math.abs(x1 - matchTargetPosition(t)) <= MATCH_TOLERANCE) onTargetTime += dt;
    }

    let samples = state.samples;
    const last = samples[samples.length - 1];
    if (!last || t - last.t >= SAMPLE_INTERVAL) {
      samples = samples.length >= MAX_SAMPLES ? samples.slice(1) : samples.slice();
      samples.push({ t, x: x1, v });
    }

    return {
      ...state,
      t, x: x1, v,
      distance: state.distance + Math.max(0, travelled),
      samples,
      onTargetTime,
      parked,
    };
  },

  readouts(state, params) {
    const moving = params.viewFrame === "observer";
    const vObs = moving ? (params.observerSpeed as number) : 0;
    const xObs = moving ? (params.startX as number) + vObs * state.t : 0;
    const x = state.x - xObs;
    const v = state.v - vObs;
    const displacement = state.x - state.x0 - (xObs - (moving ? (params.startX as number) : 0));
    const target = demandedVelocity(state, params);
    const accel = Math.abs(target - state.v) < 1e-9
      ? 0
      : Math.sign(target - state.v) * (params.accel as number);

    return [
      { key: "x", label: "Position", quantity: q(x, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "v", label: "Velocity", quantity: q(v, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "speed", label: "Speed", quantity: q(Math.abs(v), "velocity"), unit: "m/s", semantic: "velocity", graphable: true, bands: ["3-5", "6-8"] },
      { key: "distance", label: "Distance travelled", quantity: q(state.distance, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "displacement", label: "Displacement", quantity: q(displacement, "length"), unit: "m", semantic: "distance", graphable: true, bands: ["6-8", "9-12"] },
      {
        key: "avgSpeed", label: "Average speed",
        quantity: q(state.t > 0 ? state.distance / state.t : 0, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "avgVelocity", label: "Average velocity",
        quantity: q(state.t > 0 ? displacement / state.t : 0, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "a", label: "Acceleration", quantity: q(accel, "acceleration"),
        unit: "m/s²", semantic: "acceleration", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "vSeen", label: "Velocity the observer measures",
        quantity: q(state.v - (params.observerSpeed as number), "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "matchScore", label: "On the target graph",
        quantity: q(state.t > 0 ? state.onTargetTime / Math.min(state.t, MATCH_SECONDS) : 0, "percent"),
        unit: "%", semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const displacement = state.x - state.x0;
    const score = state.t > 0 ? state.onTargetTime / Math.min(state.t, MATCH_SECONDS) : 0;
    // The tangent claim, checked against the recorded trace: the slope between
    // the last two samples must equal the velocity at that instant.
    const n = state.samples.length;
    let slope = state.v;
    if (n >= 2) {
      const a = state.samples[n - 2], b = state.samples[n - 1];
      if (b.t > a.t) slope = (b.x - a.x) / (b.t - a.t);
    }
    return {
      t: state.t,
      x: state.x,
      v: state.v,
      distance: state.distance,
      displacement,
      reversed: state.distance - Math.abs(displacement) > 0.05,
      avgSpeed: state.t > 0 ? state.distance / state.t : 0,
      avgVelocity: state.t > 0 ? displacement / state.t : 0,
      vObserved: state.v - (params.observerSpeed as number),
      graphSlope: slope,
      matchScore: score,
      matchComplete: params.mode === "match" && state.t >= MATCH_SECONDS,
      onTarget: params.mode === "match"
        && Math.abs(state.x - matchTargetPosition(state.t)) <= MATCH_TOLERANCE,
      parked: state.parked,
      samples: state.samples.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

interface Panel {
  x: number; y: number; w: number; h: number;
  /** Map a time in seconds to a screen x. */
  X: (t: number) => number;
  /** Map a plotted quantity to a screen y. */
  Y: (v: number) => number;
  t0: number; t1: number; v0: number; v1: number;
}

function makePanel(
  x: number, y: number, w: number, h: number,
  t0: number, t1: number, v0: number, v1: number,
): Panel {
  const spanT = Math.max(1e-6, t1 - t0);
  const spanV = Math.max(1e-6, v1 - v0);
  return {
    x, y, w, h, t0, t1, v0, v1,
    X: (t) => x + ((t - t0) / spanT) * w,
    Y: (v) => y + h - ((v - v0) / spanV) * h,
  };
}

/** A plot card: ground, frame, grid, ticks and axis names. */
function panelChrome(
  ctx: CanvasRenderingContext2D, p: Panel, theme: ThemeColors,
  opts: { title: string; yUnit: string; tickV: number; tickT: number; compact: boolean; showGrid: boolean },
) {
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? hexA(theme.surface, 0.62) : hexA(theme.surface, 0.82);
  roundRect(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (opts.showGrid) {
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startT = Math.ceil(p.t0 / opts.tickT) * opts.tickT;
    for (let t = startT; t <= p.t1 + 1e-6; t += opts.tickT) {
      const sx = Math.round(p.X(t)) + 0.5;
      ctx.moveTo(sx, p.y + 2);
      ctx.lineTo(sx, p.y + p.h - 2);
    }
    const startV = Math.ceil(p.v0 / opts.tickV) * opts.tickV;
    for (let v = startV; v <= p.v1 + 1e-6; v += opts.tickV) {
      const sy = Math.round(p.Y(v)) + 0.5;
      ctx.moveTo(p.x + 2, sy);
      ctx.lineTo(p.x + p.w - 2, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Axis lines: the zero line matters on a velocity graph, so it is drawn solid.
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const zeroY = p.v0 < 0 && p.v1 > 0 ? p.Y(0) : p.y + p.h;
  ctx.moveTo(p.x, zeroY);
  ctx.lineTo(p.x + p.w, zeroY);
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y + p.h);
  ctx.stroke();
  ctx.restore();

  if (!opts.compact) {
    ctx.save();
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const startV = Math.ceil(p.v0 / opts.tickV) * opts.tickV;
    for (let v = startV; v <= p.v1 + 1e-6; v += opts.tickV) {
      const text = Math.abs(v % 1) < 1e-9 ? String(Math.round(v)) : v.toFixed(1);
      ctx.fillText(text, p.x - 4, p.Y(v));
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const startT = Math.ceil(p.t0 / opts.tickT) * opts.tickT;
    for (let t = startT; t <= p.t1 + 1e-6; t += opts.tickT) {
      ctx.fillText(String(Math.round(t)), p.X(t), p.y + p.h + 4);
    }
    ctx.restore();
  }

  caption(ctx, p.x + 8, p.y + 12, opts.title, theme, { size: 12, weight: 700 });
  if (!opts.compact) {
    caption(ctx, p.x + p.w - 6, p.y + p.h + 12, "time (s)", theme, {
      size: 10, align: "right", color: theme.inkSoft,
    });
    caption(ctx, p.x + 8, p.y + 26, opts.yUnit, theme, { size: 10, color: theme.inkSoft });
  }
}

/** Draw a recorded trace inside a panel, clipped to it. */
function plotTrace(
  ctx: CanvasRenderingContext2D, p: Panel, samples: Sample[],
  pick: (s: Sample) => number, color: string, width: number,
) {
  if (samples.length < 2) return;
  ctx.save();
  roundRect(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  let started = false;
  for (const s of samples) {
    if (s.t < p.t0 - 0.2) continue;
    const sx = p.X(s.t), sy = p.Y(pick(s));
    if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;

  const compact = width < 460 || height < 300;
  const moving = params.viewFrame === "observer";
  const vObs = moving ? (params.observerSpeed as number) : 0;
  const xObs = moving ? (params.startX as number) + vObs * state.t : 0;

  const cDist = theme.sci["distance"];
  const cVel = theme.sci["velocity"];
  const cAcc = theme.sci["acceleration"];
  const cTime = theme.sci["time"];

  /* ---- layout: the bench on top, the two graphs beneath it ---- */
  const trackH = Math.max(96, Math.min(height * 0.44, 250));
  const padSide = compact ? 26 : 42;
  const gapY = compact ? 22 : 30;
  const graphTop = trackH + (compact ? 8 : 14);
  const graphH = Math.max(60, height - graphTop - gapY - (compact ? 6 : 14));
  const graphW = (width - padSide * 2 - (compact ? 14 : 26)) / 2;

  /* ---- the place: a lab bench under a bright room ---- */
  const railY = trackH * 0.66;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, trackH);
  ctx.clip();
  sky(ctx, width, trackH, theme, "day", railY);
  groundPlane(ctx, railY + 14, 0, width, trackH, theme, "lab");
  ctx.restore();

  const x0s = padSide;
  const x1s = width - padSide;
  const X = (m: number) => x0s + (m / TRACK_LENGTH) * (x1s - x0s);
  const mPerPx = TRACK_LENGTH / Math.max(1, x1s - x0s);

  /* ---- the rail, its end stops and its metre marks ---- */
  material(ctx, x0s - 10, railY + 2, x1s - x0s + 20, 8, theme.inkSoft, 3);
  material(ctx, x0s - 14, railY - 22, 8, 26, theme.inkSoft, 2);
  material(ctx, x1s + 6, railY - 22, 8, 26, theme.inkSoft, 2);

  const markStep = compact ? 5 : 2;
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let m = 0; m <= TRACK_LENGTH; m += markStep) {
    const sx = Math.round(X(m)) + 0.5;
    ctx.moveTo(sx, railY + 10);
    ctx.lineTo(sx, railY + (m % (markStep * 2) === 0 ? 18 : 14));
  }
  ctx.stroke();
  if (!compact) {
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let m = 0; m <= TRACK_LENGTH; m += markStep * 2) ctx.fillText(String(m), X(m), railY + 20);
  }
  ctx.restore();

  /* ---- the target the student is chasing, drawn on the bench too ---- */
  if (params.mode === "match") {
    const tx = matchTargetPosition(state.t);
    ctx.save();
    ctx.fillStyle = hexA(cAcc, 0.16);
    ctx.fillRect(X(tx - MATCH_TOLERANCE), railY - 40, (2 * MATCH_TOLERANCE) / mPerPx, 44);
    ctx.strokeStyle = hexA(cAcc, 0.8);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(X(tx), railY - 44);
    ctx.lineTo(X(tx), railY + 6);
    ctx.stroke();
    ctx.restore();
    if (!compact) {
      caption(ctx, X(tx), railY - 50, "target", theme, { align: "center", size: 10, color: cAcc });
    }
  }

  /* ---- the trail the cart has actually left ---- */
  if (overlays.trace && state.samples.length > 1) {
    const tail = state.samples.slice(-90).map((s) => ({ x: X(s.x), y: railY - 12 }));
    comet(ctx, tail, cVel, 3);
  }

  /* ---- the cart ---- */
  const cartW = compact ? 30 : 42;
  const cartH = compact ? 14 : 18;
  const wheelR = compact ? 4 : 5.5;
  const cx = X(state.x);
  const bodyY = railY - wheelR * 2 - cartH;
  contactShadow(ctx, cx, railY + 4, cartW * 0.4, 2);
  material(ctx, cx - cartW / 2, bodyY, cartW, cartH, theme.accent, 4);
  sphere(ctx, cx - cartW * 0.26, railY - wheelR, wheelR, theme.inkSoft);
  sphere(ctx, cx + cartW * 0.26, railY - wheelR, wheelR, theme.inkSoft);
  // A driver, so the thing on the track is somebody rather than a rectangle.
  sphere(ctx, cx, bodyY - (compact ? 5 : 7), compact ? 5 : 7, theme.accent, { glow: 0.15 });

  /* ---- the velocity arrow: the quantity the v-t graph is about ---- */
  const vShown = state.v - vObs;
  if (overlays.vectors && Math.abs(vShown) > 0.02) {
    const scale = Math.min(46, 34 / Math.max(0.6, Math.abs(vShown))) * 1.6;
    arrow(ctx, cx, bodyY + cartH / 2, cx + vShown * scale, bodyY + cartH / 2, cVel, {
      width: 3, label: band === "3-5" ? undefined : "v",
    });
  }

  /* ---- the moving observer (A1.4) ---- */
  if (moving || band !== "3-5") {
    const ox = X((params.startX as number) + (params.observerSpeed as number) * state.t);
    if (ox > x0s - 40 && ox < x1s + 40) {
      contactShadow(ctx, ox, railY + 4, 12, 2);
      material(ctx, ox - 13, railY - 20, 26, 7, cTime, 3);
      sphere(ctx, ox, railY - 30, compact ? 7 : 9, cTime);
      sphere(ctx, ox - 7, railY - 3, 3.5, theme.inkSoft);
      sphere(ctx, ox + 7, railY - 3, 3.5, theme.inkSoft);
      if (!compact) {
        caption(ctx, ox, railY - 46, "observer", theme, { align: "center", size: 10, color: cTime });
      }
    }
  }

  /* ---- distance and displacement, drawn as the different things they are ---- */
  if (band !== "3-5" && !compact) {
    const laneY = railY + 34;
    const startS = X(state.x0);
    ctx.save();
    ctx.strokeStyle = hexA(cDist, 0.35);
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    // Path actually travelled, laid out to scale from the starting point.
    ctx.beginPath();
    ctx.moveTo(startS, laneY + 12);
    ctx.lineTo(Math.min(x1s, startS + state.distance / mPerPx), laneY + 12);
    ctx.stroke();
    ctx.restore();
    caption(ctx, x0s, laneY + 12, `distance ${state.distance.toFixed(1)} m`, theme, {
      size: 10, color: cDist,
    });
    if (Math.abs(state.x - state.x0) > 0.15) {
      arrow(ctx, startS, laneY, X(state.x), laneY, cDist, { width: 2 });
    }
    caption(ctx, x1s, laneY - 10, `displacement ${(state.x - state.x0).toFixed(1)} m`, theme, {
      size: 10, align: "right", color: cDist,
    });
  }

  /* ---- live numbers, on the stage beside the cart ---- */
  if (band !== "3-5") {
    badge(ctx, cx, bodyY - (compact ? 22 : 28), `${(state.x - xObs).toFixed(1)} m`, theme, {
      align: "center", color: cDist,
    });
  }
  if (!compact) {
    badge(ctx, cx, bodyY + cartH + 16, `${vShown.toFixed(2)} m/s`, theme, {
      align: "center", color: cVel,
    });
  }
  if (!compact) {
    const overridden = params.mode === "script" && (params.drive as number) !== 0;
    const name = params.mode === "script" && !overridden
      ? SEGMENT_LABELS[[params.segA, params.segB, params.segC][
          Math.min(2, Math.floor(state.t / SEGMENT_SECONDS))] as string] ?? "at rest"
      : params.mode === "match" ? "match the graph" : "you are driving";
    caption(ctx, 12, 18,
      params.mode === "script" && !overridden && state.t >= SCRIPT_SECONDS ? "script finished" : name,
      theme, { size: 12, color: theme.inkSoft });
    if (moving) {
      caption(ctx, 12, 34, `measured from the observer (${vObs.toFixed(1)} m/s)`, theme, {
        size: 10, color: cTime,
      });
    }
  }

  /* ---- the two graphs ---- */
  const tEnd = Math.max(GRAPH_WINDOW, Math.ceil(state.t / 5) * 5);
  const tStart = tEnd - GRAPH_WINDOW;

  // Position axis: fit the frame actually being plotted.
  let pLo = 0, pHi = TRACK_LENGTH;
  if (moving) {
    pLo = 0; pHi = 0;
    for (const s of state.samples) {
      const rel = s.x - ((params.startX as number) + vObs * s.t);
      pLo = Math.min(pLo, rel); pHi = Math.max(pHi, rel);
    }
    const pad = Math.max(2, (pHi - pLo) * 0.15);
    pLo -= pad; pHi += pad;
    if (pHi - pLo < 8) { const mid = (pLo + pHi) / 2; pLo = mid - 4; pHi = mid + 4; }
  }

  const pt = makePanel(padSide, graphTop, graphW, graphH, tStart, tEnd, pLo, pHi);
  const vt = makePanel(width - padSide - graphW, graphTop, graphW, graphH, tStart, tEnd, -3.4, 3.4);

  const tickT = 5;
  panelChrome(ctx, pt, theme, {
    title: "position - time", yUnit: "metres", tickV: moving ? Math.max(2, Math.round((pHi - pLo) / 5)) : 5,
    tickT, compact, showGrid: overlays.grid !== false,
  });
  panelChrome(ctx, vt, theme, {
    title: "velocity - time", yUnit: "metres per second", tickV: 1,
    tickT, compact, showGrid: overlays.grid !== false,
  });

  const framedX = (s: Sample) => s.x - (moving ? (params.startX as number) + vObs * s.t : 0);
  const framedV = (s: Sample) => s.v - vObs;

  /* ---- area under the velocity graph = displacement ---- */
  if (overlays.area && state.samples.length > 1) {
    ctx.save();
    roundRect(ctx, vt.x, vt.y, vt.w, vt.h, 8);
    ctx.clip();
    const zero = vt.Y(0);
    let prev: Sample | null = null;
    for (const s of state.samples) {
      if (prev && s.t >= tStart) {
        const v = framedV(s);
        ctx.fillStyle = hexA(v >= 0 ? cDist : cAcc, 0.22);
        ctx.beginPath();
        ctx.moveTo(vt.X(prev.t), zero);
        ctx.lineTo(vt.X(prev.t), vt.Y(framedV(prev)));
        ctx.lineTo(vt.X(s.t), vt.Y(v));
        ctx.lineTo(vt.X(s.t), zero);
        ctx.closePath();
        ctx.fill();
      }
      prev = s;
    }
    ctx.restore();
    if (!compact) {
      caption(ctx, vt.x + 8, vt.y + vt.h - 10, "area = displacement", theme, {
        size: 10, color: cDist,
      });
    }
  }

  /* ---- the target graph, in Match mode ---- */
  if (params.mode === "match" && !moving) {
    ctx.save();
    roundRect(ctx, pt.x, pt.y, pt.w, pt.h, 8);
    ctx.clip();
    ctx.fillStyle = hexA(cAcc, 0.13);
    ctx.beginPath();
    ctx.moveTo(pt.X(MATCH_TARGET[0].t), pt.Y(MATCH_TARGET[0].x + MATCH_TOLERANCE));
    for (const c of MATCH_TARGET) ctx.lineTo(pt.X(c.t), pt.Y(c.x + MATCH_TOLERANCE));
    for (let i = MATCH_TARGET.length - 1; i >= 0; i--) {
      ctx.lineTo(pt.X(MATCH_TARGET[i].t), pt.Y(MATCH_TARGET[i].x - MATCH_TOLERANCE));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = cAcc;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pt.X(MATCH_TARGET[0].t), pt.Y(MATCH_TARGET[0].x));
    for (const c of MATCH_TARGET) ctx.lineTo(pt.X(c.t), pt.Y(c.x));
    ctx.stroke();
    ctx.restore();
  }

  plotTrace(ctx, pt, state.samples, framedX, cDist, 2.6);
  plotTrace(ctx, vt, state.samples, framedV, cVel, 2.6);

  /* ---- the link between the graphs, made explicit ---- */
  const nowX = pt.X(Math.min(state.t, tEnd));
  const nowY = pt.Y(state.x - xObs);
  const dotX = vt.X(Math.min(state.t, tEnd));
  const dotY = vt.Y(vShown);
  const pxPerS = pt.w / (tEnd - tStart);
  const pxPerM = pt.h / Math.max(1e-6, pt.v1 - pt.v0);

  if (overlays.tangent && state.t > 0.05) {
    // A straight line through the current point whose slope IS the velocity.
    const half = Math.min(1.6, (tEnd - tStart) * 0.09);
    const dx = half * pxPerS;
    const dy = vShown * half * pxPerM;
    const triangle = band !== "3-5" && Math.abs(vShown) > 0.05 && !compact;
    ctx.save();
    roundRect(ctx, pt.x, pt.y, pt.w, pt.h, 8);
    ctx.clip();
    ctx.strokeStyle = cVel;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(nowX - dx, nowY + dy);
    ctx.lineTo(nowX + dx, nowY - dy);
    ctx.stroke();
    // The rise-over-run triangle, so "slope" is a measurement and not a word.
    if (triangle) {
      ctx.strokeStyle = hexA(cVel, 0.75);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(nowX, nowY);
      ctx.lineTo(nowX + dx, nowY);
      ctx.lineTo(nowX + dx, nowY - dy);
      ctx.stroke();
    }
    ctx.restore();
    if (triangle) {
      caption(ctx, nowX + dx / 2, nowY + 10, `Δt ${half.toFixed(1)} s`, theme, {
        size: 9, align: "center", color: cVel,
      });
      caption(ctx, nowX + dx + 4, nowY - dy / 2, `Δx ${(vShown * half).toFixed(1)} m`, theme, {
        size: 9, color: cVel,
      });
    }
    sphere(ctx, nowX, nowY, compact ? 3.5 : 5, cDist);
  }

  // Same number, twice, in the same colour: slope here, height there.
  if (overlays.link && !compact) {
    ctx.save();
    ctx.strokeStyle = hexA(cVel, 0.55);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(nowX, nowY);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vt.x, dotY);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    ctx.restore();
  }

  sphere(ctx, dotX, dotY, compact ? 3.5 : 5, cVel);
  if (!compact) {
    badge(ctx, dotX + 8, dotY - 14, `${vShown.toFixed(2)} m/s`, theme, { color: cVel });
    if (overlays.tangent) {
      badge(ctx, pt.x + pt.w - 6, pt.y + 16, `slope ${vShown.toFixed(2)} m/s`, theme, {
        align: "right", color: cVel,
      });
    }
  }

  if (params.mode === "match" && band !== "3-5" && !compact) {
    const score = state.t > 0 ? state.onTargetTime / Math.min(state.t, MATCH_SECONDS) : 0;
    badge(ctx, pt.x + 8, pt.y + pt.h - 16, `${Math.round(score * 100)}% on target`, theme, {
      color: score > 0.8 ? cDist : cAcc,
    });
  }

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const SEGMENT_OPTIONS = [
  { value: "rest", label: "Stay still" },
  { value: "slow", label: "Forward, slow" },
  { value: "fast", label: "Forward, fast" },
  { value: "back", label: "Reverse" },
];

export const motionGraphsSim: SimManifest<State> = {
  id: "phys.motion-graphs",
  title: "Motion Graphs",
  tagline: "Move the cart and watch its two graphs draw themselves, then read the motion back off them.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["6.RP.A.3", "8.F.B.4", "HSF.IF.B.6"] },
  learningGoals: [
    "Read speed and direction off a position-time graph from its slope.",
    "Tell distance and displacement apart, and say when they differ.",
    "Match a velocity-time graph to the motion it describes.",
    "Explain why the same motion gives different graphs to different observers.",
  ],
  misconceptions: [
    "A position-time graph is a picture of the path the object took",
    "A steeper graph always means the object is higher up",
    "Distance and displacement are two words for the same thing",
    "An object moving backwards has negative acceleration",
    "Motion is the same for every observer",
  ],
  interactionHint: "Pick a motion for each part of the script, or switch to Drive and use the speed dial.",
  params: {
    mode: {
      type: "option", label: "How the cart moves",
      options: [
        { value: "script", label: "Run a script" },
        { value: "drive", label: "Drive it myself" },
        { value: "match", label: "Match the graph" },
      ],
      default: "script",
      help: "Script runs three four-second behaviours in order. Drive and Match use the speed dial.",
    },
    segA: {
      type: "option", label: "Part 1 (0-4 s)", options: SEGMENT_OPTIONS, default: "fast",
    },
    segB: {
      type: "option", label: "Part 2 (4-8 s)", options: SEGMENT_OPTIONS, default: "slow",
    },
    segC: {
      type: "option", label: "Part 3 (8-12 s)", options: SEGMENT_OPTIONS, default: "back",
      help: "Reverse is the one that makes distance and displacement disagree.",
    },
    drive: {
      type: "number", label: "Speed dial", kind: "velocity", unit: "m/s",
      min: -3, max: 3, step: 0.25, default: 0,
      help: "The speed you are asking for. The cart takes time to get there. Off zero, the dial overrides the script.",
    },
    accel: {
      type: "number", label: "How quickly speed changes", kind: "acceleration", unit: "m/s²",
      min: 0.3, max: 4, step: 0.1, default: 1.5, bands: ["6-8", "9-12"],
      help: "The acceleration. Bigger means the velocity graph ramps more steeply.",
    },
    startX: {
      type: "number", label: "Starting position", kind: "length", unit: "m",
      min: 0, max: 18, step: 0.5, default: 4,
    },
    viewFrame: {
      type: "option", label: "Measured from",
      options: [
        { value: "ground", label: "The bench (still)" },
        { value: "observer", label: "A moving observer" },
      ],
      default: "ground", bands: ["6-8", "9-12"],
      help: "Same cart, same motion — but a moving observer records different numbers.",
    },
    observerSpeed: {
      type: "number", label: "Observer's speed", kind: "velocity", unit: "m/s",
      min: -3, max: 3, step: 0.25, default: 1, bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "tangent", label: "Slope indicator", default: true, bands: ["6-8", "9-12"] },
    { key: "link", label: "Link the two graphs", default: true, bands: ["6-8", "9-12"] },
    { key: "area", label: "Area under velocity", default: false, bands: ["6-8", "9-12"] },
    { key: "vectors", label: "Velocity arrow", default: true },
    { key: "trace", label: "Motion trail", default: true },
    { key: "grid", label: "Graph grid", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "distance-vs-displacement",
      title: "Distance is not displacement",
      question: "If the cart goes forward then comes back, how far has it travelled and where is it?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-2"],
      setup: { mode: "script", segA: "fast", segB: "rest", segC: "back", startX: 4, accel: 1.5, viewFrame: "ground" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "The cart drives forward, waits, then reverses. Answer before you run it.",
          predict: {
            prompt: "After the whole script, how do distance travelled and displacement compare?",
            options: [
              "They are always equal",
              "Distance is larger",
              "Displacement is larger",
              "Displacement is always zero",
            ],
            correct: 1,
            reveal: "Distance counts every metre of track the wheels rolled over. Displacement only counts where the cart ended up compared with where it started, so reversing subtracts from it.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the script and record",
          instruction: "Let all twelve seconds play, then record the data twice: once mid-run and once at the end.",
          requireData: 2,
          hints: [
            "Watch the two grey bars under the track: one keeps growing, the other shrinks on the way back.",
            "Record while the cart is still going forward, then again after it reverses.",
          ],
        },
        {
          id: "reverse",
          phase: "analyze",
          title: "Find the moment they split",
          instruction: "Look at the position-time graph. At what time does its slope change sign?",
          check: {
            describe: "The cart has reversed, so distance now exceeds displacement",
            test: (v) => Boolean(v.facts.reversed),
          },
        },
        {
          id: "speeds",
          phase: "analyze",
          title: "Two kinds of average",
          instruction: "Compare average speed with average velocity in the readouts. Why are they different?",
          write: {
            prompt: "Why is the average speed bigger than the average velocity here?",
            placeholder: "Average speed uses ... but average velocity uses ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "State when distance and displacement are equal and when they are not.",
          write: {
            prompt: "When are distance and displacement the same number, and when do they differ?",
            placeholder: "They are the same whenever ... but they differ as soon as ...",
          },
        },
      ],
    },
    {
      id: "slope-is-velocity",
      title: "What is the slope telling you?",
      question: "How does the steepness of a position-time graph relate to the velocity-time graph?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-2"],
      setup: { mode: "script", segA: "slow", segB: "fast", segC: "rest", startX: 2, accel: 1.5, viewFrame: "ground" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The script runs slow, then fast, then stops.",
          predict: {
            prompt: "What happens on the position-time graph while the cart is moving fastest?",
            options: [
              "The graph is highest up",
              "The graph is steepest",
              "The graph is flat",
              "The graph curves downwards",
            ],
            correct: 1,
            reveal: "Height on a position-time graph is where the cart is. Steepness is how fast it is going. Fastest means steepest, wherever the graph happens to sit.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Read both graphs together",
          instruction: "Run it with the slope indicator on. Record data during the slow part and the fast part.",
          requireData: 2,
          hints: [
            "The short straight line on the left graph has exactly the slope shown as a number.",
            "That same number is the height of the dot on the right-hand graph.",
          ],
        },
        {
          id: "flat",
          phase: "analyze",
          title: "Find the flat part",
          instruction: "Get the cart to rest and check what each graph does.",
          check: {
            describe: "The cart is stopped",
            test: (v) => Math.abs(v.facts.v as number) < 0.05 && (v.facts.t as number) > 1,
          },
          hints: ["At rest the position graph is flat and the velocity graph sits on zero."],
        },
        {
          id: "area",
          phase: "analyze",
          title: "Turn on the area",
          instruction: "Switch on 'Area under velocity'. Compare that shaded area with the displacement readout.",
          write: {
            prompt: "What does the shaded area under the velocity-time graph equal?",
            placeholder: "The area came out about ... which matches ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say it in one sentence",
          instruction: "Write the rule that connects the two graphs.",
          write: {
            prompt: "Finish this: the slope of a position-time graph is the ... and the area under a velocity-time graph is the ...",
            placeholder: "The slope is ... because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "match-the-graph",
      title: "Match the graph",
      brief: "Drive the cart so its position-time graph follows the dashed target.",
      bands: ["6-8", "9-12"],
      setup: { mode: "match", drive: 0, startX: 4, accel: 2, viewFrame: "ground" },
      goal: {
        describe: "Stay on the target graph for 70% of the run",
        test: (v) => Boolean(v.facts.matchComplete) && (v.facts.matchScore as number) >= 0.7,
      },
      stars: {
        two: {
          describe: "85% of the run on target",
          test: (v) => Boolean(v.facts.matchComplete) && (v.facts.matchScore as number) >= 0.85,
        },
        three: {
          describe: "95% of the run on target",
          test: (v) => Boolean(v.facts.matchComplete) && (v.facts.matchScore as number) >= 0.95,
        },
      },
      hints: [
        "A flat piece of the target means the speed dial belongs on zero.",
        "A straight sloping piece means one steady speed — read the slope off the target.",
        "The steep downhill section needs a negative speed of about two metres per second.",
      ],
    },
    {
      id: "zero-displacement",
      title: "Back where you started",
      brief: "Travel at least 15 m of track but finish within half a metre of where you began.",
      bands: ["6-8", "9-12"],
      setup: { mode: "script", segA: "fast", segB: "rest", segC: "back", startX: 8, accel: 2 },
      goal: {
        describe: "Distance above 15 m with displacement under 0.5 m",
        test: (v) => (v.facts.distance as number) >= 15
          && Math.abs(v.facts.displacement as number) <= 0.5,
      },
      stars: {
        two: {
          describe: "Finish within 0.2 m of the start",
          test: (v) => (v.facts.distance as number) >= 15
            && Math.abs(v.facts.displacement as number) <= 0.2,
        },
      },
      hints: [
        "Displacement near zero means the position-time graph ends at the height it started.",
        "Reverse for as long as you drove forward, at the same speed.",
      ],
    },
  ],
};
