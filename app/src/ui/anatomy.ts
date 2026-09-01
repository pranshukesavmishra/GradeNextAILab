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
  marrow: string;
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
  kidney: string;
  kidneyDeep: string;
  kidneyLight: string;
  brain: string;
  brainDeep: string;
  brainLight: string;
  cerebellum: string;
  /** Nerve tissue is pale straw; myelin is the fatty white around an axon. */
  nerve: string;
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
    marrow: lift("#c4525f"),
    lung: lift("#ee8b9c", 0.06),
    lungDeep: lift("#b03f57"),
    airway: dark ? "#eadcc6" : "#e3d2b8",
    liver: lift("#7e2233"),
    liverLight: lift("#ab3547"),
    stomach: lift("#d98490", 0.06),
    stomachDeep: lift("#a44a5c"),
    gut: lift("#dfa07c", 0.06),
    gutDeep: lift("#a75f3f"),
    kidney: lift("#a13740"),
    kidneyDeep: "#6b1f2c",
    kidneyLight: lift("#c86a6f", 0.04),
    brain: lift("#deb2ab", 0.05),
    brainDeep: lift("#9a635f"),
    brainLight: dark ? "#f7ddd6" : "#f3d5cd",
    cerebellum: lift("#c9958e", 0.05),
    nerve: dark ? "#f2e08a" : "#e8d071",
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
 * two arms, two legs — so that a translucent skin fills the union exactly once
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
  const rs = densify(nodes.map((n, i) => ({ x: i, y: n.r })), false, 10).map((p) => p.y);
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
  ctx.lineWidth = Math.max(0.8, r * 0.028);
  ctx.stroke();
  if ((opts.rim ?? 1) > 0) {
    ctx.save();
    curve(ctx, path, true, s);
    ctx.clip();
    curve(ctx, path, true, s);
    ctx.strokeStyle = hexA("#ffffff", 0.3 * (opts.rim ?? 1));
    ctx.lineWidth = Math.max(1.4, r * 0.055);
    ctx.setLineDash([]);
    ctx.translate(r * 0.03, r * 0.03);
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

export function figureMetrics(x: number, y: number, h: number, pose: Pose = "stand"): FigureMetrics {
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
      // across the midline. That asymmetry is the entire read of the pose.
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
          N(s(0.34), 3.5, 0.42), N(s(0.42), 3.95, 0.38), N(s(0.5), 4.5, 0.33),
          N(s(0.55), 4.95, 0.28), N(s(0.6), 5.42, 0.28), N(s(0.66), 6.0, 0.2),
          N(s(0.66), 6.42, 0.13), N(s(0.56), 6.6, 0.15), N(s(0.46), 6.62, 0.1),
        ]
        : [
          N(s(0.32), 3.52, 0.42), N(s(0.27), 4.0, 0.37), N(s(0.22), 4.6, 0.31),
          N(s(0.18), 5.3, 0.25), N(s(0.17), 5.62, 0.23), N(s(0.2), 6.05, 0.25),
          N(s(0.24), 6.7, 0.17), N(s(0.28), 7.24, 0.11), N(s(0.32), 7.44, 0.1),
          N(s(0.38), 7.5, 0.07),
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

  ctx.save();

  /* Contact shadow, so the figure stands on something. */
  const sg = ctx.createRadialGradient(m.x, m.soleY, 0, m.x, m.soleY, H * 1.5);
  sg.addColorStop(0, hexA("#000000", p.dark ? 0.4 : 0.22));
  sg.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(m.x, m.soleY + H * 0.06, H * 1.5, H * 0.24, 0, 0, TAU);
  ctx.fill();

  /* The body as one path. Non-zero winding fills the union of torso and limbs
     exactly once, so translucent skin never double-darkens at a shoulder. */
  const body = () => bodyPath(ctx, parts);

  // Subsurface glow: flesh is translucent and light bleeds out of its edges.
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.shadowColor = hexA(p.skinDeep, 0.9);
  ctx.shadowBlur = H * 0.5;
  body();
  ctx.fillStyle = hexA(skin, 0.9);
  ctx.fill();
  ctx.restore();

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

  ctx.restore();
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

  const boneFill = (path: Pt[], s = 1) => {
    curve(ctx, path, true, s);
    const g = ctx.createLinearGradient(0, 0, H * 1.2, H * 1.2);
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
  // The orbits and nasal aperture: three dark openings that turn a dome into a
  // skull, drawn faintly so the head still reads as a living head.
  ctx.save();
  ctx.globalAlpha = 0.22;
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

  /* Cervical spine, then the whole vertebral column down to the sacrum. */
  const spine: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const yy = m.chin + (m.iliacY - m.chin) * u;
    // The column is not straight: cervical lordosis, thoracic kyphosis and
    // lumbar lordosis. In front view they show only as a slight S in width,
    // so here the curve is kept as the real sagittal shape flattened.
    spine.push({ x: X + Math.sin(u * Math.PI * 2) * H * 0.012, y: yy });
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
  ctx.strokeStyle = hexA(p.bone, 0.92);
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
      // The last two pairs are floating ribs: they end in cartilage and never
      // reach the sternum, which is why the waist can bend at all.
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
  // Obturator foramina — the two big holes that make a pelvis unmistakable.
  ctx.globalCompositeOperation = "destination-out";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(X + s * H * 0.26, m.crotchY - H * 0.08, H * 0.13, H * 0.17, s * 0.25, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

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

  // Limb bellies: biceps/triceps on the arm, quadriceps and gastrocnemius on
  // the leg, each drawn as a lit spindle along the limb's own axis.
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
  | "heart" | "lungs" | "stomach" | "intestine"
  | "liver" | "kidney" | "brain" | "muscle";

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
  ctx.translate(x, y);
  if (opts.angle) ctx.rotate(opts.angle);
  ctx.scale(opts.flip ? -size : size, size);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  switch (which) {
    case "heart": drawHeart(ctx, p, pulse); break;
    case "lungs": drawLungs(ctx, p, pulse); break;
    case "stomach": drawStomach(ctx, p, pulse); break;
    case "intestine": drawIntestine(ctx, p, pulse); break;
    case "liver": drawLiver(ctx, p); break;
    case "kidney": drawKidney(ctx, p, opts.section !== false); break;
    case "brain": drawBrain(ctx, p, pulse); break;
    case "muscle": drawMuscle(ctx, p, pulse); break;
  }
  ctx.restore();
}

/* ---------- heart ---------- */

/**
 * The heart, anterior view: a cone lying on its side with its apex pointing
 * down and to the anatomical left, exactly as it sits in a chest.
 *
 * The valentine shape taught in primary school is the one thing a student has
 * to unlearn, and it costs them the two facts that matter. First, the surface
 * grooves are not decoration: the atrioventricular groove and the anterior
 * interventricular groove are the external boundaries of the four chambers, so
 * a heart with grooves is a heart whose chambers can be found from outside.
 * Second, the coronary arteries run in those grooves, on the outside of the
 * heart — which is why a heart full of blood can still starve, and why a
 * blockage there is a heart attack.
 */
function drawHeart(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // Ventricular systole occupies roughly the first third of the cycle. The
  // heart gets *smaller* when it contracts, which is worth showing correctly.
  const sys = pulse < 0.4 ? Math.sin((pulse / 0.4) * Math.PI) : 0;
  const k = 1 - 0.055 * sys;

  const body: Pt[] = [
    { x: -0.30, y: -0.30 }, { x: -0.36, y: -0.14 }, { x: -0.355, y: 0.06 },
    { x: -0.28, y: 0.24 }, { x: -0.14, y: 0.35 }, { x: 0.06, y: 0.41 },
    { x: 0.24, y: 0.42 }, { x: 0.37, y: 0.35 },
    { x: 0.41, y: 0.28 }, { x: 0.41, y: 0.28 },
    { x: 0.42, y: 0.08 }, { x: 0.39, y: -0.12 }, { x: 0.33, y: -0.26 },
    { x: 0.19, y: -0.34 }, { x: 0.02, y: -0.36 }, { x: -0.16, y: -0.34 },
  ].map((q) => ({ x: q.x * k, y: q.y * k }));

  ctx.save();

  /* Great vessels behind the heart, drawn first so they emerge from the base. */
  const vess = (pts: Pt[], w: number, col: string, deep: string) => {
    const d = densify(pts, false, 10);
    curve(ctx, orient(ribbon(d, () => w / 2)), true, 0.8);
    const a = pts[0], b = pts[pts.length - 1];
    const g = ctx.createLinearGradient(a.x - w, a.y - w, b.x + w, b.y + w);
    g.addColorStop(0, mix(col, "#ffffff", 0.35));
    g.addColorStop(0.45, col);
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hexA(deep, 0.7);
    ctx.lineWidth = 0.008;
    ctx.stroke();
  };

  // Superior vena cava — blue, on the anatomical right, returning body blood.
  vess([{ x: -0.28, y: -0.68 }, { x: -0.29, y: -0.46 }, { x: -0.26, y: -0.26 }],
    0.09, p.venous, p.venousDeep);
  // Inferior vena cava, entering the right atrium from below.
  vess([{ x: -0.20, y: 0.56 }, { x: -0.22, y: 0.40 }, { x: -0.22, y: 0.26 }],
    0.085, p.venous, p.venousDeep);
  // Aorta: ascends, arches over to the anatomical left and descends behind.
  vess([
    { x: -0.05, y: -0.30 }, { x: -0.03, y: -0.48 }, { x: 0.04, y: -0.60 },
    { x: 0.17, y: -0.60 }, { x: 0.25, y: -0.48 }, { x: 0.27, y: -0.28 },
    { x: 0.28, y: -0.14 },
  ], 0.1, p.arterial, p.arterialDeep);
  // The three arch branches: head and arms are supplied before anything else.
  for (const [bx, by] of [[0.02, -0.62], [0.10, -0.64], [0.19, -0.62]] as const) {
    vess([{ x: bx, y: by + 0.05 }, { x: bx - 0.01, y: by - 0.14 }],
      0.045, p.arterial, p.arterialDeep);
  }
  // Pulmonary trunk: leaves the right ventricle carrying *deoxygenated* blood
  // to the lungs, which is why it is drawn blue despite being an artery.
  vess([
    { x: -0.13, y: -0.22 }, { x: -0.10, y: -0.38 }, { x: -0.02, y: -0.47 },
  ], 0.11, p.venous, p.venousDeep);
  vess([{ x: -0.04, y: -0.47 }, { x: -0.20, y: -0.50 }, { x: -0.33, y: -0.46 }],
    0.07, p.venous, p.venousDeep);
  vess([{ x: -0.02, y: -0.47 }, { x: 0.12, y: -0.50 }, { x: 0.24, y: -0.44 }],
    0.07, p.venous, p.venousDeep);
  // Pulmonary veins: the one place veins carry oxygenated blood, so red.
  for (const yy of [-0.26, -0.14]) {
    vess([{ x: 0.30, y: yy }, { x: 0.44, y: yy - 0.03 }], 0.05, p.arterial, p.arterialDeep);
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
     Right heart on the anatomical right (viewer's left) is thin-walled: it
     pushes blood a few centimetres to the lungs. The left ventricle's wall is
     three times thicker because it drives the entire body. That difference is
     the single most examined fact about the heart, so it is drawn to scale. */
  const cavity = (pts: Pt[], col: string, a: number) => {
    curve(ctx, pts, true, 0.9);
    ctx.fillStyle = hexA(col, a);
    ctx.fill();
    ctx.strokeStyle = hexA(mix(col, "#000000", 0.4), a * 0.7);
    ctx.lineWidth = 0.006;
    ctx.stroke();
  };
  const c = (pts: Array<[number, number]>): Pt[] =>
    pts.map(([px, py]) => ({ x: px * k, y: py * k }));
  // Right atrium
  cavity(c([[-0.27, -0.26], [-0.31, -0.10], [-0.29, 0.04], [-0.16, 0.02],
    [-0.09, -0.10], [-0.13, -0.26]]), p.venous, 0.5);
  // Left atrium (mostly posterior; its appendage is what shows in front)
  cavity(c([[0.04, -0.28], [0.20, -0.27], [0.29, -0.18], [0.22, -0.06],
    [0.06, -0.08], [-0.01, -0.19]]), p.arterial, 0.42);
  // Right ventricle — a thin crescent wrapped round the front of the left
  cavity(c([[-0.20, 0.10], [-0.16, 0.26], [0.02, 0.33], [0.14, 0.28],
    [0.06, 0.12], [-0.05, 0.05]]), p.venous, 0.52);
  // Left ventricle — small cavity, very thick wall
  cavity(c([[0.10, 0.06], [0.20, 0.06], [0.27, 0.18], [0.24, 0.30],
    [0.14, 0.28], [0.09, 0.16]]), p.arterial, 0.55);

  // Epicardial fat lies in the grooves in a real heart and makes them legible.
  ctx.strokeStyle = hexA(p.fat, 0.5);
  ctx.lineWidth = 0.05;
  const avGroove: Pt[] = c([[-0.36, -0.02], [-0.18, 0.06], [0.02, 0.02], [0.20, -0.08], [0.33, -0.22]]);
  const ivGroove: Pt[] = c([[-0.02, 0.02], [0.10, 0.16], [0.22, 0.28], [0.34, 0.33]]);
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();
  ctx.strokeStyle = hexA(p.muscleDeep, 0.55);
  ctx.lineWidth = 0.012;
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();

  /* Coronary arteries, running in the grooves on the outside of the muscle.
     They flush at systole because that is when the aortic root fills them. */
  ctx.strokeStyle = hexA(mix(p.arterial, "#ffffff", 0.1 + 0.3 * sys), 0.95);
  ctx.lineWidth = 0.019;
  curve(ctx, avGroove, false); ctx.stroke();
  curve(ctx, ivGroove, false); ctx.stroke();
  ctx.lineWidth = 0.011;
  // Diagonal and marginal branches: the tree that feeds the muscle wall.
  for (const br of [
    [[-0.28, 0.02], [-0.30, 0.16], [-0.26, 0.28]],
    [[0.06, 0.10], [0.16, 0.10], [0.24, 0.16]],
    [[0.14, 0.20], [0.06, 0.26], [-0.02, 0.30]],
    [[0.18, -0.06], [0.28, 0.00], [0.34, 0.10]],
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
 * left lung where the heart sits. That asymmetry is not a drawing error a
 * student should ever be shown as symmetry — it is the reason the heart is
 * palpable on the left of the chest. The bronchial tree is drawn branching all
 * the way into the tissue because the branching *is* the organ: twenty-three
 * generations of division are what turn one windpipe into the surface area of
 * a tennis court.
 */
function drawLungs(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // Inspiration widens the base far more than the apex: the diaphragm does
  // most of the work, so the lungs grow downward and outward, not evenly.
  const br = Math.sin(pulse * TAU - Math.PI / 2) * 0.5 + 0.5;
  const sx = 1 + br * 0.035, sy = 1 + br * 0.06;
  const f = (q: Pt): Pt => ({ x: q.x * sx, y: q.y * sy + br * 0.01 });

  const right: Pt[] = [
    { x: -0.22, y: -0.44 }, { x: -0.34, y: -0.38 }, { x: -0.44, y: -0.20 },
    { x: -0.48, y: 0.04 }, { x: -0.45, y: 0.26 }, { x: -0.36, y: 0.40 },
    { x: -0.22, y: 0.38 }, { x: -0.15, y: 0.18 }, { x: -0.13, y: -0.10 },
    { x: -0.16, y: -0.32 },
  ].map(f);
  // The left lung is smaller and carries the cardiac notch on its inner edge.
  const left: Pt[] = [
    { x: 0.22, y: -0.44 }, { x: 0.34, y: -0.38 }, { x: 0.44, y: -0.20 },
    { x: 0.47, y: 0.04 }, { x: 0.44, y: 0.26 }, { x: 0.34, y: 0.40 },
    { x: 0.20, y: 0.37 }, { x: 0.15, y: 0.20 },
    { x: 0.26, y: 0.10 }, { x: 0.27, y: -0.04 }, { x: 0.15, y: -0.14 },
    { x: 0.16, y: -0.32 },
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
    const yy = -0.61 + i * 0.042;
    ctx.beginPath();
    ctx.arc(0, yy, 0.043, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // The right main bronchus is wider and more vertical than the left — the
  // reason an inhaled peanut almost always ends up in the right lung.
  airway([{ x: -0.01, y: -0.37 }, { x: -0.09, y: -0.30 }, { x: -0.15, y: -0.22 }], 0.065);
  airway([{ x: 0.01, y: -0.37 }, { x: 0.10, y: -0.26 }, { x: 0.17, y: -0.19 }], 0.055);

  for (const [lung, hilum, side] of [
    [right, { x: -0.15, y: -0.22 }, -1],
    [left, { x: 0.17, y: -0.19 }, 1],
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
    branch(hilum.x, hilum.y, side < 0 ? Math.PI * 0.86 : Math.PI * 0.14, 0.14, 0.03, 5, 7);
    branch(hilum.x, hilum.y, side < 0 ? -Math.PI * 0.72 : -Math.PI * 0.28, 0.11, 0.024, 4, 13);

    // Alveolar texture: the pink foam the branches end in.
    const r = rng(side < 0 ? 21 : 34);
    for (let i = 0; i < 130; i++) {
      const ax = (r() - 0.5) * 1.0, ay = (r() - 0.5) * 1.0;
      const rr = 0.006 + r() * 0.012;
      ctx.beginPath();
      ctx.arc(ax, ay, rr, 0, TAU);
      ctx.fillStyle = hexA(r() > 0.5 ? "#ffffff" : p.lungDeep, 0.16);
      ctx.fill();
    }

    // Fissures. The right lung has two (oblique and horizontal) dividing it
    // into three lobes; the left has only the oblique, giving two.
    ctx.lineWidth = 0.012;
    ctx.strokeStyle = hexA(p.lungDeep, 0.75);
    if (side < 0) {
      curve(ctx, [{ x: -0.44, y: -0.24 }, { x: -0.32, y: 0.06 }, { x: -0.19, y: 0.36 }], false);
      ctx.stroke();
      curve(ctx, [{ x: -0.38, y: -0.06 }, { x: -0.24, y: -0.09 }, { x: -0.13, y: -0.08 }], false);
      ctx.stroke();
    } else {
      curve(ctx, [{ x: 0.43, y: -0.22 }, { x: 0.30, y: 0.08 }, { x: 0.19, y: 0.35 }], false);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- brain ---------- */

/**
 * The brain in left lateral view: cerebrum, cerebellum and brainstem.
 *
 * Drawn folded, because the folding is the answer to the question students
 * always ask. A sheet of cortex two and a half square feet across has to fit
 * in a skull, so it crumples; the ridges are gyri, the valleys are sulci, and
 * two of those valleys are landmarks worth naming — the lateral fissure that
 * cuts off the temporal lobe, and the central sulcus that separates the strip
 * that moves you from the strip that feels. The cerebellum is drawn with much
 * finer, parallel folia than the cerebrum, which is exactly how you tell the
 * two apart on a real specimen.
 */
function drawBrain(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const cerebrum: Pt[] = [
    { x: -0.44, y: -0.02 }, { x: -0.41, y: -0.20 }, { x: -0.30, y: -0.33 },
    { x: -0.12, y: -0.40 }, { x: 0.08, y: -0.39 }, { x: 0.26, y: -0.31 },
    { x: 0.38, y: -0.17 }, { x: 0.42, y: 0.00 }, { x: 0.38, y: 0.13 },
    { x: 0.26, y: 0.17 }, { x: 0.12, y: 0.19 },
    { x: 0.02, y: 0.27 }, { x: -0.14, y: 0.31 }, { x: -0.28, y: 0.26 },
    { x: -0.37, y: 0.17 }, { x: -0.43, y: 0.08 },
  ];

  ctx.save();

  /* Brainstem first — it runs behind and below, out of the skull. */
  const stem: Pt[] = [
    { x: 0.06, y: 0.10 }, { x: 0.09, y: 0.24 }, { x: 0.11, y: 0.34 },
    { x: 0.13, y: 0.46 },
  ];
  curve(ctx, orient(ribbon(densify(stem, false, 10), (u) => 0.062 - u * 0.022)), true, 0.8);
  const sg = ctx.createLinearGradient(0.02, 0.1, 0.2, 0.46);
  sg.addColorStop(0, mix(p.brain, "#ffffff", 0.3));
  sg.addColorStop(1, p.brainDeep);
  ctx.fillStyle = sg;
  ctx.fill();
  // The pons: the distinct forward bulge of transverse fibres crossing to the
  // cerebellum. Without it the brainstem is just a stalk.
  ctx.beginPath();
  ctx.ellipse(0.075, 0.245, 0.058, 0.048, -0.2, 0, TAU);
  ctx.fillStyle = mix(p.brain, "#ffffff", 0.12);
  ctx.fill();
  ctx.strokeStyle = hexA(p.brainDeep, 0.5);
  ctx.lineWidth = 0.005;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0.03, 0.245 + i * 0.016);
    ctx.lineTo(0.12, 0.245 + i * 0.016);
    ctx.stroke();
  }

  /* Cerebellum: below and behind, with its fine parallel folia. */
  const cbl: Pt[] = [
    { x: 0.10, y: 0.14 }, { x: 0.26, y: 0.12 }, { x: 0.38, y: 0.18 },
    { x: 0.40, y: 0.30 }, { x: 0.30, y: 0.38 }, { x: 0.16, y: 0.36 },
    { x: 0.09, y: 0.27 },
  ];
  shadeBody(ctx, cbl, 0.24, 0.25, 0.17, p.cerebellum,
    mix(p.brainDeep, "#000000", 0.15), mix(p.cerebellum, "#ffffff", 0.4), { gloss: 0.22 });
  ctx.save();
  curve(ctx, cbl, true);
  ctx.clip();
  ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.2), 0.6);
  ctx.lineWidth = 0.007;
  for (let i = 0; i < 14; i++) {
    const yy = 0.1 + i * 0.021;
    ctx.beginPath();
    ctx.moveTo(0.06, yy + 0.02);
    ctx.quadraticCurveTo(0.24, yy - 0.012, 0.44, yy + 0.014);
    ctx.stroke();
  }
  ctx.restore();

  /* Cerebrum. */
  shadeBody(ctx, cerebrum, -0.04, -0.06, 0.46, p.brain, p.brainDeep, p.brainLight,
    { gloss: 0.2 });

  ctx.save();
  curve(ctx, cerebrum, true);
  ctx.clip();

  /**
   * Gyri. Each ridge is stroked twice: a wide dark pass that becomes the sulcus
   * shadow around it, then a narrower light pass offset up-left toward the key.
   * That pairing is what makes a fold look like a fold rather than a scribble.
   */
  const r = rng(9);
  const ridges: Pt[][] = [];
  for (let i = 0; i < 30; i++) {
    const startY = -0.44 + (i % 10) * 0.09 + (i > 19 ? 0.03 : 0);
    const startX = -0.5 + Math.floor(i / 10) * 0.32 + r() * 0.1;
    const pts: Pt[] = [];
    let px = startX, py = startY;
    let ang = 0.35 + r() * 0.9;
    for (let s = 0; s < 7; s++) {
      pts.push({ x: px, y: py });
      ang += (r() - 0.5) * 1.5;
      const step = 0.09 + r() * 0.06;
      px += Math.cos(ang) * step;
      py += Math.sin(ang) * step * 0.7;
    }
    ridges.push(pts);
  }
  for (const ridge of ridges) {
    curve(ctx, ridge, false);
    ctx.strokeStyle = hexA(p.brainDeep, 0.55);
    ctx.lineWidth = 0.075;
    ctx.stroke();
  }
  for (const ridge of ridges) {
    curve(ctx, ridge.map((q) => ({ x: q.x - 0.008, y: q.y - 0.009 })), false);
    ctx.strokeStyle = hexA(mix(p.brainLight, "#ffffff", 0.3), 0.75);
    ctx.lineWidth = 0.046;
    ctx.stroke();
  }

  // The two landmark clefts, cut deeper than any ordinary sulcus.
  ctx.lineCap = "round";
  const deepCleft = (pts: Pt[], w: number) => {
    curve(ctx, pts, false);
    ctx.strokeStyle = hexA(mix(p.brainDeep, "#000000", 0.35), 0.8);
    ctx.lineWidth = w;
    ctx.stroke();
    curve(ctx, pts.map((q) => ({ x: q.x - 0.006, y: q.y - 0.008 })), false);
    ctx.strokeStyle = hexA(p.brainLight, 0.35);
    ctx.lineWidth = w * 0.35;
    ctx.stroke();
  };
  // Lateral (Sylvian) fissure — everything below it is the temporal lobe.
  deepCleft([{ x: -0.37, y: 0.11 }, { x: -0.20, y: 0.15 }, { x: -0.02, y: 0.12 },
    { x: 0.12, y: 0.05 }], 0.042);
  // Central sulcus — motor cortex in front of it, sensory behind.
  deepCleft([{ x: -0.02, y: -0.40 }, { x: -0.07, y: -0.22 }, { x: -0.13, y: -0.04 },
    { x: -0.16, y: 0.09 }], 0.03);

  // Activity: a warm wash sweeping the cortex, so a "brain is working" state
  // is visible without cartoon lightning.
  if (pulse > 0) {
    const gx = -0.4 + pulse * 0.9;
    const ag = ctx.createRadialGradient(gx, -0.1, 0, gx, -0.1, 0.34);
    ag.addColorStop(0, hexA(mix(p.arterial, "#ffd08a", 0.5), 0.4));
    ag.addColorStop(1, hexA(p.arterial, 0));
    ctx.fillStyle = ag;
    ctx.fillRect(-0.5, -0.5, 1, 1);
  }
  ctx.restore();
  ctx.restore();
}

/* ---------- stomach ---------- */

/**
 * The stomach: a J with two curvatures.
 *
 * The shape carries the function. The long convex greater curvature and the
 * short concave lesser curvature exist because the stomach grows unevenly,
 * and the notch between them (the incisura angularis) marks where the body
 * becomes the antrum that grinds. The rugae inside are folds that flatten out
 * as it fills, which is how an organ the size of a fist holds a litre and a
 * half — the answer to "where does all the food go?".
 */
function drawStomach(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  // Peristalsis: a ring of constriction travelling from body to pylorus.
  const wave = pulse;

  const body: Pt[] = [
    { x: -0.26, y: -0.30 },                    // cardia, where the oesophagus enters
    { x: -0.37, y: -0.38 }, { x: -0.45, y: -0.24 },  // fundus, the gas bubble
    { x: -0.47, y: -0.02 }, { x: -0.42, y: 0.20 },   // greater curvature
    { x: -0.26, y: 0.36 }, { x: -0.04, y: 0.40 },
    { x: 0.16, y: 0.33 }, { x: 0.27, y: 0.22 },      // antrum sweeping up
    { x: 0.31, y: 0.13 },                            // pylorus
    { x: 0.20, y: 0.10 }, { x: 0.06, y: 0.14 },
    { x: -0.02, y: 0.03 },                           // incisura angularis
    { x: -0.10, y: -0.12 }, { x: -0.17, y: -0.24 },  // lesser curvature
  ];

  ctx.save();

  // Oesophagus above, duodenum below: the tract must arrive and leave.
  const tube = (pts: Pt[], w: number, col: string, deep: string) => {
    curve(ctx, orient(ribbon(densify(pts, false, 10), () => w / 2)), true, 0.8);
    const g = ctx.createLinearGradient(pts[0].x - w, pts[0].y, pts[0].x + w * 2, pts[0].y + w);
    g.addColorStop(0, mix(col, "#ffffff", 0.4));
    g.addColorStop(0.5, col);
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hexA(deep, 0.6);
    ctx.lineWidth = 0.007;
    ctx.stroke();
  };
  tube([{ x: -0.30, y: -0.56 }, { x: -0.28, y: -0.42 }, { x: -0.24, y: -0.28 }],
    0.1, p.stomach, p.stomachDeep);
  // The C-shaped duodenum, curving down and around the head of the pancreas.
  tube([{ x: 0.30, y: 0.13 }, { x: 0.42, y: 0.20 }, { x: 0.45, y: 0.36 },
    { x: 0.34, y: 0.47 }, { x: 0.20, y: 0.46 }], 0.085, p.gut, p.gutDeep);

  shadeBody(ctx, body, -0.06, 0.0, 0.44, p.stomach, p.stomachDeep,
    mix(p.stomach, "#ffffff", 0.45), { gloss: 0.34 });

  ctx.save();
  curve(ctx, body, true);
  ctx.clip();

  // Rugae: the longitudinal mucosal folds, running with the long axis.
  ctx.strokeStyle = hexA(p.stomachDeep, 0.45);
  ctx.lineWidth = 0.014;
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    ctx.beginPath();
    ctx.moveTo(-0.42 + u * 0.08, -0.26 + u * 0.5);
    ctx.bezierCurveTo(
      -0.24 + u * 0.06, -0.12 + u * 0.44,
      0.02 + u * 0.04, 0.02 + u * 0.3,
      0.22, 0.14 + u * 0.1,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = hexA("#ffffff", 0.22);
  ctx.lineWidth = 0.007;
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    ctx.beginPath();
    ctx.moveTo(-0.42 + u * 0.08, -0.272 + u * 0.5);
    ctx.bezierCurveTo(
      -0.24 + u * 0.06, -0.132 + u * 0.44,
      0.02 + u * 0.04, 0.008 + u * 0.3,
      0.22, 0.128 + u * 0.1,
    );
    ctx.stroke();
  }

  // The muscular wall squeezing: a travelling constriction, drawn as a paired
  // shadow so it reads as a groove pinched into the organ.
  const wx = -0.4 + wave * 0.72;
  const wg = ctx.createLinearGradient(wx - 0.07, 0, wx + 0.07, 0);
  wg.addColorStop(0, hexA(p.stomachDeep, 0));
  wg.addColorStop(0.5, hexA(p.stomachDeep, 0.55));
  wg.addColorStop(1, hexA(p.stomachDeep, 0));
  ctx.fillStyle = wg;
  ctx.fillRect(wx - 0.08, -0.5, 0.16, 1);
  ctx.restore();

  // The pyloric sphincter: a thickened muscular ring, the gate to the gut.
  ctx.beginPath();
  ctx.ellipse(0.295, 0.13, 0.028, 0.05, -0.5, 0, TAU);
  ctx.fillStyle = hexA(p.muscle, 0.75);
  ctx.fill();
  ctx.restore();
}

/* ---------- intestine ---------- */

/**
 * The small intestine coiled inside a frame of large intestine.
 *
 * The arrangement is the lesson: the large intestine is not "more intestine",
 * it is a different organ wrapped around the outside, and you can tell them
 * apart by eye. The colon is wider, sacculated into haustra by the three
 * muscle bands that run its length, and it is fixed in place — up the right
 * side, across, down the left. The small intestine is narrower, smooth, and
 * six metres of it hangs loose in the middle. Draw them the same and a student
 * cannot answer where absorption happens.
 */
function drawIntestine(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  ctx.save();

  /* Small intestine: a serpentine coil filling the centre. */
  const coil: Pt[] = [];
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const yy = -0.2 + i * 0.115;
    const dir = i % 2 === 0 ? 1 : -1;
    for (let s = 0; s <= 6; s++) {
      const u = s / 6;
      coil.push({
        x: (-0.22 + u * 0.44) * dir,
        y: yy + Math.sin(u * Math.PI) * 0.035,
      });
    }
    if (i < rows - 1) {
      coil.push({ x: 0.27 * dir, y: yy + 0.058 });
    }
  }
  const coilPts = densify(coil, false, 6);
  curve(ctx, orient(ribbon(coilPts, () => 0.043)), true, 0.8);
  const cg = ctx.createLinearGradient(-0.3, -0.3, 0.3, 0.35);
  cg.addColorStop(0, mix(p.gut, "#ffffff", 0.42));
  cg.addColorStop(0.45, mix(p.gut, "#e6b48f", 0.4));
  cg.addColorStop(1, p.gutDeep);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = hexA(p.gutDeep, 0.6);
  ctx.lineWidth = 0.008;
  ctx.stroke();
  // Circular folds and the vessel arcades of the mesentery that feed it.
  ctx.save();
  curve(ctx, orient(ribbon(coilPts, () => 0.043)), true, 0.8);
  ctx.clip();
  ctx.strokeStyle = hexA(p.gutDeep, 0.35);
  ctx.lineWidth = 0.006;
  for (let i = 0; i < coilPts.length; i += 3) {
    const a = coilPts[Math.max(0, i - 1)], b = coilPts[Math.min(coilPts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 0.043, ny = (dx / len) * 0.043;
    ctx.beginPath();
    ctx.moveTo(coilPts[i].x + nx, coilPts[i].y + ny);
    ctx.lineTo(coilPts[i].x - nx, coilPts[i].y - ny);
    ctx.stroke();
  }
  // A highlight ridge along the top of the tube gives it roundness.
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = 0.016;
  curve(ctx, coilPts.map((q) => ({ x: q.x - 0.008, y: q.y - 0.014 })), false);
  ctx.stroke();
  ctx.restore();

  /* Large intestine: the frame. Ascending on the anatomical right (viewer's
     left), transverse across, descending on the left, sigmoid into rectum.
     The splenic flexure sits higher than the hepatic one, as it really does. */
  const colon: Pt[] = [
    { x: -0.33, y: 0.40 },                          // caecum
    { x: -0.37, y: 0.20 }, { x: -0.38, y: -0.06 },  // ascending
    { x: -0.35, y: -0.28 }, { x: -0.26, y: -0.35 }, // hepatic flexure
    { x: -0.08, y: -0.30 }, { x: 0.10, y: -0.31 },  // transverse, sagging
    { x: 0.28, y: -0.38 }, { x: 0.37, y: -0.30 },   // splenic flexure, higher
    { x: 0.39, y: -0.06 }, { x: 0.38, y: 0.18 },    // descending
    { x: 0.30, y: 0.36 }, { x: 0.14, y: 0.44 },     // sigmoid
    { x: 0.06, y: 0.38 }, { x: 0.03, y: 0.48 },     // rectum
  ];
  const cp = densify(colon, false, 8);
  const acc = arcLengths(cp);
  const total = acc[acc.length - 1] || 1;
  // Haustra: the colon is pouched, because the three taeniae coli are shorter
  // than the gut they run along and gather it like a curtain.
  const haustraW = (u: number) => 0.052 + Math.sin(u * total * 26) * 0.008;
  curve(ctx, orient(ribbon(cp, haustraW)), true, 0.8);
  const lg = ctx.createLinearGradient(-0.4, -0.4, 0.4, 0.45);
  lg.addColorStop(0, mix(p.gut, "#ffffff", 0.34));
  lg.addColorStop(0.5, p.gut);
  lg.addColorStop(1, p.gutDeep);
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.strokeStyle = hexA(p.gutDeep, 0.75);
  ctx.lineWidth = 0.009;
  ctx.stroke();

  ctx.save();
  curve(ctx, orient(ribbon(cp, haustraW)), true, 0.8);
  ctx.clip();
  // The taenia: a pale muscular band running the whole length.
  ctx.strokeStyle = hexA(mix(p.gut, "#ffffff", 0.4), 0.7);
  ctx.lineWidth = 0.016;
  curve(ctx, cp.map((q) => ({ x: q.x - 0.012, y: q.y - 0.016 })), false);
  ctx.stroke();
  // Haustral clefts: the transverse creases between pouches.
  ctx.strokeStyle = hexA(p.gutDeep, 0.5);
  ctx.lineWidth = 0.008;
  for (let i = 0; i < 40; i++) {
    const s = along(cp, acc, i / 40);
    ctx.beginPath();
    ctx.moveTo(s.p.x - s.ty * 0.06, s.p.y + s.tx * 0.06);
    ctx.lineTo(s.p.x + s.ty * 0.06, s.p.y - s.tx * 0.06);
    ctx.stroke();
  }
  ctx.restore();

  // Caecum and appendix — small, but the one piece of gut students can name
  // from personal terror, and it hangs off the caecum, not the small bowel.
  ctx.beginPath();
  ctx.ellipse(-0.33, 0.42, 0.062, 0.055, 0.2, 0, TAU);
  ctx.fillStyle = mix(p.gut, "#ffffff", 0.2);
  ctx.fill();
  ctx.strokeStyle = hexA(p.gutDeep, 0.7);
  ctx.lineWidth = 0.008;
  ctx.stroke();
  curve(ctx, orient(ribbon(densify([
    { x: -0.33, y: 0.46 }, { x: -0.30, y: 0.53 }, { x: -0.24, y: 0.56 },
  ], false, 8), () => 0.013)), true, 0.8);
  ctx.fillStyle = mix(p.gut, p.gutDeep, 0.3);
  ctx.fill();

  // A peristaltic bolus travelling the small bowel.
  if (pulse > 0) {
    const s = along(coilPts, arcLengths(coilPts), pulse);
    const bg = ctx.createRadialGradient(s.p.x, s.p.y, 0, s.p.x, s.p.y, 0.06);
    bg.addColorStop(0, hexA(p.gutDeep, 0.6));
    bg.addColorStop(1, hexA(p.gutDeep, 0));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(s.p.x, s.p.y, 0.06, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------- liver ---------- */

/**
 * The liver: a wedge with a big right lobe and a small left one.
 *
 * It is drawn deep maroon rather than brown because that colour is a fact
 * about it — the liver holds about a pint of blood at any moment, more than
 * any other organ, and that is why it is the body's chemical plant. The sharp
 * inferior border and the domed superior surface are the shape the diaphragm
 * presses it into; the falciform ligament between the lobes is the landmark
 * every liver diagram is divided by.
 */
function drawLiver(ctx: CanvasRenderingContext2D, p: AnatomyPalette): void {
  const body: Pt[] = [
    { x: -0.46, y: -0.06 }, { x: -0.42, y: -0.24 }, { x: -0.28, y: -0.35 },
    { x: -0.06, y: -0.38 }, { x: 0.16, y: -0.34 }, { x: 0.36, y: -0.24 },
    { x: 0.45, y: -0.10 },
    { x: 0.38, y: 0.04 }, { x: 0.18, y: 0.12 },
    { x: -0.02, y: 0.20 }, { x: -0.22, y: 0.28 },
    { x: -0.22, y: 0.28 },
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
    const bx = (r() - 0.5) * 0.95, by = (r() - 0.5) * 0.8;
    ctx.beginPath();
    ctx.arc(bx, by, 0.008 + r() * 0.014, 0, TAU);
    ctx.fillStyle = hexA(r() > 0.5 ? p.liverLight : "#2a0710", 0.13);
    ctx.fill();
  }
  // Portal vein and hepatic artery entering at the porta hepatis underneath.
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
  const gb: Pt[] = [
    { x: -0.14, y: 0.16 }, { x: -0.06, y: 0.22 }, { x: -0.05, y: 0.32 },
    { x: -0.12, y: 0.38 }, { x: -0.20, y: 0.33 }, { x: -0.21, y: 0.22 },
  ];
  shadeBody(ctx, gb, -0.13, 0.28, 0.11, "#4f8f4a", "#1f4b22", "#a8d47e", { gloss: 0.45 });
  ctx.restore();
}

/* ---------- kidney ---------- */

/**
 * A kidney, hemisected so the working parts show.
 *
 * The bean outline alone teaches nothing. What a student needs to see is the
 * layering: a pale outer cortex where every one of a million nephrons begins,
 * darker medullary pyramids striped with the collecting ducts that give them
 * their name, and the calyces those pyramids drip into, funnelling to a pelvis
 * and out through the ureter. The artery, the vein and the ureter all enter at
 * the hilum, which is why the bean has a notch at all.
 */
function drawKidney(ctx: CanvasRenderingContext2D, p: AnatomyPalette, section: boolean): void {
  const body: Pt[] = [
    { x: -0.10, y: -0.40 }, { x: -0.26, y: -0.34 }, { x: -0.36, y: -0.16 },
    { x: -0.38, y: 0.08 }, { x: -0.30, y: 0.30 }, { x: -0.12, y: 0.40 },
    { x: 0.08, y: 0.36 }, { x: 0.20, y: 0.22 },
    { x: 0.10, y: 0.10 }, { x: 0.04, y: 0.0 }, { x: 0.10, y: -0.10 },
    { x: 0.20, y: -0.22 }, { x: 0.08, y: -0.36 },
  ];
  ctx.save();

  // Hilar vessels first — they come in from behind the notch.
  const stub = (pts: Pt[], w: number, col: string, deep: string) => {
    curve(ctx, orient(ribbon(densify(pts, false, 8), () => w / 2)), true, 0.8);
    const g = ctx.createLinearGradient(pts[0].x, pts[0].y - w, pts[0].x, pts[0].y + w);
    g.addColorStop(0, mix(col, "#ffffff", 0.4));
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fill();
  };
  stub([{ x: 0.06, y: -0.07 }, { x: 0.26, y: -0.10 }, { x: 0.44, y: -0.12 }],
    0.07, p.arterial, p.arterialDeep);
  stub([{ x: 0.06, y: 0.03 }, { x: 0.28, y: 0.06 }, { x: 0.46, y: 0.06 }],
    0.085, p.venous, p.venousDeep);
  // Ureter: leaves downward, because urine has to run to a bladder below.
  stub([{ x: 0.07, y: 0.10 }, { x: 0.22, y: 0.24 }, { x: 0.28, y: 0.48 }],
    0.055, p.airway, p.gutDeep);

  shadeBody(ctx, body, -0.12, 0.0, 0.4, p.kidney, p.kidneyDeep, p.kidneyLight,
    { gloss: 0.36 });

  if (section) {
    ctx.save();
    curve(ctx, body, true);
    ctx.clip();
    // Cortex: the pale outer rind, about a third of the way in.
    curve(ctx, body, true);
    ctx.strokeStyle = hexA(mix(p.kidneyLight, "#ffe0d2", 0.4), 0.75);
    ctx.lineWidth = 0.11;
    ctx.stroke();

    // Medullary pyramids: bases out at the cortex, apices pointing to the
    // hilum, striped along the direction the collecting ducts run.
    for (let i = 0; i < 7; i++) {
      const a = -1.15 + (i / 6) * 2.3;
      const bx = 0.03 + Math.cos(a + Math.PI) * 0.06;
      const by = 0.0 + Math.sin(a + Math.PI) * 0.06;
      const ox = Math.cos(a + Math.PI), oy = Math.sin(a + Math.PI);
      const tipX = bx + ox * 0.19, tipY = by + oy * 0.19;
      const px = -oy, py = ox;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tipX + px * 0.075, tipY + py * 0.075);
      ctx.lineTo(tipX - px * 0.075, tipY - py * 0.075);
      ctx.closePath();
      const g = ctx.createLinearGradient(bx, by, tipX, tipY);
      g.addColorStop(0, mix(p.kidneyDeep, "#000000", 0.15));
      g.addColorStop(1, mix(p.kidney, "#ffffff", 0.1));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hexA(mix(p.kidneyLight, "#ffffff", 0.4), 0.4);
      ctx.lineWidth = 0.005;
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.moveTo(bx + px * s * 0.022, by + py * s * 0.022);
        ctx.lineTo(tipX + px * s * 0.012, tipY + py * s * 0.012);
        ctx.stroke();
      }
    }
    // Pelvis and calyces: the collecting funnel, drawn pale because it is
    // urine-filled space, not tissue.
    ctx.beginPath();
    ctx.moveTo(0.10, -0.14);
    ctx.quadraticCurveTo(-0.02, 0.0, 0.10, 0.14);
    ctx.quadraticCurveTo(0.16, 0.0, 0.10, -0.14);
    ctx.fillStyle = hexA(mix(p.airway, "#ffffff", 0.4), 0.85);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- muscle ---------- */

/**
 * A fusiform skeletal muscle: two tendons and a belly of striated fibres.
 *
 * The fibre direction is the mechanism. A muscle can only pull, and it can
 * only pull along its fibres, so the line from tendon to tendon is the line of
 * force — which is why the fibres are drawn running the full length rather
 * than as decorative hatching. Contracting shortens the whole muscle and makes
 * the belly thicker, since the volume has to go somewhere; that bulge is what
 * a student feels on their own arm and it must be visible here.
 */
function drawMuscle(ctx: CanvasRenderingContext2D, p: AnatomyPalette, pulse: number): void {
  const c = pulse;                     // 0 relaxed, 1 fully contracted
  const bellyHalf = 0.30 * (1 - c * 0.2);
  const thick = 0.16 * (1 + c * 0.42);

  const belly: Pt[] = [
    { x: -bellyHalf, y: 0 },
    { x: -bellyHalf * 0.6, y: -thick * 0.82 },
    { x: 0, y: -thick },
    { x: bellyHalf * 0.6, y: -thick * 0.82 },
    { x: bellyHalf, y: 0 },
    { x: bellyHalf * 0.6, y: thick * 0.82 },
    { x: 0, y: thick },
    { x: -bellyHalf * 0.6, y: thick * 0.82 },
  ];

  ctx.save();

  /* Tendons: dense, glossy, nearly bloodless collagen. They do not stretch,
     which is the whole point — every millimetre the belly shortens moves the
     bone. */
  const tendonEnd = 0.48;
  for (const s of [-1, 1]) {
    const pts: Pt[] = [
      { x: s * bellyHalf * 0.98, y: 0 },
      { x: s * (bellyHalf + tendonEnd) / 2, y: 0 },
      { x: s * tendonEnd, y: 0 },
    ];
    curve(ctx, orient(ribbon(densify(pts, false, 8), (u) => 0.055 - u * 0.018)), true, 0.8);
    const g = ctx.createLinearGradient(0, -0.06, 0, 0.06);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, p.tendon);
    g.addColorStop(1, mix(p.tendon, "#9c8a63", 0.55));
    ctx.fillStyle = g;
    ctx.fill();
    // Collagen fibres in the tendon run dead straight; muscle fibres do not.
    ctx.strokeStyle = hexA("#a2906a", 0.4);
    ctx.lineWidth = 0.005;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(s * bellyHalf * 0.95, i * 0.014);
      ctx.lineTo(s * tendonEnd, i * 0.008);
      ctx.stroke();
    }
  }

  shadeBody(ctx, belly, 0, 0, 0.34,
    mix(p.muscle, p.arterial, c * 0.3), p.muscleDeep,
    mix(p.muscleLight, "#ffffff", 0.1 + c * 0.15), { gloss: 0.3 });

  ctx.save();
  curve(ctx, belly, true);
  ctx.clip();

  /* Fascicles: bundles of fibres wrapped in perimysium. Drawn as groups,
     because a muscle is not a bag of loose threads — it is bundles inside
     bundles, and that packing is what lets it pull hard without tearing. */
  const bundles = 7;
  for (let i = 0; i < bundles; i++) {
    const u = (i / (bundles - 1)) * 2 - 1;
    const yy = u * thick * 0.78;
    ctx.beginPath();
    ctx.moveTo(-bellyHalf, u * 0.02);
    ctx.quadraticCurveTo(0, yy, bellyHalf, u * 0.02);
    ctx.strokeStyle = hexA(mix(p.muscleLight, "#ffffff", 0.25), 0.5);
    ctx.lineWidth = thick * 0.19;
    ctx.stroke();
    ctx.strokeStyle = hexA(p.muscleDeep, 0.5);
    ctx.lineWidth = thick * 0.05;
    ctx.stroke();
  }

  /* Striations: the cross-banding that gives skeletal muscle its name. The
     bands crowd closer together as the muscle shortens, which is literally
     what sliding filaments do. */
  ctx.strokeStyle = hexA(p.muscleDeep, 0.3);
  ctx.lineWidth = 0.004;
  const bands = 26;
  for (let i = 0; i <= bands; i++) {
    const x0 = -bellyHalf + (i / bands) * bellyHalf * 2;
    ctx.beginPath();
    ctx.moveTo(x0, -thick);
    ctx.quadraticCurveTo(x0 + 0.012, 0, x0, thick);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

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
 * `kind` sets the shape and the caller can still tint a pulmonary artery blue.
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
  const deep = artery ? p.arterialDeep : kind === "vein" ? p.venousDeep : p.venousDeep;
  const light = artery ? p.arterialLight : p.venousLight;
  const taper = opts.taper ?? (kind === "capillary" ? 0.85 : 0.5);

  const pts = densify(path, false, 10);
  const acc = arcLengths(pts);
  // An artery visibly widens as the pressure wave passes: that travelling
  // bulge is exactly what a pulse at the wrist is.
  const wave = (u: number) =>
    opts.pulse !== false && artery
      ? 1 + 0.1 * Math.exp(-((((u - flow + 1) % 1) - 0) ** 2) / 0.006)
      : 1;
  const halfW = (u: number) => (width / 2) * (1 - u * (1 - taper)) * wave(u);

  ctx.save();
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
      // Branches leave at an acute angle, downstream — a vessel never sends
      // blood backwards, and the geometry of the fork shows which way it flows.
      const bx = s.p.x + s.tx * len * 0.6 - s.ty * side * len * 0.8;
      const by = s.p.y + s.ty * len * 0.6 + s.tx * side * len * 0.8;
      const stub = densify([
        s.p,
        { x: s.p.x + s.tx * len * 0.35 - s.ty * side * len * 0.3, y: s.p.y + s.ty * len * 0.35 + s.tx * side * len * 0.3 },
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
  const lumen = ribbon(pts, (u) => halfW(u) * lumenK);
  curve(ctx, orient(lumen), true, 0.8);
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
    curve(ctx, orient(lumen), true, 0.8);
    ctx.clip();
    for (let i = 0; i < nCells; i++) {
      const u = ((i / nCells) + flow) % 1;
      const s = along(pts, acc, u);
      const rr = halfW(u) * lumenK * 0.62;
      const cellCol = artery ? "#ff4f52" : mix(p.venous, "#8a5fb0", 0.45);
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

  /* Venous valves: paired cusps pointing downstream. They are the reason
     blood in a leg vein can only travel one way — toward the heart. */
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

  ctx.restore();
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
 * syllabus that mentions nerves at all. So the animation here jumps: the
 * action potential is snapped to node positions, never slid smoothly between.
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
    const cx = bx + Math.cos(ang) * len * 0.55;
    const cy = by + Math.sin(ang) * len * 0.55;
    const ex = bx + Math.cos(ang + (r() - 0.5) * 0.3) * len;
    const ey = by + Math.sin(ang + (r() - 0.5) * 0.3) * len;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.lineWidth = w;
    ctx.strokeStyle = hexA(mix(cellCol, "#ffffff", depth > 2 ? 0.05 : 0.25), 0.95);
    ctx.stroke();
    // Dendritic spines: the little knobs where synapses actually land. They
    // only appear on the fine branches, as they do in a real cell.
    if (depth <= 2) {
      for (let i = 1; i < 4; i++) {
        const u = i / 4;
        const px = bx + (ex - bx) * u, py = by + (ey - by) * u;
        const sa = ang + Math.PI / 2 * (i % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(px + Math.cos(sa) * w * 1.6, py + Math.sin(sa) * w * 1.6, w * 0.8, 0, TAU);
        ctx.fillStyle = hexA(mix(cellCol, "#ffffff", 0.3), 0.9);
        ctx.fill();
      }
    }
    const spread = 0.5 + r() * 0.35;
    dendrite(ex, ey, ang - spread, len * (0.62 + r() * 0.12), w * 0.62, depth - 1);
    dendrite(ex, ey, ang + spread, len * (0.6 + r() * 0.14), w * 0.62, depth - 1);
    if (depth > 3 && r() > 0.4) dendrite(ex, ey, ang + (r() - 0.5) * 0.3, len * 0.6, w * 0.55, depth - 2);
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

  /* Myelin sheaths with bare nodes between them. */
  const sheaths = 6;
  const nodeU: number[] = [];
  for (let i = 0; i < sheaths; i++) {
    const u0 = 0.1 + (i / sheaths) * 0.86;
    const u1 = u0 + (1 / sheaths) * 0.86 - 0.028;
    nodeU.push(u1 + 0.014);
    const seg: Pt[] = [];
    for (let k = 0; k <= 8; k++) seg.push(along(ax, axAcc, u0 + (u1 - u0) * (k / 8)).p);
    curve(ctx, orient(ribbon(seg, (v) => 0.036 * Math.sin(Math.PI * (0.14 + v * 0.72)) + 0.012)), true, 0.8);
    const mg = ctx.createLinearGradient(seg[0].x, seg[0].y - 0.05, seg[0].x, seg[0].y + 0.05);
    mg.addColorStop(0, "#ffffff");
    mg.addColorStop(0.4, p.myelin);
    mg.addColorStop(1, mix(p.myelin, "#a68a5c", 0.55));
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.strokeStyle = hexA("#a68a5c", 0.5);
    ctx.lineWidth = 0.004;
    ctx.stroke();
    // Each sheath is one Schwann cell wrapped round and round; its nucleus is
    // pushed to the outside, and drawing it says the myelin is made of cells.
    const midPt = seg[4];
    ctx.beginPath();
    ctx.ellipse(midPt.x, midPt.y - 0.03, 0.014, 0.008, 0, 0, TAU);
    ctx.fillStyle = hexA("#c8a86e", 0.8);
    ctx.fill();
  }

  /* The action potential, snapped to a node. It jumps; it does not slide. */
  if (active) {
    const idx = Math.min(nodeU.length - 1, Math.floor(sig * nodeU.length));
    const here = along(ax, axAcc, nodeU[idx]).p;
    const g = ctx.createRadialGradient(here.x, here.y, 0, here.x, here.y, 0.075);
    g.addColorStop(0, hexA(hot, 0.95));
    g.addColorStop(0.35, hexA("#ffb43c", 0.6));
    g.addColorStop(1, hexA("#ff8a2c", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(here.x, here.y, 0.075, 0, TAU);
    ctx.fill();
    // The stretch already passed is refractory — it cannot fire again yet,
    // which is why a nerve impulse only ever travels one way.
    ctx.strokeStyle = hexA("#7a86c8", 0.5);
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    const startU = 0.1;
    for (let k = 0; k <= 20; k++) {
      const u = startU + (nodeU[idx] - startU) * (k / 20);
      const q = along(ax, axAcc, u).p;
      if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
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
      // Neurotransmitter released into the synaptic cleft: the electrical
      // signal becoming a chemical one.
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
    ctx.lineWidth = 0.03;
    ctx.strokeStyle = hexA(mix(cellCol, p.brain, 0.5), 0.55);
    ctx.stroke();
  }

  /* Soma last, on top of the dendrite roots, with nucleus and nucleolus. */
  const soma: Pt[] = [
    { x: somaX - 0.09, y: -0.05 }, { x: somaX - 0.04, y: -0.10 },
    { x: somaX + 0.05, y: -0.08 }, { x: somaX + 0.09, y: -0.01 },
    { x: somaX + 0.06, y: 0.07 }, { x: somaX - 0.02, y: 0.10 },
    { x: somaX - 0.09, y: 0.06 },
  ];
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

  ctx.restore();
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

export function bodySystemOverlay(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, h: number, which: SystemKind,
  theme: ThemeColors, t: number,
): void {
  const p = anatomyPalette(theme);
  const m = figureMetrics(x, y, h, "stand");
  const H = m.head;
  const parts = bodyParts(m);
  const { arms, legs } = limbChains(m);
  const flow = (t * 0.55) % 1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (which) {
    /* ---------------------------------------------------------------- */
    case "circulatory": {
      // Veins first, laid slightly lateral to their arteries, because that is
      // how they run — paired with the artery, and nearer the surface, which
      // is why the veins are the ones you can see in your own arm.
      const vw = H * 0.1;
      for (const s of [-1, 1] as const) {
        vessel(ctx, [
          { x: m.x + s * H * 0.18, y: m.chin - H * 0.1 },
          { x: m.x + s * H * 0.2, y: m.neckBase },
          { x: m.x + s * H * 0.12, y: m.sternumTop + H * 0.2 },
        ], vw * 0.8, "vein", theme, { flow: 1 - flow, branches: 1, seed: 2 + s });
        vessel(ctx, chainPath(arms[s > 0 ? 0 : 1], -s * H * 0.11, 0, 1),
          vw * 0.8, "vein", theme, { flow: 1 - flow, branches: 3, seed: 11 + s, taper: 1.5 });
        vessel(ctx, chainPath(legs[s > 0 ? 0 : 1], -s * H * 0.13, 0, 1),
          vw * 0.95, "vein", theme, { flow: 1 - flow, branches: 3, seed: 21 + s, taper: 1.6 });
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

      // Arteries. The aorta leaves the heart, arches, and everything else in
      // the body is a branch of it.
      vessel(ctx, [
        { x: m.x + H * 0.04, y: m.nippleY - H * 0.1 },
        { x: m.x + H * 0.02, y: m.costalY },
        { x: m.x, y: m.navelY },
        { x: m.x, y: m.iliacY },
      ], H * 0.15, "artery", theme, { flow, branches: 5, seed: 7, taper: 0.85 });
      for (const s of [-1, 1] as const) {
        // Common carotid: brain first, always.
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
      organ(ctx, m.x, m.nippleY + H * 0.16, H * 2.3, "lungs", theme, { pulse: breath });
      // Airway above the lungs: nose and mouth into pharynx into trachea.
      vesselless(ctx, [
        { x: m.x + H * 0.06, y: m.y + H * 0.72 },
        { x: m.x + H * 0.02, y: m.chin },
        { x: m.x, y: m.neckBase + H * 0.05 },
      ], H * 0.15, p.airway, p);
      // The diaphragm: the muscle that actually does the breathing. It flattens
      // on the way in, which is what drops the pressure and pulls air down.
      const dy = m.costalY + H * (0.06 + rise * 0.1);
      ctx.beginPath();
      ctx.moveTo(m.x - H * 0.72, dy - H * 0.18);
      ctx.quadraticCurveTo(m.x - H * 0.3, dy - H * (0.46 - rise * 0.2), m.x, dy - H * (0.42 - rise * 0.2));
      ctx.quadraticCurveTo(m.x + H * 0.3, dy - H * (0.46 - rise * 0.2), m.x + H * 0.72, dy - H * 0.18);
      ctx.lineTo(m.x + H * 0.68, dy);
      ctx.quadraticCurveTo(m.x, dy - H * (0.3 - rise * 0.2), m.x - H * 0.68, dy);
      ctx.closePath();
      const dg = ctx.createLinearGradient(m.x - H, dy - H * 0.4, m.x + H, dy);
      dg.addColorStop(0, mix(p.muscleLight, "#ffffff", 0.2));
      dg.addColorStop(0.5, p.muscle);
      dg.addColorStop(1, p.muscleDeep);
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = hexA(p.muscleDeep, 0.7);
      ctx.lineWidth = H * 0.02;
      ctx.stroke();
      break;
    }

    /* ---------------------------------------------------------------- */
    case "digestive": {
      // Drawn in the order food travels, which is the order it is taught.
      const wave = (t * 0.35) % 1;
      // 1. Mouth and oesophagus.
      vesselless(ctx, [
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
      // 4 and 5. Small intestine coiled inside the frame of the large.
      organ(ctx, m.x, m.navelY + H * 0.5, H * 2.0, "intestine", theme, { pulse: wave });
      // 6. Rectum and anal canal, closing the tract.
      vesselless(ctx, [
        { x: m.x + H * 0.06, y: m.crotchY - H * 0.5 },
        { x: m.x + H * 0.02, y: m.crotchY - H * 0.2 },
      ], H * 0.16, p.gut, p);
      break;
    }

    /* ---------------------------------------------------------------- */
    case "nervous": {
      // A signal running out from the cord, so the direction of traffic reads.
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
        // Nerves are cables: many axons in parallel inside one sheath.
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
      const cord: Pt[] = [
        { x: m.x, y: m.chin - H * 0.1 }, { x: m.x, y: m.neckBase },
        { x: m.x, y: m.nippleY }, { x: m.x, y: m.costalY }, { x: m.x, y: cordEnd },
      ];
      nerve(cord, H * 0.2, sig);
      // Cauda equina: the loose bundle of roots below the cord's end.
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(m.x + i * H * 0.012, cordEnd);
        ctx.quadraticCurveTo(m.x + i * H * 0.06, cordEnd + H * 0.3,
          m.x + i * H * 0.09, cordEnd + H * 0.55);
        ctx.strokeStyle = hexA(p.nerve, 0.8);
        ctx.lineWidth = H * 0.022;
        ctx.stroke();
      }
      // Segmental spinal nerves leaving between every pair of vertebrae.
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
      brainCoronal(ctx, m.x, m.y + H * 0.48, H * 0.86, p, t);
      break;
    }

    /* ---------------------------------------------------------------- */
    case "muscular": {
      ctx.save();
      bodyPath(ctx, parts);
      ctx.clip();
      drawSurfaceMuscles(ctx, m, p, arms, legs, 2.1);
      ctx.restore();
      break;
    }

    /* ---------------------------------------------------------------- */
    case "excretory": {
      // Kidneys sit high, against the back wall, under the last two ribs —
      // far higher than students guess, and the right one lower than the left
      // because the liver is in the way.
      const ky = m.costalY + H * 0.2;
      organ(ctx, m.x - H * 0.44, ky + H * 0.08, H * 1.0, "kidney", theme, { flip: true });
      organ(ctx, m.x + H * 0.44, ky - H * 0.04, H * 1.0, "kidney", theme);
      // Renal arteries straight off the aorta: a fifth of every heartbeat goes
      // through these, which is why filtering the whole blood volume is quick.
      vessel(ctx, [{ x: m.x, y: ky }, { x: m.x - H * 0.3, y: ky + H * 0.06 }],
        H * 0.1, "artery", theme, { flow: (t * 0.6) % 1, branches: 0 });
      vessel(ctx, [{ x: m.x, y: ky - H * 0.04 }, { x: m.x + H * 0.3, y: ky - H * 0.04 }],
        H * 0.1, "artery", theme, { flow: (t * 0.6) % 1, branches: 0 });
      // Ureters: narrow muscular tubes that squeeze urine down, not tubes it
      // merely falls through.
      const bladderY = m.crotchY - H * 0.34;
      for (const s of [-1, 1]) {
        vesselless(ctx, [
          { x: m.x + s * H * 0.34, y: ky + H * 0.3 },
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
      ctx.fillStyle = hexA("#e8c74a", 0.55);
      ctx.fillRect(m.x - H * 0.35, bladderY - H * 0.02, H * 0.7, H * 0.4);
      ctx.restore();
      vesselless(ctx, [
        { x: m.x, y: bladderY + H * 0.24 },
        { x: m.x, y: m.crotchY + H * 0.02 },
      ], H * 0.07, p.airway, p);
      break;
    }
  }
  ctx.restore();
}

/** A plain shaded tube — airway, gut or duct, anything that is not a vessel. */
function vesselless(
  ctx: CanvasRenderingContext2D, pts: Pt[], w: number, col: string, p: AnatomyPalette,
): void {
  const d = densify(pts, false, 10);
  curve(ctx, orient(ribbon(d, () => w / 2)), true, 0.8);
  const a = d[0], b = d[d.length - 1];
  const g = ctx.createLinearGradient(a.x - w, a.y, a.x + w, b.y);
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
