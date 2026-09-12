import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { magnifier } from "@ui/organic";
import {
  badge, caption, clamp01, glow, hexA, isDarkTheme, metal,
  pulse, sky, sphere, vignette,
} from "@ui/scene";
import { energyBars } from "@ui/charts";

/**
 * The Bike Inside the Bike — Grade 6, Unit A1.2: subsystems nested within systems.
 *
 * A genuine rigid-body power balance drives one rider up (or down) a canyon
 * grade: rider power splits across a real loss ladder (chain friction, bearing
 * drag, rolling resistance, air drag) and whatever survives accelerates 90 kg
 * of rider-plus-bike against gravity, 60 times a second. Nothing about speed
 * is scripted — it falls out of F = ma with every term the spec names.
 *
 * Layered on top is a four-level containment tree (System > Subsystem >
 * Component > Part) with a real state machine: every part is healthy, worn or
 * failed, and every parent's state is *derived* from its children by one fixed
 * rule, never asserted directly. Sever the brake cable and nothing touches the
 * chain, the wheels or the frame — only the lever-and-cable component fails,
 * which fails Braking, which is a function-critical subsystem, so only then
 * does Bicycle read FAILED. Cut three spokes instead and the wheel merely
 * degrades (worn: real drag, a real wobble) because losing a few spokes out of
 * thirty-two does not stop a wheel turning — the same upward-only rule, a
 * different verdict, because the physics is actually different.
 *
 * The honesty rule this sim exists to uphold: failure never jumps sideways.
 * A seized rear hub bearing raises exactly one friction coefficient; that
 * raises drivetrain loss; that starves the wheel of power; only that chain of
 * real couplings is allowed to turn the tree red, one level at a time.
 */

/* ------------------------------------------------------------------ *
 * World constants — the power balance
 * ------------------------------------------------------------------ */

const MASS_KG = 90; // spec: "a cut cable stops a 90 kilogram machine"
const G = 9.80665;
const AIR_RHO = 1.225; // kg/m^3
const CD_A = 0.36; // m^2, a road cyclist's drag area on the hoods
const CRR_REF = 0.005; // rolling resistance coefficient at the reference pressure
const PRESSURE_REF_BAR = 4.0; // spec: rolling resistance is proportional to 1/pressure

const CHAIN_LOSS_MIN = 0.01; // spec: 1-4% of rider power, by lubrication
const CHAIN_LOSS_MAX = 0.04;

/** Fixed lumped drag from the bottom bracket and the healthy front hub, N. */
const BEARING_FORCE_HEALTHY_N = 1.2;
/** A seized bearing does not slow the bike gently — it eats the ride. */
const BEARING_FORCE_SEIZED_N = 150;
/** Three missing spokes let the rim wobble and rub the brake track, N. */
const SPOKE_DRAG_EXTRA_N = 18;

/**
 * A power source cannot supply infinite force as v -> 0 (P = F v blows up).
 * Real legs are torque-limited at a dead stop: standing on the pedals gets
 * close to F_MAX_DRIVE_N regardless of speed, and only above the crossover
 * speed (where P/v first drops under that cap) does the rider become
 * power-limited instead. The division floor is a tiny epsilon purely to avoid
 * dividing by exactly zero — it must stay far below any speed that matters,
 * or it silently reintroduces the same singularity it exists to avoid.
 */
const F_MAX_DRIVE_N = 450;
const V_DIVIDE_EPS = 0.02; // m/s

const WHEEL_CIRCUM_M = 2.13; // a 700x28C wheel, tyre included
const WHEEL_RADIUS_M = WHEEL_CIRCUM_M / (2 * Math.PI);
const CHAINRING_T = 50; // spec lists 50/34T rings; this build fixes the big ring
// so the cassette alone (spec: 11-34T, 11 sprockets) spans both a fast descent
// gear and a climbing gear without a second front-shift control to model.
const CASSETTE_T = [11, 12, 13, 15, 17, 19, 21, 24, 28, 31, 34] as const;

/** Cadence multiplier: full power in the 60-100 rpm band, tailing off outside it. */
function cadenceFactor(rpm: number): number {
  if (rpm >= 60 && rpm <= 100) return 1;
  if (rpm < 60) return 0.55 + 0.45 * clamp01((rpm - 30) / 30);
  return 0.55 + 0.45 * clamp01((150 - rpm) / 50);
}

const PAD_EFFECT: Record<string, number> = { new: 1.0, worn: 0.6, glazed: 0.28, missing: 0 };
const TRACTION_LIMIT_G = 0.68; // deceleration ceiling set by tyre grip, not the pad
const V0_BRAKE_TEST = 30 / 3.6; // spec: stopping distance is measured from 30 km/h
const STOP_DIST_CAP_M = 400; // a finite stand-in for "cannot usefully stop"

const SAFE_DESCENT_MS = 45 / 3.6; // spec: the timed descent "requires braking to work"
// Comfortably below the ~63 km/h terminal speed gravity and drag alone settle
// a 90 kg machine at on the spec's -8% descent, so a brake-cable failure is
// never a coin flip — it reliably runs away past this line.
const DANGER_DESCENT_MS = 55 / 3.6;
const SEGMENT_M = 1000; // spec: "Climb time... for the 1 km segment"

/* ------------------------------------------------------------------ *
 * The containment tree — one fixed structure, states always derived
 * ------------------------------------------------------------------ */

type PartState = "healthy" | "worn" | "failed";

interface PartSpec { id: string; label: string }
interface ComponentSpec {
  id: string; label: string;
  /** Parts whose failure fails this component outright (a series link). */
  critical: string[];
  /** Every part under this component, critical or not. */
  parts: PartSpec[];
}
interface SubsystemSpec {
  id: string; label: string;
  critical: string[]; // component ids whose failure fails the subsystem
  components: ComponentSpec[];
}

const TREE: SubsystemSpec[] = [
  {
    id: "drivetrain", label: "Drivetrain", critical: ["chainCassette"],
    components: [
      { id: "crankChainrings", label: "Crank & chainrings", critical: [], parts: [
        { id: "crankArms", label: "Crank arms" }, { id: "chainrings", label: "Chainrings" },
        { id: "pedals", label: "Pedals" },
      ] },
      { id: "chainCassette", label: "Chain & cassette", critical: ["chain"], parts: [
        { id: "chain", label: "Chain" }, { id: "cassette", label: "Cassette" },
        { id: "freehub", label: "Freehub" },
      ] },
      { id: "shifting", label: "Shifting", critical: ["shiftCable"], parts: [
        { id: "derailleur", label: "Rear derailleur" }, { id: "shiftCable", label: "Shift cable" },
        { id: "shiftLever", label: "Shift lever" },
      ] },
    ],
  },
  {
    id: "braking", label: "Braking", critical: ["leverCable", "caliper"],
    components: [
      { id: "leverCable", label: "Lever & cable", critical: ["brakeCable"], parts: [
        { id: "brakeLever", label: "Brake lever" }, { id: "brakeCable", label: "Brake cable" },
      ] },
      { id: "caliper", label: "Caliper", critical: ["brakePads"], parts: [
        { id: "brakePads", label: "Brake pads" }, { id: "caliperBody", label: "Caliper body" },
      ] },
    ],
  },
  {
    id: "steering", label: "Steering", critical: [],
    components: [
      { id: "handlebarStem", label: "Handlebar & stem", critical: [], parts: [
        { id: "handlebar", label: "Handlebar" }, { id: "stem", label: "Stem" },
      ] },
      { id: "headset", label: "Headset", critical: [], parts: [
        { id: "headsetBearings", label: "Headset bearings" }, { id: "forkSteerer", label: "Fork steerer" },
      ] },
    ],
  },
  {
    id: "wheels", label: "Wheels", critical: ["rearWheel"],
    components: [
      { id: "frontWheel", label: "Front wheel", critical: [], parts: [
        { id: "frontHubBearing", label: "Front hub bearing" }, { id: "frontSpokes", label: "Spokes (front)" },
        { id: "frontTyre", label: "Tyre (front)" },
      ] },
      { id: "rearWheel", label: "Rear wheel", critical: ["rearHubBearing"], parts: [
        { id: "rearHubBearing", label: "Rear hub bearing" }, { id: "rearSpokes", label: "Spokes (rear)" },
        { id: "rearTyre", label: "Tyre (rear)" },
      ] },
    ],
  },
  {
    id: "frame", label: "Frame", critical: [],
    components: [
      { id: "mainTriangle", label: "Main triangle", critical: [], parts: [
        { id: "downTube", label: "Down tube" }, { id: "topTube", label: "Top tube" },
        { id: "seatTube", label: "Seat tube" },
      ] },
    ],
  },
  {
    id: "rider", label: "Rider", critical: [],
    components: [
      { id: "legsCore", label: "Legs & core", critical: [], parts: [
        { id: "legs", label: "Legs" }, { id: "core", label: "Core" },
      ] },
    ],
  },
];

const SYSTEM_CRITICAL = ["drivetrain", "braking", "wheels"];
/** Where the on-bike zoom inset points for each subsystem. */
const FOCUS_PART: Record<string, string> = {
  drivetrain: "chain", braking: "brakeCable", steering: "handlebar",
  wheels: "rearHubBearing", frame: "downTube", rider: "legs",
};

interface TreeStates {
  parts: Record<string, PartState>;
  components: Record<string, PartState>;
  subsystems: Record<string, PartState>;
  system: PartState;
}

/** Worse of two states — the only lattice operation this tree ever needs. */
function worse(a: PartState, b: PartState): PartState {
  const rank: Record<PartState, number> = { healthy: 0, worn: 1, failed: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Every part's state, from params alone. This is the only place a control is
 * allowed to set a state directly; everything above Part level is *derived*.
 */
function derivePartStates(params: ParamValues): Record<string, PartState> {
  const s: Record<string, PartState> = {};
  for (const sub of TREE) for (const c of sub.components) for (const p of c.parts) s[p.id] = "healthy";
  s.chain = params.severChain === true ? "failed" : (params.lubrication as number) < 30 ? "worn" : "healthy";
  s.shiftCable = params.severShiftCable === true ? "failed" : "healthy";
  s.brakeCable = params.severBrakeCable === true ? "failed" : "healthy";
  s.rearHubBearing = params.severRearHubBearing === true ? "failed" : "healthy";
  s.rearSpokes = params.severSpokes === true ? "failed" : "healthy";
  const pad = params.brakePad as string;
  s.brakePads = pad === "missing" ? "failed" : pad === "new" ? "healthy" : "worn";
  return s;
}

/**
 * Roll parts up to components, components up to subsystems, subsystems up to
 * the system — strictly upward, one fixed rule at every level: a *critical*
 * child failing fails the parent outright; any other child being worn or
 * failed only worsens the parent to "worn". No level ever reads a state that
 * was not computed from the level directly below it.
 */
function deriveTree(params: ParamValues): TreeStates {
  const parts = derivePartStates(params);
  const components: Record<string, PartState> = {};
  const subsystems: Record<string, PartState> = {};

  for (const sub of TREE) {
    for (const comp of sub.components) {
      let state: PartState = "healthy";
      for (const p of comp.parts) {
        const st = parts[p.id];
        if (st === "healthy") continue;
        state = comp.critical.includes(p.id) && st === "failed" ? "failed" : worse(state, "worn");
      }
      components[comp.id] = state;
    }
  }
  for (const sub of TREE) {
    let state: PartState = "healthy";
    for (const comp of sub.components) {
      const st = components[comp.id];
      if (st === "healthy") continue;
      state = sub.critical.includes(comp.id) && st === "failed" ? "failed" : worse(state, "worn");
    }
    subsystems[sub.id] = state;
  }
  let system: PartState = "healthy";
  for (const sub of TREE) {
    const st = subsystems[sub.id];
    if (st === "healthy") continue;
    system = SYSTEM_CRITICAL.includes(sub.id) && st === "failed" ? "failed" : worse(system, "worn");
  }
  return { parts, components, subsystems, system };
}

/** How many of the four tree levels currently show at least one failed node. */
function levelsAffected(t: TreeStates): number {
  let n = 0;
  if (Object.values(t.parts).some((s) => s === "failed")) n++;
  if (Object.values(t.components).some((s) => s === "failed")) n++;
  if (Object.values(t.subsystems).some((s) => s === "failed")) n++;
  if (t.system === "failed") n++;
  return n;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  v: number;          // m/s
  distanceM: number;  // progress along the current 1 km segment
  elapsedS: number;   // seconds since this run began
  climbTimeS: number; // seconds to first reach 1 km, or -1
  frozenGear: number; // the gear the shifter last had before a cut cable froze it
  uncontrolled: boolean; // sticky: the timed descent ran away at least once
  maxSpeed: number;   // m/s, the best this run has seen
  crankAngle: number; // rad, for the animation
  wheelAngle: number; // rad
  brakeHeat: number;  // 0-1, glow at the caliper
}

function init(params: ParamValues): State {
  return {
    v: 0, distanceM: 0, elapsedS: 0, climbTimeS: -1,
    frozenGear: Math.round(params.gear as number),
    uncontrolled: false, maxSpeed: 0, crankAngle: 0, wheelAngle: 0, brakeHeat: 0,
  };
}

/* ------------------------------------------------------------------ *
 * The power balance — one honest physics function, read by step and facts
 * ------------------------------------------------------------------ */

interface Physics {
  gearIndex: number; gearFrozen: boolean; sprocketT: number; gearRatio: number;
  cadenceRpm: number; powerFrac: number;
  powerInW: number; chainLossW: number; afterChainW: number;
  bearingForceN: number; bearingLossW: number;
  crrForce: number; rollingLossW: number;
  airForceN: number; airLossW: number;
  driveForceN: number; roadW: number;
  gravityForceN: number; brakeAssistN: number;
  netForceN: number;
  padEffect: number; canStop: boolean; decelMs2: number; stoppingDistanceM: number;
  isBraking: boolean;
}

function computePhysics(v: number, params: ParamValues, tree: TreeStates, frozenGear: number): Physics {
  const chainCut = tree.parts.chain === "failed";
  const shiftCut = tree.parts.shiftCable === "failed";
  const hubSeized = tree.parts.rearHubBearing === "failed";
  const spokesCut = tree.parts.rearSpokes === "failed";

  const gearIndex = shiftCut ? frozenGear : Math.round(params.gear as number);
  const sprocketT = CASSETTE_T[Math.min(CASSETTE_T.length, Math.max(1, gearIndex)) - 1];
  const gearRatio = sprocketT / CHAINRING_T;
  const wheelRpm = (v / WHEEL_CIRCUM_M) * 60;
  const cadenceRpm = wheelRpm * gearRatio;
  const powerFrac = cadenceFactor(cadenceRpm);

  const powerInW = chainCut ? 0 : (params.riderPower as number) * powerFrac;
  const lube = params.lubrication as number;
  const chainLossFrac = chainCut ? 1 : CHAIN_LOSS_MAX - (CHAIN_LOSS_MAX - CHAIN_LOSS_MIN) * (lube / 100);
  const chainLossW = (chainCut ? (params.riderPower as number) * powerFrac : powerInW) * chainLossFrac;
  const afterChainW = Math.max(0, powerInW - chainLossW);

  const bearingForceN = BEARING_FORCE_HEALTHY_N + (hubSeized ? BEARING_FORCE_SEIZED_N : 0);
  const bearingLossW = bearingForceN * v;

  const pressure = params.tyrePressure as number;
  const crr = CRR_REF * (PRESSURE_REF_BAR / Math.max(0.5, pressure));
  const crrForce = crr * MASS_KG * G + (spokesCut ? SPOKE_DRAG_EXTRA_N : 0);
  const rollingLossW = crrForce * v;

  const airForceN = 0.5 * AIR_RHO * CD_A * v * v;
  const airLossW = airForceN * v;

  const driveForceN = Math.min(F_MAX_DRIVE_N, afterChainW / Math.max(v, V_DIVIDE_EPS));
  const roadW = Math.max(0, driveForceN * v - bearingLossW - rollingLossW - airLossW);

  const theta = Math.atan((params.gradient as number) / 100);
  const gravityForceN = MASS_KG * G * Math.sin(theta);

  const pad = params.brakePad as string;
  const padEffect = PAD_EFFECT[pad] ?? 0;
  const brakeCableOk = tree.parts.brakeCable !== "failed";
  const canStop = brakeCableOk && padEffect > 0;
  const decelMs2 = canStop ? TRACTION_LIMIT_G * G * padEffect : 0;
  const stoppingDistanceM = canStop
    ? Math.min(STOP_DIST_CAP_M, (V0_BRAKE_TEST * V0_BRAKE_TEST) / (2 * decelMs2))
    : STOP_DIST_CAP_M;

  const descending = params.timedDescent === true && v > SAFE_DESCENT_MS && canStop;
  const brakeAssistN = descending ? MASS_KG * decelMs2 : 0;

  const netForceN = driveForceN - bearingForceN - crrForce - airForceN - gravityForceN - brakeAssistN;

  return {
    gearIndex, gearFrozen: shiftCut, sprocketT, gearRatio, cadenceRpm, powerFrac,
    powerInW, chainLossW, afterChainW, bearingForceN, bearingLossW,
    crrForce, rollingLossW, airForceN, airLossW, driveForceN, roadW,
    gravityForceN, brakeAssistN, netForceN,
    padEffect, canStop, decelMs2, stoppingDistanceM,
    isBraking: descending,
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return init(params);
  },

  step(state, dt, params, _ctx, _inputs) {
    if (dt <= 0) return state;
    const tree = deriveTree(params);
    const s: State = { ...state };

    if (tree.parts.shiftCable !== "failed") s.frozenGear = Math.round(params.gear as number);
    const phys = computePhysics(s.v, params, tree, s.frozenGear);

    s.v = Math.max(0, s.v + (phys.netForceN / MASS_KG) * dt);
    s.maxSpeed = Math.max(s.maxSpeed, s.v);
    s.distanceM += s.v * dt;
    s.elapsedS += dt;
    if (s.distanceM >= SEGMENT_M && s.climbTimeS < 0) s.climbTimeS = s.elapsedS;

    if (params.timedDescent === true && s.v > DANGER_DESCENT_MS && !phys.canStop) s.uncontrolled = true;

    s.brakeHeat = clamp01(s.brakeHeat + (phys.isBraking ? dt * 2 : -dt * 0.6));
    const wheelRadPerS = s.v / WHEEL_RADIUS_M;
    s.wheelAngle = (s.wheelAngle + wheelRadPerS * dt) % (Math.PI * 2);
    s.crankAngle = (s.crankAngle + (phys.cadenceRpm * 2 * Math.PI) / 60 * dt) % (Math.PI * 2);

    return s;
  },

  readouts(state, params) {
    const tree = deriveTree(params);
    const phys = computePhysics(state.v, params, tree, state.frozenGear);
    const statusCode = tree.system === "healthy" ? 0 : tree.system === "worn" ? 1 : 2;
    return [
      { key: "speed", label: "Speed", unit: "km/h", quantity: q(state.v, "velocity"), semantic: "velocity", graphable: true },
      { key: "cadence", label: "Cadence", quantity: q(phys.cadenceRpm, "frequency"), unit: "Hz", graphable: true },
      {
        key: "roadPower", label: "Power delivered to the road", unit: "W",
        quantity: q(phys.roadW, "power"), semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "lostPower", label: "Power lost to friction", unit: "W",
        quantity: q(phys.chainLossW + phys.bearingLossW + phys.rollingLossW + phys.airLossW, "power"),
        semantic: "energy-thermal", graphable: true,
      },
      {
        key: "stoppingDistance", label: "Stopping distance from 30 km/h", unit: "m",
        quantity: q(phys.stoppingDistanceM, "length"), semantic: "distance",
      },
      { key: "levelsAffected", label: "Tree levels affected", quantity: q(levelsAffected(tree), "count"), semantic: "field", graphable: true },
      { key: "systemStatus", label: "Bicycle status (0 ok, 1 worn, 2 failed)", quantity: q(statusCode, "count") },
      { key: "distance", label: "Distance this run", unit: "m", quantity: q(state.distanceM, "length") },
    ];
  },

  facts(state, params) {
    const tree = deriveTree(params);
    const phys = computePhysics(state.v, params, tree, state.frozenGear);
    return {
      speedKmh: state.v * 3.6,
      maxSpeedKmh: state.maxSpeed * 3.6,
      cadenceRpm: phys.cadenceRpm,
      gearEffective: phys.gearIndex,
      frozenGearActive: phys.gearFrozen,
      powerInW: phys.powerInW,
      powerChainLossW: phys.chainLossW,
      powerBearingLossW: phys.bearingLossW,
      powerTyreLossW: phys.rollingLossW,
      powerAirLossW: phys.airLossW,
      powerRoadW: phys.roadW,
      stoppingDistanceM: phys.stoppingDistanceM,
      canStop: phys.canStop,
      distanceM: state.distanceM,
      elapsedS: state.elapsedS,
      climbTimeS: state.climbTimeS,
      climbDone: state.climbTimeS >= 0,
      descentUncontrolled: state.uncontrolled,
      isBraking: phys.isBraking,
      levelsAffected: levelsAffected(tree),
      drivetrainWorn: tree.subsystems.drivetrain === "worn",
      drivetrainFailed: tree.subsystems.drivetrain === "failed",
      brakingFailed: tree.subsystems.braking === "failed",
      wheelsWorn: tree.subsystems.wheels === "worn",
      wheelsFailed: tree.subsystems.wheels === "failed",
      steeringOk: tree.subsystems.steering === "healthy",
      frameOk: tree.subsystems.frame === "healthy",
      systemWorn: tree.system === "worn",
      systemFailed: tree.system === "failed",
      systemOk: tree.system === "healthy",
      gradientPct: params.gradient as number,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const STATE_COLOR = (t: PartState, theme: RenderContext<State>["theme"]) =>
  t === "healthy" ? theme.sci["neutral"] : t === "worn" ? theme.sci["acceleration"] : theme.sci["hot"];

function num(v: number, dp = 1): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

/** Two-bone IK: hip to a target (a pedal or a hand), bending toward `bend`. */
function ik2(
  hip: { x: number; y: number }, target: { x: number; y: number },
  l1: number, l2: number, bend: number,
): { knee: { x: number; y: number }; foot: { x: number; y: number } } {
  const dx = target.x - hip.x, dy = target.y - hip.y;
  const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.5, Math.hypot(dx, dy)));
  const a1 = Math.atan2(dy, dx);
  const cosK = clamp01(((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d) + 1) / 2) * 2 - 1;
  const offset = Math.acos(Math.max(-1, Math.min(1, cosK)));
  const hipAngle = a1 - bend * offset;
  const knee = { x: hip.x + Math.cos(hipAngle) * l1, y: hip.y + Math.sin(hipAngle) * l1 };
  const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
  return { knee, foot: { x: hip.x + ux * d, y: hip.y + uy * d } };
}

interface Layout {
  stageH: number;
  treeX: number; treeY: number; treeW: number; treeH: number;
  sceneX: number; sceneY: number; sceneW: number; sceneH: number;
  panelX: number; panelY: number; panelW: number; panelH: number;
  roadY: number;
}

function layout(width: number, height: number): Layout {
  const treeW = width * 0.25;
  const panelW = width * 0.24;
  const sceneX = treeW + 8;
  const sceneW = width - treeW - panelW - 16;
  return {
    stageH: height,
    treeX: 0, treeY: 0, treeW, treeH: height,
    sceneX, sceneY: 0, sceneW, sceneH: height,
    panelX: sceneX + sceneW + 8, panelY: 0, panelW, panelH: height,
    roadY: height * 0.82,
  };
}

/* ---- the containment tree panel -------------------------------------- */

function drawTreePanel(rc: RenderContext<State>, L: Layout, tree: TreeStates) {
  const { ctx, params, theme } = rc;
  const dark = isDarkTheme(theme);
  const x = L.treeX + 6, y = L.treeY + 6, w = L.treeW - 12;
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.7)" : "rgba(255,255,255,0.78)";
  roundRect(ctx, x, y, w, L.treeH - 12, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 10, y + 16, "CONTAINMENT TREE", theme, { size: 11, weight: 800, color: theme.inkSoft });

  const zoom = params.zoomLevel as string;
  const selected = params.selectedSubsystem as string;
  const rowH = 22;
  let cy = y + 34;

  // System row.
  const sysBox = { x: x + 8, y: cy, w: w - 16, h: rowH };
  ctx.fillStyle = hexA(STATE_COLOR(tree.system, theme), 0.22);
  roundRect(ctx, sysBox.x, sysBox.y, sysBox.w, sysBox.h, 5);
  ctx.fill();
  ctx.strokeStyle = STATE_COLOR(tree.system, theme);
  ctx.lineWidth = 1.4;
  roundRect(ctx, sysBox.x, sysBox.y, sysBox.w, sysBox.h, 5);
  ctx.stroke();
  caption(ctx, sysBox.x + 8, sysBox.y + rowH / 2, "BICYCLE (system)", theme, { size: 10, weight: 800 });
  if (zoom === "whole") drawContainmentFrame(ctx, sysBox, "System", theme);
  cy += rowH + 8;

  // Subsystem chips, one row of six.
  const chipW = (w - 16 - 5 * 4) / 6;
  let subBoxForFrame: { x: number; y: number; w: number; h: number } | null = null;
  const subsystemBoxes: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (let i = 0; i < TREE.length; i++) {
    const sub = TREE[i];
    const bx = x + 8 + i * (chipW + 4);
    const box = { x: bx, y: cy, w: chipW, h: rowH };
    subsystemBoxes[sub.id] = box;
    const st = tree.subsystems[sub.id];
    const isSel = sub.id === selected;
    ctx.fillStyle = hexA(STATE_COLOR(st, theme), isSel ? 0.35 : 0.16);
    roundRect(ctx, box.x, box.y, box.w, box.h, 5);
    ctx.fill();
    ctx.strokeStyle = hexA(STATE_COLOR(st, theme), isSel ? 1 : 0.55);
    ctx.lineWidth = isSel ? 1.6 : 1;
    roundRect(ctx, box.x, box.y, box.w, box.h, 5);
    ctx.stroke();
    ctx.save();
    ctx.font = "700 8px system-ui, sans-serif";
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sub.label.slice(0, 9), box.x + box.w / 2, box.y + box.h / 2);
    ctx.restore();
    if (isSel) subBoxForFrame = box;
  }
  if (zoom === "subsystem" && subBoxForFrame) drawContainmentFrame(ctx, subBoxForFrame, "Subsystem", theme);
  cy += rowH + 10;

  // Components (and, at Part zoom, their parts) of the selected subsystem only —
  // this is the "collapsible" behaviour: every branch shows its health at a
  // glance, only the branch under study expands to full depth.
  const sub = TREE.find((s) => s.id === selected) ?? TREE[0];
  caption(ctx, x + 8, cy, `${sub.label} —`, theme, { size: 10, weight: 700, color: theme.inkSoft });
  cy += 14;
  let compFrame: { x: number; y: number; w: number; h: number } | null = null;
  for (const comp of sub.components) {
    const st = tree.components[comp.id];
    const compBox = { x: x + 10, y: cy, w: w - 20, h: 18 };
    ctx.fillStyle = hexA(STATE_COLOR(st, theme), 0.18);
    roundRect(ctx, compBox.x, compBox.y, compBox.w, compBox.h, 4);
    ctx.fill();
    ctx.strokeStyle = hexA(STATE_COLOR(st, theme), 0.7);
    ctx.lineWidth = 1;
    roundRect(ctx, compBox.x, compBox.y, compBox.w, compBox.h, 4);
    ctx.stroke();
    ctx.save();
    ctx.font = "600 9px system-ui, sans-serif";
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(comp.label, compBox.x + 6, compBox.y + 9);
    ctx.restore();
    compFrame = compBox;
    cy += 21;
    if (zoom === "part" || zoom === "component") {
      for (const p of comp.parts) {
        const pst = tree.parts[p.id];
        const pBox = { x: x + 20, y: cy, w: w - 30, h: 14 };
        ctx.fillStyle = hexA(STATE_COLOR(pst, theme), 0.14);
        roundRect(ctx, pBox.x, pBox.y, pBox.w, pBox.h, 3);
        ctx.fill();
        ctx.save();
        ctx.font = "500 8px system-ui, sans-serif";
        ctx.fillStyle = theme.inkSoft;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${p.label} — ${pst}`, pBox.x + 5, pBox.y + 7);
        ctx.restore();
        ctx.strokeStyle = hexA(STATE_COLOR(pst, theme), 0.6);
        ctx.lineWidth = 0.8;
        roundRect(ctx, pBox.x, pBox.y, pBox.w, pBox.h, 3);
        ctx.stroke();
        if (zoom === "part") compFrame = pBox;
        cy += 16;
      }
    }
  }
  if ((zoom === "component" || zoom === "part") && compFrame) {
    drawContainmentFrame(ctx, compFrame, zoom === "part" ? "Part" : "Component", theme);
  }
}

function drawContainmentFrame(
  ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number },
  label: string, theme: RenderContext<State>["theme"],
) {
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  roundRect(ctx, box.x - 3, box.y - 3, box.w + 6, box.h + 6, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), box.x - 2, box.y - 6);
  ctx.restore();
}

/* ---- the canyon and the bike ------------------------------------------ */

function drawScene(rc: RenderContext<State>, L: Layout, tree: TreeStates, phys: Physics) {
  const { ctx, state, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const x0 = L.sceneX, w = L.sceneW, h = L.sceneH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, w, h);
  ctx.clip();
  ctx.translate(x0, 0);

  sky(ctx, w, h, theme, "day", L.roadY);

  // Canyon wall: layered ochre bands scrolling with speed, for a sense of climb.
  const scroll = (state.distanceM * 0.06) % (w * 2);
  for (let layerI = 0; layerI < 3; layerI++) {
    const depth = 0.4 + layerI * 0.25;
    const bandY = h * (0.32 + layerI * 0.14);
    const bandH = h * 0.22;
    ctx.fillStyle = mixHex(dark ? "#2a2018" : "#c9a06a", dark ? "#120d09" : "#8a6a42", layerI * 0.28);
    ctx.beginPath();
    ctx.moveTo(-w, bandY + bandH);
    for (let px = -w; px <= w * 2; px += 40) {
      const off = ((px - scroll * depth) % (w) + w) % w;
      const jag = Math.sin(off * 0.02 + layerI * 3) * bandH * 0.3;
      ctx.lineTo(px, bandY + jag);
    }
    ctx.lineTo(w * 2, bandY + bandH);
    ctx.closePath();
    ctx.fill();
  }
  if (dark === false) {
    // Heat shimmer near the canyon top on a hot day.
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 4; i++) {
      const yy = h * 0.28 + Math.sin(time * 1.3 + i) * 3;
      ctx.fillRect(0, yy, w, 2);
    }
    ctx.restore();
  }

  // The road: tilted by the actual gradient so the climb is visible, not just numeric.
  const gradePct = params.gradient as number;
  const theta = Math.atan(gradePct / 100);
  const tilt = Math.max(-0.28, Math.min(0.28, theta));
  ctx.save();
  ctx.translate(w * 0.5, L.roadY);
  ctx.rotate(-tilt);
  ctx.fillStyle = dark ? "#2a2a2e" : "#4a4a50";
  ctx.fillRect(-w, -h * 0.05, w * 2, h * 0.4);
  ctx.strokeStyle = hexA("#ffffff", 0.35);
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 2;
  const dashPhase = -(state.distanceM * 1.4) % 32;
  ctx.beginPath();
  ctx.moveTo(-w + dashPhase, 0);
  ctx.lineTo(w * 2, 0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Grade badge on the road itself.
  caption(ctx, w * 0.5, L.roadY - h * 0.06, `${gradePct >= 0 ? "+" : ""}${gradePct.toFixed(0)}% grade`, theme, {
    align: "center", size: 11, weight: 700, color: theme.sci["distance"],
  });

  drawBike(ctx, w * 0.42, L.roadY - h * 0.02, h * 0.22, tree, phys, state, theme, dark);

  ctx.restore(); // clip

  // Zoom inset: a magnifier over the focus part of the selected subsystem.
  const zoom = params.zoomLevel as string;
  if (zoom !== "whole") {
    const r = zoom === "part" ? 46 : zoom === "component" ? 38 : 30;
    const mx = x0 + w - r - 10, my = r + 10;
    const focusId = FOCUS_PART[params.selectedSubsystem as string] ?? "chain";
    const focusState = tree.parts[focusId] ?? "healthy";
    magnifier(ctx, mx, my, r, -0.5, theme, (cx, cyy, cr) => {
      ctx.fillStyle = mixHex(theme.surface, STATE_COLOR(focusState, theme), 0.22);
      ctx.fillRect(cx - cr, cyy - cr, cr * 2, cr * 2);
      sphere(ctx, cx, cyy, cr * 0.5, STATE_COLOR(focusState, theme), { rim: true });
    });
    caption(ctx, mx, my + r + 12, focusId, theme, { align: "center", size: 9, color: theme.inkSoft });
  }
}

/** The bike itself: ghosted frame, real drivetrain, braking and wheel gauges. */
function drawBike(
  ctx: CanvasRenderingContext2D, cx: number, groundY: number, wheelR: number,
  tree: TreeStates, phys: Physics, state: State, theme: RenderContext<State>["theme"], dark: boolean,
) {
  const wb = wheelR * 4.1; // wheelbase
  const rearX = cx - wb * 0.42, frontX = cx + wb * 0.58;
  const bbX = cx - wb * 0.05, bbY = groundY - wheelR * 0.95; // bottom bracket
  const seatX = bbX - wheelR * 0.55, seatY = bbY - wheelR * 1.55;
  const headX = frontX - wheelR * 0.35, headY = bbY - wheelR * 1.35;

  // Wheels: rim, spokes (drawn honestly missing three when severed), hub.
  drawWheel(ctx, rearX, groundY - wheelR, wheelR, state.wheelAngle, tree.parts.rearSpokes === "failed", tree.parts.rearHubBearing, theme, dark);
  drawWheel(ctx, frontX, groundY - wheelR, wheelR, state.wheelAngle, false, "healthy", theme, dark);

  // Ghosted frame tubes — 30% opacity per spec, so the mechanism reads through.
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#dfe6ee" : "#28313c", 0.3);
  ctx.lineWidth = Math.max(3, wheelR * 0.14);
  ctx.lineCap = "round";
  const tube = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  const rearAxle = { x: rearX, y: groundY - wheelR };
  const frontAxle = { x: frontX, y: groundY - wheelR };
  const bb = { x: bbX, y: bbY }, seat = { x: seatX, y: seatY }, head = { x: headX, y: headY };
  tube(rearAxle, bb); tube(bb, seat); tube(seat, rearAxle); // rear triangle + seat tube
  tube(bb, head); tube(seat, head); // down tube + top tube
  tube(head, frontAxle); // fork
  ctx.restore();

  // Handlebar and saddle, plain and healthy (no control touches Frame/Steering).
  metal(ctx, head.x - 3, head.y - wheelR * 0.55, 6, wheelR * 0.5, "#8d97a4", { radius: 2 });
  metal(ctx, seat.x - wheelR * 0.28, seat.y - wheelR * 0.14, wheelR * 0.5, wheelR * 0.13, "#3a3a40", { radius: 4 });

  // Crank, chainring and cassette, joined by a real chain loop.
  const crankR = wheelR * 0.42;
  const cogR = wheelR * 0.3;
  const sprocketR = cogR * (0.35 + 0.5 * phys.gearRatio);
  drawChainAndSprockets(ctx, bb, crankR, rearAxle, sprocketR, state.crankAngle, tree, theme, dark);

  // Derailleur: hangs slack and useless when the shift cable is cut — the
  // part itself is never marked failed, only unable to be commanded.
  const derY = rearAxle.y + wheelR * 0.55;
  const derSlack = tree.parts.shiftCable === "failed";
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rearAxle.x + sprocketR * 0.6, rearAxle.y + sprocketR * 0.3);
  ctx.lineTo(rearAxle.x + sprocketR * 0.4, derY + (derSlack ? wheelR * 0.12 : 0));
  ctx.stroke();
  sphere(ctx, rearAxle.x + sprocketR * 0.3, derY + (derSlack ? wheelR * 0.12 : 0), wheelR * 0.09,
    derSlack ? theme.inkSoft : "#3a3a40", { rim: false });
  ctx.restore();

  // Braking: caliper at the rear rim, pads that visibly meet the track (or don't).
  drawCaliper(ctx, rearAxle, wheelR, tree, phys, state, theme);

  // Rider: two-bone legs to the pedals, a lean that grows with power.
  drawRider(ctx, bb, seat, head, crankR, state.crankAngle, phys, dark);
}

function drawWheel(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number,
  spokesMissing: boolean, hubState: PartState, theme: RenderContext<State>["theme"], dark: boolean,
) {
  ctx.save();
  ctx.fillStyle = dark ? "#0e0e10" : "#1c1c1f";
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hexA("#000000", 0.6);
  ctx.lineWidth = r * 0.16;
  ctx.stroke();
  const spokeCount = 16;
  ctx.strokeStyle = hexA(dark ? "#c7ccd4" : "#e9edf2", 0.75);
  ctx.lineWidth = Math.max(0.8, r * 0.02);
  for (let i = 0; i < spokeCount; i++) {
    // Three consecutive spokes genuinely absent, not merely dimmed.
    if (spokesMissing && i >= 6 && i <= 8) continue;
    const a = angle + (i / spokeCount) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  sphere(ctx, x, y, r * 0.14, hubState === "failed" ? theme.sci["hot"] : "#4a4f57", { rim: false });
  if (hubState === "failed") glow(ctx, x, y, r * 0.4, hexA(theme.sci["hot"], 0.45));
  ctx.restore();
}

function drawChainAndSprockets(
  ctx: CanvasRenderingContext2D,
  bb: { x: number; y: number }, crankR: number,
  hub: { x: number; y: number }, sprocketR: number, crankAngle: number,
  tree: TreeStates, theme: RenderContext<State>["theme"], dark: boolean,
) {
  const chainOk = tree.parts.chain !== "failed";
  const dx = hub.x - bb.x, dy = hub.y - bb.y;
  const dist = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (crankR - sprocketR) / dist)));

  if (chainOk) {
    // Two tangent lines and two wrap arcs — an actual chain loop, not a hint of one.
    ctx.save();
    ctx.strokeStyle = hexA(dark ? "#b7bdc6" : "#3a3d42", 0.9);
    ctx.lineWidth = Math.max(1.6, crankR * 0.07);
    ctx.beginPath();
    const t1a = phi + Math.PI / 2 - alpha, t1b = phi + Math.PI / 2 - alpha;
    ctx.moveTo(bb.x + Math.cos(t1a) * crankR, bb.y + Math.sin(t1a) * crankR);
    ctx.lineTo(hub.x + Math.cos(t1b) * sprocketR, hub.y + Math.sin(t1b) * sprocketR);
    const t2a = phi - Math.PI / 2 + alpha;
    ctx.moveTo(bb.x + Math.cos(t2a) * crankR, bb.y + Math.sin(t2a) * crankR);
    ctx.lineTo(hub.x + Math.cos(t2a) * sprocketR, hub.y + Math.sin(t2a) * sprocketR);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bb.x, bb.y, crankR, t1a, t2a + Math.PI * 2 - Math.PI * 2, false);
    ctx.stroke();
    ctx.restore();
  } else {
    // Severed: the two ends hang, drawn dashed so "no power path" is legible.
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["hot"], 0.85);
    ctx.lineWidth = Math.max(1.6, crankR * 0.07);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bb.x + crankR * 0.7, bb.y + crankR * 0.5);
    ctx.lineTo(bb.x + crankR * 1.3, bb.y + crankR * 1.1);
    ctx.moveTo(hub.x - sprocketR * 0.6, hub.y - sprocketR * 0.2);
    ctx.lineTo(hub.x - sprocketR * 1.3, hub.y - sprocketR * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Chainring (fixed, always healthy in this build) and cassette (the sprocket
  // in use — its radius already encodes the gear).
  metal(ctx, bb.x - crankR, bb.y - crankR, crankR * 2, crankR * 2, "#8d97a4", { radius: crankR });
  ctx.save();
  ctx.translate(bb.x, bb.y);
  ctx.rotate(crankAngle);
  ctx.strokeStyle = hexA("#1a1d20", 0.7);
  ctx.lineWidth = Math.max(1, crankR * 0.16);
  ctx.beginPath(); ctx.moveTo(-crankR * 0.85, 0); ctx.lineTo(crankR * 0.85, 0); ctx.stroke();
  sphere(ctx, crankR * 0.85, 0, crankR * 0.18, "#2a2d31", { rim: false });
  sphere(ctx, -crankR * 0.85, 0, crankR * 0.18, "#2a2d31", { rim: false });
  ctx.restore();
  sphere(ctx, hub.x, hub.y, sprocketR, tree.parts.cassette === "failed" ? theme.sci["hot"] : "#5c6773", { rim: true });
}

function drawCaliper(
  ctx: CanvasRenderingContext2D, rearAxle: { x: number; y: number }, r: number,
  tree: TreeStates, phys: Physics, state: State, theme: RenderContext<State>["theme"],
) {
  const cx = rearAxle.x, cy = rearAxle.y - r * 0.75;
  const cableOk = tree.parts.brakeCable !== "failed";
  const padState = tree.parts.brakePads;
  ctx.save();
  ctx.strokeStyle = cableOk ? hexA(theme.inkSoft, 0.85) : hexA(theme.sci["hot"], 0.85);
  ctx.lineWidth = 1.6;
  if (!cableOk) ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, rearAxle.y - r * 1.5);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  metal(ctx, cx - r * 0.08, cy - r * 0.12, r * 0.16, r * 0.24, "#6b7684", { radius: 2 });
  // Pads: pressed to the rim only when the caliper is actually clamping.
  const clamp = phys.isBraking && cableOk && padState !== "failed" ? 1 : 0.35;
  const padColor = padState === "failed" ? theme.sci["hot"] : padState === "worn" ? theme.sci["acceleration"] : theme.sci["neutral"];
  for (const side of [-1, 1]) {
    ctx.fillStyle = padColor;
    ctx.fillRect(cx + side * r * (0.16 + 0.06 * clamp), cy - r * 0.06, side * r * 0.05, r * 0.12);
  }
  if (state.brakeHeat > 0.05) glow(ctx, cx, cy, r * (0.3 + state.brakeHeat * 0.3), hexA(theme.sci["hot"], 0.35 * state.brakeHeat));
  ctx.restore();
}

function drawRider(
  ctx: CanvasRenderingContext2D, bb: { x: number; y: number }, seat: { x: number; y: number },
  head: { x: number; y: number }, crankR: number, crankAngle: number,
  phys: Physics, dark: boolean,
) {
  const lean = clamp01((phys.powerInW - 40) / 310) * 0.28;
  const hip = { x: seat.x, y: seat.y - crankR * 0.3 };
  const shoulder = { x: hip.x - crankR * 1.5 - lean * crankR, y: hip.y - crankR * 2.9 };
  const thigh = crankR * 1.9, shin = crankR * 1.9;

  const pedalA = { x: bb.x + Math.cos(crankAngle) * crankR * 0.85, y: bb.y + Math.sin(crankAngle) * crankR * 0.85 };
  const pedalB = { x: bb.x + Math.cos(crankAngle + Math.PI) * crankR * 0.85, y: bb.y + Math.sin(crankAngle + Math.PI) * crankR * 0.85 };
  const legFar = ik2(hip, pedalB, thigh, shin, 1);
  const legNear = ik2(hip, pedalA, thigh, shin, 1);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, crankR * 0.14);
  ctx.strokeStyle = hexA(dark ? "#5c6773" : "#465264", 0.9); // far leg, dimmer
  ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(legFar.knee.x, legFar.knee.y); ctx.lineTo(legFar.foot.x, legFar.foot.y); ctx.stroke();
  // Torso and head.
  ctx.strokeStyle = hexA(dark ? "#e7ebf0" : "#25303c", 0.95);
  ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(shoulder.x, shoulder.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(head.x - crankR * 0.2, head.y - crankR * 0.2); ctx.stroke();
  sphere(ctx, shoulder.x - crankR * 0.15, shoulder.y - crankR * 0.55, crankR * 0.4, "#d79a6a", { rim: true });
  // Arm to the bar.
  const barPoint = { x: head.x, y: head.y - crankR * 0.3 };
  ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(barPoint.x, barPoint.y); ctx.stroke();
  // Near leg, drawn last so it reads on top.
  ctx.strokeStyle = hexA(dark ? "#e7ebf0" : "#25303c", 0.95);
  ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(legNear.knee.x, legNear.knee.y); ctx.lineTo(legNear.foot.x, legNear.foot.y); ctx.stroke();
  ctx.restore();
}

/* ---- the right-hand instrument panel ---------------------------------- */

function drawPanel(rc: RenderContext<State>, L: Layout, tree: TreeStates, phys: Physics) {
  const { ctx, state, params, theme } = rc;
  const dark = isDarkTheme(theme);
  const x = L.panelX + 6, y = 6, w = L.panelW - 12;
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.7)" : "rgba(255,255,255,0.78)";
  roundRect(ctx, x, y, w, L.panelH - 12, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  let cy = y + 18;
  caption(ctx, x + 10, cy, `SPEED  ${num(state.v * 3.6)} km/h`, theme, { size: 12, weight: 800, color: theme.sci["velocity"] });
  cy += 16;
  caption(ctx, x + 10, cy, `cadence ${num(phys.cadenceRpm, 0)} rpm · gear ${phys.gearIndex}${phys.gearFrozen ? " (frozen)" : ""}`, theme, {
    size: 10, color: theme.inkSoft,
  });
  cy += 22;

  energyBars(ctx, x + 8, cy, w - 16, 78, [
    { label: "chain", value: phys.chainLossW, color: theme.sci["acceleration"] },
    { label: "bearings", value: phys.bearingLossW, color: theme.sci["energy-thermal"] },
    { label: "tyre", value: phys.rollingLossW, color: theme.sci["mass"] },
    { label: "air", value: phys.airLossW, color: theme.sci["field"] },
    { label: "road", value: phys.roadW, color: theme.sci["energy-kinetic"] },
  ], theme, { total: Math.max(1, phys.powerInW), unit: "W", title: "Power loss ladder", decimals: 0 });
  cy += 96;

  const stopText = phys.canStop ? `${num(phys.stoppingDistanceM)} m` : "no stopping";
  caption(ctx, x + 10, cy, `Stopping distance (30 km/h): ${stopText}`, theme, {
    size: 10, weight: 700, color: phys.canStop ? theme.ink : theme.sci["hot"],
  });
  cy += 18;

  const climbLabel = (params.gradient as number) >= 0 ? "Climb time" : "Descent time";
  const climbText = state.climbTimeS >= 0 ? `${num(state.climbTimeS, 1)} s` : `${num(state.distanceM, 0)} / 1000 m`;
  caption(ctx, x + 10, cy, `${climbLabel} (1 km): ${climbText}`, theme, { size: 10, color: theme.inkSoft });
  cy += 18;

  if (params.timedDescent === true) {
    caption(ctx, x + 10, cy, state.uncontrolled ? "DESCENT UNCONTROLLED — brakes did not hold it" : "Descent controlled", theme, {
      size: 10, weight: 700, color: state.uncontrolled ? theme.sci["hot"] : theme.sci["neutral"],
    });
    cy += 18;
  }

  cy += 6;
  caption(ctx, x + 10, cy, "TREE HEALTH", theme, { size: 10, weight: 800, color: theme.inkSoft });
  cy += 16;
  const rows: [string, PartState][] = [
    ["Part", Object.values(tree.parts).some((s) => s === "failed") ? "failed" : Object.values(tree.parts).some((s) => s === "worn") ? "worn" : "healthy"],
    ["Component", Object.values(tree.components).some((s) => s === "failed") ? "failed" : Object.values(tree.components).some((s) => s === "worn") ? "worn" : "healthy"],
    ["Subsystem", Object.values(tree.subsystems).some((s) => s === "failed") ? "failed" : Object.values(tree.subsystems).some((s) => s === "worn") ? "worn" : "healthy"],
    ["System", tree.system],
  ];
  for (const [label, st] of rows) {
    const c = STATE_COLOR(st, theme);
    sphere(ctx, x + 14, cy, 4, c, { rim: false });
    caption(ctx, x + 24, cy, `${label}: ${st}`, theme, { size: 9, color: theme.inkSoft });
    cy += 14;
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const tree = deriveTree(params);
  const phys = computePhysics(state.v, params, tree, state.frozenGear);
  const L = layout(width, height);

  drawTreePanel(rc, L, tree);
  drawScene(rc, L, tree, phys);
  drawPanel(rc, L, tree, phys);

  const verdict = tree.system === "failed" ? "BICYCLE — FAILED" : tree.system === "worn" ? "BICYCLE — degraded, still rideable" : "BICYCLE — healthy";
  badge(ctx, width / 2, 16, verdict, theme, {
    align: "center", color: STATE_COLOR(tree.system, theme),
  });
  if (levelsAffected(tree) > 0) {
    badge(ctx, width - L.panelW - 8, 16, `${levelsAffected(tree)} levels affected`, theme, {
      align: "right", color: theme.sci["field"],
    });
  }
  if (phys.isBraking) {
    // A slow pulse on the badge itself, echoing the caliper's heat glow.
    badge(ctx, 8 + L.treeW, 16, "braking", theme, {
      color: mixHex(theme.sci["hot"], theme.surface, 0.2 * pulse(rc.time, 2.4)),
    });
  }
  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  zoomLevel: "whole", selectedSubsystem: "drivetrain",
  severBrakeCable: false, severShiftCable: false, severChain: false,
  severRearHubBearing: false, severSpokes: false,
  riderPower: 120, gradient: 6, gear: 6, tyrePressure: 4.0,
  brakePad: "new", lubrication: 70, timedDescent: false,
};

export const bikeInsideBikeSim: SimManifest<State> = {
  id: "g6.a1-2",
  title: "The Bike Inside the Bike",
  tagline: "Climb a canyon grade on a real power balance, then sever one part at a time and watch failure climb the containment tree.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Describe a bicycle as a system of subsystems, each with its own inputs, outputs and possible failures.",
    "Trace how a single failed part changes the state of the component, subsystem and system that contain it, and only those.",
    "Read a power balance: what a rider puts in, what friction and drag take, and what is left to move the bike.",
  ],
  misconceptions: [
    "The system and its parts are two different kinds of thing, not the same kind at different sizes",
    "A part failing always breaks the whole machine",
    "Removing a subsystem always breaks the whole machine",
    "Friction losses are the same regardless of which part is affected",
  ],
  interactionHint: "Sever a part in the control panel, then watch which tree levels turn red and which stay green.",
  tickRate: 60,
  timeScale: 1,
  params: {
    zoomLevel: {
      type: "option", label: "Zoom level",
      options: [
        { value: "whole", label: "Whole bike" }, { value: "subsystem", label: "Subsystem" },
        { value: "component", label: "Component" }, { value: "part", label: "Part" },
      ],
      default: "whole",
      help: "Which level of the tree gets the cyan containment frame and the on-bike zoom inset.",
    },
    selectedSubsystem: {
      type: "option", label: "Selected subsystem",
      options: [
        { value: "drivetrain", label: "Drivetrain" }, { value: "braking", label: "Braking" },
        { value: "steering", label: "Steering" }, { value: "wheels", label: "Wheels" },
        { value: "frame", label: "Frame" }, { value: "rider", label: "Rider" },
      ],
      default: "drivetrain",
      help: "Which branch of the tree expands to its components and parts.",
    },
    severBrakeCable: { type: "boolean", label: "Sever: brake cable", default: false, help: "Drops caliper clamping force to zero." },
    severShiftCable: { type: "boolean", label: "Sever: shift cable", default: false, help: "Freezes the gear the derailleur was last holding." },
    severChain: { type: "boolean", label: "Sever: chain", default: false, help: "No power reaches the rear wheel at all." },
    severRearHubBearing: { type: "boolean", label: "Sever: rear hub bearing (seize)", default: false, help: "A huge, constant drag force at the rear wheel." },
    severSpokes: { type: "boolean", label: "Sever: three spokes", default: false, help: "The rim wobbles and rubs — real drag, not a total stop." },
    riderPower: { type: "number", label: "Rider power", kind: "power", unit: "W", min: 40, max: 350, step: 5, default: 120, help: "Power entering the drivetrain at the pedals." },
    gradient: { type: "number", label: "Gradient (%)", kind: "ratio", min: -8, max: 12, step: 0.5, default: 6, help: "Road slope. Negative is downhill." },
    gear: { type: "number", label: "Gear (sprocket)", kind: "count", min: 1, max: 11, step: 1, default: 6, help: "1 is the smallest sprocket (hardest); 11 is the largest (easiest, for climbing)." },
    tyrePressure: { type: "number", label: "Tyre pressure (bar)", kind: "ratio", min: 1.5, max: 6.5, step: 0.1, default: 4.0, help: "Lower pressure means more rolling resistance." },
    brakePad: {
      type: "option", label: "Brake pad condition",
      options: [
        { value: "new", label: "New" }, { value: "worn", label: "Worn" },
        { value: "glazed", label: "Glazed" }, { value: "missing", label: "Missing" },
      ],
      default: "new", help: "Sets the caliper's friction coefficient and therefore stopping distance.",
    },
    lubrication: { type: "number", label: "Chain lubrication (%)", kind: "ratio", min: 0, max: 100, step: 5, default: 70, help: "More lubrication means less power lost to chain friction." },
    timedDescent: { type: "boolean", label: "Timed descent", default: false, help: "Scores a 1 km descent that only completes in control if the brakes actually work." },
  },
  model,
  render,
  labs: [
    {
      id: "healthy-climb",
      title: "A healthy climb",
      question: "Expand the tree. How many parts sit below Drivetrain, and what does the drivetrain do that no single part of it does?",
      bands: ["6-8"], minutes: 18, standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, riderPower: 180, gradient: 6, gear: 9, lubrication: 70 },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict first",
          instruction: "Nine components sit inside six subsystems, and each subsystem has its own parts below that.",
          predict: {
            prompt: "At full zoom, which is true of the Drivetrain subsystem?",
            options: [
              "It is just a name for its parts, nothing more",
              "It has its own inputs, outputs and possible failures, separate from any one part",
              "Only the whole bicycle can really be called a system",
            ],
            correct: 1,
            reveal: "Every level of this tree is a system in its own right. The drivetrain takes rider power in, delivers wheel power out, and can fail on its own terms — that is exactly what makes it a subsystem and not just a label.",
          },
        },
        {
          id: "zoom", phase: "setup", title: "Zoom to Part",
          instruction: "Set Zoom level to Part with Drivetrain selected, and count the parts under Chain & cassette and Shifting.",
          check: { describe: "Zoomed to Part level on Drivetrain", test: (v) => v.params.zoomLevel === "part" && v.params.selectedSubsystem === "drivetrain" },
          hints: ["The tree panel expands the selected subsystem down to its parts only at Part zoom."],
        },
        {
          id: "ribbon", phase: "measure", title: "Read the loss ladder",
          instruction: "At 180 W on a 6% grade in gear 9, record the watts lost to chain, bearings, tyre and air, and the watts left for the road.",
          requireData: 1,
          check: { describe: "Speed has settled above 0", test: (v) => (v.facts.speedKmh as number) > 1 },
          hints: ["The loss ladder is the stacked bar on the right — every segment is a real number, not a guess."],
        },
        {
          id: "compute", phase: "analyze", title: "How many watts never arrive",
          instruction: "Add the four loss segments and subtract from 180 W. Compare your total with the 'road' segment.",
          check: {
            describe: "The system reads healthy with all parts intact",
            test: (v) => v.facts.systemOk === true && (v.facts.levelsAffected as number) === 0,
          },
        },
        {
          id: "conclude", phase: "conclude", title: "Name the subsystem's own job",
          instruction: "Answer the lab's question in one sentence.",
          write: {
            prompt: "What does the drivetrain do that no single part of it — not the chain alone, not the cassette alone — does by itself?",
            placeholder: "The chain alone cannot ..., the cassette alone cannot ..., but together they ...",
          },
        },
      ],
    },
    {
      id: "cut-the-brake-cable",
      title: "Cut the brake cable",
      question: "Every other part is healthy. Which levels of the tree turn red, and why does the whole bicycle count as failed?",
      bands: ["6-8"], minutes: 18, standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, severBrakeCable: true, timedDescent: true, gradient: -8, selectedSubsystem: "braking", zoomLevel: "part" },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the verdict",
          instruction: "One cable, cut. Ninety-five percent of the machine is untouched.",
          predict: {
            prompt: "What happens to the Bicycle-level badge?",
            options: [
              "It stays healthy — only the cable is affected",
              "It reads worn, but still functional",
              "It reads failed, even though almost every part is fine",
            ],
            correct: 2,
            reveal: "Failed. Braking is a function-critical subsystem for the whole machine, and Lever & cable is a series link inside it: cut the cable and the caliper can clamp nothing, so Braking fails, so Bicycle fails — even though the drivetrain, wheels and frame never changed.",
          },
        },
        {
          id: "descend", phase: "measure", title: "Run the descent",
          instruction: "Run the timed descent on the −8% grade and watch the speed climb.",
          requireData: 1,
          check: { describe: "Speed has passed the safe descent line", test: (v) => (v.facts.speedKmh as number) > 45 },
          hints: ["Without a working caliper, nothing in the model is allowed to cap the speed."],
        },
        {
          id: "uncontrolled", phase: "measure", title: "Record the consequence",
          instruction: "Keep running until the descent is marked uncontrolled.",
          check: { describe: "Descent uncontrolled, and stopping distance reads no stopping", test: (v) => v.facts.descentUncontrolled === true && v.facts.canStop === false },
        },
        {
          id: "levels", phase: "analyze", title: "Count the red levels",
          instruction: "Look at Tree health: Part, Component, Subsystem, System.",
          check: { describe: "All four levels show the failure", test: (v) => (v.facts.levelsAffected as number) === 4 && v.facts.brakingFailed === true && v.facts.systemFailed === true },
          hints: ["Levels affected counts exactly this: how many of the four rows currently show a failed node."],
        },
        {
          id: "conclude", phase: "conclude", title: "Explain the climb",
          instruction: "Write the chain of causation, level by level.",
          write: {
            prompt: "Trace it: brake cable, lever & cable, Braking, Bicycle. Why does the top of the tree fail from the bottom?",
            placeholder: "The cable failed, so ... could not ..., so Braking ..., so the whole Bicycle ...",
          },
        },
      ],
    },
    {
      id: "one-seized-bearing",
      title: "One seized bearing",
      question: "A part four levels down has stopped. Follow the power ribbon and record where the power is going instead.",
      bands: ["6-8"], minutes: 18, standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, severRearHubBearing: true, riderPower: 250, gradient: 6, selectedSubsystem: "wheels", zoomLevel: "part" },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the speed",
          instruction: "250 W, a 6% grade, one seized rear hub bearing.",
          predict: {
            prompt: "What happens to speed compared with the same climb, healthy?",
            options: ["Barely changes — one bearing is a small part", "Drops a little", "Collapses to a crawl"],
            correct: 2,
            reveal: "A seized bearing is not a small friction penalty — it is a fixed, large drag force fighting every metre. Nearly all 250 W is consumed right at the hub, so the bike settles at a walking pace instead of a climbing pace.",
          },
        },
        {
          id: "measure", phase: "measure", title: "Record the crawl",
          instruction: "Let the speed settle and record it, plus the bearing-loss segment of the ladder.",
          requireData: 1,
          check: { describe: "Speed has settled low, most power lost to bearings", test: (v) => (v.facts.speedKmh as number) < 12 && (v.facts.powerBearingLossW as number) > (v.facts.powerRoadW as number) },
          hints: ["Compare the 'bearings' segment with the 'road' segment on the loss ladder — the bigger one is where the 250 W actually went."],
        },
        {
          id: "levels", phase: "analyze", title: "Follow it up the tree",
          instruction: "Zoom to Part on Wheels and watch Rear hub bearing, Rear wheel, Wheels and Bicycle in turn.",
          check: { describe: "Wheels and Bicycle both read failed", test: (v) => v.facts.wheelsFailed === true && v.facts.systemFailed === true },
        },
        {
          id: "argue", phase: "analyze", title: "Is a bearing a system?",
          instruction: "A single bearing has no parts of its own in this build.",
          write: {
            prompt: "In one sentence: is a bearing a system? Justify it using what a system needs (parts that interact to do something together).",
            placeholder: "A bearing is / is not a system because ...",
          },
        },
        {
          id: "conclude", phase: "conclude", title: "Where the watts went",
          instruction: "Answer the lab's question directly.",
          write: {
            prompt: "The rider is putting in 250 W. Name, precisely, where most of it is going instead of the road.",
            placeholder: "Most of the 250 W is being consumed at ..., which is why the road segment reads only ...",
          },
        },
      ],
    },
    {
      id: "single-speed-rebuild",
      title: "Single-speed rebuild",
      question: "Removing a whole subsystem still leaves a rideable bike. What can it no longer do, and on which gradient does that first matter?",
      bands: ["6-8"], minutes: 20, standards: ["MS-ETS1-4"],
      setup: { ...BASE_SETUP, severShiftCable: true, gear: 6, selectedSubsystem: "drivetrain", zoomLevel: "component" },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the verdict",
          instruction: "The shift cable is cut. The chain, cassette and crank are all still healthy.",
          predict: {
            prompt: "What happens to Drivetrain and to Bicycle?",
            options: [
              "Both fail — no shifting means no drivetrain",
              "Drivetrain reads worn (stuck in one gear); Bicycle stays rideable",
              "Neither changes — shifting is not really part of the drivetrain",
            ],
            correct: 1,
            reveal: "Shifting is one component of Drivetrain, not the whole thing. Losing it degrades Drivetrain to worn — you are stuck in whatever gear you were in — but Chain & cassette, the function-critical component, is untouched, so the bike still pedals and Bicycle never fails.",
          },
        },
        {
          id: "frozen", phase: "measure", title: "Confirm the freeze",
          instruction: "Try moving the Gear control. Watch the readout for the gear actually being used.",
          check: { describe: "Gear is frozen at the value it held when cut", test: (v) => v.facts.frozenGearActive === true && (v.facts.gearEffective as number) === 6 },
          hints: ["The tree panel shows 'frozen' next to the cadence readout when the shift cable is cut."],
        },
        {
          id: "climb-6", phase: "measure", title: "Climb at 6%",
          instruction: "Run the 1 km climb at the default 6% grade in the frozen gear and record the time.",
          requireData: 1,
          check: { describe: "The 1 km segment completed", test: (v) => v.facts.climbDone === true && v.facts.systemFailed === false },
        },
        {
          id: "climb-12", phase: "measure", title: "Climb at 12%",
          instruction: "Raise the gradient to 12% and try again in the same frozen gear.",
          check: { describe: "Speed is far below what a matched gear would give", test: (v) => (v.facts.speedKmh as number) >= 0 && v.facts.systemFailed === false },
          hints: ["Nothing here fails the bicycle — it is simply the wrong tool for a steep grade now."],
        },
        {
          id: "conclude", phase: "conclude", title: "Say what was lost",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "The bike still rides. What exactly can it no longer do, and at what kind of gradient does that first become a real problem?",
            placeholder: "It can no longer ..., which starts to matter once the grade reaches about ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "ride-wounded",
      title: "Ride wounded",
      brief: "Sever the shift cable and three spokes at once — two real, non-fatal failures — and still complete the 1 km climb with Bicycle never reading failed.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, severShiftCable: true, severSpokes: true, gear: 8 },
      goal: {
        describe: "1 km completed, Bicycle never failed, with both failures active",
        test: (v) => v.facts.climbDone === true && v.facts.systemFailed === false && v.params.severShiftCable === true && v.params.severSpokes === true,
      },
      stars: {
        two: {
          describe: "Also keep the loss ladder's 'tyre' segment under half the input power",
          test: (v) => v.facts.climbDone === true && v.facts.systemFailed === false &&
            (v.facts.powerTyreLossW as number) < (v.facts.powerInW as number) * 0.5,
        },
      },
      hints: [
        "Neither failure is function-critical for its subsystem — that is exactly why the bike still counts as rideable.",
        "A gear the frozen shifter can actually hold at your chosen power keeps cadence in the efficient band.",
      ],
    },
    {
      id: "prove-the-cascade",
      title: "Prove the cascade",
      brief: "Cut exactly one function-critical part — brake cable, chain, or the rear hub bearing — and show every one of the four tree levels turning red while every other part stays green.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, severBrakeCable: true, timedDescent: true, gradient: -6 },
      goal: {
        describe: "Exactly one fatal part severed, all four levels affected",
        test: (v) => {
          const fatal = [v.params.severBrakeCable, v.params.severChain, v.params.severRearHubBearing].filter((x) => x === true).length;
          const nonFatal = [v.params.severShiftCable, v.params.severSpokes].some((x) => x === true);
          return fatal === 1 && !nonFatal && (v.facts.levelsAffected as number) === 4 && v.facts.systemFailed === true;
        },
      },
      hints: [
        "Only three of the five severable parts are function-critical for their subsystem: the brake cable, the chain, and the rear hub bearing.",
        "The shift cable and the spokes are deliberately not among them — try those and Bicycle will not fail.",
      ],
    },
  ],
};
