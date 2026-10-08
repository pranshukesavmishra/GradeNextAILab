import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { badge, caption, hexA, isDarkTheme, material, sky, vignette } from "@ui/scene";

/**
 * Weathering, Erosion and Deposition — Grades 6-12.
 *
 * A landscape the student can wear down and watch rebuild somewhere else.
 * Nothing here is drawn in advance: the canyon is cut by a stream-power law,
 * the delta is built out of exactly the sediment the canyon lost, the valley
 * takes a V or a U depending on whether water or ice is doing the work, and
 * the soil sits at the thickness where production balances removal.
 *
 * The laws are the ones geomorphologists actually use:
 *   · soil production  P = P0·exp(−h/h0), with P0 ≈ 0.08 mm/yr and h0 ≈ 0.5 m
 *     (Heimsath et al. 1997) — which is why soil gets thicker up to a point
 *     and then stops;
 *   · river incision   E = K·A^0.5·S (detachment-limited stream power), so a
 *     river cuts fastest where it is steep and where it drains a lot of land;
 *   · glacial erosion  E ∝ ice sliding speed, roughly ten times faster than a
 *     river, and spread across the whole valley floor instead of a channel —
 *     which is the whole reason glaciated valleys are U-shaped;
 *   · hillslope creep  q = D·S/(1 − (S/Sc)²) (Roering et al. 1999), which has a
 *     built-in threshold: past Sc the slope fails, and that failure is a
 *     landslide — a fast process in a sim otherwise full of slow ones.
 *
 * Chemical weathering carries rock away *in solution*, so it lowers the land
 * without making any sediment. Physical weathering only breaks rock up. That
 * distinction is the difference between a limestone cave and a scree slope.
 */

/* ------------------------------------------------------------------ *
 * Grid
 * ------------------------------------------------------------------ */

const NX = 160;
/** Long profile: 40 km from the drainage divide to 10 km offshore. */
const DOMAIN_KM = 40;
const DX_KM = DOMAIN_KM / NX;
const DX_M = DX_KM * 1000;
const COAST_KM = 30;
const DIVIDE_HEIGHT_M = 2200;

/**
 * Valley cross-section: 6 km rim to rim. Wide enough that walls standing at
 * the critical angle can hold a canyon deeper than the Grand Canyon's 1,800 m.
 */
const CN = 61;
const CROSS_WIDTH_M = 6000;
const CDX_M = CROSS_WIDTH_M / (CN - 1);
/** Where along the long profile the cross-section is taken. */
const CROSS_STATION_KM = 14;
const CROSS_INDEX = Math.round(CROSS_STATION_KM / DX_KM);

/**
 * Critical gradient for a bedrock valley wall. tan(63°) ≈ 2.0 — soil-mantled
 * hillslopes fail nearer 1.2, but the walls of a rock canyon or a glacial
 * trough stand far steeper, which is why Yosemite's walls are nearly vertical.
 */
const S_CRIT = 2.0;
/** Hillslope transport coefficient, m²/yr — the middle of the measured range. */
const D_HILL = 0.004;
/**
 * Stream-power erodibility, calibrated so that a granite channel draining
 * ~45 km² at a 8% gradient lowers about 0.2 mm a year — the rate the Colorado
 * River has averaged through the Grand Canyon.
 */
const K_STREAM = 4e-4;
/** Transport coefficient: how much the flow can still carry, m²/yr. */
const K_TRANSPORT = 60;
/** Crustal strength caps mountains near 9 km; Everest reaches 8,849 m. */
const MAX_ELEVATION_M = 9000;
/** Mean interval between slope failures somewhere in an active valley, yr. */
const SLIDE_INTERVAL_YR = 2000;
/**
 * Deepest canyon the model will cut, m. Stands in for base level: a river can
 * only cut down to the sea. For scale, the Grand Canyon is 1,857 m deep and
 * the Yarlung Tsangpo — the deepest on Earth — is about 5,000 m.
 */
const MAX_CANYON_M = 3000;

/** Sub-step size so a million-year jump stays numerically honest. */
const MAX_SUBSTEP_YR = 4000;
const MAX_SUBSTEPS = 8;

function xKm(i: number): number {
  return (i + 0.5) * DX_KM;
}

/**
 * Drainage area at distance x downstream, km². Hack's law with an exponent of
 * 1.7 — the empirical relation between basin length and area.
 */
function drainageArea(km: number): number {
  return 0.5 * Math.pow(Math.max(km, 0.05), 1.7);
}

/* ------------------------------------------------------------------ *
 * Material properties
 * ------------------------------------------------------------------ */

interface RockProps {
  label: string;
  /** River erodibility, relative to granite. */
  erodibility: number;
  /** Susceptibility to dissolving in weak acid. Limestone is the outlier. */
  chemical: number;
  /** Susceptibility to being cracked apart. */
  physical: number;
}

const ROCK: Record<string, RockProps> = {
  // Limestone dissolves in the carbonic acid of ordinary rain: karst denudation
  // runs at 20-100 mm per thousand years, an order above granite.
  granite: { label: "Granite", erodibility: 1.0, chemical: 1.0, physical: 0.7 },
  sandstone: { label: "Sandstone", erodibility: 2.0, chemical: 1.2, physical: 1.5 },
  limestone: { label: "Limestone", erodibility: 1.6, chemical: 4.0, physical: 1.0 },
};

interface ClimateProps {
  label: string;
  /** How hard this climate cracks rock apart. Freeze-thaw is the champion. */
  physicalFactor: number;
  /** How hard this climate dissolves rock. Needs warmth and water. */
  chemicalFactor: number;
  /** How much loose material the wind can pick up. */
  dryness: number;
  /** Soil lost to slope wash, m/yr. Bare desert slopes keep almost nothing. */
  wash: number;
}

const CLIMATE: Record<string, ClimateProps> = {
  warmwet: { label: "Warm and wet", physicalFactor: 0.5, chemicalFactor: 1.6, dryness: 0.15, wash: 5e-6 },
  freezethaw: { label: "Freeze-thaw", physicalFactor: 2.0, chemicalFactor: 0.3, dryness: 0.3, wash: 8e-6 },
  arid: { label: "Hot and dry", physicalFactor: 0.8, chemicalFactor: 0.15, dryness: 1.0, wash: 2.5e-5 },
};

/**
 * Physical weathering on bare granite, m/yr — the soil production rate Heimsath
 * et al. measured with cosmogenic nuclides: about 0.08 mm a year.
 */
const PHYS_BASE = 8e-5;
/**
 * Chemical denudation of granite in a temperate climate, m/yr. Limestone runs
 * about four times faster, which puts karst near 100 mm per thousand years —
 * the top of the measured range.
 */
const CHEM_BASE = 1.5e-5;
const SOIL_EFOLD_M = 0.5;

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** Bedrock surface, m above sea level. */
  h: number[];
  /** Loose soil produced in place along the channel, m. */
  soil: number[];
  /**
   * Soil on the hillslope above the channel, m. Kept separately because the
   * channel is scoured bare while the slope beside it holds a real profile.
   */
  hillSoil: number;
  /** Sediment carried in and dropped, m. */
  fill: number[];
  /** The landscape as it started, for the ghost line and incision depth. */
  h0: number[];
  /** Valley cross-section at CROSS_STATION_KM, m. */
  cross: number[];
  cross0: number[];
  years: number;
  /** Volumes per metre of valley width, m³/m. */
  eroded: number;
  deposited: number;
  dissolved: number;
  inTransit: number;
  physicalTotalM: number;
  chemicalTotalM: number;
  landslides: number;
  lastSlideYear: number;
  slideFlash: number;
  slideX: number;
  peakIncisionM: number;
  deltaFrontKm: number;
}

function initialProfile(): { h: number[]; cross: number[] } {
  const h = new Array<number>(NX);
  for (let i = 0; i < NX; i++) {
    const km = xKm(i);
    if (km <= COAST_KM) {
      // A concave long profile — steep at the head, gentle at the mouth —
      // which is the shape a graded river actually settles into.
      h[i] = DIVIDE_HEIGHT_M * Math.pow(1 - km / COAST_KM, 1.6);
    } else {
      // The continental shelf, deepening offshore to about 450 m.
      h[i] = -25 * Math.pow(km - COAST_KM, 1.25);
    }
  }
  const cross = new Array<number>(CN);
  for (let j = 0; j < CN; j++) {
    // A shallow initial swale, so the agent has somewhere to start working.
    const off = Math.abs(j - (CN - 1) / 2) * CDX_M;
    cross[j] = 120 * (off / (CROSS_WIDTH_M / 2));
  }
  return { h, cross };
}

function makeState(): State {
  const { h, cross } = initialProfile();
  return {
    h,
    soil: new Array<number>(NX).fill(0.15),
    hillSoil: 0.15,
    fill: new Array<number>(NX).fill(0),
    h0: h.slice(),
    cross,
    cross0: cross.slice(),
    years: 0,
    eroded: 0,
    deposited: 0,
    dissolved: 0,
    inTransit: 0,
    physicalTotalM: 0,
    chemicalTotalM: 0,
    landslides: 0,
    lastSlideYear: -1,
    slideFlash: 0,
    slideX: 0,
    peakIncisionM: 0,
    deltaFrontKm: COAST_KM,
  };
}

/** Ground surface: bedrock, plus soil, plus anything dropped on top. */
export function surfaceOf(s: State, i: number): number {
  return s.h[i] + s.soil[i] + s.fill[i];
}

/** How deep the landscape has been cut below where it started, m. */
export function incisionAt(s: State, i: number): number {
  return s.h0[i] - surfaceOf(s, i);
}

/** Rim-to-river depth of the valley, m — how a canyon's depth is really quoted. */
export function canyonDepth(cross: number[]): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const z of cross) { if (z < lo) lo = z; if (z > hi) hi = z; }
  return hi - lo;
}

/**
 * Valley shape as a single number: of the rectangle bounding the valley from
 * rim to floor, how much has been excavated?
 *
 * A straight-sided V fills exactly half of it, so the answer is 0.50 whatever
 * the depth. A glacial U has a flat floor as well as steep walls, so it runs
 * to 0.7 and above. Measuring only inside the valley's own width keeps the
 * number independent of how much untouched ground surrounds it.
 */
export function valleyFullness(cross: number[]): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const z of cross) { if (z < lo) lo = z; if (z > hi) hi = z; }
  const depth = hi - lo;
  if (depth < 1) return 0.5;
  let sum = 0;
  let inside = 0;
  for (const z of cross) {
    const d = (hi - z) / depth;
    if (d <= 0.05) continue;         // rim: outside the valley itself
    sum += d;
    inside++;
  }
  return inside > 0 ? sum / inside : 0.5;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

type Params = Record<string, number | boolean | string>;

interface Setup {
  rock: RockProps;
  climate: ClimateProps;
  agent: string;
  discharge: number;
  upliftMPerYr: number;
}

function setupOf(params: Params): Setup {
  return {
    rock: ROCK[params.rock as string] ?? ROCK.granite,
    climate: CLIMATE[params.climate as string] ?? CLIMATE.warmwet,
    agent: params.agent as string,
    discharge: params.discharge as number,
    upliftMPerYr: (params.uplift as number) / 1000,
  };
}

/**
 * Weathering rates in metres per year, split into its two kinds.
 *
 * Physical weathering slows as soil builds up, because the soil is a blanket
 * that keeps frost and temperature swings off the bedrock. Chemical weathering
 * does not: water still percolates through, so dissolution carries on.
 */
export function weatheringRates(
  setup: Setup, soilM: number,
): { physical: number; chemical: number } {
  const physical = PHYS_BASE * Math.exp(-soilM / SOIL_EFOLD_M)
    * setup.climate.physicalFactor * setup.rock.physical;
  const chemical = CHEM_BASE * setup.climate.chemicalFactor * setup.rock.chemical;
  return { physical, chemical };
}

/** Erosion rate of the active agent at column i, metres per year. */
function agentErosion(s: State, i: number, setup: Setup, slope: number): number {
  const km = xKm(i);
  if (km > COAST_KM) return 0;
  const area = drainageArea(km);
  switch (setup.agent) {
    case "water":
      // Detachment-limited stream power: E = K·A^0.5·S.
      return K_STREAM * setup.rock.erodibility * setup.discharge
        * Math.sqrt(area) * Math.max(0, slope);
    case "ice": {
      // Ice only reaches so far down the valley before it melts.
      const glacierEndKm = 6 + 8 * setup.discharge;
      if (km > glacierEndKm) return 0;
      // Sliding at ~40 m/yr erodes about 2 mm/yr — ten times a river's rate.
      return 5e-5 * (40 * setup.discharge) * setup.rock.erodibility;
    }
    case "wind":
      // Wind moves loose grains, and almost nothing else.
      return 3e-5 * setup.discharge * setup.climate.dryness
        * (s.soil[i] + s.fill[i] > 0.02 ? 1 : 0.12);
    default:
      return 0;
  }
}

/** One numerically safe slice of time. */
function substep(state: State, dtYr: number, setup: Setup, rng: { next(): number }): State {
  const h = state.h.slice();
  const soil = state.soil.slice();
  const fill = state.fill.slice();
  let eroded = state.eroded;
  let deposited = state.deposited;
  let dissolved = state.dissolved;
  let physicalTotalM = state.physicalTotalM;
  let chemicalTotalM = state.chemicalTotalM;
  let landslides = state.landslides;
  let lastSlideYear = state.lastSlideYear;
  let slideFlash = Math.max(0, state.slideFlash - dtYr / 400);
  let slideX = state.slideX;
  const years = state.years + dtYr;

  /* --- uplift: the land is being pushed up while it wears down ---- */
  if (setup.upliftMPerYr > 0) {
    for (let i = 0; i < NX; i++) {
      if (xKm(i) > COAST_KM) continue;
      const lift = setup.upliftMPerYr * dtYr * (1 - xKm(i) / COAST_KM);
      h[i] = Math.min(MAX_ELEVATION_M, h[i] + lift);
    }
  }

  /* --- weathering: one kind makes sediment, the other makes none -- */
  for (let i = 0; i < NX; i++) {
    if (xKm(i) > COAST_KM) continue;
    const rates = weatheringRates(setup, soil[i]);
    const phys = Math.min(rates.physical * dtYr, 4);
    const chem = Math.min(rates.chemical * dtYr, 4);
    // Physical weathering turns bedrock into soil: the mass stays put.
    h[i] -= phys;
    soil[i] += phys;
    // Chemical weathering dissolves the rock and the ions leave in the water,
    // so the land gets lower and no sediment is made at all.
    h[i] -= chem;
    dissolved += chem * DX_M;
    physicalTotalM += phys / NX;
    chemicalTotalM += chem / NX;
  }

  /* --- the hillslope soil profile, which reaches a real steady state */
  let hillSoil = state.hillSoil;
  {
    const rates = weatheringRates(setup, hillSoil);
    const wash = setup.climate.wash * setup.discharge
      * (setup.agent === "wind" ? 3 * setup.climate.dryness : 1)
      * (setup.agent === "ice" ? 6 : 1);
    hillSoil = Math.max(0, hillSoil + (rates.physical - wash) * dtYr);
  }

  /* --- erosion and deposition, marching downstream ---------------- */
  // The river starts each pass with clear water at the divide; whatever it is
  // still carrying at the far end of the shelf is dropped there, so the books
  // always balance: everything eroded is somewhere downstream.
  let flux = 0;                                   // m³ per metre of width
  for (let i = 0; i < NX; i++) {
    const km = xKm(i);
    const here = h[i] + soil[i] + fill[i];
    const next = i + 1 < NX ? h[i + 1] + soil[i + 1] + fill[i + 1] : here - 1;
    const slope = Math.max(0, (here - next) / DX_M);

    if (km > COAST_KM || here <= 0) {
      // Below sea level the flow stops and drops what it carries — but only
      // until this spot is filled to just above the waterline. Then the next
      // one downstream takes over, and the delta walks out to sea.
      const room = Math.max(0, 2 - here);
      const drop = Math.min(flux, room * DX_M);
      fill[i] += drop / DX_M;
      deposited += drop;
      flux -= drop;
      continue;
    }

    const rate = agentErosion(state, i, setup, slope);
    // Transport capacity: how much the flow can still carry past this point.
    const capacity = setup.agent === "none"
      ? 0
      : K_TRANSPORT * setup.discharge * Math.sqrt(drainageArea(km)) * slope * dtYr;

    if (flux > capacity) {
      const drop = Math.min(flux - capacity, 60 * DX_M);
      fill[i] += drop / DX_M;
      deposited += drop;
      flux -= drop;
    } else {
      let cut = Math.min(rate * dtYr, 25);
      // Loose material goes first; bedrock only yields once it is exposed.
      const fromFill = Math.min(fill[i], cut);
      fill[i] -= fromFill;
      cut -= fromFill;
      const fromSoil = Math.min(soil[i], cut);
      soil[i] -= fromSoil;
      cut -= fromSoil;
      h[i] -= cut;
      const moved = (fromFill + fromSoil + cut) * DX_M;
      eroded += moved;
      flux += moved;
    }
  }
  if (flux > 0) {
    // The abyssal plain takes the remainder. Nothing is allowed to vanish.
    fill[NX - 1] += flux / DX_M;
    deposited += flux;
    flux = 0;
  }

  /* --- hillslope transport, with a real failure threshold --------- */
  const cross = state.cross.slice();
  const diffuse = (z: number[], dx: number, cap: number) => {
    const flux2 = new Array<number>(z.length - 1);
    for (let i = 0; i < z.length - 1; i++) {
      const s = (z[i] - z[i + 1]) / dx;
      const ratio = Math.min(0.97, Math.abs(s) / S_CRIT);
      flux2[i] = (D_HILL * s) / (1 - ratio * ratio);
    }
    for (let i = 1; i < z.length - 1; i++) {
      const dz = ((flux2[i] - flux2[i - 1]) / dx) * dtYr;
      z[i] += Math.max(-cap, Math.min(cap, dz));
    }
  };
  diffuse(h, DX_M, 6);

  /* --- the valley cross-section ----------------------------------- */
  // A section across the channel at one station, drawn to show the valley's
  // shape. It is a picture of that one place, not part of the 1-D sediment
  // budget above, which is why its material does not enter the mass balance.
  {
    const centre = (CN - 1) / 2;
    const stationSlope = Math.max(
      0.004,
      (h[CROSS_INDEX] - h[Math.min(NX - 1, CROSS_INDEX + 1)]) / DX_M,
    );
    const rates = weatheringRates(setup, soil[CROSS_INDEX]);
    // The plateau either side of the canyon is lowered too — by weathering,
    // not by the channel. The canyon only deepens by the difference.
    const rimDrop = (rates.chemical + rates.physical * 0.3) * dtYr;
    const channelCut = canyonDepth(cross) < MAX_CANYON_M
      ? Math.min(30, agentErosion(state, CROSS_INDEX, setup, stationSlope) * dtYr)
      : 0;

    for (let j = 0; j < CN; j++) {
      const off = Math.abs(j - centre) * CDX_M;
      let share: number;
      if (setup.agent === "ice") {
        // Ice fills the valley wall to wall, so it lowers the whole floor at
        // once: the U-shaped trough every glacier leaves behind. 1.6 km across
        // the floor is Yosemite Valley's width.
        const iceHalfWidth = 800;
        share = off <= iceHalfWidth ? 1 : Math.exp(-(off - iceHalfWidth) / 70);
      } else if (setup.agent === "wind") {
        share = 0.4 + 0.6 * Math.exp(-off / 900);
      } else {
        // A river cuts a narrow slot; the walls only follow by collapsing.
        share = Math.exp(-off / 60);
      }
      cross[j] -= rimDrop + channelCut * share;
    }

    /* --- landslides: the fast process ---------------------------- */
    // No wall can stand steeper than S_CRIT. Walking outward from the deepest
    // point, anything standing too high above its inner neighbour comes down —
    // in seconds, not eons — and the river carries the debris away.
    let deepest = 0;
    for (let j = 1; j < CN; j++) if (cross[j] < cross[deepest]) deepest = j;
    const maxRise = S_CRIT * CDX_M;
    let failed = 0;
    let failedAt = 0;
    for (let j = deepest - 1; j >= 0; j--) {
      const capped = Math.min(cross[j], cross[j + 1] + maxRise);
      if (cross[j] - capped > failed) { failed = cross[j] - capped; failedAt = j / (CN - 1); }
      cross[j] = capped;
    }
    for (let j = deepest + 1; j < CN; j++) {
      const capped = Math.min(cross[j], cross[j - 1] + maxRise);
      if (cross[j] - capped > failed) { failed = cross[j] - capped; failedAt = j / (CN - 1); }
      cross[j] = capped;
    }

    // One collapse event per slice, however many nodes had to come down, plus
    // the background rate of ordinary slope failures. The timing is random; the
    // long-run rate — roughly one failure every two thousand years in an active
    // valley — is not.
    const background = Math.floor(dtYr / SLIDE_INTERVAL_YR + rng.next());
    const events = (failed > 1 ? 1 : 0) + (setup.agent === "none" ? 0 : background);
    if (events > 0) {
      landslides += events;
      lastSlideYear = years;
      slideFlash = 1;
      slideX = failed > 1 ? failedAt : 0.2 + 0.6 * rng.next();
    }
  }

  /* --- bookkeeping ------------------------------------------------ */
  let peakIncisionM = state.peakIncisionM;
  for (let i = 0; i < NX; i++) {
    if (xKm(i) > COAST_KM) continue;
    const inc = state.h0[i] - (h[i] + soil[i] + fill[i]);
    if (inc > peakIncisionM) peakIncisionM = inc;
  }
  let deltaFrontKm = COAST_KM;
  for (let i = 0; i < NX; i++) {
    if (xKm(i) > COAST_KM && fill[i] > 1) deltaFrontKm = xKm(i);
  }

  return {
    ...state,
    h, soil, fill, cross, hillSoil,
    years,
    eroded, deposited, dissolved,
    inTransit: flux,
    physicalTotalM, chemicalTotalM,
    landslides, lastSlideYear, slideFlash, slideX,
    peakIncisionM, deltaFrontKm,
  };
}

const model: SimModel<State> = {
  init() {
    return makeState();
  },

  applyParams(state, params, prev) {
    // Changing the rock or the starting landscape is a new experiment.
    if (params.rock !== prev.rock) return makeState();
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const setup = setupOf(params);
    const yearsPerSecond = Number(params.timeRate as string);
    let remaining = dt * yearsPerSecond;
    let s = state;
    for (let n = 0; n < MAX_SUBSTEPS && remaining > 0; n++) {
      const slice = Math.min(remaining, Math.max(MAX_SUBSTEP_YR, remaining / MAX_SUBSTEPS));
      s = substep(s, slice, setup, ctx.rng);
      remaining -= slice;
    }
    return s;
  },

  readouts(state, params) {
    const setup = setupOf(params);
    const soilAt = state.hillSoil;
    // Rates on bare rock are the climate-and-rock signature a student should
    // compare; the in-place rate has already been throttled by its own soil.
    const bare = weatheringRates(setup, 0);
    return [
      {
        key: "canyon", label: "Canyon depth, rim to river",
        quantity: q(canyonDepth(state.cross), "length"), unit: "m",
        semantic: "distance", graphable: true,
      },
      {
        key: "incision", label: "Land lowered", quantity: q(state.peakIncisionM, "length"), unit: "m",
        semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "years", label: "Time elapsed",
        quantity: q(state.years * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false,
      },
      {
        key: "soil", label: "Soil thickness", quantity: q(soilAt, "length"), unit: "cm",
        semantic: "decomposer", graphable: true,
      },
      {
        key: "delta", label: "Delta reaches out",
        quantity: q((state.deltaFrontKm - COAST_KM) * 1000, "length"), unit: "km",
        semantic: "gas", graphable: true,
      },
      {
        key: "eroded", label: "Rock removed (m³ per m)", quantity: q(state.eroded, "ratio"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "deposited", label: "Sediment dropped (m³ per m)", quantity: q(state.deposited, "ratio"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "physical", label: "Physical weathering, bare rock (mm per 1000 yr)",
        quantity: q(bare.physical * 1e6, "ratio"),
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "chemical", label: "Chemical weathering, bare rock (mm per 1000 yr)",
        quantity: q(bare.chemical * 1e6, "ratio"),
        semantic: "acid", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "shape", label: "Valley fullness (0.5 = V, 0.7+ = U)",
        quantity: q(valleyFullness(state.cross), "ratio"),
        semantic: "distance", graphable: true, bands: ["9-12"],
      },
      {
        key: "landslides", label: "Landslides", quantity: q(state.landslides, "count"),
        semantic: "energy-kinetic", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const setup = setupOf(params);
    const soilAt = state.hillSoil;
    const rates = weatheringRates(setup, soilAt);
    const bare = weatheringRates(setup, 0);
    let relief = 0;
    let lowest = Infinity;
    for (let i = 0; i < NX; i++) {
      if (xKm(i) > COAST_KM) continue;
      const z = surfaceOf(state, i);
      if (z > relief) relief = z;
      if (z < lowest) lowest = z;
    }
    return {
      years: state.years,
      agent: setup.agent,
      rock: params.rock as string,
      climate: params.climate as string,
      incisionM: state.peakIncisionM,
      reliefM: relief - lowest,
      highestM: relief,
      soilM: soilAt,
      soilCm: soilAt * 100,
      horizonOCm: Math.min(8, soilAt * 100 * 0.06),
      horizonACm: soilAt * 100 * 0.24,
      horizonBCm: soilAt * 100 * 0.46,
      horizonCCm: soilAt * 100 * 0.24,
      physicalRateMmPerKyr: bare.physical * 1e6,
      chemicalRateMmPerKyr: bare.chemical * 1e6,
      physicalInPlaceMmPerKyr: rates.physical * 1e6,
      chemicalInPlaceMmPerKyr: rates.chemical * 1e6,
      chemicalDominant: bare.chemical > bare.physical,
      canyonDepthM: canyonDepth(state.cross),
      erodedM3: state.eroded,
      depositedM3: state.deposited,
      dissolvedM3: state.dissolved,
      inTransitM3: state.inTransit,
      physicalDenudationM: state.physicalTotalM,
      chemicalDenudationM: state.chemicalTotalM,
      // Everything eroded must still be somewhere downstream. Dissolved rock is
      // counted separately, because it left in solution and made no sediment.
      // This is mass conservation, and a test asserts on it.
      massBalance: state.eroded - (state.deposited + state.inTransit),
      deltaLengthKm: state.deltaFrontKm - COAST_KM,
      landslides: state.landslides,
      lastSlideYear: state.lastSlideYear,
      valleyFloorFraction: valleyFullness(state.cross),
      uShaped: valleyFullness(state.cross) > 0.62,
      timeRateYrPerSec: Number(params.timeRate as string),
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const setup = setupOf(params);
  const dark = isDarkTheme(theme);

  const mainH = band === "K-2" ? height : height * 0.68;
  let highest = DIVIDE_HEIGHT_M;
  for (let i = 0; i < NX; i++) {
    const z = surfaceOf(state, i);
    if (z > highest) highest = z;
  }
  const topM = highest * 1.14;
  const botM = -600;
  const toX = (km: number) => (km / DOMAIN_KM) * width;
  const toY = (m: number) => ((topM - m) / (topM - botM)) * mainH;
  const seaY = toY(0);

  /* --- the place --------------------------------------------------- */
  sky(ctx, width, mainH, theme, setup.agent === "ice" ? "dusk" : "day", seaY);

  // The sea, from the coast out.
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.65);
  ctx.fillRect(toX(COAST_KM) - 4, seaY, width - toX(COAST_KM) + 4, mainH - seaY);
  ctx.restore();

  /* --- the original land surface, as a ghost ----------------------- */
  if (overlays.before !== false) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.65);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let i = 0; i < NX; i++) {
      const px = toX(xKm(i));
      const py = toY(state.h0[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* --- bedrock ----------------------------------------------------- */
  const rockColor = params.rock === "limestone"
    ? theme.sci["base"]
    : params.rock === "sandstone" ? theme.sci["gas"] : theme.sci["mass"];
  const drawLayer = (
    heights: (i: number) => number, base: (i: number) => number, color: string, alpha: number,
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX(xKm(0)), toY(heights(0)));
    for (let i = 0; i < NX; i++) ctx.lineTo(toX(xKm(i)), toY(heights(i)));
    for (let i = NX - 1; i >= 0; i--) ctx.lineTo(toX(xKm(i)), toY(base(i)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawLayer((i) => state.h[i], () => botM, rockColor, 1);
  // Bedding planes give the rock a grain and make incision legible.
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#ffffff" : "#000000", 0.10);
  ctx.lineWidth = 1;
  for (let m = -300; m < DIVIDE_HEIGHT_M; m += 180) {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < NX; i++) {
      if (state.h[i] < m) { started = false; continue; }
      const px = toX(xKm(i));
      const py = toY(m);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  drawLayer((i) => state.h[i] + state.soil[i], (i) => state.h[i], theme.sci["decomposer"], 0.95);
  drawLayer(
    (i) => state.h[i] + state.soil[i] + state.fill[i],
    (i) => state.h[i] + state.soil[i],
    theme.sci["gas"], 0.95,
  );

  /* --- the agent doing the work ------------------------------------ */
  if (setup.agent === "water") {
    ctx.save();
    ctx.strokeStyle = theme.sci["liquid"];
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i < NX; i++) {
      const km = xKm(i);
      if (km > COAST_KM) break;
      const px = toX(km);
      const py = toY(surfaceOf(state, i)) - 2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  } else if (setup.agent === "ice") {
    const endKm = 6 + 8 * setup.discharge;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = theme.sci["cold"];
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(surfaceOf(state, 0)));
    for (let i = 0; i < NX; i++) {
      const km = xKm(i);
      if (km > endKm) break;
      ctx.lineTo(toX(km), toY(surfaceOf(state, i) + 260 * (1 - km / endKm)));
    }
    for (let i = Math.round(endKm / DX_KM); i >= 0; i--) {
      ctx.lineTo(toX(xKm(i)), toY(surfaceOf(state, i)));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    caption(ctx, toX(endKm * 0.45), toY(DIVIDE_HEIGHT_M * 0.75), "glacier", theme, {
      align: "center", size: 12, color: theme.sci["cold"], weight: 700,
    });
  } else if (setup.agent === "wind") {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["gas"], 0.55);
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 26; k++) {
      const i = Math.floor(((k * 37) % NX));
      const py = toY(surfaceOf(state, i)) - 8 - (k % 5) * 9;
      ctx.beginPath();
      ctx.moveTo(toX(xKm(i)) - 26, py);
      ctx.lineTo(toX(xKm(i)) + 26, py - 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- the delta, named ------------------------------------------- */
  if (state.deltaFrontKm > COAST_KM + 0.2 && band !== "K-2") {
    const dx = toX((COAST_KM + state.deltaFrontKm) / 2);
    caption(ctx, dx, seaY + 26, "delta", theme, {
      align: "center", size: 12, color: theme.sci["gas"], weight: 700,
    });
    badge(ctx, dx, seaY + 48, `${(state.deltaFrontKm - COAST_KM).toFixed(1)} km`, theme, {
      align: "center", color: theme.sci["gas"], sub: "built out",
    });
  }

  /* --- the deepest cut, marked where it is ------------------------- */
  let deepIndex = 0;
  let deepVal = 0;
  for (let i = 0; i < NX; i++) {
    if (xKm(i) > COAST_KM) break;
    const inc = incisionAt(state, i);
    if (inc > deepVal) { deepVal = inc; deepIndex = i; }
  }
  if (deepVal > 12 && band !== "K-2") {
    const px = toX(xKm(deepIndex));
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, toY(state.h0[deepIndex]));
    ctx.lineTo(px, toY(surfaceOf(state, deepIndex)));
    ctx.stroke();
    ctx.restore();
    badge(ctx, px, (toY(state.h0[deepIndex]) + toY(surfaceOf(state, deepIndex))) / 2,
      `${Math.round(deepVal)} m`, theme, { align: "center", sub: "cut down" });
  }

  /* --- sea level ---------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(toX(COAST_KM) - 30, seaY);
  ctx.lineTo(width, seaY);
  ctx.stroke();
  ctx.restore();

  if (band !== "K-2") {
    caption(ctx, 10, 18, `${ROCK[params.rock as string].label} · ${setup.climate.label}`, theme, {
      size: 12,
    });
    const yrs = state.years;
    const timeText = yrs >= 1e6 ? `${(yrs / 1e6).toFixed(2)} million years`
      : yrs >= 1000 ? `${(yrs / 1000).toFixed(1)} thousand years`
        : `${yrs.toFixed(0)} years`;
    caption(ctx, width - 10, 18, timeText, theme, {
      align: "right", size: 12, color: theme.accent, weight: 700,
    });
  }

  /* --- lower strip: valley cross-section and soil profile ---------- */
  if (band !== "K-2") {
    const stripY = mainH + 6;
    const stripH = height - stripY - 4;
    const panelW = Math.min(width * 0.52, width - 190);

    // Valley cross-section: V versus U, the whole point of the ice agent.
    ctx.save();
    ctx.globalAlpha = 0.9;
    material(ctx, 8, stripY, panelW, stripH, theme.surfaceAlt, 8);
    ctx.restore();
    let lo = Infinity;
    let hi = -Infinity;
    for (const z of state.cross) { if (z < lo) lo = z; if (z > hi) hi = z; }
    const span = Math.max(80, hi - lo);
    const cxTo = (j: number) => 16 + (j / (CN - 1)) * (panelW - 16);
    const cyTo = (z: number) => stripY + 24 + ((hi - z) / span) * (stripH - 36);
    ctx.save();
    ctx.fillStyle = rockColor;
    ctx.beginPath();
    ctx.moveTo(cxTo(0), cyTo(state.cross[0]));
    for (let j = 0; j < CN; j++) ctx.lineTo(cxTo(j), cyTo(state.cross[j]));
    ctx.lineTo(cxTo(CN - 1), stripY + stripH);
    ctx.lineTo(cxTo(0), stripY + stripH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (setup.agent === "ice") {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = theme.sci["cold"];
      ctx.beginPath();
      for (let j = 0; j < CN; j++) ctx.lineTo(cxTo(j), cyTo(state.cross[j]));
      for (let j = CN - 1; j >= 0; j--) ctx.lineTo(cxTo(j), cyTo(state.cross[j] + span * 0.35));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const ratio = valleyFullness(state.cross);
    caption(ctx, 16, stripY + 14,
      `Valley across the channel — ${ratio > 0.62 ? "U-shaped" : "V-shaped"}`, theme,
      { size: 11, color: theme.inkSoft });
    if (state.slideFlash > 0.05) {
      ctx.save();
      ctx.globalAlpha = state.slideFlash;
      ctx.fillStyle = theme.sci["force"];
      const sx = cxTo(state.slideX * (CN - 1));
      ctx.beginPath();
      ctx.arc(sx, cyTo(state.cross[Math.round(state.slideX * (CN - 1))]), 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      caption(ctx, sx, stripY + stripH - 8, "landslide!", theme, {
        align: "center", size: 11, color: theme.sci["force"], weight: 800,
      });
    }

    // Soil horizons: a real profile, in real centimetres.
    const soilX = panelW + 20;
    const soilW = width - soilX - 10;
    ctx.save();
    ctx.globalAlpha = 0.9;
    material(ctx, soilX, stripY, soilW, stripH, theme.surfaceAlt, 8);
    ctx.restore();
    const soilCm = state.hillSoil * 100;
    const horizons: [string, number, string][] = [
      ["O", Math.min(8, soilCm * 0.06), theme.sci["producer"]],
      ["A", soilCm * 0.24, theme.sci["decomposer"]],
      ["B", soilCm * 0.46, mixHex(theme.sci["decomposer"], theme.sci["gas"], 0.5)],
      ["C", soilCm * 0.24, theme.sci["mass"]],
    ];
    const totalCm = Math.max(20, horizons.reduce((a, b) => a + b[1], 0) + 12);
    let hy = stripY + 22;
    for (const [name, cm, color] of horizons) {
      const hh = (cm / totalCm) * (stripH - 34);
      if (hh > 0.5) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(soilX + 8, hy, soilW - 52, hh);
        ctx.restore();
        caption(ctx, soilX + soilW - 40, hy + hh / 2, `${name}  ${cm.toFixed(0)}cm`, theme, {
          size: 10, color: theme.inkSoft,
        });
      }
      hy += hh;
    }
    ctx.save();
    ctx.fillStyle = rockColor;
    ctx.fillRect(soilX + 8, hy, soilW - 52, Math.max(0, stripY + stripH - 6 - hy));
    ctx.restore();
    caption(ctx, soilX + soilW - 40, Math.min(stripY + stripH - 10, hy + 10), "R  bedrock", theme, {
      size: 10, color: theme.inkSoft,
    });
    caption(ctx, soilX + 8, stripY + 13, "Soil profile", theme, { size: 11, color: theme.inkSoft });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const erosionSim: SimManifest<State> = {
  id: "earth.erosion",
  title: "Weathering, Erosion and Deposition",
  tagline: "Break a landscape apart, carry it away, and find out where every grain ends up.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-ESS2-1", "MS-ESS2-2", "HS-ESS2-2", "HS-ESS2-5"] },
  learningGoals: [
    "Tell physical weathering apart from chemical weathering, and name what each one produces.",
    "Predict which agent — water, wind, ice or gravity — shapes a landscape fastest.",
    "Trace sediment from where it was eroded to where it is deposited.",
    "Explain why some geologic processes take seconds and others take millions of years.",
    "Read a soil profile as a record of weathering acting downward from the surface.",
  ],
  misconceptions: [
    "Weathering and erosion are the same thing",
    "Erosion destroys rock, so the material is gone",
    "All landscape change is too slow to see",
    "Rivers only carve; they never build",
    "Soil is just crushed rock, with no structure",
  ],
  interactionHint: "Choose an agent and a rock, set how fast time runs, and press play.",
  tickRate: 60,
  params: {
    agent: {
      type: "option", label: "Agent of erosion",
      options: [
        { value: "water", label: "Running water" },
        { value: "ice", label: "Glacier ice" },
        { value: "wind", label: "Wind" },
        { value: "gravity", label: "Gravity alone" },
        { value: "none", label: "None — weathering only" },
      ],
      default: "water",
      help: "Each agent moves material a different way, and leaves a different shape behind.",
    },
    rock: {
      type: "option", label: "Bedrock",
      options: [
        { value: "granite", label: "Granite — hard" },
        { value: "sandstone", label: "Sandstone — soft" },
        { value: "limestone", label: "Limestone — dissolves" },
      ],
      default: "granite",
      help: "Changing the bedrock rebuilds the landscape.",
    },
    climate: {
      type: "option", label: "Climate",
      options: [
        { value: "warmwet", label: "Warm and wet" },
        { value: "freezethaw", label: "Freezing and thawing" },
        { value: "arid", label: "Hot and dry" },
      ],
      default: "warmwet",
      bands: ["6-8", "9-12"],
      help: "Freeze-thaw cracks rock apart. Warm rain dissolves it instead.",
    },
    timeRate: {
      type: "option", label: "How fast time runs",
      options: [
        { value: "1", label: "1 year per second" },
        { value: "1000", label: "1 thousand years per second" },
        { value: "100000", label: "100 thousand years per second" },
        { value: "1000000", label: "1 million years per second" },
      ],
      default: "100000",
      help: "A landslide takes seconds. A canyon takes millions of years. Both are here.",
    },
    discharge: {
      type: "number", label: "How much water, wind or ice", kind: "ratio",
      min: 0.2, max: 3, step: 0.1, default: 1,
      help: "More flow means more power to cut and more sediment to carry.",
    },
    uplift: {
      type: "number", label: "Uplift (mm per year)", kind: "ratio",
      min: 0, max: 4, step: 0.1, default: 0,
      bands: ["9-12"],
      marks: [
        { value: 0.3, label: "Appalachians" },
        { value: 1, label: "Sierra Nevada" },
        { value: 4, label: "Himalaya" },
      ],
      help: "Mountains grow and wear down at the same time. Which one is winning?",
    },
  },
  overlays: [
    { key: "before", label: "Original land surface", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "where-does-it-go",
      title: "Where does the canyon go?",
      question: "A river carves a canyon out of solid rock. Where does all that rock end up?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-2"],
      setup: { agent: "water", rock: "sandstone", climate: "warmwet", timeRate: "100000", discharge: 1.5, uplift: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The river is about to cut hundreds of metres down. Commit to an answer.",
          predict: {
            prompt: "Where does the rock removed from the canyon end up?",
            options: [
              "It is destroyed — erosion wears rock out of existence",
              "It piles up right beside the canyon",
              "It is carried downstream and dropped where the water slows",
              "It dissolves completely into the water",
            ],
            correct: 2,
            reveal:
              "Erosion never destroys anything. The water carries the pieces until it slows down — usually at the coast — and drops them. That pile is a delta, and it is made of the canyon.",
          },
        },
        {
          id: "cut",
          phase: "measure",
          title: "Cut the canyon",
          instruction: "Run until the deepest cut passes 200 m. Record the rock removed and the delta length.",
          requireData: 3,
          check: {
            describe: "A canyon at least 200 m deep",
            test: (v) => (v.facts.canyonDepthM as number) >= 200,
          },
          hints: [
            "Softer rock cuts faster — sandstone erodes about twice as fast as granite.",
            "More water means more power. Try turning the flow up.",
          ],
        },
        {
          id: "balance",
          phase: "analyze",
          title: "Check the books",
          instruction: "Compare 'Rock removed' with 'Sediment dropped'. They should nearly match.",
          write: {
            prompt: "How close are the two numbers, and where is the rest of the material right now?",
            placeholder: "Removed was ... dropped was ... the difference is ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say what erosion does to matter, in one sentence.",
          write: {
            prompt: "Complete: erosion does not destroy rock, it ...",
            placeholder: "Erosion moves ...",
          },
        },
      ],
    },
    {
      id: "v-or-u",
      title: "V-shaped or U-shaped?",
      question: "Why do glacier valleys and river valleys have such different shapes?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-2"],
      setup: { agent: "water", rock: "granite", climate: "freezethaw", timeRate: "100000", discharge: 1.2, uplift: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Look at the valley panel at the bottom of the stage.",
          predict: {
            prompt: "A glacier fills a whole valley. A river runs in a narrow channel. Which valley ends up with a wide flat floor?",
            options: [
              "The river valley — water spreads out",
              "The glacier valley — ice grinds the whole floor at once",
              "Both end up identical",
            ],
            correct: 1,
            reveal:
              "A river only cuts where the channel is, so the walls have to collapse inward: that makes a V. Ice touches the valley wall to wall, so it lowers the entire floor at once and leaves a U.",
          },
        },
        {
          id: "river",
          phase: "measure",
          title: "Run the river first",
          instruction: "Run water for a while and record the valley floor width fraction.",
          requireData: 1,
          check: {
            describe: "Water has cut the valley",
            test: (v) => (v.facts.canyonDepthM as number) >= 200,
          },
        },
        {
          id: "glacier",
          phase: "measure",
          title: "Now send in the ice",
          instruction: "Switch the agent to glacier ice and run again. Record the width fraction.",
          requireData: 2,
          check: { describe: "The valley floor is now wide", test: (v) => v.facts.uShaped === true },
          hints: ["Glacial erosion is roughly ten times faster than a river's. It will not take long."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the shapes",
          instruction: "Use the word 'contact' in your answer.",
          write: {
            prompt: "Why does ice leave a U and water leave a V?",
            placeholder: "Ice touches ... but water only touches ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "grand-canyon",
      title: "Cut a Grand Canyon",
      brief: "Cut 1,800 m down — the depth of the real Grand Canyon.",
      bands: ["6-8", "9-12"],
      setup: { agent: "water", rock: "sandstone", climate: "warmwet", timeRate: "1000000", discharge: 2, uplift: 1 },
      goal: {
        describe: "A canyon at least 1,800 m deep, rim to river",
        test: (v) => (v.facts.canyonDepthM as number) >= 1800,
      },
      stars: {
        two: {
          describe: "Do it within 12 million years",
          test: (v) => (v.facts.canyonDepthM as number) >= 1800 && (v.facts.years as number) <= 12e6,
        },
        three: {
          describe: "Do it within 6 million years, like the real river",
          test: (v) => (v.facts.canyonDepthM as number) >= 1800 && (v.facts.years as number) <= 6e6,
        },
      },
      hints: [
        "The real Colorado River did this in about 6 million years — roughly 0.3 mm a year.",
        "Uplift keeps raising the rock into the river, which keeps the slope steep.",
      ],
    },
    {
      id: "dissolve-it",
      title: "Make a landscape dissolve",
      brief: "Get chemical weathering to beat physical weathering by a wide margin.",
      bands: ["6-8", "9-12"],
      setup: { agent: "none", rock: "limestone", climate: "warmwet", timeRate: "100000", discharge: 1, uplift: 0 },
      goal: {
        describe: "Chemical weathering more than twice the physical rate",
        test: (v) =>
          (v.facts.chemicalRateMmPerKyr as number) > 2 * (v.facts.physicalRateMmPerKyr as number),
      },
      stars: {
        two: {
          describe: "Get the chemical rate above 80 mm per thousand years",
          test: (v) => (v.facts.chemicalRateMmPerKyr as number) > 80,
        },
      },
      hints: [
        "Which rock fizzes in acid? Rain is naturally slightly acidic.",
        "Dissolving needs water. A freezing climate cracks rock instead.",
      ],
    },
  ],
};
