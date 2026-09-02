import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A2 — Acceleration and motion graphs.
 *
 * Five simulations, one per subtopic:
 *
 *   A2.1  g8a2-how-quickly-changed  acceleration as a rate of change (investigate)
 *   A2.2  g8a2-slope-and-area       reading a velocity-time graph    (investigate)
 *   A2.3  g8a2-steady-or-fading     constant vs changing acceleration (compare)
 *   A2.4  g8a2-thirty-metres-late   deceleration                     (process)
 *   A2.5  g8a2-two-graphs-one-car   connecting the two graph types   (trace)
 *
 * The braking numbers are not decoration: they come from a real coefficient of
 * friction for rubber on dry asphalt, 0.70, which gives a deceleration of
 * 0.70 x 9.81 = 6.87 m/s2 and a stopping distance of v squared over twice that.
 */

/* ---------------------------------------------------------------- *
 * A2.1 — Acceleration as a rate of change
 * ---------------------------------------------------------------- */

const HOW_QUICKLY_CHANGED: ArchetypeSpec = {
  id: "g8a2-how-quickly-changed",
  title: "How Quickly Did It Change?",
  tagline: "The same change of speed, spread over more seconds, is a gentler acceleration.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Calculate acceleration as the change in velocity divided by the time taken.",
    "Explain that acceleration measures how fast a velocity changes, not how fast something is going.",
  ],
  misconceptions: [
    "A fast-moving object must have a large acceleration",
    "Zero acceleration means the object has stopped",
  ],
  specimens: [{ id: "cart", name: "Test cart", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "startSpeed", label: "Starting speed (m/s)", min: 0, max: 40, step: 0.5, default: 0 },
    { key: "endSpeed", label: "Final speed (m/s)", min: 0, max: 40, step: 0.5, default: 27 },
    { key: "time", label: "Time taken (s)", min: 0.5, max: 20, step: 0.1, default: 9 },
  ],
  // a = (v - u) / t exactly. The distance covered while accelerating steadily
  // is the average of the two speeds multiplied by the time, which is the area
  // under the velocity-time graph.
  measure: (v) => ({
    accelerationMs2: (v.endSpeed - v.startSpeed) / v.time,
    speedChangeMs: v.endSpeed - v.startSpeed,
    distanceM: ((v.startSpeed + v.endSpeed) / 2) * v.time,
    accelerationG: (v.endSpeed - v.startSpeed) / v.time / 9.81,
  }),
  plot: { x: "time", y: "accelerationMs2", xLabel: "Time taken (s)", yLabel: "Acceleration (m/s2)" },
};

/* ---------------------------------------------------------------- *
 * A2.2 — Reading a velocity-time graph
 * ---------------------------------------------------------------- */

const SLOPE_AND_AREA: ArchetypeSpec = {
  id: "g8a2-slope-and-area",
  title: "Slope Gives Acceleration, Area Gives Distance",
  tagline: "One line on a velocity-time graph answers two different questions.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.F.B.4"] },
  learningGoals: [
    "Read an acceleration from the gradient of a velocity-time graph.",
    "Find the distance travelled from the area under a velocity-time graph.",
  ],
  misconceptions: [
    "A velocity-time graph and a position-time graph show the same thing",
    "A horizontal line on a velocity-time graph means the object is stopped",
  ],
  specimens: [{ id: "ball", name: "Ball rolling down a slope", art: { art: "sphere", color: "#e8663c", radius: 0.5 } }],
  variables: [
    { key: "initialSpeed", label: "Speed at t = 0 (m/s)", min: 0, max: 20, step: 0.5, default: 2 },
    { key: "acceleration", label: "Acceleration (m/s2)", min: -5, max: 5, step: 0.1, default: 1.5 },
    { key: "time", label: "Time (s)", min: 0, max: 20, step: 0.1, default: 8 },
  ],
  // v = u + a t is the line itself; the area beneath it up to time t is
  // u t + half a t squared, which is the distance travelled.
  measure: (v) => ({
    velocityMs: v.initialSpeed + v.acceleration * v.time,
    gradientMs2: v.acceleration,
    areaUnderGraphM: v.initialSpeed * v.time + 0.5 * v.acceleration * v.time * v.time,
    averageVelocityMs: v.initialSpeed + 0.5 * v.acceleration * v.time,
  }),
  plot: { x: "time", y: "velocityMs", xLabel: "Time (s)", yLabel: "Velocity (m/s)" },
};

/* ---------------------------------------------------------------- *
 * A2.3 — Constant vs changing acceleration
 * ---------------------------------------------------------------- */

const STEADY_OR_FADING: ArchetypeSpec = {
  id: "g8a2-steady-or-fading",
  title: "Steady 9.81, or Fading Away",
  tagline: "One acceleration never changes. The other dies away as the car gets quicker.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Recognise constant acceleration as a straight velocity-time line.",
    "Recognise changing acceleration as a curved velocity-time line.",
  ],
  misconceptions: [
    "Anything speeding up has a constant acceleration",
    "A curved velocity-time graph means the object moved along a curve",
  ],
  specimens: [
    {
      id: "fall", name: "Dropped ball, first second",
      because: "Every second adds 9.81 m/s. A dead straight line.",
      art: { art: "sphere", color: "#b9c2d0", radius: 0.46 },
    },
    {
      id: "car", name: "Car pulling away from lights",
      because: "4.0 m/s2 at first, near 0 by 30 m/s. The line bends over.",
      art: { art: "apparatus", which: "cart" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.4 — Deceleration
 * ---------------------------------------------------------------- */

const THIRTY_METRES_LATE: ArchetypeSpec = {
  id: "g8a2-thirty-metres-late",
  title: "Thirty Metres Too Late",
  tagline: "From 20 m/s, the tyres can only take 6.87 m/s away every second.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Treat deceleration as a negative acceleration and calculate it from friction.",
    "Separate thinking distance from braking distance in a full stop.",
  ],
  misconceptions: [
    "Brakes stop a car instantly if you press hard enough",
    "Doubling the speed doubles the stopping distance",
  ],
  specimens: [{ id: "car", name: "Car, braking", art: { art: "apparatus", which: "cart" } }],
  stages: [
    { name: "20 m/s", at: 0,
      caption: "Cruising at 20 m/s. Nothing has slowed down yet." },
    { name: "Reaction", at: 0.25,
      caption: "0.70 s of reaction time. 14 m go by before a brake pad touches anything." },
    { name: "Brakes on", at: 0.5,
      caption: "Rubber on dry asphalt grips at 0.70, so the car loses 6.87 m/s every second." },
    { name: "Half stopped", at: 0.75,
      caption: "After 1.5 s of braking: 9.7 m/s, and 22.3 m of the braking distance used." },
    { name: "Stopped", at: 1,
      caption: "Stopped after 2.91 s and 29.1 m of braking. With the 14 m of thinking, 43.1 m." },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.5 — Connecting the two graph types
 * ---------------------------------------------------------------- */

const TWO_GRAPHS_ONE_CAR: ArchetypeSpec = {
  id: "g8a2-two-graphs-one-car",
  title: "Two Graphs, One Car",
  tagline: "Follow one journey and watch both graphs change at the same moment.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Match a feature of a position-time graph to the matching feature of a velocity-time graph.",
    "Explain that a curve on one graph appears as a slope on the other.",
  ],
  misconceptions: [
    "A flat line means the same thing on both graphs",
    "A steep position-time line and a steep velocity-time line describe the same motion",
  ],
  stages: [
    { name: "Parked", at: 0, caption: "Position flat, velocity on zero." },
    { name: "Pulling away", at: 0.25, caption: "Position curves upward while velocity climbs in a straight line." },
    { name: "Cruising", at: 0.5, caption: "Position is a straight slope; velocity is flat at 15 m/s." },
    { name: "Braking", at: 0.75, caption: "Position flattens out; velocity falls towards zero." },
    { name: "Stopped", at: 1, caption: "Both flat again, but at 300 m and at 0 m/s." },
  ],
  route: [
    { at: [0.09, 0.5], name: "Parked", note: "x-t flat. v-t on zero." },
    { at: [0.28, 0.34], name: "Pulling away", note: "x-t curves up. v-t a rising straight line." },
    { at: [0.46, 0.56], name: "Cruising", note: "x-t a straight slope. v-t flat at 15 m/s." },
    { at: [0.64, 0.34], name: "Braking", note: "x-t flattening. v-t falling to zero." },
    { at: [0.82, 0.56], name: "Stopped", note: "x-t flat at 300 m. v-t flat at 0." },
  ],
};

export const g8a2HowQuicklyChanged = buildSim(HOW_QUICKLY_CHANGED);
export const g8a2SlopeAndArea = buildSim(SLOPE_AND_AREA);
export const g8a2SteadyOrFading = buildSim(STEADY_OR_FADING);
export const g8a2ThirtyMetresLate = buildSim(THIRTY_METRES_LATE);
export const g8a2TwoGraphsOneCar = buildSim(TWO_GRAPHS_ONE_CAR);
