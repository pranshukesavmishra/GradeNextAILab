import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A6 — Engineering a collision solution.
 *
 * Five simulations, one per subtopic:
 *
 *   A6.1  g8a6-must-or-may       defining criteria and constraints (sort)
 *   A6.2  g8a6-longer-to-crush   crumple zones and impulse         (investigate)
 *   A6.3  g8a6-what-could-work   generating candidate solutions    (assemble)
 *   A6.4  g8a6-two-noses-scored  systematic evaluation of designs  (compare)
 *   A6.5  g8a6-the-recommendation reporting the choice and its cost (trace)
 *
 * One test case runs through the whole topic: a 70 kg occupant at 13.4 m/s,
 * which is 30 mph, carrying 6 285 J of kinetic energy. A crumple zone gets rid
 * of that energy over a distance, and the average force is simply the energy
 * divided by that distance, so 0.60 m of crush means 10.5 kN.
 */

/* ---------------------------------------------------------------- *
 * A6.1 — Defining criteria and constraints
 * ---------------------------------------------------------------- */

const MUST_OR_MAY: ArchetypeSpec = {
  id: "g8a6-must-or-may",
  title: "How Good, or How Limited?",
  tagline: "A criterion says how well it must work. A constraint says what you may not do.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Separate the criteria a design is judged by from the constraints it must work within.",
    "Write a criterion as a measurable number rather than a wish.",
  ],
  misconceptions: [
    "Criteria and constraints are two words for the requirements list",
    "A constraint is anything that makes the design harder",
  ],
  categories: [
    { id: "criterion", name: "Criterion", hint: "how success is measured" },
    { id: "constraint", name: "Constraint", hint: "a limit you cannot design around" },
  ],
  specimens: [
    {
      id: "force", name: "Peak force on the dummy below 15 kN", category: "criterion",
      because:
        "This is the test the design has to pass, and it is a number, so two designs can be ranked by it. 15 kN on 70 kg is 22 g, near the limit a braced adult survives.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "egg", name: "The egg must survive a 2.0 m drop", category: "criterion",
      because:
        "Measurable and pass or fail. From 2.0 m the egg arrives at 6.3 m/s, so the design has to remove 6.3 m/s without cracking a shell that fails at about 40 N.",
      art: { art: "sphere", color: "#f5ead4", radius: 0.38 },
    },
    {
      id: "time", name: "Stopping time above 0.10 s", category: "criterion",
      because:
        "Another way of writing the same goal: at 13.4 m/s a 70 kg occupant needs at least 0.10 s to keep the force under 9.4 kN.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "space", name: "The nose must fit inside 200 mm", category: "constraint",
      because:
        "The chassis is already built, so no design may be longer, however well it would score. Constraints are fixed before the ideas start.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "materials", name: "Only card, straws and tape", category: "constraint",
      because:
        "A limit on what you may use, not on how well it must work. It rules out a steel spring even if a steel spring would win.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "mass", name: "No more than 250 g may be added", category: "constraint",
      because:
        "Every gram of nose is a gram the vehicle must accelerate for the rest of its life. The limit is set by the budget, not by the crash.",
      art: { art: "apparatus", which: "battery" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A6.2 — Crumple zones and impulse, conceptually
 * ---------------------------------------------------------------- */

const LONGER_TO_CRUSH: ArchetypeSpec = {
  id: "g8a6-longer-to-crush",
  title: "Give It Further to Crush",
  tagline: "The energy is fixed at 6 285 J. Spread it over more metres and the force falls.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Relate crumple distance to the average force in a collision.",
    "Explain a crumple zone as a way of buying stopping time, not of absorbing the crash.",
  ],
  misconceptions: [
    "A stronger car body protects the people inside better",
    "A crumple zone works by making the car bounce off",
  ],
  specimens: [{ id: "crumple", name: "Crumple element", art: { art: "apparatus", which: "spring" } }],
  variables: [
    { key: "mass", label: "Occupant mass (kg)", min: 40, max: 100, step: 1, default: 70 },
    { key: "speed", label: "Impact speed (m/s)", min: 5, max: 30, step: 0.1, default: 13.4 },
    { key: "crumple", label: "Crumple distance (m)", min: 0.05, max: 1.2, step: 0.05, default: 0.6 },
  ],
  // Work and energy: all the kinetic energy has to be taken out over the
  // crumple distance, so the average force is half m v squared divided by d,
  // which is the same as m a with a = v squared over 2 d. The stopping time
  // for a steady deceleration is 2 d over v.
  measure: (v) => ({
    kineticEnergyJ: 0.5 * v.mass * v.speed * v.speed,
    decelerationMs2: (v.speed * v.speed) / (2 * v.crumple),
    forceKN: (v.mass * v.speed * v.speed) / (2 * v.crumple) / 1000,
    stoppingTimeS: (2 * v.crumple) / v.speed,
    decelerationG: (v.speed * v.speed) / (2 * v.crumple) / 9.81,
  }),
  plot: { x: "crumple", y: "forceKN", xLabel: "Crumple distance (m)", yLabel: "Average force (kN)" },
};

/* ---------------------------------------------------------------- *
 * A6.3 — Generating candidate solutions
 * ---------------------------------------------------------------- */

const WHAT_COULD_WORK: ArchetypeSpec = {
  id: "g8a6-what-could-work",
  title: "Six Things That Could Work",
  tagline: "Collect every candidate before judging any of them.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Generate several distinct candidate solutions before narrowing down.",
    "Say what each candidate does to the stopping time or the stopping distance.",
  ],
  misconceptions: [
    "The first workable idea is the one to build",
    "A part that springs back has absorbed the energy",
  ],
  specimens: [
    {
      id: "vehicle", name: "Test vehicle, front end",
      art: { art: "apparatus", which: "cart" },
      parts: [
        {
          id: "can", name: "Crumple can", at: [0.02, -0.64],
          note: "Folds at 3 kN over 0.30 m: 900 J taken and kept.",
        },
        {
          id: "foam", name: "Foam block", at: [0.62, -0.3],
          note: "Good for about 40 J, then it bottoms out hard.",
        },
        {
          id: "spring", name: "Steel spring", at: [0.62, 0.24],
          note: "Stores 250 J and hands every joule straight back.",
        },
        {
          id: "nose", name: "Longer nose", at: [0.04, 0.64],
          note: "0.30 m to 0.60 m of crush halves the peak force.",
        },
        {
          id: "belt", name: "Seatbelt", at: [-0.62, 0.26],
          note: "Keeps the dummy on the vehicle's slow-down curve.",
        },
        {
          id: "airbag", name: "Airbag", at: [-0.62, -0.3],
          note: "Adds 0.03 s and spreads the load over the chest.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A6.4 — Systematic evaluation of designs
 * ---------------------------------------------------------------- */

const TWO_NOSES_SCORED: ArchetypeSpec = {
  id: "g8a6-two-noses-scored",
  title: "Two Noses, One Score Sheet",
  tagline: "Same test, same criteria, and only one of them gets under 15 kN.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Score competing designs against the same criteria on the same test.",
    "Explain why a design can win on one criterion and still be rejected.",
  ],
  misconceptions: [
    "The lighter design is automatically better",
    "A design that fails one criterion can be fixed by scoring well on the others",
  ],
  specimens: [
    {
      id: "foam", name: "Foam nose, 0.25 m of crush",
      because: "25.1 kN and 180 g added. Lighter, but it fails the force test.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "can", name: "Crumple can, 0.60 m of crush",
      because: "10.5 kN and 240 g added. Heavier, and it passes.",
      art: { art: "apparatus", which: "cart" },
    },
  ],
  variables: [
    { key: "mass", label: "Occupant mass (kg)", min: 40, max: 100, step: 1, default: 70 },
    { key: "speed", label: "Test speed (m/s)", min: 5, max: 30, step: 0.1, default: 13.4 },
    { key: "limit", label: "Force criterion (kN)", min: 5, max: 30, step: 0.5, default: 15 },
  ],
  // Both designs are scored on the same run. Force is half m v squared over
  // the crush distance: 0.25 m for the foam nose, 0.60 m for the crumple can.
  measure: (v) => {
    const energy = 0.5 * v.mass * v.speed * v.speed;
    const foam = energy / 0.25 / 1000;
    const can = energy / 0.6 / 1000;
    return {
      foamForceKN: foam,
      canForceKN: can,
      foamMarginPercent: ((v.limit - foam) / v.limit) * 100,
      canMarginPercent: ((v.limit - can) / v.limit) * 100,
    };
  },
};

/* ---------------------------------------------------------------- *
 * A6.5 — Reporting the best solution and its trade-offs
 * ---------------------------------------------------------------- */

const THE_RECOMMENDATION: ArchetypeSpec = {
  id: "g8a6-the-recommendation",
  title: "The Recommendation, and What It Costs",
  tagline: "Follow the 6 285 J from the bumper to the dummy, and say what you gave up.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Report a chosen design with the evidence that it meets each criterion.",
    "State the trade-offs the choice cost and the conditions the test did not cover.",
  ],
  misconceptions: [
    "The best design has no drawbacks",
    "A design tested once at one speed is finished",
  ],
  stages: [
    { name: "Impact", at: 0, caption: "70 kg at 13.4 m/s: 6 285 J and 938 kg m/s to get rid of." },
    { name: "Crumple", at: 0.25, caption: "The can folds through 0.60 m, taking all 6 285 J at 10.5 kN." },
    { name: "Belt", at: 0.5, caption: "The belt keeps the dummy on the same 0.090 s slow-down as the vehicle." },
    { name: "Verdict", at: 0.75, caption: "Peak force 10.5 kN against a 15 kN limit: 30 per cent of margin." },
    { name: "Cost", at: 1, caption: "240 g heavier, 0.60 m longer, and untested above 13.4 m/s." },
  ],
  route: [
    { at: [0.1, 0.56], name: "Impact", note: "6 285 J of kinetic energy arriving." },
    { at: [0.26, 0.34], name: "Crumple can", note: "0.60 m of crush at 10.5 kN average." },
    { at: [0.44, 0.56], name: "Seatbelt", note: "Holds the dummy on the 0.090 s curve." },
    { at: [0.61, 0.33], name: "Meets the limit", note: "10.5 kN of the 15 kN allowed: 30% spare." },
    { at: [0.77, 0.55], name: "Trade-off", note: "240 g heavier and 0.60 m longer." },
    { at: [0.9, 0.36], name: "Next test", note: "At 20 m/s the force rises to 23.3 kN." },
  ],
};

export const g8a6MustOrMay = buildSim(MUST_OR_MAY);
export const g8a6LongerToCrush = buildSim(LONGER_TO_CRUSH);
export const g8a6WhatCouldWork = buildSim(WHAT_COULD_WORK);
export const g8a6TwoNosesScored = buildSim(TWO_NOSES_SCORED);
export const g8a6TheRecommendation = buildSim(THE_RECOMMENDATION);
