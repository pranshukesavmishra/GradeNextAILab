import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit A · Topic A5 — Newton's Third Law and collisions.
 *
 * Five simulations, one per subtopic:
 *
 *   A5.1  g8a5-partner-or-not     action-reaction pairs                (sort)
 *   A5.2  g8a5-one-force-each     why a pair acts on different objects (explore)
 *   A5.3  g8a5-so-nothing-moves   the cancelling misconception         (process)
 *   A5.4  g8a5-stretch-the-stop   designing for a survivable collision (investigate)
 *   A5.5  g8a5-against-the-limit  testing a design against criteria    (compare)
 *
 * The safety numbers all come from one impulse calculation: a 70 kg occupant
 * at 13.4 m/s carries 938 kg m/s of momentum, and the force needed to remove
 * it is that momentum divided by the stopping time. Stretch 0.04 s to 0.12 s
 * and 23.5 kN becomes 7.8 kN.
 */

/* ---------------------------------------------------------------- *
 * A5.1 — Action-reaction pairs
 * ---------------------------------------------------------------- */

const PARTNER_OR_NOT: ArchetypeSpec = {
  id: "g8a5-partner-or-not",
  title: "Partner, or Just Two Arrows?",
  tagline: "Equal and opposite is not enough. A real pair acts on two different bodies.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Identify the partner force in a Third Law pair.",
    "Distinguish a Third Law pair from two balanced forces on the same object.",
  ],
  misconceptions: [
    "Any two equal and opposite forces are an action-reaction pair",
    "The weight of an object and the table's push are a Third Law pair",
  ],
  categories: [
    { id: "pair", name: "A Third Law pair", hint: "one force on each of two bodies" },
    { id: "same", name: "Both on one body", hint: "equal and opposite, but not a pair" },
  ],
  specimens: [
    {
      id: "bat", name: "Bat pushes ball 1 500 N, ball pushes bat 1 500 N", category: "pair",
      because:
        "One force acts on the ball, the other on the bat. Same size, same kind, opposite directions, different bodies. The bat is what a pair looks like.",
      art: { art: "sphere", color: "#f2ece0", radius: 0.34 },
    },
    {
      id: "moon", name: "Earth pulls the Moon, Moon pulls the Earth", category: "pair",
      because:
        "Both are 1.98 x 10^20 N of gravity. The Moon is 81 times lighter, so it accelerates 81 times more, but the forces themselves are identical.",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#9fd8ff" },
    },
    {
      id: "magnet", name: "Magnet pulls the steel 0.40 N, steel pulls the magnet 0.40 N", category: "pair",
      because:
        "No contact and no push from anyone, yet the pair is exact. Put the magnet on a trolley and both objects move towards each other.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "cart", name: "Cart's weight 49 N down, bench pushes 49 N up", category: "same",
      because:
        "Both of these act on the cart, so they are balanced forces, not a pair. The partner of the weight is the cart pulling the whole Earth upwards with 49 N.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "skydiver", name: "Skydiver's weight 785 N down, drag 785 N up", category: "same",
      because:
        "Two forces on one falling person, which is why they can cancel and give terminal velocity. A Third Law pair can never cancel, because it is never on one body.",
      art: { art: "sphere", color: "#7f8ea3", radius: 0.46 },
    },
    {
      id: "spring", name: "Spring pulls the mass up 19.6 N, weight pulls it down 19.6 N", category: "same",
      because:
        "Both act on the hanging mass. The partner of the spring's pull is the mass pulling down on the spring, which is what stretches it in the first place.",
      art: { art: "apparatus", which: "spring" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.2 — Why the pair acts on different objects
 * ---------------------------------------------------------------- */

const ONE_FORCE_EACH: ArchetypeSpec = {
  id: "g8a5-one-force-each",
  title: "One Force Each, Never Two on One",
  tagline: "Two magnets, 0.40 N apart. Pick apart what makes them a pair.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "State both members of a Third Law pair, naming the body each acts on.",
    "Explain why the two members of a pair can never add up or cancel.",
  ],
  misconceptions: [
    "The stronger or heavier object pushes harder",
    "The action happens first and the reaction answers it",
  ],
  specimens: [
    {
      id: "magnets", name: "Two magnets, north to north",
      art: { art: "apparatus", which: "magnet" },
      parts: [
        {
          id: "onB", name: "0.40 N on magnet B", at: [0.6, -0.34],
          note: "A pushes B to the right. This force acts on B.",
        },
        {
          id: "onA", name: "0.40 N on magnet A", at: [-0.6, -0.34],
          note: "B pushes A to the left, equally hard.",
        },
        {
          id: "bodies", name: "Two bodies", at: [0.02, 0.6],
          note: "One force on each, so they can never cancel.",
        },
        {
          id: "type", name: "Same kind of force", at: [0.62, 0.26],
          note: "Both magnetic. A pair is always one type.",
        },
        {
          id: "together", name: "Always together", at: [-0.62, 0.26],
          note: "Neither comes first. Remove one and both vanish.",
        },
        {
          id: "effect", name: "Different results", at: [0.05, -0.66],
          note: "A 20 g magnet gets 20 m/s2; a 200 g one, 2.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.3 — A common Third Law misconception
 * ---------------------------------------------------------------- */

const SO_NOTHING_MOVES: ArchetypeSpec = {
  id: "g8a5-so-nothing-moves",
  title: "So Nothing Can Ever Move?",
  tagline: "If the cart pulls back just as hard, how does the horse get anywhere?",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Resolve the horse-and-cart paradox by choosing one body at a time.",
    "Add only the forces acting on the chosen body to find its acceleration.",
  ],
  misconceptions: [
    "Equal and opposite forces mean nothing can accelerate",
    "The horse must pull harder than the cart pulls back",
  ],
  specimens: [{ id: "cart", name: "Loaded cart, 700 kg", art: { art: "apparatus", which: "cart" } }],
  stages: [
    { name: "The pull", at: 0,
      caption: "The horse pulls the cart forward with 900 N through the traces." },
    { name: "The partner", at: 0.25,
      caption: "The cart pulls back on the horse with exactly 900 N. That really is true." },
    { name: "Different bodies", at: 0.5,
      caption: "One of those acts on the cart, the other on the horse. They are never in the same sum." },
    { name: "Cart only", at: 0.75,
      caption: "On the cart: 900 N forward, and 0.08 x 6 867 N = 549 N of resistance back. Net 351 N." },
    { name: "It moves", at: 1,
      caption: "351 N on 700 kg gives 0.50 m/s2. The pair was never the thing stopping it." },
  ],
};

/* ---------------------------------------------------------------- *
 * A5.4 — Applying the law to a collision-safety design
 * ---------------------------------------------------------------- */

const STRETCH_THE_STOP: ArchetypeSpec = {
  id: "g8a5-stretch-the-stop",
  title: "Stretch the Stop, Shrink the Force",
  tagline: "The momentum to remove is fixed. Only the time you take is yours to choose.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Calculate momentum as mass times velocity.",
    "Use impulse to show that a longer stopping time means a smaller force.",
  ],
  misconceptions: [
    "A seatbelt works by being strong enough to hold you",
    "The force in a crash depends only on how fast you were going",
  ],
  specimens: [{ id: "sled", name: "Crash test sled", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "mass", label: "Occupant mass (kg)", min: 30, max: 90, step: 1, default: 70 },
    { key: "speed", label: "Speed at impact (m/s)", min: 2, max: 20, step: 0.1, default: 13.4 },
    { key: "stopTime", label: "Time taken to stop (s)", min: 0.02, max: 0.6, step: 0.01, default: 0.15 },
  ],
  // Impulse equals change of momentum: F t = m v, so F = m v / t. The momentum
  // is fixed by the crash; the stopping time is the only thing a designer can
  // change, and the force falls in exact proportion as it grows. The distance
  // travelled while stopping steadily is the average speed times the time.
  measure: (v) => ({
    momentumKgms: v.mass * v.speed,
    forceN: (v.mass * v.speed) / v.stopTime,
    forceKN: (v.mass * v.speed) / v.stopTime / 1000,
    decelerationG: v.speed / v.stopTime / 9.81,
    stoppingDistanceM: (v.speed * v.stopTime) / 2,
  }),
  plot: { x: "stopTime", y: "forceKN", xLabel: "Stopping time (s)", yLabel: "Force on the occupant (kN)" },
};

/* ---------------------------------------------------------------- *
 * A5.5 — Testing the design against criteria
 * ---------------------------------------------------------------- */

const AGAINST_THE_LIMIT: ArchetypeSpec = {
  id: "g8a5-against-the-limit",
  title: "Held Against the 15 kN Limit",
  tagline: "Same sled, same 13.4 m/s, two nose designs and one pass mark.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-1"] },
  learningGoals: [
    "Test two designs against the same numerical criterion.",
    "Report a result as a margin against the limit rather than as pass or fail alone.",
  ],
  misconceptions: [
    "The stiffer design must be the safer one",
    "A design either works or it does not, with no margin to report",
  ],
  specimens: [
    {
      id: "rigid", name: "Rigid nose: stops in 0.04 s",
      because: "23.5 kN on a 70 kg dummy. Over the 15 kN limit by 56 per cent.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "crumple", name: "Crumple nose: stops in 0.12 s",
      because: "7.8 kN. Passes, with 48 per cent of margin left.",
      art: { art: "apparatus", which: "spring" },
    },
  ],
  variables: [
    { key: "mass", label: "Dummy mass (kg)", min: 30, max: 90, step: 1, default: 70 },
    { key: "speed", label: "Impact speed (m/s)", min: 2, max: 20, step: 0.1, default: 13.4 },
    { key: "limit", label: "Force criterion (kN)", min: 5, max: 30, step: 0.5, default: 15 },
  ],
  // Both designs face the same momentum; only the stopping time differs, at a
  // measured 0.04 s for the rigid nose and 0.12 s for the crumple nose. The
  // margin is how far each sits below the criterion, as a percentage of it.
  measure: (v) => {
    const p = v.mass * v.speed;
    const rigid = p / 0.04 / 1000;
    const crumple = p / 0.12 / 1000;
    return {
      rigidForceKN: rigid,
      crumpleForceKN: crumple,
      rigidMarginPercent: ((v.limit - rigid) / v.limit) * 100,
      crumpleMarginPercent: ((v.limit - crumple) / v.limit) * 100,
    };
  },
};

export const g8a5PartnerOrNot = buildSim(PARTNER_OR_NOT);
export const g8a5OneForceEach = buildSim(ONE_FORCE_EACH);
export const g8a5SoNothingMoves = buildSim(SO_NOTHING_MOVES);
export const g8a5StretchTheStop = buildSim(STRETCH_THE_STOP);
export const g8a5AgainstTheLimit = buildSim(AGAINST_THE_LIMIT);
