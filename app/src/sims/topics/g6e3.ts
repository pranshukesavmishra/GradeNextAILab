import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E3 — Structures and behaviors for reproduction.
 *
 * Five simulations, one per subtopic:
 *
 *   E3.1  g6e3-signal-or-not     courtship behavior            (sort)
 *   E3.2  g6e3-how-many-survive  nesting and parental care     (investigate)
 *   E3.3  g6e3-inside-a-grain    flower structures and pollen  (explore)
 *   E3.4  g6e3-anther-to-seed    pollination                   (trace)
 *   E3.5  g6e3-how-far-carried   seeds and dispersal           (investigate)
 *
 * The unifying number is two. Whatever the strategy, a stable population
 * averages two surviving offspring per pair, and every structure and behaviour
 * in this topic is a different way of paying for those two.
 */

/* E3.1 — Courtship behavior. */
const SIGNAL_OR_NOT: ArchetypeSpec = {
  id: "g6e3-signal-or-not",
  title: "Is That a Courtship Signal?",
  tagline: "Animals signal all day long. Only some of it is aimed at a mate.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-4"] },
  learningGoals: [
    "Identify behaviours that function to attract or choose a mate.",
    "Explain that a costly, conspicuous display is evidence of courtship rather than of another job.",
  ],
  misconceptions: ["Any loud or showy animal behaviour is courtship"],
  categories: [
    { id: "courtship", name: "Courtship", hint: "aimed at a mate, and expensive to produce" },
    { id: "other", name: "Another job", hint: "warning, feeding or defence" },
  ],
  specimens: [
    { id: "stickleback", name: "A male stickleback turns red and dances a zigzag", category: "courtship",
      because: "The red belly appears only in the breeding season and the zigzag is aimed at any female that comes near. Males are so tuned to the colour that they will attack a red object drifting past the tank.",
      art: { art: "creature", which: "fish" } },
    { id: "frogs", name: "Male frogs calling all night from a pond", category: "courtship",
      because: "A calling male burns energy at up to twenty times his resting rate, among the highest sustained efforts measured in a cold-blooded animal. Females approach the males that keep it up longest.",
      art: { art: "habitat", which: "pond" } },
    { id: "firefly", name: "A firefly flashing a set rhythm", category: "courtship",
      because: "Each species has its own flash pattern and its own answering delay, so a male and a female of the same kind can find each other in the dark. Females of one predatory genus copy other species' answers and eat the males that arrive.",
      art: { art: "creature", which: "insect" } },
    { id: "alarm", name: "A blackbird's alarm call as a cat appears", category: "other",
      because: "A warning, and it is built to be hard to place: a thin, high note that gives a predator little to home in on. A courtship signal does the opposite and advertises exactly where the singer is.",
      art: { art: "creature", which: "bird" } },
    { id: "waggle", name: "A honeybee's waggle dance on the comb", category: "other",
      because: "A map, not a proposal. The angle of the run against vertical gives the direction from the Sun, and about one second of waggling means a kilometre of flight. The dancers are sterile workers and never breed at all.",
      art: { art: "creature", which: "bee" } },
    { id: "monarch", name: "A monarch butterfly's orange and black wings", category: "other",
      because: "A warning to birds, not to mates. The caterpillar stores poisons from the milkweed it eats, and the colours are the label. A bird that tries one monarch avoids every orange butterfly afterwards.",
      art: { art: "creature", which: "butterfly" } },
  ],
};

/* E3.2 — Nesting and parental care. */
const HOW_MANY_SURVIVE: ArchetypeSpec = {
  id: "g6e3-how-many-survive",
  title: "Two Have To Make It",
  tagline: "Lay a few and guard them, or lay thousands and walk away. The arithmetic is the same.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-4"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Calculate how many offspring survive from a clutch size and a survival rate.",
    "Explain why parental care and huge clutches are two solutions to the same problem.",
  ],
  misconceptions: ["An animal that lays more eggs leaves more descendants"],
  specimens: [{ id: "clutch", name: "A parent and one season's clutch", art: { art: "creature", which: "bird" } }],
  variables: [
    { key: "eggs", label: "Eggs laid in a season", min: 1, max: 500, step: 1, default: 9 },
    { key: "survival", label: "Percentage that reach breeding age", min: 0, max: 60, step: 0.5, default: 22 },
  ],
  // A population that is neither growing nor shrinking replaces each pair with
  // exactly two breeding adults, so the survival a clutch must achieve is
  // 200/eggs per cent. A blue tit lays about 9 eggs and both parents feed them
  // for three weeks, so it needs about 22 per cent. A cod releases up to five
  // million eggs and gives them nothing at all, so it needs 0.00004 per cent.
  // Both species are stable. Care and quantity are two ways of buying the same
  // two survivors.
  measure: (v) => ({
    survivorsPerPair: (v.eggs * v.survival) / 100,
    survivalNeededPercent: 200 / v.eggs,
    surplusOverReplacement: (v.eggs * v.survival) / 100 - 2,
  }),
  plot: { x: "eggs", y: "survivalNeededPercent", xLabel: "Eggs laid", yLabel: "Survival needed to replace the pair (%)" },
  /*
   * What is drawn is not one bird but the brood that is left at the end of the
   * season, so its width goes as the square root of the number in it: a flock
   * spreads over ground, and ground is an area. One is exactly replacement, so
   * a brood drawn at full size is a pair that has just held its own. Below that
   * the line is shrinking — the picture sinks and slows — and no amount of
   * laying fixes it if the survival rate falls with the clutch.
   */
  drive: ({ f }) => {
    const share = Math.max(0, f.survivorsPerPair) / 2;
    return {
      scale: Math.max(0.28, Math.min(1.9, Math.sqrt(share))),
      offset: [0, share < 1 ? (1 - share) * 0.45 : 0],
      rate: share < 0.5 ? 0.15 : 1,
    };
  },
};

/* E3.3 — Flower structures and pollen. */
const INSIDE_A_GRAIN: ArchetypeSpec = {
  id: "g6e3-inside-a-grain",
  title: "Inside a Pollen Grain",
  tagline: "Between 5 and 100 micrometres wide, and every part of it built for one journey.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-4"] },
  learningGoals: [
    "Name the parts of a pollen grain and give each one a function.",
    "Explain how a grain's wall and shape suit the way its species is pollinated.",
  ],
  misconceptions: ["Pollen is a seed, or a male animal cell swimming to the egg"],
  specimens: [
    {
      id: "grain", name: "A pollen grain", art: { art: "cell" },
      parts: [
        { id: "exine", name: "Exine, the outer wall", at: [-0.36, -0.16],
          note: "Built from sporopollenin, one of the toughest materials any living thing makes. It shrugs off acid and drought, so grains buried in a bog 10 000 years ago can still be named under a microscope, and the history of a forest read from them." },
        { id: "sculpture", name: "Spines and sculpturing", at: [0.29, -0.29],
          note: "Insect-carried pollen is spiny and coated in a sticky oil so it catches on hairs. Wind-carried pollen is small, smooth and dry, because anything sticky would never leave the anther. Shape alone tells you which." },
        { id: "aperture", name: "Aperture", at: [0.37, 0.08],
          note: "A thin patch in the tough wall, and the only place the tube can push out. Grasses have one; most other flowering plants have three, spaced evenly round the grain." },
        { id: "intine", name: "Intine, the inner wall", at: [-0.2, 0.31],
          note: "A soft cellulose layer just under the exine. This is the part that swells through the aperture and becomes the pollen tube, so the tough outer wall is left behind on the stigma." },
        { id: "tube", name: "Tube cell", at: [0.03, 0.03],
          note: "The larger of the two cells inside, and it never fertilises anything. Its whole job is to grow the tube and steer it down the style, guided by chemical signals from the ovule." },
        { id: "generative", name: "Generative cell", at: [-0.05, -0.33],
          note: "A cell that lives inside the tube cell and divides into two sperm cells on the way down. One fertilises the egg and one makes the seed's food store: flowering plants fertilise twice." },
      ],
    },
  ],
};

/* E3.4 — Pollination. */
const ANTHER_TO_SEED: ArchetypeSpec = {
  id: "g6e3-anther-to-seed",
  title: "From Anther to Seed",
  tagline: "Follow one grain of apple pollen the whole way, and meet every flower part it touches.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-4"] },
  learningGoals: [
    "Name the flower structures a pollen grain passes on its way to an ovule.",
    "Explain why pollination and fertilisation are two separate events.",
  ],
  misconceptions: ["Pollination and fertilisation are the same event"],
  specimens: [{ id: "grain", name: "One grain of apple pollen", art: { art: "cell" } }],
  variables: [
    { key: "hours", label: "Hours since the grain landed", min: 0, max: 72, step: 1, default: 0 },
    { key: "temperature", label: "Temperature (degrees)", min: 5, max: 30, step: 1, default: 20 },
  ],
  /*
   * An apple style is about 10 mm long and the tube drills down it at roughly
   * 0.2 mm an hour at 20 degrees, so fertilisation follows pollination by about
   * two days. Growth is enzyme work, so it follows the usual Q10 of 2: ten
   * degrees warmer and the tube goes twice as fast, ten degrees colder and it
   * halves. That is the whole of the effective pollination period. The stigma
   * stays receptive for about four days; at 10 degrees the tube needs a hundred
   * hours and misses it, and the flower drops without setting fruit.
   */
  measure: (v) => {
    const growthRate = 0.2 * Math.pow(2, (v.temperature - 20) / 10);
    const tubeLengthMm = Math.min(10, growthRate * v.hours);
    const hoursToTheOvule = 10 / growthRate;
    return {
      tubeGrowthMmPerHour: growthRate,
      tubeLengthMm,
      hoursToTheOvule,
      fertilised: tubeLengthMm >= 10 ? 1 : 0,
      missesThePeriod: hoursToTheOvule > 96 ? 1 : 0,
    };
  },
  /*
   * The grain travels. It lands on the stigma at full size and works its way
   * down the style, shrinking as it goes deeper into the tissue, and the moment
   * the tube reaches the ovule it stops dead: fertilisation is over and the
   * grain has nothing left to do. Pull the temperature down to 10 degrees and
   * watch it stall a third of the way down, which is a flower that drops.
   */
  drive: ({ f }) => {
    const p = f.tubeLengthMm / 10;
    return {
      offset: [0.5 * p, 0.85 * p - 0.3],
      scale: 1 - 0.42 * p,
      rate: f.fertilised ? 0 : 1,
    };
  },
  stages: [
    { name: "Ripe", at: 0, caption: "The anther dries, splits and offers its pollen." },
    { name: "Carried", at: 0.25, caption: "An insect moves it to a different tree. Pollination is over the moment the grain lands." },
    { name: "Growing", at: 0.5, caption: "Only now does the tube start down the style. Fertilisation has not happened yet." },
    { name: "Fused", at: 0.75, caption: "Two sperm cells arrive: one makes the embryo, one makes its food store." },
    { name: "Fruit", at: 1, caption: "The ovule hardens into a seed and the ovary swells into the apple around it." },
  ],
  route: [
    { at: [0.13, 0.62], name: "The anther",
      note: "The top of a stamen, and the flower's pollen factory. One apple flower carries about twenty stamens, and a single anther can release thousands of grains when it dries out and splits along its side." },
    { at: [0.3, 0.36], name: "The insect",
      note: "A foraging honeybee visits fifty to a hundred flowers in one trip. The bee flies with a small positive charge and the grains carry a negative one, so pollen jumps to her hairs before she even lands." },
    { at: [0.5, 0.26], name: "The stigma",
      note: "The sticky landing pad on top of the carpel, on a different tree: most apple varieties cannot use their own pollen at all. The stigma tests each grain chemically and only lets a matching one grow." },
    { at: [0.62, 0.5], name: "Down the style",
      note: "The grain swells a tube through the aperture in its wall and drills down the style, following a chemical trail. Maize tubes manage this at about a centimetre an hour down 30 cm of silk." },
    { at: [0.72, 0.74], name: "The ovule",
      note: "Inside the ovary, at the end of the trail. Two sperm cells travel down the tube: one fuses with the egg to make the embryo, the other with two more nuclei to make the endosperm that will feed it." },
    { at: [0.87, 0.46], name: "Seed and fruit",
      note: "Each fertilised ovule becomes a seed and the ovary wall becomes the flesh of the apple. An apple has ten ovules; if only a few are fertilised, the fruit grows lopsided or drops off early." },
  ],
};

/* E3.5 — Seeds and dispersal. */
const HOW_FAR_CARRIED: ArchetypeSpec = {
  id: "g6e3-how-far-carried",
  title: "How Far Will the Wind Take It?",
  tagline: "Height, wind and the speed of the fall. Three numbers decide where a seed lands.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-4"] },
  learningGoals: [
    "Predict how far a wind-dispersed seed travels from its release height, fall speed and the wind.",
    "Explain how a parachute or a wing lowers fall speed and multiplies the distance travelled.",
  ],
  misconceptions: ["A lighter seed always travels farther"],
  specimens: [{ id: "seed", name: "One seed on the wind", art: { art: "flora", which: "flower" } }],
  variables: [
    { key: "height", label: "Release height (m)", min: 0.2, max: 30, step: 0.1, default: 1 },
    { key: "wind", label: "Wind speed (m/s)", min: 0, max: 15, step: 0.5, default: 3 },
    { key: "fallSpeed", label: "Fall speed of the seed (m/s)", min: 0.1, max: 5, step: 0.05, default: 0.3 },
  ],
  // Time in the air is height over fall speed; horizontal distance is that
  // time multiplied by the wind. A dandelion pappus falls at about 0.3 m/s, so
  // from 1 m up in a 3 m/s breeze it stays airborne for 3.3 seconds and covers
  // 10 m. A maple key autorotates at about 1 m/s and gets 3 m from the same
  // release; an acorn falls at roughly 10 m/s and lands on its own roots. This
  // counts steady wind only: a thermal updraft can hold a pappus aloft for
  // hours and carry it many kilometres, which is the rare flight that puts a
  // dandelion on a new island.
  measure: (v) => ({
    timeAloftS: v.height / v.fallSpeed,
    distanceM: (v.wind * v.height) / v.fallSpeed,
    metresPerMetreOfHeight: v.wind / v.fallSpeed,
  }),
  plot: { x: "wind", y: "distanceM", xLabel: "Wind speed (m/s)", yLabel: "Distance travelled (m)" },
  /*
   * The seed goes where the arithmetic sends it. Raise the release height and
   * it climbs; put wind behind it and it is carried downrange; and because it
   * is being carried away from you it is drawn smaller the farther it gets,
   * halving in width at about 40 m. Set the fall speed to an acorn's and the
   * whole flight collapses to nothing: it lands on its own parent's roots.
   */
  drive: ({ v, f }) => ({
    offset: [Math.min(1.2, f.distanceM / 45), -Math.min(1, v.height / 30)],
    scale: 1 / (1 + f.distanceM / 40),
  }),
};

export const g6e3SignalOrNot = buildSim(SIGNAL_OR_NOT);
export const g6e3HowManySurvive = buildSim(HOW_MANY_SURVIVE);
export const g6e3InsideAGrain = buildSim(INSIDE_A_GRAIN);
export const g6e3AntherToSeed = buildSim(ANTHER_TO_SEED);
export const g6e3HowFarCarried = buildSim(HOW_FAR_CARRIED);
