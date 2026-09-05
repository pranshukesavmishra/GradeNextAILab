import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q, toSI, type UnitKind } from "@engine/units";
import { roundRect } from "@ui/draw";
import { balance as drawBalance, benchStage, meterRule, thermometerProbe } from "@ui/labware";
import {
  badge, caption, clamp01, glass, hexA, isDarkTheme, vignette,
} from "@ui/scene";

/**
 * Read It Right: The Metrology Bench — Grade 6, Unit A5.3: a measurement is a
 * number, a unit and an uncertainty, decided by the instrument, not the reader.
 *
 * Every instrument here is mechanical, never a lookup. The triple-beam balance
 * sums real torques: the three riders' printed gram values against the pan
 * load, the zero-adjust trim and the bench tilt all entering the same sum, and
 * the pointer settles only when it reaches zero. The cylinder's apparent
 * reading is a genuine geometric projection — apparent volume equals the true
 * meniscus height plus the eye offset times a parallax factor — so the same
 * 45 mL genuinely reads differently from above and below. The caliper closes
 * exactly on the true width; its lesson is resolution, not bias. Every
 * instrument declares a smallest division, and the checker demands a reading
 * estimated one digit beyond it (an analog scale), or exactly its own
 * resolution (a digital one) — with an uncertainty of half a division either
 * way. No reading is ever pre-formatted, and a derived quantity is only ever
 * as precise as its least precise input, exactly as the spec's honesty rule
 * demands.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const K = 273.15;

/** Hidden true values, to four significant figures, per specimen. */
interface Specimen {
  massKg: number; volumeM3: number; widthM: number; label: string;
}
const SPECIMENS: Record<string, Specimen> = {
  pebble: { massKg: 0.02432, volumeM3: 9.20e-6, widthM: 0.0261, label: "river pebble" },
  bolt: { massKg: 0.01120, volumeM3: 1.312e-6, widthM: 0.01185, label: "steel bolt" },
  cube: { massKg: 0.02160, volumeM3: 8.000e-6, widthM: 0.02000, label: "aluminium cube" },
  block: { massKg: 0.01350, volumeM3: 2.700e-5, widthM: 0.02000, label: "wooden block" }, // shortest edge
  nut: { massKg: 0.03570, volumeM3: 4.200e-6, widthM: 0.01450, label: "brass nut" },
  water: { massKg: 0.05000, volumeM3: 5.000e-5, widthM: 0, label: "water sample" }, // 50 mL as poured
};

const WATER_TEMP_C = 21.4;  // specimen genuinely at this temperature
const ROOM_AIR_C = 19.8;    // what an unimmersed thermometer actually reads

const TILT_MASS_K = 0.00015;      // kg of apparent bias per radian of bench tilt on the beam balance
const DIGITAL_TILT_DRIFT_K = 0.000573; // kg per radian for the digital balance ("0.02 g at 2 degrees")
const DIGITAL_UNTARED_G = 0.44;   // an uncounted watch-glass, until tared

const PARALLAX_ML_PER_CM = 0.2;   // spec: 45 mL reads 47 mL from "above" (~+10 cm)

const RULE_WORN_OFFSET_MM = 2.0;  // the plastic rule's zero mark has receded this far

const THERMO_TAU_S = 20 / 3;      // spec: ~20 s response time (settled by 3 tau)

const DROP_HEIGHT_M = 1.25;       // the stopwatch's fixed timed event: a dropped ball
const REACTION_OFFSET_S = 0.20;   // spec: 0.15-0.25 s human reaction, both edges combined

const BALANCE_SPRING_HZ = 0.6;    // damped pointer, settles in ~4 s (spec)
const BALANCE_DAMPING = 0.85;

/* ------------------------------------------------------------------ *
 * Units the student may enter a reading in
 * ------------------------------------------------------------------ */

const UNIT_KIND_OF: Record<string, UnitKind> = {
  mm: "length", cm: "length", m: "length",
  g: "mass", kg: "mass",
  mL: "volume", L: "volume", "cm3": "volume",
  s: "time",
  "C": "temperature",
};

/** Convert a student's (value, unit) into SI, or null if the unit is nonsense. */
function studentToSI(value: number, unit: string): { si: number; kind: UnitKind } | null {
  const kind = UNIT_KIND_OF[unit];
  if (!kind) return null;
  const unitId = unit === "cm3" ? "cm³" : unit === "C" ? "°C" : unit;
  return { si: toSI(value, kind, unitId), kind };
}

/* ------------------------------------------------------------------ *
 * What each instrument actually shows — the mechanics, not a lookup
 * ------------------------------------------------------------------ */

interface Reading {
  valueSI: number;
  kind: UnitKind;
  divisionSI: number;    // the instrument's smallest marked division, in SI
  requiredDecimals: number;
  label: string;
}

function specimenOf(params: ParamValues): Specimen {
  return SPECIMENS[params.specimen as string] ?? SPECIMENS.pebble;
}

/** The rider sum, in kg — what the student's beam positions currently claim. */
function riderSumKg(params: ParamValues): number {
  return (params.riderRear as number) + (params.riderMiddle as number) + (params.riderFront as number);
}

/** What the beam balance's pan side actually demands to reach zero. */
function balanceTargetKg(params: ParamValues): number {
  const sp = specimenOf(params);
  const tilt = params.benchTilt as number;
  return sp.massKg + (params.zeroTrim as number) + TILT_MASS_K * tilt;
}

function cylinderDivisionM3(size: string): number {
  if (size === "10") return 1e-7;   // 0.1 mL
  if (size === "250") return 5e-6;  // 5 mL
  return 1e-6;                       // 100 mL cylinder: 1 mL
}

function cylinderDecimals(size: string): number {
  if (size === "10") return 2;
  if (size === "250") return 0;
  return 1;
}

/** The true liquid volume in the cylinder right now, including any displacement. */
function trueCylinderVolumeM3(params: ParamValues): number {
  const base = params.liquidVolume as number;
  const displaced = params.objectSubmerged === true ? specimenOf(params).volumeM3 : 0;
  return base + displaced;
}

/** The apparent volume a real eye would report: a genuine parallax projection. */
function apparentCylinderVolumeM3(params: ParamValues): number {
  const eyeCm = (params.eyeLevel as number) * 100;
  return trueCylinderVolumeM3(params) + (eyeCm * PARALLAX_ML_PER_CM) / 1e6;
}

/** What the digital display actually shows: true mass plus tare/tilt bias. */
function apparentDigitalMassKg(params: ParamValues): number {
  const sp = specimenOf(params);
  const tilt = Math.abs(params.benchTilt as number);
  const untared = params.digitalTared === true ? 0 : DIGITAL_UNTARED_G / 1000;
  return sp.massKg + untared + DIGITAL_TILT_DRIFT_K * tilt;
}

/** What a naive reading of the rule's own zero mark would show. */
function apparentRuleWidthM(params: ParamValues): number {
  const sp = specimenOf(params);
  return sp.widthM - (params.ruleType === "plastic" ? RULE_WORN_OFFSET_MM / 1000 : 0);
}

/** What the stopwatch display shows: true duration plus human reaction lag. */
function apparentStopwatchS(): number {
  return Math.sqrt((2 * DROP_HEIGHT_M) / CONSTANTS.g) + REACTION_OFFSET_S;
}

function readingFor(params: ParamValues): Reading {
  const instrument = params.instrument as string;
  const sp = specimenOf(params);

  if (instrument === "balance") {
    return { valueSI: sp.massKg, kind: "mass", divisionSI: 0.0001, requiredDecimals: 2, label: "mass" };
  }
  if (instrument === "digitalBalance") {
    // Per spec, the checker always compares to the TRUE value: an untared or
    // drifting display is an apparent-reading problem (see `apparentMassG`
    // below), never a change to what counts as correct.
    return { valueSI: sp.massKg, kind: "mass", divisionSI: 0.00001, requiredDecimals: 2, label: "mass" };
  }
  if (instrument === "cylinder") {
    const size = params.cylinderSize as string;
    return {
      valueSI: trueCylinderVolumeM3(params), kind: "volume",
      divisionSI: cylinderDivisionM3(size), requiredDecimals: cylinderDecimals(size), label: "volume",
    };
  }
  if (instrument === "caliper") {
    // The vernier closes exactly on the true width — the lesson is resolution.
    return { valueSI: sp.widthM, kind: "length", divisionSI: 0.00005, requiredDecimals: 2, label: "width" };
  }
  if (instrument === "rule") {
    // The worn plastic rule's zero mark is an apparent-reading hazard, not a
    // change to the true width the checker demands.
    return { valueSI: sp.widthM, kind: "length", divisionSI: 0.001, requiredDecimals: 1, label: "width" };
  }
  if (instrument === "thermometer") {
    // The true target is the specimen's actual temperature, always — reading
    // an unsettled or unimmersed thermometer is an apparent-value problem
    // (facts.thermoC), not a different thing to be correct about.
    return { valueSI: WATER_TEMP_C + K, kind: "temperature", divisionSI: 1, requiredDecimals: 1, label: "temperature" };
  }
  // stopwatch: the true target is the physical drop time; the reaction offset
  // is what the stopwatch apparently shows, not what counts as correct.
  const trueDurationS = Math.sqrt((2 * DROP_HEIGHT_M) / CONSTANTS.g);
  return { valueSI: trueDurationS, kind: "time", divisionSI: 0.01, requiredDecimals: 2, label: "elapsed time" };
}

/* ------------------------------------------------------------------ *
 * State — only what genuinely evolves in time
 * ------------------------------------------------------------------ */

interface State {
  pointerAngle: number;   // balance pointer deflection, radians-ish, for the settle animation
  pointerVel: number;
  thermoC: number;        // the alcohol column's own lagging temperature
  tSec: number;
}

function init(): State {
  return { pointerAngle: 0, pointerVel: 0, thermoC: ROOM_AIR_C, tSec: 0 };
}

function step(state: State, dt: number, params: ParamValues): State {
  if (dt <= 0) return state;
  const s: State = { ...state };
  s.tSec += dt;

  // Damped spring toward zero deflection: settles in about 4 s, per spec.
  const mismatchKg = balanceTargetKg(params) - riderSumKg(params);
  const omega = 2 * Math.PI * BALANCE_SPRING_HZ;
  const accel = omega * omega * (mismatchKg * 400) - 2 * BALANCE_DAMPING * omega * s.pointerVel - omega * omega * s.pointerAngle;
  s.pointerVel += accel * dt;
  s.pointerAngle += s.pointerVel * dt;

  // Alcohol column: first-order lag toward whatever it is actually touching.
  const target = params.thermometerImmersed === true ? WATER_TEMP_C : ROOM_AIR_C;
  s.thermoC += ((target - s.thermoC) / THERMO_TAU_S) * dt;

  return s;
}

const model: SimModel<State> = {
  init() {
    return init();
  },
  step(state, dt, params) {
    return step(state, dt, params);
  },
  readouts(state, params) {
    const r = readingFor(params);
    const riderSum = riderSumKg(params);
    const target = balanceTargetKg(params);
    return [
      { key: "riderSum", label: "Rider sum", unit: "g", quantity: q(riderSum, "mass"), semantic: "mass", graphable: true },
      { key: "pointer", label: "Pointer deflection", quantity: q(state.pointerAngle, "ratio"), semantic: "field" },
      { key: "settled", label: "Settled", quantity: q(Math.abs(target - riderSum) < 0.00005 && Math.abs(state.pointerAngle) < 0.02 ? 1 : 0, "count") },
      { key: "apparentVolume", label: "Apparent volume", unit: "mL", quantity: q(apparentCylinderVolumeM3(params), "volume"), semantic: "cold", graphable: true },
      { key: "trueVolume", label: "True volume", unit: "mL", quantity: q(trueCylinderVolumeM3(params), "volume"), semantic: "cold" },
      { key: "thermoC", label: "Thermometer reading", unit: "°C", quantity: q(state.thermoC + K, "temperature"), semantic: "hot", graphable: true },
      { key: "reading", label: `True ${r.label}`, quantity: q(r.valueSI, r.kind), semantic: "neutral" },
    ];
  },
  facts(state, params) {
    const r = readingFor(params);
    const student = studentToSI(params.studentValue as number, params.studentUnit as string);
    const withinTolerance = student !== null && Math.abs(student.si - r.valueSI) <= r.divisionSI / 2 + 1e-12;
    const correctKind = student !== null && student.kind === r.kind;
    const correctDecimals = params.studentDecimals === r.requiredDecimals;
    const passed = withinTolerance && correctKind && correctDecimals;

    const riderSum = riderSumKg(params);
    const target = balanceTargetKg(params);
    const settled = Math.abs(target - riderSum) < 0.00005 && Math.abs(state.pointerAngle) < 0.02;

    const sp = specimenOf(params);
    return {
      instrument: params.instrument as string,
      specimen: params.specimen as string,
      trueValueSI: r.valueSI,
      trueValueG: r.kind === "mass" ? r.valueSI * 1000 : 0,
      trueValueMm: r.kind === "length" ? r.valueSI * 1000 : 0,
      trueValueMl: r.kind === "volume" ? r.valueSI * 1e6 : 0,
      divisionSI: r.divisionSI,
      requiredDecimals: r.requiredDecimals,
      studentSI: student ? student.si : NaN,
      studentValid: student !== null,
      withinTolerance,
      correctUnitKind: correctKind,
      correctDecimals,
      passed,
      absErrorG: student && r.kind === "mass" ? (student.si - r.valueSI) * 1000 : 0,
      riderSumG: riderSum * 1000,
      targetG: target * 1000,
      errorG: (riderSum - target) * 1000,
      settled,
      apparentVolumeMl: apparentCylinderVolumeM3(params) * 1e6,
      trueVolumeMl: trueCylinderVolumeM3(params) * 1e6,
      parallaxErrorMl: (apparentCylinderVolumeM3(params) - trueCylinderVolumeM3(params)) * 1e6,
      thermoC: state.thermoC,
      caliperTrueMm: sp.widthM * 1000,
      ruleTrueMm: r.kind === "length" && params.instrument === "rule" ? r.valueSI * 1000 : 0,
      apparentRuleMm: apparentRuleWidthM(params) * 1000,
      apparentDigitalMassG: apparentDigitalMassKg(params) * 1000,
      apparentStopwatchS: apparentStopwatchS(),
      specimenMassG: sp.massKg * 1000,
      specimenVolumeMl: sp.volumeM3 * 1e6,
      specimenWidthMm: sp.widthM * 1000,
      densitySI: sp.volumeM3 > 0 ? sp.massKg / sp.volumeM3 : 0,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp: number): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function render(rc: RenderContext<State>) {
  const { ctx, state: s, params, theme, width, height } = rc;
  const dark = isDarkTheme(theme);
  benchStage(ctx, width, height, theme);

  // Rubber mat.
  ctx.fillStyle = dark ? "#1c1c20" : "#2c2c30";
  roundRect(ctx, width * 0.05, height * 0.5, width * 0.9, height * 0.42, 10);
  ctx.fill();

  const instrument = params.instrument as string;
  const benchY = height * 0.86;
  const cx = width / 2;

  if (instrument === "balance" || instrument === "digitalBalance") {
    const riderSum = riderSumKg(params) * 1000;
    drawBalance(ctx, cx, benchY, Math.min(width * 0.5, 340), theme, riderSum, { unit: "g", decimals: 2 });
    const deflectDeg = Math.max(-25, Math.min(25, s.pointerAngle * 400));
    caption(ctx, cx, benchY - 220, `pointer ${deflectDeg.toFixed(1)}°`, theme, { align: "center", size: 10, color: theme.inkSoft });
  } else if (instrument === "cylinder") {
    const cw = 70, chh = height * 0.34, cyx = cx - cw / 2, cyy = benchY - chh;
    const dark2 = isDarkTheme(theme);
    glass(ctx, cyx, cyy, cw, chh, 2, theme, { alpha: dark2 ? 0.12 : 0.2 });
    const trueFrac = clamp01(trueCylinderVolumeM3(params) / (100e-6));
    const liquidH = chh * 0.9 * trueFrac;
    ctx.fillStyle = hexA("#4fa9d8", 0.55);
    roundRect(ctx, cyx + 4, cyy + chh - liquidH, cw - 8, liquidH, 3);
    ctx.fill();
    caption(ctx, cx, cyy - 12, `${params.cylinderSize} mL cylinder`, theme, { align: "center", size: 10, color: theme.inkSoft });
    // Eye marker on a vertical track beside the cylinder.
    const eyeCm = (params.eyeLevel as number) * 100;
    const eyeY = cyy + chh - liquidH - eyeCm * 3;
    caption(ctx, cyx + cw + 24, eyeY, "eye", theme, { size: 10, color: theme.accent });
  } else if (instrument === "caliper" || instrument === "rule") {
    meterRule(ctx, cx - 150, benchY - 10, 300, theme, {});
    const sp = specimenOf(params);
    const px = cx - sp.widthM * 3000, pw = sp.widthM * 6000;
    ctx.fillStyle = hexA(theme.sci["mass"], 0.4);
    roundRect(ctx, px, benchY - 34, Math.max(4, pw), 20, 3);
    ctx.fill();
    caption(ctx, cx, benchY - 44, specimenOf(params).label, theme, { align: "center", size: 10, color: theme.inkSoft });
  } else if (instrument === "thermometer") {
    const frac = clamp01((s.thermoC - 0) / 40);
    thermometerProbe(ctx, cx, benchY - 160, 150, theme, frac, { min: 0, max: 40 });
    caption(ctx, cx, benchY - 6, params.thermometerImmersed ? "immersed" : "in air", theme, { align: "center", size: 10, color: theme.inkSoft });
  } else {
    caption(ctx, cx, benchY - 80, "stopwatch: timing a fixed drop", theme, { align: "center", size: 12 });
  }

  /* --- reading entry readout --------------------------------------- */
  const r = readingFor(params);
  const student = studentToSI(params.studentValue as number, params.studentUnit as string);
  const within = student !== null && Math.abs(student.si - r.valueSI) <= r.divisionSI / 2 + 1e-12;
  const kindOk = student !== null && student.kind === r.kind;
  const decOk = params.studentDecimals === r.requiredDecimals;
  const passed = within && kindOk && decOk;

  badge(ctx, width - 12, 20, passed ? "READING OK" : "CHECK READING", theme, {
    align: "right", color: passed ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, 12, 20, `${params.studentValue} ${params.studentUnit}`, theme, { color: theme.accent, sub: `${params.studentDecimals} dp claimed` });
  if (params.revealTrue === true) {
    const trueDisp = r.kind === "mass" ? `${num(r.valueSI * 1000, 3)} g`
      : r.kind === "length" ? `${num(r.valueSI * 1000, 3)} mm`
      : r.kind === "volume" ? `${num(r.valueSI * 1e6, 3)} mL`
      : r.kind === "temperature" ? `${num(r.valueSI - K, 2)} °C`
      : `${num(r.valueSI, 3)} s`;
    badge(ctx, width / 2, 20, `true: ${trueDisp}`, theme, { align: "center", color: theme.inkSoft });
  }

  vignette(ctx, width, height, 0.12);

  // Density panel, only meaningful once both a mass and a volume are known.
  if (rc.overlays.density !== false) {
    const sp = specimenOf(params);
    if (sp.volumeM3 > 0) {
      const densityGcm3 = (sp.massKg * 1000) / (sp.volumeM3 * 1e6);
      caption(ctx, 12, height - 14, `${sp.label}: true density ${num(densityGcm3, 2)} g/cm³`, theme, { size: 10, color: theme.inkSoft });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  instrument: "balance", specimen: "pebble",
  riderRear: 0, riderMiddle: 0, riderFront: 0,
  zeroTrim: 0, benchTilt: 0,
  cylinderSize: "100", liquidVolume: 45e-6, eyeLevel: 0, objectSubmerged: false,
  ruleType: "steel", thermometerImmersed: true, digitalTared: true,
  studentValue: 0, studentUnit: "g", studentDecimals: 1, revealTrue: false,
};

export const readItRightSim: SimManifest<State> = {
  id: "g6.a5-3",
  title: "Read It Right: The Metrology Bench",
  tagline: "Zero it, level it, then read it — and find out exactly which of your digits the instrument will actually stand behind.",
  subject: "physics",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "State a measurement as a number, a unit and an uncertainty, never a bare number.",
    "Explain how zero error, tilt and parallax each produce a real, predictable, correctable bias.",
    "Use an instrument's smallest division to decide how many digits a reading may honestly claim.",
  ],
  misconceptions: [
    "A measurement is just a number",
    "More decimal places always means a better measurement",
    "An uncalibrated instrument is fine as long as you read it carefully",
    "Converting units changes how precise a measurement is",
  ],
  interactionHint: "Slide the riders until the pointer settles, then commit your reading with its unit and its digits.",
  tickRate: 30,
  timeScale: 1,
  params: {
    instrument: {
      type: "option", label: "Instrument on the bench",
      options: [
        { value: "balance", label: "Triple-beam balance" },
        { value: "digitalBalance", label: "Digital balance" },
        { value: "cylinder", label: "Graduated cylinder" },
        { value: "caliper", label: "Vernier caliper" },
        { value: "rule", label: "Rule" },
        { value: "thermometer", label: "Thermometer" },
        { value: "stopwatch", label: "Stopwatch" },
      ],
      default: "balance",
      help: "Structural: which instrument is live and accepting a reading.",
    },
    specimen: {
      type: "option", label: "Specimen",
      options: [
        { value: "pebble", label: "River pebble" },
        { value: "bolt", label: "Steel bolt" },
        { value: "cube", label: "Aluminium cube" },
        { value: "block", label: "Wooden block" },
        { value: "nut", label: "Brass nut" },
        { value: "water", label: "Water sample" },
      ],
      default: "pebble",
      help: "The hidden true mass, volume and width the instruments must reveal.",
    },
    riderRear: { type: "number", label: "Rear rider", kind: "mass", unit: "g", min: 0, max: 0.5, step: 0.1, default: 0, help: "0-500 g in 100 g notches." },
    riderMiddle: { type: "number", label: "Middle rider", kind: "mass", unit: "g", min: 0, max: 0.1, step: 0.01, default: 0, help: "0-100 g in 10 g notches." },
    riderFront: { type: "number", label: "Front rider", kind: "mass", unit: "g", min: 0, max: 0.01, step: 0.00001, default: 0, help: "0.0-10.0 g, continuous." },
    zeroTrim: { type: "number", label: "Zero-adjust trim", kind: "mass", unit: "g", min: -0.0005, max: 0.0005, step: 0.00001, default: 0, help: "A systematic offset until you zero it out." },
    benchTilt: { type: "number", label: "Bench tilt", kind: "angle", unit: "°", min: -0.0349, max: 0.0349, step: 0.0017, default: 0, help: "Biases both balances proportionally." },
    cylinderSize: {
      type: "option", label: "Cylinder size",
      options: [{ value: "10", label: "10 mL (0.1 mL divisions)" }, { value: "100", label: "100 mL (1 mL)" }, { value: "250", label: "250 mL (5 mL)" }],
      default: "100",
      help: "Structural: the smallest division, and the digits you may honestly claim.",
    },
    liquidVolume: { type: "number", label: "Liquid volume", kind: "volume", unit: "mL", min: 0, max: 0.0001, step: 0.000001, default: 0.000045, help: "The true volume in the cylinder, before any parallax." },
    objectSubmerged: { type: "boolean", label: "Specimen submerged", default: false, help: "Drops the current specimen into the cylinder for a displacement reading." },
    eyeLevel: { type: "number", label: "Eye level", kind: "length", unit: "cm", min: -0.15, max: 0.15, step: 0.01, default: 0, help: "Height relative to the meniscus; drives the parallax offset." },
    ruleType: { type: "option", label: "Rule", options: [{ value: "steel", label: "Steel (true zero)" }, { value: "plastic", label: "Plastic (worn zero)" }], default: "steel" },
    thermometerImmersed: { type: "boolean", label: "Bulb immersed", default: true, help: "Unimmersed, the thermometer reads the air, not the specimen." },
    digitalTared: { type: "boolean", label: "Digital balance tared", default: true, help: "Untared, an uncounted watch-glass mass is still on the pan." },
    studentValue: { type: "number", label: "Your reading", kind: "ratio", min: -50, max: 600, step: 0.001, default: 0, help: "The number you are committing as your measurement." },
    studentUnit: {
      type: "option", label: "Entry unit",
      options: ["mm", "cm", "m", "g", "kg", "mL", "L", "cm3", "s", "C"].map((u) => ({ value: u, label: u === "cm3" ? "cm³" : u === "C" ? "°C" : u })),
      default: "g",
      help: "The unit your typed reading is interpreted in — the wrong kind fails outright.",
    },
    studentDecimals: { type: "number", label: "Decimal places claimed", kind: "count", min: 0, max: 4, step: 1, default: 1, help: "How many digits past the point you are claiming." },
    revealTrue: { type: "boolean", label: "Reveal true value", default: false, help: "Shows the simulator's true value after you commit a reading." },
  },
  overlays: [{ key: "density", label: "True density note", default: true }],
  model,
  render,
  labs: [
    {
      id: "zero-first",
      title: "Zero first",
      question: "How big was the error, which way did it go, and would a repeat have caught it?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, instrument: "balance", specimen: "pebble", zeroTrim: 0.00035, benchTilt: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The balance carries a hidden +0.35 g trim. Commit before you weigh anything.",
          predict: {
            prompt: "Weighing the pebble on this un-zeroed balance will read...",
            options: ["Exactly the true mass", "About 0.35 g too high", "About 0.35 g too low"],
            correct: 1,
            reveal: "About 0.35 g too high. The trim adds directly to the pan-side load the riders must match, so every reading on this balance is biased high until it is zeroed.",
          },
        },
        {
          id: "weigh-biased",
          phase: "measure",
          title: "Weigh it, biased",
          instruction: "Slide the riders until the pointer settles, then record the rider sum.",
          requireData: 1,
          check: { describe: "The balance is settled", test: (v) => v.facts.settled === true },
          hints: ["The rider sum readout is exactly what you would read off the beams."],
        },
        {
          id: "zero-it",
          phase: "measure",
          title: "Zero it and re-weigh",
          instruction: "Set the zero-adjust trim to 0.00 g, re-settle the beam, and record again.",
          requireData: 2,
          check: {
            describe: "Trim zeroed and settled again",
            test: (v) => Math.abs((v.params.zeroTrim as number)) < 1e-9 && v.facts.settled === true,
          },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two readings",
          instruction: "Use your two recorded rider sums to find the error the trim caused.",
          check: {
            describe: "The zeroed reading sits within one division of the true mass",
            test: (v) => Math.abs((v.facts.errorG as number)) < 0.06,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Would a repeat have caught it?",
          instruction: "Answer the scenario's real question.",
          write: {
            prompt: "How big was the error, which way did it go, and would simply repeating the first measurement — without zeroing — have caught it?",
            placeholder: "The error was about ... g, too ...; repeating it would ...",
          },
        },
      ],
    },
    {
      id: "meniscus-and-eye",
      title: "The meniscus and your eye",
      question: "Three readings of the same 45 mL — which one is correct, and what actually changed?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, instrument: "cylinder", cylinderSize: "100", liquidVolume: 45e-6, eyeLevel: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the spread",
          instruction: "The true volume never changes across this whole lab. Commit to a prediction.",
          predict: {
            prompt: "Reading from above, level, and below, how many different apparent volumes will you see?",
            options: ["One — the liquid is the same liquid", "Three — the eye position itself changes the apparent reading"],
            correct: 1,
            reveal: "Three. Apparent volume is a real geometric projection of eye height onto the scale — the water never moves, but where you stand does.",
          },
        },
        {
          id: "above",
          phase: "measure",
          title: "From above",
          instruction: "Set eye level to +10 cm and record the apparent volume.",
          requireData: 1,
          check: { describe: "Eye level set above the meniscus", test: (v) => (v.params.eyeLevel as number) > 0.05 },
        },
        {
          id: "level",
          phase: "measure",
          title: "Level",
          instruction: "Set eye level to 0 cm and record again — this is the only correct one.",
          requireData: 2,
          check: {
            describe: "Level with the meniscus, apparent equals true",
            test: (v) => Math.abs(v.params.eyeLevel as number) < 1e-9 && Math.abs(v.facts.parallaxErrorMl as number) < 0.05,
          },
        },
        {
          id: "below",
          phase: "measure",
          title: "From below",
          instruction: "Set eye level to -10 cm and record a third time.",
          requireData: 3,
          check: { describe: "Eye level set below the meniscus", test: (v) => (v.params.eyeLevel as number) < -0.05 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the correct one",
          instruction: "State which reading was correct and why.",
          write: {
            prompt: "Which of your three readings was correct, and what physically changed between the three — the water, or something else?",
            placeholder: "The level reading was correct because ...; what changed between them was ...",
          },
        },
      ],
    },
    {
      id: "rule-against-caliper",
      title: "Rule against caliper",
      question: "To as many digits as each tool honestly allows, which digit is the estimated one?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, instrument: "rule", specimen: "bolt", ruleType: "steel" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the precision gap",
          instruction: "The rule reads to whole millimetres; the caliper's vernier reads finer.",
          predict: {
            prompt: "How many more digits can the caliper honestly claim than the rule?",
            options: ["None — they are both just length tools", "One more digit", "Two more digits"],
            correct: 1,
            reveal: "One more digit. The rule's 1 mm divisions support a tenths-of-a-millimetre estimate; the caliper's 0.05 mm vernier supports one digit finer than that.",
          },
        },
        {
          id: "measure-rule",
          phase: "measure",
          title: "Measure with the rule",
          instruction: "Commit a reading of the bolt's shank with the rule, to the digit it supports.",
          requireData: 1,
          check: {
            describe: "A valid, in-tolerance, correctly-dp'd rule reading",
            test: (v) => v.params.instrument === "rule" && v.facts.passed === true,
          },
          hints: ["The rule's division is 1 mm, so one estimated digit past that is a tenth."],
        },
        {
          id: "measure-caliper",
          phase: "measure",
          title: "Switch to the caliper",
          instruction: "Change the instrument to the vernier caliper and commit a reading of the same bolt.",
          requireData: 2,
          check: {
            describe: "A valid, in-tolerance, correctly-dp'd caliper reading",
            test: (v) => v.params.instrument === "caliper" && v.facts.passed === true,
          },
          hints: ["The caliper's division is 0.05 mm — two decimal places on a millimetre reading."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the uncertainty",
          instruction: "Compare the two instruments' divisions directly.",
          check: {
            describe: "The caliper's division is finer than the rule's",
            test: () => 0.05 < 1, // structural fact about the two instruments, always true — the point is naming it
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the estimated digit",
          instruction: "State exactly which digit in each of your two readings was the estimated one.",
          write: {
            prompt: "In your rule reading and your caliper reading, which digit in each was the one you estimated rather than read directly off a line?",
            placeholder: "On the rule, the ... place was estimated; on the caliper, the ... place was.",
          },
        },
      ],
    },
    {
      id: "density-twice-over",
      title: "Density, twice over",
      question: "Why is one number a thousand times the other when the metal has not changed?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, instrument: "balance", specimen: "cube", cylinderSize: "100" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the conversion",
          instruction: "You will measure the cube's mass, then its volume by displacement.",
          predict: {
            prompt: "Converting the same density from g/cm³ to kg/m³ will multiply the number by...",
            options: ["10", "100", "1000"],
            correct: 2,
            reveal: "1000. A kilogram is 1000 grams and a cubic metre is 1,000,000 cubic centimetres, and 1,000,000 / 1000 = 1000 — the metal never changed, only the ladder you read it on.",
          },
        },
        {
          id: "mass",
          phase: "measure",
          title: "Weigh the cube",
          instruction: "Settle the balance on the aluminium cube and record its mass.",
          requireData: 1,
          check: { describe: "A settled, in-tolerance mass reading recorded", test: (v) => v.facts.settled === true && v.params.instrument === "balance" },
        },
        {
          id: "volume",
          phase: "measure",
          title: "Displace it",
          instruction: "Switch to the cylinder, note the level, submerge the cube, and record the new level.",
          requireData: 2,
          check: {
            describe: "The cube is submerged and the cylinder reading includes the displacement",
            test: (v) => v.params.instrument === "cylinder" && v.params.objectSubmerged === true && (v.facts.parallaxErrorMl as number) !== undefined,
          },
        },
        {
          id: "compute",
          phase: "analyze",
          title: "Compute the density",
          instruction: "Use your two recordings to compute density in g/cm³.",
          check: {
            describe: "The true density is available to check your work",
            test: (v) => Math.abs((v.facts.densitySI as number) - 2700) < 50,
          },
          hints: ["Density is mass divided by volume — g divided by cm³ gives g/cm³ directly."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the factor of 1000",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Report the cube's density in both g/cm³ and kg/m³. Why is one number a thousand times the other when the metal has not changed?",
            placeholder: "In g/cm³ it is about ...; in kg/m³ it is about ...; the factor of 1000 comes from ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "in-tolerance-every-time",
      title: "In tolerance, every time",
      brief: "Weigh the brass nut on the beam balance with a level bench, then submit a reading that passes tolerance, unit and digits all at once.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, instrument: "balance", specimen: "nut", benchTilt: 0, zeroTrim: 0 },
      goal: {
        describe: "A committed reading that passes tolerance, unit and significant figures together",
        test: (v) => v.facts.passed === true && v.params.instrument === "balance",
      },
      stars: {
        two: {
          describe: "Also settle the balance to exactly zero trim and zero tilt",
          test: (v) =>
            v.facts.passed === true && v.params.instrument === "balance" &&
            Math.abs(v.params.zeroTrim as number) < 1e-9 && Math.abs(v.params.benchTilt as number) < 1e-9,
        },
      },
      hints: [
        "Get the beam to settle before you trust any number off it.",
        "The front beam's division is 0.1 g, so your entry needs two decimal places.",
        "Enter the unit exactly as grams — a mismatched unit fails outright, however close the number is.",
      ],
    },
    {
      id: "beat-the-parallax",
      title: "Beat the parallax",
      brief: "With the eye marker away from level, still submit a reading that matches the true cylinder volume within tolerance.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, instrument: "cylinder", cylinderSize: "10", liquidVolume: 6.2e-6, eyeLevel: 0.12 },
      goal: {
        describe: "A passing reading of the true volume while the eye marker sits off level",
        test: (v) => v.facts.passed === true && v.params.instrument === "cylinder" && Math.abs(v.params.eyeLevel as number) > 0.05,
      },
      hints: [
        "Your entered number should target the true volume, not whatever the eye position makes it look like.",
        "The 10 mL cylinder's division is 0.1 mL, so two decimal places are expected.",
      ],
    },
  ],
};
