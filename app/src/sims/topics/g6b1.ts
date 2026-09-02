import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B1 — Cells: the basic unit of life.
 *
 * Six simulations, one per subtopic, exported in subtopic order:
 *
 *   B1.1  g6b1-cell-theory       cell theory              (sort)
 *   B1.2  g6b1-first-look        discovering cells        (process)
 *   B1.3  g6b1-living-test       living vs nonliving      (sort)
 *   B1.4  g6b1-one-or-many       unicellular organisms    (compare)
 *   B1.5  g6b1-many-small-cells  multicellular organisms  (investigate)
 *   B1.6  g6b1-how-small         microscopic scale        (investigate)
 *
 * B1.3 gets a sorter because deciding whether a thing is alive is a judgement
 * students must practise making. B1.5 is the one that answers the topic's
 * hardest question — why a big organism is not simply a big cell — with the
 * surface-area-to-volume argument, and it is the only place a student can
 * watch a cell outgrow what diffusion can supply.
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
  /*
   * The lens is the whole story, so the lens is what the picture answers to.
   * The cork grows through the run by a constant factor per stage — the naked
   * eye, a single lens, Hooke's compound microscope at about 30 times and van
   * Leeuwenhoek's at nearly 300 — which is what stepping up a magnification
   * ladder looks like. It sits dead still until the last stage: Hooke saw empty
   * boxes and named them, and only van Leeuwenhoek saw anything move.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    return {
      scale: 0.22 * Math.pow(7.7, p),
      rate: p > 0.75 ? 1 : 0,
      tilt: 0.24,
    };
  },
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
  /*
   * A paramecium has to fetch its own dinner, so it swims: about 1 mm a second,
   * roughly four of its own body lengths, shown here at a tenth of that so the
   * eye can follow it. A cell in a human body never travels at all — food and
   * oxygen are delivered to it — so it holds its place and does its one job.
   * That is the difference between the two ways of being alive.
   */
  drive: ({ t, index }) => {
    if (index === 0) {
      const lap = (t * 0.4) % 1;
      return {
        offset: [lap * 1.5 - 0.75, Math.sin(t * 1.7) * 0.16],
        spin: t * 1.4,
      };
    }
    return { offset: [0, 0], spin: 0.68 + t * 0.16, scale: 1 + 0.03 * Math.sin(t * 1.2) };
  },
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

const MANY_SMALL: ArchetypeSpec = {
  id: "g6b1-many-small-cells",
  title: "Why a Body Is Many Small Cells",
  tagline: "Grow one cell bigger and bigger until its middle can no longer be fed.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-1"] },
  learningGoals: [
    "Explain that a multicellular organism is built from many small cells rather than a few large ones.",
    "Use surface area and volume to say why a cell cannot simply keep growing.",
  ],
  misconceptions: [
    "A bigger organism has bigger cells rather than more of them",
    "A cell can grow as large as it likes as long as it has food",
  ],
  specimens: [{ id: "one", name: "One cell, growing", art: { art: "cell" } }],
  variables: [
    { key: "radius", label: "Cell radius", unit: "micrometres", min: 5, max: 120, step: 1, default: 20 },
  ],
  /*
   * Geometry, and then one measured biological distance.
   *
   * A sphere of radius r has surface area 4 pi r squared and volume
   * (4/3) pi r cubed, so its surface-area-to-volume ratio is exactly 3/r: the
   * bigger it gets, the less skin it has for every unit of inside. A typical
   * animal cell of radius 20 micrometres has 5 027 square micrometres of
   * membrane serving 33 510 cubic micrometres of contents, a ratio of 0.15 per
   * micrometre.
   *
   * The limit is diffusion. In actively respiring tissue a cell is seldom more
   * than about 50 micrometres from a capillary, because that is roughly as far
   * as oxygen can keep up by diffusing. Past a radius of 50 micrometres, the
   * part of a sphere deeper than that is a core nothing can supply, and its
   * share of the volume is ((r - 50)/r) cubed.
   */
  measure: (v) => {
    const r = v.radius;
    const surfaceArea = 4 * Math.PI * r * r;
    const volume = (4 / 3) * Math.PI * r * r * r;
    const core = r > 50 ? Math.pow((r - 50) / r, 3) : 0;
    return {
      surfaceArea,
      volume,
      saPerVolume: 3 / r,
      suppliedPercent: (1 - core) * 100,
      cellsPerCubicMm: 1e9 / volume,
      starved: core > 0 ? 1 : 0,
    };
  },
  plot: {
    x: "radius", y: "saPerVolume",
    xLabel: "Cell radius (micrometres)", yLabel: "Surface area per unit volume (1/micrometre)",
  },
  /*
   * The control is a radius, so the drawn width follows it straight — no cube
   * root here, because it is the length that is being set and not the volume.
   * At 5 micrometres the cell is a speck; at 120 it fills the stage, and by
   * then everything more than 50 micrometres in from its surface is starving.
   * Past that point it lists over and stops turning: it has outgrown what
   * diffusion can reach, which is the reason bodies are built from many small
   * cells instead of a few big ones.
   */
  drive: ({ f, v }) => ({
    scale: v.radius / 70,
    rate: f.starved ? 0 : 1,
    tilt: f.starved ? 0.24 + (1 - f.suppliedPercent / 100) * 1.1 : 0.24,
  }),
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
  /*
   * Held at arm's length, a reading page fills about 250 mm of your view, so a
   * specimen that looks 0.1 mm across at the eye takes up one two-thousand-five-
   * hundredth of it. The cell is drawn at that same fraction of the stage, which
   * is why it is a speck at low power and why nothing but hundreds of times
   * magnification turns it into a thing with parts. The drawn size is strictly
   * proportional to the magnification: no cheating with a curve to make the low
   * end look better than it is.
   */
  drive: ({ v }) => ({
    scale: Math.max(0.05, Math.min(1.9, 0.0018 * v.zoom)),
    rate: v.zoom >= 40 ? 1 : 0,
  }),
};

/*
 * Exported in subtopic order, B1.1 to B1.6: the library maps a topic's
 * simulations onto its subtopics by position, so this order is the wiring.
 */
export const g6b1CellTheory = buildSim(CELL_THEORY);
export const g6b1FirstLook = buildSim(DISCOVERY);
export const g6b1LivingTest = buildSim(LIVING_TEST);
export const g6b1OneOrMany = buildSim(ONE_OR_MANY);
export const g6b1ManySmallCells = buildSim(MANY_SMALL);
export const g6b1HowSmall = buildSim(SCALE);
