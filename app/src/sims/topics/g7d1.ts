import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D1 — Resource availability and populations.
 *
 * Five simulations, one per subtopic:
 *
 *   D1.1  g7d1-runs-out-first     limiting resources                (sort)
 *   D1.2  g7d1-where-it-levels    carrying capacity                 (investigate)
 *   D1.3  g7d1-st-matthew         reading real population data      (process)
 *   D1.4  g7d1-the-dry-summer     predicting the response to scarcity (trace)
 *   D1.5  g7d1-same-food-bowl     competition for one resource      (compare)
 *
 * The unit's arithmetic starts here. Carrying capacity is the logistic curve
 * computed exactly, and the scarcity work is a forage budget a student can
 * redo on paper: grassland grows about 5 000 kg of dry matter per hectare a
 * year, a deer eats about 2.5 kg a day, and half the crop has to be left
 * standing. The population data is the real St Matthew Island census, which
 * went 29, 1 350, 6 000, 42, none.
 */

/**
 * The St Matthew Island reindeer census: the five counts that were actually
 * made, plus the two dates that bracket the end of the herd.
 *
 * 29 animals landed in August 1944. Counts followed in 1957 and 1963, the
 * herd died over the winter of 1963-64, 42 were found in the summer of 1966,
 * and none were left by the early 1980s.
 */
const ST_MATTHEW_CENSUS: [number, number][] = [
  [1944, 29], [1957, 1350], [1963, 6000], [1964, 42], [1966, 42], [1980, 0], [1985, 0],
];

/** The herd between two counts: geometric while it is growing, straight while it is not. */
function herdIn(year: number): number {
  const c = ST_MATTHEW_CENSUS;
  if (year <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (year > c[i][0]) continue;
    const [y0, n0] = c[i - 1], [y1, n1] = c[i];
    const k = (year - y0) / (y1 - y0);
    return n0 > 0 && n1 > 0 ? n0 * (n1 / n0) ** k : n0 + (n1 - n0) * k;
  }
  return c[c.length - 1][1];
}

/**
 * Reindeer-years of grazing done by the end of a given year, integrating the
 * same census curve. A geometric segment integrates to (N1 - N0) / r exactly;
 * a straight one is a trapezium.
 */
function reindeerYears(year: number): number {
  const c = ST_MATTHEW_CENSUS;
  let total = 0;
  for (let i = 1; i < c.length; i++) {
    const [y0, n0] = c[i - 1];
    const [y1, n1] = c[i];
    if (year <= y0) break;
    const end = Math.min(year, y1);
    const nEnd = herdIn(end);
    if (n0 > 0 && n1 > 0) {
      const r = Math.log(n1 / n0) / (y1 - y0);
      total += Math.abs(r) < 1e-9 ? n0 * (end - y0) : (nEnd - n0) / r;
    } else {
      total += ((n0 + nEnd) / 2) * (end - y0);
    }
  }
  return total;
}

/** Lichen cover, deepest first. The island's colour is the whole readout of D1.3. */
const LICHEN = ["#9a9384", "#9a9770", "#8e9a68", "#7d9a5c", "#6d9a52"];

/* ---------------------------------------------------------------- *
 * D1.1 — Limiting resources
 * ---------------------------------------------------------------- */

const RUNS_OUT_FIRST: ArchetypeSpec = {
  id: "g7d1-runs-out-first",
  title: "Which One Runs Out First?",
  tagline: "Six resources, six real measurements. Only some of them set the limit.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "Identify the limiting resource in an ecosystem from measured supply and demand.",
    "Explain that a population is set by the scarcest resource, not the most abundant one.",
  ],
  misconceptions: [
    "The most plentiful resource is the one that controls a population",
    "Every resource an organism needs limits it equally",
  ],
  categories: [
    { id: "limiting", name: "Runs out first", hint: "supply is below what the population could use" },
    { id: "surplus", name: "Never the shortage", hint: "more arrives than anything here can use" },
  ],
  specimens: [
    {
      id: "phosphorus", name: "Phosphorus in a lowland lake", category: "limiting",
      because: "Algae build tissue at 106 carbon to 16 nitrogen to 1 phosphorus. Lake water carries nitrogen at about twenty times the phosphorus, so phosphorus goes first: one gram of it grows roughly 100 g of new algae.",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#4f9a5a" },
    },
    {
      id: "pond-oxygen", name: "Dissolved oxygen in a still pond in August", category: "limiting",
      because: "Water holds 14.6 mg of oxygen per litre at 0 C but only 7.6 mg at 30 C. Trout stop feeding below 6 mg per litre, so a hot still week can empty a pond that is still full of food.",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#4aa3d8", bubbles: 0.6 },
    },
    {
      id: "floor-light", name: "Light on the forest floor in July", category: "limiting",
      because: "A closed beech canopy passes 1 to 2 per cent of the light above it: about 15 W per square metre against 1 000 W at the top. A seedling there cannot photosynthesise fast enough to pay for its own respiration.",
      art: { art: "sphere", color: "#39424f", radius: 0.44 },
    },
    {
      id: "canopy-light", name: "Sunlight at the top of the canopy", category: "surplus",
      because: "About 1 000 W per square metre at midday, and a leaf is already saturated at roughly a third of that. Extra sunshine cannot make the top leaves grow faster.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
    {
      id: "air-oxygen", name: "Oxygen in the air over a grazing meadow", category: "surplus",
      because: "Air is 20.9 per cent oxygen, 209 000 parts per million, and the wind replaces it faster than any herd can breathe it down. Nothing in a meadow is ever short of oxygen.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "lake-water", name: "Water for a lily rooted in the middle of a lake", category: "surplus",
      because: "Its roots sit under three metres of the stuff. What limits this lily is phosphorus and light, never water, which is why plenty of a resource and the resource that matters are two different questions.",
      art: { art: "molecule", formula: "H2O" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D1.2 — Carrying capacity
 * ---------------------------------------------------------------- */

const WHERE_IT_LEVELS: ArchetypeSpec = {
  id: "g7d1-where-it-levels",
  title: "Where the Curve Levels Off",
  tagline: "Let a herd loose on an island and watch the growth curve flatten against its food.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "Predict a population over time from a starting size, a growth rate and a carrying capacity.",
    "Explain why growth is fastest at half the carrying capacity and zero at the capacity itself.",
  ],
  misconceptions: [
    "A population grows at the same rate no matter how crowded it is",
    "Carrying capacity is a fixed property of a species rather than of a place",
  ],
  specimens: [
    { id: "herd", name: "The herd, drawn to its number", art: { art: "sphere", color: "#6f8f52", radius: 0.5 } },
  ],
  variables: [
    { key: "years", label: "Years since release", min: 0, max: 40, step: 0.5, default: 12 },
    { key: "start", label: "Animals released at the start", min: 5, max: 300, step: 1, default: 29 },
    { key: "rate", label: "Growth rate r (per year)", min: 0.05, max: 0.6, step: 0.01, default: 0.32 },
    { key: "capacity", label: "Carrying capacity K (animals)", min: 200, max: 6000, step: 50, default: 1600 },
  ],
  // The logistic curve, exactly: N(t) = K / (1 + ((K - N0)/N0) e^(-rt)).
  // Growth per year is r N (1 - N/K), which peaks at N = K/2 and is zero at
  // N = K. With 29 reindeer, r = 0.32 and K = 1 600, year 12 gives 740 animals.
  measure: (v) => {
    const n = v.capacity / (1 + ((v.capacity - v.start) / v.start) * Math.exp(-v.rate * v.years));
    return {
      herdSize: n,
      percentOfCapacity: (100 * n) / v.capacity,
      growthThisYear: v.rate * n * (1 - n / v.capacity),
    };
  },
  plot: { x: "years", y: "herdSize", xLabel: "Years since release", yLabel: "Herd size (animals)" },
  /*
   * The herd is drawn as a disc of animals, so its area is its number and its
   * width is the square root of that: a herd at a quarter of the capacity is
   * half as wide, not a quarter. Against the capacity as the full disc, the
   * 29 released animals start at a seventh of the width.
   *
   * The disc turns while the herd is growing and stops dead when it is not.
   * That is the point of the curve: growth is fastest at K/2 and exactly zero
   * at K, so the last stretch of the slider adds almost nothing at all, and
   * the herd sitting still at its ceiling is what carrying capacity looks
   * like.
   */
  drive: ({ f, v }) => {
    const stalled = f.growthThisYear < v.capacity * 0.002;
    return {
      scale: 1.35 * Math.max(0.1, Math.sqrt(f.herdSize / v.capacity)),
      color: f.percentOfCapacity > 95 ? "#a8562f" : "#6f8f52",
      rate: stalled ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D1.3 — Reading real population data
 * ---------------------------------------------------------------- */

const ST_MATTHEW: ArchetypeSpec = {
  id: "g7d1-st-matthew",
  title: "Twenty-Nine Reindeer",
  tagline: "A real census, taken five times over forty years. Read what it says.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "Read a real population record and describe the pattern it shows.",
    "Explain overshoot: a population can pass its carrying capacity and destroy it on the way through.",
  ],
  misconceptions: [
    "A population always settles gently at its carrying capacity",
    "Running out of food only slows a population down, it cannot end it",
  ],
  specimens: [
    { id: "island", name: "St Matthew Island, 332 square kilometres",
      art: { art: "planet", color: "#6d9a52", atmosphere: "#d8e6dc" } },
  ],
  variables: [
    { key: "year", label: "Year", min: 1944, max: 1985, step: 1, default: 1944 },
  ],
  /*
   * The herd is read straight off the census - 29 in 1944, 1 350 in 1957,
   * 6 000 in 1963, 42 in 1966, none by the 1980s - with geometric growth
   * between counts, which is what a population with no predators does.
   *
   * The lichen is then arithmetic on top of it. The island is 332 square
   * kilometres, 33 200 hectares, and an arctic lichen range carries roughly
   * 1 000 kg per hectare of the mat a reindeer will actually eat: 33 200
   * tonnes in all. A reindeer eats about 4.5 kg of dry lichen a day, 1.64
   * tonnes a year, so multiplying that by the reindeer-years grazed gives
   * what has been taken.
   *
   * Integrating the census curve, the herd had grazed 20 200 reindeer-years
   * by the middle of 1962 - the whole mat - and the crash came the following
   * winter. Lichen grows back at about 20 kg per hectare per year, so by 1985
   * the island has recovered less than two fifths of what it lost. That is
   * the difference between using a resource and destroying it.
   */
  measure: (v) => {
    const herd = herdIn(v.year);
    const grazedTonnes = reindeerYears(v.year) * 1.6425;
    const regrownTonnes = v.year > 1966 ? (v.year - 1966) * 664 : 0;
    const standingTonnes = Math.max(0, Math.min(33200, 33200 - grazedTonnes + regrownTonnes));
    return {
      herd,
      reindeerPerSquareKm: herd / 332,
      grazedTonnes,
      standingLichenTonnes: standingTonnes,
      lichenPercent: (100 * standingTonnes) / 33200,
      lichenPerReindeerTonnes: herd > 0 ? standingTonnes / herd : 0,
    };
  },
  /*
   * The island is the readout. It starts deep lichen green, fades as the herd
   * eats through the mat, and is bare rock and dead standing lichen by 1963 -
   * a year before the die-off, which is exactly the order the argument needs.
   * Drag on past 1966 and the green creeps back, slowly: this is the one
   * place in the topic where a student can see that the capacity itself was
   * destroyed rather than merely reached.
   */
  drive: ({ f }) => ({
    color: LICHEN[Math.min(4, Math.max(0, Math.floor((f.lichenPercent / 100) * 4.999)))],
  }),
  stages: [
    { name: "Aug 1944", at: 0,
      caption: "29 reindeer step ashore onto 332 square kilometres of untouched lichen. No wolves, no hunters, no competition." },
    { name: "1957", at: 0.2,
      caption: "1 350 animals. A 46-fold rise in 13 years, about 34 per cent a year, and the lichen is still deep enough to bury a boot." },
    { name: "1963", at: 0.4,
      caption: "6 000 animals, 18 to the square kilometre. The lichen is grazed to bare rock and the reindeer now weigh less than mainland ones." },
    { name: "Winter 1963-64", at: 0.6,
      caption: "Deep snow over an island with almost nothing left to eat. Most of the herd starves in a single winter." },
    { name: "Summer 1966", at: 0.8,
      caption: "42 animals: 41 females, one male, and not one fawn. Above zero, and already finished." },
    { name: "1980s", at: 1,
      caption: "No reindeer left. Overshoot does not stop at the carrying capacity - it wrecks the capacity on the way through." },
  ],
};

/* ---------------------------------------------------------------- *
 * D1.4 — Predicting the response to scarcity
 * ---------------------------------------------------------------- */

const THE_DRY_SUMMER: ArchetypeSpec = {
  id: "g7d1-the-dry-summer",
  title: "Follow the Drought Through the Herd",
  tagline: "Rain fails in June. Trace what that does, step by step, to one doe and her fawns.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "Predict how a population responds when a limiting resource is reduced.",
    "Explain that scarcity acts on a population mostly through births and young survival, not adult deaths.",
  ],
  misconceptions: [
    "A shortage kills members of a population at random",
    "A population responds to scarcity immediately and all at once",
  ],
  stages: [
    { name: "May", at: 0, caption: "The forage budget balances: 50 000 kg of grazeable grass, enough for 54 deer." },
    { name: "June", at: 0.25, caption: "The rain fails. Growth falls by 60 per cent and the budget drops to 21 deer." },
    { name: "July", at: 0.5, caption: "Crude protein in the grass halves, from about 14 per cent to about 7." },
    { name: "August", at: 0.75, caption: "The doe is roughly 15 per cent lighter and her milk is thin." },
    { name: "Next April", at: 1, caption: "Fewer fawns survived. The herd has come down to what the meadow can feed." },
  ],
  route: [
    { at: [0.1, 0.36], name: "The meadow in May",
      note: "20 hectares growing 5 000 kg of dry matter per hectare per year. Graze half and leave half: 50 000 kg is available, and a deer eating 2.5 kg a day needs 912 kg a year. That is 54 deer." },
    { at: [0.27, 0.62], name: "June: the rain stops",
      note: "Six weeks without rain cut grass growth by about 60 per cent, from 5 000 to 2 000 kg per hectare. The same 20 hectares now supports 21 deer, not 54. Nothing else about the meadow has changed." },
    { at: [0.44, 0.3], name: "Protein in the leaf",
      note: "Drought-stressed grass falls from about 14 per cent crude protein to about 7. A doe feeding fawns needs 14 to 16 per cent, so every mouthful is now worth roughly half what it was." },
    { at: [0.6, 0.6], name: "The doe herself",
      note: "She still eats her 2.5 kg a day but gets far less protein from it, so she draws on fat. By August she is about 15 per cent lighter than she was in May." },
    { at: [0.75, 0.32], name: "The fawns",
      note: "Milk fails early. Fawn survival to autumn falls from roughly 60 per cent in a wet year to under 25 in a dry one. The herd loses its young long before it loses its adults." },
    { at: [0.9, 0.58], name: "Next spring's count",
      note: "Fewer fawns recruited, so the herd falls toward the 21 the meadow can actually feed. Scarcity works through births first, which is why a population lags a year behind its food." },
  ],
};

/* ---------------------------------------------------------------- *
 * D1.5 — Competition for the same limiting resource
 * ---------------------------------------------------------------- */

const SAME_FOOD_BOWL: ArchetypeSpec = {
  id: "g7d1-same-food-bowl",
  title: "Two Species, One Food Supply",
  tagline: "Gause grew them apart, then together, and counted every day for three weeks.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "Compare a population grown alone with the same population sharing one limiting resource.",
    "State the competitive exclusion principle: two species cannot hold the same niche on one limiting resource.",
  ],
  misconceptions: [
    "Two competing species always settle down and share a resource",
    "The larger or faster species always wins a competition",
  ],
  specimens: [
    {
      id: "apart", name: "Kept apart: P. aurelia in a tube of its own",
      because: "Alone it settles at 105 cells per 0.5 mL. P. caudatum, alone in its own tube, settles at 64.",
      art: { art: "glassware", which: "testTube", level: 0.1, color: "#4aa3d8" },
    },
    {
      id: "together", name: "Mixed, sharing one bacterial supply",
      because: "P. aurelia holds about 80. P. caudatum is gone by day 16.",
      art: { art: "glassware", which: "flask", level: 0.1, color: "#8e5bc4", precipitate: 0.28 },
    },
  ],
  variables: [
    { key: "days", label: "Days since the tubes were seeded", min: 0, max: 24, step: 0.5, default: 0 },
  ],
  /*
   * Gause's 1934 experiment, run as logistic curves fitted to his own counts,
   * in cells per 0.5 cm3 of medium.
   *
   * Alone, P. aurelia grows at about 1.0 per day to a ceiling of 105 and
   * P. caudatum at about 0.8 per day to 64. Together, on one daily ration of
   * bacteria, aurelia gets to about 80 and caudatum is squeezed out: it grows
   * normally for the first four days, while food is still free, and then
   * falls away at about 0.3 per day once aurelia has taken the supply. By day
   * 16 it is below two cells and by day 24 it is gone.
   *
   * That is competitive exclusion. Neither species attacks the other; they
   * simply cannot both live on one limiting resource.
   */
  measure: (v) => {
    const logistic = (k: number, r: number, t: number) => k / (1 + ((k - 2) / 2) * Math.exp(-r * t));
    const aureliaAlone = logistic(105, 1.0, v.days);
    const caudatumAlone = logistic(64, 0.8, v.days);
    const aureliaMixed = logistic(80, 1.0, v.days);
    const caudatumMixed = caudatumAlone * Math.exp(-0.3 * Math.max(0, v.days - 4));
    const mixedTotal = aureliaMixed + caudatumMixed;
    return {
      aureliaAlone,
      caudatumAlone,
      aureliaMixed,
      caudatumMixed,
      mixedTotal,
      caudatumShareOfMix: mixedTotal > 0 ? (100 * caudatumMixed) / mixedTotal : 0,
      caudatumLostPercent: caudatumAlone > 0 ? 100 * (1 - caudatumMixed / caudatumAlone) : 0,
    };
  },
  /*
   * Both cultures fill as the days run, so the difference between them is a
   * difference in what the same food supply can carry, not in how long they
   * were left. The mixed flask also carries the colour of who is in it:
   * violet while both species are present, and blue by the end, when only
   * P. aurelia is left. That colour change is the extinction, and it happens
   * while the flask itself is still filling.
   */
  drive: ({ f, index }) => {
    if (index === 0) {
      return { level: 0.08 + 0.72 * (f.aureliaAlone / 105) };
    }
    const share = f.caudatumShareOfMix;
    return {
      level: 0.08 + 0.72 * (f.mixedTotal / 105),
      color: share > 30 ? "#8e5bc4" : share > 8 ? "#7268cc" : "#4aa3d8",
      precipitate: 0.08 + 0.006 * share,
    };
  },
};

export const g7d1RunsOutFirst = buildSim(RUNS_OUT_FIRST);
export const g7d1WhereItLevels = buildSim(WHERE_IT_LEVELS);
export const g7d1StMatthew = buildSim(ST_MATTHEW);
export const g7d1TheDrySummer = buildSim(THE_DRY_SUMMER);
export const g7d1SameFoodBowl = buildSim(SAME_FOOD_BOWL);
