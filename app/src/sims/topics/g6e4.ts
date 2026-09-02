import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E4 — Environmental and genetic factors in growth.
 *
 * Five simulations, one per subtopic:
 *
 *   E4.1  g6e4-how-much-light      environmental factors in growth      (investigate)
 *   E4.2  g6e4-one-thing-at-a-time testing an environmental factor      (process)
 *   E4.3  g6e4-same-pot-same-sun   genetic differences and growth       (compare)
 *   E4.4  g6e4-shortest-stave      comparing individuals across conditions (investigate)
 *   E4.5  g6e4-genes-or-garden     separating genetic from environmental (sort)
 *
 * E4.3 is the control that makes the rest readable: two pea varieties in one
 * pot under one lamp, differing by a single gene and by 1.5 m of stem.
 */

/* E4.1 — Environmental factors in growth. */
const HOW_MUCH_LIGHT: ArchetypeSpec = {
  id: "g6e4-how-much-light",
  title: "How Much Light Is Enough?",
  tagline: "Turn the lamp up and watch the leaf gain, then stop gaining.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5"] },
  learningGoals: [
    "Describe how photosynthesis responds to increasing light and why the response levels off.",
    "Find the light level at which a leaf breaks even against its own respiration.",
  ],
  misconceptions: ["Twice the light always means twice the growth"],
  specimens: [{ id: "leaf", name: "One leaf, one square metre", art: { art: "organelle", which: "chloroplast" } }],
  variables: [
    { key: "light", label: "Light reaching the leaf (micromoles per square metre per second)", min: 0, max: 2000, step: 25, default: 400 },
    { key: "capacity", label: "Light-saturated capacity of the leaf", min: 5, max: 30, step: 1, default: 20 },
  ],
  // The rectangular-hyperbola light response used throughout plant
  // physiology: gross photosynthesis = Pmax * I / (I + K), with a
  // half-saturation constant K of about 200 micromoles of photons per square
  // metre per second for a crop leaf. Subtract respiration, about 2
  // micromoles of CO2 per square metre per second, for the net rate. Setting
  // net to zero gives the light compensation point, R * K / (Pmax - R): about
  // 22 micromoles for a sun leaf, and much lower for a shade plant with a
  // small Pmax, which is exactly why one survives on a forest floor and the
  // other does not. Midday sunlight delivers about 2 000, an overcast day
  // about 200, and a bright room about 20.
  measure: (v) => {
    const gross = (v.capacity * v.light) / (v.light + 200);
    return {
      grossPhotosynthesis: gross,
      netPhotosynthesis: gross - 2,
      compensationPointLight: (2 * 200) / (v.capacity - 2),
    };
  },
  plot: { x: "light", y: "netPhotosynthesis", xLabel: "Light (micromoles per square metre per second)", yLabel: "Net photosynthesis (micromoles CO2 per square metre per second)" },
};

/* E4.2 — Testing an environmental factor. */
const ONE_THING_AT_A_TIME: ArchetypeSpec = {
  id: "g6e4-one-thing-at-a-time",
  title: "One Thing at a Time",
  tagline: "Does extra nitrogen grow bigger radishes? Build the test that can answer it.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5"], ccssMath: ["6.SP.B.5"] },
  learningGoals: [
    "Design a controlled test of one environmental factor on plant growth.",
    "Explain why replicates, randomised positions and dry mass make a result trustworthy.",
  ],
  misconceptions: ["One plant in each condition is enough to show a difference"],
  specimens: [{ id: "pot", name: "Seedling in a pot", art: { art: "flora", which: "seedling" } }],
  stages: [
    { name: "Question", at: 0,
      caption: "Does doubling the nitrogen in the compost increase the dry mass of a radish after six weeks?" },
    { name: "One variable", at: 0.2,
      caption: "Nitrogen is the only thing allowed to differ. Same seed packet, same compost, same pot size, same water, same lamp, same room." },
    { name: "Replicates", at: 0.4,
      caption: "Twenty pots in each group, not one. Seeds vary among themselves, and twenty means the average is not decided by a single unlucky seedling." },
    { name: "Randomise", at: 0.6,
      caption: "Shuffle the pots on the bench and give every pot a number. If all the fed plants sat nearest the window, light would be the real variable and nobody would know." },
    { name: "Measure", at: 0.8,
      caption: "After six weeks, dry each plant at 70 degrees until its mass stops falling. Fresh mass is mostly water and changes with the last watering; dry mass is what the plant actually built." },
    { name: "Compare", at: 1,
      caption: "Compare the two means and look at the spread within each group. If the groups overlap heavily, the difference in the means is not yet evidence of anything." },
  ],
};

/* E4.3 — Genetic differences and growth. */
const SAME_POT_SAME_SUN: ArchetypeSpec = {
  id: "g6e4-same-pot-same-sun",
  title: "Same Pot, Same Sun",
  tagline: "Two pea plants, one bench, one gene apart, and a metre and a half of difference.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5"] },
  learningGoals: [
    "Explain how a difference in inherited information produces a difference in growth.",
    "Justify holding the environment constant when testing for a genetic cause.",
  ],
  misconceptions: ["A small plant is always a badly fed plant"],
  specimens: [
    { id: "tall", name: "Tall variety: about 2 m",
      because: "Makes the active form of the growth hormone gibberellin, so each stem section stretches before the next leaf.",
      art: { art: "flora", which: "shrub" } },
    { id: "dwarf", name: "Dwarf variety: about 0.4 m",
      because: "One gene changed, far less active gibberellin, and no amount of feeding makes it tall. A gibberellin spray does, in days.",
      art: { art: "flora", which: "seedling" } },
  ],
};

/* E4.4 — Comparing individuals across conditions. */
const SHORTEST_STAVE: ArchetypeSpec = {
  id: "g6e4-shortest-stave",
  title: "The Shortest Stave",
  tagline: "Give a plant three resources. Its growth is set by whichever one it has least of.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Identify which environmental factor is limiting the growth of an individual plant.",
    "Explain why adding more of a resource that is already sufficient changes nothing.",
  ],
  misconceptions: ["Adding more fertiliser always produces more growth"],
  specimens: [{ id: "plant", name: "One seedling under test", art: { art: "flora", which: "seedling" } }],
  variables: [
    { key: "light", label: "Light, as a percentage of what the plant could use", min: 0, max: 150, step: 5, default: 100 },
    { key: "water", label: "Water, as a percentage of what the plant could use", min: 0, max: 150, step: 5, default: 60 },
    { key: "nitrogen", label: "Nitrogen, as a percentage of what the plant could use", min: 0, max: 150, step: 5, default: 100 },
  ],
  // Liebig's law of the minimum, the first approximation every agronomist
  // starts from: growth follows the scarcest resource, and a surplus of the
  // others is simply not used. Two identical seedlings in different conditions
  // therefore differ by whichever factor each is shortest of, which is why a
  // grower diagnoses a crop by looking for the shortest stave rather than by
  // adding more of everything. Real plants soften the corner of this rule,
  // but the diagnosis it gives is the right one.
  measure: (v) => {
    const limit = Math.min(v.light, v.water, v.nitrogen);
    const supplied = v.light + v.water + v.nitrogen;
    return {
      growthPercentOfPotential: Math.min(100, limit),
      shortfallPercent: Math.max(0, 100 - limit),
      unusedSupplyPercent: (supplied - 3 * limit) / 3,
    };
  },
  plot: { x: "water", y: "growthPercentOfPotential", xLabel: "Water supplied (% of need)", yLabel: "Growth (% of potential)" },
};

/* E4.5 — Separating genetic from environmental influence. */
const GENES_OR_GARDEN: ArchetypeSpec = {
  id: "g6e4-genes-or-garden",
  title: "Genes, Garden, or Both?",
  tagline: "Six differences to explain. Decide what could possibly have caused each one.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-5"] },
  learningGoals: [
    "Decide whether a difference between organisms has a genetic or an environmental cause.",
    "Explain that many traits need both: the genes set what is possible and conditions decide which happens.",
  ],
  misconceptions: ["Every inherited trait is fixed at birth and cannot respond to conditions"],
  categories: [
    { id: "genes", name: "The genes", hint: "same conditions, different instructions" },
    { id: "surroundings", name: "The surroundings", hint: "same instructions, different conditions" },
    { id: "both", name: "Both together", hint: "the genes allow it, conditions trigger it" },
  ],
  specimens: [
    { id: "cuttings", name: "Two cuttings from one geranium: one on a windowsill, one in a cupboard", category: "surroundings",
      because: "Cuttings are clones, so the DNA is identical down to the last base. Nothing is left to explain the difference except the light.",
      art: { art: "flora", which: "flower" } },
    { id: "dutch", name: "Dutch adults are about 20 cm taller than their ancestors of 150 years ago", category: "surroundings",
      because: "Five generations is far too short for the gene pool of a whole country to change that much. Food, clean water and less childhood illness did it.",
      art: { art: "sphere", color: "#c88a5a", radius: 0.38 } },
    { id: "dwarfpea", name: "A pea plant stops at 40 cm however much it is fed", category: "genes",
      because: "The dwarf allele cannot make enough of the active growth hormone. Extra nitrogen gives it a thicker stem and greener leaves, never a taller one.",
      art: { art: "dna" } },
    { id: "twins", name: "Twins raised on different continents both have blue eyes", category: "genes",
      because: "Identical twins came from one fertilised egg and carry the same instructions. Nothing in either upbringing puts pigment into an iris.",
      art: { art: "dna" } },
    { id: "siamese", name: "A Siamese cat has dark ears, paws, tail and face", category: "both",
      because: "Every cell carries the same pigment gene, but this version of the enzyme only works below about 33 degrees. The cool parts of the cat darken; a shaved warm patch grows back pale.",
      art: { art: "sphere", color: "#e8dcc8", radius: 0.4 } },
    { id: "fox", name: "An Arctic fox is brown in summer and white in winter", category: "both",
      because: "The instructions for both coats sit in every cell all year. Shortening days trigger the switch, so the same fox wears whichever coat the season calls for.",
      art: { art: "creature", which: "fox" } },
  ],
};

export const g6e4HowMuchLight = buildSim(HOW_MUCH_LIGHT);
export const g6e4OneThingAtATime = buildSim(ONE_THING_AT_A_TIME);
export const g6e4SamePotSameSun = buildSim(SAME_POT_SAME_SUN);
export const g6e4ShortestStave = buildSim(SHORTEST_STAVE);
export const g6e4GenesOrGarden = buildSim(GENES_OR_GARDEN);
