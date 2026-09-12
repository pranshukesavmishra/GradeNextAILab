import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, label, roundRect } from "@ui/draw";
import {
  badge, caption, comet, glow, groundPlane, hexA, material, sky, sphere, starfield, vignette,
} from "@ui/scene";

/**
 * The Atmosphere — Grades 5-12.
 *
 * A vertical journey from the grass to the edge of space, with a probe the
 * student parks anywhere on the way up and reads real numbers off.
 *
 * The pressure, temperature and density curves are the US Standard Atmosphere
 * of 1976, integrated here rather than tabulated: seven layers, each with its
 * own lapse rate, and the barometric formula between them. That is why the
 * probe says 505 hPa at 5.5 km, 226 hPa at 11 km and 1.1 hPa at 47 km — those
 * are not typed in, they fall out of the same hydrostatic balance the real
 * atmosphere obeys. Above 86 km the model integrates hydrostatically through a
 * Bates thermosphere profile, which is an approximation and is marked as one.
 *
 * The second half of the sim answers "why does warm air rise" with a number
 * instead of a hand wave. Air at the same pressure but higher temperature is
 * less dense (ρ = P/RT), so it feels an upward force. A released parcel cools
 * as it climbs at the dry adiabatic rate of 9.8 K/km while the air around it
 * only cools at 6.5 K/km, so it runs out of temperature advantage and stops.
 * A parcel 5 K warmer than its surroundings gets about 1.5 km up. That is the
 * height of a fair-weather cumulus cloud, and it is not a coincidence.
 */

/* ------------------------------------------------------------------ *
 * US Standard Atmosphere, 1976
 * ------------------------------------------------------------------ */

/** Molar mass of dry air, kg/mol. */
const M_AIR = 0.0289644;
/** The gas constant the 1976 standard uses, J/(mol·K). */
const R_STAR = 8.31432;
/** Specific gas constant for dry air, J/(kg·K) — 287.05. */
export const R_AIR = R_STAR / M_AIR;
/** Specific heat of air at constant pressure, J/(kg·K). */
const CP_AIR = 1005;

/** Dry adiabatic lapse rate, g/cp ≈ 9.76 K per km. */
export const DRY_ADIABATIC_LAPSE = CONSTANTS.g / CP_AIR;
/** Standard environmental lapse rate in the troposphere, K/m. */
export const ENVIRONMENTAL_LAPSE = 0.0065;

interface Layer {
  base: number;      // m
  baseTemp: number;  // K
  lapse: number;     // K/m, positive means warming with height
  basePressure: number; // Pa, filled in by integration
}

/** The seven standard layers, with base pressures derived, never typed in. */
const LAYERS: Layer[] = (() => {
  const spec: [number, number, number][] = [
    [0, 288.15, -0.0065],
    [11_000, 216.65, 0],
    [20_000, 216.65, 0.001],
    [32_000, 228.65, 0.0028],
    [47_000, 270.65, 0],
    [51_000, 270.65, -0.0028],
    [71_000, 214.65, -0.002],
  ];
  const out: Layer[] = [];
  let p: number = CONSTANTS.atm;
  for (let i = 0; i < spec.length; i++) {
    const [base, baseTemp, lapse] = spec[i];
    out.push({ base, baseTemp, lapse, basePressure: p });
    const top = i + 1 < spec.length ? spec[i + 1][0] : 84_852;
    p = pressureInLayer(out[i], top);
  }
  return out;
})();

/** Base of the region the standard model stops describing, m. */
const STANDARD_TOP = 84_852;
const TOP_TEMP = 186.946;
const TOP_PRESSURE = (() => pressureInLayer(LAYERS[6], STANDARD_TOP))();

/** Bates thermosphere: temperature relaxes toward an exospheric value. */
const EXOSPHERE_TEMP = 1000;
const BATES_S = 8e-6;

function pressureInLayer(layer: Layer, altitude: number): number {
  const dh = altitude - layer.base;
  if (layer.lapse === 0) {
    return layer.basePressure * Math.exp((-CONSTANTS.g * M_AIR * dh) / (R_STAR * layer.baseTemp));
  }
  const t = layer.baseTemp + layer.lapse * dh;
  return layer.basePressure * Math.pow(layer.baseTemp / t, (CONSTANTS.g * M_AIR) / (R_STAR * layer.lapse));
}

/** Temperature of the standard atmosphere at an altitude, in kelvin. */
export function standardTemperature(altitudeM: number): number {
  const h = Math.max(0, altitudeM);
  if (h >= STANDARD_TOP) {
    return EXOSPHERE_TEMP - (EXOSPHERE_TEMP - TOP_TEMP) * Math.exp(-BATES_S * (h - STANDARD_TOP));
  }
  for (let i = LAYERS.length - 1; i >= 0; i--) {
    if (h >= LAYERS[i].base) return LAYERS[i].baseTemp + LAYERS[i].lapse * (h - LAYERS[i].base);
  }
  return LAYERS[0].baseTemp;
}

/** Pressure of the standard atmosphere at an altitude, in pascals. */
export function standardPressure(altitudeM: number): number {
  const h = Math.max(0, altitudeM);
  if (h >= STANDARD_TOP) {
    // Above the tabulated model, integrate hydrostatic balance through the
    // Bates profile. 500 m steps are ample for a teaching instrument.
    let p = TOP_PRESSURE;
    for (let z = STANDARD_TOP; z < h; z += 500) {
      const dz = Math.min(500, h - z);
      const t = standardTemperature(z + dz / 2);
      p *= Math.exp((-CONSTANTS.g * M_AIR * dz) / (R_STAR * t));
    }
    return p;
  }
  for (let i = LAYERS.length - 1; i >= 0; i--) {
    if (h >= LAYERS[i].base) return pressureInLayer(LAYERS[i], h);
  }
  return LAYERS[0].basePressure;
}

/** Density from the ideal gas law: ρ = P / (R·T). 1.225 kg/m³ at sea level. */
export function standardDensity(altitudeM: number): number {
  return standardPressure(altitudeM) / (R_AIR * standardTemperature(altitudeM));
}

/** The altitude where pressure has fallen to a given fraction of sea level. */
export function altitudeForPressureFraction(fraction: number): number {
  let lo = 0, hi = 120_000;
  const target = CONSTANTS.atm * fraction;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (standardPressure(mid) > target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------------ *
 * Layers, as a student names them
 * ------------------------------------------------------------------ */

export interface NamedLayer {
  key: string;
  label: string;
  /** Bottom and top in metres, using the conventional teaching boundaries. */
  bottom: number;
  top: number;
  note: string;
}

export const NAMED_LAYERS: NamedLayer[] = [
  {
    key: "troposphere", label: "Troposphere", bottom: 0, top: 12_000,
    note: "All the weather. Gets colder as you climb.",
  },
  {
    key: "stratosphere", label: "Stratosphere", bottom: 12_000, top: 50_000,
    note: "Holds the ozone layer, which warms it from 20 km up.",
  },
  {
    key: "mesosphere", label: "Mesosphere", bottom: 50_000, top: 85_000,
    note: "Coldest place on Earth. Meteors burn up here.",
  },
  {
    key: "thermosphere", label: "Thermosphere", bottom: 85_000, top: 600_000,
    note: "Very hot, but so thin it would not feel hot. Aurorae happen here.",
  },
];

export function layerAt(altitudeM: number): NamedLayer {
  for (const l of NAMED_LAYERS) if (altitudeM < l.top) return l;
  return NAMED_LAYERS[NAMED_LAYERS.length - 1];
}

/* ------------------------------------------------------------------ *
 * Composition of dry air
 * ------------------------------------------------------------------ */

export interface GasShare {
  symbol: string;
  name: string;
  /** Percent by volume of dry air. */
  percent: number;
}

/**
 * Percent by volume of DRY air. Water vapour is left out on purpose: it swings
 * between about 0% over a desert and 4% over a warm ocean, so it is not part of
 * a fixed table. These sum to 100.005 rather than exactly 100 because the
 * classic figures were each measured to their own precision.
 */
export const COMPOSITION: GasShare[] = [
  { symbol: "N₂", name: "Nitrogen", percent: 78.08 },
  { symbol: "O₂", name: "Oxygen", percent: 20.95 },
  { symbol: "Ar", name: "Argon", percent: 0.93 },
  { symbol: "CO₂", name: "Carbon dioxide", percent: 0.042 },
  { symbol: "Ne", name: "Neon", percent: 0.0018 },
  { symbol: "He", name: "Helium", percent: 0.00052 },
  { symbol: "CH₄", name: "Methane", percent: 0.00019 },
  { symbol: "Kr", name: "Krypton", percent: 0.00011 },
];

export const COMPOSITION_SUM = COMPOSITION.reduce((s, g) => s + g.percent, 0);

/* ------------------------------------------------------------------ *
 * The buoyant parcel
 * ------------------------------------------------------------------ */

/**
 * Buoyant acceleration on a parcel of air. At the same pressure, density goes
 * as 1/T, so the ratio of densities is just the inverse ratio of temperatures.
 */
export function buoyantAcceleration(parcelTempK: number, envTempK: number): number {
  return CONSTANTS.g * ((parcelTempK - envTempK) / envTempK);
}

/**
 * How high a parcel starting ΔT warmer can climb before it matches its
 * surroundings. It cools at 9.8 K/km, the air only cools at 6.5 K/km, so the
 * advantage runs out at ΔT / 3.3 K per km.
 */
export function neutralBuoyancyHeight(deltaT: number): number {
  const closing = DRY_ADIABATIC_LAPSE - ENVIRONMENTAL_LAPSE;
  return deltaT > 0 ? deltaT / closing : 0;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface Parcel {
  alt: number;   // m
  vel: number;   // m/s
  temp: number;  // K
  live: boolean;
  peak: number;
}

interface State {
  parcel: Parcel;
  trail: number[];       // altitudes, for the rising trace
  cooldown: number;
  releases: number;
}

type Params = Record<string, number | boolean | string>;

/** Environment temperature, allowing the student to warm or cool the ground. */
function envTemp(altitudeM: number, params: Params): number {
  const offset = (params.surfaceTemp as number) - 288.15;
  // Shifting the surface shifts the troposphere with it and fades out above.
  const fade = Math.max(0, 1 - altitudeM / 20_000);
  return standardTemperature(altitudeM) + offset * fade;
}

function newParcel(params: Params): Parcel {
  const t0 = envTemp(0, params) + (params.parcelWarmth as number);
  return { alt: 0, vel: 0, temp: t0, live: true, peak: 0 };
}

const model: SimModel<State> = {
  init(params) {
    return { parcel: newParcel(params), trail: [0], cooldown: 0, releases: 0 };
  },

  applyParams(state, params, prev) {
    if (params.parcelWarmth !== prev.parcelWarmth || params.surfaceTemp !== prev.surfaceTemp) {
      return { ...state, parcel: newParcel(params), trail: [0] };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown" || (input.type === "action" && input.action === "launch")) {
        s = { ...s, parcel: newParcel(params), trail: [0], releases: s.releases + 1 };
      }
    }
    if (dt <= 0) return s;

    const speed = params.speed as number;
    const h = dt * speed;
    const p = s.parcel;

    if (!p.live) {
      const cooldown = s.cooldown - h;
      if (cooldown <= 0) {
        return { ...s, parcel: newParcel(params), trail: [0], cooldown: 0, releases: s.releases + 1 };
      }
      return { ...s, cooldown };
    }

    const env = envTemp(p.alt, params);
    // Buoyancy, minus a drag term so the parcel settles at its neutral level
    // instead of oscillating forever. Real parcels lose their momentum to
    // mixing in much the same way.
    const a = buoyantAcceleration(p.temp, env) - 0.35 * p.vel;
    const vel = p.vel + a * h;
    const alt = Math.max(0, p.alt + vel * h);
    // Rising air expands and cools at the dry adiabatic rate.
    const temp = p.temp - DRY_ADIABATIC_LAPSE * (alt - p.alt);

    const settled = Math.abs(vel) < 0.08 && alt > 1 && Math.abs(temp - envTemp(alt, params)) < 0.15;
    const sank = alt <= 0 && vel <= 0 && p.alt <= 0.5;

    const trail = s.trail.length > 220 ? s.trail.slice(1) : s.trail.slice();
    trail.push(alt);

    return {
      parcel: {
        alt, vel, temp,
        live: !(settled || sank),
        peak: Math.max(p.peak, alt),
      },
      trail,
      cooldown: settled || sank ? 2.5 : 0,
      releases: s.releases,
    };
  },

  readouts(state, params) {
    const h = params.probeAltitude as number;
    const p = standardPressure(h);
    const t = envTemp(h, params);
    return [
      {
        key: "altitude", label: "Probe altitude", quantity: q(h, "length"), unit: "km",
        semantic: "distance", graphable: true,
      },
      {
        key: "pressure", label: "Air pressure", quantity: q(p, "pressure"), unit: "kPa",
        semantic: "force", graphable: true,
      },
      {
        key: "temperature", label: "Air temperature", quantity: q(t, "temperature"), unit: "°C",
        semantic: "hot", graphable: true,
      },
      {
        key: "density", label: "Air density", quantity: q(p / (R_AIR * t), "density"), unit: "kg/m³",
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "fraction", label: "Share of sea-level pressure",
        quantity: q(p / CONSTANTS.atm, "percent"), unit: "%",
        semantic: "ratio", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "parcelAlt", label: "Warm parcel height", quantity: q(state.parcel.alt, "length"), unit: "m",
        semantic: "velocity", graphable: true,
      },
      {
        key: "parcelTemp", label: "Parcel temperature", quantity: q(state.parcel.temp, "temperature"), unit: "°C",
        semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "densityGap", label: "Parcel minus air density",
        quantity: q(
          standardPressure(state.parcel.alt) / (R_AIR * state.parcel.temp) -
          standardPressure(state.parcel.alt) / (R_AIR * envTemp(state.parcel.alt, params)),
          "density",
        ),
        unit: "kg/m³", semantic: "mass", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const h = params.probeAltitude as number;
    const p = standardPressure(h);
    const t = envTemp(h, params);
    const parcelEnv = envTemp(state.parcel.alt, params);
    return {
      probeAltitudeM: h,
      pressurePa: p,
      pressureHPa: p / 100,
      pressureFraction: p / CONSTANTS.atm,
      temperatureK: t,
      temperatureC: t - 273.15,
      densityKgM3: p / (R_AIR * t),
      layer: layerAt(h).key,
      layerLabel: layerAt(h).label,
      halfPressureAltitudeM: altitudeForPressureFraction(0.5),
      seaLevelPressurePa: CONSTANTS.atm,
      seaLevelDensity: standardDensity(0),
      nitrogenPercent: COMPOSITION[0].percent,
      oxygenPercent: COMPOSITION[1].percent,
      argonPercent: COMPOSITION[2].percent,
      co2Percent: COMPOSITION[3].percent,
      compositionSum: COMPOSITION_SUM,
      troposphereTopM: NAMED_LAYERS[0].top,
      stratosphereTopM: NAMED_LAYERS[1].top,
      mesosphereTopM: NAMED_LAYERS[2].top,
      parcelAltitudeM: state.parcel.alt,
      parcelPeakM: state.parcel.peak,
      parcelTempK: state.parcel.temp,
      parcelRising: state.parcel.vel > 0.05,
      parcelDensity: standardPressure(state.parcel.alt) / (R_AIR * state.parcel.temp),
      envDensity: standardPressure(state.parcel.alt) / (R_AIR * parcelEnv),
      parcelWarmer: state.parcel.temp > parcelEnv,
      predictedNeutralHeightM: neutralBuoyancyHeight(params.parcelWarmth as number),
      releases: state.releases,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Altitude shown at the very top of the stage, m. */
const VIEW_TOP = 100_000;

function altToY(alt: number, height: number): number {
  const groundY = height - 26;
  return groundY - (alt / VIEW_TOP) * (groundY - 14);
}

const LAYER_SEMANTIC: Record<string, string> = {
  troposphere: "liquid",
  stratosphere: "field",
  mesosphere: "cold",
  thermosphere: "charge-neg",
};

/** The vertical journey: ground, layer bands, and the things living in each. */
function drawColumn(rc: RenderContext<State>, x0: number, w: number) {
  const { ctx, theme, height, time, band } = rc;
  const groundY = height - 26;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, w, height);
  ctx.clip();

  // A sky that really does run out: blue at the bottom, black at the top.
  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, "#04070f");
  g.addColorStop(0.35, "#0a1730");
  g.addColorStop(0.72, "#2b6ba8");
  g.addColorStop(1, "#a9d8f2");
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, w, groundY);
  starfield(ctx, w, height * 0.42, 60, 7);

  /* --- layer bands, at their real altitudes ------------------------ */
  for (const l of NAMED_LAYERS) {
    const yTop = altToY(Math.min(l.top, VIEW_TOP), height);
    const yBot = altToY(l.bottom, height);
    const color = theme.sci[LAYER_SEMANTIC[l.key]];
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.fillRect(x0, yTop, w, yBot - yTop);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = hexA(color, 0.8);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, yTop);
    ctx.lineTo(x0 + w, yTop);
    ctx.stroke();
    ctx.restore();
    caption(ctx, x0 + 8, (yTop + yBot) / 2, l.label, theme, {
      size: band === "3-5" ? 12 : 11, color, weight: 700,
    });
    if (band !== "3-5") {
      caption(ctx, x0 + w - 8, yTop + 11,
        `${(Math.min(l.top, VIEW_TOP) / 1000).toFixed(0)} km`, theme,
        { align: "right", size: 10, color: theme.inkSoft });
    }
  }

  /* --- things that live in each layer ------------------------------- */
  // Weather in the troposphere.
  for (let c = 0; c < 3; c++) {
    const cx = x0 + w * (0.28 + c * 0.24) + Math.sin(time * 0.2 + c) * 10;
    const cy = altToY(2000 + c * 1400, height);
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = theme.sci["gas"];
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(cx + (k - 1) * 11, cy, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // The ozone layer, the reason the stratosphere warms upward.
  const ozTop = altToY(35_000, height), ozBot = altToY(15_000, height);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = theme.sci["base"];
  ctx.fillRect(x0, ozTop, w, ozBot - ozTop);
  ctx.restore();
  caption(ctx, x0 + w / 2, (ozTop + ozBot) / 2, "ozone layer", theme, {
    align: "center", size: 10, color: theme.sci["base"],
  });
  // Meteors burning in the mesosphere.
  for (let m = 0; m < 3; m++) {
    const f = (time * 0.35 + m * 0.33) % 1;
    const mx = x0 + w * (0.2 + m * 0.3) + f * 40;
    const my = altToY(85_000 - f * 30_000, height);
    const tail: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) tail.push({ x: mx - i * 3.5, y: my - i * 4.2 });
    comet(ctx, tail.reverse(), theme.sci["hot"], 2.6);
  }
  // The ISS, at 400 km — off the top of this frame, so it is named not drawn.
  caption(ctx, x0 + w / 2, altToY(97_000, height), "space station orbits at 400 km", theme, {
    align: "center", size: 9, color: theme.inkSoft,
  });

  /* --- the ground, with a mountain for scale ------------------------ */
  groundPlane(ctx, groundY, x0, x0 + w, height, theme, "grass");
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["solid"], 0.9);
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.6, groundY);
  ctx.lineTo(x0 + w * 0.72, altToY(8848, height));
  ctx.lineTo(x0 + w * 0.84, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  caption(ctx, x0 + w * 0.72, altToY(8848, height) - 8, "Everest 8.8 km", theme, {
    align: "center", size: 9, color: theme.inkSoft,
  });

  ctx.restore();
}

/** The probe: a balloon on a tether, reading real numbers where it hangs. */
function drawProbe(rc: RenderContext<State>, x0: number, w: number) {
  const { ctx, theme, height, params, band } = rc;
  const h = params.probeAltitude as number;
  const y = altToY(h, height);
  const x = x0 + w * 0.42;
  const p = standardPressure(h);
  const t = envTemp(h, params);
  const rho = p / (R_AIR * t);

  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.4);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + w, y);
  ctx.stroke();
  ctx.restore();

  // A balloon that swells as the outside pressure drops, which is exactly what
  // a real sounding balloon does.
  const swell = Math.min(2.4, Math.pow(CONSTANTS.atm / Math.max(p, 1), 1 / 3));
  const r = 8 * swell;
  glow(ctx, x, y - r, r * 2, theme.accent, 0.3);
  sphere(ctx, x, y - r, r, theme.accent, { glow: 0.25 });
  material(ctx, x - 4, y - 2, 8, 8, theme.inkSoft, 2);

  if (band !== "3-5") {
    badge(ctx, x + r + 14, y - 16, `${(p / 100).toFixed(p < 10 ? 2 : 0)} hPa`, theme, {
      color: theme.sci["force"], sub: `${((p / CONSTANTS.atm) * 100).toFixed(1)}% of sea level`,
    });
    badge(ctx, x + r + 14, y + 14, `${(t - 273.15).toFixed(0)} °C`, theme, {
      color: theme.sci["hot"], sub: `${rho.toFixed(rho < 0.01 ? 5 : 3)} kg/m³`,
    });
  } else {
    badge(ctx, x + r + 14, y, `${(h / 1000).toFixed(0)} km up`, theme, { color: theme.accent });
  }
}

/** The rising parcel — the visible answer to "why does warm air rise". */
function drawParcel(rc: RenderContext<State>, x0: number, w: number) {
  const { ctx, theme, height, state, params, band } = rc;
  const p = state.parcel;
  const x = x0 + w * 0.2;
  const env = envTemp(p.alt, params);
  const warmer = p.temp > env;
  const color = warmer ? theme.sci["hot"] : theme.sci["cold"];

  if (state.trail.length > 1) {
    comet(ctx, state.trail.map((a, i) => ({
      x: x + Math.sin(i * 0.25) * 3,
      y: altToY(a, height),
    })), color, 3);
  }

  const y = altToY(p.alt, height);
  glow(ctx, x, y, 22, color, 0.5);
  sphere(ctx, x, y, band === "3-5" ? 12 : 10, color, { glow: 0.4 });

  // The force that is actually acting, drawn as a force.
  const a = buoyantAcceleration(p.temp, env);
  if (Math.abs(a) > 0.005) {
    arrow(ctx, x, y, x, y - Math.max(-40, Math.min(40, a * 130)), theme.sci["force"], { width: 2.4 });
  }

  if (band !== "3-5") {
    badge(ctx, x, y + 26, `${(p.temp - env >= 0 ? "+" : "")}${(p.temp - env).toFixed(1)} K`, theme, {
      align: "center", color, sub: warmer ? "less dense — rises" : "denser — sinks",
    });
  }
}

/** Temperature and pressure against altitude, side by side with the column. */
function drawProfiles(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params } = rc;
  const probe = params.probeAltitude as number;

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.86);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();

  const padL = 30, padR = 8, padT = 18, padB = 16;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const yOf = (alt: number) => y + padT + plotH - (alt / VIEW_TOP) * plotH;

  caption(ctx, x + 6, y + 10, "temperature", theme, { size: 10, color: theme.sci["hot"] });
  caption(ctx, x + w - 6, y + 10, "pressure", theme, {
    align: "right", size: 10, color: theme.sci["force"],
  });

  // Temperature: the zig-zag that names the layers.
  const tMin = 170, tMax = 700;
  ctx.save();
  ctx.strokeStyle = theme.sci["hot"];
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const alt = (i / 120) * VIEW_TOP;
    const t = standardTemperature(alt);
    const px = x + padL + ((Math.min(tMax, t) - tMin) / (tMax - tMin)) * plotW;
    if (i === 0) ctx.moveTo(px, yOf(alt)); else ctx.lineTo(px, yOf(alt));
  }
  ctx.stroke();
  ctx.restore();

  // Pressure, on a log axis, because it spans five orders of magnitude.
  ctx.save();
  ctx.strokeStyle = theme.sci["force"];
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  const logMin = Math.log10(standardPressure(VIEW_TOP));
  const logMax = Math.log10(CONSTANTS.atm);
  for (let i = 0; i <= 120; i++) {
    const alt = (i / 120) * VIEW_TOP;
    const lp = Math.log10(standardPressure(alt));
    const px = x + padL + ((lp - logMin) / (logMax - logMin)) * plotW;
    if (i === 0) ctx.moveTo(px, yOf(alt)); else ctx.lineTo(px, yOf(alt));
  }
  ctx.stroke();
  ctx.restore();

  // Altitude ticks, so the axis is readable rather than decorative.
  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const alt of [0, 25_000, 50_000, 75_000, 100_000]) {
    ctx.fillText(`${alt / 1000}`, x + padL - 4, yOf(alt));
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + padL, yOf(probe));
  ctx.lineTo(x + w - padR, yOf(probe));
  ctx.stroke();
  ctx.restore();

  // Half the air is below 5.5 km, and that is worth stating on the chart.
  const half = altitudeForPressureFraction(0.5);
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["force"], 0.6);
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x + padL, yOf(half));
  ctx.lineTo(x + w - padR, yOf(half));
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + padL + 4, yOf(half) - 7, `half the pressure: ${(half / 1000).toFixed(1)} km`, theme, {
    size: 9, color: theme.sci["force"],
  });
}

/** What dry air is made of. Nitrogen dominates, and that surprises students. */
function drawComposition(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, band } = rc;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.86);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 6, y + 11, "Dry air by volume", theme, { size: 10, weight: 700 });

  const barY = y + 20;
  const barH = Math.max(12, h - 40);
  const colors = ["gas", "acid", "field", "hot", "base", "wave", "producer", "cold"];
  let cx = x + 6;
  const barW = w - 12;
  COMPOSITION.forEach((gas, i) => {
    const gw = (gas.percent / COMPOSITION_SUM) * barW;
    ctx.save();
    ctx.fillStyle = theme.sci[colors[i % colors.length]];
    ctx.fillRect(cx, barY, Math.max(0.6, gw), barH);
    ctx.restore();
    if (gw > 26 && band !== "3-5") {
      label(ctx, gas.symbol, cx + gw / 2, barY + barH / 2, theme, {
        align: "center", size: 10, color: theme.surface, plate: false,
      });
    }
    cx += gw;
  });

  caption(ctx, x + 6, y + h - 8,
    `N₂ ${COMPOSITION[0].percent}%  ·  O₂ ${COMPOSITION[1].percent}%  ·  Ar ${COMPOSITION[2].percent}%  ·  CO₂ ${COMPOSITION[3].percent}%`,
    theme, { size: 9, color: theme.inkSoft });
}

function render(rc: RenderContext<State>) {
  const { ctx, theme, width, height, band, overlays, params, state } = rc;
  const narrow = width < 560;
  const colW = narrow ? width : Math.round(width * 0.56);

  sky(ctx, width, height, theme, "indoor");
  drawColumn(rc, 0, colW);

  if (overlays.parcel !== false) drawParcel(rc, 0, colW);
  drawProbe(rc, 0, colW);

  if (!narrow) {
    const px = colW + 10;
    const pw = width - colW - 20;
    const showComp = overlays.composition !== false;
    const compH = showComp ? Math.max(58, Math.round(height * 0.24)) : 0;
    if (overlays.profiles !== false) {
      drawProfiles(rc, px, 10, pw, height - compH - 30);
    }
    if (showComp) drawComposition(rc, px, height - compH - 10, pw, compH);
  }

  /* --- the headline, always on the stage --------------------------- */
  const layer = layerAt(params.probeAltitude as number);
  caption(ctx, 10, 16, `${layer.label} — ${layer.note}`, theme, { size: 12, weight: 700 });

  if (band === "9-12" && state.parcel.live) {
    const predicted = neutralBuoyancyHeight(params.parcelWarmth as number);
    caption(ctx, 10, height - 8,
      `parcel cools 9.8 K/km, air only 6.5 K/km → predicted stop at ${(predicted / 1000).toFixed(2)} km`,
      theme, { size: 10, color: theme.inkSoft });
  }

  vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const atmosphereSim: SimManifest<State> = {
  id: "earth.atmosphere",
  title: "Journey Through the Atmosphere",
  tagline: "Fly a probe to the edge of space and read the pressure on the way up.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6", "MS-PS1-4", "HS-ESS2-4"] },
  learningGoals: [
    "Name the four layers of the atmosphere and give the altitude range of each.",
    "State that dry air is about 78% nitrogen and 21% oxygen.",
    "Describe how pressure and density change with altitude, and read real values.",
    "Explain why warm air rises using the relationship between temperature and density.",
  ],
  misconceptions: [
    "Air has no mass",
    "The atmosphere has a sharp edge",
    "Air is mostly oxygen",
    "It gets colder with height all the way up",
    "Warm air rises because heat naturally goes up, rather than because warm air is less dense",
  ],
  interactionHint: "Drag the altitude slider to fly the probe. Click the sky to release a parcel.",
  tickRate: 60,
  params: {
    probeAltitude: {
      type: "number", label: "Probe altitude", kind: "length", unit: "km",
      min: 0, max: 100_000, step: 100, default: 5500,
      marks: [
        { value: 0, label: "Sea level" },
        { value: 5500, label: "Half pressure" },
        { value: 12_000, label: "Tropopause" },
        { value: 50_000, label: "Stratopause" },
        { value: 85_000, label: "Mesopause" },
      ],
      help: "Park the probe anywhere and read the pressure, temperature and density.",
    },
    parcelWarmth: {
      type: "number", label: "Parcel warmth", kind: "temperature", unit: "K",
      min: -5, max: 20, step: 0.5, default: 5,
      help: "How much warmer than its surroundings the released air parcel starts.",
      bands: ["3-5", "6-8", "9-12"],
    },
    surfaceTemp: {
      type: "number", label: "Ground temperature", kind: "temperature", unit: "°C",
      min: 243.15, max: 318.15, step: 1, default: 288.15,
      bands: ["6-8", "9-12"],
      help: "Standard sea-level temperature is 15 °C.",
    },
    speed: {
      type: "number", label: "Speed", kind: "ratio",
      min: 0.25, max: 4, step: 0.25, default: 1,
    },
  },
  overlays: [
    { key: "parcel", label: "Rising air parcel", default: true },
    { key: "profiles", label: "Temperature and pressure charts", default: true, bands: ["6-8", "9-12"] },
    { key: "composition", label: "What air is made of", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "pressure-with-height",
      title: "How fast does the air thin out?",
      question: "How high do you have to go before half the atmosphere is below you?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-5"],
      setup: { probeAltitude: 0, parcelWarmth: 5, surfaceTemp: 288.15, speed: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you move the probe.",
          predict: {
            prompt: "At what height is the air pressure half of what it is at sea level?",
            options: ["About 1 km", "About 5.5 km", "About 30 km", "About 85 km"],
            correct: 1,
            reveal:
              "About 5.5 km — lower than the summit of Denali. Half of the whole atmosphere by mass is below that line.",
          },
        },
        {
          id: "sample",
          phase: "measure",
          title: "Take six readings",
          instruction: "Park the probe at 0, 2, 5.5, 11, 20 and 50 km. Record pressure each time.",
          requireData: 6,
          hints: [
            "Use the marks under the altitude slider to jump straight to each height.",
            "Watch the balloon swell as the pressure outside it drops.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Look at the pattern",
          instruction: "Pressure does not drop by the same amount each kilometre. What does it do?",
          write: {
            prompt: "Describe how pressure changes with height. Is it a straight line?",
            placeholder: "Each time I went up about 5.5 km, the pressure ...",
          },
        },
        {
          id: "top",
          phase: "measure",
          title: "Go to the top",
          instruction: "Take the probe to 85 km and record. What fraction of sea level is left?",
          check: {
            describe: "Probe above 80 km",
            test: (v) => (v.params.probeAltitude as number) >= 80_000,
          },
          requireData: 7,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say why pressure falls the way it does, and where the atmosphere ends.",
          write: {
            prompt: "Why does pressure halve every few kilometres instead of dropping steadily?",
            placeholder: "Pressure at any height is the weight of the air above, so ...",
          },
        },
      ],
    },
    {
      id: "why-warm-air-rises",
      title: "Why does warm air rise?",
      question: "What actually pushes a warm parcel of air upward, and what stops it?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS1-4", "MS-ESS2-6"],
      setup: { probeAltitude: 1500, parcelWarmth: 5, surfaceTemp: 288.15, speed: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before releasing anything.",
          predict: {
            prompt: "A parcel of air 5 K warmer than its surroundings is released at the ground. What happens?",
            options: [
              "It rises forever, because heat goes up",
              "It rises about 1.5 km and stops",
              "It does not move — 5 K is far too small",
            ],
            correct: 1,
            reveal:
              "It rises and then stops. Climbing air cools at 9.8 K/km while the air around it only cools at 6.5 K/km, so a 5 K head start runs out after about 1.5 km.",
          },
        },
        {
          id: "warm",
          phase: "measure",
          title: "Release a warm parcel",
          instruction: "Run it with 5 K of warmth and record the height it settles at.",
          requireData: 2,
          check: {
            describe: "A warm parcel has climbed above 1 km",
            test: (v) => (v.facts.parcelPeakM as number) > 1000,
          },
        },
        {
          id: "warmer",
          phase: "measure",
          title: "Make it much warmer",
          instruction: "Set the warmth to 15 K and record where this parcel stops.",
          check: {
            describe: "Parcel warmth at 15 K or more",
            test: (v) => (v.params.parcelWarmth as number) >= 15,
          },
          requireData: 4,
          hints: ["Three times the head start should buy about three times the height."],
        },
        {
          id: "cold",
          phase: "measure",
          title: "Now try a cold parcel",
          instruction: "Set the warmth below zero. Which way does the arrow point now?",
          check: {
            describe: "A colder-than-surroundings parcel",
            test: (v) => (v.params.parcelWarmth as number) < 0,
          },
          requireData: 5,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it with density",
          instruction: "Use density, not heat, to say why the parcel moved.",
          write: {
            prompt: "Why does warm air rise, and why does it eventually stop?",
            placeholder: "At the same pressure, warmer air is ... so it ... It stops when ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-the-mesopause",
      title: "Find the coldest place on Earth",
      brief: "Park the probe where the atmosphere is coldest.",
      bands: ["6-8", "9-12"],
      setup: { probeAltitude: 0, parcelWarmth: 5, surfaceTemp: 288.15, speed: 1 },
      goal: {
        describe: "Probe within the coldest layer, below −80 °C",
        test: (v) => (v.facts.temperatureC as number) < -80,
      },
      stars: {
        two: {
          describe: "Within 3 km of the mesopause at 85 km",
          test: (v) => Math.abs((v.params.probeAltitude as number) - 85_000) <= 3000,
        },
        three: {
          describe: "Within 1 km of it",
          test: (v) => Math.abs((v.params.probeAltitude as number) - 85_000) <= 1000,
        },
      },
      hints: [
        "It is not the top. The thermosphere is hot.",
        "Look at the temperature curve for the lowest point it reaches.",
      ],
    },
    {
      id: "cumulus-height",
      title: "Build a cumulus cloud",
      brief: "Release a parcel that stops between 2.5 and 3.5 km — real fair-weather cloud height.",
      bands: ["9-12"],
      setup: { probeAltitude: 3000, parcelWarmth: 2, surfaceTemp: 288.15, speed: 1.5 },
      goal: {
        describe: "Parcel peak between 2.5 and 3.5 km",
        test: (v) => (v.facts.parcelPeakM as number) >= 2500 && (v.facts.parcelPeakM as number) <= 3500,
      },
      stars: {
        two: {
          describe: "Within 200 m of 3 km",
          test: (v) => Math.abs((v.facts.parcelPeakM as number) - 3000) <= 200,
        },
      },
      hints: [
        "The parcel loses its advantage at 9.8 − 6.5 = 3.3 K per kilometre.",
        "So work out the warmth you need: 3 km × 3.3 K/km.",
      ],
    },
  ],
};
