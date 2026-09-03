# The Rig Engine — Scene Engine Specification

**Status: definitive. Builder agents implement from this document without asking questions.**

This spec synthesises four independent designs and three judges' verdicts. The skeleton is
the *Rig Engine* design (all three judges ranked it first: the old failure is made
*unwritable at the type level*, not merely discouraged). Grafted into it, per the judges'
mandatory list: the predict-before-run gate, continuous-run mode with change markers,
confront-from-own-runs labs, fair-test facts, auto-recorded run rows, state-predicate
captions, and keyboard access (from *The Bench*); the NamedForce accumulator, the shared
light direction, deterministic slow-motion windows, offscreen-cached fixtures, the
floor-support assert, and the recorded-data-only chart (from *The Diorama*); hand-written
family exemplars as the acceptance suite, the scripted probe log, the generated API digest
as the builders' only reading, and the token circuit-breaker (from *The Experiment
Engine*). Every named fatal flaw is removed; the removals are called out inline as
**RULE** boxes.

Grounding: this spec was written against the actual seams —
`app/src/engine/{types,loop,useSim,archetype,archetypeSim}.ts`, `app/src/ui/Stage.tsx`,
`app/src/ui/{draw,scene,labware,charts,organic,anatomy,geo,fauna,waves,space,render3d,three3d}.ts`,
`app/src/sims/physics/pendulum.ts`, `app/src/sims/topics/{g8a1,g8a3,g8b2,g8b3}.ts`,
`app/scripts/{wire-topics,health}.mjs`, and `.workflows/REBUILD_BRIEF.md` (the seven-point
bar). File and symbol names below are real.

---

## 1. What a simulation IS

A simulation is a small experiment on a measured stage: a world frame in metres that
contains the *whole* apparatus — track and cart and rule and timer, stand and mass and the
ground it could fall to — as named actors whose positions and appearances are pure
functions of a physical state; that state is integrated live at 120 Hz by a real model (a
phase vector with derivatives, events for contact, breakage, saturation and settling — no
closed form ever positions anything); the student sets it up with their hands (drag the
mass up the stand, pull the cart back and let go, tap the switch, tip the reagent in),
commits to a prediction, releases it, and watches cause drawn on the objects — force
arrows from the model's own per-tick force accumulator, energy bars that trade as the run
proceeds, heat glow, particle flow — while the run takes real seconds and ends in a
visible outcome, including the failure state (the shell cracks, the spring yields, the
population crashes); every completed run is committed as a record that lands as the
student's own point or trace on an on-stage chart, so the relationship emerges from runs
laid side by side, with the old checked `measure()` surviving only as the answer key and
an off-by-default dashed overlay — the answer sheet, never the picture.

---

## 2. The TypeScript contract

### 2.1 File map (new code)

```
app/src/engine/rig/
  types.ts        — everything in §2.2. The single import a spec file needs.
  integrate.ts    — rk4 / semiImplicit / verlet, allocation-free (§2.3)
  step.ts         — the generic SimModel.step (§2.4)
  gestures.ts     — pointer + keyboard → handle writes (§4)
  runs.ts         — run lifecycle, RunRecord commit, decimation, facts (§5)
  layout.ts       — stage/dock split (§3.1)
  render.ts       — the frame pipeline (§3.2)
  cues.ts         — vector/energy/heat/flow/trail/ghost/badge drawing (§3.4)
  instruments.ts  — stopwatch/gauge/panel/photogate/thermometer/inset (§3.5)
  charts.ts       — the run chart, over @ui/charts (§5.3)
  build.ts        — buildExperiment(def) → SimManifest (§2.5)
  params.ts       — paramsOf / overlaysOf (moved from archetype.ts, adapted)
  autoLab.ts      — run-based labs & challenges (§5.5)
  lint.ts         — the two-tier lint (§7.4)
  keyboard.ts     — focus ring, arrow nudge, space release (§4.5)
  CHEATSHEET.md   — GENERATED digest; the only engine document a builder reads

app/src/engine/models/   — shared physics kits (§3.6)
app/src/ui/actors/       — actor & backdrop registry wrapping the surviving kits (§3.3)
app/src/sims/rigs/       — prebuilt scene+handles bundles (§3.7)
app/src/sims/experiments/<topic>/<slug>.ts  — ONE FILE PER EXPERIMENT (§7.1)
```

### 2.2 `app/src/engine/rig/types.ts` — complete

This file compiles against the existing `app/src/engine/types.ts` and
`app/src/engine/units.ts` untouched except for the additive seam changes in §2.6.

```ts
import type {
  ChallengeDefinition, GradeBand, LabDefinition, ParamValues,
  SimContext, SimInput, SimManifest, Subject,
} from "../types";
import type { UnitKind } from "../units";

/* ================================================================== *
 * Vocabulary
 * ================================================================== */

/** A point or vector in world metres, y up. */
export interface Vec2 { x: number; y: number }

/** Axis-aligned world rectangle in metres, y up. */
export interface WorldRect { x0: number; y0: number; x1: number; y1: number }

/**
 * Semantic quantity tokens. They key `theme.sci` for colour and the
 * `ExperimentDef.scales` table for pixels-per-unit, so two cues of the same
 * token in one scene are always comparable by eye.
 */
export type SciToken =
  | "velocity" | "acceleration" | "force" | "momentum"
  | "energy-kinetic" | "energy-potential" | "energy-thermal" | "energy-total"
  | "hot" | "cold" | "field" | "current" | "light" | "wave" | "flow" | "mass";

/** Where an instrument card docks on the stage. */
export type Dock = "tl" | "tr" | "bl" | "br";

/** The run lifecycle. `setup → running → settled`; "Again" returns to setup. */
export type Phase = "setup" | "running" | "settled";

/* ================================================================== *
 * Engine-owned state — every experiment's state extends this
 * ================================================================== */

export interface TracePoint { t: number; v: Record<string, number> }

/** A change the student made while a continuous system ran ("light 40→80% at 62 s"). */
export interface RunMarker { t: number; label: string }

/**
 * One committed run. Pushed by the engine when the model settles (trial mode)
 * or when the student stamps a reading (continuous mode). Survives "Again";
 * cleared only by "Clear runs" / SimRunner.reset().
 */
export interface RunRecord {
  n: number;
  /**
   * Initial conditions of THIS run: params PLUS every hand-set value read
   * from state (the height the drag left it at, the position the cart was
   * released from). RULE (lint-enforced, see §7.4): `RunSpec.setup` must read
   * hand-set keys from state, never echo the slider — the chart must show
   * what the hand did, not what the dial says.
   */
  setup: Record<string, number>;
  /** Readouts at settle plus tracked peaks. */
  result: Record<string, number>;
  /** Decimated to ≤ 240 points (every k-th sample + every event sample). */
  trace: TracePoint[];
  /** World-space paths of ghost-cued actors, decimated to ≤ 120 points each. */
  paths?: Record<string, Vec2[]>;
  /** Event ids fired during the run, in order. */
  events: string[];
  /** False when a `failure` event fired. Failed runs draw as crosses. */
  ok: boolean;
  /** "settled" | "timeout" | the id of the event that ended it. */
  endedBy: string;
}

/**
 * A force the model actually applied this tick, in Newtons, world axes.
 *
 * RULE (Diorama graft, judges' #9): this accumulator is the ONLY source a
 * force-token vector cue may draw from. Because the model kits derive both
 * `derivs` and `forces` from one force-sum closure, the arrow on screen and
 * the acceleration in the integrator cannot disagree: a cart accelerating
 * right can never show a net arrow pointing left.
 */
export interface NamedForce {
  id: string;                     // "friction", "rail", "weight", "normal"
  label: string;                  // "Friction from the floor"
  actor: string;                  // ActorDef.id it acts on
  fx: number; fy: number;         // Newtons
  /** Application point: actor anchor keyword or explicit world point. */
  at?: "center" | "contact" | "top" | Vec2;
  token: SciToken;                // almost always "force"
}

/** Live pointer-drag bookkeeping (engine-owned; specs never touch it). */
export interface DragState {
  handle: number;                 // index into ExperimentDef.handles
  pointer: number;                // pointer id
  x: number; y: number;           // last world position, metres
  vx: number; vy: number;         // smoothed world velocity, m/s (for fling)
  at: number;                     // ctx.time at last move
}

/**
 * The engine-owned half of every experiment's state. `RigModel.init` returns
 * only the experiment's own fields; `buildExperiment` merges in `rigBase()`.
 * All of it is plain data (numbers, strings, arrays, plain objects, and
 * Float64Array for particle fields) so cloning and fingerprinting stay cheap.
 */
export interface RigState {
  phase: Phase;
  /** Seconds since release. Frozen in setup/settled. The stopwatch reads this. */
  clock: number;
  failed: boolean;
  /** Event ids fired this run, in order. */
  events: string[];
  /** The caption of the most recent captioned event, or null. */
  caption: string | null;
  /** Max-over-run of the readout keys named in `RigModel.peaks`. */
  peaks: Record<string, number>;
  /** This run's samples, written by the engine every `runs.sampleEvery` sim-s. */
  trace: TracePoint[];
  /** World paths of trail/ghost-cued actors, sampled with `trace`. */
  paths: Record<string, { t: number; x: number; y: number }[]>;
  /** Committed runs. FIFO capped at `runs.keep`. */
  runs: RunRecord[];
  /** Continuous mode: one marker per mid-run control change. */
  markers: RunMarker[];
  /** This tick's force accumulator; rebuilt by the engine from RigModel.forces. */
  forces: NamedForce[];
  /** Photogate readings, keyed by instrument id. Written by the engine. */
  gates: Record<string, { t: number; value: number } | null>;
  drag: DragState | null;
  /** World position of a carried actor while a carry gesture is live. */
  carry: Vec2 | null;
  /** Keyboard focus: index into handles, or -1. */
  focusHandle: number;
  /** Handle ids the student has used once (fades the hint ring). */
  hintUsed: Record<string, boolean>;
  /** Predict-before-run gate: true once the lab prediction was committed. */
  predicted: boolean;
  /** True while a guided lab is active (the gate is only enforced then). */
  labGate: boolean;
  /** Transient banner text ("Commit to a prediction first"). */
  notice: { text: string; until: number } | null;
  /**
   * Deterministic slow motion: while clock < slowmoUntil the step integrates
   * dt × SLOWMO (0.12). Set by events (`RigEvent.slowmo`), lives in state, so
   * replay reproduces it exactly. A "slow motion" badge shows while active.
   */
  slowmoUntil: number;
}

/* ================================================================== *
 * The model — a phase vector, derivatives, events, settle
 * ================================================================== */

/**
 * The continuous part of the model. `phase` names the state fields that form
 * the integration vector, in order: ["x","v"], ["T","melt"], ["N","P"],
 * ["x","y","vx","vy"]. The engine packs them into a Float64Array, integrates,
 * and unpacks — the spec never writes an integrator.
 */
export interface Ode<S> {
  phase: readonly (keyof S & string)[];
  /**
   * dy/dt. Read `y`, write `dy`. `s` carries the non-phase state (mode flags,
   * contact state). MUST NOT allocate. `t` is the run clock.
   * NOTE the signature: derivs is called with trial states inside RK4; it
   * must not mutate `s`. Side effects belong in `update` and events.
   */
  derivs(y: Float64Array, dy: Float64Array, s: S, p: ParamValues, t: number): void;
  /** rk4 default. semiImplicit for contact-stiff models. verlet for orbits. */
  method?: "rk4" | "semiImplicit" | "verlet";
  /** Substeps per 120 Hz tick; 4 for contact-stiff models. Default 1. */
  substeps?: number;
}

/**
 * A discrete happening. Checked after every substep with the state before and
 * after it, so sign changes are caught exactly. Events are the failure states
 * the bar demands (item 6) and the caption source (moments): a caption bound
 * to a state predicate can never describe an event the picture does not show.
 */
export interface RigEvent<S> {
  id: string;
  when(s: S, prev: S, p: ParamValues): boolean;
  /** Mutate the state: reflect a velocity, set `broken`, switch mode. Optional —
   *  an event with only a caption is a pure "moment". */
  then?(s: S, p: ParamValues, ctx: SimContext): void;
  /** Drawn in the caption strip when the event fires. */
  caption?: string | ((s: S, p: ParamValues) => string);
  once?: boolean;
  /** Marks the run failed; the banner names it; the chart draws a cross. */
  failure?: boolean;
  /** Seconds of 0.12× deterministic slow motion starting at this event. */
  slowmo?: number;
}

/** One live readout row; mapped to the platform Readout via q() in build.ts. */
export interface RigReadout {
  key: string;
  label: string;
  value: number;
  kind: UnitKind;
  unit?: string;
  semantic?: SciToken | string;
  graphable?: boolean;
  bands?: GradeBand[];
}

export interface RigModel<S extends RigState> {
  /**
   * The experiment's own initial fields (the engine merges rigBase()).
   * Called on load, on "Again" (runs preserved by the engine) and on a
   * restart-defining param change. Use ctx.rng for any randomness.
   */
  init(p: ParamValues, ctx: SimContext): Omit<S, keyof RigState>;
  /** Continuous dynamics. Optional when `update` does all the work. */
  ode?: Ode<S>;
  /**
   * Non-ODE dynamics, run once per substep after integration: a generation of
   * selection, a Kirchhoff solve, a particle sweep, flow-phase accumulation.
   */
  update?(s: S, dt: number, p: ParamValues, ctx: SimContext): void;
  /**
   * The per-tick force accumulator (see NamedForce). Called once per tick
   * after integration; result stored on s.forces. Required when any vector
   * cue carries token "force" (lint).
   */
  forces?(s: S, p: ParamValues): NamedForce[];
  events?: RigEvent<S>[];
  /**
   * The run is over (trial mode): the cart stopped, the ball rests, T within
   * 0.2 K of equilibrium for 2 s. Required when runs.mode is "trial".
   */
  settled?(s: S, p: ParamValues): boolean;
  /**
   * What a held apparatus shows while the hand arranges it in setup: spring
   * tension on the meter as the cart is pulled back, m·g·dh accumulating as
   * the mass is lifted. Called every tick during setup. Mutates s.
   */
  quasiStatic?(s: S, p: ParamValues): void;
  readouts(s: S, p: ParamValues): RigReadout[];
  /** Readout keys tracked as max-over-run into s.peaks. */
  peaks?: readonly string[];
  /** Params that define a different experiment → re-init on change (runs kept).
   *  Everything else applies live — pendulum's rule: mass mid-swing changes
   *  nothing, and that is the lesson. */
  restartOn?: readonly string[];
  /**
   * THE OLD `measure()`, carried over verbatim: the answer key. Drives the
   * golden test, the prediction reveal, and the dashed "model" overlay
   * (off by default). NEVER positions anything on stage — nothing in the
   * scene types can call it (charts/cues take no such function).
   */
  predicted?(p: ParamValues, s: S): Record<string, number>;
  /** Golden-test tolerance vs `predicted`, fraction. Default 0.03. */
  tolerance?: number;
  /**
   * Energy bookkeeping for the audit test and the energyBars cue:
   * |Σ parts − total| must stay ≤ 1% of total through the probe run.
   */
  energy?(s: S, p: ParamValues): { total: number; parts: { label: string; value: number; token: SciToken }[] };
  /**
   * Fields hashed for determinism fingerprints. Defaults to the phase vector
   * + [phase, clock, events, runs.length]. Declare explicitly when state
   * carries big Float64Arrays (particle fields) so fingerprinting stays fast.
   */
  fingerprintKeys?: readonly (keyof S & string)[];
}

/* ================================================================== *
 * The scene — a metric world of actors, instruments, cues, charts
 * ================================================================== */

export type Setting =
  | "bench" | "outdoor" | "road" | "field" | "space" | "micro" | "water" | "section";

/**
 * Every drawable thing the registry knows. Names map 1:1 onto entries in
 * app/src/ui/actors/ (§3.3), which wrap the surviving 2D kits and draw3D.
 */
export type ActorKind =
  // mechanics
  | "track" | "cart" | "ball" | "block" | "spring" | "stand" | "hangingMass"
  | "massHanger" | "pulley" | "rope" | "incline" | "floor" | "wall" | "bumper"
  | "nail" | "foamPad" | "endStop" | "electromagnetClamp"
  // vehicles & people
  | "vehicle" | "figure" | "lampPost" | "platform" | "handrail" | "roadway"
  // lab bench
  | "vessel" | "burner" | "thermometer" | "syringe" | "balance" | "switch"
  | "bulb" | "battery" | "wire" | "resistor" | "meter" | "magnet" | "lens"
  | "prism" | "opticalBench" | "particles" | "burette" | "condenser" | "funnel"
  // bio / earth / space / waves
  | "cell" | "membrane" | "organ" | "bodyVessel" | "neuron" | "creature"
  | "plant" | "habitat" | "populationPatch" | "strata" | "plateSection"
  | "volcano" | "terrain" | "rock" | "planet" | "moon" | "star" | "orbitPath"
  | "medium" | "ray" | "wavefronts"
  // escape hatch: a bespoke drawer registered by this experiment's family
  | `custom:${string}`;

export interface Placement {
  x: number; y: number;           // metres
  angle?: number;                 // radians, CCW
  /** Painter's-order tiebreak within a layer; lower draws first. */
  z?: number;
}

/** Per-frame appearance derived from state. All optional, all data. */
export interface ActorProps {
  lengthM?: number; radiusM?: number; heightM?: number;
  color?: string;                 // a theme.sci token name or a hex from theme
  level?: number;                 // 0-1 liquid fill
  squash?: number;                // 1 = none; 0.7 = flattened jacket
  broken?: boolean;               // crack, shards, dented block
  pose?: "stand" | "run";         // figures; gait phase comes from `phase`
  phase?: number;                 // wheel turn / gait / wave phase — FROM STATE
  count?: number;                 // bubbles, slabs on a massHanger, population
  open?: number;                  // 0-1 switch/valve/door
  reading?: number;               // meters that live on apparatus
  text?: string;                  // stencil ("1.2 kg"), species name
  temperature?: number;           // drives tint via the heat cue's range
}

export type HitShape =
  | { kind: "circle"; x: number; y: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "capsule"; a: Vec2; b: Vec2; r: number };

/**
 * An actor: a drawable bound to state.
 *
 * RULE (the central fatal-flaw fix): `at` and `props` receive (s, p) ONLY.
 * There is no time parameter anywhere in a binding signature, so the old
 * sawtooth — position as a closed function of wall time — is unwritable, not
 * merely discouraged. Motorised and orbital motion is a velocity in the state,
 * integrated by the stepper. Ambient flourish (flame flicker, water sparkle)
 * lives inside engine drawers, may read render time, and may never move a
 * position. The lint additionally greps experiment files for `rc.time`,
 * `Date.`, `Math.random`, `performance.` and rejects on sight.
 */
export interface ActorDef<S extends RigState> {
  id: string;
  kind: ActorKind;
  at(s: S, p: ParamValues): Placement;
  props?(s: S, p: ParamValues): ActorProps;
  /** World-space grab/collision shape; default derived from the kind's extent. */
  hit?(s: S, p: ParamValues): HitShape;
  layer?: "back" | "rig" | "front";
  /**
   * Floor-support assert (Diorama graft, judges' #8/#19): in dev and in the
   * lint, an actor whose foot sits below `scene.ground`, or that hangs
   * unsupported without this flag, fails the frame. The founder's floating
   * purple box becomes a build error.
   */
  flying?: boolean;
  label?: string | ((s: S, p: ParamValues) => string);
}

/* ---- Instruments -------------------------------------------------- */

/**
 * On-stage instruments that read state. Every experiment must have at least
 * one (bar item 1: the timer/ruler is part of the apparatus).
 * The DOM instrument toolbox (ui/Instruments.tsx) stays as a free layer above.
 */
export type InstrumentDef<S extends RigState> =
  | { kind: "stopwatch"; id: string; at: Dock }                    // reads s.clock
  | { kind: "panel"; id: string; at: Dock | Vec2; label: string; unit?: string;
      read(s: S, p: ParamValues): number; digits?: number }
  | { kind: "gauge"; id: string; at: Dock | Vec2; label: string; unit?: string;
      read(s: S, p: ParamValues): number; max(p: ParamValues): number;
      redline?: { value: number; label: string }; peakHold?: boolean }
  | { kind: "thermometer"; id: string; at: Vec2; read(s: S, p: ParamValues): number;
      range: [number, number] }
  | { kind: "forceMeter"; id: string; at: Vec2; read(s: S, p: ParamValues): number;
      maxN: number }
  | { kind: "photogate";
      /** Engine-driven: watches `watch` crossing world x; writes s.gates[id]. */
      id: string; x: number; watch: string; lengthM: number;
      records: "speed" | "time" }
  | { kind: "inset";
      /** A magnifier camera for sub-scale moments (the 3 cm crush under a 2 m
       *  drop). Circular window, drawn via organic.magnifier. */
      id: string; at: Dock; window(s: S, p: ParamValues): WorldRect;
      active?(s: S, p: ParamValues): boolean }
  | { kind: "counter"; id: string; at: Dock; label: string;
      read(s: S, p: ParamValues): number };

/* ---- Cues: cause drawn on the objects ----------------------------- */

export interface EnergyPartSpec { label: string; value: number; token: SciToken }

export type Cue<S extends RigState> =
  | { kind: "vector"; token: SciToken;
      /** token "force": REQUIRED — the NamedForce id to draw; `value` is
       *  forbidden (lint). Other tokens: `actor` + `value(s,p)` in real units. */
      force?: string; actor?: string;
      value?(s: S, p: ParamValues): Vec2;
      anchor?: "center" | "contact" | "top" | ((s: S) => Vec2);
      label?(magnitude: number): string;
      overlay?: string; bands?: GradeBand[] }
  | { kind: "noForce";
      /** A dashed hollow outline + label ("no horizontal force on you") while
       *  `when` holds. The First Law taught by a drawn absence. */
      actor: string; when(s: S, p: ParamValues): boolean; label: string;
      bands?: GradeBand[] }
  | { kind: "energyBars"; at: Dock | Vec2;
      /** "model" reads RigModel.energy (preferred: one bookkeeping source);
       *  or an explicit parts function. Total fixes the bar length so the
       *  visible gap IS the dissipation. */
      parts: "model" | ((s: S, p: ParamValues) => EnergyPartSpec[]);
      total?(s: S, p: ParamValues): number; overlay?: string }
  | { kind: "heat"; actor: string; value(s: S, p: ParamValues): number;
      range: [number, number] }
  | { kind: "flow";
      /** dashFlow/particle flow along a path. `phaseKey` names a state field
       *  the MODEL advances (s[phaseKey] += rate·dt in update) — flow speed is
       *  the model's own integral, never wall time. */
      path(s: S, p: ParamValues): Vec2[]; phaseKey: keyof S & string;
      token: SciToken; overlay?: string }
  | { kind: "trail"; actor: string; seconds: number; token?: SciToken }
  | { kind: "ghost";
      /** Previous runs' paths for this actor, faded — drawn from
       *  RunRecord.paths (positions the model actually visited). */
      actor: string; alpha?: number }
  | { kind: "badge"; actor: string; text(s: S, p: ParamValues): string;
      token?: SciToken }
  | { kind: "bracket";
      /** A labelled span ("stored between the mass and the Earth"). */
      from(s: S, p: ParamValues): Vec2; to(s: S, p: ParamValues): Vec2;
      label: string; overlay?: string }
  | { kind: "handleHint"; actor: string };  // pulsing ring until first use

/* ---- Charts: the student's own data, nothing else ----------------- */

/**
 * RULE (Diorama graft, structural): this type carries NO function slots. The
 * chart drawer reads ONLY s.trace and s.runs — there is no API through which
 * a formula can be plotted. The dashed prediction curve is drawn by the
 * ENGINE from RigModel.predicted, gated behind the "model" overlay, default
 * OFF, and only after `minRunsForModel` runs exist.
 */
export interface ChartDef {
  title: string;
  /** "t", or a key present in RunRecord.setup / trace samples. */
  x: "t" | { key: string; label: string; unit?: string; min?: number; max?: number };
  y: { key: string; label: string; unit?: string; min?: number; max?: number };
  /** trace: one line per run over time. runs: one point per committed run. */
  mode: "trace" | "runs";
  /** Least-squares fit through ok runs (runs mode; bands 6-8, 9-12). */
  fit?: boolean;
  /** A drawn limit line: the 53 g shell limit, the elastic limit, K. */
  threshold?: { y: number; label: string };
  /** Failed runs as crosses in theme.sci.force. Default true in runs mode. */
  markFailed?: boolean;
  /** Colour runs into series by this setup key ("mass", "crushCm"). */
  seriesBy?: string;
  /** Runs before the dashed model overlay may appear. Default 3. */
  minRunsForModel?: number;
}

export interface SceneDef<S extends RigState> {
  setting: Setting;
  /**
   * The world rectangle the camera must contain. May grow with state (a drop
   * tower zooms out as the package is dragged higher) — but only with STATE:
   * the signature has no time.
   */
  extent(s: S, p: ParamValues): WorldRect;
  /** World y of the ground plane. Required for bench/outdoor/road/field;
   *  actors stand on it (floor-support assert). */
  ground?: number;
  actors: ActorDef<S>[];
  instruments: InstrumentDef<S>[];
  cues: Cue<S>[];
  charts: ChartDef[];
}

/* ================================================================== *
 * Gestures — what the hand does (§4 has semantics)
 * ================================================================== */

export type Handle<S extends RigState> =
  | { gesture: "slide"; actor: string;
      axis: "x" | "y" | { path(s: S): [Vec2, Vec2] };
      range: [number, number]; snap?: number;
      /** Write the constrained scalar into state: s.h = u; s.x0 = u. */
      write(s: S, u: number, p: ParamValues): void;
      while?: Phase[];                 // default ["setup"]
      releaseStarts?: boolean;         // pointerup → startRun (gated, §4.4)
      /** Push-and-let-go: initial velocity from the smoothed pointer velocity. */
      fling?(s: S, vx: number, vy: number): void }
  | { gesture: "swing"; actor: string; pivot(s: S): Vec2;
      range: [number, number];
      write(s: S, angle: number, p: ParamValues): void;
      while?: Phase[]; releaseStarts?: boolean }
  | { gesture: "tap"; actor: string;
      toggle(s: S, p: ParamValues, ctx: SimContext): void;
      while?: Phase[]; startsRun?: boolean }
  | { gesture: "carry"; actor: string;
      targets: { actor: string; onDrop(s: S, p: ParamValues): void }[];
      snapBack?: boolean; while?: Phase[] }
  | { gesture: "tilt"; actor: string; range: [number, number];
      /** Pour: angle → the model's flow rate (integrated in update). */
      write(s: S, angle: number, p: ParamValues): void; while?: Phase[] };

/** Buttons the shell renders in the stage foot (via SimManifest.actions). */
export interface ActionDef<S extends RigState> {
  key: string;
  label: string | ((s: S, p: ParamValues) => string);
  when?(s: S, p: ParamValues): boolean;
  run(s: S, p: ParamValues, ctx: SimContext): void;
  /** The space-bar action; exactly one per experiment. */
  primary?: boolean;
}

/* ================================================================== *
 * Runs
 * ================================================================== */

export interface RunSpec<S extends RigState> {
  /**
   * trial: setup → release → settle → commit (default).
   * continuous: systems that never settle (ecosystems, heating, gas). The
   * phase stays "running" from load; control changes drop RunMarkers on the
   * trace; the student stamps readings with the "record" action.
   */
  mode?: "trial" | "continuous";
  /**
   * Initial conditions worth recording with the run. MUST read hand-set
   * values from state (lint §7.4 calls this with two states differing only
   * in hand-set fields and requires different outputs).
   * Example: (s) => ({ h: s.h, mass: s.massKg }).
   */
  setup(s: S, p: ParamValues): Record<string, number>;
  /** Trace sampling interval, sim seconds. Default 1/30. */
  sampleEvery?: number;
  /** Runs kept on the chart (FIFO). Default 8. */
  keep?: number;
  /** Series colouring key, mirrored to charts lacking seriesBy. */
  seriesBy?: string;
  /**
   * Fair-test keys: the variables a lab permits to change between runs.
   * facts.fair is true iff all committed runs share identical setup except
   * these keys. Default: [the x key of the first runs-mode chart].
   */
  fairKeys?: readonly string[];
  /** Hard cap on a run, sim seconds. Default 30. */
  maxSeconds?: number;
}

/* ================================================================== *
 * The probe — a scripted rehearsal shipped with every experiment
 * ================================================================== */

/**
 * (Experiment Engine graft, judges' #15/#23.) A short input script in WORLD
 * COORDINATES (the log unit — see §4.2) that exercises the primary gesture.
 * CI replays it headless through SimRunner and requires: at least one actor
 * moved, and at least one RunRecord committed (trial) or one marker + one
 * stamped reading (continuous). It also drives the golden test and the
 * mid-run screenshot.
 */
export interface ProbeStep { at: number /* sim seconds */; input: SimInput }

/* ================================================================== *
 * The experiment definition
 * ================================================================== */

/** Content carried over from the 521 specs — the checked science's home. */
export interface ExperimentContent {
  id: string;
  title: string;
  tagline: string;
  subject: Subject;
  bands: GradeBand[];
  grades: number[];
  standards: { ngss?: string[]; ccssMath?: string[] };
  learningGoals: string[];
  misconceptions?: string[];
  labs?: LabDefinition[];
  challenges?: ChallengeDefinition[];
}

/** Param declaration, unchanged in meaning from archetype Variable. */
export interface ControlDef {
  key: string; label: string; unit?: string; kind?: UnitKind;
  min: number; max: number; step: number; default: number;
  bands?: GradeBand[]; help?: string;
  marks?: { value: number; label: string }[];
  /** Applies mid-run without restart (continuous mode's changeable inputs). */
  live?: boolean;
}

/**
 * Which lint tier this experiment is held to (§7.4).
 * "experiment" (default): full bar — integrated model, failure event, runs.
 * "taxonomy": sort/explore/assemble trays. Still NO static specimens: every
 * tray cell carries its own live mini-model, state-driven poses, a readable
 * instrument/badge, and a real carry gesture — the lint runs PER CELL. The
 * tier only waives the mandatory ODE and failure event.
 */
export type LintTier = "experiment" | "taxonomy";

export interface ExperimentDef<S extends RigState = RigState> extends ExperimentContent {
  tier?: LintTier;
  controls: ControlDef[];
  model: RigModel<S>;
  scene: SceneDef<S>;
  handles: Handle<S>[];
  actions?: ActionDef<S>[];
  runs: RunSpec<S>;
  /**
   * Pixels per unit, one per token per experiment, so all cues of one
   * quantity share a scale. Defaults: velocity 24 px/(m/s), force 2 px/N,
   * acceleration 12 px/(m/s²). Oversize arrows cap at 40% of stage width
   * with a "//" break glyph — never silently rescaled (§3.4).
   */
  scales?: Partial<Record<SciToken, number>>;
  layout?: "rig+charts" | "wide" | "split" | "tray";
  /** Sim seconds per real second (0.35 for a drop; 20 for a heating curve). */
  timeScale?: number;
  tickRate?: number;
  probe: ProbeStep[];
  /** Screen-reader line; default generated from phase + headline readouts. */
  aria?(s: S, p: ParamValues): string;
}
```

### 2.3 `app/src/engine/rig/integrate.ts` — signatures

```ts
export interface Scratch { k1: Float64Array; k2: Float64Array; k3: Float64Array;
                           k4: Float64Array; tmp: Float64Array }
export function scratchFor(n: number): Scratch;

/** Classic RK4, allocation-free; f fills dy from y. */
export function rk4(y: Float64Array, h: number,
  f: (y: Float64Array, dy: Float64Array) => void, sc: Scratch): void;

/** Symplectic Euler for contact-stiff pairs (x_i, v_i by convention). */
export function semiImplicit(y: Float64Array, h: number,
  f: (y: Float64Array, dy: Float64Array) => void, sc: Scratch): void;

/** Velocity Verlet for orbits (x…, v… halves by convention). */
export function verlet(y: Float64Array, h: number,
  f: (y: Float64Array, dy: Float64Array) => void, sc: Scratch): void;
```

Contact policy (risk fix, agreed by all judges): **contact is events and impulses**
(restitution reflection, constant-force crush), never penalty springs. The `contact`
model kit defaults to `semiImplicit` + `substeps: 4`. The generated energy audit
(±1 %) fails a leaking integrator in CI.

### 2.4 `app/src/engine/rig/step.ts` — the generic step

The one `SimModel.step` all 521 share. Order within a tick (pseudocode of the real
implementation; specs never see this):

```ts
export const SLOWMO = 0.12;

step(state, dt, params, ctx, inputs):
  s = cloneRig(state)                        // shallow + copied arrays; typed arrays sliced
  for input of inputs: handleInput(def, s, input, params, ctx)   // §4 — pure, logged
  if s.notice && ctx.time > s.notice.until: s.notice = null
  if s.phase !== "running":
    def.model.quasiStatic?.(s, params)       // the picture answers the hand
    s.forces = def.model.forces?.(s, params) ?? []   // held tension is drawn too
    return s
  eff = (s.clock < s.slowmoUntil ? dt * SLOWMO : dt)             // deterministic slow-mo
  sub = def.model.ode?.substeps ?? 1; h = eff / sub
  for i in 0..sub:
    prev = snapshot(s)                       // phase vars + flags, reused buffer
    if def.model.ode: pack → (rk4|semiImplicit|verlet) → unpack
    def.model.update?.(s, h, params, ctx)
    s.clock += h
    for ev of def.model.events ?? []:
      if ev.once && s.events.includes(ev.id): continue
      if ev.when(s, prev, params):
        ev.then?.(s, params, ctx)
        s.events.push(ev.id)
        if ev.caption: s.caption = resolve(ev.caption, s, params)
        if ev.failure: s.failed = true
        if ev.slowmo: s.slowmoUntil = s.clock + ev.slowmo
  s.forces = def.model.forces?.(s, params) ?? []
  trackPeaks(def, s, params)                 // s.peaks[k] = max(s.peaks[k], readout k)
  sampleTraceAndPaths(def, s, params)        // every runs.sampleEvery sim-s — deterministic
  checkGates(def, s, prev)                   // photogate crossings → s.gates
  if trialMode && (def.model.settled!(s, params) || s.clock >= maxSeconds):
    commitRun(def, s, params)                // §5.1 — phase = "settled"
  return s
```

`applyParams` (built by `build.ts`): if a `restartOn` key changed and phase ≠ running →
re-init keeping `runs`; if a non-`live` key changed while running (continuous mode) →
apply + push `RunMarker { t: clock, label }`; if a `live` key changed → apply silently.

### 2.5 `app/src/engine/rig/build.ts` — the factory

```ts
import type { AnySim, SimManifest, SimModel } from "../types";
import type { ExperimentDef, RigState } from "./types";

/**
 * Turn an ExperimentDef into the same SimManifest the shell already runs.
 * Throws (dev/test) if lintExperiment fails — a broken spec never loads.
 */
export function buildExperiment<S extends RigState>(def: ExperimentDef<S>): SimManifest<S> {
  lintExperiment(def);
  const view = makeViewRef(def);             // camera cache written by render (§4.2)
  const model: SimModel<S> = {
    init: (p, ctx) => ({ ...rigBase(), ...def.model.init(p, ctx) } as S),
    step: makeStep(def),
    applyParams: makeApplyParams(def),
    readouts: (s, p) => def.model.readouts(s, p).map(toReadout),   // q(value, kind)
    facts: (s, p) => rigFacts(def, s, p),    // §5.4
    events: makeRowEvents(def),              // committed run → data-table row (§5.4)
    fingerprint: makeFingerprint(def),       // hashes fingerprintKeys, not particle fields
  };
  return {
    id: def.id, title: def.title, tagline: def.tagline, subject: def.subject,
    bands: def.bands, grades: def.grades, standards: def.standards,
    learningGoals: def.learningGoals,
    ...(def.misconceptions ? { misconceptions: def.misconceptions } : {}),
    params: paramsOf(def.controls), overlays: overlaysOf(def),
    model, render: makeRender(def, view),
    actions: actionsOf(def),                 // NEW manifest field (§2.6)
    pointerToWorld: (x, y, w, h) => view.toWorld(x, y, w, h),   // NEW (§4.2)
    engine: "rig",                           // NEW — migration burndown reads it
    timeScale: def.timeScale, tickRate: def.tickRate,
    labs: def.labs ?? nonNull([autoLab(def)]),
    challenges: def.challenges ?? nonNull([autoChallenge(def)]),
  };
}
```

### 2.6 Seam changes to existing files — the complete, exhaustive list

Additive only; every existing manifest keeps compiling. **Nothing else in the shell may
be touched by any agent.** All six land in one engine PR *before* the first experiment
ships (the pointer-log change must precede any recorded input).

1. **`app/src/engine/types.ts`** (+~30 lines)
   ```ts
   /* on SimManifest */
   actions?: { key: string; label: string; primary?: boolean }[];
   /** Convert a CSS-pixel stage point to world coords for input logging. */
   pointerToWorld?: (x: number, y: number, width: number, height: number) => { x: number; y: number };
   engine?: "rig" | "archetype" | "hand";

   /* on SimModel */
   /** Emitted after ticks; the shell appends rows / shows notices. */
   events?(state: S, prev: S): SimEvent[];
   /** Cheap state hash for determinism tests; JSON path is the fallback. */
   fingerprint?(state: S): string;

   export type SimEvent =
     | { type: "row"; row: DataRow }
     | { type: "notice"; text: string };

   /* on LabValues (additive) */
   runs?: readonly { n: number; setup: Record<string, number>;
                     result: Record<string, number>; ok: boolean; endedBy: string }[];
   ```
2. **`app/src/ui/Stage.tsx`** (+~14 lines) — in `handlePointer`, before `onInput`:
   ```ts
   const p = manifest.pointerToWorld
     ? manifest.pointerToWorld(x, y, sizeRef.current.w, sizeRef.current.h)
     : { x, y };
   onInput({ type, x: p.x, y: p.y, id: e.pointerId });
   ```
   (This finally honours `PointerInput`'s existing doc comment — "world coordinates,
   already converted by the view".) Plus keyboard: `tabIndex={0}` on the canvas and
   `onKeyDown` forwarding `{ type: "action", action: "key:" + e.key }` for
   Tab/Arrow*/Space/Enter, `preventDefault` on those keys only.
3. **`app/src/engine/loop.ts`** (+3 lines) — `fingerprint()` uses
   `this.manifest.model.fingerprint?.(this.state)` when present, else the JSON path.
4. **`app/src/engine/useSim.ts`** (+~12 lines) — after `runner.advance(delta)` returns
   `ran`, drain `manifest.model.events?.(runner.getState(), runner.getPrevState())`:
   `"row"` events append to `data` (a committed run records itself — no hunting the
   Record button), `"notice"` events are ignored here (the stage draws notices).
5. **`app/src/pages/SimPlayer.tsx`** (+~20 lines, −6) — delete the
   `canLaunch = "target" in manifest.params` special case (line 193); render
   `manifest.actions` as stage-foot buttons dispatching
   `sim.push({ type: "action", action: a.key })` (play first). `projectile.ts` gets
   `actions: [{ key: "launch", label: "Launch", primary: true }]` to keep behaviour.
   Add the predict-gate wiring: push `{ action: "labActive" } / { action: "labInactive" }`
   on lab enter/exit and `{ action: "predicted" }` when `lab.progress.predictions`
   gains a key — logged ActionInputs, so teacher replay reproduces the gate.
6. **`app/src/ui/render3d.ts`** (+1 line) — `Draw3DOptions.animPhase?: number`;
   `entry.tick?.(opts.animPhase ?? t)` so wheels and flames follow the model, not the
   wall clock.

Untouched, by contract: `loop.ts`'s accumulator/input-log/replay, `useSim` semantics,
`Stage` DPR/resize, `Graph.tsx`, `Instruments.tsx`, `LabRunner.tsx`, registry mechanics,
curriculum, Formula Lab, Course Library, all 2D kits, `three3d.ts`.

---

## 3. Rendering

### 3.1 Layout — `layout.ts`

Reference stage 960 × 600 CSS px (all worked examples are specified at it).

```ts
export interface Rect { x: number; y: number; w: number; h: number }
export function layout(kind: "rig+charts" | "wide" | "split" | "tray",
                       width: number, height: number): { stage: Rect; docks: Rect[] };
```

`rig+charts` (default): below 720 px wide, the scene takes everything and charts fall
back to the React `Graph` panel; otherwise `dockW = clamp(width*0.35, 280, 360)`, scene
`{0,0,width−dockW−12,height}`, two chart docks stacked in the right column with 16 px
gutters. `split`: two half-stages sharing one dock column (compare). `tray`: a grid of
mini-stages plus bins (taxonomy tier). A 44 px HUD strip (top-left: phase pill, run
counter, sim clock, slow-mo badge) and a 34 px caption strip (bottom: gesture hint or the
active event caption) are reserved first so nothing can collide with them.

### 3.2 The frame pipeline — `render.ts`

One pass, every frame, in this order. Every actor draw is wrapped in `guarded()` from
`@ui/ctxGuard` so one unbalanced `save()` cannot blank the stage.

```
 1  layout(kind, width, height)
 2  ext = scene.extent(state, params); cam = camera({...ext, stage.w, stage.h, square:true})   // @ui/draw
 3  view.publish(def.id, cam, stage, width, height)     // pointerToWorld basis (§4.2)
 4  backdrop(setting, ...)          — offscreen-cached, keyed (w, h, themeKey, ground,
                                      shaping params). bench→labware.benchStage;
                                      outdoor/road/field→scene.sky+groundPlane (+lane
                                      dashes / habitat frame); space→scene.starfield;
                                      micro→organic.depthWash+bokeh; water→sky mood;
                                      section→geo backdrop. The ground line is drawn at
                                      cam.toScreenY(scene.ground).
 5  beginLabels(ctx)                — @ui/scene collision registry opens
 6  ghosts                         — previous runs' paths (RunRecord.paths), hexA(.., .3)
 7  actors                         — sort by layer(back<rig<front) then z, then draw:
                                      ACTORS[kind].draw(ctx, placed, cam, theme, rc.time,
                                      {allow3D}) — 3D budget: at most 4 draw3D composites
                                      per frame; past that or !can3D(), the 2D kit draws.
                                      draw3D lands at the actor's anchor IN z-order, so a
                                      3D cart sits on the 2D rail and 2D rule ticks stay
                                      crisp on top. Dev + lint: floor-support assert per
                                      actor (§2.2 ActorDef.flying).
 8  cues                           — §3.4, overlay- and band-gated
 9  instruments                    — §3.5 (photogate posts draw in pass 7 as actors of
                                      the rig; their cards here)
10  charts                         — §5.3 into the docks
11  caption strip                  — s.caption via scene.caption(); notices override
12  failure banner                 — if s.failed: named banner in theme.sci.force; the
                                      run point on the chart is a cross; result chip is
                                      pinned at the outcome's world position (badge())
13  HUD                            — phase pill, "Run 3", clock (sim s), "slow motion
                                      ×0.12" badge while clock < slowmoUntil, focus ring
14  vignette(ctx, w, h, dark ? 0.2 : 0.1)
```

**One light.** The 2D kits key their light up-left (`benchStage`, `sphere`, shadows
down-right); `three3d.ts`'s `studioLights` keys up-left at (−4.2, 3.1, 5.4). This is now a
contract: every new actor drawer keeps key-light up-left and contact shadows down-right so
2D/3D composites are seamless. `contactShadow` under every rig-layer actor by default.

**Scale honesty.** Actor pixel sizes are `metres × cam.scale` — the same scale that draws
`meterRule` ticks — so a 0.4 m cart on a 4 m track under a rule with 10 cm marks reads
true. Tiny true-scale moments (a 3 cm crush) get an `inset` instrument, never an inflated
egg.

### 3.3 The actor registry — `app/src/ui/actors/`

```ts
export interface PlacedActor<S> { a: ActorDef<S>; at: Placement; props: ActorProps }
export interface ActorDrawer {
  /** Real physical footprint at props defaults, metres — sizes and hit shapes. */
  extentM: { w: number; h: number };
  draw(ctx: CanvasRenderingContext2D, d: PlacedActor<any>, cam: Camera,
       theme: ThemeColors, time: number, opts: { allow3D: boolean }): void;
  /** Default world hit shape when ActorDef.hit is omitted. */
  hit?(d: PlacedActor<any>): HitShape;
}
export const ACTORS: Record<string, ActorDrawer>;
export function registerActor(kind: `custom:${string}`, drawer: ActorDrawer): void;
```

`time` is for **non-positional** ambience only (flame flicker, water sparkle, bubble
shimmer). Positions, wheel angles, gait phases come from `props.phase`, which the spec
computes from state (wheel turn = distance rolled / circumference; gait = distance walked
/ stride). Example (the pattern every drawer follows):

```ts
export const cartActor: ActorDrawer = {
  extentM: { w: 0.40, h: 0.16 },
  draw(ctx, d, cam, theme, _time, { allow3D }) {
    const x = cam.toScreenX(d.at.x), gy = cam.toScreenY(d.at.y);
    const w = (d.props.lengthM ?? 0.4) * cam.scale, h = w * 0.4;
    const wheel = d.props.phase ?? 0;                    // radians, from state
    if (allow3D && can3D() && draw3D(ctx, { kind: "apparatus", which: "cart" },
        x, gy - h * 0.55, w * 1.1, 0, theme,
        { spin: 0.68 + (d.at.angle ?? 0), tilt: 0.22, animPhase: wheel,
          themeKey: isDarkTheme(theme) ? "dark" : "light" })) return;
    cart(ctx, x, gy, w, h, d.props.color ?? theme.accent, wheel);   // @ui/labware
  },
  hit: (d) => ({ kind: "rect", x: d.at.x - 0.2, y: d.at.y, w: 0.4, h: 0.16 }),
};
```

What each kind wraps (all named exports verified in the kits):

| Kind(s) | Wraps |
|---|---|
| `track` | new rail composite: `scene.metal` extrusion + `labware.meterRule` beneath + `endStop` posts |
| `cart` | `labware.cart` / 3D `apparatus:"cart"`; wheels by `props.phase` |
| `ball`/`block` | `scene.sphere`+`contactShadow` / 3D sphere; `scene.metal`/`plastic`/`bevelRect` |
| `spring` | `labware.spring(x1,y1,x2,y2,coils,r)` between two state-bound anchors; coil count fixed so stretch is visible |
| `stand`/`massHanger` | `labware.clampStand`+`bossHead`; hanger draws `props.count` slotted 100 g slabs (mass legible as objects) |
| `hangingMass` | metal cylinder, radius ∝ ∛m, `props.text` stencil ("1.2 kg") |
| `pulley`/`rope`/`incline` | `labware.pulley` (drops from state), `labware.ropeStroke`, `labware.inclinePlane` |
| `nail`/`foamPad`/`endStop`/`electromagnetClamp`/`handrail`/`lampPost`/`platform`/`roadway` | new small composites (20–60 lines each) in `ui/actors/parts.ts`, built from `scene.bevelRect/metal/hatchFill` |
| `vehicle` | new (~120 lines): bus/tram/car side cut-away — body `bevelRect`, windows `scene.glass`, wheels by distance, doors, cab |
| `figure` | `anatomy.humanFigure` with `props.pose` and gait `props.phase` |
| `vessel` | `labware.beaker/flask/testTube` with `LiquidSpec` from props (level, color, bubbles, precipitate); 3D glassware when allowed |
| `burner`/`thermometer`/`syringe`/`balance`/`burette`/`condenser`/`funnel` | `labware.burner+bunsenFlame` (flame height = props.reading), `thermometerProbe`, `gasSyringe`, `balance`, `buretteStand`, `condenser`, `funnel` |
| `switch`/`bulb`/`battery`/`wire`/`resistor`/`meter`/`magnet` | `knifeSwitch` (props.open), `bulb` (brightness = props.reading), `battery`, `wireHarness`, `resistor`, `panelMeter`, `barMagnet` |
| `lens`/`prism`/`opticalBench`/`ray`/`wavefronts`/`medium` | `labware.lens/prism/opticalBench`, `waves.waveRay/wavefronts/transverseMedium/longitudinalMedium` fed the model's displacement array |
| `particles` | `scene.particleField` over a Float64Array the model advances, or `three3d.buildParticles` |
| `cell`/`membrane`/`organ`/`bodyVessel`/`neuron` | 3D `buildCell` / `organic.membrane` (scale ∝ ∛ relative volume) / `anatomy.organ/vessel/neuron` |
| `creature`/`plant`/`habitat`/`populationPatch` | `fauna.creature/plant/habitat/population`; motion `props.phase` from state |
| `strata`/`plateSection`/`volcano`/`terrain`/`rock` | `geo.strataColumn/plateSection/volcano/terrain/rockSample`, offsets from state |
| `planet`/`moon`/`star`/`orbitPath` | `space.planet/moonPhase/starBody/orbitPath` |

### 3.4 Cues — `cues.ts`

- **vector**: `draw.arrow` (the platform's one arrow style), colour `theme.sci[token]`,
  tail at the anchor (centre of mass for weight/velocity; `"contact"` = ground point
  under the actor for normal/friction; the hand for a pull). Length =
  `magnitude × scales[token]`, floor 14 px for non-zero values (a 1.5 m/s walker beside a
  30 m/s tram still has an arrow), cap 40 % of stage width with a **"//" break glyph** on
  the shaft — the honest statement that the picture ran out of room; the exact number
  always rides in the badge. Force vectors read `s.forces` by id — never computed in the
  cue.
- **noForce**: dashed hollow arrow outline + label in `inkSoft` while `when(s,p)` holds.
- **energyBars**: `charts.energyBars` with `total` supplied, so the empty remainder IS the
  dissipation; parts from `RigModel.energy` (audited ±1 %) or the explicit function.
- **heat**: tint `mixHex(theme.sci.cold, theme.sci.hot, (v−lo)/(hi−lo))` via
  `props.color`, `scene.glow` above 0.6, 3D `emissiveMaterial` follows the same fraction;
  vessels get `LiquidSpec.bubbles` when the model says T ≥ T_boil.
- **flow**: `scene.dashFlow`/`ribbon`/`particleField` along `path`, phase =
  `s[phaseKey]` — a state integral, so hotter gas visibly moves faster because the model
  says so.
- **trail**: `scene.comet` through this run's `s.paths[actor]`.
- **ghost**: previous runs' `RunRecord.paths[actor]` as thin `hexA(color, alpha ?? 0.3)`
  polylines.
- **badge/bracket**: `scene.badge` / a labelled dashed span (system boundaries: "mass +
  Earth").
- **handleHint**: `scene.pulse` ring on the handle's hit shape until `s.hintUsed[actor]`.

All cue text goes through `labelBox`/`safeLabel`/`labelLeader` (collision-managed);
overlay keys (`"vectors"`, `"energy"`, `"model"`, `"labels"`) become the manifest's
`OverlaySpec[]` via `overlaysOf`, band-gated exactly as `pendulum.ts` gates K-2.

### 3.5 Instruments — `instruments.ts`

Cards draw with `scene.badge`/`arcGauge`/`labware.panelMeter`/`thermometerProbe`/
`labware.forceMeter`/`organic.magnifier`. The photogate is engine-driven: each tick it
checks the watched actor's `at().x` against the gate's x between `prev` and `s`, and on a
crossing writes `s.gates[id] = { t: clock, value }` (speed = `lengthM / transit` from the
two edge crossings; time = clock). Gate posts flash `theme.sci.velocity` for 0.3 s after
a crossing (state-driven: `clock − gates[id].t < 0.3`).

### 3.6 Model kits — `app/src/engine/models/`

Each kit exports a `derivs`-builder, standard events, a `forces`-builder **from the same
force-sum closure** (the NamedForce guarantee), and where meaningful an `energy` builder:

`pointMass1D` (track, μN friction, drive force, end stops), `contact` (restitution,
constant-force crush `a = v²/2d`, `cracked`/`stopped` events), `springMass` (Hooke +
elastic-limit event), `pendulum` (RK4 + crossing events, lifted from
`sims/physics/pendulum.ts`), `projectile` (drag, from `projectile.ts`), `lumpedThermal`
(Newton cooling, conduction links, latent-heat plateau), `reactionKinetics` (1st/2nd
order, Arrhenius, saturation event), `gasBox` (particles + wall impulses), `logistic`,
`lotkaVolterra` (crash event), `selection` (discrete generations via `ctx.rng`),
`diffusion1D` (membrane/osmosis), `twoBody` (verlet), `decay`, `dcCircuit` (small
netlist Kirchhoff solve), `waveString` (1-D wave equation). ~1,800 lines total,
hand-built with unit tests in `science.test.ts`.

### 3.7 Rigs — `app/src/sims/rigs/`

Prebuilt `{ scene-fragment, handles, instruments }` bundles a spec spreads and extends —
apparatus, not layouts (they place hardware; they never fix a composition):

`trackRig({lengthM, gates, endStops})`, `dropTower({heightM, pad})`,
`standAndMass({heightM, target})`, `springLauncher()`, `vehicleInterior({kind, lengthM})`,
`heatingBench({vessel, burner, probe})`, `reactionBench({vessels, pourFrom})`,
`circuitBoard({netlist})`, `waveTank({lengthM})`, `populationPatch({habitat, species})`,
`membraneDish()`, `orbitFrame({bodies})`, `sectionRig({geo})`, `trayOf({cells})` (the
taxonomy tier's live mini-rig grid). ~14 rigs at launch; new rigs are added when three or
more experiments would share one (the token lever, §9).

---

## 4. Interaction

### 4.1 What "pull the cart back and let go" is, in code

```ts
// In the experiment file:
handles: [{
  gesture: "slide", actor: "cart", axis: "x",
  range: [-1.9, -0.4], snap: 0.05,
  write: (s, u) => {
    s.x = u; s.x0 = u;                       // the cart follows the finger
    s.springCompression = Math.max(0, -0.4 - u);   // quasiStatic shows k·x on the meter
  },
  releaseStarts: true,                       // pointerup → startRun (gated §4.4)
  fling: (s, vx) => { s.v = clamp(vx, -3, 3); },   // OR a push-launch: pointer speed
}],
```

Pointer-down inside the cart's hit shape claims the handle; every pointer-move projects
the world point onto the axis/path, clamps to `range`, snaps, and calls `write` — the
model's `quasiStatic` then shows the stored spring force growing on the force meter while
the hand holds it. Pointer-up: `fling` receives the smoothed world pointer velocity (from
`DragState.vx/vy`, computed from input-log ticks, never wall clock), then
`releaseStarts` calls `startRun(s)`. Everything the hand did is in the input log, in
metres, so teacher replay reproduces the exact release.

### 4.2 Pointer → world, and why replay is exact

`Stage.tsx` converts CSS pixels to world metres through `manifest.pointerToWorld`
**before** `useSim.push` hands the input to the runner — so `SimRunner`'s input log holds
metres. The conversion basis is the camera the renderer published for the frame the
student was actually pointing at (`view.publish` in §3.2), which is correct by
construction at record time. On replay, inputs are *already* world coordinates: no camera
is consulted at all, so replay and fingerprint tests are exact on any canvas size,
headless included. Probes (§2.2) are written directly in world coordinates for the same
reason. (This closes the `stageSize`-map hole in `archetypeSim.ts` that all three judges
flagged.)

### 4.3 Hit-testing and gesture resolution — `gestures.ts`

- Hit shapes come from `ActorDef.hit` or the kind's `extentM`, inflated by 0.35 × the
  shorter side and never below a 22 CSS-px-equivalent radius at the current `cam.scale`
  (a 6 px egg is still grabbable on a trackpad).
- Topmost wins: `front` before `rig` before `back`, then reverse draw order.
- Only handles whose `while` includes the current phase are live (default `["setup"]`).
  Grabbing any handle while `settled` first re-arms: `init` with `runs` kept, ghost laid.
- `swing`: angle from `atan2` about `pivot(s)`, clamped to range. `tap`: fires `toggle`
  (and `startsRun` if set). `carry`: the actor rides `s.carry`; drop inside a target's hit
  fires `onDrop`, a miss snaps back with a notice. `tilt`: drag angle → `write`; the
  model integrates the pour (receiving vessel's level rises *during* the pour).
- Dragging while paused works: `SimRunner.advance` already runs `tick(0)` for queued
  inputs (loop.ts lines 117-120). No runner change.

### 4.4 The predict-before-run gate

`startRun(s)` (also used by `releaseStarts`, `startsRun`, and the primary action):

```ts
export function startRun(s: RigState, ctx: SimContext): boolean {
  if (s.labGate && !s.predicted) {
    s.notice = { text: "Commit to a prediction first", until: ctx.time + 2.5 };
    return false;                            // the hand stays where it left things
  }
  s.phase = "running"; s.clock = 0; s.failed = false; s.events = [];
  s.caption = null; s.peaks = {}; s.trace = []; s.paths = {}; s.slowmoUntil = 0;
  return true;
}
```

`labActive`/`labInactive`/`predicted` arrive as logged ActionInputs from `SimPlayer`
(§2.6.5), so the gate replays. Continuous mode's predict-before-change is enforced by
`autoLab` step ordering plus `RunMarker` timestamps (a change before the prediction stamps
a marker the lab check rejects) — soft-enforced deliberately: sliders cannot be "refused"
without fighting the params flow.

### 4.5 Keyboard and screen reader — `keyboard.ts`

`key:Tab` cycles `s.focusHandle` through handles live in this phase (ring drawn in HUD
pass); `key:ArrowLeft/Right/Up/Down` nudges the focused slide/swing/tilt by one `snap`
step (via the same `write`); `key: ` (space) releases the focused handle
(`releaseStarts`) or fires the primary action; `key:Enter` = primary action. All arrive
as ActionInputs → logged → replayable. `Stage`'s `aria-label` comes from `def.aria` or
the generated "Setup. Ball held at 1.20 m. Press Space to release."

---

## 5. Runs and accumulation

### 5.1 Trial lifecycle

**setup** — clock frozen at 0; handles live; `quasiStatic` readouts show what the hand is
doing; the chart shows previous runs and the empty slot for this one. `restartOn` param
changes re-init (runs kept); everything else applies live.
**running** — entered only through `startRun`. Integration, events, peaks, gates; trace
sampled every `sampleEvery` sim-seconds *in the model* (deterministic, unlike `useSim`'s
wall-clock series, which stays for the React Graph); slow-mo windows apply.
**settled** — `settled(s,p)` true, or a failure event ended it, or `maxSeconds`:
`commitRun` pushes the RunRecord —

```ts
const rec: RunRecord = {
  n: s.runs.length + 1,
  setup: { ...numericParams(p), ...def.runs.setup(s, p) },   // state wins on key clash
  result: { ...readoutValues(s, p), ...s.peaks },
  trace: decimate(s.trace, 240), paths: decimatePaths(s.paths, 120),
  events: [...s.events], ok: !s.failed,
  endedBy: s.failed ? lastFailureId(s) : (timedOut ? "timeout" : "settled"),
};
```

— then `phase = "settled"`, time holds on the end state (failure banner up if any), a
result chip (`badge`) pins the headline number at the outcome's world position, and the
`"row"` SimEvent lands the run in the data table. **Again** (engine-provided action):
re-init keeping `runs`, ghost laid. **Clear runs** = `SimRunner.reset()` — the stage-foot
primary button is always "Again"; Reset is labelled "Clear runs" for rig sims.

### 5.2 Continuous mode

For systems that never settle (ecosystems, heating curves, gas boxes): phase is
`running` from load; `settled` unused; non-`live` control changes stamp
`RunMarker { t, label: "light 40 → 80 % at 62 s" }` drawn as a vertical line on the trace
chart; the engine `record` action stamps a reading as a RunRecord (setup = state + params
at the stamp, result = readouts). The trace chart scrolls a window of the last
`x.max` seconds. AutoLab for continuous rigs is predict-before-*change* (§5.5).

### 5.3 The run chart — `charts.ts`

Drawn with `chartFrame` (axes, `niceTicks`, units, plate), `lineSeries` (live trace,
`endDot: true`; previous runs' traces behind at alpha 0.3), `scatterSeries` (one dot per
committed run at `(setup[x], result[y])`, `fit` line through ok runs, radius 5),
`legend` (series named by `seriesBy` value: "mass = 1.2 kg"). Failed runs draw as crosses
in `theme.sci.force` with the failure id in the legend. `threshold` draws its labelled
line. Axis ranges: x from the control range or setup spread; y from `predicted` sampled
across x (fallback: observed max + headroom), rounded by `niceTicks`, and **never
shrinking within a session** so earlier points do not jump. The dashed model overlay
(engine-drawn from `predicted`, overlay `"model"`, default off, hidden until
`minRunsForModel` runs exist) is confirmation, never source. Structurally there is no
other input: the chart functions take `(dock, s.trace, s.runs, chartDef)` and nothing
else.

### 5.4 Facts, rows, labs see runs

`rigFacts` exposes: `phase`, `runs` (count), `lastRun.<key>` (flattened setup+result),
`lastRun.ok`, `endedBy`, `events.<id>` (fire count), `peaks.<key>`, `markers` (count),
`predicted` (gate flag), and `fair` — true iff all committed runs share identical setup
except `fairKeys`. `LabValues.runs` (additive, §2.6.1) carries the run summaries so lab
checks can quantify spread. `makeRowEvents` emits one `"row"` per newly committed run:
`{ t, values: result, inputs: setup, trial: n }` — the existing `autoLab`
`requireData` machinery reads exactly these fields.

### 5.5 `autoLab` / `autoChallenge` — rebuilt over runs

Steps (trial mode): question → **predict** (commits the gate; options from
`responseShape` applied to `predicted` — the archetype helper survives) → setup ("drag
the ball to 0.25 m"; check reads `facts` state, not sliders) → run once (`runs ≥ 1`) →
vary fairly ("change only <x> and run again — four runs spread across the range"; check:
`runs ≥ 4 && fair && spread(runSetups[x]) ≥ 0.6·range`) → read the graph (write) →
**confront** (a second predict whose *options are the student's own committed runs* —
"Which run shows that padding did not remove energy?" — correct index chosen by the
engine from the records) → conclude. Continuous mode: predict-before-change variant
(predict → change one input → watch the line after the marker; check reads
`markers` and `predicted` ordering). `autoChallenge`: "reach ≥ Y within N runs",
evaluated on `facts.lastRun_*` and `facts.runs`.

---

## 6. The five worked examples

All five at the 960 × 600 reference, layout `rig+charts` (stage x 0–612; chart docks at
(624, 16, 320, 276) and (624, 308, 320, 276)); both themes via `theme.*` tokens only.
These are five of the eight hand-built exemplars (§7.5) — the founder judges their
screenshots before mass production starts. Content blocks (title, goals, misconceptions,
standards) carry over verbatim from the named source specs; `measure` survives as
`model.predicted`.

### 6.1 `g8a1-slope-is-speed` — Position vs time (replaces the purple box)

**Source spec** `app/src/sims/topics/g8a1.ts` (`SLOPE_IS_SPEED`); predicted keeps
`positionM = x0 + v·t`, `gradientMs = v`. Ranges are rescaled to real apparatus (a 4.0 m
bench track, ±1 m/s motorised buggy) under the migration's apparatus-rescale rule
(§8.3); the relationship is untouched.

**State & model.** `{ x, v, x0, motorV, running }`, ode `phase: ["x","v"]`,
`derivs: dx = v; dv = 0` (the motor holds v; `startRun` sets `v = motorV`).
Events: `gate1`/`gate2` handled by photogate instruments; `endstop` when `|x| ≥ 1.95`:
if `|v| ≥ 0.6` reflect with e = 0.35, `failure: true`, caption "Hit the end stop at
{v} m/s"; else `v = 0`. `settled`: `|v| < 0.01` or clock ≥ 8 s. `forces`: none drawn
(velocity cue only). Controls: `velocity` −1..1 m/s step 0.05, `startAt` −1.5..1.5 m
(mirrored by the drag). `runs.setup: (s) => ({ start: s.x0, velocity: s.motorV })` —
from state.

**Actors.** `track` 4.0 m on `bench` (benchStage top = world ground; extent
x −2.05..2.05, y −0.15..1.1 → ~149 px/m): rail + `meterRule` beneath (minor ticks
10 cm, labels every 0.5 m, red "0" flag at origin); `cart` (60×24 px, 3D when available,
wheels `phase = x / (2π·0.03)`); two `endStop`s; `motionSensor` (custom part) at the left
end whose ranging cone's length *is* the plotted distance.

**Instruments.** Two `photogate`s at x = ∓1.0 m watching "cart" (`lengthM: 0.4`,
records "speed"); `stopwatch` dock "tl"; `panel` "Gate speed" reading `s.gates`.

**Gestures.** `slide` the cart (axis x, range [−1.5, 1.5], snap 0.05,
`write: s.x = s.x0 = u`); `tap` the cart's motor toggle (`startsRun: true`). Action
`{ key: "go", label: "Start", primary: true }`.

**Cues.** Velocity vector on the cart (`scales.velocity: 80` px per m/s), badge
"v = 0.50 m/s"; `trail` 2 s; `ghost` on cart; `handleHint`.

**Charts.** Dock 1 `trace`: Position (m) vs Time (s), x 0..8, y −2..2 — the line grows
as the cart moves, gradient triangle drawn over the last 1.0 s ("Δx/Δt = 0.50 m/s").
Dock 2 `runs`: Graph gradient (m/s) vs Photogate speed (m/s) with a dashed 1:1 reference
(engine `threshold` used as identity line) — the graph agrees with an independent
instrument.

**Ten minutes.** Predict (autoLab). Drag to −1.5, set 0.5 m/s, Start: cart crosses in
6 s, gates blink, the line climbs. Again at −0.75 m/s from +1.5: the cart runs left, the
line falls. Again at 1.0 m/s: end-stop bounce, failure banner, the trace turns over.
Three lines side by side; the lab asks for gradient and gate speed per run; conclusion
writes itself.

**Probe.** Drag cart −1.5 → pointer path along the rail; tap motor; wait to settle —
must commit run 1 with `gradientMs ≈ 0.5` (golden vs `predicted`).

### 6.2 `g8a1-who-is-moving` — Reference frames (replaces the sphere-captioned walker)

**Source** `WHO_IS_MOVING` (compare). Predicted keeps the four frame sums.

**State & model.** `{ xt, vt, u, vu, frame }` — tram ground position/velocity, walker
carriage position/velocity, `frame: "platform" | "tram"`. Ode phase
`["xt","vt","u","vu"]`, `dxt = vt; dvt = 0; du = vu; dvu = 0`. Derived: walker ground
x = `xt + u`. Events: `doorEnd` when |u| ≥ 5.5 → `vu = 0`, caption "She has reached the
end of the carriage — 11 m is all a tram can give her"; `passed` when xt > 24 → settled.
Controls: `tram` −8..8 m/s (live via throttle), `walk` −1.5..1.5 m/s.
`runs.setup: (s) => ({ tram: s.vt, walk: s.vu, frame: s.frame === "tram" ? 1 : 0 })`.

**Actors.** Setting `outdoor` (sky + groundPlane, ground y = 0; extent in platform frame
x −18..18 → 17 px/m; in tram frame `xt ± 18` — the carriage pins centre and the world
streams honestly). Platform: `platform` edge strip, `lampPost`s every 5 m with distance
stencils, a `figure` platform observer (pose stand) at −6 m. `vehicle` tram 12 m × 3.4 m
cut-away with seats, a seated `figure` passenger, driver's cab with throttle lever
(`swing` handle); walker `figure` (pose run, gait `phase = u / 0.7`) at `(xt + u, 0)`.
The active observer wears a `theme.accent` ring + badge "measuring from here".

**Instruments.** `stopwatch` "tl"; `panel` × 2: "walker, this frame" and "tram, this
frame" (m/s).

**Gestures.** `tap` either observer figure → `s.frame` switches (while
`["setup","running","settled"]` — mid-run cuts allowed); `slide` the walker along the
carriage (`axis: {path: s => [{x: s.xt−5.5, y: 0}, {x: s.xt+5.5, y: 0}]}`, write
`s.u = u − s.xt` … the engine passes the projected scalar; write stores carriage-relative
position); `swing` throttle (range [−8, 8] mapped to m/s, write `s.vt`, mirrors param).
Action "Go" primary.

**Cues.** Velocity vectors at 10 px per m/s **computed in the active frame**: platform →
tram 50 px, walker 65 px, posts 0; tram → tram gets a `noForce`-style "0 m/s" hollow
marker, walker 15 px, lamp posts −50 px each (the platform is what moves). Badges carry
numbers. Ghost on the walker.

**Charts.** Dock 1 `trace`: Walker's position (m) vs time — two lines from one state,
"from the platform" (xt+u) and "from the seat" (u): one steep, one shallow, one person.
Dock 2 `runs`: bars for the last run (tram / walker / platform speeds in each frame,
side by side).

**Ten minutes.** Predict who is right. Go at tram 5, walk 1.5; tap the seated passenger
mid-run — the tram freezes at centre, lamp posts stream left, the shallow line is now the
"real" one. Tram 0: both frames agree, the lines lie on each other. Walk −1.5: from the
platform she still moves forward at 3.5. `doorEnd` fires at the front door: relative to
the tram she can only ever cover 11 m; relative to the platform she covered 35.

**Probe.** Drag walker forward, swing throttle to 5, Go, tap passenger at t ≈ 3 s,
settle. Golden: `lastRun` frame speeds vs `predicted`.

### 6.3 `g8a3-the-bus-stops` — Inertia (replaces the floating box + caption rail)

**Source** `THE_BUS_STOPS` (process). Its five captions become event captions bound to
state predicates — the words can no longer describe what the picture does not show.
Predicted keeps `railForceN = mass·brake` (312 N at 65 kg, 4.8 m/s²), plus stopping
distance `v²/2a`.

**State & model.** `{ xb, vb, xp, vp, up, braking, holding, slip }` (bus, passenger,
`up = xp − xb` aisle position 0..9 m). Ode phase `["xb","vb","xp","vp"]`:
`dvb = braking ? −a_brake : 0` (event `busStopped` clamps at 0);
`dvp = holding ? dvb : clamp((vb − vp)/τ, −μg, +μg)` with τ = 0.06 s — shoes supply at
most μ·m·g, so at μ = 0.3 the floor gives 2.9 m/s² against the bus's 4.8 and she slides.
`forces` (from the same closure): `weight` (down, 638 N), `shoes` (friction, ≤ μmg),
`rail` (only while holding, m·a_bus), on the bus `brakeForce` (m_bus·a). Events:
`brakesOn` (caption "The driver brakes. The bus loses speed at 4.8 m/s². Nothing has
touched the passenger."), `slipStart` when |vp − vb| > 0.05 (caption "No force on you
means no change for you", slowmo 0.5), `grabbed` (carry onDrop), `hitPartition`
**failure** when up ≥ 8.6 → `vp = vb`, records impact speed, caption "Hit the partition
at {Δv} m/s"; `busStopped`; settled when both stopped. Controls: `speed` 4..15 m/s,
`brake` 1..8 m/s², `mass` 40..100 kg (default 65), `grip` μ 0.1..0.6.
`runs.setup: (s) => ({ brake: s.aBrake, holding: s.holding ? 1 : 0, stand: s.up0 })`.

**Actors.** Setting `road` (ground y = 0, lane dashes; extent x −2..34 → 17 px/m).
`vehicle` bus 10 m × 3 m cut-away: window bays, driver `figure`, brake pedal (`tap`
handle, while running), `handrail` at 1.9 m running the cabin, partition plate at 9 m,
standing passenger `figure` at `(xb + up, 0.1)` whose hand is a `carry` handle with the
rail as target (`onDrop: s.holding = true`; carry away to let go). `lampPost`s every 5 m
so ground speed is legible; bus-stop sign at 30 m. Wheels by distance.

**Instruments.** `stopwatch` "tl"; `gauge` speedometer above the cab (read `vb`, max
`speed`).

**Cues.** Force vectors (`scales.force: 0.045` px/N, break glyph on the 57.6 kN brake
arrow, badge "57 600 N"); on the passenger: `noForce` while sliding ("no horizontal
force on you"), the ≤ 191 N shoe arrow at the contact anchor, the 312 N rail arrow only
while holding — all read from `s.forces` by id. Velocity vectors (8 px per m/s) on both —
the gap between them *is* the lurch. `badge` on the partition: "{9−up} m to the
partition". `trail` on the passenger.

**Charts.** Dock 1 `trace`: Velocity (m/s) vs time, two lines (bus, passenger) — with
the rail they fall together; without it hers stays flat until the partition. Dock 2
`runs`: Slide speed at the partition (m/s) vs braking (m/s²), `markFailed`, threshold at
`grip·9.81` labelled "what shoes can give".

**Ten minutes.** Predict what throws you forward. Drive, brake 4.8 without the rail:
hollow no-force outline, 0.5 s slow-mo at slip, she covers the aisle and hits at
2.1 m/s — cross on the chart. Again, hand to rail: the 312 N arrow appears, the lines
fall together. Brake 2.0: shoes suffice (2.0 < 2.9), a dot at zero. Ice (μ 0.1) at 8:
the worst cross. Conclusion: there was never a forward force.

**Probe.** Go → tap brake at t = 2 → settle (no rail) — must fire `hitPartition`;
golden: rail run's `railForceN` within 3 % of 312 N at defaults.

### 6.4 `g8b3-drop-and-stop` — Drop height vs deceleration (replaces the mid-air sphere)

**Source science** `g8b3-buy-yourself-a-metre` (`a = v²/2d`, g-count `= h/d` since
`v² = 2gh`; stop time `2d/v`) and `g8b3-steel-and-clay` (restitution). Predicted:
`decelG: h/d`, `impactSpeedMs: √(2gh)`, `stopTimeMs: 2d/v·1000`.

**State & model.** `{ y, vy, h, mode: "held"|"free"|"crush"|"rest", aCrush, depth,
broken }`. Ode phase `["y","vy"]`, `substeps: 4` (a 3 cm crush at 6 m/s lasts 10 ms);
`derivs: dy = vy; dvy = mode==="free" ? −g : mode==="crush" ? +aCrush : 0`. Events:
`contact` once when y crosses 0 downward → `aCrush = vy²/(2d)`, mode crush,
`slowmo: 0.5` (the crush is watchable); `cracked` once, **failure**, when
`aCrush/g ≥ 52.7` (the 58 g egg's shell limit; the survivable-load framing from the
source spec's 30 g comment carries into the lab text) → `broken = true`, caption
"{g} g. The shell gives way near 53 g."; `stopped` when vy rises through 0 in crush →
mode rest, `depth = −y`; settled at rest. `energy`: total `m·g·h` at release; parts
gravitational (m·g·y), kinetic, "into the foam" (m·aCrush·depth). Controls: `crushCm`
1..15 (pad thickness, drawn to scale), `dropHeight` 0.25..4 m (mirrors the drag).
`timeScale: 0.35`. `peaks: ["decelG","speed"]`.
`runs.setup: (s) => ({ h: s.h, crushCm: /* pad state */ s.padCm })` — the released
height is what the hand set, read from state (the lint's showcase).

**Actors.** Setting `bench`; extent grows with state:
`x −0.9..0.9, y −0.12..max(1.3, s.h + 0.45)` (233 px/m at h = 2; zooms honestly).
`stand` (tall clampStand at x = −0.45) carrying a vertical `meterRule` (0 at pad top,
ticks 5 cm); `foamPad` at x = 0, exactly `d` thick, `hatchFill` texture, thickness
label; the package: `ball` (egg, 25 mm, cream) inside a jacket ring (radius 25 mm + d)
hanging from an `electromagnetClamp` at `s.h`; `broken` prop draws crack + yolk on the
pad. Fresh-egg counter on Again after a crack.

**Instruments.** `inset` "br": 0.25 m window around the pad (~760 px/m — the egg is
38 px, the foam 23 px), active in setup and from 0.05 m above contact to rest — the
crush is seen at a scale where it is an event. `gauge` "tr" reading `decelG`, max 140,
`redline { 52.7, "shell limit" }`, `peakHold`. `stopwatch` "tl". `counter` "eggs used".

**Gestures.** `slide` the package up the stand (axis y, range [0.25, 4], snap 0.05,
`write: s.h = s.y = u`); `tap` the clamp (`startsRun`). Actions: Release (primary),
Again, Clear runs.

**Cues.** Velocity vector (12 px per m/s); during crush the pad's upward force vector
from `s.forces.pad` (2 px/N); `ghost` (faded drop lines at their release heights);
`energyBars` "dock" parts "model"; `handleHint`.

**Charts.** Dock 1 `runs`: Peak deceleration (g) vs drop height (m), x 0..4, y 0..140,
threshold 52.7 "shell limit", `markFailed`, `fit`, `seriesBy: "crushCm"` — 3 cm and 6 cm
foam are two slopes; "model" overlay lays `h/d` dashed after 3 runs. Dock 2 `trace`:
Speed (m/s) vs time — free-fall rise, then the 10 ms cliff, in slow motion.

**Ten minutes.** Predict the cracking height. 0.5 m → 16.7 g. 1.0 → 33 g. 1.5 → 50 g,
needle at the redline. 1.75 → 58 g, crack, yolk, cross. Four points make the line
through the origin; the threshold is crossed near the predicted 1.58 m. Foam to 6 cm:
1.75 m now 29 g — the second series is half as steep; the lab asks why doubling the foam
halves the line.

**Probe.** Drag to 1.0 m, tap release, settle: run 1 `decelG` within 3 % of `h/d` =
33.3; then drag to 2.0, release: `cracked` fired.

### 6.5 `g8b2-lift-it-and-hold` — Stored energy vs height (replaces the empty stand)

**Source** `LIFT_IT_AND_HOLD`; predicted keeps `storedEnergyJ = mgh`,
`landingSpeedMs = √(2gh)`, `weightN = mg`, plus `depthM = mgh/(F_wood − mg)` for the nail
(F_wood = 250 N, a real order for a 60 mm wire nail in hardwood).

**State & model.** `{ y, vy, h, work, mode: "held"|"free"|"driving"|"rest", depth }`.
Ode `["y","vy"]`: `dy = vy; dvy = mode==="free" ? −g : mode==="driving" ?
−(F_wood − mg)/m : 0`. `quasiStatic` integrates `s.work += m·g·Δh` **while the hand
lifts** — stored energy is measured from the student's own work, not asserted. Events:
`strike` (y ≤ 0 falling → driving, records `impactSpeed` from the photogate, slowmo
0.4); `nailStopped` (vy ≥ 0 → rest, `depth = −y`); `nailFlush` **failure** at depth ≥
0.06 m — caption "The nail is fully driven at 60 mm; {E} J dented the block." Settled at
rest. `energy`: total `s.work` fixed at release; parts gravitational / kinetic / "to the
wood" (F_wood·depth). Controls: `mass` 0.2..5 kg step 0.1, `height` 0.1..1.5 m
(mirrored). `timeScale: 0.5`.
`runs.setup: (s) => ({ h: s.h, mass: s.massKg, work: s.work })`.

**Actors.** `bench`; extent x −0.7..0.7, y −0.12..1.75 (321 px/m). `stand` 1.7 m with
vertical `meterRule` (0 at the nail head); `bossHead` + clamp riding at `s.h` on a short
string to the `hangingMass` (radius ∝ ∛m, stencil "1.2 kg"); below at x = 0 the `nail`
(60 mm) in a hardwood `block` with a millimetre depth rule; the Earth's side is the
bench itself, and a `bracket` cue spans mass → bench: **"stored between the mass and the
Earth"** — the store belongs to the arrangement, which is the misconception head-on.

**Instruments.** `photogate` 5 cm above the nail head (records "speed" — landing speed
measured, not asserted); `stopwatch`; `panel` "Work done lifting" reading `s.work`.

**Gestures.** `slide` the mass up the rod (axis y, range [0.1, 1.5], snap 0.05, write
`s.h = s.y = u` — `quasiStatic` accumulates the work and fills the PE bar under the
finger); `tap` the clamp (`startsRun`). Again resets the nail (fresh block, counter).

**Cues.** `energyBars` at (400, 16) parts "model", total `s.work`; weight vector always
(2 px/N); while held an equal upward string-tension arrow from `s.forces.string`
(balanced — and on release it vanishes); velocity vector 24 px per m/s; `ghost` of
earlier release heights; `badge` on the mass "work done lifting: 14.1 J".

**Charts.** Dock 1 `runs`: Stored energy (J) — the *measured* `work` — vs height (m),
`seriesBy: "mass"`, `fit`: two masses are two lines through the origin whose gradients
are the two weights. Dock 2 `runs`: Landing speed (m/s) vs height (m) from the
photogate — both masses land on **one** curve: "heavier stores more" separated from
"heavier lands faster" by the student's own dots.

**Ten minutes.** Predict. Lift 1.2 kg to 0.5 m — the bar fills to 5.9 J as the hand
works; release: 3.1 m/s at the gate, nail sinks 25 mm, bars trade in slow motion. 1.0 m:
50 mm. 1.25 m: nail flush — failure banner, dented block. Switch to 2.4 kg, repeat two
heights: twice the energy at every height, the same landing speed. Two lines on chart 1;
one curve on chart 2.

**Probe.** Drag mass to 1.0 m, tap clamp, settle: `work` within 3 % of mgh = 11.77 J,
`landingSpeedMs` within 3 % of 4.43; then to 1.4 m: `nailFlush` fired.

---

## 7. The builder contract

### 7.1 File layout — one file per experiment

```
app/src/sims/experiments/g8a1/slope-is-speed.ts    // exports g8a1SlopeIsSpeed
app/src/sims/experiments/g8a1/index.ts             // re-exports the topic's five (generated)
```

Export names match today's registry symbols exactly (`g8a1SlopeIsSpeed`, …), so
`registry.ts` changes only import paths — regenerated by `wire-topics.mjs`, whose export
regex becomes `/^export const (\w+)\s*=\s*build(Sim|Experiment)\(/m` and which now also
walks `sims/experiments/*/index.ts`. Hard cap **450 lines per experiment file** (the gate
rejects longer). A file contains: the content block (moved by the codemod), `interface
<Name>State extends RigState`, the model, the scene (usually `...spread` of a rig), the
handles/actions, runs, probe, and `export const <symbol> = buildExperiment(DEF);` —
nothing else.

### 7.2 What a builder agent reads (and may not read)

Reads, per topic batch of five: `engine/rig/CHEATSHEET.md` (generated digest: every type,
every ActorKind/InstrumentKind/Cue with one-line signatures, the rig and model-kit
catalogues, the lint rules, one complete exemplar — ~3 k tokens); the family cookbook
(`.workflows/cookbooks/<family>.md`, ~2 k: layout patterns, which rigs/kits, the family
exemplar's file path); the migrated stub file for the topic (§8.2); the family exemplar
source. **Forbidden: every file under `app/src/ui/` and `app/src/engine/` other than the
cheatsheet** — the digest is the interface (reading `labware.ts` once costs ~45 k tokens;
banning it is the single biggest budget lever). The orchestrator enforces this via the
task prompt and rejects sessions whose transcripts read kit files.

### 7.3 What a builder writes / must not touch

Writes: the experiment file(s) for its topic, nothing else. Must not touch: any file in
§2.6's untouched list, the engine, the kits, other topics' files, tests other than
running them, `registry.ts` (regenerated), the codemod outputs of other topics. A builder
that believes the engine lacks something **stops and flags** (circuit-breaker, §9) — it
never patches the engine or hand-rolls a drawer beyond `registerActor("custom:…")` with
scene primitives.

### 7.4 The three checks

1. **Static** — `npm run check:experiments -- <id>`: `tsc` plus `lint-experiments`
   (`engine/rig/lint.ts`, also run as vitest over the registry). Tier "experiment"
   requires: `ode` or `update`; `settled` (or mode continuous); ≥ 3 actors of which ≥ 1
   instrument reads state; ≥ 1 physical handle (`releaseStarts` / `startsRun` / carry /
   tilt); ≥ 1 bound cue (vector/energyBars/heat/flow); a runs-mode chart or a trace
   chart with ghosts; ≥ 1 `failure` event; a probe; force-token vector cues name a
   NamedForce id and `model.forces` exists; `runs.setup` reads state (called with two
   states differing only in hand-set fields → outputs must differ); no
   `rc.time|Date\.|Math\.random|performance\.` in the file; every string label ≤ 28
   chars. Tier "taxonomy" (sort/explore/assemble): waives ode-or-update-required and the
   failure event **only**; per tray cell it still requires a live mini-model slice
   (state changes over 2 s), a state-driven pose (two-state check per cell), a readable
   badge/instrument bound to cell state, and a carry gesture — **the lint runs per
   cell**, so static specimen cards cannot ship.
2. **Behavioural** — `npm run test:experiments -- <id>` (generated vitest): (a) readouts
   finite at t = 0; (b) determinism: probe replay at 30 fps vs 144 fps chunking →
   identical `fingerprint()`; (c) probe efficacy: ≥ 1 actor's `at()` moved ≥ 0.02 ×
   extent and ≥ 1 RunRecord committed (trial) or ≥ 1 marker + stamp (continuous); (d)
   golden: after the probe settles, every key shared between `runs[0].result` and
   `predicted()` agrees within `tolerance` (default 3 %); (e) energy audit where
   `model.energy` exists: |Σparts − total| ≤ 1 % throughout the probe; (f) two-state
   pose check for every actor with a hit shape; (g) floor-support assert and
   on-stage assert: at every param extreme, every actor's `at()` lies inside
   `extent()` and on/above `ground` unless flying; (h) label audit: a recording
   context (stubbed `measureText` at 6.5 px/char) renders t = 0 / probe-mid / settled ×
   both themes × each control's min and max, and fails any two label plates overlapping
   > 4 px or leaving the stage.
3. **Visual** — `node app/scripts/health.mjs --screens <id>`: real-browser screenshots
   at t = 0, probe-mid, settled × both themes × control extremes (12 per sim),
   thumbnailed into a per-topic contact sheet plus terse text findings. A verifier agent
   (separate session) judges the sheet against the seven-point bar and either passes the
   topic or returns findings; every repair re-runs all three checks.

### 7.5 Exemplars-first sequencing

Eight experiments are hand-built at `pendulum.ts` quality *before* any batch runs: the
five in §6 plus one thermal (`heatingBench` + `lumpedThermal`, continuous), one chemistry
(`reactionBench` + `reactionKinetics` + tilt-pour), one biology (`populationPatch` +
`lotkaVolterra`, continuous with crash failure). They are the engine's acceptance suite,
the style contract the cookbooks cite, and **the founder judges their screenshots before
mass production starts**. The tray/taxonomy pattern ships its own exemplar (a g6a1 sort
rebuilt as live mini-rigs) in the pilot batch, judged before the 173 taxonomy specs run.

### 7.6 QA rejection criteria — the seven-point bar as machine checks

| Bar | Enforced by |
|---|---|
| 1 Whole apparatus, in spatial relationship | one metric camera; ≥3 actors incl. a state-reading instrument (lint); floor-support + on-stage asserts (test g) |
| 2 Physics integrated live | `ode`/`update` + settled required (lint); state must evolve (test c); golden vs answer key (test d); type-level: no `t` in any binding |
| 3 Cause visible, scaled, at the right place | ≥1 bound cue (lint); force arrows only from `s.forces` (lint); one scale per token + break glyph (engine); energy audit (test e) |
| 4 Student does something physical | ≥1 releaseStarts/tap/carry/tilt handle (lint); probe must move pixels and commit a run (test c) |
| 5 Takes time, accumulates | run lifecycle + RunRecords (engine); chart API accepts only recorded data (types); runs chart or ghosts required (lint) |
| 6 Failure state shown | ≥1 `failure` event (lint, experiment tier); failed runs cross-marked; banner named (engine); taxonomy tier documents its waiver in the file header |
| 7 Nothing broken on screen | label audit (test h); extremes × themes × moments screenshots (check 3); labels ≤28 chars (lint); Chromebook budget: ≤4 draw3D/frame, backdrop cached, health asserts ≤8 ms model+render at 960×600 |

A verifier may still reject a passing experiment on judgment (the failure state is not
*the subtopic's* failure; the ten minutes do not teach) — the checks are the floor, the
contact sheet is the bar. Every gate-gamed discovery becomes a new machine check.

---

## 8. Migration of the 521 specs

### 8.1 Coexistence

`buildSim` (archetype) and `buildExperiment` (rig) both produce `AnySim`; the registry,
catalogue, curriculum links and share links do not care which built a sim. Ids never
change. `manifest.engine` gives the burndown: `health.mjs` reports
`archetype: 521 → 0`. When `grep -c "buildSim("` over `sims/topics` reaches zero,
`archetypeSim.ts` and the specimen half of `archetype.ts` are deleted (`Variable`,
`responseShape` survive, moved into `rig/params.ts` / `rig/autoLab.ts`).

### 8.2 The codemod — `app/scripts/migrate-specs.mjs`

Parses each `sims/topics/*.ts` with the TypeScript compiler API and emits, per subtopic,
`app/src/sims/experiments/<topic>/<slug>.ts`: the content block copied field-for-field;
`variables` → `controls`; **`measure` → `model.predicted` verbatim** (the checked
constants survive to the comment); `plot` → the first runs-mode `ChartDef`; `stages` →
event stubs carrying the captions with `when: TODO`; `kind` → a rig import suggestion
(`investigate → trackRig/standAndMass/dropTower by apparatus…`, `compare → layout
"split"`, `sort/explore/assemble → tier "taxonomy" + trayOf`, `process/trace → captioned
events / flow cues`); specimens → actor stubs with the nearest ActorKind. The emitted
file **deliberately does not compile** (`model.ode`, `settled`, `at()` bindings, handles,
`runs.setup`, `probe` are `TODO(rig)` holes) — an untouched migration cannot ship. The
old spec's `drive` is copied into a trailing comment for reference, then deleted.

### 8.3 Rules of carriage

- Science survives: `predicted` is the old `measure`; the golden test asserts the
  integration lands on it. Where the integrated scene honestly includes what the formula
  idealised away (drag, losses), the spec sets `tolerance` and says why in a comment the
  verifier reads.
- **Apparatus-rescale rule**: a control range set for a cartoon (a ±20 m bench track) may
  be rescaled to real apparatus if and only if the plotted relationship is
  scale-invariant; the change is named in the file header and the verifier signs it off.
- Hand-written `labs`/`challenges` survive verbatim; auto ones regenerate over runs.
- Order: the 8 exemplars → founder gate → physics A/B units → chemistry → biology →
  earth/space (model kits mature in that order) → the 173 taxonomy-tier specs last,
  behind their own exemplar gate. One agent per topic file (5 subtopics); a topic flips
  in the registry only when all three checks pass for all five.

### 8.4 What is replaced / kept (summary)

Replaced: `ArchetypeSpec`+`drive`+`drawSpecimen`+`studioSweep`+`renderInvestigate`'s
swept curve — the whole specimen path. Kept and load-bearing: `SimRunner`/`useSim`/
`Stage`/labs/challenges/registry/health/wire scripts (with §2.6's additive diffs), all
2D kits, `three3d.ts`/`render3d.ts`, `units.ts`, `ctxGuard`, the archetype's
`autoLab` question/predict scaffolding (rebuilt over runs), `responseShape`, and all 521
content blocks.

---

## 9. Token budget

Fixed costs (engine team, before batches; re-baselined upward per the judges — the
optimistic 0.25–0.4 M engine lines in the source designs are rejected):

| Item | Estimate |
|---|---|
| `engine/rig/*` + `engine/models/*` + `ui/actors/*` + `sims/rigs/*` (~7.5 k lines, with iteration) | 0.55 M |
| Cheatsheet generator + 8 cookbooks + codemod + health/lint extensions | 0.08 M |
| 8 hand-quality exemplars (≈ 15 k each incl. verification) | 0.15 M |
| **Fixed total** | **0.78 M** |

Per experiment, batched five per topic (reading amortised: cheatsheet + cookbook +
exemplar + stub ≈ 8 k/topic → 1.6 k each):

| Tier | Count | Read | Reason | Output | 1 check cycle | Avg |
|---|---|---|---|---|---|---|
| experiment (investigate 143, compare 79, process 78, trace 48) | 348 | 1.6 k | 1.5 k | 3.5–5.5 k | 1.2 k | **8.3 k** |
| taxonomy (sort 87, explore 51, assemble 35) | 173 | 1.6 k | 1.0 k | 2.5–3.5 k | 0.9 k | **6.0 k** |

Builders: 348 × 8.3 k + 173 × 6.0 k ≈ **3.93 M**.
Verification (one agent per topic file: reads the five files' diffs summary, the contact
sheet findings, the test output; ~8 k × 104 topics) ≈ **0.83 M** — *protected: never
cut; every prior failure shipped because verification, not construction, was cut.*
Repair (historical ~20 % need one fix cycle at ~4.5 k) ≈ **0.47 M**.

**Total ≈ 6.0 M against the 6 M envelope.** The absorbers, in order: (1) the repair line
falls as the lint catches errors pre-verifier (each converted machine check is free
thereafter); (2) skip the second screenshot round on topics that pass checks 1–2 and the
sheet first time (~0.25 M); (3) add a rig, never a bigger budget — any rig shared by ≥ 3
pending experiments pays for itself within one unit. The honest cut if the budget still
tightens is *fewer rigs built later*, never thinner experiments.

**Circuit-breakers** (orchestrator-enforced): an agent exceeding **12 k tokens on one
experiment stops and flags** it as a custom case rather than iterating; an experiment
whose final output lands **under 3 k tokens is auto-flagged as template-suspect** and
routed to the verifier regardless of checks (cheap declarative specs are exactly the
scenes the founder rejected); a topic exceeding 1.5 × its batch budget pauses the lane
for a cookbook fix, because a systematic overrun means the engine is missing a rig or a
kit, not that 100 more agents should push harder.
