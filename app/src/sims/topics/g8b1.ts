import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit B · Topic B1 — Kinetic energy.
 *
 * Five simulations, one per subtopic:
 *
 *   B1.1  g8b1-load-the-trolley     kinetic energy and mass          (investigate)
 *   B1.2  g8b1-roll-it-faster       kinetic energy and speed         (investigate)
 *   B1.3  g8b1-one-four-nine        why speed has the larger effect  (process)
 *   B1.4  g8b1-reading-the-curve    interpreting the shape           (explore)
 *   B1.5  g8b1-thirty-and-sixty     kinetic energy in a collision    (compare)
 *
 * The whole topic rests on one equation, E = half m v squared, taken apart
 * from both sides. Mass enters once, so doubling it doubles the energy; speed
 * enters twice, so doubling it quadruples the energy. Every figure quoted here
 * comes out of that equation with g = 9.81 N/kg where a height is involved,
 * and can be checked on paper in a line of working.
 */

/* ---------------------------------------------------------------- *
 * B1.1 — Kinetic energy and mass
 * ---------------------------------------------------------------- */

const LOAD_THE_TROLLEY: ArchetypeSpec = {
  id: "g8b1-load-the-trolley",
  title: "Load the Trolley",
  tagline: "Same speed, more mass. The energy climbs in step, and the graph is a straight line.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-1"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Calculate kinetic energy from mass and speed using E = half m v squared.",
    "Describe the relationship between kinetic energy and mass as directly proportional.",
  ],
  misconceptions: [
    "A heavy object always has more energy than a light one",
    "Mass and speed affect kinetic energy in the same way",
  ],
  specimens: [
    { id: "trolley", name: "Laboratory trolley on a level track",
      art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "mass", label: "Mass of trolley and load (kg)", min: 0.5, max: 10, step: 0.1, default: 2 },
    { key: "speed", label: "Speed (m/s)", min: 0.5, max: 6, step: 0.1, default: 3 },
  ],
  // E = half m v squared. Momentum m v is carried alongside so the two are not
  // confused: at 2 kg and 3 m/s the energy is 9 J while the momentum is
  // 6 kg m/s, and they scale differently the moment the mass changes.
  // The stopping force is that energy shared over a 2.00 m sand trap, and the
  // climb height is the same energy handed back to gravity, E / (m g), which
  // cancels the mass entirely and comes out at v squared over 2 g.
  measure: (v) => {
    const ke = 0.5 * v.mass * v.speed * v.speed;
    return {
      kineticEnergyJ: ke,
      momentumKgMs: v.mass * v.speed,
      stoppingForceN: ke / 2,
      climbHeightM: (v.speed * v.speed) / (2 * 9.81),
    };
  },
  plot: {
    x: "mass", y: "kineticEnergyJ",
    xLabel: "Mass (kg)", yLabel: "Kinetic energy (J)",
  },
};

/* ---------------------------------------------------------------- *
 * B1.2 — Kinetic energy and speed
 * ---------------------------------------------------------------- */

const ROLL_IT_FASTER: ArchetypeSpec = {
  id: "g8b1-roll-it-faster",
  title: "Roll It Faster",
  tagline: "Same ball, more speed. This graph bends upwards, and it never stops bending.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-1"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Calculate the kinetic energy of an object from its speed.",
    "Describe the relationship between kinetic energy and speed as a squared one.",
  ],
  misconceptions: [
    "Doubling the speed doubles the kinetic energy",
    "A graph of energy against speed is a straight line",
  ],
  specimens: [
    { id: "ball", name: "Bowling ball, 6.35 kg",
      art: { art: "sphere", color: "#2f3a56", radius: 0.52 } },
  ],
  variables: [
    { key: "speed", label: "Speed down the lane (m/s)", min: 0, max: 12, step: 0.25, default: 6 },
    { key: "mass", label: "Mass of ball (kg)", min: 2, max: 8, step: 0.05, default: 6.35 },
  ],
  // Half m v squared again, but read the other way about. A 6.35 kg ball at
  // 6 m/s carries 114.3 J; take it to 12 m/s and it carries 457.2 J, four
  // times as much for twice the speed. The ratio is reported directly so the
  // factor of four can be watched holding steady at every speed.
  measure: (v) => {
    const ke = 0.5 * v.mass * v.speed * v.speed;
    return {
      kineticEnergyJ: ke,
      speedKmh: v.speed * 3.6,
      energyAtDoubleSpeedJ: 0.5 * v.mass * (2 * v.speed) * (2 * v.speed),
      climbHeightM: (v.speed * v.speed) / (2 * 9.81),
    };
  },
  plot: {
    x: "speed", y: "kineticEnergyJ",
    xLabel: "Speed (m/s)", yLabel: "Kinetic energy (J)",
  },
};

/* ---------------------------------------------------------------- *
 * B1.3 — Why speed has the larger effect
 * ---------------------------------------------------------------- */

const ONE_FOUR_NINE: ArchetypeSpec = {
  id: "g8b1-one-four-nine",
  title: "One, Four, Nine, Sixteen",
  tagline: "Push the same 2 kg trolley a metre per second faster each time and read the energy.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-1"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Explain why speed has a larger effect on kinetic energy than mass does.",
    "Recognise the square numbers in a sequence of equal speed increases.",
  ],
  misconceptions: [
    "Each equal step of speed adds an equal amount of energy",
    "Mass and speed matter equally in the kinetic energy equation",
  ],
  specimens: [
    { id: "trolley", name: "The same 2 kg trolley, five times",
      art: { art: "apparatus", which: "cart" } },
  ],
  // With a 2 kg trolley the arithmetic is as clean as it ever gets: E = v
  // squared exactly, so the readings are the square numbers and the gaps
  // between them are the odd numbers.
  stages: [
    { name: "1 m/s", at: 0,
      caption: "2 kg at 1 m/s. E = half x 2 x 1 x 1 = 1 J. Walking pace for an ant." },
    { name: "2 m/s", at: 0.25,
      caption: "2 kg at 2 m/s. E = 4 J. Twice the speed, but three extra joules, not one." },
    { name: "3 m/s", at: 0.5,
      caption: "2 kg at 3 m/s. E = 9 J. The step from 4 to 9 cost 5 J, bigger again." },
    { name: "4 m/s", at: 0.75,
      caption: "2 kg at 4 m/s. E = 16 J. Steps so far: 1, 3, 5, 7. The odd numbers." },
    { name: "5 m/s", at: 1,
      caption: "2 kg at 5 m/s. E = 25 J. Five times the speed of the first stage, twenty five times the energy." },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.4 — Interpreting the shape of the curve
 * ---------------------------------------------------------------- */

const READING_THE_CURVE: ArchetypeSpec = {
  id: "g8b1-reading-the-curve",
  title: "Reading the Curve",
  tagline: "Five points off one energy-speed graph. Each one is a sentence about the road.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-1"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Read values off a kinetic energy against speed graph and say what they mean.",
    "Explain why the gap between successive points on the curve keeps growing.",
  ],
  misconceptions: [
    "A curve that gets steeper must eventually level off",
    "Halfway along the speed axis is halfway up the energy axis",
  ],
  specimens: [
    {
      id: "curve", name: "Kinetic energy of a 2 kg trolley",
      art: { art: "apparatus", which: "cart" },
      // The labels are placed along the true shape of E = v squared, rising
      // to the right and steepening as they go, so the layout of the callouts
      // is itself the graph.
      parts: [
        { id: "p2", name: "2 m/s reads 4 J", at: [-0.44, 0.36],
          note: "Half of 2 x 2 x 2 is 4 J. Low and flat: down here a metre per second more hardly costs anything." },
        { id: "p4", name: "4 m/s reads 16 J", at: [-0.22, 0.24],
          note: "Twice the speed of the first point, four times the energy. The 12 J gap is already three times the first reading." },
        { id: "p6", name: "6 m/s reads 36 J", at: [0.0, 0.02],
          note: "Not halfway up, even though 6 m/s is a little over half of 10. Energy runs ahead of speed the whole way." },
        { id: "p8", name: "8 m/s reads 64 J", at: [0.22, -0.24],
          note: "The 8 to 6 step cost 28 J on its own, more than the whole graph up to 5 m/s. This is the part of the curve that hurts." },
        { id: "p10", name: "10 m/s reads 100 J", at: [0.44, -0.46],
          note: "Five times the speed of the first point and twenty five times its energy. Nothing here levels off: the curve only ever steepens." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.5 — Applying kinetic energy to a collision scenario
 * ---------------------------------------------------------------- */

const THIRTY_AND_SIXTY: ArchetypeSpec = {
  id: "g8b1-thirty-and-sixty",
  title: "Thirty and Sixty",
  tagline: "The same car into the same wall at two speeds. One of them is four times the crash.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-1"] },
  learningGoals: [
    "Apply E = half m v squared to a real collision and compare two speeds.",
    "Explain why a small increase in speed is a large increase in the energy a crash must absorb.",
  ],
  misconceptions: [
    "Twice the speed is twice as dangerous",
    "A crash at any speed puts the same load on the car",
  ],
  specimens: [
    {
      id: "slow", name: "1 200 kg car at 30 km/h",
      because: "30 km/h is 8.33 m/s, so the car carries half x 1200 x 8.33 x 8.33 = 41 667 J. Crushed over half a metre of bonnet that is 83 kN of average force and 7.1 g of deceleration.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "fast", name: "The same car at 60 km/h",
      because: "16.67 m/s gives 166 667 J: four times the energy for twice the speed. Over the same half metre that is 333 kN and 28.3 g, and the structure has to soak up all of it.",
      art: { art: "apparatus", which: "cart" },
    },
  ],
  variables: [
    { key: "speedKmh", label: "Impact speed (km/h)", min: 10, max: 120, step: 5, default: 60 },
    { key: "crushM", label: "Crush distance of the front (m)", min: 0.1, max: 1.2, step: 0.05, default: 0.5 },
  ],
  // The comparison itself, live. Energy is half m v squared with the speed
  // converted from km/h; the average force is that energy divided by the crush
  // distance, since work equals force times distance; the deceleration follows
  // from v squared over 2 d and is reported in multiples of g.
  measure: (v) => {
    const ms = v.speedKmh / 3.6;
    const ke = 0.5 * 1200 * ms * ms;
    return {
      impactSpeedMs: ms,
      kineticEnergyJ: ke,
      averageForceN: ke / v.crushM,
      decelerationG: (ms * ms) / (2 * v.crushM * 9.81),
      energyAtHalfSpeedJ: ke / 4,
    };
  },
};

export const g8b1LoadTheTrolley = buildSim(LOAD_THE_TROLLEY);
export const g8b1RollItFaster = buildSim(ROLL_IT_FASTER);
export const g8b1OneFourNine = buildSim(ONE_FOUR_NINE);
export const g8b1ReadingTheCurve = buildSim(READING_THE_CURVE);
export const g8b1ThirtyAndSixty = buildSim(THIRTY_AND_SIXTY);
