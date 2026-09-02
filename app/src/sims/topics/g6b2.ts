import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B2 — Cell structure and function.
 *
 * Six simulations, one per subtopic. The three organelles a student must know
 * by name each get an `explore`, because naming a part is worthless unless the
 * part's shape is visibly the reason it can do its job: a mitochondrion is
 * folded, a chloroplast is stacked, a nucleus is wrapped and pierced. The
 * membrane instead gets an `investigate`, since "selectively permeable" only
 * becomes real when a cell measurably swells; the wall gets the plant-animal
 * `compare` it is the whole reason for; and B2.6 pulls the parts back together
 * as an `assemble`, where the cell fails until every job is covered.
 */

/* ---------------------------------------------------------------- *
 * B2.1 — Cell membrane
 * ---------------------------------------------------------------- */

const MEMBRANE: ArchetypeSpec = {
  id: "g6b2-membrane",
  title: "Why a Cell Swells in Fresh Water",
  tagline: "Change the water around a red blood cell and watch it swell or shrink.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Explain that the membrane lets water through while controlling what else crosses.",
    "Predict whether a cell will swell, hold steady or shrink in a given solution.",
  ],
  misconceptions: [
    "The membrane is a sealed wall that nothing crosses",
    "Water only moves into a cell when the cell pumps it in",
  ],
  specimens: [{ id: "rbc", name: "Red blood cell", art: { art: "cell" } }],
  variables: [
    {
      key: "outside", label: "Solute outside the cell", unit: "mOsm/L",
      min: 50, max: 900, step: 10, default: 300,
    },
  ],
  /*
   * Boyle–van 't Hoff. Only the water in a cell can move, so relative volume is
   *   V = b + (1 - b) * C0 / C
   * with b = 0.35 the osmotically inactive share of a human red blood cell and
   * C0 = 300 mOsm/L, the concentration of blood plasma and of 0.9% saline.
   * Haemolysis begins near 150 mOsm/L (0.45% saline), which this relation puts
   * at 1.65 times the normal volume — the burst threshold used here.
   */
  measure: (v) => {
    const relativeVolume = 0.35 + 0.65 * (300 / v.outside);
    return {
      relativeVolume,
      saltPercent: (v.outside / 300) * 0.9,
      bursts: relativeVolume >= 1.65 ? 1 : 0,
    };
  },
  plot: {
    x: "outside", y: "relativeVolume",
    xLabel: "Solute outside (mOsm/L)", yLabel: "Cell volume (x normal)",
  },
  /*
   * The cell is the readout. Volume goes as the cube of the radius, so the
   * drawn size is the cube root of the relative volume — a cell at 1.65 times
   * its volume is only 1.18 times as wide, and drawing it 1.65 times as wide
   * would teach the wrong lesson about how much water it has taken in.
   * Past the haemolysis threshold it flushes pale and stops turning: it has
   * burst.
   */
  drive: ({ f }) => {
    const burst = f.relativeVolume >= 1.65;
    return {
      scale: Math.cbrt(Math.max(0.2, f.relativeVolume)),
      color: burst ? "#e0708a" : undefined,
      rate: burst ? 0 : 1,
      glow: burst ? 0.8 : 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B2.2 — Cell wall
 * ---------------------------------------------------------------- */

const WALL: ArchetypeSpec = {
  id: "g6b2-cell-wall",
  title: "The Box Around a Plant Cell",
  tagline: "Set a plant cell beside an animal cell and find what the wall changes.",
  kind: "compare",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Describe the cell wall as a stiff layer outside the membrane.",
    "Explain why a plant cell keeps its shape in fresh water and an animal cell does not.",
  ],
  misconceptions: [
    "The cell wall is the same thing as the cell membrane",
    "Animal cells have walls too, only thinner",
  ],
  specimens: [
    {
      id: "plant", name: "Plant cell: wall outside the membrane",
      because: "Stiff cellulose holds a box shape and stops the cell bursting.",
      art: { art: "cell", plant: true },
    },
    {
      id: "animal", name: "Animal cell: membrane only",
      because: "Soft and able to change shape, but it can burst in fresh water.",
      art: { art: "cell" },
    },
  ],
  variables: [
    {
      key: "outside", label: "Solute in the water around both cells", unit: "mOsm/L",
      min: 50, max: 900, step: 10, default: 300,
    },
  ],
  /*
   * The same water, the same osmosis, two different outsides — which is the
   * only fair way to show what the wall is for.
   *
   * Both cells follow Boyle-van 't Hoff, V = b + (1 - b) C0 / C with b = 0.35
   * and C0 = 300 mOsm/L. The animal cell simply obeys it and haemolyses at 1.65
   * times its volume, near 150 mOsm/L. The plant cell cannot: cellulose gives
   * way at well under a per cent of strain, so once the contents press on the
   * wall the wall presses back and the volume stops at full turgor. Going the
   * other way the contents shrink from the wall — plasmolysis — but the wall
   * holds the cell's outline where it was.
   */
  measure: (v) => {
    const relative = 0.35 + 0.65 * (300 / v.outside);
    return {
      animalVolume: relative,
      plantVolume: Math.min(1.05, relative),
      animalBursts: relative >= 1.65 ? 1 : 0,
      plasmolysed: relative < 0.88 ? 1 : 0,
      saltPercent: (v.outside / 300) * 0.9,
    };
  },
  /*
   * Volume goes as the cube of the radius, so both cells are drawn at the cube
   * root of their volume. The plant cell is held between 0.88 and 1.05 of its
   * volume by the wall, which is a width change of under six per cent across
   * the whole slider; the animal cell runs from 0.83 to 1.62 times as wide and
   * then bursts. Standing side by side, that is the argument for the wall.
   */
  drive: ({ f, index }) => {
    if (index === 0) {
      return { scale: Math.cbrt(Math.min(1.05, Math.max(0.88, f.animalVolume))), rate: 1 };
    }
    const burst = f.animalBursts > 0;
    return {
      scale: Math.cbrt(Math.max(0.2, f.animalVolume)),
      rate: burst ? 0 : 1,
      tilt: burst ? 0.72 : 0.24,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B2.3 — Nucleus
 * ---------------------------------------------------------------- */

const NUCLEUS: ArchetypeSpec = {
  id: "g6b2-nucleus",
  title: "The Cell's Instruction Store",
  tagline: "Open the nucleus and find where the instructions are kept and copied.",
  kind: "explore",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Identify the envelope, pores, chromatin and nucleolus of the nucleus.",
    "Explain that the nucleus stores DNA and sends copies of instructions out.",
  ],
  misconceptions: [
    "The nucleus makes the cell's energy",
    "DNA leaves the nucleus to build proteins",
  ],
  specimens: [
    {
      id: "nuc", name: "Nucleus", art: { art: "organelle", which: "nucleus" },
      parts: [
        {
          id: "envelope", name: "Nuclear envelope", at: [0, -0.47],
          note: "Two membranes keeping the DNA apart from the rest of the cell.",
        },
        {
          id: "pores", name: "Nuclear pores", at: [0.43, -0.22],
          note: "About 3,000 gateways, each 120 nm wide.",
        },
        {
          id: "chromatin", name: "Chromatin", at: [-0.31, 0.1],
          note: "DNA wound on protein spools. Unwound, it is about 2 m long.",
        },
        {
          id: "nucleolus", name: "Nucleolus", at: [0.09, 0.22],
          note: "The dense spot where ribosomes are built.",
        },
        {
          id: "sap", name: "Nucleoplasm", at: [-0.36, -0.3],
          note: "The jelly where DNA is copied into messages.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.4 — Mitochondria
 * ---------------------------------------------------------------- */

const MITOCHONDRIA: ArchetypeSpec = {
  id: "g6b2-mitochondria",
  title: "The Folded Power Plant",
  tagline: "Pick apart a mitochondrion and see why the folding is the point.",
  kind: "explore",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Name the outer membrane, cristae and matrix of a mitochondrion.",
    "Explain that folding the inner membrane adds working surface for releasing energy.",
  ],
  misconceptions: [
    "Mitochondria make energy from nothing",
    "Only animal cells have mitochondria",
  ],
  specimens: [
    {
      id: "mito", name: "Mitochondrion", art: { art: "organelle", which: "mitochondrion" },
      parts: [
        {
          id: "outer", name: "Outer membrane", at: [-0.43, -0.2],
          note: "A smooth skin. The organelle is 1 to 4 micrometres long.",
        },
        {
          id: "cristae", name: "Cristae", at: [0.02, -0.13],
          note: "Folds of the inner membrane, about five times the flat area.",
        },
        {
          id: "matrix", name: "Matrix", at: [-0.12, 0.19],
          note: "The fluid centre where sugar fragments meet oxygen.",
        },
        {
          id: "dna", name: "Its own DNA", at: [0.34, 0.17],
          note: "A small loop of DNA. Mitochondria copy themselves.",
        },
        {
          id: "atp", name: "ATP released", at: [0.45, -0.24],
          note: "About 30 ATP per glucose with oxygen, only 2 without it.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.5 — Chloroplasts
 * ---------------------------------------------------------------- */

const CHLOROPLASTS: ArchetypeSpec = {
  id: "g6b2-chloroplasts",
  title: "Where a Leaf Catches Light",
  tagline: "Look inside a chloroplast and find the stacks that trap sunlight.",
  kind: "explore",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Identify the thylakoids, grana and stroma of a chloroplast.",
    "Explain that chlorophyll absorbs light energy used to build sugar.",
  ],
  misconceptions: [
    "Plants take their food in through their roots",
    "Chloroplasts are green because plants need green light",
  ],
  specimens: [
    {
      id: "chloro", name: "Chloroplast", art: { art: "organelle", which: "chloroplast" },
      parts: [
        {
          id: "envelope", name: "Double envelope", at: [-0.44, -0.18],
          note: "Two membranes holding the whole organelle together.",
        },
        {
          id: "thylakoid", name: "Thylakoid disc", at: [-0.04, -0.17],
          note: "A flat sac full of chlorophyll. Light is caught here.",
        },
        {
          id: "granum", name: "Granum", at: [0.29, 0.07],
          note: "A stack of discs. A leaf cell holds 20 to 100 chloroplasts.",
        },
        {
          id: "stroma", name: "Stroma", at: [-0.21, 0.22],
          note: "Fluid where carbon dioxide is built into sugar.",
        },
        {
          id: "chlorophyll", name: "Chlorophyll", at: [0.45, -0.22],
          note: "Absorbs blue and red light, reflects the green you see.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.6 — Relating structure to whole-cell function
 * ---------------------------------------------------------------- */

const BUILD_A_CELL: ArchetypeSpec = {
  id: "g6b2-build-a-cell",
  title: "Build a Cell That Works",
  tagline: "Add one part at a time and find the job the cell still cannot do.",
  kind: "assemble",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-2"] },
  learningGoals: [
    "Match each organelle to the job it does for the whole cell.",
    "Explain that a cell survives because its parts work as one system.",
  ],
  misconceptions: [
    "Organelles are just decoration inside a cell",
    "A cell could manage with only a nucleus",
  ],
  specimens: [
    {
      id: "cell", name: "A plant cell under construction",
      art: { art: "cell", plant: true },
      parts: [
        {
          id: "membrane", name: "Cell membrane", at: [0, -0.46],
          note: "Chooses what enters and leaves. Without it, the contents leak.",
        },
        {
          id: "nucleus", name: "Nucleus", at: [-0.13, -0.09],
          note: "Holds the instructions for every protein the cell builds.",
        },
        {
          id: "mito", name: "Mitochondrion", at: [0.33, -0.31],
          note: "Releases energy from sugar. Without it there is no ATP.",
        },
        {
          id: "chloro", name: "Chloroplast", at: [-0.4, 0.23],
          note: "Makes the sugar in the first place, using light.",
        },
        {
          id: "er", name: "Rough ER", at: [0.32, 0.25],
          note: "Studded with ribosomes, where proteins are assembled.",
        },
        {
          id: "golgi", name: "Golgi body", at: [-0.35, -0.34],
          note: "Packs finished proteins and ships them out.",
        },
        {
          id: "wall", name: "Cell wall", at: [0.45, 0.06],
          note: "Stiff cellulose outside the membrane, holding the shape.",
        },
      ],
    },
  ],
};

export const g6b2Membrane = buildSim(MEMBRANE);
export const g6b2CellWall = buildSim(WALL);
export const g6b2Nucleus = buildSim(NUCLEUS);
export const g6b2Mitochondria = buildSim(MITOCHONDRIA);
export const g6b2Chloroplasts = buildSim(CHLOROPLASTS);
export const g6b2BuildACell = buildSim(BUILD_A_CELL);
