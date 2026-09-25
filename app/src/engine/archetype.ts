import type {
  AnySim, ChallengeDefinition, GradeBand, LabDefinition, ParamValues,
  RenderContext, SimManifest, Subject,
} from "./types";

/**
 * Archetypes — simulations expressed as content, not code.
 *
 * A hand-written simulation costs a great deal to produce and every one of
 * them re-invents its own rendering, so quality drifts: one looks superb and
 * the next looks like a wireframe. Yet most science interactions fall into a
 * handful of shapes. A student sorting living from non-living is doing the
 * same thing as a student sorting igneous from sedimentary; only the specimens
 * and the science differ.
 *
 * So the shape is written once, carefully, and drawn through the organic and
 * labware kits; each simulation then supplies only what is genuinely unique to
 * it. Every simulation inherits the same perfected rendering, which is what
 * makes a catalogue of hundreds look like one product rather than hundreds of
 * separate efforts.
 */

/** What a student is being asked to do. */
export type ArchetypeKind =
  | "sort"        // classify specimens into categories
  | "explore"     // a labelled structure to pick apart
  | "investigate" // change a variable, measure the response, plot it
  | "process"     // walk a staged sequence, forwards and back
  | "assemble"    // build something and be told whether it is right
  | "compare"     // two configurations side by side
  | "trace";      // follow one thing through a system

/** How a specimen or part should be drawn. */
export type Art =
  | { art: "cell"; plant?: boolean; organelles?: string[] }
  | { art: "organelle"; which: "nucleus" | "mitochondrion" | "reticulum" | "chloroplast" | "golgi" | "vesicle" }
  | { art: "microbe"; which: "virus" | "bacterium" }
  | { art: "glassware"; which: "beaker" | "flask" | "testTube"; level?: number; color?: string; bubbles?: number; precipitate?: number }
  | { art: "apparatus"; which: "spring" | "cart" | "stand" | "bulb" | "battery" | "magnet" | "burner" }
  | { art: "sphere"; color?: string; radius?: number; glow?: number }
  | { art: "molecule"; formula: string }
  | { art: "atom"; protons: number; neutrons: number; electrons: number }
  | { art: "dna" }
  | { art: "planet"; color: string; rings?: boolean; atmosphere?: string }
  | { art: "body"; which: string }
  | { art: "landform"; which: string }
  | { art: "creature"; which: string; facing?: number }
  | { art: "flora"; which: string }
  | { art: "habitat"; which: string }
  | { art: "icon"; glyph: string };

/** What `drive` is told. */
export interface DriveInput {
  /** Live control values, defaults filled in. */
  v: Record<string, number>;
  /** Everything `measure` returned, plus the run's own counters. */
  f: Record<string, number>;
  /** Seconds since the simulation started. */
  t: number;
  /** Which specimen is being drawn, for a spec that shows several. */
  specimen: Specimen;
  /** Index of that specimen in `specimens`. */
  index: number;
}

/**
 * What `drive` may change about the drawing.
 *
 * Every field is optional and every one is a *visual* quantity, not a physical
 * one: the physics stays in `measure`, and this only says how to show it.
 */
export interface DriveResult {
  /** 0-1 fill for glassware. */
  level?: number;
  /** Override the specimen's colour — a solution changing, a body heating. */
  color?: string;
  /** Bubble intensity 0-1, or a count above 1. */
  bubbles?: number;
  /** Suspended solid, 0-1. */
  precipitate?: number;
  /** Multiplies the drawn size: a cell swelling, a balloon inflating. */
  scale?: number;
  /** Radians about the vertical. Overrides the default slow turn. */
  spin?: number;
  /** Radians toward the viewer. */
  tilt?: number;
  /** Shifts the specimen, in multiples of its own size. */
  offset?: [number, number];
  /** 0-1 emitted light, for anything hot, lit or excited. */
  glow?: number;
  /** 0-1 how fast the subject's own animation runs. 0 freezes it. */
  rate?: number;
}

export interface Specimen {
  id: string;
  name: string;
  /** The category this belongs in, for `sort`. */
  category?: string;
  /** Why it belongs there — shown after the student commits. */
  because?: string;
  art: Art;
  /** Labelled features, for `explore`. */
  parts?: { id: string; name: string; note: string; at: [number, number] }[];
}

export interface Variable {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Bands that see this control; omitted means all. */
  bands?: GradeBand[];
}

export interface Stage {
  name: string;
  caption: string;
  /** 0-1 position in the process, used to drive the animation. */
  at: number;
}

export interface ArchetypeSpec {
  id: string;
  title: string;
  tagline: string;
  kind: ArchetypeKind;
  subject: Subject;
  bands: GradeBand[];
  grades: number[];
  standards: { ngss?: string[]; ccssMath?: string[] };
  learningGoals: string[];
  misconceptions?: string[];

  /** sort / explore / assemble */
  specimens?: Specimen[];
  /** sort: the bins, in the order they are shown. */
  categories?: { id: string; name: string; hint?: string }[];

  /** investigate / compare */
  variables?: Variable[];
  /**
   * The science. Given the variable values, return the measured quantities.
   * This is the one place a topic's real physics or biology lives, and it is
   * what the golden-value tests assert against.
   */
  measure?: (v: Record<string, number>) => Record<string, number>;
  /** Which measured quantity is plotted against which variable. */
  plot?: { x: string; y: string; yLabel: string; xLabel: string };

  /**
   * How the picture answers the controls.
   *
   * Without this a specimen is a photograph: the sliders move, the readouts
   * change, the graph draws — and the thing on the bench sits there. That is
   * an illustration next to a calculator, not an experiment. `drive` closes
   * the loop: given the live variable values and everything `measure`
   * returned, it says what the apparatus should now look like. Raise the
   * liquid, boil it, swell the cell, move the cart, brighten the lamp.
   *
   * It is called every frame with the current values, so it must be cheap and
   * must not allocate anything it does not need. Returning nothing leaves the
   * specimen exactly as its `art` describes it.
   */
  drive?: (input: DriveInput) => DriveResult;

  /** process / trace */
  stages?: Stage[];
  /** trace: the thing being followed, and the places it passes through. */
  route?: { at: [number, number]; name: string; note: string }[];

  /** Scene styling shared by every archetype. */
  scene?: {
    mood?: "lab" | "field" | "space" | "micro" | "dark";
    accent?: string;
  };

  labs?: SimManifest["labs"];
  challenges?: SimManifest["challenges"];
}

/* ------------------------------------------------------------------ *
 * Guided labs, generated from the specification
 *
 * A simulation with sliders and a graph is apparatus. It becomes an experiment
 * when a student is asked a question, made to commit to a prediction before
 * they touch anything, and then held to measuring, recording and concluding.
 * Writing that by hand for every subtopic would cost more than the simulations
 * themselves, and most of it is mechanical: the question is the plot's axes,
 * the prediction is the shape of the response, the measurement is the range of
 * the control, and the conclusion is the relationship.
 *
 * So it is derived. The engine samples the specification's own `measure` across
 * the control's range, works out what actually happens, and builds the lab from
 * that — which means the answer key is computed from the science rather than
 * transcribed, and cannot drift away from it. A specification that wants a
 * bespoke lab simply supplies one and this stands aside.
 * ------------------------------------------------------------------ */

type Shape = "rises" | "falls" | "peaks" | "dips" | "flat";

/** Sample `measure` across one control and say what the response does. */
function responseShape(
  spec: ArchetypeSpec, xKey: string, yKey: string,
): { shape: Shape; lo: number; hi: number; min: number; max: number } {
  const xs = spec.variables?.find((v) => v.key === xKey);
  const base: Record<string, number> = {};
  for (const v of spec.variables ?? []) base[v.key] = v.default;
  const N = 12;
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (xs?.min ?? 0) + ((xs?.max ?? 1) - (xs?.min ?? 0)) * (i / N);
    const out = spec.measure?.({ ...base, [xKey]: x }) ?? {};
    const y = Number(out[yKey]);
    ys.push(Number.isFinite(y) ? y : 0);
  }
  const lo = ys[0], hi = ys[ys.length - 1];
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min;
  // Flat means flat relative to the values themselves, not to zero: a change
  // of 0.001 in a quantity of order 1000 is not a trend a student can see.
  const scale = Math.max(Math.abs(max), Math.abs(min), 1e-9);
  if (span / scale < 0.02) return { shape: "flat", lo, hi, min, max };
  const iMax = ys.indexOf(max), iMin = ys.indexOf(min);
  if (iMax > 1 && iMax < N - 1 && max - Math.max(lo, hi) > span * 0.15) {
    return { shape: "peaks", lo, hi, min, max };
  }
  if (iMin > 1 && iMin < N - 1 && Math.min(lo, hi) - min > span * 0.15) {
    return { shape: "dips", lo, hi, min, max };
  }
  return { shape: hi >= lo ? "rises" : "falls", lo, hi, min, max };
}

const SHAPE_TEXT: Record<Shape, string> = {
  rises: "It goes up the whole way",
  falls: "It goes down the whole way",
  peaks: "It rises, then falls again",
  dips: "It falls, then rises again",
  flat: "It barely changes",
};

function tidy(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1000) return n.toFixed(0);
  if (a >= 10) return n.toFixed(1);
  if (a >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

/**
 * Build the guided lab a specification implies.
 *
 * Returns null when there is nothing to investigate — no controls, no
 * measurement, or nothing plotted — rather than manufacturing a lab about
 * nothing.
 */
export function autoLab(spec: ArchetypeSpec): LabDefinition | null {
  if (!spec.measure || !spec.variables?.length || !spec.plot) return null;
  const { x: xKey, y: yKey, xLabel, yLabel } = spec.plot;
  const xv = spec.variables.find((v) => v.key === xKey);
  if (!xv) return null;

  const r = responseShape(spec, xKey, yKey);
  if (r.shape === "flat") return null;

  const options: Shape[] = ["rises", "falls", "peaks", "dips"];
  const correct = options.indexOf(r.shape);
  const unit = xv.unit ? ` ${xv.unit}` : "";
  const setup: ParamValues = {};
  for (const v of spec.variables) setup[v.key] = v.default;
  setup[xKey] = xv.min;

  const span = xv.max - xv.min;
  const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(xv.step, span * 0.02);

  return {
    id: `${spec.id}-lab`,
    title: `Investigate: ${yLabel}`,
    question: `How does ${yLabel.toLowerCase()} change when you change ${xLabel.toLowerCase()}?`,
    bands: spec.bands,
    minutes: 12,
    standards: spec.standards?.ngss,
    setup,
    steps: [
      {
        id: "question", phase: "question",
        title: "The question",
        instruction: `You are going to change ${xLabel.toLowerCase()} and watch ${yLabel.toLowerCase()}. Everything else stays as it is — that is what makes this a fair test.`,
      },
      {
        id: "predict", phase: "hypothesis",
        title: "Commit to a prediction",
        instruction: "Decide before you touch anything. Being wrong here is worth more than being right later.",
        predict: {
          prompt: `As ${xLabel.toLowerCase()} goes from ${tidy(xv.min)} to ${tidy(xv.max)}${unit}, what does ${yLabel.toLowerCase()} do?`,
          options: options.map((o) => SHAPE_TEXT[o]),
          correct: correct < 0 ? 0 : correct,
          reveal: `${SHAPE_TEXT[r.shape]}: ${tidy(r.lo)} at ${tidy(xv.min)}${unit} and ${tidy(r.hi)} at ${tidy(xv.max)}${unit}, ranging between ${tidy(r.min)} and ${tidy(r.max)}.`,
        },
        hints: spec.misconceptions?.slice(0, 2).map((m) => `Some people think: ${m}. Does the apparatus agree?`),
      },
      {
        id: "setup", phase: "setup",
        title: "Start at the bottom",
        instruction: `Set ${xLabel.toLowerCase()} to its lowest value, ${tidy(xv.min)}${unit}.`,
        check: {
          describe: `${xLabel} is at ${tidy(xv.min)}${unit}`,
          test: (val) => near(Number(val.params[xKey] ?? xv.default), xv.min),
        },
      },
      {
        id: "measure", phase: "measure",
        title: "Work up the range",
        instruction: `Step ${xLabel.toLowerCase()} up and record a reading each time. Five readings spread across the range is enough to see the pattern.`,
        requireData: 5,
        check: {
          describe: "Five readings, spread across the range",
          test: (val) => {
            if (val.data.length < 5) return false;
            // The control being varied is an input, not a readout: it lives in
            // the row's recorded inputs. Reading it from `values` — which this
            // once did — found nothing and quietly made the step impossible.
            const xsSeen = val.data
              .map((d) => Number(d.inputs?.[xKey] ?? d.values[xKey]))
              .filter(Number.isFinite);
            if (xsSeen.length < 5) return false;
            return (Math.max(...xsSeen) - Math.min(...xsSeen)) >= span * 0.6;
          },
        },
        hints: ["Readings bunched at one end cannot show a trend — spread them out."],
      },
      {
        id: "analyze", phase: "analyze",
        title: "Read the graph",
        instruction: `Look at the shape of the line, not just its ends. Where is it steep, and where does it flatten off?`,
        write: {
          prompt: `Describe the shape of the relationship between ${xLabel.toLowerCase()} and ${yLabel.toLowerCase()}.`,
          placeholder: "As one goes up, the other …",
        },
      },
      {
        id: "conclude", phase: "conclude",
        title: "Say what you found",
        instruction: spec.learningGoals[0] ?? "State what the experiment showed.",
        write: {
          prompt: "What does this tell you, and what would you test next?",
          placeholder: "I found that … Next I would change …",
        },
      },
    ],
  };
}

/**
 * Build the challenge a specification implies: hit a target the apparatus can
 * actually reach, set at three quarters of the range the controls can produce.
 */
export function autoChallenge(spec: ArchetypeSpec): ChallengeDefinition | null {
  if (!spec.measure || !spec.variables?.length || !spec.plot) return null;
  const { x: xKey, y: yKey, yLabel } = spec.plot;
  const r = responseShape(spec, xKey, yKey);
  if (r.shape === "flat") return null;

  const target = r.min + (r.max - r.min) * 0.75;
  const tight = r.min + (r.max - r.min) * 0.9;
  const setup: ParamValues = {};
  for (const v of spec.variables) setup[v.key] = v.default;

  const reach = (limit: number) => (val: { facts: Record<string, number | boolean | string> }) => {
    const y = Number(val.facts[yKey]);
    return Number.isFinite(y) && y >= limit;
  };

  return {
    id: `${spec.id}-challenge`,
    title: `Reach ${tidy(target)}`,
    brief: `Set the controls so that ${yLabel.toLowerCase()} reaches at least ${tidy(target)}.`,
    bands: spec.bands,
    setup,
    goal: { describe: `${yLabel} of at least ${tidy(target)}`, test: reach(target) },
    stars: {
      two: { describe: `${yLabel} of at least ${tidy(tight)}`, test: reach(tight) },
      three: { describe: `${yLabel} of at least ${tidy(r.max * 0.99)}`, test: reach(r.max * 0.99) },
    },
    hints: ["Look at your graph: which end of the control pushed the reading the way you want?"],
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

export interface ArchetypeState {
  t: number;
  /** sort: specimen index currently presented. */
  index: number;
  /** sort: id -> category the student chose. */
  placed: Record<string, string>;
  correct: number;
  attempted: number;
  streak: number;
  best: number;
  /** explore/assemble: which part is selected or built. */
  selected: string;
  built: string[];
  /** process/trace: position through the sequence. */
  progress: number;
  playing: boolean;
  /** investigate: recorded (x, y) samples. */
  samples: { x: number; y: number }[];
  /** compare: whether the B configuration is shown. */
  showB: boolean;
  lastRight: boolean;
  flash: number;
  /**
   * How far the student has turned the specimen, in radians.
   *
   * A three-dimensional thing you cannot turn is a photograph of a
   * three-dimensional thing. Dragging the stage orbits the specimen, and the
   * moment a student does it the object stops being a picture: the far side of
   * a cell, the back of a cart, the shape of a molecule seen down its own axis
   * are all things you can only learn by moving your head.
   */
  orbitYaw: number;
  orbitPitch: number;
  /** Whether the student has turned it, which stops the idle rotation. */
  orbited: boolean;
  /** Pointer position when the current drag started, in stage pixels. */
  dragFrom: { x: number; y: number } | null;
}

export function initState(spec: ArchetypeSpec): ArchetypeState {
  return {
    t: 0, index: 0, placed: {}, correct: 0, attempted: 0, streak: 0, best: 0,
    selected: spec.specimens?.[0]?.parts?.[0]?.id ?? "",
    built: [], progress: 0, playing: spec.kind === "process" || spec.kind === "trace",
    samples: [], showB: false, lastRight: false, flash: 0,
    orbitYaw: 0, orbitPitch: 0, orbited: false, dragFrom: null,
  };
}

/* ------------------------------------------------------------------ *
 * Derived facts — what tests and readouts read
 * ------------------------------------------------------------------ */

export function facts(
  spec: ArchetypeSpec, s: ArchetypeState, params: ParamValues,
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {
    attempted: s.attempted,
    correct: s.correct,
    accuracy: s.attempted ? s.correct / s.attempted : 0,
    streak: s.streak,
    best: s.best,
    progress: s.progress,
    samples: s.samples.length,
  };
  if (spec.kind === "explore" || spec.kind === "assemble") {
    out.selected = s.selected;
    out.builtCount = s.built.length;
    out.complete = s.built.length >= (spec.specimens?.[0]?.parts?.length ?? 0);
  }
  if (spec.kind === "process" && spec.stages?.length) {
    const i = Math.min(spec.stages.length - 1, Math.floor(s.progress * spec.stages.length));
    out.stage = spec.stages[i].name;
    out.stageIndex = i;
  }
  if (spec.measure && spec.variables) {
    const v: Record<string, number> = {};
    for (const varr of spec.variables) v[varr.key] = Number(params[varr.key] ?? varr.default);
    for (const [k, val] of Object.entries(spec.measure(v))) out[k] = val;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Params derived from the spec
 * ------------------------------------------------------------------ */

export function paramsOf(spec: ArchetypeSpec): SimManifest["params"] {
  const p: SimManifest["params"] = {};
  for (const v of spec.variables ?? []) {
    p[v.key] = {
      type: "number", label: v.label, kind: "count",
      ...(v.unit ? { unit: v.unit } : {}),
      min: v.min, max: v.max, step: v.step, default: v.default,
      ...(v.bands ? { bands: v.bands } : {}),
    };
  }
  if (spec.kind === "compare") {
    p.showB = { type: "boolean", label: "Show the second setup", default: true };
  }
  if (spec.kind === "process" || spec.kind === "trace") {
    p.rate = {
      type: "number", label: "Speed", kind: "count",
      min: 0, max: 2, step: 0.1, default: 0.6,
    };
  }
  return p;
}

/** The archetype's own overlays, merged with any the spec adds. */
export function overlaysOf(spec: ArchetypeSpec): SimManifest["overlays"] {
  const base: SimManifest["overlays"] = [
    { key: "labels", label: "Labels", default: true },
  ];
  if (spec.kind === "investigate") {
    base.push({ key: "plot", label: "Graph", default: true });
  }
  if (spec.kind === "sort" || spec.kind === "assemble") {
    base.push({ key: "hints", label: "Hints", default: true, bands: ["K-2", "3-5", "6-8"] });
  }
  return base;
}

/** Every archetype id, used by the catalogue tests to assert coverage. */
export const ARCHETYPES: ArchetypeKind[] =
  ["sort", "explore", "investigate", "process", "assemble", "compare", "trace"];

/** Narrow a manifest built from a spec, for the registry. */
export type ArchetypeSim = AnySim & { spec: ArchetypeSpec };

export type ArchetypeRender = (
  rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec,
) => void;
