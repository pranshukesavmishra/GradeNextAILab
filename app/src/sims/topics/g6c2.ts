import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit C · Topic C2 — Particles, temperature and thermal energy.
 *
 * Six simulations, one per subtopic:
 *
 *   C2.1  g6c2-cut-it-again      matter is made of particles        (process)
 *   C2.2  g6c2-how-a-smell       evidence for particle motion       (investigate)
 *   C2.3  g6c2-solid-liquid-gas  particle movement in the states    (sort)
 *   C2.4  g6c2-how-fast          temperature as average kinetic     (investigate)
 *   C2.5  g6c2-spark-and-bath    temperature vs total thermal       (compare)
 *   C2.6  g6c2-inside-a-thermo   measuring temperature              (explore)
 *
 * C2.5 is the hinge of the whole unit: a spark at 1 000 degrees holds about
 * 9 joules, a warm bath holds 12.6 million. Temperature says how fast the
 * particles move; thermal energy also counts how many there are.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second. So this is the rail's
 * own position, and the specimen changes in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/* C2.1 — Matter is made of particles. */
const CUT_IT_AGAIN: ArchetypeSpec = {
  id: "g6c2-cut-it-again",
  title: "Cut It in Half, and Half Again",
  tagline: "Keep halving a sugar cube and find out where the cutting has to stop.",
  kind: "process",
  subject: "chemistry",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Explain that matter is made of particles too small to see.",
    "Describe the limit at which a substance stops being that substance.",
  ],
  misconceptions: ["Matter is continuous and can be divided forever"],
  specimens: [{ id: "cube", name: "Sugar cube", art: { art: "sphere", color: "#f2efe6", radius: 0.46 } }],
  stages: [
    { name: "The cube", at: 0,
      caption: "A 4 g sugar cube, about 12 mm on a side. It looks completely solid and smooth." },
    { name: "Grains", at: 0.25,
      caption: "Crush it and you get grains about 0.5 mm across. Each one is still sugar, and still sweet." },
    { name: "One crystal", at: 0.5,
      caption: "Pick out a single crystal. Under a microscope its flat faces show a repeating pattern inside." },
    { name: "One molecule", at: 0.75,
      caption: "The pattern repeats down to one sucrose molecule, about 1 nanometre wide. The cube held roughly 7 x 10^21 of them." },
    { name: "One cut too far", at: 1,
      caption: "Break the molecule and the sweetness is gone: only carbon, hydrogen and oxygen atoms are left. That is the limit." },
  ],
  /*
   * The cube really is cut down. A 12 mm cube becomes a 0.5 mm grain, then one
   * crystal, then a molecule 1 nanometre across: seven orders of magnitude, so
   * the drawn size follows the logarithm of the real width rather than the
   * width itself, or every stage after the first would be a single pixel. It
   * pales as it goes, and at the last cut it turns to loose atoms and stops
   * being sugar — the colour drops out and the turning stops.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const broken = u > 0.9;
    return {
      scale: 1.15 - u * 0.85,
      color: broken ? "#8d94a3" : u > 0.65 ? "#dfe6f2" : undefined,
      rate: broken ? 0 : 0.4 + u * 2.4,
      glow: broken ? 0.8 : 0,
    };
  },
};

/* C2.2 — Evidence for particle motion. */
const HOW_A_SMELL: ArchetypeSpec = {
  id: "g6c2-how-a-smell",
  title: "How Fast Does a Smell Travel?",
  tagline: "Particles really do wander across a room. It just takes them days.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Use diffusion as evidence that particles are in constant random motion.",
    "Explain why a smell usually reaches you on an air current, not by diffusion.",
  ],
  misconceptions: ["A smell reaches you because particles travel straight to your nose"],
  specimens: [{ id: "flask", name: "Open flask of scent", art: { art: "glassware", which: "flask", level: 0.25, bubbles: 2 } }],
  variables: [
    { key: "distance", label: "Distance across the room (cm)", min: 1, max: 500, step: 1, default: 100 },
  ],
  // Random-walk diffusion: the time to spread a distance x is x squared over
  // 2D. For a light scent molecule in still air D is about 0.1 cm2/s, which is
  // measured, not assumed. A gentle indoor draught moves at about 20 cm/s.
  measure: (v) => {
    const seconds = (v.distance * v.distance) / (2 * 0.1);
    return {
      diffusionHours: seconds / 3600,
      diffusionMinutes: seconds / 60,
      draughtSeconds: v.distance / 20,
    };
  },
  plot: { x: "distance", y: "diffusionHours", xLabel: "Distance (cm)", yLabel: "Time to diffuse (hours)" },
  /*
   * The flask is the clock. Diffusion time goes as the square of the distance,
   * so the bubbling that stands for molecules leaving slows right down as the
   * target moves away: 1 cm takes 5 seconds, 500 cm takes 145 hours. The
   * flask drains as its scent leaves, and past about a day the run has failed
   * as a way of delivering a smell at all — the liquid goes flat and grey,
   * which is the honest answer to "would you smell it?".
   */
  drive: ({ f }) => {
    const hopeless = f.diffusionHours > 24;
    return {
      level: 0.05 + 0.3 / (1 + f.diffusionHours / 3),
      bubbles: Math.max(0.04, 3 / (1 + f.diffusionHours)),
      color: hopeless ? "#7d8595" : "#b07fd0",
      rate: Math.max(0.05, 2 / (1 + f.diffusionHours / 2)),
    };
  },
};

/* C2.3 — Particle movement in solids, liquids and gases. */
const SOLID_LIQUID_GAS: ArchetypeSpec = {
  id: "g6c2-solid-liquid-gas",
  title: "Fixed, Sliding or Flying?",
  tagline: "Judge each substance by what its particles are doing, not by how it pours.",
  kind: "sort",
  subject: "chemistry",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS1-4"] },
  learningGoals: [
    "Describe particle arrangement and motion in solids, liquids and gases.",
    "Use particle behaviour, not appearance, to identify a state of matter.",
  ],
  misconceptions: ["Anything that pours is a liquid"],
  categories: [
    { id: "solid", name: "Solid", hint: "touching, fixed places, vibrating" },
    { id: "liquid", name: "Liquid", hint: "touching, but sliding past each other" },
    { id: "gas", name: "Gas", hint: "far apart, flying free" },
  ],
  specimens: [
    { id: "ice", name: "Ice at -10 degrees", category: "solid",
      because: "The molecules are locked in a lattice and only vibrate. That is why ice keeps its shape.",
      art: { art: "sphere", color: "#eef5fc", radius: 0.44 } },
    { id: "water", name: "Water at 20 degrees", category: "liquid",
      because: "Molecules still touch but roll over one another, so it takes the shape of its container and keeps its volume.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "steam", name: "Steam at 110 degrees", category: "gas",
      because: "Molecules fly apart at hundreds of metres a second. The same mass of water takes about 1 700 times more space.",
      art: { art: "glassware", which: "flask", level: 0.15, bubbles: 6 } },
    { id: "copper", name: "Copper wire", category: "solid",
      because: "Atoms in a fixed metal lattice, vibrating in place. Bend the wire and the whole lattice bends with it.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "oil", name: "Olive oil", category: "liquid",
      because: "It pours slowly because its long molecules tangle, but they slide past each other all the same.",
      art: { art: "glassware", which: "testTube", level: 0.7, color: "#b9a53f" } },
    { id: "air", name: "The air in this room", category: "gas",
      because: "Mostly empty space. The molecules travel at about 500 m/s and hit each other billions of times a second.",
      art: { art: "sphere", color: "#b9cfe3", radius: 0.52, glow: 0.75 } },
    { id: "sand", name: "Dry sand", category: "solid",
      because: "It pours, so it looks like a liquid, but each grain is a solid crystal. A heap of solids is still solid.",
      art: { art: "sphere", color: "#cbb894", radius: 0.44 } },
  ],
  /*
   * This sort asks the student to judge by particle motion, so the specimen
   * has to show particle motion. Solids only shiver in place; liquids turn
   * slowly and roll; gases fly, at the speeds kinetic theory gives them —
   * about 500 m/s for air at room temperature, faster still for steam at 110
   * degrees. Sand is the trap: it pours, but each grain shivers like the
   * solid it is.
   */
  drive: ({ specimen, t }) => {
    switch (specimen.id) {
      case "ice":
        return { offset: [0.012 * Math.sin(t * 26), 0.012 * Math.cos(t * 31)], rate: 0.05 };
      case "copper":
        return { offset: [0.01 * Math.sin(t * 22), 0.01 * Math.cos(t * 27)], rate: 0.05 };
      case "sand":
        return { offset: [0.014 * Math.sin(t * 19), 0.014 * Math.cos(t * 24)], rate: 0.05 };
      case "water":
        return { level: 0.6, bubbles: 0.12, rate: 0.55 };
      case "oil":
        return { level: 0.7, bubbles: 0.05, rate: 0.3 };
      case "steam":
        return { level: 0.06, bubbles: 22, scale: 1.18, rate: 3.2 };
      default:
        return {
          offset: [0.24 * Math.sin(t * 3.1), 0.2 * Math.cos(t * 2.3)],
          scale: 1.1, glow: 0.8, rate: 3.6,
        };
    }
  },
};

/* C2.4 — Temperature as average kinetic energy. */
const HOW_FAST: ArchetypeSpec = {
  id: "g6c2-how-fast",
  title: "How Fast Are the Particles?",
  tagline: "Warm the air and measure what temperature really is: speed.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Relate temperature to the average kinetic energy of particles.",
    "Explain why lighter particles move faster at the same temperature.",
  ],
  misconceptions: ["Doubling the temperature in degrees Celsius doubles the particle speed"],
  specimens: [{ id: "gas", name: "Sample of nitrogen gas", art: { art: "sphere", color: "#a9c8e8", radius: 0.46, glow: 0.4 } }],
  variables: [
    { key: "tempC", label: "Temperature (degrees C)", min: -50, max: 500, step: 1, default: 20 },
  ],
  // Root-mean-square speed from kinetic theory: v = root(3RT/M), with
  // R = 8.314 J/mol K, nitrogen 0.028 kg/mol, helium 0.004 kg/mol. At 20
  // degrees this gives 511 m/s for nitrogen, the textbook value. The mean
  // kinetic energy of one particle is three halves k T.
  measure: (v) => {
    const tempK = v.tempC + 273.15;
    return {
      temperatureK: tempK,
      nitrogenSpeedMs: Math.sqrt((3 * 8.314 * tempK) / 0.028),
      heliumSpeedMs: Math.sqrt((3 * 8.314 * tempK) / 0.004),
      meanEnergyPerParticleZJ: 1.5 * 1.380649e-23 * tempK * 1e21,
    };
  },
  plot: { x: "tempC", y: "nitrogenSpeedMs", xLabel: "Temperature (degrees C)", yLabel: "Average nitrogen speed (m/s)" },
  /*
   * Temperature is speed, so the sample is drawn moving at the speed kinetic
   * theory gives it: the jitter and the turning both scale with the root-mean-
   * square speed, 425 m/s at -50 degrees and 819 at 500. That is the lesson —
   * nearly twice the speed for a change that looks like ten times the
   * temperature on the Celsius scale, because it is the kelvin that counts and
   * speed goes as its square root. The colour runs from cold blue to hot amber
   * across the same range.
   */
  drive: ({ f, t }) => {
    const s = f.nitrogenSpeedMs / 511;
    return {
      offset: [0.13 * s * Math.sin(t * 4.4 * s), 0.11 * s * Math.cos(t * 3.7 * s)],
      color: f.temperatureK > 500 ? "#e8934a" : f.temperatureK < 250 ? "#7fa8d8" : "#a9c8e8",
      glow: Math.min(1, (f.temperatureK - 200) / 600),
      scale: 0.9 + s * 0.25,
      rate: s * s * 2,
    };
  },
};

/* C2.5 — Temperature vs total thermal energy. */
const SPARK_AND_BATH: ArchetypeSpec = {
  id: "g6c2-spark-and-bath",
  title: "A Hot Spark and a Warm Bath",
  tagline: "One is fifty times hotter. The other holds a million times more energy.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Distinguish temperature from the total thermal energy of an object.",
    "Use mass and specific heat capacity to explain why a cool object can hold more energy.",
  ],
  misconceptions: ["Hotter always means more thermal energy"],
  variables: [
    { key: "sparkTempC", label: "Temperature of the spark (degrees C)", min: 200, max: 1400, step: 10, default: 1000 },
    { key: "bathTempC", label: "Temperature of the bath (degrees C)", min: 22, max: 45, step: 0.5, default: 40 },
  ],
  /*
   * q = m c dT above a 20 degree room, with the measured specific heat
   * capacities: steel 466 J/kg K, water 4 186. The spark is 0.02 g of steel,
   * the bath 150 kg of water. At the defaults that is 9.1 J against
   * 12 558 000 J — the spark is 25 times hotter and holds one part in 1.4
   * million of the energy.
   */
  measure: (v) => {
    const sparkJ = 0.00002 * 466 * (v.sparkTempC - 20);
    const bathJ = 150 * 4186 * (v.bathTempC - 20);
    return {
      sparkEnergyJ: sparkJ,
      bathEnergyMJ: bathJ / 1e6,
      bathHoldsThisManyTimesMore: bathJ / sparkJ,
      sparkIsThisManyTimesHotter: (v.sparkTempC - 20) / (v.bathTempC - 20),
    };
  },
  specimens: [
    { id: "spark", name: "Grinder spark: 0.02 g of steel at 1 000 degrees",
      because: "Very hot, yet only about 9 J above room temperature. There is so little steel that it cools before it can even mark your skin.",
      art: { art: "sphere", color: "#ff8a3d", radius: 0.26, glow: 1 } },
    { id: "bath", name: "Bath: 150 kg of water at 40 degrees",
      because: "Barely warm, but about 12 600 000 J above room temperature: 1.4 million times the spark. Mass and specific heat capacity do the counting.",
      art: { art: "glassware", which: "beaker", level: 0.78 } },
  ],
  /*
   * Colour is temperature and only temperature, which is exactly the trap this
   * comparison is built on. The spark runs the blackbody sequence a smith
   * reads by eye — dull red near 600 degrees, orange at 1 000, yellow-white
   * above 1 300 — while the bath never leaves tepid blue. Below about 500
   * degrees the spark stops glowing altogether and is just a grey speck of
   * steel. The bath is the one that fills the beaker.
   */
  drive: ({ v, f, index, t }) => {
    if (index === 0) {
      const hot = v.sparkTempC;
      return {
        color: hot < 500 ? "#6f6a78" : hot < 800 ? "#c94a2c" : hot < 1150 ? "#ff8a3d" : "#ffe6a8",
        glow: Math.max(0, (hot - 450) / 950),
        scale: 0.55 + 0.12 * Math.sin(t * 7),
        rate: 2.4,
      };
    }
    return {
      level: 0.5 + (v.bathTempC - 22) / 46,
      color: v.bathTempC > 41 ? "#8fb6d8" : "#7fa8c8",
      bubbles: Math.max(0, (v.bathTempC - 38) / 14),
      glow: Math.min(0.35, f.bathEnergyMJ / 40),
      rate: 0.5,
    };
  },
};

/* C2.6 — Measuring temperature. */
const INSIDE_A_THERMOMETER: ArchetypeSpec = {
  id: "g6c2-inside-a-thermo",
  title: "What a Thermometer Actually Reads",
  tagline: "It never measures the water. It measures itself, once it has caught up.",
  kind: "explore",
  subject: "chemistry",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Explain how a liquid-in-glass thermometer turns expansion into a reading.",
    "Describe the fixed points that define the Celsius and Kelvin scales.",
  ],
  misconceptions: ["A thermometer reads the temperature of an object instantly"],
  specimens: [
    {
      id: "thermo", name: "Liquid-in-glass thermometer",
      art: { art: "glassware", which: "testTube", level: 0.35, color: "#c0392b" },
      parts: [
        { id: "bulb", name: "The bulb", at: [0.02, 0.4],
          note: "A thin-walled reservoir of dyed alcohol. All the expansion happens here, which is why the bulb must be fully immersed." },
        { id: "bore", name: "The narrow bore", at: [-0.26, 0.06],
          note: "The tube is finer than a hair, so a tiny change in volume drives the column a long way. That is the amplifier." },
        { id: "fixed", name: "The fixed points", at: [0.34, -0.02],
          note: "0 degrees is melting ice, 100 degrees is steam over boiling water at normal pressure. Everything between is divided evenly." },
        { id: "read", name: "Reading it", at: [-0.32, -0.24],
          note: "Eye level with the top of the column, and read while it is still in the liquid. Lift it out and it starts reading the room." },
        { id: "kelvin", name: "The Kelvin scale", at: [0.3, -0.3],
          note: "Same size of degree, different zero: 0 K is -273.15 degrees C, the point where particle motion is at its minimum." },
        { id: "equilibrium", name: "Why it takes time", at: [-0.04, -0.44],
          note: "Energy has to flow into the bulb until thermometer and liquid reach the same temperature. Read too soon and you read the journey, not the answer." },
      ],
    },
  ],
  /*
   * A thermometer that never moves teaches nothing. This one is dropped into
   * hot water every twenty seconds and left to come to equilibrium: the column
   * climbs fast at first and then ever more slowly, on the exponential
   * approach that real thermal contact gives, and settles just short of the
   * final reading. That last slow crawl is the whole point of the
   * "why it takes time" label.
   */
  drive: ({ t }) => {
    const u = (t % 20) / 20;
    const settled = 1 - Math.exp(-u * 6);
    return { level: 0.18 + settled * 0.6, color: "#c0392b", rate: 0.3 };
  },
};

export const g6c2CutItAgain = buildSim(CUT_IT_AGAIN);
export const g6c2HowASmell = buildSim(HOW_A_SMELL);
export const g6c2SolidLiquidGas = buildSim(SOLID_LIQUID_GAS);
export const g6c2HowFast = buildSim(HOW_FAST);
export const g6c2SparkAndBath = buildSim(SPARK_AND_BATH);
export const g6c2InsideAThermo = buildSim(INSIDE_A_THERMOMETER);
