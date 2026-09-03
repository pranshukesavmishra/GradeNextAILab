import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D3 — Cycling matter through an ecosystem.
 *
 * Five simulations, one per subtopic:
 *
 *   D3.1  g7d3-one-carbon-atom   matter cycling through organisms   (trace)
 *   D3.2  g7d3-litter-bag        decomposers closing the loop       (investigate)
 *   D3.3  g7d3-fast-and-slow     the carbon cycle, introduced       (sort)
 *   D3.4  g7d3-breaking-n2       the nitrogen cycle, introduced     (explore)
 *   D3.5  g7d3-cycles-and-flows  matter and energy together         (compare)
 *
 * The pools are the standard global carbon budget in gigatonnes of carbon:
 * 875 in the atmosphere, 450 in land plants, 1 700 in soils, 900 in the
 * surface ocean, 37 000 in the deep ocean. The fluxes are 120 fixed by land
 * plants each year and about the same respired back, which is what makes the
 * atmospheric pool turn over in roughly seven years.
 */

/** Oak litter as the decomposers get through it: fresh leaf to black humus. */
const LITTER = ["#8a6a3c", "#6f5432", "#54432c", "#3a3226"];

/** What is left of a joule after each meal, from the producers' catch to a cold ember. */
const ENERGY_LEFT = ["#f2c14e", "#e0a03a", "#c07a30", "#8a5730", "#584038"];

/* ---------------------------------------------------------------- *
 * D3.1 — Matter cycling between organisms and the environment
 * ---------------------------------------------------------------- */

const ONE_CARBON_ATOM: ArchetypeSpec = {
  id: "g7d3-one-carbon-atom",
  title: "One Carbon Atom, All the Way Round",
  tagline: "Pick a single atom out of the air and follow it until it comes back.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Follow one atom of carbon from the atmosphere through an ecosystem and back.",
    "Explain that the atoms in an ecosystem are re-used indefinitely while the energy is not.",
  ],
  misconceptions: [
    "Matter is used up as it passes through a food chain",
    "The carbon in a plant came out of the soil",
  ],
  stages: [
    { name: "In the air", at: 0, caption: "One CO2 molecule among 875 gigatonnes of atmospheric carbon." },
    { name: "In the leaf", at: 0.25, caption: "Fixed by rubisco. Land plants take up about 120 Gt of carbon a year." },
    { name: "In the grass", at: 0.5, caption: "Locked into cellulose. Dry plant tissue is about 45 per cent carbon." },
    { name: "In the vole", at: 0.75, caption: "About a tenth of the carbon eaten becomes vole; the rest is breathed out." },
    { name: "Back in the air", at: 1, caption: "Respired by the vole or by soil bacteria. Same atom, ready to go again." },
  ],
  route: [
    { at: [0.1, 0.34], name: "In the air",
      note: "One carbon atom inside one CO2 molecule. Air is 421 parts per million CO2, so about one molecule in 2 400 around it is the same kind. The whole atmospheric pool is 875 gigatonnes of carbon." },
    { at: [0.27, 0.6], name: "Into the leaf",
      note: "It diffuses in through a stoma and rubisco fixes it. Six turns of the Calvin cycle build one glucose, and land plants pull about 120 gigatonnes of carbon a year out of the air this way." },
    { at: [0.44, 0.3], name: "Built into the plant",
      note: "Now a link in a cellulose chain in a grass blade. Dry plant tissue is about 45 per cent carbon by mass, so a kilogram of hay holds roughly 450 g of atoms like this one." },
    { at: [0.6, 0.6], name: "Eaten",
      note: "A vole chews the blade. Only about a tenth of the carbon it swallows ends up as vole; the rest leaves as CO2 from respiration, or as droppings the decomposers get." },
    { at: [0.76, 0.32], name: "Respired, or buried",
      note: "If the vole respires it, C6H12O6 + 6 O2 gives 6 CO2 + 6 H2O and about 2 870 kJ per mole, and the atom is airborne within days. If the vole dies first, the atom goes to the soil instead." },
    { at: [0.9, 0.58], name: "Back to the air",
      note: "Soil bacteria finish it and breathe it out. Soils hold about 1 700 gigatonnes of carbon and return roughly 60 to the air each year, which is why the same atoms keep coming round." },
  ],
};

/* ---------------------------------------------------------------- *
 * D3.2 — Decomposers closing the loop
 * ---------------------------------------------------------------- */

const LITTER_BAG: ArchetypeSpec = {
  id: "g7d3-litter-bag",
  title: "The Litter Bag Experiment",
  tagline: "Weigh a bag of dead leaves, bury it, and weigh it again every year.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Predict how fast dead material breaks down from a measured decay constant.",
    "Explain why a rainforest floor is nearly bare while a boreal forest floor is metres deep.",
  ],
  misconceptions: [
    "A thick layer of dead leaves means decomposers are working hard there",
    "Dead material simply disappears rather than being eaten and respired",
  ],
  specimens: [
    { id: "bag", name: "A mesh bag of oak leaves, weighed each year",
      art: { art: "glassware", which: "beaker", level: 0.34, color: "#7a5c34", precipitate: 0.7 } },
  ],
  variables: [
    { key: "years", label: "Years buried", min: 0, max: 10, step: 0.25, default: 2 },
    { key: "k", label: "Decay constant k (per year)", min: 0.05, max: 4, step: 0.05, default: 0.6 },
    { key: "litterfall", label: "Leaf fall (tonnes per hectare per year)", min: 1, max: 12, step: 0.1, default: 4 },
  ],
  // Olson's decomposition model. Mass remaining is exponential, M/M0 = e^(-kt),
  // and a forest floor at steady state carries L = I/k tonnes per hectare.
  // Temperate deciduous k is about 0.6, so 30 per cent of a leaf is left after
  // two years and the floor settles at 4/0.6 = 6.7 t/ha. Tropical k near 3
  // leaves 1.3 t/ha - a bare floor. Boreal k near 0.2 leaves 20 t/ha of peat.
  measure: (v) => ({
    percentRemaining: 100 * Math.exp(-v.k * v.years),
    halfLifeYears: Math.LN2 / v.k,
    litterOnFloor: v.litterfall / v.k,
  }),
  plot: { x: "years", y: "percentRemaining", xLabel: "Years buried", yLabel: "Original mass left (per cent)" },
  /*
   * The bag is the readout, and it is weighed by eye: the leaves fill it in
   * proportion to the mass still there, so at a temperate k of 0.6 it is
   * three tenths full after two years and all but empty after ten.
   *
   * The colour is the other half of the measurement. Fresh oak litter is
   * light brown; what the decomposers leave behind is black humus, because
   * the sugars and cellulose go first and the dark lignin goes last. A bag
   * that looks empty is not a bag where nothing happened - it is a bag whose
   * contents left as carbon dioxide, breathed out by the animals and fungi
   * that ate them.
   */
  drive: ({ f }) => {
    const left = f.percentRemaining / 100;
    return {
      level: 0.05 + 0.56 * left,
      precipitate: 0.12 + 0.62 * left,
      color: LITTER[Math.min(3, Math.floor((1 - left) * 3.999))],
    };
  },
};

/* ---------------------------------------------------------------- *
 * D3.3 — The carbon cycle, introduced
 * ---------------------------------------------------------------- */

const FAST_AND_SLOW: ArchetypeSpec = {
  id: "g7d3-fast-and-slow",
  title: "Fast Carbon, Slow Carbon",
  tagline: "Six stores of carbon. Divide them by how long an atom stays put.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Compare the sizes of the main carbon stores and the fluxes between them.",
    "Work out a residence time by dividing the size of a store by the flow through it.",
  ],
  misconceptions: [
    "All the carbon on Earth is in the air or in living things",
    "Burning fossil fuel adds carbon that was never part of the cycle",
  ],
  categories: [
    { id: "fast", name: "Turns over in years", hint: "the whole store is replaced within a human lifetime" },
    { id: "slow", name: "Locked away for ages", hint: "millennia or longer before an atom comes back" },
  ],
  specimens: [
    {
      id: "air", name: "Carbon dioxide in the air: 875 Gt", category: "fast",
      because: "Photosynthesis removes about 120 Gt a year and respiration returns about the same, so 875 divided by 120 gives a residence time near seven years. Every atom in the air is swapped out within a decade.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "plants", name: "Carbon in land plants: 450 Gt", category: "fast",
      because: "Land plants grow about 60 Gt of new tissue a year, so 450 divided by 60 is seven and a half years on average - weeks for a grass blade, centuries for an oak trunk.",
      art: { art: "cell", plant: true },
    },
    {
      id: "surface-ocean", name: "Carbon in the surface ocean: 900 Gt", category: "fast",
      because: "About 90 Gt crosses the sea surface each way every year, giving a residence time near ten years. The top hundred metres of the sea is part of the same fast cycle as the air.",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#3f9ad0" },
    },
    {
      id: "deep-ocean", name: "Carbon in the deep ocean: 37 000 Gt", category: "slow",
      because: "The biggest pool that still moves. Deep water takes roughly a thousand years to circulate back to the surface, so an atom carried down here is out of the fast cycle for a millennium.",
      art: { art: "sphere", color: "#123a5c", radius: 0.5 },
    },
    {
      id: "fossil", name: "Carbon in coal, oil and gas: about 1 000 Gt", category: "slow",
      because: "Plant and plankton carbon buried 60 to 300 million years ago and untouched since. Burning it now returns about 10 Gt a year, emptying in centuries a store that took geological time to fill.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "limestone", name: "Carbon in limestone: about 60 000 000 Gt", category: "slow",
      because: "Shells and coral cemented into rock, and by far the largest store of all. It returns to the air only through volcanoes and weathering, roughly 0.1 Gt a year.",
      art: { art: "sphere", color: "#d6d0be", radius: 0.5 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D3.4 — The nitrogen cycle, introduced
 * ---------------------------------------------------------------- */

const BREAKING_N2: ArchetypeSpec = {
  id: "g7d3-breaking-n2",
  title: "Breaking the Strongest Bond in the Air",
  tagline: "Air is four fifths nitrogen and almost none of it is usable. Find out who can open it.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Name the steps of the nitrogen cycle and say which organisms carry out each one.",
    "Explain why nitrogen limits growth even though the air is 78 per cent nitrogen.",
  ],
  misconceptions: [
    "Plants take nitrogen straight from the air",
    "Fertiliser adds a nutrient that was not already in the ecosystem",
  ],
  specimens: [
    {
      id: "n2", name: "N2: 78 per cent of the air, and locked shut",
      art: { art: "molecule", formula: "N2" },
      parts: [
        { id: "fixation", name: "Fixation by bacteria", at: [-0.56, -0.44],
          note: "The nitrogen triple bond takes 945 kJ per mole to break, which is why almost nothing can use N2 straight from the air. Rhizobium in clover root nodules fixes 100 to 200 kg of nitrogen per hectare per year." },
        { id: "haber", name: "Fixation by industry", at: [0.58, -0.32],
          note: "The Haber process breaks the same bond at about 450 C and 200 atmospheres. It fixes roughly 120 million tonnes of nitrogen a year, comparable to every nitrogen-fixing bacterium on land put together." },
        { id: "nitrification", name: "Nitrification", at: [-0.62, -0.02],
          note: "Soil bacteria oxidise ammonium to nitrite and then to nitrate: NH4+ to NO2- to NO3-. Nitrate is the form most roots take up, and because it is negatively charged it washes out of soil easily." },
        { id: "assimilation", name: "Assimilation", at: [0.6, 0.18],
          note: "Roots take nitrate up and build amino acids, then protein. Protein is about 16 per cent nitrogen by mass, so 1 kg of fixed nitrogen builds roughly 6 kg of protein." },
        { id: "ammonification", name: "Ammonification", at: [-0.5, 0.44],
          note: "Decomposers strip nitrogen back off dead protein as ammonium. Without this step every fixed atom would stay locked inside dead tissue and the cycle would stall within decades." },
        { id: "denitrification", name: "Denitrification", at: [0.5, 0.46],
          note: "Bacteria in waterlogged soil turn nitrate back into N2 gas, closing the loop. Roughly 100 million tonnes returns to the air each year, which is what keeps the atmosphere at 78 per cent." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D3.5 — Modeling matter and energy together
 * ---------------------------------------------------------------- */

const CYCLES_AND_FLOWS: ArchetypeSpec = {
  id: "g7d3-cycles-and-flows",
  title: "Matter Goes Round, Energy Goes Through",
  tagline: "Same ecosystem, two accounts. One balances forever, the other never does.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Contrast the cycling of matter with the one-way flow of energy through an ecosystem.",
    "Explain why an ecosystem needs a continuous energy supply but not a continuous supply of atoms.",
  ],
  misconceptions: [
    "Energy is recycled through an ecosystem like matter is",
    "An ecosystem could run on its own once it is started",
  ],
  specimens: [
    {
      id: "atom", name: "The carbon atom: it comes back",
      because: "Fixed, eaten, respired, fixed again - about a seven-year lap.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "joule", name: "The joule: it does not",
      because: "Five levels at a tenth each leaves 0.01 per cent, and that ends as heat.",
      art: { art: "sphere", color: "#f2c14e", radius: 0.5, glow: 1 },
    },
  ],
  variables: [
    { key: "steps", label: "Meals since the producers (trophic steps)", min: 0, max: 5, step: 1, default: 1 },
    { key: "transferPercent", label: "Energy passed on at each meal (per cent)", min: 2, max: 25, step: 1, default: 10 },
  ],
  /*
   * Two accounts of the same journey up a food chain, kept side by side.
   *
   * The atoms: every carbon atom eaten is still a carbon atom afterwards.
   * Some is built into the eater, most is breathed straight back out as CO2,
   * and the decomposers return the rest. Nothing is lost at any step, which
   * is why the atmosphere's 875 Gt of carbon can keep turning over roughly
   * every seven years and never run down.
   *
   * The energy: a tenth gets through each meal, so of 1 000 kJ caught by the
   * producers, five steps leave 0.01 kJ - ten joules. And it does not come
   * back, because what was lost left as heat, at the temperature of the
   * organism, which nothing in an ecosystem can catch and re-use.
   */
  measure: (v) => {
    const share = Math.pow(v.transferPercent / 100, v.steps);
    return {
      carbonAtomsRemainingPercent: 100,
      energyRemainingPercent: 100 * share,
      energyLeftKJ: 1000 * share,
      energyLostAsHeatKJ: 1000 * (1 - share),
      atmosphericTurnoverYears: 875 / 120,
    };
  },
  /*
   * The atom does not move. Whatever the slider is set to it is drawn at the
   * same size, because that is the finding: one carbon atom in, one carbon
   * atom out, however many mouths it has passed through.
   *
   * The joule beside it is drawn at the cube root of what is left, so a tenth
   * per meal takes it to just under half its width each step, and it dims as
   * it goes. At five steps it is a cold ember a tenth of its original width -
   * and that, not any rule about counting, is why food chains stop.
   */
  drive: ({ f, index }) => {
    if (index === 0) return { scale: 1, rate: 1 };
    const share = f.energyRemainingPercent;
    const step = share > 50 ? 0 : share > 10 ? 1 : share > 1 ? 2 : share > 0.1 ? 3 : 4;
    return {
      scale: 1.25 * Math.max(0.09, Math.cbrt(share / 100)),
      color: ENERGY_LEFT[step],
      glow: Math.min(1, share / 60),
    };
  },
};

export const g7d3OneCarbonAtom = buildSim(ONE_CARBON_ATOM);
export const g7d3LitterBag = buildSim(LITTER_BAG);
export const g7d3FastAndSlow = buildSim(FAST_AND_SLOW);
export const g7d3BreakingN2 = buildSim(BREAKING_N2);
export const g7d3CyclesAndFlows = buildSim(CYCLES_AND_FLOWS);
