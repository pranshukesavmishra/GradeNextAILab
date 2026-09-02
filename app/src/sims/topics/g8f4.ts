import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F4 — Natural selection.
 *
 * Five simulations, one per subtopic:
 *
 *   F4.1  g8f4-breeders-equation       variation, survival, heritability  (investigate)
 *   F4.2  g8f4-manchester-moths        a fully worked real case           (investigate)
 *   F4.3  g8f4-who-leaves-more         differential survival and breeding (compare)
 *   F4.4  g8f4-population-not-you      selection acts on populations      (sort)
 *   F4.5  g8f4-build-the-explanation   an evidence-based explanation      (assemble)
 *
 * Two real data sets carry the topic. Daphne Major: the medium ground finch
 * had a mean beak depth of 9.42 mm before the 1977 drought, a heritability of
 * 0.74, and the 15 per cent of birds that survived had beaks 0.63 mm deeper,
 * so the breeder's equation R = h^2 S predicts 0.47 mm — which is what the
 * next generation measured. Manchester: one melanic peppered moth in 1848,
 * 98 per cent melanic by 1895, one generation a year, which a 30 per cent
 * per-generation advantage reproduces almost exactly.
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
 * F4.1 — Variation, survival and heritability
 * ---------------------------------------------------------------- */

const BREEDERS_EQUATION: ArchetypeSpec = {
  id: "g8f4-breeders-equation",
  title: "How Much of It Comes Back",
  tagline: "The drought picked the deep beaks. How much of that pick do the chicks inherit?",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-4"] },
  learningGoals: [
    "Explain that selection only changes a population if the trait is inherited.",
    "Use R = h squared x S to predict the shift in a population's mean in one generation.",
  ],
  misconceptions: [
    "Any trait the environment selects will be passed on",
    "Selection changes an individual's traits",
  ],
  specimens: [
    { id: "finch", name: "Medium ground finch, Geospiza fortis, Daphne Major", art: { art: "creature", which: "bird" } },
  ],
  variables: [
    {
      key: "heritability", label: "Heritability of beak depth (h squared)",
      min: 0, max: 1, step: 0.01, default: 0.74,
    },
    {
      key: "selection", label: "Selection differential S", unit: "mm",
      min: 0, max: 1.2, step: 0.01, default: 0.63,
    },
  ],
  /*
   * The breeder's equation, R = h^2 S, and nothing else.
   *
   * S is how far the survivors' mean sits above the mean of the population
   * before selection; h^2 is the share of the variation in the trait that is
   * passed from parent to offspring. Their product is R, the shift in the
   * population's mean in the next generation. On Daphne Major in 1977 the
   * numbers were h^2 = 0.74 and S = 0.63 mm, from a starting mean beak depth
   * of 9.42 mm, and R = 0.47 mm is what the chicks of 1978 actually showed.
   *
   * Set the heritability to zero and the survivors can be as extreme as you
   * like: R is zero and the population is exactly where it started.
   */
  measure: (v) => {
    const response = v.heritability * v.selection;
    return {
      responseMm: response,
      meanBeforeMm: 9.42,
      meanAfterMm: 9.42 + response,
      meanAfterFiveGenerationsMm: 9.42 + 5 * response,
      shareOfSelectionKeptPercent: v.selection > 0 ? (response / v.selection) * 100 : 0,
      generationsToGainOneMm: response > 0 ? 1 / response : 0,
    };
  },
  plot: {
    x: "heritability", y: "responseMm",
    xLabel: "Heritability (h squared)", yLabel: "Shift in the next generation (mm)",
  },
  /*
   * The bird stands where the population's mean beak depth now is, and slides
   * to the right as that mean moves. With no heritability it does not budge,
   * whatever the drought did to the survivors — which is the whole lesson.
   * Its drawn size is the honest ratio of new mean to old, a nine per cent
   * change at the far corner of the controls, so the movement carries the
   * message and the size does not exaggerate it.
   */
  drive: ({ f }) => ({
    offset: [clamp(-0.5 + (f.responseMm / 0.75) * 1.0, -0.5, 0.6), 0],
    scale: f.meanAfterMm / 9.42,
  }),
};

export const g8f4BreedersEquation = buildSim(BREEDERS_EQUATION);

/* ---------------------------------------------------------------- *
 * F4.2 — A fully worked real case
 * ---------------------------------------------------------------- */

const MANCHESTER_MOTHS: ArchetypeSpec = {
  id: "g8f4-manchester-moths",
  title: "The Manchester Moths",
  tagline: "One dark moth in 1848. Ninety-eight per cent dark by 1895. Find the advantage that does it.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-4", "MS-LS4-6"] },
  learningGoals: [
    "Trace a real change in a population's traits to a measured difference in survival.",
    "Show that a small per-generation advantage compounds into a complete change in decades.",
  ],
  misconceptions: [
    "The moths turned black because of the soot on them",
    "A trait has to be a huge advantage to take over a population",
  ],
  specimens: [
    {
      id: "trap", name: "The dark moths in tonight's trap",
      art: { art: "glassware", which: "beaker", level: 0.1, color: "#ded8c6" },
    },
  ],
  variables: [
    {
      key: "advantage", label: "Breeding success of a dark moth, times that of a pale one",
      min: 1, max: 2, step: 0.01, default: 1.3,
    },
    {
      key: "generations", label: "Generations since 1848 (one a year)",
      min: 0, max: 150, step: 1, default: 47,
    },
  ],
  /*
   * One locus, melanism dominant, discrete generations, random mating —
   * the standard textbook model, run forward one generation at a time:
   *   p' = p w / (w (1 - q^2) + q^2)
   * where w is the melanic phenotype's fitness relative to the pale one.
   *
   * It starts where Manchester started: melanic moths one per cent of the
   * catch in 1848, so q^2 = 0.99 and the melanic allele is at p = 0.005.
   * Biston betularia has exactly one generation a year, so a generation is a
   * year, and 1895 is generation 47. At a 30 per cent advantage the model
   * gives 97 per cent melanic in 1895 against the 98 per cent recorded — and
   * this is the calculation Haldane first did in 1924, the first time anyone
   * had put a number on natural selection in the wild.
   */
  measure: (v) => {
    let q = Math.sqrt(0.99);
    let p = 1 - q;
    const n = Math.round(v.generations);
    for (let i = 0; i < n; i++) {
      const meanFitness = v.advantage * (1 - q * q) + q * q;
      p = (p * v.advantage) / meanFitness;
      q = 1 - p;
    }
    const melanic = 1 - q * q;
    return {
      melanicPercent: melanic * 100,
      palePercent: (1 - melanic) * 100,
      melanicAlleleFrequency: p,
      selectionAgainstPale: 1 - 1 / v.advantage,
      year: 1848 + n,
    };
  },
  plot: {
    x: "generations", y: "melanicPercent",
    xLabel: "Generations since 1848", yLabel: "Moths that are melanic (%)",
  },
  /*
   * The jar is the night's catch, and what is in it is the dark moths. It
   * fills as they take over the wood and its colour runs from the pale
   * lichen-speckled typica to the soot-black carbonaria, so at an advantage of
   * 1.0 it stays a thin pale trace at the bottom for a hundred and fifty years
   * and at 2.0 it is full and black inside twenty.
   */
  drive: ({ f }) => {
    const melanic = clamp(f.melanicPercent / 100, 0, 1);
    return {
      level: clamp(melanic, 0.03, 0.95),
      color: mix("#ded8c6", "#241f1a", melanic),
    };
  },
};

export const g8f4ManchesterMoths = buildSim(MANCHESTER_MOTHS);

/* ---------------------------------------------------------------- *
 * F4.3 — Differential survival and reproduction
 * ---------------------------------------------------------------- */

const WHO_LEAVES_MORE: ArchetypeSpec = {
  id: "g8f4-who-leaves-more",
  title: "Who Leaves More Young",
  tagline: "A hundred pale moths and a hundred dark ones, released into the same wood.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-4"] },
  learningGoals: [
    "Define fitness as surviving and breeding, not as strength or size.",
    "Calculate a selection coefficient from two measured survival rates.",
  ],
  misconceptions: [
    "Fitness means being the strongest or the fastest",
    "The fitter variety survives and the other one dies out immediately",
  ],
  specimens: [
    {
      id: "pale", name: "Pale morph: 13.0 per cent recaptured",
      because: "Kettlewell released marked moths in a soot-blackened Birmingham wood in 1953 and recaptured 13.0 per cent of the pale ones. On black bark a pale moth is a target, and the birds were filmed taking them.",
      art: { art: "sphere", color: "#ded8c6", radius: 0.46 },
    },
    {
      id: "dark", name: "Dark morph: the recapture rate you set",
      because: "In the same wood he recaptured 27.5 per cent of the dark ones — more than twice as many. In unpolluted Dorset the result reversed exactly: 12.5 per cent of pale moths came back and 6.3 per cent of dark ones.",
      art: { art: "sphere", color: "#241f1a", radius: 0.46 },
    },
  ],
  variables: [
    {
      key: "darkSurvival", label: "Dark moths recaptured", unit: "%",
      min: 0, max: 100, step: 0.5, default: 27.5,
    },
    {
      key: "eggs", label: "Eggs laid per surviving female",
      min: 50, max: 400, step: 10, default: 200,
    },
  ],
  /*
   * Fitness is survival multiplied by fecundity, and nothing else. Both morphs
   * lay the same number of eggs, so every difference between the columns comes
   * from who was still alive to lay them.
   *
   * The pale recapture rate is Kettlewell's measured 13.0 per cent. Relative
   * fitness of the pale morph is its survival divided by the dark morph's, and
   * the selection coefficient is one minus that. At Kettlewell's 27.5 per cent
   * for the dark form, the pale morph's relative fitness is 0.47 and s = 0.53
   * — a huge selection pressure, and exactly the kind that changes a county in
   * fifty years.
   */
  measure: (v) => {
    const paleSurvival = 13.0;
    const paleBreeders = 100 * (paleSurvival / 100);
    const darkBreeders = 100 * (v.darkSurvival / 100);
    return {
      paleSurvivors: paleBreeders,
      darkSurvivors: darkBreeders,
      paleOffspring: paleBreeders * v.eggs,
      darkOffspring: darkBreeders * v.eggs,
      relativeFitnessOfPale: v.darkSurvival > 0 ? paleSurvival / v.darkSurvival : 1,
      selectionAgainstPale: v.darkSurvival > 0 ? 1 - paleSurvival / v.darkSurvival : 0,
    };
  },
  /*
   * Each column is drawn at the cube root of the number of eggs its morph
   * leaves behind, against Kettlewell's own figures as the reference size, so
   * a morph that leaves eight times as many young is twice as wide, not eight
   * times. Push the dark morph's survival to zero and it stops turning and
   * shrinks to a speck: that lineage has no descendants at all, which is the
   * only failure state natural selection has.
   */
  drive: ({ f, index }) => {
    const reference = 27.5 * 200;
    if (index === 0) return { scale: clamp(Math.cbrt(f.paleOffspring / reference), 0.2, 1.05) };
    const gone = f.darkOffspring <= 0;
    return {
      scale: clamp(Math.cbrt(f.darkOffspring / reference), 0.16, 1.05),
      rate: gone ? 0 : 1,
    };
  },
};

export const g8f4WhoLeavesMore = buildSim(WHO_LEAVES_MORE);

/* ---------------------------------------------------------------- *
 * F4.4 — Selection acts on populations, never on a lifetime
 * ---------------------------------------------------------------- */

const POPULATION_NOT_YOU: ArchetypeSpec = {
  id: "g8f4-population-not-you",
  title: "The Population Changed, Not the Individual",
  tagline: "Seven changes. Only some of them are natural selection, and it is not the obvious ones.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-4"] },
  learningGoals: [
    "Distinguish a change within one organism's lifetime from a change in a population across generations.",
    "Explain why an acquired characteristic cannot be inherited.",
  ],
  misconceptions: [
    "Organisms change themselves to fit their surroundings and pass the change on",
    "Individuals evolve",
  ],
  categories: [
    { id: "selection", name: "Natural selection", hint: "the mix in the population changed across generations" },
    { id: "lifetime", name: "A change in one lifetime", hint: "one body changed, and nothing was inherited" },
  ],
  specimens: [
    {
      id: "muscle", name: "A weightlifter's arms after two years of training", category: "lifetime",
      because: "The existing muscle fibres thicken. Not one base of DNA in his sperm changes, so his children start exactly where he did. This is the change Lamarck thought was inherited, and it is not.",
      art: { art: "body", which: "muscle" },
    },
    {
      id: "bacteria", name: "Bacteria in a patient after ten days of antibiotic", category: "selection",
      because: "No bacterium became resistant. Resistant cells were already in the population, at perhaps one in a million, thrown up by earlier mutations. The antibiotic killed everything else and left them the whole patient.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "giraffe", name: "A giraffe stretching for high leaves", category: "lifetime",
      because: "Stretching does not lengthen the neck, and even if it did, nothing in a stretched neck reaches the sex cells. What lengthened the lineage's necks was that shorter-necked ancestors left fewer young.",
      art: { art: "creature", which: "deer" },
    },
    {
      id: "finch", name: "Beak depth on Daphne Major after the 1977 drought", category: "selection",
      because: "No finch's beak grew a micron. 84 per cent of the birds died, the survivors happened to have beaks 0.63 mm deeper on average, and their chicks inherited about three-quarters of that difference.",
      art: { art: "creature", which: "bird" },
    },
    {
      id: "sunflower", name: "A sunflower leaning towards the window", category: "lifetime",
      because: "Auxin builds up on the shaded side and those cells lengthen. It takes hours, and it reverses in hours: turn the pot round and the plant turns back.",
      art: { art: "flora", which: "flower" },
    },
    {
      id: "moth", name: "Dark peppered moths in Manchester, 1848 to 1895", category: "selection",
      because: "Not one moth darkened during its life. Birds ate the pale ones off soot-black bark, the dark ones bred, and the proportion of dark moths in the population went from about 1 per cent to 98 in 47 generations.",
      art: { art: "creature", which: "butterfly" },
    },
    {
      id: "tan", name: "A person's skin tanning over the summer", category: "lifetime",
      because: "Melanocytes make more melanin in response to ultraviolet, and it fades by the following winter. It protects that one person, that one summer, and it is not passed to anybody.",
      art: { art: "body", which: "figure" },
    },
  ],
};

export const g8f4PopulationNotYou = buildSim(POPULATION_NOT_YOU);

/* ---------------------------------------------------------------- *
 * F4.5 — Constructing an evidence-based explanation
 * ---------------------------------------------------------------- */

const BUILD_THE_EXPLANATION: ArchetypeSpec = {
  id: "g8f4-build-the-explanation",
  title: "Build the Explanation",
  tagline: "Assemble the 1977 drought into an argument. Leave a piece out and it does not stand up.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-4"] },
  learningGoals: [
    "Construct an explanation of natural selection from evidence, reasoning and a tested prediction.",
    "Identify which piece of evidence each part of the argument rests on.",
  ],
  misconceptions: [
    "Saying 'the fittest survive' is an explanation",
    "Evolution cannot be observed happening",
  ],
  specimens: [
    {
      id: "daphne",
      name: "Daphne Major, 1977: the argument, piece by piece",
      art: { art: "creature", which: "bird" },
      parts: [
        {
          id: "observation", name: "The observation", at: [0, -0.5],
          note: "In 1977 no rain fell on Daphne Major for 551 days. The soft seeds ran out; only the large hard fruits of Tribulus were left.",
        },
        {
          id: "variation", name: "Variation was already there", at: [-0.44, -0.26],
          note: "The Grants had already measured every finch: beak depth ran from 7.5 to 11.5 mm, mean 9.42, long before the drought began.",
        },
        {
          id: "overproduction", name: "Far more are born than can live", at: [0.44, -0.10],
          note: "The population fell from about 1,200 birds to about 180 in one year. 84 per cent died, so the survivors are a sample.",
        },
        {
          id: "differential", name: "The survivors were not a random sample", at: [-0.44, 0.12],
          note: "Only a bird that could crack Tribulus ate. The survivors' mean beak was 0.63 mm deeper. That number, S, is the differential.",
        },
        {
          id: "heritable", name: "The trait is inherited", at: [0.44, 0.30],
          note: "Comparing chicks with their own parents gives h squared = 0.74 for beak depth: three-quarters of the difference is passed on.",
        },
        {
          id: "prediction", name: "The prediction, and the test", at: [0, 0.5],
          note: "0.74 x 0.63 = 0.47 mm deeper in the 1978 chicks, which is what they measured. The wet 1983 pushed it back the other way.",
        },
      ],
    },
  ],
};

export const g8f4BuildTheExplanation = buildSim(BUILD_THE_EXPLANATION);
