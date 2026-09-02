import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit E · Topic E6 — The uneven distribution of Earth's resources.
 *
 * Five simulations, one per subtopic:
 *
 *   E6.1  g7e6-how-it-got-concentrated  mineral resources                   (sort)
 *   E6.2  g7e6-per-kilogram             energy resources                    (compare)
 *   E6.3  g7e6-how-fast-does-it-flow    groundwater as a resource           (investigate)
 *   E6.4  g7e6-a-tankful-of-sunlight    renewable versus nonrenewable       (process)
 *   E6.5  g7e6-copper-under-the-andes   explaining resource distribution    (trace)
 *
 * The unifying idea is enrichment. Average crust holds 60 parts per million of
 * copper; an ore body holds 5 000. Nothing about a resource is evenly spread,
 * and every deposit is the record of a process that concentrated it — which is
 * why the map of copper mines and the map of subduction zones are the same map.
 */

/** Higher heating values, megajoules per kilogram. */
const COAL_MJ_PER_KG = 30;
const METHANE_MJ_PER_KG = 55;
/** Carbon dioxide released, kilograms per megajoule of fuel energy. */
const COAL_CO2_PER_MJ = 0.0946;
const GAS_CO2_PER_MJ = 0.0561;

/* E6.1 — Ore bodies, sorted by the process that concentrated them. */
const HOW_IT_GOT_CONCENTRATED: ArchetypeSpec = {
  id: "g7e6-how-it-got-concentrated",
  title: "How It Got Concentrated",
  tagline: "An ore is not a special rock. It is an ordinary element that something gathered into one place.",
  kind: "sort",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-1"] },
  learningGoals: [
    "Explain that a mineral resource is an element concentrated far above its crustal abundance.",
    "Match a named ore deposit to the process that concentrated it.",
  ],
  misconceptions: [
    "Valuable minerals are rare everywhere on Earth",
    "Ore deposits are spread evenly and we simply have not found them all",
  ],
  categories: [
    { id: "hot", name: "Magma and hot water", hint: "carried and dropped by melt or brine" },
    { id: "life", name: "Evaporation or living things", hint: "concentrated in a sea or by organisms" },
    { id: "surface", name: "Weathering or running water", hint: "everything else was taken away" },
  ],
  specimens: [
    { id: "porphyry", name: "Porphyry copper ore, Chuquicamata", category: "hot",
      because: "Hot brine above a subducting slab stripped copper from magma and dropped it in a mesh of veins at about 0.5 per cent copper, eighty times the crustal average of 60 ppm.",
      art: { art: "sphere", color: "#3f9c86", radius: 0.46 } },
    { id: "vein", name: "Gold in a quartz vein", category: "hot",
      because: "Water at 250 to 350 degrees C carried dissolved gold up a fault and dropped it as the fluid cooled. Crustal gold is 0.004 ppm; ore is about 5 ppm, a thousandfold enrichment.",
      art: { art: "sphere", color: "#d4af37", radius: 0.46 } },
    { id: "chromite", name: "Chromite layers, Bushveld Complex", category: "hot",
      because: "Dense chromite crystals sank through a cooling magma chamber and piled up on its floor in sheets a metre thick, traceable for hundreds of kilometres.",
      art: { art: "sphere", color: "#2b2b30", radius: 0.46 } },
    { id: "bif", name: "Banded iron formation, 2 400 million years old", category: "life",
      because: "Iron dissolved in an oxygen-free ocean precipitated the moment photosynthetic bacteria began releasing oxygen. Most of the world's iron ore was made in that one event.",
      art: { art: "landform", which: "sedimentary" } },
    { id: "salt", name: "Rock salt and potash", category: "life",
      because: "A sea evaporated. The dissolved salts came out of solution in order of solubility, so they are stacked in beds you can mine one at a time.",
      art: { art: "sphere", color: "#eae7e0", radius: 0.46 } },
    { id: "phosphate", name: "Phosphate rock", category: "life",
      because: "Upwelling currents feed plankton; their remains rain down on shallow shelves and build phosphate beds. It is the source of almost all fertiliser.",
      art: { art: "sphere", color: "#b9ae87", radius: 0.46 } },
    { id: "bauxite", name: "Bauxite, the ore of aluminium", category: "surface",
      because: "Tropical rain leached everything soluble out of the rock over millions of years. Aluminium would not dissolve, so it was left behind at about 25 per cent, against 8 per cent in ordinary crust.",
      art: { art: "sphere", color: "#c96a3a", radius: 0.46 } },
    { id: "placer", name: "Placer gold in a river bar", category: "surface",
      because: "Gold is 19.3 g per cubic centimetre against 2.65 for quartz, so it drops out of the current first and collects where the water slows.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#8a7a4a", precipitate: 0.8 } },
  ],
};

/* E6.2 — Two fossil fuels, per kilogram. */
const PER_KILOGRAM: ArchetypeSpec = {
  id: "g7e6-per-kilogram",
  title: "Per Kilogram",
  tagline: "Same store of ancient sunlight, very different amounts of carbon per unit of energy.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-1"] },
  learningGoals: [
    "Compare fuels by energy density and by carbon dioxide released per megajoule.",
    "Explain why coal, oil and gas are found in different places and different rocks.",
  ],
  misconceptions: [
    "All fossil fuels release the same carbon dioxide for the same energy",
    "Natural gas is not a fossil fuel",
  ],
  specimens: [
    { id: "coal", name: "Bituminous coal", because: "30 MJ per kg, 95 g of CO2 per MJ.",
      art: { art: "sphere", color: "#101014", radius: 0.46 } },
    { id: "gas", name: "Natural gas, methane", because: "55 MJ per kg, 56 g of CO2 per MJ.",
      art: { art: "molecule", formula: "CH4" } },
  ],
  variables: [
    { key: "energy", label: "Energy the job needs (MJ)", min: 100, max: 30000, step: 100, default: 3000 },
  ],
  // Higher heating values and the standard emission factors: bituminous coal
  // 30 MJ/kg and 94.6 g CO2 per MJ, methane 55 MJ/kg and 56.1 g CO2 per MJ. Fix
  // the job rather than the fuel and both differences show at once: gas needs
  // 45 per cent less mass, and releases 59 per cent of the carbon dioxide, for
  // exactly the same megajoules delivered.
  measure: (v) => ({
    coalMassKg: v.energy / COAL_MJ_PER_KG,
    gasMassKg: v.energy / METHANE_MJ_PER_KG,
    coalCO2Kg: v.energy * COAL_CO2_PER_MJ,
    gasCO2Kg: v.energy * GAS_CO2_PER_MJ,
    gasCO2AsPercentOfCoal: (GAS_CO2_PER_MJ / COAL_CO2_PER_MJ) * 100,
  }),
  /**
   * Both fuels are drawn as the amount you would have to burn for the job, so
   * the two piles are never the same size: mass is a volume, and volume goes as
   * the cube of a length, so each specimen is scaled by the cube root of the
   * mass it needs. At 3 000 MJ that is 100 kg of coal against 55 kg of gas, and
   * the coal is drawn 22 per cent wider — the correct ratio, not an emphasis.
   * The coal also warms toward ember red as the carbon dioxide it releases
   * climbs past a tonne.
   */
  drive: ({ f, index }) => index === 0
    ? {
        scale: Math.cbrt(f.coalMassKg / 300),
        color: f.coalCO2Kg > 1000 ? "#4a1a10" : f.coalCO2Kg > 400 ? "#2a1512" : "#101014",
      }
    : { scale: Math.cbrt(f.gasMassKg / 300) },
};

/* E6.3 — Groundwater, and how slowly it actually moves. */
const HOW_FAST_DOES_IT_FLOW: ArchetypeSpec = {
  id: "g7e6-how-fast-does-it-flow",
  title: "How Fast Does It Flow?",
  tagline: "Groundwater is not an underground river. In a good sand aquifer it travels the length of a bus in a year.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-1", "MS-ESS3-4"] },
  learningGoals: [
    "Use Darcy's law to find the flow rate through an aquifer.",
    "Explain why an aquifer polluted today may not be clean again for decades.",
  ],
  misconceptions: [
    "Groundwater flows in underground rivers and caves",
    "Pumping a well simply refills from the rain that fell last week",
  ],
  specimens: [{
    id: "aquifer", name: "Aquifer column",
    art: { art: "glassware", which: "beaker", level: 0.55, color: "#4a86b8", precipitate: 0.7 },
  }],
  variables: [
    { key: "conductivity", label: "Hydraulic conductivity (m per day)", min: 0.1, max: 50, step: 0.1, default: 10 },
    { key: "gradient", label: "Water-table slope (m per m)", min: 0.001, max: 0.05, step: 0.001, default: 0.005 },
    { key: "porosity", label: "Porosity (fraction of pore space)", min: 0.1, max: 0.45, step: 0.01, default: 0.25 },
  ],
  // Darcy's law: the flux through the whole cross-section is K times the
  // gradient. Water only occupies the pores, so the speed of an actual water
  // molecule is that flux divided by the porosity. Clean sand runs 1 to 50 m a
  // day of conductivity, silt about 0.1, clay a millionth of that, which is why
  // clay makes a seal and sand makes an aquifer.
  measure: (v) => {
    const flux = v.conductivity * v.gradient;
    const seepage = flux / v.porosity;
    const perYear = seepage * 365.25;
    return {
      darcyFluxMPerDay: flux,
      seepageSpeedMPerDay: seepage,
      metresPerYear: perYear,
      yearsToTravelOneKm: 1000 / perYear,
    };
  },
  plot: {
    x: "conductivity", y: "metresPerYear",
    xLabel: "Hydraulic conductivity (m per day)", yLabel: "Distance travelled in a year (m)",
  },
  /**
   * The column is a jar of the aquifer material with water in its pores, so it
   * has to answer all three sliders. Porosity is literally how much of the jar
   * is water, so it sets the level and the amount of grain packed below it.
   * Conductivity sets how clean the material is: gravel and clean sand run
   * clear, silt runs cloudy. The bubbles are the flow itself — at 0.2 m a day
   * almost nothing moves, and at 25 m a day the column is visibly running.
   */
  drive: ({ v, f }) => ({
    level: 0.3 + 0.6 * (v.porosity / 0.45),
    precipitate: 1 - v.porosity,
    color: v.conductivity > 20 ? "#4a86b8" : v.conductivity > 3 ? "#6f8a92" : "#6b6350",
    bubbles: Math.min(1, f.seepageSpeedMPerDay / 4),
  }),
};

/* E6.4 — What "nonrenewable" actually means: a rate, not a quantity. */
const A_TANKFUL_OF_SUNLIGHT: ArchetypeSpec = {
  id: "g7e6-a-tankful-of-sunlight",
  title: "A Tankful of Sunlight",
  tagline: "Nothing is nonrenewable. Some things are just renewed a hundred million times slower than we use them.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-1", "MS-ESS3-4"] },
  learningGoals: [
    "Describe the sequence that turns buried plankton into crude oil.",
    "Define a renewable resource by comparing its rate of renewal with the rate of use.",
  ],
  misconceptions: [
    "Oil sits in underground lakes",
    "Renewable means unlimited",
  ],
  specimens: [{
    id: "crude", name: "Crude oil",
    art: { art: "glassware", which: "flask", level: 0.5, color: "#241a0e" },
  }],
  stages: [
    { name: "Plankton", at: 0,
      caption: "A bloom in a warm, still sea. Almost all of it is eaten or rots; well under 1 per cent settles into oxygen-poor mud and stays." },
    { name: "Buried", at: 0.2,
      caption: "Down to 1 km. The mud becomes shale and the organic matter becomes kerogen. At about 40 degrees C there is still no oil at all." },
    { name: "The oil window", at: 0.4,
      caption: "Between 2 and 4 km, at 60 to 120 degrees C, kerogen cracks into oil. Hotter than about 150 degrees C and you get gas instead." },
    { name: "Migration", at: 0.6,
      caption: "Oil is lighter than the water filling the pores, 0.85 against 1.00 g per cubic centimetre, so it rises through the rock until something stops it." },
    { name: "The trap", at: 0.8,
      caption: "An arch of porous rock under an impermeable cap. Without a trap the oil reaches the surface and is destroyed by bacteria and air." },
    { name: "The bill", at: 1,
      caption: "Fifty to three hundred million years for one tankful. A single year of world fossil-fuel burning uses organic matter equal to about four hundred years of everything that grows on Earth." },
  ],
};

/* E6.5 — Why the copper is where it is. */
const COPPER_UNDER_THE_ANDES: ArchetypeSpec = {
  id: "g7e6-copper-under-the-andes",
  title: "Copper Under the Andes",
  tagline: "Chile mines a quarter of the world's copper for one reason, and it is not luck.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-1"] },
  learningGoals: [
    "Construct an explanation linking a resource's location to a past or present geological process.",
    "Quantify enrichment: from crustal abundance, to ore grade, to refined metal.",
  ],
  misconceptions: [
    "Resources are distributed randomly across the globe",
    "A country is rich in a metal by chance",
  ],
  specimens: [{ id: "margin", name: "Andean margin", art: { art: "landform", which: "subduction" } }],
  stages: [
    { name: "Wet slab", at: 0, caption: "The Nazca plate carries seawater locked into its minerals down at 6.6 cm a year." },
    { name: "100 km down", at: 0.2, caption: "Water is driven off and the mantle above melts. Crustal copper is only 60 ppm." },
    { name: "Magma chamber", at: 0.4, caption: "Melt gathers 5 to 10 km under the Andes, holding on to its copper and sulphur." },
    { name: "Hot brine", at: 0.6, caption: "Chloride-rich water at 350 to 400 degrees C strips the copper out and carries it upward." },
    { name: "Ore body", at: 0.8, caption: "Cooling drops copper sulphide into a mesh of veins at about 0.5 per cent: eighty times crustal average." },
    { name: "The wire", at: 1, caption: "60 ppm, then 5 000 ppm, then 99.99 per cent refined. Chile supplies about a quarter of world copper." },
  ],
  route: [
    { at: [0.12, 0.62], name: "Seawater inside the slab",
      note: "Ocean floor carries water chemically bound into its minerals. The Nazca plate takes it down beneath South America at about 6.6 cm a year." },
    { at: [0.3, 0.3], name: "One hundred kilometres down",
      note: "The water is driven out of the slab and lowers the melting point of the mantle wedge above it. Copper in ordinary crust is only 60 parts per million: 0.006 per cent." },
    { at: [0.46, 0.64], name: "The magma chamber",
      note: "Melt collects 5 to 10 km below the Andes. Copper and sulphur stay dissolved in the remaining liquid rather than entering the crystals that grow." },
    { at: [0.62, 0.3], name: "Hot brine",
      note: "At 350 to 400 degrees C, chloride-rich water strips copper and sulphur from the magma and carries them up through fractures in the roof rock." },
    { at: [0.78, 0.66], name: "The ore body",
      note: "Cooling and boiling drop copper sulphide into a stockwork of thousands of thin veins, at roughly 0.5 per cent copper: about eighty times the crustal average." },
    { at: [0.9, 0.32], name: "The mine, and the wire",
      note: "Chuquicamata is 4.5 km long and over 1 km deep. Chile supplies close to a quarter of the world's copper, and Peru much of the rest, because both sit over the same subduction zone." },
  ],
};

export const g7e6HowItGotConcentrated = buildSim(HOW_IT_GOT_CONCENTRATED);
export const g7e6PerKilogram = buildSim(PER_KILOGRAM);
export const g7e6HowFastDoesItFlow = buildSim(HOW_FAST_DOES_IT_FLOW);
export const g7e6ATankfulOfSunlight = buildSim(A_TANKFUL_OF_SUNLIGHT);
export const g7e6CopperUnderTheAndes = buildSim(COPPER_UNDER_THE_ANDES);
