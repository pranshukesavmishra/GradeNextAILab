import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import { badge, caption, comet, glow, hexA, sky, sphere, vignette } from "@ui/scene";

/**
 * Reflex or Decision? — Grades 6-10.
 *
 * A stimulus lands on your hand and two signals leave at once. One turns round
 * at the spinal cord and is back at the muscle before the other has even
 * reached the brain. The sim races them side by side and puts a stopwatch on
 * each, because the *contrast* is the lesson: a reflex is not "a fast decision",
 * it is a shorter circuit that never involves a decision at all.
 *
 * Every millisecond on the screen is built from real numbers:
 *   · myelinated Aα motor fibres carry signals at about 80 m/s; Aδ pain fibres
 *     at about 20 m/s; unmyelinated C fibres at about 1 m/s
 *   · one chemical synapse costs about 0.7 ms, a neuromuscular junction ~1 ms
 *   · deciding and planning in the cortex costs roughly 90 ms
 *   · about 15 ms passes between a muscle being told to move and moving
 * Those give a withdrawal reflex near 65 ms and a voluntary response near
 * 190 ms — which is where a physiology textbook puts them.
 *
 * Grade 6 Unit B, topic B6.
 */

/* ------------------------------------------------------------------ *
 * Nerve constants
 * ------------------------------------------------------------------ */

/** One chemical synapse: transmitter across the gap and a new spike started. */
export const SYNAPSE_MS = 0.7;
/** The nerve-to-muscle junction is a slightly slower synapse. */
export const NMJ_MS = 1.0;
/** Electromechanical delay: told to move, then visibly moving. */
export const MUSCLE_MS = 15;
/** Deciding what to do and planning the movement, in the cortex. */
export const BRAIN_MS = 90;
/** Practice never gets you below this — some of the cortex work is irreducible. */
const BRAIN_MS_PRACTISED = 55;

/** Path lengths for a school-age arm and spine, in metres. */
export const D_RECEPTOR_TO_CORD = 0.80;
export const D_CORD_TO_BRAIN = 0.45;
export const D_BRAIN_TO_CORD = 0.45;
export const D_CORD_TO_MUSCLE = 0.75;

/** Motor neurons are the fastest fibres in the body: Aα, 80-120 m/s. */
export const V_MOTOR_MYELINATED = 80;
/** Strip the myelin and the same axon manages about a metre a second. */
export const V_UNMYELINATED = 1;

export interface StimulusSpec {
  key: string;
  name: string;
  /** Sensory conduction velocity, m/s. */
  velocity: number;
  /** Synapses inside the spinal cord on the reflex path (not counting the NMJ). */
  reflexSynapses: number;
  fibre: string;
  note: string;
}

/**
 * Fibre classes and their textbook conduction velocities. A tendon tap runs on
 * Ia proprioceptive fibres and takes a single synapse in the cord — the only
 * truly monosynaptic reflex in the body.
 */
export const STIMULI: Record<string, StimulusSpec> = {
  tap: {
    key: "tap", name: "Tap on the tendon", velocity: 90, reflexSynapses: 1, fibre: "Ia (myelinated)",
    note: "The knee-jerk: one synapse in the cord, and nothing else is consulted.",
  },
  touch: {
    key: "touch", name: "Touch on the skin", velocity: 50, reflexSynapses: 2, fibre: "Aβ (myelinated)",
    note: "Light touch travels on medium myelinated fibres, about 50 m/s.",
  },
  heat: {
    key: "heat", name: "Something hot", velocity: 20, reflexSynapses: 2, fibre: "Aδ (thinly myelinated)",
    note: "Sharp, immediate pain. This is the reflex that pulls your hand off a pan.",
  },
  ache: {
    key: "ache", name: "Dull ache", velocity: 1, reflexSynapses: 2, fibre: "C (unmyelinated)",
    note: "The second, throbbing pain that arrives a whole second after the first.",
  },
};

/* ------------------------------------------------------------------ *
 * The two paths, as timed segments
 * ------------------------------------------------------------------ */

export type LegKind = "axon" | "synapse" | "brain" | "muscle";

export interface Leg {
  kind: LegKind;
  /** How long this piece of the journey takes, in milliseconds. */
  ms: number;
  /** Vertex indices into the path's polyline. Equal means the pulse waits here. */
  from: number;
  to: number;
}

export interface PathPlan {
  legs: Leg[];
  totalMs: number;
  synapses: number;
  /** Total nerve travelled, metres. */
  metres: number;
}

function plan(legs: Leg[], metres: number): PathPlan {
  let totalMs = 0;
  let synapses = 0;
  for (const l of legs) {
    totalMs += l.ms;
    if (l.kind === "synapse") synapses++;
  }
  return { legs, totalMs, synapses, metres };
}

/** How much faster the cortex has got with practice, 0 (never) to 1 (expert). */
export function memoryStrength(practice: number): number {
  // The law of practice: big gains early, then diminishing returns.
  return 1 - Math.exp(-practice / 25);
}

export function brainMs(practice: number): number {
  return BRAIN_MS - (BRAIN_MS - BRAIN_MS_PRACTISED) * memoryStrength(practice);
}

export function paths(params: ParamValues): { reflex: PathPlan; voluntary: PathPlan } {
  const spec = STIMULI[params.stimulus as string] ?? STIMULI.heat;
  const myelin = params.myelin as boolean;
  const vSensory = myelin ? spec.velocity : V_UNMYELINATED;
  const vMotor = myelin ? V_MOTOR_MYELINATED : V_UNMYELINATED;
  const think = brainMs(params.practice as number);

  const reflex = plan([
    { kind: "axon", ms: (D_RECEPTOR_TO_CORD / vSensory) * 1000, from: 0, to: 2 },
    { kind: "synapse", ms: SYNAPSE_MS * spec.reflexSynapses, from: 2, to: 3 },
    { kind: "axon", ms: (D_CORD_TO_MUSCLE / vMotor) * 1000, from: 3, to: 5 },
    { kind: "synapse", ms: NMJ_MS, from: 5, to: 5 },
    { kind: "muscle", ms: MUSCLE_MS, from: 5, to: 5 },
  ], D_RECEPTOR_TO_CORD + D_CORD_TO_MUSCLE);

  const voluntary = plan([
    { kind: "axon", ms: (D_RECEPTOR_TO_CORD / vSensory) * 1000, from: 0, to: 2 },
    { kind: "synapse", ms: SYNAPSE_MS, from: 2, to: 2 },
    { kind: "axon", ms: (D_CORD_TO_BRAIN / vSensory) * 1000, from: 2, to: 4 },
    { kind: "synapse", ms: SYNAPSE_MS * 2, from: 4, to: 4 },
    { kind: "brain", ms: think, from: 4, to: 5 },
    { kind: "axon", ms: (D_BRAIN_TO_CORD / vMotor) * 1000, from: 5, to: 7 },
    { kind: "synapse", ms: SYNAPSE_MS, from: 7, to: 7 },
    { kind: "axon", ms: (D_CORD_TO_MUSCLE / vMotor) * 1000, from: 7, to: 9 },
    { kind: "synapse", ms: NMJ_MS, from: 9, to: 9 },
    { kind: "muscle", ms: MUSCLE_MS, from: 9, to: 9 },
  ], D_RECEPTOR_TO_CORD + D_CORD_TO_BRAIN + D_BRAIN_TO_CORD + D_CORD_TO_MUSCLE);

  return { reflex, voluntary };
}

/** Where the pulse is after `ms`: a vertex index with a fraction, or done. */
export function progress(p: PathPlan, ms: number): { vertex: number; kind: LegKind; done: boolean } {
  let acc = 0;
  for (const leg of p.legs) {
    if (ms < acc + leg.ms) {
      const k = leg.ms > 0 ? (ms - acc) / leg.ms : 1;
      return { vertex: leg.from + (leg.to - leg.from) * k, kind: leg.kind, done: false };
    }
    acc += leg.ms;
  }
  const last = p.legs[p.legs.length - 1];
  return { vertex: last.to, kind: last.kind, done: true };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  t: number;
  /** Nerve-time since the stimulus, in milliseconds. -1 means nothing in flight. */
  signalMs: number;
  firing: boolean;
  /** Wait before the next automatic stimulus, seconds. */
  restClock: number;
  fires: number;
  reflexArrivedMs: number;
  voluntaryArrivedMs: number;

  /* the student's own reaction-time trial */
  lightOn: boolean;
  /** Sim time the light came on, or -1 while waiting. */
  onsetAt: number;
  /** Sim time the next light is due. */
  nextLightAt: number;
  lastReactionMs: number;
  bestReactionMs: number;
  meanReactionMs: number;
  trials: number;
  falseStarts: number;

  /* memory */
  shortTerm: number;
  longTerm: number;
}

/** Working memory fades in about twenty seconds unless it is rehearsed. */
const SHORT_TERM_TAU = 20;

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return {
      t: 0,
      signalMs: 0,
      firing: params.mode !== "react",
      restClock: 0,
      fires: 0,
      reflexArrivedMs: -1,
      voluntaryArrivedMs: -1,
      lightOn: false,
      onsetAt: -1,
      nextLightAt: ctx.rng.range(1.5, 3.5),
      lastReactionMs: -1,
      bestReactionMs: -1,
      meanReactionMs: -1,
      trials: 0,
      falseStarts: 0,
      shortTerm: 0,
      longTerm: memoryStrength(params.practice as number),
    };
  },

  applyParams(state, params, prev) {
    let s = state;
    if (params.practice !== prev.practice) {
      s = { ...s, longTerm: memoryStrength(params.practice as number) };
    }
    if (params.mode !== prev.mode) {
      // Switching to the reaction game clears whatever was mid-flight.
      s = { ...s, firing: params.mode !== "react", signalMs: 0, lightOn: false, onsetAt: -1 };
    }
    if (params.stimulus !== prev.stimulus || params.myelin !== prev.myelin) {
      s = { ...s, signalMs: 0, firing: true, reflexArrivedMs: -1, voluntaryArrivedMs: -1 };
    }
    return s;
  },

  step(state, dt, params, ctx, inputs) {
    const rng = ctx.rng;
    const { reflex, voluntary } = paths(params);
    const react = params.mode === "react";
    let s: State = { ...state, t: state.t + Math.max(0, dt) };

    /* --- the student's clicks -------------------------------------- */
    for (const input of inputs) {
      if (input.type !== "pointerdown") continue;
      if (react) {
        if (s.lightOn && s.onsetAt >= 0) {
          const ms = (s.t - s.onsetAt) * 1000;
          const trials = s.trials + 1;
          const mean = s.meanReactionMs < 0 ? ms : (s.meanReactionMs * s.trials + ms) / trials;
          s = {
            ...s,
            lastReactionMs: ms,
            bestReactionMs: s.bestReactionMs < 0 ? ms : Math.min(s.bestReactionMs, ms),
            meanReactionMs: mean,
            trials,
            lightOn: false,
            onsetAt: -1,
            nextLightAt: s.t + rng.range(1.5, 4),
          };
        } else {
          // Jumping the gun does not count, and is worth showing.
          s = { ...s, falseStarts: s.falseStarts + 1, nextLightAt: s.t + rng.range(1.5, 4) };
        }
      } else {
        s = { ...s, firing: true, signalMs: 0, reflexArrivedMs: -1, voluntaryArrivedMs: -1, restClock: 0 };
      }
    }

    if (dt <= 0) return s;

    /* --- the reaction-time light ----------------------------------- */
    if (react) {
      if (!s.lightOn && s.t >= s.nextLightAt) {
        s = { ...s, lightOn: true, onsetAt: s.t };
      }
    }

    /* --- the signal travelling, in slowed-down nerve time ----------- */
    const slow = Math.max(1, params.slowMotion as number);
    if (s.firing) {
      const signalMs = s.signalMs + (dt * 1000) / slow;
      const reflexDone = signalMs >= reflex.totalMs;
      const voluntaryDone = signalMs >= voluntary.totalMs;
      s = {
        ...s,
        signalMs,
        reflexArrivedMs: s.reflexArrivedMs < 0 && reflexDone ? reflex.totalMs : s.reflexArrivedMs,
        voluntaryArrivedMs: s.voluntaryArrivedMs < 0 && voluntaryDone ? voluntary.totalMs : s.voluntaryArrivedMs,
      };
      if (voluntaryDone) {
        s = { ...s, firing: false, restClock: 0, fires: s.fires + 1 };
      }
    } else if (!react && (params.autoRepeat as boolean)) {
      const restClock = s.restClock + dt;
      if (restClock > 1.4) {
        s = { ...s, firing: true, signalMs: 0, restClock: 0, reflexArrivedMs: -1, voluntaryArrivedMs: -1 };
      } else {
        s = { ...s, restClock };
      }
    }

    /* --- memory ----------------------------------------------------- */
    // Every arrival at the cortex drops something into working memory, which
    // then fades unless practice has already written it into long-term store.
    const arrivedNow = s.voluntaryArrivedMs >= 0 && state.voluntaryArrivedMs < 0;
    let shortTerm = s.shortTerm * Math.exp(-dt / SHORT_TERM_TAU);
    if (arrivedNow) shortTerm = Math.min(1, shortTerm + 0.55);
    s = { ...s, shortTerm, longTerm: memoryStrength(params.practice as number) };

    return s;
  },

  readouts(state, params) {
    const { reflex, voluntary } = paths(params);
    const spec = STIMULI[params.stimulus as string] ?? STIMULI.heat;
    const myelin = params.myelin as boolean;
    return [
      {
        key: "reflexTime", label: "Reflex response", quantity: q(reflex.totalMs / 1000, "time"),
        unit: "ms", semantic: "current", graphable: true,
      },
      {
        key: "voluntaryTime", label: "Voluntary response",
        quantity: q(voluntary.totalMs / 1000, "time"),
        unit: "ms", semantic: "field", graphable: true,
      },
      {
        key: "difference", label: "How much slower thinking is",
        quantity: q((voluntary.totalMs - reflex.totalMs) / 1000, "time"),
        unit: "ms", semantic: "time", graphable: true,
      },
      {
        key: "speed", label: "Signal speed",
        quantity: q(myelin ? spec.velocity : V_UNMYELINATED, "velocity"), unit: "m/s",
        semantic: "velocity", graphable: false,
      },
      {
        key: "synapses", label: "Synapses on the long path",
        quantity: q(voluntary.synapses, "count"), semantic: "current",
        graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "yourTime", label: "Your reaction time",
        quantity: q(Math.max(0, state.lastReactionMs) / 1000, "time"), unit: "ms",
        semantic: "time", graphable: true,
      },
      {
        key: "bestTime", label: "Your best",
        quantity: q(Math.max(0, state.bestReactionMs) / 1000, "time"), unit: "ms",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "shortTerm", label: "Working memory", quantity: q(state.shortTerm, "percent"),
        unit: "%", semantic: "field", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const { reflex, voluntary } = paths(params);
    const spec = STIMULI[params.stimulus as string] ?? STIMULI.heat;
    return {
      stimulus: spec.key,
      fibre: spec.fibre,
      myelinated: params.myelin as boolean,
      conductionVelocity: (params.myelin as boolean) ? spec.velocity : V_UNMYELINATED,
      reflexMs: reflex.totalMs,
      voluntaryMs: voluntary.totalMs,
      differenceMs: voluntary.totalMs - reflex.totalMs,
      reflexFaster: reflex.totalMs < voluntary.totalMs,
      speedUp: voluntary.totalMs / reflex.totalMs,
      reflexSynapses: reflex.synapses,
      voluntarySynapses: voluntary.synapses,
      reflexMetres: reflex.metres,
      voluntaryMetres: voluntary.metres,
      brainMs: brainMs(params.practice as number),
      memoryStrength: memoryStrength(params.practice as number),
      shortTerm: state.shortTerm,
      longTerm: state.longTerm,
      signalMs: state.signalMs,
      fires: state.fires,
      trials: state.trials,
      falseStarts: state.falseStarts,
      lastReactionMs: state.lastReactionMs,
      bestReactionMs: state.bestReactionMs,
      meanReactionMs: state.meanReactionMs,
      beatsPrediction: state.bestReactionMs > 0 && state.bestReactionMs < voluntary.totalMs,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

type Pt = [number, number];

/** Normalized stage anchors, x and y in 0..1. */
const NODES = {
  receptor: [0.11, 0.80] as Pt,
  armMid: [0.27, 0.74] as Pt,
  cordIn: [0.485, 0.60] as Pt,
  cordOut: [0.545, 0.60] as Pt,
  cordUp: [0.485, 0.36] as Pt,
  brainS: [0.485, 0.15] as Pt,
  brainM: [0.575, 0.15] as Pt,
  brainDown: [0.575, 0.36] as Pt,
  legMid: [0.74, 0.72] as Pt,
  muscle: [0.90, 0.80] as Pt,
};

const REFLEX_POLY: Pt[] = [NODES.receptor, NODES.armMid, NODES.cordIn, NODES.cordOut, NODES.legMid, NODES.muscle];
const VOLUNTARY_POLY: Pt[] = [
  NODES.receptor, NODES.armMid, NODES.cordIn, NODES.cordUp, NODES.brainS,
  NODES.brainM, NODES.brainDown, NODES.cordOut, NODES.legMid, NODES.muscle,
];

function sp(rc: RenderContext<State>, p: Pt, x0: number, y0: number, w: number, h: number): [number, number] {
  void rc;
  return [x0 + p[0] * w, y0 + p[1] * h];
}

/** Position along a polyline at a fractional vertex index. */
function atVertex(poly: Pt[], v: number, x0: number, y0: number, w: number, h: number): [number, number] {
  const i = Math.max(0, Math.min(poly.length - 1, Math.floor(v)));
  const j = Math.min(poly.length - 1, i + 1);
  const k = Math.max(0, Math.min(1, v - i));
  const a = poly[i];
  const b = poly[j];
  return [x0 + (a[0] + (b[0] - a[0]) * k) * w, y0 + (a[1] + (b[1] - a[1]) * k) * h];
}

/** An axon, drawn with myelin segments and bare nodes of Ranvier between them. */
function drawAxon(
  rc: RenderContext<State>, poly: Pt[], from: number, to: number,
  x0: number, y0: number, w: number, h: number, color: string, myelin: boolean, width: number,
) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.55);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = from; i <= to; i++) {
    const [px, py] = sp(rc, poly[i], x0, y0, w, h);
    if (i === from) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  if (myelin) {
    // Myelin in segments with bare gaps: the structure that makes it fast.
    ctx.strokeStyle = hexA(theme.sci["solid"], 0.85);
    ctx.lineWidth = width * 2.1;
    ctx.lineCap = "butt";
    for (let i = from; i < to; i++) {
      const [ax, ay] = sp(rc, poly[i], x0, y0, w, h);
      const [bx, by] = sp(rc, poly[i + 1], x0, y0, w, h);
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(2, Math.round(len / 26));
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.1) / n;
        const t1 = (k + 0.82) / n;
        ctx.beginPath();
        ctx.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0);
        ctx.lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawSynapse(
  rc: RenderContext<State>, x: number, y: number, r: number, active: boolean,
) {
  const { ctx, theme } = rc;
  ctx.save();
  if (active) glow(ctx, x, y, r * 3, theme.accent, 0.45);
  ctx.fillStyle = active ? theme.accent : hexA(theme.inkSoft, 0.5);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (active) {
    // Vesicles crossing the gap: the reason a synapse costs time at all.
    ctx.fillStyle = hexA(theme.accent, 0.9);
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStopwatch(
  rc: RenderContext<State>, x: number, y: number, w: number,
  title: string, ms: number, total: number, color: string, arrived: boolean,
) {
  const { ctx, theme } = rc;
  const shown = Math.min(ms, total);
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, 46, 7);
  ctx.fill();
  ctx.strokeStyle = arrived ? color : theme.line;
  ctx.lineWidth = arrived ? 2 : 1;
  ctx.stroke();
  // The bar fills as the signal travels, so the race is visible without reading.
  ctx.fillStyle = hexA(color, 0.35);
  roundRect(ctx, x + 2, y + 30, Math.max(0, (w - 4) * (shown / Math.max(1, total))), 12, 5);
  ctx.fill();
  ctx.restore();
  caption(ctx, x + 8, y + 13, title, theme, { size: 10, color: theme.inkSoft });
  caption(ctx, x + w - 8, y + 15, `${shown.toFixed(0)} ms`, theme, {
    align: "right", size: 16, color,
  });
}

function drawMemory(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, state, theme } = rc;
  const h = 54;
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.restore();
  caption(ctx, x + 8, y + 12, "What the brain keeps", theme, { size: 10, color: theme.inkSoft });

  const rows: [string, number, string][] = [
    ["working (seconds)", state.shortTerm, theme.sci["field"]],
    ["long-term (years)", state.longTerm, theme.accent],
  ];
  let ry = y + 26;
  for (const [name, v, color] of rows) {
    ctx.save();
    ctx.fillStyle = hexA(theme.inkSoft, 0.25);
    roundRect(ctx, x + 8, ry, w - 16, 8, 4);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x + 8, ry, Math.max(0, (w - 16) * Math.min(1, Math.max(0, v))), 8, 4);
    ctx.fill();
    ctx.restore();
    caption(ctx, x + 10, ry + 4, name, theme, { size: 8, color: theme.ink });
    ry += 16;
  }
}

function drawBody(rc: RenderContext<State>, x0: number, y0: number, w: number, h: number) {
  const { ctx, theme, state, params } = rc;
  const spec = STIMULI[params.stimulus as string] ?? STIMULI.heat;
  const { reflex, voluntary } = paths(params);
  const myelin = params.myelin as boolean;
  const nerve = theme.sci["current"];
  const think = theme.sci["field"];

  /* --- spinal cord ------------------------------------------------ */
  const [cx, cy] = sp(rc, NODES.cordIn, x0, y0, w, h);
  const [bx, by] = sp(rc, NODES.brainS, x0, y0, w, h);
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
  ctx.lineWidth = Math.max(10, w * 0.028);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.015, by + h * 0.06);
  ctx.lineTo(cx + w * 0.015, cy + h * 0.1);
  ctx.stroke();
  ctx.restore();
  caption(ctx, cx - w * 0.02, cy + h * 0.14, "spinal cord", theme, {
    align: "right", size: 10, color: theme.inkSoft,
  });

  /* --- brain ------------------------------------------------------- */
  const brainR = Math.max(22, w * 0.075);
  glow(ctx, bx + w * 0.045, by, brainR * 2.1, think, 0.18);
  ctx.save();
  ctx.fillStyle = hexA(think, 0.7);
  ctx.beginPath();
  ctx.ellipse(bx + w * 0.045, by, brainR * 1.5, brainR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(think, 0.95);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // Folds, so it reads as a brain rather than a blob.
  ctx.strokeStyle = hexA(mixHex(think, "#000000", 0.4), 0.7);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    const yy = by + i * brainR * 0.34;
    ctx.moveTo(bx + w * 0.045 - brainR * 1.25, yy);
    ctx.bezierCurveTo(
      bx + w * 0.045 - brainR * 0.4, yy - brainR * 0.28,
      bx + w * 0.045 + brainR * 0.4, yy + brainR * 0.28,
      bx + w * 0.045 + brainR * 1.25, yy,
    );
  }
  ctx.stroke();
  ctx.restore();
  caption(ctx, bx + w * 0.045, by - brainR - 10, "brain", theme, { align: "center", size: 11 });

  /* --- the two axon paths ----------------------------------------- */
  drawAxon(rc, VOLUNTARY_POLY, 2, 5, x0, y0, w, h, think, myelin, 3);
  drawAxon(rc, VOLUNTARY_POLY, 5, 7, x0, y0, w, h, think, myelin, 3);
  drawAxon(rc, REFLEX_POLY, 0, 2, x0, y0, w, h, nerve, myelin, 3.6);
  drawAxon(rc, REFLEX_POLY, 2, 5, x0, y0, w, h, nerve, myelin, 3.6);

  /* --- receptor and muscle ---------------------------------------- */
  const [rx, ry] = sp(rc, NODES.receptor, x0, y0, w, h);
  const hot = spec.key === "ache" || spec.key === "heat" ? theme.sci["hot"] : theme.sci["light"];
  const fresh = state.firing && state.signalMs < 40;
  if (fresh) glow(ctx, rx, ry, w * 0.09, hot, 0.5);
  sphere(ctx, rx, ry, Math.max(9, w * 0.028), hot, { glow: fresh ? 0.6 : 0.1 });
  caption(ctx, rx, ry + w * 0.045, "receptor", theme, { align: "center", size: 10, color: theme.inkSoft });

  const [mx, my] = sp(rc, NODES.muscle, x0, y0, w, h);
  const fired = state.reflexArrivedMs >= 0 && state.signalMs >= state.reflexArrivedMs;
  const bulge = fired ? 1.18 : 1;
  ctx.save();
  ctx.fillStyle = theme.sci["force"];
  ctx.beginPath();
  ctx.ellipse(mx, my, w * 0.035 * bulge, w * 0.06 / bulge, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  caption(ctx, mx, my + w * 0.075, "muscle", theme, { align: "center", size: 10, color: theme.inkSoft });

  /* --- the pulses themselves --------------------------------------- */
  const drawPulse = (p: typeof reflex, poly: Pt[], color: string) => {
    if (!state.firing && state.signalMs <= 0) return;
    const pr = progress(p, state.signalMs);
    const [px, py] = atVertex(poly, pr.vertex, x0, y0, w, h);
    if (pr.done && state.signalMs > p.totalMs + 30) return;
    // A tail behind the spike, so direction of travel is never in doubt.
    const tail: { x: number; y: number }[] = [];
    for (let k = 6; k >= 0; k--) {
      const back = progress(p, Math.max(0, state.signalMs - k * 1.4));
      const [tx, ty] = atVertex(poly, back.vertex, x0, y0, w, h);
      tail.push({ x: tx, y: ty });
    }
    comet(ctx, tail, color, 5);
    glow(ctx, px, py, 16, color, 0.55);
    sphere(ctx, px, py, 6, color, { rim: false });
    if (pr.kind === "synapse") drawSynapse(rc, px, py, 5, true);
    if (pr.kind === "brain") {
      caption(ctx, px + 10, py - 16, "deciding…", theme, { size: 10, color: think });
    }
  };
  drawPulse(voluntary, VOLUNTARY_POLY, think);
  drawPulse(reflex, REFLEX_POLY, nerve);

  /* --- the turn at the cord, which is the whole idea ---------------- */
  const [ox, oy] = sp(rc, NODES.cordOut, x0, y0, w, h);
  drawSynapse(rc, (cx + ox) / 2, (cy + oy) / 2, 5, false);
  caption(ctx, (cx + ox) / 2, oy + h * 0.06, "the reflex turns round here", theme, {
    align: "center", size: 10, color: nerve,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const { reflex, voluntary } = paths(params);
  const react = params.mode === "react";

  sky(ctx, width, height, theme, "indoor");

  if (react) {
    /* ---- the reaction-time challenge ----------------------------- */
    const cx = width / 2;
    const cy = height * 0.42;
    const r = Math.min(width, height) * 0.2;
    const lightCol = state.lightOn ? theme.sci["hot"] : theme.inkSoft;
    if (state.lightOn) glow(ctx, cx, cy, r * 2.4, lightCol, 0.6);
    sphere(ctx, cx, cy, r, state.lightOn ? lightCol : mixHex(theme.inkSoft, theme.surface, 0.6), {
      glow: state.lightOn ? 0.6 : 0,
    });
    caption(ctx, cx, cy, state.lightOn ? "CLICK!" : "wait…", theme, {
      align: "center", size: state.lightOn ? 30 : 18,
      color: state.lightOn ? theme.surface : theme.inkSoft, weight: 800,
    });
    caption(ctx, cx, height * 0.13, "Click the moment the light turns on", theme, {
      align: "center", size: 13,
    });

    if (state.lastReactionMs >= 0) {
      badge(ctx, cx, cy + r + 40, `${state.lastReactionMs.toFixed(0)} ms`, theme, {
        align: "center", color: theme.accent, sub: "your last try",
      });
    }
    if (state.bestReactionMs >= 0 && band !== "3-5") {
      caption(ctx, cx, cy + r + 74,
        `best ${state.bestReactionMs.toFixed(0)} ms · ${state.trials} tries · ${state.falseStarts} false starts`,
        theme, { align: "center", size: 11, color: theme.inkSoft });
      caption(ctx, cx, cy + r + 94,
        `the model predicts ${voluntary.totalMs.toFixed(0)} ms of nerve and brain`,
        theme, { align: "center", size: 11, color: theme.sci["field"] });
      caption(ctx, cx, cy + r + 112,
        `a reflex would have taken ${reflex.totalMs.toFixed(0)} ms`,
        theme, { align: "center", size: 11, color: theme.sci["current"] });
    }
    vignette(ctx, width, height, 0.16);
    return;
  }

  /* ---- the two-path race ---------------------------------------- */
  const panelW = band === "3-5" ? 0 : Math.min(190, width * 0.27);
  const stageW = width - panelW;
  drawBody(rc, 0, 0, stageW, height);

  if (panelW > 0) {
    const px = stageW + 8;
    const pw = panelW - 16;
    caption(ctx, px, 16, STIMULI[params.stimulus as string]?.name ?? "", theme, { size: 12 });
    caption(ctx, px, 32, STIMULI[params.stimulus as string]?.fibre ?? "", theme, {
      size: 10, color: theme.inkSoft,
    });
    drawStopwatch(rc, px, 44, pw, "Reflex — through the cord", state.signalMs, reflex.totalMs,
      theme.sci["current"], state.reflexArrivedMs >= 0);
    drawStopwatch(rc, px, 98, pw, "Voluntary — through the brain", state.signalMs, voluntary.totalMs,
      theme.sci["field"], state.voluntaryArrivedMs >= 0);
    caption(ctx, px, 166,
      `${(voluntary.totalMs / reflex.totalMs).toFixed(1)}× slower to think about it`,
      theme, { size: 11, color: theme.ink });
    if (overlays.memory !== false && height > 300) drawMemory(rc, px, 182, pw);
    if (height > 400) {
      caption(ctx, px, 258, `${(params.myelin as boolean) ? "Myelinated" : "No myelin"}`, theme, {
        size: 11, color: theme.sci["solid"],
      });
      caption(ctx, px, 274,
        `${(params.myelin as boolean) ? STIMULI[params.stimulus as string].velocity : V_UNMYELINATED} m/s`,
        theme, { size: 11, color: theme.inkSoft });
    }
  }

  if (band !== "3-5") {
    label(ctx, `slowed down ${Math.round(params.slowMotion as number)}×`, 10, height - 14, theme, {
      size: 10, color: theme.inkSoft,
    });
  }
  if (state.reflexArrivedMs >= 0 && state.voluntaryArrivedMs < 0) {
    const [mx, my] = sp(rc, NODES.muscle, 0, 0, stageW, height);
    label(ctx, "hand already moving", mx, my - stageW * 0.09, theme, {
      align: "center", size: 12, color: theme.sci["current"],
    });
  }
  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const neuronSim: SimManifest<State> = {
  id: "bio.neuron",
  title: "Reflex or Decision?",
  tagline: "Race a reflex against a thought and put a stopwatch on both.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS1-8", "HS-LS1-3"] },
  learningGoals: [
    "Trace a signal from receptor to brain to muscle, naming each step.",
    "Explain why a reflex is faster than a decision, using the path it takes.",
    "Say what a synapse costs in time and why the count matters.",
    "Describe how myelin changes the speed of a nerve signal.",
  ],
  misconceptions: [
    "A reflex is just a very fast decision made by the brain",
    "Nerve signals travel at the speed of electricity in a wire",
    "The brain feels the pain before your hand moves",
    "Reaction time is fixed and cannot be improved",
  ],
  interactionHint: "Click the stage to fire a signal. Switch to Reaction test to race it yourself.",
  tickRate: 60,
  params: {
    stimulus: {
      type: "option", label: "Stimulus",
      options: [
        { value: "tap", label: "Tap on the tendon" },
        { value: "touch", label: "Touch on the skin" },
        { value: "heat", label: "Something hot" },
        { value: "ache", label: "Dull ache" },
      ],
      default: "heat",
      help: "Different receptors send their signals on different fibres, at very different speeds.",
    },
    myelin: {
      type: "boolean", label: "Myelin sheath", default: true,
      bands: ["6-8", "9-12"],
      help: "The fatty insulation that lets a signal jump between gaps instead of crawling.",
    },
    practice: {
      type: "number", label: "Times you have practised", kind: "count",
      min: 0, max: 100, step: 1, default: 0,
      bands: ["6-8", "9-12"],
      help: "Practice does not speed up the nerves. It speeds up the deciding.",
    },
    slowMotion: {
      type: "number", label: "Slow motion", kind: "ratio",
      min: 1, max: 40, step: 1, default: 12,
      marks: [{ value: 1, label: "Real speed" }, { value: 12, label: "12×" }, { value: 40, label: "40×" }],
      help: "Real nerve signals are far too fast to watch.",
    },
    autoRepeat: {
      type: "boolean", label: "Repeat the stimulus", default: true,
    },
    mode: {
      type: "option", label: "Mode",
      options: [
        { value: "compare", label: "Race the two paths" },
        { value: "react", label: "Reaction test" },
      ],
      default: "compare",
    },
  },
  overlays: [
    { key: "memory", label: "Memory stores", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "reflex-vs-voluntary",
      title: "Why is a reflex faster than a decision?",
      question: "Your hand leaves a hot pan before you know it is hot. How can that be?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-8"],
      setup: { stimulus: "heat", myelin: true, practice: 0, slowMotion: 12, autoRepeat: true, mode: "compare" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you watch a single signal.",
          predict: {
            prompt: "Why does a reflex beat a decision to the muscle?",
            options: [
              "Reflex signals travel along faster nerves",
              "The reflex takes a shorter path and never reaches the brain",
              "The brain sends the reflex signal first",
            ],
            correct: 1,
            reveal: "Same nerves, same speed. The reflex simply turns round at the spinal cord, so it misses out the whole trip to the brain and back.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Time both paths",
          instruction: "Watch a few signals and record both times.",
          requireData: 3,
          hints: ["Turn Slow motion up if the pulses move too fast to follow."],
        },
        {
          id: "stimuli",
          phase: "measure",
          title: "Change the stimulus",
          instruction: "Try all four stimuli. Record the reflex time for each.",
          requireData: 7,
          hints: [
            "The dull ache runs on unmyelinated fibres — about a metre a second.",
            "That is why a stubbed toe hurts twice: fast pain, then slow pain.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Where does the time go?",
          instruction: "Compare the number of synapses on each path with the time difference.",
          write: {
            prompt: "Which costs more time on the long path: the extra distance or the thinking?",
            placeholder: "The extra nerve adds about ... ms, but the brain adds about ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say it in one sentence",
          instruction: "Define a reflex using the path, not the speed.",
          write: {
            prompt: "Finish this: a reflex is faster than a voluntary response because ...",
            placeholder: "... the signal never has to ...",
          },
        },
      ],
    },
    {
      id: "myelin",
      title: "What does myelin actually do?",
      question: "Why is a nerve wrapped in fat, and what happens when the wrapping is lost?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS1-8", "HS-LS1-3"],
      setup: { stimulus: "touch", myelin: true, practice: 0, slowMotion: 12, autoRepeat: true, mode: "compare" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Myelin is the fatty sleeve around an axon, with gaps in it.",
          predict: {
            prompt: "Strip the myelin off. How much slower does the signal get?",
            options: ["A little slower", "About twice as slow", "Tens of times slower"],
            correct: 2,
            reveal: "About fifty times slower. With myelin the signal jumps gap to gap; without it, every millimetre has to be rebuilt.",
          },
        },
        {
          id: "with",
          phase: "measure",
          title: "Measure with myelin",
          instruction: "Leave Myelin sheath on. Record the reflex and voluntary times.",
          check: { describe: "Myelin is on", test: (v) => v.params.myelin === true },
          requireData: 2,
        },
        {
          id: "without",
          phase: "measure",
          title: "Now take it away",
          instruction: "Turn Myelin sheath off, keeping everything else the same. Record.",
          check: {
            describe: "Myelin off and the reflex is now slow",
            test: (v) => v.params.myelin === false && (v.facts.reflexMs as number) > 200,
          },
          requireData: 4,
          hints: ["Change only the myelin. That is what makes it a fair test."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the cost",
          instruction: "Multiple sclerosis damages myelin. Use your numbers.",
          write: {
            prompt: "What would losing myelin feel like in everyday life?",
            placeholder: "If my touch signals took ... instead of ..., then ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "beat-the-model",
      title: "Beat the prediction",
      brief: "Get a reaction time faster than the model says your nerves and brain need.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { mode: "react", stimulus: "touch", myelin: true, practice: 0, slowMotion: 12 },
      goal: {
        describe: "Ten honest tries recorded",
        test: (v) => (v.facts.trials as number) >= 10,
      },
      stars: {
        two: {
          describe: "Ten tries with an average under 350 ms",
          test: (v) => (v.facts.trials as number) >= 10 && (v.facts.meanReactionMs as number) < 350,
        },
        three: {
          describe: "Ten tries, average under 300 ms, no more than one false start",
          test: (v) =>
            (v.facts.trials as number) >= 10 &&
            (v.facts.meanReactionMs as number) < 300 &&
            (v.facts.falseStarts as number) <= 1,
        },
      },
      hints: [
        "Guessing when the light will come is a false start, and it does not count.",
        "Your click also has to travel down your arm — that is part of the time you measure.",
      ],
    },
    {
      id: "slowest-signal",
      title: "The slowest signal in the body",
      brief: "Make a reflex that takes longer than one and a half seconds.",
      bands: ["6-8", "9-12"],
      setup: { mode: "compare", stimulus: "ache", myelin: true, slowMotion: 12, practice: 0 },
      goal: {
        describe: "Reflex time above 1500 ms",
        test: (v) => (v.facts.reflexMs as number) > 1500,
      },
      stars: {
        two: {
          describe: "A voluntary response above 2 seconds",
          test: (v) => (v.facts.voluntaryMs as number) > 2000,
        },
        three: {
          describe: "Above 2 seconds, with the reflex still beating the decision",
          test: (v) =>
            (v.facts.voluntaryMs as number) > 2000 && v.facts.reflexFaster === true,
        },
      },
      hints: [
        "Which fibre is thinnest and has no insulation at all?",
        "Myelin is the biggest single lever in this sim.",
      ],
    },
  ],
};
