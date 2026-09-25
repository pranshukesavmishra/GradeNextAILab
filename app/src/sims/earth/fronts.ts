import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, disc, label, roundRect } from "@ui/draw";
import {
  badge, caption, glow, groundPlane, hexA, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Air Masses and Fronts — Grades 6-12.
 *
 * A weather map with a front crossing it, and underneath, a cut through the
 * atmosphere along the same line so a student can see what the map symbol
 * actually stands for.
 *
 * The difference between a cold front and a warm front comes down to one
 * number: the slope of the surface between the two air masses. Cold, dense air
 * bulldozes under warm air and makes a steep wedge, about 1 in 70. Warm air
 * has to climb over a cold wedge already lying there, and can only manage about
 * 1 in 200. Air riding that surface goes up at the front's speed multiplied by
 * its slope, so a cold front lifts air roughly five times as fast — which is
 * exactly why one gives you a towering cumulonimbus and half an hour of
 * downpour, and the other gives you a grey sky and eight hours of drizzle.
 *
 * Everything a station records — the temperature drop, the V in the pressure
 * trace, the wind veering round — comes from one distance-to-the-front
 * calculation, so the traces stay consistent with the map.
 */

/* ------------------------------------------------------------------ *
 * The four fronts
 * ------------------------------------------------------------------ */

export interface FrontKind {
  key: string;
  label: string;
  /** Vertical rise per unit horizontal run of the frontal surface. */
  slope: number;
  /** How fast the front travels, m/s. */
  speedMs: number;
  /** Half-width of the temperature transition, km. */
  zoneKm: number;
  /** Where the rain band sits relative to the surface front, km (+ = ahead). */
  rainOffsetKm: number;
  /** Half-width of the rain band, km. */
  rainWidthKm: number;
  /** Peak rain rate, mm/h, at full moisture. */
  peakRainMmH: number;
  /** Top of the cloud the lift builds, km. */
  cloudTopKm: number;
  /** Cloud a forecaster would name. */
  cloudType: string;
  /** Wind direction before and after passage, degrees the wind comes from. */
  windBeforeDeg: number;
  windAfterDeg: number;
  /** True when the air behind is the colder air mass. */
  coldBehind: boolean;
  note: string;
}

export const FRONTS: Record<string, FrontKind> = {
  cold: {
    key: "cold", label: "Cold front", slope: 1 / 70, speedMs: 13, zoneKm: 40,
    rainOffsetKm: 15, rainWidthKm: 35, peakRainMmH: 18, cloudTopKm: 12,
    cloudType: "cumulonimbus",
    windBeforeDeg: 225, windAfterDeg: 315, coldBehind: true,
    note: "Dense cold air wedges underneath. Steep lift, tall cloud, short violent rain.",
  },
  warm: {
    key: "warm", label: "Warm front", slope: 1 / 200, speedMs: 8, zoneKm: 160,
    rainOffsetKm: 260, rainWidthKm: 190, peakRainMmH: 2.4, cloudTopKm: 6,
    cloudType: "nimbostratus",
    windBeforeDeg: 135, windAfterDeg: 225, coldBehind: false,
    note: "Warm air climbs a shallow ramp. Layered cloud and hours of light rain.",
  },
  occluded: {
    key: "occluded", label: "Occluded front", slope: 1 / 100, speedMs: 10, zoneKm: 70,
    rainOffsetKm: 60, rainWidthKm: 110, peakRainMmH: 5, cloudTopKm: 9,
    cloudType: "nimbostratus with embedded cumulonimbus",
    windBeforeDeg: 180, windAfterDeg: 300, coldBehind: true,
    note: "The cold front has caught the warm one and lifted the warm air clear off the ground.",
  },
  stationary: {
    key: "stationary", label: "Stationary front", slope: 1 / 150, speedMs: 1, zoneKm: 90,
    rainOffsetKm: 30, rainWidthKm: 160, peakRainMmH: 3, cloudTopKm: 7,
    cloudType: "stratus and nimbostratus",
    windBeforeDeg: 180, windAfterDeg: 20, coldBehind: false,
    note: "Neither air mass can shift the other, so the same weather sits there for days.",
  },
};

/**
 * Vertical speed of air riding the frontal surface, m/s. This is the whole
 * difference between the two front types, in one line of arithmetic.
 */
export function liftRate(kind: FrontKind, speedScale = 1): number {
  return kind.speedMs * speedScale * kind.slope;
}

/** Angle of the frontal surface above the ground, in degrees. */
export function slopeAngleDeg(kind: FrontKind): number {
  return (Math.atan(kind.slope) * 180) / Math.PI;
}

/* ------------------------------------------------------------------ *
 * Pressure systems
 * ------------------------------------------------------------------ */

export interface PressureSystem {
  key: string;
  label: string;
  /** Pressure at the centre, hPa. */
  centreHPa: number;
  /** Which way the surface wind turns around it in the northern hemisphere. */
  sense: "counterclockwise" | "clockwise";
  /** Air motion in the middle. */
  vertical: "rising" | "sinking";
  sky: string;
}

export const SYSTEMS: Record<string, PressureSystem> = {
  low: {
    key: "low", label: "Low pressure (cyclone)", centreHPa: 988,
    sense: "counterclockwise", vertical: "rising",
    sky: "Air spirals in and is forced up, so it cools, condenses and rains.",
  },
  high: {
    key: "high", label: "High pressure (anticyclone)", centreHPa: 1028,
    sense: "clockwise", vertical: "sinking",
    sky: "Air sinks and warms, so cloud evaporates. Settled and clear.",
  },
};

/** Air density used for the geostrophic wind estimate, kg/m³. */
const RHO_AIR = 1.2;
/** Coriolis parameter at 40°N, s⁻¹. */
export const CORIOLIS_40N = 2 * 7.2921e-5 * Math.sin((40 * Math.PI) / 180);

/**
 * Geostrophic wind from a pressure gradient. Two hectopascals per hundred
 * kilometres at 40°N gives about 18 m/s, which is why tightly packed isobars
 * on a chart mean a windy day.
 */
export function geostrophicWind(gradientHPaPer100km: number): number {
  const dpdx = (gradientHPaPer100km * 100) / 1e5; // Pa per metre
  return dpdx / (RHO_AIR * CORIOLIS_40N);
}

/* ------------------------------------------------------------------ *
 * What one station records as the front goes past
 * ------------------------------------------------------------------ */

export interface Conditions {
  tempC: number;
  pressureHPa: number;
  windFromDeg: number;
  windMs: number;
  rainRateMmH: number;
  cloudTopKm: number;
  /** Kilometres from the surface front. Positive means the front is still coming. */
  distanceKm: number;
  ahead: boolean;
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function compassName(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(d / 22.5) % 16];
}

export interface FrontSetup {
  kind: FrontKind;
  system: PressureSystem;
  /** Temperature difference between the two air masses, K. */
  contrastK: number;
  /** 0 to 1. Scales the rain and how tall the cloud gets. */
  moisture: number;
  speedScale: number;
}

/**
 * One function drives the whole sim. Everything a station reports is a
 * function of how far it is from the surface front.
 */
export function stationConditions(distanceKm: number, s: FrontSetup): Conditions {
  const k = s.kind;
  const d = distanceKm;
  // A smooth transition across the frontal zone, warm on the side the warm air
  // mass is on. tanh is the standard idealisation of a frontal temperature step.
  const blend = 0.5 * (1 + Math.tanh(d / k.zoneKm));
  const warmSide = k.coldBehind ? blend : 1 - blend;
  const warmC = 14 + s.contrastK / 2;
  const coldC = 14 - s.contrastK / 2;
  const tempC = coldC + (warmC - coldC) * warmSide;

  // A V-shaped trough at the front sitting inside the broader synoptic field,
  // with higher pressure behind a cold front — the classic barograph trace.
  const trough = 9 * (1 / Math.cosh(d / (k.zoneKm * 1.4)));
  const behindRise = k.coldBehind ? 10 * (1 - blend) : 0;
  const base = s.system.centreHPa + 22;
  const pressureHPa = base - trough + behindRise;

  // Wind veers through the front. Both fronts modelled here veer clockwise,
  // which is what a northern-hemisphere station actually observes.
  const windFromDeg = k.windAfterDeg + (k.windBeforeDeg - k.windAfterDeg) * blend;
  const gradient = 1.4 + 2.6 * (1 / Math.cosh(d / (k.zoneKm * 2)));
  const windMs = Math.abs(geostrophicWind(gradient));

  const rainX = (d - k.rainOffsetKm) / k.rainWidthKm;
  const rainRateMmH = k.peakRainMmH * s.moisture * Math.exp(-rainX * rainX);
  const cloudTopKm = k.cloudTopKm * (0.45 + 0.55 * s.moisture);

  return { tempC, pressureHPa, windFromDeg, windMs, rainRateMmH, cloudTopKm, distanceKm: d, ahead: d > 0 };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/** Station positions along the map, km from the western edge. */
export const STATION_KM = [150, 400, 650, 900, 1100];
export const STATION_NAME = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];
const MAP_KM = 1250;

interface Sample { h: number; t: number; p: number; w: number }

interface State {
  /** Position of the surface front along the map, km. */
  frontKm: number;
  hours: number;
  rainTotalMm: number;
  samples: Sample[];
  maxTempC: number;
  minTempC: number;
  minPressure: number;
  maxPressure: number;
  firstWindDeg: number;
  passedStations: number;
}

type Params = Record<string, number | boolean | string>;

function setupOf(params: Params): FrontSetup {
  return {
    kind: FRONTS[params.frontType as string] ?? FRONTS.cold,
    system: SYSTEMS[params.pressureSystem as string] ?? SYSTEMS.low,
    contrastK: params.contrast as number,
    moisture: params.moisture as number,
    speedScale: params.frontSpeed as number,
  };
}

function stationKm(params: Params): number {
  const i = Math.round(params.station as number) - 1;
  return STATION_KM[Math.max(0, Math.min(STATION_KM.length - 1, i))];
}

function fresh(): State {
  return {
    frontKm: -180, hours: 0, rainTotalMm: 0, samples: [],
    maxTempC: -99, minTempC: 99, minPressure: 9999, maxPressure: 0,
    firstWindDeg: -1, passedStations: 0,
  };
}

const MAX_SAMPLES = 320;

const model: SimModel<State> = {
  init() {
    return fresh();
  },

  applyParams(state, params, prev) {
    if (params.frontType !== prev.frontType || params.station !== prev.station) return fresh();
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown" || (input.type === "action" && input.action === "launch")) {
        s = fresh();
      }
    }
    if (dt <= 0) return s;

    const setup = setupOf(params);
    // One real second is one simulated hour, so a 47 km/h front takes about
    // 25 seconds to cross the whole 1250 km map.
    const hours = dt * (params.speed as number);
    const kmPerHour = setup.kind.speedMs * setup.speedScale * 3.6;
    let frontKm = s.frontKm + kmPerHour * hours;
    if (frontKm > MAP_KM + 250) frontKm = -180;

    const d = stationKm(params) - frontKm;
    const c = stationConditions(d, setup);

    const samples = s.samples.length >= MAX_SAMPLES ? s.samples.slice(1) : s.samples.slice();
    samples.push({ h: s.hours + hours, t: c.tempC, p: c.pressureHPa, w: c.windFromDeg });

    let passed = 0;
    for (const km of STATION_KM) if (frontKm > km) passed++;

    return {
      frontKm,
      hours: s.hours + hours,
      rainTotalMm: s.rainTotalMm + c.rainRateMmH * hours,
      samples,
      maxTempC: Math.max(s.maxTempC, c.tempC),
      minTempC: Math.min(s.minTempC, c.tempC),
      minPressure: Math.min(s.minPressure, c.pressureHPa),
      maxPressure: Math.max(s.maxPressure, c.pressureHPa),
      firstWindDeg: s.firstWindDeg < 0 ? c.windFromDeg : s.firstWindDeg,
      passedStations: passed,
    };
  },

  readouts(state, params) {
    const setup = setupOf(params);
    const c = stationConditions(stationKm(params) - state.frontKm, setup);
    return [
      {
        key: "temperature", label: "Station temperature",
        quantity: q(c.tempC + 273.15, "temperature"), unit: "°C",
        semantic: "hot", graphable: true,
      },
      {
        key: "pressure", label: "Station pressure", quantity: q(c.pressureHPa * 100, "pressure"), unit: "kPa",
        semantic: "force", graphable: true,
      },
      {
        key: "windDir", label: "Wind from", quantity: q((c.windFromDeg * Math.PI) / 180, "angle"), unit: "°",
        semantic: "velocity", graphable: true,
      },
      {
        key: "windSpeed", label: "Wind speed", quantity: q(c.windMs, "velocity"), unit: "m/s",
        semantic: "velocity", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "rain", label: "Rain rate (mm/h)", quantity: q(c.rainRateMmH, "ratio"),
        semantic: "liquid", graphable: true,
      },
      {
        key: "rainTotal", label: "Rain so far", quantity: q(state.rainTotalMm / 1000, "length"), unit: "mm",
        semantic: "distance", graphable: true,
      },
      {
        key: "distance", label: "Distance to the front", quantity: q((stationKm(params) - state.frontKm) * 1000, "length"),
        unit: "km", semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "lift", label: "Lift rate (m/s)", quantity: q(liftRate(setup.kind, setup.speedScale), "ratio"),
        semantic: "velocity", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const setup = setupOf(params);
    const d = stationKm(params) - state.frontKm;
    const c = stationConditions(d, setup);
    return {
      frontType: setup.kind.key,
      frontLabel: setup.kind.label,
      cloudType: setup.kind.cloudType,
      slope: setup.kind.slope,
      slopeAngleDeg: slopeAngleDeg(setup.kind),
      frontSpeedMs: setup.kind.speedMs * setup.speedScale,
      liftRateMs: liftRate(setup.kind, setup.speedScale),
      coldSlope: FRONTS.cold.slope,
      warmSlope: FRONTS.warm.slope,
      coldLiftMs: liftRate(FRONTS.cold),
      warmLiftMs: liftRate(FRONTS.warm),
      cloudTopKm: c.cloudTopKm,
      pressureSystem: setup.system.key,
      centrePressureHPa: setup.system.centreHPa,
      rotationSense: setup.system.sense,
      verticalMotion: setup.system.vertical,
      geostrophicWindMs: geostrophicWind(2),
      stationName: STATION_NAME[Math.round(params.station as number) - 1] ?? "Alpha",
      stationKm: stationKm(params),
      frontKm: state.frontKm,
      distanceKm: d,
      stationTempC: c.tempC,
      stationPressureHPa: c.pressureHPa,
      stationWindDeg: c.windFromDeg,
      stationWindName: compassName(c.windFromDeg),
      stationWindMs: c.windMs,
      rainRateMmH: c.rainRateMmH,
      rainTotalMm: state.rainTotalMm,
      passed: d < 0,
      passedStations: state.passedStations,
      tempSwingC: state.maxTempC > -98 ? state.maxTempC - state.minTempC : 0,
      pressureDropHPa: state.maxPressure > 0 ? state.maxPressure - state.minPressure : 0,
      windShiftDeg: state.firstWindDeg >= 0 ? Math.abs(c.windFromDeg - state.firstWindDeg) : 0,
      hours: state.hours,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View — the map
 * ------------------------------------------------------------------ */

/** Meteorological front symbols: triangles for cold, half-discs for warm. */
function drawFrontSymbols(
  rc: RenderContext<State>, x: number, yTop: number, yBot: number, kind: FrontKind,
) {
  const { ctx, theme } = rc;
  const cold = theme.sci["cold"];
  const warm = theme.sci["hot"];

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = kind.key === "warm" ? warm : kind.key === "occluded" ? theme.sci["charge-neg"] : cold;
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x, yBot);
  ctx.stroke();
  ctx.restore();

  const step = 26;
  let i = 0;
  for (let y = yTop + 12; y < yBot - 6; y += step, i++) {
    const alternate = kind.key === "occluded" ? i % 2 === 0 : kind.key !== "warm";
    const stationaryFlip = kind.key === "stationary" && i % 2 === 1;
    const side = stationaryFlip ? -1 : 1;
    ctx.save();
    ctx.fillStyle = alternate && !stationaryFlip ? cold : warm;
    if (alternate && !stationaryFlip) {
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 10 * side, y);
      ctx.lineTo(x, y + 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 7, -Math.PI / 2, Math.PI / 2, side < 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMap(rc: RenderContext<State>, h: number) {
  const { ctx, state, params, theme, width, band, overlays } = rc;
  const setup = setupOf(params);
  const toX = (km: number) => (km / MAP_KM) * width;

  sky(ctx, width, h, theme, "indoor");
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["producer"], 0.1);
  ctx.fillRect(0, 0, width, h);
  ctx.restore();

  /* --- the two air masses, shaded so the map is not a blank sheet --- */
  const fx = toX(state.frontKm);
  const coldSide = setup.kind.coldBehind ? 0 : 1;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = theme.sci["cold"];
  ctx.fillRect(coldSide === 0 ? 0 : fx, 0, coldSide === 0 ? Math.max(0, fx) : width - fx, h);
  ctx.fillStyle = theme.sci["hot"];
  ctx.fillRect(coldSide === 0 ? Math.max(0, fx) : 0, 0, coldSide === 0 ? width - fx : Math.max(0, fx), h);
  ctx.restore();
  caption(ctx, Math.max(8, fx - 90), 16,
    setup.kind.coldBehind ? "cold, dry air mass" : "cool air mass", theme,
    { size: 11, color: theme.sci["cold"], weight: 700 });
  caption(ctx, Math.min(width - 8, fx + 90), 16, "warm, moist air mass", theme,
    { align: "right", size: 11, color: theme.sci["hot"], weight: 700 });

  /* --- the pressure system, with isobars round it ------------------- */
  if (overlays.isobars !== false) {
    const cx = fx - 180;
    const cy = h * 0.12;
    for (let i = 1; i <= 5; i++) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["force"], 0.4);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, i * 52, i * 30, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (band !== "3-5") {
        label(ctx, `${setup.system.centreHPa + i * 4}`, cx + i * 52, cy, theme, {
          size: 9, color: theme.inkSoft, align: "center",
        });
      }
    }
    caption(ctx, cx, cy, setup.system.key === "low" ? "L" : "H", theme, {
      align: "center", size: 24, weight: 800,
      color: setup.system.key === "low" ? theme.sci["cold"] : theme.sci["hot"],
    });
    // Which way the air turns, drawn rather than asserted.
    const turn = setup.system.sense === "counterclockwise" ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rc.time * 0.25 * turn;
      const r = 66;
      const bx = cx + Math.cos(a) * r * 1.7;
      const by = cy + Math.sin(a) * r;
      arrow(ctx, bx, by, bx - Math.sin(a) * 26 * turn * 1.7, by + Math.cos(a) * 26 * turn,
        hexA(theme.sci["velocity"], 0.75), { width: 2 });
    }
  }

  /* --- the front itself --------------------------------------------- */
  if (overlays.frontSymbols !== false) {
    drawFrontSymbols(rc, fx, h * 0.2, h - 6, setup.kind);
  }

  /* --- the stations, with their live readings ----------------------- */
  const selected = Math.round(params.station as number) - 1;
  STATION_KM.forEach((km, i) => {
    const c = stationConditions(km - state.frontKm, setup);
    const x = toX(km);
    const y = h * (0.42 + (i % 2) * 0.28);
    const isSel = i === selected;
    if (isSel) glow(ctx, x, y, 26, theme.accent, 0.5);
    disc(ctx, x, y, isSel ? 9 : 6,
      c.rainRateMmH > 0.4 ? theme.sci["liquid"] : hexA(theme.surface, 0.9),
      { stroke: isSel ? theme.accent : theme.inkSoft, lineWidth: isSel ? 2.5 : 1.4 });
    // Wind shaft pointing the way the wind blows, from the direction reported.
    const a = ((c.windFromDeg + 90) * Math.PI) / 180;
    arrow(ctx, x - Math.cos(a) * 20, y - Math.sin(a) * 20, x, y,
      theme.sci["velocity"], { width: 1.8 });
    if (band !== "3-5") {
      label(ctx, `${c.tempC.toFixed(0)}°`, x - 12, y - 14, theme, {
        align: "right", size: 10, color: theme.sci["hot"],
      });
      label(ctx, `${c.pressureHPa.toFixed(0)}`, x + 12, y - 14, theme, {
        size: 10, color: theme.sci["force"],
      });
    }
    caption(ctx, x, y + 20, STATION_NAME[i], theme, {
      align: "center", size: 9, color: isSel ? theme.accent : theme.inkSoft,
    });
  });

  caption(ctx, 8, h - 8, `${setup.kind.label} moving east at ${(setup.kind.speedMs * setup.speedScale * 3.6).toFixed(0)} km/h`,
    theme, { size: 11, weight: 700 });
}

/* ------------------------------------------------------------------ *
 * View — the cross-section
 * ------------------------------------------------------------------ */

function drawCrossSection(rc: RenderContext<State>, y0: number, h: number) {
  const { ctx, state, params, theme, width, band, time } = rc;
  const setup = setupOf(params);
  const kind = setup.kind;

  // 600 km across, 13 km up. That is about a 45× vertical exaggeration, which
  // is the only way a 1-in-70 slope and a 12 km cloud fit on one screen.
  const spanKm = 600;
  const topKm = 13;
  const groundY = y0 + h - 20;
  const toX = (km: number) => ((km + spanKm / 2) / spanKm) * width;
  const toY = (km: number) => groundY - (km / topKm) * (groundY - y0 - 10);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, width, h);
  ctx.clip();

  sky(ctx, width, y0 + h, theme, "day", groundY);

  /* --- the two air masses, separated by the frontal surface --------- */
  const dir = kind.coldBehind ? -1 : 1;   // which way the cold wedge points
  const surfaceKm = (x: number) => Math.max(0, dir * x * kind.slope);
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = theme.sci["cold"];
  ctx.beginPath();
  ctx.moveTo(toX(-spanKm / 2), groundY);
  for (let km = -spanKm / 2; km <= spanKm / 2; km += 10) {
    ctx.lineTo(toX(km), toY(Math.min(topKm, surfaceKm(km))));
  }
  ctx.lineTo(toX(spanKm / 2), groundY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.sci["cold"];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let km = -spanKm / 2; km <= spanKm / 2; km += 10) {
    ctx.lineTo(toX(km), toY(Math.max(0, Math.min(topKm, surfaceKm(km)))));
  }
  ctx.stroke();
  ctx.restore();

  /* --- the cloud the lift builds ------------------------------------ */
  const top = stationConditions(0, setup).cloudTopKm;
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = theme.sci["gas"];
  if (kind.key === "cold" || kind.key === "occluded") {
    // A tower: narrow base, anvil at the top.
    ctx.beginPath();
    ctx.moveTo(toX(-40), groundY);
    ctx.lineTo(toX(-55), toY(top * 0.75));
    ctx.lineTo(toX(-110), toY(top));
    ctx.lineTo(toX(60), toY(top));
    ctx.lineTo(toX(35), toY(top * 0.7));
    ctx.lineTo(toX(55), groundY);
    ctx.closePath();
    ctx.fill();
  } else {
    // A ramp of layered cloud reaching hundreds of kilometres ahead.
    ctx.beginPath();
    ctx.moveTo(toX(-20), groundY);
    ctx.lineTo(toX(-20), toY(0.6));
    for (let km = -20; km <= spanKm / 2; km += 20) {
      ctx.lineTo(toX(km), toY(Math.min(top, 0.6 + (km + 20) * kind.slope)));
    }
    ctx.lineTo(toX(spanKm / 2), groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  caption(ctx, toX(kind.key === "warm" ? 200 : -20), toY(top) - 8, kind.cloudType, theme, {
    align: "center", size: 10, color: theme.inkSoft,
  });

  /* --- the rain, in the band where it actually falls ---------------- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.7);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 60; i++) {
    const km = kind.rainOffsetKm + (((i * 0.173) % 1) - 0.5) * kind.rainWidthKm * 2.2;
    if (Math.abs(km) > spanKm / 2) continue;
    const intensity = stationConditions(km, setup).rainRateMmH;
    if (intensity < 0.3) continue;
    const x = toX(km);
    const span = groundY - toY(Math.min(top, 3));
    const yy = toY(Math.min(top, 3)) + ((time * 220 + i * 31) % Math.max(20, span));
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x - 2, yy + 9);
    ctx.stroke();
  }
  ctx.restore();

  /* --- the lift itself: the number that separates the two fronts ---- */
  const w = liftRate(kind, setup.speedScale);
  const lx = toX(kind.key === "warm" ? 120 : -25);
  arrow(ctx, lx, toY(0.3), lx, toY(Math.min(top, 0.3 + w * 42)), theme.sci["velocity"], { width: 2.6 });
  if (band !== "3-5") {
    badge(ctx, lx + 14, toY(Math.min(top, 0.3 + w * 42)) + 8, `${w.toFixed(2)} m/s`, rc.theme, {
      color: theme.sci["velocity"], sub: "lift",
    });
  }

  groundPlane(ctx, groundY, 0, width, y0 + h, theme, "grass");

  /* --- the station standing on the ground where the map says it is -- */
  const d = stationKm(params) - state.frontKm;
  if (Math.abs(d) < spanKm / 2) {
    const sx = toX(d);
    sphere(ctx, sx, groundY - 6, 5, theme.accent, { glow: 0.4 });
    caption(ctx, sx, groundY - 18, "you", theme, {
      align: "center", size: 10, color: theme.accent, weight: 700,
    });
  }

  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("−300 km", toX(-260), groundY + 13);
  ctx.fillText("front", toX(0), groundY + 13);
  ctx.fillText("+300 km", toX(260), groundY + 13);
  ctx.restore();

  caption(ctx, 8, y0 + 14,
    `slope 1 in ${Math.round(1 / kind.slope)}  ·  ${slopeAngleDeg(kind).toFixed(2)}°  ·  vertical scale ×45`,
    theme, { size: 10, color: theme.inkSoft });

  ctx.restore();
}

/** The barograph and thermograph trace, which is what D4.6 asks a student to build. */
function drawTrace(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  if (state.samples.length < 2) return;

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.88);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();

  const t0 = state.samples[0].h;
  const t1 = state.samples[state.samples.length - 1].h;
  const span = Math.max(0.5, t1 - t0);
  const px = (h2: number) => x + 4 + ((h2 - t0) / span) * (w - 8);

  const temps = state.samples.map((s) => s.t);
  const tMin = Math.min(...temps) - 1, tMax = Math.max(...temps) + 1;
  const pres = state.samples.map((s) => s.p);
  const pMin = Math.min(...pres) - 1, pMax = Math.max(...pres) + 1;

  ctx.save();
  ctx.strokeStyle = theme.sci["hot"];
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  state.samples.forEach((s, i) => {
    const py = y + h - 4 - ((s.t - tMin) / (tMax - tMin)) * (h - 16);
    if (i === 0) ctx.moveTo(px(s.h), py); else ctx.lineTo(px(s.h), py);
  });
  ctx.stroke();
  ctx.strokeStyle = theme.sci["force"];
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  state.samples.forEach((s, i) => {
    const py = y + h - 4 - ((s.p - pMin) / (pMax - pMin)) * (h - 16);
    if (i === 0) ctx.moveTo(px(s.h), py); else ctx.lineTo(px(s.h), py);
  });
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 5, y + 9, "temperature", theme, { size: 9, color: theme.sci["hot"] });
  caption(ctx, x + w - 5, y + 9, "pressure", theme, {
    align: "right", size: 9, color: theme.sci["force"],
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const setup = setupOf(params);
  const showSection = overlays.crossSection !== false && height > 260;
  const mapH = showSection ? Math.round(height * 0.46) : height;

  drawMap(rc, mapH);
  if (showSection) {
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.beginPath();
    ctx.moveTo(0, mapH);
    ctx.lineTo(width, mapH);
    ctx.stroke();
    ctx.restore();
    drawCrossSection(rc, mapH, height - mapH);
  }

  if (overlays.trace !== false && band !== "3-5") {
    drawTrace(rc, width - 190, 8, 182, 62);
  }

  const c = stationConditions(stationKm(params) - state.frontKm, setup);
  badge(ctx, 8, mapH - 34, `${c.tempC.toFixed(1)} °C`, theme, { color: theme.sci["hot"] });
  badge(ctx, 92, mapH - 34, `${c.pressureHPa.toFixed(0)} hPa`, theme, { color: theme.sci["force"] });
  badge(ctx, 196, mapH - 34, `${compassName(c.windFromDeg)} ${c.windMs.toFixed(0)} m/s`, theme, {
    color: theme.sci["velocity"],
  });

  if (band !== "3-5") {
    caption(ctx, width - 10, mapH - 10, setup.system.sky, theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
  }

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const frontsSim: SimManifest<State> = {
  id: "earth.fronts",
  title: "Air Masses and Fronts",
  tagline: "Watch a front cross the map, then look underneath it to see why the rain is different.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6", "HS-ESS2-4"] },
  learningGoals: [
    "Describe an air mass by the source region that gave it its temperature and moisture.",
    "Explain why a cold front lifts air more steeply than a warm front, and what that does to the weather.",
    "Read the temperature, pressure and wind changes a station records as a front passes.",
    "Say what high and low pressure systems do to the air, and which way the wind turns around each.",
  ],
  misconceptions: [
    "A cold front brings cold weather but a warm front brings hot weather, and that is all there is to it",
    "Fronts are walls of weather rather than sloping surfaces between air masses",
    "All fronts bring the same kind of rain",
    "The wind blows straight from high pressure to low pressure",
    "An occluded front is a front that has stopped",
  ],
  interactionHint: "Press play and watch the front reach your station. Then switch to a warm front.",
  tickRate: 60,
  params: {
    frontType: {
      type: "option", label: "Front",
      options: [
        { value: "cold", label: "Cold front" },
        { value: "warm", label: "Warm front" },
        { value: "occluded", label: "Occluded front" },
        { value: "stationary", label: "Stationary front" },
      ],
      default: "cold",
      help: "Each one has a different slope, and the slope sets everything else.",
    },
    pressureSystem: {
      type: "option", label: "Pressure system",
      options: [
        { value: "low", label: "Low (cyclone)" },
        { value: "high", label: "High (anticyclone)" },
      ],
      default: "low",
      bands: ["6-8", "9-12"],
    },
    station: {
      type: "number", label: "Your station", kind: "count",
      min: 1, max: 5, step: 1, default: 3,
      help: "Which of the five stations you are standing at.",
    },
    contrast: {
      type: "number", label: "Air mass contrast", kind: "temperature", unit: "K",
      min: 2, max: 24, step: 1, default: 12,
      bands: ["6-8", "9-12"],
      help: "How different the two air masses are. Bigger contrast, sharper front.",
    },
    moisture: {
      type: "number", label: "Moisture", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.75,
      bands: ["6-8", "9-12"],
    },
    frontSpeed: {
      type: "number", label: "Front speed", kind: "ratio",
      min: 0.25, max: 2, step: 0.25, default: 1,
      bands: ["6-8", "9-12"],
    },
    speed: {
      type: "number", label: "Hours per second", kind: "ratio",
      min: 0.5, max: 8, step: 0.5, default: 2,
    },
  },
  overlays: [
    { key: "crossSection", label: "Cross-section", default: true },
    { key: "isobars", label: "Isobars and circulation", default: true, bands: ["6-8", "9-12"] },
    { key: "frontSymbols", label: "Front symbols", default: true },
    { key: "trace", label: "Station trace", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "track-a-front",
      title: "Track a front across the map",
      question: "What does a station record as a cold front goes past?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-5"],
      setup: { frontType: "cold", pressureSystem: "low", station: 3, contrast: 12, moisture: 0.75, frontSpeed: 1, speed: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before the front reaches you.",
          predict: {
            prompt: "What will the barometer do as the cold front arrives and then passes?",
            options: [
              "Rise the whole time",
              "Fall to a minimum at the front, then rise sharply",
              "Stay flat — pressure has nothing to do with fronts",
            ],
            correct: 1,
            reveal:
              "The trace makes a V. Pressure falls as the trough arrives and rises hard behind it as the cold dense air moves in.",
          },
        },
        {
          id: "before",
          phase: "measure",
          title: "Record ahead of the front",
          instruction: "Before it arrives, record temperature, pressure and wind direction.",
          requireData: 2,
          check: {
            describe: "The front has not reached you yet",
            test: (v) => (v.facts.distanceKm as number) > 60,
          },
        },
        {
          id: "during",
          phase: "measure",
          title: "Record as it passes",
          instruction: "Keep recording while it crosses your station. Watch the rain rate.",
          requireData: 6,
          check: {
            describe: "The front has passed your station",
            test: (v) => Boolean(v.facts.passed),
          },
          hints: ["Turn the speed down so you catch the moment it arrives."],
        },
        {
          id: "after",
          phase: "measure",
          title: "Record behind it",
          instruction: "Carry on until the temperature has settled in the new air mass.",
          requireData: 9,
          check: {
            describe: "A temperature swing of at least 6 K recorded",
            test: (v) => (v.facts.tempSwingC as number) >= 6,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the forecast rule",
          instruction: "Say how a forecaster would know a cold front had passed, using three readings.",
          write: {
            prompt: "Give three readings that together show a cold front has just gone through.",
            placeholder: "The temperature ..., the pressure ..., and the wind ...",
          },
        },
      ],
    },
    {
      id: "steep-vs-shallow",
      title: "Steep front, shallow front",
      question: "Why does one front give half an hour of downpour and the other eight hours of drizzle?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-5", "MS-ESS2-6"],
      setup: { frontType: "cold", pressureSystem: "low", station: 3, contrast: 12, moisture: 0.85, frontSpeed: 1, speed: 3 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Look at the cross-section before you answer.",
          predict: {
            prompt: "Why does a cold front build much taller cloud than a warm front?",
            options: [
              "Cold air holds more water",
              "Its surface is far steeper, so it lifts air much faster",
              "Cold fronts move faster, so there is less time for rain",
            ],
            correct: 1,
            reveal:
              "Slope is the answer. Air riding a 1-in-70 surface goes up about five times faster than air riding a 1-in-200 one, and fast lift builds tall cloud.",
          },
        },
        {
          id: "cold",
          phase: "measure",
          title: "Measure the cold front",
          instruction: "Let a cold front pass. Record the peak rain rate and the total.",
          requireData: 4,
          check: {
            describe: "A cold front that has passed your station",
            test: (v) => v.params.frontType === "cold" && Boolean(v.facts.passed),
          },
        },
        {
          id: "warm",
          phase: "measure",
          title: "Now a warm front",
          instruction: "Switch to a warm front, keep everything else the same, and record again.",
          requireData: 8,
          check: {
            describe: "A warm front that has passed your station",
            test: (v) => v.params.frontType === "warm" && Boolean(v.facts.passed),
          },
          hints: ["The rain starts a very long way ahead of a warm front. Watch for it early."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the lift rates",
          instruction: "The lift arrow on the cross-section is labelled. Compare the two numbers.",
          write: {
            prompt: "How many times faster is the lift at a cold front? What does that do to the cloud?",
            placeholder: "The cold front lifts air at ... and the warm front at ..., which is ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Connect slope to lift to cloud height to rainfall, in one chain.",
          write: {
            prompt: "Write the chain from frontal slope all the way to the rain a station gets.",
            placeholder: "A steeper surface means ..., which means ..., which means ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "catch-the-front",
      title: "Catch it in the act",
      brief: "Be at a station at the exact moment the front passes, in heavy rain.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { frontType: "cold", pressureSystem: "low", station: 2, contrast: 14, moisture: 0.9, frontSpeed: 1, speed: 1 },
      goal: {
        describe: "Rain of more than 5 mm/h at your station",
        test: (v) => (v.facts.rainRateMmH as number) > 5,
      },
      stars: {
        two: {
          describe: "More than 12 mm/h",
          test: (v) => (v.facts.rainRateMmH as number) > 12,
        },
        three: {
          describe: "More than 12 mm/h with the front within 20 km of you",
          test: (v) =>
            (v.facts.rainRateMmH as number) > 12 && Math.abs(v.facts.distanceKm as number) < 20,
        },
      },
      hints: [
        "Cold front rain sits in a narrow band right at the front.",
        "Slow the clock down so you do not sail straight past it.",
      ],
    },
    {
      id: "all-five",
      title: "Sweep the network",
      brief: "Run a front right across all five stations and log a big pressure swing.",
      bands: ["6-8", "9-12"],
      setup: { frontType: "cold", pressureSystem: "low", station: 1, contrast: 16, moisture: 0.8, frontSpeed: 1.5, speed: 4 },
      goal: {
        describe: "All five stations passed",
        test: (v) => (v.facts.passedStations as number) >= 5,
      },
      stars: {
        two: {
          describe: "With a pressure swing of at least 8 hPa recorded",
          test: (v) =>
            (v.facts.passedStations as number) >= 5 && (v.facts.pressureDropHPa as number) >= 8,
        },
        three: {
          describe: "And a temperature swing of at least 12 K",
          test: (v) =>
            (v.facts.passedStations as number) >= 5 &&
            (v.facts.pressureDropHPa as number) >= 8 &&
            (v.facts.tempSwingC as number) >= 12,
        },
      },
      hints: [
        "A bigger air mass contrast makes both swings larger.",
        "The trough is deepest right at the front.",
      ],
    },
  ],
};
