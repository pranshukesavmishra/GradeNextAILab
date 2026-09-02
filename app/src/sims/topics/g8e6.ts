import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E6 — Dating Earth's history.
 *
 * Five simulations, one per subtopic:
 *
 *   E6.1  g8e6-which-question    relative vs absolute dating   (sort)
 *   E6.2  g8e6-half-then-half    radiometric dating            (investigate)
 *   E6.3  g8e6-bracket-the-bed   combining the two kinds       (compare)
 *   E6.4  g8e6-four-and-a-half   the 4.6-billion-year figure   (process)
 *   E6.5  g8e6-carbon-a-dinosaur evaluating a dating claim     (compare)
 *
 * Half-lives are the measured ones: carbon-14 5 730 years, potassium-40
 * 1.248 billion, uranium-238 4.468 billion, rubidium-87 49.7 billion. Earth is
 * 4.54 +/- 0.05 billion years old and the solar system 4.567 billion, from
 * lead-lead isochrons on meteorites.
 */

/** Blend two hex colours; k = 0 gives a, k = 1 gives b. */
function mix(a: string, b: string, k: number): string {
  const c = k < 0 ? 0 : k > 1 ? 1 : k;
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const hx = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hx(ch(a, 0) + (ch(b, 0) - ch(a, 0)) * c)}${
    hx(ch(a, 1) + (ch(b, 1) - ch(a, 1)) * c)}${
    hx(ch(a, 2) + (ch(b, 2) - ch(a, 2)) * c)}`;
}

/** Round to `n` steps, so a driven colour does not rebuild geometry per frame. */
const stepped = (x: number, n: number) => Math.round(x * n) / n;

/** Where the stage rail has got to, rebuilt from the clock. */
const railPhase = (t: number) => (t * 0.096) % 1;

/* ---------------------------------------------------------------- *
 * E6.1 — Relative vs absolute dating
 * ---------------------------------------------------------------- */

const WHICH_QUESTION: ArchetypeSpec = {
  id: "g8e6-which-question",
  title: "Older Than, or How Many Years?",
  tagline: "Six pieces of evidence. Each answers one of the two questions, and only one.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Distinguish relative dating, which gives an order, from absolute dating, which gives a number of years.",
    "Match a piece of geological evidence to the kind of age it can support.",
  ],
  misconceptions: [
    "Relative dating is just guessing",
    "Every rock can be radiometrically dated",
  ],
  categories: [
    { id: "relative", name: "Relative age", hint: "older or younger, but no number" },
    { id: "absolute", name: "Absolute age", hint: "an answer in years, with an uncertainty" },
  ],
  specimens: [
    { id: "superposition", name: "Bed 3 lies on top of bed 4", category: "relative",
      because: "Superposition. It fixes the order beyond argument and gives no number at all: bed 3 is younger than bed 4, whether the gap is a thousand years or a hundred million.",
      art: { art: "landform", which: "strata" } },
    { id: "dyke", name: "A dyke cuts through five beds", category: "relative",
      because: "Cross-cutting relationships. The dyke must be younger than everything it cuts. Date the dyke and that relative statement turns into a minimum age for all five beds — which is how the two methods are used together.",
      art: { art: "landform", which: "igneous" } },
    { id: "zircon", name: "Zircon crystals, uranium-lead", category: "absolute",
      because: "Zircon takes uranium into its lattice when it crystallises and rejects lead, so all the lead found in it was made by decay. Uranium-238 has a half-life of 4.468 billion years, and good grains date to better than 0.1 per cent.",
      art: { art: "sphere", color: "#c3aee8", radius: 0.44 } },
    { id: "charcoal", name: "Charcoal from a hearth, carbon-14", category: "absolute",
      because: "Carbon-14 has a half-life of 5 730 years, so after 55 000 years less than 0.13 per cent is left and the method runs out. Inside that window it dates a fire to within a few decades.",
      art: { art: "glassware", which: "testTube", level: 0.55, color: "#4a63f0" } },
    { id: "ammonites", name: "The same ammonites in two cliffs", category: "relative",
      because: "Correlation with index fossils. A species that lived worldwide for a short time says two beds 300 km apart are the same age as each other — still without saying what that age is.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "varves", name: "Counting 4 500 annual layers", category: "absolute",
      because: "Varves are pairs of light summer and dark winter layers in a lake bed, one pair a year. Counting them is as absolute as a tree ring count and needs no isotopes at all.",
      art: { art: "landform", which: "seafloor" } },
  ],
  /*
   * The two families behave differently on the bench. Evidence that gives an
   * order sits still and stacked: it is about position, and position does not
   * tick. Evidence that gives a number is running a clock, so it pulses gently
   * — the decay is happening while you look at it.
   */
  drive: ({ specimen, t }) => specimen.category === "relative"
    ? { rate: 0, tilt: 0.26 }
    : { scale: 1 + 0.05 * Math.sin(t * 1.6), rate: 1.2 },
};

/* ---------------------------------------------------------------- *
 * E6.2 — Radiometric dating, conceptually
 * ---------------------------------------------------------------- */

/** Measured half-lives, in years, for the four isotopes the control selects. */
const HALF_LIVES = [5730, 1.248e9, 4.468e9, 4.97e10];

const HALF_THEN_HALF: ArchetypeSpec = {
  id: "g8e6-half-then-half",
  title: "Half, Then Half of What Is Left",
  tagline: "Drain a sample of parent atoms one half-life at a time and read the age off the leftovers.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Explain a half-life as the time for half the remaining parent atoms to decay, whatever is left.",
    "Calculate an age from the fraction of parent atoms remaining and the isotope's half-life.",
  ],
  misconceptions: [
    "After two half-lives nothing is left",
    "Decay speeds up or slows down with temperature or pressure",
  ],
  specimens: [{
    id: "sample", name: "The parent atoms still in the sample",
    art: { art: "glassware", which: "testTube", level: 0.5, color: "#4a63f0" },
  }],
  variables: [
    { key: "halfLives", label: "Half-lives elapsed", min: 0, max: 10, step: 0.1, default: 3 },
    { key: "isotope", label: "Isotope: 1 C-14, 2 K-40, 3 U-238, 4 Rb-87", min: 1, max: 4, step: 1, default: 1 },
  ],
  /*
   * Exponential decay, exactly: the fraction of parent left after n half-lives
   * is 0.5 to the power n, so 50 per cent after one, 25 after two, 12.5 after
   * three, and 0.098 per cent after ten. Nothing about the sample changes that
   * rate — not heat, not pressure, not chemistry — which is why it works as a
   * clock. The four half-lives are the measured ones: carbon-14 at 5 730
   * years dates the last 55 000; potassium-40 at 1.248 billion dates volcanic
   * ash; uranium-238 at 4.468 billion dates zircons back to the Hadean;
   * rubidium-87 at 49.7 billion dates whole meteorites.
   */
  measure: (v) => {
    const halfLifeYears = HALF_LIVES[Math.max(0, Math.min(3, Math.round(v.isotope) - 1))];
    const parent = Math.pow(0.5, v.halfLives);
    return {
      parentLeftPercent: parent * 100,
      daughterMadePercent: (1 - parent) * 100,
      halfLifeYears,
      ageYears: v.halfLives * halfLifeYears,
      ageMillionYears: (v.halfLives * halfLifeYears) / 1e6,
      atomsLeftPerMillion: parent * 1e6,
    };
  },
  plot: {
    x: "halfLives", y: "parentLeftPercent",
    xLabel: "Half-lives elapsed", yLabel: "Parent atoms left (%)",
  },
  /*
   * The tube holds the parent atoms and nothing else, so it drains along the
   * decay curve: half gone at one half-life, a quarter left at two, and after
   * ten a millilitre in a litre. Its colour runs from parent blue to daughter
   * amber as the sample changes hands atom by atom — every atom that leaves
   * the tube is still in the rock, just as a different element.
   */
  drive: ({ f }) => ({
    level: Math.max(0.015, f.parentLeftPercent / 100),
    color: mix("#4a63f0", "#e0a33f", stepped(f.daughterMadePercent / 100, 12)),
  }),
};

/* ---------------------------------------------------------------- *
 * E6.3 — Combining relative and absolute evidence
 * ---------------------------------------------------------------- */

const BRACKET_THE_BED: ArchetypeSpec = {
  id: "g8e6-bracket-the-bed",
  title: "One Ash Bed Dates the Whole Cliff",
  tagline: "Put a number on one bed and watch it spread up and down the column it sits in.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Combine superposition with one radiometric date to bracket the ages of undated beds.",
    "Explain why sedimentary beds are usually dated through the volcanic layers between them.",
  ],
  misconceptions: [
    "Every layer in a cliff can be radiometrically dated directly",
    "Relative and absolute dating are rival methods",
  ],
  variables: [
    { key: "ashAgeMa", label: "Age of the ash bed", unit: "million years", min: 1, max: 540, step: 1, default: 66 },
  ],
  /*
   * Sandstone cannot be radiometrically dated: its grains are older than the
   * bed they sit in, so the clock in them started in a different rock. Ash can
   * be, because its zircons crystallised in the eruption itself. So a dated
   * ash bed hands its number to its neighbours through superposition — every
   * bed below is older, every bed above is younger. The uranium-238 figure is
   * the real one: after 66 million years 98.98 per cent of the parent is still
   * there, and it is that last one per cent that carries the date.
   */
  measure: (v) => ({
    ashAgeMa: v.ashAgeMa,
    bedsBelowOlderThanMa: v.ashAgeMa,
    bedsAboveYoungerThanMa: v.ashAgeMa,
    uranium238LeftPercent: 100 * Math.pow(0.5, (v.ashAgeMa * 1e6) / 4.468e9),
    leadMadePerMillionAtoms: (1 - Math.pow(0.5, (v.ashAgeMa * 1e6) / 4.468e9)) * 1e6,
    typicalUncertaintyMa: v.ashAgeMa * 0.001,
  }),
  specimens: [
    {
      id: "column", name: "What the layers say on their own",
      because: "Superposition gives an order and nothing else: bed 3 above the ash is younger than the ash, bed 5 below it is older. A complete, certain, entirely numberless statement.",
      art: { art: "landform", which: "strata" },
    },
    {
      id: "zircon", name: "What one zircon crystal adds",
      because: "A grain that crystallised in the eruption, took uranium and rejected lead. At 66.0 million years 98.98 per cent of its uranium-238 is left, and the 1.02 per cent that has become lead is the whole measurement.",
      art: { art: "sphere", color: "#c3aee8", radius: 0.44 },
    },
  ],
  /*
   * Both sides answer the same date. The column grows with the logarithm of
   * the age, because that is how much record the number now covers — a 1 Ma
   * ash bracket says almost nothing, a 540 Ma one dates the whole Phanerozoic.
   * The zircon darkens as its lead builds up, and it too grows, because an
   * older grain has had longer to accumulate the daughter atoms that are being
   * counted. The base of the column is pinned so it grows upward from the
   * ground rather than out of the middle of the air.
   */
  drive: ({ f, index }) => {
    const k = Math.log10(Math.max(1, f.ashAgeMa)) / Math.log10(540);
    if (index === 0) {
      const scale = 0.5 + 0.8 * k;
      return { scale, offset: [0, 1 - scale] };
    }
    return {
      scale: 0.55 + 0.6 * k,
      color: mix("#efeaf7", "#6d2f97", stepped(k, 12)),
    };
  },
};

/* ---------------------------------------------------------------- *
 * E6.4 — The 4.6-billion-year figure
 * ---------------------------------------------------------------- */

const FOUR_AND_A_HALF: ArchetypeSpec = {
  id: "g8e6-four-and-a-half",
  title: "Where 4.54 Billion Came From",
  tagline: "Five separate lines of evidence, none of them from Earth's oldest rock, all landing on the same number.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Explain why Earth's oldest rocks give a minimum age, not the age of Earth.",
    "Describe how meteorite dating fixes the age of the whole solar system, Earth included.",
  ],
  misconceptions: [
    "Earth's age was measured on Earth's oldest rock",
    "The 4.6-billion figure is a rough guess with no error bar",
  ],
  specimens: [{
    id: "earth", name: "Earth, from accretion to today",
    art: { art: "planet", color: "#4a7fc1", atmosphere: "#a8d0ff" },
  }],
  stages: [
    { name: "Oldest rock", at: 0,
      caption: "The Acasta gneiss in Canada dates to 4.03 billion years, and the Nuvvuagittuq belt may reach 4.28. Plate tectonics has recycled everything older, so this is a floor, not the answer." },
    { name: "Oldest crystal", at: 0.25,
      caption: "Zircon grains from the Jack Hills in Australia date to 4.404 billion years — older than any surviving rock, and their oxygen isotopes say liquid water was already there." },
    { name: "Moon rocks", at: 0.5,
      caption: "Apollo samples run from 3.16 to 4.51 billion years. The Moon has no plate tectonics and almost no erosion, so its record survives where Earth's does not." },
    { name: "Meteorites", at: 0.75,
      caption: "Clair Patterson's 1956 lead-lead isochron on the Canyon Diablo meteorite gave 4.55 +/- 0.07 billion years. Calcium-aluminium inclusions in Allende now date the first solids at 4.567 billion." },
    { name: "The figure", at: 1,
      caption: "Earth: 4.54 +/- 0.05 billion years. Five independent clocks in three different places, and the uncertainty is about one per cent." },
  ],
  /*
   * The globe runs the story the rail is telling. It starts as a small,
   * glowing lump of accreting rock at 1 700 K, grows toward full size in the
   * first hundred million years, and cools from molten orange through basalt
   * grey to the blue and white of an ocean planet. Volume goes as the cube of
   * the radius, so the drawn width follows the cube root of how much of Earth
   * has accreted — a body a tenth grown is not a tenth as wide but 46 per cent.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const grown = Math.min(1, 0.06 + u * 1.5);
    return {
      scale: Math.cbrt(grown) * 1.15,
      color: mix("#ff7a2f", "#4a7fc1", stepped(Math.min(1, u * 1.35), 12)),
      rate: 1.4 - u,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E6.5 — Evaluating a dating claim
 * ---------------------------------------------------------------- */

const CARBON_A_DINOSAUR: ArchetypeSpec = {
  id: "g8e6-carbon-a-dinosaur",
  title: "Can Carbon-14 Date a Dinosaur?",
  tagline: "Two clocks on the same sample. Wind the age up and watch one of them run out.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-4"] },
  learningGoals: [
    "Choose a dating method by matching its half-life to the age being measured.",
    "Evaluate a dating claim by asking whether the method could detect anything at that age.",
  ],
  misconceptions: [
    "Carbon dating is used on dinosaur bones",
    "Any radioactive clock works over any span of time",
  ],
  variables: [
    {
      key: "logAge", label: "Age of the sample: ten to the power", unit: "years",
      min: 2, max: 9.7, step: 0.1, default: 4,
    },
  ],
  /*
   * The same exponential, two half-lives, and the honest consequence. Carbon-14
   * at 5 730 years is down to 0.13 per cent after ten half-lives — 57 300 years
   * — and below that even accelerator mass spectrometry cannot tell it from
   * contamination, so 55 000 years is the working limit. A Tyrannosaurus at
   * 66 million years is 11 500 half-lives past that: the parent left is 10 to
   * the power -3465, which is not a small number, it is no atoms at all in a
   * sample the mass of the observable universe. Uranium-238 at 4.468 billion
   * years has only got through 1.5 per cent of its first half-life in the same
   * 66 million, which is exactly what makes it the right tool.
   */
  measure: (v) => {
    const years = Math.pow(10, v.logAge);
    return {
      ageYears: years,
      ageMillionYears: years / 1e6,
      carbon14LeftPercent: 100 * Math.pow(0.5, years / 5730),
      uranium238LeftPercent: 100 * Math.pow(0.5, years / 4.468e9),
      carbon14HalfLivesElapsed: years / 5730,
      withinCarbon14Range: years <= 55000 ? 1 : 0,
    };
  },
  specimens: [
    {
      id: "c14", name: "Carbon-14, half-life 5 730 years",
      because: "Good for charcoal, bone and cloth younger than about 55 000 years. Past that the parent is under 0.13 per cent and the measurement is contamination, not carbon.",
      art: { art: "glassware", which: "testTube", level: 0.7, color: "#4a63f0" },
    },
    {
      id: "u238", name: "Uranium-238, half-life 4.468 billion years",
      because: "Barely started even at 66 million years, with 98.98 per cent of the parent still there. That is why the K-Pg boundary is dated to 66.043 +/- 0.043 million years by uranium-lead, and never by carbon.",
      art: { art: "glassware", which: "testTube", level: 0.98, color: "#3c9455" },
    },
  ],
  /*
   * Two tubes, one slider. The carbon-14 tube empties in the first tenth of
   * the range and then turns warning red: past 55 000 years there is nothing
   * left to measure, and any date quoted from it is a claim about noise. The
   * uranium tube is still 46 per cent full at 5 billion years, which is what a
   * clock built for this job looks like.
   */
  drive: ({ f, index }) => index === 0
    ? {
        level: Math.max(0.012, f.carbon14LeftPercent / 100),
        color: f.withinCarbon14Range ? "#4a63f0" : "#c0392b",
      }
    : {
        level: Math.max(0.012, f.uranium238LeftPercent / 100),
        color: "#3c9455",
      },
};

export const g8e6WhichQuestion = buildSim(WHICH_QUESTION);
export const g8e6HalfThenHalf = buildSim(HALF_THEN_HALF);
export const g8e6BracketTheBed = buildSim(BRACKET_THE_BED);
export const g8e6FourAndAHalf = buildSim(FOUR_AND_A_HALF);
export const g8e6CarbonADinosaur = buildSim(CARBON_A_DINOSAUR);
