import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Charts — the platform's single way of drawing real data.
 *
 * `scene.ts` draws the place a phenomenon happens in and `organic.ts` draws the
 * things living in it. This file draws the *measurements*, and it exists
 * because a graph is an instrument: an instrument that lies is worse than no
 * instrument at all. Ticks at arbitrary slices of the range, an axis with no
 * title, four series in four colours and no legend, bars that start at 14
 * instead of 0 — each of those teaches a student to read a picture instead of
 * reading data, and each of them is what a sim writes when it rolls its own
 * axes.
 *
 * `chartFrame` is the shared instrument. It owns the plot rectangle, the tick
 * steps, the recessive grid and the axis titles, and hands back the two scale
 * functions everything else plots through. `lineSeries`, `barSeries` and
 * `scatterSeries` take those scales and never invent geometry of their own, so
 * a temperature curve in one sim and a population histogram in another line up
 * pixel for pixel and a student only has to learn to read one chart.
 *
 * Colour here is never decoration. Categorical series wear the colour the
 * caller passes — always a locked `theme.sci` token, never a hue this module
 * invented — so velocity-blue means velocity on a graph exactly as it does on
 * the stage. Magnitude is one hue, light to dark. There is no rainbow ramp
 * anywhere in this file and no hue at a diverging midpoint; adding one is a bug.
 *
 * Everything is built from layered gradients, like the rest of the kit, so a
 * chart laid over a lit scene reads as part of the same instrument panel rather
 * than a screenshot pasted on top of it. And every colour is derived from the
 * live theme, so one implementation serves light and dark.
 */

/* ------------------------------------------------------------------ *
 * Type faces
 *
 * Numbers are set in a monospaced face. Canvas has no
 * `font-variant-numeric: tabular-nums`, and a monospaced face is its exact
 * equivalent: every digit takes the same advance, so a column of y-axis labels
 * aligns on the decimal point and a value that ticks 9 -> 10 does not shove its
 * neighbours around. Words are set in the shell's own faces so a chart reads as
 * part of the product rather than as a plotting library's default.
 * ------------------------------------------------------------------ */

const NUM_FONT = 'ui-monospace, SFMono-Regular, Menlo, "Liberation Mono", monospace';
const UI_FONT = '"Source Sans 3", system-ui, sans-serif';
const TITLE_FONT = '"Bricolage Grotesque", system-ui, sans-serif';

const TICK_SIZE = 10;
const AXIS_TITLE_SIZE = 11;

/** The surface gap and surface ring: 2px of ground doing all the separating. */
const SURFACE_GAP = 2;

/* ------------------------------------------------------------------ *
 * Scales
 * ------------------------------------------------------------------ */

/**
 * A linear mapping from data space to canvas pixels.
 *
 * It is callable — `sx(4.2)` is a pixel — and it carries its own domain and
 * range, which is what lets a series function work out the plot rectangle, the
 * baseline and the width of one bar band from the scales alone. Nothing else
 * has to be threaded through.
 */
export interface Scale {
  (value: number): number;
  /** Canvas pixels back to a data value, for hit-testing a pointer. */
  invert(px: number): number;
  /** Pixel position of `min` — the left edge for x, the *bottom* edge for y. */
  from: number;
  /** Pixel position of `max` — the right edge for x, the *top* edge for y. */
  to: number;
  min: number;
  max: number;
  /** Length of the axis in pixels, always positive. */
  span: number;
}

/** The frame's two scales. Every series is placed through these. */
export interface ChartScales {
  sx: Scale;
  sy: Scale;
}

function makeScale(min: number, max: number, from: number, to: number): Scale {
  const domain = max - min || 1;
  const range = to - from || 1;
  const fn = ((v: number) => from + ((v - min) / domain) * range) as Scale;
  fn.invert = (px: number) => min + ((px - from) / range) * domain;
  fn.min = min;
  fn.max = max;
  fn.from = from;
  fn.to = to;
  fn.span = Math.abs(range);
  return fn;
}

/** The plot rectangle, recovered from the pair of scales. */
function plotRect(sx: Scale, sy: Scale) {
  const left = Math.min(sx.from, sx.to);
  const right = Math.max(sx.from, sx.to);
  const top = Math.min(sy.from, sy.to);
  const bottom = Math.max(sy.from, sy.to);
  return { x: left, y: top, w: right - left, h: bottom - top, right, bottom };
}

/* ------------------------------------------------------------------ *
 * Ticks
 * ------------------------------------------------------------------ */

/**
 * Tick steps a student can read: 1, 2 or 5 times a power of ten, so labels land
 * on round numbers instead of on arbitrary fractions of whatever the data
 * happened to reach. The returned `decimals` follows the step, so a step of 5
 * prints "10" and not "10.00".
 */
export function niceTicks(
  min: number, max: number, target = 5,
): { values: number[]; decimals: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) {
    return { values: [min], decimals: 0 };
  }
  const raw = (max - min) / Math.max(1, target);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const values: number[] = [];
  const first = Math.ceil(min / step - 1e-9) * step;
  for (let v = first; v <= max + step * 1e-6; v += step) {
    // Kill floating-point dust like 0.30000000000000004.
    values.push(Number(v.toPrecision(12)));
  }
  const decimals = Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
  return { values: values.length ? values : [min, max], decimals };
}

/** Fixed decimals, thousands grouped past four digits, and never "-0". */
function formatTick(v: number, decimals: number): string {
  const safe = Math.abs(v) < Math.pow(10, -decimals) / 2 ? 0 : v;
  const fixed = safe.toFixed(decimals);
  const dot = fixed.indexOf(".");
  const intPart = dot < 0 ? fixed : fixed.slice(0, dot);
  const frac = dot < 0 ? "" : fixed.slice(dot);
  const sign = intPart.startsWith("-") ? "-" : "";
  const digits = sign ? intPart.slice(1) : intPart;
  const grouped = digits.length > 4
    ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : digits;
  return `${sign}${grouped}${frac}`;
}

/* ------------------------------------------------------------------ *
 * The frame
 * ------------------------------------------------------------------ */

export interface ChartFrameOpts {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** Names the chart. One short phrase — the chart is not a paragraph. */
  title?: string;
  /** Axis titles. A quantity without a name is not a measurement. */
  xLabel?: string;
  yLabel?: string;
  /** Unit, rendered as "Speed (m/s)". Always supply it when there is one. */
  xUnit?: string;
  yUnit?: string;
  /** Target tick counts; the real count lands on a round step near this. */
  xTicks?: number;
  yTicks?: number;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  /**
   * Which gridlines to draw. Horizontals alone by default: for a quantity
   * against time they are the ones the eye actually uses, and verticals only
   * add ink. Ask for "both" on a scatter, where reading across matters too.
   */
  grid?: "both" | "x" | "y" | "none";
  /** Rule at y = 0 when the range straddles it. Default true. */
  zeroLine?: boolean;
  /** A translucent well behind the plot, so a chart stays readable over a scene. */
  plate?: boolean;
  /** Room kept clear at the right for an endpoint dot and its label. */
  padRight?: number;
}

/**
 * The shared chart frame: plot well, recessive grid, axis lines, tick labels
 * and axis titles. Returns the two scale functions the caller places data with.
 *
 * `x, y, w, h` is the whole chart including its labels, not the plot area — so
 * a caller can hand over a box in a layout and trust that nothing spills out of
 * it. The left pad is measured from the widest y-axis label actually rendered,
 * which is why a chart of thousands and a chart of tenths both sit flush.
 */
export function chartFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: ChartFrameOpts,
  theme: ThemeColors,
): ChartScales {
  const dark = isDarkTheme(theme);

  // Defend the domain: a series that has not moved yet still has to plot.
  let { xMin, xMax, yMin, yMax } = opts;
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !(xMax > xMin)) {
    xMin = Number.isFinite(xMin) ? xMin : 0;
    xMax = xMin + 1;
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || !(yMax > yMin)) {
    const mid = Number.isFinite(yMin) ? yMin : 0;
    yMin = mid - 0.5;
    yMax = mid + 0.5;
  }

  const xt = niceTicks(xMin, xMax, opts.xTicks ?? 6);
  const yt = niceTicks(yMin, yMax, opts.yTicks ?? 5);
  const fmtX = opts.xFormat ?? ((v: number) => formatTick(v, xt.decimals));
  const fmtY = opts.yFormat ?? ((v: number) => formatTick(v, yt.decimals));

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${TICK_SIZE}px ${NUM_FONT}`;

  // Lay the box out from measurements, not from guessed constants: a chart of
  // "1,200,000" and a chart of "8" both end up flush against their frame.
  //
  // Ticks are thinned to a stride rather than trimmed one at a time. A chart
  // squeezed into a sim's corner drops to every second or every fifth tick and
  // stays evenly spaced; the alternative — labels sitting on top of each other,
  // which is what a hardcoded tick count produces at small sizes — is the
  // single most common way an otherwise good chart becomes unreadable.
  const padB = TICK_SIZE + 9 + (opts.xLabel ? AXIS_TITLE_SIZE + 5 : 0);
  const padT = opts.title ? 20 : 8;
  const padR = opts.padRight ?? 12;
  const plotH = Math.max(12, h - padT - padB);

  const yVals = thin(
    yt.values.filter((v) => v >= yMin - 1e-9 && v <= yMax + 1e-9),
    (a, b) => (Math.abs(b - a) / (yMax - yMin)) * plotH,
    TICK_SIZE + 5,
  );
  let widestY = 0;
  for (const v of yVals) widestY = Math.max(widestY, ctx.measureText(fmtY(v)).width);

  const padL = Math.ceil(widestY) + 9 + (opts.yLabel ? AXIS_TITLE_SIZE + 5 : 0);
  const plotW = Math.max(12, w - padL - padR);

  let widestX = 0;
  for (const v of xt.values) widestX = Math.max(widestX, ctx.measureText(fmtX(v)).width);
  const xVals = thin(
    xt.values.filter((v) => v >= xMin - 1e-9 && v <= xMax + 1e-9),
    (a, b) => (Math.abs(b - a) / (xMax - xMin)) * plotW,
    widestX + 8,
  );

  const plot = { x: x + padL, y: y + padT, w: plotW, h: plotH };
  const sx = makeScale(xMin, xMax, plot.x, plot.x + plot.w);
  const sy = makeScale(yMin, yMax, plot.y + plot.h, plot.y);

  // The well. A shallow recess rather than a box: bright at the top, settling
  // into shadow at the foot, with a dark hairline under the lip. It reads as a
  // surface cut into the panel, which is what lets a chart sit on a busy scene
  // without a heavy border fencing it off.
  if (opts.plate !== false) {
    const well = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
    well.addColorStop(0, dark ? hexA(mix(theme.surface, "#ffffff", 0.1), 0.92) : hexA("#ffffff", 0.92));
    well.addColorStop(1, dark
      ? hexA(mix(theme.surface, "#000000", 0.26), 0.92)
      : hexA(mix(theme.surfaceAlt, "#ffffff", 0.4), 0.94));
    ctx.fillStyle = well;
    roundRectPath(ctx, plot.x, plot.y, plot.w, plot.h, 5);
    ctx.fill();

    ctx.strokeStyle = hexA(dark ? "#000000" : "#5a6472", dark ? 0.4 : 0.08);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.x + 1, plot.y + 0.5);
    ctx.lineTo(plot.x + plot.w - 1, plot.y + 0.5);
    ctx.stroke();
  }

  // Grid. One hairline weight, solid, one step off the surface — quiet enough
  // that the data is the only loud thing on the canvas.
  const gridMode = opts.grid ?? "y";
  if (gridMode !== "none") {
    // One step off the well, not off the app surface: in the dark theme the
    // grid token is nearly the stage colour, and a gridline nobody can see is
    // just an axis with extra steps.
    ctx.strokeStyle = dark ? hexA(mix(theme.grid, "#ffffff", 0.2), 0.95) : hexA(theme.grid, 0.95);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (gridMode === "y" || gridMode === "both") {
      for (const v of yVals) {
        const gy = Math.round(sy(v)) + 0.5;
        ctx.moveTo(plot.x, gy);
        ctx.lineTo(plot.x + plot.w, gy);
      }
    }
    if (gridMode === "x" || gridMode === "both") {
      for (const v of xVals) {
        const gx = Math.round(sx(v)) + 0.5;
        ctx.moveTo(gx, plot.y);
        ctx.lineTo(gx, plot.y + plot.h);
      }
    }
    ctx.stroke();
  }

  // The zero rule, when the data crosses it. Stronger than a gridline because
  // crossing zero is a physical event — the cart reversed, the account emptied.
  if (opts.zeroLine !== false && yMin < 0 && yMax > 0) {
    const zy = Math.round(sy(0)) + 0.5;
    ctx.strokeStyle = hexA(theme.inkSoft, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.x, zy);
    ctx.lineTo(plot.x + plot.w, zy);
    ctx.stroke();
  }

  // Axis lines: left and bottom only. A full box is twice the ink for no extra
  // information, and it visually competes with the series.
  ctx.strokeStyle = hexA(theme.line, dark ? 0.95 : 1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(plot.x) + 0.5, plot.y);
  ctx.lineTo(Math.round(plot.x) + 0.5, Math.round(plot.y + plot.h) + 0.5);
  ctx.lineTo(plot.x + plot.w, Math.round(plot.y + plot.h) + 0.5);
  ctx.stroke();

  // Ticks and their labels.
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.fillStyle = theme.inkSoft;
  ctx.font = `500 ${TICK_SIZE}px ${NUM_FONT}`;
  ctx.lineWidth = 1;

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.beginPath();
  for (const v of yVals) {
    const ty = Math.round(sy(v)) + 0.5;
    ctx.moveTo(plot.x - 4, ty);
    ctx.lineTo(plot.x, ty);
  }
  ctx.stroke();
  for (const v of yVals) ctx.fillText(fmtY(v), plot.x - 7, sy(v));

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.beginPath();
  for (const v of xVals) {
    const tx = Math.round(sx(v)) + 0.5;
    ctx.moveTo(tx, plot.y + plot.h);
    ctx.lineTo(tx, plot.y + plot.h + 4);
  }
  ctx.stroke();
  for (const v of xVals) ctx.fillText(fmtX(v), sx(v), plot.y + plot.h + 6);

  // Axis titles.
  ctx.fillStyle = hexA(theme.inkSoft, 0.95);
  ctx.font = `600 ${AXIS_TITLE_SIZE}px ${UI_FONT}`;
  if (opts.xLabel) {
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(axisTitle(opts.xLabel, opts.xUnit), plot.x + plot.w / 2, y + h);
  }
  if (opts.yLabel) {
    ctx.save();
    ctx.translate(x + AXIS_TITLE_SIZE, plot.y + plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(axisTitle(opts.yLabel, opts.yUnit), 0, 0);
    ctx.restore();
  }
  if (opts.title) {
    ctx.fillStyle = theme.ink;
    ctx.font = `700 12px ${TITLE_FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(opts.title, x, y + 11);
  }

  ctx.restore();
  return { sx, sy };
}

function axisTitle(label: string, unit?: string): string {
  return unit ? `${label} (${unit})` : label;
}

/**
 * Keep every nth tick, choosing the smallest n whose labels clear each other.
 *
 * Evenly spaced survivors, never a hand-picked subset: a reader infers the step
 * from the gaps, and an irregular gap says the data is irregular when it is not.
 */
function thin(
  values: readonly number[],
  pixelsBetween: (a: number, b: number) => number,
  needed: number,
): number[] {
  if (values.length < 3) return values.slice();
  const gap = pixelsBetween(values[0], values[1]);
  if (!Number.isFinite(gap) || gap <= 0) return values.slice();
  const stride = Math.max(1, Math.ceil(needed / gap));
  if (stride === 1) return values.slice();
  const out: number[] = [];
  for (let i = 0; i < values.length; i += stride) out.push(values[i]);
  return out;
}

/* ------------------------------------------------------------------ *
 * Line
 * ------------------------------------------------------------------ */

export interface Pt {
  x: number;
  y: number;
}

export interface LineSeriesOpts {
  /** Required: the ring, the labels and the fill all resolve against it. */
  theme: ThemeColors;
  /** A soft wash between the curve and the baseline. */
  fill?: boolean;
  /** Data value the wash drops to. Defaults to zero, or the axis floor. */
  fillTo?: number;
  /** Emphasised dot at the last measured point. Default true. */
  endDot?: boolean;
  /** A short direct label at the endpoint — the one value worth naming. */
  label?: string;
  /**
   * A dashed continuation past the measured data. Dashes mean "model, not
   * measurement": a student must never mistake a forecast for a reading.
   */
  projection?: readonly Pt[];
  width?: number;
  /** Fade the whole series back, for a reference or a previous run. */
  alpha?: number;
}

/**
 * A 2px line with an optional area wash, an emphasised endpoint and an optional
 * dashed projection.
 *
 * The endpoint dot is the single most useful mark on a live graph: it is where
 * the experiment is *now*, and it carries a 2px ring in the surface colour so
 * it stays readable where it crosses a gridline or another series.
 */
export function lineSeries(
  ctx: CanvasRenderingContext2D,
  pts: readonly Pt[],
  sx: Scale, sy: Scale,
  color: string,
  opts: LineSeriesOpts,
) {
  if (pts.length === 0) return;
  const theme = opts.theme;
  const plot = plotRect(sx, sy);
  const width = opts.width ?? 2;

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = clamp01(opts.alpha);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Clip while stroking so a spike out of range cannot scribble over the axis
  // titles; the endpoint and its label are drawn after the clip is released.
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x - 1, plot.y - 1, plot.w + 2, plot.h + 2);
  ctx.clip();

  const runs = finiteRuns(pts);

  if (opts.fill) {
    const baseValue = opts.fillTo ?? (sy.min <= 0 && sy.max >= 0 ? 0 : sy.min);
    const baseY = clampTo(sy(baseValue), plot.y, plot.bottom);
    // The wash is a wash: about a tenth of the hue at the curve, gone by the
    // baseline. A saturated block under a line reads as a second series.
    const g = ctx.createLinearGradient(0, plot.y, 0, baseY);
    g.addColorStop(0, hexA(color, 0.26));
    g.addColorStop(0.55, hexA(color, 0.12));
    g.addColorStop(1, hexA(color, 0.02));
    ctx.fillStyle = g;
    for (const run of runs) {
      if (run.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(sx(run[0].x), baseY);
      for (const p of run) ctx.lineTo(sx(p.x), sy(p.y));
      ctx.lineTo(sx(run[run.length - 1].x), baseY);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (const run of runs) {
    if (run.length < 2) {
      // A single sample is still a reading; draw it as a point.
      ctx.beginPath();
      ctx.arc(sx(run[0].x), sy(run[0].y), width * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(sx(run[0].x), sy(run[0].y));
    for (let i = 1; i < run.length; i++) ctx.lineTo(sx(run[i].x), sy(run[i].y));
    ctx.stroke();
  }

  if (opts.projection && opts.projection.length > 0) {
    const proj = finiteRuns(opts.projection);
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = width;
    ctx.strokeStyle = hexA(color, 0.7);
    const tail = runs.length ? runs[runs.length - 1] : [];
    for (const run of proj) {
      if (run.length < 1) continue;
      ctx.beginPath();
      // Join the projection to the last measured point so the two read as one
      // story rather than as two unrelated marks.
      if (tail.length) ctx.moveTo(sx(tail[tail.length - 1].x), sy(tail[tail.length - 1].y));
      else ctx.moveTo(sx(run[0].x), sy(run[0].y));
      for (const p of run) ctx.lineTo(sx(p.x), sy(p.y));
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.restore();

  const last = lastFinite(pts);
  if (last && opts.endDot !== false) {
    const ex = clampTo(sx(last.x), plot.x, plot.right);
    const ey = clampTo(sy(last.y), plot.y, plot.bottom);
    surfaceDot(ctx, ex, ey, 4.5, color, theme);
    if (opts.label) {
      const ink = theme.inkSoft;
      ctx.font = `600 11px ${UI_FONT}`;
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(opts.label).width;
      // Flip the label inside the plot rather than let it run off the frame.
      const flip = ex + 9 + tw > plot.right;
      ctx.textAlign = flip ? "right" : "left";
      const lx = flip ? ex - 9 : ex + 9;
      ctx.lineWidth = 3;
      ctx.strokeStyle = hexA(theme.surface, 0.85);
      ctx.strokeText(opts.label, lx, ey);
      ctx.fillStyle = ink;
      ctx.fillText(opts.label, lx, ey);
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Bars
 * ------------------------------------------------------------------ */

export interface BarSeriesOpts {
  theme: ThemeColors;
  /** Value the bars grow from. Defaults to zero when the axis includes it. */
  baseline?: number;
  /** Cap on bar thickness. Bars never fill their slot; the leftover is air. */
  maxWidth?: number;
  /** Surface gap between adjacent bars. 2px, and there is no reason to change it. */
  gap?: number;
  /** Corner radius on the data end. */
  radius?: number;
  /** Direct value labels on the cap. Label selectively — not every bar, always. */
  label?: (value: number, index: number) => string | undefined;
  /**
   * Shade each bar light-to-dark by its magnitude, within the one hue passed
   * in. A sequential encoding of the same number the height already carries,
   * which is why it is safe; it is never a second variable.
   */
  ramp?: boolean;
  alpha?: number;
}

/**
 * Bars anchored to the baseline, with 4px rounded data ends and a 2px surface
 * gap between neighbours.
 *
 * Build the frame with `xMin: -0.5, xMax: values.length - 0.5` and bar `i` lands
 * centred on `sx(i)`. The band width is read back off the scale, so the same
 * call works for a chart of three bars and a chart of forty.
 */
export function barSeries(
  ctx: CanvasRenderingContext2D,
  values: readonly number[],
  sx: Scale, sy: Scale,
  color: string,
  opts: BarSeriesOpts,
) {
  if (values.length === 0) return;
  const theme = opts.theme;
  const plot = plotRect(sx, sy);
  const gap = opts.gap ?? SURFACE_GAP;
  const radius = opts.radius ?? 4;

  const band = Math.abs(sx(1) - sx(0)) || plot.w;
  const barW = Math.max(2, Math.min(opts.maxWidth ?? 24, band - gap));

  const baseValue = opts.baseline ?? (sy.min <= 0 && sy.max >= 0 ? 0 : sy.min);
  const baseY = clampTo(sy(baseValue), plot.y, plot.bottom);

  // Magnitude for the optional ramp, measured from the baseline outwards.
  let peak = 0;
  for (const v of values) {
    if (Number.isFinite(v)) peak = Math.max(peak, Math.abs(v - baseValue));
  }

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = clamp01(opts.alpha);
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x - 1, plot.y - 2, plot.w + 2, plot.h + 3);
  ctx.clip();

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const cx = sx(i);
    const topY = clampTo(sy(v), plot.y, plot.bottom);
    const up = topY <= baseY;
    const height = Math.abs(topY - baseY);
    if (height < 0.5) continue;

    const bx = cx - barW / 2;
    const by = up ? topY : baseY;

    // One hue, lit from above: a light step at the cap falling to a dark step
    // at the baseline. The bar is a solid object, not a coloured rectangle.
    const shade = opts.ramp && peak > 0 ? 0.55 * (1 - Math.abs(v - baseValue) / peak) : 0;
    const face = mix(color, "#ffffff", shade);
    const g = ctx.createLinearGradient(0, up ? by : by + height, 0, up ? by + height : by);
    g.addColorStop(0, mix(face, "#ffffff", 0.3));
    g.addColorStop(0.45, face);
    g.addColorStop(1, mix(face, "#000000", 0.16));
    ctx.fillStyle = g;
    barPath(ctx, bx, by, barW, height, Math.min(radius, barW / 2), up);
    ctx.fill();

    // A thin gloss along the cap, the same trick the labware uses on a battery.
    ctx.fillStyle = hexA("#ffffff", 0.24);
    const glossH = Math.min(height * 0.34, 5);
    barPath(ctx, bx + 1, up ? by + 1 : by + height - glossH - 1, barW - 2, glossH,
      Math.min(radius - 1, (barW - 2) / 2), up);
    ctx.fill();
  }
  ctx.restore();

  // Labels last and unclipped, so a value never gets sliced by the plot edge.
  if (opts.label) {
    ctx.font = `600 10px ${NUM_FONT}`;
    ctx.textAlign = "center";
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (!Number.isFinite(v)) continue;
      const text = opts.label(v, i);
      if (!text) continue;
      const cx = sx(i);
      const topY = clampTo(sy(v), plot.y, plot.bottom);
      const up = topY <= baseY;
      if (Math.abs(topY - baseY) < 0.5) continue;
      // Outside the cap, and only when there is genuinely room for it there.
      const ly = up ? topY - 5 : topY + 5;
      if (up ? ly - 8 < plot.y : ly + 8 > plot.bottom) continue;
      ctx.textBaseline = up ? "bottom" : "top";
      ctx.lineWidth = 3;
      ctx.strokeStyle = hexA(theme.surface, 0.85);
      ctx.strokeText(text, cx, ly);
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText(text, cx, ly);
    }
  }
  ctx.restore();
}

/** A bar path: rounded at the data end, square where it meets the baseline. */
function barPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number, up: boolean,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  ctx.beginPath();
  if (up) {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h - rr);
    ctx.arcTo(x, y + h, x + rr, y + h, rr);
    ctx.lineTo(x + w - rr, y + h);
    ctx.arcTo(x + w, y + h, x + w, y + h - rr, rr);
    ctx.lineTo(x + w, y);
  }
  ctx.closePath();
}

/* ------------------------------------------------------------------ *
 * Scatter
 * ------------------------------------------------------------------ */

export interface ScatterSeriesOpts {
  theme: ThemeColors;
  /** Dot radius. Never below 4 — an 8px mark is the smallest readable one. */
  radius?: number;
  /** Least-squares line through the points. */
  fit?: boolean;
  /** Name the fit on the chart, e.g. "best fit". */
  fitLabel?: string;
  alpha?: number;
}

/**
 * Dots at least 8px across, each ringed with 2px of the surface colour so a
 * cluster of overlapping readings still resolves into countable points, plus an
 * optional least-squares line.
 *
 * The ring is the whole trick. Without it, twenty points on top of each other
 * are one blob; with it, they are twenty points.
 */
export function scatterSeries(
  ctx: CanvasRenderingContext2D,
  pts: readonly Pt[],
  sx: Scale, sy: Scale,
  color: string,
  opts: ScatterSeriesOpts,
) {
  if (pts.length === 0) return;
  const theme = opts.theme;
  const plot = plotRect(sx, sy);
  const r = Math.max(4, opts.radius ?? 4.5);

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = clamp01(opts.alpha);
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x - 1, plot.y - 1, plot.w + 2, plot.h + 2);
  ctx.clip();

  const line = opts.fit ? leastSquares(pts) : null;
  if (line) {
    // Drawn under the data, thinner and softer: the fit is a claim about the
    // points, so the points have to stay the loudest thing on the plot.
    ctx.strokeStyle = hexA(mix(color, isDarkTheme(theme) ? "#ffffff" : "#000000", 0.3), 0.85);
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(sx(sx.min), sy(line.m * sx.min + line.b));
    ctx.lineTo(sx(sx.max), sy(line.m * sx.max + line.b));
    ctx.stroke();
  }

  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    surfaceDot(ctx, sx(p.x), sy(p.y), r, color, theme);
  }

  // The fit's name goes on after the dots, so its halo clears the cloud instead
  // of being written under it. Above the line at the left end, where a rising
  // fit has empty plot and the eye is not already busy counting points.
  if (line && opts.fitLabel) {
    const at = sx.min + (sx.max - sx.min) * 0.1;
    // Above the line when it rises, below when it falls: either way the label
    // sits on the emptier side of its own fit.
    const above = line.m >= 0;
    const on = sy(line.m * at + line.b);
    const ly = clampTo(above ? on - 10 : on + 10, plot.y + 11, plot.bottom - 4);
    const lx = clampTo(sx(at), plot.x + 5, plot.right - 5);
    ctx.font = `600 10px ${UI_FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = above ? "bottom" : "top";
    ctx.lineWidth = 4;
    ctx.strokeStyle = hexA(theme.surface, 0.92);
    ctx.strokeText(opts.fitLabel, lx, ly);
    ctx.fillStyle = theme.inkSoft;
    ctx.fillText(opts.fitLabel, lx, ly);
  }
  ctx.restore();
  ctx.restore();
}

/** Ordinary least squares. Returns null when x has no spread to fit against. */
function leastSquares(pts: readonly Pt[]): { m: number; b: number } | null {
  let n = 0, sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    n++; sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x;
  }
  if (n < 2) return null;
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return null;
  const m = (n * sumXY - sumX * sumY) / denom;
  return { m, b: (sumY - m * sumX) / n };
}

/* ------------------------------------------------------------------ *
 * Energy budget
 * ------------------------------------------------------------------ */

export interface EnergyPart {
  label: string;
  value: number;
  color: string;
}

export interface EnergyBarsOpts {
  /**
   * The full scale of the track. Give it when energy can leave the system: the
   * parts then stop filling the bar and the empty remainder is the loss, which
   * is the entire point a student is meant to see.
   */
  total?: number;
  unit?: string;
  title?: string;
  /** Decimal places on the readouts. Default 1. */
  decimals?: number;
}

/**
 * A stacked energy budget — kinetic, potential, thermal — as one bar that
 * visibly sums to a total.
 *
 * Every segment is separated by 2px of the surface colour rather than by an
 * outline, is labelled inside when the words fit, and is listed with its value
 * in the key beneath. So identity never rests on colour alone, and a student
 * who is red-green colourblind reads the same budget as everyone else.
 */
export function energyBars(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  parts: readonly EnergyPart[],
  theme: ThemeColors,
  opts: EnergyBarsOpts = {},
) {
  const dark = isDarkTheme(theme);
  const decimals = opts.decimals ?? 1;
  const unit = opts.unit ? ` ${opts.unit}` : "";

  let sum = 0;
  for (const p of parts) sum += Math.max(0, p.value);
  const scale = Math.max(opts.total ?? sum, 1e-9);

  const headerH = 15;
  const keyH = 15;
  const barH = Math.max(10, Math.min(26, h - headerH - keyH - 10));
  const barY = y + headerH;

  ctx.save();
  ctx.textBaseline = "alphabetic";

  // Header: what this is, and what it comes to.
  ctx.font = `700 11px ${TITLE_FONT}`;
  ctx.textAlign = "left";
  ctx.fillStyle = theme.ink;
  ctx.fillText(opts.title ?? "Energy", x, y + 10);
  ctx.font = `600 11px ${NUM_FONT}`;
  ctx.textAlign = "right";
  ctx.fillStyle = theme.inkSoft;
  ctx.fillText(`${formatTick(sum, decimals)}${unit} total`, x + w, y + 10);

  // The track, recessed: dark at the lip, lighter at the foot.
  const track = ctx.createLinearGradient(0, barY, 0, barY + barH);
  track.addColorStop(0, dark ? mix(theme.surface, "#000000", 0.45) : mix(theme.surfaceAlt, "#000000", 0.09));
  track.addColorStop(1, dark ? mix(theme.surface, "#ffffff", 0.06) : mix(theme.surfaceAlt, "#ffffff", 0.5));
  ctx.fillStyle = track;
  roundRectPath(ctx, x, barY, w, barH, Math.min(5, barH / 2));
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Segments. Clipped to the track so the rounded ends stay rounded and a
  // rounding error can never let a segment escape by half a pixel.
  ctx.save();
  roundRectPath(ctx, x, barY, w, barH, Math.min(5, barH / 2));
  ctx.clip();

  let cursor = x;
  for (const part of parts) {
    const value = Math.max(0, part.value);
    const segW = (value / scale) * w;
    if (segW <= 0.4) continue;
    const drawW = Math.max(1, segW - SURFACE_GAP);

    const g = ctx.createLinearGradient(0, barY, 0, barY + barH);
    g.addColorStop(0, mix(part.color, "#ffffff", 0.34));
    g.addColorStop(0.5, part.color);
    g.addColorStop(1, mix(part.color, "#000000", 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(cursor, barY, drawW, barH);

    // A sheen across the top third, so the bar reads as a lit surface.
    ctx.fillStyle = hexA("#ffffff", 0.2);
    ctx.fillRect(cursor, barY + 1, drawW, Math.max(1, barH * 0.3));

    // Inside label, only when it genuinely fits with padding on both sides.
    ctx.font = `700 10px ${UI_FONT}`;
    const tw = ctx.measureText(part.label).width;
    if (tw + 14 <= drawW && barH >= 14) {
      ctx.fillStyle = readableInk(part.color);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(part.label, cursor + drawW / 2, barY + barH / 2 + 0.5);
      ctx.textBaseline = "alphabetic";
    }
    cursor += segW;
  }
  ctx.restore();

  // The key: every part named with its value, whether or not it fitted inside.
  const items = parts.map((p) => ({
    label: `${p.label} ${formatTick(Math.max(0, p.value), decimals)}${unit}`,
    color: p.color,
    shape: "swatch" as const,
  }));
  legend(ctx, x, barY + barH + 4, items, theme, { maxWidth: w, size: 10 });
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Sparkline
 * ------------------------------------------------------------------ */

/**
 * A trend in the space of a word: no axes, no ticks, just the shape of the
 * change and an emphasised final point.
 *
 * Pass the theme when there is one — the final dot then gets its 2px surface
 * ring like every other emphasised mark. Without it the dot falls back to a lit
 * bead, which reads as emphasis on any ground rather than guessing at one.
 */
export function sparkline(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  values: readonly number[],
  color: string,
  theme?: ThemeColors,
) {
  const finite: number[] = [];
  for (const v of values) if (Number.isFinite(v)) finite.push(v);
  if (finite.length === 0 || w <= 2 || h <= 2) return;

  let lo = Infinity, hi = -Infinity;
  for (const v of finite) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }

  const inset = 3.5;
  const top = y + inset, bottom = y + h - inset;
  const px = (i: number) => x + (finite.length === 1 ? w / 2 : (i / (finite.length - 1)) * w);
  const py = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // A wash under the trend gives the line a body at this size, where a hairline
  // alone would read as a scratch.
  const g = ctx.createLinearGradient(0, top, 0, y + h);
  g.addColorStop(0, hexA(color, 0.24));
  g.addColorStop(1, hexA(color, 0.01));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(px(0), y + h);
  for (let i = 0; i < finite.length; i++) ctx.lineTo(px(i), py(finite[i]));
  ctx.lineTo(px(finite.length - 1), y + h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(px(0), py(finite[0]));
  for (let i = 1; i < finite.length; i++) ctx.lineTo(px(i), py(finite[i]));
  ctx.stroke();

  const ex = px(finite.length - 1), ey = py(finite[finite.length - 1]);
  if (theme) {
    surfaceDot(ctx, ex, ey, 3.5, color, theme);
  } else {
    const bead = ctx.createRadialGradient(ex - 1.2, ey - 1.4, 0, ex, ey, 4);
    bead.addColorStop(0, mix(color, "#ffffff", 0.65));
    bead.addColorStop(0.55, color);
    bead.addColorStop(1, mix(color, "#000000", 0.3));
    ctx.fillStyle = bead;
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Legend
 * ------------------------------------------------------------------ */

export interface LegendItem {
  /** Always required. Identity never rests on colour alone. */
  label: string;
  color: string;
  /** "swatch" for a fill, "line" for a stroked series, "dot" for scattered points. */
  shape?: "swatch" | "line" | "dot";
  /** Key a dashed projection so it is not mistaken for measured data. */
  dash?: boolean;
}

export interface LegendOpts {
  /** Wrap onto further rows rather than run off the canvas. */
  maxWidth?: number;
  /** `x` is the row's centre instead of its left edge. */
  align?: "left" | "center";
  size?: number;
}

/**
 * A legend row. Every item carries its label, because a reader who cannot
 * distinguish two of the hues must still be able to tell the two series apart —
 * and because a colour with no name teaches nothing.
 *
 * Returns the rectangle it occupied, so a caller can lay a chart out beneath it
 * without guessing.
 */
export function legend(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  items: readonly LegendItem[],
  theme: ThemeColors,
  opts: LegendOpts = {},
): { w: number; h: number } {
  if (items.length === 0) return { w: 0, h: 0 };
  const size = opts.size ?? 11;
  const rowH = size + 6;
  const keyW = 14;
  const gapKeyText = 5;
  const gapItems = 14;

  ctx.save();
  ctx.font = `600 ${size}px ${UI_FONT}`;

  // Measure first, then place: a legend that overflows its box is a layout bug
  // the reader pays for.
  const widths = items.map((it) => keyW + gapKeyText + ctx.measureText(it.label).width);
  const rows: number[][] = [];
  const limit = opts.maxWidth ?? Infinity;
  let current: number[] = [];
  let used = 0;
  for (let i = 0; i < items.length; i++) {
    const need = widths[i] + (current.length ? gapItems : 0);
    if (current.length && used + need > limit) {
      rows.push(current);
      current = [];
      used = 0;
    }
    used += current.length ? need : widths[i];
    current.push(i);
  }
  if (current.length) rows.push(current);

  let widest = 0;
  ctx.textBaseline = "middle";
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let rowW = 0;
    for (let k = 0; k < row.length; k++) rowW += widths[row[k]] + (k ? gapItems : 0);
    widest = Math.max(widest, rowW);

    let cx = opts.align === "center" ? x - rowW / 2 : x;
    const cy = y + r * rowH + rowH / 2;
    for (const idx of row) {
      const item = items[idx];
      drawKey(ctx, cx, cy, keyW, item, theme);
      ctx.fillStyle = theme.inkSoft;
      ctx.textAlign = "left";
      ctx.fillText(item.label, cx + keyW + gapKeyText, cy);
      cx += widths[idx] + gapItems;
    }
  }
  ctx.restore();
  return { w: widest, h: rows.length * rowH };
}

/** The mark beside a legend label: the only place the series colour appears. */
function drawKey(
  ctx: CanvasRenderingContext2D,
  x: number, cy: number, keyW: number, item: LegendItem, theme: ThemeColors,
) {
  const shape = item.shape ?? "swatch";
  if (shape === "line") {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    if (item.dash) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + keyW, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  if (shape === "dot") {
    surfaceDot(ctx, x + keyW / 2, cy, 4.5, item.color, theme);
    return;
  }
  const g = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
  g.addColorStop(0, mix(item.color, "#ffffff", 0.3));
  g.addColorStop(1, mix(item.color, "#000000", 0.16));
  ctx.fillStyle = g;
  roundRectPath(ctx, x, cy - 5, keyW, 10, 3);
  ctx.fill();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * An emphasised point: the hue, lit from the upper left like everything else in
 * the kit, wearing a 2px ring of the surface colour.
 *
 * The ring is not an outline. It is a gap — the ground showing through — and it
 * is what keeps overlapping points countable and an endpoint legible where it
 * lands on a gridline.
 */
function surfaceDot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, theme: ThemeColors,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r + SURFACE_GAP / 2, 0, Math.PI * 2);
  ctx.strokeStyle = theme.surface;
  ctx.lineWidth = SURFACE_GAP;
  ctx.stroke();

  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, mix(color, "#ffffff", 0.5));
  g.addColorStop(0.6, color);
  g.addColorStop(1, mix(color, "#000000", 0.22));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Split a series at gaps, so a missing sample breaks the line instead of faking one. */
function finiteRuns(pts: readonly Pt[]): Pt[][] {
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  for (const p of pts) {
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
      run.push(p);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

function lastFinite(pts: readonly Pt[]): Pt | null {
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) return p;
  }
  return null;
}

/** White or near-black on a filled segment, whichever actually clears contrast. */
function readableInk(fill: string): string {
  const [r, g, b] = hex(fill);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#111820" : "#ffffff";
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function clampTo(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Blend two hex colours. Local copy so this module stands alone. */
function mix(a: string, b: string, t: number): string {
  const pa = hex(a), pb = hex(b);
  const k = clamp01(t);
  const c = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * k);
  return `#${[c(0), c(1), c(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hex(h: string): [number, number, number] {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [
    parseInt(s.slice(0, 2), 16) || 0,
    parseInt(s.slice(2, 4), 16) || 0,
    parseInt(s.slice(4, 6), 16) || 0,
  ];
}
