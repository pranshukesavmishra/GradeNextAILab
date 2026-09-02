import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A3 — Newton's First Law.
 *
 * Five simulations, one per subtopic:
 *
 *   A3.1  g8a3-fifty-newtons-each  inertia                          (compare)
 *   A3.2  g8a3-do-they-cancel      balanced vs unbalanced forces    (sort)
 *   A3.3  g8a3-every-arrow         free-body diagrams               (explore)
 *   A3.4  g8a3-take-friction-away  friction and why intuition fails (investigate)
 *   A3.5  g8a3-the-bus-stops       the First Law in everyday life   (process)
 *
 * Inertia is only visible when the same impulse meets two different masses, so
 * A3.1 gives a baseball and a shot put the identical 50 N for 0.10 s and lets
 * the 50-fold mass ratio do the teaching. A3.4 uses real coefficients: 0.02
 * for a puck on ice, 0.30 for wood on wood, 0.70 for rubber on dry asphalt.
 *
 * Every one of the five is driven, because a First Law simulation that does not
 * move is a contradiction in terms. The same push sends the baseball off the
 * bench and barely stirs the shot put; the sorting specimens either hold their
 * velocity or visibly change it, which is the sort itself; and taking the
 * friction away sends the block over the end of the bench, where it tips and
 * falls, because nothing was ever going to stop it.
 */

/**
 * A 0-1 sawtooth that runs once every `period` seconds.
 *
 * Apparatus that should be travelling is drawn making a real run across its
 * own patch of bench, and the run repeats, so the student sees the whole of a
 * motion — start, travel, arrival — rather than a frozen pose.
 */
function cycle(t: number, period: number): number {
  const p = (t / period) % 1;
  return p < 0 ? p + 1 : p;
}

/* ---------------------------------------------------------------- *
 * A3.1 — Inertia
 * ---------------------------------------------------------------- */

const FIFTY_NEWTONS_EACH: ArchetypeSpec = {
  id: "g8a3-fifty-newtons-each",
  title: "The Same Push, Fifty Times the Mass",
  tagline: "Give both balls an identical shove and see which one barely notices.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Describe inertia as an object's resistance to any change in its motion.",
    "Predict which of two objects changes speed more for the same push.",
  ],
  misconceptions: [
    "Heavy objects have more inertia only while they are moving",
    "Inertia is a force that pushes back on you",
  ],
  specimens: [
    {
      id: "baseball", name: "Baseball, 0.145 kg",
      because: "50 N for 0.10 s leaves it moving at 34.5 m/s.",
      art: { art: "sphere", color: "#f2ece0", radius: 0.32 },
    },
    {
      id: "shot", name: "Shot put, 7.26 kg",
      because: "The identical push leaves it at just 0.69 m/s.",
      art: { art: "sphere", color: "#6b7280", radius: 0.52 },
    },
  ],
  variables: [
    { key: "force", label: "Force applied (N)", min: 5, max: 200, step: 5, default: 50 },
    { key: "pushTime", label: "Time the force acts (s)", min: 0.02, max: 0.5, step: 0.01, default: 0.1 },
  ],
  // Impulse equals change of momentum: F t = m v, so v = F t / m. The two
  // masses are the real regulation masses, 0.145 kg and 7.26 kg, a ratio of
  // 50.1, which is exactly the ratio of the speeds they end up with.
  measure: (v) => ({
    impulseNs: v.force * v.pushTime,
    baseballSpeedMs: (v.force * v.pushTime) / 0.145,
    shotPutSpeedMs: (v.force * v.pushTime) / 7.26,
    massRatio: 7.26 / 0.145,
  }),
  /*
   * Both balls are shoved at the same instant and then drawn on the same 5 m
   * of bench, which is the only fair way to show a 50-fold difference: give
   * each its own scale and the picture quietly hides the point. Half a second
   * after a 50 N shove the baseball has covered 17 m and is long gone, while
   * the shot put has managed 34 cm. Once a ball reaches the end of the bench
   * it has left the apparatus, and it is flagged rather than drawn creeping
   * along the edge.
   */
  drive: ({ f, t, index }) => {
    const speed = index === 0 ? f.baseballSpeedMs : f.shotPutSpeedMs;
    const tau = Math.min(cycle(t, 3) * 3, 0.5);       // the half second after the push
    const at = Math.min(1, (speed * tau) / 5);        // along 5 m of bench
    return {
      offset: [-0.5 + 0.85 * at, 0],
      color: at >= 1 ? "#e0483f" : undefined,
    };
  },
};

/* ---------------------------------------------------------------- *
 * A3.2 — Balanced vs unbalanced forces
 * ---------------------------------------------------------------- */

const DO_THEY_CANCEL: ArchetypeSpec = {
  id: "g8a3-do-they-cancel",
  title: "Do the Forces Cancel?",
  tagline: "Six situations. Add the arrows up and decide whether anything is left over.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Decide whether the forces on an object add to zero.",
    "Explain that balanced forces keep velocity constant, including a constant speed of zero.",
  ],
  misconceptions: [
    "Something moving must have an unbalanced force on it",
    "A moving object at the top of its flight has no force acting",
  ],
  categories: [
    { id: "balanced", name: "Balanced", hint: "the arrows add to zero, so the velocity holds" },
    { id: "unbalanced", name: "Unbalanced", hint: "something is left over, so the velocity changes" },
  ],
  specimens: [
    {
      id: "spring", name: "2 kg mass hanging still on a spring", category: "balanced",
      because:
        "Weight 19.6 N down, spring tension 19.6 N up. They add to zero, so it hangs there. Nothing is moving and nothing needs to.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "car", name: "Car holding a steady 25 m/s", category: "balanced",
      because:
        "Drive force forward exactly equals drag plus rolling resistance, near 500 N each way at this speed. Zero net force, and the velocity stays at 25 m/s.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "skydiver", name: "Skydiver at terminal velocity, 55 m/s", category: "balanced",
      because:
        "An 80 kg skydiver weighs 785 N, and at 55 m/s the air drag is also 785 N. Balanced, so the fall continues at exactly 55 m/s and does not get faster.",
      art: { art: "sphere", color: "#7f8ea3", radius: 0.46 },
    },
    {
      id: "apex", name: "Ball at the very top of its throw", category: "unbalanced",
      because:
        "It is not moving for that instant, but its weight is still pulling. The net force is its full weight, and the acceleration is 9.81 m/s2 downwards even at zero speed.",
      art: { art: "sphere", color: "#e8a13c", radius: 0.4 },
    },
    {
      id: "magnet", name: "Magnet released 2 cm from a steel plate", category: "unbalanced",
      because:
        "Magnetic attraction plus its own weight, with nothing pushing back until it lands. It speeds up all the way in.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "orbit", name: "Earth going round the Sun at 29.8 km/s", category: "unbalanced",
      because:
        "The speed barely changes, but the direction turns every second, so the velocity is changing. The Sun's 3.5 x 10^22 N of gravity is the unbalanced force doing it.",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#9fd8ff" },
    },
  ],
  /*
   * The motion is the evidence, so the specimen shows it. A balanced object
   * holds whatever velocity it has: the hanging mass does not move at all, the
   * car crosses at a dead-steady speed, the skydiver falls at an unchanging
   * 55 m/s. An unbalanced one changes velocity in front of you: the ball at
   * the apex falls away with the square of the time, the released magnet
   * accelerates into the plate, and the Earth keeps a steady speed while its
   * direction turns through a whole circle, which is the case students find
   * hardest and the only one worth animating twice.
   */
  drive: ({ t, specimen }) => {
    switch (specimen.id) {
      // Balanced. Note that "balanced" and "still" are not the same thing:
      // two of these three are moving, and moving is not the question.
      case "spring":
        return { offset: [0, 0], spin: 0.68 };
      case "car":
        return { offset: [-0.28 + 0.56 * cycle(t, 3.2), 0], spin: 0.68 };
      case "skydiver":
        return { offset: [0, -0.28 + 0.56 * cycle(t, 2.6)] };
      // Unbalanced. Distance goes as the square of the time, which is what a
      // constant acceleration looks like and is visibly not a steady drift.
      case "apex": {
        const k = cycle(t, 2.4);
        return { offset: [0, -0.3 + 0.6 * k * k] };
      }
      case "magnet": {
        const k = cycle(t, 1.9);
        return { offset: [-0.3 + 0.6 * k * k, 0], spin: 0.68 };
      }
      default: {
        // Constant speed, turning direction: still an unbalanced force.
        const a = t * 0.55;
        return { offset: [0.26 * Math.cos(a), 0.26 * Math.sin(a)] };
      }
    }
  },
};

/* ---------------------------------------------------------------- *
 * A3.3 — Free-body diagrams
 * ---------------------------------------------------------------- */

const EVERY_ARROW: ArchetypeSpec = {
  id: "g8a3-every-arrow",
  title: "Every Arrow, and Nothing Else",
  tagline: "A 5.0 kg cart under a 20 N pull. Four real forces, and one that is not a force.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Draw every force acting on one chosen object and label its size.",
    "Explain why motion itself never appears as an arrow on a free-body diagram.",
  ],
  misconceptions: [
    "A moving object carries a forward force with it",
    "The normal force is always equal to the weight",
  ],
  specimens: [
    {
      id: "cart", name: "5.0 kg cart on a level bench",
      art: { art: "apparatus", which: "cart" },
      parts: [
        {
          id: "weight", name: "Weight, 49.1 N down", at: [0.02, 0.6],
          note: "5.0 kg x 9.81 N/kg, applied by the Earth.",
        },
        {
          id: "normal", name: "Normal force, 49.1 N up", at: [-0.05, -0.55],
          note: "The bench pushes back exactly as hard.",
        },
        {
          id: "pull", name: "Pull, 20.0 N right", at: [0.62, 0.04],
          note: "Tension in the cord, measured on a balance.",
        },
        {
          id: "friction", name: "Friction, 0.98 N left", at: [-0.62, 0.28],
          note: "Rolling resistance: 0.020 x the 49.1 N normal force.",
        },
        {
          id: "net", name: "Net force, 19.0 N right", at: [0.3, -0.62],
          note: "20.0 - 0.98 = 19.0 N, so a = 3.80 m/s2.",
        },
      ],
    },
  ],
  /*
   * The net arrow is not a decoration, so the cart obeys it: it starts from
   * rest and covers half x 3.80 x t squared, which is 1.9 m in the first
   * second. The travel is kept short so the labelled arrows stay beside the
   * parts they name, but a cart that accelerates while its net-force arrow is
   * showing is worth more than a cart parked under one.
   */
  drive: ({ t }) => {
    const tau = Math.min(cycle(t, 3.4) * 3.4, 1);
    const s = 0.5 * 3.8 * tau * tau;              // metres, from a = F / m
    return { offset: [-0.2 + 0.4 * Math.min(1, s / 1.9), 0], spin: 0.68 };
  },
};

/* ---------------------------------------------------------------- *
 * A3.4 — Friction as the reason intuition misleads
 * ---------------------------------------------------------------- */

const TAKE_FRICTION_AWAY: ArchetypeSpec = {
  id: "g8a3-take-friction-away",
  title: "Take the Friction Away",
  tagline: "Slide the coefficient towards zero and watch the stopping distance run off the bench.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Calculate a friction force as the coefficient multiplied by the normal force.",
    "Explain why things stop on Earth without that meaning a force is needed to keep them going.",
  ],
  misconceptions: [
    "A moving object needs a constant push or it will slow down on its own",
    "Heavier objects always slide further because they have more momentum",
  ],
  specimens: [
    { id: "block", name: "Block launched along a 4 m bench",
      art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "mu", label: "Coefficient of friction", min: 0.02, max: 1, step: 0.01, default: 0.3 },
    { key: "speed", label: "Starting speed (m/s)", min: 0.5, max: 20, step: 0.5, default: 4 },
    { key: "mass", label: "Mass of the block (kg)", min: 0.5, max: 50, step: 0.5, default: 5 },
  ],
  // Friction on a level surface is mu times the normal force, and the normal
  // force here is the whole weight m g. The deceleration is then mu g, with no
  // mass in it at all, which is why a heavy block and a light one of the same
  // material slide exactly the same distance. Real values: ice on ice 0.02,
  // wood on wood 0.30, rubber on dry asphalt 0.70.
  measure: (v) => ({
    normalForceN: v.mass * 9.81,
    frictionForceN: v.mu * v.mass * 9.81,
    decelerationMs2: v.mu * 9.81,
    stoppingDistanceM: (v.speed * v.speed) / (2 * v.mu * 9.81),
    stoppingTimeS: v.speed / (v.mu * 9.81),
  }),
  plot: { x: "mu", y: "stoppingDistanceM", xLabel: "Coefficient of friction", yLabel: "Stopping distance (m)" },
  /*
   * The tagline promises the stopping distance runs off the bench, so it does.
   * The block is launched every five seconds and drawn at its real position,
   * v t - half mu g t squared, on a bench 4 m long. Wood on wood at 0.30 and
   * 4 m/s stops after 2.7 m, comfortably on the bench. Slide the coefficient
   * down to 0.02, the value for ice, and the stopping distance becomes 40.8 m:
   * the block reaches the end still moving, tips over the edge and drops,
   * which is the whole First Law in one picture. Nothing was ever going to
   * stop it, because stopping is what friction does, not what motion does.
   */
  drive: ({ v, f, t }) => {
    const tau = Math.min(cycle(t, 5) * 5, f.stoppingTimeS);
    const s = v.speed * tau - 0.5 * f.decelerationMs2 * tau * tau;
    const at = s / 4;                                  // fraction of the bench
    if (at >= 1) {
      // Off the end, and now falling. Beyond the bench there is no normal
      // force to rub against, so it keeps the speed it had and tips as it goes.
      const fall = Math.min(1, (at - 1) / 0.5);
      return { offset: [0.6, 0.62 * fall], tilt: 0.24 + 1 * fall, spin: 0.68 };
    }
    return { offset: [-0.55 + 1.15 * at, 0], spin: 0.68 };
  },
};

/* ---------------------------------------------------------------- *
 * A3.5 — Applying the First Law to everyday scenarios
 * ---------------------------------------------------------------- */

const THE_BUS_STOPS: ArchetypeSpec = {
  id: "g8a3-the-bus-stops",
  title: "The Bus Stops, You Do Not",
  tagline: "Nothing throws you forward. That is exactly the problem.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Explain an everyday lurch using the First Law rather than an invented force.",
    "Calculate the force a handrail or belt must supply to stop a passenger.",
  ],
  misconceptions: [
    "A force throws you forward when a vehicle brakes",
    "You stop when the vehicle stops because you are inside it",
  ],
  specimens: [{ id: "bus", name: "Bus and passenger", art: { art: "apparatus", which: "cart" } }],
  stages: [
    { name: "Cruising", at: 0,
      caption: "Bus and 65 kg passenger both at 12 m/s. No net force on either." },
    { name: "Brakes on", at: 0.25,
      caption: "The driver brakes. The bus loses speed at 4.8 m/s2. Nothing has touched the passenger." },
    { name: "You keep going", at: 0.5,
      caption: "No force on you means no change for you: still 12 m/s, while the floor slows underneath." },
    { name: "The handrail", at: 0.75,
      caption: "The rail pulls back with 312 N, which is 65 kg x 4.8 m/s2, and now you slow too." },
    { name: "Both stopped", at: 1,
      caption: "It felt like being thrown forward. It was the absence of a force, not the presence of one." },
  ],
  /*
   * The run is the story: two seconds cruising at 12 m/s, then the brakes take
   * 12 m/s off at 4.8 m/s2, which takes exactly 2.5 s and covers 15 m, and
   * then it sits at the stop before pulling away again. The bus is drawn over
   * the 39 m of road that whole run covers, so the braking stretch is visibly
   * the part where the ground stops arriving as fast as it was.
   */
  drive: ({ t }) => {
    const k = cycle(t, 6.5) * 6.5;
    let s: number;
    if (k < 2) s = 12 * k;                                    // cruising
    else if (k < 4.5) { const u = k - 2; s = 24 + 12 * u - 2.4 * u * u; }
    else s = 39;                                              // stopped
    return { offset: [-0.5 + s / 39, 0], spin: 0.68 };
  },
};

export const g8a3FiftyNewtonsEach = buildSim(FIFTY_NEWTONS_EACH);
export const g8a3DoTheyCancel = buildSim(DO_THEY_CANCEL);
export const g8a3EveryArrow = buildSim(EVERY_ARROW);
export const g8a3TakeFrictionAway = buildSim(TAKE_FRICTION_AWAY);
export const g8a3TheBusStops = buildSim(THE_BUS_STOPS);
