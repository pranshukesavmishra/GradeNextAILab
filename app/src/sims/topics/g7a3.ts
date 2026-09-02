import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit A · Topic A3 — Elements and the periodic table.
 *
 * Five simulations, one per subtopic:
 *
 *   A3.1  g7a3-reading-a-cell     reading a cell of the table   (explore)
 *   A3.2  g7a3-the-sawtooth       groups and periods            (investigate)
 *   A3.3  g7a3-three-families     metals, non-metals, metalloids (sort)
 *   A3.4  g7a3-the-gaps           why the table is organized     (process)
 *   A3.5  g7a3-down-the-group     reactivity patterns            (compare)
 *
 * The table is only worth memorising if its shape means something, so A3.2
 * plots outer electrons against atomic number and lets the repeating pattern
 * appear on its own: eight columns, because the second and third shells hold
 * eight. Everything else in the topic hangs off that graph.
 */

/* ---------------------------------------------------------------- *
 * A3.1 — Reading a cell of the periodic table
 * ---------------------------------------------------------------- */

const READING_A_CELL: ArchetypeSpec = {
  id: "g7a3-reading-a-cell",
  title: "Everything One Cell Tells You",
  tagline: "Four numbers in a little box. Point each one at the part of the atom it describes.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Read the symbol, atomic number and relative atomic mass from a cell of the periodic table.",
    "Work out the neutron count and the outer electron count from a cell.",
  ],
  misconceptions: [
    "The relative atomic mass counts the neutrons in every atom of the element",
    "The bigger number in the cell is the number of protons",
  ],
  specimens: [
    {
      id: "cl", name: "Chlorine-35 atom",
      art: { art: "atom", protons: 17, neutrons: 18, electrons: 17 },
      parts: [
        {
          id: "z", name: "17: the atomic number", at: [-0.05, 0.07],
          note: "The proton count, and the whole reason this cell is where it is. Every chlorine atom in the universe has 17 protons.",
        },
        {
          id: "n", name: "18 neutrons in this atom", at: [0.07, 0.06],
          note: "The cell never prints this. You get it by subtracting: mass number 35 minus atomic number 17.",
        },
        {
          id: "symbol", name: "Cl: the symbol", at: [-0.14, -0.13],
          note: "One or two letters, the same in every language and every laboratory on Earth. Capital first, lower case second: Cl is chlorine, CL is nothing.",
        },
        {
          id: "mass", name: "35.45: the relative atomic mass", at: [0.17, -0.12],
          note: "Not a whole number, because it averages the real mixture: 75.76% chlorine-35 and 24.24% chlorine-37 works out at 35.45.",
        },
        {
          id: "group", name: "Group 17: seven outer electrons", at: [0.29, 0.15],
          note: "One short of a full shell, which is why chlorine grabs an electron from almost anything and why the whole column behaves alike.",
        },
        {
          id: "period", name: "Period 3: three shells", at: [-0.28, 0.17],
          note: "Count the rings: 2, then 8, then 7. Three shells means row three of the table.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A3.2 — Groups and periods
 * ---------------------------------------------------------------- */

/**
 * Calculated atomic radii in picometres for the first twenty elements
 * (Clementi, Raimondi and Reinhardt, 1963), the standard published set. They
 * are here so the periodic pattern shows up twice: a sawtooth in the outer
 * electron count, and a matching collapse in size across each row.
 */
const RADIUS_PM = [
  53, 31, 167, 112, 87, 67, 56, 48, 42, 38,
  190, 145, 118, 111, 98, 88, 79, 71, 243, 194,
];

const THE_SAWTOOTH: ArchetypeSpec = {
  id: "g7a3-the-sawtooth",
  title: "Count to Eight, Then Start Again",
  tagline: "Walk along the first twenty elements and plot the outer electrons. The table's shape appears.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Find the group of an element from its outer electron count and the period from its shell count.",
    "Explain that the table repeats every eight elements because the second and third shells hold eight.",
  ],
  misconceptions: [
    "The rows of the table are just a way of fitting it on a page",
    "Atoms get steadily bigger as the atomic number rises",
  ],
  specimens: [
    { id: "na", name: "Sodium-23: 2, 8, 1", art: { art: "atom", protons: 11, neutrons: 12, electrons: 11 } },
  ],
  variables: [
    { key: "atomicNumber", label: "Atomic number Z", min: 1, max: 20, step: 1, default: 11 },
  ],
  /*
   * Shells are filled by the rule taught at this level, which is exact for the
   * first twenty elements: 2, then 8, then 8, then 2. The period is the number
   * of shells in use; the group follows from the outer electrons -- 1 or 2 for
   * the first two columns, and outer + 10 from group 13 across to group 18,
   * because the ten transition columns sit in between. Helium is the one
   * exception: two outer electrons, but a full shell, so it belongs in 18.
   */
  measure: (v) => {
    const z = Math.max(1, Math.min(20, Math.round(v.atomicNumber)));
    const caps = [2, 8, 8, 2];
    let left = z;
    let period = 0;
    let outer = 0;
    for (const cap of caps) {
      if (left <= 0) break;
      outer = Math.min(cap, left);
      left -= outer;
      period++;
    }
    const group = z === 2 ? 18 : outer <= 2 ? outer : outer + 10;
    return {
      outerElectrons: outer,
      period,
      group,
      atomicRadiusPm: RADIUS_PM[z - 1],
    };
  },
  plot: {
    x: "atomicNumber", y: "outerElectrons",
    xLabel: "Atomic number Z", yLabel: "Electrons in the outer shell",
  },
};

/* ---------------------------------------------------------------- *
 * A3.3 — Metals, non-metals and metalloids
 * ---------------------------------------------------------------- */

const THREE_FAMILIES: ArchetypeSpec = {
  id: "g7a3-three-families",
  title: "Three Families, One Staircase",
  tagline: "Six samples on the bench. Sort them by what they do, not by where they sit.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Classify elements as metals, non-metals or metalloids from their properties.",
    "Locate the staircase in the periodic table that separates metals from non-metals.",
  ],
  misconceptions: [
    "Every metal is a hard silver solid",
    "Metalloids are a mixture of a metal and a non-metal",
  ],
  categories: [
    { id: "metal", name: "Metal", hint: "shiny, bends, conducts well" },
    { id: "nonmetal", name: "Non-metal", hint: "dull or gaseous, brittle, insulates" },
    { id: "metalloid", name: "Metalloid", hint: "looks metallic, behaves in between" },
  ],
  specimens: [
    {
      id: "copper", name: "Copper wire", category: "metal",
      because: "Conducts at 5.96 x 10^7 siemens per metre, the best of any ordinary metal after silver, and can be drawn into a wire thinner than a hair without snapping.",
      art: { art: "sphere", color: "#b87333", radius: 0.4 },
    },
    {
      id: "magnesium", name: "Magnesium ribbon", category: "metal",
      because: "Light at 1.74 g/cm3, bends without breaking, melts at 650 degrees, and burns with a white flame hot enough to be used in flares.",
      art: { art: "sphere", color: "#d3d7dc", radius: 0.36 },
    },
    {
      id: "sulfur", name: "Sulfur crystals", category: "nonmetal",
      because: "Yellow, dull and so brittle it crumbles under a thumbnail. It melts at 115 degrees and conducts essentially nothing: 10^-15 siemens per metre.",
      art: { art: "sphere", color: "#e3c04a", radius: 0.36 },
    },
    {
      id: "chlorine", name: "Chlorine gas in a flask", category: "nonmetal",
      because: "A yellow-green gas at room temperature: it only condenses at minus 34 degrees. Nothing about it is shiny, bendy or conducting.",
      art: { art: "glassware", which: "flask", level: 0.12, color: "#c6dd6a", bubbles: 0.3 },
    },
    {
      id: "silicon", name: "Silicon wafer", category: "metalloid",
      because: "Mirror-shiny like a metal, yet it shatters like glass, and it conducts about forty thousand million times worse than copper: 1.6 x 10^-3 siemens per metre against copper's 6 x 10^7. That in-between conducting is what a chip is built on.",
      art: { art: "sphere", color: "#6b7a8f", radius: 0.38 },
    },
    {
      id: "boron", name: "Boron lump", category: "metalloid",
      because: "Dark, hard and brittle, melting only at 2076 degrees. It sits on the staircase: a poor conductor that improves when heated, which no true metal does.",
      art: { art: "sphere", color: "#6f5744", radius: 0.34 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A3.4 — Why the table is organized this way
 * ---------------------------------------------------------------- */

const THE_GAPS: ArchetypeSpec = {
  id: "g7a3-the-gaps",
  title: "The Element That Was Predicted Before It Was Found",
  tagline: "Mendeleev left a hole in his table in 1869 and said what would fill it. Seventeen years later, it did.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain that the table is arranged so that elements with similar properties fall in the same column.",
    "Give an example of the table being used to predict, not just to record.",
  ],
  misconceptions: [
    "The periodic table was written down all at once by one person",
    "The table is ordered by atomic mass",
  ],
  specimens: [
    { id: "ge", name: "Germanium-74: 2, 8, 18, 4", art: { art: "atom", protons: 32, neutrons: 42, electrons: 32 } },
  ],
  stages: [
    {
      name: "1829 Triads", at: 0,
      caption: "Dobereiner spots threes. Lithium 6.94, sodium 22.99, potassium 39.10: the middle one sits almost exactly on the average of the outer two, 23.02.",
    },
    {
      name: "1865 Octaves", at: 0.25,
      caption: "Newlands finds properties repeating every eighth element, like notes in a scale. It works as far as calcium, then falls apart, and he is laughed at.",
    },
    {
      name: "1869 Gaps", at: 0.5,
      caption: "Mendeleev orders by mass but breaks his own rule to keep families together, and leaves holes rather than fill them wrongly.",
    },
    {
      name: "1886 Germanium", at: 0.75,
      caption: "Winkler finds the missing element. Predicted mass 72 and density 5.5 g/cm3; measured 72.6 and 5.32. The table had described an element nobody had ever seen.",
    },
    {
      name: "1913 Atomic number", at: 1,
      caption: "Moseley measures nuclear charge with X-rays. Order by protons, not mass, and the last oddity goes: tellurium at 127.6 really does come before iodine at 126.9.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A3.5 — Reactivity patterns across the table
 * ---------------------------------------------------------------- */

const DOWN_THE_GROUP: ArchetypeSpec = {
  id: "g7a3-down-the-group",
  title: "One Row Down, Twice the Trouble",
  tagline: "Sodium in water fizzes. Potassium, one row lower, sets the fizz alight.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Describe how reactivity changes down group 1 and explain it in terms of the outer electron.",
    "Use the position of an element in the table to predict how it will behave.",
  ],
  misconceptions: [
    "A heavier atom must hold its electrons more tightly",
    "Elements in the same group react at the same rate",
  ],
  specimens: [
    {
      id: "sodium", name: "Sodium in water: 2, 8, 1",
      because:
        "2Na + 2H2O gives 2NaOH + H2. It melts into a silver ball at 98 degrees and darts about fizzing. Its outer electron sits in shell 3 and costs 496 kJ/mol to remove.",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#bcd9ea", bubbles: 0.55 },
    },
    {
      id: "potassium", name: "Potassium in water: 2, 8, 8, 1",
      because:
        "The same reaction and the same products, but the outer electron is one shell further out, shielded by eight more electrons, and costs only 419 kJ/mol. So it goes faster, gets hotter, and ignites its own hydrogen with a lilac flame.",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#d7c1ea", bubbles: 1 },
    },
  ],
};

export const g7a3ReadingACell = buildSim(READING_A_CELL);
export const g7a3TheSawtooth = buildSim(THE_SAWTOOTH);
export const g7a3ThreeFamilies = buildSim(THREE_FAMILIES);
export const g7a3TheGaps = buildSim(THE_GAPS);
export const g7a3DownTheGroup = buildSim(DOWN_THE_GROUP);
