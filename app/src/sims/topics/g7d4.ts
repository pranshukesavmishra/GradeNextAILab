import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D4 — Patterns of interaction among organisms.
 *
 * Five simulations, one per subtopic:
 *
 *   D4.1  g7d4-wolves-and-moose  competition and predation        (investigate)
 *   D4.2  g7d4-who-gains         mutualism, commensalism, parasitism (sort)
 *   D4.3  g7d4-same-deal-twice   one pattern, two ecosystems      (compare)
 *   D4.4  g7d4-when-it-turns     interactions that shift          (process)
 *   D4.5  g7d4-ten-year-rhythm   interactions and population change (trace)
 *
 * The predation numbers are a forage budget, not a guess: a wolf needs about
 * 1.7 kg of meat a day, an adult moose yields about 180 kg of it, so one wolf
 * needs 3.4 moose a year and a pack of twenty takes about seven per cent of a
 * thousand-strong herd. That is the rate actually measured on Isle Royale.
 * Inside the pack the same wolves compete with one another for those kills,
 * which is why predation and competition are two views of one meal.
 */

/** Isle Royale from the air: unbrowsed forest through to a browsed-out island. */
const FOREST = ["#5f8f4a", "#7d9a52", "#9a9a55", "#a88a4f", "#a8703f"];

/** A coral colony: full of algae, paling, bleached white, then dead and turfed over. */
const CORAL = ["#b5763c", "#c99a63", "#ddc3a4", "#f2efe8", "#8b9478"];

/* ---------------------------------------------------------------- *
 * D4.1 — Competition and predation
 * ---------------------------------------------------------------- */

const WOLVES_AND_MOOSE: ArchetypeSpec = {
  id: "g7d4-wolves-and-moose",
  title: "How Much Moose Does a Wolf Pack Need?",
  tagline: "Work out the pack's yearly food bill, then see what share of the herd that is.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "Calculate a predator population's demand on its prey from daily food needs and prey mass.",
    "Distinguish predation, where one population eats another, from competition, where two need the same resource.",
  ],
  misconceptions: [
    "Predators wipe out their prey if they are not controlled",
    "Competition only happens between different species",
  ],
  specimens: [
    { id: "island", name: "Isle Royale: 544 square kilometres, one herd, one pack",
      art: { art: "planet", color: "#3f6b4c", atmosphere: "#cde5d4" } },
  ],
  variables: [
    { key: "moose", label: "Moose in the herd", min: 200, max: 2500, step: 10, default: 1000 },
    { key: "wolves", label: "Wolves on the island", min: 0, max: 50, step: 1, default: 20 },
    { key: "intake", label: "Meat one wolf needs (kg per day)", min: 1, max: 3, step: 0.1, default: 1.7 },
  ],
  // A wolf eating 1.7 kg a day needs 620 kg of meat a year. An adult moose
  // yields about 180 kg of edible meat, so one wolf needs 3.4 moose and a pack
  // of 20 needs 69 - about 7 per cent of a herd of a thousand, which is the
  // share Isle Royale wolves have actually been measured taking.
  //
  // What that share means for the island is the other half of the sum. An
  // unhunted moose herd adds about 20 per cent a year, so the herd grows by
  // 20 less whatever the wolves take, and the island's 544 square kilometres
  // then carry that many moose. Isle Royale's long-run average is about 1.7
  // moose per square kilometre; balsam fir stops regenerating above roughly 3,
  // and it was at 4.4 in 1995, the year before 80 per cent of the herd died in
  // one winter.
  measure: (v) => {
    const perWolf = (v.intake * 365) / 180;
    const killed = perWolf * v.wolves;
    const takenPercent = v.moose > 0 ? (100 * killed) / v.moose : 0;
    const nextYear = v.moose * (1 + (20 - takenPercent) / 100);
    return {
      moosePerWolfPerYear: perWolf,
      mooseKilledPerYear: killed,
      percentOfHerdTaken: takenPercent,
      herdChangePercent: 20 - takenPercent,
      moosePerSquareKm: v.moose / 544,
      moosePerSquareKmNextYear: nextYear / 544,
    };
  },
  plot: {
    x: "wolves", y: "percentOfHerdTaken",
    xLabel: "Wolves on the island", yLabel: "Share of the herd taken each year (per cent)",
  },
  /*
   * The island is the readout, seen from above. Its colour is the browse: at
   * well under one moose per square kilometre the balsam fir and aspen grow
   * away unbrowsed and the island is dark green; by three per square kilometre
   * the fir cannot regenerate at all and the island is the brown of a browsed
   * shoreline.
   *
   * Both controls move it, which is the lesson. Add moose and the island
   * browns; add wolves and it recovers, because the predator is the only
   * thing on Isle Royale that takes moose out. The brown end is not a
   * hypothetical: 1995 reached 4.4 moose per square kilometre and the
   * following winter killed four fifths of them.
   */
  drive: ({ f }) => {
    const pressure = f.moosePerSquareKmNextYear / 4;
    return {
      color: FOREST[Math.min(4, Math.max(0, Math.floor(pressure * 4.999)))],
    };
  },
};

/* ---------------------------------------------------------------- *
 * D4.2 — Mutualism, commensalism and parasitism
 * ---------------------------------------------------------------- */

const WHO_GAINS: ArchetypeSpec = {
  id: "g7d4-who-gains",
  title: "Who Gains, Who Pays?",
  tagline: "Six partnerships. For each one, work out what the second partner gets out of it.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "Classify a relationship as mutualism, commensalism or parasitism from the effect on each partner.",
    "Explain that the category depends on measured costs and benefits, not on how close the two organisms live.",
  ],
  misconceptions: [
    "Any two species that live together are helping each other",
    "A parasite kills its host",
  ],
  categories: [
    { id: "mutualism", name: "Mutualism", hint: "both partners measurably gain" },
    { id: "commensalism", name: "Commensalism", hint: "one gains, the other is unaffected" },
    { id: "parasitism", name: "Parasitism", hint: "one gains at the other's measurable cost" },
  ],
  specimens: [
    {
      id: "clover", name: "Clover and its root-nodule bacteria", category: "mutualism",
      because: "Rhizobium fixes 100 to 200 kg of nitrogen per hectare per year and hands it to the clover. The clover pays in sugar, up to about a fifth of everything it photosynthesises, and still comes out ahead.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "coral", name: "Coral and the algae in its tissue", category: "mutualism",
      because: "One to two million algal cells live in every square centimetre of coral tissue and supply up to 95 per cent of the coral's energy. The coral supplies carbon dioxide, nitrogen and a lit place to sit.",
      art: { art: "organelle", which: "chloroplast" },
    },
    {
      id: "egret", name: "Cattle egret walking with a buffalo", category: "commensalism",
      because: "The buffalo's feet flush grasshoppers, and an egret following one catches about 50 per cent more prey per step than it would alone. The buffalo's feeding, weight and calves are unchanged.",
      art: { art: "sphere", color: "#ece6d8", radius: 0.46 },
    },
    {
      id: "barnacle", name: "Barnacles riding on a grey whale", category: "commensalism",
      because: "A grey whale can carry 180 kg of barnacles. They get a free ride through plankton-rich water, and on a 30 tonne whale that load is under 1 per cent of its mass with no measured cost.",
      art: { art: "sphere", color: "#b6ada0", radius: 0.44 },
    },
    {
      id: "tick", name: "Winter ticks on a moose", category: "parasitism",
      because: "A moose in a bad year carries 50 000 winter ticks. Each engorged female takes several millilitres, so across one winter they draw off more blood than the moose holds at any moment, and calves die of it.",
      art: { art: "sphere", color: "#7a4738", radius: 0.42 },
    },
    {
      id: "mistletoe", name: "Mistletoe growing in an oak", category: "parasitism",
      because: "It photosynthesises for itself but taps the oak for water and minerals, and it transpires two to four times faster than its host. A heavily infected branch loses 20 to 30 per cent of its growth.",
      art: { art: "cell", plant: true },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D4.3 — The same pattern in very different ecosystems
 * ---------------------------------------------------------------- */

const SAME_DEAL_TWICE: ArchetypeSpec = {
  id: "g7d4-same-deal-twice",
  title: "The Same Deal, Twice",
  tagline: "A reef and a savanna, no species in common, and exactly the same bargain.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "Recognise the same interaction pattern in two ecosystems with no species in common.",
    "Explain why a pattern of interaction, not a list of species, is what transfers between ecosystems.",
  ],
  misconceptions: [
    "Every ecosystem works by its own separate rules",
    "Two organisms must be closely related to have the same kind of relationship",
  ],
  specimens: [
    {
      id: "wrasse", name: "Cleaner wrasse on a coral reef",
      because: "It inspects about 2 300 client fish a day and eats 1 200 parasites.",
      art: { art: "sphere", color: "#2fc0d8", radius: 0.52, glow: 0.6 },
    },
    {
      id: "oxpecker", name: "Red-billed oxpecker on a buffalo",
      because: "One bird can take more than 100 engorged ticks in a day.",
      art: { art: "sphere", color: "#c9502f", radius: 0.4 },
    },
  ],
  variables: [
    { key: "parasiteLoadPercent", label: "Parasites on the hosts, against a normal year (%)", min: 0, max: 200, step: 5, default: 100 },
  ],
  /*
   * Two cleaners, one bargain, and one measured meal each.
   *
   * A cleaner wrasse on the Great Barrier Reef inspects about 2 300 client
   * fish a day and takes some 1 200 parasitic gnathiid isopods off them. A
   * red-billed oxpecker takes over 100 engorged ticks a day off a buffalo.
   * Different oceans, different continents, no species in common - and the
   * same trade: the cleaner is fed and the host is deloused.
   *
   * The same bargain also fails the same way. Where parasites are scarce both
   * cleaners turn on the host: the wrasse takes mucus off the client's skin
   * instead, and the oxpecker drinks blood and keeps existing wounds open.
   * Below about a fifth of a normal load there is not enough on the host to
   * pay for the cleaning, and a mutualism becomes a parasitism.
   */
  measure: (v) => {
    const share = v.parasiteLoadPercent / 100;
    return {
      wrasseParasitesPerDay: 1218 * share,
      oxpeckerTicksPerDay: 100 * share,
      wrasseClientsPerDay: 2297,
      hostsCleanedPerDay: 2297 * Math.min(1, share),
      cheating: v.parasiteLoadPercent < 20 ? 1 : 0,
    };
  },
  /*
   * Each cleaner is drawn at the size of its meal, not the size of the
   * animal: the cube root of the day's catch against a normal year, so both
   * respond to the same control by the same rule and can be read against
   * each other.
   *
   * Take the parasites away and both shrink together, and both turn red at
   * the same point - the wrasse biting mucus, the oxpecker drinking blood.
   * One pattern, twice, including the way it breaks.
   */
  drive: ({ f, v }) => {
    const share = Math.max(0.01, v.parasiteLoadPercent / 100);
    const cheating = f.cheating > 0;
    return {
      scale: 1.25 * Math.max(0.3, Math.cbrt(share)),
      color: cheating ? "#b0342a" : undefined,
      glow: cheating ? 0.9 : Math.min(0.7, share * 0.4),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D4.4 — Interactions that shift over time or condition
 * ---------------------------------------------------------------- */

const WHEN_IT_TURNS: ArchetypeSpec = {
  id: "g7d4-when-it-turns",
  title: "When a Partnership Turns",
  tagline: "Warm the water one degree at a time and watch a mutualism become a liability.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "Describe how an interaction can change category when conditions change.",
    "Explain coral bleaching as a partnership breaking down, not as the coral dying immediately.",
  ],
  misconceptions: [
    "A relationship between two species is fixed for good",
    "Bleached coral is dead coral",
  ],
  specimens: [
    { id: "colony", name: "A branching coral, one to two million algae per square centimetre",
      art: { art: "sphere", color: "#b5763c", radius: 0.5 } },
  ],
  variables: [
    { key: "degreeWeeks", label: "Degree heating weeks above the summer maximum", min: 0, max: 12, step: 0.5, default: 0 },
  ],
  /*
   * Heat stress on a reef is counted in degree heating weeks: one week at one
   * degree above the hottest month's average is one DHW, and they add up
   * across a summer. It is the measure NOAA issues its reef warnings in.
   *
   * Bleaching starts at about 4 DHW, where a coral has lost 60 to 90 per cent
   * of its algae, and widespread death begins at about 8. On the Great
   * Barrier Reef in 2016 the worst-hit reefs ran past 8 DHW and about 29 per
   * cent of shallow-water corals died. The algae supply up to 95 per cent of
   * the coral's energy, so what is left of them is what is left of its food.
   */
  measure: (v) => {
    const algaePercent = 100 * Math.max(0, 1 - Math.max(0, v.degreeWeeks - 1) / 5);
    const mortalityPercent = Math.min(100, Math.max(0, (v.degreeWeeks - 8) * 15));
    return {
      algaePercent,
      algaePerSquareCm: 1.5e6 * (algaePercent / 100),
      energyFromAlgaePercent: 0.95 * algaePercent,
      mortalityPercent,
      bleached: algaePercent <= 40 ? 1 : 0,
    };
  },
  /*
   * The colony is the readout. It is golden brown while the algae are in it,
   * because the colour of a healthy coral is the colour of its lodgers; it
   * pales as they are expelled and is bone white by 6 degree heating weeks,
   * with the skeleton showing through tissue that is still alive.
   *
   * Past 8 it goes grey-green and stops moving: that is not bleaching any
   * more but death, and the green is the turf algae that take a dead
   * skeleton over. A bleached coral can be recovered; that one cannot.
   */
  drive: ({ f }) => {
    const dead = f.mortalityPercent > 0;
    const a = f.algaePercent;
    const step = dead ? 4 : a > 75 ? 0 : a > 45 ? 1 : a > 15 ? 2 : 3;
    return {
      color: CORAL[step],
      glow: dead ? 0 : 0.15 + 0.005 * a,
      rate: dead ? 0 : 1,
    };
  },
  stages: [
    { name: "Below 29 C", at: 0,
      caption: "Millions of algal cells per square centimetre supply up to 95 per cent of the coral's energy." },
    { name: "Four degree-weeks", at: 0.2,
      caption: "One degree above the summer maximum for four weeks. The algae start making more oxygen radicals than the coral can mop up." },
    { name: "The deal turns", at: 0.4,
      caption: "The partner that fed the coral is now damaging it, so the coral expels it. Cell counts fall by 60 to 90 per cent." },
    { name: "Bleached", at: 0.6,
      caption: "White skeleton showing through clear tissue. The coral is alive, living on stored fat, with weeks rather than months." },
    { name: "Eight degree-weeks", at: 0.8,
      caption: "Widespread death begins. On the Great Barrier Reef in 2016 about 29 per cent of shallow-water corals died in one summer." },
    { name: "Recovery, if it comes", at: 1,
      caption: "Cool the water in time and the algae move back in. A branching coral needs about ten years to rebuild; severe bleaching now returns every six." },
  ],
};

/* ---------------------------------------------------------------- *
 * D4.5 — Interaction patterns and population change
 * ---------------------------------------------------------------- */

const TEN_YEAR_RHYTHM: ArchetypeSpec = {
  id: "g7d4-ten-year-rhythm",
  title: "The Ten-Year Rhythm",
  tagline: "Follow the boreal forest round one full hare cycle and find out what drives it.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "Explain how predation and food supply together produce a repeating population cycle.",
    "Read a lag between two populations and say which one is driving the other.",
  ],
  misconceptions: [
    "Predators alone control the numbers of their prey",
    "A population that is falling must be running out of food only",
  ],
  stages: [
    { name: "The low", at: 0, caption: "Hares near 0.2 per hectare, lynx about 3 per 100 square kilometres." },
    { name: "The rise", at: 0.25, caption: "Few predators, plenty of shrub. Hare numbers roughly double every year." },
    { name: "Hare peak", at: 0.5, caption: "4 to 12 hares per hectare, a 25 to 50 fold rise, and the willows browsed bare." },
    { name: "Lynx peak", at: 0.75, caption: "Lynx peak one to two years later, near 30 per 100 square kilometres." },
    { name: "The crash", at: 1, caption: "Hares fall ten to thirty fold in two years and the cycle starts again." },
  ],
  route: [
    { at: [0.1, 0.36], name: "Year 1: the low",
      note: "Snowshoe hares are down near 0.2 per hectare. Lynx are scarce too, about 3 per 100 square kilometres, because most starved or wandered off after the last crash." },
    { at: [0.27, 0.62], name: "Years 2 to 4: the rise",
      note: "With few predators and shrubs recovered, a female hare raises three or four litters a summer. The population roughly doubles each year, which is what an unchecked prey species does." },
    { at: [0.44, 0.3], name: "Years 5 to 6: the hare peak",
      note: "Hares reach 4 to 12 per hectare in the Yukon, a 25 to 50 fold rise from the low. Every willow and birch shoot within reach has been browsed off, and the food is running short again." },
    { at: [0.6, 0.6], name: "Year 7: the lynx catch up",
      note: "Lynx peak one to two years after the hares, near 30 per 100 square kilometres. A lynx takes roughly 200 hares a year, so this is when predation pressure is heaviest." },
    { at: [0.76, 0.32], name: "Years 8 to 9: the crash",
      note: "Predation and browsed-out food together. Hares fall ten to thirty fold in two years, and stressed females keep producing small litters for several years after the food returns." },
    { at: [0.9, 0.58], name: "Year 10: back to the low",
      note: "Lynx starve or disperse and the shrubs regrow. Hudson's Bay Company fur returns show the same 9.6-year rhythm running through nearly two centuries of records." },
  ],
};

export const g7d4WolvesAndMoose = buildSim(WOLVES_AND_MOOSE);
export const g7d4WhoGains = buildSim(WHO_GAINS);
export const g7d4SameDealTwice = buildSim(SAME_DEAL_TWICE);
export const g7d4WhenItTurns = buildSim(WHEN_IT_TURNS);
export const g7d4TenYearRhythm = buildSim(TEN_YEAR_RHYTHM);
