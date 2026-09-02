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
 *
 * So the cart runs. In A4.2 it covers half a t squared over a two-second run,
 * which means zero net force leaves it standing exactly where it started; in
 * A4.3 it makes all five runs in turn, each one visibly quicker than the last;
 * and in A4.4 it stops dead as soon as friction grows past the pull, which is
 * the moment the prediction and the measurement part company for good.
 */

/** A 0-1 sawtooth that runs once every `period` seconds. */
function cycle(t: number, period: number): number {
  const p = (t / period) % 1;
  return p < 0 ? p + 1 : p;
}

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
  /*
   * The three kinds behave differently on the bench, so they are drawn behaving
   * differently. The independent variable is the one you step through, so the
   * balance walks up its five settings, 0.981 N at a time. The dependent ones
   * answer back: a reading arrives, holds, and is replaced by the next. The
   * controlled ones do not move at all — being identical from run to run is
   * the entire job of a controlled variable, and a student who notices that
   * three of these six never so much as twitch has understood the category.
   */
  drive: ({ t, specimen }) => {
    switch (specimen.id) {
      // Independent: five settings, stepped through in order.
      case "pull": {
        const step = Math.floor(cycle(t, 7.5) * 5);           // 0 to 4
        return { scale: 0.78 + 0.14 * step, spin: 0.12, tilt: 0.2 };
      }
      // Dependent: a reading that arrives after each run and then settles.
      case "accel": {
        const k = cycle(t, 1.5);
        return { scale: 1 + 0.14 * Math.exp(-6 * k) };
      }
      case "timer": {
        const k = cycle(t, 1.5);
        return { scale: 1 + 0.1 * Math.exp(-6 * k), spin: 0.68 };
      }
      // Controlled: identical every run, which on the bench means motionless.
      default:
        return { offset: [0, 0], spin: 0.68 };
    }
  },
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
  /*
   * A two-second run, drawn on 8 m of track and then held at wherever it got
   * to until the next run starts. The cart covers half a t squared, so 6 N on
   * 2 kg gives 3 m/s2 and is 6 m along at the end of the run, while 20 N on
   * 2 kg gives 10 m/s2 and is off the end of the track after 1.3 s. Set the
   * net force to zero and the cart does not move at all: no net force, no
   * change of motion, and the picture says it without a word. It is drawn
   * larger as the mass grows, by the cube root, because a cart with five times
   * the load on it is only 1.7 times as wide.
   */
  drive: ({ v, f, t }) => {
    const tau = Math.min(cycle(t, 5) * 5, 2);
    const s = 0.5 * f.accelerationMs2 * tau * tau;
    return {
      scale: Math.cbrt(v.mass / 2),
      offset: [-0.55 + 1.15 * Math.min(1, s / 8), 0],
      spin: 0.68,
    };
  },
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
  specimens: [
    { id: "cart", name: "The 1.00 kg cart on the levelled track",
      art: { art: "apparatus", which: "cart" } },
  ],
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
  /*
   * All five runs, in order, over and over. Run n has n masses on the hanger,
   * so the pull is 0.981 n newtons on a moving mass held at 1.00 kg and the
   * acceleration is 0.981 n m/s2. Each run is 1.4 s long and the cart covers
   * half a t squared, which is 0.96 m on run one and 4.81 m on run five, drawn
   * on the same 5 m of track. The five runs are visibly different lengths, and
   * that difference is the straight line the topic is trying to produce.
   */
  drive: ({ t }) => {
    const run = Math.floor(cycle(t, 10) * 5);                 // 0 to 4
    const tau = Math.min(cycle(t, 2) * 2, 1.4);
    const a = 0.981 * (run + 1);
    const s = 0.5 * a * tau * tau;
    return { offset: [-0.5 + Math.min(1, s / 5), 0], spin: 0.68 };
  },
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
  specimens: [
    { id: "balance", name: "Spring balance on the cord", art: { art: "apparatus", which: "spring" } },
  ],
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
  /*
   * The balance is the instrument, so it reads. Its extension is proportional
   * to the force in the cord, which is what a spring balance is, and it is
   * dragged along at the acceleration the cart actually gets — F minus mu m g,
   * over m — rather than the one the prediction promised. The failure state is
   * the interesting one: wind the rolling coefficient up past mu = F / (m g)
   * and the balance stretches to a healthy reading while nothing moves at all.
   * A pull can be plainly there on the dial and still not be enough.
   */
  drive: ({ v, f, t }) => {
    const tau = Math.min(cycle(t, 3.4) * 3.4, 2);
    const s = 0.5 * f.measuredAccelMs2 * tau * tau;
    return {
      scale: 0.7 + (v.force / 6) * 0.45,
      offset: [-0.5 + 0.7 * Math.min(1, s / 12), 0],
      spin: 0.12,
      tilt: 0.2,
    };
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
