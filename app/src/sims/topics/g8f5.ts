import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F5 — Artificial selection and adaptation over time.
 *
 * Five simulations, one per subtopic:
 *
 *   F5.1  g8f5-teosinte-to-maize   selective breeding                      (compare)
 *   F5.2  g8f5-who-chose           the same mechanism, a human selector    (sort)
 *   F5.3  g8f5-technologies        technologies influencing inheritance    (process)
 *   F5.4  g8f5-across-generations  tracking a trait across generations     (investigate)
 *   F5.5  g8f5-hardy-weinberg      predicting future trait proportions     (investigate)
 *
 * F5.4 runs the standard recursion for selection against a recessive,
 * q' = q(1 - sq)/(1 - sq^2), which at s = 1 collapses to the textbook closed
 * form q(t) = q0 / (1 + t q0). F5.5 is Hardy-Weinberg with the cystic fibrosis
 * numbers a European genetics class actually uses: q = 0.02 gives q^2 = 1 in
 * 2,500 affected and 2pq = 1 in 26 carriers.
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
 * F5.1 — Selective breeding
 * ---------------------------------------------------------------- */

const TEOSINTE_TO_MAIZE: ArchetypeSpec = {
  id: "g8f5-teosinte-to-maize",
  title: "From a Weed to a Cob",
  tagline: "Keep seed from the best plants for nine thousand years and see what you end up holding.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-5"] },
  learningGoals: [
    "Explain how choosing which individuals breed changes a population's traits over generations.",
    "Show that a tiny per-generation gain compounds into an enormous change over enough generations.",
  ],
  misconceptions: [
    "Farmers invented new traits in crops",
    "Selective breeding needs modern technology to work",
  ],
  specimens: [
    {
      id: "wild", name: "Teosinte, the wild grass, left alone",
      because: "Two rows of about a dozen kernels on a 2.5 cm spike, each one locked inside a stone-hard case, on a plant that shatters its ear so the seed scatters. Nobody would call it food.",
      art: { art: "flora", which: "grass" },
    },
    {
      id: "selected", name: "The field the farmers kept seed from",
      because: "A modern cob is 20 cm long with about 800 naked kernels in 16 rows, on an ear that will not shatter. Five regions of the genome carry most of the difference, and every one of those alleles was already in teosinte.",
      art: { art: "flora", which: "grass" },
    },
  ],
  variables: [
    {
      key: "years", label: "Years of farmers keeping the best seed",
      min: 0, max: 9000, step: 100, default: 9000,
    },
  ],
  /*
   * Maize is annual, so a year is a generation, and the two endpoints are
   * measured: teosinte spikes carry about 10 kernels on 2.5 cm, a modern cob
   * about 800 on 20 cm, and the archaeology in the Balsas valley of Mexico
   * puts the start of the process about 9,000 years ago.
   *
   * A constant per-generation multiplier joins them, which is what a steady
   * selection pressure gives: 80^(1/9000) = 1.000487, a gain of under five
   * hundredths of one per cent a year. That is the whole point. Nobody in any
   * one lifetime could see it happening.
   */
  measure: (v) => {
    const f = v.years / 9000;
    return {
      kernelsPerEar: 10 * Math.pow(80, f),
      earLengthCm: 2.5 * Math.pow(8, f),
      kernelRows: 2 * Math.pow(8, f),
      generations: v.years,
      gainPerGenerationPercent: (Math.pow(80, 1 / 9000) - 1) * 100,
      timesTheWildPlant: Math.pow(80, f),
    };
  },
  /*
   * Both plants are drawn on one scale, at the cube root of the number of
   * kernels the ear carries, because kernels fill a volume: eighty times the
   * seed is a little over four times the width, not eighty times. The wild
   * grass on the left never moves. At year zero the two panels are identical,
   * which is exactly the honest picture — the field starts as the weed.
   */
  drive: ({ f, index }) => {
    if (index === 0) return { scale: clamp(Math.cbrt(10 / 800), 0.24, 1.02) };
    return { scale: clamp(Math.cbrt(f.kernelsPerEar / 800), 0.24, 1.02) };
  },
};

export const g8f5TeosinteToMaize = buildSim(TEOSINTE_TO_MAIZE);

/* ---------------------------------------------------------------- *
 * F5.2 — The same mechanism, a human selector
 * ---------------------------------------------------------------- */

const WHO_CHOSE: ArchetypeSpec = {
  id: "g8f5-who-chose",
  title: "Who Did the Choosing?",
  tagline: "Eight populations that changed. In half of them somebody decided; in half nobody did.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-5", "MS-LS4-4"] },
  learningGoals: [
    "Identify what does the selecting in natural and in artificial selection.",
    "Explain that the mechanism is identical and only the selector differs.",
  ],
  misconceptions: [
    "Artificial selection works by a different biological process",
    "If people caused the pressure, it cannot be natural selection",
  ],
  categories: [
    { id: "people", name: "People chose", hint: "somebody decided which individuals would breed" },
    { id: "nature", name: "Nature chose", hint: "surviving and breeding did the choosing" },
  ],
  specimens: [
    {
      id: "brassica", name: "Broccoli, kale, cabbage, kohlrabi and sprouts", category: "people",
      because: "Every one of them is Brassica oleracea, the same species, all bred from one wild coastal cabbage. Broccoli is its flower buds, kale its leaves, kohlrabi its swollen stem, Brussels sprouts its side buds.",
      art: { art: "flora", which: "shrub" },
    },
    {
      id: "resistance", name: "Antibiotic resistance on a hospital ward", category: "nature",
      because: "People created the pressure, but nobody chose which cells would breed. The drug did the choosing, and every step of the mechanism is natural selection: variation was already present, and the survivors bred.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "dogs", name: "Dogs, out of wolves", category: "people",
      because: "Every breed alive is Canis lupus. DNA dates the split from wolves to 20,000 to 40,000 years ago, and most of the 400-odd breeds are less than 200 years old — which is how fast choosing your own breeding stock works.",
      art: { art: "creature", which: "wolf" },
    },
    {
      id: "finches", name: "Deeper beaks on Daphne Major after 1977", category: "nature",
      because: "A 551-day drought left only hard Tribulus seeds. 84 per cent of the finches died and the survivors happened to be the deep-beaked ones. Nobody intended anything.",
      art: { art: "creature", which: "bird" },
    },
    {
      id: "dairy", name: "A Holstein cow giving 10,700 kg of milk a year", category: "people",
      because: "The average American dairy cow gave about 2,070 kg a year in 1940. Eighty years of choosing which bulls' daughters to keep multiplied that by more than five, on the same species and largely the same feed.",
      art: { art: "glassware", which: "beaker", level: 0.7, color: "#f4f1e6" },
    },
    {
      id: "moths", name: "Dark peppered moths in Manchester", category: "nature",
      because: "Soot blackened the bark, birds took the pale moths off it, and the dark ones bred. Nobody released a moth or picked a mate: the birds and the bark did all of it.",
      art: { art: "creature", which: "butterfly" },
    },
    {
      id: "maize", name: "Maize, out of teosinte", category: "people",
      because: "Nine thousand years of keeping seed from the plants with the most kernels on the least shattering ear. The alleles that did it, at tga1 and tb1, were already sitting in wild teosinte.",
      art: { art: "flora", which: "grass" },
    },
    {
      id: "rats", name: "Rats that ignore warfarin bait", category: "nature",
      because: "The VKORC1 variant that blocks warfarin existed in rats before warfarin was invented in 1948. Poisoning every rat without it handed those few the whole sewer, and resistant populations were reported within a decade.",
      art: { art: "creature", which: "mouse" },
    },
  ],
};

export const g8f5WhoChose = buildSim(WHO_CHOSE);

/* ---------------------------------------------------------------- *
 * F5.3 — Technologies influencing inheritance
 * ---------------------------------------------------------------- */

/** US average milk yield per cow, kg per year, at twenty-year intervals. */
const MILK_YEARS = [1940, 1960, 1980, 2000, 2020];
const MILK_KG = [2073, 3188, 5393, 8254, 10785];

const TECHNOLOGIES: ArchetypeSpec = {
  id: "g8f5-technologies",
  title: "Five Ways to Change What Gets Inherited",
  tagline: "Eighty years of new tools, and one cow's yearly milk goes up more than fivefold.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-5"] },
  learningGoals: [
    "Describe technologies that let people influence which traits are inherited.",
    "Explain that each technology changes the speed or precision of selection, not the mechanism.",
  ],
  misconceptions: [
    "Gene editing is the first technology that changed inheritance",
    "Technology creates traits that could never have arisen otherwise",
  ],
  specimens: [
    {
      id: "pail", name: "One cow, one year's milk",
      art: { art: "glassware", which: "beaker", level: 0.2, color: "#f4f1e6" },
    },
  ],
  variables: [
    { key: "year", label: "Year", min: 1940, max: 2020, step: 1, default: 2020 },
  ],
  /*
   * United States Department of Agriculture averages for milk per cow, in
   * kilograms per year: 2,073 in 1940, 3,188 in 1960, 5,393 in 1980, 8,254 in
   * 2000 and 10,785 in 2020, read straight off the published series and
   * interpolated between. It is the same species eating broadly the same
   * feed; what changed is who was allowed to be a parent, and how quickly
   * that could be decided.
   */
  measure: (v) => {
    const y = clamp(v.year, 1940, 2020);
    const i = clamp(Math.floor((y - 1940) / 20), 0, MILK_KG.length - 2);
    const frac = (y - MILK_YEARS[i]) / 20;
    const yieldKg = MILK_KG[i] + (MILK_KG[i + 1] - MILK_KG[i]) * frac;
    return {
      yieldKgPerYear: yieldKg,
      litresPerDay: (yieldKg / 365) / 1.03,
      timesThe1940Cow: yieldKg / 2073,
      gainKgPerYear: (MILK_KG[i + 1] - MILK_KG[i]) / 20,
    };
  },
  stages: [
    {
      name: "By eye", at: 0,
      caption: "Ten thousand years of keeping the calf of the best cow. It works, but a farmer can only judge what he can see standing in front of him.",
    },
    {
      name: "Progeny testing", at: 0.2,
      caption: "From the 1930s: a bull is ranked by his daughters' milk records, not by how he looks. Now the breeder is measuring what he is selecting for.",
    },
    {
      name: "Artificial insemination", at: 0.4,
      caption: "From the 1940s, with frozen semen from the 1950s. One outstanding bull can father a hundred thousand calves instead of fifty.",
    },
    {
      name: "Embryo transfer", at: 0.6,
      caption: "In cattle from 1951. The best cows release many eggs at once and ordinary cows carry them, so the top females leave many more calves too.",
    },
    {
      name: "Genomic selection", at: 0.8,
      caption: "Tens of thousands of DNA markers, standard from 2009, predict a calf's breeding value on the day it is born. The generation interval roughly halves.",
    },
    {
      name: "Gene editing", at: 1,
      caption: "CRISPR from 2012 can write a single base directly — hornless dairy cattle have been made this way. It changes the speed and the aim, never the mechanism: something still has to choose.",
    },
  ],
  /*
   * The pail is the readout, and it is the only readout a dairy farmer ever
   * cared about. It fills as the year runs on, from just under a fifth full in
   * 1940 to nearly brim-full in 2020 — the same animal, the same grass, five
   * times the milk, because of who was allowed to breed.
   */
  drive: ({ f }) => ({
    level: clamp(f.yieldKgPerYear / 12000, 0.05, 0.95),
    color: "#f6f3ea",
  }),
};

export const g8f5Technologies = buildSim(TECHNOLOGIES);

/* ---------------------------------------------------------------- *
 * F5.4 — Tracking a trait's proportion across generations
 * ---------------------------------------------------------------- */

const ACROSS_GENERATIONS: ArchetypeSpec = {
  id: "g8f5-across-generations",
  title: "Chasing a Recessive Out of a Population",
  tagline: "Stop the recessive form breeding entirely and it still will not go away. Find out why.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-5", "MS-LS4-6"] },
  learningGoals: [
    "Track an allele's frequency across generations under a known selection pressure.",
    "Explain why selection against a recessive slows down as the allele becomes rare.",
  ],
  misconceptions: [
    "A harmful recessive allele can be bred out of a population in a few generations",
    "Selection acts directly on alleles rather than on the organisms carrying them",
  ],
  specimens: [
    {
      id: "pool", name: "The gene pool: the dominant allele's share",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#8e5bc4" },
    },
  ],
  variables: [
    {
      key: "selection", label: "Selection against the recessive form (s)",
      min: 0, max: 1, step: 0.01, default: 0.5,
    },
    { key: "generations", label: "Generations", min: 0, max: 100, step: 1, default: 20 },
  ],
  /*
   * The standard one-locus recursion for selection against a recessive
   * homozygote, run forward from a starting allele frequency of q = 0.5:
   *   q' = q(1 - s q) / (1 - s q^2)
   * At s = 1 — no recessive homozygote ever breeds — this collapses to
   * q' = q/(1 + q) and so to the closed form q(t) = q0/(1 + t q0). From
   * q0 = 0.5 that gives 0.045 after 20 generations, 0.019 after 50, and
   * 0.0098 after 100: even total elimination of every affected individual
   * cannot finish the job, because the allele is hiding in the carriers.
   */
  measure: (v) => {
    let q = 0.5;
    const n = Math.round(v.generations);
    for (let i = 0; i < n; i++) q = (q * (1 - v.selection * q)) / (1 - v.selection * q * q);
    const p = 1 - q;
    return {
      recessiveAlleleFrequency: q,
      dominantAlleleFrequency: p,
      recessivePhenotypePercent: q * q * 100,
      carrierPercent: 2 * p * q * 100,
      allelesHiddenInCarriersPercent: q > 0 ? ((2 * p * q) / (2 * p * q + 2 * q * q)) * 100 : 0,
      startingPhenotypePercent: 25,
    };
  },
  plot: {
    x: "selection", y: "dominantAlleleFrequency",
    xLabel: "Selection against the recessive (s)", yLabel: "Dominant allele frequency (p)",
  },
  /*
   * The flask holds the gene pool and the level is the dominant allele's share
   * of it. With no selection it sits at half and never moves; with every
   * recessive individual removed from breeding it climbs to 95 per cent in
   * twenty generations and then almost stops. The bubbles are the carriers,
   * the heterozygotes the selection cannot see — at their busiest when the
   * pool is evenly mixed, and nearly gone by the time the pool is blue, which
   * is the very reason the last few per cent take for ever.
   */
  drive: ({ f }) => ({
    level: clamp(f.dominantAlleleFrequency, 0.08, 0.95),
    color: mix("#c9a227", "#4a63f0", clamp(f.dominantAlleleFrequency, 0, 1)),
    bubbles: clamp(f.carrierPercent / 100, 0, 1),
  }),
};

export const g8f5AcrossGenerations = buildSim(ACROSS_GENERATIONS);

/* ---------------------------------------------------------------- *
 * F5.5 — Predicting a population's future trait proportions
 * ---------------------------------------------------------------- */

const HARDY_WEINBERG: ArchetypeSpec = {
  id: "g8f5-hardy-weinberg",
  title: "Counting the Carriers",
  tagline: "One allele in fifty is enough to give one child in 2,500 cystic fibrosis. Work out how many carriers that needs.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-LS4-6", "MS-LS3-2"] },
  learningGoals: [
    "Use p + q = 1 and p squared + 2pq + q squared = 1 to predict genotype proportions.",
    "Explain why carriers vastly outnumber affected individuals when an allele is rare.",
  ],
  misconceptions: [
    "A rare disorder means the allele causing it is nearly extinct",
    "Dominant alleles automatically become more common than recessive ones",
  ],
  specimens: [
    {
      id: "pool", name: "The allele pool: the recessive allele's share",
      art: { art: "glassware", which: "testTube", level: 0.5, color: "#4a63f0" },
    },
  ],
  variables: [
    {
      key: "p", label: "Frequency of the dominant allele (p)",
      min: 0, max: 1, step: 0.01, default: 0.98,
    },
    {
      key: "people", label: "People in the population",
      min: 100, max: 100000, step: 100, default: 2500,
    },
  ],
  /*
   * Hardy-Weinberg exactly as written: q = 1 - p, and the three genotypes come
   * out at p^2, 2pq and q^2.
   *
   * The default is the European cystic fibrosis case. The CFTR allele sits at
   * q = 0.02 — one copy in fifty. Then q^2 = 0.0004, which is one child in
   * 2,500, the incidence actually recorded; and 2pq = 2 x 0.98 x 0.02 =
   * 0.0392, which is one person in 26 carrying a copy without knowing it.
   * Carriers outnumber affected people by 2p/q, which at these numbers is
   * ninety-eight to one.
   */
  measure: (v) => {
    const q = 1 - v.p;
    const affected = q * q;
    const carriers = 2 * v.p * q;
    return {
      recessiveAlleleFrequency: q,
      homozygousDominantPercent: v.p * v.p * 100,
      carrierPercent: carriers * 100,
      affectedPercent: affected * 100,
      affectedOneIn: affected > 0 ? 1 / affected : 0,
      carriersOneIn: carriers > 0 ? 1 / carriers : 0,
      carriersPerAffectedPerson: affected > 0 ? carriers / affected : 0,
      affectedPeople: v.people * affected,
      carrierPeople: v.people * carriers,
    };
  },
  plot: {
    x: "p", y: "carrierPercent",
    xLabel: "Dominant allele frequency (p)", yLabel: "Carriers in the population (%)",
  },
  /*
   * The tube holds the recessive allele's share of the pool, so it empties as
   * p runs up to one and fills as p runs down to zero, and its colour runs
   * with it from the dominant allele's blue to the recessive's gold. The
   * bubbles are the carriers, and they behave in the way that surprises
   * everyone: they are at their most furious in the middle, at p = 0.5, and
   * they vanish at both ends, because a carrier needs one of each allele.
   */
  drive: ({ f, v }) => ({
    level: clamp(f.recessiveAlleleFrequency, 0.06, 0.96),
    color: mix("#4a63f0", "#c9a227", clamp(f.recessiveAlleleFrequency, 0, 1)),
    bubbles: clamp(2 * v.p * (1 - v.p), 0, 1),
  }),
};

export const g8f5HardyWeinberg = buildSim(HARDY_WEINBERG);
