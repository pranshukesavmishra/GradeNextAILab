import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, camera, mixHex } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, contactShadow, dashFlow, easeInOut,
  glass, glow, gradientFill, gridPaper, groundPlane, hatchFill, hexA, innerGlow,
  isDarkTheme, labelLeader, lerp, material, metal, noiseWash, particleField, plastic,
  pulse, ribbon, rimLight, sky, softShadow, sphere, spriteShadowEllipse,
  vignette,
} from "@ui/scene";

/**
 * Grade 6 · Unit C · Topic C1 — Energy and its forms.
 *
 * Five separate simulations, each a different *kind* of interactive experience,
 * that together cover the whole topic:
 *
 *   C1.1  g6c1-form-sorter      an inspection bay: file real objects into stores
 *   C1.2  g6c1-speed-mass-rig   a measurement rig: photogates and a crush block
 *   C1.3  g6c1-store-bench      a two-bay comparison: gravity store vs spring store
 *   C1.4  g6c1-swing-tracker    a live model: kinetic and gravitational trade places
 *   C1.5  (swing + trace)       the total never changes; friction only moves it
 *   C1.6  g6c1-everyday-trace   a stepped path: fuel to socket to kettle to steam
 *
 * Every number on screen is one a student could check. The van carries
 * 1/2 m v squared exactly, the kettle boils a real litre of water in a real
 * number of seconds, the crush block is a constant-force energy meter, and the
 * swing dissipates exactly the energy the damping term removes.
 */

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

type ThemeLike = RenderContext["theme"];

/** Never print a raw float on a stage. */
function fmt(n: number, d = 1): string {
  return Number.isFinite(n) ? n.toFixed(d) : "--";
}

function fmtInt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "--";
}

/** Joules at whatever magnitude the phenomenon actually has. */
function fmtJ(j: number): string {
  if (!Number.isFinite(j)) return "--";
  const a = Math.abs(j);
  if (a >= 1e6) return `${fmt(j / 1e6, a >= 1e7 ? 1 : 2)} MJ`;
  if (a >= 1e3) return `${fmt(j / 1e3, a >= 1e4 ? 0 : 1)} kJ`;
  if (a >= 1) return `${fmt(j, a >= 100 ? 0 : 1)} J`;
  if (a >= 1e-3) return `${fmt(j * 1e3, a >= 1e-2 ? 1 : 2)} mJ`;
  return `${fmtInt(j * 1e6)} uJ`;
}

/** A rounded-rect path, so nothing here depends on ctx.roundRect. */
function rrect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A machined instrument panel: the frame most of these scenes read against. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeLike, accent: string, title?: string,
) {
  if (w <= 0 || h <= 0) return;
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    bevelRect(ctx, x, y, w, h, 11, theme.surfaceAlt, { depth: 1.2 });
  }, { blur: 16, dy: 6, alpha: dark ? 0.45 : 0.18 });
  hatchFill(ctx, x + 1, y + 1, w - 2, 14, accent, { gap: 6, alpha: 0.15 });
  rimLight(ctx, (c) => rrect(c, x + 0.5, y + 0.5, w - 1, h - 1, 11), accent, {
    alpha: 0.32, bounds: { x, y, w, h },
  });
  if (title) {
    caption(ctx, x + 12, y + 19, title, theme, { size: 11, color: theme.inkSoft, weight: 700 });
  }
}

/** A soft lit indicator lamp with a lens ring. */
function lamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, on: number, theme: ThemeLike,
) {
  const lit = clamp01(on);
  if (lit > 0.02) glow(ctx, x, y, r * 3.6, color, 0.55 * lit);
  sphere(ctx, x, y, r, theme.inkSoft, { rim: false });
  if (lit > 0.01) {
    ctx.save();
    ctx.globalAlpha = lit;
    sphere(ctx, x, y, r, color, { rim: false });
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r + 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * A vertical stacked energy tower with a fixed cap line.
 *
 * The cap is the whole argument for conservation: the segments inside slide up
 * and down against each other, but the line across the top never moves.
 */
function energyTower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  segments: { label: string; value: number; color: string }[],
  capValue: number,
  theme: ThemeLike,
  title: string,
) {
  const dark = isDarkTheme(theme);
  panel(ctx, x - 8, y - 26, w + 16, h + 52, theme, theme.accent, title);

  ctx.save();
  rrect(ctx, x, y, w, h, 6);
  ctx.fillStyle = hexA(theme.grid, dark ? 0.55 : 0.75);
  ctx.fill();
  ctx.restore();

  const cap = Math.max(capValue, 1e-9);
  let cursor = y + h;
  for (const seg of segments) {
    const frac = clamp01(seg.value / cap);
    const sh = frac * h;
    if (sh < 0.6) continue;
    ctx.save();
    rrect(ctx, x, cursor - sh, w, sh, 3);
    ctx.clip();
    gradientFill(ctx, x, cursor - sh, w, sh, [
      mixHex(seg.color, "#ffffff", 0.34), seg.color, mixHex(seg.color, "#000000", 0.2),
    ], 0);
    ctx.restore();
    if (sh > 14) {
      caption(ctx, x + w / 2, cursor - sh / 2, fmtJ(seg.value), theme, {
        align: "center", size: 10, color: dark ? theme.ink : theme.surface, weight: 700,
      });
    }
    cursor -= sh;
  }

  // The cap: the total, drawn as a hard line that simply does not move.
  ctx.save();
  ctx.strokeStyle = theme.sci["energy-total"];
  ctx.lineWidth = 2.2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 0.5);
  ctx.lineTo(x + w + 6, y + 0.5);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + w / 2, y + h + 16, `total ${fmtJ(capValue)}`, theme, {
    align: "center", size: 10, color: theme.sci["energy-total"], weight: 700,
  });
}

/** A legend row: a colour chip and a name, for keying a stacked chart. */
function legendChip(
  ctx: CanvasRenderingContext2D, x: number, y: number, color: string, text: string, theme: ThemeLike,
) {
  ctx.save();
  rrect(ctx, x, y - 5, 10, 10, 3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  caption(ctx, x + 16, y, text, theme, { size: 10.5, color: theme.inkSoft, weight: 600 });
}
