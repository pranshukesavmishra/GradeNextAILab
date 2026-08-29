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
 * A build-it sandbox. The student installs subsystems into a delivery
 * drone and flies a real endurance test against momentum theory: hover
 * power P = T^1.5 / sqrt(2 rho A), divided by a figure of merit and the
 * motor efficiency. Doubling the battery does not double the flight,
 * because the battery is part of the mass it has to lift.
 * ================================================================== */

interface SubsystemSpec {
  key: string;
  name: string;
  short: string;
  /** Components inside the subsystem — the level below the subsystem level. */
  parts: { name: string; n: number }[];
  /** Dry mass in kg, excluding the battery cell itself. */
  mass: number;
  essential: boolean;
  why: string;
}

const SUBSYSTEMS: SubsystemSpec[] = [
  {
    key: "frame", name: "Airframe", short: "FRAME", mass: 0.32, essential: true,
    parts: [{ name: "arm", n: 4 }, { name: "body shell", n: 1 }, { name: "landing leg", n: 2 }],
    why: "Holds every other subsystem in the right place.",
  },
  {
    key: "propulsion", name: "Propulsion", short: "PROP", mass: 0.36, essential: true,
    parts: [{ name: "motor", n: 4 }, { name: "propeller", n: 4 }, { name: "speed controller", n: 4 }],
    why: "Turns electrical energy into thrust.",
  },
  {
    key: "power", name: "Power", short: "POWER", mass: 0.08, essential: true,
    parts: [{ name: "battery pack", n: 1 }, { name: "power board", n: 1 }, { name: "wiring loom", n: 1 }],
    why: "Stores and distributes the energy every other subsystem uses.",
  },
  {
    key: "control", name: "Flight control", short: "CONTROL", mass: 0.09, essential: true,
    parts: [
      { name: "flight computer", n: 1 }, { name: "gyroscope", n: 1 },
      { name: "barometer", n: 1 }, { name: "satellite receiver", n: 1 },
    ],
    why: "Senses attitude and trims each motor hundreds of times a second.",
  },
  {
    key: "comms", name: "Radio link", short: "RADIO", mass: 0.04, essential: false,
    parts: [{ name: "receiver", n: 1 }, { name: "antenna", n: 1 }],
    why: "Carries commands in and telemetry out. Not needed to hover.",
  },
  {
    key: "payload", name: "Payload bay", short: "PAYLOAD", mass: 0.11, essential: false,
    parts: [{ name: "bay shell", n: 1 }, { name: "latch", n: 1 }, { name: "release servo", n: 1 }],
    why: "The reason the whole system exists: it carries the parcel.",
  },
];

const RHO_AIR = 1.225;        // kg/m^3 at sea level
const FIGURE_OF_MERIT = 0.65; // real rotor, not an ideal actuator disc
const DRIVE_EFFICIENCY = 0.8; // motor and speed controller together
const USABLE_FRACTION = 0.8;  // a lithium pack is not flown flat
const CELL_ENERGY_DENSITY = 150 * 3600; // J per kg, a good 2020s lithium pack
/** The endurance test runs faster than life, so a 25-minute flight fits a lesson. */
const TEST_SPEEDUP = 20;

interface DroneSpec {
  installed: Record<string, boolean>;
  missing: string[];
  ready: boolean;
  mass: number;      // kg
  parts: number;
  subsystems: number;
  thrust: number;    // N
  discArea: number;  // m^2
  power: number;     // W of electrical power to hover
  endurance: number; // s
}

function droneSpec(params: Record<string, number | boolean | string>): DroneSpec {
  const installed: Record<string, boolean> = {};
  for (const sub of SUBSYSTEMS) installed[sub.key] = params[sub.key] === true;

  const energy = params.battery as number;               // J
  const cargo = params.cargo as number;                  // kg
  const radius = parseFloat(params.props as string) / 2; // m

  let mass = 0;
  let parts = 0;
  let subsystems = 0;
  const missing: string[] = [];
  for (const sub of SUBSYSTEMS) {
    if (!installed[sub.key]) {
      if (sub.essential) missing.push(sub.name);
      continue;
    }
    subsystems += 1;
    mass += sub.mass;
    for (const p of sub.parts) parts += p.n;
  }
  if (installed.power) mass += energy / CELL_ENERGY_DENSITY;
  if (installed.payload) mass += cargo;

  const ready = missing.length === 0;
  const thrust = mass * 9.81;
  const discArea = installed.propulsion ? 4 * Math.PI * radius * radius : 0;
  const idealPower = discArea > 0 ? Math.pow(thrust, 1.5) / Math.sqrt(2 * RHO_AIR * discArea) : 0;
  const power = idealPower / (FIGURE_OF_MERIT * DRIVE_EFFICIENCY);
  const endurance = ready && power > 0 ? (energy * USABLE_FRACTION) / power : 0;

  return { installed, missing, ready, mass, parts, subsystems, thrust, discArea, power, endurance };
}

interface DroneState {
  t: number;
  /** Eased 0..1 install animation per subsystem. */
  presence: Record<string, number>;
  alt: number;        // m
  spin: number;       // rad
  energy: number;     // J remaining
  flightTime: number; // s
  landed: boolean;
  best: number;       // s, longest completed hover this session
  dust: { x: number; y: number; v: number; r: number }[];
}

const HOVER_ALT = 1.6; // m

const droneModel: SimModel<DroneState> = {
  init(params, ctx) {
    const presence: Record<string, number> = {};
    for (const sub of SUBSYSTEMS) presence[sub.key] = params[sub.key] === true ? 1 : 0;
    const dust = [];
    for (let i = 0; i < 38; i++) {
      dust.push({
        x: ctx.rng.next(), y: ctx.rng.next(),
        v: ctx.rng.range(0.01, 0.05), r: ctx.rng.range(0.5, 1.7),
      });
    }
    return {
      t: 0, presence, alt: 0, spin: 0,
      energy: params.battery as number, flightTime: 0, landed: false, best: 0, dust,
    };
  },

  applyParams(state, params, prev) {
    // Any design change is a new aircraft, so the endurance test restarts.
    let changed = false;
    for (const key of Object.keys(params)) if (params[key] !== prev[key]) changed = true;
    if (!changed) return state;
    return { ...state, energy: params.battery as number, flightTime: 0, landed: false, alt: state.alt };
  },

  step(state, dt, params, _ctx, inputs) {
    const spec = droneSpec(params);
    let energy = state.energy;
    let flightTime = state.flightTime;
    let landed = state.landed;
    let best = state.best;

    for (const input of inputs) {
      const restart =
        input.type === "pointerdown" ||
        (input.type === "action" && (input.action === "launch" || input.action === "test"));
      if (restart) {
        energy = params.battery as number;
        flightTime = 0;
        landed = false;
      }
    }

    const flying = spec.ready && energy > 0;
    if (flying) {
      energy = Math.max(0, energy - spec.power * dt * TEST_SPEEDUP);
      flightTime += dt * TEST_SPEEDUP;
      if (energy <= 0) {
        landed = true;
        best = Math.max(best, flightTime);
      }
    }

    // A drone does not teleport to altitude; it climbs and settles.
    const target = flying ? HOVER_ALT : 0;
    const alt = state.alt + (target - state.alt) * Math.min(1, dt * 1.4);

    const presence: Record<string, number> = {};
    for (const sub of SUBSYSTEMS) {
      const want = params[sub.key] === true ? 1 : 0;
      const cur = state.presence[sub.key] ?? 0;
      presence[sub.key] = cur + (want - cur) * Math.min(1, dt * 4.5);
    }

    const rotorSpeed = flying ? 180 : spec.ready ? 12 : 0;
    const dust = state.dust.map((d) => {
      const y = d.y - d.v * dt * (1 + alt * 0.6);
      return y < 0 ? { ...d, y: y + 1 } : { ...d, y };
    });

    return {
      ...state,
      t: state.t + dt,
      spin: state.spin + rotorSpeed * dt,
      presence, alt, energy, flightTime, landed, best, dust,
    };
  },

  readouts(state, params) {
    const spec = droneSpec(params);
    return [
      { key: "mass", label: "Take-off mass", quantity: q(spec.mass, "mass"), unit: "kg", semantic: "mass", graphable: true },
      { key: "parts", label: "Parts installed", quantity: q(spec.parts, "count"), semantic: "distance" },
      { key: "subsystems", label: "Subsystems installed", quantity: q(spec.subsystems, "count"), semantic: "distance" },
      {
        key: "hoverPower", label: "Power to hover", quantity: q(spec.power, "power"), unit: "W",
        semantic: "energy-kinetic", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "endurance", label: "Predicted flight time", quantity: q(spec.endurance, "time"),
        unit: "min", semantic: "time", graphable: true,
      },
      { key: "flightTime", label: "Time in the air", quantity: q(state.flightTime, "time"), unit: "min", semantic: "time" },
      {
        key: "charge", label: "Battery left", unit: "%",
        quantity: q((params.battery as number) > 0 ? state.energy / (params.battery as number) : 0, "percent"),
        semantic: "energy-potential", graphable: true,
      },
      {
        key: "thrust", label: "Thrust needed", quantity: q(spec.thrust, "force"), unit: "N",
        semantic: "force", bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const spec = droneSpec(params);
    return {
      ready: spec.ready,
      missingCount: spec.missing.length,
      partCount: spec.parts,
      subsystemCount: spec.subsystems,
      mass: spec.mass,
      hoverPower: spec.power,
      enduranceMin: spec.endurance / 60,
      flightMin: state.flightTime / 60,
      bestMin: state.best / 60,
      carrying: spec.installed.payload ? (params.cargo as number) : 0,
      flying: spec.ready && state.energy > 0,
      landed: state.landed,
    };
  },
};
/* ---- assembly bay artwork --------------------------------------- */

function rotorDisc(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, ky: number, spin: number, fast: boolean, theme: ThemeLike,
) {
  const steel = theme.sci["mass"];
  if (fast) {
    // A spinning rotor is a disc of blur, not two blades.
    ctx.save();
    ctx.strokeStyle = hexA(steel, 0.28);
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * ky, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexA(theme.accent, 0.5);
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * ky, 0, spin % (Math.PI * 2), (spin % (Math.PI * 2)) + 1.7);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = hexA(steel, 0.85);
    ctx.lineWidth = Math.max(2, r * 0.26);
    ctx.lineCap = "round";
    for (const off of [0, Math.PI]) {
      const a = spin + off;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * ky);
      ctx.stroke();
    }
    ctx.restore();
  }
  sphere(ctx, x, y, Math.max(2.5, r * 0.16), steel);
}

function ghostRing(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ky: number, color: string,
) {
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.5);
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * ky, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

interface DronePlan {
  cx: number; cy: number; s: number; ky: number;
  props: { x: number; y: number; front: boolean }[];
  batteryY: number;
  bayY: number;
}

function dronePlan(cx: number, cy: number, s: number): DronePlan {
  const ky = 0.52;
  const angles = [225, 315, 135, 45].map((d) => (d * Math.PI) / 180);
  const props = angles.map((a) => ({
    x: cx + Math.cos(a) * s,
    y: cy + Math.sin(a) * s * ky,
    front: Math.sin(a) > 0,
  }));
  return { cx, cy, s, ky, props, batteryY: cy - s * 0.30, bayY: cy + s * 0.30 };
}

function drawDrone(
  ctx: CanvasRenderingContext2D, plan: DronePlan,
  state: DroneState, spec: DroneSpec, theme: ThemeLike,
) {
  const { cx, cy, s, ky, props } = plan;
  const shell = theme.sci["energy-total"];
  const steel = theme.sci["mass"];
  const hasFrame = (state.presence.frame ?? 0) > 0.05;
  const hasProp = (state.presence.propulsion ?? 0) > 0.05;
  const fast = spec.ready && state.energy > 0;
  const rotorR = s * 0.52;

  const drawArm = (p: { x: number; y: number }, grow: number) => {
    ctx.save();
    ctx.strokeStyle = hexA(shell, 0.95);
    ctx.lineWidth = s * 0.13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (p.x - cx) * grow, cy + (p.y - cy) * grow);
    ctx.stroke();
    ctx.strokeStyle = hexA("#ffffff", 0.22);
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.03);
    ctx.lineTo(cx + (p.x - cx) * grow, cy + (p.y - cy) * grow - s * 0.03);
    ctx.stroke();
    ctx.restore();
  };

  const framePresence = state.presence.frame ?? 0;
  const propPresence = state.presence.propulsion ?? 0;

  // Back arms, then the body, then front arms: cheap, convincing depth.
  for (const p of props) {
    if (p.front) continue;
    if (hasFrame) drawArm(p, easeInOut(framePresence));
    if (hasProp) {
      metal(ctx, p.x - s * 0.09, p.y - s * 0.08, s * 0.18, s * 0.16, steel, { radius: s * 0.05 });
      rotorDisc(ctx, p.x, p.y - s * 0.09, rotorR * easeInOut(propPresence), ky, state.spin, fast, theme);
    } else {
      ghostRing(ctx, p.x, p.y - s * 0.09, rotorR, ky, theme.sci["force"]);
    }
  }

  if (hasFrame) {
    const bw = s * 0.86, bh = s * 0.5;
    plastic(ctx, cx - bw / 2, cy - bh / 2, bw, bh, shell, { radius: s * 0.16 });
    glass(ctx, cx - bw * 0.28, cy - bh * 0.42, bw * 0.56, bh * 0.5, s * 0.1, theme, {
      tint: theme.sci["velocity"], alpha: 0.4,
    });
  } else {
    ghostRing(ctx, cx, cy, s * 0.42, 0.62, theme.sci["force"]);
  }

  // The battery is drawn on the spine, because its mass is the whole lesson.
  if ((state.presence.power ?? 0) > 0.05) {
    const g = easeInOut(state.presence.power);
    const bwid = s * 0.5 * g, bhei = s * 0.2 * g;
    plastic(ctx, cx - bwid / 2, plan.batteryY - bhei / 2, bwid, bhei, theme.sci["current"], {
      radius: s * 0.05,
    });
    dashFlow(ctx, [
      { x: cx - s * 0.2, y: plan.batteryY }, { x: cx, y: cy }, { x: props[0].x, y: props[0].y - s * 0.09 },
    ], theme.sci["current"], state.t * 40, { width: 1.6, dash: 4, gap: 5, alpha: 0.75 });
    dashFlow(ctx, [
      { x: cx + s * 0.2, y: plan.batteryY }, { x: cx, y: cy }, { x: props[1].x, y: props[1].y - s * 0.09 },
    ], theme.sci["current"], state.t * 40, { width: 1.6, dash: 4, gap: 5, alpha: 0.75 });
  }

  if ((state.presence.control ?? 0) > 0.05) {
    const g = easeInOut(state.presence.control);
    metal(ctx, cx - s * 0.13, cy - s * 0.07, s * 0.26 * g, s * 0.14 * g, steel, { radius: s * 0.03 });
    lamp(ctx, cx, cy, s * 0.045, theme.sci["energy-kinetic"], 0.4 + 0.6 * pulse(state.t, 1.4), theme);
  }

  if ((state.presence.comms ?? 0) > 0.05) {
    const g = easeInOut(state.presence.comms);
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["wave"], 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.3, cy - s * 0.05);
    ctx.lineTo(cx + s * 0.42, cy - s * 0.45 * g);
    ctx.stroke();
    ctx.restore();
    sphere(ctx, cx + s * 0.42, cy - s * 0.45 * g, s * 0.05, theme.sci["wave"]);
    for (let i = 0; i < 3; i++) {
      const rr = ((state.t * 0.8 + i / 3) % 1) * s * 0.55;
      ctx.save();
      ctx.globalAlpha = 0.35 * (1 - rr / (s * 0.55));
      ctx.strokeStyle = theme.sci["wave"];
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx + s * 0.42, cy - s * 0.45 * g, rr, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
      ctx.restore();
    }
  }

  if ((state.presence.payload ?? 0) > 0.05) {
    const g = easeInOut(state.presence.payload);
    const bw = s * 0.42 * g, bh = s * 0.3 * g;
    material(ctx, cx - bw / 2, plan.bayY, bw, bh, theme.sci["decomposer"], s * 0.04);
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, plan.bayY);
    ctx.lineTo(cx, plan.bayY + bh);
    ctx.stroke();
    ctx.restore();
  }

  for (const p of props) {
    if (!p.front) continue;
    if (hasFrame) drawArm(p, easeInOut(framePresence));
    if (hasProp) {
      metal(ctx, p.x - s * 0.09, p.y - s * 0.08, s * 0.18, s * 0.16, steel, { radius: s * 0.05 });
      rotorDisc(ctx, p.x, p.y - s * 0.09, rotorR * easeInOut(propPresence), ky, -state.spin, fast, theme);
    } else {
      ghostRing(ctx, p.x, p.y - s * 0.09, rotorR, ky, theme.sci["force"]);
    }
    lamp(ctx, p.x, p.y + s * 0.06, s * 0.035, theme.sci["energy-kinetic"], fast ? pulse(state.t, 2) : 0.1, theme);
  }
}

/** The containment map: system, subsystems, parts — three levels, one band. */
function nestingMap(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  state: DroneState, spec: DroneSpec, theme: ThemeLike, band: string,
) {
  const dark = isDarkTheme(theme);
  panel(ctx, x, y, w, h, theme, theme.accent);
  caption(ctx, x + 14, y + 18, "SYSTEM  ·  DELIVERY DRONE", theme, {
    size: 11.5, color: theme.accent, weight: 800,
  });
  caption(ctx, x + w - 14, y + 18, `${fmtInt(spec.subsystems)} subsystems  ·  ${fmtInt(spec.parts)} parts`, theme, {
    size: 11.5, color: theme.inkSoft, weight: 700, align: "right",
  });

  const chipTop = y + 28;
  const chipH = h - 40;
  const gap = 8;
  const chipW = (w - 28 - gap * (SUBSYSTEMS.length - 1)) / SUBSYSTEMS.length;
  SUBSYSTEMS.forEach((sub, i) => {
    const g = easeInOut(state.presence[sub.key] ?? 0);
    const cx0 = x + 14 + i * (chipW + gap);
    const inset = (1 - g) * chipH * 0.16;
    const cy0 = chipTop + inset;
    const ch = chipH - inset * 2;
    const col = sub.essential ? theme.accent : theme.sci["light"];
    if (g < 0.06) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      rrect(ctx, cx0, chipTop, chipW, chipH, 8);
      ctx.stroke();
      ctx.restore();
      caption(ctx, cx0 + chipW / 2, chipTop + chipH / 2 - 6, sub.short, theme, {
        align: "center", size: 10.5, color: theme.inkSoft, weight: 700,
      });
      caption(ctx, cx0 + chipW / 2, chipTop + chipH / 2 + 10, "on the floor", theme, {
        align: "center", size: 9.5, color: theme.inkSoft,
      });
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * g;
    bevelRect(ctx, cx0, cy0, chipW, ch, 8, dark ? theme.surface : theme.surface, { depth: 1 });
    ctx.strokeStyle = hexA(col, 0.55);
    ctx.lineWidth = 1.2;
    rrect(ctx, cx0 + 0.5, cy0 + 0.5, chipW - 1, ch - 1, 8);
    ctx.stroke();
    caption(ctx, cx0 + 8, cy0 + 14, sub.short, theme, { size: 10.5, color: col, weight: 800 });
    const total = sub.parts.reduce((n, p) => n + p.n, 0);
    caption(ctx, cx0 + chipW - 8, cy0 + 14, `${fmtInt(total)}`, theme, {
      size: 10.5, color: theme.inkSoft, weight: 700, align: "right",
    });
    // The third level: one dot per real part, so nesting is countable.
    let k = 0;
    const perRow = Math.max(4, Math.floor((chipW - 16) / 11));
    for (const p of sub.parts) {
      for (let n = 0; n < p.n; n++) {
        const dx = cx0 + 12 + (k % perRow) * 11;
        const dy = cy0 + 30 + Math.floor(k / perRow) * 11;
        if (dy < cy0 + ch - 14) sphere(ctx, dx, dy, 3.4, col, { rim: false });
        k++;
      }
    }
    if (band !== "3-5" && ch > 58) {
      caption(ctx, cx0 + 8, cy0 + ch - 9, sub.parts[0].name, theme, {
        size: 9.5, color: theme.inkSoft,
      });
    }
    ctx.restore();
  });
}

function renderBay(rc: RenderContext<DroneState>) {
  const { ctx, state, params, theme, width: w, height: h, band, overlays } = rc;
  const spec = droneSpec(params);
  const dark = isDarkTheme(theme);
  const floorY = h * 0.64;
  const mapH = Math.max(96, h * 0.26);
  const mapY = h - mapH - 10;
  const s = Math.max(38, Math.min(w * 0.15, (floorY - h * 0.16) * 0.52));
  const pxPerM = (floorY - h * 0.12) / 2.6;
  const droneCx = w * 0.46;
  const restY = floorY - h * 0.055 - s * 0.28;
  const droneCy = restY - state.alt * pxPerM;
  const flying = spec.ready && state.energy > 0;
  const chargeFrac = (params.battery as number) > 0 ? state.energy / (params.battery as number) : 0;

  /* ---- the bay ---- */
  sky(ctx, w, h, theme, "indoor", floorY);
  gridPaper(ctx, w, floorY, theme, { step: 30, major: 5, alpha: dark ? 0.35 : 0.5, fade: 0.6 });
  groundPlane(ctx, floorY, 0, w, mapY, theme, "lab");
  metal(ctx, 0, floorY - 4, w, 8, theme.sci["mass"], { radius: 2, polish: 0.6 });
  // A gantry rail overhead: the bay has a ceiling, so it has a size.
  metal(ctx, 0, h * 0.045, w, 12, theme.sci["mass"], { radius: 3, polish: 1 });
  for (const lx of [w * 0.24, w * 0.62]) {
    metal(ctx, lx - 22, h * 0.055, 44, 12, theme.sci["mass"], { radius: 4 });
    glow(ctx, lx, h * 0.075, s * 1.3, theme.sci["light"], 0.22);
  }
  noiseWash(ctx, 0, 0, w, floorY, { alpha: dark ? 0.05 : 0.035, seed: 19 });

  /* ---- crates: subsystems still on the floor, a heap of parts ---- */
  const waiting = SUBSYSTEMS.filter((sub) => (state.presence[sub.key] ?? 0) < 0.5);
  const cw = Math.min(58, w * 0.07);
  waiting.forEach((sub, i) => {
    const g = 1 - easeInOut(state.presence[sub.key] ?? 0);
    const cx0 = 18 + i * (cw + 9);
    const chh = cw * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * g;
    spriteShadowEllipse(ctx, cx0 + cw / 2, floorY, cw * 0.6, cw * 0.13, { alpha: 0.3 });
    material(ctx, cx0, floorY - chh, cw, chh, theme.sci["decomposer"], 3);
    caption(ctx, cx0 + cw / 2, floorY - chh / 2, sub.short, theme, {
      align: "center", size: 9.5, color: theme.ink, weight: 800,
    });
    ctx.restore();
  });
  if (waiting.length) {
    caption(ctx, 18, floorY + 18, "ON THE FLOOR  ·  NOT PART OF THE SYSTEM YET", theme, {
      size: 10, color: theme.inkSoft, weight: 700,
    });
  }

  /* ---- the stand ---- */
  const standTop = floorY - h * 0.055;
  metal(ctx, droneCx - s * 0.42, standTop, s * 0.84, 9, theme.sci["mass"], { radius: 3 });
  metal(ctx, droneCx - s * 0.09, standTop + 8, s * 0.18, floorY - standTop - 8, theme.sci["mass"], {
    radius: 2, polish: 0.5,
  });
  spriteShadowEllipse(ctx, droneCx, floorY, s * 0.5, s * 0.12, { alpha: 0.35 });

  /* ---- downwash and floor dust when it is actually flying ---- */
  if (flying && state.alt > 0.1) {
    for (const dir of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push({
          x: droneCx + dir * (s * 0.5 + u * s * 1.15),
          y: droneCy + s * 0.25 + u * u * (standTop - droneCy) * 0.9,
        });
      }
      dashFlow(ctx, pts, theme.sci["velocity"], state.t * 120, {
        width: 2, dash: 5, gap: 9, alpha: 0.4,
      });
    }
    const puffs = state.dust.map((d) => ({
      x: droneCx + (d.x - 0.5) * s * 3.4,
      y: standTop - d.y * s * 0.5,
      r: d.r * 1.3,
      a: 0.2 + 0.5 * d.y,
    }));
    particleField(ctx, puffs, theme.sci["mass"], { size: 1.5, alpha: 0.4, buckets: 3 });
  }

  contactShadow(ctx, droneCx, standTop + 4, s * 0.5, (standTop - droneCy) * 0.5);

  /* ---- the aircraft ---- */
  const bob = flying ? Math.sin(state.t * 2.1) * s * 0.03 : 0;
  const plan = dronePlan(droneCx, droneCy + bob, s);
  drawDrone(ctx, plan, state, spec, theme);

  /* ---- leaders, in the empty air above the crates ---- */
  if (overlays.labels !== false && band !== "3-5") {
    const leaders: { from: { x: number; y: number }; text: string; sub: string; on: boolean }[] = [
      {
        from: { x: plan.props[0].x, y: plan.props[0].y - s * 0.09 },
        text: "Propulsion", sub: "4 motors, 4 props", on: spec.installed.propulsion,
      },
      {
        from: { x: plan.cx, y: plan.batteryY },
        text: "Power", sub: "battery, board, loom", on: spec.installed.power,
      },
      {
        from: { x: plan.cx, y: plan.bayY + s * 0.14 },
        text: "Payload bay", sub: `${fmt(params.cargo as number, 2)} kg parcel`, on: spec.installed.payload,
      },
    ];
    let ly = h * 0.13;
    for (const L of leaders) {
      if (!L.on) continue;
      labelLeader(ctx, L.from.x, L.from.y, Math.min(148, w * 0.2), ly, L.text, theme, {
        color: theme.accent, sub: L.sub, size: 11.5, align: "left",
      });
      ly += 50;
    }
  }

  /* ---- live values, beside the thing they describe ---- */
  badge(ctx, droneCx + s * 1.35, droneCy - s * 0.4, `${fmt(spec.mass, 2)} kg`, theme, {
    align: "left", color: theme.sci["mass"], sub: "take-off mass",
  });
  if (spec.ready) {
    badge(ctx, droneCx + s * 1.35, droneCy + s * 0.25, `${fmtInt(spec.power)} W`, theme, {
      align: "left", color: theme.sci["energy-kinetic"], sub: "to hover",
    });
    badge(ctx, droneCx - s * 1.35, droneCy - s * 0.4, `${fmt(state.flightTime / 60, 1)} min`, theme, {
      align: "right", color: theme.sci["time"], sub: "in the air",
    });
  } else {
    badge(ctx, droneCx, droneCy - s * 1.05, `MISSING: ${spec.missing.join(", ")}`, theme, {
      align: "center", color: theme.sci["force"], sub: "it cannot fly",
    });
  }

  /* ---- flight computer panel ---- */
  const pw = Math.min(232, w * 0.26);
  const px = w - pw - 14;
  const py = h * 0.10;
  const ph = 128;
  panel(ctx, px, py, pw, ph, theme, theme.accent, "FLIGHT TEST");
  arcGauge(ctx, px + 46, py + 74, 34, chargeFrac, theme.sci["energy-potential"], theme,
    `${fmtInt(chargeFrac * 100)}%`, { sub: "charge", width: 8, ticks: 9 });
  const lines: [string, string][] = [
    ["Predicted", `${fmt(spec.endurance / 60, 1)} min`],
    ["Flown", `${fmt(state.flightTime / 60, 1)} min`],
    ["Parts", `${fmtInt(spec.parts)}`],
  ];
  lines.forEach(([k, v], i) => {
    caption(ctx, px + 92, py + 46 + i * 22, k, theme, { size: 11, color: theme.inkSoft });
    caption(ctx, px + pw - 14, py + 46 + i * 22, v, theme, {
      size: 12, color: theme.ink, weight: 700, align: "right",
    });
  });
  if (state.landed) {
    caption(ctx, px + pw / 2, py + ph + 14, `Battery flat after ${fmt(state.flightTime / 60, 1)} min`, theme, {
      align: "center", size: 12, color: theme.sci["acceleration"], weight: 700,
    });
  }

  /* ---- the containment map: the point of the whole sim ---- */
  if (overlays.map !== false) {
    nestingMap(ctx, 12, mapY, w - 24, mapH, state, spec, theme, band);
  }

  vignette(ctx, w, h, 0.16);
}

export const g6a1DroneAssembly: SimManifest<DroneState> = {
  id: "g6a1-drone-assembly",
  title: "Subsystem Assembly Bay",
  tagline: "Build a delivery drone subsystem by subsystem, then fly it until the battery is flat.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-2", "MS-ETS1-3", "MS-PS3-5"] },
  learningGoals: [
    "Describe a system as subsystems, and each subsystem as parts — three levels of nesting.",
    "Identify which subsystems a system needs to do its job, and which are optional.",
    "Predict how added mass changes the power needed to hover and the flight time.",
  ],
  misconceptions: [
    "Adding more parts always makes a system better",
    "A bigger battery always means a longer flight",
    "Every part of a system is equally necessary",
    "Subsystem and part mean the same thing",
  ],
  interactionHint: "Install subsystems, then click the bay to run a fresh endurance test.",
  params: {
    frame: { type: "boolean", label: "Airframe", default: true, help: "Arms, body shell and legs. Everything else bolts to it." },
    propulsion: { type: "boolean", label: "Propulsion", default: true, help: "Four motors, four propellers, four speed controllers." },
    power: { type: "boolean", label: "Power", default: true, help: "The battery pack and the wiring that shares it out." },
    control: { type: "boolean", label: "Flight control", default: true, help: "Computer, gyroscope, barometer, satellite receiver." },
    comms: { type: "boolean", label: "Radio link", default: false, help: "It can hover without this. It just cannot be told where to go." },
    payload: { type: "boolean", label: "Payload bay", default: false, help: "Without a bay the drone carries nothing at all." },
    battery: {
      type: "number", label: "Battery energy", kind: "energy", unit: "kJ",
      min: 72000, max: 540000, step: 3600, default: 266400,
      marks: [
        { value: 72000, label: "small" },
        { value: 266400, label: "5 Ah pack" },
        { value: 540000, label: "two packs" },
      ],
      help: "A lithium pack stores about 150 watt-hours per kilogram, so energy always arrives as mass.",
    },
    cargo: {
      type: "number", label: "Parcel mass", kind: "mass", unit: "kg",
      min: 0, max: 1.5, step: 0.05, default: 0.5,
      help: "Only carried when the payload bay is installed.",
    },
    props: {
      type: "option", label: "Propeller size",
      options: [
        { value: "0.203", label: "203 mm" },
        { value: "0.254", label: "254 mm" },
        { value: "0.305", label: "305 mm" },
      ],
      default: "0.254", bands: ["6-8", "9-12"],
      help: "Bigger propellers push more air more gently, so hovering costs less power.",
    },
  },
  overlays: [
    { key: "map", label: "Containment map", default: true },
    { key: "labels", label: "Subsystem labels", default: true, bands: ["6-8", "9-12"] },
  ],
  model: droneModel,
  render: renderBay,
  labs: [
    {
      id: "required-subsystems",
      title: "Which subsystems are required?",
      question: "Remove one subsystem at a time. Which removals stop the drone flying at all?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ETS1-2"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: false, battery: 266400, cargo: 0.5, props: "0.254",
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Two subsystems are about to come out: the radio link, then the flight control.",
          predict: {
            prompt: "Which removal stops the drone hovering?",
            options: ["The radio link", "The flight control", "Both of them", "Neither of them"],
            correct: 1,
            reveal:
              "Only flight control. Without a radio nobody can steer it, but the computer still holds it level and it hovers.",
          },
        },
        {
          id: "radio",
          phase: "measure",
          title: "Take out the radio link",
          instruction: "Switch the radio link off. Does the aircraft still hover?",
          check: {
            describe: "Radio link removed and the drone still flies",
            test: (v) => v.params.comms === false && v.facts.ready === true,
          },
          hints: ["Watch the flight test panel. A charge that falls means the motors are running."],
        },
        {
          id: "control",
          phase: "measure",
          title: "Now take out flight control",
          instruction: "Switch flight control off and watch what the bay reports.",
          check: {
            describe: "Flight control removed and the drone cannot fly",
            test: (v) => v.params.control === false && v.facts.ready === false,
          },
        },
        {
          id: "restore",
          phase: "analyze",
          title: "Put it back together",
          instruction: "Restore every required subsystem and get four of them installed.",
          check: {
            describe: "All required subsystems installed",
            test: (v) => v.facts.ready === true && (v.facts.subsystemCount as number) >= 4,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what required means",
          instruction: "The radio matters to the mission but not to hovering.",
          write: {
            prompt: "Which subsystems are required for the drone to fly, and which are required for its job?",
            placeholder: "To fly it needs ... but to deliver a parcel it also needs ...",
          },
        },
      ],
    },
    {
      id: "battery-mass",
      title: "Does a bigger battery fly longer?",
      question: "The battery stores the energy — but the battery is also mass the drone must lift.",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-5"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: false, payload: false, battery: 72000, cargo: 0.5, props: "0.254",
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You are about to double the battery energy, from one pack to two.",
          predict: {
            prompt: "Doubling the stored energy changes the flight time by roughly how much?",
            options: ["It doubles", "It rises by about a quarter", "It stays the same", "It falls"],
            correct: 1,
            reveal:
              "About a quarter longer: 27 minutes becomes 34. The second pack adds half a kilogram, and lifting it costs power all flight.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Test three battery sizes",
          instruction: "Record take-off mass, hover power and predicted time at three battery settings.",
          requireData: 3,
          hints: [
            "Change only the battery. Keep the propellers and the payload the same.",
            "Predicted flight time is on the flight test panel and in the readouts.",
          ],
        },
        {
          id: "big",
          phase: "measure",
          title: "Go to two packs",
          instruction: "Set the battery to its largest setting and record that row too.",
          check: {
            describe: "Battery at two packs",
            test: (v) => (v.params.battery as number) >= 500000,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the ratios",
          instruction: "Divide the biggest flight time by the smallest. Compare it to the energy ratio.",
          write: {
            prompt: "Energy went up by what factor? Flight time went up by what factor? Why are they different?",
            placeholder: "Energy went up ... times, but flight time only ... times, because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the design rule",
          instruction: "Explain the trade to somebody designing a delivery drone.",
          write: {
            prompt: "Why can a designer not just keep adding batteries?",
            placeholder: "Every extra pack ... so at some point ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "delivery-run",
      title: "Make the delivery",
      brief: "Carry a parcel of at least 0.5 kg with a predicted flight time over 12 minutes.",
      bands: ["6-8", "9-12"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: true, battery: 266400, cargo: 0.5, props: "0.254",
      },
      goal: {
        describe: "Payload of 0.5 kg or more, flight time over 12 minutes",
        test: (v) =>
          v.facts.ready === true && (v.facts.carrying as number) >= 0.5 &&
          (v.facts.enduranceMin as number) >= 12,
      },
      stars: {
        two: {
          describe: "Same parcel, over 18 minutes",
          test: (v) =>
            v.facts.ready === true && (v.facts.carrying as number) >= 0.5 &&
            (v.facts.enduranceMin as number) >= 18,
        },
        three: {
          describe: "Same parcel, over 24 minutes",
          test: (v) =>
            v.facts.ready === true && (v.facts.carrying as number) >= 0.5 &&
            (v.facts.enduranceMin as number) >= 24,
        },
      },
      hints: [
        "The payload bay must be installed before a parcel counts.",
        "Larger propellers hover on less power for the same mass.",
      ],
    },
    {
      id: "nothing-spare",
      title: "Nothing spare",
      brief: "Fly for over 10 minutes with the smallest number of parts that still works.",
      bands: ["6-8", "9-12"],
      setup: {
        frame: true, propulsion: true, power: true, control: true,
        comms: true, payload: true, battery: 266400, cargo: 0.5, props: "0.254",
      },
      goal: {
        describe: "Flies over 10 minutes with 26 parts or fewer",
        test: (v) =>
          v.facts.ready === true && (v.facts.partCount as number) <= 26 &&
          (v.facts.enduranceMin as number) >= 10,
      },
      stars: {
        two: {
          describe: "26 parts or fewer, over 25 minutes",
          test: (v) =>
            v.facts.ready === true && (v.facts.partCount as number) <= 26 &&
            (v.facts.enduranceMin as number) >= 25,
        },
        three: {
          describe: "26 parts or fewer, over 32 minutes",
          test: (v) =>
            v.facts.ready === true && (v.facts.partCount as number) <= 26 &&
            (v.facts.enduranceMin as number) >= 32,
        },
      },
      hints: [
        "Count the dots in the containment map. Which subsystem earns none of them?",
        "A subsystem the mission does not need is mass you are lifting for nothing.",
      ],
    },
  ],
};
