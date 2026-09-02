import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit D · Topic D3 — Light and the electromagnetic spectrum.
 *
 * Five simulations, one per subtopic:
 *
 *   D3.1  g8d3-one-narrow-band  visible light as one slice of it   (investigate)
 *   D3.2  g8d3-put-it-in-order  ordering the spectrum              (assemble)
 *   D3.3  g8d3-what-each-does   a real use of each band            (explore)
 *   D3.4  g8d3-all-the-same     one speed in a vacuum, many in glass (investigate)
 *   D3.5  g8d3-one-photon       comparing energy across the spectrum (compare)
 *
 * Three constants hold the whole topic together and every number here comes
 * from them: c = 299 792 458 m/s, c = f x lambda, and E = 1239.84 / lambda(nm)
 * electronvolts. From those, a 100 MHz FM wave is 3.00 m long, a 550 nm green
 * photon carries 2.25 eV, and a 0.1 nm dental X-ray carries 12.4 keV.
 *
 * D3.1 makes the narrowness of the visible band physical rather than stated:
 * the control runs across fourteen decades of wavelength and the specimen is
 * black, brown or steel-grey for almost all of it, bursting into real colour
 * for about two per cent of the slider's travel. That two per cent is the
 * answer to the subtopic.
 */

/* ---------------------------------------------------------------- *
 * Shared helpers
 * ---------------------------------------------------------------- */

/** Speed of light in a vacuum, in metres per second. */
const C = 299792458;

/**
 * A visible wavelength in nanometres as sRGB, matching `wavelengthColor` in
 * the UI wave kit so 589 nm is the same sodium yellow wherever it is drawn.
 */
function visibleColor(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.45 + (0.55 * (nm - 380)) / 40;
  else if (nm > 700) f = 0.45 + (0.55 * (780 - nm)) / 80;
  const h = (v: number) =>
    Math.round(255 * Math.pow(Math.max(0, v) * f, 0.78)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

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

/**
 * A colour for any wavelength on the whole spectrum.
 *
 * Inside 380-740 nm this is the eye's real answer. Outside it there is no
 * colour to report, so each band gets the conventional false colour a printed
 * spectrum chart uses — ember for infrared, deep violet for ultraviolet, cold
 * steel for X-rays. A student can still follow a diagram across the boundary
 * without coming away believing they can see radio.
 */
function emColor(nm: number): string {
  if (nm < 0.01) return "#e6edf6";                                            // gamma
  if (nm < 10) return mix("#b9c7db", "#6d84a4", step16((nm - 0.01) / 10));    // X-ray
  if (nm < 380) return mix("#2e1152", "#8148d6", step16((nm - 10) / 370));    // ultraviolet
  if (nm <= 740) return visibleColor(nm);                                     // visible
  if (nm < 1e6) return mix("#8f2416", "#43140e", step16(Math.log10(nm / 740) / 3.13));
  if (nm < 1e8) return "#6b3a1c";                                             // microwave
  return "#3d2a24";                                                           // radio
}

/** Round a 0-1 driver onto sixteen steps, so the lit-geometry cache stays small. */
function step16(v: number): number {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return Math.round(c * 16) / 16;
}

/** Snap a wavelength to 5 nm, for the same reason. */
function step5nm(nm: number): number {
  return Math.round(nm / 5) * 5;
}

/* ---------------------------------------------------------------- *
 * D3.1 — Visible light as one narrow band
 * ---------------------------------------------------------------- */

const ONE_NARROW_BAND: ArchetypeSpec = {
  id: "g8d3-one-narrow-band",
  title: "One Narrow Band",
  tagline: "Sweep fourteen powers of ten of wavelength. Colour appears for about two per cent of the trip.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Place visible light inside the electromagnetic spectrum and say how small a share of it the eye answers.",
    "Convert between wavelength, frequency and photon energy for any part of the spectrum.",
  ],
  misconceptions: [
    "Light and other electromagnetic waves are different sorts of thing",
    "The spectrum stops where our eyes stop",
  ],
  specimens: [
    {
      id: "sample", name: "The wave at the wavelength you chose",
      art: { art: "sphere", color: "#6d84a4", radius: 0.44 },
    },
  ],
  variables: [
    {
      key: "logWavelength",
      label: "Wavelength, as a power of ten of metres",
      min: -12, max: 2, step: 0.02, default: -6.25,
    },
    { key: "distance", label: "Distance to travel (m)", min: 1, max: 1000, step: 1, default: 100 },
  ],
  /*
   * Fourteen decades on one control, because that is the only way to put a
   * picometre gamma ray and a hundred-metre radio wave on the same ruler; a
   * printed spectrum chart uses a log axis for exactly this reason.
   *
   *   wavelength      lambda = 10^x metres
   *   frequency       f = c / lambda
   *   photon energy   E = 1239.84 / lambda(nm) electronvolts
   *
   * The visible band, 380 nm to 740 nm, is log10(740 / 380) = 0.29 decades
   * wide. Out of fourteen that is 2.1 per cent of the slider, and it is the
   * whole of what an eye can do.
   */
  measure: (v) => {
    const m = Math.pow(10, v.logWavelength);
    const nm = m * 1e9;
    return {
      wavelengthM: m,
      wavelengthNm: nm,
      frequencyHz: C / m,
      log10FrequencyHz: Math.log10(C / m),
      photonEnergyEv: 1239.84 / nm,
      visible: nm >= 380 && nm <= 740 ? 1 : 0,
      travelTimeNs: (v.distance / C) * 1e9,
      visibleShareOfSliderPercent: (Math.log10(740 / 380) / 14) * 100,
    };
  },
  plot: {
    x: "logWavelength", y: "log10FrequencyHz",
    xLabel: "Wavelength (power of ten, m)", yLabel: "Frequency (power of ten, Hz)",
  },
  /*
   * Two cues, both honest. The size is the wavelength on the same log scale the
   * control uses, so a gamma ray is a speck and a radio wave fills the bench.
   * The colour is the eye's real answer inside 380-740 nm and the conventional
   * chart colour outside it, so the specimen is drab across almost the whole
   * sweep and flares into a true rainbow for the two per cent in the middle.
   */
  drive: ({ v, f }) => ({
    scale: 0.3 + (0.7 * (v.logWavelength + 12)) / 14,
    color: emColor(f.visible === 1 ? step5nm(f.wavelengthNm) : f.wavelengthNm),
    glow: f.visible,
  }),
};

/* ---------------------------------------------------------------- *
 * D3.2 — Ordering the spectrum by wavelength and frequency
 * ---------------------------------------------------------------- */

const PUT_IT_IN_ORDER: ArchetypeSpec = {
  id: "g8d3-put-it-in-order",
  title: "Put the Sun's Spectrum in Order",
  tagline: "Seven bands, longest wave on the left. Collect them all and the two rulers run opposite ways.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Order the seven bands of the electromagnetic spectrum by wavelength.",
    "Explain that frequency and photon energy rise as wavelength falls, because c = f x lambda is fixed.",
  ],
  misconceptions: [
    "Radio waves and gamma rays are unrelated phenomena",
    "A band with a bigger number for its wavelength also has a bigger frequency",
  ],
  specimens: [
    {
      id: "sun", name: "The Sun, which emits in all seven",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
      /*
       * Left to right is longest to shortest, and every note carries the same
       * three numbers so the pattern is unmissable: as the wavelength falls by
       * a factor of ten, the frequency and the photon energy rise by ten.
       */
      parts: [
        {
          id: "radio", name: "1. Radio, longer than 0.1 m", at: [-0.45, -0.13],
          note: "Below 3 GHz. An FM station at 100 MHz sends waves 3.00 m long carrying 0.41 microelectronvolts each: it takes about five million of them to match one photon of green light.",
        },
        {
          id: "microwave", name: "2. Microwave, 1 mm to 0.1 m", at: [-0.3, 0.13],
          note: "An oven runs at 2.45 GHz, so its waves are 299 792 458 / 2.45e9 = 122 mm long. Wi-Fi at 5 GHz is 60 mm, which is why a hand can block it.",
        },
        {
          id: "infrared", name: "3. Infrared, 740 nm to 1 mm", at: [-0.15, -0.13],
          note: "A remote control's LED is 940 nm. Your own skin at 37 degrees peaks near 9 400 nm, which is what a thermal camera is built to see.",
        },
        {
          id: "visible", name: "4. Visible, 380 to 740 nm", at: [0, 0.13],
          note: "Less than one octave wide, and the only part the eye answers. Green at 550 nm is 545 THz and 2.25 eV per photon.",
        },
        {
          id: "ultraviolet", name: "5. Ultraviolet, 10 to 380 nm", at: [0.15, -0.13],
          note: "UVB at 300 nm carries 4.13 eV, more than the 3.6 eV that holds a carbon-carbon bond together. That is why it burns skin and green light does not.",
        },
        {
          id: "xray", name: "6. X-ray, 0.01 to 10 nm", at: [0.3, 0.13],
          note: "A dental X-ray at 0.1 nm carries 12 400 eV, about five and a half thousand times a green photon, so it goes straight through soft tissue.",
        },
        {
          id: "gamma", name: "7. Gamma, shorter than 0.01 nm", at: [0.45, -0.13],
          note: "Cobalt-60 emits at 1.33 megaelectronvolts, roughly six hundred thousand times a green photon. Same kind of wave, same speed, six hundred thousand times the punch.",
        },
      ],
    },
  ],
  /*
   * The Sun turns and pulses on a slow six-second breath while the bands are
   * collected. It is the source, not a diagram, and it should look like one.
   */
  drive: ({ t }) => ({
    scale: 0.92 + 0.04 * Math.sin(t * 1.05),
    spin: t * 0.18,
    glow: 1,
  }),
};

/* ---------------------------------------------------------------- *
 * D3.3 — A real use of each band
 * ---------------------------------------------------------------- */

const WHAT_EACH_DOES: ArchetypeSpec = {
  id: "g8d3-what-each-does",
  title: "What Each Band Is Good For",
  tagline: "Six jobs being done on one planet, each by a different part of the same spectrum.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Give a real technology or natural process that uses each band of the spectrum.",
    "Explain why a job is given to a particular band rather than to any other.",
  ],
  misconceptions: [
    "The bands are only different names for the same thing",
    "Any band could be used for any job if the equipment were good enough",
  ],
  specimens: [
    {
      id: "earth", name: "Earth, using all of it at once",
      art: { art: "planet", color: "#2f6fb5", atmosphere: "#8fc7ff" },
      parts: [
        {
          id: "radio", name: "Radio: broadcasting", at: [-0.44, -0.2],
          note: "3.00 m waves at 100 MHz bend around hills and pass through walls, because a wave is only stopped by an obstacle comparable to its own length. That is the whole reason radio reaches you indoors and visible light does not.",
        },
        {
          id: "microwave", name: "Microwave: radar and Wi-Fi", at: [-0.36, 0.26],
          note: "Short enough to make a tight beam from a small dish, long enough to pass through cloud and rain. A 10 GHz radar pulse returning after 60 microseconds puts the aircraft 9.0 km away.",
        },
        {
          id: "infrared", name: "Infrared: seeing heat", at: [0.06, -0.42],
          note: "Everything warm glows in the infrared. A 37 degree body peaks near 9 400 nm, so a thermal camera finds a person in total darkness without a lamp of any kind.",
        },
        {
          id: "visible", name: "Visible: sight and photosynthesis", at: [0.42, -0.16],
          note: "The band the Sun delivers most strongly through the atmosphere, so eyes and chlorophyll both evolved to use it. Chlorophyll absorbs hardest at 430 nm and 662 nm and reflects the green in between.",
        },
        {
          id: "ultraviolet", name: "Ultraviolet: sterilising and vitamin D", at: [0.32, 0.3],
          note: "UVC at 254 nm carries 4.88 eV and wrecks the DNA of bacteria, which is what a sterilising lamp is for. UVB makes vitamin D in skin and causes sunburn with the same photons.",
        },
        {
          id: "xray", name: "X-ray: seeing inside", at: [-0.1, 0.44],
          note: "It passes through light atoms and is stopped by heavy ones, so bone shows against tissue. A chest X-ray delivers about 0.1 millisieverts, roughly ten days of natural background.",
        },
      ],
    },
  ],
  /*
   * The planet turns. Nothing here is being measured, so the drive is doing the
   * one job left to it: making a solid look like a solid rather than a decal.
   */
  drive: ({ t }) => ({ spin: t * 0.16, tilt: 0.22 }),
};

/* ---------------------------------------------------------------- *
 * D3.4 — Why the whole spectrum travels at the same speed in a vacuum
 * ---------------------------------------------------------------- */

const ALL_THE_SAME: ArchetypeSpec = {
  id: "g8d3-all-the-same",
  title: "All the Same Speed, Until It Meets Glass",
  tagline: "Every colour crosses empty space at exactly 299 792 458 m/s. Put glass in the way and they separate.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "State that all electromagnetic waves travel at c in a vacuum, whatever their wavelength.",
    "Explain a rainbow as different wavelengths travelling at different speeds inside a material.",
  ],
  misconceptions: [
    "Blue light travels faster than red light",
    "Light slows down as it gets further from its source",
  ],
  specimens: [
    {
      id: "rod", name: "A 1.00 m rod of N-BK7 glass",
      art: { art: "glassware", which: "testTube", level: 0.92, color: "#8ce85a" },
    },
  ],
  variables: [
    { key: "wavelength", label: "Wavelength of the light (nm)", min: 400, max: 700, step: 5, default: 550 },
    { key: "distance", label: "Distance of empty space to cross (km)", min: 1, max: 400000, step: 100, default: 384400 },
  ],
  /*
   * In a vacuum there is no argument: every wavelength travels at exactly
   * 299 792 458 m/s, so the crossing time depends only on the distance. The
   * Moon at 384 400 km is 1.282 seconds away for red light and for violet
   * light and for a gamma ray alike.
   *
   * Inside glass they part company. The Sellmeier fit for Schott N-BK7 is
   *
   *   n^2 - 1 = sum Bi L^2 / (L^2 - Ci),  L in micrometres
   *   B = 1.03961212, 0.231792344, 1.01046945
   *   C = 0.00600069867, 0.0200179144, 103.560653
   *
   * which returns the catalogue value n = 1.5168 at the 587.6 nm sodium line.
   * Violet at 400 nm sees n = 1.5308 and red at 700 nm sees n = 1.5131, so
   * violet is about 3.5 million m/s slower — and one metre of glass delays it
   * an extra 59 picoseconds. That difference is a rainbow.
   */
  measure: (v) => {
    const L = (v.wavelength / 1000) ** 2;
    const nSq = 1
      + (1.03961212 * L) / (L - 0.00600069867)
      + (0.231792344 * L) / (L - 0.0200179144)
      + (1.01046945 * L) / (L - 103.560653);
    const n = Math.sqrt(nSq);
    return {
      speedInVacuumMs: C,
      refractiveIndexBk7: n,
      speedInGlassMs: C / n,
      vacuumCrossingS: (v.distance * 1000) / C,
      delayPerMetreOfGlassNs: ((n - 1) / C) * 1e9,
      slowedByPercent: (1 - 1 / n) * 100,
    };
  },
  plot: {
    x: "wavelength", y: "speedInGlassMs",
    xLabel: "Wavelength (nm)", yLabel: "Speed inside the glass (m/s)",
  },
  /*
   * The rod carries the colour it is being asked about, taken from the eye's
   * real response, so 400 nm is violet, 550 nm is green and 700 nm is deep red.
   * Nothing else about the rod changes, which is the point: the glass is the
   * same glass, and the only thing that varies is the light in it.
   */
  drive: ({ v }) => ({
    color: visibleColor(step5nm(v.wavelength)),
    level: 0.92,
    scale: 0.95,
  }),
};

/* ---------------------------------------------------------------- *
 * D3.5 — Comparing energy across the spectrum
 * ---------------------------------------------------------------- */

const ONE_PHOTON: ArchetypeSpec = {
  id: "g8d3-one-photon",
  title: "One Photon, Beside a Green One",
  tagline: "Shorten the wavelength and the packet gets hotter. Past 343 nm it can break a bond.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Compare the energy of photons from different bands using E = 1239.84 / lambda in electronvolts.",
    "Explain why a bright red lamp cannot do the damage a dim ultraviolet one does.",
  ],
  misconceptions: [
    "A brighter light always carries more energetic photons",
    "Ultraviolet is dangerous because there is more of it in sunlight",
  ],
  specimens: [
    {
      id: "chosen",
      name: "The photon you chose",
      because: "At 300 nm it carries 4.13 eV, which is more than the 3.61 eV holding a carbon-carbon bond together, so it can break one. At 700 nm it carries 1.77 eV and cannot, however many of them arrive.",
      art: { art: "sphere", color: "#8148d6", radius: 0.46 },
    },
    {
      id: "green",
      name: "A 550 nm green photon, for scale",
      because: "2.25 eV, fixed. A 5 mW green laser pointer therefore sends 1.4 x 10^16 of these every second, and not one of them can break that bond.",
      art: { art: "sphere", color: "#8ce85a", radius: 0.46 },
    },
  ],
  variables: [
    { key: "wavelength", label: "Wavelength of your photon (nm)", min: 100, max: 1000, step: 5, default: 300 },
    { key: "beamPower", label: "Power of the beam (mW)", min: 0.1, max: 100, step: 0.1, default: 5 },
  ],
  /*
   * E(eV) = 1239.84 / lambda(nm) exactly, and 1 eV = 1.602176634 x 10^-19 J by
   * definition. So:
   *
   *   100 nm  ->  12.40 eV, just short of the 12.6 eV that ionises water.
   *   300 nm  ->   4.13 eV, past the 3.61 eV carbon-carbon bond: it breaks it.
   *   343 nm  ->   3.61 eV, exactly the threshold.
   *   550 nm  ->   2.25 eV, the green reference.
   *  1000 nm  ->   1.24 eV, near infrared, felt as warmth and nothing more.
   *
   * The bond figure is the real one: 348 kJ/mol divided by 96.485 kJ/mol per eV
   * gives 3.607 eV. Photon count is beam power divided by photon energy, which
   * is why a 5 mW green pointer can pour out 1.4 x 10^16 photons a second and
   * still break nothing.
   */
  measure: (v) => {
    const ev = 1239.84 / v.wavelength;
    const joules = ev * 1.602176634e-19;
    return {
      photonEnergyEv: ev,
      photonEnergyJ: joules,
      timesAGreenPhoton: 550 / v.wavelength,
      frequencyThz: 299792.458 / v.wavelength,
      photonsPerSecond: (v.beamPower / 1000) / joules,
      breaksACarbonBond: ev >= 3.607 ? 1 : 0,
    };
  },
  /*
   * Both packets are drawn on the same logarithmic energy scale, so the green
   * reference never moves and the chosen photon visibly swells as the
   * wavelength shortens. Its colour is the eye's real answer where the eye has
   * one and the chart's false colour where it does not, so ultraviolet arrives
   * as deep violet and near infrared as a dull ember.
   *
   * Past 3.607 eV — that is, shorter than 343 nm — it flips to a hot white and
   * lights up. That is the threshold the subtopic exists to teach, and crossing
   * it has to be something a student sees happen rather than reads about.
   */
  drive: ({ v, f, index }) => {
    // 1.24 eV at 1000 nm up to 12.40 eV at 100 nm is one decade of energy, and
    // both packets are placed on that same ladder so their sizes are comparable.
    const size = (nm: number) => {
      const rung = Math.log10(1239.84 / nm) - Math.log10(1.2398);
      return 0.45 + 0.6 * (rung < 0 ? 0 : rung > 1 ? 1 : rung);
    };
    if (index === 1) return { color: visibleColor(550), scale: size(550), glow: 0.2 };
    const hot = f.breaksACarbonBond === 1;
    const base = emColor(v.wavelength >= 380 && v.wavelength <= 740
      ? step5nm(v.wavelength) : v.wavelength);
    return {
      scale: size(v.wavelength),
      color: hot ? mix(base, "#fdf6ff", step16((f.photonEnergyEv - 3.607) / 8.8)) : base,
      glow: hot ? 1 : 0.15,
    };
  },
};

export const g8d3OneNarrowBand = buildSim(ONE_NARROW_BAND);
export const g8d3PutItInOrder = buildSim(PUT_IT_IN_ORDER);
export const g8d3WhatEachDoes = buildSim(WHAT_EACH_DOES);
export const g8d3AllTheSame = buildSim(ALL_THE_SAME);
export const g8d3OnePhoton = buildSim(ONE_PHOTON);
