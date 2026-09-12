import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, disc, label, roundRect } from "@ui/draw";
import {
  badge, caption, glow, groundPlane, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Weather Station — Grades 4-10.
 *
 * Five real instruments a student reads: a thermometer, an aneroid barometer, a
 * hygrometer, a rain gauge and an anemometer with a wind vane. Every needle is
 * driven by the same physics, so the instruments agree with each other the way
 * a real station's do.
 *
 * The humidity is done properly. Saturation vapour pressure comes from the
 * Magnus-Tetens formula, so 20 °C air holds 23.4 hPa of vapour when saturated,
 * and 20 °C air at 50% relative humidity has a dew point of 9.3 °C — both of
 * which a student can check against a table. Cooling the air holds the vapour
 * pressure fixed while the saturation pressure falls, so relative humidity
 * climbs to 100% and then water condenses out. That is fog, and it is why
 * California's coast fogs in overnight while the desert never does.
 *
 * The Sierra scenarios run a real orographic calculation: lift to the lifting
 * condensation level at 9.8 K/km, over the crest on the moist adiabat at about
 * 5 K/km, then straight back down the far side at 9.8 K/km. The air arrives in
 * Nevada warmer and much drier than it left the Pacific, which is why Blue
 * Canyon gets about 1600 mm of rain a year and Reno gets under 200 mm.
 */

/* ------------------------------------------------------------------ *
 * Humidity science
 * ------------------------------------------------------------------ */

/** Saturation vapour pressure over liquid water, hPa. Magnus-Tetens. */
export function saturationVapourPressure(tempC: number): number {
  return 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
}

/** Dew point from temperature and relative humidity, °C. */
export function dewPoint(tempC: number, rhPercent: number): number {
  const rh = Math.max(0.5, Math.min(100, rhPercent));
  const gamma = Math.log(rh / 100) + (17.67 * tempC) / (tempC + 243.5);
  return (243.5 * gamma) / (17.67 - gamma);
}

/** Relative humidity from temperature and dew point, percent. */
export function relativeHumidity(tempC: number, dewC: number): number {
  return Math.min(100, (saturationVapourPressure(dewC) / saturationVapourPressure(tempC)) * 100);
}

/** Specific gas constant for water vapour, J/(kg·K). */
const R_VAPOUR = 461.5;

/** Absolute humidity: mass of vapour per cubic metre of air, g/m³. */
export function absoluteHumidity(vapourPressureHPa: number, tempC: number): number {
  return ((vapourPressureHPa * 100) / (R_VAPOUR * (tempC + 273.15))) * 1000;
}

/** Mixing ratio, grams of vapour per kilogram of dry air. */
export function mixingRatio(vapourPressureHPa: number, pressureHPa: number): number {
  return (622 * vapourPressureHPa) / Math.max(1, pressureHPa - vapourPressureHPa);
}

/** Air pressure at an elevation, hPa, from the standard atmosphere. */
export function pressureAtElevation(elevationM: number, seaLevelHPa = 1013.25): number {
  return seaLevelHPa * Math.pow(1 - (0.0065 * elevationM) / 288.15, 5.25588);
}

const DRY_LAPSE = 9.8;    // K per km
const MOIST_LAPSE = 5.0;  // K per km, a representative mid-tropospheric value
const DEW_LAPSE = 1.8;    // K per km, how fast dew point falls in rising unsaturated air
/** Espy's rule: the cloud base sits 125 m up for every kelvin of dew point spread. */
const LCL_M_PER_K = 125;

export interface RainShadow {
  /** Height of the cloud base above sea level, m. */
  lclM: number;
  crestTempC: number;
  crestDewC: number;
  leeTempC: number;
  leeDewC: number;
  leeHumidity: number;
  /** Water squeezed out between cloud base and crest, g per kg of air. */
  condensedGPerKg: number;
}

/**
 * The classic orographic calculation. Air is lifted from the windward station
 * to the crest and brought straight back down the lee side.
 */
export function rainShadow(
  baseTempC: number, baseDewC: number, baseAltM: number, crestAltM: number, leeAltM: number,
): RainShadow {
  const spread = Math.max(0, baseTempC - baseDewC);
  const lclM = Math.min(crestAltM, baseAltM + spread * LCL_M_PER_K);
  const dryKm = (lclM - baseAltM) / 1000;
  const lclTemp = baseTempC - DRY_LAPSE * dryKm;
  const moistKm = Math.max(0, (crestAltM - lclM) / 1000);
  const crestTempC = lclTemp - MOIST_LAPSE * moistKm;
  // Above the cloud base the air is saturated, so its dew point tracks its
  // temperature exactly. That is what makes the descent so dry.
  const crestDewC = moistKm > 0 ? crestTempC : lclTemp - DEW_LAPSE * dryKm;
  const downKm = (crestAltM - leeAltM) / 1000;
  const leeTempC = crestTempC + DRY_LAPSE * downKm;
  const leeDewC = crestDewC + DEW_LAPSE * downKm;

  const pLcl = pressureAtElevation(lclM);
  const pCrest = pressureAtElevation(crestAltM);
  const wLcl = mixingRatio(saturationVapourPressure(lclTemp), pLcl);
  const wCrest = mixingRatio(saturationVapourPressure(crestTempC), pCrest);

  return {
    lclM, crestTempC, crestDewC, leeTempC, leeDewC,
    leeHumidity: relativeHumidity(leeTempC, leeDewC),
    condensedGPerKg: Math.max(0, wLcl - wCrest),
  };
}

/* ------------------------------------------------------------------ *
 * California scenarios, with real normals
 * ------------------------------------------------------------------ */

export interface Scenario {
  key: string;
  label: string;
  place: string;
  /** Mean air temperature for the day, °C. */
  meanTempC: number;
  /** Difference between the day's high and low, K. */
  diurnalRangeC: number;
  /** Dew point, °C — the moisture the air actually carries. */
  dewPointC: number;
  elevationM: number;
  /** Sea-level-corrected pressure, hPa. */
  seaLevelPressureHPa: number;
  windSpeedMs: number;
  /** The direction the wind comes FROM, degrees clockwise from north. */
  windFromDeg: number;
  /** Rain rate while it is raining, mm/h. */
  rainRateMmH: number;
  /** Annual precipitation normal, mm. */
  annualRainMm: number;
  terrain: "coast" | "windward" | "lee" | "desert" | "valley";
  note: string;
}

export const SCENARIOS: Record<string, Scenario> = {
  coastal: {
    key: "coastal", label: "Coastal fog", place: "Half Moon Bay, July",
    meanTempC: 14, diurnalRangeC: 5, dewPointC: 12.5,
    elevationM: 20, seaLevelPressureHPa: 1016,
    windSpeedMs: 6, windFromDeg: 290, rainRateMmH: 0, annualRainMm: 660,
    terrain: "coast",
    note: "Cold upwelled water chills the air until it fogs. Fog needs no rain.",
  },
  sierraWest: {
    key: "sierraWest", label: "Sierra: windward", place: "Blue Canyon, 1610 m",
    meanTempC: 8, diurnalRangeC: 8, dewPointC: 6,
    elevationM: 1610, seaLevelPressureHPa: 1010,
    windSpeedMs: 10, windFromDeg: 250, rainRateMmH: 6, annualRainMm: 1600,
    terrain: "windward",
    note: "Air forced up the range cools, saturates, and rains its water out.",
  },
  sierraEast: {
    key: "sierraEast", label: "Sierra: rain shadow", place: "Reno, 1370 m",
    meanTempC: 16, diurnalRangeC: 17, dewPointC: -1,
    elevationM: 1370, seaLevelPressureHPa: 1012,
    windSpeedMs: 8, windFromDeg: 250, rainRateMmH: 0, annualRainMm: 195,
    terrain: "lee",
    note: "The same air, warmed on the way down and with its water left behind.",
  },
  desert: {
    key: "desert", label: "Desert", place: "Death Valley, July",
    meanTempC: 39, diurnalRangeC: 15, dewPointC: 4,
    elevationM: -59, seaLevelPressureHPa: 1006,
    windSpeedMs: 4, windFromDeg: 180, rainRateMmH: 0, annualRainMm: 57,
    terrain: "desert",
    note: "Dew point far below the night low, so it never fogs and never rains.",
  },
  valley: {
    key: "valley", label: "Central Valley", place: "Fresno, August",
    meanTempC: 28, diurnalRangeC: 18, dewPointC: 11,
    elevationM: 100, seaLevelPressureHPa: 1010,
    windSpeedMs: 3, windFromDeg: 320, rainRateMmH: 0, annualRainMm: 290,
    terrain: "valley",
    note: "Hot days, cool nights, and almost no summer rain at all.",
  },
};

/** Height of the Sierra crest used by the rain-shadow calculation, m. */
export const SIERRA_CREST_M = 2700;

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

/** Compass name for a bearing. Wind direction always names where it comes from. */
export function compassName(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(d / 22.5) % 16];
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** Hours since midnight, wrapping. */
  hour: number;
  rainTotalMm: number;
  cupAngle: number;
  minTempC: number;
  maxTempC: number;
  fogHours: number;
  sawSaturation: boolean;
}

type Params = Record<string, number | boolean | string>;

function scenarioOf(params: Params): Scenario {
  return SCENARIOS[params.scenario as string] ?? SCENARIOS.coastal;
}

export interface Station {
  tempC: number;
  dewPointC: number;
  humidity: number;
  vapourPressureHPa: number;
  saturationHPa: number;
  pressureHPa: number;
  windSpeedMs: number;
  windFromDeg: number;
  rainRateMmH: number;
  absoluteHumidityGm3: number;
  condensedGm3: number;
  saturated: boolean;
}

/**
 * Everything the five instruments read, computed together from one state so
 * they can never disagree.
 */
export function readStation(state: State, params: Params): Station {
  const sc = scenarioOf(params);
  const cooling = params.cooling as number;
  const windScale = params.windSpeed as number;

  // A daily temperature wave peaking mid-afternoon, which is when it really does.
  const diurnal = (sc.diurnalRangeC / 2) * Math.cos((2 * Math.PI * (state.hour - 15)) / 24);
  const rawTemp = sc.meanTempC + diurnal - cooling;

  // The vapour the air is carrying does not change as it cools; only the amount
  // it *could* carry does. Once it can no longer carry what it has, water leaves.
  const carried = saturationVapourPressure(sc.dewPointC);
  const capacity = saturationVapourPressure(rawTemp);
  const saturated = carried >= capacity;
  const vapour = Math.min(carried, capacity);
  const dew = saturated ? rawTemp : sc.dewPointC;
  const condensedGm3 = saturated
    ? absoluteHumidity(carried, rawTemp) - absoluteHumidity(capacity, rawTemp)
    : 0;

  const pressure = pressureAtElevation(sc.elevationM, sc.seaLevelPressureHPa);

  return {
    tempC: rawTemp,
    dewPointC: dew,
    humidity: relativeHumidity(rawTemp, dew),
    vapourPressureHPa: vapour,
    saturationHPa: capacity,
    pressureHPa: pressure,
    windSpeedMs: sc.windSpeedMs * windScale,
    windFromDeg: sc.windFromDeg,
    rainRateMmH: sc.rainRateMmH,
    absoluteHumidityGm3: absoluteHumidity(vapour, rawTemp),
    condensedGm3,
    saturated,
  };
}

const model: SimModel<State> = {
  init() {
    return {
      hour: 6, rainTotalMm: 0, cupAngle: 0,
      minTempC: 99, maxTempC: -99, fogHours: 0, sawSaturation: false,
    };
  },

  applyParams(state, params, prev) {
    if (params.scenario !== prev.scenario) {
      return { ...state, rainTotalMm: 0, minTempC: 99, maxTempC: -99, fogHours: 0, sawSaturation: false };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "action" && input.action === "empty") {
        s = { ...s, rainTotalMm: 0 };
      }
    }
    if (dt <= 0) return s;

    // One real second is one simulated hour at speed 1, so a whole day takes
    // 24 seconds and the overnight fog is watchable.
    const hours = dt * (params.speed as number);
    const hour = (s.hour + hours) % 24;
    const st = readStation({ ...s, hour }, params);

    return {
      hour,
      rainTotalMm: s.rainTotalMm + st.rainRateMmH * hours,
      cupAngle: (s.cupAngle + st.windSpeedMs * dt * 1.6) % (Math.PI * 2),
      minTempC: Math.min(s.minTempC, st.tempC),
      maxTempC: Math.max(s.maxTempC, st.tempC),
      fogHours: s.fogHours + (st.saturated ? hours : 0),
      sawSaturation: s.sawSaturation || st.saturated,
    };
  },

  readouts(state, params) {
    const st = readStation(state, params);
    return [
      {
        key: "temperature", label: "Temperature", quantity: q(st.tempC + 273.15, "temperature"), unit: "°C",
        semantic: "hot", graphable: true,
      },
      {
        key: "dewPoint", label: "Dew point", quantity: q(st.dewPointC + 273.15, "temperature"), unit: "°C",
        semantic: "cold", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "humidity", label: "Relative humidity", quantity: q(st.humidity / 100, "percent"), unit: "%",
        semantic: "liquid", graphable: true,
      },
      {
        key: "pressure", label: "Air pressure", quantity: q(st.pressureHPa * 100, "pressure"), unit: "kPa",
        semantic: "force", graphable: true,
      },
      {
        key: "wind", label: "Wind speed", quantity: q(st.windSpeedMs, "velocity"), unit: "m/s",
        semantic: "velocity", graphable: true,
      },
      {
        key: "rain", label: "Rain collected", quantity: q(state.rainTotalMm / 1000, "length"), unit: "mm",
        semantic: "distance", graphable: true,
      },
      {
        key: "spread", label: "Dew point spread",
        quantity: q(st.tempC - st.dewPointC, "temperature"),
        semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "absHumidity", label: "Water in the air (g/m³)",
        quantity: q(st.absoluteHumidityGm3, "ratio"),
        semantic: "gas", graphable: true, bands: ["9-12"],
      },
      {
        key: "hour", label: "Time of day", quantity: q(state.hour * 3600, "time"), unit: "h",
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const sc = scenarioOf(params);
    const st = readStation(state, params);
    const shadow = rainShadow(
      SCENARIOS.sierraWest.meanTempC, SCENARIOS.sierraWest.dewPointC,
      SCENARIOS.sierraWest.elevationM, SIERRA_CREST_M, SCENARIOS.sierraEast.elevationM,
    );
    return {
      scenario: sc.key,
      place: sc.place,
      elevationM: sc.elevationM,
      temperatureC: st.tempC,
      dewPointC: st.dewPointC,
      relativeHumidity: st.humidity,
      vapourPressureHPa: st.vapourPressureHPa,
      saturationVapourHPa: st.saturationHPa,
      spreadC: st.tempC - st.dewPointC,
      pressureHPa: st.pressureHPa,
      windSpeedMs: st.windSpeedMs,
      windFromDeg: st.windFromDeg,
      windFromName: compassName(st.windFromDeg),
      rainRateMmH: st.rainRateMmH,
      rainTotalMm: state.rainTotalMm,
      annualRainMm: sc.annualRainMm,
      absoluteHumidityGm3: st.absoluteHumidityGm3,
      condensedGm3: st.condensedGm3,
      saturated: st.saturated,
      fog: st.saturated && st.condensedGm3 > 0.05,
      sawSaturation: state.sawSaturation,
      fogHours: state.fogHours,
      hour: state.hour,
      dailyRangeC: state.maxTempC > -98 ? state.maxTempC - state.minTempC : 0,
      // The rain shadow, computed once so both Sierra scenarios agree on it.
      lclM: shadow.lclM,
      crestTempC: shadow.crestTempC,
      leeTempC: shadow.leeTempC,
      leeHumidity: shadow.leeHumidity,
      condensedGPerKg: shadow.condensedGPerKg,
      rainShadowRatio: SCENARIOS.sierraWest.annualRainMm / SCENARIOS.sierraEast.annualRainMm,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View — the place
 * ------------------------------------------------------------------ */

function skyMood(hour: number): "day" | "dusk" {
  return hour < 6 || hour > 19 ? "dusk" : "day";
}

function drawPlace(rc: RenderContext<State>, st: Station, h: number) {
  const { ctx, theme, width, time, state, params } = rc;
  const sc = scenarioOf(params);
  const horizon = h * 0.66;

  sky(ctx, width, h, theme, skyMood(state.hour), horizon);

  /* --- sun or moon, at the right place in the sky ------------------- */
  const dayFrac = (state.hour - 6) / 12;
  if (dayFrac > 0 && dayFrac < 1) {
    const sx = width * (0.1 + dayFrac * 0.8);
    const sy = horizon - Math.sin(dayFrac * Math.PI) * h * 0.5;
    glow(ctx, sx, sy, 54, theme.sci["light"], 0.45);
    sphere(ctx, sx, sy, 13, theme.sci["light"], { glow: 0.7 });
  } else {
    const nf = ((state.hour + 6) % 24) / 24;
    sphere(ctx, width * (0.15 + nf * 0.7), h * 0.2, 9, theme.sci["cold"], { glow: 0.3 });
  }

  /* --- terrain ------------------------------------------------------ */
  if (sc.terrain === "coast") {
    groundPlane(ctx, horizon, 0, width * 0.55, h, theme, "water");
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["liquid"], 0.5);
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) {
      const y = horizon + 8 + i * 11;
      ctx.beginPath();
      for (let x = 0; x <= width * 0.55; x += 6) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + time * 1.6 + i) * 2);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["solid"], 0.9);
    ctx.beginPath();
    ctx.moveTo(width * 0.52, h);
    ctx.lineTo(width * 0.55, horizon + 6);
    ctx.lineTo(width * 0.62, horizon - h * 0.1);
    ctx.lineTo(width, horizon - h * 0.12);
    ctx.lineTo(width, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    caption(ctx, width * 0.2, horizon + 22, "Pacific ~12 °C", rc.theme, {
      align: "center", size: 10, color: theme.sci["cold"],
    });
  } else if (sc.terrain === "windward" || sc.terrain === "lee") {
    // One cross-section of the range, seen the same way from both sides, so a
    // student can see that the two scenarios are the same air.
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["solid"], 0.92);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, horizon + 10);
    ctx.lineTo(width * 0.3, horizon - h * 0.14);
    ctx.lineTo(width * 0.52, horizon - h * 0.52);
    ctx.lineTo(width * 0.72, horizon - h * 0.18);
    ctx.lineTo(width, horizon + 14);
    ctx.lineTo(width, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    caption(ctx, width * 0.52, horizon - h * 0.55, `Sierra crest ${SIERRA_CREST_M} m`, rc.theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });

    // The cloud sits on the windward side only. That asymmetry is the lesson.
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = theme.sci["gas"];
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(width * (0.24 + k * 0.07), horizon - h * (0.28 + 0.03 * Math.sin(k)),
        30, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["liquid"], 0.7);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 34; i++) {
      const x = width * (0.16 + ((i * 0.137) % 1) * 0.36);
      const y = horizon - h * 0.26 + ((time * 300 + i * 23) % (h * 0.3));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 8);
      ctx.stroke();
    }
    ctx.restore();
    // Air riding over the top, then coming down warm and dry.
    arrow(ctx, width * 0.1, horizon - h * 0.05, width * 0.46, horizon - h * 0.46,
      theme.sci["velocity"], { width: 2.4 });
    arrow(ctx, width * 0.58, horizon - h * 0.46, width * 0.94, horizon - h * 0.02,
      theme.sci["hot"], { width: 2.4 });
  } else {
    groundPlane(ctx, horizon, 0, width, h, theme, sc.terrain === "desert" ? "soil" : "grass");
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.fillStyle = hexA(theme.sci["solid"], 0.5);
      ctx.beginPath();
      ctx.ellipse(width * (0.1 + i * 0.2), horizon + 6, 60, 12, 0, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }
    if (sc.terrain === "desert" && st.tempC > 30) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = theme.sci["hot"];
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 8) {
          ctx.lineTo(x, horizon - 4 - i * 3 + Math.sin(x * 0.08 + time * 5 + i) * 2.2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* --- fog: the visible consequence of reaching the dew point ------- */
  if (st.condensedGm3 > 0.02) {
    const density = Math.min(0.85, st.condensedGm3 * 0.5);
    ctx.save();
    ctx.globalAlpha = density;
    const g = ctx.createLinearGradient(0, horizon - h * 0.3, 0, h);
    g.addColorStop(0, hexA(theme.sci["gas"], 0));
    g.addColorStop(0.4, hexA(theme.sci["gas"], 0.95));
    g.addColorStop(1, hexA(theme.sci["gas"], 0.8));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon - h * 0.3, width, h - horizon + h * 0.3);
    ctx.restore();
    caption(ctx, width / 2, horizon - h * 0.2, "condensing — fog", rc.theme, {
      align: "center", size: 13, color: theme.sci["liquid"], weight: 800,
    });
  }

  /* --- wind streaks, so wind is visible not just numeric ------------ */
  const dir = Math.sin(((270 - st.windFromDeg) * Math.PI) / 180) >= 0 ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["velocity"], 0.4);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const y = h * 0.1 + i * (h * 0.05);
    const x = ((time * st.windSpeedMs * 22 * dir + i * 91) % (width + 120)) - 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 26 * dir, y);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * View — the instruments
 * ------------------------------------------------------------------ */

function panel(rc: RenderContext<State>, x: number, y: number, w: number, hh: number, title: string) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.95);
  roundRect(ctx, x, y, w, hh, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + w / 2, y + 11, title, theme, { align: "center", size: 10, color: theme.inkSoft });
}

/** A glass thermometer with a real scale, and the dew point marked on it. */
function drawThermometer(rc: RenderContext<State>, st: Station, x: number, y: number, w: number, hh: number) {
  const { ctx, theme } = rc;
  panel(rc, x, y, w, hh, "Thermometer");
  const lo = -10, hi = 50;
  const top = y + 22, bot = y + hh - 22;
  const cx = x + w * 0.38;
  const yOf = (t: number) => bot - ((Math.max(lo, Math.min(hi, t)) - lo) / (hi - lo)) * (bot - top);

  material(ctx, cx - 5, top - 4, 10, bot - top + 8, hexA(theme.surface, 0.9), 5);
  ctx.save();
  ctx.fillStyle = theme.sci["hot"];
  ctx.fillRect(cx - 3, yOf(st.tempC), 6, bot - yOf(st.tempC));
  ctx.restore();
  sphere(ctx, cx, bot + 5, 7, theme.sci["hot"]);

  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let t = lo; t <= hi; t += 10) {
    const ty = yOf(t);
    ctx.beginPath();
    ctx.moveTo(cx + 6, ty);
    ctx.lineTo(cx + 11, ty);
    ctx.stroke();
    ctx.fillText(`${t}`, cx + 13, ty);
  }
  ctx.restore();

  // The dew point drawn on the same scale is what makes fog predictable.
  const dy = yOf(st.dewPointC);
  ctx.save();
  ctx.strokeStyle = theme.sci["cold"];
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - 12, dy);
  ctx.lineTo(cx + 8, dy);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 4, dy, "dew", theme, { size: 9, color: theme.sci["cold"] });
  badge(ctx, x + w / 2, y + hh - 9, `${st.tempC.toFixed(1)} °C`, rc.theme, {
    align: "center", color: theme.sci["hot"],
  });
}

/** An aneroid barometer, with the words that are printed on a real dial. */
function drawBarometer(rc: RenderContext<State>, st: Station, x: number, y: number, w: number, hh: number) {
  const { ctx, theme } = rc;
  panel(rc, x, y, w, hh, "Barometer");
  const cx = x + w / 2, cy = y + hh * 0.5;
  const r = Math.min(w, hh) * 0.32;
  const lo = 950, hi = 1050;
  const angOf = (p: number) =>
    Math.PI * 0.75 + ((Math.max(lo, Math.min(hi, p)) - lo) / (hi - lo)) * Math.PI * 1.5;

  disc(ctx, cx, cy, r, hexA(theme.surface, 0.95), { stroke: theme.line, lineWidth: 2 });
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let p = lo; p <= hi; p += 25) {
    const a = angOf(p);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    ctx.lineTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7));
    ctx.stroke();
    ctx.fillText(`${p}`, cx + Math.cos(a) * (r - 15), cy + Math.sin(a) * (r - 15));
  }
  ctx.restore();

  const a = angOf(st.pressureHPa);
  ctx.save();
  ctx.strokeStyle = theme.sci["force"];
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
  ctx.stroke();
  ctx.restore();
  sphere(ctx, cx, cy, 3.5, theme.sci["force"]);
  badge(ctx, cx, y + hh - 9, `${st.pressureHPa.toFixed(0)} hPa`, rc.theme, {
    align: "center", color: theme.sci["force"],
  });
}

/** A hygrometer dial, which saturates visibly at 100%. */
function drawHygrometer(rc: RenderContext<State>, st: Station, x: number, y: number, w: number, hh: number) {
  const { ctx, theme } = rc;
  panel(rc, x, y, w, hh, "Hygrometer");
  const cx = x + w / 2, cy = y + hh * 0.55;
  const r = Math.min(w, hh) * 0.3;
  const a0 = Math.PI, a1 = Math.PI * 2;

  ctx.save();
  ctx.lineWidth = 8;
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  ctx.strokeStyle = st.saturated ? theme.sci["liquid"] : theme.sci["gas"];
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a0 + (Math.min(100, st.humidity) / 100) * (a1 - a0));
  ctx.stroke();
  ctx.restore();

  caption(ctx, cx, cy - 6, `${st.humidity.toFixed(0)}%`, theme, {
    align: "center", size: 15, weight: 800,
    color: st.saturated ? theme.sci["liquid"] : theme.ink,
  });
  caption(ctx, cx, y + hh - 10, `dew point ${st.dewPointC.toFixed(1)} °C`, theme, {
    align: "center", size: 9, color: theme.sci["cold"],
  });
}

/** A rain gauge that fills up, with a real millimetre scale. */
function drawRainGauge(rc: RenderContext<State>, rain: number, x: number, y: number, w: number, hh: number) {
  const { ctx, theme } = rc;
  panel(rc, x, y, w, hh, "Rain gauge");
  const cw = Math.min(w * 0.45, 30);
  const cx = x + w / 2;
  const top = y + 22, bot = y + hh - 22;
  const maxMm = 40;
  const level = bot - (Math.min(maxMm, rain) / maxMm) * (bot - top);

  material(ctx, cx - cw / 2, top, cw, bot - top, hexA(theme.surface, 0.85), 3);
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.85);
  ctx.fillRect(cx - cw / 2 + 1.5, level, cw - 3, bot - level);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let m = 0; m <= maxMm; m += 10) {
    const my = bot - (m / maxMm) * (bot - top);
    ctx.beginPath();
    ctx.moveTo(cx + cw / 2, my);
    ctx.lineTo(cx + cw / 2 + 4, my);
    ctx.stroke();
    ctx.fillText(`${m}`, cx + cw / 2 + 6, my);
  }
  ctx.restore();
  badge(ctx, cx, y + hh - 9, `${rain.toFixed(1)} mm`, rc.theme, {
    align: "center", color: theme.sci["liquid"],
  });
}

/** Cup anemometer plus wind vane. The vane points into the wind, as real ones do. */
function drawAnemometer(rc: RenderContext<State>, st: Station, angle: number, x: number, y: number, w: number, hh: number) {
  const { ctx, theme } = rc;
  panel(rc, x, y, w, hh, "Anemometer & vane");
  const cx = x + w * 0.34, cy = y + hh * 0.46;
  const r = Math.min(w * 0.22, hh * 0.24);

  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * Math.PI * 2) / 3;
    sphere(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4.5, theme.sci["velocity"]);
  }
  sphere(ctx, cx, cy, 3, theme.inkSoft);

  // The vane, on its own compass rose.
  const vx = x + w * 0.74, vy = cy;
  const vr = r * 1.05;
  disc(ctx, vx, vy, vr + 5, hexA(theme.surface, 0.6), { stroke: theme.line, lineWidth: 1 });
  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", vx, vy - vr - 1);
  ctx.fillText("S", vx, vy + vr + 1);
  ctx.fillText("W", vx - vr - 2, vy);
  ctx.fillText("E", vx + vr + 2, vy);
  ctx.restore();
  const a = ((st.windFromDeg - 90) * Math.PI) / 180;
  arrow(ctx, vx - Math.cos(a) * vr * 0.8, vy - Math.sin(a) * vr * 0.8,
    vx + Math.cos(a) * vr * 0.8, vy + Math.sin(a) * vr * 0.8,
    theme.sci["velocity"], { width: 2 });

  badge(ctx, x + w / 2, y + hh - 9,
    `${st.windSpeedMs.toFixed(1)} m/s ${compassName(st.windFromDeg)}`, rc.theme,
    { align: "center", color: theme.sci["velocity"] });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const st = readStation(state, params);
  const sc = scenarioOf(params);

  const stripH = band === "3-5" ? Math.round(height * 0.34) : Math.round(height * 0.4);
  const sceneH = height - stripH;

  drawPlace(rc, st, sceneH);

  /* --- the headline the student reads first ------------------------ */
  caption(ctx, 10, 16, `${sc.label} — ${sc.place}`, theme, { size: 13, weight: 700 });
  caption(ctx, 10, 32, sc.note, theme, { size: 10, color: theme.inkSoft });
  const clock = `${String(Math.floor(state.hour)).padStart(2, "0")}:${String(Math.floor((state.hour % 1) * 60)).padStart(2, "0")}`;
  badge(ctx, width - 12, 20, clock, rc.theme, { align: "right", color: theme.accent, sub: "local time" });

  if (overlays.dewPointLine !== false && band !== "3-5") {
    badge(ctx, width - 12, 58,
      `${(st.tempC - st.dewPointC).toFixed(1)} K to the dew point`, rc.theme,
      { align: "right", color: st.saturated ? theme.sci["liquid"] : theme.sci["cold"] });
  }

  /* --- rain-shadow arithmetic, on the stage where it belongs -------- */
  if ((sc.terrain === "windward" || sc.terrain === "lee") && band === "9-12") {
    const shadow = rainShadow(
      SCENARIOS.sierraWest.meanTempC, SCENARIOS.sierraWest.dewPointC,
      SCENARIOS.sierraWest.elevationM, SIERRA_CREST_M, SCENARIOS.sierraEast.elevationM,
    );
    caption(ctx, 10, sceneH - 26,
      `cloud base ${(shadow.lclM / 1000).toFixed(2)} km · crest ${shadow.crestTempC.toFixed(1)} °C · lee ${shadow.leeTempC.toFixed(1)} °C at ${shadow.leeHumidity.toFixed(0)}% RH`,
      theme, { size: 10, color: theme.inkSoft });
    caption(ctx, 10, sceneH - 12,
      `${SCENARIOS.sierraWest.annualRainMm} mm a year on this side, ${SCENARIOS.sierraEast.annualRainMm} mm on the other`,
      theme, { size: 10, color: theme.sci["liquid"] });
  }

  vignette(ctx, width, sceneH, 0.14);

  /* --- the instrument bench ----------------------------------------- */
  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, sceneH, width, stripH);
  ctx.strokeStyle = theme.line;
  ctx.beginPath();
  ctx.moveTo(0, sceneH);
  ctx.lineTo(width, sceneH);
  ctx.stroke();
  ctx.restore();

  const count = band === "3-5" ? 3 : 5;
  const gap = 6;
  const iw = (width - gap * (count + 1)) / count;
  const iy = sceneH + gap;
  const ih = stripH - gap * 2;
  const slot = (i: number) => gap + i * (iw + gap);

  drawThermometer(rc, st, slot(0), iy, iw, ih);
  drawHygrometer(rc, st, slot(1), iy, iw, ih);
  drawAnemometer(rc, st, state.cupAngle, slot(2), iy, iw, ih);
  if (count === 5) {
    drawBarometer(rc, st, slot(3), iy, iw, ih);
    drawRainGauge(rc, state.rainTotalMm, slot(4), iy, iw, ih);
  }

  if (st.saturated && band !== "3-5") {
    label(ctx, "Air is saturated — water is condensing out", width / 2, sceneH - 12, rc.theme, {
      align: "center", size: 11, color: theme.sci["liquid"],
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const weatherSim: SimManifest<State> = {
  id: "earth.weather",
  title: "The Weather Station",
  tagline: "Read five real instruments, then cool the air until fog forms in front of you.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6", "3-ESS2-1"] },
  learningGoals: [
    "Read a thermometer, barometer, hygrometer, rain gauge and anemometer and say what each measures.",
    "Explain dew point and predict when air will reach saturation and fog.",
    "Combine all five readings into one description of the weather.",
    "Explain California's coastal fog, Sierra rain shadow and desert dryness using the same variables.",
  ],
  misconceptions: [
    "Humidity is the amount of water in the air, so warm and cold air at 80% hold the same water",
    "Fog is the same thing as a low rain cloud",
    "Wind direction names where the wind is going",
    "Low pressure means low temperature",
    "Deserts are dry because it never gets cold enough there",
  ],
  interactionHint: "Press play to run a day, then drag Cool the air and watch the hygrometer.",
  tickRate: 60,
  params: {
    scenario: {
      type: "option", label: "Where you are",
      options: [
        { value: "coastal", label: "Coastal fog — Half Moon Bay" },
        { value: "sierraWest", label: "Sierra windward — Blue Canyon" },
        { value: "sierraEast", label: "Rain shadow — Reno" },
        { value: "desert", label: "Desert — Death Valley" },
        { value: "valley", label: "Central Valley — Fresno" },
      ],
      default: "coastal",
      help: "Five real California places, with their real normals.",
    },
    cooling: {
      type: "number", label: "Cool the air", kind: "temperature", unit: "K",
      min: 0, max: 25, step: 0.5, default: 0,
      help: "Take heat out without changing the water in the air, and watch the humidity climb.",
    },
    windSpeed: {
      type: "number", label: "Wind strength", kind: "ratio",
      min: 0, max: 3, step: 0.1, default: 1,
      bands: ["6-8", "9-12"],
      help: "A multiplier on the wind this place usually gets.",
    },
    speed: {
      type: "number", label: "Hours per second", kind: "ratio",
      min: 0.25, max: 6, step: 0.25, default: 1,
    },
  },
  overlays: [
    { key: "dewPointLine", label: "Distance to the dew point", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "make-fog",
      title: "Make fog form",
      question: "How much do you have to cool the air before water comes out of it?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-5"],
      setup: { scenario: "coastal", cooling: 0, windSpeed: 1, speed: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Read the thermometer and the dew point, then answer.",
          predict: {
            prompt: "What has to happen to the air before fog forms?",
            options: [
              "More water has to be added to it",
              "It has to cool down to its dew point",
              "The pressure has to drop",
            ],
            correct: 1,
            reveal:
              "Cooling alone is enough. The air already holds the water — cooling just takes away its ability to hold it.",
          },
        },
        {
          id: "read",
          phase: "measure",
          title: "Read the station",
          instruction: "Record temperature, dew point and humidity before you change anything.",
          requireData: 1,
        },
        {
          id: "cool",
          phase: "measure",
          title: "Cool it down",
          instruction: "Raise Cool the air in half-degree steps. Record humidity at each step.",
          requireData: 5,
          check: {
            describe: "The air has reached saturation",
            test: (v) => Boolean(v.facts.saturated),
          },
          hints: [
            "The gap between temperature and dew point is how far you have to go.",
            "Watch the hygrometer needle, not the thermometer.",
          ],
        },
        {
          id: "desert",
          phase: "measure",
          title: "Try it in the desert",
          instruction: "Switch to Death Valley and try to make fog the same way.",
          check: {
            describe: "Cooling the desert air by 20 K or more",
            test: (v) => v.params.scenario === "desert" && (v.params.cooling as number) >= 20,
          },
          requireData: 7,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "Say why the coast fogs almost every night and the desert almost never does.",
          write: {
            prompt: "Why is it so much harder to make fog in Death Valley?",
            placeholder: "The desert air's dew point is ... so the air would have to cool ...",
          },
        },
      ],
    },
    {
      id: "rain-shadow",
      title: "Why Reno is dry",
      question: "Two places 100 km apart. One gets 1600 mm of rain a year, one gets 195. Why?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-5", "MS-ESS2-6"],
      setup: { scenario: "sierraWest", cooling: 0, windSpeed: 1, speed: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Same ocean, same wind, one mountain range between them.",
          predict: {
            prompt: "Why does Reno get so little rain?",
            options: [
              "It is further from the ocean",
              "The mountains made the air drop its water before it got there",
              "It is too hot there for rain",
            ],
            correct: 1,
            reveal:
              "The range forces the air up, it cools, and it rains its water out on the western slope. What comes down the other side is the same air with the water removed.",
          },
        },
        {
          id: "windward",
          phase: "measure",
          title: "Read the windward station",
          instruction: "Record temperature, dew point, humidity and rain at Blue Canyon.",
          requireData: 2,
        },
        {
          id: "lee",
          phase: "measure",
          title: "Now the other side",
          instruction: "Switch to Reno. Record the same four readings.",
          check: {
            describe: "Reading the rain-shadow station",
            test: (v) => v.params.scenario === "sierraEast",
          },
          requireData: 4,
          hints: ["Compare the dew points, not just the temperatures."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Which reading changed most?",
          instruction: "Look at your table. Temperature went up. What happened to the dew point?",
          write: {
            prompt: "Which reading shows most clearly that the water was removed?",
            placeholder: "The dew point fell from ... to ..., which means ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the mechanism",
          instruction: "Describe the air's whole journey over the range.",
          write: {
            prompt: "Trace the air from the Pacific to Reno, saying what happens at each stage.",
            placeholder: "Moist air is pushed up the western slope, so it ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "fog-bank",
      title: "Build a fog bank",
      brief: "Get the relative humidity to 100% with water actually condensing.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { scenario: "coastal", cooling: 0, windSpeed: 1, speed: 1 },
      goal: {
        describe: "Saturated air with condensation",
        test: (v) => Boolean(v.facts.fog),
      },
      stars: {
        two: {
          describe: "Do it with less than 3 K of cooling",
          test: (v) => Boolean(v.facts.fog) && (v.params.cooling as number) < 3,
        },
        three: {
          describe: "Do it with no cooling at all — let the night do it",
          test: (v) => Boolean(v.facts.fog) && (v.params.cooling as number) === 0,
        },
      },
      hints: [
        "The night-time low does some of the work for you.",
        "Run the clock forward to the early hours and watch the thermometer fall.",
      ],
    },
    {
      id: "read-the-station",
      title: "Name the place",
      brief: "Find the station with over 30 °C, humidity under 15%, and no rain in the gauge.",
      bands: ["6-8", "9-12"],
      setup: { scenario: "coastal", cooling: 0, windSpeed: 1, speed: 2 },
      goal: {
        describe: "Hot, very dry, and no rain",
        test: (v) =>
          (v.facts.temperatureC as number) > 30 &&
          (v.facts.relativeHumidity as number) < 15 &&
          (v.facts.rainRateMmH as number) === 0,
      },
      hints: [
        "Only one of the five places gets that hot.",
        "Check the dew point: it has to be far below the air temperature.",
      ],
    },
  ],
};
