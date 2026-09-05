import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, hexA, isDarkTheme, particleField, plastic,
  softShadow, sphere, vignette, type Particle,
} from "@ui/scene";
import { chartFrame, barSeries } from "@ui/charts";

/**
 * Two Bays: The Warehouse and the Solver — Grade 6, Unit A3.3: a physical
 * model can surprise you, a digital model cannot, and only the digital one
 * lets you change the Bay before lunch.
 *
 * One real estuarine salt-intrusion system, one number that names where the
 * salt front sits (X2, kilometres from the Golden Gate — the classic real
 * measure the Bay's own managers use), computed three ways: the field record
 * (the arbiter), a physical hydraulic analogue with its own fixed distortion
 * from scaling everything down 1,000-to-1 horizontally and only 100-to-1
 * vertically, and a digital finite-volume solver whose accuracy is entirely a
 * function of how many cells it can afford. Both models relax toward their
 * own target after the Delta inflow, the tide or a barrier changes — the
 * physical apparatus at a fixed, real hydraulic pace no dial can rush, the
 * digital solver at whatever speed the compute dial allows. Neither model
 * ever equals the field record: the physical one carries a bias no run
 * length erases, and the digital one carries an error that shrinks with
 * resolution but jumps sharply the moment the grid can no longer resolve the
 * Carquinez Strait as more than a single cell.
 *
 * The honesty rule this sim exists to uphold: the physical model also throws
 * real, unprogrammed turbulence near barriers and in a big tide — logged as
 * genuine surprises, drawn from the same random stream as everything else,
 * never decoration. The digital model never surprises anyone; it only ever
 * computes what was written into it.
 *
 * Clock: `step` receives real/engine seconds. The physical track always
 * relaxes at a fixed real-hydraulic pace (no dial touches it); the digital
 * track relaxes at Digital speed simulated-seconds-per-real-second. Both
 * tracks stop advancing once they reach the chosen Run length, in tidal
 * days, exactly like a real experiment ends when its window closes.
 */

/* ------------------------------------------------------------------ *
 * Constants — the estuary's own real numbers
 * ------------------------------------------------------------------ */

// A log-linear X2-vs-outflow fit in the spirit of the real relationship
// (X2 falls as Delta outflow rises), tuned so the default 700 m3/s gives a
// realistic ~70 km and the 100-3000 m3/s range spans the real 50-100 km band.
const X2_A = 149.16, X2_B = 11.76, X2_MIN = 50, X2_MAX = 100;
const TIDE_REF = 1.2;      // m, the control's own default
const TIDE_COEF = 5;       // km of X2 per metre of tide amplitude away from the reference
const DREDGE_SHIFT_KM = 3; // a wider Carquinez lets salt push seaward a little more easily
const BARRIER_SHIFT_KM = 1.5; // per Reber dam — less cross-section to mix through

const PHYSICAL_BIAS_KM = 4;       // fixed scale-model distortion, never erased by run length
const PHYSICAL_DAYS_PER_REAL_SEC = 0.5; // real hydraulic apparatus — no dial rushes this
const TAU_DAYS = 4;               // relaxation time constant toward the current target
const SURPRISE_BASE_RATE = 0.03;  // per tidal day, baseline chance of a logged eddy

const CARQUINEZ_WIDTH_M = 1500;   // roughly the strait's real width
const DIGITAL_ERROR_FLOOR = 0.8;  // km — never reaches zero, however fine the mesh
const DIGITAL_ERROR_SPAN = 4;     // km of extra error a coarse mesh adds
const CARQUINEZ_PENALTY_KM = 6;   // a mesh that cannot resolve the strait at all
const SOLVER_COST_COEF = 1;       // seconds, calibrated so 200 m costs about 5 s

const BASE_CLEARANCE_H = 18;      // hours for a 90% dye clearance at the reference tide
const BARRIER_SLOWDOWN = 15;      // a dammed lobe flushes this many times slower

const SAL_OCEAN = 32;   // PSU at the Golden Gate itself
const HALVING_KM = 8;   // salinity halves (or doubles) every this many km from X2

type ModelUse = "physical" | "digital" | "sideBySide";
type DyePort = "goldenGate" | "northBay" | "southBay" | "carquinez" | "delta";

interface Station { key: string; label: string; km: number }
const STATIONS: Station[] = [
  { key: "goldenGate", label: "Golden Gate", km: 0 },
  { key: "richmond", label: "Richmond", km: 15 },
  { key: "carquinez", label: "Carquinez", km: 48 },
  { key: "antioch", label: "Antioch", km: 75 },
  { key: "rioVista", label: "Rio Vista", km: 91 },
];

function clampRange(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** The field's own (undistorted) salt-front position, km from the Golden Gate. */
function x2Field(params: ParamValues): number {
  const inflow = params.deltaInflow as number;
  const tide = params.tideAmplitude as number;
  let x2 = X2_A - X2_B * Math.log(inflow);
  x2 += TIDE_COEF * (tide - TIDE_REF);
  if (params.dredgedChannel === true) x2 -= DREDGE_SHIFT_KM;
  if (params.reberNorth === true) x2 -= BARRIER_SHIFT_KM;
  if (params.reberSouth === true) x2 -= BARRIER_SHIFT_KM;
  return clampRange(x2, X2_MIN, X2_MAX);
}

function carquinezResolved(cellSizeM: number): boolean {
  return cellSizeM < CARQUINEZ_WIDTH_M;
}

/** The digital solver's own systematic error, km — shrinks with resolution, never to zero. */
function digitalErrorKm(cellSizeM: number): number {
  const resFactor = clampRange((2000 - cellSizeM) / (2000 - 50), 0, 1);
  let err = DIGITAL_ERROR_FLOOR + DIGITAL_ERROR_SPAN * (1 - resFactor);
  if (!carquinezResolved(cellSizeM)) err += CARQUINEZ_PENALTY_KM;
  return err;
}

function solverCostSeconds(cellSizeM: number): number {
  return SOLVER_COST_COEF / (cellSizeM / 1000);
}

function clearanceHours(params: ParamValues): number {
  const tide = params.tideAmplitude as number;
  const port = params.dyeReleasePoint as DyePort;
  const behindDam =
    (port === "northBay" && params.reberNorth === true) ||
    (port === "southBay" && params.reberSouth === true);
  let h = BASE_CLEARANCE_H / Math.max(0.3, tide / TIDE_REF);
  if (behindDam) h *= BARRIER_SLOWDOWN;
  return h;
}

/** Salinity at a station, PSU — anchored exactly at X2's own definition (2 PSU there). */
function salinityAt(stationKm: number, x2: number): number {
  const psu = 2 * Math.pow(2, (x2 - stationKm) / HALVING_KM);
  return clampRange(psu, 0, SAL_OCEAN);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  elapsedDaysPhysical: number;
  elapsedDaysDigital: number;
  x2Physical: number;
  x2Digital: number;
  surprisesCount: number;
  lastSurprise: string;
}

function buildWorld(params: ParamValues): State {
  const field = x2Field(params);
  return {
    elapsedDaysPhysical: 0, elapsedDaysDigital: 0,
    x2Physical: field, x2Digital: field,
    surprisesCount: 0, lastSurprise: "",
  };
}

const model: SimModel<State> = {
  init(params) {
    return buildWorld(params);
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const mode = params.modelInUse as ModelUse;
    const field = x2Field(params);
    const runLen = params.runLengthDays as number;
    const s: State = { ...state };

    if (mode !== "digital" && s.elapsedDaysPhysical < runLen) {
      const ddays = Math.min(runLen - s.elapsedDaysPhysical, dt * PHYSICAL_DAYS_PER_REAL_SEC);
      s.elapsedDaysPhysical += ddays;
      const target = field + PHYSICAL_BIAS_KM;
      s.x2Physical += (target - s.x2Physical) * Math.min(1, ddays / TAU_DAYS);
      const tide = params.tideAmplitude as number;
      const dammed = params.reberNorth === true || params.reberSouth === true;
      const rate = SURPRISE_BASE_RATE * (dammed ? 2 : 1) * (tide > 1.4 ? 1.5 : 1);
      if (ctx.rng.chance(clampRange(rate * ddays, 0, 0.95))) {
        const nudge = ctx.rng.normal(0, 1.2);
        s.x2Physical += nudge;
        s.surprisesCount += 1;
        s.lastSurprise = dammed
          ? "a standing eddy behind the barrier"
          : nudge > 0 ? "a salt finger pushing upstream" : "a fresh plume sliding along the far bank";
      }
    }

    if (mode !== "physical" && s.elapsedDaysDigital < runLen) {
      const speed = params.digitalSpeed as number;
      const ddays = Math.min(runLen - s.elapsedDaysDigital, (dt * speed) / 86400);
      s.elapsedDaysDigital += ddays;
      const target = field + digitalErrorKm(params.cellSize as number);
      s.x2Digital += (target - s.x2Digital) * Math.min(1, ddays / TAU_DAYS);
    }

    return s;
  },

  readouts(state, params) {
    const field = x2Field(params);
    const cost = solverCostSeconds(params.cellSize as number);
    return [
      { key: "x2Field", label: "Salt front — field", unit: "km", quantity: q(field * 1000, "length"), semantic: "producer", graphable: true },
      { key: "x2Physical", label: "Salt front — physical", unit: "km", quantity: q(state.x2Physical * 1000, "length"), semantic: "hot", graphable: true },
      { key: "x2Digital", label: "Salt front — digital", unit: "km", quantity: q(state.x2Digital * 1000, "length"), semantic: "cold", graphable: true },
      { key: "agreementPhysical", label: "Physical error vs field", unit: "km", quantity: q(Math.abs(state.x2Physical - field) * 1000, "length"), semantic: "acid" },
      { key: "agreementDigital", label: "Digital error vs field", unit: "km", quantity: q(Math.abs(state.x2Digital - field) * 1000, "length"), semantic: "acid" },
      { key: "solverCost", label: "Solver cost", unit: "s", quantity: q(cost, "time"), semantic: "field" },
      { key: "clearance", label: "Tracer clearance", unit: "h", quantity: q(clearanceHours(params) * 3600, "time"), semantic: "velocity" },
      { key: "surprises", label: "Surprises logged", quantity: q(state.surprisesCount, "count"), semantic: "producer", graphable: true },
    ];
  },

  facts(state, params) {
    const field = x2Field(params);
    const cellSize = params.cellSize as number;
    const stationFacts: Record<string, number> = {};
    for (const st of STATIONS) {
      stationFacts[`sal_${st.key}_field`] = salinityAt(st.km, field);
      stationFacts[`sal_${st.key}_physical`] = salinityAt(st.km, state.x2Physical);
      stationFacts[`sal_${st.key}_digital`] = salinityAt(st.km, state.x2Digital);
    }
    return {
      x2Field: field,
      x2Physical: state.x2Physical,
      x2Digital: state.x2Digital,
      agreementPhysical: Math.abs(state.x2Physical - field),
      agreementDigital: Math.abs(state.x2Digital - field),
      elapsedDaysPhysical: state.elapsedDaysPhysical,
      elapsedDaysDigital: state.elapsedDaysDigital,
      carquinezResolved: carquinezResolved(cellSize),
      solverCostSeconds: solverCostSeconds(cellSize),
      tracerClearanceH: clearanceHours(params),
      surprisesCount: state.surprisesCount,
      scaleEffectOverlay: params.scaleEffectOverlay === true,
      physicalDistortionKm: PHYSICAL_BIAS_KM,
      modelInUse: params.modelInUse as string,
      ...stationFacts,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function drawBasin(rc: RenderContext<State>, x: number, y: number, w: number, h: number, x2Km: number, label: string, color: string, dark: boolean) {
  const { ctx, theme, params } = rc;
  softShadow(ctx, () => {
    plastic(ctx, x, y, w, h, dark ? "#2a3038" : "#c7cbd1", { radius: 8, gloss: 0.15 });
  }, { blur: 8, dy: 3, alpha: 0.25 });
  // The estuary as a shrinking wedge, Gate on the left, Delta on the right.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 4, y + 4, w - 8, h - 8);
  ctx.clip();
  const km = clamp01(x2Km / 100);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, mixHex("#1c6f8c", "#0c2733", 0.15));
  grad.addColorStop(clamp01(km), mixHex("#3fae8a", "#0c2733", 0.2));
  grad.addColorStop(1, mixHex("#2f7d4a", "#0c2733", 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // The salt-front marker itself.
  const fx = x + (w - 8) * km + 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(fx, y + 4);
  ctx.lineTo(fx, y + h - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  for (const st of STATIONS) {
    const sx = x + 4 + (w - 8) * clamp01(st.km / 100);
    sphere(ctx, sx, y + h - 10, 3, hexA("#ffffff", 0.85), { rim: false });
  }
  caption(ctx, x + w / 2, y - 8, label, theme, { align: "center", size: 10, weight: 800, color: theme.inkSoft });
  caption(ctx, fx, y + h + 12, `${num(x2Km, 1)} km`, theme, { align: "center", size: 10, weight: 700, color });
  if (label.toLowerCase().includes("physical") && params.scaleEffectOverlay === true) {
    ctx.save();
    ctx.fillStyle = hexA("#e0a030", 0.14);
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.restore();
    caption(ctx, x + w / 2, y + h / 2, "10x vertical exaggeration + mm-depth surface tension", theme, {
      align: "center", size: 9, color: theme.sci["hot"], weight: 700,
    });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, time } = rc;
  const showStations = overlays.stations !== false;
  const chartH = showStations ? Math.round(height * 0.26) : 0;
  const stageH = height - chartH - (showStations ? 6 : 0);
  const dark = isDarkTheme(theme);
  const mode = params.modelInUse as ModelUse;
  const field = x2Field(params);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);

  const both = mode === "sideBySide";
  const basinW = both ? width * 0.42 : width * 0.7;
  const basinH = stageH * 0.3;
  if (mode !== "digital") {
    drawBasin(rc, width * 0.04, stageH * 0.16, basinW, basinH, state.x2Physical, "PHYSICAL BASIN", theme.sci["hot"], dark);
  }
  if (mode !== "physical") {
    const dx = both ? width * 0.54 : width * 0.04;
    drawBasin(rc, dx, stageH * 0.16, basinW, basinH, state.x2Digital, "DIGITAL SOLVER", theme.sci["cold"] ?? "#4aa3c9", dark);
  }
  drawBasin(rc, width * 0.04, stageH * 0.58, width * 0.92, basinH * 0.7, field, "FIELD RECORD (the arbiter)", theme.sci["producer"] ?? "#3fae5a", dark);

  // Surprises: a small drift of unprogrammed eddies over the physical basin only.
  if (mode !== "digital" && state.surprisesCount > 0) {
    const parts: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      const t = (time * 0.3 + i * 0.13) % 1;
      parts.push({
        x: width * 0.04 + basinW * (0.2 + 0.6 * ((i * 37) % 100) / 100),
        y: stageH * 0.16 + basinH * (0.3 + 0.4 * t),
        r: 1.5, a: 0.4 * (1 - t),
      });
    }
    particleField(ctx, parts, theme.sci["hot"], { alpha: 0.5 });
  }

  badge(ctx, 12, 20, `${num(state.elapsedDaysPhysical, 1)}/${num(params.runLengthDays as number, 0)} tidal days (physical)`, theme, { color: theme.sci["hot"] });
  badge(ctx, width - 12, 20, `${num(state.elapsedDaysDigital, 1)}/${num(params.runLengthDays as number, 0)} tidal days (digital)`, theme, { align: "right", color: theme.sci["cold"] ?? theme.accent });
  badge(ctx, width / 2, 20, `cost ${num(solverCostSeconds(params.cellSize as number), 1)} s · ${carquinezResolved(params.cellSize as number) ? "strait resolved" : "strait NOT resolved"}`, theme, {
    align: "center", color: carquinezResolved(params.cellSize as number) ? theme.sci["neutral"] : theme.sci["hot"],
  });

  if (state.surprisesCount > 0 && state.lastSurprise) {
    caption(ctx, width * 0.04, stageH * 0.5, `surprise: ${state.lastSurprise}`, theme, { size: 10, color: theme.sci["hot"], weight: 700 });
  }

  vignette(ctx, width, stageH, 0.16);
  ctx.restore();

  if (showStations) {
    const x = 8, y = stageH + 6, w = width - 16, h = chartH - 6;
    const { sx, sy } = chartFrame(ctx, x, y, w, h, {
      xMin: -0.5, xMax: STATIONS.length - 0.5, yMin: 0, yMax: SAL_OCEAN,
      title: "Salinity at five stations (field)", yLabel: "PSU", grid: "y",
    }, theme);
    const values = STATIONS.map((st) => salinityAt(st.km, field));
    barSeries(ctx, values, sx, sy, theme.sci["producer"] ?? theme.accent, { theme, radius: 3 });
    STATIONS.forEach((st, i) => {
      caption(ctx, sx(i), y + h - 4, st.label, theme, { align: "center", size: 8, color: theme.inkSoft });
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  modelInUse: "sideBySide", deltaInflow: 700, tideAmplitude: 1.2,
  reberNorth: false, reberSouth: false, dredgedChannel: false,
  dyeReleasePoint: "goldenGate", cellSize: 200, runLengthDays: 14,
  scaleEffectOverlay: false, digitalSpeed: 5000,
};

export const twoBaysSim: SimManifest<State> = {
  id: "g6.a3-3",
  title: "Two Bays: The Warehouse and the Solver",
  tagline: "Race a real hydraulic Bay model against a digital solver for the same salt front, and see each one miss in its own direction.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Compare a physical scale model and a digital solver against the same field record, not against each other.",
    "Explain why a physical model can show an emergent surprise a digital model never will.",
    "Show that a digital model's error is a real function of its resolution, with a sharp penalty once a real feature falls below one grid cell.",
  ],
  misconceptions: [
    "The digital model is simply the more realistic one",
    "A finer mesh always costs the same to run",
    "A physical model with the right scale ratios has no error at all",
    "A dammed lobe behaves like the open bay, only smaller",
  ],
  interactionHint: "Run side-by-side, then push the digital cell size coarse until the Carquinez Strait can no longer fit inside one cell.",
  tickRate: 30,
  timeScale: 1,
  params: {
    modelInUse: {
      type: "option", label: "Model in use",
      options: [
        { value: "physical", label: "Physical" },
        { value: "digital", label: "Digital" },
        { value: "sideBySide", label: "Side-by-side" },
      ],
      default: "sideBySide",
      help: "Which basin, solver, or both are driving the run.",
    },
    deltaInflow: {
      type: "number", label: "Delta inflow (m³/s)", kind: "ratio",
      min: 100, max: 3000, step: 10, default: 700,
      help: "Combined Sacramento and San Joaquin freshwater flow. More flow pushes the salt front seaward.",
    },
    tideAmplitude: {
      type: "number", label: "Tide amplitude", kind: "length", unit: "m",
      min: 0, max: 2, step: 0.05, default: 1.2,
      help: "Tide machine stroke and the digital boundary forcing. More tide means more mixing.",
    },
    reberNorth: { type: "boolean", label: "Reber north dam", default: false, help: "Bars the north bay into its own slow-flushing lobe." },
    reberSouth: { type: "boolean", label: "Reber south dam", default: false, help: "Bars the south bay into its own slow-flushing lobe." },
    dredgedChannel: { type: "boolean", label: "Dredged 15 m channel", default: false, help: "Widens Suisun Bay's cross-section, easing the front seaward." },
    dyeReleasePoint: {
      type: "option", label: "Dye release point",
      options: [
        { value: "goldenGate", label: "Golden Gate" },
        { value: "northBay", label: "North Bay" },
        { value: "southBay", label: "South Bay" },
        { value: "carquinez", label: "Carquinez" },
        { value: "delta", label: "Delta" },
      ],
      default: "goldenGate",
      help: "Where the tracer plume starts, in both models.",
    },
    cellSize: {
      type: "number", label: "Digital cell size", kind: "length", unit: "m",
      min: 50, max: 2000, step: 10, default: 200,
      help: "Mesh resolution, solver cost, and whether Carquinez Strait exists as more than one cell.",
    },
    runLengthDays: {
      type: "number", label: "Run length (tidal days)", kind: "count",
      min: 1, max: 30, step: 1, default: 14,
      help: "How long both models run before the salt front is read.",
    },
    scaleEffectOverlay: { type: "boolean", label: "Scale-effect overlay", default: false, help: "Marks where the physical model's own distortions dominate." },
    digitalSpeed: {
      type: "number", label: "Digital speed", kind: "ratio",
      min: 1, max: 100000, step: 1, default: 5000,
      help: "Simulated seconds per real second, on the solver only. The physical basin never speeds up.",
    },
  },
  overlays: [
    { key: "stations", label: "Station salinity chart", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "same-question-two-models",
      title: "Same question, two models",
      question: "Where does the salt front sit in each model after 14 tidal days, and which is closer to the field stations?",
      bands: ["6-8"],
      minutes: 16,
      standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Both models are about to run for 14 tidal days against the same forcing.",
          predict: {
            prompt: "Will the physical and digital salt fronts land on the exact same kilometre mark?",
            options: ["Yes, both are just numbers from the same equations", "No, each has its own characteristic error"],
            correct: 1,
            reveal: "No. The physical basin carries a fixed distortion from its own scale ratios; the digital solver carries a resolution-dependent error. Neither is the field record.",
          },
        },
        {
          id: "run-both",
          phase: "measure",
          title: "Run both tracks out",
          instruction: "Press play and let both tracks reach 14 tidal days.",
          check: { describe: "Both tracks reached the run length", test: (v) => (v.facts.elapsedDaysPhysical as number) >= 14 && (v.facts.elapsedDaysDigital as number) >= 14 },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Compare against the field",
          instruction: "Read the agreement readouts for both models.",
          requireData: 1,
          check: {
            describe: "Both models disagree with the field by a real, nonzero amount",
            test: (v) => Math.abs(v.facts.agreementPhysical as number) > 0.05 && Math.abs(v.facts.agreementDigital as number) > 0.05,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the two errors",
          instruction: "Think about what causes each model's disagreement.",
          write: {
            prompt: "Name one reason the physical model misses and a different reason the digital model misses.",
            placeholder: "The physical model misses because ... The digital model misses because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what neither model is",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Neither model equals the field record. What is each one actually good for, then?",
            placeholder: "The physical model is good for ... The digital model is good for ...",
          },
        },
      ],
    },
    {
      id: "test-the-reber-plan",
      title: "Test the Reber Plan",
      question: "Two dams are meant to make fresh-water lakes. What happens to flushing and salinity behind them?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, reberNorth: true, reberSouth: true, dyeReleasePoint: "northBay" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the flush time",
          instruction: "Dye is about to be released behind the north dam.",
          predict: {
            prompt: "Will it clear out faster or much slower than at the open Golden Gate?",
            options: ["Faster", "Much slower"],
            correct: 1,
            reveal: "Much slower. Barred off from the main tidal exchange, a dammed lobe flushes only a small fraction as fast — closer to a lake than a bay.",
          },
        },
        {
          id: "behind-dam",
          phase: "measure",
          title: "Read the trapped clearance time",
          instruction: "Check the tracer clearance readout with the release point behind the dam.",
          check: { describe: "Clearance time well over a hundred hours", test: (v) => (v.facts.tracerClearanceH as number) > 100 },
        },
        {
          id: "open-gate",
          phase: "measure",
          title: "Compare the open Gate",
          instruction: "Switch the release point to Golden Gate and read the clearance time again.",
          requireData: 1,
          check: { describe: "Clearance time back under thirty hours", test: (v) => (v.facts.tracerClearanceH as number) < 30 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Explain the difference",
          instruction: "Think about what a dam actually removes from a lobe's tidal exchange.",
          write: {
            prompt: "The barrier does not stop water from ever moving. What does it remove that makes flushing collapse this much?",
            placeholder: "It removes the lobe's access to ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what the plan actually built",
          instruction: "Finish in your own words.",
          write: {
            prompt: "The Reber Plan called these fresh-water lakes. Based on your numbers, is 'lake' or 'stagnant pond' the more honest word — and why?",
            placeholder: "Based on the clearance time, I would call it ...",
          },
        },
      ],
    },
    {
      id: "cheap-and-coarse",
      title: "Cheap and coarse",
      question: "The strait is now narrower than one cell. How far does the salt front move, and can you trust the number?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, modelInUse: "digital", cellSize: 2000, deltaInflow: 200 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the error",
          instruction: "At 2,000 m, one grid cell is now wider than the real Carquinez Strait.",
          predict: {
            prompt: "Will the digital model's error be small or large?",
            options: ["Small — the equations do not care about cell size", "Large — the strait cannot be resolved at all"],
            correct: 1,
            reveal: "Large. A feature narrower than one cell simply is not represented, on top of the ordinary resolution error a coarse mesh already carries.",
          },
        },
        {
          id: "coarse",
          phase: "measure",
          title: "Confirm the strait is lost",
          instruction: "Run for a moment and read the strait-resolved badge and the digital error.",
          check: {
            describe: "Strait unresolved, error well over five kilometres",
            test: (v) => v.facts.carquinezResolved === false && (v.facts.agreementDigital as number) > 5,
          },
        },
        {
          id: "fine",
          phase: "measure",
          title: "Shrink the cell",
          instruction: "Drop the cell size to 200 m and let the solver relax again.",
          requireData: 1,
          check: {
            describe: "Strait resolved, error under two kilometres",
            test: (v) => v.facts.carquinezResolved === true && (v.facts.agreementDigital as number) < 2,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Weigh the cost",
          instruction: "Compare the solver cost at both cell sizes.",
          write: {
            prompt: "The fine mesh is far more trustworthy. What did it cost you to get there?",
            placeholder: "The solver cost rose from ... to ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Answer the scenario's question",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Can you trust a salt-front number from a mesh that cannot even fit the strait inside one cell? Explain.",
            placeholder: "No, because ...",
          },
        },
      ],
    },
    {
      id: "where-the-water-lies",
      title: "Where the water lies",
      question: "Which observed behaviours are real Bay physics, and which are artefacts of 10x exaggeration and centimetre depths?",
      bands: ["6-8"],
      minutes: 14,
      standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, modelInUse: "physical", scaleEffectOverlay: true, deltaInflow: 100 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the trustworthiness",
          instruction: "The scale-effect overlay is on, marking where the physical model's own distortions dominate.",
          predict: {
            prompt: "With no digital or field check at all, is the physical model's own reading trustworthy on its own?",
            options: ["Yes, a correctly scaled model has no error", "No, it carries its own fixed distortion regardless"],
            correct: 1,
            reveal: "No. The overlay exists precisely because the physical model always carries its own bias — real, fixed, and never zero, whatever the reading looks like.",
          },
        },
        {
          id: "overlay-on",
          phase: "measure",
          title: "Confirm the overlay's own honesty",
          instruction: "Check the scale-effect readouts.",
          check: { describe: "Overlay on, a real nonzero distortion always reported", test: (v) => v.facts.scaleEffectOverlay === true && (v.facts.physicalDistortionKm as number) > 0 },
        },
        {
          id: "persistent-bias",
          phase: "measure",
          title: "Run it out and check the bias persists",
          instruction: "Run to the full 14 tidal days.",
          requireData: 1,
          check: {
            describe: "A real disagreement with the field remains even at full run length",
            test: (v) => (v.facts.elapsedDaysPhysical as number) >= 13 && Math.abs(v.facts.agreementPhysical as number) > 2,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name two measurements to refuse",
          instruction: "Think about what a millimetre-deep, ten-times-steepened model cannot honestly show.",
          write: {
            prompt: "Name two measurements you would refuse to take from the physical model, with a reason for each.",
            placeholder: "I would not trust ... because ... I would not trust ... because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why the overlay matters",
          instruction: "Finish in your own words.",
          write: {
            prompt: "Why is it more honest to run a model with its known distortions labelled than to hide them?",
            placeholder: "Labelling the distortion lets you ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "trust-the-resolved-strait",
      title: "Trust the resolved strait",
      brief: "Get the digital error under 1.5 km while keeping the solver cheap.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, modelInUse: "digital" },
      goal: {
        describe: "Strait resolved, digital error under 1.5 km, solver cost under 3 s",
        test: (v) => v.facts.carquinezResolved === true && (v.facts.agreementDigital as number) < 1.5 && (v.facts.solverCostSeconds as number) < 3,
      },
      stars: {
        two: {
          describe: "Solver cost under 2 s",
          test: (v) => v.facts.carquinezResolved === true && (v.facts.agreementDigital as number) < 1.5 && (v.facts.solverCostSeconds as number) < 2,
        },
      },
      hints: ["The strait only needs to be smaller than the cell, not the smallest cell available.", "Every step finer than necessary is pure cost."],
    },
    {
      id: "recreate-the-plan-honestly",
      title: "Recreate the plan, honestly",
      brief: "Place both Reber dams and show the contrast between a dammed lobe and the open Gate at 14 tidal days.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, reberNorth: true, reberSouth: true },
      goal: {
        describe: "Both dams placed, dye released behind one, clearance over 150 h",
        test: (v) =>
          v.params.reberNorth === true && v.params.reberSouth === true &&
          v.params.dyeReleasePoint !== "goldenGate" &&
          (v.facts.tracerClearanceH as number) > 150,
      },
      hints: ["Release the dye behind one of the dams you just placed, not at the open Gate."],
    },
  ],
};
