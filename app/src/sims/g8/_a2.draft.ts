import type {
  ParamValues, RenderContext, SimContext, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, bevelRect, caption, clamp01, contactShadow, easeInOut, gradientFill, groundPlane, hexA, isDarkTheme, labelLeader, material, metal, noiseWash, plastic, pulse, rimLight, sky, softShadow,
  sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 8 · Unit A · Topic A2 — Acceleration and motion graphs.
 *
 * Five simulations, one topic. Acceleration is the single hardest idea in
 * middle-school mechanics, because it is a rate of change of a rate of change,
 * and because every one of its everyday words ("accelerate", "decelerate")
 * carries a meaning that is nearly, but not quite, the physics one.
 *
 *   A2.1  Acceleration as a rate of change   → Ticker-Tape Bench
 *   A2.2  Reading a velocity-time graph      → Graph Detective
 *   A2.3  Constant vs changing acceleration  → Twin Drop Tower
 *   A2.4  Deceleration                       → Brake Test Bay
 *   A2.5  Connecting the two graph types     → Journey Builder
 *
 * Every number on screen is one a student could check: a 50 Hz ticker timer
 * printing a dot every 0.02 s, a 25 mm steel ball bearing at 0.066 kg, a paper
 * cone reaching about 1.9 m/s terminal speed, a tyre-on-dry-tarmac friction
 * coefficient of 0.80 giving 25 m of braking from 20 m/s.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

/** Fixed-decimal formatting. Nothing on a stage is ever a raw float. */
function fx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  const out = v.toFixed(dp);
  return out === `-${(0).toFixed(dp)}` ? (0).toFixed(dp) : out;
}

/** A signed reading, so a deceleration always shows its minus sign. */

interface Rect { x: number; y: number; w: number; h: number }

/** A deterministic little stream for static scenery. Never used by a model. */

function polyline(
  ctx: CanvasRenderingContext2D, pts: readonly { x: number; y: number }[],
  color: string, width = 2, dash?: [number, number],
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

function ruleLine(
  ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number,
  color: string, width = 1, dash: [number, number] = [4, 5],
) {
  polyline(ctx, [{ x: x0, y: y0 }, { x: x1, y: y1 }], color, width, dash);
}

/* ------------------------------------------------------------------ *
 * The chart panel every graph sim in this topic draws on
 * ------------------------------------------------------------------ */

interface ChartCfg {
  tMin?: number;
  tMax: number;
  vMin: number;
  vMax: number;
  tStep: number;
  vStep: number;
  xLabel: string;
  yLabel: string;
  title?: string;
  accent?: string;
  /** Formatter for the vertical axis ticks. */
  yFmt?: (v: number) => string;
}

interface Chart {
  plot: Rect;
  px: (t: number) => number;
  py: (v: number) => number;
}

/**
 * A graph drawn as a real instrument panel: a shadowed card, a plate of
 * squared paper, two axis rules and quiet monospace ticks. A motion graph is
 * the object of study in this topic, so it is drawn as an object.
 */
function chartFrame(
  ctx: CanvasRenderingContext2D, r: Rect, theme: ThemeColors, cfg: ChartCfg,
): Chart {
  const dark = isDarkTheme(theme);
  const accent = cfg.accent ?? theme.accent;

  softShadow(ctx, () => {
    ctx.fillStyle = theme.surface;
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
  }, { blur: 18, dy: 7, alpha: dark ? 0.5 : 0.16 });

  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.clip();
  gradientFill(ctx, r.x, r.y, r.w, r.h, [
    hexA(theme.surfaceAlt, dark ? 0.92 : 0.86),
    hexA(theme.surface, 0.98),
  ], 118);
  noiseWash(ctx, r.x, r.y, r.w, r.h, {
    alpha: dark ? 0.03 : 0.045, seed: 1471, color: theme.ink,
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.95);
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 12);
  ctx.stroke();
  ctx.restore();

  const padL = 54, padR = 20;
  const padT = cfg.title ? 32 : 18, padB = 32;
  const plot: Rect = {
    x: r.x + padL, y: r.y + padT,
    w: Math.max(20, r.w - padL - padR), h: Math.max(20, r.h - padT - padB),
  };
  const tMin = cfg.tMin ?? 0;
  const px = (t: number) => plot.x + ((t - tMin) / (cfg.tMax - tMin)) * plot.w;
  const py = (v: number) => plot.y + plot.h - ((v - cfg.vMin) / (cfg.vMax - cfg.vMin)) * plot.h;

  // The paper itself, very slightly recessed into the card.
  ctx.save();
  roundRect(ctx, plot.x - 6, plot.y - 6, plot.w + 12, plot.h + 12, 7);
  ctx.fillStyle = hexA(dark ? theme.surface : theme.surfaceAlt, dark ? 0.55 : 0.55);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = theme.inkSoft;

  ctx.strokeStyle = hexA(theme.grid, dark ? 0.75 : 1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let t = tMin; t <= cfg.tMax + 1e-6; t += cfg.tStep) {
    const sx = Math.round(px(t)) + 0.5;
    ctx.moveTo(sx, plot.y);
    ctx.lineTo(sx, plot.y + plot.h);
  }
  for (let v = cfg.vMin; v <= cfg.vMax + 1e-6; v += cfg.vStep) {
    const sy = Math.round(py(v)) + 0.5;
    ctx.moveTo(plot.x, sy);
    ctx.lineTo(plot.x + plot.w, sy);
  }
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let t = tMin; t <= cfg.tMax + 1e-6; t += cfg.tStep) {
    ctx.fillText(fx(t, Math.abs(cfg.tStep % 1) > 1e-9 ? 1 : 0), px(t), plot.y + plot.h + 7);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yFmt = cfg.yFmt ?? ((v: number) => fx(v, Math.abs(cfg.vStep % 1) > 1e-9 ? 1 : 0));
  for (let v = cfg.vMin; v <= cfg.vMax + 1e-6; v += cfg.vStep) {
    ctx.fillText(yFmt(v), plot.x - 9, py(v));
  }
  ctx.restore();

  // Axis rules: the zero line is stronger, because sign is the whole story.
  const zeroY = cfg.vMin <= 0 && cfg.vMax >= 0 ? py(0) : py(cfg.vMin);
  polyline(ctx, [
    { x: plot.x, y: plot.y }, { x: plot.x, y: plot.y + plot.h },
  ], hexA(theme.inkSoft, 0.8), 1.6);
  polyline(ctx, [
    { x: plot.x, y: zeroY }, { x: plot.x + plot.w, y: zeroY },
  ], hexA(theme.inkSoft, 0.8), 1.6);

  caption(ctx, plot.x + plot.w, plot.y + plot.h + 21, cfg.xLabel, theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });
  ctx.save();
  ctx.translate(r.x + 15, plot.y + plot.h / 2);
  ctx.rotate(-Math.PI / 2);
  caption(ctx, 0, 0, cfg.yLabel, theme, { align: "center", size: 11, color: theme.inkSoft });
  ctx.restore();
  if (cfg.title) {
    caption(ctx, r.x + 16, r.y + 17, cfg.title, theme, { size: 13, color: accent, weight: 700 });
  }

  return { plot, px, py };
}

/** Clip to the plotting area — traces never spill onto the axis labels. */
function inPlot(ctx: CanvasRenderingContext2D, plot: Rect, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x - 1, plot.y - 1, plot.w + 2, plot.h + 2);
  ctx.clip();
  draw();
  ctx.restore();
}

/* ================================================================== *
 * A2.1 — Ticker-Tape Bench
 *
 * A dynamics trolley on a runway, pulled by a falling mass, dragging a paper
 * tape through a 50 Hz ticker timer. Cut the tape into ten-tick lengths, stand
 * them side by side, and the tops climb a straight staircase: the trolley gains
 * the same extra speed in every interval. That staircase is the definition of
 * acceleration, built out of paper by the student's own hands.
 * ================================================================== */

const TICK = 0.02;          // s between dots on a 50 Hz timer
const STRIP_TICKS = 10;     // dots per cut length
const STRIP_T = TICK * STRIP_TICKS;
const RUNWAY = 1.0;         // m of usable runway
const G = 9.81;

const SURFACE_MU: Record<string, number> = { air: 0.02, smooth: 0.08, felt: 0.22 };

/** The acceleration of the trolley-and-falling-mass system, in m/s². */
function tickerAccel(p: ParamValues): number {
  const mc = p.cartMass as number;
  const mh = p.hangMass as number;
  const mu = SURFACE_MU[p.surface as string] ?? 0.08;
  return (mh * G - mu * mc * G) / (mc + mh);
}

interface TapeStrip { v: number; len: number; born: number }

interface TickerState {
  phase: "ready" | "running" | "done";
  t: number;        // s since release
  hold: number;     // s spent in the current ready/done pause
  x: number;        // m travelled
  v: number;        // m/s
  dots: number[];   // m from the start line, one entry per printed dot
  strips: TapeStrip[];
  runs: number;
  stalled: boolean; // the pull never overcame friction
}

function freshTicker(): TickerState {
  return {
    phase: "ready", t: 0, hold: 0, x: 0, v: 0,
    dots: [], strips: [], runs: 0, stalled: false,
  };
}

const tickerModel: SimModel<TickerState> = {
  init() {
    return freshTicker();
  },

  applyParams(state, params, prev) {
    // Re-tuning the apparatus between runs starts a clean tape.
    if (
      params.cartMass !== prev.cartMass || params.hangMass !== prev.hangMass ||
      params.surface !== prev.surface
    ) {
      return { ...freshTicker(), runs: state.runs };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "action" && input.action === "launch") {
        s = { ...freshTicker(), phase: "running", runs: s.runs + 1 };
      }
    }

    const a = tickerAccel(params);

    if (s.phase === "ready") {
      const hold = s.hold + dt;
      if (hold < 0.7) return { ...s, hold };
      return { ...s, phase: "running", hold: 0, t: 0, runs: s.runs + 1 };
    }

    if (s.phase === "done") {
      const hold = s.hold + dt;
      if (hold < 2.8) return { ...s, hold };
      return { ...freshTicker(), runs: s.runs };
    }

    // Running. Closed form, so the printed dots are exact and testable.
    if (a <= 0.005) {
      const t = s.t + dt;
      if (t < 2.4) return { ...s, t, x: 0, v: 0, stalled: true };
      return { ...s, t, phase: "done", hold: 0, stalled: true };
    }

    const t = s.t + dt;
    const x = 0.5 * a * t * t;
    const v = a * t;

    const dots = s.dots.slice();
    const wanted = Math.min(Math.floor(t / TICK), 400);
    while (dots.length <= wanted) {
      const k = dots.length;
      const at = 0.5 * a * (k * TICK) * (k * TICK);
      if (at > RUNWAY) break;
      dots.push(at);
    }

    const strips = s.strips.slice();
    while (dots.length > (strips.length + 1) * STRIP_TICKS) {
      const i0 = strips.length * STRIP_TICKS;
      const len = dots[i0 + STRIP_TICKS] - dots[i0];
      strips.push({ v: len / STRIP_T, len, born: t });
    }

    if (x >= RUNWAY) {
      return { ...s, t, x: RUNWAY, v: a * Math.sqrt((2 * RUNWAY) / a), dots, strips, phase: "done", hold: 0 };
    }
    return { ...s, t, x, v, dots, strips };
  },

  readouts(state, params) {
    const a = tickerAccel(params);
    const last = state.strips.length ? state.strips[state.strips.length - 1] : null;
    return [
      { key: "t", label: "Time since release", quantity: q(state.t, "time"), unit: "s", semantic: "time", graphable: true },
      { key: "x", label: "Distance along runway", quantity: q(state.x, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "v", label: "Speed now", quantity: q(state.v, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "a", label: "Acceleration", quantity: q(a, "acceleration"), unit: "m/s²", semantic: "acceleration", graphable: true },
      { key: "dv", label: "Speed gained each 0.2 s", quantity: q(a * STRIP_T, "velocity"), unit: "m/s", semantic: "velocity" },
      { key: "stripSpeed", label: "Latest tape piece", quantity: q(last ? last.v : 0, "velocity"), unit: "m/s", semantic: "velocity" },
      { key: "strips", label: "Tape pieces cut", quantity: q(state.strips.length, "count"), semantic: "time" },
    ];
  },

  facts(state, params) {
    const a = tickerAccel(params);
    const n = state.strips.length;
    const tapeAccel = n >= 2
      ? (state.strips[n - 1].v - state.strips[0].v) / ((n - 1) * STRIP_T)
      : a;
    return {
      accel: a,
      tapeAccel,
      dvPerStrip: a * STRIP_T,
      strips: n,
      distance: state.x,
      speed: state.v,
      running: state.phase === "running",
      finished: state.phase === "done",
      stalled: state.stalled,
      targetError: Math.abs(a - (params.target as number)),
      moved: a > 0.005,
    };
  },
};

function tickerRender(rc: RenderContext<TickerState>) {
  const { ctx, state, params, theme, width: W, height: H, overlays, time, band } = rc;
  const dark = isDarkTheme(theme);
  const a = tickerAccel(params);
  const cVel = theme.sci["velocity"];
  const cAcc = theme.sci["acceleration"];
  const cMass = theme.sci["mass"];

  /* ---- the room ---- */
  const benchY = Math.round(H * 0.30);
  sky(ctx, W, H, theme, "indoor", benchY);
  noiseWash(ctx, 0, 0, W, benchY, { alpha: 0.05, seed: 88, color: theme.ink });

  // A window of daylight on the back wall gives the room somewhere to be.
  const winX = W * 0.62, winY = H * 0.03, winW = W * 0.3, winH = benchY - H * 0.09;
  if (winH > 20) {
    gradientFill(ctx, winX, winY, winW, winH, [
      hexA(theme.sci["light"], dark ? 0.16 : 0.3), hexA(theme.sci["light"], 0.02),
    ], 110);
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
    ctx.lineWidth = 2;
    ctx.strokeRect(winX, winY, winW, winH);
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY);
    ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.stroke();
    ctx.restore();
  }

  const benchBottom = Math.round(H * 0.54);
  groundPlane(ctx, benchY, 0, W * 0.78, benchBottom, theme, "lab");
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, dark ? 0.5 : 0.18);
  ctx.fillRect(0, benchBottom - 4, W * 0.78, 4);
  ctx.restore();

  /* ---- runway, trolley, falling mass ---- */
  const railY = benchY - 8;
  const xL = Math.round(W * 0.15), xR = Math.round(W * 0.66);
  const sx = (m: number) => xL + (m / RUNWAY) * (xR - xL);

  metal(ctx, xL - 14, railY, xR - xL + 28, 9, theme.inkSoft, { radius: 2, polish: 0.9 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let m = 0; m <= RUNWAY + 1e-9; m += 0.1) {
    const px = Math.round(sx(m)) + 0.5;
    ctx.moveTo(px, railY);
    ctx.lineTo(px, railY + (Math.abs(m * 10 - Math.round(m * 10)) < 1e-6 && Math.round(m * 10) % 2 === 0 ? 9 : 5));
  }
  ctx.stroke();
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = theme.inkSoft;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let m = 0; m <= RUNWAY + 1e-9; m += 0.2) ctx.fillText(`${fx(m, 1)}`, sx(m), railY + 12);
  ctx.restore();

  // Ticker timer: a mains-driven box with a striker arm that really vibrates.
  const tmW = 62, tmH = 46;
  const tmX = xL - 14 - tmW, tmY = railY - tmH;
  bevelRect(ctx, tmX, tmY, tmW, tmH, 6, theme.surfaceAlt, { depth: 1.2 });
  metal(ctx, tmX + 6, tmY + 6, tmW - 12, 14, theme.inkSoft, { radius: 3 });
  const buzz = Math.sin(time * 50 * Math.PI * 2) * 1.6;
  polyline(ctx, [
    { x: tmX + 12, y: tmY + 26 }, { x: tmX + tmW - 12, y: tmY + 26 + buzz },
  ], hexA(theme.ink, 0.75), 2.5);
  sphere(ctx, tmX + tmW - 12, tmY + 26 + buzz, 3.4, cAcc, { glow: 0.5 + 0.5 * pulse(time, 6) });
  caption(ctx, tmX + tmW / 2, tmY + 39, "50 Hz", theme, { align: "center", size: 9, color: theme.inkSoft });

  // The tape itself, lying along the runway with the dots it has printed.
  const tapeY = benchY + 12;
  const tapeEnd = Math.max(sx(0) + 4, sx(state.x));
  ctx.save();
  ctx.fillStyle = hexA(dark ? theme.surfaceAlt : theme.surface, 0.95);
  roundRect(ctx, tmX + 10, tapeY, Math.max(6, tapeEnd - tmX - 10), 16, 3);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, 0.75);
  ctx.beginPath();
  for (let i = 0; i < state.dots.length; i++) {
    const dx = sx(state.dots[i]);
    ctx.moveTo(dx + 1.7, tapeY + 8);
    ctx.arc(dx, tapeY + 8, 1.7, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // Trolley.
  const cw = 54, ch = 20;
  const cx = sx(state.x), cyTop = railY - ch - 6;
  contactShadow(ctx, cx, railY + 3, 20, 3);
  plastic(ctx, cx - cw / 2, cyTop, cw, ch, theme.accent, { radius: 5 });
  metal(ctx, cx - cw / 2 + 6, cyTop - 4, cw - 12, 5, theme.inkSoft, { radius: 2 });
  sphere(ctx, cx - cw / 2 + 12, railY - 3, 6, theme.inkSoft);
  sphere(ctx, cx + cw / 2 - 12, railY - 3, 6, theme.inkSoft);
  rimLight(ctx, (c) => { roundRect(c, cx - cw / 2, cyTop, cw, ch, 5); },
    dark ? theme.sci["light"] : theme.surface, { width: 1.4, alpha: 0.6 });

  // Pulley and the mass that drives the whole thing.
  const pulX = xR + 22, pulY = railY - 2;
  metal(ctx, pulX - 4, pulY, 8, benchY - pulY + 6, theme.inkSoft, { radius: 2 });
  sphere(ctx, pulX, pulY, 11, theme.inkSoft);
  sphere(ctx, pulX, pulY, 3, theme.surface);
  const dropSpan = benchBottom + H * 0.10 - (pulY + 16);
  const massY = pulY + 16 + clamp01(state.x / RUNWAY) * dropSpan;
  polyline(ctx, [{ x: cx + cw / 2, y: cyTop + ch / 2 }, { x: pulX, y: cyTop + ch / 2 }],
    hexA(theme.ink, 0.6), 1.6);
  polyline(ctx, [{ x: pulX + 11, y: pulY }, { x: pulX + 11, y: massY }], hexA(theme.ink, 0.6), 1.6);
  metal(ctx, pulX + 11 - 13, massY, 26, 20, cMass, { radius: 3 });
  spriteShadowEllipse(ctx, pulX + 11, massY + 26, 18, 5, { alpha: 0.2 });

  /* ---- live values, on the apparatus ---- */
  if (state.phase === "running" && !state.stalled) {
    badge(ctx, cx, cyTop - 26, `${fx(state.v, 2)} m/s`, theme, { align: "center", color: cVel });
  }
  badge(ctx, pulX + 11, massY + 40, `${fx((params.hangMass as number) * 1000, 0)} g`, theme, {
    align: "center", color: cMass, sub: "falling mass",
  });
  if (a > 0.005) {
    badge(ctx, W * 0.895, benchY - 54, `${fx(a, 2)} m/s²`, theme, {
      align: "center", color: cAcc, sub: "acceleration",
    });
    badge(ctx, W * 0.895, benchY - 8, `${fx(a * STRIP_T, 3)} m/s`, theme, {
      align: "center", color: cVel, sub: "gained each 0.2 s",
    });
  } else {
    caption(ctx, W * 0.895, benchY - 30, "friction wins:", theme, { align: "center", size: 12, color: theme.inkSoft });
    caption(ctx, W * 0.895, benchY - 12, "the trolley never moves", theme, { align: "center", size: 12, color: cAcc });
  }

  if (overlays.labels && band !== "3-5") {
    labelLeader(ctx, tmX + tmW - 14, tmY + 26, W * 0.06, H * 0.10, "Ticker timer", theme, {
      color: cAcc, sub: "one dot every 0.02 s", align: "right", size: 11,
    });
    labelLeader(ctx, sx(state.x * 0.45), tapeY + 8, W * 0.30, H * 0.475, "Tape record", theme, {
      color: theme.inkSoft, sub: "gaps grow: it is speeding up", size: 11,
    });
    labelLeader(ctx, cx, cyTop + ch / 2, W * 0.30, H * 0.075, "Trolley", theme, {
      color: theme.accent, sub: `${fx((params.cartMass as number) * 1000, 0)} g`, align: "right", size: 11,
    });
  }

  /* ---- the staircase: ten-tick lengths stood up side by side ---- */
  const panel: Rect = { x: W * 0.035, y: H * 0.575, w: W * 0.93, h: H * 0.40 };
  const tTot = a > 0.005 ? Math.sqrt((2 * RUNWAY) / a) : 2;
  const tMax = Math.max(0.6, Math.ceil(tTot / STRIP_T) * STRIP_T);
  const vTop = Math.max(0.25, Math.ceil((a > 0.005 ? a * tTot : 0.2) * 1.18 * 10) / 10);
  const ch2 = chartFrame(ctx, panel, theme, {
    tMax, vMin: 0, vMax: vTop, tStep: STRIP_T, vStep: vTop / 4,
    xLabel: "time from release (s)", yLabel: "average speed (m/s)",
    title: "Each tape piece stood up: a velocity-time graph made of paper",
    accent: cVel,
  });

  inPlot(ctx, ch2.plot, () => {
    const tops: { x: number; y: number }[] = [];
    for (let i = 0; i < state.strips.length; i++) {
      const st = state.strips[i];
      const grow = easeInOut(clamp01((state.t - st.born) / 0.35));
      const bx0 = ch2.px(i * STRIP_T) + 2;
      const bx1 = ch2.px((i + 1) * STRIP_T) - 2;
      const yTop = ch2.py(st.v * grow);
      const yBase = ch2.py(0);
      material(ctx, bx0, yTop, bx1 - bx0, yBase - yTop, cVel, 3);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = hexA(theme.ink, 0.55);
      ctx.beginPath();
      // The ten dots that were printed on this very piece of tape.
      for (let j = 0; j <= STRIP_TICKS; j++) {
        const k = i * STRIP_TICKS + j;
        if (k >= state.dots.length) break;
        const f = (state.dots[k] - state.dots[i * STRIP_TICKS]) / Math.max(1e-6, st.len);
        const dy = yBase - (yBase - yTop) * f;
        ctx.moveTo((bx0 + bx1) / 2 + 1.5, dy);
        ctx.arc((bx0 + bx1) / 2, dy, 1.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
      if (grow > 0.98) tops.push({ x: (bx0 + bx1) / 2, y: yTop });
    }

    if (overlays.stepline && tops.length >= 2) {
      polyline(ctx, tops, hexA(cAcc, 0.95), 2.4);
      for (const p of tops) sphere(ctx, p.x, p.y, 3.2, cAcc);
      // The rise between two neighbouring tops IS the acceleration, drawn.
      const p0 = tops[0], p1 = tops[1];
      ruleLine(ctx, p0.x, p0.y, p1.x, p0.y, hexA(theme.inkSoft, 0.8), 1.2);
      arrow(ctx, p1.x, p0.y, p1.x, p1.y, cAcc, { width: 1.8 });
    }
  });

  if (state.strips.length >= 2) {
    const p1x = ch2.px(1.5 * STRIP_T);
    const p1y = ch2.py(state.strips[1].v);
    badge(ctx, p1x + 14, (p1y + ch2.py(state.strips[0].v)) / 2, `+${fx(a * STRIP_T, 3)} m/s`, theme, {
      align: "left", color: cAcc, sub: "every 0.2 s",
    });
  }
  if (overlays.labels && state.strips.length >= 3 && band !== "3-5") {
    labelLeader(
      ctx, ch2.px(0.5 * STRIP_T), ch2.py(state.strips[0].v),
      ch2.plot.x + ch2.plot.w * 0.30, ch2.plot.y + 20,
      "One 0.2 s tape piece", theme,
      { color: cVel, sub: "its length is the average speed", size: 11 },
    );
  }

  vignette(ctx, W, H, 0.16);
}

export const g8a2TickerTape: SimManifest<TickerState> = {
  id: "g8a2-ticker-tape",
  title: "Ticker-Tape Bench",
  tagline: "Pull a trolley down a runway, cut its tape into 0.2 s pieces, and watch the speed climb by the same step every time.",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.EE.B.5"] },
  learningGoals: [
    "Define acceleration as the change in speed divided by the time it took.",
    "Read a tape record: growing gaps mean the object is speeding up.",
    "Show that a steady pull gives the same speed gain in every equal interval.",
  ],
  misconceptions: [
    "Acceleration is just another word for speed",
    "An object with a big speed must have a big acceleration",
    "A steady pull makes an object move at a steady speed",
  ],
  interactionHint: "Change the falling mass or the runway surface, then press Launch to print a new tape.",
  params: {
    cartMass: {
      type: "number", label: "Trolley mass", kind: "mass", unit: "g",
      min: 0.15, max: 1.0, step: 0.05, default: 0.30,
      help: "The mass being accelerated. A standard lab trolley is about 300 g.",
    },
    hangMass: {
      type: "number", label: "Falling mass", kind: "mass", unit: "g",
      min: 0.01, max: 0.15, step: 0.01, default: 0.05,
      help: "This is what pulls. Its weight is the driving force.",
    },
    surface: {
      type: "option", label: "Runway",
      options: [
        { value: "air", label: "Air track (almost no friction)" },
        { value: "smooth", label: "Smooth runway" },
        { value: "felt", label: "Felt brake strip" },
      ],
      default: "smooth",
    },
    target: {
      type: "number", label: "Target acceleration", kind: "acceleration", unit: "m/s²",
      min: 0.2, max: 4, step: 0.05, default: 1.5, bands: ["6-8", "9-12"],
      help: "Used by the challenges. Tune the apparatus until the tape matches it.",
    },
  },
  overlays: [
    { key: "labels", label: "Part labels", default: true },
    { key: "stepline", label: "Line through the tops", default: true },
  ],
  model: tickerModel,
  render: tickerRender,
  labs: [
    {
      id: "equal-steps",
      title: "Does the speed grow by the same amount each time?",
      question: "When a steady pull acts on a trolley, how does its speed change from one 0.2 s piece to the next?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-2"],
      setup: { cartMass: 0.30, hangMass: 0.05, surface: "smooth", target: 1.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the tape",
          instruction: "Commit before any tape is printed.",
          predict: {
            prompt: "The tape is cut into 0.2 s pieces and stood up in order. What do the tops do?",
            options: [
              "All the same height",
              "Each one taller than the last by the same amount",
              "Each one double the one before",
              "Taller at first, then level off",
            ],
            correct: 1,
            reveal: "A steady force gives a steady acceleration, so the speed gains the same amount in every equal interval. The tops climb a straight staircase.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Print a tape",
          instruction: "Press Launch and let the trolley run the whole runway.",
          check: { describe: "At least four tape pieces cut", test: (v) => (v.facts.strips as number) >= 4 },
          hints: ["The trolley must actually move — the falling mass has to beat friction."],
        },
        {
          id: "record",
          phase: "measure",
          title: "Record four moments",
          instruction: "Record data at four different times during one run.",
          requireData: 4,
          hints: [
            "Use the Record data button while the trolley is moving.",
            "Speed now and Time since release are the two columns that matter.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the step",
          instruction: "Subtract each speed from the next one. What do you get?",
          write: {
            prompt: "How much speed was gained between your recorded times, and was it always the same?",
            placeholder: "Between my readings the speed went up by about ... each time, which means ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Define acceleration in your own words, with a number from this run.",
          write: {
            prompt: "Finish this: acceleration is ... For this trolley it was ... m/s every second.",
            placeholder: "Acceleration is the ... For this run the trolley gained ...",
          },
        },
      ],
    },
    {
      id: "what-changes-a",
      title: "What makes the acceleration bigger?",
      question: "If you double the falling mass, does the acceleration double?",
      bands: ["6-8", "9-12"],
      minutes: 18,
      setup: { cartMass: 0.30, hangMass: 0.05, surface: "smooth", target: 1.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "Answer first, then test it.",
          predict: {
            prompt: "You go from a 50 g falling mass to 100 g and change nothing else. The acceleration will:",
            options: ["Stay the same", "Exactly double", "More than double", "Halve"],
            correct: 2,
            reveal: "It more than doubles. The pull doubles, but friction does not change, so the leftover force grows by more than a factor of two.",
          },
        },
        {
          id: "base",
          phase: "measure",
          title: "Run with 50 g",
          instruction: "Print one tape with the 50 g mass and record a reading.",
          requireData: 1,
          check: { describe: "Falling mass near 50 g", test: (v) => Math.abs((v.params.hangMass as number) - 0.05) < 0.005 },
        },
        {
          id: "double",
          phase: "measure",
          title: "Now 100 g",
          instruction: "Change only the falling mass to 100 g, run again, record.",
          requireData: 2,
          check: { describe: "Falling mass at 100 g", test: (v) => (v.params.hangMass as number) >= 0.095 },
          hints: ["Leave the trolley mass and the runway exactly as they were."],
        },
        {
          id: "friction",
          phase: "analyze",
          title: "Take friction away",
          instruction: "Switch to the air track and run again. What happened to the acceleration?",
          check: { describe: "Air track selected", test: (v) => v.params.surface === "air" },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say what controls the acceleration of this trolley.",
          write: {
            prompt: "Which changes made the acceleration larger, and why did doubling the mass not exactly double it?",
            placeholder: "The acceleration got bigger when ... It did not exactly double because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hit-accel",
      title: "Tune the bench",
      brief: "Set up the apparatus so the tape records the target acceleration.",
      bands: ["6-8", "9-12"],
      setup: { target: 1.5, cartMass: 0.30, hangMass: 0.05, surface: "smooth" },
      goal: {
        describe: "Acceleration within 0.15 m/s² of the target",
        test: (v) => (v.facts.targetError as number) <= 0.15 && (v.facts.strips as number) >= 2,
      },
      stars: {
        two: {
          describe: "Within 0.08 m/s²",
          test: (v) => (v.facts.targetError as number) <= 0.08 && (v.facts.strips as number) >= 2,
        },
        three: {
          describe: "Within 0.03 m/s²",
          test: (v) => (v.facts.targetError as number) <= 0.03 && (v.facts.strips as number) >= 2,
        },
      },
      hints: [
        "A heavier falling mass pulls harder; a heavier trolley is harder to speed up.",
        "The runway surface changes the friction, which eats part of the pull.",
      ],
    },
    {
      id: "gentle-climb",
      title: "The gentlest staircase",
      brief: "Make the trolley crawl: an acceleration between 0.15 and 0.30 m/s², with at least eight tape pieces cut.",
      bands: ["6-8", "9-12"],
      setup: { cartMass: 0.6, hangMass: 0.06, surface: "smooth" },
      goal: {
        describe: "Acceleration between 0.15 and 0.30 m/s² and 8 tape pieces cut",
        test: (v) => {
          const a = v.facts.accel as number;
          return a >= 0.15 && a <= 0.30 && (v.facts.strips as number) >= 8;
        },
      },
      stars: {
        two: {
          describe: "Twelve tape pieces in that band",
          test: (v) => {
            const a = v.facts.accel as number;
            return a >= 0.15 && a <= 0.30 && (v.facts.strips as number) >= 12;
          },
        },
      },
      hints: [
        "A small leftover force on a large mass gives a tiny acceleration.",
        "Rougher runway, heavier trolley, lighter falling mass — all push the same way.",
      ],
    },
  ],
};
