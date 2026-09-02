import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E5 — Rock strata and the geologic time scale.
 *
 * Five simulations, one per subtopic:
 *
 *   E5.1  g8e5-oldest-at-the-bottom  superposition                (explore)
 *   E5.2  g8e5-the-missing-chapter   index fossils, unconformities (process)
 *   E5.3  g8e5-one-grain-of-sand     reading strata as a record   (trace)
 *   E5.4  g8e5-metres-of-time        eons, eras and periods       (investigate)
 *   E5.5  g8e5-build-the-case        explaining from the evidence (assemble)
 *
 * The dates are the current International Chronostratigraphic Chart:
 * Hadean 4567-4031 Ma, Archean 4031-2500, Proterozoic 2500-538.8, Phanerozoic
 * 538.8 to now. Earth itself is 4 540 +/- 50 million years old, and that is
 * the number the core in E5.4 is scaled to.
 */

/** Where the stage rail has got to, rebuilt from the clock. */
const railPhase = (t: number) => (t * 0.096) % 1;

/* ---------------------------------------------------------------- *
 * E5.1 — Superposition
 * ---------------------------------------------------------------- */

const OLDEST_AT_THE_BOTTOM: ArchetypeSpec = {
  id: "g8e5-oldest-at-the-bottom",
  title: "Oldest at the Bottom",
  tagline: "Five beds and one intruding sheet. Work out the order they arrived in without a single date.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Apply the law of superposition to order undisturbed sedimentary beds.",
    "Apply cross-cutting relationships to date an intrusion relative to the beds it cuts.",
  ],
  misconceptions: [
    "The thickest layer took the longest to form",
    "The bottom layer of every cliff is the oldest rock on Earth",
  ],
  specimens: [{
    id: "column",
    name: "A road cutting, 40 m of section",
    art: { art: "landform", which: "strata" },
    parts: [
      { id: "sandstone", name: "Sandstone, the youngest bed", at: [0, -0.385],
        note: "On top, so it arrived last. Cross-bedded quartz sand: a desert dune field or a river bar. Nothing above it, so superposition gives it no upper limit — it could be 200 million years old or 20." },
      { id: "shale", name: "Shale", at: [0, -0.188],
        note: "Mud that settled a grain at a time in still, deep water. It is under the sandstone and over the limestone, so it is younger than the limestone and older than the sandstone. That is a bracket, and brackets are what relative dating gives you." },
      { id: "limestone", name: "Limestone, full of shells", at: [0, 0],
        note: "Calcium carbonate built from the shells of animals that lived in a warm shallow sea. The fossils in it are the ones a geologist will use to correlate this cutting with another one 300 km away." },
      { id: "conglomerate", name: "Conglomerate", at: [0, 0.177],
        note: "Rounded pebbles set in sand: a fast river or a storm beach, energetic enough to roll cobbles. Being lower, it is older than everything above it — including the pebbles' own parent rock, which is older still." },
      { id: "basalt", name: "Basalt flow, the oldest bed", at: [0, 0.375],
        note: "A lava flow with a baked top, so it was already a surface when the conglomerate was dumped on it. Bottom of the pile, so by superposition it is the oldest thing here." },
      { id: "dyke", name: "The dyke that cuts them all", at: [0.44, 0.02],
        note: "A sheet of magma that forced its way up through every bed. A rock must exist before something can cut it, so the dyke is younger than all five — cross-cutting relationships, and the reason a dated dyke puts a minimum age on the whole sequence." },
    ],
  }],
};

/* ---------------------------------------------------------------- *
 * E5.2 — Index fossils and unconformities
 * ---------------------------------------------------------------- */

const THE_MISSING_CHAPTER: ArchetypeSpec = {
  id: "g8e5-the-missing-chapter",
  title: "The Missing Chapter",
  tagline: "Watch 65 million years of rock get built, tipped on end and stripped away before the next bed lands.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Explain an unconformity as a surface where rock, and therefore time, has been removed.",
    "Explain how an index fossil shows how much time is missing at that surface.",
  ],
  misconceptions: [
    "A rock record is a complete diary with no pages torn out",
    "Layers are always flat and horizontal",
  ],
  specimens: [{
    id: "section", name: "Siccar Point, Berwickshire", art: { art: "landform", which: "strata" },
  }],
  stages: [
    { name: "Beds pile up", at: 0,
      caption: "Silurian mud and sand settle on a deep sea floor about 435 million years ago, bed on bed, oldest at the bottom." },
    { name: "Squeezed and tipped", at: 0.25,
      caption: "The Caledonian mountain-building tips those beds to near vertical about 425 Ma. Horizontal beds standing on end are proof the crust moved after they formed." },
    { name: "Stripped bare", at: 0.5,
      caption: "Sixty-five million years of erosion saw the folded rock off flat. No rock forms here at all — this is the time that goes missing from the record." },
    { name: "The sea returns", at: 0.75,
      caption: "About 370 Ma, Devonian Old Red Sandstone is laid down flat across the sawn-off edges. The junction between the two is an angular unconformity." },
    { name: "Read the gap", at: 1,
      caption: "The graptolites below are Silurian, the fish scales above Devonian: 65 million years are absent at a surface you can put one finger on. James Hutton stood here in 1788 and saw it." },
  ],
  /*
   * The section is the readout. It thickens as beds are deposited, sways as
   * the Caledonian folding tips it on end, then is visibly cut down to a
   * stump during the erosion stage — that shrinking is the missing time — and
   * grows again as the Devonian sandstone arrives on top. The base is held
   * still by shifting the column down by whatever the shrinking took off, so
   * the ground stays where the ground should be.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    let scale: number, sway = 0;
    if (u < 0.3) scale = 0.5 + (u / 0.3) * 0.72;
    else if (u < 0.45) { scale = 1.22; sway = Math.sin((u - 0.3) * 42) * 0.12; }
    else if (u < 0.65) scale = 1.22 - ((u - 0.45) / 0.2) * 0.66;
    else scale = 0.56 + ((u - 0.65) / 0.35) * 0.6;
    return { scale, offset: [sway, 1 - scale], rate: 0.7 };
  },
};

/* ---------------------------------------------------------------- *
 * E5.3 — Reading strata as a record
 * ---------------------------------------------------------------- */

const ONE_GRAIN_OF_SAND: ArchetypeSpec = {
  id: "g8e5-one-grain-of-sand",
  title: "One Grain of Sand",
  tagline: "Follow a single quartz grain from a mountain to a cliff face and back into daylight.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Read a sedimentary bed as a record of the environment that laid it down.",
    "Explain how grain size, shape and sorting say where a sediment came from and how far it travelled.",
  ],
  misconceptions: [
    "Sedimentary rock forms wherever rock is buried",
    "All the grains in a rock formed at the same time as the rock",
  ],
  specimens: [{ id: "grain", name: "One quartz grain, 0.4 mm across", art: { art: "sphere", color: "#e0bd76" } }],
  stages: [
    { name: "In the granite", at: 0, caption: "Locked in a granite that crystallised 410 million years ago, 8 km underground." },
    { name: "Weathered out", at: 0.25, caption: "Frost and rain break the granite down. Feldspar rots to clay; the quartz survives, sharp-edged and 0.5 mm across." },
    { name: "Down the river", at: 0.5, caption: "Two hundred kilometres of tumbling rounds the grain off and sorts it away from the coarse and the fine." },
    { name: "Buried", at: 0.75, caption: "Deposited on a delta, buried under 2 km of later sediment, and cemented with silica into sandstone." },
    { name: "In the cliff", at: 1, caption: "Uplifted and cut into by the sea. The grain is 410 million years old; the rock holding it is 380. They are not the same age." },
  ],
  route: [
    { at: [0.11, 0.7], name: "Inside the granite",
      note: "Crystallised from magma at about 700 degrees C, 8 km down, 410 Ma. The grain's own clock starts here — long before it was ever part of a sedimentary rock." },
    { at: [0.24, 0.32], name: "The weathering face",
      note: "Uplift brings the granite to the surface. Water freezing in cracks levers it apart, feldspar rots to clay, and the quartz is simply released: it is hard, and chemically it barely reacts at all." },
    { at: [0.42, 0.6], name: "The mountain stream",
      note: "Sharp corners knock off within the first few kilometres. Rounding tells you how far a grain has come; sorting — all the grains ending up the same size — tells you the water did the sorting." },
    { at: [0.6, 0.3], name: "The delta",
      note: "The river slows where it meets the sea and drops its load in graded beds, coarse at the bottom of each. Ripple marks on the top surfaces show which way the current ran." },
    { at: [0.78, 0.62], name: "Two kilometres down",
      note: "Buried under later sediment at about 25 degrees C per kilometre. Silica dissolved in the pore water cements the grains together, and 40 per cent of the original pore space is squeezed out." },
    { at: [0.92, 0.3], name: "The cliff face",
      note: "Uplift and 380 million years later the sea cuts into it. Everything about the bed — grain size, roundness, sorting, ripples — is a readable record of the delta that made it." },
  ],
  /*
   * The grain is a specimen under a lens and it changes as it travels: sharp
   * and pale where it leaves the granite, worn down to about two thirds of its
   * bulk and rounded by the river, then darkened by the iron-oxide cement that
   * turns loose sand into sandstone. Abrasion is a real loss of volume, so the
   * width shrinks as its cube root.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const abraded = Math.min(1, Math.max(0, (u - 0.2) / 0.45));
    return {
      scale: Math.cbrt(1 - 0.34 * abraded) * 1.15,
      color: u < 0.7 ? "#e0bd76" : "#c08a4a",
      rate: 0.4 + abraded * 1.6,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E5.4 — Eons, eras and periods
 * ---------------------------------------------------------------- */

/** The eon a date in millions of years ago falls in, and its colour. */
function eonAt(mya: number): { index: number; color: string } {
  if (mya > 4031) return { index: 1, color: "#5c3126" };
  if (mya > 2500) return { index: 2, color: "#7a6238" };
  if (mya > 538.8) return { index: 3, color: "#3c6f63" };
  return { index: 4, color: "#4c9455" };
}

const METRES_OF_TIME: ArchetypeSpec = {
  id: "g8e5-metres-of-time",
  title: "Four Thousand Five Hundred Metres of Time",
  tagline: "One metre of core for every million years. Fill it up and find where anything you have heard of sits.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Order the eons and name the eras of the Phanerozoic with their boundary dates.",
    "Express Earth's history on a scale a person can picture, and place familiar events on it.",
  ],
  misconceptions: [
    "Dinosaurs and early humans overlapped",
    "Most of Earth's history has fossils in it",
  ],
  specimens: [{
    id: "core", name: "The core tube: 1 m to the million years",
    art: { art: "glassware", which: "testTube", level: 0.88, color: "#4c9455" },
  }],
  variables: [
    { key: "mya", label: "Millions of years ago", min: 0, max: 4540, step: 10, default: 541 },
  ],
  /*
   * Earth is 4 540 +/- 50 million years old, so a core with one metre to the
   * million years is 4.54 km long, and the tube fills with however much of
   * that has already happened. The boundaries are the current international
   * ones: Hadean until 4 031 Ma, Archean until 2 500, Proterozoic until 538.8,
   * Phanerozoic since. Squeeze the whole thing into a 365-day year and the
   * Cambrian explosion falls on 18 November, the dinosaurs die on 26 December,
   * and every human being who has ever lived fits into the last 2 hours.
   */
  measure: (v) => {
    const elapsed = (4540 - v.mya) / 4540;
    return {
      percentOfEarthHistoryDone: elapsed * 100,
      dayOfA365DayYear: elapsed * 365,
      metresUpTheCore: 4540 - v.mya,
      millionsOfYearsAgo: v.mya,
      eon: eonAt(v.mya).index,
      yearsPerMillimetreOfCore: 1000,
    };
  },
  plot: {
    x: "mya", y: "percentOfEarthHistoryDone",
    xLabel: "Millions of years ago", yLabel: "Share of Earth's history already over (%)",
  },
  /*
   * The tube holds the time that had already passed by the date you set, and
   * it takes the colour of the eon that date falls in: dark red-brown for the
   * Hadean, ochre for the Archean, sea green for the Proterozoic and living
   * green for the Phanerozoic. Slide from 4 540 to 0 and the green does not
   * appear until the tube is already 88 per cent full, which is the fact this
   * whole subtopic is about.
   */
  drive: ({ v, f }) => ({
    level: Math.max(0.02, Math.min(0.99, f.percentOfEarthHistoryDone / 100)),
    color: eonAt(v.mya).color,
  }),
};

/* ---------------------------------------------------------------- *
 * E5.5 — Constructing an explanation from strata evidence
 * ---------------------------------------------------------------- */

const BUILD_THE_CASE: ArchetypeSpec = {
  id: "g8e5-build-the-case",
  title: "Build the Case for the Cliff",
  tagline: "Six pieces of evidence in one sea cliff. Collect them all, then say what happened here.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Assemble several independent lines of evidence from one outcrop into a single explanation.",
    "State which evidence supports which claim, and where the explanation is still uncertain.",
  ],
  misconceptions: [
    "One fossil is enough to date a rock",
    "An explanation is a guess about what might have happened",
  ],
  specimens: [{
    id: "cliff",
    name: "A 60 m sea cliff, southern England",
    art: { art: "landform", which: "cliff" },
    parts: [
      { id: "ripples", name: "Ripple marks on a bedding plane", at: [-0.52, -0.2],
        note: "Symmetrical ripples, 4 cm crest to crest. Symmetry means waves rather than a one-way current, so this was shallow water within reach of the surface — under about 20 m." },
      { id: "shells", name: "Brachiopod shells, mostly unbroken", at: [-0.2, 0.22],
        note: "Whole shells, not fragments, so they were not thrown about by surf. A quiet shelf sea. Two of the species are known only from the Jurassic, which brackets the bed." },
      { id: "ash", name: "A 4 cm ash bed", at: [0.1, -0.28],
        note: "Volcanic ash settles over a whole region in weeks, so it is one instant everywhere it appears. Its zircons date at 166.1 +/- 0.3 Ma, and that number now belongs to every bed it touches." },
      { id: "burrows", name: "Vertical burrows", at: [0.36, 0.26],
        note: "Animals were living in the sediment while it was still soft, so deposition was slow enough for a community to settle. Burrowed beds are not storm dumps." },
      { id: "erosion", name: "An uneven surface halfway up", at: [0.58, -0.12],
        note: "The bed above cuts across the tops of the beds below. Something was removed here. The fossils above and below say how long is missing: about 3 million years." },
      { id: "claim", name: "The explanation these support", at: [-0.02, 0.3],
        note: "A quiet, shallow Jurassic sea, close to a volcano, laid these beds around 166 Ma; sea level fell and about 3 million years of rock was stripped off; then the sea returned. Every clause of that comes from one of the five pieces above, and the age is the only one with a number on it." },
    ],
  }],
};

export const g8e5OldestAtTheBottom = buildSim(OLDEST_AT_THE_BOTTOM);
export const g8e5TheMissingChapter = buildSim(THE_MISSING_CHAPTER);
export const g8e5OneGrainOfSand = buildSim(ONE_GRAIN_OF_SAND);
export const g8e5MetresOfTime = buildSim(METRES_OF_TIME);
export const g8e5BuildTheCase = buildSim(BUILD_THE_CASE);
