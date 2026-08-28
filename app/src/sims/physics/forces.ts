import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, camera, ground, label, roundRect } from "@ui/draw";

/**
 * Forces & Newton's Laws — Grades 4-12.
 *
 * Push a box across ice, wood or carpet. Every force acting on it is drawn to
 * scale, including the one students forget: friction. The box obeys
 * a = F_net / m exactly, with a proper static/kinetic friction split, so it
 * takes a bigger push to start the box than to keep it sliding.
 *
 * Confronts the deepest misconception in mechanics: that motion needs a force
 * to keep it going, and that a constant push means a constant speed.
 */

interface Surface { muK: number; muS: number; label: string }

const SURFACES: Record<string, Surface> = {
  ice: { muK: 0.03, muS: 0.05, label: "Ice" },
  wood: { muK: 0.3, muS: 0.4, label: "Wood" },
  carpet: { muK: 0.6, muS: 0.78, label: "Carpet" },
  custom: { muK: 0.3, muS: 0.4, label: "Custom" },
};

function coefficients(params: ParamValues): Surface {
  const name = params.surface as string;
  if (name === "custom") {
    const mu = params.friction as number;
    return { muK: mu, muS: mu * 1.3, label: "Custom" };
  }
  return SURFACES[name] ?? SURFACES.wood;
}

/** The park is this long; the box cannot leave it. */
const TRACK_LENGTH = 40;

interface State {
  /** Position of the centre of the box, m. */
  x: number;
  /** Velocity, m/s. */
  v: number;
  /** Acceleration this step, m/s². */
  a: number;
  /** Applied force this step, N. */
  applied: number;
  /** Friction force this step, N. Opposes motion, so it is signed. */
  friction: number;
  /** True once the box has been set moving at least once. */
  hasMoved: boolean;
  /** Simulated seconds since the run started. */
  t: number;
  maxSpeed: number;
  /** Applied force at the moment the box first broke free, N. */
  breakawayForce: number;
}

const REST = 1e-6;

const model: SimModel<State> = {
  init() {
    return {
      x: 2, v: 0, a: 0, applied: 0, friction: 0,
      hasMoved: false, t: 0, maxSpeed: 0, breakawayForce: 0,
    };
  },

  step(state, dt, params) {
    const m = Math.max(0.1, params.mass as number);
    const g = params.gravity as number;
    const { muK, muS } = coefficients(params);
    const applied = (params.pushing as boolean) ? (params.appliedForce as number) : 0;

    const normal = m * g;
    const staticLimit = muS * normal;
    const kinetic = muK * normal;

    let friction: number;
    let a: number;

    if (Math.abs(state.v) < REST) {
      if (Math.abs(applied) <= staticLimit) {
        // Static friction exactly cancels the push: nothing moves at all.
        friction = -applied;
        a = 0;
      } else {
        friction = -Math.sign(applied) * kinetic;
        a = (applied + friction) / m;
      }
    } else {
      friction = -Math.sign(state.v) * kinetic;
      a = (applied + friction) / m;
    }

    let v = state.v + a * dt;
    // Friction brings a box to rest; it never drags it backwards.
    if (state.v !== 0 && v * state.v < 0 && Math.abs(applied) <= staticLimit) {
      v = 0;
      a = 0;
      friction = -applied;
    }

    let x = state.x + v * dt;
    const half = 0.6;
    if (x < half) { x = half; v = 0; }
    if (x > TRACK_LENGTH - half) { x = TRACK_LENGTH - half; v = 0; }

    const nowMoving = Math.abs(v) > 1e-3;
    return {
      x, v, a, applied, friction,
      hasMoved: state.hasMoved || nowMoving,
      t: state.t + dt,
      maxSpeed: Math.max(state.maxSpeed, Math.abs(v)),
      breakawayForce:
        !state.hasMoved && nowMoving ? Math.abs(applied) : state.breakawayForce,
    };
  },

  readouts(state, params) {
    const m = Math.max(0.1, params.mass as number);
    const g = params.gravity as number;
    const net = state.applied + state.friction;
    return [
      {
        key: "position", label: "Position", quantity: q(state.x, "length"),
        unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "velocity", label: "Speed", quantity: q(state.v, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true,
      },
      {
        key: "acceleration", label: "Acceleration", quantity: q(state.a, "acceleration"),
        unit: "m/s²", semantic: "acceleration", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "applied", label: "Push force", quantity: q(state.applied, "force"),
        unit: "N", semantic: "force", graphable: true,
      },
      {
        key: "friction", label: "Friction force", quantity: q(state.friction, "force"),
        unit: "N", semantic: "force", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "net", label: "Net force", quantity: q(net, "force"),
        unit: "N", semantic: "force", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "normal", label: "Ground push", quantity: q(m * g, "force"),
        unit: "N", semantic: "force", graphable: false, bands: ["9-12"],
      },
      {
        key: "weight", label: "Weight", quantity: q(-m * g, "force"),
        unit: "N", semantic: "force", graphable: false, bands: ["9-12"],
      },
      {
        key: "ke", label: "Kinetic energy", quantity: q(0.5 * m * state.v * state.v, "energy"),
        unit: "J", semantic: "energy-kinetic", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const m = Math.max(0.1, params.mass as number);
    const g = params.gravity as number;
    const { muS } = coefficients(params);
    const target = params.targetX as number;
    const moving = Math.abs(state.v) > 1e-3;
    return {
      moving,
      stopped: !moving && state.t > 0.5,
      hasMoved: state.hasMoved,
      position: state.x,
      speed: Math.abs(state.v),
      acceleration: state.a,
      netForce: state.applied + state.friction,
      staticLimit: muS * m * g,
      breakawayForce: state.breakawayForce,
      distanceToTarget: Math.abs(state.x - target),
      inZone: Math.abs(state.x - target) <= 1,
      surface: params.surface as string,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const m = Math.max(0.1, params.mass as number);
  const g = params.gravity as number;
  const target = params.targetX as number;

  const cam = camera({
    x0: -1, y0: -2.5, x1: TRACK_LENGTH + 1, y1: 9.5,
    width, height, square: false,
  });
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);
  const floorY = Y(0);

  // ---- Target zone ------------------------------------------------------
  {
    const zx0 = X(target - 0.5), zx1 = X(target + 0.5);
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(zx0, floorY - 60, zx1 - zx0, 60);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(X(target), floorY - 66);
    ctx.lineTo(X(target), floorY);
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2") {
      label(ctx, "target", X(target), floorY - 76, theme, {
        align: "center", color: theme.accent, size: 11,
      });
    }
  }

  // ---- Floor and ruler ---------------------------------------------------
  ground(ctx, floorY, X(-1), X(TRACK_LENGTH + 1), theme);
  if (overlays.ruler) {
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= TRACK_LENGTH; x += 5) {
      ctx.moveTo(X(x), floorY);
      ctx.lineTo(X(x), floorY + 10);
    }
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2") {
      for (let x = 0; x <= TRACK_LENGTH; x += 10) {
        label(ctx, `${x} m`, X(x), floorY + 22, theme, {
          align: "center", color: theme.inkSoft, size: 10, plate: false,
        });
      }
    }
  }

  // ---- The box -------------------------------------------------------------
  // Side length grows with the cube root of mass: same stuff, bigger block.
  const side = Math.max(26, Math.min(76, 22 * Math.cbrt(m / 20) * 1.35));
  const bx = X(state.x) - side / 2;
  const by = floorY - side;
  ctx.save();
  ctx.fillStyle = theme.sci["mass"];
  roundRect(ctx, bx, by, side, side, 5);
  ctx.fill();
  ctx.strokeStyle = theme.surface;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  if (band !== "K-2") {
    label(ctx, `${m.toFixed(0)} kg`, X(state.x), by + side / 2, theme, {
      align: "center", color: theme.ink, size: 11,
    });
  }

  // ---- Force arrows ---------------------------------------------------------
  if (overlays.forces) {
    const cx = X(state.x);
    const cy = by + side / 2;
    const weight = m * g;
    // One shared scale so arrow lengths are honestly comparable.
    const biggest = Math.max(Math.abs(state.applied), Math.abs(state.friction), weight, 1);
    const scale = 70 / biggest;
    const F = theme.sci["force"];

    if (Math.abs(state.applied) > 0.5) {
      const from = state.applied > 0 ? bx : bx + side;
      arrow(ctx, from, cy, from + state.applied * scale, cy, F, {
        width: 3, label: band === "K-2" ? undefined : "push",
      });
    }
    if (Math.abs(state.friction) > 0.5) {
      const from = state.friction > 0 ? bx : bx + side;
      arrow(ctx, from, floorY - 4, from + state.friction * scale, floorY - 4, F, {
        width: 2.5, label: band === "K-2" ? undefined : "friction",
      });
    }
    if (band === "6-8" || band === "9-12") {
      arrow(ctx, cx, cy, cx, cy + weight * scale, F, { width: 2, dashed: true, label: "weight" });
      arrow(ctx, cx, floorY, cx, floorY - weight * scale, F, { width: 2, dashed: true, label: "ground" });
    }

    // The net force gets its own lane above the box, because it is the one
    // that decides what happens next.
    const net = state.applied + state.friction;
    if (band !== "K-2" && Math.abs(net) > 0.5) {
      const ny = by - 26;
      arrow(ctx, cx, ny, cx + net * scale, ny, F, {
        width: 4, label: `net ${net.toFixed(0)} N`,
      });
    } else if (band !== "K-2" && state.hasMoved === false && Math.abs(state.applied) > 0.5) {
      label(ctx, "forces balance — no movement", cx, by - 30, theme, {
        align: "center", color: theme.inkSoft, size: 11,
      });
    }
  }

  if (overlays.velocity && Math.abs(state.v) > 0.05) {
    const vy = by - 54;
    arrow(ctx, X(state.x), vy, X(state.x) + state.v * 26, vy, theme.sci["velocity"], {
      width: 3, label: band === "K-2" ? undefined : `${state.v.toFixed(1)} m/s`,
    });
  }

  // ---- Numbers ---------------------------------------------------------------
  if (band === "6-8" || band === "9-12") {
    const net = state.applied + state.friction;
    label(ctx, `a = ${state.a.toFixed(2)} m/s²`, 14, 22, theme, { color: theme.sci["acceleration"] });
    if (band === "9-12") {
      label(ctx, `F_net = ${net.toFixed(1)} N = ${m.toFixed(0)} kg × ${state.a.toFixed(2)} m/s²`, 14, 44, theme, {
        color: theme.inkSoft, size: 11,
      });
      const { muS, muK } = coefficients(params);
      label(ctx, `μs = ${muS.toFixed(2)}   μk = ${muK.toFixed(2)}`, 14, 64, theme, {
        color: theme.inkSoft, size: 11,
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const forcesSim: SimManifest<State> = {
  id: "phys.forces",
  title: "Forces & Newton's Laws",
  tagline: "Push the box, watch every arrow, and find out what a force really does.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["3-PS2-1", "MS-PS2-2", "HS-PS2-1"], ccssMath: ["8.EE.B.5", "HSA.CED.A.2"] },
  learningGoals: [
    "Identify every force acting on a box and draw them to scale.",
    "Use F_net = m × a to predict acceleration from the forces.",
    "Explain why a moving object does not need a force to keep moving.",
    "Distinguish the force needed to start something from the force needed to keep it sliding.",
  ],
  misconceptions: [
    "Motion requires a continuous force",
    "A constant push gives a constant speed",
    "Heavier objects always need more force to keep moving at a steady speed",
    "Friction disappears once something is moving",
  ],
  interactionHint: "Press play, then turn the push off and watch what happens.",
  params: {
    appliedForce: {
      type: "number", label: "Push force", kind: "force", unit: "N",
      min: -300, max: 300, step: 5, default: 80,
      help: "Positive pushes right, negative pushes left. Zero is no push at all.",
    },
    pushing: {
      type: "boolean", label: "Pushing", default: true,
      help: "Let go and see whether the box keeps moving.",
    },
    mass: {
      type: "number", label: "Box mass", kind: "mass", unit: "kg",
      min: 5, max: 100, step: 5, default: 20,
    },
    surface: {
      type: "option", label: "Surface",
      options: [
        { value: "ice", label: "Ice" },
        { value: "wood", label: "Wood" },
        { value: "carpet", label: "Carpet" },
        { value: "custom", label: "Custom" },
      ],
      default: "wood",
      help: "Rougher surfaces grip harder, so friction is bigger.",
    },
    friction: {
      type: "number", label: "Friction coefficient", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.3,
      bands: ["9-12"],
      help: "Only used when the surface is set to Custom. Static friction is 1.3× this.",
    },
    gravity: {
      type: "number", label: "Gravity", kind: "acceleration", unit: "m/s²",
      min: 1.6, max: 25, step: 0.01, default: CONSTANTS.g,
      bands: ["9-12"],
      marks: [
        { value: 1.62, label: "Moon" },
        { value: 9.81, label: "Earth" },
      ],
      help: "Friction depends on weight, so gravity changes it too.",
    },
    targetX: {
      type: "number", label: "Target position", kind: "length", unit: "m",
      min: 5, max: 32, step: 1, default: 20,
    },
  },
  overlays: [
    { key: "forces", label: "Force arrows", default: true },
    { key: "velocity", label: "Speed arrow", default: true },
    { key: "ruler", label: "Distance ruler", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "f-equals-ma",
      title: "Discover F = ma",
      question: "What exactly does a force do to a box — set its speed, or change it?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-PS2-2", "HS-PS2-1"],
      setup: {
        appliedForce: 20, pushing: true, mass: 20, surface: "ice",
        friction: 0.3, gravity: CONSTANTS.g, targetX: 20,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict what a steady push does",
          instruction: "The surface is ice, so friction is tiny.",
          predict: {
            prompt: "You hold the push force steady. The box will...",
            options: [
              "move at a steady speed",
              "speed up steadily",
              "speed up then level off",
              "not move at all",
            ],
            correct: 1,
            reveal: "It speeds up steadily. A steady net force gives a steady acceleration, not a steady speed — the single most useful idea in mechanics.",
          },
        },
        {
          id: "force",
          phase: "measure",
          title: "Change the force",
          instruction: "At 20 kg, record the acceleration for 20, 40, 60 and 80 N.",
          requireData: 4,
          hints: [
            "Read the acceleration chip, not the speed — the speed keeps changing.",
            "Record the net force alongside it. Friction takes a small slice.",
          ],
        },
        {
          id: "mass",
          phase: "measure",
          title: "Now change the mass",
          instruction: "Hold the force at 80 N. Record at 20, 40 and 80 kg.",
          requireData: 7,
          check: {
            describe: "Box mass is 60 kg or more",
            test: (v) => (v.params.mass as number) >= 60,
          },
          hints: ["Doubling the mass should do something very simple to the acceleration."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the pattern",
          instruction: "Work out net force ÷ acceleration for every row.",
          write: {
            prompt: "What is net force ÷ acceleration for each row, and what does it equal?",
            placeholder: "Every row gave ... which matches the ...",
          },
        },
        {
          id: "letgo",
          phase: "measure",
          title: "Let go on the ice",
          instruction: "Turn the push off while the box is moving. What happens?",
          check: {
            describe: "The push is switched off",
            test: (v) => v.params.pushing === false,
          },
          hints: ["Nearly nothing stops it. It does not need a push to keep moving."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write both laws",
          instruction: "Write what happens with a force, and what happens without one.",
          write: {
            prompt: "Write the rule connecting net force, mass and acceleration — and say what happens when the net force is zero.",
            placeholder: "Net force = ... When the net force is zero the box ...",
          },
        },
      ],
    },
    {
      id: "start-moving",
      title: "When does it start moving?",
      question: "Why does the box sometimes refuse to budge, even when you push it?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["3-PS2-1", "MS-PS2-2"],
      setup: {
        appliedForce: 20, pushing: true, mass: 20, surface: "carpet",
        friction: 0.3, gravity: CONSTANTS.g, targetX: 20,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the moment it moves",
          instruction: "A 20 kg box sits on carpet. You push gently, then harder.",
          predict: {
            prompt: "While you push gently and nothing moves, the friction force is...",
            options: ["zero", "exactly as big as your push", "as big as it can possibly be"],
            correct: 1,
            reveal: "Friction grows to match your push exactly, right up to its limit. That is why nothing moves and the arrows cancel.",
          },
        },
        {
          id: "creep",
          phase: "measure",
          title: "Creep the force up",
          instruction: "Raise the push 10 N at a time. Record just before and just after it moves.",
          requireData: 4,
          hints: [
            "Watch the friction arrow: it grows to match your push until it cannot.",
            "The breaking point is μs × weight. On carpet that is about 0.78 × 196 N.",
          ],
        },
        {
          id: "ease",
          phase: "measure",
          title: "Now ease off",
          instruction: "Once it slides, lower the push. Does it keep sliding below the starting force?",
          requireData: 5,
          hints: ["Kinetic friction is smaller than static friction. That is why it keeps going."],
        },
        {
          id: "surface",
          phase: "measure",
          title: "Swap to ice",
          instruction: "Change the surface to ice and find the new breaking point.",
          check: {
            describe: "The surface is ice",
            test: (v) => v.params.surface === "ice",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the two frictions",
          instruction: "Say what decides when the box starts, and why it is easier after that.",
          write: {
            prompt: "What sets the force needed to start the box, and why is less force needed once it slides?",
            placeholder: "The box starts moving when ... Once it slides ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "park-it",
      title: "Park it on the target",
      brief: "Bring the box to a complete stop with its centre in the target zone.",
      bands: ["3-5", "6-8", "9-12"],
      setup: {
        appliedForce: 80, pushing: true, mass: 20, surface: "wood",
        friction: 0.3, gravity: CONSTANTS.g, targetX: 20,
      },
      goal: {
        describe: "Stopped within 0.5 m of the target",
        test: (v) =>
          Boolean(v.facts.stopped) && Boolean(v.facts.hasMoved) &&
          (v.facts.distanceToTarget as number) <= 0.5,
      },
      stars: {
        two: {
          describe: "Stopped within 0.2 m",
          test: (v) =>
            Boolean(v.facts.stopped) && Boolean(v.facts.hasMoved) &&
            (v.facts.distanceToTarget as number) <= 0.2,
        },
        three: {
          describe: "Stopped within 0.05 m",
          test: (v) =>
            Boolean(v.facts.stopped) && Boolean(v.facts.hasMoved) &&
            (v.facts.distanceToTarget as number) <= 0.05,
        },
      },
      hints: [
        "Friction only stops the box once you stop pushing.",
        "Turn the push off early and let friction do the braking.",
        "You can also push backwards to brake harder.",
      ],
    },
    {
      id: "ice-stop",
      title: "Stop it on the ice",
      brief: "Same job, but on ice — where letting go is nowhere near enough.",
      bands: ["6-8", "9-12"],
      setup: {
        appliedForce: 60, pushing: true, mass: 20, surface: "ice",
        friction: 0.3, gravity: CONSTANTS.g, targetX: 25,
      },
      goal: {
        describe: "Stopped within 0.5 m of the target, on ice",
        test: (v) =>
          v.params.surface === "ice" && Boolean(v.facts.stopped) &&
          Boolean(v.facts.hasMoved) && (v.facts.distanceToTarget as number) <= 0.5,
      },
      stars: {
        two: {
          describe: "Within 0.2 m on ice",
          test: (v) =>
            v.params.surface === "ice" && Boolean(v.facts.stopped) &&
            Boolean(v.facts.hasMoved) && (v.facts.distanceToTarget as number) <= 0.2,
        },
      },
      hints: [
        "Ice barely slows the box at all. Something else has to do the stopping.",
        "A negative push force pushes back the other way.",
        "Brake for about as long as you accelerated.",
      ],
    },
  ],
};
