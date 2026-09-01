import type {
  AnySim, GradeBand, ParamValues, RenderContext, SimManifest, Subject,
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
  | { art: "body"; which: string }
  | { art: "landform"; which: string }
  | { art: "icon"; glyph: string };

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
}

export function initState(spec: ArchetypeSpec): ArchetypeState {
  return {
    t: 0, index: 0, placed: {}, correct: 0, attempted: 0, streak: 0, best: 0,
    selected: spec.specimens?.[0]?.parts?.[0]?.id ?? "",
    built: [], progress: 0, playing: spec.kind === "process" || spec.kind === "trace",
    samples: [], showB: false, lastRight: false, flash: 0,
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
