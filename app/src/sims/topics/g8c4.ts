import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit C · Topic C4 — Gravitational interactions.
 *
 * Five simulations, one per subtopic:
 *
 *   C4.1  g8c4-can-it-ever-push      gravity is always attractive     (sort)
 *   C4.2  g8c4-mass-and-distance     mass and distance                (investigate)
 *   C4.3  g8c4-never-feel-it         why everyday gravity is unnoticed (compare)
 *   C4.4  g8c4-same-mass-new-weight  mass against weight              (investigate)
 *   C4.5  g8c4-falling-and-missing   applying the argument            (process)
 *
 * Every number here comes out of G = 6.674e-11 N m2 / kg2 and nothing else.
 * That single constant gives 9.82 N/kg at Earth's surface, 0.28 micronewtons
 * between two people standing a metre apart, and a 27.5 day orbit for the
 * Moon — a spread of twenty-seven orders of magnitude from one equation, which
 * is the real reason gravity is worth a topic of its own.
 */

/** Newton's gravitational constant, N m2 / kg2. */
const BIG_G = 6.674e-11;
/** Earth's mass, kg. */
const M_EARTH = 5.972e24;
/** Earth's mean radius, m. */
const R_EARTH = 6.371e6;
/** G x Earth's mass, m3 / s2. */
const GM_EARTH = BIG_G * M_EARTH;
/** Stiffness of the spring balance, N/m. */
const BALANCE_K = 1200;

/* ---------------------------------------------------------------- *
 * C4.1 — Gravity is always attractive
 * ---------------------------------------------------------------- */

const CAN_IT_EVER_PUSH: ArchetypeSpec = {
  id: "g8c4-can-it-ever-push",
  title: "Can It Ever Push?",
  tagline: "Eight pairs of objects. Two of the three noncontact forces can shove. One never can.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4"] },
  learningGoals: [
    "State that gravitational interactions are always attractive.",
    "Contrast gravity with electric and magnetic interactions, which can repel.",
  ],
  misconceptions: [
    "Antigravity is a real force that pushes objects apart",
    "Gravity switches off, or reverses, in space",
  ],
  categories: [
    { id: "push", name: "This force can push", hint: "turn one of the pair round and it repels" },
    { id: "pull", name: "This force only ever pulls", hint: "there is no arrangement that repels" },
  ],
  specimens: [
    {
      id: "poles", name: "Two north poles brought together", category: "push",
      because: "Magnetism has two kinds of pole, so it has a choice. Turn one magnet round and the push becomes a pull.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "balloons", name: "Two balloons rubbed on the same jumper", category: "push",
      because: "Both picked up electrons, so both are negative, so they shove each other apart. Electric charge has two kinds too.",
      art: { art: "sphere", color: "#e3719c", radius: 0.46 },
    },
    {
      id: "moon", name: "The Earth and the Moon", category: "pull",
      because: "1.98e20 N of pure attraction across 384 400 km. There is no arrangement of the two that would push them apart.",
      art: { art: "planet", color: "#8ba0c8" },
    },
    {
      id: "protons", name: "Two protons in a nucleus", category: "push",
      because: "Both positive, so they repel hard: about 230 N between two protons 1 fm apart. It takes the strong force to hold them in.",
      art: { art: "atom", protons: 2, neutrons: 2, electrons: 0 },
    },
    {
      id: "jupiter", name: "The Sun and Jupiter", category: "pull",
      because: "4.16e23 N, always inward. Jupiter has 318 Earth masses and gravity still gives it only one option.",
      art: { art: "planet", color: "#d8a86a", rings: true },
    },
    {
      id: "comb", name: "A charged comb and a scrap of paper", category: "push",
      because: "It pulls the neutral paper in, but hold a second charged comb beside the first and the two combs push each other. Same force, both directions available.",
      art: { art: "sphere", color: "#6ec3b8", radius: 0.42 },
    },
    {
      id: "you", name: "You and the Earth", category: "pull",
      because: "About 590 N downward for a 60 kg student, every second of your life, and never once upward.",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#bcd9ff" },
    },
    {
      id: "dust", name: "Two grains of dust in deep space", category: "pull",
      because: "Absurdly weak — perhaps 1e-20 N — but still attractive, and given millions of years that is how planets get built.",
      art: { art: "sphere", color: "#a49a8f", radius: 0.36 },
    },
  ],
  /*
   * A specimen that can repel is shown drifting apart from its partner and
   * turning; one that can only attract settles downward and slows. The motion
   * comes from the specimen's own category and the clock, so it is the same on
   * every run.
   */
  drive: ({ specimen, t }) =>
    specimen.category === "push"
      ? { offset: [Math.sin(t * 0.8) * 0.18, -0.16], rate: 1.9 }
      : { offset: [0, 0.16], rate: 0.4 },
};

/* ---------------------------------------------------------------- *
 * C4.2 — Gravity depends on mass and distance
 * ---------------------------------------------------------------- */

const MASS_AND_DISTANCE: ArchetypeSpec = {
  id: "g8c4-mass-and-distance",
  title: "Heavier, or Just Closer?",
  tagline: "Build a planet, then back away from it, and watch which change matters more.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4"] },
  learningGoals: [
    "Predict how a gravitational field changes with the mass of the source.",
    "Predict how it changes with distance, and recognise the inverse square shape.",
  ],
  misconceptions: [
    "Gravity is twice as weak twice as far away",
    "A bigger planet always has a stronger surface gravity",
  ],
  specimens: [
    { id: "world", name: "The world you are building",
      art: { art: "planet", color: "#c2703f", atmosphere: "#f0c79a" } },
  ],
  variables: [
    { key: "planetMass", label: "Mass of the world (Earth masses)", min: 0.1, max: 5, step: 0.1, default: 1 },
    { key: "distance", label: "Distance from its centre (thousand km)", min: 6.4, max: 60, step: 0.2, default: 6.4 },
  ],
  /*
   * g = G M / r squared. One Earth mass at one Earth radius, 6 371 km, gives
   * 6.674e-11 x 5.972e24 / 4.059e13 = 9.82 N/kg, which is the number every
   * other sim in the grade uses. Move out to 12 800 km — twice the radius —
   * and it is 2.45 N/kg: a quarter, not a half. Five Earth masses at that same
   * first distance gives 49.1 N/kg, and a 60 kg student would weigh 2 947 N.
   */
  measure: (v) => {
    const r = Math.max(1, v.distance) * 1e6;
    const g = (BIG_G * v.planetMass * M_EARTH) / (r * r);
    return {
      fieldNewtonPerKg: g,
      weightOf60kgN: 60 * g,
      timesEarthSurfaceGravity: g / 9.81,
    };
  },
  plot: {
    x: "distance", y: "fieldNewtonPerKg",
    xLabel: "Distance from its centre (thousand km)", yLabel: "Gravitational field (N/kg)",
  },
  /*
   * The picture shows what you would actually see out of the window: apparent
   * size is the world's radius divided by your distance from it. Rock has a
   * roughly fixed density, so a world of five Earth masses is only the cube
   * root of five — 1.71 times — as wide, not five times. Back away to
   * 60 000 km and it shrinks to a tenth while the field falls by a hundred.
   */
  drive: ({ v }) => ({
    scale: Math.min(1.15, 0.72 * Math.cbrt(v.planetMass) * (6.371 / Math.max(1, v.distance))),
    offset: [0, 0.12],
    tilt: 0.22,
  }),
};

/* ---------------------------------------------------------------- *
 * C4.3 — Why everyday gravity goes unnoticed
 * ---------------------------------------------------------------- */

const NEVER_FEEL_IT: ArchetypeSpec = {
  id: "g8c4-never-feel-it",
  title: "The Pull You Never Feel",
  tagline: "You attract everyone in the room. Work out how hard, and you will see why nobody notices.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4"] },
  learningGoals: [
    "Calculate the gravitational attraction between two everyday objects.",
    "Explain that gravity is only obvious when one of the masses is planet-sized.",
  ],
  misconceptions: [
    "Only large objects have gravity",
    "Gravity between everyday objects is exactly zero",
  ],
  specimens: [
    {
      id: "friend", name: "A friend, 70 kg",
      because: "At one metre the pull between you is 0.28 micronewtons. A grain of sand weighs about fifty thousand times more than that.",
      art: { art: "body", which: "figure" },
    },
    {
      id: "lorry", name: "A loaded lorry, 40 tonnes",
      because: "Five hundred and seventy times the mass, so five hundred and seventy times the pull: 160 micronewtons. Still far too small to feel, and it took a mountain for anyone to measure it.",
      art: { art: "apparatus", which: "cart" },
    },
  ],
  variables: [
    { key: "gap", label: "Distance between the two of you (m)", min: 0.5, max: 10, step: 0.1, default: 1 },
    { key: "yourMass", label: "Your mass (kg)", min: 30, max: 100, step: 1, default: 60 },
  ],
  /*
   * F = G m1 m2 / r squared, in micronewtons because that is the size these
   * come out at. You at 60 kg and a friend at 70 kg, one metre apart:
   * 6.674e-11 x 60 x 70 / 1 = 2.80e-7 N, which is 0.28 micronewtons. Your own
   * weight is 60 x 9.81 = 589 N, so the friend pulls on you with about two
   * billionths of what the Earth does. Nevil Maskelyne needed a whole Scottish
   * mountain, Schiehallion, to see the effect at all in 1774.
   */
  measure: (v) => {
    const r = Math.max(0.1, v.gap);
    const scale = (BIG_G * v.yourMass) / (r * r);
    const friend = scale * 70;
    return {
      friendPullMicroNewton: friend * 1e6,
      lorryPullMicroNewton: scale * 40000 * 1e6,
      yourWeightN: v.yourMass * 9.81,
      billionthsOfYourWeight: (friend / (v.yourMass * 9.81)) * 1e9,
    };
  },
  plot: {
    x: "gap", y: "friendPullMicroNewton",
    xLabel: "Distance between the two of you (m)", yLabel: "Pull from your friend (micronewtons)",
  },
  /*
   * Both panels answer the same slider: the other mass simply is where the
   * slider says it is, drawn walking away across the room. It shrinks a little
   * as it goes, because that is what distance looks like. What the picture
   * cannot show is the force, and that is the point of the sim — the readings
   * fall by a factor of four while the scene barely changes.
   */
  drive: ({ v, index }) => {
    const away = (Math.max(0.5, v.gap) - 0.5) / 9.5;
    return {
      scale: (index === 0 ? 0.5 : 0.78) * (1 - away * 0.42),
      offset: [-0.24 + away * 0.5, index === 0 ? 0.28 : 0.14],
      tilt: 0.24,
    };
  },
};

/* ---------------------------------------------------------------- *
 * C4.4 — Mass vs weight
 * ---------------------------------------------------------------- */

const SAME_MASS_NEW_WEIGHT: ArchetypeSpec = {
  id: "g8c4-same-mass-new-weight",
  title: "Same Mass, New Weight",
  tagline: "Carry one kilogram block to four worlds. The block never changes. The balance always does.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4"] },
  learningGoals: [
    "Distinguish mass in kilograms from weight in newtons.",
    "Calculate weight as mass times the local gravitational field strength.",
  ],
  misconceptions: [
    "Mass and weight are two words for the same thing",
    "An astronaut in orbit has no mass",
  ],
  specimens: [
    { id: "balance", name: "Spring balance, 1 200 N/m", art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "gravity", label: "Surface gravity (N/kg)", min: 1.6, max: 24.8, step: 0.1, default: 9.8 },
    { key: "mass", label: "Mass of the block (kg)", min: 0.5, max: 5, step: 0.1, default: 5 },
  ],
  /*
   * W = m g, and nothing else. The four worlds worth knowing sit on this
   * slider: the Moon at 1.62 N/kg, Mars at 3.72, Earth at 9.81 and Jupiter's
   * cloud tops at 24.79. A 5.0 kg block therefore reads 8.1 N on the Moon,
   * 49.1 N here and 124 N on Jupiter — while the number of kilograms in it
   * never moves, because that is a count of matter and not a force. The
   * balance obeys Hooke's law, so its stretch is W / 1 200 N/m: 40.9 mm here.
   */
  measure: (v) => ({
    weightN: v.mass * v.gravity,
    massKg: v.mass,
    extensionMm: ((v.mass * v.gravity) / BALANCE_K) * 1000,
    timesEarthWeight: v.gravity / 9.81,
  }),
  plot: {
    x: "gravity", y: "weightN",
    xLabel: "Surface gravity (N/kg)", yLabel: "Weight of the block (N)",
  },
  /*
   * A spring balance is an honest picture of a force because Hooke's law makes
   * its stretch proportional to the load. Full scale here is the 103 mm the
   * spring reaches with 5.0 kg on Jupiter; the Moon leaves it at 6.8 mm, and
   * the difference between those two drawings is the whole distinction between
   * mass and weight.
   */
  drive: ({ f }) => ({
    scale: 0.5 + Math.min(1, f.extensionMm / 103) * 0.68,
    tilt: 0.2,
    spin: 0.5,
    offset: [0, 0.1],
  }),
};

/* ---------------------------------------------------------------- *
 * C4.5 — Applying the gravity argument to new cases
 * ---------------------------------------------------------------- */

const FALLING_AND_MISSING: ArchetypeSpec = {
  id: "g8c4-falling-and-missing",
  title: "Falling, and Missing",
  tagline: "The Moon is falling toward you right now. It has simply been missing for four billion years.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4", "MS-ESS1-2"] },
  learningGoals: [
    "Explain an orbit as continuous free fall combined with sideways motion.",
    "Use the inverse square law to predict orbital speed and period at any radius.",
  ],
  misconceptions: [
    "Orbiting objects are beyond the reach of Earth's gravity",
    "Something in orbit is being held up by its speed",
  ],
  specimens: [
    { id: "moon", name: "The body in orbit", art: { art: "sphere", color: "#b9b3ab", radius: 0.42 } },
  ],
  variables: [
    { key: "orbitRadius", label: "Orbit radius from Earth's centre (thousand km)", min: 6.8, max: 400, step: 1, default: 384 },
  ],
  /*
   * Circular orbit, from GM / r squared = v squared / r. With
   * GM = 3.986e14 m3/s2 that gives v = root(GM / r) and T = 2 pi r / v. Three
   * checks a student can make against a reference book: at 6 771 km the space
   * station takes 92 minutes, at 42 164 km a satellite takes exactly one day,
   * which is why that orbit is used for television, and at 384 400 km the
   * Moon takes 27.5 days. Its acceleration there is 0.00272 m/s2, which is
   * 9.81 divided by 60.3 squared — the calculation Newton did in 1666.
   */
  measure: (v) => {
    const r = Math.max(6.4, v.orbitRadius) * 1e6;
    const speed = Math.sqrt(GM_EARTH / r);
    return {
      orbitSpeedKmPerS: speed / 1000,
      periodDays: (2 * Math.PI * r) / speed / 86400,
      fallingAccelerationMs2: GM_EARTH / (r * r),
      radiiFromCentre: r / R_EARTH,
    };
  },
  stages: [
    { name: "Drop it", at: 0,
      caption: "Let go of a ball and it falls. Nothing is odd about that yet." },
    { name: "Throw it", at: 0.25,
      caption: "Throw it sideways and it still falls, but it lands further away." },
    { name: "Throw it harder", at: 0.5,
      caption: "Newton's cannon: throw hard enough and the ground curves away as fast as it falls." },
    { name: "Miss the ground", at: 0.75,
      caption: "At 7.7 km/s it never lands. That is an orbit: free fall that keeps missing." },
    { name: "Still falling", at: 1,
      caption: "The Moon falls at 0.00272 m/s2 too. It has just been missing for four billion years." },
  ],
  /*
   * The body circles the Earth at the centre of the stage, at the radius the
   * slider sets, so the low orbit hugs the middle and the lunar one runs
   * around the edge. Kepler sets the pace: the angular speed goes as
   * r to the power minus three halves, so the inner orbit really does race and
   * the outer one really does crawl. The rate is capped, because a true 92
   * minute orbit drawn beside a 27 day one would be a blur beside a still.
   */
  drive: ({ v, t }) => {
    const rr = 0.16 + (Math.max(6.8, v.orbitRadius) / 400) * 0.6;
    const omega = Math.min(2.6, 1.15 * Math.pow(384 / Math.max(6.8, v.orbitRadius), 1.5));
    const ang = t * omega;
    return {
      offset: [Math.cos(ang) * rr * 1.35, Math.sin(ang) * rr * 0.5],
      scale: 0.6,
    };
  },
};

export const g8c4CanItEverPush = buildSim(CAN_IT_EVER_PUSH);
export const g8c4MassAndDistance = buildSim(MASS_AND_DISTANCE);
export const g8c4NeverFeelIt = buildSim(NEVER_FEEL_IT);
export const g8c4SameMassNewWeight = buildSim(SAME_MASS_NEW_WEIGHT);
export const g8c4FallingAndMissing = buildSim(FALLING_AND_MISSING);
