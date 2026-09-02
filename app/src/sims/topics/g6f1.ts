import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F1 — Earth's climate system.
 *
 * Five simulations, one per subtopic:
 *
 *   F1.1  g6f1-five-spheres        the components of the climate system  (explore)
 *   F1.2  g6f1-in-and-out          energy in and energy out              (investigate)
 *   F1.3  g6f1-blanket-of-air      the natural greenhouse effect         (process)
 *   F1.4  g6f1-loops-both-ways     a feedback, conceptually              (compare)
 *   F1.5  g6f1-one-carbon-atom     interacting subsystems                (trace)
 *
 * The unit's arithmetic starts here. F1.2 computes Earth's effective
 * temperature straight from the Stefan-Boltzmann law, so a student can check
 * for themselves that a planet with our sunlight and our albedo and no
 * greenhouse gases would sit at minus 18 degrees. Every later claim in the
 * unit about warming is measured against that number.
 */

/* ---------------------------------------------------------------- *
 * F1.1 — The components of the climate system
 * ---------------------------------------------------------------- */

const FIVE_SPHERES: ArchetypeSpec = {
  id: "g6f1-five-spheres",
  title: "Five Spheres, One Climate",
  tagline: "Air, water, ice, life and rock. Pick each one apart and see what it holds.",
  kind: "explore",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-1", "MS-ESS3-5"] },
  learningGoals: [
    "Name the five parts of the climate system and say what each stores.",
    "Explain that the parts differ enormously in how fast they respond to a change.",
  ],
  misconceptions: [
    "Climate is only about the atmosphere",
    "The ocean is a passive container rather than an active part of the climate",
  ],
  specimens: [
    {
      id: "earth",
      name: "Earth, the whole system",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
      parts: [
        {
          id: "atmosphere", name: "Atmosphere", at: [0.04, -0.56],
          note: "5.15 million billion tonnes of air: 78 per cent nitrogen, 21 per cent oxygen, and 424 parts per million carbon dioxide. It mixes worldwide in about a year and changes temperature within days.",
        },
        {
          id: "cryosphere", name: "Cryosphere", at: [-0.40, -0.34],
          note: "Ice sheets, sea ice, snow and frozen ground. Antarctica alone holds 26.5 million cubic kilometres of ice, enough for 58 metres of sea level. Fresh snow reflects about 85 per cent of the sunlight that hits it.",
        },
        {
          id: "hydrosphere", name: "Hydrosphere", at: [-0.50, 0.16],
          note: "1.335 billion cubic kilometres of sea water over 71 per cent of the planet. The top 3.2 metres of ocean stores as much heat as the entire atmosphere, which is why the sea has taken up more than 90 per cent of the extra heat.",
        },
        {
          id: "biosphere", name: "Biosphere", at: [0.46, 0.18],
          note: "Plants and plankton pull about 120 gigatonnes of carbon out of the air every year in photosynthesis and give most of it straight back. The small imbalance is what makes forests and oceans a carbon sink.",
        },
        {
          id: "geosphere", name: "Geosphere", at: [0.12, 0.52],
          note: "Rock holds roughly 60 million gigatonnes of carbon, tens of thousands of times what the air holds. Volcanoes return about 0.3 gigatonnes of CO2 a year and weathering removes it again, over hundreds of thousands of years.",
        },
      ],
    },
  ],
};

export const g6f1FiveSpheres = buildSim(FIVE_SPHERES);

/* ---------------------------------------------------------------- *
 * F1.2 — Energy in and energy out
 * ---------------------------------------------------------------- */

const IN_AND_OUT: ArchetypeSpec = {
  id: "g6f1-in-and-out",
  title: "In and Out, and the Books Must Balance",
  tagline: "Turn the sunlight up, paint the planet a lighter colour, and watch the thermostat move.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-PS3-3"] },
  learningGoals: [
    "Compute how much sunlight a planet absorbs from its solar constant and albedo.",
    "Use the Stefan-Boltzmann law to find the temperature at which energy out equals energy in.",
    "Explain why a brighter planet is a colder planet.",
  ],
  misconceptions: [
    "Earth simply keeps the heat that arrives from the Sun",
    "Only the amount of sunlight matters, not what the surface does with it",
  ],
  specimens: [
    { id: "earth", name: "Earth from outside", art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" } },
  ],
  variables: [
    { key: "solar", label: "Sunlight at the top of the atmosphere (W/m2)", min: 1000, max: 1600, step: 1, default: 1361 },
    { key: "albedo", label: "Fraction reflected back to space", min: 0, max: 0.7, step: 0.01, default: 0.3 },
  ],
  // A sphere intercepts sunlight over its disc, pi r squared, and radiates
  // from its whole surface, 4 pi r squared, so the incoming figure is the
  // solar constant divided by four: 1361 / 4 = 340 W/m2. Balance means
  // sigma T^4 = absorbed, with sigma = 5.670374419e-8 W/m2/K4. At 1361 W/m2
  // and an albedo of 0.30 that gives 255 K, which is minus 18 degrees.
  measure: (v) => {
    const incoming = v.solar / 4;
    const absorbed = incoming * (1 - v.albedo);
    const kelvin = Math.pow(absorbed / 5.670374419e-8, 0.25);
    return {
      incomingWm2: incoming,
      reflectedWm2: incoming * v.albedo,
      absorbedWm2: absorbed,
      effectiveTempC: kelvin - 273.15,
      greenhouseWarmingC: 14.8 - (kelvin - 273.15),
    };
  },
  plot: { x: "albedo", y: "effectiveTempC", xLabel: "Fraction reflected", yLabel: "Balance temperature (C)" },
  /*
   * The planet takes the colour of the temperature the books balance at. At
   * 1 361 W/m2 and an albedo of 0.30 that is 255 K, minus 18 degrees, and the
   * blue of the Earth we know. Paint it brighter and it cools; past about
   * minus 40 the water is all ice, the ice reflects still more, and the planet
   * has gone to the white of a snowball, which is a state Earth really did
   * fall into twice about 700 million years ago. Turn the sunlight up instead
   * and it reddens.
   */
  drive: ({ f }) => ({
    color: f.effectiveTempC >= 10 ? "#c85a3c"
      : f.effectiveTempC >= -5 ? "#bd8a4a"
      : f.effectiveTempC >= -26 ? "#2f6ea8"
      : f.effectiveTempC >= -45 ? "#9fc6e0"
      : "#f0f7fc",
  }),
};

export const g6f1InAndOut = buildSim(IN_AND_OUT);

/* ---------------------------------------------------------------- *
 * F1.3 — The natural greenhouse effect, descriptively
 * ---------------------------------------------------------------- */

const BLANKET_OF_AIR: ArchetypeSpec = {
  id: "g6f1-blanket-of-air",
  title: "The Blanket That Was Always There",
  tagline: "Follow one packet of sunlight in, and the infrared that tries to get back out.",
  kind: "process",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-6", "MS-PS4-2"] },
  learningGoals: [
    "Describe the natural greenhouse effect as a delay in the escape of infrared, not a trapping of sunlight.",
    "State that without it Earth's surface would average minus 18 degrees rather than 15.",
  ],
  misconceptions: [
    "The greenhouse effect is a human invention and is always harmful",
    "Greenhouse gases stop sunlight from reaching the ground",
    "The atmosphere works like the glass of a greenhouse, by stopping air from moving",
  ],
  specimens: [
    { id: "earth", name: "Earth and its atmosphere", art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" } },
  ],
  variables: [
    { key: "trapped", label: "Share of the outgoing infrared the air catches", min: 0, max: 1, step: 0.01, default: 0.77 },
  ],
  /*
   * The one-layer grey atmosphere, the simplest model that gets the right
   * answer. Space must still receive the 240 W/m2 that came in, which fixes the
   * emission temperature at (240 / sigma)^(1/4) = 255 K. An atmosphere that
   * absorbs a fraction e of the infrared from the ground and re-emits it both
   * ways leaves the surface at
   *   Ts = Te * (2 / (2 - e))^(1/4).
   * Earth's air catches about 0.77 of it, which puts the surface at 288 K, or
   * 15 degrees, radiating 389 W/m2 — the figures in the captions. Take the
   * slider to zero and the surface sits at the bare 255 K, minus 18 degrees,
   * with every ocean frozen. Take it to one and it reaches 30.
   */
  measure: (v) => {
    const sigma = 5.670374419e-8;
    const emissionK = Math.pow(240 / sigma, 0.25);
    const surfaceK = emissionK * Math.pow(2 / (2 - v.trapped), 0.25);
    return {
      surfaceTempC: surfaceK - 273.15,
      greenhouseEffectC: surfaceK - emissionK,
      surfaceEmissionWm2: sigma * Math.pow(surfaceK, 4),
      escapingToSpaceWm2: 240,
    };
  },
  /*
   * The planet is the thermometer. Let none of the infrared be caught and it
   * goes to the white of a world whose oceans are ice at minus 18; catch the
   * 0.77 the real air catches and it is the blue planet with liquid water on
   * it; catch all of it and the surface reaches 30 degrees and the picture
   * reddens. Thirty-three degrees of difference, drawn rather than asserted.
   */
  drive: ({ f }) => ({
    color: f.surfaceTempC >= 26 ? "#c1442c"
      : f.surfaceTempC >= 19 ? "#c07a3e"
      : f.surfaceTempC >= 6 ? "#2f6ea8"
      : f.surfaceTempC >= -8 ? "#9fc6e0"
      : "#f0f7fc",
  }),
  stages: [
    {
      name: "Sunlight arrives", at: 0,
      caption: "340 W/m2 reaches the top of the atmosphere, averaged over the whole globe. Most of it is visible light, and the air is almost perfectly clear to it.",
    },
    {
      name: "Some is reflected", at: 0.2,
      caption: "Clouds, ice and bright desert send about 100 W/m2 straight back to space. That leaves 240 W/m2 absorbed by the ground and the air.",
    },
    {
      name: "The ground glows", at: 0.4,
      caption: "A surface at 15 degrees radiates 390 W/m2 of infrared, invisible to us, peaking near a wavelength of 10 micrometres.",
    },
    {
      name: "The gases catch it", at: 0.6,
      caption: "Water vapour and carbon dioxide absorb infrared strongly, CO2 right at 15 micrometres. Nitrogen and oxygen, 99 per cent of the air, absorb almost none of it.",
    },
    {
      name: "And send it back", at: 0.8,
      caption: "Each gas molecule re-emits in every direction, so about 340 W/m2 comes back down. The surface is warmed from above as well as from the Sun.",
    },
    {
      name: "Balance, but warmer", at: 1,
      caption: "Space still receives 240 W/m2, exactly what came in. But the surface now sits at 15 degrees instead of minus 18: a natural greenhouse effect of 33 degrees, and the reason there is liquid water here.",
    },
  ],
};

export const g6f1BlanketOfAir = buildSim(BLANKET_OF_AIR);

/* ---------------------------------------------------------------- *
 * F1.4 — A feedback, introduced conceptually
 * ---------------------------------------------------------------- */

const LOOPS_BOTH_WAYS: ArchetypeSpec = {
  id: "g6f1-loops-both-ways",
  title: "Loops That Push, Loops That Pull",
  tagline: "One feedback makes a nudge bigger. The other makes it smaller. Both are running right now.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-5", "MS-ESS2-6"] },
  learningGoals: [
    "Describe a feedback as a change that feeds back into its own cause.",
    "Distinguish an amplifying feedback from a damping one, with a real example of each.",
  ],
  misconceptions: [
    "All feedbacks make things worse",
    "A positive feedback must run away without limit",
  ],
  variables: [
    { key: "warming", label: "Global warming so far (degrees)", min: 0, max: 5, step: 0.1, default: 1.1 },
  ],
  /*
   * Both loops are measured, and both are drawn from real coefficients.
   *
   * The brake is the Planck response, and it is not fitted to anything: a body
   * at 255 K sheds 4 * sigma * T^3 = 3.76 W/m2 more for every extra degree.
   * The push is the ice-albedo feedback, about 0.35 W/m2 per degree. The brake
   * is more than ten times the push, so the loop amplifies by 1 / (1 - 0.35 /
   * 3.76) = 1.10 and does not run away: about a tenth more warming than there
   * would otherwise be, not an explosion.
   *
   * And what the ice itself does: September Arctic sea ice falls by roughly 3
   * million square kilometres for every degree of global warming, from the 6.5
   * million of the 1980s. That puts the first ice-free September at about 2.2
   * degrees, which is where the observed relationship points.
   */
  measure: (v) => ({
    extraHeatingFromIceLossWm2: 0.35 * v.warming,
    extraRadiationToSpaceWm2: 3.76 * v.warming,
    amplificationFactor: 1 / (1 - 0.35 / 3.76),
    septemberSeaIceMillionKm2: Math.max(0, 6.5 - 3 * v.warming),
  }),
  /*
   * The left-hand specimen is the ice itself, drawn to area: sea ice is
   * measured in square kilometres, so its width goes as the square root of
   * what is left. It shrinks and pales towards the blue of open water, and at
   * about 2.2 degrees it is gone — the whole September cap, and the picture
   * shows a patch of ocean where it used to be. The right-hand planet is the
   * brake, reddening as it radiates harder, which is the thing that keeps the
   * left-hand loop from running away.
   */
  drive: ({ v, f, index }) => {
    if (index === 0) {
      const left = f.septemberSeaIceMillionKm2 / 6.5;
      return {
        scale: Math.max(0.14, Math.sqrt(left)),
        color: left <= 0 ? "#1d5f92" : left < 0.4 ? "#a9cfe4" : "#e8f4fb",
        glow: left * 0.4,
        rate: left <= 0 ? 0 : 1,
      };
    }
    return {
      color: v.warming >= 3.5 ? "#a83322"
        : v.warming >= 2 ? "#c2603a"
        : v.warming >= 0.8 ? "#cf8a52"
        : "#d8b98a",
    };
  },
  specimens: [
    {
      id: "ice",
      name: "Ice and albedo: the loop that pushes",
      because: "Sea ice reflects about 60 per cent of the sunlight that hits it, open ocean only 6. Melt the ice and the water absorbs what the ice was sending back, so it warms and melts more. Measured strength: about 0.35 W/m2 of extra heating for every degree of warming.",
      art: { art: "sphere", color: "#e8f4fb", radius: 0.46, glow: 0.4 },
    },
    {
      id: "radiate",
      name: "Radiating harder: the loop that pulls",
      because: "Everything warm glows, and warmer things glow much harder. Earth at 255 K sheds an extra 3.8 W/m2 for every degree it warms, which pulls the temperature back down. This brake is stronger than the ice loop, which is why the ice loop amplifies rather than runs away.",
      art: { art: "planet", color: "#c2603a", atmosphere: "#f0b48a" },
    },
  ],
};

export const g6f1LoopsBothWays = buildSim(LOOPS_BOTH_WAYS);

/* ---------------------------------------------------------------- *
 * F1.5 — The climate system as interacting subsystems
 * ---------------------------------------------------------------- */

const ONE_CARBON_ATOM: ArchetypeSpec = {
  id: "g6f1-one-carbon-atom",
  title: "One Carbon Atom, Five Spheres",
  tagline: "Follow a single atom out of the air and all the way into rock, then back again.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-1", "MS-ESS3-5"] },
  learningGoals: [
    "Follow one atom through the atmosphere, hydrosphere, biosphere and geosphere.",
    "Compare the residence time of carbon in each part of the system.",
    "Explain that the parts are connected, so a change in one shows up in all the others.",
  ],
  misconceptions: [
    "Carbon dioxide released today stays in the air forever",
    "The parts of the climate system can be studied one at a time without the others",
  ],
  specimens: [{ id: "co2", name: "The molecule being followed", art: { art: "molecule", formula: "CO2" } }],
  variables: [
    { key: "years", label: "Years since it was released", min: 0, max: 1000, step: 5, default: 0 },
  ],
  /*
   * The Bern impulse-response function, which is how the IPCC answers "how
   * long does a puff of CO2 last?". The share of a pulse still in the air
   * after t years is
   *   0.2173 + 0.2240 e^(-t/394.4) + 0.2824 e^(-t/36.54) + 0.2763 e^(-t/4.304),
   * four processes with four different speeds: fast mixing into the surface
   * ocean, slower uptake by the biosphere, slower still by the deep ocean, and
   * a fifth of it that essentially never comes back on any human timescale,
   * because only rock weathering can take it and that runs over hundreds of
   * thousands of years. Half of it goes in about thirty years. A fifth is
   * still there in a thousand. Both halves of that sentence matter.
   */
  measure: (v) => {
    const share = 0.2173
      + 0.224 * Math.exp(-v.years / 394.4)
      + 0.2824 * Math.exp(-v.years / 36.54)
      + 0.2763 * Math.exp(-v.years / 4.304);
    return {
      percentStillInTheAir: share * 100,
      tonnesLeftOfEveryThousand: share * 1000,
      percentTakenBySeaAndLand: (1 - share) * 100,
      yearsElapsed: v.years,
    };
  },
  /*
   * The molecule is the share of the pulse still airborne, so it is drawn
   * smaller as the sea and the land take their part of it, and it sinks out of
   * the air along the route while it does. It never disappears: a fifth of it
   * is still on the stage at a thousand years, which is the point the students
   * are meant to leave with.
   */
  drive: ({ f }) => {
    const gone = 1 - f.percentStillInTheAir / 100;
    return {
      scale: 0.3 + 0.7 * (f.percentStillInTheAir / 100),
      offset: [1.2 * gone, 0.55 * gone],
      rate: 1 - 0.7 * gone,
    };
  },
  route: [
    {
      at: [0.10, 0.30], name: "In the air",
      note: "One carbon atom in a CO2 molecule, among the 890 gigatonnes of carbon the atmosphere holds. Winds mix it worldwide within about a year.",
    },
    {
      at: [0.27, 0.58], name: "Into the sea",
      note: "CO2 dissolves at the surface, best in cold water. The ocean takes up about a quarter of everything people emit, roughly 10 billion tonnes of CO2 a year.",
    },
    {
      at: [0.44, 0.28], name: "Into a shell",
      note: "Plankton use it. Some build shells of calcium carbonate, locking the atom into a solid that will sink when they die.",
    },
    {
      at: [0.61, 0.62], name: "Down into the deep",
      note: "The shell falls. Deep water does not touch the surface again for 300 to 1000 years, so the atom is out of the air for centuries.",
    },
    {
      at: [0.78, 0.30], name: "Into rock",
      note: "Buried shells become limestone. Sedimentary rock holds about 60 million gigatonnes of carbon, tens of thousands of times what the air holds.",
    },
    {
      at: [0.92, 0.60], name: "Out of a volcano",
      note: "Subduction and heat eventually send it back. Volcanoes return about 0.3 gigatonnes of CO2 a year, roughly one hundredth of the human figure, which is why the return trip cannot keep pace.",
    },
  ],
  stages: [
    { name: "Air", at: 0, caption: "The atmosphere is the smallest carbon store and the fastest. Change it and everything else starts to respond." },
    { name: "Ocean", at: 0.2, caption: "The hydrosphere holds about 50 times more carbon than the air, and it is still taking more in." },
    { name: "Life", at: 0.4, caption: "The biosphere moves 120 gigatonnes of carbon a year in and nearly the same amount back out. The gap is the sink." },
    { name: "Deep sea", at: 0.6, caption: "The biological pump carries carbon below the mixed layer, where the overturning takes about a thousand years." },
    { name: "Rock", at: 0.8, caption: "The geosphere is the largest store and much the slowest: burial and weathering work over hundreds of thousands of years." },
    { name: "Round again", at: 1, caption: "Every sphere is joined to every other. Burning fossil carbon moves rock straight into air, skipping the slow steps entirely." },
  ],
};

export const g6f1OneCarbonAtom = buildSim(ONE_CARBON_ATOM);
