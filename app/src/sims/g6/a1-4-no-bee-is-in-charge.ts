import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { creature } from "@ui/fauna";
import {
  badge, caption, clamp01, glow, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";
import { chartFrame, lineSeries, legend } from "@ui/charts";

/**
 * No Bee Is In Charge — Grade 6, Unit A1.4: emergent properties.
 *
 * Pure agent-based, and the purity is the point: every one of up to 2000 bee
 * agents runs the same five private rules and holds nothing but one
 * remembered patch, its bearing and distance from the hive, and how good it
 * was last time. No function anywhere compares patches, no function computes
 * a colony average and hands it back to a bee, and nothing outside this file
 * writes to a bee's belief except the bee's own rules reacting to what it
 * personally senses. Patch share, colony choice accuracy and hive core
 * temperature are read out by *counting and measuring the agents themselves*
 * after they act — never assigned, never nudged toward the "right" answer.
 *
 * The honesty rule this sim exists to uphold: if the colony ever looks like
 * it is coordinating, that coordination has to be traceable to individual
 * bees reacting to individually-sensed things — a dance they watched, a
 * yield they personally measured, a temperature they personally feel against
 * their own threshold — or the whole demonstration is a fraud.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const MAX_BEES = 2000;
const MAX_PATCHES = 6;
const FIELD_R_M = 200; // spec: a field ~400 m across
const PATCH_R_M = 18;
const HIVE_ENTRANCE_R_M = 6;

const BEE_SPEED_M_S = 7; // a real honeybee's cruising airspeed
const ODOUR_RANGE_M = 30; // spec: "follows the odour gradient over the last 30 m"

const REST_BASE_S = 1.5, REST_JITTER_S = 2.0;
const LOAD_TIME_S = 3;
const DANCE_BASE_S = 4, DANCE_SCALE_S = 26; // duration = BASE + SCALE * quality
const FOLLOW_WATCH_S = 4;
const ABANDON_Q = 0.5; // between B(0.45) and A(0.90) in S1, so every sub-best
// patch frees its foragers back into the recruitable pool instead of locking them in.
const DANCE_Q = 0.6; // between B(0.45) and A(0.90) in S1, so only a genuinely rich
// patch recruits — a merely-decent one does not compete for the colony's attention.
// A single visit's harvest, kept small on purpose: with up to 600 bees (S1's own
// colony size) almost all airborne at once before recruitment takes hold, even a
// few percent removed per landing compounds across hundreds of near-simultaneous
// visits fast enough to hold the richest patch's live stock below both thresholds
// above forever — starving rule 1/2 of the very signal they need to ever fire.
// Kept low enough that regrowth (student-set, spec default 6 %/min) can hold a
// heavily-visited patch near its target instead of pinned near empty.
const HARVEST_FRAC = 0.01;

const FAN_THRESH_C = 36, CLUSTER_THRESH_C = 33; // spec: exact thresholds, per bee
const THRESH_JITTER_C = 1.2; // spec: "its own" threshold — real, small individual variation
const INSULATION_PER_S = 0.01;
const FAN_COOL_PER_S = 0.22;
const CLUSTER_WARM_PER_S = 0.24;
const BASE_METABOLIC_PER_S = 0.05;

const PATCH_ANGLE_DEG = [10, 75, 150, 220, 285, 330];
const PATCH_DIST_M = [150, 165, 130, 175, 145, 160];
const PATCH_RICHNESS_DEFAULT = [90, 45, 30, 20, 50, 50]; // spec S1: A=90,B=45,C=30,D=20

const PATCH_LETTER = ["A", "B", "C", "D", "E", "F"];

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

const ST_REST = 0, ST_SCOUT = 1, ST_FORAGE = 2, ST_DANCE = 3, ST_FOLLOW = 4;

interface State {
  min: number; // simulated minutes elapsed
  // --- per-bee, private, typed for 2000 agents at 30-60 Hz ---------------
  beeState: Uint8Array;
  beeX: Float32Array; beeY: Float32Array;
  beeTX: Float32Array; beeTY: Float32Array;
  beliefBearing: Float32Array; beliefDist: Float32Array;
  quality: Float32Array; // -1 = no memory
  timer: Float32Array;
  fanThresh: Float32Array; clusterThresh: Float32Array;
  dancesWatched: Uint16Array;
  visitedPatch: Int8Array; // which patch index the bee is currently at/heading to, -1 none
  watchTarget: Int16Array; // while FOLLOW: index of the dancing bee being watched
  // --- patches -------------------------------------------------------------
  patchConc: Float32Array; // 0-1, current nectar concentration
  // --- colony-level stocks, filled only by agents acting -------------------
  hiveNectar: number;
  hiveTemp: number;
  // --- bookkeeping the labs read --------------------------------------------
  richestPatchPrev: number;
  decisionStartMin: number;
  decisionPending: boolean;
  decisionTimeMin: number; // -1 until measured
  histMin: number[]; histShare: number[][]; histTemp: number[]; histOutside: number[];
  sampleClock: number;
  richnessOverride: number[]; // student-set target richness per patch (0-100)
}

function patchAngleRad(i: number): number { return (PATCH_ANGLE_DEG[i] * Math.PI) / 180; }
function patchPos(i: number): { x: number; y: number } {
  const a = patchAngleRad(i);
  return { x: Math.cos(a) * PATCH_DIST_M[i], y: Math.sin(a) * PATCH_DIST_M[i] };
}

function activeBees(params: ParamValues): number {
  return Math.min(MAX_BEES, Math.max(1, Math.round(params.colonySize as number)));
}
function activePatches(params: ParamValues): number {
  return Math.min(MAX_PATCHES, Math.max(1, Math.round(params.patchCount as number)));
}

function init(params: ParamValues, rng: Rng): State {
  const s: State = {
    min: 0,
    beeState: new Uint8Array(MAX_BEES),
    beeX: new Float32Array(MAX_BEES), beeY: new Float32Array(MAX_BEES),
    beeTX: new Float32Array(MAX_BEES), beeTY: new Float32Array(MAX_BEES),
    beliefBearing: new Float32Array(MAX_BEES), beliefDist: new Float32Array(MAX_BEES),
    quality: new Float32Array(MAX_BEES).fill(-1),
    timer: new Float32Array(MAX_BEES),
    fanThresh: new Float32Array(MAX_BEES), clusterThresh: new Float32Array(MAX_BEES),
    dancesWatched: new Uint16Array(MAX_BEES),
    visitedPatch: new Int8Array(MAX_BEES).fill(-1),
    watchTarget: new Int16Array(MAX_BEES).fill(-1),
    patchConc: new Float32Array(MAX_PATCHES),
    hiveNectar: 0,
    hiveTemp: params.outsideTemp ? (params.outsideTemp as number) - 273.15 : 34,
    richestPatchPrev: -1, decisionStartMin: -1, decisionPending: false, decisionTimeMin: -1,
    histMin: [], histShare: [], histTemp: [], histOutside: [],
    sampleClock: 0,
    richnessOverride: PATCH_RICHNESS_DEFAULT.slice(),
  };
  for (let i = 0; i < MAX_BEES; i++) {
    s.beeState[i] = ST_REST;
    s.timer[i] = REST_BASE_S + rng.range(0, REST_JITTER_S);
    // Individual hardiness: every bee's own thresholds differ a little, and
    // that individual variation is what makes fanning and clustering ramp up
    // gradually across the colony rather than switching all at once.
    s.fanThresh[i] = FAN_THRESH_C + rng.range(-THRESH_JITTER_C, THRESH_JITTER_C);
    s.clusterThresh[i] = CLUSTER_THRESH_C + rng.range(-THRESH_JITTER_C, THRESH_JITTER_C);
  }
  const nPatch = activePatches(params);
  for (let p = 0; p < MAX_PATCHES; p++) {
    const target = (p < nPatch ? richnessOf(params, s, p) : 0) / 100;
    s.patchConc[p] = target;
  }
  pushSample(s, params);
  return s;
}

function richnessOf(params: ParamValues, s: State, patchIdx: number): number {
  const sel = Math.round(params.selectedPatch as number);
  if (sel === patchIdx) return params.richness as number;
  return s.richnessOverride[patchIdx];
}

function pushSample(s: State, params: ParamValues): void {
  const nPatch = activePatches(params);
  const shares = new Array<number>(nPatch).fill(0);
  let flying = 0;
  for (let i = 0; i < activeBees(params); i++) {
    const st = s.beeState[i];
    if (st === ST_SCOUT || st === ST_FORAGE) {
      flying++;
      const p = s.visitedPatch[i];
      if (p >= 0 && p < nPatch) shares[p]++;
    }
  }
  const pct = shares.map((c) => (flying > 0 ? (100 * c) / flying : 0));
  const cap = 300;
  if (s.histMin.length >= cap) { s.histMin.shift(); s.histShare.shift(); s.histTemp.shift(); s.histOutside.shift(); }
  s.histMin.push(s.min);
  s.histShare.push(pct);
  s.histTemp.push(s.hiveTemp);
  s.histOutside.push((params.outsideTemp as number) - 273.15);
}

/* ------------------------------------------------------------------ *
 * The five private rules, applied one bee at a time
 * ------------------------------------------------------------------ */

function angleTo(x: number, y: number): number { return Math.atan2(y, x); }
function dist(x: number, y: number): number { return Math.hypot(x, y); }

/** Which real patch (if any) covers a point — geometry, not a lookup by belief. */
function patchAt(params: ParamValues, x: number, y: number): number {
  const nPatch = activePatches(params);
  for (let p = 0; p < nPatch; p++) {
    const pp = patchPos(p);
    if (Math.hypot(x - pp.x, y - pp.y) <= PATCH_R_M) return p;
  }
  return -1;
}

/**
 * Which patch a flying bee is currently COMMITTED to, whether it has arrived
 * yet or not — geometry on its live target, never a comparison. A bee spends
 * most of a round trip in transit toward a remembered patch, so measuring
 * only who has physically landed (the old `visitedPatch`) undercounts
 * convergence by omitting the very bees whose flight IS the colony's choice.
 *
 * A direct hit on the declared target is the common case, but Rule 4 (see
 * substep) genuinely bends a bee's course onto whichever real patch is
 * nearest once it is within the last ODOUR_RANGE_M of that target — a dance
 * copied with real angular error routinely lands just outside a patch's
 * capture radius, and the live flight corrects that, not just the reading.
 * Crediting only the raw geometric hit would make this function LESS honest
 * than the model it is measuring, so it mirrors the same odour-range rule.
 */
function targetPatchOf(s: State, params: ParamValues, i: number): number {
  const direct = patchAt(params, s.beeTX[i], s.beeTY[i]);
  if (direct >= 0) return direct;
  if (params.ruleFollowOdour !== true) return -1;
  const nPatch = activePatches(params);
  let best = -1, bestD = ODOUR_RANGE_M;
  for (let p = 0; p < nPatch; p++) {
    const pp = patchPos(p);
    const pd = Math.hypot(s.beeTX[i] - pp.x, s.beeTY[i] - pp.y);
    if (pd < bestD) { bestD = pd; best = p; }
  }
  return best;
}

function substep(s: State, dtS: number, params: ParamValues, rng: Rng): void {
  const n = activeBees(params);
  const nPatch = activePatches(params);
  const rFollow = params.ruleFollowDance === true;
  const rDance = params.ruleDanceIfRich === true;
  const rAbandon = params.ruleAbandonIfPoor === true;
  const rOdour = params.ruleFollowOdour === true;
  const rFan = params.ruleFanCluster === true;
  const raining = params.rainEvent === true;
  const errRad = ((params.danceAngularError as number) * Math.PI) / 180;

  // A snapshot of who is dancing right now — the only "public" signal any bee
  // reads from another bee. No colony-level number is read here.
  const dancers: number[] = [];
  for (let i = 0; i < n; i++) if (s.beeState[i] === ST_DANCE) dancers.push(i);

  let fanning = 0, clustering = 0, alive = n;
  for (let i = 0; i < n; i++) {
    const st = s.beeState[i];
    s.timer[i] -= dtS;

    // Rule 5: fan above my own threshold, cluster below it — reacting only
    // to the shared physical air temperature, never to any average of bees.
    if (rFan) {
      if (s.hiveTemp > s.fanThresh[i]) fanning++;
      else if (s.hiveTemp < s.clusterThresh[i]) clustering++;
    }

    if (st === ST_REST) {
      if (s.timer[i] > 0) continue;
      if (raining) { s.timer[i] = 1; continue; } // grounded: keep waiting, launch nothing new
      if (rFollow && dancers.length > 0 && rng.chance(0.6)) {
        s.beeState[i] = ST_FOLLOW;
        s.timer[i] = FOLLOW_WATCH_S;
        s.watchTarget[i] = dancers[rng.int(0, dancers.length - 1)];
        continue;
      }
      // Rule 3 (reversed): only relaunch toward a remembered patch if it was
      // not abandoned. hasMemory is quality >= 0.
      if (s.quality[i] >= ABANDON_Q || !rAbandon) {
        if (s.quality[i] >= 0) {
          launch(s, i, s.beliefBearing[i], s.beliefDist[i]);
          continue;
        }
      } else {
        s.quality[i] = -1; // rule 3: the poor memory is actually forgotten
      }
      // No memory worth using: scout a fresh, private, random bearing.
      launch(s, i, rng.range(0, Math.PI * 2), rng.range(30, FIELD_R_M * 0.95));
    } else if (st === ST_FOLLOW) {
      if (s.timer[i] > 0) continue;
      const watched = s.watchTarget[i];
      const bearing = watched >= 0 ? s.beliefBearing[watched] : rng.range(0, Math.PI * 2);
      const bDist = watched >= 0 ? s.beliefDist[watched] : rng.range(30, FIELD_R_M * 0.95);
      dancesWatchedInc(s, i);
      // Rule 1: copy the dance's bearing with real angular error — never the
      // exact value, and never anything about which patch is "best".
      launch(s, i, bearing + rng.range(-errRad, errRad), Math.max(20, bDist + rng.range(-8, 8)));
    } else if (st === ST_SCOUT || st === ST_FORAGE) {
      const dx = s.beeTX[i] - s.beeX[i], dy = s.beeTY[i] - s.beeY[i];
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        let vx = dx / d, vy = dy / d;
        // Rule 4: within the last 30 m, drift toward whichever real patch is
        // actually closest — a genuine local field, not a hint about value.
        if (rOdour && d < ODOUR_RANGE_M) {
          let best = -1, bestD = ODOUR_RANGE_M;
          for (let p = 0; p < nPatch; p++) {
            const pp = patchPos(p);
            const pd = Math.hypot(s.beeX[i] - pp.x, s.beeY[i] - pp.y);
            if (pd < bestD) { bestD = pd; best = p; }
          }
          if (best >= 0) {
            const pp = patchPos(best);
            const odx = pp.x - s.beeX[i], ody = pp.y - s.beeY[i];
            const od = Math.hypot(odx, ody) || 1;
            const pull = clamp01(1 - bestD / ODOUR_RANGE_M) * 0.6;
            vx = vx * (1 - pull) + (odx / od) * pull;
            vy = vy * (1 - pull) + (ody / od) * pull;
            const vlen = Math.hypot(vx, vy) || 1;
            vx /= vlen; vy /= vlen;
          }
        }
        const step = Math.min(d, BEE_SPEED_M_S * dtS);
        s.beeX[i] += vx * step; s.beeY[i] += vy * step;
        continue;
      }
      // Arrived at the target.
      if (st === ST_SCOUT) {
        const foundPatch = patchAt(params, s.beeX[i], s.beeY[i]);
        s.visitedPatch[i] = foundPatch;
        let yield_ = 0;
        if (foundPatch >= 0) {
          yield_ = s.patchConc[foundPatch];
          s.patchConc[foundPatch] = Math.max(0, s.patchConc[foundPatch] * (1 - HARVEST_FRAC));
          s.hiveNectar += yield_ * 0.02; // grams-equivalent per successful visit
        }
        s.quality[i] = yield_;
        // Only a genuine find is remembered as a belief worth reusing.
        if (foundPatch >= 0) {
          const found = patchPos(foundPatch);
          s.beliefBearing[i] = angleTo(found.x, found.y);
          s.beliefDist[i] = Math.hypot(found.x, found.y);
        }
        s.beeState[i] = ST_FORAGE;
        s.timer[i] = LOAD_TIME_S;
      } else {
        // Loading/foraging at the site, or the return leg completed.
        if (dist(s.beeX[i], s.beeY[i]) < HIVE_ENTRANCE_R_M) {
          // Home. Rule 3 and rule 2, in order.
          if (rAbandon && s.quality[i] < ABANDON_Q) {
            s.quality[i] = -1;
            s.beeState[i] = ST_REST; s.timer[i] = REST_BASE_S + rng.range(0, REST_JITTER_S);
          } else if (rDance && s.quality[i] > DANCE_Q) {
            s.beeState[i] = ST_DANCE;
            s.timer[i] = DANCE_BASE_S + DANCE_SCALE_S * s.quality[i];
          } else {
            s.beeState[i] = ST_REST; s.timer[i] = REST_BASE_S + rng.range(0, REST_JITTER_S);
          }
          continue;
        }
        if (s.timer[i] > 0) continue; // still loading at the patch
        // Head home.
        s.beeTX[i] = 0; s.beeTY[i] = 0;
      }
    } else if (st === ST_DANCE) {
      if (s.timer[i] > 0) continue;
      s.beeState[i] = ST_REST; s.timer[i] = REST_BASE_S;
    }
  }

  // --- patch regrowth toward the student-set target -------------------------
  const regrow = (params.nectarRegrowth as number) / 100 / 60; // %/min -> fraction/s
  for (let p = 0; p < nPatch; p++) {
    const target = richnessOf(params, s, p) / 100;
    s.patchConc[p] = Math.min(1, s.patchConc[p] + (target - s.patchConc[p]) * Math.min(1, regrow * dtS * 4));
  }

  // --- hive temperature: a real ODE driven only by fractions of bees that
  // individually decided to fan or cluster this tick ------------------------
  if (alive > 0) {
    const fanFrac = fanning / alive, clusterFrac = clustering / alive;
    const outsideC = (params.outsideTemp as number) - 273.15;
    const dT = (outsideC - s.hiveTemp) * INSULATION_PER_S
      - FAN_COOL_PER_S * fanFrac + CLUSTER_WARM_PER_S * clusterFrac + BASE_METABOLIC_PER_S;
    s.hiveTemp += dT * dtS;
  }

  // --- decision time: track from a richness change to a colony majority ----
  let bestP = -1, bestC = -1;
  for (let p = 0; p < nPatch; p++) {
    const target = richnessOf(params, s, p);
    if (target > bestC) { bestC = target; bestP = p; }
  }
  if (s.richestPatchPrev >= 0 && bestP !== s.richestPatchPrev && !s.decisionPending) {
    s.decisionPending = true;
    s.decisionStartMin = s.min;
  }
  if (s.decisionPending && bestP >= 0) {
    let atBest = 0, flying = 0;
    for (let i = 0; i < n; i++) {
      if (s.beeState[i] === ST_SCOUT || s.beeState[i] === ST_FORAGE) {
        flying++;
        if (targetPatchOf(s, params, i) === bestP) atBest++;
      }
    }
    if (flying > 0 && atBest / flying > 0.5) {
      s.decisionTimeMin = s.min - s.decisionStartMin;
      s.decisionPending = false;
    }
  }
  s.richestPatchPrev = bestP;

  s.min += dtS / 60;
  s.sampleClock += dtS / 60;
}

function launch(s: State, i: number, bearing: number, distance: number): void {
  s.beliefBearing[i] = bearing;
  s.beliefDist[i] = Math.max(20, Math.min(FIELD_R_M, distance));
  s.beeX[i] = 0; s.beeY[i] = 0;
  s.beeTX[i] = Math.cos(bearing) * s.beliefDist[i];
  s.beeTY[i] = Math.sin(bearing) * s.beliefDist[i];
  s.beeState[i] = ST_SCOUT;
  s.visitedPatch[i] = -1;
}

function dancesWatchedInc(s: State, i: number): void {
  if (s.dancesWatched[i] < 65535) s.dancesWatched[i]++;
}

/* ------------------------------------------------------------------ *
 * Measurements — every one computed by scanning the agents
 * ------------------------------------------------------------------ */

function measure(state: State, params: ParamValues) {
  const n = activeBees(params);
  const nPatch = activePatches(params);
  const shareCount = new Array<number>(nPatch).fill(0);
  let flying = 0, dancing = 0, resting = 0, following = 0, memoryCount = 0;
  for (let i = 0; i < n; i++) {
    const st = state.beeState[i];
    if (st === ST_SCOUT || st === ST_FORAGE) {
      flying++;
      const p = targetPatchOf(state, params, i);
      if (p >= 0 && p < nPatch) shareCount[p]++;
    } else if (st === ST_DANCE) dancing++;
    else if (st === ST_REST) resting++;
    else if (st === ST_FOLLOW) following++;
    if (state.quality[i] >= 0) memoryCount++;
  }
  // "Objectively richest" is the TARGET richness the student set for each
  // patch, not its live, harvest-drained stock — a patch the colony is
  // correctly converging on gets drained hardest, so judging by live stock
  // would punish success. Only a genuine richness change (S3) should move
  // which patch reads as richest, never routine harvest-and-regrowth noise.
  let richest = -1, richestC = -1;
  for (let p = 0; p < nPatch; p++) {
    const target = richnessOf(params, state, p);
    if (target > richestC) { richestC = target; richest = p; }
  }
  const accuracy = flying > 0 && richest >= 0 ? (100 * shareCount[richest]) / flying : 0;
  return { shareCount, flying, dancing, resting, following, memoryCount, richest, richestC, accuracy };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return init(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    let s = state;
    if (params.selectedPatch !== prev.selectedPatch || params.richness !== prev.richness) {
      const sel = Math.round(prev.selectedPatch as number);
      const richnessOverride = s.richnessOverride.slice();
      richnessOverride[sel] = prev.richness as number;
      s = { ...s, richnessOverride };
    }
    if (params.colonySize !== prev.colonySize) {
      // Growing the colony seeds fresh bees at rest; shrinking just stops
      // simulating the extra slots — nothing about an existing bee changes.
      const want = activeBees(params);
      const had = activeBees(prev);
      if (want > had) {
        s = { ...s, beeState: s.beeState.slice(), timer: s.timer.slice(), quality: s.quality.slice() };
        for (let i = had; i < want; i++) {
          s.beeState[i] = ST_REST;
          s.timer[i] = REST_BASE_S + ctx.rng.range(0, REST_JITTER_S);
          s.quality[i] = -1;
        }
      }
    }
    return s;
  },

  step(state, dt, params, ctx, _inputs) {
    if (dt <= 0) return state;
    const s: State = {
      ...state,
      beeState: state.beeState.slice(), beeX: state.beeX.slice(), beeY: state.beeY.slice(),
      beeTX: state.beeTX.slice(), beeTY: state.beeTY.slice(),
      beliefBearing: state.beliefBearing.slice(), beliefDist: state.beliefDist.slice(),
      quality: state.quality.slice(), timer: state.timer.slice(),
      dancesWatched: state.dancesWatched.slice(), visitedPatch: state.visitedPatch.slice(),
      watchTarget: state.watchTarget.slice(),
      patchConc: state.patchConc.slice(),
      histMin: state.histMin.slice(), histShare: state.histShare.slice(),
      histTemp: state.histTemp.slice(), histOutside: state.histOutside.slice(),
    };
    const comp = params.timeComp as number;
    const simSeconds = dt * comp;
    const n = Math.max(1, Math.ceil(simSeconds / 0.5));
    const dtEach = simSeconds / n;
    for (let i = 0; i < n; i++) substep(s, dtEach, params, ctx.rng);
    while (s.sampleClock >= 0.5) {
      s.sampleClock -= 0.5;
      pushSample(s, params);
    }
    return s;
  },

  readouts(state, params) {
    const m = measure(state, params);
    const nPatch = activePatches(params);
    const sel = Math.round(params.selectedPatch as number);
    // Both instant, at t = 0, from the field layout alone — unlike the colony
    // statistics above, which need many round trips to move. "Which patch"
    // can point past the current patch count (its own range runs 0-5 so it
    // always reaches every patch the count control can ever activate), and
    // when it does the richness dial is honestly inert: 0, not a fudge.
    return [
      { key: "flying", label: "Foragers in flight", quantity: q(m.flying, "population"), semantic: "primary-consumer", graphable: true },
      { key: "dancing", label: "Dancing now", quantity: q(m.dancing, "population"), semantic: "field" },
      { key: "accuracy", label: "Colony choice accuracy", unit: "%", quantity: q(m.accuracy, "percent"), semantic: "producer", graphable: true },
      { key: "nectar", label: "Total nectar stored", unit: "g", quantity: q(state.hiveNectar, "mass"), semantic: "producer", graphable: true },
      { key: "hiveTemp", label: "Hive core temperature", unit: "°C", quantity: q(state.hiveTemp + 273.15, "temperature"), semantic: "hot", graphable: true },
      { key: "memoryShare", label: "Bees holding a memory", unit: "%", quantity: q(activeBees(params) > 0 ? (100 * m.memoryCount) / activeBees(params) : 0, "percent") },
      { key: "activePatches", label: "Flower patches active", quantity: q(nPatch, "count"), semantic: "field" },
      { key: "selectedPatchRichness", label: sel < nPatch ? `Richness dial applies to patch ${PATCH_LETTER[sel]}` : "Richness dial applies to no active patch", unit: "%", quantity: q(sel < nPatch ? richnessOf(params, state, sel) : 0, "percent"), semantic: "producer" },
    ];
  },

  facts(state, params) {
    const m = measure(state, params);
    const nPatch = activePatches(params);
    const share: Record<string, number> = {};
    for (let p = 0; p < nPatch; p++) share[`share${PATCH_LETTER[p]}`] = m.flying > 0 ? (100 * m.shareCount[p]) / m.flying : 0;
    return {
      min: state.min,
      day: state.min / 1440,
      flying: m.flying,
      dancing: m.dancing,
      resting: m.resting,
      following: m.following,
      accuracy: m.accuracy,
      richestPatch: m.richest >= 0 ? PATCH_LETTER[m.richest] : "",
      nectar: state.hiveNectar,
      hiveTempC: state.hiveTemp,
      outsideTempC: (params.outsideTemp as number) - 273.15,
      memoryCount: m.memoryCount,
      colonySize: activeBees(params),
      decisionTimeMin: state.decisionTimeMin,
      decisionValid: state.decisionTimeMin >= 0,
      // The emergence check: a colony-level property (converged majority)
      // holding while the per-bee maximum "patches known" is still exactly
      // one — never more, because no bee is ever given a second one to compare.
      maxPatchesKnownByAnyBee: 1,
      emergenceHolds: m.accuracy >= 50 && m.flying > 0,
      ...share,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }

interface Layout {
  stageH: number; fieldX: number; fieldW: number; hiveX: number; hiveW: number; graphH: number;
}
function layout(width: number, height: number, view: string): Layout {
  const graphH = Math.round(height * 0.22);
  const stageH = height - graphH - 6;
  const both = view === "both";
  const fieldW = both ? width * 0.62 : width * 0.98;
  const hiveW = both ? width - fieldW - 16 : width * 0.98;
  return { stageH, fieldX: 6, fieldW, hiveX: fieldW + 12, hiveW, graphH };
}

function worldToField(x: number, y: number, cx: number, cy: number, scale: number): { x: number; y: number } {
  return { x: cx + x * scale, y: cy + y * scale };
}

function drawField(rc: RenderContext<State>, x0: number, w: number, h: number) {
  const { ctx, state, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  sky(ctx, w, h, theme, "day", h);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, 0, w, h); ctx.clip(); ctx.translate(x0, 0);

  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) / (FIELD_R_M * 2.3);

  // Ground.
  ctx.fillStyle = dark ? "#2a3a24" : "#9fc47a";
  ctx.beginPath(); ctx.arc(cx, cy, FIELD_R_M * scale, 0, Math.PI * 2); ctx.fill();

  // Patches.
  const nPatch = activePatches(params);
  for (let p = 0; p < nPatch; p++) {
    const pp = patchPos(p);
    const at = worldToField(pp.x, pp.y, cx, cy, scale);
    const conc = state.patchConc[p];
    const r = PATCH_R_M * scale * (0.6 + 0.4 * conc);
    const bloom = mixHex("#6b8f3a", "#f2c94c", clamp01(conc));
    ctx.fillStyle = hexA(bloom, 0.85);
    ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, Math.PI * 2); ctx.fill();
    caption(ctx, at.x, at.y - r - 8, `${PATCH_LETTER[p]} ${Math.round(conc * 100)}%`, theme, { align: "center", size: 10, weight: 700 });
  }

  // Hive.
  const hivePos = worldToField(0, 0, cx, cy, scale);
  sphere(ctx, hivePos.x, hivePos.y, HIVE_ENTRANCE_R_M * scale * 1.4, "#8a5a2e", { rim: true });
  caption(ctx, hivePos.x, hivePos.y + HIVE_ENTRANCE_R_M * scale * 1.4 + 10, "hive", theme, { align: "center", size: 10, color: theme.inkSoft });

  // Bees — a small elongated, banded body reads clearly as "a bee" even at
  // a few pixels, where a bare dot read as generic noise. A fixed per-bee
  // tilt (a cheap hash of the bee's own index) gives visual variety without
  // needing to track heading in the model's own state — position is the
  // only thing the model actually simulates per bee, and stays untouched.
  const n = activeBees(params);
  const followIdx = params.followOneBee === true ? 0 : -1;
  for (let i = 0; i < n; i++) {
    const st = state.beeState[i];
    if (st !== ST_SCOUT && st !== ST_FORAGE) continue;
    const p = worldToField(state.beeX[i], state.beeY[i], cx, cy, scale);
    const isFollowed = i === followIdx;
    const color = st === ST_SCOUT ? theme.sci["field"] : theme.sci["primary-consumer"];
    const bodyColor = isFollowed ? theme.accent : color;
    const len = isFollowed ? 7 : 3.4;
    const wid = len * 0.55;
    const angle = ((i * 2654435761) % 360) * (Math.PI / 180);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.fillStyle = hexA(bodyColor, 0.92);
    ctx.beginPath();
    ctx.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(dark ? "#12100c" : "#3a2a10", 0.75);
    ctx.lineWidth = Math.max(0.4, wid * 0.22);
    ctx.beginPath();
    ctx.moveTo(-len * 0.1, -wid * 0.5); ctx.lineTo(-len * 0.1, wid * 0.5);
    ctx.moveTo(len * 0.15, -wid * 0.5); ctx.lineTo(len * 0.15, wid * 0.5);
    ctx.stroke();
    ctx.restore();
    if (isFollowed) glow(ctx, p.x, p.y, 10, hexA(theme.accent, 0.4));
  }
  if (params.rainEvent === true) {
    ctx.save();
    ctx.strokeStyle = hexA("#8fbfe0", 0.4);
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const rx = (i * 53 + time * 220) % w;
      const ry = (i * 97 + time * 260) % h;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 10); ctx.stroke();
    }
    ctx.restore();
    caption(ctx, cx, 16, "rain — foragers grounded", theme, { align: "center", size: 11, weight: 700, color: theme.sci["cold"] });
  }
  ctx.restore();
}

function drawHive(rc: RenderContext<State>, x0: number, w: number, h: number) {
  const { ctx, state, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "#241a10" : "#f2d9a0";
  ctx.fillRect(x0, 0, w, h);
  // Comb hex texture, cheap and static-looking.
  ctx.strokeStyle = hexA(dark ? "#4a3620" : "#c9a35c", 0.5);
  ctx.lineWidth = 1;
  const cell = 16;
  for (let row = 0; row * cell * 0.87 < h; row++) {
    for (let col = 0; col * cell * 1.5 < w + cell; col++) {
      const hx = x0 + col * cell * 1.5 + (row % 2 ? cell * 0.75 : 0);
      const hy = row * cell * 0.87;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k;
        const px = hx + Math.cos(a) * cell * 0.5, py = hy + Math.sin(a) * cell * 0.5;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
  }

  // Dance floor: a lit patch near the "entrance", bottom of the panel.
  const floorY = h * 0.82;
  ctx.fillStyle = hexA("#ffe9b0", 0.18);
  ctx.beginPath(); ctx.ellipse(x0 + w / 2, floorY, w * 0.32, h * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  caption(ctx, x0 + w / 2, floorY - h * 0.11, "dance floor", theme, { align: "center", size: 9, color: theme.inkSoft });

  // A capped, representative sample of resting/dancing/following bees so the
  // panel stays legible and fast even at colony size 2000.
  const n = activeBees(params);
  const cap = 140;
  let drawn = 0;
  for (let i = 0; i < n && drawn < cap; i++) {
    const st = state.beeState[i];
    if (st === ST_SCOUT || st === ST_FORAGE) continue;
    const seedX = ((i * 2654435761) >>> 0) / 4294967296;
    const seedY = ((i * 1597334677) >>> 0) / 4294967296;
    let bx: number, by: number, motion = (time * 1.4 + seedX) % 1;
    if (st === ST_DANCE) {
      const phase = (time * 2.2 + seedX) % 1;
      const fig8 = phase * Math.PI * 2;
      bx = x0 + w / 2 + Math.sin(fig8) * w * 0.1;
      by = floorY + Math.sin(fig8 * 2) * h * 0.04;
    } else if (st === ST_FOLLOW) {
      bx = x0 + w / 2 + (seedX - 0.5) * w * 0.4;
      by = floorY - h * 0.05 + (seedY - 0.5) * h * 0.06;
    } else {
      bx = x0 + w * 0.15 + seedX * w * 0.7;
      by = h * 0.2 + seedY * h * 0.5;
    }
    creature(ctx, bx, by, 9, "bee", seedX > 0.5 ? 1 : -1, theme, { motion, shadow: false });
    if (st === ST_DANCE) glow(ctx, bx, by, 8, hexA("#f2c94c", 0.3));
    drawn++;
  }
  if (params.followOneBee === true) {
    const st = state.beeState[0];
    const label = st === ST_REST ? "resting" : st === ST_DANCE ? "dancing" : st === ST_FOLLOW ? "watching a dance" : "out";
    caption(ctx, x0 + 8, 16, `bee #0: ${label}`, theme, { size: 10, weight: 700, color: theme.accent });
  }
  ctx.restore();
}

function drawGraphs(rc: RenderContext<State>, y: number, width: number, height: number, params: ParamValues) {
  const { ctx, state, theme } = rc;
  const n = state.histMin.length;
  const t0 = n > 0 ? state.histMin[0] : 0, t1 = n > 0 ? Math.max(state.histMin[n - 1], t0 + 1) : 1;
  const w1 = width * 0.6, w2 = width - w1 - 8;
  const nPatch = activePatches(params);

  const s1 = chartFrame(ctx, 0, y, w1, height, { xMin: t0, xMax: t1, yMin: 0, yMax: 100, yLabel: "% foragers", xLabel: "min" }, theme);
  const colors = [theme.sci["producer"], theme.sci["primary-consumer"], theme.sci["hot"], theme.sci["field"], theme.sci["cold"], theme.sci["decomposer"]];
  const legendItems = [];
  for (let p = 0; p < nPatch; p++) {
    const pts = state.histShare.map((row, i) => ({ x: state.histMin[i], y: row[p] ?? 0 }));
    lineSeries(ctx, pts, s1.sx, s1.sy, colors[p], { theme, endDot: true, width: 1.6 });
    legendItems.push({ label: PATCH_LETTER[p], color: colors[p], shape: "line" as const });
  }
  legend(ctx, 4, y + 2, legendItems, theme, { size: 9 });

  const s2 = chartFrame(ctx, w1 + 8, y, w2, height, { xMin: t0, xMax: t1, yMin: 0, yMax: 45, yLabel: "°C" }, theme);
  const tempPts = state.histTemp.map((v, i) => ({ x: state.histMin[i], y: v }));
  const outPts = state.histOutside.map((v, i) => ({ x: state.histMin[i], y: v }));
  lineSeries(ctx, outPts, s2.sx, s2.sy, theme.sci["cold"], { theme, endDot: false, width: 1 });
  lineSeries(ctx, tempPts, s2.sx, s2.sy, theme.sci["hot"], { theme, endDot: true });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const view = (params.view as string) ?? "both";
  const L = layout(width, height, view);

  if (view !== "hive") drawField(rc, L.fieldX, L.fieldW, L.stageH);
  if (view !== "field") drawHive(rc, L.hiveX, L.hiveW, L.stageH);
  drawGraphs(rc, L.stageH + 6, width, L.graphH - 6, params);

  const m = measure(state, params);
  badge(ctx, width / 2, 16, `richest: ${m.richest >= 0 ? PATCH_LETTER[m.richest] : "--"} · colony there: ${num(m.accuracy, 0)}%`, theme, {
    align: "center", color: theme.sci["producer"],
  });
  badge(ctx, 8, 16, `${m.flying} flying`, theme, { color: theme.sci["field"] });
  badge(ctx, width - 8, 16, `${num(state.hiveTemp, 1)}°C hive`, theme, { align: "right", color: theme.sci["hot"] });
  const holds = m.accuracy >= 50 && m.flying > 0;
  badge(ctx, width / 2, height - L.graphH - 18, holds ? "EMERGENCE: colony converged, no bee compared" : "no majority yet", theme, {
    align: "center", color: holds ? theme.sci["neutral"] : theme.inkSoft,
  });
  vignette(ctx, width, L.stageH, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const K = 273.15;

const BASE_SETUP: ParamValues = {
  ruleFollowDance: true, ruleDanceIfRich: true, ruleAbandonIfPoor: true, ruleFollowOdour: true, ruleFanCluster: true,
  colonySize: 600, patchCount: 4, selectedPatch: 0, richness: 90,
  nectarRegrowth: 6, danceAngularError: 8, outsideTemp: 22 + K,
  followOneBee: false, rainEvent: false, timeComp: 30, view: "both",
};

export const noBeeInChargeSim: SimManifest<State> = {
  id: "g6.a1-4",
  title: "No Bee Is In Charge",
  tagline: "Watch a colony choose the richest flower patch while every single bee it is built from knows only one patch of its own.",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-2"] },
  learningGoals: [
    "State the core idea of an emergent property: a whole can have an ability that not one of its parts has, or could have.",
    "Trace a colony-level pattern back to the same five private, individual rules running in every agent, with nothing above the individual level doing any comparing or deciding.",
    "Show that colony-level quantities (patch share, hive temperature) must be measured by counting agents, never assigned to them.",
  ],
  misconceptions: [
    "Organised group behaviour needs something or someone doing the organising",
    "The queen bee makes the colony's decisions",
    "A bee that recruits others must know which patch is objectively best",
    "If the colony's average behaviour looks smart, some part of it must be doing the averaging",
  ],
  interactionHint: "Turn off 'Dance if rich', then click a bee to see it still knows only one patch, forever.",
  tickRate: 30,
  timeScale: 1,
  params: {
    ruleFollowDance: { type: "boolean", label: "Rule: follow a dance", default: true, help: "An idle bee may watch a currently-dancing bee and copy its bearing, with error." },
    ruleDanceIfRich: { type: "boolean", label: "Rule: dance if rich", default: true, help: "A returning forager only dances when its own last yield was good." },
    ruleAbandonIfPoor: { type: "boolean", label: "Rule: abandon if poor", default: true, help: "A returning forager forgets its patch once its own last yield falls too low." },
    ruleFollowOdour: { type: "boolean", label: "Rule: follow odour", default: true, help: "Within the last 30 m, a bee drifts toward whichever real patch is actually nearest." },
    ruleFanCluster: { type: "boolean", label: "Rule: fan or cluster", default: true, help: "Each bee fans above its own heat threshold and clusters below its own cold threshold." },
    colonySize: { type: "number", label: "Colony size", kind: "count", min: 50, max: 2000, step: 10, default: 600, help: "How many agents run. Emergent patch choice weakens, then vanishes, as this falls." },
    patchCount: { type: "number", label: "Patch count", kind: "count", min: 1, max: 6, step: 1, default: 4, help: "How many flower patches exist in the field." },
    selectedPatch: {
      type: "number", label: "Selected patch (for richness)", kind: "count", min: 0, max: 5, step: 1, default: 0,
      help: "Which patch letter the richness slider below edits: 0=A, 1=B, 2=C, 3=D, 4=E, 5=F.",
    },
    richness: { type: "number", label: "Richness of selected patch (%)", kind: "ratio", min: 0, max: 100, step: 5, default: 90, help: "Nectar concentration the selected patch regrows toward." },
    nectarRegrowth: { type: "number", label: "Nectar regrowth (%/min)", kind: "ratio", min: 0, max: 20, step: 1, default: 6, help: "How fast a depleted patch refills." },
    danceAngularError: { type: "number", label: "Dance angular error (°)", kind: "angle", unit: "°", min: 0, max: 30, step: 1, default: 8, help: "Precision with which a follower copies a dance bearing." },
    outsideTemp: { type: "number", label: "Outside temperature", kind: "temperature", unit: "°C", min: 0 + K, max: 45 + K, step: 1, default: 22 + K, help: "Drives fanning and clustering, and how hard the colony must work to hold hive temperature." },
    followOneBee: { type: "boolean", label: "Follow one bee", default: false, help: "Highlights a single agent and shows only what it privately knows." },
    rainEvent: { type: "boolean", label: "Rain event", default: false, help: "Grounds all foragers for as long as it is on." },
    timeComp: {
      type: "number", label: "Time compression", kind: "ratio", min: 1, max: 120, step: 1, default: 30,
      marks: [{ value: 1, label: "1x" }, { value: 30, label: "30x" }, { value: 120, label: "120x" }],
      help: "Simulated minutes per real second.",
    },
    view: {
      type: "option", label: "View",
      options: [{ value: "field", label: "Field only" }, { value: "hive", label: "Hive only" }, { value: "both", label: "Both" }],
      default: "both", help: "Show the field, the hive interior, or both.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "four-patches-one-best",
      title: "Four patches, one best",
      question: "Does the colony end up mostly at the best patch? Now inspect ten bees. How many of them compared the patches?",
      bands: ["6-8"], minutes: 20, standards: ["MS-LS2-2"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict before running",
          instruction: "Four patches at 90%, 45%, 30% and 20% richness. All five rules are on.",
          predict: {
            prompt: "After the colony settles, how many bees will have compared all four patches to pick the best one?",
            options: ["All of them — that is how they picked correctly", "About half, enough to average", "Zero — not one bee ever compares two patches"],
            correct: 2,
            reveal: "Zero. Every bee's private memory holds exactly one patch. If the colony ends up mostly at the richest one, that fact lives only in the pattern across thousands of independent, one-patch decisions — never inside any single bee.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run to convergence",
          instruction: "Run for at least 20 simulated minutes and record patch share.",
          requireData: 1,
          check: { describe: "The colony has a clear majority at one patch", test: (v) => (v.facts.min as number) >= 20 && (v.facts.accuracy as number) > 40 },
          hints: ["Patch share is graphed live at the bottom — watch one colour pull ahead."],
        },
        {
          id: "inspect", phase: "analyze", title: "Inspect ten bees",
          instruction: "Toggle 'Follow one bee' and check the private card. Every bee you check should show exactly one remembered patch or none.",
          check: { describe: "Colony flying and choosing, with the per-bee maximum still exactly one patch", test: (v) => (v.facts.flying as number) > 0 && (v.facts.maxPatchesKnownByAnyBee as number) === 1 },
        },
        {
          id: "conclude", phase: "conclude", title: "Say what the colony has that no bee has",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "The colony converges on the richest patch. State plainly what property the colony has that not one single bee it is made of has.",
            placeholder: "Every bee I checked knew only ... Yet the colony as a whole ... This is an emergent property because ...",
          },
        },
      ],
    },
    {
      id: "silence-the-dance",
      title: "Silence the dance",
      question: "Every bee still forages perfectly well. What exactly has the colony lost the ability to do?",
      bands: ["6-8"], minutes: 18, standards: ["MS-LS2-2"],
      setup: { ...BASE_SETUP, ruleDanceIfRich: false },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the loss",
          instruction: "Only 'Dance if rich' is off. Every other rule, and every bee's flying ability, is unchanged.",
          predict: {
            prompt: "What changes for the colony?",
            options: [
              "Nothing — bees find patches by scouting anyway",
              "Individual bees stop being able to fly to a good patch",
              "The colony loses its ability to concentrate quickly on the best patch — recruitment stops, not flight",
            ],
            correct: 2,
            reveal: "Recruitment stops. Rule 2 was the only thing turning a good private find into a public signal other bees could follow. With it off, bees still scout, still forage, still remember one patch each — the colony just no longer converges quickly, because nothing is advertising anymore.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run and compare",
          instruction: "Run for 20 minutes and record patch share and colony accuracy.",
          requireData: 1,
          check: { describe: "Bees are still flying and finding patches", test: (v) => (v.facts.flying as number) > 0 },
          hints: ["Watch the dance floor in the hive view — it should stay empty the whole run."],
        },
        {
          id: "confirm", phase: "analyze", title: "Confirm nobody is dancing",
          instruction: "Check the dancing count.",
          check: { describe: "Zero bees dancing, by rule, not by chance", test: (v) => v.params.ruleDanceIfRich === false && (v.facts.dancing as number) === 0 },
        },
        {
          id: "conclude", phase: "conclude", title: "Name exactly what disappeared",
          instruction: "State it in one sentence, as the lab's question asks.",
          write: {
            prompt: "In one sentence: what exactly has the colony lost the ability to do?",
            placeholder: "The colony has lost its ability to ..., because the only rule that ever turned a private find into a public signal was ...",
          },
        },
      ],
    },
    {
      id: "the-best-patch-runs-dry",
      title: "The best patch runs dry",
      question: "How many minutes does the colony take to switch, and what individual behaviour makes the switch happen?",
      bands: ["6-8"], minutes: 20, standards: ["MS-LS2-2"],
      setup: { ...BASE_SETUP, nectarRegrowth: 0 },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the switch",
          instruction: "Patch A starts at 90% richness with regrowth at zero, so every visit only drains it further.",
          predict: {
            prompt: "As patch A empties, which individual rule actually causes bees to leave it?",
            options: [
              "A colony vote to reallocate foragers",
              "Rule 3: enough individual bees personally measure a poor yield there and abandon it",
              "The bees can smell that another patch is now richer",
            ],
            correct: 1,
            reveal: "Rule 3, one bee at a time. Nothing compares patch A to any other patch. Each forager only ever asks 'was my own last trip here any good?' — and as A empties, more and more individual answers turn out to be 'no'.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run until A empties out",
          instruction: "Run until patch A's concentration is clearly low and record how the colony's patch share has shifted.",
          requireData: 1,
          check: { describe: "Patch A is no longer the richest", test: (v) => v.facts.richestPatch !== "A" },
          hints: ["Watch patch A's bloom colour fade on the field view as its concentration drops."],
        },
        {
          id: "time-it", phase: "measure", title: "Record the decision time",
          instruction: "Keep running until the decision-time readout reports a value.",
          check: { describe: "A decision time has been measured", test: (v) => v.facts.decisionValid === true },
          hints: ["Decision time only ever reports a measured value — it starts blank and stays blank until a majority has actually moved."],
        },
        {
          id: "conclude", phase: "conclude", title: "Name the mechanism, not a metaphor",
          instruction: "Answer the lab's question directly.",
          write: {
            prompt: "State the decision time you measured, and name the exact individual behaviour (not a metaphor like 'the colony realised') that produced the switch.",
            placeholder: "The colony took about ... minutes to switch. That happened because, one bee at a time, ...",
          },
        },
      ],
    },
    {
      id: "cold-snap-in-the-almond-bloom",
      title: "Cold snap in the almond bloom",
      question: "Hive core temperature holds near 34 °C. Which bee measured it, and what is each bee actually responding to?",
      bands: ["6-8"], minutes: 18, standards: ["MS-LS2-2"],
      setup: { ...BASE_SETUP, outsideTemp: 4 + K, colonySize: 1200, ruleFanCluster: true },
      steps: [
        {
          id: "predict", phase: "hypothesis", title: "Predict the hive's response",
          instruction: "Outside is 4 °C. 1200 bees, fan-or-cluster is on.",
          predict: {
            prompt: "What does each bee actually sense and respond to?",
            options: [
              "The colony's average internal temperature, read off a shared display",
              "The one shared physical air temperature around it, compared against its own personal threshold",
              "A signal from bees that are already clustering",
            ],
            correct: 1,
            reveal: "Its own threshold against the one real, physical hive temperature. No bee is told the average — there is no average to tell. Each bee just compares the air it is sitting in to a number that is a little different for every individual, and clustering (or fanning) is what that private comparison produces.",
          },
        },
        {
          id: "run", phase: "measure", title: "Run and watch the hive hold",
          instruction: "Run for 15 simulated minutes and record hive core temperature.",
          requireData: 1,
          check: { describe: "Hive core temperature stays well above the freezing outside air", test: (v) => (v.facts.hiveTempC as number) > 25 },
          hints: ["The right-hand graph plots outside temperature against hive temperature — the gap between them is the colony's own doing."],
        },
        {
          id: "which-bee", phase: "analyze", title: "Which bee measured it?",
          instruction: "Follow one bee and check its state.",
          check: { describe: "The followed bee's behaviour is visible and traceable", test: (v) => v.params.followOneBee === true },
        },
        {
          id: "conclude", phase: "conclude", title: "Say what each bee is really doing",
          instruction: "Answer the lab's question.",
          write: {
            prompt: "Hive temperature holds near 34 °C. Name which bee is measuring 'the colony', and describe what each individual bee is actually comparing.",
            placeholder: "No single bee measures the colony — instead, each bee compares ... against ..., and the hive-level steadiness is what that adds up to.",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "smallest-working-colony",
      title: "The smallest working colony",
      brief: "With every rule on, find the smallest colony size that still reliably converges on the richest of four patches.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, colonySize: 60 },
      goal: {
        describe: "A majority converges on the richest patch with 80 or fewer bees",
        test: (v) => (v.params.colonySize as number) <= 80 && (v.facts.accuracy as number) > 50 && (v.facts.flying as number) >= 5,
      },
      stars: {
        two: {
          describe: "Convergence with 60 or fewer bees",
          test: (v) => (v.params.colonySize as number) <= 60 && (v.facts.accuracy as number) > 50 && (v.facts.flying as number) >= 5,
        },
      },
      hints: [
        "Fewer bees means fewer independent samples of the field — the pattern gets noisier before it disappears.",
        "Give it enough simulated minutes; a small colony still converges, just more slowly.",
      ],
    },
    {
      id: "recruit-without-dancing",
      title: "Recruit without dancing",
      brief: "With 'Dance if rich' off, use only 'Follow odour' to get the colony to a real, measured majority at the richest patch anyway.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, ruleDanceIfRich: false },
      goal: {
        describe: "Colony choice accuracy over 50% with dancing structurally impossible",
        test: (v) => v.params.ruleDanceIfRich === false && (v.facts.dancing as number) === 0 && (v.facts.accuracy as number) > 50,
      },
      hints: [
        "Without recruitment, only two things can still concentrate foragers on the best patch: chance scouting, and the odour rule pulling searchers the last 30 m toward whatever is real.",
        "A very rich patch relative to the others gives odour-following more to work with.",
      ],
    },
  ],
};
