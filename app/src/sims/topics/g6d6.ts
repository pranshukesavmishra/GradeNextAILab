import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D6 — California's weather.
 *
 * Six simulations, one per subtopic:
 *
 *   D6.1  g6d6-twenty-degrees-apart        coastal versus inland     (compare)
 *   D6.2  g6d6-the-grey-lid                the marine layer and fog  (process)
 *   D6.3  g6d6-over-the-sierra             the rain shadow           (investigate)
 *   D6.4  g6d6-how-dry-is-dry              California's deserts      (sort)
 *   D6.5  g6d6-the-oceans-flywheel         the Pacific's influence   (investigate)
 *   D6.6  g6d6-one-parcel-across-california  putting it together     (trace)
 *
 * Every simulation follows the same air: a parcel leaving the California
 * Current at 17 degrees with a dew point of 12, crossing the coast, the Coast
 * Ranges, the Central Valley and the Sierra Nevada. D6.3 does the arithmetic on
 * that crossing and gets a lee side 11 degrees warmer and at 21 per cent
 * humidity, which is exactly the Owens Valley that D6.4 sorts as desert.
 */

/* D6.1 — Coastal versus inland temperature patterns. */
const TWENTY_DEGREES_APART: ArchetypeSpec = {
  id: "g6d6-twenty-degrees-apart",
  title: "Twenty Degrees, One Hundred Kilometres",
  tagline: "Same latitude, same July afternoon, same state. Fifteen degrees between them.",
  kind: "compare",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Compare the annual and daily temperature ranges of a coastal and an inland site.",
    "Explain the coastal pattern as the ocean holding its temperature steady all year.",
  ],
  misconceptions: [
    "Places at the same latitude have the same climate",
    "The coast is cooler because it is windier",
  ],
  specimens: [
    { id: "coast", name: "San Francisco, on the coast",
      because: "July high 20 C, January high 14 C: only 6 degrees between the warmest and coldest month, and 6 between day and night.",
      art: { art: "habitat", which: "ocean" } },
    { id: "valley", name: "Sacramento, 120 km inland",
      because: "July high 35 C, January high 13 C: 22 degrees across the year, and 19 between a July afternoon and the following dawn.",
      art: { art: "habitat", which: "meadow" } },
  ],
};

/* D6.2 — The marine layer and coastal fog. */
const THE_GREY_LID: ArchetypeSpec = {
  id: "g6d6-the-grey-lid",
  title: "The Grey Lid",
  tagline: "California's summer fog is made by cold water, and held down by warm air on top of it.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6"] },
  learningGoals: [
    "Explain advection fog as moist air cooled from below to its dew point.",
    "Describe how an inversion caps the marine layer and how inland heating draws it ashore.",
  ],
  misconceptions: [
    "Fog is a cloud that has fallen out of the sky",
    "Coastal fog means it is about to rain",
  ],
  specimens: [{ id: "layer", name: "The marine layer", art: { art: "habitat", which: "ocean" } }],
  stages: [
    { name: "Cold water is brought up", at: 0,
      caption: "North-west winds along the coast push surface water offshore, and water from 100 m down rises to replace it: 11 degrees in July, when the air above the open Pacific is 17." },
    { name: "The air is chilled from underneath", at: 0.2,
      caption: "Air at 17 degrees with a dew point of 12 is cooled by the sea it is crossing. Reach 12 degrees and it is saturated, and the cooling has nowhere left to go but into droplets." },
    { name: "Fog", at: 0.4,
      caption: "Droplets 10 to 20 micrometres across, hundreds in every cubic centimetre. Visibility falls under 1 km. Nothing has risen and nothing has cooled adiabatically: this fog was made by contact." },
    { name: "The lid goes on", at: 0.6,
      caption: "Air sinking out of the Pacific High sits on top, warmed by its own descent. Warm air over cold will not overturn, so the marine layer stops at 300 to 600 m and the fog cannot climb out of it." },
    { name: "The valley pulls", at: 0.8,
      caption: "The Central Valley reaches 38 degrees, its air rises and its surface pressure falls. The marine layer is dragged through the Golden Gate and the Carquinez Strait at 10 to 15 m/s every afternoon." },
    { name: "Burn-off, and the redwoods", at: 1,
      caption: "Inland, the morning sun warms the air past its dew point and the droplets evaporate; on the coast it can stay grey all day. Coast redwoods comb droplets from the fog and take roughly a third of their summer water from the drip." },
  ],
};

/* D6.3 — The Sierra Nevada and the rain shadow. */
const OVER_THE_SIERRA: ArchetypeSpec = {
  id: "g6d6-over-the-sierra",
  title: "Over the Sierra, and Down the Other Side",
  tagline: "The same air arrives on the east side warmer than it started, and far drier.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-ESS2-5"] },
  learningGoals: [
    "Find the cloud base from the gap between air temperature and dew point.",
    "Explain a rain shadow: air cools slowly while raining and warms quickly coming down.",
  ],
  misconceptions: [
    "Mountains block clouds like a wall",
    "Air that has crossed a mountain comes down at the temperature it went up at",
  ],
  specimens: [{ id: "range", name: "The Sierra Nevada in cross-section", art: { art: "landform", which: "terrain" } }],
  variables: [
    { key: "coastTempC", label: "Air temperature at the coast (degrees C)", min: 5, max: 30, step: 1, default: 15 },
    { key: "coastDewPointC", label: "Dew point at the coast (degrees C)", min: 0, max: 25, step: 1, default: 10 },
    { key: "summitHeightM", label: "Height of the crest (m)", min: 500, max: 4000, step: 100, default: 3000 },
  ],
  // Four textbook constants and nothing else. Unsaturated air cools 9.8 degrees
  // per kilometre as it rises and its dew point falls 1.8, so the two close at
  // 8 degrees per kilometre and the cloud base sits 125 m up for every degree
  // they start apart. Above the cloud base condensation releases latent heat and
  // the cooling slows to about 5 degrees per kilometre. Coming down the far
  // side there is no cloud left to evaporate, so it warms at the full 9.8 all
  // the way. Starting at 15 degrees with a dew point of 10 over a 3 000 m crest:
  // cloud base 625 m, summit -3 degrees, and the lee side back at sea level is
  // 26.4 degrees at 21 per cent humidity.
  measure: (v) => {
    const es = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
    const depressionC = Math.max(0, v.coastTempC - v.coastDewPointC);
    const cloudBaseM = 125 * depressionC;
    const dryRiseM = Math.min(cloudBaseM, v.summitHeightM);
    const wetRiseM = Math.max(0, v.summitHeightM - cloudBaseM);
    const cloudBaseTempC = v.coastTempC - 9.8 * (dryRiseM / 1000);
    const summitC = cloudBaseTempC - 5 * (wetRiseM / 1000);
    const summitDewC = wetRiseM > 0 ? summitC : v.coastDewPointC - 1.8 * (dryRiseM / 1000);
    const leewardC = summitC + 9.8 * (v.summitHeightM / 1000);
    const leewardDewC = summitDewC + 1.8 * (v.summitHeightM / 1000);
    return {
      cloudBaseHeightM: cloudBaseM,
      temperatureAtCloudBaseC: cloudBaseTempC,
      temperatureOnTheCrestC: summitC,
      temperatureOnTheLeeSideC: leewardC,
      warmerThanTheWindwardCoastC: leewardC - v.coastTempC,
      humidityOnTheLeeSidePct: (es(leewardDewC) / es(leewardC)) * 100,
    };
  },
  plot: {
    x: "summitHeightM", y: "temperatureOnTheLeeSideC",
    xLabel: "Height of the crest (m)", yLabel: "Temperature down the lee side (degrees C)",
  },
};

/* D6.4 — California's deserts. */
const HOW_DRY_IS_DRY: ArchetypeSpec = {
  id: "g6d6-how-dry-is-dry",
  title: "How Dry Is Dry",
  tagline: "Under 250 mm a year makes a desert. Two of these six are closer to that line than you think.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Classify places by annual precipitation using the 250 mm and 500 mm thresholds.",
    "Give the three reasons California has deserts: rain shadow, sinking air under the subtropical high, and a cold current offshore.",
  ],
  misconceptions: [
    "Deserts are defined by how hot they are",
    "California is dry everywhere because it is in the south-west",
  ],
  categories: [
    { id: "desert", name: "Desert: under 250 mm a year", hint: "less than a quarter of a metre of rain" },
    { id: "semiarid", name: "Semi-arid: 250 to 500 mm", hint: "dry, but it supports grassland and oaks" },
    { id: "wet", name: "Wet: over 500 mm", hint: "enough for real forest" },
  ],
  specimens: [
    { id: "deathvalley", name: "Death Valley", category: "desert",
      because: "About 60 mm a year. Pacific air has already crossed the Coast Ranges, the Sierra Nevada, the Argus Range and the Panamint Range, and warms 9.8 degrees per kilometre coming down the far side of each one. Four rain shadows stacked in a row.",
      art: { art: "habitat", which: "desert" } },
    { id: "barstow", name: "Barstow, in the Mojave", category: "desert",
      because: "About 110 mm. It sits behind the Transverse Ranges, and all summer it lies under the eastern side of the Pacific subtropical high, where air is sinking and warming and cloud cannot form.",
      art: { art: "habitat", which: "desert" } },
    { id: "bishop", name: "Bishop, in the Owens Valley", category: "desert",
      because: "About 130 mm, in the direct lee of the Sierra crest. Blue Canyon, 150 km away on the western slope at a similar height, collects 1 700 mm: thirteen times as much from the same storms.",
      art: { art: "habitat", which: "desert" } },
    { id: "losangeles", name: "Los Angeles", category: "semiarid",
      because: "About 370 mm, and nearly all of it between November and March. In summer the subtropical high sits overhead and months pass with no measurable rain at all.",
      art: { art: "habitat", which: "meadow" } },
    { id: "sacramento", name: "Sacramento", category: "semiarid",
      because: "About 470 mm. Winter fronts off the Pacific reach this far south dependably, which is what fills the valley's rivers; summer is still bone dry, because the storm track has gone north.",
      art: { art: "habitat", which: "meadow" } },
    { id: "eureka", name: "Eureka, on the north coast", category: "wet",
      because: "About 1 000 mm. It sits in the main North Pacific storm track with nothing between it and the ocean, and the fog on top of that keeps the redwoods behind it wet all summer.",
      art: { art: "habitat", which: "forest" } },
  ],
};

/* D6.5 — The Pacific's moderating influence. */
const THE_OCEANS_FLYWHEEL: ArchetypeSpec = {
  id: "g6d6-the-oceans-flywheel",
  title: "The Ocean's Flywheel",
  tagline: "Warming the sea by one degree takes eighty times the energy that warming the land does.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-PS3-4"] },
  learningGoals: [
    "Calculate the energy needed to warm a column of ocean and a column of soil by the same amount.",
    "Explain why sea surface temperature off California barely changes through the year.",
  ],
  misconceptions: [
    "The sea is cold because cold water sinks to the coast",
    "A body of water and a patch of land respond to summer at the same speed",
  ],
  specimens: [{ id: "column", name: "One square metre of sea, and of land", art: { art: "habitat", which: "ocean" } }],
  variables: [
    { key: "mixedLayerDepthM", label: "Depth the waves stir the sea to (m)", min: 10, max: 150, step: 5, default: 50 },
    { key: "soilDepthM", label: "Depth the season reaches into the soil (m)", min: 0.5, max: 5, step: 0.5, default: 2 },
    { key: "temperatureChangeK", label: "Warming wanted (degrees)", min: 0.5, max: 10, step: 0.5, default: 1 },
  ],
  // Q = m c dT for two columns one square metre across. Sea water: density
  // 1 025 kg/m3, specific heat 3 990 J/kg K, stirred by waves through a mixed
  // layer tens of metres deep. Dry soil: bulk density 1 600 kg/m3, specific heat
  // 800 J/kg K, and the seasonal temperature wave only penetrates a couple of
  // metres. Fifty metres of sea against two metres of soil is 204 MJ against
  // 2.6 MJ, a factor of eighty. Averaged over a summer day the sea surface
  // absorbs roughly 250 W/m2, so the ocean's degree takes nine and a half days
  // and the land's takes under three hours. That gap is the whole reason
  // San Francisco's sea stays between 11 and 15 degrees all year.
  measure: (v) => {
    const oceanJ = v.mixedLayerDepthM * 1025 * 3990 * v.temperatureChangeK;
    const landJ = v.soilDepthM * 1600 * 800 * v.temperatureChangeK;
    return {
      energyForTheSeaMJPerM2: oceanJ / 1e6,
      energyForTheLandMJPerM2: landJ / 1e6,
      seaNeedsThisManyTimesMore: oceanJ / landJ,
      daysOfSunshineToWarmTheSea: oceanJ / (250 * 86400),
      hoursOfSunshineToWarmTheLand: landJ / (250 * 3600),
    };
  },
  plot: {
    x: "mixedLayerDepthM", y: "energyForTheSeaMJPerM2",
    xLabel: "Depth the waves stir the sea to (m)", yLabel: "Energy needed (MJ per square metre)",
  },
};

/* D6.6 — Putting California's weather together. */
const ONE_PARCEL_ACROSS_CALIFORNIA: ArchetypeSpec = {
  id: "g6d6-one-parcel-across-california",
  title: "One Parcel, Coast to Nevada",
  tagline: "Follow a single lungful of Pacific air across the whole state and every rule shows up in order.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-ESS2-5"] },
  learningGoals: [
    "Assemble upwelling, the marine layer, valley heating and the rain shadow into one chain of cause and effect.",
    "Explain why almost all of California's precipitation falls between November and March.",
  ],
  misconceptions: [
    "California's regions have separate, unrelated weather",
    "The Sierra snowpack is separate from the state's water supply",
  ],
  stages: [
    { name: "Summer", at: 0,
      caption: "The Pacific High parks offshore at 1025 hPa, the storm track runs far to the north, and five months pass with almost no rain." },
    { name: "The daily pump", at: 0.25,
      caption: "The valley heats to 38 degrees, its air rises, its surface pressure drops, and marine air is dragged in through the Golden Gate every afternoon." },
    { name: "Autumn", at: 0.5,
      caption: "The High slides south, the jet stream follows it down, and the first Pacific fronts reach the north coast in October." },
    { name: "Winter", at: 0.75,
      caption: "Fronts and atmospheric rivers arrive one behind another. Nearly the whole year's precipitation falls between November and March." },
    { name: "Spring melt", at: 1,
      caption: "The snowpack built in those four months melts through spring and summer. California's water year is a delay line, and the Sierra is the reservoir." },
  ],
  route: [
    { at: [0.08, 0.56], name: "200 km offshore, over the California Current",
      note: "17 degrees, dew point 12, sitting on water at 11. North-west winds along the coast, bent by Earth's rotation, push surface water away from land and colder water rises to take its place. That upwelling is why the sea at this latitude is 11 degrees here and 26 off the Carolinas." },
    { at: [0.24, 0.50], name: "The coast at San Francisco",
      note: "Chilled from below to its dew point, so the lowest 400 m turns to fog, capped by air sinking out of the Pacific High and warmed by the descent. Warm over cold will not overturn, so the lid holds. July afternoon: 20 degrees here, 35 in Sacramento at the same moment." },
    { at: [0.40, 0.42], name: "Over the Coast Ranges, 600 m",
      note: "Lifted 600 m. In winter that is enough to wring out real rain on the western slopes; in summer it only thins the fog. Coming down the inland side it warms at 9.8 degrees per kilometre, which is exactly why the fog stops at the first ridge and does not reach the valley floor." },
    { at: [0.56, 0.50], name: "The Central Valley at Sacramento",
      note: "35 degrees in July, and 470 mm of rain a year, all of it in winter. The heat is not a spectator: the valley's rising air lowers the pressure at the surface, and that pressure difference is the pump pulling the marine layer through the Golden Gate every afternoon." },
    { at: [0.74, 0.30], name: "Up the west slope of the Sierra, to 3 000 m",
      note: "The main event. Air starting at 15 degrees with a dew point of 10 reaches its cloud base 625 m up and the crest at -3 degrees, raining or snowing the whole way. Blue Canyon, at 1 600 m, collects 1 700 mm a year, and the snowpack built here supplies about a third of California's water." },
    { at: [0.90, 0.50], name: "Down into the Owens Valley",
      note: "Descending 3 000 m warms this same air 29 degrees, from -3 to 26.4, and drops its relative humidity to 21 per cent. Bishop gets 130 mm a year. Nothing was taken from the parcel but its water, and the warmth it arrives with is the warmth the mountain crossing handed back." },
  ],
};

export const g6d6TwentyDegreesApart = buildSim(TWENTY_DEGREES_APART);
export const g6d6TheGreyLid = buildSim(THE_GREY_LID);
export const g6d6OverTheSierra = buildSim(OVER_THE_SIERRA);
export const g6d6HowDryIsDry = buildSim(HOW_DRY_IS_DRY);
export const g6d6TheOceansFlywheel = buildSim(THE_OCEANS_FLYWHEEL);
export const g6d6OneParcelAcrossCalifornia = buildSim(ONE_PARCEL_ACROSS_CALIFORNIA);
