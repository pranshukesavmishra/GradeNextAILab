import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit A · Topic A5 — Investigation, measurement and evidence.
 *
 * Six simulations, one per subtopic:
 *
 *   A5.1  g6a5-before-you-light   lab safety and working safely   (assemble)
 *   A5.2  g6a5-variable-roles     variables and fair tests        (sort)
 *   A5.3  g6a5-read-it-properly   SI units and measurement        (explore)
 *   A5.4  g6a5-swing-and-graph    organising and graphing data    (investigate)
 *   A5.5  g6a5-claim-evidence     claim, evidence and reasoning   (process)
 *   A5.6  g6a5-two-things-changed designing an investigation      (investigate)
 *
 * A5.4 and A5.6 are deliberately opposite. The pendulum gives a clean law the
 * student can graph and trust; the cooling rig hands them two controls at once
 * so that a careless comparison produces a number that means nothing. Learning
 * to hold one variable still is the whole point of the topic.
 */

/* A5.1 — Lab safety and working like a scientist. */
const BENCH_SAFETY: ArchetypeSpec = {
  id: "g6a5-before-you-light",
  title: "Before You Light the Burner",
  tagline: "Set the bench up so the experiment is the only thing that happens.",
  kind: "assemble",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Set out the equipment a heating experiment needs before starting it.",
    "Give the reason behind each safety rule rather than only the rule.",
  ],
  misconceptions: ["Safety rules are arbitrary instructions rather than reasoned precautions"],
  specimens: [
    {
      id: "bench", name: "Heating bench", art: { art: "apparatus", which: "burner" },
      parts: [
        { id: "goggles", name: "Goggles on", at: [-0.02, -0.44],
          note: "Hot liquid can spit without warning when it boils. Goggles go on before the flame, not after the first bump." },
        { id: "hair", name: "Hair tied, sleeves back", at: [-0.36, -0.28],
          note: "A burner flame is about 500 degrees at the tip and nearly invisible on the blue setting. Anything loose can reach it." },
        { id: "mat", name: "Heatproof mat", at: [0.02, 0.42],
          note: "Protects the bench and catches spills. Glass that cracks on a cold surface stays on the mat, not in your lap." },
        { id: "stand", name: "Clamp stand", at: [0.36, 0.2],
          note: "Holds the tube steady and pointing away from everyone. A tube held in the hand tips, and a tube pointed at a face is a burn." },
        { id: "tongs", name: "Tongs", at: [-0.38, 0.18],
          note: "Hot glass looks exactly like cold glass. Move it with tongs and it can never be picked up by mistake." },
        { id: "clear", name: "Bench clear", at: [0.34, -0.3],
          note: "Bags on the floor, books away, one clear route out. Most lab accidents are trips and knocks, not chemistry." },
      ],
    },
  ],
};

/* A5.2 — Variables and fair tests. */
const VARIABLE_ROLES: ArchetypeSpec = {
  id: "g6a5-variable-roles",
  title: "Which Kind of Variable?",
  tagline: "The question: which cup keeps a drink hottest? Give each variable its job.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Classify a variable as independent, dependent or controlled.",
    "Explain why a test with two variables changing answers nothing.",
  ],
  misconceptions: ["Any variable you write down is being tested"],
  categories: [
    { id: "independent", name: "Independent", hint: "the one thing you change" },
    { id: "dependent", name: "Dependent", hint: "what you measure" },
    { id: "controlled", name: "Controlled", hint: "kept the same on purpose" },
  ],
  specimens: [
    { id: "material", name: "The cup material: plastic, metal or foam", category: "independent",
      because: "This is the one thing deliberately changed between the three runs. A fair test has exactly one.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "final", name: "The water temperature after 20 minutes", category: "dependent",
      because: "It is measured, not set. Its value depends on which cup you chose.",
      art: { art: "glassware", which: "testTube", level: 0.35, color: "#c0392b" } },
    { id: "minutes", name: "The number of minutes it stays above 60 degrees", category: "dependent",
      because: "A second outcome measured from the same run. Both depend on the cup, so both are dependent.",
      art: { art: "sphere", color: "#e8dcc0", radius: 0.4 } },
    { id: "volume", name: "The volume of water: always 200 mL", category: "controlled",
      because: "More water holds more energy and cools more slowly, so letting it vary would spoil the comparison.",
      art: { art: "glassware", which: "flask", level: 0.5 } },
    { id: "start", name: "The starting temperature: always 80 degrees", category: "controlled",
      because: "A hotter start always loses more degrees. Fix it, or the difference you measure is not the cup.",
      art: { art: "apparatus", which: "burner" } },
    { id: "room", name: "The room temperature: always 21 degrees", category: "controlled",
      because: "Cooling depends on the gap between the drink and the room. Move the test near a window and the gap changes.",
      art: { art: "sphere", color: "#c6d6e6", radius: 0.5, glow: 0.3 } },
  ],
};

/* A5.3 — SI units and measurement. */
const READ_IT_PROPERLY: ArchetypeSpec = {
  id: "g6a5-read-it-properly",
  title: "Read It Properly",
  tagline: "The cylinder is honest. Most of the error is in how you look at it.",
  kind: "explore",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Read a scale correctly and record the value with its SI unit.",
    "State the precision of an instrument from its smallest division.",
  ],
  misconceptions: ["A measurement is exact if the instrument is good"],
  specimens: [
    {
      id: "cylinder", name: "50 mL measuring cylinder", art: { art: "glassware", which: "testTube", level: 0.55 },
      parts: [
        { id: "meniscus", name: "The meniscus", at: [0.02, -0.16],
          note: "Water curves up the glass. Read the bottom of the curve, always, or every reading is high by about 0.5 mL." },
        { id: "eye", name: "Eye level", at: [0.36, -0.26],
          note: "Look level with the surface. Reading from above can shift the answer by 1 mL or more: that error is called parallax." },
        { id: "divisions", name: "Smallest division", at: [-0.34, -0.06],
          note: "The marks are 1 mL apart, so you can record to the nearest 0.5 mL. Writing 23.14 mL claims a precision the glass does not have." },
        { id: "unit", name: "The unit", at: [0.34, 0.16],
          note: "Millilitres. 1 mL = 1 cm3 and 1 000 mL = 1 L = 0.001 m3. A number without a unit is not a measurement." },
        { id: "base", name: "Flat and level", at: [-0.28, 0.3],
          note: "Stand it on the bench, not in your hand. A tilted cylinder gives a tilted surface and a wrong reading." },
        { id: "si", name: "The seven base units", at: [0.06, 0.42],
          note: "Metre, kilogram, second, ampere, kelvin, mole, candela. Everything else, including the litre, is built from these." },
      ],
    },
  ],
};

/* A5.4 — Organizing and graphing data. */
const SWING_AND_GRAPH: ArchetypeSpec = {
  id: "g6a5-swing-and-graph",
  title: "Swing, Time, Graph",
  tagline: "Collect points from a pendulum and let the curve tell you the rule.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-4"], ccssMath: ["6.SP.B.4", "6.SP.B.5"] },
  learningGoals: [
    "Record paired measurements and plot them as a graph.",
    "Read a relationship off a curve rather than from a single reading.",
  ],
  misconceptions: ["A heavier bob makes a pendulum swing faster"],
  specimens: [{ id: "bob", name: "The bob on its string", art: { art: "sphere", color: "#8a92a8", radius: 0.42 } }],
  variables: [
    { key: "length", label: "String length (m)", min: 0.1, max: 2, step: 0.05, default: 1 },
    { key: "mass", label: "Mass of the bob (g)", min: 20, max: 500, step: 10, default: 100 },
  ],
  // The small-swing pendulum period, T = 2 pi root(L/g) with g = 9.81 m/s2.
  // Mass is a control here on purpose: it moves the bob's weight and the
  // energy of the swing, and moves the timing columns not at all — the null
  // result on the period is the point.
  measure: (v) => {
    const period = 2 * Math.PI * Math.sqrt(v.length / 9.81);
    const kg = v.mass / 1000;
    return {
      periodS: period,
      twentySwingsS: 20 * period,
      swingsPerMinute: 60 / period,
      bobWeightN: kg * 9.81,
      swingEnergyMillijoules: 1000 * kg * 9.81 * v.length * (1 - Math.cos(0.4)),
    };
  },
  plot: { x: "length", y: "periodS", xLabel: "String length (m)", yLabel: "Time for one swing (s)" },
  /*
   * The bob swings at the period the panel prints — one full there-and-back
   * every T seconds — on a true circular arc, so it rises slightly at each end
   * exactly as a real pendulum does. Angle is held at 0.4 radians for every
   * length, so the arc it sweeps grows with the string, and a 2 m pendulum is
   * both slower and wider than a 0.1 m one.
   *
   * Mass is the control that proves itself. A heavier bob is drawn bigger by
   * the cube root of its mass, because that is how a ball's width follows its
   * mass, and it changes the swing not at all: 500 g keeps time with 20 g. The
   * student can see the answer to the misconception rather than being told it.
   */
  drive: ({ v, f, t }) => {
    const theta = 0.4 * Math.cos((2 * Math.PI * t) / f.periodS);
    const arm = (1.05 * v.length) / (2 * 0.3894);
    return {
      offset: [arm * Math.sin(theta), -arm * (1 - Math.cos(theta))],
      scale: Math.cbrt(v.mass / 100) * 0.85,
      spin: 0.68,
    };
  },
};

/* A5.5 — Claim, evidence and reasoning. */
const CLAIM_EVIDENCE: ArchetypeSpec = {
  id: "g6a5-claim-evidence",
  title: "Claim, Evidence, Reasoning",
  tagline: "Build one argument properly, in the order a scientist would build it.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Separate a claim from the evidence that supports it.",
    "Write reasoning that links evidence to a scientific idea.",
  ],
  misconceptions: ["Restating the result counts as reasoning"],
  specimens: [{ id: "cup", name: "The tested cup", art: { art: "glassware", which: "beaker", level: 0.5 } }],
  stages: [
    { name: "Question", at: 0,
      caption: "Which cup keeps 200 mL of water hottest for 20 minutes?" },
    { name: "Claim", at: 0.25,
      caption: "Claim: the foam cup keeps the water hottest. One sentence, and it answers the question asked." },
    { name: "Evidence", at: 0.5,
      caption: "Evidence: after 20 minutes the foam cup read 68 degrees, the plastic 58, the metal 56. Same start, same volume, same room." },
    { name: "Reasoning", at: 0.75,
      caption: "Reasoning: foam traps still air, and air conducts heat about 2 000 times worse than steel, so less energy escapes each second." },
    { name: "Check it", at: 1,
      caption: "What else could explain it? Repeat the runs, swap the thermometers, and see whether the order holds." },
  ],
  /*
   * The argument is about a cup of water cooling, so the cup cools while the
   * argument is built: 80 degrees and steaming at the question, 68 by the time
   * the evidence is quoted, room temperature by the time it is checked. The
   * colours are the readings the evidence step actually cites, so the picture
   * and the sentence never disagree.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    return {
      level: 0.5,
      color: ["#e0483f", "#d95f43", "#c07a58", "#8f8a86", "#6f86a8"][Math.min(4, Math.floor(p * 5))],
      bubbles: p < 0.3 ? 0.6 : 0,
    };
  },
};

/* A5.6 — Designing an investigation of a system. */
const TWO_THINGS_CHANGED: ArchetypeSpec = {
  id: "g6a5-two-things-changed",
  title: "Two Things Changed at Once",
  tagline: "Change the insulation and the starting temperature together, and the answer means nothing.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Design a test in which only the variable under study changes.",
    "Explain how a confounded variable makes a result impossible to interpret.",
  ],
  misconceptions: ["If two setups give different results, the thing you changed must be the cause"],
  specimens: [{ id: "cup", name: "Insulated beaker of water", art: { art: "glassware", which: "beaker", level: 0.6 } }],
  variables: [
    { key: "thicknessMm", label: "Wool insulation (mm)", min: 1, max: 20, step: 1, default: 3 },
    { key: "startTempC", label: "Starting temperature (degrees C)", min: 40, max: 90, step: 1, default: 80 },
    { key: "minutes", label: "Time (minutes)", min: 0, max: 60, step: 1, default: 20 },
  ],
  // 200 g of water in a beaker of surface area 0.035 m2, room at 21 degrees.
  // Heat escapes through the wool (k = 0.04 W/m K) and then through the still
  // air film at the surface (h = 10 W/m2 K), so the two resistances add. The
  // temperature then follows Newton's law of cooling with a time constant
  // tau = m c / (U A). The drop depends on the starting temperature as well as
  // the insulation, which is exactly the trap.
  measure: (v) => {
    const area = 0.035, room = 21, heatCapacity = 0.2 * 4186;
    const u = 1 / (v.thicknessMm / 1000 / 0.04 + 1 / 10);
    const tau = heatCapacity / (u * area);
    const remaining = Math.exp((-v.minutes * 60) / tau);
    const temp = room + (v.startTempC - room) * remaining;
    return {
      finalTempC: temp,
      dropC: v.startTempC - temp,
      tauMinutes: tau / 60,
    };
  },
  plot: { x: "thicknessMm", y: "dropC", xLabel: "Insulation thickness (mm)", yLabel: "Temperature drop (degrees C)" },
  /*
   * The beaker shows the temperature it has actually reached, on the scale a
   * thermochromic strip uses: red above 70, through amber and grey, to blue at
   * room temperature. It steams while it is above 80 and rolls when it reaches
   * 100, which is what makes the trap visible — turn the starting temperature
   * up and the drop gets bigger whatever the wool is doing, so two runs with
   * different starts cannot be compared at all.
   */
  drive: ({ f }) => {
    const band = Math.max(0, Math.min(5, Math.floor((f.finalTempC - 50) / 5)));
    return {
      level: 0.6,
      color: ["#4a63f0", "#4a9ad8", "#59b3a0", "#c8a33f", "#d9743c", "#e0483f"][band],
      bubbles: f.finalTempC >= 100 ? 1 : f.finalTempC >= 80 ? 0.45 : 0,
    };
  },
};

export const g6a5BeforeYouLight = buildSim(BENCH_SAFETY);
export const g6a5VariableRoles = buildSim(VARIABLE_ROLES);
export const g6a5ReadItProperly = buildSim(READ_IT_PROPERLY);
export const g6a5SwingAndGraph = buildSim(SWING_AND_GRAPH);
export const g6a5ClaimEvidence = buildSim(CLAIM_EVIDENCE);
export const g6a5TwoThingsChanged = buildSim(TWO_THINGS_CHANGED);
