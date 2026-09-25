import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, label, roundRect } from "@ui/draw";
import {
  badge, caption, comet, glow, groundPlane, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Water Cycle — Grades 3-10.
 *
 * A landscape that never stops moving: the sea evaporates, cloud forms, rain
 * falls, streams run, water soaks in, trees breathe it back out. On top of
 * that, one single molecule the student can follow all the way round.
 *
 * Two things make this more than an animated poster.
 *
 * First, the reservoirs are real. Volumes are the standard Shiklomanov/USGS
 * inventory in km³, and every percentage on screen is computed from them, so
 * they add to 100 by construction and the ocean really is 96.5% of it. The
 * fresh liquid water a person could drink is 0.007% of the planet's water, and
 * that number lands very differently when a student computes it.
 *
 * Second, the two drivers are real controls, not labels. Evaporation is driven
 * by the Sun, so turning the Sun down turns the whole cycle down. Precipitation
 * is driven by gravity, and it is modelled as a reservoir emptying with a
 * residence time — atmospheric store divided by flux. Turn gravity down and
 * water piles up in the atmosphere exactly as the residence time says it must.
 * Global mean residence in the atmosphere works out at 9.7 days from those
 * numbers, which is what the textbooks say, because it is the same arithmetic.
 */

/* ------------------------------------------------------------------ *
 * Earth's water inventory
 * ------------------------------------------------------------------ */

export interface Reservoir {
  key: string;
  label: string;
  /** Volume in cubic kilometres (Shiklomanov 1993, as published by the USGS). */
  volumeKm3: number;
  /** Fresh, salty, or frozen — for the "water you could drink" argument. */
  kind: "salt" | "frozen" | "fresh";
  /** Typical residence time in years, order of magnitude. */
  residenceYears: number;
}

export const RESERVOIRS: Reservoir[] = [
  { key: "ocean", label: "Oceans and seas", volumeKm3: 1_338_000_000, kind: "salt", residenceYears: 3200 },
  { key: "ice", label: "Ice caps and glaciers", volumeKm3: 24_064_000, kind: "frozen", residenceYears: 20_000 },
  { key: "groundwater", label: "Groundwater", volumeKm3: 23_400_000, kind: "fresh", residenceYears: 1400 },
  { key: "permafrost", label: "Ground ice and permafrost", volumeKm3: 300_000, kind: "frozen", residenceYears: 10_000 },
  { key: "lakesFresh", label: "Fresh lakes", volumeKm3: 91_000, kind: "fresh", residenceYears: 17 },
  { key: "lakesSalt", label: "Salt lakes", volumeKm3: 85_400, kind: "salt", residenceYears: 17 },
  { key: "soil", label: "Soil moisture", volumeKm3: 16_500, kind: "fresh", residenceYears: 0.14 },
  { key: "atmosphere", label: "Atmosphere", volumeKm3: 12_900, kind: "fresh", residenceYears: 0.0265 },
  { key: "swamps", label: "Swamps and wetlands", volumeKm3: 11_470, kind: "fresh", residenceYears: 5 },
  { key: "rivers", label: "Rivers", volumeKm3: 2_120, kind: "fresh", residenceYears: 0.053 },
  { key: "life", label: "Water inside living things", volumeKm3: 1_120, kind: "fresh", residenceYears: 0.02 },
];

export const TOTAL_WATER_KM3 = RESERVOIRS.reduce((s, r) => s + r.volumeKm3, 0);

/** Share of all of Earth's water held in one reservoir, as a percentage. */
export function reservoirPercent(key: string): number {
  const r = RESERVOIRS.find((x) => x.key === key);
  return r ? (r.volumeKm3 / TOTAL_WATER_KM3) * 100 : 0;
}

/** Percentage of all Earth's water that is fresh and liquid at the surface. */
export function freshSurfacePercent(): number {
  return ["lakesFresh", "rivers", "swamps"].reduce((s, k) => s + reservoirPercent(k), 0);
}

/* ------------------------------------------------------------------ *
 * Global fluxes, km³ per year
 * ------------------------------------------------------------------ */

/** Evaporation from the ocean surface. */
export const OCEAN_EVAP = 413_000;
/** Precipitation falling on the ocean. */
export const OCEAN_PRECIP = 373_000;
/** Evaporation plus transpiration from the land. */
export const LAND_ET = 73_000;
/** Precipitation falling on land. */
export const LAND_PRECIP = 113_000;
/** Rivers and groundwater returning to the sea. This closes the budget. */
export const RUNOFF = 40_000;

export const TOTAL_EVAP = OCEAN_EVAP + LAND_ET;      // 486,000
export const TOTAL_PRECIP = OCEAN_PRECIP + LAND_PRECIP; // 486,000

/** Fraction of all precipitation that lands on the ocean, not on land. */
export const PRECIP_OCEAN_SHARE = OCEAN_PRECIP / TOTAL_PRECIP;

/**
 * Residence time is reservoir volume divided by the flux through it. Doing it
 * this way rather than quoting a number means the sim cannot drift away from
 * its own inventory.
 */
export function residenceYears(volumeKm3: number, fluxKm3PerYear: number): number {
  return fluxKm3PerYear > 0 ? volumeKm3 / fluxKm3PerYear : Infinity;
}

/** ~9.7 days. */
export const ATMOSPHERE_RESIDENCE_YEARS = residenceYears(12_900, TOTAL_PRECIP);
/** ~3,240 years. */
export const OCEAN_RESIDENCE_YEARS = residenceYears(1_338_000_000, OCEAN_EVAP);
/** ~19 days. */
export const RIVER_RESIDENCE_YEARS = residenceYears(2_120, RUNOFF);

const DAYS_PER_YEAR = 365.25;

/* ------------------------------------------------------------------ *
 * The molecule's journey
 * ------------------------------------------------------------------ */

export type Stage =
  | "ocean" | "vapour" | "cloud" | "rain" | "runoff" | "river"
  | "soil" | "groundwater" | "plant" | "snow";

export const STAGE_LABEL: Record<Stage, string> = {
  ocean: "In the ocean",
  vapour: "Evaporating",
  cloud: "Condensed in cloud",
  rain: "Falling as rain",
  runoff: "Running off the surface",
  river: "In a river",
  soil: "Soaking into the soil",
  groundwater: "Deep groundwater",
  plant: "Inside a plant",
  snow: "Frozen as snow and ice",
};

/** The process name for the step that ends each stage — the word D1.2-D1.4 wants. */
export const STAGE_PROCESS: Record<Stage, string> = {
  ocean: "evaporation",
  vapour: "condensation",
  cloud: "precipitation",
  rain: "landing",
  runoff: "collection",
  river: "return to the sea",
  soil: "infiltration",
  groundwater: "discharge",
  plant: "transpiration",
  snow: "melting",
};

/**
 * Seconds of animation per stage. These are NOT residence times — no student
 * will sit through 3,200 years in the ocean. The real residence time is shown
 * as a number beside the molecule; this table only sets the pace, and it keeps
 * the ordering (groundwater slow, rain fast) so the ranking still reads true.
 */
const DWELL: Record<Stage, number> = {
  ocean: 5, vapour: 2.4, cloud: 2.6, rain: 1.6, runoff: 1.8,
  river: 2.4, soil: 2.6, groundwater: 5, plant: 2.4, snow: 5.5,
};

/* ------------------------------------------------------------------ *
 * Landscape geometry, in normalised stage coordinates
 * ------------------------------------------------------------------ */

const SHORE_X = 0.42;
const SEA_Y = 0.63;
const CLOUD_Y = 0.16;

/** Height of the ground at a horizontal position. Sea to the left, peaks right. */
export function terrainY(x: number): number {
  if (x <= SHORE_X) return SEA_Y;
  const f = (x - SHORE_X) / (1 - SHORE_X);
  return SEA_Y - 0.44 * Math.pow(f, 1.35);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface Molecule {
  stage: Stage;
  x: number; y: number;
  fromX: number; fromY: number;
  toX: number; toY: number;
  /** Seconds spent in this stage so far. */
  age: number;
  /** Seconds this stage will last. */
  dwell: number;
}

interface State {
  /** Simulated years since the run started. */
  years: number;
  /** Water currently held in the atmosphere, km³. */
  atmosphereKm3: number;
  /** Cumulative precipitation, km³. */
  precipitated: number;
  mol: Molecule;
  trail: { x: number; y: number }[];
  visited: Stage[];
  cycles: number;
  lastEvap: number;
  lastPrecip: number;
}

type Params = Record<string, number | boolean | string>;

const MAX_TRAIL = 260;

function pickLanding(rng: { next(): number }): number {
  // 76.7% of the world's precipitation falls on the ocean. That share is not a
  // guess: it is 373,000 of the 486,000 km³ that falls every year.
  return rng.next() < PRECIP_OCEAN_SHARE
    ? 0.04 + rng.next() * (SHORE_X - 0.08)
    : SHORE_X + 0.04 + rng.next() * (0.94 - SHORE_X);
}

/** Where the molecule is heading, and what it becomes when it gets there. */
function nextStage(
  stage: Stage, x: number, params: Params, rng: { next(): number },
): { stage: Stage; toX: number; toY: number } {
  const veg = params.vegetation as number;
  switch (stage) {
    case "ocean":
      return { stage: "vapour", toX: x + (rng.next() - 0.5) * 0.1, toY: CLOUD_Y + 0.07 };
    case "vapour":
      return { stage: "cloud", toX: Math.min(0.94, x + 0.06 + rng.next() * 0.3), toY: CLOUD_Y };
    case "cloud": {
      const landX = pickLanding(rng);
      return { stage: "rain", toX: landX, toY: terrainY(landX) };
    }
    case "rain": {
      if (x <= SHORE_X) return { stage: "ocean", toX: x, toY: SEA_Y + 0.06 + rng.next() * 0.16 };
      // High ground and cold: some of it stays as snow.
      if (x > 0.82 && rng.next() < 0.55) return { stage: "snow", toX: x, toY: terrainY(x) - 0.01 };
      if (rng.next() < 0.35) return { stage: "runoff", toX: x - 0.08, toY: terrainY(x - 0.08) };
      return { stage: "soil", toX: x, toY: terrainY(x) + 0.05 };
    }
    case "runoff": {
      const nx = Math.max(SHORE_X + 0.02, x - 0.14);
      return { stage: "river", toX: nx, toY: terrainY(nx) };
    }
    case "river":
      return { stage: "ocean", toX: SHORE_X - 0.05, toY: SEA_Y + 0.08 };
    case "soil": {
      if (rng.next() < transpirationShare(veg)) {
        return { stage: "plant", toX: x, toY: terrainY(x) - 0.045 };
      }
      return { stage: "groundwater", toX: x - 0.05, toY: terrainY(x) + 0.14 };
    }
    case "groundwater": {
      const nx = Math.max(SHORE_X - 0.02, x - 0.16);
      return nx <= SHORE_X
        ? { stage: "ocean", toX: SHORE_X - 0.06, toY: SEA_Y + 0.12 }
        : { stage: "groundwater", toX: nx, toY: terrainY(nx) + 0.16 };
    }
    case "plant":
      return { stage: "vapour", toX: x, toY: CLOUD_Y + 0.08 };
    case "snow": {
      const nx = Math.max(SHORE_X + 0.03, x - 0.12);
      return { stage: "runoff", toX: nx, toY: terrainY(nx) };
    }
  }
}

function startMolecule(): Molecule {
  return {
    stage: "ocean", x: 0.18, y: SEA_Y + 0.12,
    fromX: 0.18, fromY: SEA_Y + 0.12, toX: 0.24, toY: SEA_Y + 0.16,
    age: 0, dwell: DWELL.ocean,
  };
}

/** Evaporation depends on how much sunlight there is: no Sun, no cycle. */
export function evaporationFlux(sunPower: number): number {
  return TOTAL_EVAP * Math.max(0, sunPower);
}

/**
 * The share of soil water that leaves through plants rather than seeping down
 * to groundwater. Two thirds of land evapotranspiration is transpiration, and
 * more vegetation moves that share further still. The molecule's soil branch
 * and the transpiration flux readout both draw on this one number.
 */
export function transpirationShare(vegetation: number): number {
  return 0.35 + vegetation * 0.4;
}

/**
 * Precipitation as a reservoir emptying: flux = store / residence time, with
 * gravity setting how fast the store can empty. At sunPower = gravity = 1 this
 * balances exactly at the real 486,000 km³/yr and the real 12,900 km³ store.
 */
export function precipitationFlux(atmosphereKm3: number, gravity: number): number {
  if (gravity <= 0) return 0;
  return atmosphereKm3 / (ATMOSPHERE_RESIDENCE_YEARS / gravity);
}

const model: SimModel<State> = {
  init() {
    return {
      years: 0,
      atmosphereKm3: 12_900,
      precipitated: 0,
      mol: startMolecule(),
      trail: [],
      visited: ["ocean"],
      cycles: 0,
      lastEvap: TOTAL_EVAP,
      lastPrecip: TOTAL_PRECIP,
    };
  },

  step(state, dt, params, ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown" || (input.type === "action" && input.action === "launch")) {
        s = { ...s, mol: startMolecule(), trail: [], visited: ["ocean"] };
      }
    }
    if (dt <= 0) return s;

    const speed = params.speed as number;
    const sun = params.sunPower as number;
    const gravity = params.gravity as number;
    const simDt = dt * speed;

    /* --- the global reservoir budget -------------------------------- */
    // One animated second stands for one simulated week, which keeps the
    // atmospheric store visibly responding without racing off screen.
    const years = simDt / 52;
    const evap = evaporationFlux(sun);
    const precip = precipitationFlux(s.atmosphereKm3, gravity);
    const atmosphereKm3 = Math.max(0, s.atmosphereKm3 + (evap - precip) * years);

    /* --- the one molecule ------------------------------------------- */
    const m = s.mol;
    // The drivers govern the molecule too: without sunlight it cannot leave the
    // sea, and without gravity it cannot come back down.
    const driver =
      m.stage === "ocean" || m.stage === "plant" ? Math.max(0, sun)
        : m.stage === "rain" || m.stage === "runoff" || m.stage === "river" ? Math.max(0, gravity)
          : m.stage === "cloud" ? Math.max(0, gravity)
            : 1;
    const age = m.age + simDt * driver;
    const f = m.dwell > 0 ? Math.min(1, age / m.dwell) : 1;
    const ease = f * f * (3 - 2 * f);
    let mol: Molecule = {
      ...m,
      age,
      x: m.fromX + (m.toX - m.fromX) * ease,
      y: m.fromY + (m.toY - m.fromY) * ease,
    };

    let visited = s.visited;
    let cycles = s.cycles;
    if (age >= m.dwell) {
      const rng = ctx.rng;
      const nxt = nextStage(m.stage, mol.x, params, rng);
      if (nxt.stage === "ocean" && m.stage !== "ocean") cycles += 1;
      if (!visited.includes(nxt.stage)) visited = [...visited, nxt.stage];
      mol = {
        stage: nxt.stage,
        x: mol.x, y: mol.y,
        fromX: mol.x, fromY: mol.y,
        toX: Math.max(0.02, Math.min(0.96, nxt.toX)),
        toY: Math.max(0.04, Math.min(0.96, nxt.toY)),
        age: 0,
        dwell: DWELL[nxt.stage],
      };
    }

    const trail = s.trail.length >= MAX_TRAIL ? s.trail.slice(1) : s.trail.slice();
    trail.push({ x: mol.x, y: mol.y });

    return {
      years: s.years + years,
      atmosphereKm3,
      precipitated: s.precipitated + precip * years,
      mol, trail, visited, cycles,
      lastEvap: evap,
      lastPrecip: precip,
    };
  },

  readouts(state, params) {
    const gravity = params.gravity as number;
    const tau = gravity > 0 ? ATMOSPHERE_RESIDENCE_YEARS / gravity : Infinity;
    return [
      {
        key: "evaporation", label: "Evaporation (thousand km³/yr)",
        quantity: q(state.lastEvap / 1000, "ratio"),
        semantic: "light", graphable: true,
      },
      {
        key: "precipitation", label: "Precipitation (thousand km³/yr)",
        quantity: q(state.lastPrecip / 1000, "ratio"),
        semantic: "liquid", graphable: true,
      },
      {
        key: "transpiration", label: "Transpiration (thousand km³/yr)",
        quantity: q(
          (LAND_ET * transpirationShare(params.vegetation as number)
            * Math.max(0, params.sunPower as number)) / 1000,
          "ratio",
        ),
        semantic: "producer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "atmStore", label: "Water in the air (km³)",
        quantity: q(state.atmosphereKm3, "ratio"),
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "residence", label: "Days a drop stays in the air",
        quantity: q(Number.isFinite(tau) ? tau * DAYS_PER_YEAR * 86400 : 0, "time"), unit: "d",
        semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "cycles", label: "Trips round the cycle",
        quantity: q(state.cycles, "count"),
        semantic: "field", graphable: true,
      },
      {
        key: "stages", label: "Stages visited",
        quantity: q(state.visited.length, "count"),
        semantic: "producer", graphable: false,
      },
      {
        key: "oceanShare", label: "Ocean's share of Earth's water",
        quantity: q(reservoirPercent("ocean") / 100, "percent"), unit: "%",
        semantic: "liquid", graphable: false, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "drinkable", label: "Fresh surface water",
        quantity: q(freshSurfacePercent() / 100, "percent"), unit: "%",
        semantic: "acid", graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const gravity = params.gravity as number;
    const tau = gravity > 0 ? ATMOSPHERE_RESIDENCE_YEARS / gravity : Infinity;
    const sum = RESERVOIRS.reduce((s, r) => s + reservoirPercent(r.key), 0);
    const share = transpirationShare(params.vegetation as number);
    return {
      oceanPercent: reservoirPercent("ocean"),
      icePercent: reservoirPercent("ice") + reservoirPercent("permafrost"),
      groundwaterPercent: reservoirPercent("groundwater"),
      atmospherePercent: reservoirPercent("atmosphere"),
      freshSurfacePercent: freshSurfacePercent(),
      reservoirPercentSum: sum,
      totalWaterKm3: TOTAL_WATER_KM3,
      evaporation: state.lastEvap,
      precipitation: state.lastPrecip,
      transpiration: LAND_ET * share * Math.max(0, params.sunPower as number),
      transpirationShareOfSoil: share,
      atmosphereStoreKm3: state.atmosphereKm3,
      atmosphereResidenceDays: Number.isFinite(tau) ? tau * DAYS_PER_YEAR : 0,
      oceanResidenceYears: OCEAN_RESIDENCE_YEARS,
      riverResidenceDays: RIVER_RESIDENCE_YEARS * DAYS_PER_YEAR,
      cycleRate: state.lastEvap / TOTAL_EVAP,
      cycleStopped: state.lastEvap < 1,
      rainFalling: state.lastPrecip > 1,
      moleculeStage: state.mol.stage,
      moleculeProcess: STAGE_PROCESS[state.mol.stage],
      stagesVisited: state.visited.length,
      sawEvaporation: state.visited.includes("vapour"),
      sawCondensation: state.visited.includes("cloud"),
      sawPrecipitation: state.visited.includes("rain"),
      sawTranspiration: state.visited.includes("plant"),
      sawInfiltration: state.visited.includes("soil"),
      sawGroundwater: state.visited.includes("groundwater"),
      cycles: state.cycles,
      years: state.years,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

interface Frame { w: number; h: number; toX: (x: number) => number; toY: (y: number) => number }

function frameOf(width: number, height: number): Frame {
  return { w: width, h: height, toX: (x) => x * width, toY: (y) => y * height };
}

function drawLandscape(rc: RenderContext<State>, F: Frame) {
  const { ctx, theme, time, params } = rc;
  const sun = params.sunPower as number;
  const horizon = F.toY(SEA_Y);

  sky(ctx, F.w, F.h, theme, sun < 0.25 ? "dusk" : "day", horizon);

  /* --- the Sun: driver number one ---------------------------------- */
  const sx = F.toX(0.09), sy = F.toY(0.12);
  const power = Math.max(0.05, sun);
  glow(ctx, sx, sy, 40 + 44 * power, theme.sci["light"], 0.25 + 0.4 * Math.min(1, power));
  sphere(ctx, sx, sy, 10 + 8 * Math.min(1.4, power), theme.sci["light"], { glow: 0.6 * power });
  for (let i = 0; i < 8 && power > 0.05; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.2;
    const r0 = 22 + 8 * power;
    const r1 = r0 + 12 * power;
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["light"], 0.5 * Math.min(1, power));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
    ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
    ctx.stroke();
    ctx.restore();
  }

  /* --- ocean ------------------------------------------------------- */
  const shore = F.toX(SHORE_X);
  groundPlane(ctx, horizon, 0, shore + 4, F.h, theme, "water");
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.5);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const y = horizon + 6 + i * ((F.h - horizon) / 7);
    ctx.beginPath();
    for (let x = 0; x <= shore; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.045 + time * 1.5 + i * 0.8) * (1.5 + i * 0.4));
    }
    ctx.stroke();
  }
  ctx.restore();

  /* --- land, rising to the mountains ------------------------------- */
  ctx.save();
  const g = ctx.createLinearGradient(0, F.toY(terrainY(1)), 0, F.h);
  g.addColorStop(0, hexA(theme.sci["solid"], 0.95));
  g.addColorStop(0.45, hexA(theme.sci["solid"], 0.7));
  g.addColorStop(1, hexA(theme.sci["solid"], 0.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(shore, horizon + 2);
  for (let x = SHORE_X; x <= 1.0005; x += 0.01) ctx.lineTo(F.toX(x), F.toY(terrainY(x)));
  ctx.lineTo(F.w, F.h);
  ctx.lineTo(shore, F.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Snowline on the peaks — where the mountain reservoir actually lives.
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["cold"], 0.75);
  ctx.beginPath();
  ctx.moveTo(F.toX(0.86), F.toY(terrainY(0.86)));
  for (let x = 0.86; x <= 1.0005; x += 0.01) ctx.lineTo(F.toX(x), F.toY(terrainY(x)));
  ctx.lineTo(F.w, F.toY(terrainY(1)) + 26);
  ctx.lineTo(F.toX(0.86), F.toY(terrainY(0.86)) + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* --- trees, so transpiration has somewhere to come from ---------- */
  const veg = params.vegetation as number;
  const trees = Math.round(3 + veg * 9);
  for (let i = 0; i < trees; i++) {
    const tx = SHORE_X + 0.06 + (i / Math.max(1, trees - 1)) * 0.34;
    const px = F.toX(tx), py = F.toY(terrainY(tx));
    material(ctx, px - 1.5, py - 5, 3, 11, hexA(theme.sci["solid"], 0.95), 1);
    ctx.save();
    ctx.fillStyle = hexA(theme.sci["producer"], 0.92);
    ctx.beginPath();
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px + 7, py - 4);
    ctx.lineTo(px - 7, py - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* --- the aquifer, drawn because groundwater is invisible otherwise */
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = theme.sci["liquid"];
  ctx.beginPath();
  ctx.moveTo(shore, horizon + 10);
  for (let x = SHORE_X; x <= 1.0005; x += 0.02) ctx.lineTo(F.toX(x), F.toY(terrainY(x) + 0.13));
  ctx.lineTo(F.w, F.h);
  ctx.lineTo(shore, F.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Everything moving all the time: evaporation, cloud, rain, runoff. */
function drawFlows(rc: RenderContext<State>, F: Frame) {
  const { ctx, theme, time, params, state, band } = rc;
  const sun = Math.max(0, params.sunPower as number);
  const gravity = Math.max(0, params.gravity as number);
  const veg = params.vegetation as number;
  const cloudY = F.toY(CLOUD_Y);

  /* --- evaporation from the sea ------------------------------------ */
  const rising = Math.round(18 * Math.min(1.6, sun));
  for (let i = 0; i < rising; i++) {
    const x = F.toX(0.03 + ((i * 0.137) % 1) * (SHORE_X - 0.06));
    const f = ((time * 0.22 * sun + i / rising) % 1);
    const y = F.toY(SEA_Y) - f * (F.toY(SEA_Y) - cloudY - 8);
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - f * 0.6);
    sphere(ctx, x + Math.sin(f * 7 + i) * 5, y, 2.6, theme.sci["gas"], { rim: false });
    ctx.restore();
  }

  /* --- transpiration from the trees -------------------------------- */
  const trans = Math.round(9 * veg * Math.min(1.4, sun));
  for (let i = 0; i < trans; i++) {
    const tx = SHORE_X + 0.07 + ((i * 0.31) % 1) * 0.32;
    const f = ((time * 0.3 * sun + i / Math.max(1, trans)) % 1);
    const y0 = F.toY(terrainY(tx)) - 18;
    const y = y0 - f * (y0 - cloudY - 10);
    ctx.save();
    ctx.globalAlpha = 0.45 * (1 - f * 0.6);
    sphere(ctx, F.toX(tx) + Math.sin(f * 6 + i) * 4, y, 2.2, theme.sci["producer"], { rim: false });
    ctx.restore();
  }

  /* --- clouds ------------------------------------------------------- */
  const cloudMass = Math.min(1.7, state.atmosphereKm3 / 12_900);
  for (let c = 0; c < 4; c++) {
    const cx = F.toX(0.2 + c * 0.2) + Math.sin(time * 0.15 + c) * 16;
    const scale = (0.7 + 0.3 * Math.sin(c * 2.1)) * cloudMass;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.32 * Math.min(1, cloudMass);
    ctx.fillStyle = theme.sci["gas"];
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(cx + (k - 1.5) * 20 * scale, cloudY + Math.sin(k) * 5,
        26 * scale, 13 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* --- rain --------------------------------------------------------- */
  if (gravity > 0.02 && state.lastPrecip > 1) {
    const drops = Math.round(40 * Math.min(1.5, state.lastPrecip / TOTAL_PRECIP));
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["liquid"], 0.65);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < drops; i++) {
      const x = F.toX(0.08 + ((i * 0.211) % 1) * 0.82);
      const span = F.toY(terrainY(0.08 + ((i * 0.211) % 1))) - cloudY - 10;
      const y = cloudY + 12 + ((time * 340 * gravity + i * 37) % Math.max(20, span));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1.5, y + 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- the river running back to the sea ---------------------------- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.85);
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let x = 0.98; x >= SHORE_X; x -= 0.01) {
    ctx.lineTo(F.toX(x), F.toY(terrainY(x)) + 2 + Math.sin(x * 40 + time) * 2);
  }
  ctx.stroke();
  ctx.restore();

  /* --- groundwater creeping seaward --------------------------------- */
  if (band !== "K-2") {
    for (let i = 0; i < 4; i++) {
      const x = 0.55 + i * 0.1;
      arrow(ctx, F.toX(x + 0.03), F.toY(terrainY(x) + 0.16), F.toX(x - 0.02), F.toY(terrainY(x) + 0.17),
        hexA(theme.sci["liquid"], 0.7), { width: 1.6 });
    }
  }
}

/** The reservoir bar. Ocean is 96.5%, so the rest needs a magnified strip. */
function drawReservoirs(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, theme, band } = rc;
  const h = 14;
  const colorOf = (kind: Reservoir["kind"]) =>
    kind === "salt" ? theme.sci["liquid"] : kind === "frozen" ? theme.sci["cold"] : theme.sci["producer"];

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.82);
  roundRect(ctx, x - 6, y - 16, w + 12, h * 2 + 46, 6);
  ctx.fill();
  ctx.restore();

  caption(ctx, x, y - 6, "All of Earth's water", theme, { size: 11, weight: 700 });

  let cx = x;
  for (const r of RESERVOIRS) {
    const bw = (r.volumeKm3 / TOTAL_WATER_KM3) * w;
    ctx.save();
    ctx.fillStyle = colorOf(r.kind);
    ctx.fillRect(cx, y + 2, Math.max(0.5, bw), h);
    ctx.restore();
    cx += bw;
  }
  if (band !== "K-2") {
    label(ctx, `${reservoirPercent("ocean").toFixed(1)}% ocean`, x + 6, y + 2 + h / 2, theme, {
      size: 10, color: theme.surface, plate: false,
    });
  }

  // Magnify everything that is not ocean, or a student sees one blue bar.
  const rest = RESERVOIRS.filter((r) => r.key !== "ocean");
  const restTotal = rest.reduce((s, r) => s + r.volumeKm3, 0);
  caption(ctx, x, y + h + 14, "The other 3.5%, magnified", theme, { size: 10, color: theme.inkSoft });
  cx = x;
  for (const r of rest) {
    const bw = (r.volumeKm3 / restTotal) * w;
    ctx.save();
    ctx.fillStyle = colorOf(r.kind);
    ctx.fillRect(cx, y + h + 20, Math.max(0.5, bw), h);
    ctx.restore();
    cx += bw;
  }
  if (band !== "K-2") {
    label(ctx, `ice ${reservoirPercent("ice").toFixed(2)}%`, x + 4, y + h + 20 + h / 2, theme, {
      size: 9, color: theme.surface, plate: false,
    });
    label(
      ctx,
      `fresh surface water ${freshSurfacePercent().toFixed(3)}%`,
      x + w, y + h * 2 + 34, theme,
      { align: "right", size: 10, color: theme.inkSoft },
    );
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const F = frameOf(width, height);

  drawLandscape(rc, F);
  drawFlows(rc, F);

  /* --- the driver labels, because D1.5 is the point ---------------- */
  if (band !== "K-2") {
    const sun = params.sunPower as number;
    const gravity = params.gravity as number;
    caption(ctx, F.toX(0.09), F.toY(0.24), sun <= 0.02 ? "Sun off" : `Sun ×${sun.toFixed(1)}`, theme, {
      align: "center", size: 11, color: theme.sci["light"], weight: 700,
    });
    arrow(ctx, F.toX(0.32), F.toY(0.5), F.toX(0.32), F.toY(0.28),
      hexA(theme.sci["light"], 0.55 + 0.45 * Math.min(1, sun)), { width: 2.6 });
    caption(ctx, F.toX(0.30), F.toY(0.4), "sunlight lifts it", theme, {
      align: "right", size: 10, color: theme.sci["light"],
    });
    arrow(ctx, F.toX(0.66), F.toY(0.28), F.toX(0.66), F.toY(0.46),
      hexA(theme.sci["mass"], 0.5 + 0.5 * Math.min(1, gravity)), { width: 2.6 });
    caption(ctx, F.toX(0.68), F.toY(0.37), gravity <= 0.02 ? "gravity off" : "gravity brings it down", theme, {
      size: 10, color: theme.sci["mass"],
    });
  }

  /* --- the one molecule -------------------------------------------- */
  if (overlays.molecule !== false) {
    if (state.trail.length > 1) {
      comet(ctx, state.trail.map((p) => ({ x: F.toX(p.x), y: F.toY(p.y) })), theme.accent, 3.4);
    }
    const mx = F.toX(state.mol.x), my = F.toY(state.mol.y);
    glow(ctx, mx, my, 22, theme.accent, 0.55);
    sphere(ctx, mx, my, band === "K-2" ? 9 : 7, theme.accent, { glow: 0.6 });
    if (band !== "K-2") {
      badge(ctx, mx, my - 22, STAGE_LABEL[state.mol.stage], theme, {
        align: "center", color: theme.accent,
        sub: overlays.residence !== false ? STAGE_PROCESS[state.mol.stage] : undefined,
      });
    }
  }

  /* --- flux numbers, on the stage beside the flow they describe ----- */
  if (overlays.fluxes !== false && band !== "K-2") {
    badge(ctx, F.toX(0.2), F.toY(0.44), `${(state.lastEvap / 1000).toFixed(0)}k km³/yr`, theme, {
      align: "center", color: theme.sci["light"], sub: "evaporating",
    });
    badge(ctx, F.toX(0.72), F.toY(0.2), `${(state.lastPrecip / 1000).toFixed(0)}k km³/yr`, theme, {
      align: "center", color: theme.sci["liquid"], sub: "raining",
    });
  }

  /* --- residence times, real orders of magnitude -------------------- */
  if (overlays.residence !== false && band !== "K-2") {
    const gravity = params.gravity as number;
    const days = gravity > 0 ? (ATMOSPHERE_RESIDENCE_YEARS / gravity) * DAYS_PER_YEAR : Infinity;
    caption(ctx, width - 10, 18,
      Number.isFinite(days)
        ? `air ${days.toFixed(1)} d  ·  rivers ${(RIVER_RESIDENCE_YEARS * DAYS_PER_YEAR).toFixed(0)} d  ·  ocean ${OCEAN_RESIDENCE_YEARS.toFixed(0)} yr`
        : "nothing is leaving the air",
      theme, { align: "right", size: 11, color: theme.inkSoft });
  }

  if (overlays.reservoirs !== false) {
    drawReservoirs(rc, 12, height - 62, Math.min(width - 24, 420));
  }

  if ((params.sunPower as number) <= 0.02) {
    caption(ctx, width / 2, height * 0.3, "No sunlight — the cycle has stopped", theme, {
      align: "center", size: 15, color: theme.sci["cold"], weight: 800,
    });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const waterCycleSim: SimManifest<State> = {
  id: "earth.water-cycle",
  title: "The Water Cycle",
  tagline: "Follow one water molecule from the sea to a cloud to a river and back.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9],
  standards: { ngss: ["MS-ESS2-4", "5-ESS2-1", "MS-ESS2-1"] },
  learningGoals: [
    "Trace one water molecule through evaporation, condensation, precipitation, runoff and infiltration.",
    "Explain that the Sun supplies the energy and gravity supplies the return.",
    "State roughly how Earth's water is divided between ocean, ice and fresh liquid water.",
    "Use residence time to say how long water stays in the air, a river and the ocean.",
  ],
  misconceptions: [
    "Most of Earth's water is fresh water we could drink",
    "Water is used up when we use it",
    "Clouds are made of water vapour rather than condensed droplets",
    "The water cycle would keep going without the Sun",
    "Rain comes from a supply somewhere in the sky rather than from evaporated surface water",
  ],
  interactionHint: "Press play, then turn the Sun down and watch the whole cycle slow.",
  tickRate: 60,
  params: {
    sunPower: {
      type: "number", label: "Sunlight", kind: "ratio",
      min: 0, max: 2, step: 0.1, default: 1,
      marks: [{ value: 0, label: "Off" }, { value: 1, label: "Normal" }, { value: 2, label: "Double" }],
      help: "Evaporation runs on solar energy. Set this to zero and see what survives.",
    },
    gravity: {
      type: "number", label: "Gravity", kind: "ratio",
      min: 0, max: 1.5, step: 0.1, default: 1,
      marks: [{ value: 0, label: "Off" }, { value: 1, label: "Earth" }],
      help: "Gravity is what brings the water back down. Turn it off and water piles up in the air.",
      bands: ["3-5", "6-8", "9-12"],
    },
    vegetation: {
      type: "number", label: "Plant cover", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.6,
      help: "More plants means more transpiration — water going up through leaves.",
      bands: ["6-8", "9-12"],
    },
    speed: {
      type: "number", label: "Speed", kind: "ratio",
      min: 0.25, max: 4, step: 0.25, default: 1,
    },
  },
  overlays: [
    { key: "molecule", label: "Follow one molecule", default: true },
    { key: "reservoirs", label: "Where Earth's water is", default: true },
    { key: "fluxes", label: "Flow numbers", default: true, bands: ["6-8", "9-12"] },
    { key: "residence", label: "Residence times", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "follow-a-molecule",
      title: "Follow one molecule all the way round",
      question: "What path does a single water molecule take, and does it always take the same one?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-4"],
      setup: { sunPower: 1, gravity: 1, vegetation: 0.6, speed: 1.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you press play.",
          predict: {
            prompt: "After a molecule rains onto land, where is it most likely to go next?",
            options: [
              "Straight back into the air",
              "Into the soil, or running downhill to a river",
              "Frozen into a glacier",
            ],
            correct: 1,
            reveal:
              "Most rain that lands on soil soaks in or runs off. Only about a third of land precipitation reaches a river as runoff.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Watch a whole trip",
          instruction: "Follow the glowing molecule until it is back in the ocean. Record as you go.",
          requireData: 4,
          check: {
            describe: "At least one complete trip round the cycle",
            test: (v) => (v.facts.cycles as number) >= 1,
          },
          hints: [
            "The badge on the molecule names the stage it is in.",
            "Click the stage to send a fresh molecule off from the sea.",
          ],
        },
        {
          id: "again",
          phase: "measure",
          title: "Do it again",
          instruction: "Keep watching. Does the second trip follow exactly the same route?",
          check: {
            describe: "Two complete trips, having visited six different stages",
            test: (v) => (v.facts.cycles as number) >= 2 && (v.facts.stagesVisited as number) >= 6,
          },
          requireData: 8,
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name the processes",
          instruction: "List the processes your molecule went through, in order.",
          write: {
            prompt: "Write the route your molecule took, naming each process.",
            placeholder: "It started in the ocean, then evaporation carried it ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the cycle",
          instruction: "Say why the cycle has no start and no end.",
          write: {
            prompt: "Why is there no first step in the water cycle?",
            placeholder: "Every stage leads to another because ...",
          },
        },
      ],
    },
    {
      id: "two-drivers",
      title: "What keeps the cycle turning?",
      question: "Which does more work in the water cycle: the Sun, or gravity?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-4"],
      setup: { sunPower: 1, gravity: 1, vegetation: 0.6, speed: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you touch either slider.",
          predict: {
            prompt: "If you switched the Sun off, what would the water cycle do?",
            options: [
              "Keep going — gravity is enough",
              "Slow down but continue",
              "Stop, because nothing would evaporate",
            ],
            correct: 2,
            reveal:
              "It stops. Evaporation needs energy, and essentially all of it comes from the Sun. Gravity can only bring water down; it can never lift it.",
          },
        },
        {
          id: "sun-off",
          phase: "measure",
          title: "Turn the Sun off",
          instruction: "Set Sunlight to zero, run it, and record the evaporation rate.",
          check: {
            describe: "Sunlight off and evaporation stopped",
            test: (v) => (v.params.sunPower as number) <= 0.01 && Boolean(v.facts.cycleStopped),
          },
          requireData: 2,
        },
        {
          id: "sun-up",
          phase: "measure",
          title: "Now double it",
          instruction: "Put Sunlight to 2.0. Record evaporation and the water held in the air.",
          check: {
            describe: "Sunlight at double strength",
            test: (v) => (v.params.sunPower as number) >= 1.9,
          },
          requireData: 5,
          hints: ["A hotter world evaporates more, and holds more vapour in the air."],
        },
        {
          id: "gravity-off",
          phase: "measure",
          title: "Now turn gravity off",
          instruction: "Set Sunlight back to 1 and gravity to zero. Watch the air fill up.",
          check: {
            describe: "Gravity off while the Sun still shines",
            test: (v) => (v.params.gravity as number) <= 0.01 && (v.params.sunPower as number) > 0.5,
          },
          requireData: 8,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Give each driver its job",
          instruction: "Say what each driver does, and why one cannot replace the other.",
          write: {
            prompt: "What is the Sun's job in the water cycle, and what is gravity's?",
            placeholder: "The Sun supplies ... while gravity ... Neither one alone could ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "grand-tour",
      title: "The grand tour",
      brief: "Get one molecule through eight different stages of the cycle.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { sunPower: 1.2, gravity: 1, vegetation: 0.9, speed: 3 },
      goal: {
        describe: "Eight stages visited by the same molecule",
        test: (v) => (v.facts.stagesVisited as number) >= 8,
      },
      stars: {
        two: {
          describe: "Include transpiration through a plant",
          test: (v) => (v.facts.stagesVisited as number) >= 8 && Boolean(v.facts.sawTranspiration),
        },
        three: {
          describe: "Include deep groundwater as well",
          test: (v) =>
            (v.facts.stagesVisited as number) >= 8 &&
            Boolean(v.facts.sawTranspiration) && Boolean(v.facts.sawGroundwater),
        },
      },
      hints: [
        "More plant cover makes the transpiration route more likely.",
        "Turn the speed up and let it run; the route is different every time.",
      ],
    },
    {
      id: "stall-the-cycle",
      title: "Stall the cycle",
      brief: "Trap more than twice the normal amount of water in the atmosphere.",
      bands: ["6-8", "9-12"],
      setup: { sunPower: 1, gravity: 1, vegetation: 0.6, speed: 3 },
      goal: {
        describe: "More than 26,000 km³ of water held in the air",
        test: (v) => (v.facts.atmosphereStoreKm3 as number) > 26_000,
      },
      stars: {
        two: {
          describe: "Do it with the Sun no brighter than normal",
          test: (v) =>
            (v.facts.atmosphereStoreKm3 as number) > 26_000 && (v.params.sunPower as number) <= 1.05,
        },
      },
      hints: [
        "Water leaves the air at a rate of store divided by residence time.",
        "Make it harder for rain to fall, and the store has to grow.",
      ],
    },
  ],
};
