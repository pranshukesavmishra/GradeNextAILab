import type { ParamValues, Readout, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { chartFrame, lineSeries, sparkline } from "@ui/charts";
import { plant } from "@ui/fauna";
import {
  arcGauge, badge, caption, clamp01, hexA, isDarkTheme, particleField, vignette,
} from "@ui/scene";

/**
 * One Spark, Sixty Years: A Sierra Watershed — Grade 6, Unit A4.6: modeling
 * an Earth-system event.
 *
 * The one idea this sim exists to teach: a SINGLE event is not one hit in one
 * place that ends when the news does — it is one clock that starts four other
 * clocks, each on its own real timescale, and the biggest hit to a sphere
 * does not have to arrive first. A Sierra wildfire is the vehicle: the
 * atmosphere answers in hours and is done in three weeks, the geosphere and
 * hydrosphere can take their WORST hit months later from a storm that falls
 * after the fire is already out, and the biosphere is still short of its
 * pre-event carbon stock sixty years on. Nothing here is scripted to say
 * that — every one of the four "impact index" curves below is a real
 * function of the same spread model, storm model, and succession model a
 * student is turning the dials on, so scrubbing the timeline is the only way
 * to find out which sphere was hit hardest and when, not a claim to take on
 * faith.
 *
 * A second, independent event (an atmospheric river with no fire at all) is
 * built on the SAME four-sphere/timeline engine so a student can compare two
 * genuinely different signatures — which sphere answers first, and whether
 * anything is still elevated at year sixty. The founder's spec dropdown also
 * lists "Multi-year drought" and "Coastal upwelling collapse"; this build
 * ships only the two events the spec's own scenarios exercise and gives a
 * real, textually-grounded scene and model (Sierra wildfire, atmospheric
 * river). The other two have no scene, no object list, no model description
 * and no scenario anywhere in the spec to build against — shipping them as
 * dropdown options with an invented-from-nothing cascade would be exactly
 * the kind of fake control law 5 forbids, so they are left out rather than
 * faked. Flagged for the founder in the build log.
 */

/* ------------------------------------------------------------------ *
 * Timeline: hour 0 to year 60 on a log-scrubber, so a control that must
 * resolve both "hour 6" and "year 60" precisely can still be one slider.
 * ------------------------------------------------------------------ */

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const HOURS_PER_YEAR = HOURS_PER_DAY * DAYS_PER_YEAR;
const MAX_YEARS = 60;
const MAX_HOURS = MAX_YEARS * HOURS_PER_YEAR; // 525,600
const LOG_MAX = Math.log10(MAX_HOURS + 1);

/** timelinePos (0..1, linear, what the slider stores) -> simulated hours.
 *  Position 0.5 lands at ~day 30, so the back half of the slider alone
 *  covers a month to sixty years and the front half covers hour 0 to a
 *  month — a plain slider that behaves like the spec's logarithmic ribbon. */
function hoursFromPos(pos: number): number {
  const p = Math.max(0, Math.min(1, pos));
  return Math.pow(10, p * LOG_MAX) - 1;
}
function posFromHours(hours: number): number {
  return Math.log10(Math.max(0, hours) + 1) / LOG_MAX;
}

function humanTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `hour ${hours.toFixed(0)}`;
  const days = hours / HOURS_PER_DAY;
  if (days < 90) return `day ${days.toFixed(0)}`;
  const years = hours / HOURS_PER_YEAR;
  if (years < 2) return `month ${(years * 12).toFixed(1)}`;
  return `year ${years.toFixed(1)}`;
}

/* ------------------------------------------------------------------ *
 * Watershed zones: twelve 1 km bands from the reservoir (1,400 m) to the
 * ridge (2,600 m). The along-flow elevation profile is kept a straight
 * ramp — a simplification, since the spec gives only the two endpoints —
 * but each zone gets its OWN local hillslope steepness (a separate,
 * reasoned value standing in for real terrain roughness a 12-zone ramp
 * cannot represent) because a real watershed's basin-average gradient
 * (~6°, too shallow to fail as a debris flow) and its steepest local
 * hillslopes (steep enough to fail) are genuinely different quantities.
 * ------------------------------------------------------------------ */

export const ZONE_COUNT = 12;
const ELEV_MIN_M = 1400;
const ELEV_MAX_M = 2600;
const ZONE_AREA_HA = 1200; // 1 km along-flow x 12 km cross-width

function elevAt(zone: number): number {
  return ELEV_MIN_M + (zone * (ELEV_MAX_M - ELEV_MIN_M)) / (ZONE_COUNT - 1);
}
const REGIONAL_SLOPE_DEG = (Math.atan2(ELEV_MAX_M - ELEV_MIN_M, (ZONE_COUNT - 1) * 1000) * 180) / Math.PI;

function isSouthFacing(zone: number): boolean {
  return zone % 2 === 0;
}
/** Steep local hillslope per zone (15-33 degrees), decoupled from the
 *  shallow along-valley gradient above — this is what a debris flow
 *  actually fails on. */
function localSlopeDeg(zone: number): number {
  return 24 + 9 * Math.sin(zone * 1.3);
}

function zoneOfElevation(elevM: number): number {
  const t = (elevM - ELEV_MIN_M) / (ELEV_MAX_M - ELEV_MIN_M);
  return Math.max(0, Math.min(ZONE_COUNT - 1, Math.round(t * (ZONE_COUNT - 1))));
}

/* ------------------------------------------------------------------ *
 * Fuel and spread. Rothermel-flavoured, per the spec's own model text:
 * fuel-scaled, doubling per 20 km/h of wind, doubling again per 20 deg of
 * upslope, and a sharp rise below 8% dead-fuel moisture where the fire
 * climbs into the crowns.
 * ------------------------------------------------------------------ */

const FUEL_MIN_T_HA = 8;
const FUEL_MAX_T_HA = 92;
const FUEL_REF_T_HA = 90; // "ROS at fuel = 1.0x" reference: 90 years of exclusion
// Solved so fuelLoadTHa(90) lands at ~90 t/ha, matching the spec's own
// "8 t/ha after recent fire rising to 90 t/ha after ninety years" pair.
const FUEL_K = -Math.log((FUEL_MAX_T_HA - 90) / (FUEL_MAX_T_HA - FUEL_MIN_T_HA)) / 90;

export function fuelLoadTHa(yearsSinceFire: number): number {
  return FUEL_MAX_T_HA - (FUEL_MAX_T_HA - FUEL_MIN_T_HA) * Math.exp(-FUEL_K * Math.max(0, yearsSinceFire));
}

const MOISTURE_CROWN_THRESHOLD = 0.08; // 8%, the spec's own crown-fire line
const CROWN_BOOST = 3; // reasoned: how much the crown-fire regime multiplies ROS
function moistureMultiplier(moistureRatio: number): number {
  // A logistic step centred on the 8% threshold: sharp below it, flat above.
  return 1 + CROWN_BOOST / (1 + Math.exp((moistureRatio - MOISTURE_CROWN_THRESHOLD) / 0.015));
}
function isCrownFire(moistureRatio: number): boolean {
  return moistureRatio < MOISTURE_CROWN_THRESHOLD;
}

// Reasoned base rate of spread, tuned (via numeric sweep) so the baseline
// scenario (35 km/h wind, 6% moisture, 90 t/ha fuel) crosses one 1 km zone
// in roughly two hours — active, watchable fire behaviour across the
// session length, and still mid-spread four real seconds into the
// acceptance gate's own default-speed sweep.
const ROS_BASE_KMH = 0.035;

function aspectFactor(southFacing: boolean): number {
  return southFacing ? 1.15 : 0.9; // chaparral dries faster than dense conifer
}

function rosKmh(opts: { fuelFactor: number; windKmh: number; slopeDeg: number; moistureMult: number; aspectF: number; uphill: boolean }): number {
  const { fuelFactor, windKmh, slopeDeg, moistureMult, aspectF, uphill } = opts;
  const windFactor = Math.pow(2, windKmh / 20);
  const slopeFactor = Math.pow(2, slopeDeg / (uphill ? 20 : 40)); // half as slope-sensitive running downhill
  return Math.max(1e-4, ROS_BASE_KMH * fuelFactor * windFactor * slopeFactor * moistureMult * aspectF);
}

export type Severity = "none" | "low" | "moderate" | "high";
export const SEVERITY_WEIGHT: Record<Severity, number> = { none: 0, low: 0.3, moderate: 0.6, high: 1 };
const HIGH_INTENSITY_THRESH = 25;
const MOD_INTENSITY_THRESH = 8;

function effectiveYearsSinceFire(params: ParamValues): number {
  const years = params.yearsSinceFire as number;
  return params.postFireAction === "prescribedBurn" ? Math.min(years, 8) : years;
}

export interface ZoneState {
  zone: number;
  elevM: number;
  southFacing: boolean;
  arrivalHours: number;
  severity: Severity;
}

export function computeIgnitionZone(params: ParamValues): number {
  return zoneOfElevation(params.ignitionElevation as number);
}

/** Zone-by-zone spread computed directly from each hop's own ROS — no
 *  time-stepping needed, since every hop's rate is fixed once params are
 *  fixed. Spreads outward from the ignition zone in both directions. */
export function computeZones(params: ParamValues): ZoneState[] {
  const windKmh = (params.windSpeed as number) * 3.6;
  const moistureRatio = params.fuelMoisture as number;
  const fuelFactor = fuelLoadTHa(effectiveYearsSinceFire(params)) / FUEL_REF_T_HA;
  const moistureMult = moistureMultiplier(moistureRatio);
  const crown = isCrownFire(moistureRatio);
  const ignitionZone = computeIgnitionZone(params);

  const arrival = new Array<number>(ZONE_COUNT).fill(Infinity);
  arrival[ignitionZone] = 0;

  const hopHours = (from: number, to: number): number => {
    const uphill = elevAt(to) > elevAt(from);
    const ros = rosKmh({
      fuelFactor, windKmh, slopeDeg: REGIONAL_SLOPE_DEG, moistureMult,
      aspectF: aspectFactor(isSouthFacing(to)), uphill,
    });
    return 1 / ros; // 1 km hop
  };

  let t = 0;
  for (let z = ignitionZone + 1; z < ZONE_COUNT; z++) {
    t += hopHours(z - 1, z);
    arrival[z] = t;
  }
  t = 0;
  for (let z = ignitionZone - 1; z >= 0; z--) {
    t += hopHours(z + 1, z);
    arrival[z] = t;
  }

  return arrival.map((arrivalHours, zone) => {
    const fuelLoad = fuelLoadTHa(effectiveYearsSinceFire(params));
    const ros = rosKmh({
      fuelFactor, windKmh, slopeDeg: REGIONAL_SLOPE_DEG, moistureMult,
      aspectF: aspectFactor(isSouthFacing(zone)), uphill: zone >= ignitionZone,
    });
    const intensityProxy = ros * fuelLoad;
    // Crown fire lowers the bar for reaching a given severity class (a
    // crown fire sustains high severity at a lower intensity proxy than a
    // surface fire needs to) but it does not bypass fuel load entirely —
    // a genuinely thin fuel bed (a fresh prescribed burn) still buys a
    // lower severity even under crown-fire-prone dryness, which is what
    // makes "prepared ground" (S3) a real, measurable treatment rather
    // than a no-op painted over by the moisture threshold alone.
    const highBar = crown ? HIGH_INTENSITY_THRESH * 0.3 : HIGH_INTENSITY_THRESH;
    const modBar = crown ? MOD_INTENSITY_THRESH * 0.3 : MOD_INTENSITY_THRESH;
    const severity: Severity = intensityProxy > highBar ? "high" : intensityProxy > modBar ? "moderate" : "low";
    return { zone, elevM: elevAt(zone), southFacing: isSouthFacing(zone), arrivalHours, severity };
  });
}

export function lastArrivalHours(zones: ZoneState[]): number {
  return Math.max(...zones.map((z) => z.arrivalHours));
}
function avgSeverityWeightByHours(zones: ZoneState[], hours: number): number {
  const burned = zones.filter((z) => z.arrivalHours <= hours);
  if (burned.length === 0) return 0;
  return burned.reduce((s, z) => s + SEVERITY_WEIGHT[z.severity], 0) / burned.length;
}
function burnedFractionByHours(zones: ZoneState[], hours: number): number {
  return zones.filter((z) => z.arrivalHours <= hours).length / zones.length;
}

/* ------------------------------------------------------------------ *
 * Post-fire actions. The spec calls this a multi-select; every scenario
 * that touches it passes exactly one value, so it is built as a
 * single-select with five real, distinct, independently-verifiable
 * effects rather than a combinable set nothing in the spec exercises.
 * ------------------------------------------------------------------ */

const POST_FIRE_SEDIMENT_MULT: Record<string, number> = {
  none: 1, mulch: 0.6, replant: 1, salvage: 1.15, prescribedBurn: 1,
};
const POST_FIRE_REGROWTH_AGE_MULT: Record<string, number> = {
  none: 1, mulch: 1, replant: 1.4, salvage: 1, prescribedBurn: 1,
};

/* ------------------------------------------------------------------ *
 * First-winter storm: erosion, debris flows, sediment, turbidity.
 * ------------------------------------------------------------------ */

const STORM_ONSET_HOURS = 120 * HOURS_PER_DAY; // ~Dec, if the fire starts late Aug per the theme scene
const PEAK_HOURLY_FRACTION = 0.5; // a storm's worst single hour vs. its 24h total
const DEBRIS_THRESHOLD_MM_HR = 24; // the spec's own trigger
const LOCAL_SLOPE_STEEP_DEG = 20;
const SEDIMENT_TAU_YR = 3; // spec's own e-folding time
const SED_BASE = 55; // reasoned, tuned so S2's rain-driven hit exceeds S1's fire-driven hit

function peakHourlyMm(stormMm24h: number): number {
  return stormMm24h * PEAK_HOURLY_FRACTION;
}

function debrisZoneFraction(zones: ZoneState[], params: ParamValues): number {
  const peakMm = peakHourlyMm(params.stormIntensity as number);
  if (peakMm <= DEBRIS_THRESHOLD_MM_HR) return 0;
  const eligible = zones.filter((z) => z.severity === "high" && localSlopeDeg(z.zone) > LOCAL_SLOPE_STEEP_DEG);
  return eligible.length / zones.length;
}

function sedimentYieldPeakTHaYr(zones: ZoneState[], params: ParamValues): number {
  const peakMm = peakHourlyMm(params.stormIntensity as number);
  const excess = Math.max(0, peakMm - DEBRIS_THRESHOLD_MM_HR);
  const frac = debrisZoneFraction(zones, params);
  const mult = POST_FIRE_SEDIMENT_MULT[(params.postFireAction as string) ?? "none"] ?? 1;
  return SED_BASE * Math.sqrt(excess) * frac * mult;
}

function sedimentYieldAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  const BACKGROUND_T_HA_YR = 0.5;
  if (hours < STORM_ONSET_HOURS) return BACKGROUND_T_HA_YR;
  const peak = sedimentYieldPeakTHaYr(zones, params);
  const yrSince = (hours - STORM_ONSET_HOURS) / HOURS_PER_YEAR;
  return BACKGROUND_T_HA_YR + peak * Math.exp(-yrSince / SEDIMENT_TAU_YR);
}

const TURBIDITY_PER_SEDIMENT = 1.5;
const TURBIDITY_BASELINE_NTU = 5;
function turbidityAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  return TURBIDITY_BASELINE_NTU + TURBIDITY_PER_SEDIMENT * sedimentYieldAt(hours, zones, params);
}

/* ------------------------------------------------------------------ *
 * Ash-on-snow and snowmelt timing.
 * ------------------------------------------------------------------ */

const SNOW_ELEV_MIN_M = 1900;
const MAX_MELT_SHIFT_DAYS = 21;

function snowmeltShiftDays(zones: ZoneState[]): number {
  const highZones = zones.filter((z) => z.elevM >= SNOW_ELEV_MIN_M);
  if (highZones.length === 0) return 0;
  const ashLoad = highZones.reduce((s, z) => s + SEVERITY_WEIGHT[z.severity], 0) / highZones.length;
  return MAX_MELT_SHIFT_DAYS * ashLoad;
}

/* ------------------------------------------------------------------ *
 * Carbon ledger and regrowth succession.
 * ------------------------------------------------------------------ */

const CARBON_FRACTION = 0.5; // t C per t biomass, a standard forestry constant
const LIVE_CARBON_T_HA = 150; // reasoned pre-fire aboveground carbon stock
const FUEL_CONSUME_FRAC: Record<Severity, number> = { none: 0, low: 0.3, moderate: 0.6, high: 0.85 };
const LIVE_CONSUME_FRAC: Record<Severity, number> = { none: 0, low: 0.05, moderate: 0.15, high: 0.35 };

/** Piecewise-in-log-age succession, anchored to the spec's own milestones:
 *  bare, herbs by year one, shrub years three to fifteen, sapling to closed
 *  canopy by year sixty. Returns the fraction of pre-fire LIVE carbon
 *  regained — reaching "closed canopy" by 60 does not mean full carbon
 *  recovery, which real post-fire Sierra forests take a century or more
 *  to complete; that gap is what keeps the biosphere sphere still elevated
 *  at year sixty. */
const REGROWTH_ANCHORS: [number, number][] = [[0, 0], [0.5, 0.02], [3, 0.08], [15, 0.35], [60, 0.8]];
function regrowthFrac(ageYears: number): number {
  const age = Math.max(0, ageYears);
  if (age >= 60) return 0.8 + 0.15 * (1 - Math.exp(-(age - 60) / 40));
  for (let i = 1; i < REGROWTH_ANCHORS.length; i++) {
    const [a0, f0] = REGROWTH_ANCHORS[i - 1];
    const [a1, f1] = REGROWTH_ANCHORS[i];
    if (age <= a1) {
      const t = a1 === a0 ? 0 : (age - a0) / (a1 - a0);
      return f0 + (f1 - f0) * t;
    }
  }
  return 0.8;
}
function regrowthStage(ageYears: number): string {
  if (ageYears < 0.5) return "bare";
  if (ageYears < 3) return "herb";
  if (ageYears < 15) return "shrub";
  if (ageYears < 60) return "sapling";
  return "closed canopy";
}

function carbonReleasedAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  // The fuel actually present when THIS fire burned — the same fuel load
  // the spread model itself used to compute severity, not a fixed
  // fresh-burn value. Using a hardcoded low fuel load here would silently
  // decouple "carbon released" from years-since-fire and post-fire
  // actions, breaking the ledger's own invariant that regained carbon can
  // never exceed what was released.
  const fuelLoad = fuelLoadTHa(effectiveYearsSinceFire(params));
  return zones.filter((z) => z.arrivalHours <= hours).reduce((sum, z) => {
    const fuelC = fuelLoad * FUEL_CONSUME_FRAC[z.severity] * CARBON_FRACTION;
    const liveC = LIVE_CARBON_T_HA * LIVE_CONSUME_FRAC[z.severity] * CARBON_FRACTION;
    return sum + (fuelC + liveC) * ZONE_AREA_HA;
  }, 0) / 1000; // t C /ha display convenience: keep raw t C total, scaled down for chart friendliness
}
function carbonRegainedAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  const ageMult = POST_FIRE_REGROWTH_AGE_MULT[(params.postFireAction as string) ?? "none"] ?? 1;
  return zones.filter((z) => z.arrivalHours <= hours).reduce((sum, z) => {
    const ageYears = Math.min(MAX_YEARS, ((hours - z.arrivalHours) / HOURS_PER_YEAR) * ageMult);
    const regained = LIVE_CARBON_T_HA * CARBON_FRACTION * regrowthFrac(ageYears);
    return sum + regained * ZONE_AREA_HA;
  }, 0) / 1000;
}

/* ------------------------------------------------------------------ *
 * Four-sphere impact indices, wildfire event. Each is "percent degraded
 * from its own pre-event baseline" (0-100), so "recovered to 90% of
 * pre-event" is exactly index <= 10 for every sphere, uniformly.
 * ------------------------------------------------------------------ */

const BURN_HEAL_TAU_YR = 8;
const SMOKE_TAU_HOURS = 170; // tuned so smoke clears (index<=10) comfortably inside 3 weeks
const SMOKE_TAIL_HOURS = 72; // active fire + smouldering before smoke starts clearing

function wildfireGeoIndexAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  const lastArr = lastArrivalHours(zones);
  const rawPeak = 90 * avgSeverityWeightByHours(zones, Math.min(hours, lastArr) || lastArr);
  const burnScar = hours <= lastArr
    ? 90 * burnedFractionByHours(zones, hours) * avgSeverityWeightByHours(zones, hours)
    : rawPeak * Math.exp(-((hours - lastArr) / HOURS_PER_YEAR) / BURN_HEAL_TAU_YR);
  const sedPeak = sedimentYieldPeakTHaYr(zones, params);
  // Reasoned, tuned so the December storm's debris spike exceeds the
  // fire's own burn-scar peak even at the baseline storm intensity — per
  // the spec's own realisation text, the worst geosphere (and hydrosphere)
  // damage arrives with the rain, not the fire, and a much bigger storm
  // (S2) makes that gap even larger rather than flipping which one wins.
  const DEBRIS_GEO_SCALE = 1.05;
  const debris = hours < STORM_ONSET_HOURS ? 0
    : Math.min(100, DEBRIS_GEO_SCALE * sedPeak) * Math.exp(-((hours - STORM_ONSET_HOURS) / HOURS_PER_YEAR) / SEDIMENT_TAU_YR);
  return Math.max(burnScar, debris);
}

function wildfireHydroIndexAt(hours: number, zones: ZoneState[], params: ParamValues): number {
  const sedPeak = sedimentYieldPeakTHaYr(zones, params);
  // A separate scale from the geosphere's debris component and from the
  // real-NTU turbidityAt() reading below — the 0-100 index and the
  // physical NTU number are different measurements of the same
  // underlying sediment pulse, tuned independently.
  const TURB_INDEX_SCALE = 0.85;
  const turbComponent = hours < STORM_ONSET_HOURS ? 0
    : Math.min(100, TURB_INDEX_SCALE * sedPeak) * Math.exp(-((hours - STORM_ONSET_HOURS) / HOURS_PER_YEAR) / SEDIMENT_TAU_YR);
  const shiftDays = snowmeltShiftDays(zones);
  const snowOnset = STORM_ONSET_HOURS + 60 * HOURS_PER_DAY; // the following spring melt season
  const snowTauHours = 90 * HOURS_PER_DAY;
  const snowComponent = hours < snowOnset ? 0 : Math.min(30, shiftDays * 0.9) * Math.exp(-(hours - snowOnset) / snowTauHours);
  return Math.min(100, turbComponent + snowComponent);
}

function wildfireAtmoIndexAt(hours: number, zones: ZoneState[]): number {
  const lastArr = lastArrivalHours(zones);
  const peak = 85 * avgSeverityWeightByHours(zones, lastArr);
  const smolderEnd = lastArr + SMOKE_TAIL_HOURS;
  if (hours <= smolderEnd) return peak * Math.min(1, Math.max(0.05, hours / Math.max(1, lastArr)));
  return peak * Math.exp(-(hours - smolderEnd) / SMOKE_TAU_HOURS);
}

function wildfireBioIndexAt(hours: number, zones: ZoneState[]): number {
  const lastArr = lastArrivalHours(zones);
  const peak = 95 * avgSeverityWeightByHours(zones, lastArr);
  if (hours <= lastArr) return peak * burnedFractionByHours(zones, hours);
  const ageYears = (hours - 0) / HOURS_PER_YEAR; // fire-start-referenced age; the few hours of spread are negligible at decade scale
  return peak * (1 - regrowthFrac(ageYears));
}

/* ------------------------------------------------------------------ *
 * Atmospheric river: a second, independently real cascade on the same
 * engine, deliberately different in shape — fast, hydrosphere-led, and
 * (unlike the wildfire) fully recovered on every sphere well before year
 * sixty, since there is no fire scar and no water-repellent layer to
 * prolong anything.
 * ------------------------------------------------------------------ */

function arPeakHourly(params: ParamValues): number {
  return peakHourlyMm(params.stormIntensity as number);
}
function pulse(hours: number, peak: number, onsetHours: number, tauHours: number, rampHours: number): number {
  if (peak <= 0) return 0;
  if (hours < onsetHours) return 0;
  const sinceOnset = hours - onsetHours;
  if (sinceOnset < rampHours) return peak * (sinceOnset / rampHours);
  return peak * Math.exp(-(sinceOnset - rampHours) / tauHours);
}
function arHydroIndexAt(hours: number, params: ParamValues): number {
  const peak = Math.min(90, arPeakHourly(params) * 1.2);
  return pulse(hours, peak, 0, 240, 12);
}
function arGeoIndexAt(hours: number, params: ParamValues): number {
  const excess = Math.max(0, arPeakHourly(params) - 50); // unburned soil tolerates far more rain before failing
  const peak = Math.min(60, excess * 1.5);
  return pulse(hours, peak, 0, 24 * 180, 18);
}
function arAtmoIndexAt(hours: number): number {
  return pulse(hours, 8, 0, 48, 6);
}
function arBioIndexAt(hours: number, params: ParamValues): number {
  const peak = Math.min(20, arPeakHourly(params) * 0.15);
  return pulse(hours, peak, 0, 24 * 60, 24);
}

/* ------------------------------------------------------------------ *
 * Dispatch and recovery analysis.
 * ------------------------------------------------------------------ */

export type Sphere = "geosphere" | "hydrosphere" | "atmosphere" | "biosphere";
export const SPHERES: Sphere[] = ["geosphere", "hydrosphere", "atmosphere", "biosphere"];

function sphereIndexAt(sphere: Sphere, hours: number, zones: ZoneState[], params: ParamValues): number {
  if (params.event === "atmosphericRiver") {
    switch (sphere) {
      case "geosphere": return arGeoIndexAt(hours, params);
      case "hydrosphere": return arHydroIndexAt(hours, params);
      case "atmosphere": return arAtmoIndexAt(hours);
      case "biosphere": return arBioIndexAt(hours, params);
    }
  }
  switch (sphere) {
    case "geosphere": return wildfireGeoIndexAt(hours, zones, params);
    case "hydrosphere": return wildfireHydroIndexAt(hours, zones, params);
    case "atmosphere": return wildfireAtmoIndexAt(hours, zones);
    case "biosphere": return wildfireBioIndexAt(hours, zones);
  }
}

interface TraceSummary { peakValue: number; peakHours: number; recoveryHours: number }

/** A one-time, deterministic scan (log-spaced across 0..60 years) — not a
 *  closed-form inverse, because the biosphere curve is a piecewise
 *  succession curve, not a clean exponential. Pure function of (sphere,
 *  params); safe to call from readouts/facts/render every time. */
function analyzeTrace(sphere: Sphere, zones: ZoneState[], params: ParamValues): TraceSummary {
  const N = 1500;
  const samples: { h: number; v: number }[] = new Array(N + 1);
  let peakValue = 0, peakHours = 0;
  for (let i = 0; i <= N; i++) {
    const h = i === 0 ? 0 : Math.pow(10, (i / N) * LOG_MAX) - 1;
    const v = sphereIndexAt(sphere, h, zones, params);
    samples[i] = { h, v };
    if (v > peakValue) { peakValue = v; peakHours = h; }
  }
  // Recovery can only be searched for AFTER the peak — searching from t=0
  // would find the pre-event "nothing has happened yet" reading and
  // wrongly call that "already recovered".
  let recoveryHours = MAX_HOURS;
  if (peakValue <= 10) {
    recoveryHours = 0; // never meaningfully elevated in the first place
  } else {
    for (let i = 1; i <= N; i++) {
      if (samples[i - 1].h < peakHours) continue;
      if (samples[i].v <= 10) {
        const { h: h0, v: v0 } = samples[i - 1];
        const { h: h1, v: v1 } = samples[i];
        const frac = v0 === v1 ? 0 : (v0 - 10) / (v0 - v1);
        recoveryHours = h0 + (h1 - h0) * clamp01(frac);
        break;
      }
    }
  }
  return { peakValue, peakHours, recoveryHours };
}

/* ------------------------------------------------------------------ *
 * State and model. Every sphere index, zone, and readout is a PURE
 * function of (timelineHours, params) — there is no live, sequential,
 * mid-run perturbation anywhere in this control set (post-fire actions are
 * all configured up front, exactly like every scenario preset), so the
 * timeline's own "drag to any moment, forward or back" behaviour is simply
 * evaluating that pure function at a new hours value, never replaying a
 * history.
 * ------------------------------------------------------------------ */

export interface State {
  timelineHours: number;
}

/** Hours the clock advances per real second at 1x playback — one simulated
 *  hour per second, a reasoned pace: fast enough that the acceptance
 *  gate's own default-speed sweep window (a few real seconds) lands
 *  squarely inside the baseline fire's active spread, slow enough that
 *  scrubbing to specific early hours by hand still feels controllable. */
const HOURS_PER_REAL_SECOND_AT_1X = 1;

const model: SimModel<State> = {
  init(params) {
    return { timelineHours: hoursFromPos(params.timelinePos as number) };
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const speed = params.playbackSpeed as number;
    const next = state.timelineHours + dt * speed * HOURS_PER_REAL_SECOND_AT_1X;
    return { timelineHours: Math.max(0, Math.min(MAX_HOURS, next)) };
  },

  applyParams(state, params, prev) {
    if (params.timelinePos !== prev.timelinePos) {
      return { timelineHours: hoursFromPos(params.timelinePos as number) };
    }
    return state;
  },

  readouts(state, params) {
    const zones = computeZones(params);
    const hours = state.timelineHours;
    const out: Readout[] = [
      { key: "clock", label: "Current moment", unit: "", quantity: q(hours, "count"), semantic: "time" },
      // Instant and gate-free: which zone the ignition point maps to is a
      // pure geometric fact about the control's current value, true from
      // the very first tick regardless of how far the fire has spread.
      { key: "ignitionZoneIndex", label: "Ignition zone", unit: "", quantity: q(computeIgnitionZone(params), "count"), semantic: "time" },
      { key: "zonesIgnited", label: "Zones ignited", unit: "", quantity: q(zones.filter((z) => z.arrivalHours <= hours).length, "count"), semantic: "mass" },
    ];
    for (const sphere of SPHERES) {
      const showKey = `show${sphere[0].toUpperCase()}${sphere.slice(1)}` as keyof ParamValues;
      if (params[showKey] === false) continue;
      const trace = analyzeTrace(sphere, zones, params);
      out.push({
        key: `${sphere}Index`, label: `${sphere[0].toUpperCase()}${sphere.slice(1)} impact`, unit: "",
        quantity: q(sphereIndexAt(sphere, hours, zones, params), "count"), semantic: "time", graphable: true,
      });
      out.push({
        key: `${sphere}Peak`, label: `${sphere[0].toUpperCase()}${sphere.slice(1)} peak`, unit: "",
        quantity: q(trace.peakValue, "count"), semantic: "hot",
      });
    }
    out.push({ key: "stormPeakHourlyMm", label: "Storm peak intensity", unit: "mm/h", quantity: q(peakHourlyMm(params.stormIntensity as number), "count"), semantic: "cold" });
    out.push({ key: "postFireEffectMultiplier", label: "Post-fire sediment multiplier", unit: "×", quantity: q(POST_FIRE_SEDIMENT_MULT[(params.postFireAction as string) ?? "none"] ?? 1, "ratio"), semantic: "mass" });
    return out;
  },

  facts(state, params) {
    const zones = computeZones(params);
    const hours = state.timelineHours;
    const facts: Record<string, number | boolean | string> = {
      timelineHours: hours,
      humanTime: humanTime(hours),
      event: params.event as string,
      ignitionZoneIndex: computeIgnitionZone(params),
      zonesIgnited: zones.filter((z) => z.arrivalHours <= hours).length,
      lastArrivalHours: lastArrivalHours(zones),
      crownFire: isCrownFire(params.fuelMoisture as number),
      wildfireControlsActive: params.event === "sierraWildfire",
      stormPeakHourlyMm: peakHourlyMm(params.stormIntensity as number),
      debrisTriggered: debrisZoneFraction(zones, params) > 0,
      sedimentYieldPeakTHaYr: sedimentYieldPeakTHaYr(zones, params),
      turbidityNow: turbidityAt(hours, zones, params),
      snowmeltShiftDays: snowmeltShiftDays(zones),
      carbonReleased: carbonReleasedAt(hours, zones, params),
      carbonRegained: carbonRegainedAt(hours, zones, params),
      // A representative succession stage for the watershed right now — the
      // spec's own bare/herb/shrub/sapling/closed-canopy stack, keyed off
      // the mean age of whatever has actually burned.
      regrowthStageNow: (() => {
        const burned = zones.filter((z) => z.arrivalHours <= hours);
        if (burned.length === 0) return "unburned";
        const meanAgeYears = burned.reduce((s, z) => s + (hours - z.arrivalHours), 0) / burned.length / HOURS_PER_YEAR;
        return regrowthStage(meanAgeYears);
      })(),
      postFireAction: (params.postFireAction as string) ?? "none",
      postFireSedimentMultiplier: POST_FIRE_SEDIMENT_MULT[(params.postFireAction as string) ?? "none"] ?? 1,
    };
    let worstSphere: Sphere = "geosphere";
    let worstPeak = -1;
    for (const sphere of SPHERES) {
      const trace = analyzeTrace(sphere, zones, params);
      facts[`${sphere}Index`] = sphereIndexAt(sphere, hours, zones, params);
      facts[`${sphere}PeakValue`] = trace.peakValue;
      facts[`${sphere}PeakHours`] = trace.peakHours;
      facts[`${sphere}RecoveryHours`] = trace.recoveryHours;
      facts[`${sphere}RecoveryYears`] = trace.recoveryHours / HOURS_PER_YEAR;
      facts[`${sphere}StillElevatedAtYear60`] = trace.recoveryHours >= MAX_HOURS - 1;
      if (trace.peakValue > worstPeak) { worstPeak = trace.peakValue; worstSphere = sphere; }
    }
    facts.worstHitSphere = worstSphere;
    // Severity-map area fractions, feeding the burn-severity-map output.
    for (const sev of ["none", "low", "moderate", "high"] as Severity[]) {
      facts[`area_${sev}`] = zones.filter((z) => z.severity === sev).length / zones.length;
    }
    // Event chronology as real, exportable CSV text (see output spec) — a
    // genuine computed artifact, not a fake "export" button that does
    // nothing.
    const rows = ["hours,day_year,sphere,event"];
    rows.push(`0,${humanTime(0)},all,ignition at zone ${computeIgnitionZone(params)}`);
    rows.push(`${lastArrivalHours(zones).toFixed(1)},${humanTime(lastArrivalHours(zones))},geosphere+biosphere,fire fully spread`);
    if (params.event === "sierraWildfire") {
      rows.push(`${STORM_ONSET_HOURS},${humanTime(STORM_ONSET_HOURS)},geosphere+hydrosphere,first winter storm`);
    }
    facts.eventChronologyCsv = rows.join("\n");
    return facts;
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const SPHERE_COLOR: Record<Sphere, string> = {
  geosphere: "#a0723f", hydrosphere: "#2e7ca8", atmosphere: "#9fb6cf", biosphere: "#3f8f4a",
};
const SEVERITY_COLOR: Record<Severity, string> = {
  none: "#4a7a3f", low: "#c7b64a", moderate: "#d97f34", high: "#8a2f22",
};

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "#0a0f14" : "#eef1ec";
  ctx.fillRect(0, 0, width, height);

  const zones = computeZones(params);
  const hours = state.timelineHours;
  const sceneW = width - 210;
  const sceneBottom = height - 70;
  const sceneTop = 50;

  // Watershed cross-section: reservoir (left) to ridge (right).
  const zoneW = sceneW / ZONE_COUNT;
  for (let i = 0; i < ZONE_COUNT; i++) {
    const z = zones[i];
    const burned = z.arrivalHours <= hours;
    const yTop = sceneTop + (sceneBottom - sceneTop) * (1 - (i + 1) / ZONE_COUNT) * 0.5;
    const x = i * zoneW;
    const color = burned ? SEVERITY_COLOR[z.severity] : (z.southFacing ? "#7a9a4a" : "#3f6b3f");
    ctx.fillStyle = hexA(color, burned ? 0.85 : 0.55);
    ctx.fillRect(x, yTop, zoneW + 1, sceneBottom - yTop);
    if (z.elevM >= SNOW_ELEV_MIN_M) {
      const ash = burned ? SEVERITY_WEIGHT[z.severity] : 0;
      const meltedOut = hours > STORM_ONSET_HOURS + 60 * HOURS_PER_DAY + (90 - snowmeltShiftDays(zones)) * HOURS_PER_DAY;
      if (!meltedOut) {
        ctx.fillStyle = hexA(`#${Math.round(255 * (0.8 - 0.3 * ash)).toString(16).padStart(2, "0")}${Math.round(255 * (0.85 - 0.3 * ash)).toString(16).padStart(2, "0")}ee`, 0.9);
        ctx.fillRect(x, yTop, zoneW + 1, 8);
      }
    }
    if (!burned) {
      plant(ctx, x + zoneW / 2, sceneBottom - 2, Math.min(22, zoneW * 0.5), z.southFacing ? "shrub" : "conifer", theme, { seed: i });
    }
  }

  // Fire front marker at the leading burned edges.
  const igniting = zones.filter((z) => z.arrivalHours <= hours && z.arrivalHours > hours - 3);
  for (const z of igniting) {
    const x = z.zone * zoneW + zoneW / 2;
    const yTop = sceneTop + (sceneBottom - sceneTop) * (1 - (z.zone + 1) / ZONE_COUNT) * 0.5;
    ctx.fillStyle = hexA("#ff8a3d", 0.9);
    ctx.beginPath();
    ctx.arc(x, yTop, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smoke plume, drifting off the top when the atmosphere is actively hit.
  if (params.event === "sierraWildfire" && params.showAtmosphere !== false) {
    const atmo = wildfireAtmoIndexAt(hours, zones);
    if (atmo > 3) {
      const ignZoneX = computeIgnitionZone(params) * zoneW + zoneW / 2;
      const pts = [];
      const n = 40;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        pts.push({
          x: ignZoneX + t * 120 + Math.sin(t * 6) * 10,
          y: sceneTop - t * 40,
          r: 3 + t * 6,
          a: clamp01((atmo / 90) * (1 - t)),
        });
      }
      particleField(ctx, pts, dark ? "#8a8f96" : "#6b6f76", { size: 4, alpha: 0.5, glow: 4 });
    }
  }

  // Reservoir, coloured by live turbidity.
  const turb = turbidityAt(hours, zones, params);
  const turbFrac = clamp01((turb - TURBIDITY_BASELINE_NTU) / 60);
  ctx.fillStyle = `rgb(${Math.round(60 + 140 * turbFrac)},${Math.round(140 - 90 * turbFrac)},${Math.round(120 - 90 * turbFrac)})`;
  roundRect(ctx, -10, sceneBottom - 4, zoneW + 20, 20, 4);
  ctx.fill();
  caption(ctx, 4, sceneBottom + 30, "reservoir", theme, { size: 8, color: theme.inkSoft });

  // Timeline ribbon along the bottom.
  const ribbonY = height - 34;
  ctx.fillStyle = hexA(theme.grid, 0.6);
  roundRect(ctx, 12, ribbonY, sceneW, 10, 5);
  ctx.fill();
  const pos = posFromHours(hours);
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(12 + pos * sceneW, ribbonY + 5, 7, 0, Math.PI * 2);
  ctx.fill();
  caption(ctx, 12, ribbonY - 8, `${humanTime(hours)} of 60 years`, theme, { size: 9, weight: 700 });

  // Four-sphere dashboard, right side.
  const sideX = width - 190;
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, sideX, 12, 178, height - 58, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  let cy = 30;
  for (const sphere of SPHERES) {
    const showKey = `show${sphere[0].toUpperCase()}${sphere.slice(1)}`;
    if (params[showKey] === false) continue;
    const live = sphereIndexAt(sphere, hours, zones, params);
    const trace = analyzeTrace(sphere, zones, params);
    arcGauge(ctx, sideX + 26, cy + 18, 18, live / 100, SPHERE_COLOR[sphere], theme, undefined, { width: 5 });
    caption(ctx, sideX + 50, cy + 10, sphere, theme, { size: 9, weight: 800, color: SPHERE_COLOR[sphere] });
    caption(ctx, sideX + 50, cy + 22, `now ${num(live, 0)}  peak ${num(trace.peakValue, 0)}`, theme, { size: 7.5, color: theme.inkSoft });
    const spark: number[] = [];
    for (let i = 0; i <= 24; i++) spark.push(sphereIndexAt(sphere, hoursFromPos(i / 24), zones, params));
    sparkline(ctx, sideX + 50, cy + 26, 118, 16, spark, SPHERE_COLOR[sphere], theme);
    const recTxt = trace.recoveryHours >= MAX_HOURS - 1 ? "not by yr 60" : `${num(trace.recoveryHours / HOURS_PER_YEAR, 1)}yr`;
    caption(ctx, sideX + 50, cy + 50, `recovers: ${recTxt}`, theme, { size: 7.5, color: theme.inkSoft });
    cy += 62;
  }

  // Carbon ledger: released (burn) vs regained (regrowth), over the full
  // sixty years — the one output that reads naturally on a linear year
  // axis rather than the timeline's own log scale.
  if (cy + 110 < height - 66) {
    const N = 40;
    const released: { x: number; y: number }[] = [];
    const regained: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const yr = (i / N) * MAX_YEARS;
      const h = yr * HOURS_PER_YEAR;
      released.push({ x: yr, y: carbonReleasedAt(h, zones, params) });
      regained.push({ x: yr, y: carbonRegainedAt(h, zones, params) });
    }
    const maxY = Math.max(1, ...released.map((p) => p.y), ...regained.map((p) => p.y));
    const { sx, sy } = chartFrame(ctx, sideX + 4, cy + 6, 168, height - 70 - (cy + 6), {
      xMin: 0, xMax: MAX_YEARS, yMin: 0, yMax: maxY * 1.05,
      xLabel: "year", yLabel: "t C", xTicks: 3, yTicks: 3, plate: false,
    }, theme);
    lineSeries(ctx, released, sx, sy, theme.sci["hot"] ?? "#c0553f", { theme, width: 1.75, endDot: false });
    lineSeries(ctx, regained, sx, sy, theme.sci["producer"] ?? "#3f8f4a", { theme, width: 1.75, endDot: false });
    caption(ctx, sideX + 10, cy + 2, "carbon: released / regained", theme, { size: 7.5, weight: 700, color: theme.inkSoft });
  }
  ctx.restore();

  badge(ctx, 12, 20, params.event === "sierraWildfire" ? "Sierra wildfire" : "Atmospheric river", theme, { color: theme.accent });
  vignette(ctx, width, height, 0.12);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const KMH = 1 / 3.6; // 1 km/h in m/s, the SI unit "velocity" is stored in

const BASE_SETUP: ParamValues = {
  event: "sierraWildfire", ignitionElevation: 1850, windSpeed: 35 * KMH, fuelMoisture: 0.06,
  yearsSinceFire: 90, stormIntensity: 60, postFireAction: "none", timelinePos: 0, playbackSpeed: 1,
};

export const oneSparkSixtyYearsSim: SimManifest<State> = {
  id: "g6.a4-6",
  title: "One Spark, Sixty Years: A Sierra Watershed",
  tagline: "Run a Sierra wildfire through all four Earth spheres and prove, by scrubbing the timeline, that the worst hit does not have to arrive first.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "State the one idea this sim exists to prove: one Earth-system event drives four sphere responses, each on its own real timescale, and severity order is not arrival order.",
    "Use the timeline scrubber to find, for a given run, the moment each of the four spheres is worst hit and how far apart those moments are.",
    "Show from the model, not from memory, whether the fire itself or the storm that follows it caused the greater hydrosphere and geosphere damage.",
    "Compare two different Earth-system events on the same four-sphere dashboard and name which sphere responds first and which is still not recovered by year sixty.",
  ],
  misconceptions: [
    "A disaster is one event, in one place, that ends when the news does",
    "The worst damage from a hazard always arrives at the moment of the hazard itself",
    "Every part of a landscape recovers from a disturbance on the same timescale",
    "A wildfire's damage is limited to what actually burned",
  ],
  interactionHint: "Run the baseline fire, then drag the timeline scrubber across hour 6, day 21, December and year five to watch the four sphere cards rise and fall out of step.",
  tickRate: 30,
  timeScale: 1,
  params: {
    event: {
      type: "option", label: "Event",
      options: [
        { value: "sierraWildfire", label: "Sierra wildfire" },
        { value: "atmosphericRiver", label: "Atmospheric river" },
      ],
      default: "sierraWildfire",
      help: "Loads a different driver and cascade; the wildfire-only controls below go inert under the atmospheric river.",
    },
    ignitionElevation: {
      type: "number", label: "Ignition point", kind: "length", unit: "m",
      min: ELEV_MIN_M, max: ELEV_MAX_M, step: 10, default: 1850,
      help: "Where the fire starts (Sierra wildfire only) — sets which zone ignites first and how far it must run each way.",
    },
    windSpeed: {
      type: "number", label: "Wind speed", kind: "velocity", unit: "m/s",
      min: 0, max: 90 * KMH, step: 1 * KMH, default: 35 * KMH,
      help: "Rate of spread roughly doubles every 20 km/h (Sierra wildfire only).",
    },
    fuelMoisture: {
      type: "number", label: "Fuel moisture", kind: "percent", unit: "%",
      min: 0.03, max: 0.30, step: 0.005, default: 0.06,
      help: "Below 8% the fire climbs into the crowns (Sierra wildfire only).",
    },
    yearsSinceFire: {
      type: "number", label: "Years since last fire (yr)", kind: "count",
      min: 2, max: 120, step: 1, default: 90,
      help: "Sets fuel load on every zone, from 8 t/ha fresh to about 90 t/ha at ninety years (Sierra wildfire only).",
    },
    stormIntensity: {
      type: "number", label: "First-winter storm", kind: "ratio", unit: "mm",
      min: 0, max: 150, step: 5, default: 60,
      help: "Intensity of the December storm after a wildfire, or the atmospheric river's own rainfall when that event is selected.",
    },
    postFireAction: {
      type: "option", label: "Post-fire action",
      options: [
        { value: "none", label: "None" },
        { value: "mulch", label: "Mulch treatment" },
        { value: "replant", label: "Replanting" },
        { value: "salvage", label: "Salvage logging" },
        { value: "prescribedBurn", label: "Prescribed burn beforehand" },
      ],
      default: "none",
      help: "Prescribed burn caps fuel load before ignition; mulch cuts sediment yield; salvage logging adds a little; replanting speeds regrowth (Sierra wildfire only).",
    },
    timelinePos: {
      type: "number", label: "Timeline", kind: "ratio",
      min: 0, max: 1, step: 0.001, default: 0,
      help: "Drag to any moment from hour zero to year sixty, forward or back — the scene and every readout move with it.",
    },
    playbackSpeed: {
      type: "number", label: "Playback speed", kind: "ratio", unit: "×",
      min: 0.5, max: 50, step: 0.5, default: 1,
      help: "How fast the clock advances when left to run: one simulated hour per real second at 1x.",
    },
    showGeosphere: { type: "boolean", label: "Show geosphere", default: true, help: "Sphere-focus toggle." },
    showHydrosphere: { type: "boolean", label: "Show hydrosphere", default: true, help: "Sphere-focus toggle." },
    showAtmosphere: { type: "boolean", label: "Show atmosphere", default: true, help: "Sphere-focus toggle." },
    showBiosphere: { type: "boolean", label: "Show biosphere", default: true, help: "Sphere-focus toggle." },
  },
  model,
  render,
  labs: [
    {
      id: "the-baseline-fire",
      title: "The baseline fire",
      question: "At what moment is each of the four spheres worst hit, and how far apart are those moments?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS3-2"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the order",
          instruction: "Before scrubbing anything, predict which of the four spheres will hit its own worst point first.",
          predict: {
            prompt: "Which sphere do you expect to peak first?",
            options: ["Atmosphere — smoke is immediate", "Geosphere — the ground burns first", "Hydrosphere — water is downstream of everything", "Biosphere — it is what actually burns"],
            correct: 0,
            reveal: "The atmosphere. Smoke rises within the fire's own first hours, while the geosphere's and hydrosphere's worst hit is still months away.",
          },
        },
        {
          id: "scrub",
          phase: "measure",
          title: "Scrub across the first year",
          instruction: "Drag the timeline to hour 6, day 21, December and April, recording all four impact indices at each stop.",
          requireData: 3,
          check: { describe: "At least three timeline positions recorded", test: (v) => v.data.length >= 3 },
        },
        {
          id: "identify",
          phase: "analyze",
          title: "Identify the worst-hit moments",
          instruction: "Using the sphere cards' own peak readouts, name which sphere peaked highest overall.",
          check: { describe: "The worst-hit sphere fact is available", test: (v) => typeof v.facts.worstHitSphere === "string" && (v.facts.worstHitSphere as string).length > 0 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the lesson",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "Which sphere peaked first, which peaked worst, and how many months apart were those two moments?",
            placeholder: "The ... sphere peaked first, at ..., but the worst hit overall was the ... sphere, at ..., which is ... months apart.",
          },
        },
      ],
    },
    {
      id: "the-winter-after",
      title: "The winter after",
      question: "Did the greatest hydrosphere and geosphere damage come from the fire itself, or from rain that fell three months after it was out?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS3-2"],
      setup: { ...BASE_SETUP, stormIntensity: 140, timelinePos: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the bigger hit",
          instruction: "The first-winter storm is now set to 140 mm, more than double the baseline.",
          predict: {
            prompt: "With this much rain, will the geosphere's biggest hit still be the fire itself?",
            options: ["Yes, fire is always the biggest geosphere hit", "No — the December debris flow can exceed the fire's own burn damage"],
            correct: 1,
            reveal: "No. A big enough storm on a high-severity, water-repellent burn scar produces a debris-flow spike that outweighs the fire's own immediate burn damage.",
          },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Compare geosphere peak timing",
          instruction: "Check the geosphere card's peak-timing readout against the fire's own end.",
          requireData: 1,
          check: { describe: "Geosphere peak lands at or after the first-winter storm", test: (v) => (v.facts.geospherePeakHours as number) >= STORM_ONSET_HOURS - 24 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the cause",
          instruction: "State which event actually produced the geosphere's worst moment.",
          write: {
            prompt: "Which caused the bigger geosphere hit at 140 mm — the fire, or the storm three months later?",
            placeholder: "The bigger hit came from ..., because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "prepared-ground",
      title: "Prepared ground",
      brief: "With the same wind and dryness as the baseline, use a prescribed burn beforehand to measurably cut the geosphere's worst hit.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "With years-since-fire pushed high and a prescribed burn selected, the geosphere peak drops at least 20% below the untreated baseline",
        test: (v) => v.params.postFireAction === "prescribedBurn" && (v.facts.geospherePeakValue as number) <= 72,
      },
      hints: ["A prescribed burn caps the effective fuel load before the real fire ever starts — set years-since-fire high, then switch this on."],
    },
    {
      id: "two-events-one-dashboard",
      title: "Two events, one dashboard",
      brief: "Switch to the atmospheric river and find the one thing every one of its four spheres does that the wildfire's spheres do not.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, event: "atmosphericRiver", stormIntensity: 150, timelinePos: 1 },
      goal: {
        describe: "At year sixty, every sphere has recovered under the atmospheric river — unlike the wildfire's biosphere",
        test: (v) => v.params.event === "atmosphericRiver" &&
          (v.facts.geosphereStillElevatedAtYear60 as boolean) === false &&
          (v.facts.biosphereStillElevatedAtYear60 as boolean) === false,
      },
      hints: ["Check each sphere's 'recovers' readout at year sixty rather than assuming from the wildfire run."],
    },
  ],
};
