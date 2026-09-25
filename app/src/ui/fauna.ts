import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme, spriteShadowEllipse } from "./scene";

/**
 * Fauna — organisms, plants and the habitats they live in.
 *
 * `organic.ts` draws life at the scale of a microscope slide. This file draws
 * life at the scale of a field, and it exists because the usual classroom
 * ecosystem is two coloured dots chasing each other over a green rectangle. A
 * student looking at that cannot tell you which dot is the predator, so the
 * moment the prey population crashes they have learned nothing: there was
 * never an animal on screen, only a token.
 *
 * The standard here is that every organism must be identifiable from its
 * outline alone, at the size it is actually drawn — which in a population
 * scene is about twenty pixels. That constraint drives almost every decision
 * below. A rabbit is ears and a haunch. A fox is a pointed muzzle and a tail
 * nearly as long as its body. A deer is legs and neck. Those are the features
 * that survive being shrunk, so those are the features that get the space.
 *
 * Everything is built from layered gradients and paths rather than sprites, so
 * it stays crisp at any zoom, animates per frame, and recolours with the theme.
 */

/* ------------------------------------------------------------------ *
 * Light model
 *
 * One convention, shared with `organic.ts`, `geo.ts` and the scene kit: light
 * arrives from the upper left. A back is lit on its upper-left flank, the
 * shaded side of a haunch is down-right, and a rim runs along the opposite
 * edge. Consistency here is what lets a fox, a tree and a hillside drawn by
 * three different call sites read as one scene lit by one sun.
 *
 * `facing` mirrors the drawing frame, so the key's *local* x is flipped with
 * it: mirroring twice puts the highlight back on the screen's upper left,
 * where the sun is, instead of following the animal's nose around.
 * ------------------------------------------------------------------ */

const KEY = { x: -0.38, y: -0.42 };
const TAU = Math.PI * 2;

/**
 * Below roughly this height a whisker, a claw or a feather barb is thinner
 * than a pixel and antialiasing turns it into grey fog on the silhouette.
 * Fine detail is gated on it; the load-bearing shapes are never gated.
 */
const FINE_DETAIL_PX = 46;

/**
 * The floor for a feature that carries identity — an ear, a leg, a tail.
 * Geometry alone would take a rabbit's ear below a pixel at population sizes
 * and the animal would go back to being a blob, so those widths clamp here.
 */
const MIN_FEATURE = 1.15;

/** Shadows and shade are warm brown, never neutral grey: sunlight is warm, so
 *  the light it fails to reach is warm too, and grey shading kills fur dead. */
const FUR_SHADE = "#2a170b";
/** The highlight is cream rather than white, for the same reason. */
const FUR_LIGHT = "#fff4e2";

/* ------------------------------------------------------------------ *
 * Kinds
 * ------------------------------------------------------------------ */

export type CreatureKind =
  | "rabbit" | "fox" | "deer" | "wolf" | "mouse" | "bird"
  | "hawk" | "fish" | "insect" | "butterfly" | "bee" | "worm";

export type PlantKind =
  | "grass" | "shrub" | "tree" | "conifer" | "flower" | "seedling" | "kelp";

export type HabitatKind =
  | "meadow" | "forest" | "desert" | "tundra" | "pond" | "ocean" | "arctic";

export type Organism = CreatureKind | PlantKind;

export type TrophicLevel =
  | "producer" | "primary" | "secondary" | "tertiary" | "decomposer";

export type Season = "spring" | "summer" | "autumn" | "winter";

/** Creatures that hold themselves off the ground and cast a shadow below. */
const AIRBORNE: ReadonlySet<CreatureKind> = new Set<CreatureKind>([
  "hawk", "butterfly", "bee",
]);
/** Creatures in water: no ground contact shadow belongs under them at all. */
const AQUATIC: ReadonlySet<CreatureKind> = new Set<CreatureKind>(["fish"]);

/**
 * Body size relative to each other, used when a caller scatters a mixed
 * population and wants a mouse to look like a mouse next to a deer.
 */
const RELATIVE_SIZE: Record<CreatureKind, number> = {
  worm: 0.30, bee: 0.26, insect: 0.30, butterfly: 0.36, mouse: 0.40,
  bird: 0.46, fish: 0.55, rabbit: 0.62, fox: 0.82, hawk: 0.80,
  wolf: 1.00, deer: 1.15,
};

/* ------------------------------------------------------------------ *
 * Coats
 *
 * A fox is rust orange in every theme, because the colour belongs to the
 * animal and not to the interface — the same rule `geo.ts` applies to rock.
 * What the theme changes is the light in the air around it, and how hard the
 * rim has to work to hold the outline against the ground behind it.
 * ------------------------------------------------------------------ */

interface CoatSpec {
  /** The main coat. */
  base: string;
  /** The dorsal saddle. Animals are darker on top; that is countershading. */
  back: string;
  /** The underside, pale because direct sun never reaches it. */
  belly: string;
  /** Bare skin: inner ear, nose, paw pad, a worm's entire body. */
  accent: string;
  /** Extremities — stockings, ear tips, hooves, wing bars, beak. */
  dark: string;
  /** A marking that breaks the outline: a fox's tail tip, a rabbit's scut. */
  light: string;
  eye: string;
}

const COATS: Record<CreatureKind, CoatSpec> = {
  rabbit: { base: "#a8794e", back: "#7a5233", belly: "#f2e6d1", accent: "#e3a293",
            dark: "#3b2716", light: "#fdf6ea", eye: "#241408" },
  fox:    { base: "#d4601c", back: "#ad430e", belly: "#f9f1e4", accent: "#eaad84",
            dark: "#241308", light: "#fffaf0", eye: "#f0b429" },
  deer:   { base: "#b58253", back: "#8a5c35", belly: "#f2e6d2", accent: "#cb9c7c",
            dark: "#2a1d12", light: "#fff8ec", eye: "#1c1208" },
  wolf:   { base: "#8e8b85", back: "#4d5055", belly: "#ded3c2", accent: "#b19b8d",
            dark: "#25272b", light: "#f2ece0", eye: "#d9a521" },
  mouse:  { base: "#9b8b7c", back: "#6d6053", belly: "#efe4d6", accent: "#e7a99d",
            dark: "#332a22", light: "#faf3e9", eye: "#150d08" },
  bird:   { base: "#5c718e", back: "#3b4a63", belly: "#ecdec4", accent: "#c96a2b",
            dark: "#222b39", light: "#f8f2e4", eye: "#120e0a" },
  hawk:   { base: "#7d5535", back: "#4b3120", belly: "#f0e4cf", accent: "#e2a72b",
            dark: "#2b1c10", light: "#fdf7ea", eye: "#3a2a12" },
  fish:   { base: "#90a9b3", back: "#3f6b52", belly: "#f5f2e5", accent: "#e08a3c",
            dark: "#1d2a26", light: "#ffffff", eye: "#f2c14e" },
  insect: { base: "#2f5d3a", back: "#1a3823", belly: "#4a3a22", accent: "#c69a2e",
            dark: "#11180e", light: "#bfe6a8", eye: "#0a0d08" },
  butterfly: { base: "#e8811f", back: "#c25c0c", belly: "#f5d7a0", accent: "#1a1208",
               dark: "#120c05", light: "#fffdf5", eye: "#1a120a" },
  bee:    { base: "#f0b81e", back: "#c98f10", belly: "#f7d97a", accent: "#241a08",
            dark: "#141008", light: "#fdf3d0", eye: "#1b1409" },
  worm:   { base: "#c4837c", back: "#8f574f", belly: "#e8b8ad", accent: "#dda096",
            dark: "#5d332c", light: "#f3d6cd", eye: "#5d332c" },
};

/** A coat resolved for one draw: species colours plus derived light and shade. */
interface Coat extends CoatSpec {
  shade: string;
  hi: string;
  /** A contour that guarantees the outline survives any background. */
  outline: string;
  /** How hard that contour is drawn. */
  outlineAlpha: number;
}

/**
 * Build the working palette.
 *
 * `tint` is what the natural-selection topics need: a light-furred and a
 * dark-furred variant of the same animal. It replaces the coat but not the
 * anatomy — the back stays darker than the belly by the same amount, so
 * countershading survives, and bare skin (nose, inner ear, paw pads) keeps its
 * own pink because fur colour genes do not repaint a nose. The pale markings
 * are re-derived from the tint rather than left white, otherwise a "dark"
 * rabbit would carry a glaring white scut and wreck the very comparison the
 * sim is making.
 */
function coatOf(
  which: CreatureKind, tint: string | undefined,
  haze: number, hazeColor: string, dark: boolean,
): Coat {
  const spec = COATS[which];
  let c: CoatSpec = spec;
  if (tint) {
    c = {
      base: tint,
      back: mix(tint, "#17100a", 0.4),
      belly: mix(tint, "#fff5e4", 0.55),
      accent: spec.accent,
      dark: mix(tint, "#0f0a05", 0.7),
      light: mix(tint, "#fff8ec", 0.6),
      eye: spec.eye,
    };
  }
  const h = clamp01(haze);
  const air = (col: string) => (h > 0.001 ? mix(col, hazeColor, h * 0.82) : col);
  const base = air(c.base);
  // The contour flips with the coat's own brightness, but the tipping point
  // sits low: only a genuinely dark coat gets a light rim. Set at mid grey it
  // handed every mid-tone animal a pale edge, which vanishes against a pale
  // page — and a bird whose wing and tail have no edge between them fuses
  // into one slab and loses the long back end it is recognised by.
  const pale = lum(base) > 0.26;
  return {
    base,
    back: air(c.back),
    belly: air(c.belly),
    accent: air(c.accent),
    dark: air(c.dark),
    light: air(c.light),
    eye: c.eye,
    shade: air(mix(c.base, FUR_SHADE, 0.52)),
    hi: air(mix(c.base, FUR_LIGHT, 0.42)),
    outline: pale ? mix(base, "#241407", 0.7) : mix(base, "#ffe9c6", 0.55),
    outlineAlpha: (pale ? 0.5 : 0.55) * (dark ? 1.15 : 1) * (1 - h * 0.7),
  };
}

/** The colour distance paints things: sky-blue by day, near-black at night. */
function atmosphereColor(theme: ThemeColors): string {
  return isDarkTheme(theme) ? "#243450" : "#c6dcef";
}

/* ------------------------------------------------------------------ *
 * The drawing rig
 *
 * Species functions all draw into the same normalised frame: the origin sits
 * where the animal meets the ground, up is negative y, the nose points at
 * +x, and the whole animal fits in a box `s` tall. One frame means the twelve
 * bodies below can be compared line by line, which is the only way to keep
 * their proportions honestly different from each other.
 * ------------------------------------------------------------------ */

interface Rig {
  /** Overall height in pixels. Every coordinate is a fraction of it. */
  s: number;
  /** Key-light x direction inside the (possibly mirrored) local frame. */
  k: number;
  /** Gait or wingbeat phase in radians. */
  m: number;
  moving: boolean;
  pal: Coat;
  dark: boolean;
  /** Whether whiskers, barbs and fur strokes will survive at this size. */
  fine: boolean;
}

export interface CreatureOpts {
  /** Recolour the coat — light versus dark fur for selection topics. */
  tint?: string;
  /** 0-1 phase through one gait or wingbeat cycle. Omit for a still pose. */
  motion?: number;
  /** 0-1 aerial perspective: how much air stands between viewer and animal. */
  haze?: number;
  /** What that air is coloured. Defaults to the theme's atmosphere. */
  hazeColor?: string;
  /** Ground contact shadow. On by default for anything that walks. */
  shadow?: boolean;
  alpha?: number;
  /** A ring behind the animal, for tagging a selected or marked individual. */
  highlight?: string;
}

/**
 * Draw one organism.
 *
 * `x, y` is the point where it meets the ground (for a flier or a fish, the
 * bottom of its bounding box), `size` is its overall height, and `facing` is
 * -1 or 1. Everything else is `opts`.
 */
export function creature(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  which: CreatureKind, facing: number,
  theme: ThemeColors,
  opts: CreatureOpts = {},
) {
  const s = Math.max(4, size);
  const dark = isDarkTheme(theme);
  const pal = coatOf(
    which, opts.tint, opts.haze ?? 0,
    opts.hazeColor ?? atmosphereColor(theme), dark,
  );
  const f = facing < 0 ? -1 : 1;

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha *= clamp01(opts.alpha);

  if (opts.highlight) {
    const g = ctx.createRadialGradient(x, y - s * 0.45, s * 0.1, x, y - s * 0.45, s * 0.78);
    g.addColorStop(0, hexA(opts.highlight, 0.5));
    g.addColorStop(1, hexA(opts.highlight, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.45, s * 0.78, s * 0.7, 0, 0, TAU);
    ctx.fill();
  }

  // The shadow goes down before the animal so it never paints over a foot.
  if (opts.shadow !== false && !AQUATIC.has(which)) {
    const lift = AIRBORNE.has(which) ? s * 0.9 : 0;
    const spread = 1 + lift / (s * 1.6);
    spriteShadowEllipse(
      ctx, x + s * 0.06, y + lift * 0.12,
      s * 0.4 * spread, s * 0.12 * spread,
      { alpha: (dark ? 0.34 : 0.28) / spread },
    );
  }

  ctx.translate(x, y);
  ctx.scale(f, 1);
  const rig: Rig = {
    s, k: KEY.x * f, m: (opts.motion ?? 0) * TAU,
    moving: opts.motion !== undefined,
    pal, dark, fine: s >= FINE_DETAIL_PX,
  };
  SPECIES[which](ctx, rig);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Shape helpers
 * ------------------------------------------------------------------ */

type Pt = readonly [number, number];

/** A closed, smooth outline through control points. Bodies are never polygons. */
function blob(ctx: CanvasRenderingContext2D, pts: readonly Pt[]) {
  const n = pts.length;
  ctx.beginPath();
  const mx = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mx(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const end = mx(cur, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(cur[0], cur[1], end[0], end[1]);
  }
  ctx.closePath();
}

/** The same, left open — a spine, a stem, a whisker. */
function curve(ctx: CanvasRenderingContext2D, pts: readonly Pt[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mxx = (pts[i][0] + pts[i + 1][0]) / 2;
    const myy = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mxx, myy);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

/**
 * A closed outline around a spine whose half-width varies along it. This is
 * how every limb, tail and stem in the file is built: a stroked line has one
 * width and reads as wire, whereas a real leg is thick at the hip and thin at
 * the foot, and that taper is most of what says "leg".
 */
function taper(
  ctx: CanvasRenderingContext2D, spine: readonly Pt[],
  widthAt: (t: number) => number,
) {
  const n = spine.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = spine[i];
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = widthAt(i / (n - 1 || 1)) / 2;
    left.push([p[0] - (dy / len) * w, p[1] + (dx / len) * w]);
    right.push([p[0] + (dy / len) * w, p[1] - (dx / len) * w]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
}

/** Sample a curved spine, so limbs bend at the joint instead of hinging. */
function arcSpine(a: Pt, ctrl: Pt, b: Pt, steps = 7): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1],
    ]);
  }
  return out;
}

/** A rounded volume lit from the key. The workhorse fill for anything furry. */
function furGrad(
  ctx: CanvasRenderingContext2D, rig: Rig,
  cx: number, cy: number, r: number, base: string, shade: string,
): CanvasGradient {
  const g = ctx.createRadialGradient(
    cx + rig.k * r * 0.55, cy + KEY.y * r * 0.55, r * 0.05, cx, cy, r * 1.08,
  );
  g.addColorStop(0, mix(base, FUR_LIGHT, 0.38));
  g.addColorStop(0.44, base);
  g.addColorStop(1, shade);
  return g;
}

/** Ink the current path so the outline reads at any size, then optionally rim. */
function contour(ctx: CanvasRenderingContext2D, rig: Rig, weight = 0.016) {
  ctx.strokeStyle = hexA(rig.pal.outline, rig.pal.outlineAlpha);
  ctx.lineWidth = Math.max(0.7, rig.s * weight);
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** An eye that looks alive: dark bead, wet catchlight, faint lid shadow. */
function eye(ctx: CanvasRenderingContext2D, rig: Rig, ex: number, ey: number, r: number) {
  const rr = Math.max(0.6, r);
  ctx.beginPath();
  ctx.arc(ex, ey, rr, 0, TAU);
  ctx.fillStyle = rig.pal.eye;
  ctx.fill();
  if (rig.s > 16) {
    ctx.beginPath();
    ctx.arc(ex + rig.k * rr * 0.42, ey - rr * 0.42, Math.max(0.4, rr * 0.36), 0, TAU);
    ctx.fillStyle = hexA("#ffffff", 0.9);
    ctx.fill();
  }
}

/** Fur strokes along an edge. Large sizes only — at 20 px this is grey mud. */
function furFringe(
  ctx: CanvasRenderingContext2D, rig: Rig, spine: readonly Pt[],
  len: number, color: string, side = 1,
) {
  if (!rig.fine) return;
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.5);
  ctx.lineWidth = Math.max(0.6, rig.s * 0.008);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 1; i < spine.length; i++) {
    const p = spine[i];
    const q = spine[i - 1];
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * side;
    const ny = (dx / l) * side;
    const k = len * (0.6 + 0.4 * Math.sin(i * 2.1));
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] + nx * k + dx * 0.5, p[1] + ny * k + dy * 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/** Reflect a point list about a horizontal axis — the far side of a body. */
function mirrorY(pts: readonly Pt[], axis: number): Pt[] {
  return pts.map((p): Pt => [p[0], 2 * axis - p[1]]);
}

/** Squash a shape toward an axis. A wing seen edge-on is a wing foreshortened. */
function fold(pts: readonly Pt[], axis: number, k: number): Pt[] {
  return pts.map((p): Pt => [p[0], axis + (p[1] - axis) * k]);
}

/** A travelling wave down a body — how a fish and a worm actually move. */
function flex(pts: readonly Pt[], amp: number, k: number, phase: number): Pt[] {
  return pts.map((p): Pt => [p[0], p[1] + Math.sin(phase - p[0] * k) * amp]);
}

/** A limb: tapered, bent at the joint, with a pad on the end. */
function leg(
  ctx: CanvasRenderingContext2D, rig: Rig,
  hip: Pt, joint: Pt, foot: Pt, top: number, bottom: number,
  color: string, sock?: string,
) {
  const spine = arcSpine(hip, joint, foot, 8);
  taper(ctx, spine, (t) => Math.max(MIN_FEATURE, top + (bottom - top) * t));
  ctx.fillStyle = color;
  ctx.fill();
  contour(ctx, rig, 0.01);
  if (sock) {
    // Dark stockings are a real marking on foxes and deer, and they double as
    // the shadow where a leg meets the ground, so the animal stands on it.
    taper(ctx, spine.slice(5), () => Math.max(MIN_FEATURE, bottom * 1.05));
    ctx.fillStyle = sock;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(foot[0] + bottom * 0.3, foot[1] - bottom * 0.2,
    Math.max(MIN_FEATURE, bottom * 0.95), Math.max(MIN_FEATURE * 0.7, bottom * 0.62),
    0, 0, TAU);
  ctx.fillStyle = sock ?? color;
  ctx.fill();
}

/** A tapered ear, tail or antler drawn from a spine, filled and inked. */
function appendage(
  ctx: CanvasRenderingContext2D, rig: Rig, spine: readonly Pt[],
  widthAt: (t: number) => number, fill: string | CanvasGradient, weight = 0.012,
) {
  taper(ctx, spine, (t) => Math.max(MIN_FEATURE, widthAt(t)));
  ctx.fillStyle = fill;
  ctx.fill();
  contour(ctx, rig, weight);
}

/* ------------------------------------------------------------------ *
 * The twelve bodies
 *
 * Read these as a set. What matters is not that any one is pretty but that no
 * two share a silhouette: rabbit is ears-and-haunch, fox is muzzle-and-brush,
 * deer is legs-and-neck, wolf is chest-and-withers, mouse is round ears and a
 * naked tail. Those differences are drawn at the scale of a tenth of the
 * animal's height, which is what makes them survive down to twenty pixels.
 * ------------------------------------------------------------------ */

const SPECIES: Record<CreatureKind, (ctx: CanvasRenderingContext2D, rig: Rig) => void> = {
  rabbit: drawRabbit, fox: drawFox, deer: drawDeer, wolf: drawWolf,
  mouse: drawMouse, bird: drawBird, hawk: drawHawk, fish: drawFish,
  insect: drawInsect, butterfly: drawButterfly, bee: drawBee, worm: drawWorm,
};

/**
 * Rabbit.
 *
 * The ears are 34% of the animal's total height and they stay that long under
 * every tint, because they are the whole identification. Shorten them to fit a
 * cuter head and the animal becomes a guinea pig; tint them dark without
 * keeping their width above the pixel floor and they vanish, which is exactly
 * how the old ecosystem sim ended up with two kinds of blob.
 */
function drawRabbit(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  // A rabbit travels by throwing its whole body off two oversized hind feet,
  // so the gait is a launch and a landing, not a walk.
  const hop = rig.moving ? Math.max(0, Math.sin(rig.m)) : 0;
  ctx.save();
  ctx.translate(0, -hop * s * 0.17);
  ctx.rotate(-hop * 0.09);

  const far = mix(pal.base, pal.shade, 0.5);

  // Far ear, behind the head.
  appendage(ctx, rig, arcSpine([0.20 * s, -0.66 * s], [0.10 * s, -0.86 * s], [0.09 * s, -1.0 * s]),
    (t) => s * (0.082 - 0.066 * t * t), far);

  // Long hind foot flat on the ground — a rabbit's other unmistakable feature.
  ctx.beginPath();
  ctx.ellipse(-0.14 * s + hop * s * 0.06, -0.05 * s, 0.19 * s, 0.055 * s, -0.04, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, -0.14 * s, -0.05 * s, 0.19 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig, 0.011);

  // Scut: a pale puff that breaks the rear outline even in a dark coat.
  ctx.beginPath();
  ctx.arc(-0.42 * s, -0.37 * s, 0.085 * s, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, -0.42 * s, -0.37 * s, 0.085 * s, pal.light, mix(pal.light, pal.shade, 0.4));
  ctx.fill();

  // Body: chest low at the front, haunch piled high at the back.
  const body: Pt[] = [
    [-0.40 * s, -0.36 * s], [-0.34 * s, -0.57 * s], [-0.10 * s, -0.63 * s],
    [0.14 * s, -0.57 * s], [0.27 * s, -0.42 * s], [0.22 * s, -0.17 * s],
    [-0.06 * s, -0.12 * s], [-0.32 * s, -0.17 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, -0.06 * s, -0.40 * s, 0.42 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);

  // Countershaded belly.
  ctx.save();
  blob(ctx, body);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, -0.30 * s, 0, -0.10 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.9));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.5 * s, -0.4 * s, s, 0.4 * s);
  ctx.restore();

  // Haunch: the mass a rabbit launches from, drawn as its own lit volume.
  ctx.beginPath();
  ctx.ellipse(-0.17 * s, -0.34 * s, 0.22 * s, 0.20 * s, -0.12, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, -0.17 * s, -0.34 * s, 0.22 * s, pal.base, pal.shade);
  ctx.fill();
  ctx.strokeStyle = hexA(pal.shade, 0.35);
  ctx.lineWidth = Math.max(0.6, s * 0.008);
  ctx.stroke();

  // Foreleg, tucked under the chest.
  leg(ctx, rig, [0.15 * s, -0.34 * s], [0.19 * s, -0.20 * s],
    [0.20 * s - hop * s * 0.05, -0.02 * s], s * 0.075, s * 0.055, pal.base);

  // Head: short and blunt. A rabbit has almost no muzzle, which is the
  // clearest way to tell its head from a fox's at any size.
  const head: Pt[] = [
    [0.15 * s, -0.68 * s], [0.30 * s, -0.73 * s], [0.42 * s, -0.66 * s],
    [0.45 * s, -0.55 * s], [0.34 * s, -0.47 * s], [0.19 * s, -0.51 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.28 * s, -0.60 * s, 0.18 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);

  // Near ear, with its inner surface showing.
  const earSpine = arcSpine([0.27 * s, -0.66 * s], [0.29 * s, -0.86 * s], [0.33 * s, -0.99 * s]);
  appendage(ctx, rig, earSpine, (t) => s * (0.09 - 0.072 * t * t),
    furGrad(ctx, rig, 0.30 * s, -0.82 * s, 0.16 * s, pal.base, pal.shade));
  taper(ctx, earSpine.slice(1), (t) => Math.max(0.8, s * (0.05 - 0.042 * t * t)));
  ctx.fillStyle = hexA(pal.accent, 0.85);
  ctx.fill();

  eye(ctx, rig, 0.33 * s, -0.62 * s, s * 0.034);
  ctx.beginPath();
  ctx.ellipse(0.435 * s, -0.575 * s, s * 0.026, s * 0.02, 0.4, 0, TAU);
  ctx.fillStyle = pal.accent;
  ctx.fill();

  if (rig.fine) {
    ctx.strokeStyle = hexA(pal.light, 0.55);
    ctx.lineWidth = Math.max(0.5, s * 0.006);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(0.43 * s, -0.58 * s + i * 0.012 * s);
      ctx.lineTo(0.66 * s, -0.62 * s + i * 0.05 * s);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Fox.
 *
 * Three things and only three things have to survive: the wedge muzzle, the
 * upright triangular ears, and a brush tail that is 45% of the animal's whole
 * length. Together they make an outline half again as wide as it is tall,
 * where a rabbit's is square — so the two are separable by shape before the
 * rust colour has said anything at all. That matters, because a colour-blind
 * student and a greyscale printout both still have to work.
 */
function drawFox(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const sw = (p: number) => (rig.moving ? Math.sin(rig.m + p) : 0);
  const bob = rig.moving ? -Math.cos(rig.m * 2) * s * 0.012 : 0;
  const far = mix(pal.base, pal.shade, 0.55);
  const farDark = mix(pal.dark, pal.shade, 0.4);

  ctx.save();
  ctx.translate(0, bob);

  // Tail: drawn first so it sits behind the haunch, and given a scalloped
  // width so its edge reads as fur rather than as a sausage.
  const tail: Pt[] = [
    [-0.24 * s, -0.60 * s], [-0.40 * s, -0.63 * s], [-0.55 * s, -0.60 * s],
    [-0.68 * s, -0.50 * s], [-0.77 * s, -0.36 * s], [-0.80 * s, -0.22 * s],
  ].map((p): Pt => [p[0], p[1] + sw(2.2) * s * 0.03 * ((p[0] / s) * -1)]);
  const tailSpine = arcSpine(tail[0], tail[2], tail[5], 10);
  const brush = (t: number) =>
    s * (0.06 + 0.17 * Math.sin(Math.min(1, t * 1.02) * Math.PI * 0.92)) *
    (1 + 0.06 * Math.sin(t * 22));
  appendage(ctx, rig, tailSpine, brush,
    furGrad(ctx, rig, -0.5 * s, -0.52 * s, 0.3 * s, pal.base, pal.shade));
  // White tip: a marking whose entire function in the field is to break the
  // outline, which is exactly what it does for us at twenty pixels too.
  taper(ctx, tailSpine.slice(7), (t) => Math.max(MIN_FEATURE, brush(0.72 + t * 0.28) * 0.94));
  ctx.fillStyle = furGrad(ctx, rig, -0.76 * s, -0.3 * s, 0.14 * s, pal.light, mix(pal.light, pal.shade, 0.45));
  ctx.fill();
  furFringe(ctx, rig, tailSpine, s * 0.05, pal.shade, -1);

  // Far pair of legs, pushed back in tone so the near pair reads in front.
  leg(ctx, rig, [-0.20 * s, -0.60 * s], [-0.31 * s, -0.34 * s],
    [-0.18 * s + sw(0) * s * 0.09, -0.01 * s], s * 0.085, s * 0.05, far, farDark);
  leg(ctx, rig, [0.16 * s, -0.58 * s], [0.12 * s, -0.32 * s],
    [0.14 * s + sw(Math.PI) * s * 0.09, -0.01 * s], s * 0.08, s * 0.048, far, farDark);

  const body: Pt[] = [
    [-0.30 * s, -0.60 * s], [-0.12 * s, -0.71 * s], [0.12 * s, -0.72 * s],
    [0.31 * s, -0.65 * s], [0.31 * s, -0.51 * s], [0.10 * s, -0.44 * s],
    [-0.14 * s, -0.44 * s], [-0.29 * s, -0.49 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, 0.0, -0.58 * s, 0.4 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);

  ctx.save();
  blob(ctx, body);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, -0.56 * s, 0, -0.43 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.92));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.4 * s, -0.6 * s, 0.8 * s, 0.2 * s);
  const dg = ctx.createLinearGradient(0, -0.74 * s, 0, -0.6 * s);
  dg.addColorStop(0, hexA(pal.back, 0.75));
  dg.addColorStop(1, hexA(pal.back, 0));
  ctx.fillStyle = dg;
  ctx.fillRect(-0.4 * s, -0.76 * s, 0.8 * s, 0.2 * s);
  ctx.restore();

  // Near legs, in full coat with black stockings.
  leg(ctx, rig, [-0.16 * s, -0.60 * s], [-0.26 * s, -0.34 * s],
    [-0.13 * s + sw(Math.PI) * s * 0.1, -0.01 * s], s * 0.09, s * 0.052, pal.base, pal.dark);
  leg(ctx, rig, [0.22 * s, -0.58 * s], [0.26 * s, -0.32 * s],
    [0.27 * s + sw(0) * s * 0.1, -0.01 * s], s * 0.085, s * 0.05, pal.base, pal.dark);

  // Neck and the long wedge head.
  appendage(ctx, rig, arcSpine([0.22 * s, -0.63 * s], [0.34 * s, -0.72 * s], [0.42 * s, -0.79 * s]),
    () => s * 0.2, furGrad(ctx, rig, 0.32 * s, -0.7 * s, 0.18 * s, pal.base, pal.shade), 0.0);

  // Ears: tall isosceles triangles with black tips. Fox ears are enormous for
  // the skull that carries them, and drawing them politely small is the single
  // fastest way to turn a fox into an unidentifiable dog.
  for (const [bx, ax, tone] of [[0.36, 0.325, far], [0.48, 0.535, pal.base]] as const) {
    ctx.beginPath();
    ctx.moveTo((bx - 0.07) * s, -0.83 * s);
    ctx.quadraticCurveTo((ax - 0.02) * s, -0.94 * s, ax * s, -1.0 * s);
    ctx.quadraticCurveTo((ax + 0.06) * s, -0.92 * s, (bx + 0.08) * s, -0.82 * s);
    ctx.closePath();
    ctx.fillStyle = furGrad(ctx, rig, bx * s, -0.88 * s, 0.14 * s, tone, mix(tone, pal.shade, 0.4));
    ctx.fill();
    contour(ctx, rig, 0.011);
    ctx.beginPath();
    ctx.moveTo((ax - 0.045) * s, -0.945 * s);
    ctx.lineTo(ax * s, -1.0 * s);
    ctx.lineTo((ax + 0.05) * s, -0.935 * s);
    ctx.closePath();
    ctx.fillStyle = hexA(mix(pal.dark, tone, 0.15), 0.9);
    ctx.fill();
  }

  const head: Pt[] = [
    [0.34 * s, -0.86 * s], [0.46 * s, -0.90 * s], [0.57 * s, -0.84 * s],
    [0.56 * s, -0.74 * s], [0.44 * s, -0.69 * s], [0.33 * s, -0.75 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.44 * s, -0.81 * s, 0.16 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);

  // The muzzle. Narrow, straight and long — the fox's signature.
  const muzzle = arcSpine([0.50 * s, -0.79 * s], [0.60 * s, -0.775 * s], [0.71 * s, -0.755 * s], 5);
  appendage(ctx, rig, muzzle, (t) => s * (0.135 - 0.085 * t), pal.base, 0.01);
  taper(ctx, muzzle, (t) => Math.max(0.8, s * (0.06 - 0.04 * t)));
  ctx.fillStyle = hexA(pal.light, 0.8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.715 * s, -0.755 * s, Math.max(0.9, s * 0.03), 0, TAU);
  ctx.fillStyle = pal.dark;
  ctx.fill();

  // Cheek ruff and throat, in the pale marking colour.
  ctx.beginPath();
  ctx.ellipse(0.40 * s, -0.73 * s, 0.1 * s, 0.06 * s, 0.3, 0, TAU);
  ctx.fillStyle = hexA(pal.light, 0.7);
  ctx.fill();

  // Amber eye, set as a slanted almond. Round eyes read as a pet.
  ctx.save();
  ctx.translate(0.475 * s, -0.825 * s);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.05, s * 0.032, 0, 0, TAU);
  ctx.fillStyle = pal.eye;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.026, s * 0.03, 0, 0, TAU);
  ctx.fillStyle = "#1a0f04";
  ctx.fill();
  ctx.restore();
  if (rig.s > 16) {
    ctx.beginPath();
    ctx.arc(0.462 * s, -0.836 * s, Math.max(0.4, s * 0.012), 0, TAU);
    ctx.fillStyle = hexA("#ffffff", 0.85);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Deer.
 *
 * More than half its height is leg, the neck carries a small head up near the
 * top of the frame, and the ears are broad paddles held sideways. That trio
 * gives a tall, narrow, top-heavy outline that nothing else here has — a wolf
 * of the same height is a horizontal mass with the head out front.
 */
function drawDeer(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const sw = (p: number) => (rig.moving ? Math.sin(rig.m + p) : 0);
  const far = mix(pal.base, pal.shade, 0.5);
  const hoof = pal.dark;

  leg(ctx, rig, [-0.20 * s, -0.68 * s], [-0.31 * s, -0.38 * s],
    [-0.19 * s + sw(0) * s * 0.08, -0.01 * s], s * 0.075, s * 0.032, far, hoof);
  leg(ctx, rig, [0.15 * s, -0.68 * s], [0.12 * s, -0.38 * s],
    [0.14 * s + sw(Math.PI) * s * 0.08, -0.01 * s], s * 0.065, s * 0.03, far, hoof);

  const body: Pt[] = [
    [-0.28 * s, -0.70 * s], [-0.08 * s, -0.79 * s], [0.14 * s, -0.78 * s],
    [0.27 * s, -0.70 * s], [0.24 * s, -0.60 * s], [0.02 * s, -0.56 * s],
    [-0.22 * s, -0.58 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, -0.02 * s, -0.68 * s, 0.32 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);
  ctx.save();
  blob(ctx, body);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, -0.68 * s, 0, -0.55 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.95));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.4 * s, -0.7 * s, 0.8 * s, 0.2 * s);
  ctx.restore();

  // Pale rump patch — visible from behind at distance, which is its job.
  ctx.beginPath();
  ctx.ellipse(-0.25 * s, -0.68 * s, 0.06 * s, 0.08 * s, 0.2, 0, TAU);
  ctx.fillStyle = hexA(pal.light, 0.75);
  ctx.fill();
  // Flag tail, held up.
  appendage(ctx, rig, arcSpine([-0.27 * s, -0.70 * s], [-0.34 * s, -0.76 * s], [-0.33 * s, -0.82 * s], 4),
    (t) => s * (0.07 - 0.03 * t), pal.light, 0.009);

  leg(ctx, rig, [-0.13 * s, -0.68 * s], [-0.24 * s, -0.38 * s],
    [-0.12 * s + sw(Math.PI) * s * 0.08, -0.01 * s], s * 0.08, s * 0.034, pal.base, hoof);
  leg(ctx, rig, [0.22 * s, -0.68 * s], [0.25 * s, -0.38 * s],
    [0.26 * s + sw(0) * s * 0.08, -0.01 * s], s * 0.07, s * 0.032, pal.base, hoof);

  // Long neck, thick at the shoulder and thin at the throat.
  appendage(ctx, rig, arcSpine([0.18 * s, -0.74 * s], [0.34 * s, -0.80 * s], [0.46 * s, -0.90 * s], 7),
    (t) => s * (0.17 - 0.075 * t),
    furGrad(ctx, rig, 0.32 * s, -0.82 * s, 0.16 * s, pal.base, pal.shade));

  // Broad lateral ears. On a deer these are held out at right angles to the
  // skull and swivel independently, and their width is what stops the head
  // reading as a fox's at small size.
  for (const [tip, tone] of [[[0.31, -0.945], far], [[0.64, -0.935], pal.base]] as const) {
    const spine = arcSpine([0.48 * s, -0.90 * s], [(tip[0] + 0.48) * 0.5 * s, (tip[1] - 0.02) * s],
      [tip[0] * s, tip[1] * s], 5);
    appendage(ctx, rig, spine, (t) => s * (0.05 + 0.06 * Math.sin(t * Math.PI)), tone, 0.009);
  }

  // Antlers. A doe has none, but a forked crown is worth far more to
  // recognition than strict accuracy costs, so the deer here is a buck.
  const bone = mix(pal.base, "#f0e2c6", 0.62);
  for (const [x0, x1, tx, ty] of [[0.465, 0.40, 0.35, -0.985], [0.515, 0.575, 0.62, -0.98]] as const) {
    appendage(ctx, rig, arcSpine([x0 * s, -0.925 * s], [x1 * s, -0.985 * s], [tx * s, ty * s], 5),
      (t) => s * (0.028 - 0.016 * t), bone, 0.008);
    appendage(ctx, rig, arcSpine([((x0 + x1) / 2) * s, -0.955 * s],
      [x1 * s, -1.0 * s], [(x1 + (x1 - x0) * 1.2) * s, -1.0 * s], 4),
      (t) => s * (0.02 - 0.012 * t), bone, 0.008);
  }

  const head: Pt[] = [
    [0.41 * s, -0.925 * s], [0.51 * s, -0.935 * s], [0.60 * s, -0.895 * s],
    [0.655 * s, -0.855 * s], [0.53 * s, -0.825 * s], [0.42 * s, -0.86 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.50 * s, -0.885 * s, 0.13 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig, 0.012);
  ctx.beginPath();
  ctx.ellipse(0.655 * s, -0.862 * s, s * 0.028, s * 0.024, 0.3, 0, TAU);
  ctx.fillStyle = pal.dark;
  ctx.fill();
  eye(ctx, rig, 0.545 * s, -0.90 * s, s * 0.026);
}

/**
 * Wolf.
 *
 * Built as the anti-fox: a hump of muscle over the shoulders that is the
 * highest point of the back, a broad blunt muzzle, ears that are small for the
 * skull, longer legs, and a straight tail carried low. Where a fox's outline
 * is a low body with a rising plume behind it, a wolf's is a deep chest with a
 * straight line trailing off the back — legible even before the grey coat
 * separates them.
 */
function drawWolf(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const sw = (p: number) => (rig.moving ? Math.sin(rig.m + p) : 0);
  const far = mix(pal.base, pal.shade, 0.5);

  // Tail: bushy, straight and carried low. A fox's plume rises behind it and
  // curls; a wolf's hangs. That difference in line is legible at a distance
  // where neither the colour nor the head has resolved yet.
  const tailSpine = arcSpine([-0.30 * s, -0.64 * s], [-0.54 * s, -0.50 * s], [-0.80 * s, -0.26 * s], 10);
  appendage(ctx, rig, tailSpine,
    (t) => s * (0.06 + 0.115 * Math.sin(Math.min(1, t * 1.06) * Math.PI * 0.9)),
    furGrad(ctx, rig, -0.54 * s, -0.46 * s, 0.26 * s, pal.base, pal.shade));
  taper(ctx, tailSpine.slice(8), (t) => Math.max(MIN_FEATURE, s * (0.11 - 0.07 * t)));
  ctx.fillStyle = hexA(pal.dark, 0.55);
  ctx.fill();
  furFringe(ctx, rig, tailSpine, s * 0.045, pal.shade, -1);

  leg(ctx, rig, [-0.22 * s, -0.62 * s], [-0.33 * s, -0.32 * s],
    [-0.20 * s + sw(0) * s * 0.09, -0.01 * s], s * 0.1, s * 0.06, far);
  leg(ctx, rig, [0.16 * s, -0.66 * s], [0.12 * s, -0.32 * s],
    [0.14 * s + sw(Math.PI) * s * 0.09, -0.01 * s], s * 0.095, s * 0.058, far);

  const body: Pt[] = [
    [-0.34 * s, -0.64 * s], [-0.16 * s, -0.74 * s], [0.08 * s, -0.79 * s],
    [0.30 * s, -0.74 * s], [0.36 * s, -0.62 * s], [0.28 * s, -0.51 * s],
    [0.0, -0.49 * s], [-0.26 * s, -0.53 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, 0.0, -0.63 * s, 0.4 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);
  ctx.save();
  blob(ctx, body);
  ctx.clip();
  // The dark saddle: on a wolf the back is markedly darker than the flank.
  const dg = ctx.createLinearGradient(0, -0.80 * s, 0, -0.62 * s);
  dg.addColorStop(0, hexA(pal.back, 0.9));
  dg.addColorStop(1, hexA(pal.back, 0));
  ctx.fillStyle = dg;
  ctx.fillRect(-0.4 * s, -0.82 * s, 0.8 * s, 0.24 * s);
  const bg = ctx.createLinearGradient(0, -0.62 * s, 0, -0.48 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.85));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.4 * s, -0.64 * s, 0.8 * s, 0.2 * s);
  ctx.restore();
  furFringe(ctx, rig, [[-0.3 * s, -0.55 * s], [0.0, -0.50 * s], [0.28 * s, -0.53 * s]],
    s * 0.05, pal.belly, 1);

  leg(ctx, rig, [-0.16 * s, -0.62 * s], [-0.27 * s, -0.32 * s],
    [-0.14 * s + sw(Math.PI) * s * 0.1, -0.01 * s], s * 0.105, s * 0.062, pal.base, mix(pal.base, pal.belly, 0.5));
  leg(ctx, rig, [0.24 * s, -0.66 * s], [0.27 * s, -0.32 * s],
    [0.28 * s + sw(0) * s * 0.1, -0.01 * s], s * 0.1, s * 0.06, pal.base, mix(pal.base, pal.belly, 0.5));

  // A thick neck, which is most of why a wolf's head reads as heavy.
  appendage(ctx, rig, arcSpine([0.24 * s, -0.70 * s], [0.36 * s, -0.76 * s], [0.44 * s, -0.82 * s], 6),
    () => s * 0.26, furGrad(ctx, rig, 0.34 * s, -0.76 * s, 0.2 * s, pal.base, pal.shade), 0.0);

  for (const [bx, ax, tone] of [[0.39, 0.375, far], [0.50, 0.525, pal.base]] as const) {
    ctx.beginPath();
    ctx.moveTo((bx - 0.06) * s, -0.87 * s);
    ctx.quadraticCurveTo((ax - 0.03) * s, -0.96 * s, ax * s, -0.995 * s);
    ctx.quadraticCurveTo((ax + 0.055) * s, -0.955 * s, (bx + 0.07) * s, -0.865 * s);
    ctx.closePath();
    ctx.fillStyle = furGrad(ctx, rig, bx * s, -0.92 * s, 0.12 * s, tone, mix(tone, pal.shade, 0.4));
    ctx.fill();
    contour(ctx, rig, 0.011);
  }

  const head: Pt[] = [
    [0.35 * s, -0.88 * s], [0.47 * s, -0.92 * s], [0.58 * s, -0.87 * s],
    [0.59 * s, -0.78 * s], [0.46 * s, -0.73 * s], [0.35 * s, -0.79 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.46 * s, -0.84 * s, 0.18 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);

  // A short, deep, blunt muzzle: nearly twice the fox's width for its length.
  const muzzle = arcSpine([0.53 * s, -0.83 * s], [0.62 * s, -0.825 * s], [0.71 * s, -0.815 * s], 5);
  appendage(ctx, rig, muzzle, (t) => s * (0.155 - 0.055 * t),
    furGrad(ctx, rig, 0.62 * s, -0.83 * s, 0.1 * s, pal.base, pal.shade), 0.01);
  taper(ctx, muzzle, (t) => Math.max(0.8, s * (0.07 - 0.02 * t)));
  ctx.fillStyle = hexA(pal.belly, 0.85);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.715 * s, -0.815 * s, Math.max(1, s * 0.035), 0, TAU);
  ctx.fillStyle = pal.dark;
  ctx.fill();

  // Pale mask around the cheek and jaw — the wolf's face pattern.
  ctx.beginPath();
  ctx.ellipse(0.44 * s, -0.775 * s, 0.11 * s, 0.06 * s, 0.25, 0, TAU);
  ctx.fillStyle = hexA(pal.belly, 0.7);
  ctx.fill();
  eye(ctx, rig, 0.505 * s, -0.865 * s, s * 0.03);
  ctx.beginPath();
  ctx.arc(0.505 * s, -0.865 * s, Math.max(0.7, s * 0.017), 0, TAU);
  ctx.fillStyle = pal.eye;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.505 * s, -0.865 * s, Math.max(0.4, s * 0.009), 0, TAU);
  ctx.fillStyle = "#150d04";
  ctx.fill();
}

/**
 * Mouse.
 *
 * Two round ears the size of its own head and a naked tail longer than its
 * body. Both are deliberate exaggerations of real proportions, and both exist
 * so the mouse never gets mistaken for a distant rabbit: a rabbit's ears are
 * long ovals, a mouse's are discs.
 */
function drawMouse(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const scurry = rig.moving ? Math.sin(rig.m * 2) : 0;
  ctx.save();
  ctx.translate(0, -Math.abs(scurry) * s * 0.03);

  // Long bare tail. It is about as long as the body and arched up behind,
  // not trailed straight out — a straight tail reads as a wire and takes the
  // animal's whole width with it in a crowd scene.
  appendage(ctx, rig, arcSpine([-0.28 * s, -0.38 * s], [-0.58 * s, -0.52 * s],
    [-0.60 * s, -0.86 * s + scurry * s * 0.05], 10),
    (t) => s * (0.05 - 0.034 * t), pal.accent, 0.008);

  const body: Pt[] = [
    [-0.34 * s, -0.40 * s], [-0.22 * s, -0.60 * s], [0.02 * s, -0.65 * s],
    [0.22 * s, -0.56 * s], [0.27 * s, -0.34 * s], [0.06 * s, -0.16 * s],
    [-0.22 * s, -0.20 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, -0.04 * s, -0.42 * s, 0.34 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);
  ctx.save();
  blob(ctx, body);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, -0.34 * s, 0, -0.16 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.95));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.4 * s, -0.36 * s, 0.8 * s, 0.36 * s);
  ctx.restore();

  for (const fx of [-0.16, 0.14] as const) {
    ctx.beginPath();
    ctx.ellipse(fx * s, -0.05 * s, s * 0.07, s * 0.035, 0, 0, TAU);
    ctx.fillStyle = pal.accent;
    ctx.fill();
  }

  // The ears. Discs, not ovals.
  for (const [ex, ey, er, tone] of [
    [0.09, -0.76, 0.175, mix(pal.base, pal.shade, 0.45)],
    [0.28, -0.80, 0.195, pal.base],
  ] as const) {
    ctx.beginPath();
    ctx.arc(ex * s, ey * s, er * s, 0, TAU);
    ctx.fillStyle = furGrad(ctx, rig, ex * s, ey * s, er * s, tone, mix(tone, pal.shade, 0.4));
    ctx.fill();
    contour(ctx, rig, 0.012);
    ctx.beginPath();
    ctx.arc(ex * s + s * 0.01, ey * s + s * 0.02, er * s * 0.6, 0, TAU);
    ctx.fillStyle = hexA(pal.accent, 0.8);
    ctx.fill();
  }

  // Head, ending in a sharp snout.
  const head: Pt[] = [
    [0.14 * s, -0.64 * s], [0.30 * s, -0.62 * s], [0.46 * s, -0.53 * s],
    [0.57 * s, -0.44 * s], [0.38 * s, -0.35 * s], [0.18 * s, -0.42 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.30 * s, -0.51 * s, 0.2 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);
  ctx.beginPath();
  ctx.arc(0.565 * s, -0.445 * s, Math.max(1, s * 0.035), 0, TAU);
  ctx.fillStyle = pal.accent;
  ctx.fill();
  eye(ctx, rig, 0.35 * s, -0.535 * s, s * 0.05);

  if (rig.fine) {
    ctx.strokeStyle = hexA(pal.light, 0.6);
    ctx.lineWidth = Math.max(0.5, s * 0.006);
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(0.54 * s, -0.46 * s);
      ctx.lineTo(0.82 * s, -0.46 * s + i * 0.12 * s);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Songbird.
 *
 * Perched: a plump body tipped forward, a round head almost as wide as the
 * chest, a short conical seed-eater's beak, and a tail angled down and back.
 * Deliberately *not* a flying shape — the hawk owns that outline, and two
 * birds sharing one pose would be exactly the failure this file exists to fix.
 */
function drawBird(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  // Both wings swing the same way and only upward. Mirroring the far wing's
  // rotation sent it down behind the tail, where the two merged into one dark
  // slab and cost the bird the long back end it is recognised by.
  const beat = rig.moving ? 0.08 + Math.max(0, Math.sin(rig.m)) * 0.7 : 0.1;

  // The folded wing is deliberately smaller than the body it lies on. Drawn
  // any larger it covers the tail, and a bird whose tail is hidden loses the
  // long back end that separates its outline from a mouse's.
  const wing: Pt[] = [
    [0.15 * s, -0.60 * s], [0.05 * s, -0.65 * s], [-0.08 * s, -0.60 * s],
    [-0.23 * s, -0.45 * s], [-0.07 * s, -0.40 * s], [0.10 * s, -0.44 * s],
  ];
  const shoulder: Pt = [0.08 * s, -0.58 * s];

  const drawWing = (angle: number, tone: string) => {
    ctx.save();
    ctx.translate(shoulder[0], shoulder[1]);
    ctx.rotate(angle);
    ctx.translate(-shoulder[0], -shoulder[1]);
    blob(ctx, wing);
    ctx.fillStyle = furGrad(ctx, rig, -0.02 * s, -0.52 * s, 0.24 * s, tone, mix(tone, pal.shade, 0.45));
    ctx.fill();
    contour(ctx, rig, 0.012);
    // Primary feathers: three splits at the trailing tip, which is what makes
    // a wing read as feathers rather than as a leaf.
    ctx.strokeStyle = hexA(pal.dark, 0.45);
    ctx.lineWidth = Math.max(0.6, s * 0.008);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(-0.01 * s, (-0.54 + i * 0.04) * s);
      ctx.lineTo(-0.22 * s, (-0.48 + i * 0.04) * s);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Legs and toes.
  for (const lx of [0.0, 0.10] as const) {
    appendage(ctx, rig, [[lx * s, -0.24 * s], [(lx + 0.01) * s, -0.02 * s]],
      () => s * 0.035, pal.dark, 0.007);
    ctx.strokeStyle = pal.dark;
    ctx.lineWidth = Math.max(0.7, s * 0.018);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const tx of [-0.07, 0.0, 0.07] as const) {
      ctx.moveTo((lx + 0.01) * s, -0.02 * s);
      ctx.lineTo((lx + 0.01 + tx) * s, 0);
    }
    ctx.stroke();
  }

  if (rig.moving) drawWing(beat * 0.8, mix(pal.back, pal.shade, 0.4));

  // Tail, fanned into three feathers.
  const tail = arcSpine([-0.14 * s, -0.46 * s], [-0.36 * s, -0.40 * s], [-0.58 * s, -0.31 * s], 5);
  appendage(ctx, rig, tail, (t) => s * (0.15 - 0.035 * t), mix(pal.base, FUR_LIGHT, 0.26));
  ctx.strokeStyle = hexA(pal.dark, 0.5);
  ctx.lineWidth = Math.max(0.5, s * 0.008);
  ctx.lineWidth = Math.max(0.6, s * 0.01);
  ctx.beginPath();
  ctx.moveTo(-0.18 * s, -0.442 * s); ctx.lineTo(-0.57 * s, -0.325 * s);
  ctx.moveTo(-0.18 * s, -0.478 * s); ctx.lineTo(-0.57 * s, -0.296 * s);
  ctx.stroke();

  const body: Pt[] = [
    [-0.24 * s, -0.44 * s], [-0.16 * s, -0.66 * s], [0.06 * s, -0.76 * s],
    [0.26 * s, -0.66 * s], [0.28 * s, -0.46 * s], [0.12 * s, -0.28 * s],
    [-0.12 * s, -0.30 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, 0.0, -0.52 * s, 0.32 * s, pal.base, pal.shade);
  ctx.fill();
  contour(ctx, rig);
  ctx.save();
  blob(ctx, body);
  ctx.clip();
  // Rust breast and cream belly — the colour block that names the species.
  const br = ctx.createLinearGradient(0.3 * s, -0.6 * s, -0.05 * s, -0.3 * s);
  br.addColorStop(0, hexA(pal.accent, 0.95));
  br.addColorStop(0.75, hexA(pal.accent, 0.25));
  br.addColorStop(1, hexA(pal.accent, 0));
  ctx.fillStyle = br;
  ctx.fillRect(-0.4 * s, -0.8 * s, 0.8 * s, 0.8 * s);
  const bg = ctx.createLinearGradient(0, -0.4 * s, 0, -0.26 * s);
  bg.addColorStop(0, hexA(pal.belly, 0));
  bg.addColorStop(1, hexA(pal.belly, 0.9));
  ctx.fillStyle = bg;
  ctx.fillRect(-0.4 * s, -0.42 * s, 0.8 * s, 0.42 * s);
  ctx.restore();

  drawWing(beat, pal.base);

  const head: Pt[] = [
    [0.10 * s, -0.82 * s], [0.24 * s, -0.94 * s], [0.40 * s, -0.88 * s],
    [0.44 * s, -0.76 * s], [0.32 * s, -0.66 * s], [0.14 * s, -0.70 * s],
  ];
  blob(ctx, head);
  ctx.fillStyle = furGrad(ctx, rig, 0.26 * s, -0.80 * s, 0.19 * s, pal.back, mix(pal.back, pal.shade, 0.5));
  ctx.fill();
  contour(ctx, rig);
  // A small crest, for character and for the top of the frame.
  ctx.beginPath();
  ctx.moveTo(0.22 * s, -0.93 * s);
  ctx.quadraticCurveTo(0.14 * s, -1.0 * s, 0.06 * s, -0.94 * s);
  ctx.quadraticCurveTo(0.14 * s, -0.90 * s, 0.22 * s, -0.93 * s);
  ctx.fillStyle = pal.back;
  ctx.fill();

  // Short conical beak with a visible gape line.
  ctx.beginPath();
  ctx.moveTo(0.40 * s, -0.84 * s);
  ctx.lineTo(0.60 * s, -0.795 * s);
  ctx.lineTo(0.40 * s, -0.75 * s);
  ctx.closePath();
  ctx.fillStyle = mix(pal.accent, "#f6cd7a", 0.45);
  ctx.fill();
  contour(ctx, rig, 0.009);
  ctx.strokeStyle = hexA(pal.dark, 0.6);
  ctx.lineWidth = Math.max(0.5, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(0.40 * s, -0.795 * s);
  ctx.lineTo(0.59 * s, -0.795 * s);
  ctx.stroke();

  eye(ctx, rig, 0.33 * s, -0.83 * s, s * 0.038);
}

/**
 * Hawk, soaring.
 *
 * Everything that says raptor is at the edges: splayed finger primaries at the
 * wingtips, a fanned banded tail, a hooked beak. The span is nearly three
 * times the height, so even as a dark shape against a bright sky it can never
 * be confused with the songbird's compact perched blob.
 */
function drawHawk(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const beat = rig.moving ? Math.sin(rig.m) * 0.2 : 0.05;

  const wing = (dir: number) => {
    ctx.save();
    ctx.translate(0, -0.70 * s);
    ctx.rotate(dir < 0 ? beat : -beat);
    ctx.scale(dir, 1);

    // Fingered primaries: splayed and swept back, never combed straight out.
    // Slotted wingtips are how a soaring bird bleeds the vortex off its wing,
    // and they are the instant giveaway that this is a raptor and not a duck.
    for (let i = 0; i < 5; i++) {
      const a = -0.34 + i * 0.26;
      appendage(ctx, rig,
        arcSpine([0.96 * s, -0.22 * s], [1.12 * s, (-0.22 + a * 0.32) * s],
          [1.24 * s, (-0.14 + a * 0.5) * s], 4),
        (t) => s * (0.085 - 0.04 * t), i % 2 ? pal.back : mix(pal.back, pal.dark, 0.3), 0.008);
    }

    // The wing itself, with a real chord: a buteo's wing is broad, and drawn
    // as a thin bar it turns into a glider rather than a bird.
    ctx.beginPath();
    ctx.moveTo(0.04 * s, -0.16 * s);
    ctx.quadraticCurveTo(0.5 * s, -0.30 * s, 1.02 * s, -0.27 * s);
    ctx.quadraticCurveTo(1.10 * s, -0.20 * s, 0.98 * s, -0.12 * s);
    // Scalloped trailing edge: each bump is one secondary feather.
    for (let i = 0; i < 5; i++) {
      const x0 = 0.98 - i * 0.19;
      ctx.quadraticCurveTo((x0 - 0.09) * s, (0.02 + i * 0.016) * s,
        (x0 - 0.19) * s, (-0.05 + i * 0.03) * s);
    }
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, -0.3 * s, 0, 0.1 * s);
    wg.addColorStop(0, mix(pal.base, FUR_LIGHT, 0.2));
    wg.addColorStop(0.5, pal.base);
    wg.addColorStop(1, pal.back);
    ctx.fillStyle = wg;
    ctx.fill();
    contour(ctx, rig, 0.011);

    // Covert bar across the wing — real hawks are patterned, not plain.
    ctx.strokeStyle = hexA(pal.belly, 0.42);
    ctx.lineWidth = Math.max(0.8, s * 0.022);
    ctx.beginPath();
    ctx.moveTo(0.14 * s, -0.16 * s);
    ctx.quadraticCurveTo(0.58 * s, -0.225 * s, 0.96 * s, -0.215 * s);
    ctx.stroke();
    ctx.restore();
  };
  wing(-1);
  wing(1);

  // Fanned tail with dark bars.
  ctx.beginPath();
  ctx.moveTo(-0.10 * s, -0.38 * s);
  ctx.lineTo(-0.25 * s, -0.02 * s);
  ctx.quadraticCurveTo(0, 0.02 * s, 0.25 * s, -0.02 * s);
  ctx.lineTo(0.10 * s, -0.38 * s);
  ctx.closePath();
  const tg = ctx.createLinearGradient(0, -0.38 * s, 0, 0);
  tg.addColorStop(0, mix(pal.base, "#c1502a", 0.4));
  tg.addColorStop(1, mix(pal.base, "#b8461f", 0.7));
  ctx.fillStyle = tg;
  ctx.fill();
  contour(ctx, rig, 0.011);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = hexA(pal.dark, 0.55);
  ctx.lineWidth = Math.max(0.7, s * 0.02);
  ctx.beginPath();
  ctx.moveTo(-0.3 * s, -0.06 * s); ctx.lineTo(0.3 * s, -0.06 * s);
  ctx.moveTo(-0.3 * s, -0.16 * s); ctx.lineTo(0.3 * s, -0.16 * s);
  ctx.stroke();
  ctx.strokeStyle = hexA(pal.dark, 0.3);
  ctx.lineWidth = Math.max(0.4, s * 0.007);
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(i * 0.03 * s, -0.36 * s);
    ctx.lineTo(i * 0.10 * s, 0);
  }
  ctx.stroke();
  ctx.restore();

  const body: Pt[] = [
    [0, -0.32 * s], [-0.12 * s, -0.42 * s], [-0.155 * s, -0.62 * s],
    [-0.10 * s, -0.80 * s], [0.10 * s, -0.80 * s], [0.155 * s, -0.62 * s],
    [0.12 * s, -0.42 * s],
  ];
  blob(ctx, body);
  ctx.fillStyle = furGrad(ctx, rig, 0, -0.6 * s, 0.2 * s, pal.belly, mix(pal.belly, pal.base, 0.55));
  ctx.fill();
  contour(ctx, rig);
  // Streaked belly: short dark dashes, the field mark on most buteos.
  if (rig.s > 26) {
    ctx.save();
    blob(ctx, body);
    ctx.clip();
    ctx.strokeStyle = hexA(pal.back, 0.5);
    ctx.lineWidth = Math.max(0.6, s * 0.012);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const yy = (-0.62 + i * 0.05) * s;
      const xx = (i % 2 ? -0.045 : 0.035) * s;
      ctx.moveTo(xx, yy - 0.018 * s);
      ctx.lineTo(xx, yy + 0.018 * s);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Talons, tucked up under the tail.
  for (const tx of [-0.06, 0.06] as const) {
    ctx.beginPath();
    ctx.arc(tx * s, -0.36 * s, Math.max(0.9, s * 0.035), 0, TAU);
    ctx.fillStyle = pal.accent;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0.01 * s, -0.87 * s, 0.115 * s, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, 0.01 * s, -0.87 * s, 0.115 * s, pal.back, mix(pal.back, pal.shade, 0.5));
  ctx.fill();
  contour(ctx, rig, 0.013);

  // The hooked bill. The hook is the point: a seed-eater's beak is a cone.
  ctx.beginPath();
  ctx.moveTo(0.08 * s, -0.91 * s);
  ctx.quadraticCurveTo(0.20 * s, -0.90 * s, 0.21 * s, -0.855 * s);
  ctx.quadraticCurveTo(0.20 * s, -0.815 * s, 0.16 * s, -0.825 * s);
  ctx.quadraticCurveTo(0.16 * s, -0.86 * s, 0.07 * s, -0.845 * s);
  ctx.closePath();
  ctx.fillStyle = mix(pal.dark, "#8d8f96", 0.45);
  ctx.fill();
  contour(ctx, rig, 0.008);
  ctx.beginPath();
  ctx.ellipse(0.085 * s, -0.885 * s, s * 0.032, s * 0.026, 0, 0, TAU);
  ctx.fillStyle = pal.accent;
  ctx.fill();
  eye(ctx, rig, 0.055 * s, -0.90 * s, s * 0.028);
}

/**
 * Fish.
 *
 * Countershaded on purpose: dark olive along the back so it disappears against
 * the bottom when seen from above, bright silver on the flank and white below
 * so it disappears against the surface when seen from beneath. Drawing a fish
 * one flat colour throws away the single most teachable thing about it.
 */
function drawFish(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  // The whole body flexes as one travelling wave — that is how a fish swims,
  // not by waggling a tail bolted to a rigid tube.
  const amp = rig.moving ? s * 0.035 : 0;
  const wave = (pts: readonly Pt[]) => flex(pts, amp, 2.6 / s, rig.m);

  // Caudal fin, forked and swung hardest because it is furthest down the wave.
  const tailSwing = rig.moving ? Math.sin(rig.m + 1.2) * s * 0.09 : 0;
  ctx.beginPath();
  // Two broad lobes and a deep notch between them. Drawn as one fan the tail
  // reads as a flag; the fork is what says this animal drives itself with it.
  ctx.moveTo(-0.42 * s, -0.56 * s);
  ctx.quadraticCurveTo(-0.64 * s, -0.74 * s, -0.92 * s, -0.88 * s + tailSwing);
  ctx.lineTo(-0.84 * s, -0.63 * s + tailSwing * 0.7);
  ctx.quadraticCurveTo(-0.64 * s, -0.55 * s, -0.54 * s, -0.51 * s);
  ctx.quadraticCurveTo(-0.64 * s, -0.47 * s, -0.84 * s, -0.39 * s + tailSwing * 0.7);
  ctx.lineTo(-0.92 * s, -0.14 * s + tailSwing);
  ctx.quadraticCurveTo(-0.64 * s, -0.28 * s, -0.42 * s, -0.46 * s);
  ctx.closePath();
  const cg = ctx.createLinearGradient(-0.4 * s, 0, -0.92 * s, 0);
  cg.addColorStop(0, hexA(mix(pal.back, pal.accent, 0.45), 0.98));
  cg.addColorStop(1, hexA(mix(pal.accent, "#d96c14", 0.5), 0.88));
  ctx.fillStyle = cg;
  ctx.fill();
  contour(ctx, rig, 0.009);
  // Fin rays. A fin is a membrane stretched over spines; without them it is
  // a paper triangle glued to the back of the animal. Clipped to the fin —
  // rays that run past their own membrane read as loose wire.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = hexA(mix(pal.back, "#000000", 0.25), 0.4);
  ctx.lineWidth = Math.max(0.5, s * 0.008);
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.225;
    ctx.moveTo(-0.42 * s, -0.51 * s);
    ctx.lineTo(-0.9 * s, (-0.51 + a * 0.42) * s + tailSwing * (i < 4 ? 1 : 0.4));
  }
  ctx.stroke();
  ctx.restore();

  // Spiny dorsal ridge.
  // Dorsal fin. Its base is set *inside* the back line, not balanced on top
  // of it, so it reads as growing out of the fish instead of resting on it.
  const dorsal = wave([
    [0.36 * s, -0.58 * s], [0.28 * s, -0.90 * s], [0.19 * s, -0.74 * s],
    [0.08 * s, -1.0 * s], [-0.03 * s, -0.76 * s], [-0.13 * s, -0.93 * s],
    [-0.24 * s, -0.56 * s],
  ]);
  ctx.beginPath();
  ctx.moveTo(dorsal[0][0], dorsal[0][1]);
  for (let i = 1; i < dorsal.length; i++) ctx.lineTo(dorsal[i][0], dorsal[i][1]);
  ctx.closePath();
  const dg2 = ctx.createLinearGradient(0, -s, 0, -0.66 * s);
  dg2.addColorStop(0, hexA(mix(pal.back, pal.accent, 0.3), 0.9));
  dg2.addColorStop(1, hexA(mix(pal.back, "#000000", 0.2), 0.95));
  ctx.fillStyle = dg2;
  ctx.fill();
  contour(ctx, rig, 0.009);

  // Deep through the shoulders, tapering to a narrow peduncle. Smoothed
  // through evenly spaced points the outline came out as a capsule, and a
  // capsule with fins on it is a submarine.
  const body = wave([
    [0.92 * s, -0.50 * s], [0.66 * s, -0.68 * s], [0.30 * s, -0.80 * s],
    [-0.04 * s, -0.77 * s], [-0.30 * s, -0.66 * s], [-0.43 * s, -0.55 * s],
    [-0.43 * s, -0.47 * s], [-0.26 * s, -0.34 * s], [0.10 * s, -0.24 * s],
    [0.52 * s, -0.31 * s],
  ]);
  blob(ctx, body);
  const fg = ctx.createLinearGradient(0, -0.84 * s, 0, -0.2 * s);
  fg.addColorStop(0, pal.back);
  fg.addColorStop(0.34, mix(pal.back, pal.base, 0.75));
  fg.addColorStop(0.58, mix(pal.base, "#ffffff", 0.3));
  fg.addColorStop(1, pal.belly);
  ctx.fillStyle = fg;
  ctx.fill();
  contour(ctx, rig);

  ctx.save();
  blob(ctx, body);
  ctx.clip();
  // Scales: nested arcs, only where they will actually resolve.
  if (rig.s > 64) {
    ctx.strokeStyle = hexA(pal.back, 0.12);
    ctx.lineWidth = Math.max(0.5, s * 0.006);
    for (let cx = -0.3; cx < 0.8; cx += 0.11) {
      for (let cy = -0.76; cy < -0.24; cy += 0.09) {
        ctx.beginPath();
        ctx.arc(cx * s, cy * s, s * 0.06, -0.9, 0.9);
        ctx.stroke();
      }
    }
  }
  // Lateral line — a real sense organ and a strong horizontal read.
  ctx.strokeStyle = hexA(pal.back, 0.4);
  ctx.lineWidth = Math.max(0.6, s * 0.011);
  ctx.beginPath();
  ctx.moveTo(0.78 * s, -0.52 * s);
  ctx.quadraticCurveTo(0.2 * s, -0.60 * s, -0.42 * s, -0.52 * s);
  ctx.stroke();
  // Gill cover.
  // Gill cover — the plate the head ends at, and the line that stops the
  // front of the fish reading as a nose cone.
  ctx.strokeStyle = hexA(pal.back, 0.5);
  ctx.lineWidth = Math.max(0.7, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(0.66 * s, -0.68 * s);
  ctx.quadraticCurveTo(0.54 * s, -0.50 * s, 0.62 * s, -0.28 * s);
  ctx.stroke();
  ctx.restore();

  // Pectoral fin, translucent, angled down and back.
  ctx.beginPath();
  ctx.moveTo(0.50 * s, -0.54 * s);
  ctx.quadraticCurveTo(0.42 * s, -0.24 * s, 0.14 * s, -0.18 * s);
  ctx.quadraticCurveTo(0.34 * s, -0.36 * s, 0.40 * s, -0.56 * s);
  ctx.closePath();
  ctx.fillStyle = hexA(mix(pal.accent, "#ffd9a0", 0.3), 0.55);
  ctx.fill();
  ctx.strokeStyle = hexA(pal.back, 0.32);
  ctx.lineWidth = Math.max(0.4, s * 0.006);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(0.48 * s, -0.54 * s);
    ctx.lineTo((0.16 + i * 0.06) * s, (-0.19 - i * 0.05) * s);
  }
  ctx.stroke();
  // Anal fin.
  ctx.beginPath();
  ctx.moveTo(-0.06 * s, -0.26 * s);
  ctx.lineTo(-0.20 * s, -0.10 * s);
  ctx.lineTo(-0.26 * s, -0.28 * s);
  ctx.closePath();
  ctx.fillStyle = hexA(pal.accent, 0.7);
  ctx.fill();

  eye(ctx, rig, 0.76 * s, -0.58 * s, s * 0.055);
  ctx.beginPath();
  ctx.arc(0.76 * s, -0.58 * s, Math.max(1.2, s * 0.075), 0, TAU);
  ctx.strokeStyle = hexA(pal.eye, 0.9);
  ctx.lineWidth = Math.max(0.8, s * 0.022);
  ctx.stroke();
  ctx.strokeStyle = hexA(pal.back, 0.7);
  ctx.lineWidth = Math.max(0.6, s * 0.012);
  ctx.beginPath();
  ctx.moveTo(0.91 * s, -0.47 * s);
  ctx.quadraticCurveTo(0.84 * s, -0.42 * s, 0.77 * s, -0.43 * s);
  ctx.stroke();
}

/**
 * Beetle, seen from above.
 *
 * The overhead view is the one a student meets in a bug hunt, and it is the
 * only one that shows the three-part body and six legs the identification
 * actually depends on. The legs move in an alternating tripod — front and back
 * on one side with the middle leg of the other — which is how every insect
 * stays balanced while walking.
 */
function drawInsect(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const axis = -0.5 * s;
  const gait = (i: number) => (rig.moving ? Math.sin(rig.m + (i % 2 ? Math.PI : 0)) * s * 0.06 : 0);

  const legAt = (hip: Pt, joint: Pt, foot: Pt, i: number) => {
    const f: Pt = [foot[0] + gait(i), foot[1]];
    leg(ctx, rig, hip, joint, f, s * 0.062, s * 0.028, mix(pal.dark, pal.base, 0.3));
  };
  const legs: readonly (readonly [Pt, Pt, Pt])[] = [
    [[0.30 * s, -0.58 * s], [0.44 * s, -0.78 * s], [0.36 * s, -0.98 * s]],
    [[0.14 * s, -0.60 * s], [0.20 * s, -0.82 * s], [0.06 * s, -0.96 * s]],
    [[0.0, -0.60 * s], [-0.08 * s, -0.80 * s], [-0.24 * s, -0.92 * s]],
  ];
  legs.forEach((l, i) => legAt(l[0], l[1], l[2], i));
  legs.forEach((l, i) => {
    const m = mirrorY(l, axis);
    legAt(m[0], m[1], m[2], i + 1);
  });

  // Antennae, elbowed forward — a beetle's, not a moth's feathers.
  for (const side of [-1, 1] as const) {
    appendage(ctx, rig,
      arcSpine([0.54 * s, axis + side * 0.06 * s], [0.70 * s, axis + side * 0.20 * s],
        [0.88 * s, axis + side * 0.24 * s], 5),
      (t) => s * (0.035 - 0.012 * t), pal.dark, 0.007);
  }

  // Elytra: the hardened wing cases, with the seam that splits them.
  // Wide at the shoulders and drawn back to a rounded point. Made long and
  // even instead, the wing cases read as a watermelon with legs.
  const elytra: Pt[] = [
    [0.20 * s, -0.30 * s], [-0.10 * s, -0.16 * s], [-0.40 * s, -0.28 * s],
    [-0.56 * s, -0.50 * s], [-0.40 * s, -0.72 * s], [-0.10 * s, -0.84 * s],
    [0.20 * s, -0.70 * s], [0.27 * s, -0.50 * s],
  ];
  blob(ctx, elytra);
  const eg = ctx.createLinearGradient(0, -0.82 * s, 0, -0.18 * s);
  eg.addColorStop(0, mix(pal.base, FUR_LIGHT, 0.3));
  eg.addColorStop(0.35, pal.base);
  eg.addColorStop(0.75, pal.back);
  eg.addColorStop(1, mix(pal.base, pal.accent, 0.35));
  ctx.fillStyle = eg;
  ctx.fill();
  contour(ctx, rig, 0.014);
  ctx.save();
  blob(ctx, elytra);
  ctx.clip();
  // Structural colour: beetles are iridescent, so the highlight shifts hue
  // rather than just going pale.
  const ig = ctx.createRadialGradient(-0.06 * s, -0.70 * s, 0, -0.06 * s, -0.64 * s, 0.34 * s);
  ig.addColorStop(0, hexA(pal.light, 0.36));
  ig.addColorStop(1, hexA(pal.light, 0));
  ctx.fillStyle = ig;
  ctx.fillRect(-0.7 * s, -0.9 * s, s, 0.8 * s);
  ctx.strokeStyle = hexA(pal.dark, 0.7);
  ctx.lineWidth = Math.max(0.8, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(0.3 * s, axis); ctx.lineTo(-0.64 * s, axis);
  ctx.stroke();
  // Striae: shallow grooves, kept faint. Drawn as bold stripes they turn the
  // elytra into a melon rind instead of a hard shell.
  ctx.strokeStyle = hexA(pal.dark, 0.16);
  ctx.lineWidth = Math.max(0.4, s * 0.006);
  ctx.beginPath();
  for (const off of [-0.2, -0.11, 0.11, 0.2] as const) {
    ctx.moveTo(0.22 * s, axis + off * s);
    ctx.lineTo(-0.5 * s, axis + off * s * 0.62);
  }
  ctx.stroke();
  // A short lit notch at each shoulder, where the wing cases meet the thorax.
  // Run all the way across, this highlight became a seam and split the shell
  // into two coloured halves like a melon.
  ctx.strokeStyle = hexA(pal.light, 0.3);
  ctx.lineWidth = Math.max(0.8, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(0.2 * s, axis - 0.27 * s);
  ctx.quadraticCurveTo(0.14 * s, axis - 0.32 * s, 0.04 * s, axis - 0.33 * s);
  ctx.stroke();
  ctx.restore();

  // Pronotum — the plate between head and wing cases.
  ctx.beginPath();
  ctx.moveTo(0.16 * s, -0.32 * s);
  ctx.quadraticCurveTo(0.36 * s, -0.36 * s, 0.38 * s, -0.5 * s);
  ctx.quadraticCurveTo(0.36 * s, -0.64 * s, 0.16 * s, -0.68 * s);
  ctx.quadraticCurveTo(0.24 * s, -0.5 * s, 0.16 * s, -0.32 * s);
  ctx.closePath();
  ctx.fillStyle = furGrad(ctx, rig, 0.26 * s, -0.5 * s, 0.2 * s, pal.back, mix(pal.back, "#000000", 0.3));
  ctx.fill();
  contour(ctx, rig, 0.012);

  ctx.beginPath();
  ctx.arc(0.47 * s, axis, 0.13 * s, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, 0.47 * s, axis, 0.13 * s, pal.back, pal.dark);
  ctx.fill();
  contour(ctx, rig, 0.011);
  // Mandibles.
  for (const side of [-1, 1] as const) {
    appendage(ctx, rig,
      arcSpine([0.56 * s, axis + side * 0.07 * s], [0.64 * s, axis + side * 0.09 * s],
        [0.66 * s, axis + side * 0.02 * s], 4),
      (t) => s * (0.04 - 0.026 * t), pal.dark, 0.007);
  }
}

/**
 * Butterfly.
 *
 * Four wings, not two: a big rounded forewing and a smaller hindwing on each
 * side, which is what separates a butterfly's outline from a moth's or a
 * bee's. The dark veins and margin are drawn because a plain orange lozenge is
 * a leaf, and clubbed antennae because that single detail is the textbook
 * butterfly-versus-moth test.
 */
function drawButterfly(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const axis = -0.5 * s;
  // In a flat view a wingbeat can only be shown as foreshortening: the wings
  // squash toward the body axis as they swing through the vertical.
  // The floor of 0.5 is a lie about the physics and the right call about the
  // picture: real wings do pass edge-on, but a butterfly caught at that instant
  // is an orange stick, and half the frames of an animation would be unreadable.
  const squash = rig.moving ? 0.5 + 0.5 * Math.abs(Math.cos(rig.m)) : 1;

  const forewing: Pt[] = [
    [0.16 * s, -0.52 * s], [0.40 * s, -0.72 * s], [0.42 * s, -0.94 * s],
    [0.16 * s, -1.0 * s], [-0.10 * s, -0.86 * s], [-0.02 * s, -0.57 * s],
  ];
  const hindwing: Pt[] = [
    [0.04 * s, -0.54 * s], [-0.12 * s, -0.68 * s], [-0.30 * s, -0.82 * s],
    [-0.44 * s, -0.71 * s], [-0.36 * s, -0.58 * s], [-0.14 * s, -0.51 * s],
  ];

  const paint = (pts: readonly Pt[], tone: string, deep: string) => {
    const shape = fold(pts, axis, squash);
    blob(ctx, shape);
    const g = ctx.createLinearGradient(0.3 * s, axis, -0.3 * s, axis - 0.4 * s * squash);
    g.addColorStop(0, mix(tone, FUR_LIGHT, 0.25));
    g.addColorStop(0.6, tone);
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    blob(ctx, shape);
    ctx.clip();
    // Veins radiate from the wing root; the dark margin rings the edge.
    ctx.strokeStyle = hexA(pal.accent, 0.5);
    ctx.lineWidth = Math.max(0.5, s * 0.008);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(0.06 * s, axis + (pts[0][1] - axis) * squash * 0.4);
      const p = pts[(i + 1) % pts.length];
      ctx.lineTo(p[0] * 1.15, axis + (p[1] - axis) * squash * 1.15);
    }
    ctx.stroke();
    ctx.restore();
    // The dark margin is a line, not a border. At s * 0.035 it swallowed the
    // wing whole and the animal came out as a black cross with orange leaking
    // through — the exact failure this file exists to stop.
    blob(ctx, shape);
    ctx.strokeStyle = hexA(pal.accent, 0.85);
    ctx.lineWidth = Math.max(0.9, s * 0.016);
    ctx.lineJoin = "round";
    ctx.stroke();
    // Spots on the margin, the last thing to survive shrinking.
    if (rig.s > 22) {
      ctx.fillStyle = hexA(pal.light, 0.9);
      for (let i = 1; i < 5; i++) {
        const p = shape[i];
        ctx.beginPath();
        ctx.arc(p[0] * 0.97, axis + (p[1] - axis) * 0.97, Math.max(0.7, s * 0.022), 0, TAU);
        ctx.fill();
      }
    }
  };

  // Far side first, a shade deeper, then the near side in full colour.
  paint(mirrorY(hindwing, axis), mix(pal.base, pal.back, 0.32), pal.back);
  paint(hindwing, mix(pal.base, pal.back, 0.18), pal.back);
  paint(mirrorY(forewing, axis), mix(pal.base, pal.back, 0.16), pal.back);
  paint(forewing, mix(pal.base, "#ffb347", 0.18), pal.back);

  // Body: narrow, segmented, distinctly not a wing.
  appendage(ctx, rig, [[0.34 * s, axis], [0.12 * s, axis], [-0.14 * s, axis], [-0.36 * s, axis]],
    (t) => s * (0.085 - 0.045 * t), pal.accent, 0.008);
  if (rig.s > 26) {
    ctx.strokeStyle = hexA(pal.belly, 0.5);
    ctx.lineWidth = Math.max(0.5, s * 0.007);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const bx = (0.1 - i * 0.09) * s;
      ctx.moveTo(bx, axis - 0.032 * s);
      ctx.lineTo(bx, axis + 0.032 * s);
    }
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0.36 * s, axis, 0.055 * s, 0, TAU);
  ctx.fillStyle = pal.accent;
  ctx.fill();

  // Clubbed antennae — the butterfly/moth test in one stroke each.
  for (const side of [-1, 1] as const) {
    const tip: Pt = [0.64 * s, axis + side * 0.20 * s];
    appendage(ctx, rig,
      arcSpine([0.40 * s, axis + side * 0.03 * s], [0.54 * s, axis + side * 0.08 * s], tip, 5),
      () => s * 0.022, pal.accent, 0.006);
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], Math.max(0.9, s * 0.035), 0, TAU);
    ctx.fillStyle = pal.accent;
    ctx.fill();
  }
}

/**
 * Bee.
 *
 * Banded abdomen, a furry thorax, two wings held out on one side, and a loaded
 * pollen basket on the hind leg. The bands have to be perpendicular to the
 * body's long axis or the animal reads as a wasp-coloured blob; the fur has to
 * be visible or it reads as a hoverfly.
 */
function drawBee(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const beat = rig.moving ? Math.sin(rig.m * 3) : 0;

  // Wings: fast enough in life to blur, so several ghosted copies read truer
  // than one crisp outline.
  for (let g = 0; g < 3; g++) {
    const a = (beat * 0.5 + (g - 1) * 0.13) * (rig.moving ? 1 : 0.25);
    ctx.save();
    ctx.translate(0.10 * s, -0.60 * s);
    ctx.rotate(a);
    for (const [lx, ly] of [[-0.34, -0.36], [-0.22, -0.24]] as const) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(lx * 0.5 * s, (ly - 0.1) * s, lx * s, ly * s);
      ctx.quadraticCurveTo(lx * 0.55 * s, (ly + 0.12) * s, 0, 0.02 * s);
      ctx.closePath();
      ctx.fillStyle = hexA("#dcecf6", g === 1 ? 0.5 : 0.22);
      ctx.fill();
      ctx.strokeStyle = hexA("#8fb4c9", g === 1 ? 0.5 : 0.18);
      ctx.lineWidth = Math.max(0.5, s * 0.008);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const [hx, jx, fx, basket] of [
    [0.30, 0.36, 0.34, false], [0.14, 0.14, 0.10, false], [-0.02, -0.10, -0.14, true],
  ] as const) {
    leg(ctx, rig, [hx * s, -0.36 * s], [jx * s, -0.18 * s], [fx * s, -0.02 * s],
      s * 0.045, s * 0.026, pal.dark);
    if (basket) {
      ctx.beginPath();
      ctx.ellipse((fx + 0.03) * s, -0.12 * s, s * 0.055, s * 0.075, 0.3, 0, TAU);
      ctx.fillStyle = mix(pal.base, "#f6e08a", 0.5);
      ctx.fill();
      contour(ctx, rig, 0.008);
    }
  }

  // Abdomen, tapering to a sting.
  const abdomen: Pt[] = [
    [0.02 * s, -0.24 * s], [-0.24 * s, -0.20 * s], [-0.48 * s, -0.30 * s],
    [-0.58 * s, -0.42 * s], [-0.46 * s, -0.56 * s], [-0.20 * s, -0.62 * s],
    [0.04 * s, -0.58 * s],
  ];
  blob(ctx, abdomen);
  ctx.fillStyle = furGrad(ctx, rig, -0.22 * s, -0.42 * s, 0.3 * s, pal.base, mix(pal.base, pal.dark, 0.45));
  ctx.fill();
  contour(ctx, rig, 0.013);
  ctx.save();
  blob(ctx, abdomen);
  ctx.clip();
  ctx.fillStyle = hexA(pal.accent, 0.95);
  for (let i = 0; i < 3; i++) {
    const bx = (-0.10 - i * 0.16) * s;
    ctx.save();
    ctx.translate(bx, -0.41 * s);
    ctx.rotate(0.12);
    ctx.fillRect(-0.05 * s, -0.24 * s, 0.075 * s, 0.48 * s);
    ctx.restore();
  }
  ctx.restore();
  appendage(ctx, rig, [[-0.54 * s, -0.40 * s], [-0.66 * s, -0.38 * s]],
    (t) => s * (0.05 - 0.04 * t), pal.accent, 0.006);

  // Thorax, deliberately fuzzy.
  ctx.beginPath();
  ctx.arc(0.14 * s, -0.46 * s, 0.20 * s, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, 0.14 * s, -0.46 * s, 0.20 * s,
    mix(pal.base, "#c9944a", 0.4), mix(pal.dark, pal.base, 0.3));
  ctx.fill();
  contour(ctx, rig, 0.012);
  ctx.strokeStyle = hexA(mix(pal.belly, "#ffffff", 0.4), 0.65);
  ctx.lineWidth = Math.max(0.5, s * 0.009);
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    ctx.moveTo(0.14 * s + Math.cos(a) * 0.18 * s, -0.46 * s + Math.sin(a) * 0.18 * s);
    ctx.lineTo(0.14 * s + Math.cos(a) * 0.26 * s, -0.46 * s + Math.sin(a) * 0.26 * s);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0.40 * s, -0.50 * s, 0.135 * s, 0, TAU);
  ctx.fillStyle = furGrad(ctx, rig, 0.40 * s, -0.50 * s, 0.135 * s, pal.dark, "#0a0704");
  ctx.fill();
  contour(ctx, rig, 0.011);
  // Compound eye: a big lozenge wrapping the side of the head.
  ctx.beginPath();
  ctx.ellipse(0.45 * s, -0.53 * s, s * 0.05, s * 0.075, -0.3, 0, TAU);
  ctx.fillStyle = mix(pal.dark, "#4a3a24", 0.7);
  ctx.fill();
  for (const side of [-1, 1] as const) {
    appendage(ctx, rig,
      arcSpine([0.46 * s, (-0.55 + side * 0.02) * s], [0.58 * s, (-0.60 + side * 0.06) * s],
        [0.66 * s, (-0.54 + side * 0.12) * s], 4),
      () => s * 0.02, pal.dark, 0.006);
  }
  appendage(ctx, rig, [[0.46 * s, -0.44 * s], [0.56 * s, -0.34 * s]],
    (t) => s * (0.028 - 0.018 * t), mix(pal.dark, pal.base, 0.4), 0.006);
}

/**
 * Earthworm, rearing out of the soil.
 *
 * A worm drawn flat on the ground is a line. Rearing the front third gives it
 * height, shows the segmentation from the side, and matches what a student
 * actually sees when one comes up after rain. The pale swollen band a third of
 * the way along is the clitellum, the organ the worm reproduces with — it is
 * the feature every field key asks you to find, so it is drawn.
 */
function drawWorm(ctx: CanvasRenderingContext2D, rig: Rig) {
  const { s, pal } = rig;
  const spine = flex([
    [-0.92 * s, -0.05 * s], [-0.62 * s, -0.12 * s], [-0.32 * s, -0.09 * s],
    [-0.02 * s, -0.20 * s], [0.24 * s, -0.44 * s], [0.42 * s, -0.72 * s],
    [0.50 * s, -0.93 * s],
  ], rig.moving ? s * 0.02 : 0, 4 / s, rig.m);

  // Both ends taper: an earthworm has no square end anywhere on it, and a
  // flat cap is the fastest way to make a body read as a length of hose.
  const width = (t: number) => s * (0.018 + 0.105 * Math.sin(Math.min(1, t * 1.08) * Math.PI * 0.98));
  taper(ctx, spine, width);
  const g = ctx.createLinearGradient(-0.9 * s, 0, 0.5 * s, -0.9 * s);
  g.addColorStop(0, pal.back);
  g.addColorStop(0.45, pal.base);
  g.addColorStop(1, mix(pal.base, FUR_LIGHT, 0.25));
  ctx.fillStyle = g;
  ctx.fill();
  contour(ctx, rig, 0.012);

  ctx.save();
  taper(ctx, spine, width);
  ctx.clip();
  // Segments. A peristaltic wave bunches them where the body is contracting,
  // which is literally the mechanism the animal moves by.
  ctx.strokeStyle = hexA(pal.dark, 0.35);
  ctx.lineWidth = Math.max(0.5, s * 0.009);
  ctx.beginPath();
  for (let i = 1; i < 22; i++) {
    const t = i / 22;
    const bunch = rig.moving ? Math.sin(rig.m - t * 8) * 0.018 : 0;
    const p = pointOn(spine, t + bunch);
    const n = normalOn(spine, t + bunch);
    const w = width(t + bunch) * 0.55;
    ctx.moveTo(p[0] - n[0] * w, p[1] - n[1] * w);
    ctx.lineTo(p[0] + n[0] * w, p[1] + n[1] * w);
  }
  ctx.stroke();
  // Clitellum.
  const c0 = pointOn(spine, 0.6);
  const c1 = pointOn(spine, 0.74);
  const cg = ctx.createLinearGradient(c0[0], c0[1], c1[0], c1[1]);
  cg.addColorStop(0, hexA(pal.accent, 0));
  cg.addColorStop(0.5, hexA(mix(pal.accent, FUR_LIGHT, 0.4), 0.95));
  cg.addColorStop(1, hexA(pal.accent, 0));
  ctx.fillStyle = cg;
  ctx.fillRect(-s, -s, 2 * s, 2 * s);
  // Wet sheen along the upper flank.
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = Math.max(0.6, s * 0.014);
  curve(ctx, spine.map((p): Pt => [p[0] - s * 0.012, p[1] - s * 0.026]));
  ctx.stroke();
  ctx.restore();

  // Rounded prostomium — the fleshy lobe over the mouth at the leading end.
  const headEnd = spine[spine.length - 1];
  ctx.beginPath();
  ctx.arc(headEnd[0], headEnd[1], Math.max(1, s * 0.055), 0, TAU);
  ctx.fillStyle = mix(pal.base, FUR_LIGHT, 0.2);
  ctx.fill();
  contour(ctx, rig, 0.01);

  // Soil pushed up around the end it came out of, drawn at the tail's real
  // position rather than at a guessed one, so it never floats free of it.
  const tailEnd = spine[0];
  ctx.beginPath();
  ctx.ellipse(tailEnd[0] + s * 0.03, tailEnd[1] + s * 0.02, 0.1 * s, 0.035 * s, 0, 0, TAU);
  ctx.fillStyle = hexA(rig.dark ? "#3a2a1c" : "#6b4b30", 0.55);
  ctx.fill();
}

/** Position a fraction of the way along a polyline. */
function pointOn(pts: readonly Pt[], t: number): Pt {
  const u = Math.max(0, Math.min(0.999, t)) * (pts.length - 1);
  const i = Math.floor(u);
  const f = u - i;
  const a = pts[i];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

/** Unit normal at that fraction, for laying rings across a tube. */
function normalOn(pts: readonly Pt[], t: number): Pt {
  const u = Math.max(0, Math.min(0.999, t)) * (pts.length - 1);
  const i = Math.floor(u);
  const a = pts[i];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}

/* ------------------------------------------------------------------ *
 * Plants
 *
 * The producers are not scenery. In every one of these topics they are the
 * bottom of the food web and the thing the whole population dynamic is
 * limited by, so they get drawn as carefully as the animals eating them —
 * which above all means a tree with branches instead of a green triangle on a
 * brown stick, and grass as a tuft with a base and a spread rather than a
 * scatter of single hairlines.
 * ------------------------------------------------------------------ */

export interface PlantOpts {
  /** 0 dead and brown, 1 lush. Drives colour, droop and leaf density. */
  health?: number;
  /** Shifts the canopy: fresh green, deep green, amber, or bare. */
  season?: Season;
  /** Per-instance variation. The same seed always draws the same plant. */
  seed?: number;
  /** 0-1 phase of a wind or current sway. */
  sway?: number;
  haze?: number;
  hazeColor?: string;
}

interface Flora {
  hi: string; leaf: string; deep: string;
  bark: string; barkDark: string;
  bloom: string; soil: string;
  bare: boolean;
}

function flora(
  season: Season, health: number, dark: boolean, haze: number, hazeColor: string,
): Flora {
  const table: Record<Season, [string, string, string, string]> = {
    spring: ["#b6e276", "#6fbb42", "#2f6f2a", "#f4b8d2"],
    summer: ["#84c95a", "#3f9440", "#1c5324", "#ead04a"],
    autumn: ["#f4bd46", "#d97f22", "#8c4114", "#c9432a"],
    winter: ["#9aa792", "#67765f", "#33402f", "#eef4f8"],
  };
  const [hi0, leaf0, deep0, bloom0] = table[season];
  const h = clamp01(health);
  // Wilting is a loss of chlorophyll before it is a loss of shape: the green
  // drains toward straw first, and only then toward dead brown.
  const wilt = (c: string) => mix(mix(c, "#c2a552", (1 - h) * 0.7), "#6b5432", (1 - h) * (1 - h) * 0.6);
  const air = (c: string) => (haze > 0.001 ? mix(c, hazeColor, haze * 0.82) : c);
  return {
    hi: air(wilt(hi0)),
    leaf: air(wilt(leaf0)),
    deep: air(wilt(deep0)),
    bark: air(dark ? "#6b4a32" : "#755134"),
    barkDark: air("#3a2617"),
    bloom: air(bloom0),
    soil: air(dark ? "#3a2a1c" : "#6b4b30"),
    bare: season === "winter",
  };
}

/** A ring of points with a jittered radius — a leaf mass, never a circle. */
function lobed(cx: number, cy: number, rx: number, ry: number, n: number, seed: number, rough: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 - rough + rough * 2 * rand(i, seed);
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}

/**
 * Draw a plant standing on the ground at `x, groundY`, `size` tall.
 */
export function plant(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, size: number,
  which: PlantKind, theme: ThemeColors,
  opts: PlantOpts = {},
) {
  const s = Math.max(3, size);
  const dark = isDarkTheme(theme);
  const fl = flora(
    opts.season ?? "summer", opts.health ?? 1, dark,
    clamp01(opts.haze ?? 0), opts.hazeColor ?? atmosphereColor(theme),
  );
  const seed = Math.floor(opts.seed ?? 1) || 1;
  const health = clamp01(opts.health ?? 1);
  const sway = (opts.sway ?? 0) * TAU;
  ctx.save();
  ctx.translate(x, groundY);
  PLANTS[which](ctx, s, fl, seed, health, sway, dark);
  ctx.restore();
}

type PlantFn = (
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) => void;

const PLANTS: Record<PlantKind, PlantFn> = {
  grass: drawGrass, shrub: drawShrub, tree: drawTree, conifer: drawConifer,
  flower: drawFlower, seedling: drawSeedling, kelp: drawKelp,
};

/**
 * A tuft, not a hairline.
 *
 * Grass grows in clumps from a crown, so it is drawn as a fan of tapered
 * blades sharing one base, with the back blades darker and the front ones lit.
 * The old sims drew one-pixel strokes, and a field of those reads as static on
 * a television — the eye gets no surface to sit on and no sense of how much
 * biomass is actually there, which is the quantity the whole simulation turns on.
 */
function drawGrass(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  const n = 9 + Math.round(rand(seed, 11) * 5);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.09, 0, 0, TAU);
  ctx.fillStyle = hexA(fl.deep, dark ? 0.4 : 0.28);
  ctx.fill();

  type Blade = { a: number; len: number; back: boolean; i: number };
  const blades: Blade[] = [];
  for (let i = 0; i < n; i++) {
    const r = rand(i, seed);
    blades.push({
      a: (r - 0.5) * 1.7,
      len: s * (0.5 + 0.5 * rand(i, seed + 31)),
      back: i % 2 === 0,
      i,
    });
  }
  blades.sort((p, q) => (p.back === q.back ? 0 : p.back ? -1 : 1));

  for (const b of blades) {
    const droop = 0.45 + (1 - health) * 0.85;
    const wind = Math.sin(sway + b.i * 0.9) * 0.16;
    const tipX = Math.sin(b.a + wind) * b.len * droop;
    const tipY = -b.len * (1 - Math.abs(b.a) * 0.18) * (0.75 + health * 0.25);
    const spine = arcSpine(
      [b.a * s * 0.12, 0],
      [Math.sin(b.a) * b.len * 0.25, tipY * 0.62],
      [tipX, tipY], 6,
    );
    taper(ctx, spine, (t) => Math.max(0.7, s * (0.085 - 0.078 * t) * (b.back ? 0.85 : 1)));
    const g = ctx.createLinearGradient(0, 0, tipX * 0.5, tipY);
    g.addColorStop(0, b.back ? fl.deep : mix(fl.deep, fl.leaf, 0.6));
    g.addColorStop(1, b.back ? mix(fl.leaf, fl.deep, 0.45) : mix(fl.leaf, fl.hi, 0.55));
    ctx.fillStyle = g;
    ctx.fill();
    // A lit edge along one side of each blade: a leaf is a folded surface, and
    // that fold is why a real tuft glitters instead of reading as felt.
    if (s > 14 && !b.back) {
      ctx.strokeStyle = hexA(fl.hi, 0.45);
      ctx.lineWidth = Math.max(0.5, s * 0.012);
      curve(ctx, spine);
      ctx.stroke();
    }
    // Seed heads on the longest healthy blades.
    if (health > 0.55 && b.len > s * 0.86 && rand(b.i, seed + 7) > 0.6) {
      ctx.beginPath();
      ctx.ellipse(tipX, tipY, s * 0.035, s * 0.1, Math.atan2(tipX, -tipY), 0, TAU);
      ctx.fillStyle = hexA(mix(fl.hi, "#e8d489", 0.5), 0.9);
      ctx.fill();
    }
  }
}

/** A woody mound: bare stems inside a cluster of lit leaf masses. */
function drawShrub(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.1, 0, 0, TAU);
  ctx.fillStyle = hexA("#000000", dark ? 0.3 : 0.2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const a = -1.57 + (rand(i, seed) - 0.5) * 1.3;
    taper(ctx, arcSpine([0, 0], [Math.cos(a) * s * 0.16, -s * 0.3], [Math.cos(a) * s * 0.4, -s * 0.6], 5),
      (t) => Math.max(0.8, s * (0.05 - 0.032 * t)));
    ctx.fillStyle = i % 2 ? fl.bark : fl.barkDark;
    ctx.fill();
  }

  const clusters = 7;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < clusters; i++) {
      const back = i % 2 === 0;
      if ((pass === 0) !== back) continue;
      const a = Math.PI + (i / (clusters - 1)) * Math.PI;
      const cx = Math.cos(a) * s * 0.36;
      const cy = -s * (0.45 + Math.sin(a) * -0.28) + (back ? -s * 0.06 : 0);
      const r = s * (0.2 + 0.09 * rand(i, seed + 3));
      const pts = lobed(cx + Math.sin(sway + i) * s * 0.012, cy, r, r * 0.8, 9, seed + i * 5, 0.22);
      blob(ctx, pts);
      const g = ctx.createRadialGradient(cx + KEY.x * r, cy + KEY.y * r, r * 0.08, cx, cy, r * 1.15);
      g.addColorStop(0, back ? fl.leaf : fl.hi);
      g.addColorStop(0.55, back ? mix(fl.leaf, fl.deep, 0.45) : fl.leaf);
      g.addColorStop(1, fl.deep);
      ctx.fillStyle = g;
      ctx.fill();
      if (health > 0.6 && !back && rand(i, seed + 19) > 0.45) {
        for (let b = 0; b < 3; b++) {
          ctx.beginPath();
          ctx.arc(cx + (rand(b, seed + i) - 0.5) * r, cy + (rand(b, seed + i + 9) - 0.5) * r,
            Math.max(0.8, s * 0.022), 0, TAU);
          ctx.fillStyle = fl.bloom;
          ctx.fill();
        }
      }
    }
  }
}

/**
 * A broadleaf tree.
 *
 * The trunk really branches — recursively, with each fork thinner and shorter
 * than its parent — because that branching *is* the tree's strategy for
 * holding a canopy up in the light, and a green triangle on a stick hides it.
 * The canopy is six to nine overlapping masses rather than one, so light can
 * pick out the top of each and the crown gains depth instead of reading as a
 * cut-out.
 */
function drawTree(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  const tips: Pt[] = [];
  const trunkTop = -s * 0.42;

  // The pool of shade a tree throws is part of what a tree *is* in these
  // topics — it is why nothing grows under one — so it is drawn, not implied.
  ctx.beginPath();
  ctx.ellipse(s * 0.08, 0, s * 0.5, s * 0.11, 0, 0, TAU);
  ctx.fillStyle = hexA("#000000", dark ? 0.34 : 0.22);
  ctx.fill();

  const grow = (p: Pt, angle: number, len: number, w: number, depth: number, id: number) => {
    const drift = Math.sin(sway + depth) * len * 0.05;
    const end: Pt = [p[0] + Math.cos(angle) * len + drift, p[1] + Math.sin(angle) * len];
    const ctrl: Pt = [
      p[0] + Math.cos(angle - 0.2) * len * 0.55,
      p[1] + Math.sin(angle - 0.2) * len * 0.55,
    ];
    const spine = arcSpine(p, ctrl, end, 5);
    taper(ctx, spine, (t) => Math.max(0.8, w * (1 - 0.45 * t)));
    const g = ctx.createLinearGradient(p[0] - w, 0, p[0] + w, 0);
    g.addColorStop(0, mix(fl.bark, "#e8cba6", 0.35));
    g.addColorStop(0.45, fl.bark);
    g.addColorStop(1, fl.barkDark);
    ctx.fillStyle = g;
    ctx.fill();
    if (depth >= 3 || len < s * 0.06) { tips.push(end); return; }
    const spread = 0.5 + rand(id, seed) * 0.35;
    grow(end, angle - spread, len * (0.62 + rand(id, seed + 2) * 0.14), w * 0.62, depth + 1, id * 2 + 1);
    grow(end, angle + spread * (0.7 + rand(id, seed + 5) * 0.6),
      len * (0.6 + rand(id, seed + 8) * 0.16), w * 0.6, depth + 1, id * 2 + 2);
    if (depth === 0) {
      grow(end, angle + (rand(id, seed + 12) - 0.5) * 0.4, len * 0.72, w * 0.55, depth + 1, id * 2 + 3);
    }
  };

  // Back half of the canopy, painted before the trunk so branches read as
  // passing in front of foliage — the cheapest honest depth cue there is.
  const canopyY = -s * 0.72;
  if (!fl.bare) {
    for (let i = 0; i < 4; i++) {
      const cx = (rand(i, seed + 41) - 0.5) * s * 0.62;
      const cy = canopyY + (rand(i, seed + 43) - 0.5) * s * 0.16;
      const r = s * (0.2 + 0.07 * rand(i, seed + 47));
      blob(ctx, lobed(cx, cy, r * 1.1, r, 11, seed + i, 0.2));
      ctx.fillStyle = mix(fl.deep, fl.leaf, 0.25);
      ctx.fill();
    }
  }

  // Root flare, then the trunk.
  ctx.beginPath();
  ctx.moveTo(-s * 0.14, 0);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.08, -s * 0.045, trunkTop);
  ctx.lineTo(s * 0.045, trunkTop);
  ctx.quadraticCurveTo(s * 0.05, -s * 0.08, s * 0.14, 0);
  ctx.closePath();
  const tg = ctx.createLinearGradient(-s * 0.1, 0, s * 0.1, 0);
  tg.addColorStop(0, mix(fl.bark, "#efd6b4", 0.4));
  tg.addColorStop(0.4, fl.bark);
  tg.addColorStop(1, fl.barkDark);
  ctx.fillStyle = tg;
  ctx.fill();
  if (s > 60) {
    ctx.strokeStyle = hexA(fl.barkDark, 0.4);
    ctx.lineWidth = Math.max(0.5, s * 0.006);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const bx = -s * 0.04 + i * s * 0.02;
      ctx.moveTo(bx, -s * 0.02);
      ctx.lineTo(bx + s * 0.008, trunkTop);
    }
    ctx.stroke();
  }
  grow([0, trunkTop], -Math.PI / 2, s * 0.26, s * 0.075, 0, 1);

  if (fl.bare) return;

  // Front canopy masses, lit from the upper left, drawn largest first.
  const n = 5 + Math.round(health * 3);
  for (let i = 0; i < n; i++) {
    const t = tips[(i * 3) % Math.max(1, tips.length)] ?? [0, canopyY];
    const cx = t[0] * 0.85 + (rand(i, seed + 61) - 0.5) * s * 0.1;
    const cy = t[1] - s * 0.05 + (rand(i, seed + 67) - 0.5) * s * 0.08;
    const r = s * (0.15 + 0.1 * rand(i, seed + 71)) * (0.7 + health * 0.3);
    const pts = lobed(cx + Math.sin(sway + i * 0.8) * s * 0.01, cy, r * 1.15, r, 13, seed + i * 3, 0.24);
    blob(ctx, pts);
    const g = ctx.createRadialGradient(
      cx + KEY.x * r * 1.1, cy + KEY.y * r * 1.1, r * 0.05, cx, cy, r * 1.3,
    );
    g.addColorStop(0, fl.hi);
    g.addColorStop(0.4, fl.leaf);
    g.addColorStop(1, mix(fl.deep, fl.leaf, 0.2));
    ctx.fillStyle = g;
    ctx.fill();
    // Leaf edges only where they will resolve.
    if (s > 70) {
      ctx.strokeStyle = hexA(fl.deep, 0.25);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  // A few fallen leaves date the season without a word of text.
  if (!fl.bare && health < 0.95) {
    for (let i = 0; i < 5; i++) {
      const lx = (rand(i, seed + 83) - 0.5) * s * 0.7;
      ctx.beginPath();
      ctx.ellipse(lx, -s * 0.01, s * 0.025, s * 0.012, rand(i, seed + 87) * 3, 0, TAU);
      ctx.fillStyle = hexA(mix(fl.leaf, "#b5731f", 0.6), 0.8);
      ctx.fill();
    }
  }
}

/** A conifer: drooping bough tiers around a straight leader, never a triangle. */
function drawConifer(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  const needle = mix(fl.leaf, "#1f4a33", 0.45);
  const needleHi = mix(fl.hi, "#5f9a5a", 0.4);
  const needleDeep = mix(fl.deep, "#12301f", 0.5);

  taper(ctx, [[0, 0], [0, -s * 0.9]], (t) => Math.max(1, s * (0.07 - 0.055 * t)));
  ctx.fillStyle = fl.bark;
  ctx.fill();

  const tiers = 8 + Math.round(rand(seed, 5) * 3);
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = -s * (0.16 + t * 0.78);
    // Each tier is jittered off the ideal cone. A perfect taper is a party
    // hat; a real spruce is lopsided where a bough was lost or shaded out.
    const half = s * (0.4 - t * 0.33) * (0.65 + health * 0.35) * (0.86 + rand(i, seed) * 0.28);
    const drop = s * 0.07 * (1 - t * 0.5);
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(0, y - drop * 0.5);
      // The lower edge is a run of needle points; the upper edge is smooth.
      // That asymmetry is what makes a bough droop instead of stick out.
      const steps = 6;
      for (let k = steps; k >= 0; k--) {
        const u = k / steps;
        const px = side * half * u + Math.sin(sway + i) * s * 0.01 * u;
        const py = y + drop * u * u + (k % 2 ? s * 0.028 : 0);
        ctx.lineTo(px, py);
      }
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        ctx.lineTo(side * half * u * 0.92, y + drop * u * u - s * 0.035 * (1 - u));
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(-half, y, half, y + drop);
      g.addColorStop(0, side < 0 ? needleHi : needle);
      g.addColorStop(0.5, needle);
      g.addColorStop(1, needleDeep);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  // Leader spike.
  ctx.beginPath();
  ctx.moveTo(-s * 0.035, -s * 0.9);
  ctx.lineTo(0, -s);
  ctx.lineTo(s * 0.035, -s * 0.9);
  ctx.closePath();
  ctx.fillStyle = needle;
  ctx.fill();

  if (fl.bare) {
    // Snow loads on the upper surface of each bough, not on its underside.
    for (let i = 0; i < tiers; i += 2) {
      const t = i / (tiers - 1);
      const y = -s * (0.16 + t * 0.78);
      const half = s * (0.4 - t * 0.33);
      ctx.beginPath();
      ctx.ellipse(0, y - s * 0.02, half * 0.8, s * 0.022, 0, Math.PI, TAU);
      ctx.fillStyle = hexA(dark ? "#c9dbe8" : "#ffffff", 0.85);
      ctx.fill();
    }
  }
}

/** A flower: stem, leaves, a ring of petals and a pollen-dusted disc. */
function drawFlower(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  // A wilting flower bends at the neck before it loses colour, so droop is
  // driven straight off health.
  const droop = (1 - health) * 0.9;
  const lean = Math.sin(sway) * 0.1 + (rand(seed, 3) - 0.5) * 0.2;
  const headX = s * (0.1 * Math.sin(lean) + droop * 0.3);
  const headY = -s * (0.9 - droop * 0.28);

  const stem = arcSpine([0, 0], [s * 0.06 * Math.sin(lean), -s * 0.5], [headX, headY], 7);
  taper(ctx, stem, (t) => Math.max(1, s * (0.05 - 0.022 * t)));
  ctx.fillStyle = mix(fl.leaf, fl.deep, 0.35);
  ctx.fill();

  for (const side of [-1, 1] as const) {
    const ly = -s * (0.3 + side * 0.12);
    blob(ctx, [
      [0, ly], [side * s * 0.12, ly - s * 0.08], [side * s * 0.28, ly - s * 0.05],
      [side * s * 0.2, ly + s * 0.05], [side * s * 0.06, ly + s * 0.04],
    ]);
    const g = ctx.createLinearGradient(0, ly, side * s * 0.28, ly);
    g.addColorStop(0, fl.deep);
    g.addColorStop(1, side < 0 ? fl.hi : fl.leaf);
    ctx.fillStyle = g;
    ctx.fill();
  }

  const r = s * 0.2 * (0.65 + health * 0.35);
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * TAU + lean;
    const px = headX + Math.cos(a) * r * 0.72;
    const py = headY + Math.sin(a) * r * 0.72;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.66, r * 0.4, 0, 0, TAU);
    const g = ctx.createLinearGradient(-r * 0.6, 0, r * 0.6, 0);
    g.addColorStop(0, mix(fl.bloom, "#ffffff", 0.45));
    g.addColorStop(0.6, fl.bloom);
    g.addColorStop(1, mix(fl.bloom, "#7a2a44", 0.35));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hexA(mix(fl.bloom, "#5c1f34", 0.4), 0.35);
    ctx.lineWidth = Math.max(0.4, s * 0.006);
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.lineTo(r * 0.55, 0);
    ctx.stroke();
    ctx.restore();
  }
  const dg = ctx.createRadialGradient(
    headX + KEY.x * r * 0.4, headY + KEY.y * r * 0.4, 0, headX, headY, r * 0.5,
  );
  dg.addColorStop(0, mix("#f6d35a", "#ffffff", 0.4));
  dg.addColorStop(1, "#b07716");
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.arc(headX, headY, r * 0.42, 0, TAU);
  ctx.fill();
  if (s > 26) {
    ctx.fillStyle = hexA("#6b4a0c", 0.5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.4;
      ctx.beginPath();
      ctx.arc(headX + Math.cos(a) * r * 0.24, headY + Math.sin(a) * r * 0.24, Math.max(0.5, s * 0.012), 0, TAU);
      ctx.fill();
    }
  }
  if (dark) {
    ctx.strokeStyle = hexA("#ffffff", 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(headX, headY, r * 0.95, 0, TAU);
    ctx.stroke();
  }
}

/** A seedling: two cotyledons and one true leaf pushing out of a soil mound. */
function drawSeedling(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.36, s * 0.11, 0, Math.PI, TAU);
  const mg = ctx.createLinearGradient(0, -s * 0.11, 0, 0);
  mg.addColorStop(0, mix(fl.soil, "#c39a70", dark ? 0.2 : 0.4));
  mg.addColorStop(1, fl.soil);
  ctx.fillStyle = mg;
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc((rand(i, seed) - 0.5) * s * 0.6, -s * 0.02 - rand(i, seed + 4) * s * 0.05,
      Math.max(0.5, s * 0.02), 0, TAU);
    ctx.fillStyle = hexA(mix(fl.soil, "#000000", 0.3), 0.6);
    ctx.fill();
  }

  const lean = Math.sin(sway) * 0.14;
  const top = -s * (0.5 + health * 0.16);
  taper(ctx, arcSpine([0, 0], [s * 0.04, top * 0.55], [s * 0.06 + lean * s * 0.2, top], 5),
    (t) => Math.max(1, s * (0.045 - 0.018 * t)));
  ctx.fillStyle = mix(fl.leaf, fl.hi, 0.35);
  ctx.fill();

  // Cotyledons: the seed leaves, opposite and simple-edged.
  for (const side of [-1, 1] as const) {
    blob(ctx, [
      [s * 0.05, top + s * 0.04],
      [side * s * 0.2, top - s * 0.02],
      [side * s * 0.34, top - s * 0.14],
      [side * s * 0.18, top - s * 0.15],
      [s * 0.04, top - s * 0.03],
    ]);
    const g = ctx.createLinearGradient(0, top, side * s * 0.34, top - s * 0.14);
    g.addColorStop(0, fl.leaf);
    g.addColorStop(1, side < 0 ? fl.hi : mix(fl.leaf, fl.deep, 0.35));
    ctx.fillStyle = g;
    ctx.fill();
  }
  // The first true leaf, notched, rising between them.
  blob(ctx, [
    [s * 0.06, top - s * 0.02], [s * 0.16, top - s * 0.16],
    [s * 0.1, top - s * 0.32], [-s * 0.02, top - s * 0.2],
    [-s * 0.04, top - s * 0.06],
  ]);
  const lg = ctx.createLinearGradient(-s * 0.04, top, s * 0.16, top - s * 0.3);
  lg.addColorStop(0, mix(fl.leaf, fl.deep, 0.3));
  lg.addColorStop(1, fl.hi);
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.02 + KEY.x * s * 0.04, top - s * 0.2, Math.max(0.6, s * 0.03), 0, TAU);
  ctx.fillStyle = hexA("#ffffff", 0.5);
  ctx.fill();
}

/** Kelp: a holdfast, a swaying stipe, blades and their gas bladders. */
function drawKelp(
  ctx: CanvasRenderingContext2D, s: number, fl: Flora,
  seed: number, health: number, sway: number, dark: boolean,
) {
  const blade = mix(fl.deep, "#6b4a12", 0.42);
  const bladeHi = mix(fl.leaf, "#b08a2c", 0.35);

  const lean = 0.22 + Math.sin(sway) * 0.16;
  const stipe: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    stipe.push([
      Math.sin(sway + t * 2.2) * s * 0.12 * t + lean * s * t * t * 0.8,
      -s * t,
    ]);
  }

  // Holdfast: the root-like grip. Kelp is anchored, not planted, and that is
  // worth showing — it has no roots and takes nothing from the sea floor.
  for (let i = 0; i < 5; i++) {
    const a = -0.4 + (i / 4) * 3.9;
    taper(ctx, arcSpine([0, -s * 0.06], [Math.cos(a) * s * 0.09, -s * 0.03], [Math.cos(a) * s * 0.15, 0], 4),
      (t) => Math.max(0.8, s * (0.03 - 0.012 * t)));
    ctx.fillStyle = mix(blade, "#3a2a10", 0.4);
    ctx.fill();
  }

  const n = 9;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const p = pointOn(stipe, t);
    const side = i % 2 ? 1 : -1;
    const len = s * (0.2 + 0.14 * rand(i, seed)) * (0.6 + health * 0.4);
    const tip: Pt = [
      p[0] + side * len * (0.5 + Math.sin(sway + i) * 0.2),
      p[1] - len * 0.6,
    ];
    const spine = arcSpine(p, [p[0] + side * len * 0.5, p[1] - len * 0.1], tip, 6);
    taper(ctx, spine, (u) => Math.max(1, s * 0.075 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.9)));
    const g = ctx.createLinearGradient(p[0], p[1], tip[0], tip[1]);
    g.addColorStop(0, blade);
    g.addColorStop(1, hexA(bladeHi, 0.85));
    ctx.fillStyle = g;
    ctx.fill();
    // Pneumatocyst: the float that holds the blade up in the water column.
    ctx.beginPath();
    ctx.ellipse(p[0] + side * s * 0.04, p[1] - s * 0.02, s * 0.035, s * 0.05, side * 0.4, 0, TAU);
    ctx.fillStyle = mix(blade, "#e2c169", 0.45);
    ctx.fill();
  }

  taper(ctx, stipe, (t) => Math.max(1, s * (0.05 - 0.02 * t)));
  const sg = ctx.createLinearGradient(-s * 0.05, 0, s * 0.05, 0);
  sg.addColorStop(0, mix(blade, "#c9a45a", 0.3));
  sg.addColorStop(1, mix(blade, "#241708", 0.35));
  ctx.fillStyle = sg;
  ctx.fill();
  if (dark) {
    ctx.strokeStyle = hexA("#7fd4c4", 0.18);
    ctx.lineWidth = 1;
    curve(ctx, stipe);
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ *
 * Habitats
 *
 * A backdrop is not a background colour. Depth in a landscape comes from one
 * physical fact: air is not transparent, so the further away something is the
 * more of the sky's own light is scattered into the line of sight. Distant
 * things go paler, bluer and lower in contrast. Every habitat below is built
 * in the same four layers — sky, far, middle, foreground — with that shift
 * applied between them, which is why they read as places rather than as
 * stacked rectangles.
 * ------------------------------------------------------------------ */

/** What a habitat tells its caller about where things can stand. */
export interface HabitatFrame {
  horizonY: number;
  /** Screen y of the nearest ground the viewer can place something on. */
  groundBottom: number;
  /** The colour distance is painted in — pass to `creature`'s `hazeColor`. */
  haze: string;
}

/** Smoothed value noise. Deterministic, so a coastline never crawls. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = rand(i, seed);
  const b = rand(i + 1, seed);
  return a + (b - a) * f * f * (3 - 2 * f);
}

function fbm(x: number, seed: number, oct = 4): number {
  let v = 0;
  let amp = 0.55;
  let fr = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise1(x * fr, seed + i * 17);
    fr *= 2;
    amp *= 0.5;
  }
  return v;
}

/** A landform silhouette filled down to `bottomY`. */
function ridge(
  ctx: CanvasRenderingContext2D, x0: number, w: number,
  baseY: number, bottomY: number, amp: number, scale: number,
  seed: number, fill: string | CanvasGradient, sharp = 1,
) {
  const n = Math.max(28, Math.round(w / 5));
  ctx.beginPath();
  ctx.moveTo(x0, bottomY);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const k = Math.pow(fbm(u * scale, seed), sharp);
    ctx.lineTo(x0 + u * w, baseY - amp * (k - 0.3));
  }
  ctx.lineTo(x0 + w, bottomY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Slow drifting cloud masses. `t` moves them; nothing else in the sky moves. */
function clouds(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  t: number, color: string, seed: number, count = 5,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < count; i++) {
    const speed = 0.6 + rand(i, seed) * 0.8;
    const cx = x + (((rand(i, seed + 3) * w + t * speed * 6) % (w * 1.4)) - w * 0.2);
    const cy = y + h * (0.12 + rand(i, seed + 5) * 0.5);
    const r = h * (0.13 + rand(i, seed + 7) * 0.12);
    for (let k = 0; k < 4; k++) {
      const ox = (k - 1.5) * r * 0.85;
      const rr = r * (0.6 + rand(k, seed + i * 11) * 0.6);
      const g = ctx.createRadialGradient(cx + ox, cy - rr * 0.3, 0, cx + ox, cy, rr * 1.3);
      g.addColorStop(0, hexA(color, 0.85));
      g.addColorStop(0.6, hexA(color, 0.4));
      g.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx + ox, cy, rr * 1.3, rr * 0.75, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The sun, low and up-left, matching the key light every organism is lit by. */
function sunGlow(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  core: string, halo: string,
) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
  g.addColorStop(0, hexA(core, 0.95));
  g.addColorStop(0.1, hexA(core, 0.6));
  g.addColorStop(0.35, hexA(halo, 0.28));
  g.addColorStop(1, hexA(halo, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = hexA(core, 0.9);
  ctx.fill();
}

/** The band of scattered light that sits on every real horizon. */
function horizonHaze(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, depth: number, color: string,
) {
  const g = ctx.createLinearGradient(0, y - depth * 0.4, 0, y + depth);
  g.addColorStop(0, hexA(color, 0));
  g.addColorStop(0.4, hexA(color, 0.75));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x, y - depth * 0.4, w, depth * 1.4);
}

/** Angled shafts of light. Wherever there is dust or water there is a beam. */
function lightShafts(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  t: number, color: string, count = 5, tilt = 0.28,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < count; i++) {
    const sx = x + w * (0.05 + rand(i, 91) * 0.9) + Math.sin(t * 0.2 + i) * w * 0.01;
    const bw = w * (0.03 + rand(i, 93) * 0.06);
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + bw, y);
    ctx.lineTo(sx + bw + h * tilt, y + h);
    ctx.lineTo(sx + h * tilt, y + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, hexA(color, 0.3));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The distance colour, nudged toward the live theme's surface.
 *
 * Aerial perspective is a physical effect, so its colour is mostly fixed by
 * the habitat — but letting a little of the app's own surface into it stops a
 * backdrop from sitting on the page like a photograph taped to a wall.
 */
function themedHaze(base: string, theme: ThemeColors): string {
  return mix(base, theme.surface, 0.12);
}

type HabitatFn = (
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
) => HabitatFrame;

/**
 * Draw a full habitat backdrop into the rect, and report where its ground is.
 */
export function habitat(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  which: HabitatKind, theme: ThemeColors, t: number,
): HabitatFrame {
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const frame = HABITATS[which](ctx, x, y, w, h, theme, t, dark);
  // A frame vignette, so the scene has an edge rather than just stopping.
  const vg = ctx.createRadialGradient(
    x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.4,
    x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.78,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, `rgba(0,0,0,${dark ? 0.34 : 0.16})`);
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  return frame;
}

const HABITATS: Record<HabitatKind, HabitatFn> = {
  meadow: habMeadow, forest: habForest, desert: habDesert, tundra: habTundra,
  pond: habPond, ocean: habOcean, arctic: habArctic,
};

/** Paint a vertical gradient from a stop list. */
function vgrad(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  stops: readonly (readonly [number, string])[],
) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [at, c] of stops) g.addColorStop(at, c);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function habMeadow(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.34;
  const hazeCol = themedHaze(dark ? "#2c3d5c" : "#cfe3f4", theme);
  vgrad(ctx, x, y, w, horizonY - y + 2, dark
    ? [[0, "#0d1630"], [0.55, "#1b2b4c"], [1, "#33486c"]]
    : [[0, "#4e9ada"], [0.45, "#9ccdee"], [1, "#dcf0f8"]]);
  sunGlow(ctx, x + w * 0.2, y + h * 0.1, h * 0.035,
    dark ? "#b9c9e8" : "#fff6d8", dark ? "#4a5f8c" : "#ffe9a8");
  clouds(ctx, x, y, w, horizonY - y, t, dark ? "#3d4f74" : "#ffffff", 21, 5);

  // Far hills: nearly the colour of the sky, which is the whole trick.
  ridge(ctx, x, w, horizonY + 2, horizonY + h * 0.1, h * 0.11, 3.4, 5,
    mix(dark ? "#3b5170" : "#8fb6cf", hazeCol, 0.55), 1.3);
  ridge(ctx, x, w, horizonY + 4, horizonY + h * 0.14, h * 0.07, 5.2, 9,
    mix(dark ? "#2f4a44" : "#7ba36f", hazeCol, 0.4), 1.1);

  // Mid treeline: individual crowns, still washed toward the sky.
  const treeFl = flora("summer", 1, dark, 0.42, hazeCol);
  for (let i = 0; i < 22; i++) {
    const tx = x + ((i + 0.5) / 22) * w + (rand(i, 33) - 0.5) * w * 0.03;
    const th = h * (0.07 + rand(i, 37) * 0.05);
    ctx.save();
    ctx.translate(tx, horizonY + h * 0.02);
    drawTree(ctx, th, treeFl, i + 1, 1, t * 0.3, dark);
    ctx.restore();
  }
  horizonHaze(ctx, x, horizonY + h * 0.02, w, h * 0.07, hazeCol);

  // The meadow floor, warming and saturating as it comes forward.
  vgrad(ctx, x, horizonY, w, y + h - horizonY, dark
    ? [[0, "#22402c"], [0.35, "#1c3826"], [1, "#0e2016"]]
    : [[0, "#9ac96f"], [0.3, "#74b455"], [0.7, "#4e9440"], [1, "#2f6b2e"]]);

  // Rolling bands: each one a lit crest with the hollow behind it in shade.
  for (let b = 0; b < 3; b++) {
    const by = horizonY + (y + h - horizonY) * (0.2 + b * 0.26);
    ridge(ctx, x, w, by, y + h, h * (0.02 + b * 0.012), 2.2 + b, 41 + b * 7,
      hexA(dark ? "#1a3524" : "#3f8a3c", 0.34 + b * 0.1), 1);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ridge(ctx, x, w, by - h * 0.006, by + h * 0.02, h * (0.02 + b * 0.012), 2.2 + b, 41 + b * 7,
      hexA(dark ? "#4d7a4a" : "#b9dd83", 0.5), 1);
    ctx.restore();
  }

  // Foreground: real tufts, big enough to show their blades, plus flowers.
  const nearFl = flora("summer", 1, dark, 0, hazeCol);
  const midFl = flora("summer", 1, dark, 0.18, hazeCol);
  for (let i = 0; i < 26; i++) {
    const u = rand(i, 51);
    const depth = rand(i, 53);
    const gx = x + u * w;
    const gy = horizonY + (y + h - horizonY) * (0.28 + depth * 0.78);
    if (gy > y + h + h * 0.05) continue;
    const gs = h * (0.05 + depth * 0.16);
    ctx.save();
    ctx.translate(gx, gy);
    drawGrass(ctx, gs, depth > 0.55 ? nearFl : midFl, i + 3, 1, t * 0.5 + i, dark);
    ctx.restore();
  }
  for (let i = 0; i < 7; i++) {
    const fx = x + rand(i, 61) * w;
    const depth = rand(i, 63);
    const fy = horizonY + (y + h - horizonY) * (0.4 + depth * 0.6);
    ctx.save();
    ctx.translate(fx, fy);
    drawFlower(ctx, h * (0.05 + depth * 0.09),
      flora(i % 2 ? "spring" : "summer", 1, dark, 0.1, hazeCol), i + 5, 1, t * 0.4 + i, dark);
    ctx.restore();
  }
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

function habForest(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.56;
  const hazeCol = themedHaze(dark ? "#1b2c2a" : "#b9cfc0", theme);
  vgrad(ctx, x, y, w, h, dark
    ? [[0, "#12241f"], [0.5, "#16291f"], [1, "#0b1610"]]
    : [[0, "#cfe4d2"], [0.4, "#b6d2b4"], [1, "#8fae86"]]);

  // Depth is carried by three ranks of trunks, each paler and softer than the
  // one in front. The fog between them is doing the work, not the drawing.
  for (let rank = 0; rank < 3; rank++) {
    // Only the two ranks behind get washed toward the fog. The nearest rank
    // keeps its own colour, and that untouched layer is what the eye measures
    // the other two against — haze with nothing to compare it to is just mud.
    const hz = 0.52 - rank * 0.26;
    const col = mix(dark ? "#4a3728" : "#6e5334", hazeCol, hz);
    const dcol = mix(dark ? "#150f0a" : "#2a1d0f", hazeCol, hz);
    const count = 9 - rank * 2;
    const baseY = horizonY - h * (0.1 - rank * 0.05);
    for (let i = 0; i < count; i++) {
      const tx = x + ((i + 0.5 + (rand(i, 71 + rank) - 0.5) * 0.7) / count) * w;
      const tw = w * (0.012 + rank * 0.016 + rand(i, 73 + rank) * 0.012);
      const top = y - h * 0.05 + rand(i, 77 + rank) * h * 0.12;
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.6, baseY + h * 0.06);
      ctx.quadraticCurveTo(tx - tw * 0.45, (top + baseY) / 2, tx - tw * 0.3, top);
      ctx.lineTo(tx + tw * 0.3, top);
      ctx.quadraticCurveTo(tx + tw * 0.45, (top + baseY) / 2, tx + tw * 0.6, baseY + h * 0.06);
      ctx.closePath();
      const g = ctx.createLinearGradient(tx - tw, 0, tx + tw, 0);
      g.addColorStop(0, mix(col, "#e8dcc4", 0.22 - rank * 0.05));
      g.addColorStop(0.4, col);
      g.addColorStop(1, dcol);
      ctx.fillStyle = g;
      ctx.fill();
      // Boughs leaving the trunk, so it is a tree and not a column.
      if (rank > 0) {
        ctx.strokeStyle = hexA(dcol, 0.75);
        ctx.lineWidth = Math.max(1, tw * 0.3);
        ctx.beginPath();
        for (let b = 0; b < 3; b++) {
          const by = top + h * (0.08 + b * 0.11);
          const dir = b % 2 ? 1 : -1;
          ctx.moveTo(tx, by);
          ctx.lineTo(tx + dir * tw * 2.6, by - h * 0.05);
        }
        ctx.stroke();
      }
    }
    // One thin veil of fog between ranks. Three heavy ones stacked turned the
    // trunks into panes of glass — the haze has to sit *between* the layers,
    // never over the nearest one.
    if (rank < 2) {
      const fg = ctx.createLinearGradient(0, y + h * 0.1, 0, horizonY);
      fg.addColorStop(0, hexA(hazeCol, 0));
      fg.addColorStop(1, hexA(hazeCol, 0.26));
      ctx.fillStyle = fg;
      ctx.fillRect(x, y, w, horizonY - y);
    }
  }

  // Canopy pressing down from the top of the frame.
  const canopyFl = flora("summer", 1, dark, 0.05, hazeCol);
  for (let i = 0; i < 10; i++) {
    const cx = x + ((i + 0.5) / 10) * w + (rand(i, 81) - 0.5) * w * 0.06;
    const cy = y + h * (0.02 + rand(i, 83) * 0.1);
    const r = h * (0.1 + rand(i, 87) * 0.07);
    blob(ctx, lobed(cx, cy, r * 1.4, r, 13, i * 5 + 1, 0.26));
    const g = ctx.createRadialGradient(cx + KEY.x * r, cy + KEY.y * r, r * 0.1, cx, cy, r * 1.4);
    g.addColorStop(0, canopyFl.leaf);
    g.addColorStop(0.6, mix(canopyFl.deep, canopyFl.leaf, 0.4));
    g.addColorStop(1, canopyFl.deep);
    ctx.fillStyle = g;
    ctx.fill();
  }

  lightShafts(ctx, x, y, w, h * 0.9, t, dark ? "#8fd8b0" : "#fff4c8", 4, 0.3);

  // Litter floor: ochre, textured, with roots reaching the camera.
  vgrad(ctx, x, horizonY - h * 0.02, w, y + h - horizonY + h * 0.02, dark
    ? [[0, "#2b2517"], [0.5, "#221c11"], [1, "#151009"]]
    : [[0, "#8a7346"], [0.45, "#6f5a34"], [1, "#4a3a20"]]);
  for (let i = 0; i < 90; i++) {
    const lx = x + rand(i, 101) * w;
    const depth = rand(i, 103);
    const ly = horizonY + (y + h - horizonY) * depth * depth;
    const ls = h * (0.006 + depth * 0.018);
    ctx.beginPath();
    ctx.ellipse(lx, ly, ls * 2, ls, rand(i, 107) * 3, 0, TAU);
    ctx.fillStyle = hexA(
      ["#b5731f", "#8c5a24", "#c9973a", "#6b4a24"][i % 4], dark ? 0.4 : 0.6,
    );
    ctx.fill();
  }
  const fernFl = flora("summer", 0.9, dark, 0, hazeCol);
  for (let i = 0; i < 9; i++) {
    const fx = x + rand(i, 111) * w;
    const depth = rand(i, 113);
    ctx.save();
    ctx.translate(fx, horizonY + (y + h - horizonY) * (0.25 + depth * 0.8));
    drawShrub(ctx, h * (0.07 + depth * 0.14), fernFl, i + 2, 0.9, t * 0.3 + i, dark);
    ctx.restore();
  }
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

function habDesert(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.38;
  const hazeCol = themedHaze(dark ? "#3a3550" : "#efdcc0", theme);
  vgrad(ctx, x, y, w, horizonY - y + 2, dark
    ? [[0, "#171a34"], [0.5, "#2c2a48"], [1, "#5b4a58"]]
    : [[0, "#5fa8dc"], [0.4, "#a8cfe4"], [0.8, "#efdcbd"], [1, "#f8ecd2"]]);
  sunGlow(ctx, x + w * 0.24, y + h * 0.13, h * 0.045,
    dark ? "#e8d8b0" : "#fffbe8", dark ? "#6b5a70" : "#ffdc8a");

  // Mesas: flat tops, vertical cliff faces, violet with distance.
  for (let layer = 0; layer < 2; layer++) {
    const col = mix(dark ? "#4a3a52" : "#a07a86", hazeCol, 0.6 - layer * 0.3);
    const baseY = horizonY - h * (0.02 - layer * 0.02);
    const n = 4 - layer;
    for (let i = 0; i < n; i++) {
      const mx = x + w * ((i + 0.35 + rand(i, 121 + layer) * 0.4) / n);
      const mw = w * (0.14 + rand(i, 123 + layer) * 0.12);
      const mh = h * (0.07 + rand(i, 127 + layer) * 0.06) * (1 - layer * 0.3);
      ctx.beginPath();
      ctx.moveTo(mx - mw * 0.6, baseY);
      ctx.lineTo(mx - mw * 0.45, baseY - mh);
      ctx.lineTo(mx + mw * 0.42, baseY - mh * 0.94);
      ctx.lineTo(mx + mw * 0.58, baseY);
      ctx.closePath();
      const g = ctx.createLinearGradient(mx - mw * 0.6, 0, mx + mw * 0.6, 0);
      g.addColorStop(0, mix(col, "#ffe6c4", 0.35));
      g.addColorStop(0.55, col);
      g.addColorStop(1, mix(col, "#2a1a28", 0.35));
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  horizonHaze(ctx, x, horizonY, w, h * 0.06, hazeCol);
  // Heat shimmer: the horizon itself wobbles, which is what makes it hot.
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 6; i++) {
    const sy = horizonY - h * 0.01 + i * h * 0.008;
    ctx.strokeStyle = hexA(dark ? "#6b5a70" : "#ffffff", 0.5);
    ctx.lineWidth = h * 0.005;
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const px = x + (k / 40) * w;
      const py = sy + Math.sin(k * 0.7 + t * 2.2 + i) * h * 0.004;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  vgrad(ctx, x, horizonY, w, y + h - horizonY, dark
    ? [[0, "#4a3a34"], [0.4, "#3a2c26"], [1, "#241a16"]]
    : [[0, "#e8c98e"], [0.35, "#dcb373"], [0.75, "#c9975a"], [1, "#a87840"]]);

  // Dunes: a lit windward face and a sharp slip face in shadow behind it.
  for (let b = 0; b < 4; b++) {
    const by = horizonY + (y + h - horizonY) * (0.14 + b * 0.24);
    const amp = h * (0.02 + b * 0.014);
    // Lit windward face, then the slip face behind it in shadow. One ridge
    // alone is invisible on sand; it is the pairing that makes a dune a dune.
    ridge(ctx, x, w, by + h * 0.022, y + h, amp, 1.6 + b * 0.7, 131 + b * 5,
      hexA(dark ? "#1c1410" : "#9a6f3c", 0.5), 1);
    ridge(ctx, x, w, by, y + h, amp, 1.6 + b * 0.7, 131 + b * 5,
      hexA(dark ? "#6b5344" : "#f4d9a4", 0.85), 1);
  }
  // Wind ripples in the near sand.
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#6b5140" : "#b98d52", 0.35);
  for (let i = 0; i < 22; i++) {
    const ry = horizonY + (y + h - horizonY) * (0.45 + (i / 22) * 0.6);
    if (ry > y + h) break;
    ctx.lineWidth = Math.max(0.6, h * 0.002 * (1 + i * 0.08));
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const px = x + (k / 30) * w;
      const py = ry + Math.sin(k * 0.9 + i * 1.7) * h * 0.006;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  const dry = flora("summer", 0.34, dark, 0, hazeCol);
  for (let i = 0; i < 8; i++) {
    const sx = x + rand(i, 141) * w;
    const depth = rand(i, 143);
    ctx.save();
    ctx.translate(sx, horizonY + (y + h - horizonY) * (0.2 + depth * 0.82));
    drawShrub(ctx, h * (0.05 + depth * 0.1), dry, i + 4, 0.34, t * 0.2 + i, dark);
    ctx.restore();
  }
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

function habTundra(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.4;
  const hazeCol = themedHaze(dark ? "#2b3550" : "#d8e4ee", theme);
  vgrad(ctx, x, y, w, horizonY - y + 2, dark
    ? [[0, "#101a33"], [0.5, "#22304e"], [0.85, "#4a4560"], [1, "#6b5560"]]
    : [[0, "#7fb0d8"], [0.4, "#b8d4e8"], [0.8, "#f0d9c6"], [1, "#f8e6d4"]]);
  // A low sun that never gets high: the defining fact of a polar summer.
  sunGlow(ctx, x + w * 0.18, y + h * 0.3, h * 0.03,
    dark ? "#d8c4a8" : "#fff2d0", dark ? "#6b5a6b" : "#ffd8a0");
  clouds(ctx, x, y, w, (horizonY - y) * 0.8, t, dark ? "#3d4a68" : "#f4f8fc", 151, 4);

  ridge(ctx, x, w, horizonY, horizonY + h * 0.12, h * 0.15, 2.6, 157,
    mix(dark ? "#4a5570" : "#9fb6cc", hazeCol, 0.5), 1.5);
  // Snow on the peaks only — snow lies where the slope is gentle and high.
  ctx.save();
  ctx.globalAlpha = 0.65;
  ridge(ctx, x, w, horizonY - h * 0.055, horizonY - h * 0.03, h * 0.15, 2.6, 157,
    mix("#ffffff", hazeCol, 0.35), 1.5);
  ctx.restore();
  ridge(ctx, x, w, horizonY + h * 0.02, horizonY + h * 0.14, h * 0.05, 4.2, 163,
    mix(dark ? "#3a4a48" : "#8a9a86", hazeCol, 0.35), 1.1);
  horizonHaze(ctx, x, horizonY + h * 0.02, w, h * 0.06, hazeCol);

  vgrad(ctx, x, horizonY, w, y + h - horizonY, dark
    ? [[0, "#3a4034"], [0.4, "#2c3228"], [1, "#1a1e18"]]
    : [[0, "#a8ab78"], [0.35, "#8e9463"], [0.75, "#757c4c"], [1, "#5a6038"]]);

  // Hummocks: the lumpy frost-heaved ground that is the tundra's texture.
  for (let i = 0; i < 26; i++) {
    const depth = rand(i, 171);
    const hx = x + rand(i, 173) * w;
    const hy = horizonY + (y + h - horizonY) * (0.06 + depth * depth * 0.98);
    const hr = h * (0.03 + depth * 0.11);
    blob(ctx, lobed(hx, hy, hr * 1.6, hr * 0.7, 9, i + 7, 0.24));
    const g = ctx.createRadialGradient(hx + KEY.x * hr, hy + KEY.y * hr, 0, hx, hy, hr * 1.7);
    const moss = i % 3 === 0
      ? (dark ? "#5a4a2c" : "#b08a48")
      : (dark ? "#3d4a30" : "#7f9350");
    g.addColorStop(0, mix(moss, "#ffffff", 0.28));
    g.addColorStop(1, mix(moss, "#000000", 0.35));
    // Distant hummocks are washed toward the sky before their own shading is
    // laid over the top, so the far ones flatten out the way real ones do.
    ctx.fillStyle = mix(moss, hazeCol, Math.max(0, 0.45 - depth * 0.45));
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.55 + depth * 0.35;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  // Lingering snow patches in the hollows.
  for (let i = 0; i < 12; i++) {
    const depth = rand(i, 181);
    const sx = x + rand(i, 183) * w;
    const sy = horizonY + (y + h - horizonY) * (0.1 + depth * 0.9);
    blob(ctx, lobed(sx, sy, h * (0.03 + depth * 0.08), h * (0.012 + depth * 0.03), 9, i + 11, 0.3));
    ctx.fillStyle = hexA(dark ? "#b8c8dc" : "#ffffff", 0.8);
    ctx.fill();
  }
  const lichen = flora("autumn", 0.55, dark, 0, hazeCol);
  for (let i = 0; i < 12; i++) {
    const depth = rand(i, 191);
    ctx.save();
    ctx.translate(x + rand(i, 193) * w, horizonY + (y + h - horizonY) * (0.2 + depth * 0.85));
    drawGrass(ctx, h * (0.03 + depth * 0.08), lichen, i + 6, 0.55, t * 0.4 + i, dark);
    ctx.restore();
  }
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

function habPond(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.3;
  const waterY = y + h * 0.42;
  const hazeCol = themedHaze(dark ? "#24384a" : "#c8dfe8", theme);
  vgrad(ctx, x, y, w, horizonY - y + 2, dark
    ? [[0, "#0e1a2e"], [0.6, "#1d3048"], [1, "#33506a"]]
    : [[0, "#63a9dc"], [0.5, "#a6d2ec"], [1, "#dcf0f4"]]);
  clouds(ctx, x, y, w, horizonY - y, t, dark ? "#3a506e" : "#ffffff", 201, 4);

  // Far bank with its treeline.
  const bankFl = flora("summer", 1, dark, 0.35, hazeCol);
  for (let i = 0; i < 14; i++) {
    ctx.save();
    ctx.translate(x + ((i + 0.5) / 14) * w + (rand(i, 205) - 0.5) * w * 0.04, horizonY + h * 0.05);
    drawTree(ctx, h * (0.1 + rand(i, 207) * 0.07), bankFl, i + 1, 1, t * 0.3, dark);
    ctx.restore();
  }
  ridge(ctx, x, w, horizonY + h * 0.06, waterY + 2, h * 0.02, 4, 211,
    mix(dark ? "#2c3f2c" : "#5f7f4a", hazeCol, 0.25), 1);

  // The water plane. It is darker at the far shore and mirrors the sky nearer
  // the viewer, which is the reflection geometry, not a stylistic choice.
  vgrad(ctx, x, waterY, w, y + h - waterY, dark
    ? [[0, "#12293a"], [0.4, "#0e2233"], [1, "#071522"]]
    : [[0, "#4d8fa8"], [0.35, "#5fa4bd"], [0.75, "#79bcd0"], [1, "#96d0dd"]]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, waterY, w, y + h - waterY);
  ctx.clip();
  // Wobbled reflections of the bank.
  ctx.globalAlpha = dark ? 0.3 : 0.24;
  for (let i = 0; i < 14; i++) {
    const rx = x + ((i + 0.5) / 14) * w;
    const rw = w * 0.04;
    for (let k = 0; k < 10; k++) {
      const ry = waterY + k * h * 0.012;
      ctx.fillStyle = mix(dark ? "#2c3f2c" : "#3f6b34", hazeCol, 0.3);
      ctx.fillRect(rx - rw / 2 + Math.sin(t * 1.4 + k * 0.9 + i) * w * 0.006, ry, rw, h * 0.008);
    }
  }
  ctx.globalAlpha = 1;
  // Ripple lines: closer together far away, wider near — that is perspective.
  for (let i = 0; i < 26; i++) {
    const u = i / 26;
    const ry = waterY + (y + h - waterY) * u * u;
    ctx.strokeStyle = hexA(dark ? "#7fb8cc" : "#ffffff", 0.1 + u * 0.22);
    ctx.lineWidth = Math.max(0.6, h * 0.002 * (1 + u * 4));
    ctx.beginPath();
    for (let k = 0; k <= 36; k++) {
      const px = x + (k / 36) * w;
      const py = ry + Math.sin(k * 0.6 + t * 1.6 + i) * h * 0.004 * (0.4 + u);
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Lily pads, sized by depth so the surface reads as receding.
  for (let i = 0; i < 12; i++) {
    const depth = rand(i, 221);
    const px = x + rand(i, 223) * w;
    const py = waterY + (y + h - waterY) * (0.08 + depth * depth * 0.86);
    const pr = h * (0.02 + depth * 0.055);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, 0.42);
    blob(ctx, lobed(0, 0, pr, pr, 11, i + 3, 0.12));
    const g = ctx.createRadialGradient(KEY.x * pr, KEY.y * pr, 0, 0, 0, pr * 1.2);
    g.addColorStop(0, dark ? "#3f7a4a" : "#79bf5c");
    g.addColorStop(1, dark ? "#1c3a24" : "#2f6b34");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // The notch every lily pad has, cut toward the viewer.
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pr * 0.5, py + pr * 0.34);
    ctx.lineTo(px + pr * 0.1, py + pr * 0.42);
    ctx.closePath();
    ctx.fillStyle = dark ? "#0e2233" : "#5fa4bd";
    ctx.fill();
    if (depth > 0.6 && i % 3 === 0) {
      ctx.save();
      ctx.translate(px - pr * 0.4, py - pr * 0.1);
      drawFlower(ctx, pr * 1.6, flora("spring", 1, dark, 0, hazeCol), i + 9, 1, t * 0.4, dark);
      ctx.restore();
    }
  }

  // Reeds at the near edges, framing the shot.
  const reed = flora("summer", 0.9, dark, 0, hazeCol);
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const rx = x + w * 0.5 + side * w * (0.34 + rand(i, 231) * 0.2);
    ctx.save();
    ctx.translate(rx, y + h - h * rand(i, 233) * 0.1);
    drawGrass(ctx, h * (0.22 + rand(i, 237) * 0.2), reed, i + 12, 0.9, t * 0.5 + i, dark);
    ctx.restore();
  }
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

function habOcean(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const surfaceY = y + h * 0.06;
  const floorY = y + h * 0.86;
  const hazeCol = themedHaze(dark ? "#062634" : "#3f8fb0", theme);
  // Underwater, the "sky" is the surface seen from below and the horizon is
  // the sea floor: blue deepens downward because water eats red light first.
  vgrad(ctx, x, y, w, h, dark
    ? [[0, "#0d4152"], [0.25, "#083040"], [0.6, "#04202e"], [1, "#02121c"]]
    : [[0, "#7fd0e4"], [0.22, "#49a8c8"], [0.6, "#2a7ea0"], [1, "#14506e"]]);

  // The underside of the surface, rippling.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, surfaceY - y + h * 0.06);
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = hexA(dark ? "#8fe4f4" : "#ffffff", 0.3 - i * 0.05);
    ctx.lineWidth = h * (0.01 - i * 0.0012);
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) {
      const px = x + (k / 48) * w;
      const py = y + h * 0.02 + i * h * 0.012
        + Math.sin(k * 0.4 + t * 1.8 + i * 0.8) * h * 0.012
        + Math.sin(k * 0.17 - t * 1.1) * h * 0.008;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
  lightShafts(ctx, x, y, w, h * 0.9, t, dark ? "#7fd8f0" : "#ffffff", 6, 0.34);

  // Marine snow: the constant fall of detritus that feeds the deep.
  for (let i = 0; i < 60; i++) {
    const px = x + ((rand(i, 241) * w + Math.sin(t * 0.3 + i) * w * 0.02) % w);
    const py = y + ((rand(i, 243) * h + t * (4 + rand(i, 247) * 10)) % h);
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, h * 0.0025 * (0.5 + rand(i, 251))), 0, TAU);
    ctx.fillStyle = hexA("#ffffff", 0.16 + rand(i, 253) * 0.2);
    ctx.fill();
  }

  // Sea floor with rocks, then kelp rising through the column.
  ridge(ctx, x, w, floorY, y + h, h * 0.05, 3.2, 261,
    dark ? "#1a2a2c" : "#3f5f5a", 1);
  vgrad(ctx, x, floorY + h * 0.02, w, y + h - floorY, dark
    ? [[0, "#22322c"], [1, "#0e1614"]]
    : [[0, "#5f7a62"], [1, "#33463a"]]);
  for (let i = 0; i < 12; i++) {
    const depth = rand(i, 263);
    const rx = x + rand(i, 267) * w;
    const ry = floorY + h * (0.02 + depth * 0.12);
    const rr = h * (0.015 + depth * 0.045);
    blob(ctx, lobed(rx, ry, rr * 1.5, rr, 8, i + 4, 0.24));
    const g = ctx.createRadialGradient(rx + KEY.x * rr, ry + KEY.y * rr, 0, rx, ry, rr * 1.6);
    g.addColorStop(0, dark ? "#43544c" : "#8fa08c");
    g.addColorStop(1, dark ? "#131c1a" : "#3a4c40");
    ctx.fillStyle = g;
    ctx.fill();
  }
  const kelpFl = flora("summer", 0.9, dark, 0.1, hazeCol);
  for (let i = 0; i < 7; i++) {
    const depth = rand(i, 271);
    ctx.save();
    ctx.translate(x + rand(i, 273) * w, floorY + h * (0.04 + depth * 0.1));
    drawKelp(ctx, h * (0.4 + depth * 0.5), kelpFl, i + 2, 0.9, t * 0.25 + i, dark);
    ctx.restore();
  }
  return { horizonY: surfaceY, groundBottom: floorY, haze: hazeCol };
}

function habArctic(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, t: number, dark: boolean,
): HabitatFrame {
  const horizonY = y + h * 0.36;
  const hazeCol = themedHaze(dark ? "#33456b" : "#dae8f4", theme);
  vgrad(ctx, x, y, w, horizonY - y + 2, dark
    ? [[0, "#08122a"], [0.45, "#152547"], [1, "#3b4f78"]]
    : [[0, "#7cb3de"], [0.45, "#bad9ee"], [1, "#eaf4fa"]]);
  if (dark) {
    // Aurora: a real polar phenomenon and, practically, the only thing that
    // stops an arctic night from being an empty rectangle.
    ctx.save();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const px = x + (k / 40) * w;
        const py = y + h * (0.08 + i * 0.05) + Math.sin(k * 0.3 + t * 0.4 + i * 2) * h * 0.05;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let k = 40; k >= 0; k--) {
        const px = x + (k / 40) * w;
        const py = y + h * (0.2 + i * 0.05) + Math.sin(k * 0.3 + t * 0.4 + i * 2) * h * 0.05;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y, 0, y + h * 0.3);
      g.addColorStop(0, hexA(i % 2 ? "#6bf0c4" : "#8fd0f0", 0.28));
      g.addColorStop(1, hexA("#4a6bd0", 0));
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.restore();
  } else {
    sunGlow(ctx, x + w * 0.22, y + h * 0.16, h * 0.03, "#fffaf0", "#ffe3c0");
    clouds(ctx, x, y, w, horizonY - y, t, "#ffffff", 281, 4);
  }

  // A distant iceberg, its shaded face blue because ice scatters blue.
  const bx = x + w * 0.66;
  const bw = w * 0.3;
  ctx.beginPath();
  ctx.moveTo(bx - bw * 0.5, horizonY);
  ctx.lineTo(bx - bw * 0.3, horizonY - h * 0.16);
  ctx.lineTo(bx - bw * 0.05, horizonY - h * 0.24);
  ctx.lineTo(bx + bw * 0.2, horizonY - h * 0.12);
  ctx.lineTo(bx + bw * 0.5, horizonY);
  ctx.closePath();
  const ig = ctx.createLinearGradient(bx - bw * 0.5, 0, bx + bw * 0.5, 0);
  ig.addColorStop(0, mix("#ffffff", hazeCol, 0.15));
  ig.addColorStop(0.5, mix("#cfe4f4", hazeCol, 0.3));
  ig.addColorStop(1, mix("#6b93bd", hazeCol, 0.35));
  ctx.fillStyle = ig;
  ctx.fill();
  ridge(ctx, x, w, horizonY, horizonY + h * 0.06, h * 0.045, 3.6, 291,
    mix(dark ? "#5f7aa8" : "#c4dced", hazeCol, 0.4), 1.3);
  horizonHaze(ctx, x, horizonY, w, h * 0.05, hazeCol);

  // Dark leads of open water between the floes.
  vgrad(ctx, x, horizonY, w, y + h - horizonY, dark
    ? [[0, "#0e2038"], [0.5, "#0a1828"], [1, "#050d18"]]
    : [[0, "#4a7fa8"], [0.5, "#356a92"], [1, "#204a6b"]]);
  for (let i = 0; i < 16; i++) {
    const u = i / 16;
    ctx.strokeStyle = hexA(dark ? "#7fa8d0" : "#ffffff", 0.08 + u * 0.16);
    ctx.lineWidth = Math.max(0.5, h * 0.002 * (1 + u * 3));
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const px = x + (k / 30) * w;
      const py = horizonY + (y + h - horizonY) * u * u + Math.sin(k * 0.7 + t * 1.2 + i) * h * 0.004;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Floes, back to front. Each has a lit top surface and a blue underside.
  for (let i = 0; i < 15; i++) {
    const depth = rand(i, 301);
    const fx = x + rand(i, 303) * w;
    const fy = horizonY + (y + h - horizonY) * (0.05 + depth * depth * 1.0);
    const fw = w * (0.06 + depth * 0.22);
    const fh = h * (0.01 + depth * 0.035);
    blob(ctx, lobed(fx, fy, fw * 0.5, fh, 9, i + 5, 0.28));
    ctx.fillStyle = hexA(mix("#7fb0d8", hazeCol, 0.2), 0.7);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -fh * 0.5);
    blob(ctx, lobed(fx, fy, fw * 0.48, fh * 0.85, 9, i + 5, 0.28));
    const g = ctx.createLinearGradient(fx - fw * 0.5, fy - fh, fx + fw * 0.5, fy + fh);
    g.addColorStop(0, dark ? "#dce8f4" : "#ffffff");
    g.addColorStop(1, mix(dark ? "#8fa8c4" : "#cfe0ee", hazeCol, 0.3));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  // Wind-carved snow in the very front.
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#8fa8c4" : "#b9d2e6", 0.4);
  for (let i = 0; i < 8; i++) {
    ctx.lineWidth = Math.max(0.6, h * 0.003 * (1 + i * 0.2));
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) {
      const px = x + (k / 24) * w;
      const py = y + h * (0.9 + i * 0.014) + Math.sin(k * 0.8 + i) * h * 0.006;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
  return { horizonY, groundBottom: y + h, haze: hazeCol };
}

/* ------------------------------------------------------------------ *
 * Populations
 * ------------------------------------------------------------------ */

/**
 * How wide each silhouette actually is, and where its middle sits, in units of
 * its height. Kept as data because it is measured off the drawings above: a
 * hawk is nearly three times as wide as it is tall and a rabbit is square, and
 * anything that lays these out has to know that or the wide ones hang off the
 * edge of the frame.
 */
const FOOTPRINT: Record<CreatureKind, { w: number; cx: number }> = {
  rabbit: { w: 0.96, cx: -0.02 }, fox: { w: 1.52, cx: -0.04 },
  deer: { w: 1.02, cx: 0.15 }, wolf: { w: 1.52, cx: -0.04 },
  mouse: { w: 1.19, cx: -0.05 }, bird: { w: 1.26, cx: -0.03 },
  hawk: { w: 2.50, cx: 0.0 }, fish: { w: 1.80, cx: -0.02 },
  insect: { w: 1.50, cx: 0.13 }, butterfly: { w: 1.06, cx: 0.13 },
  bee: { w: 1.32, cx: 0.0 }, worm: { w: 1.42, cx: -0.21 },
};

export interface PopulationMember {
  which: CreatureKind;
  /** Coat colour for this whole group — the light morph versus the dark one. */
  tint?: string;
  n: number;
}

/**
 * Scatter a mixed population across a habitat rect.
 *
 * Three rules do all the work. Placement is stratified — the field is divided
 * into cells and one animal is jittered inside each — because pure random
 * scatter clumps, and a clump reads as a mistake rather than as a herd.
 * Everything is sized and hazed by how far back it stands, and drawn strictly
 * back to front, so the field has depth instead of being a sticker sheet. And
 * every position comes from a hash of the individual's index, never from
 * `Math.random`, so the herd holds still between frames instead of swimming.
 */
export function population(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  members: readonly PopulationMember[],
  theme: ThemeColors, t: number,
) {
  const dark = isDarkTheme(theme);
  const hazeCol = atmosphereColor(theme);

  interface Individual {
    which: CreatureKind; tint: string | undefined; key: number;
    px: number; py: number; size: number; depth: number; facing: number;
  }

  const roster: { which: CreatureKind; tint: string | undefined }[] = [];
  for (const m of members) {
    for (let i = 0; i < Math.max(0, Math.floor(m.n)); i++) {
      roster.push({ which: m.which, tint: m.tint });
    }
  }
  const total = roster.length;
  if (total === 0) return;

  // Interleave the species deterministically, so a two-species field mixes
  // instead of drawing one block of rabbits and one block of foxes.
  const order = roster.map((_, i) => i).sort((a, b) => rand(a, 9001) - rand(b, 9001));

  const cols = Math.max(1, Math.round(Math.sqrt(total * (w / Math.max(1, h)) * 1.5)));
  const rows = Math.max(1, Math.ceil(total / cols));

  const list: Individual[] = [];
  for (let slot = 0; slot < total; slot++) {
    const i = order[slot];
    const spec = roster[i];
    const c = slot % cols;
    const r = Math.floor(slot / cols);
    const u = (c + 0.5 + (rand(i, 11) - 0.5) * 0.8) / cols;
    const v = (r + 0.5 + (rand(i, 13) - 0.5) * 0.7) / rows;
    const depth = clamp01(v);
    // The field narrows toward the horizon, which is what makes a flat rect
    // read as ground receding rather than as a wall.
    const uu = 0.5 + (u - 0.5) * (0.56 + 0.44 * depth);
    const size = h * (0.115 + 0.235 * depth) * RELATIVE_SIZE[spec.which];
    const foot = FOOTPRINT[spec.which];
    const margin = size * foot.w * 0.5;
    const drift = Math.sin(t * 0.5 + rand(i, 17) * TAU) * w * 0.012 * (0.4 + depth);
    list.push({
      which: spec.which,
      tint: spec.tint,
      key: i,
      px: Math.min(x + w - margin, Math.max(x + margin, x + uu * w + drift)),
      py: y + h * (0.04 + 0.96 * Math.pow(depth, 1.28)),
      size,
      depth,
      facing: rand(i, 19) > 0.5 ? 1 : -1,
    });
  }
  list.sort((a, b) => a.py - b.py);

  for (const ind of list) {
    const airborne = AIRBORNE.has(ind.which);
    const fast = airborne || ind.which === "bee" || ind.which === "butterfly";
    const phase = ((t * (fast ? 3.4 : 0.9) + rand(ind.key, 23)) % 1 + 1) % 1;
    let drawY = ind.py;
    if (airborne) {
      // A flier gets its own soft shadow on the ground it is flying over —
      // that shadow is the only thing telling the eye how high it is.
      const hover = ind.size * (0.9 + 0.18 * Math.sin(t * 1.4 + rand(ind.key, 29) * TAU));
      spriteShadowEllipse(ctx, ind.px + ind.size * 0.1, ind.py,
        ind.size * 0.45, ind.size * 0.13, { alpha: (dark ? 0.28 : 0.2) * (0.5 + ind.depth * 0.5) });
      drawY = ind.py - hover;
    }
    creature(ctx, ind.px - ind.size * FOOTPRINT[ind.which].cx * ind.facing, drawY,
      ind.size, ind.which, ind.facing, theme, {
        tint: ind.tint,
        motion: phase,
        haze: (1 - ind.depth) * 0.55,
        hazeColor: hazeCol,
        shadow: !airborne,
      });
  }
}

/* ------------------------------------------------------------------ *
 * Food webs
 * ------------------------------------------------------------------ */

const TROPHIC_LABEL: Record<TrophicLevel, string> = {
  producer: "Producer",
  primary: "Primary consumer",
  secondary: "Secondary consumer",
  tertiary: "Tertiary consumer",
  decomposer: "Decomposer",
};

function trophicColor(level: TrophicLevel, theme: ThemeColors): string {
  const sci = theme.sci;
  switch (level) {
    case "producer": return sci["producer"] ?? "#3f8f4a";
    case "primary": return sci["primary-consumer"] ?? "#b8912b";
    case "secondary": return sci["secondary-consumer"] ?? "#c26a2a";
    // No token exists for a top predator, so it is the secondary colour driven
    // deeper — one step further along the same ramp the rest of the web uses.
    case "tertiary": return mix(sci["secondary-consumer"] ?? "#c26a2a", "#7a1f22", 0.55);
    case "decomposer": return sci["decomposer"] ?? "#7a5c3f";
  }
}

const PLANT_KINDS: ReadonlySet<string> = new Set<PlantKind>([
  "grass", "shrub", "tree", "conifer", "flower", "seedling", "kelp",
]);

/** Title-case a kind for a label without shipping a second name table. */
function kindLabel(which: Organism): string {
  return which.charAt(0).toUpperCase() + which.slice(1);
}

/**
 * One organism in a ring coloured by its trophic level.
 *
 * The ring is the point: in a food-web builder a student has to see at a
 * glance which tier a card belongs to while they are dragging it, and colour
 * around the edge survives being half-covered by a cursor or an arrow in a way
 * that a tinted background does not.
 */
export function foodWebNode(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  which: Organism, level: TrophicLevel, theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const color = trophicColor(level, theme);
  ctx.save();

  const glow = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.5);
  glow.addColorStop(0, hexA(color, 0.32));
  glow.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, TAU);
  ctx.fill();

  // The plate the organism stands on: lit from the key like everything else.
  const plate = ctx.createRadialGradient(
    x + KEY.x * r * 0.6, y + KEY.y * r * 0.6, r * 0.05, x, y, r,
  );
  plate.addColorStop(0, dark ? mix(theme.surfaceAlt, "#ffffff", 0.12) : "#ffffff");
  plate.addColorStop(0.7, dark ? theme.surfaceAlt : mix(theme.surface, color, 0.06));
  plate.addColorStop(1, dark ? mix(theme.surface, "#000000", 0.3) : mix(theme.surface, color, 0.16));
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, 0, TAU);
  ctx.clip();
  if (PLANT_KINDS.has(which)) {
    plant(ctx, x, y + r * 0.62, r * 1.35, which as PlantKind, theme, { seed: 3 });
  } else {
    const kind = which as CreatureKind;
    const foot = FOOTPRINT[kind];
    // Fit by width as well as height: a hawk at the same height as a rabbit
    // would otherwise spill straight out of the ring.
    const size = Math.min(r * 1.35, (r * 1.6) / foot.w);
    creature(ctx, x - size * foot.cx, y + size * 0.55, size, kind, 1, theme, { shadow: false });
  }
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.5, r * 0.11);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.95, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", dark ? 0.16 : 0.5);
  ctx.lineWidth = Math.max(0.8, r * 0.03);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.99, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();

  // Level tab at the top of the ring, so the tier is named and not just hued.
  const tab = TROPHIC_LABEL[level];
  ctx.font = `700 ${Math.max(8, r * 0.19)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(tab).width + r * 0.3;
  const th = Math.max(12, r * 0.3);
  ctx.fillStyle = color;
  ctx.beginPath();
  roundRectPath(ctx, x - tw / 2, y - r - th * 0.55, tw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(tab, x, y - r - th * 0.55 + th / 2);

  ctx.font = `700 ${Math.max(10, r * 0.26)}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = dark ? "rgba(8,12,18,0.8)" : "rgba(255,255,255,0.85)";
  ctx.strokeText(kindLabel(which), x, y + r * 1.28);
  ctx.fillStyle = theme.ink;
  ctx.fillText(kindLabel(which), x, y + r * 1.28);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Signs of life
 *
 * A habitat with nothing but animals standing in it looks staged. Tracks and
 * a burrow entrance say that the place is used even where nothing is visible,
 * and in the sims they double as evidence: a student can be asked what passed
 * this way before they are shown the animal.
 * ------------------------------------------------------------------ */

export interface TrackOpts {
  /** How many pairs of prints. */
  count?: number;
  /** Print size in pixels. Defaults to a fraction of the trail length. */
  size?: number;
  alpha?: number;
}

/**
 * A line of footprints receding from `x, y` along `dir` over `len` pixels.
 *
 * The print shape is the identification: a deer leaves two crescents, a fox or
 * wolf a pad with four claw dots, a rabbit two long hind prints ahead of two
 * small fore prints — which is the counter-intuitive detail worth drawing,
 * since a bounding rabbit's back feet land in front of its front ones.
 */
export function trackMarks(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, len: number, dir: number,
  which: CreatureKind, theme: ThemeColors,
  opts: TrackOpts = {},
) {
  const dark = isDarkTheme(theme);
  const count = Math.max(1, Math.round(opts.count ?? 5));
  const s = opts.size ?? Math.max(3, len / (count * 2.6));
  const baseAlpha = opts.alpha ?? 1;
  const ink = dark ? "#05080c" : "#2f2313";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  for (let i = 0; i < count; i++) {
    // Older prints are further along the trail and further weathered.
    const u = i / Math.max(1, count - 1);
    const px = -u * len;
    // The trail also recedes, so prints shrink with distance.
    const scale = 1 - u * 0.45;
    ctx.globalAlpha = baseAlpha * (0.75 - u * 0.5) * (dark ? 0.9 : 1);
    ctx.fillStyle = ink;
    const step = s * 1.5;
    const lateral = i % 2 ? step * 0.55 : -step * 0.55;

    const pad = (ox: number, oy: number, rx: number, ry: number, claws: number) => {
      ctx.beginPath();
      ctx.ellipse(px + ox, lateral + oy, rx * scale, ry * scale, 0, 0, TAU);
      ctx.fill();
      for (let c = 0; c < claws; c++) {
        const a = -0.6 + (c / Math.max(1, claws - 1)) * 1.2;
        ctx.beginPath();
        ctx.arc(px + ox + Math.cos(a) * rx * 1.5 * scale,
          lateral + oy + Math.sin(a) * ry * 1.7 * scale,
          Math.max(0.5, rx * 0.28 * scale), 0, TAU);
        ctx.fill();
      }
    };

    switch (which) {
      case "deer":
        // Two crescents, splayed — a cloven hoof, unmistakable in mud.
        for (const side of [-1, 1] as const) {
          ctx.beginPath();
          ctx.ellipse(px, lateral + side * s * 0.3, s * 0.5 * scale, s * 0.22 * scale,
            side * 0.35, 0, TAU);
          ctx.fill();
        }
        break;
      case "fox":
      case "wolf":
        pad(0, 0, s * 0.38, s * 0.3, 4);
        break;
      case "rabbit":
        // Long hind prints land ahead of the small fore prints.
        for (const side of [-1, 1] as const) {
          ctx.beginPath();
          ctx.ellipse(px + s * 0.7, lateral + side * s * 0.34,
            s * 0.55 * scale, s * 0.2 * scale, 0, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(px - s * 0.5, lateral + side * s * 0.16,
            s * 0.2 * scale, s * 0.17 * scale, 0, 0, TAU);
          ctx.fill();
        }
        break;
      case "bird":
      case "hawk": {
        // Three forward toes and one back: an arrow pointing where it went.
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.8, s * 0.16 * scale);
        ctx.lineCap = "round";
        ctx.beginPath();
        for (const a of [-0.7, 0, 0.7] as const) {
          ctx.moveTo(px, lateral);
          ctx.lineTo(px + Math.cos(a) * s * 0.7 * scale, lateral + Math.sin(a) * s * 0.7 * scale);
        }
        ctx.moveTo(px, lateral);
        ctx.lineTo(px - s * 0.4 * scale, lateral);
        ctx.stroke();
        break;
      }
      default:
        pad(0, 0, s * 0.26, s * 0.22, 0);
        break;
    }
  }
  ctx.restore();
}

export interface BurrowOpts {
  /** A spoil-heap burrow, a rock den, or a bare mound with no open hole. */
  kind?: "burrow" | "den" | "mound";
  /** Who lives here — draw them looking out. */
  occupant?: CreatureKind;
  /** 0 fully inside, 1 fully out. */
  peek?: number;
  seed?: number;
}

/**
 * A burrow entrance in the ground.
 *
 * Three things make a hole read as a hole rather than as a dark ellipse: the
 * spoil heaped around the mouth where the soil was pushed out, a lip that
 * catches the light on its near edge, and an interior that goes properly black
 * because no light reaches down there.
 */
export function burrow(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, w: number,
  theme: ThemeColors, opts: BurrowOpts = {},
) {
  const dark = isDarkTheme(theme);
  const kind = opts.kind ?? "burrow";
  const seed = Math.floor(opts.seed ?? 5) || 5;
  const soil = dark ? "#3a2a1c" : "#6b4b30";
  const soilLit = dark ? "#5a4430" : "#a07a4e";
  const h = w * 0.55;

  ctx.save();
  ctx.translate(x, groundY);

  // The spoil heap. A burrow's soil has to go somewhere, and where it went is
  // the clue that says an animal dug this rather than the ground cracking.
  ctx.beginPath();
  ctx.moveTo(-w * 0.95, 0);
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const px = -w * 0.95 + u * w * 1.9;
    const py = -h * 0.72 * Math.sin(u * Math.PI) * (0.82 + rand(i, seed) * 0.36);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(w * 0.95, 0);
  ctx.closePath();
  const mg = ctx.createLinearGradient(-w * 0.6, -h * 0.75, w * 0.6, h * 0.2);
  mg.addColorStop(0, soilLit);
  mg.addColorStop(0.5, soil);
  mg.addColorStop(1, mix(soil, "#000000", 0.4));
  ctx.fillStyle = mg;
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc((rand(i, seed + 1) - 0.5) * w * 1.6, -rand(i, seed + 2) * h * 0.3,
      Math.max(0.6, w * 0.02 * (0.5 + rand(i, seed + 3))), 0, TAU);
    ctx.fillStyle = hexA(i % 2 ? soilLit : mix(soil, "#000000", 0.35), 0.7);
    ctx.fill();
  }

  if (kind !== "mound") {
    const mouthW = kind === "den" ? w * 0.55 : w * 0.4;
    const mouthH = kind === "den" ? h * 0.72 : h * 0.52;
    const my = -h * 0.28;
    // The dark. A radial gradient going to near-black reads as depth; a flat
    // fill reads as a sticker.
    ctx.beginPath();
    ctx.ellipse(0, my, mouthW, mouthH, 0, 0, TAU);
    const hole = ctx.createRadialGradient(
      KEY.x * mouthW * 0.4, my + mouthH * 0.5, 0, 0, my, mouthW * 1.1,
    );
    hole.addColorStop(0, "#000000");
    hole.addColorStop(0.6, dark ? "#05070a" : "#120c07");
    hole.addColorStop(1, mix(soil, "#000000", 0.72));
    ctx.fillStyle = hole;
    ctx.fill();

    if (opts.occupant) {
      const peek = clamp01(opts.peek ?? 0.45);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, my, mouthW * 0.98, mouthH * 0.98, 0, 0, TAU);
      ctx.clip();
      // Sized so the head and ears fill the mouth: `peek` slides the animal
      // up out of the hole, and at 0.4 what shows is exactly the face.
      const size = mouthH * 2.4;
      creature(ctx, -mouthW * 0.12, my + mouthH * 0.95 + size * (1 - peek) * 0.75,
        size, opts.occupant, 1, theme, { shadow: false });
      ctx.restore();
    }

    // Lit lip on the near rim, worn smooth by use.
    ctx.strokeStyle = hexA(soilLit, 0.9);
    ctx.lineWidth = Math.max(1.2, w * 0.035);
    ctx.beginPath();
    ctx.ellipse(0, my, mouthW, mouthH, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.strokeStyle = hexA(mix(soil, "#000000", 0.5), 0.8);
    ctx.beginPath();
    ctx.ellipse(0, my, mouthW, mouthH, 0, Math.PI + 0.15, TAU - 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * A deterministic hash in [0, 1).
 *
 * Every scatter in this file — blades in a tuft, animals in a field, stones on
 * a sea floor — comes from here rather than from `Math.random`, so the same
 * frame always draws the same layout. Random scatter would make a meadow crawl
 * with movement that nothing in the model is doing, and a student watching a
 * population crash would be reading noise as signal.
 */
function rand(i: number, salt = 0): number {
  let hv = (Math.imul(i | 0, 374761393) + Math.imul(salt | 0, 668265263)) >>> 0;
  hv = (hv ^ (hv >>> 13)) >>> 0;
  hv = Math.imul(hv, 1274126177) >>> 0;
  return ((hv ^ (hv >>> 16)) >>> 0) / 4294967296;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Blend two hex colours. Local copy so this module stands alone. */
function mix(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const c = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * clamp01(t));
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

/** Relative brightness, used to decide which way a contour has to contrast. */
function lum(h: string): number {
  const [r, g, b] = hex(h);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
