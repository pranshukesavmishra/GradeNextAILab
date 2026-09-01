import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Waves and optics — the media that carry waves, and the light that travels
 * through them.
 *
 * A wave drawn as a sine curve teaches a student that a wave *is* a sine curve.
 * It is not: it is a disturbance passing through a medium whose pieces stay
 * where they are. That distinction — the pattern travels, the matter does not —
 * is the single hardest idea in the topic, and no amount of labelling fixes a
 * picture that fails to show it. So the transverse rope here carries beads that
 * are visibly locked to vertical tracks, and the longitudinal tube carries
 * particles that visibly crowd and thin without ever leaving their patch.
 *
 * Light gets the same treatment. A ray drawn as a 1px line reads as geometry; a
 * ray drawn with a hot core and a soft halo reads as light, and a student who
 * sees light behaving like light will believe the diagram.
 *
 * Everything is layered gradients rather than sprites, so it stays crisp at any
 * zoom, animates per frame, and recolours with the theme.
 */

/* ------------------------------------------------------------------ *
 * Light model
 *
 * One convention, shared with `organic.ts`, `labware.ts` and the scene kit:
 * the key light arrives from the upper left. Specular glints sit up-left of a
 * surface's high point, shadows fall down-right. Consistency here is what makes
 * separately-drawn apparatus read as one scene rather than a collage.
 * ------------------------------------------------------------------ */

const KEY = { x: -0.38, y: -0.42 };

/* ------------------------------------------------------------------ *
 * Wavelength → colour
 * ------------------------------------------------------------------ */

/**
 * A visible wavelength in nanometres, converted to sRGB.
 *
 * This is a real conversion, not a rainbow ramp: 589 nm comes out sodium
 * yellow, 486 nm comes out hydrogen cyan-blue. It matters because students meet
 * these numbers again in spectroscopy, and a diagram that puts green at 600 nm
 * quietly teaches them the wrong lab.
 *
 * Outside 380-780 nm there is no colour to report — the eye has no response —
 * so we return a dim token hue that reads as "off the end of the spectrum".
 */
export function wavelengthColor(nm: number): string {
  const [r, g, b] = wavelengthRGB(nm);
  const hx = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

function wavelengthRGB(nm: number): [number, number, number] {
  // Beyond the visible: indicative only. Ultraviolet reads as a deep violet
  // haze, infrared as a dull ember, so the eye can still follow a diagram
  // across the boundary without believing it can see those bands.
  if (nm < 380) return [58, 26, 96];
  if (nm > 780) return [96, 22, 18];

  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }

  // The eye's response falls away at both ends. A floor keeps the extremes
  // vivid rather than muddy — this is a teaching image, not a photometer.
  let f = 1;
  if (nm < 420) f = 0.45 + 0.55 * (nm - 380) / 40;
  else if (nm > 700) f = 0.45 + 0.55 * (780 - nm) / 80;

  const ch = (v: number) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.78));
  return [ch(r), ch(g), ch(b)];
}

/* ------------------------------------------------------------------ *
 * Transverse waves — the medium moves across the direction of travel
 * ------------------------------------------------------------------ */

export interface TransverseOpts {
  /** Rope/water colour. Defaults to the theme's wave colour. */
  color?: string;
  /** Rope diameter in px. Defaults to a fraction of the amplitude. */
  thickness?: number;
  /** Beads locked to vertical tracks. This is the lesson; use 3-6. */
  markers?: number;
  /** A rope in mid-air, or a water surface with body beneath it. */
  kind?: "rope" | "water";
  /** Dashed equilibrium line. On by default. */
  showRest?: boolean;
  /** Arrow and caption showing which way the pattern travels. */
  showTravel?: boolean;
  /** Arrows on the beads showing instantaneous velocity. On with markers. */
  velocityArrows?: boolean;
}

/**
 * A rope or water surface carrying a travelling transverse wave.
 *
 * `phase` advances with time; the shape slides in +x. The beads do not: each
 * one is pinned to a vertical track and only ever moves up and down it, which
 * is the whole point of a transverse wave and the thing a student is most
 * likely to get wrong. The travelling glint on each crest is what sells the
 * motion — a static sine curve and a moving one look identical in a screenshot
 * unless the light moves with the crests.
 */
export function transverseMedium(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  amp: number, wavelength: number, phase: number,
  theme: ThemeColors,
  opts: TransverseOpts = {},
) {
  const dark = isDarkTheme(theme);
  const kind = opts.kind ?? "rope";
  const color = opts.color
    ?? (kind === "water" ? "#2c9ad8" : (theme.sci["wave"] ?? theme.accent));
  const th = opts.thickness ?? Math.max(4.5, amp * 0.2);
  const k = (Math.PI * 2) / Math.max(1e-6, wavelength);
  const steps = Math.max(48, Math.round(w / 2.5));
  const yAt = (px: number) => y - amp * Math.sin(k * (px - x) - phase);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // The equilibrium line: where every piece of the rope would sit if the wave
  // were switched off. Drawn faint and dashed so it never competes with the
  // wave, but present, because displacement is meaningless without it.
  if (opts.showRest !== false) {
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = hexA(theme.inkSoft, dark ? 0.38 : 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.restore();
  }

  const trace = (dy: number) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const px = x + (w * i) / steps;
      const py = yAt(px) + dy;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  };

  if (kind === "water") {
    // Water has body: the surface is the top of a volume, not a wire. Filling
    // beneath it is what stops the picture reading as a rope drawn in blue.
    const deep = y + amp + th * 6;
    ctx.save();
    trace(0);
    ctx.lineTo(x + w, deep);
    ctx.lineTo(x, deep);
    ctx.closePath();
    const body = ctx.createLinearGradient(0, y - amp, 0, deep);
    body.addColorStop(0, hexA(mix(color, "#ffffff", 0.42), 0.9));
    body.addColorStop(0.25, hexA(color, 0.92));
    body.addColorStop(1, hexA(mix(color, "#04263b", 0.6), 0.96));
    ctx.fillStyle = body;
    ctx.fill();

    // Light refracting through the surface throws bright caustic streaks down
    // into the volume; they collect under the crests, which is the free clue
    // that tells the eye where the crests are even below the surface.
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = hexA("#ffffff", 0.55);
    ctx.lineWidth = Math.max(1.2, th * 0.28);
    for (let cxr = crestStart(x, k, phase, wavelength) - wavelength;
      cxr < x + w + wavelength; cxr += wavelength) {
      ctx.beginPath();
      ctx.moveTo(cxr, yAt(cxr));
      ctx.lineTo(cxr + amp * 0.35, deep);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  // The medium's own thickness, built from stacked strokes: a dark pass sitting
  // low, the body colour, then two progressively brighter and narrower passes
  // riding high. Offsetting the bright passes up-left is what turns a flat
  // ribbon into a cylinder lit from the upper left.
  const passes: Array<[number, string, number]> = kind === "water"
    ? [
      [th * 1.15, shade(color, -0.5), th * 0.22],
      [th * 0.7, mix(color, "#ffffff", 0.35), -th * 0.05],
      [th * 0.26, mix(color, "#ffffff", 0.8), -th * 0.22],
    ]
    : [
      [th * 1.3, shade(color, -0.58), th * 0.3],
      [th * 1.0, color, 0],
      [th * 0.5, shade(color, 0.36), -th * 0.2],
      [th * 0.2, shade(color, 0.74), -th * 0.31],
    ];
  for (const [width, col, dy] of passes) {
    trace(dy);
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  // Travelling specular. Each crest carries a glint that moves with the crest,
  // offset up-left to match the key light. Three nested strokes of shrinking
  // length give the highlight a soft core instead of a hard dash.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y - amp - th * 4, w, amp * 2 + th * 12);
  ctx.clip();
  const glint: Array<[number, number, number]> = [
    [0.30, 0.16, 0.55], [0.18, 0.30, 0.4], [0.085, 0.6, 0.26],
  ];
  for (let cxr = crestStart(x, k, phase, wavelength) - wavelength;
    cxr < x + w + wavelength; cxr += wavelength) {
    if (dark) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = hexA(mix(color, "#ffffff", 0.65), 0.16);
      ctx.lineWidth = th * 1.5;
      ctx.beginPath();
      for (let i = -8; i <= 8; i++) {
        const px = cxr + (wavelength * 0.22 * i) / 8;
        if (i === -8) ctx.moveTo(px, yAt(px)); else ctx.lineTo(px, yAt(px));
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const [span, alpha, width] of glint) {
      ctx.beginPath();
      for (let i = -8; i <= 8; i++) {
        const px = cxr + (wavelength * span * i) / 8 + KEY.x * th * 0.5;
        const py = yAt(px) + KEY.y * th * 0.5;
        if (i === -8) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hexA("#ffffff", alpha);
      ctx.lineWidth = th * width;
      ctx.stroke();
    }
  }
  ctx.restore();

  // Beads. Each one sits on a vertical track it can never leave: the medium
  // moves at right angles to the direction the wave travels, and drawing the
  // track makes that a visible constraint rather than a claim in a caption.
  const m = opts.markers ?? 0;
  for (let i = 0; i < m; i++) {
    const px = x + w * ((i + 0.5) / m);
    const py = yAt(px);
    const beadR = Math.max(3.5, th * 0.72);

    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = hexA(theme.ink, dark ? 0.34 : 0.28);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, y - amp - beadR * 1.6);
    ctx.lineTo(px, y + amp + beadR * 1.6);
    ctx.stroke();
    ctx.restore();

    // End caps on the track, so its extent reads as a fixed range of travel.
    ctx.strokeStyle = hexA(theme.ink, dark ? 0.45 : 0.35);
    ctx.lineWidth = 1.4;
    for (const cap of [y - amp - beadR * 1.6, y + amp + beadR * 1.6]) {
      ctx.beginPath();
      ctx.moveTo(px - 4, cap);
      ctx.lineTo(px + 4, cap);
      ctx.stroke();
    }

    // Displacement: the offset from rest, drawn as a solid bar the eye can
    // measure against the dashed rest line.
    ctx.strokeStyle = hexA(theme.accent, 0.75);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, py);
    ctx.stroke();

    if (opts.velocityArrows !== false) {
      // Velocity is the time derivative, so it peaks at the rest line and
      // vanishes at the crests — the opposite of where students expect, which
      // is exactly why it is worth drawing.
      const v = Math.cos(k * (px - x) - phase);
      const len = beadR * 1.4 + Math.abs(v) * amp * 0.5;
      if (Math.abs(v) > 0.06) {
        // A white underlay, because the velocity colour and the wave colour are
        // often the same token and an arrow the colour of the rope is no arrow.
        arrow(ctx, px, py, px, py + Math.sign(v) * len,
          hexA(dark ? "#ffffff" : "#ffffff", 0.85), 4.6, 8);
        arrow(ctx, px, py, px, py + Math.sign(v) * len,
          hexA(theme.sci["acceleration"] ?? "#e0894a", 1), 2.2, 6);
      }
    }

    bead(ctx, px, py, beadR, mix(color, "#ffffff", 0.25));
  }

  if (opts.showTravel) {
    // The pattern's direction, stated once, above the medium. Paired with the
    // vertical tracks below it, the two arrows are the whole lesson in one look.
    const ay = y - amp - th * 2 - 16;
    arrow(ctx, x + w * 0.58, ay, x + w * 0.9, ay, hexA(theme.ink, 0.8), 2.2, 8);
    ctx.font = '600 11px "Source Sans 3", system-ui, sans-serif';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexA(theme.ink, 0.8);
    ctx.fillText("wave travels", x + w * 0.55, ay);
  }
  ctx.restore();
}

/** x of the first crest at or after `x0`. Crests are where sin() peaks. */
function crestStart(x0: number, k: number, phase: number, wavelength: number): number {
  return x0 + mod((Math.PI / 2 + phase) / k, wavelength);
}

/* ------------------------------------------------------------------ *
 * Longitudinal waves — the medium moves along the direction of travel
 * ------------------------------------------------------------------ */

/**
 * A tube of particles carrying a longitudinal (sound) wave, with its density
 * trace directly beneath.
 *
 * Each particle oscillates about a fixed home position along the tube's axis;
 * where neighbours lean toward each other you get a compression, where they
 * lean apart, a rarefaction. Nothing is transported but the pattern.
 *
 * The trace beneath is the same wave in the representation students meet in
 * exams — a sine curve of pressure against distance — and the dashed connectors
 * exist so the two are read as one thing. Students who never see them linked
 * end up believing sound "is" a wavy line.
 */
export function longitudinalMedium(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wavelength: number, phase: number,
  theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const k = (Math.PI * 2) / Math.max(1e-6, wavelength);
  // Displacement amplitude must stay under λ/2π or neighbouring particles cross
  // over each other, which is physically impossible and looks like a bug.
  const A = wavelength * 0.128;
  const bandH = h * 0.6;
  const gap = h * 0.09;
  const traceH = Math.max(18, h - bandH - gap);
  const bandTop = y;
  const traceTop = y + bandH + gap;
  const particleColor = theme.sci["gas"] ?? theme.accent;

  ctx.save();

  // The tube. A closed column of gas, lit from the upper left so the top wall
  // catches the key and the bottom falls into shadow.
  ctx.beginPath();
  roundRectPath(ctx, x, bandTop, w, bandH, Math.min(14, bandH * 0.2));
  const tube = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
  tube.addColorStop(0, dark ? "#1b1526" : "#ffffff");
  tube.addColorStop(0.5, dark ? "#120e1a" : "#f2ecf8");
  tube.addColorStop(1, dark ? "#0b0811" : "#dfd4ec");
  ctx.fillStyle = tube;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Pressure shading behind the particles. More particles per unit length
  // means more scattering, so compressions glow; it also gives the eye the
  // banded structure at a glance, before it starts counting dots.
  const bandsGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  for (let i = 0; i <= 60; i++) {
    const s = (w * i) / 60;
    const u = (1 - Math.cos(k * s - phase)) / 2;
    bandsGrad.addColorStop(i / 60, hexA(
      dark ? particleColor : mix(particleColor, "#3a1e04", 0.35),
      (dark ? 0.06 : 0.04) + u * (dark ? 0.32 : 0.4),
    ));
  }
  ctx.fillStyle = bandsGrad;
  ctx.fillRect(x, bandTop, w, bandH);

  const rows = 6;
  const cols = Math.max(20, Math.round((w / wavelength) * 11));
  const pr = Math.max(1.9, Math.min(3.4, bandH / (rows * 4)));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const id = j * cols + i;
      // Jitter keeps the field from reading as a printed lattice, and is fixed
      // per particle so nothing swims between frames.
      const s0 = ((i + 0.5) / cols) * w + (hash(id) - 0.5) * (w / cols) * 0.75;
      const py = bandTop + bandH * ((j + 0.5) / rows)
        + (hash(id + 7919) - 0.5) * (bandH / rows) * 0.7;
      const s = s0 + A * Math.sin(k * s0 - phase);
      const u = (1 - Math.cos(k * s0 - phase)) / 2;
      // Brightness tracks local density; the radius never changes, because the
      // particles themselves are not being squashed — only their spacing is.
      const col = dark
        ? mix(particleColor, "#ffffff", 0.12 + u * 0.5)
        : mix(particleColor, "#2e1703", 0.42 - u * 0.4);
      const g = ctx.createRadialGradient(
        x + s + KEY.x * pr, py + KEY.y * pr, 0, x + s, py, pr,
      );
      g.addColorStop(0, hexA(mix(col, "#ffffff", 0.55), 0.95));
      g.addColorStop(0.55, hexA(col, 0.9));
      g.addColorStop(1, hexA(shade(col, -0.45), 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + s, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Glass on the tube: a bright top edge and a soft inner shadow at the base.
  ctx.beginPath();
  roundRectPath(ctx, x, bandTop, w, bandH, Math.min(14, bandH * 0.2));
  ctx.strokeStyle = hexA(dark ? "#cbb8d8" : "#6a5a78", 0.55);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", dark ? 0.22 : 0.75);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 8, bandTop + 1.4);
  ctx.lineTo(x + w - 8, bandTop + 1.4);
  ctx.stroke();

  /* --- the same wave, as a density trace ---------------------------- */

  const mid = traceTop + traceH / 2;
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, mid);
  ctx.lineTo(x + w, mid);
  ctx.stroke();
  ctx.setLineDash([]);

  const dens = (s: number) => -Math.cos(k * s - phase);
  ctx.beginPath();
  ctx.moveTo(x, mid);
  for (let i = 0; i <= 120; i++) {
    const s = (w * i) / 120;
    ctx.lineTo(x + s, mid - dens(s) * traceH * 0.42);
  }
  ctx.lineTo(x + w, mid);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, traceTop, 0, traceTop + traceH);
  fill.addColorStop(0, hexA(particleColor, 0.5));
  fill.addColorStop(0.5, hexA(particleColor, 0.14));
  fill.addColorStop(1, hexA(particleColor, 0.5));
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const s = (w * i) / 120;
    const py = mid - dens(s) * traceH * 0.42;
    if (i === 0) ctx.moveTo(x + s, py); else ctx.lineTo(x + s, py);
  }
  ctx.strokeStyle = shade(particleColor, -0.3);
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Connectors. A compression in the tube sits directly above a peak in the
  // trace; without the line drawn, most students never notice.
  ctx.font = '700 9px "Source Sans 3", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const placed: number[] = [];
  for (const [offset, label, col] of [
    [0.5, "compression", theme.sci["hot"] ?? "#d1544a"],
    [0, "rarefaction", theme.sci["cold"] ?? "#3f86c8"],
  ] as const) {
    let first = true;
    for (let n = -1; n < w / wavelength + 1; n++) {
      const s = wavelength * (offset + phase / (Math.PI * 2) + n);
      if (s < 6 || s > w - 6) continue;
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = hexA(col, 0.65);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + s, bandTop + bandH);
      ctx.lineTo(x + s, mid - dens(s) * traceH * 0.42);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x + s, mid - dens(s) * traceH * 0.42, 3, 0, Math.PI * 2);
      ctx.fill();
      const clear = placed.every((q) => Math.abs(q - s) > 78);
      if (first && clear && traceH > 22 && s > 38 && s < w - 38) {
        ctx.fillStyle = hexA(col, 0.95);
        ctx.fillText(label, x + s, bandTop + bandH + gap * 0.5);
        placed.push(s);
        first = false;
      }
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Rays and beams
 * ------------------------------------------------------------------ */

export interface RayOpts {
  /** Needed to pick an additive or a subtractive glow. Assume dark if absent. */
  theme?: ThemeColors;
  /** Core width in px. The halo scales from it. */
  width?: number;
  /** 0-1 brightness. */
  intensity?: number;
  /** Arrowhead at the far end; a number sets its length in px. */
  arrow?: boolean | number;
  /** Dashed, for a construction ray rather than a real beam. */
  dash?: boolean;
  /** 0-1 opacity at the far end, for a beam that fades as it spreads. */
  fadeTo?: number;
}

/**
 * A ray of light: additive hot core, soft coloured halo, optional arrowhead.
 *
 * Light is not a line. A 1px stroke reads as the *path* of light, an abstraction
 * students have to be taught to decode; a core that blows out to white inside a
 * coloured haze reads as light itself, which needs no decoding.
 *
 * `colorHue` takes either a hue in degrees (0 red, 120 green, 240 blue) or any
 * hex colour, so a caller can hand it `wavelengthColor(486)` directly.
 */
export function waveRay(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  colorHue: number | string,
  opts: RayOpts = {},
) {
  const col = typeof colorHue === "number" ? hslHex(colorHue, 0.95, 0.56) : colorHue;
  // Additive blending is how light behaves, and it is what makes overlapping
  // beams brighten where they cross. On a pale background it is invisible —
  // white plus anything is still white — so a light theme gets a saturated
  // core and a coloured haze instead, which reads as glow against paper.
  const dark = opts.theme ? isDarkTheme(opts.theme) : true;
  const inten = clamp01(opts.intensity ?? 1);
  if (inten <= 0.005) return;
  const wd = opts.width ?? 3;

  ctx.save();
  ctx.lineCap = "round";
  if (opts.dash) ctx.setLineDash([wd * 3.5, wd * 2.6]);
  if (dark) ctx.globalCompositeOperation = "lighter";

  const layers: Array<[number, string, number]> = dark
    ? [
      [wd * 6.5, col, 0.09 * inten],
      [wd * 3.0, col, 0.2 * inten],
      [wd * 1.25, mix(col, "#ffffff", 0.4), 0.7 * inten],
      [wd * 0.45, "#ffffff", 0.9 * inten],
    ]
    : [
      [wd * 6.5, col, 0.1 * inten],
      [wd * 3.0, col, 0.28 * inten],
      [wd * 1.25, col, 0.9 * inten],
      [wd * 0.45, mix(col, "#ffffff", 0.72), 0.95 * inten],
    ];

  for (const [width, c, alpha] of layers) {
    ctx.lineWidth = width;
    if (opts.fadeTo !== undefined) {
      // A beam that spreads loses intensity along its length; a flat stroke
      // makes a torch look like a laser.
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, hexA(c, alpha));
      g.addColorStop(1, hexA(c, alpha * clamp01(opts.fadeTo)));
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = hexA(c, alpha);
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  if (opts.arrow) {
    const size = typeof opts.arrow === "number" ? opts.arrow : Math.max(7, wd * 3);
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.setLineDash([]);
    const head = (scale: number, c: string, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.42) * size * scale, y2 - Math.sin(a - 0.42) * size * scale);
      ctx.lineTo(x2 - Math.cos(a) * size * scale * 0.62, y2 - Math.sin(a) * size * scale * 0.62);
      ctx.lineTo(x2 - Math.cos(a + 0.42) * size * scale, y2 - Math.sin(a + 0.42) * size * scale);
      ctx.closePath();
      ctx.fillStyle = hexA(c, alpha);
      ctx.fill();
    };
    head(1.45, col, 0.22 * inten);
    head(1, dark ? mix(col, "#ffffff", 0.45) : col, 0.95 * inten);
    head(0.5, dark ? "#ffffff" : mix(col, "#ffffff", 0.7), 0.95 * inten);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Spectra
 * ------------------------------------------------------------------ */

export interface SpectrumOpts {
  /** Wavelength ticks below the band. On by default. */
  ticks?: boolean;
  /**
   * A labelled strip showing where the visible band sits in the whole EM
   * spectrum. It is drawn in the space ABOVE the band, needing about 1.6x the
   * band height of headroom.
   */
  emStrip?: boolean;
  /** Drop a marker on one wavelength, e.g. a laser line. */
  markNm?: number;
}

/**
 * The visible spectrum as a physical strip of light.
 *
 * Colours come from a real wavelength-to-sRGB conversion, so the yellow sits
 * where sodium sits and the band is narrow where the eye's yellow response is
 * narrow. A hand-picked rainbow gradient gets this wrong in exactly the places
 * students are later asked about.
 */
export function spectrumBand(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fromNm: number, toNm: number,
  theme: ThemeColors,
  opts: SpectrumOpts = {},
) {
  const dark = isDarkTheme(theme);
  const r = Math.min(6, h * 0.22);
  ctx.save();

  // The band itself. Enough stops that the eye reads a continuum; too few and
  // the sharp turns near 490 and 580 nm flatten into bands that are not there.
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  const stops = 90;
  for (let i = 0; i <= stops; i++) {
    const nm = fromNm + ((toNm - fromNm) * i) / stops;
    g.addColorStop(i / stops, wavelengthColor(nm));
  }
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  // Glass over emitted light: a sheen on the upper half and a lit top edge,
  // so the strip reads as a lit object rather than a printed swatch.
  ctx.save();
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, y, 0, y + h);
  sheen.addColorStop(0, hexA("#ffffff", 0.42));
  sheen.addColorStop(0.42, hexA("#ffffff", 0.06));
  sheen.addColorStop(0.55, hexA("#000000", 0.02));
  sheen.addColorStop(1, hexA("#000000", 0.26));
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = hexA(dark ? "#d8c9e4" : "#4c4058", 0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (opts.ticks !== false) {
    const span = toNm - fromNm;
    const step = span > 600 ? 100 : span > 250 ? 50 : span > 120 ? 25 : 10;
    ctx.font = '600 10px "Source Sans 3", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const first = Math.ceil(fromNm / step) * step;
    for (let nm = first; nm <= toNm; nm += step) {
      const px = x + ((nm - fromNm) / span) * w;
      ctx.strokeStyle = hexA(theme.inkSoft, 0.65);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, y + h + 1);
      ctx.lineTo(px, y + h + 5);
      ctx.stroke();
      ctx.fillStyle = hexA(theme.ink, 0.8);
      ctx.fillText(nm === first ? `${nm} nm` : `${nm}`, px, y + h + 7);
    }
  }

  if (opts.markNm !== undefined && opts.markNm >= fromNm && opts.markNm <= toNm) {
    const px = x + ((opts.markNm - fromNm) / (toNm - fromNm)) * w;
    const col = wavelengthColor(opts.markNm);
    ctx.strokeStyle = hexA("#ffffff", 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, y - 3);
    ctx.lineTo(px, y + h + 3);
    ctx.stroke();
    ctx.strokeStyle = hexA("#000000", 0.45);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // A pill in the light's own colour: the label and the thing agree.
    const text = `${Math.round(opts.markNm)} nm`;
    ctx.font = '700 11px "Bricolage Grotesque", system-ui, sans-serif';
    const pw = ctx.measureText(text).width + 16;
    const py = y - 24;
    ctx.beginPath();
    roundRectPath(ctx, px - pw / 2, py, pw, 18, 9);
    const pg = ctx.createLinearGradient(0, py, 0, py + 18);
    pg.addColorStop(0, mix(col, "#ffffff", 0.25));
    pg.addColorStop(1, mix(col, "#000000", 0.3));
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, px, py + 9.5);
  }

  if (opts.emStrip) emSpectrumStrip(ctx, x, y, w, h, fromNm, toNm, theme);
  ctx.restore();
}

/** The whole EM spectrum on a log axis, with the visible slice called out. */
function emSpectrumStrip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fromNm: number, toNm: number,
  theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const sh = Math.max(16, h * 0.68);
  const sy = y - sh - Math.max(26, h * 0.9);
  // Log wavelength in metres, gamma (1e-13) through radio (1e3).
  const lo = -13, hi = 3;
  const px = (metres: number) => x + ((Math.log10(metres) - lo) / (hi - lo)) * w;

  const bands: Array<[number, number, string, string]> = [
    [1e-13, 1e-11, "gamma", "#5b2e8c"],
    [1e-11, 1e-8, "X-ray", "#3f4fb0"],
    [1e-8, 3.8e-7, "UV", "#7a3fd0"],
    [3.8e-7, 7.8e-7, "visible", "#ffffff"],
    [7.8e-7, 1e-3, "infrared", "#c0392b"],
    [1e-3, 1e-1, "microwave", "#b06a1f"],
    [1e-1, 1e3, "radio", "#3d6b52"],
  ];

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, sy, w, sh, 4);
  ctx.save();
  ctx.clip();
  for (const [a, b, label, col] of bands) {
    const x0 = px(a), x1 = px(b);
    if (label === "visible") {
      // The payoff: everything a human eye can see is this sliver. Painting it
      // with the real spectrum next to the dull blocks makes the point without
      // a sentence of text.
      const vg = ctx.createLinearGradient(x0, 0, x1, 0);
      for (let i = 0; i <= 20; i++) vg.addColorStop(i / 20, wavelengthColor(380 + (400 * i) / 20));
      ctx.fillStyle = vg;
      ctx.fillRect(x0, sy, Math.max(2.5, x1 - x0), sh);
      continue;
    }
    const bg = ctx.createLinearGradient(0, sy, 0, sy + sh);
    bg.addColorStop(0, mix(col, "#ffffff", dark ? 0.22 : 0.4));
    bg.addColorStop(1, mix(col, "#000000", dark ? 0.45 : 0.2));
    ctx.fillStyle = bg;
    ctx.fillRect(x0, sy, x1 - x0, sh);
    ctx.strokeStyle = hexA("#000000", 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, sy);
    ctx.lineTo(x1, sy + sh);
    ctx.stroke();
    ctx.font = '700 9px "Source Sans 3", system-ui, sans-serif';
    const cap = label.toUpperCase();
    if (ctx.measureText(cap).width < x1 - x0 - 8) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = hexA("#ffffff", 0.95);
      ctx.fillText(cap, (x0 + x1) / 2, sy + sh / 2);
    }
  }
  ctx.restore();
  ctx.strokeStyle = hexA(dark ? "#d8c9e4" : "#4c4058", 0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Connectors fanning from the sliver down to the full-width band below,
  // the visual equivalent of "and here it is, magnified".
  const vx0 = px(fromNm * 1e-9), vx1 = px(toNm * 1e-9);
  ctx.beginPath();
  ctx.moveTo(vx0, sy + sh);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(vx1, sy + sh);
  ctx.closePath();
  ctx.fillStyle = hexA(theme.accent, dark ? 0.13 : 0.1);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.accent, 0.55);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(vx0, sy + sh);
  ctx.lineTo(x, y);
  ctx.moveTo(vx1, sy + sh);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Wavefronts, interference and the Doppler effect
 * ------------------------------------------------------------------ */

export interface WavefrontOpts {
  /** Crest colour. Defaults to the theme's wave colour. */
  color?: string;
  /** Outer radius the fronts fade out by. Defaults to 12 x spacing. */
  maxR?: number;
  /** A second source, for interference. */
  second?: { x: number; y: number };
  /**
   * Render the continuous displacement field, not just the crest lines. On by
   * default whenever there are two sources, because the bright and dark bands
   * between them ARE the interference pattern.
   */
  field?: boolean;
  /** Region the field is painted into. Defaults to the sources' reach. */
  clip?: { x: number; y: number; w: number; h: number };
  /**
   * Source displacement per period. Non-zero gives the Doppler picture: each
   * front is centred where the source WAS when it emitted that front.
   */
  motion?: { vx: number; vy: number };
  /** Dashed lines of permanent stillness between two sources. */
  nodalLines?: boolean;
  /** Draw the emitters. On by default. */
  showSources?: boolean;
}

/**
 * Circular wavefronts expanding from one or two point sources.
 *
 * Each ring is a crest, and the spacing between rings is one wavelength. Two
 * things fall straight out of that and are worth the extra code:
 *
 *  - Give the source a velocity and the rings bunch ahead of it and stretch
 *    behind, because each was emitted from a different place. That is the whole
 *    Doppler effect, and it is a consequence of the drawing rather than an
 *    effect painted on top of it.
 *  - Add a second source and the fields add. Where two crests meet you get a
 *    double-height crest; where a crest meets a trough you get flat water. The
 *    field render below computes that sum honestly, so the bright and dark
 *    fringes appear because they must, not because they were drawn in.
 */
export function wavefronts(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, count: number, spacing: number, phase: number,
  theme: ThemeColors,
  opts: WavefrontOpts = {},
) {
  const dark = isDarkTheme(theme);
  const color = opts.color ?? (theme.sci["wave"] ?? theme.accent);
  const maxR = opts.maxR ?? spacing * Math.max(3, count);
  const k = (Math.PI * 2) / Math.max(1e-6, spacing);
  const s2 = opts.second;
  const wantField = opts.field ?? Boolean(s2);

  ctx.save();
  if (opts.clip) {
    ctx.beginPath();
    ctx.rect(opts.clip.x, opts.clip.y, opts.clip.w, opts.clip.h);
    ctx.clip();
  }

  if (wantField) {
    drawField(ctx, cx, cy, s2, k, phase, maxR, color, dark, opts.clip);
  }

  // Crest rings. Amplitude falls as 1/sqrt(r) because a circular wave spreads
  // its energy over a growing circumference — a ring drawn at constant weight
  // implies energy appearing from nowhere.
  const rings = (ox: number, oy: number, drift: { vx: number; vy: number } | undefined) => {
    for (let n = 0; n <= count + 1; n++) {
      const r = spacing * (0.25 + phase / (Math.PI * 2) + n);
      if (r <= spacing * 0.12 || r > maxR) continue;
      const age = n + 0.25 + phase / (Math.PI * 2);
      const sx = ox - (drift ? drift.vx * age : 0);
      const sy = oy - (drift ? drift.vy * age : 0);
      const fall = Math.pow(spacing / r, 0.5) * (1 - Math.pow(r / maxR, 3));
      const a = clamp01(fall) * (dark ? 0.85 : 0.7);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = hexA(mix(color, dark ? "#ffffff" : "#000000", 0.15), a * 0.5);
      ctx.lineWidth = Math.max(1, spacing * 0.1);
      ctx.stroke();
      ctx.strokeStyle = hexA(dark ? mix(color, "#ffffff", 0.75) : color, a * 0.95);
      ctx.lineWidth = Math.max(0.7, spacing * 0.035);
      ctx.stroke();
    }
  };
  rings(cx, cy, opts.motion);
  if (s2) rings(s2.x, s2.y, opts.motion);

  if (s2 && opts.nodalLines) nodalHyperbolae(ctx, cx, cy, s2.x, s2.y, spacing, theme);

  if (opts.showSources !== false) {
    const emit = (ex: number, ey: number) => {
      const rr = Math.max(4, spacing * 0.22);
      // A pulsing halo locked to the phase, so the source visibly drives the
      // rings instead of sitting inert at their centre.
      const pulse = 0.55 + 0.45 * Math.sin(phase);
      ctx.save();
      if (dark) ctx.globalCompositeOperation = "lighter";
      const gl = ctx.createRadialGradient(ex, ey, 0, ex, ey, rr * (2.6 + pulse));
      gl.addColorStop(0, hexA(mix(color, "#ffffff", 0.6), 0.75));
      gl.addColorStop(0.4, hexA(color, 0.3 * pulse));
      gl.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(ex, ey, rr * (2.6 + pulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      bead(ctx, ex, ey, rr, mix(color, "#ffffff", 0.55));
    };
    emit(cx, cy);
    if (s2) emit(s2.x, s2.y);
  }
  ctx.restore();
}

let scratch: HTMLCanvasElement | null = null;

/**
 * The summed displacement field, painted at a third of the resolution and
 * scaled up. Sampling every pixel would be exact and far too slow; a smooth
 * upscale of a coarse grid is indistinguishable here because the field itself
 * has no detail finer than half a wavelength.
 */
function drawField(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  s2: { x: number; y: number } | undefined,
  k: number, phase: number, maxR: number,
  color: string, dark: boolean,
  clip?: { x: number; y: number; w: number; h: number },
) {
  if (typeof document === "undefined") return;
  const rx = clip ? clip.x : Math.min(cx, s2 ? s2.x : cx) - maxR;
  const ry = clip ? clip.y : Math.min(cy, s2 ? s2.y : cy) - maxR;
  const rw = clip ? clip.w : (Math.max(cx, s2 ? s2.x : cx) + maxR) - rx;
  const rh = clip ? clip.h : (Math.max(cy, s2 ? s2.y : cy) + maxR) - ry;
  if (rw <= 2 || rh <= 2) return;

  const step = 3;
  const cw = Math.max(2, Math.ceil(rw / step));
  const ch = Math.max(2, Math.ceil(rh / step));
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width !== cw || scratch.height !== ch) {
    scratch.width = cw;
    scratch.height = ch;
  }
  const sctx = scratch.getContext("2d");
  if (!sctx) return;
  const img = sctx.createImageData(cw, ch);
  const data = img.data;
  // On a dark ground a crest is light and a trough is nothing. On a pale
  // ground a crest cannot be lighter than the page, so it carries the colour
  // instead and the troughs go dark: the same pattern, read by hue and depth.
  const crest = hexRGB(dark ? mix(color, "#ffffff", 0.7) : mix(color, "#ffffff", 0.05));
  const trough = hexRGB(dark ? "#05080f" : "#0d1b33");

  for (let j = 0; j < ch; j++) {
    const py = ry + (j + 0.5) * step;
    for (let i = 0; i < cw; i++) {
      const px = rx + (i + 0.5) * step;
      let u = 0;
      const r1 = Math.hypot(px - cx, py - cy);
      if (r1 < maxR) {
        u += Math.sin(k * r1 - phase) * Math.pow(1 / Math.max(0.35, r1 * k * 0.16), 0.5)
          * (1 - Math.pow(r1 / maxR, 3));
      }
      if (s2) {
        const r2 = Math.hypot(px - s2.x, py - s2.y);
        if (r2 < maxR) {
          u += Math.sin(k * r2 - phase) * Math.pow(1 / Math.max(0.35, r2 * k * 0.16), 0.5)
            * (1 - Math.pow(r2 / maxR, 3));
        }
      }
      const v = Math.max(-1, Math.min(1, u * 0.9));
      const c = v >= 0 ? crest : trough;
      const o = (j * cw + i) * 4;
      data[o] = c[0];
      data[o + 1] = c[1];
      data[o + 2] = c[2];
      data[o + 3] = Math.round(Math.abs(v) * (dark ? 190 : 150));
    }
  }
  sctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(scratch, 0, 0, cw, ch, rx, ry, cw * step, ch * step);
  ctx.restore();
}

/**
 * The lines of permanent stillness between two sources.
 *
 * Points whose distance to the two sources differs by half a wavelength (or one
 * and a half, or two and a half...) always receive a crest from one source at
 * the moment they receive a trough from the other, so they never move. The
 * locus of a constant difference of distances is a hyperbola — which is why the
 * quiet lines in a ripple tank curve the way they do.
 */
function nodalHyperbolae(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  wavelength: number, theme: ThemeColors,
) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const sep = Math.hypot(dx, dy);
  if (sep < 1e-3) return;
  const c = sep / 2;
  const ux = dx / sep, uy = dy / sep;
  const vx = -uy, vy = ux;

  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = hexA(theme.ink, isDarkTheme(theme) ? 0.42 : 0.34);
  ctx.lineWidth = 1.2;
  for (let m = 0; ; m++) {
    const a = ((m + 0.5) * wavelength) / 2;
    if (a >= c) break;
    const b = Math.sqrt(c * c - a * a);
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const tt = -2.2 + (4.4 * i) / 40;
        const p = sign * a * Math.cosh(tt);
        const q = b * Math.sinh(tt);
        const px = mx + p * ux + q * vx;
        const py = my + p * uy + q * vy;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Dispersion through a prism
 * ------------------------------------------------------------------ */

interface Pt { x: number; y: number }

/**
 * Refractive index of the prism glass at a wavelength, by Cauchy's equation.
 *
 * B is set well above a real crown glass (about four times), because a true
 * prism of this size would fan white light through barely two degrees and the
 * spectrum would be a smudge. The exaggeration is the only liberty taken here:
 * the direction of the effect, the order of the colours and the fact that
 * violet bends most are all exactly right, and they are what is being taught.
 */
function prismIndex(nm: number): number {
  const um = nm / 1000;
  return 1.5 + 0.03 / (um * um);
}

/**
 * White light entering a glass prism and leaving as a spectrum.
 *
 * The light path is not drawn by hand. Every ray is refracted through Snell's
 * law at both faces using its own wavelength's refractive index, so violet
 * really does bend further than red, the fan really does open only after the
 * second surface, and if the geometry were changed to bounce a ray past the
 * critical angle it would visibly reflect inside the glass instead of leaving.
 *
 * The prism is tilted so the beam crosses it at minimum deviation, which is how
 * a prism is actually set up on a bench, and it is why the path in and the path
 * out are mirror images.
 *
 * `(x, y)` is the centre of the prism and `size` its side length. The spectrum
 * leaves the right-hand face heading down and right: leave roughly 2x size of
 * room in that direction.
 */
export function prismDispersion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, t: number,
  theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const H = (size * Math.sqrt(3)) / 2;
  const tilt = 0.4014; // 23 degrees: puts the mid-spectrum at minimum deviation.
  const rot = (p: Pt): Pt => ({
    x: x + p.x * Math.cos(tilt) - p.y * Math.sin(tilt),
    y: y + p.x * Math.sin(tilt) + p.y * Math.cos(tilt),
  });
  const A = rot({ x: 0, y: (-2 * H) / 3 });
  const B = rot({ x: -size / 2, y: H / 3 });
  const C = rot({ x: size / 2, y: H / 3 });
  const verts = [A, B, C];

  const entry = rot({ x: -size / 4, y: -H / 6 });
  const d0: Pt = { x: 1, y: 0 };
  const inLen = size * 1.5;
  const throwLen = size * 2.6;
  const flicker = 0.94 + 0.06 * Math.sin(t * 2.1);

  ctx.save();

  // Ground shadow. Glass is not opaque, so the shadow is soft and thin — but
  // without one the prism floats.
  const sg = ctx.createRadialGradient(
    A.x, C.y + size * 0.1, 0, A.x, C.y + size * 0.1, size * 0.75,
  );
  sg.addColorStop(0, hexA("#000000", dark ? 0.5 : 0.28));
  sg.addColorStop(1, hexA("#000000", 0));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(A.x, C.y + size * 0.08, size * 0.7, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // The white beam arriving. Drawn before the glass so the glass sits over it.
  waveRay(ctx, entry.x - d0.x * inLen, entry.y - d0.y * inLen, entry.x, entry.y,
    "#fff8e8", { theme, width: size * 0.036, intensity: flicker, fadeTo: 1 });

  /* --- the glass ---------------------------------------------------- */

  const tri = () => {
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
  };

  tri();
  // Glass is mostly what is behind it, plus a cool tint and a lot of edge.
  const body = ctx.createLinearGradient(A.x - size * 0.4, A.y, C.x, C.y);
  body.addColorStop(0, hexA(dark ? "#9fd8ff" : "#e8f6ff", dark ? 0.2 : 0.62));
  body.addColorStop(0.45, hexA(dark ? "#5f7fa8" : "#ffffff", dark ? 0.1 : 0.3));
  body.addColorStop(1, hexA(dark ? "#b9e6ff" : "#bfe0f5", dark ? 0.24 : 0.5));
  ctx.fillStyle = body;
  ctx.fill();

  /* --- rays through the glass -------------------------------------- */

  // Enough samples that the fan reads as a continuum. Each ray is drawn thin:
  // wide rays overlap into white, which is true of real overlapping spectra but
  // hides the very separation the picture exists to show.
  const samples = 84;
  const exits: Array<{ nm: number; p: Pt; d: Pt }> = [];
  ctx.save();
  tri();
  ctx.clip();
  for (let i = 0; i <= samples; i++) {
    const nm = 400 + (300 * i) / samples;
    const traced = tracePrism(
      verts, { x: entry.x - d0.x * inLen, y: entry.y - d0.y * inLen }, d0, prismIndex(nm),
    );
    for (let s = 1; s < traced.path.length; s++) {
      const p0 = traced.path[s - 1], p1 = traced.path[s];
      waveRay(ctx, p0.x, p0.y, p1.x, p1.y, wavelengthColor(nm), {
        theme, width: size * 0.014, intensity: 0.16 * flicker,
      });
    }
    if (traced.exit) exits.push({ nm, p: traced.exit.p, d: traced.exit.d });
  }
  ctx.restore();

  /* --- glass surface ------------------------------------------------ */

  // An inset outline reads as the far side of a thick, transparent solid.
  const cxm = (A.x + B.x + C.x) / 3, cym = (A.y + B.y + C.y) / 3;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const v = verts[i];
    const px = v.x + (cxm - v.x) * 0.1, py = v.y + (cym - v.y) * 0.1;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = hexA(dark ? "#ffffff" : "#7fa8c4", dark ? 0.28 : 0.55);
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.stroke();

  // Edges: the two facing the key light blaze, the third falls away.
  const edges: Array<[Pt, Pt]> = [[A, B], [B, C], [C, A]];
  for (const [p, q] of edges) {
    const mx = (p.x + q.x) / 2 - cxm, my = (p.y + q.y) / 2 - cym;
    const lit = clamp01((-(mx * KEY.x + my * KEY.y) / (Math.hypot(mx, my) || 1)) * 0.5 + 0.5);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = dark
      ? hexA("#ffffff", 0.25 + 0.6 * (1 - lit))
      : hexA(mix("#bfe2f5", "#2b4a63", lit), 0.55 + 0.4 * lit);
    ctx.lineWidth = Math.max(1.4, size * 0.022);
    ctx.stroke();
    ctx.strokeStyle = hexA(dark ? "#7fb6e0" : "#ffffff", dark ? 0.35 + 0.3 * lit : 0.75);
    ctx.lineWidth = Math.max(0.8, size * 0.008);
    ctx.stroke();
  }

  // Corner sparkles: real glass throws a hard point of light off every edge.
  for (let i = 0; i < 3; i++) {
    const v = verts[i];
    const sp = 0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.1);
    ctx.save();
    if (dark) ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, size * 0.13 * (0.6 + sp * 0.5));
    g.addColorStop(0, hexA("#ffffff", 0.85));
    g.addColorStop(0.35, hexA("#dff2ff", 0.3));
    g.addColorStop(1, hexA("#dff2ff", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(v.x, v.y, size * 0.13 * (0.6 + sp * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* --- the spectrum leaving ---------------------------------------- */

  for (const e of exits) {
    waveRay(ctx, e.p.x, e.p.y,
      e.p.x + e.d.x * throwLen, e.p.y + e.d.y * throwLen,
      wavelengthColor(e.nm),
      { theme, width: size * 0.022, intensity: 0.26 * flicker, fadeTo: 0.5 });
  }

  // Where light crosses a surface it scatters, leaving a hot spot on the glass.
  for (const [hx, hy, rr] of [
    [entry.x, entry.y, size * 0.09],
    [exits.length ? exits[Math.floor(exits.length / 2)].p.x : entry.x,
      exits.length ? exits[Math.floor(exits.length / 2)].p.y : entry.y, size * 0.1],
  ] as const) {
    ctx.save();
    if (dark) ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr);
    g.addColorStop(0, hexA("#ffffff", 0.9));
    g.addColorStop(1, hexA("#ffffff", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Walk a ray through a convex glass polygon, refracting at each surface.
 *
 * Returns the polyline inside the glass and the outgoing ray. If a surface is
 * hit past the critical angle the ray reflects internally and keeps going,
 * which is not a special case bolted on — it is what falls out of the same
 * equation when the square root would go negative.
 */
function tracePrism(
  verts: Pt[], start: Pt, dir: Pt, n: number,
): { path: Pt[]; exit: { p: Pt; d: Pt } | null } {
  const path: Pt[] = [start];
  let p = start;
  let d = dir;
  let inside = false;

  for (let bounce = 0; bounce < 6; bounce++) {
    let best = Infinity;
    let hit: Pt | null = null;
    let nrm: Pt | null = null;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i], b = verts[(i + 1) % verts.length];
      const ex = b.x - a.x, ey = b.y - a.y;
      const den = d.x * ey - d.y * ex;
      if (Math.abs(den) < 1e-9) continue;
      const tt = ((a.x - p.x) * ey - (a.y - p.y) * ex) / den;
      const uu = ((a.x - p.x) * d.y - (a.y - p.y) * d.x) / den;
      if (tt <= 1e-4 || uu < -1e-6 || uu > 1 + 1e-6 || tt >= best) continue;
      best = tt;
      hit = { x: p.x + d.x * tt, y: p.y + d.y * tt };
      // Outward normal: perpendicular to the edge, pointing away from the
      // polygon's interior.
      const len = Math.hypot(ex, ey) || 1;
      let nx = ey / len, ny = -ex / len;
      const cx = (verts[0].x + verts[1].x + verts[2].x) / 3;
      const cy = (verts[0].y + verts[1].y + verts[2].y) / 3;
      if (nx * (cx - a.x) + ny * (cy - a.y) > 0) { nx = -nx; ny = -ny; }
      nrm = { x: nx, y: ny };
    }
    if (!hit || !nrm) break;
    path.push(hit);

    // The normal used in the refraction must oppose the ray.
    const facing = d.x * nrm.x + d.y * nrm.y > 0 ? { x: -nrm.x, y: -nrm.y } : nrm;
    const eta = inside ? n : 1 / n;
    const cosi = -(facing.x * d.x + facing.y * d.y);
    const kk = 1 - eta * eta * (1 - cosi * cosi);
    if (kk < 0) {
      // Total internal reflection: past the critical angle no light escapes,
      // so the ray bounces off the inside of the face and carries on.
      d = reflect(d, facing);
      p = hit;
      inside = true;
      continue;
    }
    const f = eta * cosi - Math.sqrt(kk);
    const nd = norm({ x: eta * d.x + f * facing.x, y: eta * d.y + f * facing.y });
    if (inside) return { path, exit: { p: hit, d: nd } };
    inside = true;
    p = hit;
    d = nd;
  }
  return { path, exit: null };
}

function reflect(d: Pt, nrm: Pt): Pt {
  const dot = d.x * nrm.x + d.y * nrm.y;
  return norm({ x: d.x - 2 * dot * nrm.x, y: d.y - 2 * dot * nrm.y });
}

function norm(p: Pt): Pt {
  const l = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / l, y: p.y / l };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** A small lit sphere — the marker for a piece of a medium. */
function bead(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string,
) {
  ctx.save();
  const g = ctx.createRadialGradient(x + KEY.x * r, y + KEY.y * r, 0, x, y, r);
  g.addColorStop(0, mix(color, "#ffffff", 0.85));
  g.addColorStop(0.45, mix(color, "#ffffff", 0.2));
  g.addColorStop(1, shade(color, -0.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  ctx.lineWidth = Math.max(0.6, r * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, Math.PI * 0.85, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();
}

/** A line with a solid head, for displacement and direction annotations. */
function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width: number, head: number,
) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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

/** Deterministic 0-1 from an integer. No Math.random anywhere in this file. */
function hash(i: number): number {
  let s = (i * 1664525 + 1013904223) >>> 0;
  s ^= s >>> 15;
  s = Math.imul(s, 2246822519);
  s ^= s >>> 13;
  return (s >>> 0) / 4294967296;
}

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Blend two hex colours. Local copy so this module stands alone. */
function mix(a: string, b: string, t: number): string {
  const pa = hexRGB(a), pb = hexRGB(b);
  const c = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `#${[c(0), c(1), c(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Lighten (t>0) or darken (t<0) a hex colour. */
function shade(color: string, t: number): string {
  return mix(color, t >= 0 ? "#ffffff" : "#000000", Math.abs(t));
}

function hexRGB(h: string): [number, number, number] {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [
    parseInt(s.slice(0, 2), 16) || 0,
    parseInt(s.slice(2, 4), 16) || 0,
    parseInt(s.slice(4, 6), 16) || 0,
  ];
}

/** Hue in degrees to a vivid hex, so callers can name a colour by hue alone. */
function hslHex(h: number, s: number, l: number): string {
  const hh = (mod(h, 360)) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const xx = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) { r = c; g = xx; }
  else if (hh < 2) { r = xx; g = c; }
  else if (hh < 3) { g = c; b = xx; }
  else if (hh < 4) { g = xx; b = c; }
  else if (hh < 5) { r = xx; b = c; }
  else { r = c; b = xx; }
  const m = l - c / 2;
  const q = (v: number) => Math.round(clamp01(v + m) * 255).toString(16).padStart(2, "0");
  return `#${q(r)}${q(g)}${q(b)}`;
}
