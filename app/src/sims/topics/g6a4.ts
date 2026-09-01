import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit A · Topic A4 — Earth as a system.
 *
 * Six simulations, one per subtopic, and six different archetypes:
 *
 *   A4.1  g6a4-inside-the-geosphere   the geosphere            (explore)
 *   A4.2  g6a4-where-is-the-water     the hydrosphere          (sort)
 *   A4.3  g6a4-thinner-and-thinner    the atmosphere           (investigate)
 *   A4.4  g6a4-thin-green-film        the biosphere            (compare)
 *   A4.5  g6a4-one-molecule-four      interactions among them  (trace)
 *   A4.6  g6a4-eruption-model         modelling an event       (process)
 *
 * Every figure is a measured one: layer depths from seismology, the water
 * budget from the USGS survey, the atmosphere from the International Standard
 * Atmosphere, productivity from Whittaker's survey, and the 1991 Pinatubo
 * eruption from the record it left in the global temperature series.
 */

/* A4.1 — The geosphere. */
const GEOSPHERE: ArchetypeSpec = {
  id: "g6a4-inside-the-geosphere",
  title: "Inside the Geosphere",
  tagline: "Cut the planet open: skin, deep rock, liquid metal, solid centre.",
  kind: "explore",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Name the layers of the solid Earth and give their thicknesses.",
    "Explain that the geosphere is nearly all rock we have never seen.",
  ],
  misconceptions: ["The crust is a large part of the Earth"],
  specimens: [
    {
      id: "earth", name: "Earth, radius 6 371 km", art: { art: "sphere", color: "#a5714a", radius: 0.5 },
      parts: [
        { id: "soil", name: "Soil", at: [-0.34, -0.34],
          note: "A skin usually less than 2 m deep, and it takes centuries to build. This is where geosphere, biosphere and hydrosphere all meet." },
        { id: "crust", name: "Crust", at: [0.02, -0.46],
          note: "5 to 10 km thick under the oceans, 30 to 70 km under mountains. Less than 1 per cent of the Earth's volume." },
        { id: "mantle", name: "Mantle", at: [0.34, -0.2],
          note: "2 890 km of hot solid rock, 84 per cent of the Earth's volume. It creeps a few centimetres a year, which is what moves the plates." },
        { id: "outer", name: "Outer core", at: [-0.3, 0.14],
          note: "2 260 km of liquid iron and nickel. Its swirling is what gives the planet a magnetic field." },
        { id: "inner", name: "Inner core", at: [0.03, 0.05],
          note: "A solid ball of iron 1 220 km in radius at about 5 400 degrees, as hot as the Sun's surface. Pressure keeps it solid." },
        { id: "deepest", name: "How far we have dug", at: [0.3, 0.3],
          note: "The deepest borehole reached 12.3 km, about one five-hundredth of the way to the centre. Everything deeper is known from earthquake waves." },
      ],
    },
  ],
};

/* A4.2 — The hydrosphere. */
const WHERE_IS_WATER: ArchetypeSpec = {
  id: "g6a4-where-is-the-water",
  title: "Where Is the Water?",
  tagline: "Earth is a water planet. Almost none of it is drinkable.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-4"] },
  learningGoals: [
    "Sort Earth's water stores into salt and fresh.",
    "State roughly how little of Earth's water is fresh and reachable.",
  ],
  misconceptions: ["Most of Earth's fresh water is in rivers and lakes"],
  categories: [
    { id: "salt", name: "Salt water", hint: "too salty to drink or to water crops" },
    { id: "fresh", name: "Fresh water", hint: "low in dissolved salt" },
  ],
  specimens: [
    { id: "ocean", name: "The oceans", category: "salt",
      because: "96.5 per cent of all the water on Earth, holding about 35 g of salt in every litre.",
      art: { art: "glassware", which: "beaker", level: 0.85 } },
    { id: "ice", name: "Ice caps and glaciers", category: "fresh",
      because: "1.74 per cent of all water, but 68.7 per cent of the fresh water. Frozen, so hard to use.",
      art: { art: "sphere", color: "#dfe9f2", radius: 0.5 } },
    { id: "ground", name: "Fresh groundwater", category: "fresh",
      because: "0.76 per cent of all water, and 30 per cent of the fresh. Most of the liquid fresh water is underground.",
      art: { art: "glassware", which: "testTube", level: 0.5 } },
    { id: "saline", name: "Saline groundwater and salt lakes", category: "salt",
      because: "About 0.94 per cent of all water. Deep water and inland seas can be saltier than the ocean.",
      art: { art: "glassware", which: "beaker", level: 0.5, precipitate: 0.45 } },
    { id: "rivers", name: "Rivers and lakes", category: "fresh",
      because: "0.013 per cent of all water: a hundredth of a per cent, and it is where nearly all our water comes from.",
      art: { art: "glassware", which: "flask", level: 0.32 } },
    { id: "vapour", name: "Water vapour in the air", category: "fresh",
      because: "Only 0.001 per cent at any moment, yet all of it is replaced about every nine days.",
      art: { art: "sphere", color: "#cfe0ee", radius: 0.4, glow: 0.5 } },
  ],
};

/* A4.3 — The atmosphere. */
const THINNER_AIR: ArchetypeSpec = {
  id: "g6a4-thinner-and-thinner",
  title: "Thinner and Thinner Air",
  tagline: "Climb, and watch the pressure and the temperature fall.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Describe how air pressure changes with height above the surface.",
    "Use the lapse rate to predict the temperature at a given altitude.",
  ],
  misconceptions: ["The atmosphere ends at a sharp edge"],
  specimens: [{ id: "air", name: "Column of air", art: { art: "sphere", color: "#8fc0ea", radius: 0.5, glow: 0.5 } }],
  variables: [
    { key: "altitude", label: "Height above sea level (m)", min: 0, max: 20000, step: 100, default: 0 },
  ],
  // The International Standard Atmosphere: a 6.5 K per km lapse rate and the
  // barometric formula up to the tropopause at 11 km, then constant
  // temperature with an exponential fall above it.
  measure: (v) => {
    const h = v.altitude;
    const pressure = h <= 11000
      ? 101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588)
      : 22.632 * Math.exp(-(h - 11000) / 6341.6);
    const temperature = h <= 11000 ? 15 - 0.0065 * h : -56.5;
    return {
      pressureKPa: pressure,
      temperatureC: temperature,
      oxygenPercentOfSeaLevel: (pressure / 101.325) * 100,
    };
  },
  plot: { x: "altitude", y: "pressureKPa", xLabel: "Height (m)", yLabel: "Air pressure (kPa)" },
};

/* A4.4 — The biosphere. */
const THIN_GREEN_FILM: ArchetypeSpec = {
  id: "g6a4-thin-green-film",
  title: "Where the Biosphere Is Thick",
  tagline: "Two square metres of Earth. One grows 24 times as much.",
  kind: "compare",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Compare how much new plant matter different places produce each year.",
    "Explain the biosphere as a thin, uneven layer that depends on water and light.",
  ],
  misconceptions: ["Life is spread evenly over the Earth's surface"],
  specimens: [
    { id: "forest", name: "One square metre of tropical rainforest",
      because: "About 2 200 g of new dry plant matter a year, standing on 45 kg of living material, fed by over 2 000 mm of rain.",
      art: { art: "cell", plant: true } },
    { id: "desert", name: "One square metre of hot desert",
      because: "About 90 g a year on 0.7 kg of living material. The same sunlight, under 250 mm of rain: water is the limit, not light.",
      art: { art: "sphere", color: "#d9c08a", radius: 0.5 } },
  ],
};

/* A4.5 — Interactions among Earth's four spheres. */
const ONE_MOLECULE: ArchetypeSpec = {
  id: "g6a4-one-molecule-four",
  title: "One Molecule, Four Spheres",
  tagline: "Follow a single water molecule out of the sea and all the way back.",
  kind: "trace",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-4"] },
  learningGoals: [
    "Trace water through the hydrosphere, atmosphere, geosphere and biosphere.",
    "Explain that the spheres interact by exchanging matter and energy.",
  ],
  misconceptions: ["The four spheres are separate places that do not mix"],
  stages: [
    { name: "Hydrosphere", at: 0, caption: "Starting point: the surface of a warm ocean." },
    { name: "Atmosphere", at: 0.2, caption: "Sunlight supplies the energy to evaporate it." },
    { name: "Geosphere", at: 0.45, caption: "Rain lands on rock and soaks into the ground." },
    { name: "Biosphere", at: 0.7, caption: "A root takes it up, and a leaf breathes it out again." },
    { name: "Back to the sea", at: 1, caption: "Rivers return it, and the whole loop starts again." },
  ],
  route: [
    { at: [0.1, 0.62], name: "Ocean surface",
      note: "Hydrosphere. The average molecule waits here about 3 200 years before its turn comes." },
    { at: [0.24, 0.26], name: "Evaporation",
      note: "Atmosphere. Solar energy breaks it free. Every gram that leaves takes 2 260 J with it." },
    { at: [0.42, 0.18], name: "Cloud and rainfall",
      note: "It stays airborne about nine days, then condenses and falls on a mountainside." },
    { at: [0.56, 0.55], name: "Soil and rock",
      note: "Geosphere. It soaks into soil and cracks. In deep groundwater it could stay for 10 000 years." },
    { at: [0.7, 0.34], name: "Into a tree",
      note: "Biosphere. A root draws it up, and within hours a leaf transpires it back out. A large oak moves 150 L on a summer day." },
    { at: [0.84, 0.24], name: "Atmosphere again",
      note: "Same molecule, second trip. Roughly a tenth of the rain over land came off plants rather than the sea." },
    { at: [0.92, 0.62], name: "River to the sea",
      note: "Gravity carries the rest downhill. The Sun lifts it, gravity returns it: those two run the whole cycle." },
  ],
};

/* A4.6 — Modelling an Earth-system event. */
const ERUPTION_MODEL: ArchetypeSpec = {
  id: "g6a4-eruption-model",
  title: "One Eruption, Every Sphere",
  tagline: "Pinatubo, 1991: follow one event as it crosses all four spheres.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Model a single event as a chain of effects across Earth's spheres.",
    "Use evidence to show that a geosphere event can change global temperature.",
  ],
  misconceptions: ["An event in one sphere stays in that sphere"],
  specimens: [{ id: "volcano", name: "Mount Pinatubo", art: { art: "sphere", color: "#e0722c", radius: 0.46, glow: 0.8 } }],
  stages: [
    { name: "Geosphere", at: 0,
      caption: "Magma rises through the crust and the mountain erupts on 15 June 1991." },
    { name: "Atmosphere", at: 0.2,
      caption: "About 20 million tonnes of sulfur dioxide are blasted 35 km up, into the stratosphere." },
    { name: "Sunlight cut", at: 0.4,
      caption: "The gas becomes a haze of sulfate droplets that reflects roughly 10 per cent of incoming sunlight." },
    { name: "Global cooling", at: 0.6,
      caption: "Average global surface temperature falls about 0.5 degrees, and stays low for two years." },
    { name: "Biosphere", at: 0.8,
      caption: "Cooler, dimmer summers slow crop growth, yet the scattered light reaches lower leaves and forests take up more carbon." },
    { name: "Hydrosphere", at: 1,
      caption: "Typhoon rain washes ash off the slopes as lahars. The haze settles out by 1993, and the ash leaves rich soil behind." },
  ],
};

export const g6a4InsideTheGeosphere = buildSim(GEOSPHERE);
export const g6a4WhereIsTheWater = buildSim(WHERE_IS_WATER);
export const g6a4ThinnerAndThinner = buildSim(THINNER_AIR);
export const g6a4ThinGreenFilm = buildSim(THIN_GREEN_FILM);
export const g6a4OneMoleculeFour = buildSim(ONE_MOLECULE);
export const g6a4EruptionModel = buildSim(ERUPTION_MODEL);
