import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit F · Topic F2 — Forecasting from hazard data.
 *
 * Five simulations, one per subtopic:
 *
 *   F2.1  g7f2-ten-times-rarer     frequency and location of past events (investigate)
 *   F2.2  g7f2-the-hundred-year    probability, not certainty            (investigate)
 *   F2.3  g7f2-which-zone          reading a hazard map                  (sort)
 *   F2.4  g7f2-beat-the-s-wave     early warning systems                 (trace)
 *   F2.5  g7f2-data-to-decision    data into forecast into mitigation    (process)
 *
 * The two investigations are the mathematics of forecasting. Gutenberg and
 * Richter give the frequency of each size of earthquake; the binomial gives
 * the chance of a flood over a lifetime. Both say the same uncomfortable
 * thing: rare is not the same as never, and a quiet century is not a promise.
 */

/* ---------------------------------------------------------------- *
 * F2.1 — Frequency and location of past events
 * ---------------------------------------------------------------- */

const TEN_TIMES_RARER: ArchetypeSpec = {
  id: "g7f2-ten-times-rarer",
  title: "Ten Times Rarer, Every Step Up",
  tagline: "Count the world's earthquakes by size and the pattern is a straight line.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"], ccssMath: ["8.F.B.4"] },
  learningGoals: [
    "Use the Gutenberg-Richter relation to predict how often an earthquake of a given size happens.",
    "Explain why past events are the only honest basis for a forecast.",
  ],
  misconceptions: [
    "Big earthquakes are due on a timetable",
    "Small earthquakes release enough energy to prevent a big one",
  ],
  specimens: [
    { id: "patch", name: "The patch of fault that has to break, drawn to scale",
      art: { art: "sphere", color: "#e0a04a", radius: 0.44, glow: 0.35 } },
  ],
  variables: [
    { key: "magnitude", label: "Magnitude of interest", min: 4, max: 9, step: 0.1, default: 7 },
    { key: "bValue", label: "b-value of the region", min: 0.7, max: 1.3, step: 0.05, default: 1 },
  ],
  /*
   * Gutenberg and Richter (1944): log10 N = a - b M, where N counts events of
   * at least magnitude M. The line is pinned to the USGS long-term worldwide
   * averages, which are about 150 earthquakes of M6 or larger every year, 15
   * of M7, and one to two of M8. A b-value of 1 reproduces exactly that ten-
   * fold drop per magnitude step; a lower b means relatively more large events.
   *
   * Energy is 10^(1.5M + 4.8) joules, so one magnitude step is 31.6 times the
   * energy and it takes 1 000 M5s to match a single M7. Waiting times use the
   * Poisson model, which assumes events arrive independently: the chance of at
   * least one in t years is 1 - exp(-N t).
   */
  measure: (v) => {
    const perYear = 150 * Math.pow(10, -v.bValue * (v.magnitude - 6));
    // Circular crack model with a 3 MPa stress drop: the moment is exactly
    // 10^(1.5M + 9.1) N m and the rupture radius is (7 M0 / 16 dsigma)^(1/3),
    // so a magnitude 6 patch is 5.7 km across and a magnitude 8 is 57 km.
    const momentNm = Math.pow(10, 1.5 * v.magnitude + 9.1);
    return {
      eventsPerYear: perYear,
      log10EventsPerYear: Math.log10(perYear),
      yearsBetweenEvents: 1 / perYear,
      chanceIn30YearsPercent: 100 * (1 - Math.exp(-perYear * 30)),
      energyPerEventJ: Math.pow(10, 1.5 * v.magnitude + 4.8),
      equivalentM5sPerEvent: Math.pow(10, 1.5 * (v.magnitude - 5)),
      ruptureRadiusKm: Math.cbrt((7 * momentNm) / (16 * 3.0e6)) / 1000,
    };
  },
  plot: {
    x: "magnitude", y: "log10EventsPerYear",
    xLabel: "Magnitude", yLabel: "log10 of events per year worldwide",
  },
  /*
   * The patch on the bench is the fault area that has to break, and it is drawn
   * at its real relative size: radius, not energy, so a magnitude 7 patch is
   * about three times the width of a magnitude 6 and not thirty. It is clamped
   * at both ends so a magnitude 9 still fits on the bench, and it brightens as
   * the released energy climbs.
   */
  drive: ({ f }) => {
    const km = f.ruptureRadiusKm;
    return {
      scale: Math.max(0.3, Math.min(2.6, km / 9)),
      color: km > 40 ? "#c23b2e" : km > 10 ? "#e07536" : "#e8c65c",
      glow: Math.min(1, km / 30),
    };
  },
};

/* ---------------------------------------------------------------- *
 * F2.2 — Probability, not certainty
 * ---------------------------------------------------------------- */

const THE_HUNDRED_YEAR: ArchetypeSpec = {
  id: "g7f2-the-hundred-year",
  title: "The Hundred-Year Flood",
  tagline: "It is not one flood per century. Over a 30-year mortgage the odds are one in four.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"], ccssMath: ["7.SP.C.7"] },
  learningGoals: [
    "Convert a flood return period into an annual chance and into a chance over many years.",
    "Explain why two hundred-year floods can happen in consecutive years.",
  ],
  misconceptions: [
    "A hundred-year flood happens once every hundred years",
    "Once this year's flood has passed, next year is safe",
  ],
  specimens: [
    { id: "gauge", name: "The river gauge, read every day since 1904",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#2f86c4" } },
  ],
  variables: [
    { key: "returnPeriod", label: "Return period of the flood (years)", min: 2, max: 500, step: 1, default: 100 },
    { key: "years", label: "Years you live there", min: 1, max: 100, step: 1, default: 30 },
  ],
  /*
   * A return period T is a name for an annual exceedance probability of 1/T,
   * fitted to the gauge record. Years are treated as independent trials, so
   * the chance of at least one exceedance in n years is 1 - (1 - 1/T)^n and
   * the expected number is n/T. A 100-year flood over a 30-year mortgage comes
   * out at 26.0 per cent, and over a 70-year lifetime at 50.5 per cent, which
   * is why the label misleads so many people.
   */
  measure: (v) => {
    const p = 1 / v.returnPeriod;
    const none = Math.pow(1 - p, v.years);
    return {
      annualChancePercent: 100 * p,
      chanceOverWindowPercent: 100 * (1 - none),
      chanceOfNonePercent: 100 * none,
      expectedFloods: v.years * p,
      chanceOfTwoOrMorePercent: 100 * (1 - none - v.years * p * Math.pow(1 - p, v.years - 1)),
      yearsForEvenOdds: Math.log(0.5) / Math.log(1 - p),
    };
  },
  plot: {
    x: "years", y: "chanceOverWindowPercent",
    xLabel: "Years you live there", yLabel: "Chance of at least one flood (%)",
  },
  /*
   * The gauge fills with the risk being taken, not with today's river: the
   * water level is the chance of at least one exceedance over the whole stay.
   * It runs blue while that stays under a quarter, ambers past the 26 per cent
   * that a hundred-year flood carries over a thirty-year mortgage, and turns
   * red past even odds. Silt settles out once the chance passes a half, and the
   * bubbles count the floods expected rather than merely possible.
   */
  drive: ({ f }) => {
    const risk = f.chanceOverWindowPercent / 100;
    return {
      level: 0.08 + 0.84 * risk,
      color: risk >= 0.5 ? "#c0392b" : risk >= 0.26 ? "#d98a2b" : "#2f86c4",
      bubbles: Math.min(1, f.expectedFloods / 3),
      precipitate: risk >= 0.5 ? Math.min(0.55, (risk - 0.5) * 1.1) : 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * F2.3 — Reading a hazard map
 * ---------------------------------------------------------------- */

const WHICH_ZONE: ArchetypeSpec = {
  id: "g7f2-which-zone",
  title: "Which Zone Is This Address In?",
  tagline: "Six building sites, one magnitude 6.7 nearby. The ground under you decides the rest.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Read a seismic hazard map using distance to the fault and the ground the site sits on.",
    "Explain why soft, wet ground can shake harder than rock nearer the fault.",
  ],
  misconceptions: [
    "Only the distance to the fault matters",
    "Solid-looking ground is always safe ground",
  ],
  categories: [
    { id: "high", name: "Highest hazard", hint: "close in, or soft and wet" },
    { id: "mid", name: "Moderate hazard", hint: "some distance, firm ground" },
    { id: "low", name: "Lowest hazard", hint: "far from any active fault" },
  ],
  specimens: [
    {
      id: "baymud", name: "Hydraulic fill over bay mud, 400 m from the Hayward fault", category: "high",
      because:
        "Joyner-Boore puts 0.58 g on rock at that distance, and soft bay mud amplifies the long "
        + "shaking two to three times more. The Marina District was 100 km from Loma Prieta and "
        + "still suffered intensity IX, because it is built on fill.",
      art: { art: "glassware", which: "testTube", level: 0.72, color: "#6b6250" },
    },
    {
      id: "sand", name: "Loose saturated sand, water table 2 m down, 15 km out", category: "high",
      because:
        "0.24 g here, which is well past the 0.1 g that starts liquefaction in loose wet sand. The "
        + "grains float apart, the ground behaves like a liquid for a minute, and buildings tilt.",
      art: { art: "glassware", which: "testTube", level: 0.62, color: "#b8a878" },
    },
    {
      id: "granite30", name: "Granite hillside, 30 km from the fault", category: "mid",
      because:
        "0.12 g, an intensity of about VI: dishes break and plaster cracks. Rock does not amplify, "
        + "so what arrives is what the attenuation curve says and nothing more.",
      art: { art: "landform", which: "igneous" },
    },
    {
      id: "alluvium", name: "Firm alluvium on a flat valley floor, 45 km out", category: "mid",
      because:
        "0.075 g, close to intensity V: felt by nearly everyone, little damage to sound buildings. "
        + "Firm alluvium adds some amplification but nothing like saturated fill.",
      art: { art: "landform", which: "sedimentary" },
    },
    {
      id: "bedrock", name: "Bedrock ridge, 130 km from the nearest active fault", category: "low",
      because:
        "0.016 g, intensity around III. Hanging lamps swing and people upstairs notice, which is why "
        + "distance is the cheapest mitigation there is.",
      art: { art: "landform", which: "terrain" },
    },
    {
      id: "plain", name: "Stiff clay plain, 180 km from the nearest active fault", category: "low",
      because:
        "0.0086 g. Most people feel nothing at all. The hazard map still shades it, because a "
        + "magnitude 8 changes the sum and hazard maps are drawn for the largest credible event.",
      art: { art: "landform", which: "strata" },
    },
  ],
  /*
   * Every core shakes by the amount the attenuation relation gives for its own
   * distance, with the bay mud carrying the two-and-a-half-fold soft-soil
   * amplification on top. The saturated sand does something the others do not:
   * it fizzes and settles, because at 0.24 g the grains float apart and the
   * ground behaves like a liquid.
   */
  drive: ({ t, index }) => {
    // 0.58 g at 400 m amplified 2.5 times, then 0.24, 0.12, 0.075, 0.016, 0.0086.
    const shaking = [1.46, 0.24, 0.12, 0.098, 0.016, 0.0086][index] ?? 0.05;
    const amp = Math.min(0.15, shaking * 0.12);
    const liquefies = index === 1;
    return {
      offset: [
        Math.sin(t * 11.2) * amp,
        (liquefies ? 0.05 : 0) + Math.sin(t * 15.1) * amp * 0.35,
      ],
      ...(liquefies ? { bubbles: 0.85, level: 0.5 } : {}),
    };
  },
};

/* ---------------------------------------------------------------- *
 * F2.4 — Early warning systems
 * ---------------------------------------------------------------- */

const BEAT_THE_S_WAVE: ArchetypeSpec = {
  id: "g7f2-beat-the-s-wave",
  title: "Beat the S Wave",
  tagline: "Electricity travels faster than rock. That gap is the whole trick behind ShakeAlert.",
  kind: "trace",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Explain how an early warning system buys seconds by outrunning the damaging waves.",
    "Calculate warning time from wave speed and distance, including where there is none.",
  ],
  misconceptions: [
    "An early warning system predicts earthquakes before they happen",
    "Everyone gets the same amount of warning",
  ],
  specimens: [
    { id: "alarm", name: "The alert, arriving at the speed of light",
      art: { art: "apparatus", which: "bulb" } },
  ],
  stages: [
    { name: "Rupture", at: 0, caption: "The fault starts to tear. Nothing above ground knows yet." },
    { name: "Detected", at: 0.25, caption: "P waves run at 6.1 km/s; four stations have reported by 7 s." },
    { name: "Alert sent", at: 0.5, caption: "At about 9 s a message goes out at the speed of light." },
    { name: "Seconds bought", at: 0.75, caption: "At 100 km the S wave is still 20 s away. Trains brake." },
    { name: "Shaking", at: 1, caption: "S waves land at 28.6 s. Inside 30 km there was no time at all." },
  ],
  route: [
    {
      at: [0.08, 0.62], name: "The fault, t = 0 s",
      note: "ShakeAlert does not predict anything. It waits for an earthquake that has already "
        + "started and then races the waves to the places they have not reached yet.",
    },
    {
      at: [0.24, 0.34], name: "Nearest station, t = 3.3 s",
      note: "P waves travel at about 6.1 km/s and are the small, fast, harmless arrival. A station "
        + "20 km from the rupture sees them 3.3 seconds in.",
    },
    {
      at: [0.4, 0.6], name: "Four stations agree, t = 6.6 s",
      note: "One station could be a passing lorry, so the algorithm waits for four. That costs "
        + "seconds and buys the system the right to be believed.",
    },
    {
      at: [0.56, 0.3], name: "The alert leaves, t = 9 s",
      note: "Location, magnitude and expected shaking are estimated and broadcast. From here the "
        + "message runs on fibre and radio at 300 000 km/s, which rock cannot match.",
    },
    {
      at: [0.73, 0.56], name: "The blind zone, radius 30 km",
      note: "S waves at 3.5 km/s have already covered 31 km by 9 seconds. Everyone inside that "
        + "circle is shaking before the alert exists, and they are the ones shaken hardest.",
    },
    {
      at: [0.9, 0.3], name: "A school 100 km away, t = 28.6 s",
      note: "S waves need 28.6 seconds to cover 100 km, so the alert wins by about 20 seconds: "
        + "enough to stop a train, open a fire station door, and get under a desk.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F2.5 — Using data to forecast and inform mitigation
 * ---------------------------------------------------------------- */

const DATA_TO_DECISION: ArchetypeSpec = {
  id: "g7f2-data-to-decision",
  title: "From Old Data to New Bolts",
  tagline: "Five steps take a shelf of earthquake records and turn it into a strengthened building.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Trace the path from a record of past events to a decision about a real building.",
    "Explain that a forecast is only useful once it changes what someone builds.",
  ],
  misconceptions: [
    "Scientists forecast hazards and that is the end of the job",
    "Building codes are written from opinion rather than from data",
  ],
  specimens: [
    { id: "frame", name: "The building the numbers end up in",
      art: { art: "apparatus", which: "stand" } },
  ],
  stages: [
    {
      name: "The record", at: 0,
      caption: "Felt reports since 1769, instruments since 1932, and trench digs going back further.",
    },
    {
      name: "The forecast", at: 0.25,
      caption: "UCERF3: a 72 per cent chance of magnitude 6.7 in the Bay Area by 2043.",
    },
    {
      name: "The map", at: 0.5,
      caption: "Odds become shaking: what a site has a 2 per cent chance of exceeding in 50 years.",
    },
    {
      name: "The code", at: 0.75,
      caption: "The map sets the design forces in ASCE 7 and the California Building Code.",
    },
    {
      name: "The bolts", at: 1,
      caption: "San Francisco ordered about 5 000 soft-storey buildings strengthened by 2020.",
    },
  ],
};

export const g7f2TenTimesRarer = buildSim(TEN_TIMES_RARER);
export const g7f2TheHundredYear = buildSim(THE_HUNDRED_YEAR);
export const g7f2WhichZone = buildSim(WHICH_ZONE);
export const g7f2BeatTheSWave = buildSim(BEAT_THE_S_WAVE);
export const g7f2DataToDecision = buildSim(DATA_TO_DECISION);
