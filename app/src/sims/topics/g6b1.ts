import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B1 — Cells: the basic unit of life.
 *
 * Five simulations, one per teaching move the topic needs, written as content
 * against the shared archetype engine. B1.3 gets a sorter because deciding
 * whether a thing is alive is a judgement students must practise making;
 * B1.6 gets a comparison because scale is only meaningful against something
 * familiar.
 */

const CELL_THEORY: ArchetypeSpec = {
  id: "g6b1-cell-theory",
  title: "The Three Rules of Cell Theory",
  tagline: "Test three claims against real organisms and see which survive.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "State the three parts of cell theory.",
    "Judge whether an example obeys or breaks each part.",
  ],
  misconceptions: ["Some living things are not made of cells"],
  categories: [
    { id: "obeys", name: "Follows cell theory", hint: "made of cells, from cells" },
    { id: "breaks", name: "Breaks cell theory", hint: "not alive, or not from cells" },
  ],
  specimens: [
    { id: "oak", name: "Oak tree", category: "obeys",
      because: "Made of many cells, all grown from earlier cells.",
      art: { art: "cell", plant: true } },
    { id: "amoeba", name: "Amoeba", category: "obeys",
      because: "One cell doing everything a living thing must do.",
      art: { art: "cell" } },
    { id: "ecoli", name: "E. coli bacterium", category: "obeys",
      because: "A single cell that divides to make more cells.",
      art: { art: "microbe", which: "bacterium" } },
    { id: "virus", name: "Influenza virus", category: "breaks",
      because: "Not made of cells at all, and cannot reproduce alone.",
      art: { art: "microbe", which: "virus" } },
    { id: "crystal", name: "Growing salt crystal", category: "breaks",
      because: "It grows, but it has no cells and never came from one.",
      art: { art: "sphere", color: "#cfd6e6", radius: 0.5 } },
  ],
};

const DISCOVERY: ArchetypeSpec = {
  id: "g6b1-first-look",
  title: "The First Look Through a Lens",
  tagline: "Follow how the microscope turned cork into cells.",
  kind: "process",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "Explain that cells were discovered because lenses improved.",
    "Describe what Hooke and van Leeuwenhoek each saw.",
  ],
  specimens: [{ id: "cork", name: "Cork", art: { art: "cell", plant: true } }],
  stages: [
    { name: "Naked eye", at: 0, caption: "Cork looks like plain brown bark. Nothing to see." },
    { name: "Simple lens", at: 0.33, caption: "A single lens hints at a texture, but no detail." },
    { name: "Hooke, 1665", at: 0.66,
      caption: "Hooke's microscope shows tiny empty boxes. He calls them cells." },
    { name: "Living cells", at: 1,
      caption: "Van Leeuwenhoek finds cells that move. They are alive." },
  ],
};

const ONE_OR_MANY: ArchetypeSpec = {
  id: "g6b1-one-or-many",
  title: "One Cell or Many?",
  tagline: "Compare a whole organism made of one cell with one made of billions.",
  kind: "compare",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "Contrast unicellular and multicellular organisms.",
    "Explain that a single cell must do every job by itself.",
  ],
  misconceptions: ["Bigger organisms have bigger cells rather than more cells"],
  specimens: [
    { id: "para", name: "Paramecium — one cell",
      because: "This single cell eats, moves and reproduces by itself.",
      art: { art: "cell" } },
    { id: "human", name: "Human — about 30 trillion cells",
      because: "Cells specialise, so no single cell has to do everything.",
      art: { art: "cell", plant: false } },
  ],
};

const LIVING_TEST: ArchetypeSpec = {
  id: "g6b1-living-test",
  title: "Is It Alive?",
  tagline: "Run four tests on a specimen and decide from the evidence.",
  kind: "sort",
  subject: "biology",
  bands: ["K-2", "3-5", "6-8"],
  grades: [4, 5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "Apply the characteristics of living things as a test.",
    "Explain why growth alone does not prove something is alive.",
  ],
  misconceptions: ["Anything that moves or grows is alive"],
  categories: [
    { id: "alive", name: "Living", hint: "cells, energy, growth, response" },
    { id: "not", name: "Not living", hint: "fails at least one test" },
  ],
  specimens: [
    { id: "seed", name: "Dormant seed", category: "alive",
      because: "It is made of cells and will grow when watered.",
      art: { art: "cell", plant: true } },
    { id: "fire", name: "Fire", category: "not",
      because: "It grows and consumes fuel, but it has no cells.",
      art: { art: "sphere", color: "#e87a2a", radius: 0.5, glow: 0.8 } },
    { id: "yeast", name: "Yeast", category: "alive",
      because: "Single cells that feed, grow and bud into new cells.",
      art: { art: "cell" } },
    { id: "virus2", name: "Virus", category: "not",
      because: "No cells, and it cannot reproduce without a host.",
      art: { art: "microbe", which: "virus" } },
  ],
};

const SCALE: ArchetypeSpec = {
  id: "g6b1-how-small",
  title: "How Small Is a Cell?",
  tagline: "Zoom from something you can hold down to a single bacterium.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "Order everyday objects, cells and bacteria by size.",
    "Use millimetres and micrometres to describe cell size.",
  ],
  misconceptions: ["Cells are visible to the naked eye"],
  specimens: [{ id: "spec", name: "Specimen", art: { art: "cell" } }],
  variables: [
    { key: "zoom", label: "Magnification", unit: "×", min: 1, max: 1000, step: 1, default: 40 },
  ],
  // A 100 µm cell subtends this many millimetres at the given magnification,
  // which is what makes the eye's ~0.1 mm limit a line you can cross.
  measure: (v) => {
    const apparentMm = (0.1 * v.zoom);
    return { apparentMm, visible: apparentMm >= 0.1 ? 1 : 0 };
  },
  plot: { x: "zoom", y: "apparentMm", xLabel: "Magnification (×)", yLabel: "Apparent size (mm)" },
};

export const g6b1CellTheory = buildSim(CELL_THEORY);
export const g6b1FirstLook = buildSim(DISCOVERY);
export const g6b1OneOrMany = buildSim(ONE_OR_MANY);
export const g6b1LivingTest = buildSim(LIVING_TEST);
export const g6b1HowSmall = buildSim(SCALE);
