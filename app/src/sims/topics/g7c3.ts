import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C3 — Cellular respiration.
 *
 * Five simulations, one per subtopic:
 *
 *   C3.1  g7c3-how-much-air        naming the inputs               (investigate)
 *   C3.2  g7c3-three-tests         naming the outputs              (sort)
 *   C3.3  g7c3-inside-a-mitochondrion  where in the cell           (explore)
 *   C3.4  g7c3-two-organelles      photosynthesis beside respiration (compare)
 *   C3.5  g7c3-a-leaf-all-day      respiration in plants too       (process)
 *
 * Respiration's equation is photosynthesis run the other way:
 *
 *     C6H12O6 + 6 O2  ->  6 CO2 + 6 H2O      dH = -2803 kJ per mole
 *
 * Per gram of glucose that is 1.066 g of oxygen used, 1.466 g of carbon
 * dioxide and 0.600 g of water made, and 15.56 kJ released. Those four
 * numbers are the arithmetic the whole topic rests on.
 */

/* ---------------------------------------------------------------- *
 * C3.1 — Naming the inputs
 * ---------------------------------------------------------------- */

const HOW_MUCH_AIR: ArchetypeSpec = {
  id: "g7c3-how-much-air",
  title: "How Much Air Does It Take?",
  tagline: "Sit still, or run. Either way your cells are burning sugar with oxygen.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Name glucose and oxygen as the inputs to cellular respiration.",
    "Calculate the oxygen and sugar an activity demands from body mass and effort.",
  ],
  misconceptions: [
    "Breathing and respiration are the same thing",
    "You only respire when you exercise",
  ],
  specimens: [
    { id: "muscle", name: "Muscle cell, mid-effort", art: { art: "cell" } },
  ],
  variables: [
    { key: "massKg", label: "Body mass (kg)", min: 20, max: 120, step: 1, default: 60 },
    { key: "mets", label: "Effort (METs: 1 sitting, 4 brisk walk, 10 running)", min: 1, max: 16, step: 0.5, default: 1 },
  ],
  /**
   * All four constants here are ones a student can look up.
   *
   * One MET is defined as 3.5 cm3 of oxygen per kilogram per minute, which is
   * roughly what a person uses sitting quietly.
   *
   * Burning glucose releases 2803 kJ per mole and takes six moles of oxygen,
   * and a mole of gas is 22.414 dm3 at standard conditions, so a litre of
   * oxygen carries 2803 / (6 x 22.414) = 20.84 kJ.
   *
   * Glucose is 180.156 g per mole, so 2803 / 180.156 = 15.56 kJ per gram.
   *
   * Air going in is 20.95 per cent oxygen and air coming out about 16 per
   * cent, so each breath gives up close to 4.9 percentage points of its
   * oxygen. Dividing by that gives the volume of air actually breathed.
   *
   * The respiratory quotient of glucose is 6 CO2 out per 6 O2 in, exactly 1,
   * so the carbon dioxide volume matches the oxygen volume.
   */
  measure: (v) => {
    const oxygenMlPerMin = v.mets * 3.5 * v.massKg;
    const oxygenLPerHour = (oxygenMlPerMin * 60) / 1000;
    const energyKJPerHour = oxygenLPerHour * 20.84;
    return {
      oxygenMlPerMin,
      oxygenLPerHour,
      energyKJPerHour,
      glucoseGPerHour: energyKJPerHour / 15.559,
      airBreathedLPerMin: oxygenMlPerMin / 1000 / 0.049,
      carbonDioxideLPerHour: oxygenLPerHour,
    };
  },
  plot: {
    x: "mets", y: "oxygenLPerHour",
    xLabel: "Effort (METs)", yLabel: "Oxygen used (litres per hour)",
  },
};

/* ---------------------------------------------------------------- *
 * C3.2 — Naming the outputs
 * ---------------------------------------------------------------- */

const THREE_TESTS: ArchetypeSpec = {
  id: "g7c3-three-tests",
  title: "Three Tests on a Flask of Peas",
  tagline: "Germinating peas in a stoppered flask. Which of these does the flask actually produce?",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Name carbon dioxide, water and released energy as the outputs of respiration.",
    "Match each output to the test that detects it.",
  ],
  misconceptions: [
    "Respiration produces oxygen",
    "Only animals respire, plants photosynthesise instead",
    "Seeds are not alive until they sprout leaves",
  ],
  categories: [
    { id: "out", name: "Respiration releases it", hint: "the flask makes more of it than it started with" },
    { id: "no", name: "It does not", hint: "used up, unchanged, or never involved" },
  ],
  specimens: [
    {
      id: "co2", name: "Limewater goes milky", category: "out",
      because:
        "Carbon dioxide. It turns limewater cloudy by making calcium carbonate. Each gram of glucose respired makes 1.466 g of it.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#eef2f5", precipitate: 0.7 },
    },
    {
      id: "water", name: "Cobalt chloride paper turns pink", category: "out",
      because:
        "Water. Blue anhydrous cobalt chloride goes pink when it takes up water. Respiring a gram of glucose makes 0.600 g of it.",
      art: { art: "glassware", which: "testTube", level: 0.34, color: "#e39ab0" },
    },
    {
      id: "heat", name: "The vacuum flask warms up", category: "out",
      because:
        "Energy, largely as heat. Living peas run several degrees warmer than boiled dead ones in the same flask, which is the control that matters.",
      art: { art: "sphere", color: "#e2703a", radius: 0.5, glow: 1 },
    },
    {
      id: "oxygen", name: "Oxygen gas", category: "no",
      because:
        "Used up, not made. Six O2 are consumed per glucose, and the flask's oxygen falls until a splint will no longer relight.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "glucose", name: "Glucose solution", category: "no",
      because:
        "The fuel, not the product. Its store is spent: that is why a seed that never reaches light eventually dies.",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#d9a441" },
    },
    {
      id: "nitrogen", name: "Nitrogen gas", category: "no",
      because:
        "Along for the ride. Nitrogen is 78 per cent of the flask's air at the start and 78 per cent at the end; respiration never touches it.",
      art: { art: "molecule", formula: "N2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C3.3 — Where in the cell this happens
 * ---------------------------------------------------------------- */

const INSIDE_A_MITOCHONDRION: ArchetypeSpec = {
  id: "g7c3-inside-a-mitochondrion",
  title: "Inside a Mitochondrion",
  tagline: "A micrometre long, folded like a concertina, and running a turbine.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Locate cellular respiration in the mitochondria of cells.",
    "Relate the folded inner membrane to the amount of respiration a cell can do.",
  ],
  misconceptions: [
    "Respiration happens in the lungs",
    "Plant cells have chloroplasts instead of mitochondria",
  ],
  specimens: [
    {
      id: "mito", name: "Mitochondrion",
      art: { art: "organelle", which: "mitochondrion" },
      parts: [
        {
          id: "outer", name: "Outer membrane", at: [-0.72, -0.28],
          note: "Smooth, and freely leaky to small molecules.",
        },
        {
          id: "inner", name: "Inner membrane", at: [-0.14, -0.46],
          note: "Folded to about five times the outer membrane's area.",
        },
        {
          id: "cristae", name: "Cristae", at: [0.44, -0.3],
          note: "The folds themselves. More folds, more respiration.",
        },
        {
          id: "matrix", name: "Matrix", at: [0.04, 0.46],
          note: "Where carbon is stripped off the fuel as CO2.",
        },
        {
          id: "synthase", name: "ATP synthase", at: [0.68, 0.14],
          note: "A turbine turning about 130 times a second, 3 ATP a turn.",
        },
        {
          id: "mtdna", name: "Its own DNA", at: [-0.56, 0.34],
          note: "16 569 base pairs in humans, inherited from the mother.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C3.4 — Comparing photosynthesis and respiration side by side
 * ---------------------------------------------------------------- */

const TWO_ORGANELLES: ArchetypeSpec = {
  id: "g7c3-two-organelles",
  title: "Two Organelles, Opposite Jobs",
  tagline: "One stores energy in a sugar. The other spends it. Same atoms, opposite direction.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7"] },
  learningGoals: [
    "Compare the inputs, outputs and sites of photosynthesis and respiration.",
    "Explain that the two processes move the same energy in opposite directions.",
  ],
  misconceptions: [
    "Respiration is simply photosynthesis in reverse, step for step",
    "Plants photosynthesise by day and respire only by night",
  ],
  specimens: [
    {
      id: "chloroplast", name: "Chloroplast: CO2 + H2O to sugar",
      because: "Takes in 2803 kJ per mole. Plant cells only, and only in the light.",
      art: { art: "organelle", which: "chloroplast" },
    },
    {
      id: "mitochondrion", name: "Mitochondrion: sugar to CO2 + H2O",
      because: "Gives out 2803 kJ per mole. Plants and animals, day and night.",
      art: { art: "organelle", which: "mitochondrion" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C3.5 — Respiration in plants and animals alike
 * ---------------------------------------------------------------- */

const A_LEAF_ALL_DAY: ArchetypeSpec = {
  id: "g7c3-a-leaf-all-day",
  title: "A Leaf, All Day and All Night",
  tagline: "Follow one leaf round the clock. Its mitochondria never stop.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Explain that plants respire continuously, as animals do.",
    "Describe the light compensation point, where photosynthesis and respiration balance.",
  ],
  misconceptions: [
    "Plants respire only at night",
    "A plant in a bedroom takes away your oxygen",
  ],
  specimens: [
    { id: "leafcell", name: "Leaf cell", art: { art: "cell", plant: true } },
  ],
  /**
   * The numbers in these captions come from one standard C3 leaf model:
   * gross photosynthesis 20 x I / (I + 400) micromoles of CO2 per square metre
   * per second, dark respiration 1.5 in the same units, full sun 2000
   * micromoles of photons per square metre per second. Those give a light
   * compensation point at 32 micromoles of photons, and a midday net uptake
   * of 20 x 2000/2400 - 1.5 = 15.2.
   */
  stages: [
    {
      name: "Midnight", at: 0,
      caption: "No light. Photosynthesis 0, respiration 1.5. The leaf gives out carbon dioxide.",
    },
    {
      name: "First light", at: 0.25,
      caption: "At 32 micromoles of photons the two exactly cancel: the compensation point.",
    },
    {
      name: "Mid-morning", at: 0.5,
      caption: "600 micromoles of photons. Photosynthesis 12.0, respiration 1.5, net uptake 10.5.",
    },
    {
      name: "Midday", at: 0.75,
      caption: "Full sun, 2000 micromoles. Net uptake 15.2 - about ten times its own respiration.",
    },
    {
      name: "Night again", at: 1,
      caption: "Back to a net loss of 1.5, but the day banked 9 g of sugar per square metre.",
    },
  ],
};

export const g7c3HowMuchAir = buildSim(HOW_MUCH_AIR);
export const g7c3ThreeTests = buildSim(THREE_TESTS);
export const g7c3InsideAMitochondrion = buildSim(INSIDE_A_MITOCHONDRION);
export const g7c3TwoOrganelles = buildSim(TWO_ORGANELLES);
export const g7c3ALeafAllDay = buildSim(A_LEAF_ALL_DAY);
