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
            { code: "A1.1", title: "Reviewing the particle model", sims: ["g7a1-three-arrangements"] },
            { code: "A1.2", title: "Why chemistry needs a sharper picture", sims: ["g7a1-when-spheres-fail"] },
            { code: "A1.3", title: "Evidence that particles are real", sims: ["g7a1-jiggling-grain"] },
            { code: "A1.4", title: "Particles versus atoms", sims: ["g7a1-one-piece-of-water"] },
            { code: "A1.5", title: "Scale of the atom", sims: ["g7a1-down-to-the-atom"] },
          ],
        },
        {
          code: "A2", title: "Inside the atom", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A2.1", title: "Protons, neutrons and electrons", sims: ["g7a2-three-particles"] },
            { code: "A2.2", title: "Atomic number defines the element", sims: ["g7a2-protons-decide"] },
            { code: "A2.3", title: "Mass number and isotopes", sims: ["g7a2-same-element"] },
            { code: "A2.4", title: "Building the model — early evidence", sims: ["g7a2-through-the-foil"] },
            { code: "A2.5", title: "Building the model — from shells to a cloud", sims: ["g7a2-shells-to-cloud"] },
            { code: "A2.6", title: "Why the model kept changing", sims: ["g7a2-two-models"] },
          ],
        },
        {
          code: "A3", title: "Elements and the periodic table", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A3.1", title: "Reading a cell of the periodic table", sims: ["g7a3-reading-a-cell"] },
            { code: "A3.2", title: "Groups and periods", sims: ["g7a3-the-sawtooth"] },
            { code: "A3.3", title: "Metals, non-metals and metalloids", sims: ["g7a3-three-families"] },
            { code: "A3.4", title: "Why the table is organized this way", sims: ["g7a3-the-gaps"] },
            { code: "A3.5", title: "Reactivity patterns across the table", sims: ["g7a3-down-the-group"] },
          ],
        },
        {
          code: "A4", title: "Molecules, compounds and formulas", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A4.1", title: "Element, compound and mixture", sims: ["g7a4-fixed-or-free"] },
            { code: "A4.2", title: "Reading a chemical formula", sims: ["g7a4-what-ch4-says"] },
            { code: "A4.3", title: "Subscripts versus coefficients", sims: ["g7a4-two-or-twice"] },
            { code: "A4.4", title: "Counting atoms in a formula", sims: ["g7a4-inside-brackets"] },
            { code: "A4.5", title: "Modeling a molecule from its formula", sims: ["g7a4-build-a-water"] },
          ],
        },
        {
          code: "A5", title: "Modeling extended structures", standards: ["MS-PS1-1"],
          subtopics: [
            { code: "A5.1", title: "Ball-and-stick models", sims: ["g7a5-balls-and-sticks"] },
            { code: "A5.2", title: "Space-filling models", sims: ["g7a5-swell-them-up"] },
            { code: "A5.3", title: "When there is no single molecule", sims: ["g7a5-no-single-molecule"] },
            { code: "A5.4", title: "Comparing molecular and lattice structures", sims: ["g7a5-melting-two-ways"] },
            { code: "A5.5", title: "Choosing the right model for the job", sims: ["g7a5-right-model"] },
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
            { code: "B1.1", title: "Physical changes", sims: ["g7b1-same-molecule-new-form"] },
            { code: "B1.2", title: "Chemical changes", sims: ["g7b1-atoms-rearranged"] },
            { code: "B1.3", title: "Cases that are easy to confuse", sims: ["g7b1-easy-to-confuse"] },
            { code: "B1.4", title: "Properties before and after", sims: ["g7b1-before-and-after"] },
            { code: "B1.5", title: "Reversibility as a clue, not a rule", sims: ["g7b1-putting-it-back"] },
          ],
        },
        {
          code: "B2", title: "Evidence that a reaction happened", standards: ["MS-PS1-2"],
          subtopics: [
            { code: "B2.1", title: "Signs a reaction may have occurred", sims: ["g7b2-build-the-evidence"] },
            { code: "B2.2", title: "Analyzing property data before and after", sims: ["g7b2-mass-that-left"] },
            { code: "B2.3", title: "Identifying an unknown from a property table", sims: ["g7b2-the-white-powder"] },
            { code: "B2.4", title: "Why appearance alone is not proof", sims: ["g7b2-looks-can-lie"] },
            { code: "B2.5", title: "Naming a reaction from what goes in and comes out", sims: ["g7b2-name-that-reaction"] },
          ],
        },
        {
          code: "B3", title: "Conservation of mass", standards: ["MS-PS1-5"],
          subtopics: [
            { code: "B3.1", title: "Mass before and after, in a closed container", sims: ["g7b3-sealed-and-weighed"] },
            { code: "B3.2", title: "Mass before and after, in an open container", sims: ["g7b3-stopper-on-stopper-off"] },
            { code: "B3.3", title: "Atom-counting diagrams", sims: ["g7b3-count-both-sides"] },
            { code: "B3.4", title: "Why mass conservation follows from atom conservation", sims: ["g7b3-nowhere-to-go"] },
            { code: "B3.5", title: "Applying conservation to an unfamiliar reaction", sims: ["g7b3-could-that-be-right"] },
          ],
        },
        {
          code: "B4", title: "Thermal energy, particles and states", standards: ["MS-PS1-4"],
          subtopics: [
            { code: "B4.1", title: "Energy added and particle motion, revisited", sims: ["g7b4-how-fast-are-they"] },
            { code: "B4.2", title: "Forces between particles", sims: ["g7b4-how-hard-to-pull-apart"] },
            { code: "B4.3", title: "Reading a heating curve", sims: ["g7b4-the-flat-parts"] },
            { code: "B4.4", title: "Why temperature plateaus during a state change", sims: ["g7b4-stuck-at-a-hundred"] },
            { code: "B4.5", title: "Predicting a heating curve for a new substance", sims: ["g7b4-the-other-liquid"] },
          ],
        },
        {
          code: "B5", title: "Synthetic materials from natural resources", standards: ["MS-PS1-3"],
          subtopics: [
            { code: "B5.1", title: "Petroleum and plastics", sims: ["g7b5-oil-to-bag"] },
            { code: "B5.2", title: "Ores and alloys", sims: ["g7b5-rock-to-girder"] },
            { code: "B5.3", title: "Medicines and synthetic fibers", sims: ["g7b5-where-did-it-start"] },
            { code: "B5.4", title: "Benefit and cost of a synthetic material", sims: ["g7b5-the-bottle-bargain"] },
            { code: "B5.5", title: "Comparing a natural and synthetic alternative", sims: ["g7b5-two-shirts"] },
          ],
        },
        {
          code: "B6", title: "Designing a thermal energy device", standards: ["MS-PS1-6"],
          subtopics: [
            { code: "B6.1", title: "Criteria and constraints", sims: ["g7b6-target-or-limit"] },
            { code: "B6.2", title: "Choosing a chemical process", sims: ["g7b6-warm-pack-cold-pack"] },
            { code: "B6.3", title: "Collecting temperature data", sims: ["g7b6-how-hot-does-it-get"] },
            { code: "B6.4", title: "Modifying the design", sims: ["g7b6-holding-the-heat"] },
            { code: "B6.5", title: "Reporting the final design", sims: ["g7b6-the-write-up"] },
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
            { code: "C1.1", title: "Naming the inputs", sims: ["g7c1-what-goes-in"] },
            { code: "C1.2", title: "Naming the outputs", sims: ["g7c1-what-comes-out"] },
            { code: "C1.3", title: "Where in the cell this happens", sims: ["g7c1-inside-a-chloroplast"] },
            { code: "C1.4", title: "Photosynthesis as atoms rearranged", sims: ["g7c1-same-atoms-new-arrangement"] },
            { code: "C1.5", title: "Conditions that affect the rate", sims: ["g7c1-counting-bubbles"] },
          ],
        },
        {
          code: "C2", title: "Evidence for where a plant's mass comes from", standards: ["MS-LS1-6"],
          subtopics: [
            { code: "C2.1", title: "The intuitive but wrong answer", sims: ["g7c2-soil-or-air"] },
            { code: "C2.2", title: "Van Helmont's willow tree experiment", sims: ["g7c2-five-year-willow"] },
            { code: "C2.3", title: "What the soil-mass evidence actually shows", sims: ["g7c2-fifty-seven-grams"] },
            { code: "C2.4", title: "Building the case for air and water", sims: ["g7c2-weighing-the-wood"] },
            { code: "C2.5", title: "Evaluating, not asserting, the conclusion", sims: ["g7c2-shown-or-assumed"] },
          ],
        },
        {
          code: "C3", title: "Cellular respiration", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C3.1", title: "Naming the inputs", sims: ["g7c3-how-much-air"] },
            { code: "C3.2", title: "Naming the outputs", sims: ["g7c3-three-tests"] },
            { code: "C3.3", title: "Where in the cell this happens", sims: ["g7c3-inside-a-mitochondrion"] },
            { code: "C3.4", title: "Comparing photosynthesis and respiration side by side", sims: ["g7c3-two-organelles"] },
            { code: "C3.5", title: "Respiration in plants and animals alike", sims: ["g7c3-a-leaf-all-day"] },
          ],
        },
        {
          code: "C4", title: "Food molecules rearranged", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C4.1", title: "Modeling a food molecule broken down", sims: ["g7c4-one-spoonful"] },
            { code: "C4.2", title: "Modeling the atoms rearranged into products", sims: ["g7c4-atom-inventory"] },
            { code: "C4.3", title: "Energy released, not created", sims: ["g7c4-bonds-cost-bonds-pay"] },
            { code: "C4.4", title: "Comparing respiration to a familiar reaction", sims: ["g7c4-flame-or-cell"] },
            { code: "C4.5", title: "Applying the model to an unfamiliar food molecule", sims: ["g7c4-a-different-fuel"] },
          ],
        },
        {
          code: "C5", title: "Tracing carbon through an organism", standards: ["MS-LS1-7"],
          subtopics: [
            { code: "C5.1", title: "A carbon atom enters a plant", sims: ["g7c5-into-the-leaf"] },
            { code: "C5.2", title: "A carbon atom moves into an animal", sims: ["g7c5-eaten"] },
            { code: "C5.3", title: "A carbon atom returns to the air", sims: ["g7c5-back-to-the-air"] },
            { code: "C5.4", title: "Photosynthesis and respiration as linked opposite processes", sims: ["g7c5-which-process"] },
            { code: "C5.5", title: "Why plants run both processes", sims: ["g7c5-why-both"] },
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
            { code: "D1.1", title: "Limiting resources", sims: ["g7d1-runs-out-first"] },
            { code: "D1.2", title: "Carrying capacity", sims: ["g7d1-where-it-levels"] },
            { code: "D1.3", title: "Reading real population data", sims: ["g7d1-st-matthew"] },
            { code: "D1.4", title: "Predicting the response to scarcity", sims: ["g7d1-the-dry-summer"] },
            { code: "D1.5", title: "Competition for the same limiting resource", sims: ["g7d1-same-food-bowl"] },
          ],
        },
        {
          code: "D2", title: "Food webs and energy flow", standards: ["MS-LS2-3"],
          subtopics: [
            { code: "D2.1", title: "Producers, consumers and decomposers", sims: ["g7d2-three-jobs"] },
            { code: "D2.2", title: "From food chain to food web", sims: ["g7d2-build-the-web"] },
            { code: "D2.3", title: "Trophic levels", sims: ["g7d2-five-floors"] },
            { code: "D2.4", title: "Why energy decreases at each level", sims: ["g7d2-tenth-of-a-tenth"] },
            { code: "D2.5", title: "Reading an energy pyramid", sims: ["g7d2-silver-springs"] },
          ],
        },
        {
          code: "D3", title: "Cycling matter through an ecosystem", standards: ["MS-LS2-3"],
          subtopics: [
            { code: "D3.1", title: "Matter cycling between organisms and the environment", sims: ["g7d3-one-carbon-atom"] },
            { code: "D3.2", title: "Decomposers closing the loop", sims: ["g7d3-litter-bag"] },
            { code: "D3.3", title: "The carbon cycle, introduced", sims: ["g7d3-fast-and-slow"] },
            { code: "D3.4", title: "The nitrogen cycle, introduced", sims: ["g7d3-breaking-n2"] },
            { code: "D3.5", title: "Modeling matter and energy together", sims: ["g7d3-cycles-and-flows"] },
          ],
        },
        {
          code: "D4", title: "Patterns of interaction among organisms", standards: ["MS-LS2-2"],
          subtopics: [
            { code: "D4.1", title: "Competition and predation", sims: ["g7d4-wolves-and-moose"] },
            { code: "D4.2", title: "Mutualism, commensalism and parasitism", sims: ["g7d4-who-gains"] },
            { code: "D4.3", title: "The same pattern in very different ecosystems", sims: ["g7d4-same-deal-twice"] },
            { code: "D4.4", title: "Interactions that shift over time or condition", sims: ["g7d4-when-it-turns"] },
            { code: "D4.5", title: "Interaction patterns and population change", sims: ["g7d4-ten-year-rhythm"] },
          ],
        },
        {
          code: "D5", title: "Ecosystem disruption and change", standards: ["MS-LS2-4"],
          subtopics: [
            { code: "D5.1", title: "Physical disruptions", sims: ["g7d5-how-long-to-heal"] },
            { code: "D5.2", title: "Biological disruptions", sims: ["g7d5-mussel-arithmetic"] },
            { code: "D5.3", title: "Constructing an argument from evidence", sims: ["g7d5-what-took-the-cod"] },
            { code: "D5.4", title: "Succession after a disruption", sims: ["g7d5-glacier-bay"] },
            { code: "D5.5", title: "Short-term versus long-term change", sims: ["g7d5-hubbard-brook"] },
          ],
        },
        {
          code: "D6", title: "Biodiversity and ecosystem services", standards: ["MS-LS2-5"],
          subtopics: [
            { code: "D6.1", title: "Naming ecosystem services", sims: ["g7d6-what-it-does-for-us"] },
            { code: "D6.2", title: "Threats to biodiversity", sims: ["g7d6-half-the-forest"] },
            { code: "D6.3", title: "Named solution categories", sims: ["g7d6-five-kinds-of-fix"] },
            { code: "D6.4", title: "Evaluating competing solutions", sims: ["g7d6-dam-or-ladder"] },
            { code: "D6.5", title: "A biodiversity solution for a real ecosystem", sims: ["g7d6-fourteen-wolves"] },
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
            { code: "E1.1", title: "Igneous rock", sims: ["g7e1-slow-cool-big-crystals"] },
            { code: "E1.2", title: "Sedimentary rock", sims: ["g7e1-grain-to-stone"] },
            { code: "E1.3", title: "Metamorphic rock", sims: ["g7e1-squeezed-not-melted"] },
            { code: "E1.4", title: "Identifying a sample from evidence", sims: ["g7e1-name-that-rock"] },
            { code: "E1.5", title: "The energy that drives the cycle", sims: ["g7e1-two-engines"] },
          ],
        },
        {
          code: "E2", title: "Weathering, erosion and deposition", standards: ["MS-ESS2-2"],
          subtopics: [
            { code: "E2.1", title: "Physical weathering", sims: ["g7e2-break-it-smaller"] },
            { code: "E2.2", title: "Chemical weathering", sims: ["g7e2-rain-is-an-acid"] },
            { code: "E2.3", title: "Agents of erosion", sims: ["g7e2-who-moved-it"] },
            { code: "E2.4", title: "Where sediment ends up", sims: ["g7e2-how-far-before-it-settles"] },
            { code: "E2.5", title: "Soil formation", sims: ["g7e2-making-soil"] },
          ],
        },
        {
          code: "E3", title: "Geoscience processes across time and scale", standards: ["MS-ESS2-2"],
          subtopics: [
            { code: "E3.1", title: "Fast processes", sims: ["g7e3-one-morning-in-may"] },
            { code: "E3.2", title: "Slow processes", sims: ["g7e3-millimetres-add-up"] },
            { code: "E3.3", title: "Constructing an explanation from rock layers", sims: ["g7e3-read-the-column"] },
            { code: "E3.4", title: "Combining fast and slow in one explanation", sims: ["g7e3-slow-then-sudden"] },
            { code: "E3.5", title: "Spatial scale, from outcrop to continent", sims: ["g7e3-zoom-out"] },
          ],
        },
        {
          code: "E4", title: "Evidence for plate motion", standards: ["MS-ESS2-3"],
          subtopics: [
            { code: "E4.1", title: "Matching coastlines and rock types", sims: ["g7e4-put-it-back-together"] },
            { code: "E4.2", title: "Matching fossil distributions", sims: ["g7e4-could-it-have-swum"] },
            { code: "E4.3", title: "Seafloor age and magnetic striping", sims: ["g7e4-stripes-and-ages"] },
            { code: "E4.4", title: "Analyzing plate motion data", sims: ["g7e4-measured-by-satellite"] },
            { code: "E4.5", title: "Reconstructing a simplified history", sims: ["g7e4-opening-an-ocean"] },
          ],
        },
        {
          code: "E5", title: "Plate boundaries and the landforms they build", standards: ["MS-ESS2-3"],
          subtopics: [
            { code: "E5.1", title: "Divergent boundaries", sims: ["g7e5-tearing-a-continent"] },
            { code: "E5.2", title: "Convergent boundaries", sims: ["g7e5-going-under"] },
            { code: "E5.3", title: "Transform boundaries", sims: ["g7e5-stuck-then-slipping"] },
            { code: "E5.4", title: "Why hazards cluster at boundaries", sims: ["g7e5-why-here"] },
            { code: "E5.5", title: "Reading a plate-boundary map", sims: ["g7e5-name-the-boundary"] },
          ],
        },
        {
          code: "E6", title: "The uneven distribution of Earth's resources", standards: ["MS-ESS3-1"],
          subtopics: [
            { code: "E6.1", title: "Mineral resources", sims: ["g7e6-how-it-got-concentrated"] },
            { code: "E6.2", title: "Energy resources", sims: ["g7e6-per-kilogram"] },
            { code: "E6.3", title: "Groundwater as a resource", sims: ["g7e6-how-fast-does-it-flow"] },
            { code: "E6.4", title: "Renewable versus nonrenewable resources", sims: ["g7e6-a-tankful-of-sunlight"] },
            { code: "E6.5", title: "Constructing an explanation for resource distribution", sims: ["g7e6-copper-under-the-andes"] },
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
            { code: "F1.1", title: "Geologic hazards", sims: ["g7f1-what-drives-it"] },
            { code: "F1.2", title: "Weather-driven hazards", sims: ["g7f1-river-in-the-sky"] },
            { code: "F1.3", title: "Tsunamis as a linked hazard", sims: ["g7f1-across-the-pacific"] },
            { code: "F1.4", title: "California's own hazard profile", sims: ["g7f1-the-golden-state"] },
            { code: "F1.5", title: "A hazard's reach and duration", sims: ["g7f1-how-far-how-long"] },
          ],
        },
        {
          code: "F2", title: "Forecasting from hazard data", standards: ["MS-ESS3-2"],
          subtopics: [
            { code: "F2.1", title: "Frequency and location of past events", sims: ["g7f2-ten-times-rarer"] },
            { code: "F2.2", title: "Probability, not certainty", sims: ["g7f2-the-hundred-year"] },
            { code: "F2.3", title: "Reading a hazard map", sims: ["g7f2-which-zone"] },
            { code: "F2.4", title: "Early warning systems", sims: ["g7f2-beat-the-s-wave"] },
            { code: "F2.5", title: "Using data to forecast and inform mitigation", sims: ["g7f2-data-to-decision"] },
          ],
        },
        {
          code: "F3", title: "Defining a mitigation problem", standards: ["MS-ETS1-1"],
          subtopics: [
            { code: "F3.1", title: "From vague want to measurable target", sims: ["g7f3-wish-or-target"] },
            { code: "F3.2", title: "Criteria versus constraints", sims: ["g7f3-pull-and-fence"] },
            { code: "F3.3", title: "Who the solution must protect", sims: ["g7f3-who-is-inside"] },
            { code: "F3.4", title: "Trade-offs already visible in the problem statement", sims: ["g7f3-softer-but-wider"] },
            { code: "F3.5", title: "Defining a real mitigation problem", sims: ["g7f3-writing-the-brief"] },
          ],
        },
        {
          code: "F4", title: "Evaluating competing solutions", standards: ["MS-ETS1-2", "MS-ETS1-3"],
          subtopics: [
            { code: "F4.1", title: "Generating more than one candidate", sims: ["g7f4-three-ways-to-win"] },
            { code: "F4.2", title: "A systematic scoring process", sims: ["g7f4-what-do-you-value"] },
            { code: "F4.3", title: "Analyzing test data across designs", sims: ["g7f4-same-table-two-runs"] },
            { code: "F4.4", title: "Combining the best characteristics of each", sims: ["g7f4-best-of-each"] },
            { code: "F4.5", title: "Presenting a recommendation with evidence", sims: ["g7f4-making-the-case"] },
          ],
        },
        {
          code: "F5", title: "Iterative testing and optimization", standards: ["MS-ETS1-4"],
          subtopics: [
            { code: "F5.1", title: "Developing a model to generate data", sims: ["g7f5-shrink-it-properly"] },
            { code: "F5.2", title: "A first round of testing", sims: ["g7f5-find-the-peak"] },
            { code: "F5.3", title: "Modifying and retesting", sims: ["g7f5-round-one-round-two"] },
            { code: "F5.4", title: "Naming the trade-off in each improvement", sims: ["g7f5-what-did-it-cost"] },
            { code: "F5.5", title: "Converging on an optimized design", sims: ["g7f5-when-to-stop"] },
          ],
        },
      ],
    },
  ],
};
