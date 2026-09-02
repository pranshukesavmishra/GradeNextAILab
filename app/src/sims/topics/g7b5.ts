import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B5 — Synthetic materials from natural resources.
 *
 * Five simulations, one per subtopic:
 *
 *   B5.1  g7b5-oil-to-bag         petroleum and plastics              (trace)
 *   B5.2  g7b5-rock-to-girder     ores and alloys                     (process)
 *   B5.3  g7b5-where-did-it-start medicines and synthetic fibres      (sort)
 *   B5.4  g7b5-the-bottle-bargain benefit and cost of one material    (explore)
 *   B5.5  g7b5-two-shirts         a natural and a synthetic option    (compare)
 *
 * Where a figure is an industry estimate rather than a constant it is written
 * as one: energy per kilogram of PET and litres of water per cotton shirt are
 * ranges in the literature, and the text says so.
 */

/* ---------------------------------------------------------------- *
 * B5.1 — Petroleum and plastics
 * ---------------------------------------------------------------- */

const OIL_TO_BAG: ArchetypeSpec = {
  id: "g7b5-oil-to-bag",
  title: "From Buried Plankton to a Carrier Bag",
  tagline: "Follow one pair of carbon atoms out of the ground and into a polymer chain.",
  kind: "trace",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-3"] },
  learningGoals: [
    "Describe how a synthetic material is made from a natural resource by separation and reaction.",
    "Distinguish the physical separation of crude oil from the chemical steps that follow it.",
  ],
  misconceptions: [
    "Plastic is a substance found in the ground",
    "Refining oil turns it into plastic in one step",
  ],
  specimens: [
    {
      id: "hydrocarbon", name: "A hydrocarbon out of the crude oil",
      art: { art: "molecule", formula: "CH4" },
    },
  ],
  stages: [
    { name: "Underground", at: 0, caption: "Crude oil: a mixture of hydrocarbons from CH4 up to chains of 70 carbons." },
    { name: "Column", at: 0.25, caption: "Distilled into fractions by boiling range. Nothing reacts: this step is physical." },
    { name: "Cracking", at: 0.5, caption: "C10H22 gives C8H18 + C2H4 over a zeolite catalyst at 600 to 700 C." },
    { name: "Polymerising", at: 0.75, caption: "Thousands of ethene molecules open their double bonds and link into one chain." },
    { name: "The bag", at: 1, caption: "5 g of polythene, about 1.1 x 10^23 ethene units, and every atom came out of the ground." },
  ],
  route: [
    {
      at: [0.08, 0.35], name: "Buried plankton",
      note: "Crude oil is the remains of marine plankton buried under mud and cooked for tens of millions of years at two to four kilometres down. What comes up is a mixture: methane, petrol-sized molecules, and chains of seventy carbons and more.",
    },
    {
      at: [0.25, 0.62], name: "The fractionating column",
      note: "The oil is heated to about 350 C and fed in as vapour. The column is hot at the bottom and cool at the top, so each fraction condenses where it can: refinery gas below 25 C, petrol between 40 and 100, kerosene 150 to 250, diesel 250 to 350, bitumen above that. Separation only - no molecule has changed.",
    },
    {
      at: [0.42, 0.3], name: "Cracking",
      note: "There is far more long-chain oil than the world wants and never enough short chains. Passed over a zeolite catalyst at 600 to 700 C the long ones snap: C10H22 gives C8H18 + C2H4. Ten carbons in, ten carbons out, in two new molecules. This step is a chemical change.",
    },
    {
      at: [0.59, 0.58], name: "One ethene molecule",
      note: "C2H4, 28.05 g per mole, with a double bond between the two carbons. That double bond is the handle. It can open, leaving each carbon with a spare hand to hold the molecule next door.",
    },
    {
      at: [0.76, 0.3], name: "Polymerisation",
      note: "Under pressure, or over a Ziegler-Natta catalyst, the double bonds open in turn and the molecules join end to end. A polythene chain of 10 000 units has a molar mass near 280 000 g. Nothing is added and nothing is given off, so the polymer weighs exactly what the ethene did.",
    },
    {
      at: [0.91, 0.6], name: "The bag on the counter",
      note: "A 5 g carrier bag holds about 1.1 x 10^23 ethene units in tangled chains. The carbon in it was alive before the dinosaurs, spent a hundred million years underground, and is stable enough to still be intact in a century.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.2 — Ores and alloys
 * ---------------------------------------------------------------- */

const ROCK_TO_GIRDER: ArchetypeSpec = {
  id: "g7b5-rock-to-girder",
  title: "Rock In, Girder Out",
  tagline: "A thousand kilograms of red rock, and 699 kilograms of it is iron waiting to be let go.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-3"] },
  learningGoals: [
    "Explain how a metal is won from its ore by taking the oxygen away.",
    "Describe an alloy as a mixture designed to have properties the pure metal lacks.",
  ],
  misconceptions: [
    "Metals are found in the ground as metal",
    "Steel is a pure element",
  ],
  specimens: [
    {
      id: "furnace", name: "Blast furnace, 30 m tall",
      art: { art: "apparatus", which: "burner" },
    },
  ],
  stages: [
    {
      name: "The ore", at: 0,
      caption: "Haematite is Fe2O3: 159.69 g per mole, of which 111.69 g is iron. That is 69.9 per cent iron by mass, locked to oxygen.",
    },
    {
      name: "The charge", at: 0.2,
      caption: "Ore, coke and limestone go in at the top; air at 1 200 C is blasted in at the bottom. The furnace runs for years without stopping.",
    },
    {
      name: "Making the worker", at: 0.4,
      caption: "C + O2 gives CO2 near 1 900 C, then CO2 + C gives 2 CO. Carbon monoxide is the substance that will do the actual job.",
    },
    {
      name: "Reduction", at: 0.6,
      caption: "Fe2O3 + 3 CO gives 2 Fe + 3 CO2. The oxygen leaves the iron and goes off with the carbon. A tonne of pure haematite yields 699 kg of iron.",
    },
    {
      name: "Slag", at: 0.8,
      caption: "CaCO3 gives CaO + CO2, then CaO + SiO2 gives CaSiO3. The sand in the rock leaves as a molten slag that floats and is tapped off separately.",
    },
    {
      name: "Iron into steel", at: 1,
      caption: "What runs out at 1 500 C is 4 per cent carbon and snaps under load. Blow oxygen through to burn the carbon below 1 per cent and it becomes steel; add 18 per cent chromium and 8 per cent nickel and it stops rusting.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.3 — Medicines and synthetic fibres
 * ---------------------------------------------------------------- */

const WHERE_DID_IT_START: ArchetypeSpec = {
  id: "g7b5-where-did-it-start",
  title: "Where Did It Start Out?",
  tagline: "Eight manufactured things. Every one of them began as something you could dig, pump, breathe or grow.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-3"] },
  learningGoals: [
    "Trace a synthetic material back to the natural resource it was made from.",
    "Recognise that new substances are made from existing atoms, never from nothing.",
  ],
  misconceptions: [
    "Synthetic means made without any natural raw material",
    "Man-made materials come from a factory rather than from the Earth",
  ],
  categories: [
    { id: "oil", name: "From crude oil", hint: "pumped up" },
    { id: "ore", name: "From an ore", hint: "dug out" },
    { id: "air", name: "From the air", hint: "already around you" },
    { id: "life", name: "From a living thing", hint: "grown" },
  ],
  specimens: [
    {
      id: "nylon", name: "Nylon climbing rope", category: "oil",
      because: "Nylon-6,6 is built from adipic acid and hexane-1,6-diamine, both made from crude oil fractions. It was first made in 1935, it does not rot, and it stretches under a shock load instead of snapping, which is exactly what a falling climber needs.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "fleece", name: "Polyester fleece", category: "oil",
      because: "The fibre is poly(ethylene terephthalate), the same polymer as a drinks bottle. Around 25 recycled bottles make one adult fleece, and the chains are the same either way.",
      art: { art: "glassware", which: "flask", level: 0.6, color: "#8fc4e6" },
    },
    {
      id: "can", name: "Aluminium can", category: "ore",
      because: "Bauxite is refined to Al2O3, then split by electrolysis in molten cryolite at about 950 C. It takes roughly 14 kWh, about 50 MJ, for every kilogram of metal - which is why recycling a can, at about 5 per cent of that, matters so much.",
      art: { art: "sphere", color: "#c8ced7", radius: 0.4 },
    },
    {
      id: "girder", name: "Steel girder", category: "ore",
      because: "Haematite, Fe2O3, reduced by carbon monoxide in a blast furnace, then blown with oxygen to bring the carbon below 1 per cent. A tonne of pure ore holds 699 kg of iron and not one gram of it was metal underground.",
      art: { art: "apparatus", which: "magnet" },
    },
    {
      id: "ammonia", name: "Ammonia fertiliser", category: "air",
      because: "N2 + 3 H2 gives 2 NH3, at 450 C and 200 atmospheres over an iron catalyst. The nitrogen is simply taken from the air, which is 78 per cent N2. Roughly half the nitrogen atoms in a person alive today came through this process.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "oxygen", name: "Oxygen cylinder for a hospital", category: "air",
      because: "Air is chilled below -200 C and distilled. Nitrogen boils off first at -195.8 C and oxygen is left at -183.0 C. It is a separation, not a reaction: the oxygen was there all along at 21 per cent.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "rayon", name: "Viscose scarf", category: "life",
      because: "Wood pulp is cellulose. Dissolve it, squeeze the solution through holes finer than a hair and set it again, and you get a fibre that drapes like silk. The chains were grown by a tree; the shape was made in a factory.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#d8c8a4" },
    },
    {
      id: "penicillin", name: "Penicillin", category: "life",
      because: "Alexander Fleming found it coming from a mould in 1928. It is still made by growing Penicillium in tanks of 100 000 litres and purifying what the mould gives off. Chemists then modify that molecule to make the newer antibiotics.",
      art: { art: "glassware", which: "flask", level: 0.62, color: "#d6c76a", precipitate: 0.25 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.4 — Benefit and cost of a synthetic material
 * ---------------------------------------------------------------- */

const THE_BOTTLE_BARGAIN: ArchetypeSpec = {
  id: "g7b5-the-bottle-bargain",
  title: "The Bargain in a Plastic Bottle",
  tagline: "Ten grams that carry half a kilogram, do not shatter, and do not go away.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-3"] },
  learningGoals: [
    "Name the property that made a synthetic material worth inventing.",
    "Weigh the benefit of a material against the cost of making and disposing of it.",
  ],
  misconceptions: [
    "Plastics were invented to be cheap rather than to do a job",
    "A material is simply good or bad rather than a set of trade-offs",
  ],
  specimens: [
    {
      id: "bottle", name: "500 cm3 PET bottle",
      art: { art: "glassware", which: "flask", level: 0.68, color: "#a4d6ef" },
      parts: [
        {
          id: "what", name: "What it is", at: [-0.34, -0.3],
          note: "Poly(ethylene terephthalate), a chain built by joining ethylene glycol to terephthalic acid over and over. Both come from crude oil, and the polymer was patented for fibres in 1941 before anyone thought of bottles.",
        },
        {
          id: "mass", name: "The mass it saves", at: [0.34, -0.28],
          note: "The bottle weighs about 10 g and carries 500 g of water: the container is 2 per cent of what you lift. The same volume in glass weighs around 300 g, so a lorry carries far more drink and far less packaging.",
        },
        {
          id: "energy", name: "Energy to make it", at: [-0.36, 0.02],
          note: "PET resin takes roughly 80 MJ per kilogram once the oil, the reactions and the moulding are counted, so about 0.8 MJ for one bottle. That is comparable to the food energy in a chocolate bar, spent on a container used for minutes.",
        },
        {
          id: "why", name: "Why it wins on the shelf", at: [0.34, 0.06],
          note: "It does not shatter, it is clear enough to see the drink, and it holds pressurised carbon dioxide in a fizzy drink for months. Very few materials do all three, and none of the cheap natural ones do.",
        },
        {
          id: "cost", name: "The cost that lasts", at: [-0.22, 0.36],
          note: "Nothing in nature evolved to digest this chain, so it does not rot. In the sea it grinds down into fragments under 5 mm, which have been found in Arctic ice and in the deepest ocean trench. No end point for those fragments has been measured.",
        },
        {
          id: "recycle", name: "Recycling", at: [0.24, 0.36],
          note: "PET can be washed, shredded and melted into fibre or new bottles for well under half the energy of new resin. But every melt shortens the chains a little, so the same material cannot go round for ever.",
        },
        {
          id: "trade", name: "The trade itself", at: [0.02, -0.45],
          note: "Every synthetic material is the same kind of bargain: a property you want, bought with a cost somewhere else - energy, a finite resource, or a waste that outlives you. Judging one honestly means naming both sides, not just the side you notice.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.5 — Comparing a natural and a synthetic alternative
 * ---------------------------------------------------------------- */

const TWO_SHIRTS: ArchetypeSpec = {
  id: "g7b5-two-shirts",
  title: "Two Shirts, Same Size",
  tagline: "One was grown and drank a bathful of water. One was refined and cost twice the energy.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-3"] },
  learningGoals: [
    "Compare a natural and a synthetic material on more than one criterion at once.",
    "Explain why the better choice depends on which cost you are trying to avoid.",
  ],
  misconceptions: [
    "Natural materials always have the smaller environmental cost",
    "One number is enough to decide which material is better",
  ],
  specimens: [
    {
      id: "cotton", name: "Cotton shirt, 250 g, grown",
      because: "Cellulose fibre from a cotton boll. Growing it is where the cost sits: published estimates put a single shirt near 2 700 litres of water once irrigation is counted, and fibre production at roughly 55 MJ per kilogram. In exchange the fibre absorbs about 8 per cent of its own weight in moisture, which is why it feels comfortable, and it is digested by soil organisms when it is finally thrown away.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#e8ded0" },
    },
    {
      id: "polyester", name: "Polyester shirt, 250 g, refined",
      because: "PET fibre from crude oil. Estimates put it near 125 MJ per kilogram, about double cotton, but the fibre step uses almost no water. It dries in minutes because it absorbs under 0.5 per cent of its weight, it does not rot - which is both the selling point and the disposal problem - and every wash sheds hundreds of thousands of fibres too small for a filter to catch.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#9dc9e6" },
    },
  ],
};

export const g7b5OilToBag = buildSim(OIL_TO_BAG);
export const g7b5RockToGirder = buildSim(ROCK_TO_GIRDER);
export const g7b5WhereDidItStart = buildSim(WHERE_DID_IT_START);
export const g7b5TheBottleBargain = buildSim(THE_BOTTLE_BARGAIN);
export const g7b5TwoShirts = buildSim(TWO_SHIRTS);
