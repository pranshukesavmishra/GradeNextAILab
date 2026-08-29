import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Labware — the physical apparatus of a science lab.
 *
 * A beaker drawn as a trapezoid outline is a symbol for a beaker. Real
 * glassware has a thick rolled rim, a bright vertical highlight down one side,
 * a curved meniscus where the liquid meets the wall, and it bends what is
 * behind it. Students recognise the real thing instantly and read the symbol
 * only after being taught to; drawing the real thing removes a translation step.
 *
 * Light arrives from the upper left, matching `organic.ts` and the scene kit,
 * so apparatus and specimens share one consistent scene.
 */

const KEY = { x: -0.38, y: -0.42 };

/* ------------------------------------------------------------------ *
 * Glassware
 * ------------------------------------------------------------------ */

export interface LiquidSpec {
  /** 0-1 of the vessel's usable height. */
  level: number;
  color: string;
  /** Rising bubbles, for a boiling or reacting liquid. */
  bubbles?: number;
  /** Suspended solid settling at the bottom. */
  precipitate?: number;
  /** Animation clock. */
  t?: number;
}

/** A beaker: straight walls, pouring spout, rolled rim, graduation marks. */
export function beaker(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  const rim = h * 0.045;
  ctx.save();

  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(x, y + rim);
    ctx.lineTo(x, y + h - w * 0.09);
    ctx.quadraticCurveTo(x, y + h, x + w * 0.09, y + h);
    ctx.lineTo(x + w - w * 0.09, y + h);
    ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - w * 0.09);
    ctx.lineTo(x + w, y + rim);
  };

  if (liquid) drawLiquid(ctx, x, y + rim, w, h - rim, liquid, () => bodyPath());

  // Glass over the liquid
  bodyPath();
  const gl = ctx.createLinearGradient(x, 0, x + w, 0);
  gl.addColorStop(0, hexA("#ffffff", dark ? 0.14 : 0.4));
  gl.addColorStop(0.14, hexA("#ffffff", 0.05));
  gl.addColorStop(0.82, hexA("#ffffff", 0.04));
  gl.addColorStop(1, hexA("#ffffff", dark ? 0.1 : 0.24));
  ctx.fillStyle = gl;
  ctx.fill();
  ctx.strokeStyle = hexA(dark ? "#cbb8d8" : "#6a5a78", 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  graduations(ctx, x + w * 0.1, y + rim + h * 0.1, h * 0.72, w * 0.16, dark);
  highlights(ctx, x, y + rim, w, h - rim);

  // Rolled rim with a pouring spout on the left.
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + rim);
  ctx.quadraticCurveTo(x - w * 0.09, y, x + w * 0.06, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + rim);
  ctx.closePath();
  const rg = ctx.createLinearGradient(0, y, 0, y + rim);
  rg.addColorStop(0, hexA("#ffffff", 0.75));
  rg.addColorStop(1, hexA(dark ? "#9e88ad" : "#8a7898", 0.5));
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.restore();
}

/** A conical (Erlenmeyer) flask. */
export function flask(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  const neckW = w * 0.26, neckH = h * 0.3;
  const cx = x + w / 2;
  ctx.save();

  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx - neckW / 2, y);
    ctx.lineTo(cx - neckW / 2, y + neckH);
    ctx.lineTo(x + w * 0.04, y + h - w * 0.1);
    ctx.quadraticCurveTo(x, y + h, x + w * 0.14, y + h);
    ctx.lineTo(x + w * 0.86, y + h);
    ctx.quadraticCurveTo(x + w, y + h, x + w * 0.96, y + h - w * 0.1);
    ctx.lineTo(cx + neckW / 2, y + neckH);
    ctx.lineTo(cx + neckW / 2, y);
    ctx.closePath();
  };

  if (liquid) drawLiquid(ctx, x, y, w, h, liquid, bodyPath, true);

  bodyPath();
  const gl = ctx.createLinearGradient(x, 0, x + w, 0);
  gl.addColorStop(0, hexA("#ffffff", dark ? 0.14 : 0.38));
  gl.addColorStop(0.18, hexA("#ffffff", 0.05));
  gl.addColorStop(0.8, hexA("#ffffff", 0.04));
  gl.addColorStop(1, hexA("#ffffff", dark ? 0.1 : 0.22));
  ctx.fillStyle = gl;
  ctx.fill();
  ctx.strokeStyle = hexA(dark ? "#cbb8d8" : "#6a5a78", 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Neck highlight and lip
  ctx.fillStyle = hexA("#ffffff", 0.5);
  ctx.fillRect(cx - neckW / 2 + neckW * 0.14, y + 2, neckW * 0.1, neckH * 0.9);
  ctx.beginPath();
  ctx.ellipse(cx, y, neckW / 2, neckW * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.7);
  ctx.fill();
  ctx.strokeStyle = hexA(dark ? "#cbb8d8" : "#6a5a78", 0.6);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

/** A test tube: round-bottomed, thin, with a rolled lip. */
export function testTube(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  ctx.save();
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h - w / 2);
    ctx.arc(x + w / 2, y + h - w / 2, w / 2, Math.PI, 0, true);
    ctx.lineTo(x + w, y);
  };
  if (liquid) drawLiquid(ctx, x, y, w, h, liquid, bodyPath);
  bodyPath();
  const gl = ctx.createLinearGradient(x, 0, x + w, 0);
  gl.addColorStop(0, hexA("#ffffff", dark ? 0.16 : 0.42));
  gl.addColorStop(0.3, hexA("#ffffff", 0.05));
  gl.addColorStop(1, hexA("#ffffff", dark ? 0.1 : 0.24));
  ctx.fillStyle = gl;
  ctx.fill();
  ctx.strokeStyle = hexA(dark ? "#cbb8d8" : "#6a5a78", 0.55);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = hexA("#ffffff", 0.6);
  ctx.fillRect(x + w * 0.2, y + h * 0.06, w * 0.1, h * 0.8);
  ctx.restore();
}

/** Shared liquid body: meniscus, bubbles, precipitate, surface sheen. */
function drawLiquid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  spec: LiquidSpec, clipPath: () => void, conical = false,
) {
  const t = spec.t ?? 0;
  const surfaceY = y + h * (1 - clamp01(spec.level));
  ctx.save();
  clipPath();
  ctx.clip();

  const g = ctx.createLinearGradient(0, surfaceY, 0, y + h);
  g.addColorStop(0, hexA(spec.color, 0.72));
  g.addColorStop(0.35, hexA(spec.color, 0.88));
  g.addColorStop(1, hexA(spec.color, 0.98));
  ctx.fillStyle = g;
  ctx.fillRect(x - w, surfaceY, w * 3, h);

  // Meniscus: liquid climbs the glass at the walls.
  ctx.beginPath();
  ctx.moveTo(x - w, surfaceY + 6);
  ctx.lineTo(x - w, surfaceY);
  ctx.quadraticCurveTo(x + w * 0.5, surfaceY + (conical ? 5 : 7), x + w * 2, surfaceY);
  ctx.lineTo(x + w * 2, surfaceY + 6);
  ctx.closePath();
  ctx.fillStyle = hexA("#ffffff", 0.28);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - w, surfaceY);
  ctx.quadraticCurveTo(x + w * 0.5, surfaceY + (conical ? 5 : 7), x + w * 2, surfaceY);
  ctx.stroke();

  if (spec.precipitate) {
    const pd = h * 0.1 * clamp01(spec.precipitate);
    ctx.fillStyle = hexA(spec.color, 1);
    ctx.beginPath();
    ctx.moveTo(x - w, y + h);
    for (let i = 0; i <= 20; i++) {
      const px = x - w + (w * 3 * i) / 20;
      ctx.lineTo(px, y + h - pd * (0.6 + 0.4 * Math.sin(i * 1.7)));
    }
    ctx.lineTo(x + w * 2, y + h);
    ctx.closePath();
    ctx.fill();
  }

  if (spec.bubbles) {
    const n = Math.round(spec.bubbles);
    for (let i = 0; i < n; i++) {
      const seed = i * 0.618;
      const phase = (t * (0.35 + (i % 5) * 0.06) + seed) % 1;
      const bx = x + w * (0.16 + ((i * 37) % 70) / 100);
      const by = y + h - phase * (y + h - surfaceY);
      if (by < surfaceY) continue;
      const r = 1.4 + ((i * 13) % 5) * 0.7;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fillStyle = hexA("#ffffff", 0.5);
      ctx.fill();
      ctx.strokeStyle = hexA("#ffffff", 0.7);
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function graduations(
  ctx: CanvasRenderingContext2D, x: number, y: number, h: number, len: number, dark: boolean,
) {
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#e6dbee" : "#5b4a68", 0.5);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yy = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + (i % 2 === 0 ? len : len * 0.55), yy);
    ctx.stroke();
  }
  ctx.restore();
}

function highlights(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
) {
  ctx.save();
  ctx.fillStyle = hexA("#ffffff", 0.55);
  ctx.fillRect(x + w * 0.1, y + h * 0.05, w * 0.035, h * 0.86);
  ctx.fillStyle = hexA("#ffffff", 0.22);
  ctx.fillRect(x + w * 0.87, y + h * 0.14, w * 0.022, h * 0.7);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Heat and flame
 * ------------------------------------------------------------------ */

/** A Bunsen burner with a live flame; `intensity` 0 is off. */
export function burner(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, intensity: number, t: number,
) {
  ctx.save();
  const barrelW = w * 0.22, barrelH = w * 1.05;
  // Base
  const bg = ctx.createLinearGradient(0, baseY - w * 0.12, 0, baseY);
  bg.addColorStop(0, "#5a5260");
  bg.addColorStop(1, "#221d28");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(x, baseY, w * 0.42, w * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Barrel
  const mg = ctx.createLinearGradient(x - barrelW / 2, 0, x + barrelW / 2, 0);
  mg.addColorStop(0, "#6d6474");
  mg.addColorStop(0.35, "#3b3442");
  mg.addColorStop(1, "#221d28");
  ctx.fillStyle = mg;
  ctx.fillRect(x - barrelW / 2, baseY - barrelH, barrelW, barrelH);

  if (intensity > 0.01) {
    const fh = w * (0.55 + intensity * 0.95);
    const flick = Math.sin(t * 11) * 0.05 + Math.sin(t * 17.3) * 0.03;
    const topY = baseY - barrelH - fh * (1 + flick);
    ctx.globalCompositeOperation = "lighter";
    // Outer flame
    const of = ctx.createLinearGradient(0, baseY - barrelH, 0, topY);
    of.addColorStop(0, hexA("#3b6fd4", 0.75));
    of.addColorStop(0.5, hexA("#7fa8f0", 0.4));
    of.addColorStop(1, hexA("#c9dcff", 0));
    ctx.fillStyle = of;
    flamePath(ctx, x, baseY - barrelH, barrelW * 1.5, fh);
    ctx.fill();
    // Inner cone: the hot part
    const inf = ctx.createLinearGradient(0, baseY - barrelH, 0, topY + fh * 0.45);
    inf.addColorStop(0, hexA("#1b3fa8", 0.95));
    inf.addColorStop(1, hexA("#6ea8ff", 0));
    ctx.fillStyle = inf;
    flamePath(ctx, x, baseY - barrelH, barrelW * 0.8, fh * 0.55);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

function flamePath(
  ctx: CanvasRenderingContext2D, x: number, baseY: number, w: number, h: number,
) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.quadraticCurveTo(x - w * 0.46, baseY - h * 0.6, x, baseY - h);
  ctx.quadraticCurveTo(x + w * 0.46, baseY - h * 0.6, x + w / 2, baseY);
  ctx.closePath();
}

/* ------------------------------------------------------------------ *
 * Physics apparatus
 * ------------------------------------------------------------------ */

/** A coiled helical spring between two points. */
export function spring(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  coils: number, radius: number, color: string,
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Shadow pass then bright pass gives the wire roundness.
  for (const [wid, col, off] of [
    [radius * 0.42, shade(color, -0.4), 1.2],
    [radius * 0.26, color, 0],
    [radius * 0.1, shade(color, 0.55), -0.8],
  ] as const) {
    ctx.beginPath();
    const lead = len * 0.1;
    ctx.moveTo(0, off);
    ctx.lineTo(lead, off);
    const N = coils * 12;
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      const px = lead + p * (len - lead * 2);
      const py = Math.sin(p * coils * Math.PI * 2) * radius + off;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(len, off);
    ctx.strokeStyle = col;
    ctx.lineWidth = wid;
    ctx.stroke();
  }
  ctx.restore();
}

/** A cart with wheels sitting on a rail. */
export function cart(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, w: number, h: number, color: string,
  spin = 0,
) {
  ctx.save();
  const wheelR = h * 0.3;
  const bodyY = groundY - wheelR * 2 - h * 0.62;
  // Body
  const g = ctx.createLinearGradient(0, bodyY, 0, bodyY + h * 0.62);
  g.addColorStop(0, shade(color, 0.45));
  g.addColorStop(0.5, color);
  g.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = g;
  roundRect(ctx, x - w / 2, bodyY, w, h * 0.62, h * 0.12);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = hexA("#ffffff", 0.35);
  roundRect(ctx, x - w / 2 + w * 0.08, bodyY + h * 0.07, w * 0.84, h * 0.13, h * 0.05);
  ctx.fill();
  // Wheels
  for (const wx of [x - w * 0.28, x + w * 0.28]) {
    const wy = groundY - wheelR;
    const wg = ctx.createRadialGradient(wx + KEY.x * wheelR, wy + KEY.y * wheelR, 0, wx, wy, wheelR);
    wg.addColorStop(0, "#5c5566");
    wg.addColorStop(0.6, "#2e2836");
    wg.addColorStop(1, "#171320");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
    ctx.fill();
    // Spokes make rotation visible, which matters when the cart is moving.
    ctx.strokeStyle = hexA("#ffffff", 0.4);
    ctx.lineWidth = Math.max(1, wheelR * 0.11);
    for (let i = 0; i < 4; i++) {
      const a = spin + (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * wheelR * 0.2, wy + Math.sin(a) * wheelR * 0.2);
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.72, wy + Math.sin(a) * wheelR * 0.72);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "#8d8499";
    ctx.fill();
  }
  ctx.restore();
}

/** A lab clamp stand: heavy base, upright rod, boss head. */
export function clampStand(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, height: number, w: number,
) {
  ctx.save();
  const bg = ctx.createLinearGradient(0, baseY - w * 0.1, 0, baseY + w * 0.06);
  bg.addColorStop(0, "#5c5566");
  bg.addColorStop(1, "#1d1926");
  ctx.fillStyle = bg;
  roundRect(ctx, x - w * 0.62, baseY - w * 0.1, w * 1.24, w * 0.16, w * 0.05);
  ctx.fill();
  const rg = ctx.createLinearGradient(x - w * 0.06, 0, x + w * 0.06, 0);
  rg.addColorStop(0, "#8d8499");
  rg.addColorStop(0.4, "#4a4356");
  rg.addColorStop(1, "#26212e");
  ctx.fillStyle = rg;
  ctx.fillRect(x - w * 0.05, baseY - height, w * 0.1, height);
  ctx.restore();
}

/** A filament bulb whose glow tracks how hard it is driven. */
export function bulb(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, brightness: number, theme: ThemeColors,
) {
  const b = clamp01(brightness);
  ctx.save();
  if (b > 0.02) {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * (2.4 + b * 2.2));
    g.addColorStop(0, hexA("#fff3c4", 0.75 * b));
    g.addColorStop(0.35, hexA("#ffd45e", 0.35 * b));
    g.addColorStop(1, hexA("#ffd45e", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * (2.4 + b * 2.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  // Envelope
  const eg = ctx.createRadialGradient(x + KEY.x * r * 0.6, y + KEY.y * r * 0.6, 0, x, y, r);
  eg.addColorStop(0, hexA("#ffffff", 0.5));
  eg.addColorStop(0.6, hexA(b > 0.05 ? "#ffe9a8" : "#e9e2f0", 0.28 + b * 0.4));
  eg.addColorStop(1, hexA(b > 0.05 ? "#ffc94d" : "#b9aec6", 0.4));
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Filament — a real coil, brightening with current.
  ctx.strokeStyle = b > 0.05
    ? `rgba(255,${Math.round(200 + 55 * b)},${Math.round(90 + 90 * b)},1)`
    : hexA(theme.inkSoft, 0.75);
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, y + r * 0.45);
  ctx.lineTo(x - r * 0.3, y + r * 0.05);
  for (let i = 0; i <= 12; i++) {
    ctx.lineTo(x - r * 0.3 + (r * 0.6 * i) / 12, y + (i % 2 ? -r * 0.3 : r * 0.02));
  }
  ctx.lineTo(x + r * 0.3, y + r * 0.45);
  ctx.stroke();

  // Screw cap
  const cg = ctx.createLinearGradient(x - r * 0.4, 0, x + r * 0.4, 0);
  cg.addColorStop(0, "#9a90a6");
  cg.addColorStop(0.4, "#4f4759");
  cg.addColorStop(1, "#2b2534");
  ctx.fillStyle = cg;
  roundRect(ctx, x - r * 0.4, y + r * 0.72, r * 0.8, r * 0.5, r * 0.08);
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.25);
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y + r * 0.72 + (r * 0.5 * i) / 3);
    ctx.lineTo(x + r * 0.4, y + r * 0.72 + (r * 0.5 * i) / 3);
    ctx.stroke();
  }
  ctx.restore();
}

/** A battery cell with terminals and a body band. */
export function battery(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, theme: ThemeColors,
) {
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, shade(theme.accent, 0.5));
  g.addColorStop(0.45, theme.accent);
  g.addColorStop(1, shade(theme.accent, -0.4));
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, h * 0.14);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.3);
  roundRect(ctx, x + w * 0.04, y + h * 0.09, w * 0.92, h * 0.16, h * 0.07);
  ctx.fill();
  // Terminals
  ctx.fillStyle = "#c9bed4";
  ctx.fillRect(x + w, y + h * 0.3, w * 0.07, h * 0.4);
  ctx.fillRect(x - w * 0.05, y + h * 0.38, w * 0.05, h * 0.24);
  ctx.font = `700 ${h * 0.42}px ui-monospace, monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", x + w * 0.86, y + h * 0.56);
  ctx.fillText("−", x + w * 0.14, y + h * 0.56);
  ctx.restore();
}

/** A bar magnet with coloured poles. */
export function barMagnet(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, angle: number, theme: ThemeColors,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const north = theme.sci["charge-pos"] ?? "#c9403f";
  const south = theme.sci["charge-neg"] ?? "#2f6fc4";
  for (const [half, col, label] of [
    [-1, north, "N"], [1, south, "S"],
  ] as const) {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, shade(col, 0.45));
    g.addColorStop(0.5, col);
    g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = g;
    ctx.fillRect(half < 0 ? -w / 2 : 0, -h / 2, w / 2, h);
    ctx.font = `700 ${h * 0.52}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, half * w * 0.25, 0);
  }
  ctx.fillStyle = hexA("#ffffff", 0.28);
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.16);
  ctx.strokeStyle = hexA("#000000", 0.3);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

/** A glass prism or lens body with an edge highlight. */
export function opticalGlass(
  ctx: CanvasRenderingContext2D,
  path: () => void, theme: ThemeColors, tintHue?: string,
) {
  ctx.save();
  path();
  const g = ctx.createLinearGradient(0, 0, 60, 60);
  g.addColorStop(0, hexA(tintHue ?? "#bfe4ff", 0.35));
  g.addColorStop(0.5, hexA("#ffffff", 0.14));
  g.addColorStop(1, hexA(tintHue ?? "#9fd0f5", 0.3));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.7);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.accent, 0.35);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function roundRect(
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

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/** Lighten (t>0) or darken (t<0) a hex colour. */
function shade(hexc: string, t: number): string {
  let s = hexc.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const to = t >= 0 ? 255 : 0, k = Math.abs(t);
  const ch = (i: number) => {
    const v = parseInt(s.slice(i * 2, i * 2 + 2), 16) || 0;
    return Math.round(v + (to - v) * k).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}
