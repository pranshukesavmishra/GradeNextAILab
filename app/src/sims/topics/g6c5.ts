import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit C · Topic C5 — Engineering with thermal energy.
 *
 * Six simulations, one per subtopic:
 *
 *   C5.1  g6c5-what-blocks-heat  choosing materials             (investigate)
 *   C5.2  g6c5-criteria-or-limit defining the design problem    (sort)
 *   C5.3  g6c5-build-the-cup     designing and building         (assemble)
 *   C5.4  g6c5-test-the-cup      testing and collecting data    (investigate)
 *   C5.5  g6c5-two-designs       comparing competing designs    (compare)
 *   C5.6  g6c5-one-change        redesigning from evidence      (process)
 *
 * All six share one brief and one cooling model, so the numbers agree across
 * the topic: 200 g of water starting at 90 degrees in a 21 degree room, a cup
 * of surface area 0.02 m2, and heat escaping through the insulation and then
 * through the surface air film (about 10 W/m2 K), the two resistances adding.
 * The target is 70 degrees after 30 minutes, which a bare cup misses and an
 * insulated, lidded cup meets.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second, so this is the rail's
 * own position and the cup cools in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/**
 * The colour of a drink at a temperature, and the brief's pass mark.
 *
 * The whole topic is judged against one number — still above 70 degrees at 30
 * minutes — so the ramp has its break exactly there. A cup that has fallen
 * below the target looks like it: the drink goes flat and grey rather than
 * merely a shade cooler.
 */
const drinkColor = (c: number) =>
  c >= 80 ? "#e08a3c" : c >= 70 ? "#c2793c" : c >= 55 ? "#8a7f86" : "#6a7a90";

/* C5.1 — Choosing materials to control heat transfer. */
const WHAT_BLOCKS_HEAT: ArchetypeSpec = {
  id: "g6c5-what-blocks-heat",
  title: "What Actually Blocks Heat",
  tagline: "One square metre of wall, six materials, and a factor of a thousand between them.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "Compare materials by how much energy passes through them each second.",
    "Explain why trapped air is the working part of most insulation.",
  ],
  misconceptions: ["Thick materials always insulate better than thin ones"],
  specimens: [{ id: "wall", name: "One square metre of wall", art: { art: "sphere", color: "#e2d7bc", radius: 0.44 } }],
  variables: [
    { key: "thicknessMm", label: "Thickness (mm)", min: 5, max: 200, step: 5, default: 50 },
    { key: "deltaT", label: "Temperature difference across it (degrees C)", min: 5, max: 40, step: 1, default: 20 },
  ],
  // Fourier's law again, Q/t = k A dT / L for A = 1 m2, with measured
  // conductivities in W/m K: sheep wool 0.04, foam 0.03, trapped still air
  // 0.026, cardboard 0.05, glass 1.0, steel 50.
  measure: (v) => {
    const length = v.thicknessMm / 1000;
    const flow = (k: number) => (k * v.deltaT) / length;
    return {
      woolW: flow(0.04),
      foamW: flow(0.03),
      trappedAirW: flow(0.026),
      cardboardW: flow(0.05),
      glassW: flow(1),
      steelW: flow(50),
    };
  },
  plot: { x: "thicknessMm", y: "woolW", xLabel: "Thickness (mm)", yLabel: "Energy per second through wool (W)" },
  /*
   * The wall is drawn as thick as you have made it, and lit by the heat coming
   * through it. Fourier's law puts those two the opposite way round: 5 mm of
   * wool across 40 degrees passes 320 W and glows like a radiator, 200 mm
   * across 5 degrees passes 1 W and is stone cold. The steel line is the
   * warning — 50 W/m K instead of 0.04 means even 200 mm of it leaks 5 000 W,
   * which is why the material matters more than the thickness.
   */
  drive: ({ v, f }) => ({
    scale: 0.55 + (v.thicknessMm / 200) * 0.85,
    color: f.woolW > 150 ? "#e0722c" : f.woolW > 40 ? "#d8a45c" : "#cfd6e0",
    glow: Math.min(1, f.woolW / 220),
    rate: 0.15 + Math.min(3, f.woolW / 80),
  }),
};

/* C5.2 — Defining the design problem. */
const CRITERIA_OR_LIMIT: ArchetypeSpec = {
  id: "g6c5-criteria-or-limit",
  title: "Criterion or Constraint?",
  tagline: "The brief: keep 200 mL of water above 70 degrees for 30 minutes. Sort what it asks of you.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Separate the criteria a design must satisfy from the constraints it must work within.",
    "Explain why a design problem needs both before any building starts.",
  ],
  misconceptions: ["A design problem is just a description of the thing to build"],
  categories: [
    { id: "criterion", name: "Criterion", hint: "how you will judge success" },
    { id: "constraint", name: "Constraint", hint: "a limit you cannot exceed" },
  ],
  specimens: [
    { id: "temp", name: "Still above 70 degrees after 30 minutes", category: "criterion",
      because: "This is the test the finished cup must pass. It is measurable, so two designs can be ranked by it.",
      art: { art: "glassware", which: "testTube", level: 0.35, color: "#c0392b" } },
    { id: "hold", name: "Cool enough on the outside to hold", category: "criterion",
      because: "Another measure of success, and one that pulls the same way: good insulation keeps the outside cool.",
      art: { art: "apparatus", which: "burner" } },
    { id: "pour", name: "The drink can be poured without dismantling it", category: "criterion",
      because: "A requirement the design must meet to be useful. A perfectly sealed cup would pass the temperature test and fail here.",
      art: { art: "glassware", which: "flask", level: 0.5 } },
    { id: "cost", name: "No more than two pounds of materials", category: "constraint",
      because: "A limit on resources. It rules out options rather than measuring success, however well they would work.",
      art: { art: "sphere", color: "#d9b45b", radius: 0.36 } },
    { id: "thickness", name: "Walls no thicker than 20 mm", category: "constraint",
      because: "A limit on the design space. Insulation always improves with thickness, so without this limit there is no problem to solve.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "time", name: "Built within one 40-minute lesson", category: "constraint",
      because: "A limit on time. It shapes what you can attempt, but no one will judge the cup by how long it took.",
      art: { art: "apparatus", which: "spring" } },
  ],
};

/* C5.3 — Designing and building a device. */
const BUILD_THE_CUP: ArchetypeSpec = {
  id: "g6c5-build-the-cup",
  title: "Build the Cup",
  tagline: "Add one layer at a time, and know which route each layer closes.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3", "MS-ETS1-2"] },
  learningGoals: [
    "Choose layers that block conduction, convection, radiation and evaporation.",
    "Explain the job each part of a device does.",
  ],
  misconceptions: ["More layers of any material give better insulation"],
  specimens: [
    {
      id: "cup", name: "Insulated cup", art: { art: "glassware", which: "beaker", level: 0.6 },
      parts: [
        { id: "inner", name: "Inner cup", at: [0, 0.12],
          note: "Holds the 200 g of water and forms the boundary of the system. Thin plastic: it barely insulates on its own." },
        { id: "foam", name: "Foam sleeve, 5 mm", at: [-0.32, 0.24],
          note: "Foam conducts at 0.03 W/m K because it is mostly trapped air. This one layer lifts the 30-minute result from 66 to 79 degrees." },
        { id: "lid", name: "Lid", at: [0.02, -0.42],
          note: "Stops evaporation and the rising warm air above the drink. Five grams of water evaporating would carry off 11 300 J, worth 13 degrees." },
        { id: "foil", name: "Shiny foil layer", at: [0.34, -0.18],
          note: "Emissivity near 0.05 instead of 0.9, so it radiates far less. Worth about 2 degrees here, and much more in a vacuum flask." },
        { id: "base", name: "Foam base pad", at: [-0.3, -0.26],
          note: "The table is a large cold object in direct contact. A pad turns a conduction path into another insulated one." },
        { id: "gap", name: "Air gap", at: [0.32, 0.24],
          note: "Trapped air conducts at 0.026 W/m K, better than any solid here. It must be thin, or convection currents start carrying heat across it." },
      ],
    },
  ],
  /*
   * The cup is filled at 90 degrees and left to cool on Newton's law, which is
   * the run the whole topic is about, and then filled again. The steam is the
   * evaporation the lid is there to stop — heaviest while the drink is hottest,
   * and gone once it is near the room. The break at 70 degrees is the brief's
   * pass mark, and the drink visibly gives it up part way down.
   */
  drive: ({ t }) => {
    const u = (t % 26) / 26;
    const tempC = 21 + 69 * Math.exp(-u * 1.2);
    return {
      level: 0.6,
      color: drinkColor(tempC),
      bubbles: Math.max(0, (tempC - 45) / 60),
      glow: Math.max(0, (tempC - 45) / 90),
      rate: 0.2 + (tempC - 21) / 30,
    };
  },
};

/* C5.4 — Testing a device and collecting data. */
const TEST_THE_CUP: ArchetypeSpec = {
  id: "g6c5-test-the-cup",
  title: "Test It and Watch It Cool",
  tagline: "Run the clock on your cup and read the curve, not just the last number.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3", "MS-ETS1-4"] },
  learningGoals: [
    "Collect cooling data and describe the shape of the curve.",
    "Judge a design against a numerical target rather than by feel.",
  ],
  misconceptions: ["A hot drink cools at a steady number of degrees per minute"],
  specimens: [{ id: "cup", name: "The cup under test", art: { art: "glassware", which: "beaker", level: 0.6 } }],
  variables: [
    { key: "foamMm", label: "Foam sleeve thickness (mm)", min: 1, max: 20, step: 1, default: 5 },
    { key: "minutes", label: "Time since filling (minutes)", min: 0, max: 60, step: 1, default: 30 },
  ],
  // 200 g of water at 90 degrees, room at 21, cup area 0.02 m2. Heat crosses
  // the foam (k = 0.035 W/m K) and then the surface air film (h = 10 W/m2 K),
  // so 1/U is the sum of the two resistances and the water follows Newton's
  // law of cooling with tau = m c / (U A).
  measure: (v) => {
    const area = 0.02, room = 21, heatCapacity = 0.2 * 4186;
    const u = 1 / (v.foamMm / 1000 / 0.035 + 1 / 10);
    const tau = heatCapacity / (u * area);
    const temp = room + (90 - room) * Math.exp((-v.minutes * 60) / tau);
    return {
      tempC: temp,
      dropC: 90 - temp,
      tauMinutes: tau / 60,
    };
  },
  plot: { x: "minutes", y: "tempC", xLabel: "Time (minutes)", yLabel: "Water temperature (degrees C)" },
  /*
   * The cup under test really is the cup you specified: a 20 mm sleeve makes it
   * visibly fatter than a 1 mm one, and the drink inside is at the temperature
   * Newton's law of cooling puts it at. At 30 minutes that is 70.4 degrees on
   * 1 mm of foam and 85.7 on 20 mm — the difference between failing the brief
   * and passing it comfortably, and the drink goes grey the moment it drops
   * through the 70 degree target.
   */
  drive: ({ v, f }) => ({
    scale: 0.8 + (v.foamMm / 20) * 0.45,
    level: 0.6,
    color: drinkColor(f.tempC),
    bubbles: Math.max(0, (f.tempC - 45) / 60),
    glow: Math.max(0, (f.tempC - 50) / 80),
    rate: 0.15 + (f.tempC - 21) / 30,
  }),
};

/* C5.5 — Comparing competing designs. */
const TWO_DESIGNS: ArchetypeSpec = {
  id: "g6c5-two-designs",
  title: "Two Designs, One Brief",
  tagline: "The slim one looks better. The scruffy one passes.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-3"] },
  learningGoals: [
    "Compare designs against the criteria and constraints, not against taste.",
    "Identify which feature of a design does most of the work.",
  ],
  misconceptions: ["The design that looks better engineered performs better"],
  variables: [
    { key: "minutes", label: "Time since filling (minutes)", min: 0, max: 60, step: 1, default: 30 },
    { key: "roomC", label: "Room temperature (degrees C)", min: 5, max: 30, step: 1, default: 21 },
  ],
  /*
   * Both cups hold 200 g of water at 90 degrees with 0.02 m2 of wall, and heat
   * leaves through the wall and then through the surface air film at about
   * 10 W/m2 K, the two resistances adding. Design A is 5 mm of foam at
   * 0.035 W/m K, design B a 3 mm air gap at 0.026: A gives U = 4.12 W/m2 K and
   * B gives 4.64, so on the wall alone B is only half a degree behind. What
   * separates them is the lid. B has none, so about 5 g evaporates in half an
   * hour and the latent heat of vaporisation, 2 260 J per gram, takes 11 300 J
   * out of a cup that only needs 837 J to shift a degree.
   */
  measure: (v) => {
    const area = 0.02, capacity = 0.2 * 4186;
    const cool = (u: number) =>
      v.roomC + (90 - v.roomC) * Math.exp((-v.minutes * 60 * u * area) / capacity);
    const evaporatedG = (5 / 30) * v.minutes;
    const designB = cool(1 / (0.003 / 0.026 + 0.1)) - (evaporatedG * 2260) / capacity;
    return {
      designATempC: cool(1 / (0.005 / 0.035 + 0.1)),
      designBTempC: designB,
      designBWallOnlyTempC: cool(1 / (0.003 / 0.026 + 0.1)),
      waterEvaporatedFromBG: evaporatedG,
      energyLostAsSteamFromBJ: evaporatedG * 2260,
    };
  },
  specimens: [
    { id: "sleeve", name: "A: 5 mm foam sleeve with a lid",
      because: "79 degrees at 30 minutes, walls 6 mm, sixty pence. It passes the 70 degree target with room to spare, mostly because of the lid.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "double", name: "B: double wall, 3 mm air gap, no lid",
      because: "The wall alone would give 78 degrees, but five grams evaporate from the open top and take 11 300 J with them. It ends at 64 and fails, at twice the cost.",
      art: { art: "glassware", which: "flask", level: 0.6, bubbles: 3 } },
  ],
  /*
   * Run the clock and the two designs separate in front of you. A holds its
   * colour; B steams the whole time, drops below the 70 degree pass mark and
   * goes grey, and its level falls as the water it is losing leaves the cup for
   * good. The steam is not decoration — it is where B's missing 13 degrees
   * went, and it is the only real difference between the two walls.
   */
  drive: ({ f, index }) => {
    const tempC = index === 0 ? f.designATempC : f.designBTempC;
    return {
      level: index === 0 ? 0.6 : 0.6 - Math.min(0.18, f.waterEvaporatedFromBG / 55),
      color: drinkColor(tempC),
      bubbles: index === 0
        ? Math.max(0, (tempC - 60) / 90)
        : 0.3 + Math.max(0, (tempC - 45) / 55),
      glow: Math.max(0, (tempC - 50) / 80),
      rate: 0.15 + Math.max(0, tempC - 21) / 28,
    };
  },
};

/*
 * C5.6 — Redesigning based on evidence.
 *
 * The 30-minute reading each version of the cup actually scored, one per stage
 * of the rail: plain, plain again while the loss is found, lid, foam, foil and
 * base pad, and the projection for one more layer of foam.
 */
const VERSION_RESULTS = [52, 52, 66, 79, 81, 85];

const ONE_CHANGE: ArchetypeSpec = {
  id: "g6c5-one-change",
  title: "One Change at a Time",
  tagline: "Four versions of the same cup, each answering the last set of results.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Use test results to decide what to change next in a design.",
    "Explain why changing one feature at a time keeps the evidence readable.",
  ],
  misconceptions: ["Redesign means starting again from nothing"],
  specimens: [{ id: "cup", name: "Cup, version 4", art: { art: "glassware", which: "beaker", level: 0.6 } }],
  stages: [
    { name: "Version 1", at: 0,
      caption: "Plain cup, open top: 52 degrees at 30 minutes. Target missed by 18." },
    { name: "Find the biggest loss", at: 0.2,
      caption: "Steam above the drink is the clue. Evaporating 5 g takes 11 300 J, worth 13 degrees on its own." },
    { name: "Version 2", at: 0.4,
      caption: "Add a lid, change nothing else: 66 degrees. A gain of 14, and still 4 degrees short." },
    { name: "Version 3", at: 0.6,
      caption: "Add a 5 mm foam sleeve: 79 degrees. Now it passes. Because only one thing changed, the 13 degree gain belongs to the foam." },
    { name: "Version 4", at: 0.8,
      caption: "Add foil and a base pad: 81 degrees. A real gain, but a small one: radiation was never the main route out." },
    { name: "Where next", at: 1,
      caption: "Another 5 mm of foam would add about 4 degrees, the next 10 mm only 3 more, and 20 mm is the limit the brief allows. Each change buys less than the one before." },
  ],
  /*
   * Each version of the cup is shown at the 30-minute reading it actually
   * scored: 52 degrees, then 66 with the lid, then 79 with the foam, then 81
   * with the foil and the base pad. The steam vanishes at version 2, because
   * that is the change the lid made and the reason it was worth 14 degrees, and
   * the drink crosses back over the 70 degree pass mark at version 3 — the
   * moment the design starts working.
   */
  drive: ({ t }) => {
    const p = railPhase(t) * (VERSION_RESULTS.length - 1);
    const i = Math.min(VERSION_RESULTS.length - 2, Math.floor(p));
    const k = p - i;
    const tempC = VERSION_RESULTS[i] + (VERSION_RESULTS[i + 1] - VERSION_RESULTS[i]) * k;
    const lidOn = p >= 1.6;
    return {
      level: 0.6,
      color: drinkColor(tempC),
      bubbles: lidOn ? 0.05 : 0.75,
      glow: Math.max(0, (tempC - 50) / 60),
      rate: 0.2 + (tempC - 40) / 30,
    };
  },
};

export const g6c5WhatBlocksHeat = buildSim(WHAT_BLOCKS_HEAT);
export const g6c5CriteriaOrLimit = buildSim(CRITERIA_OR_LIMIT);
export const g6c5BuildTheCup = buildSim(BUILD_THE_CUP);
export const g6c5TestTheCup = buildSim(TEST_THE_CUP);
export const g6c5TwoDesigns = buildSim(TWO_DESIGNS);
export const g6c5OneChange = buildSim(ONE_CHANGE);
