import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit A · Topic A1 — The particle model, refined.
 *
 * Five simulations, one per subtopic:
 *
 *   A1.1  g7a1-three-arrangements   reviewing the particle model     (sort)
 *   A1.2  g7a1-when-spheres-fail    why chemistry needs atoms        (compare)
 *   A1.3  g7a1-jiggling-grain       evidence that particles are real (investigate)
 *   A1.4  g7a1-one-piece-of-water   particles versus atoms           (explore)
 *   A1.5  g7a1-down-to-the-atom     scale of the atom                (process)
 *
 * The topic's whole job is to take the "tiny balls" picture a student already
 * has and put real sizes and real evidence under it. So A1.3 computes genuine
 * Brownian motion from the Stokes-Einstein relation rather than asserting that
 * particles jiggle, and A1.5 counts real atoms across real objects.
 */

/* ---------------------------------------------------------------- *
 * A1.1 — Reviewing the particle model
 * ---------------------------------------------------------------- */

const THREE_ARRANGEMENTS: ArchetypeSpec = {
  id: "g7a1-three-arrangements",
  title: "Three Arrangements, One Kind of Particle",
  tagline: "Six samples. The particles are the same; only how they are arranged has changed.",
  kind: "sort",
  subject: "chemistry",
  bands: ["3-5", "6-8"],
  grades: [6, 7],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Describe how particles are arranged and how they move in a solid, a liquid and a gas.",
    "Explain that changing state rearranges particles without changing what they are.",
  ],
  misconceptions: [
    "Particles expand when a substance is heated",
    "A gas weighs nothing because its particles are so far apart",
    "Metals are solid because their particles are stuck still",
  ],
  categories: [
    { id: "solid", name: "Solid", hint: "fixed positions, vibrating on the spot" },
    { id: "liquid", name: "Liquid", hint: "touching, but free to slide past one another" },
    { id: "gas", name: "Gas", hint: "far apart, moving fast in every direction" },
  ],
  specimens: [
    {
      id: "ice", name: "Ice cubes in a beaker", category: "solid",
      because:
        "Locked in a lattice and only vibrating. The lattice of ice is unusually open, which is why ice is 0.917 g/cm3 and floats on water at 1.000 g/cm3.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#bcd9ea", precipitate: 0.5 },
    },
    {
      id: "water", name: "Liquid water in a beaker", category: "liquid",
      because:
        "The same molecules, still touching, now sliding. One cubic centimetre holds 3.3 x 10^22 of them, which is why water pours but barely compresses.",
      art: { art: "glassware", which: "beaker", level: 0.62, color: "#7fb3d5" },
    },
    {
      id: "steam", name: "Steam leaving a flask", category: "gas",
      because:
        "One gram of water becomes 1.7 litres of steam at 100 degrees: the molecules have not grown, they have simply spread about 1700 times further apart.",
      art: { art: "glassware", which: "flask", level: 0.15, color: "#cfe3ef", bubbles: 0.9 },
    },
    {
      id: "oxygen", name: "Oxygen in a sealed tube", category: "gas",
      because:
        "Free O2 molecules crossing the tube at about 480 m/s at room temperature, hitting the walls billions of times a second. That drumming is the pressure.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "copper", name: "Block of copper", category: "solid",
      because:
        "Atoms 0.256 nm apart in a rigid stack, vibrating but never swapping places. Heat it to 1085 degrees and the stack finally collapses into a liquid.",
      art: { art: "sphere", color: "#b87333", radius: 0.42 },
    },
    {
      id: "mercury", name: "Bead of mercury", category: "liquid",
      because:
        "A metal that is liquid at room temperature: mercury freezes only at minus 38.8 degrees. Dense at 13.53 g/cm3, so the particles are touching, yet it rolls.",
      art: { art: "sphere", color: "#c9ccd4", radius: 0.34 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A1.2 — Why chemistry needs a sharper picture
 * ---------------------------------------------------------------- */

const WHEN_SPHERES_FAIL: ArchetypeSpec = {
  id: "g7a1-when-spheres-fail",
  title: "Where the Featureless Ball Runs Out",
  tagline: "Pass a current through water and the plain-ball model has no answer.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain what the simple particle model does and does not account for.",
    "Give evidence that particles of a compound are built from smaller atoms.",
  ],
  misconceptions: [
    "Particles are the smallest thing there is",
    "A model that works once must be right about everything",
  ],
  specimens: [
    {
      id: "ball",
      name: "Model 1: water as featureless balls",
      because:
        "This model earns its keep. Melting, boiling, diffusion and gas pressure all follow from balls that move faster when heated. But electrolyse the water and it says nothing: a ball with no parts cannot come apart.",
      art: { art: "sphere", color: "#7fb3d5", radius: 0.44 },
    },
    {
      id: "h2o",
      name: "Model 2: water as H2O",
      because:
        "Electrolysis gives exactly twice the volume of hydrogen as oxygen, and 2.0 g of hydrogen for every 16.0 g of oxygen. Two H atoms bonded to one O predicts both numbers before you measure them.",
      art: { art: "molecule", formula: "H2O" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A1.3 — Evidence that particles are real
 * ---------------------------------------------------------------- */

const JIGGLING_GRAIN: ArchetypeSpec = {
  id: "g7a1-jiggling-grain",
  title: "The Grain That Will Not Sit Still",
  tagline: "A speck of pollen in water wanders on its own. Warm the water and it wanders further.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain Brownian motion as evidence that invisible particles are moving and colliding.",
    "Predict how the wandering of a grain changes with its size and with temperature.",
  ],
  misconceptions: [
    "The grain moves because the water is flowing",
    "Something you cannot see cannot be shown to exist",
  ],
  specimens: [
    { id: "grain", name: "Pollen grain in water", art: { art: "sphere", color: "#d8b45a", radius: 0.3 } },
  ],
  variables: [
    { key: "radius", label: "Grain radius (micrometres)", min: 0.1, max: 3, step: 0.1, default: 0.5 },
    { key: "temperature", label: "Water temperature (degrees C)", min: 5, max: 90, step: 1, default: 20 },
    { key: "time", label: "Watch it for (s)", min: 1, max: 60, step: 1, default: 10 },
  ],
  /*
   * Stokes-Einstein, which is what Einstein wrote down in 1905 and Perrin
   * measured in 1908 to settle the argument about whether atoms exist:
   *
   *   D = kT / (6 pi eta r)          k = 1.380649e-23 J/K
   *
   * and in two dimensions, which is what you see down a microscope, the
   * typical distance wandered in time t is sqrt(4 D t).
   *
   * Water's viscosity changes a great deal over this range, so it is taken
   * from the Vogel fit, eta = 2.414e-5 x 10^(247.8 / (T - 140)) Pa s, which is
   * within about one per cent of the measured value from 0 to 100 degrees:
   * it gives 1.002 mPa s at 20 degrees and 0.311 at 90, against measured
   * values of 1.002 and 0.315.
   */
  measure: (v) => {
    const T = v.temperature + 273.15;
    const eta = 2.414e-5 * Math.pow(10, 247.8 / (T - 140));
    const r = v.radius * 1e-6;
    const D = (1.380649e-23 * T) / (6 * Math.PI * eta * r);
    const rms = Math.sqrt(4 * D * v.time);
    return {
      viscosityMPas: eta * 1e3,
      diffusionUm2PerS: D * 1e12,
      rmsDisplacementUm: rms * 1e6,
      wanderPerMinuteUm: Math.sqrt(4 * D * 60) * 1e6,
    };
  },
  plot: {
    x: "temperature", y: "rmsDisplacementUm",
    xLabel: "Water temperature (degrees C)", yLabel: "Typical wander (micrometres)",
  },
};

/* ---------------------------------------------------------------- *
 * A1.4 — Particles versus atoms
 * ---------------------------------------------------------------- */

const ONE_PIECE_OF_WATER: ArchetypeSpec = {
  id: "g7a1-one-piece-of-water",
  title: "The Smallest Piece That Is Still Water",
  tagline: "Take water apart once and you have a molecule. Take it apart again and it is not water.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Distinguish a particle of a substance from the atoms it is built from.",
    "Explain that a compound's properties belong to the molecule, not to its atoms.",
  ],
  misconceptions: [
    "Atom and particle mean the same thing",
    "Water molecules are wet, and hydrogen atoms inside water are flammable",
  ],
  specimens: [
    {
      id: "water", name: "One water molecule", art: { art: "molecule", formula: "H2O" },
      parts: [
        {
          id: "oxygen", name: "Oxygen atom", at: [0.02, 0.2],
          note: "One atom: 8 protons, 8 electrons. On its own, oxygen gas is what a fire needs to burn.",
        },
        {
          id: "hydrogen-left", name: "Hydrogen atom", at: [-0.34, -0.14],
          note: "The simplest atom there is: one proton, one electron, and nothing else.",
        },
        {
          id: "hydrogen-right", name: "The second hydrogen", at: [0.34, -0.14],
          note: "Two hydrogens, never three. The formula H2O is a count, and the count never varies.",
        },
        {
          id: "bond", name: "A shared pair of electrons", at: [0.21, 0.06],
          note: "The bond is 0.096 nm long and takes 463 kJ per mole to break, which is why water does not fall apart on its own.",
        },
        {
          id: "molecule", name: "The particle of water", at: [-0.2, -0.02],
          note: "All three atoms together are one particle. Split it and you get hydrogen and oxygen: two gases that are nothing like water.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A1.5 — Scale of the atom
 * ---------------------------------------------------------------- */

const DOWN_TO_THE_ATOM: ArchetypeSpec = {
  id: "g7a1-down-to-the-atom",
  title: "Down to the Atom, in Five Steps",
  tagline: "Start at a grain of sand and divide by a thousand, four times over.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Place the size of an atom on a scale that runs from everyday objects downwards.",
    "Describe an atom as mostly empty space with almost all its mass in the nucleus.",
  ],
  misconceptions: [
    "Atoms are about as small as a speck of dust",
    "The nucleus fills most of the atom",
  ],
  specimens: [
    { id: "cu", name: "A copper atom", art: { art: "atom", protons: 29, neutrons: 34, electrons: 29 } },
  ],
  /*
   * Every count is a copper atom count: copper atoms sit 0.256 nm apart in the
   * metal, so dividing any length by 0.256 nm gives the number of atoms across
   * it. Copper-63 has 29 protons and 34 neutrons, so its nucleus is about
   * 1.2 x 63^(1/3) = 4.8 fm in radius: 9.6 fm across, against 256,000 fm for
   * the atom.
   */
  stages: [
    {
      name: "0.5 mm", at: 0,
      caption: "A grain of sand, just visible. Two million copper atoms would fit across it.",
    },
    {
      name: "1 micrometre", at: 0.25,
      caption: "A bacterium, at the limit of a school microscope. About 3,900 atoms across.",
    },
    {
      name: "10 nanometres", at: 0.5,
      caption: "A virus. Now only about 39 atoms across: you can almost count them.",
    },
    {
      name: "0.256 nm", at: 0.75,
      caption: "One copper atom, centre to centre. Nearly four million of them, side by side, make one millimetre.",
    },
    {
      name: "0.0000096 nm", at: 1,
      caption: "The nucleus: 27,000 times smaller across than the atom, holding 99.98% of its mass. Blow the atom up to a 100 m stadium and the nucleus is a 4 mm pea on the centre spot.",
    },
  ],
};

export const g7a1ThreeArrangements = buildSim(THREE_ARRANGEMENTS);
export const g7a1WhenSpheresFail = buildSim(WHEN_SPHERES_FAIL);
export const g7a1JigglingGrain = buildSim(JIGGLING_GRAIN);
export const g7a1OnePieceOfWater = buildSim(ONE_PIECE_OF_WATER);
export const g7a1DownToTheAtom = buildSim(DOWN_TO_THE_ATOM);
