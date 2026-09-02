import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A1 — Describing motion.
 *
 * Five simulations, one per subtopic:
 *
 *   A1.1  g8a1-around-the-block   distance vs displacement      (process)
 *   A1.2  g8a1-size-or-arrow      speed vs velocity             (sort)
 *   A1.3  g8a1-slope-is-speed     reading a position-time graph (investigate)
 *   A1.4  g8a1-who-is-moving      reference frames              (compare)
 *   A1.5  g8a1-whole-journey      calculating average speed     (trace)
 *
 * Every number here comes from the two definitions the topic rests on:
 * average speed is total distance over total time, and velocity is
 * displacement over time. A1.1 walks a 120 m by 80 m block so the two answers
 * separate visibly, and A1.5 shows why averaging the leg speeds gives the
 * wrong number.
 */

/* ---------------------------------------------------------------- *
 * A1.1 — Distance vs displacement
 * ---------------------------------------------------------------- */

const AROUND_THE_BLOCK: ArchetypeSpec = {
  id: "g8a1-around-the-block",
  title: "Around the Block, Back to Nothing",
  tagline: "Walk a 120 m by 80 m block and watch the two answers pull apart.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Distinguish distance travelled from displacement from the start point.",
    "State a displacement with both a size and a direction.",
  ],
  misconceptions: [
    "Distance and displacement are two words for the same measurement",
    "Displacement cannot be zero if you have been walking for ten minutes",
  ],
  specimens: [{ id: "walker", name: "Walker", art: { art: "apparatus", which: "cart" } }],
  stages: [
    { name: "Start", at: 0,
      caption: "At the corner. Distance 0 m, displacement 0 m." },
    { name: "First side", at: 0.25,
      caption: "120 m east. Distance 120 m, displacement 120 m east. Still the same number." },
    { name: "Second side", at: 0.5,
      caption: "80 m north. Distance 200 m, but displacement is 144 m at 34 degrees north of east." },
    { name: "Third side", at: 0.75,
      caption: "120 m west. Distance 320 m, displacement only 80 m north." },
    { name: "Home", at: 1,
      caption: "80 m south, back at the corner. Distance 400 m, displacement 0 m." },
  ],
};

/* ---------------------------------------------------------------- *
 * A1.2 — Speed vs velocity
 * ---------------------------------------------------------------- */

const SIZE_OR_ARROW: ArchetypeSpec = {
  id: "g8a1-size-or-arrow",
  title: "A Size, or a Size with an Arrow",
  tagline: "Six readings. Some carry a direction, and that changes what they are.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Identify whether a stated motion is a speed or a velocity.",
    "Explain that velocity changes when direction changes, even at a steady speed.",
  ],
  misconceptions: [
    "Velocity is just a longer word for speed",
    "Something moving at a steady speed always has a steady velocity",
  ],
  categories: [
    { id: "speed", name: "Speed", hint: "a size only, with no direction attached" },
    { id: "velocity", name: "Velocity", hint: "a size and a direction together" },
  ],
  specimens: [
    {
      id: "speedo", name: "Speedometer reading 25 m/s", category: "speed",
      because:
        "A speedometer counts wheel turns, so it knows how fast but never which way. 25 m/s is 90 km/h whether the car is heading north or reversing into a space.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "molecule", name: "Air molecule at about 500 m/s", category: "speed",
      because:
        "Nitrogen molecules at 20 degrees average close to 500 m/s, but the directions are random, so the average velocity of the air in a still room is zero. Speed and velocity give completely different answers here.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "sound", name: "Sound in air at 20 C: 343 m/s", category: "speed",
      because:
        "343 m/s outwards in every direction at once. A single number with no arrow on it is a speed.",
      art: { art: "sphere", color: "#f6d365", radius: 0.44, glow: 1 },
    },
    {
      id: "plane", name: "Airliner at 250 m/s due north", category: "velocity",
      because:
        "250 m/s is the size, due north is the direction. Turn the aircraft east at the same 250 m/s and the velocity has changed although the speed has not.",
      art: { art: "sphere", color: "#c3cad6", radius: 0.42 },
    },
    {
      id: "lift", name: "Lift rising at 1.5 m/s", category: "velocity",
      because:
        "Upward is a direction, so this is a velocity. Coming back down it is 1.5 m/s downward, which is a different velocity and the same speed.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "earth", name: "Earth at 29.8 km/s along its orbit", category: "velocity",
      because:
        "The speed hardly changes all year, but the direction turns through a full circle, so the velocity is different every single day. That change of velocity is what gravity is doing to us.",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#9fd8ff" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A1.3 — Reading a position-time graph
 * ---------------------------------------------------------------- */

const SLOPE_IS_SPEED: ArchetypeSpec = {
  id: "g8a1-slope-is-speed",
  title: "The Slope Is the Speed",
  tagline: "Set a starting point and a velocity, and read the line it draws.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.F.B.4"] },
  learningGoals: [
    "Read a velocity off the gradient of a position-time graph.",
    "Interpret a negative gradient as motion back towards the origin.",
  ],
  misconceptions: [
    "A position-time graph is a picture of the path the object took",
    "A steeper line means the object is higher up",
  ],
  specimens: [{ id: "cart", name: "Cart on a track", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "start", label: "Starting position (m)", min: -20, max: 20, step: 1, default: 4 },
    { key: "velocity", label: "Velocity (m/s)", min: -8, max: 8, step: 0.1, default: 2.5 },
    { key: "time", label: "Time elapsed (s)", min: 0, max: 20, step: 0.1, default: 8 },
  ],
  // Straight-line motion: x = x0 + v t. The gradient of that line is the
  // velocity itself, which is the whole reading skill of the subtopic.
  // Distance ignores the sign; displacement keeps it.
  measure: (v) => ({
    positionM: v.start + v.velocity * v.time,
    gradientMs: v.velocity,
    speedMs: Math.abs(v.velocity),
    displacementM: v.velocity * v.time,
    distanceM: Math.abs(v.velocity) * v.time,
  }),
  plot: { x: "time", y: "positionM", xLabel: "Time (s)", yLabel: "Position (m)" },
};

/* ---------------------------------------------------------------- *
 * A1.4 — Reference frames
 * ---------------------------------------------------------------- */

const WHO_IS_MOVING: ArchetypeSpec = {
  id: "g8a1-who-is-moving",
  title: "Who Is Actually Moving?",
  tagline: "One walker on one train, measured from two places, with two right answers.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "State the frame of reference a velocity is measured in.",
    "Add velocities along a line to move between two frames.",
  ],
  misconceptions: [
    "There is one true velocity and the other observer is mistaken",
    "Sitting still on a moving train means you are not moving",
  ],
  specimens: [
    {
      id: "platform", name: "Measured from the platform",
      because: "Walker at 31.5 m/s: the train's 30 plus her own 1.5.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "carriage", name: "Measured from the seat opposite",
      because: "The same walker at 1.5 m/s, and the platform at 30 m/s back.",
      art: { art: "sphere", color: "#e08a4a", radius: 0.44 },
    },
  ],
  variables: [
    { key: "train", label: "Train velocity along the track (m/s)", min: -40, max: 40, step: 0.5, default: 30 },
    { key: "walk", label: "Walker's velocity along the carriage (m/s)", min: -3, max: 3, step: 0.1, default: 1.5 },
  ],
  // Velocities along one line simply add. The platform sees the sum; a
  // passenger sees only the walking; and from the train the platform runs
  // backwards at exactly the train's own speed.
  measure: (v) => ({
    walkerFromPlatformMs: v.train + v.walk,
    walkerFromTrainMs: v.walk,
    platformFromTrainMs: -v.train,
    trainFromWalkerMs: -v.walk,
  }),
};

/* ---------------------------------------------------------------- *
 * A1.5 — Calculating average speed
 * ---------------------------------------------------------------- */

const WHOLE_JOURNEY: ArchetypeSpec = {
  id: "g8a1-whole-journey",
  title: "One Journey, One Average",
  tagline: "Four legs to school. The average is not the average of the legs.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["7.RP.A.1"] },
  learningGoals: [
    "Calculate average speed as total distance divided by total time.",
    "Explain why the mean of the leg speeds is not the average speed.",
  ],
  misconceptions: [
    "Average speed is the mean of the speeds on each leg",
    "Time spent waiting does not count in the journey",
  ],
  stages: [
    { name: "Leave", at: 0, caption: "Total so far: 0 m in 0 s." },
    { name: "Bus stop", at: 0.25, caption: "400 m walked in 300 s. Running total 400 m in 300 s." },
    { name: "Waiting", at: 0.5, caption: "120 s standing still. The distance stops, the clock does not." },
    { name: "Town", at: 0.75, caption: "6 000 m by bus in 900 s. Running total 6 400 m in 1 320 s." },
    { name: "School", at: 1, caption: "7 000 m in 1 770 s, so the average speed is 3.95 m/s." },
  ],
  route: [
    { at: [0.1, 0.58], name: "Home", note: "0 m, 0 s. The clock starts." },
    { at: [0.26, 0.36], name: "Walk to the stop", note: "400 m in 300 s: 1.33 m/s." },
    { at: [0.42, 0.55], name: "Waiting", note: "120 s, 0 m. Still part of the journey." },
    { at: [0.6, 0.32], name: "Bus ride", note: "6 000 m in 900 s: 6.67 m/s." },
    { at: [0.76, 0.56], name: "Walk to school", note: "600 m in 450 s: 1.33 m/s." },
    { at: [0.9, 0.38], name: "Whole journey", note: "7 000 m / 1 770 s = 3.95 m/s, not 3.11." },
  ],
};

export const g8a1AroundTheBlock = buildSim(AROUND_THE_BLOCK);
export const g8a1SizeOrArrow = buildSim(SIZE_OR_ARROW);
export const g8a1SlopeIsSpeed = buildSim(SLOPE_IS_SPEED);
export const g8a1WhoIsMoving = buildSim(WHO_IS_MOVING);
export const g8a1WholeJourney = buildSim(WHOLE_JOURNEY);
