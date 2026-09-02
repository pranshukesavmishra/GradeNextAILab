import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C4 — Food molecules rearranged.
 *
 * Five simulations, one per subtopic:
 *
 *   C4.1  g7c4-one-spoonful        modelling a food molecule broken down (assemble)
 *   C4.2  g7c4-atom-inventory      the atoms rearranged into products    (sort)
 *   C4.3  g7c4-bonds-cost-bonds-pay  energy released, not created        (process)
 *   C4.4  g7c4-flame-or-cell       respiration beside a familiar reaction (compare)
 *   C4.5  g7c4-a-different-fuel    applying the model to a fat           (investigate)
 *
 * Glucose is 180.156 g per mole: 6 carbon at 12.011, 12 hydrogen at 1.008 and
 * 6 oxygen at 15.999. That is 40.0 per cent carbon, 6.7 per cent hydrogen and
 * 53.3 per cent oxygen by mass, and every claim in this topic is checked back
 * against those three figures.
 */

/**
 * Water in a calorimeter can, cold to boiling. A single colour ramp so the
 * can in C4.3 reads as a thermometer at a glance.
 */
const WATER_HEAT = ["#5b8fd0", "#7e9cc4", "#a89bab", "#c68f86", "#d9713f", "#d94a2a"];

/* ---------------------------------------------------------------- *
 * C4.1 — Modeling a food molecule broken down
 * ---------------------------------------------------------------- */

const ONE_SPOONFUL: ArchetypeSpec = {
  id: "g7c4-one-spoonful",
  title: "One Spoonful, Taken Apart",
  tagline: "Five grams of glucose. Work out what is actually in it before you burn it.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Describe a food molecule as a fixed number of carbon, hydrogen and oxygen atoms.",
    "Explain that breaking a food molecule down separates atoms that already existed.",
  ],
  misconceptions: [
    "Food is destroyed when the body uses it",
    "Sugar is a single kind of particle with no parts",
  ],
  specimens: [
    {
      id: "glucose", name: "Glucose dissolved in water",
      art: { art: "glassware", which: "testTube", level: 0.72, color: "#d9a441" },
      parts: [
        {
          id: "carbon", name: "Six carbon atoms", at: [-0.62, -0.36],
          note: "72.07 g of the 180.16: exactly 40 per cent of the mass.",
        },
        {
          id: "hydrogen", name: "Twelve hydrogen atoms", at: [0.58, -0.42],
          note: "12.10 g, only 6.7 per cent, and the lightest atoms there are.",
        },
        {
          id: "oxygen", name: "Six oxygen atoms", at: [0.66, 0.16],
          note: "95.99 g: over half the mass of the molecule is oxygen.",
        },
        {
          id: "bonds", name: "The C-C and C-H bonds", at: [-0.08, 0.5],
          note: "Where the 2803 kJ per mole is actually held.",
        },
        {
          id: "count", name: "One 5.0 g spoonful", at: [-0.7, 0.26],
          note: "0.0278 mol, which is 1.67 x 10^22 molecules.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C4.2 — Modeling the atoms rearranged into products
 * ---------------------------------------------------------------- */

const ATOM_INVENTORY: ArchetypeSpec = {
  id: "g7c4-atom-inventory",
  title: "Check the Atom Inventory",
  tagline: "A reaction can only build things out of the atoms it was handed. Which of these qualify?",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7", "MS-PS1-5"] },
  learningGoals: [
    "Use atom counting to decide whether a product is possible from given reactants.",
    "Explain that breaking down food rearranges atoms without changing which atoms exist.",
  ],
  misconceptions: [
    "A reaction can make any product if enough energy is supplied",
    "New elements appear when food is digested",
  ],
  categories: [
    { id: "yes", name: "Glucose has these atoms", hint: "built only from C, H and O" },
    { id: "no", name: "Glucose has no such atoms", hint: "would need an element that is not there" },
  ],
  specimens: [
    {
      id: "co2", name: "Carbon dioxide", category: "yes",
      because:
        "Carbon and oxygen, both present. This is the real product: all six carbons leave as six CO2, 264.05 g per mole of glucose.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "water", name: "Water", category: "yes",
      because:
        "Hydrogen and oxygen, both present. Six H2O come out per glucose, 108.09 g, though the oxygen in them comes from the air.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "methane", name: "Methane", category: "yes",
      because:
        "Carbon and hydrogen only, so the atoms are all there. Gut microbes really do make it from sugar when oxygen runs out.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "oxygen", name: "Oxygen gas", category: "yes",
      because:
        "Glucose holds six oxygen atoms, so O2 is not ruled out by counting. Respiration still does not make it: it uses it up.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "nitrogen", name: "Nitrogen gas", category: "no",
      because:
        "There is not one nitrogen atom in C6H12O6. No amount of energy will conjure one, which is why you must eat protein for nitrogen.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "salt", name: "Sodium chloride", category: "no",
      because:
        "Sodium and chlorine are both missing. Salt has to be eaten as salt; no rearrangement of sugar can produce it.",
      art: { art: "molecule", formula: "NaCl" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C4.3 — Energy released, not created
 * ---------------------------------------------------------------- */

const BONDS_COST_BONDS_PAY: ArchetypeSpec = {
  id: "g7c4-bonds-cost-bonds-pay",
  title: "Breaking Costs, Making Pays",
  tagline: "Add up the bond energies both ways and the 2803 kJ appears out of the arithmetic.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7", "MS-PS1-6"] },
  learningGoals: [
    "Explain that energy is released because the new bonds are stronger than the old ones.",
    "Estimate the energy of a reaction from mean bond enthalpies.",
  ],
  misconceptions: [
    "Energy is created when food is burned",
    "Breaking bonds releases energy",
  ],
  specimens: [
    {
      id: "can", name: "The can of water that catches the heat",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#5b8fd0" },
    },
  ],
  variables: [
    { key: "glucoseG", label: "Glucose burned under the can (g)", min: 0.1, max: 3, step: 0.1, default: 1 },
  ],
  /*
   * The bond audit, scaled to whatever sample is on the pan, and then cashed
   * in as a temperature.
   *
   * Per mole: 12 458 kJ has to go in to pull the bonds apart and 15 216 kJ
   * comes back out as the new ones form, so 2 758 kJ is left over. One gram
   * of glucose is 1/180.156 of a mole, so it leaves 15.31 kJ.
   *
   * The can holds 100 g of water, and water takes 4.18 J to warm one gram by
   * one degree, so 15.31 kJ raises it 36.6 C. Take every joule as reaching
   * the water, which is the assumption the arithmetic makes and not what a
   * real can manages: a school rig loses about two thirds of it to the air.
   */
  measure: (v) => {
    const moles = v.glucoseG / 180.156;
    const bondsBrokenKJ = moles * 12458;
    const bondsMadeKJ = moles * 15216;
    const netKJ = bondsMadeKJ - bondsBrokenKJ;
    const riseK = netKJ / (0.1 * 4.18);
    return {
      moles,
      bondsBrokenKJ,
      bondsMadeKJ,
      netKJ,
      temperatureRiseK: riseK,
      finalTemperatureC: Math.min(100, 20 + riseK),
      boilingPointReachedG: (80 * 0.1 * 4.18 * 180.156) / 2758,
    };
  },
  /*
   * The can is the readout: its water carries the colour of its temperature,
   * from 20 C blue to boiling red, and the arithmetic on the rail above is
   * what put it there.
   *
   * Past 2.18 g of glucose the 100 g of water reaches 100 C and the
   * experiment fails - the thermometer stops rising, the water boils off, and
   * every joule after that goes into steam rather than into the reading. That
   * is the threshold, and it is why calorimetry uses a large water mass and a
   * small sample.
   */
  drive: ({ f }) => {
    const boiling = f.finalTemperatureC >= 99.9;
    const step = Math.min(5, Math.max(0, Math.floor(((f.finalTemperatureC - 20) / 80) * 5.999)));
    return {
      color: WATER_HEAT[step],
      bubbles: boiling ? 34 : 0,
      level: boiling ? 0.54 : 0.62,
    };
  },
  /**
   * Mean bond enthalpies in kJ per mole: C-C 348, C-H 412, C-O 360, O-H 463,
   * O=O 496, C=O in an aldehyde 743, C=O in carbon dioxide 805.
   *
   * Open-chain glucose has 5 C-C, 7 C-H, 5 C-O, 5 O-H and 1 aldehyde C=O, so
   * pulling it apart costs 1740 + 2884 + 1800 + 2315 + 743 = 9482 kJ. Six O=O
   * adds 2976, giving 12 458 kJ in. Building six CO2 gives back 12 x 805 =
   * 9660 and six H2O gives 12 x 463 = 5556, so 15 216 kJ comes out. The
   * difference, 2758 kJ, is within two per cent of the measured 2803 kJ.
   */
  stages: [
    {
      name: "Start", at: 0,
      caption: "One glucose and six oxygen. Every joule that comes out is already sitting in bonds.",
    },
    {
      name: "Break the sugar", at: 0.25,
      caption: "5 C-C, 7 C-H, 5 C-O, 5 O-H and 1 C=O. Pulling them apart costs 9482 kJ.",
    },
    {
      name: "Break the oxygen", at: 0.5,
      caption: "Six O=O at 496 kJ each: 2976 kJ more. Running total going in: 12 458 kJ.",
    },
    {
      name: "Make the products", at: 0.75,
      caption: "Twelve C=O at 805 and twelve O-H at 463: 9660 + 5556 = 15 216 kJ comes back out.",
    },
    {
      name: "Net", at: 1,
      caption: "15 216 out less 12 458 in leaves 2758 kJ. Measured value: 2803 kJ. Nothing created.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C4.4 — Comparing respiration to a familiar reaction
 * ---------------------------------------------------------------- */

const FLAME_OR_CELL: ArchetypeSpec = {
  id: "g7c4-flame-or-cell",
  title: "A Flame, or a Cell",
  tagline: "The same equation twice. One finishes in a second, the other takes thirty small steps.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Recognise respiration and combustion as the same overall reaction.",
    "Explain why a cell releases the energy in many small steps rather than one.",
  ],
  misconceptions: [
    "Respiration is a kind of slow burning inside the cell, flame and all",
    "A cell captures all the energy in its food",
  ],
  specimens: [
    {
      id: "flame", name: "Burning glucose in a flame",
      because: "One step, above 600 C. All 2803 kJ leaves at once as heat and light.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "cell", name: "Respiring glucose in a cell",
      because: "About 30 steps at 37 C. Some 1000 kJ is caught as 32 ATP.",
      art: { art: "organelle", which: "mitochondrion" },
    },
  ],
  variables: [
    { key: "glucoseG", label: "Glucose supplied to each (g)", min: 0.5, max: 50, step: 0.5, default: 10 },
    { key: "cellTemperatureC", label: "Temperature the cell is held at (C)", min: 20, max: 60, step: 1, default: 37 },
  ],
  /*
   * The same fuel handed to both, and the same 2803 kJ per mole in it either
   * way. What differs is what is done with it.
   *
   * The flame gives all of it up at once as heat and light, at over 600 C.
   * The cell takes about thirty steps at 37 C and traps 32 ATP per glucose;
   * at the standard 30.5 kJ per mole of ATP that is 976 kJ, so 34.8 per cent
   * is captured and the other 65 per cent still leaves as heat.
   *
   * The cell's enzymes hold that up only while it is cool enough. They begin
   * to denature above 40 C and are finished by 50, so above 50 C the cell
   * captures nothing at all. The flame does not care: it is already far
   * hotter than any temperature this control can reach.
   */
  measure: (v) => {
    const moles = v.glucoseG / 180.156;
    const totalEnergyKJ = moles * 2803;
    const enzymeFactor = v.cellTemperatureC <= 40
      ? 1 : Math.max(0, (50 - v.cellTemperatureC) / 10);
    const atpMoles = moles * 32 * enzymeFactor;
    const capturedKJ = atpMoles * 30.5;
    return {
      totalEnergyKJ,
      atpMoles,
      capturedKJ,
      capturedPercent: (100 * capturedKJ) / totalEnergyKJ,
      heatFromFlameKJ: totalEnergyKJ,
      heatFromCellKJ: totalEnergyKJ - capturedKJ,
    };
  },
  /*
   * Each side is drawn at the cube root of the energy it delivers, against
   * the same 200 kJ reference, so the two piles can be read against each
   * other directly. The flame's pile is all 2803 kJ per mole; the cell's is
   * only the 976 kJ it banks as ATP, which is why it is always the smaller of
   * the two by a factor of 1.4 in width - the cube root of about a third.
   *
   * Warm the cell past 50 C and its enzymes are gone: the mitochondrion
   * collapses to a speck and stops turning, while the burner beside it does
   * not change at all.
   */
  drive: ({ f, index }) => {
    if (index === 0) {
      return { scale: Math.min(1.8, Math.cbrt(f.totalEnergyKJ / 200)) };
    }
    const dead = f.capturedKJ < 0.01;
    return {
      scale: Math.min(1.8, Math.cbrt(Math.max(0.002, f.capturedKJ / 200))),
      rate: dead ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * C4.5 — Applying the model to an unfamiliar food molecule
 * ---------------------------------------------------------------- */

const A_DIFFERENT_FUEL: ArchetypeSpec = {
  id: "g7c4-a-different-fuel",
  title: "A Different Fuel Entirely",
  tagline: "Swap glucose for a fat and run the same model. The atoms still have to balance.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Apply the respiration model to a food molecule the student has not met before.",
    "Explain why fat carries more than twice the energy of sugar per gram.",
  ],
  misconceptions: [
    "All foods release the same energy per gram",
    "Fat is not respired, only stored",
  ],
  specimens: [
    {
      id: "fat", name: "Palmitic acid, the commonest fat in food",
      art: { art: "glassware", which: "flask", level: 0.42, color: "#e8cf7a" },
    },
  ],
  variables: [
    { key: "fatG", label: "Fat respired (g)", min: 1, max: 100, step: 1, default: 10 },
    { key: "massKg", label: "Body mass (kg)", min: 20, max: 120, step: 1, default: 60 },
  ],
  /**
   * Palmitic acid is C16H32O2, 256.43 g per mole, and its equation balances
   * exactly as glucose's does:
   *
   *     C16H32O2 + 23 O2  ->  16 CO2 + 16 H2O     dH = -10031 kJ per mole
   *
   * Carbon 16 both sides, hydrogen 32 both sides, oxygen 2 + 46 = 48 against
   * 32 + 16 = 48. Per gram of fat that is 2.870 g of oxygen used, 2.746 g of
   * carbon dioxide and 1.124 g of water made, and 39.12 kJ released - two and
   * a half times glucose's 15.56 kJ, because a fat is mostly C-H bonds and
   * carries almost no oxygen of its own.
   *
   * The respiratory quotient, carbon dioxide out over oxygen in, is 16/23 =
   * 0.70 for fat against exactly 1.00 for glucose, which is how a lab tells
   * which fuel a person is burning.
   *
   * Walking time uses the same MET definition as C3.1: a brisk walk is 4 METs,
   * so oxygen use is 4 x 3.5 x mass cm3 per minute, and a litre of oxygen
   * burning fat yields 10031 / (23 x 22.414) = 19.46 kJ.
   */
  measure: (v) => {
    const moles = v.fatG / 256.43;
    const energyKJ = moles * 10031;
    const walkOxygenLPerMin = (4 * 3.5 * v.massKg) / 1000;
    return {
      energyKJ,
      energyPerGramKJ: 10031 / 256.43,
      oxygenNeededG: moles * 23 * 31.998,
      carbonDioxideMadeG: moles * 16 * 44.009,
      waterMadeG: moles * 16 * 18.015,
      respiratoryQuotient: 16 / 23,
      briskWalkMinutes: energyKJ / (walkOxygenLPerMin * 19.46),
    };
  },
  plot: {
    x: "fatG", y: "energyKJ",
    xLabel: "Fat respired (g)", yLabel: "Energy released (kJ)",
  },
  /*
   * The flask holds the fat itself, drawn at its own volume: palmitic acid is
   * a white waxy solid of density 0.85 g per cm3, so 100 g is 118 cm3, and
   * the flask is scaled to a 160 cm3 body. The bubble stream is the carbon
   * dioxide the equation says comes back out, 2.746 g for every gram of fat,
   * which is why the stream thickens far faster than the fat itself grows.
   */
  drive: ({ f, v }) => {
    const bubbles = f.carbonDioxideMadeG / 6;
    return {
      level: Math.min(0.86, 0.06 + v.fatG / (0.85 * 160)),
      precipitate: 0.55,
      bubbles: bubbles < 1 ? 0 : Math.min(45, bubbles),
    };
  },
};

export const g7c4OneSpoonful = buildSim(ONE_SPOONFUL);
export const g7c4AtomInventory = buildSim(ATOM_INVENTORY);
export const g7c4BondsCostBondsPay = buildSim(BONDS_COST_BONDS_PAY);
export const g7c4FlameOrCell = buildSim(FLAME_OR_CELL);
export const g7c4ADifferentFuel = buildSim(A_DIFFERENT_FUEL);
