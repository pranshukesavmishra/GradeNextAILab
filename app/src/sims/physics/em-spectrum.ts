import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { badge, caption, glow, hexA, isDarkTheme, sky, sphere, starfield, vignette } from "@ui/scene";

/**
 * The Electromagnetic Spectrum — Grade 8, Unit D3.
 *
 * One ruler, sixteen powers of ten wide, from kilometre radio waves to gamma
 * rays smaller than an atomic nucleus. Zoom right in and the band our eyes
 * respond to turns out to be a hair's width of the whole thing.
 *
 * Every number is computed from two constants and nothing else: c for the
 * speed and h for the energy. So f = c/λ and E = hf are not captions here,
 * they are how the readouts are produced — including the famous shortcut
 * E(eV) = 1240 / λ(nm), which a student can check by hand.
 *
 * The race strip is the point of D3.4: pulses a factor of 10¹² apart in
 * wavelength are released together and stay exactly level, because in vacuum
 * every one of them travels at 299 792 458 m/s.
 */

/** Wavelength in metres at each band edge, the boundaries used in US texts. */
export interface Band {
  key: string;
  label: string;
  /** Shortest wavelength in the band, m. */
  min: number;
  /** Longest wavelength in the band, m. */
  max: number;
  use: string;
  detail: string;
}

export const BANDS: Band[] = [
  { key: "radio", label: "Radio", min: 1, max: 1e5, use: "Broadcasting and radio telescopes", detail: "An FM station at 100 MHz sends waves about 3 m long." },
  { key: "microwave", label: "Microwave", min: 1e-3, max: 1, use: "Ovens, radar, Wi-Fi and phones", detail: "A microwave oven runs at 2.45 GHz — a wavelength of 12 cm." },
  { key: "infrared", label: "Infrared", min: 7e-7, max: 1e-3, use: "Remote controls and thermal cameras", detail: "A TV remote flashes at about 940 nm, just past what you can see." },
  { key: "visible", label: "Visible", min: 3.8e-7, max: 7e-7, use: "Sight, photography and photosynthesis", detail: "The whole of vision fits between 380 and 700 nm." },
  { key: "ultraviolet", label: "Ultraviolet", min: 1e-8, max: 3.8e-7, use: "Sterilising water and making vitamin D", detail: "UV carries enough energy per photon to damage skin cells." },
  { key: "xray", label: "X-ray", min: 1e-11, max: 1e-8, use: "Seeing bones and airport scanners", detail: "X-rays pass through soft tissue but are stopped by bone." },
  { key: "gamma", label: "Gamma", min: 1e-16, max: 1e-11, use: "Treating tumours and sterilising equipment", detail: "Born in nuclei, with more energy per photon than anything else here." },
];

/** Which band a wavelength falls in. */
export function bandOf(wavelength: number): Band {
  for (const band of BANDS) {
    if (wavelength >= band.min && wavelength < band.max) return band;
  }
  return wavelength >= BANDS[0].max ? BANDS[0] : BANDS[BANDS.length - 1];
}

/** f = c / λ, in hertz. In vacuum, for every band. */
export function frequencyOf(wavelength: number): number {
  return CONSTANTS.c / Math.max(wavelength, 1e-20);
}

/** E = h·f, in joules. */
export function photonEnergy(wavelength: number): number {
  return CONSTANTS.h * frequencyOf(wavelength);
}

/** The same energy in electronvolts — where E(eV) = 1240 / λ(nm). */
export function photonEnergyEV(wavelength: number): number {
  return photonEnergy(wavelength) / CONSTANTS.e;
}

/** Above about 10 eV a photon can tear an electron off an atom. */
export const IONIZING_EV = 10;

/**
 * Fraction of the on-screen ruler occupied by the visible band — the number
 * the whole zoom exercise is about. At full width it is under a hundredth;
 * zoomed right in on the rainbow it approaches one.
 */
export function visibleShare(logCenter: number, span: number): number {
  const lo = logCenter + span / 2;
  const hi = logCenter - span / 2;
  const overlap = Math.min(lo, Math.log10(7e-7)) - Math.max(hi, Math.log10(3.8e-7));
  return Math.max(0, overlap) / Math.max(span, 1e-9);
}

/**
 * The colour a wavelength of visible light actually looks, from the standard
 * piecewise approximation to the CIE response.
 *
 * This is the one place in the sim where colour is not a theme token, and it
 * has to be: the physical appearance of 620 nm light IS the quantity under
 * discussion. Outside 380-750 nm it returns black, because there is nothing
 * to see.
 */
export function visibleColor(wavelengthNm: number): string {
  let r = 0, g = 0, b = 0;
  const w = wavelengthNm;
  if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; }
  else if (w >= 440 && w < 490) { g = (w - 440) / 50; b = 1; }
  else if (w >= 490 && w < 510) { g = 1; b = -(w - 510) / 20; }
  else if (w >= 510 && w < 580) { r = (w - 510) / 70; g = 1; }
  else if (w >= 580 && w < 645) { r = 1; g = -(w - 645) / 65; }
  else if (w >= 645 && w <= 750) { r = 1; }
  // The eye fades out at both ends of the band rather than stopping dead.
  let fade = 1;
  if (w >= 380 && w < 420) fade = 0.3 + (0.7 * (w - 380)) / 40;
  else if (w > 700 && w <= 750) fade = 0.3 + (0.7 * (750 - w)) / 50;
  else if (w < 380 || w > 750) fade = 0;
  const to255 = (v: number) => Math.round(255 * Math.pow(Math.max(0, v) * fade, 0.8));
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

/** Familiar objects to compare a wavelength against, longest first. */
const SIZE_REFS: { size: number; label: string }[] = [
  { size: 1e4, label: "a small city" },
  { size: 300, label: "a skyscraper" },
  { size: 50, label: "a blue whale" },
  { size: 3, label: "a person" },
  { size: 0.12, label: "a fist" },
  { size: 0.01, label: "a fingernail" },
  { size: 1e-3, label: "a pinhead" },
  { size: 1e-5, label: "a red blood cell" },
  { size: 5e-7, label: "a bacterium" },
  { size: 1e-8, label: "a virus" },
  { size: 3e-10, label: "an atom" },
  { size: 1e-14, label: "an atomic nucleus" },
];

export function sizeReference(wavelength: number): string {
  let best = SIZE_REFS[0];
  let bestGap = Infinity;
  for (const ref of SIZE_REFS) {
    const gap = Math.abs(Math.log10(ref.size) - Math.log10(Math.max(wavelength, 1e-20)));
    if (gap < bestGap) { bestGap = gap; best = ref; }
  }
  return best.label;
}

interface State {
  /** Phase of the drawn wave, in cycles. */
  phase: number;
  /** How far the racing pulses have gone, 0-1 of the track. */
  race: number;
  t: number;
}

/** Cycles of the drawn wave per second. The real ones are far too fast. */
const DISPLAY_HZ = 0.55;
/** Seconds for a racing pulse to cross the track. */
const RACE_SECONDS = 2.6;

const model: SimModel<State> = {
  init() {
    return { phase: 0, race: 0, t: 0 };
  },

  step(state, dt) {
    return {
      phase: state.phase + dt * DISPLAY_HZ,
      race: (state.race + dt / RACE_SECONDS) % 1.35,
      t: state.t + dt,
    };
  },

  readouts(_state, params) {
    const lambda = Math.pow(10, params.logWavelength as number);
    return [
      {
        key: "wavelength", label: "Wavelength", quantity: q(lambda, "wavelength"),
        unit: "m", semantic: "wave", graphable: true,
      },
      {
        key: "frequency", label: "Frequency", quantity: q(frequencyOf(lambda), "frequency"),
        unit: "Hz", semantic: "wave", graphable: true,
      },
      {
        key: "speed", label: "Speed in vacuum", quantity: q(CONSTANTS.c, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true,
      },
      {
        key: "energyEV", label: "Energy of one photon", quantity: q(photonEnergy(lambda), "energy"),
        unit: "eV", semantic: "energy-total", graphable: true,
      },
      {
        key: "energyJ", label: "Photon energy in joules", quantity: q(photonEnergy(lambda), "energy"),
        unit: "J", semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
      {
        key: "fLambda", label: "Frequency × wavelength", quantity: q(frequencyOf(lambda) * lambda, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "visibleShare", label: "Of the screen that is visible light",
        quantity: q(visibleShare(params.logWavelength as number, params.zoom as number), "percent"),
        unit: "%", semantic: "light", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(_state, params) {
    const lambda = Math.pow(10, params.logWavelength as number);
    const band = bandOf(lambda);
    const ev = photonEnergyEV(lambda);
    return {
      wavelength: lambda,
      frequency: frequencyOf(lambda),
      speed: CONSTANTS.c,
      energyJ: photonEnergy(lambda),
      energyEV: ev,
      fLambda: frequencyOf(lambda) * lambda,
      band: band.key,
      bandLabel: band.label,
      visible: band.key === "visible",
      visibleShare: visibleShare(params.logWavelength as number, params.zoom as number),
      ionizing: ev >= IONIZING_EV,
      use: band.use,
      sizeLike: sizeReference(lambda),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

/**
 * Colour for a band. Non-visible bands are painted on the platform's cold-to-hot
 * ramp by photon energy, so the colour means "how much energy each photon
 * carries" — which is exactly the comparison D3.5 asks for. The visible band
 * is painted in the colours it actually is.
 */
function bandColor(rc: RenderContext<State>, wavelength: number): string {
  const { theme } = rc;
  if (wavelength >= 3.8e-7 && wavelength <= 7.5e-7) return visibleColor(wavelength * 1e9);
  const ev = photonEnergyEV(wavelength);
  // From 1 neV to 1 MeV across the whole spectrum, on a log scale.
  const t = Math.min(1, Math.max(0, (Math.log10(Math.max(ev, 1e-12)) + 9) / 15));
  return mixHex(theme.sci["cold"], theme.sci["hot"], t);
}

function formatWavelength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 1e4 ? 0 : 1)} km`;
  if (m >= 1) return `${m.toFixed(m >= 10 ? 0 : 2)} m`;
  if (m >= 1e-3) return `${(m * 1000).toFixed(m >= 1e-2 ? 0 : 1)} mm`;
  if (m >= 1e-6) return `${(m * 1e6).toFixed(m >= 1e-5 ? 0 : 2)} µm`;
  if (m >= 1e-9) return `${(m * 1e9).toFixed(m >= 1e-8 ? 0 : 2)} nm`;
  return `${(m * 1e12).toFixed(2)} pm`;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e21) return `${(hz / 1e21).toFixed(1)} ZHz`;
  if (hz >= 1e18) return `${(hz / 1e18).toFixed(1)} EHz`;
  if (hz >= 1e15) return `${(hz / 1e15).toFixed(1)} PHz`;
  if (hz >= 1e12) return `${(hz / 1e12).toFixed(1)} THz`;
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
  return `${(hz / 1e3).toFixed(1)} kHz`;
}

function formatEnergy(ev: number): string {
  if (ev >= 1e6) return `${(ev / 1e6).toFixed(2)} MeV`;
  if (ev >= 1e3) return `${(ev / 1e3).toFixed(2)} keV`;
  if (ev >= 1) return `${ev.toFixed(2)} eV`;
  if (ev >= 1e-3) return `${(ev * 1e3).toFixed(2)} meV`;
  return `${(ev * 1e6).toFixed(2)} µeV`;
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const logL = params.logWavelength as number;
  const lambda = Math.pow(10, logL);
  const span = params.zoom as number;
  const emBand = bandOf(lambda);

  sky(ctx, width, height, theme, "space");
  starfield(ctx, width, height, 60, 13);

  // The axis: log10(wavelength), longest on the left, as every poster draws it.
  const lo = logL + span / 2;      // left edge, long wavelengths
  const hi = logL - span / 2;      // right edge, short wavelengths
  const toX = (lg: number) => ((lo - lg) / (lo - hi)) * width;

  const barY = Math.round(height * 0.3);
  const barH = Math.max(30, Math.round(height * 0.14));

  /* ---- the bands ---- */
  ctx.save();
  for (const b of BANDS) {
    const x0 = toX(Math.log10(b.max));
    const x1 = toX(Math.log10(b.min));
    if (x1 < -20 || x0 > width + 20) continue;
    if (b.key === "visible") {
      // Painted in its real colours, wavelength by wavelength.
      const steps = Math.max(8, Math.min(140, Math.round(x1 - x0)));
      for (let i = 0; i < steps; i++) {
        const t0 = x0 + ((x1 - x0) * i) / steps;
        const t1 = x0 + ((x1 - x0) * (i + 1)) / steps;
        const lg = lo - ((t0 - 0) / width) * (lo - hi);
        ctx.fillStyle = visibleColor(Math.pow(10, lg) * 1e9);
        ctx.fillRect(t0, barY, Math.max(1, t1 - t0 + 1), barH);
      }
    } else {
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, bandColor(rc, b.max));
      grad.addColorStop(1, bandColor(rc, b.min));
      ctx.fillStyle = grad;
      ctx.fillRect(x0, barY, x1 - x0, barH);
    }
    ctx.strokeStyle = hexA(theme.surface, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, barY, x1 - x0, barH);

    if (overlays.bands && x1 - x0 > 34) {
      caption(ctx, (x0 + x1) / 2, barY - 12, b.label, theme, {
        align: "center", size: 11, color: b.key === emBand.key ? theme.ink : theme.inkSoft,
        weight: b.key === emBand.key ? 800 : 600,
      });
    }
  }
  ctx.restore();

  /* ---- the ruler underneath ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1;
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const stepDecades = span > 8 ? 2 : span > 3 ? 1 : span > 1 ? 0.5 : 0.2;
  const first = Math.ceil(hi / stepDecades) * stepDecades;
  for (let lg = first; lg <= lo + 1e-9; lg += stepDecades) {
    const x = toX(lg);
    if (x < 0 || x > width) continue;
    ctx.beginPath();
    ctx.moveTo(x, barY + barH);
    ctx.lineTo(x, barY + barH + 6);
    ctx.stroke();
    if (band !== "3-5") ctx.fillText(formatWavelength(Math.pow(10, lg)), x, barY + barH + 9);
  }
  ctx.restore();

  /* ---- where the student is standing ---- */
  const markX = toX(logL);
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(markX, barY - 8);
  ctx.lineTo(markX, barY + barH + 8);
  ctx.stroke();
  ctx.restore();
  badge(ctx, markX, barY - 26, formatWavelength(lambda), theme, {
    align: "center", color: theme.accent,
  });

  /* ---- the wave itself, drawn to the same scale as the ruler ---- */
  const waveY = Math.round(height * 0.62);
  const waveH = Math.min(34, height * 0.09);
  // One drawn wavelength is one decade-step of the ruler wide, so zooming in
  // stretches the wave exactly as it stretches the axis.
  const pxPerWave = Math.max(18, width / Math.max(3, span * 1.6));
  ctx.save();
  ctx.strokeStyle = emBand.key === "visible" ? visibleColor(lambda * 1e9) : bandColor(rc, lambda);
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = waveY - waveH * Math.sin((2 * Math.PI * x) / pxPerWave - 2 * Math.PI * state.phase);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  if (band !== "3-5") {
    caption(ctx, 12, waveY - waveH - 14, `about the size of ${sizeReference(lambda)}`, theme, {
      size: 11, color: theme.inkSoft,
    });
  }

  /* ---- the card: everything that follows from one wavelength ---- */
  const cardW = Math.min(268, width * 0.42);
  const cardH = band === "3-5" ? 76 : 118;
  const cardX = width - cardW - 14;
  const cardY = height - cardH - 14;
  if (cardW > 150 && cardY > waveY + 12) {
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.78 : 0.86);
    roundRect(ctx, cardX, cardY, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    caption(ctx, cardX + 14, cardY + 18, emBand.label, theme, {
      size: 14, color: theme.ink, weight: 800,
    });
    caption(ctx, cardX + 14, cardY + 38, emBand.use, theme, { size: 11, color: theme.inkSoft });
    if (band !== "3-5") {
      caption(ctx, cardX + 14, cardY + 58, `f = ${formatFrequency(frequencyOf(lambda))}`, theme, {
        size: 12, color: theme.sci["wave"],
      });
      caption(ctx, cardX + 14, cardY + 76, `one photon: ${formatEnergy(photonEnergyEV(lambda))}`, theme, {
        size: 12, color: theme.sci["energy-total"],
      });
      caption(
        ctx, cardX + 14, cardY + 96,
        photonEnergyEV(lambda) >= IONIZING_EV ? "enough energy to break molecules apart" : "not enough energy to break molecules apart",
        theme,
        { size: 10, color: photonEnergyEV(lambda) >= IONIZING_EV ? theme.sci["hot"] : theme.inkSoft },
      );
    }
  }

  /* ---- the race: the whole point of D3.4 ---- */
  if (overlays.race) {
    const trackY = Math.round(height * 0.86);
    const trackX0 = 16, trackX1 = Math.max(trackX0 + 40, cardX - 24);
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(trackX0, trackY);
    ctx.lineTo(trackX1, trackY);
    ctx.stroke();
    ctx.restore();

    const t = Math.min(1, state.race);
    const racers: [number, string][] = [[1e2, "radio"], [1e-6, "infrared"], [1e-11, "gamma"]];
    racers.forEach(([wl, name], i) => {
      const y = trackY - 16 + i * 16;
      const x = trackX0 + t * (trackX1 - trackX0);
      const color = bandColor(rc, wl);
      glow(ctx, x, y, 12, color, 0.5);
      sphere(ctx, x, y, 5, color);
      if (band !== "3-5" && trackX1 - trackX0 > 180) {
        caption(ctx, trackX0 - 4, y, name, theme, { align: "right", size: 9, color: theme.inkSoft });
      }
    });
    caption(
      ctx, trackX0, trackY + 22,
      "different wavelengths, one speed: 299 792 458 m/s in vacuum", theme,
      { size: 11, color: theme.sci["velocity"] },
    );
  }

  caption(ctx, 12, 22, "The electromagnetic spectrum", theme, {
    size: 15, color: theme.ink, weight: 800,
  });
  if (band !== "3-5") {
    const share = visibleShare(logL, span) * 100;
    caption(ctx, 12, 42,
      `showing ${span.toFixed(1)} powers of ten — visible light is ${share.toFixed(share >= 10 ? 0 : 1)}% of this screen`,
      theme, { size: 11, color: theme.inkSoft });
  }
  vignette(ctx, width, height, 0.18);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const emSpectrumSim: SimManifest<State> = {
  id: "phys.em-spectrum",
  title: "Electromagnetic Spectrum",
  tagline: "Slide from kilometre radio waves down to gamma rays and find where your eyes stop.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS4-2", "MS-PS4-3", "HS-PS4-1", "HS-PS4-4"], ccssMath: ["8.EE.A.3", "8.EE.A.4"] },
  learningGoals: [
    "Order the spectrum by wavelength and by frequency, in both directions.",
    "Show that visible light is one narrow band inside a far bigger family.",
    "Name a real use for each band.",
    "State that every band travels at the same speed in a vacuum.",
    "Explain that photon energy rises with frequency, and what that means for safety.",
  ],
  misconceptions: [
    "Radio waves and light are completely different things",
    "Higher-frequency waves travel faster",
    "Visible light is most of the spectrum",
    "Microwaves and X-rays are the same kind of danger",
    "Ultraviolet is dangerous because it is bright",
  ],
  interactionHint: "Slide the wavelength, then zoom right into the visible band.",
  params: {
    logWavelength: {
      type: "number", label: "Wavelength (powers of ten, in metres)", kind: "count",
      min: -13, max: 4, step: 0.01, default: -6.26,
      marks: [
        { value: 2, label: "radio" },
        { value: -1.5, label: "micro" },
        { value: -5, label: "infrared" },
        { value: -6.26, label: "visible" },
        { value: -7.5, label: "UV" },
        { value: -9.5, label: "X-ray" },
        { value: -11.5, label: "gamma" },
      ],
      help: "−6 means 10⁻⁶ m, which is one micrometre. Visible light sits near −6.3.",
    },
    zoom: {
      type: "number", label: "Powers of ten on screen", kind: "count",
      min: 0.4, max: 17, step: 0.2, default: 17,
      marks: [
        { value: 17, label: "all" },
        { value: 4, label: "one band" },
        { value: 0.4, label: "close in" },
      ],
      help: "Zoom in until the visible band fills the screen. Notice how narrow it was.",
    },
  },
  overlays: [
    { key: "bands", label: "Band names", default: true },
    { key: "race", label: "Speed race", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "one-narrow-band",
      title: "How much of it can you see?",
      question: "Where does visible light sit in the whole electromagnetic spectrum?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS4-2"],
      setup: { logWavelength: -6.26, zoom: 17 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "The ruler covers seventeen powers of ten.",
          predict: {
            prompt: "Visible light takes up roughly how much of the spectrum on screen?",
            options: ["about half", "about a tenth", "less than a hundredth"],
            correct: 2,
            reveal: "Less than a hundredth. Visible light runs from 380 to 700 nm — under one power of ten out of seventeen.",
          },
        },
        {
          id: "zoom",
          phase: "measure",
          title: "Zoom in until you can see it",
          instruction: "Turn the zoom down until the visible band fills the screen.",
          check: {
            describe: "Zoomed in to one power of ten or less",
            test: (v) => (v.params.zoom as number) <= 1,
          },
        },
        {
          id: "edges",
          phase: "measure",
          title: "Find the two edges",
          instruction: "Record the wavelength where red ends and where violet ends.",
          requireData: 2,
          hints: ["Red light is the long-wavelength edge, near 700 nm."],
        },
        {
          id: "tour",
          phase: "measure",
          title: "Visit every band",
          instruction: "Zoom back out and record a wavelength in each of the seven bands.",
          requireData: 9,
          hints: ["Use the marks under the wavelength slider to jump band to band."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what light is",
          instruction: "Write what visible light has in common with radio and X-rays.",
          write: {
            prompt: "What makes radio waves, visible light and gamma rays members of the same family, and what makes them different?",
            placeholder: "They are all ... They differ in ...",
          },
        },
      ],
    },
    {
      id: "same-speed",
      title: "Same speed, different energy",
      question: "If a gamma ray carries a trillion times more energy, does it travel faster?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS4-2", "HS-PS4-1"],
      setup: { logWavelength: 2, zoom: 17 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "Watch the three racing pulses at the bottom of the screen.",
          predict: {
            prompt: "In a vacuum, a gamma ray compared with a radio wave travels...",
            options: ["much faster", "at exactly the same speed", "slower, because it is more energetic"],
            correct: 1,
            reveal: "Exactly the same speed: 299 792 458 m/s. What changes across the spectrum is the wavelength, the frequency and the energy of each photon — never the speed in vacuum.",
          },
        },
        {
          id: "sweep",
          phase: "measure",
          title: "Record five bands",
          instruction: "Record wavelength, frequency, speed and photon energy in five bands.",
          requireData: 5,
        },
        {
          id: "product",
          phase: "analyze",
          title: "Multiply frequency by wavelength",
          instruction: "Do it for every row. What do you get each time?",
          write: {
            prompt: "What did frequency × wavelength come to in every row, and what is that number?",
            placeholder: "Every row gave 3 × 10⁸ m/s, which is ...",
          },
        },
        {
          id: "energy",
          phase: "analyze",
          title: "Now look at the energy",
          instruction: "Compare the photon energy of the radio wave with the X-ray.",
          check: {
            describe: "You are on a band whose photons can break molecules",
            test: (v) => Boolean(v.facts.ionizing),
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the sunscreen",
          instruction: "Visible light does not burn you. Ultraviolet does.",
          write: {
            prompt: "Both arrive at the same speed. Why is ultraviolet dangerous when visible light is not?",
            placeholder: "Each ultraviolet photon carries ... so when it hits a molecule ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-the-oven",
      title: "Tune the microwave oven",
      brief: "A microwave oven runs at 2.45 GHz. Find its wavelength on the ruler.",
      bands: ["6-8", "9-12"],
      setup: { logWavelength: 2, zoom: 17 },
      goal: {
        describe: "Within 10% of 2.45 GHz, in the microwave band",
        test: (v) =>
          Math.abs((v.facts.frequency as number) - 2.45e9) / 2.45e9 <= 0.1
          && v.facts.band === "microwave",
      },
      stars: {
        two: {
          describe: "Within 2%",
          test: (v) => Math.abs((v.facts.frequency as number) - 2.45e9) / 2.45e9 <= 0.02,
        },
        three: {
          describe: "Within 0.5%, zoomed in to two powers of ten or less",
          test: (v) =>
            Math.abs((v.facts.frequency as number) - 2.45e9) / 2.45e9 <= 0.005
            && (v.params.zoom as number) <= 2,
        },
      },
      hints: [
        "Wavelength = speed ÷ frequency, and the speed is 3 × 10⁸ m/s.",
        "3 × 10⁸ ÷ 2.45 × 10⁹ is about 0.12 m — a wavelength of 12 cm.",
        "Zoom in so the slider can land on it precisely.",
      ],
    },
    {
      id: "first-ionizing",
      title: "The dangerous edge",
      brief: "Find the longest wavelength whose photons still carry 10 eV.",
      bands: ["9-12"],
      setup: { logWavelength: -6.26, zoom: 6 },
      goal: {
        describe: "Photon energy within 1 eV of 10 eV",
        test: (v) => Math.abs((v.facts.energyEV as number) - 10) <= 1,
      },
      stars: {
        two: {
          describe: "Within 0.3 eV of 10 eV",
          test: (v) => Math.abs((v.facts.energyEV as number) - 10) <= 0.3,
        },
        three: {
          describe: "Within 0.1 eV, and you can name the band",
          test: (v) =>
            Math.abs((v.facts.energyEV as number) - 10) <= 0.1 && v.facts.band === "ultraviolet",
        },
      },
      hints: [
        "Photon energy in electronvolts is about 1240 divided by the wavelength in nanometres.",
        "So 10 eV means a wavelength of about 124 nm.",
        "That is deep in the ultraviolet, well past the edge of what you can see.",
      ],
    },
  ],
};
