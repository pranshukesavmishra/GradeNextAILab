import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  caption, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Fossil Record — Grades 4-12.
 *
 * Deep time, running. The stage is a cliff face; press play and 540 million
 * years of rock deposit from the bottom up, one layer per period, with fossils
 * settling into the layer that was being laid down while that group was alive.
 * Superposition is therefore something the student watches happen rather than
 * a rule they are told: the deeper fossil is older because it was buried first.
 *
 * Every date is the current ICS geologic time scale, and every first and last
 * appearance is the accepted fossil range for that group. The five mass
 * extinctions fall out of the ranges rather than being drawn on top of them:
 * the diversity curve dives at 443.8, 372, 251.9, 201.4 and 66 Ma because that
 * is when groups in the table actually stop.
 *
 * Transitional-series measurements (hind limb length, blowhole position, digit
 * count, toe count, shoulder height) are relative values read off published
 * reconstructions. They are approximate in magnitude and exact in direction,
 * which is the claim the fossil record actually makes.
 */

/* ------------------------------------------------------------------ *
 * The geologic time scale — ICS, ages in millions of years ago
 * ------------------------------------------------------------------ */

export interface Period {
  name: string;
  short: string;
  /** Older boundary, Ma. */
  start: number;
  /** Younger boundary, Ma. */
  end: number;
  era: "Paleozoic" | "Mesozoic" | "Cenozoic";
}

export const PERIODS: Period[] = [
  { name: "Cambrian", short: "Cm", start: 538.8, end: 485.4, era: "Paleozoic" },
  { name: "Ordovician", short: "O", start: 485.4, end: 443.8, era: "Paleozoic" },
  { name: "Silurian", short: "S", start: 443.8, end: 419.2, era: "Paleozoic" },
  { name: "Devonian", short: "D", start: 419.2, end: 358.9, era: "Paleozoic" },
  { name: "Carboniferous", short: "C", start: 358.9, end: 298.9, era: "Paleozoic" },
  { name: "Permian", short: "P", start: 298.9, end: 251.9, era: "Paleozoic" },
  { name: "Triassic", short: "Tr", start: 251.9, end: 201.4, era: "Mesozoic" },
  { name: "Jurassic", short: "J", start: 201.4, end: 145.0, era: "Mesozoic" },
  { name: "Cretaceous", short: "K", start: 145.0, end: 66.0, era: "Mesozoic" },
  { name: "Paleogene", short: "Pg", start: 66.0, end: 23.03, era: "Cenozoic" },
  { name: "Neogene", short: "Ng", start: 23.03, end: 2.58, era: "Cenozoic" },
  { name: "Quaternary", short: "Q", start: 2.58, end: 0, era: "Cenozoic" },
];

export const OLDEST_MA = 538.8;

/** Which period a date falls in. Boundaries belong to the older period. */
export function periodAt(ma: number): Period | null {
  for (const p of PERIODS) {
    if (ma <= p.start && ma >= p.end) return p;
  }
  return null;
}

export interface MassExtinction {
  name: string;
  ma: number;
  /** Estimated percentage of marine species lost. */
  lossPercent: number;
  cause: string;
}

/** The Big Five, with the standard species-loss estimates. */
export const EXTINCTIONS: MassExtinction[] = [
  { name: "End-Ordovician", ma: 443.8, lossPercent: 85, cause: "glaciation and sea-level fall" },
  { name: "Late Devonian", ma: 372.0, lossPercent: 75, cause: "ocean anoxia" },
  { name: "End-Permian", ma: 251.9, lossPercent: 96, cause: "Siberian Traps volcanism" },
  { name: "End-Triassic", ma: 201.4, lossPercent: 80, cause: "volcanism as Pangaea rifted" },
  { name: "End-Cretaceous", ma: 66.0, lossPercent: 76, cause: "Chicxulub asteroid impact" },
];

/* ------------------------------------------------------------------ *
 * Fossil ranges
 * ------------------------------------------------------------------ */

export interface Taxon {
  name: string;
  /** First appearance, Ma. */
  first: number;
  /** Last appearance, Ma. 0 means the group is still alive. */
  last: number;
  /** Rough body shape, so each group draws as itself and not as a dot. */
  shape: "trilobite" | "shell" | "fish" | "tetrapod" | "plant" | "frond";
}

export const TAXA: Taxon[] = [
  { name: "Trilobites", first: 521, last: 251.9, shape: "trilobite" },
  { name: "Graptolites", first: 486, last: 320, shape: "frond" },
  { name: "Crinoids", first: 480, last: 0, shape: "frond" },
  { name: "Eurypterids", first: 467, last: 251.9, shape: "trilobite" },
  { name: "Horseshoe crabs", first: 445, last: 0, shape: "trilobite" },
  { name: "Placoderms", first: 438, last: 358.9, shape: "fish" },
  { name: "Sharks", first: 420, last: 0, shape: "fish" },
  { name: "Ammonoids", first: 409, last: 66, shape: "shell" },
  { name: "Amphibians", first: 365, last: 0, shape: "tetrapod" },
  { name: "Reptiles", first: 318, last: 0, shape: "tetrapod" },
  { name: "Non-avian dinosaurs", first: 233, last: 66, shape: "tetrapod" },
  { name: "Mammals", first: 225, last: 0, shape: "tetrapod" },
  { name: "Birds", first: 150, last: 0, shape: "tetrapod" },
  { name: "Flowering plants", first: 130, last: 0, shape: "plant" },
  { name: "Grasses", first: 66, last: 0, shape: "plant" },
  { name: "Whales", first: 50, last: 0, shape: "fish" },
  { name: "Hominins", first: 7, last: 0, shape: "tetrapod" },
];

export function aliveAt(taxon: Taxon, ma: number): boolean {
  return ma <= taxon.first && ma >= taxon.last;
}

/** How many of the tracked groups were alive at a given date. */
export function diversityAt(ma: number): number {
  let n = 0;
  for (const t of TAXA) if (aliveAt(t, ma)) n++;
  return n;
}

/* ------------------------------------------------------------------ *
 * Transitional series
 * ------------------------------------------------------------------ */

export interface Form {
  name: string;
  ma: number;
  /** The measurement that changes across the series, 0..1 of its own range. */
  trait: number;
  /** A second measurement, so the change is not one number in isolation. */
  trait2: number;
  note: string;
}

export interface Series {
  key: string;
  title: string;
  traitLabel: string;
  trait2Label: string;
  forms: Form[];
}

export const SERIES: Record<string, Series> = {
  whales: {
    key: "whales",
    title: "Land mammal to whale",
    traitLabel: "hind limb length",
    trait2Label: "blowhole position",
    // Hind limb relative to body length; nostril position from snout tip (0)
    // to top of the head (1). Both trends are the ones the fossils show.
    forms: [
      { name: "Pakicetus", ma: 50, trait: 1.0, trait2: 0.05, note: "walked on land; whale ear bone" },
      { name: "Ambulocetus", ma: 48, trait: 0.85, trait2: 0.15, note: "walked and swam" },
      { name: "Rodhocetus", ma: 46, trait: 0.55, trait2: 0.35, note: "shortened legs, tail swimmer" },
      { name: "Basilosaurus", ma: 38, trait: 0.10, trait2: 0.60, note: "fully aquatic, tiny hind legs" },
      { name: "Dorudon", ma: 37, trait: 0.08, trait2: 0.65, note: "tail fluke" },
      { name: "Modern whale", ma: 0, trait: 0.02, trait2: 1.0, note: "hind limb bones left inside the body" },
    ],
  },
  tetrapods: {
    key: "tetrapods",
    title: "Fish to four-legged animal",
    traitLabel: "digits on the limb",
    trait2Label: "neck mobility",
    // trait is digit count scaled by 8, the highest count in the series.
    forms: [
      { name: "Eusthenopteron", ma: 385, trait: 0, trait2: 0, note: "lobe fin, arm bones inside it" },
      { name: "Panderichthys", ma: 380, trait: 0, trait2: 0.2, note: "flattened head, eyes on top" },
      { name: "Tiktaalik", ma: 375, trait: 0, trait2: 0.6, note: "a wrist, but still fin rays" },
      { name: "Acanthostega", ma: 365, trait: 1.0, trait2: 0.8, note: "eight digits, still aquatic" },
      { name: "Ichthyostega", ma: 363, trait: 0.875, trait2: 0.85, note: "seven digits, could prop up" },
      { name: "Pederpes", ma: 348, trait: 0.625, trait2: 1.0, note: "five forward-facing digits" },
    ],
  },
  horses: {
    key: "horses",
    title: "Small forest browser to horse",
    traitLabel: "shoulder height",
    trait2Label: "toes on each foot",
    // trait is shoulder height scaled by 150 cm; trait2 is toes scaled by 4.
    forms: [
      { name: "Hyracotherium", ma: 55, trait: 0.27, trait2: 1.0, note: "40 cm tall, four toes in front" },
      { name: "Mesohippus", ma: 37, trait: 0.40, trait2: 0.75, note: "60 cm, three toes" },
      { name: "Merychippus", ma: 17, trait: 0.67, trait2: 0.75, note: "100 cm, grazing teeth" },
      { name: "Pliohippus", ma: 5, trait: 0.83, trait2: 0.25, note: "125 cm, one toe" },
      { name: "Equus", ma: 1, trait: 1.0, trait2: 0.25, note: "150 cm, a single hoof" },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Fossil {
  /** The date this specimen was buried, Ma. */
  ma: number;
  taxon: number;
  /** Across-the-outcrop position, 0..1. */
  x: number;
  /** 0..1 fade-in as it settles. */
  age: number;
}

interface State {
  timeMa: number;
  fossils: Fossil[];
  /** Diversity curve, sampled as time passes. */
  sampleMa: number[];
  sampleDiv: number[];
  nextSampleMa: number;
  /** Which extinction was crossed most recently, and how long ago. */
  lastExtinction: number;
  flash: number;
  /** Total groups that have gone extinct so far. */
  extinctSoFar: number;
}

const MAX_FOSSILS = 420;
const SAMPLE_STEP = 4; // Ma between diversity samples
const MAX_SAMPLES = 200;

function initialState(params: Record<string, number | boolean | string>): State {
  const t0 = params.startMa as number;
  return {
    timeMa: t0,
    fossils: [],
    sampleMa: [t0],
    sampleDiv: [diversityAt(t0)],
    nextSampleMa: t0 - SAMPLE_STEP,
    lastExtinction: -1,
    flash: 0,
    extinctSoFar: 0,
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return initialState(params);
  },

  applyParams(state, params, prev) {
    if (params.startMa !== prev.startMa) return initialState(params);
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rate = params.rate as number;
    const prevMa = state.timeMa;
    const timeMa = Math.max(0, prevMa - rate * dt);
    if (timeMa === prevMa) {
      return state.flash > 0 ? { ...state, flash: Math.max(0, state.flash - dt) } : state;
    }

    /* --- bury specimens of everything alive right now ---------------- */
    let fossils = state.fossils;
    const perMa = params.fossilRate as number;
    const expected = (prevMa - timeMa) * perMa;
    const living: number[] = [];
    for (let i = 0; i < TAXA.length; i++) if (aliveAt(TAXA[i], timeMa)) living.push(i);

    if (living.length > 0 && expected > 0) {
      let n = Math.floor(expected);
      if (ctx.rng.next() < expected - n) n += 1;
      if (n > 0) {
        const next = fossils.slice();
        for (let k = 0; k < n && k < 12; k++) {
          const taxon = living[ctx.rng.int(0, living.length - 1)];
          next.push({ ma: timeMa, taxon, x: ctx.rng.next(), age: 0 });
        }
        fossils = next.length > MAX_FOSSILS ? next.slice(next.length - MAX_FOSSILS) : next;
      }
    }
    if (fossils.length && fossils[fossils.length - 1].age < 1) {
      // Only the youngest few are still fading in, so the map is cheap.
      const from = Math.max(0, fossils.length - 24);
      const grown = fossils.slice();
      for (let i = from; i < grown.length; i++) {
        if (grown[i].age < 1) grown[i] = { ...grown[i], age: Math.min(1, grown[i].age + dt * 2.5) };
      }
      fossils = grown;
    }

    /* --- diversity samples ------------------------------------------- */
    let sampleMa = state.sampleMa;
    let sampleDiv = state.sampleDiv;
    let nextSampleMa = state.nextSampleMa;
    while (timeMa <= nextSampleMa && sampleMa.length < MAX_SAMPLES + 40) {
      sampleMa = sampleMa.concat(nextSampleMa);
      sampleDiv = sampleDiv.concat(diversityAt(nextSampleMa));
      nextSampleMa -= SAMPLE_STEP;
    }
    if (sampleMa.length > MAX_SAMPLES) {
      sampleMa = sampleMa.slice(sampleMa.length - MAX_SAMPLES);
      sampleDiv = sampleDiv.slice(sampleDiv.length - MAX_SAMPLES);
    }

    /* --- did we just cross a mass extinction? ------------------------ */
    let lastExtinction = state.lastExtinction;
    let flash = Math.max(0, state.flash - dt);
    for (let i = 0; i < EXTINCTIONS.length; i++) {
      const e = EXTINCTIONS[i];
      if (prevMa > e.ma && timeMa <= e.ma) {
        lastExtinction = i;
        flash = 1;
      }
    }

    let extinctSoFar = 0;
    for (const t of TAXA) if (t.last > 0 && timeMa < t.last) extinctSoFar++;

    return { timeMa, fossils, sampleMa, sampleDiv, nextSampleMa, lastExtinction, flash, extinctSoFar };
  },

  readouts(state) {
    return [
      {
        key: "timeMa", label: "Time", quantity: q(state.timeMa, "count"),
        semantic: "time", graphable: true,
      },
      {
        key: "diversity", label: "Groups alive", quantity: q(diversityAt(state.timeMa), "count"),
        semantic: "producer", graphable: true,
      },
      {
        key: "extinct", label: "Groups gone", quantity: q(state.extinctSoFar, "count"),
        semantic: "secondary-consumer", graphable: true,
      },
      {
        key: "fossils", label: "Fossils collected", quantity: q(state.fossils.length, "count"),
        semantic: "decomposer", graphable: false,
      },
      {
        // 20 m of section per million years is a working average for a
        // steadily subsiding shelf basin; real rates vary enormously.
        key: "sectionThickness", label: "Rock laid down",
        quantity: q((OLDEST_MA - state.timeMa) * 20, "length"),
        unit: "m", semantic: "distance", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const p = periodAt(state.timeMa);
    const series = SERIES[params.series as string] ?? SERIES.whales;
    // Superposition: every fossil deeper in the pile must be older than the
    // one above it. The list is built in deposition order, so this is a real
    // check on the model, not on the drawing.
    let ordered = true;
    for (let i = 1; i < state.fossils.length; i++) {
      if (state.fossils[i].ma > state.fossils[i - 1].ma + 1e-9) ordered = false;
    }
    const deepest = state.fossils.length ? state.fossils[0].ma : state.timeMa;
    const shallowest = state.fossils.length ? state.fossils[state.fossils.length - 1].ma : state.timeMa;
    const last = state.lastExtinction >= 0 ? EXTINCTIONS[state.lastExtinction] : null;
    return {
      timeMa: state.timeMa,
      period: p ? p.name : "before the Cambrian",
      era: p ? p.era : "Precambrian",
      diversity: diversityAt(state.timeMa),
      extinctGroups: state.extinctSoFar,
      fossilCount: state.fossils.length,
      superpositionOrdered: ordered,
      deepestFossilMa: deepest,
      shallowestFossilMa: shallowest,
      lastExtinction: last ? last.name : "none yet",
      lastExtinctionLoss: last ? last.lossPercent : 0,
      trilobitesAlive: aliveAt(TAXA[0], state.timeMa),
      dinosaursAlive: aliveAt(TAXA[10], state.timeMa),
      seriesTitle: series.title,
      seriesSpan: series.forms[0].ma - series.forms[series.forms.length - 1].ma,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Alternating rock tints keyed to era, so the eras read as three big blocks. */
function layerColor(p: Period, i: number, theme: RenderContext<State>["theme"]): string {
  const base =
    p.era === "Paleozoic" ? theme.sci["decomposer"] :
    p.era === "Mesozoic" ? theme.sci["secondary-consumer"] :
    theme.sci["primary-consumer"];
  return mixHex(base, i % 2 === 0 ? "#000000" : "#ffffff", 0.16);
}

/** Small procedural body plans, so each group is recognisable in the rock. */
function drawCreature(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shape: Taxon["shape"], color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = mixHex(color, "#000000", 0.4);
  ctx.lineWidth = Math.max(0.6, r * 0.14);
  switch (shape) {
    case "trilobite": {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(x + i * r * 0.42, y - r * 0.55);
        ctx.lineTo(x + i * r * 0.42, y + r * 0.55);
      }
      ctx.stroke();
      break;
    }
    case "shell": {
      ctx.beginPath();
      // A spiral, which is what an ammonite actually is.
      for (let a = 0; a < Math.PI * 4; a += 0.25) {
        const rr = r * (0.12 + (a / (Math.PI * 4)) * 0.9);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case "fish": {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r * 1.6, y - r * 0.5);
      ctx.lineTo(x - r * 1.6, y + r * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "tetrapod": {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      for (const s of [-0.55, 0.55]) {
        ctx.moveTo(x + s * r, y + r * 0.3);
        ctx.lineTo(x + s * r, y + r * 0.95);
      }
      ctx.moveTo(x + r * 0.85, y - r * 0.1);
      ctx.lineTo(x + r * 1.4, y - r * 0.5);
      ctx.stroke();
      break;
    }
    case "plant": {
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x, y - r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - r, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x, y - r);
      ctx.stroke();
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(x, y + i * r * 0.4);
        ctx.lineTo(x + r * 0.7, y + i * r * 0.4 - r * 0.25);
      }
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** The transitional series: the same animal, measured, across millions of years. */
function drawSeries(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme, band } = rc;
  const series = SERIES[params.series as string] ?? SERIES.whales;
  const forms = series.forms;
  const t0 = forms[0].ma;
  const t1 = forms[forms.length - 1].ma;
  const span = Math.max(1, t0 - t1);

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.5 : 0.68);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const axisY = y + h - 12;
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10, axisY);
  ctx.lineTo(x + w - 10, axisY);
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 8, y + 11, `${series.title} — ${series.traitLabel}`, theme, {
    size: 10, color: theme.inkSoft,
  });

  const scale = (w - 20) / span;
  const bodyY = y + h * 0.52;
  for (const f of forms) {
    const px = x + 10 + (t0 - f.ma) * scale;
    const known = state.timeMa <= f.ma;
    ctx.save();
    ctx.globalAlpha = known ? 1 : 0.22;

    // Body, then the measured limb: the trait is the drawing, not a caption.
    const bodyR = 7 + (series.key === "horses" ? f.trait * 7 : 3);
    const color = known ? theme.sci["decomposer"] : theme.inkSoft;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(px, bodyY, bodyR * 1.5, bodyR * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (series.key === "whales") {
      // Hind limb shrinking, blowhole marching back along the head.
      ctx.moveTo(px + bodyR * 0.9, bodyY + bodyR * 0.4);
      ctx.lineTo(px + bodyR * 0.9, bodyY + bodyR * 0.4 + f.trait * 16);
      ctx.stroke();
      sphere(ctx, px - bodyR * 1.5 + f.trait2 * bodyR * 2.2, bodyY - bodyR * 0.6, 2.2, theme.sci["cold"]);
    } else if (series.key === "tetrapods") {
      const digits = Math.round(f.trait * 8);
      ctx.moveTo(px, bodyY + bodyR * 0.4);
      ctx.lineTo(px, bodyY + bodyR * 0.4 + 10);
      ctx.stroke();
      ctx.beginPath();
      for (let d = 0; d < digits; d++) {
        const a = -Math.PI / 2 + (d - (digits - 1) / 2) * 0.28;
        ctx.moveTo(px, bodyY + bodyR * 0.4 + 10);
        ctx.lineTo(px + Math.cos(a + Math.PI / 2) * 7, bodyY + bodyR * 0.4 + 10 + Math.sin(a + Math.PI / 2) * 7);
      }
      ctx.stroke();
    } else {
      const toes = Math.round(f.trait2 * 4);
      for (const s of [-0.7, 0.7]) {
        ctx.moveTo(px + s * bodyR, bodyY + bodyR * 0.4);
        ctx.lineTo(px + s * bodyR, axisY - 2);
      }
      ctx.stroke();
      ctx.fillStyle = theme.accent;
      for (let d = 0; d < toes; d++) {
        ctx.beginPath();
        ctx.arc(px + 0.7 * bodyR + (d - (toes - 1) / 2) * 2.6, axisY - 1, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = known ? 1 : 0.3;
    if (band !== "3-5" && w > 320) {
      caption(ctx, px, axisY + 8, `${f.ma} Ma`, theme, {
        align: "center", size: 8, color: theme.inkSoft,
      });
    }
    caption(ctx, px, y + h * 0.24, f.name, theme, {
      align: "center", size: 9, color: known ? theme.ink : theme.inkSoft,
    });
    ctx.restore();
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;

  const seriesH = overlays.series === false ? 0 : Math.min(96, Math.max(70, height * 0.26));
  const topH = height - seriesH - (seriesH ? 8 : 0);
  const colW = Math.round(width * (width < 520 ? 0.5 : 0.44));
  const chartX = colW + 12;
  const chartW = width - chartX - 10;

  sky(ctx, width, height, theme, "dusk", topH * 0.35);

  /* ---- the column: time maps to height, oldest at the bottom -------- */
  const top = 16;
  const bottom = topH - 6;
  const toY = (ma: number) => bottom - ((OLDEST_MA - ma) / OLDEST_MA) * (bottom - top);
  const frontY = toY(state.timeMa);

  for (let i = 0; i < PERIODS.length; i++) {
    const p = PERIODS[i];
    // Only rock that has already been laid down is on the cliff.
    if (p.start < state.timeMa) continue;
    const y0 = toY(p.start);
    const y1 = toY(Math.max(p.end, state.timeMa));
    if (y1 >= y0) continue;
    ctx.save();
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    const c = layerColor(p, i, theme);
    g.addColorStop(0, mixHex(c, "#000000", 0.15));
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, y1, colW, y0 - y1);
    ctx.strokeStyle = hexA(theme.ink, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y0 + 0.5);
    ctx.lineTo(colW, y0 + 0.5);
    ctx.stroke();
    ctx.restore();

    if (band !== "3-5" && y0 - y1 > 11) {
      caption(ctx, colW - 5, (y0 + y1) / 2, `${p.name}  ${p.start}`, theme, {
        align: "right", size: 9, color: theme.surface, weight: 700,
      });
    }
  }

  /* ---- fossils in the rock ----------------------------------------- */
  const glyph = band === "3-5" ? 5.5 : 4.5;
  for (const f of state.fossils) {
    const fy = toY(f.ma);
    if (fy > bottom || fy < top - 4) continue;
    const t = TAXA[f.taxon];
    const alive = t.last === 0;
    drawCreature(
      ctx, 8 + f.x * (colW - 20), fy, glyph * (0.4 + 0.6 * f.age),
      t.shape, alive ? theme.sci["producer"] : theme.sci["mass"],
    );
  }

  /* ---- the deposition front ---------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, frontY);
  ctx.lineTo(width, frontY);
  ctx.stroke();
  ctx.restore();
  caption(ctx, 6, Math.max(10, frontY - 9), `${state.timeMa.toFixed(0)} million years ago`, theme, {
    size: 12, color: theme.accent, weight: 800,
  });
  const p = periodAt(state.timeMa);
  if (p && band !== "3-5") {
    caption(ctx, 6, Math.max(22, frontY + 11), `${p.name} · ${p.era}`, theme, {
      size: 10, color: theme.inkSoft,
    });
  }

  /* ---- range chart and diversity curve ------------------------------ */
  if (chartW > 90) {
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.42 : 0.6);
    ctx.fillRect(chartX - 4, top - 8, chartW + 8, bottom - top + 16);
    ctx.restore();

    // Mass extinctions as bands across the whole chart.
    if (overlays.extinctions !== false) {
      for (const e of EXTINCTIONS) {
        const ey = toY(e.ma);
        ctx.save();
        ctx.strokeStyle = hexA(theme.sci["force"], state.timeMa <= e.ma ? 0.85 : 0.25);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(chartX - 4, ey);
        ctx.lineTo(width, ey);
        ctx.stroke();
        ctx.restore();
        if (band !== "3-5" && state.timeMa <= e.ma) {
          caption(ctx, width - 6, ey - 6, `${e.name} −${e.lossPercent}%`, theme, {
            align: "right", size: 8, color: theme.sci["force"],
          });
        }
      }
    }

    const laneW = chartW / TAXA.length;
    for (let i = 0; i < TAXA.length; i++) {
      const t = TAXA[i];
      const lx = chartX + laneW * (i + 0.5);
      const yFirst = toY(Math.min(t.first, OLDEST_MA));
      const yLast = toY(Math.max(t.last, state.timeMa));
      if (state.timeMa > t.first) continue;
      const dead = state.timeMa < t.last;
      ctx.save();
      ctx.strokeStyle = dead ? hexA(theme.sci["mass"], 0.7) : theme.sci["producer"];
      ctx.lineWidth = Math.max(2, Math.min(5, laneW - 3));
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lx, yFirst);
      ctx.lineTo(lx, yLast);
      ctx.stroke();
      ctx.restore();
      if (dead) {
        // A cross where the group ends: the record's own full stop.
        ctx.save();
        ctx.strokeStyle = theme.sci["force"];
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lx - 3, yLast - 3);
        ctx.lineTo(lx + 3, yLast + 3);
        ctx.moveTo(lx + 3, yLast - 3);
        ctx.lineTo(lx - 3, yLast + 3);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (overlays.diversity !== false && state.sampleMa.length > 1) {
      const maxDiv = TAXA.length;
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < state.sampleMa.length; i++) {
        const px = chartX + (state.sampleDiv[i] / maxDiv) * chartW;
        const py = toY(state.sampleMa[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      caption(ctx, chartX, top - 2, "groups alive →", theme, { size: 9, color: theme.accent });
    }
  }

  /* ---- an extinction just happened ---------------------------------- */
  if (state.flash > 0 && state.lastExtinction >= 0) {
    const e = EXTINCTIONS[state.lastExtinction];
    ctx.save();
    ctx.globalAlpha = state.flash * 0.3;
    ctx.fillStyle = theme.sci["force"];
    ctx.fillRect(0, 0, width, topH);
    ctx.restore();
    caption(ctx, width / 2, topH * 0.42, e.name, theme, {
      align: "center", size: 20, color: theme.sci["force"], weight: 800,
    });
    caption(ctx, width / 2, topH * 0.42 + 18, `${e.lossPercent}% of species lost — ${e.cause}`, theme, {
      align: "center", size: 11, color: theme.ink,
    });
  }

  if (seriesH > 0) drawSeries(rc, 8, topH + 8, width - 16, seriesH - 10);

  vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const fossilRecordSim: SimManifest<State> = {
  id: "bio.fossil-record",
  title: "The Fossil Record",
  tagline: "Run 540 million years of rock past you and watch which groups arrive, and which stop.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-LS4-1", "MS-LS4-2", "MS-ESS1-4", "HS-LS4-1"] },
  learningGoals: [
    "Read a rock column: deeper layers were laid down earlier.",
    "Place a fossil group on the geologic time scale using its first and last appearance.",
    "Describe a transitional series and what it shows.",
    "Find mass extinctions in fossil data rather than being told where they are.",
  ],
  misconceptions: [
    "All fossils are the same age",
    "Dinosaurs and early humans lived at the same time",
    "There are no transitional fossils",
    "Extinction is rare and unusual",
  ],
  interactionHint: "Press play. Watch which range bars stop at the dashed lines.",
  tickRate: 60,
  params: {
    startMa: {
      type: "number", label: "Start from", kind: "count",
      min: 0, max: 540, step: 10, default: 520,
      marks: [
        { value: 540, label: "Cambrian" },
        { value: 250, label: "Permian end" },
        { value: 66, label: "Asteroid" },
      ],
      help: "Millions of years ago. Changing it starts a fresh column.",
    },
    rate: {
      type: "number", label: "Millions of years per second", kind: "count",
      min: 0, max: 60, step: 2, default: 20,
      help: "Set it to zero to freeze the clock and study one moment.",
    },
    fossilRate: {
      type: "number", label: "Fossils buried per million years", kind: "count",
      min: 0.2, max: 4, step: 0.2, default: 1.4,
      bands: ["6-8", "9-12"],
      help: "Fossilisation is rare. Most organisms leave nothing behind at all.",
    },
    series: {
      type: "option", label: "Transitional series",
      options: [
        { value: "whales", label: "Land mammal to whale" },
        { value: "tetrapods", label: "Fish to four-legged animal" },
        { value: "horses", label: "Browser to horse" },
      ],
      default: "whales",
    },
  },
  overlays: [
    { key: "extinctions", label: "Mass extinctions", default: true },
    { key: "diversity", label: "Diversity curve", default: true, bands: ["6-8", "9-12"] },
    { key: "series", label: "Transitional series", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "who-was-first",
      title: "Which group came first?",
      question: "Fish, reptiles, birds and flowering plants. What order do they appear in the rock?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS4-1"],
      setup: { startMa: 540, rate: 20, fossilRate: 1.4, series: "tetrapods" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Put these in the order they first appear: birds, sharks, flowering plants, reptiles.",
          predict: {
            prompt: "Which of these appears in the rock record first?",
            options: ["Birds", "Sharks", "Flowering plants", "Reptiles"],
            correct: 1,
            reveal:
              "Sharks, at about 420 million years ago. Reptiles follow at 318, birds at 150, and flowering plants at 130.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the record",
          instruction: "Play from 540 million years ago and record when each group's bar starts.",
          requireData: 4,
          check: {
            describe: "Reached the age of the dinosaurs",
            test: (v) => (v.facts.timeMa as number) <= 200,
          },
          hints: ["A bar begins at the group's first appearance and ends at its last."],
        },
        {
          id: "deeper",
          phase: "analyze",
          title: "Deeper means older",
          instruction: "Look at the column. Which fossils are near the bottom, and why?",
          check: {
            describe: "The column is in superposition order",
            test: (v) => v.facts.superpositionOrdered === true,
          },
          write: {
            prompt: "Why is a fossil found lower in a cliff older than one found higher up?",
            placeholder: "The lower layer was laid down ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write the rule a geologist uses to date a fossil from its layer.",
          write: {
            prompt: "How can you tell which of two fossils is older without any dating equipment?",
            placeholder: "If one is found below the other, then ...",
          },
        },
      ],
    },
    {
      id: "find-the-extinctions",
      title: "Find the mass extinctions",
      question: "Can you spot the five worst moments in the history of life from the data alone?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS4-1"],
      setup: { startMa: 540, rate: 20, fossilRate: 1.4, series: "whales" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One of the five extinctions was far worse than the others.",
          predict: {
            prompt: "Which mass extinction killed the largest share of species?",
            options: [
              "End-Ordovician, 444 million years ago",
              "End-Permian, 252 million years ago",
              "End-Cretaceous, 66 million years ago",
            ],
            correct: 1,
            reveal:
              "The End-Permian, sometimes called the Great Dying: up to 96% of marine species. The asteroid that ended the dinosaurs took about 76%.",
          },
        },
        {
          id: "permian",
          phase: "measure",
          title: "Run past the Permian",
          instruction: "Play until you are past 250 million years ago. Watch the diversity curve.",
          check: {
            describe: "Past the end-Permian extinction",
            test: (v) => (v.facts.timeMa as number) <= 250,
          },
          requireData: 3,
          hints: ["Trilobites survived four hundred million years, and stop here."],
        },
        {
          id: "kpg",
          phase: "measure",
          title: "Now run past 66",
          instruction: "Keep going past the asteroid. Which bars stop there?",
          check: {
            describe: "Past the end-Cretaceous extinction",
            test: (v) => (v.facts.timeMa as number) <= 60 && v.facts.dinosaursAlive === false,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Read the pattern",
          instruction: "Say what a mass extinction looks like in fossil data.",
          write: {
            prompt: "What does the fossil record actually show at a mass extinction, and what happens afterwards?",
            placeholder: "Many groups stop at the same layer, and then ...",
          },
          hints: ["Look at what mammals and birds do after 66 million years ago."],
        },
      ],
    },
  ],
  challenges: [
    {
      id: "date-the-layer",
      title: "Date the layer",
      brief: "Freeze the clock in the Jurassic, with dinosaurs alive and no grasses yet.",
      bands: ["6-8", "9-12"],
      setup: { startMa: 540, rate: 20, fossilRate: 1.4, series: "whales" },
      goal: {
        describe: "Stopped inside the Jurassic",
        test: (v) => v.facts.period === "Jurassic",
      },
      stars: {
        two: {
          describe: "With dinosaurs alive and trilobites already gone",
          test: (v) =>
            v.facts.period === "Jurassic" && v.facts.dinosaursAlive === true &&
            v.facts.trilobitesAlive === false,
        },
        three: {
          describe: "And at least 60 fossils collected",
          test: (v) =>
            v.facts.period === "Jurassic" && v.facts.dinosaursAlive === true &&
            (v.facts.fossilCount as number) >= 60,
        },
      },
      hints: [
        "The Jurassic runs from 201.4 to 145 million years ago.",
        "Turn the rate down to zero to stop exactly where you want.",
      ],
    },
    {
      id: "last-survivor",
      title: "The last trilobite",
      brief: "Stop the clock in the last five million years that trilobites were alive.",
      bands: ["6-8", "9-12"],
      setup: { startMa: 300, rate: 10, fossilRate: 2, series: "tetrapods" },
      goal: {
        describe: "Trilobites alive, within 5 Ma of their extinction",
        test: (v) =>
          v.facts.trilobitesAlive === true && (v.facts.timeMa as number) <= 257 &&
          (v.facts.timeMa as number) >= 251.9,
      },
      hints: [
        "Trilobites appear 521 million years ago and vanish at the end-Permian extinction.",
        "That extinction is at 251.9 million years ago.",
      ],
    },
  ],
};
