import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import { benchStage, bunsenFlame, flask } from "@ui/labware";
import {
  badge, caption, clamp01, glass, glow, hexA, isDarkTheme, metal, particleField,
  vignette, type Particle,
} from "@ui/scene";

/**
 * The Bench That Bites — Grade 6, Unit A5.1: lab safety as prediction, not rules.
 *
 * A hazard state machine runs beside real physics. A pour's exit speed comes
 * from the pour height by free fall, and that speed sets the spray radius by
 * the same range relation a thrown ball obeys; whether the droplet reaches an
 * eye, a torso or only a gloved hand is a threshold on that radius, not a
 * scripted outcome. PPE is a filter on the resulting contact: goggles block
 * the eye channel entirely, an apron blocks the torso channel entirely, but
 * gloves only ever cut chemical contact to a fraction — and above 120 degrees C
 * they stop protecting against heat at all. Nothing here is decided by chance:
 * the spec's law is "never random punishment", so every incident is a
 * deterministic function of the settings on the bench, reachable by anyone who
 * runs the same knobs, and traceable afterwards link by link in the cause
 * chain. Ignition needs three independent conditions at once — vapour past the
 * sash, a plate hot enough, and a path between them — and closing the sash
 * alone is enough to remove it, which is the whole point of scenario S3.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const K = 273.15;          // param temperatures are stored in kelvin
const ROOM_C = 22;
const HOTPLATE_TAU_S = 25; // spec: the plate ramps, it does not jump

const SPRAY_RANGE_K = 6.118; // cm per (m/s)^2 — a projectile-range coefficient
const EYE_ZONE_CM = 26;      // spray radius beyond which droplets clear the face
const TORSO_ZONE_CM = 10;    // spray radius beyond which droplets reach the torso
const HAND_REACH_CM = 15;    // radius at which hand wetting is fully saturated

const BASE_CHEM_MAG = 50;    // full-severity chemical contact, unblocked
const EYE_SENS = 1.0, TORSO_SENS = 0.55, HAND_SENS = 0.28;
const GLOVE_CHEM_FRACTION = 0.15; // spec: gloves cut chemical contact to a fraction, never to zero

const SAFE_TOUCH_C = 60;               // pain threshold for bare skin on the plate
const THERMAL_K = 0.16;                // severity per degree C over that threshold
const GLOVE_THERMAL_CUTOFF_C = 120;    // spec: above this, gloves protect not at all
const GLOVE_THERMAL_FRACTION_LOW = 0.3; // below the cutoff, gloves do cut it

const REACH_T_S = 10; // when a hand sweeping "across the hot plate" fires, once

const SASH_SAFE_CM = 40;      // spec: above this the fume cupboard leaks to the room
const SASH_LEAK_SPAN_CM = 20; // leak reaches full strength by 60 cm open
const EVAP_RATE = 0.05;       // vapour stock built per second at full leak, ethanol in use
const VAPOR_DECAY = 0.02;     // per second, always
const IGNITE_VAPOR = 0.5;     // stock level that counts as "vapour present"
const IGNITE_TEMP_C = 250;    // spec: a surface above this relights vapour
const CLUTTER_BRIDGE = 4;     // loose items at/above this can carry vapour to the plate
const INHALE_VAPOR = 0.3;     // stock level at which fumes are noticeable

const EARTHQUAKE_DURATION_S = 6; // spec: a 6 s shake
const SLIDE_RATE = 0.09;         // fraction of "distance to the edge" per second while shaking

const IGNITE_PENALTY = 60;   // safety points lost to an ignition
const SINGE_PENALTY = 8;     // extra loss if hair was not tied back when it ignited
const BREAKAGE_PENALTY = 15; // safety points per broken item, halved by closed shoes
const INHALE_PENALTY = 10;
const RESTORE_BONUS = 4;     // points regained when the response would have been in time

const BASE_TOLERANCE_S = 6;   // seconds a trivial incident still allows
const SEV_DIVISOR = 15;       // how fast that allowance shrinks with severity
const EYEWASH_DIST_M = 3;     // fixed distance from the bench to the station
const WALK_SPEED_MPS = 1.4;
const EYEWASH_REACH_S = EYEWASH_DIST_M / WALK_SPEED_MPS;

const FREEZE_S = 1.2; // step-through pause on a fresh incident, cosmetic pacing only
const CHAIN_MAX = 16;

/* ------------------------------------------------------------------ *
 * Reagents and PPE
 * ------------------------------------------------------------------ */

interface ReagentInfo { corrosive: number; flammable: boolean; color: string; label: string }

const REAGENTS: Record<string, ReagentInfo> = {
  water: { corrosive: 0, flammable: false, color: "#bcdcf0", label: "water" },
  hcl: { corrosive: 1.0, flammable: false, color: "#e7efc0", label: "0.1 M hydrochloric acid" },
  cuso4: { corrosive: 0.4, flammable: false, color: "#4fa9d8", label: "copper sulfate solution" },
  limewater: { corrosive: 0.2, flammable: false, color: "#eef2e4", label: "limewater" },
  ethanol: { corrosive: 0.1, flammable: true, color: "#e4f2ec", label: "ethanol" },
};

function reagentInfo(id: string): ReagentInfo {
  return REAGENTS[id] ?? REAGENTS.water;
}

/** PPE genuinely required by the current reagent and heat source, nothing else. */
function requiredPPE(params: ParamValues) {
  const rz = reagentInfo(params.reagent as string);
  const hotC = (params.hotPlateSet as number) - K;
  return {
    goggles: true,
    apron: rz.corrosive > 0,
    gloves: rz.corrosive > 0 || hotC >= SAFE_TOUCH_C,
    hairTied: rz.flammable || hotC >= IGNITE_TEMP_C,
    closedShoes: true,
  };
}

function benchLayoutEdge(layout: string): number {
  return layout === "edge" ? 0.82 : 0.3;
}

/** Hazard sources set apart lower the general risk reading; edge does not. */
function benchLayoutRiskFactor(layout: string): number {
  return layout === "spaced" ? 0.7 : 1.0;
}

/** Seconds of margin before a contact of this severity becomes unsafe to leave. */
function responseMargin(severity: number): number {
  const allowed = BASE_TOLERANCE_S / (1 + severity / SEV_DIVISOR);
  return allowed - EYEWASH_REACH_S;
}

/* ------------------------------------------------------------------ *
 * The pour — pure and derived fresh every tick, so equipping PPE and
 * re-pouring is not bookkeeping, it is just a different answer to the same
 * function. Nothing about a pour needs to persist across time.
 * ------------------------------------------------------------------ */

interface PourResult {
  eye: 0 | 1; torso: 0 | 1; skin: 0 | 1;
  sevEye: number; sevTorso: number; sevHand: number;
  radiusCm: number; exitSpeed: number;
  penalty: number; bonus: number; worstSev: number; margin: number;
}

function computePour(params: ParamValues): PourResult {
  const heightM = params.pourHeight as number;
  const exitSpeed = Math.sqrt(2 * CONSTANTS.g * heightM); // free fall from the pour lip
  const radiusCm = SPRAY_RANGE_K * exitSpeed * exitSpeed;  // range scales with v^2
  const rz = reagentInfo(params.reagent as string);

  const handFactorReach = clamp01(radiusCm / HAND_REACH_CM);
  const handMag = BASE_CHEM_MAG * rz.corrosive * HAND_SENS * handFactorReach;
  const gloveFactor = params.ppeGloves ? GLOVE_CHEM_FRACTION : 1;
  const sevHand = handMag * gloveFactor;
  const skin: 0 | 1 = sevHand > 0.01 ? 1 : 0;

  const torsoHit = radiusCm >= TORSO_ZONE_CM;
  const sevTorso = torsoHit && !params.ppeApron ? BASE_CHEM_MAG * rz.corrosive * TORSO_SENS : 0;
  const torso: 0 | 1 = sevTorso > 0.01 ? 1 : 0;

  const eyeHit = radiusCm >= EYE_ZONE_CM;
  const sevEye = eyeHit && !params.ppeGoggles ? BASE_CHEM_MAG * rz.corrosive * EYE_SENS : 0;
  const eye: 0 | 1 = sevEye > 0.01 ? 1 : 0;

  const worstSev = Math.max(sevEye, sevTorso, sevHand);
  const penalty = sevEye + sevTorso + sevHand;
  const margin = worstSev > 0 ? responseMargin(worstSev) : BASE_TOLERANCE_S;
  const bonus = worstSev > 0 && margin >= 0 ? RESTORE_BONUS : 0;

  return { eye, torso, skin, sevEye, sevTorso, sevHand, radiusCm, exitSpeed, penalty, bonus, worstSev, margin };
}

function pourMessage(params: ParamValues, p: PourResult): string {
  const bits: string[] = [];
  if (p.eye) bits.push("reached the eyes — no goggles");
  if (p.torso) bits.push("soaked the torso — no apron");
  if (p.skin) bits.push(params.ppeGloves ? "still reached skin through the gloves" : "reached bare hands");
  if (!bits.length) return "the pour stayed inside what the PPE on hand already covers";
  return `the pour ${bits.join("; ")}`;
}

/* ------------------------------------------------------------------ *
 * State — everything that must persist because it cannot be undone
 * ------------------------------------------------------------------ */

interface State {
  tSec: number;
  hotPlateC: number;
  vapor: number;        // 0-1ish stock: ethanol vapour that has escaped the sash
  fire: boolean;
  igniteAtS: number;
  reached: boolean;
  reachSeverity: number;
  inhaled: boolean;
  shakeElapsed: number;  // -1 while the drill is off
  slide: number;
  /** The layout the current (or most recent) drill was armed against. */
  armedLayout: string;
  breakages: number;
  causeChain: string[];
  /** Fingerprint of the last pour-relevant settings, only to gate chain messages. */
  pourSignature: string;
  freezeLeft: number;
  riskPeak: number;
  /** Accumulated one-shot deltas from reach/ignition/breakage/inhalation only. */
  safetyBase: number;
}

function riskNow(s: State, params: ParamValues): number {
  const plateFrac = clamp01(s.hotPlateC / 350);
  const vaporFrac = clamp01(s.vapor / IGNITE_VAPOR);
  const clutterFrac = clamp01((params.clutter as number) / 6);
  const shaking = s.shakeElapsed >= 0 && s.shakeElapsed < EARTHQUAKE_DURATION_S ? 1 : 0;
  const base = (plateFrac * 0.35 + vaporFrac * 0.35 + clutterFrac * 0.15) *
    benchLayoutRiskFactor(params.benchLayout as string);
  return clamp01(base + shaking * 0.15) * 100;
}

function pushChain(s: State, line: string): void {
  s.causeChain.push(line);
  if (s.causeChain.length > CHAIN_MAX) s.causeChain = s.causeChain.slice(-CHAIN_MAX);
}

function clampScore(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Everything readouts/facts/render need, computed once from state + params. */
function deriveAll(state: State, params: ParamValues) {
  const pour = computePour(params);
  const eyeExp = pour.eye;
  const reachHit = state.reached && state.reachSeverity > 0.01;
  const skinExp = pour.skin + pour.torso + (reachHit ? 1 : 0);
  const inhaleExp = state.inhaled ? 1 : 0;
  const cutExp = state.breakages;
  const incidents = eyeExp + skinExp + inhaleExp + cutExp + (state.fire ? 1 : 0);
  const safety = clampScore(100 - pour.penalty + pour.bonus + state.safetyBase);

  const req = requiredPPE(params);
  const ppeCompliant =
    (!req.goggles || params.ppeGoggles === true) &&
    (!req.apron || params.ppeApron === true) &&
    (!req.gloves || params.ppeGloves === true) &&
    (!req.hairTied || params.ppeHairTied === true) &&
    (!req.closedShoes || params.ppeClosedShoes === true);

  const candidates: number[] = [];
  if (pour.worstSev > 0) candidates.push(pour.margin);
  if (reachHit) candidates.push(responseMargin(state.reachSeverity));
  const hasIncidentForMargin = candidates.length > 0;
  const marginS = hasIncidentForMargin ? Math.min(...candidates) : BASE_TOLERANCE_S;

  const dominantChannel = state.fire
    ? "ignition"
    : pour.eye ? "eye"
    : pour.torso || pour.skin || reachHit ? "skin"
    : state.inhaled ? "inhalation"
    : state.breakages > 0 ? "cut"
    : "none";

  return { pour, eyeExp, skinExp, inhaleExp, cutExp, incidents, safety, ppeCompliant, hasIncidentForMargin, marginS, dominantChannel };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

function init(params: ParamValues): State {
  return {
    tSec: 0,
    hotPlateC: ROOM_C,
    vapor: 0,
    fire: false,
    igniteAtS: -1,
    reached: false,
    reachSeverity: 0,
    inhaled: false,
    shakeElapsed: params.earthquake === true ? 0 : -1,
    slide: 0,
    armedLayout: params.earthquake === true ? (params.benchLayout as string) : "",
    breakages: 0,
    causeChain: [],
    pourSignature: "",
    freezeLeft: 0,
    riskPeak: 0,
    safetyBase: 0,
  };
}

function step(state: State, dt: number, params: ParamValues): State {
  if (dt <= 0) return state;
  const s: State = { ...state, causeChain: state.causeChain.slice() };

  if (s.freezeLeft > 0) s.freezeLeft = Math.max(0, s.freezeLeft - dt);
  s.tSec += dt;

  // Hot plate: first-order approach to setpoint. It ramps; it never jumps.
  const setC = (params.hotPlateSet as number) - K;
  s.hotPlateC += ((setC - s.hotPlateC) / HOTPLATE_TAU_S) * dt;

  // Ethanol vapour: builds only when it is in use AND the sash leaks it out.
  const isEthanol = params.reagent === "ethanol";
  const sashCm = (params.sash as number) * 100;
  const leak = isEthanol ? clamp01((sashCm - SASH_SAFE_CM) / SASH_LEAK_SPAN_CM) : 0;
  s.vapor = Math.max(0, s.vapor + (EVAP_RATE * leak - VAPOR_DECAY * s.vapor) * dt);

  if (!s.inhaled && s.vapor >= INHALE_VAPOR) {
    s.inhaled = true;
    s.safetyBase -= INHALE_PENALTY;
    pushChain(s, `fumes built up past the sash, open to ${sashCm.toFixed(0)} cm — inhalation exposure`);
  }

  // A hand swept across the plate, once, at a fixed point in the run.
  if (!s.reached && s.tSec >= REACH_T_S) {
    s.reached = true;
    if (params.reachPath === "across") {
      const thermalMag = THERMAL_K * Math.max(0, s.hotPlateC - SAFE_TOUCH_C);
      const gloveFactor = params.ppeGloves
        ? (s.hotPlateC >= GLOVE_THERMAL_CUTOFF_C ? 1 : GLOVE_THERMAL_FRACTION_LOW)
        : 1;
      s.reachSeverity = thermalMag * gloveFactor;
      if (s.reachSeverity > 0.01) {
        s.safetyBase -= s.reachSeverity;
        if (responseMargin(s.reachSeverity) >= 0) s.safetyBase += RESTORE_BONUS;
        pushChain(s, `reached across the plate at ${s.hotPlateC.toFixed(0)} °C — thermal contact`);
        if (params.stepThrough) s.freezeLeft = FREEZE_S;
      }
    }
  }

  // Ignition needs all three conditions true at once — never just one.
  if (!s.fire && isEthanol) {
    const pathwayOpen = params.reachPath === "across" || (params.clutter as number) >= CLUTTER_BRIDGE;
    if (s.vapor >= IGNITE_VAPOR && s.hotPlateC >= IGNITE_TEMP_C && pathwayOpen) {
      s.fire = true;
      s.igniteAtS = s.tSec;
      s.safetyBase -= IGNITE_PENALTY;
      if (!params.ppeHairTied) s.safetyBase -= SINGE_PENALTY;
      pushChain(s, `ethanol vapour passed ${Math.round(IGNITE_VAPOR * 100)}% with the sash open past ${SASH_SAFE_CM} cm`);
      pushChain(s, `the hot plate reached the ${IGNITE_TEMP_C} °C ignition line`);
      pushChain(s, "vapour had a path to the plate — ignition");
      if (params.stepThrough) s.freezeLeft = FREEZE_S;
    }
  }

  // Earthquake drill: a 6 s shake. It arms on the toggle's rising edge, and it
  // re-arms after finishing if the layout has since changed — "move it inboard
  // and re-run" has to mean a fresh shake, not a stale flag from the last one.
  if (params.earthquake === true) {
    const layout = params.benchLayout as string;
    const finished = s.shakeElapsed >= EARTHQUAKE_DURATION_S;
    if (s.shakeElapsed < 0 || (finished && layout !== s.armedLayout)) {
      s.shakeElapsed = 0;
      s.slide = 0;
      s.armedLayout = layout;
    }
    if (s.shakeElapsed < EARTHQUAKE_DURATION_S) {
      const before = benchLayoutEdge(layout) + s.slide;
      s.shakeElapsed += dt;
      s.slide += SLIDE_RATE * dt;
      const after = benchLayoutEdge(layout) + s.slide;
      if (before < 1 && after >= 1) {
        s.breakages += 1;
        const penalty = BREAKAGE_PENALTY * (params.ppeClosedShoes ? 0.4 : 1);
        s.safetyBase -= penalty;
        pushChain(s, `the shake slid glassware to the edge — one breakage`);
        if (params.stepThrough) s.freezeLeft = FREEZE_S;
      }
    }
  } else {
    s.shakeElapsed = -1;
    s.slide = 0;
  }

  const risk = riskNow(s, params);
  if (risk > s.riskPeak) s.riskPeak = risk;

  // The pour itself: recomputed only long enough to notice when it changed,
  // so equipping PPE and "re-pouring" never needs to undo a prior entry.
  const sig = `${params.reagent}|${params.ppeGoggles}|${params.ppeApron}|${params.ppeGloves}|${params.pourHeight}`;
  if (sig !== s.pourSignature) {
    s.pourSignature = sig;
    pushChain(s, pourMessage(params, computePour(params)));
  }

  return s;
}

const model: SimModel<State> = {
  init(params) {
    return init(params);
  },
  step(state, dt, params) {
    return step(state, dt, params);
  },
  readouts(state, params) {
    const d = deriveAll(state, params);
    return [
      { key: "safety", label: "Safety score", quantity: q(d.safety / 100, "percent"), semantic: "neutral", graphable: true },
      { key: "riskNow", label: "Risk level", quantity: q(riskNow(state, params) / 100, "percent"), semantic: "hot", graphable: true },
      { key: "riskPeak", label: "Risk peak this run", quantity: q(state.riskPeak / 100, "percent"), semantic: "hot", graphable: true },
      { key: "hotPlateC", label: "Hot plate", unit: "°C", quantity: q(state.hotPlateC + 273.15, "temperature"), semantic: "hot", graphable: true },
      { key: "vapor", label: "Ethanol vapour", quantity: q(clamp01(state.vapor / IGNITE_VAPOR), "percent"), semantic: "gas", graphable: true },
      { key: "sprayRadius", label: "Splash radius", unit: "cm", quantity: q(d.pour.radiusCm / 100, "length"), semantic: "distance" },
      { key: "exposures", label: "Exposures logged", quantity: q(d.incidents, "count"), semantic: "acid", graphable: true },
      { key: "margin", label: "Response margin", unit: "s", quantity: q(d.marginS, "time"), semantic: "time" },
    ];
  },
  facts(state, params) {
    const d = deriveAll(state, params);
    return {
      tSec: state.tSec,
      hotPlateC: state.hotPlateC,
      vapor: state.vapor,
      fire: state.fire,
      igniteAtS: state.igniteAtS,
      reached: state.reached,
      reachSeverity: state.reachSeverity,
      inhaled: state.inhaled,
      breakages: state.breakages,
      shakeActive: state.shakeElapsed >= 0 && state.shakeElapsed < EARTHQUAKE_DURATION_S,
      eyeExp: d.eyeExp,
      skinExp: d.skinExp,
      inhaleExp: d.inhaleExp,
      cutExp: d.cutExp,
      incidents: d.incidents,
      safety: d.safety,
      ppeCompliant: d.ppeCompliant,
      hasIncidentForMargin: d.hasIncidentForMargin,
      marginS: d.marginS,
      reachedInTime: d.marginS >= 0,
      dominantChannel: d.dominantChannel,
      sprayRadiusCm: d.pour.radiusCm,
      exitSpeed: d.pour.exitSpeed,
      pourEye: d.pour.eye === 1,
      pourTorso: d.pour.torso === 1,
      pourSkin: d.pour.skin === 1,
      riskNow: riskNow(state, params),
      riskPeak: state.riskPeak,
      causeChainLen: state.causeChain.length,
      causeChainText: state.causeChain.join(" | "),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function trunc(text: string, n: number): string {
  return text.length > n ? `${text.slice(0, n - 1)}…` : text;
}

function render(rc: RenderContext<State>) {
  const { ctx, state: s, params, theme, width, height, time } = rc;
  const dark = isDarkTheme(theme);
  benchStage(ctx, width, height, theme);

  const d = deriveAll(s, params);
  const rz = reagentInfo(params.reagent as string);
  const shaking = s.shakeElapsed >= 0 && s.shakeElapsed < EARTHQUAKE_DURATION_S;

  ctx.save();
  if (shaking) {
    const amp = 4 * (1 - s.shakeElapsed / EARTHQUAKE_DURATION_S);
    ctx.translate(Math.sin(time * 40) * amp, Math.cos(time * 33) * amp * 0.6);
  }

  /* --- worktop -------------------------------------------------------- */
  const benchY = height * 0.72, benchH = height * 0.22, benchX = width * 0.04, benchW = width * 0.92;
  ctx.fillStyle = dark ? "#3a3d44" : "#c7c3bb";
  roundRect(ctx, benchX, benchY, benchW, benchH, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.6);
  ctx.lineWidth = 1;
  roundRect(ctx, benchX, benchY, benchW, benchH, 8);
  ctx.stroke();

  if (rc.overlays.riskMap !== false) {
    const risk = riskNow(s, params);
    const g = ctx.createLinearGradient(0, benchY, 0, benchY + benchH);
    g.addColorStop(0, hexA(theme.sci["hot"], 0.05 + 0.35 * clamp01(risk / 100)));
    g.addColorStop(1, hexA(theme.sci["hot"], 0));
    ctx.fillStyle = g;
    roundRect(ctx, benchX, benchY, benchW, benchH, 8);
    ctx.fill();
  }

  /* --- hot plate -------------------------------------------------------- */
  const plateX = width * 0.24, plateW = width * 0.16, plateY = benchY;
  const hotFrac = clamp01((s.hotPlateC - ROOM_C) / (350 - ROOM_C));
  const coil = mixHex(mixHex("#221a16", "#a8321a", clamp01(hotFrac * 1.6)), "#ffb04a", Math.max(0, hotFrac - 0.6) * 2.2);
  metal(ctx, plateX, plateY - 26, plateW, 26, "#575c64", { radius: 4 });
  ctx.fillStyle = coil;
  roundRect(ctx, plateX + 6, plateY - 20, plateW - 12, 14, 3);
  ctx.fill();
  if (hotFrac > 0.25) glow(ctx, plateX + plateW / 2, plateY - 13, plateW * 0.5, coil, 0.5);
  caption(ctx, plateX + plateW / 2, plateY + 10, `${s.hotPlateC.toFixed(0)} °C`, theme, { align: "center", size: 10 });

  /* --- reagent flask ------------------------------------------------------ */
  const flaskW = width * 0.09, flaskH = benchH * 0.85, flaskX = width * 0.46, flaskY = benchY - flaskH + 4;
  flask(ctx, flaskX, flaskY, flaskW, flaskH, theme, { level: 0.55, color: rz.color, bubbles: rz.flammable ? 0.15 : 0 });
  caption(ctx, flaskX + flaskW / 2, flaskY - 8, rz.label, theme, { align: "center", size: 10 });

  if (d.pour.radiusCm > 2) {
    const puddleR = Math.min(width * 0.16, d.pour.radiusCm * 1.1);
    ctx.fillStyle = hexA(rz.color, 0.28);
    ctx.beginPath();
    ctx.ellipse(flaskX + flaskW / 2, benchY + 8, puddleR, puddleR * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* --- fume cupboard sash -------------------------------------------------- */
  const sashW = width * 0.14, sashX = width * 0.78, sashMaxH = height * 0.3, sashBaseY = benchY;
  const sashFrac = clamp01(((params.sash as number) * 100) / 60);
  const sashH = Math.max(4, sashMaxH * (1 - sashFrac));
  glass(ctx, sashX, sashBaseY - sashMaxH, sashW, sashH, 2, theme, { alpha: dark ? 0.12 : 0.2 });
  caption(ctx, sashX + sashW / 2, sashBaseY - sashMaxH - 8, "fume cupboard", theme, { align: "center", size: 9, color: theme.inkSoft });

  if (rz.flammable && s.vapor > 0.03) {
    const cloud: Particle[] = [];
    const n = Math.round(10 + s.vapor * 40);
    const strength = clamp01(s.vapor / IGNITE_VAPOR);
    for (let i = 0; i < n; i++) {
      cloud.push({
        x: flaskX + flaskW * 0.5 + (hash(i, 1) - 0.5) * width * 0.32 * (0.3 + strength),
        y: benchY - 8 - hash(i, 2) * 40 - strength * 24,
        r: 4 + hash(i, 3) * 5,
        a: 0.1 + 0.28 * strength,
      });
    }
    particleField(ctx, cloud, dark ? "#b8c9b0" : "#9db390", { alpha: 0.5 });
  }

  if (s.fire) {
    bunsenFlame(ctx, flaskX + flaskW / 2, benchY - 4, 14, 1, time);
    badge(ctx, width / 2, 46, "IGNITION", theme, { align: "center", color: theme.sci["hot"] });
  }

  /* --- PPE chips ------------------------------------------------------- */
  const ppeList: [string, boolean][] = [
    ["goggles", params.ppeGoggles as boolean],
    ["apron", params.ppeApron as boolean],
    ["gloves", params.ppeGloves as boolean],
    ["hair tied", params.ppeHairTied as boolean],
    ["shoes", params.ppeClosedShoes as boolean],
  ];
  let px = 16;
  for (const [label, worn] of ppeList) {
    badge(ctx, px, height * 0.07, label, theme, { color: worn ? theme.sci["neutral"] : theme.inkSoft });
    px += 20 + label.length * 6.4;
  }

  /* --- verdict + safety --------------------------------------------------- */
  const verdict = s.fire ? "IGNITION"
    : d.incidents === 0 ? "CLEAN RUN"
    : d.incidents <= 2 ? "MINOR INCIDENT" : "MULTIPLE INCIDENTS";
  badge(ctx, width / 2, height * 0.14, verdict, theme, {
    align: "center", color: s.fire || d.incidents > 2 ? theme.sci["hot"] : d.incidents === 0 ? theme.sci["neutral"] : theme.sci["acid"],
  });
  badge(ctx, width - 14, height * 0.07, `${d.safety.toFixed(0)}`, theme, { align: "right", color: theme.accent, sub: "safety score" });
  if (!d.ppeCompliant) badge(ctx, width - 14, height * 0.14, "PPE gap", theme, { align: "right", color: theme.sci["hot"] });

  /* --- exposure counters ---------------------------------------------------- */
  const expY = height * 0.92;
  const chips: [string, number][] = [
    ["eye", d.eyeExp], ["skin", d.skinExp], ["inhalation", d.inhaleExp], ["cut", d.cutExp],
  ];
  let ex = 16;
  for (const [label, n] of chips) {
    badge(ctx, ex, expY, `${n}`, theme, { color: n > 0 ? theme.sci["hot"] : theme.inkSoft, sub: label });
    ex += 62;
  }
  if (s.breakages > 0) {
    caption(ctx, 16, expY - 24, `${s.breakages} item${s.breakages === 1 ? "" : "s"} broken`, theme, {
      size: 10, color: theme.sci["hot"], weight: 700,
    });
  }

  /* --- cause chain panel ---------------------------------------------------- */
  if (rc.overlays.causeChain !== false && s.causeChain.length > 0) {
    const panelW = Math.min(260, width * 0.32), panelX = width - panelW - 10, panelY = height * 0.2, panelH = Math.min(150, height * 0.42);
    ctx.save();
    ctx.fillStyle = dark ? "rgba(10,14,20,0.78)" : "rgba(255,255,255,0.85)";
    roundRect(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.line, 0.8);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    caption(ctx, panelX + 10, panelY + 14, "CAUSE CHAIN", theme, { size: 10, weight: 800, color: theme.inkSoft });
    const shown = s.causeChain.slice(-6);
    shown.forEach((line, i) => {
      caption(ctx, panelX + 10, panelY + 32 + i * 16, `${i + 1}. ${trunc(line, 38)}`, theme, { size: 9 });
    });
  }

  ctx.restore(); // shake
  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  ppeGoggles: true, ppeApron: false, ppeGloves: false, ppeHairTied: false, ppeClosedShoes: false,
  hotPlateSet: 180 + K, reagent: "cuso4", pourHeight: 0.05, clutter: 3, sash: 0.20,
  benchLayout: "standard", reachPath: "across", earthquake: false, stepThrough: true,
};

export const benchThatBitesSim: SimManifest<State> = {
  id: "g6.a5-1",
  title: "The Bench That Bites",
  tagline: "Dress for the reagent and the heat, then find out — by measurement, never by luck — exactly what still gets through.",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-PS1-2"] },
  learningGoals: [
    "Predict what a hazard can reach before acting, from real pour heights and plate temperatures.",
    "Explain PPE as a filter with limits: goggles and an apron block entirely, gloves only ever reduce.",
    "Trace an incident as a chain of prior choices, and name the cheapest link to break.",
  ],
  misconceptions: [
    "Safety is a list of rules to memorise and obey",
    "Wearing gloves means a chemical spill on the hands does not count",
    "An accident is bad luck, not something a careful look ahead could have predicted",
    "One safety failure is independent of the others, not part of a chain",
  ],
  interactionHint: "Change the PPE and the pour height, then watch which zone the splash actually reaches.",
  tickRate: 30,
  timeScale: 1,
  params: {
    ppeGoggles: { type: "boolean", label: "PPE: splash goggles", default: true, help: "Blocks the eye channel entirely when the splash reaches face height." },
    ppeApron: { type: "boolean", label: "PPE: apron", default: false, help: "Blocks the torso channel entirely." },
    ppeGloves: { type: "boolean", label: "PPE: nitrile gloves", default: false, help: "Cuts chemical contact to a fraction — never to zero — and stops helping against heat above 120 °C." },
    ppeHairTied: { type: "boolean", label: "PPE: hair tied back", default: false, help: "Keeps loose hair away from an open flame." },
    ppeClosedShoes: { type: "boolean", label: "PPE: closed shoes", default: false, help: "Halves the safety cost of a floor full of broken glass." },
    hotPlateSet: {
      type: "number", label: "Hot plate setpoint", kind: "temperature", unit: "°C",
      min: 20 + K, max: 350 + K, step: 5, default: 180 + K,
      help: "The plate ramps toward this over about 25 seconds; it never jumps.",
    },
    reagent: {
      type: "option", label: "Reagent in use",
      options: [
        { value: "water", label: "Water" },
        { value: "hcl", label: "0.1 M hydrochloric acid" },
        { value: "cuso4", label: "Copper sulfate solution" },
        { value: "limewater", label: "Limewater" },
        { value: "ethanol", label: "Ethanol" },
      ],
      default: "cuso4",
      help: "Sets both the splash's corrosiveness and whether it can build ignitable vapour.",
    },
    pourHeight: {
      type: "number", label: "Pour height", kind: "length", unit: "cm",
      min: 0.01, max: 0.30, step: 0.01, default: 0.05,
      help: "Free-fall exit speed from this height sets the spray radius that follows.",
    },
    clutter: {
      type: "number", label: "Bench clutter", kind: "count",
      min: 0, max: 6, step: 1, default: 3,
      help: "Loose items on the bench; enough of them can bridge vapour to an ignition source on their own.",
    },
    sash: {
      type: "number", label: "Fume cupboard sash", kind: "length", unit: "cm",
      min: 0, max: 0.60, step: 0.01, default: 0.20,
      help: "Above 40 cm open, ethanol vapour starts leaking past it into the room.",
    },
    benchLayout: {
      type: "option", label: "Bench layout",
      options: [
        { value: "standard", label: "Standard" },
        { value: "spaced", label: "Hazards spaced apart" },
        { value: "edge", label: "Glassware at the front edge" },
      ],
      default: "standard",
      help: "Spacing hazards apart lowers the overall risk reading; glassware at the edge is what an earthquake finds.",
    },
    reachPath: {
      type: "option", label: "Reach path",
      options: [
        { value: "across", label: "Across the hot plate" },
        { value: "around", label: "Around the front" },
      ],
      default: "across",
      help: "Across sweeps a bare or gloved hand through the plate's thermal field, once, ten seconds in.",
    },
    earthquake: { type: "boolean", label: "Earthquake drill", default: false, help: "A 6-second shake that slides unsecured glassware toward the bench edge." },
    stepThrough: { type: "boolean", label: "Step through incidents", default: true, help: "Holds the scene for a moment at the instant of each new incident." },
  },
  overlays: [
    { key: "riskMap", label: "Risk heat overlay", default: true },
    { key: "causeChain", label: "Cause chain panel", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "suited-up",
      title: "Suited up",
      question: "Every item of PPE is worn. Does the pour cause zero incidents, or one?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, ppeGoggles: true, ppeApron: true, ppeGloves: true, ppeHairTied: true, ppeClosedShoes: true, reagent: "cuso4", pourHeight: 0.05, clutter: 0, reachPath: "around" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Every PPE item is on. Commit before you run the pour.",
          predict: {
            prompt: "With full PPE, will the pour cause zero incidents or one?",
            options: [
              "Zero — full PPE means nothing gets through",
              "One — gloves reduce chemical contact but never erase it",
              "Two — goggles and the apron both fail anyway",
            ],
            correct: 1,
            reveal: "One. Goggles and the apron block their channels entirely, but gloves only ever cut chemical contact to a fraction — some of the copper sulfate still reaches the skin.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Run it",
          instruction: "Run for a few seconds and record the exposure counters.",
          requireData: 1,
          check: {
            describe: "Exactly one incident, on the skin channel, with eyes and torso clear",
            test: (v) => v.facts.incidents === 1 && v.facts.eyeExp === 0 && v.facts.skinExp === 1,
          },
          hints: ["The pour fires the moment the run starts — no need to wait."],
        },
        {
          id: "identify",
          phase: "analyze",
          title: "Name the absorber",
          instruction: "One item of PPE is doing all the remaining work here.",
          write: {
            prompt: "Which single item of PPE absorbed the one splash that still happened, and why did it not stop it completely?",
            placeholder: "The gloves ... because gloves only ever ...",
          },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Take the gloves off",
          instruction: "Turn off nitrile gloves and re-run. Compare the skin severity.",
          check: {
            describe: "Skin severity rose once the gloves came off",
            test: (v) => v.facts.pourSkin === true && v.params.ppeGloves === false,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What PPE actually promises",
          instruction: "Write the honest rule PPE follows here.",
          write: {
            prompt: "Some PPE blocks a channel completely and some only reduces it. State which is which, from what you just measured.",
            placeholder: "Goggles and the apron ... but gloves ...",
          },
        },
      ],
    },
    {
      id: "bare-eyed",
      title: "Bare-eyed",
      question: "Only an apron is worn, the pour is high, and the reagent is acid. Where does it land?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, ppeGoggles: false, ppeApron: true, ppeGloves: false, ppeHairTied: false, ppeClosedShoes: false, reagent: "hcl", pourHeight: 0.25, clutter: 3, reachPath: "around" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the landing zones",
          instruction: "A 25 cm pour of acid, apron on, goggles off. Commit to a prediction.",
          predict: {
            prompt: "Which zones will register an exposure?",
            options: ["Eyes only", "Eyes and hands, torso blocked by the apron", "All three zones"],
            correct: 1,
            reveal: "Eyes and hands. The apron genuinely intercepts the torso channel entirely; nothing else on the bench is covering the eyes or the bare hands.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Record where it landed",
          instruction: "Run it and record the spray radius and which channels registered.",
          requireData: 1,
          check: {
            describe: "Eye and skin exposures recorded, torso clear",
            test: (v) => v.facts.eyeExp === 1 && (v.facts.skinExp as number) >= 1 && v.facts.pourTorso === false,
          },
          hints: ["The splash radius readout is the number that decides which zones are hit."],
        },
        {
          id: "timer",
          phase: "analyze",
          title: "The eyewash timer",
          instruction: "Check the response margin the model computed for this incident.",
          check: {
            describe: "The margin is negative — the eyewash is too far away for this severity",
            test: (v) => v.facts.reachedInTime === false,
          },
          hints: ["A severe, unblocked eye contact leaves very little time before the reach time to the station exceeds it."],
        },
        {
          id: "fix",
          phase: "measure",
          title: "Put the goggles on",
          instruction: "Turn on splash goggles and re-run the same pour.",
          check: {
            describe: "With goggles on, the eye channel clears",
            test: (v) => v.params.ppeGoggles === true && v.facts.pourEye === false,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what the timer meant",
          instruction: "Explain the response-time number in your own words.",
          write: {
            prompt: "How many seconds did the model give you to reach the eyewash, and would you have made it? What does that say about waiting to put goggles on?",
            placeholder: "The margin was ... seconds, which means ...",
          },
        },
      ],
    },
    {
      id: "three-things-at-once",
      title: "Three things at once",
      question: "Ethanol, a hot plate, and an open sash. Which single condition is cheapest to remove?",
      bands: ["6-8"],
      minutes: 20,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, reagent: "ethanol", hotPlateSet: 300 + K, sash: 0.55, reachPath: "across", clutter: 4 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the ignition",
          instruction: "Ethanol is out, the sash is wide open, the plate is set to 300 °C. Will it ignite?",
          predict: {
            prompt: "Ignition needs how many separate conditions true at the same time?",
            options: ["One is enough", "Two", "Three — vapour present, a hot enough surface, and a path between them"],
            correct: 2,
            reveal: "Three, all at once. Vapour has to have escaped the sash, the plate has to be past 250 °C, and something has to carry the vapour to it — remove any one and there is no fire.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Watch it happen",
          instruction: "Run until ignition fires and record the sim-second it happened.",
          requireData: 1,
          check: { describe: "Ignition recorded, with a timestamp", test: (v) => v.facts.fire === true && (v.facts.igniteAtS as number) >= 0 },
          hints: ["The vapour cloud thickens visibly for a long stretch before anything ignites — nothing here is a surprise."],
        },
        {
          id: "name-three",
          phase: "analyze",
          title: "Name all three",
          instruction: "Use the cause chain panel to name each condition in order.",
          write: {
            prompt: "Name the three separate conditions that all had to be true for this ignition.",
            placeholder: "First ... second ... third ...",
          },
        },
        {
          id: "cheapest-fix",
          phase: "measure",
          title: "Close the sash",
          instruction: "Leave the plate at 300 °C and the reach path across. Close the sash to 40 cm or less and re-run.",
          check: {
            describe: "Sash closed to 40 cm or less; ignition no longer fires even after time passes",
            test: (v) => (v.params.sash as number) <= 0.40 && v.facts.fire === false && (v.facts.tSec as number) >= 60,
          },
          hints: ["Nothing else needs to change — the sash alone removes the vapour condition."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Cheapest link",
          instruction: "State which condition was cheapest to remove and why.",
          write: {
            prompt: "Of the three conditions, which was the single cheapest one to remove, and what would it have cost to fix one of the other two instead?",
            placeholder: "The sash was cheapest because ...; lowering the plate instead would have cost ...",
          },
        },
      ],
    },
    {
      id: "shake-table-drill",
      title: "Shake-table drill",
      question: "The bench shakes for six seconds. Does where the glassware sits change what breaks?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-PS1-2"],
      setup: { ...BASE_SETUP, ppeGoggles: true, ppeApron: true, ppeGloves: true, ppeHairTied: true, ppeClosedShoes: true, benchLayout: "edge", earthquake: true, reachPath: "around" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the shake",
          instruction: "Glassware sits at the front edge. The drill runs for 6 seconds.",
          predict: {
            prompt: "Will anything break during this drill?",
            options: ["No — six seconds is too short", "Yes — the edge position slides past the drop threshold before the shake ends", "Only if the hot plate is also on"],
            correct: 1,
            reveal: "Yes. Starting this close to the edge, the shake's own sliding motion crosses the drop threshold partway through the six seconds, regardless of the hot plate.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Run the drill",
          instruction: "Run past 6 seconds and record the breakage count.",
          requireData: 1,
          check: { describe: "At least one breakage recorded", test: (v) => (v.facts.breakages as number) >= 1 },
        },
        {
          id: "move-inboard",
          phase: "measure",
          title: "Move it inboard",
          instruction: "Switch the bench layout to Standard — moving glassware away from the edge — and re-run the drill.",
          check: {
            describe: "With the standard layout, the same drill breaks nothing",
            test: (v) => v.params.benchLayout === "standard" && v.facts.shakeActive === false && (v.facts.tSec as number) >= 6,
          },
          hints: ["Turning the earthquake toggle off and back on re-arms a fresh six-second drill."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the counts",
          instruction: "Use your two recorded rows to compare the breakage counts.",
          write: {
            prompt: "How many items broke at the edge, and how many broke once they were moved inboard? What single number decided the difference?",
            placeholder: "At the edge: ... ; moved inboard: ... ; the number that changed was ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Layout as a safety choice",
          instruction: "Generalise the lesson beyond glassware.",
          write: {
            prompt: "Layout is a control on this bench just like any slider. State the general rule this drill just proved.",
            placeholder: "Where something starts relative to the edge determines ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "dressed-for-the-job",
      title: "Dressed for the job",
      brief: "Handle a 200 °C hot plate with plain water — full PPE compliance, and zero incidents.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, reagent: "water", hotPlateSet: 200 + K, pourHeight: 0.05, clutter: 0, earthquake: false, benchLayout: "standard" },
      goal: {
        describe: "PPE compliant and zero incidents logged",
        test: (v) => v.facts.ppeCompliant === true && v.facts.incidents === 0,
      },
      stars: {
        two: {
          describe: "Also finish with a perfect safety score",
          test: (v) => v.facts.ppeCompliant === true && v.facts.incidents === 0 && (v.facts.safety as number) >= 100,
        },
      },
      hints: [
        "Water cannot burn skin or eyes, but the plate itself still can.",
        "Gloves stop helping against heat once the plate passes 120 °C — the plate you are given is already past that.",
        "Only the reach path decides whether a hand ever enters the thermal field at all.",
      ],
    },
    {
      id: "defuse-the-ignition",
      title: "Defuse the ignition",
      brief: "Keep working with ethanol at 300 °C for a full minute and a half without it ever igniting.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, reagent: "ethanol", hotPlateSet: 300 + K, sash: 0.55, reachPath: "across", clutter: 4 },
      goal: {
        describe: "90 seconds survived with the plate still at 300 °C and no ignition",
        test: (v) =>
          v.elapsed >= 90 && v.facts.fire === false &&
          v.params.reagent === "ethanol" && (v.params.hotPlateSet as number) >= 300 + K,
      },
      stars: {
        two: {
          describe: "Fixed it with the sash alone — reach path and clutter untouched",
          test: (v) =>
            v.elapsed >= 90 && v.facts.fire === false &&
            v.params.reagent === "ethanol" && (v.params.hotPlateSet as number) >= 300 + K &&
            (v.params.sash as number) <= 0.40 && v.params.reachPath === "across" && (v.params.clutter as number) >= 4,
        },
      },
      hints: [
        "You are not allowed to turn down the plate or change the reagent — find a different lever.",
        "There are two ways to remove the pathway condition and one way to remove the vapour condition.",
        "The vapour condition is the one lever that works no matter what the other two controls are set to.",
      ],
    },
  ],
};
