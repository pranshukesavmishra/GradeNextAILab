import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { badge, caption, hexA, isDarkTheme, material, sky, vignette } from "@ui/scene";

/**
 * Rock Strata and Deep Time — Grades 6-12.
 *
 * A cliff face the student digs out layer by layer, and a geologic time scale
 * beside it that fills in as they go. Every formation here is real, with the
 * age geologists have measured for it: the Grand Canyon's stack from the
 * Vishnu Schist to the Kaibab Limestone, and the California Coast Ranges from
 * the Franciscan Complex up through the Monterey Formation.
 *
 * The point of putting the two side by side is the gaps. Laid out as a column
 * of layers, the Grand Canyon looks like a continuous record. Laid out against
 * time, the Great Unconformity opens up: 1.2 *billion* years with no rock at
 * all, a hole in the record wider than everything above it put together. That
 * is what an unconformity is, and no cross-section alone can show it.
 *
 * Superposition, original horizontality and cross-cutting relations are all
 * here as things to use rather than things to recite: the dike is younger than
 * everything it cuts, the fault is younger than the layers it offsets and
 * older than the ones it does not, and the fossils bracket the ages.
 */

/* ------------------------------------------------------------------ *
 * The geologic time scale — International Commission on Stratigraphy
 * ------------------------------------------------------------------ */

export interface Interval {
  name: string;
  /** Age of the interval's base, in millions of years before present. */
  startMa: number;
  /** Age of its top. */
  endMa: number;
}

export const EONS: Interval[] = [
  { name: "Hadean", startMa: 4567, endMa: 4031 },
  { name: "Archean", startMa: 4031, endMa: 2500 },
  { name: "Proterozoic", startMa: 2500, endMa: 538.8 },
  { name: "Phanerozoic", startMa: 538.8, endMa: 0 },
];

export const ERAS: Interval[] = [
  { name: "Paleozoic", startMa: 538.8, endMa: 251.902 },
  { name: "Mesozoic", startMa: 251.902, endMa: 66.0 },
  { name: "Cenozoic", startMa: 66.0, endMa: 0 },
];

export const PERIODS: Interval[] = [
  { name: "Cambrian", startMa: 538.8, endMa: 485.4 },
  { name: "Ordovician", startMa: 485.4, endMa: 443.8 },
  { name: "Silurian", startMa: 443.8, endMa: 419.2 },
  { name: "Devonian", startMa: 419.2, endMa: 358.9 },
  { name: "Carboniferous", startMa: 358.9, endMa: 298.9 },
  { name: "Permian", startMa: 298.9, endMa: 251.902 },
  { name: "Triassic", startMa: 251.902, endMa: 201.4 },
  { name: "Jurassic", startMa: 201.4, endMa: 145.0 },
  { name: "Cretaceous", startMa: 145.0, endMa: 66.0 },
  { name: "Paleogene", startMa: 66.0, endMa: 23.03 },
  { name: "Neogene", startMa: 23.03, endMa: 2.58 },
  { name: "Quaternary", startMa: 2.58, endMa: 0 },
];

/** Which interval contains a given age. Intervals are closed at their base. */
export function intervalAt(list: Interval[], ma: number): string {
  for (const iv of list) {
    if (ma <= iv.startMa && ma > iv.endMa) return iv.name;
  }
  // Anything younger than the youngest top belongs to that youngest interval.
  const last = list[list.length - 1];
  return ma <= last.startMa ? last.name : "before the record";
}

export const periodAt = (ma: number) => intervalAt(PERIODS, ma);
export const eraAt = (ma: number) => intervalAt(ERAS, ma);
export const eonAt = (ma: number) => intervalAt(EONS, ma);

/* ------------------------------------------------------------------ *
 * Index fossils, with the ranges palaeontologists actually use
 * ------------------------------------------------------------------ */

export interface FossilKind {
  name: string;
  firstMa: number;
  lastMa: number;
  /** A good index fossil is short-lived, widespread and easy to recognise. */
  goodIndex: boolean;
}

export const FOSSILS: Record<string, FossilKind> = {
  trilobite: { name: "Trilobite", firstMa: 521, lastMa: 252, goodIndex: true },
  fusulinid: { name: "Fusulinid", firstMa: 340, lastMa: 252, goodIndex: true },
  graptolite: { name: "Graptolite", firstMa: 490, lastMa: 320, goodIndex: true },
  ammonite: { name: "Ammonite", firstMa: 409, lastMa: 66, goodIndex: true },
  dinosaur: { name: "Dinosaur bone", firstMa: 233, lastMa: 66, goodIndex: true },
  // Still alive today, so finding one tells you almost nothing about the age.
  brachiopod: { name: "Brachiopod", firstMa: 541, lastMa: 0, goodIndex: false },
  crinoid: { name: "Crinoid", firstMa: 485, lastMa: 0, goodIndex: false },
  fern: { name: "Fern frond", firstMa: 380, lastMa: 0, goodIndex: false },
  diatom: { name: "Diatom", firstMa: 190, lastMa: 0, goodIndex: false },
  trackway: { name: "Reptile trackway", firstMa: 320, lastMa: 0, goodIndex: false },
  whale: { name: "Whale bone", firstMa: 50, lastMa: 0, goodIndex: true },
  mammal: { name: "Mammal tooth", firstMa: 66, lastMa: 0, goodIndex: false },
  mollusc: { name: "Marine shells", firstMa: 500, lastMa: 0, goodIndex: false },
};

/* ------------------------------------------------------------------ *
 * The cliff faces
 * ------------------------------------------------------------------ */

export type Lithology =
  | "sandstone" | "shale" | "limestone" | "conglomerate"
  | "basement" | "diatomite" | "intrusion";

export interface Layer {
  name: string;
  rock: Lithology;
  /** Age of the top of the unit, Ma. */
  topMa: number;
  /** Age of its base, Ma. */
  baseMa: number;
  thicknessM: number;
  fossils: string[];
  environment: string;
}

export interface CutFeature {
  kind: "dike" | "fault";
  name: string;
  ageMa: number;
  /** How many layers up from the bottom it reaches. */
  cutsUpTo: number;
  note: string;
}

export interface Site {
  key: string;
  label: string;
  where: string;
  /** Layers listed youngest first, exactly as they appear on the cliff. */
  layers: Layer[];
  cuts: CutFeature[];
}

/**
 * The Grand Canyon's Paleozoic stack on Proterozoic basement. Ages are the
 * conventional ones quoted by the US Geological Survey for each formation.
 */
const GRAND_CANYON: Site = {
  key: "canyon",
  label: "Colorado Plateau",
  where: "Grand Canyon, Arizona",
  layers: [
    { name: "Kaibab Limestone", rock: "limestone", topMa: 270, baseMa: 273, thicknessM: 90, fossils: ["brachiopod", "crinoid"], environment: "warm shallow sea" },
    { name: "Toroweap Formation", rock: "limestone", topMa: 273, baseMa: 275, thicknessM: 70, fossils: ["brachiopod"], environment: "shallow sea and coastal flats" },
    { name: "Coconino Sandstone", rock: "sandstone", topMa: 275, baseMa: 280, thicknessM: 100, fossils: ["trackway"], environment: "desert sand dunes" },
    { name: "Hermit Formation", rock: "shale", topMa: 280, baseMa: 285, thicknessM: 80, fossils: ["fern"], environment: "river floodplain" },
    { name: "Supai Group", rock: "sandstone", topMa: 285, baseMa: 320, thicknessM: 300, fossils: ["trackway", "fern"], environment: "coastal plain" },
    { name: "Redwall Limestone", rock: "limestone", topMa: 340, baseMa: 359, thicknessM: 150, fossils: ["crinoid", "brachiopod", "fusulinid"], environment: "clear tropical sea" },
    { name: "Muav Limestone", rock: "limestone", topMa: 505, baseMa: 510, thicknessM: 140, fossils: ["trilobite"], environment: "shallow sea" },
    { name: "Bright Angel Shale", rock: "shale", topMa: 510, baseMa: 515, thicknessM: 100, fossils: ["trilobite", "brachiopod"], environment: "muddy offshore sea floor" },
    { name: "Tapeats Sandstone", rock: "sandstone", topMa: 515, baseMa: 525, thicknessM: 70, fossils: [], environment: "beach of an advancing sea" },
    { name: "Vishnu Schist", rock: "basement", topMa: 1700, baseMa: 1750, thicknessM: 400, fossils: [], environment: "metamorphosed deep crust" },
  ],
  cuts: [
    {
      kind: "dike", name: "Zoroaster Granite", ageMa: 1680, cutsUpTo: 1,
      note: "Granite forced into the schist, so it must be younger than the schist.",
    },
  ],
};

/** The California Coast Ranges: subduction mélange, forearc basin, then oil shale. */
const COAST_RANGES: Site = {
  key: "coast",
  label: "California Coast Ranges",
  where: "Santa Cruz Mountains, California",
  layers: [
    { name: "Alluvium", rock: "conglomerate", topMa: 0, baseMa: 0.5, thicknessM: 20, fossils: ["mammal"], environment: "river gravel" },
    { name: "Purisima Formation", rock: "sandstone", topMa: 2.5, baseMa: 7, thicknessM: 120, fossils: ["mollusc", "whale"], environment: "shallow marine shelf" },
    { name: "Santa Cruz Mudstone", rock: "shale", topMa: 7, baseMa: 9, thicknessM: 90, fossils: ["diatom"], environment: "deep quiet basin" },
    { name: "Monterey Formation", rock: "diatomite", topMa: 9, baseMa: 17.5, thicknessM: 200, fossils: ["diatom"], environment: "cold upwelling ocean full of plankton" },
    { name: "Great Valley Sequence", rock: "shale", topMa: 66, baseMa: 140, thicknessM: 400, fossils: ["ammonite", "mollusc"], environment: "forearc basin beside a trench" },
    { name: "Franciscan Complex", rock: "basement", topMa: 140, baseMa: 165, thicknessM: 350, fossils: [], environment: "scraped off a subducting plate" },
  ],
  cuts: [
    {
      kind: "fault", name: "San Gregorio Fault", ageMa: 6, cutsUpTo: 4,
      note: "It offsets the Monterey and everything below, but not the alluvium on top.",
    },
  ],
};

/** A teaching cliff: two unconformities, a fault and a dike to put in order. */
const MYSTERY: Site = {
  key: "mystery",
  label: "Mystery cliff",
  where: "an unnamed road cut",
  layers: [
    { name: "Soil and gravel", rock: "conglomerate", topMa: 0, baseMa: 0.02, thicknessM: 4, fossils: ["mammal"], environment: "modern hillside" },
    { name: "Yellow sandstone", rock: "sandstone", topMa: 30, baseMa: 45, thicknessM: 60, fossils: ["mammal"], environment: "river channel" },
    { name: "Grey shale", rock: "shale", topMa: 72, baseMa: 88, thicknessM: 80, fossils: ["ammonite", "dinosaur"], environment: "shallow sea near a coast" },
    { name: "Pale limestone", rock: "limestone", topMa: 150, baseMa: 165, thicknessM: 110, fossils: ["ammonite", "crinoid"], environment: "warm open sea" },
    { name: "Red sandstone", rock: "sandstone", topMa: 200, baseMa: 235, thicknessM: 90, fossils: [], environment: "desert" },
    { name: "Dark shale", rock: "shale", topMa: 300, baseMa: 325, thicknessM: 120, fossils: ["trilobite", "brachiopod", "fusulinid"], environment: "deep muddy sea floor" },
  ],
  cuts: [
    {
      kind: "fault", name: "The fault", ageMa: 25, cutsUpTo: 4,
      note: "It offsets everything up to the grey shale, but stops below the yellow sandstone.",
    },
    {
      kind: "dike", name: "Basalt dike", ageMa: 12, cutsUpTo: 5,
      note: "It cuts straight through every layer it touches, so it is younger than all of them.",
    },
  ],
};

export const SITES: Record<string, Site> = {
  canyon: GRAND_CANYON,
  coast: COAST_RANGES,
  mystery: MYSTERY,
};

/* ------------------------------------------------------------------ *
 * Reading the record
 * ------------------------------------------------------------------ */

export interface Gap {
  /** Index of the layer above the gap. */
  above: number;
  topMa: number;
  bottomMa: number;
  gapMyr: number;
}

/** Every missing interval in the sequence — the unconformities. */
export function gapsOf(site: Site): Gap[] {
  const out: Gap[] = [];
  for (let i = 0; i < site.layers.length - 1; i++) {
    const above = site.layers[i];
    const below = site.layers[i + 1];
    const gap = below.topMa - above.baseMa;
    // A gap of less than a million years is a bedding plane, not an unconformity.
    if (gap > 1) out.push({ above: i, topMa: above.baseMa, bottomMa: below.topMa, gapMyr: gap });
  }
  return out;
}

/** True when every layer really is younger than the one beneath it. */
export function superpositionHolds(site: Site): boolean {
  for (let i = 0; i < site.layers.length - 1; i++) {
    if (site.layers[i].baseMa > site.layers[i + 1].topMa) return false;
    if (site.layers[i].topMa > site.layers[i].baseMa) return false;
  }
  return true;
}

/**
 * The age window a set of fossils allows, using only their known ranges.
 * This is what relative dating actually delivers: a bracket, not a number.
 */
export function fossilBracket(keys: string[]): { youngest: number; oldest: number } | null {
  let oldest = Infinity;
  let youngest = 0;
  let any = false;
  for (const k of keys) {
    const f = FOSSILS[k];
    if (!f) continue;
    any = true;
    oldest = Math.min(oldest, f.firstMa);
    youngest = Math.max(youngest, f.lastMa);
  }
  return any ? { youngest, oldest } : null;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** How much of the face has been cleared, 0-1. Animates toward the control. */
  revealed: number;
  /** Layers whose top has been exposed at least once. */
  found: boolean[];
  discoveries: number;
  /** Puff of dust when a new layer appears, for the eye. */
  flash: number;
  flashLayer: number;
  seconds: number;
}

function siteOf(params: Record<string, number | boolean | string>): Site {
  return SITES[params.site as string] ?? GRAND_CANYON;
}

/** Cumulative thickness fraction at the base of layer i, from the top down. */
export function depthFractions(site: Site): number[] {
  const total = site.layers.reduce((a, l) => a + l.thicknessM, 0);
  const out: number[] = [];
  let run = 0;
  for (const l of site.layers) {
    run += l.thicknessM;
    out.push(run / total);
  }
  return out;
}

function makeState(site: Site): State {
  return {
    revealed: 0,
    found: site.layers.map(() => false),
    discoveries: 0,
    flash: 0,
    flashLayer: -1,
    seconds: 0,
  };
}

const model: SimModel<State> = {
  init(params) {
    return makeState(siteOf(params));
  },

  applyParams(state, params, prev) {
    if (params.site !== prev.site) return makeState(siteOf(params));
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const site = siteOf(params);
    const target = (params.excavate as number) / 100;
    // Digging takes effort: the face clears at a steady rate rather than
    // jumping, so a student sees each contact appear in turn.
    const rate = 0.35;
    let revealed = state.revealed;
    if (revealed < target) revealed = Math.min(target, revealed + rate * dt);
    else if (revealed > target) revealed = Math.max(target, revealed - rate * 2 * dt);

    const fractions = depthFractions(site);
    const found = state.found.slice();
    let discoveries = state.discoveries;
    let flash = Math.max(0, state.flash - dt * 1.4);
    let flashLayer = state.flashLayer;
    for (let i = 0; i < site.layers.length; i++) {
      const topFraction = i === 0 ? 0 : fractions[i - 1];
      if (!found[i] && revealed > topFraction + 0.005) {
        found[i] = true;
        discoveries++;
        flash = 1;
        flashLayer = i;
      }
    }

    return { revealed, found, discoveries, flash, flashLayer, seconds: state.seconds + dt };
  },

  readouts(state, params) {
    const site = siteOf(params);
    const gaps = gapsOf(site);
    const biggest = gaps.reduce((a, g) => (g.gapMyr > a ? g.gapMyr : a), 0);
    const sel = Math.min(Math.round(params.inspect as number), site.layers.length - 1);
    const layer = site.layers[sel];
    return [
      {
        key: "exposed", label: "Layers exposed", quantity: q(state.discoveries, "count"),
        semantic: "distance", graphable: true,
      },
      {
        key: "selectedAge", label: "Age of the layer you are inspecting",
        quantity: q(layer.topMa * 1e6 * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false,
      },
      {
        key: "spanMyr", label: "Time recorded by this cliff (Myr)",
        quantity: q(site.layers[site.layers.length - 1].baseMa - site.layers[0].topMa, "ratio"),
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "missingMyr", label: "Biggest gap in the record (Myr)",
        quantity: q(biggest, "ratio"),
        semantic: "acceleration", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "thickness", label: "Thickness of the layer you are inspecting",
        quantity: q(layer.thicknessM, "length"), unit: "m",
        semantic: "distance", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "duration", label: "Years that layer took to form",
        quantity: q((layer.baseMa - layer.topMa) * 1e6 * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const site = siteOf(params);
    const gaps = gapsOf(site);
    const biggest = gaps.reduce<Gap | null>(
      (a, g) => (a === null || g.gapMyr > a.gapMyr ? g : a), null,
    );
    const sel = Math.min(Math.round(params.inspect as number), site.layers.length - 1);
    const layer = site.layers[sel];
    const bracket = fossilBracket(layer.fossils);
    const youngest = site.layers[0];
    const oldest = site.layers[site.layers.length - 1];
    return {
      site: site.key,
      siteLabel: site.label,
      layerCount: site.layers.length,
      exposedCount: state.discoveries,
      allExposed: state.discoveries >= site.layers.length,
      revealed: state.revealed,
      topAgeMa: youngest.topMa,
      bottomAgeMa: oldest.baseMa,
      spanMyr: oldest.baseMa - youngest.topMa,
      superpositionHolds: superpositionHolds(site),
      unconformities: gaps.length,
      biggestGapMyr: biggest ? biggest.gapMyr : 0,
      biggestGapTopMa: biggest ? biggest.topMa : 0,
      biggestGapBottomMa: biggest ? biggest.bottomMa : 0,
      selectedIndex: sel,
      selectedName: layer.name,
      selectedRock: layer.rock,
      selectedAgeMa: layer.topMa,
      selectedBaseMa: layer.baseMa,
      selectedPeriod: periodAt(layer.topMa),
      selectedEra: eraAt(layer.topMa),
      selectedEon: eonAt(layer.topMa),
      selectedEnvironment: layer.environment,
      selectedFossilCount: layer.fossils.length,
      selectedHasIndexFossil: layer.fossils.some((f) => FOSSILS[f]?.goodIndex),
      fossilYoungestMa: bracket ? bracket.youngest : -1,
      fossilOldestMa: bracket ? bracket.oldest : -1,
      // Layers, unconformities and every cross-cutting feature are all events.
      eventCount: site.layers.length + gaps.length + site.cuts.length,
      cutCount: site.cuts.length,
      youngestCutMa: site.cuts.length
        ? site.cuts.reduce((a, c) => Math.min(a, c.ageMa), Infinity) : -1,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function lithColor(rock: Lithology, theme: RenderContext<State>["theme"]): string {
  switch (rock) {
    case "sandstone": return theme.sci["gas"];
    case "shale": return theme.sci["mass"];
    case "limestone": return mixHex(theme.sci["time"], "#ffffff", 0.3);
    case "diatomite": return mixHex(theme.sci["time"], "#ffffff", 0.6);
    case "conglomerate": return theme.sci["decomposer"];
    case "basement": return theme.sci["field"];
    case "intrusion": return theme.sci["hot"];
  }
}

/** A log scale on age, so a billion years and a thousand both stay visible. */
function ageScale(maxMa: number, y0: number, y1: number) {
  const lo = Math.log10(0.01);
  const hi = Math.log10(Math.max(maxMa, 1) * 1.15);
  return (ma: number) => y0 + ((Math.log10(Math.max(ma, 0.01)) - lo) / (hi - lo)) * (y1 - y0);
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band, time } = rc;
  const site = siteOf(params);
  const dark = isDarkTheme(theme);
  const showScale = band !== "K-2" && overlays.timescale !== false;
  const cliffW = showScale ? width * 0.58 : width;
  const skyH = Math.min(70, height * 0.16);

  sky(ctx, width, height, theme, "day", skyH);

  const fractions = depthFractions(site);
  const cliffTop = skyH;
  const cliffBottom = height - 4;
  const cliffH = cliffBottom - cliffTop;
  const toY = (frac: number) => cliffTop + frac * cliffH;
  const sel = Math.min(Math.round(params.inspect as number), site.layers.length - 1);

  /* --- the layers -------------------------------------------------- */
  for (let i = 0; i < site.layers.length; i++) {
    const layer = site.layers[i];
    const y0 = toY(i === 0 ? 0 : fractions[i - 1]);
    const y1 = toY(fractions[i]);
    const base = lithColor(layer.rock, theme);
    // Alternate a touch of shade so neighbouring beds never merge.
    const color = mixHex(base, dark ? "#000000" : "#ffffff", i % 2 === 0 ? 0 : 0.12);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, mixHex(color, "#ffffff", 0.18));
    g.addColorStop(1, mixHex(color, "#000000", 0.2));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, cliffW, y1 - y0);
    ctx.restore();

    // Bedding within the unit: the texture that says "this is layered rock".
    ctx.save();
    ctx.strokeStyle = hexA(dark ? "#ffffff" : "#000000", 0.12);
    ctx.lineWidth = 1;
    const beds = Math.max(1, Math.round((y1 - y0) / 9));
    ctx.beginPath();
    for (let b = 1; b < beds; b++) {
      const yy = y0 + ((y1 - y0) * b) / beds;
      ctx.moveTo(0, yy);
      ctx.lineTo(cliffW, yy);
    }
    ctx.stroke();
    ctx.restore();

    // Contacts.
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(cliffW, y1);
    ctx.stroke();
    ctx.restore();

    if (i === sel) {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, y0 + 1, cliffW - 2, y1 - y0 - 2);
      ctx.restore();
    }
  }

  /* --- unconformities: drawn as the ragged surfaces they are ------- */
  const gaps = gapsOf(site);
  for (const gap of gaps) {
    const y = toY(fractions[gap.above]);
    ctx.save();
    ctx.strokeStyle = theme.sci["acceleration"];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= cliffW; x += 12) {
      ctx.lineTo(x, y + (x % 24 === 0 ? -3.5 : 3.5));
    }
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2" && gap.gapMyr > 20) {
      caption(ctx, 8, y - 10,
        `unconformity — ${gap.gapMyr >= 1000
          ? `${(gap.gapMyr / 1000).toFixed(2)} billion` : `${Math.round(gap.gapMyr)} million`} years missing`,
        theme, { size: 11, color: theme.sci["acceleration"], weight: 800 });
    }
  }

  /* --- cross-cutting features -------------------------------------- */
  for (const cut of site.cuts) {
    const bottomIdx = site.layers.length - 1;
    const topIdx = Math.max(0, bottomIdx - cut.cutsUpTo + 1);
    const yTop = toY(topIdx === 0 ? 0 : fractions[topIdx - 1]);
    const yBot = cliffBottom;
    if (cut.kind === "dike") {
      const x = cliffW * 0.72;
      ctx.save();
      ctx.fillStyle = theme.sci["hot"];
      ctx.beginPath();
      ctx.moveTo(x - 9, yBot);
      ctx.lineTo(x + 5, yTop);
      ctx.lineTo(x + 19, yTop);
      ctx.lineTo(x + 5, yBot);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (band !== "K-2") {
        caption(ctx, x + 24, yTop + 14, cut.name, theme, {
          size: 11, color: theme.sci["hot"], weight: 700,
        });
      }
    } else {
      const x = cliffW * 0.34;
      ctx.save();
      ctx.strokeStyle = theme.sci["force"];
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(x - 22, yBot);
      ctx.lineTo(x + 16, yTop);
      ctx.stroke();
      ctx.restore();
      if (band !== "K-2") {
        caption(ctx, x + 22, yTop + 14, cut.name, theme, {
          size: 11, color: theme.sci["force"], weight: 700,
        });
      }
    }
  }

  /* --- fossils, drawn where they were found ------------------------ */
  if (overlays.fossils !== false) {
    for (let i = 0; i < site.layers.length; i++) {
      const layer = site.layers[i];
      if (!layer.fossils.length) continue;
      const y0 = toY(i === 0 ? 0 : fractions[i - 1]);
      const y1 = toY(fractions[i]);
      for (let k = 0; k < layer.fossils.length; k++) {
        const kind = FOSSILS[layer.fossils[k]];
        if (!kind) continue;
        const fx = cliffW * (0.12 + 0.16 * k);
        const fy = (y0 + y1) / 2 + (k % 2 === 0 ? -4 : 5);
        ctx.save();
        ctx.strokeStyle = kind.goodIndex ? theme.sci["energy-kinetic"] : theme.inkSoft;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        // A spiral for the coiled fossils, a simple shell shape otherwise.
        for (let a = 0; a < 12; a++) {
          const t = (a / 11) * Math.PI * 2.4;
          const r = 1.6 + t * 0.9;
          const px = fx + Math.cos(t) * r;
          const py = fy + Math.sin(t) * r;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* --- the talus still covering the un-excavated face -------------- */
  const cover = 1 - state.revealed;
  if (cover > 0.001) {
    const yCover = toY(state.revealed);
    ctx.save();
    ctx.fillStyle = theme.sci["decomposer"];
    ctx.beginPath();
    ctx.moveTo(0, yCover + 14);
    for (let x = 0; x <= cliffW; x += 16) {
      ctx.lineTo(x, yCover + 6 + Math.sin(x * 0.09 + 1.3) * 8);
    }
    ctx.lineTo(cliffW, cliffBottom);
    ctx.lineTo(0, cliffBottom);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = mixHex(theme.sci["decomposer"], "#000000", 0.35);
    for (let k = 0; k < 60; k++) {
      const px = ((k * 137) % Math.max(1, Math.round(cliffW)));
      const py = yCover + 20 + ((k * 53) % Math.max(1, Math.round(cliffBottom - yCover - 20)));
      ctx.fillRect(px, py, 3, 2);
    }
    ctx.restore();
    // Dust hanging in the air right after a new layer appears.
    if (state.flash > 0.02) {
      ctx.save();
      ctx.globalAlpha = state.flash * 0.5;
      ctx.fillStyle = theme.surfaceAlt;
      for (let k = 0; k < 14; k++) {
        const px = (k / 14) * cliffW + Math.sin(time * 2 + k) * 6;
        const py = yCover - 6 - ((time * 30 + k * 9) % 40);
        ctx.beginPath();
        ctx.arc(px, py, 3 + (k % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    caption(ctx, cliffW / 2, Math.min(cliffBottom - 12, yCover + 34),
      "still buried — keep digging", theme,
      { align: "center", size: 12, color: theme.surface, weight: 700 });
  }

  /* --- names on the exposed layers --------------------------------- */
  if (band !== "K-2") {
    for (let i = 0; i < site.layers.length; i++) {
      const topFraction = i === 0 ? 0 : fractions[i - 1];
      if (topFraction >= state.revealed - 0.004) continue;
      const y0 = toY(topFraction);
      const y1 = toY(Math.min(fractions[i], state.revealed));
      if (y1 - y0 < 13) continue;
      const layer = site.layers[i];
      caption(ctx, cliffW - 8, (y0 + y1) / 2, `${layer.name} · ${layer.topMa} Ma`, theme, {
        align: "right", size: 11,
        color: i === sel ? theme.accent : theme.ink,
        weight: i === sel ? 800 : 600,
      });
    }
  }

  /* --- a geologist for scale, because a cliff needs one ------------ */
  {
    const px = 26;
    const py = cliffBottom - 4;
    ctx.save();
    ctx.strokeStyle = dark ? "#f0f0f0" : "#101418";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px - 4, py - 9);
    ctx.moveTo(px, py); ctx.lineTo(px + 4, py - 9);
    ctx.moveTo(px, py - 9); ctx.lineTo(px, py - 20);
    ctx.moveTo(px - 6, py - 16); ctx.lineTo(px + 6, py - 14);
    ctx.stroke();
    ctx.fillStyle = dark ? "#f0f0f0" : "#101418";
    ctx.beginPath();
    ctx.arc(px, py - 24, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* --- the geologic time scale, where the gaps become visible ------ */
  if (showScale) {
    const x0 = cliffW + 10;
    const w = width - x0 - 8;
    const y0 = skyH + 22;
    const y1 = height - 18;
    const maxMa = site.layers[site.layers.length - 1].baseMa;
    const scale = ageScale(maxMa, y0, y1);

    ctx.save();
    ctx.globalAlpha = 0.94;
    material(ctx, x0 - 4, skyH + 4, w + 8, height - skyH - 8, theme.surfaceAlt, 8);
    ctx.restore();
    caption(ctx, x0, skyH + 15, "Geologic time  (millions of years ago)", theme, {
      size: 11, color: theme.inkSoft,
    });

    // Periods as a column of named bands.
    const list = maxMa > 600 ? EONS : PERIODS;
    for (const iv of list) {
      if (iv.startMa > maxMa * 1.15 && iv.endMa > maxMa * 1.15) continue;
      const ya = scale(Math.min(iv.startMa, maxMa * 1.15));
      const yb = scale(Math.max(iv.endMa, 0.01));
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = theme.sci["field"];
      ctx.fillRect(x0, yb, w * 0.34, ya - yb);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, ya);
      ctx.lineTo(x0 + w, ya);
      ctx.stroke();
      ctx.restore();
      if (ya - yb > 12) {
        caption(ctx, x0 + 4, (ya + yb) / 2, iv.name, theme, { size: 10, color: theme.inkSoft });
      }
    }

    // The layers, plotted against time. Now the gaps have width.
    for (let i = 0; i < site.layers.length; i++) {
      const layer = site.layers[i];
      const ya = scale(layer.baseMa);
      const yb = scale(layer.topMa);
      const exposed = state.found[i];
      ctx.save();
      ctx.globalAlpha = exposed ? 1 : 0.22;
      ctx.fillStyle = lithColor(layer.rock, theme);
      ctx.fillRect(x0 + w * 0.4, yb, w * 0.5, Math.max(2, ya - yb));
      if (i === sel) {
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 + w * 0.4, yb, w * 0.5, Math.max(2, ya - yb));
      }
      ctx.restore();
    }

    // And the gaps themselves, hatched, so "missing" reads as missing.
    for (const gap of gaps) {
      const ya = scale(gap.bottomMa);
      const yb = scale(gap.topMa);
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["acceleration"], 0.85);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let y = yb; y < ya; y += 6) {
        ctx.moveTo(x0 + w * 0.4, y);
        ctx.lineTo(x0 + w * 0.9, y + 5);
      }
      ctx.stroke();
      ctx.restore();
    }
    caption(ctx, x0 + w * 0.65, y1 + 10, "no rock = no record", theme, {
      align: "center", size: 10, color: theme.sci["acceleration"],
    });
  }

  /* --- the field note on the selected layer ------------------------ */
  if (band !== "K-2") {
    const layer = site.layers[sel];
    const bracket = fossilBracket(layer.fossils);
    const lines = [
      `${periodAt(layer.topMa)} · ${eraAt(layer.topMa)}`,
      `${layer.topMa}-${layer.baseMa} Ma · ${layer.thicknessM} m thick`,
      layer.environment,
      layer.fossils.length
        ? `fossils: ${layer.fossils.map((f) => FOSSILS[f]?.name ?? f).join(", ")}`
        : "no fossils found",
      bracket ? `fossils alone say: ${bracket.oldest}-${bracket.youngest} Ma` : "",
    ].filter(Boolean);
    const cw = Math.min(300, cliffW - 20);
    const chH = 16 * lines.length + 26;
    ctx.save();
    ctx.globalAlpha = 0.93;
    material(ctx, 8, skyH + 6, cw, chH, theme.surfaceAlt, 8);
    ctx.restore();
    caption(ctx, 16, skyH + 20, layer.name, theme, { size: 13, weight: 800, color: theme.accent });
    ctx.save();
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.textBaseline = "middle";
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 16, skyH + 38 + i * 16);
    ctx.restore();
  }

  caption(ctx, 10, 16, `${site.label} — ${site.where}`, theme, { size: 12 });
  if (band !== "K-2") {
    badge(ctx, width - 10, 18,
      `${state.discoveries}/${site.layers.length}`, theme,
      { align: "right", sub: "layers found" });
  }

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const strataSim: SimManifest<State> = {
  id: "earth.strata",
  title: "Reading Rock Strata",
  tagline: "Dig out a cliff face layer by layer and work out the order of everything that happened.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-ESS1-4", "MS-ESS2-2", "MS-LS4-1", "HS-ESS1-5", "HS-ESS1-6"] },
  learningGoals: [
    "Use superposition to put a sequence of rock layers in order.",
    "Use an index fossil to bracket the age of a layer.",
    "Recognise an unconformity and say how much time is missing from the record.",
    "Use cross-cutting relationships to place a fault or an intrusion in the sequence.",
    "Place a layer in the correct eon, era and period of the geologic time scale.",
  ],
  misconceptions: [
    "Rock layers record time continuously, with nothing missing",
    "The deepest layer is always the oldest rock at the site",
    "A thick layer always took longer to form than a thin one",
    "Any fossil can date a rock",
    "Geologic time can be pictured on an ordinary linear scale",
  ],
  interactionHint: "Drag the excavation slider to clear the face, then inspect a layer.",
  tickRate: 30,
  params: {
    site: {
      type: "option", label: "Cliff face",
      options: [
        { value: "canyon", label: "Colorado Plateau — Grand Canyon" },
        { value: "coast", label: "California Coast Ranges" },
        { value: "mystery", label: "Mystery cliff — put it in order" },
      ],
      default: "canyon",
      help: "Every layer, age and fossil in the first two is real.",
    },
    excavate: {
      type: "number", label: "Excavate the face (%)", kind: "percent",
      min: 0, max: 100, step: 1, default: 0,
      help: "Clear the loose rubble downward to expose one layer at a time.",
    },
    inspect: {
      type: "number", label: "Inspect layer number", kind: "count",
      min: 0, max: 9, step: 1, default: 0,
      help: "Layer 0 is the one at the very top — the youngest.",
    },
  },
  overlays: [
    { key: "timescale", label: "Geologic time scale", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "fossils", label: "Fossils", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "order-of-events",
      title: "What happened here, and in what order?",
      question: "A cliff has layers, a fault and a dike. Which came first?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-ESS1-4"],
      setup: { site: "mystery", excavate: 0, inspect: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "A dike cuts straight through six layers. Commit to an answer.",
          predict: {
            prompt: "The dike cuts through every layer it touches. When did it form?",
            options: [
              "Before the layers — they settled around it",
              "After all the layers it cuts through",
              "At the same time as the middle layer",
              "There is no way to tell",
            ],
            correct: 1,
            reveal:
              "A feature can only cut something that is already there. That is the principle of cross-cutting relationships, and it dates the dike as younger than every layer it passes through.",
          },
        },
        {
          id: "excavate",
          phase: "measure",
          title: "Dig the face out",
          instruction: "Raise the excavation to 100% and record each layer as it appears.",
          requireData: 4,
          check: {
            describe: "Every layer exposed",
            test: (v) => v.facts.allExposed === true,
          },
          hints: ["Work down slowly — each contact is a moment in the story."],
        },
        {
          id: "gap",
          phase: "analyze",
          title: "Find the missing time",
          instruction: "Look at the time scale on the right. Inspect the layers either side of the biggest gap.",
          check: {
            describe: "A gap of more than 50 million years is on the cliff",
            test: (v) => (v.facts.biggestGapMyr as number) > 50,
          },
          write: {
            prompt: "How many million years are missing at the biggest unconformity, and what could have removed that rock?",
            placeholder: "About ... million years are missing. That rock was probably ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the history",
          instruction: "List every event in order, oldest first.",
          write: {
            prompt: "Write the full sequence of events, oldest first, including the fault and the dike.",
            placeholder: "1. Dark shale was deposited ... 2. ...",
          },
          hints: [
            "Layers first, using superposition.",
            "The fault stops below one layer. That layer must be younger than the fault.",
            "The dike cuts everything, so it goes last.",
          ],
        },
      ],
    },
    {
      id: "index-fossils",
      title: "Which fossil actually dates a rock?",
      question: "Two layers both have fossils. Why does only one of them pin down an age?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS1-4", "MS-LS4-1"],
      setup: { site: "canyon", excavate: 100, inspect: 7 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Trilobites died out 252 million years ago. Brachiopods are still alive.",
          predict: {
            prompt: "Which fossil narrows the age of a layer more?",
            options: [
              "The brachiopod — there are far more of them",
              "The trilobite — it only existed for part of Earth's history",
              "Neither: fossils cannot date rock at all",
            ],
            correct: 1,
            reveal:
              "A good index fossil lived everywhere but only for a short slice of time. Finding a trilobite says the rock is between 521 and 252 million years old. Finding a brachiopod barely narrows it at all — they are still on the sea floor today.",
          },
        },
        {
          id: "trilobite",
          phase: "measure",
          title: "Find the trilobites",
          instruction: "Inspect the Bright Angel Shale. Record its age and its fossil bracket.",
          requireData: 1,
          check: {
            describe: "A layer with a good index fossil is selected",
            test: (v) => v.facts.selectedHasIndexFossil === true,
          },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Now a layer without one",
          instruction: "Inspect the Kaibab Limestone at the top and record its fossil bracket too.",
          requireData: 2,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Define an index fossil",
          instruction: "Two properties, one sentence.",
          write: {
            prompt: "What two things make a fossil useful for dating rock?",
            placeholder: "A good index fossil is ... and ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "great-unconformity",
      title: "Find the Great Unconformity",
      brief: "Expose the biggest gap in the Grand Canyon's record.",
      bands: ["6-8", "9-12"],
      setup: { site: "canyon", excavate: 0, inspect: 0 },
      goal: {
        describe: "Expose every layer at the Grand Canyon",
        test: (v) => v.facts.site === "canyon" && v.facts.allExposed === true,
      },
      stars: {
        two: {
          describe: "Select the layer directly above the billion-year gap",
          test: (v) =>
            v.facts.site === "canyon" && v.facts.allExposed === true
            && v.facts.selectedName === "Tapeats Sandstone",
        },
      },
      hints: [
        "The gap sits between the Tapeats Sandstone and the Vishnu Schist.",
        "It is over a thousand million years wide — more time than everything above it.",
      ],
    },
    {
      id: "oldest-fossil",
      title: "Date a layer with fossils alone",
      brief: "Find a layer whose fossils pin it to a window narrower than 300 million years.",
      bands: ["6-8", "9-12"],
      setup: { site: "mystery", excavate: 100, inspect: 0 },
      goal: {
        describe: "A layer whose fossil bracket is narrower than 300 Myr",
        test: (v) =>
          (v.facts.fossilOldestMa as number) > 0
          && (v.facts.fossilOldestMa as number) - (v.facts.fossilYoungestMa as number) < 300,
      },
      stars: {
        two: {
          describe: "Narrow it below 180 million years",
          test: (v) =>
            (v.facts.fossilOldestMa as number) > 0
            && (v.facts.fossilOldestMa as number) - (v.facts.fossilYoungestMa as number) < 180,
        },
      },
      hints: [
        "Two fossils together bracket an age better than one: the overlap is what counts.",
        "Ammonites and dinosaurs both vanish at 66 Ma. Together they are a sharp tool.",
      ],
    },
  ],
};
