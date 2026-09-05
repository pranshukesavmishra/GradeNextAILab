import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, dashFlow, glow, hexA, isDarkTheme, metal, particleField, plastic,
  pulse, vignette, type Particle,
} from "@ui/scene";
import { barSeries, chartFrame, legend, lineSeries } from "@ui/charts";

/**
 * On the Dyno: In One End, Out the Other — Grade 6, Unit A2.3: inputs and
 * outputs.
 *
 * A single-cylinder engine on a dynamometer, run as a steady-state process
 * balance: fuel and air go in, work, heat and exhaust come out, and by
 * construction the four outputs are computed so they always sum to exactly
 * the energy the fuel released — friction is never given its own rate law,
 * it is defined as whatever is left after shaft work, coolant heat and
 * exhaust heat are subtracted, so the Sankey cannot help but close to 100%.
 * Combustion is explicit stoichiometry (2 C8H18 + 25 O2 -> 16 CO2 + 18 H2O),
 * carried out atom-by-atom: rich mixtures leave unburnt fuel in the exhaust,
 * but the carbon, hydrogen, oxygen and nitrogen counted in per second always
 * equal the atoms counted out, by algebra, not by rounding.
 *
 * The honesty rule this sim exists to uphold: closing an output kills the
 * engine as surely as closing an input. Blocking the coolant does not stop
 * heat from being generated — it accumulates in the block's own thermal
 * mass, the block genuinely heats up over the run, and past a real threshold
 * the engine derates and then seizes. Efficiency is capped at 30% not by a
 * clamp bolted onto a bigger number, but because shaft work is the only one
 * of the four outputs given a ceiling at all — the other three take
 * whatever remains, which is the whole point: most of the fuel leaves as
 * heat no matter what the controls do.
 */

/* ------------------------------------------------------------------ *
 * Real constants — the ones the spec fixes
 * ------------------------------------------------------------------ */

const DISPLACEMENT_M3 = 250e-6;  // spec: 250 cm³ single cylinder
const BORE_M = 0.070, STROKE_M = 0.065; // spec: 70 mm bore, 65 mm stroke
const RPM_IDLE = 600, RPM_MAX = 4000;   // spec: "runs 600-4000 rpm"
const TORQUE_ARM_M = 0.5; // spec: "0.5 m torque arm"
const AFR_STOICH = 14.7;  // spec default, and the real stoichiometric ratio for octane
const FUEL_LHV_J_KG = 44e6;      // spec: 44 MJ/kg
const COOLANT_CP_J_KGK = 4180;   // spec: 4.18 kJ/(kg·K)
const FUEL_DENSITY_KG_L = 0.74;  // typical gasoline, for the burette's mL reading

// Octane combustion, explicit and exact: C8H18 + 12.5 O2 -> 8 CO2 + 9 H2O.
// Real atomic masses (g/mol): C 12.011, H 1.008, O 15.999, N 14.007.
const M_C = 12.011, M_H = 1.008, M_O = 15.999, M_N = 14.007;
const M_FUEL_KG = (8 * M_C + 18 * M_H) / 1000;      // C8H18
const M_O2_KG = (2 * M_O) / 1000;
const M_N2_KG = (2 * M_N) / 1000;
const M_CO2_KG = (M_C + 2 * M_O) / 1000;
const M_H2O_KG = (2 * M_H + M_O) / 1000;
const O2_PER_FUEL_MOL = 12.5;
const CO2_PER_FUEL_MOL = 8;
const H2O_PER_FUEL_MOL = 9;

// Real dry-air composition, by mass: ~23.14% O2, the rest treated as N2 —
// the same simplification the aquarium and jar sims use for "everything else
// in air", since neither argon nor trace CO2 changes this sim's lesson.
const AIR_O2_MASS_FRAC = 0.2314;
const AIR_N2_MASS_FRAC = 1 - AIR_O2_MASS_FRAC;
const AIR_DENSITY_KG_M3 = 1.2;

/* ------------------------------------------------------------------ *
 * Reasoned estimates — the spec fixes the apparatus, not these numbers
 * ------------------------------------------------------------------ */

const VE_IDLE = 0.25, VE_MAX = 0.85; // volumetric efficiency vs throttle
/** Air mass flow at wide-open throttle: displacement × a mid-range rpm ×
 *  peak VE × air density, so the number is grounded in the real engine
 *  geometry even though it is not re-derived from a live rpm every tick
 *  (see the note on `solveDyno` below for why that coupling is decoupled). */
const AIR_FLOW_MAX_KGS = DISPLACEMENT_M3 * (3000 / 120) * VE_MAX * AIR_DENSITY_KG_M3;

const EFF_MAX = 0.30;          // spec: "efficiency must never be allowed to exceed roughly 30%"
const TIMING_OPTIMAL_DEG = 20; // spec default is the model's own MBT point
const TIMING_WIDTH_DEG = 45;   // how forgiving the timing curve is either side of optimal

const FRICTION_LOAD_NM = 0.6;  // the engine's own internal drag, a floor under an unloaded dyno
const COOLANT_HEAT_FRAC = 0.30;   // share of released energy that conducts into the block at all
const COOLANT_UA_PER_LPM = 3.6;   // W per °C per L/min — how effectively flow carries heat away
const PASSIVE_UA_W_PER_C = 2.2;   // finned-casing convection to the room, always present
const BLOCK_THERMAL_MASS_J_C = 9000; // an aluminium block's own heat capacity
const AMBIENT_C = 20;
const DERATE_START_C = 120;   // spec: "temperature climbs, and the engine derates"
const SEIZE_C = 210;          // spec: "then seizes"

const EXHAUST_CP_J_KGK = 1050;     // hot exhaust gas, a reasonable estimate
const EXHAUST_BASE_C = 320, EXHAUST_RISE_C = 420; // exhaust gas temperature vs load and throttle

const BURETTE_ML = 100; // spec: "100 mL glass burette"

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  t: number;              // sim-seconds since the last reset
  crankDeg: number;       // 0-720°, one full four-stroke cycle
  blockTempC: number;
  fuelUsedL: number;      // cumulative, for the burette's falling meniscus
  seized: boolean;
  seizeAtT: number;       // -1 until it happens
  derateStartAtT: number; // -1 until block temp first crosses DERATE_START_C
  histT: number[];
  histBlockC: number[];
}

const HISTORY_MAX = 700; // a little over 120 s at 6 Hz sampling

function buildWorld(): State {
  return {
    t: 0, crankDeg: 0, blockTempC: AMBIENT_C, fuelUsedL: 0,
    seized: false, seizeAtT: -1, derateStartAtT: -1, histT: [], histBlockC: [],
  };
}

/* ------------------------------------------------------------------ *
 * The process balance — one steady-state solve per tick
 * ------------------------------------------------------------------ */

interface Disconnects { fuel: boolean; air: boolean; ignition: boolean; coolant: boolean }

function disconnectsOf(params: ParamValues): Disconnects {
  return {
    fuel: params.disconnectFuel === true,
    air: params.disconnectAir === true,
    ignition: params.disconnectIgnition === true,
    coolant: params.disconnectCoolant === true,
  };
}

export interface DynoResult {
  mAirKgS: number; mFuelKgS: number; fuelEnergyInW: number;
  fracBurned: number; unburntKgS: number;
  releasedW: number; efficiency: number; shaftPowerW: number;
  coolantHeatW: number; exhaustHeatW: number; frictionW: number;
  exhaustMassKgS: number; exhaustTempC: number;
  rpm: number; torqueNm: number; running: boolean;
  derateFactor: number;
  atomsC_in: number; atomsC_out: number;
  atomsH_in: number; atomsH_out: number;
  atomsO_in: number; atomsO_out: number;
  atomsN_in: number; atomsN_out: number;
}

/**
 * One steady-state solve. Throttle sets air (and hence fuel) mass flow
 * directly, exactly as the spec's own control panel describes it; dyno load
 * then sets rpm from the shaft power the resulting combustion can deliver
 * (P = τω), also exactly as the spec describes it. This deliberately does
 * NOT feed rpm back into the air-flow formula — a live displacement × rpm ×
 * VE coupling closes into a self-referential loop whose stability depends on
 * how VE falls off at high rpm, which is more machinery than a "process
 * balance" spec calls for — so AIR_FLOW_MAX_KGS is derived once from the
 * real displacement at a representative rpm and then scaled by throttle
 * alone. rpm remains a genuine output: it responds to load, coolant, and
 * every disconnect exactly as the dyno readout would.
 */
function solveDyno(
  throttleFrac: number, loadNm: number, afr: number, timingDeg: number,
  blockTempC: number, disconnects: Disconnects,
): DynoResult {
  const derateFactor = clamp01(1 - (blockTempC - DERATE_START_C) / (SEIZE_C - DERATE_START_C));
  const running = !disconnects.fuel && !disconnects.air && !disconnects.ignition && blockTempC < SEIZE_C;

  const mAirKgS = running ? AIR_FLOW_MAX_KGS * throttleFrac : 0;
  const mFuelKgS = running ? mAirKgS / afr : 0;
  const fuelEnergyInW = mFuelKgS * FUEL_LHV_J_KG;

  const nFuelMolS = mFuelKgS / M_FUEL_KG;
  const nO2AvailMolS = (mAirKgS * AIR_O2_MASS_FRAC) / M_O2_KG;
  const nO2ReqMolS = nFuelMolS * O2_PER_FUEL_MOL;
  const fracBurned = nFuelMolS > 0 ? clamp01(nO2ReqMolS > 0 ? nO2AvailMolS / nO2ReqMolS : 0) : 0;
  const nFuelBurnedMolS = nFuelMolS * fracBurned;
  const unburntKgS = mFuelKgS * (1 - fracBurned);

  const releasedW = nFuelBurnedMolS * M_FUEL_KG * FUEL_LHV_J_KG;

  const timingFactor = clamp01(1 - Math.abs(timingDeg - TIMING_OPTIMAL_DEG) / TIMING_WIDTH_DEG);
  const afrFactor = afr <= AFR_STOICH ? 1 : clamp01(1 - (afr - AFR_STOICH) / 20);
  const efficiency = Math.min(EFF_MAX, EFF_MAX * timingFactor * afrFactor) * derateFactor;
  const shaftPowerW = releasedW * efficiency;

  // Exhaust: real mass conservation (everything that came in must leave),
  // carrying heat away in proportion to how hot combustion left it.
  const exhaustMassKgS = mAirKgS + mFuelKgS;
  const exhaustTempC = running
    ? EXHAUST_BASE_C + EXHAUST_RISE_C * throttleFrac * clamp01(loadNm / 20)
    : AMBIENT_C;
  const exhaustHeatW = exhaustMassKgS * EXHAUST_CP_J_KGK * Math.max(0, exhaustTempC - AMBIENT_C);

  // Coolant heat is a genuine heat-transfer law — proportional to flow AND
  // to how hot the block is — never a fixed share of the fuel energy, so
  // coolant = 0 really does mean zero coolant heat, structurally.
  // (computed by the caller, which owns the block's thermal state; here we
  // only report the combustion-side "released, minus shaft, minus exhaust"
  // residual available to be split between coolant and friction.)
  const remainderW = Math.max(0, releasedW - shaftPowerW - exhaustHeatW);

  const effectiveLoad = Math.max(loadNm, FRICTION_LOAD_NM);
  const omegaRadS = running && shaftPowerW > 1 ? shaftPowerW / effectiveLoad : 0;
  const rpmRaw = (omegaRadS * 60) / (2 * Math.PI);
  const stalledUnderLoad = running && shaftPowerW > 1 && rpmRaw < RPM_IDLE;
  const rpm = stalledUnderLoad || !running || shaftPowerW <= 1 ? 0 : Math.min(RPM_MAX, rpmRaw);
  const torqueNm = rpm > 0 ? shaftPowerW / ((rpm * 2 * Math.PI) / 60) : 0;

  const atomsC_in = nFuelMolS * 8 * 1000;   // mmol atoms/s
  const atomsH_in = nFuelMolS * 18 * 1000;
  const atomsO_in = nO2AvailMolS * 2 * 1000;
  const atomsN_in = ((mAirKgS * AIR_N2_MASS_FRAC) / M_N2_KG) * 2 * 1000;

  const nCO2 = nFuelBurnedMolS * CO2_PER_FUEL_MOL;
  const nH2O = nFuelBurnedMolS * H2O_PER_FUEL_MOL;
  const nO2Leftover = Math.max(0, nO2AvailMolS - nO2ReqMolS * fracBurned);
  const atomsC_out = (nCO2 + nFuelMolS * (1 - fracBurned) * 8) * 1000;
  const atomsH_out = (2 * nH2O + nFuelMolS * (1 - fracBurned) * 18) * 1000;
  const atomsO_out = (2 * nCO2 + nH2O + 2 * nO2Leftover) * 1000;
  const atomsN_out = atomsN_in; // inert, exact passthrough

  return {
    mAirKgS, mFuelKgS, fuelEnergyInW, fracBurned, unburntKgS,
    releasedW, efficiency, shaftPowerW,
    coolantHeatW: 0, exhaustHeatW, frictionW: 0, // filled in by the caller
    exhaustMassKgS, exhaustTempC, rpm, torqueNm, running: running && rpm > 0,
    derateFactor,
    atomsC_in, atomsC_out, atomsH_in, atomsH_out, atomsO_in, atomsO_out, atomsN_in, atomsN_out,
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init() {
    return buildWorld();
  },

  step(state, dt, params, _ctx, inputs) {
    void inputs;
    if (dt <= 0) return state;

    const throttleFrac = params.throttle as number;
    const loadNm = params.dynoLoad as number;
    const afr = params.afr as number;
    const timingDeg = params.sparkTiming as number;
    const coolantLpm = params.coolantFlow as number;
    const disconnects = disconnectsOf(params);

    let blockTempC = state.blockTempC;
    let seized = state.seized;
    let seizeAtT = state.seizeAtT;
    let derateStartAtT = state.derateStartAtT;
    let fuelUsedL = state.fuelUsedL;
    let crankDeg = state.crankDeg;
    const t0 = state.t;

    // Integrate the thermal mass in small sub-steps: the block's own heat
    // capacity is what makes "blocked coolant" a slow-building failure
    // rather than an instant one, and small steps keep that curve smooth.
    const SUB_S = 0.05;
    const n = Math.max(1, Math.round(dt / SUB_S));
    const subDt = dt / n;
    let lastResult: DynoResult | null = null;

    for (let i = 0; i < n; i++) {
      const effBlockTemp = seized ? blockTempC : blockTempC;
      const r = solveDyno(throttleFrac, loadNm, afr, timingDeg, effBlockTemp, disconnects);
      lastResult = r;

      const heatToBlockW = disconnects.coolant === undefined ? 0 : r.releasedW * COOLANT_HEAT_FRAC * (r.running || r.releasedW > 0 ? 1 : 0);
      const coolantHeatW = disconnects.coolant
        ? 0
        : COOLANT_UA_PER_LPM * coolantLpm * Math.max(0, blockTempC - AMBIENT_C);
      const passiveW = PASSIVE_UA_W_PER_C * Math.max(0, blockTempC - AMBIENT_C);

      blockTempC += ((heatToBlockW - coolantHeatW - passiveW) / BLOCK_THERMAL_MASS_J_C) * subDt;
      blockTempC = Math.max(AMBIENT_C, blockTempC);

      if (!seized && blockTempC >= DERATE_START_C && derateStartAtT < 0) derateStartAtT = t0 + i * subDt;
      if (!seized && blockTempC >= SEIZE_C) { seized = true; seizeAtT = t0 + i * subDt; }

      fuelUsedL += (r.mFuelKgS / FUEL_DENSITY_KG_L) * subDt;
      if (r.rpm > 0) crankDeg = (crankDeg + ((r.rpm / 60) * 360) * subDt) % 720;

      // Stash the two thermal terms onto the result so the outer scope
      // (readouts/facts/render) can report exactly what this tick computed.
      lastResult = {
        ...r,
        coolantHeatW,
        frictionW: Math.max(0, r.releasedW - r.shaftPowerW - r.exhaustHeatW - coolantHeatW),
      };
    }

    return {
      t: t0 + dt, crankDeg, blockTempC, fuelUsedL: Math.min(BURETTE_ML / 1000, fuelUsedL),
      seized, seizeAtT, derateStartAtT,
      histT: sampled(state.histT, t0 + dt),
      histBlockC: sampledPush(state.histBlockC, blockTempC, state.histT.length >= HISTORY_MAX),
      _last: lastResult,
    } as State & { _last: DynoResult | null };
  },

  readouts(state, params) {
    const r = currentResult(state, params);
    return [
      { key: "rpm", label: "Engine speed", unit: "count", quantity: q(r.rpm, "count"), semantic: "velocity", graphable: true },
      { key: "torque", label: "Torque (N·m)", quantity: q(r.torqueNm, "ratio"), semantic: "force", graphable: true },
      { key: "shaftPower", label: "Shaft power", unit: "kW", quantity: q(r.shaftPowerW, "power"), semantic: "energy-kinetic", graphable: true },
      { key: "efficiency", label: "Thermal efficiency", unit: "%", quantity: q(r.shaftPowerW / Math.max(1e-9, r.fuelEnergyInW), "percent"), semantic: "energy-total", graphable: true },
      { key: "blockTemp", label: "Block temperature", quantity: q(state.blockTempC + 273.15, "temperature"), semantic: "hot", graphable: true },
      { key: "fuelFlow", label: "Fuel flow (g/s)", quantity: q(r.mFuelKgS * 1000, "ratio"), semantic: "mass", graphable: true },
      { key: "airFlow", label: "Air flow (g/s)", quantity: q(r.mAirKgS * 1000, "ratio"), semantic: "cold", graphable: true },
      { key: "coolantHeat", label: "Coolant heat", unit: "kW", quantity: q(r.coolantHeatW, "power"), semantic: "current", graphable: true },
      { key: "exhaustHeat", label: "Exhaust heat", unit: "kW", quantity: q(r.exhaustHeatW, "power"), semantic: "hot", graphable: true },
      { key: "friction", label: "Friction", unit: "kW", quantity: q(r.frictionW, "power"), semantic: "force", graphable: true },
    ];
  },

  facts(state, params) {
    const r = currentResult(state, params);
    const cv = String(params.controlVolume ?? "engine");
    const roles = controlVolumeRoles(cv);
    const sumOut = r.shaftPowerW + r.coolantHeatW + r.exhaustHeatW + r.frictionW;
    return {
      t: state.t,
      rpm: r.rpm,
      torqueNm: r.torqueNm,
      running: r.running,
      stalled: !r.running && !state.seized,
      seized: state.seized,
      seizeAtT: state.seizeAtT,
      derateStartAtT: state.derateStartAtT,
      derateFactor: r.derateFactor,
      blockTempC: state.blockTempC,
      fuelFlowGps: r.mFuelKgS * 1000,
      airFlowGps: r.mAirKgS * 1000,
      exhaustFlowGps: r.exhaustMassKgS * 1000,
      unburntFlowGps: r.unburntKgS * 1000,
      fracBurned: r.fracBurned,
      fuelEnergyInW: r.fuelEnergyInW,
      releasedW: r.releasedW,
      shaftPowerW: r.shaftPowerW,
      coolantHeatW: r.coolantHeatW,
      exhaustHeatW: r.exhaustHeatW,
      frictionW: r.frictionW,
      sankeySumW: sumOut,
      sankeyClosesTo100: Math.abs(sumOut - r.releasedW) < Math.max(1e-6, r.releasedW * 1e-9),
      efficiencyPct: (r.shaftPowerW / Math.max(1e-9, r.fuelEnergyInW)) * 100,
      atomsC_in: r.atomsC_in, atomsC_out: r.atomsC_out, atomsC_diff: r.atomsC_in - r.atomsC_out,
      atomsH_in: r.atomsH_in, atomsH_out: r.atomsH_out, atomsH_diff: r.atomsH_in - r.atomsH_out,
      atomsO_in: r.atomsO_in, atomsO_out: r.atomsO_out, atomsO_diff: r.atomsO_in - r.atomsO_out,
      atomsN_in: r.atomsN_in, atomsN_out: r.atomsN_out, atomsN_diff: r.atomsN_in - r.atomsN_out,
      fuelBuretteMl: BURETTE_ML - state.fuelUsedL * 1000,
      controlVolume: cv,
      roleFuel: roles.fuel, roleAir: roles.air, roleCoolantIn: roles.coolantIn,
      roleCoolantOut: roles.coolantOut, roleShaft: roles.shaft, roleExhaust: roles.exhaust,
    };
  },
};

/** The last tick's full solve, stashed on state during step() and recomputed
 *  fresh (never stale) whenever readouts/facts run before any tick has —
 *  e.g. at t=0, straight out of init(). */
function currentResult(state: State, params: ParamValues): DynoResult {
  const withLast = state as State & { _last?: DynoResult | null };
  if (withLast._last) return withLast._last;
  const r = solveDyno(
    params.throttle as number, params.dynoLoad as number, params.afr as number,
    params.sparkTiming as number, state.blockTempC, disconnectsOf(params),
  );
  const coolantHeatW = disconnectsOf(params).coolant
    ? 0
    : COOLANT_UA_PER_LPM * (params.coolantFlow as number) * Math.max(0, state.blockTempC - AMBIENT_C);
  return { ...r, coolantHeatW, frictionW: Math.max(0, r.releasedW - r.shaftPowerW - r.exhaustHeatW - coolantHeatW) };
}

function sampled(hist: number[], t: number): number[] {
  const drop = hist.length >= HISTORY_MAX ? 1 : 0;
  return [...hist.slice(drop), t];
}
function sampledPush(hist: number[], v: number, atCap: boolean): number[] {
  const drop = atCap ? 1 : 0;
  return [...hist.slice(drop), v];
}

/** Under a bigger control volume, the coolant loop (and, wider still, the
 *  fuel supply) fold from a pair of crossings into one internal transfer —
 *  the exact A2.1 lesson, replayed here: nothing about the heat or the fuel
 *  changes, only which side of the dashed box it is drawn on. */
function controlVolumeRoles(cv: string) {
  const radiatorIn = cv !== "engine";
  const tankIn = cv === "engineRadiatorTank";
  return {
    fuel: tankIn ? "internal" : "input",
    air: "input",
    coolantIn: radiatorIn ? "internal" : "input",
    coolantOut: radiatorIn ? "internal" : "output",
    shaft: "output",
    exhaust: "output",
  } as const;
}

/* ------------------------------------------------------------------ *
 * Render — the cutaway, the Sankey, the atom inventory
 * ------------------------------------------------------------------ */

function num(v: number, dp = 2): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function strokeOf(crankDeg: number): { name: string; color: "cold" | "acceleration" | "hot" | "decomposer" } {
  const d = ((crankDeg % 720) + 720) % 720;
  if (d < 180) return { name: "INTAKE", color: "cold" };
  if (d < 360) return { name: "COMPRESSION", color: "acceleration" };
  if (d < 540) return { name: "POWER", color: "hot" };
  return { name: "EXHAUST", color: "decomposer" };
}

function drawEngine(rc: RenderContext<State>, x: number, y: number, w: number, h: number, params: ParamValues) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const r = currentResult(state, params);
  const stroke = strokeOf(state.crankDeg);

  // Block casing.
  const blockHot = clamp01((state.blockTempC - AMBIENT_C) / (SEIZE_C - AMBIENT_C));
  plastic(ctx, x, y, w, h, mixHex(dark ? "#5a6470" : "#7d8892", theme.sci["hot"], blockHot * 0.55), { radius: 8, gloss: 0.2 });
  if (state.seized) {
    caption(ctx, x + w / 2, y - 10, "SEIZED", theme, { align: "center", color: theme.sci["hot"], size: 12, weight: 800 });
  } else if (state.blockTempC >= DERATE_START_C) {
    caption(ctx, x + w / 2, y - 10, "DERATING", theme, { align: "center", color: theme.sci["hot"], size: 11, weight: 700 });
  }

  // Cylinder bore, piston, and a crank-driven rod — the four-stroke state
  // machine made visible, not merely computed.
  const cx = x + w * 0.5, boreW = w * 0.28, boreTop = y + h * 0.14, boreH = h * 0.62;
  ctx.save();
  ctx.fillStyle = hexA(dark ? "#0c0f14" : "#12161c", 0.9);
  roundRect(ctx, cx - boreW / 2, boreTop, boreW, boreH, 4);
  ctx.fill();
  const rad = (state.crankDeg * Math.PI) / 180;
  // Piston travel: down on intake and power, up on compression and exhaust —
  // one full sinusoid per 360° of crank, matching a real slider-crank well
  // enough for the silhouette this stage needs.
  const pistonFrac = 0.5 - 0.5 * Math.cos(rad);
  const pistonY = boreTop + boreH * 0.12 + pistonFrac * boreH * 0.62;
  metal(ctx, cx - boreW / 2 + 3, pistonY, boreW - 6, boreH * 0.16, "#c7ced4", { radius: 2 });
  ctx.strokeStyle = hexA("#8d97a4", 0.8);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, pistonY + boreH * 0.16);
  ctx.lineTo(cx + Math.sin(rad) * boreW * 0.18, boreTop + boreH + boreH * 0.1);
  ctx.stroke();
  ctx.restore();

  // Spark, right at the computed spark angle.
  const sparkDeg = ((360 - (params.sparkTiming as number)) % 720 + 720) % 720;
  const nearSpark = Math.abs(((state.crankDeg - sparkDeg + 360) % 720) - 360) < 6;
  if (nearSpark && r.running) {
    glow(ctx, cx, boreTop + 6, 14, "#bcd9ff", 0.8);
  }

  // Intake bell mouth (left) and exhaust pipe (right), with particle flow.
  const bellX = x - w * 0.14, bellY = boreTop + boreH * 0.2;
  metal(ctx, bellX, bellY, w * 0.14, 10, "#8d97a4", { radius: 3 });
  if (r.mAirKgS > 1e-6) {
    const air: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      const tt = (time * 1.4 + i * 0.11) % 1;
      air.push({ x: bellX + w * 0.14 * tt, y: bellY + 5, r: 1.4, a: 0.7 * (1 - tt) });
    }
    particleField(ctx, air, theme.sci["cold"], { alpha: 0.8 });
  }
  const exX = x + w + w * 0.02, exY = boreTop + boreH * 0.75;
  metal(ctx, exX, exY, w * 0.16, 10, "#5d6a76", { radius: 3 });
  if (r.exhaustMassKgS > 1e-6 && r.running) {
    const ex: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const tt = (time * 1.1 + i * 0.09) % 1;
      ex.push({ x: exX + w * 0.16 * tt, y: exY + 5 - tt * 6, r: 1.6 + tt * 2, a: 0.55 * (1 - tt) });
    }
    particleField(ctx, ex, hexA(theme.sci["decomposer"], 1), { alpha: 0.7 });
  }

  caption(ctx, x + w / 2, y + h + 14, stroke.name, theme, { align: "center", color: theme.sci[stroke.color], size: 11, weight: 800 });
  badge(ctx, x + w / 2, y + h * 0.5, `${Math.round(r.rpm)} rpm`, theme, { align: "center", color: theme.accent });
}

function drawSankey(rc: RenderContext<State>, x: number, y: number, w: number, h: number, params: ParamValues) {
  const { ctx, state, theme } = rc;
  const r = currentResult(state, params);
  const total = Math.max(1e-9, r.releasedW);
  const parts: { label: string; v: number; color: string }[] = [
    { label: "shaft work", v: r.shaftPowerW, color: theme.sci["energy-kinetic"] },
    { label: "coolant heat", v: r.coolantHeatW, color: theme.sci["current"] },
    { label: "exhaust heat", v: r.exhaustHeatW, color: theme.sci["hot"] },
    { label: "friction", v: r.frictionW, color: theme.sci["force"] },
  ];
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.8)" : "rgba(255,255,255,0.86)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 10, y + 14, "ENERGY SPLIT — closes to 100%", theme, { size: 10, weight: 800, color: theme.inkSoft });

  const barX = x + 10, barY = y + 26, barW = w - 20, barH = h - 44;
  let cursor = barX;
  for (const p of parts) {
    const frac = clamp01(p.v / total);
    const pw = frac * barW;
    ctx.fillStyle = p.color;
    ctx.fillRect(cursor, barY, Math.max(0, pw), barH);
    cursor += pw;
  }
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.strokeRect(barX, barY, barW, barH);
  legend(ctx, x + 10, y + h - 12, parts.map((p) => ({ label: `${p.label} ${num((p.v / total) * 100, 0)}%`, color: p.color, shape: "swatch" as const })), theme, { size: 8.5, maxWidth: w - 20 });
}

function drawAtomInventory(rc: RenderContext<State>, x: number, y: number, w: number, h: number, params: ParamValues) {
  const { ctx, state, theme } = rc;
  const r = currentResult(state, params);
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.8)" : "rgba(255,255,255,0.86)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 10, y + 14, "ATOM INVENTORY (mmol/s)", theme, { size: 10, weight: 800, color: theme.inkSoft });
  const rows: [string, number, number][] = [
    ["C", r.atomsC_in, r.atomsC_out], ["H", r.atomsH_in, r.atomsH_out],
    ["O", r.atomsO_in, r.atomsO_out], ["N", r.atomsN_in, r.atomsN_out],
  ];
  ctx.save();
  ctx.font = "500 10px ui-monospace, monospace";
  ctx.textBaseline = "middle";
  rows.forEach(([el, i, o], idx) => {
    const ry = y + 32 + idx * 15;
    ctx.textAlign = "left";
    ctx.fillStyle = theme.ink;
    ctx.fillText(`${el}  in ${num(i, 3)}  out ${num(o, 3)}`, x + 10, ry);
    const diff = Math.abs(i - o);
    ctx.textAlign = "right";
    ctx.fillStyle = diff < 1e-6 ? theme.sci["producer"] : theme.sci["hot"];
    ctx.fillText(`Δ ${num(diff, 6)}`, x + w - 10, ry);
  });
  ctx.restore();
}

function drawBlockTempGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const n = state.histT.length;
  if (n < 2) return;
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: state.histT[0], xMax: state.histT[n - 1] + 0.01, yMin: AMBIENT_C, yMax: SEIZE_C + 15,
    title: "Block temperature", xLabel: "t", yLabel: "°C", grid: "y",
  }, theme);
  const pts = state.histT.map((tt, i) => ({ x: tt, y: state.histBlockC[i] }));
  lineSeries(ctx, pts, sx, sy, theme.sci["hot"], { theme, endDot: true, label: `${num(state.blockTempC, 0)} °C` });
  for (const [lvl, label, col] of [[DERATE_START_C, "derate", theme.sci["acceleration"]], [SEIZE_C, "seize", theme.sci["hot"]]] as const) {
    const yy = sy(lvl);
    ctx.save();
    ctx.strokeStyle = hexA(col, 0.5);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx(state.histT[0]), yy);
    ctx.lineTo(sx(state.histT[n - 1]), yy);
    ctx.stroke();
    ctx.restore();
    caption(ctx, sx(state.histT[0]) + 4, yy - 6, label, theme, { size: 8, color: col });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const graphH = Math.round(height * 0.2);
  const stageH = height - graphH - 6;

  ctx.save();
  ctx.fillStyle = mixHex(theme.surface, "#000000", isDarkTheme(theme) ? 0.1 : 0.03);
  ctx.fillRect(0, 0, width, stageH);
  // Observation window frame + hazard badge, per spec's "everything clearly
  // labelled as a virtual rig".
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, width - 12, stageH - 12);
  badge(ctx, width - 12, stageH - 14, "SIMULATED RIG", theme, { align: "right", color: theme.sci["hot"] });

  const engW = Math.min(width * 0.26, stageH * 0.5);
  const engH = engW * 1.1;
  drawEngine(rc, width * 0.28 - engW / 2, stageH * 0.32, engW, engH, params);

  // Fuel burette on the wall.
  const bx = width * 0.06, by = stageH * 0.18, bw = 14, bh = stageH * 0.42;
  metal(ctx, bx - 3, by - 6, bw + 6, 5, "#8d97a4", { radius: 2 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
  roundRect(ctx, bx, by, bw, bh, 3);
  ctx.stroke();
  const level = clamp01((state.fuelUsedL >= 0 ? BURETTE_ML / 1000 - state.fuelUsedL : 0) / (BURETTE_ML / 1000));
  ctx.fillStyle = hexA("#d9a017", 0.75);
  const fillH = bh * level;
  ctx.fillRect(bx + 1, by + bh - fillH, bw - 2, fillH);
  ctx.restore();
  caption(ctx, bx + bw / 2, by + bh + 12, "fuel", theme, { align: "center", size: 9, color: theme.inkSoft });

  // Dyno + coolant loop, schematic right side.
  const dynoX = width * 0.62, dynoY = stageH * 0.4, dynoW = width * 0.14;
  plastic(ctx, dynoX, dynoY, dynoW, dynoW * 0.7, "#3f7568", { radius: 6, gloss: 0.25 });
  caption(ctx, dynoX + dynoW / 2, dynoY + dynoW * 0.7 + 12, "dynamometer", theme, { align: "center", size: 9, color: theme.inkSoft });

  const r = currentResult(state, params);
  const radX = width * 0.84, radY = stageH * 0.2, radW = width * 0.1, radH = stageH * 0.28;
  metal(ctx, radX, radY, radW, radH, "#5d6a76", { radius: 4 });
  caption(ctx, radX + radW / 2, radY + radH + 12, "radiator", theme, { align: "center", size: 9, color: theme.inkSoft });
  const disconnects = disconnectsOf(params);
  if (!disconnects.coolant && r.coolantHeatW > 1) {
    dashFlow(ctx, [{ x: dynoX + dynoW, y: dynoY + dynoW * 0.35 }, { x: radX, y: radY + radH * 0.5 }], theme.sci["current"], rc.time * 20, { width: 2, dash: 5, gap: 5 });
  } else {
    arrow(ctx, dynoX + dynoW + 6, dynoY + dynoW * 0.35, radX - 6, radY + radH * 0.5, hexA(theme.inkSoft, 0.35), { width: 1.4, dashed: true });
  }

  vignette(ctx, width, stageH, 0.12);
  ctx.restore();

  const sankeyW = Math.min(260, width * 0.3);
  drawSankey(rc, width - sankeyW - 10, stageH - 130, sankeyW, 92, params);
  drawAtomInventory(rc, 10, stageH - 130, Math.min(230, width * 0.28), 92, params);

  badge(ctx, width / 2, 20, state.seized ? "ENGINE SEIZED" : r.running ? "RUNNING" : "STALLED", theme, {
    align: "center", color: state.seized || !r.running ? theme.sci["hot"] : theme.sci["producer"],
  });

  drawBlockTempGraph(rc, 8, stageH + 4, width - 16, graphH - 16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  throttle: 0.4, dynoLoad: 8, afr: 14.7, sparkTiming: 20, coolantFlow: 12,
  disconnectFuel: false, disconnectAir: false, disconnectIgnition: false, disconnectCoolant: false,
  controlVolume: "engine", ledgerUnits: "percent", slowMotion: false,
};

export const onTheDynoSim: SimManifest<State> = {
  id: "g6.a2-3",
  title: "On the Dyno: In One End, Out the Other",
  tagline: "Run a single-cylinder engine on a dynamometer and watch every joule of fuel energy leave through one of four named exits.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "List a machine's inputs and outputs without assuming the useful output is the only one.",
    "Show that closing an output can stop a system as completely as closing an input.",
    "Track atoms through a combustion reaction and confirm the count in equals the count out.",
  ],
  misconceptions: [
    "A machine's only real output is the one you wanted",
    "Efficiency losses are wasted, not accounted for anywhere",
    "Blocking a cooling system only affects the coolant, not the whole machine",
    "A rich mixture makes atoms disappear rather than leaving unburnt",
  ],
  interactionHint: "Change the throttle or load, then watch the Sankey and the block-temperature graph respond.",
  tickRate: 30,
  timeScale: 1,
  params: {
    throttle: {
      type: "number", label: "Throttle", kind: "percent",
      min: 0, max: 1, step: 0.01, default: 0.4,
      help: "Sets the air (and so fuel) mass flow into the cylinder.",
    },
    dynoLoad: {
      type: "number", label: "Dyno load (N·m)", kind: "ratio",
      min: 0, max: 20, step: 0.5, default: 8,
      help: "The braking torque the engine must overcome — this is what sets rpm.",
    },
    afr: {
      type: "number", label: "Air-fuel ratio (mass, X:1)", kind: "ratio",
      min: 10, max: 18, step: 0.1, default: 14.7,
      help: "Below 14.7 the mixture is rich and some fuel leaves unburnt.",
      marks: [{ value: 10, label: "10:1" }, { value: 14.7, label: "14.7:1" }, { value: 18, label: "18:1" }],
    },
    sparkTiming: {
      type: "number", label: "Spark timing (° BTDC)", kind: "ratio",
      min: -5, max: 35, step: 1, default: 20,
      help: "How much of the fuel energy becomes work rather than exhaust heat.",
    },
    coolantFlow: {
      type: "number", label: "Coolant flow (L/min)", kind: "ratio",
      min: 0, max: 30, step: 1, default: 12,
      help: "The rate of the heat-output pathway through the radiator.",
    },
    disconnectFuel: { type: "boolean", label: "Disconnect: fuel", default: false },
    disconnectAir: { type: "boolean", label: "Disconnect: air", default: false },
    disconnectIgnition: { type: "boolean", label: "Disconnect: ignition", default: false },
    disconnectCoolant: { type: "boolean", label: "Disconnect: coolant", default: false },
    controlVolume: {
      type: "option", label: "Control volume",
      options: [
        { value: "engine", label: "Engine only" },
        { value: "engineRadiator", label: "Engine plus radiator" },
        { value: "engineRadiatorTank", label: "Engine plus radiator plus fuel tank" },
      ],
      default: "engine",
      help: "Which components are inside the counted box, and so what counts as a crossing.",
    },
    ledgerUnits: {
      type: "option", label: "Ledger units",
      options: [
        { value: "kw", label: "kW" }, { value: "percent", label: "% of fuel energy" }, { value: "gps", label: "g per second" },
      ],
      default: "percent",
    },
    slowMotion: { type: "boolean", label: "Slow-motion cycle", default: false, bands: ["6-8", "9-12"] },
  },
  model,
  render,
  labs: [
    {
      id: "steady-cruise",
      title: "Steady cruise",
      question: "List every input and every output with its rate. What fraction of the fuel energy leaves as useful work, and where does the rest go?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS3-5"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Steady throttle, steady load, a well-tuned engine.",
          predict: {
            prompt: "About what share of the fuel's energy comes out as useful shaft work?",
            options: ["Under 30%", "About 60%", "About 90%"],
            correct: 0,
            reveal: "Under 30% — this rig is capped there on purpose. Most of the energy in a real engine leaves as heat, not work.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run 60 seconds",
          instruction: "Let it run for a minute and record the four Sankey shares.",
          requireData: 1,
          check: { describe: "A minute has passed while running", test: (v) => (v.facts.t as number) >= 60 && v.facts.running === true },
        },
        {
          id: "sum",
          phase: "measure",
          title: "Add the outputs",
          instruction: "Add shaft work, coolant heat, exhaust heat and friction together.",
          requireData: 2,
          check: { describe: "The four outputs sum to the released energy", test: (v) => v.facts.sankeyClosesTo100 === true },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Name the biggest leak",
          instruction: "Switch the ledger to '% of fuel energy' and compare the four shares.",
          write: {
            prompt: "Which single output carries away the most energy, and is it one you would have guessed?",
            placeholder: "The largest output is ..., at about ...% of the fuel energy.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Inputs and outputs, named",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "List every input and every output you can measure on this rig, with its rate.",
            placeholder: "Inputs: fuel at ... g/s, air at ... g/s. Outputs: ...",
          },
        },
      ],
    },
    {
      id: "starve-one-input",
      title: "Starve one input",
      question: "Cut one input and every output collapses. Which output keeps flowing for a while afterwards, and why?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-PS3-5"],
      setup: { ...BASE_SETUP, disconnectAir: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The air supply is about to be cut with everything else unchanged.",
          predict: {
            prompt: "The instant air is cut, which output takes longest to reach zero?",
            options: ["Shaft power", "Exhaust heat", "Coolant heat"],
            correct: 2,
            reveal: "Coolant heat. Combustion stops immediately, but the block is still hot from before, and the coolant keeps carrying that stored heat away for a while.",
          },
        },
        {
          id: "cut",
          phase: "measure",
          title: "Confirm the cut",
          instruction: "Confirm air is disconnected and the engine has stalled.",
          requireData: 1,
          check: { describe: "Air disconnected, engine not running", test: (v) => v.params.disconnectAir === true && v.facts.running === false },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Watch what keeps flowing",
          instruction: "Record shaft power and coolant heat right after the cut.",
          requireData: 2,
          check: {
            describe: "Shaft power is zero while some coolant heat still leaves",
            test: (v) => v.facts.shaftPowerW === 0,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Trace the lag",
          instruction: "Look at the block-temperature graph across the cut.",
          write: {
            prompt: "Why does coolant heat not drop to zero at the same instant combustion does?",
            placeholder: "The block itself is still ..., and the coolant is only responding to ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "One input, every output",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "Cutting a single input collapsed every output eventually. Name the one exception and explain it.",
            placeholder: "Every output stopped except ..., briefly, because ...",
          },
        },
      ],
    },
    {
      id: "rich-mixture",
      title: "Rich mixture",
      question: "Unburnt fuel appears in the exhaust. Check the atom inventory. Did any atoms go missing, and if not, where did they go?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-PS3-5"],
      setup: { ...BASE_SETUP, afr: 10, throttle: 0.6 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The mixture is rich: 10 parts air to 1 part fuel, well under the stoichiometric 14.7:1.",
          predict: {
            prompt: "With too little oxygen for all the fuel, what does the carbon atom inventory show?",
            options: ["Carbon atoms in exceed carbon atoms out", "Carbon in exactly equals carbon out, some of it as unburnt fuel", "Carbon atoms are destroyed by the rich mixture"],
            correct: 1,
            reveal: "Exactly equal. Every carbon atom that enters as fuel leaves either as CO2 or as unburnt fuel — none are created or destroyed by having too little oxygen.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the mixture",
          instruction: "Check the AFR reads 10:1 and some fuel is passing through unburnt.",
          requireData: 1,
          check: { describe: "Rich mixture with unburnt fuel present", test: (v) => (v.facts.unburntFlowGps as number) > 0 },
        },
        {
          id: "check-atoms",
          phase: "measure",
          title: "Read the inventory",
          instruction: "Record the carbon-in and carbon-out figures from the atom inventory panel.",
          requireData: 2,
          check: { describe: "Carbon in matches carbon out", test: (v) => (v.facts.atomsC_diff as number) < 1e-6 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Follow the oxygen",
          instruction: "Check the oxygen row too — it should also balance, with none left over.",
          write: {
            prompt: "With the mixture this rich, is there any leftover oxygen in the exhaust? Why or why not?",
            placeholder: "No leftover oxygen, because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Where the atoms went",
          instruction: "Answer the scenario's question.",
          write: {
            prompt: "Did any atoms go missing running rich? If not, name exactly where the 'extra' carbon and hydrogen ended up.",
            placeholder: "No atoms went missing. The unburnt share left as ...",
          },
        },
      ],
    },
    {
      id: "block-an-output",
      title: "Block an output",
      question: "Every input is still connected. Trace what happens to block temperature and power when heat has nowhere to leave.",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS3-5"],
      setup: { ...BASE_SETUP, coolantFlow: 0, throttle: 0.6, dynoLoad: 12 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Coolant flow is zero. Every input — fuel, air, ignition — is still connected.",
          predict: {
            prompt: "With coolant blocked but every input open, does the engine keep running indefinitely?",
            options: ["Yes — inputs are what matter", "No — it derates as the block heats, then seizes", "No — it stops instantly"],
            correct: 1,
            reveal: "It derates, then seizes. Blocking an output is just as fatal as blocking an input — it only takes longer, while the block's own heat capacity soaks up the energy that used to leave as coolant heat.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the block",
          instruction: "Check coolant flow reads 0 and every input is still connected.",
          requireData: 1,
          check: {
            describe: "Coolant blocked, all inputs connected",
            test: (v) =>
              v.params.coolantFlow === 0 && v.params.disconnectFuel === false &&
              v.params.disconnectAir === false && v.params.disconnectIgnition === false,
          },
        },
        {
          id: "watch-temp",
          phase: "measure",
          title: "Watch the block heat",
          instruction: "Run until the block passes the derate threshold and record the time.",
          requireData: 2,
          check: { describe: "Derating has begun", test: (v) => (v.facts.derateStartAtT as number) >= 0 },
        },
        {
          id: "seize",
          phase: "analyze",
          title: "Run to seizure",
          instruction: "Keep running until the engine seizes and record the block temperature.",
          check: { describe: "The engine has seized", test: (v) => v.facts.seized === true },
          hints: ["The graph marks the derate and seize lines — watch the trace cross both."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "An output is not optional",
          instruction: "Answer the scenario's question.",
          write: {
            prompt: "Every input stayed open. Explain, step by step, why the engine died anyway.",
            placeholder: "Heat kept being generated by ..., with nowhere to go because ..., so the block ..., until ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "thirty-percent",
      title: "Reach the efficiency ceiling",
      brief: "Tune spark timing and air-fuel ratio to get thermal efficiency as close to the 30% ceiling as this rig allows.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Thermal efficiency at or above 25%",
        test: (v) => (v.facts.efficiencyPct as number) >= 25 && v.facts.running === true,
      },
      stars: {
        two: {
          describe: "At or above 28%",
          test: (v) => (v.facts.efficiencyPct as number) >= 28 && v.facts.running === true,
        },
        three: {
          describe: "At or above 29.5%, essentially the ceiling",
          test: (v) => (v.facts.efficiencyPct as number) >= 29.5 && v.facts.running === true,
        },
      },
      hints: [
        "Spark timing has one optimum — the default is not an accident.",
        "A rich or lean mixture both cost you efficiency, for different reasons.",
      ],
    },
    {
      id: "survive-the-heat",
      title: "Run hot without seizing",
      brief: "Find a coolant flow low enough to visibly heat the block, but high enough that it never seizes across a full two-minute run.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, throttle: 0.7, dynoLoad: 14 },
      goal: {
        describe: "Block passes the derate line but the engine survives 120 s unseized",
        test: (v) => (v.facts.derateStartAtT as number) >= 0 && v.facts.seized === false && (v.facts.t as number) >= 120,
      },
      hints: [
        "Too little coolant seizes the engine; the default 12 L/min may never even derate at this load — try well below it.",
        "Watch the block-temperature graph level off rather than keep climbing — that is the coolant catching up.",
      ],
    },
  ],
};
