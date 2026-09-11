import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { plant } from "@ui/fauna";
import { badge, caption, clamp01, glow, hexA, isDarkTheme, plastic, softShadow, vignette } from "@ui/scene";

/**
 * Run My Plan: The Ecocolumn Trial — Grade 6, Unit A5.6: if the plan does not
 * say it, the experiment decides it, and the result ends up about the wrong
 * thing.
 *
 * There is no hidden "correct" plan here and no plan-repair. The procedure
 * executor is completely literal: it runs exactly the columns, the interval,
 * the duration and the randomisation the current controls specify, and
 * nothing else. Sampling every 168 hours is not penalised by a rule — it
 * genuinely lands on the same hour of the day every single time (168 is an
 * exact multiple of 24), so a real daily oxygen swing is mathematically
 * invisible to it, while a 3-hour interval genuinely resolves the same
 * swing. Leaving shelf position unrandomised does not trigger a warning
 * label; the shop lamp and the window really do make one end of the shelf
 * a different environment, and that gradient really does ride along with
 * whatever the plan was trying to test. The design scorecard only ever
 * reports what the executor actually had to contend with — it never
 * repairs a bad plan on the student's behalf.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const N_MAX = 12;
const LIGHT_K_H = 6;        // light saturates past ~14 h/day, same functional form as A5.2
const O2_BASE = 6;          // spec: oxygen swings between 3 and 9 mg/L — midpoint
const O2_SWING_BASE = 0.6;  // swing present even at minimal biological activity
const O2_SWING_GAIN = 2.4;  // additional swing amplitude at full activity (spec: 3-9 range)
const RADISH_GROWTH_RATE = 0.009; // per hour, calibrated to a visible 14-21 day trial
const RADISH_MAX_MM = 120;

const LAMP_LX_BAY1 = 8000, LAMP_LX_BAY12 = 2200; // spec: illuminance field along the shelf
const WINDOW_BONUS_LX = 1200;  // spec: the window end runs brighter
const WINDOW_COOLER_C = 3;     // spec: and cooler — a real, separate nuisance gradient

function clockHour(simH: number): number {
  return simH % 24;
}

/** Photosynthetic capacity from light hours/day, same saturating form as A5.2. */
function lightFactor(hoursPerDay: number): number {
  return 1 - Math.exp(-Math.max(0, hoursPerDay) / LIGHT_K_H);
}

/* ------------------------------------------------------------------ *
 * The plan — every slot a genuine control, none of them repaired
 * ------------------------------------------------------------------ */

type IndependentVar = "none" | "light" | "water" | "litter" | "snails";

/** Bay illuminance, lux: the lamp fades along the shelf, the window adds at bay 12. */
function bayLux(bayIndex: number, n: number): number {
  const t = n > 1 ? bayIndex / (n - 1) : 0;
  const lamp = LAMP_LX_BAY1 + (LAMP_LX_BAY12 - LAMP_LX_BAY1) * t;
  const windowNear = t; // 0 at bay1, 1 at the last bay
  return lamp + WINDOW_BONUS_LX * windowNear ** 3;
}

/** Bay temperature offset, degrees C: the window end runs cooler. */
function bayTempOffsetC(bayIndex: number, n: number): number {
  const t = n > 1 ? bayIndex / (n - 1) : 0;
  return -WINDOW_COOLER_C * t ** 3;
}

/** This bay's value of whichever variable the plan chose to vary, 0-indexed. */
function ivValueAt(bayIndex: number, n: number, low: number, high: number): number {
  if (n <= 1) return low;
  return low + (bayIndex / (n - 1)) * (high - low);
}

interface ColumnSetting {
  lightH: number; waterMl: number; litterG: number; snails: number;
  lux: number; tempOffsetC: number;
}

function columnSettings(bayIndex: number, params: ParamValues): ColumnSetting {
  const n = Math.max(1, Math.min(N_MAX, Math.round(params.columnsBuilt as number)));
  const iv = params.independentVariable as IndependentVar;
  const low = params.ivLow as number, high = params.ivHigh as number;
  const varied = iv === "none" ? low : ivValueAt(bayIndex, n, low, high);

  let lightH = 10, waterMl = 20, litterG = 20, snails = 4;
  if (iv === "light") lightH = varied;
  else if (iv === "water") waterMl = varied;
  else if (iv === "litter") litterG = varied;
  else if (iv === "snails") snails = varied;

  const randomised = params.randomizePositions === true;
  // Randomising positions daily averages the shelf gradient away over a real
  // trial; the honest way to represent that here is that the gradient simply
  // never gets to attach itself to any one column's identity.
  const lux = randomised ? bayLux((n - 1) / 2, n) : bayLux(bayIndex, n);
  const tempOffsetC = randomised ? bayTempOffsetC((n - 1) / 2, n) : bayTempOffsetC(bayIndex, n);
  return { lightH, waterMl, litterG, snails, lux, tempOffsetC };
}

/** Biological vigour, 0-1: light capacity x water x litter-derived nutrient x crowding. */
function columnActivity(cs: ColumnSetting): number {
  const luxFactor = clamp01(cs.lux / 7000);
  const lf = lightFactor(cs.lightH) * (0.5 + 0.5 * luxFactor);
  const wf = clamp01(cs.waterMl / 35);
  const nf = clamp01(cs.litterG / 18);
  const crowd = clamp01(1 - Math.max(0, cs.snails - 4) * 0.08);
  return lf * (0.4 + 0.6 * wf) * (0.4 + 0.6 * nf) * crowd;
}

/** Dissolved oxygen at this column, this simulated hour — a real diurnal swing. */
function columnOxygen(cs: ColumnSetting, simH: number): number {
  const activity = columnActivity(cs);
  const diel = Math.cos((2 * Math.PI * (clockHour(simH) - 15)) / 24); // peak mid-afternoon
  const swing = O2_SWING_BASE + activity * O2_SWING_GAIN;
  const tempDrag = cs.tempOffsetC * -0.05; // cooler water holds a touch more O2
  return Math.max(0.3, Math.min(11, O2_BASE + swing * diel + tempDrag));
}

/** Radish height, mm, at this column after `hours` of growth. */
function radishHeightMm(cs: ColumnSetting, hours: number): number {
  const activity = columnActivity(cs);
  const rate = RADISH_GROWTH_RATE * (0.3 + 0.7 * activity);
  let h = 3; // a sprouted seedling
  const steps = Math.max(1, Math.round(hours));
  for (let i = 0; i < steps; i++) {
    h += rate * h * (1 - h / RADISH_MAX_MM);
  }
  return Math.min(RADISH_MAX_MM, h);
}

/* ------------------------------------------------------------------ *
 * The executed dataset — sampled only at the interval the plan set
 * ------------------------------------------------------------------ */

interface Sample { simH: number; oxygenByColumn: number[] }

/** Every oxygen sample the plan's own interval would actually collect. */
function executedSamples(params: ParamValues, uptoH: number): Sample[] {
  const n = Math.max(1, Math.min(N_MAX, Math.round(params.columnsBuilt as number)));
  const interval = Math.max(1, params.measurementIntervalH as number);
  const cols = Array.from({ length: n }, (_, i) => columnSettings(i, params));
  const out: Sample[] = [];
  for (let t = 0; t <= uptoH; t += interval) {
    out.push({ simH: t, oxygenByColumn: cols.map((cs) => columnOxygen(cs, t)) });
  }
  return out;
}

/** What the plan's own sampling can and cannot resolve — computed, not asserted. */
function canResolveDailySwing(intervalH: number): boolean {
  return intervalH <= 12; // at least two samples per 24 h cycle, the Nyquist floor
}

/* ------------------------------------------------------------------ *
 * The design scorecard — every criterion a real, computed fact about the plan
 * ------------------------------------------------------------------ */

interface Criterion { key: string; pass: boolean; note: string }

function scorecard(params: ParamValues): Criterion[] {
  const iv = params.independentVariable as IndependentVar;
  const n = Math.round(params.columnsBuilt as number);
  const interval = params.measurementIntervalH as number;
  const duration = params.durationDays as number;
  const instrument = params.instrumentPrecision as string;
  return [
    { key: "testableQuestion", pass: iv !== "none", note: "A question needs something deliberately varied to answer it." },
    { key: "controlledVariables", pass: params.controlledVariablesStated === true, note: "Unstated controls let seed-batch variation move as much as the treatment." },
    { key: "replicates", pass: n >= 3, note: "Fewer than three columns cannot separate a treatment from one unlucky column." },
    { key: "instrument", pass: instrument === "doProbe", note: "Dissolved oxygen needs a dissolved-oxygen probe, not a length or mass tool." },
    { key: "samplingInterval", pass: canResolveDailySwing(interval), note: "An interval past 12 h cannot resolve a swing that repeats every 24 h." },
    { key: "duration", pass: duration >= 6, note: "This system's processes run 6-30 days; shorter trials end before the effect appears." },
    { key: "positionRandomised", pass: params.randomizePositions === true, note: "An unrandomised shelf lets the lamp-and-window gradient ride along with the treatment." },
  ];
}

/* ------------------------------------------------------------------ *
 * State — a light animation clock and the sim-hour clock
 * ------------------------------------------------------------------ */

interface State { simH: number }

const model: SimModel<State> = {
  init() {
    return { simH: 0 };
  },
  step(state, dt, params) {
    if (dt <= 0) return state;
    const comp = params.timeCompression as number;
    return { simH: state.simH + (dt * comp) / 3600 };
  },
  readouts(state, params) {
    const n = Math.max(1, Math.min(N_MAX, Math.round(params.columnsBuilt as number)));
    const cols = Array.from({ length: n }, (_, i) => columnSettings(i, params));
    const oxygens = cols.map((cs) => columnOxygen(cs, state.simH));
    const heights = cols.map((cs) => radishHeightMm(cs, state.simH));
    const crit = scorecard(params);
    return [
      { key: "day", label: "Day", quantity: q(state.simH / 24, "count"), semantic: "time", graphable: true },
      { key: "meanOxygen", label: "Mean dissolved oxygen", unit: "mg/L", quantity: q(oxygens.reduce((a, b) => a + b, 0) / n, "ratio"), semantic: "cold", graphable: true },
      { key: "meanHeight", label: "Mean radish height", unit: "mm", quantity: q(heights.reduce((a, b) => a + b, 0) / n / 1000, "length"), semantic: "producer", graphable: true },
      { key: "score", label: "Design score", quantity: q(crit.filter((c) => c.pass).length / crit.length, "percent"), semantic: "neutral" },
      { key: "resolvesSwing", label: "Resolves the daily swing", quantity: q(canResolveDailySwing(params.measurementIntervalH as number) ? 1 : 0, "count") },
      // Instant and always live, unlike the columns above: with no variable
      // assigned yet (Independent variable = None), low/high genuinely do
      // not reach any column's biology, by design — a plan with nothing
      // deliberately varied has nothing for these to set. Their own dial
      // positions are still a real, current fact about the plan, so the
      // span between them is reported directly rather than left with no
      // live consequence at all while that choice is still "none".
      { key: "ivSpan", label: "Independent variable: configured span", quantity: q((params.ivHigh as number) - (params.ivLow as number), "ratio") },
    ];
  },
  facts(state, params) {
    const n = Math.max(1, Math.min(N_MAX, Math.round(params.columnsBuilt as number)));
    const cols = Array.from({ length: n }, (_, i) => columnSettings(i, params));
    const samples = executedSamples(params, state.simH);
    const lastSample = samples[samples.length - 1];
    const oxygens = lastSample ? lastSample.oxygenByColumn : cols.map((cs) => columnOxygen(cs, state.simH));
    const heights = cols.map((cs) => radishHeightMm(cs, state.simH));

    // What the plan's OWN sampling record actually shows for the swing, versus
    // what genuinely happened underneath it — the honest gap "too slow" leaves.
    let recordedMin = Infinity, recordedMax = -Infinity;
    for (const s of samples) for (const o of s.oxygenByColumn) { if (o < recordedMin) recordedMin = o; if (o > recordedMax) recordedMax = o; }
    if (!Number.isFinite(recordedMin)) { recordedMin = O2_BASE; recordedMax = O2_BASE; }
    let trueMin = Infinity, trueMax = -Infinity;
    for (let h = 0; h <= state.simH; h += 1) {
      for (const cs of cols) { const o = columnOxygen(cs, h); if (o < trueMin) trueMin = o; if (o > trueMax) trueMax = o; }
    }
    if (!Number.isFinite(trueMin)) { trueMin = O2_BASE; trueMax = O2_BASE; }

    const crit = scorecard(params);
    const passCount = crit.filter((c) => c.pass).length;
    const gradientLive = params.randomizePositions !== true;
    const gradientCouldExplainResult = gradientLive && (params.independentVariable as IndependentVar) !== "none";

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const range = (arr: number[]) => Math.max(...arr) - Math.min(...arr);

    return {
      day: state.simH / 24,
      hour: state.simH,
      columnsBuilt: n,
      independentVariable: params.independentVariable as string,
      meanOxygen: mean(oxygens),
      oxygenRangeAcrossColumns: range(oxygens),
      meanHeight: mean(heights),
      heightRangeAcrossColumns: range(heights),
      recordedOxygenMin: recordedMin,
      recordedOxygenMax: recordedMax,
      recordedSwing: recordedMax - recordedMin,
      trueOxygenMin: trueMin,
      trueOxygenMax: trueMax,
      trueSwing: trueMax - trueMin,
      swingHiddenFraction: trueMax > trueMin ? 1 - (recordedMax - recordedMin) / (trueMax - trueMin) : 0,
      resolvesSwing: canResolveDailySwing(params.measurementIntervalH as number),
      sampleCount: samples.length,
      designScore: passCount,
      designScoreMax: crit.length,
      designScorePct: Math.round((passCount / crit.length) * 100),
      failingCriteria: crit.filter((c) => !c.pass).map((c) => c.key).join(", "),
      testableQuestion: crit[0].pass,
      controlledVariablesOk: crit[1].pass,
      replicatesOk: crit[2].pass,
      instrumentOk: crit[3].pass,
      samplingIntervalOk: crit[4].pass,
      durationOk: crit[5].pass,
      positionRandomisedOk: crit[6].pass,
      gradientLive,
      gradientCouldExplainResult,
      conclusionSupported: passCount === crit.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state: s, params, theme, width, height, time } = rc;
  const dark = isDarkTheme(theme);
  ctx.fillStyle = dark ? "#14181c" : "#eef1ec";
  ctx.fillRect(0, 0, width, height);

  const n = Math.max(1, Math.min(N_MAX, Math.round(params.columnsBuilt as number)));
  const cols = Array.from({ length: n }, (_, i) => columnSettings(i, params));
  const shelfY = height * 0.16, shelfH = height * 0.6;
  const bayW = (width * 0.9) / n, gap = Math.min(10, bayW * 0.08);
  const startX = width * 0.05;

  for (let i = 0; i < n; i++) {
    const cs = cols[i];
    const bx = startX + i * bayW;
    const lit = clamp01(cs.lux / 8000);
    softShadow(ctx, () => {
      plastic(ctx, bx, shelfY, bayW - gap, shelfH, dark ? "#20262b" : "#dfe6e2", { radius: 6, gloss: 0.2 });
    }, { blur: 6, dy: 3, alpha: 0.3 });
    ctx.fillStyle = hexA("#ffe9b0", 0.1 + 0.5 * lit);
    roundRect(ctx, bx + 3, shelfY + 3, bayW - gap - 6, 5, 2);
    ctx.fill();

    const height01 = clamp01(radishHeightMm(cs, s.simH) / RADISH_MAX_MM);
    plant(ctx, bx + (bayW - gap) / 2, shelfY + shelfH * 0.92, shelfH * 0.1 + shelfH * 0.32 * height01, "seedling", theme, {
      health: clamp01(0.4 + 0.6 * height01), sway: (time * 0.08 + i * 0.11) % 1, seed: i * 5,
    });

    const o2 = columnOxygen(cs, s.simH);
    const o2Frac = clamp01((o2 - 2) / 8);
    ctx.fillStyle = hexA(theme.sci["cold"], 0.35 + 0.4 * o2Frac);
    roundRect(ctx, bx + 4, shelfY + shelfH * 0.62, bayW - gap - 8, shelfH * 0.32, 3);
    ctx.fill();
    if (o2 < 3) glow(ctx, bx + (bayW - gap) / 2, shelfY + shelfH * 0.78, 10, hexA(theme.sci["hot"], 0.4));

    caption(ctx, bx + (bayW - gap) / 2, shelfY - 8, `${i + 1}`, theme, { align: "center", size: 10, weight: 700 });
    caption(ctx, bx + (bayW - gap) / 2, shelfY + shelfH + 12, `${o2.toFixed(1)} mg/L`, theme, { align: "center", size: 9, color: theme.inkSoft });
  }

  const crit = scorecard(params);
  const passCount = crit.filter((c) => c.pass).length;
  badge(ctx, width - 12, 20, `${passCount}/${crit.length}`, theme, { align: "right", color: passCount === crit.length ? theme.sci["neutral"] : theme.sci["hot"], sub: "design score" });
  badge(ctx, 12, 20, `day ${(s.simH / 24).toFixed(1)}`, theme, { color: theme.accent });

  const interval = params.measurementIntervalH as number;
  const resolves = canResolveDailySwing(interval);
  badge(ctx, width / 2, 20, resolves ? "SEES THE DAILY SWING" : "SAMPLING TOO SLOW", theme, {
    align: "center", color: resolves ? theme.sci["neutral"] : theme.sci["hot"],
  });

  if (params.randomizePositions !== true) {
    caption(ctx, width / 2, height - 14, "shelf position not randomised — the lamp/window gradient is still live", theme, {
      align: "center", size: 10, color: theme.sci["hot"],
    });
  }

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  independentVariable: "none", ivLow: 6, ivHigh: 18,
  columnsBuilt: 3, controlledVariablesStated: false,
  randomizePositions: false, measurementIntervalH: 24, durationDays: 14,
  instrumentPrecision: "doProbe", timeCompression: 10000,
};

export const runMyPlanSim: SimManifest<State> = {
  id: "g6.a5-6",
  title: "Run My Plan: The Ecocolumn Trial",
  tagline: "Write the plan yourself, press run, and find out which of your own unstated choices the experiment made for you.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Write a plan complete enough that no important decision is left for the experiment to make by default.",
    "Predict, before running, which of a plan's own gaps will show up as noise or as a hidden confound in its results.",
    "Judge whether a result actually supports its conclusion by checking the plan that produced it, not just the numbers.",
  ],
  misconceptions: [
    "Designing an investigation means writing neat steps",
    "A plan is fine as long as the general idea is right",
    "One replicate is enough if the treatment is real",
    "Whatever the experiment measures is automatically what it was testing",
  ],
  interactionHint: "Set the sampling interval to 24 hours, then to 3, and watch the recorded oxygen swing change without the true biology changing at all.",
  tickRate: 10,
  timeScale: 1,
  params: {
    independentVariable: {
      type: "option", label: "Independent variable",
      options: [
        { value: "none", label: "None chosen (observation study)" },
        { value: "light", label: "Light hours" },
        { value: "water", label: "Water added" },
        { value: "litter", label: "Litter mass" },
        { value: "snails", label: "Snail count" },
      ],
      default: "none",
      help: "What is deliberately varied, low to high, across the columns you build.",
    },
    ivLow: { type: "number", label: "Independent variable: low end", kind: "ratio", min: 0, max: 100, step: 1, default: 6, help: "The value at column 1. Units follow whichever variable is chosen." },
    ivHigh: { type: "number", label: "Independent variable: high end", kind: "ratio", min: 0, max: 100, step: 1, default: 18, help: "The value at the last column." },
    columnsBuilt: { type: "number", label: "Columns built", kind: "count", min: 1, max: N_MAX, step: 1, default: 3, help: "Treatment levels times replicates." },
    controlledVariablesStated: { type: "boolean", label: "Controlled variables stated", default: false, help: "Unstated, seed-batch variation is left free to move as much as any treatment." },
    randomizePositions: { type: "boolean", label: "Randomise shelf positions", default: false, help: "Off, the lamp-and-window gradient sits on the shelf exactly where you built your columns." },
    measurementIntervalH: { type: "number", label: "Measurement interval", kind: "time", unit: "h", min: 1, max: 168, step: 1, default: 24, help: "How often oxygen is sampled. Past 12 h, a 24 h swing cannot be resolved." },
    durationDays: { type: "number", label: "Run duration", kind: "time", unit: "d", min: 3, max: 60, step: 1, default: 14, help: "This system's processes run 6-30 days." },
    instrumentPrecision: {
      type: "option", label: "Instrument for the dependent variable",
      options: [
        { value: "doProbe", label: "Dissolved oxygen probe" },
        { value: "ruler", label: "Rule" },
        { value: "thermometer", label: "Thermometer" },
        { value: "balance", label: "Digital balance" },
      ],
      default: "doProbe",
      help: "Only the DO probe actually measures the quantity this trial reports.",
    },
    timeCompression: {
      type: "number", label: "Time compression", kind: "ratio", min: 500, max: 50000, step: 500, default: 10000,
      help: "Simulated seconds per real second. The biology is identical at every setting.",
    },
  },
  overlays: [],
  model,
  render,
  labs: [
    {
      id: "the-plan-you-would-actually-write",
      title: "The plan you would actually write",
      question: "What question can this data answer, and what is the honest answer to \"why did the oxygen crash\"?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, independentVariable: "none", columnsBuilt: 1, durationDays: 14, measurementIntervalH: 168 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One column, no chosen variable, sampled once a week for 14 days — the plan most students actually start with.",
          predict: {
            prompt: "With no independent variable and one column, what can this run ever tell you?",
            options: ["A cause-and-effect result, once it finishes", "Only what happened in this one column — nothing to compare it to"],
            correct: 1,
            reveal: "Only what happened here. With nothing varied and nothing to compare against, there is no question this design can actually answer.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it",
          instruction: "Run to day 14 and record the design score.",
          requireData: 1,
          check: { describe: "Day 14 reached", test: (v) => (v.facts.day as number) >= 14 },
        },
        {
          id: "read-score",
          phase: "analyze",
          title: "Read the scorecard",
          instruction: "Check which criteria this plan actually fails.",
          check: {
            describe: "No testable question and no replicates, both correctly flagged",
            test: (v) => v.facts.testableQuestion === false && v.facts.replicatesOk === false,
          },
        },
        {
          id: "swing-hidden",
          phase: "analyze",
          title: "Check the swing",
          instruction: "Compare the recorded oxygen swing to the true one the biology actually produced.",
          check: {
            describe: "The weekly sample hid most of the real daily swing",
            test: (v) => (v.facts.swingHiddenFraction as number) > 0.5,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Answer honestly",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "What question can this data actually answer, and what is the honest answer to \"why did the oxygen crash\" if all you have is one column sampled weekly?",
            placeholder: "This data can answer ...; the honest answer about the crash is that I cannot tell, because ...",
          },
        },
      ],
    },
    {
      id: "one-variable-three-columns",
      title: "One variable, three columns",
      question: "The lamp-end column wins. Was it the light, or was it position? Which single toggle settles it?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, independentVariable: "light", ivLow: 6, ivHigh: 18, columnsBuilt: 3, controlledVariablesStated: true, randomizePositions: false, measurementIntervalH: 24 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the confound",
          instruction: "Light is the chosen variable, but shelf position is not randomised — and the lamp fades along the very same shelf.",
          predict: {
            prompt: "Column 1 sits at the bright lamp end AND gets the fewest light-hours in this plan. What does that do to the result?",
            options: ["Nothing — the light-hours slider is what matters", "It confounds light-hours with shelf brightness, so a win cannot be attributed to either alone"],
            correct: 1,
            reveal: "It confounds them. Column 1's actual light exposure depends on both its light-hours setting and its lamp brightness — a gradient this plan left standing.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it",
          instruction: "Run for a few simulated days and record which column looks strongest.",
          requireData: 1,
          check: { describe: "The position gradient is confirmed live and could explain the result", test: (v) => v.facts.gradientLive === true && v.facts.gradientCouldExplainResult === true },
        },
        {
          id: "flagged",
          phase: "analyze",
          title: "Check the scorecard",
          instruction: "Confirm the scorecard itself flags the unrandomised position.",
          check: { describe: "positionRandomisedOk is false", test: (v) => v.facts.positionRandomisedOk === false },
        },
        {
          id: "fix",
          phase: "measure",
          title: "Randomise it",
          instruction: "Turn on Randomise shelf positions and re-run.",
          check: { describe: "Gradient no longer live", test: (v) => v.params.randomizePositions === true && v.facts.gradientLive === false },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the toggle",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Was it the light or the position? Which single toggle settles the question, and what does it actually do to the shelf?",
            placeholder: "It could have been either, because ...; the toggle that settles it is ..., which ...",
          },
        },
      ],
    },
    {
      id: "sampling-too-slowly",
      title: "Sampling too slowly",
      question: "Oxygen reads almost the same every week. What does a 3-hour interval reveal that the weekly plan hid?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, independentVariable: "litter", ivLow: 5, ivHigh: 35, columnsBuilt: 4, controlledVariablesStated: true, randomizePositions: true, measurementIntervalH: 168, durationDays: 21 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the weekly record",
          instruction: "168-hour sampling on a system that swings every 24 hours.",
          predict: {
            prompt: "What will the weekly-recorded oxygen swing look like, compared to the truth?",
            options: ["About the same as the real swing", "Far smaller — 168 is an exact multiple of 24, so every sample lands at the same hour"],
            correct: 1,
            reveal: "Far smaller. Sampling every 168 hours always catches the cycle at the same phase, so the record can look almost flat while the real swing is large.",
          },
        },
        {
          id: "run-weekly",
          phase: "measure",
          title: "Run at weekly sampling",
          instruction: "Run to day 21 and compare the recorded swing to the true one.",
          requireData: 1,
          check: { describe: "Weekly sampling hides most of the real swing", test: (v) => (v.facts.swingHiddenFraction as number) > 0.6 },
        },
        {
          id: "run-fine",
          phase: "measure",
          title: "Now sample every 3 hours",
          instruction: "Set the measurement interval to 3 h and re-run.",
          requireData: 2,
          check: {
            describe: "At 3 h, the recorded swing tracks the true one closely",
            test: (v) => v.params.measurementIntervalH === 3 && (v.facts.swingHiddenFraction as number) < 0.15,
          },
        },
        {
          id: "scorecard",
          phase: "analyze",
          title: "Check the scorecard agrees",
          instruction: "Confirm the sampling-interval criterion flips with the control.",
          check: { describe: "samplingIntervalOk is true at 3 h", test: (v) => v.facts.samplingIntervalOk === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name what the weekly plan hid",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "What does the 3-hour interval reveal that the weekly plan hid, and why 168 specifically was the wrong number to pick?",
            placeholder: "The fine interval reveals ...; 168 was wrong because ...",
          },
        },
      ],
    },
    {
      id: "revise-and-re-run",
      title: "Revise and re-run",
      question: "Which of your v1 conclusions survives v2, and which one turns out to have been the shelf, not the treatment?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, independentVariable: "light", ivLow: 6, ivHigh: 18, columnsBuilt: 3, controlledVariablesStated: false, randomizePositions: false, measurementIntervalH: 24, durationDays: 14 },
      steps: [
        {
          id: "v1",
          phase: "measure",
          title: "Run v1",
          instruction: "Run this flawed starter plan to day 14 and record its scorecard.",
          requireData: 1,
          check: { describe: "v1 finishes with a low design score", test: (v) => (v.facts.day as number) >= 14 && (v.facts.designScorePct as number) < 80 },
        },
        {
          id: "read-v1-faults",
          phase: "analyze",
          title: "Read v1's faults",
          instruction: "List which criteria v1 actually fails.",
          check: {
            describe: "Both controlled-variables and position-randomised are failing",
            test: (v) => v.facts.controlledVariablesOk === false && v.facts.positionRandomisedOk === false,
          },
        },
        {
          id: "v2",
          phase: "measure",
          title: "Fix it into v2",
          instruction: "Turn on Controlled variables stated and Randomise shelf positions, raise columns to 9, then re-run to day 14.",
          requireData: 2,
          check: {
            describe: "v2 clears every criterion this bench checks",
            test: (v) =>
              v.params.controlledVariablesStated === true && v.params.randomizePositions === true &&
              (v.params.columnsBuilt as number) >= 9 && (v.facts.day as number) >= 14 &&
              v.facts.conclusionSupported === true,
          },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare v1 and v2",
          instruction: "Compare the two scorecards side by side.",
          check: { describe: "v2 design score exceeds v1's", test: (v) => (v.facts.designScorePct as number) === 100 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what survived",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Which of your v1 conclusions survives in v2, and which one turns out to have been the shelf position, not the treatment?",
            placeholder: "What survives is ...; what turns out to have been the shelf is ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "clear-the-scorecard",
      title: "Clear the scorecard",
      brief: "Design a light-hours trial that clears every criterion on the design scorecard at once.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, independentVariable: "light", ivLow: 6, ivHigh: 18 },
      goal: {
        describe: "Every design criterion passes at once",
        test: (v) => v.facts.conclusionSupported === true,
      },
      stars: {
        two: {
          describe: "And the run has actually reached day 14",
          test: (v) => v.facts.conclusionSupported === true && (v.facts.day as number) >= 14,
        },
      },
      hints: [
        "Nine columns beats three for the replicates criterion just as well as it did on the four-chambers bench.",
        "The sampling interval has to be 12 hours or tighter to ever resolve a daily swing.",
        "Position only stops confounding the result once you randomise it.",
      ],
    },
    {
      id: "prove-the-swing-is-real",
      title: "Prove the swing is real",
      brief: "Get the recorded oxygen swing within 15% of the true swing without simply cranking the interval to its minimum.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, independentVariable: "snails", ivLow: 1, ivHigh: 8, columnsBuilt: 4, measurementIntervalH: 24, durationDays: 10 },
      goal: {
        describe: "Recorded swing within 15% of the true swing, interval no finer than 6 h",
        test: (v) => (v.facts.swingHiddenFraction as number) < 0.15 && (v.params.measurementIntervalH as number) >= 6,
      },
      hints: ["The Nyquist floor for a 24 h cycle is 12 h — you have room between 6 and 12 to spare."],
    },
  ],
};
