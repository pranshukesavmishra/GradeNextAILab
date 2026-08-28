import type { GradeCurriculum } from "./types";

/**
 * Grade 6 — California Integrated Science.
 * 6 units · 34 topics · 190 subtopics · 19 CA NGSS performance expectations.
 * Transcribed from the GradeNext Grade 6 syllabus index.
 */
export const GRADE_6: GradeCurriculum = {
  grade: 6,
  title: "Integrated Science, Grade 6",
  summary:
    "Systems thinking, then the systems themselves: cells and bodies, energy and heat, " +
    "water and weather, climate and heredity, and our own impact on the planet.",
  units: [
    {
      code: "A", title: "Systems and Subsystems", subject: "engineering",
      topics: [
        {
          code: "A1", title: "Systems and subsystems",
          subtopics: [
            { code: "A1.1", title: "What makes a system a system" },
            { code: "A1.2", title: "Subsystems nested within systems" },
            { code: "A1.3", title: "Interactions among a system's parts" },
            { code: "A1.4", title: "Emergent properties" },
            { code: "A1.5", title: "Systems across scales, from a cell to a planet", sims: ["earth.spheres"] },
          ],
        },
        {
          code: "A2", title: "Boundaries, inputs and outputs",
          subtopics: [
            { code: "A2.1", title: "Drawing a system's boundary", sims: ["earth.spheres"] },
            { code: "A2.2", title: "Open vs closed systems", sims: ["earth.spheres"] },
            { code: "A2.3", title: "Inputs and outputs", sims: ["earth.spheres"] },
            { code: "A2.4", title: "Tracing matter and energy through a system", sims: ["earth.spheres"] },
            { code: "A2.5", title: "Choosing a boundary for a purpose" },
          ],
        },
        {
          code: "A3", title: "Models of systems",
          subtopics: [
            { code: "A3.1", title: "Why scientists build models" },
            { code: "A3.2", title: "Diagrams and flowcharts as models" },
            { code: "A3.3", title: "Physical and digital models" },
            { code: "A3.4", title: "What a model leaves out on purpose" },
            { code: "A3.5", title: "Building and revising a model of a system" },
          ],
        },
        {
          code: "A4", title: "Earth as a system",
          subtopics: [
            { code: "A4.1", title: "The geosphere", sims: ["earth.spheres"] },
            { code: "A4.2", title: "The hydrosphere", sims: ["earth.spheres"] },
            { code: "A4.3", title: "The atmosphere", sims: ["earth.spheres", "earth.atmosphere"] },
            { code: "A4.4", title: "The biosphere", sims: ["earth.spheres"] },
            { code: "A4.5", title: "Interactions among Earth's four spheres", sims: ["earth.spheres"] },
            { code: "A4.6", title: "Modeling an Earth-system event", sims: ["earth.spheres"] },
          ],
        },
        {
          code: "A5", title: "Investigation, measurement and evidence",
          subtopics: [
            { code: "A5.1", title: "Lab safety and working like a scientist" },
            { code: "A5.2", title: "Variables and fair tests", sims: ["chem.specific-heat"] },
            { code: "A5.3", title: "SI units and measurement" },
            { code: "A5.4", title: "Organizing and graphing data", sims: ["chem.specific-heat"] },
            { code: "A5.5", title: "Claim, evidence and reasoning" },
            { code: "A5.6", title: "Designing an investigation of a system", sims: ["chem.specific-heat"] },
          ],
        },
      ],
    },
    {
      code: "B", title: "Cells, Bodies and Senses", subject: "biology",
      topics: [
        {
          code: "B1", title: "Cells: the basic unit of life", standards: ["MS-LS1-1"],
          subtopics: [
            { code: "B1.1", title: "Cell theory", sims: ["bio.cell"] },
            { code: "B1.2", title: "Discovering cells", sims: ["bio.cell"] },
            { code: "B1.3", title: "Living vs nonliving" },
            { code: "B1.4", title: "Unicellular organisms", sims: ["bio.cell"] },
            { code: "B1.5", title: "Multicellular organisms", sims: ["bio.cell"] },
            { code: "B1.6", title: "Microscopic scale", sims: ["bio.cell"] },
          ],
        },
        {
          code: "B2", title: "Cell structure and function", standards: ["MS-LS1-2"],
          subtopics: [
            { code: "B2.1", title: "Cell membrane", sims: ["bio.cell"] },
            { code: "B2.2", title: "Cell wall", sims: ["bio.cell"] },
            { code: "B2.3", title: "Nucleus", sims: ["bio.cell"] },
            { code: "B2.4", title: "Mitochondria", sims: ["bio.cell"] },
            { code: "B2.5", title: "Chloroplasts", sims: ["bio.cell"] },
            { code: "B2.6", title: "Relating structure to whole-cell function", sims: ["bio.cell"] },
          ],
        },
        {
          code: "B3", title: "Levels of organization", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B3.1", title: "The organizational hierarchy", sims: ["bio.body-systems"] },
            { code: "B3.2", title: "Cell specialization", sims: ["bio.body-systems"] },
            { code: "B3.3", title: "Tissues", sims: ["bio.body-systems"] },
            { code: "B3.4", title: "Organs", sims: ["bio.body-systems"] },
            { code: "B3.5", title: "Organ systems", sims: ["bio.body-systems"] },
            { code: "B3.6", title: "The organism as the whole system", sims: ["bio.body-systems"] },
          ],
        },
        {
          code: "B4", title: "Human body systems", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B4.1", title: "Digestive system", sims: ["bio.body-systems"] },
            { code: "B4.2", title: "Excretory system", sims: ["bio.body-systems"] },
            { code: "B4.3", title: "Circulatory system", sims: ["bio.body-systems"] },
            { code: "B4.4", title: "Respiratory system", sims: ["bio.body-systems"] },
            { code: "B4.5", title: "Muscular system", sims: ["bio.body-systems"] },
            { code: "B4.6", title: "Nervous system", sims: ["bio.body-systems", "bio.neuron"] },
          ],
        },
        {
          code: "B5", title: "Body systems working together", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B5.1", title: "Digestion and circulation together", sims: ["bio.body-systems"] },
            { code: "B5.2", title: "Circulation and respiration together", sims: ["bio.body-systems"] },
            { code: "B5.3", title: "Nervous and muscular systems together", sims: ["bio.body-systems", "bio.neuron"] },
            { code: "B5.4", title: "The excretory system and internal balance", sims: ["bio.body-systems"] },
            { code: "B5.5", title: "Case study: the body during exercise", sims: ["bio.body-systems"] },
            { code: "B5.6", title: "Interactions among body systems, generalized", sims: ["bio.body-systems"] },
          ],
        },
        {
          code: "B6", title: "Sensory systems and information processing", standards: ["MS-LS1-8"],
          subtopics: [
            { code: "B6.1", title: "Sensory receptors and stimuli", sims: ["bio.neuron"] },
            { code: "B6.2", title: "The path of a signal to the brain", sims: ["bio.neuron"] },
            { code: "B6.3", title: "Processing information in the brain", sims: ["bio.neuron"] },
            { code: "B6.4", title: "Voluntary and reflex responses", sims: ["bio.neuron"] },
            { code: "B6.5", title: "Memory and stored information", sims: ["bio.neuron"] },
            { code: "B6.6", title: "Stimulus to response to memory, together", sims: ["bio.neuron"] },
          ],
        },
      ],
    },
    {
      code: "C", title: "Energy, Heat and Thermal Systems", subject: "physics",
      topics: [
        {
          code: "C1", title: "Energy and its forms",
          subtopics: [
            { code: "C1.1", title: "Forms of energy", sims: ["phys.energy-skate"] },
            { code: "C1.2", title: "Kinetic energy", sims: ["phys.energy-skate", "phys.kinetic-energy"] },
            { code: "C1.3", title: "Potential energy", sims: ["phys.energy-skate"] },
            { code: "C1.4", title: "Energy transfer and transformation", sims: ["phys.energy-skate"] },
            { code: "C1.5", title: "Conservation of energy, introduced", sims: ["phys.energy-skate"] },
            { code: "C1.6", title: "Tracking energy through everyday examples", sims: ["phys.energy-skate"] },
          ],
        },
        {
          code: "C2", title: "Particles, temperature and thermal energy", standards: ["MS-PS3-5"],
          subtopics: [
            { code: "C2.1", title: "Matter is made of particles", sims: ["chem.states"] },
            { code: "C2.2", title: "Evidence for particle motion", sims: ["chem.states"] },
            { code: "C2.3", title: "Particle movement in solids, liquids and gases", sims: ["chem.states"] },
            { code: "C2.4", title: "Temperature as average kinetic energy", sims: ["chem.states"] },
            { code: "C2.5", title: "Temperature vs total thermal energy", sims: ["chem.specific-heat"] },
            { code: "C2.6", title: "Measuring temperature", sims: ["chem.specific-heat"] },
          ],
        },
        {
          code: "C3", title: "Thermal energy transfer", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C3.1", title: "Energy flows hot to cold", sims: ["phys.heat-transfer"] },
            { code: "C3.2", title: "Conduction", sims: ["phys.heat-transfer"] },
            { code: "C3.3", title: "Convection", sims: ["phys.heat-transfer"] },
            { code: "C3.4", title: "Radiation", sims: ["phys.heat-transfer"] },
            { code: "C3.5", title: "Conductors and insulators", sims: ["phys.heat-transfer"] },
            { code: "C3.6", title: "Thermal equilibrium", sims: ["phys.heat-transfer"] },
          ],
        },
        {
          code: "C4", title: "Matter, mass and temperature change", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C4.1", title: "Effect of material type on temperature change", sims: ["chem.specific-heat"] },
            { code: "C4.2", title: "Effect of mass on temperature change", sims: ["chem.specific-heat"] },
            { code: "C4.3", title: "Planning a fair test investigation", sims: ["chem.specific-heat"] },
            { code: "C4.4", title: "Collecting and organizing temperature-time data", sims: ["chem.specific-heat"] },
            { code: "C4.5", title: "Analyzing and interpreting data", sims: ["chem.specific-heat"] },
            { code: "C4.6", title: "Constructing an explanation from evidence", sims: ["chem.specific-heat"] },
          ],
        },
        {
          code: "C5", title: "Engineering with thermal energy",
          standards: ["MS-PS3-3", "MS-ETS1-3", "MS-ETS1-4"],
          subtopics: [
            { code: "C5.1", title: "Choosing materials to control heat transfer", sims: ["phys.heat-transfer"] },
            { code: "C5.2", title: "Defining the design problem", sims: ["phys.heat-transfer"] },
            { code: "C5.3", title: "Designing and building a device", sims: ["phys.heat-transfer"] },
            { code: "C5.4", title: "Testing a device and collecting data", sims: ["phys.heat-transfer"] },
            { code: "C5.5", title: "Comparing competing designs", sims: ["phys.heat-transfer"] },
            { code: "C5.6", title: "Redesigning based on evidence", sims: ["phys.heat-transfer"] },
          ],
        },
      ],
    },
    {
      code: "D", title: "Water, Atmosphere and Weather", subject: "earth",
      topics: [
        {
          code: "D1", title: "Earth's water and the water cycle", standards: ["MS-ESS2-4"],
          subtopics: [
            { code: "D1.1", title: "Earth's water reservoirs", sims: ["earth.water-cycle"] },
            { code: "D1.2", title: "Evaporation and condensation", sims: ["earth.water-cycle"] },
            { code: "D1.3", title: "Precipitation, runoff and infiltration", sims: ["earth.water-cycle"] },
            { code: "D1.4", title: "Transpiration and the biological piece of the cycle", sims: ["earth.water-cycle"] },
            { code: "D1.5", title: "Two drivers: solar energy and gravity", sims: ["earth.water-cycle"] },
            { code: "D1.6", title: "Residence time and the water cycle as a system", sims: ["earth.water-cycle"] },
          ],
        },
        {
          code: "D2", title: "The atmosphere",
          subtopics: [
            { code: "D2.1", title: "Composition of the atmosphere", sims: ["earth.atmosphere"] },
            { code: "D2.2", title: "Layers of the atmosphere", sims: ["earth.atmosphere"] },
            { code: "D2.3", title: "Air pressure", sims: ["earth.atmosphere"] },
            { code: "D2.4", title: "Pressure, temperature and density together", sims: ["earth.atmosphere", "chem.gas-laws"] },
            { code: "D2.5", title: "Why warm air rises", sims: ["phys.heat-transfer", "earth.atmosphere"] },
          ],
        },
        {
          code: "D3", title: "Weather variables and instruments",
          subtopics: [
            { code: "D3.1", title: "Temperature", sims: ["earth.weather"] },
            { code: "D3.2", title: "Air pressure and the barometer", sims: ["earth.weather"] },
            { code: "D3.3", title: "Humidity and dew point", sims: ["earth.weather"] },
            { code: "D3.4", title: "Precipitation", sims: ["earth.weather"] },
            { code: "D3.5", title: "Wind: speed and direction", sims: ["earth.weather"] },
            { code: "D3.6", title: "Reading a weather station together", sims: ["earth.weather"] },
          ],
        },
        {
          code: "D4", title: "Air masses and fronts", standards: ["MS-ESS2-5"],
          subtopics: [
            { code: "D4.1", title: "Air masses and source regions", sims: ["earth.fronts"] },
            { code: "D4.2", title: "High- and low-pressure systems", sims: ["earth.fronts"] },
            { code: "D4.3", title: "Cold fronts", sims: ["earth.fronts"] },
            { code: "D4.4", title: "Warm fronts", sims: ["earth.fronts"] },
            { code: "D4.5", title: "Occluded and stationary fronts", sims: ["earth.fronts"] },
            { code: "D4.6", title: "Collecting data to track a front", sims: ["earth.fronts"] },
          ],
        },
        {
          code: "D5", title: "Unequal heating of Earth",
          subtopics: [
            { code: "D5.1", title: "Angle of sunlight and latitude", sims: ["earth.seasons", "earth.unequal-heating"] },
            { code: "D5.2", title: "Land versus water heating rates", sims: ["earth.unequal-heating", "chem.specific-heat"] },
            { code: "D5.3", title: "Altitude", sims: ["earth.unequal-heating"] },
            { code: "D5.4", title: "Albedo", sims: ["earth.unequal-heating"] },
            { code: "D5.5", title: "Day, night and the combined pattern", sims: ["earth.unequal-heating"] },
          ],
        },
        {
          code: "D6", title: "California's weather",
          subtopics: [
            { code: "D6.1", title: "Coastal versus inland temperature patterns", sims: ["earth.unequal-heating"] },
            { code: "D6.2", title: "The marine layer and coastal fog", sims: ["earth.weather"] },
            { code: "D6.3", title: "The Sierra Nevada and rain shadow", sims: ["earth.weather"] },
            { code: "D6.4", title: "California's deserts", sims: ["earth.weather"] },
            { code: "D6.5", title: "The Pacific's moderating influence", sims: ["earth.unequal-heating"] },
            { code: "D6.6", title: "Putting California's weather together", sims: ["earth.weather"] },
          ],
        },
      ],
    },
    {
      code: "E", title: "Regional Climate, Organisms and Heredity", subject: "biology",
      topics: [
        {
          code: "E1", title: "Weather versus climate", standards: ["MS-ESS2-6"],
          subtopics: [
            { code: "E1.1", title: "Weather versus climate", sims: ["earth.climate-zones"] },
            { code: "E1.2", title: "Building climate from weather data", sims: ["earth.climate-zones"] },
            { code: "E1.3", title: "Reading climate graphs", sims: ["earth.climate-zones"] },
            { code: "E1.4", title: "Reading climate maps", sims: ["earth.climate-zones"] },
            { code: "E1.5", title: "Climate zones", sims: ["earth.climate-zones"] },
          ],
        },
        {
          code: "E2", title: "Atmospheric and ocean circulation", standards: ["MS-ESS2-6"],
          subtopics: [
            { code: "E2.1", title: "Convection cells from unequal heating", sims: ["earth.circulation", "phys.heat-transfer"] },
            { code: "E2.2", title: "Circulation cells and prevailing winds", sims: ["earth.circulation"] },
            { code: "E2.3", title: "An introductory Coriolis effect", sims: ["earth.circulation"] },
            { code: "E2.4", title: "Surface ocean currents", sims: ["earth.circulation"] },
            { code: "E2.5", title: "Temperature, salinity and density in ocean water", sims: ["earth.circulation"] },
            { code: "E2.6", title: "Heat redistribution: one combined model", sims: ["earth.circulation"] },
          ],
        },
        {
          code: "E3", title: "Structures and behaviors for reproduction", standards: ["MS-LS1-4"],
          subtopics: [
            { code: "E3.1", title: "Courtship behavior" },
            { code: "E3.2", title: "Nesting and parental care" },
            { code: "E3.3", title: "Flower structures and pollen", sims: ["bio.pollination"] },
            { code: "E3.4", title: "Pollination", sims: ["bio.pollination"] },
            { code: "E3.5", title: "Seeds and dispersal", sims: ["bio.pollination"] },
          ],
        },
        {
          code: "E4", title: "Environmental and genetic factors in growth", standards: ["MS-LS1-5"],
          subtopics: [
            { code: "E4.1", title: "Environmental factors in growth", sims: ["bio.plant-growth"] },
            { code: "E4.2", title: "Testing an environmental factor", sims: ["bio.plant-growth"] },
            { code: "E4.3", title: "Genetic differences and growth", sims: ["bio.plant-growth"] },
            { code: "E4.4", title: "Comparing individuals across conditions", sims: ["bio.plant-growth"] },
            { code: "E4.5", title: "Separating genetic from environmental influence", sims: ["bio.plant-growth"] },
          ],
        },
        {
          code: "E5", title: "Sexual and asexual reproduction", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E5.1", title: "Sexual reproduction", sims: ["bio.heredity"] },
            { code: "E5.2", title: "Why sexual offspring resemble but do not match parents", sims: ["bio.heredity"] },
            { code: "E5.3", title: "Asexual reproduction", sims: ["bio.heredity"] },
            { code: "E5.4", title: "Why asexual offspring are genetically identical", sims: ["bio.heredity"] },
            { code: "E5.5", title: "Comparing the two strategies", sims: ["bio.heredity"] },
          ],
        },
        {
          code: "E6", title: "Heredity and genetic variation", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E6.1", title: "Genes as inherited information", sims: ["bio.heredity"] },
            { code: "E6.2", title: "Inheritance and variation among siblings", sims: ["bio.heredity"] },
            { code: "E6.3", title: "Why sexual reproduction produces variation", sims: ["bio.heredity"] },
            { code: "E6.4", title: "Why asexual reproduction preserves identical information", sims: ["bio.heredity"] },
            { code: "E6.5", title: "Simple inheritance diagrams", sims: ["bio.heredity"] },
            { code: "E6.6", title: "An introductory Punnett square", sims: ["bio.heredity"] },
          ],
        },
      ],
    },
    {
      code: "F", title: "Global Warming and Human Impact", subject: "earth",
      topics: [
        {
          code: "F1", title: "Earth's climate system", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F1.1", title: "The components of the climate system", sims: ["earth.greenhouse"] },
            { code: "F1.2", title: "Energy in and energy out", sims: ["earth.greenhouse"] },
            { code: "F1.3", title: "The natural greenhouse effect, descriptively", sims: ["earth.greenhouse"] },
            { code: "F1.4", title: "A feedback, introduced conceptually", sims: ["earth.greenhouse"] },
            { code: "F1.5", title: "The climate system as interacting subsystems", sims: ["earth.greenhouse", "earth.spheres"] },
          ],
        },
        {
          code: "F2", title: "Evidence of a changing climate", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F2.1", title: "Ice cores", sims: ["earth.climate-evidence"] },
            { code: "F2.2", title: "Tree rings and coral bands", sims: ["earth.climate-evidence"] },
            { code: "F2.3", title: "The instrumental record", sims: ["earth.climate-evidence"] },
            { code: "F2.4", title: "Sea level and sea ice", sims: ["earth.climate-evidence"] },
            { code: "F2.5", title: "The Keeling curve", sims: ["earth.climate-evidence"] },
            { code: "F2.6", title: "Why independent evidence agreeing is the whole argument", sims: ["earth.climate-evidence"] },
          ],
        },
        {
          code: "F3", title: "Causes: human activities and natural factors", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F3.1", title: "Greenhouse gases", sims: ["earth.greenhouse"] },
            { code: "F3.2", title: "Fossil-fuel combustion and cement production", sims: ["earth.greenhouse"] },
            { code: "F3.3", title: "Agriculture and land use", sims: ["earth.greenhouse"] },
            { code: "F3.4", title: "Natural factors", sims: ["earth.greenhouse"] },
            { code: "F3.5", title: "Comparing timescales", sims: ["earth.climate-evidence"] },
          ],
        },
        {
          code: "F4", title: "Correlation, causation and reading evidence",
          subtopics: [
            { code: "F4.1", title: "Correlation versus causation", sims: ["earth.climate-evidence"] },
            { code: "F4.2", title: "Reading a graph critically", sims: ["earth.climate-evidence"] },
            { code: "F4.3", title: "Applying this to climate data", sims: ["earth.climate-evidence"] },
            { code: "F4.4", title: "Evaluating a claim using multiple lines of evidence", sims: ["earth.climate-evidence"] },
            { code: "F4.5", title: "Spotting overstated and understated claims" },
          ],
        },
        {
          code: "F5", title: "Effects on living systems",
          subtopics: [
            { code: "F5.1", title: "Habitat change", sims: ["bio.ecosystem"] },
            { code: "F5.2", title: "Resource availability", sims: ["bio.ecosystem"] },
            { code: "F5.3", title: "Plant growth and timing", sims: ["bio.plant-growth"] },
            { code: "F5.4", title: "Animal behavior and range shifts", sims: ["bio.ecosystem"] },
            { code: "F5.5", title: "Existing adaptations and their limits", sims: ["bio.natural-selection"] },
          ],
        },
        {
          code: "F6", title: "Minimizing human impact",
          standards: ["MS-ESS3-3", "MS-ETS1-1", "MS-ETS1-2"],
          subtopics: [
            { code: "F6.1", title: "Monitoring and indicators", sims: ["earth.climate-evidence"] },
            { code: "F6.2", title: "Mitigation and adaptation", sims: ["earth.greenhouse"] },
            { code: "F6.3", title: "Defining the problem, criteria and constraints" },
            { code: "F6.4", title: "Comparing and scoring alternatives", sims: ["earth.greenhouse"] },
            { code: "F6.5", title: "Technical claims versus value judgements" },
          ],
        },
      ],
    },
  ],
};
