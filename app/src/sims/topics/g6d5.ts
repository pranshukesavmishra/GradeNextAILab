import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D5 — Unequal heating of Earth.
 *
 * Five simulations, one per subtopic:
 *
 *   D5.1  g6d5-spread-thin                 angle of sunlight and latitude (investigate)
 *   D5.2  g6d5-sand-and-sea                land versus water              (compare)
 *   D5.3  g6d5-six-and-a-half-per-km       altitude                       (investigate)
 *   D5.4  g6d5-what-the-ground-sends-back  albedo                         (sort)
 *   D5.5  g6d5-the-afternoon-lag           day, night and the pattern     (process)
 *
 * The same solar constant, 1361 W/m2, and the same clear-sky transmission run
 * through the whole topic, so a figure quoted in one simulation is the figure
 * another one computes. Noon at the equator delivers about 950 W to a square
 * metre of ground; at 70 degrees north on the same day it is about 220.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second, so this is the rail's own
 * position and the ground heats in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/* D5.1 — Angle of sunlight and latitude. */
const SPREAD_THIN: ArchetypeSpec = {
  id: "g6d5-spread-thin",
  title: "Spread Thin",
  tagline: "The Sun sends the same beam to the pole as to the equator. The ground is what differs.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-ESS1-1"] },
  learningGoals: [
    "Explain unequal heating as the same beam of sunlight spread over more ground at high latitudes.",
    "Calculate the noon sun angle and the sunlight reaching the ground from latitude and season.",
  ],
  misconceptions: [
    "The poles are cold because they are further from the Sun",
    "Sunlight is weaker when it leaves the Sun in winter",
  ],
  specimens: [{ id: "earth", name: "Sunlight arriving at the ground", art: { art: "planet", color: "#2f6fa8", atmosphere: "#9ec8e8" } }],
  variables: [
    { key: "latitudeDeg", label: "Latitude (degrees north)", min: 0, max: 80, step: 1, default: 38 },
    { key: "declinationDeg", label: "Sun's declination: 0 at an equinox, plus or minus 23.5 at a solstice", min: -23.5, max: 23.5, step: 0.5, default: 0 },
  ],
  // Lambert's cosine law with the solar constant, 1361 W/m2: a beam meeting the
  // ground at an angle z from vertical delivers 1361 cos z per square metre, and
  // covers 1/cos z square metres of ground. The atmosphere then takes its cut,
  // by the standard clear-sky relation 0.7 raised to the power (air mass)^0.678,
  // with air mass 1/cos z. At the equator at noon on an equinox that gives
  // 953 W/m2, the familiar clear-sky midday figure. Day length is exact
  // spherical geometry: cos H = -tan(latitude) tan(declination), and 2H/15 hours
  // of daylight — 14.6 hours at 38 degrees north in midsummer.
  measure: (v) => {
    const rad = Math.PI / 180;
    const zenith = Math.abs(v.latitudeDeg - v.declinationDeg) * rad;
    const cosZ = Math.max(0.0001, Math.cos(zenith));
    const airMass = 1 / cosZ;
    const product = -Math.tan(v.latitudeDeg * rad) * Math.tan(v.declinationDeg * rad);
    const clamped = Math.max(-1, Math.min(1, product));
    return {
      noonSunAngleAboveHorizonDeg: 90 - Math.abs(v.latitudeDeg - v.declinationDeg),
      topOfAtmosphereWPerM2: 1361 * cosZ,
      groundLevelWPerM2: 1361 * cosZ * Math.pow(0.7, Math.pow(airMass, 0.678)),
      squareMetresLitByOneSquareMetreOfBeam: airMass,
      hoursOfDaylight: product <= -1 ? 24 : product >= 1 ? 0 : (2 * Math.acos(clamped)) / rad / 15,
    };
  },
  plot: {
    x: "latitudeDeg", y: "groundLevelWPerM2",
    xLabel: "Latitude (degrees)", yLabel: "Sunlight reaching the ground at noon (W/m2)",
  },
  /*
   * The globe is tipped to the angle the beam actually meets the ground at. The
   * solar zenith angle is the latitude minus the declination, so the equator at
   * an equinox is face-on to the Sun and 80 degrees north in midwinter is tipped
   * more than a right angle away from it — which is why the beam spreads, and it
   * is the whole of Lambert's cosine law shown as a tilt rather than stated as a
   * formula. The colour is what is left arriving at the ground once the
   * atmosphere has taken its cut: 953 W/m2 on the equator at noon, 75 at 80
   * degrees north, and a night-blue nothing beyond the Arctic circle in winter.
   */
  drive: ({ v, f, t }) => {
    const w = f.groundLevelWPerM2;
    return {
      tilt: Math.abs(v.latitudeDeg - v.declinationDeg) * (Math.PI / 180),
      spin: t * 0.16,
      color: w > 800 ? "#f6e6a8" : w > 500 ? "#9fbcd8" : w > 200 ? "#4a7fae" : "#25476f",
      scale: 1,
    };
  },
};

/* D5.2 — Land versus water heating rates. */
const SAND_AND_SEA: ArchetypeSpec = {
  id: "g6d5-sand-and-sea",
  title: "Sand and Sea, Same Sunshine",
  tagline: "Pour identical energy into a kilogram of each. One of them barely notices.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-PS3-4"] },
  learningGoals: [
    "Use specific heat capacity to compare how far land and water warm for the same energy.",
    "Explain why the sea lags the land through the day and through the year.",
  ],
  misconceptions: [
    "Water heats faster than land because it absorbs light better",
    "The sea is cold in summer because the Sun does not reach it",
  ],
  specimens: [
    { id: "land", name: "Dry ground",
      because: "Specific heat 830 J/kg K, so 4 184 J warms a kilogram by 5.0 degrees. Only the top 10 cm heats at all.",
      art: { art: "habitat", which: "desert" } },
    { id: "sea", name: "Sea water",
      because: "Specific heat 4 184 J/kg K: the same energy raises a kilogram exactly 1.0 degree, and waves mix it 50 m down.",
      art: { art: "habitat", which: "ocean" } },
  ],
  variables: [
    { key: "energyJ", label: "Energy supplied (J)", min: 500, max: 20000, step: 100, default: 4184 },
    { key: "massKg", label: "Mass being heated (kg)", min: 0.5, max: 10, step: 0.5, default: 1 },
  ],
  // Q = m c dT rearranged. The specific heat of liquid water, 4184 J/kg K, is
  // the largest of any common substance; dry sand is 830 and dry soil about 800.
  // The ratio 4184/830 is 5.04, so the same energy in the same mass moves sand
  // five times as far. Water then hides its warming even better, because
  // sunlight penetrates several metres and waves stir it through tens more,
  // while sunlight on land stops in the first millimetre.
  measure: (v) => ({
    landTemperatureRiseC: v.energyJ / (v.massKg * 830),
    waterTemperatureRiseC: v.energyJ / (v.massKg * 4184),
    landWarmsThisManyTimesFaster: 4184 / 830,
    energyToWarmThatWaterOneDegreeJ: v.massKg * 4184,
    energyToWarmThatGroundOneDegreeJ: v.massKg * 830,
  }),
  /*
   * Two square metres of California given exactly the same joules, and the
   * ground rises five times as far because it takes 830 J to warm a kilogram of
   * it by a degree against water's 4 184. So the desert lifts on its own heat
   * haze and shimmers, and the sea barely stirs: 4 184 J into a kilogram raises
   * the ground 5.0 degrees and the water 1.0. Everything drawn here is that one
   * ratio, which is also the reason the coast is cool in August and the valley
   * is not.
   */
  drive: ({ f, index, t }) => {
    const rise = index === 0 ? f.landTemperatureRiseC : f.waterTemperatureRiseC;
    return {
      scale: 1 + Math.min(0.45, rise / 110),
      offset: [
        index === 0 ? 0.02 * Math.min(1, rise / 20) * Math.sin(t * 17) : 0,
        -Math.min(0.5, rise / 100),
      ],
    };
  },
};

/* D5.3 — Altitude. */
const SIX_AND_A_HALF_PER_KILOMETRE: ArchetypeSpec = {
  id: "g6d5-six-and-a-half-per-kilometre",
  title: "Six and a Half Degrees a Kilometre",
  tagline: "Walk up a mountain in California and you can cross from orange groves to snow in an afternoon.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Use the environmental lapse rate to find the temperature at any altitude.",
    "Find the freezing level, which decides whether a storm brings rain or snow.",
  ],
  misconceptions: [
    "Mountain tops are cold because they are closer to the Sun",
    "The air is colder up high because there is less sunlight there",
  ],
  specimens: [{ id: "thermo", name: "A thermometer carried up the mountain", art: { art: "glassware", which: "testTube", level: 0.6, color: "#c0392b" } }],
  variables: [
    { key: "altitudeM", label: "Altitude (m)", min: 0, max: 4500, step: 50, default: 3000 },
    { key: "seaLevelTempC", label: "Temperature at sea level (degrees C)", min: -10, max: 40, step: 1, default: 20 },
  ],
  // The environmental lapse rate, 6.5 degrees per kilometre, which is the world
  // average through the troposphere, together with the standard atmosphere's
  // pressure curve. Where the falling temperature crosses zero is the freezing
  // level, and a forecaster reports it every day in winter because it decides
  // which towns get rain and which get snow. Mount Whitney, the highest point
  // in the contiguous United States, is 4 421 m.
  measure: (v) => {
    const kPa = 101.325 * Math.pow(1 - 2.25577e-5 * v.altitudeM, 5.25588);
    return {
      temperatureUpThereC: v.seaLevelTempC - 6.5 * (v.altitudeM / 1000),
      degreesColderThanSeaLevel: 6.5 * (v.altitudeM / 1000),
      freezingLevelM: (v.seaLevelTempC / 6.5) * 1000,
      pressureKPa: kPa,
      oxygenPerBreathComparedWithSeaLevelPct: (kPa / 101.325) * 100,
      temperatureOnTopOfMountWhitneyC: v.seaLevelTempC - 6.5 * 4.421,
    };
  },
  plot: {
    x: "altitudeM", y: "temperatureUpThereC",
    xLabel: "Altitude (m)", yLabel: "Air temperature (degrees C)",
  },
  /*
   * The thermometer you carry up is the whole experiment, so it is what is
   * drawn. The tube reads -30 to 45 degrees, and the column falls 6.5 degrees
   * for every kilometre climbed: 20 degrees at the beach is 0.7 on the summit
   * of Mount Whitney at 4 421 m. The threshold is the freezing level, and it is
   * the one a forecaster reports every winter morning, because it decides which
   * towns get rain and which get snow — cross it and the liquid goes ice-blue
   * and stops moving.
   */
  drive: ({ f }) => {
    const c = f.temperatureUpThereC;
    const freezing = c <= 0;
    return {
      level: Math.max(0.02, Math.min(1, (c + 30) / 75)),
      color: freezing ? "#8fc4e8" : c > 25 ? "#c0392b" : "#c96a4b",
      precipitate: freezing ? 0.6 : 0,
      glow: freezing ? 0.5 : 0,
      rate: freezing ? 0 : 0.2 + c / 40,
    };
  },
};

/* D5.4 — Albedo. */
const WHAT_THE_GROUND_SENDS_BACK: ArchetypeSpec = {
  id: "g6d5-what-the-ground-sends-back",
  title: "What the Ground Sends Back",
  tagline: "Sunlight that bounces straight off warms nothing. Six surfaces, six very different bills.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-6", "MS-ESS3-5"] },
  learningGoals: [
    "Rank surfaces by albedo and calculate the energy each one absorbs.",
    "Explain the ice-albedo feedback: melting bright ice uncovers dark water, which absorbs far more.",
  ],
  misconceptions: [
    "All sunlight that lands on Earth is absorbed",
    "Colour has nothing to do with how warm a surface gets",
  ],
  categories: [
    { id: "bright", name: "Sends back more than a third", hint: "so pale it is uncomfortable to look at" },
    { id: "middling", name: "Sends back a tenth to a third", hint: "ordinary land colours" },
    { id: "dark", name: "Sends back less than a tenth", hint: "almost everything is absorbed" },
  ],
  specimens: [
    { id: "snowice", name: "Snow-covered sea ice", category: "bright",
      because: "Albedo 0.85. Of 700 W/m2 arriving at noon it keeps only 105. Melt it and you uncover ocean at albedo 0.06, which keeps 658 instead: six times the heating from the same Sun. That is the ice-albedo feedback.",
      art: { art: "habitat", which: "arctic" } },
    { id: "sand", name: "Pale desert sand", category: "bright",
      because: "Albedo 0.40. It reflects 280 of those 700 W/m2 and absorbs 420. Deserts still get scorching because nothing there evaporates, so all the absorbed energy goes into heating rather than into changing water to vapour.",
      art: { art: "habitat", which: "desert" } },
    { id: "grass", name: "Dry grassland", category: "middling",
      because: "Albedo 0.25, absorbing 525 W/m2. Earth's whole-planet albedo is 0.30 once clouds are counted, so a dry meadow is close to the planetary average.",
      art: { art: "habitat", which: "meadow" } },
    { id: "tundra", name: "Tundra with the snow gone", category: "middling",
      because: "Albedo 0.20, absorbing 560 W/m2. The same ground in April, still under snow, would be near 0.80. One surface, two albedos, and the season decides.",
      art: { art: "habitat", which: "tundra" } },
    { id: "conifer", name: "Conifer forest", category: "dark",
      because: "Albedo 0.09, absorbing 637 W/m2. Needles catch light that a smooth surface would bounce away, so a snowy forest is far darker, and warmer, than a snowy field.",
      art: { art: "habitat", which: "forest" } },
    { id: "ocean", name: "Open ocean with the Sun high", category: "dark",
      because: "Albedo 0.06, absorbing 658 W/m2 — the darkest surface on the planet. Late in the day, with the Sun low, the same water turns mirror-bright and its albedo climbs past 0.30.",
      art: { art: "habitat", which: "ocean" } },
  ],
};

/* D5.5 — Day, night and the combined pattern. */
const THE_AFTERNOON_LAG: ArchetypeSpec = {
  id: "g6d5-the-afternoon-lag",
  title: "The Hottest Hour Is Not Noon",
  tagline: "Follow one patch of ground round the clock and watch it fall behind the Sun.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-PS3-3"] },
  learningGoals: [
    "Explain the daily temperature cycle as a running balance between sunlight in and infrared out.",
    "Account for the lag that puts the daily maximum in mid-afternoon and the minimum at sunrise.",
  ],
  misconceptions: [
    "It is hottest at noon because that is when the Sun is strongest",
    "The ground stops radiating heat once the Sun goes down",
  ],
  specimens: [{ id: "ground", name: "One square metre of desert floor", art: { art: "sphere", color: "#cbb894", radius: 0.46 } }],
  stages: [
    { name: "Just before sunrise, 06:00", at: 0,
      caption: "The coldest moment of the whole day, 8 degrees. The ground has radiated all night with nothing arriving, and it keeps cooling right up until the Sun clears the horizon." },
    { name: "Mid-morning, 09:00", at: 0.2,
      caption: "Sun 30 degrees up, about 400 W/m2 landing. Incoming now beats outgoing, so the surface warms and passes heat to the air above it: roughly 2 degrees an hour." },
    { name: "Solar noon, 12:00", at: 0.4,
      caption: "The Sun is highest and delivers most, near 700 W/m2. This is not the hottest moment: the ground is still taking in more than it gives out, so the temperature is still rising." },
    { name: "Mid-afternoon, 15:30", at: 0.6,
      caption: "The warmest moment, 30 degrees. Sunlight has just fallen to match the infrared going out. After this, losses win. That three-and-a-half hour lag is the answer to why noon is not the peak." },
    { name: "Evening, 21:00", at: 0.8,
      caption: "The Sun is down and the ground, at 20 degrees, radiates about 400 W/m2 of infrared straight up. On a clear, dry, still night a surface can shed 10 degrees in four hours." },
    { name: "The small hours, 03:00", at: 1,
      caption: "Still falling. Cloud would return half that infrared and hold the drop to a few degrees; a dry desert sky returns almost none. The Mojave swings 20 degrees between afternoon and dawn, coastal San Francisco about 6." },
  ],
  /*
   * The ground goes round the clock, and it is the lag that is drawn. Sunlight
   * peaks at solar noon, two fifths of the way along the rail, but the surface
   * keeps warming for another three and a half hours because incoming still
   * beats outgoing — so the brightest moment and the hottest moment are visibly
   * not the same moment. The glow is the sunlight arriving and the colour is the
   * ground's own temperature: 8 degrees before dawn, 30 in mid-afternoon, and
   * still falling at three in the morning.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const sun = Math.max(0, Math.cos((u - 0.4) * Math.PI * 1.6));
    const tempC = 19 + 11 * Math.sin((u - 0.75) * Math.PI * 2);
    return {
      glow: sun,
      color: tempC > 26 ? "#e0722c" : tempC > 18 ? "#cbb894" : tempC > 12 ? "#9fa4b0" : "#6b7a90",
      scale: 0.9 + sun * 0.22,
      rate: 0.2 + Math.max(0, tempC - 8) / 10,
    };
  },
};

export const g6d5SpreadThin = buildSim(SPREAD_THIN);
export const g6d5SandAndSea = buildSim(SAND_AND_SEA);
export const g6d5SixAndAHalfPerKilometre = buildSim(SIX_AND_A_HALF_PER_KILOMETRE);
export const g6d5WhatTheGroundSendsBack = buildSim(WHAT_THE_GROUND_SENDS_BACK);
export const g6d5TheAfternoonLag = buildSim(THE_AFTERNOON_LAG);
