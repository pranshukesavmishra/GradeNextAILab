import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D3 — Weather variables and instruments.
 *
 * Six simulations, one per subtopic:
 *
 *   D3.1  g6d3-three-scales-one-bulb    temperature                 (investigate)
 *   D3.2  g6d3-a-column-of-mercury      pressure and the barometer  (explore)
 *   D3.3  g6d3-two-thermometers-one-wet humidity and dew point      (investigate)
 *   D3.4  g6d3-what-falls-and-why       precipitation               (sort)
 *   D3.5  g6d3-four-times-the-speed     wind speed and direction    (compare)
 *   D3.6  g6d3-build-the-station        reading a station together  (assemble)
 *
 * Every instrument here is described the way a real station uses it: the
 * thermometer 1.25 m above short grass in a louvred screen, the anemometer at
 * 10 m, the barometer corrected to sea level. The one worked example runs
 * through the topic — a dry bulb at 20 degrees and a wet bulb at 15, which is
 * 59 per cent humidity and a dew point of 11.6 degrees.
 */

/**
 * How fast each kind of precipitation actually falls, in metres per second.
 *
 * Measured terminal velocities: a 2 mm raindrop reaches about 6.5 m/s, drizzle
 * a tenth of that, a snowflake barely 1 m/s because it is mostly air, and a
 * large hailstone better than 30. D3.4 draws each one falling at its own speed,
 * which is most of what tells them apart in the sky.
 */
const FALL_SPEED_MS: Record<string, number> = {
  snow: 1, hail: 30, sleet: 8, rain: 6.5, drizzle: 0.8, freezing: 6.5,
};

/* D3.1 — Temperature. */
const THREE_SCALES_ONE_BULB: ArchetypeSpec = {
  id: "g6d3-three-scales-one-bulb",
  title: "Three Scales, One Bulb",
  tagline: "A thermometer measures nothing but how far a liquid has swollen. The rest is arithmetic.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-PS1-4"], ccssMath: ["6.EE.A.2"] },
  learningGoals: [
    "Convert between Celsius, Fahrenheit and kelvin.",
    "Explain how the bulb volume and the bore width of a thermometer set how far it moves per degree.",
  ],
  misconceptions: [
    "A thermometer measures how much heat something contains",
    "Zero degrees means no temperature at all",
  ],
  specimens: [{ id: "thermo", name: "Liquid-in-glass thermometer", art: { art: "glassware", which: "testTube", level: 0.45, color: "#b8bcc4" } }],
  variables: [
    { key: "temperatureC", label: "Temperature (degrees C)", min: -50, max: 60, step: 1, default: 20 },
    { key: "bulbVolumeMm3", label: "Volume of the bulb (mm3)", min: 50, max: 500, step: 10, default: 200 },
    { key: "boreDiameterMm", label: "Width of the bore (mm)", min: 0.1, max: 0.5, step: 0.01, default: 0.2 },
  ],
  // Thermal expansion, straight from the definition: dV = beta V dT, and the
  // liquid can only go up the bore, so the rise is dV divided by the bore's
  // cross-section. Mercury expands at 1.81e-4 per kelvin and the glass around
  // it at about 2.5e-5, so the apparent coefficient is 1.6e-4; ethanol's is
  // 1.09e-3, apparent 1.065e-3. A 200 mm3 bulb with a 0.2 mm bore gives almost
  // exactly 1 mm per degree in mercury, which is a real lab thermometer, and
  // nearly 7 mm per degree in alcohol, which is why alcohol thermometers need
  // a much finer bore.
  measure: (v) => {
    const boreAreaMm2 = (Math.PI * v.boreDiameterMm * v.boreDiameterMm) / 4;
    const mercuryPerDegree = (1.6e-4 * v.bulbVolumeMm3) / boreAreaMm2;
    return {
      fahrenheit: (v.temperatureC * 9) / 5 + 32,
      kelvin: v.temperatureC + 273.15,
      mercuryRiseMmPerDegree: mercuryPerDegree,
      alcoholRiseMmPerDegree: (1.065e-3 * v.bulbVolumeMm3) / boreAreaMm2,
      mercuryColumnAboveZeroMm: mercuryPerDegree * v.temperatureC,
      scaleLengthForOneHundredDegreesMm: mercuryPerDegree * 100,
    };
  },
  plot: {
    x: "temperatureC", y: "fahrenheit",
    xLabel: "Temperature (degrees C)", yLabel: "The same temperature in Fahrenheit",
  },
  /*
   * The column moves, because a thermometer is nothing but a column that moves.
   * The tube here is 200 mm of scale with the zero mark halfway up, so a
   * standard bulb and bore — 1 mm per degree — puts 20 degrees a fifth of the
   * way above the middle and -50 degrees near the bottom. Widen the bulb or
   * narrow the bore and the same degree drives the liquid much further: 500 mm3
   * behind a 0.1 mm bore gives 10.2 mm per degree and the column shoots off the
   * end of the scale, which is the failure a real instrument maker has to design
   * around. Off-scale is drawn as a flat grey bore with nothing to read.
   */
  drive: ({ f }) => {
    const offScale = Math.abs(f.mercuryColumnAboveZeroMm) > 100;
    return {
      level: Math.max(0.02, Math.min(1, 0.5 + f.mercuryColumnAboveZeroMm / 200)),
      color: offScale ? "#8d94a3" : "#c0392b",
      glow: offScale ? 0.7 : 0,
      rate: offScale ? 0 : 0.4,
    };
  },
};

/* D3.2 — Air pressure and the barometer. */
const A_COLUMN_OF_MERCURY: ArchetypeSpec = {
  id: "g6d3-a-column-of-mercury",
  title: "Seven Hundred and Sixty Millimetres",
  tagline: "Nothing holds the mercury up except the weight of the air outside the tube.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Explain how a mercury barometer balances a column of liquid against air pressure.",
    "Convert between millimetres of mercury, pascals and hectopascals.",
  ],
  misconceptions: [
    "The vacuum at the top of the tube sucks the mercury up",
    "Barometers measure how much air there is rather than how hard it pushes",
  ],
  specimens: [
    {
      id: "barometer", name: "Mercury barometer",
      art: { art: "glassware", which: "testTube", level: 0.76, color: "#9aa3b0" },
      parts: [
        { id: "vacuum", name: "The empty space on top", at: [0.02, -0.44],
          note: "Torricelli filled a sealed tube with mercury and turned it over into a dish. What is left above the metal is as near to nothing as anyone could make in 1643. With no gas inside pushing down, the column is held up entirely from outside." },
        { id: "column", name: "The column itself", at: [-0.30, -0.06],
          note: "760 mm at standard sea-level pressure, and the arithmetic checks: h = P / (rho g) = 101 325 / (13 595 x 9.81) = 0.760 m. Mercury's density, 13 595 kg/m3, is the only reason this fits in a room." },
        { id: "reservoir", name: "The open dish", at: [0.00, 0.44],
          note: "Air presses down on the exposed mercury here with 101 325 pascals, which is 10.3 tonnes on every square metre. Press harder and the column rises; ease off and it drops. The instrument measures this push and nothing else." },
        { id: "scale", name: "The scale", at: [0.34, 0.16],
          note: "One millimetre of mercury is 133.3 Pa. Forecasters use hectopascals: 1013.25 hPa is standard, above 1020 usually means settled weather, and below 1000 means a storm is not far away." },
        { id: "water", name: "Why not water", at: [-0.36, 0.28],
          note: "Water is 13.6 times less dense, so the same 101 325 Pa would hold a water column 10.33 m tall. Otto von Guericke built exactly that up the outside of his house and used the little float on top to forecast the weather." },
        { id: "aneroid", name: "The aneroid version", at: [0.34, -0.30],
          note: "A sealed metal capsule with the air pumped out, sprung so it cannot collapse. It flexes a fraction of a millimetre as the pressure changes and levers magnify that onto a dial. No mercury, no 760 mm tube, and it fits in a pocket." },
      ],
    },
  ],
  /*
   * The mercury does not sit still, because the weather does not. A deep low of
   * 950 hPa holds the column at 713 mm and a strong high of 1 050 hPa at 788,
   * and a depression takes a couple of days to cross — so the barometer here
   * walks that whole range while a student reads the labels. The tube is scaled
   * to show 600 to 860 mm rather than 0 to 1 000, which is what a real
   * instrument does too: a barometer that showed the empty bottom two thirds of
   * its own tube would waste the only part anyone reads.
   */
  drive: ({ t }) => {
    const mmHg = 750 + 38 * Math.sin(t * 0.16);
    return { level: (mmHg - 600) / 260, color: "#9aa3b0", rate: 0.2 };
  },
};

/* D3.3 — Humidity and dew point. */
const TWO_THERMOMETERS_ONE_WET: ArchetypeSpec = {
  id: "g6d3-two-thermometers-one-wet",
  title: "Two Thermometers, One Wet",
  tagline: "Wrap wet muslin round the second bulb. The gap between the readings is the humidity.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-PS3-4"] },
  learningGoals: [
    "Read relative humidity and dew point from a wet-and-dry-bulb hygrometer.",
    "Explain that evaporation cools the wet bulb, and cools it less when the air is already damp.",
  ],
  misconceptions: [
    "Relative humidity tells you how much water is in the air",
    "The dew point is a fixed temperature like freezing point",
  ],
  specimens: [{ id: "psychro", name: "Wet-and-dry-bulb hygrometer", art: { art: "glassware", which: "testTube", level: 0.5, color: "#79b4d8" } }],
  variables: [
    { key: "dryBulbC", label: "Dry bulb (degrees C)", min: -5, max: 40, step: 0.5, default: 20 },
    { key: "wetBulbC", label: "Wet bulb (degrees C)", min: -5, max: 40, step: 0.5, default: 15 },
  ],
  // The psychrometric equation as the meteorological services write it:
  // e = es(Tw) - gamma (T - Tw), with gamma = 0.000665 P and P = 101.3 kPa, so
  // gamma = 0.0674 kPa per degree. Saturation pressures come from Magnus-Tetens,
  // es = 0.6108 exp(17.27 T / (T + 237.3)). A dry bulb of 20 and a wet bulb of
  // 15 give 58.5 per cent and a dew point of 11.6 degrees, which is what the
  // printed psychrometric table says. The wet bulb can never read higher than
  // the dry bulb, so it is clamped.
  measure: (v) => {
    const es = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
    const wet = Math.min(v.wetBulbC, v.dryBulbC);
    const dryEs = es(v.dryBulbC);
    const ea = Math.max(0.001, es(wet) - 0.0674 * (v.dryBulbC - wet));
    const alpha = Math.log(ea / 0.6108);
    return {
      saturationPressureKPa: dryEs,
      actualVapourPressureKPa: ea,
      relativeHumidityPct: (ea / dryEs) * 100,
      dewPointC: (237.3 * alpha) / (17.27 - alpha),
      wetBulbDepressionC: v.dryBulbC - wet,
      waterInAirGPerM3: (ea * 1e6) / (461.5 * (v.dryBulbC + 273.15)),
    };
  },
  plot: {
    x: "wetBulbC", y: "relativeHumidityPct",
    xLabel: "Wet bulb reading (degrees C)", yLabel: "Relative humidity (per cent)",
  },
  /*
   * The instrument fills to the humidity it is reading, so the column is the
   * answer rather than an illustration beside it. The bubbling is the wet
   * bulb's evaporation, which is the only reason the two thermometers ever
   * disagree: a 25 degree depression dries hard and reads under one per cent
   * humidity, and no depression at all means nothing is evaporating and the air
   * is saturated. At saturation the run has crossed its threshold — the dew
   * point has met the dry bulb, mist forms in the instrument, and the reading
   * goes flat white, which is a fog and not a measurement.
   */
  drive: ({ f }) => {
    const saturated = f.relativeHumidityPct > 98;
    return {
      level: Math.max(0.03, Math.min(1, f.relativeHumidityPct / 100)),
      bubbles: Math.min(1, f.wetBulbDepressionC / 12),
      precipitate: saturated ? 0.75 : 0,
      color: saturated ? "#e8eef6" : f.relativeHumidityPct < 25 ? "#c9a24a" : "#79b4d8",
      rate: 0.15 + f.wetBulbDepressionC / 6,
    };
  },
};

/* D3.4 — Precipitation. */
const WHAT_FALLS_AND_WHY: ArchetypeSpec = {
  id: "g6d3-what-falls-and-why",
  title: "What Falls, and Why",
  tagline: "Six kinds of precipitation, and the whole difference is the temperature on the way down.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Name the main forms of precipitation and the temperature layers each one needs.",
    "Distinguish ice pellets from freezing rain by where the drop refreezes.",
  ],
  misconceptions: [
    "Snow only falls when the ground temperature is below zero",
    "Hail is frozen rain",
  ],
  categories: [
    { id: "frozen", name: "Frozen the whole way down", hint: "it was never liquid" },
    { id: "refrozen", name: "Melted, then frozen again in the air", hint: "liquid in the middle of its journey" },
    { id: "liquid", name: "Liquid when it lands", hint: "whatever it did higher up, it arrives wet" },
  ],
  specimens: [
    { id: "snow", name: "Snow", category: "frozen",
      because: "Crystals grow straight out of vapour near -15 degrees, where the air is most supersaturated over ice. They can fall through a layer a few degrees above zero and survive: 10 mm of fresh snow melts down to about 1 mm of water.",
      art: { art: "sphere", color: "#e8f0f8", radius: 0.34 } },
    { id: "hail", name: "Hail", category: "frozen",
      because: "Built inside a thunderstorm, layer on layer, in air well below zero the whole time. A 2 cm stone falls at roughly 20 m/s, so the updraft that held it up had to be at least that strong. It is not frozen rain.",
      art: { art: "sphere", color: "#dfe8f2", radius: 0.46 } },
    { id: "sleet", name: "Ice pellets, or sleet", category: "refrozen",
      because: "Snow melts crossing a warm layer above zero, then hits a deep sub-zero layer near the ground and freezes solid again. The pellets bounce and rattle when they land.",
      art: { art: "sphere", color: "#c8d8e8", radius: 0.26 } },
    { id: "rain", name: "Rain", category: "liquid",
      because: "Drops 0.5 to 5 mm across, falling at 2 to 9 m/s. Past about 5 mm the airflow flattens a drop until it tears apart, so there is a hard ceiling on how big a raindrop can be.",
      art: { art: "glassware", which: "testTube", level: 0.6, color: "#4a90c2" } },
    { id: "drizzle", name: "Drizzle", category: "liquid",
      because: "Drops under 0.5 mm, drifting down slower than 2 m/s from shallow stratus. They fall so slowly that the smallest of them seem to hang in the air and blow sideways.",
      art: { art: "sphere", color: "#8fb6d6", radius: 0.2 } },
    { id: "freezing", name: "Freezing rain", category: "liquid",
      because: "The same warm layer melts the snow, but the cold layer beneath is too shallow to refreeze the drop. It lands as liquid at below zero and turns to glaze ice the instant it touches anything.",
      art: { art: "glassware", which: "beaker", level: 0.3, color: "#79b4d8" } },
  ],
  /*
   * Everything here falls, and each one falls at the speed it really falls at.
   * A snowflake is mostly trapped air and drifts down at about 1 m/s; a
   * hailstone is solid ice and arrives at 30, which is why one is pleasant and
   * the other dents cars. Drizzle hangs, rain drops, sleet rattles. The colours
   * stay as they are, because the sorting question is what happened to the
   * temperature on the way down, not what it looks like.
   */
  drive: ({ specimen, t }) => {
    const speed = FALL_SPEED_MS[specimen.id] ?? 5;
    const fall = ((t * speed) / 14) % 1;
    return {
      offset: [0.06 * Math.sin(t * 1.7 + speed), fall * 1.5 - 0.75],
      rate: 0.2 + speed / 8,
    };
  },
};

/* D3.5 — Wind: speed and direction. */
const FOUR_TIMES_THE_SPEED: ArchetypeSpec = {
  id: "g6d3-four-times-the-speed",
  title: "Four Times the Speed, Sixteen Times the Push",
  tagline: "Two days at the same station, the same sign, the same westerly. Not the same force at all.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-PS2-2"] },
  learningGoals: [
    "Calculate the force wind puts on a surface from the air's density and the wind speed.",
    "Explain why wind force grows with the square of the speed, and wind power with the cube.",
  ],
  misconceptions: [
    "Twice the wind speed means twice the push",
    "Wind direction is the direction the wind is heading",
  ],
  specimens: [
    { id: "breeze", name: "Force 3 westerly, 5 m/s",
      because: "Dynamic pressure 15 Pa, so 31 N on a 2 m2 sign: about the weight of a 3 kg bag. Leaves move constantly.",
      art: { art: "apparatus", which: "spring" } },
    { id: "gale", name: "Force 8 westerly, 20 m/s",
      because: "Dynamic pressure 245 Pa, so 490 N on the same sign: the weight of a 50 kg adult. Twigs snap off trees.",
      art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "windSpeedMs", label: "Wind speed (m/s)", min: 0, max: 35, step: 0.5, default: 5 },
    { key: "signAreaM2", label: "Area facing the wind (m2)", min: 0.5, max: 10, step: 0.5, default: 2 },
  ],
  // Dynamic pressure, q = half rho v squared, with sea-level air at
  // 1.225 kg/m3. At 5 m/s that is 15.3 Pa and at 20 m/s it is 245 Pa: four
  // times the speed, sixteen times the pressure. The power carried through the
  // same area goes as v cubed, half rho A v cubed, so the gale carries 64 times
  // the power of the breeze. Both are exact, not estimates.
  measure: (v) => ({
    speedKmh: v.windSpeedMs * 3.6,
    dynamicPressurePa: 0.5 * 1.225 * v.windSpeedMs * v.windSpeedMs,
    forceOnTheSignN: 0.5 * 1.225 * v.windSpeedMs * v.windSpeedMs * v.signAreaM2,
    sameForceAsAMassOfKg: (0.5 * 1.225 * v.windSpeedMs * v.windSpeedMs * v.signAreaM2) / 9.81,
    powerCarriedThroughW: 0.5 * 1.225 * v.signAreaM2 * Math.pow(v.windSpeedMs, 3),
    forceAtFourTimesTheSpeedN: 0.5 * 1.225 * Math.pow(Math.min(35, v.windSpeedMs * 4), 2) * v.signAreaM2,
  }),
  /*
   * The left-hand sign stands in the wind you set; the right-hand one stands in
   * four times that wind, up to the 35 m/s the anemometer can read. Both bend by
   * the force actually on them, and because dynamic pressure goes as the square
   * of the speed, the right-hand sign is bent sixteen times as far — which is
   * the whole title of the simulation, made visible rather than asserted. The
   * area control widens both signs, and a sign twice the area is only 1.41
   * times as wide, because area goes as the square of a length.
   */
  drive: ({ v, f, index, t }) => {
    const force = index === 0 ? f.forceOnTheSignN : f.forceAtFourTimesTheSpeedN;
    const speed = index === 0 ? v.windSpeedMs : Math.min(35, v.windSpeedMs * 4);
    const bend = Math.min(1, force / 900);
    return {
      offset: [bend * 0.5 + 0.02 * bend * Math.sin(t * (3 + speed)), 0],
      tilt: 0.24 + bend * 0.75,
      scale: Math.min(1.7, Math.sqrt(v.signAreaM2 / 2)),
      rate: 0.1 + speed / 5,
    };
  },
};

/* D3.6 — Reading a weather station together. */
const BUILD_THE_STATION: ArchetypeSpec = {
  id: "g6d3-build-the-station",
  title: "Build the Station",
  tagline: "Six instruments, and every one of them has a rule about where it must stand.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Match each weather variable to the instrument that measures it.",
    "Explain why siting rules exist, and what a badly placed instrument measures instead.",
  ],
  misconceptions: [
    "Any thermometer left outside gives the air temperature",
    "A bigger rain gauge collects more rainfall",
  ],
  specimens: [
    {
      id: "station", name: "One weather station",
      art: { art: "apparatus", which: "stand" },
      parts: [
        { id: "screen", name: "Thermometer in a louvred screen", at: [-0.02, -0.36],
          note: "Air temperature is read in shade, 1.25 m above short grass, inside a white slatted box that air passes through and sunlight does not. A bare thermometer in full sun can read 10 degrees high, and then it is telling you about itself rather than about the air." },
        { id: "barometer", name: "Barometer, corrected to sea level", at: [0.34, -0.22],
          note: "Pressure drops about 1 hPa for every 8 m of height, so a station 200 m up adds roughly 25 hPa before it reports. Skip the correction and every hill on the map looks like a permanent depression." },
        { id: "hygrometer", name: "Wet-and-dry-bulb hygrometer", at: [-0.36, -0.10],
          note: "Two thermometers side by side, one with a wet wick around the bulb. Dry 20 and wet 15 means 59 per cent relative humidity and a dew point of 11.6 degrees. The closer the two readings, the damper the air; equal readings mean fog is likely." },
        { id: "gauge", name: "Rain gauge", at: [-0.28, 0.30],
          note: "A funnel of known area draining into a cylinder. One millimetre of rain is exactly one litre on every square metre, so the funnel's width cancels out of the answer. It must stand clear of buildings by at least twice their height, or they will shelter it." },
        { id: "anemometer", name: "Anemometer, 10 m up", at: [0.32, 0.22],
          note: "Three cups on a spindle, held 10 m above the ground so hedges and roofs are not slowing the flow it samples. Speed matters more than it looks: four times the speed is sixteen times the force on anything in the way." },
        { id: "vane", name: "Wind vane", at: [0.06, 0.42],
          note: "The tail catches the wind and swings the arrow into it, so the vane points at where the wind comes from. That is also how winds are named: a westerly blows from the west, towards the east." },
      ],
    },
  ],
  /*
   * A station is a thing that runs, so this one runs: the mast swings round as
   * the wind backs and veers, gusting and easing on the roughly half-minute
   * cycle real surface wind has, and leaning into the stronger gusts. A student
   * reading the anemometer label is watching the instrument the label is about.
   */
  drive: ({ t }) => {
    const gust = 0.55 + 0.45 * Math.sin(t * 0.42) * Math.sin(t * 0.17);
    return {
      spin: 0.68 + Math.sin(t * 0.11) * 1.4,
      tilt: 0.24 + gust * 0.12,
      offset: [gust * 0.05, 0],
    };
  },
};

export const g6d3ThreeScalesOneBulb = buildSim(THREE_SCALES_ONE_BULB);
export const g6d3AColumnOfMercury = buildSim(A_COLUMN_OF_MERCURY);
export const g6d3TwoThermometersOneWet = buildSim(TWO_THERMOMETERS_ONE_WET);
export const g6d3WhatFallsAndWhy = buildSim(WHAT_FALLS_AND_WHY);
export const g6d3FourTimesTheSpeed = buildSim(FOUR_TIMES_THE_SPEED);
export const g6d3BuildTheStation = buildSim(BUILD_THE_STATION);
