import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D4 — Air masses and fronts.
 *
 * Six simulations, one per subtopic:
 *
 *   D4.1  g6d4-where-the-air-was-born     air masses and source regions (sort)
 *   D4.2  g6d4-sinking-or-rising          highs and lows                (compare)
 *   D4.3  g6d4-the-cold-front-passes      cold fronts                   (process)
 *   D4.4  g6d4-a-ramp-one-in-two-hundred  warm fronts                   (investigate)
 *   D4.5  g6d4-the-end-of-a-low           occluded and stationary       (explore)
 *   D4.6  g6d4-tracking-it-across-the-state  collecting data            (trace)
 *
 * One weather event runs through the last four: a Pacific low crossing northern
 * California, with a warm front whose surface slopes at one in two hundred and
 * a cold front behind it moving at 40 km/h. D4.4 works out how far ahead the
 * cloud appears, D4.6 measures the same front's speed from station reports, and
 * the two agree because they are the same front.
 */

/* D4.1 — Air masses and source regions. */
const WHERE_THE_AIR_WAS_BORN: ArchetypeSpec = {
  id: "g6d4-where-the-air-was-born",
  title: "Where the Air Was Born",
  tagline: "An air mass takes on the temperature and the moisture of wherever it sat still. Then it travels.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Explain that an air mass gets its properties from the surface it formed over.",
    "Tell continental from maritime air masses by how much water each carries.",
  ],
  misconceptions: [
    "Cold air is always dry and warm air is always wet",
    "Air masses form where the weather is happening",
  ],
  categories: [
    { id: "continental", name: "Formed over land", hint: "nothing beneath it to evaporate" },
    { id: "maritime", name: "Formed over ocean", hint: "sat over open water long enough to load up" },
  ],
  specimens: [
    { id: "cp", name: "Over the frozen plains of central Canada, in January", category: "continental",
      because: "Continental polar: near -30 degrees with a dew point of -35, which is 0.14 g of water in every kilogram of air. Snow-covered land gives it nothing to pick up, so it arrives brilliantly clear and painfully dry.",
      art: { art: "sphere", color: "#8fb6dc", radius: 0.42 } },
    { id: "ca", name: "Over the Arctic Ocean ice pack", category: "continental",
      because: "Continental arctic, the coldest of all: -45 degrees is normal. Sea ice seals the water away, so it behaves as if it formed over land. When it slides south it can drop Montana 30 degrees in a day.",
      art: { art: "sphere", color: "#c4dcf2", radius: 0.46 } },
    { id: "ct", name: "Over the deserts of northern Mexico, in July", category: "continental",
      because: "Continental tropical: 40 degrees with a dew point near -5, so a relative humidity of about 6 per cent. Blistering and bone dry, and it is what makes a heat wave in the Southwest.",
      art: { art: "sphere", color: "#e0a25c", radius: 0.42 } },
    { id: "mp", name: "Over the North Pacific, west of Oregon", category: "maritime",
      because: "Maritime polar: about 10 degrees with a dew point of 8, cool and close to saturated. It is this air, lifted over the coast ranges, that brings California most of its winter rain.",
      art: { art: "sphere", color: "#5f9fc0", radius: 0.44 } },
    { id: "mtgulf", name: "Over the Gulf of Mexico, in summer", category: "maritime",
      because: "Maritime tropical: 27 degrees with a dew point of 24, which works out at 18.9 g of water per kilogram of air. That water is the fuel; lift this air and you get thunderstorms.",
      art: { art: "sphere", color: "#d8756b", radius: 0.46 } },
    { id: "mtpacific", name: "Over the subtropical Pacific, near Hawaii", category: "maritime",
      because: "Maritime tropical again: 22 degrees, dew point 19, about 14 g of water per kilogram. Steered onto California by the jet stream it becomes an atmospheric river, carrying vapour at many times the flow of the Mississippi.",
      art: { art: "sphere", color: "#c98a80", radius: 0.44 } },
  ],
};

/* D4.2 — High- and low-pressure systems. */
const SINKING_OR_RISING: ArchetypeSpec = {
  id: "g6d4-sinking-or-rising",
  title: "Sinking, or Rising",
  tagline: "One number on the map decides whether you get a picnic or a soaking.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6"] },
  learningGoals: [
    "Link high pressure to sinking, drying air and low pressure to rising, cooling air.",
    "Explain why isobars drawn close together mean strong wind.",
  ],
  misconceptions: [
    "Low pressure means there is less air, so it must be calm",
    "Wind blows straight from high pressure to low pressure",
  ],
  specimens: [
    { id: "high", name: "High, 1030 hPa",
      because: "Air sinks and warms, so cloud evaporates. Winds turn out of it clockwise. Clear, calm, and frosty by morning.",
      art: { art: "sphere", color: "#f2d98c", radius: 0.44, glow: 0.9 } },
    { id: "low", name: "Low, 990 hPa",
      because: "Air rises, cools 9.8 degrees per kilometre and condenses. Winds spiral in anticlockwise. Cloud, rain and gusts.",
      art: { art: "glassware", which: "flask", level: 0.6, color: "#5f8fbe", bubbles: 0.5 } },
  ],
  variables: [
    { key: "pressureDifferenceHPa", label: "Pressure difference across the map (hPa)", min: 2, max: 40, step: 1, default: 10 },
    { key: "distanceKm", label: "Distance it changes over (km)", min: 100, max: 2000, step: 50, default: 500 },
    { key: "latitudeDeg", label: "Latitude (degrees)", min: 10, max: 70, step: 1, default: 38 },
  ],
  // The pressure gradient force divided by the Coriolis parameter gives the
  // geostrophic wind, which is how a forecaster reads wind speed off the
  // spacing of the isobars: v = (1/rho f) dP/dx, with f = 2 Omega sin(latitude)
  // and Omega = 7.292e-5 rad/s. Ten hectopascals over 500 km at 38 degrees
  // north gives 18 m/s aloft. Friction over land drags the surface wind down to
  // roughly 60 per cent of that, and turns it across the isobars, which is why
  // the wind spirals in rather than circling forever.
  measure: (v) => {
    const gradientPaPerM = (v.pressureDifferenceHPa * 100) / (v.distanceKm * 1000);
    const coriolis = 2 * 7.292e-5 * Math.sin((v.latitudeDeg * Math.PI) / 180);
    const geostrophic = gradientPaPerM / (1.225 * coriolis);
    return {
      pressureGradientPaPerKm: gradientPaPerM * 1000,
      coriolisParameterPerSecond: coriolis,
      geostrophicWindMs: geostrophic,
      geostrophicWindKmh: geostrophic * 3.6,
      surfaceWindAfterFrictionMs: geostrophic * 0.6,
    };
  },
};

/* D4.3 — Cold fronts. */
const THE_COLD_FRONT_PASSES: ArchetypeSpec = {
  id: "g6d4-the-cold-front-passes",
  title: "Half an Hour of Weather",
  tagline: "A cold front takes a day to reach you and thirty minutes to go past.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Describe the order in which temperature, pressure, wind and cloud change as a cold front passes.",
    "Explain why a steep front produces a narrow band of very heavy rain.",
  ],
  misconceptions: [
    "A cold front is a wall of cold wind blowing at you",
    "The rain and the temperature drop arrive at the same moment",
  ],
  specimens: [{ id: "wedge", name: "The advancing cold air", art: { art: "sphere", color: "#3d6fbf", radius: 0.46 } }],
  stages: [
    { name: "Six hours ahead", at: 0,
      caption: "Warm and sticky: 26 degrees, dew point 21, pressure 1006 hPa and easing down. Wind from the south-west. A hard line of cumulus on the western horizon." },
    { name: "The front arrives", at: 0.2,
      caption: "A wedge of cold air sloping about 1 in 50 drives underneath and throws the warm air upward fast. Cumulonimbus builds to 12 km and flattens against the tropopause." },
    { name: "The squall", at: 0.4,
      caption: "Wind veers sharply to the north-west and gusts past 25 m/s. The heaviest rain of the whole event falls in roughly half an hour, in a band only 50 km wide." },
    { name: "Just behind the line", at: 0.6,
      caption: "Temperature drops 8 degrees within the hour, to 18. The dew point falls to 12, so the air turns crisp instead of clammy. The barometer stops falling and begins to climb." },
    { name: "Clearing", at: 0.8,
      caption: "1012 hPa and rising. Scattered fair-weather cumulus with flat bases, a washed sky, visibility better than 40 km. The cold air behind is unstable but dry." },
    { name: "A day later", at: 1,
      caption: "1018 hPa, cool and dry, the new air mass in charge. Moving at 40 km/h the front is now some 960 km away, over the Rockies, doing this to somebody else." },
  ],
};

/* D4.4 — Warm fronts. */
const A_RAMP_ONE_IN_TWO_HUNDRED: ArchetypeSpec = {
  id: "g6d4-a-ramp-one-in-two-hundred",
  title: "A Ramp, One in Two Hundred",
  tagline: "A warm front is a very gentle hill made of air, and you see its top a day before it reaches you.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Use the slope of a warm front to work out how high its surface is at a given distance ahead.",
    "Explain the cloud sequence of cirrus, cirrostratus, altostratus and nimbostratus as a picture of that slope.",
  ],
  misconceptions: [
    "Fronts are vertical walls between two air masses",
    "Cloud only appears once the front is nearly overhead",
  ],
  specimens: [{ id: "warmair", name: "Warm air riding up the ramp", art: { art: "sphere", color: "#d8756b", radius: 0.44 } }],
  variables: [
    { key: "distanceAheadKm", label: "Distance ahead of the surface front (km)", min: 20, max: 1500, step: 10, default: 800 },
    { key: "slopeDenominator", label: "Slope: 1 in this many", min: 100, max: 300, step: 10, default: 150 },
    { key: "frontSpeedKmh", label: "Speed of the front (km/h)", min: 10, max: 40, step: 1, default: 20 },
  ],
  // Pure geometry, then the standard atmosphere. A slope of 1 in 150 puts the
  // frontal surface 5 333 m up at 800 km ahead, and the environmental lapse
  // rate of 6.5 degrees per kilometre from a 15 degree surface makes that
  // -19.7 degrees: cold enough that the cloud there is ice, which is what
  // cirrostratus is. Working backwards, the first cirrus at 8 km appear
  // 8 x 150 = 1 200 km ahead, and steady rain, which needs the surface down
  // near 2 km, starts about 300 km ahead.
  measure: (v) => {
    const heightM = (v.distanceAheadKm * 1000) / v.slopeDenominator;
    return {
      frontalSurfaceHeightM: heightM,
      airTemperatureUpThereC: 15 - 6.5 * (heightM / 1000),
      hoursBeforeItReachesYou: v.distanceAheadKm / v.frontSpeedKmh,
      firstCirrusAppearsKmAhead: 8 * v.slopeDenominator,
      steadyRainBeginsKmAhead: 2 * v.slopeDenominator,
    };
  },
  plot: {
    x: "distanceAheadKm", y: "frontalSurfaceHeightM",
    xLabel: "Distance ahead of the surface front (km)", yLabel: "Height of the frontal surface (m)",
  },
};

/* D4.5 — Occluded and stationary fronts. */
const THE_END_OF_A_LOW: ArchetypeSpec = {
  id: "g6d4-the-end-of-a-low",
  title: "The End of a Low",
  tagline: "The cold front travels twice as fast as the warm one. Sooner or later it catches up.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Read the four front symbols and say what each one means about the air on either side.",
    "Explain an occlusion as the cold front catching the warm front and lifting the warm air off the ground.",
  ],
  misconceptions: [
    "An occluded front is a third kind of air mass",
    "A stationary front means calm weather",
  ],
  specimens: [
    {
      id: "low", name: "A low in its last day",
      art: { art: "planet", color: "#5a7fb8", atmosphere: "#dfeaf4" },
      parts: [
        { id: "warm", name: "Warm front, ahead", at: [0.40, 0.14],
          note: "Red half-circles, bulging the way it travels. Warm air climbs a ramp sloping about 1 in 150 over the colder air in front, which is why the cloud thickens for a day beforehand and the rain when it comes is steady, light and hundreds of kilometres wide. Speed, typically 20 km/h." },
        { id: "cold", name: "Cold front, behind", at: [-0.36, 0.24],
          note: "Blue triangles, pointing the way it travels. It slopes far more steeply, about 1 in 50, and moves at 40 km/h. Twice the speed of the warm front ahead of it means it is always closing the gap." },
        { id: "sector", name: "The warm sector", at: [0.06, 0.38],
          note: "The wedge of mild, humid air caught between the two fronts. It narrows every hour. On day one of a low it may be 800 km across; by day three there is nothing of it left at ground level." },
        { id: "occluded", name: "The occluded front", at: [-0.02, -0.32],
          note: "Purple triangles and half-circles on the same side of the line, because both fronts are now the same line. The cold front has overtaken the warm one and prised the warm air clear of the ground. At the surface it is cold air meeting cold air, with the warm air stranded above and still raining." },
        { id: "triple", name: "The triple point", at: [0.30, -0.16],
          note: "Where occluded, warm and cold fronts all meet: the last place the warm air still touches the ground. It slides outward along the fronts as the occlusion grows. Once occlusion is complete the low has no warm air left to lift, and it fills in and dies." },
        { id: "stationary", name: "A stationary front, trailing south", at: [-0.42, -0.12],
          note: "Blue triangles on one side of the line and red half-circles on the other, pointing opposite ways: neither air mass is pushing the other back. The front barely moves, so the same band of grey drizzle can sit over the same town for three days." },
      ],
    },
  ],
};

/* D4.6 — Collecting data to track a front. */
const TRACKING_IT_ACROSS_THE_STATE: ArchetypeSpec = {
  id: "g6d4-tracking-it-across-the-state",
  title: "Tracking It Across the State",
  tagline: "Two stations and two clock times are enough to forecast the third.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Identify a front's passage in a station's record of pressure, wind and temperature.",
    "Calculate the speed of a front from two stations and use it to forecast a third.",
  ],
  misconceptions: [
    "You need a satellite picture to know where a front is",
    "A single station's readings can tell you which way the weather is moving",
  ],
  stages: [
    { name: "First report", at: 0, caption: "Bodega Bay, midnight: pressure bottoms out at 1001 hPa." },
    { name: "Second report", at: 0.25, caption: "Santa Rosa, 40 km inland, 01:00. The same signature, one hour later." },
    { name: "The speed", at: 0.5, caption: "40 km in 1 hour. The front is moving east at 40 km/h." },
    { name: "The forecast", at: 0.75, caption: "Sacramento is 155 km from the coast, so 155 divided by 40 is 3.9 hours: about 03:52." },
    { name: "The check", at: 1, caption: "Sacramento's wind veered at 03:50. The method works, so Tahoe gets a warning for 07:30." },
  ],
  route: [
    { at: [0.10, 0.62], name: "Bodega Bay, 0 km, 00:00",
      note: "The signature of a cold front at a single station: pressure falling all evening, reaching 1001 hPa at midnight and then turning upward; wind swinging from south-west to north-west within ten minutes; temperature 16 degrees dropping to 9 within the hour. Write down the time of the pressure minimum. That is your marker." },
    { at: [0.26, 0.56], name: "Santa Rosa, 40 km, 01:00",
      note: "The identical pattern, an hour later: 1001 hPa at 01:00, wind veering, 8 degrees lost. One event, two stations, two times. Now you have everything you need." },
    { at: [0.44, 0.50], name: "Doing the arithmetic",
      note: "40 km in 1.0 hours is 40 km/h, moving east. A cold front at 40 km/h is ordinary; anything above 60 is fast. Notice that no single station could have told you this. Direction and speed come only from comparing stations." },
    { at: [0.58, 0.46], name: "Sacramento, 155 km, forecast 03:52",
      note: "155 divided by 40 is 3.88 hours, so 03:52. The observed pressure minimum came at 03:50, two minutes early. The forecast is good because the front kept its speed, which fronts usually do for a few hours at a time." },
    { at: [0.74, 0.40], name: "Placerville, 225 km, 05:37",
      note: "225 divided by 40 is 5.6 hours. Here the ground is 600 m higher, so the same front lifts the air further and the rain is heavier: 18 mm against Sacramento's 7 mm. Terrain changes what a front delivers, not when it arrives." },
    { at: [0.90, 0.32], name: "South Lake Tahoe, 300 km, 07:30",
      note: "300 divided by 40 is 7.5 hours. At 1 900 m the air behind the front is below zero, so the same system that gave Sacramento rain gives Tahoe 20 cm of snow. Send the warning eight hours in advance, which is the whole point of writing the times down." },
  ],
};

export const g6d4WhereTheAirWasBorn = buildSim(WHERE_THE_AIR_WAS_BORN);
export const g6d4SinkingOrRising = buildSim(SINKING_OR_RISING);
export const g6d4TheColdFrontPasses = buildSim(THE_COLD_FRONT_PASSES);
export const g6d4ARampOneInTwoHundred = buildSim(A_RAMP_ONE_IN_TWO_HUNDRED);
export const g6d4TheEndOfALow = buildSim(THE_END_OF_A_LOW);
export const g6d4TrackingItAcrossTheState = buildSim(TRACKING_IT_ACROSS_THE_STATE);
