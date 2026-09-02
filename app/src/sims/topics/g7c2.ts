import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C2 — Evidence for where a plant's mass comes from.
 *
 * Five simulations, one per subtopic:
 *
 *   C2.1  g7c2-soil-or-air        the intuitive but wrong answer   (compare)
 *   C2.2  g7c2-five-year-willow   Van Helmont's willow tree        (process)
 *   C2.3  g7c2-fifty-seven-grams  what the soil evidence shows     (investigate)
 *   C2.4  g7c2-weighing-the-wood  the case for air and water       (assemble)
 *   C2.5  g7c2-shown-or-assumed   evaluating, not asserting        (sort)
 *
 * Van Helmont's own figures run through the whole topic, converted once from
 * the units he published in 1648: 200 pounds of dried earth is 90.72 kg, the
 * 5 pound willow shoot is 2.27 kg, the tree that came out at 169 pounds
 * 3 ounces is 76.72 kg, and the 2 ounces the soil lost is 56.7 g. So the tree
 * gained 74.45 kg while the soil gave up 0.057 kg.
 */

/* ---------------------------------------------------------------- *
 * C2.1 — The intuitive but wrong answer
 * ---------------------------------------------------------------- */

const SOIL_OR_AIR: ArchetypeSpec = {
  id: "g7c2-soil-or-air",
  title: "Soil, or Air?",
  tagline: "Ask anyone where a tree's mass comes from. Then weigh the soil.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "State the common claim that a plant's mass comes from the soil.",
    "Recognise that almost all of a plant's dry mass is built from carbon dioxide and water.",
  ],
  misconceptions: [
    "A tree is made of soil that has been sucked up through the roots",
    "Air is too light to build anything solid",
  ],
  specimens: [
    {
      id: "soil", name: "The usual answer: the soil",
      because:
        "A 20 tonne oak, and no 20 tonne hole in the ground beneath it.",
      art: { art: "sphere", color: "#6f4b2c", radius: 0.5 },
    },
    {
      id: "air", name: "The measured answer: the air",
      because:
        "A tonne of dry wood is 1.65 tonnes of CO2, taken from the sky.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C2.2 — Van Helmont's willow tree experiment
 * ---------------------------------------------------------------- */

const FIVE_YEAR_WILLOW: ArchetypeSpec = {
  id: "g7c2-five-year-willow",
  title: "Five Years, One Willow, One Balance",
  tagline: "Jan Baptist van Helmont planted a shoot, waited five years, and weighed everything.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Describe an experiment that tests where a plant's added mass comes from.",
    "Read a mass balance across the start and end of a long investigation.",
  ],
  misconceptions: [
    "Old experiments are too crude to be worth studying",
    "The soil in a pot is used up as the plant grows",
  ],
  specimens: [
    {
      id: "pot", name: "The pot of dried earth on the balance",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#8a6a45", precipitate: 0.9 },
    },
  ],
  stages: [
    {
      name: "Dry the soil", at: 0,
      caption: "200 pounds of earth, dried in an oven and weighed: 90.72 kg into the pot.",
    },
    {
      name: "Plant the shoot", at: 0.2,
      caption: "A willow shoot of 5 pounds, 2.27 kg, is planted. The pot is covered against dust.",
    },
    {
      name: "Water only", at: 0.4,
      caption: "Five years of rainwater. Nothing else is ever added to the pot.",
    },
    {
      name: "Weigh the tree", at: 0.6,
      caption: "The willow comes out at 169 pounds 3 ounces: 76.72 kg. It gained 74.45 kg.",
    },
    {
      name: "Weigh the soil", at: 0.8,
      caption: "The earth is dried again. It weighs 2 ounces less than before: a loss of 56.7 g.",
    },
    {
      name: "Compare", at: 1,
      caption: "74.45 kg gained against 0.057 kg lost. The soil cannot be where the wood came from.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C2.3 — What the soil-mass evidence actually shows
 * ---------------------------------------------------------------- */

const FIFTY_SEVEN_GRAMS: ArchetypeSpec = {
  id: "g7c2-fifty-seven-grams",
  title: "Fifty-Seven Grams Against Seventy-Four Kilograms",
  tagline: "Put the two measurements next to each other and work out what share the soil could explain.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Calculate what fraction of a plant's mass gain a measured soil loss could account for.",
    "Use a quantitative comparison to rule out an explanation.",
  ],
  misconceptions: [
    "A small soil loss still explains a large plant gain",
    "You cannot rule anything out from a single experiment",
  ],
  specimens: [
    {
      id: "rain", name: "The rainwater added, and nothing else",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#7fb3d5" },
    },
  ],
  variables: [
    { key: "treeGainKg", label: "Mass the tree gained (kg)", min: 1, max: 100, step: 0.05, default: 74.45 },
    { key: "soilLossG", label: "Mass the dried soil lost (g)", min: 0, max: 500, step: 1, default: 57 },
  ],
  /**
   * Straight arithmetic on the two measurements, and one step further.
   *
   * Fresh willow wood is about half water, so the dry mass gained is half the
   * measured gain. Dry wood is about 45 per cent carbon by mass, and carbon is
   * 12.011 of carbon dioxide's 44.009, so every gram of carbon fixed came from
   * 3.664 g of carbon dioxide. Air is 0.042 per cent carbon dioxide by volume,
   * and at 20 C a mole of gas fills 24.06 dm3, so the volume of ordinary air
   * the tree had to draw on follows directly.
   */
  measure: (v) => {
    const soilKg = v.soilLossG / 1000;
    const dryMassKg = v.treeGainKg * 0.5;
    const carbonKg = dryMassKg * 0.45;
    const carbonDioxideKg = carbonKg * (44.009 / 12.011);
    const carbonDioxideM3 = (carbonDioxideKg / 44.009) * 24.06;
    return {
      soilShareOfGainPercent: (soilKg / v.treeGainKg) * 100,
      onePartIn: soilKg > 0 ? v.treeGainKg / soilKg : 0,
      massFromElsewhereKg: v.treeGainKg - soilKg,
      dryMassKg,
      carbonDioxideUsedKg: carbonDioxideKg,
      airDrawnOnM3: carbonDioxideM3 / 0.00042,
    };
  },
  plot: {
    x: "treeGainKg", y: "soilShareOfGainPercent",
    xLabel: "Mass the tree gained (kg)", yLabel: "Share the soil could explain (%)",
  },
};

/* ---------------------------------------------------------------- *
 * C2.4 — Building the case for air and water
 * ---------------------------------------------------------------- */

const WEIGHING_THE_WOOD: ArchetypeSpec = {
  id: "g7c2-weighing-the-wood",
  title: "Weighing the Wood Itself",
  tagline: "Take a piece of dry wood apart by element and every gram has an address.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Account for a plant's dry mass by element and name the source of each.",
    "Build an evidence-based case that mass comes from carbon dioxide and water.",
  ],
  misconceptions: [
    "Minerals from the soil make up most of a plant",
    "Water only passes through a plant and adds nothing to it",
  ],
  specimens: [
    {
      id: "woodcell", name: "Wood: a cell wall of cellulose",
      art: { art: "cell", plant: true },
      parts: [
        {
          id: "carbon", name: "Carbon, about 45 per cent", at: [-0.64, -0.36],
          note: "All of it entered as CO2 through the stomata.",
        },
        {
          id: "oxygen", name: "Oxygen, about 42 per cent", at: [0.6, -0.4],
          note: "From carbon dioxide and from water, in the sugar.",
        },
        {
          id: "hydrogen", name: "Hydrogen, about 6 per cent", at: [0.68, 0.18],
          note: "Every atom of it came up the stem in water.",
        },
        {
          id: "minerals", name: "Minerals, under 1 per cent", at: [-0.08, 0.5],
          note: "Nitrate, potassium, magnesium. This is the soil's share.",
        },
        {
          id: "air", name: "The air it drew on", at: [-0.7, 0.3],
          note: "About 80 000 m3 of ordinary air for a 74 kg willow.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C2.5 — Evaluating, not asserting, the conclusion
 * ---------------------------------------------------------------- */

const SHOWN_OR_ASSUMED: ArchetypeSpec = {
  id: "g7c2-shown-or-assumed",
  title: "Shown by the Data, or Assumed?",
  tagline: "Van Helmont measured two things. Decide which claims his numbers can carry.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Distinguish a conclusion the evidence supports from one that goes beyond it.",
    "Identify what a well-designed experiment did not measure.",
  ],
  misconceptions: [
    "A famous scientist's conclusion must follow from their data",
    "Ruling out one explanation proves another",
  ],
  categories: [
    { id: "shown", name: "His numbers show it", hint: "follows from the two masses he measured" },
    { id: "beyond", name: "Goes beyond his data", hint: "true or not, he never measured it" },
  ],
  specimens: [
    {
      id: "gain", name: "The willow gained 74.45 kg", category: "shown",
      because: "Straight subtraction: 76.72 kg out, 2.27 kg in. This is a measurement, not an interpretation.",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#8a6a45", precipitate: 0.9 },
    },
    {
      id: "soilloss", name: "The soil gave up only 57 g", category: "shown",
      because: "He dried the earth and weighed it both times. The loss is 0.08 per cent of the tree's gain.",
      art: { art: "sphere", color: "#6f4b2c", radius: 0.5 },
    },
    {
      id: "notsoil", name: "The soil is not the source", category: "shown",
      because: "One part in 1306 cannot build the other 1305. The data rules the soil out even without naming a replacement.",
      art: { art: "cell", plant: true },
    },
    {
      id: "water", name: "Water alone built the tree", category: "beyond",
      because: "This was his own conclusion, and it does not follow. Water was simply the only input he thought to measure.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "air", name: "Air supplies most of the dry mass", category: "beyond",
      because: "True, but nothing in his pot could show it. He had no way to weigh a gas; that came a century later.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "light", name: "Light energy drives the building", category: "beyond",
      because: "Also true, and also invisible to this experiment. Ingenhousz showed light was needed in 1779.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
  ],
};

export const g7c2SoilOrAir = buildSim(SOIL_OR_AIR);
export const g7c2FiveYearWillow = buildSim(FIVE_YEAR_WILLOW);
export const g7c2FiftySevenGrams = buildSim(FIFTY_SEVEN_GRAMS);
export const g7c2WeighingTheWood = buildSim(WEIGHING_THE_WOOD);
export const g7c2ShownOrAssumed = buildSim(SHOWN_OR_ASSUMED);
