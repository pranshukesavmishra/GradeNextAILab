import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Labware — the physical apparatus of a science lab.
 *
 * A beaker drawn as a trapezoid outline is a *symbol* for a beaker. Real
 * glassware has a thick rolled rim, a bright vertical highlight down one side,
 * a curved meniscus where the liquid wets the wall, it throws a caustic patch
 * of focused light onto the bench, and it displaces whatever is behind it.
 * Students recognise the real thing instantly and read the symbol only after
 * being taught to, so drawing the real thing removes a translation step from
 * every diagram in the catalogue.
 *
 * The same argument holds for physics kit: a resistor is identifiable by its
 * colour bands, a moving-coil meter by its swept scale and mirror strip, a
 * pulley by the groove that keeps the rope on the wheel. Those details are the
 * apparatus, not decoration.
 *
 * Light arrives from the upper left, matching `organic.ts` and the scene kit,
 * so apparatus and specimens share one consistent scene. Nothing here uses
 * `Math.random()`: every speckle, droplet and grain is hashed from its own
 * position, so a still frame is reproducible and an animated one does not swim.
 */

const KEY = { x: -0.38, y: -0.42 };

/* ------------------------------------------------------------------ *
 * Small maths and colour helpers
 * ------------------------------------------------------------------ */

function clamp01(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }

/** Deterministic 0-1 hash. Seeded from position or index, never from a clock. */
function hash1(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

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

/** Blend two hex colours. */
function mix(a: string, b: string, t: number): string {
  const parse = (hexc: string) => {
    let s = hexc.replace("#", "");
    if (s.length === 3) s = s.split("").map((c) => c + c).join("");
    return [0, 1, 2].map((i) => parseInt(s.slice(i * 2, i * 2 + 2), 16) || 0);
  };
  const A = parse(a), B = parse(b), k = clamp01(t);
  const ch = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

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

/* ------------------------------------------------------------------ *
 * Materials
 *
 * Three material models are used everywhere below. Metal is anisotropic: a
 * turned or extruded surface smears the highlight *along* the axis of the tool
 * marks, which is why a chrome rod shows one narrow blazing band rather than a
 * round hotspot. Glass is a skin, not a fill: a tint that is strong at the
 * silhouette and clear through the middle, plus the vertical strip-light
 * reflection every piece of laboratory glass carries. Ceramic is diffuse with
 * a wide, soft glaze highlight.
 * ------------------------------------------------------------------ */

type Axis = "v" | "h";

/**
 * Fill a path as brushed/turned metal.
 *
 * `axis` is the direction the metal was worked: "v" for an upright rod or
 * barrel (highlight runs top to bottom), "h" for a rail or bar.
 */
function metalFill(
  ctx: CanvasRenderingContext2D, pathFn: () => void,
  x: number, y: number, w: number, h: number,
  base: string, axis: Axis = "v", hotAt = 0.3,
) {
  ctx.save();
  pathFn();
  const g = axis === "v"
    ? ctx.createLinearGradient(x, 0, x + w, 0)
    : ctx.createLinearGradient(0, y, 0, y + h);
  const stops: Array<[number, string]> = [
    [0, shade(base, -0.6)],
    [hotAt * 0.45, shade(base, -0.12)],
    [hotAt - 0.05, shade(base, 0.5)],
    [hotAt, shade(base, 0.95)],
    [hotAt + 0.05, shade(base, 0.42)],
    [hotAt + 0.26, base],
    [0.82, shade(base, -0.34)],
    [0.93, shade(base, -0.05)],
    [1, shade(base, -0.55)],
  ];
  let prev = -1;
  for (const [p, c] of stops) {
    const q = Math.min(1, Math.max(prev + 0.0005, p));
    g.addColorStop(q, c);
    prev = q;
  }
  ctx.fillStyle = g;
  ctx.fill();

  // Tool marks: fine lines along the axis. They are what separates machined
  // metal from a plastic gradient at a glance.
  ctx.save();
  ctx.clip();
  const span = axis === "v" ? w : h;
  ctx.lineWidth = Math.max(0.5, span * 0.012);
  for (let i = 0; i < 30; i++) {
    const u = hash1(i * 3.77 + Math.round(x) * 0.13 + Math.round(y) * 0.071);
    ctx.strokeStyle = hexA(i % 2 ? "#ffffff" : "#000000", 0.09 + hash1(i * 9.1) * 0.08);
    ctx.beginPath();
    if (axis === "v") { ctx.moveTo(x + u * w, y - 2); ctx.lineTo(x + u * w, y + h + 2); }
    else { ctx.moveTo(x - 2, y + u * h); ctx.lineTo(x + w + 2, y + u * h); }
    ctx.stroke();
  }
  ctx.restore();

  // The dark contact edge that stops metal reading as a sticker.
  pathFn();
  ctx.strokeStyle = hexA("#000000", 0.45);
  ctx.lineWidth = Math.max(0.8, span * 0.03);
  ctx.stroke();
  ctx.restore();
}

/** Convenience: a rounded rectangle of brushed metal. */
function metalRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  base: string, axis: Axis = "v", r = 0, hotAt = 0.3,
) {
  metalFill(ctx, () => roundRect(ctx, x, y, w, h, r), x, y, w, h, base, axis, hotAt);
}

/** A hex-socket screw head — the fastener on every clamp and carrier. */
function screwHead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x + KEY.x * r, y + KEY.y * r, 0, x, y, r);
  g.addColorStop(0, "#e8e4ee");
  g.addColorStop(0.5, "#8d8499");
  g.addColorStop(1, "#2c2634");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.4;
    const px = x + Math.cos(a) * r * 0.46, py = y + Math.sin(a) * r * 0.46;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hexA("#000000", 0.55);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

/**
 * Glass skin over a vessel path.
 *
 * Glass is dark where it is thick (the silhouette, seen edge-on through many
 * millimetres) and clear where it is thin (the middle). Reversing that is the
 * single most common mistake in drawn glassware.
 */
function glassSkin(
  ctx: CanvasRenderingContext2D, pathFn: () => void,
  x: number, y: number, w: number, h: number, dark: boolean,
  opts: { tint?: string; streak?: number; wall?: number } = {},
) {
  const tint = opts.tint ?? (dark ? "#bcd8f2" : "#eef6ff");
  const streak = opts.streak ?? 1;
  const wall = opts.wall ?? Math.max(1.6, w * 0.035);
  ctx.save();

  pathFn();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, hexA(tint, dark ? 0.3 : 0.5));
  g.addColorStop(0.08, hexA(tint, dark ? 0.09 : 0.16));
  g.addColorStop(0.4, hexA(tint, 0.035));
  g.addColorStop(0.72, hexA(tint, 0.05));
  g.addColorStop(0.92, hexA(tint, dark ? 0.12 : 0.18));
  g.addColorStop(1, hexA(tint, dark ? 0.34 : 0.46));
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // The strip-light reflection: one bright, hard-edged vertical streak down the
  // near wall and a dimmer echo on the far wall.
  const sx = x + w * 0.15, sw = Math.max(1.6, w * 0.05);
  const sg = ctx.createLinearGradient(sx - sw * 1.2, 0, sx + sw * 1.6, 0);
  sg.addColorStop(0, hexA("#ffffff", 0));
  sg.addColorStop(0.42, hexA("#ffffff", 0.9 * streak));
  sg.addColorStop(0.6, hexA("#ffffff", 0.5 * streak));
  sg.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sg;
  roundRect(ctx, sx - sw * 1.2, y + h * 0.04, sw * 2.8, h * 0.9, sw);
  ctx.fill();

  const fx = x + w * 0.86;
  const fg = ctx.createLinearGradient(fx - sw, 0, fx + sw, 0);
  fg.addColorStop(0, hexA("#ffffff", 0));
  fg.addColorStop(0.5, hexA("#ffffff", 0.34 * streak));
  fg.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = fg;
  roundRect(ctx, fx - sw, y + h * 0.12, sw * 2, h * 0.72, sw);
  ctx.fill();
  ctx.restore();

  // Wall thickness, drawn as a dark inner line with a light core over it.
  pathFn();
  ctx.strokeStyle = hexA(dark ? "#7fa4c4" : "#54637a", 0.42);
  ctx.lineWidth = wall;
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = Math.max(0.7, wall * 0.28);
  ctx.stroke();
  ctx.restore();
}

/**
 * A rolled rim: the tube of glass folded over at the mouth of every vessel.
 *
 * Drawn as an annulus seen at a shallow angle, because that is what it is —
 * and because the ellipse is what tells the eye the vessel is open at the top.
 */
function rolledRim(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, halfW: number, thick: number, dark: boolean,
  opts: { spout?: "left" | "right" | "none"; mouth?: boolean } = {},
) {
  const ry = Math.max(2, halfW * 0.17);
  const t = Math.max(2, thick);
  ctx.save();

  if (opts.mouth !== false) {
    // Looking into the vessel: the inside of the far wall, in shadow.
    ctx.beginPath();
    ctx.ellipse(cx, y, Math.max(1, halfW - t * 0.5), Math.max(1, ry - t * 0.3), 0, 0, Math.PI * 2);
    const ig = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    ig.addColorStop(0, hexA(dark ? "#0b0810" : "#3b3346", 0.6));
    ig.addColorStop(1, hexA(dark ? "#1d1727" : "#6d647c", 0.28));
    ctx.fillStyle = ig;
    ctx.fill();
  }

  if (opts.spout && opts.spout !== "none") {
    // A pulled pouring lip: a flare of glass, not a notch in the outline.
    const s = opts.spout === "left" ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + s * halfW * 0.62, y - ry * 0.2);
    ctx.quadraticCurveTo(cx + s * halfW * 1.24, y - ry * 0.5, cx + s * halfW * 1.3, y + ry * 0.9);
    ctx.quadraticCurveTo(cx + s * halfW * 1.0, y + ry * 0.6, cx + s * halfW * 0.72, y + ry * 1.05);
    ctx.closePath();
    const lg = ctx.createLinearGradient(0, y - ry, 0, y + ry * 1.2);
    lg.addColorStop(0, hexA("#ffffff", 0.75));
    lg.addColorStop(1, hexA(dark ? "#6d8298" : "#93a2b4", 0.6));
    ctx.fillStyle = lg;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(cx, y, halfW, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, y, Math.max(0.8, halfW - t), Math.max(0.6, ry - t * 0.55), 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, hexA("#ffffff", dark ? 0.6 : 0.85));
  g.addColorStop(0.4, hexA(dark ? "#a8c6e0" : "#dceaf7", 0.55));
  g.addColorStop(0.72, hexA(dark ? "#5d7186" : "#93a3b5", 0.6));
  g.addColorStop(1, hexA("#ffffff", 0.5));
  ctx.fillStyle = g;
  ctx.fill("evenodd");

  // Hot specular where the key light grazes the roll.
  ctx.beginPath();
  ctx.ellipse(cx - halfW * 0.5, y - ry * 0.15, halfW * 0.26, Math.max(0.8, t * 0.3), -0.2, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.85);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + halfW * 0.42, y + ry * 0.4, halfW * 0.18, Math.max(0.6, t * 0.22), 0.2, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.4);
  ctx.fill();
  ctx.restore();
}

/**
 * The caustic a filled vessel throws on the bench.
 *
 * A cylinder of liquid is a lens: it gathers the light that fell on its whole
 * width into a narrow bright band with sharp folded edges. Students have seen
 * this on every windowsill; putting it under the glass is what makes the glass
 * read as transparent rather than as a pale sticker.
 */
function causticPatch(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number, color: string, strength = 1,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
  g.addColorStop(0, hexA(mix(color, "#ffffff", 0.55), 0.5 * strength));
  g.addColorStop(0.35, hexA(color, 0.26 * strength));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // The cusps: two bright folded edges plus a hot core line.
  ctx.strokeStyle = hexA(mix(color, "#ffffff", 0.8), 0.5 * strength);
  ctx.lineWidth = Math.max(1, h * 0.1);
  for (let i = 0; i < 3; i++) {
    const k = 0.32 + i * 0.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.5 * k, h * 0.5 * k, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.2, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.35 * strength);
  ctx.fill();
  ctx.restore();
}

/**
 * True refraction: draw what is already on the canvas behind the vessel back
 * into it, inverted left-to-right and slightly magnified.
 *
 * A cylinder of water really does flip the background horizontally — hold a
 * glass in front of a page and the text reverses. Copying the canvas into
 * itself is how that gets rendered in 2D, and it costs one blit.
 */
function refractBehind(
  ctx: CanvasRenderingContext2D, clipFn: () => void,
  x: number, y: number, w: number, h: number,
  strength: number, tint: string,
) {
  if (w <= 2 || h <= 2 || typeof ctx.getTransform !== "function") return;
  const m = ctx.getTransform();
  if (m.b !== 0 || m.c !== 0 || m.a <= 0 || m.d <= 0) return;
  const sx = x * m.a + m.e, sy = y * m.d + m.f, sw = w * m.a, sh = h * m.d;
  if (sw < 2 || sh < 2) return;
  ctx.save();
  clipFn();
  ctx.clip();
  ctx.globalAlpha = 0.5 * clamp01(strength);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(-1, 1.08);
  try {
    ctx.drawImage(ctx.canvas, sx, sy, sw, sh, -w * 0.46, -h * 0.5, w * 0.92, h);
  } catch {
    // A tainted or zero-sized canvas: the vessel simply reads as clear glass.
  }
  ctx.restore();

  // Everything seen through a coloured body picks up that colour.
  ctx.save();
  clipFn();
  ctx.clip();
  ctx.globalAlpha = 0.22 * clamp01(strength);
  ctx.fillStyle = tint;
  ctx.fillRect(x - w, y - h, w * 3, h * 3);
  ctx.restore();
}

/**
 * Condensation on a cold vessel.
 *
 * Droplets are lenses: dark at the far rim, bright at the near one, with a
 * pinprick specular. A few have run, leaving a clear track — that asymmetry is
 * what makes the surface read as wet rather than speckled.
 */
function condensation(
  ctx: CanvasRenderingContext2D, clipFn: () => void,
  x: number, y: number, w: number, h: number, amount: number, seed: number,
) {
  const a = clamp01(amount);
  if (a <= 0.01) return;
  ctx.save();
  clipFn();
  ctx.clip();
  const scale = Math.max(0.6, w / 60);
  const n = Math.round(30 + 90 * a);
  for (let i = 0; i < n; i++) {
    const u = hash1(i * 1.73 + seed);
    const v = hash1(i * 3.19 + seed * 1.7);
    const r = (0.5 + hash1(i * 5.31 + seed) ** 2 * 3.2) * scale;
    const px = x + u * w, py = y + v * h;
    const g = ctx.createRadialGradient(px + KEY.x * r * 0.7, py + KEY.y * r * 0.7, 0, px, py, r);
    g.addColorStop(0, hexA("#ffffff", 0.8));
    g.addColorStop(0.45, hexA("#dcefff", 0.24));
    g.addColorStop(0.86, hexA("#a9c8e2", 0.16));
    g.addColorStop(1, hexA("#6e8ba6", 0.42));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (r > 1.6 * scale) {
      ctx.beginPath();
      ctx.arc(px + KEY.x * r * 0.5, py + KEY.y * r * 0.5, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = hexA("#ffffff", 0.9);
      ctx.fill();
    }
  }
  // Runnels: drops that grew heavy enough to slide.
  for (let i = 0; i < 4; i++) {
    const u = hash1(i * 7.7 + seed * 2.3);
    const px = x + (0.15 + u * 0.7) * w;
    const startY = y + hash1(i * 2.9 + seed) * h * 0.4;
    const len = h * (0.2 + hash1(i * 4.1 + seed) * 0.45);
    ctx.strokeStyle = hexA("#ffffff", 0.2);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(px, startY);
    ctx.quadraticCurveTo(px + scale * 2, startY + len * 0.55, px, startY + len);
    ctx.stroke();
    const rr = 2.1 * scale;
    const dg = ctx.createRadialGradient(px + KEY.x * rr, startY + len + KEY.y * rr, 0, px, startY + len, rr);
    dg.addColorStop(0, hexA("#ffffff", 0.85));
    dg.addColorStop(1, hexA("#7f9db6", 0.45));
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(px, startY + len, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A soft contact shadow, so apparatus sits on the bench instead of floating. */
function contact(
  ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, alpha = 0.4,
) {
  ctx.save();
  const g = ctx.createRadialGradient(cx, y, 0, cx, y, w * 0.62);
  g.addColorStop(0, hexA("#000000", alpha));
  g.addColorStop(0.55, hexA("#000000", alpha * 0.45));
  g.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.08, y, w * 0.62, w * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Etched graduation marks with numerals, as printed on real glassware. */
function etchedScale(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, h: number, len: number, dark: boolean,
  opts: { divisions?: number; labels?: string[]; side?: "left" | "right"; font?: number } = {},
) {
  const div = opts.divisions ?? 5;
  const side = opts.side === "right" ? -1 : 1;
  const fs = opts.font ?? Math.max(6, len * 0.42);
  ctx.save();
  ctx.lineCap = "butt";
  for (let i = 0; i <= div * 2; i++) {
    const major = i % 2 === 0;
    const yy = y + (h * i) / (div * 2);
    const l = major ? len : len * 0.5;
    // Etched glass reads as a bright line with a dark shadow under it.
    ctx.strokeStyle = hexA("#ffffff", major ? 0.75 : 0.45);
    ctx.lineWidth = major ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + side * l, yy);
    ctx.stroke();
    ctx.strokeStyle = hexA(dark ? "#000000" : "#3d3448", 0.45);
    ctx.beginPath();
    ctx.moveTo(x, yy + 1.2);
    ctx.lineTo(x + side * l, yy + 1.2);
    ctx.stroke();
    if (major && opts.labels) {
      const label = opts.labels[i / 2];
      if (label) {
        ctx.font = `600 ${fs}px ui-monospace, "SF Mono", monospace`;
        ctx.textAlign = side > 0 ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = hexA("#ffffff", 0.8);
        ctx.fillText(label, x + side * (l + 3), yy);
      }
    }
  }
  ctx.restore();
}

/** Seven-segment digit, for the readout on a balance. */
function sevenSeg(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  ch: string, on: string, off: string,
) {
  const map: Record<string, string> = {
    "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
    "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abfgcd",
    "-": "g", " ": "",
  };
  const segs = map[ch] ?? "";
  const t = Math.max(1.4, h * 0.11);
  const put = (sx: number, sy: number, sw: number, sh: number, lit: boolean) => {
    ctx.fillStyle = lit ? on : off;
    roundRect(ctx, sx, sy, sw, sh, t * 0.4);
    ctx.fill();
  };
  const has = (s: string) => segs.includes(s);
  put(x + t * 0.8, y, w - t * 1.6, t, has("a"));
  put(x + w - t, y + t * 0.6, t, h / 2 - t, has("b"));
  put(x + w - t, y + h / 2 + t * 0.4, t, h / 2 - t, has("c"));
  put(x + t * 0.8, y + h - t, w - t * 1.6, t, has("d"));
  put(x, y + h / 2 + t * 0.4, t, h / 2 - t, has("e"));
  put(x, y + t * 0.6, t, h / 2 - t, has("f"));
  put(x + t * 0.8, y + h / 2 - t / 2, w - t * 1.6, t, has("g"));
}

/** A laid rope or cord: a core plus the visible twist of its strands. */
export function ropeStroke(
  ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, width: number, color: string,
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };
  trace(); ctx.strokeStyle = shade(color, -0.55); ctx.lineWidth = width; ctx.stroke();
  trace(); ctx.strokeStyle = color; ctx.lineWidth = width * 0.78; ctx.stroke();
  trace(); ctx.strokeStyle = shade(color, 0.42); ctx.lineWidth = width * 0.3; ctx.stroke();
  // The twist: short diagonal ticks stepped along the run.
  ctx.strokeStyle = hexA("#000000", 0.32);
  ctx.lineWidth = Math.max(0.6, width * 0.16);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
    const seg = Math.hypot(dx, dy) || 1;
    const nx = -dy / seg, ny = dx / seg;
    for (let s = 0; s < seg; s += width * 0.62) {
      const p = s / seg;
      const px = pts[i - 1].x + dx * p, py = pts[i - 1].y + dy * p;
      const skew = 0.35 * width;
      ctx.beginPath();
      ctx.moveTo(px + nx * width * 0.42 - (dx / seg) * skew, py + ny * width * 0.42 - (dy / seg) * skew);
      ctx.lineTo(px - nx * width * 0.42 + (dx / seg) * skew, py - ny * width * 0.42 + (dy / seg) * skew);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * The bench
 * ------------------------------------------------------------------ */

/**
 * A laboratory bench: back wall, work surface, front edge.
 *
 * Real school benches are black epoxy resin, and that is lucky, because a dark
 * ground is exactly what saturated liquids, flames and lit filaments need in
 * order to sing. Everything else in this file assumes it is standing on this
 * surface: contact shadows, caustics and reflections all land here.
 *
 * Returns the y of the bench top, so callers can stand apparatus on it.
 */
export function benchStage(
  ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors,
): number {
  const dark = isDarkTheme(theme);
  const benchY = Math.round(h * 0.74);
  const lip = Math.max(6, h * 0.028);
  ctx.save();

  // Back wall: a deep, softly lit surface that never competes with the kit.
  const wall = ctx.createLinearGradient(0, 0, 0, benchY);
  wall.addColorStop(0, dark ? "#0a0710" : "#232030");
  wall.addColorStop(0.55, dark ? "#150e1e" : "#37324a");
  wall.addColorStop(1, dark ? "#221930" : "#4a4360");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, benchY);

  // The key light, up and to the left, as a soft cone on the wall.
  const key = ctx.createRadialGradient(w * 0.24, -h * 0.1, 0, w * 0.24, -h * 0.1, h * 1.15);
  key.addColorStop(0, hexA(mix(theme.accent, "#ffffff", 0.7), dark ? 0.2 : 0.26));
  key.addColorStop(0.45, hexA(theme.accent, dark ? 0.07 : 0.1));
  key.addColorStop(1, hexA(theme.accent, 0));
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, w, benchY);

  // Bench top, in slight perspective: a trapezoid receding to the back wall.
  const topBack = benchY - h * 0.1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.02, benchY);
  ctx.lineTo(w * 1.02, benchY);
  ctx.lineTo(w * 0.94, topBack);
  ctx.lineTo(w * 0.06, topBack);
  ctx.closePath();
  const top = ctx.createLinearGradient(0, topBack, 0, benchY + lip);
  top.addColorStop(0, dark ? "#231c2c" : "#3a3444");
  top.addColorStop(0.35, dark ? "#171220" : "#2a2534");
  top.addColorStop(1, dark ? "#0d0a13" : "#1c1826");
  ctx.fillStyle = top;
  ctx.fill();

  // Epoxy resin is a filled material: fine mineral speckle, deterministic.
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 900; i++) {
    const u = hash1(i * 1.37), v = hash1(i * 2.71 + 5);
    const px = u * w, py = topBack + v * (benchY - topBack + lip);
    const bright = hash1(i * 4.13) > 0.55;
    ctx.fillStyle = hexA(bright ? "#ffffff" : "#000000", 0.03 + hash1(i * 7.9) * 0.05);
    ctx.fillRect(px, py, 1.4, 1.1);
  }
  // A broad anisotropic sheen sweeping across the polished resin.
  const sheen = ctx.createLinearGradient(w * 0.05, topBack, w * 0.75, benchY);
  sheen.addColorStop(0, hexA("#ffffff", 0));
  sheen.addColorStop(0.42, hexA("#ffffff", dark ? 0.09 : 0.12));
  sheen.addColorStop(0.55, hexA("#ffffff", dark ? 0.04 : 0.06));
  sheen.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sheen;
  ctx.fillRect(0, topBack, w, benchY - topBack + lip);
  ctx.restore();

  // The pool of key light landing on the bench, and the shadow it leaves.
  const pool = ctx.createRadialGradient(w * 0.3, benchY - h * 0.03, 0, w * 0.3, benchY - h * 0.03, w * 0.55);
  pool.addColorStop(0, hexA("#ffffff", dark ? 0.1 : 0.13));
  pool.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = pool;
  ctx.fillRect(0, topBack, w, benchY - topBack + lip * 2);

  // Front edge: the thickness of the slab, with a bright top arris.
  ctx.fillStyle = dark ? "#080610" : "#141019";
  ctx.fillRect(0, benchY, w, lip + h * 0.02);
  const edge = ctx.createLinearGradient(0, benchY, 0, benchY + lip);
  edge.addColorStop(0, hexA("#ffffff", dark ? 0.3 : 0.4));
  edge.addColorStop(0.16, hexA("#ffffff", 0.06));
  edge.addColorStop(1, hexA("#000000", 0.5));
  ctx.fillStyle = edge;
  ctx.fillRect(0, benchY, w, lip);

  // Below the bench: unlit space, which keeps the eye on the apparatus.
  const under = ctx.createLinearGradient(0, benchY + lip, 0, h);
  under.addColorStop(0, dark ? "#070510" : "#0f0c16");
  under.addColorStop(1, dark ? "#04030a" : "#08060d");
  ctx.fillStyle = under;
  ctx.fillRect(0, benchY + lip, w, h - benchY - lip);

  // Vignette, so the corners fall away and the centre reads first.
  const vig = ctx.createRadialGradient(w * 0.45, h * 0.45, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
  vig.addColorStop(0, hexA("#000000", 0));
  vig.addColorStop(1, hexA("#000000", 0.42));
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  return benchY;
}

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
  /** 0-1 milkiness, for a colloid or a fresh precipitate still in suspension. */
  cloudy?: number;
  /** 0-1 condensation on the outside — the vessel is colder than the room. */
  cold?: number;
  /** Animation clock. */
  t?: number;
}

/**
 * The interior of a vessel, in enough detail to put liquid in it: where the
 * walls are at any height, so the surface ellipse and the meniscus can be the
 * right width whether the vessel is a straight beaker or a conical flask.
 */
interface VesselBore {
  cx: number;
  top: number;
  bottom: number;
  halfAt: (yy: number) => number;
  clip: () => void;
}

/** Shared liquid body: refraction, meniscus, bubbles, precipitate, caustic. */
function drawLiquid(
  ctx: CanvasRenderingContext2D, b: VesselBore, spec: LiquidSpec, dark: boolean,
) {
  const t = spec.t ?? 0;
  const level = clamp01(spec.level);
  if (level <= 0.001) return;
  const surfaceY = b.bottom - (b.bottom - b.top) * level;
  const half = Math.max(1.5, b.halfAt(surfaceY));
  const ry = half * 0.18;
  const depth = b.bottom - surfaceY;

  ctx.save();
  b.clip();
  ctx.clip();

  // What is behind the liquid, displaced and tinted. This is the cue that
  // says "there is a body of transparent stuff here", and no amount of
  // highlight work substitutes for it.
  refractBehind(
    ctx,
    () => { ctx.beginPath(); ctx.rect(b.cx - half * 1.6, surfaceY, half * 3.2, depth); },
    b.cx - half * 1.2, surfaceY, half * 2.4, depth, 0.9, spec.color,
  );

  // Body: paler and airier at the surface, dense and saturated at depth,
  // because that is a real optical path length.
  const g = ctx.createLinearGradient(0, surfaceY, 0, b.bottom);
  g.addColorStop(0, hexA(mix(spec.color, "#ffffff", 0.3), 0.6));
  g.addColorStop(0.28, hexA(spec.color, 0.76));
  g.addColorStop(1, hexA(shade(spec.color, -0.28), 0.92));
  ctx.fillStyle = g;
  ctx.fillRect(b.cx - half * 2, surfaceY, half * 4, depth + 2);

  // Curved walls gather light: dark at the silhouette, a bright band inboard.
  const wg = ctx.createLinearGradient(b.cx - half, 0, b.cx + half, 0);
  wg.addColorStop(0, hexA("#000000", 0.38));
  wg.addColorStop(0.1, hexA("#000000", 0.12));
  wg.addColorStop(0.2, hexA("#ffffff", 0.2));
  wg.addColorStop(0.45, hexA("#ffffff", 0));
  wg.addColorStop(0.82, hexA("#000000", 0.14));
  wg.addColorStop(1, hexA("#000000", 0.42));
  ctx.fillStyle = wg;
  ctx.fillRect(b.cx - half * 2, surfaceY, half * 4, depth + 2);

  if (spec.cloudy) {
    // A colloid scatters light back at you: brightest where it is thickest.
    const cg = ctx.createRadialGradient(
      b.cx + half * KEY.x, surfaceY + depth * 0.45, 0,
      b.cx, surfaceY + depth * 0.5, half * 2.2,
    );
    cg.addColorStop(0, hexA("#ffffff", 0.42 * clamp01(spec.cloudy)));
    cg.addColorStop(1, hexA("#ffffff", 0));
    ctx.fillStyle = cg;
    ctx.fillRect(b.cx - half * 2, surfaceY, half * 4, depth + 2);
  }

  // The internal caustic: light focused by the far wall onto the near one,
  // sitting just above the base of the liquid.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const ic = ctx.createRadialGradient(b.cx, b.bottom - half * 0.3, 0, b.cx, b.bottom - half * 0.3, half * 1.5);
  ic.addColorStop(0, hexA(mix(spec.color, "#ffffff", 0.7), 0.4));
  ic.addColorStop(1, hexA(spec.color, 0));
  ctx.fillStyle = ic;
  ctx.fillRect(b.cx - half * 2, b.bottom - half * 2, half * 4, half * 2.4);
  ctx.restore();

  if (spec.precipitate) {
    // Settled solid: a mound, deeper in the middle, with visible grain.
    const pd = Math.min(depth * 0.9, half * 1.1 * clamp01(spec.precipitate));
    const pc = shade(spec.color, dark ? 0.25 : -0.15);
    ctx.beginPath();
    ctx.moveTo(b.cx - half * 1.6, b.bottom + 2);
    for (let i = 0; i <= 26; i++) {
      const p = i / 26;
      const px = b.cx - half * 1.6 + half * 3.2 * p;
      const bump = Math.sin(p * Math.PI) * 0.55 + hash1(i * 3.3) * 0.45;
      ctx.lineTo(px, b.bottom - pd * (0.35 + 0.65 * bump));
    }
    ctx.lineTo(b.cx + half * 1.6, b.bottom + 2);
    ctx.closePath();
    const pg = ctx.createLinearGradient(0, b.bottom - pd, 0, b.bottom);
    pg.addColorStop(0, mix(pc, "#ffffff", 0.35));
    pg.addColorStop(0.5, pc);
    pg.addColorStop(1, shade(pc, -0.45));
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 90; i++) {
      const px = b.cx - half + hash1(i * 1.9) * half * 2;
      const py = b.bottom - hash1(i * 5.1) * pd;
      ctx.fillStyle = hexA(hash1(i * 7.3) > 0.5 ? "#ffffff" : "#000000", 0.14);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.6, half * 0.035), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (spec.bubbles) {
    const n = Math.round(spec.bubbles);
    for (let i = 0; i < n; i++) {
      const seed = hash1(i * 2.13);
      const speed = 0.32 + seed * 0.5;
      const phase = ((t * speed + seed) % 1);
      const by = b.bottom - phase * depth;
      if (by < surfaceY) continue;
      // A bubble expands as it rises: the pressure above it falls.
      const r = (0.9 + seed * 1.8) * (half * 0.09) * (0.6 + phase * 0.8);
      const bx = b.cx + Math.sin(phase * 7 + i) * half * 0.5 * (0.4 + seed * 0.6);
      const bg = ctx.createRadialGradient(bx + KEY.x * r, by + KEY.y * r, 0, bx, by, r);
      bg.addColorStop(0, hexA("#ffffff", 0.85));
      bg.addColorStop(0.55, hexA("#ffffff", 0.12));
      bg.addColorStop(1, hexA("#ffffff", 0.55));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The surface, seen slightly from above, is an ellipse — never a line.
  ctx.beginPath();
  ctx.ellipse(b.cx, surfaceY, half, ry, 0, 0, Math.PI * 2);
  const sg = ctx.createLinearGradient(0, surfaceY - ry, 0, surfaceY + ry);
  sg.addColorStop(0, hexA(mix(spec.color, "#ffffff", 0.62), 0.95));
  sg.addColorStop(0.45, hexA(mix(spec.color, "#ffffff", 0.2), 0.9));
  sg.addColorStop(1, hexA(shade(spec.color, -0.15), 0.95));
  ctx.fillStyle = sg;
  ctx.fill();
  // Sky reflected in the surface, up-left where the key light is.
  ctx.beginPath();
  ctx.ellipse(b.cx + half * KEY.x * 0.7, surfaceY - ry * 0.25, half * 0.34, ry * 0.4, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.4);
  ctx.fill();

  // The meniscus. Water wets glass and climbs the wall, so the edge of the
  // surface sits higher than the middle; reading the bottom of that curve is
  // exactly how a student takes an accurate volume, so it has to be visible.
  ctx.strokeStyle = hexA("#ffffff", 0.65);
  ctx.lineWidth = Math.max(1, half * 0.05);
  ctx.beginPath();
  ctx.moveTo(b.cx - half, surfaceY - ry * 0.35);
  ctx.quadraticCurveTo(b.cx, surfaceY + ry * 1.5, b.cx + half, surfaceY - ry * 0.35);
  ctx.stroke();
  ctx.strokeStyle = hexA(shade(spec.color, -0.5), 0.55);
  ctx.beginPath();
  ctx.moveTo(b.cx - half, surfaceY - ry * 0.1);
  ctx.quadraticCurveTo(b.cx, surfaceY + ry * 1.85, b.cx + half, surfaceY - ry * 0.1);
  ctx.stroke();
  // The climb itself, hooking up the glass on both walls.
  ctx.lineWidth = Math.max(0.9, half * 0.04);
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(b.cx + s * half, surfaceY + ry * 0.4);
    ctx.quadraticCurveTo(b.cx + s * half * 0.96, surfaceY - ry * 0.6, b.cx + s * half * 0.82, surfaceY - ry * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

/** Glass thickness at the foot of a vessel, seen as a bright ring of glass. */
function glassFoot(
  ctx: CanvasRenderingContext2D, cx: number, y: number, halfW: number, ry: number, wall: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, y, halfW, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, y, Math.max(1, halfW - wall * 1.7), Math.max(0.8, ry - wall * 0.9), 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, hexA("#ffffff", 0.25));
  g.addColorStop(0.6, hexA("#ffffff", 0.5));
  g.addColorStop(1, hexA("#ffffff", 0.85));
  ctx.fillStyle = g;
  ctx.fill("evenodd");
  ctx.restore();
}

/** A beaker: straight walls, pouring spout, rolled rim, graduation marks. */
export function beaker(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  const cx = x + w / 2;
  const ryTop = w * 0.15, ryBot = w * 0.11;
  const rimCY = y + ryTop;
  const wall = Math.max(1.8, w * 0.045);
  const baseCY = y + h - ryBot;

  const body = (inset: number) => {
    const hw = w / 2 - inset;
    const kt = Math.max(0.6, ryTop - inset * 0.6), kb = Math.max(0.6, ryBot - inset * 0.6);
    ctx.beginPath();
    ctx.moveTo(cx - hw, rimCY);
    ctx.lineTo(cx - hw, baseCY);
    ctx.ellipse(cx, baseCY, hw, kb, 0, Math.PI, 0, true);
    ctx.lineTo(cx + hw, rimCY);
    ctx.ellipse(cx, rimCY, hw, kt, 0, 0, Math.PI, true);
    ctx.closePath();
  };

  ctx.save();
  contact(ctx, cx, y + h + ryBot * 0.4, w * 1.25, dark ? 0.55 : 0.4);

  // Empty glass still bends the room behind it, not only the liquid.
  refractBehind(
    ctx, () => body(wall), x + wall, rimCY, w - wall * 2, h - ryTop - ryBot,
    0.5, dark ? "#8fb6d8" : "#dcecfa",
  );

  if (liquid) {
    drawLiquid(ctx, {
      cx,
      top: rimCY + wall,
      bottom: baseCY + ryBot * 0.35,
      halfAt: () => w / 2 - wall,
      clip: () => body(wall),
    }, liquid, dark);
  }

  glassSkin(ctx, () => body(0), x, y, w, h, dark, { wall });
  glassFoot(ctx, cx, baseCY, w / 2, ryBot, wall);

  // Graduations: 50 ml divisions up the left wall, etched.
  etchedScale(
    ctx, x + w * 0.13, rimCY + h * 0.16, h * 0.6, w * 0.19, dark,
    { divisions: 4, labels: ["200", "150", "100", "50", ""], font: Math.max(6, w * 0.11) },
  );

  if (liquid?.cold) {
    condensation(ctx, () => body(wall * 0.4), x, rimCY, w, h - ryTop, liquid.cold, Math.round(x * 7 + y));
  }

  rolledRim(ctx, cx, rimCY, w / 2, wall * 1.5, dark, { spout: "left" });

  if (liquid) {
    // The vessel gathers light and drops it on the bench, down-right of the
    // key: the shadow and the caustic are two halves of the same fact.
    causticPatch(ctx, cx + w * 0.42, y + h + ryBot * 0.5, w * 1.15, w * 0.3, liquid.color, 0.9);
  }
  ctx.restore();
}

/** A conical (Erlenmeyer) flask: narrow neck, flared shoulder, wide foot. */
export function flask(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  const cx = x + w / 2;
  const neckHalf = w * 0.15;
  const ryTop = neckHalf * 0.42, ryBot = w * 0.1;
  const rimCY = y + ryTop;
  const shoulderY = y + h * 0.36;
  const baseCY = y + h - ryBot;
  const wall = Math.max(1.6, w * 0.035);

  const body = (inset: number) => {
    const nh = neckHalf - inset, bh = w * 0.47 - inset;
    const kt = Math.max(0.5, ryTop - inset * 0.5), kb = Math.max(0.6, ryBot - inset * 0.6);
    ctx.beginPath();
    ctx.moveTo(cx - nh, rimCY);
    ctx.lineTo(cx - nh, shoulderY - h * 0.03);
    // The shoulder is a curve, not a corner: blown glass has no sharp joins.
    ctx.quadraticCurveTo(cx - nh * 1.15, shoulderY + h * 0.05, cx - bh * 0.62, shoulderY + h * 0.2);
    ctx.lineTo(cx - bh, baseCY);
    ctx.ellipse(cx, baseCY, bh, kb, 0, Math.PI, 0, true);
    ctx.lineTo(cx + bh * 0.62, shoulderY + h * 0.2);
    ctx.quadraticCurveTo(cx + nh * 1.15, shoulderY + h * 0.05, cx + nh, shoulderY - h * 0.03);
    ctx.lineTo(cx + nh, rimCY);
    ctx.ellipse(cx, rimCY, nh, kt, 0, 0, Math.PI, true);
    ctx.closePath();
  };

  const halfAt = (yy: number) => {
    if (yy <= shoulderY) return neckHalf - wall;
    const p = clamp01((yy - shoulderY) / (baseCY - shoulderY));
    return neckHalf - wall + (w * 0.47 - wall - (neckHalf - wall)) * Math.min(1, p * 1.25);
  };

  ctx.save();
  contact(ctx, cx, y + h + ryBot * 0.4, w * 1.2, dark ? 0.55 : 0.4);
  refractBehind(
    ctx, () => body(wall), x + w * 0.06, shoulderY, w * 0.88, baseCY - shoulderY,
    0.5, dark ? "#8fb6d8" : "#dcecfa",
  );

  if (liquid) {
    drawLiquid(ctx, {
      cx, top: rimCY + wall, bottom: baseCY + ryBot * 0.3, halfAt, clip: () => body(wall),
    }, liquid, dark);
  }

  glassSkin(ctx, () => body(0), x, y, w, h, dark, { wall });
  glassFoot(ctx, cx, baseCY, w * 0.47, ryBot, wall);

  // The graduation band conical flasks actually carry: a few coarse marks low
  // on the body, because the flask is for swirling, not for measuring.
  etchedScale(
    ctx, cx - w * 0.36, y + h * 0.66, h * 0.2, w * 0.14, dark,
    { divisions: 2, labels: ["150", "100", "50"], font: Math.max(6, w * 0.1) },
  );

  if (liquid?.cold) {
    condensation(ctx, () => body(wall * 0.4), x, shoulderY, w, h - (shoulderY - y), liquid.cold, Math.round(x * 3 + y * 5));
  }

  rolledRim(ctx, cx, rimCY, neckHalf, wall * 1.4, dark, {});
  if (liquid) causticPatch(ctx, cx + w * 0.4, y + h + ryBot * 0.5, w * 1.1, w * 0.28, liquid.color, 0.85);
  ctx.restore();
}

/** A test tube: round-bottomed, thin-walled, with a rolled lip. */
export function testTube(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, liquid?: LiquidSpec,
) {
  const dark = isDarkTheme(theme);
  const cx = x + w / 2;
  const ryTop = w * 0.22;
  const rimCY = y + ryTop;
  const wall = Math.max(1.2, w * 0.075);
  const bulbCY = y + h - w / 2;

  const body = (inset: number) => {
    const hw = w / 2 - inset;
    ctx.beginPath();
    ctx.moveTo(cx - hw, rimCY);
    ctx.lineTo(cx - hw, bulbCY);
    ctx.arc(cx, bulbCY, hw, Math.PI, 0, true);
    ctx.lineTo(cx + hw, rimCY);
    ctx.ellipse(cx, rimCY, hw, Math.max(0.5, ryTop - inset * 0.6), 0, 0, Math.PI, true);
    ctx.closePath();
  };

  ctx.save();
  refractBehind(
    ctx, () => body(wall), x + wall, rimCY, w - wall * 2, h - ryTop - w * 0.2,
    0.55, dark ? "#8fb6d8" : "#dcecfa",
  );

  if (liquid) {
    drawLiquid(ctx, {
      cx, top: rimCY + wall, bottom: bulbCY + w * 0.32,
      halfAt: (yy) => {
        // Inside the hemispherical bottom the bore narrows, so a low level
        // shows a much smaller surface — worth drawing, since that is why a
        // test tube needs so little reagent.
        const r = w / 2 - wall;
        if (yy <= bulbCY) return r;
        const d = Math.min(r, yy - bulbCY);
        return Math.max(1, Math.sqrt(Math.max(0, r * r - d * d)));
      },
      clip: () => body(wall),
    }, liquid, dark);
  }

  glassSkin(ctx, () => body(0), x, y, w, h, dark, { wall, streak: 1.1 });
  if (liquid?.cold) {
    condensation(ctx, () => body(wall * 0.4), x, rimCY, w, h - ryTop, liquid.cold, Math.round(x * 11 + y * 3));
  }
  rolledRim(ctx, cx, rimCY, w / 2, wall * 1.6, dark, {});
  ctx.restore();
}

/** A filter funnel with fluted paper and a drip forming at the stem. */
export function funnel(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, w: number, h: number, theme: ThemeColors,
  opts: { filter?: boolean; liquid?: string; t?: number; drip?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const ry = w * 0.17;
  const coneBottom = topY + h * 0.56;
  const stemHalf = w * 0.055;
  const t = opts.t ?? 0;

  const body = (inset: number) => {
    const hw = w / 2 - inset, sh = stemHalf - inset * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - hw, topY + ry);
    ctx.lineTo(cx - sh, coneBottom);
    ctx.lineTo(cx - sh, topY + h - inset);
    ctx.lineTo(cx + sh, topY + h - inset);
    ctx.lineTo(cx + sh, coneBottom);
    ctx.lineTo(cx + hw, topY + ry);
    ctx.ellipse(cx, topY + ry, hw, Math.max(0.6, ry - inset * 0.5), 0, 0, Math.PI, true);
    ctx.closePath();
  };

  ctx.save();
  refractBehind(ctx, () => body(2), cx - w / 2, topY + ry, w, coneBottom - topY, 0.45,
    dark ? "#8fb6d8" : "#dcecfa");

  if (opts.filter !== false) {
    // Fluted filter paper: the folds are the point — they hold the paper off
    // the glass so filtrate can run past, which is why filtering is fast.
    ctx.save();
    body(2); ctx.clip();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.46, topY + ry * 0.7);
    ctx.lineTo(cx, coneBottom - h * 0.02);
    ctx.lineTo(cx + w * 0.46, topY + ry * 0.7);
    ctx.closePath();
    const pg = ctx.createLinearGradient(cx - w * 0.4, 0, cx + w * 0.4, 0);
    pg.addColorStop(0, dark ? "#cfc6d6" : "#f6f2f8");
    pg.addColorStop(0.35, dark ? "#efeaf2" : "#ffffff");
    pg.addColorStop(1, dark ? "#a99fb4" : "#ddd4e2");
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = hexA("#000000", 0.22);
    ctx.lineWidth = 0.9;
    for (let i = 1; i < 9; i++) {
      const px = cx - w * 0.46 + (w * 0.92 * i) / 9;
      ctx.beginPath();
      ctx.moveTo(px, topY + ry * 0.7 + Math.abs(px - cx) * 0.12);
      ctx.lineTo(cx, coneBottom - h * 0.02);
      ctx.strokeStyle = hexA(i % 2 ? "#000000" : "#ffffff", i % 2 ? 0.2 : 0.55);
      ctx.stroke();
    }
    if (opts.liquid) {
      // Wet paper is darker and translucent where the liquid has soaked in.
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = opts.liquid;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, coneBottom - h * 0.2);
      ctx.lineTo(cx, coneBottom - h * 0.02);
      ctx.lineTo(cx + w * 0.2, coneBottom - h * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  glassSkin(ctx, () => body(0), cx - w / 2, topY, w, h, dark, { wall: Math.max(1.4, w * 0.03) });
  rolledRim(ctx, cx, topY + ry, w / 2, Math.max(2, w * 0.045), dark, { mouth: false });

  if (opts.drip) {
    // A pendant drop: heavy and round at the bottom, necked where it hangs.
    const phase = (t * 0.8) % 1;
    const dy = topY + h + phase * h * 0.25;
    const r = w * 0.05 * (0.7 + phase * 0.6);
    const dg = ctx.createRadialGradient(cx + KEY.x * r, dy + KEY.y * r, 0, cx, dy, r);
    dg.addColorStop(0, hexA("#ffffff", 0.9));
    dg.addColorStop(0.6, hexA(opts.liquid ?? "#9fd0f5", 0.7));
    dg.addColorStop(1, hexA(shade(opts.liquid ?? "#9fd0f5", -0.3), 0.9));
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, dy - r * 1.1);
    ctx.quadraticCurveTo(cx - r * 1.1, dy + r * 0.5, cx, dy + r);
    ctx.quadraticCurveTo(cx + r * 1.1, dy + r * 0.5, cx + r * 0.5, dy - r * 1.1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Stands, clamps and the rest of the chemistry bench
 * ------------------------------------------------------------------ */

/** A lab clamp stand: cast base with levelling feet, chromed upright rod. */
export function clampStand(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, height: number, w: number,
) {
  ctx.save();
  contact(ctx, x, baseY + w * 0.1, w * 2.1, 0.45);

  // The rod first, so the base overlaps its foot the way a real casting does.
  const rodW = Math.max(3, w * 0.13);
  metalRect(ctx, x - rodW / 2, baseY - height, rodW, height, "#b9b3c4", "v", rodW * 0.3, 0.28);
  // A knurled band near the top, where a boss head usually grips.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - rodW / 2, baseY - height + height * 0.06, rodW, height * 0.05);
  ctx.clip();
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = hexA(i % 2 ? "#ffffff" : "#000000", 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - rodW / 2, baseY - height + height * 0.06 + i * 2);
    ctx.lineTo(x + rodW / 2, baseY - height + height * 0.06 + i * 2 - 3);
    ctx.stroke();
  }
  ctx.restore();

  // Cast iron base: a heavy wedge, thicker at the back, with a bevel.
  const bw = w * 1.5, bh = w * 0.26;
  ctx.beginPath();
  ctx.moveTo(x - bw * 0.34, baseY - bh);
  ctx.lineTo(x + bw * 0.66, baseY - bh);
  ctx.quadraticCurveTo(x + bw * 0.72, baseY - bh * 0.1, x + bw * 0.6, baseY);
  ctx.lineTo(x - bw * 0.28, baseY);
  ctx.quadraticCurveTo(x - bw * 0.4, baseY - bh * 0.1, x - bw * 0.34, baseY - bh);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, baseY - bh, 0, baseY);
  bg.addColorStop(0, "#6b6377");
  bg.addColorStop(0.22, "#3c3547");
  bg.addColorStop(0.75, "#221d2c");
  bg.addColorStop(1, "#100d16");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - bw * 0.32, baseY - bh + 1.2);
  ctx.lineTo(x + bw * 0.64, baseY - bh + 1.2);
  ctx.stroke();
  // The boss where the rod screws in.
  ctx.beginPath();
  ctx.ellipse(x, baseY - bh, rodW * 1.9, rodW * 0.7, 0, 0, Math.PI * 2);
  const cg = ctx.createLinearGradient(x - rodW * 2, 0, x + rodW * 2, 0);
  cg.addColorStop(0, "#2a2434");
  cg.addColorStop(0.35, "#6b6377");
  cg.addColorStop(1, "#1a1622");
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.restore();
}

/**
 * A boss head: the right-angle clamp that joins a rod to whatever it holds.
 *
 * It is drawn because students are forever asked to "clamp it at the neck" and
 * a floating clamp teaches nothing about how the apparatus is actually held up.
 */
export function bossHead(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, reach: number,
) {
  ctx.save();
  const s = Math.sign(reach) || 1;
  // Jaw arm out to the held object.
  metalRect(ctx, x, y - size * 0.16, Math.abs(reach), size * 0.32, "#8d8499", "h", size * 0.1, 0.3);
  // Body block.
  metalRect(ctx, x - size * 0.42, y - size * 0.5, size * 0.84, size, "#4d4658", "v", size * 0.14, 0.32);
  // The thumb screw, pointing at the viewer.
  const sx = x + s * size * 0.06;
  metalRect(ctx, sx - size * 0.16, y - size * 0.08, size * 0.32, size * 0.16, "#c0b7cc", "h", size * 0.06, 0.3);
  screwHead(ctx, x - size * 0.02, y - size * 0.28, size * 0.2);
  // Rubber-faced jaws where the glass is gripped.
  ctx.fillStyle = "#2c2431";
  roundRect(ctx, x + reach - s * size * 0.16, y - size * 0.42, s * size * 0.22, size * 0.84, size * 0.08);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.18);
  roundRect(ctx, x + reach - s * size * 0.14, y - size * 0.38, s * size * 0.06, size * 0.7, size * 0.04);
  ctx.fill();
  ctx.restore();
}

/**
 * A burette on a stand: the titration workhorse.
 *
 * The scale runs 0 at the TOP and increases downward, because a burette
 * measures what has been delivered, not what is left — the single most common
 * misreading in a titration, and a good reason to draw the numbers.
 */
export function buretteStand(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, height: number, theme: ThemeColors,
  opts: { fill?: number; liquid?: string; flow?: number; t?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const fill = clamp01(opts.fill ?? 0.7);
  const t = opts.t ?? 0;
  const color = opts.liquid ?? theme.sci["acid"] ?? "#cc3f5c";
  const standW = height * 0.16;
  const bx = x + height * 0.2;
  const tubeW = Math.max(7, height * 0.052);
  const topY = baseY - height * 0.94;
  const tapY = baseY - height * 0.3;
  const tipY = baseY - height * 0.19;
  const wall = Math.max(1.4, tubeW * 0.13);
  const ryTop = tubeW * 0.3;

  ctx.save();
  clampStand(ctx, x, baseY, height, standW);

  const tube = (inset: number) => {
    const hw = tubeW / 2 - inset;
    ctx.beginPath();
    ctx.moveTo(bx - hw, topY + ryTop);
    ctx.lineTo(bx - hw, tapY);
    ctx.lineTo(bx + hw, tapY);
    ctx.lineTo(bx + hw, topY + ryTop);
    ctx.ellipse(bx, topY + ryTop, hw, Math.max(0.5, ryTop - inset * 0.5), 0, 0, Math.PI, true);
    ctx.closePath();
  };

  refractBehind(ctx, () => tube(wall), bx - tubeW / 2, topY, tubeW, tapY - topY, 0.5,
    dark ? "#8fb6d8" : "#dcecfa");

  const surfaceY = topY + ryTop + (tapY - topY - ryTop) * (1 - fill);
  drawLiquid(ctx, {
    cx: bx, top: topY + ryTop, bottom: tapY,
    halfAt: () => tubeW / 2 - wall,
    clip: () => tube(wall),
  }, { level: fill, color, t }, dark);

  glassSkin(ctx, () => tube(0), bx - tubeW / 2, topY, tubeW, tapY - topY, dark, { wall });

  // The scale: 0 at the top, 50 at the bottom, ten-division blocks.
  etchedScale(
    ctx, bx + tubeW * 0.5, topY + ryTop + 4, tapY - topY - 10, tubeW * 0.7, dark,
    { divisions: 5, labels: ["0", "10", "20", "30", "40", "50"], font: Math.max(6, tubeW * 0.5) },
  );
  // The reading line, so the student sees where the meniscus is being read.
  ctx.strokeStyle = hexA(theme.accent, 0.85);
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx - tubeW * 1.5, surfaceY);
  ctx.lineTo(bx + tubeW * 2.4, surfaceY);
  ctx.stroke();
  ctx.setLineDash([]);

  rolledRim(ctx, bx, topY + ryTop, tubeW / 2, wall * 1.5, dark, {});

  // The stopcock: a glass barrel with a PTFE key across it.
  const barrelW = tubeW * 2.1, barrelH = tubeW * 1.05;
  ctx.beginPath();
  roundRect(ctx, bx - barrelW / 2, tapY, barrelW, barrelH, barrelH * 0.3);
  const sg = ctx.createLinearGradient(0, tapY, 0, tapY + barrelH);
  sg.addColorStop(0, hexA("#ffffff", 0.5));
  sg.addColorStop(0.4, hexA(dark ? "#9fc0dd" : "#cfe2f2", 0.35));
  sg.addColorStop(1, hexA(dark ? "#3f5468" : "#7d8a9a", 0.5));
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
  // The key handle turns with the flow: horizontal is shut, angled is open.
  const open = clamp01(opts.flow ?? 0);
  ctx.save();
  ctx.translate(bx, tapY + barrelH * 0.5);
  ctx.rotate(open * 0.9);
  const hg = ctx.createLinearGradient(0, -barrelH * 0.22, 0, barrelH * 0.22);
  hg.addColorStop(0, "#f2f0f5");
  hg.addColorStop(0.5, "#cfc7d8");
  hg.addColorStop(1, "#8b8398");
  ctx.fillStyle = hg;
  roundRect(ctx, -barrelW * 0.78, -barrelH * 0.19, barrelW * 1.56, barrelH * 0.38, barrelH * 0.18);
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Jet: the fine tip that lets a half-drop be added at the end point.
  ctx.beginPath();
  ctx.moveTo(bx - tubeW * 0.3, tapY + barrelH);
  ctx.lineTo(bx - tubeW * 0.1, tipY);
  ctx.lineTo(bx + tubeW * 0.1, tipY);
  ctx.lineTo(bx + tubeW * 0.3, tapY + barrelH);
  ctx.closePath();
  ctx.fillStyle = hexA("#ffffff", 0.32);
  ctx.fill();
  ctx.strokeStyle = hexA(dark ? "#a8c6e0" : "#5d6b7d", 0.6);
  ctx.lineWidth = 1;
  ctx.stroke();

  if (open > 0.02) {
    // Drops leaving the jet, spaced by the flow rate.
    for (let i = 0; i < 3; i++) {
      const phase = ((t * (0.6 + open * 1.8) + i / 3) % 1);
      const dy = tipY + phase * (baseY - tipY - height * 0.02);
      const r = tubeW * 0.22 * (0.8 + phase * 0.3);
      const dg = ctx.createRadialGradient(bx + KEY.x * r, dy + KEY.y * r, 0, bx, dy, r);
      dg.addColorStop(0, hexA("#ffffff", 0.85));
      dg.addColorStop(0.55, hexA(color, 0.8));
      dg.addColorStop(1, hexA(shade(color, -0.35), 0.95));
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(bx, dy, r * 0.82, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  bossHead(ctx, x, baseY - height * 0.62, height * 0.11, bx - x - tubeW * 0.4);
  ctx.restore();
}

/**
 * A Liebig condenser: inner tube for the vapour, outer water jacket.
 *
 * The hoses are drawn entering at the BOTTOM and leaving at the top, because
 * counter-current flow is the whole design: water meets the coolest vapour
 * last, so the jacket stays full and the tube stays cold along its length.
 */
export function condenser(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, len: number, theme: ThemeColors,
  opts: { angle?: number; t?: number; flow?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const t = opts.t ?? 0;
  const flow = clamp01(opts.flow ?? 1);
  const jacketH = len * 0.2;
  const innerH = len * 0.075;
  const water = theme.sci["cold"] ?? "#3b7fc9";

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(opts.angle ?? 0);

  const jacket = () => roundRect(ctx, -len / 2 + len * 0.1, -jacketH / 2, len * 0.8, jacketH, jacketH * 0.22);

  // Water in the jacket, with a moving thermal gradient so it reads as flowing.
  ctx.save();
  jacket();
  ctx.clip();
  const wg = ctx.createLinearGradient(0, -jacketH / 2, 0, jacketH / 2);
  wg.addColorStop(0, hexA(mix(water, "#ffffff", 0.4), 0.55));
  wg.addColorStop(0.45, hexA(water, 0.6));
  wg.addColorStop(1, hexA(shade(water, -0.4), 0.75));
  ctx.fillStyle = wg;
  ctx.fillRect(-len, -jacketH, len * 2, jacketH * 2);
  for (let i = 0; i < 16; i++) {
    const p = ((i / 16) + t * 0.12 * flow) % 1;
    const px = -len * 0.4 + p * len * 0.8;
    const py = -jacketH * 0.3 + hash1(i * 3.1) * jacketH * 0.6;
    ctx.strokeStyle = hexA("#ffffff", 0.22);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + len * 0.05, py);
    ctx.stroke();
  }
  ctx.restore();

  // The inner tube, visible through the jacket, with condensate running down it.
  const inner = () => roundRect(ctx, -len / 2, -innerH / 2, len, innerH, innerH * 0.3);
  ctx.save();
  inner();
  const ig = ctx.createLinearGradient(0, -innerH / 2, 0, innerH / 2);
  ig.addColorStop(0, hexA("#ffffff", 0.5));
  ig.addColorStop(0.4, hexA(dark ? "#26303c" : "#b9c8d6", 0.5));
  ig.addColorStop(1, hexA("#ffffff", 0.35));
  ctx.fillStyle = ig;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  condensation(ctx, inner, -len / 2, -innerH / 2, len, innerH, 0.8, 17);

  // Ground-glass joints at each end: frosted, with the taper drawn.
  for (const s of [-1, 1]) {
    const jx = s * (len / 2 - len * 0.02);
    ctx.beginPath();
    ctx.moveTo(jx, -innerH * 0.85);
    ctx.lineTo(jx + s * len * 0.06, -innerH * 0.6);
    ctx.lineTo(jx + s * len * 0.06, innerH * 0.6);
    ctx.lineTo(jx, innerH * 0.85);
    ctx.closePath();
    const fg = ctx.createLinearGradient(0, -innerH, 0, innerH);
    fg.addColorStop(0, hexA("#ffffff", 0.8));
    fg.addColorStop(0.5, hexA(dark ? "#c8d4e0" : "#e8eef4", 0.65));
    fg.addColorStop(1, hexA(dark ? "#7b8794" : "#a9b4c0", 0.7));
    ctx.fillStyle = fg;
    ctx.fill();
    // Frosting: fine scratched texture, the reason a joint seals.
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = hexA(i % 2 ? "#ffffff" : "#8fa0b0", 0.35);
      ctx.lineWidth = 0.7;
      const yy = -innerH + hash1(i * 4.7 + s) * innerH * 2;
      ctx.beginPath();
      ctx.moveTo(jx, yy);
      ctx.lineTo(jx + s * len * 0.06, yy + 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // The two hose olives and their rubber tubing: in low, out high.
  for (const [sx, sy] of [[-len * 0.33, 1], [len * 0.33, -1]] as const) {
    const oy = sy * jacketH * 0.5;
    ctx.save();
    ctx.translate(sx, oy);
    ctx.rotate(sy > 0 ? 0.7 : -0.7);
    glassSkin(ctx, () => roundRect(ctx, -innerH * 0.4, 0, innerH * 0.8, jacketH * 0.75, innerH * 0.2),
      -innerH * 0.4, 0, innerH * 0.8, jacketH * 0.75, dark, { wall: 1.4 });
    // Rubber tubing pushed onto the olive.
    const rg = ctx.createLinearGradient(-innerH * 0.6, 0, innerH * 0.6, 0);
    rg.addColorStop(0, "#5b5364");
    rg.addColorStop(0.32, "#a49bb0");
    rg.addColorStop(1, "#241f2c");
    ctx.fillStyle = rg;
    roundRect(ctx, -innerH * 0.62, jacketH * 0.55, innerH * 1.24, jacketH * 0.5, innerH * 0.3);
    ctx.fill();
    ctx.restore();
  }

  // Jacket glass over the water, so the water is behind glass and not on it.
  glassSkin(ctx, jacket, -len * 0.4, -jacketH / 2, len * 0.8, jacketH, dark,
    { wall: Math.max(1.6, jacketH * 0.06) });
  ctx.restore();
}

/** An evaporating basin: glazed porcelain, shallow, with a pouring lip. */
export function evaporatingDish(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number, w: number, theme: ThemeColors,
  opts: { residue?: number; liquid?: string; t?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const ry = w * 0.17;
  const depth = w * 0.3;
  const rimY = baseY - depth;
  ctx.save();
  contact(ctx, cx, baseY + w * 0.02, w * 1.2, dark ? 0.5 : 0.38);

  // Bowl: a shallow curve, drawn as an outer silhouette then the inside.
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, rimY);
  ctx.quadraticCurveTo(cx - w * 0.46, baseY, cx, baseY);
  ctx.quadraticCurveTo(cx + w * 0.46, baseY, cx + w / 2, rimY);
  ctx.ellipse(cx, rimY, w / 2, ry, 0, 0, Math.PI, true);
  ctx.closePath();
  const bg = ctx.createLinearGradient(cx - w / 2, rimY, cx + w / 2, baseY);
  // Glazed ceramic: broad soft highlight, warm mid, dark contact — diffuse,
  // not the narrow band that metal gives.
  bg.addColorStop(0, dark ? "#e9e3f0" : "#ffffff");
  bg.addColorStop(0.28, dark ? "#cdc4d8" : "#f2edf6");
  bg.addColorStop(0.68, dark ? "#8b8398" : "#cec5d8");
  bg.addColorStop(1, dark ? "#4b4457" : "#948c9f");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.3);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // The inside, in shadow near the rim, catching light at the far wall.
  ctx.beginPath();
  ctx.ellipse(cx, rimY, w / 2 - w * 0.03, ry - w * 0.02, 0, 0, Math.PI * 2);
  const ig = ctx.createRadialGradient(cx + w * KEY.x * 0.3, rimY - ry * 0.2, 0, cx, rimY, w * 0.55);
  ig.addColorStop(0, dark ? "#b6adc4" : "#e6e0ec");
  ig.addColorStop(0.6, dark ? "#6e6680" : "#b7aec4");
  ig.addColorStop(1, dark ? "#3a3446" : "#8a8199");
  ctx.fillStyle = ig;
  ctx.fill();

  if (opts.liquid) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, rimY + ry * 0.35, w * 0.4, ry * 0.72, 0, 0, Math.PI * 2);
    const lg = ctx.createLinearGradient(0, rimY, 0, rimY + ry);
    lg.addColorStop(0, hexA(mix(opts.liquid, "#ffffff", 0.4), 0.85));
    lg.addColorStop(1, hexA(shade(opts.liquid, -0.25), 0.95));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = hexA("#ffffff", 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  if (opts.residue) {
    // Crystals grow from the edge inward as the solvent goes — which is the
    // observation the experiment is for.
    const n = Math.round(50 + 90 * clamp01(opts.residue));
    for (let i = 0; i < n; i++) {
      const a = hash1(i * 1.7) * Math.PI * 2;
      const rr = 0.45 + hash1(i * 3.3) * 0.5 * clamp01(1 - (opts.residue ?? 0) * 0.5);
      const px = cx + Math.cos(a) * w * 0.45 * rr;
      const py = rimY + ry * 0.3 + Math.sin(a) * ry * 0.72 * rr;
      const s = w * 0.012 * (0.6 + hash1(i * 5.9) * 1.4);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(hash1(i * 7.1) * Math.PI);
      const cgd = ctx.createLinearGradient(-s, -s, s, s);
      cgd.addColorStop(0, "#ffffff");
      cgd.addColorStop(1, dark ? "#9c93aa" : "#c8bfd4");
      ctx.fillStyle = cgd;
      ctx.fillRect(-s, -s * 0.7, s * 2, s * 1.4);
      ctx.restore();
    }
  }

  // Rim: glaze catches a hard line of light on its near edge.
  ctx.beginPath();
  ctx.ellipse(cx, rimY, w / 2, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = hexA("#ffffff", 0.85);
  ctx.lineWidth = Math.max(1.4, w * 0.014);
  ctx.stroke();
  // Pouring lip.
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.4, rimY - ry * 0.35);
  ctx.quadraticCurveTo(cx + w * 0.56, rimY - ry * 0.1, cx + w * 0.48, rimY + ry * 0.5);
  ctx.quadraticCurveTo(cx + w * 0.42, rimY + ry * 0.1, cx + w * 0.36, rimY + ry * 0.1);
  ctx.closePath();
  ctx.fillStyle = dark ? "#ded6e8" : "#fbf8fd";
  ctx.fill();
  // The broad glaze sheen: wide and soft, the signature of fired ceramic.
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.22, baseY - depth * 0.42, w * 0.16, depth * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.45);
  ctx.fill();
  ctx.restore();
}

/** A crucible: refractory cone, sooted, optionally glowing at temperature. */
export function crucible(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number, w: number, theme: ThemeColors,
  opts: { glow?: number; lid?: boolean; contents?: string } = {},
) {
  const dark = isDarkTheme(theme);
  const glow = clamp01(opts.glow ?? 0);
  const topW = w, botW = w * 0.62, h = w * 0.9;
  const topY = baseY - h;
  const ry = topW * 0.16;
  ctx.save();
  contact(ctx, cx, baseY + 2, w * 1.15, 0.5);

  if (glow > 0.02) {
    // Hot refractory radiates: the bloom is the evidence of temperature.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const gg = ctx.createRadialGradient(cx, baseY - h * 0.4, 0, cx, baseY - h * 0.4, w * 2);
    gg.addColorStop(0, hexA("#ff8a2b", 0.5 * glow));
    gg.addColorStop(0.4, hexA("#e0431a", 0.2 * glow));
    gg.addColorStop(1, hexA("#e0431a", 0));
    ctx.fillStyle = gg;
    ctx.fillRect(cx - w * 2, baseY - h * 2.4, w * 4, h * 3.4);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx - botW / 2, baseY - ry * 0.4);
  ctx.ellipse(cx, baseY - ry * 0.4, botW / 2, ry * 0.5, 0, Math.PI, 0, true);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.ellipse(cx, topY, topW / 2, ry, 0, 0, Math.PI, true);
  ctx.closePath();
  const bg = ctx.createLinearGradient(cx - topW / 2, 0, cx + topW / 2, 0);
  const hot = (c: string) => (glow > 0.02 ? mix(c, "#ff6a1a", glow * 0.75) : c);
  bg.addColorStop(0, hot(dark ? "#8f8798" : "#b3aabe"));
  bg.addColorStop(0.24, hot(dark ? "#cfc6d6" : "#e6dfec"));
  bg.addColorStop(0.6, hot(dark ? "#7a7284" : "#a49bb0"));
  bg.addColorStop(1, hot(dark ? "#3d3747" : "#5c5468"));
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.4);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Soot from previous firings, heaviest at the bottom where the flame licks.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx - botW / 2, baseY);
  ctx.lineTo(cx + botW / 2, baseY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.closePath();
  ctx.clip();
  const sg = ctx.createLinearGradient(0, baseY, 0, topY);
  sg.addColorStop(0, hexA("#000000", 0.55 * (1 - glow * 0.8)));
  sg.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = sg;
  ctx.fillRect(cx - w, topY, w * 2, h);
  ctx.restore();

  // Mouth and contents.
  ctx.beginPath();
  ctx.ellipse(cx, topY, topW / 2 - w * 0.04, ry - w * 0.02, 0, 0, Math.PI * 2);
  const ig = ctx.createLinearGradient(0, topY - ry, 0, topY + ry);
  ig.addColorStop(0, hexA(glow > 0.02 ? "#ffca6a" : "#2a2432", 0.9));
  ig.addColorStop(1, hexA(glow > 0.02 ? "#ff5a12" : "#171320", 0.95));
  ctx.fillStyle = ig;
  ctx.fill();
  if (opts.contents) {
    ctx.beginPath();
    ctx.ellipse(cx, topY + ry * 0.3, topW * 0.34, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = hexA(opts.contents, 0.9);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, topY, topW / 2, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = Math.max(1.2, w * 0.02);
  ctx.stroke();

  if (opts.lid) {
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.75, baseY - w * 0.06, w * 0.34, w * 0.1, -0.15, 0, Math.PI * 2);
    const lg = ctx.createLinearGradient(cx + w * 0.4, 0, cx + w * 1.1, 0);
    lg.addColorStop(0, dark ? "#cfc6d6" : "#eee8f2");
    lg.addColorStop(1, dark ? "#4d4658" : "#7d7590");
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = hexA("#000000", 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/** A gas syringe: the standard way to measure a gas evolved by a reaction. */
export function gasSyringe(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, theme: ThemeColors,
  fill: number, opts: { gas?: string; t?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const f = clamp01(fill);
  const barrel = () => roundRect(ctx, x, y, w, h, h * 0.18);
  const gas = opts.gas ?? theme.sci["gas"] ?? "#c07b2a";
  const plungerX = x + w * 0.12 + (w * 0.76) * f;
  ctx.save();

  refractBehind(ctx, barrel, x, y, w, h, 0.45, dark ? "#8fb6d8" : "#dcecfa");

  // The trapped gas: faintly tinted, brighter where it meets the seal.
  ctx.save();
  barrel();
  ctx.clip();
  const gg = ctx.createLinearGradient(x, y, x, y + h);
  gg.addColorStop(0, hexA(gas, 0.1));
  gg.addColorStop(0.5, hexA(gas, 0.22));
  gg.addColorStop(1, hexA(gas, 0.12));
  ctx.fillStyle = gg;
  ctx.fillRect(x, y, plungerX - x, h);
  ctx.restore();

  glassSkin(ctx, barrel, x, y, w, h, dark, { wall: Math.max(1.6, h * 0.05) });

  // Graduations along the top, in cm3, which is what the reading is in.
  ctx.save();
  for (let i = 0; i <= 20; i++) {
    const px = x + w * 0.12 + (w * 0.76 * i) / 20;
    const major = i % 5 === 0;
    ctx.strokeStyle = hexA("#ffffff", major ? 0.8 : 0.45);
    ctx.lineWidth = major ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(px, y + h * 0.08);
    ctx.lineTo(px, y + h * (major ? 0.32 : 0.22));
    ctx.stroke();
    if (major) {
      ctx.font = `600 ${Math.max(6, h * 0.17)}px ui-monospace, monospace`;
      ctx.fillStyle = hexA("#ffffff", 0.8);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(i * 5), px, y + h * 0.36);
    }
  }
  ctx.restore();

  // Nozzle and the rubber tube that brings the gas in.
  glassSkin(ctx, () => roundRect(ctx, x - w * 0.09, y + h * 0.36, w * 0.1, h * 0.28, h * 0.1),
    x - w * 0.09, y + h * 0.36, w * 0.1, h * 0.28, dark, { wall: 1.2 });

  // Plunger: barrel, black seal, thumb ring.
  metalRect(ctx, plungerX, y + h * 0.12, w * 0.05, h * 0.76, "#2f2937", "v", h * 0.06, 0.3);
  ctx.fillStyle = hexA("#ffffff", 0.35);
  ctx.fillRect(plungerX + w * 0.012, y + h * 0.16, w * 0.008, h * 0.68);
  glassSkin(ctx, () => roundRect(ctx, plungerX + w * 0.05, y + h * 0.34, x + w * 0.98 - plungerX - w * 0.05, h * 0.32, h * 0.1),
    plungerX + w * 0.05, y + h * 0.34, Math.max(4, x + w * 0.98 - plungerX - w * 0.05), h * 0.32, dark, { wall: 1.2 });
  metalRect(ctx, x + w * 0.96, y + h * 0.2, w * 0.05, h * 0.6, "#8d8499", "v", h * 0.08, 0.3);
  ctx.restore();
}

/** A digital balance: pan, sloped body, seven-segment readout, level bubble. */
export function balance(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number, w: number, theme: ThemeColors,
  reading: number, opts: { unit?: string; decimals?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const bodyH = w * 0.3;
  const bodyY = baseY - bodyH;
  const panR = w * 0.3;
  const panY = bodyY - w * 0.12;
  ctx.save();
  contact(ctx, cx, baseY + 2, w * 1.15, 0.55);

  // Body: a cast housing, sloped toward the reader so the display faces up.
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.5, bodyY + bodyH * 0.34);
  ctx.lineTo(cx - w * 0.42, bodyY);
  ctx.lineTo(cx + w * 0.42, bodyY);
  ctx.lineTo(cx + w * 0.5, bodyY + bodyH * 0.34);
  ctx.lineTo(cx + w * 0.5, baseY - bodyH * 0.1);
  ctx.quadraticCurveTo(cx + w * 0.5, baseY, cx + w * 0.42, baseY);
  ctx.lineTo(cx - w * 0.42, baseY);
  ctx.quadraticCurveTo(cx - w * 0.5, baseY, cx - w * 0.5, baseY - bodyH * 0.1);
  ctx.closePath();
  const hg = ctx.createLinearGradient(0, bodyY, 0, baseY);
  hg.addColorStop(0, dark ? "#6d6579" : "#d8d2e0");
  hg.addColorStop(0.18, dark ? "#4c4557" : "#b6aec2");
  hg.addColorStop(0.6, dark ? "#332d3d" : "#8f8799");
  hg.addColorStop(1, dark ? "#1b1724" : "#5b5468");
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.4);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.4);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.4, bodyY + 1.2);
  ctx.lineTo(cx + w * 0.4, bodyY + 1.2);
  ctx.stroke();

  // Display: a recessed LCD with a bezel and a glass sheen over it.
  const dw = w * 0.44, dh = bodyH * 0.42;
  const dx = cx - dw / 2, dy = bodyY + bodyH * 0.28;
  ctx.fillStyle = "#0d1410";
  roundRect(ctx, dx - 3, dy - 3, dw + 6, dh + 6, 4);
  ctx.fill();
  const lcd = ctx.createLinearGradient(0, dy, 0, dy + dh);
  lcd.addColorStop(0, "#93ad86");
  lcd.addColorStop(1, "#6f8c66");
  ctx.fillStyle = lcd;
  roundRect(ctx, dx, dy, dw, dh, 2);
  ctx.fill();

  const text = reading.toFixed(opts.decimals ?? 2);
  const chars = text.replace(".", "").split("");
  const digitW = (dw * 0.72) / Math.max(1, chars.length);
  const digitH = dh * 0.62;
  let px = dx + dw * 0.06;
  const dotAfter = text.indexOf(".") - 1;
  chars.forEach((c, i) => {
    sevenSeg(ctx, px, dy + dh * 0.19, digitW * 0.78, digitH, c, "#16210f", hexA("#16210f", 0.12));
    if (i === dotAfter) {
      ctx.fillStyle = "#16210f";
      ctx.beginPath();
      ctx.arc(px + digitW * 0.86, dy + dh * 0.78, Math.max(1.2, digitW * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    px += digitW;
  });
  ctx.font = `600 ${Math.max(7, dh * 0.34)}px ui-monospace, monospace`;
  ctx.fillStyle = "#16210f";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.unit ?? "g", dx + dw * 0.96, dy + dh * 0.55);
  // Glass over the LCD.
  const sheen = ctx.createLinearGradient(dx, dy, dx + dw * 0.6, dy + dh);
  sheen.addColorStop(0, hexA("#ffffff", 0.3));
  sheen.addColorStop(0.45, hexA("#ffffff", 0.05));
  sheen.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sheen;
  roundRect(ctx, dx, dy, dw, dh, 2);
  ctx.fill();

  // Tare and on/off keys.
  for (const [bx, label] of [[cx - w * 0.36, "T"], [cx + w * 0.3, "O"]] as const) {
    const bwid = w * 0.1, bhei = bodyH * 0.22;
    const bgk = ctx.createLinearGradient(0, bodyY + bodyH * 0.36, 0, bodyY + bodyH * 0.36 + bhei);
    bgk.addColorStop(0, dark ? "#8b8398" : "#f0ecf4");
    bgk.addColorStop(1, dark ? "#3a3446" : "#a29ab0");
    ctx.fillStyle = bgk;
    roundRect(ctx, bx - bwid / 2, bodyY + bodyH * 0.36, bwid, bhei, bhei * 0.35);
    ctx.fill();
    ctx.strokeStyle = hexA("#000000", 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = `700 ${Math.max(6, bhei * 0.6)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = dark ? "#1a1622" : "#2b2534";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx, bodyY + bodyH * 0.36 + bhei * 0.55);
  }

  // Spirit level: a balance only reads true when it is level, so it has one.
  const lx = cx + w * 0.44, ly = bodyY + bodyH * 0.5;
  ctx.beginPath();
  ctx.arc(lx, ly, w * 0.035, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#8fd7a0", 0.5);
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(lx + w * 0.008, ly - w * 0.006, w * 0.014, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.85);
  ctx.fill();

  // Pan support post, then the pan itself: brushed stainless, turned finish.
  metalRect(ctx, cx - w * 0.03, panY, w * 0.06, bodyY - panY + 4, "#9a92a6", "v", 2, 0.3);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, panY, panR, panR * 0.3, 0, 0, Math.PI * 2);
  // A turned pan smears the highlight into a ring, not a spot.
  const pg = ctx.createLinearGradient(cx - panR, panY - panR * 0.3, cx + panR, panY + panR * 0.3);
  pg.addColorStop(0, "#5e5768");
  pg.addColorStop(0.22, "#e6e1ee");
  pg.addColorStop(0.42, "#9d94aa");
  pg.addColorStop(0.62, "#efeaf4");
  pg.addColorStop(0.85, "#6c657a");
  pg.addColorStop(1, "#3a3446");
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    ctx.strokeStyle = hexA(i % 2 ? "#ffffff" : "#000000", 0.09);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, panY);
    ctx.lineTo(cx + Math.cos(a) * panR, panY + Math.sin(a) * panR * 0.3);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = hexA("#ffffff", 0.7);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cx, panY, panR, panR * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/**
 * A thermometer probe.
 *
 * The stem is a lens: the bore is hair-thin, and the round front of the glass
 * magnifies the column so it can be read at all. Drawing the column wider than
 * the bore, with the glass edges bright either side, is what makes it look
 * like a thermometer rather than a coloured stick.
 */
export function thermometerProbe(
  ctx: CanvasRenderingContext2D,
  x: number, topY: number, h: number, theme: ThemeColors,
  frac: number, opts: { label?: string; min?: number; max?: number; hot?: boolean } = {},
) {
  const dark = isDarkTheme(theme);
  const f = clamp01(frac);
  const w = Math.max(6, h * 0.055);
  const bulbR = w * 0.95;
  const bulbY = topY + h - bulbR;
  const colTop = topY + h * 0.08;
  const colBottom = bulbY - bulbR * 0.2;
  const fluid = opts.hot === false
    ? (theme.sci["cold"] ?? "#3b7fc9")
    : (theme.sci["hot"] ?? "#cf4b25");
  const level = colBottom - (colBottom - colTop) * f;
  const stem = () => roundRect(ctx, x - w / 2, topY, w, h - bulbR * 1.1, w * 0.45);

  ctx.save();
  refractBehind(ctx, stem, x - w / 2, topY, w, h - bulbR, 0.4, dark ? "#8fb6d8" : "#dcecfa");

  // Enamel back strip: the white paint behind the bore that makes it readable.
  ctx.fillStyle = dark ? hexA("#e8e2f0", 0.85) : hexA("#ffffff", 0.92);
  roundRect(ctx, x - w * 0.34, topY + w * 0.2, w * 0.68, h - bulbR * 1.3, w * 0.3);
  ctx.fill();

  // The magnified column.
  ctx.fillStyle = fluid;
  roundRect(ctx, x - w * 0.19, level, w * 0.38, colBottom - level + 2, w * 0.16);
  ctx.fill();
  ctx.fillStyle = hexA(mix(fluid, "#ffffff", 0.6), 0.7);
  ctx.fillRect(x - w * 0.14, level + 2, w * 0.07, colBottom - level - 2);
  ctx.fillStyle = hexA(shade(fluid, -0.5), 0.6);
  ctx.fillRect(x + w * 0.1, level + 2, w * 0.06, colBottom - level - 2);
  // Rounded top of the column — surface tension, not a flat cut.
  ctx.beginPath();
  ctx.arc(x, level + w * 0.1, w * 0.19, 0, Math.PI * 2);
  ctx.fillStyle = fluid;
  ctx.fill();

  // Scale: ticks every 10 degrees with numerals at the ends.
  const lo = opts.min ?? 0, hi = opts.max ?? 100;
  ctx.save();
  for (let i = 0; i <= 20; i++) {
    const yy = colBottom - ((colBottom - colTop) * i) / 20;
    const major = i % 2 === 0;
    ctx.strokeStyle = hexA(dark ? "#2b2534" : "#3d3448", major ? 0.85 : 0.5);
    ctx.lineWidth = major ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, yy);
    ctx.lineTo(x - w * (major ? 0.05 : 0.16), yy);
    ctx.stroke();
    if (i % 5 === 0) {
      ctx.font = `600 ${Math.max(6, w * 0.62)}px ui-monospace, monospace`;
      ctx.fillStyle = dark ? "#e6dfee" : "#3d3448";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(Math.round(lo + ((hi - lo) * i) / 20)), x - w * 0.7, yy);
    }
  }
  ctx.restore();

  glassSkin(ctx, stem, x - w / 2, topY, w, h - bulbR, dark, { wall: Math.max(1.2, w * 0.16), streak: 1.2 });

  // Bulb: the reservoir, with the fluid inside and a hard specular on the glass.
  const bg = ctx.createRadialGradient(x + KEY.x * bulbR, bulbY + KEY.y * bulbR, 0, x, bulbY, bulbR);
  bg.addColorStop(0, mix(fluid, "#ffffff", 0.55));
  bg.addColorStop(0.55, fluid);
  bg.addColorStop(1, shade(fluid, -0.5));
  ctx.beginPath();
  ctx.arc(x, bulbY, bulbR, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = Math.max(1, bulbR * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + KEY.x * bulbR * 0.6, bulbY + KEY.y * bulbR * 0.6, bulbR * 0.28, bulbR * 0.17, -0.7, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.85);
  ctx.fill();

  if (opts.label) {
    ctx.font = `700 ${Math.max(8, w * 0.85)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(opts.label, x, topY - 4);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Heat and flame
 * ------------------------------------------------------------------ */

/** The wavering outline of a flame, deterministic in `t`. */
function flamePath(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, h: number, t: number, seed: number,
) {
  const N = 22;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = i / N;
    // Width tapers to a point; the wobble grows toward the tip, because the
    // base of a flame is anchored by the gas stream and only the top dances.
    const flick = Math.sin(t * 9 + p * 5 + seed) * 0.05 + Math.sin(t * 15.7 - p * 3 + seed * 2) * 0.03;
    const half = (w / 2) * Math.sin(Math.PI * (0.12 + p * 0.88)) * (1 - p * 0.75) * (1 + flick * p * 3);
    const yy = baseY - h * p;
    if (i === 0) ctx.moveTo(x - half, yy);
    else ctx.lineTo(x - half + flick * w * p, yy);
  }
  for (let i = N; i >= 0; i--) {
    const p = i / N;
    const flick = Math.sin(t * 9 + p * 5 + seed) * 0.05 + Math.sin(t * 15.7 - p * 3 + seed * 2) * 0.03;
    const half = (w / 2) * Math.sin(Math.PI * (0.12 + p * 0.88)) * (1 - p * 0.75) * (1 + flick * p * 3);
    ctx.lineTo(x + half + flick * w * p, baseY - h * p);
  }
  ctx.closePath();
}

/**
 * A Bunsen flame with its two cones.
 *
 * With the air hole open the flame is a pale blue veil around a sharply
 * defined inner cone of unburnt gas; the hottest point is just above that
 * cone's tip, which is where the apparatus goes. Close the air hole and the
 * same gas burns as a soft luminous yellow flame — cooler, sooty, and the
 * flame you leave a burner on when nobody is heating anything. Drawing both,
 * and switching between them on `air`, is the lesson.
 */
export function bunsenFlame(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, intensity: number, t: number, air = 1,
) {
  const i = clamp01(intensity);
  if (i <= 0.01) return;
  const a = clamp01(air);
  const h = w * (2.1 + i * 2.4);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (a < 0.98) {
    // Luminous flame: yellow, taller, lazier, soot glowing at the tip.
    const lh = h * (1.1 + (1 - a) * 0.25);
    const lg = ctx.createLinearGradient(0, baseY, 0, baseY - lh);
    lg.addColorStop(0, hexA("#ff7a1e", 0.5 * (1 - a)));
    lg.addColorStop(0.35, hexA("#ffb43c", 0.55 * (1 - a)));
    lg.addColorStop(0.75, hexA("#ffe08a", 0.4 * (1 - a)));
    lg.addColorStop(1, hexA("#ffd06a", 0));
    ctx.fillStyle = lg;
    flamePath(ctx, x, baseY, w * 1.15, lh, t * 0.7, 1.3);
    ctx.fill();
  }

  if (a > 0.02) {
    // Outer cone: the pale, almost transparent veil where combustion completes.
    const og = ctx.createLinearGradient(0, baseY, 0, baseY - h);
    og.addColorStop(0, hexA("#2a5fd0", 0.55 * a));
    og.addColorStop(0.3, hexA("#5f92ea", 0.4 * a));
    og.addColorStop(0.72, hexA("#a9c8ff", 0.22 * a));
    og.addColorStop(1, hexA("#dbe8ff", 0));
    ctx.fillStyle = og;
    flamePath(ctx, x, baseY, w * 1.25, h, t, 0.4);
    ctx.fill();

    // Inner cone: crisp-edged, blue-green, the unburnt gas. Its edge is sharp
    // in life, so it gets a stroke as well as a fill.
    const ih = h * 0.42;
    const ig = ctx.createLinearGradient(0, baseY, 0, baseY - ih);
    ig.addColorStop(0, hexA("#0f2f9a", 0.85 * a));
    ig.addColorStop(0.55, hexA("#2f7fd6", 0.75 * a));
    ig.addColorStop(1, hexA("#9fe8d8", 0.5 * a));
    ctx.fillStyle = ig;
    flamePath(ctx, x, baseY, w * 0.66, ih, t, 2.1);
    ctx.fill();
    ctx.strokeStyle = hexA("#bff0ff", 0.5 * a);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // The hot spot just above the inner cone tip — where you hold the beaker.
    const hs = ctx.createRadialGradient(x, baseY - ih * 1.15, 0, x, baseY - ih * 1.15, w * 0.5);
    hs.addColorStop(0, hexA("#e8f4ff", 0.5 * a));
    hs.addColorStop(1, hexA("#8fc0ff", 0));
    ctx.fillStyle = hs;
    ctx.beginPath();
    ctx.arc(x, baseY - ih * 1.15, w * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light the flame throws back onto the bench and the barrel.
  const pool = ctx.createRadialGradient(x, baseY, 0, x, baseY, w * 2.6);
  pool.addColorStop(0, hexA(a > 0.5 ? "#6f9dff" : "#ff9c3c", 0.28 * i));
  pool.addColorStop(1, hexA(a > 0.5 ? "#3b6fd4" : "#e0431a", 0));
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(x, baseY, w * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A Bunsen burner with a live flame; `intensity` 0 is off. */
export function burner(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, intensity: number, t: number,
) {
  ctx.save();
  const barrelW = w * 0.24, barrelH = w * 1.15;
  const topY = baseY - barrelH;
  contact(ctx, x, baseY + 2, w * 1.2, 0.5);

  // Heavy foot: the burner must not tip over, and it looks like it.
  ctx.beginPath();
  ctx.moveTo(x - w * 0.42, baseY);
  ctx.lineTo(x - w * 0.2, baseY - w * 0.16);
  ctx.lineTo(x + w * 0.2, baseY - w * 0.16);
  ctx.lineTo(x + w * 0.42, baseY);
  ctx.closePath();
  const fg = ctx.createLinearGradient(x - w * 0.42, 0, x + w * 0.42, 0);
  fg.addColorStop(0, "#131019");
  fg.addColorStop(0.28, "#5f5769");
  fg.addColorStop(0.5, "#2e2837");
  fg.addColorStop(1, "#0f0c15");
  ctx.fillStyle = fg;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, baseY, w * 0.42, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1b1723";
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.25);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Barrel: a turned steel tube, so the highlight is one narrow vertical band.
  metalRect(ctx, x - barrelW / 2, topY, barrelW, barrelH, "#8b8296", "v", 0, 0.26);

  // Air collar with its holes: the control that decides which flame you get.
  const collarY = baseY - barrelH * 0.28;
  metalRect(ctx, x - barrelW * 0.62, collarY, barrelW * 1.24, barrelH * 0.17, "#6f6779", "v", 2, 0.3);
  for (let i = 0; i < 2; i++) {
    const hx = x + (i === 0 ? -1 : 1) * barrelW * 0.3;
    const hg = ctx.createRadialGradient(hx, collarY + barrelH * 0.085, 0, hx, collarY + barrelH * 0.085, barrelW * 0.2);
    hg.addColorStop(0, "#000000");
    hg.addColorStop(1, "#2a2433");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(hx, collarY + barrelH * 0.085, barrelW * 0.16, barrelH * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA("#ffffff", 0.3);
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  // Gas tap and hose, so the gas has somewhere to come from.
  const rg = ctx.createLinearGradient(0, baseY - w * 0.24, 0, baseY - w * 0.08);
  rg.addColorStop(0, "#a49bb0");
  rg.addColorStop(0.35, "#4b4457");
  rg.addColorStop(1, "#1d1926");
  ctx.fillStyle = rg;
  roundRect(ctx, x + w * 0.16, baseY - w * 0.24, w * 0.42, w * 0.14, w * 0.06);
  ctx.fill();

  // The mouth of the barrel, seen as an ellipse, then the flame above it.
  ctx.beginPath();
  ctx.ellipse(x, topY, barrelW / 2, barrelW * 0.17, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0a13";
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  bunsenFlame(ctx, x, topY, barrelW * 1.5, intensity, t, clamp01(intensity * 1.3));
  ctx.restore();
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
  // Three passes: shadowed underside, body, and the specular thread running
  // along the top of the wire. Round wire, not a zigzag line.
  for (const [wid, col, off] of [
    [radius * 0.44, shade(color, -0.55), 1.4],
    [radius * 0.3, color, 0],
    [radius * 0.12, shade(color, 0.7), -0.9],
  ] as const) {
    ctx.beginPath();
    const lead = len * 0.08;
    ctx.moveTo(0, off);
    ctx.lineTo(lead, off);
    const N = Math.max(24, coils * 16);
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
  contact(ctx, x, groundY + 1, w * 1.1, 0.45);

  const g = ctx.createLinearGradient(0, bodyY, 0, bodyY + h * 0.62);
  g.addColorStop(0, shade(color, 0.6));
  g.addColorStop(0.18, shade(color, 0.3));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -0.42));
  ctx.fillStyle = g;
  roundRect(ctx, x - w / 2, bodyY, w, h * 0.62, h * 0.12);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = hexA("#ffffff", 0.4);
  roundRect(ctx, x - w / 2 + w * 0.08, bodyY + h * 0.06, w * 0.84, h * 0.12, h * 0.05);
  ctx.fill();
  // A mass hook and plate on top, since carts are always loaded in class.
  metalRect(ctx, x - w * 0.06, bodyY - h * 0.1, w * 0.12, h * 0.1, "#9a92a6", "v", 2, 0.3);

  for (const wx of [x - w * 0.28, x + w * 0.28]) {
    const wy = groundY - wheelR;
    const wg = ctx.createRadialGradient(wx + KEY.x * wheelR, wy + KEY.y * wheelR, wheelR * 0.05, wx, wy, wheelR);
    wg.addColorStop(0, "#6a6376");
    wg.addColorStop(0.55, "#2e2836");
    wg.addColorStop(0.88, "#171320");
    wg.addColorStop(1, "#0b0912");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
    ctx.fill();
    // Tread, so rotation is visible even when the spokes are edge on.
    ctx.strokeStyle = hexA("#000000", 0.5);
    ctx.lineWidth = Math.max(0.8, wheelR * 0.09);
    for (let i = 0; i < 16; i++) {
      const a = spin + (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * wheelR * 0.86, wy + Math.sin(a) * wheelR * 0.86);
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.99, wy + Math.sin(a) * wheelR * 0.99);
      ctx.stroke();
    }
    ctx.strokeStyle = hexA("#ffffff", 0.45);
    ctx.lineWidth = Math.max(1, wheelR * 0.11);
    for (let i = 0; i < 4; i++) {
      const a = spin + (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * wheelR * 0.2, wy + Math.sin(a) * wheelR * 0.2);
      ctx.lineTo(wx + Math.cos(a) * wheelR * 0.7, wy + Math.sin(a) * wheelR * 0.7);
      ctx.stroke();
    }
    screwHead(ctx, wx, wy, wheelR * 0.22);
  }
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
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * (2.4 + b * 2.6));
    g.addColorStop(0, hexA("#fff3c4", 0.8 * b));
    g.addColorStop(0.3, hexA("#ffd45e", 0.34 * b));
    g.addColorStop(1, hexA("#ffb03a", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * (2.4 + b * 2.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  const eg = ctx.createRadialGradient(x + KEY.x * r * 0.6, y + KEY.y * r * 0.6, 0, x, y, r);
  eg.addColorStop(0, hexA("#ffffff", 0.55));
  eg.addColorStop(0.55, hexA(b > 0.05 ? "#ffe9a8" : "#e9e2f0", 0.24 + b * 0.4));
  eg.addColorStop(1, hexA(b > 0.05 ? "#ffc94d" : "#b9aec6", 0.42));
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Glass: a bright vertical streak and a rim, as on every other vessel here.
  ctx.fillStyle = hexA("#ffffff", 0.55);
  roundRect(ctx, x - r * 0.62, y - r * 0.55, r * 0.14, r * 0.95, r * 0.07);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Filament: a real coil on two support wires, brightening with current.
  const fc = b > 0.05
    ? `rgba(255,${Math.round(190 + 60 * b)},${Math.round(80 + 100 * b)},1)`
    : hexA(theme.inkSoft, 0.75);
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.28, y + r * 0.72);
  ctx.lineTo(x - r * 0.28, y + r * 0.05);
  ctx.moveTo(x + r * 0.28, y + r * 0.72);
  ctx.lineTo(x + r * 0.28, y + r * 0.05);
  ctx.stroke();
  if (b > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ffb03a";
    ctx.shadowBlur = r * 0.6 * b;
    ctx.strokeStyle = fc;
    ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, y + r * 0.05);
    for (let i = 0; i <= 14; i++) {
      ctx.lineTo(x - r * 0.28 + (r * 0.56 * i) / 14, y + (i % 2 ? -r * 0.32 : r * 0.02));
    }
    ctx.lineTo(x + r * 0.28, y + r * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  // Screw cap: brass, threaded, with the insulating pip at the bottom.
  metalRect(ctx, x - r * 0.42, y + r * 0.74, r * 0.84, r * 0.5, "#b9995a", "v", r * 0.06, 0.28);
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const yy = y + r * 0.74 + (r * 0.5 * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, yy);
    ctx.lineTo(x + r * 0.42, yy - r * 0.05);
    ctx.stroke();
  }
  ctx.fillStyle = "#1d1926";
  roundRect(ctx, x - r * 0.16, y + r * 1.2, r * 0.32, r * 0.14, r * 0.06);
  ctx.fill();
  ctx.restore();
}

/** A battery cell with terminals and a body band. */
export function battery(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, theme: ThemeColors,
) {
  ctx.save();
  // Steel can with a printed label: the can is anisotropic, the label matte.
  metalRect(ctx, x, y, w, h, "#7d7589", "h", h * 0.14, 0.24);
  const g = ctx.createLinearGradient(0, y + h * 0.14, 0, y + h * 0.86);
  g.addColorStop(0, shade(theme.accent, 0.55));
  g.addColorStop(0.3, theme.accent);
  g.addColorStop(1, shade(theme.accent, -0.45));
  ctx.fillStyle = g;
  roundRect(ctx, x + w * 0.06, y + h * 0.12, w * 0.88, h * 0.76, h * 0.1);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.32);
  roundRect(ctx, x + w * 0.08, y + h * 0.17, w * 0.84, h * 0.14, h * 0.06);
  ctx.fill();
  ctx.fillStyle = hexA("#000000", 0.22);
  roundRect(ctx, x + w * 0.08, y + h * 0.72, w * 0.84, h * 0.1, h * 0.05);
  ctx.fill();

  // Terminals: the raised positive cap and the flat negative end.
  metalRect(ctx, x + w, y + h * 0.3, w * 0.08, h * 0.4, "#cfc7d8", "h", h * 0.06, 0.3);
  metalRect(ctx, x - w * 0.05, y + h * 0.36, w * 0.05, h * 0.28, "#cfc7d8", "h", h * 0.04, 0.3);
  ctx.font = `700 ${h * 0.4}px ui-monospace, monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", x + w * 0.85, y + h * 0.52);
  ctx.fillText("−", x + w * 0.15, y + h * 0.52);
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
  for (const [half, col, label] of [[-1, north, "N"], [1, south, "S"]] as const) {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, shade(col, 0.55));
    g.addColorStop(0.16, shade(col, 0.28));
    g.addColorStop(0.5, col);
    g.addColorStop(0.9, shade(col, -0.38));
    g.addColorStop(1, shade(col, -0.15));
    ctx.fillStyle = g;
    ctx.fillRect(half < 0 ? -w / 2 : 0, -h / 2, w / 2, h);
    ctx.font = `700 ${h * 0.5}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, half * w * 0.25, 0);
  }
  // Painted steel: a hard specular line along the top face, dark at the edges.
  ctx.fillStyle = hexA("#ffffff", 0.35);
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.1);
  ctx.strokeStyle = hexA("#000000", 0.45);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}


/* ------------------------------------------------------------------ *
 * Optics
 * ------------------------------------------------------------------ */

/** A glass prism or lens body with an edge highlight and a soft caustic. */
export function opticalGlass(
  ctx: CanvasRenderingContext2D,
  path: () => void, theme: ThemeColors, tintHue?: string,
  bbox?: { x: number; y: number; w: number; h: number },
) {
  const b = bbox ?? { x: -80, y: -80, w: 160, h: 160 };
  const tint = tintHue ?? "#bfe4ff";
  ctx.save();
  path();
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, hexA(mix(tint, "#ffffff", 0.5), 0.5));
  g.addColorStop(0.35, hexA(tint, 0.22));
  g.addColorStop(0.6, hexA("#ffffff", 0.16));
  g.addColorStop(1, hexA(shade(tint, -0.2), 0.42));
  ctx.fillStyle = g;
  ctx.fill();

  // The internal streak: one hard band of reflected strip light.
  ctx.save();
  ctx.clip();
  const sg = ctx.createLinearGradient(b.x + b.w * 0.18, 0, b.x + b.w * 0.38, 0);
  sg.addColorStop(0, hexA("#ffffff", 0));
  sg.addColorStop(0.5, hexA("#ffffff", 0.7));
  sg.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sg;
  ctx.fillRect(b.x + b.w * 0.18, b.y, b.w * 0.2, b.h);
  ctx.restore();

  ctx.strokeStyle = hexA("#ffffff", 0.75);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.accent, 0.35);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

/**
 * A lens, as a real piece of glass.
 *
 * The thickness profile is the physics: a converging lens is fat in the middle
 * so the parts of the wavefront near the axis are delayed most, and the light
 * folds into a focus. Drawing the focus as a caustic — a bright cone narrowing
 * to a point and opening again — says that in one picture.
 */
export function lens(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, halfH: number, thickness: number, theme: ThemeColors,
  opts: { diverging?: boolean; focal?: number; beam?: number; mount?: boolean } = {},
) {
  const dark = isDarkTheme(theme);
  const div = opts.diverging === true;
  const bulge = thickness / 2;
  const beam = clamp01(opts.beam ?? 0);
  const light = theme.sci["light"] ?? "#d9a017";

  const body = () => {
    ctx.beginPath();
    if (!div) {
      ctx.moveTo(cx, cy - halfH);
      ctx.quadraticCurveTo(cx + bulge * 2, cy, cx, cy + halfH);
      ctx.quadraticCurveTo(cx - bulge * 2, cy, cx, cy - halfH);
    } else {
      const e = thickness * 0.5;
      ctx.moveTo(cx - e, cy - halfH);
      ctx.lineTo(cx + e, cy - halfH);
      ctx.quadraticCurveTo(cx - e * 0.6, cy, cx + e, cy + halfH);
      ctx.lineTo(cx - e, cy + halfH);
      ctx.quadraticCurveTo(cx + e * 0.6, cy, cx - e, cy - halfH);
    }
    ctx.closePath();
  };

  ctx.save();

  if (beam > 0.01 && opts.focal) {
    // The light itself: a parallel bundle in, and a converging (or apparently
    // diverging) cone out. Drawn additively so it reads as light, not paint.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const f = opts.focal;
    const bg = ctx.createLinearGradient(cx, cy - halfH, cx, cy + halfH);
    bg.addColorStop(0, hexA(light, 0.05 * beam));
    bg.addColorStop(0.5, hexA(mix(light, "#ffffff", 0.6), 0.3 * beam));
    bg.addColorStop(1, hexA(light, 0.05 * beam));
    ctx.fillStyle = bg;
    ctx.fillRect(cx - Math.abs(f) * 1.1, cy - halfH, Math.abs(f) * 1.1, halfH * 2);
    ctx.beginPath();
    if (!div) {
      ctx.moveTo(cx, cy - halfH);
      ctx.lineTo(cx + f, cy);
      ctx.lineTo(cx, cy + halfH);
      ctx.closePath();
    } else {
      ctx.moveTo(cx, cy - halfH);
      ctx.lineTo(cx + Math.abs(f), cy - halfH * 2.1);
      ctx.lineTo(cx + Math.abs(f), cy + halfH * 2.1);
      ctx.lineTo(cx, cy + halfH);
      ctx.closePath();
    }
    const cg = ctx.createLinearGradient(cx, cy, cx + f, cy);
    cg.addColorStop(0, hexA(mix(light, "#ffffff", 0.5), 0.34 * beam));
    cg.addColorStop(1, hexA(light, 0.06 * beam));
    ctx.fillStyle = cg;
    ctx.fill();
    if (!div) {
      const spot = ctx.createRadialGradient(cx + f, cy, 0, cx + f, cy, halfH * 0.5);
      spot.addColorStop(0, hexA("#ffffff", 0.85 * beam));
      spot.addColorStop(0.3, hexA(light, 0.5 * beam));
      spot.addColorStop(1, hexA(light, 0));
      ctx.fillStyle = spot;
      ctx.beginPath();
      ctx.arc(cx + f, cy, halfH * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  refractBehind(ctx, body, cx - thickness, cy - halfH, thickness * 2, halfH * 2, 0.7,
    dark ? "#9fc7ea" : "#e3f0fb");

  body();
  const g = ctx.createLinearGradient(cx, cy - halfH, cx, cy + halfH);
  g.addColorStop(0, hexA(dark ? "#9fc7ea" : "#cfe6f8", 0.6));
  g.addColorStop(0.3, hexA("#ffffff", 0.14));
  g.addColorStop(0.55, hexA(dark ? "#7fb0d8" : "#bcdcf2", 0.2));
  g.addColorStop(1, hexA(dark ? "#5d90b8" : "#9fc7e4", 0.6));
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // A bright vertical streak, plus the curved band that shows the surface.
  ctx.fillStyle = hexA("#ffffff", 0.7);
  roundRect(ctx, cx - thickness * 0.28, cy - halfH * 0.7, Math.max(1.4, thickness * 0.12), halfH * 1.4, thickness * 0.06);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.35);
  ctx.lineWidth = Math.max(1, thickness * 0.08);
  ctx.beginPath();
  ctx.moveTo(cx + bulge * 0.3, cy - halfH * 0.85);
  ctx.quadraticCurveTo(cx + bulge * 1.3, cy, cx + bulge * 0.3, cy + halfH * 0.85);
  ctx.stroke();
  ctx.restore();

  // Edges: thin glass at the rim of a converging lens catches a hard line.
  body();
  ctx.strokeStyle = hexA("#ffffff", 0.8);
  ctx.lineWidth = Math.max(1.2, thickness * 0.07);
  ctx.stroke();
  ctx.strokeStyle = hexA(dark ? "#2a3a48" : "#5f7180", 0.5);
  ctx.lineWidth = Math.max(0.7, thickness * 0.03);
  ctx.stroke();

  if (opts.mount !== false) {
    // A holder, because a lens in mid-air is a diagram, not apparatus.
    for (const s of [-1, 1]) {
      metalRect(ctx, cx - thickness * 0.35, cy + s * halfH - (s > 0 ? 0 : thickness * 0.5),
        thickness * 0.7, thickness * 0.5, "#8d8499", "v", 2, 0.3);
    }
  }
  ctx.restore();
}

/**
 * A triangular prism, with dispersion.
 *
 * The spread is drawn with violet bent most and red least, because that
 * ordering is the entire observation: the glass has a different refractive
 * index for each colour, so white light comes apart.
 */
export function prism(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, theme: ThemeColors,
  opts: { angle?: number; beam?: number; benchY?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const beam = clamp01(opts.beam ?? 0);
  const R = size / Math.sqrt(3);
  const rot = opts.angle ?? 0;
  const pts = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + rot + (i * Math.PI * 2) / 3;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
  };
  const SPECTRUM = ["#e0453a", "#e88a2a", "#e8c93a", "#4fb45f", "#3f86d8", "#4a4fc4", "#8a45c4"];

  ctx.save();
  if (beam > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // Incident white beam.
    const ig = ctx.createLinearGradient(cx - size * 2.2, cy, cx - R * 0.4, cy);
    ig.addColorStop(0, hexA("#ffffff", 0.1 * beam));
    ig.addColorStop(1, hexA("#ffffff", 0.55 * beam));
    ctx.fillStyle = ig;
    ctx.fillRect(cx - size * 2.2, cy - size * 0.045, size * 2.2 - R * 0.3, size * 0.09);
    // Dispersed fan leaving the far face.
    SPECTRUM.forEach((c, i) => {
      const spread = (i / (SPECTRUM.length - 1) - 0.5) * size * 0.5;
      const eg = ctx.createLinearGradient(cx + R * 0.3, cy, cx + size * 2.4, cy + size * 0.5 + spread * 2);
      eg.addColorStop(0, hexA(c, 0.7 * beam));
      eg.addColorStop(1, hexA(c, 0.05 * beam));
      ctx.strokeStyle = eg;
      ctx.lineWidth = size * 0.055;
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.2, cy + size * 0.06);
      ctx.lineTo(cx + size * 2.4, cy + size * 0.5 + spread * 2.4);
      ctx.stroke();
    });
    ctx.restore();
  }

  refractBehind(ctx, body, cx - R, cy - R, R * 2, R * 2, 0.75, dark ? "#9fc7ea" : "#e3f0fb");

  body();
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, hexA(dark ? "#a8cdec" : "#dceefb", 0.55));
  g.addColorStop(0.35, hexA("#ffffff", 0.16));
  g.addColorStop(0.7, hexA(dark ? "#6fa0c8" : "#b3d6ee", 0.3));
  g.addColorStop(1, hexA(dark ? "#4b7a9c" : "#8fbcd8", 0.6));
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // The bright streak, and the internal reflection of the far face.
  ctx.fillStyle = hexA("#ffffff", 0.62);
  roundRect(ctx, cx - R * 0.42, cy - R * 0.3, Math.max(1.6, size * 0.05), R * 1.2, size * 0.02);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.beginPath();
  ctx.moveTo(pts[0].x * 0.6 + cx * 0.4, pts[0].y * 0.6 + cy * 0.4);
  ctx.lineTo(pts[1].x * 0.7 + cx * 0.3, pts[1].y * 0.7 + cy * 0.3);
  ctx.stroke();
  ctx.restore();

  // Ground edges: a prism's arrises are its brightest feature.
  body();
  ctx.strokeStyle = hexA("#ffffff", 0.85);
  ctx.lineWidth = Math.max(1.4, size * 0.03);
  ctx.stroke();
  ctx.strokeStyle = hexA(dark ? "#22303c" : "#5f7180", 0.45);
  ctx.lineWidth = Math.max(0.6, size * 0.012);
  ctx.stroke();

  if (opts.benchY !== undefined) {
    contact(ctx, cx, opts.benchY, size * 1.2, 0.45);
    // A spectral caustic on the bench: the light the glass gathered, landing.
    SPECTRUM.forEach((c, i) => {
      causticPatch(ctx, cx + size * (0.3 + i * 0.16), opts.benchY as number,
        size * 0.5, size * 0.14, c, 0.5 + beam * 0.5);
    });
  }
  ctx.restore();
}

/**
 * An optical bench: a rail with sliding carriers.
 *
 * The scale down the rail is what makes the experiment quantitative — object
 * distance and image distance are both read off it — so the numbers are drawn.
 */
export function opticalBench(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, theme: ThemeColors,
  carriers: Array<{ u: number; label?: string; height?: number }> = [],
) {
  const dark = isDarkTheme(theme);
  const railH = Math.max(10, w * 0.026);
  const topH = railH * 0.55;
  ctx.save();
  contact(ctx, x + w / 2, y + railH + topH * 0.5, w * 0.9, 0.4);

  // Top face, receding: the rail is extruded aluminium seen slightly from above.
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - w * 0.012, y - topH);
  ctx.lineTo(x + w * 0.012, y - topH);
  ctx.closePath();
  const tg = ctx.createLinearGradient(0, y - topH, 0, y);
  tg.addColorStop(0, "#b7aec4");
  tg.addColorStop(0.4, "#8d8499");
  tg.addColorStop(1, "#61596e");
  ctx.fillStyle = tg;
  ctx.fill();

  // Front face with the T-slot: the groove that the carriers key into.
  metalRect(ctx, x, y, w, railH, "#9a92a6", "h", 0, 0.22);
  const slotY = y + railH * 0.34;
  const sg = ctx.createLinearGradient(0, slotY, 0, slotY + railH * 0.3);
  sg.addColorStop(0, "#100d16");
  sg.addColorStop(0.6, "#2c2634");
  sg.addColorStop(1, "#5b5468");
  ctx.fillStyle = sg;
  ctx.fillRect(x, slotY, w, railH * 0.3);
  ctx.strokeStyle = hexA("#ffffff", 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, slotY + railH * 0.3);
  ctx.lineTo(x + w, slotY + railH * 0.3);
  ctx.stroke();

  // The engraved scale: centimetres, numbered every ten.
  for (let i = 0; i <= 100; i++) {
    const px = x + (w * i) / 100;
    const major = i % 10 === 0, mid = i % 5 === 0;
    if (!major && !mid && w / 100 < 5) continue;
    ctx.strokeStyle = hexA("#ffffff", major ? 0.8 : 0.4);
    ctx.lineWidth = major ? 1.3 : 0.8;
    ctx.beginPath();
    ctx.moveTo(px, y + railH * 0.02);
    ctx.lineTo(px, y + railH * (major ? 0.3 : mid ? 0.22 : 0.14));
    ctx.stroke();
    if (major) {
      ctx.font = `600 ${Math.max(6, railH * 0.34)}px ui-monospace, monospace`;
      ctx.fillStyle = hexA("#ffffff", 0.75);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(i), px, y + railH * 0.32);
    }
  }

  // End stops.
  for (const ex of [x - railH * 0.16, x + w - railH * 0.16]) {
    metalRect(ctx, ex, y - topH * 0.6, railH * 0.32, railH * 1.5, "#4d4658", "v", 2, 0.3);
  }

  // Carriers: anodised blocks with an index line and a thumbscrew.
  for (const c of carriers) {
    const px = x + w * clamp01(c.u);
    const cw = railH * 1.5, ch = railH * 0.9;
    const cy = y - topH * 0.2;
    ctx.save();
    contact(ctx, px, y + railH * 0.98, cw * 1.1, 0.35);
    metalRect(ctx, px - cw / 2, cy, cw, ch, "#39323f", "v", 2, 0.34);
    // The index line, read against the rail scale.
    ctx.strokeStyle = "#e04a4a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, cy + ch * 0.2);
    ctx.lineTo(px, y + railH * 0.32);
    ctx.stroke();
    screwHead(ctx, px + cw * 0.28, cy + ch * 0.42, railH * 0.2);
    // The post the component rides on.
    const ph = c.height ?? railH * 2.6;
    metalRect(ctx, px - railH * 0.13, cy - ph, railH * 0.26, ph, "#a49bb0", "v", 1.5, 0.3);
    if (c.label) {
      ctx.font = `600 ${Math.max(7, railH * 0.42)}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = dark ? theme.ink : theme.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(c.label, px, y + railH * 1.25);
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Mechanics
 * ------------------------------------------------------------------ */

/**
 * A pulley: a grooved wheel on an axle, with the rope sitting in the groove.
 *
 * The groove is the point. It is what keeps the rope on the wheel and what
 * makes the tension the same either side, which is the assumption every pulley
 * calculation in the syllabus rests on.
 */
export function pulley(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, theme: ThemeColors,
  opts: {
    angle?: number; bracket?: boolean; rope?: string;
    leftDrop?: number; rightDrop?: number;
  } = {},
) {
  const dark = isDarkTheme(theme);
  const spin = opts.angle ?? 0;
  const rg = r * 0.82;
  const ropeR = (r + rg) / 2;
  const ropeW = Math.max(2.4, (r - rg) * 0.9);
  const ropeColor = opts.rope ?? (dark ? "#d8c8a8" : "#b9a173");
  ctx.save();

  if (opts.bracket !== false) {
    // The yoke and hook it hangs from.
    metalRect(ctx, cx - r * 0.14, cy - r * 2.1, r * 0.28, r * 1.2, "#a49bb0", "v", 2, 0.3);
    ctx.strokeStyle = "#8d8499";
    ctx.lineWidth = Math.max(2.4, r * 0.1);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 2.3, r * 0.28, Math.PI * 0.15, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = hexA("#ffffff", 0.5);
    ctx.lineWidth = Math.max(0.8, r * 0.03);
    ctx.stroke();
    // Cheeks either side of the wheel.
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * r * 0.14, cy - r * 1.05);
      ctx.quadraticCurveTo(cx + s * r * 0.95, cy - r * 0.7, cx + s * r * 0.62, cy + r * 0.2);
      ctx.lineTo(cx + s * r * 0.3, cy + r * 0.1);
      ctx.quadraticCurveTo(cx + s * r * 0.5, cy - r * 0.5, cx, cy - r * 0.9);
      ctx.closePath();
      const cgd = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      cgd.addColorStop(0, "#8d8499");
      cgd.addColorStop(0.4, "#4d4658");
      cgd.addColorStop(1, "#241f2c");
      ctx.fillStyle = cgd;
      ctx.fill();
    }
  }

  // Wheel body: turned aluminium, so the highlight is a band, not a spot.
  const wg = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.6, cy + r);
  wg.addColorStop(0, "#3a3446");
  wg.addColorStop(0.18, "#cfc7d8");
  wg.addColorStop(0.36, "#79718a");
  wg.addColorStop(0.58, "#eae5f0");
  wg.addColorStop(0.78, "#5b5468");
  wg.addColorStop(1, "#221d2b");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = wg;
  ctx.fill();

  // The groove: a dark V turned into the rim.
  ctx.strokeStyle = hexA("#000000", 0.55);
  ctx.lineWidth = r - rg;
  ctx.beginPath();
  ctx.arc(cx, cy, ropeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.22);
  ctx.lineWidth = Math.max(0.8, (r - rg) * 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy, rg + (r - rg) * 0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Spokes and hub, rotating so motion is visible.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * rg * 0.92, Math.sin(a) * rg * 0.92);
    ctx.strokeStyle = hexA("#000000", 0.4);
    ctx.lineWidth = r * 0.14;
    ctx.stroke();
    ctx.strokeStyle = hexA("#ffffff", 0.3);
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    // Lightening holes, as real pulleys have.
    ctx.beginPath();
    ctx.arc(Math.cos(a + 0.63) * rg * 0.6, Math.sin(a + 0.63) * rg * 0.6, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = hexA("#000000", 0.45);
    ctx.fill();
  }
  ctx.restore();

  // Rope: over the top, into the groove, and down both sides.
  const drop = (s: number, d: number) => {
    const pts: Array<{ x: number; y: number }> = [];
    const start = s < 0 ? Math.PI : 0;
    for (let i = 0; i <= 14; i++) {
      const a = start + (s < 0 ? -1 : 1) * -(i / 14) * Math.PI * 0.5;
      pts.push({ x: cx + Math.cos(a) * ropeR, y: cy + Math.sin(a) * ropeR });
    }
    pts.reverse();
    pts.unshift({ x: cx + s * ropeR, y: cy + d });
    return pts;
  };
  ropeStroke(ctx, drop(-1, opts.leftDrop ?? r * 2.4), ropeW, ropeColor);
  ropeStroke(ctx, drop(1, opts.rightDrop ?? r * 1.6), ropeW, ropeColor);

  // The near flange, redrawn over the rope so the rope sits IN the groove.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.93, 0, Math.PI * 2);
  const fg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  fg.addColorStop(0, "#4d4658");
  fg.addColorStop(0.3, "#e2ddea");
  fg.addColorStop(0.65, "#6c657a");
  fg.addColorStop(1, "#211c29");
  ctx.fillStyle = fg;
  ctx.fill("evenodd");
  ctx.restore();

  screwHead(ctx, cx, cy, r * 0.2);
  ctx.restore();
}

/**
 * An inclined plane, with its protractor.
 *
 * The angle is drawn as a measured quantity rather than implied by the shape,
 * because every result on a ramp — the component of weight down the slope, the
 * critical angle for slipping — is a function of that one number.
 */
export function inclinePlane(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, angleDeg: number, theme: ThemeColors,
  opts: { surface?: "wood" | "metal"; label?: boolean } = {},
) {
  const dark = isDarkTheme(theme);
  const a = (Math.max(0, Math.min(60, angleDeg)) * Math.PI) / 180;
  const rise = w * Math.tan(a);
  const apex = { x: x + w, y: baseY - rise };
  const th = Math.max(6, w * 0.035);
  ctx.save();
  contact(ctx, x + w * 0.5, baseY + 2, w * 1.1, 0.45);

  // Side face: the body of the wedge.
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(apex.x, apex.y);
  ctx.lineTo(apex.x, baseY);
  ctx.closePath();
  const bg = ctx.createLinearGradient(x, baseY - rise, x + w, baseY);
  if (opts.surface === "metal") {
    bg.addColorStop(0, "#8d8499");
    bg.addColorStop(0.3, "#cfc7d8");
    bg.addColorStop(0.6, "#5b5468");
    bg.addColorStop(1, "#241f2c");
  } else {
    bg.addColorStop(0, dark ? "#7a5a38" : "#c39a63");
    bg.addColorStop(0.35, dark ? "#5f4629" : "#a87f4c");
    bg.addColorStop(0.75, dark ? "#402f1c" : "#7d5c36");
    bg.addColorStop(1, dark ? "#281c11" : "#523c23");
  }
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Grain running along the plank, curving as real grain does.
  if (opts.surface !== "metal") {
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      const off = (i / 16) * rise * 1.1;
      ctx.strokeStyle = hexA(i % 3 === 0 ? "#ffffff" : "#000000", 0.09 + hash1(i * 3.1) * 0.08);
      ctx.lineWidth = 1 + hash1(i * 7.7) * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, baseY - off * 0.2);
      ctx.quadraticCurveTo(x + w * 0.5, baseY - off * 0.55 - rise * 0.1, apex.x, apex.y + off);
      ctx.stroke();
    }
    ctx.restore();
  }

  // The running surface: a plank on top of the wedge, lit along its length.
  const nx = Math.sin(a), ny = -Math.cos(a);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(apex.x, apex.y);
  ctx.lineTo(apex.x + nx * th, apex.y + ny * th);
  ctx.lineTo(x + nx * th, baseY + ny * th);
  ctx.closePath();
  const sg = ctx.createLinearGradient(x, baseY, x + nx * th * 2, baseY + ny * th * 2);
  sg.addColorStop(0, opts.surface === "metal" ? "#efeaf4" : (dark ? "#a67c4c" : "#e0be8c"));
  sg.addColorStop(0.5, opts.surface === "metal" ? "#9a92a6" : (dark ? "#7d5c36" : "#c39a63"));
  sg.addColorStop(1, opts.surface === "metal" ? "#4d4658" : (dark ? "#4b3620" : "#8d6a40"));
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + nx * th, baseY + ny * th);
  ctx.lineTo(apex.x + nx * th, apex.y + ny * th);
  ctx.stroke();

  // Protractor at the heel, with the angle read off it.
  const pr = Math.min(w * 0.42, 120);
  ctx.strokeStyle = hexA(theme.accent, 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, baseY, pr, -a, 0);
  ctx.stroke();
  for (let d = 0; d <= 60; d += 5) {
    const t = (d * Math.PI) / 180;
    const long = d % 10 === 0;
    ctx.strokeStyle = hexA(theme.inkSoft, long ? 0.8 : 0.4);
    ctx.lineWidth = long ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(-t) * pr, baseY + Math.sin(-t) * pr);
    ctx.lineTo(x + Math.cos(-t) * pr * (long ? 0.88 : 0.93), baseY + Math.sin(-t) * pr * (long ? 0.88 : 0.93));
    ctx.stroke();
  }
  if (opts.label !== false) {
    ctx.font = `700 ${Math.max(10, w * 0.05)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(angleDeg)}°`, x + Math.cos(-a / 2) * pr * 0.66, baseY + Math.sin(-a / 2) * pr * 0.66);
  }

  // Rubber feet, so it does not slide off the bench.
  for (const fx of [x + w * 0.08, x + w * 0.86]) {
    ctx.fillStyle = "#1d1926";
    roundRect(ctx, fx, baseY - 1, w * 0.07, th * 0.4, th * 0.16);
    ctx.fill();
  }
  ctx.restore();
}

/** A boxwood metre rule with millimetre graduations and brass ends. */
export function meterRule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, len: number, theme: ThemeColors,
  opts: { vertical?: boolean; thickness?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const th = opts.thickness ?? Math.max(12, len * 0.05);
  ctx.save();
  ctx.translate(x, y);
  if (opts.vertical) ctx.rotate(-Math.PI / 2);

  // Boxwood: warm, with a lit top arris and a dark underside.
  const g = ctx.createLinearGradient(0, 0, 0, th);
  g.addColorStop(0, dark ? "#d8b884" : "#f3e0bd");
  g.addColorStop(0.12, dark ? "#c9a672" : "#ecd2a6");
  g.addColorStop(0.62, dark ? "#a8854f" : "#dcbb85");
  g.addColorStop(1, dark ? "#6d5330" : "#a8834f");
  ctx.fillStyle = g;
  roundRect(ctx, 0, 0, len, th, th * 0.12);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, len, th, th * 0.12);
  ctx.clip();
  // Grain: long, nearly straight, with the occasional darker line.
  for (let i = 0; i < 12; i++) {
    const yy = th * (0.08 + hash1(i * 2.7) * 0.84);
    ctx.strokeStyle = hexA(i % 4 === 0 ? "#4a3418" : "#000000", 0.06 + hash1(i * 5.3) * 0.07);
    ctx.lineWidth = 0.8 + hash1(i * 9.1) * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    for (let sx = 0; sx <= len; sx += len / 14) {
      ctx.lineTo(sx, yy + Math.sin(sx * 0.02 + i) * th * 0.03);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Graduations: millimetres if there is room for them, else centimetres.
  const mmSpace = len / 1000;
  for (let cm = 0; cm <= 100; cm++) {
    const px = (len * cm) / 100;
    const major = cm % 10 === 0;
    ctx.strokeStyle = hexA("#2a1f10", major ? 0.9 : 0.65);
    ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, th * (major ? 0.46 : cm % 5 === 0 ? 0.36 : 0.26));
    ctx.stroke();
    if (major) {
      ctx.font = `600 ${Math.max(6, th * 0.3)}px ui-monospace, monospace`;
      ctx.fillStyle = "#2a1f10";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(cm), px, th * 0.5);
    }
    if (mmSpace > 2.2 && cm < 100) {
      for (let mm = 1; mm < 10; mm++) {
        const mx = px + mmSpace * mm;
        ctx.strokeStyle = hexA("#2a1f10", 0.4);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, th * 0.16);
        ctx.stroke();
      }
    }
  }

  // Brass end caps: rules get dropped, so the ends are protected.
  for (const ex of [0, len - th * 0.34]) {
    metalRect(ctx, ex, 0, th * 0.34, th, "#c2a153", "h", th * 0.1, 0.26);
  }
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, 0, len, th, th * 0.12);
  ctx.stroke();
  ctx.restore();
}

/**
 * A dial face: bezel, scale, mirror strip, needle, glass.
 *
 * The mirror strip is not decoration — it is how a moving-coil instrument is
 * read without parallax error: line the needle up with its own reflection and
 * your eye is square to the scale. Drawing it teaches the technique.
 */
function dialFace(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, frac: number, theme: ThemeColors,
  opts: {
    unit?: string; max?: number; mirror?: boolean; sweep?: number;
    start?: number; needle?: string; face?: string;
  } = {},
) {
  const dark = isDarkTheme(theme);
  const sweep = opts.sweep ?? Math.PI * 1.15;
  const start = opts.start ?? -Math.PI / 2 - sweep / 2;
  const f = clamp01(frac);
  ctx.save();

  // Face: an off-white card, lit from up-left.
  const fg = ctx.createRadialGradient(cx + KEY.x * r * 0.6, cy + KEY.y * r * 0.6, 0, cx, cy, r);
  fg.addColorStop(0, opts.face ?? (dark ? "#f2eef6" : "#ffffff"));
  fg.addColorStop(0.65, opts.face ? shade(opts.face, -0.1) : (dark ? "#d8d1e0" : "#f0ecf4"));
  fg.addColorStop(1, dark ? "#a49bb0" : "#cdc5d6");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fg;
  ctx.fill();

  if (opts.mirror !== false) {
    // The mirrored arc, just inside the scale.
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.66, start, start + sweep);
    ctx.strokeStyle = hexA("#8fa3b8", 0.55);
    ctx.lineWidth = r * 0.09;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.66, start, start + sweep * 0.45);
    ctx.strokeStyle = hexA("#ffffff", 0.75);
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
  }

  // Scale: eleven majors, four minors between, numerals on the majors.
  const N = 50;
  for (let i = 0; i <= N; i++) {
    const a = start + (sweep * i) / N;
    const major = i % 5 === 0;
    const r0 = r * (major ? 0.72 : 0.78), r1 = r * 0.88;
    ctx.strokeStyle = hexA("#1b1622", major ? 0.9 : 0.5);
    ctx.lineWidth = major ? Math.max(1.2, r * 0.03) : Math.max(0.6, r * 0.015);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
    if (major && opts.max !== undefined) {
      const v = (opts.max * i) / N;
      ctx.font = `600 ${Math.max(6, r * 0.15)}px ui-monospace, monospace`;
      ctx.fillStyle = "#1b1622";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(v >= 10 ? v.toFixed(0) : v.toFixed(1), cx + Math.cos(a) * r * 0.58, cy + Math.sin(a) * r * 0.58);
    }
  }

  if (opts.unit) {
    ctx.font = `700 ${Math.max(8, r * 0.26)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = "#1b1622";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.unit, cx, cy + r * 0.34);
  }

  // Needle: a tapered blade with its shadow on the face, and a counterweight.
  const na = start + sweep * f;
  const tip = { x: cx + Math.cos(na) * r * 0.86, y: cy + Math.sin(na) * r * 0.86 };
  const back = { x: cx - Math.cos(na) * r * 0.2, y: cy - Math.sin(na) * r * 0.2 };
  const perp = { x: -Math.sin(na), y: Math.cos(na) };
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.translate(r * 0.04, r * 0.05);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(back.x + perp.x * r * 0.055, back.y + perp.y * r * 0.055);
  ctx.lineTo(back.x - perp.x * r * 0.055, back.y - perp.y * r * 0.055);
  ctx.closePath();
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(back.x + perp.x * r * 0.055, back.y + perp.y * r * 0.055);
  ctx.lineTo(back.x - perp.x * r * 0.055, back.y - perp.y * r * 0.055);
  ctx.closePath();
  ctx.fillStyle = opts.needle ?? "#c9403f";
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.4);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  screwHead(ctx, cx, cy, r * 0.11);

  // Bezel and cover glass: a curved sheen across the upper left.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  const bz = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  bz.addColorStop(0, "#e6e1ee");
  bz.addColorStop(0.35, "#6c657a");
  bz.addColorStop(0.7, "#c9c2d4");
  bz.addColorStop(1, "#2c2634");
  ctx.fillStyle = bz;
  ctx.fill("evenodd");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.clip();
  const gl = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.2, cy + r * 0.6);
  gl.addColorStop(0, hexA("#ffffff", 0.5));
  gl.addColorStop(0.42, hexA("#ffffff", 0.1));
  gl.addColorStop(0.5, hexA("#ffffff", 0));
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.85, r * 0.5, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

/** A spring balance with a dial: hook, spring in a window, swept scale. */
export function forceMeter(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, w: number, h: number, theme: ThemeColors,
  reading: number, opts: { max?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const max = opts.max ?? 10;
  const dialR = w * 0.5;
  const dialY = topY + w * 0.62;
  const bodyTop = dialY + dialR * 0.7;
  const bodyH = h - (bodyTop - topY) - w * 0.3;
  ctx.save();

  // Top hook: a bent rod, drawn with round ends because it is round bar.
  ctx.strokeStyle = "#8d8499";
  ctx.lineWidth = Math.max(2.6, w * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, topY + w * 0.16, w * 0.15, Math.PI * 0.2, Math.PI * 1.55);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = Math.max(0.8, w * 0.03);
  ctx.stroke();

  // Body: a tube with a window showing the spring doing the work.
  metalRect(ctx, cx - w * 0.3, bodyTop, w * 0.6, bodyH, "#7d7589", "v", w * 0.1, 0.28);
  const winY = bodyTop + bodyH * 0.1, winH = bodyH * 0.8;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, cx - w * 0.2, winY, w * 0.4, winH, w * 0.06);
  ctx.clip();
  ctx.fillStyle = dark ? "#120e19" : "#2a2434";
  ctx.fillRect(cx - w * 0.2, winY, w * 0.4, winH);
  // The spring stretches with the reading: that IS the measurement.
  const stretch = winH * (0.45 + 0.45 * clamp01(reading / max));
  spring(ctx, cx, winY + winH * 0.06, cx, winY + stretch, 7, w * 0.13, "#c9c2d4");
  metalRect(ctx, cx - w * 0.1, winY + stretch, w * 0.2, winH * 0.1, "#e04a4a", "v", 2, 0.3);
  ctx.restore();
  ctx.strokeStyle = hexA("#000000", 0.5);
  ctx.lineWidth = 1.2;
  roundRect(ctx, cx - w * 0.2, winY, w * 0.4, winH, w * 0.06);
  ctx.stroke();
  ctx.fillStyle = hexA("#ffffff", 0.35);
  roundRect(ctx, cx - w * 0.18, winY + 2, w * 0.05, winH - 4, w * 0.02);
  ctx.fill();

  // Bottom hook, where the load hangs.
  ctx.strokeStyle = "#8d8499";
  ctx.lineWidth = Math.max(2.6, w * 0.09);
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + bodyH);
  ctx.lineTo(cx, bodyTop + bodyH + w * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, bodyTop + bodyH + w * 0.24, w * 0.14, Math.PI * 1.2, Math.PI * 0.55);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = Math.max(0.8, w * 0.03);
  ctx.stroke();

  dialFace(ctx, cx, dialY, dialR, clamp01(reading / max), theme, {
    unit: "N", max, mirror: true, needle: "#c9403f",
  });
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Electricity
 * ------------------------------------------------------------------ */

/** Catmull-Rom sampling, so a hand-specified wire route reads as a bent wire. */
function smoothPath(
  pts: Array<{ x: number; y: number }>, per = 10,
): Array<{ x: number; y: number }> {
  if (pts.length < 3) return pts.slice();
  const out: Array<{ x: number; y: number }> = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const u = s / per, u2 = u * u, u3 = u2 * u;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Insulated wire with solder joints and moving charge carriers.
 *
 * The carriers drift slowly and all in the same direction, everywhere in the
 * circuit at once — which is the point worth making, because students expect
 * charge to race out of the battery and arrive at the bulb later.
 */
export function wireHarness(
  ctx: CanvasRenderingContext2D,
  path: Array<{ x: number; y: number }>,
  theme: ThemeColors, t: number,
  opts: {
    color?: string; width?: number; carriers?: number; current?: number; joints?: boolean;
  } = {},
) {
  if (path.length < 2) return;
  const pts = smoothPath(path, 12);
  const width = opts.width ?? 7;
  const color = opts.color ?? (theme.sci["current"] ?? "#b8860b");
  const current = opts.current ?? 1;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };

  // A cable is a tube: shadow under it, dark flanks, saturated body, and one
  // narrow sheen line along the top — the same anisotropic logic as metal.
  ctx.save();
  ctx.translate(1.5, 2.2);
  trace();
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = width * 1.05;
  ctx.stroke();
  ctx.restore();

  trace(); ctx.strokeStyle = shade(color, -0.62); ctx.lineWidth = width; ctx.stroke();
  trace(); ctx.strokeStyle = shade(color, -0.15); ctx.lineWidth = width * 0.78; ctx.stroke();
  trace(); ctx.strokeStyle = shade(color, 0.28); ctx.lineWidth = width * 0.42; ctx.stroke();
  ctx.save();
  ctx.translate(-width * 0.12, -width * 0.2);
  trace();
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = Math.max(0.8, width * 0.16);
  ctx.stroke();
  ctx.restore();

  // Arc length, for spacing carriers evenly however the wire bends.
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = cum[cum.length - 1] || 1;
  const at = (d: number) => {
    const dd = ((d % total) + total) % total;
    let i = 1;
    while (i < cum.length && cum[i] < dd) i++;
    const p0 = pts[i - 1], p1 = pts[Math.min(i, pts.length - 1)];
    const seg = (cum[Math.min(i, cum.length - 1)] - cum[i - 1]) || 1;
    const u = (dd - cum[i - 1]) / seg;
    return { x: p0.x + (p1.x - p0.x) * u, y: p0.y + (p1.y - p0.y) * u };
  };

  if (opts.joints !== false) {
    // Solder joints: a shiny fillet where the wire meets a terminal.
    for (const p of [pts[0], pts[pts.length - 1]]) {
      const r = width * 0.9;
      const g = ctx.createRadialGradient(p.x + KEY.x * r, p.y + KEY.y * r, 0, p.x, p.y, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, "#cfc9d6");
      g.addColorStop(0.75, "#8b8398");
      g.addColorStop(1, "#3d3747");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexA("#000000", 0.4);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  const n = opts.carriers ?? 0;
  if (n > 0 && Math.abs(current) > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const spacing = total / n;
    const drift = (t * 26 * current) % spacing;
    for (let i = 0; i < n; i++) {
      const p = at(i * spacing + drift);
      const r = width * 0.36;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
      g.addColorStop(0, hexA("#ffffff", 0.95));
      g.addColorStop(0.28, hexA(mix(color, "#ffffff", 0.5), 0.7));
      g.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

const BAND_COLORS = [
  "#141414", "#6b3f16", "#c0392b", "#e07b2a", "#e3c93c",
  "#3f9e4d", "#2f6fc4", "#7a4fc0", "#9a9a9a", "#f2f2f2",
];

/**
 * A resistor, identified the way a real one is: by its colour bands.
 *
 * Two significant figures, a multiplier and a tolerance band. Reading them is
 * a genuine lab skill, so the bands are computed from the actual value rather
 * than drawn as decoration.
 */
export function resistor(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, len: number, theme: ThemeColors,
  ohms: number, opts: { angle?: number; hot?: number } = {},
) {
  // Signature keeps `theme` so every apparatus is called the same way.
  void theme;
  const h = len * 0.34;
  const bodyW = len * 0.6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(opts.angle ?? 0);

  // Leads.
  ctx.strokeStyle = "#a49bb0";
  ctx.lineWidth = Math.max(1.6, h * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0); ctx.lineTo(-bodyW / 2 + 1, 0);
  ctx.moveTo(bodyW / 2 - 1, 0); ctx.lineTo(len / 2, 0);
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = Math.max(0.6, h * 0.05);
  ctx.stroke();

  // Body: a ceramic barrel, waisted at the ends, with a specular streak.
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, -h * 0.28);
  ctx.quadraticCurveTo(-bodyW * 0.42, -h / 2, -bodyW * 0.3, -h / 2);
  ctx.lineTo(bodyW * 0.3, -h / 2);
  ctx.quadraticCurveTo(bodyW * 0.42, -h / 2, bodyW / 2, -h * 0.28);
  ctx.lineTo(bodyW / 2, h * 0.28);
  ctx.quadraticCurveTo(bodyW * 0.42, h / 2, bodyW * 0.3, h / 2);
  ctx.lineTo(-bodyW * 0.3, h / 2);
  ctx.quadraticCurveTo(-bodyW * 0.42, h / 2, -bodyW / 2, h * 0.28);
  ctx.closePath();
  const base = opts.hot && opts.hot > 0.02 ? mix("#d9c9a6", "#e0603a", clamp01(opts.hot)) : "#d9c9a6";
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(base, 0.35));
  g.addColorStop(0.18, shade(base, 0.6));
  g.addColorStop(0.5, base);
  g.addColorStop(1, shade(base, -0.5));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Bands, computed from the value.
  const v = Math.max(1, ohms);
  const exp = Math.max(0, Math.floor(Math.log10(v)) - 1);
  const sig = Math.round(v / Math.pow(10, exp));
  const d1 = Math.min(9, Math.floor(sig / 10));
  const d2 = Math.min(9, sig % 10);
  const bands = [BAND_COLORS[d1], BAND_COLORS[d2], BAND_COLORS[Math.min(9, exp)], "#c2a153"];
  ctx.save();
  ctx.beginPath();
  ctx.rect(-bodyW / 2, -h / 2, bodyW, h);
  ctx.clip();
  bands.forEach((c, i) => {
    const bx = -bodyW * 0.34 + i * bodyW * 0.19 + (i === 3 ? bodyW * 0.14 : 0);
    const bw = bodyW * 0.1;
    const bgd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    bgd.addColorStop(0, shade(c, 0.4));
    bgd.addColorStop(0.4, c);
    bgd.addColorStop(1, shade(c, -0.5));
    ctx.fillStyle = bgd;
    ctx.fillRect(bx, -h / 2, bw, h);
  });
  ctx.restore();

  // The streak that says "glazed cylinder".
  ctx.fillStyle = hexA("#ffffff", 0.4);
  roundRect(ctx, -bodyW * 0.44, -h * 0.34, bodyW * 0.88, h * 0.14, h * 0.06);
  ctx.fill();
  ctx.restore();
}

/** An electrolytic capacitor: can, polarity stripe, vent score, leads. */
export function capacitor(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number, w: number, h: number, theme: ThemeColors,
  opts: { charge?: number; angle?: number } = {},
) {
  // Signature keeps `theme` so every apparatus is called the same way.
  void theme;
  const charge = clamp01(opts.charge ?? 0);
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(opts.angle ?? 0);

  // Leads.
  ctx.strokeStyle = "#a49bb0";
  ctx.lineWidth = Math.max(1.6, w * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, 0); ctx.lineTo(-w * 0.22, h * 0.22);
  ctx.moveTo(w * 0.22, 0); ctx.lineTo(w * 0.22, h * 0.22);
  ctx.stroke();

  // Aluminium can with its sleeve: dark blue, glossy, cylindrical.
  const body = () => roundRect(ctx, -w / 2, -h, w, h, w * 0.12);
  body();
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, "#0d1c33");
  g.addColorStop(0.22, "#2f5183");
  g.addColorStop(0.38, "#5b8ac4");
  g.addColorStop(0.6, "#243d63");
  g.addColorStop(1, "#080f1c");
  ctx.fillStyle = g;
  ctx.fill();

  // The polarity stripe, with its minus signs. Putting one in backwards is the
  // classic destructive mistake, so the marking is worth drawing.
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = hexA("#e8eef6", 0.9);
  ctx.fillRect(-w / 2, -h, w * 0.2, h);
  ctx.fillStyle = "#132340";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-w * 0.44, -h * (0.82 - i * 0.2), w * 0.08, h * 0.03);
  }
  if (charge > 0.02) {
    // A charged capacitor is drawn as stored energy, not as a dead part.
    const cg = ctx.createLinearGradient(0, 0, 0, -h);
    cg.addColorStop(0, hexA("#5fd0ff", 0));
    cg.addColorStop(1, hexA("#5fd0ff", 0.4 * charge));
    ctx.fillStyle = cg;
    ctx.fillRect(-w / 2, -h, w, h);
  }
  ctx.restore();

  // Top: the pressure-relief score, seen as a cross on the end cap.
  ctx.beginPath();
  ctx.ellipse(0, -h, w / 2, w * 0.16, 0, 0, Math.PI * 2);
  const tg = ctx.createLinearGradient(-w / 2, -h, w / 2, -h + w * 0.16);
  tg.addColorStop(0, "#8b93a4");
  tg.addColorStop(0.35, "#e2e7ef");
  tg.addColorStop(1, "#4a5162");
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h); ctx.lineTo(w * 0.3, -h);
  ctx.moveTo(0, -h - w * 0.13); ctx.lineTo(0, -h + w * 0.13);
  ctx.stroke();
  ctx.restore();
}

/** A knife switch: brass jaws, a real blade, and an insulating base. */
export function knifeSwitch(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, theme: ThemeColors,
  closed: number, opts: { spark?: number } = {},
) {
  // Signature keeps `theme` so every apparatus is called the same way.
  void theme;
  const c = clamp01(closed);
  const h = w * 0.3;
  ctx.save();
  contact(ctx, x + w / 2, baseY + 2, w * 1.1, 0.4);

  // Bakelite base: dark, slightly glossy, with a moulded edge.
  const bg = ctx.createLinearGradient(0, baseY - h, 0, baseY);
  bg.addColorStop(0, "#5a4438");
  bg.addColorStop(0.3, "#3a2a22");
  bg.addColorStop(1, "#1a120e");
  ctx.fillStyle = bg;
  roundRect(ctx, x, baseY - h, w, h, h * 0.2);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.18);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Brass posts at each end.
  const pivot = { x: x + w * 0.16, y: baseY - h * 0.9 };
  const jaw = { x: x + w * 0.84, y: baseY - h * 0.9 };
  for (const p of [pivot, jaw]) {
    metalRect(ctx, p.x - w * 0.06, p.y - h * 0.35, w * 0.12, h * 1.2, "#c2a153", "v", w * 0.02, 0.28);
  }
  // The jaw: two springy fingers the blade wedges between.
  ctx.strokeStyle = "#c2a153";
  ctx.lineWidth = Math.max(2, w * 0.035);
  ctx.beginPath();
  ctx.moveTo(jaw.x - w * 0.03, jaw.y - h * 0.5);
  ctx.lineTo(jaw.x - w * 0.09, jaw.y - h * 0.1);
  ctx.moveTo(jaw.x + w * 0.03, jaw.y - h * 0.5);
  ctx.lineTo(jaw.x + w * 0.09, jaw.y - h * 0.1);
  ctx.stroke();

  // Blade: swings about the pivot; open is unmistakably open.
  const openAngle = -Math.PI * 0.42 * (1 - c);
  const len = jaw.x - pivot.x;
  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(openAngle);
  metalRect(ctx, 0, -h * 0.14, len, h * 0.28, "#cfc7d8", "h", h * 0.06, 0.3);
  // Insulated handle at the far end — nobody grips bare metal.
  const hg = ctx.createLinearGradient(len, -h * 0.2, len + w * 0.16, h * 0.2);
  hg.addColorStop(0, "#7d1f1f");
  hg.addColorStop(0.4, "#c04040");
  hg.addColorStop(1, "#5a1414");
  ctx.fillStyle = hg;
  roundRect(ctx, len - w * 0.02, -h * 0.22, w * 0.18, h * 0.44, h * 0.2);
  ctx.fill();
  ctx.restore();
  screwHead(ctx, pivot.x, pivot.y, w * 0.045);

  if (opts.spark && c > 0.05 && c < 0.6) {
    // The arc drawn across a switch as it breaks: brief, blue-white, hot.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const sg = ctx.createRadialGradient(jaw.x, jaw.y - h * 0.3, 0, jaw.x, jaw.y - h * 0.3, w * 0.2);
    sg.addColorStop(0, hexA("#ffffff", 0.9 * opts.spark));
    sg.addColorStop(0.4, hexA("#8fc4ff", 0.5 * opts.spark));
    sg.addColorStop(1, hexA("#3b6fd4", 0));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(jaw.x, jaw.y - h * 0.3, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** A moving-coil panel meter: ammeter or voltmeter, with a mirrored scale. */
export function panelMeter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, theme: ThemeColors,
  frac: number, kind: "A" | "V", opts: { max?: number } = {},
) {
  const dark = isDarkTheme(theme);
  const w = size, h = size * 0.92;
  ctx.save();
  contact(ctx, cx, cy + h * 0.52, w * 1.05, 0.4);

  // Moulded case.
  const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
  g.addColorStop(0, dark ? "#4a4356" : "#e6e1ee");
  g.addColorStop(0.14, dark ? "#332d3d" : "#c2bacf");
  g.addColorStop(0.75, dark ? "#221d2b" : "#8d8499");
  g.addColorStop(1, dark ? "#12101a" : "#5b5468");
  ctx.fillStyle = g;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, w * 0.08);
  ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.35);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.44, cy - h / 2 + 1.4);
  ctx.lineTo(cx + w * 0.44, cy - h / 2 + 1.4);
  ctx.stroke();

  dialFace(ctx, cx, cy - h * 0.06, w * 0.4, frac, theme, {
    unit: kind === "A" ? "A" : "V",
    max: opts.max ?? (kind === "A" ? 1 : 5),
    mirror: true,
    needle: kind === "A" ? (theme.sci["current"] ?? "#b8860b") : "#c9403f",
  });

  // Terminals: red positive, black negative, with knurled nuts.
  for (const [tx, col] of [[cx - w * 0.28, "#c9403f"], [cx + w * 0.28, "#1b1622"]] as const) {
    const ty = cy + h * 0.38;
    metalRect(ctx, tx - w * 0.05, ty - w * 0.05, w * 0.1, w * 0.1, "#c2a153", "v", w * 0.02, 0.3);
    ctx.beginPath();
    ctx.arc(tx, ty, w * 0.055, 0, Math.PI * 2);
    const tg = ctx.createRadialGradient(tx + KEY.x * w * 0.05, ty + KEY.y * w * 0.05, 0, tx, ty, w * 0.055);
    tg.addColorStop(0, shade(col, 0.5));
    tg.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = tg;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * A demonstration circuit board.
 *
 * One series loop — cell, switch, ammeter, lamp, resistor — with a voltmeter
 * connected ACROSS the lamp rather than in the loop, because that distinction
 * is the thing students get wrong: current is measured through, potential
 * difference is measured across.
 */
export function circuitBoard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, theme: ThemeColors,
  opts: {
    t?: number; closed?: number; current?: number;
    ammeter?: number; voltmeter?: number; lamp?: number; ohms?: number;
  } = {},
) {
  const dark = isDarkTheme(theme);
  const t = opts.t ?? 0;
  const closed = clamp01(opts.closed ?? 1);
  const current = (opts.current ?? 1) * closed;
  const P = (u: number, v: number) => ({ x: x + w * u, y: y + h * v });
  ctx.save();
  contact(ctx, x + w / 2, y + h + 4, w * 0.9, 0.5);

  // Substrate: glass-fibre board, with the weave faintly visible in the resin.
  const bg = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  bg.addColorStop(0, dark ? "#14392c" : "#1d5140");
  bg.addColorStop(0.45, dark ? "#0e2b21" : "#164033");
  bg.addColorStop(1, dark ? "#081a14" : "#0d2b22");
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.03);
  ctx.fill();
  ctx.save();
  roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.03);
  ctx.clip();
  ctx.strokeStyle = hexA("#ffffff", 0.03);
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const px = x + (w * i) / 60;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const py = y + (h * i) / 40;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  // A glancing sheen across the lacquered resin.
  const sh = ctx.createLinearGradient(x, y, x + w, y + h);
  sh.addColorStop(0, hexA("#ffffff", 0.1));
  sh.addColorStop(0.3, hexA("#ffffff", 0.02));
  sh.addColorStop(1, hexA("#ffffff", 0.07));
  ctx.fillStyle = sh;
  ctx.fillRect(x, y, w, h);

  // Copper traces with 45-degree bends and tinned pads.
  const traces: Array<Array<[number, number]>> = [
    [[0.06, 0.32], [0.14, 0.32], [0.2, 0.38], [0.32, 0.38]],
    [[0.1, 0.72], [0.22, 0.72], [0.28, 0.66], [0.44, 0.66]],
    [[0.6, 0.12], [0.66, 0.18], [0.66, 0.3], [0.72, 0.36]],
    [[0.86, 0.84], [0.78, 0.84], [0.72, 0.9], [0.56, 0.9]],
  ];
  for (const tr of traces) {
    ctx.beginPath();
    tr.forEach(([u, v], i) => {
      const p = P(u, v);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = hexA("#c98a3a", 0.55);
    ctx.lineWidth = Math.max(2, h * 0.012);
    ctx.stroke();
    ctx.strokeStyle = hexA("#f0c078", 0.4);
    ctx.lineWidth = Math.max(0.8, h * 0.004);
    ctx.stroke();
    for (const [u, v] of [tr[0], tr[tr.length - 1]]) {
      const p = P(u, v);
      const pg = ctx.createRadialGradient(p.x + KEY.x * 3, p.y + KEY.y * 3, 0, p.x, p.y, h * 0.014);
      pg.addColorStop(0, "#ffffff");
      pg.addColorStop(0.5, "#c9c2d4");
      pg.addColorStop(1, "#6d6579");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, h * 0.014, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Mounting holes: plated through, with a bright inner ring.
  for (const [u, v] of [[0.03, 0.05], [0.97, 0.05], [0.03, 0.95], [0.97, 0.95]] as const) {
    const p = P(u, v);
    ctx.beginPath();
    ctx.arc(p.x, p.y, h * 0.022, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0c";
    ctx.fill();
    ctx.strokeStyle = hexA("#d8d2e0", 0.7);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Silkscreen labels.
  ctx.font = `600 ${Math.max(7, h * 0.035)}px ui-monospace, monospace`;
  ctx.fillStyle = hexA("#ffffff", 0.65);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const labels: Array<[number, number, string]> = [
    [0.16, 0.06, "BT1"], [0.44, 0.06, "SW1"], [0.74, 0.05, "A1"],
    [0.79, 0.44, "LP1"], [0.45, 0.78, "R1"], [0.2, 0.7, "C1"], [0.5, 0.4, "V1"],
  ];
  for (const [u, v, s] of labels) {
    const p = P(u, v);
    ctx.fillText(s, p.x, p.y);
  }

  // Wiring: one loop, plus the voltmeter's two leads across the lamp.
  const wireColor = theme.sci["current"] ?? "#b8860b";
  const width = Math.max(4, h * 0.022);
  const loop: Array<Array<{ x: number; y: number }>> = [
    [P(0.27, 0.19), P(0.32, 0.19), P(0.37, 0.2)],
    [P(0.53, 0.2), P(0.6, 0.19), P(0.66, 0.22), P(0.68, 0.3)],
    [P(0.81, 0.32), P(0.9, 0.4), P(0.9, 0.55), P(0.86, 0.62)],
    [P(0.79, 0.76), P(0.79, 0.86), P(0.7, 0.88), P(0.6, 0.88)],
    [P(0.4, 0.88), P(0.3, 0.88), P(0.24, 0.88)],
    [P(0.16, 0.86), P(0.07, 0.86), P(0.05, 0.6), P(0.05, 0.19)],
  ];
  for (const seg of loop) {
    wireHarness(ctx, seg, theme, t, {
      color: wireColor, width, carriers: Math.max(2, Math.round(seg.length * 1.2)), current,
    });
  }
  // Voltmeter leads, in a different colour so they read as a separate circuit.
  wireHarness(ctx, [P(0.44, 0.66), P(0.4, 0.74), P(0.44, 0.86)], theme, t,
    { color: "#5b95e0", width: width * 0.8, carriers: 0 });
  wireHarness(ctx, [P(0.58, 0.62), P(0.68, 0.62), P(0.74, 0.68)], theme, t,
    { color: "#5b95e0", width: width * 0.8, carriers: 0 });

  // Components, drawn over their wires so the joints sit under the parts.
  battery(ctx, x + w * 0.06, y + h * 0.13, w * 0.21, h * 0.13, theme);
  knifeSwitch(ctx, x + w * 0.35, y + h * 0.26, w * 0.19, theme, closed,
    { spark: closed > 0.05 && closed < 0.6 ? 1 : 0 });
  panelMeter(ctx, x + w * 0.745, y + h * 0.22, h * 0.3, theme, clamp01(opts.ammeter ?? current * 0.6), "A", { max: 2 });
  panelMeter(ctx, x + w * 0.51, y + h * 0.55, h * 0.3, theme, clamp01(opts.voltmeter ?? current * 0.5), "V", { max: 6 });
  bulb(ctx, x + w * 0.79, y + h * 0.63, h * 0.09, opts.lamp ?? current, theme);
  resistor(ctx, x + w * 0.5, y + h * 0.88, w * 0.2, theme, opts.ohms ?? 470, { hot: current * 0.4 });
  capacitor(ctx, x + w * 0.2, y + h * 0.88, w * 0.05, h * 0.16, theme, { charge: current * 0.8 });
  ctx.restore();
}
