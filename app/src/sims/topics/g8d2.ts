import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit D · Topic D2 — Reflection, absorption and transmission.
 *
 * Five simulations, one per subtopic:
 *
 *   D2.1  g8d2-three-doors        the three outcomes at a boundary   (sort)
 *   D2.2  g8d2-half-gets-through  modelling the three shares         (investigate)
 *   D2.3  g8d2-under-one-lamp     why an object looks a colour       (compare)
 *   D2.4  g8d2-the-rising-coin    refraction, introduced             (investigate)
 *   D2.5  g8d2-the-black-sheet    reading an interaction from evidence (process)
 *
 * The three shares always add to the light that arrived — that is the spine of
 * the topic and D2.2 makes it arithmetic: Fresnel's 4.26 per cent at each
 * air-glass surface for n = 1.52, an internal transmission that halves every
 * 5 mm, and whatever is left over is what warmed the glass.
 *
 * D2.3 is the one that changes a student's mind. A tomato is not red; it is a
 * surface that sends back long wavelengths and swallows short ones, and under a
 * 450 nm lamp it is simply black. Both objects here are lit by the same lamp
 * and both answer the wavelength slider, so the pair swap places as it sweeps.
 */

/* ---------------------------------------------------------------- *
 * Shared helpers
 * ---------------------------------------------------------------- */

/**
 * A visible wavelength in nanometres as sRGB, matching `wavelengthColor` in
 * the UI wave kit so a 589 nm lamp is the same sodium yellow wherever it is
 * drawn. Outside 380-780 nm the eye has no response and the return is only
 * indicative.
 */
function visibleColor(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 58 / 255; g = 26 / 255; b = 96 / 255; }
  else if (nm > 780) { r = 96 / 255; g = 22 / 255; b = 18 / 255; }
  else {
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.45 + (0.55 * (nm - 380)) / 40;
    else if (nm > 700) f = 0.45 + (0.55 * (780 - nm)) / 80;
    r = Math.pow(Math.max(0, r) * f, 0.78);
    g = Math.pow(Math.max(0, g) * f, 0.78);
    b = Math.pow(Math.max(0, b) * f, 0.78);
  }
  const h = (v: number) => Math.round(255 * (v < 0 ? 0 : v > 1 ? 1 : v)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Scale a hex colour's brightness. `k` of 0 is black, 1 leaves it alone. */
function dim(hex: string, k: number): string {
  const f = k < 0 ? 0 : k > 1 ? 1 : k;
  const h = (v: number) => Math.round(v * f).toString(16).padStart(2, "0");
  return `#${h(parseInt(hex.slice(1, 3), 16))}${h(parseInt(hex.slice(3, 5), 16))}${h(parseInt(hex.slice(5, 7), 16))}`;
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

/** Round a 0-1 driver onto sixteen steps, so the lit-geometry cache stays small. */
function step16(v: number): number {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return Math.round(c * 16) / 16;
}

/** Snap a wavelength to 5 nm, for the same reason. */
function step5nm(nm: number): number {
  return Math.round(nm / 5) * 5;
}

const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- *
 * D2.1 — Three outcomes at a boundary
 * ---------------------------------------------------------------- */

const THREE_DOORS: ArchetypeSpec = {
  id: "g8d2-three-doors",
  title: "Three Doors at Every Surface",
  tagline: "Light arriving at a boundary can bounce, be swallowed, or carry on. Say which one wins.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Name reflection, absorption and transmission as the three things a wave can do at a boundary.",
    "Explain that the three shares always add up to the energy that arrived.",
  ],
  misconceptions: [
    "A material either reflects light or lets it through, never both",
    "Absorbed light has been destroyed",
  ],
  categories: [
    { id: "reflect", name: "Mostly reflected", hint: "sent back into the material it came from" },
    { id: "absorb", name: "Mostly absorbed", hint: "taken up and turned into warmth" },
    { id: "transmit", name: "Mostly transmitted", hint: "carries on through the far side" },
  ],
  specimens: [
    {
      id: "mirror", name: "A silvered bathroom mirror", category: "reflect",
      because: "An aluminium film returns about 90 per cent of the visible light that reaches it. The missing 10 per cent is absorbed by the metal and warms it, which is why a mirror is never a perfect one.",
      art: { art: "sphere", color: "#e2e7ef", radius: 0.44, glow: 0.5 },
    },
    {
      id: "black", name: "Matt black paper", category: "absorb",
      because: "It sends back only about 4 per cent, and the other 96 per cent becomes heat in the fibres. Nothing is destroyed: 300 W per square metre of sunlight arrives and 288 W of it leaves again as infrared.",
      art: { art: "sphere", color: "#14141a", radius: 0.44 },
    },
    {
      id: "window", name: "A clean 4 mm window pane", category: "transmit",
      because: "Glass of n = 1.52 reflects 4.26 per cent at each surface and absorbs a little in between, so about 90 per cent goes straight through. You can see both the street and your own faint reflection at once.",
      art: { art: "glassware", which: "beaker", level: 0.9, color: "#dff0f7" },
    },
    {
      id: "microwave", name: "A cup of water in a microwave oven", category: "absorb",
      because: "Water molecules answer a 2.45 GHz field, and the energy ends as heat. 700 W for 60 s puts 42 000 J into 250 g, which is 42 000 / (0.250 x 4 184) = 40 degrees of warming.",
      art: { art: "glassware", which: "testTube", level: 0.7, color: "#4aa3d8" },
    },
    {
      id: "radar", name: "Radar meeting an aircraft's aluminium skin", category: "reflect",
      because: "A 10 GHz wave cannot get into a good conductor; the free electrons cancel it within a few micrometres and re-radiate it. That returned echo is the entire basis of radar.",
      art: { art: "sphere", color: "#9aa7bb", radius: 0.42, glow: 0.3 },
    },
    {
      id: "xray", name: "An X-ray meeting soft tissue", category: "transmit",
      because: "Muscle and fat are made of light atoms and pass most of the beam. Bone holds calcium, which is far heavier and absorbs it, so the film records the shadow of the parts that did not transmit.",
      art: { art: "sphere", color: "#f0d9cf", radius: 0.44 },
    },
  ],
  /*
   * The tray breathes gently, on a phase hashed from the specimen index so the
   * six do not beat in unison. It deliberately carries no clue about which bin
   * a specimen belongs in — the evidence here is what the caption says the
   * meter read, not how the sample moves.
   */
  drive: ({ t, index }) => ({
    scale: 1 + 0.035 * Math.sin(t * 1.1 + index * 1.7),
  }),
};

/* ---------------------------------------------------------------- *
 * D2.2 — Modelling absorption, reflection and transmission
 * ---------------------------------------------------------------- */

const HALF_GETS_THROUGH: ArchetypeSpec = {
  id: "g8d2-half-gets-through",
  title: "Half Gets Through, Then Half of That",
  tagline: "Stack the filter thicker and account for every watt: bounced, swallowed, or out the far side.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Model a wave meeting a material as three shares that add to the incident power.",
    "Describe absorption as a halving with each fixed thickness rather than a steady subtraction.",
  ],
  misconceptions: [
    "Doubling the thickness of a filter stops twice as much light",
    "A transparent material does not reflect at all",
  ],
  specimens: [
    {
      id: "filter", name: "The tinted filter the beam has to cross",
      art: { art: "glassware", which: "beaker", level: 0.88, color: "#dceefb" },
    },
  ],
  variables: [
    { key: "thickness", label: "Filter thickness (mm)", min: 0, max: 20, step: 0.5, default: 4 },
    { key: "incidentPower", label: "Power arriving (W)", min: 0.5, max: 20, step: 0.5, default: 5 },
  ],
  /*
   * Two pieces of real physics, kept apart.
   *
   * Surfaces. Fresnel at normal incidence for glass of n = 1.52 gives
   * R = ((1.52 - 1) / (1.52 + 1))^2 = 0.04258, so 4.26 per cent bounces off the
   * front face before any of it has entered the glass, and the same fraction
   * bounces off the back face on the way out.
   *
   * The bulk. This tint has a half-value thickness of 5.00 mm, so the internal
   * transmission is 0.5^(d/5): 5 mm passes half, 10 mm a quarter, 20 mm a
   * sixteenth. Absorption is a repeated halving, never a steady subtraction,
   * which is why the graph is a curve that never quite reaches zero.
   *
   * Whatever the two surfaces did not reflect and the far side did not receive
   * is what stayed behind as warmth, so the three readings always add back to
   * the power that arrived.
   */
  measure: (v) => {
    const R = 0.042580;
    const internal = Math.pow(0.5, v.thickness / 5);
    const p = v.incidentPower;
    const reflected = p * R + p * (1 - R) * internal * R;
    const transmitted = p * (1 - R) * (1 - R) * internal;
    return {
      internalTransmissionPercent: internal * 100,
      transmittedW: transmitted,
      reflectedW: reflected,
      absorbedW: p - reflected - transmitted,
      transmittedPercent: (transmitted / p) * 100,
      surfaceReflectionPercent: R * 100,
    };
  },
  plot: {
    x: "thickness", y: "transmittedPercent",
    xLabel: "Filter thickness (mm)", yLabel: "Light out the far side (%)",
  },
  /*
   * The filter is the readout. Its tint follows the internal transmission, so
   * a 0 mm filter is water-clear, a 5 mm one is halfway to black and a 20 mm
   * one is nearly opaque; and the block itself grows as it is stacked thicker,
   * so the two cues agree.
   */
  drive: ({ v, f }) => ({
    color: mix("#eef8ff", "#0a1420", step16(1 - f.internalTransmissionPercent / 100)),
    scale: 0.72 + 0.28 * (v.thickness / 20),
    level: 0.88,
  }),
};

/* ---------------------------------------------------------------- *
 * D2.3 — Why an object looks a particular colour
 * ---------------------------------------------------------------- */

const UNDER_ONE_LAMP: ArchetypeSpec = {
  id: "g8d2-under-one-lamp",
  title: "Under One Lamp",
  tagline: "Sweep the lamp through the spectrum. Watch a red tomato go black and a blue mug light up.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Explain an object's colour as the wavelengths it reflects rather than a property it owns.",
    "Predict how an object will look under a narrow-band lamp of a given wavelength.",
  ],
  misconceptions: [
    "A red object contains red light and gives it out",
    "An object keeps its colour whatever light falls on it",
  ],
  specimens: [
    {
      id: "tomato",
      name: "A red tomato",
      because: "Its skin sends back 85 per cent of anything past 620 nm and only 5 per cent below 560 nm. Under a blue lamp there is nothing for it to reflect, so it goes black — it never had any red of its own.",
      art: { art: "sphere", color: "#c8342c", radius: 0.46 },
    },
    {
      id: "mug",
      name: "A blue mug",
      because: "The opposite glaze: 80 per cent below 470 nm and 5 per cent past 540 nm. The two objects trade places as the lamp sweeps, and under a 550 nm lamp both look like dull olive.",
      art: { art: "sphere", color: "#2f5fd0", radius: 0.44 },
    },
  ],
  variables: [
    { key: "lampWavelength", label: "Lamp wavelength (nm)", min: 380, max: 740, step: 5, default: 550 },
    { key: "lampPower", label: "Lamp power (W)", min: 1, max: 50, step: 1, default: 12 },
  ],
  /*
   * The two reflectance curves are the objects' stated specification: the
   * tomato holds 5 per cent up to 560 nm and rises linearly to 85 per cent by
   * 620 nm; the mug holds 80 per cent up to 470 nm and falls linearly to 5 per
   * cent by 540 nm. Everything else here is exact:
   *
   *   frequency        f = c / lambda, c = 2.998 x 10^8 m/s
   *   photon energy    E = 1239.84 / lambda(nm)  electronvolts
   *
   * so a 550 nm lamp is 545 THz and 2.25 eV per photon.
   */
  measure: (v) => {
    const nm = v.lampWavelength;
    const red = nm <= 560 ? 0.05 : nm >= 620 ? 0.85 : 0.05 + (0.8 * (nm - 560)) / 60;
    const blue = nm <= 470 ? 0.8 : nm >= 540 ? 0.05 : 0.8 - (0.75 * (nm - 470)) / 70;
    return {
      tomatoReflectancePercent: red * 100,
      mugReflectancePercent: blue * 100,
      tomatoReflectedW: red * v.lampPower,
      mugReflectedW: blue * v.lampPower,
      frequencyThz: 299792.458 / nm,
      photonEnergyEv: 1239.84 / nm,
    };
  },
  /*
   * Each object is painted with the light it actually sends back: the lamp's
   * own colour at that wavelength, dimmed by that object's reflectance there.
   * Reflect five per cent and you are nearly black however bright the lamp is,
   * which is the whole lesson and cannot be told any other way.
   */
  drive: ({ v, f, index }) => {
    const lamp = visibleColor(step5nm(v.lampWavelength));
    const share = (index === 0 ? f.tomatoReflectancePercent : f.mugReflectancePercent) / 100;
    return {
      color: dim(lamp, step16(share)),
      scale: 0.86 + 0.22 * share,
    };
  },
};

/* ---------------------------------------------------------------- *
 * D2.4 — Refraction, introduced
 * ---------------------------------------------------------------- */

const THE_RISING_COIN: ArchetypeSpec = {
  id: "g8d2-the-rising-coin",
  title: "The Coin That Rises",
  tagline: "A coin 12 cm down in water looks 9 cm down. Change the liquid and watch it climb.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Explain refraction as a change of wave speed at a boundary, and use Snell's law to find the new angle.",
    "Predict the apparent depth of an object as the real depth divided by the refractive index.",
  ],
  misconceptions: [
    "Light bends because the boundary pushes it",
    "The bent pencil in a glass of water is an illusion of the eye rather than a real change of direction",
  ],
  specimens: [
    {
      id: "coin", name: "A brass coin on the bottom, 12 cm down",
      art: { art: "sphere", color: "#e8c25a", radius: 0.38 },
    },
  ],
  variables: [
    { key: "refractiveIndex", label: "Refractive index of the liquid", min: 1, max: 2.42, step: 0.01, default: 1.33 },
    { key: "incidenceAngle", label: "Angle of the ray in air (degrees)", min: 0, max: 85, step: 1, default: 45 },
  ],
  /*
   * Real indices, so the slider is a shelf of real materials: air 1.000,
   * water 1.333, glycerol 1.473, crown glass 1.52, sapphire 1.77, diamond
   * 2.417.
   *
   *   Snell            n1 sin i = n2 sin r,  n1 = 1 for air
   *   speed inside     v = c / n,  c = 299 792 458 m/s
   *   critical angle   sin C = 1 / n, looking back out from inside
   *   apparent depth   d' = d / n for a near-vertical view
   *
   * Water at 1.333 slows light to 2.25 x 10^8 m/s, bends a 45 degree ray to
   * 32.0 degrees, and lifts a 12 cm coin to 9.0 cm. Diamond bends the same ray
   * to 17.0 degrees and lifts the coin to 5.0 cm.
   */
  measure: (v) => {
    const n = v.refractiveIndex;
    const i = (v.incidenceAngle * Math.PI) / 180;
    const r = Math.asin(Math.min(1, Math.sin(i) / n));
    const rDeg = (r * 180) / Math.PI;
    return {
      refractionAngleDeg: rDeg,
      bendingDeg: v.incidenceAngle - rDeg,
      speedInLiquidMs: 299792458 / n,
      criticalAngleDeg: n <= 1 ? 90 : (Math.asin(1 / n) * 180) / Math.PI,
      apparentDepthCm: 12 / n,
      surfaceReflectionPercent: Math.pow((n - 1) / (n + 1), 2) * 100,
    };
  },
  plot: {
    x: "incidenceAngle", y: "refractionAngleDeg",
    xLabel: "Angle in air (degrees)", yLabel: "Angle in the liquid (degrees)",
  },
  /*
   * The coin is the readout, and it does exactly what a real coin does.
   *
   * Apparent depth is d / n, so the coin climbs by d(1 - 1/n) of its own depth
   * — nothing in air, a quarter of the way up in water, more than half in
   * diamond. Because it now sits nearer the eye it also subtends a larger
   * angle: with the eye 25 cm above a 12 cm depth the magnification is
   * (25 + 12) / (25 + 12/n), which is 1.09 in water and 1.24 in diamond. And
   * the brighter the surface reflection, the less of the coin's light survives
   * two crossings, so it dims as the liquid gets denser.
   */
  drive: ({ v, f }) => {
    const n = v.refractiveIndex;
    const survives = Math.pow(1 - f.surfaceReflectionPercent / 100, 2);
    return {
      offset: [0, -0.9 * (1 - 1 / n)],
      scale: (0.8 * 37) / (25 + 12 / n),
      color: dim("#f0c95e", step16(0.4 + 0.6 * survives)),
    };
  },
};

/* ---------------------------------------------------------------- *
 * D2.5 — Reading a wave-material interaction from evidence
 * ---------------------------------------------------------------- */

const THE_BLACK_SHEET: ArchetypeSpec = {
  id: "g8d2-the-black-sheet",
  title: "The Sheet That Is Not Black",
  tagline: "One sample, four measurements, and a conclusion nobody could have guessed by looking.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS4-2"] },
  learningGoals: [
    "Use measurements of reflected, absorbed and transmitted power to identify what a material does to a wave.",
    "Explain that a material's behaviour is stated for a wavelength, not for light in general.",
  ],
  misconceptions: [
    "Black means a material absorbs every kind of wave",
    "If you cannot see through something, nothing gets through",
  ],
  specimens: [
    {
      id: "sheet", name: "The 1 mm sample under test",
      art: { art: "sphere", color: "#15151b", radius: 0.46 },
    },
  ],
  /*
   * The numbers are a real infrared-pass filter, of the kind cut from the
   * window of a television remote. Every stage quotes what a meter read, and
   * the shares add up: 1.3 per cent back, 98.7 per cent in at 532 nm, and
   * 78 per cent straight through at 940 nm.
   */
  stages: [
    {
      name: "The sample", at: 0,
      caption: "A 1 mm sheet that looks matt black from every angle, under every lamp in the room. Looking is not a measurement, so the meters come out.",
    },
    {
      name: "Rule out reflection", at: 0.25,
      caption: "300 W per square metre in, 4 W per square metre back: 1.3 per cent reflected. Whatever the sheet does with the light, it is not sending it back at you.",
    },
    {
      name: "Test the visible", at: 0.5,
      caption: "A 1.00 mW green laser at 532 nm on one side reads 0.00 mW on the other. Nothing visible is transmitted, so at 532 nm the sheet absorbs 98.7 per cent and warms up.",
    },
    {
      name: "Test the infrared", at: 0.75,
      caption: "Aim a remote's 940 nm LED through it and a phone camera sees the flashes clearly. The thermopile reads 0.78 mW out of 1.00 mW in: 78 per cent transmitted.",
    },
    {
      name: "Say what it is", at: 1,
      caption: "It reflects about 1 per cent, absorbs 99 per cent of visible light and transmits 78 per cent of near infrared. It is an infrared-pass filter, and black only ever described one octave of the spectrum.",
    },
  ],
  /*
   * The sample sits on the bench and warms very slightly under the lamp, which
   * is all it is allowed to do: this simulation's job is the reasoning, not the
   * apparatus, and a sheet that danced would be lying about what it is.
   */
  drive: ({ t }) => ({
    color: mix("#15151b", "#26202a", 0.5 + 0.5 * Math.sin((TAU * t) / 6)),
    scale: 1 + 0.02 * Math.sin((TAU * t) / 6),
  }),
};

export const g8d2ThreeDoors = buildSim(THREE_DOORS);
export const g8d2HalfGetsThrough = buildSim(HALF_GETS_THROUGH);
export const g8d2UnderOneLamp = buildSim(UNDER_ONE_LAMP);
export const g8d2TheRisingCoin = buildSim(THE_RISING_COIN);
export const g8d2TheBlackSheet = buildSim(THE_BLACK_SHEET);
