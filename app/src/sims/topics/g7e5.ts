import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E5 — Plate boundaries and the landforms they build.
 *
 * Five simulations, one per subtopic:
 *
 *   E5.1  g7e5-tearing-a-continent  divergent boundaries          (process)
 *   E5.2  g7e5-going-under          convergent boundaries         (explore)
 *   E5.3  g7e5-stuck-then-slipping  transform boundaries          (investigate)
 *   E5.4  g7e5-why-here             why hazards cluster           (trace)
 *   E5.5  g7e5-name-the-boundary    reading a plate-boundary map  (sort)
 *
 * The transform investigation carries the arithmetic for the whole topic: the
 * seismic moment of an earthquake is the shear modulus of crust, 30 GPa, times
 * the rupture area, times the slip, and the moment magnitude follows from it by
 * the standard Hanks and Kanamori formula. Set it to the 1906 San Andreas
 * rupture, 477 km by 12 km with about 4 m of slip, and it returns magnitude 7.8.
 */

/** Shear modulus of crustal rock, pascals. */
const SHEAR_MODULUS = 3.0e10;
/** Slip rate of the San Andreas fault, centimetres per year. */
const SAN_ANDREAS_CM_YR = 3.4;

/* E5.1 — Divergent: how an ocean starts. */
const TEARING_A_CONTINENT: ArchetypeSpec = {
  id: "g7e5-tearing-a-continent",
  title: "Tearing a Continent",
  tagline: "East Africa, the Red Sea and the Atlantic are the same event, photographed at three different ages.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Sequence the stages by which a continent rifts and becomes an ocean basin.",
    "Explain why new crust at a divergent boundary is basalt and why the ridge stands high.",
  ],
  misconceptions: [
    "New crust is squeezed up from below as solid rock",
    "Mid-ocean ridges are at the edges of oceans",
  ],
  specimens: [{ id: "ridge", name: "Divergent boundary", art: { art: "landform", which: "divergent" } }],
  stages: [
    { name: "Dome", at: 0,
      caption: "Hot mantle spreads out beneath the plate and lifts it into a dome about 1 000 km across. The stretched top begins to crack." },
    { name: "Continental rift", at: 0.2,
      caption: "The East African Rift, pulling apart at 0.6 to 0.7 cm a year. Blocks drop between normal faults; Lake Tanganyika's floor is 1 470 m down." },
    { name: "Flooded rift", at: 0.4,
      caption: "The Red Sea, opening about 1.6 cm a year and now 300 km wide, with fresh basalt appearing along its centre line." },
    { name: "Young ocean", at: 0.6,
      caption: "A true mid-ocean ridge. Basalt erupts under 2 500 m of water at about 1 200 degrees C and chills instantly into pillow lava." },
    { name: "Wide ocean", at: 0.8,
      caption: "The Atlantic: 5 000 km across, still widening 2.5 cm a year, with the ridge running down the exact middle of it." },
    { name: "The global total", at: 1,
      caption: "65 000 km of ridge, averaging 5 cm a year, makes about 3 square kilometres of new seafloor every year. That is why no ocean floor is older than 180 million years." },
  ],
};

/* E5.2 — Convergent: reading a subduction zone in cross-section. */
const GOING_UNDER: ArchetypeSpec = {
  id: "g7e5-going-under",
  title: "Going Under",
  tagline: "One slab of cold ocean floor explains the trench, the volcanoes and the deep earthquakes at once.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Label the parts of a subduction zone and say what each one is made of.",
    "Explain why the volcanoes sit a fixed distance behind the trench rather than in it.",
  ],
  misconceptions: [
    "Subduction happens because one plate is stronger",
    "The volcanoes are fed by melted slab",
  ],
  specimens: [{
    id: "zone", name: "Ocean meeting continent",
    art: { art: "landform", which: "convergent-oc" },
    parts: [
      { id: "trench", name: "The trench", at: [-0.56, 0.1],
        note: "Where the plate bends down. The Peru-Chile trench reaches 8 065 m. Where ocean goes under ocean it is deeper still: the Mariana trench bottoms out at 10 994 m." },
      { id: "wedge", name: "Accretionary wedge", at: [-0.3, 0.34],
        note: "Sediment scraped off the top of the descending plate and stacked against the continent, the way snow piles up in front of a plough." },
      { id: "slab", name: "The descending slab", at: [0.08, 0.56],
        note: "Cold oceanic lithosphere at about 3.3 g per cubic centimetre, sinking because it is denser than the hot mantle it displaces. It pulls the rest of the plate along behind it." },
      { id: "water", name: "Water driven off", at: [0.38, 0.3],
        note: "Near 100 km depth the slab's water-bearing minerals break down. The water released lowers the melting point of the mantle above it by hundreds of degrees, so that mantle melts." },
      { id: "arc", name: "The volcanic arc", at: [0.14, -0.46],
        note: "Melt rises and builds a line of volcanoes 100 to 200 km behind the trench, every time, because that is where the slab reaches 100 km depth. The Andes are 7 000 km of it." },
      { id: "benioff", name: "Deep earthquakes", at: [0.56, -0.16],
        note: "The Wadati-Benioff zone: a sloping sheet of earthquake foci, shallow at the trench and up to 700 km deep under the arc. It is the shape of the slab, drawn by its own earthquakes." },
    ],
  }],
};

/* E5.3 — Transform: stored slip, released all at once. */
const STUCK_THEN_SLIPPING: ArchetypeSpec = {
  id: "g7e5-stuck-then-slipping",
  title: "Stuck, Then Slipping",
  tagline: "A transform fault moves 3.4 cm a year on average and nothing at all most years.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-3", "MS-ESS3-2"] },
  learningGoals: [
    "Calculate seismic moment from rupture length, rupture depth and slip.",
    "Convert seismic moment into moment magnitude and explain why the scale is logarithmic.",
  ],
  misconceptions: [
    "Magnitude 8 is twice as big as magnitude 4",
    "A transform boundary makes no landforms because nothing is created or destroyed",
  ],
  specimens: [{ id: "fault", name: "Transform fault", art: { art: "landform", which: "transform" } }],
  variables: [
    { key: "length", label: "Rupture length (km)", min: 10, max: 500, step: 5, default: 100 },
    { key: "depth", label: "Rupture depth (km)", min: 5, max: 20, step: 1, default: 12 },
    { key: "slip", label: "Slip on the fault (m)", min: 0.1, max: 10, step: 0.1, default: 2 },
  ],
  // Seismic moment M0 = mu A D, with mu = 30 GPa for crustal rock, and moment
  // magnitude Mw = (2/3) log10(M0) - 6.06 (Hanks and Kanamori, 1979). Radiated
  // energy follows the Gutenberg-Richter relation log10 E = 1.5 Mw + 4.8, so a
  // magnitude 8 releases a thousand times the energy of a magnitude 6. Set
  // 477 km by 12 km with 4 m of slip and this returns 7.8: the 1906 San
  // Andreas earthquake.
  measure: (v) => {
    const moment = SHEAR_MODULUS * (v.length * 1000) * (v.depth * 1000) * v.slip;
    const magnitude = (2 / 3) * Math.log10(moment) - 6.06;
    return {
      seismicMomentNm: moment,
      momentMagnitude: magnitude,
      radiatedEnergyJ: Math.pow(10, 1.5 * magnitude + 4.8),
      yearsToStoreThisSlip: (v.slip * 100) / SAN_ANDREAS_CM_YR,
      ruptureAreaKm2: v.length * v.depth,
    };
  },
  plot: {
    x: "length", y: "momentMagnitude",
    xLabel: "Rupture length (km)", yLabel: "Moment magnitude",
  },
};

/* E5.4 — Why the hazards are all in the same places. */
const WHY_HERE: ArchetypeSpec = {
  id: "g7e5-why-here",
  title: "Why Here?",
  tagline: "Follow the strain from the mantle to a shaking city, and the hazard map explains itself.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Trace the chain from mantle convection to ground shaking at a named place.",
    "Explain why earthquake and volcano maps pick out the same lines.",
  ],
  misconceptions: [
    "Earthquakes can happen equally anywhere",
    "The warning time before an earthquake comes from predicting it",
  ],
  specimens: [{ id: "epicentre", name: "Seismic waves", art: { art: "landform", which: "quake" } }],
  stages: [
    { name: "Convection", at: 0, caption: "Mantle rock creeping at about 5 cm a year drags the plates with it." },
    { name: "Locked", at: 0.2, caption: "Friction holds the fault while the rock either side bends. Strain stores at 3.4 cm a year." },
    { name: "Rupture", at: 0.4, caption: "Friction loses. A century of stored bending is spent in under a minute." },
    { name: "P wave", at: 0.6, caption: "6 km per second. From 100 km away it arrives 16.7 seconds after the rupture." },
    { name: "S wave", at: 0.8, caption: "3.5 km per second, and far more damaging. It arrives 11.9 seconds after the P wave." },
    { name: "The city", at: 1, caption: "Soft ground amplifies the shaking two to four times, which decides where the damage lands." },
  ],
  route: [
    { at: [0.12, 0.3], name: "Mantle convection",
      note: "Solid rock creeping at about 5 cm a year, roughly the pace a fingernail grows, dragging the plate above it along." },
    { at: [0.28, 0.66], name: "A locked fault",
      note: "Friction pins the two sides together while the rock either side bends elastically. On the San Andreas the strain accumulates at the full plate rate, 3.4 cm a year." },
    { at: [0.45, 0.3], name: "Rupture",
      note: "In April 1906 the San Andreas slipped up to 6 m along 477 km of its length in under a minute, spending strain that had taken more than a century to store." },
    { at: [0.6, 0.66], name: "P waves at 6 km per second",
      note: "A compression, travelling like sound through the rock, and always the first arrival. From 100 km away it reaches you 16.7 seconds after the rupture." },
    { at: [0.76, 0.32], name: "S waves at 3.5 km per second",
      note: "A shear: the ground moves sideways to the direction of travel, which is what knocks buildings down. It arrives 11.9 seconds after the P wave, and that gap is what an early-warning system sells." },
    { at: [0.9, 0.66], name: "The pattern on the map",
      note: "About 90 per cent of earthquakes and three quarters of active volcanoes sit on plate boundaries. Soft sediment then amplifies the shaking two to four times, which is why damage is patchy within one city." },
  ],
};

/* E5.5 — Reading a boundary map. */
const NAME_THE_BOUNDARY: ArchetypeSpec = {
  id: "g7e5-name-the-boundary",
  title: "Name the Boundary",
  tagline: "Nine places on the map. Decide what the two plates there are doing to each other.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-3"] },
  learningGoals: [
    "Classify real plate boundaries as divergent, convergent or transform from their landforms.",
    "Use the landform, not the location, as the evidence.",
  ],
  misconceptions: [
    "All mountains are made at convergent boundaries",
    "Transform boundaries make no landforms",
  ],
  categories: [
    { id: "divergent", name: "Divergent", hint: "moving apart, new crust made" },
    { id: "convergent", name: "Convergent", hint: "coming together, crust destroyed or piled up" },
    { id: "transform", name: "Transform", hint: "sliding past, no crust made or lost" },
  ],
  specimens: [
    { id: "iceland", name: "Iceland", category: "divergent",
      because: "The Mid-Atlantic Ridge above sea level. The two halves of the island separate at about 1.9 cm a year and fresh basalt fills the gap.",
      art: { art: "sphere", color: "#4fa8a0", radius: 0.46 } },
    { id: "eastafrica", name: "The East African Rift", category: "divergent",
      because: "A 3 000 km valley dropped between normal faults, opening 0.6 to 0.7 cm a year. In ten million years it will be a sea.",
      art: { art: "sphere", color: "#7dbb52", radius: 0.46 } },
    { id: "redsea", name: "The Red Sea", category: "divergent",
      because: "A rift that has already flooded: 300 km wide, opening 1.6 cm a year, with new basalt seafloor down the middle.",
      art: { art: "sphere", color: "#c2534a", radius: 0.46 } },
    { id: "andes", name: "The Andes", category: "convergent",
      because: "The Nazca plate dives beneath South America at 6.6 cm a year. A trench 8 065 m deep offshore, and a 7 000 km line of volcanoes behind it.",
      art: { art: "sphere", color: "#a0642e", radius: 0.46 } },
    { id: "mariana", name: "The Mariana Trench", category: "convergent",
      because: "Old, cold ocean floor sinking beneath younger ocean floor: 10 994 m deep, and an arc of volcanic islands 200 km behind it.",
      art: { art: "sphere", color: "#2b4a70", radius: 0.46 } },
    { id: "himalaya", name: "The Himalaya", category: "convergent",
      because: "Two continents, both too buoyant to sink, so the crust doubles in thickness instead. India has pushed more than 2 000 km into Asia since 50 million years ago.",
      art: { art: "sphere", color: "#dfe6ee", radius: 0.46 } },
    { id: "sanandreas", name: "The San Andreas Fault", category: "transform",
      because: "The Pacific plate slides northwest past North America at 3.4 cm a year. Streams crossing it are bent, and offset fences date the last slip.",
      art: { art: "sphere", color: "#d9a441", radius: 0.46 } },
    { id: "alpine", name: "The Alpine Fault, New Zealand", category: "transform",
      because: "A 600 km straight line across the South Island. Rocks either side match each other 480 km apart, which is how far they have slid.",
      art: { art: "sphere", color: "#8f6fbf", radius: 0.46 } },
    { id: "deadsea", name: "The Dead Sea Transform", category: "transform",
      because: "Arabia slides north past Africa at about 0.5 cm a year. Where the fault bends, the ground pulls apart and drops: the Dead Sea sits 430 m below sea level.",
      art: { art: "sphere", color: "#b9c4cc", radius: 0.46 } },
  ],
};

export const g7e5TearingAContinent = buildSim(TEARING_A_CONTINENT);
export const g7e5GoingUnder = buildSim(GOING_UNDER);
export const g7e5StuckThenSlipping = buildSim(STUCK_THEN_SLIPPING);
export const g7e5WhyHere = buildSim(WHY_HERE);
export const g7e5NameTheBoundary = buildSim(NAME_THE_BOUNDARY);
