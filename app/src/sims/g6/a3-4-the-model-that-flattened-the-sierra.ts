import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect, mixHex } from "@ui/draw";
import { benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, hexA, isDarkTheme, plastic, softShadow,
  sphere, vignette,
} from "@ui/scene";
import { chartFrame, barSeries, lineSeries } from "@ui/charts";

/**
 * The Model That Flattened the Sierra — Grade 6, Unit A3.4: every model
 * leaves things out on purpose, and a good model can name the price.
 *
 * A single west-to-east transect, Sacramento to Reno, real elevations at
 * five gauge sites. The model rebuilds that terrain from blocks whose size
 * the student sets — coarse enough and the crest disappears entirely, which
 * is the experiment's own name. Seven process cards are the moisture
 * budget's seven real terms; each has a real, calibrated contribution to the
 * gap between a three-card estimate and the 1991-2020 gauge normals, and a
 * real compute cost. The budget is never big enough for all seven at once,
 * so an omission is a designed trade, not a shortcut — and the run refuses
 * outright rather than silently truncating when the budget is blown.
 *
 * The honesty rule this sim exists to uphold: at full resolution and every
 * process on, the model still misses the gauge normals by a small, fixed,
 * irreducible amount per station — the residual complexity no card ever
 * captures. Nothing here claims to reach the real number exactly.
 *
 * This is one instantaneous moisture-budget solve, not a running clock:
 * every control takes effect the moment it changes. Time exists only as the
 * run timer's own cost readout, which is a number, not a wait.
 */

/* ------------------------------------------------------------------ *
 * The transect — real elevations and the 1991-2020 gauge normals
 * ------------------------------------------------------------------ */

interface Gauge { key: string; label: string; km: number; elevationM: number }
const GAUGES: Gauge[] = [
  { key: "sacramento", label: "Sacramento", km: 0, elevationM: 8 },
  { key: "blueCanyon", label: "Blue Canyon", km: 110, elevationM: 1610 },
  { key: "donnerSummit", label: "Donner Summit", km: 150, elevationM: 2100 },
  { key: "truckee", label: "Truckee", km: 165, elevationM: 1800 },
  { key: "reno", label: "Reno", km: 220, elevationM: 1340 },
];
const DOMAIN_KM = GAUGES[GAUGES.length - 1].km;

// spec: Sacramento ~470 mm, Blue Canyon ~1,500 mm, Reno ~190 mm — Donner
// Summit and Truckee are this sim's own plausible fill for the same normals,
// consistent with the same windward-crest-leeward shape and the spec's
// stated rain-shadow ratio near 8.
const OBSERVED_MM = [470, 1500, 1650, 850, 190];

const BASE_PRECIP_MM = 450; // what the whole transect gets with no orographic effect at all
// The three-card (terrain + lift + phase), full-resolution estimate — close
// to the gauge normals but not equal to them; the four extra cards and an
// irreducible residual make up the rest of the real gap.
const CORE3_MM = [425, 1485, 1633, 839, 192];

interface ProcessGap { key: keyof Processes; cost: number; gapMm: number[] }
interface Processes {
  processTerrainDetail: boolean;
  processOrographicLift: boolean;
  processRainSnowPhase: boolean;
  processValleyEvaporation: boolean;
  processCloudMicrophysics: boolean;
  processCanopyInterception: boolean;
  processWindDrift: boolean;
}

const PROCESS_GAPS: ProcessGap[] = [
  { key: "processValleyEvaporation", cost: 15, gapMm: [35, 5, 0, -5, -8] },
  { key: "processCloudMicrophysics", cost: 25, gapMm: [8, 15, 15, 8, 3] },
  { key: "processCanopyInterception", cost: 15, gapMm: [-3, -25, -20, -10, -2] },
  { key: "processWindDrift", cost: 10, gapMm: [0, 8, 12, 12, 3] },
];

const CARD_COST = {
  processTerrainDetail: 15, processOrographicLift: 20, processRainSnowPhase: 10,
  processValleyEvaporation: 15, processCloudMicrophysics: 25, processCanopyInterception: 15,
  processWindDrift: 10,
} as const;

const STORM_REF = 400;
const RES_COST_MIN = 3, RES_COST_MAX = 80;
const TIME_PER_UNIT_S = 0.05;
const NAIVE_FREEZE_M = 1800; // the guess used when the phase card is off

type CompareMode = "normals" | "feb2017" | "dec2021";
/** Each storm's own real freezing level — Feb 2017 was famously warm aloft. */
const STORM_FREEZE_M: Record<Exclude<CompareMode, "normals">, number> = {
  feb2017: 3000, dec2021: 1500,
};

function clampRange(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** How much of the true terrain the current cell size actually resolves, 0-1. */
function resolutionFactor(params: ParamValues): number {
  if (params.processTerrainDetail !== true) return 0; // no terrain card, no crest at all
  const cellKm = (params.cellSize as number) / 1000;
  const cellCount = DOMAIN_KM / cellKm;
  return clampRange((cellCount - 1) / 20, 0, 1);
}

/** Wind aligned with the transect lifts fully; a skewed approach lifts less. */
function windAlignment(params: ParamValues): number {
  const dirDeg = ((params.windDirection as number) * 180) / Math.PI;
  const offset = Math.abs(dirDeg - 270);
  return clampRange(Math.cos((offset * Math.PI) / 180), 0.3, 1);
}

function resolutionCostUnits(cellSizeM: number): number {
  const cellKm = cellSizeM / 1000;
  return clampRange(Math.round(150 / cellKm), RES_COST_MIN, RES_COST_MAX);
}

function totalCostUnits(params: ParamValues): number {
  let cost = resolutionCostUnits(params.cellSize as number);
  for (const key of Object.keys(CARD_COST) as (keyof typeof CARD_COST)[]) {
    if (params[key] === true) cost += CARD_COST[key];
  }
  return cost;
}

function canRun(params: ParamValues): boolean {
  return totalCostUnits(params) <= (params.computeBudget as number);
}

/** The five stations' modelled annual precipitation, mm — a real, computed chain. */
function modeledPrecip(params: ParamValues): number[] {
  const res = resolutionFactor(params);
  const align = params.processOrographicLift === true ? windAlignment(params) : 0;
  const stormScale = (params.stormStrength as number) / STORM_REF;
  return GAUGES.map((_, i) => {
    let v = params.processOrographicLift === true
      ? BASE_PRECIP_MM + (CORE3_MM[i] - BASE_PRECIP_MM) * res * align
      : BASE_PRECIP_MM;
    for (const g of PROCESS_GAPS) if (params[g.key] === true) v += g.gapMm[i];
    return Math.max(0, v * stormScale);
  });
}

function meanAbsoluteError(modeled: number[]): number {
  let sum = 0;
  for (let i = 0; i < modeled.length; i++) sum += Math.abs(modeled[i] - OBSERVED_MM[i]);
  return sum / modeled.length;
}

/** Which of the five gauges get the phase (rain vs snow) wrong, in the chosen storm. */
function phaseMismatches(params: ParamValues): boolean[] {
  const mode = params.compareAgainst as CompareMode;
  if (mode === "normals") return GAUGES.map(() => false);
  const actualFreeze = STORM_FREEZE_M[mode];
  const modelFreeze = params.processRainSnowPhase === true ? (params.freezingLevel as number) : NAIVE_FREEZE_M;
  return GAUGES.map((g) => (g.elevationM > actualFreeze) !== (g.elevationM > modelFreeze));
}

/* ------------------------------------------------------------------ *
 * State — the last successfully afforded solve; a refused run freezes it
 * ------------------------------------------------------------------ */

interface State {
  precip: number[];
  mae: number;
  costUnits: number;
  ranOnce: boolean;
}

function solve(params: ParamValues): State {
  const precip = modeledPrecip(params);
  return { precip, mae: meanAbsoluteError(precip), costUnits: totalCostUnits(params), ranOnce: true };
}

const model: SimModel<State> = {
  init(params) {
    return solve(params);
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    if (!canRun(params)) return state; // the run refuses: last valid solve stands
    return solve(params);
  },

  readouts(state) {
    const out = GAUGES.map((g, i) => ({
      key: `precip_${g.key}`, label: `${g.label} precipitation`, unit: "mm/yr",
      quantity: q(state.precip[i], "ratio"), semantic: i === 1 || i === 2 ? "cold" : i === 4 ? "hot" : "producer",
      graphable: true,
    }));
    const blue = state.precip[1], reno = state.precip[4];
    return [
      ...out,
      { key: "meanAbsError", label: "Mean absolute error", unit: "mm", quantity: q(state.mae, "ratio"), semantic: "acid", graphable: true },
      { key: "rainShadowRatio", label: "Rain-shadow ratio", quantity: q(reno > 0 ? blue / reno : 0, "ratio"), semantic: "field", graphable: true },
      { key: "computeUsed", label: "Compute used", unit: "units", quantity: q(state.costUnits, "count"), semantic: "velocity" },
      { key: "runTime", label: "Run time", unit: "s", quantity: q(state.costUnits * TIME_PER_UNIT_S, "time"), semantic: "hot" },
    ];
  },

  facts(state, params) {
    const mismatches = phaseMismatches(params);
    const cost = totalCostUnits(params);
    const budget = params.computeBudget as number;
    const facts: Record<string, number | boolean | string> = {
      meanAbsError: state.mae,
      rainShadowRatio: state.precip[4] > 0 ? state.precip[1] / state.precip[4] : 0,
      computeUsed: state.costUnits,
      requestedCost: cost,
      budget,
      overBudget: cost > budget,
      canRun: cost <= budget,
      resolutionFactor: resolutionFactor(params),
      runTimeSeconds: state.costUnits * TIME_PER_UNIT_S,
      phaseMismatchCount: mismatches.filter(Boolean).length,
      compareAgainst: params.compareAgainst as string,
    };
    GAUGES.forEach((g, i) => {
      facts[`precip_${g.key}`] = state.precip[i];
      facts[`observed_${g.key}`] = OBSERVED_MM[i];
      facts[`phaseMismatch_${g.key}`] = mismatches[i];
    });
    return facts;
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 0): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function drawTerrain(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, params, theme } = rc;
  const dark = isDarkTheme(theme);
  const res = resolutionFactor(params);
  const exag = params.terrainExaggeration as number;
  const wipe = clampRange(params.wipePosition as number, 0, 1);
  const maxElev = Math.max(...GAUGES.map((g) => g.elevationM));

  const elevAt = (fracKm: number, real: boolean) => {
    // A smooth ridge through the five real elevations, interpolated linearly.
    let lo = GAUGES[0], hi = GAUGES[GAUGES.length - 1];
    for (let i = 0; i < GAUGES.length - 1; i++) {
      if (fracKm >= GAUGES[i].km && fracKm <= GAUGES[i + 1].km) { lo = GAUGES[i]; hi = GAUGES[i + 1]; break; }
    }
    const t = hi.km > lo.km ? (fracKm - lo.km) / (hi.km - lo.km) : 0;
    const trueElev = lo.elevationM + (hi.elevationM - lo.elevationM) * t;
    if (real) return trueElev;
    const meanElev = GAUGES.reduce((s, g) => s + g.elevationM, 0) / GAUGES.length;
    return meanElev + (trueElev - meanElev) * res;
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = dark ? "#0e1420" : "#dfe6ee";
  ctx.fillRect(x, y, w, h);

  const drawRidge = (real: boolean, color: string) => {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const fracKm = (i / steps) * DOMAIN_KM;
      const elev = elevAt(fracKm, real);
      const py = y + h - (elev / maxElev) * h * 0.85 * (exag / 3);
      ctx.lineTo(x + (i / steps) * w, clampRange(py, y, y + h));
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Left of the wipe: the model's own rebuilt world. Right: reality.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w * wipe, h);
  ctx.clip();
  drawRidge(false, mixHex("#8a7a5c", "#5c6a4a", 0.4));
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + w * wipe, y, w * (1 - wipe), h);
  ctx.clip();
  drawRidge(true, mixHex("#7a8a5c", "#4a5c3a", 0.35));
  ctx.restore();

  // The wipe seam.
  ctx.strokeStyle = hexA(theme.accent, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * wipe, y);
  ctx.lineTo(x + w * wipe, y + h);
  ctx.stroke();

  for (const g of GAUGES) {
    const gx = x + (g.km / DOMAIN_KM) * w;
    sphere(ctx, gx, y + h - 6, 3.5, "#e5484d", { rim: false });
    caption(ctx, gx, y + h + 12, g.label, theme, { align: "center", size: 8, color: theme.inkSoft });
  }
  ctx.restore();
  caption(ctx, x + 8, y + 14, "model world", theme, { size: 9, weight: 800, color: theme.inkSoft });
  caption(ctx, x + w - 8, y + 14, "reality", theme, { align: "right", size: 9, weight: 800, color: theme.inkSoft });
}

function drawBars(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: -0.5, xMax: GAUGES.length - 0.5, yMin: 0, yMax: 1800,
    title: "Modelled vs observed (mm/yr)", yLabel: "mm", grid: "y",
  }, theme);
  barSeries(ctx, OBSERVED_MM, sx, sy, hexA(theme.inkSoft, 0.5), { theme, radius: 2, maxWidth: 26 });
  const pts = state.precip.map((v, i) => ({ x: i, y: v }));
  lineSeries(ctx, pts, sx, sy, theme.sci["acid"], { theme, endDot: true });
  GAUGES.forEach((g, i) => caption(ctx, sx(i), y + h - 4, g.label, theme, { align: "center", size: 8, color: theme.inkSoft }));
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const showChart = overlays.comparison !== false;
  const chartH = showChart ? Math.round(height * 0.28) : 0;
  const stageH = height - chartH - (showChart ? 6 : 0);
  const budget = params.computeBudget as number;
  const cost = totalCostUnits(params);
  const over = cost > budget;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);

  drawTerrain(rc, width * 0.05, stageH * 0.14, width * 0.9, stageH * 0.42);

  // Compute budget bar.
  const barX = width * 0.05, barY = stageH * 0.63, barW = width * 0.55, barH = 12;
  ctx.fillStyle = hexA(theme.inkSoft, 0.25);
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.fill();
  const frac = clamp01(cost / Math.max(1, budget));
  ctx.fillStyle = over ? theme.sci["hot"] : theme.sci["neutral"];
  roundRect(ctx, barX, barY, barW * Math.min(1, frac), barH, 5);
  ctx.fill();
  caption(ctx, barX, barY - 6, `compute: ${cost} of ${budget} units`, theme, { size: 9, color: theme.inkSoft });
  if (over) {
    badge(ctx, barX + barW + 60, barY + 6, "RUN REFUSED", theme, { align: "center", color: theme.sci["hot"] });
  }

  // Omission ledger.
  const ledgerX = width * 0.05, ledgerY = stageH * 0.72, ledgerW = width * 0.9;
  softShadow(ctx, () => {
    plastic(ctx, ledgerX, ledgerY, ledgerW, stageH * 0.24, isDarkTheme(theme) ? "#1c2028" : "#e9e4d6", { radius: 8, gloss: 0.1 });
  }, { blur: 6, dy: 2, alpha: 0.2 });
  caption(ctx, ledgerX + 10, ledgerY + 14, "OMISSION LEDGER — left out on purpose", theme, { size: 9, weight: 800, color: theme.inkSoft });
  const allCards: { key: keyof typeof CARD_COST; label: string }[] = [
    { key: "processTerrainDetail", label: "terrain detail" },
    { key: "processOrographicLift", label: "orographic lift" },
    { key: "processRainSnowPhase", label: "rain-snow phase" },
    { key: "processValleyEvaporation", label: "valley evaporation" },
    { key: "processCloudMicrophysics", label: "cloud microphysics" },
    { key: "processCanopyInterception", label: "canopy interception" },
    { key: "processWindDrift", label: "wind drift" },
  ];
  const left = allCards.filter((c) => params[c.key] !== true);
  if (left.length === 0) {
    caption(ctx, ledgerX + 10, ledgerY + 32, "nothing left out — every card is on", theme, { size: 9, color: theme.inkSoft });
  } else {
    left.forEach((c, i) => {
      caption(ctx, ledgerX + 10, ledgerY + 32 + i * 14, `${c.label} (cost ${CARD_COST[c.key]})`, theme, {
        size: 9, color: theme.sci["hot"],
      });
    });
  }

  badge(ctx, width - 12, 20, `MAE ${num(state.mae, 0)} mm`, theme, { align: "right", color: theme.sci["acid"] });
  badge(ctx, width / 2, 20, `shadow ratio ${num(state.precip[4] > 0 ? state.precip[1] / state.precip[4] : 0, 1)}`, theme, { align: "center", color: theme.accent });
  if ((params.compareAgainst as string) !== "normals") {
    const mismatches = phaseMismatches(params).filter(Boolean).length;
    badge(ctx, 12, 20, `phase mismatches: ${mismatches}/5`, theme, { color: mismatches > 0 ? theme.sci["hot"] : theme.sci["neutral"] });
  }

  vignette(ctx, width, stageH, 0.16);
  ctx.restore();

  if (showChart) drawBars(rc, 8, stageH + 6, width - 16, chartH - 6);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

const BASE_SETUP: ParamValues = {
  cellSize: 25000, computeBudget: 100, stormStrength: 400, windDirection: 250 * DEG,
  freezingLevel: 1800, wipePosition: 0.5, compareAgainst: "normals", terrainExaggeration: 3,
  processTerrainDetail: true, processOrographicLift: true, processRainSnowPhase: true,
  processValleyEvaporation: false, processCloudMicrophysics: false,
  processCanopyInterception: false, processWindDrift: false,
};

export const flattenedSierraSim: SimManifest<State> = {
  id: "g6.a3-4",
  title: "The Model That Flattened the Sierra",
  tagline: "Rebuild the Sierra from blocks you size yourself, spend a compute budget on seven real processes, and pay for every one you skip.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Show that a coarse grid can erase a real mountain range from a model entirely.",
    "Treat omission as a costed design decision, not an accident or a shortcut.",
    "Explain a rain shadow as moisture running out on the windward rise, not a rule imposed on the leeward side.",
  ],
  misconceptions: [
    "A better model is simply one that includes more",
    "Leaving a process out of a model is cheating",
    "A model's error should be zero if it is done correctly",
    "Terrain resolution is a cosmetic setting, not a scientific one",
  ],
  interactionHint: "Drag the grid cell size coarse and watch the crest disappear from the model's own half of the wipe.",
  tickRate: 30,
  timeScale: 1,
  params: {
    cellSize: {
      type: "number", label: "Grid cell size", kind: "length", unit: "km",
      min: 1000, max: 200000, step: 1000, default: 25000,
      help: "How coarsely the terrain is rebuilt, and whether the crest exists at all.",
    },
    computeBudget: {
      type: "number", label: "Compute budget", kind: "count",
      min: 10, max: 200, step: 1, default: 100,
      help: "Total cost allowed, in units. Cards and a fine grid must fit inside it.",
    },
    stormStrength: {
      type: "number", label: "Storm strength (kg/m/s)", kind: "ratio",
      min: 100, max: 1200, step: 10, default: 400,
      help: "Incoming vapour transport — the moisture available to fall out.",
    },
    windDirection: {
      type: "number", label: "Wind direction", kind: "angle", unit: "°",
      min: 180 * DEG, max: 360 * DEG, step: DEG, default: 250 * DEG,
      help: "Angle of approach. Aligned with the transect lifts fully; skewed lifts less.",
    },
    freezingLevel: {
      type: "number", label: "Freezing level", kind: "length", unit: "m",
      min: 500, max: 4000, step: 50, default: 1800,
      help: "Altitude of the rain-to-snow switch, used only when the phase card is on.",
    },
    wipePosition: {
      type: "number", label: "Wipe position", kind: "percent",
      min: 0, max: 1, step: 0.01, default: 0.5,
      help: "Where the seam between the model's world and the real one sits. Cosmetic only.",
    },
    compareAgainst: {
      type: "option", label: "Compare against",
      options: [
        { value: "normals", label: "1991-2020 normals" },
        { value: "feb2017", label: "Feb 2017 storm" },
        { value: "dec2021", label: "Dec 2021 storm" },
      ],
      default: "normals",
      help: "Which observed record the model is scored against.",
    },
    terrainExaggeration: {
      type: "number", label: "Terrain exaggeration", kind: "ratio",
      min: 1, max: 10, step: 1, default: 3,
      help: "Vertical stretch of both terrains, for legibility only.",
    },
    processTerrainDetail: { type: "boolean", label: "Process: terrain detail", default: true },
    processOrographicLift: { type: "boolean", label: "Process: orographic lift", default: true },
    processRainSnowPhase: { type: "boolean", label: "Process: rain-snow phase", default: true },
    processValleyEvaporation: { type: "boolean", label: "Process: valley evaporation", default: false },
    processCloudMicrophysics: { type: "boolean", label: "Process: cloud microphysics", default: false },
    processCanopyInterception: { type: "boolean", label: "Process: canopy interception", default: false },
    processWindDrift: { type: "boolean", label: "Process: wind drift", default: false },
  },
  overlays: [
    { key: "comparison", label: "Modelled vs observed chart", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "a-flat-california",
      title: "A flat California",
      question: "With no mountains in the model, how much rain does it give Blue Canyon and Reno, and what do the gauges say?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-6"],
      setup: {
        ...BASE_SETUP, cellSize: 200000,
        processTerrainDetail: false, processOrographicLift: false, processRainSnowPhase: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The grid is one giant 200 km cell, and every process card is off.",
          predict: {
            prompt: "Will Blue Canyon and Reno get different amounts of rain, or the same amount?",
            options: ["Very different — Blue Canyon far wetter", "The same amount"],
            correct: 1,
            reveal: "The same. With no terrain and no lift, there is no crest to make one side wet and the other dry — every station gets the same flat rate.",
          },
        },
        {
          id: "flat-run",
          phase: "measure",
          title: "Read the flat result",
          instruction: "Record the modelled precipitation at Blue Canyon and Reno.",
          requireData: 1,
          check: {
            describe: "Blue Canyon and Reno modelled identically",
            test: (v) => Math.abs((v.facts.precip_blueCanyon as number) - (v.facts.precip_reno as number)) < 0.5,
          },
        },
        {
          id: "compare-observed",
          phase: "measure",
          title: "Compare with the gauges",
          instruction: "Look at the observed bars on the chart below the stage.",
          check: {
            describe: "The mean absolute error is large — the gauges disagree sharply",
            test: (v) => (v.facts.meanAbsError as number) > 300,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the gap",
          instruction: "Think about what a real storm needs to make one side of a range wet.",
          write: {
            prompt: "What has to exist in the model before Blue Canyon can ever read wetter than Reno?",
            placeholder: "There has to be a real ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name what flattening costs",
          instruction: "Finish in your own words.",
          write: {
            prompt: "In one sentence, what does a 200 km cell size actually do to the Sierra Nevada?",
            placeholder: "It replaces the range with ...",
          },
        },
      ],
    },
    {
      id: "put-the-mountains-back",
      title: "Put the mountains back",
      question: "What appears at Blue Canyon and disappears at Reno, and what is the windward to leeward ratio now?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, cellSize: 4000 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the ratio",
          instruction: "Terrain detail, orographic lift and rain-snow phase are on, and the grid is now 4 km.",
          predict: {
            prompt: "Roughly how many times wetter will Blue Canyon be than Reno?",
            options: ["About the same", "About 8 times wetter"],
            correct: 1,
            reveal: "About 8 times. That ratio is the real, observed rain-shadow signature — it only appears once the crest itself is resolved.",
          },
        },
        {
          id: "resolved",
          phase: "measure",
          title: "Confirm the crest exists",
          instruction: "Check the resolution factor and the rain-shadow ratio.",
          check: {
            describe: "Fully resolved terrain, rain-shadow ratio near the real value",
            test: (v) => (v.facts.resolutionFactor as number) > 0.9 && (v.facts.rainShadowRatio as number) > 6,
          },
        },
        {
          id: "error-drops",
          phase: "measure",
          title: "Watch the error fall",
          instruction: "Compare the mean absolute error with the flat run from the last lab.",
          requireData: 1,
          check: { describe: "Mean absolute error well under the flat run's", test: (v) => (v.facts.meanAbsError as number) < 150 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Say what changed",
          instruction: "Compare this configuration with the flat one.",
          write: {
            prompt: "Precisely which one of the three cards is responsible for the wet-dry contrast itself, as opposed to just the fine grid?",
            placeholder: "The contrast comes from ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the leftover error",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Even now, mean absolute error is not zero. What is still missing?",
            placeholder: "Still missing are the processes that ...",
          },
        },
      ],
    },
    {
      id: "spend-the-budget",
      title: "Spend the budget",
      question: "You cannot afford all seven processes. Which four omissions cost you the least error, and why?",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, cellSize: 10000, computeBudget: 100 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the refusal",
          instruction: "All seven cards would cost more than the 100-unit budget allows.",
          predict: {
            prompt: "If you turn on every card at once, what happens?",
            options: ["It runs, just slowly", "The run refuses outright"],
            correct: 1,
            reveal: "The run refuses. This model does not quietly truncate over budget — it simply will not solve until the cost fits.",
          },
        },
        {
          id: "overspend",
          phase: "measure",
          title: "Try to afford everything",
          instruction: "Turn on all seven process cards.",
          check: { describe: "Over budget, run refused", test: (v) => v.facts.overBudget === true },
        },
        {
          id: "four-cards",
          phase: "measure",
          title: "Choose four",
          instruction: "Turn off three cards until the run is affordable again, and record the mean absolute error.",
          requireData: 1,
          check: { describe: "Back under budget with four or fewer cards", test: (v) => v.facts.overBudget === false },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Justify the choice",
          instruction: "Look at the omission ledger for the cards you left off.",
          write: {
            prompt: "Which four cards did you keep, and why did you judge the other three the cheapest to lose?",
            placeholder: "I kept ... because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what omission is",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Is leaving three cards out of this model a mistake? Explain using the budget.",
            placeholder: "No, because the budget ...",
          },
        },
      ],
    },
    {
      id: "storm-of-record",
      title: "Storm of record",
      question: "The model puts snow where the gauges recorded rain. Which omitted process explains the miss?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, compareAgainst: "feb2017", stormStrength: 900, freezingLevel: 2700, processRainSnowPhase: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the miss",
          instruction: "February 2017 was an unusually warm storm — rain fell even at high elevation. The phase card is off.",
          predict: {
            prompt: "Without the phase card, will the model get Donner Summit's rain-or-snow call right?",
            options: ["Yes, elevation alone is enough", "No, it will wrongly call it snow"],
            correct: 1,
            reveal: "No. Without the phase card, the model falls back on a generic elevation guess that has no idea this particular storm was unusually warm aloft.",
          },
        },
        {
          id: "miss",
          phase: "measure",
          title: "Confirm the miss",
          instruction: "Check the phase-mismatch counter.",
          check: { describe: "At least one station's phase is wrong", test: (v) => (v.facts.phaseMismatchCount as number) >= 1 },
        },
        {
          id: "add-phase",
          phase: "measure",
          title: "Add the phase card",
          instruction: "Turn the rain-snow phase card on, with freezing level already set to 2,700 m.",
          requireData: 1,
          check: { describe: "Phase mismatches drop to zero", test: (v) => v.facts.phaseMismatchCount === 0 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the fix",
          instruction: "Think about what the phase card actually knows that the naive guess does not.",
          write: {
            prompt: "The naive guess uses a fixed elevation. What does the phase card let you set instead, and why did that matter here?",
            placeholder: "It lets you set ..., which mattered because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the omitted process",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Answer the scenario's own question: which omitted process explains the miss?",
            placeholder: "The missing process is ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "cheapest-configuration",
      title: "Cheapest configuration under 150 mm",
      brief: "Hold the budget at 100 units and find the cheapest configuration that keeps mean absolute error under 150 mm.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, cellSize: 10000, computeBudget: 100 },
      goal: {
        describe: "Error under 150 mm, budget at 100, and not over budget",
        test: (v) => v.params.computeBudget === 100 && v.facts.overBudget === false && (v.facts.meanAbsError as number) < 150,
      },
      stars: {
        two: {
          describe: "Also under 80 units of compute actually used",
          test: (v) =>
            v.params.computeBudget === 100 && v.facts.overBudget === false &&
            (v.facts.meanAbsError as number) < 150 && (v.facts.computeUsed as number) <= 80,
        },
      },
      hints: ["Terrain detail and orographic lift are doing most of the work here — the extra four cards are fine-tuning."],
    },
    {
      id: "storm-honesty",
      title: "Storm honesty",
      brief: "Get the phase call right for both real storms in the record, one after another, without changing the phase card off.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, processRainSnowPhase: true },
      goal: {
        describe: "Zero phase mismatches on Feb 2017 with freezing level set for it",
        test: (v) =>
          v.params.processRainSnowPhase === true && v.params.compareAgainst === "feb2017" &&
          v.facts.phaseMismatchCount === 0,
      },
      stars: {
        two: {
          describe: "Then zero mismatches on Dec 2021 too, after resetting the freezing level",
          test: (v) =>
            v.params.processRainSnowPhase === true && v.params.compareAgainst === "dec2021" &&
            v.facts.phaseMismatchCount === 0,
        },
      },
      hints: ["Each storm has its own real freezing level — the same number will not work for both."],
    },
  ],
};
