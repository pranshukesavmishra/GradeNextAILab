import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E5 — Sexual and asexual reproduction.
 *
 * Five simulations, one per subtopic:
 *
 *   E5.1  g6e5-half-from-each     sexual reproduction                (process)
 *   E5.2  g6e5-eight-million      why offspring resemble but differ  (investigate)
 *   E5.3  g6e5-one-parent-or-two  asexual reproduction               (sort)
 *   E5.4  g6e5-copied-letter-for-letter  why clones are identical    (trace)
 *   E5.5  g6e5-speed-or-variety   comparing the two strategies       (compare)
 *
 * Two numbers carry the topic: 2 to the power 23, which is 8 388 608 ways of
 * packing a human gamete, and one error in a billion bases, which is how
 * nearly a clone stays a clone.
 */

/* E5.1 — Sexual reproduction. */
const HALF_FROM_EACH: ArchetypeSpec = {
  id: "g6e5-half-from-each",
  title: "Half from Each",
  tagline: "Two cells, 23 chromosomes apiece, and one entirely new arrangement.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Describe how gametes with half the chromosome number combine to restore the full set.",
    "Explain that each parent contributes one chromosome of every pair.",
  ],
  misconceptions: ["Offspring receive a blend of their parents' traits"],
  specimens: [{ id: "zygote", name: "From two cells to one", art: { art: "cell" } }],
  stages: [
    { name: "Two parents", at: 0,
      caption: "Every body cell in either parent holds 46 chromosomes: 23 matched pairs, one member of each pair inherited from each of their own parents." },
    { name: "Halving", at: 0.2,
      caption: "Meiosis builds gametes with 23 chromosomes, one taken from each pair. The egg is about 0.1 mm across, the largest cell in the body; a sperm cell is a hundredth of its width." },
    { name: "Shuffling", at: 0.4,
      caption: "Which member of each pair goes into a given gamete is decided independently, so one person can make 2 to the power 23 chromosome combinations: 8 388 608 of them." },
    { name: "Fertilisation", at: 0.6,
      caption: "One sperm out of a few hundred million fuses with the egg. The two nuclei join and the chromosome count is back to 46, half from each side." },
    { name: "First division", at: 0.8,
      caption: "About a day later the single cell divides, and from then on every copy carries the same new set." },
    { name: "A new set", at: 1,
      caption: "The child resembles both parents because every chromosome came from one of them, and matches neither because no one has ever held this particular 46 before." },
  ],
};

/* E5.2 — Why sexual offspring resemble but do not match parents. */
const EIGHT_MILLION: ArchetypeSpec = {
  id: "g6e5-eight-million",
  title: "Eight Million Ways to Pack a Cell",
  tagline: "Count the ways one person's chromosomes can be dealt into a gamete.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"], ccssMath: ["6.EE.A.1"] },
  learningGoals: [
    "Calculate the number of gamete combinations from the number of chromosome pairs.",
    "Explain why every child of the same two parents inherits a different set.",
  ],
  misconceptions: ["Two children of the same parents could easily be genetically identical"],
  specimens: [{ id: "chromosomes", name: "One set of chromosomes", art: { art: "dna" } }],
  variables: [
    { key: "pairs", label: "Chromosome pairs in the parent", min: 1, max: 23, step: 1, default: 23 },
    { key: "crossovers", label: "Crossover points per chromosome", min: 0, max: 3, step: 1, default: 0 },
  ],
  // Independent assortment: each pair contributes one member to the gamete and
  // the choices are independent, so n pairs give 2 to the power n gametes. For
  // a human, 2^23 = 8 388 608 before crossing over is counted at all. Each
  // crossover point lets a chromosome be reassembled from either homologue on
  // both sides of the break, doubling the types that chromosome can take, so
  // c crossovers per chromosome give 2^((1 + c) * n). Two gametes then meet,
  // and the number of possible children is that count squared: with no
  // crossing over at all, 70 million million.
  measure: (v) => {
    const gametes = Math.pow(2, (1 + v.crossovers) * v.pairs);
    return {
      gameteCombinations: gametes,
      possibleChildren: gametes * gametes,
      percentSharedWithEachParent: 50,
    };
  },
  plot: { x: "pairs", y: "gameteCombinations", xLabel: "Chromosome pairs", yLabel: "Different gametes possible" },
};

/* E5.3 — Asexual reproduction. */
const ONE_PARENT_OR_TWO: ArchetypeSpec = {
  id: "g6e5-one-parent-or-two",
  title: "One Parent, or Two?",
  tagline: "Six ways of making a new organism. Which ones needed gametes to fuse?",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Classify examples of reproduction as sexual or asexual.",
    "Explain that what makes reproduction sexual is the fusion of gametes, not the number of individuals involved.",
  ],
  misconceptions: ["Reproduction involving one parent is always asexual"],
  categories: [
    { id: "asexual", name: "Asexual", hint: "no gametes fuse, so the offspring is a copy" },
    { id: "sexual", name: "Sexual", hint: "two gametes fuse and the set is reshuffled" },
  ],
  specimens: [
    { id: "fission", name: "A bacterium pinching into two", category: "asexual",
      because: "Binary fission. The single loop of DNA is copied and one goes to each end before the wall closes. In warm broth E. coli does this every 20 minutes.",
      art: { art: "microbe", which: "bacterium" } },
    { id: "runner", name: "A strawberry sending out a runner", category: "asexual",
      because: "The stem creeps sideways and roots where it touches. The new plant is a clone, which is why every strawberry of one variety tastes the same.",
      art: { art: "flora", which: "seedling" } },
    { id: "aphid", name: "A summer aphid giving birth without mating", category: "asexual",
      because: "Parthenogenesis: an unfertilised egg develops on its own. Each daughter is a copy of her mother, and she is already carrying her own daughters when she is born.",
      art: { art: "creature", which: "insect" } },
    { id: "pip", name: "An apple tree grown from a pip", category: "sexual",
      because: "Pollen from another tree fertilised the ovule, so the pip carries a new mix. Plant a pip from a good apple and the fruit is usually poor: that is why growers graft instead.",
      art: { art: "flora", which: "tree" } },
    { id: "spawn", name: "Frogs spawning in a pond", category: "sexual",
      because: "Eggs and sperm are released into the water and fuse there. Two parents, thousands of tadpoles, and no two of them carrying the same set.",
      art: { art: "habitat", which: "pond" } },
    { id: "selfing", name: "A pea flower pollinating itself", category: "sexual",
      because: "One plant, but still sexual. Meiosis made the pollen and the ovule, and two gametes fused, so the offspring is a fresh combination rather than a copy. Mendel's experiments depended on it.",
      art: { art: "flora", which: "flower" } },
  ],
};

/* E5.4 — Why asexual offspring are genetically identical. */
const COPIED_LETTER_FOR_LETTER: ArchetypeSpec = {
  id: "g6e5-copied-letter-for-letter",
  title: "Copied Letter for Letter",
  tagline: "Follow one bacterial chromosome from a single loop to two identical cells.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "Explain how base pairing makes each strand of DNA a template for an exact copy.",
    "Account for why asexual offspring are identical apart from rare copying errors.",
  ],
  misconceptions: ["Clones are identical because nothing about their DNA ever changes"],
  stages: [
    { name: "One loop", at: 0, caption: "A single circular chromosome, and no partner anywhere in the story." },
    { name: "Unzipped", at: 0.25, caption: "The strands separate. A pairs only with T, C only with G, so each half already specifies the other." },
    { name: "Copied", at: 0.5, caption: "Both halves are filled in at about a thousand bases a second." },
    { name: "Checked", at: 0.75, caption: "The copier proofreads as it goes. Roughly one surviving error per billion bases." },
    { name: "Two cells", at: 1, caption: "The wall closes and two cells carry the same 4.6 million bases." },
  ],
  route: [
    { at: [0.12, 0.62], name: "The chromosome",
      note: "One closed loop of DNA holding 4.6 million base pairs. Stretched out it would be about 1.6 mm long, packed into a cell 2 micrometres across: nearly a thousand times its own length." },
    { at: [0.29, 0.42], name: "The origin",
      note: "Copying starts at one fixed point on the loop and the two strands are prised apart there. Nothing is swapped in from another cell, because there is no other cell involved." },
    { at: [0.46, 0.3], name: "Two forks",
      note: "Copying runs both ways round the loop at about 1 000 bases a second. Two forks sharing 4.6 million bases finish in roughly 40 minutes." },
    { at: [0.6, 0.5], name: "Base pairing",
      note: "A pairs only with T and C only with G, so an old strand dictates its new partner base by base. This is the whole reason a copy can be exact rather than merely similar." },
    { at: [0.73, 0.36], name: "Proofreading",
      note: "The copying enzyme checks each base it lays down and backs up to cut out mistakes. After repair about one error in a billion bases survives, so roughly one cell in two hundred carries a new change." },
    { at: [0.87, 0.6], name: "Two cells",
      note: "The loops move to opposite ends and a new wall grows in between. Both cells hold the same 4.6 million bases: not similar to the parent, the same, apart from those rare errors, which are the only raw material a clone has for evolving." },
  ],
};

/* E5.5 — Comparing the two strategies. */
const SPEED_OR_VARIETY: ArchetypeSpec = {
  id: "g6e5-speed-or-variety",
  title: "Speed, or Variety?",
  tagline: "One species, both strategies, six months apart. Watch what each one buys.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS3-2"] },
  learningGoals: [
    "State the advantages of asexual and of sexual reproduction.",
    "Explain why a species may use both, at different times of year.",
  ],
  misconceptions: ["Sexual reproduction is simply the more advanced strategy"],
  specimens: [
    { id: "summer", name: "Aphids in June: asexual",
      because: "Daughters without mating, thousands in a fortnight, every one a copy. No mate to find and no half a genome thrown away.",
      art: { art: "creature", which: "insect" } },
    { id: "autumn", name: "The same aphids in October: sexual",
      because: "Shorter days bring males, mating and eggs that survive winter. Every egg is a new combination, so a disease that wiped out the clones cannot take them all.",
      art: { art: "dna" } },
  ],
};

export const g6e5HalfFromEach = buildSim(HALF_FROM_EACH);
export const g6e5EightMillion = buildSim(EIGHT_MILLION);
export const g6e5OneParentOrTwo = buildSim(ONE_PARENT_OR_TWO);
export const g6e5CopiedLetterForLetter = buildSim(COPIED_LETTER_FOR_LETTER);
export const g6e5SpeedOrVariety = buildSim(SPEED_OR_VARIETY);
