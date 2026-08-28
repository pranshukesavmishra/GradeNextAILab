import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, camera, disc, energyBars, label } from "@ui/draw";

/**
 * Pendulum Lab — Grades 4-12.
 *
 * A real nonlinear pendulum: θ'' = -(g/L)·sin θ - (b/m)·θ'. No small-angle
 * approximation is used anywhere in the motion, which is the only way a student
 * can discover for themselves that the period *does* creep up at large
 * amplitude — the thing the textbook formula hides.
 *
 * Confronts the belief that a heavier bob swings faster, and that pulling the
 * bob further back makes the swing take the same time no matter how far.
 */

interface State {
  /** Angle from vertical, rad. Positive is to the right. */
  theta: number;
  /** Angular velocity, rad/s. */
  omega: number;
  /** Seconds since this swing began. */
  t: number;
  /** Time of the last time the bob passed through the lowest point, s. */
  lastCross: number;
  /** Most recent full period measured from two consecutive crossings, s. */
  period: number;
  /** Completed half-swings, used to know when a period is trustworthy. */
  crossings: number;
  /** Largest angle seen since the swing began, rad. */
  maxAngle: number;
}

/* ------------------------------------------------------------------ *
 * Physics
 * ------------------------------------------------------------------ */

/** Angular acceleration of a damped simple pendulum. */
function alpha(theta: number, omega: number, g: number, L: number, gamma: number): number {
  return -(g / L) * Math.sin(theta) - gamma * omega;
}

/**
 * One RK4 step.
 *
 * Semi-implicit Euler is stable here but leaks a little energy per swing, and
 * this sim asks students to measure a period to three figures and to check that
 * energy is conserved. RK4 at 120 Hz keeps both honest.
 */
function rk4(theta: number, omega: number, dt: number, g: number, L: number, gamma: number) {
  const k1t = omega;
  const k1o = alpha(theta, omega, g, L, gamma);
  const k2t = omega + (dt / 2) * k1o;
  const k2o = alpha(theta + (dt / 2) * k1t, omega + (dt / 2) * k1o, g, L, gamma);
  const k3t = omega + (dt / 2) * k2o;
  const k3o = alpha(theta + (dt / 2) * k2t, omega + (dt / 2) * k2o, g, L, gamma);
  const k4t = omega + dt * k3o;
  const k4o = alpha(theta + dt * k3t, omega + dt * k3o, g, L, gamma);
  return {
    theta: theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: omega + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o),
  };
}

/** The textbook small-angle period, exposed for comparison only. */
export function smallAnglePeriod(length: number, gravity: number): number {
  return 2 * Math.PI * Math.sqrt(length / gravity);
}

function startState(params: ParamValues): State {
  const theta = params.startAngle as number;
  return {
    theta, omega: 0, t: 0,
    lastCross: -1, period: 0, crossings: 0,
    maxAngle: Math.abs(theta),
  };
}

const model: SimModel<State> = {
  init(params) {
    return startState(params);
  },

  applyParams(state, params, prev) {
    // Length, gravity and release angle define a different experiment, so the
    // swing restarts. Mass and damping deliberately do not restart it: changing
    // the mass mid-swing and seeing nothing happen is the whole lesson.
    if (
      params.length !== prev.length ||
      params.gravity !== prev.gravity ||
      params.startAngle !== prev.startAngle
    ) {
      return startState(params);
    }
    return state;
  },

  step(state, dt, params) {
    const g = params.gravity as number;
    const L = Math.max(0.05, params.length as number);
    const m = Math.max(0.01, params.mass as number);
    // Linear drag on the bob, F = -b·v, gives an angular damping rate of b/m.
    const gamma = (params.damping as number) / m;

    const next = rk4(state.theta, state.omega, dt, g, L, gamma);
    const t = state.t + dt;

    let { lastCross, period, crossings } = state;
    // A period is measured between passes through the lowest point, the same
    // way it is done with a photogate on a lab bench.
    if (state.theta !== 0 && next.theta * state.theta < 0) {
      const frac = state.theta / (state.theta - next.theta);
      const crossTime = state.t + dt * frac;
      if (lastCross >= 0) period = 2 * (crossTime - lastCross);
      lastCross = crossTime;
      crossings += 1;
    }

    return {
      theta: next.theta,
      omega: next.omega,
      t,
      lastCross,
      period,
      crossings,
      maxAngle: Math.max(state.maxAngle, Math.abs(next.theta)),
    };
  },

  readouts(state, params) {
    const L = Math.max(0.05, params.length as number);
    const m = Math.max(0.01, params.mass as number);
    const g = params.gravity as number;
    const speed = Math.abs(state.omega) * L;
    const ke = 0.5 * m * speed * speed;
    const pe = m * g * L * (1 - Math.cos(state.theta));
    const height = L * (1 - Math.cos(state.theta));

    return [
      {
        key: "angle", label: "Angle", quantity: q(state.theta, "angle"),
        unit: "°", semantic: "distance", graphable: true,
      },
      {
        key: "omega", label: "Angular speed (rad/s)", quantity: q(state.omega, "ratio"),
        semantic: "velocity", graphable: true, bands: ["9-12"],
      },
      {
        key: "speed", label: "Bob speed", quantity: q(speed, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "height", label: "Height above lowest point", quantity: q(height, "length"),
        unit: "m", semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "period", label: "Measured period", quantity: q(state.period, "time"),
        unit: "s", semantic: "time", graphable: true,
      },
      {
        key: "smallAngle", label: "Small-angle prediction", quantity: q(smallAnglePeriod(L, g), "time"),
        unit: "s", semantic: "time", graphable: false, bands: ["9-12"],
      },
      {
        key: "ke", label: "Kinetic energy", quantity: q(ke, "energy"),
        unit: "J", semantic: "energy-kinetic", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "pe", label: "Potential energy", quantity: q(pe, "energy"),
        unit: "J", semantic: "energy-potential", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "total", label: "Total energy", quantity: q(ke + pe, "energy"),
        unit: "J", semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const L = Math.max(0.05, params.length as number);
    const g = params.gravity as number;
    const target = params.targetPeriod as number;
    // Turning a measured period back into g is the point of the second lab.
    const gEstimate = state.period > 0 ? (4 * Math.PI * Math.PI * L) / (state.period * state.period) : 0;
    return {
      period: state.period,
      measured: state.crossings >= 2,
      swings: Math.floor(state.crossings / 2),
      maxAngle: state.maxAngle,
      smallAnglePeriod: smallAnglePeriod(L, g),
      periodError: state.period > 0 ? Math.abs(state.period - target) : Number.POSITIVE_INFINITY,
      gEstimate,
      gError: gEstimate > 0 ? Math.abs(gEstimate - g) : Number.POSITIVE_INFINITY,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const L = Math.max(0.05, params.length as number);
  const m = Math.max(0.01, params.mass as number);
  const g = params.gravity as number;

  // Frame on the pivot, with enough room for a 150° release angle.
  const span = L * 1.25 + 0.25;
  const cam = camera({
    x0: -span, y0: -(L * 1.2 + 0.3), x1: span, y1: L * 0.55 + 0.2,
    width, height, square: true,
  });
  const px = cam.toScreenX(0);
  const py = cam.toScreenY(0);
  const bobX = cam.toScreenX(L * Math.sin(state.theta));
  const bobY = cam.toScreenY(-L * Math.cos(state.theta));
  const rodPx = Math.hypot(bobX - px, bobY - py);

  // ---- Equilibrium reference and swept arc ---------------------------
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + rodPx * 1.06);
  ctx.stroke();
  ctx.restore();

  if (overlays.arc) {
    const sweep = Math.min(Math.PI * 0.92, state.maxAngle);
    ctx.save();
    ctx.strokeStyle = theme.inkSoft;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    // Canvas angles run clockwise from +x; the bob hangs below the pivot.
    ctx.arc(px, py, rodPx, Math.PI / 2 - sweep, Math.PI / 2 + sweep);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Protractor ----------------------------------------------------
  if (overlays.protractor && band !== "K-2") {
    const r = rodPx * 0.34;
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let deg = -150; deg <= 150; deg += 15) {
      const a = (deg * Math.PI) / 180;
      const major = deg % 45 === 0;
      const r0 = major ? r * 0.86 : r * 0.93;
      ctx.beginPath();
      ctx.moveTo(px + Math.sin(a) * r0, py + Math.cos(a) * r0);
      ctx.lineTo(px + Math.sin(a) * r, py + Math.cos(a) * r);
      ctx.stroke();
    }
    ctx.restore();

    // The live angle, filled in from the vertical.
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const a0 = Math.PI / 2;
    const a1 = Math.PI / 2 - state.theta;
    ctx.arc(px, py, r * 0.7, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
    ctx.restore();
    label(
      ctx, `${((state.theta * 180) / Math.PI).toFixed(0)}°`,
      px + Math.sin(state.theta / 2) * r * 1.25,
      py + Math.cos(state.theta / 2) * r * 1.25,
      theme, { align: "center", color: theme.accent },
    );
  }

  // ---- Rod and pivot --------------------------------------------------
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.moveTo(px - 14, py - 10);
  ctx.lineTo(px + 14, py - 10);
  ctx.lineTo(px + 14, py - 4);
  ctx.lineTo(px - 14, py - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  disc(ctx, px, py, 4, theme.ink);

  // ---- Bob ------------------------------------------------------------
  // Radius grows with the cube root of mass: equal-density spheres.
  const bobR = Math.max(9, Math.min(34, 13 * Math.cbrt(m)));
  disc(ctx, bobX, bobY, bobR, theme.sci["mass"], { stroke: theme.surface, lineWidth: 2 });

  // ---- Vectors ---------------------------------------------------------
  if (overlays.vectors && band !== "K-2") {
    // Screen-space unit tangent, pointing the way the bob is travelling.
    // World tangent is (cos θ, sin θ); the screen y axis points the other way.
    const tx = Math.cos(state.theta);
    const ty = -Math.sin(state.theta);
    const v = state.omega * L;
    const vLen = Math.min(80, Math.abs(v) * 16);
    if (vLen > 3) {
      const s = Math.sign(v);
      arrow(ctx, bobX, bobY, bobX + tx * s * vLen, bobY + ty * s * vLen, theme.sci["velocity"], {
        label: band === "9-12" ? "v" : undefined,
      });
    }
    if (band === "9-12") {
      // Weight, and the slice of it that actually drives the swing back.
      arrow(ctx, bobX, bobY, bobX, bobY + 46, theme.sci["force"], { label: "mg" });
      const restoring = -Math.sin(state.theta) * 46;
      arrow(ctx, bobX, bobY, bobX + tx * restoring, bobY + ty * restoring, theme.sci["force"], {
        width: 1.8, dashed: true,
      });
    }
  }

  // ---- Energy bars ------------------------------------------------------
  if (overlays.energy && band !== "K-2") {
    const speed = Math.abs(state.omega) * L;
    const ke = 0.5 * m * speed * speed;
    const pe = m * g * L * (1 - Math.cos(state.theta));
    const barW = Math.min(240, width * 0.34);
    const bx = width - barW - 16;
    const by = 16;
    energyBars(ctx, bx, by, barW, 16, [
      { label: "KE", value: ke, color: theme.sci["energy-kinetic"] },
      { label: "PE", value: pe, color: theme.sci["energy-potential"] },
    ], theme);
    label(ctx, "kinetic", bx, by + 30, theme, { color: theme.sci["energy-kinetic"], size: 11 });
    label(ctx, "potential", bx + barW, by + 30, theme, {
      align: "right", color: theme.sci["energy-potential"], size: 11,
    });
    if (band === "9-12") {
      label(ctx, `total ${(ke + pe).toFixed(2)} J`, bx + barW / 2, by + 46, theme, {
        align: "center", color: theme.sci["energy-total"], size: 11,
      });
    }
  }

  // ---- Period readout ----------------------------------------------------
  if (band !== "K-2") {
    const t0 = smallAnglePeriod(L, g);
    const txt = state.period > 0 ? `T = ${state.period.toFixed(3)} s` : "T = measuring…";
    label(ctx, txt, 16, 24, theme, { color: theme.sci["time"] });
    if (band === "9-12") {
      label(ctx, `2π√(L/g) = ${t0.toFixed(3)} s`, 16, 46, theme, { color: theme.inkSoft, size: 11 });
      if (state.period > 0) {
        const pct = ((state.period - t0) / t0) * 100;
        label(ctx, `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs formula`, 16, 66, theme, {
          color: theme.inkSoft, size: 11,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const pendulumSim: SimManifest<State> = {
  id: "phys.pendulum",
  title: "Pendulum Lab",
  tagline: "Swing it, time it, and find out what really sets the rhythm.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["4-PS3-1", "MS-PS3-5", "HS-PS2-1", "HS-PS3-2"], ccssMath: ["8.F.B.5", "HSF.IF.B.4"] },
  learningGoals: [
    "Predict how length, mass, angle and gravity change a pendulum's period.",
    "Measure a period and use it to work out the strength of gravity.",
    "Explain how kinetic and potential energy trade off through one swing.",
  ],
  misconceptions: [
    "A heavier bob swings faster",
    "Pulling the bob back further always makes the swing take longer",
    "The period depends on how hard you push it",
    "A pendulum moves fastest at the ends of its swing",
  ],
  interactionHint: "Press play and watch the timer find the period.",
  params: {
    length: {
      type: "number", label: "String length", kind: "length", unit: "m",
      min: 0.2, max: 3, step: 0.05, default: 1,
      help: "The one thing that really changes the period.",
    },
    mass: {
      type: "number", label: "Bob mass", kind: "mass", unit: "kg",
      min: 0.1, max: 5, step: 0.1, default: 1,
      help: "Try changing this mid-swing and watch the timing carefully.",
    },
    startAngle: {
      type: "number", label: "Release angle", kind: "angle", unit: "°",
      min: 0.0873, max: 2.618, step: 0.0175, default: 0.5236,
      marks: [
        { value: 0.0873, label: "5°" },
        { value: 0.5236, label: "30°" },
        { value: 1.5708, label: "90°" },
        { value: 2.618, label: "150°" },
      ],
      help: "Small angles match the textbook formula. Big ones do not.",
    },
    gravity: {
      type: "number", label: "Gravity", kind: "acceleration", unit: "m/s²",
      min: 1.6, max: 25, step: 0.01, default: CONSTANTS.g,
      bands: ["3-5", "6-8", "9-12"],
      marks: [
        { value: 1.62, label: "Moon" },
        { value: 3.72, label: "Mars" },
        { value: 9.81, label: "Earth" },
        { value: 24.79, label: "Jupiter" },
      ],
    },
    damping: {
      type: "number", label: "Air drag", kind: "ratio",
      min: 0, max: 1.5, step: 0.05, default: 0,
      bands: ["6-8", "9-12"],
      help: "Drag on the bob. A heavier bob fights it off for longer.",
    },
    targetPeriod: {
      type: "number", label: "Target period", kind: "time", unit: "s",
      min: 0.8, max: 3, step: 0.1, default: 2,
      bands: ["3-5", "6-8", "9-12"],
      help: "Used by the challenge. A 2 s pendulum ticks once per second.",
    },
  },
  overlays: [
    { key: "arc", label: "Swing path", default: true },
    { key: "protractor", label: "Protractor", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "vectors", label: "Arrows", default: false, bands: ["6-8", "9-12"] },
    { key: "energy", label: "Energy bars", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "what-changes-period",
      title: "What changes the period?",
      question: "Mass, length or release angle — which one actually changes the timing?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-5", "HS-PS2-1"],
      setup: { length: 1, mass: 1, startAngle: 0.1745, gravity: CONSTANTS.g, damping: 0, targetPeriod: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Pick one before you test",
          instruction: "Only one of these changes the period much. Choose now.",
          predict: {
            prompt: "Which change makes the biggest difference to the time for one swing?",
            options: ["Making the bob 5× heavier", "Making the string 4× longer", "Releasing from 10° instead of 20°"],
            correct: 1,
            reveal: "Length wins. Period goes as the square root of length, so 4× longer is 2× slower. Mass has no effect at all, and small angles barely matter.",
          },
        },
        {
          id: "mass",
          phase: "measure",
          title: "Test the mass",
          instruction: "Keep the length at 1 m. Time the swing at 0.5 kg, then at 5 kg.",
          requireData: 2,
          check: {
            describe: "Bob mass is 4 kg or more",
            test: (v) => (v.params.mass as number) >= 4,
          },
          hints: [
            "Wait for the period readout to settle before recording.",
            "Change only the mass. Everything else stays fixed.",
          ],
        },
        {
          id: "length",
          phase: "measure",
          title: "Test the length",
          instruction: "Now set the length to 0.25 m, then 1 m, then 2.25 m. Record each.",
          requireData: 5,
          check: {
            describe: "String length is 2 m or more",
            test: (v) => (v.params.length as number) >= 2,
          },
          hints: [
            "0.25, 1 and 2.25 are 1×, 4× and 9× of 0.25 m. Watch what the period does.",
            "Compare periods rather than subtracting them.",
          ],
        },
        {
          id: "angle",
          phase: "measure",
          title: "Test the angle",
          instruction: "Back to 1 m. Time it from 10°, then from 150°.",
          requireData: 7,
          check: {
            describe: "Released from 120° or more",
            test: (v) => (v.params.startAngle as number) >= 2.09,
          },
          hints: ["A huge angle does change the period — by a few percent, not a few times."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say what changes the period, what does not, and by how much.",
          write: {
            prompt: "What controls the period of a pendulum? Where does your rule break down?",
            placeholder: "The period depends on ... and not on ... My rule stops working when ...",
          },
        },
      ],
    },
    {
      id: "measure-g",
      title: "Measure g with a pendulum",
      question: "Can a piece of string and a stopwatch tell you the strength of gravity?",
      bands: ["9-12"],
      minutes: 30,
      standards: ["HS-PS2-1"],
      setup: { length: 1, mass: 1, startAngle: 0.1745, gravity: CONSTANTS.g, damping: 0, targetPeriod: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the graph",
          instruction: "You will plot period² against length. Predict its shape.",
          predict: {
            prompt: "A graph of T² against L will be...",
            options: ["a curve bending upwards", "a straight line through the origin", "a flat line", "a curve bending downwards"],
            correct: 1,
            reveal: "A straight line through the origin. T = 2π√(L/g) squares to T² = (4π²/g)·L, so the gradient is 4π²/g.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Five lengths",
          instruction: "Use a small release angle. Record the period at five different lengths.",
          requireData: 5,
          check: {
            describe: "Release angle is under 15°, where the formula holds",
            test: (v) => (v.params.startAngle as number) <= 0.262,
          },
          hints: [
            "Below about 15° the small-angle formula is accurate to better than 0.5%.",
            "Let at least two full swings pass so the period reading is stable.",
          ],
        },
        {
          id: "gradient",
          phase: "analyze",
          title: "Work out g",
          instruction: "For each row calculate 4π²L ÷ T². How close is it to 9.81?",
          write: {
            prompt: "What value of g did you get, and how close is it to the true value?",
            placeholder: "I calculated g = ... which is within ...% of 9.81 m/s².",
          },
          hints: ["Rearranging T = 2π√(L/g) gives g = 4π²L / T²."],
        },
        {
          id: "alien",
          phase: "measure",
          title: "Now do it on Mars",
          instruction: "Set gravity to Mars, measure the period, and work g out again.",
          check: {
            describe: "Gravity is set below 5 m/s²",
            test: (v) => (v.params.gravity as number) < 5,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the method",
          instruction: "Write instructions an astronaut could follow on an unknown moon.",
          write: {
            prompt: "How would you find g somewhere new with only string, a mass and a stopwatch?",
            placeholder: "First measure ... then time ... then calculate ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "tune-period",
      title: "Build a one-second tick",
      brief: "Change the length until the period matches the target exactly.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { length: 0.3, mass: 1, startAngle: 0.1745, gravity: CONSTANTS.g, damping: 0, targetPeriod: 2 },
      goal: {
        describe: "Measured period within 0.05 s of the target",
        test: (v) => Boolean(v.facts.measured) && (v.facts.periodError as number) <= 0.05,
      },
      stars: {
        two: {
          describe: "Within 0.02 s",
          test: (v) => Boolean(v.facts.measured) && (v.facts.periodError as number) <= 0.02,
        },
        three: {
          describe: "Within 0.005 s",
          test: (v) => Boolean(v.facts.measured) && (v.facts.periodError as number) <= 0.005,
        },
      },
      hints: [
        "Longer string, slower swing. Try doubling the length and see what happens.",
        "To double the period you need four times the length.",
        "L = g·T² ÷ 4π². For a 2 s period on Earth that is very close to 1 m.",
      ],
    },
    {
      id: "slow-swing",
      title: "Slow motion swing",
      brief: "Get a period of 4 seconds or more with a string no longer than 2 m.",
      bands: ["6-8", "9-12"],
      setup: { length: 2, mass: 1, startAngle: 0.3491, gravity: CONSTANTS.g, damping: 0, targetPeriod: 2 },
      goal: {
        describe: "Period at least 4 s with length at most 2 m",
        test: (v) =>
          Boolean(v.facts.measured) &&
          (v.facts.period as number) >= 4 &&
          (v.params.length as number) <= 2,
      },
      stars: {
        two: {
          describe: "Period of 6 s or more",
          test: (v) =>
            Boolean(v.facts.measured) &&
            (v.facts.period as number) >= 6 &&
            (v.params.length as number) <= 2,
        },
        three: {
          describe: "Period of 6 s or more with a string of 1 m or less",
          test: (v) =>
            Boolean(v.facts.measured) &&
            (v.facts.period as number) >= 6 &&
            (v.params.length as number) <= 1,
        },
      },
      hints: [
        "You cannot get there with length alone. What else is in the formula?",
        "The same pendulum swings much more slowly on the Moon.",
        "For the last star, remember that a huge release angle stretches the period too — by nearly 80% at 150°.",
      ],
    },
  ],
};
