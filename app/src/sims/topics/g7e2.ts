import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E2 — Weathering, erosion and deposition.
 *
 * Five simulations, one per subtopic:
 *
 *   E2.1  g7e2-break-it-smaller     physical weathering        (investigate)
 *   E2.2  g7e2-rain-is-an-acid      chemical weathering        (explore)
 *   E2.3  g7e2-who-moved-it         agents of erosion          (sort)
 *   E2.4  g7e2-how-far-before-it-settles  where sediment ends up  (investigate)
 *   E2.5  g7e2-making-soil          soil formation             (process)
 *
 * The two investigations carry the arithmetic. Breaking a block multiplies its
 * surface area by exactly two per halving, and Stokes' law fixes how far a
 * grain travels before it can reach the bed — which is the whole reason gravel
 * stays in the mountains and clay ends up on the abyssal plain.
 */

/** Density of quartz and of water, kilograms per cubic metre. */
const RHO_QUARTZ = 2650;
const RHO_WATER = 1000;
/** Dynamic viscosity of water at 20 degrees C, pascal seconds. */
const MU_WATER = 1.002e-3;
const G = 9.81;

/* E2.1 — Physical weathering: same rock, far more surface. */
const BREAK_IT_SMALLER: ArchetypeSpec = {
  id: "g7e2-break-it-smaller",
  title: "Break It Smaller",
  tagline: "Frost does not dissolve anything. It just makes far more surface for everything else to attack.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2"], ccssMath: ["6.G.A.4"] },
  learningGoals: [
    "Calculate how the total surface area of a rock changes as it is broken up.",
    "Explain how water freezing in a crack generates enough pressure to split rock.",
  ],
  misconceptions: [
    "Breaking a rock changes what it is made of",
    "Ice is soft, so it cannot break stone",
  ],
  specimens: [{ id: "block", name: "Sandstone block", art: { art: "landform", which: "sedimentary" } }],
  variables: [
    { key: "edge", label: "Edge of the starting block (cm)", min: 10, max: 200, step: 5, default: 100 },
    { key: "halvings", label: "Times every edge is halved", min: 0, max: 8, step: 1, default: 3 },
    { key: "frost", label: "Degrees below freezing in the crack", min: 0, max: 22, step: 1, default: 10 },
  ],
  // Halving every edge makes eight pieces and doubles the total surface area,
  // exactly, every time. The frost figure comes from the melting curve of ice:
  // the melting point falls about one degree for every 13.5 MPa of pressure, so
  // water sealed in a crack at minus 10 degrees C can push at about 135 MPa,
  // against a tensile strength of roughly 15 MPa for granite. Below minus 22
  // degrees C ice changes form and the pressure stops climbing at 207 MPa.
  measure: (v) => {
    const factor = Math.pow(2, v.halvings);
    return {
      pieceCount: Math.pow(8, v.halvings),
      pieceEdgeCm: v.edge / factor,
      totalAreaCm2: 6 * v.edge * v.edge * factor,
      areaMultiplier: factor,
      frostPressureMPa: Math.min(13.5 * v.frost, 207),
      timesGraniteStrength: Math.min(13.5 * v.frost, 207) / 15,
    };
  },
  plot: {
    x: "halvings", y: "totalAreaCm2",
    xLabel: "Times every edge is halved", yLabel: "Total surface area (square cm)",
  },
};

/* E2.2 — Chemical weathering: rain takes the rock apart mineral by mineral. */
const RAIN_IS_AN_ACID: ArchetypeSpec = {
  id: "g7e2-rain-is-an-acid",
  title: "Rain Is an Acid",
  tagline: "A weathered granite kerbstone. Three of its minerals have gone, and one has not.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Name the chemical reactions that break granite down: hydrolysis, dissolution and oxidation.",
    "Explain why quartz sand survives weathering when feldspar does not.",
  ],
  misconceptions: [
    "Only polluted rain is acidic",
    "Chemical weathering and physical weathering happen to different rocks",
  ],
  specimens: [{
    id: "granite", name: "Weathered granite",
    art: { art: "landform", which: "igneous" },
    parts: [
      { id: "acid", name: "Carbonic acid", at: [-0.5, -0.44],
        note: "Rain dissolves carbon dioxide out of the air: CO2 plus H2O gives H2CO3. Clean rain sits near pH 5.6 before any pollution is added to it." },
      { id: "feldspar", name: "Feldspar to clay", at: [0.48, -0.4],
        note: "Hydrolysis. Potassium feldspar plus acid gives kaolinite clay, dissolved potassium and silica. Granite is roughly half feldspar, so the whole rock crumbles." },
      { id: "quartz", name: "Quartz survives", at: [0.5, 0.18],
        note: "Silica barely reacts at surface temperatures. The quartz released here is the sand on a beach a thousand kilometres downstream." },
      { id: "iron", name: "Iron stain", at: [-0.55, 0.2],
        note: "Iron inside biotite and hornblende oxidises to haematite. That is the rust-brown stain, and it is chemically the same reaction as rust on an iron gate." },
      { id: "warmth", name: "Warmth and water", at: [0.02, 0.56],
        note: "Reaction rates roughly double for every 10 degrees C. Granite in the wet tropics can rot 50 m deep; the same granite in Svalbard stays fresh." },
      { id: "rate", name: "A measured rate", at: [-0.1, -0.62],
        note: "Marble gravestones in industrial cities lose about 1 mm of surface every 30 years. Granite headstones beside them lose almost nothing, because granite has no calcite to dissolve." },
    ],
  }],
};

/* E2.3 — Agents of erosion, identified from what they leave behind. */
const WHO_MOVED_IT: ArchetypeSpec = {
  id: "g7e2-who-moved-it",
  title: "Who Moved It?",
  tagline: "Every carrier signs its work. Read the shape, the sorting and the scratches.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Match a deposit to the agent that transported it.",
    "Use rounding, sorting and surface marks as evidence of transport.",
  ],
  misconceptions: [
    "All erosion is done by rivers",
    "Gravity needs water to move rock downhill",
  ],
  categories: [
    { id: "water", name: "Moving water", hint: "rounds and sorts by size" },
    { id: "ice", name: "Ice", hint: "scratches, and sorts nothing at all" },
    { id: "wind", name: "Wind", hint: "carries only sand and dust" },
    { id: "gravity", name: "Gravity alone", hint: "angular, unsorted, straight downslope" },
  ],
  specimens: [
    { id: "cobble", name: "Rounded river cobble", category: "water",
      because: "Tumbling in a current knocks the corners off within a few kilometres. Water also sorts: every cobble on this bar is about the same size.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "erratic", name: "Scratched granite erratic", category: "ice",
      because: "Parallel grooves cut by grit dragged under a glacier, and the block matches bedrock 300 km away. Nothing but ice carries ten tonnes that far.",
      art: { art: "landform", which: "igneous" } },
    { id: "ventifact", name: "Quartzite ventifact", category: "wind",
      because: "Blasted flat on the windward face only. The sharp edge between two facets records the day the prevailing wind changed.",
      art: { art: "landform", which: "metamorphic" } },
    { id: "scree", name: "Angular scree block", category: "gravity",
      because: "Sharp corners, no sorting, and lying directly below the cliff it fell from. Gravity neither rounds nor sorts.",
      art: { art: "sphere", color: "#8d8579", radius: 0.46 } },
    { id: "loess", name: "Jar of loess", category: "wind",
      because: "Silt between 0.01 and 0.05 mm, dropped hundreds of kilometres downwind of an ice sheet. Wind can lift nothing coarser than sand.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#c8a86e", precipitate: 0.7 } },
    { id: "stack", name: "Sea stack", category: "water",
      because: "Waves cut a notch at one level only, the arch above it collapses, and a pillar is left standing offshore.",
      art: { art: "landform", which: "coast" } },
    { id: "till", name: "Tube of glacial till", category: "ice",
      because: "Clay, sand and boulders all mixed together with no layering. Ice carries everything at the same speed, so nothing gets sorted.",
      art: { art: "glassware", which: "testTube", level: 0.62, color: "#7a6a55", precipitate: 0.85 } },
    { id: "mudflow", name: "Mudflow deposit", category: "gravity",
      because: "It moved once, fast, and stopped. Boulders float in mud with no bedding at all, which is what a single slope failure leaves.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#6b5136", precipitate: 0.6 } },
  ],
};

/* E2.4 — Deposition: how far a grain travels before it can reach the bed. */
const HOW_FAR_BEFORE_IT_SETTLES: ArchetypeSpec = {
  id: "g7e2-how-far-before-it-settles",
  title: "How Far Before It Settles?",
  tagline: "Gravel drops in the mountains. Clay crosses an ocean. The difference is the square of the grain size.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS2-2"] },
  learningGoals: [
    "Use Stokes' law to find how fast a grain settles through water.",
    "Explain why sediment ends up sorted by size along a river and out to sea.",
  ],
  misconceptions: [
    "All the sediment a river carries is dropped in the same place",
    "Heavy grains sink and light grains float",
  ],
  specimens: [{
    id: "column", name: "Settling column",
    art: { art: "glassware", which: "beaker", level: 0.72, color: "#8a7550", precipitate: 0.45 },
  }],
  variables: [
    { key: "grain", label: "Grain diameter (mm)", min: 0.002, max: 0.12, step: 0.002, default: 0.06 },
    { key: "depth", label: "Water depth (m)", min: 0.5, max: 20, step: 0.5, default: 5 },
    { key: "current", label: "Current speed (m/s)", min: 0.05, max: 2, step: 0.05, default: 0.5 },
  ],
  // Stokes' law: v = 2 (rho_s - rho_w) g r^2 / (9 mu). For quartz in water at
  // 20 degrees C that is 3.59e6 times the radius squared, so a 0.06 mm grain
  // sinks at 3.2 mm/s and a 2 micrometre clay flake at 0.0036 mm/s — a factor
  // of nine hundred for a factor of thirty in size. The law only holds while
  // the Reynolds number stays near or below one, which is why the slider stops
  // at fine sand.
  measure: (v) => {
    const radiusM = v.grain / 2000;
    const settleMs = (2 * (RHO_QUARTZ - RHO_WATER) * G * radiusM * radiusM) / (9 * MU_WATER);
    const seconds = v.depth / settleMs;
    return {
      settlingSpeedMmPerS: settleMs * 1000,
      settleTimeHours: seconds / 3600,
      carriedKm: (v.current * seconds) / 1000,
      reynoldsNumber: (RHO_WATER * settleMs * (v.grain / 1000)) / MU_WATER,
    };
  },
  plot: {
    x: "grain", y: "carriedKm",
    xLabel: "Grain diameter (mm)", yLabel: "Distance carried before it lands (km)",
  },
};

/* E2.5 — Soil: made slowly, lost quickly. */
const MAKING_SOIL: ArchetypeSpec = {
  id: "g7e2-making-soil",
  title: "Making Soil, and Losing It",
  tagline: "Six thousand years to build thirty centimetres. One bare winter to take a slice off the top.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-2", "MS-ESS3-3"] },
  learningGoals: [
    "Describe how bare rock becomes a soil with horizons.",
    "Compare the rate at which soil forms with the rate at which bare ground loses it.",
  ],
  misconceptions: ["Soil is just crushed rock", "Soil is a renewable resource on a human timescale"],
  specimens: [{ id: "profile", name: "Soil profile", art: { art: "landform", which: "hillside" } }],
  stages: [
    { name: "Bare rock", at: 0,
      caption: "Fresh basalt after a lava flow. No pore space, no nitrogen, nothing living." },
    { name: "Pioneers", at: 0.2,
      caption: "Lichens etch the surface with organic acids and frost prises grains loose. A film of grit, well under 1 mm." },
    { name: "First horizon", at: 0.4,
      caption: "Roots, worms and fungi mix grit with dead plant matter. At 0.05 mm a year, 5 cm of soil has taken 1 000 years." },
    { name: "A full profile", at: 0.6,
      caption: "O, A, B and C horizons over bedrock. Clay and iron washed down from above collect in the B horizon." },
    { name: "Mature soil", at: 0.8,
      caption: "Thirty centimetres of topsoil, about 6 000 years of work, holding roughly 25 per cent water by volume." },
    { name: "Gone in a season", at: 1,
      caption: "A bare ploughed slope can lose 1 mm in a single storm, about 13 tonnes a hectare. That is twenty years of soil making, removed in an afternoon." },
  ],
};

export const g7e2BreakItSmaller = buildSim(BREAK_IT_SMALLER);
export const g7e2RainIsAnAcid = buildSim(RAIN_IS_AN_ACID);
export const g7e2WhoMovedIt = buildSim(WHO_MOVED_IT);
export const g7e2HowFarBeforeItSettles = buildSim(HOW_FAR_BEFORE_IT_SETTLES);
export const g7e2MakingSoil = buildSim(MAKING_SOIL);
