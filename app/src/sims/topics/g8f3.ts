import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit F · Topic F3 — Anatomical and embryological evidence.
 *
 * Five simulations, one per subtopic:
 *
 *   F3.1  g8f3-same-six-bones       homologous structures                (explore)
 *   F3.2  g8f3-job-or-ancestor      analogous and vestigial structures   (sort)
 *   F3.3  g8f3-chance-or-ancestry   shared ancestry vs convergence       (investigate)
 *   F3.4  g8f3-same-waist           early development across species     (compare)
 *   F3.5  g8f3-build-the-tree       inferring evolutionary relationships (assemble)
 *
 * F3.3 is the quantitative heart of the topic: convergence can copy one
 * feature, and two features, and with luck three — but the chance of matching
 * on n independent two-state characters is 2^-n, and across m lineages it is
 * 2^-n(m-1). Forty characters shared by two lineages is one chance in 10^12.
 * F3.4 uses the published Carnegie greatest-length table for human embryos,
 * 5 mm at four weeks to 44 mm at ten, and the real fate of the pharyngeal
 * arches over that window.
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
 * F3.1 — Homologous structures
 * ---------------------------------------------------------------- */

const SAME_SIX_BONES: ArchetypeSpec = {
  id: "g8f3-same-six-bones",
  title: "One Bone, Two Bones, Lots of Little Bones",
  tagline: "Take your arm apart and find the same plan inside a bat, a whale and a horse.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-2"] },
  learningGoals: [
    "Identify the shared bone plan of the tetrapod forelimb.",
    "Explain that homologous structures are evidence of descent from a common ancestor.",
  ],
  misconceptions: [
    "Animals that do the same thing must be closely related",
    "A whale's flipper is a fish fin",
  ],
  specimens: [
    {
      id: "forelimb",
      name: "The tetrapod forelimb — this one happens to be yours",
      art: { art: "body", which: "elbow" },
      parts: [
        {
          id: "plan", name: "One, two, lots", at: [0, -0.5],
          note: "One bone, then two, then a cluster, then digits. Owen wrote the pattern down in 1843; Darwin explained it sixteen years later.",
        },
        {
          id: "humerus", name: "Humerus: the one bone", at: [-0.44, -0.26],
          note: "Shoulder to elbow, a single bone, in every four-limbed vertebrate there has ever been: you, a bat, a whale, a horse, a frog.",
        },
        {
          id: "radiusulna", name: "Radius and ulna: the two bones", at: [0.44, -0.10],
          note: "Elbow to wrist, always two. A horse's ulna is a splint fused to the radius: still there, still from the same embryonic bud.",
        },
        {
          id: "carpals", name: "Carpals: the cluster", at: [-0.44, 0.12],
          note: "Eight small wrist bones in a human. A whale's flipper carries them too, sealed in a paddle that never bends. Nothing needs them.",
        },
        {
          id: "digits", name: "Metacarpals and phalanges", at: [0.44, 0.30],
          note: "A bat's wing is four hugely long fingers with skin between, thumb still a free claw. A horse runs on the tip of one finger.",
        },
        {
          id: "test", name: "What would have shown it wrong", at: [0, 0.5],
          note: "If limbs were built for their jobs, a bat's wing would be built like a bird's. It is not: it is a rearranged tetrapod arm.",
        },
      ],
    },
  ],
};

export const g8f3SameSixBones = buildSim(SAME_SIX_BONES);

/* ---------------------------------------------------------------- *
 * F3.2 — Analogous and vestigial structures
 * ---------------------------------------------------------------- */

const JOB_OR_ANCESTOR: ArchetypeSpec = {
  id: "g8f3-job-or-ancestor",
  title: "Same Ancestor, Same Job, or Left Over?",
  tagline: "Eight structures. Sort them by what they are evidence of.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-2"] },
  learningGoals: [
    "Tell homologous, analogous and vestigial structures apart.",
    "Explain what each kind of structure is evidence about.",
  ],
  misconceptions: [
    "Vestigial means useless",
    "Two animals that look alike must be close relatives",
  ],
  categories: [
    { id: "homologous", name: "Homologous", hint: "same bones, inherited from one ancestor" },
    { id: "analogous", name: "Analogous", hint: "same job, built from different parts" },
    { id: "vestigial", name: "Vestigial", hint: "a reduced leftover from an ancestor" },
  ],
  specimens: [
    {
      id: "batarm", name: "A bat's wing and your arm", category: "homologous",
      because: "Humerus, radius and ulna, carpals, then digits — the same bones in the same order, from the same limb buds. The bat's second to fifth fingers are simply enormous.",
      art: { art: "body", which: "elbow" },
    },
    {
      id: "horseleg", name: "A horse's front leg", category: "homologous",
      because: "The whole leg below the knee is one finger, the third, standing on its nail. The second and fourth are the splint bones still buried alongside it, and the fossil sequence from Hyracotherium onwards shows them shrinking.",
      art: { art: "creature", which: "deer" },
    },
    {
      id: "insectwing", name: "A butterfly's wing and a bird's wing", category: "analogous",
      because: "Both fly, and both obey the same aerodynamics, which is why both are thin aerofoils. But a bird's wing is a forelimb with feathers and an insect's wing is an outgrowth of the body wall with no bones in it at all.",
      art: { art: "creature", which: "butterfly" },
    },
    {
      id: "dolphin", name: "A dolphin's body and a shark's body", category: "analogous",
      because: "Same torpedo, same dorsal fin, same problem: moving fast through water. Inside, the dolphin has a mammal's arm bones in its flipper, lungs, and a tail that beats up and down; the shark has cartilage, gills, and a tail that beats side to side.",
      art: { art: "creature", which: "fish" },
    },
    {
      id: "mole", name: "A mole's digging hand and a mole cricket's digging leg", category: "analogous",
      because: "Two broad spades for shovelling soil, evolved about 300 million years apart in a mammal and an insect. Digging in soil has one good solution and both lineages found it.",
      art: { art: "creature", which: "insect" },
    },
    {
      id: "coccyx", name: "The human coccyx", category: "vestigial",
      because: "Four fused vertebrae at the base of your spine, all that is left of a tail. A human embryo has 10 to 12 tail vertebrae at five weeks and reabsorbs most of them by eight.",
      art: { art: "body", which: "spine" },
    },
    {
      id: "ostrich", name: "An ostrich's wings", category: "vestigial",
      because: "Full wings with flight feathers on a bird that cannot fly and weighs 100 kilograms. They are used for balance when turning at 70 km/h and for display, but the flight muscles and the keel they would attach to have gone.",
      art: { art: "creature", which: "bird" },
    },
    {
      id: "appendix", name: "The human appendix", category: "vestigial",
      because: "A blind 9 cm tube on a caecum that in a rabbit is a large fermentation chamber for leaves. Ours is reduced, it holds some gut bacteria and lymphoid tissue, and you can live a normal life without it.",
      art: { art: "body", which: "largeIntestine" },
    },
  ],
};

export const g8f3JobOrAncestor = buildSim(JOB_OR_ANCESTOR);

/* ---------------------------------------------------------------- *
 * F3.3 — Shared ancestry vs convergence
 * ---------------------------------------------------------------- */

const CHANCE_OR_ANCESTRY: ArchetypeSpec = {
  id: "g8f3-chance-or-ancestry",
  title: "Chance, or Ancestry?",
  tagline: "Convergence can copy one feature. Ask it to copy forty and the odds go through the floor.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-2", "MS-LS4-3"] },
  learningGoals: [
    "Explain why many shared characters are far stronger evidence than one.",
    "Calculate the chance of two lineages matching by coincidence on independent characters.",
  ],
  misconceptions: [
    "Any similarity between two species could just as easily be coincidence",
    "One shared feature is enough to prove a relationship",
  ],
  specimens: [
    {
      id: "shared", name: "The sequence the two lineages share",
      art: { art: "dna" },
    },
  ],
  variables: [
    {
      key: "characters", label: "Independent shared characters",
      min: 1, max: 40, step: 1, default: 12,
    },
    {
      key: "species", label: "Species that all share them",
      min: 2, max: 12, step: 1, default: 2,
    },
  ],
  /*
   * Each character is scored present or absent, so an unrelated lineage has a
   * one-in-two chance of matching on each one. Matching on n independent
   * characters is 2^-n; getting m species to match is 2^-n(m-1), because each
   * extra species has to match the first one all over again.
   *
   * The log of the odds is the readable quantity — 40 characters shared by two
   * species is 12.0 powers of ten against coincidence, and the same 40 shared
   * by twelve species is 132 powers of ten, which is more than the number of
   * atoms in the galaxy. That is the difference between a resemblance and a
   * family.
   */
  measure: (v) => {
    const trials = v.characters * (v.species - 1);
    const matchProbability = Math.pow(0.5, trials);
    return {
      matchProbability,
      matchPercent: matchProbability * 100,
      oddsAgainstOneIn: 1 / matchProbability,
      powersOfTenAgainst: trials * Math.log10(2),
      charactersScored: trials,
    };
  },
  plot: {
    x: "characters", y: "powersOfTenAgainst",
    xLabel: "Independent shared characters",
    yLabel: "Powers of ten against coincidence",
  },
  /*
   * The helix is the inherited sequence the lineages have in common, and each
   * shared character is a piece of it. Its volume is the number of characters,
   * so the drawn width is the cube root — one character is a scrap, forty is
   * a strand three times as wide. The more species have to be explained, the
   * faster it turns.
   */
  drive: ({ v }) => ({
    scale: clamp(Math.cbrt(v.characters / 12), 0.4, 1.32),
    rate: 0.35 + v.species / 8,
  }),
};

export const g8f3ChanceOrAncestry = buildSim(CHANCE_OR_ANCESTRY);

/* ---------------------------------------------------------------- *
 * F3.4 — Comparing early development across species
 * ---------------------------------------------------------------- */

/** Human greatest length, mm, at 4 to 10 weeks after fertilisation. */
const HUMAN_WEEKS = [4, 5, 6, 7, 8, 9, 10];
const HUMAN_LENGTH_MM = [5, 8, 13, 18, 29, 36, 44];
/** Pharyngeal arches still showing on the outside of a human embryo. */
const HUMAN_ARCHES = [4, 4, 3, 2, 1, 0, 0];

/** Straight-line interpolation through a published table. */
function lookup(weeks: number, table: number[]): number {
  const w = clamp(weeks, HUMAN_WEEKS[0], HUMAN_WEEKS[HUMAN_WEEKS.length - 1]);
  const i = clamp(Math.floor(w) - HUMAN_WEEKS[0], 0, table.length - 2);
  const frac = w - (HUMAN_WEEKS[0] + i);
  return table[i] + (table[i + 1] - table[i]) * frac;
}

const SAME_WAIST: ArchetypeSpec = {
  id: "g8f3-same-waist",
  title: "The Same Waist in Every Vertebrate",
  tagline: "Set a fish embryo beside a human one at four weeks. Then run the human forward.",
  kind: "compare",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-2", "MS-LS4-3"] },
  learningGoals: [
    "Describe the features that every vertebrate embryo shows at the pharyngula stage.",
    "Explain that shared early development is evidence of shared ancestry, not that one species passes through another.",
  ],
  misconceptions: [
    "A human embryo passes through a fish stage and then an amphibian stage",
    "A human embryo never has gill arches or a tail",
  ],
  specimens: [
    {
      id: "fish", name: "Zebrafish embryo: six pharyngeal arches, kept for life",
      because: "Arch one becomes the jaw, arch two the hyoid, and arches three to seven carry the gills. The fish keeps every one of them and breathes through five of them.",
      art: { art: "sphere", color: "#7fb4d8", radius: 0.46 },
    },
    {
      id: "human", name: "Human embryo: four pharyngeal arches at four weeks",
      because: "The same arches form, in the same order, from the same tissue, and none of them ever carries a gill. Arch one becomes the jaw and two ear bones; arches three and four become the larynx.",
      art: { art: "sphere", color: "#c8d8e8", radius: 0.46 },
    },
  ],
  variables: [
    {
      key: "weeks", label: "Weeks after fertilisation (human)",
      min: 4, max: 10, step: 0.5, default: 5,
    },
  ],
  /*
   * Human greatest length from the Carnegie staging table: 5 mm at four weeks,
   * 13 at six, 29 at eight, 44 at ten. Over those six weeks the embryo grows
   * about ninefold while the arches on the outside of the neck are remodelled
   * away, the last groove closing at about eight weeks — except the first,
   * which stays open as the ear canal you are using now.
   *
   * The zebrafish is at its pharyngula at about 24 hours, 3.5 mm long, and
   * reaches 4.5 mm as a free-swimming larva. It keeps every arch.
   */
  measure: (v) => ({
    humanLengthMm: lookup(v.weeks, HUMAN_LENGTH_MM),
    humanArchesShowing: Math.round(lookup(v.weeks, HUMAN_ARCHES)),
    fishArchesShowing: 6,
    fishLengthMm: 3.5 + (v.weeks - 4) * 0.17,
    humanGrowthSinceWeek4: lookup(v.weeks, HUMAN_LENGTH_MM) / 5,
    tailVertebrae: v.weeks <= 5 ? 11 : v.weeks >= 8 ? 4 : Math.round(11 - (v.weeks - 5) * 2.33),
  }),
  /*
   * Both embryos are drawn at the size they really are, on one scale, so at
   * four weeks they are almost the same size and almost the same thing. Run
   * the weeks on and the human grows ninefold while the fish barely changes,
   * and the human's colour warms as its arches are taken apart and rebuilt
   * into a jaw and an ear. Nothing about the fish changes, because the fish is
   * not passing through anything: both are just doing what their own ancestors
   * did.
   */
  drive: ({ f, index }) => {
    if (index === 0) return { scale: clamp(f.fishLengthMm / 30, 0.2, 1.05) };
    return {
      scale: clamp(f.humanLengthMm / 42, 0.2, 1.05),
      color: mix("#c8d8e8", "#e0a879", clamp((4 - f.humanArchesShowing) / 4, 0, 1)),
    };
  },
};

export const g8f3SameWaist = buildSim(SAME_WAIST);

/* ---------------------------------------------------------------- *
 * F3.5 — Inferring evolutionary relationships
 * ---------------------------------------------------------------- */

const BUILD_THE_TREE: ArchetypeSpec = {
  id: "g8f3-build-the-tree",
  title: "Build the Tree From the Evidence",
  tagline: "Add one character at a time and watch the branches it forces you to draw.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS4-2", "MS-LS4-3"] },
  learningGoals: [
    "Use shared derived characters to group species into nested branches.",
    "Explain that a branching diagram is a hypothesis built from evidence, not a ladder of progress.",
  ],
  misconceptions: [
    "Evolution is a ladder from simple to complex",
    "Humans are descended from the species alive next to them on a tree",
  ],
  specimens: [
    {
      id: "tree",
      name: "A tree of vertebrate relationships, built from characters",
      art: { art: "flora", which: "tree" },
      parts: [
        {
          id: "vertebrae", name: "A backbone", at: [0, 0.32],
          note: "Everything above this point has a backbone: lampreys, sharks, cod, frogs, ostriches, you. Their ancestor lived about 525 Ma.",
        },
        {
          id: "jaws", name: "Jaws", at: [-0.28, 0.16],
          note: "About 445 Ma. A jaw is a rebuilt front pharyngeal arch. Lampreys and hagfish branch off below and never get one.",
        },
        {
          id: "bone", name: "A bony skeleton and lungs", at: [0.28, 0.06],
          note: "Sharks and rays branch off here and keep cartilage. Above: bone, plus an air sac that becomes a lung or a swim bladder.",
        },
        {
          id: "limbs", name: "Four limbs with digits", at: [-0.34, -0.10],
          note: "About 365 Ma, with Tiktaalik at 375 just below. Snakes still carry the genes for limbs; whales still carry the hip bones.",
        },
        {
          id: "amnion", name: "An egg with its own pond", at: [0.32, -0.20],
          note: "About 315 Ma; amphibians branch off below. An egg carrying its own water is what let vertebrates breed away from ponds.",
        },
        {
          id: "hair", name: "Hair and milk", at: [-0.24, -0.32],
          note: "Mammals, from about 210 Ma. Two bones that hinged a reptile's jaw became the hammer and anvil of a mammal's middle ear.",
        },
        {
          id: "placenta", name: "A placenta", at: [0.20, -0.42],
          note: "About 90 Ma; marsupials branch off just below. Every character nested inside the last one, and that nesting is the evidence.",
        },
      ],
    },
  ],
};

export const g8f3BuildTheTree = buildSim(BUILD_THE_TREE);
