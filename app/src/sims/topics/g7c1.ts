import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C1 — Photosynthesis: inputs and outputs.
 *
 * Five simulations, one per subtopic:
 *
 *   C1.1  g7c1-what-goes-in        naming the inputs             (sort)
 *   C1.2  g7c1-what-comes-out      naming the outputs            (assemble)
 *   C1.3  g7c1-inside-a-chloroplast  where in the cell           (explore)
 *   C1.4  g7c1-same-atoms-new-arrangement  atoms rearranged      (process)
 *   C1.5  g7c1-counting-bubbles    conditions that affect rate   (investigate)
 *
 * One balanced equation runs through all five, so the numbers agree:
 *
 *     6 CO2 + 6 H2O  ->  C6H12O6 + 6 O2      dH = +2803 kJ per mole
 *
 * Molar masses used throughout: CO2 44.009, H2O 18.015, O2 31.998,
 * glucose 180.156 g/mol. Six carbon dioxide (264.05 g) and six water
 * (108.09 g) weigh 372.14 g; one glucose (180.16 g) and six oxygen
 * (191.99 g) weigh 372.15 g. Nothing is added and nothing is lost.
 */

/* ---------------------------------------------------------------- *
 * C1.1 — Naming the inputs
 * ---------------------------------------------------------------- */

const WHAT_GOES_IN: ArchetypeSpec = {
  id: "g7c1-what-goes-in",
  title: "What Actually Goes In",
  tagline: "Six things near a leaf. Only three of them are raw materials for photosynthesis.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Name carbon dioxide, water and light as the inputs to photosynthesis.",
    "Explain that soil minerals and nitrogen gas are not raw materials for photosynthesis.",
  ],
  misconceptions: [
    "Plants get their food from the soil",
    "Plants take in oxygen and give out carbon dioxide",
    "A plant can use the nitrogen in the air directly",
  ],
  categories: [
    { id: "input", name: "An input to photosynthesis", hint: "the leaf takes it in and uses it" },
    { id: "not", name: "Not an input", hint: "a product, or not used at all" },
  ],
  specimens: [
    {
      id: "co2", name: "Carbon dioxide from the air", category: "input",
      because:
        "Every carbon atom in a plant arrived this way. Air is only 0.042 per cent carbon dioxide, so a leaf has to move a great deal of air past its stomata.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "water", name: "Water drawn up by the roots", category: "input",
      because:
        "Twelve water molecules go in for every glucose made. The oxygen given off comes from this water, not from the carbon dioxide.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "light", name: "Light energy from the Sun", category: "input",
      because:
        "Not matter, but still an input: 2803 kJ has to be pushed in for every mole of glucose built. Chlorophyll absorbs it at about 430 nm and 662 nm.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
    {
      id: "oxygen", name: "Oxygen gas", category: "not",
      because:
        "A product, not a raw material. Six O2 leave for every glucose made, which is 192 g of oxygen per 180 g of sugar.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "glucose", name: "Glucose solution", category: "not",
      because:
        "The thing being built. A plant makes its own glucose; it does not drink it in, and it cannot absorb sugar through its roots.",
      art: { art: "glassware", which: "testTube", level: 0.7, color: "#d9a441" },
    },
    {
      id: "nitrogen", name: "Nitrogen gas", category: "not",
      because:
        "78 per cent of the air and useless to a leaf. The triple bond in N2 costs 945 kJ per mole to break, so plants take nitrogen as nitrate from the soil instead.",
      art: { art: "molecule", formula: "N2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C1.2 — Naming the outputs
 * ---------------------------------------------------------------- */

const WHAT_COMES_OUT: ArchetypeSpec = {
  id: "g7c1-what-comes-out",
  title: "Building the Output Side",
  tagline: "Click your way round a leaf cell and account for everything photosynthesis makes.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Name glucose and oxygen as the products of photosynthesis.",
    "Explain that the energy of sunlight ends up stored in the bonds of glucose.",
  ],
  misconceptions: [
    "Plants make oxygen for animals to breathe",
    "The oxygen released comes from carbon dioxide",
  ],
  specimens: [
    {
      id: "leafcell", name: "Palisade cell from a leaf",
      art: { art: "cell", plant: true },
      parts: [
        {
          id: "glucose", name: "Glucose, C6H12O6", at: [-0.62, -0.34],
          note: "One molecule per six CO2: 180.16 g of sugar.",
        },
        {
          id: "oxygen", name: "Oxygen, 6 O2", at: [0.58, -0.4],
          note: "192 g released. Every atom of it came from water.",
        },
        {
          id: "stored", name: "Stored chemical energy", at: [0.66, 0.2],
          note: "2803 kJ per mole, now held in C-C and C-H bonds.",
        },
        {
          id: "starch", name: "Starch grains", at: [-0.1, 0.5],
          note: "Glucose joined in long chains the cell can store.",
        },
        {
          id: "water", name: "Water, 6 H2O", at: [-0.7, 0.28],
          note: "Twelve water go in, six come back out. Net use: six.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C1.3 — Where in the cell this happens
 * ---------------------------------------------------------------- */

const INSIDE_A_CHLOROPLAST: ArchetypeSpec = {
  id: "g7c1-inside-a-chloroplast",
  title: "Inside a Chloroplast",
  tagline: "Five micrometres across, and the whole of the world's food supply starts here.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Locate photosynthesis in the chloroplasts of leaf cells.",
    "Relate the stacked thylakoid membranes to the job of catching light.",
  ],
  misconceptions: [
    "Photosynthesis happens everywhere in a plant",
    "Chlorophyll is green because it absorbs green light",
  ],
  specimens: [
    {
      id: "chloroplast", name: "Chloroplast",
      art: { art: "organelle", which: "chloroplast" },
      parts: [
        {
          id: "envelope", name: "Double envelope", at: [-0.72, -0.26],
          note: "Two membranes, 5 to 10 micrometres end to end.",
        },
        {
          id: "thylakoid", name: "Thylakoid", at: [-0.16, -0.46],
          note: "A flattened disc. Chlorophyll sits in its membrane.",
        },
        {
          id: "granum", name: "Granum", at: [0.42, -0.32],
          note: "A stack of 10 to 100 thylakoids; 40 to 60 stacks in all.",
        },
        {
          id: "stroma", name: "Stroma", at: [0.06, 0.44],
          note: "Fluid where rubisco fixes CO2 into sugar.",
        },
        {
          id: "chlorophyll", name: "Chlorophyll", at: [0.68, 0.16],
          note: "Absorbs 430 nm and 662 nm, reflects 550 nm. Hence green.",
        },
        {
          id: "dna", name: "Its own DNA", at: [-0.56, 0.36],
          note: "A circular genome of about 120 000 base pairs.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C1.4 — Photosynthesis as atoms rearranged
 * ---------------------------------------------------------------- */

const SAME_ATOMS_NEW_ARRANGEMENT: ArchetypeSpec = {
  id: "g7c1-same-atoms-new-arrangement",
  title: "The Same Atoms, Rearranged",
  tagline: "Count the atoms before, count them after. Not one is created and not one is lost.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Show that photosynthesis rearranges atoms rather than creating matter.",
    "Balance the atom counts on both sides of the photosynthesis equation.",
  ],
  misconceptions: [
    "Photosynthesis creates matter out of light",
    "Sugar atoms are made new inside the leaf",
  ],
  specimens: [
    { id: "co2", name: "Carbon dioxide", art: { art: "molecule", formula: "CO2" } },
  ],
  stages: [
    {
      name: "Before", at: 0,
      caption: "Six CO2 and six H2O. Count them: 6 C, 12 H, 18 O. Total mass 372.14 g.",
    },
    {
      name: "Split", at: 0.25,
      caption: "Light splits the water. Its hydrogen is held back; its oxygen is let go.",
    },
    {
      name: "Fix", at: 0.5,
      caption: "Rubisco joins each CO2 onto a five-carbon sugar in the stroma. No new atoms.",
    },
    {
      name: "Build", at: 0.75,
      caption: "The carbons are assembled into one six-carbon chain: C6H12O6, 180.16 g.",
    },
    {
      name: "After", at: 1,
      caption: "Glucose plus six O2. Count again: 6 C, 12 H, 18 O. Mass 372.15 g. Identical.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C1.5 — Conditions that affect the rate
 * ---------------------------------------------------------------- */

const COUNTING_BUBBLES: ArchetypeSpec = {
  id: "g7c1-counting-bubbles",
  title: "Counting Bubbles from Pondweed",
  tagline: "Move the lamp, change the water temperature, count the oxygen bubbles.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6"] },
  learningGoals: [
    "Explain how light intensity and temperature limit the rate of photosynthesis.",
    "Use the inverse square law to relate lamp distance to light intensity.",
  ],
  misconceptions: [
    "Twice as much light always gives twice as much photosynthesis",
    "Hotter is always better for a plant",
  ],
  specimens: [
    {
      id: "elodea", name: "Elodea sprig in hydrogencarbonate solution",
      art: { art: "glassware", which: "testTube", level: 0.78, color: "#4f9e5c", bubbles: 26 },
    },
  ],
  variables: [
    { key: "lampDistanceCm", label: "Lamp distance (cm)", min: 5, max: 50, step: 1, default: 10 },
    { key: "temperatureC", label: "Water temperature (C)", min: 5, max: 45, step: 1, default: 20 },
  ],
  /**
   * The standard pondweed experiment, modelled from its own constants.
   *
   * Light: a point lamp obeys the inverse square law, so intensity relative to
   * the 10 cm bench mark is (10/d)^2.
   *
   * Light response: a rectangular hyperbola, rate proportional to I/(I + 0.5),
   * half-saturating at I = 0.5 which is a lamp distance of about 14 cm. The
   * saturating rate is set so that the reference sprig at 10 cm and 20 C gives
   * the 30 bubbles per minute a class actually counts: 45 x 1/1.5 = 30.
   *
   * Temperature: enzyme-controlled, so Q10 = 2.0 referred to 20 C, up to the
   * 35 C where rubisco starts to denature; above that the rate falls to zero
   * by 45 C.
   *
   * A bubble is about 1 mm3, so 30 bubbles per minute is 1.8 cm3 of oxygen an
   * hour. At 20 C and 101.3 kPa a mole of gas fills 24.06 dm3, and six oxygen
   * come from every glucose, so that is 2.2 mg of glucose an hour.
   */
  measure: (v) => {
    const relativeLight = (10 / v.lampDistanceCm) ** 2;
    const lightFactor = relativeLight / (relativeLight + 0.5);
    const t = v.temperatureC;
    const q10 = 2 ** ((Math.min(t, 35) - 20) / 10);
    const denature = t <= 35 ? 1 : Math.max(0, (45 - t) / 10);
    const bubblesPerMinute = 45 * lightFactor * q10 * denature;
    const oxygenCm3PerHour = bubblesPerMinute * 60 * 0.001;
    const oxygenMol = oxygenCm3PerHour / 24060;
    return {
      relativeLight,
      bubblesPerMinute,
      oxygenCm3PerHour,
      glucoseMgPerHour: (oxygenMol / 6) * 180.156 * 1000,
      temperatureFactor: q10 * denature,
    };
  },
  plot: {
    x: "lampDistanceCm", y: "bubblesPerMinute",
    xLabel: "Lamp distance (cm)", yLabel: "Bubbles per minute",
  },
};

export const g7c1WhatGoesIn = buildSim(WHAT_GOES_IN);
export const g7c1WhatComesOut = buildSim(WHAT_COMES_OUT);
export const g7c1InsideAChloroplast = buildSim(INSIDE_A_CHLOROPLAST);
export const g7c1SameAtomsNewArrangement = buildSim(SAME_ATOMS_NEW_ARRANGEMENT);
export const g7c1CountingBubbles = buildSim(COUNTING_BUBBLES);
