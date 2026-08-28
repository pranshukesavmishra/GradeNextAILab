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
