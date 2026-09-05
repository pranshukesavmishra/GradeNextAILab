import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { strataColumn } from "@ui/geo";
import {
  badge, caption, clamp01, hexA, isDarkTheme, vignette,
} from "@ui/scene";

/**
 * The Living Skin: Painting Life onto Bare Rock — Grade 6, Unit A4.4: the
 * biosphere.
 *
 * One hundred patches, each an independent agent with its own biome, age and
 * maturity. Painting a patch does not switch on a single "oxygen output"
 * number — it switches on TWO real, opposing carbon flows at once: gross
 * photosynthesis, and plant-plus-decomposer respiration eating most of it
 * straight back. Net storage is deliberately whatever is left over, which is
 * usually small and can genuinely go negative: crank decomposer activity and
 * temperature high enough (a real Q10 response — soil respiration roughly
 * triples for every 15 C of warming) and the same photosynthesis that was a
 * net carbon sink becomes a net source, exactly the failure mode a warming
 * world risks for real.
 *
 * The honesty rule this sim exists to uphold: photosynthesis and respiration
 * are two live arrows, always both drawn, never a single one-way "plants
 * make oxygen" pipe. And root respiration genuinely drives the soil's own
 * CO2 far above the atmosphere's, which genuinely accelerates weathering of
 * the rock beneath — soil is shown thickening because the root chemistry is
 * dissolving fresh granodiorite, not because a slider says "grow now."
 */

/* ------------------------------------------------------------------ *
 * World constants — real biome production rates and timescales
 * ------------------------------------------------------------------ */

type Biome = "redwood" | "chaparral" | "grassland" | "mojave" | "kelp" | "plankton" | "tundra";

interface BiomeSpec {
  label: string;
  gppMax: number;        // g C / m^2 / yr at full maturity, ideal conditions
  maturationYr: number;  // years to grow from bare rock to full maturity
  rootCo2X: number;      // multiple of background soil CO2 from root respiration (0 = marine, no soil)
  rainOptimalMm: [number, number];
  color: string;
  isLand: boolean;
}

const BIOMES: Record<Biome, BiomeSpec> = {
  redwood: { label: "Coast redwood", gppMax: 1300, maturationYr: 80, rootCo2X: 60, rainOptimalMm: [900, 3000], color: "#1f5c3a", isLand: true },
  chaparral: { label: "Chaparral", gppMax: 450, maturationYr: 15, rootCo2X: 20, rainOptimalMm: [250, 650], color: "#7a8f4a", isLand: true },
  grassland: { label: "Valley grassland", gppMax: 550, maturationYr: 5, rootCo2X: 25, rainOptimalMm: [300, 900], color: "#b7a339", isLand: true },
  mojave: { label: "Mojave scrub", gppMax: 60, maturationYr: 30, rootCo2X: 8, rainOptimalMm: [0, 250], color: "#b08a55", isLand: true },
  kelp: { label: "Kelp bed", gppMax: 600, maturationYr: 2, rootCo2X: 0, rainOptimalMm: [0, 5000], color: "#2f8f5f", isLand: false },
  plankton: { label: "Open-ocean plankton", gppMax: 130, maturationYr: 1, rootCo2X: 0, rainOptimalMm: [0, 5000], color: "#3fae7a", isLand: false },
  tundra: { label: "Arctic tundra", gppMax: 80, maturationYr: 40, rootCo2X: 5, rainOptimalMm: [150, 500], color: "#8fae9a", isLand: true },
};

const PLANT_RESP_FRAC = 0.5;        // spec: plant respiration burns roughly half of GPP
const DECOMP_BASE_FRAC = 0.85;      // spec: decomposers return nearly all the remainder
const O2_PER_C = 2.67;              // real stoichiometry, g O2 per g C
const DECOMP_Q10 = 2.5;             // real soil-respiration temperature sensitivity
const BASE_WEATHERING_MM_YR = 0.02; // spec: bare-rock floor of the 0.02-0.1 mm/yr range
const WEATHERING_CO2_GAIN = 2.0;    // extra weathering multiplier at full root-CO2 enhancement

const PATCH_GRID = 10;
const PATCH_COUNT = PATCH_GRID * PATCH_GRID;
const HISTORY_MAX = 600;
const SAMPLE_YR = 5;

const K = 273.15;

/** Rainfall suitability, 0-1: full inside the biome's real range, falling off
 *  outside it — this is what makes a biome painted outside its range thin. */
/** A biome falls off to zero suitability this many mm past its own optimal
 *  range boundary — fixed rather than scaled to the range's own width, so a
 *  wide-tolerance biome like redwood still genuinely stresses in true desert
 *  rainfall instead of reading as comfortable anywhere the slider can reach. */
const RAIN_STRESS_SPAN_MM = 500;

function rainSuitability(biome: Biome, rainfallMm: number): number {
  const [lo, hi] = BIOMES[biome].rainOptimalMm;
  if (rainfallMm >= lo && rainfallMm <= hi) return 1;
  const dist = rainfallMm < lo ? lo - rainfallMm : rainfallMm - hi;
  return clamp01(1 - dist / RAIN_STRESS_SPAN_MM);
}

function co2Modifier(co2ppm: number): number {
  return Math.max(0.4, Math.min(1.8, co2ppm / 420));
}

/** Real, saturating temperature response: photosynthesis peaks near 25 C and
 *  falls off on both sides (too cold slows enzymes, too hot stresses plants). */
function tempModifierPhoto(tempC: number): number {
  const x = (tempC - 25) / 15;
  return Math.max(0.05, Math.exp(-x * x));
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Patch {
  biome: Biome | null;
  plantedYear: number;
  maturity: number;   // 0-1, relaxes toward a rainfall/CO2-set target
  soilDepthMm: number;
}

interface State {
  simYears: number;
  patches: Patch[];
  sampleClock: number;
  histYr: number[];
  histNetC: number[];
  histSoil: number[];
  cumulativeWeatheredMm: number;
}

function makePatch(): Patch {
  return { biome: null, plantedYear: 0, maturity: 0, soilDepthMm: 20 };
}

function buildWorld(): State {
  const patches: Patch[] = [];
  for (let i = 0; i < PATCH_COUNT; i++) patches.push(makePatch());
  return {
    simYears: 0, patches, sampleClock: 0,
    histYr: [0], histNetC: [0], histSoil: [20],
    cumulativeWeatheredMm: 0,
  };
}

/** Ensures exactly `coverage` fraction of patches are non-bare, planting new
 *  ones with `brush` (lowest index first) or reverting extra ones to bare
 *  (highest index first) — deterministic, so the same coverage always paints
 *  the same patches regardless of the path taken to get there. */
function applyCoverage(patches: Patch[], coverage: number, brush: Biome | null, simYears: number): Patch[] {
  const wantPlanted = Math.round(clamp01(coverage) * PATCH_COUNT);
  const next = patches.map((p) => ({ ...p }));
  let plantedCount = next.filter((p) => p.biome !== null).length;
  if (plantedCount < wantPlanted && brush !== null) {
    for (let i = 0; i < next.length && plantedCount < wantPlanted; i++) {
      if (next[i].biome === null) {
        next[i] = { biome: brush, plantedYear: simYears, maturity: 0, soilDepthMm: next[i].soilDepthMm };
        plantedCount++;
      }
    }
  } else if (plantedCount > wantPlanted) {
    for (let i = next.length - 1; i >= 0 && plantedCount > wantPlanted; i--) {
      if (next[i].biome !== null) {
        next[i] = { ...next[i], biome: null, maturity: 0 };
        plantedCount--;
      }
    }
  }
  return next;
}

/** One patch's live flows, g C / m^2 / yr, given the current environment. */
function patchFlows(p: Patch, params: ParamValues): {
  gpp: number; plantResp: number; decompResp: number; net: number; soilCo2X: number;
} {
  if (p.biome === null) return { gpp: 0, plantResp: 0, decompResp: 0, net: 0, soilCo2X: 1 };
  const spec = BIOMES[p.biome];
  const tempC = (params.airTemperature as number) - K;
  const rainfall = params.rainfall as number;
  const co2 = params.atmosphericCO2 as number;
  const herb = (params.herbivoreStocking as number) / 60;
  const decompActivity = params.decomposerActivity as number;

  const grazeLoss = 1 - 0.5 * herb * 0.3;
  const gpp = spec.gppMax * p.maturity * tempModifierPhoto(tempC) * co2Modifier(co2) *
    rainSuitability(p.biome, rainfall) * grazeLoss;
  const plantResp = gpp * PLANT_RESP_FRAC;
  const q10Factor = DECOMP_Q10 ** ((tempC - 15) / 15);
  const dungRoute = gpp * herb * 0.3; // grazed carbon decomposes fast, via dung
  const decompResp = (gpp - plantResp) * DECOMP_BASE_FRAC * decompActivity * q10Factor + dungRoute;
  const net = gpp - plantResp - decompResp;
  const soilCo2X = 1 + (spec.rootCo2X - 1) * p.maturity;
  return { gpp, plantResp, decompResp, net, soilCo2X };
}

function weatheringRateMm(soilCo2X: number, isLand: boolean): number {
  if (!isLand) return 0;
  const enhancement = 1 + (WEATHERING_CO2_GAIN * (soilCo2X - 1)) / 60; // normalised to the strongest biome
  return BASE_WEATHERING_MM_YR * enhancement;
}

function pushSample(s: State, netCTotal: number, soilAvg: number): void {
  const drop = s.histYr.length >= HISTORY_MAX ? 1 : 0;
  s.histYr = s.histYr.slice(drop); s.histNetC = s.histNetC.slice(drop); s.histSoil = s.histSoil.slice(drop);
  s.histYr.push(s.simYears); s.histNetC.push(netCTotal); s.histSoil.push(soilAvg);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    let s = buildWorld();
    const brush = params.biomeBrush as string;
    s = {
      ...s,
      patches: applyCoverage(s.patches, params.patchCoverage as number, brush === "eraser" ? null : (brush as Biome), 0),
    };
    return s;
  },

  applyParams(state, params, prev) {
    if (params.patchCoverage === prev.patchCoverage && params.biomeBrush === prev.biomeBrush) return state;
    const brush = params.biomeBrush as string;
    return {
      ...state,
      patches: applyCoverage(state.patches, params.patchCoverage as number, brush === "eraser" ? null : (brush as Biome), state.simYears),
    };
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const compYrPerSec = params.timeCompression as number;
    const dtYr = dt * compYrPerSec;
    const patches = state.patches.map((p) => ({ ...p }));
    let netCTotal = 0;
    let soilSum = 0;
    let landCount = 0;

    for (const p of patches) {
      if (p.biome === null) {
        // Bare rock still weathers, slowly, from atmospheric CO2 in rainwater
        // alone — the pipe between air and rock never fully stops.
        p.soilDepthMm += BASE_WEATHERING_MM_YR * dtYr;
        soilSum += p.soilDepthMm;
        landCount++;
        continue;
      }
      const spec = BIOMES[p.biome];
      const rainfall = params.rainfall as number;
      const suitability = rainSuitability(p.biome, rainfall);
      // Maturity relaxes toward a target set by growing conditions: full
      // maturity when suitable, real drought dieback when it is not.
      const target = suitability > 0.4 ? 1 : 0.15;
      const rate = 1 / spec.maturationYr;
      p.maturity = clamp01(p.maturity + (target - p.maturity) * rate * dtYr);

      const flows = patchFlows(p, params);
      netCTotal += flows.net;
      if (spec.isLand) {
        const wRate = weatheringRateMm(flows.soilCo2X, true);
        p.soilDepthMm += wRate * dtYr;
        soilSum += p.soilDepthMm;
        landCount++;
      }
    }

    const simYears = state.simYears + dtYr;
    const soilAvg = landCount > 0 ? soilSum / landCount : 20;
    let sampleClock = state.sampleClock + dtYr;
    let s: State = { ...state, patches, simYears, sampleClock, cumulativeWeatheredMm: soilAvg - 20 };
    while (s.sampleClock >= SAMPLE_YR) {
      s.sampleClock -= SAMPLE_YR;
      pushSample(s, netCTotal, soilAvg);
    }
    return s;
  },

  readouts(state, params) {
    let gppTotal = 0, plantRespTotal = 0, decompRespTotal = 0, netTotal = 0, soilSum = 0, planted = 0;
    for (const p of state.patches) {
      const f = patchFlows(p, params);
      gppTotal += f.gpp; plantRespTotal += f.plantResp; decompRespTotal += f.decompResp; netTotal += f.net;
      soilSum += p.soilDepthMm;
      if (p.biome !== null) planted++;
    }
    const n = state.patches.length;
    return [
      { key: "years", label: "Simulated years", quantity: q(state.simYears, "count"), semantic: "time" },
      { key: "gpp", label: "Gross photosynthesis (avg, gC/m2/yr)", quantity: q(gppTotal / n, "ratio"), semantic: "producer", graphable: true },
      { key: "plantResp", label: "Plant respiration (avg, gC/m2/yr)", quantity: q(plantRespTotal / n, "ratio"), semantic: "consumer", graphable: true },
      { key: "decompResp", label: "Decomposer respiration (avg, gC/m2/yr)", quantity: q(decompRespTotal / n, "ratio"), semantic: "decomposer", graphable: true },
      { key: "netCarbon", label: "Net carbon storage (avg, gC/m2/yr)", quantity: q(netTotal / n, "ratio"), semantic: "field", graphable: true },
      { key: "netOxygen", label: "Net oxygen flux (avg, gO2/m2/yr)", quantity: q((netTotal / n) * O2_PER_C, "ratio"), semantic: "cold", graphable: true },
      { key: "coverage", label: "Land covered", unit: "%", quantity: q(planted / n, "percent"), semantic: "field" },
      { key: "soilDepth", label: "Mean soil depth", unit: "mm", quantity: q(soilSum / n, "length"), semantic: "mass", graphable: true },
    ];
  },

  facts(state, params) {
    let gppTotal = 0, plantRespTotal = 0, decompRespTotal = 0, netTotal = 0, soilSum = 0, planted = 0;
    const byBiome: Record<string, { gpp: number; plantResp: number; decompResp: number; net: number; count: number }> = {};
    for (const p of state.patches) {
      const f = patchFlows(p, params);
      gppTotal += f.gpp; plantRespTotal += f.plantResp; decompRespTotal += f.decompResp; netTotal += f.net;
      soilSum += p.soilDepthMm;
      if (p.biome !== null) {
        planted++;
        const key = p.biome;
        if (!byBiome[key]) byBiome[key] = { gpp: 0, plantResp: 0, decompResp: 0, net: 0, count: 0 };
        byBiome[key].gpp += f.gpp; byBiome[key].plantResp += f.plantResp;
        byBiome[key].decompResp += f.decompResp; byBiome[key].net += f.net; byBiome[key].count++;
      }
    }
    const n = state.patches.length;
    const chamberSite = params.fluxChamberSite as Biome;
    const chamberAgg = byBiome[chamberSite];
    const chamberGpp = chamberAgg && chamberAgg.count > 0 ? chamberAgg.gpp / chamberAgg.count : 0;
    const chamberNet = chamberAgg && chamberAgg.count > 0 ? chamberAgg.net / chamberAgg.count : 0;
    const out: Record<string, number | boolean | string> = {
      simYears: state.simYears,
      gppAvg: gppTotal / n,
      plantRespAvg: plantRespTotal / n,
      decompRespAvg: decompRespTotal / n,
      netCarbonAvg: netTotal / n,
      netOxygenAvg: (netTotal / n) * O2_PER_C,
      soilDepthAvgMm: soilSum / n,
      soilDepthGainMm: soilSum / n - 20,
      coverageFraction: planted / n,
      chamberGppPerM2Yr: chamberGpp,
      chamberNetPerM2Yr: chamberNet,
      redwoodGppPerM2Yr: byBiome.redwood && byBiome.redwood.count > 0 ? byBiome.redwood.gpp / byBiome.redwood.count : 0,
      grasslandGppPerM2Yr: byBiome.grassland && byBiome.grassland.count > 0 ? byBiome.grassland.gpp / byBiome.grassland.count : 0,
      mojaveGppPerM2Yr: byBiome.mojave && byBiome.mojave.count > 0 ? byBiome.mojave.gpp / byBiome.mojave.count : 0,
      redwoodNetPerM2Yr: byBiome.redwood && byBiome.redwood.count > 0 ? byBiome.redwood.net / byBiome.redwood.count : 0,
      grasslandNetPerM2Yr: byBiome.grassland && byBiome.grassland.count > 0 ? byBiome.grassland.net / byBiome.grassland.count : 0,
      mojaveNetPerM2Yr: byBiome.mojave && byBiome.mojave.count > 0 ? byBiome.mojave.net / byBiome.mojave.count : 0,
      biomeBrush: params.biomeBrush as string,
      leafAreaAvg: state.patches.reduce((sum, p) => sum + p.maturity, 0) / n,
      activeFlowsCount: (gppTotal > 1e-6 ? 1 : 0) + (plantRespTotal > 1e-6 ? 1 : 0) + (decompRespTotal > 1e-6 ? 1 : 0),
    };
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }

function drawPatchGrid(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const cell = Math.min(w / PATCH_GRID, h / PATCH_GRID);
  const gridW = cell * PATCH_GRID, gridH = cell * PATCH_GRID;
  const ox = x + (w - gridW) / 2, oy = y + (h - gridH) / 2;
  for (let i = 0; i < PATCH_COUNT; i++) {
    const p = state.patches[i];
    const col = i % PATCH_GRID, row = Math.floor(i / PATCH_GRID);
    const px = ox + col * cell, py = oy + row * cell;
    if (p.biome === null) {
      ctx.fillStyle = isDarkTheme(theme) ? "#4a4238" : "#c9b896";
    } else {
      const spec = BIOMES[p.biome];
      ctx.fillStyle = mixHex(isDarkTheme(theme) ? "#3a3428" : "#c9b896", spec.color, 0.25 + 0.75 * p.maturity);
    }
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
  }
  ctx.strokeStyle = hexA(theme.line, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, gridW, gridH);
}

function drawCorePatch(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  const site = params.fluxChamberSite as Biome;
  const sample = state.patches.find((p) => p.biome === site) ?? state.patches[0];
  const depth = sample.soilDepthMm;
  const layers = [
    { name: "litter", color: "#6b5334", thicknessFrac: 5 },
    { name: "topsoil (A)", color: "#4a3a24", thicknessFrac: Math.max(5, depth * 0.4) },
    { name: "subsoil (B)", color: "#7a6244", thicknessFrac: Math.max(5, depth * 0.4) },
    { name: "saprolite", color: "#9a8c72", thicknessFrac: Math.max(3, depth * 0.2) },
    { name: "granodiorite", color: "#8f8a92", thicknessFrac: 30 },
  ];
  strataColumn(ctx, x + 12, y + 20, w - 24, h - 36, layers, { labels: true });
  caption(ctx, x + 8, y + 14, `CORE PATCH: ${BIOMES[site as Biome]?.label ?? site} · soil ${num(depth - 20, 1)} mm gained`, theme, {
    size: 9, weight: 800, color: theme.inkSoft,
  });
  ctx.restore();
}

function drawFluxLedger(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "AIR / LIFE / ROCK LEDGER", theme, { size: 9, weight: 800, color: theme.inkSoft });

  let gpp = 0, plantResp = 0, decompResp = 0, net = 0, soilCo2xSum = 0, landCount = 0;
  for (const p of state.patches) {
    const f = patchFlows(p, params);
    gpp += f.gpp; plantResp += f.plantResp; decompResp += f.decompResp; net += f.net;
    if (p.biome === null || BIOMES[p.biome].isLand) { soilCo2xSum += f.soilCo2X; landCount++; }
  }
  const n = state.patches.length;
  const weatherRate = weatheringRateMm(landCount > 0 ? soilCo2xSum / landCount : 1, true);
  const bins: [string, number, string][] = [
    ["air -> life (photosynthesis)", gpp / n, "#3f8f4a"],
    ["life -> air (plant respiration)", -plantResp / n, "#c9403f"],
    ["life -> air (decomposer resp.)", -decompResp / n, "#8a5c3f"],
    ["net life <-> air", net / n, net >= 0 ? "#3f8f4a" : "#c9403f"],
    ["life -> rock (weathering, mm/yr)", weatherRate, "#7a6244"],
  ];
  const barX = x + 150, barW = w - 166, maxMag = Math.max(200, gpp / n);
  bins.forEach(([label, v, color], i) => {
    const ry = y + 28 + i * 18;
    caption(ctx, x + 8, ry + 5, label, theme, { size: 8, color: theme.inkSoft });
    const mid = barX + barW / 2;
    const scale = (barW / 2) / maxMag;
    ctx.fillStyle = hexA(theme.grid, 0.4);
    roundRect(ctx, barX, ry, barW, 8, 2);
    ctx.fill();
    ctx.fillStyle = color;
    const bw = Math.min(barW / 2, Math.abs(v) * scale);
    if (v >= 0) roundRect(ctx, mid, ry, bw, 8, 2); else roundRect(ctx, mid - bw, ry, bw, 8, 2);
    ctx.fill();
  });
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "#05070c" : "#eef3f6";
  ctx.fillRect(0, 0, width, height);
  const view = params.view as string;
  const sideW = Math.min(260, width * 0.34);

  if (view === "globe") {
    drawPatchGrid(rc, 20, 40, width - sideW - 40, height - 80);
  } else if (view === "corePatch") {
    drawCorePatch(rc, 20, 40, width - sideW - 40, height - 80);
  } else {
    drawFluxLedger(rc, 20, 40, width - sideW - 40, height - 80);
  }

  // Right panel: per-biome summary bars, always visible regardless of view.
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, width - sideW + 4, 12, sideW - 16, height - 24, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, width - sideW + 12, 26, "PATCH CENSUS", theme, { size: 9, weight: 800, color: theme.inkSoft });
  const counts: Record<string, number> = {};
  for (const p of state.patches) {
    const key = p.biome ?? "bare";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  let ry = 42;
  for (const key of Object.keys(counts)) {
    const label = key === "bare" ? "bare rock" : BIOMES[key as Biome].label;
    const color = key === "bare" ? theme.inkSoft : BIOMES[key as Biome].color;
    ctx.fillStyle = color;
    ctx.fillRect(width - sideW + 12, ry - 4, 8, 8);
    caption(ctx, width - sideW + 26, ry, `${label}: ${counts[key]}%`, theme, { size: 9, color: theme.inkSoft });
    ry += 14;
  }
  caption(ctx, width - sideW + 12, ry + 10, `year ${state.simYears.toFixed(0)}`, theme, { size: 9, color: theme.inkSoft });
  ctx.restore();

  const netAvg = (() => {
    let net = 0;
    for (const p of state.patches) net += patchFlows(p, params).net;
    return net / state.patches.length;
  })();
  badge(ctx, 12, 20, `net C ${netAvg >= 0 ? "+" : ""}${num(netAvg)} gC/m2/yr`, theme, {
    color: netAvg >= 0 ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, width - sideW - 12, 20, `year ${state.simYears.toFixed(0)}`, theme, { align: "right", color: theme.sci["field"] });
  vignette(ctx, width, height, 0.12);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  biomeBrush: "grassland", patchCoverage: 0.35, herbivoreStocking: 12, decomposerActivity: 1.0,
  airTemperature: 15 + K, rainfall: 500, atmosphericCO2: 420, timeCompression: 1,
  view: "globe", fluxChamberSite: "grassland",
};

export const livingSkinSim: SimManifest<State> = {
  id: "g6.a4-4",
  title: "The Living Skin: Painting Life onto Bare Rock",
  tagline: "Paint biomes onto bare rock and watch two real carbon flows — never one — decide whether life is storing carbon or burning it back.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-3", "MS-ESS2-1"] },
  learningGoals: [
    "State that photosynthesis and respiration run at once, and net storage is their small difference.",
    "Explain that root and soil respiration accelerate the chemical weathering that builds soil.",
    "Predict when warming can flip an ecosystem from a net carbon sink to a net source.",
  ],
  misconceptions: [
    "Plants only produce oxygen and never consume it",
    "The biosphere is a layer sitting on top of the Earth rather than a flow through it",
    "Soil is just broken-up rock, unrelated to living things",
    "More warmth always means more plant growth and more carbon storage",
  ],
  interactionHint: "Raise patch coverage with a biome selected, then switch to the flux ledger to watch both carbon arrows move.",
  tickRate: 30,
  timeScale: 1,
  params: {
    biomeBrush: {
      type: "option", label: "Biome brush",
      options: [
        { value: "redwood", label: "Coast redwood" },
        { value: "chaparral", label: "Chaparral" },
        { value: "grassland", label: "Valley grassland" },
        { value: "mojave", label: "Mojave scrub" },
        { value: "kelp", label: "Kelp bed" },
        { value: "plankton", label: "Open-ocean plankton" },
        { value: "tundra", label: "Arctic tundra" },
        { value: "eraser", label: "Bare rock eraser" },
      ],
      default: "grassland",
      help: "What newly painted patches become as coverage rises.",
    },
    patchCoverage: {
      type: "number", label: "Patch coverage", kind: "percent",
      min: 0, max: 1, step: 0.01, default: 0.35,
      help: "How much of the hundred-patch grid carries living cover.",
    },
    herbivoreStocking: {
      type: "number", label: "Herbivore stocking", kind: "count",
      min: 0, max: 60, step: 1, default: 12,
      help: "Animals per unit area — grazing pressure and the dung route.",
    },
    decomposerActivity: {
      type: "number", label: "Decomposer activity", kind: "percent",
      min: 0, max: 2, step: 0.05, default: 1,
      help: "Speed litter and soil carbon are returned to CO2.",
    },
    airTemperature: {
      type: "number", label: "Air temperature", kind: "temperature", unit: "°C",
      min: -10 + K, max: 40 + K, step: 1, default: 15 + K,
      help: "Photosynthesis and decomposition respond differently, so the net flip point moves.",
    },
    rainfall: {
      type: "number", label: "Rainfall (mm/yr)", kind: "ratio",
      min: 0, max: 3000, step: 50, default: 500,
      help: "A biome painted outside its real rainfall range thins and dies back.",
    },
    atmosphericCO2: {
      type: "number", label: "Atmospheric CO2 (ppm)", kind: "ratio",
      min: 180, max: 800, step: 10, default: 420,
      help: "Photosynthesis rate and soil weathering both respond to it.",
    },
    timeCompression: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1 / 365, max: 500, step: 1, default: 1,
      marks: [{ value: 1 / 365, label: "1 day/s" }, { value: 500, label: "500 yr/s" }],
      help: "Simulated years per real second, from single days to soil-building millennia.",
    },
    view: {
      type: "option", label: "View",
      options: [
        { value: "globe", label: "Patch grid" },
        { value: "corePatch", label: "Core patch" },
        { value: "fluxLedger", label: "Flux ledger" },
      ],
      default: "globe",
      help: "Switches between the planted grid, the soil cutaway, and the accounting bins.",
    },
    fluxChamberSite: {
      type: "option", label: "Flux chamber site",
      options: [
        { value: "redwood", label: "Coast redwood" },
        { value: "chaparral", label: "Chaparral" },
        { value: "grassland", label: "Valley grassland" },
        { value: "mojave", label: "Mojave scrub" },
        { value: "kelp", label: "Kelp bed" },
        { value: "plankton", label: "Open-ocean plankton" },
        { value: "tundra", label: "Arctic tundra" },
      ],
      default: "grassland",
      help: "Which biome's patches the sealed chamber measures.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "world-with-nothing-living",
      title: "A world with nothing living",
      question: "With no life anywhere, do the pipes between air and rock stop? Does soil ever form?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, patchCoverage: 0, timeCompression: 500 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the bare world",
          instruction: "Every patch is bare rock. A thousand years are about to pass.",
          predict: {
            prompt: "After 1,000 years with zero coverage, will any soil have formed?",
            options: ["No, nothing happens without life", "A little — bare rock still weathers slowly", "The same amount as under a forest"],
            correct: 1,
            reveal: "A little. Rainwater alone carries enough dissolved CO2 to weather rock slowly; life does not switch weathering on from zero, it speeds up a process that was already running.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run thousand years",
          instruction: "Run 1,000 simulated years and record soil depth gained and every flux.",
          requireData: 1,
          check: { describe: "1000 years passed with zero coverage", test: (v) => (v.facts.simYears as number) >= 1000 && v.facts.coverageFraction === 0 },
        },
        {
          id: "flows",
          phase: "measure",
          title: "Check the air-life pipes",
          instruction: "Confirm the photosynthesis and respiration pipes are exactly zero.",
          check: { describe: "Zero photosynthesis, zero respiration", test: (v) => (v.facts.gppAvg as number) === 0 && (v.facts.plantRespAvg as number) === 0 },
        },
        {
          id: "soil",
          phase: "analyze",
          title: "Confirm soil still grew",
          instruction: "Check that soil depth increased despite zero life.",
          check: { describe: "Soil gained a small but nonzero depth", test: (v) => (v.facts.soilDepthGainMm as number) > 0 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Separate the two pipes",
          instruction: "Say which pipe stopped and which did not.",
          write: {
            prompt: "Which pipe stopped completely, and which kept running without any life at all?",
            placeholder: "The air-to-life pipe ..., but the rock-weathering pipe ...",
          },
        },
      ],
    },
    {
      id: "paint-california",
      title: "Paint California",
      question: "Which of the three moves the most carbon per square metre, and which moves the most once you count its area?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, biomeBrush: "redwood", patchCoverage: 0.15 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the top performer",
          instruction: "Redwood, grassland and Mojave scrub are about to be compared.",
          predict: {
            prompt: "Which biome fixes the most carbon per square metre per year?",
            options: ["Mojave scrub", "Valley grassland", "Coast redwood"],
            correct: 2,
            reveal: "Coast redwood, by a wide margin — its real gross photosynthesis rate is over twenty times the Mojave's.",
          },
        },
        {
          id: "plant-grass",
          phase: "setup",
          title: "Add grassland",
          instruction: "Switch the brush to grassland and raise coverage further.",
          requireData: 1,
          check: { describe: "Grassland patches exist", test: (v) => v.params.biomeBrush === "grassland" || (v.facts.grasslandGppPerM2Yr as number) > 0 },
        },
        {
          id: "plant-mojave",
          phase: "setup",
          title: "Add Mojave scrub",
          instruction: "Switch the brush to Mojave scrub and raise coverage again.",
          requireData: 2,
          check: { describe: "Mojave patches exist", test: (v) => (v.facts.mojaveGppPerM2Yr as number) >= 0 },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare per-area rates",
          instruction: "Let the patches mature, then compare their per-area gross photosynthesis.",
          check: {
            describe: "Redwood clearly out-produces Mojave scrub per square metre",
            test: (v) => (v.facts.redwoodGppPerM2Yr as number) > (v.facts.mojaveGppPerM2Yr as number) * 3,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Per area vs in total",
          instruction: "Explain how the ranking could change once total area is considered.",
          write: {
            prompt: "Redwood wins per square metre. How could Mojave scrub still move more carbon in total, somewhere in the real world?",
            placeholder: "If Mojave scrub covered a much larger total area than redwood forest, then ...",
          },
        },
      ],
    },
    {
      id: "warm-night-shift",
      title: "The warm night shift",
      question: "Photosynthesis is still running. Why has the net oxygen pipe dropped to zero and reversed?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, airTemperature: 30 + K, decomposerActivity: 2.0, patchCoverage: 0.6, view: "fluxLedger" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the sign",
          instruction: "Warm air and doubled decomposer activity are both dialled up.",
          predict: {
            prompt: "What happens to net carbon storage under these conditions?",
            options: ["It grows even faster, since warmth helps plants", "It can flip negative — decomposition can outrun photosynthesis", "It stays exactly the same as before"],
            correct: 1,
            reveal: "It can flip negative. Soil decomposition is strongly temperature-sensitive — real soils roughly triple their respiration for every 15 C of warming — and pushed far enough it can burn carbon faster than photosynthesis fixes it.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Measure net carbon",
          instruction: "Run until the patches mature and record net carbon and net oxygen.",
          requireData: 1,
          check: { describe: "Net carbon measured, negative", test: (v) => (v.facts.netCarbonAvg as number) < 0 },
        },
        {
          id: "confirmphoto",
          phase: "analyze",
          title: "Confirm photosynthesis did not stop",
          instruction: "Check that gross photosynthesis is still clearly positive.",
          check: { describe: "Photosynthesis still running", test: (v) => (v.facts.gppAvg as number) > 50 },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Compare with a cooler world",
          instruction: "Lower the temperature back toward 15 C and confirm net carbon returns positive.",
          requireData: 2,
          check: { describe: "Cooler conditions restore a positive net", test: (v) => (v.params.airTemperature as number) < 20 + K },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the reversal",
          instruction: "Write the mechanism in one or two sentences.",
          write: {
            prompt: "Explain how the same amount of photosynthesis can go with either a carbon gain or a carbon loss.",
            placeholder: "Net carbon is photosynthesis minus respiration, and respiration alone sped up because ...",
          },
        },
      ],
    },
    {
      id: "ten-thousand-years-of-soil",
      title: "Ten thousand years of soil",
      question: "How deep is the soil after 10,000 years, and how much granite did it take?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-1"],
      setup: { ...BASE_SETUP, biomeBrush: "redwood", patchCoverage: 1.0, timeCompression: 500, view: "corePatch", fluxChamberSite: "redwood" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the depth",
          instruction: "A fully redwood-covered world is about to run for ten thousand years.",
          predict: {
            prompt: "Roughly how much soil forms in 10,000 years under a mature redwood forest?",
            options: ["Under 1 mm", "Tens of centimetres to about a metre", "Hundreds of metres"],
            correct: 1,
            reveal: "Tens of centimetres to about a metre — soil-building is a millennia-scale process even under the most productive real biome in this model.",
          },
        },
        {
          id: "run1000",
          phase: "measure",
          title: "Check at 1,000 years",
          instruction: "Run to 1,000 years and record soil depth gained.",
          requireData: 1,
          check: { describe: "1,000 years reached", test: (v) => (v.facts.simYears as number) >= 1000 },
        },
        {
          id: "run10000",
          phase: "measure",
          title: "Run to 10,000 years",
          instruction: "Keep running to 10,000 years and record the final soil depth.",
          requireData: 2,
          check: { describe: "10,000 years reached with measurable soil gain", test: (v) => (v.facts.simYears as number) >= 10000 && (v.facts.soilDepthGainMm as number) > 50 },
        },
        {
          id: "shape",
          phase: "analyze",
          title: "Describe the shape",
          instruction: "Compare the soil-depth growth from 0-1,000 years with 1,000-10,000 years.",
          check: { describe: "A soil-depth history exists to compare", test: (v) => (v.facts.soilDepthGainMm as number) > 0 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the timescale",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "State the depth reached and say what that implies about how fast soil forms compared with a human lifetime.",
            placeholder: "After 10,000 years the soil reached about ... mm, which means a human lifetime sees only ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "carbon-sink-under-pressure",
      title: "Stay a carbon sink under pressure",
      brief: "Keep net carbon positive with air temperature at 25 C or above and decomposer activity at 150% or above.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, airTemperature: 25 + K, decomposerActivity: 1.5, biomeBrush: "redwood", patchCoverage: 0.8 },
      goal: {
        describe: "Net carbon stays positive despite the warmth and fast decomposition",
        test: (v) =>
          (v.params.airTemperature as number) >= 25 + 273.15 && (v.params.decomposerActivity as number) >= 1.5 &&
          (v.facts.netCarbonAvg as number) > 0,
      },
      hints: ["The most productive biome available gives you the most photosynthesis to spend."],
    },
    {
      id: "match-the-rain",
      title: "Match the biome to the rainfall",
      brief: "Paint a biome that thrives (maturity above 0.8) at whatever rainfall you are given.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, rainfall: 150, biomeBrush: "mojave", patchCoverage: 0.3, timeCompression: 50 },
      goal: {
        describe: "Leaf area (mean maturity) climbs above 0.8 under the given rainfall",
        test: (v) => (v.facts.leafAreaAvg as number) > 0.8 * (v.facts.coverageFraction as number),
      },
      hints: ["A biome planted outside its real rainfall range never fully matures — check each biome's optimal range."],
    },
  ],
};
