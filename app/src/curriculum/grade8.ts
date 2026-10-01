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
            { code: "A1.1", title: "Distance vs displacement", sims: [] },
            { code: "A1.2", title: "Speed vs velocity", sims: [] },
            { code: "A1.3", title: "Reading a position-time graph", sims: [] },
            { code: "A1.4", title: "Reference frames", sims: [] },
            { code: "A1.5", title: "Calculating average speed", sims: [] },
          ],
        },
        {
          code: "A2", title: "Acceleration and motion graphs", standards: ["MS-PS2-2"],
          subtopics: [
            { code: "A2.1", title: "Acceleration as a rate of change", sims: [] },
            { code: "A2.2", title: "Reading a velocity-time graph", sims: [] },
            { code: "A2.3", title: "Constant vs changing acceleration", sims: [] },
            { code: "A2.4", title: "Deceleration", sims: [] },
            { code: "A2.5", title: "Connecting the two graph types", sims: [] },
          ],
        },
        {
          code: "A3", title: "Newton's First Law", standards: ["MS-PS2-1"],
          subtopics: [
            { code: "A3.1", title: "Inertia", sims: [] },
            { code: "A3.2", title: "Balanced vs unbalanced forces", sims: [] },
            { code: "A3.3", title: "Free-body diagrams", sims: [] },
            { code: "A3.4", title: "Friction as the reason intuition misleads", sims: [] },
            { code: "A3.5", title: "Applying the First Law to everyday scenarios", sims: [] },
          ],
        },
        {
          code: "A4", title: "Forces, mass and change in motion", standards: ["MS-PS2-2"],
          subtopics: [
            { code: "A4.1", title: "Planning a fair test of force and motion", sims: [] },
            { code: "A4.2", title: "The qualitative force-mass-acceleration relationship", sims: [] },
            { code: "A4.3", title: "Running the investigation", sims: [] },
            { code: "A4.4", title: "Comparing prediction to measured data", sims: [] },
            { code: "A4.5", title: "Communicating investigation results", sims: [] },
          ],
        },
        {
          code: "A5", title: "Newton's Third Law and collisions", standards: ["MS-PS2-1"],
          subtopics: [
            { code: "A5.1", title: "Action-reaction pairs", sims: [] },
            { code: "A5.2", title: "Why the pair acts on different objects", sims: [] },
            { code: "A5.3", title: "A common Third Law misconception", sims: [] },
            { code: "A5.4", title: "Applying the law to a collision-safety design", sims: [] },
            { code: "A5.5", title: "Testing the design against criteria", sims: [] },
          ],
        },
        {
          code: "A6", title: "Engineering a collision solution",
          standards: ["MS-ETS1-1", "MS-ETS1-2"],
          subtopics: [
            { code: "A6.1", title: "Defining criteria and constraints", sims: [] },
            { code: "A6.2", title: "Crumple zones and impulse, conceptually", sims: [] },
            { code: "A6.3", title: "Generating candidate solutions", sims: [] },
            { code: "A6.4", title: "Systematic evaluation of designs", sims: [] },
            { code: "A6.5", title: "Reporting the best solution and its trade-offs", sims: [] },
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
            { code: "B1.1", title: "Kinetic energy and mass", sims: [] },
            { code: "B1.2", title: "Kinetic energy and speed", sims: [] },
            { code: "B1.3", title: "Why speed has the larger effect", sims: [] },
            { code: "B1.4", title: "Interpreting the shape of the curve", sims: [] },
            { code: "B1.5", title: "Applying kinetic energy to a collision scenario", sims: [] },
          ],
        },
        {
          code: "B2", title: "Potential energy in a system", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B2.1", title: "Gravitational potential energy", sims: [] },
            { code: "B2.2", title: "Elastic potential energy", sims: [] },
            { code: "B2.3", title: "Potential energy as a property of a system", sims: [] },
            { code: "B2.4", title: "Modeling potential energy as an arrangement changes", sims: [] },
            { code: "B2.5", title: "Potential and kinetic energy trading off", sims: [] },
          ],
        },
        {
          code: "B3", title: "Energy transfer in a collision", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B3.1", title: "Energy converted, not lost", sims: [] },
            { code: "B3.2", title: "Elastic vs inelastic collisions", sims: [] },
            { code: "B3.3", title: "Tracing energy through a crash", sims: [] },
            { code: "B3.4", title: "Safety design and energy conversion", sims: [] },
            { code: "B3.5", title: "Comparing energy conversion across two collisions", sims: [] },
          ],
        },
        {
          code: "B4", title: "Energy conservation across a system", standards: ["MS-PS3-2"],
          subtopics: [
            { code: "B4.1", title: "Energy is conserved", sims: [] },
            { code: "B4.2", title: "Tracking energy through a multi-step system", sims: [] },
            { code: "B4.3", title: "Dissipation as spreading out, not disappearing", sims: [] },
            { code: "B4.4", title: "Applying conservation to a bouncing ball", sims: [] },
            { code: "B4.5", title: "Conservation as a check on a claim", sims: [] },
          ],
        },
        {
          code: "B5", title: "Modeling and iterative testing", standards: ["MS-ETS1-4"],
          subtopics: [
            { code: "B5.1", title: "Developing a model to generate data", sims: [] },
            { code: "B5.2", title: "Running a first round of testing", sims: [] },
            { code: "B5.3", title: "Modifying the model from test data", sims: [] },
            { code: "B5.4", title: "Naming the trade-off in each improvement", sims: [] },
            { code: "B5.5", title: "A second round of modification", sims: [] },
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
            { code: "C1.1", title: "Contact forces", sims: [] },
            { code: "C1.2", title: "Noncontact forces", sims: [] },
            { code: "C1.3", title: "Sorting real scenarios", sims: [] },
            { code: "C1.4", title: "Attraction and repulsion", sims: [] },
            { code: "C1.5", title: "Previewing the field idea", sims: [] },
          ],
        },
        {
          code: "C2", title: "Electric forces", standards: ["MS-PS2-3"],
          subtopics: [
            { code: "C2.1", title: "Electric charge", sims: [] },
            { code: "C2.2", title: "Asking questions about electric-force data", sims: [] },
            { code: "C2.3", title: "How distance affects the force", sims: [] },
            { code: "C2.4", title: "How charge magnitude affects the force", sims: [] },
            { code: "C2.5", title: "Static electricity and lightning", sims: [] },
          ],
        },
        {
          code: "C3", title: "Magnetic forces and electromagnets", standards: ["MS-PS2-3"],
          subtopics: [
            { code: "C3.1", title: "Magnetic poles", sims: [] },
            { code: "C3.2", title: "Magnetic materials", sims: [] },
            { code: "C3.3", title: "Current produces a magnetic effect", sims: [] },
            { code: "C3.4", title: "Building and varying a simple electromagnet", sims: [] },
            { code: "C3.5", title: "Earth's magnetic field", sims: [] },
          ],
        },
        {
          code: "C4", title: "Gravitational interactions", standards: ["MS-PS2-4"],
          subtopics: [
            { code: "C4.1", title: "Gravity is always attractive", sims: [] },
            { code: "C4.2", title: "Gravity depends on mass and distance", sims: [] },
            { code: "C4.3", title: "Why everyday gravity goes unnoticed", sims: [] },
            { code: "C4.4", title: "Mass vs weight", sims: [] },
            { code: "C4.5", title: "Applying the gravity argument to new cases", sims: [] },
          ],
        },
        {
          code: "C5", title: "Fields and action at a distance", standards: ["MS-PS2-5"],
          subtopics: [
            { code: "C5.1", title: "A field as something filling space", sims: [] },
            { code: "C5.2", title: "Mapping a field", sims: [] },
            { code: "C5.3", title: "Investigating evidence of fields", sims: [] },
            { code: "C5.4", title: "Energy transferred across empty space", sims: [] },
            { code: "C5.5", title: "Fields as the unifying idea", sims: [] },
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
            { code: "D1.1", title: "Amplitude, wavelength, frequency and period", sims: [] },
            { code: "D1.2", title: "Wave speed", sims: [] },
            { code: "D1.3", title: "Amplitude and the energy a wave carries", sims: [] },
            { code: "D1.4", title: "Transverse and longitudinal waves", sims: [] },
            { code: "D1.5", title: "Modeling wave behavior from data", sims: [] },
          ],
        },
        {
          code: "D2", title: "Reflection, absorption and transmission", standards: ["MS-PS4-2"],
          subtopics: [
            { code: "D2.1", title: "Three outcomes at a boundary", sims: [] },
            { code: "D2.2", title: "Modeling absorption, reflection and transmission", sims: [] },
            { code: "D2.3", title: "Why an object looks a particular color", sims: [] },
            { code: "D2.4", title: "Refraction, introduced", sims: [] },
            { code: "D2.5", title: "Reading a wave-material interaction from evidence", sims: [] },
          ],
        },
        {
          code: "D3", title: "Light and the electromagnetic spectrum", standards: ["MS-PS4-2"],
          subtopics: [
            { code: "D3.1", title: "Visible light as one narrow band", sims: [] },
            { code: "D3.2", title: "Ordering the spectrum by wavelength and frequency", sims: [] },
            { code: "D3.3", title: "A real use of each band", sims: [] },
            { code: "D3.4", title: "Why the whole spectrum travels at the same speed in a vacuum", sims: [] },
            { code: "D3.5", title: "Comparing energy across the spectrum", sims: [] },
          ],
        },
        {
          code: "D4", title: "Sound", standards: ["MS-PS4-1"],
          subtopics: [
            { code: "D4.1", title: "Sound as a longitudinal wave needing a medium", sims: [] },
            { code: "D4.2", title: "Pitch and loudness", sims: [] },
            { code: "D4.3", title: "Speed of sound across media", sims: [] },
            { code: "D4.4", title: "The ear and the range of human hearing", sims: [] },
            { code: "D4.5", title: "Echo and ultrasound", sims: [] },
          ],
        },
        {
          code: "D5", title: "Analog and digital signals", standards: ["MS-PS4-3", "MS-ETS1-3"],
          subtopics: [
            { code: "D5.1", title: "How each signal encodes information", sims: [] },
            { code: "D5.2", title: "Why digitized signals are more reliable", sims: [] },
            { code: "D5.3", title: "Noise and error correction, conceptually", sims: [] },
            { code: "D5.4", title: "Analyzing competing communication designs", sims: [] },
            { code: "D5.5", title: "Integrating a wave-based communication device", sims: [] },
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
            { code: "E1.1", title: "The lunar cycle", sims: [] },
            { code: "E1.2", title: "Modeling lunar phases", sims: [] },
            { code: "E1.3", title: "Solar and lunar eclipses", sims: [] },
            { code: "E1.4", title: "Why an eclipse does not happen every month", sims: [] },
            { code: "E1.5", title: "Tides", sims: [] },
          ],
        },
        {
          code: "E2", title: "Seasons", standards: ["MS-ESS1-1"],
          subtopics: [
            { code: "E2.1", title: "Axial tilt as the cause", sims: [] },
            { code: "E2.2", title: "Angle of sunlight and day length", sims: [] },
            { code: "E2.3", title: "Why the hemispheres are opposite", sims: [] },
            { code: "E2.4", title: "Solstices and equinoxes", sims: [] },
            { code: "E2.5", title: "Modeling the seasonal cycle", sims: [] },
          ],
        },
        {
          code: "E3", title: "Gravity in the solar system and galaxy", standards: ["MS-ESS1-2"],
          subtopics: [
            { code: "E3.1", title: "Gravity holding orbits together", sims: [] },
            { code: "E3.2", title: "Why an orbiting object neither falls in nor flies off", sims: [] },
            { code: "E3.3", title: "The Sun's dominant mass", sims: [] },
            { code: "E3.4", title: "Moons, asteroids and comets", sims: [] },
            { code: "E3.5", title: "The Milky Way, introduced", sims: [] },
          ],
        },
        {
          code: "E4", title: "The scale of the solar system", standards: ["MS-ESS1-3"],
          subtopics: [
            { code: "E4.1", title: "The astronomical unit", sims: [] },
            { code: "E4.2", title: "Analyzing size and distance data", sims: [] },
            { code: "E4.3", title: "Why a to-scale classroom model is nearly impossible", sims: [] },
            { code: "E4.4", title: "Comparing planetary properties", sims: [] },
            { code: "E4.5", title: "Building a scale representation", sims: [] },
          ],
        },
        {
          code: "E5", title: "Rock strata and the geologic time scale", standards: ["MS-ESS1-4"],
          subtopics: [
            { code: "E5.1", title: "Superposition", sims: [] },
            { code: "E5.2", title: "Index fossils and unconformities", sims: [] },
            { code: "E5.3", title: "Reading strata as a record", sims: [] },
            { code: "E5.4", title: "Eons, eras and periods", sims: [] },
            { code: "E5.5", title: "Constructing an explanation from strata evidence", sims: [] },
          ],
        },
        {
          code: "E6", title: "Dating Earth's history", standards: ["MS-ESS1-4"],
          subtopics: [
            { code: "E6.1", title: "Relative vs absolute dating", sims: [] },
            { code: "E6.2", title: "Radiometric dating, conceptually", sims: [] },
            { code: "E6.3", title: "Combining relative and absolute evidence", sims: [] },
            { code: "E6.4", title: "The 4.6-billion-year figure", sims: [] },
            { code: "E6.5", title: "Evaluating a dating claim", sims: [] },
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
            { code: "F1.1", title: "A mutation as a change to genetic information", sims: [] },
            { code: "F1.2", title: "Beneficial, harmful and neutral outcomes", sims: [] },
            { code: "F1.3", title: "Why most mutations are neutral", sims: [] },
            { code: "F1.4", title: "Mutation as the ultimate source of variation", sims: [] },
            { code: "F1.5", title: "Tracing a trait to a mutation", sims: [] },
          ],
        },
        {
          code: "F2", title: "Fossil evidence of change over time", standards: ["MS-LS4-1"],
          subtopics: [
            { code: "F2.1", title: "How a fossil forms", sims: [] },
            { code: "F2.2", title: "Order of appearance and extinction", sims: [] },
            { code: "F2.3", title: "Transitional forms", sims: [] },
            { code: "F2.4", title: "Placing fossils on the time scale", sims: [] },
            { code: "F2.5", title: "Analyzing fossil-record data", sims: [] },
          ],
        },
        {
          code: "F3", title: "Anatomical and embryological evidence",
          standards: ["MS-LS4-2", "MS-LS4-3"],
          subtopics: [
            { code: "F3.1", title: "Homologous structures", sims: [] },
            { code: "F3.2", title: "Analogous and vestigial structures", sims: [] },
            { code: "F3.3", title: "Shared ancestry vs convergence", sims: [] },
            { code: "F3.4", title: "Comparing early development across species", sims: [] },
            { code: "F3.5", title: "Inferring evolutionary relationships", sims: [] },
          ],
        },
        {
          code: "F4", title: "Natural selection", standards: ["MS-LS4-4"],
          subtopics: [
            { code: "F4.1", title: "Variation, survival and heritability", sims: [] },
            { code: "F4.2", title: "A fully worked real case", sims: [] },
            { code: "F4.3", title: "Differential survival and reproduction", sims: [] },
            { code: "F4.4", title: "Selection acts on populations, never on an individual's lifetime", sims: [] },
            { code: "F4.5", title: "Constructing an evidence-based explanation", sims: [] },
          ],
        },
        {
          code: "F5", title: "Artificial selection and adaptation over time",
          standards: ["MS-LS4-5", "MS-LS4-6"],
          subtopics: [
            { code: "F5.1", title: "Selective breeding", sims: [] },
            { code: "F5.2", title: "The same mechanism, a human selector", sims: [] },
            { code: "F5.3", title: "Technologies influencing inheritance", sims: [] },
            { code: "F5.4", title: "Tracking a trait's proportion across generations", sims: [] },
            { code: "F5.5", title: "Predicting a population's future trait proportions", sims: [] },
          ],
        },
        {
          code: "F6", title: "Human population, consumption and impact", standards: ["MS-ESS3-4"],
          subtopics: [
            { code: "F6.1", title: "Population growth as one multiplier", sims: [] },
            { code: "F6.2", title: "Per-capita consumption as the other multiplier", sims: [] },
            { code: "F6.3", title: "Constructing an argument from real data", sims: [] },
            { code: "F6.4", title: "Impact on biodiversity specifically", sims: [] },
            { code: "F6.5", title: "Presenting management options with trade-offs", sims: [] },
          ],
        },
      ],
    },
  ],
};
