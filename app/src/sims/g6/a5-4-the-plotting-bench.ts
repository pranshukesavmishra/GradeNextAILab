import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { badge, caption, clamp01, hexA, isDarkTheme, vignette } from "@ui/scene";
import { barSeries, chartFrame, legend, scatterSeries } from "@ui/charts";

/**
 * The Plotting Bench: Charts That Lie — Grade 6, Unit A5.4: the chart is the
 * claim, not decoration added after the science.
 *
 * Nothing here is a physical simulation; the model is the grammar of graphics
 * itself. Five fixed, realistic datasets are generated once from real
 * relationships (a seasonal snowpack curve, a kelp-vs-temperature optimum, a
 * flat 45-year rainfall record, a stratified oxygen profile, a spread of
 * reaction times) and never touched again — the numbers a student sees are
 * exactly the numbers the chart draws from. Every mark is placed by one pure
 * transform, `(value - min) / (max - min)`, so choosing an axis start of
 * anything but zero on a bar chart genuinely multiplies the apparent
 * difference between two bars without changing a single underlying number.
 * A naive reader is computed, not scripted: it measures the rendered PIXEL
 * geometry of the current chart — bar heights, nothing else — the way an eye
 * would, and reports the effect size that geometry implies. The gap between
 * that apparent effect and the dataset's real effect is a genuine number, and
 * it is exactly zero whenever the chart is drawn honestly.
 */

/* ------------------------------------------------------------------ *
 * Column model — the grammar of graphics
 * ------------------------------------------------------------------ */

type ColType = "categorical" | "ordinal" | "continuous" | "temporal";

interface ColumnDef { key: string; label: string; unit: string; type: ColType; dataset: DatasetId }

type DatasetId = "sierra" | "kelp" | "reaction" | "rainfall" | "slough";

/** Deterministic pseudo-noise — a fixed "recorded" dataset, not a live draw. */
function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function noise(i: number, salt: number, amp: number): number {
  return (hash(i, salt) - 0.5) * 2 * amp;
}

interface Row { [key: string]: number }
interface Dataset { id: DatasetId; label: string; columns: ColumnDef[]; rows: Row[]; defaultX: string; defaultY: string }

/** The seasonal snowpack curve: peaks in March, four water-years of spread. */
function buildSierra(): Dataset {
  const monthly = [140, 175, 210, 260, 300, 220, 90, 30, 8, 4, 30, 85]; // Oct..Sep profile, mm SWE
  const yearMult = [0.85, 1.05, 1.2, 0.95];
  const rows: Row[] = [];
  for (let y = 0; y < 4; y++) {
    for (let m = 0; m < 12; m++) {
      const i = y * 12 + m;
      rows.push({ month: m + 1, waterYear: y + 1, swe: Math.max(0, monthly[m] * yearMult[y] + noise(i, 1, 8)) });
    }
  }
  return {
    id: "sierra", label: "Sierra snowpack",
    columns: [
      { key: "month", label: "Month", unit: "", type: "temporal", dataset: "sierra" },
      { key: "waterYear", label: "Water year", unit: "", type: "categorical", dataset: "sierra" },
      { key: "swe", label: "Snow water equivalent", unit: "mm", type: "continuous", dataset: "sierra" },
    ],
    rows, defaultX: "month", defaultY: "swe",
  };
}

/** Kelp canopy area vs sea-surface temperature: a real optimum, not a line. */
function buildKelp(): Dataset {
  const rows: Row[] = [];
  for (let i = 0; i < 96; i++) {
    const sst = 10 + (i % 24) * 0.5 + noise(i, 2, 0.3);
    const area = Math.max(0, 42 * Math.exp(-(((sst - 13.5) / 4.2) ** 2)) + noise(i, 3, 3));
    rows.push({ sst, kelpArea: area });
  }
  return {
    id: "kelp", label: "Monterey kelp",
    columns: [
      { key: "sst", label: "Sea surface temperature", unit: "°C", type: "continuous", dataset: "kelp" },
      { key: "kelpArea", label: "Kelp canopy area", unit: "ha", type: "continuous", dataset: "kelp" },
    ],
    rows, defaultX: "sst", defaultY: "kelpArea",
  };
}

/** 120 individual reaction times: a real spread around one mean. */
function buildReaction(): Dataset {
  const rows: Row[] = [];
  for (let i = 0; i < 120; i++) {
    const jitter = (hash(i, 4) + hash(i, 5) + hash(i, 6) - 1.5) / 1.5; // approx normal, [-1,1]
    rows.push({ personId: i + 1, reactionMs: Math.max(120, 250 + jitter * 70) });
  }
  return {
    id: "reaction", label: "Class reaction times",
    columns: [
      { key: "personId", label: "Student", unit: "", type: "ordinal", dataset: "reaction" },
      { key: "reactionMs", label: "Reaction time", unit: "ms", type: "continuous", dataset: "reaction" },
    ],
    rows, defaultX: "personId", defaultY: "reactionMs",
  };
}

/** 45 years, genuinely almost flat — the "cliff that is not there". */
function buildRainfall(): Dataset {
  const rows: Row[] = [];
  for (let i = 0; i < 45; i++) {
    rows.push({ year: 1980 + i, rainfallMm: 500 + noise(i, 7, 22) + 6 * Math.sin(i / 6) });
  }
  return {
    id: "rainfall", label: "Central Valley rainfall",
    columns: [
      { key: "year", label: "Year", unit: "", type: "temporal", dataset: "rainfall" },
      { key: "rainfallMm", label: "Annual rainfall", unit: "mm", type: "continuous", dataset: "rainfall" },
    ],
    rows, defaultX: "year", defaultY: "rainfallMm",
  };
}

/** Dissolved oxygen falling with depth: real stratification. */
function buildSlough(): Dataset {
  const rows: Row[] = [];
  for (let i = 0; i < 60; i++) {
    const depthM = (i % 15) * 0.25;
    const oxygenMgL = Math.max(0.3, 9.2 - 1.9 * depthM + noise(i, 8, 0.4));
    rows.push({ depthM, oxygenMgL });
  }
  return {
    id: "slough", label: "Slough oxygen by depth",
    columns: [
      { key: "depthM", label: "Depth", unit: "m", type: "continuous", dataset: "slough" },
      { key: "oxygenMgL", label: "Dissolved oxygen", unit: "mg/L", type: "continuous", dataset: "slough" },
    ],
    rows, defaultX: "depthM", defaultY: "oxygenMgL",
  };
}

const DATASETS: Record<DatasetId, Dataset> = {
  sierra: buildSierra(), kelp: buildKelp(), reaction: buildReaction(), rainfall: buildRainfall(), slough: buildSlough(),
};

const ALL_COLUMNS: ColumnDef[] = Object.values(DATASETS).flatMap((d) => d.columns);
function columnOf(key: string): ColumnDef | undefined {
  return ALL_COLUMNS.find((c) => c.key === key);
}

/** The active X/Y columns: the chosen key if it belongs to this dataset, else the dataset's own default. */
function activeColumns(dataset: Dataset, params: ParamValues): { x: ColumnDef; y: ColumnDef } {
  const wantX = columnOf(params.xVar as string);
  const wantY = columnOf(params.yVar as string);
  const x = wantX && wantX.dataset === dataset.id ? wantX : dataset.columns.find((c) => c.key === dataset.defaultX)!;
  const y = wantY && wantY.dataset === dataset.id ? wantY : dataset.columns.find((c) => c.key === dataset.defaultY)!;
  return { x, y };
}

/* ------------------------------------------------------------------ *
 * Chart-type compatibility — an incompatible pairing still draws, badly
 * ------------------------------------------------------------------ */

const CHART_ACCEPTS_X: Record<string, ColType[]> = {
  scatter: ["continuous", "ordinal", "temporal"],
  line: ["temporal", "ordinal"],
  bar: ["categorical", "ordinal", "temporal"],
  histogram: ["continuous"],
  pie: ["categorical"],
  box: ["categorical", "ordinal"],
};

function compatible(chartType: string, x: ColumnDef, y: ColumnDef): boolean {
  // A histogram is univariate: it bins whichever continuous column is being
  // measured (Y, by this sim's convention) and does not use X at all.
  if (chartType === "histogram") return y.type === "continuous";
  const okX = CHART_ACCEPTS_X[chartType]?.includes(x.type) ?? false;
  return okX && y.type === "continuous";
}

const CUSTOM_WINDOW = 20; // a fixed, tight zoomed-in axis span, in the dataset's own units

function yDomain(yAxisStart: string, yAxisMax: number, dataMin: number, dataMax: number): [number, number] {
  const range = Math.max(1e-6, dataMax - dataMin);
  if (yAxisStart === "auto") return [dataMin - range * 0.08, dataMax + range * 0.08];
  if (yAxisStart === "custom") return [yAxisMax - CUSTOM_WINDOW, yAxisMax];
  return [0, Math.max(yAxisMax, dataMax * 1.05, 1)];
}

/* ------------------------------------------------------------------ *
 * The critique engine — named faults, computed every frame
 * ------------------------------------------------------------------ */

interface Fault { key: string; active: boolean; note: string; weight: number }

function computeFaults(params: ParamValues, x: ColumnDef, y: ColumnDef, dataMin: number, dataMax: number): Fault[] {
  const chartType = params.chartType as string;
  const yAxisStart = params.yAxisStart as string;
  const [domMin, domMax] = yDomain(yAxisStart, params.yAxisMax as number, dataMin, dataMax);
  const dropped = domMax < dataMax || domMin > dataMin;
  return [
    {
      key: "truncatedAxis", weight: 30,
      active: chartType === "bar" && yAxisStart !== "zero",
      note: "A bar chart not anchored at zero multiplies every apparent difference.",
    },
    {
      key: "wrongMark", weight: 35,
      active: !compatible(chartType, x, y),
      note: `${chartType} does not honestly represent a ${x.type} axis paired with a ${y.type} one.`,
    },
    {
      key: "pieOfTimeSeries", weight: 35,
      active: chartType === "pie" && x.type === "temporal",
      note: "A pie needs parts of one whole at one moment, not a series across time.",
    },
    {
      key: "connectedNonSeries", weight: 25,
      active: chartType === "line" && x.type === "continuous",
      note: "Joining the dots claims an order or a path between them that does not exist.",
    },
    {
      key: "missingSpread", weight: 20,
      active: (params.aggregation as string) !== "every" && params.showSpread !== true,
      note: "Averaging away individual rows hides how much they actually varied.",
    },
    {
      key: "droppedRows", weight: 15,
      active: dropped,
      note: "The current axis limits clip real rows out of view.",
    },
  ];
}

function chartScore(faults: Fault[]): number {
  const lost = faults.filter((f) => f.active).reduce((s, f) => s + f.weight, 0);
  return Math.max(0, 100 - lost);
}

/* ------------------------------------------------------------------ *
 * The naive reader — reads pixel geometry, nothing else
 * ------------------------------------------------------------------ */

interface ReaderResult { text: string; apparentPct: number; truePct: number; gapPct: number; valid: boolean }

/**
 * For a bar-shaped read (min row vs max row on the current axis), the reader
 * measures the two bars' rendered pixel heights against the chart's own
 * plotted height and reports the visual gap as a percentage. Axis truncation
 * changes that percentage without changing one row of data — which is
 * exactly the honesty rule this instrument exists to demonstrate.
 */
function naiveReader(params: ParamValues, x: ColumnDef, y: ColumnDef, rows: Row[]): ReaderResult {
  const chartType = params.chartType as string;
  const values = rows.map((r) => r[y.key]).filter((v) => Number.isFinite(v));
  if (values.length < 2) return { text: "not enough data to read", apparentPct: 0, truePct: 0, gapPct: 0, valid: false };
  const dataMin = Math.min(...values), dataMax = Math.max(...values);
  const trueRange = Math.max(1e-9, dataMax - dataMin);
  const truePct = (trueRange / dataMax) * 100;

  if (chartType === "bar" || chartType === "line") {
    const [domMin, domMax] = yDomain(params.yAxisStart as string, params.yAxisMax as number, dataMin, dataMax);
    const domSpan = Math.max(1e-9, domMax - domMin);
    const pxMin = clamp01((dataMin - domMin) / domSpan);
    const pxMax = clamp01((dataMax - domMin) / domSpan);
    const apparentPct = pxMax > 0 ? ((pxMax - pxMin) / pxMax) * 100 : 0;
    const gapPct = Math.abs(apparentPct - truePct);
    const verb = gapPct > 15 ? "collapsed" : "changed only a little";
    return {
      text: `the ${y.label.toLowerCase()} ${verb} from start to finish`,
      apparentPct, truePct, gapPct, valid: true,
    };
  }

  if (chartType === "scatter") {
    // Pixel-space least-squares slope sign, from the two axis scales alone.
    const xs = rows.map((r) => r[x.key]);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (values[i] - my); den += (xs[i] - mx) ** 2; }
    const slope = den > 0 ? num / den : 0;
    return {
      text: slope > 0.01 ? "a rising relationship" : slope < -0.01 ? "a falling relationship" : "no clear relationship",
      apparentPct: 0, truePct: 0, gapPct: 0, valid: true,
    };
  }

  return { text: "no single conclusion for this chart type", apparentPct: 0, truePct: 0, gapPct: 0, valid: true };
}

/* ------------------------------------------------------------------ *
 * State — a light animation clock only; nothing here is physically simulated
 * ------------------------------------------------------------------ */

interface State { tSec: number }

const model: SimModel<State> = {
  init() {
    return { tSec: 0 };
  },
  step(state, dt) {
    if (dt <= 0) return state;
    return { tSec: state.tSec + dt };
  },
  readouts(_state, params) {
    const dataset = DATASETS[params.dataset as DatasetId];
    const { x, y } = activeColumns(dataset, params);
    const values = dataset.rows.map((r) => r[y.key]);
    const faults = computeFaults(params, x, y, Math.min(...values), Math.max(...values));
    const reader = naiveReader(params, x, y, dataset.rows);
    return [
      { key: "score", label: "Chart score", quantity: q(chartScore(faults) / 100, "percent"), semantic: "neutral", graphable: true },
      { key: "faultCount", label: "Active faults", quantity: q(faults.filter((f) => f.active).length, "count"), semantic: "hot", graphable: true },
      { key: "misreadingGap", label: "Misreading gap", quantity: q(reader.gapPct / 100, "percent"), semantic: "acid", graphable: true },
      { key: "rowsDrawn", label: "Rows drawn", quantity: q(dataset.rows.length, "count") },
    ];
  },
  facts(state, params) {
    const dataset = DATASETS[params.dataset as DatasetId];
    const { x, y } = activeColumns(dataset, params);
    const values = dataset.rows.map((r) => r[y.key]);
    const dataMin = Math.min(...values), dataMax = Math.max(...values);
    const faults = computeFaults(params, x, y, dataMin, dataMax);
    const reader = naiveReader(params, x, y, dataset.rows);
    const activeFaults = faults.filter((f) => f.active);
    return {
      tSec: state.tSec,
      dataset: dataset.id,
      xKey: x.key, yKey: y.key,
      xType: x.type, yType: y.type,
      compatible: compatible(params.chartType as string, x, y),
      chartType: params.chartType as string,
      chartScore: chartScore(faults),
      faultCount: activeFaults.length,
      faultList: activeFaults.map((f) => f.key).join(", "),
      truncatedAxis: faults[0].active,
      wrongMark: faults[1].active,
      pieOfTimeSeries: faults[2].active,
      connectedNonSeries: faults[3].active,
      missingSpread: faults[4].active,
      droppedRows: faults[5].active,
      readerText: reader.text,
      readerValid: reader.valid,
      apparentPct: reader.apparentPct,
      truePct: reader.truePct,
      misreadingGapPct: reader.gapPct,
      trueRange: dataMax - dataMin,
      dataMin, dataMax,
      rowCount: dataset.rows.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height } = rc;
  const dark = isDarkTheme(theme);
  ctx.fillStyle = dark ? "#111318" : "#f4f2ee";
  ctx.fillRect(0, 0, width, height);

  const dataset = DATASETS[params.dataset as DatasetId];
  const { x, y } = activeColumns(dataset, params);
  const values = dataset.rows.map((r) => r[y.key]);
  const dataMin = Math.min(...values), dataMax = Math.max(...values);
  const [yMin, yMax] = yDomain(params.yAxisStart as string, params.yAxisMax as number, dataMin, dataMax);
  const xs = dataset.rows.map((r) => r[x.key]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);

  const chartX = 16, chartY = 56, chartW = width - 32, chartH = height * 0.62;
  const chartType = params.chartType as string;
  const okCombo = compatible(chartType, x, y);

  const scales = chartFrame(ctx, chartX, chartY, chartW, chartH, {
    xMin, xMax, yMin, yMax,
    xLabel: x.label, yLabel: y.label, yUnit: y.unit,
    grid: "y",
  }, theme);

  const color = theme.sci[okCombo ? "producer" : "hot"];
  if (chartType === "scatter" || chartType === "line" || chartType === "histogram") {
    scatterSeries(ctx, dataset.rows.map((r) => ({ x: r[x.key], y: r[y.key] })), scales.sx, scales.sy, color, {
      theme, fit: chartType !== "histogram", fitLabel: chartType !== "histogram" ? "trend" : undefined,
    });
  } else {
    // Bar / pie / box: aggregate to one bar per distinct X value.
    const groups = new Map<number, number[]>();
    for (const r of dataset.rows) {
      const k = r[x.key];
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r[y.key]);
    }
    const keys = [...groups.keys()].sort((a, b) => a - b);
    const agg = params.aggregation as string;
    const barVals = keys.map((k) => {
      const arr = groups.get(k)!;
      if (agg === "mean" || agg === "every") return arr.reduce((a, b) => a + b, 0) / arr.length;
      if (agg === "total") return arr.reduce((a, b) => a + b, 0);
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    });
    const barScales = chartFrame(ctx, chartX, chartY, chartW, chartH, {
      xMin: -0.5, xMax: keys.length - 0.5, yMin, yMax, yLabel: y.label, yUnit: y.unit, grid: "y",
    }, theme);
    barSeries(ctx, barVals, barScales.sx, barScales.sy, color, { theme });
    if (params.showSpread === true) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.ink, 0.6);
      ctx.lineWidth = 1.5;
      keys.forEach((k, i) => {
        const arr = groups.get(k)!;
        const lo = Math.min(...arr), hi = Math.max(...arr);
        const px = barScales.sx(i);
        ctx.beginPath();
        ctx.moveTo(px, barScales.sy(lo));
        ctx.lineTo(px, barScales.sy(hi));
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  legend(ctx, chartX + 8, chartY + chartH + 24, [{ label: dataset.label, color, shape: "swatch" }], theme);

  /* --- verdict, score, reader ---------------------------------------- */
  const faults = computeFaults(params, x, y, dataMin, dataMax);
  const score = chartScore(faults);
  badge(ctx, width - 12, 20, `${score}`, theme, { align: "right", color: score >= 80 ? theme.sci["neutral"] : theme.sci["hot"], sub: "chart score" });
  badge(ctx, 12, 20, dataset.label, theme, { color: theme.accent });
  if (!okCombo) badge(ctx, width / 2, 20, "WRONG MARK FOR THIS DATA", theme, { align: "center", color: theme.sci["hot"] });

  if (params.readerTest !== false) {
    const reader = naiveReader(params, x, y, dataset.rows);
    const panelY = chartY + chartH + 40;
    ctx.fillStyle = dark ? "rgba(20,24,30,0.85)" : "rgba(255,255,255,0.9)";
    roundRect(ctx, 16, panelY, width - 32, 46, 8);
    ctx.fill();
    caption(ctx, 26, panelY + 16, `reader: "${reader.text}"`, theme, { size: 11, weight: 700 });
    if (reader.valid && reader.gapPct > 0.5) {
      caption(ctx, 26, panelY + 33, `apparent ${reader.apparentPct.toFixed(0)}% vs true ${reader.truePct.toFixed(0)}% — gap ${reader.gapPct.toFixed(0)} pts`, theme, {
        size: 10, color: theme.sci["hot"],
      });
    }
  }

  const active = faults.filter((f) => f.active);
  active.forEach((f, i) => {
    caption(ctx, 16, 40 + i * 14, `⚑ ${f.note}`, theme, { size: 9, color: theme.sci["hot"] });
  });

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  dataset: "sierra", xVar: "month", yVar: "swe", chartType: "line",
  yAxisStart: "zero", yAxisMax: 1200, axisScale: "linear",
  aggregation: "every", showSpread: false, readerTest: true,
};

export const plottingBenchSim: SimManifest<State> = {
  id: "g6.a5-4",
  title: "The Plotting Bench: Charts That Lie",
  tagline: "Load the same true rows into six different chart types and catch, by a computed number, exactly how the axis is doing the arguing.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "State that a chart is a claim: the same data can look flat or collapsing depending only on the axis.",
    "Match a chart type to a variable's actual type, and name why an incompatible pairing misleads.",
    "Compute the gap between what a chart visually implies and what the data actually shows.",
  ],
  misconceptions: [
    "A graph is decoration added after the science is done",
    "A chart cannot be wrong if the numbers on it are correct",
    "A mean is the whole story once you have it",
    "Joining points with a line is always fine",
  ],
  interactionHint: "Switch the Y-axis start to Custom and watch the reader's conclusion change with not one number in the data.",
  tickRate: 10,
  timeScale: 1,
  params: {
    dataset: {
      type: "option", label: "Dataset",
      options: [
        { value: "sierra", label: "Sierra snowpack" },
        { value: "kelp", label: "Monterey kelp" },
        { value: "reaction", label: "Class reaction times" },
        { value: "rainfall", label: "Central Valley rainfall" },
        { value: "slough", label: "Slough oxygen by depth" },
      ],
      default: "sierra",
      help: "Structural: which rows, columns and natural axes exist at all.",
    },
    xVar: {
      type: "option", label: "X variable",
      options: ALL_COLUMNS.map((c) => ({ value: c.key, label: `${c.label} (${DATASETS[c.dataset].label})` })),
      default: "month",
      help: "Ignored if it does not belong to the current dataset.",
    },
    yVar: {
      type: "option", label: "Y variable",
      options: ALL_COLUMNS.map((c) => ({ value: c.key, label: `${c.label} (${DATASETS[c.dataset].label})` })),
      default: "swe",
      help: "Ignored if it does not belong to the current dataset.",
    },
    chartType: {
      type: "option", label: "Chart type",
      options: [
        { value: "scatter", label: "Scatter" }, { value: "line", label: "Line" }, { value: "bar", label: "Bar" },
        { value: "histogram", label: "Histogram" }, { value: "pie", label: "Pie" }, { value: "box", label: "Box plot" },
      ],
      default: "line",
      help: "Which mark is drawn — an incompatible pairing is drawn anyway, badly.",
    },
    yAxisStart: {
      type: "option", label: "Y-axis start",
      options: [{ value: "zero", label: "Zero" }, { value: "auto", label: "Auto-fit" }, { value: "custom", label: "Custom" }],
      default: "zero",
      help: "Anything but zero on a bar chart raises the truncation fault.",
    },
    yAxisMax: { type: "number", label: "Y-axis maximum", kind: "ratio", min: 1, max: 1200, step: 1, default: 1200, help: "The ceiling of the visible axis; under Custom, also fixes a tight 20-unit window." },
    axisScale: { type: "option", label: "Axis scale", options: [{ value: "linear", label: "Linear" }, { value: "log", label: "Logarithmic" }], default: "linear" },
    aggregation: {
      type: "option", label: "Aggregation",
      options: [{ value: "every", label: "Every row" }, { value: "mean", label: "Mean per group" }, { value: "median", label: "Median per group" }, { value: "total", label: "Total per group" }],
      default: "every",
      help: "How many marks are drawn, and how much individual spread is hidden.",
    },
    showSpread: { type: "boolean", label: "Show spread", default: false, help: "Draws a range whisker on every aggregated group." },
    readerTest: { type: "boolean", label: "Reader test", default: true, help: "Whether the naive reader states the conclusion your chart supports." },
  },
  overlays: [],
  model,
  render,
  labs: [
    {
      id: "snow-through-the-year",
      title: "Snow through the year",
      question: "Which chart shows the melt season, and why is a pie impossible for these data?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, dataset: "sierra", xVar: "month", yVar: "swe", chartType: "line", yAxisStart: "zero" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Twelve months of snow water equivalent, four years of it. Commit before switching chart types.",
          predict: {
            prompt: "Which chart type will genuinely misrepresent these data?",
            options: ["Line", "Bar", "Pie"],
            correct: 2,
            reveal: "Pie. A pie needs parts of one whole measured at one moment; twelve months of a changing snowpack are not parts of anything.",
          },
        },
        {
          id: "try-line",
          phase: "measure",
          title: "Try the line chart",
          instruction: "Confirm the line chart is a compatible, honest pairing for month vs snowpack.",
          check: { describe: "Line chart, no wrong-mark fault", test: (v) => v.params.chartType === "line" && v.facts.wrongMark === false },
        },
        {
          id: "try-pie",
          phase: "measure",
          title: "Now try the pie",
          instruction: "Switch to a pie chart on the same data and watch the fault fire.",
          check: { describe: "Pie-of-time-series fault active", test: (v) => v.params.chartType === "pie" && v.facts.pieOfTimeSeries === true },
        },
        {
          id: "score",
          phase: "analyze",
          title: "Compare the scores",
          instruction: "Switch back to the line chart and compare its score to the pie's.",
          check: { describe: "Line chart's score is clearly higher than the pie's was", test: (v) => v.params.chartType === "line" && (v.facts.chartScore as number) >= 90 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the reason",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Which chart shows the melt season, and exactly why is a pie chart impossible for these data?",
            placeholder: "The line chart shows it because ...; a pie is impossible because ...",
          },
        },
      ],
    },
    {
      id: "the-cliff-that-is-not-there",
      title: "The cliff that is not there",
      question: "By how many millimetres did rainfall actually change, and what did your axis do to that number?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "zero" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the honest chart",
          instruction: "45 real years of rainfall, bar chart, axis at zero. Commit before touching the axis.",
          predict: {
            prompt: "At a zero-based axis, will this chart look like a collapse?",
            options: ["Yes, rainfall clearly collapses", "No, it looks nearly flat"],
            correct: 1,
            reveal: "Nearly flat. The true year-to-year range is small compared to the full zero-based scale — which is exactly why truncating the axis is the only way to manufacture a cliff.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Record the honest read",
          instruction: "At zero, record the reader's conclusion and the true range in mm.",
          requireData: 1,
          check: { describe: "Zero-based, reader sees a small gap", test: (v) => v.params.yAxisStart === "zero" && (v.facts.misreadingGapPct as number) < 5 },
        },
        {
          id: "truncate",
          phase: "measure",
          title: "Narrow the range",
          instruction: "Set Y-axis start to Custom and slide the maximum down over the data until the reader announces a collapse.",
          requireData: 2,
          check: {
            describe: "Truncated axis, the reader's apparent gap now overstates the true one",
            test: (v) => v.params.yAxisStart === "custom" && v.facts.truncatedAxis === true && (v.facts.misreadingGapPct as number) > 15,
          },
          hints: ["The true range readout never moves — only the apparent one does."],
        },
        {
          id: "quantify",
          phase: "analyze",
          title: "Quantify the lie",
          instruction: "Compare the apparent and true percentages the model just computed.",
          check: { describe: "Apparent percentage is well above the true one", test: (v) => (v.facts.apparentPct as number) > (v.facts.truePct as number) + 15 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Answer the question",
          instruction: "Give the real number and name what your axis did to it.",
          write: {
            prompt: "By how many millimetres did rainfall actually change across these 45 years, and what did your axis choice do to that number on screen?",
            placeholder: "The true range was about ... mm; the truncated axis made it look like ...",
          },
        },
      ],
    },
    {
      id: "kelp-and-warm-water",
      title: "Kelp and warm water",
      question: "Two measurements with no time order — which mark is right, and what does joining the dots falsely claim?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, dataset: "kelp", xVar: "sst", yVar: "kelpArea", chartType: "scatter" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the right mark",
          instruction: "96 site-temperature pairs, no natural order between them.",
          predict: {
            prompt: "Which mark honestly represents paired measurements with no sequence?",
            options: ["Scatter", "Line"],
            correct: 0,
            reveal: "Scatter. Each point is an independent pair; there is no next point to connect to, so a line invents an order the data does not have.",
          },
        },
        {
          id: "scatter-check",
          phase: "measure",
          title: "Confirm the scatter",
          instruction: "With scatter selected, confirm there is no connected-non-series fault.",
          check: { describe: "Scatter, no fault", test: (v) => v.params.chartType === "scatter" && v.facts.connectedNonSeries === false },
        },
        {
          id: "line-check",
          phase: "measure",
          title: "Switch to line",
          instruction: "Switch to a line chart on the same two columns and watch the fault fire.",
          check: { describe: "Connected-non-series fault now active", test: (v) => v.params.chartType === "line" && v.facts.connectedNonSeries === true },
        },
        {
          id: "direction",
          phase: "analyze",
          title: "Read the relationship",
          instruction: "Switch back to scatter and read the reader's conclusion about direction.",
          check: { describe: "The reader reports a relationship, valid", test: (v) => v.params.chartType === "scatter" && v.facts.readerValid === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the false claim",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "Which mark is right for these data, and exactly what does joining the dots with a line falsely claim about them?",
            placeholder: "Scatter is right because ...; a line would falsely claim ...",
          },
        },
      ],
    },
    {
      id: "one-hundred-twenty-people",
      title: "One hundred and twenty people",
      question: "What does a histogram reveal that one bar per person hides, and what does the mean alone leave out?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-6"],
      setup: { ...BASE_SETUP, dataset: "reaction", xVar: "personId", yVar: "reactionMs", chartType: "histogram", aggregation: "every", showSpread: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict what a mean hides",
          instruction: "120 individual reaction times. Commit before aggregating them.",
          predict: {
            prompt: "Averaging 120 reaction times into one mean, with spread off, will...",
            options: ["Lose nothing important", "Hide how spread out people actually were"],
            correct: 1,
            reveal: "Hide the spread. A single mean cannot tell a tight cluster of similar reflexes from a wide range of very different ones.",
          },
        },
        {
          id: "histogram",
          phase: "measure",
          title: "Read the histogram",
          instruction: "Confirm the histogram is a compatible, honest chart for this single continuous variable.",
          check: { describe: "Histogram, compatible", test: (v) => v.params.chartType === "histogram" && v.facts.compatible === true },
        },
        {
          id: "aggregate-no-spread",
          phase: "measure",
          title: "Aggregate without spread",
          instruction: "Switch to a bar chart, set aggregation to Mean per group, and leave spread off.",
          check: {
            describe: "Aggregated with spread hidden — the missing-spread fault fires",
            test: (v) => v.params.aggregation === "mean" && v.params.showSpread === false && v.facts.missingSpread === true,
          },
        },
        {
          id: "aggregate-with-spread",
          phase: "measure",
          title: "Now turn spread on",
          instruction: "Turn Show spread on and watch the fault clear.",
          check: { describe: "Spread shown, fault clears", test: (v) => v.params.showSpread === true && v.facts.missingSpread === false },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what each view earns",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "What does the histogram reveal about the class that one bar per person hides, and what does the mean alone leave out?",
            placeholder: "The histogram shows ...; the mean alone leaves out ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "manufacture-and-defuse",
      title: "Manufacture the cliff, then defuse it",
      brief: "On the rainfall data, truncate the axis until the misreading gap passes 20 points, then fix it back to an honest chart.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar" },
      goal: {
        describe: "Ends with a zero-based axis and a chart score of at least 90",
        test: (v) => v.params.yAxisStart === "zero" && (v.facts.chartScore as number) >= 90,
      },
      hints: [
        "Switch Y-axis start to Custom first, and confirm the misreading gap really did climb past 20.",
        "Zero is the only axis start a bar chart never gets docked for.",
      ],
    },
    {
      id: "one-honest-chart-per-dataset",
      title: "One honest chart per dataset",
      brief: "Load all five datasets in turn and leave each on a chart type that scores at least 90.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "The currently loaded dataset scores at least 90",
        test: (v) => (v.facts.chartScore as number) >= 90,
      },
      hints: [
        "A scatter is always a safe, compatible choice for two continuous variables.",
        "A histogram wants exactly one continuous variable, not two.",
      ],
    },
  ],
};
