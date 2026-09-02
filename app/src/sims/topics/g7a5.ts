import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit A · Topic A5 — Modeling extended structures.
 *
 * Five simulations, one per subtopic:
 *
 *   A5.1  g7a5-balls-and-sticks    ball-and-stick models          (explore)
 *   A5.2  g7a5-swell-them-up       space-filling models           (investigate)
 *   A5.3  g7a5-no-single-molecule  when there is no molecule      (sort)
 *   A5.4  g7a5-melting-two-ways   molecular against lattice      (compare)
 *   A5.5  g7a5-right-model         choosing the right model       (process)
 *
 * Every model here is judged by what it gets wrong as well as what it shows.
 * A5.2 does that with real crystallography: grow the atoms of a water molecule
 * from bare centres out to their true van der Waals radii and the balls and
 * sticks disappear into a single blob at 35% of full size, which is exactly
 * why the two drawings of the same molecule look nothing alike.
 */

/* ---------------------------------------------------------------- *
 * A5.1 — Ball-and-stick models
 * ---------------------------------------------------------------- */

const BALLS_AND_STICKS: ArchetypeSpec = {
  id: "g7a5-balls-and-sticks",
  title: "What the Sticks Are For",
  tagline: "A carbon dioxide molecule in balls and sticks: what it shows, and what it quietly lies about.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Interpret a ball-and-stick model: balls are atoms, sticks are bonds, angles are real.",
    "Identify what a ball-and-stick model exaggerates or leaves out.",
  ],
  misconceptions: [
    "There are real rods holding atoms apart",
    "The gaps between the balls are empty space inside the molecule",
  ],
  specimens: [
    {
      id: "co2", name: "Carbon dioxide, CO2",
      art: { art: "molecule", formula: "CO2" },
      parts: [
        {
          id: "balls", name: "The balls are atoms", at: [0.0, 0.05],
          note: "Coloured by an old convention that everyone now follows: carbon grey, oxygen red, hydrogen white, nitrogen blue.",
        },
        {
          id: "sticks", name: "The sticks are bonds", at: [0.19, -0.04],
          note: "Each stick is a shared pair of electrons. Here each one stands for a double bond, 0.116 nm long: shorter and far stronger than a single bond.",
        },
        {
          id: "angle", name: "180 degrees, and that matters", at: [-0.3, 0.16],
          note: "CO2 is dead straight. Each C=O bond is lopsided, but two opposite pulls cancel exactly, which is why CO2 does not dissolve in water nearly as readily as the bent water molecule does.",
        },
        {
          id: "rigid", name: "The lie: a bond is not a rod", at: [0.3, 0.18],
          note: "The real molecule flexes and stretches 7 x 10^13 times a second. That stretch absorbs infrared at 4.3 micrometres, which is precisely how CO2 warms the planet.",
        },
        {
          id: "size", name: "The other lie: the balls are too small", at: [-0.2, -0.24],
          note: "Drawn at true size the atoms would overlap and you would see no sticks at all. The gaps are drawn so you can see inside, not because they are there.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.2 — Space-filling models
 * ---------------------------------------------------------------- */

const SWELL_THEM_UP: ArchetypeSpec = {
  id: "g7a5-swell-them-up",
  title: "Grow the Atoms Until the Sticks Vanish",
  tagline: "The same water molecule, drawn with its atoms at anything from a tenth of true size to full size.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain what a space-filling model shows that a ball-and-stick model cannot.",
    "Use real atomic radii to work out why a space-filling molecule has no visible bonds.",
  ],
  misconceptions: [
    "A space-filling model shows a different molecule from the ball-and-stick one",
    "Atoms in a molecule are separated by empty space",
  ],
  specimens: [
    { id: "h2o", name: "Water, H2O", art: { art: "molecule", formula: "H2O" } },
  ],
  variables: [
    { key: "radiusPercent", label: "Atoms drawn at this share of true size (%)", min: 10, max: 120, step: 5, default: 30 },
  ],
  /*
   * All three numbers are measured, not chosen. In water the O-H distance is
   * 95.72 pm (microwave spectroscopy), and the van der Waals radii -- how far
   * out an atom's electrons keep other atoms -- are 152 pm for oxygen and
   * 120 pm for hydrogen (Bondi, 1964).
   *
   * So the two spheres already touch when they are drawn at
   * 95.72 / (152 + 120) = 35.2% of true size. Below that you see balls with a
   * gap for a stick; at 100% the model is one smooth solid, which is what a
   * neighbouring molecule actually meets.
   */
  measure: (v) => {
    const s = v.radiusPercent / 100;
    const gap = 95.72 - (152 + 120) * s;
    return {
      oxygenRadiusPm: 152 * s,
      hydrogenRadiusPm: 120 * s,
      gapPm: gap,
      overlapPercentOfBond: (100 * Math.max(0, -gap)) / 95.72,
    };
  },
  plot: {
    x: "radiusPercent", y: "gapPm",
    xLabel: "Atoms drawn at (% of true size)", yLabel: "Gap along the bond (pm)",
  },
};

/* ---------------------------------------------------------------- *
 * A5.3 — When there is no single molecule
 * ---------------------------------------------------------------- */

const NO_SINGLE_MOLECULE: ArchetypeSpec = {
  id: "g7a5-no-single-molecule",
  title: "Where Does One Molecule End?",
  tagline: "For three of these you can point at a single molecule. For the other three there is no such thing.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Distinguish substances made of separate molecules from substances made of endless networks.",
    "Explain that a formula like NaCl or SiO2 gives a ratio rather than the contents of one molecule.",
  ],
  misconceptions: [
    "Every substance is made of molecules",
    "A grain of salt is a heap of NaCl molecules",
  ],
  categories: [
    { id: "molecular", name: "Separate molecules", hint: "you can draw one and stop" },
    { id: "network", name: "One endless network", hint: "the bonding runs on to the edge of the crystal" },
  ],
  specimens: [
    {
      id: "water", name: "Water, H2O", category: "molecular",
      because: "Three atoms, then the molecule stops. Between molecules there are only weak attractions, which is why ice melts at 0 degrees and not at 800.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "co2", name: "Carbon dioxide, CO2", category: "molecular",
      because: "Three atoms and no more. Cool it and the separate molecules simply stack into dry ice, which turns straight back to gas at minus 78.5 degrees.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "methane", name: "Methane, CH4", category: "molecular",
      because: "Five atoms, one molecule, and almost nothing holding one molecule to the next: methane is still a gas at minus 161 degrees.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "salt", name: "Sodium chloride, NaCl", category: "network",
      because: "Every sodium ion is surrounded by six chlorides 0.282 nm away, and every chloride by six sodiums, on and on to the face of the crystal. NaCl is the ratio, not a molecule.",
      art: { art: "molecule", formula: "NaCl" },
    },
    {
      id: "diamond", name: "Diamond, C", category: "network",
      because: "Each carbon is bonded to four others, 0.154 nm away, throughout the stone. A diamond is one single molecule, and it will not melt below 3,500 degrees.",
      art: { art: "sphere", color: "#cfe6f2", radius: 0.36, glow: 0.6 },
    },
    {
      id: "quartz", name: "Quartz, SiO2", category: "network",
      because: "Each silicon holds four oxygens and each oxygen bridges two silicons, so the count works out at one Si per two O. Breaking that network takes 1,713 degrees.",
      art: { art: "sphere", color: "#dcd2b8", radius: 0.38 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.4 — Comparing molecular and lattice structures
 * ---------------------------------------------------------------- */

const MELTING_TWO_WAYS: ArchetypeSpec = {
  id: "g7a5-melting-two-ways",
  title: "801 Degrees Against Minus 78",
  tagline: "Two solids with three-atom formulas. One melts in a furnace; the other never even becomes a liquid.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Compare a lattice structure and a molecular structure using melting behaviour as evidence.",
    "Explain that melting breaks the forces between particles, not the bonds inside a molecule.",
  ],
  misconceptions: [
    "Melting a substance breaks its chemical bonds",
    "A substance with strong bonds must have a high melting point",
  ],
  specimens: [
    {
      id: "nacl", name: "Sodium chloride: one endless lattice",
      because:
        "To melt it you must pull apart the whole network, every ion from its six neighbours. That costs 787 kJ per mole of lattice energy, so salt melts at 801 degrees and boils at 1,413.",
      art: { art: "molecule", formula: "NaCl" },
    },
    {
      id: "co2", name: "Carbon dioxide: separate molecules",
      because:
        "The bonds inside are ferocious: 799 kJ per mole for each C=O. But they never break here. Melting only has to separate whole molecules from one another, which costs about 25 kJ per mole, so dry ice goes straight to gas at minus 78.5 degrees.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.5 — Choosing the right model for the job
 * ---------------------------------------------------------------- */

const RIGHT_MODEL: ArchetypeSpec = {
  id: "g7a5-right-model",
  title: "Four Questions, Four Different Models",
  tagline: "Nobody has ever drawn a correct picture of a molecule. Pick the wrong one on purpose, for a reason.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Choose a model of a substance to suit the question being asked.",
    "Describe the limitation of each model and explain why no single model does everything.",
  ],
  misconceptions: [
    "One of these models is the real picture and the rest are simplifications of it",
    "A better model is one that shows more detail",
  ],
  specimens: [
    { id: "water", name: "Water, drawn four ways", art: { art: "molecule", formula: "H2O" } },
  ],
  stages: [
    {
      name: "How many atoms?", at: 0,
      caption: "Use the formula. C6H12O6 tells you glucose has 24 atoms in 6 + 12 + 6, in half a second. It tells you nothing whatever about shape.",
    },
    {
      name: "What shape?", at: 0.25,
      caption: "Use ball-and-stick. It gives the angles that matter: 104.5 degrees in water, 109.5 in methane, 180 in carbon dioxide. It draws the atoms far too small.",
    },
    {
      name: "How do they pack?", at: 0.5,
      caption: "Use space-filling. It shows the shape a neighbouring molecule meets. In liquid water each molecule takes up 0.030 cubic nanometres, and you cannot see a single bond.",
    },
    {
      name: "How does it melt?", at: 0.75,
      caption: "Use a lattice diagram, showing many particles at once. One molecule has no melting point; melting is entirely about how molecules are held to each other.",
    },
    {
      name: "So which is right?", at: 1,
      caption: "None of them. Every model is wrong somewhere on purpose, and a good scientist picks the one whose wrongness does not matter for the question in hand.",
    },
  ],
};

export const g7a5BallsAndSticks = buildSim(BALLS_AND_STICKS);
export const g7a5SwellThemUp = buildSim(SWELL_THEM_UP);
export const g7a5NoSingleMolecule = buildSim(NO_SINGLE_MOLECULE);
export const g7a5MeltingTwoWays = buildSim(MELTING_TWO_WAYS);
export const g7a5RightModel = buildSim(RIGHT_MODEL);
