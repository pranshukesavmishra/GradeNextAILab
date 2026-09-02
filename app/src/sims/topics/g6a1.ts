import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit A · Topic A1 — Systems and subsystems.
 *
 * Five simulations, one per subtopic:
 *
 *   A1.1  g6a1-system-or-heap   what makes a system a system   (sort)
 *   A1.2  g6a1-nested-parts     subsystems nested in systems   (explore)
 *   A1.3  g6a1-parts-in-step    interactions among the parts   (investigate)
 *   A1.4  g6a1-only-together    emergent properties            (compare)
 *   A1.5  g6a1-scale-ladder     systems across scales          (process)
 *
 * A1 is the most abstract topic in the grade, so every simulation is pinned to
 * something a student can picture: a bicycle, a cell, a glass of water. The
 * only numbers on screen are real ones — the gear sim is a true drivetrain
 * calculation on a 700 x 25c wheel, and the scale ladder uses measured sizes.
 */

/* A1.1 — What makes a system a system. */
const SYSTEM_OR_HEAP: ArchetypeSpec = {
  id: "g6a1-system-or-heap",
  title: "System or Heap?",
  tagline: "Some collections of parts do a job together. Some are just a pile.",
  kind: "sort",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Define a system as parts that interact to do something none can do alone.",
    "Explain why a collection of parts is not automatically a system.",
  ],
  misconceptions: ["Any group of objects placed together is a system"],
  categories: [
    { id: "system", name: "A system", hint: "parts that work together to do a job" },
    { id: "heap", name: "Just a heap", hint: "parts that need nothing from each other" },
  ],
  specimens: [
    { id: "bike", name: "Bicycle", category: "system",
      because: "Pedals, chain, wheels and brakes each do a job, and only together do they carry a rider.",
      art: { art: "apparatus", which: "cart" } },
    { id: "partsbox", name: "The same bicycle, in a box of parts", category: "heap",
      because: "Every part is still there, but nothing is connected, so nothing turns.",
      art: { art: "glassware", which: "beaker", level: 0.45, precipitate: 0.85 } },
    { id: "torch", name: "Working torch", category: "system",
      because: "Battery, switch and bulb form a loop. Remove any one and the light goes out.",
      art: { art: "apparatus", which: "bulb" } },
    { id: "spare", name: "A battery in a drawer", category: "heap",
      because: "It stores energy, but on its own it interacts with nothing and does no job.",
      art: { art: "apparatus", which: "battery" } },
    { id: "tank", name: "Planted aquarium", category: "system",
      because: "Fish, plants, pump and light depend on one another to keep the water fit to live in.",
      art: { art: "glassware", which: "flask", level: 0.68, bubbles: 3 } },
    { id: "dune", name: "Pile of sand", category: "heap",
      because: "Take half the grains away and it is still a pile of sand. No grain needs another.",
      art: { art: "sphere", color: "#cbb894", radius: 0.5 } },
  ],
};

/* A1.2 — Subsystems nested within systems. */
const NESTED: ArchetypeSpec = {
  id: "g6a1-nested-parts",
  title: "Systems Inside Systems",
  tagline: "Open one system and you find smaller systems doing the work.",
  kind: "explore",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Identify subsystems inside a working system.",
    "Explain that a system can be a subsystem of something larger.",
  ],
  misconceptions: ["Every part of a system sits at the same level"],
  specimens: [
    {
      id: "cell", name: "One cell, opened up", art: { art: "cell" },
      parts: [
        { id: "membrane", name: "Boundary subsystem", at: [0.35, -0.35],
          note: "The membrane decides what crosses in and out. Without a boundary there is no system, only surroundings." },
        { id: "nucleus", name: "Control subsystem", at: [-0.04, -0.03],
          note: "The nucleus stores the instructions and directs the rest. It controls, but it cannot make energy." },
        { id: "mito", name: "Power subsystem", at: [0.27, -0.25],
          note: "Mitochondria release energy from sugar. They supply every other subsystem and depend on all of them for fuel." },
        { id: "er", name: "Transport subsystem", at: [0.17, 0.15],
          note: "The endoplasmic reticulum builds proteins and moves them about, like corridors through a building." },
        { id: "golgi", name: "Packaging subsystem", at: [-0.23, 0.18],
          note: "The Golgi body wraps finished proteins and labels them for delivery. It is useless without the transport subsystem." },
        { id: "whole", name: "And the cell itself?", at: [-0.36, -0.28],
          note: "The whole cell is one subsystem of a tissue, which is a subsystem of an organ, which is part of a body. The ladder runs both ways." },
      ],
    },
  ],
};

/* A1.3 — Interactions among a system's parts. */
const DRIVETRAIN: ArchetypeSpec = {
  id: "g6a1-parts-in-step",
  title: "When Parts Work Together",
  tagline: "Turn the pedals and follow the effect all the way to the road.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Describe how a change in one part of a system changes the output of another.",
    "Use a gear ratio to predict road speed from pedalling rate.",
  ],
  misconceptions: ["Each part of a machine works on its own"],
  specimens: [{ id: "bike", name: "Bicycle drivetrain", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "cadence", label: "Pedalling rate (turns per minute)", min: 40, max: 120, step: 1, default: 80 },
    { key: "ratio", label: "Gear ratio (wheel turns per pedal turn)", min: 1, max: 4.5, step: 0.1, default: 3 },
  ],
  // A 700 x 25c wheel rolls 2.096 m per turn, so road speed follows straight
  // from cadence and gear ratio. Nothing here is invented.
  measure: (v) => {
    const wheelRpm = v.cadence * v.ratio;
    const metresPerMinute = wheelRpm * 2.096;
    return {
      wheelRpm,
      speedKmh: (metresPerMinute * 60) / 1000,
      speedMs: metresPerMinute / 60,
    };
  },
  plot: { x: "cadence", y: "speedKmh", xLabel: "Pedalling rate (rpm)", yLabel: "Road speed (km/h)" },
  /*
   * The bicycle is the readout. Its wheels turn at the wheel speed the gearing
   * actually produces, and it crosses the stage at the road speed that follows
   * from it — 240 wheel rpm and 8.4 m/s at the default gear. Both are the same
   * numbers the panel prints, slowed by a fixed factor so the eye can follow
   * them: a wheel really turning four times a second would only blur.
   */
  drive: ({ v, f, t }) => ({
    spin: t * f.wheelRpm * 0.021,
    offset: [((t * f.speedMs * 0.055) % 1) * 1.3 - 0.65, 0],
    tilt: 0.2 + 0.06 * Math.sin(t * 0.8),
    rate: v.cadence > 0 ? 1 : 0,
  }),
};

/* A1.4 — Emergent properties. */
const EMERGENT: ArchetypeSpec = {
  id: "g6a1-only-together",
  title: "One Molecule Is Not Wet",
  tagline: "Some properties belong to the whole and to nothing inside it.",
  kind: "compare",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Give an example of a property that only appears when parts act together.",
    "Explain why temperature and pressure are properties of a group, not of one particle.",
  ],
  misconceptions: ["Every property of a whole must also belong to its parts"],
  specimens: [
    { id: "one", name: "One water molecule",
      because: "It has a mass and a speed. It has no temperature, no pressure and no wetness at all.",
      art: { art: "sphere", color: "#5aa9e6", radius: 0.3 } },
    { id: "many", name: "A glass of water: about 8 x 10^24 molecules",
      because: "Temperature is the average energy of the crowd, pressure is their drumming on the glass, wetness is how they cling. All three appear only together.",
      art: { art: "glassware", which: "beaker", level: 0.62 } },
  ],
  variables: [
    { key: "tempC", label: "Temperature of the water", unit: "degrees C", min: 0, max: 100, step: 1, default: 20 },
  ],
  /*
   * Kinetic theory. The root-mean-square speed of a molecule of molar mass M in
   * a gas or liquid at temperature T is v = root(3RT/M), and its average
   * translational energy is (3/2)kT. For water, M = 0.018 kg/mol, so at 20
   * degrees a molecule averages 637 m/s and 6.07 zeptojoules — and neither
   * number is a temperature. Temperature is what the whole crowd has.
   */
  measure: (v) => {
    const tempK = v.tempC + 273.15;
    return {
      tempK,
      rmsSpeed: Math.sqrt((3 * 8.314 * tempK) / 0.018),
      energyZeptojoules: 1.5 * 1.380649e-23 * tempK * 1e21,
      boiling: v.tempC >= 100 ? 1 : 0,
    };
  },
  /*
   * The two halves answer the same slider in different currencies, which is the
   * whole lesson. The single molecule only moves faster — its colour never
   * changes, because one molecule has no temperature to show. The glass gets
   * hotter as a body: it reddens, and at 100 degrees it boils.
   */
  drive: ({ v, f, t, index }) => {
    if (index === 0) {
      const jitter = f.rmsSpeed / 700;
      return {
        offset: [Math.sin(t * 5.5 * jitter) * 0.42 * jitter, Math.cos(t * 7.1 * jitter) * 0.36 * jitter],
        spin: t * 2.4 * jitter,
      };
    }
    const hot = Math.min(4, Math.max(0, Math.round(v.tempC / 25)));
    return {
      color: ["#4a63f0", "#6e79dd", "#a06fae", "#cc5a72", "#e0483f"][hot],
      bubbles: v.tempC >= 100 ? 1 : v.tempC >= 70 ? 0.35 : 0,
      level: 0.62 - (v.tempC >= 100 ? 0.14 : 0),
    };
  },
};

/* A1.5 — Systems across scales, from a cell to a planet. */
const SCALE_LADDER: ArchetypeSpec = {
  id: "g6a1-scale-ladder",
  title: "Ladder of Systems",
  tagline: "Climb from a mitochondrion to a planet without changing the idea.",
  kind: "process",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Recognise the same system pattern at very different sizes.",
    "Order familiar systems from smallest to largest.",
  ],
  misconceptions: ["Only machines and living things count as systems"],
  specimens: [{ id: "leafcell", name: "Leaf cell", art: { art: "cell", plant: true } }],
  stages: [
    { name: "Mitochondrion", at: 0,
      caption: "About 1 micrometre long. Its own parts work together to release energy." },
    { name: "Cell", at: 0.2,
      caption: "About 30 micrometres across. Organelles are its subsystems." },
    { name: "Leaf", at: 0.4,
      caption: "About 10 centimetres. Millions of cells feed one job: catching light." },
    { name: "Oak tree", at: 0.6,
      caption: "Up to 30 metres. Roots, trunk and leaves are subsystems of one organism." },
    { name: "Woodland", at: 0.8,
      caption: "A few square kilometres. Trees, soil, fungi and animals exchange matter and energy." },
    { name: "Earth", at: 1,
      caption: "12 742 kilometres across. Rock, water, air and life, all one system." },
  ],
  /*
   * Climbing the ladder is zooming out, so the subject shrinks as the run goes
   * on. Each rung is roughly a hundred times the one below it — 1 micrometre to
   * 12 742 kilometres is 13 powers of ten in five steps — so the drawn size
   * falls by a constant factor per rung rather than a constant amount, which is
   * what a logarithmic ladder looks like. It also turns faster as it goes: a
   * mitochondrion is a fixed lump, a planet is a spinning one.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    return {
      scale: 1.7 * Math.pow(0.22, p),
      spin: 0.5 + t * (0.14 + p * 0.9),
      tilt: 0.24 + p * 0.16,
    };
  },
};

export const g6a1SystemOrHeap = buildSim(SYSTEM_OR_HEAP);
export const g6a1NestedParts = buildSim(NESTED);
export const g6a1PartsInStep = buildSim(DRIVETRAIN);
export const g6a1OnlyTogether = buildSim(EMERGENT);
export const g6a1ScaleLadder = buildSim(SCALE_LADDER);
