import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

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
 * ------------------------------------------------------------------ */

const SPARK_KIND = ["ATP", "O₂", "glucose", "mRNA"];

function organelleColor(id: string, theme: RenderContext<State>["theme"]): string {
  switch (id) {
    case "chloroplast": return theme.sci["producer"];
    case "mitochondria": return theme.sci["energy-kinetic"];
    case "vacuole": return theme.sci["liquid"];
    case "nucleus": return theme.accent;
    case "wall": return theme.sci["solid"];
    case "membrane": return theme.inkSoft;
    case "ribosome": return theme.sci["mass"];
    default: return theme.inkSoft;
  }
}

function sparkColor(kind: number, theme: RenderContext<State>["theme"]): string {
  if (kind === 0) return theme.sci["energy-kinetic"];
  if (kind === 1) return theme.sci["gas"];
  if (kind === 2) return theme.sci["energy-potential"];
  return theme.accent;
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

/** Zoomed out: the organism, with a box round the piece we are about to enter. */
function drawFarView(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, theme, width, height, params } = rc;
  const cx = width / 2;
  const cy = height * 0.5;
  const plant = params.cellType === "plant";
  const bodyPx = Math.max(10, org.bodyM * pxPerM);

  if (org.cells === 1) {
    // A single-celled organism: several individuals adrift in one drop.
    for (let i = 0; i < 7; i++) {
      const a = i * 2.39996;
      const rr = (0.12 + 0.34 * ((i * 5) % 7) / 7) * Math.min(width, height);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.7;
      sphere(ctx, px, py, Math.max(3, bodyPx * 0.5), plant ? theme.sci["producer"] : theme.accent, {
        glow: 0.3,
      });
    }
    caption(ctx, cx, height * 0.14, `${org.name} — a drop of pond water`, theme, {
      align: "center", size: 14,
    });
    caption(ctx, cx, height * 0.14 + 20, "every one of these is a whole organism", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
    return;
  }

  ctx.save();
  ctx.fillStyle = plant ? theme.sci["producer"] : mixHex(theme.accent, theme.surface, 0.35);
  if (plant) {
    // A leaf: a blade with a midrib.
    const w = Math.min(width * 0.4, bodyPx);
    const h = w * 1.7;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mixHex(theme.sci["producer"], "#000000", 0.35);
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
    ctx.strokeStyle = ctx.fillStyle as string;
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
  ctx.restore();

  // The window we are zooming into.
  const boxR = Math.max(9, Math.min(width, height) * 0.06);
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(cx - boxR, cy - boxR, boxR * 2, boxR * 2);
  ctx.restore();
  caption(ctx, cx + boxR + 8, cy, "zoom in here", theme, { size: 11, color: theme.accent });
  caption(ctx, width / 2, height * 0.1, org.name, theme, { align: "center", size: 15 });
}

/** Mid zoom: many cells packed into a tissue, or many separate individuals. */
function drawTissueView(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, theme, width, height, params } = rc;
  const plant = params.cellType === "plant";
  const cellPx = Math.max(4, org.cellM * pxPerM);
  const cols = Math.min(60, Math.ceil(width / cellPx) + 1);
  const rows = Math.min(45, Math.ceil(height / cellPx) + 1);
  const fill = plant ? theme.sci["producer"] : mixHex(theme.accent, theme.surface, 0.45);

  ctx.save();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Plant cells tile as neat boxes; animal cells offset and round over.
      const ox = plant ? 0 : ((r % 2) * cellPx) / 2;
      const x = c * cellPx + ox;
      const y = r * cellPx;
      ctx.globalAlpha = org.cells === 1 ? 0.3 : 0.8;
      ctx.fillStyle = fill;
      if (plant) {
        roundRect(ctx, x + 1, y + 1, cellPx - 2, cellPx - 2, Math.min(3, cellPx * 0.15));
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.sci["solid"];
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x + cellPx / 2, y + cellPx / 2, cellPx * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (cellPx > 14) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.arc(x + cellPx * 0.42, y + cellPx * 0.42, cellPx * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  const text = org.cells === 1
    ? "Not a tissue — just many separate one-celled organisms"
    : plant ? "Leaf tissue: cells stacked in a wall-to-wall grid"
      : "Tissue: many cells of the same kind, working together";
  caption(ctx, width / 2, 18, text, rc.theme, { align: "center", size: 12 });
}

/** The main event: one cell, with its organelles at work. */
function drawCell(rc: RenderContext<State>, org: OrganismSpec, pxPerM: number) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const plant = params.cellType === "plant";
  const focus = effectiveFocus(state, params);
  const cx = width / 2;
  const cy = height * 0.5;
  const cellR = Math.min(Math.max(30, (org.cellM * pxPerM) / 2), Math.min(width, height) * 0.44);
  const has = (id: string) => state.built.includes(id);
  const dark = isDarkTheme(theme);

  /* --- light falling on the cell --------------------------------- */
  const light = params.light as number;
  if (plant && light > 0.02) {
    ctx.save();
    ctx.strokeStyle = theme.sci["light"];
    ctx.globalAlpha = 0.14 + 0.4 * light;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x0 = -40 + (i / 6) * (width + 80);
      ctx.beginPath();
      ctx.moveTo(x0, -10);
      ctx.lineTo(x0 + height * 0.45, height + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- the cell body --------------------------------------------- */
  const wall = has("wall");
  const boxy = plant;
  ctx.save();
  if (wall) {
    // The wall is drawn as a real thickness, not an outline.
    const t = Math.max(4, cellR * 0.08);
    ctx.fillStyle = theme.sci["solid"];
    roundRect(ctx, cx - cellR - t, cy - cellR - t, (cellR + t) * 2, (cellR + t) * 2, cellR * 0.16);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = mixHex(theme.sci["solid"], "#ffffff", 0.4);
    roundRect(ctx, cx - cellR - t, cy - cellR - t, (cellR + t) * 2, t * 0.9, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (has("cytoplasm") || has("membrane")) {
    const g = ctx.createRadialGradient(cx - cellR * 0.3, cy - cellR * 0.35, cellR * 0.1, cx, cy, cellR);
    const jelly = theme.sci["liquid"];
    g.addColorStop(0, hexA(mixHex(jelly, "#ffffff", dark ? 0.1 : 0.5), 0.5));
    g.addColorStop(1, hexA(jelly, dark ? 0.34 : 0.22));
    ctx.fillStyle = g;
    if (boxy) {
      roundRect(ctx, cx - cellR, cy - cellR, cellR * 2, cellR * 2, cellR * 0.14);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has("membrane")) {
    ctx.strokeStyle = focus === "membrane" ? theme.accent : theme.inkSoft;
    ctx.lineWidth = focus === "membrane" ? 4.5 : 3;
    if (boxy) roundRect(ctx, cx - cellR, cy - cellR, cellR * 2, cellR * 2, cellR * 0.14);
    else {
      ctx.beginPath();
      ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
    }
    ctx.stroke();
    // The phospholipid heads, which is what makes it a *double* layer.
    if (cellR > 70) {
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      if (boxy) roundRect(ctx, cx - cellR + 5, cy - cellR + 5, cellR * 2 - 10, cellR * 2 - 10, cellR * 0.12);
      else {
        ctx.beginPath();
        ctx.arc(cx, cy, cellR - 5, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }
  ctx.restore();

  /* --- cytoplasmic streaming ------------------------------------- */
  if (overlays.activity !== false && has("cytoplasm")) {
    ctx.save();
    ctx.fillStyle = theme.sci["liquid"];
    for (const p of state.stream) {
      const px = cx + Math.cos(p.a) * p.r * cellR * 0.92;
      const py = cy + Math.sin(p.a) * p.r * cellR * 0.92;
      ctx.globalAlpha = 0.16 + 0.2 * Math.abs(Math.sin(p.a * 2));
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1.2, cellR * 0.02), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* --- organelles ------------------------------------------------ */
  const drawn = organellesFor(params.cellType as string)
    .filter((o) => has(o.id) && o.id !== "membrane" && o.id !== "cytoplasm" && o.id !== "wall");
  // Big things first so the small ones stay clickable on top of them.
  drawn.sort((a, b) => b.r - a.r);

  for (const spec of drawn) {
    const color = organelleColor(spec.id, theme);
    const lit = focus === spec.id;
    for (let i = 0; i < spec.copies; i++) {
      const [ox, oy] = copyOffset(spec, i);
      const px = cx + ox * cellR;
      const py = cy + oy * cellR;
      const baseR = spec.r * cellR;
      drawOrganelle(rc, spec, px, py, baseR, color, lit, i);
    }
  }

  /* --- molecules the organelles have just made -------------------- */
  if (overlays.activity !== false) {
    for (const s of state.sparks) {
      const px = cx + s.x * cellR;
      const py = cy + s.y * cellR;
      const a = Math.min(1, s.life);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.6 * a;
      const col = sparkColor(s.kind, theme);
      sphere(ctx, px, py, Math.max(1.6, cellR * 0.022), col, { rim: false });
      ctx.restore();
      if (cellR > 110 && band !== "3-5") {
        caption(ctx, px + 6, py - 6, SPARK_KIND[s.kind], theme, {
          size: 9, color: sparkColor(s.kind, theme),
        });
      }
    }
  }

  /* --- labels ----------------------------------------------------- */
  if (overlays.labels !== false && band !== "3-5") {
    for (const spec of drawn) {
      const [ox, oy] = copyOffset(spec, 0);
      const px = cx + ox * cellR;
      const py = cy + oy * cellR - spec.r * cellR - 9;
      if (px < 4 || px > width - 4) continue;
      caption(ctx, px, py, spec.name, theme, {
        align: "center", size: 10,
        color: focus === spec.id ? theme.accent : theme.inkSoft,
      });
    }
    if (has("membrane")) {
      caption(ctx, cx, cy - cellR - (wall ? 18 : 10), wall ? "Cell wall + membrane" : "Cell membrane", theme, {
        align: "center", size: 10, color: theme.inkSoft,
      });
    }
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

/** One organelle, drawn as the thing it is rather than a coloured dot. */
function drawOrganelle(
  rc: RenderContext<State>, spec: OrganelleSpec,
  px: number, py: number, r: number, color: string, lit: boolean, copy: number,
) {
  const { ctx, state, theme, params } = rc;
  const t = state.t;
  const pulse = 1 + 0.09 * Math.sin(t * 2.4 + copy * 1.7);

  ctx.save();
  switch (spec.id) {
    case "mitochondria": {
      // A stadium shape with cristae folded across it, pulsing as it works.
      const w = r * 2.1 * pulse;
      const h = r * 1.15;
      ctx.translate(px, py);
      ctx.rotate(0.4 + copy * 0.9);
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, mixHex(color, "#ffffff", 0.4));
      g.addColorStop(1, mixHex(color, "#000000", 0.25));
      ctx.fillStyle = g;
      roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.strokeStyle = lit ? theme.accent : mixHex(color, "#000000", 0.45);
      ctx.lineWidth = lit ? 2.4 : 1;
      ctx.stroke();
      ctx.strokeStyle = mixHex(color, "#000000", 0.4);
      ctx.lineWidth = Math.max(0.8, h * 0.09);
      ctx.beginPath();
      const folds = 5;
      for (let i = 1; i < folds; i++) {
        const x = -w / 2 + (i / folds) * w;
        ctx.moveTo(x, -h * 0.36);
        ctx.quadraticCurveTo(x + (i % 2 ? h * 0.3 : -h * 0.3), 0, x, h * 0.36);
      }
      ctx.stroke();
      break;
    }
    case "chloroplast": {
      // A lens packed with thylakoid stacks, glowing with the light it catches.
      const light = params.light as number;
      const w = r * 2.2;
      const h = r * 1.25;
      ctx.translate(px, py);
      ctx.rotate(-0.3 + copy * 0.8);
      if (light > 0.05) glow(ctx, 0, 0, w * 0.9, theme.sci["light"], 0.16 + 0.3 * light);
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, mixHex(color, "#ffffff", 0.45));
      g.addColorStop(1, mixHex(color, "#000000", 0.3));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lit ? theme.accent : mixHex(color, "#000000", 0.45);
      ctx.lineWidth = lit ? 2.4 : 1;
      ctx.stroke();
      ctx.fillStyle = mixHex(color, "#000000", 0.35);
      for (let i = 0; i < 3; i++) {
        const sx = -w * 0.24 + i * w * 0.24;
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(sx - w * 0.06, -h * 0.16 + j * h * 0.13, w * 0.12, Math.max(1, h * 0.07));
        }
      }
      break;
    }
    case "nucleus": {
      sphere(ctx, px, py, r * pulse * 0.99, color, { glow: lit ? 0.4 : 0 });
      // Chromatin: the DNA the nucleus exists to protect.
      ctx.strokeStyle = mixHex(color, "#000000", 0.5);
      ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = t * 0.2 + i * 1.6;
        ctx.moveTo(px + Math.cos(a) * r * 0.55, py + Math.sin(a) * r * 0.5);
        ctx.quadraticCurveTo(
          px + Math.cos(a + 1) * r * 0.2, py + Math.sin(a + 1) * r * 0.2,
          px + Math.cos(a + 2.2) * r * 0.5, py + Math.sin(a + 2.2) * r * 0.55,
        );
      }
      ctx.stroke();
      // The nucleolus, where ribosomes are assembled.
      sphere(ctx, px + r * 0.22, py - r * 0.18, r * 0.26, mixHex(color, "#000000", 0.3), { rim: false });
      // Pores in the envelope: the way instructions get out.
      ctx.fillStyle = theme.surface;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        ctx.beginPath();
        ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, Math.max(1, r * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
      if (lit) {
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "vacuole": {
      const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
      g.addColorStop(0, hexA(mixHex(color, "#ffffff", 0.6), 0.6));
      g.addColorStop(1, hexA(color, 0.35));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 1.15, r, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lit ? theme.accent : hexA(color, 0.8);
      ctx.lineWidth = lit ? 2.6 : 1.4;
      ctx.stroke();
      break;
    }
    case "er": {
      // Folded sheets radiating away from the nucleus.
      ctx.strokeStyle = lit ? theme.accent : color;
      ctx.lineWidth = Math.max(1.2, r * 0.09);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const rr = r * (0.4 + i * 0.2);
        ctx.moveTo(px - rr, py - rr * 0.5);
        ctx.bezierCurveTo(px - rr * 0.2, py - rr, px + rr * 0.2, py + rr * 0.2, px + rr, py - rr * 0.3);
      }
      ctx.stroke();
      break;
    }
    case "golgi": {
      ctx.strokeStyle = lit ? theme.accent : color;
      ctx.lineWidth = Math.max(1.4, r * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const rr = r * (1 - i * 0.16);
        ctx.moveTo(px - rr, py - r * 0.4 + i * r * 0.28);
        ctx.quadraticCurveTo(px, py - r * 0.75 + i * r * 0.28, px + rr, py - r * 0.4 + i * r * 0.28);
      }
      ctx.stroke();
      break;
    }
    case "ribosome": {
      sphere(ctx, px, py, Math.max(1.6, r), color, { rim: false, glow: lit ? 0.9 : 0 });
      break;
    }
    case "lysosome": {
      sphere(ctx, px, py, Math.max(2, r * pulse), color, { glow: lit ? 0.6 : 0 });
      ctx.fillStyle = mixHex(color, "#000000", 0.4);
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + t * 0.6;
        ctx.beginPath();
        ctx.arc(px + Math.cos(a) * r * 0.4, py + Math.sin(a) * r * 0.4, Math.max(0.8, r * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "centriole": {
      ctx.translate(px, py);
      ctx.rotate(copy * 1.5708);
      ctx.strokeStyle = lit ? theme.accent : color;
      ctx.lineWidth = Math.max(1.4, r * 0.3);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(-r + i * r, -r * 1.3);
        ctx.lineTo(-r + i * r, r * 1.3);
      }
      ctx.stroke();
      break;
    }
    default: {
      sphere(ctx, px, py, Math.max(2, r), color, { glow: lit ? 0.5 : 0 });
    }
  }
  ctx.restore();
}

/** Deep zoom: one organelle filling the frame, with what it does written out. */
function drawOrganelleView(rc: RenderContext<State>, spec: OrganelleSpec | undefined) {
  const { ctx, theme, width, height, band } = rc;
  if (!spec) {
    caption(ctx, width / 2, height / 2, "Pick a part to look inside", theme, {
      align: "center", size: 15,
    });
    return;
  }
  const cx = width * 0.36;
  const cy = height * 0.5;
  const r = Math.min(width, height) * 0.28;
  const color = organelleColor(spec.id, theme);
  glow(ctx, cx, cy, r * 2, color, 0.16);
  drawOrganelle(rc, spec, cx, cy, r, color, true, 0);

  const tx = Math.min(width - 14, cx + r * 1.35);
  caption(ctx, tx, cy - 46, spec.name, theme, { size: 16 });
  caption(ctx, tx, cy - 24, `about ${metreLabel(spec.sizeM)} across`, theme, {
    size: 11, color: theme.inkSoft,
  });
  wrapText(rc, spec.job, tx, cy - 2, width - tx - 12, 13, theme.ink);
  if (band === "6-8" || band === "9-12") {
    wrapText(rc, spec.structure, tx, cy + 46, width - tx - 12, 11, theme.inkSoft);
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
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const org = organismFor(params.cellType as string, params.bodyPlan as string);
  const span = viewSpan(params.zoom as number);
  const pxPerM = Math.min(width, height) / span;

  sky(ctx, width, height, theme, "microscope");

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
