import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F4 — Correlation, causation and reading evidence.
 *
 * Five simulations, one per subtopic:
 *
 *   F4.1  g6f4-two-things-together   correlation versus causation        (sort)
 *   F4.2  g6f4-where-you-start       reading a graph critically          (compare)
 *   F4.3  g6f4-which-came-first      applying this to climate data       (process)
 *   F4.4  g6f4-six-fingerprints      many lines of evidence              (explore)
 *   F4.5  g6f4-too-much-too-little   overstated and understated claims   (sort)
 *
 * F4.3 is the one that matters most. The ice-core CO2 lag is the single most
 * quoted piece of climate evidence used to argue the opposite of what it
 * shows, and a student who has walked through the deglaciation in order can
 * see exactly why "CO2 came second" and "CO2 warms the planet" are both true.
 */

/* ---------------------------------------------------------------- *
 * F4.1 — Correlation versus causation
 * ---------------------------------------------------------------- */

const TWO_THINGS_TOGETHER: ArchetypeSpec = {
  id: "g6f4-two-things-together",
  title: "Two Things Moving Together",
  tagline: "Six pairs that rise and fall in step. Only two of them are cause and effect.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"], ccssMath: ["8.SP.A.1", "8.SP.A.2"] },
  learningGoals: [
    "Distinguish correlation from causation and name a hidden third variable.",
    "Explain what extra evidence turns a correlation into a causal claim: a mechanism, a dose response, and a test.",
  ],
  misconceptions: [
    "If two things rise together, one must be causing the other",
    "A correlation is worthless evidence",
  ],
  categories: [
    { id: "causes", name: "One really causes the other", hint: "there is a mechanism you can test on its own" },
    { id: "third", name: "Something else causes both", hint: "look for a hidden variable behind them" },
    { id: "chance", name: "Coincidence", hint: "no mechanism, and it falls apart on new data" },
  ],
  specimens: [
    {
      id: "icecream", name: "Ice cream sales and drownings both peak in July", category: "third",
      because: "Hot weather sends people to the ice cream shop and into the water. Ban ice cream and the drownings stay. The hidden variable is the season.",
      art: { art: "glassware", which: "beaker", level: 0.45, color: "#e8c9a0" },
    },
    {
      id: "shoes", name: "Children with bigger feet read better", category: "third",
      because: "The hidden variable is age. Compare only nine-year-olds and the correlation vanishes, which is exactly the test that exposes a third variable.",
      art: { art: "sphere", color: "#8fa6c4", radius: 0.44 },
    },
    {
      id: "co2", name: "More CO2 in the air, warmer surface", category: "causes",
      because: "The mechanism was measured in a laboratory by John Tyndall in 1859, before anyone had a temperature trend to explain. Satellites now watch the 15-micrometre radiation going missing from the top of the atmosphere as CO2 rises.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "smoking", name: "Smoking and lung cancer", category: "causes",
      because: "A known mechanism in the cell, a dose response - more cigarettes, more risk - and the risk falls again when people stop. Those three together are what make it causal, not the correlation alone.",
      art: { art: "cell" },
    },
    {
      id: "internet", name: "Internet users and global sea level, both rising since 1990", category: "chance",
      because: "Two things that happen to be climbing at the same time. There is no mechanism, and no experiment you could run on one that would move the other.",
      art: { art: "sphere", color: "#5aa6d8", radius: 0.44 },
    },
    {
      id: "margarine", name: "Margarine eaten per person and the divorce rate in Maine, 1999 to 2009", category: "chance",
      because: "The two series match almost perfectly over that decade, and then stop matching. Search enough pairs of numbers and matches like this turn up by chance alone.",
      art: { art: "sphere", color: "#e8cf6a", radius: 0.44 },
    },
  ],
};

export const g6f4TwoThingsTogether = buildSim(TWO_THINGS_TOGETHER);

/* ---------------------------------------------------------------- *
 * F4.2 — Reading a graph critically
 * ---------------------------------------------------------------- */

const WHERE_YOU_START: ArchetypeSpec = {
  id: "g6f4-where-you-start",
  title: "Where You Start the Graph",
  tagline: "The same temperature record, drawn twice. One of them looks flat.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"], ccssMath: ["8.SP.A.1"] },
  learningGoals: [
    "Explain how the choice of start year, axis range and baseline changes what a graph appears to show.",
    "Judge a trend against the size of the year-to-year wobble before believing it.",
  ],
  misconceptions: [
    "A graph cannot mislead if the numbers in it are correct",
    "Fifteen years is long enough to see a climate trend",
  ],
  variables: [
    { key: "windowYears", label: "Years in the window you are looking at", min: 5, max: 60, step: 1, default: 15 },
  ],
  /*
   * How long a window has to be before a trend means anything.
   *
   * A least-squares trend fitted to n annual values with a year-to-year
   * scatter s has a standard error of s * sqrt(12 / (n(n^2 - 1))) per year.
   * Climate noise is not independent from year to year, though: ENSO gives the
   * global mean a lag-one correlation near 0.7, which widens the error bar by
   * sqrt((1 + r)/(1 - r)) = 2.4. With s = 0.1 degrees, a 15-year window carries
   * an error bar of about 0.14 degrees per decade around a real trend of 0.19,
   * so the window cannot tell 0.05 from 0.19 and a flat-looking stretch proves
   * nothing. By 30 years the bar is down to about 0.05 and the trend is four
   * times its own uncertainty. That is why 30 years is the convention.
   */
  measure: (v) => {
    const n = v.windowYears;
    const standardErrorPerDecade =
      10 * 0.1 * Math.sqrt(12 / (n * (n * n - 1))) * 2.4;
    return {
      trueTrendPerDecade: 0.19,
      uncertaintyPerDecade: 2 * standardErrorPerDecade,
      trendOverItsUncertainty: 0.19 / (2 * standardErrorPerDecade),
      yearsInTheWindow: n,
    };
  },
  /*
   * The left-hand specimen is not the data: it is the error bar. A five-year
   * window carries an uncertainty of plus or minus 1.5 degrees per decade — a
   * grey ball far bigger than the trend inside it, which is why a short window
   * can be made to say anything. Drag the window out and it shrinks and
   * hardens, and somewhere near twenty years it becomes smaller than the trend
   * and the answer stops depending on where you started. The right-hand
   * planet is the record itself and never moves.
   */
  drive: ({ f, index }) => {
    if (index !== 0) return { color: "#c2603a" };
    const clear = f.trendOverItsUncertainty;
    return {
      scale: 0.28 + 0.9 * Math.min(1, f.uncertaintyPerDecade / 1.3),
      color: clear >= 2 ? "#c2603a" : clear >= 1 ? "#b0947e" : "#9aa8bc",
      glow: Math.min(0.8, clear / 4),
    };
  },
  specimens: [
    {
      id: "short",
      name: "1998 to 2012: about 0.05 degrees per decade",
      because: "The window opens on the strongest El Nino of the century and shuts before the next one. Start at a record spike and stop before the following spike and almost any rising series looks flat.",
      art: { art: "sphere", color: "#9aa8bc", radius: 0.44 },
    },
    {
      id: "long",
      name: "1970 to 2024: about 0.19 degrees per decade",
      because: "The same data, the whole modern record. It contains four stretches that looked flat at the time, each followed by a step up. Year-to-year wobble is about 0.1 degrees, so you need roughly 30 years before a trend of 0.2 per decade climbs clear of the noise.",
      art: { art: "planet", color: "#c2603a", atmosphere: "#f0b48a" },
    },
  ],
};

export const g6f4WhereYouStart = buildSim(WHERE_YOU_START);

/* ---------------------------------------------------------------- *
 * F4.3 — Applying this to climate data
 * ---------------------------------------------------------------- */

const WHICH_CAME_FIRST: ArchetypeSpec = {
  id: "g6f4-which-came-first",
  title: "Which Came First?",
  tagline: "At the end of an ice age, CO2 rises a few hundred years after the warming starts. Walk the sequence and see why that is not the objection it sounds like.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS2-6"] },
  learningGoals: [
    "Order the steps by which an orbital change ends an ice age.",
    "Explain how CO2 can be an effect of warming at one moment and a cause of it at the next.",
    "Contrast that sequence with today's, where the CO2 rise comes first.",
  ],
  misconceptions: [
    "The ice-core lag shows that CO2 does not cause warming",
    "A cause must always come before every part of its effect in a feedback loop",
  ],
  specimens: [
    { id: "earth", name: "Earth at the end of an ice age", art: { art: "planet", color: "#dfe9f2", atmosphere: "#cfe0ee" } },
  ],
  variables: [
    { key: "co2Ppm", label: "Carbon dioxide during the deglaciation (ppm)", min: 180, max: 300, step: 1, default: 180 },
  ],
  /*
   * Walk the deglaciation with the number that did the work. CO2 climbed from
   * the 180 ppm of the last glacial maximum to the 280 ppm of the Holocene,
   * and Myhre's formula turns that into 5.35 * ln(280/180) = 2.36 W/m2 of
   * extra heating, applied to the whole planet and kept there — which is the
   * 2.4 the caption quotes and roughly half of the deglacial warming.
   *
   * The ice went with it. Sea level stood about 125 m below today at 180 ppm
   * and was back to modern by 280, and through the termination the two ran
   * close to in step, so the ice remaining is drawn straight from the CO2.
   */
  measure: (v) => {
    const forcingWm2 = 5.35 * Math.log(v.co2Ppm / 180);
    return {
      forcingWm2,
      warmingWithNoFeedbacksC: forcingWm2 / 3.76,
      seaLevelBelowTodayM: Math.max(0, (125 * (280 - v.co2Ppm)) / 100),
      co2Ppm: v.co2Ppm,
    };
  },
  /*
   * This is the ice age ending, drawn. At 180 ppm the planet is white to the
   * mid-latitudes with 125 m of sea water locked up in ice sheets; take the
   * CO2 up through 220 and the ice pulls back off the continents; by 280 the
   * coastlines are where you would recognise them. The lag argument is about
   * which of these two started first. What the picture shows is that once the
   * CO2 was up, it was doing the melting.
   */
  drive: ({ f }) => ({
    color: f.seaLevelBelowTodayM >= 95 ? "#eef5fa"
      : f.seaLevelBelowTodayM >= 60 ? "#cfe0ee"
      : f.seaLevelBelowTodayM >= 25 ? "#8fb2ce"
      : "#2f6ea8",
  }),
  stages: [
    {
      name: "The orbit nudges", at: 0,
      caption: "Earth's tilt and the shape of its orbit shift on cycles of 23,000, 41,000 and 100,000 years. Summer sunlight at 65 degrees north swings by tens of watts per square metre. It moves sunlight around; it barely changes the global total.",
    },
    {
      name: "Northern ice retreats", at: 0.2,
      caption: "Warmer northern summers shrink the ice sheets. Bare ground and open ocean reflect far less than ice, so the region absorbs more and warms further.",
    },
    {
      name: "The Southern Ocean exhales", at: 0.4,
      caption: "Winds and ocean circulation shift and the deep Southern Ocean gives up carbon it had been holding. In Antarctic cores this CO2 rise begins a few hundred years after local temperature starts up: about 800 years, with real uncertainty.",
    },
    {
      name: "Now CO2 does the work", at: 0.6,
      caption: "CO2 climbs from 180 to 280 ppm. That is 5.35 x ln(280/180) = 2.4 watts per square metre of extra heating, worldwide and permanent, and it accounts for roughly half of the global warming of the whole deglaciation.",
    },
    {
      name: "Effect, then cause", at: 0.8,
      caption: "CO2 was an effect first and a cause second. The lag disproves the claim that CO2 started it. It says nothing at all about whether CO2 warms, which was settled in a laboratory in 1859.",
    },
    {
      name: "And today", at: 1,
      caption: "The order is reversed. CO2 rose first, from carbon whose isotopes identify it as fossil, and temperature followed. There is no orbital nudge in progress: the current orbital trend is very slightly towards cooling.",
    },
  ],
};

export const g6f4WhichCameFirst = buildSim(WHICH_CAME_FIRST);

/* ---------------------------------------------------------------- *
 * F4.4 — Evaluating a claim using multiple lines of evidence
 * ---------------------------------------------------------------- */

const SIX_FINGERPRINTS: ArchetypeSpec = {
  id: "g6f4-six-fingerprints",
  title: "Six Fingerprints",
  tagline: "A hotter Sun and more greenhouse gas both warm the surface. Six measurements tell them apart.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Evaluate a claim by looking for evidence that separates two competing explanations.",
    "Give at least three observations that a greenhouse cause predicts and a brighter Sun does not.",
  ],
  misconceptions: [
    "Warming alone tells you what caused the warming",
    "Every piece of evidence points the same way for the same reason",
  ],
  specimens: [
    {
      id: "earth",
      name: "The evidence, all at once",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
      parts: [
        {
          id: "strat", name: "The stratosphere is cooling", at: [0.0, -0.56],
          note: "Since 1979 the lower stratosphere has cooled by roughly 0.3 degrees a decade while the surface warmed. More CO2 makes the thin upper air radiate to space more efficiently and blocks heat coming up from below. A brighter Sun would warm both layers together.",
        },
        {
          id: "nights", name: "Nights warm faster than days", at: [-0.46, -0.34],
          note: "The gap between the daily maximum and minimum has narrowed almost everywhere. Extra infrared coming back down works all night. Extra sunshine cannot.",
        },
        {
          id: "isotopes", name: "The new carbon is fossil carbon", at: [0.46, -0.34],
          note: "Fossil fuel carries less carbon-13 than living carbon and no carbon-14 at all, because it has been underground far longer than radiocarbon survives. Both ratios in the air are falling exactly as fossil burning predicts.",
        },
        {
          id: "oxygen", name: "Oxygen is falling", at: [-0.52, 0.06],
          note: "Burning consumes oxygen. Measurements since 1990 show atmospheric oxygen dropping by about 4 parts per million a year, matching the carbon burned. CO2 out of a volcano or out of the ocean would not do that.",
        },
        {
          id: "downward", name: "More infrared comes back down, at CO2's wavelengths", at: [0.52, 0.06],
          note: "Spectrometers pointed at the sky in Oklahoma and Alaska measured the downward infrared rise by about 0.2 W/m2 per decade between 2000 and 2010, concentrated in exactly the wavelengths carbon dioxide absorbs.",
        },
        {
          id: "arctic", name: "The Arctic warms fastest", at: [0.0, 0.52],
          note: "Nearly four times the global rate since 1979. That is what a greenhouse-driven warming with retreating sea ice predicts, and it was predicted decades before it was measured.",
        },
      ],
    },
  ],
};

export const g6f4SixFingerprints = buildSim(SIX_FINGERPRINTS);

/* ---------------------------------------------------------------- *
 * F4.5 — Spotting overstated and understated claims
 * ---------------------------------------------------------------- */

const TOO_MUCH_TOO_LITTLE: ArchetypeSpec = {
  id: "g6f4-too-much-too-little",
  title: "Too Much, Too Little, About Right",
  tagline: "Six claims. Two go too far, two do not go far enough, and two say exactly what the evidence supports.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Judge a claim against the size and the certainty of the evidence behind it.",
    "Recognise that a claim can mislead by being too weak as easily as by being too strong.",
  ],
  misconceptions: [
    "A cautious claim is always the more scientific one",
    "Any statement of uncertainty means scientists do not know",
  ],
  categories: [
    { id: "over", name: "Overstated", hint: "goes further than the evidence" },
    { id: "fair", name: "Fairly stated", hint: "matches the evidence and its range" },
    { id: "under", name: "Understated", hint: "true, but leaves out the size of it" },
  ],
  specimens: [
    {
      id: "sevenmetres", name: "Sea level will rise seven metres this century", category: "over",
      because: "Greenland's ice really is worth 7.4 metres, but shifting it takes many centuries. The IPCC's likely range for 2100 is 0.4 to 0.8 metres, with a low-likelihood high end near 1.9.",
      art: { art: "glassware", which: "beaker", level: 0.95, color: "#3d8fc4" },
    },
    {
      id: "everystorm", name: "Every storm is caused by climate change", category: "over",
      because: "Warming loads the dice rather than throwing them: a warmer atmosphere holds about 7 per cent more water vapour per degree, so downpours get heavier. Attribution studies give a change in the odds, not a verdict on one storm.",
      art: { art: "sphere", color: "#7d8b9c", radius: 0.46 },
    },
    {
      id: "onepointone", name: "The last decade averaged about 1.1 degrees warmer than 1850 to 1900", category: "fair",
      because: "That is the IPCC figure for 2011 to 2020, quoted with its uncertainty range, and four independent teams get it from the raw data separately.",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
    },
    {
      id: "fifteen", name: "Warming is likely to pass 1.5 degrees in the early 2030s on the present path", category: "fair",
      because: "It follows from a rate of about 0.2 degrees a decade and the carbon budget left. The word likely is doing real work: it names a probability rather than a certainty.",
      art: { art: "sphere", color: "#e08a4a", radius: 0.46 },
    },
    {
      id: "onlyonedegree", name: "It is only one degree, so nothing has really happened", category: "under",
      because: "One degree of global average has already moved rainfall belts, raised the sea about 20 cm and multiplied dangerous heat days in many cities. The whole difference between now and the depth of the last ice age is about 5 degrees the other way.",
      art: { art: "sphere", color: "#cfd8e4", radius: 0.46 },
    },
    {
      id: "tracegas", name: "CO2 is only 0.04 per cent of the air, so it cannot matter", category: "under",
      because: "True and beside the point. That trace accounts for about 2.16 W/m2 of extra heating, and without CO2 and the water vapour it supports the surface would sit near minus 18 degrees instead of 15.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
};

export const g6f4TooMuchTooLittle = buildSim(TOO_MUCH_TOO_LITTLE);
