import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F1 — Mutations and genetic variation.
 *
 * Five simulations, one per subtopic:
 *
 *   F1.1  g8f1-one-letter            a mutation as a change to information  (explore)
 *   F1.2  g8f1-better-worse-neither  beneficial, harmful, neutral           (sort)
 *   F1.3  g8f1-most-say-nothing      why most mutations are neutral         (investigate)
 *   F1.4  g8f1-source-of-variation   mutation as the source of variation    (compare)
 *   F1.5  g8f1-trait-to-letter       tracing a trait to a mutation          (trace)
 *
 * The arithmetic is the standard genetic code and standard population
 * genetics, both of which a student can check. Of the 549 single-base changes
 * possible in the 61 sense codons, exactly 134 are synonymous, 392 are
 * missense and 23 are nonsense; those three counts drive F1.3. F1.4 runs
 * mutation-drift balance, H = 4Ne(mu) / (1 + 4Ne(mu)), against the decay of
 * heterozygosity by a factor (1 - 1/2Ne) every generation when mutation is
 * switched off.
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
 * F1.1 — A mutation as a change to genetic information
 * ---------------------------------------------------------------- */

const ONE_LETTER: ArchetypeSpec = {
  id: "g8f1-one-letter",
  title: "One Letter in Three Billion",
  tagline: "Open the double helix and find every way a copying slip can change the message.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS3-1"] },
  learningGoals: [
    "Describe a mutation as a change to the sequence of bases in DNA.",
    "Tell a substitution, an insertion and a deletion apart by what each does to the reading frame.",
  ],
  misconceptions: [
    "A mutation is a whole new gene appearing from nowhere",
    "Mutations only happen because of radiation or chemicals",
  ],
  specimens: [
    {
      id: "helix",
      name: "Human DNA, copied about once a day in a dividing cell",
      art: { art: "dna" },
      parts: [
        {
          id: "message", name: "The message itself", at: [0, -0.5],
          note: "3.1 billion base pairs in one human genome, read three at a time, in about 19,900 protein-coding genes.",
        },
        {
          id: "substitution", name: "Substitution: one base swapped", at: [-0.44, -0.26],
          note: "In HBB the sixth codon reads GAG, glutamate. Change one A to T and it reads GTG, valine. That swap is sickle-cell.",
        },
        {
          id: "insertion", name: "Insertion: an extra base slipped in", at: [0.44, -0.08],
          note: "Polymerase stutters on a run of repeats and adds a base. Inside a gene, everything after it is read in the wrong frame.",
        },
        {
          id: "deletion", name: "Deletion: a base or three taken out", at: [-0.44, 0.12],
          note: "CFTR delta-F508 deletes three bases: a whole codon, so the frame survives, but the 1,480-amino-acid channel never folds.",
        },
        {
          id: "frameshift", name: "Frameshift: the frame slips", at: [0.44, 0.32],
          note: "Add or remove one base and every codon after it is misread. A working 430-amino-acid protein becomes nonsense, stopping early.",
        },
        {
          id: "rate", name: "How often it happens", at: [0, 0.52],
          note: "Polymerase misreads 1 base in 100,000; proofreading and repair take it to 1 in a billion — still about 70 new mutations per baby.",
        },
      ],
    },
  ],
};

export const g8f1OneLetter = buildSim(ONE_LETTER);

/* ---------------------------------------------------------------- *
 * F1.2 — Beneficial, harmful and neutral outcomes
 * ---------------------------------------------------------------- */

const BETTER_WORSE_NEITHER: ArchetypeSpec = {
  id: "g8f1-better-worse-neither",
  title: "Better, Worse, or Neither?",
  tagline: "Six real human mutations. Decide what each one did to the person carrying it.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS3-1", "MS-LS4-4"] },
  learningGoals: [
    "Judge a mutation by its effect on the organism, not by the word 'mutation'.",
    "Give a real example of a beneficial, a harmful and a neutral mutation.",
  ],
  misconceptions: [
    "Every mutation is harmful",
    "A mutation is beneficial or harmful on its own, whatever the surroundings",
  ],
  categories: [
    { id: "beneficial", name: "Beneficial", hint: "the carrier does better because of it" },
    { id: "harmful", name: "Harmful", hint: "the carrier does worse because of it" },
    { id: "neutral", name: "Neutral", hint: "nothing measurable changes" },
  ],
  specimens: [
    {
      id: "lactase", name: "LCT minus-13910 C to T: lactase stays switched on", category: "beneficial",
      because: "One base, 13,910 letters upstream of the lactase gene, stops the enhancer switching it off at weaning. It went from absent to about 90 per cent of northern Europeans in under 8,000 years — one of the fastest sweeps known in our species.",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#f2efe4" },
    },
    {
      id: "ccr5", name: "CCR5 delta-32: 32 bases missing from a white-cell receptor", category: "beneficial",
      because: "The receptor HIV-1 uses to get into a cell is never finished, so the virus cannot dock. Two copies gives near-complete resistance to HIV-1, and roughly 10 per cent of northern Europeans carry one.",
      art: { art: "microbe", which: "virus" },
    },
    {
      id: "cftr", name: "CFTR delta-F508: three bases deleted", category: "harmful",
      because: "One phenylalanine missing from a 1,480-amino-acid chloride channel, so the protein never folds and never reaches the cell surface. It causes about 70 per cent of cystic fibrosis worldwide.",
      art: { art: "body", which: "lungs" },
    },
    {
      id: "fgfr3", name: "FGFR3 G1138A: one base in a growth receptor", category: "harmful",
      because: "The same single change accounts for over 99 per cent of achondroplasia. It leaves the receptor switched permanently on, so growth plates in the arm and thigh close early. About 80 per cent of cases are brand-new mutations, none of them inherited.",
      art: { art: "body", which: "knee" },
    },
    {
      id: "silent", name: "A third-base change inside a codon", category: "neutral",
      because: "GGT, GGC, GGA and GGG all mean glycine. Change the third base and the protein that comes out is identical, letter for letter. About 24 per cent of all possible single-base changes in coding DNA are silent like this.",
      art: { art: "dna" },
    },
    {
      id: "intron", name: "A base changed deep inside an intron", category: "neutral",
      because: "Only about 1.5 per cent of the human genome codes for protein. This stretch is cut out of the message before it is ever read, so nothing downstream notices the change at all.",
      art: { art: "cell" },
    },
  ],
  /*
   * The specimen argues its own case before the caption does. The milk fills
   * because the enzyme is still being made; the virus is left turning slowly
   * outside a door it cannot open; the deleted channel and the closed growth
   * plate are drawn small, which is exactly what those two mutations do; and
   * the two neutral specimens behave like any untouched cell.
   */
  drive: ({ specimen }) => {
    switch (specimen.id) {
      case "lactase": return { level: 0.66, color: "#f4f1e6", bubbles: 0.12 };
      case "ccr5": return { scale: 0.82, rate: 0.25 };
      case "cftr": return { scale: 0.86 };
      case "fgfr3": return { scale: 0.74 };
      default: return { rate: 1 };
    }
  },
};

export const g8f1BetterWorseNeither = buildSim(BETTER_WORSE_NEITHER);

/* ---------------------------------------------------------------- *
 * F1.3 — Why most mutations are neutral
 * ---------------------------------------------------------------- */

const MOST_SAY_NOTHING: ArchetypeSpec = {
  id: "g8f1-most-say-nothing",
  title: "Most Changes Say Nothing",
  tagline: "Scatter this generation's new mutations across a genome and count how many the body ever notices.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS3-1"] },
  learningGoals: [
    "Explain why nearly every new mutation lands where it changes nothing.",
    "Use the redundancy of the genetic code to predict how many coding changes are silent.",
  ],
  misconceptions: [
    "Every mutation changes a protein",
    "A neutral mutation is one that never gets passed on",
  ],
  specimens: [
    {
      id: "crop", name: "This generation's new mutations",
      art: { art: "sphere", color: "#4a63f0", radius: 0.46 },
    },
  ],
  variables: [
    {
      key: "codingShare", label: "Share of the genome that codes for protein", unit: "%",
      min: 0.5, max: 100, step: 0.5, default: 1.5,
    },
    {
      key: "mutations", label: "New point mutations per generation",
      min: 20, max: 150, step: 1, default: 70,
    },
  ],
  /*
   * Two independent facts, multiplied.
   *
   * First, where the mutation lands: only about 1.5 per cent of the human
   * genome is protein-coding, so about 1 of the 70 new point mutations a baby
   * carries falls in a coding sequence at all.
   *
   * Second, what it does if it lands there. Each of the 61 sense codons can be
   * changed to 9 others by a single base substitution, giving 549 possible
   * changes. Exactly 134 of them are synonymous, 392 are missense and 23 make
   * a stop codon — 24.4, 71.4 and 4.2 per cent.
   */
  measure: (v) => {
    const coding = v.mutations * (v.codingShare / 100);
    const nonCoding = v.mutations - coding;
    const silentHits = coding * (134 / 549);
    const missenseHits = coding * (392 / 549);
    const nonsenseHits = coding * (23 / 549);
    return {
      codingHits: coding,
      nonCodingHits: nonCoding,
      silentHits,
      missenseHits,
      nonsenseHits,
      proteinChangingHits: missenseHits + nonsenseHits,
      neutralPercent: ((nonCoding + silentHits) / v.mutations) * 100,
    };
  },
  plot: {
    x: "codingShare", y: "neutralPercent",
    xLabel: "Protein-coding share of the genome (%)",
    yLabel: "Mutations that change nothing (%)",
  },
  /*
   * The bead is the whole crop of new mutations. Its volume is their number,
   * so the drawn width is the cube root: 150 mutations is only 1.29 times as
   * wide as 70, not twice. Its colour is what they do — deep blue while they
   * are silent, red once nearly every one is rewriting a protein, which is
   * what happens as the coding share climbs from the real 1.5 per cent to a
   * hypothetical 100.
   */
  drive: ({ v, f }) => ({
    scale: Math.cbrt(v.mutations / 70),
    color: mix("#3f63d8", "#c9403f", clamp(1 - f.neutralPercent / 100, 0, 1) / 0.756),
  }),
};

export const g8f1MostSayNothing = buildSim(MOST_SAY_NOTHING);

/* ---------------------------------------------------------------- *
 * F1.4 — Mutation as the ultimate source of variation
 * ---------------------------------------------------------------- */

const SOURCE_OF_VARIATION: ArchetypeSpec = {
  id: "g8f1-source-of-variation",
  title: "Switch Mutation Off and Watch",
  tagline: "Two identical populations. One keeps mutating, one does not. Run them both for four thousand generations.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS3-1", "MS-LS4-4"] },
  learningGoals: [
    "Explain that sexual reproduction shuffles variation but only mutation creates it.",
    "Predict how fast a small population loses genetic variation when nothing replaces it.",
  ],
  misconceptions: [
    "Sexual reproduction creates new alleles",
    "A population can keep generating new variation for ever without mutation",
  ],
  specimens: [
    {
      id: "with", name: "Mutation running: 1 new allele per 2,000 copies",
      because: "Variation drains away here too, but new alleles arrive at exactly the rate drift removes them. Heterozygosity settles at 4Ne(mu)/(1+4Ne(mu)) and stays there for ever.",
      art: { art: "sphere", color: "#8e5bc4", radius: 0.46 },
    },
    {
      id: "without", name: "Mutation switched off",
      because: "Nothing replaces what drift takes. Heterozygosity falls by a factor 1 - 1/2Ne every generation, halving every 1.39 x Ne generations, and every locus ends up with one allele and no choices left.",
      art: { art: "sphere", color: "#8e5bc4", radius: 0.46 },
    },
  ],
  variables: [
    { key: "generations", label: "Generations", min: 0, max: 4000, step: 50, default: 500 },
    {
      key: "popSize", label: "Breeding population (Ne)",
      min: 50, max: 5000, step: 50, default: 1000,
    },
  ],
  /*
   * Standard mutation-drift balance at a microsatellite locus, where the
   * measured mutation rate really is about 5 x 10^-4 per generation.
   *   theta = 4 Ne mu,  H at equilibrium = theta / (1 + theta)
   * With mutation switched off, heterozygosity decays geometrically:
   *   H(g) = H0 (1 - 1/2Ne)^g,  half-life = ln(0.5)/ln(1 - 1/2Ne) = 1.39 Ne
   */
  measure: (v) => {
    const mu = 5e-4;
    const theta = 4 * v.popSize * mu;
    const equilibrium = theta / (1 + theta);
    const decay = Math.pow(1 - 1 / (2 * v.popSize), v.generations);
    return {
      heterozygosityWithMutation: equilibrium,
      heterozygosityWithout: equilibrium * decay,
      variationLeftPercent: decay * 100,
      halfLifeGenerations: Math.log(0.5) / Math.log(1 - 1 / (2 * v.popSize)),
      newAllelesPerGeneration: 2 * v.popSize * mu,
    };
  },
  /*
   * Volume is variation. The mutating population holds its size and its colour
   * for ever; the other shrinks as the cube root of the heterozygosity it has
   * left and greys out as it goes, and at 4,000 generations in a population of
   * 1,000 it is down to half its width and nearly all one allele.
   */
  drive: ({ f, index }) => {
    if (index === 0) return { scale: 1 };
    const left = clamp(f.variationLeftPercent / 100, 0, 1);
    return {
      scale: clamp(Math.cbrt(left), 0.2, 1),
      color: mix("#9aa0ad", "#8e5bc4", left),
    };
  },
};

export const g8f1SourceOfVariation = buildSim(SOURCE_OF_VARIATION);

/* ---------------------------------------------------------------- *
 * F1.5 — Tracing a trait to a mutation
 * ---------------------------------------------------------------- */

const TRAIT_TO_LETTER: ArchetypeSpec = {
  id: "g8f1-trait-to-letter",
  title: "From a Glass of Milk to One Letter",
  tagline: "Follow a trait you can see all the way down to the single base that causes it.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS3-1", "MS-LS4-4"] },
  learningGoals: [
    "Follow a visible trait down through protein, gene and regulatory sequence to a single base.",
    "Explain that a mutation outside a gene can change whether that gene is switched on.",
  ],
  misconceptions: [
    "A trait must be caused by a change inside the gene for that trait",
    "One trait always has one cause in every population",
  ],
  stages: [
    { name: "Trait", at: 0, caption: "Some adults digest milk. Most of the world's adults do not." },
    { name: "Enzyme", at: 0.2, caption: "The difference is one enzyme, lactase, still being made after weaning." },
    { name: "Gene", at: 0.4, caption: "The lactase gene itself is identical in both groups. The protein is not what changed." },
    { name: "Switch", at: 0.6, caption: "The change is 13,910 bases upstream, in a switch that turns the gene off." },
    { name: "Letter", at: 0.8, caption: "One base: C in most people, T in milk-drinkers. That is the whole mutation." },
    { name: "Again", at: 1, caption: "East Africa reached the same trait with three different letters, quite independently." },
  ],
  route: [
    {
      at: [0.09, 0.33], name: "The trait you can see",
      note: "Drink 250 ml of milk and you take in 12 g of lactose. Most adults on Earth cannot split it. In Sweden over 90 per cent can.",
    },
    {
      at: [0.22, 0.60], name: "The enzyme",
      note: "Lactase cuts lactose into glucose and galactose in the small intestine. In most mammals it switches off soon after weaning.",
    },
    {
      at: [0.35, 0.30], name: "The gene",
      note: "LCT on chromosome 2, 49,000 bases, 17 exons. Sequence a milk-drinker and a non-drinker: the coding sequence is identical.",
    },
    {
      at: [0.48, 0.60], name: "The switch",
      note: "13,910 bases upstream of LCT, inside intron 13 of MCM6, is an enhancer. In most people it lets LCT be shut down at weaning.",
    },
    {
      at: [0.61, 0.30], name: "The letter",
      note: "One base. C in the ancestral version, T in the persistent one. The T keeps binding Oct-1, so LCT is never switched off.",
    },
    {
      at: [0.74, 0.60], name: "The evidence it was selected",
      note: "The T allele sits on a barely recombined block a million bases long: the signature of a sweep only a few thousand years old.",
    },
    {
      at: [0.87, 0.33], name: "And again, three more times",
      note: "East African herders carry G at minus-13907, C at minus-14010 or G at minus-13915. One trait, four separate mutations.",
    },
  ],
};

export const g8f1TraitToLetter = buildSim(TRAIT_TO_LETTER);
