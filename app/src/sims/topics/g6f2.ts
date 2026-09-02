import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F2 — Evidence of a changing climate.
 *
 * Six simulations, one per subtopic:
 *
 *   F2.1  g6f2-reading-the-ice     ice cores                       (explore)
 *   F2.2  g6f2-rings-and-bands     tree rings and coral bands      (compare)
 *   F2.3  g6f2-thermometer-record  the instrumental record         (process)
 *   F2.4  g6f2-rising-water        sea level and sea ice           (investigate)
 *   F2.5  g6f2-keeling-curve       the Keeling curve               (investigate)
 *   F2.6  g6f2-many-witnesses      independent evidence agreeing   (assemble)
 *
 * The two investigations are the quantitative spine. F2.4 computes sea level
 * from thermal expansion and from ice mass, using the fact that 362 gigatonnes
 * of land ice is worth exactly one millimetre of global sea level. F2.5 runs a
 * quadratic fitted to the real Mauna Loa annual means, which reproduces every
 * year from 1959 to 2024 to better than 1.6 ppm, plus the true six ppm
 * seasonal breath of the northern forests.
 */

/* ---------------------------------------------------------------- *
 * F2.1 — Ice cores
 * ---------------------------------------------------------------- */

const READING_THE_ICE: ArchetypeSpec = {
  id: "g6f2-reading-the-ice",
  title: "Reading the Ice",
  tagline: "Three kilometres of Antarctic ice, and real air from 800,000 years ago.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS2-1"] },
  learningGoals: [
    "Explain how an ice core preserves both a thermometer and an actual sample of ancient air.",
    "State that CO2 stayed between 180 and 300 ppm for 800,000 years before the industrial era.",
  ],
  misconceptions: [
    "Ancient air must be reconstructed indirectly rather than measured",
    "Ice cores only tell you about ice, not about the whole planet",
  ],
  specimens: [
    {
      id: "core",
      name: "Ice core section, EPICA Dome C",
      art: { art: "glassware", which: "testTube", level: 0.92, color: "#cfe6f4" },
      parts: [
        {
          id: "snow", name: "This year's snow", at: [0.0, -0.48],
          note: "At Dome C only about 2.5 centimetres of ice forms each year, which is why 3,270 metres of ice reaches back 800,000 years. At Greenland's Summit, where 22 centimetres falls, the same depth covers only 100,000.",
        },
        {
          id: "firn", name: "Firn, the top 100 m", at: [-0.36, -0.24],
          note: "Snow packed into grains, still porous. Air moves freely through it, so the gas here is modern air, not ancient.",
        },
        {
          id: "closeoff", name: "Bubble close-off", at: [0.36, -0.02],
          note: "Between about 70 and 100 metres down the pores seal and the air is locked in. The trapped air is younger than the ice around it, by decades at Summit and by centuries at Dome C.",
        },
        {
          id: "isotopes", name: "The ice as thermometer", at: [-0.36, 0.20],
          note: "Snow that fell in cold air carries less deuterium and less oxygen-18. The ratio is a thermometer: Antarctica swung about 10 degrees between ice ages and warm periods.",
        },
        {
          id: "ash", name: "Volcanic sulphate layers", at: [0.36, 0.36],
          note: "A big eruption leaves a sulphate spike that can be dated exactly. Tambora in 1815 and Samalas in 1257 appear in cores from both poles, which is how separate cores are lined up.",
        },
        {
          id: "co2", name: "What the bubbles say", at: [0.0, 0.50],
          note: "Measured CO2, not estimated: 180 ppm in every ice age, 280 ppm in every warm period, and never once above 300 in 800,000 years. Today it is 424.",
        },
      ],
    },
  ],
};

export const g6f2ReadingTheIce = buildSim(READING_THE_ICE);

/* ---------------------------------------------------------------- *
 * F2.2 — Tree rings and coral bands
 * ---------------------------------------------------------------- */

const RINGS_AND_BANDS: ArchetypeSpec = {
  id: "g6f2-rings-and-bands",
  title: "Rings on Land, Bands in the Sea",
  tagline: "Two living recorders that both keep a year in every layer.",
  kind: "compare",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Explain how an annual growth layer can carry a record of past climate.",
    "Compare what a land archive and an ocean archive each measure, and over what span.",
  ],
  misconceptions: [
    "A wide tree ring always means a warm year",
    "One tree, or one coral, is enough to know past climate",
  ],
  specimens: [
    {
      id: "rings",
      name: "Oak trunk: one ring a year",
      because: "Wide in a kind growing season, narrow in a cold or dry one. Overlapping living trunks with dead timber pushes the record back about 9,000 years, and bristlecone pines standing today are already 4,800 years old.",
      art: { art: "flora", which: "tree" },
    },
    {
      id: "coral",
      name: "Coral head: a dense band and a light band a year",
      because: "The same trick underwater. Strontium swaps into the skeleton in place of calcium more readily in cold water, so the Sr to Ca ratio reads sea temperature to about half a degree, month by month, for 400 years back.",
      art: { art: "sphere", color: "#e08a72", radius: 0.48 },
    },
  ],
};

export const g6f2RingsAndBands = buildSim(RINGS_AND_BANDS);

/* ---------------------------------------------------------------- *
 * F2.3 — The instrumental record
 * ---------------------------------------------------------------- */

const THERMOMETER_RECORD: ArchetypeSpec = {
  id: "g6f2-thermometer-record",
  title: "What the Thermometers Say",
  tagline: "From one parish in 1659 to twenty thousand stations, four thousand floats and a satellite.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Describe how the global temperature record was built and why it needs correcting.",
    "State the observed warming: about 1.1 degrees for 2011 to 2020 against 1850 to 1900.",
  ],
  misconceptions: [
    "Adjusting raw data means the record has been tampered with",
    "A single hot or cold year tells you about the trend",
  ],
  specimens: [
    { id: "earth", name: "The globe, station by station", art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" } },
  ],
  stages: [
    {
      name: "1659: one place", at: 0,
      caption: "The Central England series runs monthly from 1659, the longest instrumental record anywhere. It covers a few counties, so it tells you about England, not the world.",
    },
    {
      name: "1850: enough to average", at: 0.2,
      caption: "By 1850 there are enough land stations and ships' logs to make a global mean at all. That is why pre-industrial usually means the 1850 to 1900 average.",
    },
    {
      name: "Buckets and intakes", at: 0.4,
      caption: "Sea temperature was taken by hauling up a canvas bucket, which cools by evaporation. Around 1945 ships switched to engine intakes, which read warm. Correcting for that is why homogenised data differ from the raw logs.",
    },
    {
      name: "1979: satellites", at: 0.6,
      caption: "Microwave sounders measure the temperature of whole layers of atmosphere and never touch a thermometer. Completely different instrument, same trend.",
    },
    {
      name: "2000s: Argo", at: 0.8,
      caption: "Nearly 4,000 floats now dive to 2,000 metres and surface every ten days. More than 90 per cent of the extra energy goes into the ocean, and Argo is where it is finally measured directly.",
    },
    {
      name: "What it shows", at: 1,
      caption: "The 2011 to 2020 decade averaged 1.1 degrees above 1850 to 1900, and 2023 reached 1.45. Since 1970 the rate has been about 0.2 degrees per decade. Four teams process the raw data independently and get the same curve.",
    },
  ],
};

export const g6f2ThermometerRecord = buildSim(THERMOMETER_RECORD);

/* ---------------------------------------------------------------- *
 * F2.4 — Sea level and sea ice
 * ---------------------------------------------------------------- */

const RISING_WATER: ArchetypeSpec = {
  id: "g6f2-rising-water",
  title: "Warmer Water Takes Up More Room",
  tagline: "Two things raise the sea. Melting sea ice is barely one of them, and the arithmetic shows why.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS2-4"] },
  learningGoals: [
    "Compute the sea-level contribution of thermal expansion and of melting land ice.",
    "Explain why melting floating ice raises sea level almost not at all.",
    "Use the conversion 362 gigatonnes of land ice to one millimetre of global sea level.",
  ],
  misconceptions: [
    "Melting Arctic sea ice is what raises sea level",
    "Sea level rise comes only from melting ice",
  ],
  specimens: [
    { id: "ocean", name: "The world ocean, 361 million square kilometres", art: { art: "glassware", which: "beaker", level: 0.68, color: "#3d8fc4" } },
  ],
  variables: [
    { key: "oceanWarmingC", label: "Warming of the top 700 m of ocean this century (C)", min: 0, max: 1.5, step: 0.05, default: 0.4 },
    { key: "landIceGt", label: "Land ice lost each year (Gt)", min: 0, max: 2000, step: 10, default: 620 },
    { key: "floatingIceGt", label: "Floating ice lost each year (Gt)", min: 0, max: 2000, step: 10, default: 500 },
  ],
  // Three real conversions.
  //
  // Thermal expansion: sea water near the surface expands by about
  // 2.1e-4 of its volume per degree, so a 700 m column gains
  // 700 * 2.1e-4 = 0.147 m per degree, which is 14.7 cm.
  //
  // Land ice: the ocean covers 3.618e14 m2, and a gigatonne of ice is
  // 1e9 m3 of water, so one gigatonne raises the sea by 1e9 / 3.618e14 m,
  // that is 0.00276 mm. Turn it round: 362 Gt per millimetre.
  //
  // Floating ice: it already displaces its own weight, so melting it adds
  // only the volume difference between fresh melt water at 1000 kg/m3 and
  // the salt water it displaced at 1027. That is 2.63e-5 m3 per kg, giving
  // 7.27e-5 mm per gigatonne: 38 times less than the same mass of land ice.
  measure: (v) => {
    const thermalCm = 14.7 * v.oceanWarmingC;
    const landCm = (v.landIceGt * 100) / 3618;
    const floatingCm = v.floatingIceGt * 100 * 7.266e-5 / 10;
    const totalCm = thermalCm + landCm + floatingCm;
    return {
      thermalRiseCm: thermalCm,
      landIceRiseCm: landCm,
      floatingIceRiseCm: floatingCm,
      totalRiseCm: totalCm,
      riseMmPerYear: totalCm / 10,
    };
  },
  plot: { x: "landIceGt", y: "totalRiseCm", xLabel: "Land ice lost each year (Gt)", yLabel: "Sea level rise this century (cm)" },
};

export const g6f2RisingWater = buildSim(RISING_WATER);

/* ---------------------------------------------------------------- *
 * F2.5 — The Keeling curve
 * ---------------------------------------------------------------- */

const KEELING_CURVE: ArchetypeSpec = {
  id: "g6f2-keeling-curve",
  title: "The Curve That Breathes",
  tagline: "Pick a month since 1958 and read the carbon dioxide at Mauna Loa, wobble and all.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"], ccssMath: ["6.EE.C.9", "8.F.B.5"] },
  learningGoals: [
    "Read a value off the Keeling curve and separate the trend from the seasonal wobble.",
    "Explain the annual six ppm breath as northern forests taking up carbon in summer and returning it in winter.",
    "Show that the rise is speeding up: about 0.8 ppm a year in 1958, about 2.5 today.",
  ],
  misconceptions: [
    "The seasonal dip means CO2 is going down",
    "CO2 has always been rising at the same rate",
  ],
  specimens: [
    { id: "co2", name: "Carbon dioxide", art: { art: "molecule", formula: "CO2" } },
  ],
  variables: [
    { key: "year", label: "Year", min: 1958, max: 2030, step: 1, default: 2024 },
    { key: "month", label: "Month (1 = January)", min: 1, max: 12, step: 1, default: 5 },
  ],
  // The trend is a quadratic least-squares fit to the Mauna Loa annual means
  // from 1959 to 2024, and it reproduces every one of them to better than
  // 1.6 ppm: C = 314.96 + 0.7492 x + 0.013606 x^2, with x the years since
  // 1958. The x-squared term is the acceleration; differentiate and the
  // growth rate is 0.7492 + 0.027212 x, which is 0.80 ppm a year in 1960 and
  // 2.55 today.
  //
  // The seasonal term is a two-harmonic fit to the real Mauna Loa monthly
  // departures, good to 0.11 ppm. It peaks in early May and bottoms in late
  // September, a swing of 5.7 ppm, and averages to zero over a year.
  //
  // Beyond 2024 the curve is an extrapolation of the fit, not a forecast.
  measure: (v) => {
    const x = v.year - 1958;
    const trend = 314.96 + 0.7492 * x + 0.013606 * x * x;
    const t = (v.month - 0.5) / 12;
    const seasonal =
      -0.885 * Math.cos(2 * Math.PI * t) + 2.374 * Math.sin(2 * Math.PI * t)
      + 0.549 * Math.cos(4 * Math.PI * t) - 0.433 * Math.sin(4 * Math.PI * t);
    const co2 = trend + seasonal;
    return {
      co2Ppm: co2,
      trendPpm: trend,
      seasonalPpm: seasonal,
      growthPpmPerYear: 0.7492 + 0.027212 * x,
      percentAbove1750: (co2 / 280 - 1) * 100,
    };
  },
  plot: { x: "year", y: "co2Ppm", xLabel: "Year", yLabel: "CO2 (ppm)" },
};

export const g6f2KeelingCurve = buildSim(KEELING_CURVE);

/* ---------------------------------------------------------------- *
 * F2.6 — Why independent evidence agreeing is the whole argument
 * ---------------------------------------------------------------- */

const MANY_WITNESSES: ArchetypeSpec = {
  id: "g6f2-many-witnesses",
  title: "Seven Witnesses Who Never Met",
  tagline: "Build the case one instrument at a time. None of them shares a thermometer.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5"] },
  learningGoals: [
    "Assemble several independent lines of evidence into a single argument.",
    "Explain why agreement between independent measurements is stronger than any one of them alone.",
  ],
  misconceptions: [
    "The whole case rests on surface thermometers",
    "If one dataset were wrong the conclusion would collapse",
  ],
  specimens: [
    {
      id: "case",
      name: "The case, assembled",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
      parts: [
        {
          id: "stations", name: "Land and ship thermometers", at: [-0.44, -0.40],
          note: "More than 20,000 stations plus ships and buoys, processed independently by four teams in four countries. The 2011 to 2020 decade came out 1.1 degrees above 1850 to 1900 in all of them.",
        },
        {
          id: "satellites", name: "Satellite sounders", at: [0.44, -0.40],
          note: "Since 1979, microwave instruments read the temperature of whole layers of air from orbit. They share no equipment with any ground station, and they show the same warming.",
        },
        {
          id: "ocean", name: "Ocean heat content", at: [-0.52, -0.02],
          note: "Argo floats and earlier ship casts. The upper 2,000 metres has gained roughly 380 zettajoules since 1960, and this is where more than 90 per cent of the extra energy has gone.",
        },
        {
          id: "sealevel", name: "Sea level", at: [0.52, -0.02],
          note: "Tide gauges since 1900 give about 1.4 mm a year; satellite altimeters since 1993 give 3.4 mm a year and rising. Two entirely different methods, one accelerating curve.",
        },
        {
          id: "seaice", name: "Arctic sea ice", at: [-0.44, 0.36],
          note: "September extent has fallen from about 7.0 million square kilometres in 1979 to about 4.4 today, a loss of 12.2 per cent per decade, measured by satellite radar rather than by any thermometer.",
        },
        {
          id: "cores", name: "Ice cores", at: [0.44, 0.36],
          note: "Air trapped in Antarctic ice shows CO2 between 180 and 300 ppm for 800,000 years. Today's 424 ppm is outside the whole of that range.",
        },
        {
          id: "life", name: "Living things", at: [0.0, 0.54],
          note: "Nobody's instrument at all. Spring events have moved about 2.8 days earlier per decade and species ranges about 17 km per decade towards the poles. Plants and animals are recording the same change.",
        },
      ],
    },
  ],
};

export const g6f2ManyWitnesses = buildSim(MANY_WITNESSES);
