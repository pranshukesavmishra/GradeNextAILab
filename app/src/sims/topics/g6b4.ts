import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B4 — Human body systems.
 *
 * Six simulations, one per subtopic. Four of the six systems exist to move
 * something from one place to another, so four of these are `trace`
 * simulations: food, waste, blood and oxygen, each with its own named stops
 * and its own real timings. The muscular system moves nothing through itself,
 * so it gets the `investigate` its lever geometry deserves, and the nervous
 * system gets an `explore` of a single neuron — the path of a nerve signal is
 * the named subtopic of B6.2 and is left there rather than run twice.
 */

/* ---------------------------------------------------------------- *
 * B4.1 — Digestive system
 * ---------------------------------------------------------------- */

const DIGESTIVE: ArchetypeSpec = {
  id: "g6b4-digestive",
  title: "Follow a Mouthful of Bread",
  tagline: "Track one bite through nine metres of gut and time every stop.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Name the organs food passes through, in order.",
    "Explain that digestion breaks food into pieces small enough to enter the blood.",
  ],
  misconceptions: [
    "Food is inside the body's cells as soon as it is swallowed",
    "The stomach does all of the digesting",
  ],
  specimens: [
    { id: "bolus", name: "The mouthful itself",
      art: { art: "glassware", which: "flask", level: 0.8, color: "#d8b25e" } },
  ],
  /*
   * The mouthful is the readout, and it answers the first misconception on the
   * list. Nothing leaves it in the mouth, the oesophagus or the stomach — all
   * that happens there is grinding, acid and churning, so it only changes
   * colour. It empties in the small intestine, because that is where food
   * actually crosses into the blood, and then again in the large intestine as
   * the water is taken back. What is left at the end is what could not be
   * broken down.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const absorbed = Math.max(0, (p - 0.45) / 0.55);
    return {
      level: 0.8 * (1 - 0.85 * absorbed),
      color: ["#d8b25e", "#cfa14e", "#c08840", "#a06a38", "#7a4f2c"][Math.min(4, Math.floor(p * 5))],
      bubbles: p > 0.3 && p < 0.55 ? 0.7 : 0,
    };
  },
  route: [
    {
      at: [0.09, 0.22], name: "Mouth",
      note: "Teeth grind, and saliva starts cutting starch into sugar.",
    },
    {
      at: [0.23, 0.42], name: "Oesophagus",
      note: "Muscle waves squeeze the food 25 cm down in about 8 seconds.",
    },
    {
      at: [0.39, 0.6], name: "Stomach",
      note: "Acid at pH 2 and churning muscle make a paste in 2 to 4 hours.",
    },
    {
      at: [0.57, 0.36], name: "Small intestine",
      note: "Enzymes finish the job and the blood takes the food up.",
    },
    {
      at: [0.75, 0.58], name: "Large intestine",
      note: "Water and salts are taken back over 12 to 48 hours.",
    },
    {
      at: [0.91, 0.3], name: "Out",
      note: "What is left leaves, 1 to 3 days after the meal was eaten.",
    },
  ],
  stages: [
    { name: "Chew", at: 0, caption: "Digestion starts in the mouth: teeth do the cutting, saliva does the chemistry." },
    { name: "Swallow", at: 0.2, caption: "Swallowing is muscular, not gravity. You could swallow standing on your head." },
    { name: "Churn", at: 0.4, caption: "The stomach holds food back and mixes it with acid strong enough to burn skin." },
    { name: "Absorb", at: 0.6, caption: "In the small intestine, folds and villi turn 6 m of tube into a huge surface." },
    { name: "Dry", at: 0.8, caption: "The large intestine reclaims most of the water that the gut poured in." },
    { name: "Leave", at: 1, caption: "Only what the body could not break down or absorb leaves at the end." },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.2 — Excretory system
 * ---------------------------------------------------------------- */

const EXCRETORY: ArchetypeSpec = {
  id: "g6b4-excretory",
  title: "Where the Waste Goes",
  tagline: "Follow one urea molecule from a working cell to the outside world.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Trace urea from the cells that make it to the urine that removes it.",
    "Explain that the kidney filters everything and then takes back what is useful.",
  ],
  misconceptions: [
    "The kidneys make waste rather than remove it",
    "Anything the body does not want is simply left out of the blood",
  ],
  specimens: [
    { id: "filtrate", name: "What the kidney is holding",
      art: { art: "glassware", which: "testTube", level: 0.9, color: "#b03a3a" } },
  ],
  /*
   * The tube holds whatever the urea is travelling in, and the volume is the
   * lesson: 180 litres a day go through the filter and 1.5 litres leave the
   * body, so more than 99 per cent of it is taken straight back. That is why
   * the level collapses at the tubule and not at the filter — the kidney
   * filters blindly first and sorts afterwards. The colour runs from blood to
   * urine as the useful part is reclaimed and the waste is left behind.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const reclaimed = Math.max(0, Math.min(1, (p - 0.4) / 0.25));
    return {
      level: 0.9 - 0.79 * reclaimed,
      color: ["#b03a3a", "#b8544a", "#c98a52", "#d8b25e", "#e6cf72"][Math.min(4, Math.floor(p * 5))],
      bubbles: p > 0.35 && p < 0.5 ? 0.5 : 0,
    };
  },
  route: [
    {
      at: [0.09, 0.3], name: "Body cells",
      note: "Breaking down protein leaves urea, which is poisonous if it builds up.",
    },
    {
      at: [0.24, 0.5], name: "Bloodstream",
      note: "About a fifth of every heartbeat's blood goes to the kidneys.",
    },
    {
      at: [0.41, 0.27], name: "Glomerulus",
      note: "A knot of capillaries filters 125 mL a minute, or 180 L a day.",
    },
    {
      at: [0.58, 0.5], name: "Tubule",
      note: "Almost all the water, glucose and salt is taken back. Urea stays.",
    },
    {
      at: [0.75, 0.28], name: "Bladder",
      note: "Urine collects. The urge to go starts at about 300 mL.",
    },
    {
      at: [0.91, 0.5], name: "Out",
      note: "Around 1.5 litres a day carries the urea away.",
    },
  ],
  stages: [
    { name: "Made", at: 0, caption: "Every cell that uses protein for fuel makes urea as a by-product." },
    { name: "Carried", at: 0.2, caption: "Blood is the only route out of a cell, so the waste travels in it." },
    { name: "Filtered", at: 0.4, caption: "The kidney filters blindly: water, salt, glucose and urea all go through." },
    { name: "Reclaimed", at: 0.6, caption: "Then it takes back 99% of the water and all of the glucose." },
    { name: "Stored", at: 0.8, caption: "What remains is urine, held in the bladder until it is convenient." },
    { name: "Removed", at: 1, caption: "The waste leaves, and the blood keeps a steady composition all day." },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.3 — Circulatory system
 * ---------------------------------------------------------------- */

const CIRCULATORY: ArchetypeSpec = {
  id: "g6b4-circulatory",
  title: "One Red Blood Cell, One Lap",
  tagline: "Ride a single blood cell twice through the heart in under a minute.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Describe the double circuit: heart to lungs, back to heart, then to the body.",
    "Explain why the left side of the heart has the thickest muscle.",
  ],
  misconceptions: [
    "Blood goes round the body in one single loop",
    "Arteries carry oxygen-rich blood and veins never do",
  ],
  specimens: [
    { id: "rbc", name: "The red blood cell you are riding",
      art: { art: "sphere", color: "#7d2320", radius: 0.5 } },
  ],
  /*
   * The cell itself is the evidence for the double circuit. It runs dark all
   * the way through the right side of the heart, turns bright the moment it
   * passes the lungs — haemoglobin 98 per cent full — and stays bright through
   * the left side and out into the body, which is exactly the point that the
   * "arteries are red, veins are blue" rule gets wrong: the artery to the lungs
   * carries the dark blood. It goes dark again at the capillary, where the
   * oxygen is handed over, and it squeezes down to get through: the tube is 8
   * micrometres wide and so is the cell, so it folds to fit.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const loaded = p >= 0.34 && p < 0.84;
    const squeezing = p >= 0.84 && p < 0.95;
    return {
      color: loaded ? "#d4463a" : "#7d2320",
      scale: squeezing ? 0.72 : 1,
      spin: 0.68 + t * (p > 0.5 && p < 0.84 ? 1.6 : 0.4),
      tilt: squeezing ? 0.62 : 0.24,
    };
  },
  route: [
    {
      at: [0.1, 0.55], name: "Right atrium",
      note: "Blood arrives from the body, low in oxygen and full of waste gas.",
    },
    {
      at: [0.21, 0.73], name: "Right ventricle",
      note: "A gentle push to the lungs, at about 25 mmHg.",
    },
    {
      at: [0.37, 0.27], name: "Lungs",
      note: "Carbon dioxide out, oxygen in. Haemoglobin fills to 98%.",
    },
    {
      at: [0.53, 0.55], name: "Left atrium",
      note: "Oxygen-rich blood comes back to the heart.",
    },
    {
      at: [0.64, 0.74], name: "Left ventricle",
      note: "The thickest chamber pushes it out at about 120 mmHg.",
    },
    {
      at: [0.81, 0.32], name: "Body capillary",
      note: "In a tube 8 micrometres wide, oxygen slips out to the cells.",
    },
    {
      at: [0.92, 0.58], name: "Back to the heart",
      note: "One full lap takes roughly a minute while you sit still.",
    },
  ],
  stages: [
    { name: "Return", at: 0, caption: "Every lap starts on the right side of the heart, with tired blood." },
    { name: "To lungs", at: 0.17, caption: "The right side pumps only as far as the lungs, so it needs little force." },
    { name: "Load up", at: 0.34, caption: "In the lungs the cell trades carbon dioxide for a full load of oxygen." },
    { name: "Return again", at: 0.5, caption: "Loaded blood comes back to the heart before going anywhere else." },
    { name: "To the body", at: 0.67, caption: "The left side has to reach your toes, so its wall is three times thicker." },
    { name: "Deliver", at: 0.84, caption: "Capillaries are so narrow that cells pass through in single file." },
    { name: "Lap done", at: 1, caption: "About 5 litres a minute at rest, and every drop passes the lungs each lap." },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.4 — Respiratory system
 * ---------------------------------------------------------------- */

const RESPIRATORY: ArchetypeSpec = {
  id: "g6b4-respiratory",
  title: "The Journey of One Oxygen Molecule",
  tagline: "Follow one molecule of oxygen from the air to a waiting blood cell.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Name the airways oxygen passes through on its way to the blood.",
    "Explain how the alveoli make gas exchange fast enough to keep up.",
  ],
  misconceptions: [
    "The lungs push air in and out like a pump",
    "Breathing and respiration are the same process",
  ],
  specimens: [
    { id: "o2", name: "The oxygen molecule", art: { art: "molecule", formula: "O2" } },
  ],
  /*
   * Nothing pushes it. A molecule of oxygen in air at body temperature averages
   * about 480 m/s and goes where the crowd is thinner, which is the only reason
   * it ends up in the blood — so it flies while it is a gas, slows as the
   * airways narrow and the air almost stops moving, and once it is dissolved
   * and then bound to haemoglobin it is carried rather than travelling. It is
   * drawn smaller as it goes, because the space it is crossing shrinks from a
   * 12 cm windpipe to a wall 0.3 micrometres thick.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const bound = p > 0.84;
    return {
      scale: 1.35 - 0.75 * p,
      spin: t * (bound ? 0.25 : 2.6 - p * 2),
      tilt: 0.24 + Math.sin(t * 0.6) * 0.12,
      rate: bound ? 0.2 : 1,
    };
  },
  route: [
    {
      at: [0.09, 0.24], name: "Nose",
      note: "Air is warmed, damped and filtered. It is 21% oxygen.",
    },
    {
      at: [0.22, 0.44], name: "Trachea",
      note: "Rings of cartilage hold the 12 cm windpipe open.",
    },
    {
      at: [0.36, 0.26], name: "Bronchus",
      note: "The airway splits in two, and goes on splitting 23 times.",
    },
    {
      at: [0.5, 0.47], name: "Bronchiole",
      note: "Tubes under 1 mm wide, with muscle that can tighten them.",
    },
    {
      at: [0.67, 0.26], name: "Alveolus",
      note: "One of about 480 million air sacs, covering some 70 square metres.",
    },
    {
      at: [0.82, 0.48], name: "Capillary",
      note: "Oxygen crosses a wall 0.3 micrometres thick in under a second.",
    },
    {
      at: [0.93, 0.28], name: "Haemoglobin",
      note: "Each red blood cell holds about 270 million carrier molecules.",
    },
  ],
  stages: [
    { name: "Breathe in", at: 0, caption: "The diaphragm pulls down, the chest widens, and air falls in behind it." },
    { name: "Windpipe", at: 0.17, caption: "Half a litre of air moves in a quiet breath, about 14 times a minute." },
    { name: "Branch", at: 0.34, caption: "Each split makes the tubes narrower but the total space much wider." },
    { name: "Narrow", at: 0.5, caption: "By the smallest bronchioles the air has slowed almost to a standstill." },
    { name: "Air sac", at: 0.67, caption: "Alveoli give the lungs a surface roughly the size of half a tennis court." },
    { name: "Cross over", at: 0.84, caption: "Oxygen crosses because there is more of it in the air than in the blood." },
    { name: "Carried", at: 1, caption: "Blood leaves the lung 98% loaded and heads back to the heart." },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.5 — Muscular system
 * ---------------------------------------------------------------- */

const MUSCULAR: ArchetypeSpec = {
  id: "g6b4-muscular",
  title: "Why Your Biceps Pulls Eight Times Harder",
  tagline: "Hang a weight in your hand and work out what the muscle must pull.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Explain that muscles pull on bones and never push.",
    "Use the lever of the arm to explain why the muscle force is far larger than the load.",
  ],
  misconceptions: [
    "Muscles push a bone back when they relax",
    "The muscle only has to match the weight being lifted",
  ],
  specimens: [{ id: "biceps", name: "Biceps and forearm", art: { art: "apparatus", which: "spring" } }],
  variables: [
    { key: "load", label: "Weight in the hand", unit: "kg", min: 0, max: 20, step: 0.5, default: 5 },
    { key: "insertion", label: "Muscle attachment from elbow", unit: "cm", min: 2, max: 8, step: 0.5, default: 4 },
  ],
  /*
   * The forearm is a third-class lever. The biceps attaches about 4 cm from the
   * elbow joint, while the hand is about 32 cm from it, so the muscle works at
   * a mechanical disadvantage of roughly eight to one: turning moments balance
   * when force x distance is equal on both sides of the joint.
   */
  measure: (v) => {
    const loadNewtons = v.load * 9.8;
    return {
      loadNewtons,
      musclePull: (loadNewtons * 32) / v.insertion,
      timesHarder: 32 / v.insertion,
    };
  },
  plot: {
    x: "load", y: "musclePull",
    xLabel: "Weight in the hand (kg)", yLabel: "Pull from the biceps (N)",
  },
  /*
   * The muscle is drawn as a spring because that is what it is doing: holding
   * against a load. It stretches in proportion to the pull it is taking — 0 N
   * with an empty hand, 1 568 N with 20 kg on a 4 cm attachment — and the whole
   * forearm sags with the weight. Move the attachment out towards the hand and
   * the same 20 kg needs far less pull, so the spring relaxes without the
   * weight changing at all: the lever is doing the work, not the muscle.
   */
  drive: ({ f, t }) => {
    const strain = Math.min(1, f.musclePull / 3136);
    return {
      scale: 1 + strain * 0.45,
      offset: [0, strain * 0.4],
      tilt: 0.24 + strain * 0.3,
      spin: 0.68 + t * 0.14,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B4.6 — Nervous system
 * ---------------------------------------------------------------- */

const NERVOUS: ArchetypeSpec = {
  id: "g6b4-nerve-cell",
  title: "Inside a Nerve Cell",
  tagline: "Take apart the one cell shaped entirely around carrying a message.",
  kind: "explore",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Name the dendrites, cell body, axon, myelin sheath and terminals of a neuron.",
    "Explain how the shape of a neuron suits carrying a signal a long way, fast.",
  ],
  misconceptions: [
    "Nerve signals are electricity travelling through a wire",
    "The brain sends messages instantly",
  ],
  specimens: [
    {
      id: "neuron", name: "Motor neuron", art: { art: "cell" },
      parts: [
        {
          id: "dendrites", name: "Dendrites", at: [-0.43, -0.29],
          note: "Branches collecting signals from thousands of other cells.",
        },
        {
          id: "body", name: "Cell body", at: [-0.09, -0.05],
          note: "Adds the signals up and fires once they pass a threshold.",
        },
        {
          id: "axon", name: "Axon", at: [0.29, 0.11],
          note: "One long fibre. In a leg it can be a whole metre long.",
        },
        {
          id: "myelin", name: "Myelin sheath", at: [0.46, -0.21],
          note: "Fatty wrapping that lifts the speed to as much as 120 m/s.",
        },
        {
          id: "terminal", name: "Axon terminal", at: [0.41, 0.35],
          note: "The signal crosses a 20 nm gap using chemicals, in about 1 ms.",
        },
      ],
    },
  ],
};

export const g6b4Digestive = buildSim(DIGESTIVE);
export const g6b4Excretory = buildSim(EXCRETORY);
export const g6b4Circulatory = buildSim(CIRCULATORY);
export const g6b4Respiratory = buildSim(RESPIRATORY);
export const g6b4Muscular = buildSim(MUSCULAR);
export const g6b4NerveCell = buildSim(NERVOUS);
