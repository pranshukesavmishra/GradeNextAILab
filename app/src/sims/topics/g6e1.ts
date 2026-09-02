import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E1 — Weather versus climate.
 *
 * Five simulations, one per subtopic:
 *
 *   E1.1  g6e1-today-or-always      weather versus climate            (sort)
 *   E1.2  g6e1-thirty-years         building climate from weather     (investigate)
 *   E1.3  g6e1-reading-a-climograph reading climate graphs            (process)
 *   E1.4  g6e1-belts-on-the-map     reading climate maps              (explore)
 *   E1.5  g6e1-which-zone           climate zones                     (sort)
 *
 * The quantitative spine is E1.2: climate is an average, and an average of a
 * noisy quantity has an uncertainty of sigma over root n. That single formula
 * is why the World Meteorological Organization asks for thirty years of record
 * before it will call anything a normal.
 */

/* E1.1 — Weather versus climate. */
const TODAY_OR_ALWAYS: ArchetypeSpec = {
  id: "g6e1-today-or-always",
  title: "Today, or Always?",
  tagline: "Six statements about the air. Which describe one day, and which describe decades?",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Distinguish a statement about weather from a statement about climate.",
    "Explain that climate is the long-run average of the weather at a place.",
  ],
  misconceptions: ["A cold week disproves a warming climate"],
  categories: [
    { id: "weather", name: "Weather", hint: "the air right now, or this week" },
    { id: "climate", name: "Climate", hint: "the long-run pattern, thirty years or more" },
  ],
  specimens: [
    { id: "hail", name: "Hail fell for twenty minutes this afternoon", category: "weather",
      because: "A single event you could watch through a window. Weather is measured in minutes and hours; it says nothing about the next decade.",
      art: { art: "sphere", color: "#dfe9f2", radius: 0.34 } },
    { id: "cairo", name: "Cairo averages about 25 mm of rain a year", category: "climate",
      because: "An average built from decades of daily gauge readings. Cairo still has wet days; the average is what tells you how rare they are.",
      art: { art: "glassware", which: "testTube", level: 0.04, color: "#7fb4d8" } },
    { id: "drop", name: "It is three degrees colder than yesterday", category: "weather",
      because: "A difference between two days. Day-to-day swings of five or ten degrees are ordinary in mid-latitudes and average out to nothing over thirty years.",
      art: { art: "sphere", color: "#8fb8d8", radius: 0.3 } },
    { id: "rome", name: "July is Rome's warmest month, averaging about 24 degrees", category: "climate",
      because: "The word averaging gives it away. This number comes from thirty Julys, not from one.",
      art: { art: "sphere", color: "#f6c453", radius: 0.42, glow: 0.6 } },
    { id: "storm", name: "A storm is forecast to make landfall on Thursday", category: "weather",
      because: "A forecast of one event a few days out. Beyond about ten days the atmosphere is unpredictable, which is exactly why climate is described as an average instead.",
      art: { art: "sphere", color: "#7e8ba3", radius: 0.4 } },
    { id: "tropics", name: "The tropics are warm all year because the Sun stays nearly overhead", category: "climate",
      because: "A permanent feature of the planet's geometry, not of one Tuesday. Every month in Singapore averages about 27 degrees, year after year.",
      art: { art: "planet", color: "#3f7fbf", atmosphere: "#bcd9f0" } },
  ],
};

/* E1.2 — Building climate from weather data. */
const THIRTY_YEARS: ArchetypeSpec = {
  id: "g6e1-thirty-years",
  title: "Thirty Years of Julys",
  tagline: "One July tells you almost nothing. Stack enough of them and a climate appears.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"], ccssMath: ["6.SP.B.5"] },
  learningGoals: [
    "Explain why a climate value is an average taken over many years of weather.",
    "Predict how the reliability of an average improves as more years are added.",
  ],
  misconceptions: ["A few unusual years are enough to establish a climate"],
  specimens: [{ id: "gauge", name: "Station record", art: { art: "glassware", which: "beaker", level: 0.45, color: "#7fb4d8" } }],
  variables: [
    { key: "years", label: "Years of record", min: 1, max: 60, step: 1, default: 30 },
    { key: "swing", label: "Year-to-year swing in the July mean (degrees)", min: 0.4, max: 3, step: 0.1, default: 1.2 },
  ],
  // The standard error of a mean: sigma over root n. With a typical
  // mid-latitude July-to-July spread of 1.2 degrees, one year pins the mean to
  // no better than 1.2 degrees, thirty years to 0.22, and getting to half of
  // that would take 120 years. Thirty is the World Meteorological
  // Organization's normal because it is where the curve stops paying.
  measure: (v) => ({
    dailyReadings: Math.round(v.years * 365.25),
    uncertaintyC: v.swing / Math.sqrt(v.years),
    yearsToHalveTheError: v.years * 4,
  }),
  plot: { x: "years", y: "uncertaintyC", xLabel: "Years of record", yLabel: "Uncertainty in the mean (degrees)" },
};

/* E1.3 — Reading climate graphs. */
const READING_A_CLIMOGRAPH: ArchetypeSpec = {
  id: "g6e1-reading-a-climograph",
  title: "Reading a Climograph",
  tagline: "Two graphs share one frame. Work through Rome's, month by month.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"], ccssMath: ["6.SP.B.4"] },
  learningGoals: [
    "Read temperature and precipitation for a named month off a climograph.",
    "Use the annual range and the seasonal rainfall pattern to name a climate.",
  ],
  misconceptions: ["The bars and the line on a climograph share one scale"],
  specimens: [{ id: "gauge", name: "Rome, 42 degrees north", art: { art: "glassware", which: "beaker", level: 0.32, color: "#7fb4d8" } }],
  stages: [
    { name: "Two graphs", at: 0,
      caption: "Bars are rainfall in millimetres, read on the right axis. The line is mean temperature in degrees, read on the left. Twelve of each, January to December." },
    { name: "Warmest month", at: 0.2,
      caption: "Follow the line to its peak: July, about 24 degrees. That is an average of every July day, not the hottest afternoon." },
    { name: "Coldest month", at: 0.4,
      caption: "The line bottoms out in January at about 8 degrees. Annual range = 24 - 8 = 16 degrees, mild for 42 degrees north because the sea is 25 km away." },
    { name: "Total the bars", at: 0.6,
      caption: "Add the twelve bars: about 800 mm a year. London gets about 600 mm, Singapore about 2 340 mm." },
    { name: "When it falls", at: 0.8,
      caption: "The tallest bar is November, near 110 mm. The shortest is July, near 15 mm. Rome's rain arrives in winter and nearly stops in summer." },
    { name: "Name the zone", at: 1,
      caption: "Hot dry summer, mild wet winter: a Mediterranean climate, Koeppen Csa. The shape of the graph names the zone before you read the caption." },
  ],
};

/* E1.4 — Reading climate maps. */
const BELTS_ON_THE_MAP: ArchetypeSpec = {
  id: "g6e1-belts-on-the-map",
  title: "The Belts on the Map",
  tagline: "Climate maps repeat themselves round the world. Find out what draws the bands.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Locate the wet equatorial belt, the desert belts and the polar caps on a world climate map.",
    "Explain why latitude, distance from the sea and altitude all shift the colours on the map.",
  ],
  misconceptions: ["Places at the same latitude must have the same climate"],
  specimens: [
    {
      id: "globe", name: "World climate map", art: { art: "planet", color: "#3f7fbf", atmosphere: "#cfe3f5" },
      parts: [
        { id: "equator", name: "Wet equatorial belt", at: [0.02, 0.01],
          note: "Air rises where the Sun is most nearly overhead, cools and dumps its water. Over 2 000 mm a year at Manaus, Kinshasa and Singapore alike, all on the same band." },
        { id: "deserts", name: "Desert belts near 30 degrees", at: [0.33, -0.2],
          note: "The air that rose at the equator sinks here, warming and drying as it comes down. The Sahara, Arabia, the Kalahari and central Australia all sit on this line." },
        { id: "temperate", name: "Temperate belt, 40 to 60 degrees", at: [-0.31, -0.24],
          note: "Where the westerlies drive one weather system after another off the ocean. Four seasons, rain in every month, and the most changeable weather on Earth." },
        { id: "polar", name: "Polar caps", at: [0.05, -0.39],
          note: "No month averages above 10 degrees. Sunlight arrives at a glancing angle all year and half of it reflects straight off the snow." },
        { id: "coasts", name: "West coasts run warm", at: [0.38, 0.1],
          note: "Watch the isotherms bend poleward over the eastern Atlantic. The North Atlantic Drift keeps Bergen at 60 degrees north ice-free while Labrador, at the same latitude, freezes." },
        { id: "altitude", name: "Mountains cut through every belt", at: [-0.12, 0.36],
          note: "Air cools about 6.5 degrees for every kilometre climbed, so Quito sits on the equator at 2 850 m and averages about 14 degrees, not 27." },
      ],
    },
  ],
};

/* E1.5 — Climate zones. */
const WHICH_ZONE: ArchetypeSpec = {
  id: "g6e1-which-zone",
  title: "Which Zone Is This?",
  tagline: "Eight rain gauges, all drawn to the same scale, and eight places to name.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Assign a place to a climate zone from its temperature and rainfall figures.",
    "State the tests that separate tropical, dry, temperate and polar climates.",
  ],
  misconceptions: ["Antarctica is not a desert because deserts are hot"],
  categories: [
    { id: "tropical", name: "Tropical", hint: "every month above 18 degrees" },
    { id: "dry", name: "Dry", hint: "less rain arrives than could evaporate" },
    { id: "temperate", name: "Temperate", hint: "a real winter, but no month below -3 degrees" },
    { id: "polar", name: "Polar", hint: "no month above 10 degrees" },
  ],
  specimens: [
    { id: "singapore", name: "Singapore, 1 degree north", category: "tropical",
      because: "Every month averages about 27 degrees and every month is wet: about 2 340 mm a year. No month above 18 degrees is ever missed, so this is the purest tropical case, Koeppen Af.",
      art: { art: "glassware", which: "beaker", level: 0.9, color: "#3f9ad8" } },
    { id: "manaus", name: "Manaus, in the Amazon", category: "tropical",
      because: "About 27 degrees all year and roughly 2 300 mm of rain, though August is much drier than March. A dry season does not demote it: the temperature test still holds.",
      art: { art: "glassware", which: "flask", level: 0.88, color: "#3f9ad8" } },
    { id: "cairo", name: "Cairo, in the Nile valley", category: "dry",
      because: "About 25 mm of rain a year against summer afternoons near 35 degrees. Evaporation would remove many times that, so water leaves faster than it arrives.",
      art: { art: "glassware", which: "testTube", level: 0.01, color: "#f0a848" } },
    { id: "alice", name: "Alice Springs, central Australia", category: "dry",
      because: "About 285 mm a year, most of it in a few summer downpours. More rain than Cairo, but the heat raises the bar it must clear, and it does not clear it.",
      art: { art: "glassware", which: "beaker", level: 0.11, color: "#f0a848" } },
    { id: "rome", name: "Rome, 42 degrees north", category: "temperate",
      because: "About 800 mm a year with January near 8 degrees and July near 24. Mild enough that no month freezes, and the rain arrives in winter: Mediterranean, Koeppen Csa.",
      art: { art: "glassware", which: "flask", level: 0.31, color: "#7fb4d8" } },
    { id: "london", name: "London, 51 degrees north", category: "temperate",
      because: "About 600 mm spread evenly through the year, January near 5 degrees and July near 19. Farther north than Newfoundland, and warmer, because the westerlies arrive off a warm ocean.",
      art: { art: "glassware", which: "beaker", level: 0.23, color: "#7fb4d8" } },
    { id: "utqiagvik", name: "Utqiagvik, Alaska, 71 degrees north", category: "polar",
      because: "The warmest month averages about 5 degrees, so it fails the 10-degree test. Only about 115 mm of precipitation falls, but at these temperatures almost none of it evaporates.",
      art: { art: "glassware", which: "testTube", level: 0.04, color: "#cfe3f5" } },
    { id: "plateau", name: "The Antarctic plateau", category: "polar",
      because: "Around 20 mm a year, drier than the Sahara, and the warmest month averages about -32 degrees. Dryness is judged against what could evaporate, and at these temperatures that is almost nothing, so cold decides it: an ice-cap climate.",
      art: { art: "glassware", which: "beaker", level: 0.01, color: "#e6f0fa" } },
  ],
};

export const g6e1TodayOrAlways = buildSim(TODAY_OR_ALWAYS);
export const g6e1ThirtyYears = buildSim(THIRTY_YEARS);
export const g6e1ReadingAClimograph = buildSim(READING_A_CLIMOGRAPH);
export const g6e1BeltsOnTheMap = buildSim(BELTS_ON_THE_MAP);
export const g6e1WhichZone = buildSim(WHICH_ZONE);
