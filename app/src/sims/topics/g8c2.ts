import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit C · Topic C2 — Electric forces.
 *
 * Five simulations, one per subtopic:
 *
 *   C2.1  g8c2-where-charge-lives   electric charge                 (explore)
 *   C2.2  g8c2-what-to-ask          asking questions about data     (trace)
 *   C2.3  g8c2-half-the-gap         how distance affects the force  (investigate)
 *   C2.4  g8c2-double-the-charge    how charge affects the force    (investigate)
 *   C2.5  g8c2-thirty-three-metres  static electricity and lightning (process)
 *
 * Both investigations run the same law, F = 8.99e9 x q1 q2 / r squared, and
 * both read it off a real instrument rather than a number box: the pith ball
 * hangs at the angle where tan(theta) = F / W, and the spring balance stretches
 * by exactly F / k. Halving the gap therefore visibly quadruples the swing, and
 * doubling the charge visibly doubles the stretch, which is the whole
 * difference between the two subtopics.
 */

/** Coulomb's constant, N m2 / C2. */
const K_E = 8.99e9;
/** Free-fall acceleration, N/kg. */
const G = 9.81;
/** Mass of a pith ball, kg. */
const PITH_MASS = 0.0005;
/** Stiffness of the sensitive spring balance, N/m. */
const SPRING_K = 0.1;
/** The dielectric strength of dry air at sea level, V/m. */
const AIR_BREAKDOWN = 3.0e6;

/* ---------------------------------------------------------------- *
 * C2.1 — Electric charge
 * ---------------------------------------------------------------- */

const WHERE_CHARGE_LIVES: ArchetypeSpec = {
  id: "g8c2-where-charge-lives",
  title: "Where the Charge Actually Lives",
  tagline: "An oxygen atom, eight and eight, adding to nothing. Take one electron and it does not.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS1-1"] },
  learningGoals: [
    "Identify protons and electrons as the carriers of positive and negative charge.",
    "Explain that an object is charged when electrons are moved onto or off it.",
  ],
  misconceptions: [
    "Rubbing creates new charge",
    "Protons move when an object is charged by rubbing",
  ],
  specimens: [
    {
      id: "oxygen",
      name: "One oxygen atom: 8 protons, 8 neutrons, 8 electrons",
      art: { art: "atom", protons: 8, neutrons: 8, electrons: 8 },
      parts: [
        {
          id: "proton", name: "Proton: +1.602e-19 C", at: [-0.08, -0.06],
          note: "Locked in the nucleus and far too heavy to move: 1 836 times an electron's mass. Rubbing never shifts one.",
        },
        {
          id: "neutron", name: "Neutron: exactly 0 C", at: [0.14, 0.12],
          note: "Same nucleus, almost the same mass, no charge at all. It changes the atom's weight and nothing about its electric behaviour.",
        },
        {
          id: "electron", name: "Electron: -1.602e-19 C", at: [0.44, -0.34],
          note: "Light, on the outside and loosely held. This is the only thing that moves when you rub a balloon on your hair.",
        },
        {
          id: "neutral", name: "Net charge: zero", at: [-0.46, 0.3],
          note: "Eight positives and eight negatives: 8 x 1.602e-19 minus 8 x 1.602e-19 = 0 C. Neutral does not mean empty, it means balanced.",
        },
        {
          id: "ion", name: "Take one electron away", at: [0.46, 0.34],
          note: "Now 8 positives against 7 negatives, so the atom carries +1.602e-19 C. Charge was moved, not made. Something else is now negative by the same amount.",
        },
      ],
    },
  ],
  /*
   * The electrons keep running while the nucleus sits still, which is exactly
   * the asymmetry the sim is about: the outer charge is the mobile charge.
   */
  drive: () => ({ rate: 1.5, tilt: 0.3 }),
};

/* ---------------------------------------------------------------- *
 * C2.2 — Asking questions about electric-force data
 * ---------------------------------------------------------------- */

const WHAT_TO_ASK: ArchetypeSpec = {
  id: "g8c2-what-to-ask",
  title: "From a Sticky Balloon to a Law",
  tagline: "Follow one ordinary observation until it becomes a question a balance can answer.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "Turn an everyday observation into a question that names a variable and a measurement.",
    "Explain why a question that cannot be measured cannot be tested.",
  ],
  misconceptions: [
    "A scientific question is any question about science",
    "Coulomb guessed the inverse square law rather than measuring it",
  ],
  stages: [
    { name: "Notice", at: 0, caption: "A rubbed balloon sticks to a wall. Interesting is not yet a question." },
    { name: "Narrow", at: 0.25, caption: "Which single thing could you change and watch the effect of?" },
    { name: "Measure", at: 0.5, caption: "Name the instrument before you start, or there is nothing to record." },
    { name: "Test", at: 0.75, caption: "Change one variable, hold the rest, and repeat the reading." },
    { name: "Law", at: 1, caption: "A shape that holds over the whole range is worth calling a law." },
  ],
  route: [
    {
      at: [0.1, 0.34], name: "The observation",
      note: "A balloon rubbed on wool stays on the wall for minutes. Real, repeatable, and useless as it stands: there is nothing here to measure.",
    },
    {
      at: [0.25, 0.58], name: "A question that will not work",
      note: "Why does the balloon like the wall? Nothing in that sentence names a quantity, so no apparatus can answer it and no answer could be shown wrong.",
    },
    {
      at: [0.4, 0.3], name: "Naming a variable",
      note: "How does the force change when the gap changes? Now there is something to turn — the gap — and something to watch: the force.",
    },
    {
      at: [0.55, 0.56], name: "Naming an instrument",
      note: "A pith ball on a thread turns force into an angle: tan(theta) = F / W. A 0.50 g ball weighs 4.91 mN, so a 39 degree swing means 3.98 mN.",
    },
    {
      at: [0.7, 0.3], name: "Coulomb's torsion balance, 1785",
      note: "He suspended a charged rod on a silver wire and read the twist. Halving the separation multiplied the force by four, every time.",
    },
    {
      at: [0.84, 0.54], name: "The law that came out",
      note: "F = 8.99e9 x q1 q2 / r squared. It came from an angle read off a scale, not from a guess, and that is why the next two sims are worth running.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C2.3 — How distance affects the force
 * ---------------------------------------------------------------- */

const HALF_THE_GAP: ArchetypeSpec = {
  id: "g8c2-half-the-gap",
  title: "Half the Gap, Four Times the Force",
  tagline: "Slide the fixed ball closer and watch the hanging one swing out to meet it.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "Show that the electric force falls with the square of the separation.",
    "Read a force from the angle a charged pendulum hangs at.",
  ],
  misconceptions: [
    "Halving the distance doubles the force",
    "The force reaches a certain distance and then stops",
  ],
  specimens: [
    { id: "pith", name: "0.50 g pith ball on a thread", art: { art: "sphere", color: "#e8dcc0", radius: 0.4 } },
  ],
  variables: [
    { key: "gap", label: "Gap between the balls (cm)", min: 3, max: 15, step: 0.5, default: 6 },
    { key: "charge", label: "Charge on each ball (nC)", min: 5, max: 30, step: 1, default: 20 },
  ],
  /*
   * F = k q1 q2 / r squared with k = 8.99e9 N m2 / C2. Two 20 nC balls 6.0 cm
   * apart push with 8.99e9 x 4.0e-16 / 3.6e-3 = 1.00 mN. Close them to 3.0 cm
   * and it is 4.00 mN: four times, because the gap was halved and 2 squared is
   * 4. The ball weighs 0.50 g x 9.81 = 4.91 mN, so the thread settles where
   * tan(theta) = F / W, and the angle is the reading.
   */
  measure: (v) => {
    const q = v.charge * 1e-9;
    const r = Math.max(0.01, v.gap / 100);
    const force = (K_E * q * q) / (r * r);
    const weight = PITH_MASS * G;
    return {
      forceMilliNewton: force * 1000,
      swingDeg: (Math.atan(force / weight) * 180) / Math.PI,
      forceAtHalfTheGapMilliNewton: force * 4000,
    };
  },
  plot: {
    x: "gap", y: "forceMilliNewton",
    xLabel: "Gap between the balls (cm)", yLabel: "Force (mN)",
  },
  /*
   * The pendulum is the instrument, so it must stand where the measurement
   * says. A thread deflected by theta carries its bob sideways by L sin(theta)
   * and upward by L (1 - cos(theta)); both are taken straight from the angle
   * the force and the weight agree on. Close the gap to 3 cm and the ball
   * swings out past 39 degrees; open it to 15 cm and it hangs almost straight.
   */
  drive: ({ f }) => {
    const theta = (f.swingDeg * Math.PI) / 180;
    return {
      offset: [-0.1 + Math.sin(theta) * 0.72, 0.12 - (1 - Math.cos(theta)) * 0.6],
    };
  },
};

/* ---------------------------------------------------------------- *
 * C2.4 — How charge magnitude affects the force
 * ---------------------------------------------------------------- */

const DOUBLE_THE_CHARGE: ArchetypeSpec = {
  id: "g8c2-double-the-charge",
  title: "Double the Charge, Double the Pull",
  tagline: "The gap never moves. Only the charge does, and the balance stretches in step with it.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "Show that the electric force is proportional to each of the two charges.",
    "Contrast a straight-line relationship with the inverse square of distance.",
  ],
  misconceptions: [
    "Doubling the charge quadruples the force",
    "Only the larger of the two charges matters",
  ],
  specimens: [
    { id: "balance", name: "Spring balance, 0.10 N/m", art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "moving", label: "Charge on the hooked ball (nC)", min: 5, max: 60, step: 1, default: 20 },
    { key: "fixed", label: "Charge on the fixed ball (nC)", min: 10, max: 60, step: 1, default: 40 },
  ],
  /*
   * Same law, one variable at a time. The gap is clamped at 5.0 cm, so
   * F = 8.99e9 q1 q2 / 2.5e-3 and the graph of force against charge is a
   * straight line through the origin: 20 nC on 40 nC gives 2.88 mN, 40 nC on
   * 40 nC gives 5.75 mN, exactly twice. The balance obeys Hooke's law, so its
   * extension is F / k = F / 0.10 N/m — 28.8 mm for that first reading.
   */
  measure: (v) => {
    const force = (K_E * v.moving * 1e-9 * v.fixed * 1e-9) / (0.05 * 0.05);
    return {
      forceMilliNewton: force * 1000,
      extensionMm: (force / SPRING_K) * 1000,
      timesTheBallsWeight: force / (PITH_MASS * G),
    };
  },
  plot: {
    x: "moving", y: "forceMilliNewton",
    xLabel: "Charge on the hooked ball (nC)", yLabel: "Force (mN)",
  },
  /*
   * Hooke's law makes the spring an honest ruler: extension is proportional to
   * force, so a picture that stretches in proportion to the force is telling
   * the truth about it. Full scale here is the 86 mm the balance reaches with
   * 60 nC on 60 nC, and the drawing runs from a little under half size to a
   * little over full size across that range.
   */
  drive: ({ f }) => ({
    scale: 0.52 + Math.min(1, f.extensionMm / 86) * 0.66,
    tilt: 0.2,
    spin: 0.5,
  }),
};

/* ---------------------------------------------------------------- *
 * C2.5 — Static electricity and lightning
 * ---------------------------------------------------------------- */

const THIRTY_THREE_METRES: ArchetypeSpec = {
  id: "g8c2-thirty-three-metres",
  title: "Thirty-Three Metres at a Time",
  tagline: "A hundred million volts can only break through 33 m of air. So how does it cross two kilometres?",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS3-2"] },
  learningGoals: [
    "Explain static charging and discharge as the movement of electrons.",
    "Use air's breakdown field to explain why a lightning leader travels in steps.",
  ],
  misconceptions: [
    "Lightning travels from the ground to the cloud only, or from the cloud to the ground only",
    "A lightning rod attracts lightning that would otherwise have missed",
  ],
  specimens: [
    { id: "cloud", name: "The charged base of the storm cloud",
      art: { art: "sphere", color: "#4c4a58", radius: 0.5 } },
  ],
  variables: [
    { key: "groundField", label: "Field at flat ground (kV/m)", min: 1, max: 40, step: 1, default: 8 },
    { key: "sharpness", label: "Field multiplied at the tip", min: 1, max: 200, step: 1, default: 90 },
  ],
  /*
   * Dry air at sea level breaks down at 3.0e6 V/m, which is 3 000 kV/m. Under
   * a storm the field at flat ground reaches only about 10 kV/m, three hundred
   * times too little. A sharp conductor concentrates it: the field at the tip
   * of a spire or a rod is tens to hundreds of times the field over flat
   * ground, and that is where the spark starts. 40 kV/m multiplied by 90 is
   * 3 600 kV/m, past breakdown, so a leader launches from the tip.
   */
  measure: (v) => {
    const tip = v.groundField * v.sharpness;
    return {
      tipFieldKvPerM: tip,
      timesToBreakdown: tip / (AIR_BREAKDOWN / 1000),
      sparkStarts: tip >= AIR_BREAKDOWN / 1000 ? 1 : 0,
    };
  },
  stages: [
    { name: "Rubbing", at: 0,
      caption: "Ice and hail rub inside the cloud. Electrons move down; the base ends up negative." },
    { name: "Field builds", at: 0.25,
      caption: "About 20 C sits 2 km up, and the cloud and ground reach roughly 100 MV apart." },
    { name: "Not enough", at: 0.5,
      caption: "Air breaks at 3 MV/m, so 100 MV can only clear 33 m. The other 1 967 m is the problem." },
    { name: "Stepped leader", at: 0.75,
      caption: "It goes in 50 m steps, each one re-building the field ahead of the last." },
    { name: "Return stroke", at: 1,
      caption: "Charge floods back up the channel, 30 kA at 30 000 K. That flash is the return stroke." },
  ],
  /*
   * The cloud is the readout. A stronger field over the ground means more
   * charge overhead, so the cloud grows; and the instant the tip field passes
   * air's 3 000 kV/m the whole thing lights, because that is the moment the
   * spark actually starts. The colour is one of two fixed values rather than a
   * sweep, so the threshold reads as a threshold and not as a dimmer.
   */
  drive: ({ f, v }) => {
    const sparking = f.sparkStarts > 0.5;
    return {
      scale: 0.55 + (v.groundField / 40) * 0.55,
      color: sparking ? "#fff0b8" : "#4c4a58",
      glow: sparking ? 1 : 0,
      rate: sparking ? 2.4 : 0.5,
    };
  },
};

export const g8c2WhereChargeLives = buildSim(WHERE_CHARGE_LIVES);
export const g8c2WhatToAsk = buildSim(WHAT_TO_ASK);
export const g8c2HalfTheGap = buildSim(HALF_THE_GAP);
export const g8c2DoubleTheCharge = buildSim(DOUBLE_THE_CHARGE);
export const g8c2ThirtyThreeMetres = buildSim(THIRTY_THREE_METRES);
