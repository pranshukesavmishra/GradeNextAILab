import type { GradeCurriculum } from "./types";

/**
 * Grade 7 — California Integrated Science.
 * 6 units · 33 topics · 166 subtopics · 22 CA NGSS performance expectations.
 */
export const GRADE_7: GradeCurriculum = {
  grade: 7,
  title: "Integrated Science, Grade 7",
  summary:
    "The year matter gets real: atoms and the periodic table, reactions that conserve " +
    "every atom, the chemistry of being alive, ecosystems, moving plates, and hazards.",
  units: [
    {
      code: "A", title: "Atoms and the Structure of Matter", subject: "chemistry",
      topics: [
        {
          code: "A1", title: "The particle model, refined", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A1.1", title: "Reviewing the particle model", sims: [] },
            { code: "A1.2", title: "Why chemistry needs a sharper picture", sims: [] },
            { code: "A1.3", title: "Evidence that particles are real", sims: [] },
            { code: "A1.4", title: "Particles versus atoms", sims: [] },
            { code: "A1.5", title: "Scale of the atom", sims: [] },
          ],
        },
        {
          code: "A2", title: "Inside the atom", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A2.1", title: "Protons, neutrons and electrons", sims: [] },
            { code: "A2.2", title: "Atomic number defines the element", sims: [] },
            { code: "A2.3", title: "Mass number and isotopes", sims: [] },
            { code: "A2.4", title: "Building the model — early evidence", sims: [] },
            { code: "A2.5", title: "Building the model — from shells to a cloud", sims: [] },
            { code: "A2.6", title: "Why the model kept changing", sims: [] },
          ],
        },
        {
          code: "A3", title: "Elements and the periodic table", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A3.1", title: "Reading a cell of the periodic table", sims: [] },
            { code: "A3.2", title: "Groups and periods", sims: [] },
            { code: "A3.3", title: "Metals, non-metals and metalloids", sims: [] },
            { code: "A3.4", title: "Why the table is organized this way", sims: [] },
            { code: "A3.5", title: "Reactivity patterns across the table", sims: [] },
          ],
        },
        {
          code: "A4", title: "Molecules, compounds and formulas", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A4.1", title: "Element, compound and mixture", sims: [] },
            { code: "A4.2", title: "Reading a chemical formula", sims: [] },
            { code: "A4.3", title: "Subscripts versus coefficients", sims: [] },
            { code: "A4.4", title: "Counting atoms in a formula", sims: [] },
            { code: "A4.5", title: "Modeling a molecule from its formula", sims: [] },
          ],
        },
        {
          code: "A5", title: "Modeling extended structures", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A5.1", title: "Ball-and-stick models", sims: [] },
            { code: "A5.2", title: "Space-filling models", sims: [] },
            { code: "A5.3", title: "When there is no single molecule", sims: [] },
            { code: "A5.4", title: "Comparing molecular and lattice structures", sims: [] },
            { code: "A5.5", title: "Choosing the right model for the job", sims: [] },
          ],
        },
      ],
    },
    {
      code: "B", title: "Chemical Reactions and Conservation of Matter", subject: "chemistry",
      topics: [
        {
          code: "B1", title: "Physical change versus chemical change", standards: ["MS-PS1-2"],
          subtopics: [
            { code: "B1.1", title: "Physical changes", sims: [] },
            { code: "B1.2", title: "Chemical changes", sims: [] },
            { code: "B1.3", title: "Cases that are easy to confuse", sims: [] },
            { code: "B1.4", title: "Properties before and after", sims: [] },
            { code: "B1.5", title: "Reversibility as a clue, not a rule", sims: [] },
          ],
        },
        {
          code: "B2", title: "Evidence that a reaction happened", standards: ["MS-PS1-2"],
          subtopics: [
            { code: "B2.1", title: "Signs a reaction may have occurred", sims: [] },
            { code: "B2.2", title: "Analyzing property data before and after", sims: [] },
            { code: "B2.3", title: "Identifying an unknown from a property table", sims: [] },
            { code: "B2.4", title: "Why appearance alone is not proof", sims: [] },
            { code: "B2.5", title: "Naming a reaction from what goes in and comes out", sims: [] },
          ],
        },
        {
          code: "B3", title: "Conservation of mass", standards: ["MS-PS1-5"],
          subtopics: [
            { code: "B3.1", title: "Mass before and after, in a closed container", sims: [] },
            { code: "B3.2", title: "Mass before and after, in an open container", sims: [] },
            { code: "B3.3", title: "Atom-counting diagrams", sims: [] },
            { code: "B3.4", title: "Why mass conservation follows from atom conservation", sims: [] },
            { code: "B3.5", title: "Applying conservation to an unfamiliar reaction", sims: [] },
          ],
        },
        {
          code: "B4", title: "Thermal energy, particles and states", standards: ["MS-PS1-4"],
          subtopics: [
            { code: "B4.1", title: "Energy added and particle motion, revisited", sims: [] },
            { code: "B4.2", title: "Forces between particles", sims: [] },
            { code: "B4.3", title: "Reading a heating curve", sims: [] },
            { code: "B4.4", title: "Why temperature plateaus during a state change", sims: [] },
            { code: "B4.5", title: "Predicting a heating curve for a new substance", sims: [] },
          ],
        },
        {
          code: "B5", title: "Synthetic materials from natural resources", standards: ["MS-PS1-3"],
          subtopics: [
            { code: "B5.1", title: "Petroleum and plastics", sims: [] },
            { code: "B5.2", title: "Ores and alloys", sims: [] },
            { code: "B5.3", title: "Medicines and synthetic fibers", sims: [] },
            { code: "B5.4", title: "Benefit and cost of a synthetic material", sims: [] },
            { code: "B5.5", title: "Comparing a natural and synthetic alternative", sims: [] },
          ],
        },
        {
          code: "B6", title: "Designing a thermal energy device", standards: ["MS-PS1-6"],
          subtopics: [
            { code: "B6.1", title: "Criteria and constraints", sims: [] },
            { code: "B6.2", title: "Choosing a chemical process", sims: [] },
            { code: "B6.3", title: "Collecting temperature data", sims: [] },
            { code: "B6.4", title: "Modifying the design", sims: [] },
            { code: "B6.5", title: "Reporting the final design", sims: [] },
          ],
        },
      ],
    },
    {
      code: "C", title: "The Chemistry of Being Alive", subject: "biology",
      topics: [
        {
          code: "C1", title: "Photosynthesis: inputs and outputs", standards: ["MS-LS1-6"],
          subtopics: [
            { code: "C1.1", title: "Naming the inputs", sims: [] },
            { code: "C1.2", title: "Naming the outputs", sims: [] },
            { code: "C1.3", title: "Where in the cell this happens", sims: [] },
            { code: "C1.4", title: "Photosynthesis as atoms rearranged", sims: [] },
            { code: "C1.5", title: "Conditions that affect the rate", sims: [] },
          ],
        },
        {
          code: "C2", title: "Evidence for where a plant's mass comes from", standards: ["MS-LS1-6"],
          subtopics: [
            { code: "C2.1", title: "The intuitive but wrong answer", sims: [] },
            { code: "C2.2", title: "Van Helmont's willow tree experiment", sims: [] },
            { code: "C2.3", title: "What the soil-mass evidence actually shows", sims: [] },
            { code: "C2.4", title: "Building the case for air and water", sims: [] },
            { code: "C2.5", title: "Evaluating, not asserting, the conclusion", sims: [] },
          ],
        },
        {
          code: "C3", title: "Cellular respiration", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C3.1", title: "Naming the inputs", sims: [] },
            { code: "C3.2", title: "Naming the outputs", sims: [] },
            { code: "C3.3", title: "Where in the cell this happens", sims: [] },
            { code: "C3.4", title: "Comparing photosynthesis and respiration side by side", sims: [] },
            { code: "C3.5", title: "Respiration in plants and animals alike", sims: [] },
          ],
        },
        {
          code: "C4", title: "Food molecules rearranged", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C4.1", title: "Modeling a food molecule broken down", sims: [] },
            { code: "C4.2", title: "Modeling the atoms rearranged into products", sims: [] },
            { code: "C4.3", title: "Energy released, not created", sims: [] },
            { code: "C4.4", title: "Comparing respiration to a familiar reaction", sims: [] },
            { code: "C4.5", title: "Applying the model to an unfamiliar food molecule", sims: [] },
          ],
        },
        {
          code: "C5", title: "Tracing carbon through an organism", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C5.1", title: "A carbon atom enters a plant", sims: [] },
            { code: "C5.2", title: "A carbon atom moves into an animal", sims: [] },
            { code: "C5.3", title: "A carbon atom returns to the air", sims: [] },
            { code: "C5.4", title: "Photosynthesis and respiration as linked opposite processes", sims: [] },
            { code: "C5.5", title: "Why plants run both processes", sims: [] },
          ],
        },
      ],
    },
    {
      code: "D", title: "Matter and Energy in Ecosystems", subject: "biology",
      topics: [
        {
          code: "D1", title: "Resource availability and populations", standards: ["MS-LS2-1"],
          subtopics: [
            { code: "D1.1", title: "Limiting resources", sims: [] },
            { code: "D1.2", title: "Carrying capacity", sims: [] },
            { code: "D1.3", title: "Reading real population data", sims: [] },
            { code: "D1.4", title: "Predicting the response to scarcity", sims: [] },
            { code: "D1.5", title: "Competition for the same limiting resource", sims: [] },
          ],
        },
        {
          code: "D2", title: "Food webs and energy flow", standards: ["MS-LS2-3"],
          subtopics: [
            { code: "D2.1", title: "Producers, consumers and decomposers", sims: [] },
            { code: "D2.2", title: "From food chain to food web", sims: [] },
            { code: "D2.3", title: "Trophic levels", sims: [] },
            { code: "D2.4", title: "Why energy decreases at each level", sims: [] },
            { code: "D2.5", title: "Reading an energy pyramid", sims: [] },
          ],
        },
        {
          code: "D3", title: "Cycling matter through an ecosystem", standards: ["MS-LS2-3"],
          subtopics: [
            { code: "D3.1", title: "Matter cycling between organisms and the environment", sims: [] },
            { code: "D3.2", title: "Decomposers closing the loop", sims: [] },
            { code: "D3.3", title: "The carbon cycle, introduced", sims: [] },
            { code: "D3.4", title: "The nitrogen cycle, introduced", sims: [] },
            { code: "D3.5", title: "Modeling matter and energy together", sims: [] },
          ],
        },
        {
          code: "D4", title: "Patterns of interaction among organisms", standards: ["MS-LS2-2"],
          subtopics: [
            { code: "D4.1", title: "Competition and predation", sims: [] },
            { code: "D4.2", title: "Mutualism, commensalism and parasitism", sims: [] },
            { code: "D4.3", title: "The same pattern in very different ecosystems", sims: [] },
            { code: "D4.4", title: "Interactions that shift over time or condition", sims: [] },
            { code: "D4.5", title: "Interaction patterns and population change", sims: [] },
          ],
        },
        {
          code: "D5", title: "Ecosystem disruption and change", standards: ["MS-LS2-4"],
          subtopics: [
            { code: "D5.1", title: "Physical disruptions", sims: [] },
            { code: "D5.2", title: "Biological disruptions", sims: [] },
            { code: "D5.3", title: "Constructing an argument from evidence", sims: [] },
            { code: "D5.4", title: "Succession after a disruption", sims: [] },
            { code: "D5.5", title: "Short-term versus long-term change", sims: [] },
          ],
        },
        {
          code: "D6", title: "Biodiversity and ecosystem services", standards: ["MS-LS2-5"],
          subtopics: [
            { code: "D6.1", title: "Naming ecosystem services", sims: [] },
            { code: "D6.2", title: "Threats to biodiversity", sims: [] },
            { code: "D6.3", title: "Named solution categories", sims: [] },
            { code: "D6.4", title: "Evaluating competing solutions", sims: [] },
            { code: "D6.5", title: "A biodiversity solution for a real ecosystem", sims: [] },
          ],
        },
      ],
    },
    {
      code: "E", title: "Earth's Materials and Moving Plates", subject: "earth",
      topics: [
        {
          code: "E1", title: "The rock cycle", standards: ["MS-ESS2-1"],
          subtopics: [
            { code: "E1.1", title: "Igneous rock", sims: [] },
            { code: "E1.2", title: "Sedimentary rock", sims: [] },
            { code: "E1.3", title: "Metamorphic rock", sims: [] },
            { code: "E1.4", title: "Identifying a sample from evidence", sims: [] },
            { code: "E1.5", title: "The energy that drives the cycle", sims: [] },
          ],
        },
        {
          code: "E2", title: "Weathering, erosion and deposition", standards: ["MS-ESS2-2"],
          subtopics: [
            { code: "E2.1", title: "Physical weathering", sims: [] },
            { code: "E2.2", title: "Chemical weathering", sims: [] },
            { code: "E2.3", title: "Agents of erosion", sims: [] },
            { code: "E2.4", title: "Where sediment ends up", sims: [] },
            { code: "E2.5", title: "Soil formation", sims: [] },
          ],
        },
        {
          code: "E3", title: "Geoscience processes across time and scale", standards: ["MS-ESS2-2"],
          subtopics: [
            { code: "E3.1", title: "Fast processes", sims: [] },
            { code: "E3.2", title: "Slow processes", sims: [] },
            { code: "E3.3", title: "Constructing an explanation from rock layers", sims: [] },
            { code: "E3.4", title: "Combining fast and slow in one explanation", sims: [] },
            { code: "E3.5", title: "Spatial scale, from outcrop to continent", sims: [] },
          ],
        },
        {
          code: "E4", title: "Evidence for plate motion", standards: ["MS-ESS2-3"],
          subtopics: [
            { code: "E4.1", title: "Matching coastlines and rock types", sims: [] },
            { code: "E4.2", title: "Matching fossil distributions", sims: [] },
            { code: "E4.3", title: "Seafloor age and magnetic striping", sims: [] },
            { code: "E4.4", title: "Analyzing plate motion data", sims: [] },
            { code: "E4.5", title: "Reconstructing a simplified history", sims: [] },
          ],
        },
        {
          code: "E5", title: "Plate boundaries and the landforms they build", standards: ["MS-ESS2-3"],
          subtopics: [
            { code: "E5.1", title: "Divergent boundaries", sims: [] },
            { code: "E5.2", title: "Convergent boundaries", sims: [] },
            { code: "E5.3", title: "Transform boundaries", sims: [] },
            { code: "E5.4", title: "Why hazards cluster at boundaries", sims: [] },
            { code: "E5.5", title: "Reading a plate-boundary map", sims: [] },
          ],
        },
        {
          code: "E6", title: "The uneven distribution of Earth's resources", standards: ["MS-ESS3-1"],
          subtopics: [
            { code: "E6.1", title: "Mineral resources", sims: [] },
            { code: "E6.2", title: "Energy resources", sims: [] },
            { code: "E6.3", title: "Groundwater as a resource", sims: [] },
            { code: "E6.4", title: "Renewable versus nonrenewable resources", sims: [] },
            { code: "E6.5", title: "Constructing an explanation for resource distribution", sims: [] },
          ],
        },
      ],
    },
    {
      code: "F", title: "Natural Hazards and Engineering Solutions", subject: "engineering",
      topics: [
        {
          code: "F1", title: "Types of natural hazard", standards: ["MS-ESS3-2"],
          subtopics: [
            { code: "F1.1", title: "Geologic hazards", sims: [] },
            { code: "F1.2", title: "Weather-driven hazards", sims: [] },
            { code: "F1.3", title: "Tsunamis as a linked hazard", sims: [] },
            { code: "F1.4", title: "California's own hazard profile", sims: [] },
            { code: "F1.5", title: "A hazard's reach and duration", sims: [] },
          ],
        },
        {
          code: "F2", title: "Forecasting from hazard data", standards: ["MS-ESS3-2"],
          subtopics: [
            { code: "F2.1", title: "Frequency and location of past events", sims: [] },
            { code: "F2.2", title: "Probability, not certainty", sims: [] },
            { code: "F2.3", title: "Reading a hazard map", sims: [] },
            { code: "F2.4", title: "Early warning systems", sims: [] },
            { code: "F2.5", title: "Using data to forecast and inform mitigation", sims: [] },
          ],
        },
        {
          code: "F3", title: "Defining a mitigation problem", standards: ["MS-ETS1-1"],
          subtopics: [
            { code: "F3.1", title: "From vague want to measurable target", sims: [] },
            { code: "F3.2", title: "Criteria versus constraints", sims: [] },
            { code: "F3.3", title: "Who the solution must protect", sims: [] },
            { code: "F3.4", title: "Trade-offs already visible in the problem statement", sims: [] },
            { code: "F3.5", title: "Defining a real mitigation problem", sims: [] },
          ],
        },
        {
          code: "F4", title: "Evaluating competing solutions", standards: ["MS-ETS1-2", "MS-ETS1-3"],
          subtopics: [
            { code: "F4.1", title: "Generating more than one candidate", sims: [] },
            { code: "F4.2", title: "A systematic scoring process", sims: [] },
            { code: "F4.3", title: "Analyzing test data across designs", sims: [] },
            { code: "F4.4", title: "Combining the best characteristics of each", sims: [] },
            { code: "F4.5", title: "Presenting a recommendation with evidence", sims: [] },
          ],
        },
        {
          code: "F5", title: "Iterative testing and optimization", standards: ["MS-ETS1-4"],
          subtopics: [
            { code: "F5.1", title: "Developing a model to generate data", sims: [] },
            { code: "F5.2", title: "A first round of testing", sims: [] },
            { code: "F5.3", title: "Modifying and retesting", sims: [] },
            { code: "F5.4", title: "Naming the trade-off in each improvement", sims: [] },
            { code: "F5.5", title: "Converging on an optimized design", sims: [] },
          ],
        },
      ],
    },
  ],
};
