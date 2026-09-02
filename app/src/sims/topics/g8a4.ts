import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A4 — Forces, mass and change in motion.
 *
 * Five simulations, one per subtopic:
 *
 *   A4.1  g8a4-three-kinds-of-variable  planning a fair test          (sort)
 *   A4.2  g8a4-force-over-mass          the force-mass-acceleration law (investigate)
 *   A4.3  g8a4-five-runs                running the investigation     (process)
 *   A4.4  g8a4-why-it-came-up-short     prediction against measurement (investigate)
 *   A4.5  g8a4-writing-it-up            communicating results         (assemble)
 *
 * The whole topic is one experiment: a 1.00 kg system pulled by masses on a
 * hanger. Each 100 g on the hanger is 0.981 N of pull, and because the total
 * moving mass is held at 1.00 kg the acceleration comes out at 0.981 m/s2 per
 * step, which is what makes the graph a straight line through the origin.
 */

/* ---------------------------------------------------------------- *
 * A4.1 — Planning a fair test
 * ---------------------------------------------------------------- */

const THREE_KINDS_OF_VARIABLE: ArchetypeSpec = {
  id: "g8a4-three-kinds-of-variable",
  title: "Three Kinds of Variable",
  tagline: "One thing you change, two you measure, three you must not touch.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Sort the quantities in an investigation into independent, dependent and controlled.",
    "Explain why a second changed variable makes the result impossible to interpret.",
  ],
  misconceptions: [
    "A fair test just means being careful",
    "Anything you write down during the experiment is a dependent variable",
  ],
  categories: [
    { id: "independent", name: "Independent", hint: "the one thing you deliberately change" },
    { id: "dependent", name: "Dependent", hint: "what you measure to see the effect" },
    { id: "controlled", name: "Controlled", hint: "kept identical so it cannot interfere" },
  ],
  specimens: [
    {
      id: "pull", name: "Pull from the hanging masses", category: "independent",
      because:
        "This is what you set: 0.981 N for each 100 g hung. It is chosen before the run, not measured after it, which is what makes it the independent variable.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "accel", name: "Acceleration from the light gates", category: "dependent",
      because:
        "The number the experiment gives back. You cannot set it directly; it comes out of the pull you chose and the mass you kept fixed.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "timer", name: "Time to cross the 0.50 m gap", category: "dependent",
      because:
        "Measured, not chosen. It is the raw reading the acceleration is worked out from, so it depends on the pull just as much.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "mass", name: "Total moving mass, held at 1.00 kg", category: "controlled",
      because:
        "Masses are moved from the cart to the hanger rather than added, so the pull rises while the moving mass stays 1.00 kg. Change both and the graph means nothing.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "release", name: "The same magnetic release each run", category: "controlled",
      because:
        "A hand release adds a different push every time. The electromagnet lets go from rest identically, so run three can be compared with run one.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "track", name: "The same track, levelled each run", category: "controlled",
      because:
        "A slope of only one degree adds 0.17 m/s2 of gravity along the track, which is a fifth of the smallest acceleration being measured.",
      art: { art: "apparatus", which: "stand" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A4.2 — The force-mass-acceleration relationship
 * ---------------------------------------------------------------- */

const FORCE_OVER_MASS: ArchetypeSpec = {
  id: "g8a4-force-over-mass",
  title: "Force Over Mass",
  tagline: "Double the pull and the acceleration doubles. Double the mass and it halves.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.EE.B.5"] },
  learningGoals: [
    "Calculate acceleration from net force and mass using a = F / m.",
    "Describe acceleration as proportional to force and inversely proportional to mass.",
  ],
  misconceptions: [
    "A bigger force means a bigger speed rather than a bigger change of speed",
    "Doubling the mass halves the force needed",
  ],
  specimens: [{ id: "cart", name: "Dynamics cart", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "force", label: "Net force (N)", min: 0, max: 20, step: 0.1, default: 6 },
    { key: "mass", label: "Mass (kg)", min: 0.2, max: 10, step: 0.1, default: 2 },
  ],
  // Newton's Second Law, straight: a = F / m. Everything else on the readout
  // follows from that acceleration and the equations of motion, so a student
  // can check any of it by hand.
  measure: (v) => ({
    accelerationMs2: v.force / v.mass,
    speedAfter2sMs: (v.force / v.mass) * 2,
    distanceIn2sM: 0.5 * (v.force / v.mass) * 4,
    weightN: v.mass * 9.81,
  }),
  plot: { x: "force", y: "accelerationMs2", xLabel: "Net force (N)", yLabel: "Acceleration (m/s2)" },
};

/* ---------------------------------------------------------------- *
 * A4.3 — Running the investigation
 * ---------------------------------------------------------------- */

const FIVE_RUNS: ArchetypeSpec = {
  id: "g8a4-five-runs",
  title: "Five Runs, One Line",
  tagline: "Level the track, move one mass across at a time, and let the data build.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Carry out a force and acceleration investigation in a sequence that keeps it fair.",
    "Repeat readings and use the mean rather than a single measurement.",
  ],
  misconceptions: [
    "One reading per setting is enough if you measure carefully",
    "Adding masses to the hanger keeps everything else the same",
  ],
  specimens: [{ id: "rig", name: "Pulley and stand", art: { art: "apparatus", which: "stand" } }],
  stages: [
    { name: "Level", at: 0,
      caption: "Level the track first: a cart set down gently must not creep either way." },
    { name: "Load", at: 0.25,
      caption: "Five 100 g masses ride on the cart. Total moving mass 1.00 kg, and it stays there all day." },
    { name: "First run", at: 0.5,
      caption: "Move one mass to the hanger: 0.981 N of pull. Three runs, mean acceleration 0.98 m/s2." },
    { name: "Move another", at: 0.75,
      caption: "A second mass across: 1.96 N now, and the acceleration comes out at 1.96 m/s2." },
    { name: "Five points", at: 1,
      caption: "Pull 0.98 to 4.91 N, acceleration 0.98 to 4.91 m/s2. A straight line through the origin." },
  ],
};

/* ---------------------------------------------------------------- *
 * A4.4 — Comparing prediction to measured data
 * ---------------------------------------------------------------- */

const WHY_IT_CAME_UP_SHORT: ArchetypeSpec = {
  id: "g8a4-why-it-came-up-short",
  title: "Why the Measurement Came Up Short",
  tagline: "The prediction ignores friction. The cart does not.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Compare a predicted value with a measured one and quantify the gap.",
    "Identify friction as a systematic effect, not a random error.",
  ],
  misconceptions: [
    "A measurement that misses the prediction means the theory is wrong",
    "Repeating the run more times would remove the difference",
  ],
  specimens: [{ id: "balance", name: "Spring balance on the cord", art: { art: "apparatus", which: "spring" } }],
  variables: [
    { key: "force", label: "Applied force (N)", min: 0.2, max: 6, step: 0.1, default: 3 },
    { key: "mass", label: "Moving mass (kg)", min: 0.2, max: 5, step: 0.1, default: 1 },
    { key: "mu", label: "Rolling coefficient", min: 0, max: 0.3, step: 0.005, default: 0.05 },
  ],
  // The prediction leaves friction out: a = F / m. The cart actually feels
  // F minus mu m g, so it always comes out low, and the shortfall as a
  // percentage is mu m g / F: large at small pulls, negligible at big ones.
  // That falling curve is the signature of a systematic effect.
  measure: (v) => {
    const predicted = v.force / v.mass;
    const friction = v.mu * v.mass * 9.81;
    const measured = Math.max(0, (v.force - friction) / v.mass);
    return {
      predictedAccelMs2: predicted,
      frictionForceN: friction,
      measuredAccelMs2: measured,
      percentBelowPrediction: predicted > 0 ? ((predicted - measured) / predicted) * 100 : 0,
    };
  },
  plot: {
    x: "force", y: "percentBelowPrediction",
    xLabel: "Applied force (N)", yLabel: "Measurement below prediction (%)",
  },
};

/* ---------------------------------------------------------------- *
 * A4.5 — Communicating investigation results
 * ---------------------------------------------------------------- */

const WRITING_IT_UP: ArchetypeSpec = {
  id: "g8a4-writing-it-up",
  title: "Writing It Up So It Can Be Checked",
  tagline: "Click each piece a reader needs before they can believe your line.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Assemble a claim, its evidence and the reasoning that links them.",
    "Report the uncertainty and the conditions alongside the result.",
  ],
  misconceptions: [
    "A conclusion is just what you expected to happen",
    "A graph speaks for itself and needs no words",
  ],
  specimens: [
    {
      id: "report", name: "The write-up",
      art: { art: "apparatus", which: "cart" },
      parts: [
        {
          id: "claim", name: "Claim", at: [0.02, -0.62],
          note: "Acceleration is proportional to net force.",
        },
        {
          id: "evidence", name: "Evidence", at: [0.6, -0.3],
          note: "Five points, 0.98 to 4.91 N, gradient 0.99 kg-1.",
        },
        {
          id: "reasoning", name: "Reasoning", at: [0.62, 0.22],
          note: "A straight line through the origin means a = F/m.",
        },
        {
          id: "spread", name: "Spread of repeats", at: [0.05, 0.62],
          note: "Three runs each, spread under 0.04 m/s2.",
        },
        {
          id: "limits", name: "Conditions and limits", at: [-0.6, 0.28],
          note: "Level track, 1.00 kg total, pull below 5 N.",
        },
        {
          id: "next", name: "What to test next", at: [-0.6, -0.3],
          note: "Hold the force and change the mass instead.",
        },
      ],
    },
  ],
};

export const g8a4ThreeKindsOfVariable = buildSim(THREE_KINDS_OF_VARIABLE);
export const g8a4ForceOverMass = buildSim(FORCE_OVER_MASS);
export const g8a4FiveRuns = buildSim(FIVE_RUNS);
export const g8a4WhyItCameUpShort = buildSim(WHY_IT_CAME_UP_SHORT);
export const g8a4WritingItUp = buildSim(WRITING_IT_UP);
