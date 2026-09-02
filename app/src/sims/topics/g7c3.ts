import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C3 — Cellular respiration.
 *
 * Five simulations, one per subtopic:
 *
 *   C3.1  g7c3-how-much-air        naming the inputs               (investigate)
 *   C3.2  g7c3-three-tests         naming the outputs              (sort)
 *   C3.3  g7c3-inside-a-mitochondrion  where in the cell           (explore)
 *   C3.4  g7c3-two-organelles      photosynthesis beside respiration (compare)
 *   C3.5  g7c3-a-leaf-all-day      respiration in plants too       (process)
 *
 * Respiration's equation is photosynthesis run the other way:
 *
 *     C6H12O6 + 6 O2  ->  6 CO2 + 6 H2O      dH = -2803 kJ per mole
 *
 * Per gram of glucose that is 1.066 g of oxygen used, 1.466 g of carbon
 * dioxide and 0.600 g of water made, and 15.56 kJ released. Those four
 * numbers are the arithmetic the whole topic rests on.
 */

/**
 * The two fluxes of one C3 leaf, in micromoles of CO2 per square metre per
 * second, which is the unit a gas-exchange meter actually reports.
 *
 * Gross photosynthesis is a rectangular hyperbola in light, 20 I / (I + 400),
 * with full sun at 2 000 micromoles of photons per square metre per second.
 * Dark respiration is 1.5 at 20 C and, being enzyme-controlled, doubles for
 * every 10 C rise. The two are equal at 32 micromoles of photons - 1.6 per
 * cent of full sun, roughly deep twilight - and that is the compensation
 * point C3.4 and C3.5 are both built around.
 */
function leafFluxes(lightPercent: number, temperatureC: number) {
  const photonFlux = (lightPercent / 100) * 2000;
  const gross = (20 * photonFlux) / (photonFlux + 400);
  const respiration = 1.5 * 2 ** ((temperatureC - 20) / 10);
  return { photonFlux, gross, respiration, net: gross - respiration };
}

/**
 * Hydrogencarbonate indicator, from carbon dioxide rich to carbon dioxide
 * poor: yellow, orange, the red of ordinary air, magenta, purple. These are
 * the colours in the bottle, and they are the whole readout of C3.5.
 */
const INDICATOR = ["#d8c33a", "#d9903a", "#d1553f", "#b0518f", "#8e5bc4"];

/* ---------------------------------------------------------------- *
 * C3.1 — Naming the inputs
 * ---------------------------------------------------------------- */

const HOW_MUCH_AIR: ArchetypeSpec = {
  id: "g7c3-how-much-air",
  title: "How Much Air Does It Take?",
  tagline: "Sit still, or run. Either way your cells are burning sugar with oxygen.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Name glucose and oxygen as the inputs to cellular respiration.",
    "Calculate the oxygen and sugar an activity demands from body mass and effort.",
  ],
  misconceptions: [
    "Breathing and respiration are the same thing",
    "You only respire when you exercise",
  ],
  specimens: [
    {
      id: "spirometer", name: "Expired air, collected over water",
      art: { art: "glassware", which: "beaker", level: 0.12, color: "#9fd0ea", bubbles: 6 },
    },
  ],
  variables: [
    { key: "mets", label: "Effort (METs: 1 sitting, 4 brisk walk, 10 running)", min: 1, max: 16, step: 0.5, default: 1 },
    { key: "massKg", label: "Body mass (kg)", min: 20, max: 120, step: 1, default: 60 },
  ],
  /**
   * All four constants here are ones a student can look up.
   *
   * One MET is defined as 3.5 cm3 of oxygen per kilogram per minute, which is
   * roughly what a person uses sitting quietly.
   *
   * Burning glucose releases 2803 kJ per mole and takes six moles of oxygen,
   * and a mole of gas is 22.414 dm3 at standard conditions, so a litre of
   * oxygen carries 2803 / (6 x 22.414) = 20.84 kJ.
   *
   * Glucose is 180.156 g per mole, so 2803 / 180.156 = 15.56 kJ per gram.
   *
   * Air going in is 20.95 per cent oxygen and air coming out about 16 per
   * cent, so each breath gives up close to 4.9 percentage points of its
   * oxygen. Dividing by that gives the volume of air actually breathed.
   *
   * The respiratory quotient of glucose is 6 CO2 out per 6 O2 in, exactly 1,
   * so the carbon dioxide volume matches the oxygen volume.
   */
  measure: (v) => {
    const oxygenMlPerMin = v.mets * 3.5 * v.massKg;
    const oxygenLPerHour = (oxygenMlPerMin * 60) / 1000;
    const energyKJPerHour = oxygenLPerHour * 20.84;
    return {
      oxygenMlPerMin,
      oxygenLPerHour,
      energyKJPerHour,
      glucoseGPerHour: energyKJPerHour / 15.559,
      airBreathedLPerMin: oxygenMlPerMin / 1000 / 0.049,
      carbonDioxideLPerHour: oxygenLPerHour,
      oxygenMlPerKgPerMin: v.mets * 3.5,
    };
  },
  plot: {
    x: "mets", y: "oxygenLPerHour",
    xLabel: "Effort (METs)", yLabel: "Oxygen used (litres per hour)",
  },
  /*
   * The collecting jar is the readout. Air breathed fills it in proportion to
   * the volume the model computes - 4.3 litres a minute sitting still, 69 at
   * 16 METs - so the jar answers the effort slider directly, and the bubble
   * stream is the oxygen actually taken out of that air.
   *
   * Above 42 cm3 of oxygen per kilogram per minute, which is 12 METs and a
   * fit adult's VO2 max, the demand is past what the lungs can supply. The
   * jar flushes red and stops: that is the failure state, and it is why a
   * person cannot simply keep raising the effort.
   */
  drive: ({ f }) => {
    const beyondMax = f.oxygenMlPerKgPerMin > 42;
    return {
      level: Math.min(0.9, 0.06 + f.airBreathedLPerMin / 90),
      bubbles: Math.max(1, Math.min(40, f.oxygenMlPerMin / 40)),
      color: beyondMax ? "#d1553f" : "#9fd0ea",
      rate: beyondMax ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * C3.2 — Naming the outputs
 * ---------------------------------------------------------------- */

const THREE_TESTS: ArchetypeSpec = {
  id: "g7c3-three-tests",
  title: "Three Tests on a Flask of Peas",
  tagline: "Germinating peas in a stoppered flask. Which of these does the flask actually produce?",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Name carbon dioxide, water and released energy as the outputs of respiration.",
    "Match each output to the test that detects it.",
  ],
  misconceptions: [
    "Respiration produces oxygen",
    "Only animals respire, plants photosynthesise instead",
    "Seeds are not alive until they sprout leaves",
  ],
  categories: [
    { id: "out", name: "Respiration releases it", hint: "the flask makes more of it than it started with" },
    { id: "no", name: "It does not", hint: "used up, unchanged, or never involved" },
  ],
  specimens: [
    {
      id: "co2", name: "Limewater goes milky", category: "out",
      because:
        "Carbon dioxide. It turns limewater cloudy by making calcium carbonate. Each gram of glucose respired makes 1.466 g of it.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#eef2f5", precipitate: 0.7 },
    },
    {
      id: "water", name: "Cobalt chloride paper turns pink", category: "out",
      because:
        "Water. Blue anhydrous cobalt chloride goes pink when it takes up water. Respiring a gram of glucose makes 0.600 g of it.",
      art: { art: "glassware", which: "testTube", level: 0.34, color: "#e39ab0" },
    },
    {
      id: "heat", name: "The vacuum flask warms up", category: "out",
      because:
        "Energy, largely as heat. Living peas run several degrees warmer than boiled dead ones in the same flask, which is the control that matters.",
      art: { art: "sphere", color: "#e2703a", radius: 0.5, glow: 1 },
    },
    {
      id: "oxygen", name: "Oxygen gas", category: "no",
      because:
        "Used up, not made. Six O2 are consumed per glucose, and the flask's oxygen falls until a splint will no longer relight.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "glucose", name: "Glucose solution", category: "no",
      because:
        "The fuel, not the product. Its store is spent: that is why a seed that never reaches light eventually dies.",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#d9a441" },
    },
    {
      id: "nitrogen", name: "Nitrogen gas", category: "no",
      because:
        "Along for the ride. Nitrogen is 78 per cent of the flask's air at the start and 78 per cent at the end; respiration never touches it.",
      art: { art: "molecule", formula: "N2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C3.3 — Where in the cell this happens
 * ---------------------------------------------------------------- */

const INSIDE_A_MITOCHONDRION: ArchetypeSpec = {
  id: "g7c3-inside-a-mitochondrion",
  title: "Inside a Mitochondrion",
  tagline: "A micrometre long, folded like a concertina, and running a turbine.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Locate cellular respiration in the mitochondria of cells.",
    "Relate the folded inner membrane to the amount of respiration a cell can do.",
  ],
  misconceptions: [
    "Respiration happens in the lungs",
    "Plant cells have chloroplasts instead of mitochondria",
  ],
  specimens: [
    {
      id: "mito", name: "Mitochondrion",
      art: { art: "organelle", which: "mitochondrion" },
      parts: [
        {
          id: "outer", name: "Outer membrane", at: [-0.72, -0.28],
          note: "Smooth, and freely leaky to small molecules.",
        },
        {
          id: "inner", name: "Inner membrane", at: [-0.14, -0.46],
          note: "Folded to about five times the outer membrane's area.",
        },
        {
          id: "cristae", name: "Cristae", at: [0.44, -0.3],
          note: "The folds themselves. More folds, more respiration.",
        },
        {
          id: "matrix", name: "Matrix", at: [0.04, 0.46],
          note: "Where carbon is stripped off the fuel as CO2.",
        },
        {
          id: "synthase", name: "ATP synthase", at: [0.68, 0.14],
          note: "A turbine turning about 130 times a second, 3 ATP a turn.",
        },
        {
          id: "mtdna", name: "Its own DNA", at: [-0.56, 0.34],
          note: "16 569 base pairs in humans, inherited from the mother.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C3.4 — Comparing photosynthesis and respiration side by side
 * ---------------------------------------------------------------- */

const TWO_ORGANELLES: ArchetypeSpec = {
  id: "g7c3-two-organelles",
  title: "Two Organelles, Opposite Jobs",
  tagline: "One stores energy in a sugar. The other spends it. Same atoms, opposite direction.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7"] },
  learningGoals: [
    "Compare the inputs, outputs and sites of photosynthesis and respiration.",
    "Explain that the two processes move the same energy in opposite directions.",
  ],
  misconceptions: [
    "Respiration is simply photosynthesis in reverse, step for step",
    "Plants photosynthesise by day and respire only by night",
  ],
  specimens: [
    {
      id: "chloroplast", name: "Chloroplast: CO2 + H2O to sugar",
      because: "Takes in 2803 kJ per mole. Plant cells only, and only in the light.",
      art: { art: "organelle", which: "chloroplast" },
    },
    {
      id: "mitochondrion", name: "Mitochondrion: sugar to CO2 + H2O",
      because: "Gives out 2803 kJ per mole. Plants and animals, day and night.",
      art: { art: "organelle", which: "mitochondrion" },
    },
  ],
  variables: [
    { key: "lightPercent", label: "Light on the leaf, as a share of full sun (%)", min: 0, max: 100, step: 1, default: 30 },
    { key: "temperatureC", label: "Leaf temperature (C)", min: 5, max: 40, step: 1, default: 20 },
  ],
  /*
   * Both organelles are in the same leaf cell, so one pair of controls sets
   * what each of them is doing. The chloroplast's traffic is gross
   * photosynthesis and the mitochondrion's is respiration, both in
   * micromoles of CO2 per square metre per second (see `leafFluxes`).
   *
   * In full sun at 20 C that is 16.7 against 1.5, so the chloroplast handles
   * about eleven times the traffic. In the dark it handles none at all and
   * the mitochondrion carries on unchanged - which is the whole answer to
   * "plants photosynthesise by day and respire only by night".
   */
  measure: (v) => {
    const { photonFlux, gross, respiration, net } = leafFluxes(v.lightPercent, v.temperatureC);
    return {
      photonFlux,
      chloroplastFluxUmol: gross,
      mitochondrionFluxUmol: respiration,
      netUptakeUmol: net,
      timesRespiration: gross / respiration,
      compensationPercentOfFullSun: (100 * ((400 * respiration) / (20 - respiration))) / 2000,
    };
  },
  /*
   * Each organelle is drawn at the cube root of the carbon traffic it is
   * handling, against the same 1.5 micromole reference, so equal sizes mean
   * equal traffic - and equal traffic is exactly what the compensation point
   * is. Cube root because the eye reads these as solids: eleven times the
   * traffic is 2.2 times the width, not eleven times.
   *
   * Drag the light to zero and the chloroplast collapses to a speck and stops
   * turning, while the mitochondrion beside it does not change at all. Warm
   * the leaf instead and only the mitochondrion grows, doubling every 10 C.
   */
  drive: ({ f, index }) => {
    if (index === 1) {
      return { scale: Math.min(1.7, Math.cbrt(f.mitochondrionFluxUmol / 1.5)) };
    }
    const dark = f.chloroplastFluxUmol < 0.2;
    return {
      scale: Math.min(1.7, Math.cbrt(Math.max(0.015, f.chloroplastFluxUmol / 1.5))),
      rate: dark ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * C3.5 — Respiration in plants and animals alike
 * ---------------------------------------------------------------- */

const A_LEAF_ALL_DAY: ArchetypeSpec = {
  id: "g7c3-a-leaf-all-day",
  title: "A Leaf, All Day and All Night",
  tagline: "Follow one leaf round the clock. Its mitochondria never stop.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Explain that plants respire continuously, as animals do.",
    "Describe the light compensation point, where photosynthesis and respiration balance.",
  ],
  misconceptions: [
    "Plants respire only at night",
    "A plant in a bedroom takes away your oxygen",
  ],
  specimens: [
    {
      id: "indicator", name: "Leaf discs in hydrogencarbonate indicator",
      art: { art: "glassware", which: "testTube", level: 0.74, color: "#d1553f" },
    },
  ],
  variables: [
    { key: "lightPercent", label: "Light on the tube, as a share of full sun (%)", min: 0, max: 100, step: 1, default: 40 },
    { key: "temperatureC", label: "Water temperature (C)", min: 5, max: 40, step: 1, default: 20 },
  ],
  /*
   * The tube is the standard classroom version of this: leaf discs sealed in
   * hydrogencarbonate indicator, which is red in equilibrium with ordinary
   * air. Take carbon dioxide out of the water and it goes magenta, then
   * purple; put carbon dioxide in and it goes orange, then yellow. So the
   * colour of the tube is the sign of the leaf's net exchange, measured the
   * way a school actually measures it.
   */
  measure: (v) => {
    const { photonFlux, gross, respiration, net } = leafFluxes(v.lightPercent, v.temperatureC);
    return {
      photonFlux,
      grossPhotosynthesisUmol: gross,
      respirationUmol: respiration,
      netUptakeUmol: net,
      sugarGPerM2PerHour: (net * 3600 * 1e-6 * 180.156) / 6,
    };
  },
  /*
   * Turn the light down and the tube goes yellow: the discs are still
   * respiring, so carbon dioxide builds up, and the oxygen stream stops. Turn
   * it up and the same discs strip the water of carbon dioxide and the tube
   * goes purple, with a bubble stream of the oxygen the model says they are
   * releasing. The colour crosses red - no net exchange either way - at the
   * compensation point, 1.6 per cent of full sun at 20 C.
   */
  drive: ({ f }) => {
    const net = f.netUptakeUmol;
    const step = net <= -1 ? 0 : net <= -0.1 ? 1 : net < 0.1 ? 2 : net < 4 ? 3 : 4;
    return {
      color: INDICATOR[step],
      bubbles: net > 0.5 ? Math.min(36, net * 2.2) : 0,
    };
  },
  /**
   * The numbers in these captions come from one standard C3 leaf model:
   * gross photosynthesis 20 x I / (I + 400) micromoles of CO2 per square metre
   * per second, dark respiration 1.5 in the same units, full sun 2000
   * micromoles of photons per square metre per second. Those give a light
   * compensation point at 32 micromoles of photons, and a midday net uptake
   * of 20 x 2000/2400 - 1.5 = 15.2.
   */
  stages: [
    {
      name: "Midnight", at: 0,
      caption: "No light. Photosynthesis 0, respiration 1.5. The leaf gives out carbon dioxide.",
    },
    {
      name: "First light", at: 0.25,
      caption: "At 32 micromoles of photons the two exactly cancel: the compensation point.",
    },
    {
      name: "Mid-morning", at: 0.5,
      caption: "600 micromoles of photons. Photosynthesis 12.0, respiration 1.5, net uptake 10.5.",
    },
    {
      name: "Midday", at: 0.75,
      caption: "Full sun, 2000 micromoles. Net uptake 15.2 - about ten times its own respiration.",
    },
    {
      name: "Night again", at: 1,
      caption: "Back to a net loss of 1.5, but the day banked 9 g of sugar per square metre.",
    },
  ],
};

export const g7c3HowMuchAir = buildSim(HOW_MUCH_AIR);
export const g7c3ThreeTests = buildSim(THREE_TESTS);
export const g7c3InsideAMitochondrion = buildSim(INSIDE_A_MITOCHONDRION);
export const g7c3TwoOrganelles = buildSim(TWO_ORGANELLES);
export const g7c3ALeafAllDay = buildSim(A_LEAF_ALL_DAY);
