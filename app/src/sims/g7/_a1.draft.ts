import type { RenderContext, SimContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, comet, contactShadow, dashFlow, easeInOut,
  glass, glow, gradientFill, gridPaper, groundPlane, hatchFill, hexA, innerGlow, isDarkTheme,
  labelLeader, lerp, material, metal, noiseWash, particleField, plastic, pulse, ribbon,
  rimLight, sky, softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 7 · Unit A · Topic A1 — The particle model, refined.
 *
 * Five separate simulations, each a different *kind* of interactive experience,
 * that together cover the whole topic:
 *
 *   A1.1  g7a1-particle-bench    a manipulable model: heat and squeeze a sealed cell
 *   A1.2  g7a1-model-showdown    a side-by-side rig: two models meet the same change
 *   A1.3  g7a1-brownian-evidence a measurement investigation: jiggle, timed and logged
 *   A1.4  g7a1-atom-assembler    a build-it bench: assemble particles out of atoms
 *   A1.5  g7a1-scale-ladder      a driven zoom: from a hand to a nucleus
 *
 * Every number on screen is a real one. The cell boils water at the Clausius–
 * Clapeyron temperature for the pressure the student dials in, the smoke grain
 * wanders with the Stokes–Einstein diffusion coefficient and hands back an
 * estimate of the Avogadro constant the way Perrin got his, the assembler uses
 * measured bond lengths and angles, and the ladder is pinned to measured sizes
 * from a hand span down to a hydrogen nucleus.
 */

/* ------------------------------------------------------------------ *
 * Shared constants and helpers
 * ------------------------------------------------------------------ */

const R_GAS = 8.314462618;      // J/(mol K)
const K_B = 1.380649e-23;       // J/K
const N_A = 6.02214076e23;      // 1/mol
const ATM = 101325;             // Pa

/** The slice of the theme these helpers need. */
type ThemeLike = RenderContext["theme"];

/** Never print a raw float on a stage. */
function fmt(n: number, d = 1): string {
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(d);
}

function fmtInt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "--";
}

/** A number in scientific form, for the very small and the very large. */
function fmtSci(n: number, d = 1): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(n)));
  const m = n / Math.pow(10, e);
  return `${m.toFixed(d)} x 10^${e}`;
}

/** A length rendered in whichever unit keeps it a readable number. */
function fmtLength(m: number): string {
  const a = Math.abs(m);
  if (a >= 1) return `${fmt(m, 2)} m`;
  if (a >= 1e-3) return `${fmt(m * 1e3, 1)} mm`;
  if (a >= 1e-6) return `${fmt(m * 1e6, 1)} um`;
  if (a >= 1e-9) return `${fmt(m * 1e9, 2)} nm`;
  if (a >= 1e-12) return `${fmt(m * 1e12, 1)} pm`;
  return `${fmt(m * 1e15, 1)} fm`;
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

/** A machined instrument housing: the frame most of these scenes read against. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeLike, accent: string, title?: string,
) {
  if (w <= 0 || h <= 0) return;
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    bevelRect(ctx, x, y, w, h, 12, theme.surfaceAlt, { depth: 1.2 });
  }, { blur: 18, dy: 6, alpha: dark ? 0.45 : 0.18 });
  hatchFill(ctx, x + 1, y + 1, w - 2, 16, accent, { gap: 6, alpha: 0.16 });
  rimLight(ctx, (c) => rrect(c, x + 0.5, y + 0.5, w - 1, h - 1, 12), accent, {
    alpha: 0.32, bounds: { x, y, w, h },
  });
  if (title) {
    caption(ctx, x + 13, y + 21, title, theme, { size: 11.5, color: theme.inkSoft, weight: 700 });
  }
}

/** One labelled line of an instrument readout: name left, value right. */
function readoutRow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  name: string, value: string, theme: ThemeLike, color: string,
) {
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 11.5);
  ctx.lineTo(x + w, y + 11.5);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x, y, name, theme, { size: 11, color: theme.inkSoft, weight: 600 });
  ctx.save();
  ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(value, x + w, y);
  ctx.restore();
}

/** A lit indicator lamp — the on/off vocabulary shared by every rig here. */
function lamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, on: number, theme: ThemeLike,
) {
  const lit = clamp01(on);
  if (lit > 0.02) glow(ctx, x, y, r * 3.6, color, 0.5 * lit);
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
  ctx.arc(x, y, r + 2.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A tick mark drawn on a diagram, for "correct" verdicts. */
function tickMark(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, s * 0.3);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y);
  ctx.lineTo(x - s * 0.15, y + s * 0.6);
  ctx.lineTo(x + s * 0.75, y - s * 0.65);
  ctx.stroke();
  ctx.restore();
}

/** A cross mark drawn on a diagram, for "this model cannot do it". */
function crossMark(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, s * 0.3);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, y - s * 0.6);
  ctx.lineTo(x + s * 0.6, y + s * 0.6);
  ctx.moveTo(x + s * 0.6, y - s * 0.6);
  ctx.lineTo(x - s * 0.6, y + s * 0.6);
  ctx.stroke();
  ctx.restore();
}

/** The bench every one of these rigs stands on. */
function labBench(
  ctx: CanvasRenderingContext2D, w: number, h: number, benchY: number, theme: ThemeLike,
) {
  sky(ctx, w, h, theme, "indoor", benchY);
  gridPaper(ctx, w, benchY, theme, { step: 26, major: 4, alpha: isDarkTheme(theme) ? 0.35 : 0.5, fade: 0.5 });
  groundPlane(ctx, benchY, 0, w, h, theme, "lab");
  gradientFill(ctx, 0, benchY, w, h - benchY, [
    hexA(theme.ink, 0.05), hexA(theme.ink, 0.16),
  ], 90);
  noiseWash(ctx, 0, 0, w, h, { alpha: 0.035, seed: 31, count: 260 });
}
