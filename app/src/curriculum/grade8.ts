import type { GradeCurriculum } from "./types";

/**
 * Grade 8 — California Integrated Science.
 * 6 units · 33 topics · 165 subtopics · 26 CA NGSS performance expectations.
 */
export const GRADE_8: GradeCurriculum = {
  grade: 8,
  title: "Integrated Science, Grade 8",
  summary:
    "Forces and motion made quantitative, energy in moving systems, fields acting across " +
    "empty space, waves carrying information, the solar system and deep time, and evolution.",
  units: [
    {
      code: "A", title: "Motion, Forces and Collisions", subject: "physics",
      topics: [
        {
          code: "A1", title: "Describing motion", standards: ["MS-PS2-2"],
          subtopics: [
            { code: "A1.1", title: "Distance vs displacement", sims: ["g8a1-around-the-block"] },
            { code: "A1.2", title: "Speed vs velocity", sims: ["g8a1-size-or-arrow"] },
            { code: "A1.3", title: "Reading a position-time graph", sims: ["g8a1-slope-is-speed"] },
            { code: "A1.4", title: "Reference frames", sims: ["g8a1-who-is-moving"] },
            { code: "A1.5", title: "Calculating average speed", sims: ["g8a1-whole-journey"] },
          ],
        },
        {
          code: "A2", title: "Acceleration and motion graphs", standards: ["MS-PS2-2"],
          subtopics: [
            { code: "A2.1", title: "Acceleration as a rate of change", sims: ["g8a2-how-quickly-changed"] },
            { code: "A2.2", title: "Reading a velocity-time graph", sims: ["g8a2-slope-and-area"] },
            { code: "A2.3", title: "Constant vs changing acceleration", sims: ["g8a2-steady-or-fading"] },
            { code: "A2.4", title: "Deceleration", sims: ["g8a2-thirty-metres-late"] },
            { code: "A2.5", title: "Connecting the two graph types", sims: ["g8a2-two-graphs-one-car"] },
          ],
        },
        {
          code: "A3", title: "Newton's First Law", standards: ["MS-PS2-1"],
          subtopics: [
            { code: "A3.1", title: "Inertia", sims: ["g8a3-fifty-newtons-each"] },
            { code: "A3.2", title: "Balanced vs unbalanced forces", sims: ["g8a3-do-they-cancel"] },
            { code: "A3.3", title: "Free-body diagrams", sims: ["g8a3-every-arrow"] },
            { code: "A3.4", title: "Friction as the reason intuition misleads", sims: ["g8a3-take-friction-away"] },
            { code: "A3.5", title: "Applying the First Law to everyday scenarios", sims: ["g8a3-the-bus-stops"] },
          ],
        },
        {
          code: "A4", title: "Forces, mass and change in motion", standards: ["MS-PS2-2"],
          subtopics: [
            { code: "A4.1", title: "Planning a fair test of force and motion", sims: ["g8a4-three-kinds-of-variable"] },
            { code: "A4.2", title: "The qualitative force-mass-acceleration relationship", sims: ["g8a4-force-over-mass"] },
            { code: "A4.3", title: "Running the investigation", sims: ["g8a4-five-runs"] },
            { code: "A4.4", title: "Comparing prediction to measured data", sims: ["g8a4-why-it-came-up-short"] },
            { code: "A4.5", title: "Communicating investigation results", sims: ["g8a4-writing-it-up"] },
          ],
        },
        {
          code: "A5", title: "Newton's Third Law and collisions", standards: ["MS-PS2-1"],
          subtopics: [
            { code: "A5.1", title: "Action-reaction pairs", sims: ["g8a5-partner-or-not"] },
            { code: "A5.2", title: "Why the pair acts on different objects", sims: ["g8a5-one-force-each"] },
            { code: "A5.3", title: "A common Third Law misconception", sims: ["g8a5-so-nothing-moves"] },
            { code: "A5.4", title: "Applying the law to a collision-safety design", sims: ["g8a5-stretch-the-stop"] },
            { code: "A5.5", title: "Testing the design against criteria", sims: ["g8a5-against-the-limit"] },
          ],
        },
        {
          code: "A6", title: "Engineering a collision solution",
          standards: ["MS-ETS1-1", "MS-ETS1-2"],
          subtopics: [
            { code: "A6.1", title: "Defining criteria and constraints", sims: ["g8a6-must-or-may"] },
            { code: "A6.2", title: "Crumple zones and impulse, conceptually", sims: ["g8a6-longer-to-crush"] },
            { code: "A6.3", title: "Generating candidate solutions", sims: ["g8a6-what-could-work"] },
            { code: "A6.4", title: "Systematic evaluation of designs", sims: ["g8a6-two-noses-scored"] },
            { code: "A6.5", title: "Reporting the best solution and its trade-offs", sims: ["g8a6-the-recommendation"] },
          ],
        },
      ],
    },
    {
      code: "B", title: "Energy in Moving Systems", subject: "physics",
      topics: [
        {
          code: "B1", title: "Kinetic energy", standards: ["MS-PS3-1"],
          subtopics: [
            { code: "B1.1", title: "Kinetic energy and mass", sims: ["g8b1-load-the-trolley"] },
            { code: "B1.2", title: "Kinetic energy and speed", sims: ["g8b1-roll-it-faster"] },
            { code: "B1.3", title: "Why speed has the larger effect", sims: ["g8b1-one-four-nine"] },
            { code: "B1.4", title: "Interpreting the shape of the curve", sims: ["g8b1-reading-the-curve"] },
            { code: "B1.5", title: "Applying kinetic energy to a collision scenario", sims: ["g8b1-thirty-and-sixty"] },
          ],
        },
        {
          code: "B2", title: "Potential energy in a system", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B2.1", title: "Gravitational potential energy", sims: ["g8b2-lift-it-and-hold"] },
            { code: "B2.2", title: "Elastic potential energy", sims: ["g8b2-stretch-and-store"] },
            { code: "B2.3", title: "Potential energy as a property of a system", sims: ["g8b2-whose-energy-is-it"] },
            { code: "B2.4", title: "Modeling potential energy as an arrangement changes", sims: ["g8b2-ten-centimetres-more"] },
            { code: "B2.5", title: "Potential and kinetic energy trading off", sims: ["g8b2-swing-and-trade"] },
          ],
        },
        {
          code: "B3", title: "Energy transfer in a collision", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B3.1", title: "Energy converted, not lost", sims: ["g8b3-two-carts-one-click"] },
            { code: "B3.2", title: "Elastic vs inelastic collisions", sims: ["g8b3-steel-and-clay"] },
            { code: "B3.3", title: "Tracing energy through a crash", sims: ["g8b3-through-the-crash"] },
            { code: "B3.4", title: "Safety design and energy conversion", sims: ["g8b3-buy-yourself-a-metre"] },
            { code: "B3.5", title: "Comparing energy conversion across two collisions", sims: ["g8b3-kept-or-converted"] },
          ],
        },
        {
          code: "B4", title: "Energy conservation across a system", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B4.1", title: "Energy is conserved", sims: ["g8b4-close-the-box"] },
            { code: "B4.2", title: "Tracking energy through a multi-step system", sims: ["g8b4-water-to-wall-socket"] },
            { code: "B4.3", title: "Dissipation as spreading out, not disappearing", sims: ["g8b4-spread-not-gone"] },
            { code: "B4.4", title: "Applying conservation to a bouncing ball", sims: ["g8b4-bounce-after-bounce"] },
            { code: "B4.5", title: "Conservation as a check on a claim", sims: ["g8b4-does-it-add-up"] },
          ],
        },
        {
          code: "B5", title: "Modeling and iterative testing", standards: ["MS-ETS1-4"],
          subtopics: [
            { code: "B5.1", title: "Developing a model to generate data", sims: ["g8b5-build-the-drop-rig"] },
            { code: "B5.2", title: "Running a first round of testing", sims: ["g8b5-round-one"] },
            { code: "B5.3", title: "Modifying the model from test data", sims: ["g8b5-what-the-data-said"] },
            { code: "B5.4", title: "Naming the trade-off in each improvement", sims: ["g8b5-safe-or-small"] },
            { code: "B5.5", title: "A second round of modification", sims: ["g8b5-two-layers"] },
          ],
        },
      ],
    },
    {
      code: "C", title: "Noncontact Forces and Fields", subject: "physics",
      topics: [
        {
          code: "C1", title: "Contact and noncontact forces", standards: ["MS-PS2-3"],
          subtopics: [
            { code: "C1.1", title: "Contact forces", sims: ["phys.forces"] },
            { code: "C1.2", title: "Noncontact forces", sims: ["phys.fields"] },
            { code: "C1.3", title: "Sorting real scenarios", sims: ["phys.fields"] },
            { code: "C1.4", title: "Attraction and repulsion", sims: ["phys.electric-force", "phys.magnetism"] },
            { code: "C1.5", title: "Previewing the field idea", sims: ["phys.fields"] },
          ],
        },
        {
          code: "C2", title: "Electric forces", standards: ["MS-PS2-3"],
          subtopics: [
            { code: "C2.1", title: "Electric charge", sims: ["phys.electric-force"] },
            { code: "C2.2", title: "Asking questions about electric-force data", sims: ["phys.electric-force"] },
            { code: "C2.3", title: "How distance affects the force", sims: ["phys.electric-force"] },
            { code: "C2.4", title: "How charge magnitude affects the force", sims: ["phys.electric-force"] },
            { code: "C2.5", title: "Static electricity and lightning", sims: ["phys.electric-force"] },
          ],
        },
        {
          code: "C3", title: "Magnetic forces and electromagnets", standards: ["MS-PS2-3"],
          subtopics: [
            { code: "C3.1", title: "Magnetic poles", sims: ["phys.magnetism"] },
            { code: "C3.2", title: "Magnetic materials", sims: ["phys.magnetism"] },
            { code: "C3.3", title: "Current produces a magnetic effect", sims: ["phys.magnetism"] },
            { code: "C3.4", title: "Building and varying a simple electromagnet", sims: ["phys.magnetism"] },
            { code: "C3.5", title: "Earth's magnetic field", sims: ["phys.magnetism"] },
          ],
        },
        {
          code: "C4", title: "Gravitational interactions", standards: ["MS-PS2-4"],
          subtopics: [
            { code: "C4.1", title: "Gravity is always attractive", sims: ["phys.gravity"] },
            { code: "C4.2", title: "Gravity depends on mass and distance", sims: ["phys.gravity"] },
            { code: "C4.3", title: "Why everyday gravity goes unnoticed", sims: ["phys.gravity"] },
            { code: "C4.4", title: "Mass vs weight", sims: ["phys.gravity"] },
            { code: "C4.5", title: "Applying the gravity argument to new cases", sims: ["phys.gravity", "space.orbits"] },
          ],
        },
        {
          code: "C5", title: "Fields and action at a distance", standards: ["MS-PS2-5"],
          subtopics: [
            { code: "C5.1", title: "A field as something filling space", sims: ["phys.fields"] },
            { code: "C5.2", title: "Mapping a field", sims: ["phys.fields"] },
            { code: "C5.3", title: "Investigating evidence of fields", sims: ["phys.fields"] },
            { code: "C5.4", title: "Energy transferred across empty space", sims: ["phys.fields"] },
            { code: "C5.5", title: "Fields as the unifying idea", sims: ["phys.fields"] },
          ],
        },
      ],
    },
    {
      code: "D", title: "Waves and Information", subject: "physics",
      topics: [
        {
          code: "D1", title: "Wave properties", standards: ["MS-PS4-1"],
          subtopics: [
            { code: "D1.1", title: "Amplitude, wavelength, frequency and period", sims: ["phys.waves"] },
            { code: "D1.2", title: "Wave speed", sims: ["phys.waves"] },
            { code: "D1.3", title: "Amplitude and the energy a wave carries", sims: ["phys.waves"] },
            { code: "D1.4", title: "Transverse and longitudinal waves", sims: ["phys.waves", "phys.sound"] },
            { code: "D1.5", title: "Modeling wave behavior from data", sims: ["phys.waves"] },
          ],
        },
        {
          code: "D2", title: "Reflection, absorption and transmission", standards: ["MS-PS4-2"],
          subtopics: [
            { code: "D2.1", title: "Three outcomes at a boundary", sims: ["phys.light-matter"] },
            { code: "D2.2", title: "Modeling absorption, reflection and transmission", sims: ["phys.light-matter"] },
            { code: "D2.3", title: "Why an object looks a particular color", sims: ["phys.light-matter"] },
            { code: "D2.4", title: "Refraction, introduced", sims: ["phys.optics", "phys.light-matter"] },
            { code: "D2.5", title: "Reading a wave-material interaction from evidence", sims: ["phys.light-matter"] },
          ],
        },
        {
          code: "D3", title: "Light and the electromagnetic spectrum", standards: ["MS-PS4-2"],
          subtopics: [
            { code: "D3.1", title: "Visible light as one narrow band", sims: ["phys.em-spectrum"] },
            { code: "D3.2", title: "Ordering the spectrum by wavelength and frequency", sims: ["phys.em-spectrum"] },
            { code: "D3.3", title: "A real use of each band", sims: ["phys.em-spectrum"] },
            { code: "D3.4", title: "Why the whole spectrum travels at the same speed in a vacuum", sims: ["phys.em-spectrum"] },
            { code: "D3.5", title: "Comparing energy across the spectrum", sims: ["phys.em-spectrum"] },
          ],
        },
        {
          code: "D4", title: "Sound", standards: ["MS-PS4-1"],
          subtopics: [
            { code: "D4.1", title: "Sound as a longitudinal wave needing a medium", sims: ["phys.sound"] },
            { code: "D4.2", title: "Pitch and loudness", sims: ["phys.sound"] },
            { code: "D4.3", title: "Speed of sound across media", sims: ["phys.sound"] },
            { code: "D4.4", title: "The ear and the range of human hearing", sims: ["phys.sound"] },
            { code: "D4.5", title: "Echo and ultrasound", sims: ["phys.sound"] },
          ],
        },
        {
          code: "D5", title: "Analog and digital signals", standards: ["MS-PS4-3", "MS-ETS1-3"],
          subtopics: [
            { code: "D5.1", title: "How each signal encodes information", sims: ["phys.signals"] },
            { code: "D5.2", title: "Why digitized signals are more reliable", sims: ["phys.signals"] },
            { code: "D5.3", title: "Noise and error correction, conceptually", sims: ["phys.signals"] },
            { code: "D5.4", title: "Analyzing competing communication designs", sims: ["phys.signals"] },
            { code: "D5.5", title: "Integrating a wave-based communication device", sims: ["phys.signals"] },
          ],
        },
      ],
    },
    {
      code: "E", title: "Space Systems and Deep Time", subject: "earth",
      topics: [
        {
          code: "E1", title: "The Earth-Sun-Moon system", standards: ["MS-ESS1-1"],
          subtopics: [
            { code: "E1.1", title: "The lunar cycle", sims: ["earth.moon-phases"] },
            { code: "E1.2", title: "Modeling lunar phases", sims: ["earth.moon-phases"] },
            { code: "E1.3", title: "Solar and lunar eclipses", sims: ["earth.moon-phases"] },
            { code: "E1.4", title: "Why an eclipse does not happen every month", sims: ["earth.moon-phases"] },
            { code: "E1.5", title: "Tides", sims: ["space.tides"] },
          ],
        },
        {
          code: "E2", title: "Seasons", standards: ["MS-ESS1-1"],
          subtopics: [
            { code: "E2.1", title: "Axial tilt as the cause", sims: ["earth.seasons"] },
            { code: "E2.2", title: "Angle of sunlight and day length", sims: ["earth.seasons"] },
            { code: "E2.3", title: "Why the hemispheres are opposite", sims: ["earth.seasons"] },
            { code: "E2.4", title: "Solstices and equinoxes", sims: ["earth.seasons"] },
            { code: "E2.5", title: "Modeling the seasonal cycle", sims: ["earth.seasons"] },
          ],
        },
        {
          code: "E3", title: "Gravity in the solar system and galaxy", standards: ["MS-ESS1-2"],
          subtopics: [
            { code: "E3.1", title: "Gravity holding orbits together", sims: ["space.orbits"] },
            { code: "E3.2", title: "Why an orbiting object neither falls in nor flies off", sims: ["space.orbits"] },
            { code: "E3.3", title: "The Sun's dominant mass", sims: ["space.orbits"] },
            { code: "E3.4", title: "Moons, asteroids and comets", sims: ["space.orbits"] },
            { code: "E3.5", title: "The Milky Way, introduced", sims: ["space.scale"] },
          ],
        },
        {
          code: "E4", title: "The scale of the solar system", standards: ["MS-ESS1-3"],
          subtopics: [
            { code: "E4.1", title: "The astronomical unit", sims: ["space.scale"] },
            { code: "E4.2", title: "Analyzing size and distance data", sims: ["space.scale"] },
            { code: "E4.3", title: "Why a to-scale classroom model is nearly impossible", sims: ["space.scale"] },
            { code: "E4.4", title: "Comparing planetary properties", sims: ["space.scale"] },
            { code: "E4.5", title: "Building a scale representation", sims: ["space.scale"] },
          ],
        },
        {
          code: "E5", title: "Rock strata and the geologic time scale", standards: ["MS-ESS1-4"],
          subtopics: [
            { code: "E5.1", title: "Superposition", sims: ["earth.strata"] },
            { code: "E5.2", title: "Index fossils and unconformities", sims: ["earth.strata"] },
            { code: "E5.3", title: "Reading strata as a record", sims: ["earth.strata"] },
            { code: "E5.4", title: "Eons, eras and periods", sims: ["earth.strata"] },
            { code: "E5.5", title: "Constructing an explanation from strata evidence", sims: ["earth.strata"] },
          ],
        },
        {
          code: "E6", title: "Dating Earth's history", standards: ["MS-ESS1-4"],
          subtopics: [
            { code: "E6.1", title: "Relative vs absolute dating", sims: ["earth.strata", "earth.radiometric"] },
            { code: "E6.2", title: "Radiometric dating, conceptually", sims: ["earth.radiometric"] },
            { code: "E6.3", title: "Combining relative and absolute evidence", sims: ["earth.radiometric"] },
            { code: "E6.4", title: "The 4.6-billion-year figure", sims: ["earth.radiometric"] },
            { code: "E6.5", title: "Evaluating a dating claim", sims: ["earth.radiometric"] },
          ],
        },
      ],
    },
    {
      code: "F", title: "Evolution and Sustaining Biodiversity", subject: "biology",
      topics: [
        {
          code: "F1", title: "Mutations and genetic variation", standards: ["MS-LS3-1"],
          subtopics: [
            { code: "F1.1", title: "A mutation as a change to genetic information", sims: ["bio.mutations"] },
            { code: "F1.2", title: "Beneficial, harmful and neutral outcomes", sims: ["bio.mutations"] },
            { code: "F1.3", title: "Why most mutations are neutral", sims: ["bio.mutations"] },
            { code: "F1.4", title: "Mutation as the ultimate source of variation", sims: ["bio.mutations", "bio.natural-selection"] },
            { code: "F1.5", title: "Tracing a trait to a mutation", sims: ["bio.mutations"] },
          ],
        },
        {
          code: "F2", title: "Fossil evidence of change over time", standards: ["MS-LS4-1"],
          subtopics: [
            { code: "F2.1", title: "How a fossil forms", sims: ["earth.strata"] },
            { code: "F2.2", title: "Order of appearance and extinction", sims: ["bio.fossil-record"] },
            { code: "F2.3", title: "Transitional forms", sims: ["bio.fossil-record"] },
            { code: "F2.4", title: "Placing fossils on the time scale", sims: ["bio.fossil-record", "earth.strata"] },
            { code: "F2.5", title: "Analyzing fossil-record data", sims: ["bio.fossil-record"] },
          ],
        },
        {
          code: "F3", title: "Anatomical and embryological evidence",
          standards: ["MS-LS4-2", "MS-LS4-3"],
          subtopics: [
            { code: "F3.1", title: "Homologous structures", sims: ["bio.homology"] },
            { code: "F3.2", title: "Analogous and vestigial structures", sims: ["bio.homology"] },
            { code: "F3.3", title: "Shared ancestry vs convergence", sims: ["bio.homology"] },
            { code: "F3.4", title: "Comparing early development across species", sims: ["bio.homology"] },
            { code: "F3.5", title: "Inferring evolutionary relationships", sims: ["bio.homology"] },
          ],
        },
        {
          code: "F4", title: "Natural selection", standards: ["MS-LS4-4"],
          subtopics: [
            { code: "F4.1", title: "Variation, survival and heritability", sims: ["bio.natural-selection"] },
            { code: "F4.2", title: "A fully worked real case", sims: ["bio.natural-selection"] },
            { code: "F4.3", title: "Differential survival and reproduction", sims: ["bio.natural-selection"] },
            { code: "F4.4", title: "Selection acts on populations, never on an individual's lifetime", sims: ["bio.natural-selection"] },
            { code: "F4.5", title: "Constructing an evidence-based explanation", sims: ["bio.natural-selection"] },
          ],
        },
        {
          code: "F5", title: "Artificial selection and adaptation over time",
          standards: ["MS-LS4-5", "MS-LS4-6"],
          subtopics: [
            { code: "F5.1", title: "Selective breeding", sims: ["bio.artificial-selection"] },
            { code: "F5.2", title: "The same mechanism, a human selector", sims: ["bio.artificial-selection"] },
            { code: "F5.3", title: "Technologies influencing inheritance", sims: ["bio.artificial-selection"] },
            { code: "F5.4", title: "Tracking a trait's proportion across generations", sims: ["bio.artificial-selection", "bio.natural-selection"] },
            { code: "F5.5", title: "Predicting a population's future trait proportions", sims: ["bio.natural-selection"] },
          ],
        },
        {
          code: "F6", title: "Human population, consumption and impact", standards: ["MS-ESS3-4"],
          subtopics: [
            { code: "F6.1", title: "Population growth as one multiplier", sims: ["bio.human-impact"] },
            { code: "F6.2", title: "Per-capita consumption as the other multiplier", sims: ["bio.human-impact"] },
            { code: "F6.3", title: "Constructing an argument from real data", sims: ["bio.human-impact"] },
            { code: "F6.4", title: "Impact on biodiversity specifically", sims: ["bio.human-impact", "bio.ecosystem"] },
            { code: "F6.5", title: "Presenting management options with trade-offs", sims: ["bio.human-impact"] },
          ],
        },
      ],
    },
  ],
};
