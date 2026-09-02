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
    { id: "forage", name: "The lichen mat that sets the ceiling", art: { art: "cell", plant: true } },
  ],
  variables: [
    { key: "start", label: "Animals released at the start", min: 5, max: 300, step: 1, default: 29 },
    { key: "rate", label: "Growth rate r (per year)", min: 0.05, max: 0.6, step: 0.01, default: 0.32 },
    { key: "capacity", label: "Carrying capacity K (animals)", min: 200, max: 6000, step: 50, default: 1600 },
    { key: "years", label: "Years since release", min: 0, max: 40, step: 0.5, default: 12 },
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
      art: { art: "planet", color: "#8a9a76", atmosphere: "#d8e6dc" } },
  ],
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
      id: "apart", name: "Kept apart, one species per tube",
      because: "P. aurelia settles at 105 cells per 0.5 mL, P. caudatum at 64.",
      art: { art: "glassware", which: "testTube", level: 0.72, color: "#4aa3d8" },
    },
    {
      id: "together", name: "Mixed, sharing one bacterial supply",
      because: "P. aurelia holds about 80. P. caudatum is gone by day 16.",
      art: { art: "glassware", which: "flask", level: 0.62, color: "#8e5bc4", precipitate: 0.28 },
    },
  ],
};

export const g7d1RunsOutFirst = buildSim(RUNS_OUT_FIRST);
export const g7d1WhereItLevels = buildSim(WHERE_IT_LEVELS);
export const g7d1StMatthew = buildSim(ST_MATTHEW);
export const g7d1TheDrySummer = buildSim(THE_DRY_SUMMER);
export const g7d1SameFoodBowl = buildSim(SAME_FOOD_BOWL);
