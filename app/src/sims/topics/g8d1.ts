import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit D · Topic D1 — Wave properties.
 *
 * Five simulations, one per subtopic:
 *
 *   D1.1  g8d1-four-numbers      amplitude, wavelength, frequency, period  (investigate)
 *   D1.2  g8d1-how-fast-it-runs  wave speed, v = f x lambda                (investigate)
 *   D1.3  g8d1-twice-as-tall     amplitude and the energy carried          (compare)
 *   D1.4  g8d1-across-or-along   transverse and longitudinal               (sort)
 *   D1.5  g8d1-five-readings     modelling wave behaviour from data        (process)
 *
 * One rope carries the first two: 0.0400 kg per metre, so the wave speed is
 * root(T / 0.04) and comes out at whole numbers — 10 m/s at 4 N, 30 m/s at
 * 36 N, 50 m/s at 100 N. Every wavelength on screen is then v / f exactly, and
 * a student can check any reading with a calculator.
 *
 * The pictures answer the controls throughout. In D1.1 the bead of the rope
 * really does swing by the amplitude and really is tinted by how fast it is
 * moving at that instant, so it is brightest crossing the middle and dullest
 * at the crest — which is the hardest thing about simple harmonic motion, shown
 * rather than stated. In D1.4 each specimen moves the way its own kind of wave
 * moves its medium, so the classification is read off the picture.
 */

/* ---------------------------------------------------------------- *
 * Shared helpers
 * ---------------------------------------------------------------- */

/** Mass per metre of the demonstration rope, in kg/m. */
const ROPE_DENSITY = 0.04;

/** Blend two hex colours. Cheap enough to run inside `drive` every frame. */
function mix(a: string, b: string, k: number): string {
  const t = k < 0 ? 0 : k > 1 ? 1 : k;
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(ar + (br - ar) * t)}${h(ag + (bg - ag) * t)}${h(ab + (bb - ab) * t)}`;
}

/**
 * Round a 0-1 driver onto a small ladder of steps.
 *
 * A colour that varies continuously builds a new lit mesh for every shade the
 * slider passes through. Twelve steps is more than the eye separates and keeps
 * the geometry cache to a dozen entries.
 */
function step12(v: number): number {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return Math.round(c * 12) / 12;
}

const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- *
 * D1.1 — Amplitude, wavelength, frequency and period
 * ---------------------------------------------------------------- */

const FOUR_NUMBERS: ArchetypeSpec = {
  id: "g8d1-four-numbers",
  title: "Four Numbers, One Wave",
  tagline: "Watch one bead of the rope. Its swing is the amplitude and its rhythm is the frequency.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Define amplitude, wavelength, frequency and period, and say which of them the medium shows.",
    "Calculate the period as one divided by the frequency, and the wavelength as the speed divided by the frequency.",
  ],
  misconceptions: [
    "The pieces of a rope travel along with the wave",
    "A louder or taller wave must also be a faster one",
  ],
  specimens: [
    {
      id: "bead",
      name: "One bead of the rope",
      art: { art: "sphere", color: "#3a4d8f", radius: 0.42 },
    },
  ],
  variables: [
    { key: "amplitude", label: "Amplitude (cm)", min: 1, max: 20, step: 0.5, default: 8 },
    { key: "frequency", label: "Frequency (Hz)", min: 0.5, max: 8, step: 0.1, default: 3 },
  ],
  /*
   * The rope is 0.0400 kg/m under 5.76 N, so the wave speed is
   * root(5.76 / 0.04) = 12.0 m/s and does not depend on either control. That
   * is the point of the sim: shaking harder changes the amplitude and shaking
   * faster changes the frequency, but the speed the shape travels at is a
   * property of the rope.
   *
   * Period is 1/f. Wavelength is v/f. The bead itself never travels: it runs
   * up and down a fixed line, and its own greatest speed is 2 pi f A, reached
   * as it crosses the rest position, with zero speed at the crest.
   */
  measure: (v) => {
    const a = v.amplitude / 100;
    const w = TAU * v.frequency;
    return {
      periodS: 1 / v.frequency,
      wavelengthM: 12 / v.frequency,
      waveSpeedMs: 12,
      peakBeadSpeedMs: w * a,
      peakBeadAccelMs2: w * w * a,
      swingCm: 2 * v.amplitude,
    };
  },
  plot: {
    x: "frequency", y: "wavelengthM",
    xLabel: "Frequency (Hz)", yLabel: "Wavelength (m)",
  },
  /*
   * The bead is the readout. It is locked to a vertical line and displaced by
   * A sin(2 pi f t), which is the actual motion of a piece of rope, and it is
   * tinted by how fast it is moving right now — |cos| of the same phase, scaled
   * by the amplitude against the widest swing the control allows.
   *
   * So a small amplitude leaves a dark bead barely moving, and a large one
   * gives a bead that flares bright as it rushes through the middle and goes
   * dark as it stops at the crest. Fastest in the middle, stationary at the
   * top, is exactly the fact a sine curve on paper hides.
   */
  drive: ({ v, t }) => {
    const phase = TAU * v.frequency * t;
    const share = v.amplitude / 20;
    return {
      // The bead is drawn a little under full size so that a full swing at
      // 20 cm still lands inside the stage rather than clipping off the top.
      scale: 0.72,
      offset: [0, -share * 0.55 * Math.sin(phase)],
      color: mix("#26315c", "#8ce7ff", step12(share * Math.abs(Math.cos(phase)))),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D1.2 — Wave speed
 * ---------------------------------------------------------------- */

const HOW_FAST_IT_RUNS: ArchetypeSpec = {
  id: "g8d1-how-fast-it-runs",
  title: "How Fast the Shape Runs",
  tagline: "Tighten the rope and the crest sprints. Shake faster and it only crowds up.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Use v = f x lambda to find any one of speed, frequency and wavelength from the other two.",
    "Explain that the medium sets the wave speed, and the source sets the frequency.",
  ],
  misconceptions: [
    "Shaking a rope faster makes the wave travel faster",
    "Wave speed and the speed of the medium's own movement are the same thing",
  ],
  specimens: [
    {
      id: "crest",
      name: "The crest you are following",
      art: { art: "sphere", color: "#e8a33d", radius: 0.42 },
    },
  ],
  variables: [
    { key: "tension", label: "Tension in the rope (N)", min: 4, max: 100, step: 1, default: 36 },
    { key: "frequency", label: "Shaking frequency (Hz)", min: 1, max: 20, step: 0.5, default: 5 },
  ],
  /*
   * v = root(T / mu) with mu = 0.0400 kg/m, so 4 N gives exactly 10 m/s, 36 N
   * gives 30 m/s and 100 N gives 50 m/s. Wavelength is then v / f, and the
   * product f x lambda is returned as its own reading so a student can watch it
   * stay pinned to the speed however the two controls are moved.
   */
  measure: (v) => {
    const speed = Math.sqrt(v.tension / ROPE_DENSITY);
    return {
      waveSpeedMs: speed,
      wavelengthM: speed / v.frequency,
      periodS: 1 / v.frequency,
      frequencyTimesWavelength: v.frequency * (speed / v.frequency),
      timeAcross10mS: 10 / speed,
    };
  },
  plot: {
    x: "tension", y: "waveSpeedMs",
    xLabel: "Tension (N)", yLabel: "Wave speed (m/s)",
  },
  /*
   * A crest is as wide as the wavelength that made it, so the marker is drawn
   * to that width — clamped, because the control range spans 0.5 m to 50 m and
   * nothing useful is learned from a dot or from a crest wider than the bench.
   * It also runs along the rope at the real wave speed, one pass of a 10 m rope
   * taking 10 / v seconds, so tightening the rope visibly hurries it along
   * while shaking faster only packs the crests closer together.
   */
  drive: ({ f, t }) => {
    const along = ((f.waveSpeedMs * t) / 10) % 1;
    const width = f.wavelengthM / 8;
    return {
      scale: 0.28 + 0.5 * (width < 0 ? 0 : width > 1 ? 1 : width),
      offset: [(along - 0.45) * 0.8, 0],
    };
  },
};

/* ---------------------------------------------------------------- *
 * D1.3 — Amplitude and the energy a wave carries
 * ---------------------------------------------------------------- */

const TWICE_AS_TALL: ArchetypeSpec = {
  id: "g8d1-twice-as-tall",
  title: "Twice as Tall, Four Times the Energy",
  tagline: "A one metre swell beside yours. Double the height and you have quadrupled the energy.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Explain that the energy a wave carries goes as the square of its amplitude.",
    "Compare two sea states by energy rather than by height alone.",
  ],
  misconceptions: [
    "A wave twice as tall carries twice the energy",
    "A longer wave is always a more powerful one",
  ],
  specimens: [
    {
      id: "reference",
      name: "The reference: a steady 1.0 m swell",
      because: "Linear wave theory puts the mean energy of a sea at one eighth of rho g H squared. For 1.0 m of seawater that is 0.125 x 1025 x 9.81 x 1 = 1 257 joules under every square metre.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#5aa9cf" },
    },
    {
      id: "yours",
      name: "Your swell",
      because: "Set it to 2.0 m and the energy is 5 028 J per square metre: four times the reference for twice the height. At 4.0 m it is sixteen times, and the tank has gone dark and started to break.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#5aa9cf" },
    },
  ],
  variables: [
    { key: "waveHeight", label: "Height of your swell, crest to trough (m)", min: 0.2, max: 8, step: 0.1, default: 2 },
    { key: "period", label: "Period of your swell (s)", min: 4, max: 14, step: 0.5, default: 8 },
  ],
  /*
   * Deep-water linear theory, with seawater at 1 025 kg/m3 and g = 9.81 N/kg.
   *
   *   mean energy per unit area   E = rho g H^2 / 8        = 1 257 H^2  J/m2
   *   power per metre of crest    P = rho g^2 H^2 T / 64pi = 490.6 H^2 T W/m
   *   wavelength                  L = g T^2 / 2pi          = 1.5613 T^2  m
   *   crest speed                 c = g T / 2pi            = 1.5613 T    m/s
   *
   * A 2 m, 8 s sea therefore carries 15.7 kW along every metre of its crest,
   * which is the right order for a working North Atlantic wave farm.
   */
  measure: (v) => {
    const h = v.waveHeight;
    return {
      energyJm2: (1025 * 9.81 * h * h) / 8,
      referenceEnergyJm2: (1025 * 9.81) / 8,
      energyVsReference: h * h,
      powerPerMetreKwm: (1025 * 9.81 * 9.81 * h * h * v.period) / (64 * Math.PI) / 1000,
      wavelengthM: (9.81 * v.period * v.period) / TAU,
      crestSpeedMs: (9.81 * v.period) / TAU,
    };
  },
  /*
   * Both tanks slosh. The reference is pinned at 1.0 m on an 8 s period and
   * never changes; yours takes its slosh from the height control, darkens as
   * the water column deepens with energy, and starts throwing white water once
   * it is past about a metre — which is roughly where a real sea begins to
   * break. So the left tank is the ruler and the right tank is the reading.
   */
  drive: ({ v, t, index }) => {
    if (index === 0) {
      return {
        level: 0.5 + 0.05 * Math.sin((TAU * t) / 8),
        color: "#5aa9cf",
        bubbles: 0,
      };
    }
    const share = v.waveHeight / 8;
    return {
      level: 0.5 + 0.34 * share * Math.sin((TAU * t) / v.period),
      color: mix("#8fd8ea", "#0d2b4f", step12(share)),
      bubbles: step12((v.waveHeight - 1) / 6),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D1.4 — Transverse and longitudinal waves
 * ---------------------------------------------------------------- */

const ACROSS_OR_ALONG: ArchetypeSpec = {
  id: "g8d1-across-or-along",
  title: "Across, or Along?",
  tagline: "Every wave here travels left to right. Watch which way its medium moves.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Tell a transverse wave from a longitudinal one by the direction the medium moves.",
    "Give an example of each, and say that both carry energy without carrying matter.",
  ],
  misconceptions: [
    "All waves look like a sine curve",
    "Sound and light are the same kind of wave",
  ],
  categories: [
    { id: "transverse", name: "Transverse", hint: "the medium moves across the direction of travel" },
    { id: "longitudinal", name: "Longitudinal", hint: "the medium moves along the direction of travel" },
  ],
  specimens: [
    {
      id: "rope", name: "A rope flicked sideways", category: "transverse",
      because: "Your hand moves across the rope and the pulse runs along it. Every piece of rope stays on its own vertical line: the shape travels, the rope does not.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "sound", name: "Sound in air", category: "longitudinal",
      because: "Air molecules are shoved forwards and spring back along the same line the sound travels, making squashed and stretched patches. At 20 degrees they pass it on at 343 m/s.",
      art: { art: "molecule", formula: "N2" },
    },
    {
      id: "light", name: "Light from a torch", category: "transverse",
      because: "The electric and magnetic fields swing at right angles to the beam, which is why light can be polarised. Nothing has to be there for it to cross: it runs at 3.00 x 10^8 m/s through empty space.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "pwave", name: "A P wave through rock", category: "longitudinal",
      because: "The first arrival of an earthquake squeezes and stretches the rock along its path at about 6 km/s. Being a squeeze, it passes through liquid rock and through the outer core.",
      art: { art: "landform", which: "quake" },
    },
    {
      id: "slinky", name: "One coil of a slinky, pushed end-on", category: "longitudinal",
      because: "Push the end and a bunching runs down the spring. Each coil shuttles forwards and back along the axis and finishes where it started.",
      art: { art: "sphere", color: "#e0483f", radius: 0.4 },
    },
    {
      id: "swave", name: "The shear wave behind it", category: "transverse",
      because: "The second arrival shakes rock sideways at about 3.5 km/s. Liquids cannot be sheared, so this one stops dead at the outer core, which is how we know the core is liquid.",
      art: { art: "sphere", color: "#7a4fc0", radius: 0.4 },
    },
  ],
  /*
   * Every specimen travels left to right, and each one moves its medium the
   * way its own kind of wave does: the transverse ones ride up and down their
   * own line, the longitudinal ones shuttle back and forth along the direction
   * of travel and bunch up as they go.
   *
   * That is not a giveaway, it is the evidence. The whole classification is
   * "watch which way the medium moves", and a still picture cannot show it.
   */
  drive: ({ t, specimen, index }) => {
    // A per-specimen phase, hashed from the index so the tray does not beat in
    // unison, and no two runs differ.
    const phase = t * 2.4 + index * 1.13;
    if (specimen.category === "transverse") {
      return { scale: 0.9, offset: [0, -0.26 * Math.sin(phase)] };
    }
    return {
      offset: [0.26 * Math.sin(phase), 0],
      scale: 0.9 + 0.11 * Math.cos(phase),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D1.5 — Modelling wave behaviour from data
 * ---------------------------------------------------------------- */

const FIVE_READINGS: ArchetypeSpec = {
  id: "g8d1-five-readings",
  title: "From Five Readings to a Model",
  tagline: "A table of wavelengths, a graph that will not straighten, and the number hiding in it.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Build a mathematical model of wave behaviour from measured data rather than from a formula given first.",
    "Recognise an inverse relationship by plotting against the reciprocal and getting a straight line.",
  ],
  misconceptions: [
    "A curved graph means there is no rule behind the data",
    "A model is only worth anything once it matches the textbook",
  ],
  specimens: [
    {
      id: "tank", name: "The ripple tank the readings came from",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#4a9fd8" },
    },
  ],
  /*
   * The five readings are a real rope at 6.00 m/s: 2 Hz with 3.00 m, 3 Hz with
   * 2.00 m, 4 Hz with 1.50 m, 6 Hz with 1.00 m, 8 Hz with 0.75 m. Every pair
   * multiplies to 6.00, which is the model the student is being walked towards,
   * and the check at 5 Hz predicts 1.20 m.
   */
  stages: [
    {
      name: "The readings", at: 0,
      caption: "Five wavelengths at five frequencies: 2 Hz gives 3.00 m, 3 Hz gives 2.00 m, 4 Hz gives 1.50 m, 6 Hz gives 1.00 m, 8 Hz gives 0.75 m.",
    },
    {
      name: "Plot it", at: 0.25,
      caption: "Wavelength against frequency is a falling curve, not a line. Halving the wavelength took four times the frequency, so it is not a simple proportion.",
    },
    {
      name: "Try one over f", at: 0.5,
      caption: "Plot wavelength against 1/f instead and the five points fall on a straight line through the origin. Wavelength is inversely proportional to frequency.",
    },
    {
      name: "Name the gradient", at: 0.75,
      caption: "The gradient is 6.00 m/s, and every pair multiplies to it: 2 x 3.00, 3 x 2.00, 4 x 1.50, 8 x 0.75. The gradient is the wave speed, so lambda = v / f.",
    },
    {
      name: "Test the model", at: 1,
      caption: "The model predicts 6.00 / 5 = 1.20 m at 5 Hz. The tank measures 1.19 m. A model earns its keep by predicting a reading nobody took.",
    },
  ],
  /*
   * The tank keeps rippling while the argument is made, on a slow 2.5 s slosh
   * that is nothing to do with the data — it is there so the bench looks like a
   * bench and not a slide.
   */
  drive: ({ t }) => ({ level: 0.55 + 0.045 * Math.sin((TAU * t) / 2.5) }),
};

export const g8d1FourNumbers = buildSim(FOUR_NUMBERS);
export const g8d1HowFastItRuns = buildSim(HOW_FAST_IT_RUNS);
export const g8d1TwiceAsTall = buildSim(TWICE_AS_TALL);
export const g8d1AcrossOrAlong = buildSim(ACROSS_OR_ALONG);
export const g8d1FiveReadings = buildSim(FIVE_READINGS);
