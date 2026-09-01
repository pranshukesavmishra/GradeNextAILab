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
  specimens: [{ id: "wall", name: "One square metre of wall", art: { art: "apparatus", which: "stand" } }],
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
  specimens: [
    { id: "sleeve", name: "A: 5 mm foam sleeve with a lid",
      because: "79 degrees at 30 minutes, walls 6 mm, sixty pence. It passes the 70 degree target with room to spare, mostly because of the lid.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "double", name: "B: double wall, 3 mm air gap, no lid",
      because: "The wall alone would give 78 degrees, but five grams evaporate from the open top and take 11 300 J with them. It ends at 64 and fails, at twice the cost.",
      art: { art: "glassware", which: "flask", level: 0.6, bubbles: 3 } },
  ],
};

/* C5.6 — Redesigning based on evidence. */
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
      caption: "Doubling the foam would add about 3 degrees and break the 20 mm limit. The design is finished when the next change costs more than it earns." },
  ],
};

export const g6c5WhatBlocksHeat = buildSim(WHAT_BLOCKS_HEAT);
export const g6c5CriteriaOrLimit = buildSim(CRITERIA_OR_LIMIT);
export const g6c5BuildTheCup = buildSim(BUILD_THE_CUP);
export const g6c5TestTheCup = buildSim(TEST_THE_CUP);
export const g6c5TwoDesigns = buildSim(TWO_DESIGNS);
export const g6c5OneChange = buildSim(ONE_CHANGE);
