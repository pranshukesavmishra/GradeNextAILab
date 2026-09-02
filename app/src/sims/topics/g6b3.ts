import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B3 — Levels of organization.
 *
 * Six simulations, one per subtopic, and six different archetypes. The ladder
 * itself is a `process`, because it is a sequence and nothing else. Around it
 * sit the moves that stop the ladder being a list to memorise: a `compare` of
 * a cell that threw away its nucleus to do one job better, an `investigate`
 * showing that a tissue lifts what a single cell cannot, an `assemble` of one
 * organ from its tissues, a `sort` that makes the student place real organs in
 * real systems, and a `trace` that runs the whole ladder downwards with a
 * single sugar molecule.
 */

/* ---------------------------------------------------------------- *
 * B3.1 — The organizational hierarchy
 * ---------------------------------------------------------------- */

const HIERARCHY: ArchetypeSpec = {
  id: "g6b3-hierarchy",
  title: "From One Cell to a Whole Body",
  tagline: "Climb the five levels, one step at a time, and watch the job grow.",
  kind: "process",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Put cell, tissue, organ, organ system and organism in order.",
    "Explain that each level can do something the level below cannot.",
  ],
  misconceptions: [
    "The levels are just sizes, not new abilities",
    "An organ is made of one kind of tissue only",
  ],
  specimens: [{ id: "heart-cell", name: "Heart muscle cell", art: { art: "cell" } }],
  stages: [
    {
      name: "Cell", at: 0,
      caption: "One heart muscle cell, about 20 micrometres wide. It contracts, and moves nothing.",
    },
    {
      name: "Tissue", at: 0.25,
      caption: "Millions of the same cell, joined and beating together: cardiac muscle tissue.",
    },
    {
      name: "Organ", at: 0.5,
      caption: "Muscle, nerve and valve tissue together make the heart, which pumps 5 litres a minute.",
    },
    {
      name: "Organ system", at: 0.75,
      caption: "Heart plus vessels make the circulatory system, roughly 100,000 km of tubing.",
    },
    {
      name: "Organism", at: 1,
      caption: "Eleven organ systems, working at once, make one living person.",
    },
  ],
  /*
   * Five rungs from 20 micrometres to 1.7 metres is a factor of about 85 000,
   * so the subject grows by a constant factor per rung rather than a constant
   * amount — the same shape a log scale has. And it beats the whole way up:
   * 70 times a minute, the rate of the heart the cell belongs to, because the
   * one thing every level here shares is that contraction.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const beat = Math.max(0, Math.sin(t * 7.33));
    return {
      scale: 0.34 * Math.pow(5.2, p) * (1 + 0.07 * beat * beat),
      spin: 0.68 + t * 0.2,
      tilt: 0.24,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B3.2 — Cell specialization
 * ---------------------------------------------------------------- */

const SPECIALISATION: ArchetypeSpec = {
  id: "g6b3-specialised-cell",
  title: "The Cell That Threw Away Its Nucleus",
  tagline: "Compare an all-rounder cell with one rebuilt for a single job.",
  kind: "compare",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Explain that specialised cells change shape and contents to suit one job.",
    "Describe what a specialised cell gives up in exchange.",
  ],
  misconceptions: [
    "Every cell in a body is the same",
    "A specialised cell is simply a better cell",
  ],
  specimens: [
    {
      id: "generic", name: "Unspecialised cell",
      because: "Keeps the full kit: nucleus, mitochondria, and the power to divide.",
      art: { art: "cell" },
    },
    {
      id: "rbc", name: "Red blood cell",
      because: "No nucleus, so more room for oxygen. It cannot divide, and lasts 120 days.",
      art: { art: "sphere", color: "#c0392b", radius: 0.5 },
    },
  ],
  /*
   * Each side does the thing it kept and cannot do the thing it gave up.
   *
   * The unspecialised cell still divides: it grows to twice its volume, which
   * is 1.26 times its width, and halves back. A red blood cell never will — it
   * threw away the nucleus that would have told it how — so it never changes
   * size at all. What it does instead is the job it was rebuilt for: it loads
   * oxygen in the lungs and gives it up in the tissues, once a lap, and the
   * colour swing between bright and dark red is that cargo arriving and going.
   */
  drive: ({ t, index }) => {
    if (index === 0) {
      const cycle = (t * 0.14) % 1;
      const grown = cycle < 0.85 ? 1 + (cycle / 0.85) : 2 - (cycle - 0.85) / 0.15;
      return { scale: Math.cbrt(grown), spin: 0.68 + t * 0.18 };
    }
    const lap = (t * 0.17) % 1;
    const loaded = lap < 0.5;
    return {
      color: loaded ? "#d4463a" : "#7d2320",
      scale: 1,
      spin: 0.68 + t * 0.5,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B3.3 — Tissues
 * ---------------------------------------------------------------- */

const TISSUE_PULL: ArchetypeSpec = {
  id: "g6b3-tissue-pull",
  title: "One Cell Pulls, a Tissue Lifts",
  tagline: "Add muscle cells side by side and measure the pull they make together.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Define a tissue as many similar cells doing one job together.",
    "Explain why the pull of a muscle depends on how many fibres share the work.",
  ],
  misconceptions: [
    "A big muscle is one huge cell",
    "Cells in a tissue each do a different job",
  ],
  specimens: [{ id: "muscle", name: "Muscle tissue", art: { art: "apparatus", which: "spring" } }],
  variables: [
    {
      key: "area", label: "Cross-section of the muscle", unit: "cm2",
      min: 0.1, max: 20, step: 0.1, default: 10,
    },
  ],
  /*
   * Skeletal muscle produces a specific tension of about 30 N per square
   * centimetre of cross-section, so pull scales with area and nothing else.
   * A single fibre is roughly 50 micrometres across, an area of 1.96e-5 cm2,
   * so about 51,000 fibres fit in a square centimetre when packed side by side.
   */
  measure: (v) => ({
    pullNewtons: 30 * v.area,
    fibres: Math.round(v.area / 1.963e-5),
    massHeld: (30 * v.area) / 9.8,
  }),
  plot: {
    x: "area", y: "pullNewtons",
    xLabel: "Cross-section (cm2)", yLabel: "Pull (N)",
  },
  /*
   * The control is an area, so the drawn width is the square root of it — a
   * muscle of 20 square centimetres is 14 times as wide as one of 0.1, not 200
   * times. It twitches at about 10 Hz throughout, the rate at which motor units
   * are recruited in a steady hold, and the twitch is the same whether one
   * fibre is pulling or fifty thousand: what changes is how much it lifts.
   */
  drive: ({ v, t }) => {
    const twitch = 0.5 + 0.5 * Math.sin(t * 62.8);
    return {
      scale: Math.sqrt(v.area / 10) * (1 - 0.04 * twitch),
      offset: [0, -0.05 * twitch],
      spin: 0.68 + t * 0.16,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B3.4 — Organs
 * ---------------------------------------------------------------- */

const BUILD_AN_ORGAN: ArchetypeSpec = {
  id: "g6b3-build-an-organ",
  title: "Build a Stomach That Works",
  tagline: "Lay in one tissue at a time and find which one the organ cannot lose.",
  kind: "assemble",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Describe an organ as several tissues built into one working structure.",
    "Explain the job each tissue in the stomach wall does.",
  ],
  misconceptions: [
    "An organ is made of a single kind of cell",
    "The stomach is just a bag that holds food",
  ],
  specimens: [
    {
      id: "stomach", name: "Stomach under construction",
      art: { art: "glassware", which: "flask", level: 0.55, bubbles: 0.25 },
      parts: [
        {
          id: "muscle", name: "Smooth muscle", at: [-0.27, 0.11],
          note: "Three layers of muscle tissue that churn the food.",
        },
        {
          id: "lining", name: "Acid lining", at: [0.26, -0.04],
          note: "Epithelium making acid at about pH 2, plus the enzyme pepsin.",
        },
        {
          id: "mucus", name: "Mucus coat", at: [0.05, -0.31],
          note: "Stops the acid digesting the stomach itself.",
        },
        {
          id: "nerves", name: "Nerve tissue", at: [-0.2, -0.28],
          note: "Tells the muscle when to churn and the glands when to pour.",
        },
        {
          id: "blood", name: "Blood supply", at: [0.24, 0.28],
          note: "Connective tissue and vessels feeding the wall.",
        },
        {
          id: "rings", name: "Muscle rings", at: [-0.04, 0.37],
          note: "Valves at each end, holding food in for 2 to 4 hours.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.5 — Organ systems
 * ---------------------------------------------------------------- */

const WHICH_SYSTEM: ArchetypeSpec = {
  id: "g6b3-which-system",
  title: "Which System Does It Belong To?",
  tagline: "Take each organ in turn and post it to the system it serves.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Group organs into the system they work in.",
    "Explain that an organ system is organs sharing one large job.",
  ],
  misconceptions: [
    "Each organ works on its own",
    "Blood is a liquid rather than a tissue",
  ],
  categories: [
    { id: "digestive", name: "Digestive", hint: "breaks food down" },
    { id: "circulatory", name: "Circulatory", hint: "carries things round" },
    { id: "respiratory", name: "Respiratory", hint: "swaps gases" },
    { id: "nervous", name: "Nervous", hint: "carries messages" },
  ],
  specimens: [
    {
      id: "stomach", name: "Stomach", category: "digestive",
      because: "Churns food in acid, so the intestine can finish the job.",
      art: { art: "glassware", which: "flask", level: 0.55, bubbles: 0.2 },
    },
    {
      id: "intestine", name: "Small intestine", category: "digestive",
      because: "About 6 m of tube where digested food is absorbed into the blood.",
      art: { art: "glassware", which: "testTube", level: 0.6 },
    },
    {
      id: "heart", name: "Heart", category: "circulatory",
      because: "A muscular pump pushing about 5 litres of blood a minute.",
      art: { art: "sphere", color: "#c0392b", radius: 0.55 },
    },
    {
      id: "blood", name: "Blood", category: "circulatory",
      because: "A tissue of cells and plasma, carrying oxygen, food and heat.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#b03a3a" },
    },
    {
      id: "lungs", name: "Lungs", category: "respiratory",
      because: "About 480 million air sacs swap oxygen for carbon dioxide.",
      art: { art: "glassware", which: "flask", level: 0.15, bubbles: 0.9 },
    },
    {
      id: "trachea", name: "Trachea", category: "respiratory",
      because: "Rings of cartilage hold the airway open all the way to the lungs.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "brain", name: "Brain", category: "nervous",
      because: "Receives signals, decides, and sends orders back out.",
      art: { art: "sphere", radius: 0.6, glow: 0.4 },
    },
    {
      id: "neuron", name: "Nerve cell", category: "nervous",
      because: "Carries electrical signals between the body and the brain.",
      art: { art: "cell" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.6 — The organism as the whole system
 * ---------------------------------------------------------------- */

const DOWN_THE_LEVELS: ArchetypeSpec = {
  id: "g6b3-down-the-levels",
  title: "One Sugar Molecule, Every Level",
  tagline: "Follow a mouthful of bread all the way down to a single organelle.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Name the level of organisation at each point on the journey.",
    "Explain that the organism only works when every level does its part.",
  ],
  misconceptions: [
    "The levels of organisation are separate topics rather than one system",
    "Food gives a cell energy without ever entering the cell",
  ],
  specimens: [
    { id: "glucose", name: "The glucose from the bread", art: { art: "sphere", color: "#e8c15a", radius: 0.45 } },
  ],
  /*
   * The journey is a zoom, so the picture zooms. A person is 1.7 m, the small
   * intestine 6 m of tube but 3 cm wide, its lining one cell thick, a muscle
   * fibre 50 micrometres across and a mitochondrion 1 — six levels spanning a
   * million-fold, so the drawn size falls by a constant factor at each stop
   * rather than a constant amount. The glucose brightens as it goes, and is at
   * its brightest at the mitochondrion, where its energy is finally released.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    return {
      scale: 1.7 * Math.pow(0.12, p),
      color: ["#c9a24a", "#d9b053", "#e8c15a", "#f2d066", "#ffe07a"][Math.min(4, Math.floor(p * 5))],
      spin: 0.68 + t * (0.2 + p * 1.4),
    };
  },
  route: [
    {
      at: [0.1, 0.24], name: "The meal (organism)",
      note: "A slice of bread. The whole body needs the energy in it.",
    },
    {
      at: [0.28, 0.42], name: "Small intestine (organ)",
      note: "Starch is cut into glucose and taken through the gut wall.",
    },
    {
      at: [0.46, 0.24], name: "Villus lining (tissue)",
      note: "A sheet of cells one cell thick, folded to a huge area.",
    },
    {
      at: [0.64, 0.44], name: "Bloodstream (organ system)",
      note: "Glucose joins the blood at about 5 mmol per litre.",
    },
    {
      at: [0.8, 0.26], name: "Muscle fibre (cell)",
      note: "One muscle cell takes the glucose in through its membrane.",
    },
    {
      at: [0.92, 0.46], name: "Mitochondrion (organelle)",
      note: "Glucose meets oxygen here and about 30 ATP are released.",
    },
  ],
  stages: [
    { name: "Organism", at: 0, caption: "The journey starts at the level you can see: a person eating bread." },
    { name: "Organ", at: 0.2, caption: "The small intestine is an organ, built from several tissues." },
    { name: "Tissue", at: 0.4, caption: "Its lining is one tissue: identical cells sharing one job." },
    { name: "System", at: 0.6, caption: "The blood belongs to a whole organ system that reaches every cell." },
    { name: "Cell", at: 0.8, caption: "A single muscle cell is the smallest thing here that is alive." },
    { name: "Organelle", at: 1, caption: "Inside it, an organelle finishes the job the meal began." },
  ],
};

export const g6b3Hierarchy = buildSim(HIERARCHY);
export const g6b3SpecialisedCell = buildSim(SPECIALISATION);
export const g6b3TissuePull = buildSim(TISSUE_PULL);
export const g6b3BuildAnOrgan = buildSim(BUILD_AN_ORGAN);
export const g6b3WhichSystem = buildSim(WHICH_SYSTEM);
export const g6b3DownTheLevels = buildSim(DOWN_THE_LEVELS);
