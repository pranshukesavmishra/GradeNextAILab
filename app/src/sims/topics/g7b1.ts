import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B1 — Physical change versus chemical change.
 *
 * Five simulations, one per subtopic:
 *
 *   B1.1  g7b1-same-molecule-new-form   physical changes                (process)
 *   B1.2  g7b1-atoms-rearranged         chemical changes                (trace)
 *   B1.3  g7b1-easy-to-confuse          cases that are easy to confuse  (sort)
 *   B1.4  g7b1-before-and-after         properties before and after     (compare)
 *   B1.5  g7b1-putting-it-back          reversibility as a clue         (investigate)
 *
 * The dividing line is drawn once and held to throughout: in a physical change
 * the molecules survive, in a chemical change the atoms are re-bonded into new
 * molecules. Every energy figure quoted is a measured one — 334 J/g to melt
 * ice, 2 260 J/g to boil water, 285.8 kJ per mole to pull water apart again.
 */

/* ---------------------------------------------------------------- *
 * B1.1 — Physical changes
 * ---------------------------------------------------------------- */

const SAME_MOLECULE_NEW_FORM: ArchetypeSpec = {
  id: "g7b1-same-molecule-new-form",
  title: "Same Molecule, New Form",
  tagline: "Melt it, boil it, freeze it back. Count the molecules at every step.",
  kind: "process",
  subject: "chemistry",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Describe a physical change as a change of form in which the molecules survive intact.",
    "Explain that melting and boiling take energy without changing what the substance is.",
  ],
  misconceptions: [
    "Boiling water splits it into hydrogen and oxygen",
    "A substance becomes a new substance when it changes state",
  ],
  specimens: [
    {
      id: "sample", name: "1 g of water, followed all the way round",
      art: { art: "glassware", which: "beaker", level: 0.45, color: "#7fb8e8" },
    },
  ],
  stages: [
    {
      name: "Ice at -10 C", at: 0,
      caption: "3.34 x 10^22 H2O molecules locked in a hexagonal lattice, still vibrating in place. Warming 1 g by one degree takes 2.09 J.",
    },
    {
      name: "Melting at 0 C", at: 0.25,
      caption: "334 J per gram goes in and the thermometer does not move. The energy is breaking the lattice apart, not speeding the molecules up. Every molecule is still H2O.",
    },
    {
      name: "Liquid at 20 C", at: 0.5,
      caption: "The same molecules, now sliding over one another. 4.18 J warms 1 g by one degree - water is unusually hard to heat.",
    },
    {
      name: "Boiling at 100 C", at: 0.75,
      caption: "2 260 J per gram pulls the molecules right apart. 1 g of liquid becomes about 1 670 cm3 of steam, and not one H2O has been broken.",
    },
    {
      name: "Frozen again", at: 1,
      caption: "Cool it and every joule comes back out: 2 260 J condensing, 334 J freezing. Mass 1.000 g at the start, 1.000 g at the end, same molecules throughout. That is what makes it physical.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.2 — Chemical changes
 * ---------------------------------------------------------------- */

const ATOMS_REARRANGED: ArchetypeSpec = {
  id: "g7b1-atoms-rearranged",
  title: "Follow the Carbon Into the Flame",
  tagline: "One methane molecule, four broken bonds, and two substances that were not there before.",
  kind: "trace",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Describe a chemical change as atoms re-bonded into different molecules.",
    "Account for the energy of a reaction as bonds broken minus bonds made.",
  ],
  misconceptions: [
    "Burning destroys matter",
    "The new substances were hidden inside the old one",
  ],
  specimens: [{ id: "methane", name: "Methane, CH4", art: { art: "molecule", formula: "CH4" } }],
  stages: [
    { name: "Fuel", at: 0, caption: "CH4 leaves the jet: one carbon, four hydrogens, 16.04 g per mole." },
    { name: "Air", at: 0.25, caption: "Two O2 molecules must arrive for each CH4. That is 9.5 litres of air per litre of gas." },
    { name: "Break", at: 0.5, caption: "2 648 kJ per mole goes in to break four C-H bonds and two O=O bonds." },
    { name: "Make", at: 0.75, caption: "3 450 kJ per mole comes back out as the new bonds snap shut." },
    { name: "Products", at: 1, caption: "CH4 + 2 O2 gives CO2 + 2 H2O, and 802 kJ per mole is left over as heat and light." },
  ],
  route: [
    {
      at: [0.09, 0.36], name: "The gas jet",
      note: "One carbon atom holding four hydrogens at 109.5 degrees apart. Unlit, this molecule will sit in the pipe for years: it is stable, not waiting to fall apart.",
    },
    {
      at: [0.26, 0.62], name: "Mixing with air",
      note: "The balanced equation demands two O2 for every CH4. Air is only 21 per cent oxygen, so each litre of gas needs about 9.5 litres of air. Starve it and you get soot and carbon monoxide instead.",
    },
    {
      at: [0.43, 0.3], name: "The flame front",
      note: "The spark supplies enough energy to break bonds: four C-H at 413 kJ per mole and two O=O at 498, which is 2 648 kJ per mole in total. For a moment the atoms are loose.",
    },
    {
      at: [0.6, 0.58], name: "The rearrangement",
      note: "The same atoms find new partners. Two C=O bonds at 799 kJ per mole and four O-H at 463 give back 3 450 kJ. Nothing was created; the atoms were re-sorted.",
    },
    {
      at: [0.77, 0.3], name: "What leaves",
      note: "Per mole: 16.04 g of methane and 64.00 g of oxygen go in, 44.01 g of carbon dioxide and 36.03 g of water come out. 80.04 g in, 80.04 g out - and 802 kJ of surplus energy, which is 50 kJ for every gram of gas burned.",
    },
    {
      at: [0.91, 0.6], name: "The cold spoon",
      note: "Hold a cold spoon over the flame and it fogs. That water was not in the gas cylinder: its hydrogen came from the methane and its oxygen came from the air. New substance, so chemical change.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.3 — Cases that are easy to confuse
 * ---------------------------------------------------------------- */

const EASY_TO_CONFUSE: ArchetypeSpec = {
  id: "g7b1-easy-to-confuse",
  title: "Eight Changes, Four Traps",
  tagline: "Each one is paired with a look-alike. Bubbles are not proof, and neither is disappearing.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Decide whether a change is physical or chemical from what happens to the molecules.",
    "Explain why bubbles, disappearing and colour change are clues rather than proof.",
  ],
  misconceptions: [
    "Anything that bubbles is a chemical reaction",
    "Dissolving destroys the substance",
  ],
  categories: [
    { id: "physical", name: "Physical change", hint: "same molecules, new arrangement" },
    { id: "chemical", name: "Chemical change", hint: "new substances made" },
  ],
  specimens: [
    {
      id: "salt", name: "Salt stirred into water", category: "physical",
      because: "The Na+ and Cl- ions come apart and spread out, but no new substance is made. 36 g dissolves in 100 g of water at 20 C, and boiling the water off returns every gram of the salt.",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#8fd0e8" },
    },
    {
      id: "antacid", name: "Antacid tablet dropped in water", category: "chemical",
      because: "Citric acid and sodium hydrogencarbonate finally meet in solution and react. The bubbles are carbon dioxide that did not exist before, and the tablet cannot be recovered by evaporation.",
      art: { art: "glassware", which: "testTube", level: 0.55, color: "#cfe6f2", bubbles: 16 },
    },
    {
      id: "butter", name: "Butter melting in a pan", category: "physical",
      because: "Butterfat softens from 32 C and is fully liquid by 35 C. The fat molecules are untouched, only free to slide. Put it in the fridge and it sets again.",
      art: { art: "glassware", which: "beaker", level: 0.3, color: "#f0cf7a" },
    },
    {
      id: "egg", name: "Egg white cooked in a pan", category: "chemical",
      because: "Above about 62 C the protein chains unfold and make new bonds to each other. That white solid has never been turned back into clear egg white by any amount of cooling.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "boiling", name: "Water boiling in a kettle", category: "physical",
      because: "The bubbles are H2O molecules in the gas phase, not hydrogen and oxygen. It costs 2 260 J per gram, and you get all 2 260 J back when the steam condenses on a cold window.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#a8d8f0", bubbles: 22 },
    },
    {
      id: "electrolysis", name: "Water split by a battery", category: "chemical",
      because: "2 H2O gives 2 H2 + O2. Twice as much gas collects over one electrode as the other, because the equation says so, and it takes 285.8 kJ per mole of water to force it.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "sand", name: "Sand stirred into water", category: "physical",
      because: "It clouds the water and settles again. Filter it, dry it, and the same mass of sand is back: silicon dioxide never joined the water at all.",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#c8cbb8", precipitate: 0.45 },
    },
    {
      id: "vinegar", name: "Vinegar poured on baking soda", category: "chemical",
      because: "NaHCO3 + CH3COOH gives CH3COONa + H2O + CO2. Five grams of baking soda releases 2.6 g of carbon dioxide, and what is left in the dish is sodium acetate, not baking soda.",
      art: { art: "glassware", which: "flask", level: 0.42, color: "#ecd9a8", bubbles: 20 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.4 — Properties before and after
 * ---------------------------------------------------------------- */

const BEFORE_AND_AFTER: ArchetypeSpec = {
  id: "g7b1-before-and-after",
  title: "Seven Grams of Iron, Four of Sulfur",
  tagline: "Mix them and a magnet still finds the iron. Heat them and it never will again.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Use measured properties, not appearance, to decide whether a new substance exists.",
    "Contrast a mixture, whose parts keep their own properties, with a compound, which has its own.",
  ],
  misconceptions: [
    "A mixture and a compound are the same thing",
    "Heating something always just makes it hotter",
  ],
  specimens: [
    {
      id: "mixture", name: "Before: 7.0 g iron filings mixed with 4.0 g sulfur",
      because: "Every property belongs to one part or the other. A magnet lifts the iron straight out. Under a lens the grey and yellow grains are separate. Dilute hydrochloric acid gives off hydrogen, which has no smell. The two densities are still 7.87 and 2.07 g/cm3, and you could have mixed them in any ratio you liked.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "compound", name: "After: heated to red heat, 11.0 g of iron sulfide",
      because: "Fe + S gives FeS, and 0.125 mol of each makes 0.125 mol of a compound with a molar mass of 87.91 g. The magnet now lifts nothing. The solid is one uniform dark grey. The same acid gives hydrogen sulfide, which smells of rotten eggs. Density 4.84 g/cm3, melting point 1 194 C. Once lit by a hot wire the reaction runs on its own heat.",
      art: { art: "glassware", which: "testTube", level: 0.42, color: "#4c4a55", precipitate: 0.85 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B1.5 — Reversibility as a clue, not a rule
 * ---------------------------------------------------------------- */

const PUTTING_IT_BACK: ArchetypeSpec = {
  id: "g7b1-putting-it-back",
  title: "Putting It Back Together",
  tagline: "Melting is undone by a freezer. Undoing water itself takes forty-seven times as much energy.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Compare the energy needed to reverse a change of state with the energy needed to reverse a chemical change.",
    "Explain why ease of reversal is a clue about a change and not a test of it.",
  ],
  misconceptions: [
    "A chemical change can never be reversed",
    "Anything you can undo must have been physical",
  ],
  specimens: [
    { id: "sample", name: "A sample of water", art: { art: "molecule", formula: "H2O" } },
  ],
  variables: [
    { key: "mass", label: "Mass of water (g)", min: 1, max: 500, step: 1, default: 100 },
    { key: "power", label: "Power supplied (W)", min: 50, max: 2000, step: 10, default: 500 },
  ],
  // Physical reversals cost the latent heats: 334 J/g to melt, 2 260 J/g to
  // boil, and every joule comes back on freezing or condensing. Reversing the
  // chemical change means unmaking the molecule: the enthalpy of formation of
  // liquid water is -285.8 kJ per mole, so splitting it costs 285 800 / 18.015
  // = 15 865 J for every gram.
  measure: (v) => ({
    meltEnergyJ: v.mass * 334,
    boilEnergyJ: v.mass * 2260,
    splitEnergyJ: (v.mass * 285800) / 18.015,
    timesHarderThanMelting: 285800 / 18.015 / 334,
    meltTimeS: (v.mass * 334) / v.power,
    splitTimeS: (v.mass * 285800) / 18.015 / v.power,
    hydrogenMadeG: (v.mass * 2 * 1.008) / 18.015,
  }),
  plot: { x: "mass", y: "splitEnergyJ", xLabel: "Mass of water (g)", yLabel: "Energy to split it (J)" },
};

export const g7b1SameMoleculeNewForm = buildSim(SAME_MOLECULE_NEW_FORM);
export const g7b1AtomsRearranged = buildSim(ATOMS_REARRANGED);
export const g7b1EasyToConfuse = buildSim(EASY_TO_CONFUSE);
export const g7b1BeforeAndAfter = buildSim(BEFORE_AND_AFTER);
export const g7b1PuttingItBack = buildSim(PUTTING_IT_BACK);
