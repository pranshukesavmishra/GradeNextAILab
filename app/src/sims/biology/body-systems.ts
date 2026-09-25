import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import { badge, caption, glow, hexA, sky, sphere, vignette } from "@ui/scene";

/**
 * Body Systems at Work — Grades 5-10.
 *
 * A whole human body with six systems laid over it, each one switchable, and
 * an activity dial that takes the body from lying still to a full sprint. The
 * point of the sim is the coupling: raise the activity and the heart rate, the
 * breathing rate, the stroke volume and the oxygen demand all move together,
 * because they are computed from one another rather than from a lookup table.
 *
 * The physiology is real and checkable:
 *   · one MET is 3.5 mL of oxygen per kilogram per minute, by definition
 *   · maximum heart rate is about 220 minus your age
 *   · cardiac output = heart rate × stroke volume
 *   · Fick's principle: oxygen used = cardiac output × the a-v oxygen difference,
 *     which lands near 50 mL/L at rest and near 130 mL/L flat out — exactly
 *     where a physiology textbook puts it
 *   · at rest your entire blood volume goes round about once a minute
 *
 * Nothing is scripted. Blocking one system starves the others through the same
 * equations, which is the Grade 6 B5 idea — systems only work together.
 */

/* ------------------------------------------------------------------ *
 * Physiological constants
 * ------------------------------------------------------------------ */

/** One metabolic equivalent: 3.5 mL O₂ per kg per minute. This is the definition. */
export const MET_ML_PER_KG_MIN = 3.5;
/** The classic field estimate of maximum heart rate. */
export const HR_MAX_CONSTANT = 220;
/** A typical resting heart rate for a schoolchild; adults sit nearer 70. */
const HR_REST = 75;
/** Stroke volume scales with body size: about 1 mL per kg at rest. */
const SV_REST_PER_KG = 0.95;
const SV_MAX_PER_KG = 1.55;
/** Stroke volume stops rising at roughly 45% of maximum oxygen uptake. */
const SV_PLATEAU_AT = 0.45;

const RR_REST = 16;          // breaths per minute, at rest, for a child
const RR_MAX = 52;
const TV_REST_PER_KG = 0.0067; // litres per kg — 6.7 mL/kg tidal volume
const TV_MAX_PER_KG = 0.035;

/** Inspired air is 21% O₂ and expired air about 16.8%, so 42 mL comes out of each litre. */
const O2_ML_PER_L_AIR = 42;
/** The most oxygen blood will give up per litre, near maximal exercise. */
const MAX_EXTRACTION_ML_PER_L = 160;
/** Blood volume is about 71 mL per kilogram of body mass. */
const BLOOD_L_PER_KG = 0.071;
/** The activity dial's top end, used to scale everything to %VO₂max. */
export const METS_MAX = 12;

/** Stored carbohydrate: roughly 5.5 g of glycogen per kg of body mass. */
const GLYCOGEN_G_PER_KG = 5.5;
/** Burning one litre of oxygen releases about 5 kcal; carbohydrate holds 4 kcal per gram. */
const G_CARB_PER_L_O2 = 5 / 4;
/** The gut absorbs carbohydrate at about 1 gram per minute, however fast you eat. */
const ABSORB_G_PER_MIN = 1.0;

/** Total oxygen the body has stored in blood and muscle, per kg. */
const O2_STORE_ML_PER_KG = 22;

/** First-order response times, in seconds. Oxygen kinetics really are ~30 s. */
const TAU_VO2 = 30;
const TAU_HR = 25;
const TAU_BREATH = 20;

/* ------------------------------------------------------------------ *
 * The steady state the body is heading for
 * ------------------------------------------------------------------ */

export interface Physiology {
  mets: number;
  fraction: number;      // fraction of maximum effort, 0..1
  hrMax: number;         // beats per minute
  heartRate: number;     // beats per minute
  strokeVolume: number;  // mL
  cardiacOutput: number; // L per minute
  vo2Demand: number;     // mL O₂ per minute
  avO2Diff: number;      // mL O₂ per litre of blood
  breathingRate: number; // breaths per minute
  tidalVolume: number;   // L
  ventilation: number;   // L per minute
  o2Capacity: number;    // mL O₂ per minute the lungs can supply
  deliveryCap: number;   // mL O₂ per minute the circulation can carry
  bloodVolume: number;   // L
  circulations: number;  // times the whole blood volume goes round per minute
}

/** Fraction of energy coming from carbohydrate — rises with intensity. */
function carbShare(fraction: number): number {
  return 0.3 + 0.7 * Math.min(1, fraction * 1.25);
}

export function physiology(params: ParamValues): Physiology {
  const mets = Math.max(1, params.activity as number);
  const age = params.age as number;
  const mass = params.mass as number;
  const blocked = params.blockSystem as string;

  // A blocked nervous system means no motor command reaches the muscle, so the
  // body cannot work harder no matter what the dial says.
  const effectiveMets = blocked === "nervous" ? 1 : mets;
  const fraction = Math.min(1, Math.max(0, (effectiveMets - 1) / (METS_MAX - 1)));

  const hrMax = HR_MAX_CONSTANT - age;
  const heartRate = HR_REST + (hrMax - HR_REST) * fraction;
  const svRest = SV_REST_PER_KG * mass;
  const svMax = SV_MAX_PER_KG * mass;
  const strokeVolume = svRest + (svMax - svRest) * Math.min(1, fraction / SV_PLATEAU_AT);
  let cardiacOutput = (heartRate * strokeVolume) / 1000;

  const vo2Demand = effectiveMets * MET_ML_PER_KG_MIN * mass;

  const breathingRate = RR_REST + (RR_MAX - RR_REST) * fraction;
  const tvRest = TV_REST_PER_KG * mass;
  const tvMax = TV_MAX_PER_KG * mass;
  const tidalVolume = tvRest + (tvMax - tvRest) * fraction;
  let ventilation = breathingRate * tidalVolume;

  // A blocked system does not vanish — it works badly, and everything
  // downstream of it feels the shortfall.
  if (blocked === "respiratory") ventilation *= 0.12;
  if (blocked === "circulatory") cardiacOutput *= 0.25;

  const bloodVolume = BLOOD_L_PER_KG * mass;

  return {
    mets: effectiveMets,
    fraction,
    hrMax,
    heartRate,
    strokeVolume,
    cardiacOutput,
    vo2Demand,
    avO2Diff: cardiacOutput > 0 ? vo2Demand / cardiacOutput : 0,
    breathingRate,
    tidalVolume,
    ventilation,
    o2Capacity: ventilation * O2_ML_PER_L_AIR,
    deliveryCap: cardiacOutput * MAX_EXTRACTION_ML_PER_L,
    bloodVolume,
    circulations: bloodVolume > 0 ? cardiacOutput / bloodVolume : 0,
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Packet {
  /** Which route it is travelling. */
  route: number;
  /** Progress along the route, 0..1. */
  s: number;
  /** Sideways offset so packets do not overlap into one thick line. */
  lane: number;
}

interface State {
  t: number;
  /** The actual values, lagging behind the steady state with real kinetics. */
  hr: number;
  rr: number;
  vo2: number;
  /** Oxygen stored in blood and muscle, mL. */
  o2Store: number;
  /** Oxygen the body owes back — the debt you repay by panting afterwards. */
  o2Debt: number;
  /** Stored carbohydrate, grams. */
  glycogen: number;
  packets: Packet[];
  emitClock: number[];
  /** Sampled history for the on-stage graphs. */
  histT: number[];
  histHr: number[];
  histRr: number[];
  histVo2: number[];
  sampleClock: number;
  peakHr: number;
  /** Seconds spent with demand unmet. */
  starvedFor: number;
}

const ROUTE_COUNT = 7;
const MAX_PACKETS = 110;
const HISTORY_MAX = 200;
const SAMPLE_SECONDS = 1.5;

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    const p = physiology(params);
    const mass = params.mass as number;
    return {
      t: 0,
      hr: HR_REST,
      rr: RR_REST,
      vo2: MET_ML_PER_KG_MIN * mass,
      o2Store: O2_STORE_ML_PER_KG * mass,
      o2Debt: 0,
      glycogen: GLYCOGEN_G_PER_KG * mass,
      packets: [],
      emitClock: new Array<number>(ROUTE_COUNT).fill(0),
      histT: [0],
      histHr: [HR_REST],
      histRr: [RR_REST],
      histVo2: [p.vo2Demand],
      sampleClock: 0,
      peakHr: HR_REST,
      starvedFor: 0,
    };
  },

  applyParams(state, params, prev) {
    // Body size changes the tank sizes, so rebuild the stores rather than
    // leaving a 90 kg athlete with a 25 kg child's oxygen store.
    if (params.mass !== prev.mass) {
      const mass = params.mass as number;
      return {
        ...state,
        o2Store: O2_STORE_ML_PER_KG * mass,
        glycogen: Math.min(state.glycogen, GLYCOGEN_G_PER_KG * mass),
      };
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rng = ctx.rng;
    const p = physiology(params);
    const mass = params.mass as number;
    const dtMin = dt / 60;
    const t = state.t + dt;

    /* --- the systems catch up with the demand ---------------------- */
    const approach = (now: number, target: number, tau: number) =>
      now + (target - now) * (1 - Math.exp(-dt / tau));

    const hr = approach(state.hr, p.heartRate, TAU_HR);
    const rr = approach(state.rr, p.breathingRate, TAU_BREATH);
    const vo2Target = approach(state.vo2, p.vo2Demand, TAU_VO2);

    /* --- can the supply chain actually deliver it? ----------------- */
    // Three ceilings in series: what the lungs can take in, what the blood can
    // carry, and what is left in the store. The lowest one wins.
    const storeMax = O2_STORE_ML_PER_KG * mass;
    const refill = (storeMax - state.o2Store) * 2; // mL/min to top the store up
    const supply = Math.min(p.o2Capacity, p.deliveryCap, vo2Target + Math.max(0, refill));
    const vo2 = Math.min(vo2Target, supply + (state.o2Store > 1 ? p.deliveryCap : 0));
    const delivered = Math.min(vo2, Math.max(supply, 0));

    let o2Store = state.o2Store + (supply - vo2) * dtMin;
    let o2Debt = state.o2Debt;
    let starvedFor = state.starvedFor;
    if (o2Store < 0) {
      o2Debt += -o2Store;
      o2Store = 0;
    } else if (o2Store > storeMax) {
      // Repaying the debt is what the extra oxygen goes on first.
      const spare = o2Store - storeMax;
      o2Store = storeMax;
      o2Debt = Math.max(0, o2Debt - spare);
    }
    const short = p.vo2Demand - delivered > 1;
    if (short) starvedFor += dt;

    /* --- fuel: digestion in, muscle out ---------------------------- */
    const blocked = params.blockSystem as string;
    const absorbed = blocked === "digestive" ? 0 : ABSORB_G_PER_MIN * dtMin;
    const burnedG = (delivered / 1000) * G_CARB_PER_L_O2 * carbShare(p.fraction) * dtMin;
    const glycogen = Math.max(0, Math.min(
      GLYCOGEN_G_PER_KG * mass,
      state.glycogen + absorbed - burnedG,
    ));

    /* --- packets moving along the routes ---------------------------- */
    // Blood packets move at the speed of the blood; air packets at the speed
    // of breathing; food takes hours whatever else is going on.
    const bloodSpeed = 0.09 + 0.36 * (p.cardiacOutput / Math.max(0.5, p.bloodVolume * 4.6));
    const airSpeed = 0.1 + 0.5 * (rr / RR_MAX);
    const speeds = [airSpeed, bloodSpeed, bloodSpeed, 0.045, bloodSpeed, 0.75, bloodSpeed * 0.6];

    const packets: Packet[] = [];
    for (const k of state.packets) {
      const s = k.s + speeds[k.route] * dt;
      if (s >= 1) continue;
      packets.push({ route: k.route, s, lane: k.lane });
    }

    // Emission rate per route, in packets per second, tied to what the body is
    // actually doing rather than to the clock.
    const rates = [
      (rr / 60) * 1.4,                                  // 0 air in
      (delivered / Math.max(1, p.vo2Demand)) * (1 + 5 * p.fraction) + 0.6, // 1 oxygen to muscle
      (1 + 5 * p.fraction) * 0.8,                       // 2 carbon dioxide back
      blocked === "digestive" ? 0 : 0.5,                // 3 food down the gut
      blocked === "digestive" ? 0 : 0.6 + 2 * p.fraction, // 4 glucose to muscle
      blocked === "nervous" ? 0 : 1.2 + 6 * p.fraction, // 5 nerve signals
      0.5 + p.fraction,                                 // 6 waste to the kidney
    ];
    const emitClock = state.emitClock.slice();
    for (let r = 0; r < ROUTE_COUNT; r++) {
      emitClock[r] += rates[r] * dt;
      while (emitClock[r] >= 1) {
        emitClock[r] -= 1;
        if (packets.length < MAX_PACKETS) {
          packets.push({ route: r, s: 0, lane: rng.range(-1, 1) });
        }
      }
    }

    /* --- history ---------------------------------------------------- */
    let histT = state.histT;
    let histHr = state.histHr;
    let histRr = state.histRr;
    let histVo2 = state.histVo2;
    let sampleClock = state.sampleClock + dt;
    if (sampleClock >= SAMPLE_SECONDS) {
      sampleClock -= SAMPLE_SECONDS;
      const drop = histT.length >= HISTORY_MAX ? 1 : 0;
      histT = histT.slice(drop);
      histHr = histHr.slice(drop);
      histRr = histRr.slice(drop);
      histVo2 = histVo2.slice(drop);
      histT.push(t);
      histHr.push(hr);
      histRr.push(rr);
      histVo2.push(vo2);
    }

    return {
      t, hr, rr, vo2, o2Store, o2Debt, glycogen,
      packets, emitClock,
      histT, histHr, histRr, histVo2, sampleClock,
      peakHr: Math.max(state.peakHr, hr),
      starvedFor,
    };
  },

  readouts(state, params) {
    const p = physiology(params);
    const q10 = (state.hr * p.strokeVolume) / 1000;
    return [
      // Rates are stored in the units a nurse would write down, with the unit
      // named in the label — the platform has no "per minute" unit kind.
      {
        key: "heartRate", label: "Heart rate (bpm)", quantity: q(state.hr, "count"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "breathingRate", label: "Breaths per minute", quantity: q(state.rr, "count"),
        semantic: "gas", graphable: true,
      },
      {
        key: "vo2", label: "Oxygen used (mL/min)", quantity: q(state.vo2, "count"),
        semantic: "gas", graphable: true,
      },
      {
        key: "cardiacOutput", label: "Blood pumped (L/min)", quantity: q(q10, "count"),
        semantic: "liquid", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "strokeVolume", label: "Blood per beat", quantity: q(p.strokeVolume * 1e-6, "volume"),
        unit: "mL", semantic: "liquid", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "tidalVolume", label: "Air per breath", quantity: q(p.tidalVolume * 1e-3, "volume"),
        unit: "L", semantic: "gas", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "avO2Diff", label: "Oxygen taken per litre of blood",
        quantity: q(p.avO2Diff, "count"), semantic: "gas", graphable: true, bands: ["9-12"],
      },
      {
        key: "glycogen", label: "Stored fuel (g)", quantity: q(state.glycogen, "count"),
        semantic: "energy-potential", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "o2Debt", label: "Oxygen debt (mL)", quantity: q(state.o2Debt, "count"),
        semantic: "energy-thermal", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const p = physiology(params);
    const cardiacOutput = (state.hr * p.strokeVolume) / 1000;
    return {
      level: params.level as string,
      blocked: params.blockSystem as string,
      mets: p.mets,
      metMlPerKgMin: MET_ML_PER_KG_MIN,
      hrMax: p.hrMax,
      heartRate: state.hr,
      targetHeartRate: p.heartRate,
      breathingRate: state.rr,
      targetBreathingRate: p.breathingRate,
      vo2: state.vo2,
      vo2Demand: p.vo2Demand,
      strokeVolumeML: p.strokeVolume,
      cardiacOutput,
      steadyCardiacOutput: p.cardiacOutput,
      avO2Diff: p.avO2Diff,
      ventilation: p.ventilation,
      tidalVolumeL: p.tidalVolume,
      bloodVolumeL: p.bloodVolume,
      circulationsPerMin: p.circulations,
      o2Capacity: p.o2Capacity,
      deliveryCap: p.deliveryCap,
      o2Debt: state.o2Debt,
      glycogenG: state.glycogen,
      starvedFor: state.starvedFor,
      starving: p.vo2Demand - state.vo2 > 1,
      peakHeartRate: state.peakHr,
      elapsed: state.t,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Anatomy — normalized body coordinates, x in [-1,1], y from head to feet
 * ------------------------------------------------------------------ */

type Pt = [number, number];

const ANATOMY = {
  brain: [0, 0.07] as Pt,
  mouth: [0, 0.145] as Pt,
  trachea: [0, 0.225] as Pt,
  lungL: [-0.3, 0.31] as Pt,
  lungR: [0.3, 0.31] as Pt,
  heart: [0.02, 0.335] as Pt,
  stomach: [-0.16, 0.44] as Pt,
  intestine: [0, 0.55] as Pt,
  kidneyL: [-0.3, 0.475] as Pt,
  kidneyR: [0.3, 0.475] as Pt,
  bladder: [0, 0.635] as Pt,
  thighL: [-0.19, 0.79] as Pt,
  thighR: [0.19, 0.79] as Pt,
  spineTop: [0, 0.19] as Pt,
  spineEnd: [0, 0.6] as Pt,
};

/** The seven journeys the sim animates, in body coordinates. */
const ROUTES: Pt[][] = [
  // 0 · air in through the mouth to the lungs
  [[0, -0.08], ANATOMY.mouth, ANATOMY.trachea, [-0.14, 0.27], ANATOMY.lungL],
  // 1 · oxygen: lungs → heart → artery → working muscle
  [ANATOMY.lungL, [-0.12, 0.33], ANATOMY.heart, [0.08, 0.46], [0.1, 0.62], ANATOMY.thighL],
  // 2 · carbon dioxide: muscle → heart → lungs → out
  [ANATOMY.thighL, [-0.08, 0.6], [-0.06, 0.44], ANATOMY.heart, [0.16, 0.32], ANATOMY.lungR, [0.1, 0.16], [0, -0.08]],
  // 3 · food down the gut
  [ANATOMY.mouth, [0, 0.3], ANATOMY.stomach, [-0.06, 0.5], ANATOMY.intestine, [0.16, 0.58]],
  // 4 · glucose: intestine → liver → heart → muscle
  [ANATOMY.intestine, [0.14, 0.44], ANATOMY.heart, [0.12, 0.55], ANATOMY.thighR],
  // 5 · the nerve signal telling the muscle to contract
  [ANATOMY.brain, ANATOMY.spineTop, [0, 0.42], ANATOMY.spineEnd, ANATOMY.thighL],
  // 6 · waste: muscle → blood → kidney → bladder
  [ANATOMY.thighR, [0.24, 0.6], ANATOMY.kidneyR, [0.14, 0.56], ANATOMY.bladder],
];

/** Which overlay has to be on for a route to be drawn. */
const ROUTE_OVERLAY = ["respiratory", "circulatory", "circulatory", "digestive", "circulatory", "nervous", "excretory"];

function routeColor(route: number, theme: RenderContext<State>["theme"]): string {
  switch (route) {
    case 0: return theme.sci["gas"];
    case 1: return theme.sci["gas"];
    case 2: return theme.sci["energy-thermal"];
    case 3: return theme.sci["energy-potential"];
    case 4: return theme.sci["energy-potential"];
    case 5: return theme.sci["current"];
    default: return theme.sci["liquid"];
  }
}

interface BodyFrame {
  cx: number;
  top: number;
  h: number;
  /** Half-width of the torso in pixels. */
  hw: number;
}

function toScreen(f: BodyFrame, p: Pt): [number, number] {
  return [f.cx + p[0] * f.hw, f.top + p[1] * f.h];
}

/** Position and direction along a polyline route, 0..1. */
function alongRoute(f: BodyFrame, route: Pt[], s: number): [number, number] {
  const segs = route.length - 1;
  const u = Math.max(0, Math.min(0.9999, s)) * segs;
  const i = Math.floor(u);
  const k = u - i;
  const [ax, ay] = toScreen(f, route[i]);
  const [bx, by] = toScreen(f, route[i + 1]);
  return [ax + (bx - ax) * k, ay + (by - ay) * k];
}

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function drawSilhouette(rc: RenderContext<State>, f: BodyFrame) {
  const { ctx, theme } = rc;
  const skin = mixHex(theme.inkSoft, theme.surface, 0.72);
  ctx.save();
  ctx.fillStyle = skin;
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1.5;

  // Head
  ctx.beginPath();
  ctx.ellipse(f.cx, f.top + f.h * 0.075, f.hw * 0.42, f.h * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Neck and torso
  ctx.beginPath();
  ctx.moveTo(f.cx - f.hw * 0.18, f.top + f.h * 0.14);
  ctx.lineTo(f.cx + f.hw * 0.18, f.top + f.h * 0.14);
  ctx.lineTo(f.cx + f.hw * 0.62, f.top + f.h * 0.24);
  ctx.lineTo(f.cx + f.hw * 0.5, f.top + f.h * 0.62);
  ctx.lineTo(f.cx - f.hw * 0.5, f.top + f.h * 0.62);
  ctx.lineTo(f.cx - f.hw * 0.62, f.top + f.h * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Legs
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(f.cx + side * f.hw * 0.05, f.top + f.h * 0.62);
    ctx.lineTo(f.cx + side * f.hw * 0.46, f.top + f.h * 0.62);
    ctx.lineTo(f.cx + side * f.hw * 0.34, f.top + f.h * 0.98);
    ctx.lineTo(f.cx + side * f.hw * 0.08, f.top + f.h * 0.98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(f.cx + side * f.hw * 0.58, f.top + f.h * 0.24);
    ctx.lineTo(f.cx + side * f.hw * 0.86, f.top + f.h * 0.3);
    ctx.lineTo(f.cx + side * f.hw * 0.78, f.top + f.h * 0.58);
    ctx.lineTo(f.cx + side * f.hw * 0.56, f.top + f.h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawRespiratory(rc: RenderContext<State>, f: BodyFrame, breath: number) {
  const { ctx, theme } = rc;
  const gas = theme.sci["gas"];
  ctx.save();
  // Trachea and bronchi
  ctx.strokeStyle = hexA(gas, 0.85);
  ctx.lineWidth = Math.max(2, f.hw * 0.05);
  ctx.lineCap = "round";
  const [mx, my] = toScreen(f, ANATOMY.mouth);
  const [tx, ty] = toScreen(f, ANATOMY.trachea);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(tx, ty);
  for (const lung of [ANATOMY.lungL, ANATOMY.lungR]) {
    const [lx, ly] = toScreen(f, lung);
    ctx.moveTo(tx, ty);
    ctx.lineTo(lx, ly - f.h * 0.03);
  }
  ctx.stroke();

  // Lungs, inflating and deflating at the real breathing rate.
  const scale = 1 + 0.11 * breath;
  for (const lung of [ANATOMY.lungL, ANATOMY.lungR]) {
    const [lx, ly] = toScreen(f, lung);
    const rw = f.hw * 0.34 * scale;
    const rh = f.h * 0.11 * scale;
    const g = ctx.createRadialGradient(lx - rw * 0.3, ly - rh * 0.3, rw * 0.1, lx, ly, rw);
    g.addColorStop(0, hexA(mixHex(gas, "#ffffff", 0.5), 0.85));
    g.addColorStop(1, hexA(gas, 0.45));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(lx, ly, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(gas, 0.9);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Alveolar clusters: the surface where the swap actually happens.
    ctx.fillStyle = hexA(gas, 0.5);
    for (let i = 0; i < 6; i++) {
      const a = i * 2.39996;
      ctx.beginPath();
      ctx.arc(lx + Math.cos(a) * rw * 0.5, ly + Math.sin(a) * rh * 0.55, Math.max(1.4, rw * 0.11), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCirculatory(rc: RenderContext<State>, f: BodyFrame, beat: number) {
  const { ctx, theme } = rc;
  const blood = theme.sci["liquid"];
  ctx.save();
  // The vessel tree, drawn once behind everything as quiet plumbing.
  ctx.strokeStyle = hexA(blood, 0.35);
  ctx.lineWidth = Math.max(1.4, f.hw * 0.035);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const route of [ROUTES[1], ROUTES[2], ROUTES[4]]) {
    const [sx, sy] = toScreen(f, route[0]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < route.length; i++) {
      const [px, py] = toScreen(f, route[i]);
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // The heart, squeezing once per beat.
  const [hx, hy] = toScreen(f, ANATOMY.heart);
  const squeeze = 1 + 0.16 * Math.max(0, Math.sin(beat * Math.PI * 2)) - 0.04;
  const r = f.hw * 0.22 * squeeze;
  glow(ctx, hx, hy, r * 2.4, blood, 0.22);
  ctx.fillStyle = blood;
  ctx.beginPath();
  // Two lobes and a point: reads as a heart without being a valentine.
  ctx.moveTo(hx, hy + r * 1.1);
  ctx.bezierCurveTo(hx - r * 1.5, hy + r * 0.1, hx - r * 0.9, hy - r * 1.1, hx, hy - r * 0.35);
  ctx.bezierCurveTo(hx + r * 0.9, hy - r * 1.1, hx + r * 1.5, hy + r * 0.1, hx, hy + r * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mixHex(blood, "#000000", 0.35);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function drawDigestive(rc: RenderContext<State>, f: BodyFrame) {
  const { ctx, theme } = rc;
  const food = theme.sci["energy-potential"];
  ctx.save();
  ctx.strokeStyle = hexA(food, 0.8);
  ctx.lineWidth = Math.max(3, f.hw * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const [mx, my] = toScreen(f, ANATOMY.mouth);
  const [sx, sy] = toScreen(f, ANATOMY.stomach);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx, my + f.h * 0.16);
  ctx.lineTo(sx, sy - f.h * 0.02);
  ctx.stroke();

  // Stomach
  ctx.fillStyle = hexA(food, 0.55);
  ctx.beginPath();
  ctx.ellipse(sx, sy, f.hw * 0.24, f.h * 0.05, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(food, 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small intestine: the coil is the point — 7 metres of it, folded up.
  const [ix, iy] = toScreen(f, ANATOMY.intestine);
  ctx.strokeStyle = hexA(food, 0.85);
  ctx.lineWidth = Math.max(2.4, f.hw * 0.07);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const x = ix + Math.sin(u * Math.PI * 5) * f.hw * 0.4;
    const y = iy - f.h * 0.04 + u * f.h * 0.11;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawExcretory(rc: RenderContext<State>, f: BodyFrame) {
  const { ctx, theme } = rc;
  const liquid = theme.sci["liquid"];
  ctx.save();
  for (const k of [ANATOMY.kidneyL, ANATOMY.kidneyR]) {
    const [kx, ky] = toScreen(f, k);
    ctx.fillStyle = mixHex(liquid, theme.ink, 0.35);
    ctx.beginPath();
    ctx.ellipse(kx, ky, f.hw * 0.13, f.h * 0.045, k[0] < 0 ? -0.3 : 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.ink, 0.4);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const [bx, by] = toScreen(f, ANATOMY.bladder);
    ctx.strokeStyle = hexA(liquid, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kx, ky + f.h * 0.03);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  const [bx, by] = toScreen(f, ANATOMY.bladder);
  ctx.fillStyle = hexA(liquid, 0.55);
  ctx.beginPath();
  ctx.ellipse(bx, by, f.hw * 0.16, f.h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNervous(rc: RenderContext<State>, f: BodyFrame) {
  const { ctx, theme } = rc;
  const nerve = theme.sci["current"];
  ctx.save();
  const [bx, by] = toScreen(f, ANATOMY.brain);
  glow(ctx, bx, by, f.hw * 0.6, nerve, 0.2);
  ctx.fillStyle = hexA(nerve, 0.75);
  ctx.beginPath();
  ctx.ellipse(bx, by, f.hw * 0.3, f.h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexA(nerve, 0.7);
  ctx.lineWidth = Math.max(2, f.hw * 0.04);
  ctx.lineCap = "round";
  const [tx, ty] = toScreen(f, ANATOMY.spineTop);
  const [ex, ey] = toScreen(f, ANATOMY.spineEnd);
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  // Nerves branching out to each limb.
  ctx.lineWidth = Math.max(1, f.hw * 0.02);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = ty + ((ey - ty) * (i + 1)) / 6;
    ctx.moveTo(tx, y);
    ctx.lineTo(tx - f.hw * 0.42, y + f.h * 0.02);
    ctx.moveTo(tx, y);
    ctx.lineTo(tx + f.hw * 0.42, y + f.h * 0.02);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMuscular(rc: RenderContext<State>, f: BodyFrame, effort: number, beat: number) {
  const { ctx, theme } = rc;
  const muscle = theme.sci["force"];
  const twitch = 0.5 + 0.5 * Math.sin(beat * Math.PI * 2 * 1.5);
  ctx.save();
  for (const m of [ANATOMY.thighL, ANATOMY.thighR]) {
    const [mx, my] = toScreen(f, m);
    const bulge = 1 + 0.12 * twitch * effort;
    const w = f.hw * 0.2 * bulge;
    const h = f.h * 0.12 / bulge;
    const g = ctx.createLinearGradient(mx - w, my, mx + w, my);
    g.addColorStop(0, mixHex(muscle, "#000000", 0.25));
    g.addColorStop(0.4, muscle);
    g.addColorStop(1, mixHex(muscle, "#000000", 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(mx, my, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fibres running the length of the muscle.
    ctx.strokeStyle = hexA(mixHex(muscle, "#000000", 0.4), 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(mx + i * w * 0.3, my - h * 0.8);
      ctx.lineTo(mx + i * w * 0.3, my + h * 0.8);
    }
    ctx.stroke();
  }
  // Upper-body muscle so the system reads as a system, not two thighs.
  for (const side of [-1, 1]) {
    const ax = f.cx + side * f.hw * 0.7;
    const ay = f.top + f.h * 0.36;
    ctx.fillStyle = hexA(muscle, 0.75);
    ctx.beginPath();
    ctx.ellipse(ax, ay, f.hw * 0.11 * (1 + 0.08 * twitch * effort), f.h * 0.08, 0.15 * side, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The live graphs. Three lines rising together is the whole lesson of B5.5. */
function drawGraphs(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, band } = rc;
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.restore();

  const n = state.histT.length;
  if (n < 2) return;
  const t0 = state.histT[0];
  const t1 = Math.max(state.histT[n - 1], t0 + 1);
  const px = (i: number) => x + ((state.histT[i] - t0) / (t1 - t0)) * (w - 8) + 4;

  const series: [number[], string, number, string][] = [
    [state.histHr, theme.sci["primary-consumer"], 220, "heart rate"],
    [state.histRr, theme.sci["gas"], 60, "breaths"],
    [state.histVo2, theme.sci["energy-thermal"], 3500, "oxygen"],
  ];
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  for (const [data, color, scale] of series) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const py = y + h - 4 - (Math.min(data[i], scale) / scale) * (h - 10);
      if (i === 0) ctx.moveTo(px(i), py);
      else ctx.lineTo(px(i), py);
    }
    ctx.stroke();
  }
  ctx.restore();

  if (band !== "3-5") {
    let lx = x + 8;
    for (const [, color, , name] of series) {
      caption(ctx, lx, y + 11, name, theme, { size: 9, color });
      ctx.save();
      ctx.font = '9px "Bricolage Grotesque", system-ui, sans-serif';
      lx += ctx.measureText(name).width + 16;
      ctx.restore();
    }
  }
}

const LEVEL_LABEL: Record<string, string> = {
  cell: "Cell — one muscle cell",
  tissue: "Tissue — muscle cells side by side",
  organ: "Organ — the whole muscle",
  system: "Organ system — muscles, nerves and vessels",
  organism: "Organism — every system at once",
};

/** Levels of organization, drawn as one nested picture rather than five slides. */
function drawLevel(rc: RenderContext<State>, level: string) {
  const { ctx, state, theme, width, height, band } = rc;
  const cx = width * 0.5;
  const cy = height * 0.46;
  const R = Math.min(width, height) * 0.3;
  const muscle = theme.sci["force"];
  const beat = (state.t * state.hr) / 60;
  const twitch = 0.5 + 0.5 * Math.sin(beat * Math.PI * 2 * 1.5);

  if (level === "cell") {
    // One muscle cell, packed with the mitochondria that pay for contraction.
    const w = R * 2.1;
    const h = R * 0.95;
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - h, 0, cy + h);
    g.addColorStop(0, mixHex(muscle, "#ffffff", 0.4));
    g.addColorStop(1, mixHex(muscle, "#000000", 0.25));
    ctx.fillStyle = g;
    roundRect(ctx, cx - w, cy - h / 2, w * 2, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = mixHex(muscle, "#000000", 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    // Sarcomere banding, sliding as the cell shortens.
    ctx.strokeStyle = hexA(theme.ink, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -8; i <= 8; i++) {
      const x = cx + i * (w / 9) * (1 - 0.08 * twitch);
      ctx.moveTo(x, cy - h * 0.42);
      ctx.lineTo(x, cy + h * 0.42);
    }
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39996;
      sphere(ctx, cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * h * 0.3,
        R * 0.09, theme.sci["energy-kinetic"], { glow: 0.4 });
    }
    caption(ctx, cx, cy + h * 0.9, "mitochondria pay for every contraction", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
  } else if (level === "tissue") {
    ctx.save();
    for (let i = -4; i <= 4; i++) {
      const y = cy + i * R * 0.22;
      const g = ctx.createLinearGradient(0, y - R * 0.1, 0, y + R * 0.1);
      g.addColorStop(0, mixHex(muscle, "#ffffff", 0.35));
      g.addColorStop(1, mixHex(muscle, "#000000", 0.2));
      ctx.fillStyle = g;
      roundRect(ctx, cx - R * 1.5, y - R * 0.085, R * 3, R * 0.17, R * 0.085);
      ctx.fill();
    }
    ctx.restore();
    caption(ctx, cx, cy + R * 1.25, "many cells of the same kind, working as one", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
  } else if (level === "organ") {
    ctx.save();
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, mixHex(muscle, "#000000", 0.28));
    g.addColorStop(0.45, muscle);
    g.addColorStop(1, mixHex(muscle, "#000000", 0.3));
    ctx.fillStyle = g;
    const bulge = 1 + 0.1 * twitch;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.25 / bulge, R * 0.62 * bulge, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.8, cy);
    ctx.lineTo(cx - R * 1.2, cy);
    ctx.moveTo(cx + R * 1.2, cy);
    ctx.lineTo(cx + R * 1.8, cy);
    ctx.stroke();
    ctx.restore();
    caption(ctx, cx, cy + R * 0.95, "tendons at each end, bundles of tissue between", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
  } else {
    // system: muscle plus the nerve that fires it and the vessel that feeds it
    ctx.save();
    ctx.fillStyle = hexA(muscle, 0.85);
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.2, R * 1.1, R * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.sci["current"];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.7, cy - R * 0.9);
    ctx.lineTo(cx - R * 0.4, cy + R * 0.1);
    ctx.stroke();
    ctx.strokeStyle = theme.sci["liquid"];
    ctx.beginPath();
    ctx.moveTo(cx + R * 1.7, cy - R * 0.9);
    ctx.lineTo(cx + R * 0.4, cy + R * 0.1);
    ctx.stroke();
    ctx.restore();
    caption(ctx, cx - R * 1.7, cy - R * 1.05, "nerve", theme, { size: 11, color: theme.sci["current"] });
    caption(ctx, cx + R * 1.7, cy - R * 1.05, "blood vessel", theme, {
      align: "right", size: 11, color: theme.sci["liquid"],
    });
  }

  caption(ctx, width / 2, height * 0.09, LEVEL_LABEL[level] ?? level, theme, {
    align: "center", size: band === "3-5" ? 15 : 13,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const p = physiology(params);
  const level = params.level as string;

  sky(ctx, width, height, theme, "indoor");

  if (level !== "organism") {
    drawLevel(rc, level);
    caption(ctx, width / 2, height - 16,
      "Zoom back out to Organism to see every system at once", theme,
      { align: "center", size: 11, color: theme.inkSoft });
    vignette(ctx, width, height, 0.14);
    return;
  }

  const showGraphs = overlays.graphs !== false && band !== "3-5";
  const graphH = showGraphs ? Math.round(Math.min(120, height * 0.24)) : 0;
  const stageH = height - graphH - (showGraphs ? 6 : 0);

  const f: BodyFrame = {
    cx: width * 0.42,
    top: stageH * 0.04,
    h: stageH * 0.92,
    hw: Math.min(width * 0.19, stageH * 0.19),
  };

  const beat = (state.t * state.hr) / 60;
  const breath = Math.sin(((state.t * state.rr) / 60) * Math.PI * 2);
  const effort = p.fraction;

  drawSilhouette(rc, f);
  if (overlays.circulatory !== false) drawCirculatory(rc, f, beat);
  if (overlays.digestive !== false) drawDigestive(rc, f);
  if (overlays.excretory !== false) drawExcretory(rc, f);
  if (overlays.respiratory !== false) drawRespiratory(rc, f, breath);
  if (overlays.nervous !== false) drawNervous(rc, f);
  if (overlays.muscular !== false) drawMuscular(rc, f, effort, beat);

  /* --- the packets: this is the "working together" made visible ---- */
  if (overlays.flows !== false) {
    for (const k of state.packets) {
      if (overlays[ROUTE_OVERLAY[k.route]] === false) continue;
      const [px, py] = alongRoute(f, ROUTES[k.route], k.s);
      const r = Math.max(2, f.hw * 0.055);
      const off = k.lane * f.hw * 0.05;
      sphere(ctx, px + off, py, r, routeColor(k.route, theme), { rim: false });
    }
  }

  /* --- live numbers, each beside the organ it belongs to ------------ */
  if (band !== "3-5") {
    const [hx, hy] = toScreen(f, ANATOMY.heart);
    badge(ctx, hx + f.hw * 0.55, hy, `${Math.round(state.hr)}`, theme, {
      color: theme.sci["primary-consumer"], sub: "bpm",
    });
    const [lx, ly] = toScreen(f, ANATOMY.lungR);
    badge(ctx, lx + f.hw * 0.5, ly - f.h * 0.06, `${Math.round(state.rr)}`, theme, {
      color: theme.sci["gas"], sub: "breaths/min",
    });
    const [mx, my] = toScreen(f, ANATOMY.thighL);
    badge(ctx, mx - f.hw * 0.42, my, `${Math.round(state.vo2)}`, theme, {
      align: "right", color: theme.sci["energy-thermal"], sub: "mL O₂/min",
    });
  }

  /* --- the story panel --------------------------------------------- */
  const panelX = Math.min(width - 8, f.cx + f.hw * 1.35);
  if (width - panelX > 110 && band !== "3-5") {
    const mets = p.mets;
    const name = mets < 1.6 ? "Resting" : mets < 4 ? "Walking" : mets < 7 ? "Jogging"
      : mets < 10 ? "Running" : "Sprinting";
    caption(ctx, panelX, 22, name, theme, { size: 16 });
    caption(ctx, panelX, 42, `${mets.toFixed(1)} METs`, theme, { size: 11, color: theme.inkSoft });
    const rows: [string, string, string][] = [
      ["Blood pumped", `${((state.hr * p.strokeVolume) / 1000).toFixed(1)} L/min`, theme.sci["liquid"]],
      ["Air breathed", `${p.ventilation.toFixed(1)} L/min`, theme.sci["gas"]],
      ["Whole blood volume", `${p.circulations.toFixed(1)}× per min`, theme.sci["liquid"]],
      ["Fuel left", `${Math.round(state.glycogen)} g`, theme.sci["energy-potential"]],
    ];
    let ry = 68;
    for (const [k, v, c] of rows) {
      caption(ctx, panelX, ry, k, theme, { size: 10, color: theme.inkSoft });
      caption(ctx, panelX, ry + 15, v, theme, { size: 13, color: c });
      ry += 36;
    }
  }

  /* --- what a blocked system does ---------------------------------- */
  const blocked = params.blockSystem as string;
  if (blocked !== "none") {
    const msg: Record<string, string> = {
      respiratory: "Breathing blocked — no oxygen reaches the blood",
      circulatory: "Circulation blocked — oxygen cannot reach the muscle",
      digestive: "Digestion blocked — no new fuel is absorbed",
      nervous: "Nerve signal blocked — the muscle never gets the message",
    };
    label(ctx, msg[blocked] ?? "", width / 2, stageH - 14, theme, {
      align: "center", size: 12, color: theme.sci["energy-thermal"],
    });
  }
  if (state.o2Debt > 40 && band !== "3-5") {
    label(ctx, `Oxygen debt ${Math.round(state.o2Debt)} mL`, width / 2, stageH - 32, theme, {
      align: "center", size: 11, color: theme.sci["hot"],
    });
  }

  if (showGraphs) drawGraphs(rc, 6, stageH + 6, width - 12, graphH - 8);
  vignette(ctx, width, height, 0.13);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const bodySystemsSim: SimManifest<State> = {
  id: "bio.body-systems",
  title: "Body Systems at Work",
  tagline: "Turn the activity up and watch six systems answer together, in real numbers.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS1-3", "MS-LS1-8", "HS-LS1-2"] },
  learningGoals: [
    "Trace oxygen from the air to a working muscle, and carbon dioxide back out.",
    "Explain why heart rate, breathing rate and oxygen demand all rise together.",
    "Order cell, tissue, organ, organ system and organism, with an example of each.",
    "Predict what happens to the rest of the body when one system stops working.",
  ],
  misconceptions: [
    "Each body system works on its own",
    "The heart makes the blood, and the lungs make the oxygen",
    "You breathe faster during exercise only because you are hot",
    "Food goes to the stomach and the stomach uses it",
  ],
  interactionHint: "Drag Activity up to Sprint and watch every line on the graph answer.",
  tickRate: 30,
  // Physiology is slow: an oxygen response takes about half a minute. Six sim
  // seconds per real second keeps that honest and still watchable in a lesson.
  timeScale: 6,
  params: {
    activity: {
      type: "number", label: "Activity", kind: "ratio",
      min: 1, max: METS_MAX, step: 0.5, default: 1,
      marks: [
        { value: 1, label: "Rest" },
        { value: 3, label: "Walk" },
        { value: 7, label: "Jog" },
        { value: 12, label: "Sprint" },
      ],
      help: "Measured in METs. One MET is your resting rate: 3.5 mL of oxygen per kilogram every minute.",
    },
    age: {
      type: "number", label: "Age", kind: "time", unit: "yr",
      min: 8, max: 60, step: 1, default: 12,
      bands: ["6-8", "9-12"],
      help: "Maximum heart rate is roughly 220 minus your age.",
    },
    mass: {
      type: "number", label: "Body mass", kind: "mass", unit: "kg",
      min: 25, max: 95, step: 1, default: 45,
      bands: ["6-8", "9-12"],
    },
    level: {
      type: "option", label: "Level of organization",
      options: [
        { value: "cell", label: "Cell" },
        { value: "tissue", label: "Tissue" },
        { value: "organ", label: "Organ" },
        { value: "system", label: "Organ system" },
        { value: "organism", label: "Organism" },
      ],
      default: "organism",
      help: "Each level is made of the one before it.",
    },
    blockSystem: {
      type: "option", label: "Block a system",
      options: [
        { value: "none", label: "Nothing blocked" },
        { value: "respiratory", label: "Breathing" },
        { value: "circulatory", label: "Circulation" },
        { value: "digestive", label: "Digestion" },
        { value: "nervous", label: "Nerve signals" },
      ],
      default: "none",
      bands: ["6-8", "9-12"],
      help: "Stop one system and see which others stop with it.",
    },
  },
  overlays: [
    { key: "respiratory", label: "Respiratory", default: true },
    { key: "circulatory", label: "Circulatory", default: true },
    { key: "digestive", label: "Digestive", default: true },
    { key: "muscular", label: "Muscular", default: true },
    { key: "nervous", label: "Nervous", default: true },
    { key: "excretory", label: "Excretory", default: false },
    { key: "flows", label: "Show what is moving", default: true },
    { key: "graphs", label: "Live graphs", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "exercise",
      title: "What happens to your body when you run?",
      question: "Which parts of the body respond when you exercise, and do they respond together?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-3"],
      setup: { activity: 1, age: 12, mass: 45, level: "organism", blockSystem: "none" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you move the dial.",
          predict: {
            prompt: "You start sprinting. Which of these changes?",
            options: [
              "Only the heart rate",
              "Heart rate and breathing rate, but not oxygen use",
              "Heart rate, breathing rate and oxygen use, all together",
            ],
            correct: 2,
            reveal: "All three, and for one reason: the muscle needs more oxygen, so the lungs take in more and the heart delivers more.",
          },
        },
        {
          id: "rest",
          phase: "measure",
          title: "Record the body at rest",
          instruction: "Leave Activity at Rest. Play for a while, then record.",
          requireData: 2,
          hints: ["Wait for the lines on the graph to flatten before recording."],
        },
        {
          id: "run",
          phase: "measure",
          title: "Now sprint",
          instruction: "Push Activity to 12 METs. Record three times as it climbs.",
          check: { describe: "Activity above 9 METs", test: (v) => (v.params.activity as number) >= 9 },
          requireData: 5,
          hints: [
            "The heart rate answers within seconds; oxygen takes about half a minute.",
            "Watch the three graph lines rise in the same order every time.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Follow one oxygen molecule",
          instruction: "Track a blue packet from the air to the thigh muscle. Name every system it uses.",
          write: {
            prompt: "List, in order, the systems one oxygen molecule passes through.",
            placeholder: "It enters through the ... system, is carried by the ..., and is used by the ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the link",
          instruction: "Say why breathing harder is no use without a faster heart.",
          write: {
            prompt: "Why do the heart and the lungs have to speed up together?",
            placeholder: "Oxygen in the lungs is no use to a muscle unless ...",
          },
        },
      ],
    },
    {
      id: "break-a-system",
      title: "Break one system and see who notices",
      question: "If one body system stops, which of the others stop with it?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS1-3"],
      setup: { activity: 7, age: 12, mass: 45, level: "organism", blockSystem: "none" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You are jogging and the circulation is blocked.",
          predict: {
            prompt: "Breathing still works perfectly. What happens to the muscle?",
            options: [
              "Nothing — the lungs still have oxygen",
              "It runs short of oxygen almost at once",
              "It works harder to make up for it",
            ],
            correct: 1,
            reveal: "Oxygen in the lungs is useless without blood to carry it. The muscle builds an oxygen debt within seconds.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Jog with everything working",
          instruction: "Play at 7 METs until the graph settles. Record.",
          requireData: 2,
        },
        {
          id: "block",
          phase: "measure",
          title: "Block the circulation",
          instruction: "Set Block a system to Circulation. Record what the oxygen debt does.",
          check: {
            describe: "Circulation blocked and a debt has built up",
            test: (v) => v.params.blockSystem === "circulatory" && (v.facts.o2Debt as number) > 10,
          },
          requireData: 4,
          hints: ["Oxygen debt is the number that grows once supply falls behind demand."],
        },
        {
          id: "others",
          phase: "measure",
          title: "Try blocking the others",
          instruction: "Block breathing, then digestion, then nerve signals. Record each.",
          requireData: 7,
          hints: ["Digestion is the slow one — the fuel store takes a long time to run down."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Rank them",
          instruction: "Which block hurt fastest, and which took longest? Explain the order.",
          write: {
            prompt: "Order the four blocks from fastest to slowest effect, and say why.",
            placeholder: "Blocking ... was felt first because the body stores almost no ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "target-zone",
      title: "Hit the training zone",
      brief: "Find the activity level that holds your heart rate between 70% and 85% of maximum.",
      bands: ["6-8", "9-12"],
      setup: { activity: 1, age: 12, mass: 45, blockSystem: "none", level: "organism" },
      goal: {
        describe: "Heart rate between 70% and 85% of maximum",
        test: (v) => {
          const hr = v.facts.heartRate as number;
          const max = v.facts.hrMax as number;
          return hr >= 0.7 * max && hr <= 0.85 * max;
        },
      },
      stars: {
        two: {
          describe: "In the zone with the heart rate settled",
          test: (v) => {
            const hr = v.facts.heartRate as number;
            const max = v.facts.hrMax as number;
            return hr >= 0.7 * max && hr <= 0.85 * max &&
              Math.abs(hr - (v.facts.targetHeartRate as number)) < 2;
          },
        },
        three: {
          describe: "Settled in the zone with no oxygen debt at all",
          test: (v) => {
            const hr = v.facts.heartRate as number;
            const max = v.facts.hrMax as number;
            return hr >= 0.7 * max && hr <= 0.85 * max &&
              Math.abs(hr - (v.facts.targetHeartRate as number)) < 2 &&
              (v.facts.o2Debt as number) < 1;
          },
        },
      },
      hints: [
        "Maximum heart rate is about 220 minus your age.",
        "Move the dial and wait — the heart takes about half a minute to settle.",
      ],
    },
    {
      id: "run-it-dry",
      title: "Run the tank dry",
      brief: "Burn the body's stored fuel down below 100 grams.",
      bands: ["9-12"],
      setup: { activity: 12, age: 16, mass: 45, blockSystem: "digestive", level: "organism" },
      goal: {
        describe: "Stored fuel below 100 g",
        test: (v) => (v.facts.glycogenG as number) < 100,
      },
      stars: {
        two: {
          describe: "Below 50 g of stored fuel",
          test: (v) => (v.facts.glycogenG as number) < 50,
        },
        three: {
          describe: "Completely out of stored fuel",
          test: (v) => (v.facts.glycogenG as number) < 1,
        },
      },
      hints: [
        "Hard work burns mostly carbohydrate; easy work burns mostly fat.",
        "The gut only absorbs about a gram of sugar a minute, however much you eat.",
        "Speed the clock up — this is the wall marathon runners talk about.",
      ],
    },
  ],
};
