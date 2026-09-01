import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Geology — rock, crust, mantle and landform rendering.
 *
 * `organic.ts` draws living things and `labware.ts` draws apparatus. This file
 * draws the Earth, and it exists because the usual classroom picture of the
 * planet is a stack of flat coloured rectangles with the word MANTLE written
 * across one of them. A student reads that as a label, not a place.
 *
 * Real rock has grain you can see, contacts that wander because sediment
 * settles on an uneven floor, and colour that comes from what the rock is made
 * of. The mantle is not a beige stripe: it is hot enough to flow, and that heat
 * is the engine behind every other thing in the topic — spreading ridges,
 * subduction, volcanoes, earthquakes. So it is drawn glowing. Everything a
 * student is asked to explain should be visible in the picture they are
 * explaining it from.
 *
 * Everything is built from layered gradients rather than sprites, so it stays
 * crisp at any zoom, animates per frame, and recolours with the theme.
 */

/* ------------------------------------------------------------------ *
 * Light model
 *
 * One convention, shared with `organic.ts`, `labware.ts` and the scene kit:
 * light arrives from the upper left. Cliff faces are lit on their left, the
 * shaded flank of a cone is on its right, block faces that turn away from the
 * key go darker. Consistency here is what makes a volcano, a rock sample and a
 * strata column drawn by three different call sites read as one scene.
 * ------------------------------------------------------------------ */

const KEY = { x: -0.38, y: -0.42 };
const TAU = Math.PI * 2;

/**
 * Rock shades toward warm brown-black, never neutral grey. Real rock is iron
 * and silicate, and a grey shadow drains a cliff of the colour that tells a
 * student what it is made of.
 */
const ROCK_SHADE = "#2b1508";
const ROCK_LIGHT = "#fff3e2";

/* ------------------------------------------------------------------ *
 * Palette
 *
 * Rock colour is a property of the rock, not of the interface, so basalt stays
 * dark and granite stays warm in both themes. What the theme changes is how
 * much light is in the air around it: sky, water and ambient bounce.
 * ------------------------------------------------------------------ */

export interface GeoPalette {
  dark: boolean;
  /** Oceanic crust — basalt, dark and blue-violet. */
  oceanic: string;
  /** Continental crust — granite, warm and pale. */
  continental: string;
  /** Loose sediment lying on the crust. */
  sediment: string;
  /** Rigid mantle below the crust: the rest of the plate. Peridotite olive. */
  lithoMantle: string;
  /** Thermal ramp through the convecting mantle, shallow to deep. */
  mantle: [string, string, string, string, string];
  /** Molten rock, from crust to the incandescent core of a lava lake. */
  magma: string;
  magmaCore: string;
  /** A subducting slab stays cold for millions of years — that is why it sinks. */
  slabCold: string;
  water: string;
  waterDeep: string;
  sky: string;
  skyLow: string;
  vegetation: string;
  ink: string;
}

export function geoPalette(theme: ThemeColors): GeoPalette {
  const dark = isDarkTheme(theme);
  const hot = theme.sci["hot"] ?? "#cf4b25";
  const cold = theme.sci["cold"] ?? "#3b7fc9";
  const liquid = theme.sci["liquid"] ?? "#2f8f9b";
  // A touch of the theme's own heat colour runs through the mantle ramp so the
  // Earth's interior belongs to the same palette as every thermometer in the app.
  const heat = (c: string) => mix(c, hot, 0.2);
  return {
    dark,
    oceanic: dark ? "#414a6d" : "#3a4160",
    continental: dark ? "#cf9464" : "#c78a5c",
    sediment: dark ? "#e6c383" : "#dfb974",
    lithoMantle: dark ? "#5d6640" : "#525a38",
    mantle: [
      heat("#4a1208"), heat("#93230e"), heat("#dd5713"),
      heat("#ff9f27"), heat("#ffd863"),
    ],
    magma: mix(hot, "#ff8a1e", 0.5),
    magmaCore: "#fff3b8",
    slabCold: mix(cold, "#2f3a52", 0.55),
    water: mix(liquid, "#4fb9ea", 0.5),
    waterDeep: dark ? "#07223c" : "#0b2c4c",
    sky: dark ? "#141f36" : "#cfe7fb",
    skyLow: dark ? "#2b3f61" : "#9fd2f2",
    vegetation: dark ? "#4f9a45" : "#4e9a3d",
    ink: theme.ink,
  };
}

/* ------------------------------------------------------------------ *
 * 1. Strata
 * ------------------------------------------------------------------ */

export interface StrataLayer {
  name: string;
  color: string;
  /** Share of the column's height. Normalised against the other layers. */
  thicknessFrac: number;
  /** How many index fossils to embed in this bed. */
  fossils?: number;
}

export interface StrataOpts {
  /** Changes every wobble, grain and fossil position. Same seed, same rock. */
  seed?: number;
  /** Write each bed's name across it. */
  labels?: boolean;
  /** Depth of the block's right-hand face, as a fraction of w. 0 draws flat. */
  depth?: number;
  /** Bedding tilt in radians, about the block's centre. */
  tilt?: number;
}

/**
 * A stack of sedimentary beds, drawn as a block of rock rather than a bar chart.
 *
 * Younger on top: `layers[0]` is the youngest bed, which is the law of
 * superposition made structural rather than stated.
 */
export function strataColumn(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  layers: StrataLayer[],
  opts: StrataOpts = {},
) {
  const n = layers.length;
  if (n === 0 || w <= 0 || h <= 0) return;
  const seed = opts.seed ?? 17;
  const depth = Math.max(0, Math.min(0.4, opts.depth ?? 0.13)) * w;
  const dy = depth * 0.52;
  // The block is drawn from front-left-above: the top face rises by dy and the
  // right face runs out by `depth`, and the whole solid still fits the box it
  // was given.
  const fx = x, fy = y + dy, fw = w - depth, fh = h - dy;

  const total = layers.reduce((s, l) => s + Math.max(0, l.thicknessFrac), 0) || 1;
  const edge: number[] = [fy];
  for (const l of layers) {
    edge.push(edge[edge.length - 1] + (fh * Math.max(0, l.thicknessFrac)) / total);
  }
  edge[n] = fy + fh;

  /**
   * A contact between two beds is never a ruled line. Sediment settles on an
   * uneven floor, currents scour it, and compaction squeezes it unevenly, so
   * the surface a bed leaves behind undulates. A ruled boundary quietly teaches
   * that layers are drawn rather than deposited, so every interior contact here
   * carries its own wobble — and the top and bottom of the block do not,
   * because those are saw cuts through the rock, not contacts.
   */
  const wob = (i: number, u: number) => {
    if (i <= 0 || i >= n) return 0;
    return (noise1(u * 3.4 + i * 5.7, seed + i) * 0.72
      + noise1(u * 9.6 + i * 2.3, seed + i * 13) * 0.28) * fh * 0.018;
  };
  const topAt = (i: number, u: number) => edge[i] + wob(i, u);

  /** Coarseness, fixed by the bed's name so a formation always looks itself. */
  const grit = (i: number) => hash21(i * 3 + 1, seed + charSum(layers[i].name));
  /**
   * Soft, fine-grained beds weather back and hard coarse ones stand proud,
   * which is why a real cliff has a stepped profile instead of a flat wall.
   */
  const inset = (i: number) => (1 - grit(i)) * fw * 0.032;

  ctx.save();
  if (opts.tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(opts.tilt);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // Recessed beds leave notches in the block's corner, so the whole right-hand
  // face is backed with shadow first: a notch then reads as depth, not a hole.
  let maxIns = 0;
  for (let i = 0; i < n; i++) maxIns = Math.max(maxIns, inset(i));
  ctx.beginPath();
  ctx.moveTo(fx + fw - maxIns, fy);
  ctx.lineTo(fx + fw - maxIns + depth, fy - dy);
  ctx.lineTo(fx + fw - maxIns + depth, fy + fh - dy);
  ctx.lineTo(fx + fw - maxIns, fy + fh);
  ctx.closePath();
  ctx.fillStyle = mix(layers[Math.floor(n / 2)].color, ROCK_SHADE, 0.78);
  ctx.fill();

  // --- right-hand face: the block's third dimension, turned away from the key
  for (let i = 0; i < n; i++) {
    const xr = fx + fw - inset(i);
    ctx.beginPath();
    ctx.moveTo(xr, topAt(i, 1));
    ctx.lineTo(xr + depth, topAt(i, 1) - dy);
    ctx.lineTo(xr + depth, topAt(i + 1, 1) - dy);
    ctx.lineTo(xr, topAt(i + 1, 1));
    ctx.closePath();
    const g = ctx.createLinearGradient(xr, 0, xr + depth, 0);
    g.addColorStop(0, mix(layers[i].color, ROCK_SHADE, 0.3));
    g.addColorStop(1, mix(layers[i].color, ROCK_SHADE, 0.56));
    ctx.fillStyle = g;
    ctx.fill();
    // Grain carries round the corner, so the two faces belong to one block.
    for (let k = 0; k < 26; k++) {
      const a = hash21(k * 1.7, i + seed), b = hash21(k * 2.9, i * 5 + seed);
      const px = xr + depth * (0.06 + 0.88 * a);
      const py = topAt(i, 1) - dy * (0.06 + 0.88 * a)
        + (topAt(i + 1, 1) - topAt(i, 1)) * b;
      ctx.fillStyle = hexA(k % 3 === 0 ? ROCK_LIGHT : ROCK_SHADE, 0.1);
      ctx.beginPath();
      ctx.arc(px, py, 0.5 + grit(i) * 1.6, 0, TAU);
      ctx.fill();
    }
  }

  // --- top face: the cut across the youngest bed, square to the key light
  const t0 = fx + fw - inset(0);
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + depth, fy - dy);
  ctx.lineTo(t0 + depth, fy - dy);
  ctx.lineTo(t0, fy);
  ctx.closePath();
  const tg = ctx.createLinearGradient(fx, fy, t0 + depth, fy - dy);
  tg.addColorStop(0, mix(layers[0].color, ROCK_LIGHT, 0.58));
  tg.addColorStop(1, mix(layers[0].color, ROCK_LIGHT, 0.3));
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let k = 0; k < 70; k++) {
    const a = hash21(k * 1.31, seed), b = hash21(k * 2.17, seed + 3);
    ctx.fillStyle = hexA(k % 2 ? ROCK_SHADE : ROCK_LIGHT, 0.12);
    ctx.beginPath();
    ctx.arc(fx + depth * b + (fw - inset(0)) * a, fy - dy * b + dy * 0.0,
      0.6 + grit(0) * 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // --- front face, bed by bed
  for (let i = 0; i < n; i++) {
    const L = layers[i];
    const ins = inset(i);
    const g = grit(i);
    const bandPath = () => {
      ctx.beginPath();
      const N = 44;
      for (let s = 0; s <= N; s++) {
        const u = s / N;
        const px = fx + ins + (fw - ins * 2) * u;
        if (s === 0) ctx.moveTo(px, topAt(i, u)); else ctx.lineTo(px, topAt(i, u));
      }
      for (let s = N; s >= 0; s--) {
        const u = s / N;
        ctx.lineTo(fx + ins + (fw - ins * 2) * u, topAt(i + 1, u));
      }
      ctx.closePath();
    };

    bandPath();
    const bh = Math.max(1, edge[i + 1] - edge[i]);
    const bg = ctx.createLinearGradient(0, edge[i], 0, edge[i + 1]);
    bg.addColorStop(0, mix(L.color, ROCK_LIGHT, 0.26));
    bg.addColorStop(0.16, mix(L.color, ROCK_LIGHT, 0.05));
    bg.addColorStop(0.72, L.color);
    bg.addColorStop(1, mix(L.color, ROCK_SHADE, 0.34));
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    bandPath();
    ctx.clip();

    // Lamination: the fine internal partings of a bed. A bed is not a solid
    // slab of colour — it is hundreds of separate settling events.
    const lam = Math.max(2, Math.round(bh / 9));
    for (let j = 1; j < lam; j++) {
      const f = j / lam;
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) {
        const u = s / 24;
        const py = topAt(i, u) + (topAt(i + 1, u) - topAt(i, u)) * f
          + noise1(u * 5 + j * 3.3, seed + i * 7 + j) * bh * 0.03;
        const px = fx + ins + (fw - ins * 2) * u;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hexA(j % 2 ? ROCK_SHADE : ROCK_LIGHT, 0.09 + 0.06 * g);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Cross-bedding: in a coarse bed the laminae are inclined, because they are
    // the downstream faces of migrating sand dunes. Seeing the tilt is how a
    // student reads a current direction out of solid rock.
    if (g > 0.58 && bh > 14) {
      const sets = Math.max(1, Math.round(fw / 90));
      for (let s = 0; s < sets; s++) {
        const sx = fx + ins + ((fw - ins * 2) / sets) * s;
        const sw = (fw - ins * 2) / sets;
        for (let k = 0; k < 7; k++) {
          const p = k / 7;
          ctx.beginPath();
          ctx.moveTo(sx + sw * (0.06 + p * 0.9), edge[i] + bh * 0.12);
          ctx.quadraticCurveTo(
            sx + sw * (0.4 + p * 0.7), edge[i] + bh * 0.72,
            sx + sw * (0.1 + p * 0.7), edge[i + 1] - bh * 0.06,
          );
          ctx.strokeStyle = hexA(ROCK_SHADE, 0.16);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Grain. Density and size follow the bed's coarseness, so a sandstone reads
    // gritty and a mudstone reads smooth from across the room.
    const area = (fw - ins * 2) * bh;
    const count = Math.min(460, Math.max(20, Math.round(area / (30 - g * 20))));
    for (let k = 0; k < count; k++) {
      const a = hash21(k * 1.37 + i * 11, seed + i);
      const b = hash21(k * 2.71 + i * 7, seed + i + 91);
      const px = fx + ins + (fw - ins * 2) * a;
      const py = edge[i] + bh * b;
      const rr = (0.45 + g * 2.1) * (0.5 + hash21(k, i * 3));
      ctx.fillStyle = hexA(k % 3 === 0 ? ROCK_LIGHT : ROCK_SHADE,
        0.05 + 0.12 * hash21(k + 5, i));
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, TAU);
      ctx.fill();
    }

    // A very coarse bed carries pebbles: a conglomerate, and visibly one.
    if (g > 0.8 && bh > 12) {
      const pebbles = Math.max(3, Math.round(fw / 42));
      for (let k = 0; k < pebbles; k++) {
        const px = fx + ins + (fw - ins * 2) * hash21(k * 3.1, i + seed);
        const py = edge[i] + bh * (0.2 + 0.6 * hash21(k * 5.7, i + seed + 4));
        const pr = bh * (0.1 + 0.14 * hash21(k * 7.3, i));
        const pc = mix(L.color, hash21(k, i) > 0.5 ? ROCK_LIGHT : ROCK_SHADE, 0.36);
        const pg = ctx.createRadialGradient(
          px + KEY.x * pr, py + KEY.y * pr, 0, px, py, pr,
        );
        pg.addColorStop(0, mix(pc, ROCK_LIGHT, 0.45));
        pg.addColorStop(1, mix(pc, ROCK_SHADE, 0.4));
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 1.25, pr, hash21(k, i) * 2, 0, TAU);
        ctx.fill();
      }
    }

    // Index fossils. One shape per bed, because that is the whole point of an
    // index fossil: find that species and you know which bed you are standing on.
    const nf = Math.max(0, Math.round(L.fossils ?? 0));
    if (nf > 0 && bh > 9) {
      const kind = FOSSILS[charSum(L.name) % FOSSILS.length];
      for (let k = 0; k < nf; k++) {
        const px = fx + ins + (fw - ins * 2) * (0.12 + 0.76 * hash21(k * 4.7 + i, seed + 31));
        const py = edge[i] + bh * (0.28 + 0.46 * hash21(k * 8.3 + i, seed + 57));
        const fs = Math.min(bh * 0.34, fw * 0.06) * (0.8 + 0.4 * hash21(k, i));
        fossilMark(ctx, px, py, fs, kind, L.color,
          (hash21(k * 2, i + 9) - 0.5) * 0.9);
      }
    }
    ctx.restore();

    // The contact itself: a dark line where the beds meet, with the lit upper
    // edge of the bed below sitting just under it. That pair of lines is what
    // makes the stack read as physical steps rather than printed colour.
    ctx.beginPath();
    for (let s = 0; s <= 44; s++) {
      const u = s / 44;
      const px = fx + ins + (fw - ins * 2) * u;
      if (s === 0) ctx.moveTo(px, topAt(i, u)); else ctx.lineTo(px, topAt(i, u));
    }
    ctx.strokeStyle = hexA(ROCK_SHADE, i === 0 ? 0.3 : 0.45);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (i > 0) {
      ctx.save();
      ctx.translate(0, 1.6);
      ctx.strokeStyle = hexA(ROCK_LIGHT, 0.3);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Joints: cliffs are cut by open fractures that run across the whole face.
  const joints = Math.max(1, Math.round(fw / 130));
  for (let j = 0; j < joints; j++) {
    const jx = fx + fw * (0.18 + 0.66 * hash21(j * 9.1, seed + 5));
    ctx.beginPath();
    for (let s = 0; s <= 16; s++) {
      const p = s / 16;
      const px = jx + noise1(p * 4 + j * 3, seed + j) * fw * 0.02;
      const py = fy + fh * p;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.24);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(1.4, 0);
    ctx.strokeStyle = hexA(ROCK_LIGHT, 0.16);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Edge light down the left, where the key catches the corner of the block.
  ctx.beginPath();
  ctx.moveTo(fx + inset(0), fy);
  ctx.lineTo(fx + inset(n - 1), fy + fh);
  ctx.strokeStyle = hexA(ROCK_LIGHT, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();

  if (opts.labels) {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const bh = edge[i + 1] - edge[i];
      if (bh < 13) continue;
      const size = Math.max(9, Math.min(13, bh * 0.42));
      ctx.font = `700 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
      const ly = (edge[i] + edge[i + 1]) / 2;
      const lx = fx + inset(i) + 8;
      const tw = ctx.measureText(layers[i].name).width;
      // A plate under the name: bed colours run from cream to dark red, and
      // plain white type is unreadable on half of them.
      ctx.beginPath();
      roundRectPath(ctx, lx - 5, ly - size * 0.78, tw + 10, size * 1.56, size * 0.4);
      ctx.fillStyle = hexA("#150a04", 0.52);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(layers[i].name, lx, ly);
    }
  }
  ctx.restore();
}

type FossilKind = "ammonite" | "trilobite" | "shell" | "fern" | "crinoid";
const FOSSILS: FossilKind[] = ["ammonite", "trilobite", "shell", "fern", "crinoid"];

/** One fossil, pale against its matrix, with a shadow so it sits *in* the rock. */
function fossilMark(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, s: number, kind: FossilKind, matrix: string, tilt: number,
) {
  const pale = mix(matrix, ROCK_LIGHT, 0.72);
  const line = mix(matrix, ROCK_SHADE, 0.55);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Impression shadow, offset down-right away from the key light.
  ctx.save();
  ctx.translate(s * 0.09, s * 0.09);
  ctx.globalAlpha = 0.45;
  fossilPath(ctx, s, kind);
  ctx.fillStyle = ROCK_SHADE;
  ctx.fill();
  ctx.restore();

  fossilPath(ctx, s, kind);
  ctx.fillStyle = pale;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.6, s * 0.07);
  ctx.stroke();

  // Detail on top of the body, in the same dark line colour.
  ctx.strokeStyle = hexA(line, 0.8);
  ctx.lineWidth = Math.max(0.5, s * 0.055);
  if (kind === "ammonite") {
    for (let i = 0; i < 9; i++) {
      const a = -i * 0.62;
      const r0 = s * 0.16 * Math.exp(0.19 * i);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0 * 0.35, Math.sin(a) * r0 * 0.35);
      ctx.lineTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.stroke();
    }
  } else if (kind === "trilobite") {
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, i * s * 0.16);
      ctx.lineTo(s * 0.5, i * s * 0.16);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.62);
    ctx.lineTo(0, s * 0.62);
    ctx.stroke();
  } else if (kind === "shell") {
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.62);
      ctx.lineTo(i * s * 0.17, -s * 0.5);
      ctx.stroke();
    }
  } else if (kind === "fern") {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.7);
    ctx.lineTo(0, -s * 0.7);
    ctx.stroke();
  } else {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, i * s * 0.26);
      ctx.lineTo(s * 0.3, i * s * 0.26);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function fossilPath(ctx: CanvasRenderingContext2D, s: number, kind: FossilKind) {
  ctx.beginPath();
  if (kind === "ammonite") {
    // A logarithmic spiral, which is the actual growth law of the shell.
    for (let i = 0; i <= 70; i++) {
      const a = -i * 0.09 * TAU * 0.16 * 6;
      const r = s * 0.1 * Math.exp(0.0295 * i);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (kind === "trilobite") {
    ctx.ellipse(0, 0, s * 0.52, s * 0.72, 0, 0, TAU);
  } else if (kind === "shell") {
    ctx.moveTo(0, s * 0.66);
    ctx.quadraticCurveTo(-s * 0.9, s * 0.1, -s * 0.56, -s * 0.5);
    ctx.quadraticCurveTo(0, -s * 0.82, s * 0.56, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.9, s * 0.1, 0, s * 0.66);
    ctx.closePath();
  } else if (kind === "fern") {
    for (let i = 0; i < 9; i++) {
      const p = i / 8;
      const py = s * 0.7 - p * s * 1.4;
      const len = s * 0.55 * Math.sin(p * Math.PI * 0.9 + 0.2);
      ctx.moveTo(0, py);
      ctx.quadraticCurveTo(len * 0.7, py - s * 0.14, len, py - s * 0.24);
      ctx.quadraticCurveTo(len * 0.55, py + s * 0.04, 0, py);
      ctx.moveTo(0, py);
      ctx.quadraticCurveTo(-len * 0.7, py - s * 0.14, -len, py - s * 0.24);
      ctx.quadraticCurveTo(-len * 0.55, py + s * 0.04, 0, py);
    }
  } else {
    // Crinoid: a stack of ossicles, the "sea lily" that makes up whole beds.
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(s * 0.34, i * s * 0.26);
      ctx.ellipse(0, i * s * 0.26, s * 0.34, s * 0.13, 0, 0, TAU);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. Plate boundaries
 * ------------------------------------------------------------------ */

export type PlateBoundary =
  | "divergent" | "convergent-oc" | "convergent-cc" | "transform";

/** Sea level, as a fraction of the panel height. */
const SEA = 0.3;

interface SectionProfile {
  /** Ground or seafloor. */
  top: (u: number) => number;
  /** Base of the crust. */
  base: (u: number) => number;
  /** Base of the rigid plate: crust plus the lithospheric mantle welded to it. */
  litho: (u: number) => number;
  /** 0 oceanic .. 1 continental, so the two crusts blend rather than butt. */
  cont: (u: number) => number;
}

interface ConvCell { u: number; v: number; ru: number; rv: number; dir: number }

/** Trench position for the ocean-continent section, reused by the slab. */
const U_TRENCH = 0.42;
const U_ARC = 0.64;

function sectionProfile(kind: PlateBoundary): SectionProfile {
  if (kind === "divergent") {
    const top = (u: number) => {
      const d = Math.abs(u - 0.5);
      // A ridge is high because the plate under it is young, thin and hot; it
      // sinks away on both sides as the plate cools. The shape is the physics.
      const swell = 0.13 * Math.exp(-(d * d) / (2 * 0.19 * 0.19));
      const axial = 0.03 * Math.exp(-(d * d) / (2 * 0.022 * 0.022));
      const hills = noise1(u * 24, 5) * 0.007 * Math.min(1, d / 0.06);
      return 0.58 - swell + axial + hills;
    };
    const base = (u: number) => top(u) + 0.055;
    return {
      top, base, cont: () => 0,
      // Lithosphere thickens with the square root of its age, so it thickens
      // outward from the axis: the plate is being built as it moves away.
      litho: (u: number) => base(u) + 0.018 + 0.24 * Math.sqrt(Math.min(1, Math.abs(u - 0.5) / 0.5)),
    };
  }
  if (kind === "convergent-oc") {
    const contAt = (u: number) => smoothstep(U_TRENCH - 0.005, U_TRENCH + 0.06, u);
    const top = (u: number) => {
      const ocean = 0.52 + noise1(u * 20, 7) * 0.006;
      const land = 0.46 - 0.19 * smoothstep(U_TRENCH, U_TRENCH + 0.34, u)
        + noise1(u * 16, 11) * 0.008;
      const arc = 0.035 * Math.exp(-((u - U_ARC) * (u - U_ARC)) / (2 * 0.05 * 0.05));
      const trench = 0.12 * Math.exp(-((u - U_TRENCH) * (u - U_TRENCH)) / (2 * 0.04 * 0.04));
      const bulge = 0.014 * Math.exp(-((u - (U_TRENCH - 0.16)) ** 2) / (2 * 0.05 * 0.05));
      return lerp(ocean - bulge, land - arc, contAt(u)) + trench;
    };
    const base = (u: number) => top(u) + lerp(0.055, 0.17, contAt(u));
    return {
      top, base, cont: contAt,
      litho: (u: number) => base(u) + lerp(0.2, 0.16, contAt(u)),
    };
  }
  if (kind === "convergent-cc") {
    const top = (u: number) => {
      const d = u - 0.5;
      // Two continents cannot get rid of each other, so the crust goes up.
      const range = 0.17 * Math.exp(-(d * d) / (2 * 0.13 * 0.13));
      const peaks = (Math.sin(u * 47) * 0.4 + Math.sin(u * 79 + 1.2) * 0.3
        + noise1(u * 30, 13) * 0.5) * 0.05;
      return 0.33 - range - peaks * (range / 0.17) + noise1(u * 12, 3) * 0.008;
    };
    // ...and down: the same collision drives a deep root, which is why the
    // highest mountains sit over the thickest crust.
    const base = (u: number) => top(u) + 0.15
      + 0.34 * Math.exp(-((u - 0.5) ** 2) / (2 * 0.15 * 0.15));
    return { top, base, cont: () => 1, litho: (u: number) => base(u) + 0.13 };
  }
  const top = (u: number) => 0.25
    + 0.02 * Math.exp(-((u - 0.5) ** 2) / (2 * 0.022 * 0.022))
    + noise1(u * 14, 9) * 0.014 - (u < 0.5 ? 0.012 : 0);
  const base = (u: number) => top(u) + 0.16;
  return { top, base, cont: () => 1, litho: (u: number) => base(u) + 0.22 };
}

function convectionCells(kind: PlateBoundary): ConvCell[] {
  // dir = +1 sinks on the cell's right-hand side, -1 rises there. Upwelling
  // has to sit under the rift and downwelling under the trench, or the picture
  // says the opposite of the physics.
  if (kind === "divergent") {
    return [
      { u: 0.25, v: 0.82, ru: 0.21, rv: 0.11, dir: -1 },
      { u: 0.75, v: 0.82, ru: 0.21, rv: 0.11, dir: 1 },
    ];
  }
  if (kind === "transform") {
    return [
      { u: 0.24, v: 0.85, ru: 0.19, rv: 0.09, dir: -1 },
      { u: 0.76, v: 0.85, ru: 0.19, rv: 0.09, dir: 1 },
    ];
  }
  const uc = kind === "convergent-oc" ? U_TRENCH : 0.5;
  return [
    { u: uc - 0.24, v: 0.86, ru: 0.19, rv: 0.09, dir: 1 },
    { u: uc + 0.3, v: 0.86, ru: 0.19, rv: 0.09, dir: -1 },
  ];
}

/**
 * A cross-section through a plate boundary: crust with real thickness, the
 * rigid mantle welded under it that makes up the rest of the plate, and the
 * hot convecting mantle it all floats on.
 *
 * The mantle glows because it is the engine. Everything else in plate tectonics
 * is a consequence of the fact that the inside of the Earth is hot and the
 * outside is not, and a student asked why plates move should be able to point
 * at the answer.
 */
export function plateSection(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  kind: PlateBoundary, t: number, theme: ThemeColors,
) {
  const pal = geoPalette(theme);
  const P = sectionProfile(kind);
  const N = 220;
  const px = (u: number) => x + u * w;
  const py = (v: number) => y + v * h;

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.035);
  ctx.clip();

  /* --- sky and sea ------------------------------------------------ */
  const sg = ctx.createLinearGradient(0, y, 0, py(SEA));
  sg.addColorStop(0, pal.sky);
  sg.addColorStop(1, pal.skyLow);
  ctx.fillStyle = sg;
  ctx.fillRect(x, y, w, h * SEA + 1);
  // The key light, present in the sky as well as on the rock.
  const sun = ctx.createRadialGradient(px(0.12), py(0.03), 0, px(0.12), py(0.03), w * 0.4);
  sun.addColorStop(0, hexA("#fff2c9", pal.dark ? 0.22 : 0.55));
  sun.addColorStop(1, hexA("#fff2c9", 0));
  ctx.fillStyle = sun;
  ctx.fillRect(x, y, w, h * SEA + 1);

  const wg = ctx.createLinearGradient(0, py(SEA), 0, y + h);
  wg.addColorStop(0, mix(pal.water, ROCK_LIGHT, 0.2));
  wg.addColorStop(0.35, pal.water);
  wg.addColorStop(1, pal.waterDeep);
  ctx.fillStyle = wg;
  ctx.fillRect(x, py(SEA), w, h * (1 - SEA) + 1);

  /* --- mantle ----------------------------------------------------- */
  let minL = 1;
  for (let i = 0; i <= N; i++) minL = Math.min(minL, P.litho(i / N));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.litho(i / N)));
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.clip();
  const mg = ctx.createLinearGradient(0, py(minL), 0, y + h);
  mg.addColorStop(0, pal.mantle[0]);
  mg.addColorStop(0.2, pal.mantle[1]);
  mg.addColorStop(0.5, pal.mantle[2]);
  mg.addColorStop(0.8, pal.mantle[3]);
  mg.addColorStop(1, pal.mantle[4]);
  ctx.fillStyle = mg;
  ctx.fillRect(x, py(minL) - 2, w, h);

  const cells = convectionCells(kind);
  // Streaks of flowing rock. The mantle is solid, but over millions of years it
  // creeps, and the streaks are there to stop "solid" being read as "still".
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const c of cells) {
    for (let k = 0; k < 5; k++) {
      const f = 0.42 + k * 0.15;
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const a = (s / 40) * TAU;
        const qx = px(c.u) + Math.cos(a) * c.ru * w * f;
        const qy = py(c.v) + Math.sin(a) * c.rv * h * f;
        if (s === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.strokeStyle = hexA(pal.mantle[3], 0.07);
      ctx.lineWidth = Math.max(2, h * 0.012);
      ctx.setLineDash([h * 0.05, h * 0.09]);
      ctx.lineDashOffset = -c.dir * t * h * 0.06;
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Hot upwelling / cold downwelling, as a glow in the rock itself.
  const upU = kind === "divergent" ? 0.5 : -1;
  if (upU >= 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ug = ctx.createRadialGradient(px(upU), py(0.78), 0, px(upU), py(0.78), h * 0.5);
    ug.addColorStop(0, hexA(pal.magma, 0.55));
    ug.addColorStop(0.5, hexA(pal.magma, 0.18));
    ug.addColorStop(1, hexA(pal.magma, 0));
    ctx.fillStyle = ug;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  for (const c of cells) {
    convectionArrows(ctx, px(c.u), py(c.v), c.ru * w, c.rv * h, c.dir, t,
      hexA(pal.magmaCore, 0.72));
  }
  ctx.restore();

  /* --- subducting slab -------------------------------------------- */
  if (kind === "convergent-oc") {
    drawSlab(ctx, px, py, P, h, t, pal);
  }

  /* --- the rigid plate: lithospheric mantle ----------------------- */
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.base(i / N)));
  for (let i = N; i >= 0; i--) ctx.lineTo(px(i / N), py(P.litho(i / N)));
  ctx.closePath();
  ctx.clip();
  const lg = ctx.createLinearGradient(0, py(minL - 0.3), 0, py(minL + 0.05));
  lg.addColorStop(0, mix(pal.lithoMantle, ROCK_LIGHT, 0.24));
  lg.addColorStop(0.6, pal.lithoMantle);
  lg.addColorStop(1, mix(pal.lithoMantle, pal.mantle[1], 0.5));
  ctx.fillStyle = lg;
  ctx.fillRect(x, y, w, h);
  for (let k = 0; k < 260; k++) {
    const a = hash21(k * 1.9, 41), b = hash21(k * 3.7, 43);
    ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.12);
    ctx.beginPath();
    ctx.arc(x + w * a, y + h * (0.3 + 0.7 * b), 1 + hash21(k, 7) * 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  /* --- crust ------------------------------------------------------ */
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.top(i / N)));
  for (let i = N; i >= 0; i--) ctx.lineTo(px(i / N), py(P.base(i / N)));
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const col = mix(pal.oceanic, pal.continental, P.cont(u));
    const t0 = py(P.top(u)), b0 = py(P.base(u));
    const cg = ctx.createLinearGradient(0, t0, 0, b0);
    cg.addColorStop(0, mix(col, ROCK_LIGHT, 0.24));
    cg.addColorStop(0.22, mix(col, ROCK_LIGHT, 0.04));
    cg.addColorStop(1, mix(col, ROCK_SHADE, 0.46));
    ctx.fillStyle = cg;
    ctx.fillRect(px(i / N) - 0.5, t0 - 4, w / N + 1.5, b0 - t0 + 8);
  }
  // Grain in the crust, so it is rock rather than a filled shape.
  for (let k = 0; k < 420; k++) {
    const a = hash21(k * 1.13, 17), b = hash21(k * 2.31, 19);
    ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.1);
    ctx.beginPath();
    ctx.arc(x + w * a, y + h * b, 0.7 + hash21(k, 23) * 1.5, 0, TAU);
    ctx.fill();
  }
  // Bedded cover on the continents, folded where the section is being squeezed.
  // Rock at depth bends instead of snapping, and a fold is the visible proof.
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      if (P.cont(u) < 0.3) continue;
      const fold = kind === "convergent-cc"
        ? Math.sin(u * 42) * 0.014 * Math.exp(-((u - 0.5) ** 2) / (2 * 0.17 * 0.17)) : 0;
      const v = P.top(u) + 0.014 + j * 0.017 + fold;
      ctx.lineTo(px(u), py(v));
    }
    ctx.strokeStyle = hexA(j % 2 ? ROCK_LIGHT : ROCK_SHADE, 0.3);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  if (kind === "divergent") {
    // Sheeted dikes: the new crust at a ridge is made of frozen cracks, each
    // one a batch of magma that filled the gap as the plates pulled apart.
    for (let j = -6; j <= 6; j++) {
      const u = 0.5 + j * 0.011;
      ctx.beginPath();
      ctx.moveTo(px(u), py(P.top(u)));
      ctx.lineTo(px(u + 0.004), py(P.base(u) + 0.02));
      ctx.strokeStyle = hexA(mix(pal.oceanic, pal.magma, 0.35), 0.5);
      ctx.lineWidth = Math.max(1.4, w * 0.004);
      ctx.stroke();
    }
  }
  if (kind === "convergent-cc") {
    // Thrust faults: the surfaces the two halves rode up over each other on.
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(px(0.5 + s * 0.005), py(P.base(0.5) - 0.02));
      ctx.quadraticCurveTo(px(0.5 + s * 0.1), py(P.top(0.5) + 0.12),
        px(0.5 + s * 0.26), py(P.top(0.5 + s * 0.26) + 0.005));
      ctx.strokeStyle = hexA(ROCK_SHADE, 0.55);
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }
  ctx.restore();

  // The two contacts a student is asked to name: the base of the crust, and the
  // ground surface. Without a line on them the units blur into one another.
  ctx.beginPath();
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.base(i / N)));
  ctx.strokeStyle = hexA(ROCK_SHADE, 0.6);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.litho(i / N)));
  ctx.strokeStyle = hexA("#000000", 0.35);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  /* --- sediment veneer -------------------------------------------- */
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(P.top(i / N)));
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    // Sediment ponds in the deep and in the trench, and is stripped from highs.
    const thick = 0.0025 + 0.008 * clamp01((P.top(u) - SEA - 0.1) * 4)
      + (kind === "convergent-oc"
        ? 0.03 * Math.exp(-((u - U_TRENCH) ** 2) / (2 * 0.03 * 0.03)) : 0);
    ctx.lineTo(px(u), py(P.top(u) + thick));
  }
  ctx.closePath();
  const sedG = ctx.createLinearGradient(0, py(SEA), 0, y + h);
  sedG.addColorStop(0, mix(pal.sediment, ROCK_LIGHT, 0.3));
  sedG.addColorStop(1, mix(pal.sediment, ROCK_SHADE, 0.3));
  ctx.fillStyle = sedG;
  ctx.fill();
  ctx.restore();

  /* --- ridge plumbing --------------------------------------------- */
  if (kind === "divergent") {
    const axisTop = P.top(0.5);
    magmaBody(ctx, px(0.5), py(axisTop + 0.085), w * 0.075, h * 0.045, 1, t, pal);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const dg = ctx.createLinearGradient(0, py(axisTop + 0.09), 0, py(axisTop));
    dg.addColorStop(0, hexA(pal.magmaCore, 0.9));
    dg.addColorStop(1, hexA(pal.magma, 0.35));
    ctx.fillStyle = dg;
    ctx.fillRect(px(0.5) - w * 0.006, py(axisTop), w * 0.012, h * 0.09);
    ctx.restore();
    // Pillow lavas: basalt chilled into lobes the instant it met seawater.
    for (let k = -2; k <= 2; k++) {
      const u = 0.5 + k * 0.016;
      const cy = py(P.top(u)) + h * 0.006;
      const g2 = ctx.createRadialGradient(
        px(u) + KEY.x * w * 0.012, cy + KEY.y * h * 0.01, 0, px(u), cy, w * 0.016,
      );
      g2.addColorStop(0, mix(pal.oceanic, pal.magma, 0.45));
      g2.addColorStop(1, mix(pal.oceanic, ROCK_SHADE, 0.3));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.ellipse(px(u), cy, w * 0.016, h * 0.012, 0, 0, TAU);
      ctx.fill();
    }
  }

  /* --- volcanic arc ----------------------------------------------- */
  if (kind === "convergent-oc") {
    const baseV = P.top(U_ARC) + 0.1;
    magmaBody(ctx, px(U_ARC), py(baseV + 0.15), w * 0.07, h * 0.05, 1, t, pal);
    // Melt rising off the slab. Water driven out of the wet, sinking plate
    // lowers the melting point of the mantle above it — this is why a chain of
    // volcanoes sits inland of every trench, and not over the trench itself.
    for (let k = 0; k < 5; k++) {
      const ph = (t * 0.13 + k * 0.2) % 1;
      const u = lerp(U_ARC + 0.08, U_ARC, ph);
      const v = lerp(baseV + 0.44, baseV + 0.17, ph);
      const rr = w * 0.011 * (0.5 + ph * 0.9);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const bg2 = ctx.createRadialGradient(px(u), py(v), 0, px(u), py(v), rr * 2.6);
      bg2.addColorStop(0, hexA(pal.magmaCore, 0.85 * (1 - ph * 0.4)));
      bg2.addColorStop(0.4, hexA(pal.magma, 0.4 * (1 - ph * 0.4)));
      bg2.addColorStop(1, hexA(pal.magma, 0));
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.arc(px(u), py(v), rr * 2.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const coneH = h * 0.2;
    const coneBase = py(P.top(U_ARC)) + h * 0.012;
    coneBody(ctx, px(U_ARC), coneBase, w * 0.23, coneH, 0.3, t, pal);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, coneBase - coneH * 0.9);
    ctx.clip();
    eruptionPlume(ctx, px(U_ARC), coneBase - coneH * 0.97, w * 0.09, h * 0.5,
      0.28, t, pal);
    ctx.restore();
  }

  /* --- transform fault -------------------------------------------- */
  if (kind === "transform") {
    drawTransformFault(ctx, px, py, P, w, h, t, pal);
  }

  /* --- water over the section ------------------------------------- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, py(SEA));
  for (let i = 0; i <= N; i++) ctx.lineTo(px(i / N), py(Math.max(SEA, P.top(i / N))));
  ctx.lineTo(x + w, py(SEA));
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const d = clamp01((P.top(u) - SEA) / 0.3);
    // Deep water is darker and bluer: the shallows over a ridge crest read as
    // shallow, which is half of what a bathymetric map is telling you.
    ctx.fillStyle = hexA(pal.waterDeep, 0.25 + 0.55 * d);
    ctx.fillRect(px(i / N) - 0.5, py(SEA), w / N + 1.5, h);
  }
  ctx.fillStyle = hexA(pal.water, 0.25);
  ctx.fillRect(x, py(SEA), w, h * 0.03);
  ctx.restore();
  // Sea surface: a bright line, broken where land rises out of it, because a
  // waterline drawn straight through a mountain is a waterline nobody believes.
  ctx.strokeStyle = hexA(mix(pal.water, ROCK_LIGHT, 0.5), 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  let wet = false;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    if (P.top(u) > SEA + 0.004) {
      if (wet) ctx.lineTo(px(u), py(SEA)); else ctx.moveTo(px(u), py(SEA));
      wet = true;
    } else wet = false;
  }
  ctx.stroke();
  for (let k = 0; k < 14; k++) {
    const u = ((k * 0.137 + t * 0.02) % 1);
    if (P.top(u) < SEA) continue;
    ctx.fillStyle = hexA(ROCK_LIGHT, 0.35);
    ctx.fillRect(px(u), py(SEA) - 1.5, w * 0.02, 2);
  }

  /* --- motion ------------------------------------------------------ */
  const arrowCol = mix(pal.ink, ROCK_LIGHT, pal.dark ? 0.35 : 0);
  if (kind === "divergent") {
    plateArrow(ctx, px(0.3), py(P.top(0.3)) - h * 0.055, w * 0.16, -1, arrowCol, h);
    plateArrow(ctx, px(0.7), py(P.top(0.7)) - h * 0.055, w * 0.16, 1, arrowCol, h);
  } else if (kind === "convergent-oc") {
    plateArrow(ctx, px(0.18), py(P.top(0.18)) - h * 0.06, w * 0.16, 1, arrowCol, h);
    plateArrow(ctx, px(0.88), py(P.top(0.88)) - h * 0.07, w * 0.13, -1, arrowCol, h);
  } else if (kind === "convergent-cc") {
    plateArrow(ctx, px(0.16), py(P.top(0.16)) - h * 0.06, w * 0.16, 1, arrowCol, h);
    plateArrow(ctx, px(0.84), py(P.top(0.84)) - h * 0.06, w * 0.16, -1, arrowCol, h);
  } else {
    // A transform's motion is horizontal and *along* the section, straight into
    // and out of the page, so no in-plane arrow can show it. The dot-and-cross
    // is the surveyor's notation for exactly that: an arrow coming at you, and
    // the flights of one going away.
    motionSymbol(ctx, px(0.28), py(P.top(0.28)) - h * 0.08, h * 0.035, true, arrowCol);
    motionSymbol(ctx, px(0.72), py(P.top(0.72)) - h * 0.08, h * 0.035, false, arrowCol);
  }

  /* --- frame ------------------------------------------------------- */
  const vig = ctx.createRadialGradient(px(0.5), py(0.45), h * 0.2, px(0.5), py(0.5), w * 0.75);
  vig.addColorStop(0, hexA("#000000", 0));
  vig.addColorStop(1, hexA("#000000", 0.22));
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.min(w, h) * 0.035);
  ctx.strokeStyle = hexA(pal.ink, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** The descending plate, with the cold core that makes it sink in the first place. */
function drawSlab(
  ctx: CanvasRenderingContext2D,
  px: (u: number) => number, py: (v: number) => number,
  P: SectionProfile, h: number, t: number, pal: GeoPalette,
) {
  const startV = P.top(U_TRENCH) + 0.02;
  // Centre-line of the slab, steepening with depth as it loses its bend.
  const cx = (s: number) => px(U_TRENCH + 0.27 * Math.pow(s, 0.85));
  const cy = (s: number) => py(startV + (0.95 - startV) * Math.pow(s, 1.3));
  const th = (s: number) => h * (0.075 - 0.02 * s);
  const pts: { x: number; y: number; nx: number; ny: number; th: number }[] = [];
  for (let i = 0; i <= 40; i++) {
    const s = i / 40;
    const ax = cx(s), ay = cy(s);
    const bx = cx(Math.min(1, s + 0.02)) - cx(Math.max(0, s - 0.02));
    const by = cy(Math.min(1, s + 0.02)) - cy(Math.max(0, s - 0.02));
    const len = Math.hypot(bx, by) || 1;
    pts.push({ x: ax, y: ay, nx: -by / len, ny: bx / len, th: th(s) });
  }
  ctx.save();
  ctx.beginPath();
  for (const p of pts) ctx.lineTo(p.x + p.nx * p.th, p.y + p.ny * p.th);
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    ctx.lineTo(p.x - p.nx * p.th, p.y - p.ny * p.th);
  }
  ctx.closePath();
  ctx.save();
  ctx.clip();
  // The slab is cold — that is the whole reason it sinks — and it warms up on
  // the way down until, deep enough, it stops being distinguishable.
  const sg = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[40].x, pts[40].y);
  sg.addColorStop(0, mix(pal.lithoMantle, pal.slabCold, 0.55));
  sg.addColorStop(0.45, mix(pal.slabCold, pal.mantle[1], 0.45));
  sg.addColorStop(1, hexA(pal.mantle[2], 0.2));
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // The subducted crust itself, a dark skin on the slab's upper surface.
  ctx.beginPath();
  for (const p of pts) ctx.lineTo(p.x - p.nx * p.th * 0.82, p.y - p.ny * p.th * 0.82);
  ctx.strokeStyle = hexA(mix(pal.oceanic, ROCK_SHADE, 0.2), 0.85);
  ctx.lineWidth = Math.max(2, h * 0.012);
  ctx.stroke();

  // Earthquakes cluster on the slab's top surface, deeper the further inland
  // you go: the Wadati-Benioff zone, and the reason we know the slab is there.
  for (let k = 0; k < 11; k++) {
    const s = 0.06 + k * 0.085;
    const i = Math.min(40, Math.round(s * 40));
    const p = pts[i];
    const flash = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 - k * 0.9));
    const qx = p.x - p.nx * p.th * 0.6, qy = p.y - p.ny * p.th * 0.6;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(qx, qy, 0, qx, qy, h * 0.03);
    g.addColorStop(0, hexA("#fff6d8", 0.9 * flash));
    g.addColorStop(1, hexA(pal.magmaCore, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(qx, qy, h * 0.03, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = hexA("#ffffff", 0.85);
    ctx.beginPath();
    ctx.arc(qx, qy, Math.max(1.2, h * 0.006), 0, TAU);
    ctx.fill();
  }
  void P;
}

/** A strike-slip fault zone: crushed rock, and earthquakes on the plane itself. */
function drawTransformFault(
  ctx: CanvasRenderingContext2D,
  px: (u: number) => number, py: (v: number) => number,
  P: SectionProfile, w: number, h: number, t: number, pal: GeoPalette,
) {
  const faultX = (v: number) => px(0.5 + noise1(v * 6, 29) * 0.012);
  const v0 = P.top(0.5), v1 = P.litho(0.5) + 0.08;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const v = lerp(v0, v1, i / 30);
    ctx.lineTo(faultX(v) - w * 0.016, py(v));
  }
  for (let i = 30; i >= 0; i--) {
    const v = lerp(v0, v1, i / 30);
    ctx.lineTo(faultX(v) + w * 0.016, py(v));
  }
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = hexA(ROCK_SHADE, 0.55);
  ctx.fillRect(px(0.4), py(v0), w * 0.2, h);
  // Fault gouge: rock ground to angular rubble by two plates scraping past.
  for (let k = 0; k < 90; k++) {
    const v = lerp(v0, v1, hash21(k * 1.7, 31));
    const qx = faultX(v) + (hash21(k * 2.9, 33) - 0.5) * w * 0.02;
    const s = 1 + hash21(k, 37) * 2.4;
    ctx.fillStyle = hexA(k % 2 ? ROCK_LIGHT : pal.continental, 0.3);
    ctx.beginPath();
    ctx.moveTo(qx, py(v) - s);
    ctx.lineTo(qx + s, py(v));
    ctx.lineTo(qx - s * 0.4, py(v) + s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  for (const s of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const v = lerp(v0, v1, i / 30);
      ctx.lineTo(faultX(v) + s * w * 0.016, py(v));
    }
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.7);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  // Strain builds until the fault slips: the flashes are the release.
  for (let k = 0; k < 4; k++) {
    const v = lerp(v0 + 0.03, v1 - 0.1, k / 3);
    const flash = Math.max(0, Math.sin(t * 1.1 - k * 1.4)) ** 3;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(faultX(v), py(v), 0, faultX(v), py(v), h * 0.07);
    g.addColorStop(0, hexA("#ffeaa8", 0.85 * flash));
    g.addColorStop(1, hexA("#ffb02e", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(faultX(v), py(v), h * 0.07, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** Chevrons riding a convection cell, so the flow has a visible direction. */
function convectionArrows(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  dir: number, t: number, color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.6, ry * 0.09);
  for (let k = 0; k < 4; k++) {
    const a = dir * t * 0.45 + (k / 4) * TAU;
    const qx = cx + Math.cos(a) * rx, qy = cy + Math.sin(a) * ry;
    const tx = -Math.sin(a) * rx * dir, ty = Math.cos(a) * ry * dir;
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len, uy = ty / len;
    const s = Math.max(5, ry * 0.32);
    ctx.beginPath();
    ctx.moveTo(qx - ux * s + uy * s * 0.62, qy - uy * s - ux * s * 0.62);
    ctx.lineTo(qx, qy);
    ctx.lineTo(qx - ux * s - uy * s * 0.62, qy - uy * s + ux * s * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

/** A bold plate-motion arrow, outlined so it reads over any rock colour. */
function plateArrow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, len: number, dir: number, color: string, h: number,
) {
  const th = Math.max(4, h * 0.022);
  const head = Math.max(9, h * 0.05);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - dir * len / 2, y - th);
  ctx.lineTo(x + dir * (len / 2 - head), y - th);
  ctx.lineTo(x + dir * (len / 2 - head), y - th * 2.3);
  ctx.lineTo(x + dir * len / 2, y);
  ctx.lineTo(x + dir * (len / 2 - head), y + th * 2.3);
  ctx.lineTo(x + dir * (len / 2 - head), y + th);
  ctx.lineTo(x - dir * len / 2, y + th);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y - th * 2.3, 0, y + th * 2.3);
  g.addColorStop(0, mix(color, "#ffffff", 0.55));
  g.addColorStop(0.5, color);
  g.addColorStop(1, mix(color, "#000000", 0.35));
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = hexA("#ffffff", 0.7);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Motion into or out of the page: the dot is the arrowhead, the cross its flights. */
function motionSymbol(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, out: boolean, color: string,
) {
  ctx.save();
  const g = ctx.createRadialGradient(x + KEY.x * r, y + KEY.y * r, 0, x, y, r);
  g.addColorStop(0, mix(color, "#ffffff", 0.6));
  g.addColorStop(1, mix(color, "#000000", 0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.8);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // In a dark theme the disc is pale, so a white dot would vanish into it.
  const rgb = hex(color);
  const mark = (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722) > 150
    ? "#1a1016" : "#ffffff";
  ctx.strokeStyle = mark;
  ctx.lineWidth = Math.max(1.6, r * 0.2);
  ctx.lineCap = "round";
  if (out) {
    ctx.fillStyle = mark;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, TAU);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.55);
    ctx.lineTo(x + r * 0.55, y + r * 0.55);
    ctx.moveTo(x + r * 0.55, y - r * 0.55);
    ctx.lineTo(x - r * 0.55, y + r * 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 3. Volcanoes
 * ------------------------------------------------------------------ */

/**
 * A composite cone with its plumbing showing.
 *
 * `activity` 0 is a quiet, snow-dusted mountain; 1 is a full eruption column.
 * The magma chamber is drawn below the ground because the question a student
 * is usually asked — why is there a volcano *here* — is answered underground.
 */
export function volcano(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, h: number,
  activity: number, t: number, theme: ThemeColors,
) {
  const a = clamp01(activity);
  const pal = geoPalette(theme);

  ctx.save();
  // Underground, feathered so it sits over whatever the caller already drew.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - w, baseY, w * 2, h * 1.4);
  ctx.clip();
  const country = mix(pal.continental, ROCK_SHADE, 0.66);
  const ug = ctx.createRadialGradient(x, baseY + h * 0.4, 0, x, baseY + h * 0.4, w * 0.9);
  ug.addColorStop(0, hexA(country, 0.96));
  ug.addColorStop(0.6, hexA(country, 0.72));
  ug.addColorStop(1, hexA(country, 0));
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.ellipse(x, baseY + h * 0.4, w * 0.9, h * 0.75, 0, 0, TAU);
  ctx.fill();
  // Country rock the magma has to push through, in beds so the intrusion reads.
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    for (let s = 0; s <= 20; s++) {
      const u = s / 20;
      ctx.lineTo(x - w * 0.85 + w * 1.7 * u,
        baseY + h * (0.09 + j * 0.13) + noise1(u * 4 + j, 51) * h * 0.02);
    }
    ctx.strokeStyle = hexA(j % 2 ? ROCK_LIGHT : ROCK_SHADE, 0.2);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // The ground surface the cone is standing on, fading out with the cutaway.
  const gl = ctx.createLinearGradient(x - w * 0.9, 0, x + w * 0.9, 0);
  gl.addColorStop(0, hexA(ROCK_SHADE, 0));
  gl.addColorStop(0.5, hexA(ROCK_SHADE, 0.6));
  gl.addColorStop(1, hexA(ROCK_SHADE, 0));
  ctx.strokeStyle = gl;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.9, baseY);
  ctx.lineTo(x + w * 0.9, baseY);
  ctx.stroke();
  ctx.restore();

  // Chamber and conduit.
  const chamberY = baseY + h * 0.5;
  const conduitTop = baseY - h * 0.05;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.045 * (0.6 + a * 0.6), conduitTop);
  ctx.lineTo(x + w * 0.045 * (0.6 + a * 0.6), conduitTop);
  ctx.lineTo(x + w * 0.09, chamberY);
  ctx.lineTo(x - w * 0.09, chamberY);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, chamberY, 0, conduitTop);
  cg.addColorStop(0, pal.magmaCore);
  cg.addColorStop(0.5, pal.magma);
  cg.addColorStop(1, mix(pal.magma, "#8c1c05", 0.35 + (1 - a) * 0.4));
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.restore();
  magmaBody(ctx, x, chamberY, w * 0.34, h * 0.19, 0.45 + a * 0.55, t, pal);

  // The cone itself.
  coneBody(ctx, x, baseY, w, h, a, t, pal);

  // Crater lava and the column above it.
  const rimY = baseY - h;
  if (a > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const lg = ctx.createRadialGradient(x, rimY + h * 0.045, 0, x, rimY + h * 0.045, w * 0.3 * (0.5 + a));
    lg.addColorStop(0, hexA(pal.magmaCore, 0.85 * a));
    lg.addColorStop(0.35, hexA(pal.magma, 0.4 * a));
    lg.addColorStop(1, hexA(pal.magma, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x, rimY + h * 0.045, w * 0.3 * (0.5 + a), 0, TAU);
    ctx.fill();
    ctx.restore();
    const pool = ctx.createRadialGradient(x, rimY + h * 0.05, 0, x, rimY + h * 0.05, w * 0.1);
    pool.addColorStop(0, pal.magmaCore);
    pool.addColorStop(0.55, pal.magma);
    pool.addColorStop(1, mix(pal.magma, ROCK_SHADE, 0.5));
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, rimY + h * 0.05, w * 0.09, h * 0.022, 0, 0, TAU);
    ctx.fill();
  }
  if (a > 0.4) lavaFlows(ctx, x, baseY, w, h, a, t, pal);
  if (a > 0.02) eruptionPlume(ctx, x, rimY + h * 0.03, w, h, a, t, pal);
  ctx.restore();
}

/** The cone: layered flanks, a crater, weathering gullies, one key light. */
function coneBody(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, h: number,
  a: number, t: number, pal: GeoPalette,
) {
  const half = w / 2;
  const RIM = 0.17, SHAPE = 1.55;
  const norm = Math.pow(1 - RIM, SHAPE);
  const rock = mix(pal.oceanic, "#7c4128", 0.6);
  // Flanks are concave: steep near the vent where lava freezes on contact,
  // shallow at the base where ash settles out. That curve is what makes a
  // stratovolcano look like a stratovolcano rather than a triangle.
  const prof = (u: number, side: number) => {
    const uu = Math.min(1, Math.max(RIM, u));
    const bump = Math.sin((Math.PI * (uu - RIM)) / (1 - RIM))
      * noise1(uu * 7 + (side > 0 ? 13 : 2), 61) * 0.05;
    return h * (Math.pow(1 - uu, SHAPE) / norm + bump) * (side > 0 ? 0.965 : 1);
  };

  const pts: [number, number][] = [];
  for (let s = 0; s <= 34; s++) {
    const u = 1 - (s / 34) * (1 - RIM);
    pts.push([x - u * half, baseY - prof(u, -1)]);
  }
  const craterD = h * 0.075;
  pts.push([x - half * RIM * 0.45, baseY - h + craterD * 0.9]);
  pts.push([x, baseY - h + craterD]);
  pts.push([x + half * RIM * 0.45, baseY - h * 0.965 + craterD * 0.9]);
  for (let s = 0; s <= 34; s++) {
    const u = RIM + (s / 34) * (1 - RIM);
    pts.push([x + u * half, baseY - prof(u, 1)]);
  }

  const conePath = (k = 1) => {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const qx = x + (pts[i][0] - x) * k;
      const qy = baseY + (pts[i][1] - baseY) * k;
      if (i === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    if (k === 1) {
      ctx.lineTo(x + half, baseY);
      ctx.lineTo(x - half, baseY);
    }
    ctx.closePath();
  };

  ctx.save();
  // Contact shadow, so the mountain sits on the ground rather than floating.
  const sh = ctx.createRadialGradient(x + w * 0.05, baseY, 0, x + w * 0.05, baseY, w * 0.68);
  sh.addColorStop(0, hexA("#000000", 0.35));
  sh.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.05, baseY, w * 0.68, h * 0.06, 0, 0, TAU);
  ctx.fill();

  conePath();
  const bg = ctx.createLinearGradient(x - half, baseY - h, x + half, baseY);
  bg.addColorStop(0, mix(rock, ROCK_LIGHT, 0.42));
  bg.addColorStop(0.36, mix(rock, ROCK_LIGHT, 0.12));
  bg.addColorStop(0.62, rock);
  bg.addColorStop(1, mix(rock, ROCK_SHADE, 0.55));
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  conePath();
  ctx.clip();
  // "Strato-" means layered: every eruption adds a shell of lava or ash over
  // the last one, so the inside of the cone is a stack of nested cones. Drawing
  // them is drawing the volcano's history.
  for (let j = 1; j <= 9; j++) {
    conePath(1 - j * 0.098);
    ctx.strokeStyle = hexA(j % 2 ? ROCK_SHADE : ROCK_LIGHT, 0.22);
    ctx.lineWidth = Math.max(1.4, h * 0.012);
    ctx.stroke();
  }
  // Gullies cut by rain into loose ash, radiating from the summit.
  for (let k = 0; k < 13; k++) {
    const u = -1 + (k / 12) * 2;
    const bx = x + u * half * 0.96;
    ctx.beginPath();
    ctx.moveTo(x + u * half * RIM * 1.4, baseY - h * 0.9);
    ctx.quadraticCurveTo((x + bx) / 2 + u * w * 0.02, baseY - h * 0.4, bx, baseY);
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.28);
    ctx.lineWidth = Math.max(1, w * 0.006);
    ctx.stroke();
    ctx.save();
    ctx.translate(-w * 0.006, 0);
    ctx.strokeStyle = hexA(ROCK_LIGHT, 0.14);
    ctx.lineWidth = Math.max(0.8, w * 0.004);
    ctx.stroke();
    ctx.restore();
  }
  // Ash and blocks scattered on the flanks.
  for (let k = 0; k < 150; k++) {
    const qx = x + (hash21(k * 1.7, 71) - 0.5) * w;
    const qy = baseY - hash21(k * 2.9, 73) * h;
    ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.14);
    ctx.beginPath();
    ctx.arc(qx, qy, 0.7 + hash21(k, 79) * 1.8, 0, TAU);
    ctx.fill();
  }
  // A quiet cone keeps its snow; an erupting one melts and buries it.
  if (a < 0.4) {
    ctx.beginPath();
    for (let s = 0; s <= 24; s++) {
      const u = -1 + (s / 24) * 2;
      const uu = Math.abs(u);
      ctx.lineTo(x + u * half, baseY - prof(uu, u > 0 ? 1 : -1));
    }
    for (let s = 24; s >= 0; s--) {
      const u = -1 + (s / 24) * 2;
      ctx.lineTo(x + u * half,
        baseY - h * (0.62 - 0.18 * Math.abs(u)) + noise1(u * 9, 83) * h * 0.05);
    }
    ctx.closePath();
    ctx.fillStyle = hexA("#f6fbff", 0.82 * (1 - a / 0.4));
    ctx.fill();
  }
  ctx.restore();

  // Rim light down the shaded edge lifts the cone off the sky.
  ctx.beginPath();
  for (let s = 0; s <= 34; s++) {
    const u = RIM + (s / 34) * (1 - RIM);
    ctx.lineTo(x + u * half, baseY - prof(u, 1));
  }
  ctx.strokeStyle = hexA(ROCK_LIGHT, 0.3);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // Crater rim: lit on the left, in shadow on the right.
  ctx.beginPath();
  ctx.moveTo(x - half * RIM, baseY - h);
  ctx.quadraticCurveTo(x - half * RIM * 0.4, baseY - h + craterD * 1.5,
    x, baseY - h + craterD);
  ctx.quadraticCurveTo(x + half * RIM * 0.4, baseY - h + craterD * 1.4,
    x + half * RIM, baseY - h * 0.965);
  ctx.strokeStyle = hexA(ROCK_SHADE, 0.6);
  ctx.lineWidth = Math.max(1.4, h * 0.012);
  ctx.stroke();
  void t;
  ctx.restore();
}

/** Glowing magma: a body of rock hot enough to flow, drawn as such. */
function magmaBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rx: number, ry: number,
  heat: number, t: number, pal: GeoPalette,
) {
  const pulse = 0.9 + 0.1 * Math.sin(t * 1.3);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(x, y, 0, x, y, rx * 2.4);
  halo.addColorStop(0, hexA(pal.magma, 0.5 * heat * pulse));
  halo.addColorStop(0.45, hexA(pal.magma, 0.18 * heat));
  halo.addColorStop(1, hexA(pal.magma, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 2.4, ry * 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  // A chamber is a lens of melt, not a cartoon balloon.
  for (let s = 0; s <= 40; s++) {
    const a = (s / 40) * TAU;
    const k = 1 + noise1(s * 0.3, 91) * 0.16;
    const qx = x + Math.cos(a) * rx * k;
    const qy = y + Math.sin(a) * ry * k;
    if (s === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(x, y - ry * 0.2, 0, x, y, rx);
  g.addColorStop(0, pal.magmaCore);
  g.addColorStop(0.4, pal.magma);
  g.addColorStop(0.8, mix(pal.magma, "#a01f05", 0.5));
  g.addColorStop(1, mix(pal.magma, ROCK_SHADE, 0.6));
  ctx.fillStyle = g;
  ctx.fill();
  // Convection inside the melt, slow and bright.
  ctx.clip();
  for (let k = 0; k < 5; k++) {
    const ph = (t * 0.15 + k * 0.2) % 1;
    ctx.beginPath();
    ctx.ellipse(x + (k - 2) * rx * 0.3, y + ry * (0.4 - ph * 0.9),
      rx * 0.22, ry * 0.26, 0, 0, TAU);
    ctx.fillStyle = hexA(pal.magmaCore, 0.3 * (1 - ph));
    ctx.fill();
  }
  ctx.restore();
}

/** Lava spilling over the rim and crawling down the flanks. */
function lavaFlows(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, w: number, h: number,
  a: number, t: number, pal: GeoPalette,
) {
  const reach = clamp01((a - 0.4) / 0.6);
  // The flow has to lie on the cone, so it follows the same flank curve the
  // cone was drawn from; a flow floating off the slope reads as a firework.
  const RIM = 0.17, SHAPE = 1.55;
  const norm = Math.pow(1 - RIM, SHAPE);
  const flankY = (u: number) => baseY - h * (Math.pow(1 - u, SHAPE) / norm);
  const uEnd = RIM + (0.96 - RIM) * (0.35 + 0.65 * reach);
  for (const side of [-1, 1]) {
    const endX = x + side * (w / 2) * uEnd;
    const endY = flankY(uEnd);
    const uMid = (RIM + uEnd) / 2;
    ctx.save();
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + side * (w / 2) * RIM * 0.9, flankY(RIM * 0.95) - h * 0.01);
    ctx.quadraticCurveTo(
      x + side * (w / 2) * uMid * (side > 0 ? 1.05 : 0.95), flankY(uMid),
      endX, endY,
    );
    ctx.strokeStyle = hexA(mix(pal.magma, ROCK_SHADE, 0.35), 0.9);
    ctx.lineWidth = Math.max(3, w * 0.035);
    ctx.stroke();
    ctx.strokeStyle = hexA(pal.magma, 0.95);
    ctx.lineWidth = Math.max(2, w * 0.022);
    ctx.stroke();
    ctx.strokeStyle = hexA(pal.magmaCore, 0.6 + 0.25 * Math.sin(t * 2 + side));
    ctx.lineWidth = Math.max(1, w * 0.009);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(endX, endY, 0, endX, endY, w * 0.12);
    g.addColorStop(0, hexA(pal.magma, 0.5));
    g.addColorStop(1, hexA(pal.magma, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(endX, endY, w * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

/** The eruption column: ash, steam and incandescent gas, height set by activity. */
function eruptionPlume(
  ctx: CanvasRenderingContext2D,
  x: number, ventY: number, w: number, h: number,
  a: number, t: number, pal: GeoPalette,
) {
  const H = h * (0.35 + a * 2.9);
  // A quiet vent puts out white steam and a big eruption puts out dark ash.
  // The colour of the column is how the size of an eruption is judged from a
  // distance, so it has to track `activity` and not just the height.
  const ash = mix(pal.dark ? "#cbd8e8" : "#f4f7fb",
    pal.dark ? "#5f5468" : "#4c4453", clamp01(a * 1.6));
  ctx.save();
  for (let k = 0; k < 46; k++) {
    // Each puff rises and spreads; the phase keeps the column stable while the
    // individual puffs convect through it.
    const base = hash21(k * 1.7, 101);
    const p = (base + t * 0.055) % 1;
    const spread = Math.pow(p, 1.5);
    const drift = Math.sin(p * 3.1 + k) * w * 0.14 * p + spread * w * 0.55;
    const qx = x + drift + (hash21(k * 2.3, 103) - 0.5) * w * 0.18 * (0.3 + p);
    const qy = ventY - p * H;
    const r = w * (0.09 + spread * 0.7) * (0.35 + a * 0.8)
      * (0.7 + hash21(k, 107) * 0.6);
    const fade = Math.min(1, p * 6) * (1 - p * 0.75) * (0.12 + a * 0.85);
    const hotBase = clamp01(1 - p * 7);
    const col = mix(ash, pal.magma, hotBase * 0.9);
    const g = ctx.createRadialGradient(
      qx + KEY.x * r * 0.5, qy + KEY.y * r * 0.5, 0, qx, qy, r,
    );
    g.addColorStop(0, hexA(mix(col, ROCK_LIGHT, 0.28 + hotBase * 0.4), 0.5 * fade));
    g.addColorStop(0.55, hexA(col, 0.4 * fade));
    g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(qx, qy, r, 0, TAU);
    ctx.fill();
  }
  // Incandescence at the vent, where the gas is still hot enough to glow.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const vg = ctx.createLinearGradient(0, ventY, 0, ventY - H * 0.22);
  vg.addColorStop(0, hexA(pal.magmaCore, 0.75 * a));
  vg.addColorStop(0.4, hexA(pal.magma, 0.3 * a));
  vg.addColorStop(1, hexA(pal.magma, 0));
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.1, ventY);
  ctx.lineTo(x + w * 0.1, ventY);
  ctx.lineTo(x + w * 0.22, ventY - H * 0.22);
  ctx.lineTo(x - w * 0.22, ventY - H * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Volcanic bombs: lumps thrown clear on ballistic arcs.
  if (a > 0.55) {
    const n = Math.round((a - 0.55) * 22);
    for (let k = 0; k < n; k++) {
      const ph = (t * 0.5 + hash21(k * 3.1, 109)) % 1;
      const dir = hash21(k, 113) > 0.5 ? 1 : -1;
      const sp = 0.4 + hash21(k * 5.3, 127) * 0.6;
      const bx = x + dir * w * sp * ph * 1.6;
      const by = ventY - H * 0.35 * sp * (4 * ph * (1 - ph));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, w * 0.05);
      g.addColorStop(0, hexA(pal.magmaCore, 0.9));
      g.addColorStop(0.3, hexA(pal.magma, 0.5));
      g.addColorStop(1, hexA(pal.magma, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, w * 0.05, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 4. Terrain
 * ------------------------------------------------------------------ */

export interface TerrainOpts {
  theme: ThemeColors;
  /** Water surface, in the same 0..1 units as `profile`. Omit for dry land. */
  waterLevel?: number;
  /** Soil horizons above the bedrock. Default true. */
  soil?: boolean;
  /** Sky wash and a hazy ridge behind. Default true. */
  backdrop?: boolean;
  seed?: number;
  /** Override the bedrock tint. */
  rock?: string;
  /** Override the vegetation tint. */
  grass?: string;
}

/**
 * A landscape in cross-section, built from a height profile: 0 is the bottom of
 * the box and 1 the top, sampled smoothly across the width.
 *
 * The soil horizons run parallel to the ground rather than flat, because soil
 * forms by weathering downward from whatever surface is there. That is why a
 * river cutting into a valley exposes them as bands following the slope, and it
 * is the visual difference between soil (a process) and a layer (a thing).
 */
export function terrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  profile: number[], opts: TerrainOpts,
) {
  if (profile.length < 1 || w <= 0 || h <= 0) return;
  const pal = geoPalette(opts.theme);
  const seed = opts.seed ?? 5;
  const N = Math.max(64, Math.min(320, Math.round(w / 3)));
  const rock = opts.rock ?? mix(pal.continental, "#8a5330", 0.55);
  const grass = opts.grass ?? pal.vegetation;
  const soilOn = opts.soil !== false;

  const surf = (u: number) => y + h * (1 - clamp01(
    sampleProfile(profile, u) + noise1(u * 22, seed) * 0.005));
  const bandPath = (d0: number, d1: number) => {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) ctx.lineTo(x + (w * i) / N, surf(i / N) + h * d0);
    for (let i = N; i >= 0; i--) {
      ctx.lineTo(x + (w * i) / N, Math.min(y + h, surf(i / N) + h * d1));
    }
    ctx.closePath();
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (opts.backdrop !== false) {
    const sg = ctx.createLinearGradient(0, y, 0, y + h);
    sg.addColorStop(0, pal.sky);
    sg.addColorStop(1, pal.skyLow);
    ctx.fillStyle = sg;
    ctx.fillRect(x, y, w, h);
    const sun = ctx.createRadialGradient(x + w * 0.14, y, 0, x + w * 0.14, y, w * 0.5);
    sun.addColorStop(0, hexA("#fff3cc", pal.dark ? 0.2 : 0.6));
    sun.addColorStop(1, hexA("#fff3cc", 0));
    ctx.fillStyle = sun;
    ctx.fillRect(x, y, w, h);
    // Two ridges behind, each washed further toward the sky colour. Aerial
    // perspective is most of what makes a flat drawing read as a landscape,
    // and they are flattened toward the mean height so they read as *other*
    // hills rather than as a halo tracing the one in front.
    let mean = 0;
    for (const v of profile) mean += v;
    mean /= profile.length;
    for (let k = 1; k >= 0; k--) {
      const relief = 0.34 - k * 0.14;
      const lift = 0.03 + k * 0.045;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const v = lerp(mean,
          sampleProfile(profile, clamp01(u * 0.66 + 0.2 + k * 0.13)), relief)
          + lift + noise1(u * 4 + k * 9, seed + 40 + k) * 0.025;
        ctx.lineTo(x + w * u, y + h * (1 - clamp01(v)));
      }
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      const haze = k === 1 ? pal.sky : pal.skyLow;
      const back = ctx.createLinearGradient(0, y, 0, y + h);
      back.addColorStop(0, mix(rock, haze, 0.86 - k * 0.06));
      back.addColorStop(1, mix(rock, haze, 0.62 - k * 0.06));
      ctx.fillStyle = back;
      ctx.fill();
    }
  }

  /* --- bedrock ---------------------------------------------------- */
  const soilDepth = soilOn ? 0.2 : 0;
  ctx.save();
  bandPath(soilDepth, 2);
  ctx.clip();
  const rg = ctx.createLinearGradient(0, y, 0, y + h);
  rg.addColorStop(0, mix(rock, ROCK_LIGHT, 0.28));
  rg.addColorStop(0.4, rock);
  rg.addColorStop(1, mix(rock, ROCK_SHADE, 0.5));
  ctx.fillStyle = rg;
  ctx.fillRect(x, y, w, h);
  // Bedding, then the joints that cut across it. Both are what a student is
  // looking at when they are told a valley "cut down through the rock".
  const BEDS = [0.3, 0.41, 0.47, 0.62, 0.79];
  for (let j = 0; j < BEDS.length; j++) {
    const bandY = y + h * BEDS[j];
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      ctx.lineTo(x + w * u, bandY + noise1(u * 3 + j * 5, seed + j) * h * 0.018);
    }
    for (let i = N; i >= 0; i--) {
      const u = i / N;
      ctx.lineTo(x + w * u, bandY + h * 0.035
        + noise1(u * 3 + j * 5 + 1, seed + j) * h * 0.018);
    }
    ctx.closePath();
    ctx.fillStyle = hexA(j % 2 ? ROCK_LIGHT : ROCK_SHADE, 0.13);
    ctx.fill();
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.22);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  for (let j = 0; j < Math.max(2, Math.round(w / 230)); j++) {
    const jx = x + w * (0.1 + 0.8 * hash21(j * 7.7, seed + 3));
    ctx.beginPath();
    for (let s = 0; s <= 12; s++) {
      ctx.lineTo(jx + noise1(s * 0.5 + j * 4, seed + j) * w * 0.02, y + (h * s) / 12);
    }
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.22);
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  for (let k = 0; k < 500; k++) {
    const a = hash21(k * 1.9, seed + 11), b = hash21(k * 3.3, seed + 13);
    ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.1);
    ctx.beginPath();
    ctx.arc(x + w * a, y + h * b, 0.6 + hash21(k, 17) * 1.7, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  /* --- soil horizons ---------------------------------------------- */
  if (soilOn) {
    const horizons: { d0: number; d1: number; color: string; grit: number }[] = [
      // O and A: dark with humus. B: iron-stained, the orange one. C: broken
      // parent rock on its way to becoming soil.
      { d0: 0, d1: 0.045, color: mix("#31200f", ROCK_LIGHT, pal.dark ? 0.14 : 0), grit: 0.4 },
      { d0: 0.045, d1: 0.12, color: mix("#a8511a", ROCK_LIGHT, pal.dark ? 0.1 : 0), grit: 0.5 },
      { d0: 0.12, d1: 0.2, color: mix(rock, "#c19a68", 0.6), grit: 0.9 },
    ];
    for (const hz of horizons) {
      ctx.save();
      bandPath(hz.d0, hz.d1);
      ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, mix(hz.color, ROCK_LIGHT, 0.22));
      g.addColorStop(1, mix(hz.color, ROCK_SHADE, 0.3));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      const count = Math.round(w * (hz.d1 - hz.d0) * h * 0.02);
      for (let k = 0; k < count; k++) {
        const a = hash21(k * 1.31, seed + hz.d0 * 100);
        const b = hash21(k * 2.71, seed + hz.d1 * 100);
        const px = x + w * a;
        const py = surf(a) + h * (hz.d0 + (hz.d1 - hz.d0) * b);
        const rr = 0.6 + hz.grit * 2.2 * hash21(k, 7);
        ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.16);
        if (hz.grit > 0.7) {
          // The C horizon is angular rubble, not rounded grains: it is rock
          // that has been broken in place, never carried anywhere.
          ctx.beginPath();
          ctx.moveTo(px, py - rr);
          ctx.lineTo(px + rr, py + rr * 0.6);
          ctx.lineTo(px - rr * 0.8, py + rr);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.save();
    bandPath(0, 0.2);
    ctx.clip();
    ctx.strokeStyle = hexA(ROCK_SHADE, 0.4);
    ctx.lineWidth = 1.3;
    for (const d of [0.045, 0.12]) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) ctx.lineTo(x + (w * i) / N, surf(i / N) + h * d);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- vegetation and shoreline ----------------------------------- */
  const wl = opts.waterLevel;
  const waterY = wl === undefined ? y + h * 2 : y + h * (1 - clamp01(wl));
  ctx.save();
  bandPath(0, 0.014);
  ctx.clip();
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const wet = surf(u) > waterY - 2;
    ctx.fillStyle = wet ? mix(pal.sediment, ROCK_LIGHT, 0.25) : grass;
    ctx.fillRect(x + (w * i) / N - 0.5, y, w / N + 1.5, y + h);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let k = 0; k < Math.round(w / 7); k++) {
    const u = hash21(k * 1.7, seed + 21);
    if (surf(u) > waterY - 4) continue;
    const bx = x + w * u, by = surf(u);
    const hh = h * (0.012 + 0.016 * hash21(k, 23));
    ctx.strokeStyle = hexA(mix(grass, k % 2 ? ROCK_LIGHT : ROCK_SHADE, 0.3), 0.85);
    ctx.lineWidth = Math.max(1, h * 0.004);
    ctx.beginPath();
    ctx.moveTo(bx, by + 1);
    ctx.quadraticCurveTo(bx + hh * 0.4, by - hh * 0.6, bx + hh * 0.7, by - hh);
    ctx.stroke();
  }
  ctx.restore();

  /* --- water ------------------------------------------------------ */
  if (wl !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, waterY);
    for (let i = 0; i <= N; i++) {
      ctx.lineTo(x + (w * i) / N, Math.max(waterY, surf(i / N)));
    }
    ctx.lineTo(x + w, waterY);
    ctx.closePath();
    ctx.clip();
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const d = clamp01((surf(u) - waterY) / (h * 0.12));
      const g = ctx.createLinearGradient(0, waterY, 0, surf(u));
      g.addColorStop(0, hexA(mix(pal.water, ROCK_LIGHT, 0.2), 0.78));
      g.addColorStop(1, hexA(pal.waterDeep, 0.6 + 0.35 * d));
      ctx.fillStyle = g;
      ctx.fillRect(x + (w * i) / N - 0.5, waterY, w / N + 1.5, h);
    }
    // Sun on the water, and the ripple lines that give the surface a plane.
    for (let k = 0; k < 26; k++) {
      const u = hash21(k * 2.3, seed + 31);
      const px = x + w * u;
      if (surf(u) < waterY) continue;
      ctx.fillStyle = hexA(ROCK_LIGHT, 0.2 + 0.2 * hash21(k, 33));
      ctx.fillRect(px, waterY + h * 0.012 * hash21(k * 5, 37), w * 0.03, 1.4);
    }
    ctx.restore();
    // The waterline exists only where there is water: over the banks it stops.
    ctx.beginPath();
    let wet = false;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      if (surf(u) > waterY) {
        if (wet) ctx.lineTo(x + w * u, waterY); else ctx.moveTo(x + w * u, waterY);
        wet = true;
      } else wet = false;
    }
    ctx.strokeStyle = hexA(mix(pal.water, ROCK_LIGHT, 0.55), 0.9);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 5. Hand specimens
 * ------------------------------------------------------------------ */

export type RockKind = "igneous" | "sedimentary" | "metamorphic";

/**
 * A hand specimen, the size of the sample a student would actually be given.
 *
 * The three families have to be told apart *by looking*, because that is the
 * skill: igneous is a mosaic of interlocking crystals grown from a melt,
 * sedimentary is layered and made of grains that were carried there and glued
 * together, metamorphic has been squeezed until its minerals lined up into
 * bands. Colour alone would be a lie — plenty of rocks share a colour — so each
 * one is drawn with its own texture.
 */
export function rockSample(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, kind: RockKind, theme: ThemeColors,
) {
  const pal = geoPalette(theme);
  const seed = kind === "igneous" ? 3 : kind === "sedimentary" ? 11 : 23;
  // Shape carries information too: a lava rock breaks blocky, a sandstone
  // breaks into slabs along its bedding, a schist splits into plates.
  const ax = kind === "igneous" ? 1.04 : kind === "sedimentary" ? 1.2 : 1.26;
  const ay = kind === "igneous" ? 0.96 : kind === "sedimentary" ? 0.78 : 0.72;
  const V = kind === "igneous" ? 11 : 14;

  const shape = () => {
    ctx.beginPath();
    for (let i = 0; i <= V; i++) {
      const a = (i / V) * TAU;
      let k = 0.86 + 0.2 * hash21(i % V, seed);
      if (kind === "sedimentary") k *= 1 - 0.12 * Math.abs(Math.sin(a));
      const px = x + Math.cos(a) * r * ax * k;
      const py = y + Math.sin(a) * r * ay * k;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  ctx.save();
  // Contact shadow: the specimen is lying on something.
  const sh = ctx.createRadialGradient(
    x + r * 0.1, y + r * ay * 0.95, 0, x + r * 0.1, y + r * ay * 0.95, r * 1.2,
  );
  sh.addColorStop(0, hexA("#000000", pal.dark ? 0.5 : 0.32));
  sh.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y + r * ay * 0.95, r * 1.15, r * 0.2, 0, 0, TAU);
  ctx.fill();

  shape();
  ctx.save();
  ctx.clip();

  if (kind === "igneous") {
    // Crystals grown from a melt have nowhere to go but into each other, so
    // they interlock with no space between and no preferred direction.
    // Feldspar and quartz make up most of a granite; the dark minerals are the
    // minority, so the mosaic must be mostly pale or it stops being granite.
    const MIN = ["#e08a6e", "#f0b195", "#e9e5f0", "#efe9f4", "#efdcae",
      "#e08a6e", "#241d2e", "#2f4a38"];
    ctx.fillStyle = "#4a3f52";
    ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    // Two passes. Coarse crystals first, so no matrix shows between them, then
    // finer ones grown into the gaps — which is the order a slowly cooling melt
    // actually crystallises in, and why the grains end up interlocking with no
    // cement and no space anywhere.
    for (const pass of [0, 1]) {
      const nx = pass === 0 ? 7 : 11;
      const ny = pass === 0 ? 6 : 9;
      const sc = pass === 0 ? 0.19 : 0.1;
      for (let k = 0; k < nx * ny; k++) {
        const q = k + pass * 137;
        const gx = (k % nx) / (nx - 1), gy = Math.floor(k / nx) / (ny - 1);
        const cx = x + (gx - 0.5 + (hash21(q, seed) - 0.5) * 0.24) * r * 2.5 * ax;
        const cy = y + (gy - 0.5 + (hash21(q * 3, seed + 1) - 0.5) * 0.24) * r * 2.5 * ay;
        const cr = r * (sc + sc * 0.75 * hash21(q * 5, seed + 2));
        const rot = hash21(q * 7, seed + 3) * TAU;
        const col = MIN[Math.floor(hash21(q * 11, seed + 4) * MIN.length) % MIN.length];
        ctx.beginPath();
        const sides = 5 + Math.round(hash21(q * 13, seed + 5) * 2);
        for (let i = 0; i <= sides; i++) {
          const a = rot + (i / sides) * TAU;
          const kk = 0.75 + 0.5 * hash21(i + q * 3, seed + 6);
          const qx = cx + Math.cos(a) * cr * kk * 1.25;
          const qy = cy + Math.sin(a) * cr * kk;
          if (i === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(cx - cr, cy - cr, cx + cr, cy + cr);
        g.addColorStop(0, mix(col, ROCK_LIGHT, 0.42));
        g.addColorStop(0.55, col);
        g.addColorStop(1, mix(col, ROCK_SHADE, 0.4));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = hexA("#000000", 0.32);
        ctx.lineWidth = 0.7;
        ctx.stroke();
        // A flat cleavage face turned toward the key light flashes.
        if (hash21(q * 17, seed + 7) > 0.78) {
          ctx.beginPath();
          ctx.ellipse(cx + KEY.x * cr * 0.5, cy + KEY.y * cr * 0.5,
            cr * 0.42, cr * 0.16, rot, 0, TAU);
          ctx.fillStyle = hexA("#ffffff", 0.5);
          ctx.fill();
        }
      }
    }
  } else if (kind === "sedimentary") {
    // Layers, and rounded grains inside them. Rounded, because they were
    // tumbled downriver before they ever got buried.
    const BEDS = ["#f0cd85", "#a85f24", "#f7e6ba", "#8f4c22", "#e2bd76", "#c17e30", "#d9a95c"];
    const nb = 7;
    for (let j = 0; j < nb; j++) {
      const y0 = y - r * ay + (2 * r * ay * j) / nb;
      const y1 = y0 + (2 * r * ay) / nb;
      const col = BEDS[j % BEDS.length];
      ctx.beginPath();
      ctx.moveTo(x - r * 2, y0);
      for (let i = 0; i <= 16; i++) {
        ctx.lineTo(x - r * 2 + (r * 4 * i) / 16,
          y0 + noise1(i * 0.4 + j * 3, seed) * r * 0.05);
      }
      ctx.lineTo(x + r * 2, y1 + r * 0.1);
      ctx.lineTo(x - r * 2, y1 + r * 0.1);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, mix(col, ROCK_LIGHT, 0.3));
      g.addColorStop(1, mix(col, ROCK_SHADE, 0.28));
      ctx.fillStyle = g;
      ctx.fill();
      // Grain size is the difference between a mudstone and a conglomerate, so
      // the beds are deliberately not all the same grade.
      const coarse = 0.15 + 0.85 * hash21(j, seed + 2);
      for (let k = 0; k < 190; k++) {
        const gx = x + (hash21(k * 1.7, seed + j) - 0.5) * r * 2.6;
        const gy = y0 + hash21(k * 2.9, seed + j * 3) * (y1 - y0);
        const gr = r * 0.012 * (1 + coarse * 2.6) * (0.5 + hash21(k, j));
        const gg = ctx.createRadialGradient(
          gx + KEY.x * gr, gy + KEY.y * gr, 0, gx, gy, gr,
        );
        gg.addColorStop(0, hexA(ROCK_LIGHT, 0.6));
        gg.addColorStop(1, hexA(ROCK_SHADE, 0.35));
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        ctx.lineTo(x - r * 2 + (r * 4 * i) / 16,
          y0 + noise1(i * 0.4 + j * 3, seed) * r * 0.05);
      }
      ctx.strokeStyle = hexA(ROCK_SHADE, 0.5);
      ctx.lineWidth = 1.7;
      ctx.stroke();
    }
  } else {
    // Foliation: minerals forced to grow at right angles to the squeeze, then
    // the whole fabric folded. The bands are bent because the rock flowed.
    const LIGHT = ["#eee0c2", "#d8c395", "#f2e9d6"];
    const DARK = ["#332a44", "#26343f", "#3d2f3a"];
    const nb = 11;
    for (let j = 0; j < nb; j++) {
      const isLight = j % 2 === 0;
      const col = isLight
        ? LIGHT[j % LIGHT.length] : DARK[j % DARK.length];
      const y0 = y - r * ay * 1.2 + (2.4 * r * ay * j) / nb;
      const th = (2.4 * r * ay) / nb;
      const wave = (u: number) => Math.sin(u * 3.4 + j * 0.32) * r * 0.15
        + Math.sin(u * 7.1 + j * 0.2) * r * 0.05;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const u = -1.4 + (2.8 * i) / 24;
        ctx.lineTo(x + u * r * 1.4, y0 + wave(u));
      }
      for (let i = 24; i >= 0; i--) {
        const u = -1.4 + (2.8 * i) / 24;
        ctx.lineTo(x + u * r * 1.4, y0 + th * 1.15 + wave(u));
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, y0 + th);
      g.addColorStop(0, mix(col, ROCK_LIGHT, 0.34));
      g.addColorStop(1, mix(col, ROCK_SHADE, 0.32));
      ctx.fillStyle = g;
      ctx.fill();
      if (!isLight) {
        // Mica flakes all lie in the same plane, so they all catch the light at
        // once: a schist glitters along its foliation and nowhere else.
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const u = -1.4 + (2.8 * i) / 24;
          ctx.lineTo(x + u * r * 1.4, y0 + th * 0.4 + wave(u));
        }
        ctx.strokeStyle = hexA("#ffffff", 0.28);
        ctx.lineWidth = Math.max(1, th * 0.22);
        ctx.stroke();
      }
    }
    // Garnets: grown during metamorphism, and the give-away in a hand specimen.
    for (let k = 0; k < 3; k++) {
      const gx = x + (hash21(k * 3.1, seed) - 0.5) * r * 1.6;
      const gy = y + (hash21(k * 5.7, seed + 1) - 0.5) * r * 1.1;
      const gr = r * (0.09 + 0.05 * hash21(k, seed + 2));
      const g = ctx.createRadialGradient(
        gx + KEY.x * gr, gy + KEY.y * gr, 0, gx, gy, gr,
      );
      g.addColorStop(0, "#e0637a");
      g.addColorStop(0.45, "#a01331");
      g.addColorStop(1, "#4d0517");
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * TAU + 0.4;
        ctx.lineTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = hexA("#ffffff", 0.55);
      ctx.beginPath();
      ctx.ellipse(gx + KEY.x * gr * 0.7, gy + KEY.y * gr * 0.7,
        gr * 0.3, gr * 0.16, -0.7, 0, TAU);
      ctx.fill();
    }
  }

  // Form shading over the texture: the specimen is a solid, not a decal.
  const form = ctx.createRadialGradient(
    x + KEY.x * r * 0.8, y + KEY.y * r * 0.8, r * 0.1, x, y, r * 1.5,
  );
  form.addColorStop(0, hexA(ROCK_LIGHT, 0.3));
  form.addColorStop(0.45, hexA("#000000", 0));
  form.addColorStop(1, hexA("#000000", 0.5));
  ctx.fillStyle = form;
  ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
  ctx.restore();

  // Broken edges: bright where the key light catches them, dark opposite.
  shape();
  ctx.strokeStyle = hexA(ROCK_SHADE, 0.6);
  ctx.lineWidth = Math.max(1.2, r * 0.035);
  ctx.stroke();
  ctx.save();
  shape();
  ctx.clip();
  // The lit chamfer on the upper-left edge and the dark one opposite: the two
  // together are what say "broken lump" rather than "outlined shape".
  ctx.strokeStyle = hexA(ROCK_SHADE, 0.4);
  ctx.lineWidth = Math.max(1.4, r * 0.06);
  ctx.save();
  ctx.translate(r * 0.03, r * 0.04);
  shape();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = hexA(pal.dark ? "#cfe2ff" : "#ffffff", 0.42);
  ctx.lineWidth = Math.max(1, r * 0.045);
  ctx.save();
  ctx.translate(-r * 0.03, -r * 0.04);
  shape();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 6. Magnetic striping
 * ------------------------------------------------------------------ */

/**
 * Polarity chrons of the last 5.2 million years, from the geomagnetic
 * polarity time scale. The intervals are wildly unequal, and that is the point:
 * the pattern is a barcode, not a metronome, which is why finding the same
 * barcode on both sides of a ridge could not be a coincidence.
 */
const CHRONS: { to: number; normal: boolean }[] = [
  { to: 0.78, normal: true },   // Brunhes
  { to: 0.99, normal: false },
  { to: 1.07, normal: true },   // Jaramillo
  { to: 1.77, normal: false },
  { to: 1.95, normal: true },   // Olduvai
  { to: 2.58, normal: false },  // Matuyama
  { to: 3.03, normal: true },   // Gauss
  { to: 3.11, normal: false },  // Kaena
  { to: 3.22, normal: true },
  { to: 3.33, normal: false },  // Mammoth
  { to: 3.58, normal: true },
  { to: 4.18, normal: false },  // Gilbert
  { to: 4.29, normal: true },   // Cochiti
  { to: 4.48, normal: false },
  { to: 4.62, normal: true },   // Nunivak
  { to: 4.80, normal: false },
  { to: 4.89, normal: true },   // Sidufjall
  { to: 4.98, normal: false },
  { to: 5.23, normal: true },   // Thvera
];
const MAX_MA = 5.23;

/**
 * Magnetic stripes on the seafloor, symmetric about a spreading ridge.
 *
 * Lava at the axis freezes and locks in the direction of the Earth's field at
 * that moment. The field flips every so often, so the seafloor records the
 * flips as it is carried away — the same sequence on both sides, ages growing
 * outward. The ship's magnetometer trace along the top is the actual
 * measurement; the coloured bars below it are what that measurement means.
 */
export function seafloorStripes(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, t: number, theme: ThemeColors,
) {
  const pal = geoPalette(theme);
  const normalCol = mix(theme.sci["charge-neg"] ?? "#2f6fc4", "#2438a8", 0.4);
  const reverseCol = mix(theme.sci["current"] ?? "#b8860b", "#ffb62e", 0.42);
  const traceH = h * 0.27;
  const bandTop = y + h * 0.31;
  const bandH = h * 0.44;
  const axisY = y + h * 0.82;
  const half = w / 2;
  const cx = x + half;
  const ageX = (ma: number, side: number) => cx + side * (ma / MAX_MA) * half * 0.96;
  const polarityAt = (u: number) => {
    const ma = (Math.abs(u - 0.5) / 0.48) * MAX_MA;
    for (const c of CHRONS) if (ma <= c.to) return c.normal;
    return true;
  };
  // Seafloor depth grows with the square root of its age — the same cooling law
  // that shapes the ridge in `plateSection`, so the two pictures agree.
  const floorY = (u: number) => bandTop + bandH
    * (0.1 + 0.3 * Math.sqrt(Math.min(1, Math.abs(u - 0.5) / 0.5)));

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.04);
  ctx.clip();
  ctx.fillStyle = pal.dark ? "#0d1522" : "#eef4fb";
  ctx.fillRect(x, y, w, h);

  /* --- ocean above the seafloor ----------------------------------- */
  const og = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH * 0.45);
  og.addColorStop(0, hexA(pal.water, 0.85));
  og.addColorStop(1, hexA(pal.waterDeep, 0.95));
  ctx.fillStyle = og;
  ctx.fillRect(x, bandTop, w, bandH * 0.45);

  /* --- stripes ---------------------------------------------------- */
  let from = 0;
  for (const c of CHRONS) {
    for (const side of [-1, 1]) {
      const x0 = ageX(from, side), x1 = ageX(c.to, side);
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      ctx.beginPath();
      ctx.moveTo(lo, bandTop + bandH);
      for (let i = 0; i <= 12; i++) {
        const px = lo + ((hi - lo) * i) / 12;
        ctx.lineTo(px, floorY((px - x) / w));
      }
      ctx.lineTo(hi, bandTop + bandH);
      ctx.closePath();
      const col = c.normal ? normalCol : reverseCol;
      const g = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
      g.addColorStop(0, mix(col, ROCK_LIGHT, 0.38));
      g.addColorStop(0.3, col);
      g.addColorStop(1, mix(col, ROCK_SHADE, 0.42));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let k = 0; k < 40; k++) {
        const px = lo + (hi - lo) * hash21(k * 1.7, from * 100 + side);
        const py = bandTop + bandH * (0.2 + 0.8 * hash21(k * 2.9, from * 50));
        ctx.fillStyle = hexA(k % 3 ? ROCK_SHADE : ROCK_LIGHT, 0.13);
        ctx.beginPath();
        ctx.arc(px, py, 0.7 + hash21(k, 3) * 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = hexA(ROCK_SHADE, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      // Which way the rock is magnetised, in the widest bars only.
      if (hi - lo > 22) {
        const my = bandTop + bandH * 0.78;
        const dir = c.normal ? 1 : -1;
        const mx = (lo + hi) / 2;
        const len = Math.min(16, (hi - lo) * 0.5);
        ctx.strokeStyle = hexA("#ffffff", 0.85);
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(mx - (dir * len) / 2, my);
        ctx.lineTo(mx + (dir * len) / 2, my);
        ctx.moveTo(mx + (dir * len) / 2, my);
        ctx.lineTo(mx + (dir * len) / 2 - dir * 4, my - 3);
        ctx.moveTo(mx + (dir * len) / 2, my);
        ctx.lineTo(mx + (dir * len) / 2 - dir * 4, my + 3);
        ctx.stroke();
      }
    }
    from = c.to;
  }

  /* --- ridge axis -------------------------------------------------- */
  const crest = floorY(0.5);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const rg = ctx.createRadialGradient(cx, crest, 0, cx, crest, bandH * 0.7);
  const pulse = 0.75 + 0.25 * Math.sin(t * 1.4);
  rg.addColorStop(0, hexA(pal.magmaCore, 0.75 * pulse));
  rg.addColorStop(0.3, hexA(pal.magma, 0.4 * pulse));
  rg.addColorStop(1, hexA(pal.magma, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(x, bandTop - 4, w, bandH + 8);
  ctx.restore();
  magmaBody(ctx, cx, crest + bandH * 0.36, w * 0.03, bandH * 0.14, 1, t, pal);
  ctx.fillStyle = hexA(pal.magmaCore, 0.9);
  ctx.fillRect(cx - w * 0.004, crest, w * 0.008, bandH * 0.4);

  // Seafloor surface, and chevrons carrying the new crust away from the axis.
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) ctx.lineTo(x + (w * i) / 60, floorY(i / 60));
  ctx.strokeStyle = hexA(ROCK_LIGHT, 0.5);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const p = ((t * 0.14 + k / 3) % 1);
      const u = 0.5 + side * p * 0.46;
      const px = x + w * u, py = floorY(u) - h * 0.03;
      ctx.strokeStyle = hexA(ROCK_LIGHT, 0.7 * (1 - p));
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(px - side * 7, py - 5);
      ctx.lineTo(px, py);
      ctx.lineTo(px - side * 7, py + 5);
      ctx.stroke();
    }
  }

  /* --- the magnetometer record ------------------------------------ */
  const zero = y + traceH * 0.62;
  const amp = traceH * 0.34;
  const traceAt = (u: number) => {
    // The real trace is smooth: the ship is towing the magnetometer well above
    // the rock, so the anomaly from each stripe blurs into its neighbours.
    let s = 0;
    for (let k = -3; k <= 3; k++) s += polarityAt(u + k * 0.006) ? 1 : -1;
    return zero - (s / 7) * amp;
  };
  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(x, zero);
    for (let i = 0; i <= 240; i++) ctx.lineTo(x + (w * i) / 240, traceAt(i / 240));
    ctx.lineTo(x + w, zero);
    ctx.closePath();
  };
  // A peak above the line sits over normally magnetised rock and a trough over
  // reversed, so the trace is coloured to match the bars it explains.
  for (const [y0, hh, col] of [
    [y, zero - y, normalCol], [zero, traceH, reverseCol],
  ] as [number, number, string][]) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y0, w, hh);
    ctx.clip();
    tracePath();
    ctx.fillStyle = hexA(col, 0.45);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) ctx.lineTo(x + (w * i) / 240, traceAt(i / 240));
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = hexA(pal.ink, 0.35);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, zero);
  ctx.lineTo(x + w, zero);
  ctx.stroke();
  ctx.setLineDash([]);

  /* --- age scale --------------------------------------------------- */
  ctx.strokeStyle = hexA(pal.ink, 0.55);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.03, axisY);
  ctx.lineTo(x + w * 0.97, axisY);
  ctx.stroke();
  ctx.font = `600 ${Math.max(9, h * 0.055)}px "Source Sans 3", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let ma = 0; ma <= 5; ma++) {
    for (const side of [-1, 1]) {
      if (ma === 0 && side < 0) continue;
      const tx = ageX(ma, side);
      ctx.beginPath();
      ctx.moveTo(tx, axisY - 4);
      ctx.lineTo(tx, axisY + 4);
      ctx.strokeStyle = hexA(pal.ink, 0.55);
      ctx.stroke();
      ctx.fillStyle = hexA(pal.ink, 0.85);
      ctx.fillText(String(ma), tx, axisY + 6);
    }
  }
  // Arrowheads on the axis carry "older outward" without a word of text.
  ctx.strokeStyle = hexA(pal.ink, 0.55);
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    const ex = cx + side * half * 0.965;
    ctx.beginPath();
    ctx.moveTo(ex - side * 7, axisY - 4);
    ctx.lineTo(ex, axisY);
    ctx.lineTo(ex - side * 7, axisY + 4);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = hexA(pal.ink, 0.75);
  ctx.fillText("million years before present", cx, axisY + h * 0.115);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.min(w, h) * 0.04);
  ctx.strokeStyle = hexA(pal.ink, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * 7. Seismic waves
 * ------------------------------------------------------------------ */

/** S waves travel at about 58% of the P speed in crustal rock. */
const S_OVER_P = 0.58;

/**
 * P and S wavefronts spreading from a focus.
 *
 * The two fronts are drawn differently because they *are* different: P is a
 * compression, so it is drawn as a train of squeezed and stretched rings; S is a
 * shear, so its front is drawn kinked side to side. And P always arrives first.
 *
 * The gap between them is the useful part: it widens with distance, so the delay
 * between the P and the S arrival at one station tells you how far away the
 * quake was. Three stations and you have found it.
 */
export function quakeWaves(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, t: number, theme: ThemeColors,
) {
  const pal = geoPalette(theme);
  const pCol = theme.sci["force"] ?? "#c9403f";
  const sCol = theme.sci["field"] ?? "#7a4fc0";
  const K = 3;
  const rate = 0.26;
  let lead = 0;

  ctx.save();
  ctx.lineCap = "round";
  for (let k = 0; k < K; k++) {
    const ph = (t * rate + k / K) % 1;
    if (ph < 0.02) continue;
    lead = Math.max(lead, ph);
    // Amplitude falls as the front spreads over an ever larger circle, which is
    // why a distant earthquake is felt as a gentle roll and a near one is not.
    // Amplitude falls off, but never to nothing: the far front still has to be
    // followable across a classroom.
    const fade = 0.28 + 0.72 * Math.pow(1 - ph, 0.8);
    const rp = ph * r;
    const rs = ph * r * S_OVER_P;

    // P is a compression: a train of squeezed rings, brightest at the front.
    for (let j = 0; j < 3; j++) {
      const rr = rp - j * r * 0.042;
      if (rr <= 0) continue;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TAU);
      ctx.strokeStyle = hexA(pCol, fade * (0.95 - j * 0.28));
      ctx.lineWidth = Math.max(1.5, r * (0.03 - j * 0.008));
      ctx.stroke();
    }
    // S is a shear: the ground moves across the direction of travel, so its
    // front is drawn kinked side to side instead of smooth.
    for (let j = 0; j < 2; j++) {
      const rr = rs - j * r * 0.06;
      if (rr <= 0) continue;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const a = (i / 200) * TAU;
        // The kink is a fraction of the front's own radius, so a young front
        // is a gentle wave rather than a cog.
        const wob = Math.sin(a * 14 + k * 1.7 + j * Math.PI)
          * Math.min(r * 0.032, rr * 0.055);
        const qx = x + Math.cos(a) * (rr + wob);
        const qy = y + Math.sin(a) * (rr + wob);
        if (i === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.closePath();
      ctx.strokeStyle = hexA(sCol, fade * (1 - j * 0.45));
      ctx.lineWidth = Math.max(1.8, r * (0.036 - j * 0.014));
      ctx.stroke();
    }
  }

  /* --- the focus --------------------------------------------------- */
  const beat = Math.pow(Math.max(0, Math.sin((t * rate % 1) * Math.PI)), 3);
  ctx.save();
  if (pal.dark) ctx.globalCompositeOperation = "lighter";
  const fg = ctx.createRadialGradient(x, y, 0, x, y, r * 0.22);
  fg.addColorStop(0, hexA("#fff4cf", 0.95));
  fg.addColorStop(0.3, hexA(pCol, 0.6));
  fg.addColorStop(1, hexA(pCol, 0));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = hexA(pCol, 0.85);
  ctx.lineWidth = Math.max(1.6, r * 0.014);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2;
    const l = r * (0.06 + 0.07 * beat);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.05, y + Math.sin(a) * r * 0.05);
    ctx.lineTo(x + Math.cos(a) * (r * 0.05 + l), y + Math.sin(a) * (r * 0.05 + l));
    ctx.stroke();
  }
  ctx.fillStyle = "#fff8e0";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2.5, r * 0.028), 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexA(ROCK_SHADE, 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  /* --- naming the fronts, and the gap between them ----------------- */
  if (lead > 0.18) {
    const rp = lead * r, rs = lead * r * S_OVER_P;
    const a = -0.62;
    const lx = (rad: number) => x + Math.cos(a) * rad;
    const ly = (rad: number) => y + Math.sin(a) * rad;
    ctx.strokeStyle = hexA(pal.ink, 0.6);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(lx(rs), ly(rs));
    ctx.lineTo(lx(rp), ly(rp));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `700 ${Math.max(13, r * 0.11)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [rad, col, label] of [
      [rp, pCol, "P"], [rs, sCol, "S"],
    ] as [number, string, string][]) {
      const tx = lx(rad + r * 0.06), ty = ly(rad + r * 0.06);
      ctx.strokeStyle = hexA(pal.dark ? "#000000" : "#ffffff", 0.85);
      ctx.lineWidth = 3.5;
      ctx.strokeText(label, tx, ty);
      ctx.fillStyle = col;
      ctx.fillText(label, tx, ty);
    }
    const mx = lx((rp + rs) / 2), my = ly((rp + rs) / 2);
    ctx.font = `600 ${Math.max(10, r * 0.07)}px "Source Sans 3", system-ui, sans-serif`;
    ctx.strokeStyle = hexA(pal.dark ? "#000000" : "#ffffff", 0.85);
    ctx.lineWidth = 3.5;
    ctx.strokeText("S-P gap", mx + r * 0.17, my - r * 0.02);
    ctx.fillStyle = hexA(pal.ink, 0.9);
    ctx.fillText("S-P gap", mx + r * 0.17, my - r * 0.02);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Deterministic 0..1 hash. Nothing in this file calls `Math.random()`: a grain
 * pattern that re-rolls every frame swims, and rock that swims is not rock.
 */
function hash21(i: number, j: number): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth 1-D value noise in -1..1, for boundaries that wander believably. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash21(i, seed) * 2 - 1;
  const b = hash21(i + 1, seed) * 2 - 1;
  return a + (b - a) * u;
}

/** A stable number from a name, so a named bed always looks like itself. */
function charSum(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n += s.charCodeAt(i) * (i + 1);
  return n;
}

/** Catmull-Rom through the profile samples: hillslopes are smooth, not faceted. */
function sampleProfile(p: number[], u: number): number {
  const n = p.length;
  if (n === 1) return p[0];
  const f = clamp01(u) * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  const s = f - i;
  const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * s
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s
    + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s);
}

function clamp01(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function smoothstep(a: number, b: number, u: number): number {
  const t = clamp01((u - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
}

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
