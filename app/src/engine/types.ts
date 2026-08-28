import type { Rng } from "./rng";
import type { Quantity, UnitKind } from "./units";

/** The four grade bands the platform adapts to. One sim, four depths. */
export type GradeBand = "K-2" | "3-5" | "6-8" | "9-12";
export const GRADE_BANDS: GradeBand[] = ["K-2", "3-5", "6-8", "9-12"];

export const BAND_LABEL: Record<GradeBand, string> = {
  "K-2": "Grades K-2",
  "3-5": "Grades 3-5",
  "6-8": "Grades 6-8",
  "9-12": "Grades 9-12",
};

/** Significant figures shown per band — younger students see rounder numbers. */
export const BAND_SIG_FIGS: Record<GradeBand, number> = {
  "K-2": 2,
  "3-5": 2,
  "6-8": 3,
  "9-12": 4,
};

export type Subject = "physics" | "chemistry" | "biology" | "earth" | "math" | "engineering";

export const SUBJECT_LABEL: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  earth: "Earth & Space",
  math: "Mathematics",
  engineering: "Engineering",
};

export type SimMode = "explore" | "lab" | "challenge";

/* ------------------------------------------------------------------ *
 * Parameters — the controls a student manipulates
 * ------------------------------------------------------------------ */

export interface NumberParam {
  type: "number";
  label: string;
  kind: UnitKind;
  /** Display unit id; the stored value is always SI. */
  unit?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Bands that see this control at all. Omitted means every band. */
  bands?: GradeBand[];
  /** Short help text shown on demand, never as a wall of instruction. */
  help?: string;
  /** Preset stops shown as labelled ticks (e.g. gravity on other worlds). */
  marks?: { value: number; label: string }[];
  /** Hide the numeric readout (K-2 sees a control, not a number). */
  hideValueBands?: GradeBand[];
}

export interface BooleanParam {
  type: "boolean";
  label: string;
  default: boolean;
  bands?: GradeBand[];
  help?: string;
}

export interface OptionParam {
  type: "option";
  label: string;
  options: { value: string; label: string }[];
  default: string;
  bands?: GradeBand[];
  help?: string;
}

export type ParamSpec = NumberParam | BooleanParam | OptionParam;
export type ParamSchema = Record<string, ParamSpec>;

/** Runtime parameter values, keyed the same as the schema. */
export type ParamValues = Record<string, number | boolean | string>;

export function defaultParams(schema: ParamSchema): ParamValues {
  const out: ParamValues = {};
  for (const [key, spec] of Object.entries(schema)) out[key] = spec.default;
  return out;
}

/** Which parameters a given band is allowed to see. */
export function paramsForBand(schema: ParamSchema, band: GradeBand): [string, ParamSpec][] {
  return Object.entries(schema).filter(([, spec]) => !spec.bands || spec.bands.includes(band));
}

/* ------------------------------------------------------------------ *
 * Readouts — derived quantities a sim exposes to graphs, tools and AI
 * ------------------------------------------------------------------ */

export interface Readout {
  key: string;
  label: string;
  quantity: Quantity;
  /** Preferred display unit id. */
  unit?: string;
  /** Bands that see this readout. */
  bands?: GradeBand[];
  /** Semantic colour token, e.g. "velocity" — see the science palette. */
  semantic?: string;
  /** Graphable readouts can be recorded over time. */
  graphable?: boolean;
}

/* ------------------------------------------------------------------ *
 * The model contract
 * ------------------------------------------------------------------ */

export interface SimContext {
  rng: Rng;
  band: GradeBand;
  /** Wall-clock-independent simulated time in seconds. */
  time: number;
  /** Optional measurement noise factor (0 = perfect, 1 = realistic). */
  messiness: number;
}

/** A pointer/touch interaction forwarded into the model. */
export interface PointerInput {
  type: "pointerdown" | "pointermove" | "pointerup";
  /** World coordinates, already converted from screen space by the view. */
  x: number;
  y: number;
  id: number;
}

export interface ActionInput {
  type: "action";
  action: string;
  payload?: unknown;
}

export type SimInput = PointerInput | ActionInput;

/**
 * A simulation model. Pure: step() must be a function of (state, dt, inputs)
 * with no reads of Date.now, Math.random, or the DOM. That purity is what makes
 * save/share links, replay, and teacher review all work from one mechanism.
 */
export interface SimModel<S = unknown> {
  /** Build initial state. Called on load, reset, and replay. */
  init(params: ParamValues, ctx: SimContext): S;

  /** Advance exactly dt seconds. */
  step(state: S, dt: number, params: ParamValues, ctx: SimContext, inputs: readonly SimInput[]): S;

  /** Called when a control changes mid-run; may restructure state. */
  applyParams?(state: S, params: ParamValues, prev: ParamValues, ctx: SimContext): S;

  /** Values surfaced to readouts, graphs, lab checkpoints, and the AI. */
  readouts(state: S, params: ParamValues, ctx: SimContext): Readout[];

  /** Optional facts for lab checkpoints that are not user-facing readouts. */
  facts?(state: S, params: ParamValues): Record<string, number | boolean | string>;
}

/* ------------------------------------------------------------------ *
 * View contract
 * ------------------------------------------------------------------ */

export interface RenderContext<S = unknown> {
  ctx: CanvasRenderingContext2D;
  state: S;
  params: ParamValues;
  band: GradeBand;
  /** Canvas dimensions in CSS pixels. */
  width: number;
  height: number;
  /** Active overlay toggles, e.g. { vectors: true, grid: false }. */
  overlays: Record<string, boolean>;
  /** Interpolation alpha between the last two model states (0..1). */
  alpha: number;
  /** Resolved theme colours so sims never hardcode hex values. */
  theme: ThemeColors;
  time: number;
}

export interface ThemeColors {
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  line: string;
  grid: string;
  accent: string;
  /** Semantic science colours, keyed by quantity name. */
  sci: Record<string, string>;
}

/** Overlays a sim offers (vectors, field lines, traces, particle view...). */
export interface OverlaySpec {
  key: string;
  label: string;
  default: boolean;
  bands?: GradeBand[];
}

/* ------------------------------------------------------------------ *
 * Manifest — one declarative record per simulation
 * ------------------------------------------------------------------ */

export interface SimManifest<S = unknown> {
  id: string;
  title: string;
  /** One sentence describing what the student does, not what the sim is. */
  tagline: string;
  subject: Subject;
  bands: GradeBand[];
  /** Grade numbers this sim is tagged to, for catalog filtering. */
  grades: number[];
  standards: { ngss?: string[]; ccssMath?: string[] };
  /** What the student should be able to do afterwards. */
  learningGoals: string[];
  params: ParamSchema;
  overlays?: OverlaySpec[];
  model: SimModel<S>;
  render: (rc: RenderContext<S>) => void;
  /** Optional pointer-driven interaction hint shown once on first load. */
  interactionHint?: string;
  /** Model tick rate; defaults to 120 Hz. */
  tickRate?: number;
  /** Sim-time seconds per real second at 1x speed. Defaults to 1. */
  timeScale?: number;
  /** Guided labs attached to this sim. */
  labs?: LabDefinition[];
  /** Challenges attached to this sim. */
  challenges?: ChallengeDefinition[];
  /** Concepts this sim confronts, used by the catalog and the AI context. */
  misconceptions?: string[];
  /** Accent used in the catalog card; defaults to the subject colour. */
  accent?: string;
}

/**
 * A manifest whose state type has been erased.
 *
 * The shell holds simulations of many different state shapes in one list, and
 * a model is only ever paired with its own render function, so the state type
 * is not useful outside the sim that defines it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySim = SimManifest<any>;

/* ------------------------------------------------------------------ *
 * Guided Labs
 * ------------------------------------------------------------------ */

/** A predicate over live sim readouts and facts. */
export interface LabCheck {
  /** Human description of what must be true. */
  describe: string;
  test: (v: LabValues) => boolean;
}

export interface LabValues {
  readouts: Record<string, number>;
  facts: Record<string, number | boolean | string>;
  params: ParamValues;
  /** Rows the student has recorded into the data table. */
  data: DataRow[];
  elapsed: number;
}

export interface LabStep {
  id: string;
  /** The phase this step belongs to, shown as a progress spine. */
  phase: "question" | "hypothesis" | "setup" | "measure" | "analyze" | "conclude";
  title: string;
  /** Kept short — the specification caps instructional text per band. */
  instruction: string;
  /** A prediction the student commits to before running (predict-before-run). */
  predict?: {
    prompt: string;
    options: string[];
    /** Index of the scientifically correct option; used only after answering. */
    correct: number;
    /** Shown once the student has seen the outcome. */
    reveal: string;
  };
  /** Auto-verified condition that completes the step. */
  check?: LabCheck;
  /** Free-text prompt written into the Lab Notebook. */
  write?: { prompt: string; placeholder?: string };
  /** Require at least this many recorded data rows. */
  requireData?: number;
  /** Hints, disclosed one at a time, never jumping to the answer. */
  hints?: string[];
}

export interface LabDefinition {
  id: string;
  title: string;
  /** The question the lab answers, in student language. */
  question: string;
  bands: GradeBand[];
  /** Estimated minutes, so a teacher can fit it to a period. */
  minutes: number;
  standards?: string[];
  /** Parameter values the lab starts from. */
  setup?: ParamValues;
  steps: LabStep[];
}

/* ------------------------------------------------------------------ *
 * Challenges
 * ------------------------------------------------------------------ */

export interface ChallengeDefinition {
  id: string;
  title: string;
  brief: string;
  bands: GradeBand[];
  setup?: ParamValues;
  /** Star thresholds, evaluated continuously while the sim runs. */
  goal: LabCheck;
  /** Optional stricter conditions for the second and third star. */
  stars?: { two?: LabCheck; three?: LabCheck };
  hints?: string[];
}

/* ------------------------------------------------------------------ *
 * Data recording
 * ------------------------------------------------------------------ */

export interface DataRow {
  t: number;
  values: Record<string, number>;
}
