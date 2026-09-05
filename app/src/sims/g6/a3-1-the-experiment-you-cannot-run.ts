import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import type { UnitKind } from "@engine/units";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, glass, glow, hexA, isDarkTheme, metal,
  particleField, plastic, pulse, softShadow, sphere, vignette, type Particle,
} from "@ui/scene";
import { chartFrame, barSeries } from "@ui/charts";

/**
 * The Experiment You Cannot Run — Grade 6, Unit A3.1: why scientists build
 * models at all.
 *
 * Four sealed cases sit behind glass: a Sierra snowpack, the Long Valley
 * magma chamber, a coast redwood, a near-Earth asteroid. Each has a real
 * governing state model (the ground-truth engine) that runs exactly once,
 * with process noise, at its own fixed pace — a pace this sim never lets any
 * dial touch, because the whole lesson is that reality will not be rushed.
 * The same governing equations also drive a model bench, but there the
 * student can dial in how many of the model's terms run (processes 1-10),
 * how fast simulated days pass (the compression dial, read directly as days
 * per real second), and how many independent noisy repeats to draw. Every
 * medium the student can swap onto the bench — scale physical, computational,
 * mathematical, analogue — carries its own fixed systematic bias and its own
 * floor of irreducible error: more processes shrink that error, never to
 * zero. That is the fraud this sim refuses to commit: a model that is simply
 * reality at high speed. Every prediction visibly misses by some amount, and
 * the amount is computed, not decorated.
 *
 * Internal clock: `step` receives real/engine seconds directly. The reality
 * track always advances at a fixed, non-adjustable pace (REALITY_DAYS_PER_
 * REAL_SEC) — nothing the student touches can change it, matching the welded
 * rewind lever. The model track advances at `compression` simulated days per
 * real second, so at 1,000,000x a multi-month case resolves in a fraction of
 * a tick. Watching reality spends the lab-time budget far faster than
 * running the model does, which is the whole point: the model is what you
 * can afford.
 *
 * The honesty rule: once a case's reality track resolves, its outcome is
 * frozen for the rest of the session — no dial, including Rewind, ever
 * touches it. The model's own frozen result unlocks only when Rewind is on;
 * with Rewind off, sliding Processes, Medium or Repeats after resolution
 * changes nothing measurable, proving the model's lever is real and the
 * reality lever is not.
 */

/* ------------------------------------------------------------------ *
 * Cases — each a governing state model, run once for reality
 * ------------------------------------------------------------------ */

type CaseId = "snowpack" | "magma" | "redwood" | "asteroid";
type Barrier = "slow" | "big" | "dangerous" | "far";
type Medium = "none" | "scale" | "computational" | "mathematical" | "analogue";
type SensorKey = "sensorSnowStake" | "sensorSatellite" | "sensorThermal" | "sensorSeismometer" | "sensorTelescope";

interface CaseDef {
  id: CaseId;
  label: string;
  durationDays: number;   // reality (and the model's own span) run this long
  baseOutcome: number;    // the case's true central value, in its own unit
  realityNoiseSD: number; // reality's one-off process-noise draw
  caseSpread: number;     // characteristic scale of model error for this case
  biasSign: 1 | -1;       // which way an under-resolved model leans
  outcomeUnit: "days" | "km";
  outcomeLabel: string;
  decreasing: boolean;    // does the watched quantity fall (true) or rise (false)?
  barriers: Barrier[];    // which lamps are lit for this case at all
}

// spec: "TOO SLOW, TOO BIG, TOO DANGEROUS, TOO FAR, whichever apply" — the
// four cases apply a different subset, matched to what actually stops a
// student experimenting on the real thing.
const CASE_DEFS: Record<CaseId, CaseDef> = {
  snowpack: {
    id: "snowpack", label: "Sierra snowpack", durationDays: 170, baseOutcome: 172,
    realityNoiseSD: 10, caseSpread: 20, biasSign: -1, outcomeUnit: "days",
    outcomeLabel: "Melt-out day (day of water year)", decreasing: true, barriers: ["slow"],
  },
  magma: {
    id: "magma", label: "Long Valley magma", durationDays: 900, baseOutcome: 900,
    realityNoiseSD: 90, caseSpread: 180, biasSign: 1, outcomeUnit: "days",
    outcomeLabel: "Days to next unrest threshold", decreasing: false,
    barriers: ["slow", "big", "dangerous"],
  },
  redwood: {
    id: "redwood", label: "Coast redwood", durationDays: 650, baseOutcome: 650,
    realityNoiseSD: 60, caseSpread: 120, biasSign: -1, outcomeUnit: "days",
    outcomeLabel: "Days to 2 m seedling height", decreasing: false, barriers: ["slow"],
  },
  asteroid: {
    id: "asteroid", label: "Near-Earth asteroid", durationDays: 120, baseOutcome: 42000,
    realityNoiseSD: 3000, caseSpread: 6000, biasSign: 1, outcomeUnit: "km",
    outcomeLabel: "Miss distance at closest approach", decreasing: false,
    barriers: ["big", "dangerous", "far"],
  },
};
const CASE_ORDER: CaseId[] = ["snowpack", "magma", "redwood", "asteroid"];


/**
 * Which barriers each medium can actually remove. A model sidesteps a
 * barrier only where its own nature genuinely avoids the problem — a scale
 * replica is safe and small but still has to be watched running, so it never
 * clears TOO SLOW; a whiteboard has no size, no risk and does not care about
 * distance, so mathematics clears everything except when the case itself
 * needs watching in real apparatus.
 */
const MEDIUM_REMOVES: Record<Medium, Barrier[]> = {
  none: [],
  scale: ["big", "dangerous"],
  computational: ["slow", "big", "dangerous", "far"],
  mathematical: ["slow", "big", "dangerous", "far"],
  analogue: ["dangerous", "slow"],
};
/** A whiteboard fits two or three relations; a props tray fits fewer still. */
const MEDIUM_MAX_EFFECTIVE: Record<Medium, number> = {
  none: 0, scale: 6, computational: 10, mathematical: 3, analogue: 2,
};
/** Systematic-error fraction of caseSpread at one process (the worst case). */
const MEDIUM_PEAK_FRAC: Record<Medium, number> = {
  none: 0, scale: 0.55, computational: 0.6, mathematical: 0.65, analogue: 0.7,
};
/** The floor: systematic error never reaches this fraction, and never goes below it either. */
const MEDIUM_RESIDUAL_FRAC: Record<Medium, number> = {
  none: 0, scale: 0.22, computational: 0.04, mathematical: 0.18, analogue: 0.32,
};
/** Per-repeat noise fraction — the fresh draw a repeat run actually spends. */
const MEDIUM_NOISE_FRAC: Record<Medium, number> = {
  none: 0, scale: 0.22, computational: 0.12, mathematical: 0.10, analogue: 0.30,
};
const MEDIUM_LABEL: Record<Medium, string> = {
  none: "None", scale: "Scale physical", computational: "Computational",
  mathematical: "Mathematical", analogue: "Analogue",
};
const MEDIUM_ORDER: Medium[] = ["none", "scale", "computational", "mathematical", "analogue"];
/** Geometric decay per effective process — shrinks the systematic term, never to zero. */
const DECAY_BASE = 0.72;

const SENSORS: { key: SensorKey; label: string; sd: number }[] = [
  { key: "sensorSnowStake", label: "Snow stake", sd: 8 },
  { key: "sensorSatellite", label: "Satellite pass", sd: 12 },
  { key: "sensorThermal", label: "Thermal camera", sd: 10 },
  { key: "sensorSeismometer", label: "Seismometer", sd: 14 },
  { key: "sensorTelescope", label: "Telescope", sd: 16 },
];

const HOUR_S = 3600;                    // labBudgetH is stored in SI seconds
const REALITY_DAYS_PER_REAL_SEC = 8;    // fixed — no dial the student holds changes this
const LAB_HOURS_PER_REALITY_DAY = 0.08; // watching reality for a case-day costs this much budget
const LAB_HOURS_PER_MODEL_REPEAT = 0.01; // one model repeat is cheap
const RUN_LOG_MAX = 20;

function clampRange(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function avg(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return xs.length ? s / xs.length : 0;
}

function spreadOf(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let lo = xs[0], hi = xs[0];
  for (const x of xs) { if (x < lo) lo = x; if (x > hi) hi = x; }
  return hi - lo;
}

/** 0-100: how far reality has progressed toward its outcome, given days so far. */
function progressPct(def: CaseDef, days: number): number {
  const frac = clampRange(days / def.durationDays, 0, 1);
  return def.decreasing ? (1 - frac) * 100 : frac * 100;
}

/** The systematic (noise-free) error a medium+process-count combination carries. */
function systematicMagnitude(def: CaseDef, medium: Medium, processes: number): number {
  if (medium === "none") return 0;
  const effN = Math.max(1, Math.min(Math.round(processes), MEDIUM_MAX_EFFECTIVE[medium]));
  const peak = MEDIUM_PEAK_FRAC[medium] * def.caseSpread;
  const resid = MEDIUM_RESIDUAL_FRAC[medium] * def.caseSpread;
  return resid + (peak - resid) * Math.pow(DECAY_BASE, effN - 1);
}

/** One model estimate: the case's true centre, a fixed medium bias, fresh noise. */
function modelEstimate(def: CaseDef, medium: Medium, processes: number, rng: Rng): number {
  const mag = systematicMagnitude(def, medium, processes);
  const noiseSD = MEDIUM_NOISE_FRAC[medium] * def.caseSpread;
  return def.baseOutcome + def.biasSign * mag + rng.normal(0, noiseSD);
}

function barriersRemoved(caseId: CaseId, medium: Medium): Barrier[] {
  const removes = MEDIUM_REMOVES[medium];
  return CASE_DEFS[caseId].barriers.filter((b) => removes.includes(b));
}

function barriersRemaining(caseId: CaseId, medium: Medium): Barrier[] {
  const removed = new Set(barriersRemoved(caseId, medium));
  return CASE_DEFS[caseId].barriers.filter((b) => !removed.has(b));
}

/** Inverse-variance combination: more sensors placed genuinely reduce noise. */
function sensorNoiseSD(params: ParamValues): number | null {
  let invVar = 0;
  let any = false;
  for (const s of SENSORS) {
    if (params[s.key] === true) { invVar += 1 / (s.sd * s.sd); any = true; }
  }
  return any ? Math.sqrt(1 / invVar) : null;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface CaseTrack {
  realityDays: number;
  realityResolved: boolean;
  trueOutcome: number;     // drawn once, frozen forever after
  modelDays: number;
  modelResolved: boolean;
  modelRunIndex: number;   // increments every time Rewind lets the model re-roll
  modelSamples: number[];
  /** The systematic-error magnitude at the moment this result was drawn —
   *  frozen with the samples, so every model-derived number obeys the same
   *  rewind lock instead of some fields quietly staying live. */
  resolvedBias: number;
  sensorAvailable: boolean;
  sensorPct: number;
}

interface RunLogEntry {
  caseId: CaseId;
  medium: Medium;
  processes: number;
  repeats: number;
  predictionMean: number;
  trueOutcome: number;
  error: number;
}

interface State {
  cur: CaseTrack;
  runLog: RunLogEntry[];
}

function freshTrack(trueOutcome: number): CaseTrack {
  return {
    realityDays: 0, realityResolved: false, trueOutcome,
    modelDays: 0, modelResolved: false, modelRunIndex: 0, modelSamples: [], resolvedBias: 0,
    sensorAvailable: false, sensorPct: 0,
  };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const def = CASE_DEFS[params.caseId as CaseId];
  const trueOutcome = def.baseOutcome + rng.normal(0, def.realityNoiseSD);
  return { cur: freshTrack(trueOutcome), runLog: [] };
}

/** How many reality-days the current lab-time budget can still afford. */
function maxAffordableRealityDays(params: ParamValues, cur: CaseTrack): number {
  const budgetH = (params.labBudgetH as number) / HOUR_S;
  const modelCostH = cur.modelResolved ? cur.modelSamples.length * LAB_HOURS_PER_MODEL_REPEAT : 0;
  const realityBudgetH = Math.max(0, budgetH - modelCostH);
  return realityBudgetH / LAB_HOURS_PER_REALITY_DAY;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    // A different case is a different sealed vitrine: everything starts over.
    if (params.caseId !== prev.caseId) return buildWorld(params, ctx.rng);

    const structural =
      params.medium !== prev.medium || params.processes !== prev.processes ||
      params.repeats !== prev.repeats;
    // The model's own rewind lever: it only turns when Rewind is thrown, and
    // only actually does anything once there is a frozen result to redo.
    if (structural && state.cur.modelResolved && params.rewind === true) {
      return {
        ...state,
        cur: {
          ...state.cur, modelDays: 0, modelResolved: false, modelSamples: [],
          modelRunIndex: state.cur.modelRunIndex + 1,
        },
      };
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const def = CASE_DEFS[params.caseId as CaseId];
    const cur: CaseTrack = { ...state.cur };
    let runLog = state.runLog;

    // --- reality: fixed pace, no dial the student holds ever touches it ---
    if (!cur.realityResolved) {
      const maxDays = Math.min(def.durationDays, maxAffordableRealityDays(params, cur));
      cur.realityDays = Math.min(maxDays, cur.realityDays + dt * REALITY_DAYS_PER_REAL_SEC);
      if (cur.realityDays >= def.durationDays - 1e-9) cur.realityResolved = true;
    }

    // --- sensors: a noisy read of only what has happened so far -----------
    const sd = sensorNoiseSD(params);
    if (sd === null) {
      cur.sensorAvailable = false;
      cur.sensorPct = 0;
    } else {
      cur.sensorAvailable = true;
      const truth = progressPct(def, cur.realityDays);
      cur.sensorPct = clampRange(truth + ctx.rng.normal(0, sd), 0, 100);
    }

    // --- the model bench: compression is read directly as days/real-second
    const medium = params.medium as Medium;
    if (medium !== "none" && !cur.modelResolved) {
      const comp = params.compression as number;
      cur.modelDays = Math.min(def.durationDays, cur.modelDays + dt * comp);
      if (cur.modelDays >= def.durationDays - 1e-9) {
        cur.modelResolved = true;
        const n = Math.max(1, Math.round(params.repeats as number));
        const processes = Math.max(1, Math.round(params.processes as number));
        const rng2 = ctx.rng.fork(`model-${params.caseId}-${medium}-${cur.modelRunIndex}`);
        const samples: number[] = [];
        for (let i = 0; i < n; i++) samples.push(modelEstimate(def, medium, processes, rng2));
        cur.modelSamples = samples;
        cur.resolvedBias = systematicMagnitude(def, medium, processes);
        const mean = avg(samples);
        const entry: RunLogEntry = {
          caseId: params.caseId as CaseId, medium, processes, repeats: n,
          predictionMean: mean, trueOutcome: cur.trueOutcome, error: mean - cur.trueOutcome,
        };
        runLog = [...runLog, entry].slice(-RUN_LOG_MAX);
      }
    }

    return { cur, runLog };
  },

  readouts(state, params) {
    const caseId = params.caseId as CaseId;
    const def = CASE_DEFS[caseId];
    const medium = params.medium as Medium;
    const cur = state.cur;
    const hasSamples = cur.modelSamples.length > 0;
    const mean = hasSamples ? avg(cur.modelSamples) : 0;
    const spread = hasSamples ? spreadOf(cur.modelSamples) : 0;
    const predErrValid = cur.realityResolved && hasSamples;
    const predErr = predErrValid ? mean - cur.trueOutcome : 0;
    const isKm = def.outcomeUnit === "km";
    const unitSuffix = isKm ? "km" : "days";
    const kind: UnitKind = isKm ? "length" : "count";
    const toSI = (v: number) => (isKm ? v * 1000 : v);
    const removed = barriersRemoved(caseId, medium).length;
    const bias = cur.resolvedBias;

    return [
      {
        key: "realityDay", label: "Reality clock (days)", quantity: q(cur.realityDays, "count"),
        semantic: "time", graphable: true,
      },
      {
        key: "modelDay", label: "Model clock (days)", quantity: q(cur.modelDays, "count"),
        semantic: "time", graphable: true,
      },
      {
        key: "sensorReading",
        label: cur.sensorAvailable ? "Sensor reading" : "Sensor reading (none placed)",
        quantity: q(cur.sensorAvailable ? cur.sensorPct / 100 : 0, "percent"),
        semantic: "field", graphable: true,
      },
      {
        key: "predictionMean", label: `Model prediction (${unitSuffix})`,
        quantity: hasSamples ? q(toSI(mean), kind) : q(0, kind),
        unit: isKm ? "km" : undefined, semantic: "primary-consumer", graphable: true,
      },
      {
        key: "predictionError", label: `Prediction error (${unitSuffix})`,
        quantity: predErrValid ? q(toSI(predErr), kind) : q(0, kind),
        unit: isKm ? "km" : undefined, semantic: "acid", graphable: true,
      },
      {
        key: "answerSpread", label: `Answer spread (${unitSuffix})`,
        quantity: hasSamples ? q(toSI(spread), kind) : q(0, kind),
        unit: isKm ? "km" : undefined, semantic: "velocity", graphable: true,
      },
      {
        key: "biasContribution", label: `Bias contribution (${unitSuffix})`,
        quantity: q(toSI(bias), kind), unit: isKm ? "km" : undefined, semantic: "hot",
      },
      {
        key: "barriersRemoved", label: "Barriers removed", quantity: q(removed, "count"),
        semantic: "producer", graphable: true,
      },
      {
        key: "labBudget", label: "Lab time remaining", unit: "h",
        quantity: q(Math.max(0, (params.labBudgetH as number) -
          (cur.modelResolved ? cur.modelSamples.length * LAB_HOURS_PER_MODEL_REPEAT : 0) * HOUR_S -
          cur.realityDays * LAB_HOURS_PER_REALITY_DAY * HOUR_S), "time"),
        semantic: "cold", graphable: true,
      },
    ];
  },

  facts(state, params) {
    const caseId = params.caseId as CaseId;
    const def = CASE_DEFS[caseId];
    const medium = params.medium as Medium;
    const cur = state.cur;
    const maxAffordable = maxAffordableRealityDays(params, cur);
    const outOfBudget =
      !cur.realityResolved && maxAffordable < def.durationDays &&
      cur.realityDays >= Math.min(def.durationDays, maxAffordable) - 1e-6;
    const removed = barriersRemoved(caseId, medium);
    const remaining = barriersRemaining(caseId, medium);
    const hasSamples = cur.modelSamples.length > 0;
    const mean = hasSamples ? avg(cur.modelSamples) : 0;
    const spread = hasSamples ? spreadOf(cur.modelSamples) : 0;
    const predictionErrorValid = cur.realityResolved && hasSamples;
    const predictionError = predictionErrorValid ? mean - cur.trueOutcome : 0;
    const interiorVisible = medium === "scale" && params.cutOpen === true;
    const budgetH = (params.labBudgetH as number) / HOUR_S;
    const spentH = cur.realityDays * LAB_HOURS_PER_REALITY_DAY +
      (cur.modelResolved ? cur.modelSamples.length * LAB_HOURS_PER_MODEL_REPEAT : 0);

    return {
      caseId, medium,
      realityDay: cur.realityDays,
      realityResolved: cur.realityResolved,
      modelDay: cur.modelDays,
      modelResolved: cur.modelResolved,
      modelHasResult: hasSamples,
      predictionMean: mean,
      predictionError,
      predictionErrorValid,
      answerSpread: spread,
      biasContribution: cur.resolvedBias,
      barriersRemovedCount: removed.length,
      barriersTotal: def.barriers.length,
      barriersRemainingCount: remaining.length,
      sensorAvailable: cur.sensorAvailable,
      sensorReading: cur.sensorPct,
      outOfBudget,
      labBudgetRemainingH: Math.max(0, budgetH - spentH),
      interiorVisible,
      interiorReading: interiorVisible ? 40 + 30 * (cur.modelDays / def.durationDays) : 0,
      runLogCount: state.runLog.length,
      caseDurationDays: def.durationDays,
      modelRunIndex: cur.modelRunIndex,
      trueOutcomeInternal: cur.trueOutcome,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const MONO = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";

function num(v: number, dp = 1): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A small specimen glyph per case — enough to read at a glance, no more. */
function drawSpecimen(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, id: CaseId, time: number) {
  ctx.save();
  if (id === "snowpack") {
    ctx.fillStyle = "#e7f1f7";
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.6);
    ctx.lineTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a97a2";
    ctx.fillRect(cx - r, cy + r * 0.6, r * 2, r * 0.25);
  } else if (id === "magma") {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "#ffcf7a");
    g.addColorStop(0.5, hexA("#ff7a3c", 0.85 + 0.1 * pulse(time, 0.6)));
    g.addColorStop(1, hexA("#5a2410", 0.2));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "redwood") {
    ctx.strokeStyle = "#5b4130";
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.lineTo(cx, cy - r * 0.2);
    ctx.stroke();
    ctx.fillStyle = "#3d6b3f";
    for (let i = 0; i < 3; i++) {
      const yy = cy - r * 0.2 - i * r * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx, yy - r * 0.55);
      ctx.lineTo(cx - r * (0.7 - i * 0.15), yy + r * 0.15);
      ctx.lineTo(cx + r * (0.7 - i * 0.15), yy + r * 0.15);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.4);
    ctx.fillStyle = "#8a8478";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = r * (0.7 + 0.3 * hash(i, 3));
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

interface VLayout { x: number; y: number; w: number; h: number }

function drawVitrines(rc: RenderContext<State>, vits: VLayout[], activeCase: CaseId, medium: Medium) {
  const { ctx, theme, time } = rc;
  const dark = isDarkTheme(theme);
  CASE_ORDER.forEach((id, i) => {
    const v = vits[i];
    const active = id === activeCase;
    softShadow(ctx, () => {
      metal(ctx, v.x, v.y, v.w, v.h, active ? "#5a6472" : "#3a414c", { radius: 8 });
    }, { blur: active ? 14 : 6, dy: 4, alpha: active ? 0.5 : 0.25 });
    glass(ctx, v.x + 4, v.y + 4, v.w - 8, v.h - 8, 2, theme, { alpha: dark ? 0.1 : 0.18 });
    drawSpecimen(ctx, v.x + v.w / 2, v.y + v.h * 0.42, Math.min(v.w, v.h) * (active ? 0.22 : 0.16), id, time);
    caption(ctx, v.x + v.w / 2, v.y + v.h - 10, CASE_DEFS[id].label, theme, {
      align: "center", size: active ? 10 : 9, weight: active ? 800 : 600,
      color: active ? theme.accent : theme.inkSoft,
    });
    // Barrier lamps: lit red while the lamp still applies, dim once removed.
    const barriers = CASE_DEFS[id].barriers;
    const removedSet = new Set(active ? barriersRemoved(id, medium) : []);
    const lampY = v.y + 12;
    barriers.forEach((b, bi) => {
      const lx = v.x + v.w / 2 + (bi - (barriers.length - 1) / 2) * 16;
      const lit = active ? !removedSet.has(b) : true;
      sphere(ctx, lx, lampY, 4, lit ? "#e5484d" : "#4b535e", { rim: false });
      if (lit && active) glow(ctx, lx, lampY, 8, hexA("#e5484d", 0.35 + 0.2 * pulse(time, 1.4)));
    });
  });
}

function drawApparatus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, medium: Medium, theme: RenderContext<State>["theme"], time: number) {
  const dark = isDarkTheme(theme);
  if (medium === "none") {
    caption(ctx, x + w / 2, y + h / 2, "the bench is empty", theme, { align: "center", size: 11, color: theme.inkSoft });
    return;
  }
  if (medium === "scale") {
    // turntable + tank
    ctx.fillStyle = dark ? "#2a2f37" : "#c9cdd3";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.78, w * 0.24, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    glass(ctx, x + w * 0.5, y + h * 0.18, w * 0.42, h * 0.55, 2, theme, { alpha: dark ? 0.12 : 0.2 });
    ctx.fillStyle = hexA("#3a8fae", 0.55);
    ctx.fillRect(x + w * 0.52, y + h * 0.45, w * 0.38, h * 0.26);
  } else if (medium === "computational") {
    plastic(ctx, x + w * 0.24, y + h * 0.2, w * 0.52, h * 0.4, "#242a33", { radius: 5, gloss: 0.3 });
    ctx.fillStyle = hexA("#8fd7ff", 0.85);
    ctx.fillRect(x + w * 0.28, y + h * 0.24, w * 0.44, h * 0.3);
    ctx.strokeStyle = hexA("#8fd7ff", 0.35 + 0.25 * pulse(time, 1));
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ly = y + h * 0.28 + i * h * 0.06;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, ly);
      ctx.lineTo(x + w * 0.3 + w * (0.1 + hash(i, 9) * 0.24), ly);
      ctx.stroke();
    }
    plastic(ctx, x + w * 0.2, y + h * 0.6, w * 0.6, h * 0.1, "#3a4048", { radius: 4, gloss: 0.2 });
  } else if (medium === "mathematical") {
    ctx.fillStyle = dark ? "#e9ecef" : "#ffffff";
    roundRect(ctx, x + w * 0.2, y + h * 0.16, w * 0.6, h * 0.5, 4);
    ctx.fill();
    ctx.strokeStyle = "#2952a3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.32);
    ctx.lineTo(x + w * 0.4, y + h * 0.32);
    ctx.moveTo(x + w * 0.28, y + h * 0.42);
    ctx.lineTo(x + w * 0.7, y + h * 0.42);
    ctx.moveTo(x + w * 0.28, y + h * 0.52);
    ctx.lineTo(x + w * 0.55, y + h * 0.52);
    ctx.stroke();
  } else {
    plastic(ctx, x + w * 0.22, y + h * 0.35, w * 0.56, h * 0.28, "#8a6f4a", { radius: 6, gloss: 0.15 });
    for (let i = 0; i < 10; i++) {
      sphere(ctx, x + w * (0.3 + hash(i, 4) * 0.4), y + h * (0.4 + hash(i, 5) * 0.18), 2, "#d8cdb8", { rim: false });
    }
    sphere(ctx, x + w * 0.55, y + h * 0.4, 5, "#3a3f46", { rim: true });
  }
}

function histogramBins(samples: readonly number[], nBins: number): { lo: number; hi: number; counts: number[] } {
  if (samples.length === 0) return { lo: 0, hi: 1, counts: [] };
  let lo = samples[0], hi = samples[0];
  for (const s of samples) { if (s < lo) lo = s; if (s > hi) hi = s; }
  if (hi - lo < 1e-6) { hi = lo + 1; }
  const counts = new Array<number>(nBins).fill(0);
  for (const s of samples) {
    const idx = clampRange(Math.floor(((s - lo) / (hi - lo)) * nBins), 0, nBins - 1);
    counts[idx]++;
  }
  return { lo, hi, counts };
}

function drawHistogram(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const samples = state.cur.modelSamples;
  if (samples.length === 0) {
    caption(ctx, x + w / 2, y + h / 2, "no model repeats yet", theme, { align: "center", size: 10, color: theme.inkSoft });
    return;
  }
  const nBins = Math.max(1, Math.min(10, samples.length));
  const { lo, hi, counts } = histogramBins(samples, nBins);
  const maxCount = Math.max(1, ...counts);
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: -0.5, xMax: nBins - 0.5, yMin: 0, yMax: maxCount,
    title: "Answer spread", yLabel: "runs", grid: "y",
  }, theme);
  barSeries(ctx, counts, sx, sy, theme.sci["primary-consumer"] ?? theme.accent, { theme, radius: 2 });
  caption(ctx, x + w - 4, y + h - 2, `${num(lo, 0)}-${num(hi, 0)}`, theme, {
    align: "right", size: 8, color: theme.inkSoft,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, time } = rc;
  const caseId = params.caseId as CaseId;
  const medium = params.medium as Medium;
  const def = CASE_DEFS[caseId];
  const cur = state.cur;
  const showHist = overlays.histogram !== false;
  const histH = showHist ? Math.round(height * 0.24) : 0;
  const stageH = height - histH - (showHist ? 6 : 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);

  // --- the four sealed cases along the back wall ------------------------
  const vitW = Math.min(width * 0.2, 150);
  const vitH = stageH * 0.32;
  const vitGap = (width - vitW * 4) / 5;
  const vits: VLayout[] = CASE_ORDER.map((_, i) => ({
    x: vitGap + i * (vitW + vitGap), y: stageH * 0.05, w: vitW, h: vitH,
  }));
  drawVitrines(rc, vits, caseId, medium);

  // --- the model bench ----------------------------------------------------
  const benchX = width * 0.06, benchY = stageH * 0.46, benchW = width * 0.34, benchH = stageH * 0.42;
  softShadow(ctx, () => {
    plastic(ctx, benchX - 6, benchY - 6, benchW + 12, benchH + 12, isDarkTheme(theme) ? "#1c2028" : "#d7d2c6", { radius: 8, gloss: 0.12 });
  }, { blur: 10, dy: 4, alpha: 0.3 });
  drawApparatus(ctx, benchX, benchY, benchW, benchH, medium, theme, time);
  caption(ctx, benchX + benchW / 2, benchY + benchH + 14, `medium: ${MEDIUM_LABEL[medium]}`, theme, {
    align: "center", size: 10, weight: 700,
  });

  // --- dual-face clock: reality left, model right ------------------------
  const clockY = stageH * 0.44;
  badge(ctx, width * 0.44, clockY, `REALITY  ${num(cur.realityDays, 0)}/${def.durationDays} d`, theme, {
    align: "left", color: cur.realityResolved ? theme.sci["neutral"] : theme.accent,
  });
  badge(ctx, width * 0.44, clockY + 26, `MODEL    ${num(cur.modelDays, 0)}/${def.durationDays} d`, theme, {
    align: "left", color: cur.modelResolved ? theme.sci["neutral"] : theme.sci["field"],
  });

  // --- sensor readout ------------------------------------------------------
  const sensorText = cur.sensorAvailable
    ? `sensor read: ${num(cur.sensorPct, 0)}% progress`
    : "no instrument placed — nothing to read";
  caption(ctx, width * 0.44, clockY + 50, sensorText, theme, { size: 10, color: theme.inkSoft });

  // --- budget bar -----------------------------------------------------------
  const budgetH = (params.labBudgetH as number) / HOUR_S;
  const spentH = cur.realityDays * LAB_HOURS_PER_REALITY_DAY +
    (cur.modelResolved ? cur.modelSamples.length * LAB_HOURS_PER_MODEL_REPEAT : 0);
  const remainFrac = clamp01(1 - spentH / budgetH);
  const barX = width * 0.44, barY = clockY + 62, barW = width * 0.32, barH = 10;
  ctx.fillStyle = hexA(theme.inkSoft, 0.25);
  roundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fill();
  ctx.fillStyle = remainFrac > 0.15 ? theme.sci["neutral"] : theme.sci["hot"];
  roundRect(ctx, barX, barY, barW * remainFrac, barH, 4);
  ctx.fill();
  caption(ctx, barX, barY - 6, `lab time left: ${num(budgetH * remainFrac, 1)} h of ${num(budgetH, 0)} h`, theme, {
    size: 9, color: theme.inkSoft,
  });

  // --- prediction card, only once there is something honest to show -------
  const cardX = width * 0.44, cardY = clockY + 82, cardW = width * 0.32, cardH = stageH * 0.32;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(20,26,34,0.85)" : "rgba(255,255,255,0.9)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  caption(ctx, cardX + 10, cardY + 14, "PREDICTION CARD", theme, { size: 9, weight: 800, color: theme.inkSoft });
  if (cur.modelSamples.length > 0) {
    const mean = avg(cur.modelSamples);
    ctx.save();
    ctx.font = MONO;
    ctx.fillStyle = theme.ink;
    ctx.textBaseline = "middle";
    ctx.fillText(`model: ${num(mean, 0)} ${def.outcomeUnit}`, cardX + 10, cardY + 34);
    if (cur.realityResolved) {
      ctx.fillText(`truth: ${num(cur.trueOutcome, 0)} ${def.outcomeUnit}`, cardX + 10, cardY + 50);
      const err = mean - cur.trueOutcome;
      ctx.fillStyle = theme.sci["acid"];
      ctx.fillText(`error: ${err >= 0 ? "+" : ""}${num(err, 0)} ${def.outcomeUnit}`, cardX + 10, cardY + 66);
    } else {
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText("truth: sealed until reality resolves", cardX + 10, cardY + 50);
    }
    if (cur.modelSamples.length > 1) {
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText(`spread: ${num(spreadOf(cur.modelSamples), 0)} ${def.outcomeUnit} over ${cur.modelSamples.length} runs`, cardX + 10, cardY + 82);
    }
    ctx.restore();
  } else {
    caption(ctx, cardX + 10, cardY + 40, "no model result yet", theme, { size: 10, color: theme.inkSoft });
  }
  if (medium === "scale" && params.cutOpen === true) {
    caption(ctx, cardX + 10, cardY + cardH - 12,
      `interior reading: ${num(40 + 30 * (cur.modelDays / def.durationDays), 0)} — no sensor on the sealed case shows this`,
      theme, { size: 9, color: theme.sci["field"] });
  }

  // --- verdict badge --------------------------------------------------------
  const removedN = barriersRemoved(caseId, medium).length;
  const totalN = def.barriers.length;
  badge(ctx, width - 12, 20, `${removedN}/${totalN} barriers down`, theme, {
    align: "right", color: removedN === totalN && totalN > 0 ? theme.sci["neutral"] : theme.sci["hot"],
  });
  if (params.rewind === true) {
    badge(ctx, width - 12, 46, "rewind: unlocked", theme, { align: "right", color: theme.sci["field"] });
  }

  vignette(ctx, width, stageH, 0.16);
  ctx.restore();

  if (showHist) drawHistogram(rc, 8, stageH + 6, width - 16, histH - 6);

  // Decorative particle drift over the whole scene while the model computes —
  // a purely visual cue that "something is running", never load-bearing.
  if (!cur.modelResolved && medium !== "none") {
    const parts: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const t = (time * 0.4 + hash(i, 22)) % 1;
      parts.push({
        x: benchX + benchW * hash(i, 23), y: benchY + benchH - t * benchH * 0.6,
        r: 1 + hash(i, 24), a: 0.4 * (1 - t),
      });
    }
    particleField(ctx, parts, theme.sci["field"] ?? "#8fd7ff", { alpha: 0.5 });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  caseId: "snowpack", medium: "none", processes: 4, compression: 1000, repeats: 1,
  sensorSnowStake: true, sensorSatellite: false, sensorThermal: false,
  sensorSeismometer: false, sensorTelescope: false,
  rewind: false, cutOpen: false, labBudgetH: 8 * HOUR_S,
};

export const experimentYouCannotRunSim: SimManifest<State> = {
  id: "g6.a3-1",
  title: "The Experiment You Cannot Run",
  tagline: "Watch a sealed reality run once while a model bench reruns the same equations a thousand times faster — and gets some of it wrong.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Explain why a model exists: to do what reality forbids — rewinding, reaching, or risking.",
    "Show that adding processes to a model shrinks its error but never erases it.",
    "Name which barrier (too slow, too big, too dangerous, too far) a given model medium removes, and which it cannot.",
  ],
  misconceptions: [
    "A model is just reality running faster",
    "A better model has zero error",
    "Any model medium can solve any barrier",
    "Repeating a real experiment costs nothing extra",
  ],
  interactionHint: "Pick a case, watch reality's clock crawl, then swap in a model medium and watch it race ahead — and miss.",
  tickRate: 30,
  timeScale: 1,
  params: {
    caseId: {
      type: "option", label: "Reality case",
      options: CASE_ORDER.map((id) => ({ value: id, label: CASE_DEFS[id].label })),
      default: "snowpack",
      help: "Which sealed case is behind the glass — sets which barrier lamps can light at all.",
    },
    medium: {
      type: "option", label: "Model medium",
      options: MEDIUM_ORDER.map((m) => ({ value: m, label: MEDIUM_LABEL[m] })),
      default: "none",
      help: "What appears on the model bench, and which fixed bias it carries.",
    },
    processes: {
      type: "number", label: "Processes included", kind: "count",
      min: 1, max: 10, step: 1, default: 4,
      help: "How many terms of the state model the bench computes. More shrinks error but never to zero.",
    },
    compression: {
      type: "number", label: "Model time compression", kind: "ratio",
      min: 1, max: 1000000, step: 1, default: 1000,
      marks: [
        { value: 1, label: "1x" },
        { value: 1000, label: "1,000x" },
        { value: 1000000, label: "1,000,000x" },
      ],
      help: "Simulated days per real second on the model track only. Reality never speeds up.",
    },
    repeats: {
      type: "number", label: "Repeat runs", kind: "count",
      min: 1, max: 50, step: 1, default: 1,
      help: "How many times the model reruns with fresh noise. Reality stays locked at one.",
    },
    sensorSnowStake: { type: "boolean", label: "Sensor: snow stake", default: true, help: "A single-point surface reading." },
    sensorSatellite: { type: "boolean", label: "Sensor: satellite pass", default: false, help: "A wide but occasional reading." },
    sensorThermal: { type: "boolean", label: "Sensor: thermal camera", default: false, help: "A surface-temperature reading." },
    sensorSeismometer: { type: "boolean", label: "Sensor: seismometer", default: false, help: "A single-point vibration reading." },
    sensorTelescope: { type: "boolean", label: "Sensor: telescope", default: false, help: "A distant optical reading." },
    rewind: {
      type: "boolean", label: "Rewind (model only)", default: false,
      help: "Unlocks the model bench's own re-run. Reality's lever is welded solid regardless.",
    },
    cutOpen: {
      type: "boolean", label: "Cut open", default: false,
      help: "Slices the model object open. Refuses to work on the sealed reality case.",
    },
    labBudgetH: {
      type: "number", label: "Lab time allowed", kind: "time", unit: "h",
      min: 1 * HOUR_S, max: 72 * HOUR_S, step: 1 * HOUR_S, default: 8 * HOUR_S,
      help: "Watching reality spends this budget fast. Running the model barely touches it.",
    },
  },
  overlays: [
    { key: "histogram", label: "Answer spread histogram", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "ask-reality",
      title: "Ask reality",
      question: "How long must you wait for the melt-out date, and how many times can you repeat the season to check it?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The Sierra snowpack case is sealed. At the default 8-hour lab budget, will you see it melt out completely?",
          predict: {
            prompt: "What happens by the end of the default 8-hour lab-time budget?",
            options: [
              "The season finishes well inside budget",
              "The budget runs out before the season finishes",
              "It finishes with no time to spare",
            ],
            correct: 1,
            reveal: "The budget runs out first. Watching reality costs lab time for every day that passes, and a melt season is a lot of days — the bar hits zero long before day 170.",
          },
        },
        {
          id: "budget-out",
          phase: "measure",
          title: "Watch the budget, not the calendar",
          instruction: "Press play and let reality's clock run. Stop as soon as the lab-time bar reads empty.",
          check: {
            describe: "Ran out of lab time before reality resolved",
            test: (v) => v.facts.outOfBudget === true && v.facts.realityResolved === false,
          },
          hints: ["Reality's clock never speeds up, no matter which dial you touch.", "The budget bar is the one that actually stops you."],
        },
        {
          id: "raise-budget",
          phase: "measure",
          title: "Buy more lab time",
          instruction: "Raise Lab time allowed to its maximum and keep running until the case finally resolves.",
          requireData: 1,
          check: {
            describe: "Reality resolved once the budget could afford the whole season",
            test: (v) => v.facts.realityResolved === true,
          },
          hints: ["Only the full 72 hours can afford a season this long."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Count the repeats",
          instruction: "Reality just gave you one melt-out day, once, for a large chunk of your lab-time budget.",
          write: {
            prompt: "If you wanted a second real melt-out date from this same sealed case, what would it cost you — and is that even possible here?",
            placeholder: "Getting a second real season would require ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why reality answers once",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Why can the real snowpack answer this question only once, however much lab time you are given?",
            placeholder: "The real snowpack is not a dial — it ...",
          },
        },
      ],
    },
    {
      id: "speed-it-up",
      title: "Speed it up",
      question: "Thirty melt seasons finish in a heartbeat. What is the spread of melt-out dates, and what did one run hide?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ETS1-4"],
      setup: {
        ...BASE_SETUP, medium: "computational", processes: 6, compression: 1000000, repeats: 30,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the spread",
          instruction: "Thirty computational seasons are about to run almost instantly.",
          predict: {
            prompt: "Will all thirty repeats give the exact same melt-out day?",
            options: ["Yes — same equations give the same answer", "No — each repeat draws its own fresh noise"],
            correct: 1,
            reveal: "No. Every repeat runs the same formula but a fresh noise draw, which is exactly what real year-to-year weather does. A single run would hide that spread completely.",
          },
        },
        {
          id: "resolve",
          phase: "measure",
          title: "Let the model resolve",
          instruction: "Press play and let the model bench reach day 170.",
          check: { describe: "Model resolved", test: (v) => v.facts.modelResolved === true },
        },
        {
          id: "spread",
          phase: "measure",
          title: "Read the spread",
          instruction: "Check the answer-spread readout and the histogram below the stage.",
          requireData: 1,
          check: {
            describe: "A real, nonzero spread across the thirty repeats",
            test: (v) => v.facts.modelHasResult === true && (v.facts.answerSpread as number) > 0.5,
          },
        },
        {
          id: "rewind-and-collapse",
          phase: "analyze",
          title: "Collapse the spread",
          instruction: "Turn Rewind on, then drop Repeat runs to 1 and let it re-run.",
          check: {
            describe: "With one repeat, spread is exactly zero",
            test: (v) =>
              v.params.rewind === true && (v.params.repeats as number) === 1 &&
              v.facts.modelResolved === true && (v.facts.answerSpread as number) === 0,
          },
          hints: ["Without Rewind on first, the slider will not be allowed to touch the frozen result."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what one run hides",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Why does the outputs table say a single run 'has no spread at all' — and why does that matter for trusting a prediction?",
            placeholder: "A single run cannot show ...",
          },
        },
      ],
    },
    {
      id: "cut-it-open",
      title: "Cut it open",
      question: "What can you see inside the model that no instrument on the real chamber can show, and what does the model get wrong?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ETS1-4"],
      setup: {
        ...BASE_SETUP, caseId: "magma", medium: "scale", cutOpen: true, repeats: 5,
        sensorSnowStake: false, sensorThermal: true,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict which barriers fall",
          instruction: "Long Valley's lit barriers are TOO SLOW, TOO BIG and TOO DANGEROUS.",
          predict: {
            prompt: "Which of the three can a scale physical model, cut open, remove?",
            options: ["All three", "Big and dangerous, but not slow", "Only slow"],
            correct: 1,
            reveal: "Big and dangerous. Shrinking it to benchtop size and using safe stand-ins removes both — but the physical apparatus still has to be watched running, with no 1,000,000x dial. Slow stays lit.",
          },
        },
        {
          id: "check-barriers",
          phase: "measure",
          title: "Count the lamps",
          instruction: "Run for a moment and read the barrier counter.",
          check: {
            describe: "Two of three barriers removed, one remains lit",
            test: (v) => (v.facts.barriersRemovedCount as number) === 2 && (v.facts.barriersRemainingCount as number) === 1,
          },
        },
        {
          id: "interior",
          phase: "measure",
          title: "Look inside",
          instruction: "Confirm Cut open is on and the interior reading appears on the prediction card.",
          check: {
            describe: "An interior reading is visible, something no sealed-case sensor shows",
            test: (v) => v.facts.interiorVisible === true && (v.facts.interiorReading as number) > 0,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the interior",
          instruction: "Think about what the thermal camera on the sealed case can and cannot see.",
          write: {
            prompt: "The interior reading has no counterpart among the reality sensors. Why can the model show it and the sealed case never can?",
            placeholder: "A sensor on the sealed case can only reach ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name what stayed lit",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Name the one barrier this scale model could not remove for Long Valley magma, and say why size and safety are not the same problem as speed.",
            placeholder: "Even shrunk and made safe, the model still ...",
          },
        },
      ],
    },
    {
      id: "never-touchable",
      title: "Never touchable",
      question: "You cannot experiment on this object at all. How can two equations still give a miss distance you would bet on?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ETS1-4"],
      setup: {
        ...BASE_SETUP, caseId: "asteroid", medium: "mathematical", processes: 3, repeats: 50,
        sensorSnowStake: false, sensorTelescope: true,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the barrier count",
          instruction: "The asteroid's barriers are TOO BIG, TOO DANGEROUS and TOO FAR.",
          predict: {
            prompt: "How many of the three will a whiteboard of equations remove?",
            options: ["None — a whiteboard can't touch a real object", "All three", "Two of three"],
            correct: 1,
            reveal: "All three. A mathematical model has no size, takes no risk, and does not care about distance — it only needs the numbers a telescope already gave it.",
          },
        },
        {
          id: "check-barriers",
          phase: "measure",
          title: "Confirm the clean sweep",
          instruction: "Run to resolve the model, then check the barrier counter.",
          check: { describe: "All three barriers removed", test: (v) => (v.facts.barriersRemovedCount as number) === 3 },
        },
        {
          id: "bias-floor",
          phase: "measure",
          title: "Find the floor",
          instruction: "Read the bias-contribution readout. It should not be zero.",
          check: {
            describe: "A nonzero systematic error persists even with a clean sweep",
            test: (v) => (v.facts.biasContribution as number) > 0,
          },
        },
        {
          id: "the-whiteboard-ceiling",
          phase: "analyze",
          title: "Push past the whiteboard's limit",
          instruction: "Turn Rewind on first, then raise Processes included to 10.",
          check: {
            describe: "Ten processes on the whiteboard leaves the bias exactly where three did",
            test: (v) => {
              if (v.params.rewind !== true || (v.params.processes as number) < 9 || v.facts.modelResolved !== true) return false;
              const def = CASE_DEFS[v.params.caseId as CaseId];
              const capped = systematicMagnitude(def, "mathematical", 3);
              return Math.abs((v.facts.biasContribution as number) - capped) < 0.05;
            },
          },
          hints: ["A whiteboard only fits two or three relations — extra processes have nowhere to go."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the bet",
          instruction: "Finish in your own words.",
          write: {
            prompt: "You would bet real money on this whiteboard's miss distance. Explain why 'no size, no risk, no distance' is exactly what makes that possible.",
            placeholder: "Because the equations never had to ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "afford-the-impossible",
      title: "Afford the impossible",
      brief: "Using no more than 3 hours of lab time, get a tight computational answer for the snowpack case without ever resolving reality.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, medium: "computational", compression: 1000000 },
      goal: {
        describe: "Computational, 20+ repeats, 8+ processes, spread under 8 days, budget at or below 3 hours",
        test: (v) =>
          v.params.medium === "computational" &&
          (v.params.labBudgetH as number) / HOUR_S <= 3 &&
          (v.params.repeats as number) >= 20 && (v.params.processes as number) >= 8 &&
          v.facts.modelHasResult === true && (v.facts.answerSpread as number) < 8,
      },
      stars: {
        two: {
          describe: "Also at maximum processes",
          test: (v) =>
            v.params.medium === "computational" && (v.params.labBudgetH as number) / HOUR_S <= 3 &&
            (v.params.repeats as number) >= 20 && (v.params.processes as number) === 10 &&
            v.facts.modelHasResult === true && (v.facts.answerSpread as number) < 8,
        },
        three: {
          describe: "And 40 or more repeats",
          test: (v) =>
            v.params.medium === "computational" && (v.params.labBudgetH as number) / HOUR_S <= 3 &&
            (v.params.repeats as number) >= 40 && (v.params.processes as number) === 10 &&
            v.facts.modelHasResult === true && (v.facts.answerSpread as number) < 8,
        },
      },
      hints: [
        "Reality is what costs lab time here — leave it sealed.",
        "More repeats narrow the spread without spending real budget.",
      ],
    },
    {
      id: "every-barrier-down",
      title: "Every barrier down",
      brief: "Find a case and medium that switches off every one of that case's lit barriers.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "All of that case's barriers removed",
        test: (v) =>
          (v.facts.barriersTotal as number) > 0 &&
          v.facts.barriersRemovedCount === v.facts.barriersTotal,
      },
      stars: {
        two: {
          describe: "On a case with at least three barriers",
          test: (v) =>
            (v.facts.barriersTotal as number) >= 3 &&
            v.facts.barriersRemovedCount === v.facts.barriersTotal,
        },
        three: {
          describe: "Using the Mathematical medium specifically",
          test: (v) =>
            (v.facts.barriersTotal as number) >= 3 && v.facts.barriersRemovedCount === v.facts.barriersTotal &&
            v.params.medium === "mathematical",
        },
      },
      hints: [
        "Not every medium removes the same barriers — check which lamps stay lit.",
        "The asteroid and the magma chamber each start with three lit lamps.",
      ],
    },
  ],
};
