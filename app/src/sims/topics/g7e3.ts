import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E3 — Geoscience processes across time and scale.
 *
 * Five simulations, one per subtopic:
 *
 *   E3.1  g7e3-one-morning-in-may   fast processes                      (process)
 *   E3.2  g7e3-millimetres-add-up   slow processes                      (investigate)
 *   E3.3  g7e3-read-the-column      explaining a sequence of layers     (assemble)
 *   E3.4  g7e3-slow-then-sudden     fast and slow in one explanation    (trace)
 *   E3.5  g7e3-zoom-out             spatial scale, outcrop to continent (sort)
 *
 * Two real places carry the topic: Mount St Helens on 18 May 1980, where a
 * mountain lost 401 m of summit in a morning, and the Grand Canyon, where the
 * same river removes about 0.3 mm a year. Both numbers are measured, and the
 * point of the topic is that neither one on its own explains a landscape.
 */

/* E3.1 — Fast: a mountain rearranged before lunch. */
const ONE_MORNING_IN_MAY: ArchetypeSpec = {
  id: "g7e3-one-morning-in-may",
  title: "One Morning in May",
  tagline: "Mount St Helens, 18 May 1980. Four hundred metres of mountain, gone by lunchtime.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Describe geoscience processes that reshape a landscape in minutes rather than millennia.",
    "Quote measured rates for a landslide, a blast and a lahar.",
  ],
  misconceptions: [
    "Geological change is always too slow to watch",
    "A volcano only changes a landscape by adding lava",
  ],
  specimens: [{ id: "cone", name: "Mount St Helens", art: { art: "landform", which: "volcano" } }],
  stages: [
    { name: "08:32:11", at: 0,
      caption: "A magnitude 5.1 earthquake 1.5 km below the summit. The bulging north flank, already 140 m out of place, lets go." },
    { name: "Landslide", at: 0.2,
      caption: "2.5 cubic kilometres of mountain slides north at up to 250 km per hour. It is still the largest landslide ever recorded." },
    { name: "Lateral blast", at: 0.4,
      caption: "Uncorked magma flashes to gas. The blast crosses 600 square kilometres of forest at up to 1 080 km per hour and 300 degrees C, in under ten minutes." },
    { name: "Ash column", at: 0.6,
      caption: "The plume reaches 24 km, into the stratosphere, within fifteen minutes, and ash falls on eleven states over the next three days." },
    { name: "Lahars", at: 0.8,
      caption: "Melted snow mixes with debris and runs 90 km down the Toutle River at about 40 km per hour, burying bridges as it goes." },
    { name: "By lunchtime", at: 1,
      caption: "The summit has fallen from 2 950 m to 2 549 m. That is 401 m removed in a morning; rebuilding a lava dome in the crater then took thirty years." },
  ],
};

/* E3.2 — Slow: a small rate multiplied by a huge time. */
const MILLIMETRES_ADD_UP: ArchetypeSpec = {
  id: "g7e3-millimetres-add-up",
  title: "Millimetres Add Up",
  tagline: "Nothing in geology moves fast. Everything in geology has had a very long time.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Convert a rate in millimetres per year into a total change over millions of years.",
    "Compare geological rates with rates a student can see, such as a fingernail growing.",
  ],
  misconceptions: [
    "Mountains must have been built quickly because they are so big",
    "A slow process cannot produce a large result",
  ],
  specimens: [{ id: "range", name: "Mountain range", art: { art: "landform", which: "peaks" } }],
  variables: [
    { key: "rate", label: "Rate (mm per year)", min: 0.05, max: 40, step: 0.05, default: 5 },
    { key: "height", label: "Height to build or remove (m)", min: 100, max: 9000, step: 100, default: 8800 },
  ],
  // Pure proportion, done honestly: millimetres per year against millimetres
  // needed. For scale, the Himalaya rise 5 to 10 mm a year, the San Andreas
  // slips 34 mm a year, the Colorado cuts down 0.3 mm a year, and a fingernail
  // grows about 36 mm a year — faster than any of them.
  measure: (v) => {
    const yearsNeeded = (v.height * 1000) / v.rate;
    return {
      yearsNeeded,
      millionYears: yearsNeeded / 1e6,
      humanGenerations: yearsNeeded / 25,
      mmInAnEightyYearLife: v.rate * 80,
      timesSlowerThanAFingernail: 36 / v.rate,
    };
  },
  plot: {
    x: "rate", y: "millionYears",
    xLabel: "Rate (mm per year)", yLabel: "Time needed (million years)",
  },
  /**
   * The range on the bench is the range being asked for, so it grows with the
   * height slider and the ground line stays put beneath it. Drawing it in true
   * proportion to a 100 m hill would leave Everest off the top of the stage, so
   * the scale is compressed: 100 m draws at 0.55 and 9 000 m at 1.10.
   */
  drive: ({ v }) => {
    const scale = 0.55 + 0.55 * (v.height / 9000);
    return { scale, offset: [0, 0.7 * (1 - scale)] };
  },
};

/* E3.3 — Building an explanation out of a stack of beds. */
const READ_THE_COLUMN: ArchetypeSpec = {
  id: "g7e3-read-the-column",
  title: "Read the Column",
  tagline: "Six features in one cliff. Put them in order and you have written the history of a place.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-2", "MS-ESS1-4"] },
  learningGoals: [
    "Apply superposition, original horizontality and cross-cutting relationships to order events.",
    "Recognise an unconformity as missing time rather than missing rock.",
  ],
  misconceptions: [
    "The rock record is complete",
    "Tilted beds were deposited at an angle",
  ],
  specimens: [{
    id: "cliff", name: "Siccar Point, Scotland",
    art: { art: "landform", which: "strata" },
    parts: [
      { id: "greywacke", name: "1. Greywacke beds", at: [-0.08, 0.62],
        note: "The oldest rock here, deposited about 435 million years ago. Superposition: it lies at the bottom, so it was laid down first." },
      { id: "tilting", name: "2. Folded upright", at: [0.46, 0.4],
        note: "These beds were laid down flat, then squeezed until they stood almost vertical. Original horizontality says the folding must come after the beds." },
      { id: "gap", name: "3. The erosion surface", at: [-0.5, 0.1],
        note: "The ragged line across the tilted beds is missing time, not missing rock. At Siccar Point the gap swallows about 65 million years." },
      { id: "ors", name: "4. Old Red Sandstone", at: [0.44, -0.1],
        note: "Laid flat across the cut-off edges below. An angular unconformity, and the outcrop that convinced James Hutton in 1788 that Earth was ancient." },
      { id: "limestone", name: "5. Limestone above", at: [-0.46, -0.36],
        note: "Deposited later still, so younger again. Its fossils let this sequence be matched to beds of the same age hundreds of kilometres away." },
      { id: "dyke", name: "6. The basalt dyke", at: [0.1, -0.6],
        note: "A sheet of basalt cutting straight through everything else. Cross-cutting relationships: whatever cuts another rock must be younger than it, so this is last." },
    ],
  }],
};

/* E3.4 — One canyon, cut by both timescales at once. */
const SLOW_THEN_SUDDEN: ArchetypeSpec = {
  id: "g7e3-slow-then-sudden",
  title: "Slow, Then Sudden",
  tagline: "The Grand Canyon averages 0.3 mm a year. It has never once removed 0.3 mm in a year.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Combine slow, steady processes and rare, fast events into one explanation of a landform.",
    "Explain why an average rate is not a description of what happens in any single year.",
  ],
  misconceptions: [
    "Landscapes are shaped either slowly or suddenly, not both",
    "An average erosion rate tells you what happened last year",
  ],
  specimens: [{ id: "canyon", name: "Canyon country", art: { art: "landform", which: "canyon" } }],
  stages: [
    { name: "Deposit", at: 0, caption: "1 200 m of Palaeozoic sediment: about 0.005 mm a year, for 255 million years." },
    { name: "Uplift", at: 0.2, caption: "The Colorado Plateau rises 2 000 m at roughly 0.03 mm a year." },
    { name: "Incise", at: 0.4, caption: "The river arrives and cuts 1 800 m in 6 million years: 0.3 mm a year." },
    { name: "Flood", at: 0.6, caption: "One release of 2 750 cubic metres a second rebuilds rapids in days." },
    { name: "Rockfall", at: 0.8, caption: "A slab drops in seconds, and the canyon gets wider without the river touching it." },
    { name: "Today", at: 1, caption: "446 km long, 29 km wide, 1 857 m deep. Slow rates and sudden events, together." },
  ],
  route: [
    { at: [0.12, 0.62], name: "525 to 270 million years ago: deposition",
      note: "About 1 200 m of limestone, sandstone and shale, laid down in shallow seas and deserts. Averaged over 255 million years that is roughly 0.005 mm a year." },
    { at: [0.3, 0.3], name: "70 million years ago: uplift",
      note: "The Colorado Plateau rises about 2 000 m. Spread over 70 million years that is 0.03 mm a year, which no instrument of the time could have detected." },
    { at: [0.46, 0.64], name: "6 million years ago: the river arrives",
      note: "The Colorado cuts down 1 800 m in about 6 million years: 0.3 mm a year, roughly three sheets of paper." },
    { at: [0.62, 0.3], name: "One week in 1983",
      note: "About 2 750 cubic metres a second released from Glen Canyon Dam rearranged rapids and rolled boulders that had not moved in decades." },
    { at: [0.78, 0.66], name: "One second",
      note: "A single rockfall drops a slab off the rim. Most of the canyon's widening is done by rare events like this, not by the river at all." },
    { at: [0.9, 0.32], name: "Both, at once",
      note: "446 km long, 29 km wide at its widest, 1 857 m at its deepest. The average of 0.3 mm a year is an accounting total, not a description of any single year." },
  ],
};

/**
 * Real long dimension of each ZOOM_OUT specimen, in metres, in the order the
 * specimens are listed. It is what `drive` draws them at.
 */
const ZOOM_SIZES_M = [0.003, 0.008, 0.04, 40, 80, 30000, 446000, 1.0e7, 1.6e7];

/* E3.5 — Choosing the right scale to look at. */
const ZOOM_OUT: ArchetypeSpec = {
  id: "g7e3-zoom-out",
  title: "Zoom Out",
  tagline: "The same rock, at four scales. Each one answers a different question.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Match a geological observation to the spatial scale at which it is made.",
    "Explain why a plate-scale question cannot be answered from a hand specimen.",
  ],
  misconceptions: [
    "Zooming out is only a matter of seeing more of the same thing",
    "One map can show every scale at once",
  ],
  categories: [
    { id: "hand", name: "Hand sample", hint: "millimetres to centimetres" },
    { id: "outcrop", name: "Outcrop", hint: "metres to tens of metres" },
    { id: "landscape", name: "Landscape", hint: "kilometres to hundreds of km" },
    { id: "plate", name: "Plate", hint: "thousands of kilometres" },
  ],
  specimens: [
    { id: "crystals", name: "Interlocking quartz and feldspar, 3 mm across", category: "hand",
      because: "Crystal size answers one question only: how fast the melt cooled. You need a lens, not a map.",
      art: { art: "landform", which: "igneous" } },
    { id: "garnet", name: "A garnet 8 mm across in a schist", category: "hand",
      because: "One crystal fixes the pressure and temperature the rock reached, about 400 MPa and 450 degrees C, which is 15 km down.",
      art: { art: "landform", which: "metamorphic" } },
    { id: "ripple", name: "A ripple mark, 4 cm crest to crest", category: "hand",
      because: "The spacing gives the current speed and the asymmetry gives its direction, on one afternoon, 300 million years ago.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "quarry", name: "A quarry face 40 m wide with beds dipping 30 degrees", category: "outcrop",
      because: "At this scale you can see beds cutting off against each other, which is where the order of events is read.",
      art: { art: "landform", which: "strata" } },
    { id: "bed", name: "One sandstone bed 2 m thick, traced 80 m along a cliff", category: "outcrop",
      because: "Following a single bed sideways shows how the environment changed across a beach or a river channel.",
      art: { art: "sphere", color: "#d3a468", radius: 0.46 } },
    { id: "fuji", name: "Mount Fuji, 3 776 m high and 30 km across", category: "landscape",
      because: "A whole volcano is a landscape feature. It sits above a subduction zone, but you cannot see the zone from here.",
      art: { art: "landform", which: "volcano" } },
    { id: "canyon", name: "The Grand Canyon, 446 km long", category: "landscape",
      because: "At this scale you can see a whole drainage system and 2 000 m of uplift, but individual beds have become lines.",
      art: { art: "landform", which: "canyon" } },
    { id: "pacific", name: "The Pacific plate, 103 million square kilometres", category: "plate",
      because: "Only at this scale does the pattern make sense: one rigid sheet moving northwest at about 7 cm a year.",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8cdf0" } },
    { id: "ridge", name: "The Mid-Atlantic Ridge, 16 000 km end to end", category: "plate",
      because: "The magnetic stripes either side match across the whole length. No outcrop could ever show you that.",
      art: { art: "landform", which: "seafloor" } },
  ],
  /**
   * The whole subtopic is scale, so the specimens are not all drawn the same
   * size: each one is drawn at its own place on a logarithmic ladder running
   * from a 3 mm crystal to a 16 000 km ridge. Ten decades cannot be shown in
   * true proportion on a stage — the crystal would be a thousandth of a pixel —
   * so the drawn size follows the logarithm of the real one, which keeps the
   * order and the spacing honest.
   */
  drive: ({ index }) => ({
    scale: 0.52 + 0.55 * ((Math.log10(ZOOM_SIZES_M[index] ?? 1) + 2.6) / 9.9),
  }),
};

export const g7e3OneMorningInMay = buildSim(ONE_MORNING_IN_MAY);
export const g7e3MillimetresAddUp = buildSim(MILLIMETRES_ADD_UP);
export const g7e3ReadTheColumn = buildSim(READ_THE_COLUMN);
export const g7e3SlowThenSudden = buildSim(SLOW_THEN_SUDDEN);
export const g7e3ZoomOut = buildSim(ZOOM_OUT);
