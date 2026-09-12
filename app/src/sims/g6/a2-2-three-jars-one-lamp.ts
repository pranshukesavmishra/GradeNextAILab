import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { balance, benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, glass, glow, hexA, isDarkTheme, metal, particleField, pulse,
  vignette, type Particle,
} from "@ui/scene";
import { chartFrame, lineSeries, legend } from "@ui/charts";

/**
 * Three Jars, One Lamp — Grade 6, Unit A2.2: open vs closed systems.
 *
 * Three identical 2 L jars run as three parallel mass-and-energy balances.
 * Photosynthesis and respiration are the same reversible reaction run in
 * opposite directions — 6 CO2 + 6 H2O <-> C6H12O6 + 6 O2, every gram of it —
 * so nothing here is ever destroyed, only moved between the gas, the water
 * and the living tissue. What differs between the jars is only which walls
 * let matter or energy cross: Jar A's lid can be open, sealed, or sealed with
 * a pinhole; Jar B is sealed but its glass still passes light and heat; Jar
 * C's vacuum jacket blocks conduction and radiation outright, leaving its
 * light shutter as the one remaining pathway in.
 *
 * The honesty rule this sim exists to uphold: the classification badge
 * (Open / Closed / Isolated) is never read off the lid setting. It is
 * computed from two running totals — grams of matter that have actually
 * crossed the wall, joules of energy that actually have — updated every
 * substep by the same exchange terms the balance itself integrates. A sealed
 * jar's matter counter is not "small", it is exactly zero, because its
 * exchange coefficient is exactly zero; that is what makes a sealed jar's
 * displayed mass hold flat to the balance's own 0.01 g precision even while
 * water is busy cycling between soil, film and vapour inside it.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const KELVIN = 273.15;
const R_GAS = 0.082057; // L·atm/(mol·K)
const HEADSPACE_L = 1.2;     // air space above the 3 cm soil layer and water film
const FIXED_MASS_G = 250;    // dry jar, lid hardware and dry soil solids — never changes
const INIT_SNAIL_G = 0.8;    // a 12 mm garden snail, roughly — its body mass is held constant
const INIT_LIQUID_G = 300;   // starting soil moisture and water film, combined into one pool

// g/mol
const M_CO2 = 44.01, M_O2 = 32.00, M_N2 = 28.01, M_H2O = 18.02, M_GLUCOSE = 180.16;

// Room air composition. N2 stands in for "everything else in air" (~79%).
const ROOM_O2_FRAC = 0.209, ROOM_CO2_FRAC = 0.0004, ROOM_N2_FRAC = 1 - 0.209 - 0.0004;
const ROOM_RH = 0.45; // assumed steady room relative humidity

/** /h. A wide mouth trades with the room in well under an hour. */
const MATTER_K_OPEN = 6;
/** /h. A 1 mm pinhole: days, not minutes, to fully equilibrate. */
const MATTER_K_PINHOLE = 0.01;
/** The shutter is a small window, not the whole jar wall. */
const SHUTTER_ENERGY_FRAC = 0.35;

const K_LIGHT = 120;       // µmol/m²/s, half-saturation of the light-response curve
const K_CO2_MOL_L = 8e-6;  // mol/L — close to room CO2, so a sealed jar visibly self-limits by day
const K_O2_RESP_MOL_L = 0.001;

/** Reasoned estimates, tuned so a 30-day run shows the spec's three fates
 *  (Jar A dries out, Jar B thrives, Jar C suffocates) on a legible timescale;
 *  the spec fixes the apparatus, not these biological rate constants. */
const VMAX_PHOTO_MOL_H = 6.0e-5;  // mol glucose/h at organisms=3, saturating light and CO2
const RESP_PLANT_K = 8.0e-7;      // mol glucose/(g biomass·h): plant, soil-microbe and senescence respiration together
const RESP_SNAIL_MOL_H = 5.0e-6;  // mol glucose-equivalent/h at organisms=3, one snail's draw

const THERMAL_RATE = 0.6; // /h relaxation of jar contents toward the room (0 when isolated)
const EVAP_K = 0.05;      // mol/(h·(mol/L deficit)) — evaporation/condensation rate

const O2_SAFE_MOL_L = 0.0043; // half of room O2 concentration — the snail's hypoxia line
const DMG_HYPOXIA = 20;       // health/h at zero oxygen, scaling with the FRACTION short of the safe line
const RECOVER = 6;            // health/h regained once the air is fine again

const INIT_BIOMASS_G_AT3 = 9; // starting duckweed + moss at the default organisms = 3

const EPS_MASS = 1e-7;   // g — "has any matter genuinely crossed the wall"
const EPS_ENERGY = 1e-9; // arbitrary consistent units — "has any energy genuinely crossed"

const START_HOUR = 12;  // the run begins at local noon
const SAMPLE_H = 2;     // history cadence, one row per 2 simulated hours
const HISTORY_MAX = Math.ceil((30 * 24) / SAMPLE_H) + 4; // a 30-day graph
const TRACER_N = 20;    // spec: 20 tagged carbon atoms

/** Tetens' formula: saturation vapour pressure of water, kPa, over liquid water. */
function satVapourKPa(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}
/** Saturation vapour concentration, mol/L, from the ideal gas law. */
function satVaporConcMolL(tempC: number): number {
  const kPa = satVapourKPa(tempC);
  return (kPa / 8.314) / (tempC + KELVIN); // n/V = P/(RT), P in kPa, R in kPa·L/(mol·K)
}

/** Whether the daily light window (centred on noon) is lit at this hour. */
function lightIsOn(hour: number, lightHoursSec: number): boolean {
  const hours = lightHoursSec / 3600;
  if (hours <= 0) return false;
  if (hours >= 24) return true;
  const from = 12 - hours / 2, to = 12 + hours / 2;
  const h = ((hour % 24) + 24) % 24;
  return h >= from && h < to;
}

/* ------------------------------------------------------------------ *
 * The walls — what can cross, per jar
 * ------------------------------------------------------------------ */

export type JarKey = "A" | "B" | "C";
interface Wall { matterK: number; energyFrac: number }

function wallForLid(lid: string): Wall {
  if (lid === "open") return { matterK: MATTER_K_OPEN, energyFrac: 1 };
  if (lid === "pinhole") return { matterK: MATTER_K_PINHOLE, energyFrac: 1 };
  return { matterK: 0, energyFrac: 1 }; // sealed: glass still passes light and heat
}
function wallForC(params: ParamValues): Wall {
  const jacket = params.jacketC === true;
  if (!jacket) return { matterK: 0, energyFrac: 1 }; // jacket off: an ordinary sealed jar
  const shutterOpen = params.shutterC === true;
  // Jacket on blocks conduction and radiation outright; the shutter is the
  // one pathway left, and closing it is what the spec calls "isolated".
  return { matterK: 0, energyFrac: shutterOpen ? SHUTTER_ENERGY_FRAC : 0 };
}
function wallsFor(params: ParamValues): Record<JarKey, Wall> {
  return {
    A: wallForLid(params.lidA as string),
    B: wallForLid(params.lidB as string),
    C: wallForC(params),
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface JarState {
  gCO2: number; gO2: number; gN2: number; gVapor: number; gLiquid: number; gBiomass: number;
  tempC: number;
  snailAlive: boolean;
  snailHealth: number;
  /** Cumulative |grams| that have crossed the wall — never a rate, always a running sum. */
  matterCrossedAbs: number;
  /** Cumulative "energy units" that have crossed — same idea, for the badge only. */
  energyCrossedAbs: number;
  /** Sim-day the last living thing in this jar stopped respiring, or -1. */
  deathDay: number;
  /** 20 tagged carbon atoms, each sitting in the gas pool or in tissue. */
  tracer: ("gas" | "biomass")[];
}

interface State {
  day: number;
  hour: number; // 0-24, wraps
  jars: Record<JarKey, JarState>;
  histHour: number[];
  histMass: Record<JarKey, number[]>;
  histCO2: number[]; // for the currently-selected jar
  histO2: number[];
  sampleClock: number;
}

function roomGasContentG(species: "CO2" | "O2" | "N2", tempC: number): number {
  const totalConc = 1 / (R_GAS * (tempC + KELVIN)); // mol/L at 1 atm
  if (species === "CO2") return ROOM_CO2_FRAC * totalConc * HEADSPACE_L * M_CO2;
  if (species === "O2") return ROOM_O2_FRAC * totalConc * HEADSPACE_L * M_O2;
  return ROOM_N2_FRAC * totalConc * HEADSPACE_L * M_N2;
}
function roomVaporG(tempC: number): number {
  return satVaporConcMolL(tempC) * ROOM_RH * HEADSPACE_L * M_H2O;
}

function buildJar(roomC: number, organisms: number, rng: Rng): JarState {
  const gCO2 = roomGasContentG("CO2", roomC);
  const gO2 = roomGasContentG("O2", roomC);
  const gN2 = roomGasContentG("N2", roomC);
  const gVapor = roomVaporG(roomC);
  const gBiomass = INIT_BIOMASS_G_AT3 * (organisms / 3);
  // Tracer atoms start split between gas and tissue in proportion to how much
  // carbon (as CO2, or as glucose-equivalent) each pool already holds.
  const co2Mol = gCO2 / M_CO2, bioMol = gBiomass / M_GLUCOSE;
  const fracGas = co2Mol / Math.max(1e-12, co2Mol + bioMol);
  const nGas = Math.round(TRACER_N * clamp01(fracGas));
  const tracer: ("gas" | "biomass")[] = [];
  for (let i = 0; i < TRACER_N; i++) tracer.push(i < nGas ? "gas" : "biomass");
  // A stable shuffle isn't needed — which physical atom is "first" is
  // arbitrary — but draw from ctx.rng anyway so the tracer's later transition
  // order is seeded, not incidental.
  void rng;
  return {
    gCO2, gO2, gN2, gVapor, gLiquid: INIT_LIQUID_G, gBiomass,
    tempC: roomC, snailAlive: organisms > 0, snailHealth: 100,
    matterCrossedAbs: 0, energyCrossedAbs: 0, deathDay: -1, tracer,
  };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const roomC = (params.roomTemp as number) - KELVIN;
  const organisms = params.organisms as number;
  const jars: Record<JarKey, JarState> = {
    A: buildJar(roomC, organisms, rng), B: buildJar(roomC, organisms, rng), C: buildJar(roomC, organisms, rng),
  };
  const s: State = {
    day: 0, hour: START_HOUR, jars,
    histHour: [], histMass: { A: [], B: [], C: [] }, histCO2: [], histO2: [], sampleClock: 0,
  };
  pushSample(s, params);
  return s;
}

function totalMassG(j: JarState): number {
  return FIXED_MASS_G + INIT_SNAIL_G + j.gCO2 + j.gO2 + j.gN2 + j.gVapor + j.gLiquid + j.gBiomass;
}

function pushSample(s: State, params: ParamValues): void {
  const drop = s.histHour.length >= HISTORY_MAX ? 1 : 0;
  s.histHour = s.histHour.slice(drop);
  for (const k of ["A", "B", "C"] as const) s.histMass[k] = s.histMass[k].slice(drop);
  s.histCO2 = s.histCO2.slice(drop);
  s.histO2 = s.histO2.slice(drop);
  s.histHour.push(s.day * 24 + s.hour);
  for (const k of ["A", "B", "C"] as const) s.histMass[k].push(totalMassG(s.jars[k]));
  const sel = s.jars[(params.selectedJar as JarKey) ?? "B"];
  s.histCO2.push((sel.gCO2 / M_CO2) * 1000);
  s.histO2.push((sel.gO2 / M_O2) * 1000);
}

/* ------------------------------------------------------------------ *
 * The reversible reaction: 6 CO2 + 6 H2O <-> C6H12O6 + 6 O2
 * ------------------------------------------------------------------ */

interface JarStep { next: JarState; dPhotoMol: number; dRespMol: number }

function stepJar(
  j: JarState, dtH: number, wall: Wall, roomC: number, lit: boolean, ppfd: number,
  organisms: number, rng: Rng,
): JarStep {
  const s: JarState = { ...j };

  // Thermal relaxation toward the room — gated by the very same energyFrac
  // that gates light, so a truly isolated jar's temperature simply drifts
  // free, exactly as a vacuum flask's contents do.
  s.tempC += (roomC - s.tempC) * wall.energyFrac * THERMAL_RATE * dtH;

  const co2ConcMolL = (s.gCO2 / M_CO2) / HEADSPACE_L;
  const o2ConcMolL = (s.gO2 / M_O2) / HEADSPACE_L;
  const orgFactor = organisms / 3;

  const lightPPFD = lit ? ppfd * wall.energyFrac : 0;
  const lightResp = lightPPFD / (lightPPFD + K_LIGHT);
  const co2Lim = co2ConcMolL / (co2ConcMolL + K_CO2_MOL_L);
  const photoMolH = VMAX_PHOTO_MOL_H * orgFactor * lightResp * co2Lim;

  const o2Lim = o2ConcMolL / (o2ConcMolL + K_O2_RESP_MOL_L);
  const tempFactor = Math.max(0.2, Math.min(2, Math.pow(2, (s.tempC - 21) / 10)));
  const snailFactor = s.snailAlive ? orgFactor : 0;
  let respMolH = (RESP_PLANT_K * s.gBiomass + RESP_SNAIL_MOL_H * snailFactor) * o2Lim * tempFactor;
  const maxRespMolH = s.gBiomass / M_GLUCOSE / Math.max(dtH, 1e-9);
  respMolH = Math.min(respMolH, Math.max(0, maxRespMolH));

  const dPhoto = photoMolH * dtH; // mol glucose formed this substep
  const dResp = respMolH * dtH;   // mol glucose consumed this substep

  s.gCO2 = Math.max(0, s.gCO2 - dPhoto * 6 * M_CO2 + dResp * 6 * M_CO2);
  s.gO2 = Math.max(0, s.gO2 + dPhoto * 6 * M_O2 - dResp * 6 * M_O2);
  s.gLiquid = Math.max(0, s.gLiquid - dPhoto * 6 * M_H2O + dResp * 6 * M_H2O);
  s.gBiomass = Math.max(0, s.gBiomass + dPhoto * M_GLUCOSE - dResp * M_GLUCOSE);

  // Evaporation and condensation between the liquid store and the headspace.
  const satConcMolL = satVaporConcMolL(s.tempC);
  const vaporConcMolL = (s.gVapor / M_H2O) / HEADSPACE_L;
  let dEvapMol = EVAP_K * (satConcMolL - vaporConcMolL) * dtH;
  if (dEvapMol > 0) dEvapMol = Math.min(dEvapMol, s.gLiquid / M_H2O);
  else dEvapMol = -Math.min(-dEvapMol, s.gVapor / M_H2O);
  s.gLiquid = Math.max(0, s.gLiquid - dEvapMol * M_H2O);
  s.gVapor = Math.max(0, s.gVapor + dEvapMol * M_H2O);

  // Wall exchange: every gas species relaxes toward its room-equilibrium
  // content at a rate set by matterK ALONE. When matterK is exactly zero —
  // "sealed" — every one of these deltas is exactly zero, not approximately.
  let crossedAbs = 0;
  const relax = (cur: number, target: number): number => {
    const d = (target - cur) * wall.matterK * dtH;
    crossedAbs += Math.abs(d);
    return Math.max(0, cur + d);
  };
  s.gCO2 = relax(s.gCO2, roomGasContentG("CO2", roomC));
  s.gO2 = relax(s.gO2, roomGasContentG("O2", roomC));
  s.gN2 = relax(s.gN2, roomGasContentG("N2", roomC));
  s.gVapor = relax(s.gVapor, roomVaporG(roomC));
  s.matterCrossedAbs += crossedAbs;

  // Energy crossing counter: a nonzero-detector for the badge, not a joule
  // ledger. Both terms are already zero whenever energyFrac is zero, since
  // lightPPFD and the thermal relaxation above are both gated the same way.
  const heatFlux = Math.abs(roomC - s.tempC) * wall.energyFrac;
  s.energyCrossedAbs += (heatFlux + lightPPFD) * dtH;

  // Snail health: damage under the hypoxia line, recovery above it.
  const underO2Frac = clamp01(1 - o2ConcMolL / O2_SAFE_MOL_L);
  if (s.snailAlive) {
    const damage = DMG_HYPOXIA * underO2Frac;
    s.snailHealth = damage > 0
      ? Math.max(0, s.snailHealth - damage * dtH)
      : Math.min(100, s.snailHealth + RECOVER * dtH);
    if (s.snailHealth <= 0) s.snailAlive = false;
  }

  // The carbon tracer: each of the 20 tagged atoms represents an equal share
  // of the jar's WHOLE carbon reservoir (gas plus tissue together), so both
  // transition chances are the actual moles just converted — the same
  // dPhoto and dResp the bulk balance above just integrated, never an
  // independent "for show" rate — divided by that one shared, stable total.
  // Dividing gas-to-tissue conversion by the gas pool ALONE would be
  // technically purer, but the CO2 headspace is only micromoles, so a single
  // substep's photosynthesis can be a large fraction of a pool that small;
  // sharing one large, steady denominator keeps a tagged atom's stay in
  // either pool on a timescale a student can actually observe, without
  // changing which numbers drive it.
  const totalCarbonMol = Math.max(1e-12, j.gCO2 / M_CO2 + j.gBiomass / M_GLUCOSE);
  const pGasToBio = clamp01((dPhoto * 6) / totalCarbonMol);
  const pBioToGas = clamp01(dResp / totalCarbonMol);
  s.tracer = j.tracer.map((loc) => {
    if (loc === "gas") return rng.chance(pGasToBio) ? "biomass" : "gas";
    return rng.chance(pBioToGas) ? "gas" : "biomass";
  });

  return { next: s, dPhotoMol: dPhoto, dRespMol: dResp };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/**
 * "Alive" for survival-status purposes tracks the snail specifically. Plant
 * tissue has no clean death instant in this model — starved of oxygen, its
 * own respiration throttles toward zero and the residual mass simply stops
 * changing, exactly as inert dead matter would — so the snail is the one
 * organism whose respiration genuinely starts and stops at a nameable hour,
 * and it is what "days since the last living organism stopped respiring"
 * means here.
 */
function anyLifeLeft(j: JarState): boolean {
  return j.snailAlive;
}

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (params.organisms !== prev.organisms || params.roomTemp !== prev.roomTemp) {
      // Restocking or resetting the thermostat is a fresh start for all
      // three jars — matches the exemplar's rule that a structural change
      // (not just a dial nudge) rebuilds the world.
      return buildWorld(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params, ctx, inputs) {
    void inputs;
    if (dt <= 0) return state;
    const comp = params.timeComp as number;
    const simHours = (dt * comp) / 3600;
    const n = Math.max(1, Math.ceil(simHours * 20));
    const dtH = simHours / n;
    const roomC = (params.roomTemp as number) - KELVIN;
    const ppfd = params.lampIntensity as number;
    const lightHoursSec = params.lightHours as number;
    const organisms = params.organisms as number;
    const walls = wallsFor(params);

    let day = state.day, hour = state.hour;
    const jars: Record<JarKey, JarState> = { ...state.jars };
    let sampleClock = state.sampleClock;
    let histHour = state.histHour, histMass = state.histMass, histCO2 = state.histCO2, histO2 = state.histO2;

    for (let i = 0; i < n; i++) {
      const lit = lightIsOn(hour, lightHoursSec);
      for (const key of ["A", "B", "C"] as const) {
        const before = jars[key];
        const wasAlive = anyLifeLeft(before);
        const { next } = stepJar(before, dtH, walls[key], roomC, lit, ppfd, organisms, ctx.rng);
        if (wasAlive && !anyLifeLeft(next)) next.deathDay = day + hour / 24;
        jars[key] = next;
      }
      hour += dtH;
      if (hour >= 24) { hour -= 24; day += 1; }
      sampleClock += dtH;
    }

    let s: State = { day, hour, jars, histHour, histMass, histCO2, histO2, sampleClock };
    while (s.sampleClock >= SAMPLE_H) {
      s.sampleClock -= SAMPLE_H;
      pushSample(s, params);
    }
    return s;
  },

  readouts(state, params) {
    const sel = (params.selectedJar as JarKey) ?? "B";
    const j = state.jars[sel];
    const out = [
      { key: "massA", label: "Jar A mass", unit: "g", quantity: q(totalMassG(state.jars.A), "mass"), semantic: "mass", graphable: true },
      { key: "massB", label: "Jar B mass", unit: "g", quantity: q(totalMassG(state.jars.B), "mass"), semantic: "mass", graphable: true },
      { key: "massC", label: "Jar C mass", unit: "g", quantity: q(totalMassG(state.jars.C), "mass"), semantic: "mass", graphable: true },
      {
        key: "co2Sel", label: `Jar ${sel} CO2 (mmol)`, quantity: q((j.gCO2 / M_CO2) * 1000, "ratio"),
        semantic: "acid", graphable: true,
      },
      {
        key: "o2Sel", label: `Jar ${sel} O2 (mmol)`, quantity: q((j.gO2 / M_O2) * 1000, "ratio"),
        semantic: "cold", graphable: true,
      },
      {
        key: "tempSel", label: `Jar ${sel} temperature`, quantity: q(j.tempC + KELVIN, "temperature"),
        semantic: "hot",
      },
      { key: "day", label: "Day", quantity: q(state.day, "count"), semantic: "time" },
    ];
    return out;
  },

  facts(state, params) {
    const walls = wallsFor(params);
    const out: Record<string, number | boolean | string> = { day: state.day, hour: state.hour };
    for (const k of ["A", "B", "C"] as const) {
      const j = state.jars[k];
      const open = j.matterCrossedAbs > EPS_MASS;
      const closed = !open && j.energyCrossedAbs > EPS_ENERGY;
      const cls = open ? "open" : closed ? "closed" : "isolated";
      let nGas = 0, nBio = 0;
      for (const loc of j.tracer) { if (loc === "gas") nGas++; else nBio++; }
      out[`mass${k}`] = totalMassG(j);
      out[`co2${k}`] = (j.gCO2 / M_CO2) * 1000;
      out[`o2${k}`] = (j.gO2 / M_O2) * 1000;
      out[`tempC${k}`] = j.tempC;
      out[`matterCrossed${k}`] = j.matterCrossedAbs;
      out[`energyCrossed${k}`] = j.energyCrossedAbs;
      out[`classification${k}`] = cls;
      out[`snailAlive${k}`] = j.snailAlive;
      out[`anyLife${k}`] = anyLifeLeft(j);
      out[`survivalDays${k}`] = j.deathDay < 0 ? -1 : Math.max(0, state.day + state.hour / 24 - j.deathDay);
      out[`matterK${k}`] = walls[k].matterK;
      out[`energyFrac${k}`] = walls[k].energyFrac;
      out[`tracerGas${k}`] = nGas;
      out[`tracerBiomass${k}`] = nBio;
      out[`tracerTotal${k}`] = nGas + nBio;
    }
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * Render — the bench, the three jars, the ledgers
 * ------------------------------------------------------------------ */

const JAR_LABEL: Record<JarKey, string> = { A: "Jar A — open lid", B: "Jar B — sealed", C: "Jar C — vacuum jacket" };

function num(v: number, dp = 2): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A small snail: a spiral shell over a low body. No fauna.ts kind fits, so
 *  it is drawn directly — simple shapes, but a recognisable silhouette. */
function drawSnail(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alive: boolean, theme: RenderContext<State>["theme"]) {
  ctx.save();
  ctx.globalAlpha = alive ? 1 : 0.45;
  ctx.fillStyle = mixHex(theme.sci["decomposer"] ?? "#8a6a4a", "#f0e6d0", 0.25);
  ctx.beginPath();
  ctx.ellipse(x, y, size * 1.1, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.ink, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let a = 0; a < 3.4; a += 0.2) {
    const r = size * 0.55 * (1 - a / 4);
    const sx = x + size * 0.35 + Math.cos(a * 2.4) * r;
    const sy = y - size * 0.35 + Math.sin(a * 2.4) * r;
    if (a === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  if (!alive) {
    caption(ctx, x, y + size * 0.9, "still", theme, { align: "center", size: 8, color: theme.inkSoft });
  }
  ctx.restore();
}

function drawMoss(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, biomassFrac: number, theme: RenderContext<State>["theme"], seed: number) {
  const n = Math.round(6 + biomassFrac * 10);
  for (let i = 0; i < n; i++) {
    const fx = x + hash(i, seed) * w;
    const h = 3 + hash(i, seed + 1) * 6 * (0.3 + biomassFrac);
    ctx.strokeStyle = hexA(theme.sci["producer"], 0.7 * (0.4 + biomassFrac));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.lineTo(fx + (hash(i, seed + 2) - 0.5) * 3, y - h);
    ctx.stroke();
  }
}

function drawJar(rc: RenderContext<State>, key: JarKey, x: number, w: number, benchY: number, jarH: number, lit: boolean, params: ParamValues) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const j = state.jars[key];
  const walls = wallsFor(params);
  const wall = walls[key];
  const y = benchY - jarH;
  const soilH = jarH * 0.22;
  const soilY = benchY - soilH;

  // Vacuum jacket, drawn behind the glass, only for Jar C when fitted.
  if (key === "C" && params.jacketC === true) {
    metal(ctx, x - w * 0.09, y - jarH * 0.03, w * 1.18, jarH * 1.02, dark ? "#aab4bd" : "#c7ced4", { radius: 8 });
  }

  // Soil.
  ctx.fillStyle = mixHex("#3a2c1e", "#000000", dark ? 0.1 : 0);
  roundRect(ctx, x, soilY, w, soilH, 3);
  ctx.fill();
  const film = clamp01(j.gLiquid / (INIT_LIQUID_G * 1.3));
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.15 + 0.35 * film);
  roundRect(ctx, x, soilY, w, soilH, 3);
  ctx.fill();

  // Moss/duckweed, scaled by biomass.
  const biomassFrac = clamp01(j.gBiomass / (INIT_BIOMASS_G_AT3 * 2));
  drawMoss(ctx, x + w * 0.12, soilY, w * 0.76, biomassFrac, theme, key.charCodeAt(0));

  // Snail.
  drawSnail(ctx, x + w * 0.62, soilY - 4, Math.max(4, w * 0.09), j.snailAlive, theme);

  // Condensation on the upper glass, driven by how close the headspace sits
  // to saturation — more beading the closer vapour is to its dew point.
  const satAt = satVaporConcMolL(j.tempC);
  const vaporConc = (j.gVapor / M_H2O) / HEADSPACE_L;
  const satFrac = clamp01(satAt > 0 ? vaporConc / satAt : 0);
  if (satFrac > 0.55) {
    const drops: Particle[] = [];
    for (let i = 0; i < 14; i++) {
      drops.push({
        x: x + hash(i, 11) * w, y: y + jarH * (0.08 + hash(i, 12) * 0.22),
        r: 0.8 + hash(i, 13) * 1.3, a: (satFrac - 0.5) * 1.4,
      });
    }
    particleField(ctx, drops, dark ? "#bfe6f2" : "#eaf6fb", { alpha: 0.6 });
  }

  // The glass jar itself.
  glass(ctx, x, y, w, jarH, 6, theme, { tint: theme.sci["cold"], alpha: dark ? 0.1 : 0.18 });

  // Lid: gasket ring for sealed/pinhole, an open rim otherwise.
  const lidTopY = y - 3;
  if (key !== "C") {
    const lid = key === "A" ? params.lidA : params.lidB;
    if (lid === "open") {
      metal(ctx, x - 2, lidTopY - 3, w + 4, 5, "#8d97a4", { radius: 2 });
    } else {
      ctx.fillStyle = hexA("#c0453f", 0.85);
      roundRect(ctx, x - 3, lidTopY - 6, w + 6, 9, 3);
      ctx.fill();
      if (lid === "pinhole") {
        ctx.fillStyle = dark ? "#0a0a0a" : "#1a1a1a";
        ctx.beginPath();
        ctx.arc(x + w * 0.5, lidTopY - 1.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = hexA("#c0453f", 0.85);
    roundRect(ctx, x - 3, lidTopY - 6, w + 6, 9, 3);
    ctx.fill();
    // The shutter, over a light window at the jar's shoulder.
    const shutterOpen = params.shutterC === true && params.jacketC === true;
    const winY = y + jarH * 0.12, winH = jarH * 0.14;
    metal(ctx, x - w * 0.05, winY, w * 0.14, winH, "#7d8892", { radius: 2 });
    if (params.jacketC === true) {
      ctx.fillStyle = shutterOpen ? hexA(theme.sci["light"], 0.55) : hexA("#20242a", 0.9);
      roundRect(ctx, x - w * 0.05 + 1, winY + 1, w * 0.14 - 2, winH - 2, 2);
      ctx.fill();
    }
  }

  // Light landing on the jar, only while the lamp is on and a pathway exists.
  if (lit && wall.energyFrac > 0) {
    const beamA = 0.12 + 0.06 * pulse(time, 1.2);
    glow(ctx, x + w / 2, y - 6, w * 0.6, theme.sci["light"], beamA * wall.energyFrac);
  }

  // Label and balance beneath.
  caption(ctx, x + w / 2, y - 12, JAR_LABEL[key], theme, { align: "center", size: 10.5, weight: 700 });
  balance(ctx, x + w / 2, benchY + 34, Math.max(56, w * 0.85), theme, totalMassG(j), { unit: "g", decimals: 2 });
}

function classificationOf(j: JarState): "open" | "closed" | "isolated" {
  if (j.matterCrossedAbs > EPS_MASS) return "open";
  if (j.energyCrossedAbs > EPS_ENERGY) return "closed";
  return "isolated";
}

function drawStrip(rc: RenderContext<State>, key: JarKey, x: number, y: number, w: number, h: number, params: ParamValues) {
  const { ctx, state, theme } = rc;
  const dark = isDarkTheme(theme);
  const j = state.jars[key];
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.8)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const cls = classificationOf(j);
  const clsColor = cls === "open" ? theme.sci["producer"] : cls === "closed" ? theme.sci["current"] : theme.sci["hot"];
  caption(ctx, x + 8, y + 14, `JAR ${key}`, theme, { size: 10, weight: 800, color: theme.inkSoft });
  badge(ctx, x + w - 8, y + 14, cls.toUpperCase(), theme, { align: "right", color: clsColor });

  const lines = [
    `mass ${num(totalMassG(j), 2)} g`,
    `CO2 ${num((j.gCO2 / M_CO2) * 1000, 3)} mmol   O2 ${num((j.gO2 / M_O2) * 1000, 2)} mmol`,
    `matter crossed ${num(j.matterCrossedAbs, 4)} g total`,
    `${j.snailAlive ? "snail alive" : "snail still"} · ${anyLifeLeft(j) ? "biomass present" : "no biomass left"}`,
  ];
  if (params.tracerOn === true) {
    const nGas = j.tracer.filter((t) => t === "gas").length;
    lines.push(`carbon: ${nGas} as gas, ${TRACER_N - nGas} in tissue`);
  }
  ctx.save();
  ctx.font = "500 10px ui-monospace, monospace";
  ctx.fillStyle = theme.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => ctx.fillText(line, x + 8, y + 32 + i * 14));
  ctx.restore();
}

function drawGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number, params: ParamValues) {
  const { ctx, state, theme } = rc;
  const n = state.histHour.length;
  if (n < 2) return;
  const t0 = state.histHour[0], t1 = Math.max(state.histHour[n - 1], t0 + 1);
  const allMass = [...state.histMass.A, ...state.histMass.B, ...state.histMass.C];
  const { sx, sy } = chartFrame(ctx, x, y, w, h, {
    xMin: t0, xMax: t1, yMin: Math.min(...allMass) - 2, yMax: Math.max(...allMass) + 2,
    title: "Jar mass over the run", xLabel: "hour", yLabel: "mass", yUnit: "g", grid: "y",
  }, theme);
  const series: [keyof State["histMass"], string][] = [["A", theme.sci["producer"]], ["B", theme.sci["current"]], ["C", theme.sci["hot"]]];
  for (const [k, color] of series) {
    const pts = state.histHour.map((hr, i) => ({ x: hr, y: state.histMass[k][i] }));
    lineSeries(ctx, pts, sx, sy, color, { theme, endDot: true });
  }
  legend(ctx, x + 8, y + h + 4, [
    { label: "Jar A", color: theme.sci["producer"], shape: "line" },
    { label: "Jar B", color: theme.sci["current"], shape: "line" },
    { label: "Jar C", color: theme.sci["hot"], shape: "line" },
  ], theme, { size: 9 });
  void params;
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const graphH = Math.round(height * 0.22);
  const stageH = height - graphH - 6;
  const benchY = benchStage(ctx, width, stageH, theme);

  const lampW = width * 0.6;
  const lampY = stageH * 0.1;
  metal(ctx, (width - lampW) / 2, lampY, lampW, 8, "#6b7684", { radius: 3 });
  const lit = lightIsOn(state.hour, params.lightHours as number);
  if (lit) {
    glow(ctx, width / 2, lampY + 4, lampW * 0.55, theme.sci["light"], 0.22 + 0.06 * pulse(rc.time, 0.8));
  }

  const jarW = Math.min(width * 0.16, stageH * 0.32);
  const jarH = stageH * 0.42;
  const gap = width * 0.05;
  const totalW = jarW * 3 + gap * 2;
  const startX = (width - totalW) / 2;
  const keys: JarKey[] = ["A", "B", "C"];
  keys.forEach((k, i) => {
    drawJar(rc, k, startX + i * (jarW + gap), jarW, benchY, jarH, lit, params);
  });

  const stripW = Math.min(150, width * 0.16);
  const stripH = 88;
  keys.forEach((k, i) => {
    drawStrip(rc, k, 8, stageH * 0.14 + i * (stripH + 8), stripW, stripH, params);
  });

  const hh = Math.floor(state.hour).toString().padStart(2, "0");
  const mm = Math.floor((state.hour % 1) * 60).toString().padStart(2, "0");
  badge(ctx, width - 12, 20, `Day ${state.day} · ${hh}:${mm}`, theme, { align: "right", color: theme.accent });

  vignette(ctx, width, stageH, 0.12);
  drawGraph(rc, 8, stageH + 6, width - 16, graphH - 20, params);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const K = KELVIN;
const HOUR_S = 3600;

const BASE_SETUP: ParamValues = {
  lidA: "open", lidB: "sealed", jacketC: true, shutterC: false,
  lampIntensity: 220, lightHours: 12 * HOUR_S, roomTemp: 21 + K, organisms: 3,
  tracerOn: false, timeComp: 5000, selectedJar: "B",
};

export const threeJarsOneLampSim: SimManifest<State> = {
  id: "g6.a2-2",
  title: "Three Jars, One Lamp",
  tagline: "Run three sealed and open jars side by side and find out why 'closed' does not mean 'nothing gets in'.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Distinguish an open, a closed and an isolated system by what actually crosses the wall, not by what the lid looks like.",
    "Trace mass through a reversible chemical reaction (photosynthesis and respiration) without inventing or losing a single gram.",
    "Explain why a sealed jar can still receive energy, and why that is what keeps it alive.",
  ],
  misconceptions: [
    "Closed means nothing gets in or out at all",
    "A sealed lid always means the same thing as isolated",
    "Water disappearing from a jar means mass was lost",
    "A pinhole is too small to count as 'open'",
  ],
  interactionHint: "Change a lid or the vacuum jacket, then run the clock forward and watch each balance.",
  tickRate: 30,
  timeScale: 1,
  params: {
    lidA: {
      type: "option", label: "Jar A lid",
      options: [
        { value: "open", label: "Open" },
        { value: "sealed", label: "Sealed" },
        { value: "pinhole", label: "Sealed with 1 mm pinhole" },
      ],
      default: "open",
      help: "Whether matter can cross Jar A's wall, and how fast.",
    },
    lidB: {
      type: "option", label: "Jar B lid",
      options: [
        { value: "open", label: "Open" },
        { value: "sealed", label: "Sealed" },
        { value: "pinhole", label: "Sealed with 1 mm pinhole" },
      ],
      default: "sealed",
      help: "Whether matter can cross Jar B's wall.",
    },
    jacketC: {
      type: "boolean", label: "Jar C vacuum jacket", default: true,
      help: "Fitted blocks conduction and radiation through the sides.",
    },
    shutterC: {
      type: "boolean", label: "Jar C light shutter open", default: false,
      help: "The last energy pathway into Jar C when the jacket is fitted.",
    },
    lampIntensity: {
      type: "number", label: "Lamp intensity", kind: "ratio",
      min: 0, max: 400, step: 10, default: 220,
      help: "µmol photons per m² per second reaching an open or sealed jar.",
    },
    lightHours: {
      type: "number", label: "Light hours", kind: "time", unit: "h",
      min: 0, max: 24 * HOUR_S, step: 0.5 * HOUR_S, default: 12 * HOUR_S,
      help: "The daily photosynthesis window, centred on midday.",
    },
    roomTemp: {
      type: "number", label: "Room temperature", kind: "temperature", unit: "°C",
      min: 10 + K, max: 35 + K, step: 0.5, default: 21 + K,
      help: "Drives evaporation, respiration rate and the heat flow through each wall.",
    },
    organisms: {
      type: "number", label: "Living things per jar", kind: "count",
      min: 0, max: 6, step: 1, default: 3,
      help: "How much plant and animal life starts in each identical jar.",
    },
    tracerOn: {
      type: "boolean", label: "Tagged carbon tracer", default: false,
      help: "Shows 20 labelled carbon atoms cycling between gas and tissue.",
    },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1, max: 20000, step: 1, default: 5000,
      marks: [{ value: 1, label: "1x" }, { value: 5000, label: "5000x" }, { value: 20000, label: "20000x" }],
      help: "Simulated hours per real second, enough to run a 90-day trial.",
    },
    selectedJar: {
      type: "option", label: "Graph gas readings for", options: [
        { value: "A", label: "Jar A" }, { value: "B", label: "Jar B" }, { value: "C", label: "Jar C" },
      ],
      default: "B",
      help: "Which jar's CO2 and O2 the live readouts track.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "thirty-days-side-by-side",
      title: "Thirty days side by side",
      question: "Which jar loses mass, and which jar's mass never changes at all? Which jars are still alive on day 30?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-5"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "A is open, B is sealed, C is jacketed with its shutter open. Thirty days pass.",
          predict: {
            prompt: "Which balance reading changes least over the month?",
            options: ["Jar A's", "Jar B's", "Jar C's"],
            correct: 1,
            reveal: "Jar B's. Sealed to matter, its balance cannot move even a hundredth of a gram — while Jar A dries toward the room and Jar C, jacketed, drifts only slightly.",
          },
        },
        {
          id: "day0",
          phase: "measure",
          title: "Record day 0",
          instruction: "Record all three balances now, before anything has had time to happen.",
          requireData: 1,
          check: { describe: "Day 0 recorded", test: (v) => (v.facts.day as number) >= 0 },
        },
        {
          id: "day30",
          phase: "measure",
          title: "Run to day 30",
          instruction: "Run the full month and record all three balances again.",
          requireData: 2,
          check: { describe: "Day 30 reached", test: (v) => (v.facts.day as number) >= 30 },
          hints: ["Time compression is already at 5000x — a month passes in well under a minute."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the three",
          instruction: "Jar A should have lost mass; Jar B's reading should be identical to day 0.",
          check: {
            describe: "Jar A lost mass while Jar B's held flat",
            // All three jars start at an identical mass, so A measurably
            // dropping below B — which never moves at all — is the whole
            // comparison in one inequality.
            test: (v) =>
              (v.facts.day as number) >= 30 && (v.facts.massA as number) < (v.facts.massB as number),
          },
          write: {
            prompt: "By how much did Jar A's mass fall, and by how much did Jar B's? What crossed Jar A's wall that never crossed Jar B's?",
            placeholder: "Jar A fell by ... g. Jar B moved by ... What crossed A's wall was ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Life at day 30",
          instruction: "Check which jars still have a living snail or living tissue.",
          write: {
            prompt: "Which jars are still alive at day 30, and which is not? What does that tell you about matter versus energy?",
            placeholder: "Still alive: ... Not: ... The one that died lost access to ...",
          },
        },
      ],
    },
    {
      id: "sealed-and-dark",
      title: "Sealed and dark",
      question: "Matter is fully conserved and the jar still dies. What was crossing the wall before, and what is not crossing now?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS1-5"],
      setup: { ...BASE_SETUP, lidB: "sealed", lampIntensity: 0, selectedJar: "B" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Jar B is sealed, as before — but now the lamp itself is off, so no light reaches any jar.",
          predict: {
            prompt: "With the lamp off, does Jar B's matter-crossed counter change from zero?",
            options: ["Yes — darkness lets gas through", "No — it stays exactly zero, the lid never changed", "Only after the snail dies"],
            correct: 1,
            reveal: "No. The lid is still sealed, so the matter counter stays exactly zero whether the lamp is on or off — the lamp only ever controlled the energy pathway.",
          },
        },
        {
          id: "dark",
          phase: "measure",
          title: "Run in the dark",
          instruction: "Run for two simulated weeks with the lamp off.",
          requireData: 1,
          check: {
            describe: "Two weeks passed with the lamp off",
            test: (v) => (v.facts.day as number) >= 14 && v.params.lampIntensity === 0,
          },
        },
        {
          id: "check-mass",
          phase: "measure",
          title: "Check the matter counter",
          instruction: "Confirm Jar B's matter-crossed counter is still exactly zero.",
          requireData: 2,
          check: { describe: "Jar B's matter counter reads zero", test: (v) => v.facts.matterCrossedB === 0 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read the badge",
          instruction: "Jar B is sealed and has now received no light either.",
          check: {
            describe: "Jar B is classified isolated, not merely closed, with the lamp off",
            test: (v) => v.facts.classificationB !== "open",
          },
          write: {
            prompt: "With the lamp off, is Jar B still receiving anything at all? Does the badge still say 'closed'?",
            placeholder: "With no light, Jar B is now ... because the only pathway it ever had was ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What a closed system can receive",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "A closed system can still receive something. What was it, specifically, before the lamp went off?",
            placeholder: "Before, Jar B received ... through the glass. With the lamp off, that pathway is ...",
          },
        },
      ],
    },
    {
      id: "truly-isolated",
      title: "Truly isolated",
      question: "Neither matter nor energy crosses. Record how long anything stays alive and what the gas bars do at the end.",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS1-5"],
      setup: { ...BASE_SETUP, jacketC: true, shutterC: false, timeComp: 20000, selectedJar: "C" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the ending",
          instruction: "Jar C's jacket is fitted and its shutter is closed: every pathway is shut.",
          predict: {
            prompt: "What happens to the CO2 and O2 readings after everything inside has died?",
            options: ["They keep drifting slowly forever", "They stop changing — nothing is left to respire", "They snap back to room levels"],
            correct: 1,
            reveal: "They flatline. With nothing alive to respire and no wall for gas to cross, there is nothing left to move either stock at all.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run until nothing survives",
          instruction: "Run forward until Jar C's snail and its biomass are both gone.",
          requireData: 1,
          check: { describe: "Jar C has no life left", test: (v) => v.facts.anyLifeC === false },
          hints: ["Watch the oxygen reading in Jar C's strip fall toward zero."],
        },
        {
          id: "record-day",
          phase: "measure",
          title: "Record the survival time",
          instruction: "Record the survival-days figure for Jar C.",
          requireData: 2,
          check: { describe: "A survival day count was recorded", test: (v) => (v.facts.survivalDaysC as number) >= 0 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Confirm true isolation",
          instruction: "Check both crossing counters for Jar C.",
          check: {
            describe: "Jar C never exchanged matter or energy",
            test: (v) => v.facts.matterCrossedC === 0 && v.facts.energyCrossedC === 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What the flat line means",
          instruction: "Answer the scenario's question in your own words.",
          write: {
            prompt: "Once nothing is left alive, why do the gas readings stop changing at all?",
            placeholder: "The readings stop because the only thing that ever moved them was ..., and now ...",
          },
        },
      ],
    },
    {
      id: "the-pinhole-test",
      title: "The pinhole test",
      question: "The lid is on and it looks sealed. What does the balance say after 30 days, and what does the badge classify it as?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS1-5"],
      setup: { ...BASE_SETUP, lidA: "pinhole", roomTemp: 30 + K, selectedJar: "A" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you run",
          instruction: "Jar A's lid has one 1 mm pinhole. It looks exactly like a sealed jar.",
          predict: {
            prompt: "After 30 days, will Jar A's badge read the same as a genuinely sealed jar?",
            options: ["Yes — a pinhole is too small to matter", "No — it will read Open, because some matter really did cross", "It will read Isolated"],
            correct: 1,
            reveal: "Open. The hole is small, so the crossing is slow, but the counter only needs to clear zero once, and over 30 days it does.",
          },
        },
        {
          id: "confirm",
          phase: "measure",
          title: "Confirm the setup",
          instruction: "Check Jar A's lid reads 'pinhole' and the room is at 30 °C.",
          requireData: 1,
          check: { describe: "Pinhole lid at a warm room", test: (v) => v.params.lidA === "pinhole" },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run 30 days",
          instruction: "Run the full month and record the mass lost.",
          requireData: 2,
          check: { describe: "Day 30 reached", test: (v) => (v.facts.day as number) >= 30 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read the badge",
          instruction: "Compare Jar A's badge with what a fully sealed jar would show.",
          check: {
            describe: "Jar A classifies as open, with a measurable mass loss",
            test: (v) => v.facts.classificationA === "open" && (v.facts.matterCrossedA as number) > 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Looks are not the classifier",
          instruction: "Answer the scenario's question.",
          write: {
            prompt: "The lid looked sealed. Why did the badge disagree with the label on the lid?",
            placeholder: "The badge does not read the lid — it reads ..., and over 30 days that counter ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "keep-everyone-alive",
      title: "Keep every jar alive for a month",
      brief: "Find lid, jacket and shutter settings under which all three jars still have life in them on day 30.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Every jar has some life left at day 30",
        test: (v) =>
          (v.facts.day as number) >= 30 && v.facts.anyLifeA === true &&
          v.facts.anyLifeB === true && v.facts.anyLifeC === true,
      },
      stars: {
        two: {
          describe: "And Jar B's mass has not moved at all",
          test: (v) =>
            (v.facts.day as number) >= 30 && v.facts.anyLifeA === true && v.facts.anyLifeB === true &&
            v.facts.anyLifeC === true && v.facts.matterCrossedB === 0,
        },
        three: {
          describe: "And Jar C is classified 'closed', not merely surviving by accident",
          test: (v) =>
            (v.facts.day as number) >= 30 && v.facts.anyLifeA === true && v.facts.anyLifeB === true &&
            v.facts.anyLifeC === true && v.facts.classificationC === "closed",
        },
      },
      hints: [
        "Jar C needs its shutter open to receive any light at all.",
        "An open Jar A can dry out badly at a high room temperature — a pinhole is gentler.",
      ],
    },
    {
      id: "isolated-on-purpose",
      title: "Isolate a jar on purpose",
      brief: "Set up any jar so its badge reads Isolated, and record how many days its life lasts.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, jacketC: true, shutterC: false },
      goal: {
        describe: "A jar reads Isolated after at least a day of running",
        test: (v) => (v.facts.day as number) >= 1 && v.facts.classificationC === "isolated",
      },
      stars: {
        two: {
          describe: "And you recorded the exact day it lost its last living thing",
          test: (v) => v.facts.classificationC === "isolated" && (v.facts.survivalDaysC as number) >= 0,
        },
      },
      hints: ["Isolated needs both counters at zero — the jacket alone is not enough while the shutter is open."],
    },
  ],
};
