import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, contactShadow, dashFlow, easeInOut,
  glass, glow, gradientFill, gridPaper, groundPlane, hatchFill, hexA, innerGlow,
  isDarkTheme, labelLeader, lerp, material, metal, noiseWash, particleField, plastic,
  pulse, ribbon, rimLight, sky, softShadow, sphere, spriteShadowEllipse, starfield,
  vignette,
} from "@ui/scene";

/**
 * Grade 6 · Unit A · Topic A1 — Systems and subsystems.
 *
 * Five separate simulations, each a different *kind* of interactive experience,
 * that together cover the whole topic:
 *
 *   A1.1  g6a1-system-or-heap    an inspection bench: sort systems from heaps
 *   A1.2  g6a1-drone-assembly    a build-it bay: nest subsystems inside a system
 *   A1.3  g6a1-greenhouse-links  a measurement rig: cut a link, watch control fail
 *   A1.4  g6a1-emergent-traffic  a side-by-side rig: a jam nobody causes
 *   A1.5  g6a1-scale-ladder      a driven zoom: mitochondrion to planet
 *
 * Every quantity on screen is a real one. The drone hovers on momentum theory,
 * the greenhouse loses heat through a real glazing U-value, the traffic model is
 * the optimal-velocity model whose instability threshold is in the literature,
 * and the scale ladder is pinned to measured sizes.
 */

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** Never print a raw float on a stage. */
function fmt(n: number, d = 1): string {
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(d);
}

function fmtInt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "--";
}

/** A rounded-rect path, so nothing here depends on ctx.roundRect. */
function rrect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A machined instrument panel: the frame most of these scenes read against. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeLike, accent: string, title?: string,
) {
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    bevelRect(ctx, x, y, w, h, 12, theme.surfaceAlt, { depth: 1.2 });
  }, { blur: 18, dy: 6, alpha: dark ? 0.45 : 0.18 });
  hatchFill(ctx, x + 1, y + 1, w - 2, 15, accent, { gap: 6, alpha: 0.16 });
  rimLight(ctx, (c) => rrect(c, x + 0.5, y + 0.5, w - 1, h - 1, 12), accent, {
    alpha: 0.35, bounds: { x, y, w, h },
  });
  if (title) {
    caption(ctx, x + 14, y + 20, title, theme, { size: 12, color: theme.inkSoft, weight: 700 });
  }
}

/** The subset of the theme these helpers need. */
type ThemeLike = RenderContext["theme"];

/** A soft lit lamp with a lens ring — the on/off vocabulary of the whole file. */
function lamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, on: number, theme: ThemeLike,
) {
  const lit = clamp01(on);
  if (lit > 0.02) glow(ctx, x, y, r * 3.4, color, 0.55 * lit);
  sphere(ctx, x, y, r, theme.inkSoft, { rim: false });
  if (lit > 0.01) {
    ctx.save();
    ctx.globalAlpha = lit;
    sphere(ctx, x, y, r, color, { rim: false });
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x, y, r + 2.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ================================================================== *
 * A1.1 — Systems Inspection Bench
 *
 * A workshop bay with a lit turntable. One candidate object at a time comes
 * under the lamp and the student runs three tests on it: does it have distinct
 * parts, do those parts affect each other, does the whole do a job no part can
 * do alone. All three yes means a system. The killer pair is the bicycle and
 * the crate holding the very same parts.
 * ================================================================== */

interface Specimen {
  id: string;
  name: string;
  /** Ground truth for the three tests. */
  parts: boolean;
  interact: boolean;
  job: boolean;
  /** One line of evidence, revealed only after the verdict is locked. */
  note: string;
  /** Leader-line anchors, in units of the specimen box (x, y from base). */
  tags: { x: number; y: number; text: string; sub: string }[];
}

const SPECIMENS: Specimen[] = [
  {
    id: "bicycle", name: "Bicycle", parts: true, interact: true, job: true,
    note: "Pedals turn the chain, the chain turns the wheel, the wheel carries the rider.",
    tags: [
      { x: -0.30, y: 0.20, text: "Rear wheel", sub: "driven part" },
      { x: 0.02, y: 0.13, text: "Chain", sub: "links two parts" },
    ],
  },
  {
    id: "bikeparts", name: "Crate of bike parts", parts: true, interact: false, job: false,
    note: "Exactly the same parts as the bicycle. Unconnected, they carry nobody.",
    tags: [
      { x: 0.26, y: 0.20, text: "Loose wheel", sub: "connected to nothing" },
      { x: -0.24, y: 0.14, text: "Coiled chain", sub: "drives nothing" },
    ],
  },
  {
    id: "flashlight", name: "Flashlight", parts: true, interact: true, job: true,
    note: "Cells push charge, the switch lets it through, the lamp turns it into light.",
    tags: [
      { x: 0.12, y: 0.20, text: "Cells", sub: "energy store" },
      { x: -0.26, y: 0.24, text: "Lamp", sub: "makes the light" },
    ],
  },
  {
    id: "marbles", name: "Jar of marbles", parts: true, interact: false, job: false,
    note: "Take one marble out and every other marble carries on exactly as before.",
    tags: [
      { x: -0.10, y: 0.26, text: "Marbles", sub: "same, not linked" },
      { x: 0.12, y: 0.46, text: "Jar", sub: "a container" },
    ],
  },
  {
    id: "beehive", name: "Beehive", parts: true, interact: true, job: true,
    note: "Foragers, nurses and comb work together. The colony keeps its own temperature.",
    tags: [
      { x: -0.20, y: 0.34, text: "Comb", sub: "shared store" },
      { x: 0.26, y: 0.52, text: "Foragers", sub: "bring nectar in" },
    ],
  },
  {
    id: "bricks", name: "Pile of bricks", parts: true, interact: false, job: false,
    note: "Stacked, not joined. Nothing passes between one brick and the next.",
    tags: [
      { x: -0.22, y: 0.10, text: "Bricks", sub: "identical units" },
      { x: 0.20, y: 0.24, text: "Pile", sub: "no shared job" },
    ],
  },
];

function specimenOf(id: string): Specimen {
  return SPECIMENS.find((s) => s.id === id) ?? SPECIMENS[0];
}

interface BenchState {
  t: number;
  /** Eased 0..1 brightness of the three test lamps. */
  lamps: [number, number, number];
  locked: boolean;
  /** Eased reveal of the evidence card after locking. */
  reveal: number;
  /** Which specimen the current lock belongs to. */
  lockedId: string;
  /** specimen id -> all three tests answered correctly. */
  judged: Record<string, boolean>;
  spin: number;
  motes: { x: number; y: number; v: number; r: number }[];
}

function benchChecks(p: Record<string, number | boolean | string>, sp: Specimen): number {
  let n = 0;
  if ((p.testParts as boolean) === sp.parts) n++;
  if ((p.testInteract as boolean) === sp.interact) n++;
  if ((p.testJob as boolean) === sp.job) n++;
  return n;
}

const benchModel: SimModel<BenchState> = {
  init(_params, ctx) {
    const motes = [];
    for (let i = 0; i < 44; i++) {
      motes.push({
        x: ctx.rng.next(), y: ctx.rng.next(),
        v: ctx.rng.range(0.008, 0.03), r: ctx.rng.range(0.6, 1.9),
      });
    }
    return {
      t: 0, lamps: [0, 0, 0], locked: false, reveal: 0, lockedId: "",
      judged: {}, spin: 0, motes,
    };
  },

  applyParams(state, params, prev) {
    if (params.specimen !== prev.specimen) {
      return { ...state, locked: false, reveal: 0, lockedId: "" };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let locked = state.locked;
    let judged = state.judged;
    const sp = specimenOf(params.specimen as string);

    for (const input of inputs) {
      const lockNow =
        input.type === "pointerdown" ||
        (input.type === "action" && (input.action === "launch" || input.action === "lock"));
      if (lockNow && !locked) {
        locked = true;
        judged = { ...judged, [sp.id]: benchChecks(params, sp) === 3 };
      }
    }

    const want: [number, number, number] = [
      (params.testParts as boolean) ? 1 : 0,
      (params.testInteract as boolean) ? 1 : 0,
      (params.testJob as boolean) ? 1 : 0,
    ];
    // Lamps ease rather than snap: a switch that answers instantly reads as a
    // checkbox, one that warms up reads as a machine.
    const k = Math.min(1, dt * 7);
    const lamps: [number, number, number] = [
      state.lamps[0] + (want[0] - state.lamps[0]) * k,
      state.lamps[1] + (want[1] - state.lamps[1]) * k,
      state.lamps[2] + (want[2] - state.lamps[2]) * k,
    ];

    const motes = state.motes.map((m) => {
      const y = m.y - m.v * dt;
      return y < 0 ? { ...m, y: y + 1 } : { ...m, y };
    });

    return {
      ...state,
      t: state.t + dt,
      spin: state.spin + dt * 0.55,
      lamps,
      locked,
      lockedId: locked ? sp.id : "",
      reveal: clamp01(state.reveal + (locked ? dt * 1.6 : -dt * 4)),
      judged,
      motes,
    };
  },

  readouts(state, params) {
    const sp = specimenOf(params.specimen as string);
    const right = benchChecks(params, sp);
    const judged = Object.keys(state.judged).length;
    const correct = Object.values(state.judged).filter(Boolean).length;
    return [
      { key: "checksRight", label: "Tests matching the evidence", quantity: q(right, "count"), semantic: "distance" },
      { key: "judged", label: "Specimens judged", quantity: q(judged, "count"), semantic: "time" },
      { key: "correct", label: "Judged correctly", quantity: q(correct, "count"), semantic: "energy-kinetic" },
      {
        key: "accuracy", label: "Accuracy", unit: "%",
        quantity: q(judged > 0 ? correct / judged : 0, "percent"),
        semantic: "energy-kinetic", bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const sp = specimenOf(params.specimen as string);
    const right = benchChecks(params, sp);
    const studentSaysSystem =
      (params.testParts as boolean) && (params.testInteract as boolean) && (params.testJob as boolean);
    const trulySystem = sp.parts && sp.interact && sp.job;
    const out: Record<string, number | boolean | string> = {
      specimen: sp.id,
      locked: state.locked,
      checksRight: right,
      allThreeRight: right === 3,
      verdictRight: studentSaysSystem === trulySystem,
      trulySystem,
      judgedCount: Object.keys(state.judged).length,
      correctCount: Object.values(state.judged).filter(Boolean).length,
    };
    for (const s of SPECIMENS) out[`ok_${s.id}`] = state.judged[s.id] === true;
    return out;
  },
};
/* ---- specimen artwork ------------------------------------------- */

function spokes(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number,
  color: string, width: number,
) {
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.8);
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = angle + (i * Math.PI) / 5;
    ctx.moveTo(x + Math.cos(a) * r * 0.14, y + Math.sin(a) * r * 0.14);
    ctx.lineTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84);
  }
  ctx.stroke();
  ctx.restore();
}

function wheel(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, theme: ThemeLike,
) {
  const steel = theme.sci["mass"];
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = hexA(steel, 0.95);
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  spokes(ctx, x, y, r, angle, steel, Math.max(0.8, r * 0.035));
  sphere(ctx, x, y, r * 0.15, steel);
}

function drawBicycle(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, t: number, theme: ThemeLike,
) {
  const r = s * 0.20;
  const wy = baseY - r;
  const bx = cx - s * 0.30, fx = cx + s * 0.30;
  const frameCol = theme.sci["acceleration"];
  const steel = theme.sci["mass"];
  const roll = t * 1.6;

  spriteShadowEllipse(ctx, bx, baseY, r * 1.1, r * 0.26, { alpha: 0.32 });
  spriteShadowEllipse(ctx, fx, baseY, r * 1.1, r * 0.26, { alpha: 0.32 });

  const seat = { x: cx - s * 0.13, y: wy - r * 1.15 };
  const head = { x: cx + s * 0.19, y: wy - r * 1.05 };
  const crank = { x: cx + s * 0.01, y: wy + r * 0.34 };

  // Frame: a thick painted tube with a thin gloss line down its lit side.
  const tubes: [{ x: number; y: number }, { x: number; y: number }][] = [
    [{ x: bx, y: wy }, seat], [seat, crank], [crank, { x: bx, y: wy }],
    [seat, head], [head, crank], [head, { x: fx, y: wy }],
  ];
  for (const pass of [0, 1]) {
    ctx.save();
    ctx.strokeStyle = pass === 0 ? frameCol : hexA("#ffffff", 0.35);
    ctx.lineWidth = pass === 0 ? s * 0.035 : s * 0.012;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [a, b] of tubes) {
      ctx.moveTo(a.x, a.y - (pass === 1 ? s * 0.008 : 0));
      ctx.lineTo(b.x, b.y - (pass === 1 ? s * 0.008 : 0));
    }
    ctx.stroke();
    ctx.restore();
  }

  // Handlebar and saddle.
  ctx.save();
  ctx.strokeStyle = steel;
  ctx.lineWidth = s * 0.024;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(head.x + s * 0.02, head.y - s * 0.09);
  ctx.lineTo(head.x - s * 0.07, head.y - s * 0.11);
  ctx.stroke();
  ctx.restore();
  material(ctx, seat.x - s * 0.06, seat.y - s * 0.03, s * 0.12, s * 0.03, theme.inkSoft, s * 0.015);

  wheel(ctx, bx, wy, r, roll, theme);
  wheel(ctx, fx, wy, r, roll, theme);

  // Chain: the part whose whole reason to exist is joining two other parts.
  const cr = s * 0.055, hr = r * 0.17;
  const chain = [
    { x: crank.x, y: crank.y - cr }, { x: bx, y: wy - hr },
    { x: bx, y: wy + hr }, { x: crank.x, y: crank.y + cr },
    { x: crank.x, y: crank.y - cr },
  ];
  dashFlow(ctx, chain, steel, t * 55, { width: s * 0.02, dash: 4, gap: 3, alpha: 0.95 });
  sphere(ctx, crank.x, crank.y, cr, steel);
  const pa = roll * 1.9;
  ctx.save();
  ctx.strokeStyle = steel;
  ctx.lineWidth = s * 0.018;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(crank.x, crank.y);
  ctx.lineTo(crank.x + Math.cos(pa) * s * 0.085, crank.y + Math.sin(pa) * s * 0.085);
  ctx.stroke();
  ctx.restore();
  plastic(
    ctx, crank.x + Math.cos(pa) * s * 0.085 - s * 0.022,
    crank.y + Math.sin(pa) * s * 0.085 - s * 0.012, s * 0.045, s * 0.024,
    theme.sci["energy-total"], { radius: s * 0.008 },
  );
}

function drawBikeParts(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, _t: number, theme: ThemeLike,
) {
  const steel = theme.sci["mass"];
  const wood = theme.sci["decomposer"];
  const r = s * 0.17;

  spriteShadowEllipse(ctx, cx, baseY, s * 0.5, s * 0.06, { alpha: 0.3 });

  // A tube and a handlebar leaning on the crate, going nowhere.
  ctx.save();
  ctx.strokeStyle = theme.sci["acceleration"];
  ctx.lineWidth = s * 0.035;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.44, baseY - s * 0.01);
  ctx.lineTo(cx - s * 0.20, baseY - s * 0.30);
  ctx.stroke();
  ctx.restore();

  // The crate.
  const crateX = cx - s * 0.40, crateW = s * 0.52, crateH = s * 0.24;
  material(ctx, crateX, baseY - crateH, crateW, crateH, wood, s * 0.012);
  ctx.save();
  ctx.strokeStyle = hexA("#000000", 0.22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(crateX + (crateW * i) / 4, baseY - crateH);
    ctx.lineTo(crateX + (crateW * i) / 4, baseY);
  }
  ctx.stroke();
  ctx.restore();

  // A coiled chain inside the crate: three flat arcs, driving nothing.
  ctx.save();
  ctx.strokeStyle = hexA(steel, 0.9);
  ctx.lineWidth = s * 0.016;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(
      crateX + crateW * 0.42, baseY - crateH - s * 0.005,
      s * (0.05 + i * 0.028), s * (0.016 + i * 0.008), 0, Math.PI, Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();

  // A handlebar sticking out of the crate.
  ctx.save();
  ctx.strokeStyle = steel;
  ctx.lineWidth = s * 0.022;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(crateX + crateW * 0.16, baseY - crateH * 0.9);
  ctx.lineTo(crateX + crateW * 0.04, baseY - crateH - s * 0.12);
  ctx.lineTo(crateX + crateW * 0.22, baseY - crateH - s * 0.17);
  ctx.stroke();
  ctx.restore();

  // The wheel, leaning, stopped.
  ctx.save();
  ctx.translate(cx + s * 0.26, baseY - r * 0.98);
  ctx.rotate(0.16);
  wheel(ctx, 0, 0, r, 0.4, theme);
  ctx.restore();

  // A pedal on the bench.
  plastic(ctx, cx - s * 0.02, baseY - s * 0.035, s * 0.075, s * 0.035, theme.sci["energy-total"], {
    radius: s * 0.01,
  });
}

function drawFlashlight(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, t: number, theme: ThemeLike,
) {
  const steel = theme.sci["mass"];
  const lightCol = theme.sci["light"];
  const bodyH = s * 0.15;
  const bodyY = baseY - s * 0.19;
  const headX = cx - s * 0.32, headW = s * 0.16, headH = s * 0.23;
  const headY = baseY - s * 0.23;
  const beam = 0.75 + 0.25 * pulse(t, 0.35);

  spriteShadowEllipse(ctx, cx, baseY, s * 0.34, s * 0.05, { alpha: 0.3 });

  // The beam leaves the lens before the torch is drawn, so the glass sits on it.
  ctx.save();
  const bx = headX, by = headY + headH / 2;
  const g = ctx.createLinearGradient(bx, by, bx - s * 0.62, by);
  g.addColorStop(0, hexA(lightCol, 0.55 * beam));
  g.addColorStop(0.5, hexA(lightCol, 0.16 * beam));
  g.addColorStop(1, hexA(lightCol, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(bx, by - headH * 0.42);
  ctx.lineTo(bx - s * 0.62, by - headH * 1.5);
  ctx.lineTo(bx - s * 0.62, by + headH * 1.5);
  ctx.lineTo(bx, by + headH * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, bx, by, s * 0.16, lightCol, 0.7 * beam);

  metal(ctx, cx - s * 0.17, bodyY, s * 0.5, bodyH, steel, { radius: bodyH * 0.35, angle: 90 });
  metal(ctx, headX, headY, headW, headH, steel, { radius: s * 0.02, angle: 90 });
  glass(ctx, headX - s * 0.012, headY + s * 0.012, s * 0.03, headH - s * 0.024, s * 0.012, theme, {
    tint: lightCol, alpha: 0.5,
  });

  // Cutaway: the cells and the wire that make the lamp light.
  ctx.save();
  rrect(ctx, cx - s * 0.14, bodyY + bodyH * 0.22, s * 0.30, bodyH * 0.56, bodyH * 0.2);
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.35 : 0.55);
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 2; i++) {
    plastic(
      ctx, cx - s * 0.135 + i * s * 0.15, bodyY + bodyH * 0.26, s * 0.14, bodyH * 0.48,
      theme.sci["current"], { radius: bodyH * 0.12 },
    );
  }
  ctx.restore();
  dashFlow(ctx, [
    { x: cx - s * 0.14, y: bodyY + bodyH * 0.5 },
    { x: headX + headW * 0.55, y: bodyY + bodyH * 0.5 },
    { x: headX + headW * 0.55, y: headY + headH * 0.5 },
  ], theme.sci["current"], t * 46, { width: s * 0.012, dash: 4, gap: 5, alpha: 0.95 });
  sphere(ctx, headX + headW * 0.55, headY + headH * 0.5, s * 0.032, lightCol, { glow: 1.1 * beam });

  // The switch: the part that decides whether the others get to interact.
  plastic(ctx, cx + s * 0.06, bodyY - s * 0.03, s * 0.07, s * 0.035, theme.sci["energy-kinetic"], {
    radius: s * 0.012,
  });
}

function drawMarbleJar(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, t: number, theme: ThemeLike,
) {
  const jw = s * 0.34, jh = s * 0.46;
  const jx = cx - jw / 2, jy = baseY - jh;
  const cols = [
    theme.sci["velocity"], theme.sci["acid"], theme.sci["light"],
    theme.sci["producer"], theme.sci["field"], theme.sci["liquid"],
  ];
  spriteShadowEllipse(ctx, cx, baseY, jw * 0.7, s * 0.045, { alpha: 0.3 });

  const mr = s * 0.048;
  ctx.save();
  rrect(ctx, jx + s * 0.01, jy + s * 0.02, jw - s * 0.02, jh - s * 0.03, s * 0.03);
  ctx.clip();
  let i = 0;
  for (let row = 0; row < 4; row++) {
    const n = row % 2 === 0 ? 3 : 2;
    for (let c = 0; c < n; c++) {
      const x = cx + (c - (n - 1) / 2) * mr * 2.06 + (row % 2 === 0 ? 0 : 0);
      const y = baseY - mr * 1.05 - row * mr * 1.75;
      // Marbles settle: they touch, they never act on each other.
      const jig = Math.sin(t * 0.9 + i) * mr * 0.03;
      sphere(ctx, x + jig, y, mr, cols[i % cols.length]);
      i++;
    }
  }
  ctx.restore();

  glass(ctx, jx, jy, jw, jh, s * 0.035, theme, { alpha: isDarkTheme(theme) ? 0.16 : 0.34 });
  metal(ctx, jx - s * 0.012, jy - s * 0.035, jw + s * 0.024, s * 0.045, theme.sci["mass"], {
    radius: s * 0.012,
  });
}

function drawBeehive(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, t: number, theme: ThemeLike,
) {
  const wood = theme.sci["decomposer"];
  const honey = theme.sci["light"];
  const bw = s * 0.44, bh = s * 0.40;
  const bx = cx - bw / 2, by = baseY - bh;

  spriteShadowEllipse(ctx, cx, baseY, bw * 0.72, s * 0.05, { alpha: 0.32 });
  material(ctx, bx, by, bw, bh, wood, s * 0.012);
  material(ctx, bx - s * 0.03, by - s * 0.05, bw + s * 0.06, s * 0.055, wood, s * 0.012);

  // The comb behind the opening: the colony's shared store.
  const ox = bx + bw * 0.14, oy = by + bh * 0.16, ow = bw * 0.72, oh = bh * 0.56;
  ctx.save();
  rrect(ctx, ox, oy, ow, oh, s * 0.01);
  ctx.fillStyle = hexA("#000000", 0.35);
  ctx.fill();
  ctx.clip();
  const hr = s * 0.033;
  ctx.lineWidth = Math.max(0.8, s * 0.006);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const hx = ox + col * hr * 1.72 + (row % 2 ? hr * 0.86 : 0) + hr;
      const hy = oy + row * hr * 1.5 + hr;
      const fill = 0.25 + 0.55 * pulse(t * 0.4 + row * 0.7 + col * 0.3, 0.25);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3 + Math.PI / 6;
        const px = hx + Math.cos(a) * hr, py = hy + Math.sin(a) * hr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = hexA(honey, 0.18 + 0.3 * fill);
      ctx.fill();
      ctx.strokeStyle = hexA(honey, 0.55);
      ctx.stroke();
    }
  }
  ctx.restore();
  innerGlow(ctx, (c) => rrect(c, ox, oy, ow, oh, s * 0.01), honey, { inset: 8, alpha: 0.3 });

  // The entrance and the traffic through it.
  material(ctx, bx + bw * 0.2, baseY - s * 0.035, bw * 0.6, s * 0.03, theme.inkSoft, s * 0.006);
  for (let i = 0; i < 9; i++) {
    const ph = t * 0.7 + i * 0.72;
    const loop = (ph % 1 + 1) % 1;
    const outward = Math.floor(ph) % 2 === 0;
    const u = outward ? loop : 1 - loop;
    const bxp = cx + Math.sin(i * 2.1) * s * 0.5 * u + s * 0.02 * Math.sin(t * 9 + i);
    const byp = baseY - s * 0.04 - Math.sin(u * Math.PI) * s * (0.16 + 0.14 * ((i % 3) / 2));
    sphere(ctx, bxp, byp, s * 0.016, honey, { rim: false });
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.5);
    ctx.lineWidth = Math.max(0.7, s * 0.005);
    ctx.beginPath();
    ctx.moveTo(bxp - s * 0.012, byp);
    ctx.lineTo(bxp + s * 0.012, byp);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBrickPile(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, _t: number, theme: ThemeLike,
) {
  const brick = theme.sci["secondary-consumer"];
  const bw = s * 0.20, bh = s * 0.075;
  // Fixed offsets, so the pile is a dumped heap and not a wall.
  const rows: [number, number][][] = [
    [[-1.05, 0.0], [0.02, 0.03], [1.02, -0.02]],
    [[-0.62, 0.06], [0.45, -0.05]],
    [[-0.12, 0.02], [0.92, 0.08]],
    [[0.32, -0.04]],
  ];
  spriteShadowEllipse(ctx, cx, baseY, s * 0.42, s * 0.05, { alpha: 0.3 });
  rows.forEach((row, r) => {
    row.forEach(([ox, rot]) => {
      const x = cx + ox * bw;
      const y = baseY - (r + 1) * bh * 1.06;
      ctx.save();
      ctx.translate(x, y + bh / 2);
      ctx.rotate(rot);
      material(ctx, -bw / 2, -bh / 2, bw, bh, brick, s * 0.006);
      ctx.strokeStyle = hexA("#000000", 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.18, -bh / 2 + 2);
      ctx.lineTo(-bw * 0.18, bh / 2 - 2);
      ctx.stroke();
      ctx.restore();
    });
  });
}

function drawSpecimen(
  ctx: CanvasRenderingContext2D, id: string,
  cx: number, baseY: number, s: number, t: number, theme: ThemeLike,
) {
  switch (id) {
    case "bikeparts": drawBikeParts(ctx, cx, baseY, s, t, theme); break;
    case "flashlight": drawFlashlight(ctx, cx, baseY, s, t, theme); break;
    case "marbles": drawMarbleJar(ctx, cx, baseY, s, t, theme); break;
    case "beehive": drawBeehive(ctx, cx, baseY, s, t, theme); break;
    case "bricks": drawBrickPile(ctx, cx, baseY, s, t, theme); break;
    default: drawBicycle(ctx, cx, baseY, s, t, theme); break;
  }
}

/** Break a string into lines that fit a width, for evidence cards. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderBench(rc: RenderContext<BenchState>) {
  const { ctx, state, params, theme, width: w, height: h, band, overlays } = rc;
  const sp = specimenOf(params.specimen as string);
  const dark = isDarkTheme(theme);
  const benchY = h * 0.80;
  const panelW = Math.max(210, Math.min(w * 0.34, 320));
  const panelX = w - panelW - 14;
  const panelY = h * 0.07;
  const panelH = h * 0.86;
  const stageCx = (panelX - 12) * 0.5;
  const s = Math.min((panelX - 30) * 0.82, (benchY - h * 0.20) * 1.55);
  const yes = theme.sci["energy-kinetic"];
  const no = theme.sci["force"];
  const gold = theme.sci["light"];

  /* ---- the workshop ---- */
  sky(ctx, w, h, theme, "indoor", benchY);
  gridPaper(ctx, w, benchY, theme, { step: 34, major: 4, alpha: dark ? 0.35 : 0.5, fade: 0.55 });
  groundPlane(ctx, benchY, 0, w, h, theme, "lab");
  // The bench edge: a lit lip that says this is a surface, not a floor line.
  metal(ctx, 0, benchY - 5, w, 10, theme.sci["mass"], { radius: 2, polish: 0.7 });
  noiseWash(ctx, 0, benchY, w, h - benchY, { alpha: dark ? 0.05 : 0.04, seed: 41 });

  /* ---- the inspection lamp and its cone ---- */
  const lampY = h * 0.045;
  const coneTop = s * 0.09, coneBot = s * 0.62;
  ctx.save();
  const cg = ctx.createLinearGradient(0, lampY, 0, benchY);
  cg.addColorStop(0, hexA(gold, 0.30));
  cg.addColorStop(1, hexA(gold, 0.02));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(stageCx - coneTop, lampY);
  ctx.lineTo(stageCx + coneTop, lampY);
  ctx.lineTo(stageCx + coneBot, benchY);
  ctx.lineTo(stageCx - coneBot, benchY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Dust in the beam. Nothing sells a lit room like something floating in it.
  const motes = state.motes.map((m) => {
    const y = lampY + m.y * (benchY - lampY);
    const halfW = coneTop + (coneBot - coneTop) * m.y;
    return { x: stageCx + (m.x - 0.5) * 2 * halfW, y, r: m.r, a: 0.25 + 0.5 * (1 - m.y) };
  });
  particleField(ctx, motes, gold, { size: 1.4, alpha: 0.5, buckets: 3 });

  metal(ctx, stageCx - s * 0.11, lampY - 16, s * 0.22, 18, theme.sci["mass"], { radius: 5 });
  glow(ctx, stageCx, lampY + 4, s * 0.14, gold, 0.55);

  /* ---- the turntable ---- */
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.25);
  ctx.beginPath();
  ctx.ellipse(stageCx, benchY + 2, s * 0.46, s * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.sci["mass"], 0.9);
  ctx.lineWidth = 2;
  ctx.stroke();
  // Index marks that creep round, so the bench is never quite still.
  ctx.strokeStyle = hexA(gold, 0.5);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = state.spin + (i * Math.PI) / 8;
    ctx.moveTo(stageCx + Math.cos(a) * s * 0.40, benchY + 2 + Math.sin(a) * s * 0.065);
    ctx.lineTo(stageCx + Math.cos(a) * s * 0.46, benchY + 2 + Math.sin(a) * s * 0.075);
  }
  ctx.stroke();
  ctx.restore();

  /* ---- the specimen ---- */
  const bob = Math.sin(state.t * 1.1) * s * 0.006;
  drawSpecimen(ctx, sp.id, stageCx, benchY - 2 + bob, s, state.t, theme);

  /* ---- leaders: names in the margin, never on the artwork ---- */
  if (overlays.labels !== false && band !== "3-5") {
    let ly = h * 0.22;
    for (const tag of sp.tags) {
      const fx = stageCx + tag.x * s;
      const fy = benchY - tag.y * s;
      labelLeader(ctx, fx, fy, Math.min(140, panelX * 0.42), ly, tag.text, theme, {
        color: theme.accent, sub: tag.sub, size: 12, align: "left",
      });
      ly += 52;
    }
  }
  badge(ctx, stageCx, benchY + s * 0.115, sp.name, theme, { align: "center", color: theme.accent });

  /* ---- the console ---- */
  panel(ctx, panelX, panelY, panelW, panelH, theme, theme.accent, "THREE TESTS");
  const rows: [string, number, boolean][] = [
    ["Has distinct parts", state.lamps[0], sp.parts],
    ["Parts affect each other", state.lamps[1], sp.interact],
    ["Whole does a job alone parts cannot", state.lamps[2], sp.job],
  ];
  const rowH = 46;
  const rowTop = panelY + 40;
  rows.forEach(([text, lit, truth], i) => {
    const ry = rowTop + i * rowH;
    bevelRect(ctx, panelX + 12, ry, panelW - 24, rowH - 8, 8, theme.surface, { depth: -0.8 });
    lamp(ctx, panelX + 32, ry + (rowH - 8) / 2, 8, yes, lit, theme);
    ctx.save();
    ctx.font = "600 11.5px \"Bricolage Grotesque\", system-ui, sans-serif";
    const lines = wrapLines(ctx, text, panelW - 78);
    ctx.restore();
    lines.forEach((line, k) => {
      caption(
        ctx, panelX + 50, ry + (rowH - 8) / 2 - (lines.length - 1) * 6 + k * 13, line, theme,
        { size: 11.5, color: theme.ink },
      );
    });
    if (state.reveal > 0.05) {
      const ok = (lit > 0.5) === truth;
      ctx.save();
      ctx.globalAlpha = easeInOut(state.reveal);
      caption(ctx, panelX + panelW - 18, ry + (rowH - 8) / 2, ok ? "match" : "no", theme, {
        align: "right", size: 11, color: ok ? yes : no, weight: 700,
      });
      ctx.restore();
    }
  });

  /* ---- verdict ---- */
  const saysSystem =
    (params.testParts as boolean) && (params.testInteract as boolean) && (params.testJob as boolean);
  const vY = rowTop + rows.length * rowH + 10;
  bevelRect(ctx, panelX + 12, vY, panelW - 24, 52, 10, theme.surface, { depth: -1 });
  lamp(ctx, panelX + 36, vY + 26, 11, saysSystem ? yes : theme.sci["mass"], saysSystem ? 1 : 0.15, theme);
  caption(ctx, panelX + 58, vY + 20, saysSystem ? "SYSTEM" : "NOT A SYSTEM", theme, {
    size: 15, weight: 800, color: saysSystem ? yes : theme.inkSoft,
  });
  caption(ctx, panelX + 58, vY + 37, state.locked ? "verdict locked" : "click the bench to lock", theme, {
    size: 10.5, color: theme.inkSoft,
  });

  /* ---- evidence, only after the student has committed ---- */
  if (state.reveal > 0.02) {
    const a = easeInOut(state.reveal);
    const cardW = Math.min(panelX - 40, 360);
    const cardX = 20, cardY = h * 0.62;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = "500 12px \"Bricolage Grotesque\", system-ui, sans-serif";
    const lines = wrapLines(ctx, sp.note, cardW - 28);
    const cardH = 30 + lines.length * 16;
    softShadow(ctx, () => {
      ctx.fillStyle = dark ? "rgba(16,22,30,0.9)" : "rgba(255,255,255,0.93)";
      rrect(ctx, cardX, cardY, cardW, cardH, 10);
      ctx.fill();
    }, { blur: 14, dy: 4, alpha: dark ? 0.5 : 0.18 });
    ctx.strokeStyle = hexA(gold, 0.45);
    ctx.lineWidth = 1;
    rrect(ctx, cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1, 10);
    ctx.stroke();
    caption(ctx, cardX + 14, cardY + 16, "EVIDENCE", theme, { size: 10, color: gold, weight: 800 });
    lines.forEach((line, i) => {
      caption(ctx, cardX + 14, cardY + 36 + i * 16, line, theme, { size: 12, color: theme.ink });
    });
    ctx.restore();
  }

  /* ---- the run so far ---- */
  const judged = Object.keys(state.judged).length;
  const correct = Object.values(state.judged).filter(Boolean).length;
  const chipY = panelY + panelH - 74;
  const chipW = (panelW - 34) / SPECIMENS.length;
  SPECIMENS.forEach((cand, i) => {
    const cx0 = panelX + 17 + i * chipW;
    const done = cand.id in state.judged;
    const ok = state.judged[cand.id] === true;
    const col = !done ? theme.sci["mass"] : ok ? yes : no;
    plastic(ctx, cx0, chipY, chipW - 5, 12, col, { radius: 4, matte: !done });
    if (cand.id === sp.id) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.accent, 0.9);
      ctx.lineWidth = 1.6;
      rrect(ctx, cx0 - 2, chipY - 2, chipW - 1, 16, 5);
      ctx.stroke();
      ctx.restore();
    }
  });
  caption(ctx, panelX + 17, chipY - 12, "SPECIMENS JUDGED", theme, {
    size: 10, color: theme.inkSoft, weight: 700,
  });
  arcGauge(
    ctx, panelX + panelW - 44, panelY + panelH - 44, 30,
    correct / SPECIMENS.length, yes, theme, `${fmtInt(correct)}/${SPECIMENS.length}`,
    { sub: "right", width: 7, ticks: 7 },
  );
  caption(ctx, panelX + 17, panelY + panelH - 44, `${fmtInt(judged)} judged`, theme, {
    size: 12, color: theme.inkSoft,
  });

  vignette(ctx, w, h, 0.16);
}

export const g6a1SystemOrHeap: SimManifest<BenchState> = {
  id: "g6a1-system-or-heap",
  title: "Systems Inspection Bench",
  tagline: "Run three tests on each object under the lamp and decide: a system, or just a heap?",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ETS1-1", "MS-LS1-3"] },
  learningGoals: [
    "Apply three tests — distinct parts, parts that affect each other, a job of the whole — to any object.",
    "Explain why the same parts in a crate are not the system the bicycle is.",
    "Justify a classification with evidence rather than with how complicated the object looks.",
  ],
  misconceptions: [
    "Anything with lots of parts is a system",
    "A collection of identical objects (a pile, a jar, a heap) is a system",
    "A system is just a machine, so living or human groups do not count",
  ],
  interactionHint: "Flip the three test switches, then click the bench to lock your verdict.",
  params: {
    specimen: {
      type: "option", label: "On the bench",
      options: SPECIMENS.map((s) => ({ value: s.id, label: s.name })),
      default: "bicycle",
    },
    testParts: {
      type: "boolean", label: "Test 1 · Has distinct parts", default: false,
      help: "Can you name pieces that are different from one another?",
    },
    testInteract: {
      type: "boolean", label: "Test 2 · Parts affect each other", default: false,
      help: "If you removed one part, would the others behave differently?",
    },
    testJob: {
      type: "boolean", label: "Test 3 · Whole does a job", default: false,
      help: "Does the whole thing do something no single part can do alone?",
    },
  },
  overlays: [{ key: "labels", label: "Part labels", default: true, bands: ["6-8"] }],
  model: benchModel,
  render: renderBench,
  labs: [
    {
      id: "same-parts",
      title: "Same parts, different thing",
      question: "A bicycle and a crate of bicycle parts hold the same pieces. Is the crate a system?",
      bands: ["3-5", "6-8"],
      minutes: 18,
      standards: ["MS-ETS1-1"],
      setup: { specimen: "bikeparts", testParts: false, testInteract: false, testJob: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The crate holds every part of the bicycle. Commit before you inspect it.",
          predict: {
            prompt: "How many of the three tests does the crate of parts pass?",
            options: ["All three", "Two of three", "One of three", "None"],
            correct: 2,
            reveal:
              "One. It has distinct parts, but nothing connects them, so nothing affects anything else and the crate carries nobody.",
          },
        },
        {
          id: "crate",
          phase: "measure",
          title: "Judge the crate",
          instruction: "Set the three switches for the crate, then click the bench to lock it in.",
          check: {
            describe: "The crate of bike parts is judged correctly",
            test: (v) => v.facts.ok_bikeparts === true,
          },
          hints: [
            "Look for a chain that turns a wheel. Is there one?",
            "Test 1 asks about parts existing, not about parts working.",
            "Distinct parts: yes. Affecting each other: no. Job of the whole: no.",
          ],
        },
        {
          id: "bike",
          phase: "measure",
          title: "Now judge the bicycle",
          instruction: "Switch the bench to the bicycle and judge it the same way.",
          check: {
            describe: "The bicycle is judged correctly",
            test: (v) => v.facts.ok_bicycle === true,
          },
          hints: ["Watch the chain. It connects the pedals to the rear wheel."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "What changed?",
          instruction: "The parts are identical. Only one is a system.",
          write: {
            prompt: "The bicycle and the crate hold the same parts. What does the bicycle have that the crate does not?",
            placeholder: "The bicycle has ... so its parts can ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Write a test another student could use on any object.",
          write: {
            prompt: "Finish this: a pile of parts becomes a system when ...",
            placeholder: "A pile of parts becomes a system when ...",
          },
        },
      ],
    },
    {
      id: "which-test-fails",
      title: "Which test does it fail?",
      question: "When something is not a system, exactly which test does it fail?",
      bands: ["6-8"],
      minutes: 20,
      setup: { specimen: "marbles", testParts: false, testInteract: false, testJob: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "A jar holds forty marbles. Choose before you inspect it.",
          predict: {
            prompt: "Which test does the jar of marbles fail?",
            options: [
              "Test 1: it has no distinct parts",
              "Test 2: the marbles do not affect each other",
              "It fails nothing — it is a system",
            ],
            correct: 1,
            reveal:
              "It fails tests 2 and 3. Remove a marble and every other marble behaves exactly as before, and the jar as a whole does no job.",
          },
        },
        {
          id: "three",
          phase: "measure",
          title: "Inspect three specimens",
          instruction: "Judge the marbles, the beehive and the brick pile. Record a row for each.",
          requireData: 3,
          check: {
            describe: "Three specimens have been judged",
            test: (v) => (v.facts.judgedCount as number) >= 3,
          },
          hints: [
            "A beehive keeps its own temperature. That is a job of the whole colony.",
            "Bricks touch, but touching is not affecting.",
          ],
        },
        {
          id: "accuracy",
          phase: "analyze",
          title: "Get four right",
          instruction: "Keep inspecting until at least four specimens are judged correctly.",
          check: {
            describe: "Four or more specimens judged correctly",
            test: (v) => (v.facts.correctCount as number) >= 4,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the deciding test",
          instruction: "One test separated the systems from the heaps almost every time.",
          write: {
            prompt: "Which of the three tests did the heaps fail, and why is that test the important one?",
            placeholder: "The heaps failed test ... because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "inspector",
      title: "Earn the inspector's badge",
      brief: "Judge specimens correctly — all three switches must match the evidence.",
      bands: ["3-5", "6-8"],
      setup: { specimen: "flashlight", testParts: false, testInteract: false, testJob: false },
      goal: {
        describe: "Three specimens judged correctly",
        test: (v) => (v.facts.correctCount as number) >= 3,
      },
      stars: {
        two: { describe: "Five judged correctly", test: (v) => (v.facts.correctCount as number) >= 5 },
        three: { describe: "All six judged correctly", test: (v) => (v.facts.correctCount as number) >= 6 },
      },
      hints: ["A wrong switch still counts as wrong even when the verdict happens to be right."],
    },
    {
      id: "impostor",
      title: "Spot the impostor",
      brief: "Correctly judge both the bicycle and the crate holding its parts.",
      bands: ["6-8"],
      setup: { specimen: "bicycle", testParts: false, testInteract: false, testJob: false },
      goal: {
        describe: "Bicycle and crate both judged correctly",
        test: (v) => v.facts.ok_bicycle === true && v.facts.ok_bikeparts === true,
      },
      stars: {
        two: {
          describe: "Add the flashlight",
          test: (v) =>
            v.facts.ok_bicycle === true && v.facts.ok_bikeparts === true && v.facts.ok_flashlight === true,
        },
        three: {
          describe: "Every specimen judged correctly",
          test: (v) => (v.facts.correctCount as number) >= 6,
        },
      },
      hints: ["The two crates differ in one test only. Find which one."],
    },
  ],
};

/* ================================================================== *
 * A1.2 — Subsystem Assembly Bay
 *
 * A build-it sandbox. The student installs subsystems into a delivery drone
 * one at a time; each subsystem is itself made of parts, so the containment
 * map grows three levels deep. Nothing works until every required subsystem
 * is present, and then real momentum theory decides how long it hovers:
 * P = T^1.5 / sqrt(2 rho A), divided by a rotor figure of merit and the
 * drivetrain efficiency. A bigger battery does not simply mean a longer
 * flight, because the battery is part of the mass it has to lift.
 * ================================================================== */

const G_ACC = 9.81;
const AIR_RHO = 1.225;
/** One 4S 5000 mAh lithium pack: 14.8 V x 5 Ah = 74 Wh, about 490 g. */
const PACK_WH = 74;
const PACK_KG = 0.49;
/** Rotor figure of merit and drivetrain efficiency for a small multirotor. */
const FIGURE_OF_MERIT = 0.72;
const DRIVE_EFF = 0.82;
const USABLE_FRACTION = 0.85;

interface Subsystem {
  id: string;
  name: string;
  role: string;
  /** Dry mass in kg, before batteries or cargo. */
  mass: number;
  required: boolean;
  parts: { name: string; n: number }[];
  sci: string;
}

const SUBSYSTEMS: Subsystem[] = [
  {
    id: "frame", name: "Airframe", role: "holds everything in place", mass: 0.42, required: true,
    sci: "mass",
    parts: [{ name: "arm", n: 4 }, { name: "body plate", n: 2 }, { name: "landing leg", n: 2 }],
  },
  {
    id: "propulsion", name: "Propulsion", role: "makes the lifting thrust", mass: 0.36, required: true,
    sci: "velocity",
    parts: [{ name: "motor", n: 4 }, { name: "propeller", n: 4 }, { name: "speed controller", n: 4 }],
  },
  {
    id: "power", name: "Power", role: "stores and delivers energy", mass: 0.08, required: true,
    sci: "current",
    parts: [{ name: "battery pack", n: 1 }, { name: "power board", n: 1 }, { name: "harness", n: 1 }],
  },
  {
    id: "control", name: "Flight control", role: "senses and decides", mass: 0.09, required: true,
    sci: "field",
    parts: [
      { name: "flight computer", n: 1 }, { name: "gyroscope", n: 1 },
      { name: "accelerometer", n: 1 }, { name: "barometer", n: 1 }, { name: "GPS receiver", n: 1 },
    ],
  },
  {
    id: "comms", name: "Communications", role: "carries commands in and data out", mass: 0.05,
    required: false, sci: "light",
    parts: [{ name: "radio receiver", n: 1 }, { name: "antenna", n: 2 }, { name: "telemetry link", n: 1 }],
  },
  {
    id: "payload", name: "Payload bay", role: "carries the delivery", mass: 0.11, required: false,
    sci: "secondary-consumer",
    parts: [{ name: "bay shell", n: 1 }, { name: "latch", n: 1 }, { name: "release servo", n: 1 }],
  },
];

const PROP_SPECS: Record<string, { radius: number; maxThrust: number; label: string }> = {
  "8": { radius: 0.1016, maxThrust: 6.5, label: "8 inch" },
  "10": { radius: 0.127, maxThrust: 9.8, label: "10 inch" },
  "12": { radius: 0.1524, maxThrust: 13.5, label: "12 inch" },
};

interface DroneSpec {
  installed: Record<string, boolean>;
  subsystemCount: number;
  partCount: number;
  mass: number;
  hoverPower: number;
  maxThrust: number;
  twr: number;
  enduranceMin: number;
  ready: boolean;
  commandable: boolean;
  cargo: number;
}

function droneSpec(p: Record<string, number | boolean | string>): DroneSpec {
  const installed: Record<string, boolean> = {};
  for (const sub of SUBSYSTEMS) installed[sub.id] = p[sub.id] === true;
  const packs = Math.max(1, Math.round(p.packs as number));
  const cargo = installed.payload ? (p.cargo as number) : 0;
  const prop = PROP_SPECS[String(p.props ?? "10")] ?? PROP_SPECS["10"];

  let mass = 0;
  let partCount = 0;
  let subsystemCount = 0;
  for (const sub of SUBSYSTEMS) {
    if (!installed[sub.id]) continue;
    subsystemCount += 1;
    mass += sub.mass;
    partCount += sub.parts.reduce((n, part) => n + part.n, 0);
    // Extra packs are extra parts, and extra mass, inside the power subsystem.
    if (sub.id === "power") { mass += packs * PACK_KG; partCount += packs - 1; }
  }
  mass += cargo;

  const complete = SUBSYSTEMS.every((s) => !s.required || installed[s.id]);
  const discArea = 4 * Math.PI * prop.radius * prop.radius;
  const thrust = mass * G_ACC;
  // Momentum theory: ideal induced power first, then the real losses.
  const idealPower = Math.pow(Math.max(thrust, 0.01), 1.5) / Math.sqrt(2 * AIR_RHO * discArea);
  const hoverPower = complete ? idealPower / (FIGURE_OF_MERIT * DRIVE_EFF) : 0;
  const maxThrust = installed.propulsion ? 4 * prop.maxThrust : 0;
  const twr = thrust > 0 ? maxThrust / thrust : 0;
  const usableWh = installed.power ? packs * PACK_WH * USABLE_FRACTION : 0;
  const enduranceMin = hoverPower > 1 ? (usableWh / hoverPower) * 60 : 0;

  return {
    installed, subsystemCount, partCount, mass, hoverPower, maxThrust, twr,
    enduranceMin, ready: complete && twr >= 1.3, commandable: installed.comms, cargo,
  };
}

interface DroneState {
  t: number;
  spin: number;
  /** Eased 0..1 install animation per subsystem. */
  grow: Record<string, number>;
  /** Eased hover height, 0 on the pad. */
  lift: number;
  flying: boolean;
  /** Minutes of test flight elapsed. */
  flightMin: number;
  chargeFrac: number;
  dust: { x: number; y: number; v: number; r: number }[];
  landed: boolean;
  bestMinutes: number;
  bestCargo: number;
}

const droneModel: SimModel<DroneState> = {
  init(params, ctx) {
    const grow: Record<string, number> = {};
    for (const sub of SUBSYSTEMS) grow[sub.id] = params[sub.id] === true ? 1 : 0;
    const dust = [];
    for (let i = 0; i < 46; i++) {
      dust.push({
        x: ctx.rng.next(), y: ctx.rng.next(),
        v: ctx.rng.range(0.02, 0.09), r: ctx.rng.range(0.7, 2.1),
      });
    }
    return {
      t: 0, spin: 0, grow, lift: 0, flying: false, flightMin: 0,
      chargeFrac: 1, dust, landed: false, bestMinutes: 0, bestCargo: 0,
    };
  },

  step(state, dt, params, _ctx, inputs) {
    const spec = droneSpec(params);
    let flying = state.flying;
    let flightMin = state.flightMin;
    let chargeFrac = state.chargeFrac;
    let landed = state.landed;
    let bestMinutes = state.bestMinutes;
    let bestCargo = state.bestCargo;

    for (const input of inputs) {
      const go =
        input.type === "pointerdown" ||
        (input.type === "action" && (input.action === "launch" || input.action === "test"));
      if (go) {
        if (flying) {
          flying = false;
        } else if (spec.ready) {
          flying = true; flightMin = 0; chargeFrac = 1; landed = false;
        }
      }
    }
    if (!spec.ready && flying) { flying = false; landed = true; }

    // One real second on the test stand is one minute of flight.
    if (flying && spec.enduranceMin > 0) {
      flightMin += dt * 60;
      chargeFrac = clamp01(1 - flightMin / spec.enduranceMin);
      if (chargeFrac <= 0) {
        flying = false; landed = true;
        if (flightMin > bestMinutes) { bestMinutes = flightMin; bestCargo = spec.cargo; }
      }
    }

    const grow: Record<string, number> = {};
    const k = Math.min(1, dt * 4.5);
    for (const sub of SUBSYSTEMS) {
      const want = params[sub.id] === true ? 1 : 0;
      grow[sub.id] = (state.grow[sub.id] ?? 0) + (want - (state.grow[sub.id] ?? 0)) * k;
    }

    const wantLift = flying ? 1 : 0;
    const lift = state.lift + (wantLift - state.lift) * Math.min(1, dt * 2.2);
    const rotorRate = flying ? 26 : spec.ready ? 3 : 0;

    const dust = state.dust.map((d) => {
      const push = flying ? 1.6 : 0.35;
      const y = d.y - d.v * push * dt;
      return y < 0 ? { ...d, y: y + 1 } : { ...d, y };
    });

    return {
      ...state,
      t: state.t + dt,
      spin: state.spin + dt * rotorRate,
      grow, lift, flying, flightMin, chargeFrac, dust, landed,
      bestMinutes, bestCargo,
    };
  },

  readouts(state, params) {
    const spec = droneSpec(params);
    return [
      { key: "subsystems", label: "Subsystems installed", quantity: q(spec.subsystemCount, "count"), semantic: "distance" },
      { key: "parts", label: "Parts inside them", quantity: q(spec.partCount, "count"), semantic: "mass" },
      { key: "mass", label: "Takeoff mass", quantity: q(spec.mass, "mass"), unit: "kg", semantic: "mass", graphable: true },
      { key: "hoverPower", label: "Hover power", quantity: q(spec.hoverPower, "power"), unit: "W", semantic: "energy-total", graphable: true },
      { key: "twr", label: "Thrust to weight", quantity: q(spec.twr, "ratio"), semantic: "force" },
      { key: "endurance", label: "Predicted hover time", quantity: q(spec.enduranceMin * 60, "time"), unit: "min", semantic: "time", graphable: true },
      {
        key: "flightMin", label: "Test flight so far", quantity: q(state.flightMin * 60, "time"), unit: "min",
        semantic: "time", bands: ["6-8", "9-12"],
      },
      {
        key: "charge", label: "Charge left", quantity: q(state.chargeFrac, "percent"), unit: "%",
        semantic: "current", graphable: true,
      },
    ];
  },

  facts(state, params) {
    const spec = droneSpec(params);
    const missing = SUBSYSTEMS.filter((s) => s.required && !spec.installed[s.id]).map((s) => s.name);
    return {
      ready: spec.ready,
      commandable: spec.commandable,
      subsystemCount: spec.subsystemCount,
      partCount: spec.partCount,
      mass: spec.mass,
      hoverPower: spec.hoverPower,
      twr: spec.twr,
      endurance: spec.enduranceMin,
      cargo: spec.cargo,
      flying: state.flying,
      landed: state.landed,
      flightMinutes: state.flightMin,
      bestMinutes: state.bestMinutes,
      bestCargo: state.bestCargo,
      missingCount: missing.length,
      missing: missing.join(", "),
    };
  },
};

/* ---- assembly bay artwork --------------------------------------- */

/** One rotor seen in a shallow three-quarter view. */
function rotor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, spin: number, spinning: boolean,
  color: string, theme: ThemeLike, present: number,
) {
  const ry = r * 0.42;
  ctx.save();
  ctx.globalAlpha = present;
  if (present < 0.99) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (spinning) {
    // A swept disc: what a spinning propeller actually looks like.
    const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, hexA(color, 0.05));
    g.addColorStop(0.75, hexA(color, 0.22));
    g.addColorStop(1, hexA(color, 0.04));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(color, 0.45);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = spin * 0.6 + (i * Math.PI * 2) / 3;
      ctx.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * ry * 0.25);
      ctx.lineTo(x + Math.cos(a) * r * 0.96, y + Math.sin(a) * ry * 0.96);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = hexA(color, 0.9);
    ctx.lineWidth = Math.max(2, r * 0.13);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      const a = spin * 0.3 + i * Math.PI;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * ry * 0.95);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrone(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  spec: DroneSpec, st: DroneState, theme: ThemeLike,
) {
  const armLen = size * 0.42;
  const propR = size * 0.19;
  const steel = theme.sci["mass"];
  const armAngles = [-Math.PI * 0.78, -Math.PI * 0.22, Math.PI * 0.22, Math.PI * 0.78];
  const framePresent = st.grow.frame ?? 0;
  const propPresent = st.grow.propulsion ?? 0;
  const spinning = st.spin > 0 && (st.flying || spec.ready);

  const motorPos = armAngles.map((a) => ({
    x: cx + Math.cos(a) * armLen,
    y: cy + Math.sin(a) * armLen * 0.45,
    back: Math.sin(a) < 0,
  }));

  // Back arms first, so the body overlaps them and the scene has depth.
  for (const pass of [true, false]) {
    motorPos.forEach((m, i) => {
      if (m.back !== pass) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0.18, framePresent);
      if (framePresent > 0.05) {
        ctx.strokeStyle = steel;
        ctx.lineWidth = size * 0.045 * framePresent + 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
      } else {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      if (framePresent > 0.2) {
        metal(ctx, m.x - size * 0.032, m.y - size * 0.055, size * 0.064, size * 0.06, steel, {
          radius: size * 0.014,
        });
      }
      rotor(
        ctx, m.x, m.y - size * 0.06, propR, st.spin + i * 1.3, spinning,
        theme.sci["velocity"], theme, Math.max(0.2, propPresent),
      );
      if (st.flying && propPresent > 0.5) {
        arrow(ctx, m.x, m.y - size * 0.09, m.x, m.y - size * 0.09 - size * 0.2, theme.sci["force"], {
          width: 2, head: 8,
        });
      }
    });
    if (pass) {
      // The body sits between the far arms and the near ones.
      const bw = size * 0.34, bh = size * 0.17;
      plastic(ctx, cx - bw / 2, cy - bh * 0.75, bw, bh, theme.sci["energy-total"], {
        radius: size * 0.05,
      });
      glass(ctx, cx - bw * 0.3, cy - bh * 0.95, bw * 0.6, bh * 0.7, size * 0.03, theme, {
        tint: theme.sci["velocity"], alpha: 0.42,
      });
      // Flight controller: a small lit board on the spine.
      if ((st.grow.control ?? 0) > 0.1) {
        ctx.save();
        ctx.globalAlpha = st.grow.control ?? 0;
        plastic(ctx, cx - bw * 0.18, cy - bh * 0.28, bw * 0.36, bh * 0.3, theme.sci["field"], {
          radius: size * 0.012,
        });
        lamp(ctx, cx, cy - bh * 0.12, size * 0.012, theme.sci["field"], 0.4 + 0.6 * pulse(st.t, 1.4), theme);
        ctx.restore();
      }
      // Power: the pack under the spine, with its charge showing.
      if ((st.grow.power ?? 0) > 0.05) {
        ctx.save();
        ctx.globalAlpha = st.grow.power ?? 0;
        const pw = size * 0.26, ph = size * 0.075;
        const px = cx - pw / 2, py = cy + bh * 0.32;
        plastic(ctx, px, py, pw, ph, theme.sci["current"], { radius: size * 0.012, matte: true });
        ctx.fillStyle = hexA(theme.sci["current"], 0.85);
        ctx.fillRect(px + 2, py + 2, (pw - 4) * clamp01(st.chargeFrac), ph - 4);
        ctx.restore();
      }
      // Comms: an antenna that only exists when the subsystem does.
      if ((st.grow.comms ?? 0) > 0.05) {
        ctx.save();
        ctx.globalAlpha = st.grow.comms ?? 0;
        ctx.strokeStyle = theme.sci["light"];
        ctx.lineWidth = Math.max(1.5, size * 0.008);
        ctx.beginPath();
        ctx.moveTo(cx + size * 0.1, cy - bh * 0.7);
        ctx.lineTo(cx + size * 0.13, cy - bh * 1.7);
        ctx.stroke();
        ctx.restore();
        const ring = (st.t * 0.8) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - ring) * 0.5 * (st.grow.comms ?? 0);
        ctx.strokeStyle = theme.sci["light"];
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx + size * 0.13, cy - bh * 1.7, size * 0.06 + ring * size * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // Payload bay, hanging below with the cargo inside it.
      if ((st.grow.payload ?? 0) > 0.05) {
        ctx.save();
        ctx.globalAlpha = st.grow.payload ?? 0;
        const cw = size * 0.16, ch = size * 0.12;
        material(
          ctx, cx - cw / 2, cy + bh * 0.75, cw, ch, theme.sci["secondary-consumer"], size * 0.012,
        );
        ctx.strokeStyle = hexA(theme.ink, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - cw / 2, cy + bh * 0.75 + ch * 0.55);
        ctx.lineTo(cx + cw / 2, cy + bh * 0.75 + ch * 0.55);
        ctx.stroke();
        ctx.restore();
      }
      // Landing legs.
      if (framePresent > 0.3) {
        ctx.save();
        ctx.globalAlpha = framePresent;
        ctx.strokeStyle = steel;
        ctx.lineWidth = Math.max(2, size * 0.018);
        ctx.lineCap = "round";
        ctx.beginPath();
        for (const s of [-1, 1]) {
          ctx.moveTo(cx + s * size * 0.09, cy + bh * 0.4);
          ctx.lineTo(cx + s * size * 0.14, cy + size * 0.19);
        }
        ctx.stroke();
        ctx.restore();
      }
      // Navigation lights: green forward, red aft, blinking like the real thing.
      const blink = pulse(st.t, 1.1) > 0.5 ? 1 : 0.15;
      lamp(ctx, cx - size * 0.13, cy + size * 0.02, size * 0.014, theme.sci["energy-kinetic"], blink, theme);
      lamp(ctx, cx + size * 0.13, cy + size * 0.02, size * 0.014, theme.sci["force"], 1 - blink * 0.8, theme);
    }
  }
}

function renderDrone(rc: RenderContext<DroneState>) {
  const { ctx, state, params, theme, width: w, height: h, band, overlays } = rc;
  const spec = droneSpec(params);
  const dark = isDarkTheme(theme);
  const panelW = Math.max(210, Math.min(w * 0.33, 330));
  const panelX = w - panelW - 12;
  const floorY = h * 0.84;
  const bayW = panelX - 12;
  const size = Math.min(bayW * 0.62, h * 0.52);
  const padCx = bayW * 0.5;
  const hoverH = h * 0.20 * easeInOut(state.lift);
  const bob = state.flying ? Math.sin(state.t * 2.1) * size * 0.012 : 0;
  const cy = floorY - size * 0.30 - hoverH + bob;

  /* ---- the bay ---- */
  sky(ctx, w, h, theme, "indoor", floorY);
  gridPaper(ctx, w, floorY, theme, { step: 30, major: 5, alpha: dark ? 0.32 : 0.45, fade: 0.5 });
  groundPlane(ctx, floorY, 0, w, h, theme, "lab");
  noiseWash(ctx, 0, floorY, w, h - floorY, { alpha: dark ? 0.05 : 0.035, seed: 17 });

  // Gantry rails: the bay has a ceiling and a machine in it.
  metal(ctx, 0, h * 0.045, w, 12, theme.sci["mass"], { radius: 3, polish: 0.8 });
  for (const gx of [bayW * 0.08, bayW * 0.92]) {
    metal(ctx, gx - 7, h * 0.055, 14, floorY - h * 0.055, theme.sci["mass"], { radius: 3, polish: 0.6 });
  }
  // The hoist cable, still attached while the drone is on the pad.
  if (state.lift < 0.35) {
    ctx.save();
    ctx.globalAlpha = 1 - state.lift / 0.35;
    ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(padCx, h * 0.057);
    ctx.lineTo(padCx, cy - size * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  // Test pad.
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.22);
  ctx.beginPath();
  ctx.ellipse(padCx, floorY + 6, size * 0.52, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.accent, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = hexA(theme.accent, 0.35);
  ctx.beginPath();
  ctx.ellipse(padCx, floorY + 6, size * 0.34, size * 0.072, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Dust lifted by the rotors.
  const motes = state.dust.map((d) => {
    const y = floorY - d.y * (floorY - h * 0.1);
    const spread = state.flying ? 1.5 : 0.7;
    return {
      x: bayW * 0.5 + (d.x - 0.5) * bayW * spread, y, r: d.r,
      a: 0.2 + 0.5 * (1 - d.y),
    };
  });
  particleField(ctx, motes, theme.sci["light"], { size: 1.3, alpha: 0.35, buckets: 3 });

  contactShadow(ctx, padCx, floorY + 6, size * 0.30, hoverH);
  if (state.flying) {
    // Downwash: two ribbons of moving air pushed at the floor.
    for (const s of [-1, 1]) {
      ribbon(ctx, [
        { x: padCx + s * size * 0.16, y: cy + size * 0.1 },
        { x: padCx + s * size * 0.26, y: cy + (floorY - cy) * 0.6 },
        { x: padCx + s * size * 0.5, y: floorY - 4 },
      ], size * 0.07, hexA(theme.sci["velocity"], 0.28), hexA(theme.sci["velocity"], 0), { taper: 1 });
    }
  }

  drawDrone(ctx, padCx, cy, size, spec, state, theme);

  /* ---- live values, beside the thing they describe ---- */
  badge(ctx, padCx - size * 0.42, cy + size * 0.30, `${fmt(spec.mass, 2)} kg`, theme, {
    align: "center", color: theme.sci["mass"], sub: "takeoff mass",
  });
  if (spec.ready) {
    badge(ctx, padCx + size * 0.44, cy + size * 0.30, `${fmt(spec.enduranceMin, 1)} min`, theme, {
      align: "center", color: theme.sci["time"], sub: "hover time",
    });
    badge(ctx, padCx + size * 0.44, cy - size * 0.22, `${fmtInt(spec.hoverPower)} W`, theme, {
      align: "center", color: theme.sci["current"],
    });
  }
  if (state.flying) {
    badge(ctx, padCx, cy - size * 0.46, `${fmt(state.flightMin, 1)} min in the air`, theme, {
      align: "center", color: theme.sci["energy-kinetic"],
    });
  }

  /* ---- leaders naming the subsystems on the machine ---- */
  if (overlays.labels !== false && band !== "3-5") {
    const leaders: [number, number, string, string, string][] = [
      [padCx - size * 0.42, cy - size * 0.14, "Propulsion", "motor, prop, controller", "propulsion"],
      [padCx, cy + size * 0.10, "Power", `${fmtInt(params.packs as number)} pack, board, harness`, "power"],
      [padCx + size * 0.02, cy - size * 0.03, "Flight control", "computer, gyro, GPS", "control"],
    ];
    let ly = h * 0.16;
    for (const [fx, fy, text, sub, id] of leaders) {
      if (!spec.installed[id]) continue;
      labelLeader(ctx, fx, fy, Math.min(132, bayW * 0.32), ly, text, theme, {
        sub, size: 12, color: theme.sci[SUBSYSTEMS.find((s) => s.id === id)?.sci ?? "mass"],
        align: "left",
      });
      ly += 54;
    }
  }

  /* ---- readiness ---- */
  if (!spec.ready) {
    const missing = SUBSYSTEMS.filter((s) => s.required && !spec.installed[s.id]).map((s) => s.name);
    const msg = missing.length
      ? `Not a system yet — missing ${missing.join(", ")}`
      : "Too heavy for these propellers";
    caption(ctx, 18, floorY + 26, msg, theme, { size: 13, color: theme.sci["force"], weight: 700 });
  } else {
    caption(
      ctx, 18, floorY + 26,
      state.flying ? "Test flight running" : "Ready — click the bay to run a test flight",
      theme, { size: 13, color: theme.sci["energy-kinetic"], weight: 700 },
    );
  }

  /* ---- the containment map ---- */
  panel(ctx, panelX, h * 0.05, panelW, h * 0.9, theme, theme.accent, "CONTAINMENT MAP");
  const rootY = h * 0.05 + 34;
  bevelRect(ctx, panelX + 12, rootY, panelW - 24, 34, 8, theme.surface, { depth: 1 });
  caption(ctx, panelX + 24, rootY + 13, "Delivery drone", theme, { size: 13, weight: 800 });
  caption(ctx, panelX + 24, rootY + 26, "the system", theme, { size: 10, color: theme.inkSoft });
  badge(ctx, panelX + panelW - 20, rootY + 17, `${fmtInt(spec.partCount)}`, theme, {
    align: "right", color: theme.accent,
  });

  const rowsTop = rootY + 48;
  const rowH = Math.min(46, (h * 0.9 - (rowsTop - h * 0.05) - 70) / SUBSYSTEMS.length);
  SUBSYSTEMS.forEach((sub, i) => {
    const y = rowsTop + i * rowH;
    const on = state.grow[sub.id] ?? 0;
    const col = theme.sci[sub.sci];
    // The nesting bracket: these boxes are inside the box above them.
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 22, rootY + 34);
    ctx.lineTo(panelX + 22, y + rowH * 0.4);
    ctx.lineTo(panelX + 30, y + rowH * 0.4);
    ctx.stroke();
    ctx.restore();

    const bx = panelX + 30, bw = panelW - 44, bh = rowH - 8;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * easeInOut(on);
    bevelRect(ctx, bx, y, bw, bh, 7, theme.surface, { depth: on > 0.5 ? 0.8 : -0.6 });
    ctx.restore();
    if (on > 0.02) {
      ctx.save();
      ctx.globalAlpha = on;
      ctx.fillStyle = col;
      rrect(ctx, bx, y, 3.5, bh, 2);
      ctx.fill();
      ctx.restore();
    }
    caption(ctx, bx + 12, y + 13, sub.name, theme, {
      size: 12, weight: 700, color: on > 0.5 ? theme.ink : theme.inkSoft,
    });
    caption(ctx, bx + 12, y + 26, sub.required ? "required" : "optional", theme, {
      size: 9.5, color: on > 0.5 ? col : theme.inkSoft,
    });
    // Part dots: the third level of nesting, drawn rather than described.
    if (overlays.parts !== false) {
      let dotX = bx + bw - 12;
      const n = sub.parts.reduce((acc, p) => acc + p.n, 0) + (sub.id === "power" ? Math.round(params.packs as number) - 1 : 0);
      for (let k = 0; k < Math.min(n, 14); k++) {
        const grown = clamp01(on * 1.4 - k * 0.04);
        if (grown <= 0.01) continue;
        sphere(ctx, dotX, y + bh - 11, 3.1 * grown, col, { rim: false });
        dotX -= 8.5;
      }
      caption(ctx, bx + 12, y + bh - 7, `${fmtInt(n)} parts`, theme, { size: 9.5, color: theme.inkSoft });
    }
  });

  const footY = h * 0.05 + h * 0.9 - 52;
  caption(
    ctx, panelX + 16, footY,
    `1 system · ${fmtInt(spec.subsystemCount)} subsystems · ${fmtInt(spec.partCount)} parts`,
    theme, { size: 11.5, color: theme.inkSoft, weight: 700 },
  );
  arcGauge(
    ctx, panelX + panelW - 48, footY + 6, 26, clamp01(state.chargeFrac), theme.sci["current"], theme,
    `${fmtInt(state.chargeFrac * 100)}`, { sub: "charge", width: 6, ticks: 5 },
  );
  caption(ctx, panelX + 16, footY + 22, `thrust to weight ${fmt(spec.twr, 2)}`, theme, {
    size: 11, color: spec.twr >= 1.6 ? theme.sci["energy-kinetic"] : theme.sci["acceleration"],
  });

  vignette(ctx, w, h, 0.18);
}

export const g6a1DroneAssembly: SimManifest<DroneState> = {
  id: "g6a1-drone-assembly",
  title: "Subsystem Assembly Bay",
  tagline: "Install subsystems into a delivery drone until it is a system that can actually fly.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9],
  standards: { ngss: ["MS-ETS1-2", "MS-ETS1-3", "MS-ETS1-4"] },
  learningGoals: [
    "Identify the subsystems of a machine and the parts nested inside each one.",
    "Explain why a system stops working when one required subsystem is removed.",
    "Predict how added mass changes hover power and flight time.",
  ],
  misconceptions: [
    "Adding more parts always makes a system better",
    "Every part of a system matters equally",
    "A subsystem is just a part, so there is only one level of structure",
  ],
  interactionHint: "Switch subsystems on, then click the bay to run a test flight.",
  params: {
    frame: { type: "boolean", label: "Airframe", default: true, help: "Arms, body plates, legs. Required." },
    propulsion: { type: "boolean", label: "Propulsion", default: true, help: "Motors, propellers, speed controllers. Required." },
    power: { type: "boolean", label: "Power", default: true, help: "Battery packs, power board, harness. Required." },
    control: { type: "boolean", label: "Flight control", default: true, help: "Computer, gyroscope, barometer, GPS. Required." },
    comms: { type: "boolean", label: "Communications", default: false, help: "Radio and antennas. It flies without them — but nobody can steer it." },
    payload: { type: "boolean", label: "Payload bay", default: false, help: "Needed before it can carry anything." },
    packs: {
      type: "number", label: "Battery packs", kind: "count",
      min: 1, max: 4, step: 1, default: 1,
      help: "Each pack holds 74 watt-hours and weighs 0.49 kg.",
    },
    cargo: {
      type: "number", label: "Cargo mass", kind: "mass", unit: "kg",
      min: 0, max: 1.2, step: 0.05, default: 0.4,
      help: "Only carried if the payload bay is installed.",
    },
    props: {
      type: "option", label: "Propeller size",
      options: Object.entries(PROP_SPECS).map(([k, v]) => ({ value: k, label: v.label })),
      default: "10", bands: ["6-8", "9-12"],
      help: "Bigger propellers push more air, so they hover on less power.",
    },
  },
  overlays: [
    { key: "parts", label: "Parts inside subsystems", default: true },
    { key: "labels", label: "Subsystem labels", default: true, bands: ["6-8", "9-12"] },
  ],
  model: droneModel,
  render: renderDrone,
  labs: [
    {
      id: "which-are-required",
      title: "Which subsystems are required?",
      question: "Take one subsystem out at a time. Which removals stop the drone flying?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ETS1-2"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: false, packs: 1, cargo: 0.4, props: "10",
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "Six subsystems are installed. Decide before you remove anything.",
          predict: {
            prompt: "Remove the communications subsystem. What happens?",
            options: [
              "It cannot lift off at all",
              "It still hovers, but nobody can send it commands",
              "Nothing changes at all",
            ],
            correct: 1,
            reveal:
              "It still hovers. Radios carry information, not lift — but without them the drone cannot be steered, so it is useless as a delivery system.",
          },
        },
        {
          id: "pull-comms",
          phase: "measure",
          title: "Pull the radios",
          instruction: "Switch Communications off and run a test flight.",
          check: {
            describe: "Comms removed and the drone still flies",
            test: (v) => v.params.comms === false && v.facts.ready === true,
          },
        },
        {
          id: "pull-power",
          phase: "measure",
          title: "Now pull the power",
          instruction: "Switch Power off. Watch what the map and the pad do.",
          check: {
            describe: "Power removed and the drone is grounded",
            test: (v) => v.params.power === false && v.facts.ready === false,
          },
          hints: ["A missing required subsystem is named under the pad."],
        },
        {
          id: "rebuild",
          phase: "setup",
          title: "Rebuild it",
          instruction: "Put back every required subsystem and get it flying again.",
          check: {
            describe: "All four required subsystems installed and flight-ready",
            test: (v) => v.facts.ready === true && (v.facts.missingCount as number) === 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Sort them",
          instruction: "Some subsystems are required, some add a capability.",
          write: {
            prompt: "Which subsystems were required for flight, and what did the optional ones add?",
            placeholder: "Required: ... Optional: ... because ...",
          },
        },
      ],
    },
    {
      id: "mass-costs-minutes",
      title: "What does one kilogram cost?",
      question: "How does added cargo change hover power and flight time?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: true, packs: 1, cargo: 0, props: "10",
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "You are about to double the cargo. Commit to an answer first.",
          predict: {
            prompt: "Doubling the cargo mass changes the hover power by roughly what?",
            options: [
              "No change — the motors just work harder for free",
              "It goes up by the same fraction as the mass",
              "It goes up faster than the mass does",
            ],
            correct: 2,
            reveal:
              "Hover power grows with mass to the power 1.5, so heavier costs more than proportionally. That is why range falls away quickly as cargo grows.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Four cargo masses",
          instruction: "Record hover power and hover time at 0, 0.3, 0.6 and 0.9 kg of cargo.",
          requireData: 4,
          hints: [
            "Change only the cargo. Packs and propellers stay put — that is the fair test.",
            "Record the row before you change the next slider.",
          ],
        },
        {
          id: "bigger-props",
          phase: "measure",
          title: "Change one subsystem",
          instruction: "Keep the cargo at 0.9 kg and fit 12-inch propellers. Record again.",
          check: {
            describe: "12-inch propellers fitted",
            test: (v) => v.params.props === "12",
          },
          requireData: 5,
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare",
          instruction: "One subsystem changed, and the whole system's performance moved.",
          write: {
            prompt: "What did bigger propellers do to hover power at the same mass, and why?",
            placeholder: "Bigger propellers ... because they push ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the trade-off",
          instruction: "Write the rule a delivery company would need.",
          write: {
            prompt: "Write a rule connecting cargo mass to flight time, and say where it stops being useful.",
            placeholder: "As cargo goes up ... The rule breaks when ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "half-kilo",
      title: "Deliver half a kilogram",
      brief: "Carry at least 0.5 kg of cargo and still hover for a useful time.",
      bands: ["6-8", "9-12"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: true, packs: 1, cargo: 0.5, props: "10",
      },
      goal: {
        describe: "Cargo 0.5 kg or more, hover time above 15 minutes",
        test: (v) => (v.facts.cargo as number) >= 0.5 && (v.facts.endurance as number) >= 15,
      },
      stars: {
        two: {
          describe: "Above 22 minutes with the same cargo",
          test: (v) => (v.facts.cargo as number) >= 0.5 && (v.facts.endurance as number) >= 22,
        },
        three: {
          describe: "Above 30 minutes, still controllable",
          test: (v) =>
            (v.facts.cargo as number) >= 0.5 && (v.facts.endurance as number) >= 30 &&
            (v.facts.twr as number) >= 1.6 && v.facts.commandable === true,
        },
      },
      hints: [
        "More packs mean more energy but also more mass. There is a best number.",
        "Bigger propellers hover on less power at the same mass.",
      ],
    },
    {
      id: "minimum-system",
      title: "The smallest thing that flies",
      brief: "Find the fewest parts that still make a working flying system.",
      bands: ["6-8", "9-12"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: true, packs: 2, cargo: 0.4, props: "10",
      },
      goal: {
        describe: "Flight-ready with 34 parts or fewer",
        test: (v) => v.facts.ready === true && (v.facts.partCount as number) <= 34,
      },
      stars: {
        two: {
          describe: "Flight-ready with exactly the four required subsystems",
          test: (v) => v.facts.ready === true && (v.facts.subsystemCount as number) === 4,
        },
        three: {
          describe: "Four subsystems, 28 parts, and a completed test flight",
          test: (v) =>
            v.facts.ready === true && (v.facts.partCount as number) <= 28 &&
            (v.facts.bestMinutes as number) > 0,
        },
      },
      hints: [
        "Optional subsystems add parts and mass. Which ones is the drone flyable without?",
        "One battery pack is one part. A second pack is a second part.",
        "Click the bay to fly it. A test flight ends when the charge runs out.",
      ],
    },
  ],
};
