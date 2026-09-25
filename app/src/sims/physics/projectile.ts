import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, camera, grid } from "@ui/draw";
import {
  badge, caption, comet, contactShadow, groundPlane, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Projectile Launcher — Grades 6-12.
 *
 * Launch a projectile at any angle and speed, with optional air resistance,
 * and discover for yourself that the horizontal and vertical motions are
 * independent. Confronts the very common belief that a heavier object falls
 * faster, and that a projectile "runs out of push" at the top of its arc.
 */

interface Body {
  x: number; y: number;   // m
  vx: number; vy: number; // m/s
  flying: boolean;
  landed: boolean;
  peak: number;           // m, highest point reached
  range: number;          // m, horizontal distance at landing
  flightTime: number;     // s
}

interface State {
  body: Body;
  path: { x: number; y: number }[];
  /** Frozen paths from previous shots, so students can compare attempts. */
  ghosts: { x: number; y: number }[][];
  target: number; // m, x-position of the target
  hits: number;
  shots: number;
  lastLaunchArmed: boolean;
}

const MAX_PATH = 900;

function launchBody(params: Record<string, number | boolean | string>): Body {
  const speed = params.speed as number;
  const angle = params.angle as number; // radians
  const h0 = params.height as number;
  return {
    x: 0,
    y: h0,
    vx: speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    flying: true,
    landed: false,
    peak: h0,
    range: 0,
    flightTime: 0,
  };
}

const model: SimModel<State> = {
  init(params) {
    return {
      body: { ...launchBody(params), flying: false },
      path: [],
      ghosts: [],
      target: params.target as number,
      hits: 0,
      shots: 0,
      lastLaunchArmed: true,
    };
  },

  applyParams(state, params, prev) {
    // Moving the target should not disturb a shot in flight.
    const next = { ...state, target: params.target as number };
    if (state.body.flying) return next;
    // Re-aim the (not yet launched) projectile as the student explores.
    if (
      params.speed !== prev.speed || params.angle !== prev.angle ||
      params.height !== prev.height || params.gravity !== prev.gravity ||
      params.drag !== prev.drag || params.mass !== prev.mass
    ) {
      return { ...next, body: { ...launchBody(params), flying: false }, path: [] };
    }
    return next;
  },

  step(state, dt, params, ctx, inputs) {
    let s = state;

    for (const input of inputs) {
      if (input.type === "action" && input.action === "launch") {
        const ghosts = s.path.length > 3 ? [s.path, ...s.ghosts].slice(0, 3) : s.ghosts;
        s = {
          ...s,
          ghosts,
          body: launchBody(params),
          path: [],
          shots: s.shots + 1,
          lastLaunchArmed: false,
        };
      }
      if (input.type === "action" && input.action === "clearGhosts") {
        s = { ...s, ghosts: [] };
      }
    }

    const b = s.body;
    if (!b.flying) return s;

    const g = params.gravity as number;
    const mass = params.mass as number;
    const dragOn = params.drag as boolean;
    // A simple quadratic drag model: enough to show that shape and speed
    // matter, without pretending to be a wind-tunnel.
    const k = dragOn ? 0.02 : 0;

    const speed = Math.hypot(b.vx, b.vy);
    const ax = -(k * speed * b.vx) / mass;
    const ay = -g - (k * speed * b.vy) / mass;

    // Semi-implicit Euler: stable and exactly reversible enough for teaching.
    const vx = b.vx + ax * dt;
    const vy = b.vy + ay * dt;
    let x = b.x + vx * dt;
    let y = b.y + vy * dt;

    let flying = true;
    let landed = false;
    let range = b.range;
    let flightTime = b.flightTime + dt;

    if (y <= 0 && vy < 0) {
      // Land exactly on the ground rather than a frame past it.
      const prevY = b.y;
      const frac = prevY > 0 ? prevY / (prevY - y) : 0;
      x = b.x + (x - b.x) * frac;
      y = 0;
      flying = false;
      landed = true;
      range = x;
      flightTime = b.flightTime + dt * frac;
    }

    const path = s.path.length >= MAX_PATH ? s.path.slice(1) : s.path.slice();
    path.push({ x, y });

    const noise = ctx.messiness > 0 ? 1 + ctx.rng.normal(0, 0.004 * ctx.messiness) : 1;

    const body: Body = {
      x: x * noise, y, vx, vy, flying, landed,
      peak: Math.max(b.peak, y),
      range, flightTime,
    };

    let hits = s.hits;
    if (landed) {
      const tolerance = 0.5;
      if (Math.abs(body.x - s.target) <= tolerance) hits += 1;
    }

    return { ...s, body, path, hits };
  },

  readouts(state, params) {
    const b = state.body;
    const speed = Math.hypot(b.vx, b.vy);
    return [
      { key: "x", label: "Distance", quantity: q(b.x, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "y", label: "Height", quantity: q(b.y, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "vx", label: "Horizontal speed", quantity: q(b.vx, "velocity"), unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"] },
      { key: "vy", label: "Vertical speed", quantity: q(b.vy, "velocity"), unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"] },
      { key: "speed", label: "Speed", quantity: q(speed, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "peak", label: "Highest point", quantity: q(b.peak, "length"), unit: "m", semantic: "distance", graphable: false },
      { key: "range", label: "Range", quantity: q(b.range, "length"), unit: "m", semantic: "distance", graphable: false },
      { key: "flightTime", label: "Time in air", quantity: q(b.flightTime, "time"), unit: "s", semantic: "time", graphable: false },
      {
        key: "ke", label: "Kinetic energy",
        quantity: q(0.5 * (params.mass as number) * speed * speed, "energy"),
        unit: "J", semantic: "energy-kinetic", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state) {
    return {
      landed: state.body.landed,
      flying: state.body.flying,
      shots: state.shots,
      hits: state.hits,
      range: state.body.range,
      peak: state.body.peak,
      flightTime: state.body.flightTime,
      distanceToTarget: Math.abs(state.body.x - state.target),
    };
  },
};

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const g = params.gravity as number;
  const speed = params.speed as number;
  const launchH = params.height as number;

  // Frame the world around the flight that is actually going to happen, so the
  // arc fills the stage instead of hugging the floor of an empty box.
  const estRange = Math.max(20, (speed * speed * 1.15) / Math.max(g, 0.5));
  const worldW = Math.max(estRange, state.target * 1.25, state.body.x * 1.12, 25);
  const apex = (speed * Math.sin(params.angle as number)) ** 2 / (2 * Math.max(g, 0.5)) + launchH;
  const worldH = Math.max(apex * 1.5, state.body.y * 1.2, worldW * 0.3, 8);
  const cam = camera({
    x0: -worldW * 0.05, y0: -worldH * 0.14, x1: worldW * 1.02, y1: worldH,
    width, height, square: false,
  });
  const groundY = cam.toScreenY(0);

  /* ---- the place ---- */
  sky(ctx, width, height, theme, g < 3 ? "space" : "day", groundY);
  groundPlane(ctx, groundY, 0, width, height, theme, g < 3 ? "rock" : "grass");

  const spacing = worldW > 160 ? 40 : worldW > 80 ? 20 : worldW > 40 ? 10 : 5;
  if (overlays.grid) {
    grid(ctx, cam, theme, { spacing, x0: 0, y0: 0, x1: worldW, y1: worldH, labels: band !== "K-2" });
  }

  /* ---- previous attempts, so comparison is a first-class action ---- */
  if (overlays.ghosts) {
    for (const gPath of state.ghosts) {
      if (gPath.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = theme.inkSoft;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cam.toScreenX(gPath[0].x), cam.toScreenY(gPath[0].y));
      for (const pt of gPath) ctx.lineTo(cam.toScreenX(pt.x), cam.toScreenY(pt.y));
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---- target ---- */
  const tx = cam.toScreenX(state.target);
  const flag = theme.sci["acceleration"];
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tx, groundY);
  ctx.lineTo(tx, groundY - 34);
  ctx.stroke();
  ctx.fillStyle = flag;
  ctx.beginPath();
  ctx.moveTo(tx, groundY - 34);
  ctx.lineTo(tx + 22, groundY - 27);
  ctx.lineTo(tx, groundY - 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // A ring on the ground makes "did it land on target?" readable at a glance.
  ctx.save();
  ctx.strokeStyle = hexA(flag, 0.7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(tx, groundY, 14, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* ---- flight path as a tapering trail ---- */
  const b = state.body;
  if (state.path.length > 1) {
    comet(
      ctx,
      state.path.map((pt) => ({ x: cam.toScreenX(pt.x), y: cam.toScreenY(pt.y) })),
      theme.accent, 3.5,
    );
  }

  /* ---- launcher ---- */
  const angle = params.angle as number;
  const originX = cam.toScreenX(0);
  const originY = cam.toScreenY(launchH);
  if (launchH > 0.05) {
    material(ctx, originX - 9, originY, 18, groundY - originY, theme.inkSoft, 3);
  }
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX + Math.cos(angle) * 38, originY - Math.sin(angle) * 38);
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.surface, 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX + Math.cos(angle) * 38, originY - Math.sin(angle) * 38);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, originX, originY, 7, theme.inkSoft);

  /* ---- the projectile, with a shadow that tracks its height ---- */
  const px = cam.toScreenX(b.x);
  const py = cam.toScreenY(b.y);
  const r = band === "K-2" ? 13 : 10;
  contactShadow(ctx, px, groundY, r, groundY - py);
  sphere(ctx, px, py, r, theme.accent, { glow: b.flying ? 0.5 : 0 });

  /* ---- velocity components: the whole point of the sim ---- */
  if (overlays.vectors && b.flying) {
    const vScale = Math.min(3.2, 90 / Math.max(8, Math.hypot(b.vx, b.vy)));
    if (band === "6-8" || band === "9-12") {
      arrow(ctx, px, py, px + b.vx * vScale, py, theme.sci["velocity"], { width: 1.6, dashed: true });
      arrow(ctx, px, py, px, py - b.vy * vScale, theme.sci["velocity"], { width: 1.6, dashed: true });
    }
    arrow(ctx, px, py, px + b.vx * vScale, py - b.vy * vScale, theme.sci["velocity"], {
      label: band === "9-12" ? "v" : undefined,
    });
  }
  if (overlays.gravityVector && b.flying && band === "9-12") {
    arrow(ctx, px, py, px, py + 40, theme.sci["force"], { label: "mg" });
  }

  /* ---- live numbers, placed on the scene beside what they describe ---- */
  if (b.flying && band !== "K-2") {
    badge(ctx, px, py - r - 20, `${b.y.toFixed(1)} m`, theme, {
      align: "center", color: theme.sci["velocity"],
    });
  }
  if (b.peak > 0.2 && band !== "K-2") {
    const peakY = cam.toScreenY(b.peak);
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(cam.toScreenX(-worldW * 0.05), peakY);
    ctx.lineTo(width, peakY);
    ctx.stroke();
    ctx.restore();
    caption(ctx, 12, peakY - 11, `highest  ${b.peak.toFixed(1)} m`, theme, {
      size: 11, color: theme.inkSoft,
    });
  }

  /* ---- landing ---- */
  if (b.landed && band !== "K-2") {
    badge(ctx, cam.toScreenX(b.range), groundY + 22, `${b.range.toFixed(1)} m`, theme, {
      align: "center", sub: "range",
    });
  }
  if (b.landed && Math.abs(b.x - state.target) <= 0.5) {
    caption(ctx, tx, groundY - 56, "Hit!", theme, {
      align: "center", size: 20, color: theme.sci["energy-kinetic"], weight: 800,
    });
  }

  vignette(ctx, width, height, 0.14);
}

export const projectileSim: SimManifest<State> = {
  id: "phys.projectile",
  title: "Projectile Launcher",
  tagline: "Launch it, watch the arc, and find out what really controls where it lands.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS2-2", "HS-PS2-1"], ccssMath: ["HSF.IF.B.4", "HSA.CED.A.2"] },
  learningGoals: [
    "Predict how launch angle and speed change where a projectile lands.",
    "Explain that horizontal and vertical motion are independent.",
    "Show that mass alone does not change the path when air resistance is off.",
  ],
  misconceptions: [
    "Heavier objects fall faster",
    "A projectile keeps a forward push that runs out",
    "The projectile stops moving horizontally at the top of the arc",
  ],
  interactionHint: "Set an angle and speed, then press Launch.",
  params: {
    speed: {
      type: "number", label: "Launch speed", kind: "velocity", unit: "m/s",
      min: 2, max: 40, step: 0.5, default: 18,
    },
    angle: {
      type: "number", label: "Launch angle", kind: "angle", unit: "°",
      min: 0, max: Math.PI / 2, step: Math.PI / 180, default: Math.PI / 4,
      marks: [
        { value: Math.PI / 12, label: "15°" },
        { value: Math.PI / 4, label: "45°" },
        { value: (5 * Math.PI) / 12, label: "75°" },
      ],
    },
    mass: {
      type: "number", label: "Mass", kind: "mass", unit: "kg",
      min: 0.1, max: 20, step: 0.1, default: 2,
      bands: ["3-5", "6-8", "9-12"],
      help: "With air resistance off, mass does not change the path at all. Try it.",
    },
    height: {
      type: "number", label: "Launch height", kind: "length", unit: "m",
      min: 0, max: 20, step: 0.5, default: 0, bands: ["6-8", "9-12"],
    },
    gravity: {
      type: "number", label: "Gravity", kind: "acceleration", unit: "m/s²",
      min: 1.6, max: 25, step: 0.1, default: CONSTANTS.g, bands: ["6-8", "9-12"],
      marks: [
        { value: 1.62, label: "Moon" },
        { value: 3.72, label: "Mars" },
        { value: 9.81, label: "Earth" },
        { value: 24.79, label: "Jupiter" },
      ],
    },
    drag: {
      type: "boolean", label: "Air resistance", default: false, bands: ["6-8", "9-12"],
      help: "Turn this on and mass suddenly matters.",
    },
    target: {
      type: "number", label: "Target distance", kind: "length", unit: "m",
      min: 5, max: 120, step: 1, default: 30,
    },
  },
  overlays: [
    { key: "vectors", label: "Velocity arrows", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "gravityVector", label: "Force of gravity", default: false, bands: ["9-12"] },
    { key: "grid", label: "Grid", default: true, bands: ["6-8", "9-12"] },
    { key: "ghosts", label: "Previous shots", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "angle-range",
      title: "Which angle goes furthest?",
      question: "If the launch speed stays the same, which angle sends the projectile furthest?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-2"],
      setup: { speed: 18, angle: Math.PI / 12, mass: 2, height: 0, gravity: CONSTANTS.g, drag: false, target: 30 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Make a prediction",
          instruction: "Before launching anything, commit to an answer.",
          predict: {
            prompt: "With the same launch speed, which angle gives the longest range?",
            options: ["15°", "30°", "45°", "60°", "75°"],
            correct: 2,
            reveal: "45° wins on flat ground with no air resistance, because range depends on sin(2θ), which peaks at 2θ = 90°.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Test five angles",
          instruction: "Launch at 15°, 30°, 45°, 60° and 75°. Record the range after each landing.",
          requireData: 5,
          hints: [
            "Keep the speed fixed — change only the angle. That is what makes it a fair test.",
            "Wait until the projectile lands before you press Record.",
            "Use the angle marks under the slider to jump straight to each value.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the pattern",
          instruction: "Look at your recorded ranges. Which angle won? What do 30° and 60° have in common?",
          write: {
            prompt: "Which angle gave the longest range, and what did you notice about 30° and 60°?",
            placeholder: "The longest range was at ... and I noticed that ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Write a rule someone else could follow.",
          write: {
            prompt: "Write a rule connecting launch angle to range. When would your rule stop working?",
            placeholder: "The range is largest when ... My rule would break if ...",
          },
          hints: ["Think about what changes when you switch air resistance on, or launch from a cliff."],
        },
      ],
    },
    {
      id: "mass-myth",
      title: "Does a heavier ball fall faster?",
      question: "Does changing the mass change where the projectile lands?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 15,
      setup: { speed: 16, angle: Math.PI / 4, mass: 0.5, height: 0, gravity: CONSTANTS.g, drag: false, target: 26 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "What do you think?",
          instruction: "Answer before you test it.",
          predict: {
            prompt: "You launch a 0.5 kg ball and a 20 kg ball exactly the same way, with air resistance off. What happens?",
            options: [
              "The heavy one lands much sooner",
              "The heavy one goes further",
              "They land in exactly the same place",
            ],
            correct: 2,
            reveal: "They land together. Gravity pulls harder on more mass, but more mass is also harder to accelerate, and the two effects cancel exactly.",
          },
        },
        {
          id: "light",
          phase: "measure",
          title: "Launch the light one",
          instruction: "Launch with mass 0.5 kg and record the range.",
          requireData: 1,
        },
        {
          id: "heavy",
          phase: "measure",
          title: "Now the heavy one",
          instruction: "Set mass to 20 kg, keep everything else the same, launch and record.",
          requireData: 2,
          check: {
            describe: "Mass is set above 10 kg",
            test: (v) => (v.params.mass as number) >= 10,
          },
          hints: ["Change only the mass. Speed and angle must stay exactly where they were."],
        },
        {
          id: "drag",
          phase: "analyze",
          title: "Now switch air resistance on",
          instruction: "Turn on Air resistance and launch both masses again. Does mass matter now?",
          check: {
            describe: "Air resistance is on",
            test: (v) => v.params.drag === true,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what mass really does",
          instruction: "Write down when mass changes the flight, and when it does not.",
          write: {
            prompt: "When does mass change where the projectile lands, and why?",
            placeholder: "Without air resistance ... but with air resistance ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hit-target",
      title: "Hit the target",
      brief: "Land the projectile within half a metre of the flag.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { speed: 15, angle: Math.PI / 5, target: 34 },
      goal: {
        describe: "Land within 0.5 m of the target",
        test: (v) => Boolean(v.facts.landed) && (v.facts.distanceToTarget as number) <= 0.5,
      },
      stars: {
        two: {
          describe: "Land within 0.25 m",
          test: (v) => Boolean(v.facts.landed) && (v.facts.distanceToTarget as number) <= 0.25,
        },
        three: {
          describe: "Land within 0.1 m",
          test: (v) => Boolean(v.facts.landed) && (v.facts.distanceToTarget as number) <= 0.1,
        },
      },
      hints: [
        "If you fall short, you need more speed or an angle nearer 45°.",
        "Angles that add to 90° (like 30° and 60°) reach the same distance — one arcs higher.",
      ],
    },
    {
      id: "moon-shot",
      title: "Moon shot",
      brief: "Set gravity to the Moon and land a shot beyond 100 m.",
      bands: ["6-8", "9-12"],
      setup: { gravity: 1.62, speed: 14, angle: Math.PI / 4, target: 100 },
      goal: {
        describe: "Range beyond 100 m under Moon gravity",
        test: (v) => Boolean(v.facts.landed) && (v.facts.range as number) > 100 && (v.params.gravity as number) < 2,
      },
      hints: ["Moon gravity is about one sixth of Earth's. The same launch goes roughly six times as far."],
    },
  ],
};
