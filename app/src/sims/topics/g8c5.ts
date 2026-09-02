import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit C · Topic C5 — Fields and action at a distance.
 *
 * Five simulations, one per subtopic:
 *
 *   C5.1  g8c5-how-far-it-reaches   a field filling space         (investigate)
 *   C5.2  g8c5-reading-the-map      mapping a field               (explore)
 *   C5.3  g8c5-eighty-nine-percent  evidence of a field           (investigate)
 *   C5.4  g8c5-eight-minutes        energy across empty space     (trace)
 *   C5.5  g8c5-two-fields-one-law   fields as the unifying idea   (compare)
 *
 * The unit ends by putting the electric and the gravitational field side by
 * side on the same slider. Both fall as one over r squared, both are properties
 * of the space rather than of the object, and the only thing that differs is
 * the constant in front: 8.99e9 against 6.674e-11, a ratio of 1.3e20 that is
 * why one of them holds atoms together and the other holds galaxies together.
 */

/** Coulomb's constant, N m2 / C2. */
const K_E = 8.99e9;
/** Newton's gravitational constant, N m2 / kg2. */
const BIG_G = 6.674e-11;
/** G x Earth's mass, m3 / s2. */
const GM_EARTH = 3.986e14;
/** Earth's mean radius, km. */
const R_EARTH_KM = 6371;
/** Dielectric strength of dry air at sea level, V/m. */
const AIR_BREAKDOWN = 3.0e6;
/** Radius of the van de Graaff dome, m. */
const DOME_RADIUS = 0.15;
/** Field a neon tester needs before it will strike, V/m. */
const NEON_THRESHOLD = 1.0e4;

/* ---------------------------------------------------------------- *
 * C5.1 — A field as something filling space
 * ---------------------------------------------------------------- */

const HOW_FAR_IT_REACHES: ArchetypeSpec = {
  id: "g8c5-how-far-it-reaches",
  title: "How Far Does It Reach?",
  tagline: "Charge the dome and the room around it changes. Find the edge of the part that has.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-5"] },
  learningGoals: [
    "Describe an electric field as a property of the space around a charged object.",
    "Show that the field has a value at every point and never stops abruptly.",
  ],
  misconceptions: [
    "A field ends at a definite edge",
    "The field only exists when something is there to feel it",
  ],
  specimens: [
    { id: "reach", name: "The space a neon tester still lights in",
      art: { art: "sphere", color: "#7fa8d8", radius: 0.48 } },
  ],
  variables: [
    { key: "charge", label: "Charge on the dome (microcoulombs)", min: 0.5, max: 12, step: 0.1, default: 4 },
    { key: "distance", label: "Where you hold the probe (cm from centre)", min: 15, max: 120, step: 1, default: 40 },
  ],
  /*
   * Outside a charged sphere the field is the same as a point charge's:
   * E = k Q / r squared. 4.0 microcoulombs read at 40 cm gives
   * 8.99e9 x 4.0e-6 / 0.16 = 2.25e5 V/m, or 225 kV/m. A small neon tester
   * strikes at about 10 kV/m, so it still lights out to root(kQ / 1e4) = 1.9 m
   * — the dome has changed the whole end of the room. On the 15 cm dome itself
   * the field is 1.60 MV/m, and once it passes air's 3.0 MV/m the charge simply
   * leaks away in sparks: a 15 cm dome cannot hold more than 7.5 microcoulombs.
   */
  measure: (v) => {
    const q = v.charge * 1e-6;
    const r = Math.max(0.05, v.distance / 100);
    const surface = (K_E * q) / (DOME_RADIUS * DOME_RADIUS);
    return {
      fieldKvPerM: (K_E * q) / (r * r) / 1000,
      surfaceFieldMvPerM: surface / 1e6,
      reachMetres: Math.sqrt((K_E * q) / NEON_THRESHOLD),
      airBreaksDown: surface >= AIR_BREAKDOWN ? 1 : 0,
    };
  },
  plot: {
    x: "distance", y: "fieldKvPerM",
    xLabel: "Where you hold the probe (cm from centre)", yLabel: "Field strength (kV/m)",
  },
  /*
   * The drawn sphere is not the dome — it is the volume of air the dome has
   * changed enough to light a tester in, and its radius is exactly the
   * root(kQ / 1e4) the measurement returns. So it swells from 0.7 m across at
   * half a microcoulomb to 3.3 m at twelve. Past 7.5 microcoulombs the surface
   * field passes air's breakdown value and the whole region flashes over:
   * that is the dome losing its charge to the room, and it stops the sim
   * pretending a dome can hold any amount you like.
   */
  drive: ({ f }) => {
    const arcing = f.airBreaksDown > 0.5;
    return {
      scale: 0.3 + Math.min(1, f.reachMetres / 3.3) * 0.85,
      color: arcing ? "#ffe9a8" : "#7fa8d8",
      glow: arcing ? 1 : 0.25,
      rate: arcing ? 2.6 : 0.8,
      offset: [0, 0.1],
    };
  },
};

/* ---------------------------------------------------------------- *
 * C5.2 — Mapping a field
 * ---------------------------------------------------------------- */

const READING_THE_MAP: ArchetypeSpec = {
  id: "g8c5-reading-the-map",
  title: "Reading the Map",
  tagline: "Iron filings draw the field for free. Learn what the picture is actually telling you.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-5"] },
  learningGoals: [
    "Interpret field-line spacing as field strength and direction.",
    "Explain why field lines can never cross one another.",
  ],
  misconceptions: [
    "Field lines are real threads that exist in the air",
    "A field only exists where a line has been drawn",
  ],
  specimens: [
    {
      id: "map",
      name: "Bar magnet under a sheet of iron filings",
      art: { art: "apparatus", which: "magnet" },
      parts: [
        {
          id: "dense", name: "Crowded lines mean a strong field", at: [0.44, -0.28],
          note: "At the pole the filings jam together: about 1.6 mT for a 1 A m2 bar at 5 cm. Spacing is the map's way of printing a number.",
        },
        {
          id: "sparse", name: "Spread out means weak", at: [-0.06, -0.46],
          note: "Out at the side the same lines are far apart, and the field there is a fraction of a millitesla. The lines have not run out, only thinned.",
        },
        {
          id: "direction", name: "Every line has an arrow", at: [0.42, 0.16],
          note: "Out of the north pole, round, and into the south. A compass dropped anywhere on the sheet lies along the line and points the way it goes.",
        },
        {
          id: "nocross", name: "Lines never cross", at: [-0.44, 0.16],
          note: "A crossing would mean the field pointed two ways at one place. It cannot, so the map never shows it happening.",
        },
        {
          id: "everywhere", name: "The gaps are not empty", at: [0.0, 0.44],
          note: "Between two drawn lines the field is still there with a definite value. Lines are a way of drawing a field, not a list of the places it exists.",
        },
      ],
    },
  ],
  /*
   * A steady turn, so the map is read as a three-dimensional field around a
   * solid object rather than as a flat picture printed on a page.
   */
  drive: () => ({ tilt: 0.26, rate: 1 }),
};

/* ---------------------------------------------------------------- *
 * C5.3 — Investigating evidence of fields
 * ---------------------------------------------------------------- */

const EIGHTY_NINE_PERCENT: ArchetypeSpec = {
  id: "g8c5-eighty-nine-percent",
  title: "Weightless, With Most of the Gravity",
  tagline: "The space station floats in 89 per cent of the gravity you are standing in.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-4", "MS-PS2-5"] },
  learningGoals: [
    "Measure how a gravitational field falls with height above a planet.",
    "Explain floating in orbit as free fall rather than as the absence of gravity.",
  ],
  misconceptions: [
    "There is no gravity in orbit",
    "Gravity stops at the edge of the atmosphere",
  ],
  specimens: [
    { id: "earth", name: "The Earth, from your window",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#bcd9ff" } },
  ],
  variables: [
    { key: "altitude", label: "Altitude above the ground (km)", min: 0, max: 36000, step: 100, default: 400 },
    { key: "mass", label: "Your mass (kg)", min: 30, max: 120, step: 1, default: 60 },
  ],
  /*
   * g = GM / r squared with r measured from the centre, so altitude has to be
   * added to Earth's 6 371 km radius before anything else happens. At the
   * space station's 400 km that is 6 771 km, and 3.986e14 / 4.585e13 = 8.69
   * N/kg — 88.5 per cent of the 9.82 N/kg on the ground. An astronaut there
   * has almost all of their weight and floats anyway, because the station is
   * falling with them. Out at 36 000 km, where television satellites sit, it
   * has fallen to 0.222 N/kg: 2.3 per cent, and still not zero.
   */
  measure: (v) => {
    const r = (R_EARTH_KM + Math.max(0, v.altitude)) * 1000;
    const g = GM_EARTH / (r * r);
    return {
      fieldNewtonPerKg: g,
      percentOfGroundValue: (g / 9.8196) * 100,
      trueWeightN: v.mass * g,
    };
  },
  plot: {
    x: "altitude", y: "fieldNewtonPerKg",
    xLabel: "Altitude above the ground (km)", yLabel: "Gravitational field (N/kg)",
  },
  /*
   * What you would see out of the window. A sphere of radius R viewed from
   * r above its centre fills an angle set by R / r, so Earth's apparent width
   * is 6 371 / (6 371 + altitude): full-frame on the ground, barely narrower
   * from the space station — which is the point, since the field there is
   * still 89 per cent — and a sixth of the width from geostationary orbit.
   */
  drive: ({ v }) => ({
    scale: 1.12 * (R_EARTH_KM / (R_EARTH_KM + Math.max(0, v.altitude))),
    offset: [0, 0.12],
    tilt: 0.2,
  }),
};

/* ---------------------------------------------------------------- *
 * C5.4 — Energy transferred across empty space
 * ---------------------------------------------------------------- */

const EIGHT_MINUTES: ArchetypeSpec = {
  id: "g8c5-eight-minutes",
  title: "Eight Minutes and Nineteen Seconds",
  tagline: "Follow one square metre of sunlight from the Sun's surface to a socket in your wall.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-5", "MS-PS3-5"] },
  learningGoals: [
    "Explain that energy can be transferred through a vacuum by a field.",
    "Follow a measured quantity of energy through a chain of transfers.",
  ],
  misconceptions: [
    "Energy needs a material to travel through",
    "Space is cold, so nothing can carry energy across it",
  ],
  stages: [
    { name: "Leaves the Sun", at: 0, caption: "63 MW from every square metre of the Sun's surface." },
    { name: "Crosses nothing", at: 0.25, caption: "150 million km of vacuum, at 3.00e8 m/s, in 499 seconds." },
    { name: "Arrives", at: 0.5, caption: "1 361 W on each square metre above the atmosphere." },
    { name: "Gets through", at: 0.75, caption: "About 1 000 W reaches the ground on a clear noon." },
    { name: "Becomes useful", at: 1, caption: "A 22 per cent panel turns that into roughly 220 W." },
  ],
  route: [
    {
      at: [0.09, 0.32], name: "The Sun's surface",
      note: "5 772 K, radiating 63 MW from every square metre. Nothing is touching it and it loses 3.8e26 W anyway.",
    },
    {
      at: [0.26, 0.56], name: "Ninety-three million miles of nothing",
      note: "1.496e11 m of vacuum. No air, no wire, no rope. The electric and magnetic fields carry the energy across on their own at 3.00e8 m/s.",
    },
    {
      at: [0.43, 0.3], name: "499 seconds later",
      note: "1.496e11 divided by 3.00e8 is 499 s: eight minutes and nineteen seconds. The sunlight on your hand left the Sun before your last lesson change.",
    },
    {
      at: [0.58, 0.56], name: "Top of the atmosphere",
      note: "1 361 W per square metre, the solar constant. Spread over the whole planet's cross-section that is 1.7e17 W arriving continuously.",
    },
    {
      at: [0.73, 0.3], name: "Through the air",
      note: "Ozone takes the ultraviolet, water vapour takes bands of infrared, and about 1 000 W per square metre survives to a clear noon at sea level.",
    },
    {
      at: [0.86, 0.55], name: "Into the panel and the wire",
      note: "A silicon cell at 22 per cent gives about 220 W per square metre. From there it is ordinary electricity, in wires, in contact, all the way to the socket.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C5.5 — Fields as the unifying idea
 * ---------------------------------------------------------------- */

const TWO_FIELDS_ONE_LAW: ArchetypeSpec = {
  id: "g8c5-two-fields-one-law",
  title: "Two Fields, One Law",
  tagline: "Two kilogram masses and two microcoulomb charges, moved apart together. Same curve, different constant.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-4", "MS-PS2-5"] },
  learningGoals: [
    "Recognise the same inverse square form in the gravitational and electric laws.",
    "Explain why gravity dominates on a planetary scale despite being far weaker.",
  ],
  misconceptions: [
    "Gravity is the strongest of the forces because it holds up the sky",
    "Electric and gravitational forces work in completely different ways",
  ],
  specimens: [
    {
      id: "mass", name: "Two 1 kg lead spheres",
      because: "F = 6.674e-11 x 1 x 1 / r squared. At half a metre that is 0.27 nanonewtons, and it is always a pull. Mass comes in only one kind.",
      art: { art: "planet", color: "#8e8b84" },
    },
    {
      id: "charge", name: "Two 1 microcoulomb charges",
      because: "F = 8.99e9 x 1e-6 x 1e-6 / r squared. At the same half metre that is 36 millinewtons — a hundred and thirty million times more — and it can push or pull.",
      art: { art: "sphere", color: "#e0483f", radius: 0.44 },
    },
  ],
  variables: [
    { key: "separation", label: "Separation (m)", min: 0.1, max: 2, step: 0.05, default: 0.5 },
    { key: "charge", label: "Charge on each sphere (microcoulombs)", min: 0.2, max: 3, step: 0.1, default: 1 },
  ],
  /*
   * The two laws written the same way. Gravity: 6.674e-11 x 1.0 x 1.0 / r
   * squared, which at 0.50 m is 2.67e-10 N. Electricity: 8.99e9 x q squared /
   * r squared, which at the same distance with 1.0 microcoulomb on each is
   * 3.60e-2 N. Move both pairs to 1.0 m and both forces fall to a quarter,
   * because the shape of the law is identical. Only the constant differs, and
   * for these objects that constant makes the electric force 1.35e8 times the
   * gravitational one.
   */
  measure: (v) => {
    const r = Math.max(0.05, v.separation);
    const q = v.charge * 1e-6;
    const grav = (BIG_G * 1 * 1) / (r * r);
    const elec = (K_E * q * q) / (r * r);
    return {
      gravityNanoNewton: grav * 1e9,
      electricMilliNewton: elec * 1000,
      electricIsTimesStronger: elec / grav,
    };
  },
  plot: {
    x: "separation", y: "electricMilliNewton",
    xLabel: "Separation (m)", yLabel: "Electric force (mN)",
  },
  /*
   * Both panels answer the slider the same way, which is the whole argument of
   * the topic: the pair is drawn where the separation says, and each sphere
   * recedes a little as it goes because that is what distance looks like. The
   * two readings beside them fall by exactly the same factor of four from
   * 0.5 m to 1.0 m, however different their sizes are.
   */
  drive: ({ v, index }) => {
    const away = (Math.max(0.1, v.separation) - 0.1) / 1.9;
    return {
      scale: (0.98 - away * 0.36) * (index === 0 ? 1 : 0.94),
      offset: [-0.26 + away * 0.5, 0.06],
      tilt: 0.24,
    };
  },
};

export const g8c5HowFarItReaches = buildSim(HOW_FAR_IT_REACHES);
export const g8c5ReadingTheMap = buildSim(READING_THE_MAP);
export const g8c5EightyNinePercent = buildSim(EIGHTY_NINE_PERCENT);
export const g8c5EightMinutes = buildSim(EIGHT_MINUTES);
export const g8c5TwoFieldsOneLaw = buildSim(TWO_FIELDS_ONE_LAW);
