import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit C · Topic C4 — Matter, mass and temperature change.
 *
 * Six simulations, one per subtopic:
 *
 *   C4.1  g6c4-which-material    effect of material type      (investigate)
 *   C4.2  g6c4-how-much-matter   effect of mass               (investigate)
 *   C4.3  g6c4-fair-test-rig     planning a fair test         (assemble)
 *   C4.4  g6c4-minute-by-minute  collecting temperature data  (process)
 *   C4.5  g6c4-two-data-sets     analysing and interpreting   (compare)
 *   C4.6  g6c4-does-it-follow    constructing an explanation  (sort)
 *
 * Every number in this file comes from q = m c dT with the measured specific
 * heat capacities in J per kilogram per kelvin: water 4 186, sand about 830,
 * aluminium 900, iron 449. The heating run in C4.4 and the two data sets in
 * C4.5 are the same 50 W heater in 250 g of water, so a student can check one
 * simulation against another and find them consistent.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second, so this is the rail's
 * own position and the beaker heats in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/**
 * The colour of water at a temperature, from cold tap to rolling boil.
 *
 * Water does not really change colour when you heat it, but a student cannot
 * see a number written on a beaker, and this is the one quantity every
 * simulation in the topic is about. The same ramp is used everywhere here, so
 * the same temperature always looks the same.
 */
const waterColor = (c: number) =>
  c >= 100 ? "#f2f4f8" : c > 75 ? "#d88a5a" : c > 45 ? "#c2a072" : c > 30 ? "#8fa8c4" : "#5f92c4";

/* C4.1 — Effect of material type on temperature change. */
const WHICH_MATERIAL: ArchetypeSpec = {
  id: "g6c4-which-material",
  title: "Same Energy, Different Materials",
  tagline: "Put identical joules into half a kilogram of four materials and watch them disagree.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Explain that equal masses of different materials need different energies for the same temperature rise.",
    "Use specific heat capacity to compare materials.",
  ],
  misconceptions: ["Equal energy always produces an equal temperature rise"],
  specimens: [{ id: "sample", name: "0.5 kg sample", art: { art: "glassware", which: "beaker", level: 0.55 } }],
  variables: [
    { key: "energyJ", label: "Energy added (J)", min: 0, max: 50000, step: 500, default: 20000 },
  ],
  // dT = q / (m c) for a fixed 0.5 kg of each material. Water resists heating
  // roughly nine times better than iron, which is why the sea warms so slowly.
  measure: (v) => {
    const rise = (c: number) => v.energyJ / (0.5 * c);
    return {
      waterRiseC: rise(4186),
      sandRiseC: rise(830),
      aluminiumRiseC: rise(900),
      ironRiseC: rise(449),
    };
  },
  plot: { x: "energyJ", y: "waterRiseC", xLabel: "Energy added (J)", yLabel: "Temperature rise of water (degrees C)" },
  /*
   * The sample on the bench is the half-kilogram of water, drawn at the
   * temperature the energy has actually put it at: 20 degrees at the bottom of
   * the range and 43.9 at 50 000 J. Convection starts as soon as there is a
   * temperature difference to drive it, so the stirring grows with the rise.
   * The glow is the iron sample's temperature over the same energy — it reaches
   * 242 degrees on the same 50 000 J, and that gap is the whole subtopic.
   */
  drive: ({ f }) => ({
    level: 0.55,
    color: waterColor(20 + f.waterRiseC),
    bubbles: Math.min(0.8, f.waterRiseC / 40),
    glow: Math.min(1, f.ironRiseC / 240),
    rate: 0.2 + f.waterRiseC / 8,
  }),
};

/* C4.2 — Effect of mass on temperature change. */
const HOW_MUCH_MATTER: ArchetypeSpec = {
  id: "g6c4-how-much-matter",
  title: "How Much Water Is in the Pan?",
  tagline: "The same heater, the same time, and more water to share it between.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Predict how doubling the mass changes the temperature rise.",
    "Rearrange q = m c dT to find a temperature change.",
  ],
  misconceptions: ["A larger mass heats up faster because there is more of it"],
  specimens: [{ id: "pan", name: "Water in a pan", art: { art: "glassware", which: "beaker", level: 0.7 } }],
  variables: [
    { key: "massKg", label: "Mass of water (kg)", min: 0.1, max: 2, step: 0.05, default: 0.5 },
    { key: "energyJ", label: "Energy added (J)", min: 5000, max: 60000, step: 1000, default: 20000 },
  ],
  // dT = q / (m c) with c = 4 186 J/kg K for water, starting from 20 degrees.
  measure: (v) => {
    const rise = v.energyJ / (v.massKg * 4186);
    return {
      riseC: rise,
      finalTempC: 20 + rise,
      energyPerDegreeJ: v.massKg * 4186,
    };
  },
  plot: { x: "massKg", y: "riseC", xLabel: "Mass of water (kg)", yLabel: "Temperature rise (degrees C)" },
  /*
   * The pan holds the water you asked for: the fill is the mass, straight off
   * the first control, so two kilograms is a full pan and a hundred grams is a
   * puddle in the bottom. The colour is the temperature that mass reaches, and
   * the failure state is real — 0.1 kg given 60 000 J needs a rise of 143
   * degrees, which water cannot do. It boils instead, the level drops as it
   * goes off as steam, and the pan is on its way to boiling dry.
   */
  drive: ({ v, f }) => {
    const boiling = f.finalTempC >= 100;
    const fill = 0.06 + (v.massKg / 2) * 0.82;
    return {
      level: boiling ? fill * 0.55 : fill,
      color: waterColor(f.finalTempC),
      bubbles: boiling ? 1 : Math.min(0.7, f.riseC / 60),
      glow: boiling ? 0.9 : 0,
      rate: boiling ? 3.4 : 0.2 + f.riseC / 30,
    };
  },
};

/* C4.3 — Planning a fair test investigation. */
const FAIR_TEST_RIG: ArchetypeSpec = {
  id: "g6c4-fair-test-rig",
  title: "Build the Fair Test",
  tagline: "Assemble a rig that lets only the material change.",
  kind: "assemble",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Choose equipment that holds every variable steady except the one being tested.",
    "Justify each control in terms of the quantity it fixes.",
  ],
  misconceptions: ["A fair test only means using the same equipment"],
  specimens: [
    {
      id: "rig", name: "Heating rig", art: { art: "glassware", which: "beaker", level: 0.5 },
      parts: [
        { id: "balance", name: "Balance", at: [0, 0.42],
          note: "Weigh out exactly 0.5 kg of each material. Compare 0.5 kg of water with 0.4 kg of sand and the mass difference hides the material difference." },
        { id: "heater", name: "One 50 W heater", at: [-0.32, 0.22],
          note: "The same heater in both samples, run for the same time, delivers the same joules: 50 W for 300 s is 15 000 J." },
        { id: "timer", name: "Timer", at: [0.34, 0.2],
          note: "Energy is power multiplied by time, so an untimed run has an unknown input and no result worth writing down." },
        { id: "thermometer", name: "A thermometer in each", at: [0.28, -0.24],
          note: "One thermometer moved between samples loses time and carries energy with it. Two identical thermometers, both fully immersed." },
        { id: "start", name: "Same starting temperature", at: [-0.3, -0.26],
          note: "Both samples start at room temperature. A warm start loses energy faster to the room and quietly shifts the result." },
        { id: "lid", name: "Matching lids and insulation", at: [0.02, -0.44],
          note: "Not to stop losses, which cannot be stopped, but to make them the same for both, so what is left is the material." },
      ],
    },
  ],
  /*
   * The rig is not a diagram, it is a run: the 50 W heater goes on, the sample
   * climbs 5.7 degrees every two minutes, and at ten minutes it is switched off
   * and the next sample goes in. Watching the same run happen twice is what
   * makes "same heater, same time, same mass" mean anything.
   */
  drive: ({ t }) => {
    const u = (t % 24) / 24;
    return {
      level: 0.5,
      color: waterColor(20 + u * 29),
      bubbles: u * 0.6,
      rate: 0.2 + u * 2,
    };
  },
};

/* C4.4 — Collecting and organizing temperature-time data. */
const MINUTE_BY_MINUTE: ArchetypeSpec = {
  id: "g6c4-minute-by-minute",
  title: "Minute by Minute",
  tagline: "Run the heater and build the table one reading at a time.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"], ccssMath: ["6.SP.B.4"] },
  learningGoals: [
    "Record temperature against time in an organised table.",
    "Use a predicted value to spot a reading that does not fit.",
  ],
  misconceptions: ["Data should be tidied up to fit the expected pattern"],
  specimens: [{ id: "beaker", name: "250 g of water, 50 W heater", art: { art: "glassware", which: "beaker", level: 0.6, bubbles: 1 } }],
  stages: [
    { name: "0 min", at: 0,
      caption: "Start at 20.0 degrees. Write the units in the column heading once, not beside every number." },
    { name: "2 min", at: 0.2,
      caption: "25.7 degrees. 50 W for 120 s is 6 000 J, and 6 000 J warms 250 g of water by 5.7 degrees." },
    { name: "4 min", at: 0.4,
      caption: "31.5 degrees. The same rise again: a steady heater gives a straight line." },
    { name: "6 min", at: 0.6,
      caption: "37.2 degrees. Read at eye level and record what you see, even when it disappoints you." },
    { name: "8 min", at: 0.8,
      caption: "42.9 degrees. A reading of 46 here would be an anomaly worth repeating, not worth erasing." },
    { name: "10 min", at: 1,
      caption: "48.7 degrees. Ten minutes, 30 000 J, a rise of 28.7 degrees. Now the table is ready to plot." },
  ],
  /*
   * The beaker heats while the table is filled in. A steady 50 W into 250 g of
   * water is 2.87 degrees a minute, dead straight, so the colour walks evenly
   * from 20 degrees to 48.7 and the convection stirring grows with it. Nothing
   * boils here and nothing should: 48.7 degrees is hand-hot, and the straight
   * line is the reading worth having.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const tempC = 20 + 28.7 * u;
    return {
      level: 0.6,
      color: waterColor(tempC),
      bubbles: u * 0.55,
      glow: u * 0.4,
      rate: 0.2 + u * 2.2,
    };
  },
};

/* C4.5 — Analyzing and interpreting data. */
const TWO_DATA_SETS: ArchetypeSpec = {
  id: "g6c4-two-data-sets",
  title: "Two Data Sets, One Difference",
  tagline: "Same water, same heater, same ten minutes. Five degrees apart.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"], ccssMath: ["6.SP.B.5"] },
  learningGoals: [
    "Compare two data sets and identify the variable that explains the difference.",
    "Account for energy that leaves an experiment as steam.",
  ],
  misconceptions: ["A result below the prediction means the experiment was done wrong"],
  variables: [
    { key: "minutes", label: "Time the heater has run (minutes)", min: 0, max: 20, step: 0.5, default: 10 },
    { key: "heaterW", label: "Heater power (W)", min: 20, max: 80, step: 5, default: 50 },
  ],
  /*
   * q = m c dT for 250 g of water, c = 4 186 J/kg K, so 50 W for 600 s is
   * 30 000 J and a rise of 28.7 degrees: the covered beaker reaches 48.7, the
   * predicted value. The open one loses about 0.23 g a minute to evaporation
   * and the latent heat of vaporisation is 2 260 J per gram, so 10 minutes
   * costs it 5 200 J, worth 5.0 degrees, and it arrives at 43.7. Neither can
   * pass 100 degrees: beyond that the energy goes into boiling the water away
   * rather than into raising its temperature.
   */
  measure: (v) => {
    const capacity = 0.25 * 4186;
    const supplied = v.heaterW * 60 * v.minutes;
    const evaporatedG = 0.23 * v.minutes;
    const openLoss = evaporatedG * 2260;
    const cap = (j: number) => Math.min(100, 20 + j / capacity);
    return {
      coveredTempC: cap(supplied),
      openTempC: cap(supplied - openLoss),
      gapC: cap(supplied) - cap(supplied - openLoss),
      energyLostAsSteamJ: openLoss,
      waterEvaporatedG: evaporatedG,
      energySuppliedJ: supplied,
    };
  },
  specimens: [
    { id: "covered", name: "Covered beaker: 48.7 degrees at 10 min",
      because: "Exactly the prediction. The lid keeps the vapour in, so all 30 000 J stayed in the water.",
      art: { art: "glassware", which: "flask", level: 0.6 } },
    { id: "open", name: "Open beaker: 43.7 degrees at 10 min",
      because: "About 2.3 g of water evaporated, and each gram carries away 2 260 J. That is 5 200 J, worth 5.0 degrees: the missing energy left as steam.",
      art: { art: "glassware", which: "beaker", level: 0.6, bubbles: 4 } },
  ],
  /*
   * Two beakers, side by side, at the temperatures the arithmetic gives them.
   * The open one is always the cooler and always the steamier, and the steam is
   * where its missing degrees went — it is not a botched experiment, it is an
   * unclosed one. Push the heater far enough and the open beaker hits 100
   * first, at which point its level starts dropping and its temperature stops
   * moving however much longer you run it.
   */
  drive: ({ f, index }) => {
    const tempC = index === 0 ? f.coveredTempC : f.openTempC;
    const boiling = tempC >= 99.9;
    const steam = index === 0 ? 0.12 : 0.35 + Math.min(0.5, f.waterEvaporatedG / 8);
    return {
      level: index === 0 ? 0.6 : 0.6 - Math.min(0.22, f.waterEvaporatedG / 20),
      color: waterColor(tempC),
      bubbles: boiling ? 1 : steam,
      glow: Math.max(0, (tempC - 40) / 60),
      rate: 0.2 + (tempC - 20) / 20,
    };
  },
};

/* C4.6 — Constructing an explanation from evidence. */
const DOES_IT_FOLLOW: ArchetypeSpec = {
  id: "g6c4-does-it-follow",
  title: "Does the Evidence Support It?",
  tagline: "0.5 kg of water rose 7.2 degrees; 0.5 kg of sand rose 36.1. Now judge six claims.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Judge whether a statement is supported by the data collected.",
    "Reject explanations that rely on variables the test controlled.",
  ],
  misconceptions: ["Any sensible-sounding statement counts as an explanation"],
  categories: [
    { id: "supported", name: "Supported", hint: "the data show this" },
    { id: "not", name: "Not supported", hint: "the data cannot show this" },
  ],
  specimens: [
    { id: "capacity", name: "Sand needs less energy than water to warm by one degree", category: "supported",
      because: "Same 15 000 J, five times the rise. It takes about 830 J to warm 1 kg of sand by one degree and 4 186 J for water.",
      art: { art: "sphere", color: "#cbb894", radius: 0.44 } },
    { id: "metal", name: "The sand got hotter because sand is a metal", category: "not",
      because: "Sand is mostly silicon dioxide, not a metal, and nothing in the test compared metals. The cause is specific heat capacity.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "double", name: "With 1 kg of each, the same run would give half the rise", category: "supported",
      because: "Rise is energy divided by mass times capacity, so doubling mass halves the rise: water 3.6 degrees, sand 18.1.",
      art: { art: "apparatus", which: "stand" } },
    { id: "bottle", name: "Water would keep a hot water bottle warm longer than sand", category: "supported",
      because: "The same capacities work in reverse. Each kilogram of water gives back 4 186 J for every degree it cools, five times what sand can offer.",
      art: { art: "glassware", which: "flask", level: 0.7 } },
    { id: "closer", name: "The sand got hotter because it was closer to the heater", category: "not",
      because: "One heater was immersed in each sample for the same time. The test never varied the distance, so the data say nothing about it.",
      art: { art: "apparatus", which: "burner" } },
    { id: "heavier", name: "The water heated more slowly because it was heavier", category: "not",
      because: "Both samples were 0.5 kg. Mass was controlled, so it cannot be the explanation for the difference.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
  ],
};

export const g6c4WhichMaterial = buildSim(WHICH_MATERIAL);
export const g6c4HowMuchMatter = buildSim(HOW_MUCH_MATTER);
export const g6c4FairTestRig = buildSim(FAIR_TEST_RIG);
export const g6c4MinuteByMinute = buildSim(MINUTE_BY_MINUTE);
export const g6c4TwoDataSets = buildSim(TWO_DATA_SETS);
export const g6c4DoesItFollow = buildSim(DOES_IT_FOLLOW);
