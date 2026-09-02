import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B4 — Thermal energy, particles and states.
 *
 * Five simulations, one per subtopic:
 *
 *   B4.1  g7b4-how-fast-are-they     energy added and particle motion  (investigate)
 *   B4.2  g7b4-how-hard-to-pull-apart  forces between particles        (sort)
 *   B4.3  g7b4-the-flat-parts        reading a heating curve           (process)
 *   B4.4  g7b4-stuck-at-a-hundred    why the temperature plateaus      (investigate)
 *   B4.5  g7b4-the-other-liquid      predicting a curve for ethanol    (compare)
 *
 * Water's constants are used throughout and are the measured ones: 2.09, 4.18
 * and 2.01 J/g/K for ice, water and steam, 334 J/g to melt and 2 260 J/g to
 * boil. The kinetic theory numbers come from (3/2)kT and root(3RT/M).
 */

/* ---------------------------------------------------------------- *
 * B4.1 — Energy added and particle motion, revisited
 * ---------------------------------------------------------------- */

const HOW_FAST_ARE_THEY: ArchetypeSpec = {
  id: "g7b4-how-fast-are-they",
  title: "How Fast Are They Actually Going?",
  tagline: "A nitrogen molecule in this room is travelling at 511 m/s, half again the speed of sound.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Relate temperature to the average kinetic energy of the particles.",
    "Explain why light particles move faster than heavy ones at the same temperature.",
  ],
  misconceptions: [
    "Hot particles are bigger than cold ones",
    "All gas particles at one temperature move at the same speed",
  ],
  specimens: [
    { id: "gas", name: "A flask of gas", art: { art: "molecule", formula: "N2" } },
  ],
  variables: [
    { key: "temperature", label: "Temperature (K)", min: 100, max: 1000, step: 5, default: 293 },
    { key: "molarMass", label: "Molar mass of the gas (g/mol)", min: 2, max: 44, step: 1, default: 28 },
  ],
  // Average translational kinetic energy is (3/2)kT per particle, with the
  // Boltzmann constant at 1.380649e-23 J/K, and (3/2)RT per mole. The
  // root-mean-square speed is root(3RT/M) with M in kg per mole: hydrogen at
  // 2 g/mol goes almost four times as fast as oxygen at 32 g/mol.
  measure: (v) => ({
    temperatureC: v.temperature - 273.15,
    averageKineticEnergyJ: 1.5 * 1.380649e-23 * v.temperature,
    energyPerMoleJ: 1.5 * 8.314462 * v.temperature,
    rmsSpeedMs: Math.sqrt((3 * 8.314462 * v.temperature) / (v.molarMass / 1000)),
    rmsSpeedKmh: Math.sqrt((3 * 8.314462 * v.temperature) / (v.molarMass / 1000)) * 3.6,
  }),
  plot: {
    x: "temperature", y: "rmsSpeedMs",
    xLabel: "Temperature (K)", yLabel: "Typical particle speed (m/s)",
  },
};

/* ---------------------------------------------------------------- *
 * B4.2 — Forces between particles
 * ---------------------------------------------------------------- */

const HOW_HARD_TO_PULL_APART: ArchetypeSpec = {
  id: "g7b4-how-hard-to-pull-apart",
  title: "How Hard Are They Holding On?",
  tagline: "Boiling point is a measurement of how tightly the particles grip each other.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Use melting and boiling points as evidence for the strength of the forces between particles.",
    "Explain why a substance is solid, liquid or gas at room temperature.",
  ],
  misconceptions: [
    "Heavier particles always mean a higher boiling point",
    "Boiling breaks the bonds inside the molecules",
  ],
  categories: [
    { id: "strong", name: "Strong attractions", hint: "solid well past 20 C" },
    { id: "weak", name: "Weak attractions", hint: "gas long before 20 C" },
  ],
  specimens: [
    {
      id: "nacl", name: "Sodium chloride", category: "strong",
      because: "Melts at 801 C and boils at 1 465 C. Every Na+ is pulled at by six Cl- and the other way round, all through the crystal. Heating to 800 C is what it takes to shake that lattice apart.",
      art: { art: "molecule", formula: "NaCl" },
    },
    {
      id: "iron", name: "Iron", category: "strong",
      because: "Melts at 1 538 C. The atoms sit in a sea of shared electrons that pulls the whole block together, which is also why it conducts and why it bends instead of shattering.",
      art: { art: "sphere", color: "#8e9199", radius: 0.4 },
    },
    {
      id: "diamond", name: "Carbon as diamond", category: "strong",
      because: "It does not melt at ordinary pressure at all: it turns straight to vapour above about 3 600 C. Each atom is bonded to four neighbours, so melting it would mean breaking real covalent bonds rather than just loosening a grip.",
      art: { art: "sphere", color: "#dfe9f2", radius: 0.34, glow: 0.6 },
    },
    {
      id: "water", name: "Water", category: "strong",
      because: "Boils at 100 C even though a molecule weighs only 18.02 g per mole. Hydrogen bonds between the molecules do that. Without them water would boil near -80 C and there would be no liquid on Earth.",
      art: { art: "molecule", formula: "H2O" },
    },
    {
      id: "methane", name: "Methane", category: "weak",
      because: "Boils at -161.5 C, and it is nearly as heavy as water at 16.04 g per mole. Nothing holds one CH4 to the next except fleeting shifts in their electron clouds, so it is a gas everywhere on Earth.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "oxygen", name: "Oxygen", category: "weak",
      because: "Boils at -183.0 C, which is 90.19 K. Liquid oxygen exists only in a cold tank; leave the lid off and the weak attractions lose to room temperature within seconds.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "nitrogen", name: "Nitrogen", category: "weak",
      because: "Boils at -195.8 C. The bond inside the molecule is one of the strongest in chemistry at 945 kJ per mole, but the pull between one N2 and the next is feeble. Those are two different things and this is the substance that proves it.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "helium", name: "Helium", category: "weak",
      because: "Boils at -268.9 C, only 4.2 degrees above absolute zero, and never freezes at ordinary pressure. A helium atom is a closed shell of two electrons with almost nothing to offer a neighbour.",
      art: { art: "atom", protons: 2, neutrons: 2, electrons: 2 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.3 — Reading a heating curve
 * ---------------------------------------------------------------- */

const THE_FLAT_PARTS: ArchetypeSpec = {
  id: "g7b4-the-flat-parts",
  title: "The Two Flat Parts",
  tagline: "100 g of ice at -20 C, a 500 W heater, and a thermometer that twice refuses to move.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Read the sloping and flat sections of a heating curve as warming and changing state.",
    "Work out the energy each section of the curve takes.",
  ],
  misconceptions: [
    "The temperature rises steadily while a substance is heated",
    "A flat section means the heater has stopped supplying energy",
  ],
  specimens: [
    {
      id: "beaker", name: "100 g of water, heated at 500 W",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#9fd0ea", bubbles: 18 },
    },
  ],
  stages: [
    {
      name: "Ice warming", at: 0,
      caption: "-20 C up to 0 C. Ice takes 2.09 J per gram per degree, so 100 g needs 4 180 J: eight seconds, and the line climbs steeply.",
    },
    {
      name: "Melting", at: 0.2,
      caption: "Flat at 0 C for 67 seconds while 33 400 J goes in. The heater has not stopped; the energy is prising the lattice apart instead of speeding anything up.",
    },
    {
      name: "Water warming", at: 0.4,
      caption: "0 C to 100 C. Liquid water needs 4.18 J per gram per degree, twice as much as ice, so 41 800 J and 84 seconds. The line climbs at half the slope it had.",
    },
    {
      name: "Boiling", at: 0.6,
      caption: "Flat at 100 C for 452 seconds while 226 000 J goes in. Pulling molecules right away from each other costs nearly seven times what melting cost.",
    },
    {
      name: "Steam warming", at: 0.8,
      caption: "100 C to 120 C. Steam takes 2.01 J per gram per degree, so 4 020 J and eight seconds. The steepest climb on the whole curve.",
    },
    {
      name: "The whole curve", at: 1,
      caption: "309 400 J and 619 seconds from start to finish. The two flat parts used 84 per cent of the time and none of the temperature rise.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.4 — Why temperature plateaus during a state change
 * ---------------------------------------------------------------- */

const STUCK_AT_A_HUNDRED: ArchetypeSpec = {
  id: "g7b4-stuck-at-a-hundred",
  title: "Stuck at a Hundred",
  tagline: "Turn the heater up and the plateau gets shorter, never smaller.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Calculate the energy a state change needs from mass and the latent heat.",
    "Explain a plateau as energy going into separating particles rather than speeding them up.",
  ],
  misconceptions: [
    "A more powerful heater makes water boil at a higher temperature",
    "Energy stops going in during a plateau",
  ],
  specimens: [
    {
      id: "pan", name: "Water on a heater",
      art: { art: "glassware", which: "flask", level: 0.48, color: "#9fd0ea", bubbles: 24 },
    },
  ],
  variables: [
    { key: "mass", label: "Mass of water (g)", min: 10, max: 500, step: 5, default: 100 },
    { key: "power", label: "Heater power (W)", min: 100, max: 2000, step: 25, default: 500 },
  ],
  // Ice 2.09, water 4.18 J/g/K; 334 J/g of fusion at 0 C and 2 260 J/g of
  // vaporisation at 100 C. The run modelled here starts at -20 C and ends with
  // the last drop boiled away, and every second of it comes from energy over
  // power, so doubling the heater halves every time and changes no energy.
  measure: (v) => {
    const warmIce = v.mass * 2.09 * 20;
    const melt = v.mass * 334;
    const warmWater = v.mass * 4.18 * 100;
    const boil = v.mass * 2260;
    const total = warmIce + melt + warmWater + boil;
    return {
      meltEnergyJ: melt,
      meltPlateauS: melt / v.power,
      boilEnergyJ: boil,
      boilPlateauS: boil / v.power,
      totalEnergyJ: total,
      totalTimeS: total / v.power,
      plateauShareOfTime: (melt + boil) / total,
    };
  },
  plot: {
    x: "mass", y: "boilPlateauS",
    xLabel: "Mass of water (g)", yLabel: "Time stuck at 100 C (s)",
  },
};

/* ---------------------------------------------------------------- *
 * B4.5 — Predicting a heating curve for a new substance
 * ---------------------------------------------------------------- */

const THE_OTHER_LIQUID: ArchetypeSpec = {
  id: "g7b4-the-other-liquid",
  title: "Now Predict Ethanol",
  tagline: "Same shape of curve, every number different, and less than half the energy.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Predict the shape of a heating curve for a substance from its melting and boiling points.",
    "Compare the energy two substances need for the same journey through their states.",
  ],
  misconceptions: [
    "Every liquid boils at 100 C",
    "The plateaus are the same length for every substance",
  ],
  specimens: [
    {
      id: "water", name: "100 g of water: 301 200 J from ice to steam",
      because: "Melts at 0 C, taking 33 400 J. Warms 100 degrees to its boiling point at 4.18 J/g/K, which is 41 800 J. Boils at 100 C, taking 226 000 J - three quarters of the whole bill. The liquid stretch is only 100 degrees wide.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#9fd0ea", bubbles: 16 },
    },
    {
      id: "ethanol", name: "100 g of ethanol: 141 400 J for the same journey",
      because: "Melts at -114.1 C, taking only 10 600 J. Warms 192.5 degrees to its boiling point at 2.44 J/g/K, which is 47 000 J. Boils at 78.4 C, taking 83 800 J. Both plateaus are shorter and the sloping middle is far longer, because ethanol stays liquid over almost twice the range water does. The curve has the same five sections in the same order; only the numbers move.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#e4eef0", bubbles: 20 },
    },
  ],
};

export const g7b4HowFastAreThey = buildSim(HOW_FAST_ARE_THEY);
export const g7b4HowHardToPullApart = buildSim(HOW_HARD_TO_PULL_APART);
export const g7b4TheFlatParts = buildSim(THE_FLAT_PARTS);
export const g7b4StuckAtAHundred = buildSim(STUCK_AT_A_HUNDRED);
export const g7b4TheOtherLiquid = buildSim(THE_OTHER_LIQUID);
