import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme, labelBox } from "./scene";

/**
 * Organic rendering — cells, organelles, microbes, glassware.
 *
 * The scene kit draws *places*: sky, ground, materials, light. This file draws
 * *living things*, and it exists because a cell drawn as a circle with dots in
 * it teaches a student that a cell is a circle with dots in it. A real cell has
 * a membrane you can see through, a nucleus with visible chromatin, and
 * mitochondria whose folded cristae are the whole reason they work. Those
 * details are not decoration — they are the biology.
 *
 * Everything here is built from layered gradients rather than sprites, so it
 * stays crisp at any zoom, animates per frame, and recolours with the theme.
 */

/* ------------------------------------------------------------------ *
 * Light model
 *
 * One convention, used by every function: light arrives from the upper left.
 * Highlights sit up-left of centre, shadows down-right, rim light opposite the
 * key. Consistency here is what makes separately-drawn organelles read as
 * objects sharing one scene rather than a collage of stickers.
 * ------------------------------------------------------------------ */

const KEY = { x: -0.38, y: -0.42 };

/** Translucent living membrane with subsurface scatter and a wet rim. */
export function membrane(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string,
  opts: { rimStrength?: number; scatter?: number; wobble?: number; t?: number } = {},
) {
  const scatter = opts.scatter ?? 0.85;
  const t = opts.t ?? 0;
  const wob = opts.wobble ?? 0;

  ctx.save();
  // Outer scatter halo: light bleeding through the cell's edge.
  const halo = ctx.createRadialGradient(x, y, r * 0.72, x, y, r * 1.16);
  halo.addColorStop(0, hexA(tint, 0.46 * scatter));
  halo.addColorStop(1, hexA(tint, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.16, 0, Math.PI * 2);
  ctx.fill();

  // The cytoplasm body: dense at the rim, clear through the middle, which is
  // what makes it read as a fluid-filled sac instead of a flat disc.
  blobPath(ctx, x, y, r, wob, t);
  const body = ctx.createRadialGradient(
    x + KEY.x * r * 0.5, y + KEY.y * r * 0.5, r * 0.05, x, y, r,
  );
  body.addColorStop(0, hexA(mix(tint, "#ffffff", 0.55), 0.5));
  body.addColorStop(0.5, hexA(tint, 0.42));
  body.addColorStop(0.86, hexA(tint, 0.66));
  body.addColorStop(1, hexA(mix(tint, "#000000", 0.15), 0.82));
  ctx.fillStyle = body;
  ctx.fill();

  // Bilayer edge — drawn as two strokes because it is two leaflets.
  ctx.lineWidth = Math.max(1.4, r * 0.022);
  ctx.strokeStyle = hexA(tint, 0.85);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.7, r * 0.009);
  ctx.strokeStyle = hexA("#ffffff", 0.4);
  ctx.stroke();

  // Specular: a soft sheen up-left, plus a tight hotspot. Wet things have both.
  const sheen = ctx.createRadialGradient(
    x + KEY.x * r * 0.62, y + KEY.y * r * 0.62, 0,
    x + KEY.x * r * 0.62, y + KEY.y * r * 0.62, r * 0.72,
  );
  sheen.addColorStop(0, hexA("#ffffff", 0.4));
  sheen.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    x + KEY.x * r * 0.66, y + KEY.y * r * 0.7,
    r * 0.2, r * 0.11, -0.7, 0, Math.PI * 2,
  );
  ctx.fillStyle = hexA("#ffffff", 0.5);
  ctx.fill();

  // Rim light opposite the key, the trick that lifts a sphere off its ground.
  if (opts.rimStrength !== 0) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.985, 0.35, 2.05);
    ctx.strokeStyle = hexA("#ffffff", 0.5 * (opts.rimStrength ?? 1));
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.stroke();
  }
  ctx.restore();
}

/** A slightly irregular circle — living things are never perfect circles. */
function blobPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  wobble: number, t: number,
) {
  ctx.beginPath();
  if (wobble <= 0) { ctx.arc(x, y, r, 0, Math.PI * 2); return; }
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + wobble * (Math.sin(a * 3 + t * 0.6) * 0.5 + Math.sin(a * 5 - t * 0.4) * 0.3);
    const px = x + Math.cos(a) * r * k;
    const py = y + Math.sin(a) * r * k;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** The nucleus: envelope, pores, chromatin texture and a dense nucleolus. */
export function nucleus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string, t = 0,
) {
  ctx.save();
  // Body
  const g = ctx.createRadialGradient(
    x + KEY.x * r * 0.45, y + KEY.y * r * 0.45, r * 0.06, x, y, r,
  );
  g.addColorStop(0, mix(tint, "#ffffff", 0.62));
  g.addColorStop(0.55, mix(tint, "#ffffff", 0.18));
  g.addColorStop(1, mix(tint, "#000000", 0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Chromatin: coiled threads, not noise. Deterministic from position so it
  // does not swim between frames.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = mix(tint, "#ffffff", 0.5);
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.lineCap = "round";
  for (let i = 0; i < 11; i++) {
    const seed = i * 2.399;
    ctx.beginPath();
    for (let s = 0; s <= 12; s++) {
      const a = seed + s * 0.42 + Math.sin(t * 0.25 + i) * 0.05;
      const rad = r * (0.18 + 0.62 * ((i * 7 + s * 3) % 10) / 10);
      const px = x + Math.cos(a) * rad * 0.8;
      const py = y + Math.sin(a * 1.3) * rad * 0.8;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Nucleolus — the dense dark body a student can actually point at.
  const nx = x + r * 0.16, ny = y + r * 0.1;
  const ng = ctx.createRadialGradient(
    nx + KEY.x * r * 0.16, ny + KEY.y * r * 0.16, 0, nx, ny, r * 0.34,
  );
  ng.addColorStop(0, mix(tint, "#ffffff", 0.34));
  ng.addColorStop(0.5, mix(tint, "#000000", 0.12));
  ng.addColorStop(1, mix(tint, "#000000", 0.34));
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(nx, ny, r * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Envelope: double membrane with visible pores.
  ctx.strokeStyle = mix(tint, "#000000", 0.28);
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.3);
  ctx.lineWidth = Math.max(0.6, r * 0.018);
  ctx.beginPath(); ctx.arc(x, y, r * 0.955, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1, r * 0.055), 0, Math.PI * 2);
    ctx.fillStyle = mix(tint, "#ffffff", 0.3);
    ctx.fill();
  }

  // Specular
  ctx.beginPath();
  ctx.ellipse(x + KEY.x * r * 0.6, y + KEY.y * r * 0.62, r * 0.24, r * 0.14, -0.7, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.3);
  ctx.fill();
  ctx.restore();
}

/**
 * A mitochondrion, drawn with its cristae.
 *
 * The folded inner membrane is not a stylistic flourish: the folding is what
 * creates the surface area that makes the organelle the cell's power plant, so
 * a mitochondrion drawn as a plain bean has had its explanation removed.
 */
export function mitochondrion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, angle: number, tint: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Outer membrane
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mix(tint, "#ffffff", 0.45));
  g.addColorStop(0.5, tint);
  g.addColorStop(1, mix(tint, "#000000", 0.32));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = mix(tint, "#000000", 0.42);
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.stroke();

  // Cristae — folds reaching in from alternating walls.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2 - h * 0.09, h / 2 - h * 0.09, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = mix(tint, "#ffffff", 0.35);
  ctx.lineWidth = Math.max(1, h * 0.1);
  ctx.lineCap = "round";
  const folds = Math.max(4, Math.round(w / (h * 0.42)));
  for (let i = 0; i < folds; i++) {
    const fx = -w / 2 + (w / folds) * (i + 0.5);
    const up = i % 2 === 0;
    ctx.beginPath();
    ctx.moveTo(fx, up ? -h / 2 : h / 2);
    ctx.quadraticCurveTo(fx + h * 0.18, 0, fx, up ? h * 0.2 : -h * 0.2);
    ctx.stroke();
  }
  ctx.restore();

  // Sheen
  ctx.beginPath();
  ctx.ellipse(-w * 0.16, -h * 0.24, w * 0.2, h * 0.13, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.4);
  ctx.fill();
  ctx.restore();
}

/** Stacked, folded membrane sheets — rough ER when studded, smooth when not. */
export function reticulum(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, tint: string,
  opts: { studded?: boolean; sheets?: number; angle?: number } = {},
) {
  const sheets = opts.sheets ?? 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(opts.angle ?? 0);
  ctx.lineCap = "round";
  for (let i = 0; i < sheets; i++) {
    const t = i / (sheets - 1 || 1);
    const yy = -h / 2 + h * t;
    const amp = h * 0.1 * (1 - Math.abs(t - 0.5));
    ctx.beginPath();
    for (let s = 0; s <= 30; s++) {
      const px = -w / 2 + (w * s) / 30;
      const py = yy + Math.sin((s / 30) * Math.PI * 2.4 + i * 0.7) * amp;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = mix(tint, i % 2 ? "#000000" : "#ffffff", 0.22);
    ctx.lineWidth = Math.max(1.6, h * 0.055);
    ctx.stroke();

    if (opts.studded) {
      // Ribosomes riding the membrane, which is what makes it "rough".
      for (let s = 2; s < 30; s += 3) {
        const px = -w / 2 + (w * s) / 30;
        const py = yy + Math.sin((s / 30) * Math.PI * 2.4 + i * 0.7) * amp;
        ctx.beginPath();
        ctx.arc(px, py - h * 0.035, Math.max(0.9, h * 0.026), 0, Math.PI * 2);
        ctx.fillStyle = mix(tint, "#000000", 0.45);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** Chloroplast with stacked thylakoid grana. */
export function chloroplast(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, angle: number, tint: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mix(tint, "#ffffff", 0.42));
  g.addColorStop(1, mix(tint, "#000000", 0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = mix(tint, "#000000", 0.4);
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2 - h * 0.1, h / 2 - h * 0.1, 0, 0, Math.PI * 2);
  ctx.clip();
  // Grana: short stacks of discs, the sites that actually catch the light.
  const stacks = 3;
  for (let i = 0; i < stacks; i++) {
    const sx = -w * 0.24 + (w * 0.48 * i) / (stacks - 1 || 1);
    for (let d = 0; d < 4; d++) {
      ctx.beginPath();
      ctx.ellipse(sx, -h * 0.14 + d * h * 0.095, w * 0.1, h * 0.045, 0, 0, Math.PI * 2);
      ctx.fillStyle = mix(tint, "#000000", 0.34);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(-w * 0.15, -h * 0.24, w * 0.18, h * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.36);
  ctx.fill();
  ctx.restore();
}

/** A small lit vesicle or ribosome cluster. */
export function organelleDot(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tint: string,
) {
  const g = ctx.createRadialGradient(x + KEY.x * r, y + KEY.y * r, 0, x, y, r);
  g.addColorStop(0, mix(tint, "#ffffff", 0.6));
  g.addColorStop(0.55, tint);
  g.addColorStop(1, mix(tint, "#000000", 0.35));
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Golgi: stacked curved cisternae with budding vesicles. */
export function golgi(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, tint: string, angle = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const yy = -h / 2 + h * t;
    const ww = w * (1 - 0.16 * Math.abs(t - 0.5) * 2);
    ctx.beginPath();
    ctx.moveTo(-ww / 2, yy);
    ctx.quadraticCurveTo(0, yy - h * 0.16, ww / 2, yy);
    ctx.strokeStyle = mix(tint, i % 2 ? "#000000" : "#ffffff", 0.2);
    ctx.lineWidth = Math.max(1.8, h * 0.08);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    organelleDot(ctx, w * 0.36 + i * w * 0.09, h * 0.3 - i * h * 0.12,
      Math.max(1.4, h * 0.05), tint);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Microbes
 * ------------------------------------------------------------------ */

/** A virus particle: icosahedral capsid with spike proteins. */
export function virus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string, t = 0,
) {
  ctx.save();
  const spikes = 14;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + t * 0.08;
    const bx = x + Math.cos(a) * r * 0.92, by = y + Math.sin(a) * r * 0.92;
    const tx = x + Math.cos(a) * r * 1.3, ty = y + Math.sin(a) * r * 1.3;
    ctx.strokeStyle = mix(tint, "#000000", 0.15);
    ctx.lineWidth = Math.max(1.2, r * 0.075);
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    organelleDot(ctx, tx, ty, Math.max(1.5, r * 0.13), mix(tint, "#ffffff", 0.2));
  }
  const g = ctx.createRadialGradient(x + KEY.x * r * 0.5, y + KEY.y * r * 0.5, r * 0.05, x, y, r);
  g.addColorStop(0, mix(tint, "#ffffff", 0.5));
  g.addColorStop(0.6, tint);
  g.addColorStop(1, mix(tint, "#000000", 0.4));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Faceting hints at the capsid's protein geometry.
  ctx.strokeStyle = hexA("#ffffff", 0.22);
  ctx.lineWidth = Math.max(0.6, r * 0.03);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
    ctx.lineTo(x + Math.cos(a + 2.5) * r * 0.9, y + Math.sin(a + 2.5) * r * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

/** A rod bacterium with flagella. */
export function bacterium(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, len: number, thick: number, angle: number, tint: string, t = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Flagella whipping behind it
  ctx.strokeStyle = hexA(tint, 0.75);
  ctx.lineWidth = Math.max(0.9, thick * 0.1);
  ctx.lineCap = "round";
  for (let f = -1; f <= 1; f++) {
    ctx.beginPath();
    for (let s = 0; s <= 20; s++) {
      const p = s / 20;
      const px = -len / 2 - p * len * 0.75;
      const py = f * thick * 0.22 + Math.sin(p * 7 - t * 5 + f) * thick * 0.3 * p;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -thick / 2, 0, thick / 2);
  g.addColorStop(0, mix(tint, "#ffffff", 0.5));
  g.addColorStop(0.55, tint);
  g.addColorStop(1, mix(tint, "#000000", 0.35));
  ctx.fillStyle = g;
  roundedCapsule(ctx, len, thick);
  ctx.fill();
  ctx.strokeStyle = mix(tint, "#000000", 0.4);
  ctx.lineWidth = Math.max(0.8, thick * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-len * 0.14, -thick * 0.22, len * 0.2, thick * 0.13, 0, 0, Math.PI * 2);
  ctx.fillStyle = hexA("#ffffff", 0.42);
  ctx.fill();
  ctx.restore();
}

function roundedCapsule(ctx: CanvasRenderingContext2D, len: number, thick: number) {
  const r = thick / 2, half = len / 2 - r;
  ctx.beginPath();
  ctx.moveTo(-half, -r);
  ctx.lineTo(half, -r);
  ctx.arc(half, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-half, r);
  ctx.arc(-half, 0, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
}

/* ------------------------------------------------------------------ *
 * Laboratory glass
 * ------------------------------------------------------------------ */

/**
 * A specimen jar: glass cylinder, metal collar and base, with the reflections
 * that make glass read as glass. `draw` renders the contents, clipped inside.
 */
export function specimenJar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors,
  label: string | undefined,
  draw: (cx: number, cy: number, cw: number, ch: number) => void,
) {
  const dark = isDarkTheme(theme);
  const collar = h * 0.085;
  const glassTop = y + collar;
  const glassH = h - collar * 2;

  ctx.save();
  // Contents, clipped to the glass interior.
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x + 3, glassTop + 3, w - 6, glassH - 6, w * 0.07);
  ctx.clip();
  const inner = ctx.createLinearGradient(0, glassTop, 0, glassTop + glassH);
  inner.addColorStop(0, dark ? "#171021" : "#faf7fc");
  inner.addColorStop(1, dark ? "#0e0a14" : "#efe8f5");
  ctx.fillStyle = inner;
  ctx.fillRect(x, glassTop, w, glassH);
  draw(x + 3, glassTop + 3, w - 6, glassH - 6);
  ctx.restore();

  // Glass body tint and edge
  ctx.beginPath();
  roundRectPath(ctx, x, glassTop, w, glassH, w * 0.07);
  const tint = ctx.createLinearGradient(x, 0, x + w, 0);
  tint.addColorStop(0, hexA("#ffffff", dark ? 0.1 : 0.34));
  tint.addColorStop(0.16, hexA("#ffffff", 0.04));
  tint.addColorStop(0.84, hexA("#ffffff", 0.04));
  tint.addColorStop(1, hexA("#ffffff", dark ? 0.08 : 0.22));
  ctx.fillStyle = tint;
  ctx.fill();
  ctx.strokeStyle = hexA(theme.accent, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The two vertical highlights that say "cylinder" rather than "box".
  ctx.fillStyle = hexA("#ffffff", 0.55);
  ctx.fillRect(x + w * 0.1, glassTop + glassH * 0.05, w * 0.035, glassH * 0.9);
  ctx.fillStyle = hexA("#ffffff", 0.25);
  ctx.fillRect(x + w * 0.86, glassTop + glassH * 0.12, w * 0.02, glassH * 0.76);

  // Collar and base
  for (const cy of [y, y + h - collar]) {
    const mg = ctx.createLinearGradient(0, cy, 0, cy + collar);
    mg.addColorStop(0, dark ? "#3a3346" : "#4a4356");
    mg.addColorStop(0.45, dark ? "#221d2b" : "#2b2634");
    mg.addColorStop(1, dark ? "#151119" : "#1d1922");
    ctx.fillStyle = mg;
    ctx.beginPath();
    roundRectPath(ctx, x - w * 0.03, cy, w * 1.06, collar, collar * 0.4);
    ctx.fill();
  }
  // A lit ring on the collar, as in a real instrument.
  ctx.strokeStyle = hexA(theme.accent, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.01, y + collar * 0.72);
  ctx.lineTo(x + w * 1.01, y + collar * 0.72);
  ctx.stroke();

  if (label) {
    ctx.font = `700 ${Math.max(10, w * 0.1)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + w / 2, y + collar * 0.5);
  }
  ctx.restore();
}

/** A magnifier: glass lens, bright rim, handle. `draw` fills the lens. */
export function magnifier(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, angle: number, theme: ThemeColors,
  draw?: (cx: number, cy: number, cr: number) => void,
) {
  ctx.save();
  // Handle
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const hg = ctx.createLinearGradient(0, -r * 0.16, 0, r * 0.16);
  hg.addColorStop(0, mix(theme.accent, "#ffffff", 0.4));
  hg.addColorStop(0.5, theme.accent);
  hg.addColorStop(1, mix(theme.accent, "#000000", 0.4));
  ctx.fillStyle = hg;
  ctx.beginPath();
  roundRectPath(ctx, r * 0.92, -r * 0.15, r * 1.15, r * 0.3, r * 0.15);
  ctx.fill();
  ctx.restore();

  if (draw) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    ctx.clip();
    draw(x, y, r * 0.88);
    ctx.restore();
  }

  // Lens glass
  const lg = ctx.createRadialGradient(x + KEY.x * r * 0.6, y + KEY.y * r * 0.6, 0, x, y, r * 0.88);
  lg.addColorStop(0, hexA("#ffffff", 0.34));
  lg.addColorStop(0.62, hexA("#ffffff", 0.06));
  lg.addColorStop(1, hexA(theme.accent, 0.16));
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  // A curved streak reads instantly as a lens.
  ctx.strokeStyle = hexA("#ffffff", 0.6);
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.06, Math.PI * 1.42);
  ctx.stroke();

  // Rim
  const rimG = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  rimG.addColorStop(0, mix(theme.accent, "#ffffff", 0.5));
  rimG.addColorStop(0.5, theme.accent);
  rimG.addColorStop(1, mix(theme.accent, "#000000", 0.45));
  ctx.strokeStyle = rimG;
  ctx.lineWidth = r * 0.15;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Annotation
 * ------------------------------------------------------------------ */

/**
 * A callout: a dot on the thing, a leader line, and a pill holding the name.
 * Labels sit clear of the artwork instead of on top of it, which is the
 * difference between a diagram and a mess.
 */
export function callout(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number, toX: number, toY: number,
  text: string, theme: ThemeColors,
  opts: { sub?: string; side?: "left" | "right"; accent?: string; maxWidth?: number } = {},
) {
  const accent = opts.accent ?? theme.accent;
  const side = opts.side ?? (toX < fromX ? "left" : "right");
  ctx.save();

  // Anchor dot on the subject
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(fromX, fromY, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.85);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Pill.
  //
  // The note under a label is a sentence, and a pill sized to hold a whole
  // sentence on one line is as wide as the stage — it stops being a label and
  // becomes a banner across the artwork. So it is capped and wrapped.
  const cap = Math.max(140, opts.maxWidth ?? 260);
  ctx.font = '700 13px "Bricolage Grotesque", system-ui, sans-serif';
  const tw = Math.min(ctx.measureText(text).width, cap);
  const subLines: string[] = [];
  if (opts.sub) {
    ctx.font = '500 11px "Source Sans 3", system-ui, sans-serif';
    let line = "";
    let cut = false;
    const words = opts.sub.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > cap && line) {
        subLines.push(line);
        line = words[i];
        if (subLines.length === 3) { cut = true; line = ""; break; }
      } else line = test;
    }
    if (line) subLines.push(line);
    if (cut && subLines.length) {
      let last = subLines[subLines.length - 1];
      while (last.length > 1 && ctx.measureText(`${last} …`).width > cap) {
        last = last.replace(/\s*\S+$/, "");
      }
      subLines[subLines.length - 1] = `${last} …`;
    }
  }
  const sw = subLines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
  const pw = Math.min(cap, Math.max(tw, sw)) + 22;
  const ph = subLines.length ? 22 + subLines.length * 14 : 27;
  const px = side === "left" ? toX - pw : toX;
  // Claim the pill's rectangle so a second callout is nudged clear instead of
  // being drawn on top of this one.
  const slot = labelBox(ctx, px, toY - ph / 2, pw, ph);
  const py = slot.y;

  // Elbow leader, drawn after the pill has claimed its slot so it points at
  // where the pill actually ended up rather than where it was requested.
  const midX = side === "left" ? toX + 14 : toX - 14;
  ctx.strokeStyle = hexA(accent, 0.8);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(midX, fromY);
  ctx.lineTo(midX, py + ph / 2);
  ctx.lineTo(side === "left" ? toX + 4 : toX - 4, py + ph / 2);
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  const pg = ctx.createLinearGradient(0, py, 0, py + ph);
  pg.addColorStop(0, mix(accent, "#ffffff", 0.1));
  pg.addColorStop(1, mix(accent, "#000000", 0.22));
  ctx.fillStyle = pg;
  ctx.beginPath();
  roundRectPath(ctx, px, py, pw, ph, ph / 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 13px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.fillText(text, px + pw / 2, py + (subLines.length ? 15 : ph / 2));
  if (subLines.length) {
    ctx.font = '500 11px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = hexA("#ffffff", 0.82);
    subLines.forEach((l, i) => ctx.fillText(l, px + pw / 2, py + 30 + i * 14));
  }
  ctx.restore();
}

/** A soft depth wash behind a subject, so the background falls away. */
export function depthWash(
  ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.52, Math.max(w, h) * 0.78);
  // A bright lilac ground. Specimens are violet, so the backdrop must stay light
  // and clean or the whole scene turns to mud.
  g.addColorStop(0, dark ? "#2a1c38" : "#ffffff");
  g.addColorStop(0.5, dark ? "#1d1228" : "#f7f1fd");
  g.addColorStop(1, dark ? "#100a18" : "#e6d8f5");
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Out-of-focus bokeh motes — depth of field without a blur filter. */
export function bokeh(
  ctx: CanvasRenderingContext2D, w: number, h: number, tint: string, count = 14, seed = 7,
) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h, r = 8 + rnd() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(tint, 0.1));
    g.addColorStop(0.7, hexA(tint, 0.035));
    g.addColorStop(1, hexA(tint, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
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
