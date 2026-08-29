import type {
  ParamValues, RenderContext, SimContext, SimInput, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, comet, dashFlow, easeInOut, glass,
  glow, gradient, gradientFill, gridPaper, hatchFill, hexA, innerGlow, isDarkTheme,
  labelLeader, lerp, material, metal, noiseWash, particleField, plastic, pulse, ribbon,
  rimLight, sky, softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 7 · Unit A · Topic A2 — Inside the atom.
 *
 * Five simulations, one topic. The through-line is that nobody has ever seen
 * an atom's insides directly: every single thing a student is asked to believe
 * about protons, neutrons, electrons and the empty space between them was
 * inferred from something that could be measured — a beam that bent, a flight
 * that took longer, an alpha particle that came back.
 *
 *   A2.1  Protons, neutrons and electrons        → Particle Beam Line
 *   A2.2  Atomic number defines the element      → Atom Forge
 *   A2.3  Mass number and isotopes               → Isotope Bench
 *   A2.4  Building the model — early evidence    → Gold Foil Bench
 *   A2.5  From shells to a cloud                 → Shells to Cloud
 *   A2.6  Why the model kept changing            → Shells to Cloud (evidence board)
 *
 * Every quantity on screen is one a student can check against a textbook:
 * the electron is 1/1836 of a proton's mass, chlorine averages 35.45 u from
 * 75.76 % chlorine-35 and 24.24 % chlorine-37, a gold nucleus is about 7.3 fm
 * across inside a 144 pm atom, hydrogen's most likely electron distance is
 * 52.9 pm, and its red Balmer line is 656 nm.
 */

/* ================================================================== *
 * Physical constants and shared data
 * ================================================================== */

/** Elementary charge, C. */
const E_CHARGE = 1.602176634e-19;
/** Unified atomic mass unit, kg. */
const AMU = 1.66053906660e-27;
const M_PROTON = 1.67262192369e-27;
const M_NEUTRON = 1.67492749804e-27;
const M_ELECTRON = 9.1093837015e-31;
/** Proton-to-electron mass ratio: the number that makes the electron feel light. */
const MASS_RATIO = M_PROTON / M_ELECTRON; // 1836.15
/** Bohr radius in picometres — hydrogen's most likely electron distance. */
const BOHR_PM = 52.9;

interface ElementInfo {
  z: number;
  symbol: string;
  name: string;
  /** Standard atomic weight, u. */
  mass: number;
  /** Neutron counts that give a stable (or effectively stable) nuclide. */
  stableN: number[];
  /** Calculated atomic radius, pm (Clementi 1963) — a real, checkable number. */
  radiusPm: number;
}

/** Hydrogen through calcium: everything a middle-school build-an-atom needs. */
const ELEMENTS: ElementInfo[] = [
  { z: 1, symbol: "H", name: "Hydrogen", mass: 1.008, stableN: [0, 1], radiusPm: 53 },
  { z: 2, symbol: "He", name: "Helium", mass: 4.0026, stableN: [1, 2], radiusPm: 31 },
  { z: 3, symbol: "Li", name: "Lithium", mass: 6.94, stableN: [3, 4], radiusPm: 167 },
  { z: 4, symbol: "Be", name: "Beryllium", mass: 9.0122, stableN: [5], radiusPm: 112 },
  { z: 5, symbol: "B", name: "Boron", mass: 10.81, stableN: [5, 6], radiusPm: 87 },
  { z: 6, symbol: "C", name: "Carbon", mass: 12.011, stableN: [6, 7], radiusPm: 67 },
  { z: 7, symbol: "N", name: "Nitrogen", mass: 14.007, stableN: [7, 8], radiusPm: 56 },
  { z: 8, symbol: "O", name: "Oxygen", mass: 15.999, stableN: [8, 9, 10], radiusPm: 48 },
  { z: 9, symbol: "F", name: "Fluorine", mass: 18.998, stableN: [10], radiusPm: 42 },
  { z: 10, symbol: "Ne", name: "Neon", mass: 20.180, stableN: [10, 11, 12], radiusPm: 38 },
  { z: 11, symbol: "Na", name: "Sodium", mass: 22.990, stableN: [12], radiusPm: 190 },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, stableN: [12, 13, 14], radiusPm: 145 },
  { z: 13, symbol: "Al", name: "Aluminium", mass: 26.982, stableN: [14], radiusPm: 118 },
  { z: 14, symbol: "Si", name: "Silicon", mass: 28.085, stableN: [14, 15, 16], radiusPm: 111 },
  { z: 15, symbol: "P", name: "Phosphorus", mass: 30.974, stableN: [16], radiusPm: 98 },
  { z: 16, symbol: "S", name: "Sulfur", mass: 32.06, stableN: [16, 17, 18, 20], radiusPm: 88 },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, stableN: [18, 20], radiusPm: 79 },
  { z: 18, symbol: "Ar", name: "Argon", mass: 39.948, stableN: [18, 20, 22], radiusPm: 71 },
  { z: 19, symbol: "K", name: "Potassium", mass: 39.098, stableN: [20, 22], radiusPm: 243 },
  { z: 20, symbol: "Ca", name: "Calcium", mass: 40.078, stableN: [20, 22, 23, 24, 26], radiusPm: 194 },
];

function elementOf(z: number): ElementInfo | null {
  return ELEMENTS.find((e) => e.z === z) ?? null;
}

/** Shell capacities for the school filling rule: 2, 8, 8, 2 up to calcium. */
const SHELL_CAPACITY = [2, 8, 8, 2];

/** Fill electrons into shells, returning the occupancy of each shell. */
function shellFill(electrons: number): number[] {
  const out: number[] = [];
  let left = Math.max(0, Math.round(electrons));
  for (const cap of SHELL_CAPACITY) {
    const take = Math.min(cap, left);
    out.push(take);
    left -= take;
    if (left <= 0) break;
  }
  if (left > 0) out.push(left);
  return out;
}

/* ================================================================== *
 * Shared formatting — nothing on a stage is ever a raw float
 * ================================================================== */

function fx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(dp);
  return s === "-0" || /^-0\.0*$/.test(s) ? s.slice(1) : s;
}

function group(v: number): string {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "6.6 x 10^-27" for the quantities too small to write out. */
function sci(v: number, dp = 2): string {
  if (!Number.isFinite(v) || v === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(v)));
  const mant = v / Math.pow(10, exp);
  return `${mant.toFixed(dp)} x 10^${exp}`;
}

/** A signed value, always with its sign shown — charge is about sign. */
function signed(v: number, dp = 0): string {
  const s = v.toFixed(dp);
  return v > 0 ? `+${s}` : s;
}

/** "1 in 26,000" reads better than "0.0000384" to a thirteen-year-old. */
function oneIn(fraction: number): string {
  if (!(fraction > 0) || !Number.isFinite(fraction)) return "never seen yet";
  return `1 in ${group(1 / fraction)}`;
}

/* ================================================================== *
 * Shared geometry and layout helpers
 * ================================================================== */

interface Rect { x: number; y: number; w: number; h: number }

function overlaps(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

/**
 * A placer that refuses to let two on-stage plates or badges collide.
 *
 * Overlapping text is the single fastest way to make a careful diagram look
 * careless, so every stage in this file that puts more than two labels down
 * routes them through one of these.
 */
class LabelField {
  private placed: Rect[] = [];

  /** Reserve a box that has already been positioned by hand. */
  claim(r: Rect): void {
    this.placed.push(r);
  }

  /** Nudge a candidate centre up and down until it clears everything placed. */
  place(x: number, y: number, w: number, h: number, stepPx = 15): { x: number; y: number } {
    for (let step = 0; step < 26; step++) {
      for (const dir of step === 0 ? [0] : [-1, 1]) {
        const cy = y + dir * step * stepPx;
        const box: Rect = { x: x - w / 2, y: cy - h / 2, w, h };
        if (!this.placed.some((p) => overlaps(p, box))) {
          this.placed.push(box);
          return { x, y: cy };
        }
      }
    }
    this.placed.push({ x: x - w / 2, y: y - h / 2, w, h });
    return { x, y };
  }
}

/** A sampled quadratic bend from a to b — the spine of every flow in this file. */
function curve(
  ax: number, ay: number, bx: number, by: number, bend: number, n = 24,
): { x: number; y: number }[] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({
      x: u * u * ax + 2 * u * t * cx + t * t * bx,
      y: u * u * ay + 2 * u * t * cy + t * t * by,
    });
  }
  return pts;
}

/** A soft panel to lay instrument readouts on, so numbers sit on a surface. */
function instrumentPanel(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, title?: string,
): void {
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    ctx.fillStyle = dark ? "rgba(14,20,28,0.9)" : "rgba(255,255,255,0.92)";
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
  }, { blur: 16, dy: 5, alpha: dark ? 0.5 : 0.18 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8.5);
  ctx.stroke();
  ctx.restore();
  innerGlow(ctx, (c) => roundRect(c, x, y, w, h, 9), theme.accent, { inset: 6, alpha: 0.1 });
  if (title) {
    caption(ctx, x + 12, y + 14, title, theme, { size: 11, color: theme.inkSoft, weight: 700 });
  }
}

/** A horizontal bar inside a panel: label, track, fill, value. */
function panelBar(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
  label: string, value: string, frac: number, color: string, theme: ThemeColors,
): void {
  caption(ctx, x, y - 8, label, theme, { size: 10, color: theme.inkSoft, weight: 600 });
  caption(ctx, x + w, y - 8, value, theme, { size: 11, color, weight: 700, align: "right" });
  ctx.save();
  ctx.fillStyle = hexA(theme.grid, 0.85);
  roundRect(ctx, x, y, w, 6, 3);
  ctx.fill();
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 1.5) {
    ctx.fillStyle = gradient(ctx, x, y, fw, 6, [mixHex(color, "#ffffff", 0.35), color], 0);
    roundRect(ctx, x, y, fw, 6, 3);
    ctx.fill();
  }
  ctx.restore();
}
