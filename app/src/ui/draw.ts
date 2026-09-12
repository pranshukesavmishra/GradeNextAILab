import type { ThemeColors } from "@engine/types";

/**
 * Shared canvas drawing helpers.
 *
 * Every simulation draws through these, which is what keeps 160+ sims visually
 * consistent: one arrowhead style, one grid, one label treatment. A new sim
 * should almost never need raw path code for common physics annotations.
 */

export interface Viewport {
  /** World units per CSS pixel is derived from these. */
  x0: number; y0: number; x1: number; y1: number;
  width: number; height: number;
  /** Keep the world aspect ratio square (true for most physical scenes). */
  square?: boolean;
}

export interface Camera {
  toScreenX: (x: number) => number;
  toScreenY: (y: number) => number;
  toWorldX: (px: number) => number;
  toWorldY: (py: number) => number;
  /** Pixels per world unit. */
  scale: number;
}

/** Build a camera mapping a world rectangle onto the canvas, y pointing up. */
export function camera(v: Viewport): Camera {
  const worldW = v.x1 - v.x0;
  const worldH = v.y1 - v.y0;
  let sx = v.width / worldW;
  let sy = v.height / worldH;
  if (v.square !== false) {
    const s = Math.min(sx, sy);
    sx = s; sy = s;
  }
  const offX = (v.width - worldW * sx) / 2;
  const offY = (v.height - worldH * sy) / 2;
  return {
    scale: sx,
    toScreenX: (x) => offX + (x - v.x0) * sx,
    toScreenY: (y) => v.height - offY - (y - v.y0) * sy,
    toWorldX: (px) => v.x0 + (px - offX) / sx,
    toWorldY: (py) => v.y0 + (v.height - offY - py) / sy,
  };
}

/** A quiet reference grid. Never competes with the phenomenon. */
export function grid(
  ctx: CanvasRenderingContext2D, cam: Camera, theme: ThemeColors,
  opts: { spacing: number; x0: number; y0: number; x1: number; y1: number; labels?: boolean },
) {
  const { spacing, x0, y0, x1, y1 } = opts;
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const startX = Math.ceil(x0 / spacing) * spacing;
  for (let x = startX; x <= x1; x += spacing) {
    const sx = Math.round(cam.toScreenX(x)) + 0.5;
    ctx.moveTo(sx, cam.toScreenY(y0));
    ctx.lineTo(sx, cam.toScreenY(y1));
  }
  const startY = Math.ceil(y0 / spacing) * spacing;
  for (let y = startY; y <= y1; y += spacing) {
    const sy = Math.round(cam.toScreenY(y)) + 0.5;
    ctx.moveTo(cam.toScreenX(x0), sy);
    ctx.lineTo(cam.toScreenX(x1), sy);
  }
  ctx.stroke();

  if (opts.labels) {
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = startX; x <= x1; x += spacing) {
      if (Math.abs(x) < 1e-9) continue;
      ctx.fillText(trimNum(x), cam.toScreenX(x), cam.toScreenY(y0) + 4);
    }
  }
  ctx.restore();
}

function trimNum(n: number): string {
  return Math.abs(n % 1) < 1e-9 ? String(Math.round(n)) : n.toFixed(1);
}

/** The platform's single arrow style — used for every vector, everywhere. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string,
  opts: { width?: number; head?: number; label?: string; dashed?: boolean } = {},
) {
  const width = opts.width ?? 2.5;
  const head = opts.head ?? Math.max(7, width * 3.2);
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len, uy = dy / len;
  const bodyLen = Math.max(0, len - head * 0.85);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  if (opts.dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + ux * bodyLen, y1 + uy * bodyLen);
  ctx.stroke();
  ctx.setLineDash([]);

  // Head
  const hx = x1 + ux * len, hy = y1 + uy * len;
  const px = -uy, py = ux;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - ux * head + px * head * 0.45, hy - uy * head + py * head * 0.45);
  ctx.lineTo(hx - ux * head - px * head * 0.45, hy - uy * head - py * head * 0.45);
  ctx.closePath();
  ctx.fill();

  if (opts.label) {
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const lx = hx + ux * 12 + px * 10;
    const ly = hy + uy * 12 + py * 10;
    ctx.fillText(opts.label, lx, ly);
  }
  ctx.restore();
}

/** A filled circle with an optional outline — the workhorse for particles. */
export function disc(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  fill: string, opts: { stroke?: string; lineWidth?: number; alpha?: number } = {},
) {
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (opts.stroke) {
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = opts.lineWidth ?? 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function roundRect(
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

/** A label with a legible plate behind it, so text never fights the scene. */
export function label(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, theme: ThemeColors,
  opts: { align?: CanvasTextAlign; color?: string; size?: number; plate?: boolean } = {},
) {
  const size = opts.size ?? 12;
  ctx.save();
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  if (opts.plate !== false) {
    const w = ctx.measureText(text).width;
    const padX = 5, padY = 3;
    const ax = opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x;
    ctx.fillStyle = theme.surface;
    ctx.globalAlpha = 0.82;
    roundRect(ctx, ax - padX, y - size / 2 - padY, w + padX * 2, size + padY * 2, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = opts.color ?? theme.ink;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Dashed motion trail behind a moving body. */
export function trail(
  ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], color: string, alpha = 0.4,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

/** Horizontal stacked energy bars — the standard energy representation. */
export function energyBars(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  bars: { label: string; value: number; color: string }[],
  theme: ThemeColors,
) {
  const total = bars.reduce((s, b) => s + Math.max(0, b.value), 0);
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();

  if (total > 0) {
    let cx = x;
    for (const b of bars) {
      const bw = (Math.max(0, b.value) / total) * w;
      if (bw <= 0) continue;
      ctx.fillStyle = b.color;
      // 2px gap between segments so adjacent fills stay distinguishable.
      roundRect(ctx, cx, y, Math.max(0, bw - 2), h, 3);
      ctx.fill();
      cx += bw;
    }
  }
  ctx.restore();
}

/**
 * Linear interpolation between two colours, for thermal ramps.
 *
 * Returns hex, and that matters: a mixed colour is routinely fed straight back
 * into `mixHex`, `hexA`, or one of the shade helpers to light it. Returning
 * `rgb(...)` made those compositions parse as hex and produce a NaN channel —
 * which canvas rejects outright in `addColorStop` (the sim goes blank) and
 * silently ignores in `fillStyle` (the sim draws in the wrong colour). Hex
 * round-trips through every colour helper in the kit, so mixes compose.
 */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a), pb = parseHex(b);
  const k = Math.max(0, Math.min(1, t));
  const ch = (i: number) => {
    const v = Math.round(pa[i] + (pb[i] - pa[i]) * k);
    return (v < 0 ? 0 : v > 255 ? 255 : v).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

function parseHex(color: string): [number, number, number] {
  const s = color.trim();
  // Accept `rgb()` and `rgba()` too, so a colour that came from somewhere other
  // than a token still lands on real channel values rather than on NaN.
  if (s.startsWith("rgb")) {
    const open = s.indexOf("(");
    const parts = open < 0 ? [] : s.slice(open + 1).split(/[,\s/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const ch = (i: number) => {
        const v = Number.parseFloat(parts[i]);
        return Number.isFinite(v) ? Math.max(0, Math.min(255, Math.round(v))) : 128;
      };
      return [ch(0), ch(1), ch(2)];
    }
    return [128, 128, 128];
  }
  const h = s.replace("#", "");
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  if (h.length >= 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [128, 128, 128];
}

/** Ground/floor line with subtle hatching. */
export function ground(
  ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number, theme: ThemeColors,
) {
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0; x < x1; x += 9) {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 8);
  }
  ctx.stroke();
  ctx.restore();
}
