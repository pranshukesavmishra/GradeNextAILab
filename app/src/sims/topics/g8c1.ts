import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit C · Topic C1 — Contact and noncontact forces.
 *
 * Five simulations, one per subtopic:
 *
 *   C1.1  g8c1-who-is-touching      contact forces                (explore)
 *   C1.2  g8c1-across-the-gap       noncontact forces             (investigate)
 *   C1.3  g8c1-does-anything-touch  sorting real scenarios        (sort)
 *   C1.4  g8c1-push-or-pull         attraction and repulsion      (compare)
 *   C1.5  g8c1-nothing-in-between   previewing the field idea     (process)
 *
 * The unit's first argument is that "noncontact" is not a special exception
 * but the ordinary case, and the way to see it is to measure. So the two
 * quantitative sims here compute a real dipole field, 2e-7 x m / r cubed, and
 * a real Coulomb force, 8.99e9 x q1 q2 / r squared, and the apparatus answers
 * both: the magnet grows with its moment and the pith ball swings out to the
 * angle its own weight and the electric force agree on.
 */

/** Coulomb's constant, N m2 / C2. */
const K_E = 8.99e9;
/** mu0 / 2 pi, the on-axis dipole coefficient, T m / A. */
const MU0_OVER_2PI = 2e-7;
/** G x Earth's mass, m3 / s2, from G = 6.674e-11 and M = 5.972e24 kg. */
const GM_EARTH = 3.986e14;
/** Earth's mean radius, m. */
const R_EARTH = 6.371e6;
/** Free-fall acceleration at the surface, m/s2. */
const G_SURFACE = 9.81;

/* ---------------------------------------------------------------- *
 * C1.1 — Contact forces
 * ---------------------------------------------------------------- */

const WHO_IS_TOUCHING: ArchetypeSpec = {
  id: "g8c1-who-is-touching",
  title: "Find the Toucher",
  tagline: "Five forces act on this trolley. Four of them need something pressed against it.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-1"] },
  learningGoals: [
    "Identify the surface or object responsible for each contact force on a body.",
    "Explain that a contact force disappears the moment the two surfaces separate.",
  ],
  misconceptions: [
    "A moving object carries a forward force of its own",
    "Air resistance and friction are the same force",
  ],
  specimens: [
    {
      id: "trolley",
      name: "2.0 kg trolley, towed at 0.50 m/s",
      art: { art: "apparatus", which: "cart" },
      parts: [
        {
          id: "normal", name: "Normal force, 19.6 N up", at: [-0.06, -0.5],
          note: "The bench, pressed by the wheels, pushes straight back: 2.0 kg x 9.81 N/kg = 19.6 N. Roll off the edge and it is gone at once.",
        },
        {
          id: "tension", name: "Cord tension, 6.0 N forward", at: [0.56, -0.12],
          note: "Stretched fibres pulling on the hook. Cut the cord and the pull stops instantly: no thread, no force.",
        },
        {
          id: "friction", name: "Rolling friction, 0.20 N backward", at: [-0.5, 0.26],
          note: "Good wheels roll with a coefficient near 0.010, so friction is 0.010 x 19.6 N = 0.20 N, at the rubber and nowhere else.",
        },
        {
          id: "drag", name: "Air resistance, 0.003 N backward", at: [0.5, -0.44],
          note: "Half x 1.2 kg/m3 x 0.020 m2 x 1.0 x 0.50 squared = 0.003 N. Air is thin, but it is matter, and it touches the front face.",
        },
        {
          id: "weight", name: "Weight, 19.6 N down — the odd one", at: [0.06, 0.46],
          note: "Nothing touches the trolley to make this. The Earth pulls on every atom of it at once, straight through the bench and the air.",
        },
      ],
    },
  ],
  /*
   * The trolley is towed, so it rolls. Nothing here depends on a control, but
   * the wheels turning is what says the diagram is of a moving object rather
   * than a parked one, and the slight forward lean is the 5.8 N of unbalanced
   * force accelerating it.
   */
  drive: () => ({ rate: 1.2, tilt: 0.26, spin: 0.62 }),
};

/* ---------------------------------------------------------------- *
 * C1.2 — Noncontact forces
 * ---------------------------------------------------------------- */

const ACROSS_THE_GAP: ArchetypeSpec = {
  id: "g8c1-across-the-gap",
  title: "Across the Gap",
  tagline: "Nothing joins the magnet to the probe. Measure what crosses the space anyway.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5"] },
  learningGoals: [
    "Measure a magnetic field across an air gap and show it is not zero.",
    "Describe how the field of a bar magnet falls with the cube of the distance.",
  ],
  misconceptions: [
    "A magnet must touch iron to pull on it",
    "A magnetic force reaches a fixed distance and then stops dead",
  ],
  specimens: [
    { id: "magnet", name: "Bar magnet on the bench", art: { art: "apparatus", which: "magnet" } },
  ],
  variables: [
    { key: "moment", label: "Magnet strength (A m2)", min: 0.2, max: 4, step: 0.1, default: 1 },
    { key: "gap", label: "Gap to the probe (cm)", min: 2, max: 20, step: 0.5, default: 5 },
  ],
  /*
   * On the axis of a magnetic dipole, B = (mu0 / 2 pi) x m / r cubed, with
   * mu0 / 2 pi = 2e-7 T m / A exactly. A 1 A m2 magnet — a small neodymium bar
   * — therefore gives 1.6 mT at 5 cm and 0.20 mT at 10 cm: eight times weaker
   * for twice the distance, because 2 cubed is 8. Earth's own field is about
   * 0.050 mT, so even the far readings here are still above it.
   */
  measure: (v) => {
    const r = Math.max(0.005, v.gap / 100);
    const b = (MU0_OVER_2PI * v.moment) / (r * r * r);
    return {
      fieldMilliTesla: b * 1000,
      fieldAtDoubleGapMilliTesla: (b * 1000) / 8,
      timesEarthField: b / 50e-6,
    };
  },
  plot: {
    x: "gap", y: "fieldMilliTesla",
    xLabel: "Gap to the probe (cm)", yLabel: "Field at the probe (mT)",
  },
  /*
   * A magnet's moment is its volume times its magnetisation, and neodymium is
   * magnetised to a fixed value however big the block is. So a magnet of twice
   * the moment is twice the volume and only the cube root of that — 1.26 times
   * — as long. Drawing it twice as long would teach the wrong lesson about
   * what "stronger" costs. Sliding it along the bench is the gap itself.
   */
  drive: ({ v }) => ({
    scale: 0.44 * Math.cbrt(v.moment / 0.25),
    offset: [((v.gap - 2) / 18) * 0.22, 0.14],
    tilt: 0.22,
    spin: 0.55,
  }),
};

/* ---------------------------------------------------------------- *
 * C1.3 — Sorting real scenarios
 * ---------------------------------------------------------------- */

const DOES_ANYTHING_TOUCH: ArchetypeSpec = {
  id: "g8c1-does-anything-touch",
  title: "Does Anything Touch?",
  tagline: "Eight everyday pushes and pulls. Only one question decides each of them.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "Classify a force as contact or noncontact by asking what is touching what.",
    "Recognise gravity, magnetism and electrostatic attraction as the three noncontact forces met at this level.",
  ],
  misconceptions: [
    "Gravity needs air to work",
    "A magnet's pull is carried by the metal in between",
  ],
  categories: [
    { id: "contact", name: "Contact force", hint: "two surfaces are pressed together" },
    { id: "noncontact", name: "Noncontact force", hint: "there is a gap, and it still works" },
  ],
  specimens: [
    {
      id: "boot", name: "A boot striking a football", category: "contact",
      because: "The leather is squashed against the ball for about 9 milliseconds, and roughly 1 900 N passes through that patch. Nothing happens before the boot arrives.",
      art: { art: "sphere", color: "#eae4d8", radius: 0.42 },
    },
    {
      id: "magnet", name: "A magnet lifting a clip through a card", category: "noncontact",
      because: "The card is in the way and the clip still rises. About 0.2 mT of field crosses 3 mm of cardboard as if it were not there.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "moon", name: "The Earth holding the Moon in orbit", category: "noncontact",
      because: "384 400 km of vacuum, and a pull of 2.0e20 N across it. The Moon falls toward us at 0.00272 m/s2 and has done for four billion years.",
      art: { art: "planet", color: "#8ba0c8", atmosphere: "#cfe0ff" },
    },
    {
      id: "spring", name: "A stretched spring towing a trolley", category: "contact",
      because: "Tension is the stretched atoms of the spring pulling on the hook they are attached to. Unhook it and there is no force at all.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "balloon", name: "A rubbed balloon lifting your hair", category: "noncontact",
      because: "About 1e-8 C of extra electrons on the balloon pulls hair up across a centimetre of air. Electrostatic attraction, working through a gap.",
      art: { art: "sphere", color: "#e3719c", radius: 0.46 },
    },
    {
      id: "friction", name: "A trolley slowing on a rough bench", category: "contact",
      because: "Millions of microscopic high points on the two surfaces catch on one another. Lift the trolley a hair's breadth and friction is exactly zero.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "chair", name: "A chair holding you up", category: "contact",
      because: "The seat compresses by a fraction of a millimetre and pushes back with your whole weight, about 590 N for a 60 kg student.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "fall", name: "A dropped key falling to the floor", category: "noncontact",
      because: "Nothing is touching the key once it leaves your fingers, and it still accelerates at 9.81 m/s2. That is the whole reason gravity needed a new idea.",
      art: { art: "planet", color: "#4d7fd6" },
    },
  ],
  /*
   * The specimens behave the way their category does. A noncontact one floats
   * clear of the floor and keeps turning, because nothing is holding it; a
   * contact one sits still on the surface it is pressed against. Deterministic:
   * everything comes from the clock and the specimen's own identity.
   */
  drive: ({ specimen, t }) =>
    specimen.category === "noncontact"
      ? { offset: [0, -0.24 + Math.sin(t * 0.9) * 0.06], rate: 1.4 }
      : { offset: [0, 0.06], rate: 0 },
};

/* ---------------------------------------------------------------- *
 * C1.4 — Attraction and repulsion
 * ---------------------------------------------------------------- */

const PUSH_OR_PULL: ArchetypeSpec = {
  id: "g8c1-push-or-pull",
  title: "Push Apart, Pull Together",
  tagline: "Two hanging pith balls, the same charge on each. Only the signs are different.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "State that like charges repel and unlike charges attract.",
    "Calculate the electric force between two charges with Coulomb's law.",
  ],
  misconceptions: [
    "A positive charge is stronger than a negative one",
    "Two charges have to be touching to affect each other",
  ],
  specimens: [
    {
      id: "like", name: "Both positive: swings away from the fixed ball",
      because: "The fixed ball is clamped at the left of the panel. Like charges push, so the hanging ball is driven to the right, and it climbs as it goes.",
      art: { art: "sphere", color: "#e0483f", radius: 0.4 },
    },
    {
      id: "unlike", name: "One negative: swings back toward the fixed ball",
      because: "Same charge, same gap, so exactly the same size of force. Only the direction has changed: the hanging ball is pulled left, toward the clamp.",
      art: { art: "sphere", color: "#3a7ede", radius: 0.4 },
    },
  ],
  variables: [
    { key: "charge", label: "Charge on each ball (nC)", min: 5, max: 40, step: 1, default: 20 },
    { key: "gap", label: "Gap between the balls (cm)", min: 2, max: 12, step: 0.5, default: 5 },
  ],
  /*
   * Coulomb's law, F = k q1 q2 / r squared, with k = 8.99e9 N m2 / C2. With
   * 20 nC on each ball 5.0 cm apart that is 8.99e9 x 4.0e-16 / 2.5e-3 =
   * 1.44 mN. Each ball is 0.50 g of pith, weighing 4.91 mN, so the thread it
   * hangs on settles where tan(theta) = F / W — 16.3 degrees here. That angle
   * is the reading, and it is why the picture can be trusted as a measurement.
   */
  measure: (v) => {
    const q = v.charge * 1e-9;
    const r = Math.max(0.005, v.gap / 100);
    const force = (K_E * q * q) / (r * r);
    const weight = 0.0005 * G_SURFACE;
    return {
      forceMilliNewton: force * 1000,
      deflectionDeg: (Math.atan(force / weight) * 180) / Math.PI,
      timesTheBallsWeight: force / weight,
    };
  },
  plot: {
    x: "charge", y: "forceMilliNewton",
    xLabel: "Charge on each ball (nC)", yLabel: "Force (mN)",
  },
  /*
   * A pendulum pushed sideways swings out and rises: sideways by L sin(theta)
   * and upward by L (1 - cos(theta)). Both come straight from the deflection
   * the measurement already found, so the ball is standing exactly where the
   * physics puts it. Panel one swings away from its partner, panel two toward
   * it, and that difference of sign is the entire lesson.
   */
  drive: ({ f, index }) => {
    const theta = (f.deflectionDeg * Math.PI) / 180;
    const dir = index === 0 ? 1 : -1;
    return {
      offset: [dir * Math.sin(theta) * 0.5, -(1 - Math.cos(theta)) * 0.5],
    };
  },
};

/* ---------------------------------------------------------------- *
 * C1.5 — Previewing the field idea
 * ---------------------------------------------------------------- */

const NOTHING_IN_BETWEEN: ArchetypeSpec = {
  id: "g8c1-nothing-in-between",
  title: "Nothing In Between",
  tagline: "Back away from the Earth and the pull follows you. What is carrying it?",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4", "MS-PS2-5"] },
  learningGoals: [
    "Describe a field as a property of the space around an object rather than of the object alone.",
    "Show that a gravitational field is still measurable where there is no matter at all.",
  ],
  misconceptions: [
    "There is no gravity in space",
    "A force needs something in between to carry it",
  ],
  specimens: [
    { id: "earth", name: "The Earth, seen from your test mass",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#bcd9ff" } },
  ],
  variables: [
    { key: "distance", label: "Distance from Earth's centre (Earth radii)", min: 1, max: 60, step: 0.5, default: 10 },
  ],
  /*
   * g = GM / r squared, with GM = 3.986e14 m3/s2 and one Earth radius
   * 6.371e6 m. At the surface that is 9.82 N/kg, which is the textbook value
   * and a good check that the constants are right. At 60.3 radii — the Moon's
   * distance — it is 0.00270 N/kg, and the Moon's measured centripetal
   * acceleration is 0.00272 m/s2. Newton did exactly this comparison in 1666.
   */
  measure: (v) => {
    const r = Math.max(1, v.distance) * R_EARTH;
    const g = GM_EARTH / (r * r);
    return {
      fieldNewtonPerKg: g,
      pullOn70kgN: 70 * g,
      distanceThousandKm: (r / 1e6),
    };
  },
  stages: [
    { name: "Touching", at: 0,
      caption: "Standing on the ground at 9.82 N/kg, it is easy to blame the ground for the pull." },
    { name: "Not touching", at: 0.25,
      caption: "Step off a board. Nothing touches you now, and the pull has not changed at all." },
    { name: "No air either", at: 0.5,
      caption: "At 2 radii there is no air in between. A quarter of the field, because 2 squared is 4." },
    { name: "At the Moon", at: 0.75,
      caption: "60.3 radii out: 0.00270 N/kg across 384 400 km of vacuum. Small, but never zero." },
    { name: "So what is out there?", at: 1,
      caption: "Space that pulls on whatever you put in it. That property of space is a field." },
  ],
  /*
   * The only honest way for the picture to answer this slider is apparent
   * size. A sphere of radius R seen from distance r subtends an angle that
   * goes as R / r, so the Earth drawn here shrinks as one over the distance:
   * at 60 radii it is a sixth of the width it had at 4. The cap keeps the
   * near view inside the stage rather than letting it swallow the captions.
   */
  drive: ({ v }) => ({
    scale: Math.min(1.16, 0.34 + 5.2 / (2.6 + v.distance)),
    tilt: 0.2,
  }),
};

export const g8c1WhoIsTouching = buildSim(WHO_IS_TOUCHING);
export const g8c1AcrossTheGap = buildSim(ACROSS_THE_GAP);
export const g8c1DoesAnythingTouch = buildSim(DOES_ANYTHING_TOUCH);
export const g8c1PushOrPull = buildSim(PUSH_OR_PULL);
export const g8c1NothingInBetween = buildSim(NOTHING_IN_BETWEEN);
