import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F6 — Human population, consumption and impact.
 *
 * Five simulations, one per subtopic:
 *
 *   F6.1  g8f6-how-many-of-us       population growth as one multiplier   (investigate)
 *   F6.2  g8f6-other-multiplier     per-capita consumption as the other   (compare)
 *   F6.3  g8f6-build-the-argument   an argument from real data            (assemble)
 *   F6.4  g8f6-species-area         impact on biodiversity                (investigate)
 *   F6.5  g8f6-which-lever          management options and trade-offs     (sort)
 *
 * The whole topic hangs on one identity, I = P x A x T: impact is the number
 * of people multiplied by what each consumes multiplied by the impact of
 * producing it. F6.1 and F6.2 take the two multipliers one at a time with the
 * real figures — 8.0 billion people in 2022, a world average of 4.7 tonnes of
 * CO2 each, and 37.4 billion tonnes emitted in 2023. F6.4 uses the
 * species-area relationship S = cA^z with the standard exponent z = 0.25, so
 * a forest cut to a tenth of its area keeps 56 per cent of its species.
 */

/** Blend two hex colours. Cheap enough for a per-frame `drive`. */
function mix(a: string, b: string, t: number): string {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const two = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  const ch = (i: number) =>
    two(parseInt(a.slice(i, i + 2), 16) +
      (parseInt(b.slice(i, i + 2), 16) - parseInt(a.slice(i, i + 2), 16)) * k);
  return `#${ch(1)}${ch(3)}${ch(5)}`;
}

const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

/* ---------------------------------------------------------------- *
 * F6.1 — Population growth as one multiplier
 * ---------------------------------------------------------------- */

const HOW_MANY_OF_US: ArchetypeSpec = {
  id: "g8f6-how-many-of-us",
  title: "How Many of Us There Are",
  tagline: "Eight billion people, growing at nine tenths of one per cent a year. Run it forward.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-4"] },
  learningGoals: [
    "Calculate future population from a growth rate and predict its doubling time.",
    "Explain that a small percentage growth rate compounds into a very large change.",
  ],
  misconceptions: [
    "World population is growing faster than ever",
    "A one per cent growth rate is too small to matter",
  ],
  specimens: [
    {
      id: "earth", name: "Earth, and everybody on it",
      art: { art: "planet", color: "#2f6fb0", atmosphere: "#9ec9e8" },
    },
  ],
  variables: [
    {
      key: "growthPercent", label: "Annual growth rate", unit: "%",
      min: 0, max: 3, step: 0.05, default: 0.9,
    },
    { key: "years", label: "Years from 2023", min: 0, max: 100, step: 1, default: 50 },
  ],
  /*
   * Compound growth, P = P0 (1 + r)^t, from the real starting point: the
   * eight-billionth person was counted in November 2022.
   *
   * The rate slider spans the whole of the modern range. World population grew
   * at 2.1 per cent a year at its 1968 peak, which doubles in 33 years and is
   * exactly what happened — 3.5 billion in 1968, 7 billion in 2011. It is now
   * about 0.9 per cent, which doubles in 77, and the UN's medium projection of
   * 9.7 billion by 2050 corresponds to slower growth still.
   */
  measure: (v) => {
    const r = v.growthPercent / 100;
    const future = 8.0 * Math.pow(1 + r, v.years);
    return {
      futureBillions: future,
      addedBillions: future - 8.0,
      doublingTimeYears: r > 0 ? Math.log(2) / Math.log(1 + r) : 0,
      netPeoplePerSecond: (8.0e9 * r) / 31557600,
      timesTodaysPopulation: future / 8.0,
    };
  },
  plot: {
    x: "growthPercent", y: "futureBillions",
    xLabel: "Annual growth rate (%)", yLabel: "Population after the set time (billions)",
  },
  /*
   * The planet carries the load it is being asked to carry. People fill a
   * volume, so the drawn width is the cube root of how many times today's
   * population the number has become: four times the people is only 1.59 times
   * as wide, which is the honest picture and still a very obvious one. The
   * blue drains towards the brown of cleared and built land as the multiplier
   * climbs, because that is what the extra people are standing on.
   */
  drive: ({ f }) => ({
    scale: clamp(Math.cbrt(f.timesTodaysPopulation), 0.8, 1.35),
    color: mix("#2f6fb0", "#b8703a", clamp((f.timesTodaysPopulation - 1) / 3.4, 0, 1)),
  }),
};

export const g8f6HowManyOfUs = buildSim(HOW_MANY_OF_US);

/* ---------------------------------------------------------------- *
 * F6.2 — Per-capita consumption as the other multiplier
 * ---------------------------------------------------------------- */

const OTHER_MULTIPLIER: ArchetypeSpec = {
  id: "g8f6-other-multiplier",
  title: "The Same Billion People, Two Appetites",
  tagline: "Put a billion people on each side. Change only what each of them uses.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-4"] },
  learningGoals: [
    "Show that total impact is the number of people multiplied by the impact of each.",
    "Compare real per-capita emissions and explain why headcount alone predicts nothing.",
  ],
  misconceptions: [
    "The countries with the most people must cause the most impact",
    "Per-person consumption is roughly the same everywhere",
  ],
  specimens: [
    {
      id: "low", name: "A billion people at 2.0 tonnes of CO2 each",
      because: "India's average in 2022 was 2.0 tonnes of CO2 per person per year, and Nigeria's was 0.6. A billion such people put up 2.0 billion tonnes a year between them.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "high", name: "A billion people at the rate you set",
      because: "The United States averaged 14.9 tonnes per person in 2022, China 8.0, the European Union 6.2, and the world as a whole 4.7. At 14.9 the same billion people put up more than seven times as much.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
  variables: [
    {
      key: "perCapitaTonnes", label: "Tonnes of CO2 per person per year, right-hand group",
      min: 0, max: 20, step: 0.1, default: 14.9,
    },
    {
      key: "billions", label: "People in each group", unit: "bn",
      min: 0.1, max: 2, step: 0.1, default: 1,
    },
  ],
  /*
   * A billion people times a tonne each is a billion tonnes, so the arithmetic
   * is a single multiplication and every figure in it is published. The
   * left-hand group is fixed at India's 2022 average of 2.0 tonnes; the right
   * hand one is whatever the slider says, with the United States at 14.9 as
   * the default. World fossil CO2 in 2023 was 37.4 billion tonnes, so the two
   * columns together can be compared against a real global total.
   */
  measure: (v) => {
    const lowGt = v.billions * 2.0;
    const highGt = v.billions * v.perCapitaTonnes;
    return {
      lowGroupGtPerYear: lowGt,
      highGroupGtPerYear: highGt,
      timesAsMuch: v.perCapitaTonnes / 2.0,
      bothGroupsGtPerYear: lowGt + highGt,
      shareOfWorldEmissionsPercent: ((lowGt + highGt) / 37.4) * 100,
      worldAveragePerPersonTonnes: 4.7,
    };
  },
  /*
   * Each column is the gas that group puts up in a year, drawn at the cube
   * root of the tonnage against the American default as the reference, so
   * seven times the emissions is not seven times the width but 1.9 times it.
   * The left-hand molecule answers the headcount slider only, the right-hand
   * one answers both — which is the whole argument. Take per-person emissions
   * to zero and that column disappears while the population is unchanged.
   */
  drive: ({ f, index }) => {
    const reference = 14.9;
    if (index === 0) return { scale: clamp(Math.cbrt(f.lowGroupGtPerYear / reference), 0.2, 1.05) };
    return { scale: clamp(Math.cbrt(f.highGroupGtPerYear / reference), 0.16, 1.05) };
  },
};

export const g8f6OtherMultiplier = buildSim(OTHER_MULTIPLIER);

/* ---------------------------------------------------------------- *
 * F6.3 — Constructing an argument from real data
 * ---------------------------------------------------------------- */

const BUILD_THE_ARGUMENT: ArchetypeSpec = {
  id: "g8f6-build-the-argument",
  title: "Build the Argument From Real Data",
  tagline: "A claim is worth nothing until you can put the numbers under it. Add them one at a time.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-4"] },
  learningGoals: [
    "Construct an argument supported by evidence for how human activity affects Earth's systems.",
    "Identify the counterclaim an argument has to answer to be worth making.",
  ],
  misconceptions: [
    "An argument is a strong opinion",
    "One number is enough to settle a question about the whole planet",
  ],
  specimens: [
    {
      id: "earth",
      name: "The claim, and everything holding it up",
      art: { art: "planet", color: "#2f6fb0", atmosphere: "#9ec9e8" },
      parts: [
        {
          id: "claim", name: "The claim", at: [0, -0.5],
          note: "Human activity is changing the atmosphere, and the size of the change is how many of us there are times what each of us uses.",
        },
        {
          id: "population", name: "Evidence: how many of us", at: [-0.44, -0.26],
          note: "2.5 billion people in 1950; the eight-billionth was counted in November 2022. The UN's medium projection is 9.7 bn by 2050.",
        },
        {
          id: "consumption", name: "Evidence: how much each of us uses", at: [0.44, -0.10],
          note: "Fossil CO2 per person in 2022: world 4.7 tonnes, USA 14.9, China 8.0, EU 6.2, India 2.0, Nigeria 0.6. A factor of twenty-five.",
        },
        {
          id: "product", name: "Evidence: the two multiplied together", at: [-0.44, 0.12],
          note: "37.4 billion tonnes of fossil CO2 in 2023, the largest ever recorded and about 45 per cent above 1990. Neither factor alone.",
        },
        {
          id: "air", name: "Evidence: what happened to the air", at: [0.44, 0.30],
          note: "CO2 was 280 ppm before 1750, 315 when Keeling began at Mauna Loa in 1958, and 424 in 2024. Ice cores never top 300 ppm.",
        },
        {
          id: "counter", name: "Reasoning, and the counterclaim it must answer", at: [0, 0.5],
          note: "Blame only population and you are answered with 14.9 tonnes; blame only consumption and you are answered with 9.7 billion.",
        },
      ],
    },
  ],
};

export const g8f6BuildTheArgument = buildSim(BUILD_THE_ARGUMENT);

/* ---------------------------------------------------------------- *
 * F6.4 — Impact on biodiversity specifically
 * ---------------------------------------------------------------- */

const SPECIES_AREA: ArchetypeSpec = {
  id: "g8f6-species-area",
  title: "Cut the Forest, Count the Species",
  tagline: "Take away nine tenths of a forest and you do not lose nine tenths of its species. You lose almost half.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-4", "MS-LS2-4"] },
  learningGoals: [
    "Use the species-area relationship to predict species loss from habitat loss.",
    "Explain why habitat loss is the leading cause of extinction today.",
  ],
  misconceptions: [
    "Species loss is proportional to habitat loss",
    "A small patch of habitat will keep a small share of the species indefinitely",
  ],
  specimens: [
    {
      id: "block", name: "The block of forest that is left",
      art: { art: "habitat", which: "forest" },
    },
  ],
  variables: [
    {
      key: "habitatPercent", label: "Habitat left", unit: "%",
      min: 4, max: 100, step: 1, default: 50,
    },
    {
      key: "z", label: "Species-area exponent (z)",
      min: 0.15, max: 0.35, step: 0.01, default: 0.25,
    },
  ],
  /*
   * The species-area relationship, S = c A^z, measured on islands and on
   * habitat fragments for a century. The exponent z is typically 0.20 to 0.35
   * for true islands and near 0.25 for continental habitat blocks, so the
   * share of species kept is simply (A/A0)^z.
   *
   * Halve a forest and 84 per cent of its species can persist. Cut it to a
   * tenth and 56 per cent can. Cut it to a twenty-fifth and fewer than half
   * can. Against that, the 2024 Living Planet Index reports an average 73 per
   * cent decline in the size of monitored vertebrate populations since 1970,
   * and extinction rates today run roughly a hundred to a thousand times the
   * fossil background of 0.1 to 1 extinction per million species-years.
   */
  measure: (v) => {
    const fraction = v.habitatPercent / 100;
    const kept = Math.pow(fraction, v.z);
    return {
      speciesKeptPercent: kept * 100,
      speciesLostPercent: (1 - kept) * 100,
      speciesLeftOfTenThousand: 10000 * kept,
      areaLeftKm2: 10000 * fraction,
      areaLostKm2: 10000 * (1 - fraction),
      lossPerAreaLostRatio: fraction < 1 ? (1 - kept) / (1 - fraction) : 0,
    };
  },
  plot: {
    x: "habitatPercent", y: "speciesKeptPercent",
    xLabel: "Habitat remaining (%)", yLabel: "Species that can persist (%)",
  },
  /*
   * The block on the bench is the habitat that is left, drawn at the square
   * root of the area — because area goes as the square of the width, a block
   * with a quarter of the area is half as wide. At 4 per cent left it is a
   * fifth the size of the original and holds less than half the species, and
   * the picture and the graph are saying the same thing in two languages.
   */
  drive: ({ v }) => ({
    scale: clamp(Math.sqrt(v.habitatPercent / 100), 0.2, 1),
  }),
};

export const g8f6SpeciesArea = buildSim(SPECIES_AREA);

/* ---------------------------------------------------------------- *
 * F6.5 — Presenting management options with trade-offs
 * ---------------------------------------------------------------- */

const WHICH_LEVER: ArchetypeSpec = {
  id: "g8f6-which-lever",
  title: "Which Lever Does It Pull?",
  tagline: "Eight things people actually propose. Each pulls one lever, and each costs something.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-4", "MS-ETS1-1"] },
  learningGoals: [
    "Classify a management option by which part of population, consumption, technology or protection it changes.",
    "State the trade-off that comes with a proposed solution as well as its benefit.",
  ],
  misconceptions: [
    "There is one solution that fixes everything",
    "A solution with a trade-off is not worth doing",
  ],
  categories: [
    { id: "people", name: "Fewer people (P)", hint: "changes how many of us there will be" },
    { id: "amount", name: "Less each (A)", hint: "changes how much a person consumes" },
    { id: "tech", name: "Cleaner technology (T)", hint: "changes the impact per unit consumed" },
    { id: "protect", name: "Protect it directly", hint: "puts a fence round the habitat itself" },
  ],
  specimens: [
    {
      id: "school", name: "Girls finishing secondary school", category: "people",
      because: "Where women complete secondary education, average family size falls by one to two children, and it stays fallen. The trade-off is time: fertility falling today changes the population only decades later, because the children already born still grow up.",
      art: { art: "body", which: "figure" },
    },
    {
      id: "vaccines", name: "Childhood vaccination programmes", category: "people",
      because: "Counter-intuitive but well documented: where nearly every child survives, parents choose to have fewer. Every country that has pushed child mortality below about 2 per cent has seen family size fall within a generation. The trade-off is that it costs money now for an effect that arrives in twenty years.",
      art: { art: "microbe", which: "virus" },
    },
    {
      id: "beef", name: "Eating beef once a month instead of twice a week", category: "amount",
      because: "Beef costs about 99 kg of CO2-equivalent per kilogram of meat, against 9.9 for chicken and 0.9 for peas. The trade-off is that it is a decision millions of people have to make one at a time, and grassland grazing supports people on land that grows nothing else.",
      art: { art: "creature", which: "deer" },
    },
    {
      id: "repair", name: "Repairing a phone instead of replacing it", category: "amount",
      because: "About 80 per cent of a phone's lifetime emissions are spent making it, so keeping one for four years instead of two nearly halves them. The trade-off is that it needs spare parts, manuals and a legal right to repair, none of which manufacturers have given willingly.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "led", name: "Swapping every filament bulb for an LED", category: "tech",
      because: "The same 800 lumens from 8 watts instead of 57, and nobody has to change what they do. The trade-off is size: lighting is only about 5 per cent of household electricity, so even a perfect swap is a thin slice of the problem.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "renewables", name: "Wind and solar in place of a coal station", category: "tech",
      because: "Over a full life cycle coal emits about 820 g of CO2-equivalent per kilowatt-hour, onshore wind about 11 and solar photovoltaic about 48. The trade-off is that neither is there on demand, so it needs storage, a grid that reaches a long way, or both.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
    {
      id: "mpa", name: "A no-take marine protected area", category: "protect",
      because: "Fully protected reserves hold on average about 670 per cent more fish biomass than fished areas nearby, and the surplus spills over the boundary. The trade-off is immediate and local: the fishing families who used that ground lose it, and enforcement at sea is expensive.",
      art: { art: "habitat", which: "ocean" },
    },
    {
      id: "wetland", name: "Restoring a drained wetland", category: "protect",
      because: "Wetlands hold a disproportionate share of freshwater species and store carbon in waterlogged peat instead of releasing it. The trade-off is that the land is usually farmland now, so somebody's field and somebody's income are the price, and restoration takes decades to reach the old species richness.",
      art: { art: "habitat", which: "pond" },
    },
  ],
};

export const g8f6WhichLever = buildSim(WHICH_LEVER);
