import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B2 — Evidence that a reaction happened.
 *
 * Five simulations, one per subtopic:
 *
 *   B2.1  g7b2-build-the-evidence   signs a reaction may have occurred   (assemble)
 *   B2.2  g7b2-mass-that-left       property data before and after       (investigate)
 *   B2.3  g7b2-the-white-powder     identifying an unknown               (explore)
 *   B2.4  g7b2-looks-can-lie        why appearance alone is not proof    (compare)
 *   B2.5  g7b2-name-that-reaction   naming a reaction from what it does  (sort)
 *
 * Every observation here is tied to a balanced equation and, where it can be,
 * to a number a student could reproduce on a bench: 240 cm3 of hydrogen from
 * 0.243 g of magnesium, a 6.8 degree rise from 0.05 mol of neutralisation.
 */

/* ---------------------------------------------------------------- *
 * B2.1 — Signs a reaction may have occurred
 * ---------------------------------------------------------------- */

const BUILD_THE_EVIDENCE: ArchetypeSpec = {
  id: "g7b2-build-the-evidence",
  title: "Build the Evidence File",
  tagline: "Six things worth writing down, and not one of them is proof on its own.",
  kind: "assemble",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "List the observations that suggest a chemical reaction has taken place.",
    "Explain why each sign is evidence to be checked rather than proof on its own.",
  ],
  misconceptions: [
    "Bubbles always mean a chemical reaction",
    "If nothing looks different, nothing happened",
  ],
  specimens: [
    {
      id: "bench", name: "The reaction bench",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#9ecbe0", bubbles: 14, precipitate: 0.3 },
      parts: [
        {
          id: "gas", name: "A gas where there was none", at: [-0.3, 0.14],
          note: "Mg + 2 HCl gives MgCl2 + H2. Take 0.243 g of magnesium, exactly 0.01 mol, and you collect about 240 cm3 of hydrogen at room temperature. Neither liquid held that gas beforehand.",
        },
        {
          id: "precipitate", name: "A solid from two clear liquids", at: [0.33, 0.2],
          note: "Pb(NO3)2 + 2 KI gives PbI2 + 2 KNO3. The yellow lead iodide will not dissolve, so it falls out of solution. Nothing yellow was suspended in either bottle.",
        },
        {
          id: "colour", name: "Colour that will not wash out", at: [-0.35, -0.16],
          note: "Fe + CuSO4 gives FeSO4 + Cu. Blue solution fades to pale green while a brown copper coat grows on the nail. Rinsing does not take the colour back off.",
        },
        {
          id: "temperature", name: "Temperature change", at: [0.31, -0.2],
          note: "Mix 50 cm3 of 1.0 mol/dm3 hydrochloric acid with 50 cm3 of sodium hydroxide of the same strength. That is 0.05 mol of neutralisation at 57.1 kJ per mole, so 2 855 J warms 100 g of solution by 6.8 C.",
        },
        {
          id: "light", name: "Light given out", at: [0.03, -0.4],
          note: "2 Mg + O2 gives 2 MgO. The ribbon burns at roughly 3 100 C and is painful to look at directly. Energy is leaving as light, not just as warmth.",
        },
        {
          id: "smell", name: "A smell that was not there", at: [-0.04, 0.38],
          note: "FeS + 2 HCl gives FeCl2 + H2S. Hydrogen sulfide smells of rotten eggs and the nose picks it up below one part per billion, long before any instrument on the bench would.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.2 — Analyzing property data before and after
 * ---------------------------------------------------------------- */

const MASS_THAT_LEFT: ArchetypeSpec = {
  id: "g7b2-mass-that-left",
  title: "The Mass That Left the Flask",
  tagline: "Weigh the peroxide, add the catalyst, weigh again. The difference is a gas you can measure.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Read a before-and-after property table as evidence that new substances were made.",
    "Predict the volume of gas a decomposition releases from the balanced equation.",
  ],
  misconceptions: [
    "A catalyst is used up in the reaction",
    "Gas has no mass, so an open flask cannot lose any",
  ],
  specimens: [
    {
      id: "flask", name: "Hydrogen peroxide with a spatula of manganese dioxide",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#cfe3ee", bubbles: 20 },
    },
  ],
  variables: [
    { key: "volume", label: "Volume of solution (cm3)", min: 10, max: 250, step: 5, default: 100 },
    { key: "concentration", label: "Concentration (mol/dm3)", min: 0.1, max: 3, step: 0.1, default: 1 },
  ],
  // 2 H2O2 gives 2 H2O + O2. One mole of oxygen for every two of peroxide,
  // 24 dm3 per mole of gas at room temperature and pressure, 31.998 g per mole
  // of O2, and 98.2 kJ released per mole of H2O2 decomposed. The solution is
  // taken as 1.00 g/cm3 and 4.18 J/g/K, the usual school approximation.
  measure: (v) => {
    const molesH2O2 = (v.concentration * v.volume) / 1000;
    const molesO2 = molesH2O2 / 2;
    const energyJ = molesH2O2 * 98200;
    return {
      molesH2O2,
      oxygenVolumeCm3: molesO2 * 24000,
      massLostG: molesO2 * 31.998,
      waterMadeG: molesH2O2 * 18.015,
      energyReleasedJ: energyJ,
      temperatureRiseC: energyJ / (v.volume * 4.18),
    };
  },
  plot: {
    x: "concentration", y: "oxygenVolumeCm3",
    xLabel: "Concentration (mol/dm3)", yLabel: "Oxygen collected (cm3)",
  },
};

/* ---------------------------------------------------------------- *
 * B2.3 — Identifying an unknown from a property table
 * ---------------------------------------------------------------- */

const THE_WHITE_POWDER: ArchetypeSpec = {
  id: "g7b2-the-white-powder",
  title: "One White Powder, Six Tests",
  tagline: "Sugar, chalk, citric acid or salt? Every test crosses one of them off.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Identify a substance by matching measured properties against a reference table.",
    "Explain why one property is never enough to name an unknown.",
  ],
  misconceptions: [
    "Substances that look alike are alike",
    "One test is enough to identify a substance",
  ],
  specimens: [
    {
      id: "unknown", name: "Unknown sample X, 5.00 g",
      art: { art: "glassware", which: "testTube", level: 0.38, color: "#eef1f0", precipitate: 0.75 },
      parts: [
        {
          id: "look", name: "Look and feel", at: [-0.32, -0.3],
          note: "White cubic crystals about 0.3 mm across, gritty between the fingers. Sugar, citric acid and chalk all look much like this, so appearance rules out nothing at all.",
        },
        {
          id: "melting", name: "Melting point", at: [0.34, -0.26],
          note: "Still solid in the furnace at 700 C; it melts at 801 C. Sucrose caramelises and decomposes near 186 C and citric acid melts at 153 C, so both are already out.",
        },
        {
          id: "solubility", name: "Solubility in water", at: [-0.36, 0.04],
          note: "36 g dissolves in 100 g of water at 20 C, and only 39 g at 100 C. That flat line with temperature is unusual. Chalk, calcium carbonate, would barely dissolve at all: 0.0013 g per 100 g.",
        },
        {
          id: "conductivity", name: "Conductivity", at: [0.33, 0.09],
          note: "The dry powder does not conduct. Dissolved, it conducts strongly, because the ions are free to move. Sugar solution does not conduct at all, which separates ionic from molecular.",
        },
        {
          id: "flame", name: "Flame test", at: [-0.2, 0.34],
          note: "A strong yellow-orange flame at 589 nm, the sodium D lines. That names the metal ion without touching the rest of the sample.",
        },
        {
          id: "silver", name: "Silver nitrate test", at: [0.22, 0.35],
          note: "NaCl + AgNO3 gives AgCl + NaNO3. A white precipitate that darkens in sunlight names the chloride ion. Both halves of the compound are now identified.",
        },
        {
          id: "verdict", name: "The verdict", at: [0.02, -0.44],
          note: "Sodium chloride: 58.44 g per mole, density 2.17 g/cm3, melting 801 C, boiling 1 465 C. Six independent measurements agree, which is what identification means.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.4 — Why appearance alone is not proof
 * ---------------------------------------------------------------- */

const LOOKS_CAN_LIE: ArchetypeSpec = {
  id: "g7b2-looks-can-lie",
  title: "The Loud One Is the Wrong One",
  tagline: "One beaker roars and fogs and does nothing. The quiet one has made a new substance.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Judge a change by what happens to the substances, not by how dramatic it looks.",
    "Use a temperature measurement as evidence when there is nothing to see.",
  ],
  misconceptions: [
    "The more dramatic the change, the more likely it is chemical",
    "No visible change means no reaction",
  ],
  specimens: [
    {
      id: "dryice", name: "Dry ice in warm water: fog, bubbles, roaring",
      because: "Every one of those bubbles is carbon dioxide that was already carbon dioxide. Solid CO2 turns straight to gas at -78.5 C, and 1 g of the block makes about 545 cm3 of gas at room temperature. The white fog is water droplets condensing out of the air, not a new substance. Physical change, and a noisy one.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#dfe9f2", bubbles: 26 },
    },
    {
      id: "neutralise", name: "Acid and alkali: no bubbles, no colour, 6.8 C warmer",
      because: "HCl + NaOH gives NaCl + H2O. 50 cm3 of each at 1.0 mol/dm3 is 0.05 mol reacting at 57.1 kJ per mole, so 2 855 J warms the 100 g of solution by 6.8 C. There is nothing whatever to see, yet the acid is gone, the alkali is gone, and salt water is left. The thermometer is the only witness.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#e8eef0" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.5 — Naming a reaction from what goes in and comes out
 * ---------------------------------------------------------------- */

const NAME_THAT_REACTION: ArchetypeSpec = {
  id: "g7b2-name-that-reaction",
  title: "Name That Reaction",
  tagline: "Eight balanced equations. Count what goes in and what comes out, then post it.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Classify a reaction as synthesis, decomposition, combustion or replacement from its equation.",
    "Read a balanced equation as a count of atoms on each side.",
  ],
  misconceptions: [
    "Any reaction that gives off heat is combustion",
    "The type of reaction depends on how fast it goes",
  ],
  categories: [
    { id: "synthesis", name: "Synthesis", hint: "two make one" },
    { id: "decomposition", name: "Decomposition", hint: "one becomes two" },
    { id: "combustion", name: "Combustion", hint: "fuel plus O2" },
    { id: "replacement", name: "Replacement", hint: "partners swap" },
  ],
  specimens: [
    {
      id: "haber", name: "N2 + 3 H2 gives 2 NH3", category: "synthesis",
      because: "Two reactants, one product. Nitrogen from the air and hydrogen from natural gas at 450 C and 200 atmospheres over iron. Count the atoms: 2 N and 6 H on the left, 2 N and 6 H on the right.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "salt", name: "2 Na + Cl2 gives 2 NaCl", category: "synthesis",
      because: "A soft metal that fizzes in water and a choking green gas make table salt. 45.98 g of sodium and 70.90 g of chlorine give 116.88 g of sodium chloride, and the compound behaves like neither parent.",
      art: { art: "molecule", formula: "NaCl" },
    },
    {
      id: "peroxide", name: "2 H2O2 gives 2 H2O + O2", category: "decomposition",
      because: "One substance, two products. Manganese dioxide speeds it up without being consumed, and 0.1 mol of peroxide yields 0.05 mol of oxygen: about 1 200 cm3 at room temperature.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "limestone", name: "CaCO3 gives CaO + CO2", category: "decomposition",
      because: "Heat limestone past 900 C in a kiln and it splits. 100.09 g gives 56.08 g of quicklime and 44.01 g of carbon dioxide - which is why cement making is such a large source of that gas.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "methane", name: "CH4 + 2 O2 gives CO2 + 2 H2O", category: "combustion",
      because: "A hydrocarbon and oxygen, giving carbon dioxide and water: the signature of complete combustion. 802 kJ is released per mole, which is 50 kJ for every gram of gas.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "ethane", name: "2 C2H6 + 7 O2 gives 4 CO2 + 6 H2O", category: "combustion",
      because: "The same pattern with a bigger fuel. The odd-looking 7 is what it takes to balance: 14 oxygen atoms on the left, 8 in the carbon dioxide and 6 in the water on the right.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "zinc", name: "Zn + 2 HCl gives ZnCl2 + H2", category: "replacement",
      because: "Single replacement: zinc pushes hydrogen out of the acid because it is the more reactive metal. 6.54 g of zinc gives 0.1 mol of hydrogen, about 2 400 cm3, and the metal is visibly eaten away.",
      art: { art: "molecule", formula: "H2" },
    },
    {
      id: "lead", name: "Pb(NO3)2 + 2 KI gives PbI2 + 2 KNO3", category: "replacement",
      because: "Double replacement: the metal ions change partners. Lead iodide will not dissolve, so it drops out as a bright yellow solid while the potassium nitrate stays in solution.",
      art: { art: "glassware", which: "testTube", level: 0.5, color: "#e8d44a", precipitate: 0.6 },
    },
  ],
};

export const g7b2BuildTheEvidence = buildSim(BUILD_THE_EVIDENCE);
export const g7b2MassThatLeft = buildSim(MASS_THAT_LEFT);
export const g7b2TheWhitePowder = buildSim(THE_WHITE_POWDER);
export const g7b2LooksCanLie = buildSim(LOOKS_CAN_LIE);
export const g7b2NameThatReaction = buildSim(NAME_THAT_REACTION);
