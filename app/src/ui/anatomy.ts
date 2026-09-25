import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Anatomy — the human body, its organs, vessels, nerves and joints.
 *
 * `organic.ts` draws life at the scale of a single cell and `geo.ts` draws the
 * planet. This file draws the body, and it exists because the standard
 * classroom picture of a human being is a grey rectangle with an oval stuck on
 * top and a smaller oval labelled HEART. A student reads that as a diagram of
 * a diagram. Nothing in it can be pointed at and named.
 *
 * A real heart is not a symmetric valentine: it is a cone lying on its side
 * with four chambers of visibly different wall thickness, and the thickness is
 * the answer to "why does the left ventricle work harder?". A real brain is
 * not a grey cloud: it is folded, and the folding is how a large cortex fits
 * inside a small skull. A real axon is not a line: it is insulated in myelin
 * with bare gaps between the sheaths, and the signal jumps from gap to gap,
 * which is the entire reason vertebrate nerves are fast. Every anatomical
 * detail rendered here was chosen because a student is asked to explain it.
 *
 * Everything is built from layered gradients and curves rather than sprites,
 * so it stays crisp at any zoom, animates per frame, and recolours with the
 * theme. Nothing is random: every fold, coil and branch comes from a seeded
 * generator, so the same body is drawn the same way every frame.
 *
 * Every exported drawing function leaves the canvas exactly as it found it,
 * and each one holds its outer `save` in a `try`/`finally` so that even a throw
 * from deep inside an organ cannot leak a transform or a clip onto the stack.
 * That matters more than it looks: one unbalanced `save` silently blanks
 * everything drawn after it in the frame, and the damage appears nowhere near
 * the cause.
 */

/* ------------------------------------------------------------------ *
 * Light model
 *
 * One convention, shared with `organic.ts`, `geo.ts` and the scene kit: light
 * arrives from the upper left. Every organ carries its highlight up-left of
 * centre, its core shadow down-right, and a rim light opposite the key.
 * Consistency is what makes a heart, a kidney and a femur drawn by three
 * different call sites read as one body under one lamp rather than a sheet of
 * stickers.
 * ------------------------------------------------------------------ */

const KEY = { x: -0.38, y: -0.42 };
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ *
 * Palette
 *
 * Tissue colour is a property of the tissue, not of the interface. Liver is
 * deep maroon because it is packed with blood; lung is pink because it is air
 * and capillary; tendon is pearl-white because it is dense collagen with
 * almost no blood supply at all. So the hues below do not change with the
 * theme. What the theme changes is only how much light is in the room: in the
 * dark theme every tissue is lifted a little so it still reads as flesh on a
 * dark ground instead of sinking into it.
 *
 * Nothing here is grey. Grey is the colour of a preserved specimen under bad
 * light, and it is exactly what makes classroom anatomy look dead.
 * ------------------------------------------------------------------ */

export interface AnatomyPalette {
  dark: boolean;
  /** Living skin — used translucently so the interior shows through. */
  skin: string;
  skinDeep: string;
  skinRim: string;
  /** Oxygenated blood and the arteries carrying it. */
  arterial: string;
  arterialDeep: string;
  arterialLight: string;
  /** Deoxygenated blood and the veins carrying it: blue-violet, never navy. */
  venous: string;
  venousDeep: string;
  venousLight: string;
  /** Skeletal muscle: deep red from myoglobin, with pale collagen tendon. */
  muscle: string;
  muscleDeep: string;
  muscleLight: string;
  tendon: string;
  /** Bone is warm ivory; cartilage is the bluish white on a joint surface. */
  bone: string;
  boneShade: string;
  boneLight: string;
  cartilage: string;
  /** Viscera. */
  lung: string;
  lungDeep: string;
  airway: string;
  liver: string;
  liverLight: string;
  stomach: string;
  stomachDeep: string;
  gut: string;
  gutDeep: string;
  /** The lining every hollow organ is wet with: folded, pink, glandular. */
  mucosa: string;
  mucosaDeep: string;
  /** Bile: the one genuinely green thing in a body. */
  bile: string;
  bileDeep: string;
  /** Pancreas — a pale lobulated gland, tan against the pink of the gut. */
  pancreas: string;
  pancreasDeep: string;
  kidney: string;
  kidneyDeep: string;
  kidneyLight: string;
  /** Urinary tract: pale muscular wall, and the straw-coloured urine in it. */
  urinary: string;
  urinaryDeep: string;
  urine: string;
  brain: string;
  brainDeep: string;
  brainLight: string;
  cerebellum: string;
  /** Grey matter is cell bodies, and really is greyer and pinker than white. */
  greyMatter: string;
  /** Nerve tissue is pale straw; myelin is the fatty white around an axon. */
  nerve: string;
  nerveDeep: string;
  myelin: string;
  fat: string;
  ink: string;
}

export function anatomyPalette(theme: ThemeColors): AnatomyPalette {
  const dark = isDarkTheme(theme);
  // In the dark theme every tissue is lifted toward light by a constant, which
  // keeps the hue relationships intact while stopping deep maroon and dark
  // blue-violet from disappearing into a dark stage.
  const lift = (c: string, k = 0.12) => (dark ? mix(c, "#ffffff", k) : c);
  return {
    dark,
    skin: lift("#f3c19c", 0.04),
    skinDeep: lift("#b8714b", 0.16),
    skinRim: dark ? "#ffd9b8" : "#fff1e2",
    arterial: lift("#d21f33"),
    arterialDeep: "#78091a",
    arterialLight: lift("#ff6b70", 0.06),
    venous: lift("#3f47b4"),
    venousDeep: "#1d2166",
    venousLight: lift("#7d84e6", 0.04),
    muscle: lift("#b02330"),
    muscleDeep: "#5d0f1c",
    muscleLight: lift("#e2626a", 0.04),
    tendon: dark ? "#f6ecd8" : "#f2e6cd",
    bone: dark ? "#f8f0dd" : "#f4e9d1",
    boneShade: dark ? "#c8b491" : "#bda682",
    boneLight: "#fffaf0",
    cartilage: dark ? "#dcecf2" : "#cfe2ea",
    lung: lift("#ee8b9c", 0.06),
    lungDeep: lift("#b03f57"),
    airway: dark ? "#eadcc6" : "#e3d2b8",
    liver: lift("#7e2233"),
    liverLight: lift("#ab3547"),
    stomach: lift("#d98490", 0.06),
    stomachDeep: lift("#a44a5c"),
    gut: lift("#dfa07c", 0.06),
    gutDeep: lift("#a75f3f"),
    mucosa: lift("#e79aa0", 0.05),
    mucosaDeep: lift("#a2515e"),
    bile: lift("#6f9c3a", 0.08),
    bileDeep: lift("#37561c"),
    pancreas: lift("#e3b58c", 0.05),
    pancreasDeep: lift("#a26f4c"),
    kidney: lift("#a13740"),
    kidneyDeep: "#6b1f2c",
    kidneyLight: lift("#c86a6f", 0.04),
    urinary: lift("#e2b9a8", 0.05),
    urinaryDeep: lift("#9c6c5c"),
    urine: dark ? "#ffe07e" : "#f4cf5e",
    brain: lift("#deb2ab", 0.05),
    brainDeep: lift("#9a635f"),
    brainLight: dark ? "#f7ddd6" : "#f3d5cd",
    cerebellum: lift("#c9958e", 0.05),
    greyMatter: lift("#b8858c", 0.05),
    nerve: dark ? "#f0e3a8" : "#e4d59a",
    nerveDeep: lift("#a08f52"),
    myelin: dark ? "#fff5dd" : "#fdf0d6",
    fat: lift("#f2cf7c", 0.04),
    ink: theme.ink,
  };
}

/* ------------------------------------------------------------------ *
 * Geometry helpers
 *
 * Bodies have no straight lines and no perfect circles in them, so almost
 * every shape in this file is a curve fitted through named anatomical landmark
 * points. Keeping the landmarks as data and the smoothing as a helper means a
 * shape can be checked against a real atlas point by point.
 * ------------------------------------------------------------------ */

export interface Pt { x: number; y: number }

/**
 * Catmull-Rom through every supplied point, emitted as cubic Béziers.
 *
 * The curve passes exactly through each landmark, which matters: the landmarks
 * are anatomy (the acromion, the costal margin, the cardiac apex) and a spline
 * that merely approximated them would quietly move the anatomy. Repeating a
 * point pins a sharp corner there — used for the chin, the fingertips and the
 * apex of the heart, all of which really are corners.
 */
function smoothPath(
  ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean, s = 1,
): void {
  const n = pts.length;
  if (n < 2) return;
  const at = (i: number): Pt =>
    pts[closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))];
  ctx.moveTo(pts[0].x, pts[0].y);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    ctx.bezierCurveTo(
      p1.x + ((p2.x - p0.x) * s) / 6, p1.y + ((p2.y - p0.y) * s) / 6,
      p2.x - ((p3.x - p1.x) * s) / 6, p2.y - ((p3.y - p1.y) * s) / 6,
      p2.x, p2.y,
    );
  }
  if (closed) ctx.closePath();
}

/** `smoothPath` as a fresh path of its own. */
function curve(
  ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean, s = 1,
): void {
  ctx.beginPath();
  smoothPath(ctx, pts, closed, s);
}

/** Sample a Catmull-Rom through `pts` into a dense polyline. */
function densify(pts: Pt[], closed: boolean, per = 12, s = 1): Pt[] {
  const n = pts.length;
  if (n < 2) return pts.slice();
  const at = (i: number): Pt =>
    pts[closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))];
  const out: Pt[] = [];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const m1x = ((p2.x - p0.x) * s) / 2, m1y = ((p2.y - p0.y) * s) / 2;
    const m2x = ((p3.x - p1.x) * s) / 2, m2y = ((p3.y - p1.y) * s) / 2;
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
      out.push({
        x: h00 * p1.x + h10 * m1x + h01 * p2.x + h11 * m2x,
        y: h00 * p1.y + h10 * m1y + h01 * p2.y + h11 * m2y,
      });
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

/** Signed area, used only to make every subpath wind the same way. */
function area(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/**
 * Force a consistent winding.
 *
 * The body is filled as one path made of several overlapping subpaths — torso,
 * two arms, two legs — so that translucent skin fills the union exactly once
 * instead of double-darkening at every shoulder and hip. That only works under
 * the non-zero rule if every subpath turns the same way.
 */
function orient(pts: Pt[]): Pt[] {
  return area(pts) < 0 ? pts.slice().reverse() : pts;
}

/** Cumulative arc length along a polyline. */
function arcLengths(pts: Pt[]): number[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return acc;
}

/** Position and unit tangent at fraction `u` of a polyline's length. */
function along(pts: Pt[], acc: number[], u: number): { p: Pt; tx: number; ty: number } {
  const total = acc[acc.length - 1] || 1;
  const d = Math.max(0, Math.min(1, u)) * total;
  let i = 1;
  while (i < acc.length - 1 && acc[i] < d) i++;
  const seg = acc[i] - acc[i - 1] || 1;
  const f = (d - acc[i - 1]) / seg;
  const a = pts[i - 1], b = pts[i];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {
    p: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
    tx: (b.x - a.x) / len, ty: (b.y - a.y) / len,
  };
}

/**
 * Offset a centreline into a closed outline of varying width.
 *
 * This is how every tube in the body is drawn — vessels, gut, limbs, nerves —
 * because a tube that keeps one width along its whole run reads as a pipe, and
 * nothing in the body is a pipe. Arteries taper as they branch, a limb swells
 * at the muscle belly and narrows at the joint, the colon is sacculated.
 */
function ribbon(pts: Pt[], halfWidth: (u: number) => number): Pt[] {
  const n = pts.length;
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const hw = halfWidth(i / (n - 1 || 1));
    left.push({ x: p.x + nx * hw, y: p.y + ny * hw });
    right.push({ x: p.x - nx * hw, y: p.y - ny * hw });
  }
  return left.concat(right.reverse());
}

/** A tapered tube through node points that each carry their own radius. */
function tubeOutline(nodes: Array<{ x: number; y: number; r: number }>): Pt[] {
  const centre = densify(nodes.map((n) => ({ x: n.x, y: n.y })), false, 10);
  const rs = densify(nodes.map((n, i) => ({ x: i, y: n.r })), false, 10).map((q) => q.y);
  return ribbon(centre, (u) => {
    const i = Math.min(rs.length - 1, Math.round(u * (rs.length - 1)));
    return Math.max(0.4, rs[i]);
  });
}

/** Deterministic generator. Same seed, same body, every frame. */
function rng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * A deterministic hash of two numbers into 0-1.
 *
 * `rng` is a stream and so depends on how many times it has been called, which
 * makes a texture change whenever a loop above it gains an iteration. `hash2`
 * depends only on its arguments, so the fifty-third villus keeps its own wobble
 * no matter what else is drawn. Nothing in this file uses `Math.random`.
 */
function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** A polyline as a path — used where a curve would round off real corners. */
function polyPath(ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (closed) ctx.closePath();
}

/**
 * A tube drawn as a tube rather than as a thick line, with a width that can
 * vary along its run.
 *
 * A stroked line is flat. A duct, a ureter, a nerve or a length of gut is a
 * cylinder, and a cylinder under a single lamp has a bright specular streak
 * along the lit side and goes dark at both silhouette edges. Getting that one
 * effect right is most of the difference between a diagram and a photograph,
 * and it is why nothing in this file is drawn with `ctx.stroke` alone if it is
 * supposed to have a diameter.
 */
function litTube(
  ctx: CanvasRenderingContext2D,
  pts: Pt[], halfWidth: (u: number) => number,
  base: string, deep: string, light: string,
  opts: { alpha?: number; edge?: number } = {},
): void {
  const d = densify(pts, false, 10);
  const outline = orient(ribbon(d, halfWidth));
  const w = Math.max(halfWidth(0), halfWidth(0.5), halfWidth(1)) || 0.01;
  const a = d[0], b = d[d.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // The shading runs across the tube, not along it: normal to the mean axis,
  // pointed so that the lit side is the one facing the key.
  let nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
  if (nx * KEY.x + ny * KEY.y < 0) { nx = -nx; ny = -ny; }
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  curve(ctx, outline, true, 0.7);
  const g = ctx.createLinearGradient(
    mx + nx * w * 1.15, my + ny * w * 1.15, mx - nx * w * 1.35, my - ny * w * 1.35,
  );
  g.addColorStop(0, light);
  g.addColorStop(0.3, base);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fill();

  // Specular streak, riding the lit side of the cylinder a little off-axis.
  ctx.save();
  curve(ctx, outline, true, 0.7);
  ctx.clip();
  curve(ctx, d.map((q, i) => {
    const hw = halfWidth(i / (d.length - 1 || 1));
    return { x: q.x + nx * hw * 0.45, y: q.y + ny * hw * 0.45 };
  }), false);
  ctx.strokeStyle = hexA("#ffffff", 0.22);
  ctx.lineWidth = w * 0.22;
  ctx.stroke();
  ctx.restore();

  curve(ctx, outline, true, 0.7);
  ctx.strokeStyle = hexA(mix(deep, "#000000", 0.3), 0.65);
  ctx.lineWidth = opts.edge ?? w * 0.16;
  ctx.stroke();
  ctx.restore();
}

/**
 * A long, freely bending tube shaded as a cylinder by stacked strokes.
 *
 * `litTube` shades across one straight axis, which is right for a duct and
 * wrong for a loop of bowel that turns through a half circle: half of it would
 * come out lit from the wrong side. Stroking the centreline repeatedly —
 * widest and darkest first, then narrower and lighter, each offset a little
 * further toward the key — puts the highlight on the upper-left of the tube
 * everywhere along its run, however it bends, which is what a photograph of a
 * wet loop of gut actually looks like.
 */
function litCoil(
  ctx: CanvasRenderingContext2D,
  centre: Pt[], w: number, base: string, deep: string, light: string,
): void {
  const pass = (lw: number, col: string, k: number, alpha = 1): void => {
    ctx.save();
    ctx.translate(KEY.x * w * k, KEY.y * w * k);
    polyPath(ctx, centre, false);
    ctx.strokeStyle = alpha < 1 ? hexA(col, alpha) : col;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.restore();
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  pass(w * 2.02, mix(deep, "#000000", 0.3), 0, 0.8);  // contour
  pass(w * 1.96, deep, 0);                           // shadowed underside
  pass(w * 1.74, base, 0.2);
  pass(w * 0.86, light, 0.5);
  pass(w * 0.26, mix(light, "#ffffff", 0.5), 0.6, 0.45);
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
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
  const c = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
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

/**
 * Shade a closed tissue shape: body gradient, core shadow, key highlight and a
 * rim. Every organ in this file is built on this so they all sit in one light.
 *
 * Stroke widths are expressed purely as fractions of `r`, never floored at a
 * pixel count, because this is called both in page space and inside an organ's
 * own unit space where one unit is the organ's whole width.
 */
function shadeBody(
  ctx: CanvasRenderingContext2D,
  path: Pt[], cx: number, cy: number, r: number,
  base: string, deep: string, light: string,
  opts: { rim?: number; gloss?: number; closeS?: number } = {},
): void {
  const s = opts.closeS ?? 1;
  curve(ctx, path, true, s);
  const g = ctx.createRadialGradient(
    cx + KEY.x * r * 0.55, cy + KEY.y * r * 0.55, r * 0.06, cx, cy, r * 1.05,
  );
  g.addColorStop(0, light);
  g.addColorStop(0.42, base);
  g.addColorStop(0.82, mix(base, deep, 0.55));
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fill();

  // Wet gloss up-left: viscera are serous-membrane-covered and genuinely shiny.
  const gloss = opts.gloss ?? 0.34;
  if (gloss > 0) {
    ctx.save();
    curve(ctx, path, true, s);
    ctx.clip();
    const sg = ctx.createRadialGradient(
      cx + KEY.x * r * 0.7, cy + KEY.y * r * 0.7, 0,
      cx + KEY.x * r * 0.7, cy + KEY.y * r * 0.7, r * 0.85,
    );
    sg.addColorStop(0, hexA("#ffffff", gloss));
    sg.addColorStop(1, hexA("#ffffff", 0));
    ctx.fillStyle = sg;
    ctx.fillRect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8);
    ctx.restore();
  }

  // Contour, then a rim light on the shadow side to lift it off the ground.
  curve(ctx, path, true, s);
  ctx.strokeStyle = hexA(mix(deep, "#000000", 0.25), 0.75);
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  if ((opts.rim ?? 1) > 0) {
    ctx.save();
    curve(ctx, path, true, s);
    ctx.clip();
    ctx.translate(r * 0.03, r * 0.03);
    curve(ctx, path, true, s);
    ctx.strokeStyle = hexA("#ffffff", 0.3 * (opts.rim ?? 1));
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * 1. The human figure
 *
 * Proportion is the whole credibility of a body. The canon used here is the
 * standard 7.5-head adult figure that every life-drawing and medical
 * illustration course teaches, with the landmarks in their measured places:
 * shoulders two heads wide, nipples at two heads, navel at three, the pubic
 * symphysis at the halfway point of total height, knees at five and a half,
 * fingertips at mid-thigh. Get those wrong by even a head and the drawing
 * stops being a person; get them right and a student can find their own
 * sternum on it.
 *
 * Landmarks live in `figureMetrics` rather than inside the drawing code so
 * that `bodySystemOverlay` can put a heart, a kidney or a sciatic nerve in the
 * anatomically correct place on exactly the same skeleton the silhouette was
 * built from. An organ that floats a head too high is a wrong answer.
 * ------------------------------------------------------------------ */

export type Pose = "stand" | "run";

export interface FigureMetrics {
  /** Midline x, crown y, total height. */
  x: number; y: number; h: number;
  /** One head height: the unit the whole canon is measured in. */
  head: number;
  chin: number;
  neckBase: number;
  /** Acromion: the shoulder joint. `shoulderX` is a half-width. */
  shoulderY: number; shoulderX: number;
  sternumTop: number;
  nippleY: number;
  /** Lower edge of the ribcage — the costal margin you can feel. */
  costalY: number;
  waistY: number; waistX: number;
  navelY: number;
  iliacY: number;
  hipY: number; hipX: number;
  crotchY: number;
  kneeY: number;
  ankleY: number;
  soleY: number;
  pose: Pose;
}

export function figureMetrics(
  x: number, y: number, h: number, pose: Pose = "stand",
): FigureMetrics {
  const head = h / 7.5;
  const u = (k: number) => y + head * k;
  return {
    x, y, h, head, pose,
    chin: u(1.0),
    neckBase: u(1.26),
    shoulderY: u(1.58), shoulderX: head * 1.0,
    sternumTop: u(1.62),
    nippleY: u(2.0),
    costalY: u(2.72),
    waistY: u(2.95), waistX: head * 0.55,
    navelY: u(3.05),
    iliacY: u(3.3),
    hipY: u(3.62), hipX: head * 0.74,
    crotchY: u(3.78),
    kneeY: u(5.45),
    ankleY: u(7.14),
    soleY: u(7.5),
  };
}

interface Node { x: number; y: number; r: number }

/** Landmark table for the torso outline, in head-units right of the midline. */
const TORSO: Array<[number, number]> = [
  [0.00, -0.02], [0.20, 0.02], [0.35, 0.16], [0.40, 0.42], [0.375, 0.66],
  [0.30, 0.86], [0.175, 0.99], [0.155, 1.07], [0.175, 1.24],
  [0.44, 1.36], [0.78, 1.48], [0.97, 1.61],
  [0.86, 1.88], [0.74, 2.22], [0.68, 2.58], [0.60, 2.86],
  [0.55, 3.0], [0.62, 3.28], [0.74, 3.62],
  [0.70, 3.9], [0.42, 4.06], [0.05, 3.92],
];

/** Torso + head outline, mirrored about the midline into one closed loop. */
function torsoOutline(m: FigureMetrics): Pt[] {
  const right = TORSO.map(([dx, dy]) => ({ x: m.x + dx * m.head, y: m.y + dy * m.head }));
  const left = TORSO.slice(1, TORSO.length - 1).reverse()
    .map(([dx, dy]) => ({ x: m.x - dx * m.head, y: m.y + dy * m.head }));
  return right.concat(left);
}

/**
 * Limb joint chains. Each node carries the radius of the limb at that point,
 * which is where the shape of an arm comes from: wide at the deltoid, narrow
 * at the elbow, wide again at the forearm flexors, narrow at the wrist. A limb
 * of constant width is a stick.
 */
function limbChains(m: FigureMetrics): { arms: Node[][]; legs: Node[][] } {
  const H = m.head, X = m.x, Y = m.y;
  const N = (dx: number, dy: number, r: number): Node =>
    ({ x: X + dx * H, y: Y + dy * H, r: r * H });

  const arms: Node[][] = [];
  const legs: Node[][] = [];

  for (const side of [1, -1] as const) {
    const s = (v: number) => v * side;
    if (m.pose === "stand") {
      arms.push([
        N(s(0.9), 1.5, 0.3), N(s(1.0), 1.82, 0.29), N(s(1.06), 2.3, 0.24),
        N(s(1.1), 2.98, 0.19), N(s(1.14), 3.34, 0.2), N(s(1.17), 3.8, 0.115),
        N(s(1.19), 4.06, 0.175), N(s(1.19), 4.3, 0.12), N(s(1.185), 4.42, 0.035),
      ]);
      legs.push([
        N(s(0.33), 3.5, 0.42), N(s(0.35), 3.95, 0.38), N(s(0.34), 4.5, 0.33),
        N(s(0.31), 5.16, 0.26), N(s(0.3), 5.48, 0.235), N(s(0.315), 5.9, 0.27),
        N(s(0.28), 6.5, 0.185), N(s(0.245), 7.1, 0.115), N(s(0.25), 7.34, 0.13),
        N(s(0.31), 7.46, 0.15), N(s(0.36), 7.5, 0.11),
      ]);
    } else {
      // Running, seen from the front: the arms are locked near ninety degrees
      // and swing in opposition to the legs, and one knee is driven up and
      // across the midline while the other leg extends behind into toe-off.
      // That asymmetry is the entire read of the pose.
      const lead = side === 1;
      arms.push(lead
        ? [
          N(s(0.9), 1.48, 0.3), N(s(1.06), 1.95, 0.27), N(s(1.16), 2.5, 0.22),
          N(s(0.95), 2.42, 0.21), N(s(0.62), 2.2, 0.2), N(s(0.42), 2.06, 0.16),
          N(s(0.34), 2.0, 0.05),
        ]
        : [
          N(s(0.9), 1.58, 0.3), N(s(1.02), 2.1, 0.26), N(s(1.06), 2.72, 0.2),
          N(s(0.88), 2.96, 0.2), N(s(0.62), 3.2, 0.18), N(s(0.46), 3.34, 0.16),
          N(s(0.4), 3.42, 0.05),
        ]);
      legs.push(lead
        ? [
          N(s(0.34), 3.5, 0.42), N(s(0.44), 3.9, 0.38), N(s(0.56), 4.35, 0.34),
          N(s(0.64), 4.78, 0.3), N(s(0.7), 5.12, 0.28), N(s(0.78), 5.66, 0.2),
          N(s(0.8), 6.06, 0.13), N(s(0.68), 6.24, 0.15), N(s(0.56), 6.26, 0.1),
        ]
        : [
          N(s(0.32), 3.52, 0.42), N(s(0.26), 4.0, 0.37), N(s(0.2), 4.62, 0.31),
          N(s(0.15), 5.34, 0.25), N(s(0.14), 5.66, 0.23), N(s(0.18), 6.1, 0.25),
          N(s(0.23), 6.74, 0.17), N(s(0.28), 7.26, 0.11), N(s(0.33), 7.44, 0.1),
          N(s(0.4), 7.5, 0.07),
        ]);
    }
  }
  return { arms, legs };
}

/** The body as a list of closed subpaths: torso, two arms, two legs. */
function bodyParts(m: FigureMetrics): Pt[][] {
  const { arms, legs } = limbChains(m);
  return [
    orient(densify(torsoOutline(m), true, 8)),
    ...arms.map((a) => orient(tubeOutline(a))),
    ...legs.map((l) => orient(tubeOutline(l))),
  ];
}

/** All subpaths into one path, so a fill or a clip covers their union. */
function bodyPath(ctx: CanvasRenderingContext2D, parts: Pt[][]): void {
  ctx.beginPath();
  for (const part of parts) smoothPath(ctx, part, true, 0.6);
}

export interface FigureOpts {
  pose?: Pose;
  /** Opacity of the flesh. Low values turn the body into a window. */
  alpha?: number;
  /** Show the skeleton through the skin. On by default: it is the scaffold. */
  skeleton?: boolean;
  /** Show the surface muscle groups. */
  musculature?: boolean;
  /** Seconds. Drives the breathing rise and fall of the chest. */
  t?: number;
  /** Override the flesh colour, e.g. to grey out a figure behind a system. */
  tint?: string;
}

/**
 * A whole human being, drawn in coronal (front) view with translucent flesh.
 *
 * The body is deliberately semi-transparent. This is the view a student needs
 * in order to answer where anything actually is: the heart behind the sternum
 * and slightly left, the diaphragm at the costal margin, the kidneys tucked
 * high against the back wall — relationships that a solid silhouette hides and
 * that a floating organ diagram never establishes at all.
 */
export function humanFigure(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, h: number,
  theme: ThemeColors,
  opts: FigureOpts = {},
): void {
  const p = anatomyPalette(theme);
  const m = figureMetrics(x, y, h, opts.pose ?? "stand");
  const H = m.head;
  const t = opts.t ?? 0;
  const alpha = opts.alpha ?? 0.62;
  const skin = opts.tint ?? p.skin;
  // Quiet breathing: the chest rises about half a centimetre at rest. Tiny, but
  // a body that does not move at all reads as a mannequin.
  const breath = Math.sin(t * 1.5) * 0.5 + 0.5;

  const { arms, legs } = limbChains(m);
  const parts = bodyParts(m);
  const body = () => bodyPath(ctx, parts);

  ctx.save();
  try {

    /* Contact shadow, so the figure stands on something. */
    const sg = ctx.createRadialGradient(m.x, m.soleY, 0, m.x, m.soleY, H * 1.5);
    sg.addColorStop(0, hexA("#000000", p.dark ? 0.4 : 0.22));
    sg.addColorStop(1, hexA("#000000", 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(m.x, m.soleY + H * 0.06, H * 1.5, H * 0.24, 0, 0, TAU);
    ctx.fill();

    /* Subsurface glow: flesh is translucent and light bleeds out of its edges. */
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.shadowColor = hexA(p.skinDeep, 0.9);
    ctx.shadowBlur = H * 0.5;
    body();
    ctx.fillStyle = hexA(skin, 0.9);
    ctx.fill();
    ctx.restore();

    /* The body as one path. Non-zero winding fills the union of torso and limbs
       exactly once, so translucent skin never double-darkens at a shoulder. */
    ctx.globalAlpha = alpha;
    body();
    const bg = ctx.createLinearGradient(m.x - H * 1.3, m.y, m.x + H * 1.4, m.soleY);
    bg.addColorStop(0, mix(skin, "#ffffff", 0.34));
    bg.addColorStop(0.32, skin);
    bg.addColorStop(0.72, mix(skin, p.skinDeep, 0.5));
    bg.addColorStop(1, p.skinDeep);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Everything from here on lives inside the body. */
    ctx.save();
    body();
    ctx.clip();

    // A cool ambient wash down the shadow side of every form.
    const shade = ctx.createLinearGradient(m.x - H * 1.6, m.y, m.x + H * 1.8, m.y);
    shade.addColorStop(0, hexA(p.skinRim, 0.3));
    shade.addColorStop(0.42, hexA("#ffffff", 0));
    shade.addColorStop(1, hexA(p.skinDeep, 0.55));
    ctx.fillStyle = shade;
    ctx.fillRect(m.x - h, m.y - h, h * 2, h * 2);

    if (opts.skeleton !== false) drawSkeleton(ctx, m, p, breath);
    if (opts.musculature) drawSurfaceMuscles(ctx, m, p, arms, legs, 1.4);

    ctx.restore();

    /* Contour and rim. The key is upper-left, so the left edge catches a bright
       rim and the right edge carries the terminator. */
    body();
    ctx.strokeStyle = hexA(mix(p.skinDeep, "#000000", 0.35), 0.55);
    ctx.lineWidth = Math.max(1, H * 0.035);
    ctx.stroke();

    ctx.save();
    body();
    ctx.clip();
    ctx.translate(H * 0.055, H * 0.055);
    body();
    ctx.strokeStyle = hexA(p.skinRim, 0.55);
    ctx.lineWidth = Math.max(1.2, H * 0.075);
    ctx.stroke();
    ctx.restore();

  } finally {
    ctx.restore();
  }
}

/**
 * The skeleton, seen through the skin.
 *
 * Bones are drawn because they are the landmarks a student is actually taught
 * to navigate by. "Behind the sternum", "under the twelfth rib", "at the level
 * of L2" are meaningless without a visible ribcage and spine, and the ribcage
 * is also the honest reason the torso tapers: it is a barrel that narrows
 * below the eighth rib to a waist where nothing but spine holds you up.
 */
function drawSkeleton(
  ctx: CanvasRenderingContext2D, m: FigureMetrics, p: AnatomyPalette, breath: number,
): void {
  const H = m.head, X = m.x;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const boneFill = (path: Pt[]) => {
    curve(ctx, path, true);
    const g = ctx.createLinearGradient(X - H, m.y, X + H, m.y + H * 4);
    g.addColorStop(0, p.boneLight);
    g.addColorStop(0.5, p.bone);
    g.addColorStop(1, p.boneShade);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hexA(p.boneShade, 0.85);
    ctx.lineWidth = Math.max(0.5, H * 0.014);
    ctx.stroke();
  };

  /* Cranium and mandible. */
  boneFill(densify([
    { x: X, y: m.y + H * 0.02 }, { x: X + H * 0.34, y: m.y + H * 0.14 },
    { x: X + H * 0.37, y: m.y + H * 0.46 }, { x: X + H * 0.31, y: m.y + H * 0.7 },
    { x: X + H * 0.25, y: m.y + H * 0.88 }, { x: X, y: m.y + H * 0.95 },
    { x: X - H * 0.25, y: m.y + H * 0.88 }, { x: X - H * 0.31, y: m.y + H * 0.7 },
    { x: X - H * 0.37, y: m.y + H * 0.46 }, { x: X - H * 0.34, y: m.y + H * 0.14 },
  ], true, 6));
  // The orbits and nasal aperture: three openings that turn a dome into a
  // skull, drawn faintly so the head still reads as a living head.
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = p.boneShade;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(X + s * H * 0.155, m.y + H * 0.5, H * 0.1, H * 0.085, 0, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(X, m.y + H * 0.56);
  ctx.lineTo(X + H * 0.05, m.y + H * 0.68);
  ctx.lineTo(X - H * 0.05, m.y + H * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* The vertebral column, from the base of the skull to the sacrum. */
  const spine: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    spine.push({ x: X + Math.sin(u * Math.PI * 2) * H * 0.012, y: m.chin + (m.iliacY - m.chin) * u });
  }
  ctx.strokeStyle = hexA(p.bone, 0.9);
  ctx.lineWidth = H * 0.17;
  curve(ctx, spine, false);
  ctx.stroke();
  ctx.strokeStyle = hexA(p.boneShade, 0.65);
  ctx.lineWidth = Math.max(0.6, H * 0.016);
  for (let i = 1; i < 24; i++) {
    const q = spine[i];
    ctx.beginPath();
    ctx.moveTo(q.x - H * 0.085, q.y);
    ctx.lineTo(q.x + H * 0.085, q.y);
    ctx.stroke();
  }

  /* Clavicles: the struts that hold the shoulders out from the chest. */
  ctx.strokeStyle = hexA(p.bone, 0.95);
  ctx.lineWidth = H * 0.075;
  for (const s of [-1, 1]) {
    curve(ctx, [
      { x: X + s * H * 0.04, y: m.sternumTop },
      { x: X + s * H * 0.4, y: m.sternumTop - H * 0.05 },
      { x: X + s * H * 0.72, y: m.sternumTop + H * 0.02 },
      { x: X + s * H * 0.94, y: m.shoulderY - H * 0.02 },
    ], false);
    ctx.stroke();
  }

  /* Sternum. */
  ctx.fillStyle = hexA(p.bone, 0.95);
  ctx.beginPath();
  roundRectPath(ctx, X - H * 0.09, m.sternumTop, H * 0.18, H * 0.9, H * 0.06);
  ctx.fill();

  /* Ribs: ten pairs, springing from the spine, sloping down and forward to the
     sternum, widest at the eighth. The costal margin they form is the landmark
     the diaphragm sits on and the line a stethoscope is placed under. */
  const ribTop = m.sternumTop + H * 0.06;
  const ribSpan = m.costalY - ribTop;
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    const yy = ribTop + ribSpan * u * 0.92;
    // Rib width follows the real barrel: narrow at rib 1, widest at rib 8.
    const wide = Math.sin(Math.min(1, u * 1.12) * Math.PI * 0.86) ** 0.6;
    const halfW = H * (0.3 + 0.52 * wide) * (1 + breath * 0.012);
    const drop = H * (0.22 + 0.5 * u);
    ctx.lineWidth = H * (0.06 - u * 0.012);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X + s * H * 0.07, yy);
      ctx.bezierCurveTo(
        X + s * halfW * 0.75, yy - H * 0.02,
        X + s * halfW, yy + drop * 0.55,
        X + s * halfW * (u > 0.7 ? 0.62 : 0.4), yy + drop,
      );
      // The last three pairs are floating or false ribs: they end in cartilage
      // and never reach the sternum, which is why the waist can bend at all.
      if (i < 7) {
        ctx.strokeStyle = hexA(p.bone, 0.92);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(X + s * halfW * 0.4, yy + drop);
        ctx.quadraticCurveTo(
          X + s * halfW * 0.2, yy + drop + H * 0.06,
          X + s * H * 0.1, yy + drop * 0.92 + H * 0.04,
        );
        ctx.strokeStyle = hexA(p.cartilage, 0.85);
        ctx.stroke();
      } else {
        ctx.strokeStyle = hexA(p.bone, 0.6);
        ctx.stroke();
      }
    }
  }

  /* Pelvis: iliac wings flaring out to the crests you can feel on your hips,
     the sockets the femurs sit in, and the ring you sit on. */
  ctx.globalAlpha = 0.55;
  boneFill(densify([
    { x: X - H * 0.72, y: m.iliacY - H * 0.06 },
    { x: X - H * 0.3, y: m.iliacY - H * 0.24 },
    { x: X, y: m.iliacY - H * 0.2 },
    { x: X + H * 0.3, y: m.iliacY - H * 0.24 },
    { x: X + H * 0.72, y: m.iliacY - H * 0.06 },
    { x: X + H * 0.66, y: m.hipY - H * 0.04 },
    { x: X + H * 0.4, y: m.hipY + H * 0.12 },
    { x: X + H * 0.16, y: m.crotchY + H * 0.06 },
    { x: X, y: m.crotchY - H * 0.02 },
    { x: X - H * 0.16, y: m.crotchY + H * 0.06 },
    { x: X - H * 0.4, y: m.hipY + H * 0.12 },
    { x: X - H * 0.66, y: m.hipY - H * 0.04 },
  ], true, 6));
  // Obturator foramina — the two big openings that make a pelvis unmistakable.
  // Shaded rather than punched out, because in a body they are filled with
  // muscle and membrane, not empty.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(X + s * H * 0.26, m.crotchY - H * 0.08, H * 0.13, H * 0.17, s * 0.25, 0, TAU);
    ctx.fillStyle = hexA(mix(p.muscleDeep, p.boneShade, 0.4), 0.5);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Surface muscle groups, sketched as directional shading.
 *
 * Muscles are drawn with their fibre direction visible because fibre direction
 * is the mechanism: a muscle can only pull along its fibres, so the direction
 * of the pectoral fan tells you it draws the arm across the chest, and the
 * oblique run of the external obliques tells you they twist the trunk.
 */
function drawSurfaceMuscles(
  ctx: CanvasRenderingContext2D, m: FigureMetrics, p: AnatomyPalette,
  arms: Node[][], legs: Node[][], strength = 1,
): void {
  const H = m.head, X = m.x;
  const A = (v: number) => Math.min(1, v * strength);
  ctx.save();
  ctx.globalAlpha = A(0.5);

  const group = (path: Pt[], fibreFrom: Pt, fibreTo: Pt, lines: number) => {
    curve(ctx, path, true, 0.8);
    const g = ctx.createLinearGradient(fibreFrom.x, fibreFrom.y, fibreTo.x, fibreTo.y);
    g.addColorStop(0, hexA(p.muscleLight, 0.85));
    g.addColorStop(0.55, hexA(p.muscle, 0.9));
    g.addColorStop(1, hexA(p.muscleDeep, 0.9));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    curve(ctx, path, true, 0.8);
    ctx.clip();
    ctx.strokeStyle = hexA(p.muscleDeep, 0.5);
    ctx.lineWidth = Math.max(0.5, H * 0.012);
    for (let i = 1; i < lines; i++) {
      const u = i / lines - 0.5;
      const dx = fibreTo.x - fibreFrom.x, dy = fibreTo.y - fibreFrom.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * H * 1.3 * u, ny = (dx / len) * H * 1.3 * u;
      ctx.beginPath();
      ctx.moveTo(fibreFrom.x + nx, fibreFrom.y + ny);
      ctx.lineTo(fibreTo.x + nx * 0.35, fibreTo.y + ny * 0.35);
      ctx.stroke();
    }
    ctx.restore();
  };

  for (const s of [-1, 1]) {
    // Pectoralis major: fans from the sternum to the humerus.
    group([
      { x: X + s * H * 0.06, y: m.sternumTop + H * 0.1 },
      { x: X + s * H * 0.06, y: m.nippleY + H * 0.3 },
      { x: X + s * H * 0.45, y: m.nippleY + H * 0.34 },
      { x: X + s * H * 0.78, y: m.nippleY - H * 0.02 },
      { x: X + s * H * 0.7, y: m.sternumTop + H * 0.04 },
    ], { x: X + s * H * 0.06, y: m.nippleY }, { x: X + s * H * 0.8, y: m.nippleY - H * 0.05 }, 6);

    // Deltoid: the cap over the shoulder joint.
    group([
      { x: X + s * H * 0.62, y: m.shoulderY - H * 0.1 },
      { x: X + s * H * 1.02, y: m.shoulderY - H * 0.02 },
      { x: X + s * H * 1.08, y: m.shoulderY + H * 0.42 },
      { x: X + s * H * 0.8, y: m.shoulderY + H * 0.5 },
    ], { x: X + s * H * 0.85, y: m.shoulderY - H * 0.08 },
      { x: X + s * H * 0.95, y: m.shoulderY + H * 0.5 }, 5);

    // Trapezius: runs from the skull and spine out to the shoulder, which is
    // why shrugging is a trapezius job and pushing is a pectoral one.
    group([
      { x: X + s * H * 0.05, y: m.chin + H * 0.06 },
      { x: X + s * H * 0.16, y: m.neckBase - H * 0.02 },
      { x: X + s * H * 0.7, y: m.shoulderY - H * 0.09 },
      { x: X + s * H * 0.9, y: m.shoulderY + H * 0.02 },
      { x: X + s * H * 0.5, y: m.sternumTop + H * 0.1 },
      { x: X + s * H * 0.06, y: m.sternumTop },
    ], { x: X + s * H * 0.06, y: m.neckBase },
      { x: X + s * H * 0.92, y: m.shoulderY }, 5);

    // External oblique: fibres run diagonally down and forward, which is
    // exactly the direction it twists the trunk in.
    group([
      { x: X + s * H * 0.34, y: m.costalY - H * 0.22 },
      { x: X + s * H * 0.6, y: m.costalY + H * 0.02 },
      { x: X + s * H * 0.6, y: m.iliacY - H * 0.06 },
      { x: X + s * H * 0.3, y: m.iliacY + H * 0.04 },
      { x: X + s * H * 0.28, y: m.waistY },
    ], { x: X + s * H * 0.58, y: m.costalY - H * 0.14 },
      { x: X + s * H * 0.3, y: m.iliacY }, 5);
  }

  // Rectus abdominis with its tendinous intersections — the reason the "six
  // pack" is six and not one long strap.
  ctx.globalAlpha = A(0.42);
  const top = m.costalY - H * 0.28, bot = m.navelY + H * 0.5;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const y0 = top + ((bot - top) / 4) * i + H * 0.02;
      const hgt = (bot - top) / 4 - H * 0.05;
      const w = H * (0.3 - i * 0.03);
      ctx.beginPath();
      roundRectPath(ctx, X + s * H * 0.035, y0, s * w, hgt, H * 0.05);
      const g = ctx.createLinearGradient(X, y0, X + s * w, y0 + hgt);
      g.addColorStop(0, hexA(p.muscleLight, 0.7));
      g.addColorStop(1, hexA(p.muscleDeep, 0.75));
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  // Limb bellies: biceps and triceps on the arm, quadriceps and gastrocnemius
  // on the leg, each a lit spindle along the limb's own axis so the group
  // follows whatever pose the limb is in.
  ctx.globalAlpha = A(0.4);
  const belly = (a: Node, b: Node, k: number) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -len * k, 0, len * k);
    g.addColorStop(0, hexA(p.muscleLight, 0.8));
    g.addColorStop(0.5, hexA(p.muscle, 0.85));
    g.addColorStop(1, hexA(p.muscleDeep, 0.8));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.44, len * k, 0, 0, TAU);
    ctx.fill();
    // Striations run the length of the belly, because that is the only
    // direction the muscle can pull the two bones it spans toward each other.
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = hexA(p.muscleDeep, 0.45);
    ctx.lineWidth = Math.max(0.4, H * 0.012);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-len * 0.46, i * len * k * 0.26);
      ctx.quadraticCurveTo(0, i * len * k * 0.3, len * 0.46, i * len * k * 0.26);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };
  for (const arm of arms) { belly(arm[1], arm[3], 0.15); belly(arm[3], arm[5], 0.12); }
  for (const leg of legs) { belly(leg[1], leg[4], 0.13); belly(leg[5], leg[7], 0.11); }

  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 2. Organs
 *
 * Every organ below is drawn in a unit box from -0.5 to 0.5 and then scaled,
 * so the landmark coordinates in each function can be read straight off an
 * atlas plate and checked. They are all anterior views except the brain, which
 * is drawn from the side because that is the only view in which the lobes, the
 * cerebellum and the brainstem are all visible at once.
 * ------------------------------------------------------------------ */

export type OrganKind =
  | "heart" | "lungs" | "liver" | "muscle"
  | "stomach" | "smallIntestine" | "largeIntestine"
  | "gallbladder" | "pancreas"
  | "kidney" | "bladder"
  | "brain" | "spinalCord";

export interface OrganOpts {
  /** 0-1. Systole for the heart, a breath for the lungs, contraction for a
   *  muscle, peristalsis for the gut. Pass a looping phase, not a boolean. */
  pulse?: number;
  /** Rotation in radians about the organ's centre. */
  angle?: number;
  /** Mirror horizontally — a left kidney is a right kidney flipped. */
  flip?: boolean;
  /** Draw the cut surface and internal structure where the organ has one. */
  section?: boolean;
}

export function organ(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, which: OrganKind,
  theme: ThemeColors, opts: OrganOpts = {},
): void {
  const p = anatomyPalette(theme);
  const pulse = Math.max(0, Math.min(1, opts.pulse ?? 0));
  ctx.save();
  try {
    ctx.translate(x, y);
    if (opts.angle) ctx.rotate(opts.angle);
    ctx.scale(opts.flip ? -size : size, size);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    switch (which) {
      case "heart": drawHeart(ctx, p, pulse); break;
      case "lungs": drawLungs(ctx, p, pulse); break;
      case "liver": drawLiver(ctx, p); break;
      case "muscle": drawMuscle(ctx, p, pulse); break;
      case "stomach": drawStomach(ctx, p, pulse); break;
      case "smallIntestine": drawSmallIntestine(ctx, p, pulse); break;
      case "largeIntestine": drawLargeIntestine(ctx, p, pulse); break;
      case "gallbladder": drawGallbladder(ctx, p); break;
      case "pancreas": drawPancreas(ctx, p); break;
      case "kidney": drawKidney(ctx, p, opts.section !== false); break;
      case "bladder": drawBladder(ctx, p, pulse); break;
      case "brain": drawBrain(ctx, p, pulse); break;
      case "spinalCord": drawSpinalCord(ctx, p, pulse); break;
    }
  } finally {
    ctx.restore();
  }
}

/** A shaded tube in unit space, for the great vessels and ducts on an organ. */
function unitTube(
  ctx: CanvasRenderingContext2D, pts: Pt[], w: number, col: string, deep: string,
): void {
  const d = densify(pts, false, 10);
  curve(ctx, orient(ribbon(d, () => w / 2)), true, 0.8);
  const a = pts[0], b = pts[pts.length - 1];
  const g = ctx.createLinearGradient(a.x - w, a.y - w, b.x + w, b.y + w);
  g.addColorStop(0, mix(col, "#ffffff", 0.42));
  g.addColorStop(0.45, col);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA(deep, 0.7);
  ctx.lineWidth = 0.007;
  ctx.stroke();
}

/* ---------- heart ---------- */

/**
 * The heart, anterior view: a cone lying on its side, broad at the base where
 * the great vessels leave and tapering to an apex that points down, forward
 * and to the anatomical left — which is why you feel your heartbeat on the
 * left of your chest even though the organ sits in the middle.
 *
 * The valentine shape taught in primary school is the one thing a student has
 * to unlearn, and it costs them the two facts that matter. First, the surface
 * grooves are not decoration: the atrioventricular groove and the anterior
 * interventricular groove are the external boundaries of the four chambers, so
 * a heart with grooves is a heart whose chambers can be found from outside.
 * Second, the coronary arteries run in those grooves, on the outside of the
 * heart — which is why an organ full of blood can still starve, and why a
 * blockage there is a heart attack.
 */
function drawHeart(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // Ventricular systole occupies roughly the first third of the cycle. The
  // heart gets *smaller* when it contracts, which is worth showing correctly.
  const sys = pulse < 0.4 ? Math.sin((pulse / 0.4) * Math.PI) : 0;
  const k = 1 - 0.055 * sys;
  const c = (pts: Array<[number, number]>): Pt[] =>
    pts.map(([px, py]) => ({ x: px * k, y: py * k }));

  const body = c([
    [-0.28, -0.36], [-0.38, -0.20], [-0.40, -0.02],   // right atrial border
    [-0.34, 0.14], [-0.22, 0.28], [-0.04, 0.38],      // inferior border, on the diaphragm
    [0.14, 0.44], [0.30, 0.45],
    [0.40, 0.40], [0.40, 0.40],                       // apex, pinned as a corner
    [0.44, 0.22], [0.45, 0.00], [0.42, -0.18],        // left ventricular border
    [0.34, -0.30], [0.20, -0.38], [0.02, -0.40], [-0.14, -0.40],
  ]);

  ctx.save();

  /* Great vessels behind the heart, drawn first so they emerge from the base. */
  // Superior vena cava — blue, on the anatomical right, returning body blood.
  unitTube(ctx, [{ x: -0.30, y: -0.78 }, { x: -0.29, y: -0.52 }, { x: -0.26, y: -0.30 }],
    0.1, p.venous, p.venousDeep);
  // Inferior vena cava, entering the right atrium from below.
  unitTube(ctx, [{ x: -0.18, y: 0.56 }, { x: -0.20, y: 0.40 }, { x: -0.21, y: 0.26 }],
    0.09, p.venous, p.venousDeep);
  // Aorta: ascends, arches over to the anatomical left and descends behind.
  unitTube(ctx, [
    { x: -0.06, y: -0.32 }, { x: -0.03, y: -0.50 }, { x: 0.06, y: -0.62 },
    { x: 0.20, y: -0.60 }, { x: 0.28, y: -0.46 }, { x: 0.30, y: -0.28 },
    { x: 0.31, y: -0.14 },
  ], 0.105, p.arterial, p.arterialDeep);
  // The three arch branches: head and arms are supplied before anything else.
  for (const bx of [0.0, 0.09, 0.19]) {
    unitTube(ctx, [{ x: bx, y: -0.58 }, { x: bx - 0.015, y: -0.8 }],
      0.045, p.arterial, p.arterialDeep);
  }
  // Pulmonary trunk: leaves the right ventricle carrying *deoxygenated* blood
  // to the lungs, which is why it is drawn blue despite being an artery.
  unitTube(ctx, [{ x: -0.14, y: -0.24 }, { x: -0.10, y: -0.40 }, { x: -0.01, y: -0.50 }],
    0.115, p.venous, p.venousDeep);
  unitTube(ctx, [{ x: -0.03, y: -0.50 }, { x: -0.20, y: -0.54 }, { x: -0.34, y: -0.50 }],
    0.07, p.venous, p.venousDeep);
  unitTube(ctx, [{ x: -0.01, y: -0.50 }, { x: 0.14, y: -0.54 }, { x: 0.26, y: -0.48 }],
    0.07, p.venous, p.venousDeep);
  // Pulmonary veins: the one place veins carry oxygenated blood, so red.
  for (const yy of [-0.28, -0.14]) {
    unitTube(ctx, [{ x: 0.34, y: yy }, { x: 0.48, y: yy - 0.04 }],
      0.05, p.arterial, p.arterialDeep);
  }

  /* Myocardium. Brighter at peak systole: the muscle is squeezing. */
  const base = mix(p.muscle, p.arterial, 0.25 + 0.2 * sys);
  shadeBody(ctx, body, 0, 0.02, 0.46, base,
    mix(p.muscleDeep, "#3a0a12", 0.3), mix(p.muscleLight, "#ffffff", 0.15 + 0.2 * sys),
    { gloss: 0.4 });

  ctx.save();
  curve(ctx, body, true);
  ctx.clip();

  /* The four chambers, read through a translucent wall.
     The right heart, on the anatomical right and so on the viewer's left, is
     thin-walled: it pushes blood a few centimetres to the lungs. The left
     ventricle's wall is three times thicker because it drives the entire body.
     That difference is the single most examined fact about the heart, so the
     left ventricular cavity is drawn small inside a visibly massive wall. */
  const cavity = (pts: Pt[], col: string, a: number) => {
    curve(ctx, pts, true, 0.9);
    ctx.fillStyle = hexA(col, a);
    ctx.fill();
    ctx.strokeStyle = hexA(mix(col, "#000000", 0.4), a * 0.7);
    ctx.lineWidth = 0.006;
    ctx.stroke();
  };
  cavity(c([[-0.26, -0.30], [-0.32, -0.14], [-0.29, 0.02], [-0.16, 0.0],
    [-0.10, -0.14], [-0.13, -0.30]]), p.venous, 0.45);                  // right atrium
  cavity(c([[0.06, -0.32], [0.22, -0.30], [0.31, -0.20], [0.26, -0.07],
    [0.10, -0.08], [0.02, -0.20]]), p.arterial, 0.38);                  // left atrium
  cavity(c([[-0.21, 0.06], [-0.13, 0.23], [0.04, 0.32], [0.15, 0.26],
    [0.05, 0.10], [-0.06, 0.02]]), p.venous, 0.46);                     // right ventricle
  cavity(c([[0.15, 0.05], [0.26, 0.05], [0.32, 0.16], [0.28, 0.29],
    [0.18, 0.28], [0.13, 0.16]]), p.arterial, 0.5);                     // left ventricle

  const avGroove = c([[-0.40, -0.02], [-0.20, 0.08], [0.02, 0.04], [0.22, -0.06], [0.36, -0.24]]);
  const ivGroove = c([[-0.02, 0.04], [0.10, 0.18], [0.24, 0.32], [0.37, 0.39]]);
  // Epicardial fat lies in the grooves in a real heart and makes them legible.
  ctx.strokeStyle = hexA(p.fat, 0.4);
  ctx.lineWidth = 0.032;
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.5);
  ctx.lineWidth = 0.01;
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();

  /* Coronary arteries, running in the grooves on the outside of the muscle.
     They flush at systole because that is when the aortic root fills them. */
  ctx.strokeStyle = hexA(mix(p.arterial, "#ffffff", 0.1 + 0.3 * sys), 0.95);
  ctx.lineWidth = 0.016;
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();
  ctx.lineWidth = 0.009;
  // Diagonal and marginal branches: the tree that feeds the muscle wall.
  for (const br of [
    [[-0.28, 0.02], [-0.30, 0.14], [-0.25, 0.25]],
    [[0.06, 0.11], [0.16, 0.11], [0.25, 0.18]],
    [[0.15, 0.22], [0.06, 0.28], [-0.03, 0.31]],
    [[0.20, -0.07], [0.30, 0.0], [0.36, 0.12]],
  ] as Array<Array<[number, number]>>) {
    curve(ctx, c(br), false);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/* ---------- lungs ---------- */

/**
 * Both lungs with the airway that fills them.
 *
 * Three lobes on the right, two on the left, and a notch bitten out of the
 * left lung's inner border where the heart sits. That asymmetry is not a
 * drawing error a student should ever be shown as symmetry — it is the reason
 * the heart is palpable on the left of the chest. The bases are concave
 * because the diaphragm domes up into them. The bronchial tree is drawn
 * branching all the way into the tissue because the branching *is* the organ:
 * twenty-three generations of division are what turn one windpipe into the
 * surface area of a tennis court.
 */
function drawLungs(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // Inspiration widens the base far more than the apex: the diaphragm does
  // most of the work, so the lungs grow downward and outward, not evenly.
  const br = Math.sin(pulse * TAU - Math.PI / 2) * 0.5 + 0.5;
  const sx = 1 + br * 0.035, sy = 1 + br * 0.06;
  const f = (q: Pt): Pt => ({ x: q.x * sx, y: q.y * sy + br * 0.01 });

  const right: Pt[] = [
    { x: -0.20, y: -0.46 }, { x: -0.34, y: -0.40 }, { x: -0.46, y: -0.20 },
    { x: -0.51, y: 0.06 }, { x: -0.47, y: 0.28 }, { x: -0.38, y: 0.42 },
    { x: -0.27, y: 0.34 }, { x: -0.18, y: 0.20 },
    { x: -0.14, y: -0.02 }, { x: -0.13, y: -0.26 }, { x: -0.15, y: -0.40 },
  ].map(f);
  // The left lung is smaller and its inner border bows away from the midline
  // over the middle of its length: the cardiac notch, where the heart lies.
  const left: Pt[] = [
    { x: 0.20, y: -0.46 }, { x: 0.34, y: -0.40 }, { x: 0.45, y: -0.20 },
    { x: 0.49, y: 0.06 }, { x: 0.45, y: 0.28 }, { x: 0.36, y: 0.42 },
    { x: 0.25, y: 0.34 }, { x: 0.20, y: 0.22 },
    { x: 0.30, y: 0.10 }, { x: 0.30, y: -0.04 }, { x: 0.18, y: -0.16 },
    { x: 0.14, y: -0.30 }, { x: 0.16, y: -0.41 },
  ].map(f);

  ctx.save();

  /* Airway first: trachea, carina, main bronchi. */
  const airway = (pts: Pt[], w: number) => {
    curve(ctx, orient(ribbon(densify(pts, false, 10), () => w / 2)), true, 0.8);
    const g = ctx.createLinearGradient(pts[0].x - w, pts[0].y, pts[0].x + w, pts[0].y);
    g.addColorStop(0, mix(p.airway, "#ffffff", 0.5));
    g.addColorStop(0.5, p.airway);
    g.addColorStop(1, mix(p.airway, p.gutDeep, 0.45));
    ctx.fillStyle = g;
    ctx.fill();
  };
  airway([{ x: 0, y: -0.62 }, { x: 0, y: -0.5 }, { x: 0, y: -0.36 }], 0.085);
  // Tracheal cartilage rings — C-shaped, open at the back, which is why the
  // windpipe stays open when you inhale but can still let food past behind it.
  ctx.strokeStyle = hexA(mix(p.airway, p.gutDeep, 0.4), 0.8);
  ctx.lineWidth = 0.012;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(0, -0.61 + i * 0.042, 0.043, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // The right main bronchus is wider and more vertical than the left — the
  // reason an inhaled peanut almost always ends up in the right lung.
  airway([{ x: -0.01, y: -0.37 }, { x: -0.09, y: -0.30 }, { x: -0.16, y: -0.22 }], 0.065);
  airway([{ x: 0.01, y: -0.37 }, { x: 0.11, y: -0.27 }, { x: 0.19, y: -0.20 }], 0.055);

  for (const [lung, hilum, side] of [
    [right, { x: -0.16, y: -0.22 }, -1],
    [left, { x: 0.19, y: -0.20 }, 1],
  ] as Array<[Pt[], Pt, number]>) {
    shadeBody(ctx, lung, side * 0.06, 0.0, 0.44, p.lung, p.lungDeep,
      mix(p.lung, "#ffffff", 0.45), { gloss: 0.3 });

    ctx.save();
    curve(ctx, lung, true);
    ctx.clip();

    // Bronchial tree, recursively branching from the hilum into the tissue.
    ctx.strokeStyle = hexA(p.airway, 0.85);
    ctx.lineCap = "round";
    const branch = (
      bx: number, by: number, ang: number, len: number, w: number, depth: number, seed: number,
    ) => {
      if (depth <= 0 || len < 0.012) return;
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(ang - 0.2) * len * 0.6, by + Math.sin(ang - 0.2) * len * 0.6, ex, ey,
      );
      ctx.stroke();
      const jitter = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
      branch(ex, ey, ang - 0.52 + jitter * 0.25, len * 0.72, w * 0.68, depth - 1, seed * 3 + 1);
      branch(ex, ey, ang + 0.5 + jitter * 0.25, len * 0.7, w * 0.68, depth - 1, seed * 3 + 2);
    };
    branch(hilum.x, hilum.y, side < 0 ? Math.PI * 0.86 : Math.PI * 0.14, 0.15, 0.03, 5, 7);
    branch(hilum.x, hilum.y, side < 0 ? -Math.PI * 0.74 : -Math.PI * 0.26, 0.11, 0.024, 4, 13);

    // Alveolar texture: the pink foam the branches end in.
    const r = rng(side < 0 ? 21 : 34);
    for (let i = 0; i < 150; i++) {
      const ax = (r() - 0.5) * 1.05, ay = (r() - 0.5) * 1.05;
      const rr = 0.006 + r() * 0.013;
      ctx.beginPath();
      ctx.arc(ax, ay, rr, 0, TAU);
      ctx.fillStyle = hexA(r() > 0.5 ? "#ffffff" : p.lungDeep, 0.17);
      ctx.fill();
    }

    // Fissures. The right lung has two (oblique and horizontal) dividing it
    // into three lobes; the left has only the oblique, giving two.
    ctx.lineWidth = 0.014;
    ctx.strokeStyle = hexA(p.lungDeep, 0.7);
    if (side < 0) {
      curve(ctx, [{ x: -0.47, y: -0.26 }, { x: -0.38, y: -0.02 },
        { x: -0.28, y: 0.2 }, { x: -0.2, y: 0.4 }], false);
      ctx.stroke();
      curve(ctx, [{ x: -0.42, y: -0.1 }, { x: -0.28, y: -0.15 }, { x: -0.14, y: -0.12 }], false);
      ctx.stroke();
    } else {
      curve(ctx, [{ x: 0.46, y: -0.24 }, { x: 0.37, y: 0.0 },
        { x: 0.28, y: 0.22 }, { x: 0.22, y: 0.4 }], false);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- liver ---------- */

/**
 * The liver: a wedge with a big right lobe and a small left one.
 *
 * It is drawn deep maroon rather than brown because that colour is a fact
 * about it — the liver holds about a pint of blood at any moment, more than
 * any other organ, and that is why it is the body's chemical plant. The domed
 * superior surface and the sharp inferior border are the shape the diaphragm
 * presses it into; the falciform ligament between the lobes is the landmark
 * every liver diagram is divided by.
 */
function drawLiver(ctx: CanvasRenderingContext2D, p: AnatomyPalette): void {
  const body: Pt[] = [
    { x: -0.46, y: -0.06 }, { x: -0.42, y: -0.24 }, { x: -0.28, y: -0.35 },
    { x: -0.06, y: -0.38 }, { x: 0.16, y: -0.34 }, { x: 0.36, y: -0.24 },
    { x: 0.45, y: -0.10 },
    { x: 0.38, y: 0.04 }, { x: 0.18, y: 0.12 },
    { x: -0.02, y: 0.20 },
    { x: -0.22, y: 0.28 }, { x: -0.22, y: 0.28 },   // sharp inferior border
    { x: -0.38, y: 0.20 }, { x: -0.45, y: 0.07 },
  ];
  ctx.save();
  shadeBody(ctx, body, -0.1, -0.08, 0.46, p.liver, mix(p.liver, "#2a0710", 0.6),
    p.liverLight, { gloss: 0.42 });

  ctx.save();
  curve(ctx, body, true);
  ctx.clip();
  // Falciform ligament: the fold that divides the lobes, sitting well over to
  // the left because the right lobe is far the larger of the two.
  ctx.strokeStyle = hexA(mix(p.liver, "#2a0710", 0.7), 0.85);
  ctx.lineWidth = 0.02;
  curve(ctx, [{ x: 0.11, y: -0.36 }, { x: 0.09, y: -0.12 }, { x: 0.06, y: 0.16 }], false);
  ctx.stroke();
  ctx.strokeStyle = hexA(p.tendon, 0.5);
  ctx.lineWidth = 0.009;
  curve(ctx, [{ x: 0.104, y: -0.36 }, { x: 0.084, y: -0.12 }, { x: 0.054, y: 0.16 }], false);
  ctx.stroke();

  // Lobule mottling: the liver's surface really is faintly granular, and the
  // hexagonal lobule is the unit the whole organ is built from.
  const r = rng(41);
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.arc((r() - 0.5) * 0.95, (r() - 0.5) * 0.8, 0.008 + r() * 0.014, 0, TAU);
    ctx.fillStyle = hexA(r() > 0.5 ? p.liverLight : "#2a0710", 0.13);
    ctx.fill();
  }
  // Portal vein and hepatic artery entering at the porta hepatis underneath:
  // the liver is the one organ fed mostly by a vein, because that vein carries
  // everything just absorbed from the gut.
  ctx.strokeStyle = hexA(p.venous, 0.7);
  ctx.lineWidth = 0.022;
  curve(ctx, [{ x: -0.02, y: 0.2 }, { x: -0.1, y: 0.08 }, { x: -0.24, y: 0.0 }], false);
  ctx.stroke();
  ctx.strokeStyle = hexA(p.arterial, 0.7);
  ctx.lineWidth = 0.014;
  curve(ctx, [{ x: 0.0, y: 0.2 }, { x: -0.06, y: 0.1 }, { x: -0.16, y: 0.06 }], false);
  ctx.stroke();
  ctx.restore();

  // Gallbladder, tucked under the right lobe: the bile store, and the reason
  // the liver's product reaches the gut in a squirt rather than a trickle.
  shadeBody(ctx, [
    { x: -0.14, y: 0.16 }, { x: -0.06, y: 0.22 }, { x: -0.05, y: 0.32 },
    { x: -0.12, y: 0.38 }, { x: -0.20, y: 0.33 }, { x: -0.21, y: 0.22 },
  ], -0.13, 0.28, 0.11, "#4f8f4a", "#1f4b22", "#a8d47e", { gloss: 0.45 });
  ctx.restore();
}
/* @@ORGANS_START@@ */

/* ---------- stomach ---------- */

/**
 * The stomach in anterior view, with the duodenum it empties into.
 *
 * The shape carries the function. The long convex greater curvature and the
 * short concave lesser curvature exist because the organ grows unevenly, and
 * the notch between them — the incisura angularis — is where the body ends and
 * the antrum that grinds begins. The fundus domes up *above* the level of the
 * opening, which is exactly where swallowed air collects and why a chest film
 * shows a bubble there.
 *
 * The rugae are the answer to "where does all the food go?": an organ the size
 * of a fist holds well over a litre because its lining is thrown into deep
 * longitudinal folds that simply unfold as it fills. And the peristaltic rings
 * travelling down it get deeper as they approach the pylorus, which is why the
 * antrum has the thickest muscle in the whole gut — the stomach is not a bag
 * that stores food, it is a mill that grinds it.
 */
function drawStomach(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  /* Peristalsis. Waves start in the body and travel toward the pylorus,
     deepening as they go; two are in flight at once. Rather than drawing bands
     on a fixed outline, the outline itself is pinched, so the organ genuinely
     narrows where the ring passes. */
  const AX0 = { x: 0.27, y: -0.26 }, AX1 = { x: -0.33, y: 0.14 };
  const adx = AX1.x - AX0.x, ady = AX1.y - AX0.y;
  const alen = Math.hypot(adx, ady) || 1;
  const ux = adx / alen, uy = ady / alen;
  const sOf = (q: Pt): number => ((q.x - AX0.x) * ux + (q.y - AX0.y) * uy) / alen;
  const nOf = (q: Pt): number => (q.x - AX0.x) * -uy + (q.y - AX0.y) * ux;
  const rings = [0, 1].map((k) => ((pulse + k * 0.5) % 1) * 1.2 - 0.1);
  const wave = (s: number): number => {
    let amp = 0;
    for (const s0 of rings) {
      amp += 0.075 * Math.max(0, Math.min(1, (s0 - 0.12) * 1.6))
        * Math.exp(-((s - s0) ** 2) / 0.016);
    }
    return amp;
  };
  /** Pull a point toward the long axis wherever a peristaltic ring is passing. */
  const squeeze = (q: Pt): Pt => {
    const d = wave(sOf(q)) * (nOf(q) < 0 ? -1 : 1);
    return { x: q.x + d * uy, y: q.y - d * ux };
  };

  const land: Pt[] = [
    { x: 0.10, y: -0.31 },                            // cardia: the oesophagus enters
    { x: 0.20, y: -0.43 }, { x: 0.34, y: -0.41 },     // fundus, doming above it
    { x: 0.44, y: -0.26 }, { x: 0.47, y: -0.05 },     // greater curvature
    { x: 0.44, y: 0.15 }, { x: 0.33, y: 0.32 },
    { x: 0.16, y: 0.41 }, { x: -0.02, y: 0.42 },
    { x: -0.17, y: 0.35 }, { x: -0.28, y: 0.26 },     // antrum, narrowing
    { x: -0.36, y: 0.18 },                            // pylorus
    { x: -0.33, y: 0.09 },                            // pyloric canal, upper lip
    { x: -0.23, y: 0.06 }, { x: -0.12, y: 0.10 },     // incisura angularis
    { x: -0.02, y: 0.00 }, { x: 0.05, y: -0.16 },     // lesser curvature
  ];
  const body = densify(land, true, 9).map(squeeze);

  ctx.save();

  /* Oesophagus above and duodenum below, drawn first so the stomach overlaps
     them: this is one continuous tube, not an isolated organ. */
  litTube(ctx, [{ x: 0.035, y: -0.58 }, { x: 0.065, y: -0.45 }, { x: 0.10, y: -0.30 }],
    () => 0.046, p.mucosa, p.mucosaDeep, mix(p.mucosa, "#ffffff", 0.3));
  const duo: Pt[] = [
    { x: -0.34, y: 0.15 }, { x: -0.45, y: 0.15 }, { x: -0.51, y: 0.27 },
    { x: -0.48, y: 0.41 }, { x: -0.35, y: 0.48 }, { x: -0.19, y: 0.46 },
  ];
  litTube(ctx, duo, (u) => 0.068 - 0.010 * u, p.gut, p.gutDeep,
    mix(p.gut, "#ffffff", 0.26));
  // Circular folds already visible through the duodenal wall.
  ctx.save();
  curve(ctx, orient(ribbon(densify(duo, false, 10), (u) => 0.068 - 0.010 * u)), true, 0.7);
  ctx.clip();
  const dacc = arcLengths(densify(duo, false, 10));
  const dline = densify(duo, false, 10);
  ctx.strokeStyle = hexA(p.gutDeep, 0.2);
  ctx.lineWidth = 0.007;
  for (let i = 1; i < 15; i++) {
    const a = along(dline, dacc, i / 15);
    const h = 0.05 + hash2(i, 41) * 0.025;
    ctx.beginPath();
    ctx.moveTo(a.p.x - a.ty * h, a.p.y + a.tx * h);
    ctx.quadraticCurveTo(a.p.x + a.tx * 0.012, a.p.y + a.ty * 0.012,
      a.p.x + a.ty * h, a.p.y - a.tx * h);
    ctx.stroke();
  }
  ctx.restore();

  /* The stomach wall. */
  shadeBody(ctx, body, 0.06, -0.02, 0.5, mix(p.stomach, p.mucosa, 0.5),
    mix(p.stomachDeep, "#7d2f40", 0.35), mix(p.stomach, "#ffffff", 0.42),
    { gloss: 0.3, closeS: 0.35 });

  ctx.save();
  curve(ctx, body, true, 0.35);
  ctx.clip();

  /* The gastric air bubble: swallowed air, and the reason the fundus is the
     highest part of the stomach in a standing person. */
  const bub = ctx.createRadialGradient(0.28, -0.36, 0.01, 0.28, -0.32, 0.2);
  bub.addColorStop(0, hexA("#ffffff", 0.4));
  bub.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = bub;
  ctx.fillRect(-0.5, -0.6, 1, 0.6);

  /* Rugae: longitudinal folds running the length of the organ, deepest along
     the greater curvature and effaced in the antrum, where the wall is muscle
     rather than reservoir. Each is a dark groove with a lit lip beside it. */
  const spine = densify([
    { x: 0.30, y: -0.32 }, { x: 0.28, y: -0.08 }, { x: 0.19, y: 0.17 },
    { x: 0.00, y: 0.31 }, { x: -0.19, y: 0.25 }, { x: -0.31, y: 0.13 },
  ], false, 14);
  const acc = arcLengths(spine);
  const rugae: Pt[][] = [];
  for (let i = -5; i <= 5; i++) {
    const pts: Pt[] = [];
    for (let k = 0; k <= 26; k++) {
      const u = k / 26;
      const a = along(spine, acc, u);
      // Width of the fold field: full in the body, tapering into the antrum.
      const halfw = 0.30 * (0.34 + 0.66 * Math.sin(Math.PI * Math.min(1, u * 1.12)) ** 0.55);
      const wob = (hash2(i * 7.3, k * 1.7) - 0.5) * 0.028;
      const off = (i / 5) * halfw + wob;
      pts.push(squeeze({ x: a.p.x - a.ty * off, y: a.p.y + a.tx * off }));
    }
    rugae.push(pts);
  }
  for (const rg of rugae) {
    curve(ctx, rg, false, 0.9);
    ctx.strokeStyle = hexA(p.mucosaDeep, 0.34);
    ctx.lineWidth = 0.036;
    ctx.stroke();
  }
  for (const rg of rugae) {
    curve(ctx, rg.map((q) => ({ x: q.x + KEY.x * 0.016, y: q.y + KEY.y * 0.016 })), false, 0.9);
    ctx.strokeStyle = hexA(mix(p.mucosa, "#ffffff", 0.4), 0.34);
    ctx.lineWidth = 0.016;
    ctx.stroke();
  }

  /* Shadow in the trough of each travelling ring, so the constriction reads as
     a squeeze rather than a dent in the silhouette. */
  for (const s0 of rings) {
    if (s0 < 0.1 || s0 > 1) continue;
    const cxp = AX0.x + adx * s0, cyp = AX0.y + ady * s0;
    const dep = Math.min(1, (s0 - 0.1) * 1.6);
    const rg = ctx.createLinearGradient(
      cxp + ux * 0.048, cyp + uy * 0.048, cxp - ux * 0.048, cyp - uy * 0.048,
    );
    rg.addColorStop(0, hexA("#ffffff", 0.16 * dep));
    rg.addColorStop(0.34, hexA(p.stomachDeep, 0));
    rg.addColorStop(0.5, hexA(p.stomachDeep, 0.42 * dep));
    rg.addColorStop(0.66, hexA(p.stomachDeep, 0));
    rg.addColorStop(1, hexA("#ffffff", 0.1 * dep));
    ctx.fillStyle = rg;
    ctx.fillRect(-0.6, -0.6, 1.2, 1.2);
  }

  /* Oblique muscle fibres slung over the cardia — the third muscle layer the
     stomach has and no other part of the gut does. */
  ctx.strokeStyle = hexA(p.muscleDeep, 0.13);
  ctx.lineWidth = 0.014;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0.10 - i * 0.012, -0.30);
    ctx.quadraticCurveTo(0.13 + i * 0.03, -0.20 - i * 0.012, 0.11 + i * 0.05, -0.09 - i * 0.01);
    ctx.stroke();
  }
  ctx.restore();

  /* The gastro-omental and gastric arcades: paired arteries that run the whole
     length of both curvatures and send twigs across the wall from each side. A
     stomach is one of the best-supplied organs in the body, which is why an
     ulcer that erodes into one of these bleeds so hard. Drawn inside the wall
     clip, because these vessels lie ON the stomach, not beside it. */
  ctx.save();
  curve(ctx, body, true, 0.35);
  ctx.clip();
  const arcade = (pts: Pt[], w: number, side: number, seed: number) => {
    const line = densify(pts, false, 10);
    const lacc = arcLengths(line);
    for (let i = 0; i < 10; i++) {
      const a = along(line, lacc, 0.06 + (i / 10) * 0.88);
      const rl = 0.10 + hash2(i, seed) * 0.10;
      ctx.strokeStyle = hexA(p.arterial, 0.55);
      ctx.lineWidth = w * 0.5;
      ctx.beginPath();
      ctx.moveTo(a.p.x, a.p.y);
      ctx.quadraticCurveTo(
        a.p.x - a.ty * side * rl * 0.5 + a.tx * rl * 0.25,
        a.p.y + a.tx * side * rl * 0.5 + a.ty * rl * 0.25,
        a.p.x - a.ty * side * rl, a.p.y + a.tx * side * rl,
      );
      ctx.stroke();
    }
    litTube(ctx, pts, () => w, p.arterial, mix(p.arterial, p.arterialDeep, 0.5),
      p.arterialLight, { edge: 0.003 });
  };
  // Right and left gastro-omental along the greater curvature...
  arcade([{ x: 0.17, y: -0.37 }, { x: 0.39, y: -0.20 }, { x: 0.41, y: 0.10 },
    { x: 0.26, y: 0.32 }, { x: 0.02, y: 0.39 }, { x: -0.19, y: 0.32 },
    { x: -0.29, y: 0.21 }], 0.012, -1, 3);
  // ...and the gastric arcade along the lesser curvature.
  arcade([{ x: 0.09, y: -0.29 }, { x: 0.00, y: -0.13 }, { x: -0.09, y: 0.02 },
    { x: -0.20, y: 0.08 }, { x: -0.27, y: 0.10 }], 0.010, 1, 11);
  ctx.restore();

  /* The pyloric sphincter: a ring of muscle thick enough to be palpable, and
     the gate that decides how fast a meal reaches the intestine. */
  ctx.save();
  ctx.translate(-0.345, 0.155);
  ctx.rotate(-0.5);
  const sph: Pt[] = [
    { x: -0.035, y: -0.075 }, { x: 0.035, y: -0.075 }, { x: 0.042, y: 0 },
    { x: 0.035, y: 0.075 }, { x: -0.035, y: 0.075 }, { x: -0.042, y: 0 },
  ];
  shadeBody(ctx, sph, 0, 0, 0.085, mix(p.muscle, p.stomach, 0.45),
    mix(p.muscleDeep, p.stomachDeep, 0.4), mix(p.muscleLight, "#ffffff", 0.25),
    { gloss: 0.42, rim: 0.5, closeS: 0.8 });
  ctx.save();
  curve(ctx, sph, true, 0.8);
  ctx.clip();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.4);
  ctx.lineWidth = 0.007;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-0.05, i * 0.028);
    ctx.quadraticCurveTo(0, i * 0.034, 0.05, i * 0.028);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

/* ---------- small intestine ---------- */

/** One hairpin loop of bowel: out, round the turn, and back alongside itself. */
function bowelLoop(rx: number, ry: number, ang: number, len: number, sep: number): Pt[] {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const px = -dy, py = dx;
  const at = (f: number, o: number): Pt =>
    ({ x: rx + dx * len * f + px * sep * o, y: ry + dy * len * f + py * sep * o });
  return densify([
    at(0, -1), at(0.35, -1.1), at(0.7, -0.98), at(0.93, -0.64),
    at(1, 0), at(0.93, 0.64), at(0.7, 0.98), at(0.35, 1.1), at(0, 1),
  ], false, 12);
}

/**
 * The small intestine: jejunum and ileum, coiled on their mesentery.
 *
 * Six metres of tube is packed into a space the size of a grapefruit, so the
 * only honest way to draw it is as a heap of loops lying over one another —
 * not a tidy serpentine, which is the version students remember and which
 * hides the fact that there is far more gut here than there is room for. Every
 * loop is slung from the same fan of mesentery, whose free edge is as long as
 * the bowel and whose root is fifteen centimetres; the arteries reach the gut
 * inside that fan, arcading and then sending straight vasa recta to the wall.
 *
 * A window is cut in the nearest loop because surface area is the entire point
 * of this organ. Inside are the plicae circulares — permanent transverse
 * shelves of lining, not folds that flatten out like the stomach's rugae — and
 * standing on every shelf, the velvet of the villi. Tube, folds, villi and the
 * microvilli too small to draw multiply the area a few hundred times over,
 * which is how a gut you could hold in two hands absorbs a whole meal.
 */
function drawSmallIntestine(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const gutBase = mix(p.gut, p.mucosa, 0.42);
  const gutDeep = mix(p.gutDeep, p.mucosaDeep, 0.3);
  const W = 0.056;

  /* Loops. Bases are scattered on a small central ellipse and every loop is
     aimed outward with a wide jitter, so the pile packs and overlaps instead
     of opening into a flower. */
  const loops: Array<{ pts: Pt[]; tip: Pt; depth: number; i: number }> = [];
  for (let i = 0; i < 15; i++) {
    const spoke = (i / 15) * TAU;
    const ang = spoke + (hash2(i, 3) - 0.5) * 1.5;
    const len = 0.21 + hash2(i, 7) * 0.20;
    const rr = 0.04 + hash2(i, 11) * 0.13;
    const rx = Math.cos(spoke) * rr * 1.06 + (hash2(i, 13) - 0.5) * 0.06;
    const ry = Math.sin(spoke) * rr * 0.92 + (hash2(i, 17) - 0.5) * 0.06;
    loops.push({
      pts: bowelLoop(rx, ry, ang, len, 0.066),
      tip: { x: rx + Math.cos(ang) * len, y: ry + Math.sin(ang) * len },
      depth: hash2(i, 23),
      i,
    });
  }
  // Back to front. Depth is carried into the colour as well as the draw order:
  // a loop lying under three others is genuinely darker.
  loops.sort((a, b) => a.depth - b.depth);

  ctx.save();

  /* Mesentery: a translucent sheet slung between the root and every loop. It
     is a membrane, not a backdrop, so it is drawn per loop and lets what is
     behind it show through, exactly as it does when it is held to the light. */
  for (const lp of loops) {
    curve(ctx, [{ x: 0, y: 0 }, lp.pts[2], lp.pts[Math.floor(lp.pts.length / 2)],
      lp.pts[lp.pts.length - 3]], true, 0.5);
    ctx.fillStyle = hexA(mix(p.fat, p.mucosa, 0.25), 0.5);
    ctx.fill();
  }

  /* The superior mesenteric artery, arcading in the fan before it reaches the
     wall — a blocked branch can still be fed round the far side of the arch. */
  for (const lp of loops) {
    const tip = lp.pts[Math.floor(lp.pts.length / 2)];
    ctx.strokeStyle = hexA(p.arterial, 0.8);
    ctx.lineWidth = 0.011;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(tip.x * 0.4 + tip.y * 0.18, tip.y * 0.4 - tip.x * 0.18,
      tip.x * 0.86, tip.y * 0.86);
    ctx.stroke();
    ctx.lineWidth = 0.0055;
    for (let k = -1; k <= 1; k += 2) {
      const q = lp.pts[Math.floor(lp.pts.length * (0.5 + k * 0.2))];
      ctx.beginPath();
      ctx.moveTo(tip.x * 0.84, tip.y * 0.84);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
  }

  /* The loops. */
  for (const lp of loops) {
    const d = 0.3 + 0.7 * lp.depth;
    const base = mix(mix(gutDeep, "#2b0f08", 0.25), gutBase, d);
    const deep = mix(mix(gutDeep, "#2b0f08", 0.35), gutDeep, d);
    const light = mix(base, "#ffffff", 0.3 * d);
    litCoil(ctx, lp.pts, W, base, deep, light);
    ctx.save();
    curve(ctx, orient(ribbon(lp.pts, () => W)), true, 0.7);
    ctx.clip();
    // What is actually visible on the outside of bowel is not the folds — they
    // are internal — but the serosal vessels running round the tube under a
    // wet, transparent membrane. Fine, red, and slightly irregular.
    const acc = arcLengths(lp.pts);
    for (let k = 1; k < 8; k++) {
      const a = along(lp.pts, acc, k / 8 + (hash2(k, lp.i) - 0.5) * 0.06);
      const lean = 1.2 + (hash2(k, lp.i + 5) - 0.5) * 2.4;
      ctx.strokeStyle = hexA(p.arterial, 0.13 + 0.08 * hash2(k, lp.i + 9));
      ctx.lineWidth = 0.0035;
      ctx.beginPath();
      ctx.moveTo(a.p.x - a.ty * W, a.p.y + a.tx * W);
      ctx.quadraticCurveTo(a.p.x + a.tx * W * lean, a.p.y + a.ty * W * lean,
        a.p.x + a.ty * W + a.tx * W * lean * 0.7,
        a.p.y - a.tx * W + a.ty * W * lean * 0.7);
      ctx.stroke();
    }
    // Mottling. Bowel is not extruded plastic; its wall has thicker and
    // thinner patches and they catch the light unevenly.
    for (let k = 0; k < 16; k++) {
      const a = along(lp.pts, acc, hash2(k, lp.i + 61));
      const off = (hash2(k, lp.i + 67) - 0.5) * W * 1.5;
      const bx = a.p.x - a.ty * off, by = a.p.y + a.tx * off;
      const br = W * (0.35 + hash2(k, lp.i + 71) * 0.5);
      const mg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      const tone = hash2(k, lp.i + 73) > 0.5 ? "#ffffff" : deep;
      mg.addColorStop(0, hexA(tone, 0.14));
      mg.addColorStop(1, hexA(tone, 0));
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fill();
    }
    const u = (pulse + hash2(lp.i, 29)) % 1;
    const a = along(lp.pts, acc, u);
    const cg = ctx.createRadialGradient(a.p.x, a.p.y, 0, a.p.x, a.p.y, W * 1.5);
    cg.addColorStop(0, hexA(deep, 0.55));
    cg.addColorStop(1, hexA(deep, 0));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(a.p.x, a.p.y, W * 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* The cut window, on the front loop: plicae circulares carrying villi. */
  const front = loops[loops.length - 1];
  const acc = arcLengths(front.pts);
  const a0 = along(front.pts, acc, 0.60), a1 = along(front.pts, acc, 0.80);
  const cx = (a0.p.x + a1.p.x) / 2, cy = (a0.p.y + a1.p.y) / 2;
  const ang = Math.atan2(a1.p.y - a0.p.y, a1.p.x - a0.p.x);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  const winL = 0.115, winH = W * 0.8;
  const win: Pt[] = [
    { x: -winL, y: 0 }, { x: -winL * 0.55, y: -winH }, { x: winL * 0.55, y: -winH },
    { x: winL, y: 0 }, { x: winL * 0.55, y: winH }, { x: -winL * 0.55, y: winH },
  ];
  curve(ctx, win, true, 0.85);
  const wg = ctx.createLinearGradient(0, -winH, 0, winH);
  wg.addColorStop(0, mix(p.mucosa, "#ffffff", 0.4));
  wg.addColorStop(0.45, p.mucosa);
  wg.addColorStop(1, p.mucosaDeep);
  ctx.fillStyle = wg;
  ctx.fill();
  ctx.save();
  curve(ctx, win, true, 0.85);
  ctx.clip();
  // Plicae circulares: shelves standing off the wall, each running most of the
  // way round the tube, so in a cut window they read as crescents.
  const plica = (x: number, dx: number): void => {
    ctx.beginPath();
    ctx.moveTo(x + dx - 0.010, -winH);
    ctx.quadraticCurveTo(x + dx + 0.016, 0, x + dx - 0.010, winH);
  };
  for (let i = -2; i <= 2; i++) {
    plica(i * 0.046, 0);
    ctx.strokeStyle = hexA(p.mucosaDeep, 0.6);
    ctx.lineWidth = 0.022;
    ctx.stroke();
  }
  // Villi: the velvet. Each is a millimetre of finger with a capillary and a
  // lacteal inside, and drawn as the dense fringe it looks like down a scope.
  for (let i = 0; i < 420; i++) {
    const vx = -winL + hash2(i, 31) * winL * 2;
    const vy = -winH + hash2(i, 37) * winH * 2;
    const h = 0.009 + hash2(i, 41) * 0.007;
    ctx.strokeStyle = hexA(mix(p.mucosa, i % 3 ? "#ffffff" : p.mucosaDeep, 0.5), 0.5);
    ctx.lineWidth = 0.0045;
    ctx.beginPath();
    ctx.moveTo(vx, vy + h / 2);
    ctx.lineTo(vx + 0.0015, vy - h / 2);
    ctx.stroke();
  }
  // The lit crest of each shelf, drawn over the villi so the folds stand out
  // of the velvet rather than under it.
  for (let i = -2; i <= 2; i++) {
    plica(i * 0.046, -0.007);
    ctx.strokeStyle = hexA(mix(p.mucosa, "#ffffff", 0.6), 0.75);
    ctx.lineWidth = 0.008;
    ctx.stroke();
  }
  ctx.restore();
  // The cut edge of the wall itself.
  curve(ctx, win, true, 0.85);
  ctx.strokeStyle = hexA(mix(gutDeep, "#000000", 0.25), 0.85);
  ctx.lineWidth = 0.010;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/* ---------- large intestine ---------- */

/**
 * The large intestine, anterior view: caecum, colon, sigmoid and rectum.
 *
 * The colon frames the small bowel rather than coiling inside it, and it is
 * drawn in its real position — caecum and ascending colon on the patient's
 * right, which is the viewer's left; transverse colon sagging across on its
 * own mesentery; splenic flexure sitting visibly higher than the hepatic one,
 * because the spleen is tucked further up under the ribs than the liver's
 * lower edge. A student who has this picture can say which side an appendix is
 * on, and that is a question that has to be answered correctly at 3am.
 *
 * Three features tell colon from small bowel at a glance and all three are
 * drawn: the haustra, which are the pouches it is puckered into; the taeniae
 * coli, three flat ribbons of longitudinal muscle that are shorter than the
 * gut they run along and are the reason it puckers at all; and the appendices
 * epiploicae, little pendulous tags of fat hanging off the free surface.
 */
function drawLargeIntestine(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const base = mix(p.gut, p.fat, 0.22);
  const deep = p.gutDeep;
  const light = mix(base, "#ffffff", 0.4);
  const W = 0.062;
  const HAUSTRA = 21;

  const land: Pt[] = [
    { x: -0.34, y: 0.40 },                            // caecum, in the right iliac fossa
    { x: -0.36, y: 0.22 }, { x: -0.38, y: 0.02 },     // ascending colon
    { x: -0.37, y: -0.18 }, { x: -0.32, y: -0.30 },   // hepatic flexure
    { x: -0.20, y: -0.33 }, { x: -0.05, y: -0.22 },   // transverse colon, sagging
    { x: 0.11, y: -0.25 }, { x: 0.24, y: -0.34 },     // splenic flexure, sitting higher
    { x: 0.34, y: -0.33 }, { x: 0.38, y: -0.18 },
    { x: 0.39, y: 0.04 }, { x: 0.36, y: 0.24 },       // descending colon
    { x: 0.30, y: 0.38 }, { x: 0.17, y: 0.42 },       // sigmoid
    { x: 0.06, y: 0.37 }, { x: 0.01, y: 0.44 },
    { x: 0.01, y: 0.58 },                             // rectum
  ];
  const centre = densify(land, false, 22);
  const acc = arcLengths(centre);
  const n = centre.length;

  /** Caecal pouch at the start, narrow sigmoid, ampulla at the end. */
  const profile = (u: number): number =>
    1
    + 0.50 * Math.exp(-(u ** 2) / 0.0035)             // caecum, the widest part of all
    - 0.18 * Math.exp(-((u - 0.85) ** 2) / 0.005)     // sigmoid, the narrowest
    + 0.20 * clamp01((u - 0.90) / 0.06)               // rectal ampulla
    - 0.30 * clamp01((u - 0.965) / 0.035);            // narrowing into the anal canal
  /** The pouching itself, gone by the rectum, which has no taeniae to pucker it. */
  const sacc = (u: number): number =>
    1 + 0.20 * Math.cos(TAU * u * HAUSTRA) * (1 - clamp01((u - 0.86) / 0.09));
  const hw = (u: number): number => W * profile(u) * sacc(u);
  const outline = orient(ribbon(centre, hw));

  ctx.save();

  /* Appendices epiploicae hang off the free surface, so they go behind the
     tube: small pendulous fat tags, and the give-away that this is colon. */
  for (let i = 0; i < 16; i++) {
    const u = 0.05 + (i / 16) * 0.80;
    const a = along(centre, acc, u);
    const side = hash2(i, 3) > 0.45 ? 1 : -1;
    const r = 0.013 + hash2(i, 5) * 0.011;
    const d = hw(u) + r * 0.55;
    // They hang, so each tag is displaced a little downward whatever the
    // orientation of the gut it grows from.
    const fx = a.p.x - a.ty * side * d, fy = a.p.y + a.tx * side * d + r * 0.5;
    const fg = ctx.createRadialGradient(fx + KEY.x * r * 0.5, fy + KEY.y * r * 0.5, 0, fx, fy, r);
    fg.addColorStop(0, mix(p.fat, "#ffffff", 0.45));
    fg.addColorStop(0.55, mix(p.fat, base, 0.4));
    fg.addColorStop(1, mix(p.fat, p.gutDeep, 0.5));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(fx, fy, r * 0.82, r * 1.15, (hash2(i, 9) - 0.5) * 0.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexA(mix(p.fat, p.gutDeep, 0.55), 0.4);
    ctx.lineWidth = 0.0035;
    ctx.stroke();
  }

  /* The colon wall, scalloped by the haustra. */
  curve(ctx, outline, true, 0.6);
  ctx.fillStyle = base;
  ctx.fill();

  ctx.save();
  curve(ctx, outline, true, 0.6);
  ctx.clip();
  // Cylinder shading: dark side away from the key, highlight toward it.
  const pass = (lw: number, col: string, k: number, alpha = 1): void => {
    ctx.save();
    ctx.translate(KEY.x * W * k, KEY.y * W * k);
    polyPath(ctx, centre, false);
    ctx.strokeStyle = alpha < 1 ? hexA(col, alpha) : col;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  };
  pass(W * 3, deep, -0.35);
  pass(W * 2.1, base, 0.2);
  pass(W * 1.1, light, 0.55);
  pass(W * 0.34, mix(light, "#ffffff", 0.55), 0.66, 0.4);

  /* Semilunar folds: at every constriction the wall folds inward, and the
     shelf it makes runs right across the lumen. This is what makes the colon
     read as a string of pouches rather than a hose. */
  for (let k = 0; k < HAUSTRA; k++) {
    const u = (k + 0.5) / HAUSTRA;
    if (u > 0.88) break;
    const a = along(centre, acc, u);
    const w = hw(u) * 1.25;
    const bow = 0.35;
    ctx.beginPath();
    ctx.moveTo(a.p.x - a.ty * w, a.p.y + a.tx * w);
    ctx.quadraticCurveTo(a.p.x + a.tx * w * bow, a.p.y + a.ty * w * bow,
      a.p.x + a.ty * w, a.p.y - a.tx * w);
    ctx.strokeStyle = hexA(mix(deep, "#000000", 0.15), 0.5);
    ctx.lineWidth = 0.014;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.p.x - a.ty * w + KEY.x * 0.012, a.p.y + a.tx * w + KEY.y * 0.012);
    ctx.quadraticCurveTo(
      a.p.x + a.tx * w * bow + KEY.x * 0.012, a.p.y + a.ty * w * bow + KEY.y * 0.012,
      a.p.x + a.ty * w + KEY.x * 0.012, a.p.y - a.tx * w + KEY.y * 0.012);
    ctx.strokeStyle = hexA(mix(light, "#ffffff", 0.4), 0.4);
    ctx.lineWidth = 0.006;
    ctx.stroke();
  }

  /* Taenia coli: the flat band of longitudinal muscle running the whole length
     on the surface facing us. It is shorter than the gut it is stitched to,
     which is precisely why the gut gathers into pouches behind it. */
  for (const off of [0.0, -0.62]) {
    const band: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = centre[i];
      const nxt = centre[Math.min(n - 1, i + 1)], prv = centre[Math.max(0, i - 1)];
      const dx = nxt.x - prv.x, dy = nxt.y - prv.y;
      const l = Math.hypot(dx, dy) || 1;
      band.push({ x: a.x - (dy / l) * hw(u) * off, y: a.y + (dx / l) * hw(u) * off });
    }
    polyPath(ctx, band, false);
    ctx.strokeStyle = hexA(mix(base, "#ffffff", 0.35), off === 0 ? 0.5 : 0.32);
    ctx.lineWidth = W * (off === 0 ? 0.42 : 0.34);
    ctx.stroke();
    polyPath(ctx, band.map((q) => ({ x: q.x - KEY.x * 0.008, y: q.y - KEY.y * 0.008 })), false);
    ctx.strokeStyle = hexA(deep, 0.22);
    ctx.lineWidth = W * 0.1;
    ctx.stroke();
  }

  /* A mass movement: the slow, powerful wave that shifts a whole column of
     stool at once, a few times a day rather than continuously. */
  const u = (pulse * 1.1) % 1;
  const a = along(centre, acc, u);
  const mg = ctx.createRadialGradient(a.p.x, a.p.y, 0, a.p.x, a.p.y, W * 2.6);
  mg.addColorStop(0, hexA(deep, 0.5));
  mg.addColorStop(1, hexA(deep, 0));
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(a.p.x, a.p.y, W * 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();

  curve(ctx, outline, true, 0.6);
  ctx.strokeStyle = hexA(mix(deep, "#000000", 0.3), 0.7);
  ctx.lineWidth = 0.008;
  ctx.stroke();

  /* The caecum: a blind pouch below the point where the ileum arrives, closed
     at its lower end. Everything the small bowel has finished with drops into
     it, and it is the one part of the colon that has to be a dead end. */
  const caecum: Pt[] = [
    { x: -0.44, y: 0.26 }, { x: -0.30, y: 0.24 }, { x: -0.22, y: 0.34 },
    { x: -0.24, y: 0.47 }, { x: -0.34, y: 0.53 }, { x: -0.44, y: 0.47 },
    { x: -0.47, y: 0.36 },
  ];
  shadeBody(ctx, caecum, -0.34, 0.38, 0.16, base, deep, light, { gloss: 0.3 });
  ctx.save();
  curve(ctx, caecum, true);
  ctx.clip();
  // Two haustral creases, so the pouch reads as colon rather than a balloon.
  for (const yy of [0.34, 0.45]) {
    ctx.beginPath();
    ctx.moveTo(-0.48, yy);
    ctx.quadraticCurveTo(-0.34, yy + 0.03, -0.20, yy - 0.01);
    ctx.strokeStyle = hexA(mix(deep, "#000000", 0.15), 0.4);
    ctx.lineWidth = 0.014;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.48, yy - 0.011);
    ctx.quadraticCurveTo(-0.34, yy + 0.019, -0.20, yy - 0.021);
    ctx.strokeStyle = hexA(mix(light, "#ffffff", 0.4), 0.35);
    ctx.lineWidth = 0.006;
    ctx.stroke();
  }
  ctx.restore();

  /* The appendix: a blind worm of gut hanging off the back of the caecum,
     packed with lymphoid tissue. Famous entirely for what happens when the
     narrowest tube in the abdomen blocks. */
  litTube(ctx, [
    { x: -0.33, y: 0.46 }, { x: -0.28, y: 0.57 }, { x: -0.18, y: 0.61 },
    { x: -0.09, y: 0.56 },
  ], (v) => 0.016 - 0.004 * v, base, deep, light);

  /* The terminal ileum arriving through the ileocaecal valve — a one-way door,
     which is why the colon's bacteria stay out of the small bowel. */
  const il = mix(p.gut, p.mucosa, 0.45);
  litTube(ctx, [
    { x: 0.12, y: 0.22 }, { x: -0.02, y: 0.27 }, { x: -0.16, y: 0.30 },
    { x: -0.27, y: 0.32 },
  ], (v) => 0.040 - 0.004 * v, il, p.gutDeep, mix(il, "#ffffff", 0.4));
  // The cut end of the ileum, showing the lumen it was carrying.
  ctx.beginPath();
  ctx.ellipse(0.12, 0.22, 0.012, 0.040, 0.32, 0, TAU);
  ctx.fillStyle = p.mucosaDeep;
  ctx.fill();
  ctx.strokeStyle = hexA(mix(il, "#000000", 0.3), 0.7);
  ctx.lineWidth = 0.005;
  ctx.stroke();
  // The valve itself: two lips of ileum pushed into the caecum's lumen.
  ctx.beginPath();
  ctx.ellipse(-0.28, 0.32, 0.016, 0.040, 0.1, 0, TAU);
  ctx.fillStyle = hexA(p.mucosaDeep, 0.5);
  ctx.fill();
  ctx.strokeStyle = hexA(mix(p.mucosa, "#ffffff", 0.4), 0.45);
  ctx.lineWidth = 0.005;
  ctx.stroke();

  /* The external anal sphincter: a ring of skeletal muscle, and the one place
     in the whole gut where the decision is voluntary. */
  ctx.beginPath();
  ctx.ellipse(0.01, 0.575, 0.055, 0.032, 0, 0, TAU);
  const ag = ctx.createRadialGradient(0.01 + KEY.x * 0.03, 0.575 + KEY.y * 0.02, 0.004,
    0.01, 0.575, 0.058);
  ag.addColorStop(0, p.muscleLight);
  ag.addColorStop(0.5, p.muscle);
  ag.addColorStop(1, p.muscleDeep);
  ctx.fillStyle = ag;
  ctx.fill();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.7);
  ctx.lineWidth = 0.006;
  ctx.stroke();
  ctx.restore();
}

/* ---------- kidney ---------- */

/**
 * A kidney, cut coronally so cortex, medulla and pelvis are all visible.
 *
 * The bean shape is a consequence of the hilum: artery, vein and ureter all
 * enter at one point on the medial border and the organ is dented inward
 * around them. Everything inside is arranged around that one point. The outer
 * cortex is where the blood is filtered — a million glomeruli, which is why it
 * is drawn granular. The medullary pyramids inside it are striped because the
 * stripes are real: millions of parallel tubules and collecting ducts running
 * down to the tip of each pyramid, where the urine they have concentrated
 * drips into a calyx. Between the pyramids the cortex dips inward as the renal
 * columns, and that is the route the interlobar arteries take.
 *
 * The blood supply is drawn deliberately large. The kidneys are half a per
 * cent of body mass and take a fifth of everything the heart pumps, because
 * they are not fed by that blood, they are filtering it — the whole blood
 * volume, about forty times a day.
 */
function drawKidney(ctx: CanvasRenderingContext2D, p: AnatomyPalette, section: boolean): void {
  const HX = 0.11, HY = 0.0;                    // the hilum: everything aims here
  const outline: Pt[] = [
    { x: 0.03, y: -0.43 },                      // upper pole
    { x: 0.17, y: -0.37 }, { x: 0.24, y: -0.22 },
    { x: 0.21, y: -0.09 }, { x: 0.11, y: -0.01 },  // hilar notch
    { x: 0.21, y: 0.09 }, { x: 0.25, y: 0.24 },
    { x: 0.16, y: 0.39 }, { x: -0.01, y: 0.45 },   // lower pole
    { x: -0.17, y: 0.39 }, { x: -0.27, y: 0.21 },
    { x: -0.31, y: 0.0 }, { x: -0.27, y: -0.21 },
    { x: -0.15, y: -0.38 },
  ];

  ctx.save();

  /* Renal vessels and ureter at the hilum, behind the organ. The vein lies in
     front of the artery in life; both are drawn leaving to the medial side. */
  const cutEnd = (x: number, y: number, rx: number, ry: number, a: number, col: string) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, a, 0, TAU);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = hexA(mix(col, "#000000", 0.4), 0.7);
    ctx.lineWidth = 0.005;
    ctx.stroke();
  };
  litTube(ctx, [{ x: 0.50, y: -0.11 }, { x: 0.31, y: -0.08 }, { x: 0.15, y: -0.05 }],
    (u) => 0.030 - 0.006 * u, p.arterial, p.arterialDeep, p.arterialLight);
  cutEnd(0.50, -0.11, 0.010, 0.030, 0.15, p.arterialDeep);
  litTube(ctx, [{ x: 0.52, y: 0.05 }, { x: 0.33, y: 0.05 }, { x: 0.16, y: 0.03 }],
    (u) => 0.038 - 0.008 * u, p.venous, p.venousDeep, p.venousLight);
  cutEnd(0.52, 0.05, 0.011, 0.038, 0, p.venousDeep);
  litTube(ctx, [{ x: 0.14, y: 0.09 }, { x: 0.24, y: 0.26 }, { x: 0.27, y: 0.52 }],
    (u) => 0.026 - 0.005 * u, p.urinary, p.urinaryDeep, mix(p.urinary, "#ffffff", 0.5));

  /* The organ itself. */
  shadeBody(ctx, outline, -0.06, 0, 0.44, p.kidney, p.kidneyDeep, p.kidneyLight,
    { gloss: 0.34, closeS: 0.85 });

  ctx.save();
  curve(ctx, outline, true, 0.85);
  ctx.clip();

  if (section) {
    /* Cut face. The cortex is the pale tissue and it fills the whole section
       except where a pyramid displaces it — which is why the pale wedges left
       between the pyramids, the renal columns, are cortex too. */
    curve(ctx, outline, true, 0.85);
    const cg = ctx.createRadialGradient(HX - 0.16, -0.1, 0.03, HX - 0.08, 0, 0.5);
    cg.addColorStop(0, mix(p.kidneyLight, "#ffffff", 0.42));
    cg.addColorStop(0.65, mix(p.kidneyLight, "#ffffff", 0.16));
    cg.addColorStop(1, mix(p.kidney, p.kidneyLight, 0.5));
    ctx.fillStyle = cg;
    ctx.fill();

    /* Medullary pyramids: bases at the corticomedullary junction, apices — the
       papillae — pointing at the hilum, each one draining into its own calyx. */
    const papillae: Array<{ x: number; y: number; a: number }> = [];
    for (let i = 0; i < 8; i++) {
      const t = (i / 7 - 0.5) * 2;
      const th = Math.PI + t * 1.24;
      const dx = Math.cos(th), dy = Math.sin(th) * 1.34;
      const bx = HX + dx * 0.315, by = HY + dy * 0.315;
      const ax = HX + dx * 0.125, ay = HY + dy * 0.125;
      const ex = ax - bx, ey = ay - by;
      const el = Math.hypot(ex, ey) || 1;
      const nx = -ey / el * 0.052, ny = ex / el * 0.052;
      const tri: Pt[] = [
        { x: bx + nx, y: by + ny }, { x: bx + nx * 0.55 + ex * 0.5, y: by + ny * 0.55 + ey * 0.5 },
        { x: ax + nx * 0.14, y: ay + ny * 0.14 },
        { x: ax - nx * 0.14, y: ay - ny * 0.14 },
        { x: bx - nx * 0.55 + ex * 0.5, y: by - ny * 0.55 + ey * 0.5 },
        { x: bx - nx, y: by - ny },
      ];
      curve(ctx, tri, true, 0.3);
      const pg = ctx.createLinearGradient(bx, by, ax, ay);
      pg.addColorStop(0, mix(p.kidneyDeep, p.kidney, 0.55));
      pg.addColorStop(1, mix(p.kidneyDeep, "#3c0e18", 0.3));
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = hexA(mix(p.kidneyDeep, "#000000", 0.2), 0.35);
      ctx.lineWidth = 0.005;
      ctx.stroke();
      // The stripes: loops of Henle and collecting ducts running in parallel.
      // That countercurrent arrangement is how a kidney makes urine saltier
      // than the blood it came from.
      ctx.strokeStyle = hexA(mix(p.kidneyLight, "#ffffff", 0.5), 0.35);
      ctx.lineWidth = 0.0045;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(bx + nx * (k / 2.4), by + ny * (k / 2.4));
        ctx.lineTo(ax + nx * (k / 9), ay + ny * (k / 9));
        ctx.stroke();
      }
      papillae.push({ x: ax + ex * 0.2, y: ay + ey * 0.2, a: Math.atan2(ey, ex) });
      // Interlobar artery, climbing the renal column beside the pyramid, then
      // arching along its base as an arcuate artery — a vessel that runs
      // exactly along the boundary between cortex and medulla.
      ctx.strokeStyle = hexA(mix(p.arterial, p.arterialDeep, 0.3), 0.55);
      ctx.lineWidth = 0.006;
      ctx.beginPath();
      ctx.moveTo(HX + dx * 0.07, HY + dy * 0.07);
      ctx.lineTo(bx + nx * 1.28, by + ny * 1.28);
      ctx.stroke();
      ctx.lineWidth = 0.005;
      ctx.beginPath();
      ctx.moveTo(bx + nx * 1.22, by + ny * 1.22);
      ctx.quadraticCurveTo(bx - ex * 0.1, by - ey * 0.1, bx - nx * 1.22, by - ny * 1.22);
      ctx.stroke();
      // Interlobular twigs climbing into the cortex to reach the glomeruli.
      ctx.lineWidth = 0.0035;
      for (let k = -2; k <= 2; k++) {
        const px = bx + nx * (k / 2.4), py = by + ny * (k / 2.4);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - ex * 0.2, py - ey * 0.2);
        ctx.stroke();
      }
    }

    /* Glomeruli: the specks in the cortex where filtration actually happens. */
    ctx.save();
    curve(ctx, outline, true, 0.85);
    ctx.clip();
    for (let i = 0; i < 220; i++) {
      const a = hash2(i, 3) * TAU;
      const r = 0.31 + hash2(i, 7) * 0.10;
      const gx = HX + Math.cos(a) * r * 1.02 - 0.02, gy = HY + Math.sin(a) * r * 1.3;
      ctx.fillStyle = hexA(mix(p.arterial, p.kidneyDeep, 0.4), 0.4);
      ctx.beginPath();
      ctx.arc(gx, gy, 0.006, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* The renal sinus: the hollow round the pelvis, packed with fat, which is
       why a scan of a kidney has a bright middle. */
    curve(ctx, [
      { x: 0.20, y: -0.20 }, { x: 0.14, y: -0.02 }, { x: 0.20, y: 0.19 },
      { x: 0.06, y: 0.26 }, { x: -0.06, y: 0.10 }, { x: -0.06, y: -0.10 },
      { x: 0.06, y: -0.26 },
    ], true, 0.8);
    ctx.fillStyle = hexA(p.fat, 0.45);
    ctx.fill();

    /* Renal pelvis: the funnel where the major calyces join and, at the hilum,
       become the ureter. Three lobes reaching in for three groups of papillae. */
    curve(ctx, [
      { x: 0.155, y: 0.03 }, { x: 0.10, y: 0.17 }, { x: 0.02, y: 0.21 },
      { x: 0.045, y: 0.09 }, { x: 0.015, y: 0.0 }, { x: 0.045, y: -0.09 },
      { x: 0.02, y: -0.21 }, { x: 0.10, y: -0.17 },
    ], true, 0.7);
    const peg = ctx.createLinearGradient(0.0, -0.2, 0.18, 0.2);
    peg.addColorStop(0, hexA(mix(p.urinary, "#ffffff", 0.55), 0.85));
    peg.addColorStop(1, hexA(p.urinaryDeep, 0.7));
    ctx.fillStyle = peg;
    ctx.fill();
    ctx.strokeStyle = hexA(p.urinaryDeep, 0.6);
    ctx.lineWidth = 0.007;
    ctx.stroke();

    /* Minor calyces, drawn last so each cup is seen sitting over the pelvis it
       drains into rather than buried under it. */
    for (const q of papillae) {
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, 0.028, 0.017, q.a, 0, TAU);
      ctx.fillStyle = hexA(mix(p.urine, "#ffffff", 0.4), 0.7);
      ctx.fill();
      ctx.strokeStyle = hexA(p.urinaryDeep, 0.5);
      ctx.lineWidth = 0.004;
      ctx.stroke();
    }
  } else {
    /* Intact: the fibrous capsule, and the surface vessels showing through it. */
    ctx.strokeStyle = hexA(p.arterial, 0.35);
    ctx.lineWidth = 0.008;
    for (let i = 0; i < 9; i++) {
      const a = -1.1 + (i / 8) * 2.2;
      ctx.beginPath();
      ctx.moveTo(HX + Math.cos(Math.PI + a) * 0.08, HY + Math.sin(Math.PI + a) * 0.1);
      ctx.quadraticCurveTo(
        HX + Math.cos(Math.PI + a) * 0.22, HY + Math.sin(Math.PI + a) * 0.3,
        HX + Math.cos(Math.PI + a * 1.1) * 0.34, HY + Math.sin(Math.PI + a * 1.1) * 0.42,
      );
      ctx.stroke();
    }
  }
  ctx.restore();

  // The fibrous capsule: a tough, glossy, barely elastic bag, which is why a
  // swollen kidney hurts so much.
  curve(ctx, outline, true, 0.85);
  ctx.strokeStyle = hexA(mix(p.kidneyLight, "#ffffff", 0.5), 0.45);
  ctx.lineWidth = 0.008;
  ctx.stroke();
  ctx.restore();
}

/* ---------- gallbladder ---------- */

/**
 * The gallbladder: a pear of stored, concentrated bile, tucked under the liver.
 *
 * It is the one green thing in a body, and the colour is the point — bile is a
 * strong pigment, so the organ is genuinely translucent and glows where light
 * passes through it. It does not make bile; the liver does, continuously. This
 * is the store, and it concentrates what it holds about tenfold by pulling the
 * water back out, so that a fatty meal can be met with a squeeze of something
 * far stronger than the liver could deliver on demand.
 *
 * The cystic duct is drawn with the spiral fold inside it that gives it its
 * name, and the neck is drawn narrow, because that narrow neck is where a
 * stone lodges and why gallstones hurt after a fatty meal and not before.
 */
function drawGallbladder(ctx: CanvasRenderingContext2D, p: AnatomyPalette): void {
  const body: Pt[] = [
    { x: -0.10, y: -0.30 },                       // neck, narrow
    { x: 0.02, y: -0.26 }, { x: 0.13, y: -0.10 },
    { x: 0.20, y: 0.10 }, { x: 0.17, y: 0.31 },   // body widening to the fundus
    { x: 0.02, y: 0.43 }, { x: -0.16, y: 0.40 },
    { x: -0.26, y: 0.22 }, { x: -0.24, y: -0.02 },
    { x: -0.17, y: -0.20 },
  ];

  ctx.save();

  /* Cystic duct, spiralling up to join the common bile duct. */
  const cyst: Pt[] = [{ x: -0.11, y: -0.32 }, { x: -0.02, y: -0.46 },
    { x: 0.12, y: -0.54 }];
  const cw = (u: number) => 0.030 - 0.008 * u;
  litTube(ctx, cyst, cw, p.bile, p.bileDeep, mix(p.bile, "#d8ff9a", 0.6));
  // The spiral valve: a helical ridge inside the duct, showing through the
  // wall as a row of crescents. It is what keeps the duct from collapsing when
  // the gallbladder squeezes.
  ctx.save();
  const cline = densify(cyst, false, 10);
  curve(ctx, orient(ribbon(cline, cw)), true, 0.7);
  ctx.clip();
  const cacc = arcLengths(cline);
  ctx.strokeStyle = hexA(p.bileDeep, 0.5);
  ctx.lineWidth = 0.006;
  for (let i = 1; i < 7; i++) {
    const a = along(cline, cacc, i / 7);
    ctx.beginPath();
    ctx.moveTo(a.p.x - a.ty * 0.03, a.p.y + a.tx * 0.03);
    ctx.quadraticCurveTo(a.p.x + a.tx * 0.02, a.p.y + a.ty * 0.02,
      a.p.x + a.ty * 0.03, a.p.y - a.tx * 0.03);
    ctx.stroke();
  }
  ctx.restore();
  // Common bile duct, carrying it all on to the duodenum.
  litTube(ctx, [{ x: 0.12, y: -0.54 }, { x: 0.24, y: -0.40 }, { x: 0.30, y: -0.18 }],
    (u) => 0.026 + 0.006 * u, p.bile, p.bileDeep, mix(p.bile, "#d8ff9a", 0.5));

  shadeBody(ctx, body, -0.03, 0.12, 0.4, mix(p.bile, "#8a9a5e", 0.25), p.bileDeep,
    mix(p.bile, "#dcff9a", 0.5), { gloss: 0.45 });

  ctx.save();
  curve(ctx, body, true);
  ctx.clip();
  // Light passing through: bile is transparent and deeply coloured, so the
  // fundus glows rather than sitting flat.
  const g = ctx.createRadialGradient(-0.04, 0.14, 0.02, -0.02, 0.18, 0.36);
  g.addColorStop(0, hexA("#b4ff7e", 0.42));
  g.addColorStop(1, hexA("#3f8a2f", 0));
  ctx.fillStyle = g;
  ctx.fillRect(-0.5, -0.5, 1, 1);
  // The lining is thrown into a honeycomb of ridges — it has to fold, because
  // this organ empties down to nothing and fills again several times a day.
  ctx.strokeStyle = hexA(p.bileDeep, 0.07);
  ctx.lineWidth = 0.004;
  for (let i = 0; i < 150; i++) {
    const a = hash2(i, 3) * TAU;
    const r = 0.04 + hash2(i, 7) * 0.32;
    const cx = -0.03 + Math.cos(a) * r, cy = 0.12 + Math.sin(a) * r * 1.15;
    const d = hash2(i, 11) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(d) * 0.024, cy + Math.sin(d) * 0.024);
    ctx.stroke();
  }
  // The flat face where it is pressed against the liver, in shadow.
  const bedg = ctx.createLinearGradient(-0.28, -0.2, 0.05, 0.1);
  bedg.addColorStop(0, hexA(p.bileDeep, 0.4));
  bedg.addColorStop(1, hexA(p.bileDeep, 0));
  ctx.fillStyle = bedg;
  ctx.fillRect(-0.5, -0.5, 1, 1);
  ctx.restore();
  ctx.restore();
}

/* ---------- pancreas ---------- */

/**
 * The pancreas: head in the curve of the duodenum, tail reaching the spleen.
 *
 * It is drawn lobulated rather than smooth because it is a gland — a mass of
 * secretory clusters bound together, not a solid organ — and the duct running
 * its whole length is drawn because the duct and the islets are the pancreas's
 * two jobs in one picture. Enzymes go down the duct into the duodenum, so
 * powerful that they have to be shipped as inactive precursors. Insulin goes
 * straight into the blood from islets that have no duct at all, which is
 * exactly what makes the pancreas both an exocrine and an endocrine gland and
 * why one organ can fail in two entirely different ways.
 */
function drawPancreas(ctx: CanvasRenderingContext2D, p: AnatomyPalette): void {
  ctx.save();

  /* The duodenum curls round the head, and the two share a blood supply so
     closely that a surgeon cannot take one without the other. */
  const duo: Pt[] = [
    { x: -0.26, y: -0.34 }, { x: -0.40, y: -0.22 }, { x: -0.45, y: 0.0 },
    { x: -0.39, y: 0.20 }, { x: -0.24, y: 0.28 },
  ];
  litTube(ctx, duo, () => 0.052, p.gut, p.gutDeep, mix(p.gut, "#ffffff", 0.26));
  ctx.save();
  const dline = densify(duo, false, 10);
  curve(ctx, orient(ribbon(dline, () => 0.052)), true, 0.7);
  ctx.clip();
  const dacc = arcLengths(dline);
  ctx.strokeStyle = hexA(p.gutDeep, 0.22);
  ctx.lineWidth = 0.006;
  for (let i = 1; i < 14; i++) {
    const a = along(dline, dacc, i / 14);
    ctx.beginPath();
    ctx.moveTo(a.p.x - a.ty * 0.05, a.p.y + a.tx * 0.05);
    ctx.quadraticCurveTo(a.p.x + a.tx * 0.012, a.p.y + a.ty * 0.012,
      a.p.x + a.ty * 0.05, a.p.y - a.tx * 0.05);
    ctx.stroke();
  }
  ctx.restore();

  /* The common bile duct comes down behind the head of the pancreas to reach
     the duodenum, and the two ducts share one opening — which is why a stone
     in the bile duct can set off a pancreatitis. */
  litTube(ctx, [{ x: -0.08, y: -0.44 }, { x: -0.19, y: -0.30 }, { x: -0.245, y: -0.10 },
    { x: -0.30, y: 0.04 }, { x: -0.35, y: 0.11 }], (u) => 0.017 - 0.003 * u,
  mix(p.bile, "#9aa86a", 0.35), p.bileDeep, mix(p.bile, "#d3f090", 0.4));

  const spine = densify([
    { x: -0.33, y: 0.09 }, { x: -0.22, y: 0.02 }, { x: -0.05, y: -0.03 },
    { x: 0.13, y: -0.10 }, { x: 0.31, y: -0.20 }, { x: 0.44, y: -0.27 },
  ], false, 14);
  const acc = arcLengths(spine);
  // Thick head, thinning body, tapering tail: the profile is the reason a
  // tumour in the head jaundices a patient early and one in the tail does not.
  const hw = (u: number): number =>
    0.115 * (1 - 0.60 * u) * (1 + (0.05 + 0.09 * u) * Math.sin(u * 39));
  const poly = orient(ribbon(spine, hw));

  curve(ctx, poly, true, 0.45);
  const g = ctx.createLinearGradient(-0.34, 0.14, 0.44, -0.28);
  g.addColorStop(0, mix(p.pancreas, "#ffffff", 0.3));
  g.addColorStop(0.45, p.pancreas);
  g.addColorStop(1, p.pancreasDeep);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA(mix(p.pancreasDeep, "#000000", 0.3), 0.65);
  ctx.lineWidth = 0.007;
  ctx.stroke();

  ctx.save();
  curve(ctx, poly, true, 0.45);
  ctx.clip();

  /* Lobules: this is what a gland looks like close up. */
  for (let i = 0; i < 120; i++) {
    const u = hash2(i, 5);
    const a = along(spine, acc, u);
    const off = (hash2(i, 9) - 0.5) * hw(u) * 2.1;
    const lx = a.p.x - a.ty * off, ly = a.p.y + a.tx * off;
    const r = 0.020 + 0.014 * hash2(i, 13);
    // Each lobule is a soft dome with a crease under its lower-right shoulder,
    // so the surface reads as packed clusters rather than scattered bubbles.
    const lg = ctx.createRadialGradient(
      lx + KEY.x * r * 0.55, ly + KEY.y * r * 0.55, 0, lx, ly, r);
    lg.addColorStop(0, hexA(mix(p.pancreas, "#ffffff", 0.4), 0.4));
    lg.addColorStop(0.65, hexA(p.pancreas, 0.1));
    lg.addColorStop(1, hexA(p.pancreasDeep, 0.28));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexA(p.pancreasDeep, 0.22);
    ctx.lineWidth = 0.005;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.86, 0.35, 2.4);
    ctx.stroke();
  }

  /* Islets of Langerhans: a hundredth of the gland's mass and all of its fame.
     Paler than the acinar tissue around them, and scattered, because they are
     endocrine islands in an exocrine sea. */
  for (let i = 0; i < 16; i++) {
    const u = 0.05 + hash2(i, 19) * 0.9;
    const a = along(spine, acc, u);
    const off = (hash2(i, 23) - 0.5) * hw(u) * 1.4;
    const ix = a.p.x - a.ty * off, iy = a.p.y + a.tx * off;
    const r = 0.010 + hash2(i, 29) * 0.005;
    const ig = ctx.createRadialGradient(ix, iy, 0, ix, iy, r * 1.6);
    ig.addColorStop(0, hexA("#c9e8ff", 0.85));
    ig.addColorStop(1, hexA("#8fc4e8", 0));
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(ix, iy, r * 1.6, 0, TAU);
    ctx.fill();
  }

  /* The main pancreatic duct, collecting from the whole length and running
     back toward the head. */
  polyPath(ctx, spine, false);
  ctx.strokeStyle = hexA(mix(p.pancreasDeep, "#000000", 0.2), 0.4);
  ctx.lineWidth = 0.017;
  ctx.stroke();
  polyPath(ctx, spine.map((q) => ({ x: q.x + KEY.x * 0.006, y: q.y + KEY.y * 0.006 })), false);
  ctx.strokeStyle = hexA("#f7f8dc", 0.8);
  ctx.lineWidth = 0.010;
  ctx.stroke();
  // Side branches: each drains one leaf of the gland into the main duct.
  ctx.strokeStyle = hexA("#eef0cc", 0.45);
  ctx.lineWidth = 0.0045;
  for (let i = 1; i < 18; i++) {
    const u = i / 18;
    const a = along(spine, acc, u);
    const side = i % 2 ? 1 : -1;
    const l = hw(u) * 0.62;
    ctx.beginPath();
    ctx.moveTo(a.p.x, a.p.y);
    ctx.quadraticCurveTo(a.p.x - a.ty * side * l * 0.6 - a.tx * l * 0.3,
      a.p.y + a.tx * side * l * 0.6 - a.ty * l * 0.3,
      a.p.x - a.ty * side * l, a.p.y + a.tx * side * l);
    ctx.stroke();
  }
  ctx.restore();

  /* Where the two ducts meet the duodenal wall, guarded by one small ring of
     muscle that decides when enzymes and bile are released at all. */
  litTube(ctx, [{ x: -0.33, y: 0.09 }, { x: -0.37, y: 0.11 }],
    () => 0.010, "#eff1cf", "#b6b98d", "#ffffff");
  ctx.beginPath();
  ctx.ellipse(-0.38, 0.11, 0.019, 0.012, 0.3, 0, TAU);
  ctx.fillStyle = hexA(p.muscle, 0.8);
  ctx.fill();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.6);
  ctx.lineWidth = 0.004;
  ctx.stroke();
  ctx.restore();
}

/* ---------- bladder ---------- */

/**
 * The urinary bladder, with the ureters that fill it and the urethra it empties
 * into. `pulse` is how full it is, and it changes the shape as well as the level.
 *
 * It is drawn as a thick muscular dome rather than a balloon because that is
 * what it is: the detrusor, smooth muscle woven in three directions, which is
 * why it can empty completely instead of merely sagging. The ureters pierce
 * the wall obliquely near the base, and that oblique tunnel through the muscle
 * is the valve — as the bladder fills, its own rising pressure squeezes the
 * tunnel shut, so urine cannot be pushed back up toward the kidneys.
 *
 * The trigone between the three openings is drawn smooth because it is the one
 * patch of lining that does not fold: it is stretched taut whatever the bladder
 * is doing, and it is the most sensitive part of the whole organ.
 */
function drawBladder(ctx: CanvasRenderingContext2D, p: AnatomyPalette, fill: number): void {
  const f = clamp01(fill);
  // Empty, it is a thick-walled slit low in the pelvis; full, it is a sphere
  // that rises above the pubic bone and can be felt through the abdomen.
  const s = 0.74 + 0.30 * f;
  const dome: Pt[] = [
    { x: 0, y: -0.34 * s }, { x: 0.24 * s, y: -0.28 * s }, { x: 0.36 * s, y: -0.05 * s },
    { x: 0.33 * s, y: 0.18 * s }, { x: 0.19, y: 0.33 }, { x: 0, y: 0.38 },
    { x: -0.19, y: 0.33 }, { x: -0.33 * s, y: 0.18 * s }, { x: -0.36 * s, y: -0.05 * s },
    { x: -0.24 * s, y: -0.28 * s },
  ];

  ctx.save();

  /* Ureters, arriving from the kidneys above and entering the wall obliquely
     near the base — the reason reflux does not happen in a healthy bladder. */
  for (const side of [1, -1]) {
    litTube(ctx, [
      { x: side * 0.36, y: -0.60 }, { x: side * 0.33, y: -0.34 },
      { x: side * 0.26, y: -0.04 }, { x: side * 0.16, y: 0.16 },
    ], (u) => 0.024 - 0.005 * u, p.urinary, p.urinaryDeep,
    mix(p.urinary, "#ffffff", 0.5));
  }

  shadeBody(ctx, dome, 0, 0.02, 0.4, p.urinary, p.urinaryDeep,
    mix(p.urinary, "#ffffff", 0.5), { gloss: 0.38 });

  ctx.save();
  curve(ctx, dome, true);
  ctx.clip();

  /* Urine, at a real fluid level that rises with filling. */
  const lvl = 0.36 - f * 0.62;
  const ug = ctx.createLinearGradient(0, lvl - 0.03, 0, 0.42);
  ug.addColorStop(0, hexA(mix(p.urine, "#ffffff", 0.45), 0.18));
  ug.addColorStop(0.14, hexA(mix(p.urine, "#ffffff", 0.2), 0.44));
  ug.addColorStop(1, hexA(mix(p.urine, "#b98a1c", 0.35), 0.6));
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.moveTo(-0.5, lvl + 0.012);
  ctx.quadraticCurveTo(0, lvl - 0.018, 0.5, lvl + 0.012);
  ctx.lineTo(0.5, 0.5);
  ctx.lineTo(-0.5, 0.5);
  ctx.closePath();
  ctx.fill();
  // The meniscus, catching the light along its near edge.
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = 0.005;
  ctx.beginPath();
  ctx.moveTo(-0.42, lvl + 0.010);
  ctx.quadraticCurveTo(0, lvl - 0.018, 0.42, lvl + 0.010);
  ctx.stroke();

  /* Detrusor muscle, running in several directions at once. Where the wall is
     stretched thin the bundles show through; where it is slack they bunch. */
  const slack = 1 - 0.55 * f;
  ctx.strokeStyle = hexA(p.urinaryDeep, 0.14 + 0.08 * (1 - f));
  ctx.lineWidth = 0.010 + 0.008 * slack;
  for (let i = 0; i < 7; i++) {
    const yy = -0.30 + i * 0.105;
    ctx.beginPath();
    ctx.moveTo(-0.42, yy);
    ctx.quadraticCurveTo(0, yy + 0.06 * slack + 0.02, 0.42, yy);
    ctx.stroke();
  }
  // A second family running obliquely: the detrusor is a mesh, not a weave,
  // and it is that criss-cross that lets the bladder empty itself completely.
  for (let i = 0; i < 9; i++) {
    const o = -0.4 + i * 0.1;
    ctx.beginPath();
    ctx.moveTo(o - 0.30, -0.44);
    ctx.quadraticCurveTo(o + 0.06 * slack, 0, o + 0.30, 0.44);
    ctx.stroke();
  }
  // Rugae: when it is not full, the lining is thrown into folds that vanish as
  // the bladder stretches. Nothing about the bladder is a fixed shape.
  ctx.strokeStyle = hexA(mix(p.mucosa, p.urinaryDeep, 0.4), 0.3 * (1 - f));
  ctx.lineWidth = 0.012;
  for (let i = 0; i < 14; i++) {
    const a = hash2(i, 3) * TAU;
    const r = hash2(i, 7) * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.quadraticCurveTo(Math.cos(a + 1) * r * 1.3, Math.sin(a + 1) * r * 1.3,
      Math.cos(a + 2) * r * 1.1, Math.sin(a + 2) * r * 1.1);
    ctx.stroke();
  }

  /* The trigone: the smooth triangle between the two ureteric openings and the
     outlet, and the only part of the lining that never folds. */
  curve(ctx, [{ x: -0.17, y: 0.15 }, { x: 0.17, y: 0.15 }, { x: 0, y: 0.36 }],
    true, 0.25);
  ctx.fillStyle = hexA(mix(p.mucosa, "#ffffff", 0.4), 0.55);
  ctx.fill();
  ctx.strokeStyle = hexA(p.urinaryDeep, 0.4);
  ctx.lineWidth = 0.006;
  ctx.stroke();
  for (const side of [1, -1]) {
    ctx.beginPath();
    ctx.ellipse(side * 0.16, 0.155, 0.020, 0.011, side * 0.5, 0, TAU);
    ctx.fillStyle = hexA(p.urinaryDeep, 0.6);
    ctx.fill();
  }
  ctx.restore();

  /* Urethra, and the sphincter that keeps it shut until it is asked not to. */
  litTube(ctx, [{ x: 0, y: 0.35 }, { x: 0, y: 0.5 }, { x: 0, y: 0.62 }],
    () => 0.026, p.urinary, p.urinaryDeep, mix(p.urinary, "#ffffff", 0.5));
  ctx.beginPath();
  ctx.ellipse(0, 0.475, 0.070, 0.024, 0, 0, TAU);
  const sg = ctx.createRadialGradient(KEY.x * 0.04, 0.475 + KEY.y * 0.02, 0.004, 0, 0.475, 0.072);
  sg.addColorStop(0, mix(p.muscleLight, p.urinary, 0.35));
  sg.addColorStop(0.5, mix(p.muscle, p.urinary, 0.3));
  sg.addColorStop(1, p.muscleDeep);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.7);
  ctx.lineWidth = 0.006;
  ctx.stroke();
  ctx.restore();
}

/* ---------- brain ---------- */

/** The cerebrum in left lateral view: frontal pole left, occipital right. */
const CEREBRUM: Pt[] = [
  { x: -0.47, y: -0.02 }, { x: -0.44, y: -0.19 }, { x: -0.32, y: -0.31 },
  { x: -0.12, y: -0.385 }, { x: 0.09, y: -0.375 }, { x: 0.27, y: -0.29 },
  { x: 0.40, y: -0.15 }, { x: 0.435, y: 0.02 }, { x: 0.36, y: 0.14 },
  { x: 0.22, y: 0.16 }, { x: 0.08, y: 0.12 },
  { x: -0.04, y: 0.22 }, { x: -0.20, y: 0.29 }, { x: -0.34, y: 0.25 },
  { x: -0.43, y: 0.13 },
];

/**
 * One wandering, branching sulcus pressed into the cortical sheet.
 *
 * Gyri are the ridges *between* sulci, so the thing actually drawn is the
 * groove, and the ridge appears for free on either side of it. Branching
 * matters: real sulci fork, and a family of parallel grooves reads as corduroy
 * rather than as a brain. The folding is the whole point — it is how a sheet of
 * cortex the size of a pillowcase fits inside a skull, and about two thirds of
 * that sheet is buried in the depths of these grooves where it cannot be seen.
 */
function sulcus(
  into: Array<{ pts: Pt[]; w: number }>,
  x: number, y: number, ang: number, len: number, depth: number,
  seed: number, w: number,
): void {
  const steps = 7;
  const pts: Pt[] = [{ x, y }];
  let px = x, py = y, a = ang;
  for (let i = 0; i < steps; i++) {
    a += (hash2(seed * 3.1 + i, px * 7 + py * 11) - 0.5) * 0.8;
    px += Math.cos(a) * (len / steps);
    py += Math.sin(a) * (len / steps);
    pts.push({ x: px, y: py });
  }
  const sm = densify(pts, false, 4, 0.85);
  into.push({ pts: sm, w });

  if (depth <= 0) return;
  const kids = hash2(seed, 17) > 0.45 ? 2 : 1;
  for (let k = 0; k < kids; k++) {
    const at = Math.min(sm.length - 1, Math.floor(sm.length * (0.5 + 0.28 * k)));
    const q = sm[at], prev = sm[Math.max(0, at - 2)];
    const bs = Math.atan2(q.y - prev.y, q.x - prev.x);
    sulcus(into, q.x, q.y, bs + (k ? 0.9 : -0.9), len * 0.6, depth - 1,
      seed * 1.7 + k * 5.3, w * 0.82);
  }
}

/**
 * The brain in left lateral view: cortex, cerebellum and brainstem.
 *
 * The three parts are drawn in three different textures because they have
 * three different jobs and three genuinely different appearances on a real
 * specimen. The cerebrum is coarsely folded into gyri about a centimetre
 * across. The cerebellum is folded far more finely — its folia are millimetres
 * apart, which is why a cut through it looks like a tree and why it holds more
 * neurons than the whole of the rest of the brain put together. The brainstem
 * is smooth, because it is mostly fibre tracts passing through on their way to
 * the spinal cord.
 *
 * Two grooves are drawn deeper than the rest because they are the landmarks
 * that name the lobes: the lateral fissure, below which everything is temporal
 * lobe, and the central sulcus, with the strip that moves you in front of it
 * and the strip that feels in front of that behind.
 */
function drawBrain(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // The colour at the bottom of a sulcus, and the colour of a gyral crown.
  const dark = mix(p.brainDeep, "#4a2a28", 0.25);
  const lite = p.brainLight;

  ctx.save();

  /* Brainstem: midbrain, pons and medulla, on their way out of the skull. */
  litTube(ctx, [
    { x: 0.02, y: 0.10 }, { x: 0.045, y: 0.22 }, { x: 0.06, y: 0.34 },
    { x: 0.065, y: 0.44 },
  ], (u) => 0.052 - 0.016 * u, mix(p.brain, p.brainDeep, 0.55),
  mix(p.brainDeep, "#000000", 0.35), p.brainLight);
  // The pons: the forward bulge of fibres crossing to the cerebellum. Without
  // it the brainstem is only a stalk, and the cerebellum has nothing to say to.
  const pons: Pt[] = [
    { x: -0.045, y: 0.13 }, { x: 0.045, y: 0.12 }, { x: 0.075, y: 0.20 },
    { x: 0.015, y: 0.27 }, { x: -0.055, y: 0.22 },
  ];
  shadeBody(ctx, pons, 0.01, 0.19, 0.115, mix(p.brain, p.brainDeep, 0.35),
    mix(p.brainDeep, "#000000", 0.3), p.brainLight, { gloss: 0.3, rim: 0.5 });
  ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.2), 0.4);
  ctx.lineWidth = 0.005;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-0.055, 0.19 + i * 0.016);
    ctx.quadraticCurveTo(0.0, 0.195 + i * 0.016, 0.07, 0.19 + i * 0.014);
    ctx.stroke();
  }

  /* Cerebellum, tucked under the back of the cerebrum. */
  const cbl: Pt[] = [
    { x: 0.11, y: 0.10 }, { x: 0.22, y: 0.08 }, { x: 0.32, y: 0.14 },
    { x: 0.345, y: 0.23 }, { x: 0.27, y: 0.32 }, { x: 0.16, y: 0.31 },
    { x: 0.09, y: 0.23 },
  ];
  shadeBody(ctx, cbl, 0.22, 0.21, 0.155, p.cerebellum,
    mix(p.brainDeep, "#000000", 0.15), mix(p.cerebellum, "#ffffff", 0.42),
    { gloss: 0.26 });
  ctx.save();
  curve(ctx, cbl, true);
  ctx.clip();
  // Folia: fine, tightly packed and nearly parallel. This is the cerebellum's
  // signature, and it is what tells it apart from cortex at a glance.
  for (let i = 0; i < 26; i++) {
    const f = i / 25;
    const y0 = 0.055 + f * 0.28;
    ctx.beginPath();
    ctx.moveTo(0.05 + f * 0.05, y0);
    ctx.quadraticCurveTo(0.21 + f * 0.03, y0 - 0.03 + f * 0.02, 0.38 - f * 0.02, y0 - 0.02);
    ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.2), 0.6);
    ctx.lineWidth = 0.0075;
    ctx.stroke();
    ctx.save();
    ctx.translate(KEY.x * 0.007, KEY.y * 0.007);
    ctx.beginPath();
    ctx.moveTo(0.05 + f * 0.05, y0);
    ctx.quadraticCurveTo(0.21 + f * 0.03, y0 - 0.03 + f * 0.02, 0.38 - f * 0.02, y0 - 0.02);
    ctx.strokeStyle = hexA(mix(p.cerebellum, "#ffffff", 0.6), 0.45);
    ctx.lineWidth = 0.0035;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  /* Cerebrum. */
  shadeBody(ctx, CEREBRUM, -0.03, -0.08, 0.48, p.brain, p.brainDeep, p.brainLight,
    { gloss: 0.24, closeS: 0.9 });

  ctx.save();
  curve(ctx, CEREBRUM, true, 0.9);
  ctx.clip();

  /* Sulci grown inward from the whole margin, so the folding covers the
     surface the way it does in life instead of decorating the middle of it.
     Every groove is collected first and then the whole set is stroked twice —
     all the grooves, then all the lit gyral lips — because a lip painted before
     the next groove is drawn would simply be covered over by it. */
  // First flood the whole cortex with the colour of a sulcal depth. What is
  // drawn on top of it are the gyri: everything not covered by a ridge is a
  // groove, which is the right way round — two thirds of the cortical sheet is
  // buried in the depths and never seen from outside.
  curve(ctx, CEREBRUM, true, 0.9);
  ctx.fillStyle = dark;
  ctx.fill();

  const gyri: Array<{ pts: Pt[]; w: number }> = [];
  const dense = densify(CEREBRUM, true, 4, 0.9);
  for (let i = 0; i < 30; i++) {
    const q = dense[Math.floor(((i + 0.5) / 30) * dense.length)];
    const inward = Math.atan2(-0.08 - q.y, -0.03 - q.x) + (hash2(i, 7) - 0.5) * 1.15;
    sulcus(gyri, q.x + (hash2(i, 41) - 0.5) * 0.04, q.y + (hash2(i, 43) - 0.5) * 0.04,
      inward, 0.26, 2, 7 + i * 2.7, 0.056);
  }
  for (let i = 0; i < 20; i++) {
    const sx = -0.36 + hash2(i, 21) * 0.74, sy = -0.32 + hash2(i, 29) * 0.54;
    sulcus(gyri, sx, sy, hash2(i, 33) * TAU, 0.20, 1, 131 + i * 5, 0.052);
  }
  // Each ridge is laid down three times: the shadow it throws into the groove
  // on its dark side, the body of the ridge, and the crown catching the key.
  for (const g of gyri) {
    polyPath(ctx, g.pts.map((q) => ({
      x: q.x - KEY.x * g.w * 0.40, y: q.y - KEY.y * g.w * 0.40,
    })), false);
    ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.45), 0.85);
    ctx.lineWidth = g.w * 1.5;
    ctx.stroke();
  }
  for (const g of gyri) {
    polyPath(ctx, g.pts, false);
    ctx.strokeStyle = mix(p.brain, p.brainDeep, 0.22);
    ctx.lineWidth = g.w * 0.98;
    ctx.stroke();
  }
  for (const g of gyri) {
    polyPath(ctx, g.pts.map((q) => ({
      x: q.x + KEY.x * g.w * 0.34, y: q.y + KEY.y * g.w * 0.34,
    })), false);
    ctx.strokeStyle = hexA(lite, 0.55);
    ctx.lineWidth = g.w * 0.44;
    ctx.stroke();
  }

  /* The two landmark fissures, cut deeper than any ordinary sulcus. */
  const cleft = (pts: Pt[], w: number): void => {
    curve(ctx, pts, false);
    ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.55), 0.85);
    ctx.lineWidth = w;
    ctx.stroke();
    // The lip of cortex on each side of a deep fissure catches the light on the
    // key side and falls into shadow on the other, which is what makes it read
    // as a valley rather than as a line drawn on top.
    curve(ctx, pts.map((q) => ({ x: q.x + KEY.x * w * 0.62, y: q.y + KEY.y * w * 0.62 })), false);
    ctx.strokeStyle = hexA(mix(lite, "#ffffff", 0.25), 0.6);
    ctx.lineWidth = w * 0.34;
    ctx.stroke();
  };
  // Lateral (Sylvian) fissure: everything below it is the temporal lobe.
  cleft([{ x: -0.40, y: 0.11 }, { x: -0.26, y: 0.15 }, { x: -0.08, y: 0.12 },
    { x: 0.06, y: 0.04 }], 0.036);
  // Central sulcus: motor cortex in front of it, sensory cortex behind.
  cleft([{ x: 0.02, y: -0.37 }, { x: -0.02, y: -0.26 }, { x: -0.07, y: -0.16 },
    { x: -0.09, y: -0.06 }, { x: -0.13, y: 0.03 }], 0.026);

  /* Cortical arteries lie on the outside of the brain and dive in, which is
     why a bleed spreads across the surface before it destroys anything. */
  for (let i = 0; i < 6; i++) {
    const y0 = -0.32 + i * 0.115;
    ctx.strokeStyle = hexA(p.arterial, 0.34);
    ctx.lineWidth = 0.008 - i * 0.0006;
    const ox = -0.02 - i * 0.03, oy = 0.09 - i * 0.012;
    ctx.beginPath();
    ctx.moveTo(0.06, 0.05);
    ctx.bezierCurveTo(ox, oy + y0 * 0.3, -0.20 + i * 0.02, y0 * 0.92, -0.38, y0 - 0.03);
    ctx.stroke();
    // A branch or two off each, because arteries divide and lines do not.
    ctx.lineWidth = 0.004;
    for (let k = 0; k < 2; k++) {
      const bx = -0.10 - k * 0.16, by = y0 * (0.6 + k * 0.25);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - 0.05, by + 0.06, bx - 0.11, by + 0.07);
      ctx.stroke();
    }
  }

  /* Activity: a warm wash sweeping the cortex, so "the brain is working" is
     visible without cartoon lightning. */
  if (pulse > 0) {
    const gx = -0.44 + pulse * 0.9;
    const ag = ctx.createRadialGradient(gx, -0.08, 0, gx, -0.08, 0.30);
    ag.addColorStop(0, hexA(mix(p.arterial, "#ffb066", 0.45), 0.2));
    ag.addColorStop(1, hexA(p.arterial, 0));
    ctx.fillStyle = ag;
    ctx.fillRect(-0.5, -0.5, 1, 1);
  }
  ctx.restore();
  ctx.restore();
}

/* ---------- spinal cord ---------- */

/**
 * The spinal cord, with its roots and ganglia.
 *
 * Two swellings are drawn because they are real and they mean something: the
 * cervical and lumbar enlargements, where the cord is visibly fatter because
 * that is where the nerves for the arms and the legs are plugged in. More
 * limb, more cord. The cord itself stops around the first lumbar vertebra and
 * continues as the cauda equina, a spray of loose roots floating in fluid,
 * which is exactly why a lumbar puncture below that level is safe.
 *
 * Every segment has two roots on each side: a dorsal one carrying sensation
 * in, with its ganglion visible as a bead, and a ventral one carrying movement
 * out. They join at once into a single mixed nerve — which is why damage to
 * one spinal nerve costs both feeling and movement in the same strip of body.
 */
function drawSpinalCord(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const centre = densify([
    { x: 0, y: -0.48 }, { x: 0.012, y: -0.28 }, { x: 0, y: -0.05 },
    { x: -0.012, y: 0.14 }, { x: 0, y: 0.30 },
  ], false, 18);
  const acc = arcLengths(centre);
  // Width: two enlargements, cervical high and lumbar low, then the conus.
  const hw = (u: number): number => 0.046
    + 0.019 * Math.exp(-((u - 0.16) ** 2) / 0.006)
    + 0.022 * Math.exp(-((u - 0.70) ** 2) / 0.008)
    - 0.032 * clamp01((u - 0.86) / 0.14);

  ctx.save();

  /* Dura and arachnoid: the sheath, and the cerebrospinal fluid inside it that
     the cord genuinely floats in rather than resting on anything. */
  const sheath = orient(ribbon(centre, (u) => hw(u) + 0.030));
  curve(ctx, sheath, true, 0.7);
  const dg = ctx.createLinearGradient(-0.1, 0, 0.1, 0);
  dg.addColorStop(0, hexA(mix(p.cartilage, "#ffffff", 0.4), 0.42));
  dg.addColorStop(0.5, hexA(p.cartilage, 0.22));
  dg.addColorStop(1, hexA(mix(p.cartilage, "#3d5a6b", 0.4), 0.34));
  ctx.fillStyle = dg;
  ctx.fill();
  ctx.strokeStyle = hexA(mix(p.cartilage, "#2c4653", 0.5), 0.5);
  ctx.lineWidth = 0.006;
  ctx.stroke();

  /* Roots and ganglia, drawn before the cord so they emerge from behind it.
     They slope more and more steeply downward the further down you go, because
     the cord stops growing before the spine does: by the lumbar levels a root
     has to travel several vertebrae below its own segment to reach its exit. */
  for (let i = 0; i < 12; i++) {
    const u = 0.045 + i * 0.072;
    const a = along(centre, acc, u);
    const drop = 0.10 + u * 0.9;                    // radians below horizontal
    const dxr = Math.cos(drop), dyr = Math.sin(drop);
    for (const side of [1, -1]) {
      const rx = a.p.x + side * hw(u), ry = a.p.y;
      const gl = 0.085 + hash2(i, 3) * 0.02;
      const gx = rx + side * dxr * gl, gy = ry + dyr * gl - 0.012;
      // Dorsal root, with the ganglion where all its cell bodies sit.
      litTube(ctx, [{ x: rx, y: ry - 0.012 }, { x: gx, y: gy }], () => 0.0075,
        p.nerve, p.nerveDeep, p.myelin);
      const gg = ctx.createRadialGradient(gx + KEY.x * 0.008, gy + KEY.y * 0.008, 0,
        gx, gy, 0.019);
      gg.addColorStop(0, "#fffbe0");
      gg.addColorStop(0.55, p.nerve);
      gg.addColorStop(1, p.nerveDeep);
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 0.019, 0.012, side * drop, 0, TAU);
      ctx.fill();
      // Ventral root, carrying movement out...
      litTube(ctx, [{ x: rx, y: ry + 0.016 },
        { x: gx + side * 0.004, y: gy + 0.024 }], () => 0.0065,
      p.nerve, p.nerveDeep, p.myelin);
      // ...and the single mixed nerve the two make as soon as they meet, which
      // is why one damaged root costs feeling and movement together.
      litTube(ctx, [
        { x: gx, y: gy + 0.012 },
        { x: gx + side * dxr * 0.09, y: gy + dyr * 0.09 + 0.012 },
        { x: gx + side * dxr * 0.19, y: gy + dyr * 0.19 + 0.02 },
      ], (v) => 0.012 - 0.004 * v, p.nerve, p.nerveDeep, p.myelin);
      for (let k = -1; k <= 1; k += 2) {
        ctx.strokeStyle = hexA(p.nerve, 0.65);
        ctx.lineWidth = 0.0045;
        const bx = gx + side * dxr * 0.18, by = gy + dyr * 0.18 + 0.02;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + side * 0.05, by + k * 0.02 + 0.02,
          bx + side * 0.10, by + k * 0.05 + 0.04);
        ctx.stroke();
      }
    }
  }

  /* The cord itself: white matter outside, because the tracts running up and
     down are wrapped in fatty myelin, and that is what makes it white. */
  litTube(ctx, centre, hw, p.myelin, mix(p.myelin, "#8f7f57", 0.5), "#ffffff");

  /* Grey matter: the butterfly of cell bodies inside, dorsal horns receiving
     and ventral horns sending. It is the one place in the body where the
     colour of a tissue tells you directly what it is made of. */
  ctx.save();
  polyPath(ctx, orient(ribbon(centre, hw)), true);
  ctx.clip();
  for (const side of [1, -1]) {
    const wing: Pt[] = [];
    for (let i = 0; i < centre.length; i++) {
      const u = i / (centre.length - 1);
      wing.push({ x: centre[i].x + side * hw(u) * 0.46, y: centre[i].y });
    }
    polyPath(ctx, wing, false);
    ctx.strokeStyle = hexA(p.greyMatter, 0.75);
    ctx.lineWidth = 0.024;
    ctx.stroke();
  }
  polyPath(ctx, centre, false);
  ctx.strokeStyle = hexA(p.greyMatter, 0.6);
  ctx.lineWidth = 0.012;
  ctx.stroke();
  // Anterior median fissure: the deep groove down the front of the cord.
  polyPath(ctx, centre.map((q) => ({ x: q.x - 0.006, y: q.y })), false);
  ctx.strokeStyle = hexA(mix(p.myelin, "#7a6a45", 0.55), 0.4);
  ctx.lineWidth = 0.006;
  ctx.stroke();
  ctx.restore();

  /* Cauda equina: below the conus the cord has ended, and what continues down
     the canal is a loose spray of roots floating in fluid. */
  const conus = along(centre, acc, 1);
  for (let i = 0; i < 13; i++) {
    const side = (i / 12 - 0.5) * 2;
    ctx.strokeStyle = hexA(p.nerve, 0.7);
    ctx.lineWidth = 0.007;
    ctx.beginPath();
    ctx.moveTo(conus.p.x, conus.p.y - 0.01);
    ctx.quadraticCurveTo(conus.p.x + side * 0.05, conus.p.y + 0.10,
      conus.p.x + side * 0.10, conus.p.y + 0.20 - Math.abs(side) * 0.03);
    ctx.stroke();
  }

  /* A motor volley on its way down. Signals do travel this, and fast. */
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < 2; k++) {
    const u = (pulse + k * 0.5) % 1;
    const a = along(centre, acc, u);
    const g = ctx.createRadialGradient(a.p.x, a.p.y, 0, a.p.x, a.p.y, 0.07);
    g.addColorStop(0, hexA("#ffffff", 0.3));
    g.addColorStop(0.4, hexA("#9fe6ff", 0.22));
    g.addColorStop(1, hexA("#9fe6ff", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(a.p.x, a.p.y, 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/* ---------- muscle ---------- */

/**
 * A skeletal muscle: fusiform belly, a tendon at each end, visible fibres.
 *
 * Contraction is drawn as a shortening AND a thickening, because muscle is
 * essentially incompressible: the belly cannot get shorter without getting
 * fatter, which is the entire reason a flexed bicep bulges. Animating only the
 * length would teach that muscle shrinks, and it does not.
 *
 * The tendons are drawn pearl-white and much narrower than the belly, because
 * collagen in pure tension needs a fraction of the cross-section that muscle
 * needs to generate the same force — and because a tendon has almost no blood
 * supply, which is why it is white and why it heals so slowly. The striations
 * are drawn because they are what "striated muscle" means: the fibres are
 * packed with sarcomeres lined up in register, and the stripes get closer
 * together as the filaments slide past each other and the muscle shortens.
 */
function drawMuscle(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const c = clamp01(pulse);
  const len = 0.86 - 0.16 * c;
  const fat = 1 + 0.42 * c;
  const half = len / 2;
  const belt = (u: number): number => 0.05 + 0.145 * fat * Math.sin(u * Math.PI) ** 0.75;

  ctx.save();

  /* Tendons, each fanning out of the belly and narrowing to its insertion. */
  for (const side of [-1, 1]) {
    litTube(ctx, [
      { x: side * 0.5, y: 0 }, { x: side * (half + 0.06), y: 0 },
      { x: side * (half - 0.02), y: 0 },
    ], (u) => 0.024 + 0.030 * u, p.tendon, mix(p.tendon, "#9b8b62", 0.5), "#ffffff");
    // Collagen runs the length of a tendon in parallel bundles, and that is
    // both why it is so strong in tension and why it shines.
    ctx.save();
    ctx.beginPath();
    ctx.rect(side > 0 ? half - 0.03 : -0.52, -0.07, 0.55, 0.14);
    ctx.clip();
    for (let k = -3; k <= 3; k++) {
      ctx.strokeStyle = hexA(k % 2 ? "#ffffff" : mix(p.tendon, "#9b8b62", 0.45), 0.35);
      ctx.lineWidth = 0.004;
      ctx.beginPath();
      ctx.moveTo(side * 0.5, k * 0.008);
      ctx.quadraticCurveTo(side * (half + 0.06), k * 0.013, side * (half - 0.02), k * 0.017);
      ctx.stroke();
    }
    ctx.restore();
  }

  const spine = densify([{ x: -half, y: 0 }, { x: 0, y: 0 }, { x: half, y: 0 }], false, 22);
  const belly = orient(ribbon(spine, belt));
  curve(ctx, belly, true, 0.5);
  const g = ctx.createLinearGradient(0, -0.24 * fat, 0, 0.24 * fat);
  g.addColorStop(0, mix(p.muscleLight, "#ffffff", 0.25));
  g.addColorStop(0.34, p.muscle);
  g.addColorStop(0.75, mix(p.muscle, p.muscleDeep, 0.6));
  g.addColorStop(1, p.muscleDeep);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA(mix(p.muscleDeep, "#000000", 0.3), 0.8);
  ctx.lineWidth = 0.007;
  ctx.stroke();

  ctx.save();
  curve(ctx, belly, true, 0.5);
  ctx.clip();

  /* Fascicles: bundles of fibres running the length of the belly and gathering
     onto the tendon at each end. A muscle is a rope of ropes. */
  // Each bundle is a rounded cord: a shadow crease below it, the body of the
  // cord, then a lit crown. A muscle is a rope of ropes and it should look it.
  const fasc = (off: number, w: number): void => {
    ctx.beginPath();
    ctx.moveTo(-half - 0.05, 0);
    ctx.quadraticCurveTo(0, off * 1.5, half + 0.05, 0);
    ctx.lineWidth = w;
    ctx.stroke();
  };
  for (let i = -7; i <= 7; i++) {
    const off = (i / 7) * 0.20 * fat;
    ctx.strokeStyle = hexA(mix(p.muscleDeep, "#000000", 0.4), 0.55);
    fasc(off + 0.007, 0.026);
  }
  for (let i = -7; i <= 7; i++) {
    const off = (i / 7) * 0.20 * fat;
    const lift = 1 - Math.abs(i) / 8;
    ctx.strokeStyle = hexA(mix(p.muscle, p.muscleLight, 0.25 + 0.45 * lift), 0.8);
    fasc(off - 0.002, 0.020);
  }
  for (let i = -7; i <= 7; i++) {
    const off = (i / 7) * 0.20 * fat;
    const lift = clamp01(1 - (i + 3) / 9);
    ctx.strokeStyle = hexA(mix(p.muscleLight, "#ffffff", 0.4), 0.42 * lift);
    fasc(off - 0.008, 0.008);
  }

  /* Cross-striations: the sarcomere banding, closer together when contracted
     because that is literally what contraction is. */
  ctx.strokeStyle = hexA("#ffffff", 0.055);
  ctx.lineWidth = 0.003;
  const gap = 0.030 - 0.009 * c;
  for (let x = -half; x < half; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, -0.24 * fat);
    ctx.lineTo(x - 0.004, 0.24 * fat);
    ctx.stroke();
  }

  /* Capillaries. Working muscle is the hungriest tissue in the body, and its
     capillary bed is the densest anywhere. */
  for (let i = 0; i < 16; i++) {
    const x0 = -half + hash2(i, 3) * len;
    const y0 = (hash2(i, 7) - 0.5) * 0.3 * fat;
    ctx.strokeStyle = hexA(mix(p.arterial, "#ffffff", 0.15 + 0.35 * c), 0.3);
    ctx.lineWidth = 0.004;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + 0.06, y0 + (hash2(i, 11) - 0.5) * 0.08,
      x0 + 0.13, y0 + (hash2(i, 13) - 0.5) * 0.1);
    ctx.stroke();
  }

  // Specular along the top of the belly: wet, and rounded.
  const sg = ctx.createRadialGradient(
    KEY.x * 0.22, KEY.y * 0.20 * fat, 0.01, KEY.x * 0.2, KEY.y * 0.18 * fat, 0.36);
  sg.addColorStop(0, hexA("#ffffff", 0.3));
  sg.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sg;
  ctx.fillRect(-0.6, -0.5, 1.2, 1);
  ctx.restore();

  /* The motor nerve arriving at its end plate. A muscle without one is meat:
     it is the nerve that makes it move, and cutting it wastes the muscle away
     however healthy the fibres are. */
  litTube(ctx, [{ x: 0.13, y: -0.30 }, { x: 0.08, y: -0.23 }, { x: 0.05, y: -0.16 }],
    (u) => 0.011 - 0.003 * u, p.nerve, p.nerveDeep, p.myelin);
  for (let i = -1; i <= 1; i++) {
    ctx.strokeStyle = hexA(p.nerve, 0.8);
    ctx.lineWidth = 0.005;
    ctx.beginPath();
    ctx.moveTo(0.05, -0.16);
    ctx.quadraticCurveTo(0.05 + i * 0.03, -0.12, 0.05 + i * 0.055, -0.08);
    ctx.stroke();
    // The end plate itself, lit while the muscle is being told to contract.
    ctx.fillStyle = hexA(mix(p.nerve, "#ffffff", 0.3 + 0.5 * c), 0.5 + 0.4 * c);
    ctx.beginPath();
    ctx.ellipse(0.05 + i * 0.055, -0.08, 0.012, 0.007, i * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
/* @@ORGANS_END@@ */

/* ------------------------------------------------------------------ *
 * 3. Vessels
 * ------------------------------------------------------------------ */

export type VesselKind = "artery" | "vein" | "capillary";

export interface VesselOpts {
  /** 0-1, looping. Advances the blood cells along the vessel. */
  flow?: number;
  /** Side branches to sprout. Set 0 for a plain trunk. */
  branches?: number;
  /** End width as a fraction of start width. Vessels always narrow. */
  taper?: number;
  /** Blood cells drawn in the lumen. */
  cells?: number;
  seed?: number;
  /** Draw the pressure wave running an artery. Ignored for veins. */
  pulse?: boolean;
}

/**
 * A blood vessel along a path, with wall, lumen, branches and moving blood.
 *
 * Arteries and veins are drawn to be told apart at a glance and for the right
 * reasons, not merely by colour. An artery has a thick muscular wall and a
 * small round lumen because it holds the pressure the heart generates; a vein
 * has a thin wall, a wide floppy lumen and — the detail that matters — valves,
 * because the blood in it is at almost no pressure and would fall back down
 * your legs without them. Colour follows oxygen, not vessel type, which is why
 * `kind` sets the shape and a caller can still tint a pulmonary artery blue.
 *
 * The taper and the branch stubs exist because a vessel that keeps its width
 * for ever implies blood arrives everywhere at once. It does not: it divides,
 * and each division is where the pressure drops.
 */
export function vessel(
  ctx: CanvasRenderingContext2D,
  path: Pt[], width: number, kind: VesselKind,
  theme: ThemeColors, opts: VesselOpts = {},
): void {
  if (path.length < 2 || width <= 0) return;
  const p = anatomyPalette(theme);
  const flow = opts.flow ?? 0;
  const artery = kind === "artery";
  const col = artery ? p.arterial : kind === "vein" ? p.venous : mix(p.arterial, p.venous, 0.5);
  const deep = artery ? p.arterialDeep : p.venousDeep;
  const light = artery ? p.arterialLight : p.venousLight;
  const taper = opts.taper ?? (kind === "capillary" ? 0.85 : 0.5);

  const pts = densify(path, false, 10);
  const acc = arcLengths(pts);
  // An artery visibly widens as the pressure wave passes: that travelling
  // bulge is exactly what a pulse felt at the wrist is.
  const wave = (u: number) =>
    opts.pulse !== false && artery
      ? 1 + 0.1 * Math.exp(-(((u - flow + 1) % 1) ** 2) / 0.006)
      : 1;
  const halfW = (u: number) => (width / 2) * (1 - u * (1 - taper)) * wave(u);

  ctx.save();
  try {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* Branch stubs, drawn under the trunk so they appear to leave it. */
    const nb = opts.branches ?? 3;
    if (nb > 0) {
      const r = rng(opts.seed ?? 5);
      for (let i = 0; i < nb; i++) {
        const u = 0.16 + (i / nb) * 0.72 + r() * 0.05;
        const s = along(pts, acc, u);
        const side = i % 2 === 0 ? 1 : -1;
        const w = halfW(u) * 2 * (0.42 + r() * 0.2);
        const len = width * (2.4 + r() * 2.2);
        // Branches leave at an acute angle, pointing downstream — a vessel never
        // sends blood backwards, and the geometry of the fork shows which way it
        // is going without an arrow.
        const bx = s.p.x + s.tx * len * 0.6 - s.ty * side * len * 0.8;
        const by = s.p.y + s.ty * len * 0.6 + s.tx * side * len * 0.8;
        const stub = densify([
          s.p,
          {
            x: s.p.x + s.tx * len * 0.35 - s.ty * side * len * 0.3,
            y: s.p.y + s.ty * len * 0.35 + s.tx * side * len * 0.3,
          },
          { x: bx, y: by },
        ], false, 8);
        curve(ctx, orient(ribbon(stub, (v) => (w / 2) * (1 - v * 0.62))), true, 0.8);
        const bg = ctx.createLinearGradient(s.p.x, s.p.y, bx, by);
        bg.addColorStop(0, col);
        bg.addColorStop(1, mix(deep, col, 0.3));
        ctx.fillStyle = bg;
        ctx.fill();
      }
    }

    /* Wall. */
    const outline = orient(ribbon(pts, halfW));
    curve(ctx, outline, true, 0.8);
    const a = pts[0], b = pts[pts.length - 1];
    const wg = ctx.createLinearGradient(
      a.x + KEY.x * width, a.y + KEY.y * width, b.x - KEY.x * width, b.y - KEY.y * width,
    );
    wg.addColorStop(0, mix(col, "#ffffff", 0.3));
    wg.addColorStop(0.4, col);
    wg.addColorStop(1, deep);
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = hexA(deep, 0.8);
    ctx.lineWidth = Math.max(0.4, width * 0.06);
    ctx.stroke();

    /* Lumen. An artery's wall is thick, so its blood column is narrow relative
       to the outside; a vein is mostly lumen. */
    const lumenK = artery ? 0.56 : kind === "vein" ? 0.74 : 0.62;
    const lumen = orient(ribbon(pts, (u) => halfW(u) * lumenK));
    curve(ctx, lumen, true, 0.8);
    const lg = ctx.createLinearGradient(a.x, a.y - width, a.x, a.y + width);
    lg.addColorStop(0, mix(col, "#000000", 0.15));
    lg.addColorStop(0.5, artery ? mix(col, "#ff3b45", 0.35) : mix(col, "#5b6ad8", 0.4));
    lg.addColorStop(1, deep);
    ctx.fillStyle = lg;
    ctx.fill();

    /* Blood cells travelling the lumen. Red cells are biconcave discs — the
       dimple is what gives them the surface area to unload oxygen fast. */
    const nCells = opts.cells ?? Math.max(3, Math.round((acc[acc.length - 1] / width) * 0.5));
    if (nCells > 0) {
      ctx.save();
      curve(ctx, lumen, true, 0.8);
      ctx.clip();
      const cellCol = artery ? "#ff4f52" : mix(p.venous, "#8a5fb0", 0.45);
      for (let i = 0; i < nCells; i++) {
        const u = (i / nCells + flow) % 1;
        const s = along(pts, acc, u);
        const rr = halfW(u) * lumenK * 0.62;
        ctx.save();
        ctx.translate(s.p.x, s.p.y);
        ctx.rotate(Math.atan2(s.ty, s.tx));
        const cg = ctx.createRadialGradient(-rr * 0.3, -rr * 0.3, 0, 0, 0, rr * 1.4);
        cg.addColorStop(0, mix(cellCol, "#ffffff", 0.45));
        cg.addColorStop(0.55, cellCol);
        cg.addColorStop(1, mix(cellCol, "#000000", 0.4));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * 1.15, rr, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = hexA(mix(cellCol, "#000000", 0.45), 0.55);
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * 0.45, rr * 0.4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    /* Venous valves: paired cusps opening downstream. They are the reason blood
       in a leg vein can only travel one way — toward the heart. */
    if (kind === "vein") {
      const nv = Math.max(1, Math.round(acc[acc.length - 1] / (width * 5)));
      ctx.strokeStyle = hexA(mix(p.venousLight, "#ffffff", 0.4), 0.85);
      ctx.lineWidth = Math.max(0.5, width * 0.07);
      for (let i = 1; i <= nv; i++) {
        const u = i / (nv + 1);
        const s = along(pts, acc, u);
        const w = halfW(u) * lumenK;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s.p.x - s.ty * side * w, s.p.y + s.tx * side * w);
          ctx.quadraticCurveTo(
            s.p.x - s.ty * side * w * 0.3 + s.tx * w * 0.7,
            s.p.y + s.tx * side * w * 0.3 + s.ty * w * 0.7,
            s.p.x + s.tx * w * 1.5, s.p.y + s.ty * w * 1.5,
          );
          ctx.stroke();
        }
      }
    }

    /* Specular streak along the key side: the sheen on a wet vessel. */
    const hi = ribbon(
      pts.map((q, i) => {
        const nn = pts.length;
        const aa = pts[Math.max(0, i - 1)], bb = pts[Math.min(nn - 1, i + 1)];
        const dx = bb.x - aa.x, dy = bb.y - aa.y;
        const len = Math.hypot(dx, dy) || 1;
        const off = halfW(i / (nn - 1 || 1)) * 0.52;
        return { x: q.x + (-dy / len) * off, y: q.y + (dx / len) * off };
      }),
      (u) => halfW(u) * 0.16,
    );
    curve(ctx, orient(hi), true, 0.8);
    ctx.fillStyle = hexA(mix(light, "#ffffff", 0.5), 0.55);
    ctx.fill();

  } finally {
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * 4. Neuron
 * ------------------------------------------------------------------ */

export interface NeuronOpts {
  /** 0-1. Position of an action potential along the axon. */
  signal?: number;
  /** Rotation in radians. */
  angle?: number;
  seed?: number;
  /** Draw the target cell the terminals synapse onto. */
  target?: boolean;
}

/**
 * A neuron: dendrites, soma, myelinated axon, terminals.
 *
 * Three things here are not decoration.
 *
 * The dendrites branch fractally, dividing again and again, because that is
 * how one cell collects input from thousands of others; three straight lines
 * would imply three inputs and a decision that could not be made.
 *
 * The axon is wrapped in myelin with bare gaps between the sheaths. Those gaps
 * are the nodes of Ranvier, and they are the entire reason a vertebrate nerve
 * is fast: the membrane can only fire where it is bare, so the impulse jumps
 * from node to node instead of crawling along the whole length. An axon drawn
 * as a plain line makes saltatory conduction unexplainable, and it is on every
 * syllabus that mentions nerves at all. So the animation here really jumps:
 * the action potential is snapped to node positions, never slid between them.
 *
 * The terminals end in swollen boutons because that is where the signal stops
 * being electrical and becomes chemical.
 */
export function neuron(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  theme: ThemeColors, opts: NeuronOpts = {},
): void {
  const p = anatomyPalette(theme);
  const sig = opts.signal ?? 0;
  const active = sig > 0;
  ctx.save();
  try {
    ctx.translate(x, y);
    if (opts.angle) ctx.rotate(opts.angle);
    ctx.scale(size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const somaX = -0.34, somaY = 0;
    const cellCol = mix(p.nerve, "#c9a24a", 0.35);
    const hot = mix("#ffe27a", "#ffffff", 0.35);

    /* Dendrites: a fractal tree, thick at the soma, hair-fine at the tips. */
    const r = rng(opts.seed ?? 3);
    const dendrite = (
      bx: number, by: number, ang: number, len: number, w: number, depth: number,
    ) => {
      if (depth <= 0 || len < 0.006) return;
      const ex = bx + Math.cos(ang + (r() - 0.5) * 0.3) * len;
      const ey = by + Math.sin(ang + (r() - 0.5) * 0.3) * len;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(ang) * len * 0.55, by + Math.sin(ang) * len * 0.55, ex, ey,
      );
      ctx.lineWidth = w;
      ctx.strokeStyle = hexA(mix(cellCol, "#ffffff", depth > 2 ? 0.05 : 0.25), 0.95);
      ctx.stroke();
      // Dendritic spines: the little knobs where synapses actually land. They
      // only appear on the fine branches, as they do in a real cell.
      if (depth <= 2) {
        for (let i = 1; i < 4; i++) {
          const u = i / 4;
          const sa = ang + (Math.PI / 2) * (i % 2 === 0 ? 1 : -1);
          ctx.beginPath();
          ctx.arc(
            bx + (ex - bx) * u + Math.cos(sa) * w * 1.6,
            by + (ey - by) * u + Math.sin(sa) * w * 1.6, w * 0.8, 0, TAU,
          );
          ctx.fillStyle = hexA(mix(cellCol, "#ffffff", 0.3), 0.9);
          ctx.fill();
        }
      }
      const spread = 0.5 + r() * 0.35;
      dendrite(ex, ey, ang - spread, len * (0.62 + r() * 0.12), w * 0.62, depth - 1);
      dendrite(ex, ey, ang + spread, len * (0.6 + r() * 0.14), w * 0.62, depth - 1);
      if (depth > 3 && r() > 0.4) {
        dendrite(ex, ey, ang + (r() - 0.5) * 0.3, len * 0.6, w * 0.55, depth - 2);
      }
    };
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.55 + i * 0.225);
      dendrite(somaX + Math.cos(a) * 0.05, somaY + Math.sin(a) * 0.05, a, 0.11, 0.019, 5);
    }

    /* Axon: from the hillock, right across the frame, ending in terminals. */
    const axonPath: Pt[] = [
      { x: somaX + 0.05, y: 0.01 }, { x: -0.16, y: 0.03 }, { x: 0.02, y: 0.0 },
      { x: 0.2, y: 0.03 }, { x: 0.33, y: 0.02 },
    ];
    const ax = densify(axonPath, false, 12);
    const axAcc = arcLengths(ax);
    ctx.strokeStyle = hexA(cellCol, 0.95);
    ctx.lineWidth = 0.016;
    curve(ctx, axonPath, false);
    ctx.stroke();

    // The axon hillock: a cone, and the place where the decision to fire is made.
    ctx.beginPath();
    ctx.moveTo(somaX + 0.02, -0.045);
    ctx.quadraticCurveTo(somaX + 0.07, -0.02, somaX + 0.1, -0.009);
    ctx.lineTo(somaX + 0.1, 0.028);
    ctx.quadraticCurveTo(somaX + 0.07, 0.04, somaX + 0.02, 0.06);
    ctx.closePath();
    ctx.fillStyle = mix(cellCol, "#ffffff", 0.15);
    ctx.fill();

    /* Myelin sheaths with bare nodes of Ranvier between them. */
    const sheaths = 6;
    const nodeU: number[] = [];
    for (let i = 0; i < sheaths; i++) {
      const u0 = 0.1 + (i / sheaths) * 0.86;
      const u1 = u0 + (1 / sheaths) * 0.86 - 0.028;
      nodeU.push(u1 + 0.014);
      const seg: Pt[] = [];
      for (let k = 0; k <= 8; k++) seg.push(along(ax, axAcc, u0 + (u1 - u0) * (k / 8)).p);
      curve(ctx, orient(ribbon(seg,
        (v) => 0.036 * Math.sin(Math.PI * (0.14 + v * 0.72)) + 0.012)), true, 0.8);
      const mg = ctx.createLinearGradient(seg[0].x, seg[0].y - 0.05, seg[0].x, seg[0].y + 0.05);
      mg.addColorStop(0, "#ffffff");
      mg.addColorStop(0.4, p.myelin);
      mg.addColorStop(1, mix(p.myelin, "#a68a5c", 0.55));
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = hexA("#a68a5c", 0.5);
      ctx.lineWidth = 0.004;
      ctx.stroke();
      // Each sheath is one Schwann cell wrapped round and round the axon; its
      // nucleus is squeezed to the outside, and drawing it says the insulation
      // is made of living cells rather than applied like tape.
      ctx.beginPath();
      ctx.ellipse(seg[4].x, seg[4].y - 0.03, 0.014, 0.008, 0, 0, TAU);
      ctx.fillStyle = hexA("#c8a86e", 0.8);
      ctx.fill();
    }

    /* The action potential, snapped to a node. It jumps; it does not slide. */
    if (active) {
      const idx = Math.min(nodeU.length - 1, Math.floor(sig * nodeU.length));
      const here = along(ax, axAcc, nodeU[idx]).p;
      // The stretch already passed is refractory — it cannot fire again yet,
      // which is why a nerve impulse only ever travels one way.
      ctx.strokeStyle = hexA("#7a86c8", 0.5);
      ctx.lineWidth = 0.02;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const q = along(ax, axAcc, 0.1 + (nodeU[idx] - 0.1) * (k / 20)).p;
        if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      const g = ctx.createRadialGradient(here.x, here.y, 0, here.x, here.y, 0.075);
      g.addColorStop(0, hexA(hot, 0.95));
      g.addColorStop(0.35, hexA("#ffb43c", 0.6));
      g.addColorStop(1, hexA("#ff8a2c", 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(here.x, here.y, 0.075, 0, TAU);
      ctx.fill();
    }

    /* Terminal arborisation ending in boutons. */
    const tip = { x: 0.33, y: 0.02 };
    const boutons: Pt[] = [];
    for (let i = 0; i < 5; i++) {
      const a = -0.75 + i * 0.375;
      const ex = tip.x + Math.cos(a) * 0.11, ey = tip.y + Math.sin(a) * 0.11;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.quadraticCurveTo(tip.x + Math.cos(a) * 0.06, tip.y + Math.sin(a) * 0.03, ex, ey);
      ctx.lineWidth = 0.009;
      ctx.strokeStyle = hexA(cellCol, 0.95);
      ctx.stroke();
      boutons.push({ x: ex, y: ey });
    }
    const fired = active && sig > 0.86;
    for (const b of boutons) {
      const g = ctx.createRadialGradient(b.x - 0.006, b.y - 0.006, 0, b.x, b.y, 0.022);
      g.addColorStop(0, fired ? hot : mix(cellCol, "#ffffff", 0.4));
      g.addColorStop(1, fired ? "#ff9a2e" : mix(cellCol, "#8a6a2a", 0.5));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 0.022, 0, TAU);
      ctx.fill();
      if (fired) {
        // Neurotransmitter crossing the synaptic cleft: the electrical signal
        // becoming a chemical one, which is where every drug that acts on the
        // brain does its work.
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(b.x + 0.03 + k * 0.012, b.y + (k % 2 ? 0.012 : -0.01), 0.005, 0, TAU);
          ctx.fillStyle = hexA("#ffe27a", 0.85);
          ctx.fill();
        }
      }
    }
    if (opts.target !== false) {
      // The next cell's dendrite, so the synapse has two sides.
      ctx.beginPath();
      ctx.moveTo(0.47, -0.22);
      ctx.quadraticCurveTo(0.44, 0.02, 0.47, 0.26);
      ctx.lineWidth = 0.024;
      ctx.strokeStyle = hexA(mix(cellCol, p.brain, 0.5), 0.5);
      ctx.stroke();
    }

    /* Soma last, on top of the dendrite roots, with nucleus and nucleolus. */
    const soma: Pt[] = [
      { x: somaX - 0.09, y: -0.05 }, { x: somaX - 0.04, y: -0.10 },
      { x: somaX + 0.05, y: -0.08 }, { x: somaX + 0.09, y: -0.01 },
      { x: somaX + 0.06, y: 0.07 }, { x: somaX - 0.02, y: 0.10 },
      { x: somaX - 0.09, y: 0.06 },
    ];
    // The soma flashes as the inputs sum past threshold, just before the axon
    // fires: cause, then effect, in that order.
    const somaHot = active && sig < 0.12;
    shadeBody(ctx, soma, somaX, somaY, 0.1,
      somaHot ? mix(cellCol, hot, 0.55) : cellCol,
      mix(cellCol, "#6b4f1c", 0.6), mix(cellCol, "#ffffff", 0.55), { gloss: 0.4 });
    const ng = ctx.createRadialGradient(somaX - 0.012, somaY - 0.012, 0, somaX, somaY, 0.045);
    ng.addColorStop(0, mix(p.brainLight, "#ffffff", 0.4));
    ng.addColorStop(0.7, mix(cellCol, "#ffffff", 0.3));
    ng.addColorStop(1, mix(cellCol, "#6b4f1c", 0.35));
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(somaX, somaY, 0.045, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(somaX + 0.008, somaY + 0.006, 0.016, 0, TAU);
    ctx.fillStyle = hexA(mix(cellCol, "#5a3f12", 0.7), 0.9);
    ctx.fill();

  } finally {
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * 5. Body systems
 *
 * Each overlay is drawn on the same landmark table the silhouette was built
 * from, so an organ lands where it belongs on a body of that height rather
 * than where it looked balanced. Position is content here: the kidneys really
 * are tucked up under the last ribs, the heart really does sit behind the
 * sternum and mostly to the left, and a student who learns those places from a
 * picture that had them wrong has learned something they must later undo.
 * ------------------------------------------------------------------ */

export type SystemKind =
  | "circulatory" | "respiratory" | "digestive"
  | "nervous" | "muscular" | "excretory";

/** A limb chain read out as a path, so vessels and nerves follow the limb. */
function chainPath(nodes: Node[], dx = 0, dy = 0, from = 0): Pt[] {
  return nodes.slice(from).map((n) => ({ x: n.x + dx, y: n.y + dy }));
}

/** A plain shaded tube — airway, gut or duct, anything that is not a vessel. */
function ductTube(
  ctx: CanvasRenderingContext2D, pts: Pt[], w: number, col: string, p: AnatomyPalette,
): void {
  const d = densify(pts, false, 10);
  curve(ctx, orient(ribbon(d, () => w / 2)), true, 0.8);
  const g = ctx.createLinearGradient(d[0].x - w, d[0].y, d[0].x + w, d[d.length - 1].y);
  g.addColorStop(0, mix(col, "#ffffff", 0.45));
  g.addColorStop(0.45, col);
  g.addColorStop(1, mix(col, p.gutDeep, 0.5));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA(mix(col, p.gutDeep, 0.6), 0.6);
  ctx.lineWidth = Math.max(0.4, w * 0.08);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.35);
  ctx.lineWidth = Math.max(0.4, w * 0.13);
  curve(ctx, d.map((q) => ({ x: q.x - w * 0.2, y: q.y })), false);
  ctx.stroke();
}

export function bodySystemOverlay(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, h: number, which: SystemKind,
  theme: ThemeColors, t: number,
): void {
  const p = anatomyPalette(theme);
  const m = figureMetrics(x, y, h, "stand");
  const H = m.head;
  const { arms, legs } = limbChains(m);
  const flow = (t * 0.55) % 1;

  ctx.save();
  try {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (which) {
      /* ---------------------------------------------------------------- */
      case "circulatory": {
        // Veins first, laid slightly lateral to their arteries, because that is
        // how they run — paired with the artery but nearer the surface, which is
        // why the veins are the ones you can see in your own forearm.
        for (const s of [-1, 1] as const) {
          vessel(ctx, [
            { x: m.x + s * H * 0.18, y: m.chin - H * 0.1 },
            { x: m.x + s * H * 0.2, y: m.neckBase },
            { x: m.x + s * H * 0.12, y: m.sternumTop + H * 0.2 },
          ], H * 0.08, "vein", theme, { flow: 1 - flow, branches: 1, seed: 2 + s });
          vessel(ctx, chainPath(arms[s > 0 ? 0 : 1], -s * H * 0.11, 0, 1),
            H * 0.08, "vein", theme, { flow: 1 - flow, branches: 3, seed: 11 + s, taper: 1.5 });
          vessel(ctx, chainPath(legs[s > 0 ? 0 : 1], -s * H * 0.13, 0, 1),
            H * 0.095, "vein", theme, { flow: 1 - flow, branches: 3, seed: 21 + s, taper: 1.6 });
        }
        // Inferior and superior vena cava returning to the right atrium.
        vessel(ctx, [
          { x: m.x - H * 0.16, y: m.iliacY + H * 0.1 },
          { x: m.x - H * 0.14, y: m.navelY },
          { x: m.x - H * 0.12, y: m.costalY },
          { x: m.x - H * 0.1, y: m.nippleY + H * 0.25 },
        ], H * 0.17, "vein", theme, { flow: 1 - flow, branches: 4, seed: 31, taper: 0.8 });
        vessel(ctx, [
          { x: m.x - H * 0.12, y: m.neckBase },
          { x: m.x - H * 0.1, y: m.nippleY - H * 0.2 },
        ], H * 0.14, "vein", theme, { flow: 1 - flow, branches: 1, seed: 33, taper: 1 });

        // Arteries. The aorta leaves the heart and everything else in the body
        // is, sooner or later, a branch of it.
        vessel(ctx, [
          { x: m.x + H * 0.04, y: m.nippleY - H * 0.1 },
          { x: m.x + H * 0.02, y: m.costalY },
          { x: m.x, y: m.navelY },
          { x: m.x, y: m.iliacY },
        ], H * 0.15, "artery", theme, { flow, branches: 5, seed: 7, taper: 0.85 });
        for (const s of [-1, 1] as const) {
          // Common carotid: the brain is supplied first, always.
          vessel(ctx, [
            { x: m.x + s * H * 0.06, y: m.sternumTop + H * 0.1 },
            { x: m.x + s * H * 0.1, y: m.neckBase },
            { x: m.x + s * H * 0.11, y: m.chin - H * 0.14 },
          ], H * 0.1, "artery", theme, { flow, branches: 2, seed: 41 + s });
          // Subclavian into brachial into radial, following the arm itself.
          vessel(ctx, chainPath(arms[s > 0 ? 0 : 1], -s * H * 0.02, 0, 1),
            H * 0.1, "artery", theme, { flow, branches: 4, seed: 51 + s, taper: 0.42 });
          // Common iliac into femoral, the biggest artery you can bleed from.
          vessel(ctx, [
            { x: m.x, y: m.iliacY },
            { x: m.x + s * H * 0.22, y: m.hipY - H * 0.06 },
            ...chainPath(legs[s > 0 ? 0 : 1], -s * H * 0.02, 0, 1),
          ], H * 0.13, "artery", theme, { flow, branches: 4, seed: 61 + s, taper: 0.35 });
        }
        // The heart, behind the sternum and displaced to the anatomical left.
        organ(ctx, m.x + H * 0.09, m.nippleY + H * 0.18, H * 1.5, "heart", theme,
          { pulse: (t * 1.1) % 1 });
        break;
      }

      /* ---------------------------------------------------------------- */
      case "respiratory": {
        const breath = (t * 0.22) % 1;
        const rise = Math.sin(breath * TAU - Math.PI / 2) * 0.5 + 0.5;
        // Airway above the lungs: nose and mouth into pharynx into trachea.
        ductTube(ctx, [
          { x: m.x + H * 0.06, y: m.y + H * 0.72 },
          { x: m.x + H * 0.02, y: m.chin },
          { x: m.x, y: m.neckBase + H * 0.1 },
        ], H * 0.15, p.airway, p);
        organ(ctx, m.x, m.nippleY + H * 0.16, H * 2.3, "lungs", theme, { pulse: breath });
        // The diaphragm: the muscle that actually does the breathing. It is a
        // dome that flattens on the way in, and the flattening is what drops the
        // pressure in the chest and pulls the air down.
        const dy = m.costalY + H * 0.14;
        const domeTop = dy - H * (0.5 - rise * 0.22);
        ctx.beginPath();
        ctx.moveTo(m.x - H * 0.74, dy - H * 0.14);
        ctx.bezierCurveTo(m.x - H * 0.44, domeTop, m.x + H * 0.44, domeTop,
          m.x + H * 0.74, dy - H * 0.14);
        ctx.lineTo(m.x + H * 0.7, dy + H * 0.04);
        ctx.bezierCurveTo(m.x + H * 0.4, domeTop + H * 0.2, m.x - H * 0.4, domeTop + H * 0.2,
          m.x - H * 0.7, dy + H * 0.04);
        ctx.closePath();
        const dg = ctx.createLinearGradient(m.x - H, domeTop, m.x + H, dy);
        dg.addColorStop(0, mix(p.muscleLight, "#ffffff", 0.25));
        dg.addColorStop(0.5, p.muscle);
        dg.addColorStop(1, p.muscleDeep);
        ctx.fillStyle = dg;
        ctx.fill();
        ctx.strokeStyle = hexA(p.muscleDeep, 0.7);
        ctx.lineWidth = H * 0.018;
        ctx.stroke();
        // Radiating fibres: the diaphragm pulls in toward its central tendon.
        ctx.strokeStyle = hexA(p.muscleDeep, 0.45);
        ctx.lineWidth = H * 0.012;
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(m.x + i * H * 0.16, dy - H * 0.12);
          ctx.lineTo(m.x + i * H * 0.06, domeTop + H * 0.12);
          ctx.stroke();
        }
        break;
      }

      /* ---------------------------------------------------------------- */
      case "digestive": {
        // Drawn in the order food travels, which is the order it is taught.
        const wave = (t * 0.35) % 1;
        // 1. Mouth and oesophagus.
        ductTube(ctx, [
          { x: m.x + H * 0.08, y: m.y + H * 0.8 },
          { x: m.x + H * 0.02, y: m.chin + H * 0.15 },
          { x: m.x - H * 0.04, y: m.neckBase + H * 0.2 },
          { x: m.x - H * 0.06, y: m.costalY - H * 0.2 },
        ], H * 0.16, p.stomach, p);
        // 2. Liver, on the anatomical right and overlapping the stomach.
        organ(ctx, m.x - H * 0.26, m.costalY + H * 0.06, H * 1.5, "liver", theme);
        // 3. Stomach, high on the left under the ribs.
        organ(ctx, m.x + H * 0.28, m.costalY + H * 0.26, H * 1.25, "stomach", theme,
          { pulse: wave });
        // 4 and 5. The small intestine coiled inside the frame of the large,
        // which is exactly how they sit: the colon goes round the outside.
        organ(ctx, m.x, m.navelY + H * 0.5, H * 2.1, "largeIntestine", theme,
          { pulse: wave });
        organ(ctx, m.x, m.navelY + H * 0.5, H * 1.25, "smallIntestine", theme,
          { pulse: wave });
        // 6. Rectum and anal canal, closing the tract.
        ductTube(ctx, [
          { x: m.x + H * 0.06, y: m.crotchY - H * 0.5 },
          { x: m.x + H * 0.02, y: m.crotchY - H * 0.2 },
        ], H * 0.16, p.gut, p);
        break;
      }

      /* ---------------------------------------------------------------- */
      case "nervous": {
        // A signal running outward from the cord, so the direction of traffic
        // reads without an arrow on it.
        const sig = (t * 0.5) % 1;
        const nerve = (pts: Pt[], w: number, phase: number) => {
          const d = densify(pts, false, 10);
          const acc = arcLengths(d);
          curve(ctx, orient(ribbon(d, (u) => (w / 2) * (1 - u * 0.55))), true, 0.8);
          const g = ctx.createLinearGradient(d[0].x, d[0].y, d[d.length - 1].x, d[d.length - 1].y);
          g.addColorStop(0, mix(p.nerve, "#ffffff", 0.35));
          g.addColorStop(1, mix(p.nerve, "#9c7f2a", 0.4));
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = hexA("#9c7f2a", 0.6);
          ctx.lineWidth = Math.max(0.4, w * 0.09);
          ctx.stroke();
          // A nerve is a cable: many axons in parallel inside one sheath, not a
          // single wire, which is why one nerve can carry both movement out and
          // sensation back at the same time.
          ctx.strokeStyle = hexA("#ffffff", 0.3);
          ctx.lineWidth = Math.max(0.3, w * 0.08);
          curve(ctx, d.map((q) => ({ x: q.x - w * 0.16, y: q.y - w * 0.16 })), false);
          ctx.stroke();
          const s = along(d, acc, phase);
          const sg2 = ctx.createRadialGradient(s.p.x, s.p.y, 0, s.p.x, s.p.y, w * 2.2);
          sg2.addColorStop(0, hexA("#fff3b8", 0.9));
          sg2.addColorStop(0.4, hexA("#ffc23c", 0.45));
          sg2.addColorStop(1, hexA("#ffc23c", 0));
          ctx.fillStyle = sg2;
          ctx.beginPath();
          ctx.arc(s.p.x, s.p.y, w * 2.2, 0, TAU);
          ctx.fill();
        };

        // Spinal cord: it stops at the first lumbar vertebra, not at the tailbone
        // — which is why a lumbar puncture below that level is safe.
        const cordEnd = m.iliacY - H * 0.42;
        nerve([
          { x: m.x, y: m.chin - H * 0.1 }, { x: m.x, y: m.neckBase },
          { x: m.x, y: m.nippleY }, { x: m.x, y: m.costalY }, { x: m.x, y: cordEnd },
        ], H * 0.2, sig);
        // Cauda equina: the loose bundle of roots trailing below the cord's end.
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(m.x + i * H * 0.012, cordEnd);
          ctx.quadraticCurveTo(m.x + i * H * 0.06, cordEnd + H * 0.3,
            m.x + i * H * 0.09, cordEnd + H * 0.55);
          ctx.strokeStyle = hexA(p.nerve, 0.8);
          ctx.lineWidth = H * 0.022;
          ctx.stroke();
        }
        // Segmental spinal nerves, one pair between every two vertebrae.
        for (let i = 0; i < 16; i++) {
          const yy = m.neckBase + ((cordEnd - m.neckBase) * i) / 15;
          for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(m.x, yy);
            ctx.quadraticCurveTo(m.x + s * H * 0.18, yy + H * 0.03, m.x + s * H * 0.34, yy + H * 0.1);
            ctx.strokeStyle = hexA(p.nerve, 0.75);
            ctx.lineWidth = H * 0.018;
            ctx.stroke();
          }
        }
        for (const s of [-1, 1] as const) {
          // Brachial plexus into the arm.
          nerve([
            { x: m.x + s * H * 0.1, y: m.neckBase + H * 0.1 },
            { x: m.x + s * H * 0.55, y: m.shoulderY - H * 0.02 },
            ...chainPath(arms[s > 0 ? 0 : 1], -s * H * 0.04, H * 0.02, 2),
          ], H * 0.11, (sig + 0.3) % 1);
          // Sciatic nerve: the thickest nerve in the body, hip to heel.
          nerve([
            { x: m.x + s * H * 0.14, y: cordEnd + H * 0.4 },
            { x: m.x + s * H * 0.3, y: m.hipY },
            ...chainPath(legs[s > 0 ? 0 : 1], -s * H * 0.04, 0, 2),
          ], H * 0.12, (sig + 0.55) % 1);
        }
        // Brain in the skull, in coronal view to match a front-facing body.
        brainCoronal(ctx, m.x, m.y + H * 0.48, H * 0.88, p, t);
        break;
      }

      /* ---------------------------------------------------------------- */
      case "muscular": {
        ctx.save();
        bodyPath(ctx, bodyParts(m));
        ctx.clip();
        drawSurfaceMuscles(ctx, m, p, arms, legs, 2.1);
        ctx.restore();
        break;
      }

      /* ---------------------------------------------------------------- */
      case "excretory": {
        // Kidneys sit high, against the back wall, under the last two ribs — far
        // higher than students guess — and the right one is lower than the left
        // because the liver is in the way.
        const ky = m.costalY + H * 0.2;
        // Renal arteries straight off the aorta: a fifth of every heartbeat goes
        // through these, which is why the whole blood volume is filtered in half
        // an hour.
        vessel(ctx, [{ x: m.x, y: ky + H * 0.06 }, { x: m.x - H * 0.3, y: ky + H * 0.1 }],
          H * 0.1, "artery", theme, { flow: (t * 0.6) % 1, branches: 0 });
        vessel(ctx, [{ x: m.x, y: ky - H * 0.04 }, { x: m.x + H * 0.3, y: ky - H * 0.04 }],
          H * 0.1, "artery", theme, { flow: (t * 0.6) % 1, branches: 0 });
        organ(ctx, m.x - H * 0.46, ky + H * 0.1, H * 1.05, "kidney", theme, { flip: true });
        organ(ctx, m.x + H * 0.46, ky - H * 0.02, H * 1.05, "kidney", theme);
        // Ureters: narrow muscular tubes that squeeze urine down, not tubes it
        // merely falls through — which is why you can lie down without drowning.
        const bladderY = m.crotchY - H * 0.34;
        for (const s of [-1, 1]) {
          ductTube(ctx, [
            { x: m.x + s * H * 0.36, y: ky + H * 0.34 },
            { x: m.x + s * H * 0.26, y: m.navelY + H * 0.3 },
            { x: m.x + s * H * 0.2, y: bladderY - H * 0.16 },
          ], H * 0.07, p.airway, p);
        }
        // Bladder: a muscular bag in the pelvis, drawn part-full.
        const bl: Pt[] = [
          { x: m.x - H * 0.3, y: bladderY - H * 0.1 },
          { x: m.x - H * 0.14, y: bladderY - H * 0.22 },
          { x: m.x + H * 0.14, y: bladderY - H * 0.22 },
          { x: m.x + H * 0.3, y: bladderY - H * 0.1 },
          { x: m.x + H * 0.26, y: bladderY + H * 0.18 },
          { x: m.x, y: bladderY + H * 0.28 },
          { x: m.x - H * 0.26, y: bladderY + H * 0.18 },
        ];
        shadeBody(ctx, bl, m.x, bladderY, H * 0.3, p.stomach, p.stomachDeep,
          mix(p.stomach, "#ffffff", 0.45), { gloss: 0.35 });
        ctx.save();
        curve(ctx, bl, true);
        ctx.clip();
        ctx.fillStyle = hexA("#e8c74a", 0.5);
        ctx.fillRect(m.x - H * 0.35, bladderY - H * 0.02, H * 0.7, H * 0.4);
        ctx.restore();
        ductTube(ctx, [
          { x: m.x, y: bladderY + H * 0.24 },
          { x: m.x, y: m.crotchY + H * 0.02 },
        ], H * 0.07, p.airway, p);
        break;
      }
    }
  } finally {
    ctx.restore();
  }
}

/**
 * The brain seen from the front, for a front-facing figure.
 *
 * A lateral brain dropped into a coronal body is a mistake students notice and
 * cannot articulate, so the nervous overlay gets its own view: two hemispheres
 * split by the longitudinal fissure, folded cortex, cerebellum below and the
 * brainstem running out through the base of the skull into the cord.
 */
function brainCoronal(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number,
  p: AnatomyPalette, t: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size, size);
  const outline: Pt[] = [
    { x: 0, y: -0.5 }, { x: 0.26, y: -0.45 }, { x: 0.42, y: -0.24 },
    { x: 0.45, y: 0.02 }, { x: 0.36, y: 0.26 }, { x: 0.18, y: 0.38 },
    { x: 0, y: 0.4 }, { x: -0.18, y: 0.38 }, { x: -0.36, y: 0.26 },
    { x: -0.45, y: 0.02 }, { x: -0.42, y: -0.24 }, { x: -0.26, y: -0.45 },
  ];
  shadeBody(ctx, outline, 0, -0.05, 0.48, p.brain, p.brainDeep, p.brainLight, { gloss: 0.24 });
  ctx.save();
  curve(ctx, outline, true);
  ctx.clip();
  // Gyri, mirrored about the midline as the two hemispheres genuinely are.
  const r = rng(17);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const pts: Pt[] = [];
      let px = s * (0.06 + (i % 4) * 0.1), py = -0.48 + Math.floor(i / 2) * 0.11;
      let ang = s > 0 ? 0.25 : Math.PI - 0.25;
      for (let k = 0; k < 5; k++) {
        pts.push({ x: px, y: py });
        ang += (r() - 0.5) * 1.3;
        px += Math.cos(ang) * 0.08 * s;
        py += Math.sin(ang) * 0.06;
      }
      curve(ctx, pts, false);
      ctx.strokeStyle = hexA(p.brainDeep, 0.5);
      ctx.lineWidth = 0.075;
      ctx.stroke();
      curve(ctx, pts.map((q) => ({ x: q.x - 0.008, y: q.y - 0.01 })), false);
      ctx.strokeStyle = hexA(p.brainLight, 0.7);
      ctx.lineWidth = 0.044;
      ctx.stroke();
    }
  }
  // The longitudinal fissure: the deep split between left and right brain.
  ctx.beginPath();
  ctx.moveTo(0, -0.5);
  ctx.quadraticCurveTo(0.012, -0.1, 0, 0.22);
  ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.4), 0.85);
  ctx.lineWidth = 0.05;
  ctx.stroke();
  // Cerebellum below, with its finer folia.
  ctx.beginPath();
  ctx.ellipse(0, 0.3, 0.3, 0.13, 0, 0, TAU);
  ctx.fillStyle = p.cerebellum;
  ctx.fill();
  ctx.strokeStyle = hexA(p.brainDeep, 0.6);
  ctx.lineWidth = 0.008;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-0.28, 0.3 + i * 0.03);
    ctx.quadraticCurveTo(0, 0.3 + i * 0.036, 0.28, 0.3 + i * 0.03);
    ctx.stroke();
  }
  // Activity, so a working brain looks like one.
  const gx = Math.sin(t * 0.8) * 0.28;
  const ag = ctx.createRadialGradient(gx, -0.12, 0, gx, -0.12, 0.3);
  ag.addColorStop(0, hexA("#ffd08a", 0.35));
  ag.addColorStop(1, hexA("#ffd08a", 0));
  ctx.fillStyle = ag;
  ctx.fillRect(-0.5, -0.5, 1, 1);
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 6. Bones and joints
 *
 * These exist for the lever topics, so they are drawn as machines. The thing a
 * student has to see is where the three points are — the fulcrum at the joint,
 * the effort where the tendon pulls, and the load out at the end — because the
 * whole reason a biceps has to generate several times the weight it lifts is
 * that its tendon inserts a couple of centimetres from the fulcrum while the
 * load sits thirty centimetres away. That geometry is invisible in a diagram
 * of two rectangles and a dot.
 * ------------------------------------------------------------------ */

export type JointKind = "elbow" | "knee" | "spine";

export function boneOrJoint(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, which: JointKind,
  theme: ThemeColors,
): void {
  const p = anatomyPalette(theme);
  ctx.save();
  try {
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /** Bone shaft with a dense cortex and the specular ridge that says round. */
    const bone = (pts: Pt[], w: (u: number) => number) => {
      const d = densify(pts, false, 10);
      curve(ctx, orient(ribbon(d, w)), true, 0.8);
      const a = d[0], b = d[d.length - 1];
      const g = ctx.createLinearGradient(
        a.x + KEY.x * 0.2, a.y + KEY.y * 0.2, b.x - KEY.x * 0.16, b.y - KEY.y * 0.16,
      );
      g.addColorStop(0, p.boneLight);
      g.addColorStop(0.35, p.bone);
      g.addColorStop(0.75, mix(p.bone, p.boneShade, 0.6));
      g.addColorStop(1, p.boneShade);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hexA(mix(p.boneShade, "#6b5a3c", 0.5), 0.8);
      ctx.lineWidth = 0.008;
      ctx.stroke();
      ctx.strokeStyle = hexA("#ffffff", 0.5);
      ctx.lineWidth = 0.014;
      curve(ctx, d.map((q, i) => ({
        x: q.x - w(i / (d.length - 1)) * 0.4, y: q.y - w(i / (d.length - 1)) * 0.2,
      })), false);
      ctx.stroke();
    };

    /** Glassy cartilage on a joint surface: the low-friction bearing. */
    const cartilage = (pts: Pt[], w: number) => {
      curve(ctx, orient(ribbon(densify(pts, false, 8), () => w / 2)), true, 0.8);
      ctx.fillStyle = hexA(p.cartilage, 0.95);
      ctx.fill();
      ctx.strokeStyle = hexA(mix(p.cartilage, "#5f8a99", 0.5), 0.6);
      ctx.lineWidth = 0.005;
      ctx.stroke();
    };

    const tendon = (pts: Pt[], w: number) => {
      curve(ctx, orient(ribbon(densify(pts, false, 8), (u) => (w / 2) * (1 - u * 0.25))), true, 0.8);
      const g = ctx.createLinearGradient(pts[0].x, pts[0].y - w, pts[0].x + w, pts[0].y + w);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, p.tendon);
      g.addColorStop(1, mix(p.tendon, "#9c8a63", 0.6));
      ctx.fillStyle = g;
      ctx.fill();
    };

    const knob = (kx: number, ky: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(kx, ky, rx, ry, 0, 0, TAU);
      const g = ctx.createRadialGradient(kx - rx * 0.4, ky - ry * 0.5, 0, kx, ky, rx * 1.5);
      g.addColorStop(0, p.boneLight);
      g.addColorStop(0.55, p.bone);
      g.addColorStop(1, p.boneShade);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hexA(mix(p.boneShade, "#6b5a3c", 0.5), 0.8);
      ctx.lineWidth = 0.008;
      ctx.stroke();
    };

    switch (which) {
      /* ---------------------------------------------------------------- */
      case "elbow": {
        // A third-class lever: fulcrum at the joint, effort from the biceps a
        // very short way along, load out at the hand. Distances drawn to scale,
        // because the ratio between them is the entire answer.
        bone([{ x: -0.02, y: -0.46 }, { x: -0.03, y: -0.2 }, { x: -0.02, y: -0.02 }],
          (u) => 0.052 + u * u * 0.03);
        // Humeral condyles: the spool the forearm swings on.
        knob(-0.02, 0.03, 0.105, 0.075);
        cartilage([{ x: -0.12, y: 0.06 }, { x: -0.02, y: 0.11 }, { x: 0.08, y: 0.06 }], 0.04);

        // Ulna, with the olecranon hooking up behind the joint — the point of
        // your elbow, and the short lever arm the triceps pulls on.
        bone([{ x: 0.06, y: -0.02 }, { x: 0.07, y: 0.16 }, { x: 0.05, y: 0.46 }],
          (u) => 0.062 - u * 0.024);
        ctx.beginPath();
        ctx.moveTo(0.01, 0.02);
        ctx.quadraticCurveTo(0.09, -0.09, 0.13, 0.0);
        ctx.quadraticCurveTo(0.13, 0.08, 0.04, 0.09);
        ctx.closePath();
        ctx.fillStyle = p.bone;
        ctx.fill();
        ctx.strokeStyle = hexA(p.boneShade, 0.9);
        ctx.lineWidth = 0.007;
        ctx.stroke();
        // Radius, the bone that rotates so the palm can turn over.
        bone([{ x: -0.11, y: 0.06 }, { x: -0.09, y: 0.2 }, { x: -0.09, y: 0.46 }],
          (u) => 0.05 - u * 0.012);

        // Biceps, and the tendon inserting on the radius barely past the joint.
        ctx.save();
        ctx.translate(-0.21, -0.21);
        ctx.rotate(0.12);
        ctx.scale(0.52, 0.52);
        drawMuscle(ctx, p, 0.35);
        ctx.restore();
        tendon([{ x: -0.2, y: -0.07 }, { x: -0.15, y: 0.02 }, { x: -0.1, y: 0.12 }], 0.036);

        // The lever marked out: fulcrum, short effort arm, long load arm.
        ctx.setLineDash([0.02, 0.018]);
        ctx.strokeStyle = hexA(p.ink, 0.5);
        ctx.lineWidth = 0.007;
        ctx.beginPath();
        ctx.moveTo(-0.02, 0.03);
        ctx.lineTo(-0.1, 0.12);
        ctx.moveTo(-0.02, 0.03);
        ctx.lineTo(0.05, 0.46);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(-0.02, 0.03, 0.02, 0, TAU);
        ctx.fillStyle = hexA(p.arterial, 0.9);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.006;
        ctx.stroke();
        break;
      }

      /* ---------------------------------------------------------------- */
      case "knee": {
        // Femur with its two condyles: a rolling, gliding hinge, not a pin.
        bone([{ x: 0, y: -0.48 }, { x: -0.01, y: -0.28 }, { x: 0, y: -0.1 }],
          (u) => 0.06 + u * u * 0.035);
        for (const s of [-1, 1]) knob(s * 0.06, -0.04, 0.075, 0.085);
        // Menisci: the wedge-shaped shock absorbers between the bone ends.
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 0.14, 0.045);
          ctx.quadraticCurveTo(s * 0.06, 0.02, s * 0.02, 0.05);
          ctx.lineTo(s * 0.02, 0.075);
          ctx.lineTo(s * 0.14, 0.075);
          ctx.closePath();
          ctx.fillStyle = hexA(mix(p.cartilage, "#8fb8c4", 0.35), 0.95);
          ctx.fill();
        }
        cartilage([{ x: -0.15, y: 0.055 }, { x: 0, y: 0.035 }, { x: 0.15, y: 0.055 }], 0.03);

        // Tibia: the weight-bearing bone, with its broad flat plateau on top.
        bone([{ x: 0, y: 0.08 }, { x: 0.005, y: 0.24 }, { x: 0.005, y: 0.48 }],
          (u) => 0.12 - u * 0.06);
        // Fibula: takes almost no load, which is why it is so much thinner.
        bone([{ x: 0.13, y: 0.12 }, { x: 0.14, y: 0.3 }, { x: 0.14, y: 0.48 }], () => 0.028);

        // Cruciate ligaments, crossing inside the joint. They are what stops the
        // tibia sliding forward off the femur when you plant a foot and turn.
        ctx.strokeStyle = hexA(p.tendon, 0.85);
        ctx.lineWidth = 0.026;
        ctx.beginPath();
        ctx.moveTo(-0.05, -0.02); ctx.lineTo(0.05, 0.07);
        ctx.moveTo(0.05, -0.02); ctx.lineTo(-0.05, 0.07);
        ctx.stroke();

        // Quadriceps tendon, patella and patellar tendon. The kneecap is a
        // pulley: it holds the tendon away from the joint and so lengthens the
        // effort arm, which is exactly why losing it costs so much strength.
        ctx.save();
        ctx.translate(-0.21, -0.32);
        ctx.rotate(1.35);
        ctx.scale(0.48, 0.48);
        drawMuscle(ctx, p, 0.2);
        ctx.restore();
        tendon([{ x: -0.15, y: -0.36 }, { x: -0.145, y: -0.2 }, { x: -0.14, y: -0.11 }], 0.055);
        shadeBody(ctx, [
          { x: -0.2, y: -0.1 }, { x: -0.09, y: -0.09 }, { x: -0.06, y: 0.0 },
          { x: -0.13, y: 0.09 }, { x: -0.2, y: 0.03 },
        ], -0.13, -0.01, 0.1, p.bone, p.boneShade, p.boneLight, { gloss: 0.4 });
        tendon([{ x: -0.13, y: 0.07 }, { x: -0.1, y: 0.16 }, { x: -0.04, y: 0.22 }], 0.045);
        break;
      }

      /* ---------------------------------------------------------------- */
      case "spine": {
        // Lateral view, with all three natural curves. The S is the point: a
        // straight column would transmit every footfall straight to the skull,
        // and the curves are what let it act as a spring. It is also why the
        // discs at the bottom of the lumbar curve are the ones that fail.
        const N = 22;
        const at = (i: number): { x: number; y: number; s: number } => {
          const u = i / (N - 1);
          return {
            // Cervical lordosis forward, thoracic kyphosis back, lumbar forward.
            x: -Math.sin(u * Math.PI * 3.05 + 0.2) * 0.07,
            y: -0.46 + u * 0.92,
            // Vertebrae grow steadily bigger downward: they carry more weight.
            s: 0.4 + u * 0.6,
          };
        };
        // Discs first, so the vertebral bodies overlap them.
        for (let i = 0; i < N - 1; i++) {
          const a = at(i), b = at(i + 1);
          ctx.beginPath();
          ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, 0.085 * ((a.s + b.s) / 2), 0.026,
            Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2, 0, TAU);
          const dg = ctx.createLinearGradient(-0.08, 0, 0.08, 0);
          dg.addColorStop(0, mix(p.cartilage, "#ffffff", 0.4));
          dg.addColorStop(1, mix(p.cartilage, "#4f7d8c", 0.45));
          ctx.fillStyle = dg;
          ctx.fill();
        }
        for (let i = 0; i < N; i++) {
          const v = at(i);
          ctx.save();
          ctx.translate(v.x, v.y);
          ctx.scale(v.s, v.s);
          // Body in front, arch and spinous process pointing back — the bumps
          // you can feel down your own back are those processes.
          shadeBody(ctx, [
            { x: -0.1, y: -0.055 }, { x: 0.03, y: -0.06 }, { x: 0.06, y: 0 },
            { x: 0.03, y: 0.06 }, { x: -0.1, y: 0.055 }, { x: -0.13, y: 0 },
          ], -0.03, 0, 0.13, p.bone, p.boneShade, p.boneLight, { gloss: 0.35 });
          ctx.beginPath();
          ctx.moveTo(0.05, -0.03);
          ctx.quadraticCurveTo(0.16, -0.05, 0.21, 0.02);
          ctx.quadraticCurveTo(0.15, 0.05, 0.05, 0.04);
          ctx.closePath();
          ctx.fillStyle = p.bone;
          ctx.fill();
          ctx.strokeStyle = hexA(p.boneShade, 0.9);
          ctx.lineWidth = 0.012;
          ctx.stroke();
          ctx.restore();
        }
        // The cord running down the canal the arches enclose. Protecting it is
        // what the whole column is for.
        const cord: Pt[] = [];
        for (let i = 0; i < N; i++) {
          const v = at(i);
          cord.push({ x: v.x + 0.05 * v.s, y: v.y });
        }
        curve(ctx, cord, false);
        ctx.strokeStyle = hexA(p.nerve, 0.75);
        ctx.lineWidth = 0.03;
        ctx.stroke();
        // Sacrum: the five vertebrae that fused into one load-bearing wedge.
        shadeBody(ctx, [
          { x: -0.05, y: 0.44 }, { x: 0.12, y: 0.44 }, { x: 0.12, y: 0.62 },
          { x: 0.0, y: 0.72 }, { x: -0.08, y: 0.6 },
        ], 0.02, 0.55, 0.16, p.bone, p.boneShade, p.boneLight, { gloss: 0.3 });
        break;
      }
    }
  } finally {
    ctx.restore();
  }
}
