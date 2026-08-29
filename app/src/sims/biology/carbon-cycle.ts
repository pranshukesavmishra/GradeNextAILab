import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, comet, glow, groundPlane, hexA, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Follow One Carbon Atom — Grades 6-10.
 *
 * A single carbon atom is picked out of the air and followed: into a leaf by
 * photosynthesis, into sugar, into an animal that eats the plant, into that
 * animal's mitochondria, and back out into the air as carbon dioxide. It is
 * the same atom the whole way. Nothing is created and nothing is destroyed —
 * it is only rearranged into different molecules, which is the idea Grade 7
 * Unit C is built on.
 *
 * Underneath the story the sim keeps the global books in gigatonnes of carbon,
 * with the real reservoir sizes and fluxes:
 *   · atmosphere ≈ 875 GtC, vegetation ≈ 450, soils ≈ 1700, surface ocean ≈ 900
 *   · photosynthesis takes ≈ 123 GtC/yr out of the air; respiration puts ≈ 120 back
 *   · 1 ppm of atmospheric CO₂ is 2.13 GtC, so 875 GtC is about 411 ppm
 * The total never changes, whatever the student does. Burning fossil fuel only
 * moves carbon from one pool to another — and that is exactly the point.
 *
 * The second mode is van Helmont's willow, with his own numbers from 1648.
 */

/* ------------------------------------------------------------------ *
 * Chemistry
 * ------------------------------------------------------------------ */

/** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Atoms in equal atoms out. */
export const PHOTOSYNTHESIS = {
  reactants: { C: 6, H: 12, O: 18 },
  products: { C: 6, H: 12, O: 18 },
  text: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
};

/** C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy. The same equation, run backwards. */
export const RESPIRATION = {
  reactants: { C: 6, H: 12, O: 18 },
  products: { C: 6, H: 12, O: 18 },
  text: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy",
};

/** Relative atomic masses, for turning carbon into carbon dioxide. */
export const M_C = 12.011;
export const M_CO2 = 44.009;

/* ------------------------------------------------------------------ *
 * Van Helmont's willow, 1648 — his numbers, unaltered
 * ------------------------------------------------------------------ */

export const LB_KG = 0.45359237;
export const OZ_KG = LB_KG / 16;

/**
 * Jan Baptist van Helmont dried 200 pounds of earth, planted a five-pound
 * willow shoot in it, watered it with rain water alone for five years, and
 * weighed everything again. The tree had gained 164 pounds; the soil had lost
 * two ounces.
 */
export const VAN_HELMONT = {
  years: 5,
  soilStartLb: 200,
  treeStartLb: 5,
  treeEndLb: 169 + 3 / 16,   // 169 pounds 3 ounces
  soilLossOz: 2,
};

export const WILLOW = {
  soilStartKg: VAN_HELMONT.soilStartLb * LB_KG,
  treeStartKg: VAN_HELMONT.treeStartLb * LB_KG,
  treeEndKg: VAN_HELMONT.treeEndLb * LB_KG,
  soilLossKg: VAN_HELMONT.soilLossOz * OZ_KG,
  get treeGainKg() { return this.treeEndKg - this.treeStartKg; },
  get ratio() { return this.treeGainKg / this.soilLossKg; },
};

/** Fresh willow wood is roughly 55% water, so 45% of the gain is dry matter. */
export const DRY_FRACTION = 0.45;
/** Dry plant matter is about 45% carbon by mass. */
export const CARBON_FRACTION = 0.45;

/** Carbon the willow pulled out of the air, and the CO₂ that carried it. */
export function willowCarbon(gainKg: number): { dryKg: number; carbonKg: number; co2Kg: number } {
  const dryKg = gainKg * DRY_FRACTION;
  const carbonKg = dryKg * CARBON_FRACTION;
  return { dryKg, carbonKg, co2Kg: (carbonKg * M_CO2) / M_C };
}

/** Willow mass over the five years: young trees grow close to exponentially. */
export function willowMass(year: number): number {
  const t = Math.max(0, Math.min(VAN_HELMONT.years, year));
  return WILLOW.treeStartKg * Math.pow(WILLOW.treeEndKg / WILLOW.treeStartKg, t / VAN_HELMONT.years);
}

export function willowSoil(year: number): number {
  const t = Math.max(0, Math.min(VAN_HELMONT.years, year));
  return WILLOW.soilStartKg - WILLOW.soilLossKg * (t / VAN_HELMONT.years);
}

/**
 * Van Helmont did not record how much water he added. A young willow moves
 * tens of litres a day through its leaves in summer, so a few thousand litres
 * a year is the right order — and almost none of it stays in the wood.
 */
const WATER_KG_PER_YEAR = 3000;

/* ------------------------------------------------------------------ *
 * The global carbon books, in gigatonnes of carbon
 * ------------------------------------------------------------------ */

export const POOL_NAMES = ["Air", "Plants", "Animals", "Soil", "Ocean", "Fossil fuel"];
export const AIR = 0, PLANT = 1, ANIMAL = 2, SOIL = 3, OCEAN = 4, FOSSIL = 5;

/**
 * Reservoir sizes from the global carbon budget. The deep ocean (about
 * 37 000 GtC) is deliberately left out: it exchanges far too slowly to belong
 * in a picture of the year-to-year cycle.
 */
export const POOL_START = [875, 450, 2, 1700, 900, 4000];

/** One part per million of atmospheric CO₂ weighs 2.13 gigatonnes of carbon. */
export const GTC_PER_PPM = 2.13;

/** Annual fluxes, GtC/yr. Each one is a real measured number. */
export const FLUX = {
  photosynthesis: 123,  // gross primary production, air → plants
  plantRespiration: 60, // plants → air
  herbivory: 5,         // plants → animals
  animalRespiration: 5, // animals → air
  litterfall: 58,       // plants → soil
  soilRespiration: 55,  // soil → air
  oceanUptake: 80,      // air → ocean
  oceanRelease: 78,     // ocean → air
};

/* ------------------------------------------------------------------ *
 * The atom's journey
 * ------------------------------------------------------------------ */

/** Residence times, years. Real turnover figures except fossil, noted below. */
const DWELL = [5, 9, 1, 30, 10, 50];

/** The molecule the atom is part of in each reservoir. */
const MOLECULE = ["CO₂", "glucose, then cellulose", "glucose, then fat", "dead matter", "dissolved CO₂", "hydrocarbon"];

const SEQUENCES: Record<string, number[]> = {
  plantAnimal: [AIR, PLANT, ANIMAL, AIR],
  plantSoil: [AIR, PLANT, SOIL, AIR],
  fossil: [AIR, PLANT, SOIL, FOSSIL, AIR],
  ocean: [AIR, OCEAN, AIR],
};

export interface Move {
  from: number;
  to: number;
  event: string;
  equation: string;
  explain: string;
}

export function describeMove(from: number, to: number): Move {
  if (from === AIR && to === PLANT) {
    return {
      from, to, event: "Photosynthesis",
      equation: PHOTOSYNTHESIS.text,
      explain: "The atom goes in through a hole in the leaf and is built into glucose inside a chloroplast.",
    };
  }
  if (from === PLANT && to === ANIMAL) {
    return {
      from, to, event: "Eaten",
      equation: "glucose → glucose",
      explain: "The plant is eaten. Digestion breaks the food apart but leaves this carbon atom where it is.",
    };
  }
  if ((from === ANIMAL || from === PLANT) && to === AIR) {
    return {
      from, to, event: "Respiration",
      equation: RESPIRATION.text,
      explain: "Glucose is broken down in a mitochondrion. The atom leaves in a breath, as carbon dioxide.",
    };
  }
  if (to === SOIL) {
    return {
      from, to, event: "Death and decay",
      equation: "dead matter → CO₂ + nutrients",
      explain: "Whatever held the atom died. Decomposers now have it.",
    };
  }
  if (from === SOIL && to === AIR) {
    return {
      from, to, event: "Decomposers respire",
      equation: RESPIRATION.text,
      explain: "Fungi and bacteria respire just like you do, and breathe this atom back out.",
    };
  }
  if (to === FOSSIL) {
    return {
      from, to, event: "Buried",
      equation: "dead matter → coal, oil, gas",
      explain: "Buried before it could rot. In real life it waits here for hundreds of millions of years.",
    };
  }
  if (from === FOSSIL && to === AIR) {
    return {
      from, to, event: "Burned",
      equation: "fuel + O₂ → CO₂ + H₂O + energy",
      explain: "Dug up and burned. Carbon that left the air in the age of the dinosaurs is back in one second.",
    };
  }
  if (to === OCEAN) {
    return {
      from, to, event: "Dissolved",
      equation: "CO₂(gas) → CO₂(dissolved)",
      explain: "The atom dissolves into the sea, which holds far more carbon than the air does.",
    };
  }
  return {
    from, to, event: "Moved",
    equation: "C → C",
    explain: "Same atom, new place.",
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** Years elapsed. */
  t: number;
  pools: number[];
  totalStart: number;
  /** Where the tracked atom is. */
  where: number;
  step: number;
  dwell: number;
  trail: number[];
  visited: boolean[];
  laps: number;
  moves: number;
  lastMove: Move | null;
  eventTimer: number;
  /** Photosynthesis and respiration events counted, for the atom-balance check. */
  photoEvents: number;
  respEvents: number;
  carbonIn: number;
  carbonOut: number;
  willowYear: number;
}

/** How long an event caption stays on screen, in sim years. */
const EVENT_SHOW = 2.2;

function sequenceFor(params: ParamValues): number[] {
  return SEQUENCES[params.pathway as string] ?? SEQUENCES.plantAnimal;
}

const model: SimModel<State> = {
  init(params) {
    const pools = POOL_START.slice();
    pools[AIR] = (params.startPpm as number) * GTC_PER_PPM;
    const seq = sequenceFor(params);
    return {
      t: 0,
      pools,
      totalStart: pools.reduce((a, b) => a + b, 0),
      where: seq[0],
      step: 0,
      dwell: 0,
      trail: [seq[0]],
      visited: POOL_NAMES.map((_, i) => i === seq[0]),
      laps: 0,
      moves: 0,
      lastMove: null,
      eventTimer: 0,
      photoEvents: 0,
      respEvents: 0,
      carbonIn: 0,
      carbonOut: 0,
      willowYear: 0,
    };
  },

  applyParams(state, params, prev) {
    let s = state;
    if (params.pathway !== prev.pathway) {
      const seq = sequenceFor(params);
      s = {
        ...s, where: seq[0], step: 0, dwell: 0, trail: [seq[0]],
        lastMove: null, eventTimer: 0,
      };
    }
    if (params.startPpm !== prev.startPpm) {
      const pools = s.pools.slice();
      pools[AIR] = (params.startPpm as number) * GTC_PER_PPM;
      s = { ...s, pools, totalStart: pools.reduce((a, b) => a + b, 0) };
    }
    if (params.mode !== prev.mode) s = { ...s, willowYear: 0 };
    return s;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rng = ctx.rng;
    const t = state.t + dt;

    /* --- the willow experiment ------------------------------------ */
    if (params.mode === "willow") {
      return {
        ...state, t,
        willowYear: Math.min(VAN_HELMONT.years, state.willowYear + dt),
      };
    }

    /* --- the global books ----------------------------------------- */
    // Every term below moves carbon from one pool to another. Nothing is ever
    // added to the system and nothing leaves it: the total is a conserved
    // quantity, which a test checks to twelve decimal places.
    const burning = params.burning as number;
    const p = state.pools.slice();
    const move = (from: number, to: number, amount: number) => {
      const a = Math.max(0, Math.min(amount, p[from]));
      p[from] -= a;
      p[to] += a;
    };
    move(AIR, PLANT, FLUX.photosynthesis * dt);
    move(PLANT, AIR, FLUX.plantRespiration * dt);
    move(PLANT, ANIMAL, FLUX.herbivory * dt);
    move(ANIMAL, AIR, FLUX.animalRespiration * dt);
    move(PLANT, SOIL, FLUX.litterfall * dt);
    move(SOIL, AIR, FLUX.soilRespiration * dt);
    move(AIR, OCEAN, FLUX.oceanUptake * dt);
    move(OCEAN, AIR, FLUX.oceanRelease * dt);
    move(FOSSIL, AIR, burning * dt);

    /* --- the tracked atom ------------------------------------------ */
    let { where, step, dwell, trail, laps, moves, lastMove, eventTimer } = state;
    let { photoEvents, respEvents, carbonIn, carbonOut } = state;
    const visited = state.visited.slice();
    dwell += dt;
    eventTimer = Math.max(0, eventTimer - dt);

    const free = params.pathway === "free";
    const stay = DWELL[where];
    // A residence time is an average, so leaving is a chance per year, not a
    // countdown. That is what makes two runs of the same atom differ.
    const leaving = free ? rng.chance(Math.min(1, dt / stay)) : dwell >= stay * 0.35;

    if (leaving) {
      let next: number;
      if (free) {
        next = freeDestination(where, rng.next());
      } else {
        const seq = sequenceFor(params);
        step = (step + 1) % (seq.length - 1);
        next = seq[step === 0 ? 0 : step];
        if (step === 0) laps += 1;
      }
      if (next !== where) {
        lastMove = describeMove(where, next);
        eventTimer = EVENT_SHOW;
        moves += 1;
        if (lastMove.event === "Photosynthesis") {
          photoEvents += 1;
          carbonIn += PHOTOSYNTHESIS.reactants.C;
        }
        if (lastMove.event === "Respiration" || lastMove.event === "Decomposers respire") {
          respEvents += 1;
          carbonOut += RESPIRATION.products.C;
        }
        where = next;
        visited[next] = true;
        trail = [...trail, next].slice(-24);
        dwell = 0;
      }
    }

    return {
      ...state, t, pools: p,
      where, step, dwell, trail, visited, laps, moves, lastMove, eventTimer,
      photoEvents, respEvents, carbonIn, carbonOut,
    };
  },

  readouts(state, params) {
    if (params.mode === "willow") {
      const mass = willowMass(state.willowYear);
      const soil = willowSoil(state.willowYear);
      const gain = mass - WILLOW.treeStartKg;
      return [
        {
          key: "year", label: "Years since planting", quantity: q(state.willowYear, "count"),
          semantic: "time", graphable: true,
        },
        {
          key: "treeMass", label: "Mass of the tree", quantity: q(mass, "mass"), unit: "kg",
          semantic: "mass", graphable: true,
        },
        {
          key: "soilMass", label: "Mass of the dried soil", quantity: q(soil, "mass"), unit: "kg",
          semantic: "solid", graphable: true,
        },
        {
          key: "treeGain", label: "Mass the tree gained", quantity: q(gain, "mass"), unit: "kg",
          semantic: "mass", graphable: true,
        },
        {
          key: "soilLoss", label: "Mass the soil lost",
          quantity: q(WILLOW.soilStartKg - soil, "mass"), unit: "g",
          semantic: "solid", graphable: true,
        },
        {
          key: "carbonFromAir", label: "Carbon taken from the air",
          quantity: q(willowCarbon(gain).carbonKg, "mass"), unit: "kg",
          semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
        },
      ];
    }
    const ppm = state.pools[AIR] / GTC_PER_PPM;
    return [
      {
        key: "ppm", label: "CO₂ in the air (ppm)", quantity: q(ppm, "count"),
        semantic: "gas", graphable: true,
      },
      {
        key: "air", label: "Carbon in the air (GtC)", quantity: q(state.pools[AIR], "count"),
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "plants", label: "Carbon in plants (GtC)", quantity: q(state.pools[PLANT], "count"),
        semantic: "producer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "soil", label: "Carbon in soil (GtC)", quantity: q(state.pools[SOIL], "count"),
        semantic: "decomposer", graphable: true, bands: ["9-12"],
      },
      {
        key: "total", label: "All the carbon (GtC)",
        quantity: q(state.pools.reduce((a, b) => a + b, 0), "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "moves", label: "Journeys the atom has made", quantity: q(state.moves, "count"),
        semantic: "distance", graphable: false,
      },
      {
        key: "years", label: "Years followed", quantity: q(state.t, "count"),
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const total = state.pools.reduce((a, b) => a + b, 0);
    const gain = willowMass(state.willowYear) - WILLOW.treeStartKg;
    const carbon = willowCarbon(WILLOW.treeGainKg);
    return {
      mode: params.mode as string,
      pathway: params.pathway as string,
      where: POOL_NAMES[state.where],
      molecule: MOLECULE[state.where],
      moves: state.moves,
      laps: state.laps,
      visitedAir: state.visited[AIR],
      visitedPlant: state.visited[PLANT],
      visitedAnimal: state.visited[ANIMAL],
      visitedSoil: state.visited[SOIL],
      visitedFossil: state.visited[FOSSIL],
      fullJourney: state.visited[AIR] && state.visited[PLANT] && state.visited[ANIMAL],
      photoEvents: state.photoEvents,
      respEvents: state.respEvents,
      carbonIn: state.carbonIn,
      carbonOut: state.carbonOut,
      photoCarbonBalanced: PHOTOSYNTHESIS.reactants.C === PHOTOSYNTHESIS.products.C,
      respCarbonBalanced: RESPIRATION.reactants.C === RESPIRATION.products.C,
      airGtC: state.pools[AIR],
      plantGtC: state.pools[PLANT],
      animalGtC: state.pools[ANIMAL],
      soilGtC: state.pools[SOIL],
      oceanGtC: state.pools[OCEAN],
      fossilGtC: state.pools[FOSSIL],
      totalGtC: total,
      totalStart: state.totalStart,
      conserved: Math.abs(total - state.totalStart) < 1e-6 * state.totalStart,
      ppm: state.pools[AIR] / GTC_PER_PPM,
      years: state.t,
      // the willow
      willowYear: state.willowYear,
      willowTreeKg: willowMass(state.willowYear),
      willowSoilKg: willowSoil(state.willowYear),
      willowTreeGainKg: gain,
      willowSoilLossKg: WILLOW.soilStartKg - willowSoil(state.willowYear),
      finalTreeGainKg: WILLOW.treeGainKg,
      finalSoilLossKg: WILLOW.soilLossKg,
      gainToLossRatio: WILLOW.ratio,
      willowCarbonKg: carbon.carbonKg,
      willowCo2Kg: carbon.co2Kg,
      waterAddedKg: WATER_KG_PER_YEAR * state.willowYear,
    };
  },
};

/** Where a free atom goes next, using the size of each outgoing flux. */
function freeDestination(from: number, r: number): number {
  switch (from) {
    case AIR: return r < 0.6 ? PLANT : OCEAN;
    case PLANT: return r < 0.5 ? AIR : r < 0.58 ? ANIMAL : SOIL;
    case ANIMAL: return r < 0.75 ? AIR : SOIL;
    case SOIL: return r < 0.97 ? AIR : FOSSIL;
    case OCEAN: return AIR;
    default: return AIR;
  }
}

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Where each reservoir sits on the stage, in fractions of width and height. */
const SPOT: [number, number][] = [
  [0.5, 0.17],   // air
  [0.27, 0.60],  // plant
  [0.62, 0.72],  // animal
  [0.42, 0.88],  // soil
  [0.86, 0.83],  // ocean
  [0.13, 0.93],  // fossil
];

function poolColor(i: number, theme: RenderContext<State>["theme"]): string {
  switch (i) {
    case AIR: return theme.sci["gas"];
    case PLANT: return theme.sci["producer"];
    case ANIMAL: return theme.sci["primary-consumer"];
    case SOIL: return theme.sci["decomposer"];
    case OCEAN: return theme.sci["liquid"];
    default: return theme.sci["energy-thermal"];
  }
}

function drawScene(rc: RenderContext<State>, w: number, h: number) {
  const { ctx, state, theme, params } = rc;
  const groundY = h * 0.78;
  sky(ctx, w, h, theme, "day", groundY);
  groundPlane(ctx, groundY, 0, w, h, theme, "soil");

  // The sun that drives the whole cycle.
  glow(ctx, w * 0.87, h * 0.13, w * 0.16, theme.sci["light"], 0.4);
  sphere(ctx, w * 0.87, h * 0.13, Math.max(12, w * 0.032), theme.sci["light"], { glow: 0.6 });

  /* --- carbon dioxide drifting in the air ------------------------- */
  const ppm = state.pools[AIR] / GTC_PER_PPM;
  const n = Math.round(Math.max(6, Math.min(48, ppm / 14)));
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + state.t * 0.25;
    const px = ((i * 137.5) % 100) / 100 * w + Math.sin(a) * w * 0.02;
    const py = h * 0.05 + (((i * 61) % 100) / 100) * h * 0.4;
    ctx.globalAlpha = 0.35;
    sphere(ctx, px, py, Math.max(1.6, w * 0.006), theme.sci["gas"], { rim: false });
  }
  ctx.restore();

  /* --- the plant --------------------------------------------------- */
  const [tx, ty] = [w * SPOT[PLANT][0], h * SPOT[PLANT][1]];
  const producer = theme.sci["producer"];
  ctx.save();
  ctx.strokeStyle = mixHex(producer, "#000000", 0.55);
  ctx.lineWidth = Math.max(4, w * 0.012);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tx, groundY);
  ctx.lineTo(tx, ty - h * 0.02);
  ctx.moveTo(tx, ty + h * 0.06);
  ctx.lineTo(tx - w * 0.05, ty + h * 0.02);
  ctx.moveTo(tx, ty + h * 0.09);
  ctx.lineTo(tx + w * 0.05, ty + h * 0.05);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, tx, ty - h * 0.06, Math.max(16, w * 0.075), producer, { glow: 0.15 });
  sphere(ctx, tx - w * 0.06, ty, Math.max(10, w * 0.05), producer);
  sphere(ctx, tx + w * 0.06, ty - h * 0.01, Math.max(10, w * 0.045), producer);

  /* --- the animal --------------------------------------------------- */
  const [ax, ay] = [w * SPOT[ANIMAL][0], h * SPOT[ANIMAL][1]];
  const consumer = theme.sci["primary-consumer"];
  sphere(ctx, ax, ay, Math.max(11, w * 0.038), consumer);
  sphere(ctx, ax + w * 0.035, ay - h * 0.02, Math.max(7, w * 0.022), consumer, { rim: false });
  ctx.save();
  ctx.strokeStyle = consumer;
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax + w * 0.032, ay - h * 0.042);
  ctx.lineTo(ax + w * 0.024, ay - h * 0.085);
  ctx.moveTo(ax + w * 0.046, ay - h * 0.042);
  ctx.lineTo(ax + w * 0.052, ay - h * 0.082);
  ctx.stroke();
  ctx.restore();

  /* --- soil, decomposers and buried fuel ---------------------------- */
  const [sx, sy] = [w * SPOT[SOIL][0], h * SPOT[SOIL][1]];
  ctx.save();
  ctx.fillStyle = theme.sci["decomposer"];
  for (let i = -2; i <= 2; i++) {
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(sx + i * w * 0.035, sy + (i % 2) * h * 0.015, w * 0.012, h * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const [fx, fy] = [w * SPOT[FOSSIL][0], h * SPOT[FOSSIL][1]];
  ctx.save();
  ctx.fillStyle = mixHex(theme.sci["energy-thermal"], "#000000", 0.4);
  roundRect(ctx, fx - w * 0.055, fy - h * 0.03, w * 0.11, h * 0.05, 4);
  ctx.fill();
  ctx.restore();

  /* --- the ocean ---------------------------------------------------- */
  const [ox, oy] = [w * SPOT[OCEAN][0], h * SPOT[OCEAN][1]];
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.55);
  ctx.beginPath();
  ctx.moveTo(ox - w * 0.13, oy + h * 0.12);
  ctx.lineTo(ox - w * 0.13, oy - h * 0.03);
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    ctx.lineTo(ox - w * 0.13 + u * w * 0.28, oy - h * 0.03 + Math.sin(u * 8 + state.t) * h * 0.008);
  }
  ctx.lineTo(ox + w * 0.15, oy + h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* --- reservoir plates with the real numbers ----------------------- */
  if (rc.band !== "3-5" && rc.overlays.pools !== false) {
    for (let i = 0; i < POOL_NAMES.length; i++) {
      const px = w * SPOT[i][0];
      const py = h * SPOT[i][1] - (i === AIR ? 0 : h * 0.13);
      badge(ctx, px, py, `${Math.round(state.pools[i])} GtC`, theme, {
        align: "center", color: poolColor(i, theme), sub: POOL_NAMES[i],
      });
    }
  }
  void params;
}

function drawAtom(rc: RenderContext<State>, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const [tx, ty] = [w * SPOT[state.where][0], h * SPOT[state.where][1]];
  // Inside a reservoir the atom jitters a little rather than sitting frozen.
  const wob = Math.min(1, state.dwell * 2);
  const px = tx + Math.sin(state.t * 1.7 + state.where) * w * 0.02 * wob;
  const py = ty + Math.cos(state.t * 1.3 + state.where) * h * 0.02 * wob;

  if (state.trail.length > 1) {
    const pts = state.trail.map((r, i) => ({
      x: w * SPOT[r][0] + (i % 2 ? 6 : -6),
      y: h * SPOT[r][1] + (i % 3 ? 4 : -4),
    }));
    pts.push({ x: px, y: py });
    comet(ctx, pts, theme.accent, 3);
  }

  glow(ctx, px, py, 26, theme.accent, 0.55);
  sphere(ctx, px, py, 9, theme.accent, { glow: 0.7 });
  caption(ctx, px, py - 20, "C", theme, { align: "center", size: 13, color: theme.accent, weight: 800 });
}

function drawEventPanel(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, state, theme, band } = rc;
  const m = state.lastMove;
  if (!m || state.eventTimer <= 0) return;
  const fade = Math.min(1, state.eventTimer / 0.8);
  const h = band === "3-5" ? 54 : 78;
  ctx.save();
  ctx.globalAlpha = 0.93 * fade;
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 10, y + 16, m.event, theme, { size: 13, color: theme.accent });
  caption(ctx, x + 10, y + 34, m.equation, theme, { size: 11, color: theme.ink });
  if (band !== "3-5") wrapText(rc, m.explain, x + 10, y + 52, w - 20, 10, theme.inkSoft);
}

function wrapText(
  rc: RenderContext<State>, text: string, x: number, y: number,
  maxW: number, size: number, color: string,
) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.font = `600 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  ctx.restore();
  let ly = y;
  for (const l of lines.slice(0, 5)) {
    caption(ctx, x, ly, l, theme, { size, color });
    ly += size + 3;
  }
}

/** The two equations side by side, which is the whole of C5.4. */
function drawEquations(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, 76, 8);
  ctx.fill();
  ctx.restore();
  caption(ctx, x + 10, y + 15, "Photosynthesis", theme, { size: 10, color: theme.sci["producer"] });
  caption(ctx, x + 10, y + 30, PHOTOSYNTHESIS.text, theme, { size: 10, color: theme.ink });
  caption(ctx, x + 10, y + 50, "Respiration", theme, { size: 10, color: theme.sci["energy-thermal"] });
  caption(ctx, x + 10, y + 65, RESPIRATION.text, theme, { size: 10, color: theme.ink });
}

/** Van Helmont's bench: a pot on a balance, five years of it. */
function drawWillow(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, band } = rc;
  const year = state.willowYear;
  const mass = willowMass(year);
  const soil = willowSoil(year);
  const gain = mass - WILLOW.treeStartKg;
  const loss = WILLOW.soilStartKg - soil;

  const groundY = height * 0.86;
  sky(ctx, width, height, theme, "indoor", groundY);
  groundPlane(ctx, groundY, 0, width, height, theme, "lab");

  /* --- the pot ------------------------------------------------------ */
  const cx = width * 0.3;
  const potW = Math.min(width * 0.2, height * 0.24);
  const potH = potW * 0.72;
  const potY = groundY - potH - height * 0.05;
  ctx.save();
  ctx.fillStyle = mixHex(theme.sci["solid"], "#000000", 0.15);
  ctx.beginPath();
  ctx.moveTo(cx - potW / 2, potY);
  ctx.lineTo(cx + potW / 2, potY);
  ctx.lineTo(cx + potW * 0.38, potY + potH);
  ctx.lineTo(cx - potW * 0.38, potY + potH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  /* --- the willow, growing --------------------------------------- */
  // Height goes as the cube root of mass, because a tree grows in three
  // dimensions at once.
  const scale = Math.pow(mass / WILLOW.treeStartKg, 1 / 3);
  const trunkH = Math.min(height * 0.62, potW * 0.55 * scale);
  const trunkW = Math.max(3, potW * 0.06 * Math.sqrt(scale));
  const producer = theme.sci["producer"];
  ctx.save();
  ctx.fillStyle = mixHex(producer, "#000000", 0.6);
  ctx.fillRect(cx - trunkW / 2, potY - trunkH, trunkW, trunkH);
  ctx.restore();
  const crownR = Math.max(9, trunkH * 0.34);
  sphere(ctx, cx, potY - trunkH - crownR * 0.4, crownR, producer, { glow: 0.12 });
  sphere(ctx, cx - crownR * 0.75, potY - trunkH + crownR * 0.25, crownR * 0.62, producer);
  sphere(ctx, cx + crownR * 0.78, potY - trunkH + crownR * 0.15, crownR * 0.58, producer);

  /* --- carbon dioxide going in ------------------------------------ */
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const u = ((state.t * 0.35 + i * 0.083) % 1);
    const px = cx + Math.cos(i * 2.1) * crownR * 2.6 * (1 - u);
    const py = potY - trunkH - crownR * 0.4 - u * -height * 0.02 + Math.sin(i) * crownR * 1.4 * (1 - u);
    ctx.globalAlpha = 0.25 + 0.5 * (1 - u);
    sphere(ctx, px, py, 3.4, theme.sci["gas"], { rim: false });
  }
  ctx.restore();
  caption(ctx, cx, potY - trunkH - crownR * 2.1, "CO₂ from the air", theme, {
    align: "center", size: 11, color: theme.sci["gas"],
  });

  /* --- the balances ------------------------------------------------ */
  const panelX = Math.min(width - 12, cx + potW * 0.9);
  const pw = Math.max(120, width - panelX - 12);
  caption(ctx, panelX, 24, `Year ${year.toFixed(1)} of 5`, theme, { size: 15 });
  const rows: [string, string, string][] = [
    ["Tree", `${mass.toFixed(2)} kg`, theme.sci["producer"]],
    ["Tree gained", `+${gain.toFixed(2)} kg`, theme.sci["producer"]],
    ["Dried soil", `${soil.toFixed(3)} kg`, theme.sci["solid"]],
    ["Soil lost", `${(loss * 1000).toFixed(0)} g`, theme.sci["solid"]],
  ];
  let ry = 52;
  for (const [k, v, c] of rows) {
    caption(ctx, panelX, ry, k, theme, { size: 10, color: theme.inkSoft });
    caption(ctx, panelX, ry + 15, v, theme, { size: 14, color: c });
    ry += 38;
  }

  /* --- the comparison bar: this is the argument -------------------- */
  if (band !== "3-5" && ry + 70 < height) {
    const barW = pw - 8;
    caption(ctx, panelX, ry + 6, "Gained by the tree vs lost by the soil", theme, {
      size: 10, color: theme.inkSoft,
    });
    const maxM = Math.max(gain, 0.001);
    ctx.save();
    ctx.fillStyle = theme.sci["producer"];
    roundRect(ctx, panelX, ry + 16, Math.max(2, barW * (gain / maxM)), 14, 4);
    ctx.fill();
    ctx.fillStyle = theme.sci["solid"];
    roundRect(ctx, panelX, ry + 36, Math.max(2, barW * (loss / maxM)), 14, 4);
    ctx.fill();
    ctx.restore();
    if (gain > 0 && loss > 0) {
      caption(ctx, panelX, ry + 62, `the tree gained ${(gain / loss).toFixed(0)}× what the soil lost`, theme, {
        size: 11, color: theme.accent,
      });
    }
  }

  if (year >= VAN_HELMONT.years - 0.01) {
    const c = willowCarbon(WILLOW.treeGainKg);
    label(ctx,
      `The soil lost 57 g. The tree gained 74 kg — about ${c.carbonKg.toFixed(0)} kg of it carbon, all from the air.`,
      width / 2, height - 16, theme,
      { align: "center", size: 12, color: theme.accent });
  } else if (band !== "3-5") {
    label(ctx, `water added so far: about ${Math.round(WATER_KG_PER_YEAR * year)} kg (estimate)`,
      12, height - 16, theme, { size: 10, color: theme.inkSoft });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;

  if (params.mode === "willow") {
    drawWillow(rc);
    vignette(ctx, width, height, 0.15);
    return;
  }

  drawScene(rc, width, height);
  drawAtom(rc, width, height);

  const panelW = Math.min(230, width * 0.34);
  if (width > 420) {
    drawEventPanel(rc, width - panelW - 8, height - 176, panelW);
    if (overlays.equations !== false && band !== "3-5") {
      drawEquations(rc, width - panelW - 8, height - 88, panelW);
    }
  }

  if (band !== "3-5") {
    caption(ctx, 12, 20, `The atom is in: ${POOL_NAMES[state.where]}`, theme, { size: 13 });
    caption(ctx, 12, 38, `as ${MOLECULE[state.where]}`, theme, { size: 11, color: theme.inkSoft });
    caption(ctx, 12, 58, `${state.moves} journeys · ${state.t.toFixed(0)} years`, theme, {
      size: 10, color: theme.inkSoft,
    });
    const total = state.pools.reduce((a, b) => a + b, 0);
    badge(ctx, 12, height - 26, `${Math.round(total)} GtC`, theme, {
      color: theme.sci["mass"], sub: "carbon in the whole system",
    });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const carbonCycleSim: SimManifest<State> = {
  id: "bio.carbon-cycle",
  title: "Follow One Carbon Atom",
  tagline: "Pick a carbon atom out of the air and stay with it through a plant, an animal and back.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7", "MS-LS2-3", "HS-LS2-5"] },
  learningGoals: [
    "Follow one carbon atom from air to plant to animal and back to air.",
    "Show photosynthesis and respiration as the same atoms rearranged, in opposite directions.",
    "Use van Helmont's willow to argue that a plant's mass comes from air and water, not soil.",
    "Explain why the total amount of carbon never changes, only where it is.",
  ],
  misconceptions: [
    "Plants make their food out of the soil they grow in",
    "Plants only photosynthesise and never respire",
    "Carbon is used up when something is burned or eaten",
    "The carbon dioxide you breathe out is a different substance from the one plants take in",
  ],
  interactionHint: "Press play and follow the glowing atom. Switch to Van Helmont's willow for the classic experiment.",
  tickRate: 30,
  // Four years per second: the atom's real residence times are years long.
  timeScale: 4,
  params: {
    mode: {
      type: "option", label: "What to run",
      options: [
        { value: "atom", label: "Follow one atom" },
        { value: "willow", label: "Van Helmont's willow" },
      ],
      default: "atom",
    },
    pathway: {
      type: "option", label: "The atom's route",
      options: [
        { value: "plantAnimal", label: "Air → plant → animal → air" },
        { value: "plantSoil", label: "Air → plant → soil → air" },
        { value: "fossil", label: "Air → plant → soil → fossil fuel → air" },
        { value: "ocean", label: "Air → ocean → air" },
        { value: "free", label: "Let chance decide" },
      ],
      default: "plantAnimal",
      help: "On the last setting the atom takes whichever route the real fluxes make likely.",
    },
    startPpm: {
      type: "number", label: "CO₂ in the air to start", kind: "count",
      min: 200, max: 900, step: 5, default: 420,
      bands: ["6-8", "9-12"],
      marks: [
        { value: 280, label: "1750" },
        { value: 315, label: "1958" },
        { value: 420, label: "Today" },
      ],
      help: "Parts per million. One ppm is 2.13 gigatonnes of carbon.",
    },
    burning: {
      type: "number", label: "Fossil fuel burned", kind: "count",
      min: 0, max: 15, step: 0.5, default: 0,
      bands: ["6-8", "9-12"],
      marks: [{ value: 0, label: "None" }, { value: 9.5, label: "Today" }],
      help: "Gigatonnes of carbon a year. It moves carbon between pools — it never makes any.",
    },
  },
  overlays: [
    { key: "pools", label: "How much is in each store", default: true, bands: ["6-8", "9-12"] },
    { key: "equations", label: "The two equations", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "van-helmont",
      title: "Where did the tree's mass come from?",
      question: "A willow gains 74 kilograms in five years. Where did all that material come from?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-LS1-6"],
      setup: { mode: "willow", pathway: "plantAnimal", startPpm: 420, burning: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you weigh anything",
          instruction: "In 1648 van Helmont planted a 5 lb willow in 200 lb of dried soil.",
          predict: {
            prompt: "After five years the tree weighed 169 lb. What happened to the soil?",
            options: [
              "It lost about 164 lb — the tree ate it",
              "It lost about half its mass",
              "It lost about 2 ounces — almost nothing",
            ],
            correct: 2,
            reveal: "Two ounces. The tree gained about thirteen hundred times more mass than the soil lost, so the soil cannot be where the material came from.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the five years",
          instruction: "Play until year 5. Record the tree and soil masses several times.",
          check: {
            describe: "The experiment has reached year 5",
            test: (v) => (v.facts.willowYear as number) >= 4.99,
          },
          requireData: 5,
          hints: ["Speed the clock up — five years is a long time to watch."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two numbers",
          instruction: "Divide the mass the tree gained by the mass the soil lost.",
          write: {
            prompt: "Write the ratio you get, and say what it rules out.",
            placeholder: "The tree gained about ... times what the soil lost, so the mass cannot have come from ...",
          },
          hints: ["The bar chart on the right shows both bars on the same scale."],
        },
        {
          id: "where",
          phase: "analyze",
          title: "So where did it come from?",
          instruction: "Van Helmont said water. He was half right. What else went in?",
          predict: {
            prompt: "Most of a tree's dry mass is carbon. Where did that carbon come from?",
            options: ["Minerals in the soil", "The water he poured on", "Carbon dioxide in the air"],
            correct: 2,
            reveal: "The air. Photosynthesis pulls CO₂ in through the leaves and builds it into sugar, then wood. A tree is mostly made of air and water.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Judge the experiment",
          instruction: "Van Helmont's data were good but his conclusion was incomplete.",
          write: {
            prompt: "What did his experiment prove, and what did it not prove?",
            placeholder: "His measurements ruled out ... but he had no way to test ...",
          },
        },
      ],
    },
    {
      id: "one-atom",
      title: "One atom, all the way round",
      question: "Can the same carbon atom be in the air, in a plant, in an animal and back in the air?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-7"],
      setup: { mode: "atom", pathway: "plantAnimal", startPpm: 420, burning: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "A carbon atom leaves your breath today.",
          predict: {
            prompt: "What happens to that exact atom next?",
            options: [
              "It is used up and stops existing",
              "It stays in the air for ever",
              "It can be built into a plant, then into an animal, then breathed out again",
            ],
            correct: 2,
            reveal: "Atoms are not used up. This one is rearranged into sugar, into a body, and back into carbon dioxide — the same atom every time.",
          },
        },
        {
          id: "follow",
          phase: "measure",
          title: "Follow it round once",
          instruction: "Play until the atom has been in the air, a plant and an animal.",
          check: {
            describe: "The atom has visited air, plant and animal",
            test: (v) => v.facts.fullJourney === true,
          },
          requireData: 3,
        },
        {
          id: "equations",
          phase: "analyze",
          title: "Read the two equations",
          instruction: "Count the carbon atoms on each side of both equations.",
          write: {
            prompt: "How do photosynthesis and respiration compare?",
            placeholder: "Photosynthesis turns ... into ... and respiration does exactly the ...",
          },
          hints: ["Both equations have six carbons on the left and six on the right."],
        },
        {
          id: "burn",
          phase: "measure",
          title: "Now burn some fossil fuel",
          instruction: "Turn Fossil fuel burned up to 9.5 and watch the total carbon.",
          check: {
            describe: "Fossil fuel is being burned",
            test: (v) => (v.params.burning as number) >= 5,
          },
          requireData: 6,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain what burning changes",
          instruction: "The total never moved. So what did burning actually do?",
          write: {
            prompt: "If burning makes no new carbon, why does burning fuel matter?",
            placeholder: "The total stayed at ... but the amount in the ... went ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "grand-tour",
      title: "The grand tour",
      brief: "Get one atom to visit the air, a plant, an animal, the soil and fossil fuel.",
      bands: ["6-8", "9-12"],
      setup: { mode: "atom", pathway: "free", startPpm: 420, burning: 0 },
      goal: {
        describe: "Air, plant, animal and soil all visited",
        test: (v) =>
          v.facts.visitedAir === true && v.facts.visitedPlant === true &&
          v.facts.visitedAnimal === true && v.facts.visitedSoil === true,
      },
      stars: {
        two: {
          describe: "Fossil fuel as well",
          test: (v) =>
            v.facts.visitedAir === true && v.facts.visitedPlant === true &&
            v.facts.visitedAnimal === true && v.facts.visitedSoil === true &&
            v.facts.visitedFossil === true,
        },
        three: {
          describe: "Every store visited, with the total carbon unchanged",
          test: (v) =>
            v.facts.visitedAir === true && v.facts.visitedPlant === true &&
            v.facts.visitedAnimal === true && v.facts.visitedSoil === true &&
            v.facts.visitedFossil === true && v.facts.conserved === true,
        },
      },
      hints: [
        "Set the route to Let chance decide — a fixed route can never reach every store.",
        "Fossil burial is rare. Speed the clock up and be patient.",
      ],
    },
    {
      id: "keeling",
      title: "Draw the Keeling curve",
      brief: "Burn fuel until the air passes 500 ppm of carbon dioxide.",
      bands: ["6-8", "9-12"],
      setup: { mode: "atom", pathway: "plantAnimal", startPpm: 420, burning: 9.5 },
      goal: {
        describe: "Air above 500 ppm",
        test: (v) => (v.facts.ppm as number) > 500,
      },
      stars: {
        two: {
          describe: "Above 500 ppm with the total carbon still exactly conserved",
          test: (v) => (v.facts.ppm as number) > 500 && v.facts.conserved === true,
        },
        three: {
          describe: "Above 600 ppm, and say where every added atom came from",
          test: (v) =>
            (v.facts.ppm as number) > 600 && v.facts.conserved === true &&
            (v.facts.fossilGtC as number) < 3900,
        },
      },
      hints: [
        "Today the world burns about 9.5 GtC a year.",
        "Watch the fossil store shrink by exactly as much as the air grows.",
      ],
    },
  ],
};
