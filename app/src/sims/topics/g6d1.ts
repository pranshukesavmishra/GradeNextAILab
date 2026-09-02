import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D1 — Earth's water and the water cycle.
 *
 * Six simulations, one per subtopic:
 *
 *   D1.1  g6d1-where-the-water-is      Earth's water reservoirs      (sort)
 *   D1.2  g6d1-into-the-air-and-back   evaporation and condensation  (investigate)
 *   D1.3  g6d1-meadow-or-car-park      precipitation and runoff      (compare)
 *   D1.4  g6d1-through-the-tree        transpiration                 (trace)
 *   D1.5  g6d1-sun-lifts-gravity-drops the two drivers               (investigate)
 *   D1.6  g6d1-how-long-it-stays       residence time                (process)
 *
 * One set of global figures runs through the whole topic, so the numbers agree
 * from one simulation to the next: 1 386 million cubic kilometres of water in
 * all, 505 000 km3 of it evaporating and falling again every year, and 12 900
 * km3 held in the atmosphere at any moment. Dividing the third by the second
 * is where the nine-day residence time in D1.6 comes from.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second, so this is the rail's
 * own position and the water moves in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/**
 * How big each of Earth's reservoirs is, in cubic kilometres.
 *
 * The published figures, and the only numbers D1.1 needs: everything else in
 * that simulation is a ratio of two of these.
 */
const RESERVOIR_KM3: Record<string, number> = {
  ocean: 1.338e9, icecaps: 2.4064e7, groundwater: 1.053e7,
  salinelakes: 8.54e4, freshlakes: 9.1e4, rivers: 2.12e3,
};

/* D1.1 — Earth's water reservoirs. */
const WHERE_THE_WATER_IS: ArchetypeSpec = {
  id: "g6d1-where-the-water-is",
  title: "Where the Water Actually Is",
  tagline: "Earth holds 1 386 million cubic kilometres of water. Almost none of it is drinkable.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-4"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Rank Earth's water reservoirs by the volume each one holds.",
    "Explain why less than one per cent of Earth's water is fresh, liquid and reachable.",
  ],
  misconceptions: [
    "Most of Earth's fresh water is in rivers and lakes",
    "Water is evenly shared between the ocean, the ice and the ground",
  ],
  categories: [
    { id: "salt", name: "Salt water", hint: "too salty to drink or to water a field" },
    { id: "frozen", name: "Fresh, but frozen", hint: "fresh water locked up as ice" },
    { id: "liquid", name: "Fresh and liquid", hint: "fresh water you could actually pump or drink" },
  ],
  specimens: [
    { id: "ocean", name: "The ocean", category: "salt",
      because: "1 338 000 000 km3, which is 96.5 per cent of all the water there is. About 35 g of salt in every kilogram.",
      art: { art: "sphere", color: "#1f6fb2", radius: 0.52 } },
    { id: "icecaps", name: "Ice caps, glaciers and permanent snow", category: "frozen",
      because: "24 064 000 km3, or 1.74 per cent of all water. That is 68 per cent of every drop of fresh water on Earth, and it is frozen solid.",
      art: { art: "sphere", color: "#dfeaf4", radius: 0.44 } },
    { id: "groundwater", name: "Fresh groundwater", category: "liquid",
      because: "10 530 000 km3 in the pores and cracks of rock, 0.76 per cent of all water. Nearly all the fresh liquid water on the planet is underground, not on the surface.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#4a90c2" } },
    { id: "salinelakes", name: "Salty lakes, such as Mono Lake", category: "salt",
      because: "85 400 km3. Mono Lake is nearly three times saltier than the ocean, because water leaves it only by evaporating and the salt stays behind.",
      art: { art: "glassware", which: "beaker", level: 0.35, color: "#7fa8a0", precipitate: 0.35 } },
    { id: "freshlakes", name: "Freshwater lakes", category: "liquid",
      because: "91 000 km3, about 0.0066 per cent of all water. Every lake on Earth together holds one ten-thousandth of what the ocean holds.",
      art: { art: "glassware", which: "flask", level: 0.55, color: "#3f8fc0" } },
    { id: "rivers", name: "All the rivers at once", category: "liquid",
      because: "2 120 km3. Freeze every river on Earth and it would be a cube 12.8 km on a side: 0.0002 per cent of Earth's water, and most of what we drink from.",
      art: { art: "glassware", which: "testTube", level: 0.3, color: "#4fa3d1" } },
  ],
  /*
   * Every specimen is drawn at the size of what it actually holds. Volume goes
   * as the cube of the width, so the ocean at 1.338 billion cubic kilometres is
   * not six hundred thousand times as wide as the rivers but 85 times — and
   * even that will not fit on a bench, so the small stores are held at a floor
   * of 0.22 rather than shrinking to nothing. The ice does not move, because
   * it is the one store where the water is not going anywhere; the salt lake
   * grows its crust of salt, because evaporation is the only way out of it.
   */
  drive: ({ specimen, t }) => {
    const km3 = RESERVOIR_KM3[specimen.id] ?? 1e5;
    const scale = Math.max(0.22, Math.cbrt(km3 / 2.5e8));
    if (specimen.id === "icecaps") return { scale, rate: 0 };
    if (specimen.id === "salinelakes") {
      return { scale, level: 0.35, precipitate: 0.25 + 0.35 * railPhase(t), rate: 0.3 };
    }
    if (specimen.id === "ocean") return { scale, rate: 0.5 };
    return { scale, rate: 0.8 };
  },
};

/* D1.2 — Evaporation and condensation. */
const INTO_THE_AIR_AND_BACK: ArchetypeSpec = {
  id: "g6d1-into-the-air-and-back",
  title: "Into the Air, and Back Again",
  tagline: "Warm air can hold far more water than cold air. Cool it enough and the water has to come out.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-4", "MS-PS1-4"] },
  learningGoals: [
    "Predict how much water vapour air can hold from its temperature.",
    "Find the dew point and explain that condensation begins there, not at any fixed temperature.",
  ],
  misconceptions: [
    "Air holds water like a sponge and warm air has bigger holes",
    "Clouds form because air runs out of room for water",
  ],
  specimens: [{ id: "parcel", name: "A sealed flask of moist air over water", art: { art: "glassware", which: "flask", level: 0.2, color: "#4a90c2" } }],
  variables: [
    { key: "airTempC", label: "Air temperature (degrees C)", min: -10, max: 40, step: 1, default: 20 },
    { key: "humidityPct", label: "Relative humidity (per cent)", min: 5, max: 100, step: 1, default: 50 },
    { key: "roomVolumeM3", label: "Volume of the room (m3)", min: 10, max: 300, step: 5, default: 60 },
  ],
  // The Magnus-Tetens equation, which is the saturation curve every weather
  // service uses: es = 0.6108 exp(17.27 T / (T + 237.3)) kPa. It gives 2.34 kPa
  // at 20 degrees, the value in the back of the textbook. Inverting it for the
  // actual vapour pressure gives the dew point. Water vapour in the air then
  // follows the gas law with the specific gas constant of water, 461.5 J/kg K,
  // and the latent heat of vaporisation is 2501 - 2.361 T kJ/kg.
  measure: (v) => {
    const es = 0.6108 * Math.exp((17.27 * v.airTempC) / (v.airTempC + 237.3));
    const ea = (es * v.humidityPct) / 100;
    const alpha = Math.log(Math.max(ea, 1e-6) / 0.6108);
    const gramsPerM3 = (ea * 1000) / (461.5 * (v.airTempC + 273.15)) * 1000;
    return {
      saturationPressureKPa: es,
      actualPressureKPa: ea,
      dewPointC: (237.3 * alpha) / (17.27 - alpha),
      waterInAirGPerM3: gramsPerM3,
      waterInTheRoomG: gramsPerM3 * v.roomVolumeM3,
      energyToEvaporateOneKgKJ: 2501 - 2.361 * v.airTempC,
    };
  },
  plot: {
    x: "airTempC", y: "saturationPressureKPa",
    xLabel: "Air temperature (degrees C)", yLabel: "Vapour pressure at saturation (kPa)",
  },
  /*
   * The flask is the sky in a jar. What the air is carrying — 1.2 grams in a
   * cubic metre at -10 degrees and half humidity, 25.5 grams at 40 — sets how
   * high the water stands in it, and the gap between the actual and the
   * saturation vapour pressure sets how hard it is evaporating: dry warm air
   * boils the surface, cold damp air barely touches it. Past about 92 per cent
   * humidity that gap has closed and the run crosses its threshold — mist
   * appears in the flask, because the air can hold no more and the water has
   * to come back out. That is condensation, and it is what a cloud is.
   */
  drive: ({ v, f }) => {
    const dryingPower = f.saturationPressureKPa - f.actualPressureKPa;
    return {
      level: 0.08 + Math.min(0.55, f.waterInAirGPerM3 / 46),
      bubbles: Math.min(1, dryingPower * 0.6),
      precipitate: Math.max(0, (v.humidityPct - 88) / 12),
      color: v.airTempC > 25 ? "#5fa8c8" : v.airTempC < 2 ? "#8fb6d8" : "#4a90c2",
      rate: 0.15 + Math.min(3, dryingPower),
    };
  },
};

/* D1.3 — Precipitation, runoff and infiltration. */
const MEADOW_OR_CAR_PARK: ArchetypeSpec = {
  id: "g6d1-meadow-or-car-park",
  title: "Meadow or Car Park?",
  tagline: "The same storm falls on both. Where the water goes next is not the same at all.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-4", "MS-ESS3-3"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Split a rainfall total into the part that runs off and the part that infiltrates.",
    "Explain why paving a surface raises flood risk and lowers groundwater recharge.",
  ],
  misconceptions: [
    "Rain that falls on soil simply disappears",
    "Flooding is caused only by how much rain falls, not by what it falls on",
  ],
  specimens: [
    { id: "meadow", name: "Meadow on loam soil",
      because: "Runoff coefficient 0.20. Water soaks in at 10 to 20 mm an hour, so most of the storm goes underground.",
      art: { art: "glassware", which: "beaker", level: 0.2, color: "#4f9a5e" } },
    { id: "carpark", name: "Asphalt car park",
      because: "Runoff coefficient 0.90. Nothing infiltrates through asphalt, so nearly the whole storm arrives at the drain at once.",
      art: { art: "glassware", which: "beaker", level: 0.9, color: "#5a6472" } },
  ],
  variables: [
    { key: "rainDepthMm", label: "Rain in the storm (mm)", min: 2, max: 100, step: 1, default: 25 },
    { key: "areaM2", label: "Area of the plot (m2)", min: 100, max: 5000, step: 100, default: 1000 },
  ],
  // The rational method, which is how a real drainage engineer sizes a pipe.
  // One millimetre of rain on one square metre is exactly one litre, so the
  // storm total in litres is simply depth times area. Runoff coefficients are
  // the standard published ones: 0.20 for grass on loam, 0.90 for asphalt.
  measure: (v) => {
    const stormLitres = v.rainDepthMm * v.areaM2;
    return {
      stormTotalLitres: stormLitres,
      meadowRunoffLitres: 0.2 * stormLitres,
      meadowSoaksInLitres: 0.8 * stormLitres,
      carParkRunoffLitres: 0.9 * stormLitres,
      carParkSoaksInLitres: 0.1 * stormLitres,
      extraLitresToTheDrain: 0.7 * stormLitres,
      meadowRunoffMm: 0.2 * v.rainDepthMm,
      meadowSoaksInMm: 0.8 * v.rainDepthMm,
      carParkRunoffMm: 0.9 * v.rainDepthMm,
    };
  },
  /*
   * Each plot is drawn holding the water that ran off it, in millimetres over
   * the whole plot, so the two beakers are filling at the rates their runoff
   * coefficients demand: for every millimetre of rain the meadow sheds 0.2 mm
   * and the car park 0.9. The meadow's suspended load is the water going the
   * other way, down into the soil at 10 to 20 mm an hour, which is the part
   * that refills a well. Past about 50 mm of rain the car park is delivering
   * more than a street drain can swallow — it browns over and boils, because at
   * that point the water is in the road rather than in the pipe.
   */
  drive: ({ f, index }) => {
    if (index === 0) {
      return {
        level: Math.min(1, f.meadowRunoffMm / 100),
        color: "#4f9a5e",
        precipitate: Math.min(0.85, f.meadowSoaksInMm / 60),
        bubbles: 0.05,
        rate: 0.3,
      };
    }
    const flooding = f.carParkRunoffMm > 45;
    return {
      level: Math.min(1, f.carParkRunoffMm / 100),
      color: flooding ? "#6b5a3c" : "#5a6472",
      bubbles: flooding ? 0.9 : 0.1,
      glow: flooding ? 0.6 : 0,
      rate: 0.3 + f.carParkRunoffMm / 25,
    };
  },
};

/* D1.4 — Transpiration: the biological piece of the cycle. */
const THROUGH_THE_TREE: ArchetypeSpec = {
  id: "g6d1-through-the-tree",
  title: "Straight Through the Tree",
  tagline: "Follow one drop from the soil to the sky. It never becomes part of the tree at all.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-4", "MS-LS1-6"] },
  learningGoals: [
    "Trace water from soil to atmosphere through a plant.",
    "Explain that almost all the water a plant takes up is transpired, not used.",
  ],
  misconceptions: [
    "Plants drink water the way animals do, and keep it",
    "Water is pushed up a tree from the roots",
  ],
  specimens: [{ id: "drop", name: "The water molecule being followed", art: { art: "molecule", formula: "H2O" } }],
  stages: [
    { name: "Soil", at: 0, caption: "A film of water on soil grains, held there since the last rain." },
    { name: "Root", at: 0.25, caption: "Drawn in through root hairs, pulled by the water leaving the leaves far above." },
    { name: "Trunk", at: 0.5, caption: "Up an unbroken column of water in the xylem, one drop pulling the next." },
    { name: "Leaf", at: 0.75, caption: "Evaporating from wet cell walls into the air spaces inside the leaf." },
    { name: "Sky", at: 1, caption: "Out through a stoma. A large oak sends up to 400 litres a day this way." },
  ],
  route: [
    { at: [0.12, 0.78], name: "Water in the soil",
      note: "A film clinging to soil grains. The tree is not sucking on a puddle: it takes water from a damp solid, and it has to pull hard to get it." },
    { at: [0.26, 0.62], name: "Root hairs",
      note: "Each hair is a single cell a few hundred micrometres long. There are billions of them, and together they multiply the root's contact with the soil many times over." },
    { at: [0.42, 0.5], name: "The xylem",
      note: "An unbroken thread of water from root to leaf, held together by the attraction between water molecules. It is under tension, near minus 2 megapascals, not pressure: the leaves pull, the roots do not push. That is how a redwood lifts water 100 m." },
    { at: [0.58, 0.34], name: "Inside the leaf",
      note: "Water evaporates from the wet walls of the spongy cells into the air spaces between them. This is where liquid becomes vapour, and it costs about 2 450 kJ for every kilogram." },
    { at: [0.74, 0.46], name: "The stomata",
      note: "Pores on the underside of the leaf, 100 to 300 in every square millimetre, opened by guard cells in daylight. Carbon dioxide comes in; water goes out. The plant cannot have one without the other." },
    { at: [0.88, 0.26], name: "The air above the canopy",
      note: "Between 97 and 99 per cent of everything the tree drew from the soil leaves here as vapour. Only the last one or two per cent ends up in sugar and wood. Across all the land on Earth, plants return roughly 39 000 km3 of water to the air each year." },
  ],
  /*
   * The molecule climbs the tree. It rises steadily through the soil, the root
   * and the trunk, tumbling slowly because it is still liquid and roped to its
   * neighbours by hydrogen bonds. Past the leaf — three quarters of the way
   * along — it evaporates, and the change is unmistakable: it breaks loose and
   * spins freely, because a water molecule in air moves at about 590 m/s
   * between collisions and nothing is holding it any more.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const vapour = u > 0.75;
    return {
      offset: [0.35 * Math.sin(u * 5.6), 0.62 - u * 1.24],
      scale: vapour ? 0.85 : 1,
      spin: vapour ? t * 3.4 : 0.68 + t * 0.3,
      rate: vapour ? 4 : 0.6,
    };
  },
};

/* D1.5 — Two drivers: solar energy and gravity. */
const SUN_LIFTS_GRAVITY_DROPS: ArchetypeSpec = {
  id: "g6d1-sun-lifts-gravity-drops",
  title: "The Sun Lifts It, Gravity Drops It",
  tagline: "Two forces run the whole cycle, and one of them does more than a hundred times the work.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-4", "MS-PS3-5"] },
  learningGoals: [
    "Calculate the energy the Sun must supply to evaporate a given mass of water.",
    "Compare that with the energy gravity returns when the same water falls as rain.",
  ],
  misconceptions: [
    "Evaporation and rainfall take about the same amount of energy",
    "Water rises because it is lighter than air",
  ],
  specimens: [{ id: "puddle", name: "Water on the surface", art: { art: "glassware", which: "beaker", level: 0.45, color: "#4a90c2" } }],
  variables: [
    { key: "waterMassKg", label: "Mass of water (kg)", min: 1, max: 500, step: 1, default: 100 },
    { key: "waterTempC", label: "Temperature of the water (degrees C)", min: 0, max: 35, step: 1, default: 15 },
    { key: "cloudHeightM", label: "Height the cloud forms at (m)", min: 500, max: 6000, step: 100, default: 2000 },
  ],
  // Latent heat of vaporisation, 2501 - 2.361 T kJ/kg, against gravitational
  // potential energy, m g h with g = 9.81 N/kg. At 15 degrees it takes 2 466 kJ
  // to evaporate a kilogram, and lifting that same kilogram to a 2 km cloud
  // base stores only 19.6 kJ: the Sun does about 126 times as much work as
  // gravity gives back. Bright midday sunlight delivers about 1 000 W to every
  // square metre, which is where the sunshine hours come from.
  measure: (v) => {
    const latentKJPerKg = 2501 - 2.361 * v.waterTempC;
    const evaporationKJ = v.waterMassKg * latentKJPerKg;
    const gravityKJ = (v.waterMassKg * 9.81 * v.cloudHeightM) / 1000;
    return {
      energyFromTheSunMJ: evaporationKJ / 1000,
      energyFromGravityKJ: gravityKJ,
      sunTimesGreater: evaporationKJ / gravityKJ,
      hoursOfBrightSunOnOneSquareMetre: evaporationKJ / 3600,
      latentHeatKJPerKg: latentKJPerKg,
    };
  },
  plot: {
    x: "cloudHeightM", y: "energyFromGravityKJ",
    xLabel: "Height of the cloud base (m)", yLabel: "Energy gravity returns (kJ)",
  },
  /*
   * The puddle holds the water you asked for — one kilogram is a film in the
   * bottom, five hundred fills it — and evaporates at the rate its temperature
   * allows, which is why a warm puddle steams and a cold one just sits there.
   * The glow is the size of the Sun's share of the work against gravity's:
   * about 126 times at the default settings, and never less than about 40 at
   * any cloud height the slider can reach. Gravity never catches up.
   */
  drive: ({ v, f }) => ({
    level: 0.05 + (v.waterMassKg / 500) * 0.8,
    bubbles: Math.min(1, v.waterTempC / 28),
    color: v.waterTempC > 24 ? "#5fa8c8" : v.waterTempC < 6 ? "#8fb6d8" : "#4a90c2",
    glow: Math.min(1, f.sunTimesGreater / 200),
    rate: 0.15 + v.waterTempC / 12,
  }),
};

/* D1.6 — Residence time, and the cycle as a system. */
const HOW_LONG_IT_STAYS: ArchetypeSpec = {
  id: "g6d1-how-long-it-stays",
  title: "Nine Days, or Three Thousand Years",
  tagline: "Divide what a reservoir holds by what flows through it, and you know how long water stays.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-4"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Calculate a residence time as the volume of a store divided by the flow through it.",
    "Explain why the water cycle is a system whose stores stay steady while water keeps moving.",
  ],
  misconceptions: [
    "Water spends the same length of time everywhere in the cycle",
    "The stores in the water cycle are filling up or draining away",
  ],
  specimens: [{ id: "drop", name: "One water molecule", art: { art: "molecule", formula: "H2O" } }],
  stages: [
    { name: "In the ocean", at: 0,
      caption: "1 338 000 000 km3 in store, 434 000 km3 evaporating a year. Divide: about 3 100 years before this molecule leaves." },
    { name: "Evaporating", at: 0.2,
      caption: "It takes 2 450 kJ per kilogram to make the jump, all of it from sunlight. 505 000 km3 leaves Earth's surface each year." },
    { name: "In the atmosphere", at: 0.4,
      caption: "The air holds only 12 900 km3 at any moment. 12 900 divided by 505 000 is 0.026 of a year: about 9 days aloft." },
    { name: "Falling on land", at: 0.6,
      caption: "107 000 km3 lands on the continents each year, while only 71 000 evaporates back. The extra 36 000 km3 has to run downhill." },
    { name: "In a river", at: 0.8,
      caption: "All Earth's rivers together hold 2 120 km3 and deliver 36 000 km3 a year. That is a residence time of about three weeks." },
    { name: "Back to the ocean, or stuck", at: 1,
      caption: "Unless it is caught: groundwater averages 1 400 years, and ice near the base of the Antarctic sheet fell as snow more than 100 000 years ago." },
  ],
  /*
   * The molecule goes round the loop, and how fast it moves at each place is
   * the residence time there: 3 100 years in the ocean, nine days in the air,
   * three weeks in a river. So it barely stirs at the bottom of the ocean and
   * tears across the sky, which is the point — the same water, the same cycle,
   * and residence times four orders of magnitude apart. It rises as it
   * evaporates and falls as it rains, because that is the shape of the cycle.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const height = u < 0.2 ? -0.5 + u * 1.5 : u < 0.5 ? 0.7 : 0.7 - (u - 0.5) * 2.4;
    const aloft = u >= 0.2 && u < 0.5;
    return {
      offset: [0.5 * Math.sin(u * 6.3), -height],
      spin: aloft ? t * 3.6 : 0.68 + t * 0.2,
      scale: aloft ? 0.8 : 1.05,
      rate: aloft ? 4 : 0.35,
    };
  },
};

export const g6d1WhereTheWaterIs = buildSim(WHERE_THE_WATER_IS);
export const g6d1IntoTheAirAndBack = buildSim(INTO_THE_AIR_AND_BACK);
export const g6d1MeadowOrCarPark = buildSim(MEADOW_OR_CAR_PARK);
export const g6d1ThroughTheTree = buildSim(THROUGH_THE_TREE);
export const g6d1SunLiftsGravityDrops = buildSim(SUN_LIFTS_GRAVITY_DROPS);
export const g6d1HowLongItStays = buildSim(HOW_LONG_IT_STAYS);
