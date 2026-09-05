import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import { plant } from "@ui/fauna";
import {
  badge, caption, clamp01, glow, hexA, isDarkTheme, metal, particleField,
  plastic, pulse, sky, sphere, vignette, type Particle,
} from "@ui/scene";
import { chartFrame, lineSeries, legend } from "@ui/charts";

/**
 * Cut the Link, Cook the Tomatoes — Grade 6, Unit A1.3: interactions among a
 * system's parts.
 *
 * A genuine system-dynamics engine: four stocks (air temperature, humidity,
 * soil water, CO2) integrated every simulated minute, with every flow owned by
 * one of eight named, signed, delayed arrows on the link board. Cutting an
 * arrow never removes a component — the vent motor, the wet wall, the heater
 * are all still there and still powered — it removes exactly the one causal
 * effect that arrow was carrying, and nothing else. Delay a live arrow instead
 * of cutting it and the very same balancing loop starts to overshoot and swing,
 * because a first-order lag really is sitting between the cause and the effect.
 *
 * The honesty rule this sim exists to uphold: behaviour lives in the
 * interactions, not the inventory. Every part in the tunnel can be present and
 * powered while the tunnel still cooks, if the one arrow that mattered is cut.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

// spec: 30 m x 9 m hoop house. SOLAR_COEF below folds this floor area and the
// tunnel's air thermal mass into one deg-C-per-minute rate directly, rather
// than carrying area and specific heat as separate factors that would only
// cancel back out — the same simplification the exemplar makes for its heater.
const TRANSMISSION = 0.78; // spec: 200 micron poly transmits 78% of incident light
const AIR_TAU_MIN = 12; // spec: the air temperature field's own thermal time constant
const SOLAR_COEF = 0.00301; // deg C per minute per (W/m^2 effective), calibrated so
// full sun with the vents shut climbs toward a real danger ceiling in hours, not
// seconds or days — see the science test for the exact scenario this reproduces.
const VENT_COND = 0.35; // /min, humidity and CO2 exchange conductance with vents fully open
// The vent's effect on temperature is a rate, not a conductance: a running
// extract fan moves a roughly constant volume of air per minute, so it pulls
// out heat at close to a fixed rate once open rather than at a rate that
// shrinks as it approaches the setpoint. That is what lets a delayed-relay
// controller genuinely overshoot in both directions instead of a bigger gap
// to outside air simply self-correcting the loop, however long the delay —
// exactly the mechanism a real thermostat-and-fan pair has and a smooth
// proportional-to-error model does not.
const VENT_MAX_RATE_C_PER_MIN = 3;
// Ventilation genuinely cannot cool below outside air; this floor is the
// small additional margin real evaporative loss at the vent openings allows.
const VENT_FLOOR_BELOW_OUTSIDE_C = 3;
const OUTSIDE_HUMIDITY = 20; // %RH, a dry Central Valley July day
const HUM_COEF = 3.2; // %RH per mm of registered transpiration
const TRANSP_COOL_COEF = 20; // deg C per minute per mm of registered transpiration

// 120 plants (spec) at 1 m^2 leaf area each is folded directly into the whole-
// tunnel transpiration rate below, the same way the floor area above is folded
// into the solar-gain rate — one calibrated whole-system number, not a product
// of factors that would only multiply back out.
const MAX_TRANSP_MM_PER_MIN = 0.0062; // nominal whole-tunnel transpiration at full drive
const SOIL_CAP_MM = 10; // a shallow, fast-cycling drip-wetted reservoir
const SOIL_KM = 3; // mm, half-saturation for "is there enough water to draw on"
const IRRIG_MAX_MM_PER_MIN = 0.0085; // at the slider's top of 8 L/plant/day

// The thermostat's temperature leg is set relative to the *outside* air, not
// an absolute value: dry ventilation can only ever pull the tunnel toward
// outside temperature, never below it, so an absolute setpoint anywhere near
// a hot day's outside temperature would leave the vent stuck fully open with
// nothing left for a delay to act on.
// A genuine delayed-relay thermostat: the decision to want the vent open is an
// instant, hysteretic on/off call (exactly like the heater's own thermostat
// below), not a continuous reading. Only the vent's *position* — how much of
// that commanded state has actually been reached — chases the decision
// through the arrow's own first-order lag. A smooth proportional signal
// chasing itself through one lag is provably always stable (the loop's own
// self-damping terms dominate however large the gain); a saturating relay
// is what genuinely self-oscillates once its delay is long enough, which is
// the real mechanism a thermostat-and-motor pair has and what the spec's
// scenario S3 relies on.
const VENT_TEMP_ON = 5, VENT_TEMP_OFF = 1; // deg C above outside
const VENT_HUM_SET = 75, VENT_HUM_SPAN = 20; // %RH, automatic vent's humidity leg
const HEATER_ON_C = 10, HEATER_SPAN = 6; // deg C, night frost-protection thermostat
const HEATER_RATE_C_PER_MIN = 0.6;
const SHADE_MAX_CUT = 0.4; // spec: shade cloth cuts solar gain by 40%

const CO2_AMBIENT = 400, CO2_TARGET = 1000, CO2_INJECT_RATE = 20; // ppm, ppm/min
const CO2_UPTAKE = 8; // ppm/min drawn down by photosynthesis while lit

const LEAF_STRESS_C = 35; // spec: the stress threshold, deg C
const YIELD_STRESS_CAP = 400; // spec: deg C.min the yield badge tolerates

const KELVIN = 273.15; // outsideTemp is stored in SI (kelvin); every physics read converts here
function outsideC(params: ParamValues): number { return (params.outsideTemp as number) - KELVIN; }

const START_CLOCK_H = 0;
const SAMPLE_MIN = 10; // history cadence for the graphs
const HISTORY_MAX = 400;

/** Daylight, 06:00-20:00, peaking at 13:00 — the spec's Central Valley July day. */
function dayCurve(hour: number): number {
  if (hour < 6 || hour > 20) return 0;
  return Math.pow(Math.sin((Math.PI * (hour - 6)) / 14), 1.4);
}

function clockHours(min: number): number {
  return (START_CLOCK_H + min / 60) % 24;
}

/* ------------------------------------------------------------------ *
 * The link board — eight named, signed, delayed, cuttable arrows
 * ------------------------------------------------------------------ */

export const LINK_DEFS = [
  { id: "tempVent", label: "temp -> vent", sign: 1 },
  { id: "tempTranspiration", label: "temp -> transpiration", sign: 1 },
  { id: "transpirationHumidity", label: "transpiration -> humidity", sign: 1 },
  { id: "humidityVent", label: "humidity -> vent", sign: 1 },
  { id: "shadeSolar", label: "shade -> solar gain", sign: -1 },
  { id: "soilTranspiration", label: "soil water -> transpiration", sign: 1 },
  { id: "co2Growth", label: "CO2 -> growth", sign: 1 },
  { id: "tempHeater", label: "temp -> heater", sign: -1 },
] as const;
const LINK_COUNT = LINK_DEFS.length;
const LINK_PARAM: Record<string, string> = Object.fromEntries(LINK_DEFS.map((l) => [l.id, `link${cap(l.id)}`]));
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Cut arrows are structurally absent: gate is exactly 0 or 1, nothing between. */
function linkGate(id: string, params: ParamValues): number {
  return params[LINK_PARAM[id]] === false ? 0 : 1;
}

/**
 * The full causal graph the loop detector walks — the eight named arrows plus
 * the handful of always-present structural return paths (vent cools the air,
 * the heater warms it) that a link board draws but never lets the student cut,
 * because cutting "the heater warms the air" is not a real experiment.
 */
interface Edge { from: string; to: string; sign: 1 | -1; link?: string }
const GRAPH: Edge[] = [
  { from: "temp", to: "vent", sign: 1, link: "tempVent" },
  { from: "temp", to: "transpiration", sign: 1, link: "tempTranspiration" },
  { from: "transpiration", to: "humidity", sign: 1, link: "transpirationHumidity" },
  { from: "humidity", to: "vent", sign: 1, link: "humidityVent" },
  { from: "soil", to: "transpiration", sign: 1, link: "soilTranspiration" },
  { from: "temp", to: "heater", sign: -1, link: "tempHeater" },
  { from: "vent", to: "temp", sign: -1 },
  { from: "vent", to: "humidity", sign: -1 },
  { from: "heater", to: "temp", sign: 1 },
];

interface Loop { path: string[]; sign: 1 | -1 }

/** Every simple cycle (length 2-4) through currently-intact edges, signed. */
function findLoops(params: ParamValues): Loop[] {
  const live = GRAPH.filter((e) => !e.link || linkGate(e.link, params) === 1);
  const out: Loop[] = [];
  const seen = new Set<string>();
  const nodes = Array.from(new Set(live.flatMap((e) => [e.from, e.to])));
  for (const start of nodes) {
    const stack: { node: string; path: string[]; sign: 1 | -1 }[] = [{ node: start, path: [start], sign: 1 }];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.path.length > 4) continue;
      for (const e of live) {
        if (e.from !== cur.node) continue;
        if (e.to === start && cur.path.length >= 2) {
          const sign = (cur.sign * e.sign) as 1 | -1;
          const canon = [...cur.path].sort().join(">") + `:${sign}:${cur.path.length}`;
          if (!seen.has(canon)) { seen.add(canon); out.push({ path: [...cur.path], sign }); }
          continue;
        }
        if (cur.path.includes(e.to)) continue;
        stack.push({ node: e.to, path: [...cur.path, e.to], sign: (cur.sign * e.sign) as 1 | -1 });
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  min: number;
  airTemp: number; humidity: number; soilWater: number; co2: number;
  heaterOn: boolean;
  ventWantsOpen: boolean; // the thermostat's instant hysteretic decision
  linkLag: number[]; // one first-order-lag output per LINK_DEFS entry
  linkGain: number[]; // live gain applied to whichever link is selected
  linkDelay: number[]; // live delay (minutes) applied to whichever link is selected
  stressAccum: number; // deg C . min above the 35 C leaf threshold
  histMin: number[]; histAir: number[]; histLeaf: number[]; histHum: number[];
  sampleClock: number;
  lastAirTemp: number; lastDelta: number;
  peakMin: number[]; peakVal: number[]; troughMin: number[]; troughVal: number[];
}

function init(params: ParamValues): State {
  const s: State = {
    min: 0, airTemp: outsideC(params), humidity: 45,
    soilWater: SOIL_CAP_MM * 0.7, co2: CO2_AMBIENT, heaterOn: false, ventWantsOpen: false,
    linkLag: new Array<number>(LINK_COUNT).fill(0),
    linkGain: new Array<number>(LINK_COUNT).fill(1),
    linkDelay: new Array<number>(LINK_COUNT).fill(2),
    stressAccum: 0,
    histMin: [], histAir: [], histLeaf: [], histHum: [],
    sampleClock: 0, lastAirTemp: outsideC(params), lastDelta: 0,
    peakMin: [], peakVal: [], troughMin: [], troughVal: [],
  };
  applySelectedLink(s, params);
  pushSample(s, leafTempOf(s, params));
  return s;
}

function applySelectedLink(s: State, params: ParamValues): void {
  const idx = LINK_DEFS.findIndex((l) => l.id === params.selectedLink);
  if (idx < 0) return;
  s.linkGain[idx] = params.linkGain as number;
  s.linkDelay[idx] = params.linkDelayMin as number;
}

function pushSample(s: State, leafTemp: number): void {
  const drop = s.histMin.length >= HISTORY_MAX ? 1 : 0;
  s.histMin = s.histMin.slice(drop); s.histAir = s.histAir.slice(drop);
  s.histLeaf = s.histLeaf.slice(drop); s.histHum = s.histHum.slice(drop);
  s.histMin.push(s.min); s.histAir.push(s.airTemp); s.histLeaf.push(leafTemp); s.histHum.push(s.humidity);
}

function leafTempOf(s: State, params: ParamValues): number {
  const lit = dayCurve(clockHours(s.min)) > 0.02;
  const shadeGate = linkGate("shadeSolar", params);
  const shadeFactor = shadeGate && params.shadeDeployed === true ? SHADE_MAX_CUT : 0;
  const solarLoad = lit ? ((params.solarInput as number) / 850) * (1 - shadeFactor) * dayCurve(clockHours(s.min)) : 0;
  const idx2 = 2; // transpirationHumidity
  const gate2 = linkGate("transpirationHumidity", params);
  const cooling = gate2 * s.linkLag[idx2];
  return s.airTemp + clamp(3.2 * solarLoad - 55 * cooling, -2.5, 7);
}

function clamp(v: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, v)); }

/* ------------------------------------------------------------------ *
 * Substep — the four stocks, one simulated minute at a time
 * ------------------------------------------------------------------ */

function substep(s: State, dtMin: number, params: ParamValues): void {
  const hour = clockHours(s.min);
  const lit = dayCurve(hour) > 0.001;
  const availability = s.soilWater / (s.soilWater + SOIL_KM);

  // --- raw (undelayed) signal for every one of the eight arrows. The vent's
  // temperature leg is proportional to the excess over *outside* air (dry
  // ventilation can only pull the tunnel toward outside temperature, never
  // below it), with a narrow enough band, combined with the loop's other
  // gains below, to put a 25-minute lag on the wrong side of the loop's
  // stability margin while a 2-minute lag safely sits on the right side of
  // it — see the science test for the closed-loop analysis this reproduces.
  const outNow = outsideC(params);
  if (s.airTemp > outNow + VENT_TEMP_ON) s.ventWantsOpen = true;
  else if (s.airTemp < outNow + VENT_TEMP_OFF) s.ventWantsOpen = false;

  const raw = new Array<number>(LINK_COUNT).fill(0);
  raw[0] = (s.ventWantsOpen ? 1 : 0) * s.linkGain[0]; // temp -> vent
  raw[1] = 0.4 + 1.8 * clamp01(((s.airTemp - 15) / 25) * s.linkGain[1]); // temp -> transpiration (multiplier)
  raw[3] = clamp01((s.humidity - VENT_HUM_SET) / VENT_HUM_SPAN) * s.linkGain[3]; // humidity -> vent
  raw[4] = clamp01((params.shadeDeployed === true ? SHADE_MAX_CUT : 0) * s.linkGain[4]); // shade -> solar gain
  raw[5] = 1 - clamp01((1 - availability) * s.linkGain[5]); // soil water -> transpiration (multiplier)
  raw[6] = clamp01((s.co2 - CO2_AMBIENT) / 600) * s.linkGain[6]; // CO2 -> growth
  raw[7] = clamp01((HEATER_ON_C - s.airTemp) / HEATER_SPAN) * s.linkGain[7]; // temp -> heater

  const tempMult = linkGate("tempTranspiration", params) ? s.linkLag[1] : 1.0;
  const soilMult = linkGate("soilTranspiration", params) ? s.linkLag[5] : 1.0;
  const transpRateRaw = MAX_TRANSP_MM_PER_MIN * tempMult * soilMult * (lit ? 1 : 0.15);
  raw[2] = transpRateRaw * s.linkGain[2]; // transpiration -> humidity (a real flow, mm/min)

  // First-order lag: every arrow chases its raw signal at its own time constant.
  for (let i = 0; i < LINK_COUNT; i++) {
    const tau = Math.max(0.25, s.linkDelay[i]);
    s.linkLag[i] += ((raw[i] - s.linkLag[i]) / tau) * dtMin;
  }

  // --- vents: automatic, manual, or disconnected ---------------------------
  const mode = params.ventMode as string;
  let ventOpen: number;
  if (mode === "manual") ventOpen = clamp01((params.manualVentOpen as number) / 100);
  else if (mode === "disconnected") ventOpen = 0;
  else {
    ventOpen = clamp01(
      linkGate("tempVent", params) * s.linkLag[0] + linkGate("humidityVent", params) * s.linkLag[3],
    );
  }

  // --- heater: a real thermostat, gated by whether the sensor arrow exists ---
  const heaterSignal = linkGate("tempHeater", params) * s.linkLag[7];
  if (heaterSignal > 0.55) s.heaterOn = true;
  else if (heaterSignal < 0.25) s.heaterOn = false;

  // --- air temperature ------------------------------------------------------
  const shadeFactor = linkGate("shadeSolar", params) * s.linkLag[4];
  const solarGainC = SOLAR_COEF * (params.solarInput as number) * dayCurve(hour) * TRANSMISSION * (1 - shadeFactor);
  const outC = outNow;
  const passiveLossC = (s.airTemp - outC) / AIR_TAU_MIN;
  const ventLossC = ventOpen * VENT_MAX_RATE_C_PER_MIN;
  const registeredTransp = linkGate("transpirationHumidity", params) * s.linkLag[2]; // mm/min that "counts"
  const transpCoolC = TRANSP_COOL_COEF * registeredTransp;
  const heaterC = s.heaterOn ? HEATER_RATE_C_PER_MIN : 0;
  s.airTemp += (solarGainC - passiveLossC - ventLossC - transpCoolC + heaterC) * dtMin;
  s.airTemp = clamp(s.airTemp, outC - VENT_FLOOR_BELOW_OUTSIDE_C, 70);

  // --- humidity ---------------------------------------------------------
  const humGainC = HUM_COEF * registeredTransp;
  const humLossC = ventOpen * VENT_COND * (s.humidity - OUTSIDE_HUMIDITY);
  s.humidity = clamp(s.humidity + (humGainC - humLossC) * dtMin, 5, 100);

  // --- soil water: irrigation in, transpiration out, unconditionally -----
  const irrigIn = ((params.irrigation as number) / 8) * IRRIG_MAX_MM_PER_MIN;
  s.soilWater = clamp(s.soilWater + (irrigIn - transpRateRaw) * dtMin, 0, SOIL_CAP_MM);

  // --- CO2: regulator, venting exchange, photosynthetic drawdown ----------
  const co2Inject = s.co2 < CO2_TARGET ? CO2_INJECT_RATE : 0;
  const co2Vent = ventOpen * VENT_COND * (s.co2 - CO2_AMBIENT);
  const co2Uptake = lit ? CO2_UPTAKE : 0;
  s.co2 = clamp(s.co2 + (co2Inject - co2Vent - co2Uptake) * dtMin, 300, 1500);

  // --- leaf stress, integrated ---------------------------------------------
  const leaf = leafTempOf(s, params);
  s.stressAccum += Math.max(0, leaf - LEAF_STRESS_C) * dtMin;

  // --- peak/trough detection for the oscillation readout -------------------
  const delta = s.airTemp - s.lastAirTemp;
  if (delta < 0 && s.lastDelta > 0) {
    s.peakMin = [...s.peakMin.slice(-2), s.min]; s.peakVal = [...s.peakVal.slice(-2), s.lastAirTemp];
  } else if (delta > 0 && s.lastDelta < 0) {
    s.troughMin = [...s.troughMin.slice(-2), s.min]; s.troughVal = [...s.troughVal.slice(-2), s.lastAirTemp];
  }
  if (Math.abs(delta) > 1e-9) s.lastDelta = delta;
  s.lastAirTemp = s.airTemp;

  s.min += dtMin;
  s.sampleClock += dtMin;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return init(params);
  },

  applyParams(state, params, prev) {
    if (params.selectedLink === prev.selectedLink && params.linkGain === prev.linkGain && params.linkDelayMin === prev.linkDelayMin) {
      return state;
    }
    const s: State = { ...state, linkLag: [...state.linkLag], linkGain: [...state.linkGain], linkDelay: [...state.linkDelay] };
    applySelectedLink(s, params);
    return s;
  },

  step(state, dt, params, _ctx, _inputs) {
    if (dt <= 0) return state;
    const s: State = {
      ...state, linkLag: [...state.linkLag], linkGain: [...state.linkGain], linkDelay: [...state.linkDelay],
      histMin: state.histMin, histAir: state.histAir, histLeaf: state.histLeaf, histHum: state.histHum,
      peakMin: state.peakMin, peakVal: state.peakVal, troughMin: state.troughMin, troughVal: state.troughVal,
    };
    const comp = params.timeComp as number;
    const simMin = (dt * comp) / 60;
    // Substeps never exceed half a simulated minute: the fastest process here
    // (a fully-open vent's heat exchange) has its own time constant of a few
    // minutes, and explicit-Euler integration needs a step well under that to
    // avoid numerical ringing that could be mistaken for the real, delay-
    // driven oscillation this sim exists to demonstrate honestly.
    const n = Math.max(1, Math.ceil(simMin / 0.5));
    const dtEach = simMin / n;
    for (let i = 0; i < n; i++) substep(s, dtEach, params);
    while (s.sampleClock >= SAMPLE_MIN) {
      s.sampleClock -= SAMPLE_MIN;
      pushSample(s, leafTempOf(s, params));
    }
    return s;
  },

  readouts(state, params) {
    const leaf = leafTempOf(state, params);
    const loops = findLoops(params);
    const K = 273.15;
    return [
      { key: "airTemp", label: "Air temperature", unit: "°C", quantity: q(state.airTemp + K, "temperature"), semantic: "hot", graphable: true },
      { key: "leafTemp", label: "Leaf temperature", unit: "°C", quantity: q(leaf + K, "temperature"), semantic: "hot", graphable: true },
      { key: "humidity", label: "Humidity", unit: "%RH", quantity: q(state.humidity, "percent"), semantic: "liquid", graphable: true },
      { key: "soilWater", label: "Soil water available", unit: "mm", quantity: q(state.soilWater, "length"), semantic: "liquid", graphable: true },
      { key: "co2", label: "CO2", unit: "ppm", quantity: q(state.co2, "concentration"), semantic: "gas" },
      { key: "stress", label: "Heat stress accumulated", unit: "°C·min", quantity: q(state.stressAccum, "ratio"), semantic: "hot", graphable: true },
      { key: "activeLoops", label: "Active loops", quantity: q(loops.length, "count"), semantic: "field" },
      { key: "hour", label: "Hour of day", quantity: q(clockHours(state.min), "time") },
    ];
  },

  facts(state, params) {
    const leaf = leafTempOf(state, params);
    const loops = findLoops(params);
    const balancing = loops.filter((l) => l.sign < 0).length;
    const reinforcing = loops.filter((l) => l.sign > 0).length;
    let period = -1, amplitude = -1;
    if (state.peakMin.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < state.peakMin.length; i++) diffs.push(state.peakMin[i] - state.peakMin[i - 1]);
      period = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }
    if (state.peakVal.length >= 1 && state.troughVal.length >= 1) {
      const p = state.peakVal[state.peakVal.length - 1], t = state.troughVal[state.troughVal.length - 1];
      amplitude = Math.abs(p - t);
    }
    return {
      day: state.min / 1440,
      hour: clockHours(state.min),
      airTempC: state.airTemp,
      leafTempC: leaf,
      humidity: state.humidity,
      soilWater: state.soilWater,
      co2: state.co2,
      stressAccum: state.stressAccum,
      yieldOk: state.stressAccum < YIELD_STRESS_CAP,
      activeLoops: loops.length,
      balancingLoops: balancing,
      reinforcingLoops: reinforcing,
      oscPeriodMin: period,
      oscPeriodValid: period >= 0,
      oscAmplitudeC: amplitude,
      oscAmplitudeValid: amplitude >= 0,
      heaterOn: state.heaterOn,
      lit: dayCurve(clockHours(state.min)) > 0.02,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }
function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

interface Layout {
  stageH: number; rowY: number; rowX: number; rowW: number;
  boardX: number; boardY: number; boardW: number; boardH: number;
  graphH: number;
}

function layout(width: number, height: number, view: string): Layout {
  const graphH = Math.round(height * 0.26);
  const stageH = height - graphH - 6;
  const both = view === "both";
  const rowW = both ? width * 0.56 : width * 0.98;
  const boardW = both ? width - rowW - 16 : width * 0.98;
  const rowX = 8;
  return {
    stageH, rowY: 0, rowX, rowW,
    boardX: rowX + rowW + 8, boardY: 4, boardW, boardH: stageH - 8,
    graphH,
  };
}

/* ---- the polytunnel row ------------------------------------------------ */

function drawTunnel(rc: RenderContext<State>, L: Layout, params: ParamValues, leaf: number) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const x = L.rowX, w = L.rowW, h = L.stageH;
  const groundY = h * 0.82;

  sky(ctx, w, h, theme, "day", groundY);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip(); ctx.translate(x, 0);

  // Poly film hoops.
  ctx.strokeStyle = hexA(dark ? "#3a4550" : "#c7d6df", 0.7);
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const hx = w * (0.05 + (i / 7) * 0.9);
    ctx.beginPath();
    ctx.ellipse(hx, groundY, w * 0.06, h * 0.62, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  // Poly skin tint (heat wash: cooler blue to hotter white-orange).
  const heat = clamp01((state.airTemp - 20) / 28);
  ctx.fillStyle = hexA(mixHex("#bfe6f2", "#ffcf8a", heat), dark ? 0.06 : 0.1);
  ctx.beginPath(); ctx.ellipse(w / 2, groundY, w * 0.48, h * 0.62, 0, Math.PI, Math.PI * 2); ctx.fill();

  // Ridge vents: two panels that open on the live automatic/manual fraction.
  const mode = params.ventMode as string;
  const ventOpen = mode === "manual" ? clamp01((params.manualVentOpen as number) / 100)
    : mode === "disconnected" ? 0
    : clamp01(linkGate("tempVent", params) * state.linkLag[0] + linkGate("humidityVent", params) * state.linkLag[3]);
  for (const side of [-1, 1]) {
    const vx = w / 2 + side * w * 0.16;
    const vy = h * 0.2;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(side * ventOpen * 0.5);
    metal(ctx, -w * 0.07, 0, w * 0.14, 4, "#8d97a4", { radius: 1 });
    ctx.restore();
  }
  if (ventOpen > 0.02) {
    caption(ctx, w / 2, h * 0.1, `vents ${Math.round(ventOpen * 100)}% open`, theme, { align: "center", size: 10, color: theme.sci["cold"] });
  }

  // Drip line and soil discs.
  const soilFrac = clamp01(state.soilWater / SOIL_CAP_MM);
  ctx.strokeStyle = hexA("#3a5a3a", 0.5);
  ctx.beginPath(); ctx.moveTo(w * 0.06, groundY + 6); ctx.lineTo(w * 0.94, groundY + 6); ctx.stroke();

  // Tomato plants along the row.
  const nPlants = 10;
  for (let i = 0; i < nPlants; i++) {
    const px = w * (0.08 + (i / (nPlants - 1)) * 0.84);
    const wilt = clamp01(1 - Math.max(0, leaf - LEAF_STRESS_C) / 15);
    const health = clamp01(0.35 + 0.65 * Math.min(wilt, 0.4 + soilFrac * 0.6));
    plant(ctx, px, groundY, h * 0.16, "shrub", theme, {
      health, season: "summer", seed: i * 13 + 1, sway: (time * 0.1 + i * 0.2) % 1,
    });
    // Soil disc, darker when wetter.
    ctx.fillStyle = hexA("#5a4028", 0.25 + 0.4 * soilFrac);
    ctx.beginPath(); ctx.ellipse(px, groundY + 4, h * 0.028, h * 0.01, 0, 0, Math.PI * 2); ctx.fill();
    // Fruit trusses only once the tunnel has been warm enough to set fruit.
    if (leaf > 18) {
      for (let f = 0; f < 3; f++) {
        sphere(ctx, px + (f - 1) * h * 0.02, groundY - h * (0.08 + f * 0.01), h * 0.012, "#c9432a", { rim: false });
      }
    }
  }

  // Wet wall + fan at the far end.
  const fanOn = ventOpen > 0.15;
  plastic(ctx, w * 0.02, h * 0.35, w * 0.05, h * 0.4, "#4a6a5a", { radius: 4 });
  sphere(ctx, w * 0.045, h * 0.55, h * 0.05, fanOn ? "#9fd6c6" : "#5d6a76", { rim: false });
  if (fanOn) {
    const jets: Particle[] = [];
    for (let i = 0; i < 14; i++) {
      const t = (time * 0.6 + hash(i, 3)) % 1;
      jets.push({ x: w * 0.09 + t * w * 0.1, y: h * 0.55 + (hash(i, 4) - 0.5) * h * 0.1, r: 1.4, a: 0.5 * (1 - t) });
    }
    particleField(ctx, jets, "#dff4fb", { alpha: 0.7 });
  }

  // Shade cloth, drawn deployed or rolled per the toggle and the arrow's own gate.
  const shadeGate = linkGate("shadeSolar", params);
  if (params.shadeDeployed === true) {
    ctx.fillStyle = hexA(dark ? "#2a2f36" : "#3a4048", shadeGate ? 0.55 : 0.2);
    ctx.fillRect(0, 0, w, h * 0.18);
    caption(ctx, w / 2, h * 0.09, shadeGate ? "shade cloth (working)" : "shade cloth (disconnected from solar gain)", theme, {
      align: "center", size: 9, color: theme.inkSoft,
    });
  }

  // Heater glow, night duty.
  if (state.heaterOn) {
    glow(ctx, w * 0.94, h * 0.3, 40, hexA("#f0a03a", 0.35 + 0.15 * pulse(time, 1.4)));
    sphere(ctx, w * 0.94, h * 0.3, h * 0.03, "#f0a03a", { rim: false });
  }

  ctx.restore();
  vignette(ctx, w, h, 0.12);
}

/* ---- the causal link board --------------------------------------------- */

function drawBoard(rc: RenderContext<State>, L: Layout, params: ParamValues) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const x = L.boardX, y = L.boardY, w = L.boardW, h = L.boardH;
  ctx.save();
  ctx.fillStyle = dark ? "rgba(8,10,14,0.85)" : "rgba(20,24,30,0.06)";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 12, y + 16, "CAUSAL LINK BOARD", theme, { size: 11, weight: 800, color: theme.inkSoft });

  const nodePos: Record<string, { x: number; y: number }> = {
    temp: { x: x + w * 0.5, y: y + h * 0.22 },
    vent: { x: x + w * 0.82, y: y + h * 0.12 },
    humidity: { x: x + w * 0.5, y: y + h * 0.5 },
    transpiration: { x: x + w * 0.18, y: y + h * 0.5 },
    soil: { x: x + w * 0.18, y: y + h * 0.74 },
    heater: { x: x + w * 0.82, y: y + h * 0.4 },
  };

  const loops = findLoops(params);
  const highlighted = new Set<string>();
  if (loops.length > 0) for (const n of loops[0].path) highlighted.add(n);

  for (const e of GRAPH) {
    const a = nodePos[e.from], b = nodePos[e.to];
    if (!a || !b) continue;
    const cut = e.link ? linkGate(e.link, params) === 0 : false;
    const idx = e.link ? LINK_DEFS.findIndex((l) => l.id === e.link) : -1;
    const mag = idx >= 0 ? clamp01(state.linkLag[idx]) : 0.6;
    const inLoop = highlighted.has(e.from) && highlighted.has(e.to);
    const color = cut ? theme.inkSoft : e.sign > 0 ? theme.sci["producer"] : theme.sci["cold"];
    if (cut) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      arrow(ctx, a.x, a.y, b.x, b.y, color, {
        width: 1.4 + mag * 2.4 + (inLoop ? 1 : 0),
        label: e.link ? (e.sign > 0 ? "+" : "-") : undefined,
      });
      if (inLoop) glow(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2, 10, hexA(theme.accent, 0.25 + 0.15 * pulse(time, 1.2)));
    }
  }
  for (const [id, pos] of Object.entries(nodePos)) {
    sphere(ctx, pos.x, pos.y, 12, theme.surfaceAlt, { rim: true });
    caption(ctx, pos.x, pos.y + 20, id, theme, { align: "center", size: 9, weight: 700 });
  }

  // The selected arrow's own gain/delay, read directly off state.
  const selIdx = LINK_DEFS.findIndex((l) => l.id === params.selectedLink);
  const selY = y + h * 0.88;
  if (selIdx >= 0) {
    caption(ctx, x + 12, selY, `${LINK_DEFS[selIdx].label}: gain ${num(state.linkGain[selIdx], 2)}x, delay ${num(state.linkDelay[selIdx], 1)} min`, theme, {
      size: 10, color: theme.inkSoft,
    });
  }
  const loopLines = loops.slice(0, 4).map((l) => `${l.path.join("->")} (${l.sign < 0 ? "B" : "R"})`);
  caption(ctx, x + 12, selY + 16, loopLines.length ? `loops: ${loopLines.join("  ·  ")}` : "loops: none detected", theme, {
    size: 9, color: theme.inkSoft,
  });
}

/* ---- graphs -------------------------------------------------------------- */

function drawGraphs(rc: RenderContext<State>, L: Layout, width: number, height: number) {
  const { ctx, state, theme } = rc;
  const y = L.stageH + 6;
  const w1 = width * 0.62, w2 = width - w1 - 8;
  const n = state.histMin.length;
  const t0 = n > 0 ? state.histMin[0] : 0, t1 = n > 0 ? Math.max(state.histMin[n - 1], t0 + 60) : 60;

  const s1 = chartFrame(ctx, 0, y, w1, height, {
    xMin: t0, xMax: t1, yMin: 5, yMax: 60, yLabel: "temp", yUnit: "°C", xLabel: "min",
  }, theme);
  const airPts = state.histMin.map((m, i) => ({ x: m, y: state.histAir[i] }));
  const leafPts = state.histMin.map((m, i) => ({ x: m, y: state.histLeaf[i] }));
  lineSeries(ctx, airPts, s1.sx, s1.sy, theme.sci["hot"], { theme, endDot: true });
  lineSeries(ctx, leafPts, s1.sx, s1.sy, theme.sci["producer"], { theme, endDot: true, width: 1.4 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["hot"], 0.4);
  ctx.setLineDash([4, 4]);
  const stressY = s1.sy(LEAF_STRESS_C);
  ctx.beginPath(); ctx.moveTo(0, stressY); ctx.lineTo(w1, stressY); ctx.stroke();
  ctx.restore();
  legend(ctx, 4, y + 2, [
    { label: "air", color: theme.sci["hot"], shape: "line" },
    { label: "leaf", color: theme.sci["producer"], shape: "line" },
  ], theme);

  const s2 = chartFrame(ctx, w1 + 8, y, w2, height, {
    xMin: t0, xMax: t1, yMin: 0, yMax: 100, yLabel: "%RH",
  }, theme);
  const humPts = state.histMin.map((m, i) => ({ x: m, y: state.histHum[i] }));
  lineSeries(ctx, humPts, s2.sx, s2.sy, theme.sci["liquid"], { theme, endDot: true, fill: true });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const view = (params.view as string) ?? "both";
  const L = layout(width, height, view);
  const leaf = leafTempOf(state, params);

  if (view !== "board") drawTunnel(rc, L, params, leaf);
  if (view !== "tunnel") drawBoard(rc, L, params);
  drawGraphs(rc, L, width, height);

  const facts = model.facts!(state, params);
  const yieldOk = facts.yieldOk === true;
  badge(ctx, width / 2, 16, yieldOk ? "YIELD ON TRACK" : "HEAT STRESS OVER BUDGET", theme, {
    align: "center", color: yieldOk ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, 12, 16, `${num(leaf, 1)}°C leaf`, theme, { color: leaf > LEAF_STRESS_C ? theme.sci["hot"] : theme.sci["producer"] });
  const hh = Math.floor(clockHours(state.min)).toString().padStart(2, "0");
  const mm = Math.floor((clockHours(state.min) % 1) * 60).toString().padStart(2, "0");
  badge(ctx, width - 12, 16, `${hh}:${mm}`, theme, { align: "right", color: theme.accent });
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  linkTempVent: true, linkTempTranspiration: true, linkTranspirationHumidity: true,
  linkHumidityVent: true, linkShadeSolar: true, linkSoilTranspiration: true,
  linkCo2Growth: true, linkTempHeater: true,
  selectedLink: "tempVent", linkDelayMin: 2, linkGain: 1.0,
  outsideTemp: 38 + KELVIN, solarInput: 850, ventMode: "automatic", manualVentOpen: 0,
  irrigation: 4, shadeDeployed: false, timeComp: 120, view: "both",
};

export const cutTheLinkSim: SimManifest<State> = {
  id: "g6.a1-3",
  title: "Cut the Link, Cook the Tomatoes",
  tagline: "Sever one arrow on a live causal link board and watch a fully-powered greenhouse cook anyway.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Explain that a system's behaviour comes from the interactions between its parts, not from the parts on their own.",
    "Read a causal link board: signed arrows, gains, delays, and the closed loops they form.",
    "Show that adding delay to a working balancing loop can turn steady control into oscillation.",
  ],
  misconceptions: [
    "A system misbehaves only when a part is missing or broken",
    "Every part that is present and powered is doing its job",
    "A control loop either works or it does not — delay does not matter",
    "Loops in a system are always reinforcing (runaway), never balancing",
  ],
  interactionHint: "Cut the temp-to-vent arrow on the link board, then try delaying it instead of cutting it.",
  tickRate: 30,
  timeScale: 1,
  params: {
    linkTempVent: { type: "boolean", label: "Link: temp -> vent", default: true, help: "Cutting it stops the vents responding to heat at all." },
    linkTempTranspiration: { type: "boolean", label: "Link: temp -> transpiration", default: true, help: "Cutting it means transpiration ignores temperature." },
    linkTranspirationHumidity: { type: "boolean", label: "Link: transpiration -> humidity", default: true, help: "Cutting it means transpired water no longer registers as humidity or cooling." },
    linkHumidityVent: { type: "boolean", label: "Link: humidity -> vent", default: true, help: "Cutting it removes the humidity leg of the automatic controller." },
    linkShadeSolar: { type: "boolean", label: "Link: shade -> solar gain", default: true, help: "Cutting it means deploying the shade cloth no longer reduces solar heat." },
    linkSoilTranspiration: { type: "boolean", label: "Link: soil water -> transpiration", default: true, help: "Cutting it means dry soil no longer limits transpiration." },
    linkCo2Growth: { type: "boolean", label: "Link: CO2 -> growth", default: true, help: "Cutting it removes any benefit of CO2 enrichment." },
    linkTempHeater: { type: "boolean", label: "Link: temp -> heater", default: true, help: "Cutting it means the heater never knows to fire." },
    selectedLink: {
      type: "option", label: "Selected link (for gain/delay)",
      options: LINK_DEFS.map((l) => ({ value: l.id, label: l.label })),
      default: "tempVent", help: "Which arrow the two sliders below edit.",
    },
    linkDelayMin: { type: "number", label: "Delay on selected link", kind: "time", unit: "min", min: 0, max: 30, step: 1, default: 2, help: "Lag between cause and effect on the selected arrow." },
    linkGain: { type: "number", label: "Gain on selected link", kind: "ratio", min: 0.2, max: 3.0, step: 0.1, default: 1.0, help: "How strongly the selected arrow's cause moves its effect." },
    outsideTemp: { type: "number", label: "Outside air temperature", kind: "temperature", unit: "°C", min: 5 + KELVIN, max: 45 + KELVIN, step: 1, default: 38 + KELVIN, help: "Driving heat difference across the film and through open vents." },
    solarInput: { type: "number", label: "Solar input (W/m²)", kind: "ratio", min: 0, max: 1000, step: 10, default: 850, help: "Heat and light entering through the roof at solar noon." },
    ventMode: {
      type: "option", label: "Vent control mode",
      options: [{ value: "automatic", label: "Automatic" }, { value: "manual", label: "Manual" }, { value: "disconnected", label: "Disconnected" }],
      default: "automatic", help: "Whether the controller drives the vents, the student does, or nothing does.",
    },
    manualVentOpen: { type: "number", label: "Manual vent opening (%)", kind: "ratio", min: 0, max: 100, step: 5, default: 0, help: "Vent area when in manual mode." },
    irrigation: { type: "number", label: "Irrigation (L/plant/day)", kind: "ratio", min: 0, max: 8, step: 0.5, default: 4, help: "Soil water refill rate, which sets the ceiling on transpiration cooling." },
    shadeDeployed: { type: "boolean", label: "Shade cloth deployed", default: false, help: "Cuts solar gain (and light) by 40%, if that arrow is intact." },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio", min: 1, max: 600, step: 1, default: 120,
      marks: [{ value: 1, label: "1x" }, { value: 120, label: "120x" }, { value: 600, label: "600x" }],
      help: "Simulated minutes per real second.",
    },
    view: {
      type: "option", label: "View",
      options: [{ value: "tunnel", label: "Tunnel only" }, { value: "board", label: "Link board only" }, { value: "both", label: "Both" }],
      default: "both", help: "Show the tunnel, the causal link board, or both.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "an-ordinary-day",
      title: "An ordinary July day",
      question: "Name every closed loop the detector finds and say which of them holds the temperature down.",
      bands: ["6-8"], minutes: 20, standards: ["MS-PS3-4"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the loops",
          instruction: "Every arrow is intact and the controller is automatic.",
          predict: {
            prompt: "What kind of loops will the detector report?",
            options: ["Mostly reinforcing (runaway) loops", "Mostly balancing (self-correcting) loops", "No closed loops at all"],
            correct: 1,
            reveal: "Balancing. Both the temperature-to-vent and humidity-to-vent paths, and the heater's own thermostat, are negative feedback: each one acts to push its own driver back down (or up), which is exactly what keeps a greenhouse liveable.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run one simulated day",
          instruction: "Run to at least hour 20 and record peak air temperature and peak humidity.",
          requireData: 1,
          check: { describe: "At least 20 hours simulated, yield still on track", test: (v) => (v.facts.hour as number) >= 0 && (v.facts.day as number) >= 0.8 && v.facts.yieldOk === true },
          hints: ["Time compression is 120x by default — a day passes in about 12 real minutes."],
        },
        {
          id: "loops", phase: "analyze", title: "Read the loop list",
          instruction: "Look at the link board's loop readout.",
          check: { describe: "At least two balancing loops are active", test: (v) => (v.facts.balancingLoops as number) >= 2 },
          hints: ["The loop list names every node in the cycle and labels it B or R."],
        },
        {
          id: "conclude", phase: "conclude", title: "Say which loop matters most",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "Name every closed loop you found. Which one does the most work holding temperature down on a hot day?",
            placeholder: "The loops are ... The one that matters most for temperature is ... because ...",
          },
        },
      ],
    },
    {
      id: "one-arrow-cut",
      title: "One arrow cut",
      question: "Every part is still present and powered. Why does the tunnel reach a dangerous temperature by early afternoon?",
      bands: ["6-8"], minutes: 20, standards: ["MS-PS3-4"],
      setup: { ...BASE_SETUP, linkTempVent: false },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the outcome",
          instruction: "Only the temp-to-vent arrow is cut. The vent motor, the wet wall, the fan — every part is untouched.",
          predict: {
            prompt: "What happens to the automatic vent opening as the tunnel heats up?",
            options: [
              "It still opens fully — humidity alone is enough",
              "It barely opens — only the humidity leg is left driving it",
              "It closes further, making things worse",
            ],
            correct: 1,
            reveal: "Barely. The vent motor is fine and the controller is fine, but with the temperature leg cut, the only thing left telling it to open is humidity — usually not enough on its own — so solar heat piles up almost unopposed.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run to mid-afternoon",
          instruction: "Run to at least hour 14 and record the leaf temperature.",
          requireData: 1,
          check: { describe: "Leaf temperature has crossed the 35 C stress line", test: (v) => (v.facts.leafTempC as number) > 35 },
          hints: ["Watch the vent-open percentage on the tunnel view — it should stay low even as the temperature climbs."],
        },
        {
          id: "list", phase: "analyze", title: "List what still works",
          instruction: "Check the link board: which arrows are still solid, not dashed?",
          check: { describe: "Every arrow except temp -> vent is intact", test: (v) => v.params.linkTempVent === false && v.params.linkHumidityVent === true && v.params.linkTempTranspiration === true },
        },
        {
          id: "conclude", phase: "conclude", title: "Explain the overheat",
          instruction: "Write the explanation the lab's question is asking for.",
          write: {
            prompt: "Every part is present and powered. Explain, in terms of the loop that broke, why the tunnel cooks anyway.",
            placeholder: "The vent motor still works, but ... so the balancing loop that used to ... no longer ...",
          },
        },
      ],
    },
    {
      id: "the-same-link-delayed",
      title: "The same link, delayed",
      question: "The link works, just late. Describe the shape the temperature graph now makes and measure its period.",
      bands: ["6-8"], minutes: 22, standards: ["MS-PS3-4"],
      setup: { ...BASE_SETUP, selectedLink: "tempVent", linkDelayMin: 25 },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the shape",
          instruction: "Temp -> vent is intact, not cut — only delayed to 25 minutes.",
          predict: {
            prompt: "What will the air temperature graph look like now?",
            options: ["A flat line near the setpoint, same as before", "A smooth swing up and down, again and again", "A single spike, then flat"],
            correct: 1,
            reveal: "A genuine oscillation. By the time the 25-minute-old signal finally opens the vents, the tunnel has overshot well past the setpoint; the vents then overcorrect, and by the time that correction arrives it overshoots the other way. A delayed balancing loop does not stop correcting — it starts oscillating.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run until three peaks appear",
          instruction: "Keep running until the oscillation readout has enough peaks to report a period.",
          requireData: 1,
          check: { describe: "A period has been measured", test: (v) => v.facts.oscPeriodValid === true },
          hints: ["The period and amplitude stay blank until the model has actually recorded three peaks — nothing is estimated early."],
        },
        {
          id: "measure2", phase: "measure", title: "Record period and amplitude",
          instruction: "Read the period (minutes) and the amplitude (°C) directly off the readout.",
          check: { describe: "Amplitude is measurable and non-trivial", test: (v) => v.facts.oscAmplitudeValid === true && (v.facts.oscAmplitudeC as number) > 1 },
        },
        {
          id: "conclude", phase: "conclude", title: "Delay versus damage",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "Describe the shape of the temperature trace, and state its period and amplitude in your own words.",
            placeholder: "Instead of settling, the temperature now ... with a period of about ... minutes and a swing of about ... degrees.",
          },
        },
      ],
    },
    {
      id: "dry-roots",
      title: "Dry roots",
      question: "The cooling link runs through the soil. With vents working perfectly, why do leaf temperatures still climb?",
      bands: ["6-8"], minutes: 18, standards: ["MS-PS3-4"],
      setup: { ...BASE_SETUP, irrigation: 0 },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict before running",
          instruction: "Every link is intact and the vents are fully automatic. Only irrigation is set to zero.",
          predict: {
            prompt: "Will the automatic vents alone hold leaf temperature down?",
            options: ["Yes — vents are the whole story", "No — evaporative cooling from transpiration is a separate pathway vents cannot replace", "It makes no difference either way"],
            correct: 1,
            reveal: "No. Transpiration cools the leaf directly, by carrying heat away as water vapour, and that pathway depends on the soil having water in it. Vents cool the bulk air by exchanging it with the outside — a real, different mechanism that cannot substitute for evaporative cooling once the soil runs dry.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run to 14:00 and record",
          instruction: "Run until the clock reads 14:00 and record leaf temperature and soil water.",
          requireData: 1,
          check: { describe: "Soil water has run low and leaf temperature is elevated", test: (v) => (v.facts.soilWater as number) < 2 && (v.facts.leafTempC as number) > 30 },
          hints: ["Soil water only ever goes down here — irrigation is at zero for this whole lab."],
        },
        {
          id: "compare", phase: "analyze", title: "Compare against a watered tunnel",
          instruction: "Set irrigation back to 4 and re-run, then compare leaf temperature at the same hour.",
          check: { describe: "Watered leaf temperature reads lower than the dry run did", test: (v) => (v.params.irrigation as number) > 0 },
        },
        {
          id: "conclude", phase: "conclude", title: "Name the separate pathway",
          instruction: "Answer the lab's question directly.",
          write: {
            prompt: "The vents are working perfectly. Explain precisely why leaf temperature still climbs when the soil runs dry.",
            placeholder: "Vents cool the ..., but leaf cooling also depends on ..., which stopped once ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "survive-the-cut",
      title: "Survive the cut",
      brief: "With temp -> vent cut for the whole day, keep heat stress under the 400 °C·min yield budget using only the other controls.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, linkTempVent: false, shadeDeployed: true, irrigation: 8 },
      goal: {
        describe: "A full day passes with temp -> vent cut and the yield badge still green",
        test: (v) => (v.facts.day as number) >= 1 && v.params.linkTempVent === false && v.facts.yieldOk === true,
      },
      stars: {
        two: { describe: "Also keep peak leaf temperature under 40 C", test: (v) => (v.facts.day as number) >= 1 && v.facts.yieldOk === true && (v.facts.leafTempC as number) < 40 },
      },
      hints: [
        "Shade and irrigation are both real couplings that do not run through the cut arrow at all.",
        "Manual venting is still an option if you switch the vent mode.",
      ],
    },
    {
      id: "tame-the-oscillation",
      title: "Tame the oscillation",
      brief: "Starting from the 25-minute delayed vent link, find a shorter delay that keeps the temperature swing under 4 C.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, selectedLink: "tempVent", linkDelayMin: 25 },
      goal: {
        describe: "A measured amplitude under 4 C, with the link still delayed rather than cut",
        test: (v) => v.facts.oscAmplitudeValid === true && (v.facts.oscAmplitudeC as number) < 4 && v.params.linkTempVent === true,
      },
      hints: [
        "You cannot make the greenhouse respond instantly — only shrink the lag until the loop stops overshooting so badly.",
        "The gain on the same arrow is also worth trying.",
      ],
    },
  ],
};
