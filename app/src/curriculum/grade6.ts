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
            { code: "A1.1", title: "What makes a system a system", sims: ["g6a1-system-or-heap"] },
            { code: "A1.2", title: "Subsystems nested within systems", sims: ["g6a1-nested-parts"] },
            { code: "A1.3", title: "Interactions among a system's parts", sims: ["g6a1-parts-in-step"] },
            { code: "A1.4", title: "Emergent properties", sims: ["g6a1-only-together"] },
            { code: "A1.5", title: "Systems across scales, from a cell to a planet", sims: ["g6a1-scale-ladder"] },
          ],
        },
        {
          code: "A2", title: "Boundaries, inputs and outputs",
          subtopics: [
            { code: "A2.1", title: "Drawing a system's boundary", sims: ["g6a2-where-does-it-end"] },
            { code: "A2.2", title: "Open vs closed systems", sims: ["g6a2-sealed-or-open"] },
            { code: "A2.3", title: "Inputs and outputs", sims: ["g6a2-in-out-and-left"] },
            { code: "A2.4", title: "Tracing matter and energy through a system", sims: ["g6a2-follow-the-lunch"] },
            { code: "A2.5", title: "Choosing a boundary for a purpose", sims: ["g6a2-draw-the-boundary"] },
          ],
        },
        {
          code: "A3", title: "Models of systems",
          subtopics: [
            { code: "A3.1", title: "Why scientists build models", sims: ["g6a3-why-a-model"] },
            { code: "A3.2", title: "Diagrams and flowcharts as models", sims: ["g6a3-boxes-and-arrows"] },
            { code: "A3.3", title: "Physical and digital models", sims: ["g6a3-touch-it-or-run-it"] },
            { code: "A3.4", title: "What a model leaves out on purpose", sims: ["g6a3-not-just-smaller"] },
            { code: "A3.5", title: "Building and revising a model of a system", sims: ["g6a3-build-the-pond"] },
          ],
        },
        {
          code: "A4", title: "Earth as a system",
          subtopics: [
            { code: "A4.1", title: "The geosphere", sims: ["g6a4-inside-the-geosphere"] },
            { code: "A4.2", title: "The hydrosphere", sims: ["g6a4-where-is-the-water"] },
            { code: "A4.3", title: "The atmosphere", sims: ["g6a4-thinner-and-thinner"] },
            { code: "A4.4", title: "The biosphere", sims: ["g6a4-thin-green-film"] },
            { code: "A4.5", title: "Interactions among Earth's four spheres", sims: ["g6a4-one-molecule-four"] },
            { code: "A4.6", title: "Modeling an Earth-system event", sims: ["g6a4-eruption-model"] },
          ],
        },
        {
          code: "A5", title: "Investigation, measurement and evidence",
          subtopics: [
            { code: "A5.1", title: "Lab safety and working like a scientist", sims: ["g6a5-before-you-light"] },
            { code: "A5.2", title: "Variables and fair tests", sims: ["g6a5-variable-roles"] },
            { code: "A5.3", title: "SI units and measurement", sims: ["g6a5-read-it-properly"] },
            { code: "A5.4", title: "Organizing and graphing data", sims: ["g6a5-swing-and-graph"] },
            { code: "A5.5", title: "Claim, evidence and reasoning", sims: ["g6a5-claim-evidence"] },
            { code: "A5.6", title: "Designing an investigation of a system", sims: ["g6a5-two-things-changed"] },
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
            { code: "B2.1", title: "Cell membrane", sims: ["g6b2-membrane"] },
            { code: "B2.2", title: "Cell wall", sims: ["g6b2-cell-wall"] },
            { code: "B2.3", title: "Nucleus", sims: ["g6b2-nucleus"] },
            { code: "B2.4", title: "Mitochondria", sims: ["g6b2-mitochondria"] },
            { code: "B2.5", title: "Chloroplasts", sims: ["g6b2-chloroplasts"] },
            { code: "B2.6", title: "Relating structure to whole-cell function", sims: ["g6b2-build-a-cell"] },
          ],
        },
        {
          code: "B3", title: "Levels of organization", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B3.1", title: "The organizational hierarchy", sims: ["g6b3-hierarchy"] },
            { code: "B3.2", title: "Cell specialization", sims: ["g6b3-specialised-cell"] },
            { code: "B3.3", title: "Tissues", sims: ["g6b3-tissue-pull"] },
            { code: "B3.4", title: "Organs", sims: ["g6b3-build-an-organ"] },
            { code: "B3.5", title: "Organ systems", sims: ["g6b3-which-system"] },
            { code: "B3.6", title: "The organism as the whole system", sims: ["g6b3-down-the-levels"] },
          ],
        },
        {
          code: "B4", title: "Human body systems", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B4.1", title: "Digestive system", sims: ["g6b4-digestive"] },
            { code: "B4.2", title: "Excretory system", sims: ["g6b4-excretory"] },
            { code: "B4.3", title: "Circulatory system", sims: ["g6b4-circulatory"] },
            { code: "B4.4", title: "Respiratory system", sims: ["g6b4-respiratory"] },
            { code: "B4.5", title: "Muscular system", sims: ["g6b4-muscular"] },
            { code: "B4.6", title: "Nervous system", sims: ["g6b4-nerve-cell"] },
          ],
        },
        {
          code: "B5", title: "Body systems working together", standards: ["MS-LS1-3"],
          subtopics: [
            { code: "B5.1", title: "Digestion and circulation together", sims: ["g6b5-meal-to-blood"] },
            { code: "B5.2", title: "Circulation and respiration together", sims: ["g6b5-gas-handover"] },
            { code: "B5.3", title: "Nervous and muscular systems together", sims: ["g6b5-catch-a-ball"] },
            { code: "B5.4", title: "The excretory system and internal balance", sims: ["g6b5-water-balance"] },
            { code: "B5.5", title: "Case study: the body during exercise", sims: ["g6b5-exercise"] },
            { code: "B5.6", title: "Interactions among body systems, generalized", sims: ["g6b5-what-a-cell-needs"] },
          ],
        },
        {
          code: "B6", title: "Sensory systems and information processing", standards: ["MS-LS1-8"],
          subtopics: [
            { code: "B6.1", title: "Sensory receptors and stimuli", sims: ["g6b6-receptors"] },
            { code: "B6.2", title: "The path of a signal to the brain", sims: ["g6b6-signal-path"] },
            { code: "B6.3", title: "Processing information in the brain", sims: ["g6b6-cost-of-choosing"] },
            { code: "B6.4", title: "Voluntary and reflex responses", sims: ["g6b6-reflex-vs-voluntary"] },
            { code: "B6.5", title: "Memory and stored information", sims: ["g6b6-memory"] },
            { code: "B6.6", title: "Stimulus to response to memory, together", sims: ["g6b6-close-the-loop"] },
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
            { code: "C1.1", title: "Forms of energy", sims: ["g6c1-moving-or-stored"] },
            { code: "C1.2", title: "Kinetic energy", sims: ["g6c1-twice-the-speed"] },
            { code: "C1.3", title: "Potential energy", sims: ["g6c1-lifted-and-ready"] },
            { code: "C1.4", title: "Energy transfer and transformation", sims: ["g6c1-arm-to-light"] },
            { code: "C1.5", title: "Conservation of energy, introduced", sims: ["g6c1-nothing-is-lost"] },
            { code: "C1.6", title: "Tracking energy through everyday examples", sims: ["g6c1-where-it-ends-up"] },
          ],
        },
        {
          code: "C2", title: "Particles, temperature and thermal energy", standards: ["MS-PS3-5"],
          subtopics: [
            { code: "C2.1", title: "Matter is made of particles", sims: ["g6c2-cut-it-again"] },
            { code: "C2.2", title: "Evidence for particle motion", sims: ["g6c2-how-a-smell"] },
            { code: "C2.3", title: "Particle movement in solids, liquids and gases", sims: ["g6c2-solid-liquid-gas"] },
            { code: "C2.4", title: "Temperature as average kinetic energy", sims: ["g6c2-how-fast"] },
            { code: "C2.5", title: "Temperature vs total thermal energy", sims: ["g6c2-spark-and-bath"] },
            { code: "C2.6", title: "Measuring temperature", sims: ["g6c2-inside-a-thermo"] },
          ],
        },
        {
          code: "C3", title: "Thermal energy transfer", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C3.1", title: "Energy flows hot to cold", sims: ["g6c3-which-way"] },
            { code: "C3.2", title: "Conduction", sims: ["g6c3-along-the-rod"] },
            { code: "C3.3", title: "Convection", sims: ["g6c3-warm-air-rises"] },
            { code: "C3.4", title: "Radiation", sims: ["g6c3-across-the-gap"] },
            { code: "C3.5", title: "Conductors and insulators", sims: ["g6c3-metal-feels-colder"] },
            { code: "C3.6", title: "Thermal equilibrium", sims: ["g6c3-meeting-in-middle"] },
          ],
        },
        {
          code: "C4", title: "Matter, mass and temperature change", standards: ["MS-PS3-4"],
          subtopics: [
            { code: "C4.1", title: "Effect of material type on temperature change", sims: ["g6c4-which-material"] },
            { code: "C4.2", title: "Effect of mass on temperature change", sims: ["g6c4-how-much-matter"] },
            { code: "C4.3", title: "Planning a fair test investigation", sims: ["g6c4-fair-test-rig"] },
            { code: "C4.4", title: "Collecting and organizing temperature-time data", sims: ["g6c4-minute-by-minute"] },
            { code: "C4.5", title: "Analyzing and interpreting data", sims: ["g6c4-two-data-sets"] },
            { code: "C4.6", title: "Constructing an explanation from evidence", sims: ["g6c4-does-it-follow"] },
          ],
        },
        {
          code: "C5", title: "Engineering with thermal energy",
          standards: ["MS-PS3-3", "MS-ETS1-3", "MS-ETS1-4"],
          subtopics: [
            { code: "C5.1", title: "Choosing materials to control heat transfer", sims: ["g6c5-what-blocks-heat"] },
            { code: "C5.2", title: "Defining the design problem", sims: ["g6c5-criteria-or-limit"] },
            { code: "C5.3", title: "Designing and building a device", sims: ["g6c5-build-the-cup"] },
            { code: "C5.4", title: "Testing a device and collecting data", sims: ["g6c5-test-the-cup"] },
            { code: "C5.5", title: "Comparing competing designs", sims: ["g6c5-two-designs"] },
            { code: "C5.6", title: "Redesigning based on evidence", sims: ["g6c5-one-change"] },
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
            { code: "D1.1", title: "Earth's water reservoirs", sims: ["g6d1-where-the-water-is"] },
            { code: "D1.2", title: "Evaporation and condensation", sims: ["g6d1-into-the-air-and-back"] },
            { code: "D1.3", title: "Precipitation, runoff and infiltration", sims: ["g6d1-meadow-or-car-park"] },
            { code: "D1.4", title: "Transpiration and the biological piece of the cycle", sims: ["g6d1-through-the-tree"] },
            { code: "D1.5", title: "Two drivers: solar energy and gravity", sims: ["g6d1-sun-lifts-gravity-drops"] },
            { code: "D1.6", title: "Residence time and the water cycle as a system", sims: ["g6d1-how-long-it-stays"] },
          ],
        },
        {
          code: "D2", title: "The atmosphere",
          subtopics: [
            { code: "D2.1", title: "Composition of the atmosphere", sims: ["g6d2-what-air-is-made-of"] },
            { code: "D2.2", title: "Layers of the atmosphere", sims: ["g6d2-five-floors-up"] },
            { code: "D2.3", title: "Air pressure", sims: ["g6d2-ten-tonnes-above"] },
            { code: "D2.4", title: "Pressure, temperature and density together", sims: ["g6d2-pick-two-get-the-third"] },
            { code: "D2.5", title: "Why warm air rises", sims: ["g6d2-why-warm-air-rises"] },
          ],
        },
        {
          code: "D3", title: "Weather variables and instruments",
          subtopics: [
            { code: "D3.1", title: "Temperature", sims: ["g6d3-three-scales-one-bulb"] },
            { code: "D3.2", title: "Air pressure and the barometer", sims: ["g6d3-a-column-of-mercury"] },
            { code: "D3.3", title: "Humidity and dew point", sims: ["g6d3-two-thermometers-one-wet"] },
            { code: "D3.4", title: "Precipitation", sims: ["g6d3-what-falls-and-why"] },
            { code: "D3.5", title: "Wind: speed and direction", sims: ["g6d3-four-times-the-speed"] },
            { code: "D3.6", title: "Reading a weather station together", sims: ["g6d3-build-the-station"] },
          ],
        },
        {
          code: "D4", title: "Air masses and fronts", standards: ["MS-ESS2-5"],
          subtopics: [
            { code: "D4.1", title: "Air masses and source regions", sims: ["g6d4-where-the-air-was-born"] },
            { code: "D4.2", title: "High- and low-pressure systems", sims: ["g6d4-sinking-or-rising"] },
            { code: "D4.3", title: "Cold fronts", sims: ["g6d4-the-cold-front-passes"] },
            { code: "D4.4", title: "Warm fronts", sims: ["g6d4-a-ramp-one-in-two-hundred"] },
            { code: "D4.5", title: "Occluded and stationary fronts", sims: ["g6d4-the-end-of-a-low"] },
            { code: "D4.6", title: "Collecting data to track a front", sims: ["g6d4-tracking-it-across-the-state"] },
          ],
        },
        {
          code: "D5", title: "Unequal heating of Earth",
          subtopics: [
            { code: "D5.1", title: "Angle of sunlight and latitude", sims: ["g6d5-spread-thin"] },
            { code: "D5.2", title: "Land versus water heating rates", sims: ["g6d5-sand-and-sea"] },
            { code: "D5.3", title: "Altitude", sims: ["g6d5-six-and-a-half-per-kilometre"] },
            { code: "D5.4", title: "Albedo", sims: ["g6d5-what-the-ground-sends-back"] },
            { code: "D5.5", title: "Day, night and the combined pattern", sims: ["g6d5-the-afternoon-lag"] },
          ],
        },
        {
          code: "D6", title: "California's weather",
          subtopics: [
            { code: "D6.1", title: "Coastal versus inland temperature patterns", sims: ["g6d6-twenty-degrees-apart"] },
            { code: "D6.2", title: "The marine layer and coastal fog", sims: ["g6d6-the-grey-lid"] },
            { code: "D6.3", title: "The Sierra Nevada and rain shadow", sims: ["g6d6-over-the-sierra"] },
            { code: "D6.4", title: "California's deserts", sims: ["g6d6-how-dry-is-dry"] },
            { code: "D6.5", title: "The Pacific's moderating influence", sims: ["g6d6-the-oceans-flywheel"] },
            { code: "D6.6", title: "Putting California's weather together", sims: ["g6d6-one-parcel-across-california"] },
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
            { code: "E1.1", title: "Weather versus climate", sims: ["g6e1-today-or-always"] },
            { code: "E1.2", title: "Building climate from weather data", sims: ["g6e1-thirty-years"] },
            { code: "E1.3", title: "Reading climate graphs", sims: ["g6e1-reading-a-climograph"] },
            { code: "E1.4", title: "Reading climate maps", sims: ["g6e1-belts-on-the-map"] },
            { code: "E1.5", title: "Climate zones", sims: ["g6e1-which-zone"] },
          ],
        },
        {
          code: "E2", title: "Atmospheric and ocean circulation", standards: ["MS-ESS2-6"],
          subtopics: [
            { code: "E2.1", title: "Convection cells from unequal heating", sims: ["g6e2-slanting-sunlight"] },
            { code: "E2.2", title: "Circulation cells and prevailing winds", sims: ["g6e2-three-cells"] },
            { code: "E2.3", title: "An introductory Coriolis effect", sims: ["g6e2-the-long-throw"] },
            { code: "E2.4", title: "Surface ocean currents", sims: ["g6e2-around-the-gyre"] },
            { code: "E2.5", title: "Temperature, salinity and density in ocean water", sims: ["g6e2-what-makes-it-sink"] },
            { code: "E2.6", title: "Heat redistribution: one combined model", sims: ["g6e2-moving-the-surplus"] },
          ],
        },
        {
          code: "E3", title: "Structures and behaviors for reproduction", standards: ["MS-LS1-4"],
          subtopics: [
            { code: "E3.1", title: "Courtship behavior", sims: ["g6e3-signal-or-not"] },
            { code: "E3.2", title: "Nesting and parental care", sims: ["g6e3-how-many-survive"] },
            { code: "E3.3", title: "Flower structures and pollen", sims: ["g6e3-inside-a-grain"] },
            { code: "E3.4", title: "Pollination", sims: ["g6e3-anther-to-seed"] },
            { code: "E3.5", title: "Seeds and dispersal", sims: ["g6e3-how-far-carried"] },
          ],
        },
        {
          code: "E4", title: "Environmental and genetic factors in growth", standards: ["MS-LS1-5"],
          subtopics: [
            { code: "E4.1", title: "Environmental factors in growth", sims: ["g6e4-how-much-light"] },
            { code: "E4.2", title: "Testing an environmental factor", sims: ["g6e4-one-thing-at-a-time"] },
            { code: "E4.3", title: "Genetic differences and growth", sims: ["g6e4-same-pot-same-sun"] },
            { code: "E4.4", title: "Comparing individuals across conditions", sims: ["g6e4-shortest-stave"] },
            { code: "E4.5", title: "Separating genetic from environmental influence", sims: ["g6e4-genes-or-garden"] },
          ],
        },
        {
          code: "E5", title: "Sexual and asexual reproduction", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E5.1", title: "Sexual reproduction", sims: ["g6e5-half-from-each"] },
            { code: "E5.2", title: "Why sexual offspring resemble but do not match parents", sims: ["g6e5-eight-million"] },
            { code: "E5.3", title: "Asexual reproduction", sims: ["g6e5-one-parent-or-two"] },
            { code: "E5.4", title: "Why asexual offspring are genetically identical", sims: ["g6e5-copied-letter-for-letter"] },
            { code: "E5.5", title: "Comparing the two strategies", sims: ["g6e5-speed-or-variety"] },
          ],
        },
        {
          code: "E6", title: "Heredity and genetic variation", standards: ["MS-LS3-2"],
          subtopics: [
            { code: "E6.1", title: "Genes as inherited information", sims: ["g6e6-what-a-gene-is"] },
            { code: "E6.2", title: "Inheritance and variation among siblings", sims: ["g6e6-twins-and-siblings"] },
            { code: "E6.3", title: "Why sexual reproduction produces variation", sims: ["g6e6-three-shuffles"] },
            { code: "E6.4", title: "Why asexual reproduction preserves identical information", sims: ["g6e6-almost-perfect"] },
            { code: "E6.5", title: "Simple inheritance diagrams", sims: ["g6e6-build-the-cross"] },
            { code: "E6.6", title: "An introductory Punnett square", sims: ["g6e6-punnett-square"] },
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
            { code: "F1.1", title: "The components of the climate system", sims: ["g6f1-five-spheres"] },
            { code: "F1.2", title: "Energy in and energy out", sims: ["g6f1-in-and-out"] },
            { code: "F1.3", title: "The natural greenhouse effect, descriptively", sims: ["g6f1-blanket-of-air"] },
            { code: "F1.4", title: "A feedback, introduced conceptually", sims: ["g6f1-loops-both-ways"] },
            { code: "F1.5", title: "The climate system as interacting subsystems", sims: ["g6f1-one-carbon-atom"] },
          ],
        },
        {
          code: "F2", title: "Evidence of a changing climate", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F2.1", title: "Ice cores", sims: ["g6f2-reading-the-ice"] },
            { code: "F2.2", title: "Tree rings and coral bands", sims: ["g6f2-rings-and-bands"] },
            { code: "F2.3", title: "The instrumental record", sims: ["g6f2-thermometer-record"] },
            { code: "F2.4", title: "Sea level and sea ice", sims: ["g6f2-rising-water"] },
            { code: "F2.5", title: "The Keeling curve", sims: ["g6f2-keeling-curve"] },
            { code: "F2.6", title: "Why independent evidence agreeing is the whole argument", sims: ["g6f2-many-witnesses"] },
          ],
        },
        {
          code: "F3", title: "Causes: human activities and natural factors", standards: ["MS-ESS3-5"],
          subtopics: [
            { code: "F3.1", title: "Greenhouse gases", sims: ["g6f3-which-gases-trap"] },
            { code: "F3.2", title: "Fossil-fuel combustion and cement production", sims: ["g6f3-burning-and-baking"] },
            { code: "F3.3", title: "Agriculture and land use", sims: ["g6f3-forest-to-burger"] },
            { code: "F3.4", title: "Natural factors", sims: ["g6f3-sun-or-us"] },
            { code: "F3.5", title: "Comparing timescales", sims: ["g6f3-how-fast-is-fast"] },
          ],
        },
        {
          code: "F4", title: "Correlation, causation and reading evidence",
          subtopics: [
            { code: "F4.1", title: "Correlation versus causation", sims: ["g6f4-two-things-together"] },
            { code: "F4.2", title: "Reading a graph critically", sims: ["g6f4-where-you-start"] },
            { code: "F4.3", title: "Applying this to climate data", sims: ["g6f4-which-came-first"] },
            { code: "F4.4", title: "Evaluating a claim using multiple lines of evidence", sims: ["g6f4-six-fingerprints"] },
            { code: "F4.5", title: "Spotting overstated and understated claims", sims: ["g6f4-too-much-too-little"] },
          ],
        },
        {
          code: "F5", title: "Effects on living systems",
          subtopics: [
            { code: "F5.1", title: "Habitat change", sims: ["g6f5-degree-heating-weeks"] },
            { code: "F5.2", title: "Resource availability", sims: ["g6f5-a-month-of-fasting"] },
            { code: "F5.3", title: "Plant growth and timing", sims: ["g6f5-counting-the-heat"] },
            { code: "F5.4", title: "Animal behavior and range shifts", sims: ["g6f5-moving-north"] },
            { code: "F5.5", title: "Existing adaptations and their limits", sims: ["g6f5-built-for-a-colder-world"] },
          ],
        },
        {
          code: "F6", title: "Minimizing human impact",
          standards: ["MS-ESS3-3", "MS-ETS1-1", "MS-ETS1-2"],
          subtopics: [
            { code: "F6.1", title: "Monitoring and indicators", sims: ["g6f6-how-we-watch"] },
            { code: "F6.2", title: "Mitigation and adaptation", sims: ["g6f6-cause-or-harm"] },
            { code: "F6.3", title: "Defining the problem, criteria and constraints", sims: ["g6f6-a-problem-worth-solving"] },
            { code: "F6.4", title: "Comparing and scoring alternatives", sims: ["g6f6-what-matters-most"] },
            { code: "F6.5", title: "Technical claims versus value judgements", sims: ["g6f6-fact-or-judgement"] },
          ],
        },
      ],
    },
  ],
};
