import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, lerp, pulse, rimLight, softShadow, vignette,
} from "@ui/scene";
import {
  bokeh, callout, chloroplast, depthWash, golgi, membrane, mitochondrion, nucleus,
  organelleDot, reticulum,
} from "@ui/organic";

/**
 * Inside a Cell — Grades 5-10.
 *
 * A living cell you can zoom into, switch between animal and plant, and take
 * apart. Nothing here is a static poster: mitochondria pulse as they release
 * energy, chloroplasts catch the light rays falling on them, the cytoplasm
 * streams, and the nucleus sends messenger strands out through its pores to
 * the ribosomes. The organelles are *doing their jobs*, because a student who
 * only ever meets a labelled diagram learns the names and not the machine.
 *
 * The zoom is honest. It runs on a real decade ladder from two metres down to
 * two hundred nanometres, with a scale bar measured in the same metres a ruler
 * uses, so "cells are small" stops being a word and becomes a number.
 *
 * Grade 6 Unit B, topics B1 (cell theory, unicellular vs multicellular,
 * microscopic scale) and B2 (organelle structure and function).
 */

/* ------------------------------------------------------------------ *
 * The organelle roster — real presence, real sizes
 * ------------------------------------------------------------------ */

export interface OrganelleSpec {
  id: string;
  name: string;
  /** Found in an animal cell? */
  animal: boolean;
  /** Found in a plant cell? */
  plant: boolean;
  /** Part of the minimum working cell the build challenge demands. */
  core: boolean;
  /** Longest real dimension in metres. Textbook values, not decoration. */
  sizeM: number;
  /** Centre in cell-local coordinates, where the cell spans -1..1. */
  x: number;
  y: number;
  /** Drawn radius as a fraction of the cell radius. */
  r: number;
  /** How many copies are drawn. */
  copies: number;
  /** What it does. */
  job: string;
  /** How its structure fits that job — the B2.6 idea. */
  structure: string;
}

/**
 * Sizes are the standard cell-biology values: a membrane about 7 nm thick, a
 * nucleus about 6 µm across, a mitochondrion about 1 µm wide, a chloroplast
 * about 5 µm, a ribosome about 25 nm.
 */
export const ORGANELLES: OrganelleSpec[] = [
  {
    id: "membrane", name: "Cell membrane", animal: true, plant: true, core: true,
    sizeM: 7e-9, x: 0, y: 0, r: 1, copies: 1,
    job: "Chooses what gets into the cell and what leaves.",
    structure: "Two oily layers back to back block water-loving molecules, while protein channels punched through them let chosen substances pass.",
  },
  {
    id: "wall", name: "Cell wall", animal: false, plant: true, core: true,
    sizeM: 1e-7, x: 0, y: 0, r: 1.06, copies: 1,
    job: "Holds the plant cell's box shape and stops it bursting.",
    structure: "Criss-crossed cellulose fibres, like fibreglass: stiff enough to take pressure, open enough to let water straight through.",
  },
  {
    id: "cytoplasm", name: "Cytoplasm", animal: true, plant: true, core: true,
    sizeM: 2e-5, x: 0, y: 0, r: 0.96, copies: 1,
    job: "The jelly where most chemical reactions happen and organelles sit.",
    structure: "Mostly water with dissolved salts, sugars and enzymes, so molecules can drift to wherever they are needed.",
  },
  {
    id: "nucleus", name: "Nucleus", animal: true, plant: true, core: true,
    sizeM: 6e-6, x: -0.06, y: 0.1, r: 0.3, copies: 1,
    job: "Stores the DNA and directs everything the cell builds.",
    structure: "A double membrane full of pores: the DNA stays protected inside while copied instructions slip out to the ribosomes.",
  },
  {
    id: "mitochondria", name: "Mitochondria", animal: true, plant: true, core: true,
    sizeM: 1e-6, x: 0.5, y: -0.35, r: 0.13, copies: 5,
    job: "Releases energy from glucose by respiration, and stores it as ATP.",
    structure: "The inner membrane is folded into cristae, packing an enormous working surface into something a thousandth of a millimetre wide.",
  },
  {
    id: "chloroplast", name: "Chloroplast", animal: false, plant: true, core: true,
    sizeM: 5e-6, x: -0.55, y: -0.4, r: 0.16, copies: 7,
    job: "Catches light and builds glucose out of carbon dioxide and water.",
    structure: "Stacks of green thylakoid discs hold the chlorophyll, so a single chloroplast catches far more light than a flat sheet could.",
  },
  {
    id: "vacuole", name: "Large central vacuole", animal: false, plant: true, core: false,
    sizeM: 1.5e-5, x: 0.1, y: -0.05, r: 0.42, copies: 1,
    job: "Stores water and pushes outward, keeping the plant firm.",
    structure: "One huge sac filling most of the cell, so a plant can stand up using water pressure instead of a skeleton.",
  },
  {
    id: "ribosome", name: "Ribosomes", animal: true, plant: true, core: true,
    sizeM: 2.5e-8, x: 0.1, y: 0.55, r: 0.035, copies: 9,
    job: "Builds proteins by joining amino acids in the order the DNA specifies.",
    structure: "Two subunits clamp around a messenger strand and read it three letters at a time — small enough that a cell can run millions at once.",
  },
  {
    id: "er", name: "Endoplasmic reticulum", animal: true, plant: true, core: false,
    sizeM: 1e-5, x: 0.34, y: 0.34, r: 0.34, copies: 1,
    job: "A folded highway that carries new proteins away from the nucleus.",
    structure: "Sheet after sheet folded into a small space, giving a huge surface for ribosomes to sit on and products to travel along.",
  },
  {
    id: "golgi", name: "Golgi body", animal: true, plant: true, core: false,
    sizeM: 1e-6, x: -0.5, y: 0.42, r: 0.16, copies: 1,
    job: "Finishes, labels and packages proteins for delivery.",
    structure: "A stack of flattened sacs; a protein moves through them one at a time and comes out the far end wrapped and addressed.",
  },
  {
    id: "lysosome", name: "Lysosome", animal: true, plant: false, core: false,
    sizeM: 5e-7, x: -0.42, y: -0.48, r: 0.08, copies: 3,
    job: "Digests worn-out parts and anything the cell has swallowed.",
    structure: "A tough bag of digestive enzymes kept sealed away, so the cell is never digested by its own tools.",
  },
  {
    id: "centriole", name: "Centrioles", animal: true, plant: false, core: false,
    sizeM: 5e-7, x: 0.52, y: 0.52, r: 0.07, copies: 2,
    job: "Organises the fibres that pull chromosomes apart when the cell divides.",
    structure: "Nine triplets of tiny tubes in a barrel — a rigid anchor point for fibres that must pull hard and straight.",
  },
];

export function organellesFor(cellType: string): OrganelleSpec[] {
  return ORGANELLES.filter((o) => (cellType === "plant" ? o.plant : o.animal));
}

export function coreFor(cellType: string): string[] {
  return organellesFor(cellType).filter((o) => o.core).map((o) => o.id);
}

/* ------------------------------------------------------------------ *
 * Organisms — the unicellular / multicellular contrast
 * ------------------------------------------------------------------ */

export interface OrganismSpec {
  key: string;
  name: string;
  /** Number of cells in one individual. */
  cells: number;
  /** Typical cell diameter, metres. */
  cellM: number;
  /** Whole-organism size, metres. */
  bodyM: number;
  note: string;
}

/**
 * The human cell count is Bianconi et al. (2013), 3.72 × 10¹³. The oak-leaf
 * count is an order-of-magnitude estimate: a 50 cm² leaf 0.2 mm thick is about
 * 1 × 10⁻⁶ m³, divided by the volume of a 30 µm cell.
 */
export const ORGANISMS: Record<string, OrganismSpec> = {
  human: {
    key: "human", name: "Human", cells: 3.72e13, cellM: 2e-5, bodyM: 1.7,
    note: "About 37 trillion cells, of roughly 200 different kinds.",
  },
  oakLeaf: {
    key: "oakLeaf", name: "Oak leaf", cells: 4e7, cellM: 5e-5, bodyM: 0.12,
    note: "Tens of millions of cells in one leaf, stacked in neat layers.",
  },
  amoeba: {
    key: "amoeba", name: "Amoeba", cells: 1, cellM: 4e-4, bodyM: 4e-4,
    note: "One cell is the whole animal: it hunts, eats and divides by itself.",
  },
  chlamydomonas: {
    key: "chlamydomonas", name: "Chlamydomonas", cells: 1, cellM: 1e-5, bodyM: 1e-5,
    note: "A single-celled alga: one cell, one chloroplast, two swimming tails.",
  },
};

export function organismFor(cellType: string, bodyPlan: string): OrganismSpec {
  if (bodyPlan === "unicellular") {
    return cellType === "plant" ? ORGANISMS.chlamydomonas : ORGANISMS.amoeba;
  }
  return cellType === "plant" ? ORGANISMS.oakLeaf : ORGANISMS.human;
}

/* ------------------------------------------------------------------ *
 * Chemistry the organelles actually run
 * ------------------------------------------------------------------ */

/**
 * Aerobic respiration yields about 30-32 ATP per glucose on modern counts
 * (older textbooks say 36-38). The ratios below are the real science; the
 * absolute rates are scaled so a student can watch molecules appear.
 */
export const ATP_PER_GLUCOSE = 30;
/** C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O, and photosynthesis is the same six the other way. */
export const O2_PER_GLUCOSE = 6;
export const CO2_PER_GLUCOSE = 6;

/** Glucose molecules a chloroplast makes per second at full light, model units. */
const PHOTO_RATE = 0.55;
/** Glucose molecules a mitochondrion burns per second, model units. */
const RESP_RATE = 0.42;

/** View width in metres at a zoom level: a clean decade ladder from 2 m down. */
export function viewSpan(zoom: number): number {
  return 2 * Math.pow(10, -zoom);
}

/** A 1, 2 or 5 × 10ⁿ length just under the target — the scale-bar convention. */
export function niceLength(target: number): number {
  if (!(target > 0)) return 1;
  const exp = Math.floor(Math.log10(target));
  const base = Math.pow(10, exp);
  const f = target / base;
  return (f >= 5 ? 5 : f >= 2 ? 2 : 1) * base;
}

export function metreLabel(m: number): string {
  const trim = (v: number) => (Math.abs(v % 1) < 1e-6 ? String(Math.round(v)) : v.toFixed(1));
  if (m >= 1) return `${trim(m)} m`;
  if (m >= 1e-3) return `${trim(m * 1e3)} mm`;
  if (m >= 1e-6) return `${trim(m * 1e6)} µm`;
  return `${trim(m * 1e9)} nm`;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Spark {
  /** Cell-local position, -1..1. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  /** 0 ATP · 1 oxygen · 2 glucose · 3 messenger strand. */
  kind: number;
}

interface Streamer {
  a: number;
  r: number;
  v: number;
}

interface State {
  t: number;
  /** Cytoplasmic streaming, which is genuinely visible in plant cells. */
  stream: Streamer[];
  sparks: Spark[];
  glucose: number;
  glucoseUsed: number;
  atp: number;
  o2: number;
  co2: number;
  /** Parts placed in build mode, in the order they were added. */
  built: string[];
  /** Why the last placement was refused, or "". */
  message: string;
  /** Organelle the student clicked through to, or "" while the control rules. */
  clicked: string;
  clicks: number;
}

const MAX_SPARKS = 54;

function buildStream(seedFn: () => number): Streamer[] {
  const out: Streamer[] = [];
  for (let i = 0; i < 24; i++) {
    out.push({
      a: (i / 24) * Math.PI * 2,
      r: 0.42 + seedFn() * 0.46,
      v: 0.22 + seedFn() * 0.3,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    const rng = ctx.rng.fork("cell");
    return {
      t: 0,
      stream: buildStream(() => rng.next()),
      sparks: [],
      glucose: params.cellType === "plant" ? 0 : 40,
      glucoseUsed: 0,
      atp: 0,
      o2: 0,
      co2: 0,
      built: params.mode === "build" ? [] : organellesFor(params.cellType as string).map((o) => o.id),
      message: "",
      clicked: "",
      clicks: 0,
    };
  },

  applyParams(state, params, prev, ctx) {
    let s = state;
    // A different cell or a switch into Build is a request for a fresh cell.
    if (params.cellType !== prev.cellType || params.mode !== prev.mode) {
      s = {
        ...s,
        built: params.mode === "build" ? [] : organellesFor(params.cellType as string).map((o) => o.id),
        sparks: [],
        message: "",
        clicked: "",
        clicks: 0,
        glucose: params.cellType === "plant" ? 0 : 40,
      };
    }
    // Choosing from the control overrides whatever was last clicked.
    if (params.focus !== prev.focus) s = { ...s, clicked: "", clicks: 0 };
    if (params.bodyPlan !== prev.bodyPlan) {
      const rng = ctx.rng.fork("cell-replan");
      s = { ...s, stream: buildStream(() => rng.next()) };
    }
    return s;
  },

  step(state, dt, params, ctx, inputs) {
    if (dt <= 0 && inputs.length === 0) return state;
    const rng = ctx.rng;
    const cellType = params.cellType as string;
    const present = organellesFor(cellType);
    const buildMode = params.mode === "build";

    let built = state.built;
    let message = state.message;
    let clicked = state.clicked;
    let clicks = state.clicks;

    for (const input of inputs) {
      if (input.type !== "pointerdown") continue;
      if (buildMode) {
        const want = params.addPart as string;
        const spec = ORGANELLES.find((o) => o.id === want);
        if (!spec) continue;
        const allowed = cellType === "plant" ? spec.plant : spec.animal;
        if (!allowed) {
          message = cellType === "animal" && want === "chloroplast"
            ? "Animal cells have no chloroplasts — animals eat their food instead of making it."
            : cellType === "animal" && want === "wall"
              ? "Animal cells have no cell wall, which is why they are round and floppy."
              : `A ${cellType} cell does not have that part.`;
        } else if (built.includes(want)) {
          message = `${spec.name} is already in there.`;
        } else {
          built = [...built, want];
          message = `${spec.name} added.`;
        }
      } else {
        // Outside Build, a click walks through the parts one at a time.
        const ids = present.map((o) => o.id);
        const at = ids.indexOf(clicked);
        clicked = ids[(at + 1) % ids.length];
        clicks++;
      }
    }

    if (dt <= 0) return { ...state, built, message, clicked, clicks };

    const t = state.t + dt;
    const has = (id: string) => built.includes(id);
    const copiesOf = (id: string) => present.find((o) => o.id === id)?.copies ?? 0;

    /* --- photosynthesis, then respiration ------------------------- */
    const light = params.light as number;
    const chloroplasts = has("chloroplast") ? copiesOf("chloroplast") : 0;
    const made = chloroplasts * PHOTO_RATE * light * dt;

    const mitochondria = has("mitochondria") ? copiesOf("mitochondria") : 0;
    const wanted = mitochondria * RESP_RATE * dt;
    let glucose = state.glucose + made;
    const burned = Math.min(glucose, wanted);
    glucose -= burned;

    const atp = state.atp + burned * ATP_PER_GLUCOSE;
    // Photosynthesis releases O₂; respiration consumes it and releases CO₂.
    const o2 = Math.max(0, state.o2 + made * O2_PER_GLUCOSE - burned * O2_PER_GLUCOSE);
    const co2 = state.co2 + burned * CO2_PER_GLUCOSE;

    /* --- cytoplasmic streaming ------------------------------------ */
    const flow = has("cytoplasm") ? 1 : 0;
    const stream = state.stream.map((p) => ({
      a: p.a + p.v * dt * flow,
      r: p.r,
      v: p.v,
    }));

    /* --- the visible work of each organelle ----------------------- */
    const sparks: Spark[] = [];
    for (const s of state.sparks) {
      const life = s.life - dt;
      if (life <= 0) continue;
      sparks.push({ x: s.x + s.vx * dt, y: s.y + s.vy * dt, vx: s.vx, vy: s.vy, life, kind: s.kind });
    }

    const emit = (spec: OrganelleSpec | undefined, kind: number, chance: number) => {
      if (!spec || sparks.length >= MAX_SPARKS) return;
      if (!rng.chance(Math.min(1, chance * dt))) return;
      const i = Math.floor(rng.next() * Math.max(1, spec.copies));
      const [ox, oy] = copyOffset(spec, i);
      const ang = rng.range(0, Math.PI * 2);
      sparks.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * 0.32, vy: Math.sin(ang) * 0.32,
        life: rng.range(0.9, 1.8), kind,
      });
    };

    if (mitochondria > 0) emit(present.find((o) => o.id === "mitochondria"), 0, 5);
    if (chloroplasts > 0 && light > 0.05) {
      emit(present.find((o) => o.id === "chloroplast"), 1, 4 * light);
      emit(present.find((o) => o.id === "chloroplast"), 2, 2.5 * light);
    }
    if (has("nucleus") && has("ribosome")) emit(present.find((o) => o.id === "nucleus"), 3, 3);

    return {
      t, stream, sparks,
      glucose, glucoseUsed: state.glucoseUsed + burned,
      atp, o2, co2,
      built, message, clicked, clicks,
    };
  },

  readouts(state, params) {
    const org = organismFor(params.cellType as string, params.bodyPlan as string);
    const span = viewSpan(params.zoom as number);
    return [
      {
        key: "viewSpan", label: "Width of the view", quantity: q(span, "length"),
        unit: span >= 1e-3 ? "mm" : span >= 1e-6 ? "nm" : "nm",
        semantic: "distance", graphable: false,
      },
      {
        key: "cellSize", label: "Cell size", quantity: q(org.cellM, "length"), unit: "nm",
        semantic: "distance", graphable: false,
      },
      {
        key: "cellsAcross", label: "Cells across the view",
        quantity: q(span / org.cellM, "count"), semantic: "distance", graphable: false,
        bands: ["6-8", "9-12"],
      },
      {
        key: "cellCount", label: "Cells in the organism", quantity: q(org.cells, "count"),
        semantic: "mass", graphable: false,
      },
      {
        key: "parts", label: "Organelles present",
        quantity: q(state.built.length, "count"), semantic: "mass", graphable: false,
      },
      {
        key: "atp", label: "ATP made", quantity: q(state.atp, "count"),
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "glucose", label: "Glucose in the cell", quantity: q(state.glucose, "count"),
        semantic: "energy-potential", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "o2", label: "Oxygen made", quantity: q(state.o2, "count"),
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "co2", label: "Carbon dioxide made", quantity: q(state.co2, "count"),
        semantic: "gas", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const cellType = params.cellType as string;
    const present = organellesFor(cellType);
    const org = organismFor(cellType, params.bodyPlan as string);
    const core = coreFor(cellType);
    const missing = core.filter((id) => !state.built.includes(id));
    const span = viewSpan(params.zoom as number);
    return {
      cellType,
      organism: org.name,
      unicellular: org.cells === 1,
      cellCount: org.cells,
      cellSizeM: org.cellM,
      viewSpanM: span,
      scaleBarM: niceLength(span * 0.3),
      cellsAcross: span / org.cellM,
      organelleCount: present.length,
      organelles: present.map((o) => o.id).join(","),
      hasWall: state.built.includes("wall"),
      hasChloroplast: state.built.includes("chloroplast"),
      hasVacuole: state.built.includes("vacuole"),
      hasLysosome: state.built.includes("lysosome"),
      hasCentriole: state.built.includes("centriole"),
      hasNucleus: state.built.includes("nucleus"),
      hasMitochondria: state.built.includes("mitochondria"),
      hasRibosome: state.built.includes("ribosome"),
      hasMembrane: state.built.includes("membrane"),
      builtCount: state.built.length,
      extraCount: state.built.filter((id) => !core.includes(id)).length,
      missingCount: missing.length,
      missing: missing.join(","),
      cellWorks: missing.length === 0,
      atp: state.atp,
      glucoseUsed: state.glucoseUsed,
      atpPerGlucose: ATP_PER_GLUCOSE,
      o2: state.o2,
      co2: state.co2,
      focus: effectiveFocus(state, params),
      clicks: state.clicks,
      message: state.message,
    };
  },
};

function effectiveFocus(state: State, params: ParamValues): string {
  if (state.clicked) return state.clicked;
  const wanted = params.focus as string;
  const present = organellesFor(params.cellType as string);
  return present.some((o) => o.id === wanted) ? wanted : "";
}

/** Where copy i of a multi-copy organelle sits, in cell-local coordinates. */
function copyOffset(spec: OrganelleSpec, i: number): [number, number] {
  if (spec.copies <= 1) return [spec.x, spec.y];
  // The golden angle scatters copies without ever lining them up.
  const a = i * 2.39996 + spec.x * 3;
  const rad = Math.hypot(spec.x, spec.y);
  const spread = 0.26 + 0.1 * ((i * 7) % 5);
  return [
    clampUnit(spec.x + Math.cos(a) * spread * (0.6 + rad)),
    clampUnit(spec.y + Math.sin(a) * spread * (0.6 + rad)),
  ];
}

function clampUnit(v: number): number {
  return Math.max(-0.82, Math.min(0.82, v));
}

/* ------------------------------------------------------------------ *
 * View
 *
 * Everything below here draws; nothing below here decides. The cell is built
 * out of the organic kit — a translucent membrane with light scattering
 * through it, a nucleus with real chromatin and a dense nucleolus,
 * mitochondria whose cristae are actually folded — because a student shown
 * coloured blobs learns coloured blobs, and the folding *is* the biology.
 *
 * Every colour on the stage is a theme token. Where a lighter or darker
 * version is wanted it is derived arithmetically from that token, so the whole
 * scene still turns over with the theme instead of pinning a hex in place.
 * ------------------------------------------------------------------ */

const SPARK_KIND = ["ATP", "O₂", "glucose", "mRNA"];

/** Move a theme colour toward white (`target` 255) or black (`target` 0). */
function shift(c: string, t: number, target: number): string {
  let h = c.replace("#", "");
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const k = Math.max(0, Math.min(1, t));
  const part = (i: number) => {
    const raw = parseInt(h.slice(i * 2, i * 2 + 2), 16);
    const v = Number.isFinite(raw) ? raw : 128;
    const n = Math.round(v + (target - v) * k);
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  };
  return `#${part(0)}${part(1)}${part(2)}`;
}

const lighten = (c: string, t: number) => shift(c, t, 255);
const darken = (c: string, t: number) => shift(c, t, 0);

type Theme = RenderContext<State>["theme"];

function organelleColor(id: string, theme: Theme): string {
  switch (id) {
    // A mitochondrion is the cell's furnace, so it takes the hot token —
    // lifted toward salmon, which is how one looks under a stain.
    case "mitochondria": return lighten(theme.sci["hot"], 0.24);
    case "chloroplast": return theme.sci["producer"];
    case "vacuole": return theme.sci["liquid"];
    case "nucleus": return lighten(theme.sci["field"], 0.16);
    case "wall": return theme.sci["solid"];
    case "membrane": return theme.accent;
    case "cytoplasm": return theme.accent;
    case "er": return theme.accent;
    case "golgi": return darken(theme.sci["gas"], 0.12);
    case "ribosome": return theme.sci["velocity"];
    // Lysosomes really are acid bags, so the acid token is the honest one.
    case "lysosome": return theme.sci["acid"];
    case "centriole": return theme.sci["mass"];
    default: return theme.inkSoft;
  }
}

function sparkColor(kind: number, theme: Theme): string {
  if (kind === 0) return theme.sci["energy-kinetic"];
  if (kind === 1) return theme.sci["gas"];
  if (kind === 2) return theme.sci["energy-potential"];
  return theme.accent;
}

/**
 * Render-only geometry.
 *
 * The roster above carries the science — real sizes, real presence. This table
 * carries only how big a part is *drawn* and, for the vacuole, where it is
 * drawn, so composition can be tuned without touching a single fact.
 */
const LOOK: Record<string, {
  scale: number;
  at?: [number, number];
  /** Drawn half-extent as a fraction of the cell radius, for keeping inside. */
  extent?: number;
  /** All copies drawn at the first copy's place — a centrosome is one body. */
  together?: boolean;
}> = {
  nucleus: { scale: 1.2, extent: 1.05 },
  mitochondria: { scale: 1.1, extent: 1.34 },
  chloroplast: { scale: 1.04, extent: 1.24 },
  vacuole: { scale: 1.32, extent: 1.1, at: [0.32, -0.08] },
  er: { scale: 1, extent: 0.95 },
  golgi: { scale: 1.2, extent: 1.15 },
  ribosome: { scale: 0.95, extent: 1.6 },
  lysosome: { scale: 1.05, extent: 1.2 },
  centriole: { scale: 1.15, extent: 1.5, together: true },
};

/** How much of the cell radius the contents are allowed to occupy. */
const INSET = 0.84;

/** Where a part is drawn, including its slow drift through the cytoplasm. */
function placeCopy(
  spec: OrganelleSpec, i: number, time: number,
): [number, number] {
  const look = LOOK[spec.id];
  const [bx, by] = look?.at ?? copyOffset(spec, look?.together ? 0 : i);
  const drift = spec.id === "nucleus" || spec.id === "vacuole" ? 0.008 : 0.022;
  return [
    bx + Math.sin(time * 0.23 + i * 1.7 + bx * 4) * drift,
    by + Math.cos(time * 0.19 + i * 2.3 + by * 4) * drift,
  ];
}

/** The scale bar. Nothing else in the sim makes "small" mean a number. */
function drawScaleBar(rc: RenderContext<State>, span: number, pxPerM: number) {
  const { ctx, theme, width, height } = rc;
  const barM = niceLength(span * 0.3);
  const barPx = Math.max(24, Math.min(width * 0.42, barM * pxPerM));
  const x = 16;
  const y = height - 22;
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + barPx, y);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.moveTo(x + barPx, y - 5);
  ctx.lineTo(x + barPx, y + 5);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + barPx / 2, y - 13, metreLabel(barM), theme, {
    align: "center", size: 11, color: theme.ink,
  });
}

/* ------------------------------------------------------------------ *
 * Callouts — names live in pills off to the side, never on the artwork
 * ------------------------------------------------------------------ */

interface Tag {
  id: string;
  name: string;
  sub?: string;
  /** Anchor point on the artwork, in stage pixels. */
  x: number;
  y: number;
  /** Lower sorts first when a column has to drop one. */
  rank: number;
}

const TAG_RANK: Record<string, number> = {
  membrane: 0, wall: 1, nucleus: 2, mitochondria: 3, chloroplast: 4,
  vacuole: 5, er: 6, golgi: 7, ribosome: 8, lysosome: 9, centriole: 10,
};

/**
 * Lay the names out in two columns clear of the cell and run leader lines back
 * to the thing each one names. Columns are balanced and sorted by height so
 * the leaders never cross each other.
 */
function drawCallouts(
  rc: RenderContext<State>, tags: Tag[], cx: number, cellR: number,
) {
  const { ctx, theme, width, height } = rc;
  if (tags.length === 0) return;
  const withSub = height >= 400;
  const rowH = withSub ? 48 : 34;
  const top = 78;
  const bottom = height - 56;
  const cap = Math.max(2, Math.floor((bottom - top) / rowH) + 1);
  const pill = isDarkTheme(theme) ? darken(theme.accent, 0.5) : theme.accent;

  const left: Tag[] = [];
  const right: Tag[] = [];
  for (const t of [...tags].sort((a, b) => a.rank - b.rank)) {
    const wantLeft = t.x < cx;
    const first = wantLeft ? left : right;
    const other = wantLeft ? right : left;
    if (first.length < cap) first.push(t);
    else if (other.length < cap) other.push(t);
  }

  const column = (list: Tag[], side: "left" | "right") => {
    if (list.length === 0) return;
    list.sort((a, b) => a.y - b.y);
    const step = list.length > 1 ? (bottom - top) / (list.length - 1) : 0;
    const start = list.length > 1 ? top : (top + bottom) / 2;
    const edge = side === "left"
      ? Math.max(12, cx - cellR - 30)
      : Math.min(width - 12, cx + cellR + 30);
    list.forEach((t, i) => {
      callout(ctx, t.x, t.y, edge, start + step * i, t.name, theme, {
        side,
        accent: pill,
        ...(withSub && t.sub ? { sub: t.sub } : {}),
      });
    });
  };
  column(left, "left");
  column(right, "right");
}

/* ------------------------------------------------------------------ *
 * Scenes
 * ------------------------------------------------------------------ */

/** Zoomed out: the organism, with a box round the piece we are about to enter. */
function drawFarView(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, theme, width, height, params, time } = rc;
  const cx = width / 2;
  const cy = height * 0.52;
  const plant = params.cellType === "plant";
  const bodyPx = Math.max(10, org.bodyM * pxPerM);
  const tint = plant ? theme.sci["producer"] : theme.accent;

  if (org.cells === 1) {
    // A single-celled organism: several individuals adrift in one drop, each
    // one a whole membrane-bound cell rather than a dot.
    const r0 = Math.max(14, Math.min(bodyPx * 0.5, Math.min(width, height) * 0.16));
    for (let i = 0; i < 7; i++) {
      const a = i * 2.39996;
      const rr = (0.14 + 0.32 * ((i * 5) % 7) / 7) * Math.min(width, height);
      const px = cx + Math.cos(a + time * 0.05) * rr;
      const py = cy + Math.sin(a + time * 0.04) * rr * 0.62;
      const r = r0 * (0.62 + 0.38 * ((i * 3) % 5) / 4);
      membrane(ctx, px, py, r, tint, { scatter: 0.8, wobble: 0.05, t: time + i });
      nucleus(ctx, px - r * 0.16, py + r * 0.1, r * 0.3, theme.sci["field"], time);
      if (plant) {
        chloroplast(ctx, px + r * 0.34, py - r * 0.24, r * 0.62, r * 0.34,
          0.5 + i, theme.sci["producer"]);
      }
    }
    caption(ctx, cx, 26, `${org.name} — a drop of pond water`, theme, {
      align: "center", size: 15,
    });
    caption(ctx, cx, 46, "every one of these is a whole organism", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
    return;
  }

  ctx.save();
  const body = plant ? theme.sci["producer"] : lighten(theme.accent, 0.24);
  softShadow(ctx, () => {
    ctx.fillStyle = body;
    if (plant) {
      // A leaf: a blade with a midrib.
      const w = Math.min(width * 0.4, bodyPx);
      const h = w * 1.7;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darken(body, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.4);
      ctx.lineTo(cx, cy + h * 0.42);
      for (let i = 1; i <= 5; i++) {
        const yy = cy - h * 0.3 + (i / 6) * h * 0.7;
        ctx.moveTo(cx, yy);
        ctx.lineTo(cx - w * 0.32, yy + h * 0.07);
        ctx.moveTo(cx, yy);
        ctx.lineTo(cx + w * 0.32, yy + h * 0.07);
      }
      ctx.stroke();
    } else {
      // A person: head, body, limbs. Enough to read as "whole organism".
      const h = Math.min(height * 0.62, bodyPx);
      const top = cy - h / 2;
      ctx.beginPath();
      ctx.arc(cx, top + h * 0.09, h * 0.09, 0, Math.PI * 2);
      ctx.fill();
      roundRect(ctx, cx - h * 0.1, top + h * 0.2, h * 0.2, h * 0.36, h * 0.06);
      ctx.fill();
      ctx.strokeStyle = body;
      ctx.lineWidth = Math.max(3, h * 0.05);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.09, top + h * 0.24);
      ctx.lineTo(cx - h * 0.2, top + h * 0.48);
      ctx.moveTo(cx + h * 0.09, top + h * 0.24);
      ctx.lineTo(cx + h * 0.2, top + h * 0.48);
      ctx.moveTo(cx - h * 0.05, top + h * 0.56);
      ctx.lineTo(cx - h * 0.08, top + h * 0.95);
      ctx.moveTo(cx + h * 0.05, top + h * 0.56);
      ctx.lineTo(cx + h * 0.08, top + h * 0.95);
      ctx.stroke();
    }
  }, { blur: 26, dy: 10, alpha: 0.24, color: theme.ink });
  ctx.restore();

  // The window we are zooming into.
  const boxR = Math.max(9, Math.min(width, height) * 0.06);
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(cx - boxR, cy - boxR, boxR * 2, boxR * 2);
  ctx.restore();
  drawCallouts(rc, [{
    id: "zoom", name: "Zoom in here", sub: "one patch of tissue",
    x: cx + boxR, y: cy, rank: 0,
  }], cx, boxR * 1.6);
  caption(ctx, cx, 26, org.name, theme, { align: "center", size: 16 });
}

/** Mid zoom: many cells packed into a tissue, or many separate individuals. */
function drawTissueView(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, theme, width, height, params, time } = rc;
  const plant = params.cellType === "plant";
  const cellPx = Math.max(4, org.cellM * pxPerM);
  const cols = Math.min(60, Math.ceil(width / cellPx) + 1);
  const rows = Math.min(45, Math.ceil(height / cellPx) + 1);
  const tint = plant ? theme.sci["producer"] : theme.accent;
  // A full membrane per cell is expensive; below this size it would not read
  // anyway, so the far field falls back to lit discs.
  const rich = cellPx >= 20 && cols * rows <= 300;

  ctx.save();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Plant cells tile as neat boxes; animal cells offset and round over.
      const ox = plant ? 0 : ((r % 2) * cellPx) / 2;
      const px = c * cellPx + ox + cellPx / 2;
      const py = r * cellPx + cellPx / 2;
      const rr = cellPx * (plant ? 0.46 : 0.44);
      if (rich) {
        if (plant) {
          ctx.save();
          ctx.fillStyle = hexA(theme.sci["solid"], 0.5);
          roundRect(ctx, px - cellPx / 2 + 1, py - cellPx / 2 + 1, cellPx - 2, cellPx - 2,
            cellPx * 0.16);
          ctx.fill();
          ctx.strokeStyle = hexA(darken(theme.sci["solid"], 0.3), 0.8);
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
        membrane(ctx, px, py, rr, tint, {
          scatter: 0.55, wobble: plant ? 0 : 0.045, t: time + r * 0.4 + c * 0.7,
          rimStrength: 0.6,
        });
        nucleus(ctx, px - rr * 0.14, py + rr * 0.08, rr * 0.3, theme.sci["field"], time);
        if (plant) {
          for (let k = 0; k < 3; k++) {
            chloroplast(ctx, px + Math.cos(k * 2.1 + 1) * rr * 0.52,
              py + Math.sin(k * 2.1 + 1) * rr * 0.52,
              rr * 0.5, rr * 0.28, 0.4 + k, theme.sci["producer"]);
          }
        }
      } else {
        ctx.globalAlpha = org.cells === 1 ? 0.34 : 0.8;
        const g = ctx.createRadialGradient(px - rr * 0.4, py - rr * 0.4, rr * 0.05, px, py, rr);
        g.addColorStop(0, hexA(lighten(tint, 0.55), 0.75));
        g.addColorStop(1, hexA(darken(tint, 0.1), 0.55));
        ctx.fillStyle = g;
        ctx.beginPath();
        if (plant) {
          roundRect(ctx, px - cellPx / 2 + 1, py - cellPx / 2 + 1, cellPx - 2, cellPx - 2,
            Math.min(4, cellPx * 0.18));
        } else {
          ctx.arc(px, py, rr, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = hexA(plant ? theme.sci["solid"] : darken(tint, 0.25), 0.55);
        ctx.lineWidth = 1;
        ctx.stroke();
        if (cellPx > 12) {
          organelleDot(ctx, px - rr * 0.16, py + rr * 0.1, Math.max(1.2, rr * 0.28),
            theme.sci["field"]);
        }
      }
    }
  }
  ctx.restore();

  const text = org.cells === 1
    ? "Not a tissue — just many separate one-celled organisms"
    : plant ? "Leaf tissue: cells stacked in a wall-to-wall grid"
      : "Tissue: many cells of the same kind, working together";
  caption(ctx, width / 2, 22, text, rc.theme, { align: "center", size: 13 });
}

/* ------------------------------------------------------------------ *
 * The main event: one cell, filling the stage
 * ------------------------------------------------------------------ */

function drawCell(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, state, params, theme, width, height, overlays, band, time } = rc;
  const plant = params.cellType === "plant";
  const focus = effectiveFocus(state, params);
  const has = (id: string) => state.built.includes(id);
  const light = params.light as number;
  const wall = plant && has("wall");

  const cx = width / 2;
  const cy = height * 0.5;
  // Honest scale, but the cell is never allowed to be a small dot in a big
  // empty stage: it fills the height and leaves gutters for the names.
  const wallT = wall ? Math.max(7, Math.min(width, height) * 0.028) : 0;
  const cellR = Math.min(
    Math.max(40, (org.cellM * pxPerM) / 2),
    Math.min(width * 0.345, height * 0.465) - wallT,
  );
  const memTint = organelleColor("membrane", theme);
  const toX = (u: number) => cx + u * cellR * INSET;
  const toY = (u: number) => cy + u * cellR * INSET;

  /*
   * Composition. The roster scatters copies by a golden angle, which is honest
   * but lets a mitochondrion land square on the nucleus. So the two big bodies
   * carry a keep-out disc and everything else — including the molecules the
   * organelles emit, so a spark never parts company with its source — is
   * displaced smoothly around them by the same field.
   */
  const keepOuts: { x: number; y: number; r: number }[] = [];
  for (const id of ["nucleus", "vacuole"]) {
    const s = organellesFor(params.cellType as string).find((o) => o.id === id);
    if (!s || !has(id)) continue;
    const look = LOOK[id];
    const [bx, by] = look?.at ?? [s.x, s.y];
    keepOuts.push({
      x: bx, y: by,
      r: (s.r * (look?.scale ?? 1) * (look?.extent ?? 1)) / INSET + 0.1,
    });
  }
  const nudge = (ux: number, uy: number): [number, number] => {
    let x = ux;
    let y = uy;
    for (const k of keepOuts) {
      const dx = x - k.x;
      const dy = y - k.y;
      const d = Math.hypot(dx, dy);
      if (d >= k.r) continue;
      const a = d < 1e-4 ? 0.9 : Math.atan2(dy, dx);
      // Push out past the ring in proportion to how deep it sat, so the ones
      // that were buried end up spread rather than stacked on one circle.
      const out = k.r * (1 + 0.32 * (1 - d / k.r));
      x = k.x + Math.cos(a) * out;
      y = k.y + Math.sin(a) * out;
    }
    return [x, y];
  };
  /** Keep a body's whole drawn width inside the membrane. */
  const contain = (ux: number, uy: number, ext: number): [number, number] => {
    const rad = Math.hypot(ux, uy);
    const lim = Math.max(0.12, (0.93 - ext) / INSET);
    if (rad <= lim || rad < 1e-4) return [ux, uy];
    return [(ux / rad) * lim, (uy / rad) * lim];
  };

  /* --- light falling on the cell --------------------------------- */
  if (plant && light > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 7; i++) {
      const x0 = -60 + (i / 6) * (width + 120) + Math.sin(time * 0.12 + i) * 6;
      const w = 14 + (i % 3) * 7;
      const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, hexA(theme.sci["light"], 0));
      g.addColorStop(0.5, hexA(theme.sci["light"], 0.1 + 0.26 * light));
      g.addColorStop(1, hexA(theme.sci["light"], 0));
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x0, -20);
      ctx.transform(1, 0, 0.42, 1, 0, 0);
      ctx.fillRect(0, 0, w, height + 40);
      ctx.restore();
    }
    ctx.restore();
  }

  /* --- an empty stage in Build mode still has to say what to do --- */
  if (!has("membrane") && !has("cytoplasm") && !wall) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.4);
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    caption(ctx, cx, cy, "Click here to place the part you chose", theme, {
      align: "center", size: 13, color: theme.inkSoft,
    });
    return;
  }

  /* --- the cell sits on something, so it casts something ---------- */
  const outer = cellR + wallT;
  ctx.save();
  const ao = ctx.createRadialGradient(
    cx, cy + outer * 0.12, outer * 0.55, cx, cy + outer * 0.12, outer * 1.4,
  );
  ao.addColorStop(0, hexA(theme.ink, 0.18));
  ao.addColorStop(0.6, hexA(theme.ink, 0.08));
  ao.addColorStop(1, hexA(theme.ink, 0));
  ctx.fillStyle = ao;
  ctx.beginPath();
  ctx.arc(cx, cy + outer * 0.12, outer * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* --- membrane and cytoplasm ------------------------------------ */
  if (has("membrane")) {
    membrane(ctx, cx, cy, cellR, memTint, {
      scatter: 1, wobble: plant ? 0.012 : 0.028, t: time, rimStrength: 1,
    });
  } else if (has("cytoplasm")) {
    // Cytoplasm with nothing to hold it in: a soft, edgeless pool.
    ctx.save();
    const g = ctx.createRadialGradient(
      cx - cellR * 0.3, cy - cellR * 0.35, cellR * 0.05, cx, cy, cellR,
    );
    g.addColorStop(0, hexA(lighten(memTint, 0.6), 0.28));
    g.addColorStop(1, hexA(memTint, 0.06));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* --- the plant cell's wall, drawn as real thickness ------------- */
  if (wall) {
    const wallTint = organelleColor("wall", theme);
    ctx.save();
    // Ring: a rounded box outside, the membrane's circle punched out inside.
    roundRect(ctx, cx - outer, cy - outer, outer * 2, outer * 2, outer * 0.3);
    ctx.moveTo(cx + cellR, cy);
    ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
    ctx.clip("evenodd");

    const g = ctx.createLinearGradient(cx - outer, cy - outer, cx + outer, cy + outer);
    g.addColorStop(0, lighten(wallTint, 0.5));
    g.addColorStop(0.45, lighten(wallTint, 0.1));
    g.addColorStop(1, darken(wallTint, 0.34));
    ctx.fillStyle = g;
    ctx.fillRect(cx - outer - 2, cy - outer - 2, outer * 2 + 4, outer * 2 + 4);

    // Cellulose: two crossing families of fibres, which is exactly why the
    // wall is stiff in every direction at once.
    ctx.lineCap = "round";
    for (const dir of [1, -1]) {
      ctx.strokeStyle = hexA(dir > 0 ? lighten(wallTint, 0.7) : darken(wallTint, 0.5), 0.28);
      ctx.lineWidth = Math.max(1, wallT * 0.16);
      ctx.beginPath();
      const stepPx = Math.max(5, wallT * 0.52);
      for (let s = -outer * 2; s < outer * 2; s += stepPx) {
        ctx.moveTo(cx + s, cy - outer - 4);
        ctx.lineTo(cx + s + dir * outer * 2.4, cy + outer + 4);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Edges: a dark outer line and a lit inner one, so it reads as a slab.
    ctx.save();
    ctx.strokeStyle = hexA(darken(wallTint, 0.5), 0.85);
    ctx.lineWidth = 1.6;
    roundRect(ctx, cx - outer, cy - outer, outer * 2, outer * 2, outer * 0.3);
    ctx.stroke();
    ctx.restore();
    rimLight(ctx, (c) => {
      roundRect(c, cx - outer + 1, cy - outer + 1, outer * 2 - 2, outer * 2 - 2, outer * 0.29);
    }, lighten(wallTint, 0.85), {
      width: 2.2, alpha: 0.7,
      bounds: { x: cx - outer, y: cy - outer, w: outer * 2, h: outer * 2 },
    });
  }

  /* --- everything from here on lives inside the membrane ---------- */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, cellR * 0.995, 0, Math.PI * 2);
  ctx.clip();

  if (has("membrane") || has("cytoplasm")) {
    // A veil over the interior: the far wall of a fluid-filled sac is darker
    // than the near one, and that difference is most of what says "volume".
    ctx.save();
    const veil = ctx.createRadialGradient(
      cx - cellR * 0.3, cy - cellR * 0.34, cellR * 0.05, cx, cy, cellR,
    );
    veil.addColorStop(0, hexA(lighten(memTint, 0.6), 0.16));
    veil.addColorStop(0.68, hexA(memTint, 0.1));
    veil.addColorStop(1, hexA(darken(memTint, 0.25), 0.26));
    ctx.fillStyle = veil;
    ctx.fillRect(cx - cellR, cy - cellR, cellR * 2, cellR * 2);
    ctx.restore();
  }

  if (has("cytoplasm")) {
    // The jelly itself: a faint granular wash plus visible streaming.
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const a = i * 2.39996;
      const rr = Math.sqrt((i + 0.5) / 70) * cellR * 0.97;
      ctx.globalAlpha = 0.05 + 0.05 * ((i * 7) % 5) / 4;
      ctx.fillStyle = lighten(memTint, 0.75);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cellR * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (overlays.activity !== false) {
      ctx.save();
      ctx.lineCap = "round";
      for (const p of state.stream) {
        const rr = p.r * cellR * 0.92;
        ctx.globalAlpha = 0.1 + 0.16 * Math.abs(Math.sin(p.a * 2));
        ctx.strokeStyle = lighten(memTint, 0.8);
        ctx.lineWidth = Math.max(1.2, cellR * 0.014);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, p.a - 0.16, p.a);
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        organelleDot(ctx, cx + Math.cos(p.a) * rr, cy + Math.sin(p.a) * rr,
          Math.max(1.2, cellR * 0.014), lighten(memTint, 0.6));
      }
      ctx.restore();
    }
  }

  /* --- organelles ------------------------------------------------ */
  const drawn = organellesFor(params.cellType as string)
    .filter((o) => has(o.id) && o.id !== "membrane" && o.id !== "cytoplasm" && o.id !== "wall");
  // Big things first so the small ones stay visible on top of them.
  drawn.sort((a, b) => b.r - a.r);

  const tags: Tag[] = [];
  for (const spec of drawn) {
    const color = organelleColor(spec.id, theme);
    const lit = focus === spec.id;
    const look = LOOK[spec.id];
    const scale = look?.scale ?? 1;
    const fixed = spec.id === "nucleus" || spec.id === "vacuole";
    const ext = spec.r * scale * (look?.extent ?? 1);
    for (let i = 0; i < spec.copies; i++) {
      const [bx, by] = placeCopy(spec, i, time);
      const [nx, ny] = fixed ? [bx, by] : nudge(bx, by);
      const [ox, oy] = fixed ? [nx, ny] : contain(nx, ny, ext);
      const px = toX(ox);
      const py = toY(oy);
      drawOrganelle(rc, spec, px, py, spec.r * cellR * scale, color, lit, i);
      if (i === 0) {
        tags.push({
          id: spec.id, name: spec.name, sub: `about ${metreLabel(spec.sizeM)} across`,
          x: px, y: py - spec.r * cellR * scale * 0.5,
          rank: TAG_RANK[spec.id] ?? 20,
        });
      }
    }
  }

  /* --- transport vesicles drifting through the jelly -------------- */
  if (has("cytoplasm")) {
    for (let i = 0; i < 20; i++) {
      const a = i * 2.39996 + time * (0.05 + (i % 4) * 0.014);
      const rr = (0.22 + 0.66 * ((i * 5) % 9) / 9) * cellR * INSET;
      const r = Math.max(1.6, cellR * (0.012 + 0.012 * ((i * 3) % 4) / 3));
      organelleDot(ctx,
        cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.94,
        r, i % 2 ? theme.sci["velocity"] : theme.sci["field"]);
    }
  }

  /* --- molecules the organelles have just made -------------------- */
  if (overlays.activity !== false) {
    for (const s of state.sparks) {
      const [sx, sy] = nudge(s.x, s.y);
      const px = toX(sx);
      const py = toY(sy);
      const a = Math.min(1, s.life);
      const col = sparkColor(s.kind, theme);
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.6 * a;
      glow(ctx, px, py, Math.max(6, cellR * 0.07), col, 0.32);
      organelleDot(ctx, px, py, Math.max(1.8, cellR * 0.022), col);
      ctx.restore();
      if (cellR > 130 && band !== "3-5") {
        caption(ctx, px + 7, py - 7, SPARK_KIND[s.kind], theme, { size: 9, color: col });
      }
    }
  }
  ctx.restore();

  /* --- re-assert the membrane over its contents ------------------- */
  if (has("membrane")) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cellR * 0.93, 0, Math.PI * 2);
    ctx.strokeStyle = hexA(memTint, 0.16);
    ctx.lineWidth = cellR * 0.14;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
    ctx.strokeStyle = hexA(darken(memTint, 0.25), focus === "membrane" ? 0.95 : 0.7);
    ctx.lineWidth = Math.max(1.6, cellR * 0.022);
    ctx.stroke();
    ctx.restore();
    rimLight(ctx, (c) => {
      c.beginPath();
      c.arc(cx, cy, cellR * 0.985, 0, Math.PI * 2);
    }, lighten(memTint, 0.92), {
      width: Math.max(1.4, cellR * 0.022), alpha: 0.75,
      bounds: { x: cx - cellR, y: cy - cellR, w: cellR * 2, h: cellR * 2 },
    });
    if (focus === "membrane") glow(ctx, cx, cy, cellR * 1.3, theme.sci["light"], 0.16);
  }

  /* --- names, in pills, out of the way ---------------------------- */
  if (overlays.labels !== false && band !== "3-5") {
    if (has("membrane")) {
      tags.push({
        id: "membrane", name: "Cell membrane",
        sub: `about ${metreLabel(7e-9)} thick`,
        x: cx - cellR * 0.71, y: cy - cellR * 0.71, rank: 0,
      });
    }
    if (wall) {
      tags.push({
        id: "wall", name: "Cell wall", sub: "cellulose fibres",
        x: cx + outer * 0.72, y: cy + outer * 0.72, rank: 1,
      });
    }
    drawCallouts(rc, tags, cx, outer);
  }

  /* --- live numbers on the stage ---------------------------------- */
  if (band !== "3-5") {
    badge(ctx, width - 12, 22, `${Math.round(state.atp)} ATP`, theme, {
      align: "right", color: theme.sci["energy-kinetic"], sub: "made so far",
    });
    if (plant) {
      badge(ctx, width - 12, 62, `${Math.round(state.o2)} O₂`, theme, {
        align: "right", color: theme.sci["gas"], sub: "released",
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * One organelle, drawn as the thing it is
 * ------------------------------------------------------------------ */

/**
 * Chromatin and nucleolus, laid over the kit's nucleus.
 *
 * The kit gives the envelope, the pores and the lit body. Over that goes a
 * veil that settles its first-pass threads into mottled texture, then long
 * coils — DNA is wound thread, not shards — and a nucleolus dense enough that
 * a student can point at it and say what it is.
 */
function chromatin(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tint: string, time: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
  ctx.clip();

  const veil = ctx.createRadialGradient(x - r * 0.34, y - r * 0.36, r * 0.06, x, y, r);
  veil.addColorStop(0, hexA(lighten(tint, 0.42), 0.55));
  veil.addColorStop(0.62, hexA(tint, 0.5));
  veil.addColorStop(1, hexA(darken(tint, 0.34), 0.6));
  ctx.fillStyle = veil;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 10; i++) {
    const seed = i * 2.399 + 0.4;
    const dark = i % 2 === 0;
    ctx.strokeStyle = hexA(dark ? darken(tint, 0.5) : lighten(tint, 0.55), dark ? 0.52 : 0.24);
    ctx.lineWidth = Math.max(0.9, r * (dark ? 0.05 : 0.028));
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      const a = seed + u * 3.1 + Math.sin(time * 0.16 + i) * 0.05;
      const rad = r * (0.2 + 0.55 * (0.5 + 0.5 * Math.sin(seed * 3.1 + u * 16.5)));
      const qx = x + Math.cos(a) * rad * 0.88;
      const qy = y + Math.sin(a) * rad * 0.82;
      if (k === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.stroke();
  }

  // The nucleolus, restated over the veil so it stays the densest thing here.
  const nx = x + r * 0.17;
  const ny = y + r * 0.12;
  const nr = r * 0.31;
  const ng = ctx.createRadialGradient(nx - nr * 0.38, ny - nr * 0.42, nr * 0.04, nx, ny, nr);
  ng.addColorStop(0, lighten(tint, 0.2));
  ng.addColorStop(0.45, darken(tint, 0.36));
  ng.addColorStop(1, darken(tint, 0.62));
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(nx, ny, nr, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(nx - nr * 0.34, ny - nr * 0.4, nr * 0.32, nr * 0.16, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = hexA(lighten(tint, 0.92), 0.3);
  ctx.fill();

  // One specular for the whole sphere, so it still reads as a lit ball.
  ctx.beginPath();
  ctx.ellipse(x - r * 0.34, y - r * 0.37, r * 0.24, r * 0.13, -0.66, 0, Math.PI * 2);
  ctx.fillStyle = hexA(lighten(tint, 0.95), 0.3);
  ctx.fill();
  ctx.restore();
}

/** A vacuole: a water-filled sac with a visible tonoplast and a slow swirl. */
function vacuoleSac(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tint: string, time: number,
) {
  ctx.save();
  const g = ctx.createRadialGradient(x - r * 0.34, y - r * 0.38, r * 0.05, x, y, r);
  g.addColorStop(0, hexA(lighten(tint, 0.8), 0.5));
  g.addColorStop(0.62, hexA(lighten(tint, 0.25), 0.3));
  g.addColorStop(1, hexA(tint, 0.46));
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.06, r * 0.95, 0.16, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // Tonoplast: one real membrane, so it gets two leaflets like the other one.
  ctx.lineWidth = Math.max(1.6, r * 0.035);
  ctx.strokeStyle = hexA(darken(tint, 0.15), 0.8);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.7, r * 0.014);
  ctx.strokeStyle = hexA(lighten(tint, 0.95), 0.55);
  ctx.stroke();

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = hexA(lighten(tint, 0.85), 0.16);
  ctx.lineWidth = Math.max(1, r * 0.022);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y, r * (0.34 + i * 0.22), 0.5 + time * 0.1 + i * 1.4, 2.4 + time * 0.1 + i * 1.4);
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y - r * 0.44, r * 0.26, r * 0.13, -0.7, 0, Math.PI * 2);
  ctx.fillStyle = hexA(lighten(tint, 0.95), 0.55);
  ctx.fill();
  ctx.restore();
}

/**
 * A centriole. The pair sits at right angles — that is what a centrosome is —
 * so one is drawn as a barrel from the side and one down its open end, where
 * the nine triplets of tubes are what a student can actually count.
 */
function centrioleBarrel(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tint: string,
  angle: number, endOn: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (endOn) {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.34, r * 0.05, 0, 0, r);
    g.addColorStop(0, lighten(tint, 0.5));
    g.addColorStop(1, darken(tint, 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(darken(tint, 0.45), 0.9);
    ctx.lineWidth = Math.max(0.8, r * 0.08);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      organelleDot(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62,
        Math.max(1, r * 0.15), lighten(tint, 0.3));
    }
  } else {
    const g = ctx.createLinearGradient(0, -r * 0.7, 0, r * 0.7);
    g.addColorStop(0, lighten(tint, 0.5));
    g.addColorStop(0.5, tint);
    g.addColorStop(1, darken(tint, 0.34));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(darken(tint, 0.45), 0.85);
    ctx.lineWidth = Math.max(0.8, r * 0.07);
    ctx.stroke();
    ctx.strokeStyle = hexA(darken(tint, 0.35), 0.55);
    ctx.lineWidth = Math.max(0.8, r * 0.09);
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const px = -r * 0.6 + (i / 3) * r * 1.2;
      ctx.beginPath();
      ctx.moveTo(px, -r * 0.5);
      ctx.lineTo(px, r * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.24, r * 0.3, r * 0.13, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = hexA(lighten(tint, 0.95), 0.4);
    ctx.fill();
  }
  ctx.restore();
}

function drawOrganelle(
  rc: RenderContext<State>, spec: OrganelleSpec,
  px: number, py: number, r: number, color: string, lit: boolean, copy: number,
) {
  const { ctx, theme, params, time } = rc;
  if (r <= 0) return;

  ctx.save();
  if (lit) glow(ctx, px, py, r * 2.6, theme.sci["light"], 0.34);

  switch (spec.id) {
    case "mitochondria": {
      // The folds are the point: they are the surface that makes the ATP.
      const beat = lerp(0.94, 1.07, pulse(time + copy * 0.41, 0.34));
      const w = r * 2.5 * beat;
      const h = r * 1.24;
      mitochondrion(ctx, px, py, w, h, 0.4 + copy * 0.87 + Math.sin(time * 0.16 + copy) * 0.06,
        color);
      break;
    }
    case "chloroplast": {
      const lightP = params.light as number;
      const w = r * 2.3;
      const h = r * 1.32;
      if (lightP > 0.05) glow(ctx, px, py, w * 0.95, theme.sci["light"], 0.14 + 0.3 * lightP);
      chloroplast(ctx, px, py, w, h, -0.3 + copy * 0.79 + Math.sin(time * 0.13 + copy) * 0.05,
        color);
      break;
    }
    case "nucleus": {
      nucleus(ctx, px, py, r, color, time);
      chromatin(ctx, px, py, r, color, time);
      break;
    }
    case "vacuole": {
      vacuoleSac(ctx, px, py, r, color, time);
      break;
    }
    case "er": {
      // Rough ER hugging the nucleus, smooth ER reaching away from it.
      const a = Math.atan2(py - rc.height * 0.5, px - rc.width * 0.5) + Math.PI / 2;
      reticulum(ctx, px, py, r * 1.55, r * 1, color, {
        studded: true, sheets: 7, angle: a + Math.sin(time * 0.12) * 0.03,
      });
      reticulum(ctx, px + Math.cos(a) * r * 1.15, py + Math.sin(a) * r * 1.15,
        r * 1.05, r * 0.62, color, {
          studded: false, sheets: 4, angle: a - 0.55,
        });
      break;
    }
    case "golgi": {
      golgi(ctx, px, py, r * 1.75, r * 2.05, color,
        -0.36 + Math.sin(time * 0.11) * 0.04);
      break;
    }
    case "ribosome": {
      // Two subunits clamped together — that is the whole machine.
      organelleDot(ctx, px, py + r * 0.14, r * 0.82, color);
      organelleDot(ctx, px + r * 0.02, py - r * 0.3, r * 0.58, lighten(color, 0.12));
      break;
    }
    case "lysosome": {
      const beat = lerp(0.94, 1.06, pulse(time + copy * 0.6, 0.28));
      organelleDot(ctx, px, py, r * beat, color);
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 4; i++) {
        const a = i * 1.9 + time * 0.35;
        organelleDot(ctx, px + Math.cos(a) * r * 0.4, py + Math.sin(a) * r * 0.4,
          Math.max(0.8, r * 0.17), darken(color, 0.35));
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "centriole": {
      // Two of them, offset just enough to read as a pair.
      centrioleBarrel(ctx, px + (copy ? r * 1.05 : -r * 0.5), py + (copy ? -r * 0.7 : r * 0.4),
        r, color, Math.sin(time * 0.1) * 0.05 - 0.3, copy === 1);
      break;
    }
    default: {
      organelleDot(ctx, px, py, Math.max(2, r), color);
    }
  }

  if (lit) {
    const ring = r * (LOOK[spec.id]?.extent ?? 1) * 1.07;
    ctx.strokeStyle = hexA(theme.sci["light"], 0.24 + 0.2 * pulse(time, 0.4));
    ctx.lineWidth = Math.max(1.2, r * 0.028);
    ctx.beginPath();
    ctx.arc(px, py, ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Deep zoom: one organelle filling the frame
 * ------------------------------------------------------------------ */

/** The feature worth pointing at once a part fills the frame. */
const DETAIL: Record<string, { label: string; dx: number; dy: number }> = {
  nucleus: { label: "Nucleolus", dx: 0.16, dy: 0.1 },
  mitochondria: { label: "Cristae", dx: 0.1, dy: -0.2 },
  chloroplast: { label: "Granum", dx: -0.2, dy: 0 },
  er: { label: "Ribosomes", dx: 0, dy: -0.25 },
  golgi: { label: "Cisternae", dx: 0, dy: -0.3 },
  vacuole: { label: "Tonoplast", dx: -0.62, dy: -0.5 },
  lysosome: { label: "Enzymes", dx: 0.3, dy: 0.3 },
  ribosome: { label: "Two subunits", dx: 0.1, dy: -0.5 },
  centriole: { label: "Tubes", dx: 0.4, dy: -0.6 },
  membrane: { label: "Bilayer", dx: 0, dy: -0.98 },
  wall: { label: "Cellulose", dx: 0, dy: -0.9 },
  cytoplasm: { label: "Streaming", dx: 0.5, dy: 0.3 },
};

function drawOrganelleView(rc: RenderContext<State>, spec: OrganelleSpec | undefined) {
  const { ctx, theme, width, height, band, time } = rc;
  if (!spec) {
    caption(ctx, width / 2, height / 2, "Pick a part to look inside", theme, {
      align: "center", size: 15,
    });
    return;
  }
  const cx = width * 0.33;
  const cy = height * 0.52;
  const r = Math.min(width * 0.24, height * 0.34);
  const color = organelleColor(spec.id, theme);

  // Ambient occlusion so the subject sits in the frame rather than on it.
  ctx.save();
  const ao = ctx.createRadialGradient(cx, cy + r * 0.2, r * 0.6, cx, cy + r * 0.2, r * 2.1);
  ao.addColorStop(0, hexA(theme.ink, 0.16));
  ao.addColorStop(1, hexA(theme.ink, 0));
  ctx.fillStyle = ao;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, cx, cy, r * 2.2, color, 0.18);

  switch (spec.id) {
    case "membrane": {
      membrane(ctx, cx, cy, r * 1.25, color, { scatter: 1, wobble: 0.03, t: time });
      break;
    }
    case "cytoplasm": {
      membrane(ctx, cx, cy, r * 1.25, color, { scatter: 0.9, wobble: 0.05, t: time });
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.24, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39996 + time * 0.1;
        const rr = Math.sqrt((i + 0.5) / 26) * r * 1.15;
        organelleDot(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr,
          Math.max(2, r * (0.03 + 0.02 * ((i * 3) % 4) / 3)),
          i % 2 ? theme.sci["velocity"] : theme.sci["field"]);
      }
      ctx.restore();
      break;
    }
    case "wall": {
      // A slab of wall seen edge-on, with its crossing cellulose fibres.
      const w = r * 2.3;
      const h = r * 1.1;
      ctx.save();
      roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h * 0.22);
      ctx.clip();
      const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
      g.addColorStop(0, lighten(color, 0.5));
      g.addColorStop(0.45, lighten(color, 0.08));
      g.addColorStop(1, darken(color, 0.36));
      ctx.fillStyle = g;
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.lineCap = "round";
      for (const dir of [1, -1]) {
        ctx.strokeStyle = hexA(dir > 0 ? lighten(color, 0.75) : darken(color, 0.5), 0.32);
        ctx.lineWidth = Math.max(2, h * 0.06);
        ctx.beginPath();
        for (let s = -w; s < w; s += h * 0.2) {
          ctx.moveTo(cx + s, cy - h);
          ctx.lineTo(cx + s + dir * h * 2, cy + h);
        }
        ctx.stroke();
      }
      ctx.restore();
      rimLight(ctx, (c) => {
        roundRect(c, cx - w / 2, cy - h / 2, w, h, h * 0.22);
      }, lighten(color, 0.85), {
        width: 2.4, alpha: 0.8,
        bounds: { x: cx - w / 2, y: cy - h / 2, w, h },
      });
      break;
    }
    default:
      drawOrganelle(rc, spec, cx, cy, r, color, false, 0);
  }

  // One feature named on the artwork's own terms, in a pill clear of it.
  const d = DETAIL[spec.id];
  if (d && band !== "3-5") {
    callout(ctx, cx + d.dx * r, cy + d.dy * r, Math.max(12, cx - r * 1.45), cy - r * 1.05,
      d.label, theme, {
        side: "left",
        accent: isDarkTheme(theme) ? darken(theme.accent, 0.5) : theme.accent,
      });
  }

  const tx = Math.min(width - 14, cx + r * 1.5);
  caption(ctx, tx, cy - 52, spec.name, theme, { size: 18 });
  caption(ctx, tx, cy - 28, `about ${metreLabel(spec.sizeM)} across`, theme, {
    size: 11, color: theme.inkSoft,
  });
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, cy - 16);
  ctx.lineTo(Math.min(width - 14, tx + 46), cy - 16);
  ctx.stroke();
  ctx.restore();
  wrapText(rc, spec.job, tx, cy + 4, width - tx - 12, 13, theme.ink);
  if (band === "6-8" || band === "9-12") {
    wrapText(rc, spec.structure, tx, cy + 52, width - tx - 12, 11, theme.inkSoft);
  }
}

function wrapText(
  rc: RenderContext<State>, text: string, x: number, y: number,
  maxW: number, size: number, color: string,
) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.font = `600 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  const words = text.split(" ");
  let line = "";
  let ly = y;
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  ctx.restore();
  for (const l of lines.slice(0, 6)) {
    caption(ctx, x, ly, l, theme, { size, color });
    ly += size + 4;
  }
}

/** Build mode's checklist: the feedback that makes the challenge teach. */
function drawChecklist(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const core = coreFor(params.cellType as string);
  const missing = core.filter((id) => !state.built.includes(id));
  const w = Math.min(216, width * 0.34);
  const h = 34 + core.length * 17 + (state.message ? 30 : 0);
  const x = 10;
  const y = Math.max(8, height - h - 40);

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  label(ctx, missing.length === 0 ? "This cell works" : "A working cell needs", x + 10, y + 16, theme, {
    size: 11, plate: false,
    color: missing.length === 0 ? theme.sci["producer"] : theme.ink,
  });
  let ly = y + 34;
  for (const id of core) {
    const spec = ORGANELLES.find((o) => o.id === id);
    const done = state.built.includes(id);
    ctx.save();
    ctx.fillStyle = done ? theme.sci["producer"] : theme.inkSoft;
    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x + 16, ly - 3, 4, 0, Math.PI * 2);
    if (done) ctx.fill();
    else ctx.stroke();
    ctx.restore();
    label(ctx, spec?.name ?? id, x + 26, ly - 3, theme, {
      size: 10, plate: false, color: done ? theme.ink : theme.inkSoft,
    });
    ly += 17;
  }
  if (state.message) {
    wrapText(rc, state.message, x + 10, ly + 6, w - 20, 10, theme.accent);
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band, time } = rc;
  const org = organismFor(params.cellType as string, params.bodyPlan as string);
  const span = viewSpan(params.zoom as number);
  const pxPerM = Math.min(width, height) / span;

  // Depth, not a flat fill: a lilac wash that falls away at the corners, with
  // two slowly parallaxing layers of out-of-focus motes in front of it.
  depthWash(ctx, width, height, theme);
  ctx.save();
  ctx.translate(Math.sin(time * 0.05) * 12, Math.cos(time * 0.04) * 9);
  bokeh(ctx, width, height, theme.accent, 15, 11);
  ctx.restore();
  ctx.save();
  ctx.translate(Math.sin(time * 0.08 + 1.3) * -18, Math.cos(time * 0.06) * 7);
  bokeh(ctx, width, height, theme.sci["field"], 9, 29);
  ctx.restore();

  // Which scene the zoom has arrived at, decided by how the view compares
  // with a real cell rather than by an arbitrary slider position.
  const ratio = span / org.cellM;
  if (ratio > 300) {
    drawFarView(rc, org, pxPerM);
  } else if (ratio > 3) {
    drawTissueView(rc, org, pxPerM);
  } else if (ratio > 0.34) {
    drawCell(rc, org, pxPerM);
  } else {
    const focus = effectiveFocus(state, params);
    drawOrganelleView(rc, ORGANELLES.find((o) => o.id === focus));
  }

  if (overlays.scaleBar !== false) drawScaleBar(rc, span, pxPerM);

  if (band !== "3-5") {
    caption(ctx, 14, 20, org.cells === 1 ? "Unicellular" : "Multicellular", theme, { size: 13 });
    caption(ctx, 14, 38, org.cells === 1
      ? "1 cell — the organism"
      : `${org.cells >= 1e9 ? `${(org.cells / 1e12).toFixed(1)} trillion` : `${(org.cells / 1e6).toFixed(0)} million`} cells`,
    theme, { size: 11, color: theme.inkSoft });
  }
  if (params.mode === "build" && overlays.checklist !== false) drawChecklist(rc);

  vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const PART_OPTIONS = ORGANELLES.map((o) => ({ value: o.id, label: o.name }));

export const cellSim: SimManifest<State> = {
  id: "bio.cell",
  title: "Inside a Cell",
  tagline: "Zoom from a whole body down to one organelle, then take the cell apart and rebuild it.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS1-1", "MS-LS1-2", "HS-LS1-2"] },
  learningGoals: [
    "Name what each organelle does and show how its structure fits that job.",
    "Say which parts a plant cell has that an animal cell does not, and why.",
    "Use a scale bar to say how big a cell and an organelle really are.",
    "Explain how a one-celled organism does everything a body does.",
  ],
  misconceptions: [
    "Plant and animal cells are completely different things",
    "Cells are flat and still, like the diagram in the book",
    "Only plant cells have mitochondria, because plants make the food",
    "A one-celled organism is a simple, unfinished animal",
  ],
  interactionHint: "Click the cell to step through its parts. In Build mode, clicking places the part you chose.",
  tickRate: 60,
  params: {
    cellType: {
      type: "option", label: "Cell type",
      options: [{ value: "animal", label: "Animal cell" }, { value: "plant", label: "Plant cell" }],
      default: "animal",
      help: "Switch and watch which parts appear and disappear.",
    },
    bodyPlan: {
      type: "option", label: "Organism",
      options: [
        { value: "multicellular", label: "Made of many cells" },
        { value: "unicellular", label: "One cell only" },
      ],
      default: "multicellular",
      bands: ["3-5", "6-8", "9-12"],
      help: "A one-celled organism has to do everything a whole body does.",
    },
    zoom: {
      type: "number", label: "Zoom", kind: "count",
      min: 0, max: 7, step: 0.05, default: 5,
      hideValueBands: ["3-5"],
      marks: [
        { value: 0, label: "Body" },
        { value: 3, label: "Tissue" },
        { value: 5, label: "One cell" },
        { value: 6.5, label: "Organelle" },
      ],
      help: "Each step in is ten times closer. Watch the scale bar.",
    },
    focus: {
      type: "option", label: "Look at",
      options: [{ value: "", label: "Nothing in particular" }, ...PART_OPTIONS],
      default: "nucleus",
      help: "Zoom past 'Organelle' to go inside the part you chose.",
    },
    light: {
      type: "number", label: "Light on the cell", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.8,
      bands: ["6-8", "9-12"],
      help: "Only chloroplasts can use it.",
    },
    mode: {
      type: "option", label: "Mode",
      options: [{ value: "explore", label: "Explore" }, { value: "build", label: "Build a cell" }],
      default: "explore",
      help: "Build starts you with an empty cell.",
    },
    addPart: {
      type: "option", label: "Part to place", options: PART_OPTIONS, default: "membrane",
      help: "In Build mode, click the stage to put this part in.",
    },
  },
  overlays: [
    { key: "labels", label: "Part names", default: true },
    { key: "activity", label: "Show them working", default: true },
    { key: "scaleBar", label: "Scale bar", default: true },
    { key: "checklist", label: "Build checklist", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "plant-vs-animal",
      title: "What does a plant cell have that you do not?",
      question: "Which parts belong to both kinds of cell, and which belong to only one?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-2"],
      setup: { cellType: "animal", bodyPlan: "multicellular", zoom: 5, focus: "nucleus", mode: "explore" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you look.",
          predict: {
            prompt: "Which of these is in a plant cell but NOT in an animal cell?",
            options: ["Mitochondria", "Nucleus", "Chloroplasts", "Cell membrane"],
            correct: 2,
            reveal: "Chloroplasts. Both kinds of cell have mitochondria — a plant respires too, it just makes its own glucose first.",
          },
        },
        {
          id: "animal",
          phase: "measure",
          title: "Count the animal cell's parts",
          instruction: "Stay on the animal cell. Click through every part and record.",
          check: { describe: "Looking at an animal cell", test: (v) => v.params.cellType === "animal" },
          requireData: 1,
          hints: ["Clicking the cell steps to the next part."],
        },
        {
          id: "plant",
          phase: "measure",
          title: "Now switch to the plant cell",
          instruction: "Switch to Plant cell and record again. Three parts are new.",
          check: { describe: "Looking at a plant cell", test: (v) => v.params.cellType === "plant" },
          requireData: 2,
          hints: ["Look at the outside edge as well as the inside."],
        },
        {
          id: "why",
          phase: "analyze",
          title: "Ask why, not just what",
          instruction: "A plant stands still and makes its own food. Which extra parts let it?",
          write: {
            prompt: "Match each plant-only part to the job a plant has that you do not.",
            placeholder: "The chloroplast lets the plant ... The cell wall lets it ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say what both cells share and why they still share it.",
          write: {
            prompt: "Why do plant cells have mitochondria if they already make glucose?",
            placeholder: "Making glucose is not the same as ...",
          },
        },
      ],
    },
    {
      id: "how-small",
      title: "How small is a cell, really?",
      question: "How many of your cells would fit across one millimetre?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS1-1"],
      setup: { cellType: "animal", bodyPlan: "multicellular", zoom: 3, focus: "mitochondria", mode: "explore" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Guess before measuring",
          instruction: "One millimetre is about the thickness of a coin's edge.",
          predict: {
            prompt: "How many human cells would fit in a line across 1 millimetre?",
            options: ["About 5", "About 50", "About 5 000", "About 5 000 000"],
            correct: 1,
            reveal: "About 50. A typical human cell is roughly 20 micrometres — a fiftieth of a millimetre.",
          },
        },
        {
          id: "zoom",
          phase: "measure",
          title: "Zoom until one cell fills the view",
          instruction: "Slide Zoom to about 5 and read the scale bar. Record.",
          check: { describe: "View is narrower than 0.1 mm", test: (v) => (v.facts.viewSpanM as number) < 1e-4 },
          requireData: 3,
          hints: ["The scale bar is bottom left; its label changes units as you go in."],
        },
        {
          id: "organelle",
          phase: "measure",
          title: "Now go inside one part",
          instruction: "Zoom past 6.5 with a part chosen. Record the view width.",
          check: { describe: "View is narrower than 2 micrometres", test: (v) => (v.facts.viewSpanM as number) < 2e-6 },
          requireData: 5,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Put the numbers together",
          instruction: "Compare a cell, a mitochondrion and a ribosome.",
          write: {
            prompt: "Write the three sizes in order, each as a fraction of a millimetre.",
            placeholder: "A cell is about ... a mitochondrion is about ... a ribosome is about ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "build-animal",
      title: "Build a working animal cell",
      brief: "Place every part an animal cell needs to stay alive.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { mode: "build", cellType: "animal", zoom: 5, addPart: "membrane" },
      goal: {
        describe: "All five essential parts placed",
        test: (v) => v.facts.cellWorks === true && v.params.cellType === "animal",
      },
      stars: {
        two: {
          describe: "Working, plus one extra organelle",
          test: (v) => v.facts.cellWorks === true && (v.facts.extraCount as number) >= 1,
        },
        three: {
          describe: "Working, with no part that belongs only to plants",
          test: (v) =>
            v.facts.cellWorks === true && (v.facts.extraCount as number) >= 3 &&
            v.facts.hasChloroplast === false && v.facts.hasWall === false,
        },
      },
      hints: [
        "Choose a part in the control, then click the stage to place it.",
        "The checklist tells you what is still missing.",
        "Nothing works without something to hold the cell together.",
      ],
    },
    {
      id: "build-plant",
      title: "Build a working plant cell",
      brief: "A plant cell needs everything an animal cell needs, and two more.",
      bands: ["6-8", "9-12"],
      setup: { mode: "build", cellType: "plant", zoom: 5, addPart: "wall", light: 0.8 },
      goal: {
        describe: "All seven essential parts placed",
        test: (v) => v.facts.cellWorks === true && v.params.cellType === "plant",
      },
      stars: {
        two: {
          describe: "Working, and making oxygen",
          test: (v) => v.facts.cellWorks === true && (v.facts.o2 as number) > 0,
        },
        three: {
          describe: "Working, making oxygen, and holding water in a vacuole",
          test: (v) =>
            v.facts.cellWorks === true && (v.facts.o2 as number) > 0 && v.facts.hasVacuole === true,
        },
      },
      hints: [
        "A plant cell still needs mitochondria — glucose is no use until it is released.",
        "Turn the light up once the chloroplasts are in.",
      ],
    },
  ],
};
