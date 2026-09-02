import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F5 — Effects on living systems.
 *
 * Five simulations, one per subtopic:
 *
 *   F5.1  g6f5-degree-heating-weeks  habitat change                  (investigate)
 *   F5.2  g6f5-a-month-of-fasting    resource availability           (compare)
 *   F5.3  g6f5-counting-the-heat     plant growth and timing         (investigate)
 *   F5.4  g6f5-moving-north          behaviour and range shifts      (trace)
 *   F5.5  g6f5-built-for-a-colder-world  adaptations and their limits (sort)
 *
 * Both investigations run real operational formulae rather than illustrations.
 * F5.1 computes NOAA's Degree Heating Weeks, the index reef managers actually
 * issue alerts from, and F5.3 computes growing degree days, which is how a
 * farmer predicts a harvest date and how a biologist predicts a budburst date.
 */

/* ---------------------------------------------------------------- *
 * F5.1 — Habitat change
 * ---------------------------------------------------------------- */

const DEGREE_HEATING_WEEKS: ArchetypeSpec = {
  id: "g6f5-degree-heating-weeks",
  title: "Four Weeks Too Warm",
  tagline: "A reef does not mind a hot day. It minds a hot month. Count the heat and see where the line is.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS2-4", "MS-ESS3-5"] },
  learningGoals: [
    "Compute Degree Heating Weeks from a temperature anomaly and its duration.",
    "Explain that habitat loss depends on how long a stress lasts, not only how strong it is.",
    "State the two operational thresholds: 4 degree-heating-weeks for bleaching, 8 for death.",
  ],
  misconceptions: [
    "A bleached coral is already dead",
    "One hot day is enough to kill a reef",
    "A degree of warming is too small to matter to a living thing",
  ],
  specimens: [
    {
      id: "reef", name: "One coral head, and the algae inside every polyp",
      art: { art: "sphere", color: "#c9603f", radius: 0.46 },
    },
  ],
  variables: [
    { key: "hotSpotC", label: "Degrees above the summer maximum", min: 0, max: 4, step: 0.1, default: 1.5 },
    { key: "weeks", label: "Weeks it stays there", min: 0, max: 12, step: 1, default: 4 },
  ],
  // NOAA Coral Reef Watch's real index. The HotSpot is how far the sea
  // surface sits above the warmest monthly average that reef normally sees.
  // HotSpots below 1 degree are not counted at all - reefs shrug those off -
  // and everything above 1 is accumulated over a rolling 12-week window, in
  // units of degree Celsius weeks. Four is where widespread bleaching starts;
  // eight is where corals begin to die. The Great Barrier Reef passed four in
  // 1998, 2002, 2016, 2017, 2020, 2022 and 2024, and a badly bleached reef
  // needs 10 to 15 undisturbed years to rebuild.
  measure: (v) => {
    const counted = v.hotSpotC >= 1 ? v.hotSpotC : 0;
    const dhw = counted * v.weeks;
    return {
      hotSpotCounted: counted,
      degreeHeatingWeeks: dhw,
      fractionOfBleachingLevel: dhw / 4,
      fractionOfDeathLevel: dhw / 8,
      recoveryYearsNeeded: dhw >= 8 ? 15 : dhw >= 4 ? 10 : 0,
    };
  },
  plot: { x: "weeks", y: "degreeHeatingWeeks", xLabel: "Weeks above the summer maximum", yLabel: "Degree heating weeks" },
  /*
   * The coral is the instrument, and it crosses NOAA's two thresholds in front
   * of you. Its colour is not its own: it comes from the zooxanthellae living
   * in the polyps, and heat stress makes the polyps expel them. Below 4 degree
   * heating weeks the head keeps its brown-orange; at 4 it goes bone white,
   * because what you are then seeing is the bare aragonite skeleton through
   * clear tissue — and a white coral is starving, not dead, which is the
   * misconception this simulation exists to break. At 8 it stops moving
   * altogether and greys over as algae grow on the dead skeleton, and after
   * that the reef needs 10 to 15 undisturbed years. Note also what happens
   * below a 1 degree HotSpot: nothing at all, however many weeks you give it.
   */
  drive: ({ f }) => {
    const dead = f.degreeHeatingWeeks >= 8;
    const bleached = f.degreeHeatingWeeks >= 4;
    const stress = Math.min(1, f.degreeHeatingWeeks / 8);
    return {
      color: dead ? "#8f8d84" : bleached ? "#f4efe4" : stress > 0.3 ? "#dd9464" : "#c9603f",
      scale: 1 - 0.2 * stress,
      glow: bleached && !dead ? 0.9 : 0.12,
      rate: dead ? 0 : 1 - 0.7 * stress,
    };
  },
};

export const g6f5DegreeHeatingWeeks = buildSim(DEGREE_HEATING_WEEKS);

/* ---------------------------------------------------------------- *
 * F5.2 — Resource availability
 * ---------------------------------------------------------------- */

const A_MONTH_OF_FASTING: ArchetypeSpec = {
  id: "g6f5-a-month-of-fasting",
  title: "A Month Longer on Shore",
  tagline: "The same bay, forty years apart. The seals are still there; the platform to hunt them from is not.",
  kind: "compare",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS2-1", "MS-ESS3-5"] },
  learningGoals: [
    "Explain that a resource can become unavailable without becoming scarce.",
    "Connect a change in the timing of ice to a change in a population.",
  ],
  misconceptions: [
    "Animals are affected by warming only through heat itself",
    "If the food is still there, the population is fine",
  ],
  variables: [
    { key: "warmingC", label: "Global warming (degrees)", min: 0, max: 4, step: 0.1, default: 1.1 },
  ],
  /*
   * Western Hudson Bay, measured. In the early 1980s the bay froze in
   * mid-November and broke up in mid-July: about 244 days of ice, and 121
   * ashore. Break-up has since moved about three weeks earlier and freeze-up
   * one to two weeks later, which is roughly 30 days of ice lost for the 1.1
   * degrees of warming so far — about 27 days a degree, and that is the rate
   * used here. A fasting bear loses about 1 kg a day, so every degree costs it
   * another 27 kg. Work on this population puts the limit of an adult's fast
   * at around 180 days ashore, which this arithmetic reaches at about 2.2
   * degrees. The seals are not gone. The platform to hunt them from is.
   */
  measure: (v) => {
    const iceDays = Math.max(0, 244 - 27 * v.warmingC);
    const fastDays = 365 - iceDays;
    return {
      daysOfSeaIce: iceDays,
      daysAshoreFasting: fastDays,
      massLostAshoreKg: fastDays,
      pastTheSurvivableFast: fastDays >= 180 ? 1 : 0,
    };
  },
  /*
   * The left-hand bay is the 1980s and never changes: it is the reference the
   * comparison is made against. The right-hand bay is the one your slider
   * warms, and what shrinks in it is the ice platform — 244 days of it at zero,
   * two-thirds of that at four degrees. Past a fast of 180 days the scene
   * collapses and drops: that is the point at which an adult bear cannot make
   * it to freeze-up, and this population has already fallen from about 1,200
   * bears to about 600.
   */
  drive: ({ f, index }) => {
    if (index === 0) return { scale: 1 };
    const platform = f.daysOfSeaIce / 244;
    const doomed = f.pastTheSurvivableFast > 0;
    return {
      scale: doomed ? 0.3 : 0.35 + 0.65 * platform,
      offset: [0, doomed ? 0.5 : 0.3 * (1 - platform)],
    };
  },
  specimens: [
    {
      id: "y1980",
      name: "Western Hudson Bay, early 1980s",
      because: "The bay froze in mid-November and broke up in mid-July, giving bears about eight months on the ice. Ringed seal pups are half fat, and a bear came ashore heavy enough to fast through the summer.",
      art: { art: "habitat", which: "arctic" },
    },
    {
      id: "y2020",
      name: "Western Hudson Bay, today",
      because: "Break-up comes about three weeks earlier and freeze-up one to two weeks later, so the fast on shore is roughly a month longer. A fasting bear loses about 1 kg a day, so that is 30 kg of a bear. The population has fallen from around 1,200 in 1987 to around 600.",
      art: { art: "habitat", which: "ocean" },
    },
  ],
};

export const g6f5AMonthOfFasting = buildSim(A_MONTH_OF_FASTING);

/* ---------------------------------------------------------------- *
 * F5.3 — Plant growth and timing
 * ---------------------------------------------------------------- */

const COUNTING_THE_HEAT: ArchetypeSpec = {
  id: "g6f5-counting-the-heat",
  title: "Plants Count Heat, Not Days",
  tagline: "A crop ripens when it has collected enough warmth. Warm the season and the date moves.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5", "MS-ESS3-5"], ccssMath: ["6.EE.A.2"] },
  learningGoals: [
    "Compute growing degree days from mean temperature and a base temperature.",
    "Predict how many days earlier a crop matures if the season warms.",
    "Explain why warming can shorten a growing season even though it lengthens the frost-free period.",
  ],
  misconceptions: [
    "Warmer always means a bigger harvest",
    "Plants respond to the calendar rather than to accumulated heat",
  ],
  specimens: [
    { id: "maize", name: "Maize, base temperature 10 C", art: { art: "flora", which: "seedling" } },
  ],
  variables: [
    { key: "meanTempC", label: "Mean temperature of the growing season (C)", min: 12, max: 30, step: 0.5, default: 20 },
    { key: "warmingC", label: "Extra warming (C)", min: 0, max: 5, step: 0.1, default: 0 },
    { key: "gddNeeded", label: "Heat the crop needs (degree days)", min: 1000, max: 1800, step: 50, default: 1400 },
  ],
  // The growing-degree-day rule, which is what a farmer plans a harvest with
  // and what a biologist predicts a budburst date with. Each day contributes
  // its mean temperature minus a base below which the plant does nothing:
  // 10 degrees for maize, about 5 for oak. A typical maize hybrid needs
  // around 1,400 degree days, so a season averaging 20 degrees delivers
  // 10 a day and ripens it in 140. Add two degrees and the same crop is ready
  // 23 days sooner - fewer days of grain fill, which is one of the reasons
  // warming can cut yield even where frost is no longer a risk.
  //
  // The same accumulation rule sets the date an oak breaks bud and the date a
  // caterpillar hatches. They use different base temperatures, so warming
  // moves them by different amounts, and that is how a food chain drifts out
  // of step with itself.
  measure: (v) => {
    const baseline = Math.max(0.5, v.meanTempC - 10);
    const daily = Math.max(0.5, v.meanTempC + v.warmingC - 10);
    return {
      degreeDaysPerDay: daily,
      daysToMaturity: v.gddNeeded / daily,
      daysEarlier: v.gddNeeded / baseline - v.gddNeeded / daily,
      seasonShortenedPercent: (1 - baseline / daily) * 100,
      // How far through its life the crop is on the hundredth day of the
      // season, which is what a field actually looks like in mid-August.
      progressByDayOneHundred: Math.min(1, (daily * 100) / v.gddNeeded),
    };
  },
  plot: { x: "warmingC", y: "daysToMaturity", xLabel: "Extra warming (C)", yLabel: "Days to maturity" },
  /*
   * The plant is drawn as it would stand on the hundredth day of the season,
   * which is the only fair way to compare two crops that ripen on different
   * dates. A season averaging 12 degrees delivers 2 degree days a day, so by
   * day 100 the maize has collected 200 of the 1 400 it needs and is barely a
   * seedling. At 20 degrees it is most of the way there; at 30 it finished
   * three weeks ago. Warming does not make the plant bigger. It makes it
   * finish sooner, with fewer days of grain fill behind it.
   */
  drive: ({ f }) => {
    const scale = 0.25 + 0.75 * f.progressByDayOneHundred;
    return { scale, offset: [0, 0.7 * (1 - scale)] };
  },
};

export const g6f5CountingTheHeat = buildSim(COUNTING_THE_HEAT);

/* ---------------------------------------------------------------- *
 * F5.4 — Animal behaviour and range shifts
 * ---------------------------------------------------------------- */

const MOVING_NORTH: ArchetypeSpec = {
  id: "g6f5-moving-north",
  title: "Following the Isotherm North",
  tagline: "A butterfly that lived in southern England is now in Scotland. Follow the edge of its range, decade by decade.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS2-4", "MS-ESS3-5"] },
  learningGoals: [
    "Describe a range shift as a species tracking the temperature it needs.",
    "Convert a warming in degrees into a distance poleward and a height uphill.",
    "Explain why a mountaintop or a coastline turns a range shift into a range loss.",
  ],
  misconceptions: [
    "Animals can always simply move if it gets too warm",
    "A species moving north means it is doing well",
  ],
  specimens: [
    { id: "comma", name: "Comma butterfly", art: { art: "creature", which: "butterfly" } },
  ],
  variables: [
    { key: "warmingC", label: "Global warming (degrees)", min: 0, max: 6, step: 0.1, default: 1.1 },
  ],
  /*
   * The conversion, and where it runs out. Air cools about 6.5 degrees per
   * kilometre of height, so one degree of warming is 1000 / 6.5 = 154 m
   * uphill; across mid-latitude land the horizontal gradient works out at
   * roughly 150 km of latitude per degree. The comma has followed the second
   * of those about 220 km north since 1970, which is what 1.1 degrees buys.
   *
   * Then the arithmetic stops being kind. From the Thames to the north coast
   * of Scotland is about 790 km, so somewhere past 5 degrees the range edge
   * reaches the sea and the shift becomes a loss. A species on a mountaintop
   * meets the same wall sooner: the American pika has already gone from about
   * a third of the Great Basin sites where it was recorded.
   */
  measure: (v) => {
    const kmPoleward = 150 * v.warmingC;
    return {
      kilometresPoleward: kmPoleward,
      metresUphill: 154 * v.warmingC,
      kilometresOfBritainLeft: Math.max(0, 790 - kmPoleward),
      decadesAtSeventeenKmPerDecade: kmPoleward / 17,
    };
  },
  /*
   * The butterfly goes where the isotherm goes: north up the stage and a
   * little smaller as it gets further away, 150 km for every degree. Push the
   * warming past about 5.3 degrees and it reaches the top of the map with
   * nowhere left to go, and it stops. That is the difference between a range
   * shift and a range loss, and it is one slider apart.
   */
  drive: ({ f }) => {
    const p = Math.min(1, f.kilometresPoleward / 790);
    return {
      offset: [0.35 * p, -0.9 * p],
      scale: 1 - 0.45 * p,
      rate: f.kilometresOfBritainLeft <= 0 ? 0 : 1,
    };
  },
  route: [
    {
      at: [0.10, 0.74], name: "1970: southern England",
      note: "The northern edge of the comma butterfly's range sat around the Severn and the Thames, where it had been for a century.",
    },
    {
      at: [0.28, 0.60], name: "1990: the Midlands",
      note: "The edge advances at roughly 10 km a year. Nothing about the butterfly has changed; the band of climate it can breed in has moved and it has followed.",
    },
    {
      at: [0.46, 0.46], name: "2000: Yorkshire",
      note: "Averaged over hundreds of studies, land species have moved about 17 km per decade towards the poles and 11 metres per decade uphill. Sea species move roughly four times faster, about 72 km per decade, because nothing blocks them.",
    },
    {
      at: [0.64, 0.33], name: "2012: County Durham",
      note: "Air cools about 6.5 degrees per kilometre of height, so one degree of warming is 154 metres uphill. Across mid-latitude land it is roughly 150 km poleward, which is why flat country loses species faster than mountains.",
    },
    {
      at: [0.80, 0.22], name: "Today: southern Scotland",
      note: "About 220 km north of where the edge sat in 1970. The comma is one of the winners: a generalist that eats nettle and hop and can use new ground as it opens.",
    },
    {
      at: [0.92, 0.13], name: "And then the sea",
      note: "Britain ends at 58 degrees north. A species on a mountaintop has the same problem sooner: the American pika has already gone from about a third of the Great Basin sites where it was recorded.",
    },
  ],
  stages: [
    { name: "Held", at: 0, caption: "A range edge is not a wall. It is wherever the climate stops being survivable, and it moves." },
    { name: "Advancing", at: 0.2, caption: "Warmth arrives first as a few good summers, then as a breeding population that does not die out over winter." },
    { name: "Tracking", at: 0.4, caption: "17 km per decade on land, 11 metres per decade uphill, about 72 km per decade in the sea." },
    { name: "The conversion", at: 0.6, caption: "One degree is 154 metres of altitude or roughly 150 km of latitude. Two degrees doubles both." },
    { name: "Winners", at: 0.8, caption: "Generalists with several food plants and good dispersal move easily. Specialists tied to one plant or one soil often cannot." },
    { name: "Running out", at: 1, caption: "The shift becomes a loss when there is nowhere left: the top of a mountain, the end of a peninsula, the edge of the sea ice." },
  ],
};

export const g6f5MovingNorth = buildSim(MOVING_NORTH);

/* ---------------------------------------------------------------- *
 * F5.5 — Existing adaptations and their limits
 * ---------------------------------------------------------------- */

const BUILT_FOR_A_COLDER_WORLD: ArchetypeSpec = {
  id: "g6f5-built-for-a-colder-world",
  title: "Built for a Colder World",
  tagline: "Six adaptations that took thousands of years to evolve. Sort them by how well they are holding up.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS4-4", "MS-LS4-6", "MS-ESS3-5"] },
  learningGoals: [
    "Explain that an adaptation fits a particular environment and can stop fitting when that environment changes.",
    "Distinguish adaptations that still work, those with a hard ceiling, and those already failing.",
    "Compare the speed of natural selection with the speed of the present change.",
  ],
  misconceptions: [
    "Species will simply adapt to whatever happens",
    "An adaptation that fails means the animal was badly designed",
    "Natural selection can produce whatever a population needs, whenever it needs it",
  ],
  categories: [
    { id: "works", name: "Still works", hint: "the fit has not been broken" },
    { id: "limit", name: "Works, up to a point", hint: "there is a hard ceiling ahead" },
    { id: "failing", name: "Already failing", hint: "the cue and the world no longer match" },
  ],
  specimens: [
    {
      id: "ptarmigan", name: "The ptarmigan's white winter coat", category: "failing",
      because: "The moult is triggered by day length, which has not changed at all, while the snow now arrives weeks later. A white bird on brown ground is a signal to every predator, and survival in those weeks falls sharply.",
      art: { art: "creature", which: "bird" },
    },
    {
      id: "coral", name: "Coral and the algae inside it", category: "failing",
      because: "The partnership feeds the reef, and it breaks down when the sea sits about 1 degree above the summer maximum for four weeks. Swapping to heat-tolerant algal strains buys roughly 1 to 1.5 degrees, which is less than this century is bringing.",
      art: { art: "cell", plant: true },
    },
    {
      id: "pika", name: "The pika's dense fur and high metabolism", category: "limit",
      because: "Superb for a cold mountain, and it still works up there. A pika can die after a few hours above about 25.5 degrees, so its answer is to climb. It has already gone from around a third of its recorded Great Basin sites, because mountains have tops.",
      art: { art: "creature", which: "rabbit" },
    },
    {
      id: "arcticfox", name: "The Arctic fox's fur and short ears", category: "limit",
      because: "Still the best insulation of any mammal, good to minus 40. What is beating it is not heat: as the tundra warms the larger red fox moves north into its range and takes the dens. An adaptation can be perfect and still lose.",
      art: { art: "creature", which: "fox" },
    },
    {
      id: "moving", name: "Being able to move", category: "works",
      because: "The oldest answer of all, and it is working now: about 17 km per decade poleward on land and 72 km per decade in the sea. It works for anything with wings, fins or good seeds, and only while there is somewhere to go.",
      art: { art: "creature", which: "butterfly" },
    },
    {
      id: "oak", name: "An oak that counts warmth rather than days", category: "works",
      because: "Budburst comes when enough heat has accumulated above about 5 degrees, so warming simply moves the date: British oaks now break bud roughly 10 days earlier than in the 1950s. The tree is fine. The risk falls on the caterpillars and birds that must be in step with it.",
      art: { art: "flora", which: "tree" },
    },
  ],
};

export const g6f5BuiltForAColderWorld = buildSim(BUILT_FOR_A_COLDER_WORLD);
