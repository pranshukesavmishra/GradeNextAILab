import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit D · Topic D4 — Sound.
 *
 * Five simulations, one per subtopic:
 *
 *   D4.1  g8d4-pump-the-air-out  sound needs a medium            (investigate)
 *   D4.2  g8d4-pitch-and-push    pitch and loudness              (investigate)
 *   D4.3  g8d4-air-or-water      speed of sound across media     (compare)
 *   D4.4  g8d4-can-you-hear-it   the range of human hearing      (sort)
 *   D4.5  g8d4-there-and-back    echo and ultrasound             (trace)
 *
 * Two constants carry the topic. The speed of sound in air is
 * 331.3 x root(1 + T/273.15) metres per second, which is 343 m/s at 20 degrees
 * and does not depend on pressure at all — the bell jar in D4.1 exists to make
 * that surprising fact measurable. And sound level in decibels is
 * 20 log10(p / 20 micropascals), which puts a 0.2 Pa tone at exactly 80 dB.
 *
 * The bell jar is the drive that matters most here. As the pump runs, the jar
 * empties, the haze thins to nothing and the buzzing stops: the apparatus does
 * the experiment rather than illustrating it.
 */

/* ---------------------------------------------------------------- *
 * Shared helpers
 * ---------------------------------------------------------------- */

/** Blend two hex colours. Cheap enough for `drive` to call every frame. */
function mix(a: string, b: string, k: number): string {
  const t = k < 0 ? 0 : k > 1 ? 1 : k;
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  const c = (i: number) => {
    const av = parseInt(a.slice(i, i + 2), 16), bv = parseInt(b.slice(i, i + 2), 16);
    return h(av + (bv - av) * t);
  };
  return `#${c(1)}${c(3)}${c(5)}`;
}

/** Round a 0-1 driver onto sixteen steps, so the lit-geometry cache stays small. */
function step16(v: number): number {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return Math.round(c * 16) / 16;
}

/** Speed of sound in dry air, exactly, from the ideal-gas relation. */
function airSpeed(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

/* ---------------------------------------------------------------- *
 * D4.1 — Sound as a longitudinal wave needing a medium
 * ---------------------------------------------------------------- */

const PUMP_THE_AIR_OUT: ArchetypeSpec = {
  id: "g8d4-pump-the-air-out",
  title: "Pump the Air Out",
  tagline: "A buzzer still buzzing inside a jar with nothing left in it. Watch the sound die, not the buzzer.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Explain that sound is a longitudinal wave and needs particles to pass it on.",
    "Show that the speed of sound in air depends on temperature but not on pressure.",
  ],
  misconceptions: [
    "Sound travels through a vacuum, just more quietly",
    "Thinner air carries sound faster because there is less to get in the way",
  ],
  specimens: [
    {
      id: "jar", name: "The bell jar, with the buzzer still running",
      art: { art: "glassware", which: "flask", level: 0.85, color: "#bcd8ec", bubbles: 0.8 },
    },
  ],
  variables: [
    { key: "pressure", label: "Air pressure left in the jar (kPa)", min: 0.1, max: 101.3, step: 0.1, default: 101.3 },
    { key: "temperature", label: "Temperature (degrees C)", min: -20, max: 40, step: 1, default: 20 },
  ],
  /*
   * Three exact relations, and one of them is the surprise.
   *
   *   density        rho = p M / R T, with M = 0.028 965 kg/mol for dry air
   *   speed          c = 331.3 x root(1 + T / 273.15), independent of pressure
   *   impedance      z = rho c, which is what couples the buzzer to the glass
   *
   * At 101.3 kPa and 20 degrees that is 1.204 kg/m3, 343.2 m/s and 413 Pa s/m.
   * The transmitted acoustic power goes with the impedance and so with the
   * density, so the level falls by 10 log10(p / 101.3) decibels: an 80 dB
   * buzzer reads 50 dB at 0.1 kPa, and would read nothing at all at zero.
   *
   * The speed reading is the misconception-breaker. Drag the pressure control
   * from one end to the other and it does not move.
   */
  measure: (v) => {
    const t = v.temperature + 273.15;
    const density = (v.pressure * 1000 * 0.0289647) / (8.314462 * t);
    const speed = airSpeed(v.temperature);
    return {
      airDensityKgm3: density,
      speedOfSoundMs: speed,
      acousticImpedancePasm: density * speed,
      soundLevelDb: 80 + 10 * Math.log10(v.pressure / 101.3),
      moleculesPerCm3: (v.pressure * 1000 * 6.02214076e23) / (8.314462 * t) / 1e6,
    };
  },
  plot: {
    x: "pressure", y: "soundLevelDb",
    xLabel: "Pressure in the jar (kPa)", yLabel: "Level heard outside (dB)",
  },
  /*
   * The jar is the experiment. Its filled fraction is the air that is left —
   * drawn as a level because that is how a bell-jar diagram has always shown
   * "how much is still in there" — the haze thins with the density, and the
   * buzzing shown as agitation fades with the transmitted power. At 0.1 kPa the
   * jar is empty, clear and silent while the buzzer is still working perfectly.
   */
  drive: ({ v, f }) => {
    const share = v.pressure / 101.3;
    return {
      level: 0.06 + 0.79 * share,
      color: mix("#e8f4fb", "#7fb4d8", step16(share)),
      bubbles: step16(share) * 0.9,
      scale: 0.95,
      glow: f.soundLevelDb > 75 ? 0.3 : 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D4.2 — Pitch and loudness
 * ---------------------------------------------------------------- */

const PITCH_AND_PUSH: ArchetypeSpec = {
  id: "g8d4-pitch-and-push",
  title: "Pitch Is How Often, Loudness Is How Hard",
  tagline: "Two dials that do completely different things to the same patch of air.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Relate pitch to frequency and loudness to amplitude, and keep the two apart.",
    "Calculate the wavelength of a note in air from 343 m/s divided by its frequency.",
  ],
  misconceptions: [
    "A higher note is a louder note",
    "Turning the volume up makes the sound arrive sooner",
  ],
  specimens: [
    {
      id: "compression", name: "One compression leaving the speaker",
      art: { art: "sphere", color: "#8f5ad8", radius: 0.44 },
    },
  ],
  variables: [
    { key: "frequency", label: "Frequency of the note (Hz)", min: 50, max: 4000, step: 10, default: 440 },
    { key: "amplitude", label: "Pressure amplitude (Pa)", min: 0.002, max: 20, step: 0.002, default: 0.2 },
  ],
  /*
   * Air at 20 degrees, so 343 m/s throughout.
   *
   *   wavelength   lambda = 343 / f     6.86 m at 50 Hz, 8.6 cm at 4 kHz
   *   period       T = 1 / f            2.27 ms for concert A at 440 Hz
   *   level        L = 20 log10(p / 2 x 10^-5)   80 dB at 0.2 Pa
   *   intensity    I = p^2 / (rho c) = p^2 / 413  W/m2
   *
   * 0.2 Pa comes out at 80 dB and 9.7 x 10^-5 W/m2, which is the textbook
   * "busy street" pair. The semitone reading is 12 log2(f / 440), so 880 Hz
   * reads exactly 12: one octave up is twice the frequency.
   */
  measure: (v) => ({
    wavelengthM: 343 / v.frequency,
    periodMs: 1000 / v.frequency,
    soundLevelDb: 20 * Math.log10(v.amplitude / 2e-5),
    intensityWm2: (v.amplitude * v.amplitude) / 413,
    semitonesFromA440: 12 * Math.log2(v.frequency / 440),
  }),
  plot: {
    x: "frequency", y: "wavelengthM",
    xLabel: "Frequency (Hz)", yLabel: "Wavelength in air (m)",
  },
  /*
   * The packet is drawn one wavelength wide on a log scale, because the control
   * covers eighty times the wavelength from end to end and a linear drawing
   * would leave the top three quarters of the slider looking identical. Its
   * brightness is the sound level, running from 40 dB at the quietest setting
   * to 120 dB at the loudest.
   *
   * It does not oscillate. At 440 Hz the air moves back and forth 440 times a
   * second, which a 60 frame animation cannot show without inventing a slow
   * beat that is not there, so this is one compression held still.
   */
  drive: ({ f }) => {
    const rung = (Math.log10(f.wavelengthM) - Math.log10(0.0857)) / (Math.log10(6.86) - Math.log10(0.0857));
    const loud = (f.soundLevelDb - 40) / 80;
    return {
      scale: 0.32 + 0.62 * (rung < 0 ? 0 : rung > 1 ? 1 : rung),
      color: mix("#231c3c", "#f0b6ff", step16(loud)),
      glow: loud,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D4.3 — Speed of sound across media
 * ---------------------------------------------------------------- */

const AIR_OR_WATER: ArchetypeSpec = {
  id: "g8d4-air-or-water",
  title: "Four Times Faster in the Water",
  tagline: "The same shout in two media, and a temperature dial that moves both of them.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "Compare the speed of sound in air, water and steel, and link it to how tightly the particles are held.",
    "Predict the travel time of a sound over a given distance in a given medium.",
  ],
  misconceptions: [
    "Sound travels fastest in air because air is the easiest to push through",
    "Water muffles sound, so it must slow it down",
  ],
  specimens: [
    {
      id: "air",
      name: "A tube of air",
      because: "331.3 x root(1 + T/273.15) metres per second: 343 m/s at 20 degrees. The particles are far apart, so each one travels a long way before it passes the push on.",
      art: { art: "glassware", which: "testTube", level: 0.35, color: "#cfe4ff" },
    },
    {
      id: "water",
      name: "A tube of water",
      because: "1 482 m/s at 20 degrees, over four times as fast. Water is nearly incompressible, so a push is handed on almost the instant it arrives. Steel is faster still at about 5 960 m/s.",
      art: { art: "glassware", which: "testTube", level: 0.88, color: "#1f4fb0" },
    },
  ],
  variables: [
    { key: "temperature", label: "Temperature of both tubes (degrees C)", min: 0, max: 40, step: 1, default: 20 },
    { key: "distance", label: "Distance the sound must cover (m)", min: 1, max: 1000, step: 1, default: 100 },
  ],
  /*
   * Air uses the exact ideal-gas relation. Water uses the standard cubic fit
   *
   *   c = 1402.4 + 5.01 T - 0.055 T^2 + 0.00022 T^3
   *
   * which returns 1 402 m/s at 0 degrees and 1 482 m/s at 20 — the accepted
   * values. Both media speed up as they warm, but they do it for opposite
   * reasons: warm air molecules simply move faster, while warm water is less
   * compressible in the way that matters here.
   *
   * Over 100 m the sound reaches the far end of the air tube in 0.291 s and the
   * far end of the water tube in 0.0675 s.
   */
  measure: (v) => {
    const t = v.temperature;
    const air = airSpeed(t);
    const water = 1402.4 + 5.01 * t - 0.055 * t * t + 0.00022 * t * t * t;
    return {
      speedInAirMs: air,
      speedInWaterMs: water,
      speedInSteelMs: 5960,
      timeThroughAirS: v.distance / air,
      timeThroughWaterS: v.distance / water,
      waterIsFasterByTimes: water / air,
    };
  },
  /*
   * Both tubes carry the temperature as colour, from cold blue at 0 degrees to
   * warm red at 40, because temperature is the one control that moves both of
   * them and the eye should see it acting on both at once. The fill stays where
   * it is: a thin column of gas in one tube and a full column of liquid in the
   * other is the whole reason the two speeds differ.
   */
  drive: ({ v, index }) => {
    const warm = step16(v.temperature / 40);
    if (index === 0) {
      return { color: mix("#cfe4ff", "#ffb9a8", warm), level: 0.35, scale: 0.95 };
    }
    return { color: mix("#1b3f8f", "#b8342a", warm), level: 0.88, scale: 0.95 };
  },
};

/* ---------------------------------------------------------------- *
 * D4.4 — The ear and the range of human hearing
 * ---------------------------------------------------------------- */

/**
 * Wavelength in metres for each source in the tray, so the drive can draw each
 * one to a size that means something. Air at 343 m/s except the medical
 * scanner, which is quoted in soft tissue at 1 540 m/s where it is actually
 * used — 5 MHz would not travel a centimetre in air.
 */
const HEARING_WAVELENGTH: Record<string, number> = {
  surf: 343 / 0.2,
  elephant: 343 / 14,
  organ: 343 / 32.7,
  piano: 343 / 4186,
  whistle: 343 / 23000,
  scanner: 1540 / 5e6,
};

const CAN_YOU_HEAR_IT: ArchetypeSpec = {
  id: "g8d4-can-you-hear-it",
  title: "Can You Hear It?",
  tagline: "Six real sources across seven decades of frequency. Only the middle stretch reaches you.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1"] },
  learningGoals: [
    "State the range of human hearing as roughly 20 Hz to 20 000 Hz and place sources inside or outside it.",
    "Explain that a sound outside the range is a real wave that a human ear cannot convert.",
  ],
  misconceptions: [
    "A sound you cannot hear is not really there",
    "Ultrasound is a different kind of wave from ordinary sound",
  ],
  categories: [
    { id: "infra", name: "Infrasound", hint: "below about 20 Hz" },
    { id: "audible", name: "You can hear it", hint: "roughly 20 Hz to 20 kHz" },
    { id: "ultra", name: "Ultrasound", hint: "above about 20 kHz" },
  ],
  specimens: [
    {
      id: "surf", name: "Ocean swell breaking on a cliff, 0.2 Hz", category: "infra",
      because: "Its wavelength in air is 1 715 m. Microphones on the other side of an ocean record it, and so do earthquake sensors, but the ear has nothing that responds this slowly: you feel it in your chest.",
      art: { art: "sphere", color: "#3f7fb0", radius: 0.46 },
    },
    {
      id: "elephant", name: "An elephant's rumble, 14 Hz", category: "infra",
      because: "Just under the limit. Elephants call at 14 to 24 Hz and answer each other across 10 km, because low frequencies bend around obstacles and lose less over distance. A human standing nearby hears almost nothing.",
      art: { art: "sphere", color: "#8a8078", radius: 0.46 },
    },
    {
      id: "organ", name: "The bottom pipe of a cathedral organ, 32.7 Hz", category: "audible",
      because: "Low C, and inside the range by a comfortable margin. Its wavelength is 343 / 32.7 = 10.5 m, which is why the pipe has to be over five metres long and why you feel the note as much as hear it.",
      art: { art: "sphere", color: "#c9a227", radius: 0.46 },
    },
    {
      id: "piano", name: "The top note of a piano, 4 186 Hz", category: "audible",
      because: "Eight octaves above the organ's low C and still well inside the range, with a wavelength of only 8.2 cm. The ear is at its most sensitive between 2 000 and 5 000 Hz, which is where speech carries its consonants.",
      art: { art: "sphere", color: "#efe6d4", radius: 0.44 },
    },
    {
      id: "whistle", name: "A dog whistle, 23 kHz", category: "ultra",
      because: "Just over the line for an adult, and audible to a dog, which hears to about 45 kHz. A child might catch it: the hair cells at the base of the cochlea answer the highest notes and are the first to be lost, so 20 kHz has usually become 15 kHz by forty.",
      art: { art: "sphere", color: "#b9c7db", radius: 0.42 },
    },
    {
      id: "scanner", name: "A medical scanner, 5 MHz", category: "ultra",
      because: "Two hundred and fifty times the top of hearing. In tissue at 1 540 m/s its wavelength is 0.31 mm, and a scanner cannot resolve anything smaller than about that, which is exactly why a higher frequency buys a sharper picture.",
      art: { art: "sphere", color: "#5ad0c8", radius: 0.4 },
    },
  ],
  /*
   * Each source is drawn to its own wavelength on a log scale, from 1 715 m of
   * ocean swell down to 0.31 mm of scanner pulse — seven decades, which is why
   * the scale has to be logarithmic to fit on a bench at all. Nothing here
   * gives the answer away: the wavelength tells a student how big the wave is,
   * and where the ear's limits fall is the thing they have to know.
   */
  drive: ({ t, specimen, index }) => {
    const lambda = HEARING_WAVELENGTH[specimen.id] ?? 1;
    const rung = (Math.log10(lambda) - Math.log10(3.1e-4)) / (Math.log10(1715) - Math.log10(3.1e-4));
    return {
      scale: (0.45 + 0.5 * rung) * (1 + 0.03 * Math.sin(t * 1.3 + index * 1.9)),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D4.5 — Echo and ultrasound
 * ---------------------------------------------------------------- */

const THERE_AND_BACK: ArchetypeSpec = {
  id: "g8d4-there-and-back",
  title: "There and Back in 0.4 Seconds",
  tagline: "Follow one sonar pulse to the seabed and home again, and read the depth off a stopwatch.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-1", "MS-PS4-3"] },
  learningGoals: [
    "Use the round-trip time of an echo and the speed of sound to work out a distance.",
    "Explain why ultrasound is chosen for imaging when a sharp picture is wanted.",
  ],
  misconceptions: [
    "An echo is a different sound made by the wall",
    "Ultrasound works because it is louder",
  ],
  /*
   * Every number here is a division. Seawater carries sound at about 1 500 m/s,
   * so a 0.400 s round trip is 600 m of travel and 300 m of depth. In air at
   * 343 m/s a cliff 100 m away answers in 0.583 s. Soft tissue carries it at
   * 1 540 m/s, so a 5 MHz scanner works with a 0.31 mm wavelength and cannot
   * resolve anything much finer than that.
   */
  stages: [
    { name: "Ping", at: 0, caption: "The transducer sends one short 0.4 ms pulse straight down and starts a clock." },
    { name: "Down", at: 0.25, caption: "Seawater carries it at about 1 500 m/s. After 0.200 s it has covered 300 m." },
    { name: "Bounce", at: 0.5, caption: "The seabed is a boundary, so part of the energy reflects. Mud returns less than rock, and the strength of the echo says which it is." },
    { name: "Back", at: 0.75, caption: "The return leg takes the same 0.200 s. The clock stops at 0.400 s for a trip of 600 m." },
    { name: "Halve it", at: 1, caption: "Depth is half the round trip: 1 500 x 0.400 / 2 = 300 m. Every echo problem in the topic is this one line." },
  ],
  route: [
    {
      at: [0.12, 0.2], name: "The transducer",
      note: "A crystal that changes shape when a voltage is applied, and produces a voltage when a wave squeezes it. The same crystal sends the pulse and hears the echo, which is why the timing can be trusted.",
    },
    {
      at: [0.3, 0.5], name: "Down through the water",
      note: "Sound in seawater runs at about 1 500 m/s, four and a third times its speed in air. Over 300 m that is 0.200 s, and the pulse spreads only slowly because the beam is narrow.",
    },
    {
      at: [0.5, 0.82], name: "The seabed",
      note: "A boundary between water and rock reflects part of the energy and transmits the rest. That is the same three-way split as light at a window: nothing new is happening, only a different wave.",
    },
    {
      at: [0.68, 0.5], name: "Back to the ship",
      note: "0.200 s up. Total round trip 0.400 s, total path 600 m, so the depth is 300 m. Get the speed wrong by 2 per cent and the chart is wrong by 6 m.",
    },
    {
      at: [0.84, 0.24], name: "The same trick in air",
      note: "Shout at a cliff 100 m away and the echo returns in 2 x 100 / 343 = 0.583 s. A bat does it forty times a second at 45 kHz, whose 7.6 mm wavelength is small enough to pick a moth out of the air.",
    },
    {
      at: [0.9, 0.66], name: "And inside a body",
      note: "Tissue carries sound at 1 540 m/s. At 5 MHz the wavelength is 0.31 mm, and a scanner cannot resolve much finer than one wavelength, so raising the frequency buys detail — at the cost of depth, because high frequencies are absorbed sooner.",
    },
  ],
};

export const g8d4PumpTheAirOut = buildSim(PUMP_THE_AIR_OUT);
export const g8d4PitchAndPush = buildSim(PITCH_AND_PUSH);
export const g8d4AirOrWater = buildSim(AIR_OR_WATER);
export const g8d4CanYouHearIt = buildSim(CAN_YOU_HEAR_IT);
export const g8d4ThereAndBack = buildSim(THERE_AND_BACK);
