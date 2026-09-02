import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit D · Topic D2 — Food webs and energy flow.
 *
 * Five simulations, one per subtopic:
 *
 *   D2.1  g7d2-three-jobs        producers, consumers, decomposers   (sort)
 *   D2.2  g7d2-build-the-web     from food chain to food web         (assemble)
 *   D2.3  g7d2-five-floors       trophic levels                      (explore)
 *   D2.4  g7d2-tenth-of-a-tenth  why energy decreases                (investigate)
 *   D2.5  g7d2-silver-springs    reading an energy pyramid           (process)
 *
 * The numbers are Odum's 1957 Silver Springs survey, still the most quoted
 * energy budget in ecology: 1 700 000 kcal of sunlight per square metre per
 * year, 20 810 fixed by the plants, 3 368 in the herbivores, 383 in the
 * carnivores, 21 in the top carnivores and 5 060 through the decomposers.
 * Every efficiency quoted in this topic is one of those ratios.
 */

/* ---------------------------------------------------------------- *
 * D2.1 — Producers, consumers and decomposers
 * ---------------------------------------------------------------- */

const THREE_JOBS: ArchetypeSpec = {
  id: "g7d2-three-jobs",
  title: "Three Jobs in Every Ecosystem",
  tagline: "Makes it, eats it, or takes it apart. Every living thing here does one of the three.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Classify organisms as producers, consumers or decomposers by where their energy comes from.",
    "Explain that only producers add new chemical energy to an ecosystem.",
  ],
  misconceptions: [
    "Plants take their food from the soil",
    "Decomposers are just consumers with a nastier diet",
  ],
  categories: [
    { id: "producer", name: "Producer", hint: "builds sugar from light and carbon dioxide" },
    { id: "consumer", name: "Consumer", hint: "gets its energy by eating something living" },
    { id: "decomposer", name: "Decomposer", hint: "breaks dead material back into ions" },
  ],
  specimens: [
    {
      id: "oak-leaf", name: "Oak leaf, mid-July", category: "producer",
      because: "Each chloroplast runs 6 CO2 + 6 H2O to C6H12O6 + 6 O2 on sunlight. A temperate oak wood fixes about 1 200 g of dry matter per square metre per year, and every consumer here is spending some of it.",
      art: { art: "cell", plant: true },
    },
    {
      id: "diatom", name: "Diatom in the plankton", category: "producer",
      because: "Marine phytoplankton fix roughly 50 gigatonnes of carbon a year, about half of all the photosynthesis on Earth, in cells you need a microscope to find.",
      art: { art: "organelle", which: "chloroplast" },
    },
    {
      id: "caterpillar", name: "Winter moth caterpillar", category: "consumer",
      because: "It cannot build sugar, only take it. About a tenth of the leaf it eats becomes caterpillar; the rest is respired away or passed out as frass.",
      art: { art: "sphere", color: "#8fbf3f", radius: 0.46 },
    },
    {
      id: "blue-tit", name: "Blue tit feeding a brood", category: "consumer",
      because: "One brood is fed about 10 000 caterpillars in three weeks. Still a consumer: every joule in those chicks came from the oak, two steps back.",
      art: { art: "sphere", color: "#3f7fd0", radius: 0.44 },
    },
    {
      id: "soil-bacteria", name: "Soil bacteria under the leaf litter", category: "decomposer",
      because: "A single gram of forest soil holds around a billion bacteria. They finish what the fungi start and hand nitrogen and phosphorus back as ions that roots can take up.",
      art: { art: "microbe", which: "bacterium" },
    },
    {
      id: "mycelium", name: "Fungal mycelium through the leaf litter", category: "decomposer",
      because: "A gram of forest soil can hold 100 m of fungal thread. Fungi carry the enzymes that split lignin, which is the only reason dead wood disappears at all.",
      art: { art: "sphere", color: "#a8834e", radius: 0.48 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D2.2 — From food chain to food web
 * ---------------------------------------------------------------- */

const BUILD_THE_WEB: ArchetypeSpec = {
  id: "g7d2-build-the-web",
  title: "One Chain Is Never Enough",
  tagline: "Start from the grass and add each feeder until the straight line turns into a web.",
  kind: "assemble",
  subject: "biology",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Build a food web from the organisms of one meadow and their feeding links.",
    "Explain why most consumers sit on more than one chain, and what that does to the ecosystem when one prey species fails.",
  ],
  misconceptions: [
    "Each animal eats only one kind of food",
    "Removing one species only affects the species directly above it",
  ],
  specimens: [
    {
      id: "meadow", name: "Meadow grass: 600 g of dry matter per square metre per year",
      art: { art: "cell", plant: true },
      parts: [
        { id: "grasshopper", name: "Grasshopper", at: [-0.55, -0.42],
          note: "Eats grass and nothing else. Roughly 30 g of grass a season becomes about 3 g of grasshopper - a tenth gets through, the rest is respired or dropped." },
        { id: "vole", name: "Field vole", at: [0.56, -0.34],
          note: "Eats about 80 g of grass a day, close to its own body mass. Rough grassland can carry 200 voles a hectare in a good year, and almost nothing in a bad one." },
        { id: "spider", name: "Wolf spider", at: [-0.62, -0.02],
          note: "Eats grasshoppers and beetles, and is itself eaten by the kestrel. Second level on one chain and first meal on another: this is exactly where a chain stops being a line." },
        { id: "kestrel", name: "Kestrel", at: [0.6, 0.16],
          note: "Needs about 65 g of food a day - four voles, or the same mass of beetles, lizards and spiders. When the voles crash it switches, and the switching is what a web is for." },
        { id: "owl", name: "Barn owl", at: [0.52, 0.46],
          note: "Three to four voles a night, about 1 400 a year. Its diet is far narrower than the kestrel's, so a vole crash hits owls much harder than it hits kestrels." },
        { id: "fox", name: "Red fox", at: [-0.5, 0.44],
          note: "Voles, rabbits, beetles, earthworms and blackberries. A fox feeds at three levels at once, so no single arrow describes what it does to this meadow." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D2.3 — Trophic levels
 * ---------------------------------------------------------------- */

const FIVE_FLOORS: ArchetypeSpec = {
  id: "g7d2-five-floors",
  title: "Five Floors in One Lake",
  tagline: "Sample the lake and count how many meals separate each animal from the sunlight.",
  kind: "explore",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Assign an organism to a trophic level by counting the feeding steps back to the producers.",
    "Explain why the number of levels an ecosystem can support is limited by the energy left at the top.",
  ],
  misconceptions: [
    "A big animal must be at a high trophic level",
    "An organism sits at exactly one trophic level for its whole life",
  ],
  specimens: [
    {
      id: "lake", name: "A lake, sampled from the surface to the weed bed",
      art: { art: "glassware", which: "flask", level: 0.62, color: "#3f8fa8", bubbles: 0.35 },
      parts: [
        { id: "phyto", name: "Level 1: phytoplankton", at: [-0.56, -0.44],
          note: "Producers. In a productive lake they fix about 300 g of carbon per square metre per year. Every floor above this one is spending that same energy." },
        { id: "daphnia", name: "Level 2: Daphnia", at: [0.58, -0.32],
          note: "Primary consumer. It filters a few millilitres of water an hour and turns roughly a tenth of what it swallows into Daphnia. Two steps from the sun, one tenth of the energy." },
        { id: "nymph", name: "Level 3: damselfly nymph", at: [-0.62, -0.02],
          note: "Secondary consumer, eating Daphnia. Three steps from the sun and already down to about 1 per cent of what the algae captured." },
        { id: "stickleback", name: "Level 4: three-spined stickleback", at: [0.6, 0.18],
          note: "Tertiary consumer, about 0.1 per cent of the original energy. It must eat several hundred nymphs to put on its 2 g." },
        { id: "pike", name: "Level 5: pike", at: [-0.5, 0.44],
          note: "Top predator, roughly 0.01 per cent. At a tenth per step, a 5 kg pike stands on 50 kg of stickleback, 500 kg of nymph, 5 000 kg of Daphnia and 50 000 kg of algae." },
        { id: "bacteria", name: "Every level: decomposers", at: [0.5, 0.46],
          note: "Bacteria and fungi feed from all five floors at once, so they belong to none of them. At Silver Springs they handled 5 060 kcal per square metre per year, more than every animal there put together." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * D2.4 — Why energy decreases at each level
 * ---------------------------------------------------------------- */

const TENTH_OF_A_TENTH: ArchetypeSpec = {
  id: "g7d2-tenth-of-a-tenth",
  title: "A Tenth of a Tenth of a Tenth",
  tagline: "Set the transfer efficiency and watch how little is left four meals up.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Calculate the energy left at a trophic level from the producers' energy and the transfer efficiency.",
    "Explain the ten per cent rule: most energy at each level is respired, excreted or never eaten.",
  ],
  misconceptions: [
    "Energy is destroyed when a predator eats prey",
    "A food chain could have any number of levels",
  ],
  specimens: [
    { id: "sunlight", name: "The producers' catch, spent one meal at a time",
      art: { art: "sphere", color: "#f2c14e", radius: 0.5, glow: 1 } },
  ],
  variables: [
    { key: "producer", label: "Energy fixed by the producers (kcal per m2 per year)", min: 2000, max: 30000, step: 100, default: 20810 },
    { key: "efficiency", label: "Passed on at each step (per cent)", min: 2, max: 25, step: 0.5, default: 10 },
    { key: "level", label: "Trophic level (1 = producers)", min: 1, max: 5, step: 0.1, default: 4 },
  ],
  // E(L) = E1 * f^(L-1). At Silver Springs' 20 810 kcal per m2 per year and a
  // clean tenth per step, level 4 leaves 20.81 kcal - and a person needing
  // 2 000 kcal a day, 730 000 a year, would need 35 078 m2 of spring to eat
  // at that level and only 35 m2 to eat at level 1.
  measure: (v) => {
    const f = v.efficiency / 100;
    const e = v.producer * Math.pow(f, v.level - 1);
    return {
      energyAvailable: e,
      percentOfProducers: 100 * Math.pow(f, v.level - 1),
      squareMetresPerPerson: 730000 / e,
    };
  },
  plot: {
    x: "level", y: "energyAvailable",
    xLabel: "Trophic level", yLabel: "Energy available (kcal per m2 per year)",
  },
};

/* ---------------------------------------------------------------- *
 * D2.5 — Reading an energy pyramid
 * ---------------------------------------------------------------- */

const SILVER_SPRINGS: ArchetypeSpec = {
  id: "g7d2-silver-springs",
  title: "Silver Springs, Floor by Floor",
  tagline: "Climb a real energy pyramid, measured in Florida in 1957, one level at a time.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Read an energy pyramid and work out the efficiency of each transfer from the numbers on it.",
    "Explain why the decomposers handle more energy than all the animals combined.",
  ],
  misconceptions: [
    "An energy pyramid could be inverted, with more energy at the top",
    "Decomposers are a small side branch of the pyramid",
  ],
  specimens: [
    { id: "respiration", name: "Respiration: where the missing nine tenths goes",
      art: { art: "organelle", which: "mitochondrion" } },
  ],
  stages: [
    { name: "Sunlight", at: 0,
      caption: "1 700 000 kcal falls on every square metre of the spring each year." },
    { name: "Producers", at: 0.2,
      caption: "Eelgrass and algae fix 20 810 kcal: 1.2 per cent of the sunlight. Everything above lives on this." },
    { name: "Herbivores", at: 0.4,
      caption: "3 368 kcal, 16.2 per cent of the plants. The rest was never eaten, or was respired away." },
    { name: "Carnivores", at: 0.6,
      caption: "383 kcal, 11.4 per cent of the herbivores and 1.8 per cent of the plants." },
    { name: "Top carnivores", at: 0.8,
      caption: "21 kcal. That is 5.5 per cent of the carnivores and one part in a thousand of the plants." },
    { name: "Decomposers", at: 1,
      caption: "5 060 kcal, more than every animal in the spring put together. The pyramid has a floor most drawings leave out." },
  ],
};

export const g7d2ThreeJobs = buildSim(THREE_JOBS);
export const g7d2BuildTheWeb = buildSim(BUILD_THE_WEB);
export const g7d2FiveFloors = buildSim(FIVE_FLOORS);
export const g7d2TenthOfATenth = buildSim(TENTH_OF_A_TENTH);
export const g7d2SilverSprings = buildSim(SILVER_SPRINGS);
