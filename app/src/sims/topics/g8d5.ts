import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit D · Topic D5 — Analog and digital signals.
 *
 * Five simulations, one per subtopic:
 *
 *   D5.1  g8d5-two-ways-to-say-it   how each one encodes information   (compare)
 *   D5.2  g8d5-the-cliff-edge       why digitised signals survive      (investigate)
 *   D5.3  g8d5-seven-for-four       noise and error correction         (process)
 *   D5.4  g8d5-copper-or-glass      analysing competing designs        (compare)
 *   D5.5  g8d5-build-the-link       integrating a whole device         (assemble)
 *
 * The whole topic turns on one number: half the spacing between two levels. A
 * digital repeater can be handed a symbol buried in noise and put back the
 * exact original, and it can do that until the noise exceeds half a step —
 * after which it puts back the wrong symbol with total confidence. Everything
 * else, the coding, the choice of cable, the design trade-offs, is built on
 * that cliff, and D5.2 exists to let a student walk up to it and over it.
 *
 * Three bits, eight levels, a spacing of 100/7 = 14.29 per cent and a threshold
 * of 7.14 per cent: those are the numbers the sims share.
 */

/* ---------------------------------------------------------------- *
 * Shared helpers
 * ---------------------------------------------------------------- */

/** Blend two hex colours. */
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

/** Keep a value inside 0 and 1. */
function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/* ---------------------------------------------------------------- *
 * D5.1 — How each signal encodes information
 * ---------------------------------------------------------------- */

const TWO_WAYS_TO_SAY_IT: ArchetypeSpec = {
  id: "g8d5-two-ways-to-say-it",
  title: "Two Ways to Say the Same Thing",
  tagline: "One knob, two encodings. One follows it exactly; the other has to round.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-3"] },
  learningGoals: [
    "Describe an analogue signal as a quantity that copies the original continuously, and a digital one as a list of numbers.",
    "Explain that digitising rounds every sample to the nearest of a fixed set of levels.",
  ],
  misconceptions: [
    "A digital signal is just an analogue signal sent by a computer",
    "Digitising a signal loses nothing at all",
  ],
  specimens: [
    {
      id: "analogue",
      name: "Analogue: the voltage copies the sound",
      because: "A microphone's voltage is a scale model of the air pressure, and it can take any value at all. Nothing is rounded, so nothing is thrown away — and nothing can ever be put back either, because there is no correct value to return to.",
      art: { art: "sphere", color: "#8f98a8", radius: 0.46 },
    },
    {
      id: "digital",
      name: "Digital: the nearest of a list of levels",
      because: "Three bits give 2^3 = 8 levels, so the steps are 100/7 = 14.3 per cent apart and no sample is ever more than 7.14 per cent out. Raise it to 8 bits and there are 256 levels, with a worst error of 0.20 per cent.",
      art: { art: "sphere", color: "#4a9fd8", radius: 0.46 },
    },
  ],
  variables: [
    { key: "signalLevel", label: "The sound the microphone hears (% of full scale)", min: 0, max: 100, step: 1, default: 62 },
    { key: "bits", label: "Bits used for each sample", min: 1, max: 8, step: 1, default: 3 },
  ],
  /*
   * Straight arithmetic, all of it checkable.
   *
   *   levels        L = 2^b                 8 for three bits
   *   step          s = 100 / (L - 1)       14.29 per cent
   *   sample        rounded to the nearest multiple of s
   *   worst error   s / 2                   7.14 per cent
   *
   * Telephone speech is sampled 8 000 times a second, so the bit rate is
   * 8 000 x b: 24 kbit/s at three bits and 64 kbit/s at the eight bits a real
   * phone line uses.
   */
  measure: (v) => {
    const levels = Math.pow(2, v.bits);
    const stepSize = 100 / (levels - 1);
    const quantised = Math.round(v.signalLevel / stepSize) * stepSize;
    return {
      levels,
      levelStepPercent: stepSize,
      quantisedPercent: quantised,
      quantisationErrorPercent: Math.abs(v.signalLevel - quantised),
      worstErrorPercent: stepSize / 2,
      bitRateKbps: (8000 * v.bits) / 1000,
    };
  },
  /*
   * Both spheres are the level they are carrying: the analogue one follows the
   * knob exactly and the digital one jumps between the levels it is allowed to
   * hold. At one bit it can only be fully off or fully on, and it visibly snaps
   * halfway across the sweep; at eight bits the two are indistinguishable,
   * which is the honest answer to "how many bits is enough".
   */
  drive: ({ v, f, index }) => {
    const share = clamp01((index === 0 ? v.signalLevel : f.quantisedPercent) / 100);
    return {
      scale: 0.5 + 0.5 * share,
      color: index === 0
        ? mix("#2b2f3a", "#e6ecf5", step16(share))
        : mix("#10243a", "#7fd8ff", step16(share)),
      glow: share * 0.5,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D5.2 — Why digitised signals are more reliable
 * ---------------------------------------------------------------- */

const THE_CLIFF_EDGE: ArchetypeSpec = {
  id: "g8d5-the-cliff-edge",
  title: "The Cliff Edge at Half a Step",
  tagline: "Wind the noise up. The digital copy is perfect, perfect, perfect, and then wrong.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-3"] },
  learningGoals: [
    "Explain that a digital signal can be regenerated exactly while the noise stays under half a level.",
    "Explain that analogue noise accumulates along a chain and can never be removed.",
  ],
  misconceptions: [
    "Digital signals are immune to noise",
    "A signal can be cleaned up by amplifying it",
  ],
  specimens: [
    {
      id: "arriving", name: "The signal arriving after the last repeater",
      art: { art: "sphere", color: "#3fbf7f", radius: 0.46 },
    },
  ],
  variables: [
    { key: "noise", label: "Noise picked up on each hop (% of full scale)", min: 0.5, max: 40, step: 0.5, default: 4 },
    { key: "hops", label: "Repeaters along the route", min: 1, max: 20, step: 1, default: 5 },
  ],
  /*
   * Three bits, so eight levels, spaced 100/7 = 14.286 per cent apart. A
   * repeater decides which level it was sent by taking the nearest, so it gets
   * it exactly right for any noise under half a spacing — 7.143 per cent — and
   * exactly wrong above it. There is nothing in between, and that is the cliff.
   *
   * Analogue has no such rescue. Noise on independent hops adds in quadrature,
   * so after n hops the error is noise x root(n): 4 per cent over 5 hops is
   * 8.9 per cent, over 20 hops 17.9 per cent, and every amplifier on the way
   * has faithfully amplified all of it.
   *
   * Digital failure is quoted as a whole level wrong, because that is what a
   * wrong decision costs: the symbol next door, 14.3 per cent away.
   */
  measure: (v) => {
    const spacing = 100 / 7;
    const threshold = spacing / 2;
    const analogError = v.noise * Math.sqrt(v.hops);
    return {
      levelStepPercent: spacing,
      digitalThresholdPercent: threshold,
      analogErrorPercent: analogError,
      digitalErrorPercent: v.noise < threshold ? 0 : spacing,
      analogSignalToNoiseDb: 20 * Math.log10(100 / analogError),
      digitalIsStillPerfect: v.noise < threshold ? 1 : 0,
    };
  },
  plot: {
    x: "noise", y: "analogErrorPercent",
    xLabel: "Noise per hop (%)", yLabel: "Analogue error at the far end (%)",
  },
  /*
   * The arriving signal is drawn as it is: green and steady while every
   * repeater is still recovering the exact symbol, jittering by the analogue
   * error the same route would have accumulated, and flipping hard to red the
   * moment the noise passes 7.14 per cent and the decisions start coming out
   * wrong. The jitter is deterministic — two irrational-ish frequencies beating
   * against each other — so the same settings always look the same.
   */
  drive: ({ f, t }) => {
    const broken = f.digitalIsStillPerfect === 0;
    const shake = clamp01(f.analogErrorPercent / 60) * 0.45;
    return {
      offset: [Math.sin(t * 13.1) * shake, Math.cos(t * 17.3) * shake],
      color: broken
        ? mix("#e8552f", "#ffd166", step16(Math.abs(Math.sin(t * 4)) * 0.5))
        : mix("#2f8f57", "#6ff0a8", step16(1 - clamp01(f.analogErrorPercent / 60))),
      scale: 0.9,
      glow: broken ? 1 : 0.2,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D5.3 — Noise and error correction, conceptually
 * ---------------------------------------------------------------- */

const SEVEN_FOR_FOUR: ArchetypeSpec = {
  id: "g8d5-seven-for-four",
  title: "Seven Bits to Send Four",
  tagline: "Three spare bits, and the receiver can not only spot the flipped one but name it.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-3"] },
  learningGoals: [
    "Explain how added check bits let a receiver detect and correct an error without asking for a resend.",
    "Weigh the cost of extra bits against the reliability they buy.",
  ],
  misconceptions: [
    "Error correction means asking for the message again",
    "Extra bits are wasted bandwidth",
  ],
  specimens: [
    {
      id: "block", name: "One seven-bit block on its way",
      art: { art: "sphere", color: "#4a9fd8", radius: 0.46 },
    },
  ],
  /*
   * Hamming(7,4), the real code, with real arithmetic behind the last stage.
   * At a raw bit error rate of 1 in 1 000:
   *
   *   uncoded, 4 bits    1 - (1 - p)^4  =  4.0 x 10^-3   (4 words in 1 000)
   *   Hamming, 7 bits    about C(7,2) p^2 = 2.1 x 10^-5  (21 in a million)
   *
   * which is 190 times better for 75 per cent more bits. That trade is the
   * whole subtopic.
   */
  stages: [
    {
      name: "Four bits", at: 0,
      caption: "The message is 1011. Sent as it stands, a single flipped bit anywhere in it arrives as a different message and nothing gives the game away.",
    },
    {
      name: "Add three checks", at: 0.25,
      caption: "Three parity bits are worked out over overlapping groups of the four, making seven. Seven bits to carry four is 75 per cent more to send.",
    },
    {
      name: "Noise flips one", at: 0.5,
      caption: "Bit 5 arrives as a 0 instead of a 1. The receiver has no way of knowing which one moved: it has only the seven bits in front of it.",
    },
    {
      name: "The checks point at it", at: 0.75,
      caption: "Two of the three parity checks fail, and the pattern of which ones reads as binary 101, which is 5. Flip bit 5 back and the block is exactly what was sent.",
    },
    {
      name: "What it bought", at: 1,
      caption: "At one error in a thousand bits, a bare four-bit word is wrong 4 times in 1 000. Coded, it takes two flips in the same seven, about 21 times in a million: 190 times better, for 75 per cent more bits.",
    },
  ],
  /*
   * The block travels while the argument runs, breathing slowly so the stage
   * reads as something in flight rather than a slide. Nothing here is being
   * measured, so nothing here pretends to be.
   */
  drive: ({ t }) => ({
    scale: 0.92 + 0.05 * Math.sin(t * 1.4),
    color: mix("#2f6ea8", "#7fd8ff", 0.5 + 0.5 * Math.sin(t * 0.9)),
    glow: 0.3,
  }),
};

/* ---------------------------------------------------------------- *
 * D5.4 — Analysing competing communication designs
 * ---------------------------------------------------------------- */

const COPPER_OR_GLASS: ArchetypeSpec = {
  id: "g8d5-copper-or-glass",
  title: "Copper or Glass",
  tagline: "Two cables, one distance dial. One of them is dead before the first kilometre.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-3", "MS-ETS1-3"] },
  learningGoals: [
    "Compare two communication designs against a stated criterion and constraint.",
    "Explain why the loss per kilometre, not the starting power, decides how far a link reaches.",
  ],
  misconceptions: [
    "A stronger transmitter can always make up for a lossy cable",
    "Fibre is better because light is faster than electricity",
  ],
  specimens: [
    {
      id: "copper",
      name: "Twisted-pair copper at 100 MHz",
      because: "19.8 dB of loss every 100 m, so 198 dB per kilometre. With a 60 dB budget the signal is under the receiver's floor after 303 m, which is why wired Ethernet is specified to 100 m and no further.",
      art: { art: "sphere", color: "#d99a4e", radius: 0.46 },
    },
    {
      id: "fibre",
      name: "Single-mode fibre at 1 550 nm",
      because: "0.20 dB per kilometre, about a thousandth of the copper. The same 60 dB budget reaches 300 km, and light in glass is actually slower than a signal in copper: it wins on loss, not on speed.",
      art: { art: "sphere", color: "#5fd8ff", radius: 0.46 },
    },
  ],
  variables: [
    { key: "distance", label: "Length of the link (km)", min: 0.02, max: 25, step: 0.02, default: 1 },
    { key: "transmitPower", label: "Power launched into the cable (mW)", min: 0.1, max: 10, step: 0.1, default: 1 },
  ],
  /*
   * Real catalogue figures. Cat6 twisted pair loses 19.8 dB per 100 m at
   * 100 MHz, so 198 dB/km. Single-mode fibre at 1 550 nm loses 0.20 dB/km. The
   * receiver here detects down to 10^-6 mW, which is -60 dBm, so launching
   * 1 mW gives a 60 dB budget.
   *
   *   power out   P x 10^(-loss/10)
   *   reach       budget in dB divided by the loss per km
   *
   * 60 dB of budget is 0.303 km of copper and 300 km of fibre: a factor of a
   * thousand, and it comes entirely from the loss per kilometre.
   */
  measure: (v) => {
    const copperDb = 198 * v.distance;
    const fibreDb = 0.2 * v.distance;
    const budgetDb = 10 * Math.log10(v.transmitPower / 1e-6);
    return {
      copperLossDb: copperDb,
      fibreLossDb: fibreDb,
      copperOutMw: v.transmitPower * Math.pow(10, -copperDb / 10),
      fibreOutMw: v.transmitPower * Math.pow(10, -fibreDb / 10),
      linkBudgetDb: budgetDb,
      copperReachKm: budgetDb / 198,
      fibreReachKm: budgetDb / 0.2,
    };
  },
  /*
   * Each cable's arriving signal is drawn against how much of the link budget
   * it has already spent: bright and full at the near end, dimming and
   * shrinking as the loss mounts, and going dark grey the moment it drops below
   * the receiver's floor and the link is dead. Drag the distance across and the
   * copper is gone within the first centimetre of slider travel while the fibre
   * has barely noticed, which is the comparison in one gesture.
   */
  drive: ({ f, index }) => {
    const used = clamp01((index === 0 ? f.copperLossDb : f.fibreLossDb) / f.linkBudgetDb);
    const alive = used < 1;
    const tone = index === 0 ? "#f0a95c" : "#7fe4ff";
    return {
      scale: 0.95 - 0.45 * used,
      color: alive ? mix("#2a2622", tone, step16(1 - used)) : "#31343c",
      glow: alive ? 1 - used : 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D5.5 — Integrating a wave-based communication device
 * ---------------------------------------------------------------- */

const BUILD_THE_LINK: ArchetypeSpec = {
  id: "g8d5-build-the-link",
  title: "Build the Link",
  tagline: "Seven stages between a voice and an antenna. Leave one out and the link has a hole in it.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-3", "MS-ETS1-3"] },
  learningGoals: [
    "Integrate sampling, coding, modulation and radiation into one working digital radio link.",
    "Justify each stage by the number that sets it, from Nyquist to the quarter-wave antenna.",
  ],
  misconceptions: [
    "A radio simply sends the sound out into the air",
    "Any length of wire will do for an antenna",
  ],
  specimens: [
    {
      id: "rig", name: "A 433 MHz digital voice link on the bench",
      art: { art: "apparatus", which: "stand" },
      /*
       * Every stage is named by the number that fixes it: 8 000 samples a
       * second from Nyquist, 256 levels from eight bits, seven bits for four
       * from Hamming, 691 mm of wavelength from c / f, and 173 mm of antenna
       * from a quarter of that.
       */
      parts: [
        {
          id: "mic", name: "1. Microphone", at: [-0.44, -0.22],
          note: "Turns pressure into voltage. A typical capsule gives about 2 mV for a normal speaking level of 0.2 Pa, and it is the only analogue thing in the whole chain.",
        },
        {
          id: "sampler", name: "2. Filter and sampler", at: [-0.2, -0.42],
          note: "Cut everything above 4 000 Hz, then take 8 000 samples a second. Sample slower than twice the highest frequency and high notes come back as low ones: that is aliasing, and no later stage can undo it.",
        },
        {
          id: "adc", name: "3. Analogue-to-digital converter", at: [0.1, -0.44],
          note: "Eight bits gives 2^8 = 256 levels, so the step is 0.39 per cent of full scale and the worst rounding error is 0.20 per cent. The noise floor that buys is 6.02 x 8 + 1.76 = 49.9 dB down.",
        },
        {
          id: "coder", name: "4. Error-correcting coder", at: [0.42, -0.2],
          note: "Hamming(7,4): every four bits become seven and any single flip is corrected at the far end. The bit rate goes from 8 000 x 8 = 64 kbit/s up to 112 kbit/s, and that 75 per cent is the price of the repair.",
        },
        {
          id: "modulator", name: "5. Modulator and carrier", at: [0.4, 0.24],
          note: "The bits are stamped onto a 433.92 MHz carrier, whose wavelength is 299 792 458 / 433.92e6 = 0.691 m. Bits alone cannot radiate; a carrier can.",
        },
        {
          id: "antenna", name: "6. Quarter-wave antenna", at: [0.06, 0.44],
          note: "0.691 / 4 = 173 mm of wire. Cut it to 50 mm and almost nothing leaves, because an antenna radiates well only when its length matches the wave it is carrying.",
        },
        {
          id: "receiver", name: "7. Receiver, decoder and speaker", at: [-0.34, 0.32],
          note: "Every stage undone in reverse: pick up the carrier, recover the bits, correct the flips, convert back to voltage, smooth the staircase and drive a cone. Miss any one of them and the voice does not arrive.",
        },
      ],
    },
  ],
  /*
   * The rig sits on the bench and turns slowly while it is being built, so the
   * seven stages are read off a solid object rather than a flat diagram.
   */
  drive: ({ t }) => ({
    scale: 0.95,
    spin: 0.5 + t * 0.12,
    tilt: 0.2,
  }),
};

export const g8d5TwoWaysToSayIt = buildSim(TWO_WAYS_TO_SAY_IT);
export const g8d5TheCliffEdge = buildSim(THE_CLIFF_EDGE);
export const g8d5SevenForFour = buildSim(SEVEN_FOR_FOUR);
export const g8d5CopperOrGlass = buildSim(COPPER_OR_GLASS);
export const g8d5BuildTheLink = buildSim(BUILD_THE_LINK);
