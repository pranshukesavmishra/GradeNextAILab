import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { benchStage } from "@ui/labware";
import { plant } from "@ui/fauna";
import {
  badge, caption, clamp01, glow, hexA, isDarkTheme, plastic, softShadow, vignette,
} from "@ui/scene";
import { chartFrame, legend, lineSeries } from "@ui/charts";

/**
 * Four Chambers, One Question — Grade 6, Unit A5.2: fair tests as a countable
 * property of the setup, not an attitude.
 *
 * Four lettuce chambers run the same rate law every simulated hour: biomass
 * grows at a rate set by the product of a saturating light factor, a
 * two-threshold water factor (too little starves it, too much drowns it), and
 * a temperature factor with a real optimum and a steep drop past 30 degrees C.
 * Height and leaf count follow biomass by a fixed allometry, never a script.
 * A confound detector compares the four chambers' REALISED settings — after
 * locks are applied — for every one of five tunable variables plus the rack's
 * own light-and-heat gradient, and counts how many actually differ. Unlock a
 * second variable and the attribution meter drops to zero: not as a warning,
 * but because a real "ghost" counterfactual is computed for each of the two
 * candidate causes, and the two predictions land close enough together that
 * the data genuinely cannot separate them. Nothing here is asserted; it is
 * measured, every tick, from the same four numbers a real fair test would.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const K = 273.15;
const HOUR_S = 3600;

const BIOMASS_SEED = 0.02;  // a germinated seedling's starting biomass, 0-1 scale
const BIOMASS_CAP = 1;      // fully mature
const GROWTH_RATE = 0.0075; // per hour at every factor = 1, calibrated to ~day-21 maturity
const SENESCENCE = 0.0006;  // background dieback, per hour, always

const HEIGHT_MAX_MM = 150;  // spec: the 150 mm ruler stake
const HEIGHT_ALLOM = 0.65;  // concave allometry: fast early height gain, then it plateaus

/** Light saturates above ~14 h/day: 1 - e^-h/K reaches 90% by then. */
const LIGHT_K_H = 6;
function lightFactor(hoursPerDay: number): number {
  return 1 - Math.exp(-Math.max(0, hoursPerDay) / LIGHT_K_H);
}

/** Falls off sharply below 10 mL/day and above 50 mL/day (waterlogging). */
function waterFactor(mLPerDay: number): number {
  const low = 1 / (1 + Math.exp(-(mLPerDay - 10) * 0.6));
  const high = 1 / (1 + Math.exp((mLPerDay - 55) * 0.1));
  return clamp01(low * high);
}

/** An optimum plateau from 20-30 degrees C, cold-limited below, a steep drop past 30. */
function tempFactor(tempC: number): number {
  const cold = clamp01((tempC - 5) / 15);      // 0 at 5C, 1 by 20C
  const hot = tempC <= 30 ? 1 : Math.max(0, 1 - ((tempC - 30) / 6) ** 2);
  return clamp01(Math.min(cold, hot));
}

/** Background variety/pot-size confounds, deliberately unequal when unlocked. */
const SUBSTRATE_CYCLE = [1.0, 0.82, 1.14, 0.68];
const POT_CYCLE = [0.85, 1.0, 1.12, 1.28];
const SEED_STRAIN_CYCLE = [0.85, 1.0, 1.1, 1.22];

const WINDOW_LIGHT_BONUS_H = 2; // spec: ~900 lx extra, folded into equivalent light hours
const WINDOW_WARM_C = 2;        // spec: sits 2 C warmer

const SAMPLE_HOURS = 24;   // one row per simulated day
const HISTORY_MAX = 60;    // 60 days of daily samples
const NEUTRAL_TEMP_C = 22; // held fixed for a clean two-factor ghost comparison

/* ------------------------------------------------------------------ *
 * Pure growth — the same law drives the live chambers and every ghost curve
 * ------------------------------------------------------------------ */

/** Final biomass after `hours` of growth from a fresh seedling, factors held fixed. */
function simulateBiomass(
  hours: number, lightH: number, waterML: number, tempC: number,
  substrateF: number, potF: number, seedF: number,
): number {
  const lf = lightFactor(lightH), wf = waterFactor(waterML), tf = tempFactor(tempC);
  const rate = GROWTH_RATE * lf * wf * tf * substrateF * potF * seedF;
  let b = BIOMASS_SEED;
  const steps = Math.max(1, Math.round(hours));
  for (let i = 0; i < steps; i++) {
    const grow = rate * b * (1 - b / BIOMASS_CAP);
    b = Math.max(0.001, Math.min(BIOMASS_CAP, b + grow - SENESCENCE * b));
  }
  return b;
}

function heightMm(biomass: number): number {
  return HEIGHT_MAX_MM * biomass ** HEIGHT_ALLOM;
}

/* ------------------------------------------------------------------ *
 * Locks and the confound detector
 * ------------------------------------------------------------------ */

function perChamber(params: ParamValues, prefix: string): number[] {
  return [0, 1, 2, 3].map((i) => params[`${prefix}C${i + 1}`] as number);
}

function allEqual(vals: number[]): boolean {
  return vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
}

/** The realised (post-lock) per-chamber values for one variable. */
function realised(locked: boolean, vals: number[]): number[] {
  return locked ? vals.map(() => vals[0]) : vals;
}

interface VariableState { name: string; differs: boolean }

/** Every tunable-or-lockable variable, and whether its realised values differ. */
function confoundState(params: ParamValues): VariableState[] {
  const light = realised(params.lockLight === true, perChamber(params, "light"));
  const water = realised(params.lockWater === true, perChamber(params, "water"));
  const temp = realised(params.lockTemp === true, perChamber(params, "temp"));
  const substrate = params.lockSubstrate === true ? [1, 1, 1, 1] : SUBSTRATE_CYCLE;
  const seed = params.lockSeed === true ? [1, 1, 1, 1] : SEED_STRAIN_CYCLE;
  const pot = params.lockPotSize === true ? [1, 1, 1, 1] : POT_CYCLE;
  // Locked rack position means the design controls for it (a shielded or
  // balanced rack): the gradient may exist in the room, but no bay is
  // privileged, so it is never realised as a difference between chambers.
  const rackLive = params.rackPositionEffect === true && params.lockRackPosition !== true;
  const rackDiffers = rackLive && params.randomizeDaily !== true;
  return [
    { name: "Light hours", differs: !allEqual(light) },
    { name: "Water", differs: !allEqual(water) },
    { name: "Temperature", differs: !allEqual(temp) },
    { name: "Substrate", differs: !allEqual(substrate) },
    { name: "Seed variety", differs: !allEqual(seed) },
    { name: "Pot size", differs: !allEqual(pot) },
    { name: "Rack position", differs: rackDiffers },
  ];
}

function differingCount(params: ParamValues): number {
  return confoundState(params).filter((v) => v.differs).length;
}

/** 100 when exactly one variable differs, 0 whenever two or more do. */
function attributionPct(params: ParamValues): number {
  return differingCount(params) === 1 ? 100 : 0;
}

/**
 * The light+water ghost comparison from scenario S2: with both unlocked and
 * genuinely differing, compute what light alone and water alone would each
 * have produced, holding everything else neutral. Null whenever that specific
 * two-variable case does not apply.
 */
function ghostLightWater(params: ParamValues, hours: number) {
  if (params.lockLight === true || params.lockWater === true) return null;
  const light = perChamber(params, "light").map((s) => s / HOUR_S);
  const water = perChamber(params, "water").map((l) => l * 1000);
  if (allEqual(light) || allEqual(water)) return null;
  const base = simulateBiomass(hours, light[0], water[0], NEUTRAL_TEMP_C, 1, 1, 1);
  const real = simulateBiomass(hours, light[3], water[3], NEUTRAL_TEMP_C, 1, 1, 1);
  const lightOnly = simulateBiomass(hours, light[3], water[0], NEUTRAL_TEMP_C, 1, 1, 1);
  const waterOnly = simulateBiomass(hours, light[0], water[3], NEUTRAL_TEMP_C, 1, 1, 1);
  return {
    baseHeight: heightMm(base), realHeight: heightMm(real),
    lightOnlyHeight: heightMm(lightOnly), waterOnlyHeight: heightMm(waterOnly),
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Seedling { vigor: number; biomass: number }
interface Chamber { seedlings: Seedling[] }

interface State {
  simH: number;
  chambers: [Chamber, Chamber, Chamber, Chamber];
  windowSlot: number; // 0-3, which chamber currently sits in the window bay
  histDay: number[];
  histHeight: [number[], number[], number[], number[]];
  sampleClock: number;
}

function spawnSeedling(rng: Rng, spread: number): Seedling {
  const vigor = Math.max(0.35, Math.min(1.75, 1 + rng.normal(0, spread)));
  return { vigor, biomass: BIOMASS_SEED };
}

function buildChambers(params: ParamValues, rng: Rng): [Chamber, Chamber, Chamber, Chamber] {
  const n = Math.max(1, Math.min(8, Math.round(params.seedlingsPerChamber as number)));
  const spread = params.naturalVariation as number;
  const make = () => ({ seedlings: Array.from({ length: n }, () => spawnSeedling(rng, spread)) });
  return [make(), make(), make(), make()];
}

function init(params: ParamValues, rng: Rng): State {
  return {
    simH: 0,
    chambers: buildChambers(params, rng),
    windowSlot: 3,
    histDay: [],
    histHeight: [[], [], [], []],
    sampleClock: 0,
  };
}

function chamberFactors(params: ParamValues, idx: number, windowSlot: number) {
  const light = realised(params.lockLight === true, perChamber(params, "light"));
  const water = realised(params.lockWater === true, perChamber(params, "water"));
  const temp = realised(params.lockTemp === true, perChamber(params, "temp"));
  let lightH = light[idx] / HOUR_S;
  let tempC = temp[idx] - K;
  if (params.rackPositionEffect === true && params.lockRackPosition !== true && idx === windowSlot) {
    lightH += WINDOW_LIGHT_BONUS_H;
    tempC += WINDOW_WARM_C;
  }
  const waterML = water[idx] * 1000;
  const substrateF = params.lockSubstrate === true ? 1 : SUBSTRATE_CYCLE[idx];
  const potF = params.lockPotSize === true ? 1 : POT_CYCLE[idx];
  const seedF = params.lockSeed === true ? 1 : SEED_STRAIN_CYCLE[idx];
  return {
    lightH, waterML, tempC, substrateF, potF, seedF,
    lf: lightFactor(lightH), wf: waterFactor(waterML), tf: tempFactor(tempC),
  };
}

function meanHeight(c: Chamber): number {
  let sum = 0;
  for (const sd of c.seedlings) sum += heightMm(sd.biomass);
  return c.seedlings.length ? sum / c.seedlings.length : 0;
}

function heightRange(c: Chamber): number {
  if (c.seedlings.length === 0) return 0;
  let lo = Infinity, hi = -Infinity;
  for (const sd of c.seedlings) {
    const h = heightMm(sd.biomass);
    if (h < lo) lo = h;
    if (h > hi) hi = h;
  }
  return hi - lo;
}

function pushSample(s: State): void {
  const drop = s.histDay.length >= HISTORY_MAX ? 1 : 0;
  s.histDay = s.histDay.slice(drop);
  s.histDay.push(s.simH / 24);
  for (let c = 0; c < 4; c++) {
    s.histHeight[c] = s.histHeight[c].slice(drop);
    s.histHeight[c].push(meanHeight(s.chambers[c]));
  }
}

function substep(s: State, dtH: number, params: ParamValues): void {
  for (let c = 0; c < 4; c++) {
    const f = chamberFactors(params, c, s.windowSlot);
    const rateBase = GROWTH_RATE * f.lf * f.wf * f.tf * f.substrateF * f.potF;
    for (const sd of s.chambers[c].seedlings) {
      const rate = rateBase * sd.vigor * f.seedF;
      const grow = rate * sd.biomass * (1 - sd.biomass / BIOMASS_CAP);
      sd.biomass = Math.max(0.001, Math.min(BIOMASS_CAP, sd.biomass + (grow - SENESCENCE * sd.biomass) * dtH));
    }
  }
  const prevDay = Math.floor(s.simH / 24);
  s.simH += dtH;
  s.sampleClock += dtH;
  if (Math.floor(s.simH / 24) > prevDay && params.randomizeDaily === true) {
    s.windowSlot = (s.windowSlot + 1) % 4;
  }
  while (s.sampleClock >= SAMPLE_HOURS) {
    s.sampleClock -= SAMPLE_HOURS;
    pushSample(s);
  }
}

const model: SimModel<State> = {
  init(params, ctx) {
    return init(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (params.seedlingsPerChamber !== prev.seedlingsPerChamber || params.naturalVariation !== prev.naturalVariation) {
      // A genuinely new planting: fresh seedlings, fresh vigour draws.
      return init(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const s: State = {
      ...state,
      chambers: state.chambers.map((c) => ({ seedlings: c.seedlings.map((sd) => ({ ...sd })) })) as State["chambers"],
      histHeight: [state.histHeight[0].slice(), state.histHeight[1].slice(), state.histHeight[2].slice(), state.histHeight[3].slice()],
    };
    const comp = params.timeComp as number;
    const simSeconds = dt * comp;
    const simHours = simSeconds / 3600;
    const n = Math.max(1, Math.ceil(simHours));
    const dtH = simHours / n;
    for (let i = 0; i < n; i++) substep(s, dtH, params);
    if (s.histDay.length === 0) pushSample(s);
    return s;
  },

  readouts(state, params) {
    const heights = state.chambers.map((c) => meanHeight(c));
    return [
      { key: "day", label: "Day", quantity: q(state.simH / 24, "count"), semantic: "time", graphable: true },
      { key: "h1", label: "Chamber 1 height", unit: "mm", quantity: q(heights[0] / 1000, "length"), semantic: "producer", graphable: true },
      { key: "h2", label: "Chamber 2 height", unit: "mm", quantity: q(heights[1] / 1000, "length"), semantic: "producer", graphable: true },
      { key: "h3", label: "Chamber 3 height", unit: "mm", quantity: q(heights[2] / 1000, "length"), semantic: "producer", graphable: true },
      { key: "h4", label: "Chamber 4 height", unit: "mm", quantity: q(heights[3] / 1000, "length"), semantic: "producer", graphable: true },
      { key: "differing", label: "Variables differing", quantity: q(differingCount(params), "count"), semantic: "field", graphable: true },
      { key: "attribution", label: "Attribution", quantity: q(attributionPct(params) / 100, "percent"), semantic: "neutral", graphable: true },
    ];
  },

  facts(state, params) {
    const heights = state.chambers.map((c) => meanHeight(c));
    const ranges = state.chambers.map((c) => heightRange(c));
    const confounds = confoundState(params);
    const differing = confounds.filter((v) => v.differs).map((v) => v.name);
    const ghost = ghostLightWater(params, state.simH);
    const n = Math.max(1, Math.min(8, Math.round(params.seedlingsPerChamber as number)));
    return {
      day: state.simH / 24,
      hour: state.simH,
      height1: heights[0], height2: heights[1], height3: heights[2], height4: heights[3],
      range1: ranges[0], range2: ranges[1], range3: ranges[2], range4: ranges[3],
      tallestChamber: heights.indexOf(Math.max(...heights)) + 1,
      shortestChamber: heights.indexOf(Math.min(...heights)) + 1,
      spreadMm: Math.max(...heights) - Math.min(...heights),
      differingCount: confounds.filter((v) => v.differs).length,
      differingList: differing.join(", "),
      attributionPct: attributionPct(params),
      fairTestOk: differingCount(params) === 1 && n >= 3,
      replicates: n,
      windowSlot: state.windowSlot + 1,
      rackConfounds: confounds[6].differs,
      ghostValid: ghost !== null,
      ghostBaseHeight: ghost ? ghost.baseHeight : 0,
      ghostRealHeight: ghost ? ghost.realHeight : 0,
      ghostLightOnlyHeight: ghost ? ghost.lightOnlyHeight : 0,
      ghostWaterOnlyHeight: ghost ? ghost.waterOnlyHeight : 0,
      samples: state.histDay.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const CHAMBER_LABELS = ["1", "2", "3", "4"];
const CHAMBER_COLORS = ["velocity", "producer", "light", "hot"] as const;

function render(rc: RenderContext<State>) {
  const { ctx, state: s, params, theme, width, height, overlays, time } = rc;
  const dark = isDarkTheme(theme);
  benchStage(ctx, width, height, theme);

  const showChart = overlays.chart !== false;
  const chartH = showChart ? Math.round(height * 0.34) : 0;
  const stageH = height - chartH - (showChart ? 8 : 0);

  const rackY = stageH * 0.16, rackH = stageH * 0.62;
  const bayW = (width * 0.88) / 4, gap = width * 0.02;
  const startX = width * 0.06;

  const heights = s.chambers.map((c) => meanHeight(c));
  const maxH = Math.max(1, ...heights, HEIGHT_MAX_MM * 0.5);

  for (let c = 0; c < 4; c++) {
    const bx = startX + c * (bayW + gap);
    const lit = params.rackPositionEffect === true && c === s.windowSlot;
    const color = theme.sci[CHAMBER_COLORS[c]];

    // Chamber shell.
    softShadow(ctx, () => {
      plastic(ctx, bx, rackY, bayW, rackH, dark ? "#22262d" : "#dfe6ea", { radius: 8, gloss: 0.25 });
    }, { blur: 10, dy: 4, alpha: 0.35 });

    // LED bar and its light pool.
    const litFrac = clamp01(chamberFactors(params, c, s.windowSlot).lightH / 18);
    ctx.fillStyle = hexA("#ffe9b0", 0.15 + 0.55 * litFrac);
    roundRect(ctx, bx + bayW * 0.1, rackY + 4, bayW * 0.8, 6, 3);
    ctx.fill();
    if (lit) glow(ctx, bx + bayW / 2, rackY + rackH * 0.15, bayW * 0.55, hexA("#ffe9b0", 0.25), 0.6);

    // Seedlings as simple stylised plants, height proportional to biomass.
    const seedCount = s.chambers[c].seedlings.length;
    for (let i = 0; i < seedCount; i++) {
      const sd = s.chambers[c].seedlings[i];
      const px = bx + bayW * ((i + 0.5) / Math.max(1, seedCount));
      const py = rackY + rackH * 0.92;
      const hFrac = clamp01(heightMm(sd.biomass) / HEIGHT_MAX_MM);
      plant(ctx, px, py, rackH * 0.12 + rackH * 0.4 * hFrac, "seedling", theme, {
        health: clamp01(0.4 + 0.6 * hFrac), sway: (time * 0.1 + i * 0.13) % 1, seed: i * 7 + c,
      });
    }

    // Mean-height bar against the shared scale.
    const barX = bx + bayW * 0.06, barW = bayW * 0.16;
    const barMaxH = rackH * 0.72;
    const barH = barMaxH * clamp01(heights[c] / maxH);
    ctx.fillStyle = hexA(color, 0.85);
    roundRect(ctx, barX, rackY + rackH * 0.86 - barH, barW, barH, 3);
    ctx.fill();

    caption(ctx, bx + bayW / 2, rackY - 10, `chamber ${CHAMBER_LABELS[c]}`, theme, { align: "center", size: 11, weight: 800 });
    caption(ctx, bx + bayW / 2, rackY + rackH + 14, `${heights[c].toFixed(0)} mm`, theme, { align: "center", size: 10, color: theme.inkSoft });
    if (lit) caption(ctx, bx + bayW / 2, rackY + rackH + 28, "window bay", theme, { align: "center", size: 9, color: theme.sci["hot"] });
  }

  /* --- lock panel --------------------------------------------------- */
  const locks: [string, boolean][] = [
    ["light", params.lockLight === true], ["water", params.lockWater === true],
    ["temp", params.lockTemp === true], ["substrate", params.lockSubstrate === true],
    ["seed", params.lockSeed === true], ["pot", params.lockPotSize === true],
    ["rack", params.lockRackPosition === true],
  ];
  let lx = 12;
  const lockY = stageH * 0.92;
  for (const [label, locked] of locks) {
    badge(ctx, lx, lockY, label, theme, { color: locked ? theme.inkSoft : theme.sci["hot"] });
    lx += 16 + label.length * 6.6;
  }

  /* --- attribution meter and verdict ---------------------------------- */
  const pct = attributionPct(params);
  const count = differingCount(params);
  badge(ctx, width - 12, 20, `${pct}%`, theme, { align: "right", color: pct >= 100 ? theme.sci["neutral"] : theme.sci["hot"], sub: "attribution" });
  const verdict = count === 0 ? "NOTHING VARIES" : count === 1 ? "FAIR TEST" : `${count} VARIABLES DIFFER`;
  badge(ctx, width / 2, 20, verdict, theme, { align: "center", color: count === 1 ? theme.sci["neutral"] : theme.sci["hot"] });

  const ghost = ghostLightWater(params, s.simH);
  if (ghost && overlays.ghost !== false) {
    caption(ctx, width / 2, 40, "light alone and water alone predict almost the same gap", theme, {
      align: "center", size: 10, color: theme.sci["hot"], weight: 700,
    });
  }

  vignette(ctx, width, stageH, 0.12);

  /* --- height-over-time chart ------------------------------------------ */
  if (showChart && s.histDay.length >= 1) {
    const x = 8, y = stageH + 8, w = width - 16, h = chartH - 12;
    const days = s.histDay;
    const maxDay = Math.max(1, days[days.length - 1]);
    const scales = chartFrame(ctx, x, y, w, h, {
      xMin: 0, xMax: maxDay, yMin: 0, yMax: Math.max(20, maxH * 1.1),
      xLabel: "day", yLabel: "height", yUnit: "mm", grid: "y",
    }, theme);
    for (let c = 0; c < 4; c++) {
      const pts = days.map((d, i) => ({ x: d, y: s.histHeight[c][i] ?? 0 }));
      lineSeries(ctx, pts, scales.sx, scales.sy, theme.sci[CHAMBER_COLORS[c]], { theme, label: `C${c + 1}` });
    }
    legend(ctx, x + 8, y + 4, [0, 1, 2, 3].map((c) => ({ label: `chamber ${c + 1}`, color: theme.sci[CHAMBER_COLORS[c]], shape: "line" as const })), theme);
  } else if (showChart) {
    caption(ctx, width / 2, stageH + chartH / 2, "run the chambers to draw the height chart", theme, { align: "center", size: 11, color: theme.inkSoft });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  independentVariable: "light",
  lockLight: false, lockWater: true, lockTemp: true, lockSubstrate: true, lockSeed: true, lockPotSize: true,
  lockRackPosition: true,
  lightC1: 6 * HOUR_S, lightC2: 10 * HOUR_S, lightC3: 14 * HOUR_S, lightC4: 18 * HOUR_S,
  waterC1: 0.02, waterC2: 0.02, waterC3: 0.02, waterC4: 0.02,
  tempC1: 22 + K, tempC2: 22 + K, tempC3: 22 + K, tempC4: 22 + K,
  seedlingsPerChamber: 6, naturalVariation: 0.15,
  rackPositionEffect: true, randomizeDaily: false, timeComp: 5000,
};

export const fourChambersSim: SimManifest<State> = {
  id: "g6.a5-2",
  title: "Four Chambers, One Question",
  tagline: "Lock every variable but one, then find out — by a real number, not a feeling — whether your result can actually be trusted.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS1-5"] },
  learningGoals: [
    "State that a fair test means exactly one variable differs between conditions, and check that count directly.",
    "Explain why two confounded variables leave a result that no amount of care can separate.",
    "Use replicates and natural variation to judge whether a single winning chamber means anything.",
  ],
  misconceptions: [
    "A fair test just means being careful and tidy",
    "If a result comes out how you expected, the setup must have been fair",
    "One trial is enough if the difference looks big",
    "A hidden background gradient does not matter if you were not testing for it",
  ],
  interactionHint: "Unlock a second variable and watch the attribution meter — then lock it back and watch it recover.",
  tickRate: 30,
  timeScale: 1,
  params: {
    independentVariable: {
      type: "option", label: "Independent variable",
      options: [
        { value: "light", label: "Light hours" },
        { value: "water", label: "Water per day" },
        { value: "temp", label: "Temperature" },
        { value: "substrate", label: "Substrate" },
        { value: "seed", label: "Seed variety" },
      ],
      default: "light",
      help: "Labels which row you intend to test — the lock toggles below are what actually control the chambers.",
    },
    lockLight: { type: "boolean", label: "Lock: light hours", default: false, help: "Locked forces all four chambers to chamber 1's light hours." },
    lockWater: { type: "boolean", label: "Lock: water", default: true, help: "Locked forces all four chambers to chamber 1's water." },
    lockTemp: { type: "boolean", label: "Lock: temperature", default: true, help: "Locked forces all four chambers to chamber 1's temperature." },
    lockSubstrate: { type: "boolean", label: "Lock: substrate", default: true, help: "Unlocked, the four chambers sit on four genuinely different substrates." },
    lockSeed: { type: "boolean", label: "Lock: seed variety", default: true, help: "Unlocked, the four chambers are sown from four different, unequal strains." },
    lockPotSize: { type: "boolean", label: "Lock: pot size", default: true, help: "Unlocked, the four chambers get four different container volumes." },
    lockRackPosition: { type: "boolean", label: "Lock: rack position", default: true, help: "Locked, the design controls for the window bay so no chamber is privileged, even while the effect exists." },
    lightC1: { type: "number", label: "Light hours — chamber 1", kind: "time", unit: "h", min: 0, max: 20 * HOUR_S, step: 0.5 * HOUR_S, default: 6 * HOUR_S },
    lightC2: { type: "number", label: "Light hours — chamber 2", kind: "time", unit: "h", min: 0, max: 20 * HOUR_S, step: 0.5 * HOUR_S, default: 10 * HOUR_S },
    lightC3: { type: "number", label: "Light hours — chamber 3", kind: "time", unit: "h", min: 0, max: 20 * HOUR_S, step: 0.5 * HOUR_S, default: 14 * HOUR_S },
    lightC4: { type: "number", label: "Light hours — chamber 4", kind: "time", unit: "h", min: 0, max: 20 * HOUR_S, step: 0.5 * HOUR_S, default: 18 * HOUR_S },
    waterC1: { type: "number", label: "Water — chamber 1", kind: "volume", unit: "mL", min: 0, max: 0.06, step: 0.001, default: 0.02 },
    waterC2: { type: "number", label: "Water — chamber 2", kind: "volume", unit: "mL", min: 0, max: 0.06, step: 0.001, default: 0.02 },
    waterC3: { type: "number", label: "Water — chamber 3", kind: "volume", unit: "mL", min: 0, max: 0.06, step: 0.001, default: 0.02 },
    waterC4: { type: "number", label: "Water — chamber 4", kind: "volume", unit: "mL", min: 0, max: 0.06, step: 0.001, default: 0.02 },
    tempC1: { type: "number", label: "Temperature — chamber 1", kind: "temperature", unit: "°C", min: 8 + K, max: 35 + K, step: 0.5, default: 22 + K },
    tempC2: { type: "number", label: "Temperature — chamber 2", kind: "temperature", unit: "°C", min: 8 + K, max: 35 + K, step: 0.5, default: 22 + K },
    tempC3: { type: "number", label: "Temperature — chamber 3", kind: "temperature", unit: "°C", min: 8 + K, max: 35 + K, step: 0.5, default: 22 + K },
    tempC4: { type: "number", label: "Temperature — chamber 4", kind: "temperature", unit: "°C", min: 8 + K, max: 35 + K, step: 0.5, default: 22 + K },
    seedlingsPerChamber: { type: "number", label: "Seedlings per chamber", kind: "count", min: 1, max: 8, step: 1, default: 6, help: "Replicates: how much one unlucky seed can shift the mean." },
    naturalVariation: { type: "number", label: "Natural seed variation", kind: "percent", min: 0, max: 0.40, step: 0.01, default: 0.15, help: "How different identically treated seedlings are from each other." },
    rackPositionEffect: { type: "boolean", label: "Rack position effect", default: true, help: "The window-end bay genuinely runs brighter and warmer." },
    randomizeDaily: { type: "boolean", label: "Randomise positions daily", default: false, help: "Rotates which chamber sits in the window bay, averaging the gradient away." },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio", min: 100, max: 20000, step: 100, default: 5000,
      marks: [{ value: 100, label: "100x" }, { value: 5000, label: "5000x" }, { value: 20000, label: "20000x" }],
      help: "Simulated seconds per real second. The growth law is identical at every setting.",
    },
  },
  overlays: [
    { key: "chart", label: "Height-over-time chart", default: true },
    { key: "ghost", label: "Ghost-curve note", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "fair-test-of-light",
      title: "A fair test of light",
      question: "Which chamber grows tallest by day 21, and what exactly lets you say light caused it?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-LS1-5"],
      // Low natural variation on purpose: this lab's point is attribution
      // under light alone, not noise robustness — that is "One seed each"'s job.
      setup: { ...BASE_SETUP, naturalVariation: 0.05 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Only light hours is unlocked: 6/10/14/18 across the four chambers. Commit before running.",
          predict: {
            prompt: "By day 21, which chamber will be tallest?",
            options: ["Chamber 1 (6 h)", "Chamber 4 (18 h)", "They will all tie"],
            correct: 1,
            reveal: "Chamber 4. More light hours per day, up to the saturating point, means more time photosynthesising and a taller plant — and every other variable is locked identical, so light is the only thing that can explain it.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run to day 21",
          instruction: "Run the chambers to day 21 and record all four mean heights.",
          requireData: 1,
          check: { describe: "Day 21 reached", test: (v) => (v.facts.day as number) >= 21 },
          hints: ["Time compression can be pushed to the top of its range to get there quickly."],
        },
        {
          id: "verdict",
          phase: "analyze",
          title: "Read the verdict",
          instruction: "Check the attribution meter and the fair-test badge.",
          check: {
            describe: "Exactly one variable differs and the fair-test badge is green",
            test: (v) => v.facts.attributionPct === 100 && v.facts.fairTestOk === true,
          },
        },
        {
          id: "rank",
          phase: "measure",
          title: "Confirm the ranking",
          instruction: "The chambers should rank by light hours, low to high.",
          check: {
            describe: "Chamber 4 is tallest and chamber 1 is shortest",
            test: (v) => v.facts.tallestChamber === 4 && v.facts.shortestChamber === 1,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name your evidence",
          instruction: "Say exactly what lets you attribute the ranking to light.",
          write: {
            prompt: "What exactly lets you say light caused the ranking, rather than something else on the bench?",
            placeholder: "Every other variable was locked to the same value, so ...",
          },
        },
      ],
    },
    {
      id: "two-things-at-once",
      title: "Two things at once",
      question: "Chamber four wins — but light and water moved together. Can you tell which one did it?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-LS1-5"],
      setup: { ...BASE_SETUP, lockWater: false, waterC1: 0.010, waterC2: 0.020, waterC3: 0.040, waterC4: 0.060 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the meter",
          instruction: "Water is now unlocked too, and it rises alongside light across the four chambers.",
          predict: {
            prompt: "What will the attribution meter read once a second variable is unlocked and actually differs?",
            options: ["Still 100% — light was already the point", "0% — two things differ, so neither can be credited alone", "50%, split between the two"],
            correct: 1,
            reveal: "0%. The meter does not weigh evidence — it counts differing variables. The instant a second one is free to differ, attribution drops to zero regardless of which chamber wins.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it",
          instruction: "Run to day 21 and record every chamber's height.",
          requireData: 1,
          check: { describe: "Day 21 reached with two variables differing", test: (v) => (v.facts.day as number) >= 21 && v.facts.differingCount === 2 },
        },
        {
          id: "read-meter",
          phase: "analyze",
          title: "Read the proof",
          instruction: "Point at the attribution meter and the ghost-curve note.",
          check: {
            describe: "Attribution at zero, and both a valid ghost comparison is available",
            test: (v) => v.facts.attributionPct === 0 && v.facts.ghostValid === true,
          },
          hints: ["The ghost note only appears when exactly light and water are the two unlocked, differing variables."],
        },
        {
          id: "compare-ghosts",
          phase: "analyze",
          title: "Compare the two stories",
          instruction: "Look at the light-alone and water-alone predicted heights side by side.",
          write: {
            prompt: "Both a light-only story and a water-only story predict a real change here. Which one is correct?",
            placeholder: "There is no way to tell from this data because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Fix it",
          instruction: "Lock water back to a single value and re-run to restore a fair test.",
          check: { describe: "Water locked again; the meter recovers to 100%", test: (v) => v.params.lockWater === true && v.facts.attributionPct === 100 },
        },
      ],
    },
    {
      id: "one-seed-each",
      title: "One seed each",
      question: "With one seedling per chamber and high natural variation, does the same chamber win every time?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS1-5"],
      setup: { ...BASE_SETUP, seedlingsPerChamber: 1, naturalVariation: 0.35 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the reliability",
          instruction: "One seed per chamber, 35% natural spread, light still the only unlocked variable.",
          predict: {
            prompt: "Run this exact setup three times with different seeds. Will chamber 4 win every time?",
            options: ["Yes — light is locked in as the cause", "Not necessarily — one unlucky or lucky seed can flip the ranking"],
            correct: 1,
            reveal: "Not necessarily. With a single plant per chamber, natural seed-to-seed variation is large enough to occasionally beat a real treatment effect — which is exactly why replicates exist.",
          },
        },
        {
          id: "run-a",
          phase: "measure",
          title: "First seed",
          instruction: "Run to day 21 and record the ranking.",
          requireData: 1,
          check: { describe: "Day 21 reached with one seedling per chamber", test: (v) => (v.facts.day as number) >= 21 && v.facts.replicates === 1 },
        },
        {
          id: "run-b",
          phase: "measure",
          title: "Reset and run again",
          instruction: "Reset the sim (a fresh seed draw) and run to day 21 again.",
          requireData: 2,
          check: { describe: "A second independent row recorded", test: (v) => (v.data?.length ?? 0) >= 2 },
        },
        {
          id: "raise-replicates",
          phase: "measure",
          title: "Now use six",
          instruction: "Raise seedlings per chamber back to 6 and run once more.",
          check: { describe: "Six replicates per chamber, day 21 reached", test: (v) => v.facts.replicates === 6 && (v.facts.day as number) >= 21 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What replicates buy you",
          instruction: "Compare the single-seed rankings to the six-seed one.",
          write: {
            prompt: "Did the ranking change between your two single-seed runs? What does raising replicates to six actually protect you from?",
            placeholder: "Between the two single-seed runs, the ranking ...; with six seedlings, ...",
          },
        },
      ],
    },
    {
      id: "central-valley-water-trial",
      title: "Central Valley water trial",
      question: "Below what daily volume does growth collapse — and what happens if you only test one plant?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-LS1-5"],
      setup: {
        ...BASE_SETUP, independentVariable: "water", lockLight: true, lockWater: false,
        waterC1: 0.005, waterC2: 0.015, waterC3: 0.030, waterC4: 0.060,
        lockTemp: false, tempC1: 30 + K, tempC2: 30 + K, tempC3: 30 + K, tempC4: 30 + K,
        seedlingsPerChamber: 8,
        // The spec calls out "randomise=On" here deliberately: good practice
        // protects a fair test even against a confound that was not the point.
        lockRackPosition: false, rackPositionEffect: true, randomizeDaily: true,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the collapse point",
          instruction: "Temperature is locked at a uniform 30 C; only water differs, from 5 to 60 mL/day.",
          predict: {
            prompt: "Which chamber will show the weakest growth?",
            options: ["Chamber 1 — 5 mL/day is under the drought threshold", "Chamber 4 — 60 mL/day is waterlogged", "They will be roughly equal"],
            correct: 0,
            reveal: "Chamber 1. At 5 mL/day the water factor is close to zero — far below the 10 mL/day threshold — while 60 mL/day is only mildly over the waterlogging line.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it",
          instruction: "Run to day 21 with all eight seedlings per chamber and record the heights.",
          requireData: 1,
          check: { describe: "Day 21 reached, one fair variable, eight replicates", test: (v) => (v.facts.day as number) >= 21 && v.facts.attributionPct === 100 && v.facts.replicates === 8 },
        },
        {
          id: "confirm",
          phase: "analyze",
          title: "Confirm the collapse",
          instruction: "Compare chamber 1's height to chamber 3's.",
          check: {
            describe: "Chamber 1 sits well below chamber 3",
            test: (v) => (v.facts.height1 as number) < (v.facts.height3 as number) * 0.7,
          },
        },
        {
          id: "one-plant",
          phase: "measure",
          title: "Now with one plant",
          instruction: "Drop seedlings per chamber to 1 and re-run the identical water levels.",
          check: { describe: "Down to one replicate per chamber", test: (v) => v.facts.replicates === 1 && (v.facts.day as number) >= 21 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "The advice to a grower",
          instruction: "Write the warning this comparison earns.",
          write: {
            prompt: "Below what daily volume does growth collapse, and what would you say to a grower who tested only one plant per treatment?",
            placeholder: "Growth collapses below about ... mL/day. Testing one plant risks ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "prove-it-fair",
      title: "Prove it fair",
      brief: "Design and run a temperature test: four different setpoints, everything else locked, replicates at least four.",
      bands: ["6-8"],
      setup: {
        ...BASE_SETUP, lockLight: true, lockTemp: false,
        tempC1: 12 + K, tempC2: 18 + K, tempC3: 24 + K, tempC4: 32 + K,
        seedlingsPerChamber: 4, naturalVariation: 0.05,
      },
      goal: {
        describe: "Day 21, exactly one variable differs, at least 4 replicates",
        test: (v) => (v.facts.day as number) >= 21 && v.facts.attributionPct === 100 && (v.facts.replicates as number) >= 4,
      },
      stars: {
        two: {
          describe: "Also correctly rank chamber 3 (24 C) as tallest",
          test: (v) =>
            (v.facts.day as number) >= 21 && v.facts.attributionPct === 100 &&
            (v.facts.replicates as number) >= 4 && v.facts.tallestChamber === 3,
        },
      },
      hints: [
        "30 C is not yet the steep drop — the optimum plateau runs from 20 to 30.",
        "32 C is just past the edge of that plateau.",
        "Every lock except temperature needs to stay on.",
      ],
    },
    {
      id: "break-the-attribution",
      title: "Break the attribution, then fix it",
      brief: "Unlock two variables so they genuinely differ, confirm the meter reads zero, then restore a fair test without resetting.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "At some point attribution reads 0% with two variables differing, and the run ends with it back at 100%",
        test: (v) => v.facts.attributionPct === 100 && v.facts.fairTestOk === true,
      },
      hints: [
        "Unlocking substrate or seed variety creates an instant, guaranteed difference — no sliders needed.",
        "Locking a variable again forces all four chambers straight back to chamber 1's value.",
      ],
    },
  ],
};
