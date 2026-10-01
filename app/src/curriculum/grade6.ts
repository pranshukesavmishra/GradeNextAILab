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
            { code: "A1.1", title: "What makes a system a system", sims: [] },
            { code: "A1.2", title: "Subsystems nested within systems", sims: [] },
            { code: "A1.3", title: "Interactions among a system's parts", sims: [] },
            { code: "A1.4", title: "Emergent properties", sims: [] },
            { code: "A1.5", title: "Systems across scales, from a cell to a planet", sims: [] },
          ],
        },
        {
          code: "A2", title: "Boundaries, inputs and outputs",
          subtopics: [
            { code: "A2.1", title: "Drawing a system's boundary", sims: [] },
            { code: "A2.2", title: "Open vs closed systems", sims: [] },
            { code: "A2.3", title: "Inputs and outputs", sims: [] },
            { code: "A2.4", title: "Tracing matter and energy through a system", sims: [] },
            { code: "A2.5", title: "Choosing a boundary for a purpose", sims: [] },
          ],
        },
        {
          code: "A3", title: "Models of systems",
          subtopics: [
            { code: "A3.1", title: "Why scientists build models", sims: [] },
            { code: "A3.2", title: "Diagrams and flowcharts as models", sims: [] },
            { code: "A3.3", title: "Physical and digital models", sims: [] },
            { code: "A3.4", title: "What a model leaves out on purpose", sims: [] },
            { code: "A3.5", title: "Building and revising a model of a system", sims: [] },
          ],
        },
        {
          code: "A4", title: "Earth as a system",
          subtopics: [
            { code: "A4.1", title: "The geosphere", sims: [] },
            { code: "A4.2", title: "The hydrosphere", sims: [] },
            { code: "A4.3", title: "The atmosphere", sims: [] },
            { code: "A4.4", title: "The biosphere", sims: [] },
            { code: "A4.5", title: "Interactions among Earth's four spheres", sims: [] },
            { code: "A4.6", title: "Modeling an Earth-system event", sims: [] },
          ],
        },
        {
          code: "A5", title: "Investigation, measurement and evidence",
          subtopics: [
            { code: "A5.1", title: "Lab safety and working like a scientist", sims: [] },
            { code: "A5.2", title: "Variables and fair tests", sims: [] },
            { code: "A5.3", title: "SI units and measurement", sims: [] },
            { code: "A5.4", title: "Organizing and graphing data", sims: [] },
            { code: "A5.5", title: "Claim, evidence and reasoning", sims: [] },
            { code: "A5.6", title: "Designing an investigation of a system", sims: [] },
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
            { code: "B1.1", title: "Cell theory", sims: [] },
            { code: "B1.2", title: "Discovering cells", sims: [] },
            { code: "B1.3", title: "Living vs nonliving", sims: [] },
            { code: "B1.4", title: "Unicellular organisms", sims: [] },
            { code: "B1.5", title: "Multicellular organisms", sims: [] },
            { code: "B1.6", title: "Microscopic scale", sims: [] },
          ],
        },
        {
          code: "B2", title: "Cell structure and function", standards: ["MS-LS1-2"],
          subtopics: [
            { code: "B2.1", title: "Cell membrane", sims: [] },
            { code: "B2.2", title: "Cell wall", sims: [] },
            { code: "B2.3", title: "Nucleus", sims: [] },
            { code: "B2.4", title: "Mitochondria", sims: [] },
            { code: "B2.5", title: "Chloroplasts", sims: [] },
            { code: "B2.6", title: "Relating structure to whole-cell function", sims: [] },
          ],
        },
        {
          code: "B3", title: "Levels of organization", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B3.1", title: "The organizational hierarchy", sims: [] },
            { code: "B3.2", title: "Cell specialization", sims: [] },
            { code: "B3.3", title: "Tissues", sims: [] },
            { code: "B3.4", title: "Organs", sims: [] },
            { code: "B3.5", title: "Organ systems", sims: [] },
            { code: "B3.6", title: "The organism as the whole system", sims: [] },
          ],
        },
        {
          code: "B4", title: "Human body systems", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B4.1", title: "Digestive system", sims: [] },
            { code: "B4.2", title: "Excretory system", sims: [] },
            { code: "B4.3", title: "Circulatory system", sims: [] },
            { code: "B4.4", title: "Respiratory system", sims: [] },
            { code: "B4.5", title: "Muscular system", sims: [] },
            { code: "B4.6", title: "Nervous system", sims: [] },
          ],
        },
        {
          code: "B5", title: "Body systems working together", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B5.1", title: "Digestion and circulation together", sims: [] },
            { code: "B5.2", title: "Circulation and respiration together", sims: [] },
            { code: "B5.3", title: "Nervous and muscular systems together", sims: [] },
            { code: "B5.4", title: "The excretory system and internal balance", sims: [] },
            { code: "B5.5", title: "Case study: the body during exercise", sims: [] },
            { code: "B5.6", title: "Interactions among body systems, generalized", sims: [] },
          ],
        },
        {
          code: "B6", title: "Sensory systems and information processing", standards: ["MS-LS1-8"],
          subtopics: [
            { code: "B6.1", title: "Sensory receptors and stimuli", sims: [] },
            { code: "B6.2", title: "The path of a signal to the brain", sims: [] },
            { code: "B6.3", title: "Processing information in the brain", sims: [] },
            { code: "B6.4", title: "Voluntary and reflex responses", sims: [] },
            { code: "B6.5", title: "Memory and stored information", sims: [] },
            { code: "B6.6", title: "Stimulus to response to memory, together", sims: [] },
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
            { code: "C1.1", title: "Forms of energy", sims: [] },
            { code: "C1.2", title: "Kinetic energy", sims: [] },
            { code: "C1.3", title: "Potential energy", sims: [] },
            { code: "C1.4", title: "Energy transfer and transformation", sims: [] },
            { code: "C1.5", title: "Conservation of energy, introduced", sims: [] },
            { code: "C1.6", title: "Tracking energy through everyday examples", sims: [] },
          ],
        },
        {
          code: "C2", title: "Particles, temperature and thermal energy", standards: ["MS-PS3-5"],
          subtopics: [
            { code: "C2.1", title: "Matter is made of particles", sims: [] },
            { code: "C2.2", title: "Evidence for particle motion", sims: [] },
            { code: "C2.3", title: "Particle movement in solids, liquids and gases", sims: [] },
            { code: "C2.4", title: "Temperature as average kinetic energy", sims: [] },
            { code: "C2.5", title: "Temperature vs total thermal energy", sims: [] },
            { code: "C2.6", title: "Measuring temperature", sims: [] },
          ],
        },
        {
          code: "C3", title: "Thermal energy transfer", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C3.1", title: "Energy flows hot to cold", sims: [] },
            { code: "C3.2", title: "Conduction", sims: [] },
            { code: "C3.3", title: "Convection", sims: [] },
            { code: "C3.4", title: "Radiation", sims: [] },
            { code: "C3.5", title: "Conductors and insulators", sims: [] },
            { code: "C3.6", title: "Thermal equilibrium", sims: [] },
          ],
        },
        {
          code: "C4", title: "Matter, mass and temperature change", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C4.1", title: "Effect of material type on temperature change", sims: [] },
            { code: "C4.2", title: "Effect of mass on temperature change", sims: [] },
            { code: "C4.3", title: "Planning a fair test investigation", sims: [] },
            { code: "C4.4", title: "Collecting and organizing temperature-time data", sims: [] },
            { code: "C4.5", title: "Analyzing and interpreting data", sims: [] },
            { code: "C4.6", title: "Constructing an explanation from evidence", sims: [] },
          ],
        },
        {
          code: "C5", title: "Engineering with thermal energy",
          standards: ["MS-PS3-3", "MS-ETS1-3", "MS-ETS1-4"],
          subtopics: [
            { code: "C5.1", title: "Choosing materials to control heat transfer", sims: [] },
            { code: "C5.2", title: "Defining the design problem", sims: [] },
            { code: "C5.3", title: "Designing and building a device", sims: [] },
            { code: "C5.4", title: "Testing a device and collecting data", sims: [] },
            { code: "C5.5", title: "Comparing competing designs", sims: [] },
            { code: "C5.6", title: "Redesigning based on evidence", sims: [] },
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
            { code: "D1.1", title: "Earth's water reservoirs", sims: [] },
            { code: "D1.2", title: "Evaporation and condensation", sims: [] },
            { code: "D1.3", title: "Precipitation, runoff and infiltration", sims: [] },
            { code: "D1.4", title: "Transpiration and the biological piece of the cycle", sims: [] },
            { code: "D1.5", title: "Two drivers: solar energy and gravity", sims: [] },
            { code: "D1.6", title: "Residence time and the water cycle as a system", sims: [] },
          ],
        },
        {
          code: "D2", title: "The atmosphere",
          subtopics: [
            { code: "D2.1", title: "Composition of the atmosphere", sims: [] },
            { code: "D2.2", title: "Layers of the atmosphere", sims: [] },
            { code: "D2.3", title: "Air pressure", sims: [] },
            { code: "D2.4", title: "Pressure, temperature and density together", sims: [] },
            { code: "D2.5", title: "Why warm air rises", sims: [] },
          ],
        },
        {
          code: "D3", title: "Weather variables and instruments",
          subtopics: [
            { code: "D3.1", title: "Temperature", sims: [] },
            { code: "D3.2", title: "Air pressure and the barometer", sims: [] },
            { code: "D3.3", title: "Humidity and dew point", sims: [] },
            { code: "D3.4", title: "Precipitation", sims: [] },
            { code: "D3.5", title: "Wind: speed and direction", sims: [] },
            { code: "D3.6", title: "Reading a weather station together", sims: [] },
          ],
        },
        {
          code: "D4", title: "Air masses and fronts", standards: ["MS-ESS2-5"],
          subtopics: [
            { code: "D4.1", title: "Air masses and source regions", sims: [] },
            { code: "D4.2", title: "High- and low-pressure systems", sims: [] },
            { code: "D4.3", title: "Cold fronts", sims: [] },
            { code: "D4.4", title: "Warm fronts", sims: [] },
            { code: "D4.5", title: "Occluded and stationary fronts", sims: [] },
            { code: "D4.6", title: "Collecting data to track a front", sims: [] },
          ],
        },
        {
          code: "D5", title: "Unequal heating of Earth",
          subtopics: [
            { code: "D5.1", title: "Angle of sunlight and latitude", sims: [] },
            { code: "D5.2", title: "Land versus water heating rates", sims: [] },
            { code: "D5.3", title: "Altitude", sims: [] },
            { code: "D5.4", title: "Albedo", sims: [] },
            { code: "D5.5", title: "Day, night and the combined pattern", sims: [] },
          ],
        },
        {
          code: "D6", title: "California's weather",
          subtopics: [
            { code: "D6.1", title: "Coastal versus inland temperature patterns", sims: [] },
            { code: "D6.2", title: "The marine layer and coastal fog", sims: [] },
            { code: "D6.3", title: "The Sierra Nevada and rain shadow", sims: [] },
            { code: "D6.4", title: "California's deserts", sims: [] },
            { code: "D6.5", title: "The Pacific's moderating influence", sims: [] },
            { code: "D6.6", title: "Putting California's weather together", sims: [] },
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
            { code: "E1.1", title: "Weather versus climate", sims: [] },
            { code: "E1.2", title: "Building climate from weather data", sims: [] },
            { code: "E1.3", title: "Reading climate graphs", sims: [] },
            { code: "E1.4", title: "Reading climate maps", sims: [] },
            { code: "E1.5", title: "Climate zones", sims: [] },
          ],
        },
        {
          code: "E2", title: "Atmospheric and ocean circulation", standards: ["MS-ESS2-6"],
          subtopics: [
            { code: "E2.1", title: "Convection cells from unequal heating", sims: [] },
            { code: "E2.2", title: "Circulation cells and prevailing winds", sims: [] },
            { code: "E2.3", title: "An introductory Coriolis effect", sims: [] },
            { code: "E2.4", title: "Surface ocean currents", sims: [] },
            { code: "E2.5", title: "Temperature, salinity and density in ocean water", sims: [] },
            { code: "E2.6", title: "Heat redistribution: one combined model", sims: [] },
          ],
        },
        {
          code: "E3", title: "Structures and behaviors for reproduction", standards: ["MS-LS1-4"],
          subtopics: [
            { code: "E3.1", title: "Courtship behavior", sims: [] },
            { code: "E3.2", title: "Nesting and parental care", sims: [] },
            { code: "E3.3", title: "Flower structures and pollen", sims: [] },
            { code: "E3.4", title: "Pollination", sims: [] },
            { code: "E3.5", title: "Seeds and dispersal", sims: [] },
          ],
        },
        {
          code: "E4", title: "Environmental and genetic factors in growth", standards: ["MS-LS1-5"],
          subtopics: [
            { code: "E4.1", title: "Environmental factors in growth", sims: [] },
            { code: "E4.2", title: "Testing an environmental factor", sims: [] },
            { code: "E4.3", title: "Genetic differences and growth", sims: [] },
            { code: "E4.4", title: "Comparing individuals across conditions", sims: [] },
            { code: "E4.5", title: "Separating genetic from environmental influence", sims: [] },
          ],
        },
        {
          code: "E5", title: "Sexual and asexual reproduction", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E5.1", title: "Sexual reproduction", sims: [] },
            { code: "E5.2", title: "Why sexual offspring resemble but do not match parents", sims: [] },
            { code: "E5.3", title: "Asexual reproduction", sims: [] },
            { code: "E5.4", title: "Why asexual offspring are genetically identical", sims: [] },
            { code: "E5.5", title: "Comparing the two strategies", sims: [] },
          ],
        },
        {
          code: "E6", title: "Heredity and genetic variation", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E6.1", title: "Genes as inherited information", sims: [] },
            { code: "E6.2", title: "Inheritance and variation among siblings", sims: [] },
            { code: "E6.3", title: "Why sexual reproduction produces variation", sims: [] },
            { code: "E6.4", title: "Why asexual reproduction preserves identical information", sims: [] },
            { code: "E6.5", title: "Simple inheritance diagrams", sims: [] },
            { code: "E6.6", title: "An introductory Punnett square", sims: [] },
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
            { code: "F1.1", title: "The components of the climate system", sims: [] },
            { code: "F1.2", title: "Energy in and energy out", sims: [] },
            { code: "F1.3", title: "The natural greenhouse effect, descriptively", sims: [] },
            { code: "F1.4", title: "A feedback, introduced conceptually", sims: [] },
            { code: "F1.5", title: "The climate system as interacting subsystems", sims: [] },
          ],
        },
        {
          code: "F2", title: "Evidence of a changing climate", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F2.1", title: "Ice cores", sims: [] },
            { code: "F2.2", title: "Tree rings and coral bands", sims: [] },
            { code: "F2.3", title: "The instrumental record", sims: [] },
            { code: "F2.4", title: "Sea level and sea ice", sims: [] },
            { code: "F2.5", title: "The Keeling curve", sims: [] },
            { code: "F2.6", title: "Why independent evidence agreeing is the whole argument", sims: [] },
          ],
        },
        {
          code: "F3", title: "Causes: human activities and natural factors", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F3.1", title: "Greenhouse gases", sims: [] },
            { code: "F3.2", title: "Fossil-fuel combustion and cement production", sims: [] },
            { code: "F3.3", title: "Agriculture and land use", sims: [] },
            { code: "F3.4", title: "Natural factors", sims: [] },
            { code: "F3.5", title: "Comparing timescales", sims: [] },
          ],
        },
        {
          code: "F4", title: "Correlation, causation and reading evidence",
          subtopics: [
            { code: "F4.1", title: "Correlation versus causation", sims: [] },
            { code: "F4.2", title: "Reading a graph critically", sims: [] },
            { code: "F4.3", title: "Applying this to climate data", sims: [] },
            { code: "F4.4", title: "Evaluating a claim using multiple lines of evidence", sims: [] },
            { code: "F4.5", title: "Spotting overstated and understated claims", sims: [] },
          ],
        },
        {
          code: "F5", title: "Effects on living systems",
          subtopics: [
            { code: "F5.1", title: "Habitat change", sims: [] },
            { code: "F5.2", title: "Resource availability", sims: [] },
            { code: "F5.3", title: "Plant growth and timing", sims: [] },
            { code: "F5.4", title: "Animal behavior and range shifts", sims: [] },
            { code: "F5.5", title: "Existing adaptations and their limits", sims: [] },
          ],
        },
        {
          code: "F6", title: "Minimizing human impact",
          standards: ["MS-ESS3-3", "MS-ETS1-1", "MS-ETS1-2"],
          subtopics: [
            { code: "F6.1", title: "Monitoring and indicators", sims: [] },
            { code: "F6.2", title: "Mitigation and adaptation", sims: [] },
            { code: "F6.3", title: "Defining the problem, criteria and constraints", sims: [] },
            { code: "F6.4", title: "Comparing and scoring alternatives", sims: [] },
            { code: "F6.5", title: "Technical claims versus value judgements", sims: [] },
          ],
        },
      ],
    },
  ],
};
