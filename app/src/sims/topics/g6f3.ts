import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F3 — Causes: human activities and natural factors.
 *
 * Five simulations, one per subtopic:
 *
 *   F3.1  g6f3-which-gases-trap    greenhouse gases                  (sort)
 *   F3.2  g6f3-burning-and-baking  fossil fuels and cement           (investigate)
 *   F3.3  g6f3-forest-to-burger    agriculture and land use          (trace)
 *   F3.4  g6f3-sun-or-us           natural factors                   (compare)
 *   F3.5  g6f3-how-fast-is-fast    comparing timescales              (process)
 *
 * F3.1 uses the molecule kit at its real bond angles, because the reason
 * nitrogen is not a greenhouse gas and carbon dioxide is comes down to shape:
 * a molecule of two identical atoms has no lopsidedness to wave at a passing
 * infrared wave, and a linear CO2 molecule that bends has plenty.
 */

/* ---------------------------------------------------------------- *
 * F3.1 — Greenhouse gases
 * ---------------------------------------------------------------- */

const WHICH_GASES_TRAP: ArchetypeSpec = {
  id: "g6f3-which-gases-trap",
  title: "Which Gases Catch the Heat?",
  tagline: "Ninety-nine per cent of the air does nothing at all. Sort the six and find out why.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-PS4-2"] },
  learningGoals: [
    "Identify which atmospheric gases absorb infrared radiation and which do not.",
    "Explain that a molecule of two identical atoms cannot absorb infrared, however abundant it is.",
    "Give the present concentration of the main greenhouse gases.",
  ],
  misconceptions: [
    "The most abundant gases in the air must be the important greenhouse gases",
    "Oxygen traps heat",
    "Water vapour is a human emission like carbon dioxide",
  ],
  categories: [
    { id: "absorbs", name: "Catches infrared", hint: "the molecule can bend or stretch lopsidedly" },
    { id: "transparent", name: "Lets infrared straight through", hint: "two identical atoms, nothing to wave" },
  ],
  specimens: [
    {
      id: "n2", name: "Nitrogen, N2", category: "transparent",
      because: "78 per cent of the air and no greenhouse effect worth measuring. Two identical atoms share their electrons evenly, so stretching the bond makes no lopsided charge for an infrared wave to push on.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "o2", name: "Oxygen, O2", category: "transparent",
      because: "21 per cent of the air, and transparent to infrared for exactly the same reason as nitrogen. Between them these two are 99 per cent of the atmosphere and contribute almost nothing to the greenhouse effect.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "h2", name: "Hydrogen, H2", category: "transparent",
      because: "Two identical atoms again, so it cannot absorb infrared directly. Hydrogen still matters indirectly: leaked hydrogen slows the destruction of methane, which does absorb.",
      art: { art: "molecule", formula: "H2" },
    },
    {
      id: "co2", name: "Carbon dioxide, CO2", category: "absorbs",
      because: "Straight when at rest, but it bends, and the bending vibration absorbs hard at 15 micrometres, right where a surface at 15 degrees radiates most. 424 ppm today against 280 before 1750, worth 2.16 W/m2 of extra heating.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "ch4", name: "Methane, CH4", category: "absorbs",
      because: "A tetrahedron with four bonds that bend and twist, absorbing in gaps that CO2 leaves open. 1,930 parts per billion today against 722 before 1750: rare, but tonne for tonne about 28 times stronger than CO2 over a century.",
      art: { art: "molecule", formula: "CH4" },
    },
    {
      id: "h2o", name: "Water vapour, H2O", category: "absorbs",
      because: "Bent at 104.5 degrees, permanently lopsided, and the strongest absorber in the air. But a molecule lasts about 9 days, so the air holds only what its temperature allows. It follows the warming and roughly doubles it, rather than causing it.",
      art: { art: "molecule", formula: "H2O" },
    },
  ],
};

export const g6f3WhichGasesTrap = buildSim(WHICH_GASES_TRAP);

/* ---------------------------------------------------------------- *
 * F3.2 — Fossil-fuel combustion and cement production
 * ---------------------------------------------------------------- */

const BURNING_AND_BAKING: ArchetypeSpec = {
  id: "g6f3-burning-and-baking",
  title: "Burning It, and Baking It",
  tagline: "One tank of petrol and one tonne of cement. Only one of them involves a fire.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-PS1-2"] },
  learningGoals: [
    "Compute the CO2 released by burning a known volume of fuel, from the mass of carbon in it.",
    "Explain that most of cement's CO2 comes out of the limestone itself, not out of the fire.",
    "Use the fact that every kilogram of carbon burned becomes 3.67 kg of carbon dioxide.",
  ],
  misconceptions: [
    "Cement emissions could be removed simply by using a cleaner fuel",
    "The CO2 from a car comes from the air rather than from the fuel",
    "A litre of petrol can only make a litre's worth of gas",
  ],
  specimens: [
    { id: "co2", name: "Carbon dioxide leaving the exhaust", art: { art: "molecule", formula: "CO2" } },
  ],
  variables: [
    { key: "petrolLitres", label: "Petrol burned in a year (litres)", min: 0, max: 3000, step: 10, default: 1200 },
    { key: "cementTonnes", label: "Cement used in a year (tonnes)", min: 0, max: 10, step: 0.1, default: 0.5 },
  ],
  // Petrol is close to C8H18. A litre weighs 0.75 kg and is about 84 per cent
  // carbon by mass, so it carries 0.63 kg of carbon. Burning turns each carbon
  // atom, 12 g, into a CO2 molecule, 44 g, so the mass multiplies by 44/12 =
  // 3.667: 0.63 * 3.667 = 2.31 kg of CO2 per litre. That is the published
  // figure, and it is heavier than the fuel because the oxygen comes from the
  // air.
  //
  // Cement is different. Heating limestone drives CaCO3 -> CaO + CO2, and
  // 100 g of limestone gives 56 g of quicklime and 44 g of CO2. Per tonne of
  // finished cement that chemistry alone releases about 0.41 tonnes; the kiln
  // fuel adds roughly another 0.19, for about 0.60 tonnes in total. Two thirds
  // of it therefore comes out of the rock, whatever you burn underneath.
  measure: (v) => {
    const petrolKg = v.petrolLitres * 2.31;
    const calcinationKg = v.cementTonnes * 410;
    const kilnFuelKg = v.cementTonnes * 190;
    const totalKg = petrolKg + calcinationKg + kilnFuelKg;
    return {
      petrolCO2kg: petrolKg,
      cementCO2kg: calcinationKg + kilnFuelKg,
      fromTheRockKg: calcinationKg,
      totalCO2kg: totalKg,
      carbonBurnedKg: totalKg * 12 / 44,
    };
  },
  plot: { x: "petrolLitres", y: "totalCO2kg", xLabel: "Petrol burned in a year (litres)", yLabel: "CO2 released (kg)" },
  /*
   * The molecule stands for the whole year's gas, so it is drawn to volume:
   * width goes as the cube root of the mass, because a cloud eight times
   * heavier is only twice as wide. A full tank a week and a house's worth of
   * cement comes to about 13 tonnes of CO2 — around 7 000 cubic metres of gas
   * at room temperature, which is why the picture keeps growing long after the
   * intuition has stopped. It vibrates harder the faster the carbon is going
   * in.
   */
  drive: ({ f, t }) => ({
    scale: 0.3 + 0.9 * Math.cbrt(f.totalCO2kg / 12930),
    spin: 0.68 + t * (0.3 + f.totalCO2kg / 6000),
  }),
};

export const g6f3BurningAndBaking = buildSim(BURNING_AND_BAKING);

/* ---------------------------------------------------------------- *
 * F3.3 — Agriculture and land use
 * ---------------------------------------------------------------- */

const FOREST_TO_BURGER: ArchetypeSpec = {
  id: "g6f3-forest-to-burger",
  title: "One Hectare, Followed",
  tagline: "Track the carbon out of standing forest and see where it is a year later.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS3-4"] },
  learningGoals: [
    "Follow carbon from forest biomass into the atmosphere when land is cleared.",
    "Explain why cattle and rice release methane, and why methane is short-lived but strong.",
    "State that farming and land use account for roughly a fifth of global greenhouse emissions.",
  ],
  misconceptions: [
    "Only burning fossil fuels changes the atmosphere",
    "Replanting immediately undoes the carbon released by clearing",
    "Methane is a problem forever, like CO2",
  ],
  route: [
    {
      at: [0.10, 0.32], name: "Standing forest",
      note: "A hectare of Amazon forest holds roughly 90 tonnes of carbon in its wood alone, which is 330 tonnes of CO2 waiting. Soils and roots hold as much again.",
    },
    {
      at: [0.27, 0.60], name: "Cut and burned",
      note: "Clearing returns most of that within a year or two. Land-use change put about 4.1 gigatonnes of CO2 into the air in 2023, roughly a tenth of the human total.",
    },
    {
      at: [0.44, 0.30], name: "Pasture",
      note: "Grass regrows and takes carbon back up, but a pasture stores only about 5 tonnes of carbon a hectare above ground. Replanting recovers a fraction, and takes decades.",
    },
    {
      at: [0.60, 0.62], name: "Into the rumen",
      note: "Cattle cannot digest cellulose; microbes in the rumen do it for them, and those microbes make methane. A dairy cow burps about 110 kg of CH4 a year. Flooded rice paddies work the same way and add about 30 million tonnes a year.",
    },
    {
      at: [0.77, 0.30], name: "Methane in the air",
      note: "1,930 parts per billion today, up from 722 before 1750. Tonne for tonne it warms about 28 times more than CO2 over a century, and livestock accounts for roughly 2.1 gigatonnes of CO2-equivalent a year.",
    },
    {
      at: [0.92, 0.60], name: "Back to CO2",
      note: "Hydroxyl radicals break a methane molecule up after about 12 years and it finishes as CO2. Stop the methane and its warming fades within a lifetime. The CO2 it becomes does not.",
    },
  ],
  specimens: [
    { id: "forest", name: "One hectare of tropical forest", art: { art: "habitat", which: "forest" } },
  ],
  variables: [
    { key: "years", label: "Years since the hectare was cleared", min: 0, max: 60, step: 1, default: 0 },
    { key: "cattle", label: "Cattle grazing the hectare", min: 0, max: 4, step: 1, default: 1 },
  ],
  /*
   * Clearing is fast and regrowth is not, and that asymmetry is the whole
   * lesson. Above-ground carbon goes from about 90 tonnes a hectare to the
   * 5 tonnes a pasture holds in a season of burning; secondary forest then
   * climbs back along C = 5 + 85 * (1 - e^(-t/30)), which is the recovery
   * curve fitted across tropical regrowth plots — about 60 per cent of the
   * old-growth stock after 30 years and 90 per cent only after roughly 70.
   * Every tonne of carbon released is 44/12 = 3.67 tonnes of CO2, so the
   * hectare owes about 310 tonnes of CO2 the moment it is cleared.
   *
   * And the cattle standing on it: rumen microbes make methane from cellulose,
   * about 110 kg a head a year, and methane warms about 28 times as much as
   * CO2 over a century. One cow is therefore 3.1 tonnes of CO2-equivalent a
   * year, so four of them undo a decade of the regrowth above them.
   */
  measure: (v) => {
    const carbonTPerHa = 5 + 85 * (1 - Math.exp(-v.years / 30));
    return {
      aboveGroundCarbonTPerHa: carbonTPerHa,
      co2StillOwedT: (90 - carbonTPerHa) * (44 / 12),
      methaneKgPerYear: v.cattle * 110,
      cattleCO2ePerYearT: (v.cattle * 110 * 28) / 1000,
      percentOfOldGrowth: (carbonTPerHa / 90) * 100,
    };
  },
  /*
   * The hectare is drawn at the carbon standing on it. At year zero it is a
   * stripped, sunken clearing holding a twentieth of what it held; thirty
   * years of regrowth brings back about three fifths of the canopy, and it is
   * still not a forest at sixty. Run the slider back and forth and watch how
   * long the return trip takes compared with the going.
   */
  drive: ({ f }) => {
    const share = f.aboveGroundCarbonTPerHa / 90;
    return {
      scale: 0.36 + 0.62 * share,
      offset: [0, 0.34 * (1 - share)],
    };
  },
  stages: [
    { name: "Forest", at: 0, caption: "A tropical forest is a carbon store you can walk into: about 90 tonnes of carbon per hectare in wood." },
    { name: "Clearing", at: 0.2, caption: "Burning releases in weeks what took a century to build. This is a transfer between spheres, not a creation of carbon." },
    { name: "Pasture", at: 0.4, caption: "The new land holds a twentieth of the carbon. The difference is now in the air." },
    { name: "Livestock", at: 0.6, caption: "Rumen microbes and flooded paddies both make methane because they work without oxygen." },
    { name: "Fertiliser", at: 0.8, caption: "About one per cent of the nitrogen spread on fields leaves as nitrous oxide, which lasts 109 years and warms 273 times more than CO2 tonne for tonne." },
    { name: "The share", at: 1, caption: "Add clearing, livestock, rice and fertiliser and farming plus land use is roughly a fifth of all greenhouse emissions." },
  ],
};

export const g6f3ForestToBurger = buildSim(FOREST_TO_BURGER);

/* ---------------------------------------------------------------- *
 * F3.4 — Natural factors
 * ---------------------------------------------------------------- */

const SUN_OR_US: ArchetypeSpec = {
  id: "g6f3-sun-or-us",
  title: "The Sun, or Us?",
  tagline: "Both are pushing on the climate. Put the two pushes side by side and read the numbers.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Compare the size of natural and human forcings since 1750 in watts per square metre.",
    "Explain why volcanoes and El Nino move the temperature without changing the trend.",
  ],
  misconceptions: [
    "Recent warming is caused by the Sun getting brighter",
    "Volcanoes emit more CO2 than people do",
    "A hot El Nino year proves the trend, and a cool year disproves it",
  ],
  variables: [
    { key: "co2Ppm", label: "Carbon dioxide in the air (ppm)", min: 280, max: 560, step: 1, default: 424 },
  ],
  /*
   * Myhre's formula, which is the standard way the forcing from CO2 is
   * computed: F = 5.35 * ln(C / C0) watts per square metre, with C0 the 280
   * ppm of 1750. At today's 424 ppm that is 2.22 W/m2, and at a doubling to
   * 560 ppm it is 3.71 — the number the whole idea of climate sensitivity is
   * built on. Set against it, the Sun. Its 11-year cycle swings the forcing by
   * about 0.17 W/m2 and averages out; the change since 1750 is about 0.01,
   * which makes today's CO2 push some 220 times the Sun's, and the Sun has
   * been dimming slightly through the decades in which Earth warmed fastest.
   *
   * Divide the forcing by the Planck response of 3.76 W/m2 per degree and you
   * get the warming with no feedbacks at all: 0.59 degrees today. The observed
   * 1.1 is larger because water vapour and ice amplify it, which is a
   * different simulation.
   */
  measure: (v) => {
    const co2ForcingWm2 = 5.35 * Math.log(v.co2Ppm / 280);
    return {
      co2ForcingWm2,
      solarForcingWm2: 0.01,
      timesBiggerThanTheSun: co2ForcingWm2 / 0.01,
      warmingWithNoFeedbacksC: co2ForcingWm2 / 3.76,
    };
  },
  /*
   * Drag the CO2 from its 1750 value to a doubling and watch which side of the
   * comparison moves. The Sun keeps its size and brightness, breathing only
   * with its 11-year cycle, because that is what the measurements say it has
   * done. The molecule beside it grows from nothing at 280 ppm to the full
   * 3.71 W/m2 of a doubling. Two hundred times, drawn.
   */
  drive: ({ f, t, index }) => {
    if (index === 0) return { glow: 0.92 + 0.08 * Math.sin(t * 0.5), scale: 1 };
    return {
      scale: 0.28 + 0.82 * (f.co2ForcingWm2 / 3.71),
      spin: 0.68 + t * (0.3 + f.co2ForcingWm2 * 0.35),
    };
  },
  specimens: [
    {
      id: "sun",
      name: "The Sun since 1750: about +0.01 W/m2",
      because: "The 11-year cycle swings sunlight by roughly 1 W/m2 out of 1361, which is 0.17 W/m2 of forcing once spread over the globe. Averaged across cycles the change since 1750 is about a hundredth of a watt, and since 1980 the Sun has dimmed slightly while Earth warmed.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
    {
      id: "us",
      name: "Greenhouse gases since 1750: about +3.3 W/m2",
      because: "CO2 2.16, methane 0.54, nitrous oxide 0.21 and halocarbons 0.41 watts per square metre. Aerosols from the same chimneys reflect about 1.1 back, leaving a net human push near 2.7 W/m2, some 200 times the Sun's.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
};

export const g6f3SunOrUs = buildSim(SUN_OR_US);

/* ---------------------------------------------------------------- *
 * F3.5 — Comparing timescales
 * ---------------------------------------------------------------- */

const HOW_FAST_IS_FAST: ArchetypeSpec = {
  id: "g6f3-how-fast-is-fast",
  title: "How Fast Is Fast?",
  tagline: "Climate has changed before. Put the old rates next to the new one and the difference is the whole story.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS2-2"] },
  learningGoals: [
    "Compare the rate of past natural climate change with the rate of the present change.",
    "Explain why the speed of a change matters to living things as much as its size.",
  ],
  misconceptions: [
    "Because climate has changed naturally before, the present change must also be natural",
    "A few degrees is small, so it cannot matter",
  ],
  specimens: [
    { id: "earth", name: "Earth through time", art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" } },
  ],
  variables: [
    { key: "warmingPerCentury", label: "Warming rate (degrees per century)", min: 0.05, max: 3, step: 0.05, default: 2 },
  ],
  /*
   * Rate, not size, is the variable here. The last ice age ended at about 0.06
   * degrees a century; the present rate is 2. Divide one by the other and the
   * present change is 33 times faster than the fastest warming in the ice
   * cores, which is the number the last stages are built on.
   *
   * And what a rate costs a species: the temperature belts slide at a speed
   * proportional to it. Observations over 1960 to 2009, when the world warmed
   * 0.13 degrees a decade, give a global mean of 0.42 km a year, so the
   * constant is about 3.2 km a year for every degree per decade. Today's rate
   * moves them about 0.65 km a year, and a forest spreads a few hundred metres
   * a year at best.
   */
  measure: (v) => ({
    degreesPerCentury: v.warmingPerCentury,
    degreesPerDecade: v.warmingPerCentury / 10,
    beltsMoveKmPerYear: 3.2 * (v.warmingPerCentury / 10),
    timesTheIceAgeRate: v.warmingPerCentury / 0.06,
  }),
  /*
   * The planet is coloured by how fast it is being changed, not by how warm it
   * is: the blue of a world drifting at the ice cores' 0.06 degrees a century,
   * and the red of one moving at 2. It turns faster as the rate rises, because
   * speed is the whole point of this subtopic and speed is what a still
   * picture is worst at showing.
   */
  drive: ({ v, t }) => ({
    color: v.warmingPerCentury >= 1.5 ? "#b8452c"
      : v.warmingPerCentury >= 0.6 ? "#c9713f"
      : v.warmingPerCentury >= 0.2 ? "#8fa2b8"
      : "#2f6ea8",
    spin: 0.68 + t * (0.1 + v.warmingPerCentury * 0.5),
  }),
  stages: [
    {
      name: "800,000 years", at: 0,
      caption: "Ice cores show CO2 swinging between 180 and 300 ppm, over and over. At the end of each ice age it took about 5,000 years to climb 100 ppm: roughly 0.02 ppm a year.",
    },
    {
      name: "The last ice age ends", at: 0.2,
      caption: "Between 18,000 and 11,000 years ago the world warmed about 4 degrees. Spread across 7,000 years that is 0.06 degrees a century.",
    },
    {
      name: "The last 2,000 years", at: 0.4,
      caption: "Roman warmth, medieval warmth, the Little Ice Age: real, but a few tenths of a degree. No century in that reconstruction warms by more than about 0.2 degrees.",
    },
    {
      name: "1750 to now", at: 0.6,
      caption: "CO2 has gone from 280 to 424 ppm, 144 ppm in 275 years, and it is climbing 2.5 ppm a year today. That is more than 100 times the fastest natural rate in the ice cores.",
    },
    {
      name: "Since 1970", at: 0.8,
      caption: "Warming of about 0.2 degrees per decade, which is 2 degrees a century: roughly 35 times faster than the warming that ended the last ice age.",
    },
    {
      name: "Why speed matters", at: 1,
      caption: "Species tracked the old changes by moving. Temperature belts slid about 0.4 km a year over 1960 to 2009 and about 0.65 km a year at today's rate, much faster across flat land, while forests spread a few hundred metres a year at best.",
    },
  ],
};

export const g6f3HowFastIsFast = buildSim(HOW_FAST_IS_FAST);
