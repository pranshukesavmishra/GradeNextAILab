import type { ParamValues, RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, comet, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere,
  vignette,
} from "@ui/scene";

/**
 * Kinetic Energy — Grade 8, Unit B topic B1.
 *
 * Two crash-test carts, each with its own mass and speed, run into identical
 * crush barriers. Everything on screen is driven by one equation:
 *
 *     KE = ½ m v²
 *
 * and one consequence of it. The barrier resists with a steady force F, so the
 * work-energy theorem F·d = ½mv² fixes how far each cart ploughs in:
 *
 *     d = ½ m v² / F
 *
 * The stopping distance is therefore *directly proportional to the kinetic
 * energy*, which turns an abstract number into visible damage. Double the mass
 * and the cart digs twice as deep. Double the speed and it digs four times as
 * deep — that asymmetry (B1.3) is the point of the whole sim, and it is why
 * speed limits are about speed and not about how heavy your car is.
 */

/* ------------------------------------------------------------------ *
 * Closed-form physics
 * ------------------------------------------------------------------ */

/** Kinetic energy of a mass m moving at speed v, in joules. */
export function kineticEnergy(mass: number, speed: number): number {
  return 0.5 * mass * speed * speed;
}

/**
 * How far a cart ploughs into a barrier that resists with a steady force.
 * Straight from the work-energy theorem: all of the kinetic energy has to be
 * spent as force × distance before the cart can stop.
 */
export function stoppingDistance(mass: number, speed: number, force: number): number {
  return force > 0 ? kineticEnergy(mass, speed) / force : Infinity;
}

/** Where the lane ends and the crushable barrier begins, metres. */
export const BARRIER_X = 8;
/** Half the length of a cart, metres. */
const CART_HALF = 0.35;
/** How deep the drawn barrier is before it is completely destroyed. */
export const BARRIER_DEPTH = 1.5;
/** Seconds both carts sit in the wreckage before the run repeats. */
const HOLD_SECONDS = 2.5;

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface Racer {
  /** Centre of the cart, metres from the start line. */
  x: number;
  v: number;
  /** True once the cart has touched the barrier. */
  crushing: boolean;
  stopped: boolean;
  /** How far into the barrier this cart got, metres. */
  crush: number;
  /** The completed result of the last run, kept while the next one runs. */
  lastCrush: number;
  trail: number[];
}

interface State {
  t: number;
  a: Racer;
  b: Racer;
  /** Seconds since both carts stopped. Drives the automatic replay. */
  hold: number;
  runs: number;
}

const TRAIL = 34;

function freshRacer(speed: number, lastCrush: number): Racer {
  return {
    x: CART_HALF, v: speed, crushing: false, stopped: false,
    crush: 0, lastCrush, trail: [CART_HALF],
  };
}

function freshState(params: ParamValues, keepA = 0, keepB = 0, runs = 0): State {
  return {
    t: 0,
    a: freshRacer(params.speedA as number, keepA),
    b: freshRacer(params.speedB as number, keepB),
    hold: 0,
    runs,
  };
}

/** Advance one cart by dt, handling the moment it first touches the barrier. */
function stepRacer(r: Racer, dt: number, mass: number, force: number): Racer {
  if (r.stopped) return r;
  let { x, v, crushing, crush } = r;
  let remaining = dt;

  if (!crushing) {
    const gap = BARRIER_X - (x + CART_HALF);
    const tToBarrier = v > 0 ? gap / v : Infinity;
    if (tToBarrier > remaining) {
      x += v * remaining;
      remaining = 0;
    } else {
      // Land exactly on the barrier face, then start crushing with what is left.
      x += v * Math.max(0, tToBarrier);
      remaining -= Math.max(0, tToBarrier);
      crushing = true;
    }
  }

  let stopped = false;
  if (crushing && remaining > 0) {
    const a = force / mass;
    if (v <= a * remaining) {
      // Exact final slice: the remaining distance is v²/(2a) = ½mv²/F.
      x += (v * v) / (2 * a);
      v = 0;
      stopped = true;
    } else {
      const v1 = v - a * remaining;
      x += ((v + v1) / 2) * remaining;
      v = v1;
    }
    crush = Math.max(0, x + CART_HALF - BARRIER_X);
  }

  const trail = r.trail.length >= TRAIL ? r.trail.slice(1).concat(x) : r.trail.concat(x);
  return { ...r, x, v, crushing, stopped, crush, trail };
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    const keys = ["massA", "speedA", "massB", "speedB", "barrierForce"];
    if (keys.some((k) => params[k] !== prev[k])) {
      return freshState(params, state.a.lastCrush, state.b.lastCrush, state.runs);
    }
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const force = params.barrierForce as number;
    const a = stepRacer(state.a, dt, params.massA as number, force);
    const b = stepRacer(state.b, dt, params.massB as number, force);

    if (a.stopped && b.stopped) {
      const hold = state.hold + dt;
      if (hold >= HOLD_SECONDS) {
        // Run it again, so the stage is never a still photograph.
        return freshState(params, a.crush, b.crush, state.runs + 1);
      }
      return {
        ...state, t: state.t + dt, hold,
        a: { ...a, lastCrush: a.crush }, b: { ...b, lastCrush: b.crush },
      };
    }
    return { ...state, t: state.t + dt, a, b, hold: 0 };
  },

  readouts(state, params) {
    const mA = params.massA as number, vA = params.speedA as number;
    const mB = params.massB as number, vB = params.speedB as number;
    const keA = kineticEnergy(mA, vA);
    const keB = kineticEnergy(mB, vB);
    const force = params.barrierForce as number;
    return [
      { key: "keA", label: "Cart A kinetic energy", quantity: q(keA, "energy"), unit: "J", semantic: "energy-kinetic", graphable: true },
      { key: "keB", label: "Cart B kinetic energy", quantity: q(keB, "energy"), unit: "J", semantic: "energy-kinetic", graphable: true },
      { key: "keRatio", label: "B's energy ÷ A's energy", quantity: q(keA > 0 ? keB / keA : 0, "ratio"), semantic: "energy-kinetic", graphable: true, bands: ["6-8", "9-12"] },
      { key: "vNow", label: "Cart A speed now", quantity: q(state.a.v, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "vNowB", label: "Cart B speed now", quantity: q(state.b.v, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "crushA", label: "Cart A damage depth", quantity: q(Math.max(state.a.crush, state.a.lastCrush), "length"), unit: "cm", semantic: "distance", graphable: true },
      { key: "crushB", label: "Cart B damage depth", quantity: q(Math.max(state.b.crush, state.b.lastCrush), "length"), unit: "cm", semantic: "distance", graphable: true },
      {
        key: "predictedA", label: "Predicted stopping distance A",
        quantity: q(stoppingDistance(mA, vA, force), "length"), unit: "cm",
        semantic: "distance", graphable: false, bands: ["9-12"],
      },
      {
        key: "workA", label: "Work the barrier does on A",
        quantity: q(force * Math.max(state.a.crush, state.a.lastCrush), "energy"), unit: "J",
        semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const mA = params.massA as number, vA = params.speedA as number;
    const mB = params.massB as number, vB = params.speedB as number;
    const force = params.barrierForce as number;
    const keA = kineticEnergy(mA, vA);
    const keB = kineticEnergy(mB, vB);
    const crushA = Math.max(state.a.crush, state.a.lastCrush);
    const crushB = Math.max(state.b.crush, state.b.lastCrush);
    return {
      keA, keB,
      keRatio: keA > 0 ? keB / keA : 0,
      massRatio: mA > 0 ? mB / mA : 0,
      speedRatio: vA > 0 ? vB / vA : 0,
      crushA, crushB,
      crushRatio: crushA > 0 ? crushB / crushA : 0,
      predictedA: stoppingDistance(mA, vA, force),
      predictedB: stoppingDistance(mB, vB, force),
      workA: force * crushA,
      finished: state.a.stopped && state.b.stopped,
      runs: state.runs,
      barrierDestroyed: crushA > BARRIER_DEPTH || crushB > BARRIER_DEPTH,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

interface Plot {
  x: number; y: number; w: number; h: number;
  X: (v: number) => number;
  Y: (v: number) => number;
  xMax: number; yMax: number;
}

function makePlot(
  x: number, y: number, w: number, h: number, xMax: number, yMax: number,
): Plot {
  return {
    x, y, w, h, xMax, yMax,
    X: (v) => x + (v / Math.max(1e-6, xMax)) * w,
    Y: (v) => y + h - (v / Math.max(1e-6, yMax)) * h,
  };
}

function plotChrome(
  ctx: CanvasRenderingContext2D, p: Plot, theme: ThemeColors,
  title: string, xName: string, compact: boolean,
) {
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? hexA(theme.surface, 0.6) : hexA(theme.surface, 0.82);
  roundRect(ctx, p.x - 10, p.y - 20, p.w + 22, p.h + 40, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y + p.h);
  ctx.lineTo(p.x + p.w, p.y + p.h);
  ctx.stroke();
  ctx.restore();
  if (!compact) {
    caption(ctx, p.x - 6, p.y - 9, title, theme, { size: 11, weight: 700 });
    caption(ctx, p.x + p.w, p.y + p.h + 12, xName, theme, {
      size: 10, align: "right", color: theme.inkSoft,
    });
  }
}

/** Draw one cart, its barrier, its damage and its numbers. */
function drawLane(
  ctx: CanvasRenderingContext2D, r: Racer, mass: number, speed: number,
  laneY: number, X: (m: number) => number, pxPerM: number, barrierDepth: number,
  color: string, name: string, theme: ThemeColors, compact: boolean, showNumbers: boolean,
) {
  const cKE = theme.sci["energy-kinetic"];
  const cVel = theme.sci["velocity"];
  const ke = kineticEnergy(mass, speed);

  // The barrier: a stack of crushable blocks that really get flattened.
  const crush = Math.max(r.crush, 0);
  const blocks = 6;
  const blockW = (barrierDepth * pxPerM) / blocks;
  const bodyH = compact ? 16 : 22 + Math.min(14, mass * 2.2);
  for (let i = 0; i < blocks; i++) {
    const nominal = X(BARRIER_X) + i * blockW;
    const crushed = Math.min(1, Math.max(0, (crush * pxPerM - i * blockW) / blockW));
    const w = blockW * (1 - crushed * 0.82);
    const shift = crush * pxPerM * (1 - i / blocks) * 0.18;
    material(ctx, nominal + shift, laneY - bodyH - 6, Math.max(1.2, w - 1.5), bodyH + 6,
      mixHex(theme.inkSoft, theme.sci["force"], crushed * 0.75), 2);
  }

  // The cart itself.
  const cartW = 2 * CART_HALF * pxPerM;
  const wheelR = compact ? 4 : 5.5;
  const cx = X(Math.min(r.x, BARRIER_X + barrierDepth));
  const cartTop = laneY - wheelR * 2 - bodyH * 0.8;
  contactShadow(ctx, cx, laneY + 2, cartW * 0.42, 2);
  material(ctx, cx - cartW / 2, cartTop, cartW, bodyH * 0.8, color, 4);
  sphere(ctx, cx - cartW * 0.28, laneY - wheelR, wheelR, theme.inkSoft);
  sphere(ctx, cx + cartW * 0.28, laneY - wheelR, wheelR, theme.inkSoft);
  if (!compact) {
    caption(ctx, cx, cartTop + bodyH * 0.4, name, theme, {
      align: "center", size: 12, weight: 800, color: theme.surface,
    });
  }

  if (r.trail.length > 2) {
    comet(ctx, r.trail.map((x) => ({ x: X(x), y: laneY - 2 })), cVel, 2.4);
  }
  if (!r.crushing && Math.abs(r.v) > 0.05) {
    const s = Math.min(9, 60 / Math.max(2, r.v));
    arrow(ctx, cx, cartTop - 8, cx + r.v * s, cartTop - 8, cVel, { width: 2.2 });
  }

  if (showNumbers) {
    badge(ctx, X(0.2), cartTop - (compact ? 4 : 12), `${ke.toFixed(0)} J`, theme, {
      color: cKE, sub: compact ? undefined : `${mass.toFixed(1)} kg at ${speed.toFixed(1)} m/s`,
    });
  }
  // The damage: a measured bar drawn on the wreckage.
  const done = Math.max(r.crush, r.lastCrush);
  if (done > 0.001 && !compact) {
    const x0 = X(BARRIER_X), x1 = X(BARRIER_X + done);
    ctx.save();
    ctx.strokeStyle = theme.sci["distance"];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, laneY + 8);
    ctx.lineTo(x1, laneY + 8);
    ctx.moveTo(x0, laneY + 4);
    ctx.lineTo(x0, laneY + 12);
    ctx.moveTo(x1, laneY + 4);
    ctx.lineTo(x1, laneY + 12);
    ctx.stroke();
    ctx.restore();
    caption(ctx, (x0 + x1) / 2, laneY + 22, `${(done * 100).toFixed(0)} cm`, theme, {
      align: "center", size: 10, color: theme.sci["distance"],
    });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const mA = params.massA as number, vA = params.speedA as number;
  const mB = params.massB as number, vB = params.speedB as number;
  const force = params.barrierForce as number;
  const keA = kineticEnergy(mA, vA);
  const keB = kineticEnergy(mB, vB);

  const compact = width < 460 || height < 300;
  const cKE = theme.sci["energy-kinetic"];
  const cMass = theme.sci["mass"];
  const cVel = theme.sci["velocity"];

  const showCurves = overlays.curves !== false && band !== "3-5";
  const trackH = showCurves ? Math.max(120, Math.min(height * 0.56, 320)) : height;

  /* ---- the crash hall ---- */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, trackH);
  ctx.clip();
  sky(ctx, width, trackH, theme, "indoor", trackH);
  ctx.restore();

  const padSide = compact ? 16 : 30;
  // Frame the lane around the crash that is actually going to happen, so a
  // deep plough and a shallow one both fill the stage.
  const deepest = Math.max(
    stoppingDistance(mA, vA, force), stoppingDistance(mB, vB, force), BARRIER_DEPTH,
  );
  const barrierDepth = Math.min(12, deepest * 1.12);
  const laneSpan = BARRIER_X + barrierDepth + 0.5;
  const x0s = padSide;
  const pxPerM = (width - padSide * 2) / laneSpan;
  const X = (m: number) => x0s + m * pxPerM;

  const laneA = trackH * (compact ? 0.44 : 0.42);
  const laneB = trackH * (compact ? 0.9 : 0.88);
  groundPlane(ctx, laneA, 0, width, laneA + 8, theme, "lab");
  groundPlane(ctx, laneB, 0, width, trackH, theme, "lab");

  drawLane(ctx, state.a, mA, vA, laneA, X, pxPerM, barrierDepth, cMass, "A", theme, compact, !compact);
  drawLane(ctx, state.b, mB, vB, laneB, X, pxPerM, barrierDepth, theme.accent, "B", theme, compact, !compact);

  /* ---- the comparison, said out loud ---- */
  if (overlays.compare !== false && !compact && band !== "3-5") {
    const sameMass = Math.abs(mA - mB) < 1e-6;
    const sameSpeed = Math.abs(vA - vB) < 1e-6;
    const ratio = keA > 0 ? keB / keA : 0;
    let line: string;
    if (sameMass && !sameSpeed) {
      line = `same mass · ${(vB / vA).toFixed(1)}× the speed · ${ratio.toFixed(1)}× the energy`;
    } else if (sameSpeed && !sameMass) {
      line = `same speed · ${(mB / mA).toFixed(1)}× the mass · ${ratio.toFixed(1)}× the energy`;
    } else {
      line = `cart B carries ${ratio.toFixed(2)}× cart A's energy`;
    }
    caption(ctx, width / 2, 16, line, theme, {
      align: "center", size: 13, weight: 700, color: cKE,
    });
  }

  /* ---- energy bars, always readable even at the youngest band ---- */
  if (overlays.bars !== false) {
    const bx = padSide;
    const bw = Math.min(220, width * 0.3);
    const bh = compact ? 9 : 12;
    const peak = Math.max(keA, keB, 1e-6);
    const by = trackH - (compact ? 26 : 34);
    for (const [i, [value, color]] of ([[keA, cMass], [keB, theme.accent]] as const).entries()) {
      ctx.save();
      ctx.fillStyle = theme.surfaceAlt;
      roundRect(ctx, bx, by + i * (bh + 4), bw, bh, 3);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, bx, by + i * (bh + 4), (value / peak) * bw, bh, 3);
      ctx.fill();
      ctx.restore();
    }
    if (!compact) {
      caption(ctx, bx + bw + 8, by + bh / 2, `${keA.toFixed(0)} J`, theme, { size: 10, color: cMass });
      caption(ctx, bx + bw + 8, by + bh + 4 + bh / 2, `${keB.toFixed(0)} J`, theme, {
        size: 10, color: theme.accent,
      });
    }
  }

  if (!compact && band === "9-12") {
    caption(ctx, width - padSide, trackH - 12,
      `barrier force ${force.toFixed(0)} N  ·  d = ½mv² ÷ F`, theme,
      { align: "right", size: 10, color: theme.inkSoft });
  }

  vignette(ctx, width, trackH, 0.12);
  if (!showCurves) return;

  /* ---- the two curves that carry the lesson ---- */
  const top = trackH + (compact ? 22 : 32);
  const gap = compact ? 26 : 46;
  const plotH = Math.max(48, height - top - (compact ? 16 : 26));
  const plotW = (width - padSide * 2 - gap) / 2;

  const vMax = 13;
  const mMax = 8.5;
  const keMax = Math.max(kineticEnergy(Math.max(mA, mB), vMax), keA, keB) * 1.05;

  const speedPlot = makePlot(padSide + 10, top, plotW - 12, plotH, vMax, keMax);
  const massPlot = makePlot(padSide + plotW + gap + 10, top, plotW - 12, plotH,
    mMax, Math.max(kineticEnergy(mMax, Math.max(vA, vB)), keA, keB) * 1.05);

  plotChrome(ctx, speedPlot, theme, "energy against speed", "speed (m/s)", compact);
  plotChrome(ctx, massPlot, theme, "energy against mass", "mass (kg)", compact);

  // Energy against speed: a parabola for each cart's mass.
  for (const [mass, color] of [[mA, cMass], [mB, theme.accent]] as const) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const v = (i / 60) * vMax;
      const px = speedPlot.X(v);
      const py = speedPlot.Y(Math.min(kineticEnergy(mass, v), speedPlot.yMax));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  // Energy against mass: a straight line for each cart's speed.
  for (const [speed, color] of [[vA, cMass], [vB, theme.accent]] as const) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(massPlot.X(0), massPlot.Y(0));
    ctx.lineTo(massPlot.X(mMax), massPlot.Y(Math.min(kineticEnergy(mMax, speed), massPlot.yMax)));
    ctx.stroke();
    ctx.restore();
  }

  // The operating points, with drop lines so the reading is unambiguous.
  const marks: [Plot, number, number, string][] = [
    [speedPlot, vA, keA, cMass], [speedPlot, vB, keB, theme.accent],
    [massPlot, mA, keA, cMass], [massPlot, mB, keB, theme.accent],
  ];
  for (const [plot, xVal, yVal, color] of marks) {
    if (yVal > plot.yMax) continue;
    const px = plot.X(xVal), py = plot.Y(yVal);
    ctx.save();
    ctx.strokeStyle = hexA(color, 0.55);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, plot.y + plot.h);
    ctx.lineTo(px, py);
    ctx.lineTo(plot.x, py);
    ctx.stroke();
    ctx.restore();
    sphere(ctx, px, py, compact ? 3.5 : 5, color);
  }

  if (!compact) {
    caption(ctx, speedPlot.x + 6, speedPlot.y + 12, "a curve: doubling speed quadruples energy",
      theme, { size: 10, color: cVel });
    caption(ctx, massPlot.x + 6, massPlot.y + 12, "a straight line: doubling mass doubles energy",
      theme, { size: 10, color: cMass });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const kineticEnergySim: SimManifest<State> = {
  id: "phys.kinetic-energy",
  title: "Kinetic Energy",
  tagline: "Race two carts into a crush barrier and find out whether mass or speed does more damage.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9],
  standards: { ngss: ["MS-PS3-1", "HS-PS3-1"], ccssMath: ["8.F.B.5", "HSF.IF.C.7.A"] },
  learningGoals: [
    "Calculate kinetic energy from mass and speed using KE = ½mv².",
    "Explain why doubling the speed multiplies the energy by four, not by two.",
    "Read a curve and a straight line as two different kinds of relationship.",
    "Predict the damage a moving object does from the energy it carries.",
  ],
  misconceptions: [
    "Doubling the speed doubles the energy",
    "A heavy slow object always carries more energy than a light fast one",
    "Kinetic energy depends on how far the object has travelled",
    "A moving object contains a fixed amount of energy no matter how fast it goes",
  ],
  interactionHint: "Give the two carts different masses and speeds, then watch how deep each one digs in.",
  params: {
    massA: {
      type: "number", label: "Cart A mass", kind: "mass", unit: "kg",
      min: 0.5, max: 8, step: 0.1, default: 2,
    },
    speedA: {
      type: "number", label: "Cart A speed", kind: "velocity", unit: "m/s",
      min: 1, max: 12, step: 0.5, default: 4,
    },
    massB: {
      type: "number", label: "Cart B mass", kind: "mass", unit: "kg",
      min: 0.5, max: 8, step: 0.1, default: 2,
    },
    speedB: {
      type: "number", label: "Cart B speed", kind: "velocity", unit: "m/s",
      min: 1, max: 12, step: 0.5, default: 8,
      help: "Start with double cart A's speed and watch what happens to the damage.",
    },
    barrierForce: {
      type: "number", label: "Barrier resisting force", kind: "force", unit: "N",
      min: 50, max: 1000, step: 10, default: 150, bands: ["6-8", "9-12"],
      help: "A tougher barrier stops the cart in a shorter distance, but the energy is the same.",
    },
  },
  overlays: [
    { key: "curves", label: "Energy curves", default: true, bands: ["6-8", "9-12"] },
    { key: "bars", label: "Energy bars", default: true },
    { key: "compare", label: "Comparison caption", default: true, bands: ["6-8", "9-12"] },
  ],
  labs: [
    {
      id: "mass-or-speed",
      title: "Mass or speed?",
      question: "To carry twice as much kinetic energy, is it better to double the mass or the speed?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-1"],
      setup: { massA: 2, speedA: 4, massB: 4, speedB: 4, barrierForce: 150 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you run",
          instruction: "Cart A is 2 kg at 4 m/s. You will compare doubling its mass with doubling its speed.",
          predict: {
            prompt: "Which change gives the bigger kinetic energy?",
            options: [
              "Doubling the mass",
              "Doubling the speed",
              "They give exactly the same energy",
              "Neither changes the energy",
            ],
            correct: 1,
            reveal: "Mass appears once in ½mv², so doubling it doubles the energy. Speed is squared, so doubling it multiplies the energy by four.",
          },
        },
        {
          id: "double-mass",
          phase: "measure",
          title: "Double the mass first",
          instruction: "Set cart B to 4 kg at 4 m/s. Run it and record both energies.",
          requireData: 1,
          check: {
            describe: "Cart B has twice cart A's mass and the same speed",
            test: (v) => Math.abs((v.facts.massRatio as number) - 2) < 0.05
              && Math.abs((v.facts.speedRatio as number) - 1) < 0.05,
          },
        },
        {
          id: "double-speed",
          phase: "measure",
          title: "Now double the speed instead",
          instruction: "Set cart B back to 2 kg but give it 8 m/s. Run and record.",
          requireData: 2,
          check: {
            describe: "Cart B has twice cart A's speed and the same mass",
            test: (v) => Math.abs((v.facts.speedRatio as number) - 2) < 0.05
              && Math.abs((v.facts.massRatio as number) - 1) < 0.05,
          },
          hints: ["Watch the damage depth, not just the number in the panel."],
        },
        {
          id: "shape",
          phase: "analyze",
          title: "Two different shapes",
          instruction: "Compare the energy-against-speed graph with the energy-against-mass graph.",
          write: {
            prompt: "One graph is a straight line and the other bends upward. Why?",
            placeholder: "The mass graph is straight because ... the speed graph curves because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Apply it to the road",
          instruction: "Use what you found to answer a road-safety question.",
          write: {
            prompt: "A car goes from 30 to 60 km/h. How much more energy must its brakes remove, and why?",
            placeholder: "Because speed is squared in the formula, ...",
          },
        },
      ],
    },
    {
      id: "where-energy-goes",
      title: "Where does the energy go?",
      question: "What decides how far a cart ploughs into the barrier?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS3-1", "MS-PS3-2"],
      setup: { massA: 2, speedA: 6, massB: 2, speedB: 6, barrierForce: 150 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the effect of a tougher barrier",
          instruction: "Both carts are identical. You are about to double the barrier's resisting force.",
          predict: {
            prompt: "What happens to how deep the carts dig in?",
            options: [
              "It doubles",
              "It halves",
              "It stays the same",
              "It drops to a quarter",
            ],
            correct: 1,
            reveal: "The barrier has to absorb the same ½mv² either way. If it pushes twice as hard, it only needs half the distance to do it: F × d stays the same.",
          },
        },
        {
          id: "soft",
          phase: "measure",
          title: "Record the soft barrier",
          instruction: "Run once at 150 N and record the damage depth.",
          requireData: 1,
        },
        {
          id: "hard",
          phase: "measure",
          title: "Now double the force",
          instruction: "Set the barrier force to 300 N, run again and record.",
          requireData: 2,
          check: {
            describe: "The barrier force is at least 300 N",
            test: (v) => (v.params.barrierForce as number) >= 300,
          },
        },
        {
          id: "product",
          phase: "analyze",
          title: "Multiply them out",
          instruction: "For each run, multiply the barrier force by the depth. Compare with the kinetic energy.",
          write: {
            prompt: "What did force × depth come to each time, and what does that equal?",
            placeholder: "In both runs force × depth was about ... which is the same as ...",
          },
          hints: ["Force in newtons times distance in metres gives joules — that is work."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the connection",
          instruction: "Write the rule linking energy, force and stopping distance.",
          write: {
            prompt: "Finish the rule: to stop a moving cart, the barrier must ...",
            placeholder: "The barrier must do work equal to ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "four-times",
      title: "Four times the damage",
      brief: "Using speed alone, make cart B dig four times as deep as cart A.",
      bands: ["6-8", "9-12"],
      setup: { massA: 2, speedA: 3, massB: 2, speedB: 3, barrierForce: 150 },
      goal: {
        describe: "Equal masses, and cart B's energy is four times cart A's",
        test: (v) => Math.abs((v.facts.massRatio as number) - 1) < 0.02
          && Math.abs((v.facts.keRatio as number) - 4) < 0.15
          && Boolean(v.facts.finished),
      },
      stars: {
        two: {
          describe: "Within 2% of exactly four times",
          test: (v) => Math.abs((v.facts.massRatio as number) - 1) < 0.02
            && Math.abs((v.facts.keRatio as number) - 4) < 0.08
            && Boolean(v.facts.finished),
        },
        three: {
          describe: "Exactly four times, and the damage ratio proves it",
          test: (v) => Math.abs((v.facts.massRatio as number) - 1) < 0.02
            && Math.abs((v.facts.keRatio as number) - 4) < 0.02
            && Math.abs((v.facts.crushRatio as number) - 4) < 0.1
            && Boolean(v.facts.finished),
        },
      },
      hints: [
        "Changing the mass is not allowed here — only the speeds.",
        "Energy goes with the square of the speed, so ask what number squares to four.",
      ],
    },
    {
      id: "heavy-and-slow",
      title: "Heavy and slow, light and fast",
      brief: "Give the carts very different masses but exactly the same kinetic energy.",
      bands: ["6-8", "9-12"],
      setup: { massA: 6, speedA: 3, massB: 1.5, speedB: 3, barrierForce: 150 },
      goal: {
        describe: "Masses differ by at least three times, energies within 3%",
        test: (v) => {
          const mr = v.facts.massRatio as number;
          return (mr >= 3 || mr <= 1 / 3)
            && Math.abs((v.facts.keRatio as number) - 1) < 0.03;
        },
      },
      stars: {
        two: {
          describe: "Energies within 1%",
          test: (v) => {
            const mr = v.facts.massRatio as number;
            return (mr >= 3 || mr <= 1 / 3)
              && Math.abs((v.facts.keRatio as number) - 1) < 0.01;
          },
        },
      },
      hints: [
        "A cart with a quarter of the mass needs twice the speed to match the energy.",
        "Try 6 kg at 3 m/s against 1.5 kg at 6 m/s.",
      ],
    },
  ],
  model,
  render,
};
