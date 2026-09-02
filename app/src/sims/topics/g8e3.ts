import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E3 — Gravity in the solar system and galaxy.
 *
 * Five simulations, one per subtopic:
 *
 *   E3.1  g8e3-farther-and-slower  gravity holds the orbits    (investigate)
 *   E3.2  g8e3-fast-enough-to-miss why it neither falls nor flies off (investigate)
 *   E3.3  g8e3-whose-grip          the Sun's dominant mass     (compare)
 *   E3.4  g8e3-rock-or-ice         moons, asteroids and comets (sort)
 *   E3.5  g8e3-our-place           the Milky Way               (explore)
 *
 * The two investigations run on real constants: GM for the Sun is
 * 1.32712440e20 m3/s2 and for Earth 3.986004e14, which put Kepler's law, the
 * 7.67 km/s circular speed at 400 km and the 10.85 km/s escape speed exactly
 * where a textbook puts them.
 */

/** Blend two hex colours; k = 0 gives a, k = 1 gives b. */
function mix(a: string, b: string, k: number): string {
  const c = k < 0 ? 0 : k > 1 ? 1 : k;
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const hx = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hx(ch(a, 0) + (ch(b, 0) - ch(a, 0)) * c)}${
    hx(ch(a, 1) + (ch(b, 1) - ch(a, 1)) * c)}${
    hx(ch(a, 2) + (ch(b, 2) - ch(a, 2)) * c)}`;
}

/** Round to `n` steps, so a driven colour does not rebuild geometry per frame. */
const stepped = (x: number, n: number) => Math.round(x * n) / n;

/* ---------------------------------------------------------------- *
 * E3.1 — Gravity holding orbits together
 * ---------------------------------------------------------------- */

const FARTHER_AND_SLOWER: ArchetypeSpec = {
  id: "g8e3-farther-and-slower",
  title: "Farther Out, and Far Slower",
  tagline: "Move a planet out from the Sun and time one lap. The clock knows exactly where you put it.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-2"] },
  learningGoals: [
    "State Kepler's third law: the square of the period equals the cube of the orbit radius, in years and AU.",
    "Explain why the Sun's pull weakens with the square of the distance, and what that does to orbital speed.",
  ],
  misconceptions: [
    "Every planet takes the same time to go round",
    "Planets far from the Sun move faster because their orbits are longer",
  ],
  specimens: [{
    id: "planet", name: "A planet on a circular orbit",
    art: { art: "planet", color: "#c88a5a", atmosphere: "#e8c9a0" },
  }],
  variables: [
    { key: "radius", label: "Orbit radius", unit: "AU", min: 0.39, max: 30.07, step: 0.01, default: 1 },
  ],
  /*
   * Kepler's third law in the units it was made for: with the period in years
   * and the radius in astronomical units, T squared equals a cubed and the
   * constant is exactly 1. So Mercury at 0.387 AU takes 0.241 years and
   * Neptune at 30.07 takes 164.8. Speed follows from the same law: 29.78 km/s
   * at 1 AU, divided by the square root of the radius, which puts Mercury at
   * 47.9 km/s and Neptune at 5.43. The Sun's pull is GM/r2 with GM =
   * 1.32712440e20 m3/s2, so it is 5.93 mm/s2 at Earth and 6.6 micro-m/s2 at
   * Neptune — 900 times weaker, and still entirely in charge.
   */
  measure: (v) => {
    const a = v.radius;
    const period = Math.pow(a, 1.5);
    return {
      periodYears: period,
      periodDays: period * 365.256,
      orbitSpeedKmS: 29.7847 / Math.sqrt(a),
      sunPullMicroMs2: (5.93006e-3 / (a * a)) * 1e6,
      orbitLengthMillionKm: 2 * Math.PI * a * 149.5979,
      blackbodyTempK: 278.6 / Math.sqrt(a),
    };
  },
  plot: {
    x: "radius", y: "periodYears",
    xLabel: "Orbit radius (AU)", yLabel: "Time for one orbit (years)",
  },
  /*
   * The planet really runs the orbit you set, at six seconds to the Earth
   * year. At Mercury's 0.39 AU it whips round a tight orbit in a second and a
   * half; at Neptune's 30 AU it crawls a wide one and takes a quarter of an
   * hour to get anywhere. Its colour is its blackbody temperature, 279 K at
   * 1 AU falling as the square root of the distance: scorched orange at 446 K
   * beside Mercury, deep blue at 51 K out at Neptune.
   */
  drive: ({ v, f, t }) => {
    const amp = 0.28 + 0.62 * (Math.log(v.radius / 0.39) / Math.log(30.07 / 0.39));
    const angle = (2 * Math.PI * t) / (f.periodYears * 6);
    return {
      offset: [Math.cos(angle) * amp, -Math.sin(angle) * amp * 0.5],
      color: mix("#5fa0ff", "#ff8534", stepped((f.blackbodyTempK - 50) / 400, 10)),
      rate: 0.5,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E3.2 — Why an orbiting object neither falls in nor flies off
 * ---------------------------------------------------------------- */

const FAST_ENOUGH_TO_MISS: ArchetypeSpec = {
  id: "g8e3-fast-enough-to-miss",
  title: "Fast Enough to Keep Missing",
  tagline: "Throw a satellite sideways from 400 km up. Too slow and it lands; too fast and it never comes back.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-2"] },
  learningGoals: [
    "Explain an orbit as free fall that keeps missing the ground, not as an absence of gravity.",
    "Identify the circular speed and the escape speed as the two edges of a stable orbit.",
  ],
  misconceptions: [
    "There is no gravity in orbit",
    "A satellite stays up because it is above the atmosphere",
  ],
  specimens: [{
    id: "sat", name: "The satellite, released 400 km up",
    art: { art: "planet", color: "#b9c2d0" },
  }],
  variables: [
    {
      key: "speed", label: "Sideways speed at release", unit: "km/s",
      min: 3, max: 12, step: 0.1, default: 7.7,
    },
  ],
  /*
   * Vis-viva, on real numbers. At 400 km up the radius is 6 771 km, and with
   * GM = 3.986004e14 m3/s2 the circular speed is 7.673 km/s and the escape
   * speed root-2 times that, 10.851 km/s. Below circular the release point is
   * the high point of an ellipse and the low point drops: at 7.5 km/s the
   * perigee falls to 6 260 km, inside Earth's 6 371 km radius, so it reaches
   * the ground instead. That crash threshold is 7.555 km/s. Between 7.555 and
   * 10.851 it orbits, and the period runs from 88.1 minutes to hours.
   */
  measure: (v) => {
    const GM = 3.986004e14, earthKm = 6371, rKm = 6771, rM = rKm * 1000;
    const speed = v.speed * 1000;
    const energy = (speed * speed) / 2 - GM / rM;
    const bound = energy < 0;
    const aKm = bound ? -GM / (2 * energy) / 1000 : 0;
    const other = bound ? 2 * aKm - rKm : 0;
    const highKm = bound ? Math.max(rKm, other) : 0;
    const lowKm = bound ? Math.min(rKm, other) : 0;
    return {
      circularSpeedKmS: Math.sqrt(GM / rM) / 1000,
      escapeSpeedKmS: Math.sqrt((2 * GM) / rM) / 1000,
      orbitEnergyMJPerKg: energy / 1e6,
      highPointAltitudeKm: bound ? highKm - earthKm : 0,
      lowPointAltitudeKm: bound ? lowKm - earthKm : 0,
      periodMinutes: bound && lowKm >= earthKm
        ? (2 * Math.PI * Math.sqrt(Math.pow(aKm * 1000, 3) / GM)) / 60 : 0,
      hitsTheGround: bound && lowKm < earthKm ? 1 : 0,
      escapes: bound ? 0 : 1,
    };
  },
  plot: {
    x: "speed", y: "orbitEnergyMJPerKg",
    xLabel: "Sideways speed at release (km/s)", yLabel: "Orbital energy (MJ per kg)",
  },
  /*
   * Three outcomes, and the picture shows which one you have bought. Below
   * 7.555 km/s the ellipse cuts inside Earth: the satellite is drawn on the
   * ground, rust-red and dead still. Between there and 10.851 it runs a real
   * ellipse, wider and slower the harder you throw it — at 10 km/s the high
   * point is 31 800 km up. At escape speed it turns ice blue, shrinks with
   * distance and leaves, and never comes back.
   */
  drive: ({ f, t }) => {
    if (f.escapes) {
      const k = (t % 9) * 0.16;
      return {
        offset: [k * 0.9, -k * 0.5],
        scale: Math.max(0.35, 1 - k * 0.45),
        color: "#8fd0ff",
        rate: 1.4,
      };
    }
    if (f.hitsTheGround) {
      return { offset: [0, 0.82], color: "#b4472e", rate: 0 };
    }
    const amp = 0.3 + Math.min(0.62, (f.highPointAltitudeKm / 32000) * 0.62);
    const angle = (2 * Math.PI * t) / Math.max(1.2, f.periodMinutes / 26);
    return {
      offset: [Math.cos(angle) * amp, -Math.sin(angle) * amp * 0.55],
      color: "#b9c2d0",
      rate: 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E3.3 — The Sun's dominant mass
 * ---------------------------------------------------------------- */

/**
 * Draw a pull on a scale the eye can hold.
 *
 * The Sun's grip on a probe at Mercury is 150 000 times Jupiter's, and no
 * honest linear drawing can show both on one stage. So each sphere's radius
 * follows the logarithm of the pull: every factor of ten in the pull is one
 * fixed step in the drawn size, and equal spheres mean equal pulls.
 */
const logSize = (pull: number) =>
  Math.max(0.3, Math.min(1.8, 0.42 + 0.16 * (Math.log10(Math.max(1e-12, pull)) + 9)));

const WHOSE_GRIP: ArchetypeSpec = {
  id: "g8e3-whose-grip",
  title: "Whose Grip Are You In?",
  tagline: "Fly a probe out from the Sun and weigh the Sun's pull against Jupiter's the whole way.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-2"] },
  learningGoals: [
    "Explain that the Sun holds 99.86 per cent of the solar system's mass and therefore sets almost every orbit.",
    "Identify the small region near a planet where the planet's own gravity takes over.",
  ],
  misconceptions: [
    "Jupiter is so big that it controls the outer solar system",
    "Gravity stops at some distance from a body",
  ],
  variables: [
    {
      key: "distance", label: "Where the probe is", unit: "AU from the Sun",
      min: 0.4, max: 30, step: 0.1, default: 1,
    },
  ],
  /*
   * Two inverse-square laws on the same stage. GM for the Sun is
   * 1.32712440e20 m3/s2 and for Jupiter 1.26687e17, a mass ratio of 1047 to 1,
   * and Jupiter orbits at 5.2044 AU. At Earth's distance the Sun pulls
   * 5.93 mm/s2 and Jupiter 0.23 micro-m/s2 — 25 000 times weaker. Only inside
   * Jupiter's Hill sphere, a radius of 0.355 AU, does Jupiter win; that is why
   * it keeps 95 moons and why everything else still answers to the Sun.
   */
  measure: (v) => {
    const r = v.distance;
    const d = Math.max(0.05, Math.abs(r - 5.2044));
    const sun = 5.93006e-3 / (r * r);
    const jupiter = 5.66086e-6 / (d * d);
    return {
      distanceFromJupiterAu: d,
      sunPullMicroMs2: sun * 1e6,
      jupiterPullMicroMs2: jupiter * 1e6,
      sunPullTimesStronger: sun / jupiter,
      jupiterHillRadiusAu: 0.3552,
      sunShareOfSystemMassPercent: 99.86,
    };
  },
  specimens: [
    {
      id: "sun", name: "The Sun: 1.989e30 kg",
      because: "It carries 99.86 per cent of all the mass in the solar system — 333 000 Earths — and its pull falls as the square of the distance: 5.93 mm/s2 at Earth, 6.6 micro-m/s2 out at Neptune.",
      art: { art: "planet", color: "#ffd45e", atmosphere: "#ffeeb0" },
    },
    {
      id: "jupiter", name: "Jupiter: 1.898e27 kg, at 5.2044 AU",
      because: "The largest planet, and still only a thousandth of the Sun. It out-pulls the Sun only within 0.355 AU of itself, its Hill sphere — everywhere else on this slider the Sun wins, usually by thousands of times.",
      art: { art: "planet", color: "#d3ae83", atmosphere: "#e8cea4" },
    },
  ],
  /*
   * Each sphere is drawn at the logarithm of its own pull, so the two can be
   * compared directly however far apart the numbers are. Start the probe at
   * 0.4 AU and the Sun's sphere is enormous beside Jupiter's; slide it to
   * 5.2 and the two match, because that is where the probe is passing through
   * Jupiter's Hill sphere; carry on to 30 and the Sun takes charge again.
   */
  drive: ({ f, index }) => index === 0
    ? { scale: logSize(f.sunPullMicroMs2 / 1e6) }
    : { scale: logSize(f.jupiterPullMicroMs2 / 1e6) },
};

/* ---------------------------------------------------------------- *
 * E3.4 — Moons, asteroids and comets
 * ---------------------------------------------------------------- */

const ROCK_OR_ICE: ArchetypeSpec = {
  id: "g8e3-rock-or-ice",
  title: "Rock, Ice, or Someone Else's Moon?",
  tagline: "Six small bodies with their real orbits. Decide what holds each one and what it is made of.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-2"] },
  learningGoals: [
    "Distinguish moons, asteroids and comets by what they orbit and what they are made of.",
    "Explain why a comet grows a tail only near the Sun.",
  ],
  misconceptions: [
    "Asteroids and comets are the same thing",
    "A comet's tail streams out behind it like smoke",
  ],
  categories: [
    { id: "moon", name: "Moon of a planet", hint: "held by a planet, not by the Sun" },
    { id: "asteroid", name: "Asteroid", hint: "rock and metal, no tail, orbits the Sun" },
    { id: "comet", name: "Comet", hint: "ice that boils off near the Sun" },
  ],
  specimens: [
    {
      id: "io", name: "Io", category: "moon",
      because: "421 700 km from Jupiter, one orbit in 1.769 days. Jupiter's tides knead it hard enough to run 400 volcanoes, and it is the most volcanically active body in the solar system.",
      art: { art: "planet", color: "#e4d24f" },
    },
    {
      id: "titan", name: "Titan", category: "moon",
      because: "1 221 900 km from Saturn, one orbit in 15.95 days. 5 149 km across, bigger than Mercury, and the only moon with a thick atmosphere — 1.45 times Earth's surface pressure, with rivers of liquid methane.",
      art: { art: "planet", color: "#d79b52", atmosphere: "#e8bf7d" },
    },
    {
      id: "ceres", name: "Ceres", category: "asteroid",
      because: "2.77 AU from the Sun, one orbit in 4.60 years. 939 km across and a quarter of all the mass in the asteroid belt, yet still only 1.3 per cent of the Moon's mass.",
      art: { art: "planet", color: "#8d867e" },
    },
    {
      id: "vesta", name: "Vesta", category: "asteroid",
      because: "2.36 AU, one orbit in 3.63 years. 525 km of dry basalt and iron, warm enough long ago to melt and separate into a core and a crust. No ice left to make a tail from.",
      art: { art: "planet", color: "#9d9382" },
    },
    {
      id: "halley", name: "Halley's Comet", category: "comet",
      because: "Perihelion 0.586 AU, aphelion 35.1 AU, one orbit in 75.3 years. An 11 km lump of ice and dust that grows a coma and two tails inside about 3 AU, and is inert the rest of the way.",
      art: { art: "planet", color: "#bfe6f2", atmosphere: "#9fdcff" },
    },
    {
      id: "halebopp", name: "Hale-Bopp", category: "comet",
      because: "A 2 533-year orbit reaching 370 AU. Its 60 km nucleus threw off a coma wider than the Sun, and it stayed visible to the naked eye for 18 months in 1996-97 — longer than any comet on record.",
      art: { art: "planet", color: "#d6f0ff", atmosphere: "#b5e4ff" },
    },
  ],
  /*
   * The specimen gives its own game away before the caption does. A moon runs
   * a tight, fast circle around a planet that is not on the stage. An asteroid
   * is a dead lump: it tumbles slowly and goes nowhere. A comet sweeps a long
   * lopsided arc and brightens as it comes in, because a comet only has a tail
   * where the Sun is close enough to boil its ice.
   */
  drive: ({ specimen, t }) => {
    if (specimen.category === "moon") {
      const a = t * (specimen.id === "io" ? 1.9 : 0.9);
      return { offset: [Math.cos(a) * 0.42, -Math.sin(a) * 0.22], rate: 1.2 };
    }
    if (specimen.category === "asteroid") {
      return { offset: [0, 0], rate: 0.25, tilt: 0.3 };
    }
    const u = (t * 0.16) % 1;
    const near = Math.max(0, 1 - Math.abs(u - 0.5) * 2.6);
    return {
      offset: [Math.cos(u * 2 * Math.PI) * 0.75, -Math.sin(u * 2 * Math.PI) * 0.3],
      scale: 0.85 + near * 0.5,
      color: mix("#7ea6b8", "#e8fbff", stepped(near, 8)),
      rate: 0.6 + near * 2,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E3.5 — The Milky Way, introduced
 * ---------------------------------------------------------------- */

const OUR_PLACE: ArchetypeSpec = {
  id: "g8e3-our-place",
  title: "One Star in a Hundred Billion",
  tagline: "Zoom out past the solar system until the whole Sun is a dot on a spiral arm.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-2"] },
  learningGoals: [
    "Describe the Milky Way as a barred spiral galaxy with a disc, a bulge and a halo.",
    "Locate the Sun within it and state how long one galactic orbit takes.",
  ],
  misconceptions: [
    "The Sun is at the centre of the galaxy",
    "The stars in the sky are the whole universe",
  ],
  specimens: [{
    id: "galaxy",
    name: "The Milky Way, seen from outside",
    art: { art: "planet", color: "#f2dda6", rings: true, atmosphere: "#9dc0ff" },
    parts: [
      { id: "centre", name: "Sagittarius A*", at: [-0.04, -0.04],
        note: "A black hole of 4.3 million solar masses at the exact centre, 26 700 light years away. Stars closest to it swing round in as little as 12 years at up to 8 000 km/s, which is how its mass was measured." },
      { id: "bulge", name: "The bar and the central bulge", at: [0.3, -0.34],
        note: "A bar of old red and yellow stars about 27 000 light years long. Star density here is millions of times higher than in our neighbourhood, and almost no new stars are forming." },
      { id: "disc", name: "The disc: 100 000 light years across", at: [0.66, 0.12],
        note: "About 100 000 light years wide and only 1 000 thick — proportionally thinner than a sheet of paper. All the gas, dust and young blue stars live here, in the spiral arms." },
      { id: "sun", name: "The Sun, on the Orion Spur", at: [-0.62, 0.3],
        note: "26 700 light years from the centre, on a minor spur between the Sagittarius and Perseus arms. One lap at 230 km/s takes about 230 million years, so Earth has been round roughly 20 times since it formed." },
      { id: "halo", name: "The halo and its globular clusters", at: [0.12, -0.66],
        note: "A sphere of old stars and about 150 globular clusters reaching 300 000 light years out. It was by mapping these clusters in 1918 that Harlow Shapley proved the Sun is nowhere near the centre." },
      { id: "count", name: "One to four hundred billion stars", at: [-0.46, -0.46],
        note: "Counting them one a second would take 6 000 years. The nearest of them, Proxima Centauri, is 4.25 light years away — 268 000 times farther than the Sun." },
    ],
  }],
  /*
   * A galaxy is a disc that turns, so it turns: a slow, steady rotation with
   * the disc tipped toward the viewer, which is what tells the eye it is a
   * flat plate of stars and not a ball.
   */
  drive: ({ t }) => ({ tilt: 0.42 + 0.04 * Math.sin(t * 0.22), rate: 0.4 }),
};

export const g8e3FartherAndSlower = buildSim(FARTHER_AND_SLOWER);
export const g8e3FastEnoughToMiss = buildSim(FAST_ENOUGH_TO_MISS);
export const g8e3WhoseGrip = buildSim(WHOSE_GRIP);
export const g8e3RockOrIce = buildSim(ROCK_OR_ICE);
export const g8e3OurPlace = buildSim(OUR_PLACE);
