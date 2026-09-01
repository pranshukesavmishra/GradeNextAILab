import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit A · Topic A3 — Models of systems.
 *
 * Five simulations, one per subtopic:
 *
 *   A3.1  g6a3-why-a-model         why scientists build models     (compare)
 *   A3.2  g6a3-boxes-and-arrows    diagrams and flowcharts         (process)
 *   A3.3  g6a3-touch-it-or-run-it  physical and digital models     (sort)
 *   A3.4  g6a3-not-just-smaller    what a model leaves out         (investigate)
 *   A3.5  g6a3-build-the-pond      building and revising a model   (assemble)
 *
 * A3.4 carries the weight of the topic. The square-cube law is the cleanest
 * honest demonstration that a model is never the thing itself: halve every
 * length and you quarter every area but you cut the weight to an eighth, so a
 * small model is far stronger for its weight than the bridge it stands for.
 */

/* A3.1 — Why scientists build models. */
const WHY_A_MODEL: ArchetypeSpec = {
  id: "g6a3-why-a-model",
  title: "Why Not Just Watch the Real Thing?",
  tagline: "A volcano and a tank of dyed water. Only one will erupt before lunch.",
  kind: "compare",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Give reasons scientists study a model instead of the system itself.",
    "Explain that a model can be repeated, which a real event cannot.",
  ],
  misconceptions: ["A model is only used when the real thing is unavailable"],
  specimens: [
    { id: "real", name: "A real volcano",
      because: "Magma at 1 100 degrees, a chamber kilometres down, and eruptions decades apart. Too hot, too big, too slow, and it will not perform on request.",
      art: { art: "sphere", color: "#e0722c", radius: 0.5, glow: 0.9 } },
    { id: "model", name: "A tank model on the bench",
      because: "Warm dyed water rising through cold water shows the same buoyancy. Safe, cheap, and you can run it twenty times and change one thing each run.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#c8582f", bubbles: 3 } },
  ],
};

/* A3.2 — Diagrams and flowcharts as models. */
const BOXES_AND_ARROWS: ArchetypeSpec = {
  id: "g6a3-boxes-and-arrows",
  title: "Boxes and Arrows",
  tagline: "Walk a flowchart of a house heating itself, box by box.",
  kind: "process",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Read a flowchart as a model: boxes are parts, arrows are flows.",
    "Identify a feedback loop that returns information to the start.",
  ],
  misconceptions: ["A flowchart is just a picture, not a model"],
  specimens: [{ id: "boiler", name: "Gas boiler", art: { art: "apparatus", which: "burner" } }],
  stages: [
    { name: "Sense", at: 0,
      caption: "The thermostat reads 17 degrees. The set point is 20, so the room is too cold." },
    { name: "Signal", at: 0.2,
      caption: "An arrow, not a pipe: information travels to the boiler, no matter moves." },
    { name: "Burn", at: 0.4,
      caption: "The boiler burns gas and heats water to about 65 degrees. Here matter and energy both flow." },
    { name: "Pump", at: 0.6,
      caption: "The pump pushes hot water round the radiator circuit. The water returns cooler and goes round again." },
    { name: "Warm the room", at: 0.8,
      caption: "Radiators pass energy to the air, mostly by convection. The room temperature climbs." },
    { name: "Loop closes", at: 1,
      caption: "The thermostat reads 20 and switches the boiler off. An output has become an input: that is feedback." },
  ],
};

/* A3.3 — Physical and digital models. */
const TOUCH_OR_RUN: ArchetypeSpec = {
  id: "g6a3-touch-it-or-run-it",
  title: "Touch It, or Run It?",
  tagline: "Sort six models by what they are made of, not what they show.",
  kind: "sort",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Tell a physical model from a computer model.",
    "Explain that both kinds stand in for the same real system.",
  ],
  misconceptions: ["A model must look like the thing it models"],
  categories: [
    { id: "physical", name: "Physical model", hint: "something you can touch and load" },
    { id: "computer", name: "Computer model", hint: "rules and numbers, run as code" },
  ],
  specimens: [
    { id: "truss", name: "Wooden truss bridge in a load rig", category: "physical",
      because: "You hang real weights on it until it fails. The answer comes out as a bang, not a number.",
      art: { art: "apparatus", which: "stand" } },
    { id: "streamtable", name: "Stream table of sand, water and a slope", category: "physical",
      because: "Real water really erodes real sand. A river valley forms in ten minutes instead of ten thousand years.",
      art: { art: "glassware", which: "beaker", level: 0.4, precipitate: 0.75 } },
    { id: "plasticcell", name: "Plastic model of a cell", category: "physical",
      because: "Moulded parts you can lift out and hold. It shows shape and position, and nothing else.",
      art: { art: "cell", plant: true } },
    { id: "climate", name: "Climate model on a supercomputer", category: "computer",
      because: "The atmosphere is cut into millions of boxes and the equations for each are solved over and over.",
      art: { art: "sphere", color: "#5b9bd5", radius: 0.48, glow: 0.85 } },
    { id: "flu", name: "Computer model of flu spreading", category: "computer",
      because: "Nothing is built. Rules about who meets whom are run forward to predict next month's cases.",
      art: { art: "microbe", which: "virus" } },
    { id: "windtunnel", name: "Model car in a wind tunnel", category: "physical",
      because: "A shaped body with real air blown over it, and a real force measured on the mount.",
      art: { art: "apparatus", which: "cart" } },
  ],
};

/* A3.4 — What a model leaves out on purpose. */
const NOT_JUST_SMALLER: ArchetypeSpec = {
  id: "g6a3-not-just-smaller",
  title: "The Model Is Not Just Smaller",
  tagline: "Shrink a bridge and its weight falls faster than its strength.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Work out how length, area and mass change when a model is scaled down.",
    "Explain one thing a scale model leaves out and why that matters.",
  ],
  misconceptions: ["A scale model behaves exactly like the real thing, only smaller"],
  specimens: [{ id: "bridge", name: "Steel footbridge, 40 m span, 12 000 kg", art: { art: "apparatus", which: "stand" } }],
  variables: [
    { key: "scale", label: "Model scale (1 to n)", min: 2, max: 100, step: 1, default: 20 },
  ],
  // Lengths divide by n, areas by n squared, volumes and mass by n cubed.
  // Strength follows area, weight follows volume, so the model is n times
  // stronger for its own weight than the bridge it stands for.
  measure: (v) => {
    const s = v.scale;
    return {
      modelSpanM: 40 / s,
      modelDeckAreaM2: 80 / (s * s),
      modelMassKg: 12000 / (s * s * s),
      strengthPerWeightGain: s,
    };
  },
  plot: { x: "scale", y: "modelMassKg", xLabel: "Model scale (1 to n)", yLabel: "Model mass (kg)" },
};

/* A3.5 — Building and revising a model of a system. */
const BUILD_THE_POND: ArchetypeSpec = {
  id: "g6a3-build-the-pond",
  title: "Build the Model, Then Find the Gap",
  tagline: "Put a pond in a jar. Then work out what you left on the bank.",
  kind: "assemble",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Build a model that includes every part a system needs to keep running.",
    "Name what a working model still leaves out, and say whether it matters.",
  ],
  misconceptions: ["A finished model is finished for good"],
  specimens: [
    {
      id: "jar", name: "Pond in a jar", art: { art: "glassware", which: "flask", level: 0.6, bubbles: 2 },
      parts: [
        { id: "jar", name: "The jar", at: [0.34, -0.3],
          note: "The boundary. Glass lets light in and keeps water in, which makes this closed to matter and open to energy." },
        { id: "water", name: "Pond water", at: [0, 0.14],
          note: "The medium everything else lives in, and the store that carries dissolved gases and nutrients." },
        { id: "weed", name: "Pondweed", at: [-0.3, 0.2],
          note: "The producer. It turns light into sugar and releases oxygen: without it the jar runs down in days." },
        { id: "snail", name: "Snails", at: [0.28, 0.22],
          note: "The consumer. It eats weed and breathes out carbon dioxide the weed needs back. The loop only closes with both." },
        { id: "mud", name: "Mud from the pond bed", at: [-0.32, -0.14],
          note: "The decomposers. Bacteria in the mud return nutrients from dead material, or the loop leaks and stops." },
        { id: "gap", name: "What is still missing", at: [0.06, -0.44],
          note: "No fish, no rain, no winter, no frogs arriving. Leave them out on purpose to study the loop, then add them back when the question changes." },
      ],
    },
  ],
};

export const g6a3WhyAModel = buildSim(WHY_A_MODEL);
export const g6a3BoxesAndArrows = buildSim(BOXES_AND_ARROWS);
export const g6a3TouchItOrRunIt = buildSim(TOUCH_OR_RUN);
export const g6a3NotJustSmaller = buildSim(NOT_JUST_SMALLER);
export const g6a3BuildThePond = buildSim(BUILD_THE_POND);
