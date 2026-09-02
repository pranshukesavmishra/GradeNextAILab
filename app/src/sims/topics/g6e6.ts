import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E6 — Heredity and genetic variation.
 *
 * Six simulations, one per subtopic:
 *
 *   E6.1  g6e6-what-a-gene-is      genes as inherited information      (explore)
 *   E6.2  g6e6-twins-and-siblings  variation among siblings            (compare)
 *   E6.3  g6e6-three-shuffles      why sex produces variation          (process)
 *   E6.4  g6e6-almost-perfect      why clones stay identical           (investigate)
 *   E6.5  g6e6-build-the-cross     simple inheritance diagrams         (assemble)
 *   E6.6  g6e6-punnett-square      an introductory Punnett square      (investigate)
 *
 * E6.5 and E6.6 use the same pea cross, so the diagram a student builds by
 * hand and the percentages the panel computes are the same piece of genetics
 * seen twice. Mendel's own count for that cross was 787 tall to 277 dwarf.
 */

/* E6.1 — Genes as inherited information. */
const WHAT_A_GENE_IS: ArchetypeSpec = {
  id: "g6e6-what-a-gene-is",
  title: "What a Gene Actually Is",
  tagline: "Rung, gene, allele, chromosome, genome. Five words for five different sizes of the same molecule.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Place base pair, gene, allele, chromosome and genome in order of size.",
    "Explain that a gene is information: a sequence that specifies a product.",
  ],
  misconceptions: ["A gene is a physical trait, or a tiny model of the feature it makes"],
  specimens: [
    {
      id: "helix", name: "The molecule that carries it", art: { art: "dna" },
      parts: [
        { id: "base", name: "Base pair", at: [-0.26, -0.34],
          note: "One rung of the ladder: A opposite T, or C opposite G, and never any other pairing. A rung is 0.34 nanometres thick, and one set of human chromosomes holds 3.1 billion of them." },
        { id: "gene", name: "Gene", at: [0.27, -0.18],
          note: "A stretch of rungs that specifies one product, usually a protein. A human has about 20 000 protein-coding genes, and a typical one runs to tens of thousands of bases although only about 1 300 of them spell the protein." },
        { id: "allele", name: "Allele", at: [-0.28, 0.04],
          note: "One of the versions a gene comes in. You carry two of every gene, one from each parent, and they can differ by a single base out of a thousand and still decide whether an enzyme works." },
        { id: "chromosome", name: "Chromosome", at: [0.26, 0.26],
          note: "One whole DNA molecule, wound around proteins to fit. Human chromosome 1 holds about 249 million base pairs; unwound, the DNA in a single cell would stretch about 2 m." },
        { id: "genome", name: "Genome", at: [0, 0.42],
          note: "All 46 chromosomes together: roughly 6.4 billion base pairs, the entire instruction set, carried in almost every one of the tens of trillions of cells in a body." },
        { id: "noncoding", name: "The other 98 per cent", at: [-0.06, -0.44],
          note: "Only about 2 per cent of the sequence codes for protein. Much of the rest is switches deciding which genes are read where, which is how a nerve cell and a skin cell carry identical DNA and end up nothing alike." },
      ],
    },
  ],
};

/* E6.2 — Inheritance and variation among siblings. */
const TWINS_AND_SIBLINGS: ArchetypeSpec = {
  id: "g6e6-twins-and-siblings",
  title: "Twins, and Ordinary Siblings",
  tagline: "Same two parents either way. One pair share every base, the other about half.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Explain why siblings resemble each other without being identical.",
    "State how much DNA identical twins and full siblings share, and why the numbers differ.",
  ],
  misconceptions: ["Children of the same parents inherit the same genes"],
  specimens: [
    { id: "twins", name: "Identical twins: one fertilised egg",
      because: "One zygote split within a fortnight, so both carry the same set. Even so their fingerprints differ: those form from random folding in the womb.",
      art: { art: "cell" } },
    { id: "siblings", name: "Full siblings: two fertilised eggs",
      because: "A different egg and a different sperm, each one of millions. They share about half of the DNA that varies between people, and any given pair can land anywhere from about 37 to 61 per cent.",
      art: { art: "dna" } },
  ],
};

/* E6.3 — Why sexual reproduction produces variation. */
const THREE_SHUFFLES: ArchetypeSpec = {
  id: "g6e6-three-shuffles",
  title: "Three Shuffles, Then a Draw",
  tagline: "Variation is not an accident of sexual reproduction. It is built in, three times over.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Name crossing over, independent assortment and random fertilisation as sources of variation.",
    "Explain why every gamete a person makes is likely to be unique.",
  ],
  misconceptions: ["Variation between siblings comes mainly from mutation"],
  specimens: [{ id: "meiosis", name: "One cell entering meiosis", art: { art: "cell" } }],
  stages: [
    { name: "Pairs line up", at: 0,
      caption: "The 23 pairs come together, each chromosome beside its match from the other parent. Nothing has been shuffled yet." },
    { name: "Crossing over", at: 0.2,
      caption: "Paired chromosomes swap matching pieces. A human meiosis makes roughly 50 to 70 of these swaps, so a chromosome handed on is a patchwork of both grandparents." },
    { name: "Assortment", at: 0.4,
      caption: "Which member of each pair goes to which daughter cell is settled pair by pair, independently: 2 to the power 23, or 8 388 608 combinations." },
    { name: "Four cells", at: 0.6,
      caption: "Meiosis ends with four cells, each holding 23 chromosomes, and no two of them alike." },
    { name: "The draw", at: 0.8,
      caption: "Any one of the mother's gametes may meet any one of the father's: more than 70 million million pairings, before crossing over is counted at all." },
    { name: "Raw material", at: 1,
      caption: "So no two children start the same. Selection can only work on differences that already exist, and this is where nearly all of them come from." },
  ],
};

/* E6.4 — Why asexual reproduction preserves identical information. */
const ALMOST_PERFECT: ArchetypeSpec = {
  id: "g6e6-almost-perfect",
  title: "Almost Perfect Copies",
  tagline: "A clone inherits the same information. Count how often the copying still slips.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Explain why asexual offspring carry the same genetic information as their parent.",
    "Show that rare copying errors still make a large clonal population varied.",
  ],
  misconceptions: ["A clone population contains no genetic variation at all"],
  specimens: [{ id: "colony", name: "A bacterial culture", art: { art: "microbe", which: "bacterium" } }],
  variables: [
    { key: "colony", label: "Cells in the culture (millions)", min: 1, max: 1000, step: 1, default: 100 },
    { key: "generations", label: "Generations", min: 1, max: 50, step: 1, default: 20 },
  ],
  // An E. coli genome is 4.6 million base pairs and, after proofreading and
  // repair, about one base in a billion is copied wrongly. So a single
  // division is expected to introduce 4.6e6 * 1e-9 = 0.0046 new mutations:
  // 995 cells in every thousand are perfect copies. Multiply by a culture of
  // 100 million cells over 20 generations, though, and the same rate produces
  // over 9 million new mutations. Every single position in that genome has
  // been changed in some cell somewhere, which is why a resistant bacterium
  // can appear in a culture that has never met the antibiotic before. The
  // count assumes the culture is held at this size, one division per cell per
  // generation.
  measure: (v) => {
    const perDivision = 4.6e6 * 1e-9;
    return {
      newMutationsInTheCulture: v.colony * 1e6 * perDivision * v.generations,
      newMutationsPerCellLine: perDivision * v.generations,
      percentOfCellLinesUnchanged: 100 * Math.exp(-perDivision * v.generations),
    };
  },
  plot: { x: "generations", y: "newMutationsInTheCulture", xLabel: "Generations", yLabel: "New mutations in the culture" },
};

/* E6.5 — Simple inheritance diagrams. */
const BUILD_THE_CROSS: ArchetypeSpec = {
  id: "g6e6-build-the-cross",
  title: "Build the Cross",
  tagline: "Two tall pea plants, each carrying a hidden dwarf allele. Lay the diagram out in order.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Draw an inheritance diagram from parent genotypes through gametes to offspring.",
    "Distinguish an organism's genotype from the phenotype it shows.",
  ],
  misconceptions: ["A trait that does not appear in the parents cannot appear in the offspring"],
  specimens: [
    {
      id: "cross", name: "Tt crossed with Tt", art: { art: "dna" },
      parts: [
        { id: "parents", name: "1. Write the parents", at: [-0.26, -0.36],
          note: "Both parents are Tt: one allele for tall, one for dwarf. Capital T is written first because tall is dominant, and both parents are tall even though each carries t." },
        { id: "gametes", name: "2. Split into gametes", at: [0.26, -0.3],
          note: "Meiosis puts one allele of the pair into each gamete, so each parent makes T gametes and t gametes in equal numbers. This halving is the whole reason the diagram works." },
        { id: "combine", name: "3. Combine every pair", at: [-0.28, -0.04],
          note: "Any gamete from one parent can meet any gamete from the other: T with T, T with t, t with T, t with t. Four combinations, all equally likely." },
        { id: "genotypes", name: "4. Write the genotypes", at: [0.28, 0.04],
          note: "TT, Tt, Tt and tt. One quarter carries two tall alleles, one half carries one of each, one quarter carries two dwarf alleles." },
        { id: "phenotypes", name: "5. Read the phenotypes", at: [-0.26, 0.3],
          note: "TT and Tt both grow tall, because one working copy makes enough of the growth hormone. Only tt is dwarf. Three tall to one dwarf." },
        { id: "meaning", name: "6. Say what it predicts", at: [0.26, 0.34],
          note: "The diagram gives each seed a 1 in 4 chance of being dwarf, not a guarantee about any four seeds. Mendel grew this cross to 1 064 plants and counted 787 tall to 277 dwarf: 2.84 to 1." },
      ],
    },
  ],
};

/* E6.6 — An introductory Punnett square. */
const PUNNETT_SQUARE: ArchetypeSpec = {
  id: "g6e6-punnett-square",
  title: "Fill In the Square",
  tagline: "Set what each parent carries and read the chances straight off the four boxes.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Use a Punnett square to predict the ratio of phenotypes among offspring.",
    "Explain how two tall parents can produce a dwarf plant and two dwarf parents cannot produce a tall one.",
  ],
  misconceptions: ["A 3 to 1 ratio means exactly three of every four offspring"],
  specimens: [{ id: "square", name: "The cross under test", art: { art: "flora", which: "seedling" } }],
  variables: [
    { key: "mother", label: "Tall alleles in the seed parent (0, 1 or 2)", min: 0, max: 2, step: 1, default: 1 },
    { key: "father", label: "Tall alleles in the pollen parent (0, 1 or 2)", min: 0, max: 2, step: 1, default: 1 },
  ],
  // Each parent passes one allele, drawn at random from the two it holds, so a
  // parent with d dominant alleles sends T with probability d/2. The four
  // boxes of the square are those two draws combined: dwarf offspring need t
  // from both sides, which happens with probability (1 - p)(1 - q). Tt by Tt
  // gives 25 per cent TT, 50 per cent Tt and 25 per cent tt, the familiar 3
  // tall to 1 dwarf. TT by tt gives 100 per cent Tt, every one of them tall
  // and every one carrying a hidden dwarf allele. tt by tt can only give tt,
  // because neither parent has a tall allele to send.
  measure: (v) => {
    const p = v.mother / 2, q = v.father / 2;
    return {
      percentTall: 100 * (1 - (1 - p) * (1 - q)),
      percentCarryingBothAlleles: 100 * (p * (1 - q) + (1 - p) * q),
      percentDwarf: 100 * (1 - p) * (1 - q),
    };
  },
  plot: { x: "mother", y: "percentTall", xLabel: "Tall alleles in the seed parent", yLabel: "Tall offspring (%)" },
};

export const g6e6WhatAGeneIs = buildSim(WHAT_A_GENE_IS);
export const g6e6TwinsAndSiblings = buildSim(TWINS_AND_SIBLINGS);
export const g6e6ThreeShuffles = buildSim(THREE_SHUFFLES);
export const g6e6AlmostPerfect = buildSim(ALMOST_PERFECT);
export const g6e6BuildTheCross = buildSim(BUILD_THE_CROSS);
export const g6e6PunnettSquare = buildSim(PUNNETT_SQUARE);
