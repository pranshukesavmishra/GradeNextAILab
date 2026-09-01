import type { ThemeColors } from "@engine/types";
import { hexA, isDarkTheme } from "./scene";

/**
 * Astronomy — lit worlds, stars, orbits and the distances between them.
 *
 * Almost every mistake in an astronomy diagram is a lighting mistake. A planet
 * drawn as a flat disc has no day and no night, so it cannot explain a sunrise.
 * A moon phase drawn by sliding a black circle across a white one produces a
 * shape the sky never shows, and students who have been taught that shape go on
 * to explain phases with the Earth's shadow, which is an eclipse, not a phase.
 *
 * So this file takes lighting seriously. There is one terminator routine, built
 * from the actual geometry of a sphere lit by a distant source, and both the
 * planet and the Moon use it. Get that right and the pictures teach the physics
 * on their own.
 *
 * The ambient key light stays upper-left, matching `organic.ts` and
 * `labware.ts`, for anything that is lit by the room rather than by a star —
 * rings, rulers, orbit furniture. Bodies are lit by their own sun.
 */

const KEY = { x: -0.38, y: -0.42 };

/* ------------------------------------------------------------------ *
 * The terminator
 * ------------------------------------------------------------------ */

/**
 * The lit region of a sphere, as seen flattened onto the screen.
 *
 * Take a sphere lit by a distant source. The boundary between day and night is
 * a great circle, and a circle tilted away from the viewer projects to an
 * ELLIPSE — never to an offset circle, and never to a straight edge except in
 * the one case where the source lies exactly in the plane of the screen. That
 * ellipse is why a gibbous moon's inner edge bows the way it does, and drawing
 * it correctly is the difference between a picture that explains phases and one
 * that has to be explained away.
 *
 * `az` is the direction of the light across the screen, in radians.
 * `cosGamma` is how far the light is behind (+1) or in front of (-1) the
 * subject: +1 fully lit, 0 exactly half lit, -1 fully dark. The ellipse's
 * short axis is `r * |cosGamma|`, which follows directly from the projection.
 */
export function litRegionPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, az: number, cosGamma: number,
) {
  const cg = Math.max(-1, Math.min(1, cosGamma));
  ctx.beginPath();
  // The half of the limb facing the light is always lit.
  ctx.arc(x, y, r, az - Math.PI / 2, az + Math.PI / 2, false);
  // ...and the terminator closes the region. When the light is behind the
  // subject the ellipse bulges away from it (gibbous); when it is in front, the
  // ellipse cuts back toward it (crescent). One sign change, both phases.
  ctx.ellipse(
    x, y, r * Math.abs(cg), r, az,
    Math.PI / 2, cg >= 0 ? Math.PI * 1.5 : -Math.PI / 2, cg < 0,
  );
  ctx.closePath();
}

/* ------------------------------------------------------------------ *
 * Planets
 * ------------------------------------------------------------------ */

export interface RingSpec {
  /** How far the ring plane is tilted from edge-on, 0-1. */
  tilt?: number;
  /** Inner and outer radius as multiples of the planet's radius. */
  inner?: number;
  outer?: number;
  color?: string;
}

export interface PlanetOpts {
  /** Cloud bands, for a gas giant. A count of 7-11 looks right. */
  bands?: number;
  /** Rings, drawn behind and in front with the planet's shadow across them. */
  rings?: boolean | RingSpec;
  /** 0-1 strength of the atmospheric rim. 0 for an airless rock. */
  atmosphere?: number;
  atmosphereColor?: string;
  /**
   * Where the sun is along the view axis: +1 behind the viewer (full disc),
   * 0 exactly side-on (half lit, straight terminator), -1 behind the planet
   * (a crescent). The default leans gibbous so the terminator's curve shows.
   */
  sunTilt?: number;
  /** Lights on the night side, for an inhabited world. */
  cityLights?: boolean;
  /** Rotation clock: drifts the bands and turns the storms. */
  t?: number;
  /** Fixes the surface texture. Same seed, same planet, every frame. */
  seed?: number;
}

/**
 * A planet: a real sphere with a day side, a night side and an atmosphere.
 *
 * The workhorse of the file. Order matters here — the surface is painted first
 * at full brightness, then the whole disc is dropped into night, then the day
 * side is restored in three overlapping passes. Those passes are what make the
 * terminator a soft band rather than a cut line, which is what it is: sunlight
 * arrives at a grazing angle there, not not-at-all.
 */
export function planet(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string, sunAngle: number,
  opts: PlanetOpts = {},
) {
  const t = opts.t ?? 0;
  const seed = opts.seed ?? 3;
  const cg = opts.sunTilt ?? 0.3;
  const ringSpec: RingSpec | null = opts.rings
    ? (opts.rings === true ? {} : opts.rings)
    : null;
  const sx = Math.cos(sunAngle), sy = Math.sin(sunAngle);

  ctx.save();

  if (ringSpec) drawRings(ctx, x, y, r, ringSpec, sunAngle, "back");

  /* --- albedo: what the surface would look like fully lit ----------- */

  const albedo = () => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    const base = ctx.createRadialGradient(x, y, 0, x, y, r);
    base.addColorStop(0, mix(tint, "#ffffff", 0.2));
    base.addColorStop(0.72, tint);
    base.addColorStop(1, mix(tint, "#000000", 0.25));
    ctx.fillStyle = base;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    if (opts.bands) bandedSurface(ctx, x, y, r, tint, opts.bands, t, seed);
    else rockySurface(ctx, x, y, r, tint, seed);
    ctx.restore();
  };

  albedo();

  // Night. Not pure black: starlight and a planet's own atmosphere leave the
  // dark side a deep tinted blue rather than a hole cut out of the sky.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hexA(mix(tint, "#03050c", 0.9), 0.94);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  if (opts.cityLights) {
    // Drawn before the day side is restored, so the opaque final pass wipes
    // them from the day half and leaves them glowing right up to the twilight
    // band — which is exactly where they are visible from orbit.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // Cities cluster: a few bright cores with a scatter of small lights around
    // them, rather than an even sprinkle, which is what orbit photographs show.
    for (let i = 0; i < 34; i++) {
      const ca = hash(i * 3 + seed * 31) * Math.PI * 2;
      const crad = Math.sqrt(hash(i * 5 + seed * 71)) * r * 0.9;
      const ccx = x + Math.cos(ca) * crad, ccy = y + Math.sin(ca) * crad;
      const n = 3 + Math.floor(hash(i * 7) * 5);
      for (let j = 0; j < n; j++) {
        const sp = r * 0.09 * hash(i * 11 + j * 13);
        const sa = hash(i * 17 + j * 19) * Math.PI * 2;
        const lx = ccx + Math.cos(sa) * sp, ly = ccy + Math.sin(sa) * sp;
        if (Math.hypot(lx - x, ly - y) > r * 0.97) continue;
        const size = r * (0.006 + hash(i * 23 + j) * 0.012);
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, size * 5);
        g.addColorStop(0, hexA("#fff0c8", 0.9));
        g.addColorStop(0.3, hexA("#ffc766", 0.35));
        g.addColorStop(1, hexA("#ff9b2f", 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();

  /* --- restore the day side, softly -------------------------------- */

  // Four overlapping passes rather than one hard edge. Sunrise is not an
  // event that happens at a line: near the terminator the sun is low, the light
  // is grazing and the ground is dim but not dark, and the width of that band
  // is what makes a planet look round.
  for (const [dcg, alpha] of [
    [0.15, 0.25], [0.09, 0.35], [0.04, 0.5], [-0.02, 1],
  ] as const) {
    ctx.save();
    litRegionPath(ctx, x, y, r, sunAngle, cg + dcg);
    ctx.clip();
    ctx.globalAlpha = alpha;
    albedo();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  // The sub-solar point: the one spot where the sun is directly overhead. It
  // is the brightest place on the planet and it sits where the geometry puts
  // it, out toward the limb when the sun is off to one side.
  const sinG = Math.sqrt(Math.max(0, 1 - cg * cg));
  const ssx = x + sx * r * sinG * 0.72, ssy = y + sy * r * sinG * 0.72;
  ctx.globalCompositeOperation = "lighter";
  const hot = ctx.createRadialGradient(ssx, ssy, 0, ssx, ssy, r * 1.25);
  hot.addColorStop(0, hexA(mix(tint, "#ffffff", 0.8), 0.4));
  hot.addColorStop(0.45, hexA(mix(tint, "#ffffff", 0.5), 0.12));
  hot.addColorStop(1, hexA(tint, 0));
  ctx.fillStyle = hot;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = "source-over";

  // Limb darkening: a sphere's edge is seen through more of its own air and at
  // a steeper angle, so it dims. Without it, a lit disc looks like a coin.
  const limb = ctx.createRadialGradient(x, y, r * 0.66, x, y, r);
  limb.addColorStop(0, hexA("#000000", 0));
  limb.addColorStop(1, hexA("#000814", 0.5));
  ctx.fillStyle = limb;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  /* --- atmosphere --------------------------------------------------- */

  const atm = opts.atmosphere ?? 0.7;
  if (atm > 0.01) {
    const acol = opts.atmosphereColor ?? mix(tint, "#8fd4ff", 0.55);

    // Twilight: air still catches the sun after the ground below it has lost
    // it, so a planet with an atmosphere carries a bright line along its
    // terminator. An airless rock does not, which is the point of the option.
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.ellipse(
      x, y, r * Math.abs(cg), r, sunAngle,
      Math.PI / 2, cg >= 0 ? Math.PI * 1.5 : -Math.PI / 2, cg < 0,
    );
    ctx.strokeStyle = hexA(mix(acol, "#ffd9a8", 0.35), 0.5 * atm);
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    // Seen edge-on, air is thick, so a planet with an atmosphere carries a
    // halo all the way round, brightest where the sun is grazing it.
    const halo = ctx.createRadialGradient(x, y, r * 0.93, x, y, r * 1.2);
    halo.addColorStop(0, hexA(acol, 0.42 * atm));
    halo.addColorStop(0.35, hexA(acol, 0.16 * atm));
    halo.addColorStop(1, hexA(acol, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // The lit limb, brightest where the sun grazes it and fading round the
    // curve. Drawn in segments so it dies away instead of ending as a hoop.
    ctx.globalCompositeOperation = "lighter";
    const segs = 46;
    for (let i = 0; i < segs; i++) {
      const a0 = sunAngle - Math.PI * 0.72 + (Math.PI * 1.44 * i) / segs;
      const a1 = sunAngle - Math.PI * 0.72 + (Math.PI * 1.44 * (i + 1)) / segs;
      const f = Math.pow(Math.cos(((i / segs) - 0.5) * Math.PI), 1.6);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.985, a0, a1 + 0.01);
      ctx.strokeStyle = hexA(mix(acol, "#ffffff", 0.45), 0.6 * atm * f);
      ctx.lineWidth = Math.max(1.2, r * 0.03);
      ctx.stroke();
      ctx.strokeStyle = hexA("#ffffff", 0.42 * atm * f * f);
      ctx.lineWidth = Math.max(0.6, r * 0.011);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (ringSpec) drawRings(ctx, x, y, r, ringSpec, sunAngle, "front");
  ctx.restore();
}

/** Cloud bands wrapped on a sphere, with a storm. */
function bandedSurface(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string, bands: number, t: number, seed: number,
) {
  ctx.save();
  for (let i = 0; i < bands; i++) {
    // Bands are spaced evenly in LATITUDE, then projected. That is what makes
    // them crowd toward the poles — the single cue that turns a striped circle
    // into a sphere.
    const lat0 = -Math.PI / 2 + (Math.PI * i) / bands;
    const lat1 = -Math.PI / 2 + (Math.PI * (i + 1)) / bands;
    const y0 = y + r * Math.sin(lat0);
    const y1 = y + r * Math.sin(lat1);
    const k = hash(i * 17 + seed);
    const col = i % 2 === 0
      ? mix(tint, "#ffffff", 0.14 + k * 0.3)
      : mix(tint, "#5a2c12", 0.12 + k * 0.28);
    ctx.beginPath();
    // Turbulent edges, widest at the equator where the band is widest.
    ctx.moveTo(x - r, y0);
    for (let s = 0; s <= 24; s++) {
      const px = x - r + (2 * r * s) / 24;
      const wob = Math.sin(s * 0.9 + i * 2.3 + t * 0.25) * r * 0.016 * Math.cos(lat0);
      ctx.lineTo(px, y0 + wob);
    }
    ctx.lineTo(x + r, y1);
    for (let s = 24; s >= 0; s--) {
      const px = x - r + (2 * r * s) / 24;
      const wob = Math.sin(s * 1.1 - i * 1.7 - t * 0.3) * r * 0.016 * Math.cos(lat1);
      ctx.lineTo(px, y1 + wob);
    }
    ctx.closePath();
    ctx.fillStyle = hexA(col, 0.75);
    ctx.fill();
  }

  // A storm. It has to be an ellipse squashed toward the limb, because that is
  // what a round spot on a sphere looks like when it is not facing you.
  const stormLat = -0.32;
  const stormLon = mod(t * 0.12 + 1.1, Math.PI * 2) - Math.PI;
  const foreshorten = Math.cos(stormLon);
  if (foreshorten > 0.12) {
    const sxp = x + r * Math.sin(stormLon) * Math.cos(stormLat);
    const syp = y + r * Math.sin(stormLat);
    const rw = r * 0.2 * foreshorten, rh = r * 0.11;
    const g = ctx.createRadialGradient(sxp, syp, 0, sxp, syp, Math.max(rw, rh));
    g.addColorStop(0, hexA("#ffe3c8", 0.9));
    g.addColorStop(0.45, hexA("#d9633a", 0.85));
    g.addColorStop(1, hexA("#8a3316", 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sxp, syp, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Continents, seas and polar caps, fixed by seed. */
function rockySurface(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tint: string, seed: number,
) {
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const a = hash(i * 3 + seed) * Math.PI * 2;
    // sqrt keeps the blobs spread evenly over the disc instead of piling up
    // in the middle, which is what a uniform radius would do.
    const rad = Math.sqrt(hash(i * 7 + seed)) * r * 0.92;
    const bx = x + Math.cos(a) * rad, by = y + Math.sin(a) * rad;
    const br = r * (0.1 + hash(i * 11 + seed) * 0.26);
    const light = hash(i * 13 + seed) > 0.5;
    const col = light ? mix(tint, "#f3e4c4", 0.5) : mix(tint, "#12212f", 0.45);
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, hexA(col, 0.5));
    g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(bx, by, br * 1.3, br * 0.8, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // Polar caps: flattened, because we are looking at them edge-on.
  for (const sgn of [-1, 1]) {
    const g = ctx.createRadialGradient(x, y + sgn * r * 0.92, 0, x, y + sgn * r * 0.92, r * 0.5);
    g.addColorStop(0, hexA("#ffffff", 0.75));
    g.addColorStop(1, hexA("#ffffff", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y + sgn * r * 0.95, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Ring system, split into the half behind the planet and the half in front. */
function drawRings(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  spec: RingSpec, sunAngle: number, half: "back" | "front",
) {
  const tilt = spec.tilt ?? 0.3;
  const inner = (spec.inner ?? 1.35) * r;
  const outer = (spec.outer ?? 2.25) * r;
  const col = spec.color ?? "#d9c9a8";
  const sy = Math.sin(sunAngle);

  ctx.save();
  ctx.rotate(0);
  // The far half of a ring passes above the planet on screen; the near half
  // passes below and in front of it. Drawing them in two calls, with the body
  // between, is what makes a ring look threaded around a world.
  const a0 = half === "back" ? Math.PI : 0;
  const bands = 26;
  for (let i = 0; i < bands; i++) {
    const f0 = i / bands, f1 = (i + 1) / bands;
    const rad0 = inner + (outer - inner) * f0;
    const rad1 = inner + (outer - inner) * f1;
    // A deterministic profile with a wide dark gap: real rings are a crowd of
    // separate ringlets, not a solid disc.
    const gap = Math.abs(f0 - 0.52) < 0.045 ? 0.08 : 1;
    const dens = (0.35 + 0.65 * hash(i * 31 + 5)) * gap;
    ctx.beginPath();
    ctx.ellipse(x, y, (rad0 + rad1) / 2, ((rad0 + rad1) / 2) * tilt, 0, a0, a0 + Math.PI);
    ctx.strokeStyle = hexA(mix(col, i % 2 ? "#ffffff" : "#7a6a52", 0.3), 0.7 * dens);
    ctx.lineWidth = Math.max(1, (rad1 - rad0) * 1.15);
    ctx.stroke();
  }

  if (half === "front") {
    // The planet throws a shadow across the near ring, on the side away from
    // the sun. It is the detail that proves the rings are physical objects
    // rather than a painted halo.
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const shx = x - Math.cos(sunAngle) * r * 0.35;
    const g = ctx.createRadialGradient(shx, y, r * 0.4, shx, y, outer);
    g.addColorStop(0, hexA("#03050c", 0.82));
    g.addColorStop(0.45, hexA("#03050c", 0.5));
    g.addColorStop(1, hexA("#03050c", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, outer * 1.05, outer * tilt * 1.05,
      0, sy >= 0 ? 0 : Math.PI, sy >= 0 ? Math.PI : Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // A bright lit edge on the ring's sunward side.
    ctx.beginPath();
    ctx.ellipse(x, y, outer * 0.995, outer * tilt * 0.995, 0, 0, Math.PI);
    ctx.strokeStyle = hexA("#fff6e2", 0.28);
    ctx.lineWidth = Math.max(0.8, r * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Stars
 * ------------------------------------------------------------------ */

/**
 * The colour of a black body at a given temperature, in kelvin.
 *
 * This is the real Planckian locus (via the standard piecewise fit), which is
 * why 3000 K comes out ember orange, 5800 K comes out the Sun's warm white, and
 * 20000 K comes out blue. Colour and temperature are the same fact about a star
 * seen two ways, and a diagram that paints stars by taste breaks the link the
 * whole topic depends on.
 */
export function blackbodyColor(tempK: number): string {
  const temp = Math.max(1000, Math.min(40000, tempK)) / 100;
  let r: number, g: number, b: number;
  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  const q = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
    .toString(16).padStart(2, "0");
  return `#${q(r)}${q(g)}${q(b)}`;
}

/**
 * A star: photosphere, granulation, chromosphere and corona.
 *
 * Real stars are not flat coloured discs. They are brightest at the centre and
 * dim toward the edge (limb darkening — the edge is seen through a longer,
 * cooler slant of atmosphere), their surfaces boil in convection cells that
 * come and go, and they are wrapped in a corona far larger and fainter than the
 * body. The white-hot core with the coloured outer body is not artistic
 * licence either: any surface this bright saturates the eye to white, and only
 * the fringes carry the temperature's colour.
 */
export function starBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, tempK: number, t: number,
) {
  const col = blackbodyColor(tempK);
  const hotCore = mix(col, "#ffffff", 0.82);
  // Every star needs a definite edge: a 5800 K photosphere is very nearly
  // white, and on a pale background a white disc with no limb is not a star.
  const edge = mix(col, "#6b2400", tempK < 5000 ? 0.5 : 0.34);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Corona: a broad halo plus streamers that breathe. Additive, because that is
  // how overlapping light actually behaves.
  const halo = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 3.4);
  halo.addColorStop(0, hexA(col, 0.5));
  halo.addColorStop(0.22, hexA(col, 0.17));
  halo.addColorStop(0.6, hexA(col, 0.05));
  halo.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Streamers. Faint, many, and fading to nothing at the tip: a corona is a
  // thin haze that happens to have structure, not a crown of spikes.
  ctx.lineCap = "round";
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + hash(i * 5) * 0.14;
    const len = r * (1.1 + hash(i * 9) * 1.05)
      * (0.9 + 0.1 * Math.sin(t * 0.7 + i * 1.3));
    const x0 = x + Math.cos(a) * r * 0.9, y0 = y + Math.sin(a) * r * 0.9;
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, hexA(col, 0.14));
    g.addColorStop(1, hexA(col, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = r * (0.05 + hash(i * 3) * 0.08);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  // Photosphere with limb darkening.
  const body = ctx.createRadialGradient(x, y, 0, x, y, r);
  body.addColorStop(0, hotCore);
  body.addColorStop(0.42, mix(col, "#ffffff", 0.45));
  body.addColorStop(0.78, col);
  body.addColorStop(0.95, mix(col, edge, 0.6));
  body.addColorStop(1, edge);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Granulation: convection cells rising, spilling over and sinking. They churn
  // rather than scroll, because the surface is boiling in place.
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 120; i++) {
    const a = hash(i * 7 + 1) * Math.PI * 2;
    const rad = Math.sqrt(hash(i * 11 + 2)) * r;
    const cxp = x + Math.cos(a) * rad, cyp = y + Math.sin(a) * rad;
    const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.9 + hash(i * 13) * 6.28));
    const cr = r * (0.035 + hash(i * 17) * 0.055);
    const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, cr);
    g.addColorStop(0, hexA(hotCore, 0.22 * pulse));
    g.addColorStop(0.6, hexA(hotCore, 0.08 * pulse));
    g.addColorStop(1, hexA(hotCore, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cxp, cyp, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  // Starspots: cooler, so darker, and only worth showing on a star cool enough
  // for its magnetic field to hold them.
  if (tempK < 7000) {
    for (let i = 0; i < 3; i++) {
      const a = hash(i * 23 + 3) * Math.PI * 2;
      const rad = Math.sqrt(hash(i * 29 + 4)) * r * 0.7;
      const sxp = x + Math.cos(a) * rad, syp = y + Math.sin(a) * rad;
      const sr = r * (0.07 + hash(i * 31) * 0.07);
      const g = ctx.createRadialGradient(sxp, syp, 0, sxp, syp, sr * 1.9);
      g.addColorStop(0, hexA(mix(col, "#2b0a00", 0.7), 0.55));
      g.addColorStop(0.5, hexA(mix(col, "#2b0a00", 0.5), 0.22));
      g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sxp, syp, sr * 1.9, sr * 1.2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Chromosphere: the thin bright rim just above the surface.
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.99, 0, Math.PI * 2);
  ctx.strokeStyle = hexA(mix(col, "#ffffff", 0.6), 0.5);
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();

  // Prominences: loops of plasma following the magnetic field out and back.
  for (let i = 0; i < 3; i++) {
    const a = hash(i * 41 + 6) * Math.PI * 2 + t * 0.05;
    const arc = 0.3 + hash(i * 43) * 0.25;
    const h = r * (0.1 + hash(i * 47) * 0.12) * (0.7 + 0.3 * Math.sin(t * 0.8 + i));
    const p0 = { x: x + Math.cos(a) * r * 0.98, y: y + Math.sin(a) * r * 0.98 };
    const p1 = { x: x + Math.cos(a + arc) * r * 0.98, y: y + Math.sin(a + arc) * r * 0.98 };
    const mxp = x + Math.cos(a + arc / 2) * (r + h);
    const myp = y + Math.sin(a + arc / 2) * (r + h);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(mxp, myp, p1.x, p1.y);
    ctx.strokeStyle = hexA(mix(col, "#ff5a2a", 0.5), 0.32);
    ctx.lineWidth = Math.max(1.2, r * 0.03);
    ctx.stroke();
    ctx.strokeStyle = hexA(mix(col, "#ffffff", 0.5), 0.22);
    ctx.lineWidth = Math.max(0.6, r * 0.011);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Orbits
 * ------------------------------------------------------------------ */

export interface OrbitOpts {
  /** Mark the two foci and the major axis. On by default. */
  foci?: boolean;
  /** Which focus the central body sits at: 1 or -1 along the major axis. */
  focusSide?: 1 | -1;
  /** Wedges swept from the occupied focus, in parametric angle. */
  sweeps?: Array<{ from: number; to: number; color?: string }>;
  /** Put a body on the orbit at this parametric angle. */
  at?: number;
  bodyColor?: string;
  bodyRadius?: number;
  /** Draw the path dashed, as a construction line. */
  dashed?: boolean;
}

/**
 * An elliptical orbit, drawn from the focus outward.
 *
 * Two things students are routinely taught wrongly, both fixed here by drawing
 * rather than by telling. First, the Sun is at a FOCUS, not at the centre — so
 * both foci are marked and the offset is visible. Second, Kepler's second law
 * is about areas swept from that focus: the two shaded wedges below have equal
 * area and obviously different shapes, which is the entire law in one look.
 */
export function orbitPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, a: number, b: number, rotation: number,
  theme: ThemeColors,
  opts: OrbitOpts = {},
) {
  const dark = isDarkTheme(theme);
  const c = Math.sqrt(Math.max(0, a * a - b * b));
  const side = opts.focusSide ?? 1;
  const cosR = Math.cos(rotation), sinR = Math.sin(rotation);
  const at = (th: number) => ({
    x: cx + a * Math.cos(th) * cosR - b * Math.sin(th) * sinR,
    y: cy + a * Math.cos(th) * sinR + b * Math.sin(th) * cosR,
  });
  const focus = {
    x: cx + side * c * cosR,
    y: cy + side * c * sinR,
  };
  const other = { x: cx - side * c * cosR, y: cy - side * c * sinR };

  ctx.save();

  for (const sweep of opts.sweeps ?? []) {
    // The wedge is bounded by the arc and by two radii to the FOCUS. Drawing it
    // from the centre instead would make the two areas look equal for the wrong
    // reason and quietly teach the wrong law.
    ctx.beginPath();
    ctx.moveTo(focus.x, focus.y);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const p = at(sweep.from + ((sweep.to - sweep.from) * i) / steps);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    const col = sweep.color ?? theme.accent;
    const mid = at((sweep.from + sweep.to) / 2);
    const g = ctx.createLinearGradient(focus.x, focus.y, mid.x, mid.y);
    g.addColorStop(0, hexA(col, 0.55));
    g.addColorStop(1, hexA(col, 0.16));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hexA(col, 0.75);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // The path itself, drawn in segments so the far side can fade. An orbit is a
  // ring in space, and a ring drawn at even weight reads as a flat oval.
  const N = 180;
  ctx.lineCap = "round";
  for (let i = 0; i < N; i++) {
    const th0 = (i / N) * Math.PI * 2, th1 = ((i + 1) / N) * Math.PI * 2;
    const p0 = at(th0), p1 = at(th1);
    const depth = 0.5 + 0.5 * Math.sin(th0 + rotation + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    if (opts.dashed) ctx.setLineDash([6, 6]);
    ctx.strokeStyle = hexA(theme.accent, (dark ? 0.34 : 0.3) + 0.5 * depth);
    ctx.lineWidth = 1.5 + depth * 1.2;
    ctx.stroke();
  }
  ctx.setLineDash([]);

  if (opts.foci !== false) {
    // Major axis, so the offset between centre and focus can be measured.
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - a * cosR, cy - a * sinR);
    ctx.lineTo(cx + a * cosR, cy + a * sinR);
    ctx.stroke();
    ctx.setLineDash([]);

    // The empty focus: hollow, because nothing is there. Its presence is what
    // makes the occupied one meaningful.
    ctx.beginPath();
    ctx.arc(other.x, other.y, 4, 0, Math.PI * 2);
    ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = hexA(theme.inkSoft, 0.55);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(focus.x - 6, focus.y);
    ctx.lineTo(focus.x + 6, focus.y);
    ctx.moveTo(focus.x, focus.y - 6);
    ctx.lineTo(focus.x, focus.y + 6);
    ctx.strokeStyle = hexA(theme.accent, 0.9);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  if (opts.at !== undefined) {
    const p = at(opts.at);
    const br = opts.bodyRadius ?? 6;
    const col = opts.bodyColor ?? (theme.sci["mass"] ?? "#8ab4d8");
    // A short trail behind, so the direction of travel is not a guess.
    for (let i = 1; i <= 14; i++) {
      const q = at(opts.at - i * 0.05);
      ctx.beginPath();
      ctx.arc(q.x, q.y, br * (1 - i / 16) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = hexA(col, 0.3 * (1 - i / 14));
      ctx.fill();
    }
    lit(ctx, p.x, p.y, br, col);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * The Moon
 * ------------------------------------------------------------------ */

/**
 * The Moon at any phase from 0 (new) through 0.5 (full) back to 1 (new).
 *
 * The terminator is an ellipse, from `litRegionPath`, and that is the point of
 * this function. The common shortcut — sliding a black disc across a white one
 * — produces a crescent with two circular edges of the same radius, which the
 * sky never shows and which quietly teaches that phases are caused by something
 * blocking the light. They are not: we are seeing a sunlit ball from the side.
 *
 * The surface is fixed, because the Moon keeps one face toward us: the same
 * maria appear in every phase, and a student can check that for themselves.
 */
export function moonPhase(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, phase: number,
  theme: ThemeColors,
) {
  const p = mod(phase, 1);
  // Illuminated fraction and, from it, how far the sun lies behind the Moon.
  const cg = -Math.cos(p * Math.PI * 2);
  // Waxing phases are lit on the right, waning on the left. This one line is
  // the difference between a first quarter and a last quarter.
  const az = p < 0.5 ? 0 : Math.PI;
  const dark = isDarkTheme(theme);

  ctx.save();

  // A faint glow, the way a bright moon bleeds into the sky around it. It
  // scales with how much of the disc is lit, so a thin crescent glows barely.
  const litFrac = (1 + cg) / 2;
  if (litFrac > 0.03) {
    const g = ctx.createRadialGradient(x, y, r, x, y, r * 2.1);
    g.addColorStop(0, hexA("#e9eefc", 0.3 * litFrac * (dark ? 1 : 0.5)));
    g.addColorStop(1, hexA("#e9eefc", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Night side. Not black: earthshine — sunlight bounced off the Earth — makes
  // the dark limb faintly visible, and it is why you can see "the old moon in
  // the new moon's arms".
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const night = ctx.createRadialGradient(
    x + KEY.x * r * 0.4, y + KEY.y * r * 0.4, 0, x, y, r,
  );
  night.addColorStop(0, "#22283c");
  night.addColorStop(0.7, "#161a2a");
  night.addColorStop(1, "#0b0d17");
  ctx.fillStyle = night;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  moonSurface(ctx, x, y, r, az, 0.16);
  ctx.restore();

  // Day side, restored in overlapping passes so the terminator is a graded
  // band. On the real Moon that band is only a few kilometres wide, but a hard
  // edge at this scale reads as a cut-out.
  for (const [d, alpha] of [[0.09, 0.35], [0.035, 0.55], [-0.02, 1]] as const) {
    ctx.save();
    litRegionPath(ctx, x, y, r, az, cg + d);
    ctx.clip();
    ctx.globalAlpha = alpha;
    const day = ctx.createRadialGradient(
      x + Math.cos(az) * r * 0.4, y + Math.sin(az) * r * 0.4, 0, x, y, r * 1.15,
    );
    day.addColorStop(0, "#f4f2ee");
    day.addColorStop(0.6, "#d9d4cc");
    day.addColorStop(1, "#a9a29a");
    ctx.fillStyle = day;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    moonSurface(ctx, x, y, r, az, 1);
    ctx.restore();
  }

  // A dark limb, so the sphere does not end in a hard cut against the sky.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const limb = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
  limb.addColorStop(0, hexA("#000000", 0));
  limb.addColorStop(1, hexA("#05060c", 0.45));
  ctx.fillStyle = limb;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.restore();
}

/**
 * The near side's permanent features: dark basalt seas, bright highlands,
 * craters and Tycho's ray system. Positions are fixed constants, not random,
 * because this is a portrait of a specific object.
 */
function moonSurface(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, az: number, strength: number,
) {
  ctx.save();
  ctx.globalAlpha = strength;

  // Maria, roughly where the near side's seas are.
  const maria: Array<[number, number, number, number]> = [
    [-0.28, -0.36, 0.3, 0.22], [0.1, -0.42, 0.22, 0.17],
    [-0.42, -0.02, 0.24, 0.28], [-0.1, -0.06, 0.3, 0.24],
    [0.3, -0.1, 0.18, 0.22], [-0.2, 0.3, 0.2, 0.16],
  ];
  for (const [mx, my, mw, mh] of maria) {
    const px = x + mx * r, py = y + my * r;
    const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(mw, mh) * r);
    g.addColorStop(0, hexA("#4a4c58", 0.85));
    g.addColorStop(0.65, hexA("#5a5c68", 0.6));
    g.addColorStop(1, hexA("#5a5c68", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, mw * r, mh * r, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tycho's rays: bright streaks of ejecta thrown right across the disc.
  const ty = { x: x - 0.12 * r, y: y + 0.62 * r };
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 19 + 2) * Math.PI * 2;
    const len = r * (0.6 + hash(i * 23) * 1.1);
    const g = ctx.createLinearGradient(
      ty.x, ty.y, ty.x + Math.cos(a) * len, ty.y + Math.sin(a) * len,
    );
    g.addColorStop(0, hexA("#ffffff", 0.3));
    g.addColorStop(1, hexA("#ffffff", 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = r * (0.02 + hash(i * 29) * 0.03);
    ctx.beginPath();
    ctx.moveTo(ty.x, ty.y);
    ctx.lineTo(ty.x + Math.cos(a) * len, ty.y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Craters. Each gets a bright sunward rim and a shadow cast away from the
  // sun — and near the terminator, where the light is grazing, that shadow
  // stretches. It is why the terminator is the only place a small telescope
  // shows craters at all.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.99, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 26; i++) {
    const a = hash(i * 7 + 11) * Math.PI * 2;
    const rad = Math.sqrt(hash(i * 13 + 5)) * r * 0.93;
    const cxp = x + Math.cos(a) * rad, cyp = y + Math.sin(a) * rad;
    const cr = r * (0.018 + Math.pow(hash(i * 17 + 3), 2.6) * 0.075);
    // Local illumination: the cosine of the angle between the surface here and
    // the sun. Near zero means grazing light and long shadows.
    const u = (cxp - x) / r, v = (cyp - y) / r;
    const graze = 1 - Math.min(1, Math.abs(u * Math.cos(az) + v * Math.sin(az)));
    const off = cr * (0.28 + graze * 0.65);
    ctx.beginPath();
    ctx.arc(cxp - Math.cos(az) * off, cyp - Math.sin(az) * off, cr, 0, Math.PI * 2);
    ctx.fillStyle = hexA("#2b2c36", 0.3 + graze * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cxp + Math.cos(az) * cr * 0.18, cyp + Math.sin(az) * cr * 0.18, cr, 0, Math.PI * 2);
    ctx.fillStyle = hexA("#efece5", 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cxp, cyp, cr * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = hexA("#93908b", 0.3);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Star fields
 * ------------------------------------------------------------------ */

export interface StarFieldOpts {
  /** A band of unresolved galactic starlight across the frame. */
  milkyWay?: boolean;
  /** Angle of that band, radians. */
  bandAngle?: number;
  /** Animation clock, for twinkle. Omit for a still field. */
  t?: number;
  /** Fraction of stars given a visible colour, 0-1. */
  colored?: number;
}

/**
 * A field of stars, generated from a seed.
 *
 * Deterministic, so a scene's sky is the same sky every frame — a star field
 * that reshuffles is the fastest way to make a space scene look like a
 * screensaver. Brightness follows a steep power law because that is how the
 * real sky is: a handful of bright stars and an enormous number of faint ones.
 * The brightest get diffraction spikes, which is not something stars do — it is
 * something cameras and eyes do — and it is exactly why they read as bright.
 */
export function starField(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, count: number, seed: number,
  opts: StarFieldOpts = {},
) {
  const t = opts.t ?? 0;
  const colored = opts.colored ?? 0.22;
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  ctx.save();

  if (opts.milkyWay) {
    const ang = opts.bandAngle ?? -0.42;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(ang);
    const span = Math.hypot(w, h);
    // Unresolved starlight: a broad soft band, then dust lanes cut across it.
    const g = ctx.createLinearGradient(0, -span * 0.28, 0, span * 0.28);
    g.addColorStop(0, hexA("#2a2f5c", 0));
    g.addColorStop(0.34, hexA("#3d4478", 0.2));
    g.addColorStop(0.5, hexA("#8f92c8", 0.28));
    g.addColorStop(0.66, hexA("#3d4478", 0.2));
    g.addColorStop(1, hexA("#2a2f5c", 0));
    ctx.fillStyle = g;
    ctx.fillRect(-span / 2, -span * 0.28, span, span * 0.56);
    for (let i = 0; i < 5; i++) {
      const dy = (rnd() - 0.5) * span * 0.3;
      const dg = ctx.createLinearGradient(0, dy - span * 0.05, 0, dy + span * 0.05);
      dg.addColorStop(0, hexA("#0a0a16", 0));
      dg.addColorStop(0.5, hexA("#0a0a16", 0.4));
      dg.addColorStop(1, hexA("#0a0a16", 0));
      ctx.fillStyle = dg;
      ctx.fillRect(-span / 2, dy - span * 0.05, span, span * 0.1);
    }
    ctx.restore();
  }

  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    // Cubed uniform: most stars faint, a few blazing.
    const mag = Math.pow(rnd(), 3);
    const r = 0.35 + mag * 2.2;
    const isColored = rnd() < colored;
    const col = isColored
      ? blackbodyColor(2600 + Math.pow(rnd(), 0.6) * 22000)
      : "#ffffff";
    // Twinkle: the atmosphere, not the star. Each star gets its own phase so
    // the field shimmers instead of pulsing as one.
    const tw = opts.t === undefined ? 1 : 0.72 + 0.28 * Math.sin(t * 2.1 + i * 1.7);
    const alpha = (0.25 + mag * 0.75) * tw;

    if (mag > 0.34) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
      g.addColorStop(0, hexA(col, 0.5 * alpha));
      g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mag > 0.62) {
      ctx.strokeStyle = hexA(col, 0.4 * alpha);
      ctx.lineWidth = 0.7;
      const sp = r * 5.5;
      ctx.beginPath();
      ctx.moveTo(x - sp, y); ctx.lineTo(x + sp, y);
      ctx.moveTo(x, y - sp); ctx.lineTo(x, y + sp);
      ctx.stroke();
    }
    ctx.fillStyle = hexA(col, Math.min(1, alpha + 0.25));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Scale
 * ------------------------------------------------------------------ */

const UNITS: Array<{ m: number; name: string }> = [
  { m: 1, name: "m" },
  { m: 1e3, name: "km" },
  { m: 1.495978707e11, name: "AU" },
  { m: 9.4607304725808e15, name: "ly" },
];

/**
 * A scale bar that picks its own unit.
 *
 * Astronomy spans thirty orders of magnitude, and the single most useful thing
 * a diagram can do is say how big it is. Reporting the Moon's orbit in light
 * years, or a galaxy in kilometres, is technically correct and useless; this
 * chooses the unit a person would actually say out loud, then rounds the bar to
 * a value worth reading — 1, 2 or 5 times a power of ten — rather than
 * labelling the full width with something like 3.47 AU.
 */
export function scaleRuler(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, realMetres: number,
  theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  let unit = UNITS[0];
  for (const u of UNITS) if (realMetres / u.m >= 1) unit = u;
  const span = realMetres / unit.m;

  // Largest 1/2/5 x 10^n that still fits inside the bar's full width.
  const pow = Math.pow(10, Math.floor(Math.log10(span)));
  let nice = pow;
  for (const mlt of [1, 2, 5]) if (mlt * pow <= span) nice = mlt * pow;
  const barW = Math.max(24, (nice / span) * w);
  const h = 9;

  ctx.save();

  // A physical object, not a line: a bevelled bar with a shadow under it.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  roundRectPath(ctx, x, y, barW, h, 2);
  ctx.fillStyle = dark ? "#2a2434" : "#f4f1f8";
  ctx.fill();
  ctx.restore();

  // Alternating segments, the convention every map scale uses, so the eye can
  // subdivide the distance without any extra labels.
  const segs = 4;
  for (let i = 0; i < segs; i++) {
    const sx = x + (barW * i) / segs;
    const sw = barW / segs;
    ctx.beginPath();
    roundRectPath(ctx, sx, y, sw, h, i === 0 || i === segs - 1 ? 2 : 0);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    if (i % 2 === 0) {
      g.addColorStop(0, dark ? "#f0eaf6" : "#3b3348");
      g.addColorStop(1, dark ? "#bdb3ca" : "#1e1a28");
    } else {
      g.addColorStop(0, dark ? "#41394f" : "#ffffff");
      g.addColorStop(1, dark ? "#231e2d" : "#ded7e8");
    }
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.beginPath();
  roundRectPath(ctx, x, y, barW, h, 2);
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.lineWidth = 1;
  ctx.stroke();

  // End posts and a lit top edge, from the same upper-left key as the labware.
  ctx.strokeStyle = hexA(theme.ink, 0.75);
  ctx.lineWidth = 1.6;
  for (const px of [x, x + barW]) {
    ctx.beginPath();
    ctx.moveTo(px, y - 3);
    ctx.lineTo(px, y + h + 3);
    ctx.stroke();
  }
  ctx.strokeStyle = hexA("#ffffff", dark ? 0.2 : 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 1.5, y + 0.8);
  ctx.lineTo(x + barW - 1.5, y + 0.8);
  ctx.stroke();

  ctx.font = '700 12px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = theme.ink;
  ctx.fillText(`${formatValue(nice)} ${unit.name}`, x + barW / 2, y - 5);
  ctx.font = '600 9px "Source Sans 3", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = hexA(theme.inkSoft, 0.9);
  ctx.fillText("0", x, y + h + 3);
  ctx.restore();
}

function formatValue(v: number): string {
  // Plain digits with thin group separators up to a million — "200 000 km" is
  // read instantly, "2 x 10^5 km" has to be decoded. Past that, powers of ten
  // are the only sane option, so switch.
  if (v >= 1e6) {
    const exp = Math.floor(Math.log10(v));
    const mant = v / Math.pow(10, exp);
    return Math.abs(mant - 1) < 1e-9 ? `10^${exp}` : `${trim(mant)} x 10^${exp}`;
  }
  if (v >= 1000) {
    return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
  }
  return trim(v);
}

function trim(v: number): string {
  return v.toFixed(2).replace(/\.?0+$/, "");
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** A small lit sphere, key light upper-left. For orbiting bodies and markers. */
function lit(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string,
) {
  ctx.save();
  const g = ctx.createRadialGradient(x + KEY.x * r, y + KEY.y * r, 0, x, y, r);
  g.addColorStop(0, mix(color, "#ffffff", 0.75));
  g.addColorStop(0.5, color);
  g.addColorStop(1, mix(color, "#000000", 0.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.45);
  ctx.lineWidth = Math.max(0.6, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.92, Math.PI * 0.9, Math.PI * 1.7);
  ctx.stroke();
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

/** Blend two hex colours. Local copy so this module stands alone. */
function mix(a: string, b: string, t: number): string {
  const pa = hexRGB(a), pb = hexRGB(b);
  const c = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `#${[c(0), c(1), c(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
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
