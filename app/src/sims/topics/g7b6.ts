import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B6 — Designing a thermal energy device.
 *
 * Five simulations, one per subtopic:
 *
 *   B6.1  g7b6-target-or-limit    criteria and constraints        (sort)
 *   B6.2  g7b6-warm-pack-cold-pack  choosing a chemical process   (compare)
 *   B6.3  g7b6-how-hot-does-it-get  collecting temperature data   (investigate)
 *   B6.4  g7b6-holding-the-heat   modifying the design            (investigate)
 *   B6.5  g7b6-the-write-up       reporting the final design      (process)
 *
 * One device is designed across all five: a hand warmer built on calcium
 * chloride dissolving, which releases 82.8 kJ per mole. The temperatures in
 * the write-up are the ones the two investigations compute, so a student can
 * check the report against the model that produced it.
 */

/* ---------------------------------------------------------------- *
 * B6.1 — Criteria and constraints
 * ---------------------------------------------------------------- */

const TARGET_OR_LIMIT: ArchetypeSpec = {
  id: "g7b6-target-or-limit",
  title: "Target, or Limit?",
  tagline: "Eight lines from the same design brief. Half say what success is, half say what you may not do.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-6"] },
  learningGoals: [
    "Separate the criteria a design is judged by from the constraints it must work within.",
    "Write a criterion as something measurable rather than as an opinion.",
  ],
  misconceptions: [
    "A constraint is just a criterion that is hard to meet",
    "Design goals do not need numbers",
  ],
  categories: [
    { id: "criterion", name: "Criterion", hint: "how success is measured" },
    { id: "constraint", name: "Constraint", hint: "a limit you may not cross" },
  ],
  specimens: [
    {
      id: "reach50", name: "The pack must reach at least 50 C", category: "criterion",
      because: "This is what the device is for, written as a number you can hold a thermometer against. Meet it and the design succeeds on this point; miss it by a degree and it does not.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#e8a06a" },
    },
    {
      id: "outside45", name: "No outer surface may go above 45 C", category: "constraint",
      because: "A limit set by skin, not by the designer: sustained contact above about 44 C damages tissue. Any design that crosses it is rejected however well it warms.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "twentyMin", name: "It must still be above 40 C after 20 minutes", category: "criterion",
      because: "A second measurable target, and the one that usually decides the design. Reaching 50 C is easy; holding heat is what the insulation is for.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#e2b07c" },
    },
    {
      id: "pouch", name: "Everything must fit a 10 cm by 10 cm pouch", category: "constraint",
      because: "A boundary on the design space. It does not tell you whether the pack works; it tells you which working packs you are allowed to build, and it is what rules out very thick insulation.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "cost", name: "Materials must cost under two dollars", category: "constraint",
      because: "Another boundary. Calcium chloride at road-salt prices costs a few cents for 20 g, so this one is comfortable - but it would rule out a design based on a rare reagent.",
      art: { art: "sphere", color: "#c6cbd4", radius: 0.36 },
    },
    {
      id: "faster", name: "It must warm up faster than the pack we sell now", category: "criterion",
      because: "A comparative target, and still measurable: time two packs to 50 C side by side. Criteria can be relative as long as the comparison is one you can actually run.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "approved", name: "Only chemicals on the school's approved list", category: "constraint",
      because: "A safety boundary. Ammonium nitrate and calcium chloride are both on such lists; many hotter reagents are not, and no test result can override that.",
      art: { art: "glassware", which: "testTube", level: 0.45, color: "#d8e2ea" },
    },
    {
      id: "reusable", name: "It must work at least five times over", category: "criterion",
      because: "A target you test by running the pack five times and measuring the fifth. Dissolving calcium chloride is reversible by evaporating the water, so this criterion is reachable - a design that burned a fuel could never meet it.",
      art: { art: "apparatus", which: "spring" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B6.2 — Choosing a chemical process
 * ---------------------------------------------------------------- */

const WARM_PACK_COLD_PACK: ArchetypeSpec = {
  id: "g7b6-warm-pack-cold-pack",
  title: "One Warms, One Chills",
  tagline: "Twenty grams of powder into a hundred of water. One ends at 50 C, the other at 7.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-6"] },
  learningGoals: [
    "Choose between an exothermic and an endothermic process for a stated purpose.",
    "Explain a temperature change in terms of energy released or absorbed by the process.",
  ],
  misconceptions: [
    "Dissolving always warms a solution",
    "A cold pack makes cold",
  ],
  specimens: [
    {
      id: "calcium", name: "Calcium chloride: 20 C up to 49.7 C",
      because: "Dissolving CaCl2 releases 82.8 kJ per mole. 20 g is 0.180 mol, so 14 920 J goes into the 120 g of solution; at 4.18 J per gram per degree that is a rise of 29.7 C. Exothermic, cheap, on every school's approved list, and the same salt that is spread on icy roads.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#e79a5f", bubbles: 6 },
    },
    {
      id: "ammonium", name: "Ammonium nitrate: 20 C down to 7.2 C",
      because: "Dissolving NH4NO3 absorbs 25.7 kJ per mole. 20 g is 0.250 mol, so 6 423 J is taken out of the same 120 g of solution and it falls 12.8 C. Nothing has made cold; energy has left the water to break the crystal apart, which is exactly what an instant cold pack for a sprain is built on.",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#7fb2d8" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B6.3 — Collecting temperature data
 * ---------------------------------------------------------------- */

const HOW_HOT_DOES_IT_GET: ArchetypeSpec = {
  id: "g7b6-how-hot-does-it-get",
  title: "How Hot Does It Actually Get?",
  tagline: "More salt, more heat, until the water will not take any more of it.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-6"] },
  learningGoals: [
    "Calculate a temperature change from the energy of a process and the mass being warmed.",
    "Explain why adding more solute stops helping once the solution is saturated.",
  ],
  misconceptions: [
    "Doubling the chemical always doubles the temperature rise",
    "There is no limit to how much solid will dissolve",
  ],
  specimens: [
    {
      id: "cup", name: "Insulated cup on a balance, thermometer in",
      art: { art: "glassware", which: "beaker", level: 0.6, color: "#e79a5f" },
    },
  ],
  variables: [
    { key: "salt", label: "Calcium chloride added (g)", min: 1, max: 50, step: 1, default: 20 },
    { key: "water", label: "Water in the cup (g)", min: 50, max: 300, step: 10, default: 100 },
  ],
  // CaCl2 dissolves exothermically at 82.8 kJ per mole, molar mass 110.98, so
  // 746 J per gram dissolved. Only 74.5 g will dissolve in 100 g of water at
  // 20 C; past that the extra sits on the bottom and contributes nothing. The
  // solution is taken as 4.18 J/g/K, the usual school assumption - a real
  // concentrated brine holds rather less heat per gram, so the true rise is a
  // little larger than this.
  measure: (v) => {
    const dissolved = Math.min(v.salt, 0.745 * v.water);
    const energyJ = (dissolved / 110.98) * 82800;
    const rise = energyJ / ((dissolved + v.water) * 4.18);
    return {
      dissolvedG: dissolved,
      undissolvedG: v.salt - dissolved,
      energyReleasedJ: energyJ,
      temperatureRiseC: rise,
      finalTemperatureC: 20 + rise,
      energyPerGramJ: 82800 / 110.98,
    };
  },
  plot: {
    x: "salt", y: "finalTemperatureC",
    xLabel: "Calcium chloride added (g)", yLabel: "Final temperature (C)",
  },
};

/* ---------------------------------------------------------------- *
 * B6.4 — Modifying the design
 * ---------------------------------------------------------------- */

const HOLDING_THE_HEAT: ArchetypeSpec = {
  id: "g7b6-holding-the-heat",
  title: "Holding On to the Heat",
  tagline: "The chemistry is over in under a minute. Everything after that is insulation.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-6"] },
  learningGoals: [
    "Predict how thicker insulation changes the rate at which a device loses heat.",
    "Test one change at a time and judge it against the design criterion it was meant to meet.",
  ],
  misconceptions: [
    "Insulation makes a device hotter",
    "Doubling the insulation doubles the temperature",
  ],
  specimens: [
    {
      id: "pack", name: "150 g pack at 50 C, wrapped in foam",
      art: { art: "glassware", which: "flask", level: 0.6, color: "#e79a5f" },
    },
  ],
  variables: [
    { key: "foam", label: "Foam thickness (mm)", min: 1, max: 40, step: 1, default: 5 },
    { key: "outside", label: "Room temperature (C)", min: -10, max: 25, step: 1, default: 5 },
  ],
  // Two resistances in series. Conduction through the foam is d/(kA), with
  // k = 0.035 W/m/K for expanded polystyrene and A = 0.060 m2 for a 10 cm
  // pouch; still air then carries the heat off the outer skin at about
  // h = 10 W/m2/K, which is 1/(hA) = 1.667 K/W however thick the foam is. The
  // pack holds 150 g x 4.18 = 627 J per kelvin, so Newton's law of cooling
  // gives the time to fall from 50 C to the 40 C the brief demands:
  // t = R m c ln((50 - out) / (40 - out)).
  measure: (v) => {
    const foamKW = v.foam / 1000 / (0.035 * 0.06);
    const filmKW = 1 / (10 * 0.06);
    const totalKW = foamKW + filmKW;
    const capacityJK = 150 * 4.18;
    const gap = 50 - v.outside;
    return {
      heatLossAtStartW: gap / totalKW,
      foamResistanceKW: foamKW,
      totalResistanceKW: totalKW,
      timeConstantMin: (totalKW * capacityJK) / 60,
      holdAbove40Min: (totalKW * capacityJK * Math.log(gap / (40 - v.outside))) / 60,
      outerSurfaceC: v.outside + (gap / totalKW) * filmKW,
    };
  },
  plot: {
    x: "foam", y: "holdAbove40Min",
    xLabel: "Foam thickness (mm)", yLabel: "Minutes above 40 C",
  },
};

/* ---------------------------------------------------------------- *
 * B6.5 — Reporting the final design
 * ---------------------------------------------------------------- */

const THE_WRITE_UP: ArchetypeSpec = {
  id: "g7b6-the-write-up",
  title: "The Write-Up",
  tagline: "Claim, evidence, and the cost you paid for it. Three trials, one change at a time.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-6"] },
  learningGoals: [
    "Report a design as a claim supported by the measurements that were actually taken.",
    "State the trade-off a successful modification cost, not only the criterion it met.",
  ],
  misconceptions: [
    "A design report is a description of what you built",
    "A design that meets its criteria has no costs worth reporting",
  ],
  specimens: [
    {
      id: "pack", name: "The hand warmer, third version",
      art: { art: "glassware", which: "beaker", level: 0.58, color: "#e79a5f" },
    },
  ],
  stages: [
    {
      name: "The brief", at: 0,
      caption: "Reach 50 C. Stay above 40 C for 20 minutes. Nothing on the outside above 45 C. Fit a 10 by 10 cm pouch, under two dollars, chemicals from the approved list.",
    },
    {
      name: "The process chosen", at: 0.2,
      caption: "20 g of calcium chloride in 100 g of water: 0.180 mol releasing 82.8 kJ per mole is 14 920 J, taking the pack from 20 C to 49.7 C. Ammonium nitrate was tested and rejected - it falls to 7 C.",
    },
    {
      name: "Trial 1, bare pouch", at: 0.4,
      caption: "Reached 49.7 C in under a minute, then lost heat straight to a 5 C room across a resistance of only 1.7 K/W. Below 40 C after about 4 minutes: first criterion met, second failed badly.",
    },
    {
      name: "Trial 2, 5 mm of foam", at: 0.6,
      caption: "One change only. Total resistance rises to 4.0 K/W and the pack holds above 40 C for 11 minutes. Better, and still half of what the brief asks for.",
    },
    {
      name: "Trial 3, 15 mm of foam", at: 0.8,
      caption: "Total resistance 8.8 K/W and 23 minutes above 40 C. Both criteria are met with a little margin, and the outer skin sits near 14 C, far under the 45 C safety limit.",
    },
    {
      name: "The claim and its cost", at: 1,
      caption: "Claim: 20 g of calcium chloride in 100 g of water inside 15 mm of foam meets both criteria. Evidence: three trials, one variable changed each time, a 49.7 C peak and 23 minutes above 40 C. Cost: the pouch is 3 cm thicker and holds no more chemical, which is the constraint the next version has to fight.",
    },
  ],
};

export const g7b6TargetOrLimit = buildSim(TARGET_OR_LIMIT);
export const g7b6WarmPackColdPack = buildSim(WARM_PACK_COLD_PACK);
export const g7b6HowHotDoesItGet = buildSim(HOW_HOT_DOES_IT_GET);
export const g7b6HoldingTheHeat = buildSim(HOLDING_THE_HEAT);
export const g7b6TheWriteUp = buildSim(THE_WRITE_UP);
