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
    { id: "variety", name: "The genetic variety a habitat holds", art: { art: "dna" } },
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
      id: "removal", name: "Take the dams out",
      because: "The Elwha cost 325 million dollars and reopened about 110 km of river.",
      art: { art: "glassware", which: "beaker", level: 0.78, color: "#3f9ad0", bubbles: 0.6 },
    },
    {
      id: "ladder", name: "Fit fish ladders instead",
      because: "Far cheaper per dam, but a ladder typically passes only half the fish.",
      art: { art: "apparatus", which: "stand" },
    },
  ],
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
    { id: "wolf", name: "Grey wolf, absent from the park for 69 years",
      art: { art: "sphere", color: "#78808e", radius: 0.5 } },
  ],
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
