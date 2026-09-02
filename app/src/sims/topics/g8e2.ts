import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E2 — Seasons.
 *
 * Five simulations, one per subtopic:
 *
 *   E2.1  g8e2-distance-or-tilt      axial tilt as the cause      (compare)
 *   E2.2  g8e2-angle-and-daylight    sun angle and day length     (investigate)
 *   E2.3  g8e2-north-and-south       opposite hemispheres         (compare)
 *   E2.4  g8e2-four-marks            solstices and equinoxes      (process)
 *   E2.5  g8e2-once-around           modelling the seasonal cycle (trace)
 *
 * Every reading comes out of the standard daily-insolation integral, run on
 * the real orbit: eccentricity 0.0167, obliquity 23.44 degrees, solar constant
 * 1361 W/m2. That integral is what makes the point of the whole topic
 * arithmetically undeniable — Earth is 3.4 per cent *closer* to the Sun in
 * January, and the northern hemisphere still gets three times less energy.
 */

const DEG = Math.PI / 180;

/** Earth-Sun distance in AU on a day of the year. Perihelion is 3-4 January. */
function sunDistanceAu(day: number): number {
  return 1 - 0.01671 * Math.cos((2 * Math.PI * (day - 4)) / 365.25);
}

/** The Sun's declination in degrees: +23.44 at the June solstice, day 172. */
function declinationDeg(day: number): number {
  return -23.44 * Math.cos((2 * Math.PI * (day + 10)) / 365.25);
}

/**
 * The half-day angle in radians — half the arc the Sun spends above the
 * horizon. Pi means the Sun never sets, zero means it never rises.
 */
function hourAngle(latDeg: number, decDeg: number): number {
  const lat = Math.min(89.5, Math.max(-89.5, latDeg));
  const c = -Math.tan(lat * DEG) * Math.tan(decDeg * DEG);
  return c <= -1 ? Math.PI : c >= 1 ? 0 : Math.acos(c);
}

/**
 * Energy landing on a horizontal square metre at the top of the atmosphere in
 * one whole day, in kWh. This is the textbook integral
 *   H = (86400/pi) (S/r^2) (w sin(lat) sin(dec) + cos(lat) cos(dec) sin(w))
 * and it puts 11.5 kWh on 40 degrees north at the June solstice and 3.8 kWh
 * there on 1 January, which is the entire explanation of summer and winter.
 */
function dailyInsolationKWh(latDeg: number, day: number): number {
  const decD = declinationDeg(day);
  const dec = decD * DEG;
  const phi = Math.min(89.5, Math.max(-89.5, latDeg)) * DEG;
  const w = hourAngle(latDeg, decD);
  const r = sunDistanceAu(day);
  const joules = (86400 / Math.PI) * (1361 / (r * r))
    * (w * Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.sin(w));
  return Math.max(0, joules) / 3.6e6;
}

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

/** Where the stage rail has got to, rebuilt from the clock. */
const railPhase = (t: number) => (t * 0.096) % 1;

/* ---------------------------------------------------------------- *
 * E2.1 — Axial tilt as the cause
 * ---------------------------------------------------------------- */

const DISTANCE_OR_TILT: ArchetypeSpec = {
  id: "g8e2-distance-or-tilt",
  title: "Nearest in January, Coldest in January",
  tagline: "Run from New Year to midsummer and watch which of the two explanations actually moves.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Reject distance as the cause of the seasons using Earth's own orbital data.",
    "Explain that the tilt changes both the angle of the sunlight and the length of the day.",
  ],
  misconceptions: [
    "Summer happens when Earth is closer to the Sun",
    "The Sun gets hotter in summer",
  ],
  variables: [
    {
      key: "day", label: "Day of the year, 1 January to 1 July",
      min: 1, max: 183, step: 1, default: 92,
    },
  ],
  /*
   * Both explanations, computed from the same orbit. Earth is at perihelion on
   * 3 January at 0.98329 AU and heading for aphelion on 4 July at 1.01671, so
   * the sunlight arriving above the atmosphere falls from 1408 to 1317 W/m2
   * over exactly this range — six per cent weaker in July. Meanwhile the daily
   * energy landing on a square metre at 40 degrees north climbs from 3.8 kWh
   * to 11.5, a factor of three, entirely because the tilt lifts the noon Sun
   * from 26.6 degrees to 73.4 and stretches the day from 9.2 hours to 14.8.
   */
  measure: (v) => {
    const r = sunDistanceAu(v.day);
    return {
      sunDistanceAu: r,
      sunlightAtTopWm2: 1361 / (r * r),
      sunApparentDiameterArcmin: 31.99 / r,
      declinationDeg: declinationDeg(v.day),
      dailyEnergyAt40NkWh: dailyInsolationKWh(40, v.day),
      daylightHoursAt40N: (hourAngle(40, declinationDeg(v.day)) / Math.PI) * 24,
    };
  },
  specimens: [
    {
      id: "distance", name: "If distance were the cause: the Sun on that day",
      because: "The Sun is drawn at its true apparent size, 32.5 arcminutes on 1 January and 31.5 on 1 July. That is a change of 3.4 per cent in distance and 6.5 per cent in energy — and it runs the wrong way, strongest in the northern winter.",
      art: { art: "planet", color: "#ffd45e", atmosphere: "#ffeeb0" },
    },
    {
      id: "tilt", name: "The tilt: energy landing at 40 degrees north",
      because: "Tinted by the daily energy arriving on a square metre: 3.8 kWh on 1 January, 11.5 kWh on 1 July. A factor of three, from a 23.44 degree tilt alone.",
      art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
    },
  ],
  /*
   * The left disc is drawn at exactly 1/r of its mean size, so it really does
   * swell 3.4 per cent toward January — and you can barely see it, which is
   * the point. The right disc is tinted across the full swing of the daily
   * energy at 40 degrees north and changes out of all recognition. Two honest
   * pictures of the same six months, and only one of them explains a summer.
   */
  drive: ({ f, index }) => index === 0
    ? {
        scale: 1 / f.sunDistanceAu,
        color: mix("#ffcb3e", "#ffe28a", stepped((1408 - f.sunlightAtTopWm2) / 92, 8)),
      }
    : {
        color: mix("#3d5f96", "#e6c445", stepped((f.dailyEnergyAt40NkWh - 3.8) / 7.8, 12)),
      },
};

/* ---------------------------------------------------------------- *
 * E2.2 — Angle of sunlight and day length
 * ---------------------------------------------------------------- */

const ANGLE_AND_DAYLIGHT: ArchetypeSpec = {
  id: "g8e2-angle-and-daylight",
  title: "Walk North on Midsummer Day",
  tagline: "Move the marker from the equator to the pole and watch the noon Sun sink as the day gets longer.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Calculate the noon altitude of the Sun from latitude and the Sun's declination.",
    "Explain how a longer day can make up for a lower Sun, and where it cannot.",
  ],
  misconceptions: [
    "The Sun is directly overhead at noon everywhere",
    "The poles are always the darkest place on Earth",
  ],
  specimens: [{
    id: "site", name: "A square metre of ground",
    art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
  }],
  variables: [
    { key: "latitude", label: "Latitude north", unit: "degrees", min: 0, max: 90, step: 1, default: 40 },
    { key: "day", label: "Day of the year", min: 1, max: 365, step: 1, default: 172 },
  ],
  /*
   * The noon Sun stands 90 - |latitude - declination| degrees above the
   * horizon, so on the June solstice it is 66.6 degrees up at the equator and
   * only 23.4 degrees up at the north pole. Day length comes from the sunrise
   * equation, cos(w) = -tan(lat) tan(dec): 12.0 hours at the equator, 14.8 at
   * 40 north, and 24 anywhere above the Arctic Circle at 66.56 north. The two
   * effects fight, and on this one day the long day wins: the pole collects
   * 12.6 kWh on a square metre against the equator's 9.2.
   */
  measure: (v) => {
    const dec = declinationDeg(v.day);
    const altitude = 90 - Math.abs(v.latitude - dec);
    const w = hourAngle(v.latitude, dec);
    return {
      noonSunAltitudeDeg: altitude,
      daylightHours: (w / Math.PI) * 24,
      dailyEnergyKWh: dailyInsolationKWh(v.latitude, v.day),
      noonShadowOfAMetreStick: altitude > 0.5 ? 1 / Math.tan(altitude * DEG) : 100,
      midnightSun: w >= Math.PI - 1e-9 ? 1 : 0,
    };
  },
  plot: {
    x: "latitude", y: "daylightHours",
    xLabel: "Latitude north (degrees)", yLabel: "Hours of daylight",
  },
  /*
   * The patch of ground climbs the stage as you go north, and takes the colour
   * of the noon Sun's altitude: gold where the Sun stands 67 degrees up over
   * the equator, cold blue where it crawls round at 23 degrees over the pole.
   * The graph beside it shows the other half of the bargain — that same pole
   * never sets at all.
   */
  drive: ({ v, f }) => ({
    offset: [0, 0.32 - (v.latitude / 90) * 0.86],
    color: mix("#6d86b5", "#e8c94a", stepped(f.noonSunAltitudeDeg / 90, 12)),
    rate: 0.6,
  }),
};

/* ---------------------------------------------------------------- *
 * E2.3 — Why the hemispheres are opposite
 * ---------------------------------------------------------------- */

const NORTH_AND_SOUTH: ArchetypeSpec = {
  id: "g8e2-north-and-south",
  title: "Madrid and Wellington, Half a Year Apart",
  tagline: "One slider, two towns at the same latitude in opposite hemispheres. They never agree.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Explain why the hemisphere tipped toward the Sun has summer while the other has winter.",
    "Use daily-energy data from two hemispheres to argue that the tilt, not the distance, is the cause.",
  ],
  misconceptions: [
    "It is summer everywhere at the same time",
    "The southern hemisphere is colder because it is at the bottom",
  ],
  variables: [
    {
      key: "sinceSolstice", label: "Days after the June solstice",
      min: 0, max: 182, step: 1, default: 0,
    },
  ],
  /*
   * The same integral run at +40 and -40 degrees on the same day. Six months
   * apart, the two swap: 11.5 kWh at 40 north on the June solstice against
   * 3.5 kWh at 40 south, then 3.7 against 12.4 in December. Note the southern
   * summer is the stronger of the two — 12.4 kWh against 11.5 — because the
   * southern summer falls near perihelion. Same tilt, same latitude, and a
   * seven per cent difference that comes from the shape of the orbit.
   */
  measure: (v) => {
    const day = 172 + v.sinceSolstice;
    const dec = declinationDeg(day);
    return {
      dayOfYear: day,
      declinationDeg: dec,
      northEnergyKWh: dailyInsolationKWh(40, day),
      southEnergyKWh: dailyInsolationKWh(-40, day),
      northDaylightHours: (hourAngle(40, dec) / Math.PI) * 24,
      southDaylightHours: (hourAngle(-40, dec) / Math.PI) * 24,
      sunDistanceAu: sunDistanceAu(day),
    };
  },
  specimens: [
    {
      id: "north", name: "Madrid, 40 degrees north",
      because: "June solstice: 11.5 kWh on a square metre and 14.8 hours of daylight. By the December solstice it is down to 3.7 kWh and 9.2 hours.",
      art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
    },
    {
      id: "south", name: "Wellington, 41 degrees south",
      because: "The same June day gives it 3.5 kWh and 9.2 hours of daylight. In December it takes 12.4 kWh — more than Madrid's best, because the southern summer falls near perihelion.",
      art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
    },
  ],
  /*
   * Each globe is tinted by its own town's daily energy over the same 3.5 to
   * 12.4 kWh scale, so the two colours can be read against each other
   * directly. Drag the slider and they trade places: whatever one is doing,
   * the other is doing the opposite, on the same day, under the same Sun.
   */
  drive: ({ f, index }) => ({
    color: mix("#3d5f96", "#e6c445",
      stepped(((index === 0 ? f.northEnergyKWh : f.southEnergyKWh) - 3.4) / 9.0, 12)),
  }),
};

/* ---------------------------------------------------------------- *
 * E2.4 — Solstices and equinoxes
 * ---------------------------------------------------------------- */

const FOUR_MARKS: ArchetypeSpec = {
  id: "g8e2-four-marks",
  title: "Four Marks on the Year",
  tagline: "The two days the Sun stands still and the two days it crosses the line.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Define solstice and equinox by the Sun's declination rather than by the weather.",
    "Explain why the four seasons are not the same length.",
  ],
  misconceptions: [
    "The equinox is the day the Sun is closest to Earth",
    "Each season is exactly a quarter of the year",
  ],
  specimens: [{
    id: "earth", name: "Earth on its 23.44 degree tilt",
    art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
  }],
  stages: [
    { name: "March equinox", at: 0,
      caption: "About 20 March. Declination 0: the Sun is overhead at the equator and every place on Earth gets close to 12 hours of daylight." },
    { name: "June solstice", at: 0.25,
      caption: "About 21 June. Declination +23.44, its highest: the Sun is overhead at the Tropic of Cancer and stops climbing. Northern midsummer, 14.8 hours of daylight at 40 north." },
    { name: "September equinox", at: 0.5,
      caption: "About 22 September. Declination back to 0. Twelve hours of daylight again, and the Sun rises due east everywhere on Earth." },
    { name: "December solstice", at: 0.75,
      caption: "About 21 December. Declination -23.44: overhead at the Tropic of Capricorn, 9.2 hours of daylight at 40 north, and the north pole in continuous night." },
    { name: "Unequal quarters", at: 1,
      caption: "Spring 92.8 days, summer 93.6, autumn 89.8, winter 89.0. Earth moves fastest near perihelion in January, so northern winter is the shortest season by five days." },
  ],
  /*
   * The globe runs the same year the rail is showing, starting at the March
   * equinox on day 79. Its colour is the daily energy at 40 degrees north, so
   * it warms to gold through June and cools to deep blue through December, and
   * it swings a little across the stage as it goes round the orbit — closest
   * to the Sun in January, at the point on the rail where the northern
   * hemisphere is coldest.
   */
  drive: ({ t }) => {
    const day = 79 + railPhase(t) * 365.25;
    const angle = (2 * Math.PI * (day - 4)) / 365.25;
    return {
      offset: [Math.cos(angle) * 0.5, -Math.sin(angle) * 0.26],
      color: mix("#3d5f96", "#e6c445", stepped((dailyInsolationKWh(40, day) - 3.7) / 7.9, 12)),
      rate: 0.7,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E2.5 — Modelling the seasonal cycle
 * ---------------------------------------------------------------- */

const ONCE_AROUND: ArchetypeSpec = {
  id: "g8e2-once-around",
  title: "Once Around in 365.256 Days",
  tagline: "Ride the whole orbit and stop at the six places that decide the year.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Model a whole year as one circuit of the orbit with the axis pointing the same way throughout.",
    "Locate the solstices, equinoxes, perihelion and aphelion on that circuit.",
  ],
  misconceptions: [
    "Earth's axis swings to and fro through the year",
    "Earth's orbit is a long thin ellipse",
  ],
  specimens: [{
    id: "earth", name: "Earth, axis fixed on Polaris",
    art: { art: "planet", color: "#4a6fa5", atmosphere: "#a8d0ff" },
  }],
  stages: [
    { name: "January", at: 0, caption: "Perihelion, 147.1 million km. Nearest the Sun, and the northern hemisphere's coldest month." },
    { name: "March", at: 0.25, caption: "Equinox. The tilt points sideways to the Sun and both hemispheres get the same share." },
    { name: "July", at: 0.5, caption: "Aphelion, 152.1 million km. Farthest from the Sun, and the northern hemisphere's hottest month." },
    { name: "September", at: 0.75, caption: "Equinox again, the tilt sideways once more, and the year's energy back in balance." },
    { name: "December", at: 1, caption: "Solstice. The north tips 23.44 degrees away and the whole cycle starts again." },
  ],
  route: [
    { at: [0.16, 0.5], name: "Perihelion, 3 January",
      note: "147.10 million km from the Sun and moving fastest, 30.29 km/s. The northern hemisphere is in deep winter while Earth is at its closest — the plainest evidence that distance is not the cause." },
    { at: [0.3, 0.24], name: "March equinox, about 20 March",
      note: "Declination 0. The terminator runs pole to pole, day equals night to within a few minutes everywhere, and the Sun rises due east from every point on Earth." },
    { at: [0.52, 0.18], name: "June solstice, about 21 June",
      note: "Declination +23.44 degrees. The Sun is overhead at the Tropic of Cancer, 40 north takes 11.5 kWh on a square metre, and the Arctic has 24-hour daylight." },
    { at: [0.74, 0.28], name: "Aphelion, 4 July",
      note: "152.10 million km and moving slowest, 29.29 km/s. Sunlight arrives 6.5 per cent weaker than in January — in the middle of the northern summer." },
    { at: [0.82, 0.58], name: "September equinox, about 22 September",
      note: "Declination back to 0, and the northern hemisphere is losing about 3 minutes of daylight a day at 40 north. The southern spring begins." },
    { at: [0.5, 0.76], name: "December solstice, about 21 December",
      note: "Declination -23.44 degrees. Overhead at the Tropic of Capricorn, 12.4 kWh on a square metre at 40 south, and the north pole in continuous night. One year: 365.256 days." },
  ],
  /*
   * The globe travels the real orbit while the marker travels the route, and
   * it is tinted by the daily energy reaching 40 degrees north. Watch the
   * colour and the position together: the deepest blue arrives at the point on
   * the orbit where Earth is *nearest* the Sun.
   */
  drive: ({ t }) => {
    const day = 3 + railPhase(t) * 365.25;
    const angle = (2 * Math.PI * (day - 4)) / 365.25;
    return {
      offset: [Math.cos(angle) * 0.55, -Math.sin(angle) * 0.3],
      color: mix("#3d5f96", "#e6c445", stepped((dailyInsolationKWh(40, day) - 3.7) / 7.9, 12)),
      rate: 0.8,
    };
  },
};

export const g8e2DistanceOrTilt = buildSim(DISTANCE_OR_TILT);
export const g8e2AngleAndDaylight = buildSim(ANGLE_AND_DAYLIGHT);
export const g8e2NorthAndSouth = buildSim(NORTH_AND_SOUTH);
export const g8e2FourMarks = buildSim(FOUR_MARKS);
export const g8e2OnceAround = buildSim(ONCE_AROUND);
