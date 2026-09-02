import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E1 — The rock cycle.
 *
 * Five simulations, one per subtopic:
 *
 *   E1.1  g7e1-slow-cool-big-crystals   igneous rock                  (investigate)
 *   E1.2  g7e1-grain-to-stone           sedimentary rock              (process)
 *   E1.3  g7e1-squeezed-not-melted      metamorphic rock              (explore)
 *   E1.4  g7e1-name-that-rock           identifying from evidence     (sort)
 *   E1.5  g7e1-two-engines              the energy driving the cycle  (trace)
 *
 * The arithmetic the topic leans on is the conductive cooling time of a magma
 * body, t = d squared over the thermal diffusivity of rock, which is why a lava
 * flow is glassy and a batholith is coarse. Every temperature, pressure and
 * density quoted is a measured value a student can look up.
 */

/** Thermal diffusivity of crustal rock, metres squared per second. */
const KAPPA = 1.0e-6;
/** Seconds in a Julian year. */
const YEAR_S = 3.15576e7;
/** Mean density of continental crust, kilograms per cubic metre. */
const CRUST_DENSITY = 2700;
const G = 9.81;

/* E1.1 — Igneous rock: cooling rate sets crystal size. */
const SLOW_COOL_BIG_CRYSTALS: ArchetypeSpec = {
  id: "g7e1-slow-cool-big-crystals",
  title: "Slow Cooling, Big Crystals",
  tagline: "The same melt makes granite or makes glass. Only the cooling time is different.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Calculate how long a body of magma takes to cool from its thickness.",
    "Explain why intrusive rock is coarse grained and extrusive rock is fine grained or glassy.",
  ],
  misconceptions: [
    "Big crystals mean the magma was hotter",
    "Igneous rock always comes out of a volcano",
  ],
  specimens: [{ id: "body", name: "Magma body", art: { art: "landform", which: "volcano" } }],
  variables: [
    { key: "thickness", label: "Thickness of the magma body (m)", min: 0.5, max: 5000, step: 0.5, default: 100 },
    { key: "depth", label: "Depth it cools at (km)", min: 0, max: 30, step: 0.5, default: 5 },
  ],
  // Conduction sets the pace. For a sheet of magma of thickness d the time to
  // solidify is close to d squared divided by the thermal diffusivity of rock,
  // 1.0e-6 m2/s. A 1 m dyke freezes in under a fortnight; a 5 km batholith
  // takes the better part of a million years, and the crystals grow the whole
  // time. Confining pressure is the weight of the rock above: rho g h.
  measure: (v) => {
    const coolingSeconds = (v.thickness * v.thickness) / KAPPA;
    const coolingYears = coolingSeconds / YEAR_S;
    return {
      coolingYears,
      coolingDays: coolingSeconds / 86400,
      // 1100 degrees C of magma down to 100 degrees C of warm rock.
      coolingRateCPerYear: 1000 / coolingYears,
      pressureMPa: (CRUST_DENSITY * G * v.depth * 1000) / 1e6,
      pressureAtmospheres: (CRUST_DENSITY * G * v.depth * 1000) / 101325,
    };
  },
  plot: {
    x: "thickness", y: "coolingYears",
    xLabel: "Thickness of the body (m)", yLabel: "Time to solidify (years)",
  },
};

/* E1.2 — Sedimentary rock: loose grains become stone. */
const GRAIN_TO_STONE: ArchetypeSpec = {
  id: "g7e1-grain-to-stone",
  title: "From Loose Grain to Solid Stone",
  tagline: "Follow one quartz grain from a crumbling mountain to a slab of sandstone.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Put weathering, transport, deposition, burial, compaction and cementation in order.",
    "Explain how pore space is lost as sediment turns into rock.",
  ],
  misconceptions: ["Sedimentary rock is made by heat", "Rock layers are poured in already solid"],
  specimens: [{ id: "beds", name: "Sedimentary beds", art: { art: "landform", which: "strata" } }],
  stages: [
    { name: "Weathering", at: 0,
      caption: "Granite breaks up. Feldspar rots to clay, but quartz, hardness 7, survives as loose grains." },
    { name: "Transport", at: 0.2,
      caption: "A river carries the grains. Corners are knocked off within a few kilometres, so the grains round as they travel." },
    { name: "Deposition", at: 0.4,
      caption: "The current slows below the speed needed to carry them and the sand drops. Fresh sand holds about 45 per cent pore space." },
    { name: "Burial", at: 0.6,
      caption: "Two kilometres of sediment piles on top: 2 200 kg per cubic metre times 9.81 times 2 000 metres is about 43 MPa. Pore space falls to 20 per cent." },
    { name: "Cementation", at: 0.8,
      caption: "Groundwater deposits silica and calcite in the remaining gaps. Pore space drops near 10 per cent and the loose sand is now sandstone." },
    { name: "Uplift", at: 1,
      caption: "Millimetres a year of uplift bring the bed back to the surface, where weathering starts on it again." },
  ],
};

/* E1.3 — Metamorphic rock: changed in the solid state. */
const SQUEEZED_NOT_MELTED: ArchetypeSpec = {
  id: "g7e1-squeezed-not-melted",
  title: "Squeezed, Not Melted",
  tagline: "A hand specimen of schist. Every feature records the temperature and pressure it survived.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Identify the features that show a rock has been metamorphosed.",
    "Read the depth and temperature a rock reached from the minerals in it.",
  ],
  misconceptions: [
    "Metamorphic rock has been melted and re-frozen",
    "Foliation is the original sedimentary bedding",
  ],
  specimens: [{
    id: "schist", name: "Garnet mica schist",
    art: { art: "landform", which: "metamorphic" },
    parts: [
      { id: "foliation", name: "Foliation", at: [-0.52, -0.42],
        note: "Flat mineral grains have all rotated until they lie across the direction of squeezing. The rock stayed solid throughout; nothing was ever a liquid." },
      { id: "mica", name: "Aligned mica", at: [0.48, -0.38],
        note: "Biotite and muscovite grew as plates, all facing the same way. Thousands of them catch the light at once, which is why a schist glitters." },
      { id: "garnet", name: "Garnet crystal", at: [0.5, 0.16],
        note: "Garnet needs roughly 450 degrees C and 400 MPa to grow. At 26.5 MPa per kilometre of crust that is about 15 km down, so this crystal is a depth gauge." },
      { id: "banding", name: "Colour banding", at: [-0.55, 0.2],
        note: "Above about 600 degrees C the pale quartz and feldspar separate from the dark mica and amphibole into bands a few millimetres wide. That is gneiss." },
      { id: "relict", name: "Relict bedding", at: [0.02, 0.56],
        note: "Faint traces of the original layering, cutting across the new foliation at an angle. It says the parent rock was a mudstone." },
      { id: "limit", name: "The melting line", at: [-0.12, -0.62],
        note: "Above about 700 degrees C the rock begins to melt and becomes migmatite, part metamorphic and part igneous. This sample stopped just short of that line." },
    ],
  }],
};

/* E1.4 — Identifying a sample from the evidence in it. */
const NAME_THAT_ROCK: ArchetypeSpec = {
  id: "g7e1-name-that-rock",
  title: "Name That Rock",
  tagline: "Nine hand specimens. Texture tells you the family, not colour.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Sort rocks into the three families using texture rather than colour.",
    "Give the evidence for each identification.",
  ],
  misconceptions: ["Rocks of the same colour belong to the same family", "Dark rock is always igneous"],
  categories: [
    { id: "igneous", name: "Igneous", hint: "crystals grown from a melt, or glass" },
    { id: "sedimentary", name: "Sedimentary", hint: "grains carried here and glued together" },
    { id: "metamorphic", name: "Metamorphic", hint: "squeezed solid until the minerals lined up" },
  ],
  specimens: [
    { id: "granite", name: "Granite", category: "igneous",
      because: "Interlocking crystals 2 to 5 mm across, grown while a pluton cooled for hundreds of thousands of years. Density 2.7 g per cubic centimetre.",
      art: { art: "landform", which: "igneous" } },
    { id: "basalt", name: "Basalt", category: "igneous",
      because: "The same kind of melt cooled in days at the surface, so no crystal got past 0.1 mm. Density 3.0, which is why ocean floor sits lower than continent.",
      art: { art: "landform", which: "igneous" } },
    { id: "obsidian", name: "Obsidian", category: "igneous",
      because: "Cooled so fast that no crystal formed at all. It is a glass, and it breaks in curved conchoidal shells, like a bottle.",
      art: { art: "landform", which: "igneous" } },
    { id: "sandstone", name: "Sandstone", category: "sedimentary",
      because: "Rounded quartz grains you can rub off with a thumb, cemented by silica, with 15 to 25 per cent pore space still between them.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "limestone", name: "Limestone", category: "sedimentary",
      because: "Calcium carbonate, mostly shell and coral fragments. A drop of dilute acid makes it fizz, and no other common rock does that.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "shale", name: "Shale", category: "sedimentary",
      because: "Clay particles finer than 0.004 mm, settled flat out of still water. It splits into sheets along the bedding it was laid down on.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "slate", name: "Slate", category: "metamorphic",
      because: "Shale squeezed at about 200 degrees C and 300 MPa. It splits along a new cleavage that cuts across the old bedding at an angle.",
      art: { art: "landform", which: "metamorphic" } },
    { id: "gneiss", name: "Gneiss", category: "metamorphic",
      because: "Granite taken to about 650 degrees C. Pale and dark minerals have separated into bands. Still solid the whole time; it never melted.",
      art: { art: "landform", which: "metamorphic" } },
    { id: "marble", name: "Marble", category: "metamorphic",
      because: "Limestone recrystallised. The shell fragments are gone, replaced by interlocking calcite, which is why marble takes a polish and limestone does not.",
      art: { art: "landform", which: "metamorphic" } },
  ],
};

/* E1.5 — The two energy sources that keep the cycle turning. */
const TWO_ENGINES: ArchetypeSpec = {
  id: "g7e1-two-engines",
  title: "Two Engines, One Cycle",
  tagline: "Sunlight takes rock apart. Earth's own heat puts it back together.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Name the two energy sources that drive the rock cycle and say which part of the cycle each one powers.",
    "Compare the power arriving from the sun with the power leaking out of Earth's interior.",
  ],
  misconceptions: [
    "The rock cycle is driven only by heat from inside Earth",
    "Earth's internal heat is left over entirely from its formation",
  ],
  specimens: [{ id: "surface", name: "Land surface", art: { art: "landform", which: "peaks" } }],
  stages: [
    { name: "Sun", at: 0, caption: "1 361 watts on every square metre facing the sun: 1.74 x 10^17 W over the whole planet." },
    { name: "Downhill", at: 0.2, caption: "Gravity does the moving. Everything loose ends up lower than it started." },
    { name: "Buried", at: 0.4, caption: "Weight of sediment, not heat, does the first squeezing." },
    { name: "Internal heat", at: 0.6, caption: "47 terawatts leaking out: 0.09 W per square metre, everywhere, all the time." },
    { name: "Remade", at: 0.8, caption: "Only the inside heat reaches 700 degrees C, the line between changing rock and melting it." },
    { name: "Lifted", at: 1, caption: "Uplift returns rock to the surface at millimetres a year, and the cycle closes." },
  ],
  route: [
    { at: [0.12, 0.3], name: "Sunlight, 1 361 W per square metre",
      note: "The sun delivers 1.74 x 10^17 W to Earth. It evaporates water, drives wind and rain, and therefore powers every scrap of weathering and transport at the surface." },
    { at: [0.29, 0.64], name: "Gravity",
      note: "Nothing travels downhill without it. A 1 kg pebble falling 1 000 m from a ridge to a river gives up 9 810 J on the way." },
    { at: [0.46, 0.3], name: "Burial",
      note: "Gravity again, pressing straight down. Two kilometres of sediment presses at about 43 MPa, enough to squeeze most of the water out of a mud." },
    { at: [0.62, 0.66], name: "Earth's internal heat, 47 TW",
      note: "About half of it is radioactive decay of uranium-238, thorium-232 and potassium-40; the other half is heat left over from Earth forming 4.5 billion years ago." },
    { at: [0.78, 0.32], name: "Melting and metamorphism",
      note: "Sunlight warms rock to a few tens of degrees. Only the internal heat reaches 700 degrees C, which is where rock stops being weathered and starts being remade." },
    { at: [0.9, 0.66], name: "Uplift, and round again",
      note: "Convection and buoyancy push rock back to the surface at millimetres a year. The sun supplies 3 700 times more power than the interior, and still it cannot lift a mountain." },
  ],
};

export const g7e1SlowCoolBigCrystals = buildSim(SLOW_COOL_BIG_CRYSTALS);
export const g7e1GrainToStone = buildSim(GRAIN_TO_STONE);
export const g7e1SqueezedNotMelted = buildSim(SQUEEZED_NOT_MELTED);
export const g7e1NameThatRock = buildSim(NAME_THAT_ROCK);
export const g7e1TwoEngines = buildSim(TWO_ENGINES);
