import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D5 — Ecosystem disruption and change.
 *
 * Five simulations, one per subtopic:
 *
 *   D5.1  g7d5-how-long-to-heal  physical disruptions              (sort)
 *   D5.2  g7d5-mussel-arithmetic biological disruptions            (investigate)
 *   D5.3  g7d5-what-took-the-cod arguing from evidence             (compare)
 *   D5.4  g7d5-glacier-bay       succession after a disruption     (process)
 *   D5.5  g7d5-hubbard-brook     short term versus long term       (trace)
 *
 * Two of these are famous experiments and are quoted exactly. Glacier Bay is
 * Crocker and Major's chronosequence: bare till at pH 8 and near-zero
 * nitrogen, about 1 200 kg of nitrogen per hectare built up under fifty years
 * of alder, spruce forest by two centuries. Hubbard Brook is the 1966 clear
 * cut of watershed 2, where stream nitrate went from 0.9 to 53 mg per litre
 * and came back within four years while the tree species did not.
 */

/* ---------------------------------------------------------------- *
 * D5.1 — Physical disruptions
 * ---------------------------------------------------------------- */

const HOW_LONG_TO_HEAL: ArchetypeSpec = {
  id: "g7d5-how-long-to-heal",
  title: "How Long Does It Take to Heal?",
  tagline: "Six physical shocks to six ecosystems. Sort them by how long the ground takes to come back.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Describe physical disruptions to an ecosystem and the timescale each one acts on.",
    "Explain that recovery time depends on whether the soil and the living roots survived.",
  ],
  misconceptions: [
    "Any disruption is a disaster for an ecosystem",
    "An ecosystem always returns to exactly what it was before",
  ],
  categories: [
    { id: "fast", name: "Back within a decade", hint: "soil and root systems survived" },
    { id: "slow", name: "Centuries, or never the same", hint: "the soil itself was removed or never existed" },
  ],
  specimens: [
    {
      id: "prairie-fire", name: "Spring grass fire on a prairie", category: "fast",
      because: "Prairie grasses keep 60 to 80 per cent of their mass and nearly all their growing points below ground, where the fire never reaches. Full cover returns in a single growing season, and many prairie plants flower better afterwards.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "flood", name: "River flood across a floodplain meadow", category: "fast",
      because: "Silt is dropped, seeds are moved and the sward regrows within a year or two. Floodplain plants are built for it, and several of them need the disturbance to keep taller competitors out.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "storm-shore", name: "Winter storm scouring a mussel bed", category: "fast",
      because: "Waves tear open patches of rock. Larvae settle out of the plankton within weeks and a cleared gap closes over in two to seven years, which is why a rocky shore is a permanent patchwork.",
      art: { art: "glassware", which: "beaker", level: 0.68, color: "#2f7f9f", bubbles: 0.9 },
    },
    {
      id: "lava", name: "Basalt lava flow on Hawaii", category: "slow",
      because: "Bare rock with no soil, no nitrogen and no seed bank. Lichens arrive within a decade, but it takes about 150 years to build soil deep enough for closed forest and a thousand for a mature one.",
      art: { art: "sphere", color: "#2a2a32", radius: 0.5 },
    },
    {
      id: "glacier", name: "Land uncovered by a retreating glacier", category: "slow",
      because: "Ground-up rock at pH 8 with essentially no nitrogen in it. Fifty years of alder are needed to build about 1 200 kg of nitrogen per hectare, and two centuries before a spruce forest stands there.",
      art: { art: "planet", color: "#dcecf4", atmosphere: "#f0f8fb" },
    },
    {
      id: "landslide", name: "Landslide stripping a slope to bedrock", category: "slow",
      because: "Soil forms at roughly 0.05 to 0.1 mm a year, so a metre of it represents ten to twenty thousand years of work. Ninety seconds of sliding removes all of it, and nothing rebuilds that quickly.",
      art: { art: "glassware", which: "testTube", level: 0.5, color: "#8a6a4a", precipitate: 0.7 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D5.2 — Biological disruptions
 * ---------------------------------------------------------------- */

const MUSSEL_ARITHMETIC: ArchetypeSpec = {
  id: "g7d5-mussel-arithmetic",
  title: "One Litre a Day, Times Six Thousand",
  tagline: "Zebra mussels arrived in 1988. Work out what a lake bed of them does to the water above it.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Scale one organism's measured filtering rate up to a whole population and a whole lake.",
    "Explain how an introduced species can restructure an ecosystem without eating anything native directly.",
  ],
  misconceptions: [
    "An introduced species only matters if it eats or attacks native species",
    "Clearer water always means a healthier lake",
  ],
  specimens: [
    { id: "sample", name: "A litre of lake water, before and after",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#5f9f7f", precipitate: 0.45 } },
  ],
  variables: [
    { key: "density", label: "Zebra mussels per square metre", min: 0, max: 100000, step: 500, default: 6000 },
    { key: "rate", label: "Water one mussel filters (litres per day)", min: 0.2, max: 4, step: 0.1, default: 1 },
    { key: "depth", label: "Mean depth of the lake (m)", min: 1, max: 40, step: 0.2, default: 7.4 },
    { key: "area", label: "Colonised lake bed (square kilometres)", min: 1, max: 500, step: 1, default: 100 },
  ],
  // Each square metre of bed filters density * rate litres a day, which is
  // density * rate / 1000 cubic metres. Divide by the depth and you get how
  // many times the water column overhead is filtered each day. At the western
  // Lake Erie figure of 6 000 mussels per square metre, one litre each, over
  // 7.4 m of water, that is 0.81 - the whole column filtered every 1.2 days.
  measure: (v) => {
    const perSquareMetre = (v.density * v.rate) / 1000;
    const turnovers = perSquareMetre / v.depth;
    return {
      cubicMetresFilteredPerDay: perSquareMetre * v.area * 1e6,
      waterColumnTurnoversPerDay: turnovers,
      daysToFilterTheLake: turnovers > 0 ? 1 / turnovers : 0,
    };
  },
  plot: {
    x: "density", y: "waterColumnTurnoversPerDay",
    xLabel: "Mussels per square metre", yLabel: "Times the water column is filtered per day",
  },
};

/* ---------------------------------------------------------------- *
 * D5.3 — Constructing an argument from evidence
 * ---------------------------------------------------------------- */

const WHAT_TOOK_THE_COD: ArchetypeSpec = {
  id: "g7d5-what-took-the-cod",
  title: "What Took the Cod?",
  tagline: "Two explanations, both with real evidence. Decide which one the numbers support.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Weigh two competing explanations for one ecosystem collapse against the same evidence.",
    "Explain why a correct explanation has to account for the timing of a change, not only its direction.",
  ],
  misconceptions: [
    "Two things happening at the same time means one caused the other",
    "A fish stock always recovers once fishing stops",
  ],
  specimens: [
    {
      id: "fishing", name: "Claim A: the fishery took the cod",
      because: "Landings peaked at 810 000 t in 1968; the stock fell 99 per cent.",
      art: { art: "glassware", which: "beaker", level: 0.12, color: "#3f7f9f" },
    },
    {
      id: "cold", name: "Claim B: cold water and seals took the cod",
      because: "The sea cooled about 1 C; harp seals went from 1.8 to 5 million.",
      art: { art: "sphere", color: "#a4dcf0", radius: 0.5, glow: 0.5 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D5.4 — Succession after a disruption
 * ---------------------------------------------------------------- */

const GLACIER_BAY: ArchetypeSpec = {
  id: "g7d5-glacier-bay",
  title: "Two Hundred Years of Bare Rock",
  tagline: "The ice pulls back and leaves nothing. Follow what arrives, in the order it arrives.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Describe primary succession as a sequence in which each stage changes the soil for the next.",
    "Explain why nitrogen-fixing pioneers are needed before larger plants can grow at all.",
  ],
  misconceptions: [
    "Succession is just plants slowly getting bigger",
    "The first species to arrive are the ones that stay",
  ],
  specimens: [
    { id: "alder", name: "Alder: the plant that builds the soil",
      art: { art: "cell", plant: true } },
  ],
  stages: [
    { name: "Year 0", at: 0,
      caption: "Ground-up rock the ice left behind. Nitrogen near zero, pH about 8.0, and nothing that holds water." },
    { name: "Years 1 to 10", at: 0.2,
      caption: "Mosses, fireweed and Dryas. Dryas fixes nitrogen with bacteria in its roots and starts a soil from nothing." },
    { name: "Years 30 to 50", at: 0.4,
      caption: "Alder thicket. Soil nitrogen climbs to about 1 200 kg per hectare in fifty years and pH falls from 8.0 towards 5." },
    { name: "Years 50 to 100", at: 0.6,
      caption: "Sitka spruce grows fast in alder-built soil, then shades the alder out. The species that made the place liveable goes first." },
    { name: "Years 100 to 200", at: 0.8,
      caption: "Closed spruce forest. Nitrogen is now recycled from leaf litter rather than fixed from the air, and the build-up levels off." },
    { name: "Beyond 200 years", at: 1,
      caption: "Hemlock replaces spruce in the shade, and on flat ground moss builds a bog. Succession slows down; it does not stop." },
  ],
};

/* ---------------------------------------------------------------- *
 * D5.5 — Short-term versus long-term change
 * ---------------------------------------------------------------- */

const HUBBARD_BROOK: ArchetypeSpec = {
  id: "g7d5-hubbard-brook",
  title: "Cut the Forest, Watch the Stream",
  tagline: "One watershed felled in 1966, one gauge downstream, fifty years of readings.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Follow one nutrient out of a disturbed ecosystem and back again over decades.",
    "Distinguish the parts of an ecosystem that recover in years from the parts that take a century.",
  ],
  misconceptions: [
    "If the water tests clean again, the ecosystem has fully recovered",
    "Trees matter to a stream only for shade",
  ],
  stages: [
    { name: "Intact", at: 0, caption: "Stream nitrate about 0.9 mg per litre. The forest keeps almost all its nitrogen." },
    { name: "The cut", at: 0.25, caption: "Winter 1965-66: every stem in 15.6 hectares felled and left where it fell." },
    { name: "First spring", at: 0.5, caption: "No leaves transpiring, so streamflow rises about 40 per cent." },
    { name: "Nitrate peak", at: 0.75, caption: "About 53 mg per litre, more than fifty times the intact value." },
    { name: "Fifty years on", at: 1, caption: "Chemistry back to normal; the tree species are still not the ones that were cut." },
  ],
  route: [
    { at: [0.1, 0.36], name: "The intact forest",
      note: "Stream nitrate sits at about 0.9 mg per litre. The living forest takes up nearly all the nitrogen that falls on it, so only about 2 kg per hectare per year escapes down the stream." },
    { at: [0.27, 0.62], name: "Winter 1965-66: the cut",
      note: "Every stem in a 15.6 hectare watershed is felled and left lying. Nothing is carried away, so this is a test of what the living roots were doing, not of what the logs were worth." },
    { at: [0.44, 0.3], name: "First spring: more water",
      note: "With no leaves transpiring, streamflow rises about 40 per cent. Water that used to leave through leaf pores now leaves through the soil, carrying dissolved ions out with it." },
    { at: [0.6, 0.6], name: "Second year: the nitrate peak",
      note: "Nitrate reaches about 53 mg per litre, over fifty times the intact value and five times the 10 mg drinking-water limit. Some 97 kg of nitrogen per hectare leaves in a year, against 2 kg before." },
    { at: [0.76, 0.32], name: "Regrowth begins",
      note: "Pin cherry and birch seedlings take hold and their roots take up nitrate faster than soil bacteria can release it. Stream chemistry falls back to normal within three or four years." },
    { at: [0.9, 0.58], name: "Fifty years on",
      note: "Nitrate is back near 0.9 mg per litre, but pin cherry and birch now stand where sugar maple and beech did, and reversing that takes a century. Chemistry heals first; community composition heals last." },
  ],
};

export const g7d5HowLongToHeal = buildSim(HOW_LONG_TO_HEAL);
export const g7d5MusselArithmetic = buildSim(MUSSEL_ARITHMETIC);
export const g7d5WhatTookTheCod = buildSim(WHAT_TOOK_THE_COD);
export const g7d5GlacierBay = buildSim(GLACIER_BAY);
export const g7d5HubbardBrook = buildSim(HUBBARD_BROOK);
