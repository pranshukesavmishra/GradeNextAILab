import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, label, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, material, sky, sphere, starfield, vignette,
} from "@ui/scene";
import { dailyInsolation, sunriseHourAngle } from "./seasons";

/**
 * Unequal Heating of Earth — Grades 5-12.
 *
 * Four reasons the same Sun warms different places by different amounts, all
 * running at once on real numbers.
 *
 * The first one is the picture that does the teaching. A beam of sunlight of a
 * fixed width strikes the equator almost head on and covers a patch of ground
 * the same width as the beam. The same beam at 60° north has to cover twice as
 * much ground, so every square metre gets half as much. That is the whole of
 * "the Sun's rays are more slanted near the poles", and here the footprint is
 * drawn to scale rather than described: intensity is S·cos(φ − δ) and the
 * spread factor is exactly 1/cos(φ − δ).
 *
 * The second is heat capacity. Water takes 4184 J to warm a kilogram by one
 * kelvin; dry sand takes about 830. Give both the same sunshine and the sand
 * gets hot while the sea barely notices, which is why the coast is mild and
 * the Central Valley is not.
 *
 * Then altitude, at the environmental lapse rate of 6.5 K/km, and albedo, with
 * the real reflectances: fresh snow throws back about 80% of what lands on it
 * and the open ocean throws back about 6%.
 *
 * Surface temperature comes from an energy-balance model of the kind climate
 * scientists actually use for this: absorbed sunlight in; outgoing longwave
 * linearised as A + B·T with Budyko's A = 203.3 W/m² and B = 2.09 W/(m²·°C);
 * heat carried away by winds and currents as C·(T − T̄) with C = 3.81; and an
 * evaporation term for wet surfaces, because a sea that could not evaporate
 * would boil. Those published constants give a global mean of 16.7 °C, an
 * Arctic winter of about −23 °C, and asphalt in July at over 50 °C, all of
 * which are close to the real values without a single fitted fudge factor.
 */

const DEG = Math.PI / 180;
const SOLAR_CONSTANT = 1361;

/** Environmental lapse rate, K per metre. */
export const LAPSE_RATE = 0.0065;

/* --- Budyko-Sellers energy balance constants (North, 1975) --------- */
/** Outgoing longwave intercept, W/m². */
export const OLR_A = 203.3;
/** Outgoing longwave slope, W/(m²·°C). */
export const OLR_B = 2.09;
/** Poleward heat transport coefficient, W/(m²·°C). */
export const TRANSPORT_C = 3.81;
/** Evaporative loss from open water at 15 °C, W/m². */
const LATENT_0 = 100;
/** How fast evaporative loss grows with temperature, W/(m²·K). */
const LATENT_SLOPE = 6;

/* ------------------------------------------------------------------ *
 * Sunlight geometry — the key visual, as arithmetic
 * ------------------------------------------------------------------ */

/** Solar zenith angle at local noon, radians. Zero means straight overhead. */
export function noonZenith(latitude: number, declination: number): number {
  return Math.abs(latitude - declination);
}

/** Sunlight falling on flat ground at local noon, W/m². */
export function noonIntensity(latitude: number, declination: number): number {
  const c = Math.cos(noonZenith(latitude, declination));
  return c > 0 ? SOLAR_CONSTANT * c : 0;
}

/**
 * How far a beam of a given width is spread when it lands. One at the equator
 * at an equinox, two at 60°, and it runs away to infinity at the terminator.
 */
export function beamSpread(latitude: number, declination: number): number {
  const c = Math.cos(noonZenith(latitude, declination));
  return c > 0.001 ? 1 / c : Infinity;
}

/** Cosine of the solar zenith angle at an hour angle H. Negative at night. */
export function solarCosine(latitude: number, declination: number, hourAngle: number): number {
  return (
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)
  );
}

/* ------------------------------------------------------------------ *
 * Surfaces: albedo and heat capacity
 * ------------------------------------------------------------------ */

export interface SurfaceType {
  key: string;
  label: string;
  /** Fraction of sunlight reflected straight back. */
  albedo: number;
  /** Specific heat capacity, J/(kg·K). */
  specificHeat: number;
  /** Density, kg/m³. */
  density: number;
  /** True for surfaces that mix heat downward instead of storing it in a skin. */
  liquid: boolean;
  /** How wet it is, from 0 (asphalt) to 1 (open water), scaling evaporation. */
  wetness: number;
  note: string;
}

export const SURFACES: Record<string, SurfaceType> = {
  ocean: {
    key: "ocean", label: "Open ocean", albedo: 0.06,
    specificHeat: 4184, density: 1000, liquid: true, wetness: 1,
    note: "Reflects almost nothing and stores an enormous amount of heat.",
  },
  forest: {
    key: "forest", label: "Forest", albedo: 0.15,
    specificHeat: 1500, density: 900, liquid: false, wetness: 0.55,
    note: "Dark canopy, so it absorbs most of what lands on it.",
  },
  grass: {
    key: "grass", label: "Grassland", albedo: 0.25,
    specificHeat: 1200, density: 1300, liquid: false, wetness: 0.35,
    note: "About a quarter of the sunlight is reflected away.",
  },
  sand: {
    key: "sand", label: "Desert sand", albedo: 0.40,
    specificHeat: 830, density: 1600, liquid: false, wetness: 0.02,
    note: "Bright and light: it heats fast by day and loses it fast by night.",
  },
  snow: {
    key: "snow", label: "Fresh snow", albedo: 0.80,
    specificHeat: 2090, density: 300, liquid: false, wetness: 0.05,
    note: "Throws back four fifths of the sunlight, so it stays cold and stays snow.",
  },
  asphalt: {
    key: "asphalt", label: "Asphalt", albedo: 0.10,
    specificHeat: 920, density: 2300, liquid: false, wetness: 0,
    note: "Almost as dark as the ocean, which is why a city runs hot.",
  },
};

/** Earth's overall albedo, and the sunlight it averages over a whole sphere. */
export const EARTH_ALBEDO = 0.30;
export const GLOBAL_MEAN_INSOLATION = SOLAR_CONSTANT / 4;

/** Volumetric heat capacity of a slab, J per m³ per kelvin. */
export function volumetricCapacity(s: SurfaceType): number {
  return s.density * s.specificHeat;
}

/** Heat needed to warm a square metre of a slab by one kelvin, J/(m²·K). */
export function slabCapacity(s: SurfaceType, depthM: number, mixes: boolean): number {
  // Water stirs, so the sunlight it absorbs is shared through a mixed layer
  // tens of metres deep instead of a thin skin. That is a second reason, on
  // top of specific heat, why the sea barely changes temperature in a day.
  const depth = s.liquid && mixes ? depthM * 40 : depthM;
  return volumetricCapacity(s) * depth;
}

/** Bare radiative equilibrium temperature for an absorbed flux, K. No atmosphere. */
export function radiativeEquilibrium(absorbed: number): number {
  return Math.pow(Math.max(1e-6, absorbed) / CONSTANTS.sigma, 0.25);
}

/** Global mean surface temperature the Budyko constants imply, °C. */
export const GLOBAL_MEAN_C = ((1 - EARTH_ALBEDO) * GLOBAL_MEAN_INSOLATION - OLR_A) / OLR_B;

/**
 * Everything leaving a square metre of surface: infrared to space, heat carried
 * off by winds and currents, and evaporation. The altitude term is written so
 * that raising the surface by a kilometre costs exactly the lapse rate.
 */
export function lossFlux(tempC: number, wetness: number, altitudeM: number): number {
  return (
    OLR_A + OLR_B * tempC +
    TRANSPORT_C * (tempC - GLOBAL_MEAN_C) +
    wetness * (LATENT_0 + LATENT_SLOPE * (tempC - 15)) +
    (OLR_B + TRANSPORT_C + wetness * LATENT_SLOPE) * LAPSE_RATE * altitudeM
  );
}

/** The temperature at which absorbed sunlight and every loss term balance, °C. */
export function equilibriumTempC(absorbed: number, wetness: number, altitudeM: number): number {
  const den = OLR_B + TRANSPORT_C + wetness * LATENT_SLOPE;
  const num =
    absorbed - OLR_A + TRANSPORT_C * GLOBAL_MEAN_C - wetness * (LATENT_0 - LATENT_SLOPE * 15);
  return num / den - LAPSE_RATE * altitudeM;
}

/** The same thing in kelvin, for a surface with a given albedo. */
export function equilibriumTemperature(
  meanInsolation: number, s: SurfaceType, altitudeM: number,
): number {
  return equilibriumTempC((1 - s.albedo) * meanInsolation, s.wetness, altitudeM) + 273.15;
}

const SEASONS: Record<string, { label: string; declination: number }> = {
  equinox: { label: "Equinox (Mar/Sep)", declination: 0 },
  june: { label: "June solstice", declination: 23.44 * DEG },
  december: { label: "December solstice", declination: -23.44 * DEG },
};

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** Hours since midnight. */
  hour: number;
  landK: number;
  waterK: number;
  landMin: number; landMax: number;
  waterMin: number; waterMax: number;
  history: { h: number; land: number; water: number }[];
  days: number;
}

type Params = Record<string, number | boolean | string>;

function declinationOf(params: Params): number {
  return (SEASONS[params.season as string] ?? SEASONS.equinox).declination;
}

function surfaceOf(params: Params): SurfaceType {
  return SURFACES[params.surface as string] ?? SURFACES.grass;
}

/** Mean sunlight over 24 hours at this latitude and season, W/m². */
function meanInsolation(params: Params): number {
  return Math.max(0, dailyInsolation(params.latitude as number, declinationOf(params), 1));
}

function startTemp(params: Params, s: SurfaceType): number {
  return equilibriumTemperature(meanInsolation(params), s, params.altitude as number);
}

function freshState(params: Params): State {
  const t0 = startTemp(params, surfaceOf(params));
  const w0 = startTemp(params, SURFACES.ocean);
  return {
    hour: 6, landK: t0, waterK: w0,
    landMin: t0, landMax: t0, waterMin: w0, waterMax: w0,
    history: [], days: 0,
  };
}

const MAX_HISTORY = 300;

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    if (
      params.latitude !== prev.latitude || params.season !== prev.season ||
      params.surface !== prev.surface || params.altitude !== prev.altitude ||
      params.waterMixes !== prev.waterMixes || params.slabDepth !== prev.slabDepth
    ) {
      return freshState(params);
    }
    return state;
  },

  step(state, dt, params, _ctx) {
    if (dt <= 0) return state;
    const hours = dt * (params.speed as number);
    const hour = state.hour + hours;
    const lat = params.latitude as number;
    const dec = declinationOf(params);
    const land = surfaceOf(params);
    const water = SURFACES.ocean;
    const depth = params.slabDepth as number;
    const mixes = params.waterMixes as boolean;

    // Local hour angle: zero at noon, ±π at midnight.
    const H = ((hour % 24) / 24) * 2 * Math.PI - Math.PI;
    const cosZ = solarCosine(lat, dec, H);
    const incoming = cosZ > 0 ? SOLAR_CONSTANT * cosZ : 0;

    const seconds = hours * 3600;
    const altitude = params.altitude as number;
    const stepSlab = (T: number, s: SurfaceType) => {
      const C = slabCapacity(s, depth, mixes);
      const net = (1 - s.albedo) * incoming - lossFlux(T - 273.15, s.wetness, altitude);
      // A generous but finite step: the slab can never move by more than a few
      // kelvin in one tick, which keeps the integration stable at any speed.
      const dT = Math.max(-6, Math.min(6, (net * seconds) / Math.max(1e3, C)));
      return T + dT;
    };

    const landK = stepSlab(state.landK, land);
    const waterK = stepSlab(state.waterK, water);

    const history = state.history.length >= MAX_HISTORY ? state.history.slice(1) : state.history.slice();
    history.push({ h: hour, land: landK, water: waterK });

    return {
      hour,
      landK, waterK,
      landMin: Math.min(state.landMin, landK),
      landMax: Math.max(state.landMax, landK),
      waterMin: Math.min(state.waterMin, waterK),
      waterMax: Math.max(state.waterMax, waterK),
      history,
      days: Math.floor(hour / 24),
    };
  },

  readouts(state, params) {
    const lat = params.latitude as number;
    const dec = declinationOf(params);
    const s = surfaceOf(params);
    const intensity = noonIntensity(lat, dec);
    return [
      {
        key: "intensity", label: "Noon sunlight (W/m²)", quantity: q(intensity, "ratio"),
        semantic: "light", graphable: true,
      },
      {
        key: "spread", label: "Beam spread factor", quantity: q(Math.min(20, beamSpread(lat, dec)), "ratio"),
        semantic: "distance", graphable: true,
      },
      {
        key: "albedo", label: "Albedo", quantity: q(s.albedo, "ratio"),
        semantic: "light", graphable: false,
      },
      {
        key: "absorbed", label: "Absorbed at noon (W/m²)",
        quantity: q(intensity * (1 - s.albedo), "ratio"),
        semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "landTemp", label: "Land temperature", quantity: q(state.landK, "temperature"), unit: "°C",
        semantic: "hot", graphable: true,
      },
      {
        key: "waterTemp", label: "Water temperature", quantity: q(state.waterK, "temperature"), unit: "°C",
        semantic: "cold", graphable: true,
      },
      {
        key: "gap", label: "Land minus water", quantity: q(state.landK - state.waterK, "temperature"),
        semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "dailyMean", label: "Daily mean sunlight (W/m²)", quantity: q(meanInsolation(params), "ratio"),
        semantic: "energy-total", graphable: false, bands: ["9-12"],
      },
      {
        key: "hour", label: "Time of day", quantity: q((state.hour % 24) * 3600, "time"), unit: "h",
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const lat = params.latitude as number;
    const dec = declinationOf(params);
    const s = surfaceOf(params);
    const depth = params.slabDepth as number;
    const mixes = params.waterMixes as boolean;
    const alt = params.altitude as number;
    return {
      latitudeDeg: lat / DEG,
      declinationDeg: dec / DEG,
      zenithDeg: noonZenith(lat, dec) / DEG,
      noonIntensity: noonIntensity(lat, dec),
      equatorNoonIntensity: noonIntensity(0, dec),
      spreadFactor: Math.min(1e6, beamSpread(lat, dec)),
      dailyMeanInsolation: meanInsolation(params),
      daylightHours: (24 * sunriseHourAngle(lat, dec)) / Math.PI,
      surface: s.key,
      albedo: s.albedo,
      absorbedNoon: noonIntensity(lat, dec) * (1 - s.albedo),
      reflectedNoon: noonIntensity(lat, dec) * s.albedo,
      snowAlbedo: SURFACES.snow.albedo,
      oceanAlbedo: SURFACES.ocean.albedo,
      forestAlbedo: SURFACES.forest.albedo,
      earthAlbedo: EARTH_ALBEDO,
      altitudeM: alt,
      lapseCoolingK: LAPSE_RATE * alt,
      landTempC: state.landK - 273.15,
      waterTempC: state.waterK - 273.15,
      tempGapC: state.landK - state.waterK,
      landRangeC: state.landMax - state.landMin,
      waterRangeC: state.waterMax - state.waterMin,
      landCapacity: slabCapacity(s, depth, mixes),
      waterCapacity: slabCapacity(SURFACES.ocean, depth, mixes),
      capacityRatio: slabCapacity(SURFACES.ocean, depth, false) / slabCapacity(s, depth, false),
      equilibriumTempC: equilibriumTemperature(meanInsolation(params), s, alt) - 273.15,
      globalMeanTempC: GLOBAL_MEAN_C,
      bareEarthTempC: radiativeEquilibrium((1 - EARTH_ALBEDO) * GLOBAL_MEAN_INSOLATION) - 273.15,
      greenhouseWarmingK:
        GLOBAL_MEAN_C - (radiativeEquilibrium((1 - EARTH_ALBEDO) * GLOBAL_MEAN_INSOLATION) - 273.15),
      hour: state.hour % 24,
      days: state.days,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View — the globe and the growing footprint
 * ------------------------------------------------------------------ */

const SHOWN_LATS = [-80, -60, -30, 0, 30, 60, 80];

function drawGlobe(rc: RenderContext<State>, x0: number, w: number, h: number) {
  const { ctx, theme, params, band, overlays } = rc;
  const dec = declinationOf(params);
  const lat = params.latitude as number;

  const cx = x0 + w * 0.58;
  const cy = h * 0.5;
  const R = Math.min(w * 0.34, h * 0.42);

  starfield(ctx, x0 + w, h, 50, 3);

  // Sun direction: toward the subsolar latitude, which is the declination.
  const dx = Math.cos(dec), dy = Math.sin(dec);
  const point = (phi: number) => ({
    x: cx - R * Math.cos(phi),
    y: cy - R * Math.sin(phi),
  });

  /* --- the Sun, off to the left ------------------------------------ */
  const sunX = x0 + w * 0.08, sunY = cy - R * Math.sin(dec) * 1.2;
  glow(ctx, sunX, sunY, 70, theme.sci["light"], 0.5);
  sphere(ctx, sunX, sunY, 18, theme.sci["light"], { glow: 0.9 });

  /* --- Earth ------------------------------------------------------- */
  ctx.save();
  const g = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R);
  g.addColorStop(0, hexA(theme.sci["liquid"], 1));
  g.addColorStop(0.75, hexA(theme.sci["liquid"], 0.85));
  g.addColorStop(1, hexA(theme.sci["solid"], 0.9));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Night side.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#05070d";
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2 + dec, Math.PI / 2 + dec);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Axis and equator, so latitude means something on the picture.
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - R - 12);
  ctx.lineTo(cx, cy + R + 12);
  ctx.moveTo(cx - R - 10, cy);
  ctx.lineTo(cx + R + 10, cy);
  ctx.stroke();
  ctx.restore();
  caption(ctx, cx + R + 12, cy, "equator", theme, { size: 9, color: theme.inkSoft });

  /* --- the beams: the point of the whole sim ----------------------- */
  const beamW = R * 0.13;
  const drawBeam = (phi: number, highlight: boolean) => {
    const cosZ = Math.cos(phi - dec);
    if (cosZ <= 0.02) return;
    const spread = 1 / cosZ;
    const arcHalf = Math.min(Math.PI * 0.4, (beamW * spread) / R / 2);
    const p0 = point(phi - arcHalf);
    const p1 = point(phi + arcHalf);
    const far = R * 2.6;

    ctx.save();
    ctx.globalAlpha = highlight ? 0.55 : 0.24;
    ctx.fillStyle = theme.sci["light"];
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p0.x - dx * far, p0.y - dy * far);
    ctx.lineTo(p1.x - dx * far, p1.y - dy * far);
    ctx.lineTo(p1.x, p1.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // The footprint: the patch of ground that beam has to cover.
    ctx.save();
    ctx.strokeStyle = highlight ? theme.sci["hot"] : hexA(theme.sci["hot"], 0.6);
    ctx.lineWidth = highlight ? 5 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R + 1, Math.PI - (phi + arcHalf), Math.PI - (phi - arcHalf));
    ctx.stroke();
    ctx.restore();

    if (highlight && band !== "3-5") {
      const p = point(phi);
      badge(ctx, p.x - 30, p.y, `${(SOLAR_CONSTANT * cosZ).toFixed(0)} W/m²`, rc.theme, {
        align: "right", color: theme.sci["light"], sub: `spread ×${spread.toFixed(2)}`,
      });
    }
  };

  if (overlays.beams !== false) {
    for (const d of SHOWN_LATS) {
      if (Math.abs(d * DEG - lat) < 6 * DEG) continue;
      drawBeam(d * DEG, false);
    }
  }
  drawBeam(lat, true);

  /* --- the selected latitude marker -------------------------------- */
  const p = point(lat);
  sphere(ctx, p.x, p.y, 5, theme.accent, { glow: 0.7 });
  caption(ctx, cx, cy - R - 20, `${(lat / DEG).toFixed(0)}° ${lat >= 0 ? "N" : "S"}  ·  ${(SEASONS[params.season as string] ?? SEASONS.equinox).label}`,
    theme, { align: "center", size: 12, weight: 700 });

  /* --- the same idea flattened out, which is how a textbook draws it */
  if (overlays.footprint !== false && band !== "3-5") {
    const fy = h - 46;
    const fx = x0 + 14;
    const fw = w - 28;
    caption(ctx, fx, fy - 12, "one beam, two latitudes, same energy", theme, {
      size: 10, color: theme.inkSoft,
    });
    const spread = beamSpread(lat, dec);
    const unit = Math.min(fw * 0.42, 90);
    material(ctx, fx, fy, unit, 12, theme.sci["hot"], 3);
    label(ctx, "equator: 1 m²", fx + unit / 2, fy + 6, rc.theme, {
      align: "center", size: 9, color: theme.surface, plate: false,
    });
    const wide = Math.min(fw - unit - 20, unit * Math.min(4, spread));
    material(ctx, fx + unit + 16, fy, Math.max(6, wide), 12, hexA(theme.sci["hot"], 0.55), 3);
    label(ctx,
      Number.isFinite(spread) ? `${(lat / DEG).toFixed(0)}°: ${spread.toFixed(2)} m²` : "no sunlight",
      fx + unit + 20, fy + 6, rc.theme,
      { size: 9, color: theme.ink, plate: false });
  }
}

/* ------------------------------------------------------------------ *
 * View — land against water
 * ------------------------------------------------------------------ */

function drawPatches(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, state, params, band } = rc;
  const s = surfaceOf(params);
  const shoreX = x + w * 0.5;
  const groundY = y + h * 0.62;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  sky(ctx, x + w, y + h, theme, "day", groundY);

  const lat = params.latitude as number;
  const dec = declinationOf(params);
  const H = ((state.hour % 24) / 24) * 2 * Math.PI - Math.PI;
  const cosZ = solarCosine(lat, dec, H);
  if (cosZ > 0) {
    const sx = x + w * (0.5 + 0.4 * Math.sin(H));
    const sy = groundY - cosZ * h * 0.5 - 6;
    glow(ctx, sx, sy, 40, theme.sci["light"], 0.55);
    sphere(ctx, sx, sy, 10, theme.sci["light"], { glow: 0.8 });
    // The beam, at the angle it really arrives at right now.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = theme.sci["light"];
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const bx = x + w * (0.12 + i * 0.19);
      ctx.beginPath();
      ctx.moveTo(bx - cosZ * 0, y + 4);
      ctx.lineTo(bx + (1 - cosZ) * 40 * Math.sign(Math.sin(H) || 1), groundY);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    starfield(ctx, x + w, groundY, 26, 11);
  }

  // The land patch, coloured by how bright the chosen surface is.
  const landShade = s.key === "snow" ? theme.sci["cold"] : s.key === "ocean" ? theme.sci["liquid"] : theme.sci["solid"];
  ctx.save();
  ctx.fillStyle = hexA(landShade, s.key === "snow" ? 0.9 : 0.85);
  ctx.fillRect(x, groundY, shoreX - x, y + h - groundY);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.85);
  ctx.fillRect(shoreX, groundY, x + w - shoreX, y + h - groundY);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(theme.surface, 0.5);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const wy = groundY + 8 + i * 9;
    ctx.beginPath();
    for (let px = shoreX; px < x + w; px += 6) {
      ctx.lineTo(px, wy + Math.sin(px * 0.08 + rc.time * 1.6 + i) * 1.6);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Two thermometers, side by side, which is the entire experiment.
  const bar = (bx: number, tempK: number, color: string, name: string) => {
    const lo = 243.15, hi = 333.15;
    const bh = h * 0.42;
    const by = groundY - 8;
    const f = Math.max(0, Math.min(1, (tempK - lo) / (hi - lo)));
    material(ctx, bx - 6, by - bh, 12, bh, hexA(theme.surface, 0.85), 5);
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(bx - 4, by - bh * f, 8, bh * f);
    ctx.restore();
    badge(ctx, bx, by - bh - 12, `${(tempK - 273.15).toFixed(1)} °C`, rc.theme, {
      align: "center", color,
    });
    caption(ctx, bx, by + 12, name, theme, {
      align: "center", size: 10, color: theme.surface, weight: 700,
    });
  };
  bar(x + w * 0.25, state.landK, theme.sci["hot"], s.label);
  bar(x + w * 0.75, state.waterK, theme.sci["cold"], "Water");

  ctx.restore();

  if (band !== "3-5") {
    caption(ctx, x + 6, y + 12,
      `${s.specificHeat} J/kg·K vs water's 4184`, theme,
      { size: 10, color: theme.inkSoft });
  }
}

/** The day's temperature curves — the swing is the result students should see. */
function drawDayGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, state } = rc;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.9);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();
  if (state.history.length < 2) return;

  const all = state.history.flatMap((p) => [p.land, p.water]);
  const lo = Math.min(...all) - 1;
  const hi = Math.max(...all) + 1;
  const h0 = state.history[0].h;
  const h1 = state.history[state.history.length - 1].h;
  const span = Math.max(1, h1 - h0);
  const px = (hh: number) => x + 4 + ((hh - h0) / span) * (w - 8);
  const py = (t: number) => y + h - 6 - ((t - lo) / (hi - lo)) * (h - 18);

  const line = (get: (p: { land: number; water: number }) => number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.history.forEach((p, i) => {
      if (i === 0) ctx.moveTo(px(p.h), py(get(p))); else ctx.lineTo(px(p.h), py(get(p)));
    });
    ctx.stroke();
    ctx.restore();
  };
  line((p) => p.land, theme.sci["hot"]);
  line((p) => p.water, theme.sci["cold"]);

  caption(ctx, x + 5, y + 9, `swing: land ${(state.landMax - state.landMin).toFixed(1)} K · water ${(state.waterMax - state.waterMin).toFixed(1)} K`,
    theme, { size: 9, color: theme.inkSoft });
}

/** Real albedo values, as a chart a student can read a number off. */
function drawAlbedo(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params } = rc;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.9);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 6, y + 11, "Albedo — the fraction reflected", theme, { size: 10, weight: 700 });
  const list = Object.values(SURFACES);
  const rowH = Math.max(9, (h - 22) / list.length);
  const selected = params.surface as string;
  list.forEach((s, i) => {
    const ry = y + 18 + i * rowH;
    const on = s.key === selected;
    ctx.save();
    ctx.fillStyle = on ? theme.sci["light"] : hexA(theme.sci["light"], 0.45);
    ctx.fillRect(x + 74, ry + 1, Math.max(1, s.albedo * (w - 108)), rowH - 3);
    ctx.restore();
    label(ctx, s.label, x + 70, ry + rowH / 2, rc.theme, {
      align: "right", size: 9, color: on ? theme.ink : theme.inkSoft, plate: false,
    });
    label(ctx, s.albedo.toFixed(2), x + w - 6, ry + rowH / 2, rc.theme, {
      align: "right", size: 9, color: on ? theme.ink : theme.inkSoft, plate: false,
    });
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, theme, width, height, band, overlays, params } = rc;
  const narrow = width < 620;

  sky(ctx, width, height, theme, "space");

  const globeW = narrow ? width : Math.round(width * 0.5);
  drawGlobe(rc, 0, globeW, height);

  if (!narrow) {
    const rx = globeW + 8;
    const rw = width - globeW - 16;
    const patchH = Math.round(height * 0.42);
    drawPatches(rc, rx, 8, rw, patchH);
    const graphH = overlays.dayGraph !== false ? Math.round(height * 0.2) : 0;
    if (graphH > 0) drawDayGraph(rc, rx, patchH + 14, rw, graphH - 6);
    if (overlays.albedoChart !== false) {
      const ay = patchH + 14 + graphH;
      drawAlbedo(rc, rx, ay, rw, height - ay - 26);
    }
    // Altitude, folded in as the third reason.
    const alt = params.altitude as number;
    if (alt > 0 && band !== "3-5") {
      caption(ctx, rx, height - 12,
        `${alt} m up costs ${(LAPSE_RATE * alt).toFixed(1)} K at 6.5 K per km`,
        theme, { size: 10, color: theme.sci["cold"] });
    }
  }

  /* --- the arrow that says which way the energy is going ----------- */
  if (band === "9-12") {
    const s = surfaceOf(params);
    const lat = params.latitude as number;
    const dec = declinationOf(params);
    const inW = noonIntensity(lat, dec);
    caption(ctx, 10, height - 10,
      `noon: ${inW.toFixed(0)} W/m² arrives, ${(inW * s.albedo).toFixed(0)} reflected, ${(inW * (1 - s.albedo)).toFixed(0)} absorbed`,
      theme, { size: 10, color: theme.inkSoft });
    arrow(ctx, 10, 30, 10, 12, theme.sci["hot"], { width: 2 });
  }

  vignette(ctx, width, height, 0.2);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const unequalHeatingSim: SimManifest<State> = {
  id: "earth.unequal-heating",
  title: "Why Earth Heats Unevenly",
  tagline: "Watch one beam of sunlight spread out as you move it toward the pole.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-ESS2-6", "MS-PS3-4", "HS-ESS2-4"] },
  learningGoals: [
    "Explain why the same sunlight delivers less energy per square metre near the poles.",
    "Predict which of two surfaces warms faster from their specific heat capacities.",
    "Use albedo to work out how much of the arriving sunlight a surface actually absorbs.",
    "Use the lapse rate to say how much colder it is at a given altitude.",
  ],
  misconceptions: [
    "The poles are cold because they are further from the Sun",
    "The Sun is stronger at the equator",
    "Land and water at the same latitude reach the same temperature",
    "Snow is cold because it is white, rather than staying frozen because it is white",
    "It is colder on a mountain because it is closer to the cold of space",
  ],
  interactionHint: "Drag the latitude slider and watch the orange footprint stretch.",
  tickRate: 60,
  params: {
    latitude: {
      type: "number", label: "Latitude", kind: "angle", unit: "°",
      min: -85 * DEG, max: 85 * DEG, step: DEG, default: 40 * DEG,
      marks: [
        { value: 0, label: "Equator" },
        { value: 23.44 * DEG, label: "Tropic" },
        { value: 40 * DEG, label: "California" },
        { value: 66.56 * DEG, label: "Arctic Circle" },
      ],
      help: "Move it toward the pole and watch the footprint of the beam grow.",
    },
    season: {
      type: "option", label: "Season",
      options: [
        { value: "equinox", label: "Equinox" },
        { value: "june", label: "June solstice" },
        { value: "december", label: "December solstice" },
      ],
      default: "equinox",
      bands: ["6-8", "9-12"],
    },
    surface: {
      type: "option", label: "Land surface",
      options: [
        { value: "asphalt", label: "Asphalt" },
        { value: "forest", label: "Forest" },
        { value: "grass", label: "Grassland" },
        { value: "sand", label: "Desert sand" },
        { value: "snow", label: "Fresh snow" },
        { value: "ocean", label: "Open ocean" },
      ],
      default: "grass",
      help: "Each surface has its own albedo and its own heat capacity.",
    },
    altitude: {
      type: "number", label: "Altitude", kind: "length", unit: "m",
      min: 0, max: 4500, step: 50, default: 0,
      marks: [
        { value: 0, label: "Sea level" },
        { value: 1370, label: "Reno" },
        { value: 4421, label: "Mt Whitney" },
      ],
      bands: ["6-8", "9-12"],
    },
    waterMixes: {
      type: "boolean", label: "Let the water mix", default: false,
      bands: ["6-8", "9-12"],
      help: "Real water stirs, so it shares its heat through a deep layer.",
    },
    slabDepth: {
      type: "number", label: "Slab depth", kind: "length", unit: "m",
      min: 0.1, max: 2, step: 0.1, default: 0.5,
      bands: ["9-12"],
      help: "How thick a layer of each material is being heated.",
    },
    speed: {
      type: "number", label: "Hours per second", kind: "ratio",
      min: 0.5, max: 8, step: 0.5, default: 2,
    },
  },
  overlays: [
    { key: "beams", label: "Beams at every latitude", default: true },
    { key: "footprint", label: "Footprint comparison", default: true, bands: ["6-8", "9-12"] },
    { key: "dayGraph", label: "Temperature through the day", default: true, bands: ["6-8", "9-12"] },
    { key: "albedoChart", label: "Albedo chart", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "angle-and-latitude",
      title: "Spread the beam",
      question: "Why does the same sunlight warm the equator more than it warms Alaska?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-6"],
      setup: { latitude: 0, season: "equinox", surface: "grass", altitude: 0, waterMixes: false, slabDepth: 0.5, speed: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before moving the latitude slider.",
          predict: {
            prompt: "At 60° north, how much of the equator's noon sunlight lands on each square metre?",
            options: ["About the same", "About three quarters", "About a half", "Almost none"],
            correct: 2,
            reveal:
              "About half. cos 60° is exactly 0.5, so the same beam is spread over twice the ground and every square metre gets half as much.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Measure five latitudes",
          instruction: "Record the noon sunlight at 0°, 30°, 45°, 60° and 80°.",
          requireData: 5,
          hints: [
            "Watch the orange footprint arc as you drag the slider.",
            "Compare each reading with the equator's, as a fraction.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the rule",
          instruction: "Divide each reading by the equator's. Compare with the cosine of the latitude.",
          write: {
            prompt: "What function of latitude does the sunlight follow?",
            placeholder: "At 60° I got ... of the equator's value, and cos 60° is ...",
          },
        },
        {
          id: "pole",
          phase: "measure",
          title: "Go further",
          instruction: "Push past 80°. What happens to the footprint and the reading?",
          check: {
            describe: "Latitude beyond 75°",
            test: (v) => Math.abs(v.params.latitude as number) >= 75 * DEG,
          },
          requireData: 6,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Someone says the poles are cold because they are further from the Sun. Reply.",
          write: {
            prompt: "Use the beam footprint to explain why the poles are cold.",
            placeholder: "The Sun is the same distance away, but ...",
          },
        },
      ],
    },
    {
      id: "land-vs-water",
      title: "Sand or sea, which heats faster?",
      question: "Given the same sunlight, which warms up faster — the beach or the water?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-4"],
      setup: { latitude: 35 * DEG, season: "june", surface: "sand", altitude: 0, waterMixes: false, slabDepth: 0.5, speed: 3 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Think about a beach on a hot day.",
          predict: {
            prompt: "The sand and the sea get exactly the same sunshine. Which gets hotter by mid-afternoon?",
            options: ["The sand", "The sea", "They end up the same"],
            correct: 0,
            reveal:
              "The sand, by a long way. Water needs about five times as much energy per kilogram to warm by one degree, and it mixes that heat downward as well.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run a day",
          instruction: "Run a full 24 hours and record both temperatures several times.",
          requireData: 6,
          check: {
            describe: "At least one full day simulated",
            test: (v) => (v.facts.days as number) >= 1,
          },
        },
        {
          id: "swing",
          phase: "analyze",
          title: "Compare the swings",
          instruction: "Look at the graph. Which line moves more between night and afternoon?",
          check: {
            describe: "Land swung at least twice as far as water",
            test: (v) => (v.facts.landRangeC as number) > 2 * (v.facts.waterRangeC as number),
          },
          write: {
            prompt: "How much did each surface swing over the day?",
            placeholder: "The land went from ... to ..., a swing of ... The water only ...",
          },
        },
        {
          id: "mix",
          phase: "measure",
          title: "Now let the water mix",
          instruction: "Turn on Let the water mix and run another day.",
          check: {
            describe: "Mixing switched on",
            test: (v) => v.params.waterMixes === true,
          },
          requireData: 9,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the coast",
          instruction: "Use this to explain why the coast is mild and inland California is not.",
          write: {
            prompt: "Why is San Francisco cool in summer while Fresno is baking?",
            placeholder: "The ocean's heat capacity means ... so the air over it ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "double-the-spread",
      title: "Spread it over two",
      brief: "Find a latitude where one square metre of beam covers exactly two square metres of ground.",
      bands: ["6-8", "9-12"],
      setup: { latitude: 10 * DEG, season: "equinox", surface: "grass", altitude: 0, waterMixes: false, slabDepth: 0.5, speed: 2 },
      goal: {
        describe: "Spread factor within 0.05 of 2",
        test: (v) => Math.abs((v.facts.spreadFactor as number) - 2) <= 0.05,
      },
      stars: {
        two: {
          describe: "Within 0.01 of 2",
          test: (v) => Math.abs((v.facts.spreadFactor as number) - 2) <= 0.01,
        },
      },
      hints: [
        "The spread factor is one divided by the cosine of the angle.",
        "Which angle has a cosine of exactly one half?",
      ],
    },
    {
      id: "coldest-ground",
      title: "The coldest ground you can build",
      brief: "Combine latitude, season, surface and altitude to get the ground below −18 °C.",
      bands: ["6-8", "9-12"],
      setup: { latitude: 40 * DEG, season: "equinox", surface: "grass", altitude: 0, waterMixes: false, slabDepth: 0.5, speed: 4 },
      goal: {
        describe: "Land surface below −18 °C",
        test: (v) => (v.facts.landTempC as number) < -18,
      },
      stars: {
        two: {
          describe: "Below −40 °C",
          test: (v) => (v.facts.landTempC as number) < -40,
        },
        three: {
          describe: "Below −20 °C without using altitude at all",
          test: (v) => (v.facts.landTempC as number) < -20 && (v.params.altitude as number) === 0,
        },
      },
      hints: [
        "High latitude in the wrong season cuts the sunlight to almost nothing.",
        "A surface that reflects 80% of what does arrive makes it much worse.",
      ],
    },
  ],
};
