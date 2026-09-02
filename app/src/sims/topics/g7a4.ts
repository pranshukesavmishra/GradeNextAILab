import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit A · Topic A4 — Molecules, compounds and formulas.
 *
 * Five simulations, one per subtopic:
 *
 *   A4.1  g7a4-fixed-or-free      element, compound and mixture   (sort)
 *   A4.2  g7a4-what-ch4-says      reading a chemical formula      (explore)
 *   A4.3  g7a4-two-or-twice       subscripts versus coefficients  (investigate)
 *   A4.4  g7a4-inside-brackets    counting atoms in a formula     (process)
 *   A4.5  g7a4-build-a-water      modeling a molecule from its formula (assemble)
 *
 * A formula is a sentence in a language with two words -- which atoms, and how
 * many -- so the topic pins the grammar down with arithmetic. A4.3 lets a
 * student move the coefficient and the subscript separately and watch which
 * atoms change, which is the distinction the whole of Unit B depends on.
 */

/* ---------------------------------------------------------------- *
 * A4.1 — Element, compound and mixture
 * ---------------------------------------------------------------- */

const FIXED_OR_FREE: ArchetypeSpec = {
  id: "g7a4-fixed-or-free",
  title: "Fixed Recipe, or Any Recipe?",
  tagline: "One kind of atom, a fixed ratio of two, or whatever happens to be in the jar.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Distinguish elements, compounds and mixtures by the atoms they contain and the ratios they hold.",
    "Explain that a compound has a fixed composition and a mixture does not.",
  ],
  misconceptions: [
    "Anything made of more than one kind of atom is a compound",
    "Air is a compound because it always seems the same",
  ],
  categories: [
    { id: "element", name: "Element", hint: "one kind of atom only" },
    { id: "compound", name: "Compound", hint: "different atoms, bonded in a fixed ratio" },
    { id: "mixture", name: "Mixture", hint: "not bonded, and the ratio can vary" },
  ],
  specimens: [
    {
      id: "o2", name: "Oxygen gas, O2", category: "element",
      because: "Two atoms bonded together, but both are oxygen. A molecule of one element is still an element: nothing in it can be chemically taken apart into anything simpler.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "copper", name: "Copper wire, Cu", category: "element",
      because: "Copper atoms and nothing else, all the way through. No molecules at all: just one kind of atom stacked 0.256 nm apart.",
      art: { art: "sphere", color: "#b87333", radius: 0.4 },
    },
    {
      id: "h2o", name: "Water, H2O", category: "compound",
      because: "Two hydrogens bonded to one oxygen, always, in every drop on Earth. That is 1.0 g of hydrogen for every 7.94 g of oxygen, and the ratio never shifts.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "nacl", name: "Table salt, NaCl", category: "compound",
      because: "Sodium and chlorine locked one-to-one. Every grain is 39.3% sodium by mass, whether it came from a mine or the sea.",
      art: { art: "molecule", formula: "NaCl" },
    },
    {
      id: "brine", name: "Salt water", category: "mixture",
      because: "Any ratio you like, up to 359 g of salt per litre at 20 degrees. Nothing is bonded to the water, so boiling it away returns the salt unchanged.",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#a8c8dd" },
    },
    {
      id: "air", name: "Air in a flask", category: "mixture",
      because: "78% nitrogen, 21% oxygen, 0.9% argon, and the proportions drift with place and weather. Cool it down and the parts separate: nitrogen liquefies at minus 196, oxygen at minus 183.",
      art: { art: "glassware", which: "flask", level: 0.1, color: "#dfe9f2", bubbles: 0.5 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A4.2 — Reading a chemical formula
 * ---------------------------------------------------------------- */

const WHAT_CH4_SAYS: ArchetypeSpec = {
  id: "g7a4-what-ch4-says",
  title: "Four Characters, Five Atoms",
  tagline: "CH4 is a set of instructions. Point at each part and read what it tells you to do.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Read a chemical formula as a list of elements with a count for each.",
    "Explain that an element written without a subscript means exactly one atom.",
  ],
  misconceptions: [
    "CH4 means one atom of a substance called CH4",
    "A missing subscript means the count is unknown",
  ],
  specimens: [
    {
      id: "ch4", name: "Methane, CH4",
      art: { art: "molecule", formula: "CH4" },
      parts: [
        {
          id: "c", name: "C: carbon", at: [0.0, 0.0],
          note: "The capital letter names the element. One carbon atom, sitting at the centre of everything else.",
        },
        {
          id: "one", name: "No subscript means one", at: [-0.18, 0.22],
          note: "C on its own is one carbon. Chemists never write C1, in the same way you never write 1 apple as 1x1 apple.",
        },
        {
          id: "h", name: "H: hydrogen", at: [0.3, -0.24],
          note: "The second element in the formula, and the small letter that would follow it -- there is none here, because hydrogen's symbol is just H.",
        },
        {
          id: "four", name: "The subscript 4", at: [-0.3, -0.24],
          note: "Four hydrogen atoms, bonded to that one carbon. Change the 4 and it stops being methane: CH3 is a fragment, CH2 is a piece of a chain.",
        },
        {
          id: "total", name: "Five atoms in one molecule", at: [0.28, 0.26],
          note: "1 carbon + 4 hydrogen. One mole of them weighs 12.01 + 4 x 1.008 = 16.04 g, and that is where the mass of natural gas comes from.",
        },
        {
          id: "shape", name: "What the formula leaves out", at: [-0.02, 0.32],
          note: "The formula never mentions shape. Those four bonds are 0.109 nm long and spread to 109.5 degrees apart, as far from each other as four directions can get.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A4.3 — Subscripts versus coefficients
 * ---------------------------------------------------------------- */

const TWO_OR_TWICE: ArchetypeSpec = {
  id: "g7a4-two-or-twice",
  title: "2H2O Is Not H2O2",
  tagline: "One number multiplies the whole molecule. The other rebuilds it into a different substance.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain that a coefficient multiplies every atom in a formula and a subscript multiplies only the symbol before it.",
    "Count the atoms of each element in a formula that carries both.",
  ],
  misconceptions: [
    "2H2O and H2O2 mean the same thing",
    "Changing a subscript is a fair way to balance an equation",
  ],
  specimens: [
    { id: "water", name: "Water, H2O", art: { art: "molecule", formula: "H2O" } },
  ],
  variables: [
    { key: "coefficient", label: "Coefficient in front", min: 1, max: 6, step: 1, default: 2 },
    { key: "oxygenSubscript", label: "Subscript after the O", min: 1, max: 2, step: 1, default: 1 },
  ],
  /*
   * The coefficient multiplies everything; the subscript multiplies only the
   * oxygen. Relative atomic masses are the IUPAC values, H 1.008 and O 15.999,
   * so the totals are the ones a student will get from their data sheet:
   * H2O is 18.015 g/mol, H2O2 is 34.01, and 2H2O is 36.03 -- two waters, not
   * one peroxide, and the two are not even the same mass.
   */
  measure: (v) => {
    const c = Math.max(1, Math.round(v.coefficient));
    const sub = Math.max(1, Math.round(v.oxygenSubscript));
    return {
      hydrogenAtoms: 2 * c,
      oxygenAtoms: sub * c,
      totalAtoms: c * (2 + sub),
      molarMassG: c * (2 * 1.008 + sub * 15.999),
    };
  },
  plot: {
    x: "coefficient", y: "totalAtoms",
    xLabel: "Coefficient in front of the formula", yLabel: "Atoms in total",
  },
  /*
   * The two numbers do different things to the sample, so they do different
   * things to the drawing.
   *
   * The coefficient is a count of whole molecules, so it is an amount: six
   * waters take six times the volume of one, and volume goes as the cube of
   * the width, so 6H2O is drawn 1.82 times as wide as H2O, not six times.
   *
   * The subscript is not an amount at all. Move it and the substance is no
   * longer water, and no amount of redrawing a water molecule can show
   * hydrogen peroxide. So the sample is set apart and turned on end instead:
   * a deliberate mark that says this is a different substance, 34.01 g per
   * mole against 18.015, and not two of anything.
   */
  drive: ({ v }) => {
    const peroxide = Math.round(v.oxygenSubscript) >= 2;
    return {
      scale: Math.cbrt(Math.max(1, Math.round(v.coefficient))),
      tilt: peroxide ? 1.15 : 0.24,
      offset: peroxide ? [0.22, 0] : [0, 0],
      rate: peroxide ? 0.35 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * A4.4 — Counting atoms in a formula
 * ---------------------------------------------------------------- */

const INSIDE_BRACKETS: ArchetypeSpec = {
  id: "g7a4-inside-brackets",
  title: "Working Through the Brackets",
  tagline: "Ca(OH)2, one step at a time, until the atom count is beyond argument.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Count the atoms of each element in a formula containing brackets.",
    "Apply a subscript outside a bracket to every atom inside it.",
  ],
  misconceptions: [
    "The subscript outside a bracket applies only to the atom next to it",
    "Brackets in a formula are just punctuation",
  ],
  specimens: [
    { id: "limewater", name: "Limewater: calcium hydroxide solution", art: { art: "glassware", which: "beaker", level: 0.58, color: "#e6efe8" } },
  ],
  // Named only so `drive` can read the speed the engine already publishes for a
  // staged simulation; the stage position is 0.16 x speed x t.
  variables: [
    { key: "rate", label: "Speed", min: 0, max: 2, step: 0.1, default: 0.6 },
  ],
  /*
   * The beaker is the tally. Each stage adds the atoms that step accounts for
   * -- 1 for the calcium, 2 more inside the bracket, 2 more when the subscript
   * outside is applied -- and the solution rises to that fraction of the five
   * atoms in Ca(OH)2. It is full when the count is complete, which is the
   * whole check: if the level has not reached the mark, an atom is missing.
   *
   * The last stage changes the formula to 3Mg(NO3)2, which is twenty-seven
   * atoms. Five atoms' worth of beaker cannot hold that, so it fills to the
   * brim and the solution changes: a different substance, and a count that
   * needs a bigger vessel.
   */
  drive: ({ v, t }) => {
    const p = (0.16 * v.rate * t) % 1;
    const counted = [1, 3, 5, 5, 27];
    const i = Math.max(0, Math.min(3, Math.floor(p * 4)));
    const n = counted[i] + (counted[i + 1] - counted[i]) * (p * 4 - i);
    return {
      level: 0.12 + 0.66 * Math.min(1, n / 5),
      color: n > 5 ? "#cfe0f0" : "#e6efe8",
      bubbles: n > 5 ? 0.35 : 0,
    };
  },
  stages: [
    {
      name: "Ca", at: 0,
      caption: "Start at the left. Ca is calcium, and it carries no subscript, so that is exactly 1 calcium atom.",
    },
    {
      name: "(OH)", at: 0.25,
      caption: "Inside the bracket sits a hydroxide group: 1 oxygen and 1 hydrogen. Treat it as a single package for now.",
    },
    {
      name: "The 2 outside", at: 0.5,
      caption: "The 2 sits outside the bracket, so it multiplies everything inside it: 2 oxygen and 2 hydrogen. It does not touch the calcium.",
    },
    {
      name: "Add it up", at: 0.75,
      caption: "1 Ca + 2 O + 2 H = 5 atoms in one formula unit. In grams per mole: 40.08 + 2 x 16.00 + 2 x 1.008 = 74.09.",
    },
    {
      name: "Now a harder one", at: 1,
      caption: "3Mg(NO3)2: coefficient 3, bracket 2, so 3 Mg, 3 x 2 = 6 N and 3 x 2 x 3 = 18 O. Twenty-seven atoms, and every one of them accounted for.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A4.5 — Modeling a molecule from its formula
 * ---------------------------------------------------------------- */

const BUILD_A_WATER: ArchetypeSpec = {
  id: "g7a4-build-a-water",
  title: "Build One Molecule of Water",
  tagline: "H2O gives you the parts list. Put them together and find what the formula never told you.",
  kind: "assemble",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Build a model of a molecule from its chemical formula.",
    "Explain that a formula fixes the atom counts but not the shape, which has to be measured.",
  ],
  misconceptions: [
    "A water molecule is a straight line of H-O-H",
    "The two hydrogen atoms in water are bonded to each other",
  ],
  specimens: [
    {
      id: "h2o", name: "Water, H2O",
      art: { art: "molecule", formula: "H2O" },
      parts: [
        {
          id: "oxygen", name: "Start with the oxygen", at: [0.02, 0.2],
          note: "The formula's second element, but the one everything else hangs off: oxygen has 6 outer electrons and room for 2 more.",
        },
        {
          id: "h1", name: "Add the first hydrogen", at: [-0.34, -0.14],
          note: "One proton, one electron, and nothing to spare. It shares its single electron with the oxygen and is full at two.",
        },
        {
          id: "h2", name: "Add the second hydrogen", at: [0.34, -0.14],
          note: "The subscript 2 says exactly two. Oxygen now has its 8 outer electrons and will take no more.",
        },
        {
          id: "bond1", name: "The first bond", at: [-0.2, 0.05],
          note: "A shared pair, 0.0957 nm from nucleus to nucleus. Breaking it needs 463 kJ per mole, which is why water does not fall apart on a warm day.",
        },
        {
          id: "bond2", name: "The second bond", at: [0.21, 0.05],
          note: "Identical to the first. Both hydrogens are joined to the oxygen; neither is joined to the other.",
        },
        {
          id: "angle", name: "The 104.5 degree angle", at: [-0.02, -0.05],
          note: "Measured, not deduced from the formula. That bend leaves one side of the molecule slightly negative, and that is why water dissolves salt, sticks to itself and floats when frozen.",
        },
      ],
    },
  ],
};

export const g7a4FixedOrFree = buildSim(FIXED_OR_FREE);
export const g7a4WhatCh4Says = buildSim(WHAT_CH4_SAYS);
export const g7a4TwoOrTwice = buildSim(TWO_OR_TWICE);
export const g7a4InsideBrackets = buildSim(INSIDE_BRACKETS);
export const g7a4BuildAWater = buildSim(BUILD_A_WATER);
