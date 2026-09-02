import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit B · Topic B5 — Modeling and iterative testing.
 *
 * Five simulations, one per subtopic:
 *
 *   B5.1  g8b5-build-the-drop-rig   a model that generates data      (assemble)
 *   B5.2  g8b5-round-one            the first round of testing       (investigate)
 *   B5.3  g8b5-what-the-data-said   modifying from test data         (process)
 *   B5.4  g8b5-safe-or-small        naming the trade-off             (compare)
 *   B5.5  g8b5-two-layers           a second round of modification   (trace)
 *
 * One engineering problem carried through the whole topic: land a 58 g egg
 * from 2.00 m without breaking it. The model is one line, deceleration in g
 * equals drop height divided by crush distance, and it is exact whenever the
 * force is steady. Round one gives 66.7 g on 3 cm of foam and a broken egg;
 * round two buys crush distance and gets to 24.6 g, and the cost of that is
 * the trade-off the topic is really about.
 *
 * A design topic whose test never fails is not a design topic, so the egg
 * breaks on screen. A shell loaded at a point gives way near 30 N, and for a
 * 58 g egg that is 30 / (0.058 x 9.81) = 53 g of deceleration: everything
 * above that line lands, flattens and stays down, and everything below it
 * lands and is picked up for the next drop. The padded package is drawn at its
 * true radius, 25 mm of egg plus the jacket, so tripling the jacket makes it
 * three times as wide and, as the readout says, ten times as heavy.
 */

/** A 0-1 sawtooth that runs once every `period` seconds. */
function cycle(t: number, period: number): number {
  const p = (t / period) % 1;
  return p < 0 ? p + 1 : p;
}

/** The deceleration a 58 g shell survives in this rig: 30 N, so 53 g. */
const SHELL_LIMIT_G = 30 / (0.058 * 9.81);

/**
 * Where the falling package is, as a height above the floor in specimen widths.
 *
 * It is released, falls under gravity — so the distance goes as the square of
 * the time — lands, and is either lifted back for the next drop or left where
 * it fell. A package that has broken does not get lifted again, which is the
 * only honest way to draw a one-shot test.
 */
function drop(k: number, amplitude: number, broken: boolean): number {
  if (k < 0.45) {
    const u = k / 0.45;
    return amplitude * (1 - u * u);
  }
  if (broken) return 0;
  const u = (k - 0.45) / 0.55;
  return amplitude * u * u;                             // lifted back up
}

/* ---------------------------------------------------------------- *
 * B5.1 — Developing a model to generate data
 * ---------------------------------------------------------------- */

const BUILD_THE_DROP_RIG: ArchetypeSpec = {
  id: "g8b5-build-the-drop-rig",
  title: "Build the Drop Rig",
  tagline: "Six pieces. Leave one out and the numbers you collect will not mean anything.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Develop a physical model that generates data to test and refine a design.",
    "Explain why a fair test needs a fixed drop height, a fixed mass and repeated trials.",
  ],
  misconceptions: [
    "One successful drop shows the design works",
    "A model has to look like the real thing to be useful",
  ],
  specimens: [
    {
      id: "rig", name: "Egg-drop test rig",
      art: { art: "apparatus", which: "stand" },
      // A 58 g egg dropped 2.00 m arrives at root(2 x 9.81 x 2) = 6.26 m/s
      // carrying 0.058 x 9.81 x 2 = 1.14 J. Because deceleration in g is
      // simply height over crush distance, the rig only has to control two
      // lengths accurately to produce numbers worth trusting.
      parts: [
        { id: "stand", name: "Stand and metre rule", at: [-0.42, -0.32],
          note: "Fixes the drop at 2.00 m every time. Get this wrong by 10 cm and every deceleration you calculate is out by 5 per cent, and you will blame the foam." },
        { id: "release", name: "Electromagnet release", at: [-0.4, 0.26],
          note: "Cuts the current and the package falls from rest with no push and no spin. A hand release adds an unknown starting speed, which is an unknown amount of energy." },
        { id: "payload", name: "The 58 g egg", at: [0.04, -0.4],
          note: "Kept identical across every run so the energy arriving is always 0.058 x 9.81 x 2.00 = 1.14 J. Change the mass and you have changed two things at once." },
        { id: "foam", name: "The foam sample under test", at: [0.42, -0.26],
          note: "The one thing you are allowed to vary. Its crush distance is what buys the safety: deceleration in g is drop height divided by crush distance, so 3 cm gives 2.00 / 0.03 = 66.7 g." },
        { id: "logger", name: "Accelerometer and logger", at: [0.4, 0.3],
          note: "Records the real deceleration through the 30 ms or so the crush lasts. A steady force gives a flat-topped trace; a spike at the end means the foam bottomed out and the model no longer applies." },
        { id: "repeats", name: "Three drops per setting", at: [0.02, 0.42],
          note: "Foam does not crush the same way twice, and eggs vary. Three runs give a spread to quote, so a 5 per cent improvement can be told apart from luck." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.2 — Running a first round of testing
 * ---------------------------------------------------------------- */

const ROUND_ONE: ArchetypeSpec = {
  id: "g8b5-round-one",
  title: "Round One",
  tagline: "Three centimetres of foam, and a drop height you can raise until something breaks.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Generate data from a model and read a failure threshold off it.",
    "Use the relationship g = drop height / crush distance to predict a test result.",
  ],
  misconceptions: [
    "A heavier package hits harder, so a light egg is safer",
    "Doubling the drop height doubles the energy but not the force",
  ],
  specimens: [
    { id: "package", name: "Egg in a 3 cm foam jacket",
      art: { art: "sphere", color: "#e8d9b0", radius: 0.44 } },
  ],
  variables: [
    { key: "dropHeight", label: "Drop height (m)", min: 0.25, max: 4, step: 0.05, default: 2 },
    { key: "crushCm", label: "Foam crush distance (cm)", min: 1, max: 15, step: 0.5, default: 3 },
  ],
  // The whole first round in four lines. Impact speed is root(2 g h); the
  // energy is m g h for a 58 g egg; the average force over a crush distance d
  // is m g h / d; and the deceleration in multiples of g is h / d exactly,
  // with the mass cancelling out. From 2.00 m onto 3 cm that is 66.7 g, which
  // is well past what a shell survives in a school rig, and the crush lasts
  // 2 d / v = 9.6 ms.
  measure: (v) => {
    const d = v.crushCm / 100;
    const speed = Math.sqrt(2 * 9.81 * v.dropHeight);
    const energy = 0.058 * 9.81 * v.dropHeight;
    return {
      impactSpeedMs: speed,
      impactEnergyJ: energy,
      averageForceN: energy / d,
      decelerationG: v.dropHeight / d,
      crushTimeMs: ((2 * d) / speed) * 1000,
    };
  },
  plot: {
    x: "dropHeight", y: "decelerationG",
    xLabel: "Drop height (m)", yLabel: "Deceleration (g)",
  },
  /*
   * The rig runs. The package is released from the height set — drawn on a 4 m
   * scale, so 0.25 m is a nudge off the bench and 4 m is the full drop — falls
   * as half g t squared, and lands. Then the model is tested against the shell:
   * 2.00 m onto 3 cm of foam is 66.7 g, well past the 53 g the shell takes, so
   * it stays on the floor, flattened and pale, and no amount of repeating the
   * drop brings it back. Wind the height down to 0.75 m and the same 3 cm of
   * foam gives 25 g, and the package is picked up and dropped again all day.
   */
  drive: ({ f, t }) => {
    const broken = f.decelerationG >= SHELL_LIMIT_G;
    const k = cycle(t, 2.8);
    const height = drop(k, 0.85 * Math.min(1, f.impactSpeedMs / 8.9), broken);
    const landed = broken && k >= 0.45;
    return {
      offset: [0, 0.42 - height],
      scale: landed ? 0.72 : 1,
      color: landed ? "#c8b48a" : undefined,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B5.3 — Modifying the model from test data
 * ---------------------------------------------------------------- */

const WHAT_THE_DATA_SAID: ArchetypeSpec = {
  id: "g8b5-what-the-data-said",
  title: "What the Data Said",
  tagline: "Round one broke the egg. Read the numbers, change one thing, and run it again.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Use test data to decide which part of a design to change.",
    "Explain why buying crush distance beats adding stiffness or mass.",
  ],
  misconceptions: [
    "A failed test means starting the design again",
    "More padding always means a softer landing",
  ],
  specimens: [
    { id: "package", name: "The package, three versions",
      art: { art: "sphere", color: "#e8d9b0", radius: 0.46 } },
  ],
  // 2.00 m onto 3 cm is 2.00 / 0.03 = 66.7 g; onto 9 cm it is 22.2 g. The
  // 1.14 J that arrives never changes, so the only lever in the equation is
  // the distance over which it is spent.
  stages: [
    { name: "Round 1", at: 0,
      caption: "3 cm of foam, dropped 2.00 m. Logger reads 67 g and the shell cracks. 1.14 J arrived and 3 cm was all it had to stop in." },
    { name: "Read it", at: 0.25,
      caption: "g = h / d. Height is fixed by the brief, so distance is the only number left to change. Stiffer foam does not appear in the equation at all." },
    { name: "Round 2", at: 0.5,
      caption: "9 cm of the same foam. Predicted 2.00 / 0.09 = 22.2 g, logger reads 23. Egg survives, package is now 220 mm across." },
    { name: "Check the trace", at: 0.75,
      caption: "The trace is flat-topped, not spiked, so the foam crushed all the way and never bottomed out. The model held: prediction 22.2 g, measurement 23 g." },
    { name: "What changed", at: 1,
      caption: "One variable moved, from 3 cm to 9 cm, and the deceleration fell by a factor of three. The data, not the guesswork, chose which variable that was." },
  ],
  /*
   * The two rounds, one after the other, from the same 2.00 m. Round one is
   * the 3 cm jacket: a small package, 66.7 g on landing, and it stays where it
   * lands. Round two is the 9 cm jacket, drawn at its true radius — 115 mm
   * against 55 mm, so twice as wide — which is 22.2 g, and that one survives
   * and is picked up again. The same energy arrives both times. Only the
   * distance it is spent over has changed.
   */
  drive: ({ t }) => {
    const roundTwo = cycle(t, 8) >= 0.5;
    const k = cycle(t, 4);
    const height = drop(k, 0.8, !roundTwo);
    const landed = !roundTwo && k >= 0.45;
    return {
      offset: [0, 0.42 - height],
      scale: (roundTwo ? 1.18 : 0.62) * (landed ? 0.78 : 1),
      color: landed ? "#c8b48a" : undefined,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B5.4 — Naming the trade-off in each improvement
 * ---------------------------------------------------------------- */

const SAFE_OR_SMALL: ArchetypeSpec = {
  id: "g8b5-safe-or-small",
  title: "Safe, or Small",
  tagline: "The foam that saves the egg is the foam that will not fit through the letterbox.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Name the cost that comes with a design improvement.",
    "Compare two designs against criteria and constraints rather than against one number.",
  ],
  misconceptions: [
    "The best design is the one that scores best on the main criterion",
    "Improvements are free if the material is cheap",
  ],
  specimens: [
    {
      id: "compact", name: "Compact: 3 cm jacket, 110 mm across",
      because: "From 2.00 m the egg meets 2.00 / 0.03 = 66.7 g and breaks. It posts easily, weighs about 16 g of foam and costs almost nothing. It just does not work.",
      art: { art: "sphere", color: "#e8d9b0", radius: 0.3 },
    },
    {
      id: "padded", name: "Padded: 9 cm jacket, 230 mm across",
      because: "22.2 g and the egg survives. But the foam volume went up ten times with the cube of the radius, to about 158 g, and a 230 mm box costs more to post than the eggs are worth.",
      art: { art: "sphere", color: "#e8d9b0", radius: 0.62 },
    },
  ],
  variables: [
    { key: "jacketCm", label: "Padded design: jacket thickness (cm)", min: 1, max: 15, step: 0.5, default: 9 },
    { key: "dropHeight", label: "Drop height in the brief (m)", min: 0.5, max: 4, step: 0.05, default: 2 },
  ],
  // Both designs face the same drop, so both face the same 1.14 J. Safety is
  // h / d in g, and the compact design's d is fixed at 3 cm. The cost is
  // geometry: a jacket of thickness t around a 25 mm egg is a shell of volume
  // 4/3 pi ((0.025 + t) cubed - 0.025 cubed), and packing foam runs about
  // 25 kg per cubic metre, so 3 cm of jacket is 16 g of foam and 9 cm is
  // 158 g, ten times as much for three times the thickness.
  measure: (v) => {
    const t = v.jacketCm / 100;
    const shell = (r: number) => (4 / 3) * Math.PI * (Math.pow(0.025 + r, 3) - Math.pow(0.025, 3));
    return {
      compactDecelerationG: v.dropHeight / 0.03,
      paddedDecelerationG: v.dropHeight / t,
      compactFoamMassG: shell(0.03) * 25 * 1000,
      paddedFoamMassG: shell(t) * 25 * 1000,
      paddedWidthMm: (0.025 + t) * 2000,
    };
  },
  /*
   * The trade-off is a picture before it is a number. Both packages are drawn
   * to the same scale at their real radius, 25 mm of egg plus the jacket, so
   * the padded one grows with the control in a straight line while the readout
   * beside it grows with the cube: 1 cm of jacket is 0.6 g of foam and 15 cm
   * is 610 g, a thousand times as much for fifteen times the thickness. That
   * is the right power, and drawing the width as though it grew like the mass
   * would teach the wrong lesson entirely.
   *
   * And both are tested. The compact design is stuck at 3 cm, so from 2.00 m
   * it takes 66.7 g and breaks every time; the padded one survives until the
   * jacket is thin enough, or the brief's drop tall enough, to push it past
   * 53 g as well.
   */
  drive: ({ v, f, t, index }) => {
    const broken = (index === 0 ? f.compactDecelerationG : f.paddedDecelerationG)
      >= SHELL_LIMIT_G;
    const radius = index === 0 ? 0.055 : 0.025 + v.jacketCm / 100;
    const k = cycle(t, 3);
    const height = drop(k, 0.8 * Math.min(1, v.dropHeight / 4), broken);
    const landed = broken && k >= 0.45;
    return {
      offset: [0, 0.42 - height],
      scale: (radius / 0.115) * (landed ? 0.8 : 1),
      color: landed ? "#c8b48a" : undefined,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B5.5 — A second round of modification
 * ---------------------------------------------------------------- */

const TWO_LAYERS: ArchetypeSpec = {
  id: "g8b5-two-layers",
  title: "Two Layers, Two Forces",
  tagline: "Split the 9 cm into a soft outer layer and a firmer inner one, and follow all 1.14 J in.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Refine a design a second time using the result of the first modification.",
    "Show that the energy absorbed by a layer is the force it holds times the distance it crushes.",
  ],
  misconceptions: [
    "Softer padding is always better",
    "A second round of testing is only needed if the first one failed",
  ],
  // The package that arrives is the 9 cm from round two, split in two. A soft
  // outer layer crushing at a steady 12 N over 0.06 m absorbs 12 x 0.06 =
  // 0.72 J; a firmer inner layer at 14 N over 0.03 m absorbs 14 x 0.03 =
  // 0.42 J. Together that is 1.14 J, exactly the 0.058 x 9.81 x 2.00 that
  // arrives, and the largest force the egg ever feels is 14 N, which is
  // 14 / (0.058 x 9.81) = 24.6 g.
  route: [
    { at: [0.08, 0.24], name: "Release at 2.00 m",
      note: "0.058 kg falling 2.00 m. It arrives at 6.26 m/s with 1.14 J, and the package has 9 cm in which to take all of it." },
    { at: [0.24, 0.44], name: "Outer layer starts to crush",
      note: "Soft foam, chosen to collapse at about 12 N. It begins crushing the instant it touches, which is the point: a stiff outer skin would spike the force before anything moved." },
    { at: [0.42, 0.6], name: "6 cm of outer layer, at 12 N",
      note: "Work = force x distance = 12 x 0.06 = 0.72 J absorbed. That is nearly two thirds of the arriving energy, taken at a force the egg would barely notice." },
    { at: [0.6, 0.44], name: "The handover",
      note: "0.42 J is left and 3 cm of travel remains. To use it all, the inner layer has to hold 0.42 / 0.03 = 14 N, and no more." },
    { at: [0.76, 0.3], name: "3 cm of inner layer, at 14 N",
      note: "Firmer foam takes the last 0.42 J. Peak force on the egg is 14 N, so 14 / (0.058 x 9.81) = 24.6 g, against 66.7 g in round one and 22.2 g with a single soft layer." },
    { at: [0.92, 0.6], name: "Stopped, and where it all went",
      note: "1.14 J in, 0.72 J plus 0.42 J into permanently crushed foam and its warmth. The package is single-use now, and that is the trade the design accepted." },
  ],
};

export const g8b5BuildTheDropRig = buildSim(BUILD_THE_DROP_RIG);
export const g8b5RoundOne = buildSim(ROUND_ONE);
export const g8b5WhatTheDataSaid = buildSim(WHAT_THE_DATA_SAID);
export const g8b5SafeOrSmall = buildSim(SAFE_OR_SMALL);
export const g8b5TwoLayers = buildSim(TWO_LAYERS);
