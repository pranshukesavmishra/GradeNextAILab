import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { plant } from "@ui/fauna";
import { badge, caption, clamp01, glow, hexA, isDarkTheme, vignette } from "@ui/scene";

/**
 * From Chloroplast to Coastline — Grade 6, Unit A1.5: systems across scales,
 * from a cell to a planet.
 *
 * One real process — a chloroplast fixing carbon from light — read at six
 * nested sizes: chloroplast, cell, blade, whole plant, forest patch, whole
 * bay. Every level above the first is nothing but the level below it
 * multiplied by a real count (chloroplasts per cell, cells per blade, blades
 * per plant, plants per patch, patches in the bay) minus a real loss
 * (respiration, grazing). Nothing is independently invented at any level —
 * that upward-only aggregation is the entire model, and it is also why a
 * perturbation dropped at the bottom cannot be felt at the top: one
 * chloroplast, out of the tens of trillions the bay actually holds, moves
 * the bay-level total by a fraction no instrument could read.
 *
 * The forest patch itself runs a second, genuinely bistable process:
 * kelp canopy and grazing urchins, checked by otter predation. Otter
 * predation saturates (an otter can only process so many urchins a day, a
 * real Holling handling-time limit), so a colony of otters that easily
 * holds a LOW urchin population down cannot quickly crush a population that
 * has already irrupted — the real mechanism behind a documented "urchin
 * barren": removing the predator lets urchins escape control within about a
 * year, and restoring the predator does not undo that within the same year.
 * It takes the otters years to work the population back down, exactly the
 * asymmetry the spec's own "does the forest return, and how long does it
 * take" question is built to expose.
 *
 * The honesty rule: the six levels are one process and one number, viewed at
 * six scales, not six separately-tuned levels dressed up to agree. Every
 * "carbon fixed" reading anywhere in the app is the same base chloroplast
 * rate multiplied by exactly the counts named above.
 */

/* ------------------------------------------------------------------ *
 * The base process — one chloroplast, real light/nutrient/temperature terms
 * ------------------------------------------------------------------ */

const LIGHT_HALF_SAT_UMOL = 90;    // umol photons/m^2/s; curve ~90% saturated by the spec's "near 400"
const DEPTH_ATTEN_PER_M = 0.12;    // spec: "light attenuating with depth at k=0.12 m^-1"
const CANOPY_DEPTH_M = 2;          // canopy blades sit near the surface, not at the sea floor
const NITRATE_HALF_SAT_UMOL = 4;   // umol/L, a real-world-adjacent kelp nitrate-uptake half-saturation
const TEMP_OPTIMAL_C = 14;         // central-CA giant kelp thrives roughly 12-17 C
const TEMP_TOL_C = 7;              // width of the thermal performance curve

/** Peak fixation rate of a single ~5 um chloroplast, femtograms carbon per
 *  second — a reasoned order-of-magnitude estimate; the spec fixes the
 *  apparatus (a 5 um lens with thylakoid stacks) and the light/nitrate/depth
 *  physics, not this one number. */
const CHLORO_MAX_FG_S = 300;

function lightAt(surfaceUmol: number, depthM: number): number {
  return Math.max(0, surfaceUmol) * Math.exp(-DEPTH_ATTEN_PER_M * depthM);
}

function tempFactor(tempC: number): number {
  return clamp01(1 - ((tempC - TEMP_OPTIMAL_C) / TEMP_TOL_C) ** 2);
}

/** Instantaneous rate of ONE chloroplast, femtograms C/s — the only place
 *  light, nitrate and temperature enter the model. Every level above this
 *  is pure multiplication by a real count. */
function chloroplastRateFgS(params: ParamValues, lightCut: number, nitrateCut: number): number {
  const light = lightAt(params.surfaceLight as number, CANOPY_DEPTH_M) * (1 - lightCut);
  const lightFactor = light / (light + LIGHT_HALF_SAT_UMOL);
  const nitrate = Math.max(0, (params.upwellingNitrate as number) * (1 - nitrateCut));
  const nutrientFactor = nitrate / (nitrate + NITRATE_HALF_SAT_UMOL);
  const tf = tempFactor(params.seaTemp as number);
  return CHLORO_MAX_FG_S * lightFactor * nutrientFactor * tf;
}

/* ------------------------------------------------------------------ *
 * The ladder — six levels, each a real count times the level below
 * ------------------------------------------------------------------ */

export type Level = "chloroplast" | "cell" | "blade" | "plant" | "patch" | "bay";
export const LEVELS: Level[] = ["chloroplast", "cell", "blade", "plant", "patch", "bay"];

const LEVEL_LABEL: Record<Level, string> = {
  chloroplast: "Chloroplast", cell: "Kelp cell", blade: "Blade", plant: "Whole plant",
  patch: "Forest patch", bay: "Whole bay",
};
/** Roughly the object's own physical scale, for the scale-bar readout. */
const LEVEL_SCALE_M: Record<Level, number> = {
  chloroplast: 5e-6, cell: 3e-5, blade: 0.4, plant: 30, patch: 100, bay: 20000,
};
/** The characteristic clock the spec names for each level — chloroplast
 *  seconds, plant days, forest years. */
const LEVEL_NATURAL_UNIT: Record<Level, "s" | "day" | "yr"> = {
  chloroplast: "s", cell: "s", blade: "s", plant: "day", patch: "day", bay: "yr",
};

const CHLOROPLASTS_PER_CELL = 60;  // spec: "60 per cell"
const CELLS_PER_BLADE = 1.2e7;     // reasoned estimate: ~0.4 m corrugated blade, ~30 um cells, both faces
const BLADES_PER_PLANT = 35;       // reasoned estimate: a mature giant-kelp individual's blade count
const PLANTS_PER_PATCH = 180;      // spec: "180 individuals" per hectare patch, at full canopy
const PATCHES_IN_BAY = 260;        // reasoned estimate: hectares of forest represented as "the whole bay"
const RESPIRATION_FRAC = 0.35;     // spec: "plant growth sums blades and subtracts respiration"

const LEVEL_COUNT_FROM_BELOW: Record<Exclude<Level, "chloroplast">, number> = {
  cell: CHLOROPLASTS_PER_CELL, blade: CELLS_PER_BLADE, plant: BLADES_PER_PLANT,
  patch: PLANTS_PER_PATCH, bay: PATCHES_IN_BAY,
};

/** femtograms C/s at every level, for the CURRENT canopy fraction — the
 *  patch and bay levels carry only as many live plants as the canopy
 *  fraction says are actually there; a barren patch is not lying about how
 *  many individuals a full-canopy hectare would hold. */
function ladderFgS(chloroFgS: number, canopyFrac: number): Record<Level, number> {
  const cell = chloroFgS * LEVEL_COUNT_FROM_BELOW.cell;
  const blade = cell * LEVEL_COUNT_FROM_BELOW.blade;
  const plant = blade * LEVEL_COUNT_FROM_BELOW.plant * (1 - RESPIRATION_FRAC);
  const patch = plant * (LEVEL_COUNT_FROM_BELOW.patch * canopyFrac);
  const bay = patch * LEVEL_COUNT_FROM_BELOW.bay;
  return { chloroplast: chloroFgS, cell, blade, plant, patch, bay };
}

/* ------------------------------------------------------------------ *
 * The forest patch — a real, bistable urchin/canopy/otter system
 * ------------------------------------------------------------------ */

const CANOPY_GROWTH_PER_DAY = 0.015;  // logistic regrowth rate toward full canopy
const GRAZE_IMPACT_PER_DAY = 0.03;    // canopy lost per (urchin/m^2) at full grazing saturation
const GRAZE_HALF_SAT = 0.5;           // Type II: urchins cannot graze kelp that is not there
const REFUGIA_PER_DAY = 0.01;         // background recruitment; keeps a barren a real low floor, not a trap
const URCHIN_GROWTH_PER_DAY = 0.012;  // logistic urchin population growth
const URCHIN_CAPACITY = 20;           // per m^2, food-limited ceiling (barren-state density)
const OTTER_ATTACK_RATE = 0.01;       // low-density otter search/attack rate
/** Days of "handling" a saturated otter needs per unit urchin density —
 *  the real Holling Type II ceiling. Tuned (see docs/G6A_BUILD_LOG.md) so
 *  the default 18-otter raft holds a low urchin population down easily, an
 *  irrupted (barren-state) population escapes that same raft's control
 *  within about a year of the otters being removed, and restoring the
 *  raft takes on the order of five years to fully reverse — a real,
 *  asymmetric predator-pit lag, not a switch that flips back instantly. */
const OTTER_HANDLING_TIME = 265;
const BARREN_URCHIN_PER_M2 = 9; // spec: "above about 9 urchins/m^2 a patch flips to barren"

interface PatchState { canopy: number; urchin: number }

/** One real day of the canopy/urchin system. Otters and any nutrient/
 *  temperature-driven change to kelp's own growth rate are the only two
 *  ways a control can move it. */
function patchDay(s: PatchState, otters: number, kelpGrowthMul: number): PatchState {
  const grazePressure = GRAZE_IMPACT_PER_DAY * s.urchin * (s.canopy / (s.canopy + GRAZE_HALF_SAT));
  const canopyGrowth = CANOPY_GROWTH_PER_DAY * kelpGrowthMul * s.canopy * (1 - s.canopy);
  const refugia = REFUGIA_PER_DAY * (1 - s.canopy);
  const canopy = clamp01(s.canopy + canopyGrowth - grazePressure + refugia);

  const killPerOtter = (OTTER_ATTACK_RATE * s.urchin) / (1 + OTTER_ATTACK_RATE * OTTER_HANDLING_TIME * s.urchin);
  const totalKilled = Math.max(0, otters) * killPerOtter;
  const urchinGrowth = URCHIN_GROWTH_PER_DAY * s.urchin * (1 - s.urchin / URCHIN_CAPACITY);
  const urchin = Math.max(0, s.urchin + urchinGrowth - totalKilled);
  return { canopy, urchin };
}

/** Whether the current perturbation site can even express an ecology-scale
 *  event. There is exactly one patch-level ecology in this model (one
 *  canopy, one urchin population, one otter raft) — "remove the otters
 *  from one blade" or "warm the water around one plant" is not a smaller
 *  version of that event, it is not an event this model has any coupling
 *  for at all, so the honest behaviour is no effect, not a diluted one. */
function siteHasEcology(site: Level): boolean {
  return site === "patch" || site === "bay";
}

/** The kelp growth multiplier live temperature and nitrate actually produce
 *  right now — 1.0 at the default 13 C / 18 umol/L, below 1 away from
 *  either. The only two continuous ways a control reaches the canopy
 *  equation, alongside otter count. */
function kelpGrowthMultiplier(params: ParamValues, warmed: boolean): number {
  const effectiveTemp = (params.seaTemp as number) + (warmed ? 3 : 0);
  const tempMul = tempFactor(effectiveTemp) / Math.max(1e-6, tempFactor(13));
  const n = Math.max(0, params.upwellingNitrate as number);
  const nutrientMul = (n / (n + NITRATE_HALF_SAT_UMOL)) / (18 / (18 + NITRATE_HALF_SAT_UMOL));
  return tempMul * nutrientMul;
}

/** The otter count and kelp-growth multiplier the ecology actually feels
 *  this tick, given whichever continuous perturbation (if any) is live and
 *  whether the current site can express an ecology-scale event at all. */
function ecologyForcing(params: ParamValues): { otterCount: number; kelpGrowthMul: number } {
  const ecologyActive = siteHasEcology(params.perturbationSite as Level);
  const type = params.perturbationType as string;
  const otterCount = type === "removeOtters" && ecologyActive ? 0 : (params.otterCount as number);
  const kelpGrowthMul = kelpGrowthMultiplier(params, type === "warmWater" && ecologyActive);
  return { otterCount, kelpGrowthMul };
}

/* ------------------------------------------------------------------ *
 * State — a live, stateful clock. Restoring otters after a collapse takes
 * effect on whatever canopy/urchin currently are, exactly like a real
 * intervention would — never a scrub back to a freshly re-solved past.
 * ------------------------------------------------------------------ */

interface State extends PatchState { simYears: number; dayClock: number }

/** How many objects of `level` actually exist in the whole bay — the
 *  product of every real count STRICTLY ABOVE `level` in the ladder (a
 *  bay holds PATCHES_IN_BAY patches; it holds PATCHES_IN_BAY x
 *  PLANTS_PER_PATCH plants; and so on down to chloroplasts). This is a
 *  different quantity from "how many chloroplasts make one cell" — that
 *  smaller multiplier alone would badly overstate how much of the bay's
 *  total a single blocked object represents. */
function totalUnitsAt(level: Level): number {
  let n = 1;
  let pastLevel = false;
  for (const l of LEVELS) {
    if (pastLevel) n *= LEVEL_COUNT_FROM_BELOW[l as Exclude<Level, "chloroplast">];
    if (l === level) pastLevel = true;
  }
  return n;
}

/** What fraction of the whole bay's total objects at `site`'s own level a
 *  perturbation dropped there actually touches: one representative object
 *  at a small site (an astronomically small fraction), the entire bay at
 *  "Whole bay" (exactly 1) — the honesty rule made numeric. Only meaningful
 *  for the two chloroplast-ladder perturbations (light, nutrients); the
 *  patch's ecology (otters, temperature shocks, storms) has no smaller
 *  version of itself and is handled separately by `siteHasEcology`. */
function siteFractionOf(site: Level): number {
  return 1 / totalUnitsAt(site);
}

/** The current ladder and its two chloroplast-scoped inputs, computed fresh
 *  from whatever canopy fraction the live ecology is at right now — cheap
 *  enough (six multiplications) to never need caching in state. */
function currentLadder(state: PatchState, params: ParamValues): { ladder: Record<Level, number>; siteFrac: number } {
  const site = params.perturbationSite as Level;
  const type = params.perturbationType as string;
  const siteFrac = siteFractionOf(site);
  const lightCut = type === "blockLight" ? siteFrac : 0;
  const nitrateCut = type === "cutNutrients" ? siteFrac : 0;
  const chloroFgS = chloroplastRateFgS(params, lightCut, nitrateCut);
  return { ladder: ladderFgS(chloroFgS, state.canopy), siteFrac };
}

const model: SimModel<State> = {
  init() {
    return { canopy: 1, urchin: 0.3, simYears: 0, dayClock: 0 };
  },
  applyParams(state, params, prev) {
    // Harvest and storm are instant shocks, fired exactly once at the
    // moment the type is newly selected — never repeatedly re-applied on
    // every following tick, and never undone by switching the type away.
    if (params.perturbationType === prev.perturbationType) return state;
    if (!siteHasEcology(params.perturbationSite as Level)) return state;
    if (params.perturbationType === "harvestCanopy") return { ...state, canopy: clamp01(state.canopy * 0.4) };
    if (params.perturbationType === "stormSwell") return { ...state, canopy: clamp01(state.canopy * 0.85) };
    return state;
  },
  step(state, dt, params) {
    if (dt <= 0) return state;
    const yrPerSec = params.playbackSpeed as number;
    let s: State = { ...state };
    s.dayClock += dt * yrPerSec * 365;
    const { otterCount, kelpGrowthMul } = ecologyForcing(params);
    while (s.dayClock >= 1) {
      s.dayClock -= 1;
      s.simYears += 1 / 365;
      const next = patchDay(s, otterCount, kelpGrowthMul);
      s.canopy = next.canopy;
      s.urchin = next.urchin;
    }
    return s;
  },
  readouts(state, params) {
    const level = params.scale as Level;
    const { ladder } = currentLadder(state, params);
    const fgS = ladder[level];
    const unit = LEVEL_NATURAL_UNIT[level];
    // The rate in this level's own natural clock (spec: chloroplast seconds,
    // plant days, forest years) — still in femtograms at this point.
    const perClockFg = unit === "s" ? fgS : unit === "day" ? fgS * 86400 : fgS * 86400 * 365;
    // Auto-scaled display, femtograms to tonnes (1 fg = 1e-15 g throughout)
    // — the unit change IS the lesson, so it is computed here rather than
    // left to a fixed kind.
    const mag = Math.abs(perClockFg);
    let value = perClockFg, label = "fg";
    if (mag >= 1e21) { value = perClockFg / 1e21; label = "t"; }
    else if (mag >= 1e18) { value = perClockFg / 1e18; label = "kg"; }
    else if (mag >= 1e15) { value = perClockFg / 1e15; label = "g"; }
    else if (mag >= 1e12) { value = perClockFg / 1e12; label = "mg"; }
    else if (mag >= 1e9) { value = perClockFg / 1e9; label = "µg"; }
    else if (mag >= 1e6) { value = perClockFg / 1e6; label = "ng"; }
    else if (mag >= 1e3) { value = perClockFg / 1e3; label = "pg"; }
    return [
      { key: "carbonFixed", label: `Carbon fixed at ${LEVEL_LABEL[level]}`, unit: `${label}/${unit}`, quantity: q(value, "ratio"), semantic: "producer", graphable: true },
      { key: "canopy", label: "Forest patch canopy", unit: "%", quantity: q(state.canopy * 100, "percent"), semantic: "producer", graphable: true },
      { key: "urchins", label: "Urchin density", unit: "per m²", quantity: q(state.urchin, "ratio"), semantic: "hot", graphable: true },
      { key: "otters", label: "Otter count", quantity: q(params.otterCount as number, "population"), semantic: "primary-consumer" },
      { key: "years", label: "Years elapsed", unit: "yr", quantity: q(state.simYears, "count"), graphable: true },
    ];
  },
  facts(state, params) {
    const level = params.scale as Level;
    const site = params.perturbationSite as Level;
    const { ladder, siteFrac } = currentLadder(state, params);
    const perLevelFgS: Record<string, number> = {};
    for (const l of LEVELS) perLevelFgS[`fgS_${l}`] = ladder[l];
    const { ladder: baselineLadder } = currentLadder(state, { ...params, perturbationType: "none" });
    const bayNoPerturb = baselineLadder.bay;
    const bayNow = ladder.bay;
    const bayEffectFrac = bayNoPerturb !== 0 ? Math.abs(bayNow - bayNoPerturb) / Math.abs(bayNoPerturb) : 0;
    // How far current temperature and nitrate alone (independent of canopy
    // area, which the otter/urchin side of the model governs) have pushed
    // the chloroplast's own rate below what it would be at the healthy
    // defaults (13 C, 18 umol/L) — the real, measurable form the 2014 warm
    // blob's stress takes here even when the canopy itself has not yet
    // collapsed through the (separate) grazing pathway.
    const stressedRate = chloroplastRateFgS({ ...params, surfaceLight: 1200 }, 0, 0);
    const healthyRate = chloroplastRateFgS({ ...params, surfaceLight: 1200, seaTemp: 13, upwellingNitrate: 18 }, 0, 0);
    const productivityFrac = healthyRate > 0 ? stressedRate / healthyRate : 1;
    return {
      level,
      canopyFrac: state.canopy,
      urchinPerM2: state.urchin,
      isBarren: state.urchin >= BARREN_URCHIN_PER_M2,
      otterCount: params.otterCount as number,
      simYears: state.simYears,
      perturbationSite: site,
      perturbationType: params.perturbationType as string,
      siteFraction: siteFrac,
      bayEffectFrac,
      bayNegligible: bayEffectFrac < 1e-6,
      productivityFrac,
      ordersOfMagnitudeSpan: Math.log10(Math.max(1e-30, ladder.bay) / Math.max(1e-30, ladder.chloroplast)),
      ...perLevelFgS,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function fmtSci(v: number): string {
  if (!Number.isFinite(v)) return "--";
  if (Math.abs(v) < 1000 && Math.abs(v) >= 0.01) return v.toFixed(2);
  return v.toExponential(2);
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "#04121a" : "#eaf3f2";
  ctx.fillRect(0, 0, width, height);

  const level = params.scale as Level;
  const centerX = width * 0.5, centerY = height * 0.42;

  // A single frame that redresses itself for the current level, per the
  // spec's "cross-dissolve" note — same position, different subject.
  if (level === "chloroplast" || level === "cell") {
    ctx.fillStyle = hexA("#2f9e5c", 0.85);
    ctx.beginPath(); ctx.ellipse(centerX, centerY, 60, 40, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = hexA("#0f5a34", 0.6); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(centerX - 20 + i * 7, centerY, 6, 20, 0, 0, Math.PI * 2); ctx.stroke();
    }
    caption(ctx, centerX - 50, centerY + 70, level === "chloroplast" ? "One chloroplast" : "One kelp cell (60 chloroplasts)", theme, { size: 12, weight: 700 });
  } else if (level === "blade" || level === "plant") {
    ctx.strokeStyle = hexA("#1f8a4c", 0.9); ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(centerX, centerY + 90); ctx.quadraticCurveTo(centerX + 40, centerY, centerX, centerY - 90); ctx.stroke();
    caption(ctx, centerX - 50, centerY + 110, level === "blade" ? "One blade" : "One whole plant", theme, { size: 12, weight: 700 });
  } else if (level === "patch") {
    for (let i = 0; i < 9; i++) {
      const x = centerX - 100 + (i % 3) * 100, y = centerY - 60 + Math.floor(i / 3) * 60;
      plant(ctx, x, y, 46, "kelp", theme, { health: state.canopy, seed: i, sway: i / 9 });
    }
    // Urchins drawn directly: a small purple test with radiating spines,
    // one per whole urchin/m^2 up to a readable cap.
    const urchinCount = Math.min(24, Math.round(state.urchin));
    for (let i = 0; i < urchinCount; i++) {
      const ux = centerX - 120 + ((i * 37) % 260), uy = centerY + 90 + ((i * 17) % 20);
      ctx.fillStyle = hexA("#6b3fa0", 0.85);
      ctx.beginPath(); ctx.arc(ux, uy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hexA("#4a2a70", 0.8); ctx.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + Math.cos(a) * 8, uy + Math.sin(a) * 8); ctx.stroke();
      }
    }
    caption(ctx, centerX - 130, centerY + 130, `Forest patch — canopy ${(state.canopy * 100).toFixed(0)}%, urchins ${state.urchin.toFixed(1)}/m²`, theme, { size: 12, weight: 700 });
  } else {
    ctx.fillStyle = hexA("#0d3b52", 0.9);
    ctx.fillRect(width * 0.08, height * 0.2, width * 0.84, height * 0.45);
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      ctx.fillStyle = hexA(mixHex("#0f5a34", "#7a5a2a", t), 0.7);
      ctx.fillRect(width * (0.1 + t * 0.8), height * 0.6, 6, -20 - 30 * state.canopy);
    }
    caption(ctx, width * 0.1, height * 0.72, "Whole bay — chlorophyll wash over the coast", theme, { size: 12, weight: 700 });
  }

  // Scale bar.
  badge(ctx, width - 150, 24, `Scale: ${fmtSci(LEVEL_SCALE_M[level])} m (${LEVEL_LABEL[level]})`, theme, { align: "left" });

  const site = params.perturbationSite as Level;
  const type = params.perturbationType as string;
  if (type !== "none") {
    badge(ctx, 20, 24, `Perturbation: ${type} @ ${LEVEL_LABEL[site]}`, theme, { align: "left" });
  }

  if (state.urchin >= BARREN_URCHIN_PER_M2) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    glow(ctx, centerX, centerY, 140, "#a34a2a", 0.4);
    ctx.restore();
    caption(ctx, centerX - 40, height - 30, "BARREN", theme, { size: 14, weight: 800, color: "#a34a2a" });
  }

  vignette(ctx, width, height, dark ? 0.5 : 0.2);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  scale: "patch", perturbationSite: "patch", perturbationType: "none",
  otterCount: 18, upwellingNitrate: 18, surfaceLight: 1200, seaTemp: 13, playbackSpeed: 4,
};

export const chloroplastToCoastlineSim: SimManifest<State> = {
  id: "g6.a1-5",
  title: "From Chloroplast to Coastline",
  tagline: "Watch one process, carbon fixation, read at six sizes at once — from one chloroplast to the whole bay — and see which changes vanish before they reach the top.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-1"] },
  learningGoals: [
    "State that the same underlying process can be read at many nested scales, each with its own natural units and its own characteristic time.",
    "Trace a quantity upward through real, computed aggregation (a count times the level below) rather than a separately invented number at each level.",
    "Predict and verify which level a small, local change disappears at, and which level a change to the whole system reaches every level.",
    "Explain a barren as a real, slow-reversing consequence of removing a predator, not an instant, freely reversible switch.",
  ],
  misconceptions: [
    "A system has one true size, and 'zooming in' just shows more detail of the same fixed picture",
    "A change big enough to matter at a small scale must matter just as much at a large one",
    "Removing then restoring a predator undoes its effect on the same timescale",
    "More predators always means fewer prey right away, with no lag",
  ],
  interactionHint: "Pick a scale to view, then drop a perturbation somewhere and scrub the timeline to see how far it travels.",
  tickRate: 30,
  timeScale: 1,
  params: {
    scale: {
      type: "option", label: "Scale",
      options: LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] })),
      default: "patch",
      help: "Which of the six nested levels is on screen, and which units the carbon-fixed readout uses.",
    },
    perturbationSite: {
      type: "option", label: "Perturbation site",
      options: LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] })),
      default: "patch",
      help: "Level at which the next change is injected.",
    },
    perturbationType: {
      type: "option", label: "Perturbation type",
      options: [
        { value: "none", label: "None" },
        { value: "blockLight", label: "Block light" },
        { value: "cutNutrients", label: "Cut nutrients" },
        { value: "removeOtters", label: "Remove otters" },
        { value: "warmWater", label: "Warm water +3 °C" },
        { value: "stormSwell", label: "Storm swell" },
        { value: "harvestCanopy", label: "Harvest canopy" },
      ],
      default: "none",
      help: "What the injected change actually does; scoped to how much of the bay the chosen site represents.",
    },
    otterCount: { type: "number", label: "Otter population", kind: "count", min: 0, max: 40, step: 1, default: 18, help: "Predation pressure on urchins in the modelled patch." },
    upwellingNitrate: { type: "number", label: "Upwelling nitrate", kind: "ratio", unit: "µmol/L", min: 0, max: 30, step: 1, default: 18, help: "Nutrient supply to kelp growth, the Central California seasonal driver." },
    surfaceLight: { type: "number", label: "Surface light", kind: "ratio", unit: "µmol photons/m²/s", min: 0, max: 2000, step: 10, default: 1200, help: "Light at the sea surface before attenuation with depth." },
    seaTemp: { type: "number", label: "Sea temperature", kind: "ratio", unit: "°C", min: 10, max: 24, step: 1, default: 13, help: "Growth rate and, away from the optimum, nutrient stress." },
    playbackSpeed: { type: "number", label: "Playback speed", kind: "ratio", unit: "yr/s", min: 0.1, max: 20, step: 0.1, default: 4, marks: [{ value: 0.1, label: "0.1 yr/s" }, { value: 20, label: "20 yr/s" }], help: "Simulated years per real second — the ecology, not the chloroplast reading, needs years to play out." },
  },
  model,
  render,
  labs: [
    {
      id: "climb-the-ladder",
      title: "Climb the ladder",
      question: "Read carbon fixed at all six levels. The number changes by many orders of magnitude. What stays the same?",
      bands: ["6-8"], minutes: 18, standards: ["MS-LS2-1"],
      setup: { ...BASE_SETUP, perturbationType: "none" },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict before running",
          instruction: "Six levels, one process.",
          predict: {
            prompt: "Between the chloroplast reading and the bay reading, what is genuinely different, and what is genuinely the same?",
            options: ["Everything is different — they are six separate models", "Only the units and the count multiplying them differ; the underlying process is identical", "Only the chloroplast level is real; the rest are estimates"],
            correct: 1,
            reveal: "Only the units and the count differ. Every level's number is the SAME chloroplast rate multiplied by a real count of chloroplasts, cells, blades, plants or patches.",
          },
        },
        {
          id: "run", phase: "measure", title: "Read every level",
          instruction: "Set Scale to each of the six levels in turn and record carbon fixed.",
          requireData: 1,
          check: { describe: "The span from chloroplast to bay covers many orders of magnitude", test: (v) => (v.facts.ordersOfMagnitudeSpan as number) > 8 },
          hints: ["Watch the unit label change under the number, not just the number itself."],
        },
        {
          id: "conclude", phase: "conclude", title: "Say what stays the same",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "The same underlying process can be read at many nested scales, each with its own natural units. Say, in your own words, what a 'scale' is here.",
            placeholder: "A scale is not a different system — it is the same process, counted...",
          },
        },
      ],
    },
    {
      id: "break-it-at-the-bottom",
      title: "Break it at the bottom",
      question: "One chloroplast is shaded. Measure the effect at cell, plant, patch and bay. At which level does it vanish into the noise?",
      bands: ["6-8"], minutes: 18, standards: ["MS-LS2-1"],
      setup: { ...BASE_SETUP, perturbationSite: "chloroplast", perturbationType: "blockLight" },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict before running",
          instruction: "A single chloroplast is now shaded.",
          predict: {
            prompt: "How much will the bay-level total change?",
            options: ["A large, easily measured amount", "A genuinely unmeasurable amount — one chloroplast among trillions", "Exactly zero, with no way to tell it happened at all"],
            correct: 1,
            reveal: "Unmeasurably small, not exactly zero: one real chloroplast really did stop, it is just one among the tens of trillions the bay actually holds.",
          },
        },
        {
          id: "run", phase: "measure", title: "Check the bay level",
          instruction: "Set Scale to Whole bay and compare the reading with and without the perturbation.",
          requireData: 1,
          check: { describe: "The bay-level effect is negligible", test: (v) => v.facts.bayNegligible === true },
        },
        {
          id: "conclude", phase: "conclude", title: "Name the vanishing level",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "At which level did the effect stop being measurable, and why?",
            placeholder: "By the ... level, the change is diluted across too many...",
          },
        },
      ],
    },
    {
      id: "break-it-in-the-middle",
      title: "Break it in the middle",
      question: "The forest collapses to a barren. Has photosynthesis per chloroplast changed? What has changed?",
      bands: ["6-8"], minutes: 20, standards: ["MS-LS2-1"],
      setup: { ...BASE_SETUP, perturbationSite: "patch", perturbationType: "removeOtters", otterCount: 0, playbackSpeed: 10 },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict before running",
          instruction: "Otters removed from the patch. Run the clock forward about a year.",
          predict: {
            prompt: "If you restore the otters right now, how soon does the forest return?",
            options: ["Immediately — removing the cause removes the effect", "Within about a year", "It takes several more years, if it returns within the run at all"],
            correct: 2,
            reveal: "Several years. An otter's own predation rate saturates once urchins are already abundant, so restoring the predator does not undo an irruption on the same timescale it took to happen.",
          },
        },
        {
          id: "run", phase: "measure", title: "Confirm the barren, then restore",
          instruction: "Let it run to a genuine barren, read urchin density and canopy, then set Otter population back to 18 and keep the clock running for several more simulated years.",
          requireData: 1,
          check: { describe: "The patch is genuinely barren before the otters are restored", test: (v) => v.facts.isBarren === true },
          hints: ["Canopy near zero and urchins above about 9 per m² is what 'barren' means here — read from the state, not asserted."],
        },
        {
          id: "conclude", phase: "conclude", title: "Say what actually changed",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "Photosynthesis per chloroplast has not changed at all. What changed instead?",
            placeholder: "The number of plants actually present in the patch...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "the-2014-warm-blob",
      title: "The 2014 warm blob",
      brief: "Reproduce the real, combined Central-California event: warmer water, weaker upwelling, and a reduced otter raft, together.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, seaTemp: 19, upwellingNitrate: 3, otterCount: 6, perturbationType: "warmWater", perturbationSite: "bay" },
      goal: {
        describe: "Base productivity (temperature and nitrate alone) is cut to well under half of the healthy default",
        test: (v) => (v.facts.productivityFrac as number) < 0.4,
      },
      hints: [
        "No single control here is as extreme as 'remove all the otters' — the real event was several ordinary-looking stresses arriving together.",
        "Warm water and weak nitrate each act on the same chloroplast rate that every level's reading is built from; read Productivity, not canopy — this particular combination does not touch the otter/urchin side of the model at all.",
      ],
    },
    {
      id: "smallest-visible-perturbation",
      title: "Find where it stops mattering",
      brief: "Starting from Whole bay, move the perturbation site down one level at a time until the bay-level effect becomes negligible.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, perturbationSite: "plant", perturbationType: "blockLight" },
      goal: {
        describe: "Find a site where blocking light is genuinely negligible at the bay",
        test: (v) => v.facts.bayNegligible === true && v.params.perturbationSite !== "bay",
      },
    },
  ],
};
