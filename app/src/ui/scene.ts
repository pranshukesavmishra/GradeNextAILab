import type { ThemeColors } from "@engine/types";
import { mixHex } from "./draw";

/**
 * Scene kit — the shared visual language of every simulation.
 *
 * `draw.ts` holds the measuring instruments of the platform: arrows, grids,
 * axes, the things that carry meaning. This file holds the *place* the
 * phenomenon happens in — sky, ground, materials, light, depth.
 *
 * The distinction matters. A bare grid with a hairline on it is a wireframe,
 * and a student reads a wireframe as an abstraction to be decoded. A scene
 * with a horizon, a lit ball and a shadow under it is somewhere real, and a
 * student reads that as a thing that happened. Same physics, different
 * willingness to believe it.
 *
 * Everything here derives its colour from the live theme, so scenes work in
 * both light and dark without a second implementation.
 */

/* ------------------------------------------------------------------ *
 * Backdrops
 * ------------------------------------------------------------------ */

export type SkyMood = "day" | "dusk" | "space" | "indoor" | "underwater" | "microscope";

/**
 * A vertical gradient backdrop. Grounds the scene in a place before anything
 * is drawn on it, and gives light-on-dark elements something to sit against.
 */
export function sky(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  theme: ThemeColors,
  mood: SkyMood = "day",
  horizonY?: number,
) {
  const dark = isDarkTheme(theme);
  const stops = skyStops(mood, dark, theme);
  const g = ctx.createLinearGradient(0, 0, 0, horizonY ?? h);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.55, stops[1]);
  g.addColorStop(1, stops[2]);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function skyStops(mood: SkyMood, dark: boolean, theme: ThemeColors): [string, string, string] {
  const s = theme.surface;
  switch (mood) {
    case "space":
      return dark
        ? ["#070b16", "#0a1024", "#0d1430"]
        : ["#141a30", "#1b2444", "#243056"];
    case "dusk":
      return dark
        ? ["#141026", "#26183a", "#3d2440"]
        : ["#39406e", "#7a5f86", "#c98b74"];
    case "underwater":
      return dark
        ? ["#04141c", "#062430", "#083242"]
        : ["#bfe6f0", "#8ccfe2", "#5cb4cf"];
    case "microscope":
      return dark
        ? ["#0b1410", "#0e1a16", "#12211c"]
        : ["#f2f7f2", "#e6f0e8", "#d8e8dc"];
    case "indoor":
      return [mixHex(s, "#000000", dark ? 0.06 : 0.0),
              mixHex(s, dark ? "#ffffff" : "#000000", 0.03),
              mixHex(s, dark ? "#ffffff" : "#000000", 0.06)];
    case "day":
    default:
      return dark
        ? ["#0c1424", "#122036", "#1a2c44"]
        : ["#dff0fb", "#c9e6f8", "#aed8f2"];
  }
}

/** True when the theme's surface is dark, so scenes can invert their lighting. */
export function isDarkTheme(theme: ThemeColors): boolean {
  return luminance(theme.surface) < 0.5;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Stars for a space backdrop. Deterministic from a seed so they never swim. */
export function starfield(
  ctx: CanvasRenderingContext2D, w: number, h: number, count = 90, seed = 1,
) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h;
    const r = 0.4 + rnd() * 1.1;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * A ground plane with body: a soil gradient, a grass or rock lip, and a
 * horizon line. `y` is the screen y of the surface.
 */
export function groundPlane(
  ctx: CanvasRenderingContext2D,
  y: number, x0: number, x1: number, bottom: number,
  theme: ThemeColors,
  kind: "grass" | "soil" | "rock" | "lab" | "water" = "grass",
) {
  const dark = isDarkTheme(theme);
  const [top, deep, lip] = groundColors(kind, dark);
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, Math.max(bottom, y + 40));
  g.addColorStop(0, top);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y, x1 - x0, Math.max(bottom - y, 40));

  // The lip catches the light and reads as a real surface edge.
  ctx.fillStyle = lip;
  ctx.fillRect(x0, y, x1 - x0, 3);
  ctx.restore();
}

function groundColors(kind: string, dark: boolean): [string, string, string] {
  switch (kind) {
    case "soil": return dark ? ["#3a2a1e", "#1e1610", "#4d3826"] : ["#a9825c", "#6b4f36", "#c39a70"];
    case "rock": return dark ? ["#2f3238", "#191b1f", "#41454d"] : ["#9aa1a9", "#6c737b", "#b6bcc4"];
    case "water": return dark ? ["#0b2a3a", "#051620", "#12455c"] : ["#6fb6d8", "#2f7fa6", "#96d0e8"];
    case "lab": return dark ? ["#22262c", "#14171b", "#2f343c"] : ["#d8dde3", "#b8bfc7", "#e8edf2"];
    case "grass":
    default: return dark ? ["#1d3524", "#0e1c13", "#2b4d33"] : ["#7fbf6a", "#4a8340", "#9ed488"];
  }
}

/** A soft darkening at the frame edge. Pushes the eye to the middle. */
export function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.18) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Objects with weight
 * ------------------------------------------------------------------ */

/**
 * A lit sphere: base colour, a highlight up and left, a darker rim.
 * This is the single most valuable primitive in the kit — a flat disc reads
 * as a token on a diagram, a shaded one reads as an object with mass.
 */
export function sphere(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string,
  opts: { rim?: boolean; glow?: number } = {},
) {
  if (r <= 0) return;
  ctx.save();
  if (opts.glow) {
    const gg = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * (1 + opts.glow));
    gg.addColorStop(0, hexA(color, 0.5));
    gg.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(x, y, r * (1 + opts.glow), 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(
    x - r * 0.35, y - r * 0.38, r * 0.08,
    x, y, r,
  );
  g.addColorStop(0, mixHex(color, "#ffffff", 0.55));
  g.addColorStop(0.5, color);
  g.addColorStop(1, mixHex(color, "#000000", 0.32));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (opts.rim !== false && r > 3) {
    ctx.strokeStyle = mixHex(color, "#000000", 0.45);
    ctx.lineWidth = Math.max(0.8, r * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

/** An elliptical contact shadow. Fades and widens with height above ground. */
export function contactShadow(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, r: number, heightAboveGround: number,
) {
  const fade = Math.max(0, 1 - heightAboveGround / (r * 26));
  if (fade <= 0.02) return;
  const rx = r * (1 + heightAboveGround / (r * 14)) * 1.15;
  const ry = Math.max(2, rx * 0.28);
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  const g = ctx.createRadialGradient(x, groundY, 0, x, groundY, rx);
  g.addColorStop(0, "rgba(0,0,0,0.85)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, groundY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A rounded bar with a vertical gradient and a lit top edge. */
export function material(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, color: string,
  radius = 4,
) {
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mixHex(color, "#ffffff", 0.3));
  g.addColorStop(0.5, color);
  g.addColorStop(1, mixHex(color, "#000000", 0.22));
  ctx.fillStyle = g;
  path(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = mixHex(color, "#000000", 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function path(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A radial glow, for anything that emits: lamps, stars, hot bodies. */
export function glow(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, strength = 0.55,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, strength));
  g.addColorStop(0.4, hexA(color, strength * 0.4));
  g.addColorStop(1, hexA(color, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A trail that tapers and fades toward its tail. */
export function comet(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[], color: string, maxWidth = 3,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 1; i < points.length; i++) {
    const t = i / (points.length - 1);
    ctx.globalAlpha = 0.08 + 0.62 * t;
    ctx.lineWidth = Math.max(0.6, maxWidth * (0.25 + 0.75 * t));
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * On-canvas typography
 * ------------------------------------------------------------------ */

/**
 * A readout badge drawn on the stage, beside the thing it describes.
 * Numbers next to the phenomenon beat numbers in a panel across the screen:
 * the student never has to look away to read the value they just changed.
 */
export function badge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, text: string, theme: ThemeColors,
  opts: { color?: string; align?: "left" | "center" | "right"; sub?: string } = {},
) {
  const color = opts.color ?? theme.accent;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  const tw = ctx.measureText(text).width;
  let sw = 0;
  if (opts.sub) {
    ctx.font = "500 10px ui-monospace, monospace";
    sw = ctx.measureText(opts.sub).width;
  }
  const w = Math.max(tw, sw) + 16;
  const h = opts.sub ? 32 : 22;
  const bx = opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x;
  const by = y - h / 2;

  ctx.fillStyle = dark ? "rgba(16,22,30,0.82)" : "rgba(255,255,255,0.86)";
  path(ctx, bx, by, w, h, 7);
  ctx.fill();
  ctx.strokeStyle = hexA(color, 0.55);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(text, bx + w / 2, by + (opts.sub ? 11 : h / 2));
  if (opts.sub) {
    ctx.font = "500 10px ui-monospace, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.fillText(opts.sub, bx + w / 2, by + 23);
  }
  ctx.restore();
}

/** A caption anchored to the stage, for naming a region of the scene. */
export function caption(
  ctx: CanvasRenderingContext2D, x: number, y: number, text: string, theme: ThemeColors,
  opts: { align?: CanvasTextAlign; size?: number; color?: string; weight?: number } = {},
) {
  ctx.save();
  ctx.font = `${opts.weight ?? 600} ${opts.size ?? 13}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  // A halo keeps text readable over any scene without a slab behind it.
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = isDarkTheme(theme) ? "rgba(8,12,18,0.75)" : "rgba(255,255,255,0.8)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = opts.color ?? theme.ink;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Hex colour with an alpha channel, accepting #rgb or #rrggbb. */
export function hexA(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** Draw with a drop shadow, then restore. For lifting an object off the scene. */
export function lifted(
  ctx: CanvasRenderingContext2D, blur: number, dy: number, draw: () => void, alpha = 0.25,
) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = dy;
  draw();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Gradients
 *
 * A flat fill is the single loudest signal that something was diagrammed
 * rather than designed. Almost every surface in the real world has a
 * gradient across it, because almost every surface is lit from somewhere.
 * ------------------------------------------------------------------ */

/** A gradient stop: a bare colour (spaced evenly), or one pinned to a position. */
export type Stop = string | { at: number; color: string };

/**
 * Build a linear gradient across a box at any angle, in degrees measured
 * clockwise from the +x axis: `0` runs left→right, `90` top→bottom, `135`
 * down-and-right like a light source over your left shoulder.
 *
 * Use this when you need the gradient *object* — to stroke with it, to fill a
 * non-rectangular path with it, to reuse it across several shapes. When you
 * just want the box filled, call {@link gradientFill}.
 */
export function gradient(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  stops: readonly Stop[],
  angle = 90,
): CanvasGradient {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const cx = x + w / 2, cy = y + h / 2;
  // Project the box onto the gradient direction so the ramp always spans it.
  const half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  const n = stops.length;
  if (n === 0) return g;
  if (n === 1) {
    const only = typeof stops[0] === "string" ? stops[0] : stops[0].color;
    g.addColorStop(0, only);
    g.addColorStop(1, only);
    return g;
  }
  for (let i = 0; i < n; i++) {
    const s = stops[i];
    if (typeof s === "string") g.addColorStop(i / (n - 1), s);
    else g.addColorStop(Math.max(0, Math.min(1, s.at)), s.color);
  }
  return g;
}

/**
 * Fill a rectangle with a multi-stop gradient at any angle.
 *
 * The workhorse of a designed scene: sky bands, tabletops, panel backings,
 * the wash behind a title. Reach for it instead of `fillRect` with a flat
 * colour anywhere the area is larger than an icon.
 */
export function gradientFill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  stops: readonly Stop[],
  angle = 90,
) {
  if (w <= 0 || h <= 0 || stops.length === 0) return;
  ctx.save();
  ctx.fillStyle = gradient(ctx, x, y, w, h, stops, angle);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Materials
 * ------------------------------------------------------------------ */

/**
 * A frosted translucent panel with a lit edge and a top sheen — glass.
 *
 * This is what a beaker, a test tube wall, a tank, a bell jar or a HUD card
 * is made of. Draw the *contents* first and the glass over them: the panel is
 * translucent, so whatever is behind shows through slightly milkier, which is
 * exactly the cue that says "there is a surface between you and that".
 */
export function glass(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number,
  theme: ThemeColors,
  opts: { tint?: string; alpha?: number; sheen?: boolean; edge?: string } = {},
) {
  if (w <= 0 || h <= 0) return;
  const dark = isDarkTheme(theme);
  const tint = opts.tint ?? (dark ? "#9ec8e8" : "#ffffff");
  const a = opts.alpha ?? (dark ? 0.14 : 0.4);
  const edge = opts.edge ?? (dark ? "#cfe6f7" : "#ffffff");
  ctx.save();
  path(ctx, x, y, w, h, r);
  ctx.fillStyle = gradient(ctx, x, y, w, h, [
    { at: 0, color: hexA(tint, a * 1.5) },
    { at: 0.42, color: hexA(tint, a * 0.45) },
    { at: 1, color: hexA(tint, a * 0.95) },
  ], 90);
  ctx.fill();

  if (opts.sheen !== false) {
    // A narrow vertical highlight down the left shoulder: the giveaway that a
    // surface is curved and specular rather than a printed rectangle.
    ctx.save();
    ctx.clip();
    const sw = Math.max(2, w * 0.1);
    ctx.fillStyle = gradient(ctx, x + w * 0.08, y, sw, h, [
      hexA(edge, 0.34), hexA(edge, 0.06), hexA(edge, 0),
    ], 0);
    ctx.fillRect(x + w * 0.08, y, sw, h);
    ctx.fillStyle = gradient(ctx, x, y, w, h * 0.34, [hexA(edge, 0.22), hexA(edge, 0)], 90);
    ctx.fillRect(x, y, w, h * 0.34);
    ctx.restore();
  }

  // Two edges: a bright one where the light lands, a dim one everywhere else.
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexA(edge, dark ? 0.45 : 0.85);
  path(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
  ctx.stroke();
  ctx.strokeStyle = dark ? "rgba(0,0,0,0.35)" : "rgba(30,50,70,0.22)";
  path(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/**
 * Brushed metal: a stack of specular bands rather than one smooth ramp.
 *
 * Metal is not "grey with a gradient" — it is bright, dark, bright again in
 * quick succession, because it mirrors a room. Use it for apparatus: stands,
 * rails, clamps, casings, weights, anything that should feel machined and
 * heavy next to a plastic or painted part.
 */
export function metal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  opts: { radius?: number; angle?: number; polish?: number } = {},
) {
  if (w <= 0 || h <= 0) return;
  const r = opts.radius ?? 3;
  const angle = opts.angle ?? 90;
  const p = Math.max(0, Math.min(1, opts.polish ?? 1));
  ctx.save();
  path(ctx, x, y, w, h, r);
  ctx.fillStyle = gradient(ctx, x, y, w, h, [
    { at: 0, color: mixHex(color, "#ffffff", 0.55 * p) },
    { at: 0.14, color: mixHex(color, "#ffffff", 0.2 * p) },
    { at: 0.34, color: color },
    { at: 0.52, color: mixHex(color, "#000000", 0.3 * p) },
    { at: 0.68, color: mixHex(color, "#ffffff", 0.34 * p) },
    { at: 0.86, color: mixHex(color, "#000000", 0.2 * p) },
    { at: 1, color: mixHex(color, "#ffffff", 0.12 * p) },
  ], angle);
  ctx.fill();
  ctx.strokeStyle = mixHex(color, "#000000", 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Moulded plastic: one soft body ramp plus a glossy cap on the upper half.
 *
 * The counterpart to {@link metal}. Use it for cases, knobs, toy-like parts,
 * coloured blocks, syringe bodies — anything that should read as light,
 * manufactured and friendly rather than machined.
 */
export function plastic(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  opts: { radius?: number; gloss?: number; matte?: boolean } = {},
) {
  if (w <= 0 || h <= 0) return;
  const r = opts.radius ?? Math.min(w, h) * 0.22;
  const gloss = Math.max(0, Math.min(1, opts.gloss ?? (opts.matte ? 0.18 : 0.6)));
  ctx.save();
  path(ctx, x, y, w, h, r);
  ctx.fillStyle = gradient(ctx, x, y, w, h, [
    { at: 0, color: mixHex(color, "#ffffff", 0.26) },
    { at: 0.45, color: color },
    { at: 0.82, color: mixHex(color, "#000000", 0.24) },
    { at: 1, color: mixHex(color, "#000000", 0.1) },
  ], 90);
  ctx.fill();

  ctx.save();
  ctx.clip();
  const gh = h * 0.46;
  ctx.fillStyle = gradient(ctx, x, y, w, gh, [hexA("#ffffff", 0.55 * gloss), hexA("#ffffff", 0)], 90);
  path(ctx, x + w * 0.06, y + h * 0.05, w * 0.88, gh, r);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = mixHex(color, "#000000", 0.42);
  path(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Light and depth
 * ------------------------------------------------------------------ */

/** Anything that builds a path on the context. Passed to the edge-light helpers. */
export type ScenePath = (ctx: CanvasRenderingContext2D) => void;

/**
 * Draw something with a soft drop shadow underneath it, then clean up.
 *
 * The options-object sibling of {@link lifted}, and the one to reach for in
 * new code: it takes a colour, so a shadow on a dark scene can be a deeper
 * blue-black rather than a grey smudge. One shadow separates a card from its
 * backdrop; three shadows at three depths make a scene.
 */
export function softShadow(
  ctx: CanvasRenderingContext2D,
  drawFn: () => void,
  opts: { blur?: number; dy?: number; dx?: number; alpha?: number; color?: string } = {},
) {
  const a = opts.alpha ?? 0.25;
  ctx.save();
  ctx.shadowColor = opts.color ? hexA(opts.color, a) : `rgba(0,0,0,${a})`;
  ctx.shadowBlur = opts.blur ?? 12;
  ctx.shadowOffsetX = opts.dx ?? 0;
  ctx.shadowOffsetY = opts.dy ?? 4;
  drawFn();
  ctx.restore();
}

/**
 * Glow inward from the inside of a shape's edge.
 *
 * Use it to make a container feel like it has depth — the lit interior of a
 * tube, the hot inner wall of a reaction vessel, the accent that says a panel
 * is selected. Costs a handful of clipped strokes, no per-pixel work.
 */
export function innerGlow(
  ctx: CanvasRenderingContext2D,
  shape: ScenePath,
  color: string,
  opts: { inset?: number; alpha?: number; steps?: number } = {},
) {
  const inset = Math.max(1, opts.inset ?? 10);
  const alpha = opts.alpha ?? 0.4;
  const steps = Math.max(1, Math.min(6, Math.round(opts.steps ?? 3)));
  ctx.save();
  shape(ctx);
  ctx.clip();
  ctx.lineJoin = "round";
  // Each pass is wider and faint; clipped, they stack up densest at the edge.
  const per = 1 - Math.pow(1 - alpha, 1 / steps);
  for (let i = 0; i < steps; i++) {
    ctx.lineWidth = (inset * 2 * (i + 1)) / steps;
    ctx.strokeStyle = hexA(color, per);
    shape(ctx);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A bright line along the edge of a shape, brightest where the light hits.
 *
 * Rim light is the cheapest trick in the kit for making an object *sit* in a
 * scene instead of floating on top of it: it ties the object's silhouette to
 * the scene's light direction. Pass `bounds` to get a real falloff around the
 * shape; without it the rim is an even hairline.
 */
export function rimLight(
  ctx: CanvasRenderingContext2D,
  shape: ScenePath,
  color: string,
  opts: {
    width?: number; alpha?: number; angle?: number;
    bounds?: { x: number; y: number; w: number; h: number };
  } = {},
) {
  const a = opts.alpha ?? 0.85;
  ctx.save();
  ctx.lineWidth = opts.width ?? 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const b = opts.bounds;
  ctx.strokeStyle = b
    ? gradient(ctx, b.x, b.y, b.w, b.h, [
        { at: 0, color: hexA(color, a) },
        { at: 0.5, color: hexA(color, a * 0.3) },
        { at: 1, color: hexA(color, 0) },
      ], opts.angle ?? 115)
    : hexA(color, a);
  shape(ctx);
  ctx.stroke();
  ctx.restore();
}

/**
 * A soft elliptical blob of shade under a sprite.
 *
 * Use it where {@link contactShadow}'s height-driven falloff is more than you
 * need: a stationary object, a label plate, a cell on a slide. Nothing looks
 * more pasted-on than an object with no shadow at all.
 */
export function spriteShadowEllipse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rx: number, ry: number,
  opts: { alpha?: number; color?: string } = {},
) {
  if (rx <= 0 || ry <= 0) return;
  const alpha = opts.alpha ?? 0.28;
  const c = opts.color ?? "#000000";
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, hexA(c, alpha));
  g.addColorStop(0.6, hexA(c, alpha * 0.45));
  g.addColorStop(1, hexA(c, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A rounded rectangle with a machined bevel: lit along the top-left inner
 * edge, shaded along the bottom-right.
 *
 * Use it for anything with a physical face — instrument housings, buttons,
 * tiles, the frame of a readout. Two hairlines are all it takes to turn a
 * flat rectangle into a raised (or, with `depth` negative, recessed) surface.
 */
export function bevelRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  color: string,
  opts: { depth?: number; fill?: boolean } = {},
) {
  if (w <= 0 || h <= 0) return;
  const depth = opts.depth ?? 1;
  const up = depth >= 0;
  const d = Math.min(3, Math.abs(depth) * 1.5) || 1;
  const rr = Math.min(r, w / 2, h / 2);
  ctx.save();
  if (opts.fill !== false) {
    path(ctx, x, y, w, h, rr);
    ctx.fillStyle = gradient(ctx, x, y, w, h, [
      mixHex(color, up ? "#ffffff" : "#000000", 0.12),
      color,
      mixHex(color, up ? "#000000" : "#ffffff", 0.14),
    ], 90);
    ctx.fill();
  }
  ctx.lineWidth = d;
  // Top-left highlight, drawn inside the shape so corners stay crisp.
  ctx.save();
  path(ctx, x, y, w, h, rr);
  ctx.clip();
  ctx.strokeStyle = hexA(up ? "#ffffff" : "#000000", 0.42);
  ctx.beginPath();
  ctx.moveTo(x + d / 2, y + h - rr);
  ctx.lineTo(x + d / 2, y + rr);
  ctx.arcTo(x + d / 2, y + d / 2, x + rr, y + d / 2, rr);
  ctx.lineTo(x + w - rr, y + d / 2);
  ctx.stroke();
  ctx.strokeStyle = hexA(up ? "#000000" : "#ffffff", 0.3);
  ctx.beginPath();
  ctx.moveTo(x + w - d / 2, y + rr);
  ctx.lineTo(x + w - d / 2, y + h - rr);
  ctx.arcTo(x + w - d / 2, y + h - d / 2, x + w - rr, y + h - d / 2, rr);
  ctx.lineTo(x + rr, y + h - d / 2);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/**
 * Diagonal hatching inside a rectangle.
 *
 * The standard drawing convention for "this is cut through", "this region is
 * excluded" or "this band is out of range" — and far better than a flat wash,
 * because hatching lets the thing underneath stay readable.
 */
export function hatchFill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  opts: { gap?: number; angle?: number; width?: number; alpha?: number } = {},
) {
  if (w <= 0 || h <= 0) return;
  const gap = Math.max(2, opts.gap ?? 7);
  const span = Math.abs(w) + Math.abs(h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(((opts.angle ?? 45) * Math.PI) / 180);
  ctx.strokeStyle = hexA(color, opts.alpha ?? 0.35);
  ctx.lineWidth = opts.width ?? 1;
  ctx.beginPath();
  for (let i = -span / 2; i <= span / 2; i += gap) {
    ctx.moveTo(i, -span / 2);
    ctx.lineTo(i, span / 2);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * A sparse deterministic speckle over a region — grain, dust, film noise.
 *
 * Perfectly clean fills read as vector art; a whisper of grain reads as a
 * photograph of something. Deliberately drawn as a few hundred dots rather
 * than a per-pixel loop, so it costs nothing on a school Chromebook, and
 * seeded so it never crawls between frames.
 */
export function noiseWash(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { alpha?: number; seed?: number; count?: number; color?: string; size?: number } = {},
) {
  if (w <= 0 || h <= 0) return;
  const count = Math.max(0, Math.min(600, Math.round(opts.count ?? (w * h) / 900)));
  if (count === 0) return;
  let s = (opts.seed ?? 7) >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const size = opts.size ?? 1.2;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 0.05;
  ctx.fillStyle = opts.color ?? "#ffffff";
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const px = x + rnd() * w, py = y + rnd() * h;
    const r = size * (0.5 + rnd());
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Fields, flows and instruments
 * ------------------------------------------------------------------ */

/** One particle. `r` and `a` override the field defaults for that dot alone. */
export interface Particle {
  x: number;
  y: number;
  /** Radius in px. Falls back to `opts.size`. */
  r?: number;
  /** Opacity 0–1. Falls back to `opts.alpha`. */
  a?: number;
}

/**
 * A cloud of particles drawn in a handful of batched passes.
 *
 * Gas molecules, dust, pollen, plankton, sparks, ions, rain. Points are
 * bucketed by opacity so the whole field costs a few `fill()` calls instead of
 * one per particle, which is the difference between 3000 molecules at 60fps
 * and a slideshow. Nothing is allocated per frame — pass the same array you
 * mutate in your step function.
 */
export function particleField(
  ctx: CanvasRenderingContext2D,
  pts: readonly Particle[],
  color: string,
  opts: { size?: number; alpha?: number; buckets?: number; glow?: number } = {},
) {
  const n = pts.length;
  if (n === 0) return;
  const size = opts.size ?? 1.6;
  const base = opts.alpha ?? 0.8;
  const buckets = Math.max(1, Math.min(6, Math.round(opts.buckets ?? 4)));
  ctx.save();
  ctx.fillStyle = color;
  if (opts.glow) {
    ctx.shadowColor = hexA(color, 0.85);
    ctx.shadowBlur = opts.glow;
  }
  for (let b = 0; b < buckets; b++) {
    const lo = b / buckets, hi = (b + 1) / buckets;
    ctx.globalAlpha = base * (buckets === 1 ? 1 : (lo + hi) / 2);
    ctx.beginPath();
    let any = false;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const pa = p.a ?? 1;
      // Uniform fields land wholly in the top bucket, so this stays one pass.
      if (buckets > 1 && !(pa > lo && (pa <= hi || (b === buckets - 1 && pa > hi)))) continue;
      const r = p.r ?? size;
      if (r <= 0) continue;
      ctx.moveTo(p.x + r, p.y);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      any = true;
    }
    if (any) ctx.fill();
  }
  ctx.restore();
}

/**
 * A smooth tapered ribbon along a polyline, shaded from one colour to another.
 *
 * The right shape for anything that *flows*: blood through a vessel, energy
 * down a chain, current along a wire, a jet stream, a signal down an axon. A
 * plain stroked line says "here is a path"; a ribbon that swells in the middle
 * and thins at both ends says "something is moving through here".
 */
export function ribbon(
  ctx: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  width: number,
  colorA: string,
  colorB: string,
  opts: { taper?: number; alpha?: number; core?: boolean } = {},
) {
  const n = points.length;
  if (n < 2 || width <= 0) return;
  const taper = Math.max(0, Math.min(1, opts.taper ?? 1));
  const half = width / 2;

  const halfAt = (i: number) => {
    const t = i / (n - 1);
    const edge = Math.min(1, Math.min(t, 1 - t) * 5);
    return half * (1 - taper + taper * edge);
  };
  // Normal of the segment either side of a vertex — a cheap stand-in for the
  // true miter, and visually identical at these widths.
  const nx = (i: number) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return -dy / len;
  };
  const ny = (i: number) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return dx / len;
  };

  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const hw = halfAt(i);
    const px = points[i].x + nx(i) * hw, py = points[i].y + ny(i) * hw;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  for (let i = n - 1; i >= 0; i--) {
    const hw = halfAt(i);
    ctx.lineTo(points[i].x - nx(i) * hw, points[i].y - ny(i) * hw);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(points[0].x, points[0].y, points[n - 1].x, points[n - 1].y);
  g.addColorStop(0, colorA);
  g.addColorStop(1, colorB);
  ctx.fillStyle = g;
  ctx.fill();

  if (opts.core) {
    // A bright thread down the middle: reads as the fast core of the flow.
    ctx.globalAlpha = (opts.alpha ?? 1) * 0.5;
    ctx.strokeStyle = mixHex(colorA, "#ffffff", 0.5);
    ctx.lineWidth = Math.max(0.7, width * 0.18);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Reused so the animated dash pattern never allocates inside a render loop. */
const _dashPattern: [number, number] = [6, 8];
const _noDash: number[] = [];

/**
 * Marching dashes along a path — direction of flow, made obvious.
 *
 * Advance `phase` a little every frame (positive moves along the point order)
 * and the dashes crawl. This is how a student *sees* which way current, air,
 * water, heat or a signal is travelling, without a single arrowhead cluttering
 * the diagram. Pair it with {@link ribbon} — the ribbon is the vessel, the
 * dashes are the contents moving inside it.
 */
export function dashFlow(
  ctx: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  color: string,
  phase: number,
  opts: { width?: number; dash?: number; gap?: number; alpha?: number; glow?: number } = {},
) {
  const n = points.length;
  if (n < 2) return;
  _dashPattern[0] = opts.dash ?? 6;
  _dashPattern[1] = opts.gap ?? 8;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.setLineDash(_dashPattern);
  ctx.lineDashOffset = -phase;
  if (opts.glow) {
    ctx.strokeStyle = hexA(color, (opts.alpha ?? 0.9) * 0.3);
    ctx.lineWidth = (opts.width ?? 2.4) + opts.glow;
    ctx.stroke();
  }
  ctx.strokeStyle = hexA(color, opts.alpha ?? 0.9);
  ctx.lineWidth = opts.width ?? 2.4;
  ctx.stroke();
  ctx.setLineDash(_noDash);
  ctx.restore();
}

/**
 * A circular gauge: a track, a filled arc, a tick ring and a value in the eye.
 *
 * Use it for any bounded quantity a student is steering — charge left, pH,
 * pressure, load, concentration, progress to completion. A gauge beats a bar
 * when the value is *out of a maximum*, because the empty arc shows the
 * headroom as plainly as the filled one shows the value.
 */
export function arcGauge(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  frac: number,
  color: string,
  theme: ThemeColors,
  label?: string,
  opts: { sub?: string; width?: number; start?: number; sweep?: number; ticks?: number } = {},
) {
  if (r <= 2) return;
  const dark = isDarkTheme(theme);
  const f = Math.max(0, Math.min(1, frac));
  const lw = opts.width ?? Math.max(4, r * 0.18);
  const start = ((opts.start ?? 135) * Math.PI) / 180;
  const sweep = ((opts.sweep ?? 270) * Math.PI) / 180;
  const rr = r - lw / 2;
  ctx.save();
  ctx.lineCap = "round";

  ctx.strokeStyle = hexA(theme.grid, dark ? 0.5 : 0.7);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx, cy, rr, start, start + sweep);
  ctx.stroke();

  const ticks = opts.ticks ?? 0;
  if (ticks > 1) {
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < ticks; i++) {
      const a = start + (sweep * i) / (ticks - 1);
      const ca = Math.cos(a), sa = Math.sin(a);
      ctx.moveTo(cx + ca * (r + 2), cy + sa * (r + 2));
      ctx.lineTo(cx + ca * (r + 6), cy + sa * (r + 6));
    }
    ctx.stroke();
  }

  if (f > 0.001) {
    ctx.save();
    ctx.shadowColor = hexA(color, 0.5);
    ctx.shadowBlur = lw * 0.9;
    ctx.strokeStyle = gradient(ctx, cx - r, cy - r, r * 2, r * 2,
      [mixHex(color, "#ffffff", 0.4), color, mixHex(color, "#000000", 0.12)], 120);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, start, start + sweep * f);
    ctx.stroke();
    ctx.restore();
    // A bright cap at the head of the arc, so the eye lands on the value.
    const ea = start + sweep * f;
    ctx.fillStyle = mixHex(color, "#ffffff", 0.55);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ea) * rr, cy + Math.sin(ea) * rr, lw * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  if (label) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.ink;
    ctx.font = `700 ${Math.max(11, Math.round(r * 0.42))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(label, cx, cy - (opts.sub ? r * 0.1 : 0));
    if (opts.sub) {
      ctx.fillStyle = theme.inkSoft;
      ctx.font = `500 ${Math.max(9, Math.round(r * 0.2))}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillText(opts.sub, cx, cy + r * 0.28);
    }
  }
  ctx.restore();
}

/**
 * An engineering grid: quiet minor squares with a stronger line every few.
 *
 * The corrective for a hairline mesh at one uniform weight, which fights the
 * content for attention and makes every scene look like graph paper from a
 * maths exercise. Two weights give the eye a scale to measure against while
 * staying firmly in the background. Draw it straight after the backdrop —
 * `fade` washes the edges back into the surface colour, which only looks right
 * with nothing else on the canvas yet.
 */
export function gridPaper(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  theme: ThemeColors,
  opts: { step?: number; major?: number; alpha?: number; originX?: number; originY?: number; fade?: number } = {},
) {
  const step = Math.max(4, opts.step ?? 24);
  const major = Math.max(1, Math.round(opts.major ?? 4));
  const alpha = opts.alpha ?? (isDarkTheme(theme) ? 0.5 : 0.65);
  const ox = opts.originX ?? 0, oy = opts.originY ?? 0;
  ctx.save();
  ctx.lineWidth = 1;

  for (const pass of [0, 1]) {
    ctx.strokeStyle = hexA(theme.grid, alpha * (pass === 0 ? 0.35 : 1));
    ctx.beginPath();
    let i = Math.floor((0 - ox) / step);
    for (let x = ox + i * step; x <= w; x += step, i++) {
      if ((Math.abs(i) % major === 0) !== (pass === 1)) continue;
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
    }
    let j = Math.floor((0 - oy) / step);
    for (let y = oy + j * step; y <= h; y += step, j++) {
      if ((Math.abs(j) % major === 0) !== (pass === 1)) continue;
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(w, Math.round(y) + 0.5);
    }
    ctx.stroke();
  }

  if (opts.fade) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.62);
    g.addColorStop(0, hexA(theme.surface, 0));
    g.addColorStop(1, hexA(theme.surface, Math.max(0, Math.min(1, opts.fade))));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Labelling
 * ------------------------------------------------------------------ */

/** The plate a {@link labelLeader} drew, so callers can stack labels without collisions. */
export interface LabelPlate { x: number; y: number; w: number; h: number }

/**
 * A leader line from a point on a diagram out to a text plate: a dot on the
 * part, a diagonal run, a short horizontal elbow, then the words.
 *
 * This is the primitive that makes an anatomical or structural diagram look
 * like it came from a textbook rather than a whiteboard. Text laid directly on
 * a part fights the artwork and collides with its neighbours; a leader lets the
 * labels live in the calm margin while still pointing at exactly one pixel.
 *
 * The returned rectangle is the plate that was drawn — keep the ones you have
 * placed and nudge `toY` until a new plate clears them, and a dense diagram
 * labels itself without overlap.
 */
export function labelLeader(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  text: string,
  theme: ThemeColors,
  opts: {
    color?: string; size?: number; sub?: string;
    plate?: boolean; dot?: boolean; tail?: number;
    align?: "auto" | "left" | "right"; alpha?: number;
  } = {},
): LabelPlate {
  const dark = isDarkTheme(theme);
  const color = opts.color ?? theme.accent;
  const size = opts.size ?? 12;
  const tail = opts.tail ?? 14;
  const alpha = opts.alpha ?? 1;
  // Which way the plate opens: away from the thing it points at, unless told.
  const side = opts.align === "left" ? -1 : opts.align === "right" ? 1 : toX >= fromX ? 1 : -1;

  ctx.save();
  ctx.globalAlpha = alpha;
  const titleFont = `600 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  const subFont = `500 ${Math.max(9, size - 2)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.font = titleFont;
  const tw = ctx.measureText(text).width;
  let sw = 0;
  if (opts.sub) {
    ctx.font = subFont;
    sw = ctx.measureText(opts.sub).width;
  }
  const padX = 9, padY = 6;
  const pw = Math.max(tw, sw) + padX * 2 + 3;
  const ph = (opts.sub ? size + Math.max(9, size - 2) + 4 : size + 2) + padY * 2;
  const px = side === 1 ? toX : toX - pw;
  const py = toY - ph / 2;
  const kneeX = toX - side * tail;

  // Halo first, then the line: keeps the leader readable over a busy scene.
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass === 0
      ? (dark ? "rgba(8,12,18,0.7)" : "rgba(255,255,255,0.8)")
      : hexA(color, 0.8);
    ctx.lineWidth = pass === 0 ? 3.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(kneeX, toY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }

  if (opts.dot !== false) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fromX, fromY, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark ? "rgba(8,12,18,0.8)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (opts.plate !== false) {
    softShadow(ctx, () => {
      ctx.fillStyle = dark ? "rgba(16,22,30,0.88)" : "rgba(255,255,255,0.92)";
      path(ctx, px, py, pw, ph, 6);
      ctx.fill();
    }, { blur: 8, dy: 2, alpha: dark ? 0.4 : 0.16 });
    ctx.strokeStyle = hexA(color, 0.35);
    ctx.lineWidth = 1;
    path(ctx, px + 0.5, py + 0.5, pw - 1, ph - 1, 5.5);
    ctx.stroke();
    // An accent spine on the edge facing the part, tying plate to leader.
    ctx.save();
    path(ctx, px, py, pw, ph, 6);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(side === 1 ? px : px + pw - 2.5, py, 2.5, ph);
    ctx.restore();
  }

  const tx = side === 1 ? px + padX + 3 : px + padX;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.ink;
  ctx.font = titleFont;
  ctx.fillText(text, tx, opts.sub ? py + padY + size * 0.5 : py + ph / 2);
  if (opts.sub) {
    ctx.font = subFont;
    ctx.fillStyle = theme.inkSoft;
    ctx.fillText(opts.sub, tx, py + ph - padY - Math.max(9, size - 2) * 0.5);
  }
  ctx.restore();
  return { x: px, y: py, w: pw, h: ph };
}

/* ------------------------------------------------------------------ *
 * Motion
 *
 * Linear motion is the tell of a simulation that was wired up rather than
 * animated. Real things start slowly, overshoot, settle. These are the three
 * curves that cover almost every transition in the platform.
 * ------------------------------------------------------------------ */

/** Clamp to 0–1. The guard in front of every easing curve. */
export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Linear blend from `a` to `b`. Pair with an easing curve, not used bare. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Ease in and out of a 0→1 transition.
 *
 * The default for anything that moves between two states — a panel sliding, a
 * value counting up, a camera nudging across. Accelerating out of rest and
 * braking into the target is what makes motion look intentional.
 */
export function easeInOut(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * A 0→1→0 sine breath at `hz` cycles per second, from a time in seconds.
 *
 * For anything alive or waiting: a beating heart, a blinking indicator, the
 * halo on a control the student has not touched yet, the shimmer on a hot
 * body. Multiply it into an alpha or a radius rather than a position.
 */
export function pulse(time: number, hz = 1): number {
  return (Math.sin(time * hz * Math.PI * 2) + 1) / 2;
}

/**
 * A damped spring settling on 1, overshooting slightly on the way.
 *
 * Use it when something *arrives*: a reading snapping to a new value, a needle
 * landing, an object dropping into place. The small overshoot is the whole
 * point — it is what tells the eye the thing has mass.
 */
export function spring(t: number): number {
  const x = clamp01(t);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-7.5 * x) * Math.cos(9 * x);
}

/* ------------------------------------------------------------------ *
 * Label placement — never let two labels overlap
 * ------------------------------------------------------------------ */

interface Placed { x: number; y: number; w: number; h: number }

/**
 * A per-frame register of where labels have already been drawn.
 *
 * Simulations place labels next to the thing they describe, and when two
 * things drift close together their labels land on top of each other and both
 * become unreadable. Every screenshot of a busy scene showed this. So labels
 * claim a rectangle here, and a label that would collide is nudged clear
 * before it is drawn rather than being allowed to overwrite its neighbour.
 *
 * Call `beginLabels()` once at the top of a render, then place through
 * `labelBox`. The register is per-canvas, keyed by the context.
 */
const labelRegisters = new WeakMap<CanvasRenderingContext2D, Placed[]>();

export function beginLabels(ctx: CanvasRenderingContext2D): void {
  labelRegisters.set(ctx, []);
}

/**
 * Claim a rectangle for a label, nudging it clear of anything already placed.
 * Returns the position actually granted, which the caller must draw at.
 */
export function labelBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { bounds?: { w: number; h: number }; maxNudge?: number } = {},
): { x: number; y: number } {
  const taken = labelRegisters.get(ctx);
  if (!taken) return { x, y };

  const step = h + 6;
  const limit = opts.maxNudge ?? 6;
  let ny = y;

  const hits = (ty: number) =>
    taken.some((p) =>
      x < p.x + p.w + 4 && x + w + 4 > p.x && ty < p.y + p.h + 3 && ty + h + 3 > p.y);

  // Try alternating above and below the requested spot, taking the first clear
  // slot. Alternating keeps a column of labels centred on its subjects rather
  // than drifting steadily downward.
  for (let i = 0; i <= limit && hits(ny); i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const mag = Math.ceil((i + 1) / 2) * step;
    ny = y + dir * mag;
    if (opts.bounds) ny = Math.max(2, Math.min(opts.bounds.h - h - 2, ny));
  }

  taken.push({ x, y: ny, w, h });
  return { x, y: ny };
}

/**
 * Text with a halo, placed so it cannot collide with another label.
 * Returns the box it occupied, so callers can draw a leader line to it.
 */
export function safeLabel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, text: string, theme: ThemeColors,
  opts: {
    size?: number; weight?: number; color?: string;
    align?: CanvasTextAlign; bounds?: { w: number; h: number };
  } = {},
): { x: number; y: number; w: number; h: number } {
  const size = opts.size ?? 12;
  ctx.save();
  ctx.font = `${opts.weight ?? 600} ${size}px "Source Sans 3", system-ui, sans-serif`;
  const w = ctx.measureText(text).width;
  const h = size + 4;
  const align = opts.align ?? "left";
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;

  const pos = labelBox(ctx, left, y - h / 2, w, h, opts.bounds ? { bounds: opts.bounds } : {});
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = isDarkTheme(theme) ? "rgba(8,10,16,0.8)" : "rgba(255,255,255,0.86)";
  ctx.strokeText(text, pos.x, pos.y + h / 2);
  ctx.fillStyle = opts.color ?? theme.ink;
  ctx.fillText(text, pos.x, pos.y + h / 2);
  ctx.restore();
  return { x: pos.x, y: pos.y, w, h };
}
