import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D6 — Biodiversity and ecosystem services.
 *
 * Five simulations, one per subtopic:
 *
 *   D6.1  g7d6-what-it-does-for-us  naming ecosystem services      (sort)
 *   D6.2  g7d6-half-the-forest      threats to biodiversity        (investigate)
 *   D6.3  g7d6-five-kinds-of-fix    named solution categories      (explore)
 *   D6.4  g7d6-dam-or-ladder        evaluating competing solutions (compare)
 *   D6.5  g7d6-fourteen-wolves      a solution for a real place    (process)
 *
 * The threat model is the species-area relationship, S = c A^z, with z near
 * 0.25 for habitat fragments. It is the one piece of conservation arithmetic
 * a student can actually do: leave a tenth of the habitat and 0.1^0.25 is
 * 0.56, so a little over half the species remain and the rest are committed
 * to extinction. Every case study quoted here is a real, published one.
 */

/** A patch of forest as its species go: full canopy through to a thin remnant. */
const REMNANT = ["#3f7f4a", "#5f8f4a", "#8a8f4a", "#a07f45", "#96684a"];

/**
 * Yellowstone's wolves: the counts the park itself reports. Fourteen released
 * in January 1995 and seventeen more in 1996, a peak of 174 in fourteen packs
 * in 2003, and about a hundred in ten packs today.
 */
const YELLOWSTONE_WOLVES: [number, number][] = [
  [1990, 0], [1994, 0], [1995, 14], [1996, 31], [2003, 174], [2024, 100],
];

/** The pack count in a given year, growing geometrically and falling straight. */
function wolvesIn(year: number): number {
  const c = YELLOWSTONE_WOLVES;
  if (year <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (year > c[i][0]) continue;
    const [y0, n0] = c[i - 1], [y1, n1] = c[i];
    const k = (year - y0) / (y1 - y0);
    return n0 > 0 && n1 > n0 ? n0 * (n1 / n0) ** k : n0 + (n1 - n0) * k;
  }
  return c[c.length - 1][1];
}

/* ---------------------------------------------------------------- *
 * D6.1 — Naming ecosystem services
 * ---------------------------------------------------------------- */

const WHAT_IT_DOES_FOR_US: ArchetypeSpec = {
  id: "g7d6-what-it-does-for-us",
  title: "What an Ecosystem Does For Us",
  tagline: "Eight things ecosystems provide, all of them measured. Put each in the right column.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-5"] },
  learningGoals: [
    "Name the four kinds of ecosystem service and give a measured example of each.",
    "Explain why services that nobody pays for are the easiest ones to lose.",
  ],
  misconceptions: [
    "Ecosystems are valuable only for the things we harvest from them",
    "A service with no price attached has no value",
  ],
  categories: [
    { id: "provisioning", name: "Provisioning", hint: "something we take away and use" },
    { id: "regulating", name: "Regulating", hint: "a process that keeps conditions steady" },
    { id: "supporting", name: "Supporting", hint: "the groundwork every other service needs" },
    { id: "cultural", name: "Cultural", hint: "what people go there for" },
  ],
  specimens: [
    {
      id: "fish", name: "Wild-caught fish", category: "provisioning",
      because: "Marine capture fisheries land about 90 million tonnes a year, and aquatic foods supply roughly 17 per cent of all the animal protein people eat.",
      art: { art: "sphere", color: "#4f8fb0", radius: 0.48 },
    },
    {
      id: "water", name: "Drinking water from a forested catchment", category: "provisioning",
      because: "New York City draws 4.5 million cubic metres a day from the Catskills without a filtration plant. Protecting the watershed cost about 1.5 billion dollars; the plant would have cost 6 to 8 billion.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "pollination", name: "Insect pollination of crops", category: "regulating",
      because: "About 75 per cent of the world's leading food crops benefit from animal pollination, worth an estimated 235 to 577 billion dollars of production a year.",
      art: { art: "sphere", color: "#e8c24a", radius: 0.44 },
    },
    {
      id: "mangrove", name: "A mangrove belt in front of a coast", category: "regulating",
      because: "A hundred metres of mangrove can cut wave height by up to two thirds, and mangrove soils hold three to five times more carbon per hectare than tropical upland forest.",
      art: { art: "cell", plant: true },
    },
    {
      id: "soil", name: "Soil formation", category: "supporting",
      because: "Soil forms at roughly 0.05 to 0.1 mm a year. Every crop on Earth grows in a layer that took ten thousand years to build and that one bad storm can strip.",
      art: { art: "glassware", which: "testTube", level: 0.55, color: "#8a6a4a", precipitate: 0.7 },
    },
    {
      id: "cycling", name: "Nutrient cycling by decomposers", category: "supporting",
      because: "Decomposers at Silver Springs handled 5 060 kcal per square metre per year, more than every animal there put together. Without them nitrogen and phosphorus stay locked inside dead tissue.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "parks", name: "National parks and the visits they carry", category: "cultural",
      because: "United States national parks took 325 million recreation visits in 2023 and supported about 55 billion dollars of economic output, none of it from anything the parks sell.",
      art: { art: "planet", color: "#3f7f5c", atmosphere: "#cfe8d8" },
    },
    {
      id: "reef", name: "A reef people travel to see", category: "cultural",
      because: "The Great Barrier Reef supports around 64 000 jobs and about 6.4 billion Australian dollars a year, nearly all of it from people who come simply to look at it.",
      art: { art: "sphere", color: "#e0708a", radius: 0.46, glow: 0.6 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D6.2 — Threats to biodiversity
 * ---------------------------------------------------------------- */

const HALF_THE_FOREST: ArchetypeSpec = {
  id: "g7d6-half-the-forest",
  title: "Take Half the Forest, Lose How Many Species?",
  tagline: "Shrink the habitat and count what is left, using the rule ecologists actually use.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-5"] },
  learningGoals: [
    "Use the species-area relationship to predict species loss from habitat loss.",
    "Explain why the first half of a habitat can be cleared with little visible loss and the last tenth cannot.",
  ],
  misconceptions: [
    "Clearing half a habitat loses half its species",
    "A species is safe as long as some of its habitat survives somewhere",
  ],
  specimens: [
    { id: "patch", name: "The forest that is left, drawn to its area",
      art: { art: "sphere", color: "#3f7f4a", radius: 0.5 } },
  ],
  variables: [
    { key: "habitat", label: "Habitat left (per cent of the original)", min: 1, max: 100, step: 1, default: 10 },
    { key: "zvalue", label: "Species-area exponent z", min: 0.15, max: 0.35, step: 0.01, default: 0.25 },
    { key: "species", label: "Species in the intact habitat", min: 20, max: 2000, step: 10, default: 300 },
  ],
  // S = c A^z, so the fraction of species that survives is (fraction of area)^z.
  // With the usual island value z = 0.25, keeping 50 per cent of the habitat
  // keeps 0.5^0.25 = 84 per cent of the species, while keeping 10 per cent
  // keeps only 0.1^0.25 = 56 per cent. Loss accelerates as area shrinks.
  measure: (v) => {
    const fraction = Math.pow(v.habitat / 100, v.zvalue);
    return {
      speciesRemaining: v.species * fraction,
      speciesLost: v.species * (1 - fraction),
      percentLost: 100 * (1 - fraction),
    };
  },
  plot: {
    x: "habitat", y: "speciesRemaining",
    xLabel: "Habitat left (per cent)", yLabel: "Species still present",
  },
  /*
   * The patch is drawn as ground seen from above, so its area is the habitat
   * area and its width is the square root of that: clear half the forest and
   * the patch is 71 per cent as wide, not half. Its colour is what is living
   * in it, and the two deliberately do not keep step.
   *
   * That mismatch is the whole subtopic. Going from 100 to 50 per cent the
   * patch halves in area and barely changes colour, because 0.5^0.25 still
   * keeps 84 per cent of the species. Going from 10 to 1 per cent it barely
   * changes size on screen and the colour falls away, because that last
   * stretch takes the remaining species from 56 per cent to 32.
   */
  drive: ({ f, v }) => {
    const lost = f.percentLost / 70;
    return {
      scale: 1.3 * Math.max(0.08, Math.sqrt(v.habitat / 100)),
      color: REMNANT[Math.min(4, Math.max(0, Math.floor(lost * 4.999)))],
      glow: 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D6.3 — Named solution categories
 * ---------------------------------------------------------------- */

const FIVE_KINDS_OF_FIX: ArchetypeSpec = {
  id: "g7d6-five-kinds-of-fix",
  title: "Six Kinds of Fix",
  tagline: "Every conservation project ever run is one of these six moves. Open each one.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-5"] },
  learningGoals: [
    "Name the main categories of biodiversity solution and give a measured example of each.",
    "Match a category of solution to the kind of threat it actually addresses.",
  ],
  misconceptions: [
    "Conservation means only fencing places off",
    "A species saved in a zoo is a species saved",
  ],
  specimens: [
    {
      id: "toolbox", name: "One planet, six ways to intervene",
      art: { art: "planet", color: "#2f6f8f", atmosphere: "#bfe0ee" },
      parts: [
        { id: "protect", name: "Protect what is left", at: [-0.56, -0.44],
          note: "Protected areas cover about 16 per cent of the land and 8 per cent of the ocean. The target agreed in 2022 is 30 per cent of each by 2030, which means roughly doubling the land and quadrupling the sea." },
        { id: "restore", name: "Restore what is gone", at: [0.58, -0.32],
          note: "The UN Decade on Ecosystem Restoration runs from 2021 to 2030. Restoring the 350 million hectares pledged would take up something like 1.7 gigatonnes of carbon dioxide a year." },
        { id: "reconnect", name: "Reconnect what was cut apart", at: [-0.62, -0.02],
          note: "Banff's wildlife overpasses and underpasses have cut large-mammal collisions on the Trans-Canada Highway by more than 80 per cent, and grizzlies, wolves and elk use them regularly." },
        { id: "remove", name: "Remove what does not belong", at: [0.6, 0.18],
          note: "South Georgia was declared rodent-free in 2018 after clearing rats from over 100 000 hectares, the largest eradication ever attempted. Pipits and pintails began recovering within three years." },
        { id: "breed", name: "Breed and return", at: [-0.5, 0.44],
          note: "The California condor was down to 22 wild birds in 1982, and all 27 survivors were in captivity by 1987. The population passed 500 in 2019, with more than half of them flying free." },
        { id: "use-better", name: "Change how we use it", at: [0.5, 0.46],
          note: "Sustainable use is a solution too. A fishery held at its maximum sustainable yield can be harvested indefinitely; the same stock fished half again above that collapses within decades, as the Grand Banks did." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D6.4 — Evaluating competing solutions
 * ---------------------------------------------------------------- */

const DAM_OR_LADDER: ArchetypeSpec = {
  id: "g7d6-dam-or-ladder",
  title: "Take the Dam Out, or Build a Ladder?",
  tagline: "One river, two proposals, two very different price tags. Weigh them against the criteria.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-5"] },
  learningGoals: [
    "Compare two solutions to the same ecosystem problem against stated criteria and constraints.",
    "Explain why the cheaper option is not automatically the better one once its success rate is counted.",
  ],
  misconceptions: [
    "The cheapest solution is the best solution",
    "Any passage past a barrier solves the problem for migrating fish",
  ],
  specimens: [
    {
      id: "removal", name: "Take the dams out: the share of the run that arrives",
      because: "The Elwha cost 325 million dollars for two dams and reopened about 110 km of river.",
      art: { art: "glassware", which: "beaker", level: 0.84, color: "#3f9ad0", bubbles: 0.4 },
    },
    {
      id: "ladder", name: "Fit ladders instead: the share of the run that arrives",
      because: "A few million dollars a dam, and a ladder typically passes only half the fish.",
      art: { art: "glassware", which: "beaker", level: 0.42, color: "#3f9ad0" },
    },
  ],
  variables: [
    { key: "dams", label: "Dams between the sea and the spawning gravel", min: 1, max: 6, step: 1, default: 2 },
    { key: "ladderPassPercent", label: "Fish a single ladder passes (%)", min: 30, max: 95, step: 5, default: 50 },
  ],
  /*
   * Both proposals judged on the same number: out of every hundred adults
   * that leave the sea, how many reach the gravel?
   *
   * Removal answers that with a hundred, because there is nothing left to
   * climb. Ladders answer it with the pass rate multiplied by itself once per
   * dam, and that is the part people get wrong: two ladders at a
   * well-regarded 50 per cent pass a quarter of the run, and six pass one
   * fish in sixty-four. A run needs something like a quarter of its adults
   * home to hold its numbers, so a river with three or more ladders is being
   * managed down however good each ladder is.
   *
   * The cost runs the other way, which is why this is a trade-off and not a
   * right answer: the two Elwha dams cost 325 million dollars to take out,
   * against a few million for a ladder. Removal also empties whatever the
   * reservoir was holding - about 20 million cubic metres of sediment on the
   * Elwha - and the river runs brown for two or three years afterwards.
   */
  measure: (v) => {
    const perLadder = v.ladderPassPercent / 100;
    const ladderArrival = 100 * perLadder ** v.dams;
    return {
      removalArrivalPercent: 100,
      ladderArrivalPercent: ladderArrival,
      timesBetterWithRemoval: 100 / Math.max(0.01, ladderArrival),
      removalCostMillionDollars: 162.5 * v.dams,
      ladderCostMillionDollars: 5 * v.dams,
      sedimentReleasedMillionM3: 10 * v.dams,
    };
  },
  /*
   * Two identical jars, one per proposal, each holding the share of the run
   * that gets home. The removal jar stays full whatever the slider does -
   * that is what taking a barrier out means - but it clouds with the
   * sediment the reservoirs were holding, which is the real cost of the
   * cheaper-looking picture.
   *
   * The ladder jar empties as dams are added, and turns red once it is below
   * the quarter of the run the population needs to replace itself. Two jars,
   * one number, and the argument is settled by looking at them.
   */
  drive: ({ f, v, index }) => {
    if (index === 0) {
      const silt = Math.min(0.8, 0.12 * v.dams);
      return {
        level: 0.84,
        precipitate: silt,
        color: silt > 0.45 ? "#8f7a55" : silt > 0.2 ? "#5f8f9a" : "#3f9ad0",
      };
    }
    const arrival = f.ladderArrivalPercent;
    return {
      level: 0.04 + 0.8 * (arrival / 100),
      color: arrival < 25 ? "#c0503a" : "#3f9ad0",
    };
  },
};

/* ---------------------------------------------------------------- *
 * D6.5 — A biodiversity solution for a real ecosystem
 * ---------------------------------------------------------------- */

const FOURTEEN_WOLVES: ArchetypeSpec = {
  id: "g7d6-fourteen-wolves",
  title: "Fourteen Wolves",
  tagline: "A real reintroduction, thirty years of monitoring, and an argument that is still open.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-5"] },
  learningGoals: [
    "Follow one biodiversity solution from problem to measured outcome in a real ecosystem.",
    "Judge how strongly the evidence supports a claimed effect, and say what else could explain it.",
  ],
  misconceptions: [
    "Putting a species back always restores the ecosystem it left",
    "A striking before-and-after picture is by itself good evidence",
  ],
  specimens: [
    { id: "wolf", name: "The wolves in the park, drawn to their number",
      art: { art: "sphere", color: "#78808e", radius: 0.5 } },
  ],
  variables: [
    { key: "year", label: "Year", min: 1990, max: 2025, step: 1, default: 1990 },
  ],
  /*
   * The park's own counts, and nothing between them but interpolation: none
   * at all from 1926 to 1994, fourteen released in January 1995, thirty-one
   * after the 1996 release, a peak of 174 in fourteen packs in 2003, and
   * about a hundred in ten packs now. Yellowstone is 8 991 square kilometres,
   * so even the peak was two wolves per hundred square kilometres.
   */
  measure: (v) => {
    const wolves = wolvesIn(v.year);
    return {
      wolves,
      wolvesPer100SquareKm: (wolves * 100) / 8991,
      yearsSinceRelease: Math.max(0, v.year - 1995),
      percentOfPeak: (100 * wolves) / 174,
    };
  },
  /*
   * The pack is drawn as a disc, so its area is the number of wolves and its
   * width the square root: the fourteen of January 1995 are a third the width
   * of the 174 of 2003, not a twelfth.
   *
   * Before 1995 there is nothing to draw. The disc collapses to a speck and
   * stops turning, because for sixty-nine years there was not one wolf in the
   * park - which is the state the whole reintroduction was answering, and the
   * one a student should see when they drag the year back.
   */
  drive: ({ f }) => {
    const gone = f.wolves < 1;
    return {
      scale: gone ? 0.07 : 1.35 * Math.sqrt(f.wolves / 174),
      color: gone ? "#b9bcc4" : "#78808e",
      rate: gone ? 0 : 1,
    };
  },
  stages: [
    { name: "1926", at: 0,
      caption: "The last wolf pack in Yellowstone is killed. Elk numbers climb and streamside willow and aspen stop regenerating." },
    { name: "January 1995", at: 0.2,
      caption: "Fourteen wolves from Alberta are released, seventeen more in 1996: 31 animals into 9 000 square kilometres." },
    { name: "By 2003", at: 0.4,
      caption: "About 174 wolves in 14 packs. The northern elk herd is down from roughly 19 000 in 1994 to about 9 500." },
    { name: "The 2000s", at: 0.6,
      caption: "Willow and aspen grow above browse height in some valleys, and beaver colonies rise from one in 1996 to nine by 2009." },
    { name: "The caveat", at: 0.8,
      caption: "How much of that is the wolves is still argued: drought, bison and bears all changed too. A solution has to be measured, not assumed." },
    { name: "Today", at: 1,
      caption: "About 100 wolves in ten packs. Roughly 3.5 per cent of visitors come to see them, worth some 35 million dollars a year." },
  ],
};

export const g7d6WhatItDoesForUs = buildSim(WHAT_IT_DOES_FOR_US);
export const g7d6HalfTheForest = buildSim(HALF_THE_FOREST);
export const g7d6FiveKindsOfFix = buildSim(FIVE_KINDS_OF_FIX);
export const g7d6DamOrLadder = buildSim(DAM_OR_LADDER);
export const g7d6FourteenWolves = buildSim(FOURTEEN_WOLVES);
