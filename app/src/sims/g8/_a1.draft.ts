import type {
  ParamValues, RenderContext, SimContext, SimInput, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { arrow, camera, mixHex, roundRect } from "@ui/draw";
import {
  badge, bevelRect, caption, clamp01, comet, contactShadow, dashFlow, easeInOut,
  glass, glow, gradientFill, gridPaper, groundPlane, hexA, innerGlow, isDarkTheme,
  labelLeader, material, metal, noiseWash, plastic, pulse, ribbon, rimLight, sky,
  softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 8 · Unit A · Topic A1 — Describing motion.
 *
 * Five simulations, one topic. Before a student can argue about forces they
 * have to be able to say, precisely, what an object is doing — and the words
 * that sound interchangeable in everyday speech (distance and displacement,
 * speed and velocity, "how fast" and "how fast relative to what") are exactly
 * the ones that are not.
 *
 *   A1.1  Distance vs displacement          → Odometer and Arrow
 *                                           → The Dispatch Yard
 *   A1.2  Speed vs velocity                 → Odometer and Arrow
 *                                           → The Dispatch Yard
 *   A1.3  Reading a position-time graph     → Build the Journey
 *   A1.4  Reference frames                  → Whose Speed Is It
 *   A1.5  Calculating average speed         → Build the Journey
 *                                           → Photogate Straightaway
 *
 * Every number a student reads here is one they could check against a book: an
 * adult walking pace of 1.4 m/s, an intercity train at 30 m/s (108 km/h), a
 * club cyclist cruising at 6 m/s, a 400 m running track, a lap that returns
 * you to the start with a displacement of exactly zero.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

/** Fixed-decimal formatting. Nothing on a stage is ever a raw float. */
function fx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(dp);
  // Kill the "-0.0" that shows up whenever a value settles onto zero.
  return s === (0).toFixed(dp).replace(/^/, "-") ? (0).toFixed(dp) : s;
}

/** Fixed-decimal with an explicit sign, for anything that can run backwards. */
function fsx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  const r = Number(v.toFixed(dp));
  return `${r > 0 ? "+" : r < 0 ? "" : ""}${r.toFixed(dp)}`;
}

/** Break a sentence onto lines that fit a width, using the live font. */

/** Positive modulo — the wrap every scrolling scene in this file needs. */

interface Pt { x: number; y: number }

/** Sample a smooth cubic-ish hump, used for distant terrain silhouettes. */

/* ================================================================== *
 * A1.1 + A1.2 — Odometer and Arrow
 *
 * A courier walks a chosen route across a park. The odometer counts every
 * metre of path; a single arrow runs straight from the start to wherever the
 * courier is now. On an out-and-back the two numbers could not disagree more
 * loudly: the odometer reads 80 m and the arrow has collapsed to nothing.
 * ================================================================== */

type RouteId = "straight" | "dogleg" | "outback" | "loop" | "zigzag";

const ROUTE_LABEL: Record<RouteId, string> = {
  straight: "Straight to the gate",
  dogleg: "Turn at the corner",
  outback: "There and back again",
  loop: "Once around the block",
  zigzag: "Zig-zag across the lawn",
};

function routePoints(route: RouteId, L: number): Pt[] {
  const W = L * 0.62;
  switch (route) {
    case "straight": return [{ x: 0, y: 0 }, { x: L, y: 0 }];
    case "dogleg": return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }];
    case "outback": return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: 0, y: 0 }];
    case "loop": return [
      { x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }, { x: 0, y: W }, { x: 0, y: 0 },
    ];
    case "zigzag": default: return [
      { x: 0, y: 0 }, { x: L * 0.34, y: W }, { x: L * 0.67, y: 0 }, { x: L, y: W },
    ];
  }
}

function polyLength(pts: Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return total;
}

/** Position and unit heading a distance `s` along a polyline. */
function walkAlong(pts: Pt[], s: number): { x: number; y: number; hx: number; hy: number } {
  let rem = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.hypot(dx, dy) || 1e-9;
    if (rem <= len || i === pts.length - 1) {
      const f = Math.min(1, rem / len);
      return {
        x: pts[i - 1].x + dx * f, y: pts[i - 1].y + dy * f,
        hx: dx / len, hy: dy / len,
      };
    }
    rem -= len;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, hx: 1, hy: 0 };
}

/** The part of the route already walked, as a polyline for the trail. */
function traversed(pts: Pt[], s: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let rem = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.hypot(dx, dy) || 1e-9;
    if (rem >= len) {
      out.push(pts[i]);
      rem -= len;
    } else {
      const f = rem / len;
      out.push({ x: pts[i - 1].x + dx * f, y: pts[i - 1].y + dy * f });
      return out;
    }
  }
  return out;
}

interface RouteState {
  s: number;          // m walked along the path
  elapsed: number;    // s since this trip started
  holding: boolean;   // finished, showing the result before restarting
  hold: number;       // s spent holding
  trips: number;
}

const routeModel: SimModel<RouteState> = {
  init() {
    return { s: 0, elapsed: 0, holding: false, hold: 0, trips: 0 };
  },

  applyParams(state, params, prev) {
    if (params.route !== prev.route || params.legLength !== prev.legLength) {
      return { s: 0, elapsed: 0, holding: false, hold: 0, trips: state.trips };
    }
    return state;
  },

  step(state, dt, params, ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "action" && input.action === "launch") {
        s = { ...s, s: 0, elapsed: 0, holding: false, hold: 0 };
      }
    }

    const pts = routePoints(params.route as RouteId, params.legLength as number);
    const total = polyLength(pts);
    const pace = params.pace as number;

    if (s.holding) {
      const hold = s.hold + dt;
      if (hold > 2.6) return { s: 0, elapsed: 0, holding: false, hold: 0, trips: s.trips + 1 };
      return { ...s, hold };
    }

    // A real pace wobbles a little; messiness is the platform's noise dial.
    const wobble = ctx.messiness > 0 ? 1 + ctx.rng.normal(0, 0.02 * ctx.messiness) : 1;
    let walked = s.s + pace * wobble * dt;
    let elapsed = s.elapsed + dt;
    if (walked >= total) {
      // Land exactly on the end of the route rather than a frame past it.
      const over = walked - total;
      elapsed -= over / Math.max(pace, 1e-6);
      walked = total;
      return { ...s, s: walked, elapsed, holding: true, hold: 0 };
    }
    return { ...s, s: walked, elapsed };
  },

  readouts(state, params) {
    const pts = routePoints(params.route as RouteId, params.legLength as number);
    const here = walkAlong(pts, state.s);
    const dx = here.x - pts[0].x;
    const dy = here.y - pts[0].y;
    const disp = Math.hypot(dx, dy);
    const t = Math.max(state.elapsed, 1e-6);
    return [
      { key: "distance", label: "Distance travelled", quantity: q(state.s, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "displacement", label: "Displacement", quantity: q(disp, "length"), unit: "m", semantic: "velocity", graphable: true },
      { key: "avgSpeed", label: "Average speed", quantity: q(state.s / t, "velocity"), unit: "m/s", semantic: "distance", graphable: true },
      { key: "avgVelocity", label: "Average velocity", quantity: q(disp / t, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "elapsed", label: "Time walking", quantity: q(state.elapsed, "time"), unit: "s", semantic: "time", graphable: false },
      {
        key: "bearing", label: "Direction from start",
        quantity: q(Math.atan2(dy, dx), "angle"), unit: "°", semantic: "velocity",
        graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const pts = routePoints(params.route as RouteId, params.legLength as number);
    const total = polyLength(pts);
    const here = walkAlong(pts, state.s);
    const disp = Math.hypot(here.x - pts[0].x, here.y - pts[0].y);
    const end = pts[pts.length - 1];
    const t = Math.max(state.elapsed, 1e-6);
    return {
      route: params.route as string,
      distance: state.s,
      displacement: disp,
      routeLength: total,
      routeDisplacement: Math.hypot(end.x - pts[0].x, end.y - pts[0].y),
      avgSpeed: state.s / t,
      avgVelocity: disp / t,
      ratio: state.s > 0.01 ? disp / state.s : 1,
      finished: state.holding,
      trips: state.trips,
      returnsToStart: Math.hypot(end.x - pts[0].x, end.y - pts[0].y) < 0.01,
    };
  },
};

/** Fixed park furniture, in units of the route's leg length. Never random. */
const PARK_TREES: { u: number; v: number; r: number }[] = [
  { u: -0.16, v: 0.34, r: 0.075 }, { u: 0.22, v: 0.86, r: 0.058 },
  { u: 0.58, v: -0.22, r: 0.068 }, { u: 1.14, v: 0.28, r: 0.05 },
  { u: 0.86, v: 0.92, r: 0.062 }, { u: -0.1, v: -0.24, r: 0.045 },
];
const PARK_LAMPS: { u: number; v: number }[] = [
  { u: 0.28, v: -0.12 }, { u: 0.95, v: 0.5 }, { u: -0.06, v: 0.66 },
];

function renderRoute(rc: RenderContext<RouteState>) {
  const { ctx, state, params, theme, width, height, overlays, time } = rc;
  const L = params.legLength as number;
  const pts = routePoints(params.route as RouteId, L);
  const total = polyLength(pts);

  /* ---- frame the camera on the route, with room for the labels ---- */
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  const padX = Math.max((x1 - x0) * 0.2, L * 0.2);
  const padY = Math.max((y1 - y0) * 0.42, L * 0.3);
  const cam = camera({
    x0: x0 - padX, y0: y0 - padY * 0.85, x1: x1 + padX, y1: y1 + padY,
    width, height, square: true,
  });
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);
  const U = cam.scale;

  const distC = theme.sci["distance"];
  const dispC = theme.sci["velocity"];

  /* ---- the place: a park lawn seen from above ---- */
  groundPlane(ctx, 0, 0, width, height + 40, theme, "grass");
  noiseWash(ctx, 0, 0, width, height, { alpha: 0.05, seed: 41, count: 420, size: 1.1 });
  // Mown stripes: the giveaway that this is a lawn and not a green rectangle.
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = -6; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#000000";
    ctx.fillRect(0, Y(y1 + padY) + i * ((height + 80) / 18), width, (height + 80) / 18);
  }
  ctx.restore();

  /* ---- the paved path itself ---- */
  const screenPts = pts.map((p) => ({ x: X(p.x), y: Y(p.y) }));
  const pathW = Math.max(9, U * 2.4);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(screenPts[0].x, screenPts[0].y);
  for (const p of screenPts) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = hexA(theme.ink, 0.22);
  ctx.lineWidth = pathW + 4;
  ctx.stroke();
  ctx.strokeStyle = theme.surfaceAlt;
  ctx.lineWidth = pathW;
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.surface, 0.35);
  ctx.lineWidth = pathW * 0.35;
  ctx.stroke();
  ctx.restore();

  /* ---- trees and lamps, so the park has depth and a light source ---- */
  for (const t of PARK_TREES) {
    const tx = X(t.u * L), ty = Y(t.v * L);
    const r = Math.max(6, t.r * L * U);
    spriteShadowEllipse(ctx, tx + r * 0.5, ty + r * 0.55, r * 1.25, r * 0.42, { alpha: 0.3 });
    sphere(ctx, tx, ty, r, theme.sci["producer"]);
    sphere(ctx, tx - r * 0.28, ty - r * 0.3, r * 0.52, mixHex(theme.sci["producer"], "#ffffff", 0.18));
  }
  for (const lamp of PARK_LAMPS) {
    const lx = X(lamp.u * L), ly = Y(lamp.v * L);
    const flicker = 0.72 + 0.28 * pulse(time + lamp.u * 3, 0.28);
    glow(ctx, lx, ly, Math.max(26, U * 5), theme.sci["light"], 0.2 * flicker);
    material(ctx, lx - 1.6, ly - 16, 3.2, 16, theme.inkSoft, 1.4);
    sphere(ctx, lx, ly - 18, 4.2, theme.sci["light"], { glow: 0.9 * flicker });
  }

  /* ---- the walked part of the route: a trail with direction ---- */
  const walkedPts = traversed(pts, state.s).map((p) => ({ x: X(p.x), y: Y(p.y) }));
  if (walkedPts.length > 1) {
    ribbon(ctx, walkedPts, pathW * 0.72, hexA(distC, 0.5), hexA(distC, 0.2), { taper: 0 });
    if (overlays.flow !== false) {
      dashFlow(ctx, walkedPts, distC, time * 46, { width: 2.4, dash: 7, gap: 9, alpha: 0.9, glow: 3 });
    }
  }

  /* ---- start marker ---- */
  const sx = X(pts[0].x), sy = Y(pts[0].y);
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(9, U * 1.6), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, sx, sy, Math.max(4, U * 0.7), theme.ink);

  /* ---- the courier ---- */
  const here = walkAlong(pts, state.s);
  const px = X(here.x), py = Y(here.y);
  const bob = state.holding ? 0 : Math.sin(time * 7.4) * Math.max(1.2, U * 0.22);
  const r = Math.max(7, U * 1.15);
  contactShadow(ctx, px, py + r * 0.7, r, 6);
  sphere(ctx, px, py - bob, r, theme.accent, { glow: state.holding ? 0.2 : 0.45 });
  // A short heading tick: which way they are facing right now.
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.9);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + here.hx * r, py - bob + here.hy * -r);
  ctx.lineTo(px + here.hx * (r + 9), py - bob - here.hy * (r + 9));
  ctx.stroke();
  ctx.restore();

  /* ---- the displacement arrow: start straight to here ---- */
  const dxW = here.x - pts[0].x, dyW = here.y - pts[0].y;
  const disp = Math.hypot(dxW, dyW);
  if (overlays.displacement !== false && disp > 0.25) {
    ctx.save();
    ctx.setLineDash([]);
    arrow(ctx, sx, sy, px, py, dispC, { width: 3, head: 13 });
    ctx.restore();
    const mx = (sx + px) / 2, my = (sy + py) / 2;
    badge(ctx, mx, my - 20, `${fx(disp, 1)} m`, theme, { align: "center", color: dispC, sub: "displacement" });
  } else if (state.s > 1) {
    badge(ctx, sx, sy - 30, "0.0 m", theme, { align: "center", color: dispC, sub: "displacement" });
  }

  /* ---- live odometer beside the courier ---- */
  badge(ctx, px, py - r - 26 - bob, `${fx(state.s, 1)} m`, theme, {
    align: "center", color: distC, sub: "odometer",
  });

  /* ---- named parts, kept out in the margin on leader lines ---- */
  if (overlays.labels !== false) {
    const midWalk = walkedPts.length > 2 ? walkedPts[Math.floor(walkedPts.length / 2)] : { x: (sx + px) / 2, y: (sy + py) / 2 };
    labelLeader(ctx, midWalk.x, midWalk.y, width - 208, 34, "Distance", theme, {
      color: distC, sub: "every metre of path walked", align: "right",
    });
    labelLeader(ctx, (sx + px) / 2, (sy + py) / 2, width - 208, 84, "Displacement", theme, {
      color: dispC, sub: "straight line, start to here", align: "right",
    });
    labelLeader(ctx, sx, sy, 26, height - 150, "Start", theme, {
      color: theme.inkSoft, align: "left", sub: "the depot door",
    });
  }

  /* ---- the two bars, side by side, at one shared scale ---- */
  const panelW = 232, panelH = 116;
  const panelX = 16, panelY = height - panelH - 16;
  softShadow(ctx, () => {
    bevelRect(ctx, panelX, panelY, panelW, panelH, 10, theme.surfaceAlt, { depth: 1 });
  }, { blur: 14, dy: 5, alpha: 0.26 });
  const scaleMax = Math.max(total, 1);
  const barW = panelW - 100;
  const t = Math.max(state.elapsed, 1e-6);
  const rows: { label: string; value: number; color: string; unit: string }[] = [
    { label: "distance", value: state.s, color: distC, unit: "m" },
    { label: "displacement", value: disp, color: dispC, unit: "m" },
  ];
  rows.forEach((row, i) => {
    const by = panelY + 26 + i * 26;
    caption(ctx, panelX + 12, by, row.label, theme, { size: 11, color: theme.inkSoft });
    const bx = panelX + 88;
    ctx.save();
    ctx.fillStyle = hexA(theme.ink, 0.14);
    roundRect(ctx, bx, by - 6, barW, 12, 6);
    ctx.fill();
    ctx.restore();
    const w = Math.max(0, (row.value / scaleMax) * barW);
    if (w > 1) material(ctx, bx, by - 6, w, 12, row.color, 6);
    caption(ctx, panelX + panelW - 12, by, `${fx(row.value, 1)} ${row.unit}`, theme, {
      size: 11, align: "right", color: row.color,
    });
  });
  caption(ctx, panelX + 12, panelY + 84, `average speed  ${fx(state.s / t, 2)} m/s`, theme, {
    size: 11, color: distC,
  });
  caption(ctx, panelX + 12, panelY + 101, `average velocity  ${fx(disp / t, 2)} m/s`, theme, {
    size: 11, color: dispC,
  });

  /* ---- route name and trip summary ---- */
  caption(ctx, width - 16, height - 20, ROUTE_LABEL[params.route as RouteId], theme, {
    size: 13, align: "right", color: theme.inkSoft,
  });
  if (state.holding) {
    const fade = easeInOut(clamp01(state.hold / 0.45));
    ctx.save();
    ctx.globalAlpha = fade;
    const msg = disp < 0.05
      ? "Back where you started — displacement zero, odometer still counting."
      : `Trip done: ${fx(total, 1)} m walked, ${fx(disp, 1)} m from the start.`;
    caption(ctx, width / 2, 26, msg, theme, { size: 14, align: "center", color: theme.ink, weight: 700 });
    ctx.restore();
  }

  vignette(ctx, width, height, 0.15);
}

export const g8a1OdometerArrow: SimManifest<RouteState> = {
  id: "g8a1-odometer-arrow",
  title: "Odometer and Arrow",
  tagline: "Walk a courier round a park and watch the odometer and the straight-line arrow disagree.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: [
    "Tell distance (path length) apart from displacement (straight line from start to finish).",
    "Show that a closed loop has a displacement of zero however far you walked.",
    "Work out average speed and average velocity from the same trip and explain why they differ.",
  ],
  misconceptions: [
    "Distance and displacement are two words for the same measurement",
    "If you end where you started you did not really travel",
    "Speed and velocity mean the same thing",
    "Displacement is always smaller because the route was careless",
  ],
  interactionHint: "Pick a route and a walking pace, then watch the two numbers pull apart.",
  params: {
    route: {
      type: "option", label: "Route",
      options: [
        { value: "straight", label: "Straight line" },
        { value: "dogleg", label: "Turn a corner" },
        { value: "outback", label: "There and back" },
        { value: "loop", label: "Around the block" },
        { value: "zigzag", label: "Zig-zag" },
      ],
      default: "dogleg",
      help: "Two of these routes finish exactly where they started.",
    },
    pace: {
      type: "number", label: "Walking pace", kind: "velocity", unit: "m/s",
      min: 0.6, max: 6, step: 0.1, default: 1.4,
      marks: [
        { value: 1.4, label: "walk" },
        { value: 3, label: "jog" },
        { value: 5.5, label: "sprint" },
      ],
      help: "An adult walks at about 1.4 m/s, which is 5 km/h.",
    },
    legLength: {
      type: "number", label: "Block size", kind: "length", unit: "m",
      min: 15, max: 90, step: 5, default: 40, bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "displacement", label: "Displacement arrow", default: true },
    { key: "flow", label: "Direction of travel", default: true },
    { key: "labels", label: "Part labels", default: true, bands: ["3-5", "6-8"] },
  ],
  model: routeModel,
  render: renderRoute,
  labs: [
    {
      id: "loop-zero",
      title: "The lap that goes nowhere",
      question: "If you walk a full lap and stop where you started, what was your displacement?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 18,
      standards: ["MS-PS2-2"],
      setup: { route: "straight", pace: 1.4, legLength: 40 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit before you walk",
          instruction: "Answer first. You will test it in a moment.",
          predict: {
            prompt: "A courier walks once around a 40 m by 25 m block and stops at the door they started from. What is their displacement?",
            options: [
              "130 m, the same as the distance",
              "65 m, half the distance",
              "0 m",
              "There is no way to tell",
            ],
            correct: 2,
            reveal: "Displacement is the straight line from start to finish. Finish on top of the start and that line has no length at all — 0 m — even though the odometer read 130 m.",
          },
        },
        {
          id: "straight-first",
          phase: "measure",
          title: "Start with the easy case",
          instruction: "Run the straight route and record it. When the path is a straight line, distance and displacement agree.",
          requireData: 1,
          check: {
            describe: "The straight route has finished",
            test: (v) => v.params.route === "straight" && Boolean(v.facts.finished),
          },
        },
        {
          id: "loop-now",
          phase: "measure",
          title: "Now walk the block",
          instruction: "Switch to Around the block, let the courier finish the lap, and record the row.",
          requireData: 2,
          check: {
            describe: "A full lap has finished with displacement under 0.5 m",
            test: (v) => v.params.route === "loop" && Boolean(v.facts.finished)
              && (v.facts.displacement as number) < 0.5,
          },
          hints: [
            "Wait until the courier is back at the ring on the start marker.",
            "Watch the displacement arrow shrink as the courier comes down the last side.",
          ],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Put the two rows side by side",
          instruction: "Compare your straight row with your lap row. One quantity behaved completely differently.",
          write: {
            prompt: "Which quantity was the same for both routes, and which one collapsed to zero? Why?",
            placeholder: "The distance ... but the displacement ... because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "State the rule in a way a classmate could use on any journey.",
          write: {
            prompt: "Write a rule for when distance and displacement are equal, and when they are not.",
            placeholder: "Distance equals displacement only when ...",
          },
          hints: ["Think about what has to be true about the shape of the path, not its length."],
        },
      ],
    },
    {
      id: "speed-vs-velocity",
      title: "Same trip, two averages",
      question: "Why does the same walk have an average speed of 1.4 m/s but an average velocity of zero?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-2"],
      setup: { route: "outback", pace: 1.4, legLength: 40 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the pair",
          instruction: "The courier walks 40 m out and 40 m straight back, at a steady 1.4 m/s.",
          predict: {
            prompt: "At the moment the courier gets back to the door, what are the average speed and the average velocity?",
            options: [
              "Both 1.4 m/s",
              "Average speed 1.4 m/s, average velocity 0 m/s",
              "Both 0 m/s",
              "Average speed 0 m/s, average velocity 1.4 m/s",
            ],
            correct: 1,
            reveal: "Average speed uses the distance (80 m), average velocity uses the displacement (0 m). Same trip, same clock, two completely different answers — because they are two different questions.",
          },
        },
        {
          id: "halfway",
          phase: "measure",
          title: "Record at the far end",
          instruction: "Record a row when the courier reaches the far end of the out-and-back, before they turn around.",
          requireData: 1,
          hints: ["At the turn, distance and displacement are both 40 m — that is the last moment they agree."],
        },
        {
          id: "return",
          phase: "measure",
          title: "Record at the door",
          instruction: "Let the courier walk all the way back and record a second row at the finish.",
          requireData: 2,
          check: {
            describe: "The out-and-back has finished",
            test: (v) => v.params.route === "outback" && Boolean(v.facts.finished),
          },
        },
        {
          id: "pace-test",
          phase: "analyze",
          title: "Does pace rescue the velocity?",
          instruction: "Raise the pace to a jog and run the out-and-back again. Watch which of the two averages changes.",
          check: {
            describe: "Pace raised to at least 3 m/s",
            test: (v) => (v.params.pace as number) >= 3,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "Write the explanation for someone who thinks the words are interchangeable.",
          write: {
            prompt: "Explain, using your two rows, why average speed and average velocity are different quantities.",
            placeholder: "Average speed is distance divided by time, so ... Average velocity is ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "walk-a-zero",
      title: "Travel far, arrive nowhere",
      brief: "Finish a trip with an odometer above 150 m and a displacement below 0.5 m.",
      bands: ["6-8", "9-12"],
      setup: { route: "loop", pace: 3, legLength: 60 },
      goal: {
        describe: "Trip finished with distance over 150 m and displacement under 0.5 m",
        test: (v) => Boolean(v.facts.finished) && (v.facts.distance as number) > 150
          && (v.facts.displacement as number) < 0.5,
      },
      stars: {
        two: {
          describe: "Distance over 200 m with displacement still under 0.5 m",
          test: (v) => Boolean(v.facts.finished) && (v.facts.distance as number) > 200
            && (v.facts.displacement as number) < 0.5,
        },
        three: {
          describe: "Distance over 280 m with displacement still under 0.5 m",
          test: (v) => Boolean(v.facts.finished) && (v.facts.distance as number) > 280
            && (v.facts.displacement as number) < 0.5,
        },
      },
      hints: [
        "Only routes that end on the start marker can have zero displacement.",
        "The block size slider changes how long the lap is without changing its shape.",
      ],
    },
    {
      id: "efficient-route",
      title: "The honest route",
      brief: "Finish a trip where the displacement is at least 85% of the distance walked.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { route: "zigzag", pace: 1.4, legLength: 40 },
      goal: {
        describe: "Finished with displacement at least 85% of distance",
        test: (v) => Boolean(v.facts.finished) && (v.facts.ratio as number) >= 0.85,
      },
      stars: {
        two: {
          describe: "Displacement at least 95% of distance",
          test: (v) => Boolean(v.facts.finished) && (v.facts.ratio as number) >= 0.95,
        },
        three: {
          describe: "Displacement at least 99.5% of distance",
          test: (v) => Boolean(v.facts.finished) && (v.facts.ratio as number) >= 0.995,
        },
      },
      hints: [
        "Every turn you make costs you displacement without saving any distance.",
        "There is exactly one route shape where the two are equal.",
      ],
    },
  ],
};

/* ================================================================== *
 * A1.3 + A1.5 — Build the Journey
 *
 * A build-it sandbox for graphs. The student assembles a journey out of four
 * motion segments; a rover on a 20 m corridor rail then performs exactly that
 * journey while the position-time graph draws itself underneath, one segment
 * at a time, with the slope triangle of the live segment called out. Reading
 * the graph and building it are the same action here, which is what makes the
 * "steeper means higher up" reading impossible to hold on to.
 * ================================================================== */

type SegKind = "fastF" | "slowF" | "stop" | "slowB" | "fastB";

const SEG_V: Record<SegKind, number> = {
  fastF: 2, slowF: 0.8, stop: 0, slowB: -0.8, fastB: -2,
};
const SEG_LABEL: Record<SegKind, string> = {
  fastF: "fast forward", slowF: "slow forward", stop: "parked",
  slowB: "slow back", fastB: "fast back",
};

const RAIL_MIN = -10;
const RAIL_MAX = 10;
const JOURNEY_DT = 0.04;

interface JourneySample { t: number; x: number; v: number }

interface Journey {
  segs: { v: number; t0: number; t1: number; kind: SegKind }[];
  samples: JourneySample[];
  T: number;
  distance: number;
  displacement: number;
  xStart: number;
  xEnd: number;
  xMin: number;
  xMax: number;
}

function segKinds(params: ParamValues): SegKind[] {
  return [params.seg1, params.seg2, params.seg3, params.seg4].map((s) => s as SegKind);
}

/**
 * Pure: the whole journey, derived from the controls alone. Both the model and
 * the renderer call this, so the rail and the graph can never disagree.
 */
function buildJourney(params: ParamValues): Journey {
  const kinds = segKinds(params);
  const segTime = params.segTime as number;
  const T = segTime * kinds.length;
  const segs = kinds.map((kind, i) => ({
    v: SEG_V[kind], t0: i * segTime, t1: (i + 1) * segTime, kind,
  }));

  const xStart = params.start as number;
  let x = xStart;
  let distance = 0;
  let xMin = x, xMax = x;
  const samples: JourneySample[] = [{ t: 0, x, v: segs[0].v }];
  for (let t = 0; t < T - 1e-9; t += JOURNEY_DT) {
    const idx = Math.min(segs.length - 1, Math.floor((t + 1e-9) / segTime));
    const vWanted = segs[idx].v;
    const step = Math.min(JOURNEY_DT, T - t);
    const nx = Math.max(RAIL_MIN, Math.min(RAIL_MAX, x + vWanted * step));
    // A rover that has reached the buffer stops: its real velocity is zero.
    const vReal = step > 0 ? (nx - x) / step : 0;
    distance += Math.abs(nx - x);
    x = nx;
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
    samples.push({ t: t + step, x, v: vReal });
  }
  return {
    segs, samples, T, distance, displacement: x - xStart,
    xStart, xEnd: x, xMin, xMax,
  };
}

function sampleAt(j: Journey, t: number): JourneySample {
  const clamped = Math.max(0, Math.min(j.T, t));
  const i = Math.min(j.samples.length - 1, Math.max(0, Math.round(clamped / JOURNEY_DT)));
  return j.samples[i];
}

/** Distance actually covered up to time t — needed for the running average. */
function distanceTo(j: Journey, t: number): number {
  const stop = Math.min(j.samples.length - 1, Math.max(0, Math.round(Math.max(0, t) / JOURNEY_DT)));
  let d = 0;
  for (let i = 1; i <= stop; i++) d += Math.abs(j.samples[i].x - j.samples[i - 1].x);
  return d;
}

interface JourneyState {
  t: number;
  hold: number;
  runs: number;
  wheel: number; // rad, so the wheels turn with the distance travelled
}

const journeyModel: SimModel<JourneyState> = {
  init(params) {
    const j = buildJourney(params);
    return { t: params.mode === "scrub" ? (params.scrub as number) * j.T : 0, hold: 0, runs: 0, wheel: 0 };
  },

  applyParams(state, params, prev) {
    const rebuilt = params.seg1 !== prev.seg1 || params.seg2 !== prev.seg2
      || params.seg3 !== prev.seg3 || params.seg4 !== prev.seg4
      || params.segTime !== prev.segTime || params.start !== prev.start;
    if (params.mode === "scrub") {
      const j = buildJourney(params);
      return { ...state, t: (params.scrub as number) * j.T, hold: 0 };
    }
    if (rebuilt) return { ...state, t: 0, hold: 0 };
    return state;
  },

  step(state, dt, params, ctx, inputs) {
    const j = buildJourney(params);
    let s = state;
    for (const input of inputs) {
      if (input.type === "action" && input.action === "launch") s = { ...s, t: 0, hold: 0 };
    }

    if (params.mode === "scrub") {
      const t = (params.scrub as number) * j.T;
      const v = sampleAt(j, t).v;
      return { ...s, t, hold: 0, wheel: s.wheel + v * dt * 4 };
    }

    if (s.hold > 0 || s.t >= j.T - 1e-9) {
      const hold = s.hold + dt;
      if (hold > 1.6) return { ...s, t: 0, hold: 0, runs: s.runs + 1 };
      return { ...s, t: j.T, hold };
    }
    const t = Math.min(j.T, s.t + dt);
    const v = sampleAt(j, t).v;
    void ctx;
    return { ...s, t, wheel: s.wheel + v * dt * 4 };
  },

  readouts(state, params) {
    const j = buildJourney(params);
    const now = sampleAt(j, state.t);
    const t = Math.max(state.t, 1e-6);
    const dist = distanceTo(j, state.t);
    return [
      { key: "position", label: "Position", quantity: q(now.x, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "velocity", label: "Velocity (slope)", quantity: q(now.v, "velocity"), unit: "m/s", semantic: "velocity", graphable: true },
      { key: "distance", label: "Distance so far", quantity: q(dist, "length"), unit: "m", semantic: "distance", graphable: true },
      { key: "displacement", label: "Displacement", quantity: q(now.x - j.xStart, "length"), unit: "m", semantic: "velocity", graphable: true },
      { key: "avgSpeed", label: "Average speed", quantity: q(dist / t, "velocity"), unit: "m/s", semantic: "distance", graphable: true, bands: ["6-8", "9-12"] },
      { key: "avgVelocity", label: "Average velocity", quantity: q((now.x - j.xStart) / t, "velocity"), unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"] },
      { key: "elapsed", label: "Elapsed", quantity: q(state.t, "time"), unit: "s", semantic: "time", graphable: false },
    ];
  },

  facts(state, params) {
    const j = buildJourney(params);
    const now = sampleAt(j, state.t);
    const t = Math.max(state.t, 1e-6);
    const dist = distanceTo(j, state.t);
    const kinds = segKinds(params);
    return {
      position: now.x,
      velocity: now.v,
      distanceSoFar: dist,
      displacement: now.x - j.xStart,
      totalDistance: j.distance,
      totalDisplacement: j.displacement,
      avgSpeed: dist / t,
      avgVelocity: (now.x - j.xStart) / t,
      tripAvgSpeed: j.distance / j.T,
      tripAvgVelocity: j.displacement / j.T,
      elapsed: state.t,
      duration: j.T,
      atEnd: state.t >= j.T - 1e-6,
      runs: state.runs,
      stopSegments: kinds.filter((k) => k === "stop").length,
      backSegments: kinds.filter((k) => k === "slowB" || k === "fastB").length,
      returnsToStart: Math.abs(j.displacement) < 0.05,
      steepestSlope: Math.max(...j.segs.map((s) => Math.abs(s.v))),
    };
  },
};

function renderJourney(rc: RenderContext<JourneyState>) {
  const { ctx, state, params, theme, width, height, overlays, time } = rc;
  const j = buildJourney(params);
  const now = sampleAt(j, state.t);
  const posC = theme.sci["distance"];
  const velC = theme.sci["velocity"];
  const dark = isDarkTheme(theme);

  const topH = Math.round(height * 0.42);
  const railX0 = 56;
  const railW = width - 112;
  const X = (x: number) => railX0 + ((x - RAIL_MIN) / (RAIL_MAX - RAIL_MIN)) * railW;
  const pxPerM = railW / (RAIL_MAX - RAIL_MIN);
  const floorY = topH - 34;

  /* ---- the corridor ---- */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, topH);
  ctx.clip();
  sky(ctx, width, topH, theme, "indoor", floorY);
  // Back wall panelling: two quiet bands so the wall has a surface.
  gradientFill(ctx, 0, 0, width, floorY, [
    hexA(theme.ink, dark ? 0.12 : 0.05), hexA(theme.ink, 0.0),
  ], 90);
  ctx.strokeStyle = hexA(theme.ink, 0.12);
  ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    const wx = Math.round((width * i) / 7) + 0.5;
    ctx.beginPath();
    ctx.moveTo(wx, 6);
    ctx.lineTo(wx, floorY);
    ctx.stroke();
  }
  groundPlane(ctx, floorY, 0, width, topH, theme, "lab");
  noiseWash(ctx, 0, floorY, width, topH - floorY, { alpha: 0.05, seed: 19, count: 200 });
  ctx.restore();

  // Ceiling strip lights, breathing very slightly.
  for (let i = 0; i < 4; i++) {
    const lx = width * (0.14 + i * 0.24);
    const lit = 0.82 + 0.18 * pulse(time + i * 0.7, 0.19);
    glow(ctx, lx, 4, 74, theme.sci["light"], 0.16 * lit);
    material(ctx, lx - 34, 0, 68, 7, mixHex(theme.surfaceAlt, "#ffffff", 0.4), 3);
  }

  /* ---- the floor tape, in metres ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let m = RAIL_MIN; m <= RAIL_MAX; m += 1) {
    const tx = Math.round(X(m)) + 0.5;
    const big = m % 5 === 0;
    ctx.moveTo(tx, floorY + 4);
    ctx.lineTo(tx, floorY + (big ? 15 : 8));
  }
  ctx.stroke();
  ctx.restore();
  for (let m = RAIL_MIN; m <= RAIL_MAX; m += 5) {
    caption(ctx, X(m), floorY + 26, `${m > 0 ? "+" : ""}${m} m`, theme, {
      size: 10, align: "center", color: theme.inkSoft,
    });
  }
  // The doorway at the zero mark: the origin has to be somewhere real.
  const doorX = X(0);
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, dark ? 0.5 : 0.24);
  roundRect(ctx, doorX - 26, floorY - 96, 52, 96, 5);
  ctx.fill();
  ctx.restore();
  glass(ctx, doorX - 22, floorY - 92, 44, 62, 4, theme, { alpha: dark ? 0.2 : 0.34 });
  caption(ctx, doorX, floorY - 106, "origin  0 m", theme, {
    size: 11, align: "center", color: theme.inkSoft,
  });

  /* ---- the rail ---- */
  metal(ctx, railX0, floorY - 5, railW, 5, theme.inkSoft, { radius: 2, polish: 0.8 });
  // Rail bumpers at each end.
  for (const end of [RAIL_MIN, RAIL_MAX]) {
    material(ctx, X(end) - 5, floorY - 26, 10, 22, theme.sci["force"], 3);
  }

  /* ---- trail already travelled ---- */
  const trailFrom = Math.max(0, state.t - 2.4);
  const trailPts: Pt[] = [];
  for (let tt = trailFrom; tt <= state.t; tt += 0.08) {
    trailPts.push({ x: X(sampleAt(j, tt).x), y: floorY - 12 });
  }
  if (trailPts.length > 2) comet(ctx, trailPts, hexA(posC, 0.9), 5);

  /* ---- the rover ---- */
  const rx = X(now.x);
  const bodyW = Math.max(34, pxPerM * 1.1);
  const bodyH = 24;
  const ry = floorY - 10 - bodyH;
  contactShadow(ctx, rx, floorY - 2, bodyW * 0.4, 4);
  metal(ctx, rx - bodyW / 2, ry + bodyH - 7, bodyW, 8, theme.inkSoft, { radius: 3 });
  plastic(ctx, rx - bodyW / 2, ry, bodyW, bodyH - 4, theme.accent, { radius: 5, gloss: 0.7 });
  glass(ctx, rx - bodyW * 0.28, ry + 4, bodyW * 0.56, 9, 3, theme, { alpha: 0.32 });
  rimLight(ctx, (c) => { roundRect(c, rx - bodyW / 2, ry, bodyW, bodyH - 4, 5); },
    mixHex(theme.accent, "#ffffff", 0.7), { width: 1.4, alpha: 0.5 });
  // Wheels that actually turn with the motion — spokes make it obvious.
  for (const off of [-bodyW * 0.3, bodyW * 0.3]) {
    const wx = rx + off, wy = floorY - 6;
    sphere(ctx, wx, wy, 7, mixHex(theme.inkSoft, "#000000", 0.25));
    ctx.save();
    ctx.strokeStyle = hexA(theme.surface, 0.75);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = state.wheel + (k * Math.PI) / 4;
      ctx.moveTo(wx - Math.cos(a) * 5, wy - Math.sin(a) * 5);
      ctx.lineTo(wx + Math.cos(a) * 5, wy + Math.sin(a) * 5);
    }
    ctx.stroke();
    ctx.restore();
  }
  // Direction indicator on the nose, only when it is actually moving.
  if (Math.abs(now.v) > 0.01) {
    const dir = Math.sign(now.v);
    arrow(ctx, rx + dir * (bodyW / 2 + 4), ry + 9, rx + dir * (bodyW / 2 + 4 + Math.min(46, Math.abs(now.v) * 20)), ry + 9,
      velC, { width: 2.4, head: 9 });
  }
  badge(ctx, rx, ry - 20, `${fsx(now.x, 1)} m`, theme, { align: "center", color: posC, sub: "position" });

  /* ---- the assembled recipe, as four chips ---- */
  const chipY = topH + 6;
  const chipH = 30;
  const chipGap = 8;
  const chipW = (width - 32 - chipGap * 3) / 4;
  j.segs.forEach((seg, i) => {
    const cx = 16 + i * (chipW + chipGap);
    const active = state.t >= seg.t0 - 1e-9 && state.t < seg.t1 + (i === 3 ? 1e-3 : 0);
    const tint = seg.v > 0 ? velC : seg.v < 0 ? theme.sci["momentum"] : theme.inkSoft;
    softShadow(ctx, () => {
      bevelRect(ctx, cx, chipY, chipW, chipH, 7, theme.surfaceAlt, { depth: active ? 1 : -1 });
    }, { blur: active ? 10 : 4, dy: 2, alpha: active ? 0.3 : 0.14 });
    if (active) {
      innerGlow(ctx, (c) => { roundRect(c, cx, chipY, chipW, chipH, 7); }, tint, {
        inset: 8, alpha: 0.25 + 0.12 * pulse(time, 1.1),
      });
    }
    caption(ctx, cx + 10, chipY + chipH / 2 - 5, `${i + 1}. ${SEG_LABEL[seg.kind]}`, theme, {
      size: 11, color: active ? theme.ink : theme.inkSoft,
    });
    caption(ctx, cx + 10, chipY + chipH / 2 + 9, `${fsx(seg.v, 1)} m/s`, theme, {
      size: 10, color: tint,
    });
  });

  /* ---- the position-time graph ---- */
  const gx = 54;
  const gy = chipY + chipH + 16;
  const gw = width - gx - 22;
  const gh = height - gy - 34;
  softShadow(ctx, () => {
    bevelRect(ctx, gx - 8, gy - 8, gw + 16, gh + 16, 10, theme.surface, { depth: -1 });
  }, { blur: 12, dy: 4, alpha: 0.2 });
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, gx - 8, gy - 8, gw + 16, gh + 16, 10);
  ctx.clip();
  gridPaper(ctx, width, height, theme, { step: 18, major: 4, originX: gx, originY: gy, alpha: 0.5 });
  ctx.restore();

  const span = Math.max(6, (j.xMax - j.xMin) * 1.25);
  const mid = (j.xMax + j.xMin) / 2;
  const yLo = mid - span / 2, yHi = mid + span / 2;
  const GX = (t: number) => gx + (t / j.T) * gw;
  const GY = (x: number) => gy + gh - ((x - yLo) / (yHi - yLo)) * gh;

  // Axes.
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.stroke();
  ctx.restore();
  const tickEvery = j.T <= 12 ? 2 : 4;
  for (let tt = 0; tt <= j.T + 1e-6; tt += tickEvery) {
    caption(ctx, GX(tt), gy + gh + 13, `${fx(tt, 0)}`, theme, { size: 10, align: "center", color: theme.inkSoft });
  }
  const yStep = span > 16 ? 5 : span > 8 ? 2 : 1;
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.16);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let m = Math.ceil(yLo / yStep) * yStep; m <= yHi; m += yStep) {
    const yy = Math.round(GY(m)) + 0.5;
    ctx.moveTo(gx, yy);
    ctx.lineTo(gx + gw, yy);
  }
  ctx.stroke();
  ctx.restore();
  for (let m = Math.ceil(yLo / yStep) * yStep; m <= yHi; m += yStep) {
    caption(ctx, gx - 8, GY(m), `${m > 0 ? "+" : ""}${m}`, theme, {
      size: 10, align: "right", color: theme.inkSoft,
    });
  }
  caption(ctx, gx + gw, gy + gh + 26, "time (s)", theme, { size: 11, align: "right", color: theme.inkSoft });
  caption(ctx, gx - 44, gy - 2, "position (m)", theme, { size: 11, color: theme.inkSoft });

  // The planned line, faint; the part already performed, bright.
  const line = j.samples.map((s) => ({ x: GX(s.t), y: GY(s.x) }));
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(line[0].x, line[0].y);
  for (const p of line) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.restore();
  const doneCount = Math.max(1, Math.min(line.length, Math.round(state.t / JOURNEY_DT) + 1));
  const done = line.slice(0, doneCount);
  if (done.length > 1) {
    ctx.save();
    ctx.strokeStyle = hexA(posC, 0.22);
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(done[0].x, done[0].y);
    for (const p of done) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.strokeStyle = posC;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  }

  // Segment boundaries.
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.2);
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const seg of j.segs) {
    ctx.moveTo(Math.round(GX(seg.t1)) + 0.5, gy);
    ctx.lineTo(Math.round(GX(seg.t1)) + 0.5, gy + gh);
  }
  ctx.stroke();
  ctx.restore();

  // The live segment, with its slope triangle spelled out.
  const segIdx = Math.min(j.segs.length - 1, Math.floor((state.t + 1e-9) / (params.segTime as number)));
  const seg = j.segs[segIdx];
  if (overlays.slope !== false) {
    const a = sampleAt(j, seg.t0);
    const b = sampleAt(j, Math.min(state.t, seg.t1));
    const ax = GX(a.t), ay = GY(a.x), bx = GX(b.t), by = GY(b.x);
    if (bx - ax > 6) {
      ctx.save();
      ctx.fillStyle = hexA(velC, 0.14);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, ay);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexA(velC, 0.85);
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, ay);
      ctx.moveTo(bx, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
      caption(ctx, (ax + bx) / 2, ay + (by > ay ? -10 : 12), `run ${fx(b.t - a.t, 1)} s`, theme, {
        size: 10, align: "center", color: velC,
      });
      caption(ctx, bx + 7, (ay + by) / 2, `rise ${fsx(b.x - a.x, 1)} m`, theme, {
        size: 10, color: velC,
      });
    }
  }

  // Playhead and the moving dot.
  const phx = GX(state.t), phy = GY(now.x);
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.6);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(phx, gy);
  ctx.lineTo(phx, gy + gh);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, phx, phy, 6, theme.accent, { glow: 0.6 });

  // One contextual sentence about the shape currently being drawn.
  const note = Math.abs(seg.v) < 1e-6
    ? "Flat line — the rover is parked. Flat does not mean slow, it means stopped."
    : seg.v > 1.5 ? "Steep upward line — moving away from the origin quickly."
      : seg.v > 0 ? "Gentle upward slope — moving away, but slowly."
        : seg.v > -1.5 ? "Line slopes down — the rover is coming back towards the origin."
          : "Steep downward line — coming back fast.";
  badge(ctx, gx + gw - 6, gy + 16, `slope = ${fsx(seg.v, 1)} m/s`, theme, {
    align: "right", color: velC, sub: "= velocity",
  });
  caption(ctx, gx + 6, gy + 14, note, theme, { size: 11, color: theme.inkSoft });

  // Trip summary for the whole recipe.
  caption(ctx, gx + 6, gy + gh - 26,
    `whole trip:  distance ${fx(j.distance, 1)} m   ·   displacement ${fsx(j.displacement, 1)} m`, theme,
    { size: 11, color: theme.inkSoft });
  caption(ctx, gx + 6, gy + gh - 11,
    `average speed ${fx(j.distance / j.T, 2)} m/s   ·   average velocity ${fsx(j.displacement / j.T, 2)} m/s`, theme,
    { size: 11, color: theme.inkSoft });

  vignette(ctx, width, height, 0.12);
}

export const g8a1BuildJourney: SimManifest<JourneyState> = {
  id: "g8a1-build-journey",
  title: "Build the Journey",
  tagline: "Assemble a trip out of four motion segments and watch the position-time graph draw itself.",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9],
  standards: { ngss: ["MS-PS2-2"], ccssMath: ["8.F.B.5", "8.EE.B.5"] },
  learningGoals: [
    "Read velocity off a position-time graph as the slope of the line.",
    "Recognise a flat line as being at rest and a downward line as returning.",
    "Calculate average speed as total distance over total time, and see how it differs from average velocity.",
  ],
  misconceptions: [
    "A position-time graph is a picture of the path the object took",
    "A flat line means moving at a steady speed",
    "A steeper line means the object is higher up",
    "Average speed is the average of the segment speeds",
  ],
  interactionHint: "Choose a motion for each of the four segments, then switch to Scrub to step through it.",
  params: {
    seg1: {
      type: "option", label: "Segment 1",
      options: [
        { value: "fastF", label: "Fast forward  +2.0 m/s" },
        { value: "slowF", label: "Slow forward  +0.8 m/s" },
        { value: "stop", label: "Parked  0 m/s" },
        { value: "slowB", label: "Slow back  -0.8 m/s" },
        { value: "fastB", label: "Fast back  -2.0 m/s" },
      ],
      default: "fastF",
    },
    seg2: {
      type: "option", label: "Segment 2",
      options: [
        { value: "fastF", label: "Fast forward  +2.0 m/s" },
        { value: "slowF", label: "Slow forward  +0.8 m/s" },
        { value: "stop", label: "Parked  0 m/s" },
        { value: "slowB", label: "Slow back  -0.8 m/s" },
        { value: "fastB", label: "Fast back  -2.0 m/s" },
      ],
      default: "stop",
    },
    seg3: {
      type: "option", label: "Segment 3",
      options: [
        { value: "fastF", label: "Fast forward  +2.0 m/s" },
        { value: "slowF", label: "Slow forward  +0.8 m/s" },
        { value: "stop", label: "Parked  0 m/s" },
        { value: "slowB", label: "Slow back  -0.8 m/s" },
        { value: "fastB", label: "Fast back  -2.0 m/s" },
      ],
      default: "slowF",
    },
    seg4: {
      type: "option", label: "Segment 4",
      options: [
        { value: "fastF", label: "Fast forward  +2.0 m/s" },
        { value: "slowF", label: "Slow forward  +0.8 m/s" },
        { value: "stop", label: "Parked  0 m/s" },
        { value: "slowB", label: "Slow back  -0.8 m/s" },
        { value: "fastB", label: "Fast back  -2.0 m/s" },
      ],
      default: "fastB",
    },
    segTime: {
      type: "number", label: "Time per segment", kind: "time", unit: "s",
      min: 2, max: 6, step: 0.5, default: 4,
    },
    start: {
      type: "number", label: "Starting position", kind: "length", unit: "m",
      min: -8, max: 8, step: 0.5, default: -6,
      help: "Where the line starts on the graph is just where the rover starts on the rail.",
    },
    mode: {
      type: "option", label: "Playback",
      options: [
        { value: "run", label: "Run it" },
        { value: "scrub", label: "Scrub by hand" },
      ],
      default: "run",
    },
    scrub: {
      type: "number", label: "Scrub position", kind: "ratio",
      min: 0, max: 1, step: 0.01, default: 0,
      help: "In Scrub mode this drags the playhead so you can step through the graph.",
    },
  },
  overlays: [
    { key: "slope", label: "Slope triangle", default: true },
  ],
  model: journeyModel,
  render: renderJourney,
  labs: [
    {
      id: "slope-is-velocity",
      title: "What does steepness mean?",
      question: "On a position-time graph, what is the steepness of the line actually telling you?",
      bands: ["6-8", "9-12"],
      minutes: 22,
      standards: ["MS-PS2-2"],
      setup: { seg1: "slowF", seg2: "fastF", seg3: "stop", seg4: "slowB", segTime: 4, start: -6, mode: "run", scrub: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the steep bit",
          instruction: "Segment 1 is slow forward and segment 2 is fast forward. Answer before you run it.",
          predict: {
            prompt: "How will the fast segment look on the position-time graph compared to the slow one?",
            options: [
              "Higher up on the graph",
              "Steeper — it climbs more in the same time",
              "Longer along the time axis",
              "Exactly the same, because the graph only shows position",
            ],
            correct: 1,
            reveal: "Steeper. In the same 4 s the fast segment covers 8 m instead of 3.2 m, so the line rises more per second. Slope = rise over run = velocity.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Run it and read the slopes",
          instruction: "Let the journey run. Record a row inside each of the first two segments so you have both slopes.",
          requireData: 2,
          hints: [
            "The slope triangle shows the rise and the run for the segment you are inside.",
            "The badge on the graph reads out the slope directly in m/s.",
          ],
        },
        {
          id: "flat",
          phase: "analyze",
          title: "Interrogate the flat line",
          instruction: "Scrub the playhead into segment 3, the parked one. Check the rover on the rail while you do.",
          check: {
            describe: "Playhead is inside the parked segment with velocity zero",
            test: (v) => Math.abs(v.readouts.velocity ?? 1) < 0.01,
          },
          write: {
            prompt: "The line is flat but the rover is not at zero on the rail. What does a flat line actually mean?",
            placeholder: "A flat line means the position is ... so the rover is ...",
          },
        },
        {
          id: "down",
          phase: "analyze",
          title: "And the downhill part",
          instruction: "Scrub into segment 4. Watch which way the rover moves while the line goes down.",
          check: {
            describe: "Playhead is inside a segment with negative velocity",
            test: (v) => (v.readouts.velocity ?? 0) < -0.1,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the reading rules",
          instruction: "Three rules, one for each kind of line.",
          write: {
            prompt: "Write what a steep line, a flat line and a downward line each tell you about the motion.",
            placeholder: "Steep means ... Flat means ... Downward means ...",
          },
        },
      ],
    },
    {
      id: "average-speed-build",
      title: "Design a trip with an average speed of 1.0 m/s",
      question: "Is average speed just the average of the segment speeds?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-2"],
      setup: { seg1: "fastF", seg2: "stop", seg3: "stop", seg4: "stop", segTime: 4, start: -6, mode: "run", scrub: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the average",
          instruction: "One segment at 2.0 m/s, then three segments parked. All four segments last 4 s.",
          predict: {
            prompt: "What is the average speed for the whole 16 s trip?",
            options: [
              "2.0 m/s, the only speed it ever moved at",
              "1.0 m/s, halfway between 2.0 and 0",
              "0.5 m/s",
              "0 m/s, because it ends up parked",
            ],
            correct: 2,
            reveal: "Total distance 8 m over total time 16 s is 0.5 m/s. Average speed is always total distance divided by total time — never the average of the speeds, because the rover spent three times as long parked as it did moving.",
          },
        },
        {
          id: "check-it",
          phase: "measure",
          title: "Run it to the end and check",
          instruction: "Let the whole 16 s play out and record the finished trip.",
          requireData: 1,
          check: {
            describe: "The trip has reached its end",
            test: (v) => Boolean(v.facts.atEnd),
          },
        },
        {
          id: "design",
          phase: "setup",
          title: "Now design one",
          instruction: "Rebuild the four segments so the whole trip has an average speed between 0.95 and 1.05 m/s.",
          check: {
            describe: "Whole-trip average speed is 1.0 m/s to within 0.05",
            test: (v) => Math.abs((v.facts.tripAvgSpeed as number) - 1) <= 0.05,
          },
          hints: [
            "Total distance divided by total time. With four 4 s segments the total time is fixed at 16 s.",
            "For 1.0 m/s over 16 s you need 16 m of path in total.",
            "Two segments at 2.0 m/s give 8 m each — that is already 16 m.",
          ],
        },
        {
          id: "zero-velocity",
          phase: "analyze",
          title: "Make the average velocity zero without stopping",
          instruction: "Keep the rover moving in every segment, but make it finish exactly where it started.",
          check: {
            describe: "No parked segments and the trip returns to its starting position",
            test: (v) => (v.facts.stopSegments as number) === 0 && Boolean(v.facts.returnsToStart),
          },
          hints: ["Whatever you go forward, you have to come back."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the two formulas",
          instruction: "Write both, and say when they give different answers.",
          write: {
            prompt: "Write the formula for average speed and the formula for average velocity, then say when they disagree.",
            placeholder: "Average speed = ... Average velocity = ... They disagree whenever ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "there-and-back",
      title: "Out and home",
      brief: "Build a trip that travels at least 12 m of path but finishes within 0.1 m of where it started.",
      bands: ["6-8", "9-12"],
      setup: { seg1: "fastF", seg2: "fastF", seg3: "fastB", seg4: "fastB", segTime: 3, start: 0, mode: "run", scrub: 0 },
      goal: {
        describe: "Total distance over 12 m with a displacement under 0.1 m",
        test: (v) => (v.facts.totalDistance as number) >= 12
          && Math.abs(v.facts.totalDisplacement as number) < 0.1,
      },
      stars: {
        two: {
          describe: "Total distance over 20 m, still finishing at the start",
          test: (v) => (v.facts.totalDistance as number) >= 20
            && Math.abs(v.facts.totalDisplacement as number) < 0.1,
        },
        three: {
          describe: "Over 20 m of path, back at the start, and never parked",
          test: (v) => (v.facts.totalDistance as number) >= 20
            && Math.abs(v.facts.totalDisplacement as number) < 0.1
            && (v.facts.stopSegments as number) === 0,
        },
      },
      hints: [
        "Forward metres and backward metres have to cancel exactly.",
        "Longer segments cover more ground, so the time slider matters too.",
      ],
    },
    {
      id: "read-the-shape",
      title: "Draw a staircase",
      brief: "Build a graph that goes up, flat, up, flat — a staircase — and ends past +5 m.",
      bands: ["6-8", "9-12"],
      setup: { seg1: "slowF", seg2: "slowF", seg3: "slowF", seg4: "slowF", segTime: 4, start: -6, mode: "run", scrub: 0 },
      goal: {
        describe: "Segments alternate moving and parked, finishing above +5 m",
        test: (v) => v.params.seg2 === "stop" && v.params.seg4 === "stop"
          && v.params.seg1 !== "stop" && v.params.seg3 !== "stop"
          && (v.facts.position as number) > 5 && Boolean(v.facts.atEnd),
      },
      stars: {
        two: {
          describe: "A staircase that also ends above +7 m",
          test: (v) => v.params.seg2 === "stop" && v.params.seg4 === "stop"
            && v.params.seg1 !== "stop" && v.params.seg3 !== "stop"
            && (v.facts.position as number) > 7 && Boolean(v.facts.atEnd),
        },
      },
      hints: [
        "A staircase needs the moving segments to both go the same way.",
        "Start further back to leave yourself room to climb.",
      ],
    },
  ],
};
