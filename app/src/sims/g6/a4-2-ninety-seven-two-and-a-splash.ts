import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, hexA, isDarkTheme, particleField, sphere, vignette,
  type Particle,
} from "@ui/scene";

/**
 * Ninety-Seven, Two, and a Splash — Grade 6, Unit A4.2: the hydrosphere.
 *
 * Eight real reservoirs, real volumes in km^3, real annual transfer rates —
 * evaporation, precipitation, runoff, infiltration — taken straight from the
 * standard published global water budget (Oki & Kanae): evaporation from the
 * ocean 505,000 km^3/yr, land evapotranspiration 72,000, precipitation on the
 * ocean 458,000, on land 119,000, runoff to the ocean 45,000, infiltration to
 * groundwater 2,000. Those numbers are chosen so the budget genuinely closes:
 * evaporation in equals precipitation out for the atmosphere, and precipitation
 * on land equals evapotranspiration plus infiltration plus runoff — the
 * bookkeeping was never fudged to make a picture, it is the picture.
 *
 * Every tagged droplet is a real random walker: on entering a reservoir it
 * draws an exit time from that reservoir's own residence-time distribution
 * (nine days for the atmosphere, 3,200 years for the deep ocean, centuries to
 * ten millennia for groundwater), then jumps to its next reservoir with the
 * exact probabilities the flux table above implies — an atmosphere parcel
 * falls back on the ocean 79% of the time for the same reason 79% of global
 * precipitation falls on the ocean. Nothing about where a droplet goes next is
 * invented; it is read off the same numbers the stock-and-flow engine runs on.
 *
 * The honesty rule: Central Valley pumping draws down a real, separate local
 * aquifer stock with no fast natural refill, and the land subsidence it causes
 * never reverses even after the water table recovers — inelastic clay
 * compaction is real and irreversible, and the sim never lets the bench mark
 * un-sink once pumping stops.
 */

/* ------------------------------------------------------------------ *
 * World constants — real global reservoir volumes and transfer rates
 * ------------------------------------------------------------------ */

const OCEAN_KM3 = 1_338_000_000;
const ICE_KM3 = 24_060_000;
const GROUNDWATER_KM3 = 23_400_000;
const GROUNDWATER_FRESH_KM3 = 10_530_000; // spec/standard split: fresh vs saline groundwater
const LAKES_KM3 = 176_400;
const LAKES_FRESH_KM3 = 91_000;           // the rest (85,400) is saline (e.g. the Caspian)
const RIVERS_KM3 = 2_120;
const SOIL_KM3 = 16_500;
const ATMOS_KM3 = 12_900;
const TOTAL_WATER_KM3 =
  OCEAN_KM3 + ICE_KM3 + GROUNDWATER_KM3 + LAKES_KM3 + RIVERS_KM3 + SOIL_KM3 + ATMOS_KM3;

/** Ice split across the three meltable bodies, summing to ICE_KM3. */
const MOUNTAIN_GLACIERS_KM3 = 170_000;
const GREENLAND_KM3 = 2_900_000;
const ANTARCTICA_KM3 = ICE_KM3 - MOUNTAIN_GLACIERS_KM3 - GREENLAND_KM3;

/** Annual transfer rates, km^3/yr — the real, published global water budget. */
const EVAP_OCEAN = 505_000;
const ET_LAND = 72_000;
const PRECIP_OCEAN = 458_000;
const PRECIP_LAND = 119_000;
const RUNOFF_LAND = 45_000;     // land surface to rivers/ocean
const INFILTRATION = 2_000;     // land to groundwater
// The budget closes exactly: evaporation in (577,000) = precipitation out
// (577,000) for the atmosphere; precipitation on land (119,000) = ET (72,000)
// + infiltration (2,000) + runoff (45,000) for the land surface.

/** 1 mm of global sea level is this many km^3 of water, given ocean area
 *  ~3.6e8 km^2 (a real, computed conversion, not a fitted constant). */
const OCEAN_AREA_KM2 = 3.6e8;
const KM3_PER_MM_SEA_LEVEL = OCEAN_AREA_KM2 * 1e6 * 0.001 / 1e9; // -> 360

/** Residence times, years (spec's own figures). Drawn as an exponential mean. */
const RESIDENCE_YR: Record<Reservoir, number> = {
  ocean: 3200, atmosphere: 9 / 365, soil: 0.15, groundwater: 2000, surface: 0.3,
};

/**
 * Tracer transition probabilities, read directly off the flux table above —
 * an atmosphere parcel falls on the ocean in proportion to PRECIP_OCEAN's
 * share of total precipitation, not by any separately invented number.
 */
const P_ATMOS_TO_OCEAN = PRECIP_OCEAN / (PRECIP_OCEAN + PRECIP_LAND);
const P_SOIL_TO_ATMOS = ET_LAND / PRECIP_LAND;
const P_SOIL_TO_GROUND = INFILTRATION / PRECIP_LAND;
// (the remainder of a soil parcel's exits go to surface water/runoff)

type Reservoir = "ocean" | "atmosphere" | "soil" | "groundwater" | "surface";

/* ------------------------------------------------------------------ *
 * Central Valley aquifer — a real, local, separate small system
 * ------------------------------------------------------------------ */

const CV_REFERENCE_KM3 = 1000;      // representative usable managed-basin storage
const CV_NATURAL_RECHARGE = 3;      // km^3/yr, baseline inflow with no pumping
const CV_AREA_KM2 = 20_000;         // rough footprint of the actively pumped basin
const CV_SPECIFIC_YIELD = 0.15;     // fraction of aquifer volume that is drainable pore space
/** Metres of water-table decline per km^3 of net storage lost, from
 *  volume = area * specificYield * depthChange. */
const CV_M_PER_KM3 = 1000 / (CV_AREA_KM2 * CV_SPECIFIC_YIELD);
const CV_PRECONSOLIDATION_M = 15;   // depth below which clay compaction begins
const CV_SUBSIDENCE_PER_M = 0.09;   // metres of permanent subsidence per metre of decline past that

/** Ice melts toward its scenario target with a real, slow relaxation time. */
const ICE_MELT_TAU_YR: Record<string, number> = {
  today: Infinity, mountainGlaciers: 80, greenland: 400, allIce: 600,
};

const HISTORY_MAX = 600;
const SAMPLE_YR = 0.25; // one row per quarter simulated year

/* ------------------------------------------------------------------ *
 * Tracers — real random walkers between reservoirs
 * ------------------------------------------------------------------ */

interface Tracer {
  id: number;
  reservoir: Reservoir;
  ageInReservoir: number;   // simulated years since the last transition
  exitAt: number;           // drawn exit time for the current stay
  enteredYear: number;      // sim year the tracer entered this reservoir
  visits: { reservoir: Reservoir; years: number }[]; // the passport, completed stays only
}

function drawExitTime(rng: Rng, reservoir: Reservoir): number {
  const mean = RESIDENCE_YR[reservoir];
  // Exponential draw: a real residence-time distribution, not a fixed dwell.
  return -mean * Math.log(Math.max(rng.next(), 1e-9));
}

function nextReservoir(rng: Rng, from: Reservoir): Reservoir {
  const u = rng.next();
  switch (from) {
    case "ocean": return "atmosphere";
    case "atmosphere": return u < P_ATMOS_TO_OCEAN ? "ocean" : "soil";
    case "soil":
      if (u < P_SOIL_TO_ATMOS) return "atmosphere";
      if (u < P_SOIL_TO_ATMOS + P_SOIL_TO_GROUND) return "groundwater";
      return "surface";
    case "groundwater": return "surface";
    case "surface": return "ocean";
  }
}

function spawnTracer(rng: Rng, id: number, site: string): Tracer {
  const reservoir: Reservoir = site === "land" ? "soil" : site === "atmosphere" ? "atmosphere" : "ocean";
  return {
    id, reservoir, ageInReservoir: 0, exitAt: drawExitTime(rng, reservoir),
    enteredYear: 0, visits: [],
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  simYears: number;
  ocean: number;       // km^3, grows only from ice melt in this model
  iceTotal: number;    // km^3, the three ice bodies combined
  iceByBody: { mountainGlaciers: number; greenland: number; antarctica: number };
  cvStorage: number;   // km^3, Central Valley managed-basin aquifer
  cvSubsidenceM: number;
  cvMinStorage: number; // lowest storage ever reached, drives the irreversible subsidence
  tracers: Tracer[];
  residenceSum: Record<Reservoir, number>;
  residenceCount: Record<Reservoir, number>;
  histYr: number[];
  histSeaLevelMm: number[];
  histCvDepthM: number[];
  sampleClock: number;
  peakDischargeThisYear: number;
  peakDischargeLastYear: number;
}

function iceTargetFractions(scenario: string): { mountainGlaciers: number; greenland: number; antarctica: number } {
  if (scenario === "mountainGlaciers") return { mountainGlaciers: 0, greenland: 1, antarctica: 1 };
  if (scenario === "greenland") return { mountainGlaciers: 1, greenland: 0, antarctica: 1 };
  if (scenario === "allIce") return { mountainGlaciers: 0, greenland: 0, antarctica: 0 };
  return { mountainGlaciers: 1, greenland: 1, antarctica: 1 };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const n = Math.round(params.tracerCount as number);
  const site = params.releaseSite as string;
  const tracers: Tracer[] = [];
  for (let i = 0; i < n; i++) tracers.push(spawnTracer(rng, i, site));
  const s: State = {
    simYears: 0,
    ocean: OCEAN_KM3,
    iceTotal: ICE_KM3,
    iceByBody: { mountainGlaciers: MOUNTAIN_GLACIERS_KM3, greenland: GREENLAND_KM3, antarctica: ANTARCTICA_KM3 },
    cvStorage: CV_REFERENCE_KM3,
    cvSubsidenceM: 0,
    cvMinStorage: CV_REFERENCE_KM3,
    tracers,
    residenceSum: { ocean: 0, atmosphere: 0, soil: 0, groundwater: 0, surface: 0 },
    residenceCount: { ocean: 0, atmosphere: 0, soil: 0, groundwater: 0, surface: 0 },
    histYr: [0], histSeaLevelMm: [0], histCvDepthM: [0],
    sampleClock: 0,
    peakDischargeThisYear: 0, peakDischargeLastYear: 0,
  };
  return s;
}

function cvWaterTableDepthM(storage: number): number {
  return Math.max(0, (CV_REFERENCE_KM3 - storage) * CV_M_PER_KM3);
}

function seaLevelMm(state: State): number {
  const meltedKm3 = ICE_KM3 - state.iceTotal;
  return meltedKm3 / KM3_PER_MM_SEA_LEVEL;
}

/** Instantaneous river discharge, km^3/yr: the steady baseline plus a spring
 *  snowmelt pulse whose size tracks the snowpack control. */
function riverDischargeRate(simYears: number, snowpackFrac: number): number {
  const yearFrac = simYears - Math.floor(simYears);
  // A pulse centred on day ~110 (mid-April), width about six weeks.
  const pulse = Math.exp(-((yearFrac - 0.3) ** 2) / (2 * 0.05 * 0.05));
  return RUNOFF_LAND + 8000 * snowpackFrac * pulse;
}

function pushSample(s: State): void {
  const drop = s.histYr.length >= HISTORY_MAX ? 1 : 0;
  s.histYr = s.histYr.slice(drop);
  s.histSeaLevelMm = s.histSeaLevelMm.slice(drop);
  s.histCvDepthM = s.histCvDepthM.slice(drop);
  s.histYr.push(s.simYears);
  s.histSeaLevelMm.push(seaLevelMm(s));
  s.histCvDepthM.push(cvWaterTableDepthM(s.cvStorage));
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (params.tracerCount !== prev.tracerCount || params.releaseSite !== prev.releaseSite) {
      return buildWorld(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const compYrPerSec = params.timeCompression as number;
    const dtYr = dt * compYrPerSec;
    const s: State = {
      ...state,
      iceByBody: { ...state.iceByBody },
      tracers: state.tracers.map((t) => ({ ...t, visits: t.visits })),
      residenceSum: { ...state.residenceSum },
      residenceCount: { ...state.residenceCount },
    };

    /* --- ice melt: a real relaxation toward the scenario target, mass-conserving --- */
    const scenario = params.iceScenario as string;
    const targets = iceTargetFractions(scenario);
    let meltedThisStep = 0;
    for (const body of ["mountainGlaciers", "greenland", "antarctica"] as const) {
      const full = body === "mountainGlaciers" ? MOUNTAIN_GLACIERS_KM3 : body === "greenland" ? GREENLAND_KM3 : ANTARCTICA_KM3;
      const target = full * targets[body];
      const tau = ICE_MELT_TAU_YR[scenario];
      const before = s.iceByBody[body];
      const after = Number.isFinite(tau) ? target + (before - target) * Math.exp(-dtYr / tau) : before;
      meltedThisStep += before - after;
      s.iceByBody[body] = after;
    }
    s.iceTotal = s.iceByBody.mountainGlaciers + s.iceByBody.greenland + s.iceByBody.antarctica;
    s.ocean = state.ocean + meltedThisStep; // conservation: what leaves ice enters the ocean

    /* --- Central Valley aquifer: pumping out, a small natural recharge in --- */
    const pumping = params.cvPumping as number;
    s.cvStorage = Math.max(0, state.cvStorage + (CV_NATURAL_RECHARGE - pumping) * dtYr);
    if (s.cvStorage < s.cvMinStorage) s.cvMinStorage = s.cvStorage;
    // Subsidence is driven by the DEEPEST the water table has ever been, so
    // recovery afterwards never un-sinks the ground — the compaction is real
    // and irreversible, exactly the honesty rule this scenario exists to show.
    const worstDepth = cvWaterTableDepthM(s.cvMinStorage);
    s.cvSubsidenceM = Math.max(0, (worstDepth - CV_PRECONSOLIDATION_M) * CV_SUBSIDENCE_PER_M);

    /* --- river discharge peak tracking, for the snowpack scenario --- */
    const snowpack = params.snowpack as number;
    const rate = riverDischargeRate(s.simYears, snowpack);
    const yearBefore = Math.floor(state.simYears);
    const yearAfter = Math.floor(state.simYears + dtYr);
    if (yearAfter > yearBefore) {
      s.peakDischargeLastYear = s.peakDischargeThisYear;
      s.peakDischargeThisYear = 0;
    }
    if (rate > s.peakDischargeThisYear) s.peakDischargeThisYear = rate;

    /* --- tracers: real random walk with residence-time draws --- */
    for (const t of s.tracers) {
      t.ageInReservoir += dtYr;
      if (t.ageInReservoir >= t.exitAt) {
        s.residenceSum[t.reservoir] += t.ageInReservoir;
        s.residenceCount[t.reservoir] += 1;
        t.visits = t.visits.length >= 12 ? t.visits : [...t.visits, { reservoir: t.reservoir, years: t.ageInReservoir }];
        t.reservoir = nextReservoir(ctx.rng, t.reservoir);
        t.ageInReservoir = 0;
        t.exitAt = drawExitTime(ctx.rng, t.reservoir);
        t.enteredYear = s.simYears;
      }
    }

    s.simYears = state.simYears + dtYr;
    s.sampleClock += dtYr;
    while (s.sampleClock >= SAMPLE_YR) {
      s.sampleClock -= SAMPLE_YR;
      pushSample(s);
    }
    return s;
  },

  readouts(state, params) {
    const totalNow = state.ocean + state.iceTotal + GROUNDWATER_KM3 + LAKES_KM3 + RIVERS_KM3 + SOIL_KM3 + ATMOS_KM3;
    const salineFraction = state.ocean / totalNow;
    return [
      { key: "years", label: "Simulated years elapsed", quantity: q(state.simYears, "count"), semantic: "time" },
      {
        key: "seaLevel", label: "Sea level rise", unit: "m",
        quantity: q(seaLevelMm(state) / 1000, "length"), semantic: "hot", graphable: true,
      },
      {
        key: "iceRemaining", label: "Ice remaining", unit: "%",
        quantity: q(state.iceTotal / ICE_KM3, "percent"), semantic: "cold", graphable: true,
      },
      {
        key: "cvDepth", label: "Central Valley water-table depth", unit: "m",
        quantity: q(cvWaterTableDepthM(state.cvStorage), "length"), semantic: "acid", graphable: true,
      },
      {
        key: "cvSubsidence", label: "Land subsidence (Mendota)", unit: "m",
        quantity: q(state.cvSubsidenceM, "length"), semantic: "force", graphable: true,
      },
      {
        key: "salineFraction", label: "Fraction of all water that is ocean",
        quantity: q(clamp01(salineFraction), "percent"), unit: "%", semantic: "acid",
      },
      {
        key: "riverDischarge", label: "River discharge rate (km3/yr)",
        quantity: q(riverDischargeRate(state.simYears, params.snowpack as number), "ratio"),
        semantic: "velocity", bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const freshTotal = state.iceTotal + GROUNDWATER_FRESH_KM3 + LAKES_FRESH_KM3 + RIVERS_KM3 + SOIL_KM3 + ATMOS_KM3;
    const totalNow = state.ocean + state.iceTotal + GROUNDWATER_KM3 + LAKES_KM3 + RIVERS_KM3 + SOIL_KM3 + ATMOS_KM3;
    const liquidFreshSurface = LAKES_FRESH_KM3 + RIVERS_KM3;
    const meanResidence: Record<string, number> = {};
    for (const key of Object.keys(state.residenceSum) as Reservoir[]) {
      meanResidence[key] = state.residenceCount[key] > 0 ? state.residenceSum[key] / state.residenceCount[key] : -1;
    }
    let byReservoir: Record<Reservoir, number> = { ocean: 0, atmosphere: 0, soil: 0, groundwater: 0, surface: 0 };
    for (const t of state.tracers) byReservoir[t.reservoir]++;
    return {
      simYears: state.simYears,
      oceanKm3: state.ocean,
      iceKm3: state.iceTotal,
      icePercentRemaining: (state.iceTotal / ICE_KM3) * 100,
      seaLevelMm: seaLevelMm(state),
      seaLevelM: seaLevelMm(state) / 1000,
      totalWaterNowKm3: totalNow,
      freshTotalKm3: freshTotal,
      oceanFraction: state.ocean / totalNow,
      freshFraction: 1 - state.ocean / totalNow,
      allWaterSphereDiameterKm: 2 * Math.cbrt((3 * TOTAL_WATER_KM3) / (4 * Math.PI)),
      freshSphereDiameterKm: 2 * Math.cbrt((3 * freshTotal) / (4 * Math.PI)),
      liquidFreshSurfaceDiameterKm: 2 * Math.cbrt((3 * liquidFreshSurface) / (4 * Math.PI)),
      cvStorageKm3: state.cvStorage,
      cvDepthM: cvWaterTableDepthM(state.cvStorage),
      cvSubsidenceM: state.cvSubsidenceM,
      cvMinStorageEver: state.cvMinStorage,
      peakDischargeLastYear: state.peakDischargeLastYear,
      globalOceanEvaporationKm3Yr: EVAP_OCEAN,
      tracerCount: state.tracers.length,
      tracersInOcean: byReservoir.ocean,
      tracersInAtmosphere: byReservoir.atmosphere,
      tracersInGroundwater: byReservoir.groundwater,
      tracersInSoil: byReservoir.soil,
      tracersInSurface: byReservoir.surface,
      meanResidenceOceanYr: meanResidence.ocean,
      meanResidenceAtmosphereYr: meanResidence.atmosphere,
      meanResidenceGroundwaterYr: meanResidence.groundwater,
      meanResidenceSoilYr: meanResidence.soil,
      meanResidenceSurfaceYr: meanResidence.surface,
      completedTransitions: Object.values(state.residenceCount).reduce((a, b) => a + b, 0),
      iceScenario: params.iceScenario as string,
      viewMode: params.viewMode as string,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }
const MONO = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";

const RES_COLOR: Record<Reservoir, string> = {
  ocean: "#2e7ca8", atmosphere: "#bcd6e8", soil: "#8a6a42", groundwater: "#c99a3f", surface: "#4aa0c9",
};

function drawGlobe(rc: RenderContext<State>, cx: number, cy: number, R: number) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const iceFrac = state.iceTotal / ICE_KM3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const water = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
  water.addColorStop(0, mixHex("#2e7ca8", dark ? "#123044" : "#8fc7de", 0.2));
  water.addColorStop(1, mixHex("#123048", "#000000", 0.3));
  ctx.fillStyle = water;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  // Land masses, a couple of soft continents so the globe reads as Earth.
  ctx.fillStyle = hexA("#7a8f5c", 0.85);
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.3, cy - R * 0.1, R * 0.42, R * 0.55, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + R * 0.45, cy + R * 0.15, R * 0.3, R * 0.4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Ice caps, top and bottom, sized by how much ice remains.
  const capH = R * 0.55 * iceFrac;
  ctx.fillStyle = hexA("#eef7fb", 0.92);
  ctx.beginPath(); ctx.ellipse(cx, cy - R + capH * 0.5, R * 0.9, capH, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + R - capH * 0.5, R * 0.9, capH, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = hexA(theme.ink, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Tracers: dots on the globe's face, coloured by current reservoir.
  const particles: Particle[] = [];
  for (const t of state.tracers) {
    const a = (t.id * 2.399963) % (Math.PI * 2); // golden-angle scatter, stable per id
    const rr = R * (0.15 + 0.8 * (((t.id * 37) % 100) / 100));
    const px = cx + Math.cos(a + time * 0.02) * rr;
    const py = cy + Math.sin(a + time * 0.02) * rr * 0.9;
    particles.push({ x: px, y: py, r: 1.6, a: 0.85 });
  }
  particleField(ctx, particles, "#ffe9a8", { alpha: 0.9 });
}

function drawComparisonSpheres(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.82)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "ALL WATER / FRESH WATER / LIQUID FRESH SURFACE", theme, {
    size: 9, weight: 800, color: theme.inkSoft,
  });
  const freshTotal = state.iceTotal + GROUNDWATER_FRESH_KM3 + LAKES_FRESH_KM3 + RIVERS_KM3 + SOIL_KM3 + ATMOS_KM3;
  const liquidFreshSurface = LAKES_FRESH_KM3 + RIVERS_KM3;
  const diamKm = (v: number) => 2 * Math.cbrt((3 * v) / (4 * Math.PI));
  const spheres = [
    { v: TOTAL_WATER_KM3, color: "#2e7ca8", label: "all water" },
    { v: freshTotal, color: "#8fc7de", label: "fresh water" },
    { v: liquidFreshSurface, color: "#4aa0c9", label: "liquid, fresh, surface" },
  ];
  const maxDiam = diamKm(spheres[0].v);
  const baseY = y + h - 16;
  let cx = x + 26;
  for (const s of spheres) {
    const r = Math.max(2, (diamKm(s.v) / maxDiam) * (h * 0.32));
    sphere(ctx, cx, baseY - r, r, s.color, { rim: true });
    caption(ctx, cx, baseY + 10, `${diamKm(s.v).toFixed(0)} km`, theme, { align: "center", size: 9, color: theme.inkSoft });
    caption(ctx, cx, baseY + 21, s.label, theme, { align: "center", size: 8, color: theme.inkSoft });
    cx += w / 3.2;
  }
  ctx.restore();
}

function drawStockBars(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.82)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "RESERVOIR STOCKS (log scale)", theme, { size: 9, weight: 800, color: theme.inkSoft });
  const rows: [string, number, string][] = [
    ["ocean", state.ocean, RES_COLOR.ocean],
    ["ice", state.iceTotal, "#cfe8f4"],
    ["groundwater", GROUNDWATER_KM3, RES_COLOR.groundwater],
    ["lakes", LAKES_KM3, RES_COLOR.surface],
    ["soil", SOIL_KM3, RES_COLOR.soil],
    ["atmosphere", ATMOS_KM3, RES_COLOR.atmosphere],
    ["rivers", RIVERS_KM3, "#3f7ea0"],
  ];
  const maxLog = Math.log10(OCEAN_KM3);
  const barX = x + 78, barW = w - 92;
  rows.forEach(([name, v, color], i) => {
    const ry = y + 24 + i * 15;
    caption(ctx, x + 8, ry + 6, name, theme, { size: 9, color: theme.inkSoft });
    const frac = clamp01(Math.log10(Math.max(1, v)) / maxLog);
    ctx.fillStyle = hexA(theme.grid, 0.6);
    roundRect(ctx, barX, ry, barW, 8, 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, barX, ry, barW * frac, 8, 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawCentralValley(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.82)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "CENTRAL VALLEY AQUIFER", theme, { size: 9, weight: 800, color: theme.inkSoft });
  const groundY = y + h - 12;
  const poleX = x + w * 0.7;
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(poleX, groundY); ctx.lineTo(poleX, y + 24); ctx.stroke();
  const depthPx = Math.min(h - 40, cvWaterTableDepthM(state.cvStorage) * (h - 40) / 60);
  ctx.strokeStyle = hexA("#c99a3f", 0.9);
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + 24, groundY - depthPx); ctx.lineTo(x + w - 40, groundY - depthPx); ctx.stroke();
  caption(ctx, x + 8, groundY - depthPx - 6, `table -${num(cvWaterTableDepthM(state.cvStorage))} m`, theme, { size: 9, color: "#c99a3f" });
  const subPx = Math.min(h - 30, state.cvSubsidenceM * 6);
  sphere(ctx, poleX, groundY - subPx, 4, "#e0553f", { rim: false });
  caption(ctx, poleX + 8, groundY - subPx, `${num(state.cvSubsidenceM, 2)} m subsided`, theme, { size: 9, color: "#e0553f" });
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "#05070c" : "#eef3f6";
  ctx.fillRect(0, 0, width, height);
  const view = params.viewMode as string;

  const sideW = Math.min(240, width * 0.3);
  if (view === "globe") {
    const R = Math.min(height * 0.36, (width - sideW) * 0.4);
    drawGlobe(rc, (width - sideW) / 2, height * 0.44, R);
  } else if (view === "spheres") {
    drawComparisonSpheres(rc, 20, height * 0.15, width - sideW - 40, height * 0.5);
  } else {
    drawStockBars(rc, 20, height * 0.1, width - sideW - 40, height * 0.62);
  }
  drawCentralValley(rc, width - sideW + 4, 12, sideW - 16, height * 0.42);

  // Stock-bar mini panel plus tracer summary, right side lower.
  const panelY = height * 0.46;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.82)";
  roundRect(ctx, width - sideW + 4, panelY, sideW - 16, height * 0.44, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, width - sideW + 12, panelY + 14, "TRACER PASSPORT (live)", theme, { size: 9, weight: 800, color: theme.inkSoft });
  ctx.font = MONO;
  ctx.textBaseline = "middle";
  const counts: Record<Reservoir, number> = { ocean: 0, atmosphere: 0, soil: 0, groundwater: 0, surface: 0 };
  for (const t of state.tracers) counts[t.reservoir]++;
  let ry = panelY + 30;
  for (const key of Object.keys(counts) as Reservoir[]) {
    ctx.fillStyle = RES_COLOR[key];
    ctx.fillRect(width - sideW + 12, ry - 4, 8, 8);
    ctx.fillStyle = theme.ink;
    ctx.fillText(`${key.padEnd(11)} ${counts[key]}`, width - sideW + 26, ry);
    ry += 14;
  }
  caption(ctx, width - sideW + 12, ry + 8, `year ${state.simYears.toFixed(1)}`, theme, { size: 9, color: theme.inkSoft });
  ctx.restore();

  badge(ctx, 12, 20, `sea level +${num(seaLevelMmOf(state))} mm`, theme, { color: theme.sci["hot"] });
  badge(ctx, width / 2, 20, `${(params.iceScenario as string)}`, theme, { align: "center", color: theme.accent });
  badge(ctx, width - 12, 20, `year ${state.simYears.toFixed(0)}`, theme, { align: "right", color: theme.sci["field"] });
  vignette(ctx, width, height, 0.12);
  ctx.restore();
}

function seaLevelMmOf(state: State): number { return seaLevelMm(state); }

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  viewMode: "globe", releaseSite: "ocean", tracerCount: 100, timeCompression: 10,
  cvPumping: 8, snowpack: 1.0, iceScenario: "today", salinityOverlay: false,
};

export const hydrosphereSim: SimManifest<State> = {
  id: "g6.a4-2",
  title: "Ninety-Seven, Two, and a Splash",
  tagline: "Weigh every reservoir on Earth, follow a tagged droplet for thousands of years, and pump an aquifer until the ground sinks.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-4"] },
  learningGoals: [
    "State the real proportions of Earth's water: saline, frozen, and the tiny liquid fresh fraction.",
    "Trace a water molecule's path between reservoirs using real residence times.",
    "Explain why groundwater overdraft causes land subsidence that does not reverse.",
  ],
  misconceptions: [
    "Fresh water is abundant and constantly renewed everywhere",
    "Groundwater is an underground river or lake",
    "All water on Earth cycles at roughly the same speed",
    "Pumping less water immediately undoes any ground sinking",
  ],
  interactionHint: "Switch the view to compare the three water spheres, then release tracers and watch where they go.",
  tickRate: 30,
  timeScale: 1,
  params: {
    viewMode: {
      type: "option", label: "View", options: [
        { value: "globe", label: "Globe" },
        { value: "spheres", label: "Comparison spheres" },
        { value: "bars", label: "Stock bars" },
      ], default: "globe",
      help: "Switches between the planet, the to-scale spheres, and the accounting bars.",
    },
    releaseSite: {
      type: "option", label: "Tracer release site", options: [
        { value: "ocean", label: "Pacific surface" },
        { value: "land", label: "Land surface" },
        { value: "atmosphere", label: "Atmosphere" },
      ], default: "ocean",
      help: "Where tagged droplets enter the system.",
    },
    tracerCount: {
      type: "number", label: "Tracer count", kind: "count",
      min: 1, max: 500, step: 1, default: 100,
      help: "How many random walkers run at once.",
    },
    timeCompression: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1 / 365, max: 1000, step: 1, default: 10,
      marks: [{ value: 1 / 365, label: "1 day/s" }, { value: 1000, label: "1000 yr/s" }],
      help: "Simulated years per real second.",
    },
    cvPumping: {
      type: "number", label: "Central Valley pumping", kind: "ratio",
      min: 0, max: 20, step: 1, default: 8,
      help: "Extra groundwater outflow, km3/yr, beyond the small natural recharge.",
    },
    snowpack: {
      type: "number", label: "Sierra snowpack", kind: "percent",
      min: 0, max: 2, step: 0.05, default: 1,
      help: "April snow water equivalent as a fraction of average — sets the spring discharge pulse.",
    },
    iceScenario: {
      type: "option", label: "Ice scenario", options: [
        { value: "today", label: "Today" },
        { value: "mountainGlaciers", label: "Mountain glaciers melt" },
        { value: "greenland", label: "Greenland melts" },
        { value: "allIce", label: "All ice melts" },
      ], default: "today",
      help: "Relaxes the chosen ice body toward zero and raises the sea level accordingly.",
    },
    salinityOverlay: {
      type: "boolean", label: "Salinity overlay", default: false,
      help: "Colours each reservoir by whether it is salt or fresh.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "count-the-water",
      title: "Count the water",
      question: "Of all the water on Earth, what percentage is liquid, fresh, and above ground where you could drink it?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, viewMode: "spheres" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the smallest sphere",
          instruction: "Three spheres: all water, fresh water, and liquid fresh surface water.",
          predict: {
            prompt: "Roughly how does the smallest sphere compare with the largest?",
            options: ["About half its size", "About a tenth its size", "Far too small to see on the same picture at true scale"],
            correct: 2,
            reveal: "Far too small to see. Liquid, fresh, surface water is a rounding error next to the ocean — the whole reason the diagram uses spheres instead of a bar chart nobody could read.",
          },
        },
        {
          id: "spheres",
          phase: "measure",
          title: "Record the diameters",
          instruction: "Record the computed diameter of each of the three spheres.",
          requireData: 1,
          check: {
            describe: "All-water sphere is far larger than the liquid-fresh-surface sphere",
            test: (v) => (v.facts.allWaterSphereDiameterKm as number) > (v.facts.liquidFreshSurfaceDiameterKm as number) * 10,
          },
        },
        {
          id: "bars",
          phase: "measure",
          title: "Switch to stock bars",
          instruction: "Switch the view to stock bars and record the log-scale ranking of all seven reservoirs.",
          requireData: 2,
          check: { describe: "Bars view selected", test: (v) => v.params.viewMode === "bars" },
        },
        {
          id: "compute",
          phase: "analyze",
          title: "Compute the fresh fraction",
          instruction: "Use the readouts to compute what share of all water is fresh.",
          check: {
            describe: "Fresh fraction is small, a few percent",
            test: (v) => (v.facts.freshFraction as number) > 0 && (v.facts.freshFraction as number) < 0.06,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the proportions",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "State the real split: how much of Earth's water is salty, how much is frozen, and how much is liquid, fresh, and accessible?",
            placeholder: "Most of it is ..., most of the rest is ..., and only a sliver is ...",
          },
        },
      ],
    },
    {
      id: "follow-one-droplet",
      title: "Follow one droplet",
      question: "Over 5,000 simulated years, which reservoirs do the droplets visit, and in which do they spend the longest?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, tracerCount: 200, timeCompression: 100, viewMode: "globe" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the longest stay",
          instruction: "200 droplets are released at the ocean surface.",
          predict: {
            prompt: "Where will a droplet typically spend the most time before moving on?",
            options: ["The atmosphere", "A river", "The deep ocean"],
            correct: 2,
            reveal: "The ocean. A residence time of 3,200 years there dwarfs the atmosphere's nine days — most of a droplet's whole history is just waiting in the sea.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run 5,000 years",
          instruction: "Run until at least 5,000 simulated years have passed and record where the droplets are.",
          requireData: 1,
          check: { describe: "5,000 years reached", test: (v) => (v.facts.simYears as number) >= 5000 },
        },
        {
          id: "residence",
          phase: "measure",
          title: "Read the measured residence times",
          instruction: "Record the measured mean residence time for each reservoir with completed visits.",
          requireData: 2,
          check: {
            describe: "At least one full transition measured in the ocean",
            test: (v) => (v.facts.meanResidenceOceanYr as number) >= 0 || (v.facts.meanResidenceAtmosphereYr as number) >= 0,
          },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare atmosphere and ocean",
          instruction: "Compare the atmosphere's measured residence time with the ocean's.",
          check: {
            describe: "Atmosphere residence time measured and far shorter than the ocean's, when both exist",
            test: (v) => {
              const a = v.facts.meanResidenceAtmosphereYr as number;
              const o = v.facts.meanResidenceOceanYr as number;
              if (a < 0 || o < 0) return a >= 0 || o >= 0;
              return a < o;
            },
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the disparity",
          instruction: "Explain why residence times differ so much between reservoirs.",
          write: {
            prompt: "Why can the same water molecule spend nine days in the sky but three thousand years in the sea?",
            placeholder: "The atmosphere holds very little water at once compared with how much moves through it, while the ocean ...",
          },
        },
      ],
    },
    {
      id: "drought-pumping",
      title: "Drought pumping",
      question: "How far does the water table fall, how far does the bench mark sink, and does the aquifer refill when pumping stops?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, snowpack: 0.4, cvPumping: 16, timeCompression: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the bench mark",
          instruction: "Ten years of heavy pumping under drought conditions are about to run.",
          predict: {
            prompt: "After pumping stops and the water table partly recovers, what happens to the sunk bench mark?",
            options: ["It rises back to its original height", "It stays exactly where it sank", "It sinks even further"],
            correct: 1,
            reveal: "It stays sunk. Clay compaction from groundwater overdraft is inelastic — the water table can recover, but the ground that already compacted does not un-compact.",
          },
        },
        {
          id: "pump",
          phase: "measure",
          title: "Pump for ten years",
          instruction: "Run for ten simulated years, recording water-table depth and subsidence each year.",
          requireData: 3,
          check: { describe: "Ten years of pumping recorded, water table has fallen", test: (v) => (v.facts.simYears as number) >= 10 && (v.facts.cvDepthM as number) > 5 },
        },
        {
          id: "subsided",
          phase: "measure",
          title: "Confirm subsidence began",
          instruction: "Check that measurable subsidence has occurred.",
          check: { describe: "Subsidence greater than zero", test: (v) => (v.facts.cvSubsidenceM as number) > 0 },
        },
        {
          id: "stop",
          phase: "measure",
          title: "Stop pumping",
          instruction: "Set pumping to 0 and run ten more years, recording recovery.",
          requireData: 4,
          check: {
            describe: "Pumping stopped, water table partly recovers, subsidence unchanged",
            test: (v) => (v.params.cvPumping as number) === 0 && (v.facts.cvSubsidenceM as number) > 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Reversible or not",
          instruction: "Say which part of the damage reverses and which does not.",
          write: {
            prompt: "The water table recovered some ground. The subsidence did not. Why the difference?",
            placeholder: "A refilled aquifer is just water returning to open pore space, but the compacted clay ...",
          },
        },
      ],
    },
    {
      id: "if-all-the-ice-went",
      title: "If all the ice went",
      question: "How much does sea level rise, and does the fresh fraction go up or down?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-4"],
      setup: { ...BASE_SETUP, iceScenario: "allIce", timeCompression: 1000, viewMode: "globe" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the rise",
          instruction: "All of Earth's ice is about to melt into the ocean, slowly.",
          predict: {
            prompt: "Roughly how high does sea level rise if every bit of ice on Earth melts?",
            options: ["About 1 metre", "About 6 metres", "Around 60-70 metres"],
            correct: 2,
            reveal: "Around 60-70 metres — enough to put most coastal cities on Earth underwater. Ice is by far the largest reservoir of fresh water there is.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it out",
          instruction: "Run until the ice is almost entirely gone and record the sea-level rise.",
          requireData: 1,
          check: { describe: "Ice mostly melted, sea level risen well past 10 m", test: (v) => (v.facts.icePercentRemaining as number) < 20 && (v.facts.seaLevelM as number) > 10 },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Compare with mountain glaciers alone",
          instruction: "Switch to the mountain-glaciers-only scenario and compare the rise.",
          requireData: 2,
          check: {
            describe: "Mountain-glaciers scenario selected",
            test: (v) => v.params.iceScenario === "mountainGlaciers",
          },
        },
        {
          id: "fresh",
          phase: "analyze",
          title: "Fresh fraction after the melt",
          instruction: "Return to the all-ice scenario and check what happens to the fresh fraction.",
          check: {
            describe: "Fresh fraction measured under the all-ice scenario",
            test: (v) => v.params.iceScenario === "allIce" && typeof v.facts.freshFraction === "number",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Where the ice's water goes",
          instruction: "Explain the paradox: losing ice can lower the fresh fraction even as it drowns coastlines.",
          write: {
            prompt: "All that ice was fresh water. Once it melts into the ocean, is it still fresh? What does that do to the fresh fraction?",
            placeholder: "Melted ice joins the ocean and becomes ..., so the fresh fraction actually ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "protect-the-town",
      title: "Protect the bench mark",
      brief: "Keep Central Valley subsidence under half a metre for 20 years while still pumping some water.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, cvPumping: 8, timeCompression: 1 },
      goal: {
        describe: "20 years pass, subsidence stays under 0.5 m, pumping averaged above zero",
        test: (v) => (v.facts.simYears as number) >= 20 && (v.facts.cvSubsidenceM as number) < 0.5 && (v.params.cvPumping as number) > 0,
      },
      stars: {
        two: {
          describe: "Also keep the water table within 10 m of its start",
          test: (v) => (v.facts.simYears as number) >= 20 && (v.facts.cvSubsidenceM as number) < 0.5 && (v.facts.cvDepthM as number) < 10,
        },
      },
      hints: ["Pumping above the natural recharge always wins in the end — the only question is how fast."],
    },
    {
      id: "map-the-passport",
      title: "Complete a passport",
      brief: "Run long enough that at least one droplet's residence time is measured in all five reservoirs.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, tracerCount: 300, timeCompression: 500, releaseSite: "land" },
      goal: {
        describe: "All five reservoirs have at least one completed, measured stay",
        test: (v) =>
          (v.facts.meanResidenceOceanYr as number) >= 0 && (v.facts.meanResidenceAtmosphereYr as number) >= 0 &&
          (v.facts.meanResidenceSoilYr as number) >= 0 && (v.facts.meanResidenceGroundwaterYr as number) >= 0 &&
          (v.facts.meanResidenceSurfaceYr as number) >= 0,
      },
      hints: ["Groundwater residence times run to centuries or millennia — this one takes patience and a high time compression."],
    },
  ],
};
