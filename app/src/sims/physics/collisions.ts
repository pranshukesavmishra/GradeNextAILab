import type { ParamValues, RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { arrow, energyBars, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, comet, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere,
  vignette,
} from "@ui/scene";

/**
 * Collisions and Crumple Zones — Grade 8, Unit A topics A5/A6 and Unit B
 * topics B3/B5.
 *
 * Two carts meet on a bench track. The bumper between them is a real
 * deformable body, not an instant event: it loads up along `F = kδ`, reaches a
 * peak force, then unloads along a lower path, leaving a permanent crush. That
 * hysteresis loop *is* the energy the collision converts to heat and bent
 * metal, and its width is set by the bounciness the student chooses.
 *
 * Because the bumper pushes the two carts with equal and opposite forces at
 * every instant, momentum is conserved exactly in every case — elastic,
 * inelastic, equal masses, wildly unequal masses. Kinetic energy is conserved
 * only when the bumper gives everything back. Those two facts, side by side,
 * are the whole unit.
 *
 * The contact model is the standard bilinear (hysteretic) contact used in
 * crashworthiness work:
 *   loading   F = k·δ                       while the carts are still closing
 *   unloading F = k·(δ − δ_perm)            with δ_perm = (1 − e)·δ_max
 * It reproduces the textbook results exactly: separation speed = e × approach
 * speed, peak force = v_approach·√(k·m*), and contact time = π·√(m* / k).
 *
 * The force drops abruptly at maximum crush: a structure that has just been
 * bent does not push back as hard as it resisted, and real crash-test force
 * traces show exactly that step. Everything after it is elastic spring-back
 * from the bumper's new, shorter rest length.
 */

/* ------------------------------------------------------------------ *
 * Geometry and closed-form results
 * ------------------------------------------------------------------ */

/** Usable bench track, metres. Rigid end stops close both ends. */
export const TRACK_LENGTH = 12;
/** Half the rigid body of a cart, metres. */
const BODY_HALF = 0.3;
/** Undeformed bumper depth on each face, metres. */
const BUMPER_DEPTH = 0.15;
/** Centre separation at which two bumpers first touch. */
const CONTACT_GAP = 2 * (BODY_HALF + BUMPER_DEPTH);
/** How far the pair of bumpers can crush before the cabins meet. */
export const CRUMPLE_DEPTH = 0.3;

/** Reduced mass — the effective mass of the relative motion of two bodies. */
export function reducedMass(mA: number, mB: number): number {
  return (mA * mB) / (mA + mB);
}

/**
 * Textbook one-dimensional collision with coefficient of restitution e.
 * Momentum is conserved for every e; kinetic energy only when e = 1.
 */
export function collisionOutcome(
  mA: number, mB: number, vA: number, vB: number, e: number,
): { vA: number; vB: number } {
  const p = mA * vA + mB * vB;
  const total = mA + mB;
  const rel = vA - vB;
  return {
    vA: (p - mB * e * rel) / total,
    vB: (p + mA * e * rel) / total,
  };
}

/**
 * What the bumper does during one contact, from the closed-form solution of
 * the loading half-cycle. These are the numbers an engineer designs against.
 */
export function contactProfile(
  stiffness: number, mStar: number, approachSpeed: number, e: number,
): { peakForce: number; maxCompression: number; contactTime: number; impulse: number } {
  const omega = Math.sqrt(stiffness / mStar);
  const v = Math.abs(approachSpeed);
  return {
    // δ_max = v/ω, so F_peak = k·δ_max = v·√(k·m*).
    peakForce: v * Math.sqrt(stiffness * mStar),
    maxCompression: v / omega,
    // A quarter period to squash it plus a quarter period to push back. A
    // bumper that keeps everything (e = 0) never pushes back, so it lets go at
    // maximum crush and the contact lasts only the first quarter period.
    contactTime: (Math.PI / omega) * (e > 0 ? 1 : 0.5),
    // Δ(relative velocity) = (1 + e)·v, delivered to each cart as m*·Δv.
    impulse: mStar * v * (1 + e),
  };
}

/** Kinetic energy the collision converts to heat and permanent deformation. */
export function energyLost(
  mA: number, mB: number, vA: number, vB: number, e: number,
): number {
  return 0.5 * reducedMass(mA, mB) * (1 - e * e) * (vA - vB) ** 2;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/** One deformable contact, mid-collision. */
interface Contact {
  active: boolean;
  /** True while the bodies are still closing on each other. */
  loading: boolean;
  /** Deepest elastic compression reached this contact, metres. */
  dMax: number;
  /**
   * Permanent crush the bumper has taken, metres. It never decreases, so a
   * bumper that has been flattened once stays flattened — which is exactly
   * why a real crumple zone is a single-use safety device.
   */
  crush: number;
}

interface Snapshot {
  vA: number;
  vB: number;
}

interface State {
  t: number;
  xA: number; vA: number;
  xB: number; vB: number;
  ab: Contact;
  wallA: Contact;
  wallB: Contact;
  /** Current bumper force between the carts, newtons. */
  force: number;
  /** Compression of the pair of bumpers right now, metres. */
  squash: number;
  peakForce: number;
  contactTime: number;
  impulse: number;
  maxCompression: number;
  collisions: number;
  wallHits: number;
  before: Snapshot;
  after: Snapshot;
  /** Force against time for the contact in progress, seconds from first touch. */
  trace: { t: number; f: number }[];
  /** The previous contact, kept so two designs can be compared directly. */
  ghost: { t: number; f: number }[];
  /** Total kinetic energy the run started with, for the energy ledger. */
  ke0: number;
  trailA: number[];
  trailB: number[];
}

const MAX_TRACE = 320;
const TRAIL = 40;

function noContact(): Contact {
  return { active: false, loading: false, dMax: 0, crush: 0 };
}

function freshState(params: ParamValues): State {
  const mA = params.massA as number;
  const mB = params.massB as number;
  const vA = params.speedA as number;
  const vB = params.speedB as number;
  return {
    t: 0,
    xA: 3.5, vA,
    xB: 8.5, vB,
    ab: noContact(), wallA: noContact(), wallB: noContact(),
    force: 0, squash: 0,
    peakForce: 0, contactTime: 0, impulse: 0, maxCompression: 0,
    collisions: 0, wallHits: 0,
    before: { vA, vB }, after: { vA, vB },
    trace: [], ghost: [],
    ke0: 0.5 * mA * vA * vA + 0.5 * mB * vB * vB,
    trailA: [3.5], trailB: [8.5],
  };
}

/**
 * Bumper force for a total compression δ. Only the squash beyond the crush the
 * bumper has already taken pushes back, so one expression covers both the
 * loading stroke and the spring-back.
 */
function contactForce(c: Contact, delta: number, k: number): number {
  return Math.max(0, k * (delta - c.crush));
}

/** Elastic energy still stored in a compressed bumper, joules. */
function contactEnergy(c: Contact, delta: number, k: number): number {
  if (!c.active) return 0;
  const x = Math.max(0, delta - c.crush);
  return 0.5 * k * x * x;
}

/** Elastic energy held in every compressed bumper on the bench, joules. */
function storedEnergy(state: State, k: number): number {
  const dAB = CONTACT_GAP - (state.xB - state.xA);
  const dWA = BODY_HALF + BUMPER_DEPTH - state.xA;
  const dWB = state.xB - (TRACK_LENGTH - BODY_HALF - BUMPER_DEPTH);
  return contactEnergy(state.ab, dAB, k)
    + contactEnergy(state.wallA, dWA, k)
    + contactEnergy(state.wallB, dWB, k);
}

/** Advance one contact's phase bookkeeping. Returns the updated record. */
function advanceContact(c: Contact, delta: number, closing: boolean, e: number): Contact {
  const elastic = delta - c.crush;
  if (elastic <= 0) {
    return c.active ? { ...c, active: false, loading: false, dMax: 0 } : c;
  }
  if (!c.active) return { ...c, active: true, loading: true, dMax: elastic };
  if (c.loading) {
    if (closing) return { ...c, dMax: Math.max(c.dMax, elastic) };
    // Turning point: the bumper is as crushed as it will get. The share of
    // that squash it never gives back becomes permanent crush, which is the
    // energy the collision took out of the motion.
    const dMax = Math.max(c.dMax, elastic);
    return {
      active: true, loading: false, dMax,
      crush: Math.min(CRUMPLE_DEPTH, c.crush + (1 - e) * dMax),
    };
  }
  return c;
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    // Anything that defines the crash restarts it. Nothing else does.
    const keys = ["massA", "massB", "speedA", "speedB", "elasticity", "stiffness"];
    if (keys.some((k) => params[k] !== prev[k])) return freshState(params);
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const mA = params.massA as number;
    const mB = params.massB as number;
    const k = params.stiffness as number;
    const e = Math.max(0, Math.min(1, params.elasticity as number));

    const mStar = reducedMass(mA, mB);
    const omega = Math.sqrt(k / mStar);
    // Substep only when something is about to happen, so an untouched track
    // costs one integration step and a crash costs as many as it needs.
    const near = state.ab.active || state.wallA.active || state.wallB.active
      || state.xB - state.xA < CONTACT_GAP + 0.5
      || state.xA < BODY_HALF + BUMPER_DEPTH + 0.5
      || state.xB > TRACK_LENGTH - BODY_HALF - BUMPER_DEPTH - 0.5;
    // Resolve the contact finely enough that the separation speed lands on the
    // textbook value; away from a contact one step is plenty.
    const sub = near ? Math.min(900, Math.max(1, Math.ceil((dt * omega) / 0.0015))) : 1;
    const h = dt / sub;

    let { xA, vA, xB, vB, ab, wallA, wallB } = state;
    let { peakForce, contactTime, impulse, maxCompression, collisions, wallHits } = state;
    let before = state.before;
    let after = state.after;
    let trace = state.trace;
    let ghost = state.ghost;
    let force = 0;
    let squash = 0;
    let t = state.t;

    for (let i = 0; i < sub; i++) {
      const delta = CONTACT_GAP - (xB - xA);
      const closing = vA - vB > 0;

      const wasActive = ab.active;
      ab = advanceContact(ab, delta, closing, e);
      if (!wasActive && ab.active) {
        // A new collision begins: remember the state we are about to leave.
        before = { vA, vB };
        peakForce = 0; contactTime = 0; impulse = 0; maxCompression = 0;
        ghost = trace.length > 2 ? trace : ghost;
        trace = [];
        collisions += 1;
      }
      if (wasActive && !ab.active) after = { vA, vB };

      // Wall stops. They are part of the bench, not part of the two-cart
      // system, so they are the one place momentum leaves the carts.
      const dWA = BODY_HALF + BUMPER_DEPTH - xA;
      const dWB = xB - (TRACK_LENGTH - BODY_HALF - BUMPER_DEPTH);
      const wasWA = wallA.active, wasWB = wallB.active;
      wallA = advanceContact(wallA, dWA, vA < 0, e);
      wallB = advanceContact(wallB, dWB, vB > 0, e);
      if ((!wasWA && wallA.active) || (!wasWB && wallB.active)) wallHits += 1;

      const f = contactForce(ab, delta, k);
      const fWA = contactForce(wallA, dWA, k);
      const fWB = contactForce(wallB, dWB, k);

      // Newton's Third Law, written directly into the integrator: one force,
      // applied to two different bodies, in opposite directions.
      vA += ((-f + fWA) / mA) * h;
      vB += ((f - fWB) / mB) * h;
      xA += vA * h;
      xB += vB * h;
      t += h;

      if (ab.active) {
        contactTime += h;
        impulse += f * h;
        peakForce = Math.max(peakForce, f);
        maxCompression = Math.max(maxCompression, delta);
        if (trace.length < MAX_TRACE
          && (trace.length === 0 || contactTime - trace[trace.length - 1].t >= 0.0015)) {
          trace = trace.concat({ t: contactTime, f });
        }
      }
      force = f;
      squash = Math.max(0, delta);
    }

    const trailA = state.trailA.length >= TRAIL
      ? state.trailA.slice(1).concat(xA) : state.trailA.concat(xA);
    const trailB = state.trailB.length >= TRAIL
      ? state.trailB.slice(1).concat(xB) : state.trailB.concat(xB);

    return {
      ...state,
      t, xA, vA, xB, vB, ab, wallA, wallB,
      force, squash,
      peakForce, contactTime, impulse, maxCompression, collisions, wallHits,
      before, after, trace, ghost, trailA, trailB,
    };
  },

  readouts(state, params) {
    const mA = params.massA as number;
    const mB = params.massB as number;
    const k = params.stiffness as number;
    const pA = mA * state.vA;
    const pB = mB * state.vB;
    const keA = 0.5 * mA * state.vA * state.vA;
    const keB = 0.5 * mB * state.vB * state.vB;
    const stored = storedEnergy(state, k);
    const heat = Math.max(0, state.ke0 - keA - keB - stored);

    return [
      { key: "vA", label: "Cart A velocity", quantity: q(state.vA, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "vB", label: "Cart B velocity", quantity: q(state.vB, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "pA", label: "Momentum A (kg·m/s)", quantity: q(pA, "ratio"), semantic: "momentum", graphable: true, bands: ["6-8", "9-12"] },
      { key: "pB", label: "Momentum B (kg·m/s)", quantity: q(pB, "ratio"), semantic: "momentum", graphable: true, bands: ["6-8", "9-12"] },
      { key: "pTotal", label: "Total momentum (kg·m/s)", quantity: q(pA + pB, "ratio"), semantic: "momentum", graphable: true },
      { key: "keTotal", label: "Total kinetic energy", quantity: q(keA + keB, "energy"), unit: "J", semantic: "energy-kinetic", graphable: true },
      { key: "heat", label: "Energy converted to heat", quantity: q(heat, "energy"), unit: "J", semantic: "energy-thermal", graphable: true },
      { key: "force", label: "Bumper force now", quantity: q(state.force, "force"), unit: "N", semantic: "force", graphable: true },
      { key: "peakForce", label: "Peak force", quantity: q(state.peakForce, "force"), unit: "N", semantic: "force", graphable: false },
      { key: "contactTime", label: "Contact time", quantity: q(state.contactTime, "time"), unit: "ms", semantic: "time", graphable: false },
      { key: "impulse", label: "Impulse on cart B (N·s)", quantity: q(state.impulse, "ratio"), semantic: "momentum", graphable: false, bands: ["9-12"] },
      { key: "squash", label: "Bumper crush", quantity: q(state.maxCompression, "length"), unit: "cm", semantic: "distance", graphable: false, bands: ["6-8", "9-12"] },
    ];
  },

  facts(state, params) {
    const mA = params.massA as number;
    const mB = params.massB as number;
    const k = params.stiffness as number;
    const e = Math.max(0, Math.min(1, params.elasticity as number));
    const keA = 0.5 * mA * state.vA * state.vA;
    const keB = 0.5 * mB * state.vB * state.vB;
    const stored = storedEnergy(state, k);
    const pBefore = mA * state.before.vA + mB * state.before.vB;
    const pAfter = mA * state.after.vA + mB * state.after.vB;
    const keBefore = 0.5 * mA * state.before.vA ** 2 + 0.5 * mB * state.before.vB ** 2;
    const keAfter = 0.5 * mA * state.after.vA ** 2 + 0.5 * mB * state.after.vB ** 2;
    return {
      t: state.t,
      vA: state.vA, vB: state.vB,
      pA: mA * state.vA, pB: mB * state.vB,
      pTotal: mA * state.vA + mB * state.vB,
      pBefore, pAfter,
      momentumDrift: Math.abs(pAfter - pBefore),
      keTotal: keA + keB,
      keBefore, keAfter,
      keLost: keBefore - keAfter,
      predictedLoss: energyLost(mA, mB, state.before.vA, state.before.vB, e),
      heat: Math.max(0, state.ke0 - keA - keB - stored),
      afterA: state.after.vA, afterB: state.after.vB,
      peakForce: state.peakForce,
      contactTime: state.contactTime,
      impulse: state.impulse,
      maxCompression: state.maxCompression,
      bottomedOut: state.maxCompression > CRUMPLE_DEPTH,
      collided: state.collisions > 0 && !state.ab.active,
      collisions: state.collisions,
      wallHits: state.wallHits,
      inContact: state.ab.active,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/** A titled card the panels below the track sit in. */
function card(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  title: string, theme: ThemeColors, compact: boolean,
) {
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? hexA(theme.surface, 0.6) : hexA(theme.surface, 0.8);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  if (!compact) caption(ctx, x + 8, y + 12, title, theme, { size: 11, weight: 700 });
}

/** One signed momentum bar, growing left or right of a centre line. */
function signedBar(
  ctx: CanvasRenderingContext2D, midX: number, y: number, h: number,
  value: number, scale: number, color: string,
) {
  const w = value * scale;
  if (Math.abs(w) < 0.4) return;
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, w >= 0 ? midX : midX + w, y, Math.abs(w), h, 2);
  ctx.fill();
  ctx.restore();
}

function drawCart(
  ctx: CanvasRenderingContext2D, cx: number, railY: number, pxPerM: number,
  color: string, theme: ThemeColors, label: string, compact: boolean,
) {
  const bodyW = 2 * BODY_HALF * pxPerM;
  const bodyH = compact ? 18 : 26;
  const wheelR = compact ? 4.5 : 6;
  const top = railY - wheelR * 2 - bodyH;
  contactShadow(ctx, cx, railY + 3, bodyW * 0.42, 2);
  material(ctx, cx - bodyW / 2, top, bodyW, bodyH, color, 5);
  sphere(ctx, cx - bodyW * 0.28, railY - wheelR, wheelR, theme.inkSoft);
  sphere(ctx, cx + bodyW * 0.28, railY - wheelR, wheelR, theme.inkSoft);
  if (!compact) {
    caption(ctx, cx, top + bodyH / 2, label, theme, {
      align: "center", size: 13, weight: 800, color: theme.surface,
    });
  }
  return { top, bodyH, bodyW };
}

/** A bumper drawn as a concertina that really squashes. */
function drawBumper(
  ctx: CanvasRenderingContext2D, xInner: number, dir: 1 | -1, depth: number,
  y: number, h: number, load: number, theme: ThemeColors,
) {
  const cForce = theme.sci["force"];
  const tint = mixHex(theme.inkSoft, cForce, Math.min(1, load));
  const w = Math.max(1.5, depth);
  ctx.save();
  ctx.fillStyle = hexA(tint, 0.9);
  roundRect(ctx, dir > 0 ? xInner : xInner - w, y, w, h, 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.ink, 0.25);
  ctx.lineWidth = 1;
  const folds = 3;
  ctx.beginPath();
  for (let i = 1; i < folds; i++) {
    const fx = (dir > 0 ? xInner : xInner - w) + (w * i) / folds;
    ctx.moveTo(fx, y + 2);
    ctx.lineTo(fx, y + h - 2);
  }
  ctx.stroke();
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const mA = params.massA as number;
  const mB = params.massB as number;
  const k = params.stiffness as number;
  const e = params.elasticity as number;

  const compact = width < 460 || height < 300;
  const cMom = theme.sci["momentum"];
  const cForce = theme.sci["force"];
  const cKE = theme.sci["energy-kinetic"];
  const cHeat = theme.sci["energy-thermal"];
  const cTotal = theme.sci["energy-total"];
  const cMass = theme.sci["mass"];
  const cVel = theme.sci["velocity"];

  const wantMomentum = overlays.momentum !== false && band !== "3-5";
  const wantEnergy = overlays.energy !== false;
  const wantForce = overlays.forceGraph !== false;
  const panels = [wantMomentum, wantEnergy, wantForce].filter(Boolean).length;

  const trackH = panels > 0 ? Math.max(110, Math.min(height * 0.54, 300)) : height;
  const railY = trackH * 0.68;

  /* ---- the bench ---- */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, trackH);
  ctx.clip();
  sky(ctx, width, trackH, theme, "indoor", railY);
  groundPlane(ctx, railY + 12, 0, width, trackH, theme, "lab");
  ctx.restore();

  const padSide = compact ? 20 : 34;
  const x0s = padSide, x1s = width - padSide;
  const pxPerM = (x1s - x0s) / TRACK_LENGTH;
  const X = (m: number) => x0s + m * pxPerM;

  material(ctx, x0s, railY + 1, x1s - x0s, 7, theme.inkSoft, 2);
  material(ctx, x0s - 10, railY - 34, 10, 42, theme.inkSoft, 2);
  material(ctx, x1s, railY - 34, 10, 42, theme.inkSoft, 2);

  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let m = 0; m <= TRACK_LENGTH; m += 1) {
    const sx = Math.round(X(m)) + 0.5;
    ctx.moveTo(sx, railY + 9);
    ctx.lineTo(sx, railY + (m % 2 === 0 ? 16 : 12));
  }
  ctx.stroke();
  ctx.restore();

  /* ---- trails, so speed is visible even in a still frame ---- */
  if (overlays.trails !== false) {
    comet(ctx, state.trailA.map((x) => ({ x: X(x), y: railY - 3 })), cVel, 2.5);
    comet(ctx, state.trailB.map((x) => ({ x: X(x), y: railY - 3 })), cVel, 2.5);
  }

  /* ---- the carts, sized by their mass so mass is visible ---- */
  const aX = X(state.xA), bX = X(state.xB);
  const geoA = drawCart(ctx, aX, railY, pxPerM, cMass, theme, "A", compact);
  const geoB = drawCart(ctx, bX, railY, pxPerM, theme.accent, theme, "B", compact);

  // Bumpers: the near faces compress by half the total squash each.
  const half = (state.squash / 2) * pxPerM;
  const load = state.peakForce > 0 ? state.force / state.peakForce : 0;
  drawBumper(ctx, aX + (BODY_HALF * pxPerM), 1, BUMPER_DEPTH * pxPerM - half,
    geoA.top + 4, geoA.bodyH - 8, load, theme);
  drawBumper(ctx, bX - (BODY_HALF * pxPerM), -1, BUMPER_DEPTH * pxPerM - half,
    geoB.top + 4, geoB.bodyH - 8, load, theme);
  // Back bumpers, so both carts read as the same object.
  drawBumper(ctx, aX - (BODY_HALF * pxPerM), -1, BUMPER_DEPTH * pxPerM,
    geoA.top + 4, geoA.bodyH - 8, 0, theme);
  drawBumper(ctx, bX + (BODY_HALF * pxPerM), 1, BUMPER_DEPTH * pxPerM,
    geoB.top + 4, geoB.bodyH - 8, 0, theme);

  /* ---- Newton's Third Law: one force, two bodies, opposite directions ---- */
  if (state.ab.active && overlays.thirdLaw !== false) {
    const len = Math.min(70, 16 + (state.force / Math.max(1, state.peakForce)) * 54);
    const ay = geoA.top - 14;
    const by = geoB.top - 14;
    arrow(ctx, aX, ay, aX - len, ay, cForce, { width: 3.2 });
    arrow(ctx, bX, by, bX + len, by, cForce, { width: 3.2 });
    if (!compact) {
      caption(ctx, aX - len - 4, ay - 12, "B pushes A", theme, {
        align: "right", size: 11, color: cForce,
      });
      caption(ctx, bX + len + 4, by - 12, "A pushes B", theme, {
        size: 11, color: cForce,
      });
      badge(ctx, (aX + bX) / 2, geoA.top - 40, `${state.force.toFixed(0)} N each`, theme, {
        align: "center", color: cForce, sub: "equal and opposite",
      });
    }
  } else if (state.collisions > 0 && !compact && band !== "3-5") {
    badge(ctx, (aX + bX) / 2, Math.min(geoA.top, geoB.top) - 30,
      `peak ${state.peakForce.toFixed(0)} N`, theme,
      { align: "center", color: cForce, sub: `${(state.contactTime * 1000).toFixed(0)} ms of contact` });
  }

  /* ---- velocity arrows and live numbers ---- */
  if (overlays.vectors !== false) {
    const s = Math.min(30, 60 / Math.max(1, Math.max(Math.abs(state.vA), Math.abs(state.vB))));
    if (Math.abs(state.vA) > 0.02) {
      arrow(ctx, aX, railY - 6, aX + state.vA * s, railY - 6, cVel, { width: 2.4 });
    }
    if (Math.abs(state.vB) > 0.02) {
      arrow(ctx, bX, railY - 6, bX + state.vB * s, railY - 6, cVel, { width: 2.4 });
    }
  }
  if (!compact) {
    badge(ctx, aX, geoA.top - (state.ab.active ? 62 : 22), `${state.vA.toFixed(2)} m/s`, theme, {
      align: "center", color: cVel, sub: `${mA.toFixed(1)} kg`,
    });
    badge(ctx, bX, geoB.top - (state.ab.active ? 62 : 22), `${state.vB.toFixed(2)} m/s`, theme, {
      align: "center", color: cVel, sub: `${mB.toFixed(1)} kg`,
    });
  }
  if (state.maxCompression > CRUMPLE_DEPTH && !compact) {
    caption(ctx, width / 2, 18, "cabin hit — the crumple zone bottomed out", theme, {
      align: "center", size: 12, color: theme.sci["acceleration"], weight: 700,
    });
  } else if (!compact) {
    caption(ctx, 10, 16,
      e >= 0.99 ? "perfectly elastic bumper" : e <= 0.02 ? "the carts crumple and stay together"
        : `bumper returns ${Math.round(e * e * 100)}% of the energy`,
      theme, { size: 11, color: theme.inkSoft });
  }

  vignette(ctx, width, trackH, 0.12);

  if (panels === 0) return;

  /* ---- the panels ---- */
  const top = trackH + (compact ? 4 : 8);
  const gap = compact ? 6 : 12;
  const panelH = Math.max(48, height - top - (compact ? 4 : 10));
  const panelW = (width - padSide * 2 - gap * (panels - 1)) / panels;
  let px = padSide;

  const keA = 0.5 * mA * state.vA * state.vA;
  const keB = 0.5 * mB * state.vB * state.vB;
  const stored = storedEnergy(state, k);
  const heat = Math.max(0, state.ke0 - keA - keB - stored);

  if (wantMomentum) {
    card(ctx, px, top, panelW, panelH, "momentum  (kg·m/s)", theme, compact);
    const pA = mA * state.vA, pB = mB * state.vB;
    const pBefore = mA * state.before.vA + mB * state.before.vB;
    const peak = Math.max(1e-6, Math.abs(pA) + Math.abs(pB), Math.abs(pBefore) * 1.4);
    const midX = px + panelW / 2;
    const scale = (panelW * 0.4) / peak;
    const rowH = Math.max(8, Math.min(16, (panelH - (compact ? 16 : 34)) / 3));
    const y0 = top + (compact ? 10 : 24);

    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, y0 - 2);
    ctx.lineTo(midX, y0 + rowH * 3 + 10);
    ctx.stroke();
    ctx.restore();

    const rows: [string, number, number][] = [
      ["before", mA * state.before.vA, mB * state.before.vB],
      ["now", pA, pB],
      ["after", mA * state.after.vA, mB * state.after.vB],
    ];
    rows.forEach(([name, a, b], i) => {
      const y = y0 + i * (rowH + 4);
      signedBar(ctx, midX, y, rowH, a, scale, hexA(cMass, 0.9));
      signedBar(ctx, midX + a * scale, y, rowH, b, scale, hexA(theme.accent, 0.9));
      // The tick that must not move: the total.
      const tx = midX + (a + b) * scale;
      ctx.save();
      ctx.strokeStyle = cMom;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, y - 3);
      ctx.lineTo(tx, y + rowH + 3);
      ctx.stroke();
      ctx.restore();
      if (!compact) {
        caption(ctx, px + 6, y + rowH / 2, name, theme, { size: 9, color: theme.inkSoft });
      }
    });
    if (!compact) {
      caption(ctx, px + panelW / 2, top + panelH - 9,
        `total stays ${(mA * state.vA + mB * state.vB).toFixed(2)}`, theme,
        { align: "center", size: 10, color: cMom });
    }
    px += panelW + gap;
  }

  if (wantEnergy) {
    card(ctx, px, top, panelW, panelH, "energy  (J)", theme, compact);
    const barY = top + (compact ? 10 : 26);
    const barH = Math.max(10, Math.min(20, panelH * 0.22));
    energyBars(ctx, px + 8, barY, panelW - 16, barH, [
      { label: "A", value: keA, color: cKE },
      { label: "B", value: keB, color: theme.accent },
      { label: "bumper", value: stored, color: theme.sci["energy-potential"] },
      { label: "heat", value: heat, color: cHeat },
    ], theme);
    if (!compact) {
      const legend: [string, string, number][] = [
        ["cart A", cKE, keA],
        ["cart B", theme.accent, keB],
        ["bumper", theme.sci["energy-potential"], stored],
        ["heat", cHeat, heat],
      ];
      let ly = barY + barH + 12;
      for (const [name, color, value] of legend) {
        if (ly > top + panelH - 18) break;
        caption(ctx, px + 10, ly, `${name}  ${value.toFixed(2)} J`, theme, { size: 10, color });
        ly += 13;
      }
      caption(ctx, px + panelW - 8, top + panelH - 9,
        `total ${(keA + keB + stored + heat).toFixed(2)} J`, theme,
        { align: "right", size: 10, color: cTotal });
    }
    px += panelW + gap;
  }

  if (wantForce) {
    card(ctx, px, top, panelW, panelH, "force during contact", theme, compact);
    const gx = px + (compact ? 8 : 24);
    const gy = top + (compact ? 10 : 22);
    const gw = panelW - (compact ? 14 : 32);
    const gh = panelH - (compact ? 18 : 40);
    const allF = Math.max(state.peakForce, 1, ...state.ghost.map((p) => p.f));
    const allT = Math.max(
      state.contactTime, 0.02,
      state.ghost.length ? state.ghost[state.ghost.length - 1].t : 0,
    );
    const GX = (tt: number) => gx + (tt / allT) * gw;
    const GY = (f: number) => gy + gh - (f / allF) * gh;

    ctx.save();
    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();
    ctx.restore();

    if (state.ghost.length > 1) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(GX(state.ghost[0].t), GY(state.ghost[0].f));
      for (const p of state.ghost) ctx.lineTo(GX(p.t), GY(p.f));
      ctx.stroke();
      ctx.restore();
    }

    if (state.trace.length > 1) {
      // The area under this curve is the impulse — so it is drawn as an area.
      ctx.save();
      ctx.fillStyle = hexA(cForce, 0.2);
      ctx.beginPath();
      ctx.moveTo(GX(state.trace[0].t), GY(0));
      for (const p of state.trace) ctx.lineTo(GX(p.t), GY(p.f));
      ctx.lineTo(GX(state.trace[state.trace.length - 1].t), GY(0));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = cForce;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(GX(state.trace[0].t), GY(state.trace[0].f));
      for (const p of state.trace) ctx.lineTo(GX(p.t), GY(p.f));
      ctx.stroke();
      ctx.restore();
    }

    if (state.peakForce > 0 && !compact) {
      const py = GY(state.peakForce);
      ctx.save();
      ctx.strokeStyle = hexA(cForce, 0.5);
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, py);
      ctx.lineTo(gx + gw, py);
      ctx.stroke();
      ctx.restore();
      caption(ctx, gx + 4, py - 8, `peak ${state.peakForce.toFixed(0)} N`, theme, {
        size: 10, color: cForce,
      });
      caption(ctx, gx + gw, gy + gh + 11, `${(state.contactTime * 1000).toFixed(0)} ms`, theme, {
        align: "right", size: 10, color: theme.inkSoft,
      });
      caption(ctx, gx + 4, gy + gh - 10, `impulse ${state.impulse.toFixed(2)} N·s`, theme, {
        size: 10, color: cMom,
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const collisionsSim: SimManifest<State> = {
  id: "phys.collisions",
  title: "Collisions and Crumple Zones",
  tagline: "Crash two carts together, watch the forces they put on each other, and design a bumper that survives it.",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11],
  standards: {
    ngss: ["MS-PS2-1", "MS-PS3-2", "MS-ETS1-2", "MS-ETS1-4", "HS-PS2-2", "HS-PS2-3"],
  },
  learningGoals: [
    "Show that the two carts push on each other with equal and opposite forces at every instant.",
    "Explain why the same force produces different accelerations on carts of different mass.",
    "Predict velocities after a collision using conservation of momentum.",
    "Tell an elastic collision from an inelastic one by what happens to the kinetic energy.",
    "Design a bumper that lowers the peak force by stretching the collision out in time.",
  ],
  misconceptions: [
    "The heavier cart pushes harder than the lighter one",
    "The cart that was moving pushes, and the stationary one just gets pushed",
    "Momentum is only conserved when nothing is lost to heat",
    "Kinetic energy is conserved in every collision",
    "A bouncier bumper is a safer bumper",
  ],
  interactionHint: "Set the masses and speeds, choose how bouncy the bumper is, then press play.",
  params: {
    massA: {
      type: "number", label: "Cart A mass", kind: "mass", unit: "kg",
      min: 0.2, max: 5, step: 0.1, default: 1,
    },
    speedA: {
      type: "number", label: "Cart A speed", kind: "velocity", unit: "m/s",
      min: -4, max: 4, step: 0.1, default: 2,
    },
    massB: {
      type: "number", label: "Cart B mass", kind: "mass", unit: "kg",
      min: 0.2, max: 5, step: 0.1, default: 1,
      help: "Make B much heavier than A and watch which one changes speed most.",
    },
    speedB: {
      type: "number", label: "Cart B speed", kind: "velocity", unit: "m/s",
      min: -4, max: 4, step: 0.1, default: 0,
    },
    elasticity: {
      type: "number", label: "Bumper bounciness", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 1,
      marks: [
        { value: 0, label: "sticks" },
        { value: 0.5, label: "half" },
        { value: 1, label: "perfect bounce" },
      ],
      help: "The fraction of the closing speed the carts separate with. 1 keeps all the kinetic energy.",
    },
    stiffness: {
      type: "number", label: "Bumper stiffness (N/m)", kind: "ratio",
      min: 20, max: 2000, step: 10, default: 200,
      marks: [
        { value: 40, label: "foam" },
        { value: 200, label: "rubber" },
        { value: 900, label: "steel spring" },
      ],
      help: "Newtons of push per metre of squash. Softer bumpers crush further but push less hard.",
    },
  },
  overlays: [
    { key: "thirdLaw", label: "Action-reaction forces", default: true },
    { key: "momentum", label: "Momentum ledger", default: true },
    { key: "energy", label: "Energy bars", default: true },
    { key: "forceGraph", label: "Force during contact", default: true },
    { key: "vectors", label: "Velocity arrows", default: true },
    { key: "trails", label: "Motion trails", default: true },
  ],
  labs: [
    {
      id: "third-law",
      title: "Who pushes harder?",
      question: "When a light cart hits a heavy one, which cart feels the bigger force?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-1"],
      setup: { massA: 0.5, speedA: 3, massB: 4, speedB: 0, elasticity: 1, stiffness: 200 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Say it before you see it",
          instruction: "A 0.5 kg cart runs into a stationary 4 kg cart.",
          predict: {
            prompt: "During the crash, how do the two forces compare?",
            options: [
              "The light cart feels a bigger force",
              "The heavy cart feels a bigger force",
              "Both feel exactly the same size of force",
              "Only the moving cart exerts a force",
            ],
            correct: 2,
            reveal: "The forces are always the same size and opposite in direction — that is Newton's Third Law. What differs is the effect: the same force changes a small mass's velocity far more, because a = F/m.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Run it and read the arrows",
          instruction: "Play the crash slowly and record the data during and after contact.",
          requireData: 2,
          hints: [
            "Use the slow-motion control — contact only lasts a fraction of a second.",
            "The two red arrows are drawn on different carts. Compare their lengths.",
          ],
        },
        {
          id: "swap",
          phase: "setup",
          title: "Now make the heavy cart the one that moves",
          instruction: "Set cart B moving toward A instead, keeping the masses.",
          check: {
            describe: "Cart B is moving left and cart A is not moving right",
            test: (v) => (v.params.speedB as number) < -0.2 && (v.params.speedA as number) <= 0,
          },
          hints: ["Negative speed means moving to the left."],
        },
        {
          id: "accel",
          phase: "analyze",
          title: "Same force, different result",
          instruction: "Compare how much each cart's velocity changed. Which changed more, and why?",
          write: {
            prompt: "The forces were equal. Why did the velocities not change equally?",
            placeholder: "The same force acting on a smaller mass gives ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the law",
          instruction: "Write Newton's Third Law in your own words, naming both objects.",
          write: {
            prompt: "Complete: when A pushes B, ...",
            placeholder: "When A pushes B with a force, B ...",
          },
        },
      ],
    },
    {
      id: "elastic-or-not",
      title: "What survives a crash?",
      question: "Which is always conserved in a collision — momentum, kinetic energy, or both?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-PS3-2"],
      setup: { massA: 1, speedA: 3, massB: 2, speedB: -1, elasticity: 1, stiffness: 200 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict what survives",
          instruction: "You will run the same crash bouncy, then sticky.",
          predict: {
            prompt: "When the carts stick together instead of bouncing, what happens?",
            options: [
              "Both momentum and kinetic energy are still the same",
              "Momentum is the same, kinetic energy drops",
              "Kinetic energy is the same, momentum drops",
              "Both drop",
            ],
            correct: 1,
            reveal: "Momentum survives every collision because the two forces are equal and opposite, so whatever one cart gains the other loses. Kinetic energy only survives if the bumper gives back everything it stored.",
          },
        },
        {
          id: "elastic",
          phase: "measure",
          title: "Run it perfectly bouncy",
          instruction: "With bounciness at 1, run the crash and record before and after.",
          requireData: 2,
          check: {
            describe: "A fully elastic collision has finished",
            test: (v) => Boolean(v.facts.collided) && (v.params.elasticity as number) >= 0.99,
          },
        },
        {
          id: "inelastic",
          phase: "measure",
          title: "Now make them stick",
          instruction: "Set bounciness to 0, run the same crash and record it again.",
          requireData: 4,
          check: {
            describe: "A sticking collision has finished",
            test: (v) => Boolean(v.facts.collided) && (v.params.elasticity as number) <= 0.05,
          },
          hints: ["Watch the heat bar: the energy is not gone, it moved."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare your two runs",
          instruction: "Look at total momentum and total kinetic energy in both runs.",
          write: {
            prompt: "Which quantity was the same before and after in both runs, and which was not?",
            placeholder: "In both runs the total momentum ... but the kinetic energy ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Where did the energy go?",
          instruction: "Energy is never destroyed. Say what it became.",
          write: {
            prompt: "In the sticky crash, the kinetic energy that disappeared became what?",
            placeholder: "It went into ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "safe-bumper",
      title: "Design a safe bumper",
      brief: "Two 2 kg carts meet at 4 m/s. Keep the peak force under 110 N without crushing more than 25 cm.",
      bands: ["6-8", "9-12"],
      setup: { massA: 2, speedA: 4, massB: 2, speedB: 0, elasticity: 0.3, stiffness: 200 },
      goal: {
        describe: "Peak force under 110 N and crush under 25 cm at the test speed",
        test: (v) => Boolean(v.facts.collided)
          && (v.params.massA as number) >= 2 && (v.params.massB as number) >= 2
          && (v.params.speedA as number) >= 4
          && (v.facts.peakForce as number) <= 110
          && (v.facts.maxCompression as number) <= 0.25,
      },
      stars: {
        two: {
          describe: "Peak force under 90 N",
          test: (v) => Boolean(v.facts.collided)
            && (v.params.massA as number) >= 2 && (v.params.massB as number) >= 2
            && (v.params.speedA as number) >= 4
            && (v.facts.peakForce as number) <= 90
            && (v.facts.maxCompression as number) <= 0.25,
        },
        three: {
          describe: "Peak force under 75 N",
          test: (v) => Boolean(v.facts.collided)
            && (v.params.massA as number) >= 2 && (v.params.massB as number) >= 2
            && (v.params.speedA as number) >= 4
            && (v.facts.peakForce as number) <= 75
            && (v.facts.maxCompression as number) <= 0.25,
        },
      },
      hints: [
        "A softer bumper spreads the same impulse over more time, so the peak force drops.",
        "Go too soft and the crush runs past 25 cm — the cabin gets hit. There is a window.",
        "Peak force is the closing speed times the square root of stiffness times reduced mass.",
      ],
    },
    {
      id: "dead-stop",
      title: "Bring it to a dead stop",
      brief: "Leave cart A motionless after the crash, without stopping cart B too.",
      bands: ["6-8", "9-12"],
      setup: { massA: 1, speedA: 2, massB: 3, speedB: 0, elasticity: 1, stiffness: 200 },
      goal: {
        describe: "Cart A is at rest after the collision while cart B moves",
        test: (v) => Boolean(v.facts.collided)
          && Math.abs(v.facts.afterA as number) < 0.06
          && Math.abs(v.facts.afterB as number) > 0.4,
      },
      stars: {
        two: {
          describe: "Cart A stopped to within 0.02 m/s",
          test: (v) => Boolean(v.facts.collided)
            && Math.abs(v.facts.afterA as number) < 0.02
            && Math.abs(v.facts.afterB as number) > 0.4,
        },
      },
      hints: [
        "A perfectly elastic collision between equal masses swaps the velocities exactly.",
        "Try bounciness 1 with both masses the same and cart B at rest.",
      ],
    },
  ],
  model,
  render,
};
