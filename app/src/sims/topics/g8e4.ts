import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E4 — The scale of the solar system.
 *
 * Five simulations, one per subtopic:
 *
 *   E4.1  g8e4-one-astronomical-unit  the AU                  (investigate)
 *   E4.2  g8e4-size-or-distance       reading size vs distance data (compare)
 *   E4.3  g8e4-shrink-the-sun         why a scale model will not fit (investigate)
 *   E4.4  g8e4-rock-or-gas            comparing planetary properties (sort)
 *   E4.5  g8e4-lay-out-the-field      building a scale representation (assemble)
 *
 * One astronomical unit is defined as exactly 149 597 870 700 m, and every
 * distance, diameter, density and day length below is the measured value for
 * that planet. The topic only works if the numbers are real: the whole point
 * is that they refuse to fit on a page.
 */

/** Planet data, in order out from the Sun. Diameters in km, distances in AU. */
const PLANETS = [
  { name: "Mercury", diameterKm: 4879, distanceAu: 0.387, color: "#9c9188",
    massEarths: 0.0553, gravity: 3.7, dayHours: 1407.6, yearYears: 0.2408, densityKgM3: 5427 },
  { name: "Venus", diameterKm: 12104, distanceAu: 0.723, color: "#e0c07a",
    massEarths: 0.815, gravity: 8.87, dayHours: 5832.5, yearYears: 0.6152, densityKgM3: 5243 },
  { name: "Earth", diameterKm: 12756, distanceAu: 1.000, color: "#4a7fc1",
    massEarths: 1, gravity: 9.81, dayHours: 23.93, yearYears: 1.0, densityKgM3: 5514 },
  { name: "Mars", diameterKm: 6792, distanceAu: 1.524, color: "#c1583a",
    massEarths: 0.107, gravity: 3.71, dayHours: 24.62, yearYears: 1.8808, densityKgM3: 3933 },
  { name: "Jupiter", diameterKm: 142984, distanceAu: 5.204, color: "#d3ae83",
    massEarths: 317.8, gravity: 24.79, dayHours: 9.93, yearYears: 11.862, densityKgM3: 1326 },
  { name: "Saturn", diameterKm: 120536, distanceAu: 9.583, color: "#e3d0a0",
    massEarths: 95.16, gravity: 10.44, dayHours: 10.66, yearYears: 29.457, densityKgM3: 687 },
  { name: "Uranus", diameterKm: 51118, distanceAu: 19.191, color: "#96dbe4",
    massEarths: 14.54, gravity: 8.87, dayHours: 17.24, yearYears: 84.011, densityKgM3: 1271 },
  { name: "Neptune", diameterKm: 49528, distanceAu: 30.070, color: "#4a72c9",
    massEarths: 17.15, gravity: 11.15, dayHours: 16.11, yearYears: 164.79, densityKgM3: 1638 },
];

/* ---------------------------------------------------------------- *
 * E4.1 — The astronomical unit
 * ---------------------------------------------------------------- */

const ONE_ASTRONOMICAL_UNIT: ArchetypeSpec = {
  id: "g8e4-one-astronomical-unit",
  title: "How Big Is the Sun From Out There?",
  tagline: "Fly out from Venus to Neptune and watch the Sun shrink to a bright star.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-3"] },
  learningGoals: [
    "Use the astronomical unit as the working ruler of the solar system.",
    "Explain why the Sun's apparent size and its light both fall off with distance.",
  ],
  misconceptions: [
    "The outer planets are only a little farther out than the inner ones",
    "Sunlight is about the same strength everywhere in the solar system",
  ],
  specimens: [{
    id: "sun", name: "The Sun, from the spacecraft window",
    art: { art: "planet", color: "#ffd045", atmosphere: "#ffeaa0" },
  }],
  variables: [
    { key: "distance", label: "Distance from the Sun", unit: "AU", min: 0.55, max: 30.07, step: 0.01, default: 1 },
  ],
  /*
   * One astronomical unit is exactly 149 597 870 700 m by definition, and
   * light crosses it in 499.005 s — 8 minutes 19 seconds. The Sun's disc is
   * 0.533 degrees across from Earth, so it is 0.0177 degrees from Neptune,
   * thirty times smaller and 900 times fainter: 1361 W/m2 here, 1.5 out there.
   * The airliner figure is the one that lands: at a steady 900 km/h it is 19
   * years to the Sun and 570 years to Neptune.
   */
  measure: (v) => {
    const km = v.distance * 149597870.7;
    return {
      distanceMillionKm: km / 1e6,
      lightTravelMinutes: v.distance * 8.31675,
      sunApparentDiameterDeg: 0.533 / v.distance,
      sunlightWm2: 1361 / (v.distance * v.distance),
      airlinerYears: km / 900 / 24 / 365.25,
      voyagerYears: km / 17 / 3600 / 24 / 365.25,
    };
  },
  plot: {
    x: "distance", y: "sunApparentDiameterDeg",
    xLabel: "Distance from the Sun (AU)", yLabel: "Apparent size of the Sun (degrees)",
  },
  /*
   * The Sun is drawn at its true apparent size, straight inverse in the
   * distance, with 1 AU set at a little over half the stage. From Venus it
   * fills the window; from Neptune it is 1/30 as wide and 900 times fainter,
   * bright enough to read by and no bigger than a good planet in our own sky.
   * The floor of 0.035 stops it disappearing altogether at the far end.
   */
  drive: ({ v }) => ({ scale: Math.max(0.035, 0.55 / v.distance) }),
};

/* ---------------------------------------------------------------- *
 * E4.2 — Analysing size and distance data
 * ---------------------------------------------------------------- */

/** The planet a 1-to-8 control is pointing at. */
const planetAt = (n: number) => PLANETS[Math.max(0, Math.min(7, Math.round(n) - 1))];

const SIZE_OR_DISTANCE: ArchetypeSpec = {
  id: "g8e4-size-or-distance",
  title: "Two Columns of the Same Table",
  tagline: "Step through the eight planets with diameter on one side and distance on the other. They do not grow together.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-3"] },
  learningGoals: [
    "Read a planetary data table and compare two quantities that grow at different rates.",
    "Explain why the largest planet is not the farthest one, and what that does to a scale drawing.",
  ],
  misconceptions: [
    "The planets get steadily bigger the farther out they are",
    "A diagram of the solar system can show sizes and distances on the same scale",
  ],
  variables: [
    {
      key: "planet", label: "Planet: 1 Mercury to 8 Neptune",
      min: 1, max: 8, step: 1, default: 3,
    },
  ],
  /*
   * The two columns of the table, side by side. Diameters run from Mercury's
   * 4 879 km to Jupiter's 142 984 — a factor of 29, and it peaks in the
   * middle. Distances run from 0.387 AU to 30.07 — a factor of 78, and it only
   * ever climbs. So the two orderings disagree: Jupiter is 11 times Earth's
   * width but only 5 times its distance, while Neptune is 3.9 times Earth's
   * width and 30 times its distance.
   */
  measure: (v) => {
    const p = planetAt(v.planet);
    return {
      diameterKm: p.diameterKm,
      distanceAu: p.distanceAu,
      distanceMillionKm: p.distanceAu * 149.5979,
      timesEarthDiameter: p.diameterKm / 12756,
      timesEarthDistance: p.distanceAu,
      yearInEarthYears: p.yearYears,
    };
  },
  specimens: [
    {
      id: "bysize", name: "Drawn to its diameter",
      because: "Every disc here is proportional to the real diameter, with Jupiter's 142 984 km filling the panel. The sequence goes small, small, small, small, huge, huge, middling, middling.",
      art: { art: "planet", color: "#4a7fc1" },
    },
    {
      id: "bydistance", name: "Drawn to its distance from the Sun",
      because: "Now every disc is proportional to the distance instead. This sequence only ever grows, and Neptune at 30.07 AU is six times farther out than Jupiter, which was the biggest.",
      art: { art: "planet", color: "#4a7fc1" },
    },
  ],
  /*
   * Same planet, same colour, two different rules for how big to draw it. On
   * the left the size is the real diameter and the run peaks at Jupiter; on
   * the right it is the real distance and the run climbs all the way to
   * Neptune. Step from 1 to 8 and watch the two discs swap which is larger
   * somewhere around Saturn — that crossover is the whole lesson about why no
   * single diagram can be to scale in both.
   */
  drive: ({ v, f, index }) => {
    const p = planetAt(v.planet);
    return index === 0
      ? { scale: 0.22 + 1.3 * (f.diameterKm / 142984), color: p.color }
      : { scale: 0.22 + 1.3 * (f.distanceAu / 30.07), color: p.color };
  },
};

/* ---------------------------------------------------------------- *
 * E4.3 — Why a to-scale classroom model is nearly impossible
 * ---------------------------------------------------------------- */

const SHRINK_THE_SUN: ArchetypeSpec = {
  id: "g8e4-shrink-the-sun",
  title: "Shrink the Sun to a Beach Ball",
  tagline: "Pick a size for the model Sun and find out where Earth has to stand.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-3"] },
  learningGoals: [
    "Apply a single scale factor to both sizes and distances and see what it produces.",
    "Explain why textbook diagrams of the solar system are never to scale.",
  ],
  misconceptions: [
    "A picture of the solar system in a book is roughly to scale",
    "You could fit a scale model of the solar system in a classroom",
  ],
  specimens: [{
    id: "bead", name: "The model Earth, at its model distance",
    art: { art: "planet", color: "#4a7fc1", atmosphere: "#a8d0ff" },
  }],
  variables: [
    { key: "sunCm", label: "Model Sun diameter", unit: "cm", min: 1, max: 120, step: 1, default: 100 },
  ],
  /*
   * One scale factor, applied honestly to everything. The Sun is 1 391 400 km
   * across and Earth 12 742, a ratio of 109 to 1, so a 1 m model Sun makes
   * Earth a 9.16 mm bead — smaller than a marble. The same factor puts that
   * bead 107.5 m away, Neptune 3.23 km away, and the nearest star, Proxima
   * Centauri at 268 553 AU, some 28 900 km away: three quarters of the way
   * round the real Earth. Shrink the Sun to a 1 cm bead and Earth is a grain
   * of dust a metre off, but Neptune is still 32 m down the corridor.
   */
  measure: (v) => ({
    scaleOneTo: 139140000000 / v.sunCm,
    earthBeadMm: v.sunCm * 0.091571,
    earthDistanceM: v.sunCm * 1.075122,
    jupiterDistanceM: v.sunCm * 5.594935,
    neptuneDistanceKm: v.sunCm * 0.032329,
    proximaCentauriKm: v.sunCm * 288.79,
    fitsIn30mHall: v.sunCm * 1.075122 <= 30 ? 1 : 0,
  }),
  plot: {
    x: "sunCm", y: "earthDistanceM",
    xLabel: "Model Sun diameter (cm)", yLabel: "Where Earth has to stand (m)",
  },
  /*
   * The bead is drawn at its model diameter and stood at its model distance,
   * both on the same scale factor as the Sun you chose — so it grows and walks
   * away together, which is exactly what a real scale model does. Past a
   * 28 cm Sun the bead is more than 30 m out, past the end of any school hall,
   * and it turns warning red to say the model has already broken. It is never
   * drawn below a few per cent of the stage, or at a 1 cm Sun there would be
   * nothing on screen at all.
   */
  drive: ({ f }) => ({
    scale: Math.max(0.04, 1.35 * (f.earthBeadMm / 10.99)),
    offset: [Math.min(1, f.earthDistanceM / 129) * 1.05 - 0.15, 0],
    color: f.fitsIn30mHall ? "#4a7fc1" : "#c0392b",
  }),
};

/* ---------------------------------------------------------------- *
 * E4.4 — Comparing planetary properties
 * ---------------------------------------------------------------- */

const ROCK_OR_GAS: ArchetypeSpec = {
  id: "g8e4-rock-or-gas",
  title: "Rocky, or Giant?",
  tagline: "Eight planets at their true relative sizes and true spin rates. Two families, and the data says which.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-3"] },
  learningGoals: [
    "Group the planets into terrestrial and giant using diameter, density and day length.",
    "Explain why density separates the two families more sharply than size does.",
  ],
  misconceptions: [
    "The giant planets are big because they are heavy rock",
    "Every planet takes about a day to spin once",
  ],
  categories: [
    { id: "rocky", name: "Rocky planet", hint: "small, dense, slow-turning, few moons" },
    { id: "giant", name: "Giant planet", hint: "huge, low density, spins in about 10 hours" },
  ],
  specimens: [
    { id: "mercury", name: "Mercury", category: "rocky",
      because: "4 879 km across, density 5 427 kg/m3, gravity 3.7 N/kg. One turn takes 1 407.6 hours — 58.6 Earth days — and its year is only 88 days, so a solar day there lasts two of its years.",
      art: { art: "planet", color: "#9c9188" } },
    { id: "venus", name: "Venus", category: "rocky",
      because: "12 104 km, density 5 243 kg/m3, gravity 8.87 N/kg. It turns backwards once every 5 832 hours — 243 Earth days, longer than its 225-day year — under a carbon-dioxide atmosphere at 92 bar and 464 degrees C.",
      art: { art: "planet", color: "#e0c07a", atmosphere: "#f2dca8" } },
    { id: "earth", name: "Earth", category: "rocky",
      because: "12 756 km and the densest planet in the solar system at 5 514 kg/m3, which is how we know it has an iron core. One turn in 23.93 hours, one moon.",
      art: { art: "planet", color: "#4a7fc1", atmosphere: "#a8d0ff" } },
    { id: "mars", name: "Mars", category: "rocky",
      because: "6 792 km, density 3 933 kg/m3, gravity 3.71 N/kg. A day of 24.62 hours, almost Earth's, and two captured asteroids for moons.",
      art: { art: "planet", color: "#c1583a", atmosphere: "#e0a086" } },
    { id: "jupiter", name: "Jupiter", category: "giant",
      because: "142 984 km across — eleven Earths — and 318 Earth masses, yet a density of only 1 326 kg/m3, because it is mostly hydrogen and helium. It turns in 9.93 hours, the fastest in the solar system, and has 95 known moons.",
      art: { art: "planet", color: "#d3ae83", atmosphere: "#e8cea4" } },
    { id: "saturn", name: "Saturn", category: "giant",
      because: "120 536 km and 95 Earth masses at a density of 687 kg/m3 — less than water, so it would float. A 10.66-hour day, rings 280 000 km wide and under a kilometre thick, and 146 known moons.",
      art: { art: "planet", color: "#e3d0a0", rings: true, atmosphere: "#f0e0b8" } },
    { id: "uranus", name: "Uranus", category: "giant",
      because: "51 118 km, 14.5 Earth masses, density 1 271 kg/m3 of hydrogen, helium, water, ammonia and methane ice. A 17.24-hour day on an axis tipped 97.8 degrees, so it rolls round the Sun on its side.",
      art: { art: "planet", color: "#96dbe4", atmosphere: "#bdeef4" } },
    { id: "neptune", name: "Neptune", category: "giant",
      because: "49 528 km and 17.1 Earth masses at 1 638 kg/m3 — smaller than Uranus but heavier. A 16.11-hour day, winds of 2 100 km/h, and a year of 164.8 Earth years.",
      art: { art: "planet", color: "#4a72c9", atmosphere: "#8fb6f2" } },
  ],
  /*
   * Every planet is drawn at its true diameter against the others — Jupiter
   * eleven times Earth's width, Mercury a third of it — and turned at its true
   * rate, one Earth day to the second. That gives the sort away before the
   * caption does: the giants are the huge ones whipping round in ten hours,
   * and Venus, at 243 days to the turn, is so nearly frozen you have to watch
   * to be sure it is moving at all.
   */
  drive: ({ specimen }) => {
    const p = PLANETS.find((q) => q.name.toLowerCase() === specimen.id) ?? PLANETS[2];
    return {
      scale: 0.42 + 1.05 * (p.diameterKm / 142984),
      rate: Math.max(0.02, 24 / p.dayHours),
    };
  },
};

/* ---------------------------------------------------------------- *
 * E4.5 — Building a scale representation
 * ---------------------------------------------------------------- */

const LAY_OUT_THE_FIELD: ArchetypeSpec = {
  id: "g8e4-lay-out-the-field",
  title: "Lay the Planets Out on the Field",
  tagline: "Place all eight markers around a 1 m Sun, then read what the real spacing does to your model.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-3"] },
  learningGoals: [
    "Build a scale representation of the solar system and state its scale factor.",
    "Explain what a model has to distort in order to be usable, and say which claim it can still support.",
  ],
  misconceptions: [
    "The planets are evenly spaced",
    "A model that is not to scale is useless",
  ],
  specimens: [{
    id: "field",
    name: "A 1 m Sun on the school field, 1 to 1.39 billion",
    art: { art: "planet", color: "#ffd045", atmosphere: "#ffeaa0" },
    parts: [
      { id: "mercury", name: "Mercury: 41.6 m out", at: [0.14, 0],
        note: "0.387 AU. A 3.5 mm bead, the size of a peppercorn, 41.6 m from the Sun. Markers here are placed on a log spacing so they can be told apart; on the true spacing the first four would be a smudge." },
      { id: "venus", name: "Venus: 77.7 m out", at: [0.094, 0.209],
        note: "0.723 AU. An 8.7 mm bead. Venus and Earth are the closest pair of neighbours in the solar system — never nearer than 38 million km, which on this field is 25 m." },
      { id: "earth", name: "Earth: 107.5 m out", at: [-0.183, 0.205],
        note: "1.000 AU by definition, 149 597 870.7 km. A 9.2 mm bead just over a football pitch from the Sun, with the Moon a 2.5 mm bead 28 cm from it." },
      { id: "mars", name: "Mars: 163.8 m out", at: [-0.319, -0.103],
        note: "1.524 AU. A 4.9 mm bead. From here on the gaps stop being field-sized: the next planet is more than three times farther out again." },
      { id: "jupiter", name: "Jupiter: 559 m out", at: [-0.057, -0.507],
        note: "5.204 AU. A 103 mm ball, the size of a grapefruit, over half a kilometre away. The asteroid belt is the 200 m of empty grass you crossed to get here." },
      { id: "saturn", name: "Saturn: 1.03 km out", at: [0.514, -0.304],
        note: "9.583 AU. An 87 mm ball with 20 cm rings, a kilometre from the Sun. You can no longer see the Sun's 1 m ball from this marker without binoculars." },
      { id: "uranus", name: "Uranus: 2.06 km out", at: [0.568, 0.403],
        note: "19.191 AU. A 37 mm ball two kilometres out. Everything inside it — every planet you have placed so far — fits in the first half of the walk." },
      { id: "neptune", name: "Neptune: 3.23 km out", at: [-0.147, 0.746],
        note: "30.07 AU. A 36 mm ball, a 40-minute walk from the Sun. The nearest star on the same model is 28 900 km away, three quarters of the way round the real Earth." },
    ],
  }],
  /*
   * The Sun keeps its true size for the scale you have chosen and turns slowly
   * so it reads as a ball rather than a disc. The markers cannot be laid on
   * the true spacing without the four inner planets landing on top of one
   * another, so they run on a logarithmic spiral instead — and saying that out
   * loud is part of the work: a model has to declare what it has distorted.
   */
  drive: () => ({ rate: 0.45 }),
};

export const g8e4OneAstronomicalUnit = buildSim(ONE_ASTRONOMICAL_UNIT);
export const g8e4SizeOrDistance = buildSim(SIZE_OR_DISTANCE);
export const g8e4ShrinkTheSun = buildSim(SHRINK_THE_SUN);
export const g8e4RockOrGas = buildSim(ROCK_OR_GAS);
export const g8e4LayOutTheField = buildSim(LAY_OUT_THE_FIELD);
