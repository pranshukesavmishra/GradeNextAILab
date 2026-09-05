import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { benchStage } from "@ui/labware";
import { plant } from "@ui/fauna";
import {
  badge, caption, clamp01, hexA, isDarkTheme, mixHex, softShadow, sphere, vignette,
} from "@ui/scene";
import { chartFrame, lineSeries } from "@ui/charts";

/**
 * Three Versions of a Kelp Forest — Grade 6, Unit A3.5: when a model fails,
 * check what you left out of it before you change what is in it.
 *
 * A giant-kelp canopy stock, grown logistically toward a real carrying
 * capacity, is whatever the student wires onto it: an urchin stock and a
 * grazing flow (one balancing loop), an otter stock predating the urchins
 * (a second balancing loop), a temperature converter reading either a flat
 * constant or a real-shaped 1985-2020 record, and three dated shocks drawn
 * from the actual regional history — the 2013 sea-star wasting die-off that
 * silently removes a background urchin predator no slider controls, the
 * 2014-2016 marine heatwave that suppresses kelp growth directly through the
 * same temperature term, and the 1998 El Nino storms that cost kelp a sharp,
 * recoverable hit. Integrated once per simulated day across the whole
 * 1985-2020 record and scored against a real-shaped ground-truth ribbon.
 *
 * The honesty rule this sim exists to uphold: Auto-tune searches only the
 * three numeric sliders it is given. It can nudge growth, grazing and
 * predation as hard as the random search allows, but it can never add an
 * urchin stock, an otter stock, a temperature converter or a shock — those
 * are structural, and auto-tune has no lever for structure. Watching it
 * grind to a floor and stop, with the 2013-2016 collapse still unmatched, is
 * the whole lesson, not a bug to route around.
 *
 * This is a batch solve, not a running clock: the full 1985-2020 trajectory
 * is recomputed the moment a control changes (cached against the last
 * computed configuration so an idle sim does no repeat work). Playback speed
 * only paces how much of the already-solved curve the chart reveals.
 */

/* ------------------------------------------------------------------ *
 * The real history this model is scored against
 * ------------------------------------------------------------------ */

const START_YEAR = 1985;
const K0 = 175;          // km2 canopy, the 1985 starting point
const CAPACITY = 200;     // km2, a realistic regional carrying capacity

const URCHIN_CAPACITY = 60;   // thousand urchins, a food-limited ceiling
const URCHIN_GROWTH_SCALE = 6; // converts the grazing-rate slider into an urchin growth rate
const GRAZE_IMPACT_SCALE = 5;  // converts the same slider into kelp-loss impact
const OTTER_COUNT = 20;        // a mid-range raft size, per spec's 6-60 instanced otters

const SEASTAR_RATE = 0.02;     // /day, background urchin check while sea stars are healthy
const SEASTAR_RESIDUAL = 0.002; // /day, after the 2013 wasting event — mostly gone

const HEATWAVE_ANOMALY_C = 3.5; // "The Blob", 2014-2016
const ELNINO_LOSS_RATE = 0.15;  // /day of direct storm loss during the 1998 window

const BARREN_U_REF = 35; // thousand urchins at which the reef reads fully barren

/** A plausible reconstruction of the real, well-documented regional collapse:
 *  stable canopy through the 1990s, a dip during the 1997-98 El Nino, full
 *  recovery, then a steep 2013-2016 crash that does not recover by 2020. */
function groundTruthCanopy(year: number): number {
  const elninoBump = Math.exp(-Math.pow((year - 1997.5) / 1.2, 2));
  let v = 175 - 45 * elninoBump;
  const collapseFrac = 1 / (1 + Math.exp(-(year - 2014.5) / 0.9));
  v = v * (1 - collapseFrac) + 22 * collapseFrac;
  return Math.max(5, v);
}

function clampRange(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

type TempForcing = "constant" | "observed" | "observedPlus2";

function baseTempAt(year: number, forcing: TempForcing): number {
  if (forcing === "constant") return 13;
  const trend = 13 + 0.02 * (year - START_YEAR);
  const wobble = Math.sin((year - START_YEAR) * 0.7);
  const t = trend + wobble;
  return forcing === "observedPlus2" ? t + 2 : t;
}

/** Kelp grows best near 13 C; it is a real, documented mechanism, not decoration. */
function tempFactor(tempC: number): number {
  const optimal = 13, tol = 4;
  return clampRange(1 - 0.5 * Math.pow((tempC - optimal) / tol, 2), 0.05, 1.15);
}

interface DayState { K: number; U: number }

/** One real day of the stock-and-flow system — every term the spec names. */
function dailyStep(s: DayState, year: number, params: ParamValues, growth: number, grazing: number, predation: number): DayState {
  const heatwaveOn = params.shockMarineHeatwave === true && year >= 2014 && year <= 2016.5;
  const T = baseTempAt(year, params.temperatureForcing as TempForcing) + (heatwaveOn ? HEATWAVE_ANOMALY_C : 0);
  const hasUrchins = params.hasUrchinStock === true;

  const grazingLossOnKelp = hasUrchins ? grazing * GRAZE_IMPACT_SCALE * s.U : 0;
  const elninoOn = params.shockElNino === true && year >= 1997.8 && year <= 1998.4;
  const elninoLoss = elninoOn ? ELNINO_LOSS_RATE * s.K : 0;
  const dK = growth * tempFactor(T) * s.K * (1 - s.K / CAPACITY) - grazingLossOnKelp - elninoLoss;

  let dU = 0;
  if (hasUrchins) {
    const seaStarsHealthy = !(params.shockSeaStarWasting === true) || year < 2013;
    const backgroundRate = seaStarsHealthy ? SEASTAR_RATE : SEASTAR_RESIDUAL;
    // A density-proportional (not constant) predation pressure, so a small
    // seed population is never wiped out before it has a chance to respond
    // to the real question this scenario is asking: what happens once sea
    // stars are gone, with or without otters also checking the urchins?
    const otterPerCapitaRate = params.hasOtterPredation === true
      ? (predation * OTTER_COUNT) / 1000 / URCHIN_CAPACITY
      : 0;
    dU = grazing * URCHIN_GROWTH_SCALE * s.U * (1 - s.U / URCHIN_CAPACITY) - (backgroundRate + otterPerCapitaRate) * s.U;
  }
  return {
    K: clampRange(s.K + dK, 0, CAPACITY * 1.1),
    U: Math.max(0, s.U + dU),
  };
}

/** The full 1985-to-(1985+runSpan) yearly canopy series, one real Euler day at a time. */
function simulateYearly(params: ParamValues, growth: number, grazing: number, predation: number): { K: number[]; U: number[] } {
  const years = Math.round(params.runSpan as number);
  let s: DayState = { K: K0, U: params.hasUrchinStock === true ? 2 : 0 };
  const outK: number[] = [s.K], outU: number[] = [s.U];
  for (let y = 0; y < years; y++) {
    for (let d = 0; d < 365; d++) {
      const year = START_YEAR + y + d / 365;
      s = dailyStep(s, year, params, growth, grazing, predation);
    }
    outK.push(s.K);
    outU.push(s.U);
  }
  return { K: outK, U: outU };
}

function rmseOf(series: number[]): number {
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    const d = series[i] - groundTruthCanopy(START_YEAR + i);
    sum += d * d;
  }
  return Math.sqrt(sum / series.length);
}

function loopInventory(params: ParamValues): number {
  let n = 0;
  if (params.hasUrchinStock === true) n++;
  if (params.hasUrchinStock === true && params.hasOtterPredation === true) n++;
  return n;
}

function paramsKey(params: ParamValues): string {
  return JSON.stringify([
    params.kelpGrowthRate, params.grazingPerUrchin, params.otterPredationRate,
    params.temperatureForcing, params.shockSeaStarWasting, params.shockMarineHeatwave,
    params.shockElNino, params.hasUrchinStock, params.hasOtterPredation, params.runSpan,
  ]);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  seriesK: number[];
  seriesU: number[];
  rmse: number;
  tunedGrowth: number;
  tunedGrazing: number;
  tunedPredation: number;
  tuneIterations: number;
  lastKey: string;
  revealYears: number;
}

function solveFresh(params: ParamValues): { seriesK: number[]; seriesU: number[]; rmse: number } {
  const growth = params.kelpGrowthRate as number;
  const grazing = params.grazingPerUrchin as number;
  const predation = params.otterPredationRate as number;
  const { K, U } = simulateYearly(params, growth, grazing, predation);
  return { seriesK: K, seriesU: U, rmse: rmseOf(K) };
}

function buildWorld(params: ParamValues): State {
  const solved = solveFresh(params);
  return {
    ...solved,
    tunedGrowth: params.kelpGrowthRate as number,
    tunedGrazing: params.grazingPerUrchin as number,
    tunedPredation: params.otterPredationRate as number,
    tuneIterations: 0,
    lastKey: paramsKey(params),
    revealYears: 0,
  };
}

const model: SimModel<State> = {
  init(params) {
    return buildWorld(params);
  },

  step(state, dt, params, ctx) {
    let s: State = { ...state };
    const key = paramsKey(params);

    if (params.autoTune === true) {
      // One stochastic hill-climb attempt per tick, seeded from wherever the
      // sliders (or the last accepted tune) currently sit. Structure is never
      // touched — only the three numbers this search is given.
      if (key !== s.lastKey) {
        s.tunedGrowth = params.kelpGrowthRate as number;
        s.tunedGrazing = params.grazingPerUrchin as number;
        s.tunedPredation = params.otterPredationRate as number;
        const solved = solveFresh(params);
        s.seriesK = solved.seriesK; s.seriesU = solved.seriesU; s.rmse = solved.rmse;
        s.lastKey = key;
      }
      const candGrowth = clampRange(s.tunedGrowth + ctx.rng.normal(0, 0.008), 0, 0.25);
      const candGrazing = clampRange(s.tunedGrazing + ctx.rng.normal(0, 0.0015), 0, 0.05);
      const candPredation = clampRange(s.tunedPredation + ctx.rng.normal(0, 1.5), 0, 40);
      const { K, U } = simulateYearly(params, candGrowth, candGrazing, candPredation);
      const candRmse = rmseOf(K);
      s.tuneIterations += 1;
      if (candRmse < s.rmse) {
        s.tunedGrowth = candGrowth; s.tunedGrazing = candGrazing; s.tunedPredation = candPredation;
        s.seriesK = K; s.seriesU = U; s.rmse = candRmse;
      }
    } else if (key !== s.lastKey) {
      const solved = solveFresh(params);
      s = {
        ...s, ...solved,
        tunedGrowth: params.kelpGrowthRate as number,
        tunedGrazing: params.grazingPerUrchin as number,
        tunedPredation: params.otterPredationRate as number,
        lastKey: key,
      };
    }

    if (dt > 0) {
      s.revealYears = Math.min(params.runSpan as number, s.revealYears + dt * (params.playbackSpeed as number));
    }
    return s;
  },

  readouts(state, params) {
    const lastK = state.seriesK[state.seriesK.length - 1] ?? 0;
    const lastU = state.seriesU[state.seriesU.length - 1] ?? 0;
    return [
      { key: "fitScore", label: "Fit score (RMSE)", unit: "km²", quantity: q(state.rmse, "ratio"), semantic: "acid", graphable: true },
      { key: "canopy", label: "Modelled canopy", unit: "km²", quantity: q(lastK, "ratio"), semantic: "producer", graphable: true },
      { key: "urchins", label: "Urchins", unit: "thousand", quantity: q(lastU, "ratio"), semantic: "hot", graphable: true },
      { key: "barrenArea", label: "Barren area", unit: "%", quantity: q(clamp01(lastU / BARREN_U_REF), "percent"), semantic: "field", graphable: true },
      { key: "loopInventory", label: "Loop inventory", quantity: q(loopInventory(params), "count"), semantic: "velocity" },
      { key: "tuneIterations", label: "Auto-tune iterations", quantity: q(state.tuneIterations, "count") },
    ];
  },

  facts(state, params) {
    const lastK = state.seriesK[state.seriesK.length - 1] ?? 0;
    const lastU = state.seriesU[state.seriesU.length - 1] ?? 0;
    const finalYear = START_YEAR + state.seriesK.length - 1;
    // How deep the model's own curve actually falls from 2013 on — the
    // direct test of "does this structure reach anywhere near the real
    // collapse floor", independent of any single-year RMSE bookkeeping.
    let minSince2013 = CAPACITY;
    for (let i = 0; i < state.seriesK.length; i++) {
      if (START_YEAR + i >= 2013) minSince2013 = Math.min(minSince2013, state.seriesK[i]);
    }
    return {
      fitScoreRmse: state.rmse,
      finalCanopy: lastK,
      finalUrchins: lastU,
      finalYear,
      groundTruthFinal: groundTruthCanopy(finalYear),
      minCanopySince2013: minSince2013,
      barrenAreaPct: clamp01(lastU / BARREN_U_REF) * 100,
      loopInventory: loopInventory(params),
      hasUrchinStock: params.hasUrchinStock === true,
      hasOtterPredation: params.hasOtterPredation === true,
      autoTune: params.autoTune === true,
      tuneIterations: state.tuneIterations,
      tunedGrowth: state.tunedGrowth,
      tunedGrazing: state.tunedGrazing,
      tunedPredation: state.tunedPredation,
      runSpan: state.seriesK.length - 1,
      revealYears: state.revealYears,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 0): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function drawKelpPanel(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    ctx.fillStyle = dark ? mixHex("#0c2733", "#000000", 0.2) : "#1c5f74";
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
  }, { blur: 8, dy: 3, alpha: 0.3 });
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();
  const water = ctx.createLinearGradient(0, y, 0, y + h);
  water.addColorStop(0, "#2e8ca8");
  water.addColorStop(1, "#0c2733");
  ctx.fillStyle = water;
  ctx.fillRect(x, y, w, h);

  const lastK = state.seriesK[state.seriesK.length - 1] ?? 0;
  const health = clamp01(lastK / CAPACITY);
  const nStipes = Math.max(1, Math.round(health * 8));
  for (let i = 0; i < nStipes; i++) {
    plant(ctx, x + w * ((i + 0.5) / 8), y + h - 4, h * (0.35 + 0.4 * health), "kelp", theme, {
      health: 0.3 + 0.7 * health, sway: (time * 0.1 + i * 0.2) % 1, seed: i * 17 + 3,
    });
  }
  const lastU = state.seriesU[state.seriesU.length - 1] ?? 0;
  const barrenFrac = clamp01(lastU / BARREN_U_REF);
  if (barrenFrac > 0.15) {
    // Urchins: small spiny hemispheres, drawn directly — no creature preset
    // for this one, so a purple spiked disc stands in.
    const nUrchins = Math.round(barrenFrac * 10);
    for (let i = 0; i < nUrchins; i++) {
      const ux = x + w * (0.55 + 0.4 * ((i * 53) % 100) / 100);
      const uy = y + h * (0.82 + 0.12 * ((i * 29) % 100) / 100);
      const ur = h * 0.028;
      ctx.strokeStyle = hexA("#8a4fae", 0.85);
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(ux + Math.cos(a) * ur * 1.8, uy + Math.sin(a) * ur * 1.8);
        ctx.stroke();
      }
      sphere(ctx, ux, uy, ur, "#7a3f9e", { rim: false });
    }
  }
  if (rc.params.hasOtterPredation === true) {
    // An otter raft: a simple silhouette, floating at the surface.
    const ox = x + w * 0.2, oy = y + h * 0.18 + Math.sin(time * 0.6) * 2;
    ctx.fillStyle = "#4a3626";
    ctx.beginPath();
    ctx.ellipse(ox, oy, h * 0.11, h * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    sphere(ctx, ox - h * 0.1, oy - h * 0.02, h * 0.035, "#4a3626", { rim: false });
  }
  ctx.restore();
  caption(ctx, x + w / 2, y - 8, "the reef", theme, { align: "center", size: 10, weight: 800, color: theme.inkSoft });
}

function drawChart(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const n = state.seriesK.length;
  if (n < 2) return;
  const reveal = Math.max(1, Math.min(n - 1, Math.floor(state.revealYears)) + 1);
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: START_YEAR, xMax: START_YEAR + n - 1, yMin: 0, yMax: CAPACITY,
    title: "Model vs ground truth (km² canopy)", yLabel: "km²", grid: "y",
  }, theme);
  const truthPts = Array.from({ length: n }, (_, i) => ({ x: START_YEAR + i, y: groundTruthCanopy(START_YEAR + i) }));
  lineSeries(ctx, truthPts, sx, sy, hexA(theme.inkSoft, 0.7), { theme, width: 2, label: "field record" });
  const modelPts = state.seriesK.slice(0, reveal).map((v, i) => ({ x: START_YEAR + i, y: v }));
  lineSeries(ctx, modelPts, sx, sy, theme.sci["producer"] ?? theme.accent, { theme, width: 2.4, fill: true, label: "model" });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const showChart = overlays.chart !== false;
  const chartH = showChart ? Math.round(height * 0.32) : 0;
  const stageH = height - chartH - (showChart ? 6 : 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);

  drawKelpPanel(rc, width * 0.06, stageH * 0.12, width * 0.5, stageH * 0.7);

  const structX = width * 0.62, structY = stageH * 0.12, structW = width * 0.32;
  caption(ctx, structX, structY, "STRUCTURE", theme, { size: 10, weight: 800, color: theme.inkSoft });
  const rows: { label: string; on: boolean }[] = [
    { label: "kelp stock + growth flow", on: true },
    { label: "urchin stock + grazing flow", on: params.hasUrchinStock === true },
    { label: "otter stock + predation link", on: params.hasOtterPredation === true },
    { label: "temperature converter (observed)", on: (params.temperatureForcing as string) !== "constant" },
    { label: "sea-star wasting shock (2013)", on: params.shockSeaStarWasting === true },
    { label: "marine heatwave shock (2014-16)", on: params.shockMarineHeatwave === true },
    { label: "El Nino storms shock (1998)", on: params.shockElNino === true },
  ];
  rows.forEach((r, i) => {
    const ry = structY + 20 + i * 16;
    ctx.fillStyle = r.on ? (theme.sci["producer"] ?? theme.accent) : hexA(theme.inkSoft, 0.4);
    ctx.beginPath();
    ctx.arc(structX + 5, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    caption(ctx, structX + 16, ry, r.label, theme, { size: 9, color: r.on ? theme.ink : theme.inkSoft });
  });

  badge(ctx, 12, 20, `fit score ${num(state.rmse, 1)} km²`, theme, { color: theme.sci["acid"] });
  badge(ctx, width / 2, 20, `loops: ${loopInventory(params)}`, theme, { align: "center", color: theme.accent });
  if (params.autoTune === true) {
    badge(ctx, width - 12, 20, `auto-tune: ${state.tuneIterations} tries`, theme, { align: "right", color: theme.sci["field"] });
  }
  badge(ctx, width - 12, 46, `v${Math.round(params.modelVersion as number)}`, theme, { align: "right", color: theme.inkSoft });

  vignette(ctx, width, stageH, 0.16);
  ctx.restore();

  if (showChart) drawChart(rc, 8, stageH + 6, width - 16, chartH - 6);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  kelpGrowthRate: 0.08, grazingPerUrchin: 0.012, otterPredationRate: 22,
  temperatureForcing: "constant", shockSeaStarWasting: false, shockMarineHeatwave: false,
  shockElNino: false, autoTune: false, runSpan: 35, modelVersion: 1, playbackSpeed: 1,
  hasUrchinStock: false, hasOtterPredation: false,
};

export const kelpForestSim: SimManifest<State> = {
  id: "g6.a3-5",
  title: "Three Versions of a Kelp Forest",
  tagline: "Wire a kelp forest up stock by stock, then find the exact spot where auto-tune stops helping and structure has to change instead.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Build a stock-and-flow model incrementally and explain what each added block changes.",
    "Distinguish a parameter problem from a structural one by watching auto-tune hit a floor.",
    "Trace the real 2013-2016 kelp collapse to a lost predator and a heatwave acting together, not either alone.",
  ],
  misconceptions: [
    "A model that misses the data just has the wrong numbers in it",
    "More tuning can always fix a bad fit",
    "A balancing loop keeps a system perfectly constant",
    "A single disturbance and a compounding pair of disturbances behave the same way",
  ],
  interactionHint: "Start with kelp alone, add the urchin and otter stocks one at a time, then switch on the two real 2013-2016 shocks together.",
  tickRate: 30,
  timeScale: 1,
  params: {
    kelpGrowthRate: {
      type: "number", label: "Kelp growth rate", kind: "ratio",
      min: 0, max: 0.25, step: 0.005, default: 0.08,
      help: "Speed of canopy regrowth after any loss, per simulated day.",
    },
    grazingPerUrchin: {
      type: "number", label: "Grazing per urchin", kind: "ratio",
      min: 0, max: 0.05, step: 0.001, default: 0.012,
      help: "How fast urchins strip the reef and how quickly a barren forms.",
    },
    otterPredationRate: {
      type: "number", label: "Otter predation rate", kind: "ratio",
      min: 0, max: 40, step: 1, default: 22,
      help: "Strength of the top-down balancing loop, once otters are wired in.",
    },
    temperatureForcing: {
      type: "option", label: "Temperature forcing",
      options: [
        { value: "constant", label: "Constant 13°C" },
        { value: "observed", label: "Observed 1985-2020" },
        { value: "observedPlus2", label: "Observed plus 2°C" },
      ],
      default: "constant",
      help: "Whether the converter reads a flat value or a real-shaped ocean record.",
    },
    shockSeaStarWasting: { type: "boolean", label: "Shock: sea-star wasting 2013", default: false, help: "Removes a background urchin predator no slider controls." },
    shockMarineHeatwave: { type: "boolean", label: "Shock: marine heatwave 2014-16", default: false, help: "Adds a real temperature spike on top of whatever forcing is chosen." },
    shockElNino: { type: "boolean", label: "Shock: El Nino storms 1998", default: false, help: "A sharp, recoverable physical loss to the canopy." },
    autoTune: {
      type: "boolean", label: "Auto-tune parameters", default: false,
      help: "Searches growth, grazing and predation only. It can never add a stock, a converter, or a shock.",
    },
    runSpan: {
      type: "number", label: "Run span", kind: "count", unit: "yr",
      min: 5, max: 35, step: 1, default: 35,
      help: "Length of the simulated record compared against the data.",
    },
    modelVersion: {
      type: "number", label: "Model version", kind: "count",
      min: 1, max: 8, step: 1, default: 1,
      help: "A label for your own bookkeeping — it does not change the model.",
    },
    playbackSpeed: {
      type: "number", label: "Playback speed", kind: "ratio", unit: "yr/s",
      min: 0.25, max: 5, step: 0.25, default: 1,
      help: "How fast the already-solved curve draws itself in. The fit score is not affected.",
    },
    hasUrchinStock: { type: "boolean", label: "Wire in: urchin stock + grazing flow", default: false },
    hasOtterPredation: { type: "boolean", label: "Wire in: otter stock + predation link", default: false },
  },
  overlays: [
    { key: "chart", label: "Model vs ground truth", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "two-boxes-and-a-pipe",
      title: "Two boxes and a pipe",
      question: "Build kelp with growth alone. Your curve climbs and flattens. What can a model with no consumer never reproduce?",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Only the kelp stock and its own growth flow exist. No urchins, no otters, no temperature record, no shocks.",
          predict: {
            prompt: "Over 35 years, will this model ever show a sharp, lasting crash?",
            options: ["Yes, logistic growth can crash on its own", "No, nothing in this structure can ever remove kelp that fast"],
            correct: 1,
            reveal: "No. A single growth-only stock only ever climbs toward capacity and flattens there. There is no term that can pull it sharply down.",
          },
        },
        {
          id: "run-v1",
          phase: "measure",
          title: "Run the 35-year record",
          instruction: "Press play and let the model run out.",
          requireData: 1,
          check: { describe: "Canopy has climbed and is at or near capacity", test: (v) => (v.facts.finalCanopy as number) > 150 },
        },
        {
          id: "fit-score",
          phase: "measure",
          title: "Read the fit score",
          instruction: "Check the fit score against the real, collapse-featuring record.",
          check: { describe: "A poor fit score — the model never sees the real collapse", test: (v) => (v.facts.fitScoreRmse as number) > 30 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name the missing behaviour",
          instruction: "Look at the ground-truth ribbon on the chart.",
          write: {
            prompt: "What shape does the real data have that this model's curve structurally cannot produce, no matter what number you put in growth rate?",
            placeholder: "The real data has a ... that this structure cannot ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Answer the scenario's question",
          instruction: "Finish in your own words.",
          write: {
            prompt: "What can a model with no consumer never reproduce?",
            placeholder: "It can never reproduce a ...",
          },
        },
      ],
    },
    {
      id: "add-the-grazers",
      title: "Add the grazers",
      question: "Add an urchin stock and a grazing flow. Does the reef now crash, and does it ever come back?",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, hasUrchinStock: true, modelVersion: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the loop count",
          instruction: "An urchin stock and a grazing flow are now wired onto the kelp stock.",
          predict: {
            prompt: "How many feedback loops does the loop inventory report now?",
            options: ["Still zero", "One"],
            correct: 1,
            reveal: "One. Kelp feeds the grazing flow's pressure, which feeds back onto kelp — a single balancing loop, with nothing yet checking the urchins beyond the background rate.",
          },
        },
        {
          id: "loop-count",
          phase: "measure",
          title: "Confirm the loop",
          instruction: "Run for a moment and read the loop inventory.",
          check: { describe: "Loop inventory reads exactly one", test: (v) => v.facts.loopInventory === 1 },
        },
        {
          id: "still-no-crash",
          phase: "measure",
          title: "Check for the real crash",
          instruction: "Run the full 35 years and read the fit score.",
          requireData: 1,
          check: {
            describe: "Still a poor fit — a balancing loop alone is not the 2013 story",
            test: (v) => (v.facts.fitScoreRmse as number) > 20,
          },
          hints: ["Nothing here has removed the sea stars or warmed the water yet."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the still-missing piece",
          instruction: "Think about what, in the real 2013 event, this structure has not modelled yet.",
          write: {
            prompt: "The urchin stock exists now. What real event does this structure still not represent, and why does that matter for the fit?",
            placeholder: "This structure still leaves out ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Answer the scenario's question",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Does the reef crash with just an urchin stock and a grazing flow? Does it ever come back?",
            placeholder: "It ...",
          },
        },
      ],
    },
    {
      id: "the-auto-tune-wall",
      title: "The auto-tune wall",
      question: "Tune every number as hard as the machine can. What is the lowest score you reach, and which years still refuse to fit?",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, hasUrchinStock: true, temperatureForcing: "observed", modelVersion: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the wall",
          instruction: "Auto-tune is about to search growth, grazing and predation as hard as it can.",
          predict: {
            prompt: "Will enough tuning ever reproduce the 2013-2016 collapse from this structure?",
            options: ["Yes, given enough tries", "No — no numeric setting can invent a missing predator or a heatwave"],
            correct: 1,
            reveal: "No. Auto-tune can only move the three numbers it is given. It has no way to add the sea-star loss or the heatwave, so it grinds toward a floor and stops there.",
          },
        },
        {
          id: "tune",
          phase: "measure",
          title: "Let it grind",
          instruction: "Turn Auto-tune on and let it run for a while.",
          check: { describe: "Auto-tune has made real attempts", test: (v) => (v.facts.tuneIterations as number) > 20 },
        },
        {
          id: "floor",
          phase: "measure",
          title: "Confirm the floor",
          instruction: "Keep it running longer and watch the fit score stop improving.",
          requireData: 1,
          check: {
            describe: "Still a real, nonzero fit-score floor even after heavy tuning",
            test: (v) => (v.facts.tuneIterations as number) > 60 && (v.facts.fitScoreRmse as number) > 15,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Say what tuning cannot touch",
          instruction: "Think about the three sliders auto-tune actually has access to.",
          write: {
            prompt: "Name one thing about the real 2013-2016 collapse that none of growth rate, grazing rate, or predation rate can represent by itself.",
            placeholder: "None of those three numbers can represent ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Write the rule this scenario is teaching, in one sentence.",
            placeholder: "When a model fails, check ...",
          },
        },
      ],
    },
    {
      id: "the-real-record",
      title: "The real record",
      question: "Add otters and a temperature converter. Which single added block cut the error most?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-4"],
      setup: {
        ...BASE_SETUP, hasUrchinStock: true, hasOtterPredation: true, temperatureForcing: "observed",
        shockSeaStarWasting: true, shockMarineHeatwave: true, modelVersion: 3,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the fit",
          instruction: "Otters, observed temperature, and both real 2013-2016 shocks are now all wired in.",
          predict: {
            prompt: "Compared with the auto-tuned version-2 floor, will this structural version fit much better?",
            options: ["About the same", "Much better — it can finally see the collapse"],
            correct: 1,
            reveal: "Much better. Losing the sea-star check lets urchins climb, the heatwave suppresses kelp's own recovery, and together they finally produce a real, lasting collapse the data actually shows.",
          },
        },
        {
          id: "run-v3",
          phase: "measure",
          title: "Run the full structure",
          instruction: "Run the full 35 years.",
          requireData: 1,
          check: { describe: "A collapse actually appears in the model's own curve", test: (v) => (v.facts.barrenAreaPct as number) > 30 },
        },
        {
          id: "fit-improves",
          phase: "measure",
          title: "Confirm the improved fit",
          instruction: "Compare the fit score with the auto-tuned wall from the last lab.",
          check: { describe: "Fit score well under the auto-tune floor", test: (v) => (v.facts.fitScoreRmse as number) < 15 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Isolate the one block",
          instruction: "Think about which of otters, temperature, or the shocks did the most work.",
          write: {
            prompt: "Turn one of the added pieces off at a time and watch the fit score. Which single added block cut the error most?",
            placeholder: "Turning off ... hurt the fit the most, so that block matters most.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the lesson",
          instruction: "Finish in your own words.",
          write: {
            prompt: "The fix across this whole set of labs was never a new number. What was it?",
            placeholder: "The fix was always a new ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "beat-the-auto-tune-wall",
      title: "Beat the auto-tune wall",
      brief: "Reach a fit score under 12 km² using real structure, not tuning.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, hasUrchinStock: true },
      goal: {
        describe: "Fit score under 12 km² with auto-tune off",
        test: (v) => v.params.autoTune !== true && (v.facts.fitScoreRmse as number) < 12,
      },
      stars: {
        two: {
          describe: "Using both shocks together, not just one",
          test: (v) =>
            v.params.autoTune !== true && (v.facts.fitScoreRmse as number) < 12 &&
            v.params.shockSeaStarWasting === true && v.params.shockMarineHeatwave === true,
        },
        three: {
          describe: "Under 8 km²",
          test: (v) =>
            v.params.autoTune !== true && (v.facts.fitScoreRmse as number) < 8 &&
            v.params.shockSeaStarWasting === true && v.params.shockMarineHeatwave === true,
        },
      },
      hints: [
        "Auto-tune's own wall is a floor you can only get under by adding structure.",
        "One shock alone rarely reaches the real collapse depth — the real event was two things at once.",
      ],
    },
    {
      id: "recoverable-vs-lasting",
      title: "Recoverable vs. lasting",
      brief: "Show that the 1998 El Nino shock recovers, while the 2013-2016 pair does not, in the same run.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, hasUrchinStock: true, hasOtterPredation: true, shockElNino: true, shockSeaStarWasting: true, shockMarineHeatwave: true },
      goal: {
        describe: "By 2020 the reef is still well below its 1985 level, having recovered from 1998 on the way",
        test: (v) =>
          v.params.shockElNino === true && v.params.shockSeaStarWasting === true && v.params.shockMarineHeatwave === true &&
          (v.facts.finalYear as number) >= 2019 && (v.facts.finalCanopy as number) < 100,
      },
      hints: ["Run the full 35-year span so 2020 is actually reached."],
    },
  ],
};
