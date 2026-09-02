import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E4 — Evidence for plate motion.
 *
 * Five simulations, one per subtopic:
 *
 *   E4.1  g7e4-put-it-back-together  matching coastlines and rock types  (assemble)
 *   E4.2  g7e4-could-it-have-swum    matching fossil distributions       (sort)
 *   E4.3  g7e4-stripes-and-ages      seafloor age and magnetic striping  (investigate)
 *   E4.4  g7e4-measured-by-satellite analysing plate motion data         (explore)
 *   E4.5  g7e4-opening-an-ocean      reconstructing a simplified history (process)
 *
 * The quantitative spine is the seafloor: distance from a ridge divided by the
 * half-spreading rate gives an age, and the Parsons and Sclater depth law,
 * 2 500 m plus 350 times the square root of the age in millions of years,
 * predicts how deep that seafloor lies. Both are checkable against any
 * bathymetric chart of the Atlantic.
 */

/* E4.1 — Fitting the continents back together on more than shape. */
const PUT_IT_BACK_TOGETHER: ArchetypeSpec = {
  id: "g7e4-put-it-back-together",
  title: "Put It Back Together",
  tagline: "The coastlines were only the hint. The rocks either side are the proof.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Cite matching rock types, mountain belts and glacial deposits as evidence that continents were joined.",
    "Explain why a coastline fit alone is weak evidence and a rock match is strong.",
  ],
  misconceptions: [
    "The continents fit because their coastlines were cut apart",
    "Wegener had no evidence beyond the shape of the Atlantic",
  ],
  specimens: [{
    id: "pangaea", name: "Pangaea, 250 million years ago",
    art: { art: "planet", color: "#8a6a44", atmosphere: "#cfe2f2" },
    parts: [
      { id: "fit", name: "Fit at the 900 m contour", at: [-0.5, -0.44],
        note: "Bullard's 1965 computer fit joined the continental shelves at the 900 m depth line, not the beaches. Gaps and overlaps average under 100 km across a 5 000 km join." },
      { id: "belt", name: "One mountain belt, two continents", at: [0.48, -0.4],
        note: "The Appalachians of Alabama, the mountains of Newfoundland, the Scottish Highlands and the Norwegian Caledonides are one chain, folded together about 470 million years ago." },
      { id: "cape", name: "Cape Fold Belt to Argentina", at: [0.5, 0.16],
        note: "The same Permian folding runs through the Cape Fold Belt of South Africa and the Sierra de la Ventana of Argentina, 6 000 km apart across open ocean." },
      { id: "craton", name: "Two-billion-year-old cores", at: [-0.55, 0.2],
        note: "The ancient craton of northeast Brazil and the West African craton are the same age, about 2 000 million years, and their internal structures line up when the Atlantic is closed." },
      { id: "tillite", name: "Glacial deposits at the equator", at: [0.02, 0.56],
        note: "Permo-Carboniferous tillites, 300 million years old, sit in South America, Africa, India, Australia and Antarctica. Their scratches point outward from a single ice centre that is now underwater." },
      { id: "coal", name: "Coal in Antarctica", at: [-0.12, -0.62],
        note: "Permian coal seams at 85 degrees south, made from swamp forest. No swamp grows there now, so either the climate moved or the continent did." },
    ],
  }],
};

/* E4.2 — Reading fossil distributions as evidence of a join. */
const COULD_IT_HAVE_SWUM: ArchetypeSpec = {
  id: "g7e4-could-it-have-swum",
  title: "Could It Have Crossed?",
  tagline: "A fossil on two continents only proves something if the animal could not have made the trip.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Distinguish fossils that are evidence of joined continents from fossils that are not.",
    "Explain why the same fossil on two continents needs an argument, not just a map pin.",
  ],
  misconceptions: [
    "Any fossil found on two continents proves they were joined",
    "Fossils only tell you the age of a rock",
  ],
  categories: [
    { id: "stuck", name: "Could not have crossed", hint: "so the land must have been joined" },
    { id: "mobile", name: "Could have crossed", hint: "it swims, flies or floats" },
  ],
  specimens: [
    { id: "mesosaurus", name: "Mesosaurus, 290 million years old", category: "stuck",
      because: "A one-metre freshwater reptile, found only in Brazil and southern Africa. It could not survive salt water, and no freshwater reptile crosses 5 000 km of ocean.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "glossopteris", name: "Glossopteris seed fern", category: "stuck",
      because: "Its seeds are several millimetres across, too heavy to blow far and they rot in sea water. The same leaves lie in coal on all five southern continents.",
      art: { art: "landform", which: "strata" } },
    { id: "lystrosaurus", name: "Lystrosaurus, 250 million years old", category: "stuck",
      because: "A land reptile the size of a pig, found in South Africa, India and Antarctica. It had no way of crossing an ocean and no reason to try.",
      art: { art: "sphere", color: "#cdbfa0", radius: 0.46 } },
    { id: "cynognathus", name: "Cynognathus, 240 million years old", category: "stuck",
      because: "A three-metre land predator known from South America and Africa only. Nothing that size swims an ocean, so the two coasts were once one plain.",
      art: { art: "sphere", color: "#8a7a5e", radius: 0.46 } },
    { id: "pterosaur", name: "Pterosaur wing bones", category: "mobile",
      because: "It flew. A flying animal found on two continents tells you nothing about whether they were joined.",
      art: { art: "sphere", color: "#dcd6c6", radius: 0.46 } },
    { id: "coconut", name: "Drift seed of a coastal palm", category: "mobile",
      because: "These seeds stay alive floating in sea water for months and are still washing up across whole oceans today.",
      art: { art: "sphere", color: "#7a4c22", radius: 0.46 } },
    { id: "ichthyosaur", name: "Ichthyosaur, a marine reptile", category: "mobile",
      because: "It lived in the open sea. Finding it on both sides of an ocean is exactly what you would expect either way.",
      art: { art: "sphere", color: "#4f7a92", radius: 0.46 } },
    { id: "diatoms", name: "Deep-sea ooze full of plankton", category: "mobile",
      because: "Plankton drift with the currents across whole ocean basins, so their spread maps water, not land.",
      art: { art: "glassware", which: "testTube", level: 0.6, color: "#dfe4d8", precipitate: 0.7 } },
  ],
};

/* E4.3 — The seafloor is a tape recorder, and it is dated. */
const STRIPES_AND_AGES: ArchetypeSpec = {
  id: "g7e4-stripes-and-ages",
  title: "Stripes and Ages",
  tagline: "Magnetic stripes match either side of every ridge, and they get older outward at a steady rate.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Calculate the age of ocean floor from its distance from the ridge and the spreading rate.",
    "Predict how deep old seafloor lies, using the square-root-of-age cooling law.",
  ],
  misconceptions: [
    "The ocean floor is the oldest part of Earth's surface",
    "Magnetic stripes are made of magnetic rock and normal seafloor is not",
  ],
  specimens: [{ id: "floor", name: "Magnetic stripes on the seafloor", art: { art: "landform", which: "seafloor" } }],
  variables: [
    { key: "distance", label: "Distance from the ridge crest (km)", min: 0, max: 2000, step: 10, default: 500 },
    { key: "halfRate", label: "Half-spreading rate (cm per year)", min: 0.5, max: 8, step: 0.1, default: 1.25 },
  ],
  // 1 km is 100 000 cm, so age in years is 100 000 d / r, and age in millions
  // of years is simply d / (10 r). The Mid-Atlantic Ridge spreads at about
  // 1.25 cm/yr on each side; the East Pacific Rise reaches 7.5. Depth follows
  // Parsons and Sclater: 2 500 m at the crest plus 350 m for the square root of
  // the age in millions of years, which fits the real Atlantic within a few
  // hundred metres out to about 70 Ma.
  measure: (v) => {
    const ageMa = v.distance / (10 * v.halfRate);
    return {
      ageMillionYears: ageMa,
      seafloorDepthM: 2500 + 350 * Math.sqrt(ageMa),
      fullSpreadingRateCmPerYear: 2 * v.halfRate,
      kmOfNewFloorPerMillionYears: 10 * v.halfRate,
      cmMovedInAnEightyYearLife: 80 * v.halfRate,
    };
  },
  plot: {
    x: "distance", y: "ageMillionYears",
    xLabel: "Distance from the ridge (km)", yLabel: "Age of the seafloor (million years)",
  },
  /**
   * Two things have to answer the sliders. Raise the spreading rate and each
   * polarity chron occupies more distance, so the stripe pattern is drawn
   * wider — that is the whole reason a fast ridge like the East Pacific Rise
   * has broad stripes and the slow Mid-Atlantic has narrow ones. Move out from
   * the ridge and the floor sinks, because cooling lithosphere contracts: the
   * panel drops through the frame by the depth the Parsons and Sclater law
   * predicts, 2 500 m at the crest and about 4 700 m at 40 million years.
   */
  drive: ({ v, f }) => ({
    scale: 0.7 + 0.5 * (v.halfRate / 8),
    offset: [0, Math.min(0.42, (f.seafloorDepthM - 2500) / 9000)],
  }),
};

/* E4.4 — Plate motion, measured directly. */
const MEASURED_BY_SATELLITE: ArchetypeSpec = {
  id: "g7e4-measured-by-satellite",
  title: "Measured by Satellite",
  tagline: "Six GPS stations, six velocities. The plates are not a theory any more; they are a reading.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Interpret GPS velocities as direct evidence that plates move and are rigid.",
    "Match a measured speed at a station to the type of boundary nearest to it.",
  ],
  misconceptions: [
    "Plate motion is inferred only from ancient rocks",
    "Every point on a plate moves at a different speed",
  ],
  specimens: [{
    id: "globe", name: "GPS velocity field",
    art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8cdf0" },
    parts: [
      { id: "hilo", name: "Hilo, Hawaii: 7 cm per year", at: [-0.5, -0.44],
        note: "The Pacific plate carries the whole island chain northwest at about 7 cm a year. Every station on the plate reads the same, which is what rigid means." },
      { id: "reykjavik", name: "Reykjavik, Iceland: 1.9 cm per year apart", at: [0.48, -0.4],
        note: "Iceland sits astride the Mid-Atlantic Ridge. Stations on the two halves separate at about 1.9 cm a year, matching the rate read off the magnetic stripes." },
      { id: "kathmandu", name: "Kathmandu, Nepal: 4.5 cm per year", at: [0.5, 0.16],
        note: "India drives into Asia at about 4.5 cm a year. Roughly 2 cm of that is absorbed across the Himalaya, which is why Everest is still growing." },
      { id: "parkfield", name: "Parkfield, California: 3.4 cm per year", at: [-0.55, 0.2],
        note: "The two sides of the San Andreas slide past each other at 3.4 cm a year. Where the fault is locked the ground bends instead, storing the motion up." },
      { id: "concepcion", name: "Concepcion, Chile: 6.6 cm per year", at: [0.02, 0.56],
        note: "The Nazca plate dives beneath South America at about 6.6 cm a year. In the 2010 earthquake the city jumped about 3 m west in three minutes." },
      { id: "bergen", name: "Bergen, Norway: nothing happening", at: [-0.12, -0.62],
        note: "A plate interior. Bergen travels 2.5 cm a year with the whole of Eurasia and never moves relative to Oslo. That is the control that shows deformation is at the edges." },
    ],
  }],
};

/* E4.5 — Winding the Atlantic backwards. */
const OPENING_AN_OCEAN: ArchetypeSpec = {
  id: "g7e4-opening-an-ocean",
  title: "Opening an Ocean",
  tagline: "Five thousand kilometres at two and a half centimetres a year. Do the division.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Reconstruct a simplified plate history from a present-day spreading rate.",
    "Check a reconstruction against an independent date, such as the age of the oldest seafloor.",
  ],
  misconceptions: [
    "Continents plough through the ocean floor",
    "The Atlantic has always been about this wide",
  ],
  specimens: [{ id: "ridge", name: "Mid-ocean ridge", art: { art: "landform", which: "rift" } }],
  stages: [
    { name: "250 Ma", at: 0,
      caption: "Pangaea: one supercontinent, one world ocean. You could walk from Nova Scotia to Morocco." },
    { name: "200 Ma", at: 0.2,
      caption: "Rifting begins between North America and Africa. Flood basalts spread over about 11 million square kilometres in less than a million years." },
    { name: "175 Ma", at: 0.4,
      caption: "A narrow, salty sea, much like the Red Sea today. New basalt floor appears down the middle for the first time." },
    { name: "100 Ma", at: 0.6,
      caption: "The South Atlantic unzips from the south. At 2.5 cm a year, 100 million years buys 2 500 km of ocean." },
    { name: "60 Ma", at: 0.8,
      caption: "The North Atlantic opens between Greenland and Europe, and the hotspot that becomes Iceland starts up." },
    { name: "Today", at: 1,
      caption: "About 5 000 km wide. At 2.5 cm a year that took 200 million years, and the oldest Atlantic seafloor is dated at 180 million years, which agrees." },
  ],
};

export const g7e4PutItBackTogether = buildSim(PUT_IT_BACK_TOGETHER);
export const g7e4CouldItHaveSwum = buildSim(COULD_IT_HAVE_SWUM);
export const g7e4StripesAndAges = buildSim(STRIPES_AND_AGES);
export const g7e4MeasuredBySatellite = buildSim(MEASURED_BY_SATELLITE);
export const g7e4OpeningAnOcean = buildSim(OPENING_AN_OCEAN);
