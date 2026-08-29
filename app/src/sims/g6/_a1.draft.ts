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
/* ================================================================== *
 * 1 — Systems Inspection Bench                                  A1.1
 *
 * A sorting challenge. Specimens ride a conveyor under an inspection
 * lamp. Three bench tests reveal evidence; the student calls each one
 * "system" or "just a collection" before it leaves the lit zone.
 * ================================================================== */

type SpecKind =
  | "bicycle" | "sandBucket" | "flashlight" | "buttonJar"
  | "heart" | "brickHeap" | "turbine" | "marbleBowl";

interface Specimen {
  kind: SpecKind;
  name: string;
  isSystem: boolean;
  /** Evidence surfaced by each of the three bench tests. */
  parts: string;
  links: string;
  job: string;
  partCount: number;
}

const SPECIMENS: Specimen[] = [
  {
    kind: "bicycle", name: "Bicycle", isSystem: true, partCount: 180,
    parts: "Different parts: frame, wheels, chain, brakes",
    links: "Pedals turn the chain, the chain turns the wheel",
    job: "The whole thing carries a rider; no single part can",
  },
  {
    kind: "sandBucket", name: "Bucket of sand", isSystem: false, partCount: 900000,
    parts: "Millions of grains, but all the same kind of part",
    links: "Grains only push on each other by touching",
    job: "No shared job; scoop half out and nothing stops working",
  },
  {
    kind: "flashlight", name: "Flashlight", isSystem: true, partCount: 6,
    parts: "Cell, switch, contacts, lamp, reflector, case",
    links: "The switch closes the circuit that lights the lamp",
    job: "Together they make a beam; alone, none of them can",
  },
  {
    kind: "buttonJar", name: "Jar of buttons", isSystem: false, partCount: 240,
    parts: "Many buttons, all doing the same nothing",
    links: "Remove any button and the rest are unchanged",
    job: "The jar stores them; the buttons do not work together",
  },
  {
    kind: "heart", name: "Human heart", isSystem: true, partCount: 4,
    parts: "Four chambers, four valves, muscle, pacemaker cells",
    links: "Pacemaker signals the muscle, valves steer the flow",
    job: "It pumps about 5 litres of blood every minute",
  },
  {
    kind: "brickHeap", name: "Heap of bricks", isSystem: false, partCount: 60,
    parts: "Identical bricks, stacked in no particular order",
    links: "Only weight resting on weight; no part depends on another",
    job: "A heap has no function; a built wall would",
  },
  {
    kind: "turbine", name: "Wind turbine", isSystem: true, partCount: 8000,
    parts: "Blades, hub, gearbox, generator, yaw motor, controller",
    links: "The controller turns the nacelle so blades face the wind",
    job: "It converts moving air into about 2 MW of electricity",
  },
  {
    kind: "marbleBowl", name: "Bowl of marbles", isSystem: false, partCount: 30,
    parts: "Marbles of different colours, otherwise identical",
    links: "They roll off each other and then stop",
    job: "Nothing is produced, controlled or carried",
  },
];

interface BenchState {
  t: number;
  /** Position in the shuffled visiting order. */
  seat: number;
  order: number[];
  /** 0 to 1 across the bench, 0.8 is where the call locks in. */
  phase: number;
  locked: boolean;
  judged: number;
  correct: number;
  skipped: number;
  streak: number;
  best: number;
  lastRight: boolean;
  lastCalled: string;
  stampAge: number;
}

const LOCK_AT = 0.8;

function shuffledOrder(ctx: SimContext): number[] {
  const order = SPECIMENS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = ctx.rng.int(0, i);
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

const benchModel: SimModel<BenchState> = {
  init(_params, ctx) {
    return {
      t: 0, seat: 0, order: shuffledOrder(ctx), phase: 0, locked: false,
      judged: 0, correct: 0, skipped: 0, streak: 0, best: 0,
      lastRight: false, lastCalled: "none", stampAge: 99,
    };
  },

  step(state, dt, params) {
    let s: BenchState = { ...state, t: state.t + dt, stampAge: state.stampAge + dt };
    if (!(params.running as boolean)) return s;

    const pace = Math.max(3, params.pace as number);
    const phase = s.phase + dt / pace;

    if (!s.locked && phase >= LOCK_AT) {
      const call = params.verdict as string;
      const spec = SPECIMENS[s.order[s.seat]];
      if (call === "undecided") {
        s = { ...s, skipped: s.skipped + 1, streak: 0, lastCalled: "none", lastRight: false };
      } else {
        const right = (call === "system") === spec.isSystem;
        const streak = right ? s.streak + 1 : 0;
        s = {
          ...s,
          judged: s.judged + 1,
          correct: s.correct + (right ? 1 : 0),
          streak,
          best: Math.max(s.best, streak),
          lastRight: right,
          lastCalled: call,
        };
      }
      s = { ...s, locked: true, stampAge: 0 };
    }

    if (phase >= 1) {
      return { ...s, phase: phase - 1, seat: (s.seat + 1) % s.order.length, locked: false };
    }
    return { ...s, phase };
  },

  readouts(state) {
    const acc = state.judged > 0 ? state.correct / state.judged : 0;
    return [
      { key: "judged", label: "Specimens called", quantity: q(state.judged, "count"), graphable: true },
      { key: "correct", label: "Correct calls", quantity: q(state.correct, "count"), graphable: true },
      { key: "accuracy", label: "Accuracy", quantity: q(acc, "percent"), unit: "%", graphable: true },
      { key: "streak", label: "Current streak", quantity: q(state.streak, "count") },
      { key: "best", label: "Best streak", quantity: q(state.best, "count") },
      { key: "skipped", label: "Missed calls", quantity: q(state.skipped, "count") },
      {
        key: "timeLeft", label: "Time to decide",
        quantity: q(Math.max(0, LOCK_AT - state.phase) * 10, "time"), unit: "s",
      },
    ];
  },

  facts(state) {
    const spec = SPECIMENS[state.order[state.seat]];
    return {
      judged: state.judged,
      correct: state.correct,
      accuracy: state.judged > 0 ? state.correct / state.judged : 0,
      streak: state.streak,
      best: state.best,
      skipped: state.skipped,
      currentName: spec.name,
      currentIsSystem: spec.isSystem,
      currentParts: spec.partCount,
      lastRight: state.lastRight,
    };
  },
};

/* ---- specimen artwork: lit parts, never flat tokens ---- */

function drawSpecimen(
  ctx: CanvasRenderingContext2D, spec: Specimen,
  cx: number, baseY: number, s: number, theme: RenderContext<BenchState>["theme"], t: number,
) {
  const steel = theme.sci["solid"];
  const brass = theme.sci["current"];
  switch (spec.kind) {
    case "bicycle": {
      const r = 26 * s;
      const cyw = baseY - r;
      for (const dx of [-30 * s, 30 * s]) {
        ctx.save();
        ctx.translate(cx + dx, cyw);
        ctx.strokeStyle = steel;
        ctx.lineWidth = 3.2 * s;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(-t * 2.2);
        ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
        ctx.lineWidth = 1.1 * s;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4.5 * s;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 30 * s, cyw);
      ctx.lineTo(cx - 4 * s, cyw - 26 * s);
      ctx.lineTo(cx + 18 * s, cyw - 26 * s);
      ctx.lineTo(cx + 30 * s, cyw);
      ctx.lineTo(cx, cyw);
      ctx.lineTo(cx - 4 * s, cyw - 26 * s);
      ctx.stroke();
      ctx.restore();
      // chain loop: the interaction that makes it a system
      ctx.save();
      ctx.strokeStyle = brass;
      ctx.lineWidth = 2 * s;
      ctx.setLineDash([4 * s, 3 * s]);
      ctx.lineDashOffset = -t * 26 * s;
      ctx.beginPath();
      ctx.moveTo(cx, cyw - 2 * s);
      ctx.lineTo(cx + 30 * s, cyw - 2 * s);
      ctx.moveTo(cx + 30 * s, cyw + 2 * s);
      ctx.lineTo(cx, cyw + 2 * s);
      ctx.stroke();
      ctx.restore();
      sphere(ctx, cx, cyw, 5 * s, brass);
      material(ctx, cx + 12 * s, cyw - 32 * s, 16 * s, 5 * s, theme.inkSoft, 2);
      break;
    }
    case "sandBucket": {
      const w = 46 * s, h = 40 * s;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, baseY - h);
      ctx.lineTo(cx + w / 2, baseY - h);
      ctx.lineTo(cx + w * 0.38, baseY);
      ctx.lineTo(cx - w * 0.38, baseY);
      ctx.closePath();
      ctx.clip();
      metal(ctx, cx - w / 2, baseY - h, w, h, steel, { angle: 0, polish: 0.8 });
      ctx.restore();
      ctx.save();
      ctx.fillStyle = theme.sci["decomposer"];
      ctx.beginPath();
      ctx.ellipse(cx, baseY - h, w * 0.5, 7 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.restore();
      const grains: Particle[] = [];
      for (let i = 0; i < 24; i++) {
        const ph = ((t * 0.6 + i * 0.137) % 1);
        grains.push({
          x: cx + (i % 7 - 3) * 5 * s,
          y: baseY - h - 34 * s + ph * 30 * s,
          r: 1.1 * s, a: 0.35 + 0.5 * (1 - ph),
        });
      }
      particleField(ctx, grains, theme.sci["decomposer"], { size: 1.2 * s });
      break;
    }
    case "flashlight": {
      const bw = 62 * s, bh = 20 * s;
      const y = baseY - bh - 4 * s;
      metal(ctx, cx - bw / 2, y, bw, bh, steel, { radius: 5 * s, polish: 1 });
      metal(ctx, cx + bw / 2 - 2 * s, y - 5 * s, 16 * s, bh + 10 * s, theme.inkSoft, { radius: 4 * s });
      const bulbX = cx + bw / 2 + 12 * s;
      const p = 0.65 + 0.35 * pulse(t, 0.7);
      glow(ctx, bulbX, y + bh / 2, 26 * s * p, theme.sci["light"], 0.55);
      ctx.save();
      ctx.globalAlpha = 0.4 * p;
      ctx.fillStyle = theme.sci["light"];
      ctx.beginPath();
      ctx.moveTo(bulbX, y + bh / 2 - 7 * s);
      ctx.lineTo(bulbX + 52 * s, y + bh / 2 - 22 * s);
      ctx.lineTo(bulbX + 52 * s, y + bh / 2 + 22 * s);
      ctx.lineTo(bulbX, y + bh / 2 + 7 * s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      sphere(ctx, bulbX - 2 * s, y + bh / 2, 5 * s, theme.sci["light"], { glow: 0.8 });
      material(ctx, cx - 10 * s, y - 4 * s, 14 * s, 6 * s, theme.accent, 2);
      break;
    }
    case "buttonJar": {
      const w = 44 * s, h = 52 * s;
      const cols = ["velocity", "acid", "producer", "light", "field", "gas"];
      for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4), col = i % 4;
        const bx = cx - w * 0.32 + col * (w * 0.21) + ((row % 2) * w * 0.1);
        const by = baseY - 8 * s - row * (h * 0.16);
        sphere(ctx, bx, by, 5.2 * s, theme.sci[cols[(i * 3) % cols.length]]);
      }
      glass(ctx, cx - w / 2, baseY - h, w, h, 6 * s, theme, { sheen: true });
      material(ctx, cx - w / 2 - 2 * s, baseY - h - 7 * s, w + 4 * s, 8 * s, theme.inkSoft, 3);
      break;
    }
    case "heart": {
      const beat = 1 + 0.09 * Math.pow(pulse(t, 1.2), 3);
      ctx.save();
      ctx.translate(cx, baseY - 34 * s);
      ctx.scale(beat, beat);
      const r = 20 * s;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.15);
      ctx.bezierCurveTo(-r * 1.5, r * 0.1, -r * 0.85, -r * 1.05, 0, -r * 0.4);
      ctx.bezierCurveTo(r * 0.85, -r * 1.05, r * 1.5, r * 0.1, 0, r * 1.15);
      ctx.closePath();
      const g = ctx.createRadialGradient(-r * 0.4, -r * 0.5, r * 0.15, 0, 0, r * 1.6);
      g.addColorStop(0, mixHex(theme.sci["force"], "#ffffff", 0.45));
      g.addColorStop(1, mixHex(theme.sci["force"], "#000000", 0.28));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      for (const dx of [-13 * s, 13 * s]) {
        ctx.save();
        ctx.strokeStyle = dx < 0 ? theme.sci["velocity"] : theme.sci["force"];
        ctx.lineWidth = 6 * s;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx + dx, baseY - 52 * s);
        ctx.lineTo(cx + dx * 1.7, baseY - 70 * s);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "brickHeap": {
      const lay = [
        [-26, 0, -0.05], [4, 0, 0.06], [28, 0, -0.1],
        [-14, -11, 0.14], [16, -11, -0.09],
        [0, -22, 0.05], [-24, -22, -0.2],
      ];
      for (const [bx, by, rot] of lay) {
        ctx.save();
        ctx.translate(cx + bx * s, baseY + by * s - 5 * s);
        ctx.rotate(rot);
        material(ctx, -14 * s, -5 * s, 28 * s, 10 * s, theme.sci["decomposer"], 1.5);
        ctx.restore();
      }
      break;
    }
    case "turbine": {
      const topY = baseY - 78 * s;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 7 * s, baseY);
      ctx.lineTo(cx - 3 * s, topY);
      ctx.lineTo(cx + 3 * s, topY);
      ctx.lineTo(cx + 7 * s, baseY);
      ctx.closePath();
      ctx.fillStyle = mixHex(theme.surfaceAlt, theme.ink, 0.18);
      ctx.fill();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      metal(ctx, cx - 5 * s, topY - 7 * s, 20 * s, 11 * s, steel, { radius: 4 * s });
      const hx = cx + 16 * s, hy = topY - 1.5 * s;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(t * 1.6);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i / 3) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, -2.5 * s);
        ctx.quadraticCurveTo(22 * s, -5 * s, 40 * s, -1 * s);
        ctx.quadraticCurveTo(22 * s, 2.5 * s, 0, 2.5 * s);
        ctx.closePath();
        ctx.fillStyle = mixHex(theme.surface, theme.ink, 0.12);
        ctx.fill();
        ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      sphere(ctx, hx, hy, 4.5 * s, brass);
      break;
    }
    case "marbleBowl": {
      const w = 56 * s;
      const cols = ["velocity", "acid", "producer", "field", "gas", "liquid"];
      for (let i = 0; i < 9; i++) {
        const col = i % 5, row = Math.floor(i / 5);
        sphere(
          ctx,
          cx - w * 0.32 + col * (w * 0.16) + row * (w * 0.08),
          baseY - 9 * s - row * 9 * s,
          6 * s, theme.sci[cols[(i * 2) % cols.length]],
        );
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, baseY - 22 * s);
      ctx.quadraticCurveTo(cx, baseY + 12 * s, cx + w / 2, baseY - 22 * s);
      ctx.lineWidth = 4 * s;
      ctx.strokeStyle = mixHex(theme.sci["liquid"], "#000000", 0.15);
      ctx.stroke();
      ctx.restore();
      break;
    }
  }
}

function benchRender(rc: RenderContext<BenchState>) {
  const { ctx, state, params, theme, width, height, band } = rc;
  const dark = isDarkTheme(theme);
  const benchY = Math.round(height * 0.72);
  const lampX = width * 0.5;

  /* ---- the shop ---- */
  sky(ctx, width, height, theme, "indoor", benchY);
  gradientFill(ctx, 0, 0, width, benchY, [
    hexA(theme.ink, dark ? 0.34 : 0.1),
    hexA(theme.ink, 0.0),
  ], 90);
  gridPaper(ctx, width, benchY, theme, { step: 46, major: 3, alpha: dark ? 0.3 : 0.4, fade: 0.55 });
  noiseWash(ctx, 0, 0, width, height, { alpha: 0.035, seed: 41 });

  // tool rail: silhouettes give the wall depth without stealing attention
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.06, height * 0.1);
  ctx.lineTo(width * 0.32, height * 0.1);
  ctx.moveTo(width * 0.68, height * 0.1);
  ctx.lineTo(width * 0.94, height * 0.1);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const x = i < 4 ? width * (0.09 + i * 0.07) : width * (0.71 + (i - 4) * 0.07);
    const len = 22 + ((i * 7) % 4) * 9;
    ctx.save();
    ctx.globalAlpha = 0.4;
    material(ctx, x, height * 0.1, 6, len, theme.inkSoft, 2);
    ctx.restore();
  }

  /* ---- the lamp and its cone of light ---- */
  const litSpan = width * 0.34;
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lampX, 0);
  ctx.lineTo(lampX, height * 0.16);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.moveTo(lampX - 20, height * 0.2);
  ctx.lineTo(lampX + 20, height * 0.2);
  ctx.lineTo(lampX + litSpan / 2, benchY + 6);
  ctx.lineTo(lampX - litSpan / 2, benchY + 6);
  ctx.closePath();
  const cone = ctx.createLinearGradient(0, height * 0.2, 0, benchY);
  cone.addColorStop(0, hexA(theme.sci["light"], dark ? 0.3 : 0.22));
  cone.addColorStop(1, hexA(theme.sci["light"], 0.02));
  ctx.fillStyle = cone;
  ctx.fill();
  ctx.restore();
  metal(ctx, lampX - 30, height * 0.13, 60, 16, theme.inkSoft, { radius: 8 });
  glow(ctx, lampX, height * 0.2, 40, theme.sci["light"], 0.5);
  sphere(ctx, lampX, height * 0.195, 7, theme.sci["light"], { glow: 1.1 });

  /* ---- bench and conveyor ---- */
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");
  const beltTop = benchY - 16;
  material(ctx, 0, beltTop, width, 18, mixHex(theme.surfaceAlt, theme.ink, 0.35), 0);
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.5 : 0.28);
  ctx.lineWidth = 2;
  const scroll = (state.t * 26) % 24;
  ctx.beginPath();
  for (let x = -24 + scroll; x < width + 24; x += 24) {
    ctx.moveTo(x, beltTop + 2);
    ctx.lineTo(x - 7, beltTop + 16);
  }
  ctx.stroke();
  ctx.restore();
  for (const rx of [10, width - 10]) {
    metal(ctx, rx - 9, beltTop - 2, 18, 22, theme.inkSoft, { radius: 9 });
  }

  /* ---- specimens on the belt ---- */
  const span = width * 1.3;
  const specScale = Math.min(1.5, Math.max(0.85, height / 430));
  const plates: LabelPlate[] = [];
  for (const k of [1, 0, -1]) {
    const idx = state.order[(state.seat + (k === 1 ? 1 : k === -1 ? state.order.length - 1 : 0)) % state.order.length];
    const spec = SPECIMENS[idx];
    const x = width * 1.15 - (state.phase - k) * span;
    if (x < -width * 0.3 || x > width * 1.35) continue;
    const dist = Math.abs(x - lampX) / (litSpan * 0.7);
    const lit = clamp01(1 - dist);

    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * clamp01(1 - dist * 0.5);
    contactShadow(ctx, x, beltTop + 2, 26 * specScale, 0);
    drawSpecimen(ctx, spec, x, beltTop, specScale, theme, state.t);
    ctx.restore();

    if (lit > 0.18) {
      caption(ctx, x, benchY + 26, spec.name, theme, {
        align: "center", size: 15, weight: 700, color: theme.ink,
      });
      if (band !== "K-2") {
        badge(ctx, x, benchY + 48, `${n0(spec.partCount)} parts`, theme, {
          align: "center", color: theme.sci["mass"],
        });
      }
    }

    /* ---- bench-test evidence, on leaders so nothing overlaps ---- */
    if (k === 0 && lit > 0.15) {
      const tests: { on: boolean; title: string; text: string; colour: string; fromY: number }[] = [
        {
          on: params.testParts as boolean, title: "Test 1 · Different parts?",
          text: spec.parts, colour: theme.sci["mass"], fromY: beltTop - 62 * specScale,
        },
        {
          on: params.testLinks as boolean, title: "Test 2 · Do parts affect each other?",
          text: spec.links, colour: theme.sci["current"], fromY: beltTop - 34 * specScale,
        },
        {
          on: params.testJob as boolean, title: "Test 3 · One job for the whole?",
          text: spec.job, colour: theme.accent, fromY: beltTop - 10 * specScale,
        },
      ];
      let slot = 0;
      for (const test of tests) {
        if (!test.on) continue;
        const side = slot % 2 === 0 ? -1 : 1;
        const toX = side < 0 ? width * 0.26 : width * 0.74;
        const toY = height * 0.16 + slot * height * 0.155;
        plates.push(labelLeader(
          ctx, x + side * 26 * specScale, test.fromY, toX, toY,
          test.title, theme,
          {
            color: test.colour, size: 12, sub: test.text,
            align: side < 0 ? "left" : "right", alpha: 0.35 + 0.65 * lit,
          },
        ));
        slot++;
      }
    }

    /* ---- the stamp that lands when the call locks ---- */
    if (k === 0 && state.locked) {
      const sc = 0.6 + 0.4 * spring(state.stampAge / 0.45);
      const good = state.lastRight;
      const col = state.lastCalled === "none"
        ? theme.inkSoft : good ? theme.sci["energy-kinetic"] : theme.sci["force"];
      const text = state.lastCalled === "none"
        ? "NO CALL" : state.lastCalled === "system" ? "SYSTEM" : "COLLECTION";
      ctx.save();
      ctx.translate(x, beltTop - 78 * specScale);
      ctx.rotate(-0.12);
      ctx.scale(sc, sc);
      ctx.globalAlpha = clamp01(1.6 - state.stampAge * 0.5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = col;
      ctx.font = '800 17px "Bricolage Grotesque", system-ui, sans-serif';
      const tw = ctx.measureText(text).width;
      roundRect(ctx, -tw / 2 - 12, -17, tw + 24, 34, 6);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 1);
      ctx.restore();
    }
  }

  /* ---- scoreboard, out of the traffic lane ---- */
  const acc = state.judged > 0 ? state.correct / state.judged : 0;
  const panelW = 168, panelH = 92;
  softShadow(ctx, () => {
    bevelRect(ctx, 14, 14, panelW, panelH, 10, mixHex(theme.surfaceAlt, theme.ink, dark ? 0.1 : 0.04), { depth: 1 });
  }, { blur: 14, dy: 5, alpha: 0.3 });
  arcGauge(ctx, 14 + 44, 14 + panelH / 2, 32, acc, theme.sci["energy-kinetic"], theme,
    pct(acc), { sub: "accuracy", ticks: 5 });
  caption(ctx, 14 + 92, 40, `${n0(state.correct)} / ${n0(state.judged)} right`, theme, { size: 12 });
  caption(ctx, 14 + 92, 60, `streak ${n0(state.streak)}`, theme, { size: 12, color: theme.sci["current"] });
  caption(ctx, 14 + 92, 80, `best ${n0(state.best)}`, theme, { size: 12, color: theme.inkSoft });

  /* ---- the call you have set, and the time left to change it ---- */
  const call = params.verdict as string;
  const cw = 210, cx0 = width - cw - 14, cy0 = height - 62;
  softShadow(ctx, () => {
    bevelRect(ctx, cx0, cy0, cw, 48, 10, mixHex(theme.surfaceAlt, theme.ink, dark ? 0.1 : 0.04), { depth: 1 });
  }, { blur: 12, dy: 4, alpha: 0.28 });
  const opts: { v: string; label: string; col: string }[] = [
    { v: "collection", label: "collection", col: theme.sci["mass"] },
    { v: "undecided", label: "--", col: theme.inkSoft },
    { v: "system", label: "system", col: theme.accent },
  ];
  opts.forEach((o, i) => {
    const bx = cx0 + 8 + i * ((cw - 16) / 3);
    const bw = (cw - 16) / 3 - 4;
    const on = o.v === call;
    plastic(ctx, bx, cy0 + 8, bw, 32, on ? o.col : mixHex(theme.surfaceAlt, theme.ink, 0.12), {
      radius: 7, gloss: on ? 0.7 : 0.2,
    });
    caption(ctx, bx + bw / 2, cy0 + 24, o.label, theme, {
      align: "center", size: 11, weight: 700,
      color: on ? (dark ? theme.ink : theme.surface) : theme.inkSoft,
    });
  });
  const left = Math.max(0, LOCK_AT - state.phase) * (params.pace as number);
  const urgent = left < 2.5 && !state.locked;
  arcGauge(
    ctx, cx0 - 40, cy0 + 24, 28,
    state.locked ? 0 : clamp01((LOCK_AT - state.phase) / LOCK_AT),
    urgent ? theme.sci["force"] : theme.sci["time"], theme,
    state.locked ? "--" : `${n1(left)}s`, { sub: "to call", width: 6 },
  );
  if (urgent) {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.35 * pulse(state.t, 2);
    glow(ctx, cx0 - 40, cy0 + 24, 44, theme.sci["force"], 0.6);
    ctx.restore();
  }

  void plates;
  vignette(ctx, width, height, 0.2);
}

export const g6a1SystemBench: SimManifest<BenchState> = {
  id: "g6a1-system-bench",
  title: "Systems Inspection Bench",
  tagline: "Specimens ride under the lamp; run three bench tests and call each one a system or just a collection.",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [4, 5, 6, 7, 8],
  standards: { ngss: ["MS-ETS1-1", "MS-LS1-3", "MS-PS3-3"] },
  learningGoals: [
    "State the three things every system has: distinct parts, interactions between them, and a job the whole does.",
    "Apply the three tests to an unfamiliar object and defend the verdict with evidence.",
    "Explain why a large pile of identical things is not a system, however many pieces it contains.",
  ],
  misconceptions: [
    "Anything with lots of pieces is a system",
    "A system has to be a machine built by people",
    "If you can name the parts, it must be a system",
  ],
  interactionHint: "Switch on the bench tests, then set Your call before the specimen leaves the light.",
  tickRate: 60,
  params: {
    verdict: {
      type: "option", label: "Your call",
      options: [
        { value: "undecided", label: "Still deciding" },
        { value: "system", label: "It is a system" },
        { value: "collection", label: "Just a collection" },
      ],
      default: "undecided",
      help: "Whatever this says when the specimen leaves the light is the answer you gave.",
    },
    testParts: {
      type: "boolean", label: "Test 1: different parts", default: true,
      help: "Are the pieces genuinely different from one another, with different roles?",
    },
    testLinks: {
      type: "boolean", label: "Test 2: parts interact", default: false,
      help: "Does what one part does change what another part does?",
    },
    testJob: {
      type: "boolean", label: "Test 3: one job", default: false,
      help: "Does the whole thing do something no single part can do alone?",
    },
    pace: {
      type: "number", label: "Belt time per specimen", kind: "time", unit: "s",
      min: 4, max: 24, step: 1, default: 12,
    },
    running: { type: "boolean", label: "Belt running", default: true },
  },
  model: benchModel,
  render: benchRender,
  labs: [
    {
      id: "three-tests",
      title: "What makes a system a system?",
      question: "Which test separates a real system from a heap of parts?",
      bands: ["3-5", "6-8"],
      minutes: 20,
      standards: ["MS-ETS1-1"],
      setup: { verdict: "undecided", testParts: true, testLinks: false, testJob: false, pace: 16, running: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit before you look",
          instruction: "Only Test 1 is switched on. Decide what it can and cannot tell you.",
          predict: {
            prompt: "A bucket of sand has millions of pieces. Is counting parts enough to prove something is a system?",
            options: [
              "Yes, more parts means more system",
              "No, the parts also have to affect each other and share a job",
              "Only if the parts are made of different materials",
            ],
            correct: 1,
            reveal: "Part count proves nothing. A bucket of sand beats a flashlight on parts and loses on everything else.",
          },
        },
        {
          id: "one-test",
          phase: "measure",
          title: "Judge with one test only",
          instruction: "Call six specimens using Test 1 alone. Record your accuracy as you go.",
          requireData: 3,
          check: {
            describe: "At least 6 specimens called",
            test: (v) => (v.facts.judged as number) >= 6,
          },
          hints: [
            "Set Your call before the time-to-call ring runs out.",
            "Leaving the switch on 'Still deciding' counts as a missed call, not a wrong one.",
          ],
        },
        {
          id: "all-three",
          phase: "measure",
          title: "Now switch on all three tests",
          instruction: "Turn on Test 2 and Test 3, then judge six more specimens and record again.",
          requireData: 6,
          check: {
            describe: "All three bench tests switched on",
            test: (v) => v.params.testParts === true && v.params.testLinks === true && v.params.testJob === true,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the two runs",
          instruction: "Look at your recorded accuracy before and after switching the other tests on.",
          write: {
            prompt: "Which test changed your answers the most, and for which specimen?",
            placeholder: "Test ... changed my mind about the ... because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Write a definition of 'system' a classmate could use on a brand new object.",
          write: {
            prompt: "Finish this: an object is a system when ...",
            placeholder: "An object is a system when its parts ...",
          },
        },
      ],
    },
    {
      id: "heap-vs-system",
      title: "The heap of bricks problem",
      question: "A heap of bricks is not a system, but a brick wall is. What changed?",
      bands: ["6-8"],
      minutes: 15,
      setup: { verdict: "undecided", testParts: true, testLinks: true, testJob: true, pace: 18, running: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Nothing is added to a heap of bricks when it becomes a wall except arrangement.",
          predict: {
            prompt: "Turning a heap of bricks into a wall adds no new bricks. What does it add?",
            options: [
              "More material",
              "Arrangement, so the bricks now hold each other up and do a job",
              "Nothing, a wall is still just bricks",
            ],
            correct: 1,
            reveal: "Organisation is the ingredient. The same parts arranged so they interact become a system with a function.",
          },
        },
        {
          id: "watch-heap",
          phase: "measure",
          title: "Catch the heap and the marbles",
          instruction: "Call the heap of bricks and the bowl of marbles correctly. Both are collections.",
          check: {
            describe: "Streak of at least 2 correct calls",
            test: (v) => (v.facts.streak as number) >= 2,
          },
          hints: ["Read the Test 2 evidence carefully: 'weight resting on weight' is not an interaction that does a job."],
        },
        {
          id: "watch-system",
          phase: "measure",
          title: "Now catch the built things",
          instruction: "Call the bicycle, the flashlight, the heart and the turbine. Reach 80% accuracy over at least 8 calls.",
          check: {
            describe: "8 or more calls at 80% accuracy or better",
            test: (v) => (v.facts.judged as number) >= 8 && (v.facts.accuracy as number) >= 0.8,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "Use one collection and one system from the belt in your answer.",
          write: {
            prompt: "Why is a heap of bricks not a system when a bicycle with fewer parts is?",
            placeholder: "The bricks ... but the bicycle's parts ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "clean-eight",
      title: "Eight in a row",
      brief: "Call eight specimens correctly without a single miss.",
      bands: ["3-5", "6-8"],
      setup: { verdict: "undecided", testParts: true, testLinks: true, testJob: true, pace: 12, running: true },
      goal: {
        describe: "Streak of 4 correct calls",
        test: (v) => (v.facts.streak as number) >= 4,
      },
      stars: {
        two: { describe: "Streak of 6", test: (v) => (v.facts.streak as number) >= 6 },
        three: { describe: "Streak of 8", test: (v) => (v.facts.streak as number) >= 8 },
      },
      hints: [
        "Turn every test on while you build the streak; speed comes later.",
        "The collections all fail Test 3: nothing is produced, controlled or carried.",
      ],
    },
    {
      id: "fast-bench",
      title: "Fast bench, one test",
      brief: "Set the belt to 6 seconds and reach 80% accuracy over 10 calls using only Test 3.",
      bands: ["6-8"],
      setup: { verdict: "undecided", testParts: false, testLinks: false, testJob: true, pace: 6, running: true },
      goal: {
        describe: "10 calls at 80% accuracy with only Test 3 on",
        test: (v) =>
          (v.facts.judged as number) >= 10 &&
          (v.facts.accuracy as number) >= 0.8 &&
          v.params.testJob === true &&
          v.params.testParts === false &&
          v.params.testLinks === false,
      },
      hints: [
        "Test 3 asks whether the whole thing has a job. That single question does most of the work.",
        "Say the job out loud before you move the switch: 'it pumps blood', 'it makes a beam'.",
      ],
    },
  ],
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
