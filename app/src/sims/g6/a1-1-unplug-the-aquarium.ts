import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { benchStage, ropeStroke } from "@ui/labware";
import { creature, plant } from "@ui/fauna";
import { specimenJar } from "@ui/organic";
import {
  badge, caption, clamp01, dashFlow, glass, glow, hexA,
  isDarkTheme, metal, particleField, plastic, pulse, softShadow, sphere,
  vignette, type Particle,
} from "@ui/scene";

/**
 * Unplug the Aquarium — Grade 6, Unit A1.1: what makes a system a system.
 *
 * A 60-litre classroom tank run by a genuine stock-and-flow engine: ammonia,
 * nitrite, nitrate, oxygen, heat, bacteria, plant biomass and per-fish health,
 * every one driven by rate laws and never by script. Fish excrete what they
 * are fed, bacteria in the filter convert it at k·B·S/(S+Km), plants draw the
 * end product down in light, and the pump is the coupling that makes all of it
 * one thing. Pull its plug and nothing is faked: flow through the media stops,
 * the colony starves, ammonia climbs past 0.25 mg/L, the still surface lets
 * oxygen sag under 4 mg/L, and each fish fails for a cause the model can name.
 *
 * The honesty rule this sim exists to uphold: the filter is never a magic
 * life-support box. Every death is traceable along the chain, and in the
 * loose-parts scenario every coupling coefficient is genuinely zero — the
 * identical parts sit in the tray doing nothing, which is the whole lesson.
 * Parts alone are a heap; parts that do something to each other are a system.
 *
 * Internally the clock runs in simulated minutes. The stock-and-flow engine
 * integrates in substeps never longer than one simulated minute, whatever the
 * time-compression dial says, so the chemistry is identical at 1x and 5000x.
 */

/* ------------------------------------------------------------------ *
 * World constants — per-hour biological and physical rates
 * ------------------------------------------------------------------ */

const VOLUME_L = 60;
const ROOM_C = 19;             // the classroom the tank leaks heat into
const THERMAL_TAU_H = 4;       // spec: 4 h thermal inertia toward the room
/**
 * Heating rate with the element on, °C/h. A bare 100 W into 60 L is 1.4 °C/h,
 * which a tank with a 4 h loss time constant could never hold at 30 °C — real
 * tanks keep a lid on. Rather than quietly lengthen the spec's 4 h inertia,
 * the element is driven at lidded-tank effectiveness so every setpoint on the
 * slider is genuinely reachable and the thermostat duty cycle stays visible.
 */
const HEATER_RATE = 3.0;
const HYSTERESIS_C = 0.5;      // spec: the thermostat's 0.5 °C dead band

const EAT_PER_FISH = 0.25 / 24;   // g/h a healthy danio can clear
const FOOD_DECAY_TAU_H = 8;       // spec: uneaten food decays over 8 h
const N_PER_G_EATEN = 25;         // mg of ammonia-N excreted per g eaten
const N_PER_G_DECAYED = 30;       // mg of ammonia-N per g mineralised
const BASE_EXCRETION = 0.3 / 24;  // mg N/h per fish even when unfed
/** Rotting food also breathes: mg/L of oxygen demanded per g decayed (60 L). */
const BOD_PER_G = 20;

/**
 * Nitrification, k·B·S/(S+Km) for both stages. The colony is two guilds —
 * ammonia oxidisers and the slower-seeded nitrite oxidisers — which is what
 * makes the classic two-hump cycling curve emerge instead of being drawn.
 * B = 1 is one mature seeded cartridge; the spec's media/gravel split (60/40)
 * appears as the contact factor below and in how a cartridge swap replaces
 * only the media's share of the colony.
 */
const VMAX_NITRIFY = 11.2 / 24;   // mg/L/h per colony unit at full contact
const KM_AMMONIA = 0.5;           // mg/L
const KM_NITRITE = 0.5;
const KM_O2_BACT = 0.6;           // nitrifiers slow down as oxygen thins
const MEDIA_SHARE = 0.6;          // spec: 60 % of the colony lives in media
const GRAVEL_SHARE = 0.4;         //       40 % in the gravel biofilm
/** Fish and convection still stir a little water over the gravel unpumped. */
const GRAVEL_CONTACT = 0.25;
const CONTACT_FULL = MEDIA_SHARE + GRAVEL_SHARE * GRAVEL_CONTACT;

const COLONY_GROW = Math.log(2) / 20; // spec: 20 h doubling time, per hour
const COLONY_CAP = 2;                 // a heavily fed tank grows past seeded
const COLONY_MAINT = 0.002;           // background die-off, per hour
const COLONY_STARVE = 0.05;           // extra die-off at zero flow contact
const COLONY_SUFFOCATE = 0.08;        // extra die-off as O2 falls below 4
/** Bacteria ride in on fish and dust; a trickle that lets bare tanks seed. */
const INOCULATION = 1e-4;

/** Real nitrification stoichiometry: mg O2 per mg N at each stage. */
const O2_PER_N_STAGE1 = 3.4;
const O2_PER_N_STAGE2 = 1.1;
const KLA_PUMP = 0.55;     // gas exchange /h with the spray bar rippling
const KLA_STILL = 0.05;    // a still surface barely breathes
const FISH_O2 = 0.048;     // mg/L/h drawn per fish in 60 L
const PLANT_O2_LIT = 0.055;  // pearling, per plant-biomass unit in light
const PLANT_O2_DARK = 0.008; // respiration, per unit, always

const KM_NITRATE = 3;         // mg/L, plant uptake half-saturation
const PLANT_UPTAKE = 0.018;   // mg/L/h nitrate per plant-biomass unit in light
const PLANT_GROW = 0.0025;    // /h in light with nitrate — weeks, not minutes
const PLANT_SENESCE = 0.0004; // /h background dieback
const PLANT_MAX = 2;          // biomass units per clump

const AMMONIA_SAFE = 0.25;  // spec: toxicity threshold, mg/L
const O2_FLOOR = 4;         // spec: hypoxia threshold, mg/L
const DMG_AMMONIA = 6;      // health/h lost per mg/L over the threshold
const DMG_O2 = 3;           // health/h lost per mg/L under the floor
const DMG_CHILL = 1.5;      // health/h per °C below the comfort floor
const CHILL_C = 20;         // tropical fish in a 19 °C room slowly fail
const RECOVER = 0.9;        // health/h regained in clean, breathable water
const STRESS_VISIBLE = 70;  // below this, colour desaturation shows
const DEAD_REMOVE_H = 6;    // sim-hours before the keeper nets a loss

const START_CLOCK_H = 8;    // the school day starts with the light window
const SAMPLE_MIN = 60;      // history cadence: one row per simulated hour
const HISTORY_MAX = 720;    // 30 days of hourly samples on the graph
const MAX_FISH = 12;
const MAX_PLANTS = 10;

/** Oxygen saturation vs temperature, mg/L — the standard freshwater fit. */
function o2Saturation(tempC: number): number {
  return 14.62 - 0.3808 * tempC + 0.00527 * tempC * tempC;
}

/* ------------------------------------------------------------------ *
 * The couplings — the flows that make the parts a system
 * ------------------------------------------------------------------ */

/**
 * Every arrow in the stock-and-flow overlay, in fixed order. `state.flows`
 * holds the live magnitude of each; the overlay, the active-flows counter and
 * the lab checks all read the same numbers, so the diagram can never say
 * something the model is not doing.
 */
export const FLOW_DEFS = [
  { key: "feed", label: "feeder to food" },
  { key: "excrete", label: "fish to ammonia" },
  { key: "decay", label: "food to ammonia" },
  { key: "circulate", label: "pump through media" },
  { key: "nitrify1", label: "ammonia to nitrite" },
  { key: "nitrify2", label: "nitrite to nitrate" },
  { key: "uptake", label: "nitrate to plants" },
  { key: "photo", label: "plants to oxygen" },
  { key: "aerate", label: "surface to oxygen" },
  { key: "breathe", label: "oxygen to fish" },
  { key: "bactO2", label: "oxygen to colony" },
  { key: "heat", label: "heater to water" },
  { key: "photons", label: "light to plants" },
] as const;

/** Nominal full-scale magnitude per flow, used only to scale pipe widths. */
const FLOW_NOMINAL = [0.17, 4, 4, 1, 0.4, 0.4, 0.3, 0.6, 0.5, 0.7, 1.5, 1, 1];

const FLOW_COUNT = FLOW_DEFS.length;

/**
 * Structural coupling gates, 0 or 1. In loose-parts mode every gate is zero —
 * genuinely zero, not small — so the identical parts exchange nothing at all.
 */
interface Gates {
  assembled: number; // 0 in the parts tray, 1 in the tank
  pump: number;
  heater: number;
  light: number;
}

function gatesFor(params: ParamValues): Gates {
  const loose = params.looseParts === true;
  const a = loose ? 0 : 1;
  return {
    assembled: a,
    pump: a * (params.pumpPlugged === true ? 1 : 0),
    heater: a * (params.heaterPlugged === true ? 1 : 0),
    light: a * (params.lightPlugged === true ? 1 : 0),
  };
}

/** Starting colony per guild for each cartridge on the shelf. */
function mediaSeed(media: string): { bA: number; bN: number } {
  if (media === "mature") return { bA: 1, bN: 1 };
  // A "sterile" sponge is never quite sterile: the trace that arrives with
  // water and fish is what new-tank syndrome grows from over days.
  if (media === "sterile") return { bA: 0.02, bN: 0.015 };
  return { bA: 0, bN: 0 };
}

/** Hours of light per day, from the SI (seconds) slider value. */
function lightHoursOf(params: ParamValues): number {
  return (params.lightHours as number) / 3600;
}

/** The LED window straddles midday: 8 h/day means 08:00 to 16:00. */
function lightIsOn(params: ParamValues, gates: Gates, clockH: number): boolean {
  const hours = lightHoursOf(params);
  if (gates.light === 0 || hours <= 0) return false;
  const from = 12 - hours / 2;
  return clockH >= from && clockH < from + hours;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Fish {
  x: number;       // tank fraction, 0 left to 1 right
  y: number;       // water fraction, 0 surface to 1 gravel
  dir: number;     // heading, radians, screen convention
  phase: number;   // tail-beat phase, advances with swimming
  health: number;  // 0-100
  resist: number;  // individual hardiness, 0.85-1.15 — deaths stagger honestly
  alive: boolean;
  /** What finally did it: "ammonia", "oxygen" or "chill". Empty while alive. */
  cause: string;
  deadForH: number;
}

interface PlantClump {
  x: number;        // tank fraction
  biomass: number;  // 1 = the clump as bought
  seed: number;     // stable per-clump appearance
}

interface State {
  /** Simulated minutes since the run began. */
  min: number;
  ammonia: number;  // mg/L as nitrogen — 1 mg of N stays 1 mg down the chain,
  nitrite: number;  // so conservation of matter is visible in the overlay
  nitrate: number;
  oxygen: number;   // mg/L
  temp: number;     // °C
  heaterOn: boolean;
  bacteriaA: number; // ammonia-oxidiser guild, 1 = mature cartridge
  bacteriaN: number; // nitrite-oxidiser guild
  food: number;      // uneaten food, g
  fish: Fish[];
  plants: PlantClump[];
  /** Live magnitude of every coupling, FLOW_DEFS order. Zero in the tray. */
  flows: number[];
  /** Dipping probe, raw stage px; -1 until the pointer first enters. */
  probeX: number;
  probeY: number;
  /** Hourly history for the on-stage graph. */
  histMin: number[];
  histA: number[];
  histNi: number[];
  histNa: number[];
  histO2: number[];
  sampleClock: number;
  /** Sim-hour ammonia first crossed 0.25 mg/L, or -1. Lab S2 records this. */
  ammoniaCrossHour: number;
  /** Sim-hour the first fish showed stress colour (health < 70), or -1. */
  firstStressHour: number;
  firstDeathHour: number;
  ammoniaPeak: number;
  deathsAmmonia: number;
  deathsOxygen: number;
  deathsChill: number;
  minHealthEver: number;
  /** Weekly water changes already applied, so each fires exactly once. */
  changesDone: number;
  /** Minutes left to show the water-change note on stage. */
  changeFlash: number;
}

function spawnFish(rng: Rng): Fish {
  return {
    x: rng.range(0.12, 0.88),
    y: rng.range(0.25, 0.75),
    dir: rng.chance(0.5) ? 0 : Math.PI,
    phase: rng.range(0, 1),
    health: 100,
    resist: rng.range(0.85, 1.15),
    alive: true,
    cause: "",
    deadForH: 0,
  };
}

function spawnPlant(rng: Rng, slot: number, count: number): PlantClump {
  // Clumps spread across the gravel with a little jitter, never a picket row.
  const t = count <= 1 ? 0.5 : slot / (count - 1);
  return {
    x: clamp01(0.1 + t * 0.8 + rng.range(-0.03, 0.03)),
    biomass: 1,
    seed: rng.int(1, 9999),
  };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const gates = gatesFor(params);
  const loose = gates.assembled === 0;
  const seed = mediaSeed(params.media as string);
  const setC = (params.heaterSet as number) - 273.15;
  // An assembled tank has been running: water at temperature, a trace of
  // ammonia, some residual nitrate. The parts tray holds no water at all.
  const temp = loose ? ROOM_C : gates.heater ? setC : ROOM_C;
  const nFish = Math.min(MAX_FISH, Math.round(params.fishStocked as number));
  const nPlants = Math.min(MAX_PLANTS, Math.round(params.plants as number));
  const fish: Fish[] = [];
  for (let i = 0; i < nFish; i++) fish.push(spawnFish(rng));
  const plants: PlantClump[] = [];
  for (let i = 0; i < nPlants; i++) plants.push(spawnPlant(rng, i, nPlants));

  const s: State = {
    min: 0,
    ammonia: loose ? 0 : 0.05,
    nitrite: loose ? 0 : 0.01,
    nitrate: loose ? 0 : 5,
    oxygen: loose ? 0 : o2Saturation(temp) * 0.95,
    temp,
    heaterOn: false,
    bacteriaA: seed.bA,
    bacteriaN: seed.bN,
    food: loose ? 0 : 0.05,
    fish,
    plants,
    flows: new Array<number>(FLOW_COUNT).fill(0),
    probeX: -1,
    probeY: -1,
    histMin: [],
    histA: [],
    histNi: [],
    histNa: [],
    histO2: [],
    sampleClock: 0,
    ammoniaCrossHour: -1,
    firstStressHour: -1,
    firstDeathHour: -1,
    ammoniaPeak: loose ? 0 : 0.05,
    deathsAmmonia: 0,
    deathsOxygen: 0,
    deathsChill: 0,
    minHealthEver: nFish > 0 ? 100 : 0,
    changesDone: 0,
    changeFlash: 0,
  };
  s.flows = flowMagnitudes(s, params, gates);
  pushSample(s);
  return s;
}

function pushSample(s: State): void {
  const drop = s.histMin.length >= HISTORY_MAX ? 1 : 0;
  s.histMin = s.histMin.slice(drop);
  s.histA = s.histA.slice(drop);
  s.histNi = s.histNi.slice(drop);
  s.histNa = s.histNa.slice(drop);
  s.histO2 = s.histO2.slice(drop);
  s.histMin.push(s.min);
  s.histA.push(s.ammonia);
  s.histNi.push(s.nitrite);
  s.histNa.push(s.nitrate);
  s.histO2.push(s.oxygen);
}

/** Clock time within the simulated day, hours 0-24. */
function clockHours(min: number): number {
  return (START_CLOCK_H + min / 60) % 24;
}

function aliveCount(fish: readonly Fish[]): number {
  let n = 0;
  for (const f of fish) if (f.alive) n++;
  return n;
}

function plantBiomass(plants: readonly PlantClump[]): number {
  let b = 0;
  for (const p of plants) b += p.biomass;
  return b;
}

/**
 * The live magnitude of every coupling, from the same expressions the step
 * function integrates. Loose-parts mode multiplies every one by a gate that
 * is exactly zero, so the heap really does read "0 active flows".
 */
function flowMagnitudes(s: State, params: ParamValues, gates: Gates): number[] {
  const out = new Array<number>(FLOW_COUNT).fill(0);
  if (gates.assembled === 0) return out;

  const lit = lightIsOn(params, gates, clockHours(s.min));
  const alive = aliveCount(s.fish);
  const biomass = plantBiomass(s.plants);
  const chi = (MEDIA_SHARE * gates.pump + GRAVEL_SHARE * GRAVEL_CONTACT) / CONTACT_FULL;
  const o2f = s.oxygen / (s.oxygen + KM_O2_BACT);
  const r1 = VMAX_NITRIFY * s.bacteriaA * chi * o2f * (s.ammonia / (s.ammonia + KM_AMMONIA));
  const r2 = VMAX_NITRIFY * s.bacteriaN * chi * o2f * (s.nitrite / (s.nitrite + KM_NITRITE));
  const uptake = lit ? PLANT_UPTAKE * biomass * (s.nitrate / (s.nitrate + KM_NITRATE)) : 0;
  const decayG = s.food / FOOD_DECAY_TAU_H;

  out[0] = (params.feeding as number) / 24;                       // g/h in
  out[1] = alive > 0 ? alive * (EAT_PER_FISH * N_PER_G_EATEN + BASE_EXCRETION) : 0;
  out[2] = decayG * N_PER_G_DECAYED;                              // mg N/h
  out[3] = gates.pump;                                            // circulation
  out[4] = r1;                                                    // mg/L/h
  out[5] = r2;
  out[6] = uptake;
  out[7] = lit ? PLANT_O2_LIT * biomass : 0;
  out[8] = (gates.pump ? KLA_PUMP : KLA_STILL) * Math.abs(o2Saturation(s.temp) - s.oxygen);
  out[9] = alive * FISH_O2;
  out[10] = r1 * O2_PER_N_STAGE1 + r2 * O2_PER_N_STAGE2;
  out[11] = gates.heater && s.heaterOn ? 1 : 0;
  out[12] = lit && s.plants.length > 0 ? 1 : 0;
  return out;
}

function activeFlowCount(flows: readonly number[]): number {
  let n = 0;
  for (const f of flows) if (f > 1e-9) n++;
  return n;
}

/* ------------------------------------------------------------------ *
 * The stock-and-flow engine
 * ------------------------------------------------------------------ */

/**
 * One chemistry substep of `dtH` hours (never more than one sim-minute).
 * Mutates the working copy the step function owns. Everything here is a rate
 * law from the spec; nothing writes a stock directly to "make it look right".
 */
function substep(s: State, dtH: number, params: ParamValues, gates: Gates): void {
  const clockH = clockHours(s.min);
  const lit = lightIsOn(params, gates, clockH);
  const alive = aliveCount(s.fish);
  const biomass = plantBiomass(s.plants);
  const sat = o2Saturation(s.temp);

  /* --- heat: thermostat with the spec's 0.5 °C hysteresis ---------- */
  const setC = (params.heaterSet as number) - 273.15;
  if (gates.heater === 1) {
    if (s.heaterOn && s.temp > setC + HYSTERESIS_C / 2) s.heaterOn = false;
    else if (!s.heaterOn && s.temp < setC - HYSTERESIS_C / 2) s.heaterOn = true;
  } else {
    s.heaterOn = false;
  }
  s.temp += (s.heaterOn ? HEATER_RATE * dtH : 0) - ((s.temp - ROOM_C) / THERMAL_TAU_H) * dtH;

  /* --- food: fed in, eaten, or left to rot ------------------------- */
  // The auto-feeder drips the daily ration continuously — a simplification
  // that keeps the ammonia input smooth without changing the daily budget.
  s.food += gates.assembled * ((params.feeding as number) / 24) * dtH;
  let appetite = 0;
  for (const f of s.fish) {
    if (f.alive) appetite += f.health > 30 ? 1 : 0.4; // sick fish go off food
  }
  const eaten = Math.min(s.food, EAT_PER_FISH * appetite * dtH);
  s.food -= eaten;
  const decayedG = (s.food / FOOD_DECAY_TAU_H) * dtH; // spec: 8 h decay
  s.food = Math.max(0, s.food - decayedG);

  /* --- ammonia in: excretion plus mineralised leftovers ------------ */
  const excretedMg = eaten * N_PER_G_EATEN + alive * BASE_EXCRETION * dtH;
  s.ammonia += (excretedMg + decayedG * N_PER_G_DECAYED) / VOLUME_L;

  /* --- nitrification: k·B·S/(S+Km), gated by flow and oxygen ------- */
  // Unplugging the pump cuts contact to the gravel's passive trickle, which
  // is the spec's double blow: substrate stops arriving AND the colony below
  // starts to starve. Nothing else about the rate law changes.
  const chi = (MEDIA_SHARE * gates.pump + GRAVEL_SHARE * GRAVEL_CONTACT) / CONTACT_FULL;
  const o2f = s.oxygen / (s.oxygen + KM_O2_BACT);
  const r1 = VMAX_NITRIFY * s.bacteriaA * chi * o2f * (s.ammonia / (s.ammonia + KM_AMMONIA));
  const r2 = VMAX_NITRIFY * s.bacteriaN * chi * o2f * (s.nitrite / (s.nitrite + KM_NITRITE));
  s.ammonia = Math.max(0, s.ammonia - r1 * dtH);
  s.nitrite = Math.max(0, s.nitrite + (r1 - r2) * dtH);
  s.nitrate += r2 * dtH;

  /* --- plants: draw nitrate and pearl oxygen in light -------------- */
  const nf = s.nitrate / (s.nitrate + KM_NITRATE);
  const uptake = lit ? PLANT_UPTAKE * biomass * nf : 0;
  s.nitrate = Math.max(0, s.nitrate - uptake * dtH);
  for (const p of s.plants) {
    const grow = lit ? PLANT_GROW * nf * p.biomass * (1 - p.biomass / PLANT_MAX) : 0;
    p.biomass = Math.min(PLANT_MAX, Math.max(0.05, p.biomass + (grow - PLANT_SENESCE * p.biomass) * dtH));
  }

  /* --- oxygen: one budget, every consumer on it -------------------- */
  const kla = gates.pump ? KLA_PUMP : KLA_STILL;
  const metab = 1 + 0.02 * (s.temp - 25); // warmer fish breathe harder
  s.oxygen +=
    (kla * (sat - s.oxygen) - alive * FISH_O2 * Math.max(0.5, metab) -
      (r1 * O2_PER_N_STAGE1 + r2 * O2_PER_N_STAGE2) +
      (lit ? PLANT_O2_LIT * biomass : 0) - PLANT_O2_DARK * biomass) * dtH -
    decayedG * BOD_PER_G / VOLUME_L;
  s.oxygen = Math.max(0, Math.min(12, s.oxygen));

  /* --- the colony: grows only where oxygenated water flows --------- */
  const growGate = chi * o2f;
  const dieRate =
    COLONY_MAINT + COLONY_STARVE * (1 - chi) +
    COLONY_SUFFOCATE * Math.max(0, (O2_FLOOR - s.oxygen) / O2_FLOOR);
  const seedIn = alive > 0 ? INOCULATION * dtH : 0;
  s.bacteriaA = Math.max(0, s.bacteriaA +
    (COLONY_GROW * s.bacteriaA * (s.ammonia / (s.ammonia + KM_AMMONIA)) * growGate *
      (1 - s.bacteriaA / COLONY_CAP) - dieRate * s.bacteriaA) * dtH + seedIn);
  s.bacteriaN = Math.max(0, s.bacteriaN +
    (COLONY_GROW * s.bacteriaN * (s.nitrite / (s.nitrite + KM_NITRITE)) * growGate *
      (1 - s.bacteriaN / COLONY_CAP) - dieRate * s.bacteriaN) * dtH + seedIn);

  /* --- fish physiology: damage with a nameable cause --------------- */
  const overA = Math.max(0, s.ammonia - AMMONIA_SAFE);
  const underO = Math.max(0, O2_FLOOR - s.oxygen);
  const chill = Math.max(0, CHILL_C - s.temp);
  const hour = s.min / 60;
  for (const f of s.fish) {
    if (!f.alive) {
      f.deadForH += dtH;
      continue;
    }
    const dA = DMG_AMMONIA * overA * f.resist;
    const dO = DMG_O2 * underO * f.resist;
    const dC = DMG_CHILL * chill * f.resist;
    const damage = dA + dO + dC;
    f.health = damage > 0
      ? Math.max(0, f.health - damage * dtH)
      : Math.min(100, f.health + RECOVER * dtH);
    if (f.health < s.minHealthEver) s.minHealthEver = f.health;
    if (f.health < STRESS_VISIBLE && s.firstStressHour < 0) s.firstStressHour = hour;
    if (f.health <= 0) {
      f.alive = false;
      // The largest contributor at the moment of death names the cause —
      // this is what makes every loss traceable along the chain.
      f.cause = dA >= dO && dA >= dC ? "ammonia" : dO >= dC ? "oxygen" : "chill";
      if (f.cause === "ammonia") s.deathsAmmonia++;
      else if (f.cause === "oxygen") s.deathsOxygen++;
      else s.deathsChill++;
      if (s.firstDeathHour < 0) s.firstDeathHour = hour;
    }
  }

  /* --- bookkeeping the labs read ----------------------------------- */
  if (s.ammonia > s.ammoniaPeak) s.ammoniaPeak = s.ammonia;
  if (s.ammonia >= AMMONIA_SAFE && s.ammoniaCrossHour < 0) s.ammoniaCrossHour = hour;

  /* --- the weekly water change ------------------------------------- */
  const week = Math.floor(s.min / (7 * 24 * 60));
  if (week > s.changesDone) {
    s.changesDone = week;
    const f = params.waterChange as number; // stored as a fraction, 0-0.5
    if (f > 0) {
      // Fresh dechlorinated water: dissolved stocks dilute, oxygen tops up.
      s.ammonia *= 1 - f;
      s.nitrite *= 1 - f;
      s.nitrate *= 1 - f;
      s.oxygen += f * Math.max(0, sat - s.oxygen);
      s.changeFlash = 240; // show the note for four simulated hours
    }
  }
  if (s.changeFlash > 0) s.changeFlash = Math.max(0, s.changeFlash - dtH * 60);

  s.min += dtH * 60;
  s.sampleClock += dtH * 60;
}

/**
 * Fish steering. Runs on the real-time clock, not the compressed one: at
 * 1000x a physiologically honest swimming speed would be an invisible blur,
 * so the animation clock keeps the shoal watchable while every consequence
 * that matters — health, gills, chemistry — runs on simulated time.
 */
function swim(s: State, dtReal: number, rng: Rng, gates: Gates): void {
  const loose = gates.assembled === 0;
  const jitter = 0.9 * Math.sqrt(Math.max(dtReal, 1e-6));
  // Shoal centroid, for the loose pull that keeps danios in a group.
  let cx = 0.5, cy = 0.45, n = 0;
  for (const f of s.fish) {
    if (f.alive) { cx += f.x; cy += f.y; n++; }
  }
  if (n > 0) { cx = (cx - 0.5) / n; cy = (cy - 0.45) / n; }

  for (const f of s.fish) {
    if (!f.alive) {
      // A lost fish drifts up and rests at the surface — shown plainly.
      f.y = Math.max(0.03, f.y - 0.08 * dtReal);
      f.phase += dtReal * 0.2;
      continue;
    }
    if (loose) {
      // In the jar: alive, idling, coupled to nothing.
      f.phase += dtReal * 1.2;
      continue;
    }
    const gasping = s.oxygen < O2_FLOOR;
    // Target: gasping fish crowd the surface film; otherwise the shoal holds
    // station in the spray-bar outflow when the pump runs, as danios do.
    const tx = gasping ? f.x : gates.pump ? 0.72 : cx;
    const ty = gasping ? 0.05 : gates.pump ? 0.28 : cy;
    const steer = Math.atan2(ty - f.y, (tx - f.x) * 0.9);
    const blend = gasping ? 3 : 0.8;
    const da = Math.atan2(Math.sin(steer - f.dir), Math.cos(steer - f.dir));
    f.dir += da * blend * dtReal + rng.normal(0, jitter);
    const activity = (0.4 + 0.6 * (f.health / 100)) * (gasping ? 0.55 : 1);
    const speed = 0.09 * activity;
    f.x += Math.cos(f.dir) * speed * dtReal;
    f.y += Math.sin(f.dir) * speed * 0.6 * dtReal;
    // Glass at the edges: turn, do not clip through.
    if (f.x < 0.05) { f.x = 0.05; f.dir = Math.PI - f.dir; }
    if (f.x > 0.95) { f.x = 0.95; f.dir = Math.PI - f.dir; }
    f.y = Math.min(0.9, Math.max(0.04, f.y));
    f.phase += dtReal * (1.5 + activity * 3);
  }
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    // Moving between the tank and the parts tray is a different world.
    // Everything else — plugs, cartridge, stocking — changes the running
    // tank in place, because connecting parts mid-run is the whole activity.
    if (params.looseParts !== prev.looseParts) {
      return buildWorld(params, ctx.rng);
    }
    let s = state;
    if (params.fishStocked !== prev.fishStocked) {
      const want = Math.min(MAX_FISH, Math.round(params.fishStocked as number));
      const fish = s.fish.slice();
      let alive = aliveCount(fish);
      while (alive < want) { fish.push(spawnFish(ctx.rng)); alive++; }
      for (let i = fish.length - 1; i >= 0 && alive > want; i--) {
        if (fish[i].alive) { fish.splice(i, 1); alive--; } // netted out, alive
      }
      s = { ...s, fish };
    }
    if (params.plants !== prev.plants) {
      const want = Math.min(MAX_PLANTS, Math.round(params.plants as number));
      const plants = s.plants.slice();
      while (plants.length < want) plants.push(spawnPlant(ctx.rng, plants.length, want));
      plants.length = Math.min(plants.length, want);
      s = { ...s, plants };
    }
    if (params.media !== prev.media) {
      // Swapping the cartridge replaces the media's 60 % share of each guild;
      // the gravel biofilm keeps its 40 % — the spec's split, made physical.
      const seed = mediaSeed(params.media as string);
      s = {
        ...s,
        bacteriaA: s.bacteriaA * GRAVEL_SHARE + seed.bA * MEDIA_SHARE,
        bacteriaN: s.bacteriaN * GRAVEL_SHARE + seed.bN * MEDIA_SHARE,
      };
    }
    return s;
  },

  step(state, dt, params, ctx, inputs) {
    if (dt <= 0 && inputs.length === 0) return state;
    const gates = gatesFor(params);

    // A shallow working copy; arrays that change are copied before mutation.
    const s: State = {
      ...state,
      fish: state.fish.map((f) => ({ ...f })),
      plants: state.plants.map((p) => ({ ...p })),
    };

    // The dipping probe follows the pointer; readouts stay whole-tank because
    // the stocks are spatially uniform (spec), but the wand samples locally.
    for (const input of inputs) {
      if (input.type === "pointermove" || input.type === "pointerdown") {
        s.probeX = input.x;
        s.probeY = input.y;
      }
    }

    if (dt > 0) {
      // Time compression: engine seconds become simulated minutes here, and
      // the chemistry integrates in substeps of at most one simulated minute
      // so the dial changes pace, never the physics.
      const comp = params.timeComp as number;
      const simMinutes = (dt * comp) / 60;
      const n = Math.max(1, Math.ceil(simMinutes));
      const dtH = simMinutes / n / 60;
      if (gates.assembled === 1) {
        for (let i = 0; i < n; i++) substep(s, dtH, params, gates);
      } else {
        // The heap: time passes, nothing flows, nothing changes. The clock
        // still runs so "a week went by and the tray did nothing" is provable.
        s.min += simMinutes;
        s.sampleClock += simMinutes;
      }
      // The keeper nets a loss after a few hours — shown, then laid to rest.
      if (s.fish.some((f) => !f.alive && f.deadForH > DEAD_REMOVE_H)) {
        s.fish = s.fish.filter((f) => f.alive || f.deadForH <= DEAD_REMOVE_H);
      }
      swim(s, dt, ctx.rng, gates);
      while (s.sampleClock >= SAMPLE_MIN) {
        s.sampleClock -= SAMPLE_MIN;
        pushSample(s);
      }
      s.flows = flowMagnitudes(s, params, gates);
    }
    return s;
  },

  readouts(state) {
    const alive = aliveCount(state.fish);
    let mean = 0;
    for (const f of state.fish) if (f.alive) mean += f.health;
    mean = alive > 0 ? mean / alive : 0;
    return [
      {
        key: "ammonia", label: "Ammonia (mg/L)", quantity: q(state.ammonia, "ratio"),
        semantic: "acid", graphable: true,
      },
      {
        key: "nitrite", label: "Nitrite (mg/L)", quantity: q(state.nitrite, "ratio"),
        semantic: "acceleration", graphable: true,
      },
      {
        key: "nitrate", label: "Nitrate (mg/L)", quantity: q(state.nitrate, "ratio"),
        semantic: "producer", graphable: true,
      },
      {
        key: "oxygen", label: "Dissolved oxygen (mg/L)", quantity: q(state.oxygen, "ratio"),
        semantic: "cold", graphable: true,
      },
      {
        key: "temperature", label: "Water temperature", unit: "°C",
        quantity: q(state.temp + 273.15, "temperature"), semantic: "hot", graphable: true,
      },
      {
        key: "fishHealth", label: "Fish health (mean)", quantity: q(mean / 100, "percent"),
        unit: "%", semantic: "primary-consumer", graphable: true,
      },
      {
        key: "fishAlive", label: "Fish alive", quantity: q(alive, "population"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "colony", label: "Filter colony", unit: "%", semantic: "decomposer",
        quantity: q((state.bacteriaA + state.bacteriaN) / 2, "percent"), graphable: true,
      },
      {
        key: "activeFlows", label: "Active flows", semantic: "field",
        quantity: q(activeFlowCount(state.flows), "count"), graphable: true,
      },
      {
        key: "day", label: "Day", quantity: q(state.min / (24 * 60), "count"),
        semantic: "time",
      },
      {
        key: "food", label: "Uneaten food", unit: "g", semantic: "mass",
        quantity: q(state.food / 1000, "mass"), bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const gates = gatesFor(params);
    const alive = aliveCount(state.fish);
    let mean = 0, min = 100;
    for (const f of state.fish) {
      if (!f.alive) continue;
      mean += f.health;
      if (f.health < min) min = f.health;
    }
    mean = alive > 0 ? mean / alive : 0;
    const flowsActive = activeFlowCount(state.flows);
    const deaths = state.deathsAmmonia + state.deathsOxygen + state.deathsChill;
    // The three legs of the system-check badge. A heap fails on the first, a
    // dead-plug tank fails on the second or third — never by decree, always
    // by measurement.
    const partsOk = gates.assembled === 1 && alive > 0;
    const connectedOk = flowsActive >= 6;
    const functionOk =
      alive > 0 && state.ammonia < AMMONIA_SAFE && state.oxygen > O2_FLOOR && mean > 50;
    // How many of the five optional parts are connected — activity 5 asks the
    // student to survive on three.
    const partCount =
      (params.pumpPlugged === true ? 1 : 0) + (params.heaterPlugged === true ? 1 : 0) +
      (params.lightPlugged === true ? 1 : 0) + (params.media !== "none" ? 1 : 0) +
      ((params.plants as number) > 0 ? 1 : 0);
    return {
      day: state.min / (24 * 60),
      hour: state.min / 60,
      ammonia: state.ammonia,
      nitrite: state.nitrite,
      nitrate: state.nitrate,
      oxygen: state.oxygen,
      temperatureC: state.temp,
      colony: (state.bacteriaA + state.bacteriaN) / 2,
      colonyA: state.bacteriaA,
      colonyN: state.bacteriaN,
      food: state.food,
      fishAlive: alive,
      fishDead: deaths,
      meanHealth: mean,
      minHealth: alive > 0 ? min : 0,
      healthValid: alive > 0,
      minHealthEver: state.minHealthEver,
      ammoniaPeak: state.ammoniaPeak,
      ammoniaCrossHour: state.ammoniaCrossHour,
      firstStressHour: state.firstStressHour,
      firstDeathHour: state.firstDeathHour,
      deathsAmmonia: state.deathsAmmonia,
      deathsOxygen: state.deathsOxygen,
      deathsChill: state.deathsChill,
      activeFlows: flowsActive,
      partsOk,
      connectedOk,
      functionOk,
      systemOk: partsOk && connectedOk && functionOk,
      loose: gates.assembled === 0,
      pumpOn: gates.pump === 1,
      heaterOn: state.heaterOn,
      lightOn: lightIsOn(params, gates, clockHours(state.min)),
      partCount,
      waterChanges: state.changesDone,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View — the tank, the tray, the overlay, the evidence
 * ------------------------------------------------------------------ */

interface Layout {
  benchY: number;
  tankX: number; tankY: number; tankW: number; tankH: number;
  waterY: number;   // surface line
  gravelY: number;  // top of the gravel bed
  panelX: number; panelY: number; panelW: number; panelH: number;
  stageH: number;
}

function layout(width: number, stageH: number, view: string, loose: boolean): Layout {
  const benchY = Math.round(stageH * 0.74);
  const both = view === "both";
  const tankW = Math.min(width * (both ? 0.5 : 0.62), stageH * 1.1);
  const tankH = Math.min(tankW * 0.6, benchY * 0.78);
  const tankX = both ? width * 0.05 : (width - tankW) * (loose ? 0.5 : 0.4);
  const tankY = benchY - tankH;
  const panelW = both ? width - (tankX + tankW) - width * 0.05 : width * 0.62;
  const panelX = both ? tankX + tankW + width * 0.025 : (width - panelW) / 2;
  return {
    benchY, tankX, tankY, tankW, tankH,
    waterY: tankY + tankH * 0.09,
    gravelY: benchY - tankH * 0.14,
    panelX, panelY: stageH * 0.06, panelW,
    panelH: Math.min(stageH * 0.86, benchY + stageH * 0.12),
    stageH,
  };
}

/** Water column position of a fish or plant, tank fractions to px. */
function inTank(L: Layout, fx: number, fy: number): { x: number; y: number } {
  return {
    x: L.tankX + L.tankW * (0.04 + fx * 0.92),
    y: L.waterY + (L.gravelY - L.waterY) * fy,
  };
}

const MONO = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Fixed-decimal text for the stage; a raw float never reaches the canvas. */
function num(v: number, dp = 2): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

/** Deterministic per-index jitter for gravel, bubbles and caustics. */
function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/* ---- the assembled aquarium ---------------------------------------- */

function drawTank(rc: RenderContext<State>, L: Layout, gates: Gates, lit: boolean) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const { tankX: tx, tankY: ty, tankW: tw, tankH: th, waterY, gravelY, benchY } = L;
  const pumpOn = gates.pump === 1;

  /* --- the LED bar and its cone of light --------------------------- */
  const barY = ty - Math.max(6, th * 0.045);
  if (lit) {
    const cone = ctx.createLinearGradient(0, barY, 0, benchY);
    cone.addColorStop(0, hexA("#ffe9b0", dark ? 0.22 : 0.3));
    cone.addColorStop(1, hexA("#ffe9b0", 0));
    ctx.save();
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.06, barY);
    ctx.lineTo(tx + tw * 0.94, barY);
    ctx.lineTo(tx + tw * 1.02, benchY);
    ctx.lineTo(tx - tw * 0.02, benchY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* --- water body --------------------------------------------------- */
  ctx.save();
  ctx.beginPath();
  ctx.rect(tx, waterY, tw, benchY - waterY - 2);
  ctx.clip();
  const water = ctx.createLinearGradient(0, waterY, 0, benchY);
  const tint = lit ? "#2e8ca8" : "#256e86";
  water.addColorStop(0, mixHex(tint, dark ? "#0c2733" : "#7cc4d8", lit ? 0.35 : 0.15));
  water.addColorStop(1, mixHex(tint, "#08222c", 0.55));
  ctx.fillStyle = water;
  ctx.fillRect(tx, waterY, tw, benchY - waterY);

  // Caustic shimmer under the light — slow bands that live on the clock.
  if (lit) {
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const px = tx + tw * ((i + 0.5) / 7 + 0.03 * Math.sin(time * 0.7 + i * 2.1));
      ctx.beginPath();
      ctx.moveTo(px, waterY + 4);
      ctx.quadraticCurveTo(px + 10 * Math.sin(time + i), (waterY + gravelY) / 2, px - 6, gravelY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* --- gravel bed with its biofilm --------------------------------- */
  const gravelH = benchY - gravelY;
  ctx.fillStyle = dark ? "#3c3630" : "#8a7a62";
  ctx.fillRect(tx, gravelY, tw, gravelH);
  // Biofilm: the only way the invisible colony shows — buff darkens to olive.
  const film = clamp01((state.bacteriaA + state.bacteriaN) / 2);
  ctx.fillStyle = hexA("#4a5c2e", 0.15 + 0.5 * film);
  ctx.fillRect(tx, gravelY, tw, gravelH);
  for (let i = 0; i < 90; i++) {
    const gx = tx + hash(i, 1) * tw;
    const gy = gravelY + 2 + hash(i, 2) * (gravelH - 5);
    ctx.fillStyle = hexA(hash(i, 3) > 0.5 ? "#ffffff" : "#000000", 0.12);
    ctx.beginPath();
    ctx.arc(gx, gy, 1.1 + hash(i, 4) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /* --- heater rod, rear right -------------------------------------- */
  const hx = tx + tw * 0.88;
  metal(ctx, hx - 3, waterY + th * 0.12, 6, gravelY - waterY - th * 0.16, "#8d97a4", { radius: 3 });
  if (gates.heater === 1) {
    // Amber LED pulses while the element draws power — the thermostat visible.
    const on = state.heaterOn;
    sphere(ctx, hx, waterY + th * 0.16, 3, on ? "#f0a03a" : "#5b6672", { rim: false });
    if (on) glow(ctx, hx, waterY + th * 0.16, 9, hexA("#f0a03a", 0.4 + 0.3 * pulse(time, 1.6)));
  }

  /* --- filter plumbing inside the tank ------------------------------ */
  const inletX = tx + tw * 0.08;
  const sprayY = waterY + th * 0.07;
  // Intake strainer, bottom left.
  metal(ctx, inletX - 4, gravelY - th * 0.2, 8, th * 0.2, "#5d6a76", { radius: 3 });
  ctx.strokeStyle = hexA("#0e1418", 0.5);
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(inletX - 4, gravelY - th * 0.17 + i * th * 0.04);
    ctx.lineTo(inletX + 4, gravelY - th * 0.17 + i * th * 0.04);
    ctx.stroke();
  }
  // Spray bar, top right, and its jet when the impeller turns.
  metal(ctx, tx + tw * 0.6, sprayY - 3, tw * 0.32, 6, "#5d6a76", { radius: 3 });
  if (pumpOn) {
    const jets: Particle[] = [];
    for (let i = 0; i < 26; i++) {
      const t = (time * 0.55 + hash(i, 5)) % 1;
      jets.push({
        x: tx + tw * (0.62 + hash(i, 6) * 0.28),
        y: sprayY + 3 + t * th * 0.34,
        r: 1.2 + hash(i, 7),
        a: 0.7 * (1 - t),
      });
    }
    particleField(ctx, jets, dark ? "#bfe6f2" : "#e8f7fb", { alpha: 0.8 });
    // Drawn intake current: a faint dashed pull toward the strainer.
    dashFlow(ctx, [
      { x: inletX + tw * 0.2, y: gravelY - th * 0.26 },
      { x: inletX + 2, y: gravelY - th * 0.14 },
    ], hexA("#cfeef8", 0.5), time * 26, { width: 1.6, dash: 3, gap: 7 });
  }

  /* --- plants: Vallisneria ribbons, health from their own biomass --- */
  for (let i = 0; i < state.plants.length; i++) {
    const p = state.plants[i];
    const pos = inTank(L, p.x, 1);
    plant(ctx, pos.x, gravelY + 2, th * (0.3 + 0.22 * p.biomass), "kelp", theme, {
      health: clamp01(0.25 + 0.75 * (p.biomass / 1)),
      sway: (time * 0.13 + i * 0.17) % 1,
      seed: p.seed,
    });
    // Pearling: oxygen beads lift off the leaves only while photosynthesising.
    if (lit && state.flows[7] > 1e-9) {
      const beads: Particle[] = [];
      for (let b = 0; b < 4; b++) {
        const t = (time * 0.3 + hash(i * 7 + b, 8)) % 1;
        beads.push({
          x: pos.x + (hash(i * 3 + b, 9) - 0.5) * th * 0.16,
          y: gravelY - th * (0.25 + 0.05 * b) - t * (gravelY - waterY - th * 0.3),
          r: 1 + hash(b, 10) * 0.8,
          a: 0.8 * (1 - t * 0.6),
        });
      }
      particleField(ctx, beads, "#dff4fb", { alpha: 0.85 });
    }
  }

  /* --- the shoal ---------------------------------------------------- */
  for (const f of state.fish) {
    const pos = inTank(L, f.x, f.y);
    const size = th * 0.115;
    const facing = Math.cos(f.dir) >= 0 ? 1 : -1;
    if (!f.alive) {
      // Shown honestly and quietly: belly-up at the surface, fading as the
      // keeper comes to net it. No gore — just the fact of it.
      const fade = clamp01(1 - f.deadForH / DEAD_REMOVE_H) * 0.85;
      ctx.save();
      ctx.translate(pos.x, pos.y - size * 0.5);
      ctx.scale(1, -1);
      creature(ctx, 0, size * 0.5, size, "fish", facing, theme, {
        tint: "#9aa8ad", alpha: fade, shadow: false,
      });
      ctx.restore();
      continue;
    }
    const stressed = f.health < STRESS_VISIBLE;
    const pitch = Math.max(-0.3, Math.min(0.3, Math.sin(f.dir) * 0.5)) * facing;
    ctx.save();
    ctx.translate(pos.x, pos.y - size * 0.5);
    ctx.rotate(pitch);
    creature(ctx, 0, size * 0.5, size, "fish", facing, theme, {
      motion: f.phase % 1,
      // Colour desaturates with stress, the spec's tell for a struggling fish.
      tint: stressed ? mixHex("#7fa8bd", "#c3cbcf", clamp01((STRESS_VISIBLE - f.health) / STRESS_VISIBLE)) : undefined,
      shadow: false,
    });
    ctx.restore();
    // Gasping at the surface: small mouth-ring at the film, hard to miss.
    if (state.oxygen < O2_FLOOR && f.y < 0.1) {
      ctx.strokeStyle = hexA("#dff4fb", 0.5 + 0.4 * pulse(time * 2 + f.phase, 2));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pos.x + facing * size * 0.6, waterY + 2, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* --- surface film and ripple ------------------------------------- */
  ctx.strokeStyle = hexA(dark ? "#bfe6f2" : "#ffffff", 0.65);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const amp = pumpOn ? 2.2 : 0.4;
  for (let px = 0; px <= tw; px += 6) {
    const y = waterY + Math.sin(px * 0.09 + time * (pumpOn ? 3.2 : 0.7)) * amp *
      (pumpOn ? 0.5 + 0.5 * clamp01(1.4 - Math.abs(px / tw - 0.76) * 3) : 1);
    if (px === 0) ctx.moveTo(tx + px, y);
    else ctx.lineTo(tx + px, y);
  }
  ctx.stroke();
  ctx.restore(); // end water clip

  /* --- the glass box itself ---------------------------------------- */
  glass(ctx, tx, ty, tw, th, 3, theme, { alpha: dark ? 0.08 : 0.14 });
  // Silicone seams at the corners — the spec's tell that this is a real box.
  ctx.strokeStyle = hexA(dark ? "#94b4c4" : "#5a7a88", 0.5);
  ctx.lineWidth = 2;
  for (const sx of [tx + 2, tx + tw - 2]) {
    ctx.beginPath();
    ctx.moveTo(sx, ty + 3);
    ctx.lineTo(sx, ty + th - 2);
    ctx.stroke();
  }
  // Rim and the LED bar sitting on it.
  metal(ctx, tx - 4, ty - 4, tw + 8, 5, "#3d454f", { radius: 2 });
  metal(ctx, tx + tw * 0.06, barY - 4, tw * 0.88, 6, "#6b7684", { radius: 3 });
  if (lit) {
    const bar = ctx.createLinearGradient(0, barY + 2, 0, barY + 10);
    bar.addColorStop(0, hexA("#ffe9b0", 0.85));
    bar.addColorStop(1, hexA("#ffe9b0", 0));
    ctx.fillStyle = bar;
    ctx.fillRect(tx + tw * 0.07, barY + 2, tw * 0.86, 8);
  }

  /* --- canister filter under the bench ------------------------------ */
  const cw = Math.max(30, tw * 0.14);
  const cx = tx + tw * 0.12;
  const cy = benchY + Math.max(10, L.stageH * 0.035);
  const ch = Math.max(36, L.stageH * 0.12);
  softShadow(ctx, () => {
    plastic(ctx, cx, cy, cw, ch, pumpOn ? "#2e5e50" : "#42505c", { radius: 6, gloss: 0.3 });
  }, { blur: 10, dy: 4, alpha: 0.4 });
  caption(ctx, cx + cw / 2, cy + ch + 10, "filter", theme, {
    align: "center", size: 10, color: theme.inkSoft,
  });
  // The impeller: it spins only while powered — the dead impeller IS scene 2.
  const ix = cx + cw / 2, iy = cy + ch * 0.42, ir = Math.min(cw, ch) * 0.26;
  sphere(ctx, ix, iy, ir, pumpOn ? "#9fd6c6" : "#5d6a76", { rim: false });
  ctx.strokeStyle = hexA("#10231e", 0.75);
  ctx.lineWidth = 2;
  const spin = pumpOn ? time * 9 : 0.7;
  for (let b = 0; b < 3; b++) {
    const a = spin + (b * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + Math.cos(a) * ir * 0.85, iy + Math.sin(a) * ir * 0.85);
    ctx.stroke();
  }
  // Hoses: tank down to canister, canister up to the spray bar.
  const hoseCol = pumpOn ? "#3f7568" : "#4a555f";
  ropeStroke(ctx, [
    { x: inletX, y: benchY - 2 }, { x: inletX, y: cy + ch * 0.3 }, { x: cx, y: cy + ch * 0.3 },
  ], 5, hoseCol);
  ropeStroke(ctx, [
    { x: cx + cw, y: cy + ch * 0.25 }, { x: tx + tw * 0.93, y: cy + ch * 0.25 },
    { x: tx + tw * 0.93, y: sprayY },
  ], 5, hoseCol);
  if (pumpOn) {
    // Water on the move through the loop — direction made obvious.
    dashFlow(ctx, [
      { x: inletX, y: benchY - 2 }, { x: inletX, y: cy + ch * 0.3 }, { x: cx, y: cy + ch * 0.3 },
    ], hexA("#bfe6f2", 0.8), time * 34, { width: 2, dash: 5, gap: 7 });
    dashFlow(ctx, [
      { x: cx + cw, y: cy + ch * 0.25 }, { x: tx + tw * 0.93, y: cy + ch * 0.25 },
      { x: tx + tw * 0.93, y: sprayY },
    ], hexA("#bfe6f2", 0.8), time * 34, { width: 2, dash: 5, gap: 7 });
  }

  /* --- power strip and its three cables ----------------------------- */
  drawPowerStrip(rc, L, gates, { pumpAt: { x: cx + cw * 0.5, y: cy + ch }, heaterAt: { x: hx, y: ty }, lightAt: { x: tx + tw * 0.5, y: barY } });
}

/** The four-way strip: seated plugs power their cables, pulled ones lie slack. */
function drawPowerStrip(
  rc: RenderContext<State>, L: Layout, gates: Gates,
  ends: { pumpAt: { x: number; y: number }; heaterAt: { x: number; y: number }; lightAt: { x: number; y: number } },
) {
  const { ctx, theme } = rc;
  const w = rc.width;
  const sw = Math.max(96, w * 0.15);
  const sx = Math.max(8, L.tankX - sw * 0.35);
  const sy = L.stageH * 0.9;
  const sh = Math.max(14, L.stageH * 0.035);

  const devices: { on: number; color: string; end: { x: number; y: number }; label: string }[] = [
    { on: gates.pump, color: "#3f7568", end: ends.pumpAt, label: "pump" },
    { on: gates.heater, color: "#8a6b3f", end: ends.heaterAt, label: "heater" },
    { on: gates.light, color: "#7a7f42", end: ends.lightAt, label: "light" },
  ];
  // Cables first so the strip body overlaps their roots.
  devices.forEach((d, i) => {
    const px = sx + sw * (0.18 + i * 0.24);
    if (d.on === 1) {
      ropeStroke(ctx, [
        { x: d.end.x, y: d.end.y },
        { x: (d.end.x + px) / 2, y: Math.max(d.end.y, sy) - L.stageH * 0.03 },
        { x: px, y: sy },
      ], 3.4, d.color);
    } else {
      // Pulled: the cable falls slack from the device and coils on the floor.
      ropeStroke(ctx, [
        { x: d.end.x, y: d.end.y },
        { x: d.end.x - 14, y: sy + sh * 1.4 },
        { x: px + 18, y: sy + sh * 1.6 },
      ], 3.4, mixHex(d.color, "#555555", 0.5));
      caption(ctx, px + 24, sy + sh * 1.6, "unplugged", theme, {
        size: 9, color: theme.sci["hot"], weight: 700,
      });
    }
  });
  softShadow(ctx, () => {
    plastic(ctx, sx, sy, sw, sh, "#e8e6e0", { radius: 4, gloss: 0.5 });
  }, { blur: 8, dy: 3, alpha: 0.35 });
  for (let i = 0; i < 4; i++) {
    const px = sx + sw * (0.18 + i * 0.24);
    const used = i < 3 && devices[i].on === 1;
    ctx.fillStyle = used ? "#2c2c30" : "#b9b6ae";
    roundRect(ctx, px - 5, sy + sh * 0.24, 10, sh * 0.52, 2);
    ctx.fill();
    if (used) {
      sphere(ctx, px, sy + sh * 0.5, 2, devices[i].color, { rim: false });
    }
  }
  caption(ctx, sx + sw / 2, sy + sh + 9, "power strip", theme, {
    align: "center", size: 10, color: theme.inkSoft,
  });
}

/* ---- the loose-parts tray ------------------------------------------ */

function drawTray(rc: RenderContext<State>, L: Layout) {
  const { ctx, state, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const { tankX: tx, tankW: tw, benchY } = L;
  const ty = benchY - L.tankH * 0.82;
  const th = L.tankH * 0.82;

  // The tray itself: a low-walled bin on the deliberately unlit second bench.
  softShadow(ctx, () => {
    plastic(ctx, tx - 10, ty - 8, tw + 20, th + 12, dark ? "#2b2f36" : "#4c525c", { radius: 10, gloss: 0.12 });
  }, { blur: 14, dy: 5, alpha: 0.4 });
  ctx.fillStyle = hexA("#000000", 0.25);
  roundRect(ctx, tx - 2, ty, tw + 4, th, 7);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.92;

  // The empty tank: same glass, no water — the emptiness is the point.
  const gw = tw * 0.4, gh = th * 0.52;
  glass(ctx, tx + tw * 0.03, ty + th * 0.08, gw, gh, 3, theme, { alpha: dark ? 0.1 : 0.2 });
  caption(ctx, tx + tw * 0.03 + gw / 2, ty + th * 0.08 + gh + 10, "tank (dry)", theme, {
    align: "center", size: 9, color: theme.inkSoft,
  });

  // Pump on its side with the hose coiled — an impeller with nothing to turn.
  const px = tx + tw * 0.55, py = ty + th * 0.16;
  plastic(ctx, px, py, tw * 0.16, th * 0.16, "#42505c", { radius: 6, gloss: 0.25 });
  ctx.strokeStyle = "#4a555f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(px + tw * 0.24, py + th * 0.1, th * 0.09, 0, Math.PI * 1.7);
  ctx.stroke();
  caption(ctx, px + tw * 0.08, py + th * 0.2, "pump", theme, { align: "center", size: 9, color: theme.inkSoft });

  // Heater rod and light bar, side by side.
  metal(ctx, tx + tw * 0.52, ty + th * 0.48, tw * 0.2, 5, "#8d97a4", { radius: 2 });
  caption(ctx, tx + tw * 0.62, ty + th * 0.48 + 12, "heater", theme, { align: "center", size: 9, color: theme.inkSoft });
  metal(ctx, tx + tw * 0.52, ty + th * 0.6, tw * 0.26, 6, "#6b7684", { radius: 3 });
  caption(ctx, tx + tw * 0.65, ty + th * 0.6 + 13, "light bar", theme, { align: "center", size: 9, color: theme.inkSoft });

  // Media basket and a small heap of gravel.
  plastic(ctx, tx + tw * 0.06, ty + th * 0.72, tw * 0.14, th * 0.18, "#3b5b8c", { radius: 4, gloss: 0.3 });
  for (let i = 0; i < 12; i++) {
    sphere(ctx, tx + tw * (0.08 + hash(i, 11) * 0.1), ty + th * (0.76 + hash(i, 12) * 0.1),
      2.2, "#c9ced6", { rim: false });
  }
  caption(ctx, tx + tw * 0.13, ty + th * 0.72 + th * 0.18 + 10, "media", theme, { align: "center", size: 9, color: theme.inkSoft });
  ctx.fillStyle = dark ? "#4a443c" : "#8a7a62";
  ctx.beginPath();
  ctx.ellipse(tx + tw * 0.32, ty + th * 0.84, tw * 0.08, th * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  caption(ctx, tx + tw * 0.32, ty + th * 0.93, "gravel", theme, { align: "center", size: 9, color: theme.inkSoft });

  // Plants lying flat, out of water, wilting slightly.
  ctx.save();
  ctx.translate(tx + tw * 0.44, ty + th * 0.8);
  ctx.rotate(Math.PI / 2.2);
  plant(ctx, 0, 0, th * 0.22, "kelp", theme, { health: 0.55, seed: 5, sway: 0 });
  ctx.restore();

  // The fish, alive and fine, in their transport jar — coupled to nothing.
  const jw = tw * 0.16, jh = th * 0.42;
  specimenJar(ctx, tx + tw * 0.8, ty + th * 0.5, jw, jh, theme, "FISH", (cx2, cy2, cw2, ch2) => {
    const n = Math.min(3, Math.max(1, aliveCount(state.fish) || 1));
    for (let i = 0; i < n; i++) {
      creature(ctx, cx2 + cw2 * (0.3 + 0.2 * i), cy2 + ch2 * (0.45 + 0.18 * Math.sin(time * 0.8 + i * 2)),
        ch2 * 0.16, "fish", i % 2 === 0 ? 1 : -1, theme, { motion: (time * 0.5 + i * 0.3) % 1, shadow: false });
    }
  });
  ctx.restore();

  // Unplugged strip: everything present, nothing joined.
  drawPowerStrip(rc, L, { assembled: 0, pump: 0, heater: 0, light: 0 }, {
    pumpAt: { x: px + tw * 0.08, y: py + th * 0.16 },
    heaterAt: { x: tx + tw * 0.62, y: ty + th * 0.5 },
    lightAt: { x: tx + tw * 0.65, y: ty + th * 0.62 },
  });
}

/* ---- the stock-and-flow overlay ------------------------------------ */

interface Node { x: number; y: number; label: string }

/**
 * The translucent pipe-and-valve mirror of the live model. Pipe width scales
 * with the very flow numbers the engine integrated this tick; a zero flow is
 * a grey pipe with a closed valve. In the heap, every valve is shut.
 */
function drawFlowPanel(rc: RenderContext<State>, L: Layout) {
  const { ctx, state, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const x = L.panelX, y = L.panelY, w = L.panelW, h = L.panelH;

  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.78)" : "rgba(255,255,255,0.82)";
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 12, y + 16, "STOCKS & FLOWS", theme, { size: 11, weight: 800, color: theme.inkSoft });

  const P = (fx: number, fy: number) => ({ x: x + w * fx, y: y + 24 + (h - 34) * fy });
  const parts: Record<string, Node> = {
    fish: { ...P(0.14, 0.05), label: "fish" },
    food: { ...P(0.4, 0.05), label: "food" },
    pump: { ...P(0.84, 0.05), label: "pump" },
    media: { ...P(0.62, 0.4), label: "media" },
    plants: { ...P(0.62, 0.72), label: "plants" },
    heater: { ...P(0.46, 0.93), label: "heater" },
    light: { ...P(0.2, 0.93), label: "light" },
  };
  const tanks: Record<string, Node & { level: number; color: string; text: string }> = {
    ammonia: { ...P(0.22, 0.28), label: "ammonia", level: clamp01(state.ammonia / 2), color: theme.sci["acid"], text: num(state.ammonia) },
    nitrite: { ...P(0.22, 0.52), label: "nitrite", level: clamp01(state.nitrite / 2), color: theme.sci["acceleration"], text: num(state.nitrite) },
    nitrate: { ...P(0.22, 0.76), label: "nitrate", level: clamp01(state.nitrate / 40), color: theme.sci["producer"], text: num(state.nitrate, 1) },
    oxygen: { ...P(0.85, 0.5), label: "oxygen", level: clamp01(state.oxygen / 10), color: theme.sci["cold"], text: num(state.oxygen, 1) },
    heat: { ...P(0.82, 0.88), label: "heat", level: clamp01((state.temp - 15) / 17), color: theme.sci["hot"], text: `${num(state.temp, 1)} C` },
  };

  // Pipes, each wired to one live flow index. Order matches FLOW_DEFS.
  const runs: { i: number; pts: { x: number; y: number }[]; color: string }[] = [
    { i: 0, pts: [{ x: parts.food.x, y: y + 12 }, parts.food], color: theme.sci["mass"] },
    { i: 1, pts: [parts.fish, tanks.ammonia], color: theme.sci["acid"] },
    { i: 2, pts: [parts.food, tanks.ammonia], color: theme.sci["acid"] },
    { i: 3, pts: [parts.pump, parts.media], color: theme.sci["velocity"] },
    { i: 4, pts: [tanks.ammonia, tanks.nitrite], color: theme.sci["acceleration"] },
    { i: 5, pts: [tanks.nitrite, tanks.nitrate], color: theme.sci["producer"] },
    { i: 6, pts: [tanks.nitrate, parts.plants], color: theme.sci["producer"] },
    { i: 7, pts: [parts.plants, tanks.oxygen], color: theme.sci["cold"] },
    { i: 8, pts: [parts.pump, tanks.oxygen], color: theme.sci["cold"] },
    { i: 9, pts: [tanks.oxygen, { x: parts.fish.x + w * 0.06, y: parts.fish.y + 8 }], color: theme.sci["cold"] },
    { i: 10, pts: [tanks.oxygen, parts.media], color: theme.sci["cold"] },
    { i: 11, pts: [parts.heater, tanks.heat], color: theme.sci["hot"] },
    { i: 12, pts: [parts.light, { x: parts.plants.x - 8, y: parts.plants.y + 6 }], color: theme.sci["light"] },
  ];

  for (const run of runs) {
    const mag = state.flows[run.i] ?? 0;
    const norm = clamp01(mag / FLOW_NOMINAL[run.i]);
    const open = mag > 1e-9;
    if (open) {
      dashFlow(ctx, run.pts, run.color, time * (18 + norm * 40), {
        width: 1.5 + norm * 4.5, dash: 5, gap: 6, alpha: 0.5 + norm * 0.45,
      });
    } else {
      // A closed line, drawn thin and grey: the coupling exists, nothing moves.
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.3);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(run.pts[0].x, run.pts[0].y);
      for (let k = 1; k < run.pts.length; k++) ctx.lineTo(run.pts[k].x, run.pts[k].y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    // The valve at the midpoint: open valves show their colour, shut ones grey
    // out with a bar across — the spec's "valves close to grey".
    const a = run.pts[0], b = run.pts[run.pts.length - 1];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    sphere(ctx, mx, my, 4, open ? run.color : mixHex(theme.inkSoft, theme.surface, 0.4), { rim: false });
    if (!open) {
      ctx.strokeStyle = theme.surface;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mx - 3, my);
      ctx.lineTo(mx + 3, my);
      ctx.stroke();
    }
  }

  // Stock tanks over the pipes: little vessels with a live level and value.
  for (const t of Object.values(tanks)) {
    const tw2 = Math.max(34, w * 0.13), th2 = Math.max(26, h * 0.085);
    const bx = t.x - tw2 / 2, by = t.y - th2 / 2;
    ctx.fillStyle = dark ? "rgba(18,24,32,0.9)" : "rgba(250,252,254,0.95)";
    roundRect(ctx, bx, by, tw2, th2, 5);
    ctx.fill();
    if (t.level > 0.005) {
      ctx.fillStyle = hexA(t.color, 0.75);
      const lh = (th2 - 4) * clamp01(t.level);
      roundRect(ctx, bx + 2, by + th2 - 2 - lh, tw2 - 4, lh, 3);
      ctx.fill();
    }
    ctx.strokeStyle = hexA(t.color, 0.8);
    ctx.lineWidth = 1.2;
    roundRect(ctx, bx, by, tw2, th2, 5);
    ctx.stroke();
    caption(ctx, t.x, by - 7, t.label, theme, { align: "center", size: 9, weight: 700, color: theme.inkSoft });
    ctx.save();
    ctx.font = MONO;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.ink;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
  // Part chips.
  for (const p of Object.values(parts)) {
    const pw = Math.max(30, w * 0.11);
    ctx.fillStyle = dark ? "rgba(30,38,48,0.9)" : "rgba(238,242,246,0.95)";
    roundRect(ctx, p.x - pw / 2, p.y - 9, pw, 18, 9);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1;
    roundRect(ctx, p.x - pw / 2, p.y - 9, pw, 18, 9);
    ctx.stroke();
    caption(ctx, p.x, p.y, p.label, theme, { align: "center", size: 9, weight: 700 });
  }
  // Colony readout rides with the media chip — the invisible stock, counted.
  caption(ctx, parts.media.x, parts.media.y + 16, `colony ${Math.round(((state.bacteriaA + state.bacteriaN) / 2) * 100)}%`, theme, {
    align: "center", size: 9, color: theme.sci["decomposer"], weight: 700,
  });
  const loose = params.looseParts === true;
  if (loose) {
    caption(ctx, x + w / 2, y + h - 14, "every valve shut — the parts share nothing", theme, {
      align: "center", size: 10, color: theme.sci["hot"], weight: 700,
    });
  }
}

/* ---- graph, health bars, badges ------------------------------------ */

/** Ammonia, nitrite and nitrate on shared axes — the cycling curve itself. */
function drawGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.8)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const n = state.histMin.length;
  if (n < 2) {
    caption(ctx, x + w / 2, y + h / 2, "run the tank to draw the water-test graph", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
    return;
  }
  let max = 0.5;
  for (let i = 0; i < n; i++) {
    if (state.histA[i] > max) max = state.histA[i];
    if (state.histNi[i] > max) max = state.histNi[i];
    if (state.histNa[i] > max) max = state.histNa[i];
  }
  max *= 1.15;
  const t0 = state.histMin[0], t1 = Math.max(state.histMin[n - 1], t0 + 60);
  const px = (i: number) => x + 6 + ((state.histMin[i] - t0) / (t1 - t0)) * (w - 12);
  const py = (v: number) => y + h - 5 - (Math.min(v, max) / max) * (h - 14);

  // The 0.25 mg/L danger line: the number the whole failure story turns on.
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["acid"], 0.4);
  ctx.setLineDash([4, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 6, py(AMMONIA_SAFE));
  ctx.lineTo(x + w - 6, py(AMMONIA_SAFE));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  caption(ctx, x + w - 8, py(AMMONIA_SAFE) - 7, "0.25 safe limit", theme, {
    align: "right", size: 8, color: theme.sci["acid"],
  });

  const series: [number[], string, string][] = [
    [state.histA, theme.sci["acid"], "ammonia"],
    [state.histNi, theme.sci["acceleration"], "nitrite"],
    [state.histNa, theme.sci["producer"], "nitrate"],
  ];
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  for (const [data, color] of series) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i === 0) ctx.moveTo(px(i), py(data[i]));
      else ctx.lineTo(px(i), py(data[i]));
    }
    ctx.stroke();
    sphere(ctx, px(n - 1), py(data[n - 1]), 2.6, color, { rim: false });
  }
  ctx.restore();
  let lx = x + 10;
  for (const [, color, name] of series) {
    sphere(ctx, lx, y + 11, 3, color, { rim: false });
    caption(ctx, lx + 7, y + 11, name, theme, { size: 9, color: theme.inkSoft });
    lx += 16 + name.length * 5;
  }
  caption(ctx, x + w - 8, y + 11, `day ${(t0 / 1440).toFixed(0)}-${(t1 / 1440).toFixed(1)} · mg/L`, theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });
}

/** One bar per fish, red below 40 — the spec's health index, verbatim. */
function drawHealthBars(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.8)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 11, "FISH HEALTH", theme, { size: 9, weight: 800, color: theme.inkSoft });

  const fishes = state.fish;
  const barMax = h - 30;
  if (fishes.length === 0) {
    caption(ctx, x + w / 2, y + h / 2 + 4, "no fish stocked", theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }
  const bw = Math.min(12, (w - 16) / Math.max(1, fishes.length) - 3);
  for (let i = 0; i < fishes.length; i++) {
    const f = fishes[i];
    const bx = x + 8 + i * (bw + 3);
    ctx.fillStyle = hexA(theme.grid, 0.7);
    roundRect(ctx, bx, y + 18, bw, barMax, 2);
    ctx.fill();
    const hVal = f.alive ? f.health : 0;
    const hh = Math.max(1.5, (hVal / 100) * barMax);
    // Red below 40, amber to 70, healthy green above — thresholds, not vibes.
    const color = !f.alive ? theme.inkSoft : hVal < 40 ? theme.sci["hot"] : hVal < STRESS_VISIBLE ? theme.sci["acceleration"] : theme.sci["neutral"];
    ctx.fillStyle = color;
    roundRect(ctx, bx, y + 18 + barMax - hh, bw, hh, 2);
    ctx.fill();
  }
  const deaths = state.deathsAmmonia + state.deathsOxygen + state.deathsChill;
  if (deaths > 0) {
    const parts: string[] = [];
    if (state.deathsAmmonia) parts.push(`${state.deathsAmmonia} to ammonia`);
    if (state.deathsOxygen) parts.push(`${state.deathsOxygen} to low oxygen`);
    if (state.deathsChill) parts.push(`${state.deathsChill} to cold`);
    caption(ctx, x + 8, y + h - 8, `lost: ${parts.join(", ")}`, theme, {
      size: 9, color: theme.sci["hot"], weight: 700,
    });
  }
  ctx.restore();
}

/** The wand that follows the pointer, reading the water where it dips. */
function drawProbe(rc: RenderContext<State>, L: Layout) {
  const { ctx, state, theme } = rc;
  const pxr = state.probeX, pyr = state.probeY;
  if (pxr < 0 || pyr < 0) return;
  const inWater =
    pxr > L.tankX && pxr < L.tankX + L.tankW && pyr > L.waterY && pyr < L.benchY;

  // The wand: a slim rod with a sensing ring at the tip.
  ctx.save();
  ctx.strokeStyle = mixHex(theme.ink, theme.surface, 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pxr + 26, pyr - 34);
  ctx.lineTo(pxr + 4, pyr - 4);
  ctx.stroke();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pxr, pyr, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (!inWater) return;
  // Local sampling: the stocks are uniform (spec), but oxygen genuinely is
  // richer near the rippling surface and near pearling leaves, so the wand
  // shows that texture without inventing chemistry the model does not do.
  const depth = clamp01((pyr - L.waterY) / (L.benchY - L.waterY));
  let o2 = state.oxygen * (1 + 0.05 * (1 - depth) * (state.flows[8] > 0.1 ? 1 : 0.3));
  for (const p of state.plants) {
    const pos = inTank(L, p.x, 0.7);
    const d = Math.hypot(pos.x - pxr, pos.y - pyr);
    if (d < L.tankH * 0.3 && state.flows[7] > 1e-9) o2 += 0.15 * (1 - d / (L.tankH * 0.3));
  }
  const lines = [
    `NH3 ${num(state.ammonia)}  NO2 ${num(state.nitrite)}`,
    `NO3 ${num(state.nitrate, 1)}  O2 ${num(Math.min(12, o2), 1)}`,
    `temp ${num(state.temp, 1)} C`,
  ];
  const bw = 132, bh = 46;
  const bx = Math.min(pxr + 14, rc.width - bw - 4), by = Math.max(4, pyr - bh - 12);
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(12,17,24,0.88)" : "rgba(255,255,255,0.92)";
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.accent, 0.6);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = MONO;
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.ink;
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], bx + 8, by + 10 + i * 14);
  ctx.restore();
}

/* ---- main render ---------------------------------------------------- */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const gates = gatesFor(params);
  const loose = gates.assembled === 0;
  const view = params.view as string;
  const showGraph = overlays.graph !== false;
  const graphH = showGraph ? Math.round(height * 0.24) : 0;
  const stageH = height - graphH - (showGraph ? 6 : 0);
  const L = layout(width, stageH, view, loose);
  const lit = lightIsOn(params, gates, clockHours(state.min));

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, stageH);
  ctx.clip();
  benchStage(ctx, width, stageH, theme);
  if (view !== "flows") {
    if (loose) drawTray(rc, L);
    else drawTank(rc, L, gates, lit);
  }
  if (view !== "tank") drawFlowPanel(rc, L);

  /* --- verdicts: day clock, system check, active flows -------------- */
  const day = Math.floor(state.min / 1440);
  const clockH = clockHours(state.min);
  const hh = Math.floor(clockH).toString().padStart(2, "0");
  const mm = Math.floor((clockH % 1) * 60).toString().padStart(2, "0");
  badge(ctx, 12, 20, `Day ${day} · ${hh}:${mm}`, theme, { color: theme.accent });

  const alive = aliveCount(state.fish);
  let mean = 0;
  for (const f of state.fish) if (f.alive) mean += f.health;
  mean = alive > 0 ? mean / alive : 0;
  const flowsActive = activeFlowCount(state.flows);
  const partsOk = !loose && alive > 0;
  const functionOk = alive > 0 && state.ammonia < AMMONIA_SAFE && state.oxygen > O2_FLOOR && mean > 50;
  const verdict = loose ? "HEAP — parts, no couplings"
    : !partsOk ? "NO LIVING FUNCTION"
    : flowsActive >= 6 && functionOk ? "SYSTEM — function maintained"
    : "SYSTEM FAILING";
  badge(ctx, width / 2, 20, verdict, theme, {
    align: "center",
    color: loose ? theme.inkSoft : partsOk && functionOk && flowsActive >= 6 ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, width - 12, 20, `${flowsActive}`, theme, { align: "right", color: theme.sci["field"], sub: "active flows" });

  if (state.changeFlash > 0 && !loose) {
    badge(ctx, width / 2, 46, `${Math.round((params.waterChange as number) * 100)}% water changed`, theme, {
      align: "center", color: theme.sci["cold"],
    });
  }
  if (!loose && state.ammonia >= AMMONIA_SAFE) {
    badge(ctx, 12, stageH - 18, `ammonia over ${AMMONIA_SAFE} mg/L`, theme, { color: theme.sci["acid"] });
  }
  if (!loose && state.oxygen <= O2_FLOOR) {
    badge(ctx, 12, stageH - (state.ammonia >= AMMONIA_SAFE ? 44 : 18), "oxygen under 4 mg/L", theme, {
      color: theme.sci["cold"],
    });
  }

  if (view !== "flows" && !loose) {
    const hw = Math.min(170, width * 0.22);
    drawHealthBars(rc, width - hw - 10, stageH - 84, hw, 74);
  }
  drawProbe(rc, L);
  vignette(ctx, width, stageH, 0.14);
  ctx.restore();

  if (showGraph) drawGraph(rc, 0, stageH + 6, width, graphH - 6);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const K = 273.15; // param temperatures are stored in kelvin, shown in °C
const HOUR_S = 3600; // the light-hours param is stored in SI seconds

/** Every lab starts from a fully described bench, never an inherited one. */
const BASE_SETUP: ParamValues = {
  pumpPlugged: true, heaterPlugged: true, lightPlugged: true,
  media: "mature", heaterSet: 25 + K, lightHours: 8 * HOUR_S,
  fishStocked: 6, feeding: 1.5, plants: 5, waterChange: 0.25,
  timeComp: 5000, view: "both", looseParts: false,
};

export const unplugAquariumSim: SimManifest<State> = {
  id: "g6.a1-1",
  title: "Unplug the Aquarium",
  tagline: "Run a living tank, pull one plug, and trace the failure from the dead impeller to the first stressed fish.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-3"] },
  learningGoals: [
    "Say what turns a collection of parts into a system: parts, interactions, and a function they maintain together.",
    "Trace a failure through a chain of couplings instead of blaming the part that broke.",
    "Read ammonia, nitrite and nitrate as one nitrogen story with bacteria and plants in the middle of it.",
  ],
  misconceptions: [
    "A system is just a group of related things",
    "The filter keeps fish alive directly, like a machine part",
    "If every part is present, the thing works",
    "Removing one part only affects that part",
  ],
  interactionHint: "Sweep the pointer through the water to dip the test probe, then unplug the pump.",
  tickRate: 30,
  timeScale: 1,
  params: {
    pumpPlugged: {
      type: "boolean", label: "Power: pump", default: true,
      help: "Unplugging stops flow through the filter media and stills the surface.",
    },
    heaterPlugged: {
      type: "boolean", label: "Power: heater", default: true,
      help: "Unplugged, the water relaxes to the 19 °C room over about 4 hours.",
    },
    lightPlugged: {
      type: "boolean", label: "Power: light", default: true,
      help: "No light, no photosynthesis — plants stop making oxygen or taking nitrate.",
    },
    media: {
      type: "option", label: "Filter media",
      options: [
        { value: "mature", label: "Mature seeded media" },
        { value: "sterile", label: "New sterile sponge" },
        { value: "none", label: "None" },
      ],
      default: "mature",
      help: "How much nitrifying bacteria the cartridge starts with, from full to zero.",
    },
    heaterSet: {
      type: "number", label: "Heater setpoint", kind: "temperature", unit: "°C",
      min: 18 + K, max: 30 + K, step: 0.5, default: 25 + K,
      help: "The thermostat's target. Watch the duty light cycle around it.",
    },
    lightHours: {
      type: "number", label: "Light hours", kind: "time", unit: "h",
      min: 0, max: 16 * HOUR_S, step: 0.5 * HOUR_S, default: 8 * HOUR_S,
      help: "The daily photosynthesis window, centred on midday.",
    },
    fishStocked: {
      type: "number", label: "Fish stocked", kind: "count",
      min: 0, max: 12, step: 1, default: 6,
      help: "More fish means more ammonia in and more oxygen out.",
    },
    feeding: {
      type: "number", label: "Feeding rate (g/day)", kind: "ratio",
      min: 0, max: 4, step: 0.1, default: 1.5,
      help: "What the fish do not eat rots into ammonia over 8 hours.",
    },
    plants: {
      type: "number", label: "Plants", kind: "count",
      min: 0, max: 10, step: 1, default: 5,
      help: "Vallisneria clumps: nitrate drawdown and daytime oxygen.",
    },
    waterChange: {
      type: "number", label: "Weekly water change", kind: "percent", unit: "%",
      min: 0, max: 0.5, step: 0.05, default: 0.25,
      help: "Once each simulated week, this fraction of the water is replaced.",
    },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1, max: 5000, step: 1, default: 1000,
      marks: [
        { value: 1, label: "1x" },
        { value: 1000, label: "1000x" },
        { value: 5000, label: "5000x" },
      ],
      help: "How many simulated seconds pass per real second. The chemistry is identical at every setting.",
    },
    view: {
      type: "option", label: "Overlay mode",
      options: [
        { value: "tank", label: "Tank only" },
        { value: "flows", label: "Stocks and flows" },
        { value: "both", label: "Both" },
      ],
      default: "both",
      help: "The pipe-and-valve diagram mirrors the live model, never a cartoon of it.",
    },
    looseParts: {
      type: "boolean", label: "Loose parts tray", default: false,
      help: "Every identical part on the bench, none connected: every coupling is genuinely zero.",
    },
  },
  overlays: [
    { key: "graph", label: "Water tests graph", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "running-tank",
      title: "A running tank",
      question: "Over 14 days, which stocks hold steady and which drift — and which parts are doing that?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you run: two weeks pass in a healthy tank.",
          predict: {
            prompt: "Which water test will have climbed the most by day 14?",
            options: ["Ammonia", "Nitrite", "Nitrate"],
            correct: 2,
            reveal:
              "Nitrate. The bacteria pass nitrogen down the chain as fast as the fish make it, so ammonia and nitrite stay near zero while nitrate — the end of the line — slowly piles up.",
          },
        },
        {
          id: "day1",
          phase: "measure",
          title: "Test on day 1",
          instruction: "Play to the end of day 1 and record ammonia, nitrite, nitrate and oxygen.",
          requireData: 1,
          check: { describe: "Day 1 reached", test: (v) => (v.facts.day as number) >= 1 },
          hints: ["The record button snapshots every readout at once."],
        },
        {
          id: "day7",
          phase: "measure",
          title: "Test on day 7",
          instruction: "Run on to day 7 — a water change will happen on the way — and record again.",
          requireData: 2,
          check: { describe: "Day 7 reached", test: (v) => (v.facts.day as number) >= 7 },
          hints: ["Watch the nitrate trace dip when the water change fires."],
        },
        {
          id: "day14",
          phase: "measure",
          title: "Test on day 14",
          instruction: "Reach day 14 with the system check still green, and record a third row.",
          requireData: 3,
          check: {
            describe: "Day 14 reached with the function maintained",
            test: (v) => (v.facts.day as number) >= 14 && v.facts.systemOk === true,
          },
          hints: ["If the check goes red, read which meter crossed its line first."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the couplings",
          instruction: "Use your three rows to name parts that change each other.",
          write: {
            prompt: "Name three pairs of parts where one affects the other, and say through which stock.",
            placeholder: "The fish change ... which the ... turns into ... which the plants ...",
          },
        },
      ],
    },
    {
      id: "pull-the-plug",
      title: "Pull the plug",
      question: "Only the pump is unplugged. How does that reach fish the pump never touches?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, pumpPlugged: false, timeComp: 1000 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the first failure",
          instruction: "The impeller is dead and nothing else changed. Choose what goes wrong first.",
          predict: {
            prompt: "Which meter crosses its danger line first?",
            options: [
              "Temperature — the water cools",
              "Ammonia — it climbs past 0.25 mg/L",
              "Nitrate — it spikes",
            ],
            correct: 1,
            reveal:
              "Ammonia. No flow means the media's bacteria stop receiving water to clean and begin to starve, so the fish's own waste backs up — hours before the still surface lets oxygen sag.",
          },
        },
        {
          id: "cross",
          phase: "measure",
          title: "Record the crossing hour",
          instruction: "Run until ammonia first crosses 0.25 mg/L and note the hour it happens.",
          requireData: 1,
          check: {
            describe: "Ammonia has crossed 0.25 mg/L",
            test: (v) => (v.facts.ammoniaCrossHour as number) >= 0,
          },
          hints: [
            "The dashed line on the graph is the 0.25 limit.",
            "Watch the filter colony percentage fall in the overlay while you wait.",
          ],
        },
        {
          id: "stress",
          phase: "measure",
          title: "The first stressed fish",
          instruction: "Keep running until a fish first loses its colour, and note that hour too.",
          check: {
            describe: "A fish has shown stress colour",
            test: (v) => (v.facts.firstStressHour as number) >= 0,
          },
          hints: ["Stress shows when a health bar drops below 70."],
        },
        {
          id: "cascade",
          phase: "analyze",
          title: "Follow it to the end",
          instruction: "Let the cascade finish for one fish. The model names every loss's cause.",
          check: {
            describe: "A death has been recorded, with its cause",
            test: (v) =>
              (v.facts.firstDeathHour as number) >= 0 &&
              (v.facts.deathsAmmonia as number) + (v.facts.deathsOxygen as number) >= 1,
          },
          hints: ["The health panel lists what each fish was lost to."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Trace the chain",
          instruction: "Write the chain, link by link, from the dead impeller to that fish.",
          write: {
            prompt: "Trace it: impeller, flow, bacteria, ammonia, gills. Where could you have broken the chain?",
            placeholder: "The impeller stopped, so ... so ... so the fish ...",
          },
        },
      ],
    },
    {
      id: "heap-of-parts",
      title: "A heap of parts",
      question: "Every component is on the bench and none is connected. Is this an aquarium?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-LS2-3"],
      setup: {
        ...BASE_SETUP, looseParts: true, pumpPlugged: false, heaterPlugged: false,
        lightPlugged: false, media: "none", fishStocked: 0, plants: 0,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the tray",
          instruction: "All the parts sit in the tray for a simulated week. Commit to a prediction.",
          predict: {
            prompt: "What will the ammonia test read after 7 days on the tray?",
            options: [
              "It climbs, like in a running tank",
              "It stays at exactly zero",
              "It rises then falls as bacteria catch up",
            ],
            correct: 1,
            reveal:
              "Exactly zero. Nothing feeds anything, nothing flows through anything, nothing warms anything. Parts without interactions produce no behaviour at all — that is what makes them a heap.",
          },
        },
        {
          id: "week",
          phase: "measure",
          title: "Give it a week",
          instruction: "Record a row now, run 7 simulated days, and record again. Compare.",
          requireData: 2,
          check: {
            describe: "Seven days passed with zero active flows and zero ammonia",
            test: (v) =>
              (v.facts.day as number) >= 7 &&
              (v.facts.activeFlows as number) === 0 &&
              (v.facts.ammonia as number) === 0,
          },
          hints: ["The flow counter is the measurement that matters here."],
        },
        {
          id: "assemble",
          phase: "setup",
          title: "Assemble it",
          instruction: "Leave the tray: turn Loose parts off and plug in the pump. Watch the flow counter.",
          check: {
            describe: "Assembled with the pump running and flows appearing",
            test: (v) => v.facts.loose === false && v.facts.pumpOn === true && (v.facts.activeFlows as number) >= 4,
          },
          hints: ["Each part you connect should add arrows to the overlay — count them."],
        },
        {
          id: "stock",
          phase: "measure",
          title: "Connect the living parts",
          instruction: "Add media, fish and plants, and record the flow count as each joins.",
          requireData: 3,
          check: {
            describe: "Fish and plants in, most couplings alive",
            test: (v) =>
              (v.facts.fishAlive as number) >= 6 && (v.params.plants as number) >= 1 &&
              (v.facts.activeFlows as number) >= 8,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what was missing",
          instruction: "Same parts both times. Say precisely what the tray lacked.",
          write: {
            prompt: "The tray held every part of a working aquarium and did nothing. What exactly was missing?",
            placeholder: "Not parts — the tray had all of them. What it lacked was ...",
          },
        },
      ],
    },
    {
      id: "new-tank-syndrome",
      title: "New tank syndrome",
      question: "The filter runs from minute one — so why does ammonia still spike?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-3"],
      setup: { ...BASE_SETUP, media: "sterile", fishStocked: 12, feeding: 3.0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the spike",
          instruction: "Twelve fish, heavy feeding, a brand new sponge. The pump spins from the first minute.",
          predict: {
            prompt: "The filter is on, so why would ammonia spike anyway?",
            options: [
              "The pump is too weak for twelve fish",
              "The bacteria colony is not grown yet — the filter is plumbing without workers",
              "The food dissolves too fast for any filter",
            ],
            correct: 1,
            reveal:
              "A filter is only as good as the colony living in it. Nitrifiers double roughly every 20 hours, so for days the sponge is plumbing without workers — the spike lasts until the colony has grown to match the bioload.",
          },
        },
        {
          id: "spike",
          phase: "measure",
          title: "Catch the spike",
          instruction: "Run and record the ammonia peak. Watch the biofilm on the gravel darken as the colony grows.",
          requireData: 1,
          check: {
            describe: "Ammonia has peaked above 0.5 mg/L",
            test: (v) => (v.facts.ammoniaPeak as number) >= 0.5,
          },
          hints: ["The colony percentage in the overlay is the thing to watch alongside ammonia."],
        },
        {
          id: "fall",
          phase: "measure",
          title: "Watch it fall",
          instruction: "Keep running until ammonia is back under 0.25 mg/L. Nothing but grown bacteria brings it down.",
          requireData: 2,
          check: {
            describe: "Ammonia back under 0.25 with a grown colony",
            test: (v) =>
              (v.facts.ammoniaPeak as number) >= 0.5 &&
              (v.facts.ammonia as number) < 0.25 &&
              (v.facts.colonyA as number) >= 0.1,
          },
          hints: [
            "Days pass before the colony catches up — that is the 20 h doubling time.",
            "A 50% water change and lighter feeding protect the fish while you wait. Try it.",
          ],
        },
        {
          id: "sequence",
          phase: "analyze",
          title: "The second hump",
          instruction: "Look at the graph: nitrite spikes after ammonia. Explain the order.",
          write: {
            prompt: "Why does the nitrite hump come after the ammonia hump, not with it?",
            placeholder: "The bacteria that eat nitrite can only grow after ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What had to grow",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "The filter ran from minute one. What actually had to grow before ammonia could fall?",
            placeholder: "Not the machine — the ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "three-parts",
      title: "Survive on three parts",
      brief: "Keep every fish alive for 14 days using at most three of: pump, heater, light, media, plants.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Day 14, no fish lost, at most 3 optional parts connected",
        test: (v) =>
          (v.facts.day as number) >= 14 && (v.facts.fishDead as number) === 0 &&
          (v.facts.fishAlive as number) >= 6 && (v.facts.partCount as number) <= 3,
      },
      stars: {
        two: {
          describe: "Also finish with nitrate under 20 mg/L",
          test: (v) =>
            (v.facts.day as number) >= 14 && (v.facts.fishDead as number) === 0 &&
            (v.facts.fishAlive as number) >= 6 && (v.facts.partCount as number) <= 3 &&
            (v.facts.nitrate as number) < 20,
        },
        three: {
          describe: "And the shoal averages 90+ health at day 14",
          test: (v) =>
            (v.facts.day as number) >= 14 && (v.facts.fishDead as number) === 0 &&
            (v.facts.fishAlive as number) >= 6 && (v.facts.partCount as number) <= 3 &&
            (v.facts.meanHealth as number) >= 90,
        },
      },
      hints: [
        "Ask which couplings the fish cannot live without, not which parts look important.",
        "The water change is not a part — use it.",
        "A 19 °C room is slowly too cold for danios. That rules one choice in.",
      ],
    },
    {
      id: "cycle-no-losses",
      title: "Cycle without casualties",
      brief: "Start the twelve-fish sterile-sponge tank and get the colony grown with zero deaths.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, media: "sterile", fishStocked: 12, feeding: 3.0 },
      goal: {
        describe: "Colony past 50% by day 14 with no fish lost",
        test: (v) =>
          (v.facts.day as number) >= 14 && (v.facts.colonyA as number) >= 0.5 &&
          (v.facts.fishDead as number) === 0 && (v.facts.fishAlive as number) >= 12,
      },
      stars: {
        two: {
          describe: "No fish ever dropped below 60 health",
          test: (v) =>
            (v.facts.day as number) >= 14 && (v.facts.colonyA as number) >= 0.5 &&
            (v.facts.fishDead as number) === 0 && (v.facts.fishAlive as number) >= 12 &&
            (v.facts.minHealthEver as number) >= 60,
        },
      },
      hints: [
        "You cannot make bacteria grow faster — you can only make the wait survivable.",
        "Feeding drives the spike. The fish will forgive a lean fortnight.",
        "Big weekly water changes shave the peak without starving the colony.",
      ],
    },
  ],
};
