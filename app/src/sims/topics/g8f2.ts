import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F2 — Fossil evidence of change over time.
 *
 * Five simulations, one per subtopic:
 *
 *   F2.1  g8f2-bone-to-rock       how a fossil forms                (process)
 *   F2.2  g8f2-who-came-first     order of appearance and extinction (sort)
 *   F2.3  g8f2-fish-with-a-wrist  transitional forms                 (explore)
 *   F2.4  g8f2-dating-the-bed     placing fossils on the time scale  (investigate)
 *   F2.5  g8f2-gap-in-the-record  analysing fossil-record data       (compare)
 *
 * The numbers are the ones a geologist would use. F2.1 runs Athy's compaction
 * law, porosity = 0.60 e^(-0.00051 h), with a 2,300 kg/m3 overburden and a
 * 25 degree per kilometre geothermal gradient. F2.4 uses the measured
 * half-lives — potassium-40 at 1.251 billion years, uranium-238 at 4.468
 * billion, rubidium-87 at 48.8 billion, carbon-14 at 5,730 years — and the
 * fact that only 10.48 per cent of potassium-40 decays to argon at all.
 */

/** Blend two hex colours. Cheap enough for a per-frame `drive`. */
function mix(a: string, b: string, t: number): string {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const two = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  const ch = (i: number) =>
    two(parseInt(a.slice(i, i + 2), 16) +
      (parseInt(b.slice(i, i + 2), 16) - parseInt(a.slice(i, i + 2), 16)) * k);
  return `#${ch(1)}${ch(3)}${ch(5)}`;
}

const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

/* ---------------------------------------------------------------- *
 * F2.1 — How a fossil forms
 * ---------------------------------------------------------------- */

const BONE_TO_ROCK: ArchetypeSpec = {
  id: "g8f2-bone-to-rock",
  title: "How a Bone Becomes a Rock",
  tagline: "Bury a skeleton and push it down three kilometres. Watch the mud squeeze to half its thickness.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-1", "MS-ESS1-4"] },
  learningGoals: [
    "Describe the sequence of events that turns a buried skeleton into a fossil.",
    "Explain why fossils are found almost only in sedimentary rock, and why most organisms leave none.",
  ],
  misconceptions: [
    "A fossil is the original bone, unchanged",
    "Any animal that dies has a good chance of becoming a fossil",
  ],
  specimens: [
    {
      id: "bed", name: "The mudstone bed the skeleton is buried in",
      art: { art: "landform", which: "strata" },
    },
  ],
  variables: [
    {
      key: "burialDepth", label: "Depth of burial", unit: "m",
      min: 0, max: 3000, step: 10, default: 400,
    },
  ],
  /*
   * Real basin numbers. Overburden pressure is rho g h with a wet sediment
   * density of 2,300 kg/m3. Temperature follows the average continental
   * gradient of 25 degrees per kilometre from a 15 degree surface. Porosity
   * follows Athy's law for mud, phi = 0.60 e^(-0.00051 h), which is why a bed
   * three kilometres down is less than half the thickness it was laid down at:
   * solid volume is conserved, so thickness goes as (1 - phi0)/(1 - phi).
   * At 100 m of mud per million years — an ordinary shelf rate — three
   * kilometres of burial is 30 million years of waiting.
   */
  measure: (v) => {
    const porosity = 0.6 * Math.exp(-0.00051 * v.burialDepth);
    return {
      overburdenPressureMPa: (2300 * 9.81 * v.burialDepth) / 1e6,
      temperatureC: 15 + 0.025 * v.burialDepth,
      porosityPercent: porosity * 100,
      thicknessLeftPercent: ((1 - 0.6) / (1 - porosity)) * 100,
      burialTimeMyr: v.burialDepth / 100,
    };
  },
  stages: [
    {
      name: "Death", at: 0,
      caption: "The animal dies. On land, scavengers and bacteria remove almost everything within weeks.",
    },
    {
      name: "Burial", at: 0.2,
      caption: "A flood dumps mud over the bones before they can be scattered. Speed is what decides everything.",
    },
    {
      name: "Loading", at: 0.4,
      caption: "More mud arrives above. At 3 km down the overburden presses at 68 MPa and the bed squeezes to 46 per cent of its thickness.",
    },
    {
      name: "Permineralisation", at: 0.6,
      caption: "Groundwater carrying silica, calcite or pyrite fills the pore spaces inside the bone. Atom by atom, the bone becomes rock.",
    },
    {
      name: "Uplift", at: 0.8,
      caption: "Tens of millions of years later the basin is squeezed and lifted. The bed that was 3 km down comes back to the surface.",
    },
    {
      name: "Exposure", at: 1,
      caption: "A river or a road cut slices the bed open. Fewer than one individual in ten thousand ever gets this far.",
    },
  ],
  /*
   * The bed answers the depth slider by doing what real mud does: it sinks,
   * and it compacts. Solid grain volume cannot change, so as the water is
   * squeezed out of the pores the same sediment occupies less height — 46 per
   * cent of its original thickness at three kilometres. Drawing it the same
   * size at every depth would hide the single most important thing that
   * happens to a buried fossil.
   */
  drive: ({ v, f }) => ({
    scale: clamp(f.thicknessLeftPercent / 100, 0.4, 1),
    offset: [0, 0.55 * (v.burialDepth / 3000)],
  }),
};

export const g8f2BoneToRock = buildSim(BONE_TO_ROCK);

/* ---------------------------------------------------------------- *
 * F2.2 — Order of appearance and extinction
 * ---------------------------------------------------------------- */

const WHO_CAME_FIRST: ArchetypeSpec = {
  id: "g8f2-who-came-first",
  title: "Who Came First?",
  tagline: "Eight groups, eight first appearances. Put each in the era where its fossils actually start.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-1", "MS-ESS1-4"] },
  learningGoals: [
    "Place major groups in order of first appearance in the rock record.",
    "Explain that a group's first and last appearances are data, read from real beds.",
  ],
  misconceptions: [
    "All the main kinds of life appeared at the same time",
    "Fossils are found jumbled up, in no particular order",
  ],
  categories: [
    { id: "precambrian", name: "Before 541 Ma", hint: "Precambrian: almost all of Earth's history" },
    { id: "palaeozoic", name: "541 to 252 Ma", hint: "Palaeozoic: Cambrian to Permian" },
    { id: "mesozoic", name: "252 to 66 Ma", hint: "Mesozoic: Triassic to Cretaceous" },
    { id: "cenozoic", name: "66 Ma to now", hint: "Cenozoic: after the last mass extinction" },
  ],
  specimens: [
    {
      id: "cyano", name: "Cyanobacteria building stromatolites", category: "precambrian",
      because: "Stromatolites at Strelley Pool in Western Australia are 3.43 billion years old. Cyanobacteria like these put the first free oxygen into the air about 2.4 billion years ago, and they are still building the same mounds in Shark Bay today.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "ediacara", name: "Ediacaran fronds anchored to the sea floor", category: "precambrian",
      because: "Soft, quilted, frond-shaped bodies from 571 to 539 million years ago, found on bedding planes in Newfoundland, Australia and the White Sea. No mouth, no gut, no shell, and none of them survives into the Cambrian.",
      art: { art: "flora", which: "kelp" },
    },
    {
      id: "trilobite", name: "Trilobites", category: "palaeozoic",
      because: "First appear 521 million years ago in the early Cambrian, last appear at the very end of the Permian, 252 million years ago. About 20,000 species have been named, and not one has ever been found in a Mesozoic rock.",
      art: { art: "creature", which: "insect" },
    },
    {
      id: "lycopod", name: "Coal-swamp scale trees", category: "palaeozoic",
      because: "Lepidodendron grew 30 metres tall in the Carboniferous, 359 to 299 million years ago, with no true wood at all — a giant clubmoss held up by bark. Their remains are most of the world's coal.",
      art: { art: "flora", which: "tree" },
    },
    {
      id: "ammonite", name: "Ammonites", category: "mesozoic",
      because: "The order Ammonitida appears at the start of the Jurassic, 201 million years ago. Every one of them is gone at the Cretaceous boundary, 66 million years ago, in exactly the layer that ends the dinosaurs.",
      art: { art: "sphere", color: "#b9884f", radius: 0.46 },
    },
    {
      id: "archaeopteryx", name: "Archaeopteryx", category: "mesozoic",
      because: "Twelve skeletons, all from the Solnhofen limestone of Bavaria, all 150 million years old. Feathers, a wishbone and a bird's shoulder; teeth, a long bony tail and claws on the wing.",
      art: { art: "creature", which: "bird" },
    },
    {
      id: "grass", name: "Open grassland", category: "cenozoic",
      because: "Grass pollen is rare in rock older than 55 million years, and grasslands only spread widely from about 20 million years ago. Horses with high-crowned grinding teeth appear in the same beds, for the same reason.",
      art: { art: "flora", which: "grass" },
    },
    {
      id: "hominin", name: "Upright-walking hominins", category: "cenozoic",
      because: "Australopithecus afarensis walked upright 3.2 million years ago; the Laetoli footprints in Tanzania are 3.66 million years old. Our own genus is younger than the grasslands it evolved in.",
      art: { art: "body", which: "figure" },
    },
  ],
};

export const g8f2WhoCameFirst = buildSim(WHO_CAME_FIRST);

/* ---------------------------------------------------------------- *
 * F2.3 — Transitional forms
 * ---------------------------------------------------------------- */

const FISH_WITH_A_WRIST: ArchetypeSpec = {
  id: "g8f2-fish-with-a-wrist",
  title: "The Fish With a Wrist",
  tagline: "Tiktaalik, 375 million years old, found by people who knew exactly which rock to dig.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-1", "MS-LS4-2"] },
  learningGoals: [
    "Identify features of a transitional fossil that belong to two different groups.",
    "Explain that a transitional form is a prediction the rock record can be tested against.",
  ],
  misconceptions: [
    "There are no fossils in between the major groups",
    "A transitional form is half of one animal stuck to half of another",
  ],
  specimens: [
    {
      id: "tiktaalik",
      name: "Tiktaalik roseae, Ellesmere Island, 375 million years old",
      art: { art: "creature", which: "fish" },
      parts: [
        {
          id: "skull", name: "Flat skull, eyes on top", at: [-0.44, -0.30],
          note: "A fish skull is a wedge with side-facing eyes. This one is flat with the eyes on top, like a crocodile in shallow water.",
        },
        {
          id: "neck", name: "A neck, which no fish has", at: [0.04, -0.44],
          note: "In a fish the skull is bolted to the shoulder girdle. Here the shoulder is free, so it could turn its head. No fish can.",
        },
        {
          id: "fin", name: "A fin with a shoulder, elbow and wrist", at: [0.44, -0.10],
          note: "Inside the fin: one humerus, then radius and ulna, then wrist bones, in your arm's order. On the end, fin rays, not fingers.",
        },
        {
          id: "breathing", name: "Gills and air-breathing both", at: [-0.46, 0.12],
          note: "It kept gills and gill covers, and has large spiracles on top of the head. In living lungfish those take air down to lungs.",
        },
        {
          id: "ribs", name: "Ribs that can hold a body up", at: [0.42, 0.30],
          note: "Broad overlapping ribs, not the thin hoops of a fish: strong enough to stop the chest collapsing out of water.",
        },
        {
          id: "prediction", name: "Why it was found at all", at: [0, 0.50],
          note: "Lobe-fins are known at 385 Ma, four-legged animals at 365. A team searched 375-million-year rock and dug for four summers.",
        },
      ],
    },
  ],
};

export const g8f2FishWithAWrist = buildSim(FISH_WITH_A_WRIST);

/* ---------------------------------------------------------------- *
 * F2.4 — Placing fossils on the time scale
 * ---------------------------------------------------------------- */

const DATING_THE_BED: ArchetypeSpec = {
  id: "g8f2-dating-the-bed",
  title: "Putting a Date on the Bed",
  tagline: "Count the potassium left in a crystal and read the age straight off the clock.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4", "MS-LS4-1"] },
  learningGoals: [
    "Use a half-life to work out how much of a parent isotope is left after a given time.",
    "Choose a dating method whose half-life suits the age being measured.",
  ],
  misconceptions: [
    "Carbon-14 is used to date dinosaur bones",
    "A radioactive clock can be reset or slowed by heat and pressure",
  ],
  specimens: [
    {
      id: "crystal", name: "Potassium-40 left in a crystal of volcanic ash",
      art: { art: "glassware", which: "testTube", level: 0.9, color: "#c9a227" },
    },
  ],
  variables: [
    {
      key: "ageMa", label: "Age of the ash bed", unit: "Ma",
      min: 0, max: 4500, step: 10, default: 375,
    },
  ],
  /*
   * Measured half-lives, no rounding for convenience:
   *   potassium-40 to argon-40 and calcium-40   1,251 Ma
   *   uranium-238 to lead-206                   4,468 Ma
   *   rubidium-87 to strontium-87              48,800 Ma
   *   carbon-14 to nitrogen-14                  5,730 years
   * The fraction of parent left after t is 2^(-t/halfLife). Only 10.48 per
   * cent of potassium-40 decays down the argon branch, so the argon-to-
   * potassium ratio a mass spectrometer actually reads is 0.1048 times the
   * amount that has decayed, divided by the amount left.
   */
  measure: (v) => {
    const kLeft = Math.pow(2, -v.ageMa / 1251);
    const uLeft = Math.pow(2, -v.ageMa / 4468);
    const rbLeft = Math.pow(2, -v.ageMa / 48800);
    return {
      potassium40LeftPercent: kLeft * 100,
      uranium238LeftPercent: uLeft * 100,
      rubidium87LeftPercent: rbLeft * 100,
      argonToPotassiumRatio: (0.1048 * (1 - kLeft)) / kLeft,
      leadToUraniumRatio: (1 - uLeft) / uLeft,
      halfLivesOfPotassium: v.ageMa / 1251,
      carbon14HalfLivesElapsed: (v.ageMa * 1e6) / 5730,
    };
  },
  plot: {
    x: "ageMa", y: "potassium40LeftPercent",
    xLabel: "Age of the rock (Ma)", yLabel: "Potassium-40 remaining (%)",
  },
  /*
   * The tube is the crystal. The level is the potassium-40 still in it, so it
   * falls by half every 1,251 million years and is down to 8 per cent by the
   * age of the Earth. The colour drains from potassium yellow to the grey of a
   * crystal that is now mostly daughter product, and the bubbles are the argon
   * gas the decay has made, which is the thing the laboratory actually counts.
   */
  drive: ({ f }) => {
    const left = f.potassium40LeftPercent / 100;
    return {
      level: clamp(left, 0.04, 1),
      color: mix("#c9a227", "#8a93a6", 1 - left),
      bubbles: clamp((1 - left) * 0.9, 0, 1),
    };
  },
};

export const g8f2DatingTheBed = buildSim(DATING_THE_BED);

/* ---------------------------------------------------------------- *
 * F2.5 — Analysing fossil-record data
 * ---------------------------------------------------------------- */

const GAP_IN_THE_RECORD: ArchetypeSpec = {
  id: "g8f2-gap-in-the-record",
  title: "The Gap in the Record",
  tagline: "Two sections of the same 30 million years. One of them is missing a chunk, and it lies to you.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-1", "MS-ESS1-4"] },
  learningGoals: [
    "Explain why a fossil's last appearance in a section can be earlier than its real extinction.",
    "Use sediment accumulation rate to convert a thickness of rock into a span of time.",
  ],
  misconceptions: [
    "A rock section records every year that passed",
    "The lowest fossil of a species is the moment that species appeared on Earth",
  ],
  specimens: [
    {
      id: "complete", name: "Complete section: every million years is there",
      because: "At 100 m of sediment per million years, 30 million years of history stands 3,000 m thick. The topmost ammonite here sits exactly at the boundary bed, so the last appearance and the real extinction are the same date.",
      art: { art: "landform", which: "strata" },
    },
    {
      id: "gapped", name: "Section with an unconformity: time is missing",
      because: "The sea fell and the surface was eroded, so those years are gone. The topmost ammonite now sits below the boundary, and the record reports the extinction early by exactly the missing time.",
      art: { art: "landform", which: "strata" },
    },
  ],
  variables: [
    {
      key: "missingMyr", label: "Time missing at the unconformity", unit: "Myr",
      min: 0, max: 20, step: 0.5, default: 6,
    },
    {
      key: "accumulation", label: "Sediment accumulation rate", unit: "m/Myr",
      min: 10, max: 200, step: 5, default: 100,
    },
  ],
  /*
   * Thickness is time multiplied by accumulation rate, which is the only
   * arithmetic a field geologist needs to turn a measured section into a span
   * of years. The interval on offer is 30 million years, ending at the
   * Cretaceous boundary 66 million years ago. Whatever the gap removes is
   * subtracted from both the thickness and the apparent range of the fossil:
   * this is the Signor-Lipps effect in its simplest form, and it is why a
   * single section always makes an extinction look more gradual and earlier
   * than it was.
   */
  measure: (v) => {
    const spanMyr = 30;
    const recorded = spanMyr - v.missingMyr;
    return {
      completeThicknessM: spanMyr * v.accumulation,
      gappedThicknessM: recorded * v.accumulation,
      recordedPercent: (recorded / spanMyr) * 100,
      trueExtinctionMa: 66,
      apparentLastAppearanceMa: 66 + v.missingMyr,
      datingErrorMyr: v.missingMyr,
      rockMissingM: v.missingMyr * v.accumulation,
    };
  },
  /*
   * Both columns are drawn at the thickness their accumulation rate gives
   * them, so turning the rate down thins them together. The gap then takes its
   * bite out of the second column only: at 20 million years missing it stands
   * a third the height of its neighbour, and the fossil at its top is 20
   * million years short of the truth.
   */
  drive: ({ v, f, index }) => {
    const rate = clamp(0.55 + (v.accumulation / 200) * 0.5, 0.55, 1.05);
    if (index === 0) return { scale: rate };
    return { scale: clamp(rate * (f.recordedPercent / 100), 0.2, 1.05) };
  },
};

export const g8f2GapInTheRecord = buildSim(GAP_IN_THE_RECORD);
