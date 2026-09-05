import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, dashFlow, hexA, isDarkTheme, metal, plastic,
  softShadow, sphere, vignette,
} from "@ui/scene";
import { chartFrame, lineSeries } from "@ui/charts";

/**
 * The Diagram That Runs — Grade 6, Unit A3.2: a flowchart is a model, and its
 * arrows are predictions you can test.
 *
 * A small drinking-water works — canal intake, coagulant dosing, flocculation,
 * sedimentation, sand filtration with a headloss column, chlorine contact,
 * clearwell — runs as one continuous chemistry: turbidity is removed stage by
 * stage as a real fraction of what arrived, the sand bed's headloss climbs
 * with every megalitre it passes and forces a backwash or a clog, and
 * chlorine residual is whatever a nominal dose leaves after real demand eats
 * into it. The student does not draw the plant on a separate freeform canvas;
 * the student assembles it shape by shape — coagulation, a turbidity-check
 * diamond, sedimentation, filtration, a headloss-check diamond, the backwash
 * loop-back, chlorination, a chlorine-check diamond — and each shape is a
 * real gate on the same chemistry the plant is running. Leave the headloss
 * diamond and its loop out and the filter claims nothing is wrong until the
 * moment it clogs solid; leave the turbidity diamond out and a muddy river
 * day walks straight past sedimentation into the town's water.
 *
 * The honesty rule this sim exists to uphold: nothing here is a picture. The
 * eight shapes are the eight terms of the plant's own chemistry, wired
 * one-for-one — no diagram decoration exists that isn't also a computed gate,
 * and no gate exists that isn't shown as a shape.
 *
 * Clock: `step` receives real/engine seconds. In "Continuous" or "Fast 24 h"
 * mode simulated minutes accrue at the compression dial's rate (Fast 24 h
 * ignores the dial and always runs a full simulated day per real second, so
 * a shift's worth of operation is always within reach). In "Step one token"
 * mode nothing advances on its own; each press of the token walker advances
 * the same chemistry by one fixed parcel-transit's worth of minutes.
 */

/* ------------------------------------------------------------------ *
 * Constants — the plant's own physical and chemical rates
 * ------------------------------------------------------------------ */

const HEADLOSS_BASE = 0.2;      // spec: the column starts at 0.2 m
const HEADLOSS_TRIGGER = 2.0;   // m — a correctly wired plant backwashes here
const HEADLOSS_MAX = 2.5;       // spec: the column tops out at 2.5 m, clogged solid
const HEADLOSS_RATE = 0.00125;  // m per (ML/day) per hour of normal fouling
const HEADLOSS_CLOG_FAULT_RATE = 14; // m/h — a mechanically clogged filter, fast and fixed
const FILTER_EFF_BASE = 0.98;   // fraction of remaining turbidity a clean bed removes

const CHLORINE_DOSE = 1.2;          // mg/L nominal
const CHLORINE_BASE_DEMAND = 0.3;   // mg/L consumed regardless of turbidity
const CHLORINE_NTU_DEMAND = 0.05;   // extra mg/L consumed per NTU carried into contact
const CHLORINE_ALGAL_BONUS = 0.9;   // extra demand an algal bloom adds
const CHLORINE_SAFE_MIN = 0.2;      // mg/L — the safe residual floor

const STEP_MINUTES = 8;         // one manual token-walker press, in sim-minutes
const FAST24_MIN_PER_SEC = 1440; // Fast 24 h always runs a full sim-day per real second
const SAMPLE_MIN = 3;           // history cadence
const HISTORY_MAX = 400;

type Fault = "none" | "filterClogged" | "doserEmpty" | "powerCut" | "algalBloom";
type RunMode = "stepToken" | "continuous" | "fast24h";
type Notation = "flowchart" | "cycle" | "crossSection" | "blackbox";

const NOTATION_ANSWERS_SLUDGE: Record<Notation, boolean> = {
  flowchart: true, cycle: false, crossSection: true, blackbox: false,
};
const NOTATION_LABEL: Record<Notation, string> = {
  flowchart: "Flowchart", cycle: "Cycle diagram", crossSection: "Cross-section schematic", blackbox: "Black box",
};

function clampRange(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/* ------------------------------------------------------------------ *
 * The plant's chemistry — pure functions of the shapes actually wired
 * ------------------------------------------------------------------ */

function flocQuality(params: ParamValues, fault: Fault): number {
  if (params.hasCoagulation !== true) return 0.15; // untreated water flocs poorly on its own
  if (fault === "doserEmpty") return 0.1;           // the chemical is in the diagram, not in the tank
  const raw = params.rawTurbidity as number;
  let quality = 0.85;
  if (raw > 40 && params.hasTurbidityCheck !== true) quality = 0.4; // a muddy day with no extra-dose branch
  if (fault === "algalBloom") quality *= 0.75;
  return quality;
}

/** Outlet turbidity, NTU — a real multiplicative removal chain, stage by stage. */
function outletTurbidity(params: ParamValues, fault: Fault, headloss: number): number {
  const raw = params.rawTurbidity as number;
  const sedRemoval = params.hasSedimentation === true ? 0.6 + 0.35 * flocQuality(params, fault) : 0;
  const afterSed = raw * (1 - sedRemoval);
  const filterEff = params.hasFiltration === true
    ? FILTER_EFF_BASE * clampRange(1 - headloss / HEADLOSS_MAX, 0, 1)
    : 0;
  return afterSed * (1 - filterEff);
}

/** Free-chlorine residual, mg/L — a dose minus a real, load-dependent demand. */
function chlorineResidual(params: ParamValues, fault: Fault, outletNTU: number): number {
  if (params.hasChlorination !== true) return 0.05;
  let demand = CHLORINE_BASE_DEMAND + outletNTU * CHLORINE_NTU_DEMAND;
  if (fault === "algalBloom") demand += CHLORINE_ALGAL_BONUS;
  let residual = CHLORINE_DOSE - demand;
  // The check diamond does not just read the number — it is wired to correct
  // the dose up to a safe floor, which is the whole reason to draw it.
  if (params.hasChlorineCheck === true) residual = Math.max(residual, CHLORINE_SAFE_MIN);
  return Math.max(0, residual);
}

function canBackwash(params: ParamValues): boolean {
  return params.hasHeadlossCheck === true && params.hasBackwashLoop === true && params.shapeLoopBack === true;
}

interface Checkpoint { name: string; ok: boolean }

/** The reality event log's own checkpoints — what a correctly wired plant does. */
function checkpoints(params: ParamValues, fault: Fault, headloss: number): Checkpoint[] {
  const raw = params.rawTurbidity as number;
  const outlet = outletTurbidity(params, fault, headloss);
  const chlorine = chlorineResidual(params, fault, outlet);
  return [
    { name: "coagulant dosed", ok: params.hasCoagulation === true && fault !== "doserEmpty" },
    { name: "turbidity spike handled", ok: raw <= 40 || params.hasTurbidityCheck === true },
    { name: "sedimentation", ok: params.hasSedimentation === true },
    { name: "filtration", ok: params.hasFiltration === true },
    { name: "headloss watched", ok: params.hasHeadlossCheck === true },
    { name: "backwash available", ok: canBackwash(params) },
    { name: "chlorination", ok: params.hasChlorination === true },
    { name: "chlorine residual safe", ok: chlorine >= CHLORINE_SAFE_MIN },
  ];
}

function traceMatchPct(params: ParamValues, fault: Fault, headloss: number): number {
  const cps = checkpoints(params, fault, headloss);
  const matched = cps.filter((c) => c.ok).length;
  return (matched / cps.length) * 100;
}

const STRUCTURAL_KEYS = [
  "hasCoagulation", "hasTurbidityCheck", "hasSedimentation", "hasFiltration",
  "hasHeadlossCheck", "hasBackwashLoop", "hasChlorination", "hasChlorineCheck",
] as const;

function diagramComplexity(params: ParamValues): number {
  let n = 0;
  for (const k of STRUCTURAL_KEYS) if (params[k] === true) n++;
  return n;
}

/** Shapes drawn but not doing anything useful — the auto-check overlay's job. */
function danglingIssues(params: ParamValues): string[] {
  const issues: string[] = [];
  if (params.hasHeadlossCheck === true && !canBackwash(params)) issues.push("headloss check has no loop to act on");
  if (params.hasBackwashLoop === true && params.hasHeadlossCheck !== true) issues.push("backwash loop has no decision routing into it");
  if (params.hasChlorineCheck === true && params.hasChlorination !== true) issues.push("chlorine check has nothing to check");
  return issues;
}

/* ------------------------------------------------------------------ *
 * State — the one continuous stock: the sand bed's headloss
 * ------------------------------------------------------------------ */

interface State {
  headlossM: number;
  backwashCount: number;
  deadlocked: boolean;
  totalMinutes: number;
  sampleClock: number;
  histMin: number[];
  histHeadloss: number[];
  histOutlet: number[];
}

function pushSample(s: State, headloss: number, outlet: number): void {
  const drop = s.histMin.length >= HISTORY_MAX ? 1 : 0;
  s.histMin = s.histMin.slice(drop);
  s.histHeadloss = s.histHeadloss.slice(drop);
  s.histOutlet = s.histOutlet.slice(drop);
  s.histMin.push(s.totalMinutes);
  s.histHeadloss.push(headloss);
  s.histOutlet.push(outlet);
}

function buildWorld(): State {
  const s: State = {
    headlossM: HEADLOSS_BASE, backwashCount: 0, deadlocked: false,
    totalMinutes: 0, sampleClock: 0, histMin: [], histHeadloss: [], histOutlet: [],
  };
  pushSample(s, s.headlossM, outletTurbidity(defaultsForSample(), "none", s.headlossM));
  return s;
}

// A representative sample point for the very first history row, before any
// params are known to init() — this mirrors the manifest's own defaults.
function defaultsForSample(): ParamValues {
  return { hasCoagulation: true, hasSedimentation: true, hasFiltration: true, rawTurbidity: 3 };
}

/** One pure chemistry advance of `minutes` simulated minutes. */
function advancePlant(state: State, minutes: number, params: ParamValues): State {
  const fault = params.faultInjection as Fault;
  const demand = params.townDemand as number;
  let headloss = state.headlossM;
  let backwashCount = state.backwashCount;
  let deadlocked = state.deadlocked;

  if (fault !== "powerCut" && params.hasFiltration === true) {
    const foulingRate = HEADLOSS_RATE * demand; // m/h, ordinary use
    const faultRate = fault === "filterClogged" ? HEADLOSS_CLOG_FAULT_RATE : 0; // m/h, a real fault
    headloss = Math.min(HEADLOSS_MAX, headloss + (foulingRate + faultRate) * (minutes / 60));
  }

  if (headloss >= HEADLOSS_TRIGGER) {
    if (canBackwash(params)) {
      headloss = HEADLOSS_BASE;
      backwashCount++;
      deadlocked = false;
    } else if (headloss >= HEADLOSS_MAX) {
      deadlocked = true;
    }
  }

  const totalMinutes = state.totalMinutes + minutes;
  const outlet = outletTurbidity(params, fault, headloss);
  const next: State = {
    headlossM: headloss, backwashCount, deadlocked, totalMinutes,
    sampleClock: state.sampleClock + minutes,
    histMin: state.histMin, histHeadloss: state.histHeadloss, histOutlet: state.histOutlet,
  };
  while (next.sampleClock >= SAMPLE_MIN) {
    next.sampleClock -= SAMPLE_MIN;
    pushSample(next, headloss, outlet);
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init() {
    return buildWorld();
  },

  step(state, dt, params, _ctx, inputs) {
    let minutes = 0;
    const mode = params.runMode as RunMode;
    for (const input of inputs) {
      if (input.type === "action" && input.action === "stepToken" && mode === "stepToken") {
        minutes += STEP_MINUTES;
      }
    }
    if (dt > 0 && mode !== "stepToken") {
      minutes += mode === "fast24h" ? dt * FAST24_MIN_PER_SEC : dt * (params.compression as number);
    }
    if (minutes <= 0) return state;
    return advancePlant(state, minutes, params);
  },

  readouts(state, params) {
    const fault = params.faultInjection as Fault;
    const outlet = outletTurbidity(params, fault, state.headlossM);
    const chlorine = chlorineResidual(params, fault, outlet);
    const match = traceMatchPct(params, fault, state.headlossM);
    const throughput = state.deadlocked || fault === "powerCut" ? 0 : (params.townDemand as number);
    return [
      { key: "traceMatch", label: "Trace match", unit: "%", quantity: q(match / 100, "percent"), semantic: "primary-consumer", graphable: true },
      { key: "waterDelivered", label: "Water delivered", unit: "ML/day", quantity: q(throughput, "ratio"), semantic: "velocity", graphable: true },
      { key: "outletTurbidity", label: "Outlet turbidity", unit: "NTU", quantity: q(outlet, "ratio"), semantic: "acid", graphable: true },
      { key: "headloss", label: "Filter headloss", unit: "m", quantity: q(state.headlossM, "length"), semantic: "hot", graphable: true },
      { key: "chlorineResidual", label: "Chlorine residual", unit: "mg/L", quantity: q(chlorine, "ratio"), semantic: "cold", graphable: true },
      { key: "diagramComplexity", label: "Diagram complexity", quantity: q(diagramComplexity(params), "count"), semantic: "field" },
      { key: "backwashCount", label: "Backwashes fired", quantity: q(state.backwashCount, "count"), semantic: "producer" },
    ];
  },

  facts(state, params) {
    const fault = params.faultInjection as Fault;
    const outlet = outletTurbidity(params, fault, state.headlossM);
    const chlorine = chlorineResidual(params, fault, outlet);
    const cps = checkpoints(params, fault, state.headlossM);
    const notation = params.notation as Notation;
    const throughput = state.deadlocked || fault === "powerCut" ? 0 : (params.townDemand as number);
    return {
      simDay: state.totalMinutes / 1440,
      totalMinutes: state.totalMinutes,
      headloss: state.headlossM,
      deadlocked: state.deadlocked,
      backwashCount: state.backwashCount,
      canBackwash: canBackwash(params),
      throughputMLday: throughput,
      outletTurbidity: outlet,
      chlorineResidual: chlorine,
      chlorineOk: chlorine >= CHLORINE_SAFE_MIN,
      traceMatchPct: traceMatchPct(params, fault, state.headlossM),
      checkpointsMatched: cps.filter((c) => c.ok).length,
      checkpointsTotal: cps.length,
      diagramComplexity: diagramComplexity(params),
      danglingCount: danglingIssues(params).length,
      notation,
      notationAnswersSludge: NOTATION_ANSWERS_SLUDGE[notation],
      rawTurbidity: params.rawTurbidity as number,
      fault,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 2): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

interface NodeSpec { key: string; label: string; x: number; y: number; kind: "process" | "decision" | "loop" }

const NODES: NodeSpec[] = [
  { key: "hasCoagulation", label: "coagulate", x: 0.5, y: 0.08, kind: "process" },
  { key: "hasTurbidityCheck", label: "turbidity\nhigh?", x: 0.5, y: 0.22, kind: "decision" },
  { key: "hasSedimentation", label: "settle", x: 0.5, y: 0.36, kind: "process" },
  { key: "hasFiltration", label: "filter", x: 0.5, y: 0.5, kind: "process" },
  { key: "hasHeadlossCheck", label: "headloss\nhigh?", x: 0.5, y: 0.64, kind: "decision" },
  { key: "hasBackwashLoop", label: "backwash", x: 0.82, y: 0.64, kind: "loop" },
  { key: "hasChlorination", label: "chlorinate", x: 0.5, y: 0.78, kind: "process" },
  { key: "hasChlorineCheck", label: "residual\nok?", x: 0.5, y: 0.92, kind: "decision" },
];

function drawDiagram(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(14,20,30,0.85)" : "rgba(238,244,250,0.92)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 10, y + 14, "DIAGRAM CANVAS", theme, { size: 9, weight: 800, color: theme.inkSoft });

  const P = (n: NodeSpec) => ({ x: x + w * n.x, y: y + 20 + (h - 34) * n.y });
  // The spine, drawn first so nodes sit on top of it.
  ctx.strokeStyle = hexA(theme.inkSoft, 0.45);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < NODES.length - 1; i++) {
    if (NODES[i].kind === "loop") continue;
    const a = P(NODES[i]), b = P(NODES[i + 1] ?? NODES[i]);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  // The backwash loop-back, only drawn live when both the loop and the
  // palette that offers it are actually present — otherwise it is absent,
  // not merely dim, matching "available shapes" removing it entirely.
  const loopNode = NODES.find((n) => n.key === "hasBackwashLoop")!;
  const headlossNode = NODES.find((n) => n.key === "hasHeadlossCheck")!;
  const filterNode = NODES.find((n) => n.key === "hasFiltration")!;
  if (params.shapeLoopBack === true) {
    const a = P(headlossNode), b = P(loopNode), c = P(filterNode);
    const active = params.hasBackwashLoop === true;
    dashFlow(ctx, [a, b, { x: c.x + 26, y: c.y }, c], active ? theme.sci["velocity"] ?? theme.accent : hexA(theme.inkSoft, 0.35), time * 30, {
      width: active ? 2.2 : 1, dash: active ? 5 : 3, gap: 6, alpha: active ? 0.85 : 0.4,
    });
  }

  for (const n of NODES) {
    const p = P(n);
    const on = params[n.key] === true && (n.key !== "hasBackwashLoop" || params.shapeLoopBack === true);
    const color = on ? (n.kind === "decision" ? theme.sci["acceleration"] ?? theme.accent : theme.sci["primary-consumer"] ?? theme.accent) : theme.inkSoft;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (n.kind === "decision") {
      ctx.beginPath();
      ctx.moveTo(0, -13); ctx.lineTo(26, 0); ctx.lineTo(0, 13); ctx.lineTo(-26, 0);
      ctx.closePath();
    } else if (n.kind === "loop") {
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
    } else {
      roundRect(ctx, -28, -12, 56, 24, 5);
    }
    ctx.fillStyle = on ? hexA(color, 0.22) : hexA(theme.inkSoft, 0.08);
    ctx.fill();
    ctx.strokeStyle = on ? color : hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = on ? 2 : 1.2;
    if (!on) ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const lines = n.label.split("\n");
    lines.forEach((line, i) => {
      caption(ctx, p.x, p.y + (i - (lines.length - 1) / 2) * 10, line, theme, {
        align: "center", size: 8, weight: 700, color: on ? theme.ink : theme.inkSoft,
      });
    });
  }

  // The walking token, purely cosmetic pacing over an honestly-computed path.
  const activeChain = NODES.filter((n) => params[n.key] === true || n.kind !== "loop");
  if (activeChain.length > 1) {
    const t = (time * 0.18) % 1;
    const idxF = t * (NODES.length - 1);
    const i0 = Math.floor(idxF), i1 = Math.min(NODES.length - 1, i0 + 1);
    const a = P(NODES[i0]), b = P(NODES[i1]);
    const f = idxF - i0;
    sphere(ctx, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 4, theme.accent, { rim: false });
  }
}

function drawCutaway(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const dark = isDarkTheme(theme);
  const outlet = outletTurbidity(params, params.faultInjection as Fault, state.headlossM);
  const turbidityTint = clamp01(outlet / 5);

  const stages = [
    { label: "intake", on: true },
    { label: "coagulate", on: params.hasCoagulation === true },
    { label: "settle", on: params.hasSedimentation === true },
    { label: "filter", on: params.hasFiltration === true },
    { label: "chlorinate", on: params.hasChlorination === true },
    { label: "clearwell", on: true },
  ];
  const cw = w / stages.length;
  stages.forEach((st, i) => {
    const sx = x + i * cw;
    softShadow(ctx, () => {
      plastic(ctx, sx + 4, y, cw - 8, h * 0.62, st.on ? "#2e5e78" : "#3a414c", { radius: 5, gloss: 0.2 });
    }, { blur: 6, dy: 2, alpha: 0.25 });
    if (st.on) {
      const tint = i <= 3
        ? `rgba(139,${Math.round(110 - turbidityTint * 60)},${Math.round(70 - turbidityTint * 40)},0.55)`
        : hexA("#3a8fae", 0.4);
      ctx.fillStyle = tint;
      ctx.fillRect(sx + 6, y + h * 0.62 - h * 0.4, cw - 12, h * 0.4);
    }
    caption(ctx, sx + cw / 2, y + h * 0.62 + 12, st.label, theme, { align: "center", size: 9, color: theme.inkSoft });
  });

  // The headloss column — the one true stock in this whole plant.
  const colX = x + w - 26, colY = y - h * 0.05, colH = h * 0.75;
  metal(ctx, colX, colY, 14, colH, "#5d6a76", { radius: 3 });
  const frac = clamp01(state.headlossM / HEADLOSS_MAX);
  const fillH = colH * frac;
  ctx.fillStyle = state.deadlocked ? theme.sci["hot"] : state.headlossM >= HEADLOSS_TRIGGER ? theme.sci["acceleration"] ?? "#e0a030" : theme.sci["cold"] ?? "#4aa3c9";
  ctx.fillRect(colX + 2, colY + colH - fillH, 10, fillH);
  caption(ctx, colX + 7, colY - 8, "headloss", theme, { align: "center", size: 8, color: theme.inkSoft });
  caption(ctx, colX + 7, colY + colH + 10, `${num(state.headlossM, 2)} m`, theme, { align: "center", size: 9, weight: 700, color: dark ? theme.ink : theme.ink });
}

function drawHistory(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  if (state.histMin.length < 2) return;
  const n = state.histMin.length;
  const t0 = state.histMin[0], t1 = Math.max(state.histMin[n - 1], t0 + 1);
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: t0, xMax: t1, yMin: 0, yMax: HEADLOSS_MAX, title: "Headloss over time", yLabel: "m",
  }, theme);
  const pts = state.histMin.map((m, i) => ({ x: m, y: state.histHeadloss[i] }));
  lineSeries(ctx, pts, sx, sy, theme.sci["hot"] ?? theme.accent, { theme, fill: true });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const showHistory = overlays.history !== false;
  const histH = showHistory ? Math.round(height * 0.22) : 0;
  const stageH = height - histH - (showHistory ? 6 : 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);

  drawCutaway(rc, width * 0.04, stageH * 0.1, width * 0.44, stageH * 0.42);
  drawDiagram(rc, width * 0.53, stageH * 0.04, width * 0.43, stageH * 0.58);

  const fault = params.faultInjection as Fault;
  const match = traceMatchPct(params, fault, state.headlossM);
  badge(ctx, 12, 20, `${NOTATION_LABEL[params.notation as Notation]}`, theme, { color: theme.accent });
  badge(ctx, width / 2, 20, `trace match ${Math.round(match)}%`, theme, {
    align: "center", color: match >= 100 ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, width - 12, 20, state.deadlocked ? "DEADLOCKED" : "flowing", theme, {
    align: "right", color: state.deadlocked ? theme.sci["hot"] : theme.sci["neutral"],
  });
  if (fault !== "none") {
    badge(ctx, width / 2, 46, `fault: ${fault}`, theme, { align: "center", color: theme.sci["hot"] });
  }

  if (params.showRealityTrace === true) {
    const cps = checkpoints(params, fault, state.headlossM);
    const px = width * 0.04, py = stageH * 0.58, pw = width * 0.44;
    ctx.save();
    ctx.fillStyle = isDarkTheme(theme) ? "rgba(14,20,30,0.85)" : "rgba(255,255,255,0.9)";
    roundRect(ctx, px, py, pw, stageH * 0.36, 8);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.line, 0.8);
    ctx.stroke();
    ctx.restore();
    caption(ctx, px + 8, py + 12, "REALITY EVENT LOG", theme, { size: 9, weight: 800, color: theme.inkSoft });
    cps.forEach((c, i) => {
      const ly = py + 26 + i * ((stageH * 0.36 - 30) / cps.length);
      sphere(ctx, px + 12, ly, 3.5, c.ok ? theme.sci["neutral"] ?? "#3fae5a" : theme.sci["hot"], { rim: false });
      caption(ctx, px + 22, ly, c.name, theme, { size: 9, color: c.ok ? theme.ink : theme.sci["hot"] });
    });
  }

  if (params.autoCheckArrows === true) {
    const issues = danglingIssues(params);
    if (issues.length > 0) {
      caption(ctx, width * 0.53, stageH * 0.66, `check: ${issues[0]}`, theme, { size: 10, color: theme.sci["hot"], weight: 700 });
    }
  }

  vignette(ctx, width, stageH, 0.16);
  ctx.restore();

  if (showHistory) drawHistory(rc, 8, stageH + 6, width - 16, histH - 6);
  if (params.runMode === "stepToken") {
    caption(ctx, width / 2, stageH - 10, "step mode — advance the token to run the chemistry", theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  rawTurbidity: 3.0, townDemand: 12, runMode: "stepToken", faultInjection: "none",
  showRealityTrace: true, autoCheckArrows: false, compression: 60, notation: "flowchart",
  shapeLoopBack: true,
  hasCoagulation: true, hasTurbidityCheck: true, hasSedimentation: true, hasFiltration: true,
  hasHeadlossCheck: true, hasBackwashLoop: true, hasChlorination: true, hasChlorineCheck: true,
};

export const diagramThatRunsSim: SimManifest<State> = {
  id: "g6.a3-2",
  title: "The Diagram That Runs",
  tagline: "Build a water-treatment flowchart shape by shape and watch a token walk it against the plant's own real chemistry.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS3-3"] },
  learningGoals: [
    "Treat a flowchart as a model whose arrows are testable predictions, not decoration.",
    "Show that a missing decision diamond lets a specific, nameable failure reach the town.",
    "Explain why a loop-back arrow is structurally different from a straight line of boxes.",
  ],
  misconceptions: [
    "A diagram is a picture that decorates an explanation",
    "Any notation can answer any question about a system",
    "A straight-line diagram can represent any real process",
    "Adding more shapes always makes a diagram better",
  ],
  interactionHint: "Toggle shapes on the palette to build the plant, then run the token and watch the reality log for red dots.",
  tickRate: 30,
  timeScale: 1,
  params: {
    rawTurbidity: {
      type: "number", label: "Raw water turbidity", kind: "ratio", unit: "NTU",
      min: 0.5, max: 120, step: 0.5, default: 3.0,
      help: "How dirty the incoming canal water is.",
    },
    townDemand: {
      type: "number", label: "Town demand", kind: "ratio", unit: "ML/day",
      min: 1, max: 40, step: 1, default: 12,
      help: "How hard the filter works, and how fast it fouls.",
    },
    runMode: {
      type: "option", label: "Run mode",
      options: [
        { value: "stepToken", label: "Step one token" },
        { value: "continuous", label: "Continuous" },
        { value: "fast24h", label: "Fast 24 h" },
      ],
      default: "stepToken",
      help: "Whether the chemistry advances on your click, in real time, or a full simulated day at a time.",
    },
    faultInjection: {
      type: "option", label: "Fault injection",
      options: [
        { value: "none", label: "None" },
        { value: "filterClogged", label: "Filter clogged" },
        { value: "doserEmpty", label: "Doser empty" },
        { value: "powerCut", label: "Power cut" },
        { value: "algalBloom", label: "Algal bloom" },
      ],
      default: "none",
      help: "Injects a real plant fault — only a correctly branched diagram survives some of them.",
    },
    showRealityTrace: { type: "boolean", label: "Show reality trace", default: true, help: "The plant's own checkpoint log, shown beside your diagram." },
    autoCheckArrows: { type: "boolean", label: "Auto-check arrows", default: false, help: "Flags a shape that is wired to nothing useful." },
    compression: {
      type: "number", label: "Diagram time compression", kind: "ratio",
      min: 1, max: 2000, step: 1, default: 60,
      help: "Simulated minutes per real second, in Continuous mode only.",
    },
    notation: {
      type: "option", label: "Notation",
      options: [
        { value: "flowchart", label: "Flowchart" },
        { value: "cycle", label: "Cycle diagram" },
        { value: "crossSection", label: "Cross-section schematic" },
        { value: "blackbox", label: "Black box" },
      ],
      default: "flowchart",
      help: "Redraws the same plant. Some notations drop the physical detail needed to answer some questions.",
    },
    shapeLoopBack: { type: "boolean", label: "Palette: loop-back arrow available", default: true, help: "Without this in the palette, no backwash loop can exist at all." },
    hasCoagulation: { type: "boolean", label: "Shape: coagulate", default: true },
    hasTurbidityCheck: { type: "boolean", label: "Shape: turbidity-high? diamond", default: true },
    hasSedimentation: { type: "boolean", label: "Shape: settle", default: true },
    hasFiltration: { type: "boolean", label: "Shape: filter", default: true },
    hasHeadlossCheck: { type: "boolean", label: "Shape: headloss-high? diamond", default: true },
    hasBackwashLoop: { type: "boolean", label: "Shape: backwash loop-back", default: true },
    hasChlorination: { type: "boolean", label: "Shape: chlorinate", default: true },
    hasChlorineCheck: { type: "boolean", label: "Shape: residual-ok? diamond", default: true },
  },
  overlays: [
    { key: "history", label: "Headloss history", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "draw-the-works",
      title: "Draw the works",
      question: "Draw the plant as a flowchart, run one token, and report what percentage of your steps match the reality trace.",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-ESS3-3"],
      setup: {
        ...BASE_SETUP,
        hasHeadlossCheck: false, hasBackwashLoop: false, hasChlorination: false, hasChlorineCheck: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Intake through filtration is built. Headloss, chlorination and their checks are not, yet.",
          predict: {
            prompt: "With only four of the eight shapes placed, what trace-match percentage will you get?",
            options: ["100%", "Around half", "0%"],
            correct: 1,
            reveal: "Around half. Each shape is one of eight checkpoints the reality log tests — four present means four matched, four missed.",
          },
        },
        {
          id: "half-built",
          phase: "measure",
          title: "Run the half-built plant",
          instruction: "Press the token walker a few times and read the trace-match readout.",
          check: { describe: "Trace match reads 50%", test: (v) => Math.abs((v.facts.traceMatchPct as number) - 50) < 0.01 },
          hints: ["Each action press advances the chemistry by one parcel-transit."],
        },
        {
          id: "finish-it",
          phase: "measure",
          title: "Finish the diagram",
          instruction: "Add the headloss check, the backwash loop, chlorination and the residual check.",
          requireData: 1,
          check: { describe: "All eight shapes present, trace match at 100%", test: (v) => (v.facts.traceMatchPct as number) === 100 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name what each missing shape cost",
          instruction: "Think back to the half-built run.",
          write: {
            prompt: "Which of the four missing shapes would you add first if you could only add one, and why that one?",
            placeholder: "I would add ... first because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what scores the diagram",
          instruction: "Finish in your own words.",
          write: {
            prompt: "The outputs table says a working simple diagram beats a working cluttered one. What is a diagram actually scored on here?",
            placeholder: "It is scored on whether the arrows ...",
          },
        },
      ],
    },
    {
      id: "muddy-river-day",
      title: "Muddy river day",
      question: "The raw water goes brown. Which decision diamond does your diagram need, and what reaches the town without it?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP, rawTurbidity: 90, hasTurbidityCheck: false, runMode: "continuous" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the outlet",
          instruction: "Raw turbidity has spiked to 90 NTU. Your diagram has no turbidity-check diamond.",
          predict: {
            prompt: "Will outlet turbidity stay under the 1.0 NTU safe line?",
            options: ["Yes, sedimentation alone handles it", "No, it will read over 1.0 NTU"],
            correct: 1,
            reveal: "No. Without the extra-dose branch, coagulation quality collapses on a muddy day, and sedimentation cannot make up the difference alone.",
          },
        },
        {
          id: "unsafe",
          phase: "measure",
          title: "Confirm the failure",
          instruction: "Run for a few seconds and read outlet turbidity.",
          check: { describe: "Outlet turbidity over the 1.0 NTU line", test: (v) => (v.facts.outletTurbidity as number) > 1.0 },
        },
        {
          id: "add-diamond",
          phase: "measure",
          title: "Add the diamond",
          instruction: "Turn the turbidity-high? diamond on and let it run again.",
          requireData: 1,
          check: { describe: "Outlet turbidity now under 1.0 NTU", test: (v) => (v.facts.outletTurbidity as number) < 1.0 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the fix",
          instruction: "Think about what the diamond actually changes.",
          write: {
            prompt: "The diamond does not remove turbidity itself — so what does it change that fixes the outlet reading?",
            placeholder: "It routes the water into ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the diamond's job",
          instruction: "Finish in your own words.",
          write: {
            prompt: "In one sentence, what does 'the diagram needs a decision diamond here' actually mean?",
            placeholder: "It means the diagram is missing a branch that ...",
          },
        },
      ],
    },
    {
      id: "the-missing-loop",
      title: "The missing loop",
      question: "Throughput falls to zero and stays there. Which single shape would fix it, and why is a straight-line diagram wrong here?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP, faultInjection: "filterClogged", shapeLoopBack: false, runMode: "continuous" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the recovery",
          instruction: "The filter-clogged fault is live, and the loop-back arrow is not even in the palette.",
          predict: {
            prompt: "Will throughput recover on its own?",
            options: ["Yes, eventually", "No, it will stay at zero"],
            correct: 1,
            reveal: "No. Without a loop back to filtration, headloss only ever climbs. Once it maxes out, nothing in a straight-line diagram can bring it down again.",
          },
        },
        {
          id: "clogs",
          phase: "measure",
          title: "Watch it clog",
          instruction: "Run for about ten seconds and watch the headloss column climb.",
          check: { describe: "Deadlocked, throughput at zero", test: (v) => v.facts.deadlocked === true && v.facts.throughputMLday === 0 },
          hints: ["This should take well under a simulated day."],
        },
        {
          id: "add-loop",
          phase: "measure",
          title: "Add the loop back",
          instruction: "Turn the loop-back arrow on in the palette and confirm the backwash shape is placed too, then run on.",
          requireData: 1,
          check: {
            describe: "Recovered: not deadlocked, throughput flowing again",
            test: (v) => v.facts.deadlocked === false && (v.facts.throughputMLday as number) > 0 && (v.facts.backwashCount as number) >= 1,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the straight line's failure",
          instruction: "Think about what a straight line of boxes can and cannot do.",
          write: {
            prompt: "Why can a diagram with only forward arrows never recover from this fault, no matter how many process boxes it has?",
            placeholder: "A straight line can only ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the one shape",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Name the single shape that fixes this, and say what makes it different in kind from every other shape on the palette.",
            placeholder: "The loop-back arrow is different because ...",
          },
        },
      ],
    },
    {
      id: "four-ways-to-draw-one-plant",
      title: "Four ways to draw one plant",
      question: "Ask 'where does the sludge go?' of each notation. Which ones can answer it, and what did each drop to stay readable?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ESS3-3"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the notations",
          instruction: "The same plant is about to be redrawn four ways.",
          predict: {
            prompt: "Which notations can show where the sludge physically goes?",
            options: ["All four", "Flowchart and cross-section only", "None of them"],
            correct: 1,
            reveal: "Flowchart and cross-section only. A cycle diagram abstracts the plant into a loop of relationships, and a black box hides the inside entirely — both drop the physical detail sludge disposal needs.",
          },
        },
        {
          id: "cross-section",
          phase: "measure",
          title: "Try cross-section",
          instruction: "Switch Notation to Cross-section schematic.",
          check: { describe: "Cross-section can answer the sludge question", test: (v) => v.params.notation === "crossSection" && v.facts.notationAnswersSludge === true },
        },
        {
          id: "black-box",
          phase: "measure",
          title: "Try black box",
          instruction: "Switch Notation to Black box.",
          check: { describe: "Black box cannot answer the sludge question", test: (v) => v.params.notation === "blackbox" && v.facts.notationAnswersSludge === false },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Say what each dropped",
          instruction: "Compare all four notations you have now seen.",
          write: {
            prompt: "For the cycle diagram and the black box, name specifically what each one drops to stay readable.",
            placeholder: "The cycle diagram drops ... The black box drops ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why notation is a choice",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Why is picking a notation a real decision about what you can find out, not just a style choice?",
            placeholder: "Because each notation ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "perfect-trace-cheap-diagram",
      title: "Perfect trace, cheap diagram",
      brief: "Reach 100% trace match on ordinary water using at most seven of the eight shapes.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Trace match 100% with raw turbidity at or below 40 NTU and at most 7 shapes",
        test: (v) =>
          (v.facts.traceMatchPct as number) === 100 && (v.facts.diagramComplexity as number) <= 7 &&
          (v.facts.rawTurbidity as number) <= 40,
      },
      stars: {
        two: {
          describe: "With at most 6 shapes",
          test: (v) =>
            (v.facts.traceMatchPct as number) === 100 && (v.facts.diagramComplexity as number) <= 6 &&
            (v.facts.rawTurbidity as number) <= 40,
        },
      },
      hints: [
        "Turbidity only needs the extra-dose diamond above 40 NTU — keep the raw water clean and that shape is optional.",
        "Every other shape is load-bearing at some point in the checkpoint log.",
      ],
    },
    {
      id: "survive-the-clog",
      title: "Survive the clog",
      brief: "Keep the plant flowing through a full simulated day under the filter-clogged fault.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, faultInjection: "filterClogged", runMode: "fast24h" },
      goal: {
        describe: "A full simulated day passes with the plant never deadlocked and at least one backwash fired",
        test: (v) => (v.facts.simDay as number) >= 1 && v.facts.deadlocked === false && (v.facts.backwashCount as number) >= 1,
      },
      stars: {
        two: {
          describe: "Three simulated days, still never deadlocked",
          test: (v) => (v.facts.simDay as number) >= 3 && v.facts.deadlocked === false && (v.facts.backwashCount as number) >= 3,
        },
      },
      hints: ["The loop-back arrow has to be in the palette and wired in before you press play."],
    },
  ],
};
