import type { RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, contactShadow, dashFlow, easeInOut,
  glass, glow, gradient, gradientFill, hexA, innerGlow, isDarkTheme, labelLeader, lerp, material,
  metal, noiseWash, particleField, plastic, pulse, rimLight, ribbon, sky, softShadow,
  sphere, spriteShadowEllipse, spring, vignette,
  type Particle,
} from "@ui/scene";

/**
 * Grade 6 · Unit A · Topic A1 — Systems and subsystems.
 *
 * Five dedicated simulations, one file:
 *
 *   1. g6a1-system-or-heap    A1.1  what makes a system a system
 *   2. g6a1-nested-machine    A1.2  subsystems nested inside systems
 *   3. g6a1-interaction-web   A1.3  interactions among a system's parts
 *   4. g6a1-murmuration       A1.4  emergent properties
 *   5. g6a1-scale-ladder      A1.5  systems across scales, cell to planet
 *
 * Every scene is a place — a workshop bench, a repair stand, an aquarium
 * cabinet, a dusk sky, a scale ladder — never a labelled diagram.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

/** Fixed-decimal text for the stage. A raw float never reaches the canvas. */
function num(n: number, dp = 1): string {
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(dp);
}

/** A whole-number percentage from a 0-1 fraction. */
function pctText(fraction: number): string {
  return `${Math.round(clamp01(fraction) * 100)}%`;
}

/** The frosted instrument card every console in this topic is built on. */
function panelCard(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  theme: ThemeColors, title?: string, accent?: string,
) {
  const c = accent ?? theme.accent;
  const body = mixHex(theme.surfaceAlt, theme.ink, isDarkTheme(theme) ? 0.04 : 0.03);
  softShadow(ctx, () => {
    bevelRect(ctx, x, y, w, h, 10, body, { depth: 1 });
  }, { blur: 16, dy: 5, alpha: 0.24 });
  rimLight(ctx, (c2) => roundRect(c2, x + 0.5, y + 0.5, w - 1, h - 1, 10), c, {
    width: 1.2, alpha: 0.55, bounds: { x, y, w, h },
  });
  if (title) {
    caption(ctx, x + 12, y + 15, title, theme, { size: 10.5, color: theme.inkSoft, weight: 700 });
  }
}

/** A small indicator lamp: lit, failed, or waiting. */
function lamp(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  color: string, on: boolean, t: number,
) {
  if (on) glow(ctx, x, y, r * 3.4, color, 0.4 + 0.2 * pulse(t, 0.6));
  sphere(ctx, x, y, r, on ? color : mixHex(color, "#000000", 0.55), { glow: on ? 0.6 : 0 });
}

/** A named point on a specimen, used for leaders and interaction arrows. */
interface PartAnchor { x: number; y: number; label: string }

/* ================================================================== *
 * A1.1 — System or Heap?
 *
 * A workshop inspection line. Specimens ride in under the lamp, the
 * student inspects them three ways, then presses a verdict stamp.
 * The crate of bicycle parts holds exactly the parts of the bicycle
 * beside it, which is the whole argument in one pair of objects.
 * ================================================================== */

type Verdict = "system" | "collection";
type InspectMode = "look" | "shake" | "open";

interface Specimen {
  id: string;
  name: string;
  shape: "bicycle" | "crate" | "torch" | "watch" | "bricks" | "basket" | "sapling" | "hive";
  isSystem: boolean;
  /** How many parts the thing really has, which is not the label count. */
  partCount: number;
  /** Anchors are local-space points on the artwork, origin at bottom centre. */
  anchors: PartAnchor[];
  /** Index pairs: which parts act on which. Empty means a heap. */
  links: [number, number][];
  /** The job the whole does. Empty string when the whole does no job. */
  job: string;
  reveal: string;
}

const SPECIMENS: Specimen[] = [
  {
    id: "bicycle", name: "Bicycle", shape: "bicycle", isSystem: true, partCount: 6,
    anchors: [
      { x: -4, y: -52, label: "frame" },
      { x: 34, y: -24, label: "rear wheel" },
      { x: 17, y: -32, label: "chain" },
      { x: 0, y: -24, label: "cranks" },
      { x: 27, y: -62, label: "handlebars" },
    ],
    links: [[3, 2], [2, 1], [0, 1], [4, 0], [0, 3]],
    job: "carries a rider further than walking",
    reveal:
      "Push the cranks and the chain turns the rear wheel. Every part pushes or pulls on another, "
      + "and the whole machine does a job no part does alone.",
  },
  {
    id: "bikeparts", name: "Crate of bicycle parts", shape: "crate", isSystem: false, partCount: 6,
    anchors: [
      { x: -30, y: -30, label: "wheel" },
      { x: 2, y: -22, label: "chain" },
      { x: 30, y: -34, label: "saddle" },
      { x: -6, y: -44, label: "frame" },
    ],
    links: [],
    job: "",
    reveal:
      "Exactly the same parts as the bicycle standing beside it. Nothing is joined, so nothing acts "
      + "on anything else and the crate carries nobody. A set of parts is not yet a system.",
  },
  {
    id: "torch", name: "Flashlight", shape: "torch", isSystem: true, partCount: 5,
    anchors: [
      { x: -30, y: -30, label: "two 1.5 V cells" },
      { x: 2, y: -44, label: "switch" },
      { x: 26, y: -30, label: "lamp" },
      { x: 42, y: -30, label: "reflector" },
      { x: -48, y: -18, label: "case" },
    ],
    links: [[0, 1], [1, 2], [2, 3], [4, 0], [4, 2]],
    job: "throws a beam of light where you point it",
    reveal:
      "Close the switch and charge flows from the cells through the lamp: two 1.5 V cells in series "
      + "give 3 V. The reflector aims the light forward. Break one link and the beam dies.",
  },
  {
    id: "watch", name: "Wind-up watch", shape: "watch", isSystem: true, partCount: 5,
    anchors: [
      { x: -18, y: -46, label: "mainspring" },
      { x: 6, y: -52, label: "gear train" },
      { x: 24, y: -38, label: "escapement" },
      { x: 0, y: -30, label: "hands" },
      { x: -34, y: -30, label: "case" },
    ],
    links: [[0, 1], [1, 2], [2, 1], [1, 3], [4, 0]],
    job: "counts out equal seconds and shows the time",
    reveal:
      "The mainspring drives the gear train, the escapement lets it advance in equal ticks - about "
      + "5 ticks a second in a common mechanical watch - and the hands display the count.",
  },
  {
    id: "bricks", name: "Stack of bricks", shape: "bricks", isSystem: false, partCount: 12,
    anchors: [
      { x: -26, y: -18, label: "brick" },
      { x: 4, y: -42, label: "brick" },
      { x: 30, y: -64, label: "brick" },
    ],
    links: [],
    job: "",
    reveal:
      "Twelve identical bricks of about 2.5 kg, resting on one another. Take one away and the rest "
      + "are unchanged. Mortar them into an arch, where each brick pushes on its neighbours, and "
      + "you would have a structure - a system.",
  },
  {
    id: "basket", name: "Basket of shopping", shape: "basket", isSystem: false, partCount: 4,
    anchors: [
      { x: -24, y: -34, label: "apple" },
      { x: 0, y: -44, label: "milk" },
      { x: 24, y: -36, label: "bread" },
      { x: 8, y: -20, label: "beans" },
    ],
    links: [],
    job: "",
    reveal:
      "Four things travelling together is not four things working together. The milk does nothing "
      + "to the bread. The basket is a container, not a system.",
  },
  {
    id: "sapling", name: "Potted sapling", shape: "sapling", isSystem: true, partCount: 5,
    anchors: [
      { x: -8, y: -14, label: "roots" },
      { x: 2, y: -46, label: "stem" },
      { x: -22, y: -74, label: "leaves" },
      { x: 30, y: -10, label: "soil and water" },
      { x: 26, y: -80, label: "sunlight" },
    ],
    links: [[3, 0], [0, 1], [1, 2], [2, 1], [4, 2], [1, 0]],
    job: "builds its own food from light, water and air",
    reveal:
      "Roots draw water up the stem to the leaves; the leaves send sugar back down. Living things "
      + "are systems too - a system does not have to be a machine.",
  },
  {
    id: "hive", name: "Beehive", shape: "hive", isSystem: true, partCount: 5,
    anchors: [
      { x: -2, y: -46, label: "queen" },
      { x: 30, y: -62, label: "worker bees" },
      { x: -34, y: -50, label: "comb" },
      { x: 6, y: -28, label: "brood" },
      { x: 34, y: -26, label: "honey stores" },
    ],
    links: [[0, 3], [1, 2], [1, 3], [2, 4], [1, 4], [1, 0]],
    job: "holds the brood nest at 35 degrees C and raises new bees",
    reveal:
      "No single bee can hold the nest at 35 degrees C. Thousands of workers fanning and shivering "
      + "together do. The colony is the system; each bee is a part of it.",
  },
];

type SortPhase = "arrive" | "inspect" | "verdict" | "exit";

interface SortState {
  order: number[];
  cursor: number;
  phase: SortPhase;
  phaseT: number;
  /** 1 = fully pressed, decays back to 0. */
  stamp: number;
  given: Verdict | "";
  lastCorrect: boolean;
  sorted: number;
  right: number;
  streak: number;
  best: number;
  opened: boolean;
  openedCount: number;
  binFlash: number;
}

function shuffled(n: number, pick: (a: number, b: number) => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = pick(0, i);
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

const sortModel: SimModel<SortState> = {
  init(_params, ctx) {
    return {
      order: shuffled(SPECIMENS.length, (a, b) => ctx.rng.int(a, b)),
      cursor: 0,
      phase: "arrive",
      phaseT: 0,
      stamp: 0,
      given: "",
      lastCorrect: false,
      sorted: 0,
      right: 0,
      streak: 0,
      best: 0,
      opened: false,
      openedCount: 0,
      binFlash: 0,
    };
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const speed = params.beltSpeed as number;
    const travel = 1.6 * (0.18 / Math.max(0.05, speed));
    const dwell = (params.feedback as boolean) ? 2.6 : 1.1;

    // Opening the specimen is recorded, because one challenge forbids it.
    if (s.phase === "inspect" && params.inspect === "open" && !s.opened) {
      s = { ...s, opened: true, openedCount: s.openedCount + 1 };
    }

    for (const input of inputs) {
      if (input.type !== "pointerdown") continue;
      if (s.phase !== "inspect") continue;
      const spec = SPECIMENS[s.order[s.cursor]];
      const given = params.verdict as Verdict;
      const ok = (given === "system") === spec.isSystem;
      const streak = ok ? s.streak + 1 : 0;
      s = {
        ...s,
        phase: "verdict",
        phaseT: 0,
        stamp: 1,
        given,
        lastCorrect: ok,
        sorted: s.sorted + 1,
        right: s.right + (ok ? 1 : 0),
        streak,
        best: Math.max(s.best, streak),
        binFlash: 1,
      };
    }

    if (dt <= 0) return s;

    const phaseT = s.phaseT + dt;
    const stamp = Math.max(0, s.stamp - dt * 1.8);
    const binFlash = Math.max(0, s.binFlash - dt * 0.8);
    s = { ...s, phaseT, stamp, binFlash };

    if (s.phase === "arrive" && phaseT >= travel) {
      s = { ...s, phase: "inspect", phaseT: 0 };
    } else if (s.phase === "verdict" && phaseT >= dwell) {
      s = { ...s, phase: "exit", phaseT: 0 };
    } else if (s.phase === "exit" && phaseT >= travel * 0.85) {
      s = {
        ...s,
        phase: "arrive",
        phaseT: 0,
        cursor: (s.cursor + 1) % s.order.length,
        given: "",
        opened: false,
      };
    }
    return s;
  },

  readouts(state) {
    const spec = SPECIMENS[state.order[state.cursor]];
    const acc = state.sorted > 0 ? state.right / state.sorted : 0;
    return [
      { key: "sorted", label: "Specimens stamped", quantity: q(state.sorted, "count"), semantic: "time", graphable: true },
      { key: "right", label: "Stamped correctly", quantity: q(state.right, "count"), semantic: "energy-kinetic", graphable: true },
      { key: "accuracy", label: "Accuracy", quantity: q(acc, "percent"), unit: "%", semantic: "energy-total", graphable: true },
      { key: "streak", label: "Streak", quantity: q(state.streak, "count"), semantic: "energy-kinetic", graphable: false },
      { key: "parts", label: "Parts in this specimen", quantity: q(spec.partCount, "count"), semantic: "mass", graphable: false },
      {
        key: "links", label: "Connections between parts", quantity: q(spec.links.length, "count"),
        semantic: "current", graphable: false, bands: ["6-8"],
      },
    ];
  },

  facts(state) {
    const spec = SPECIMENS[state.order[state.cursor]];
    return {
      specimen: spec.id,
      specimenName: spec.name,
      truth: spec.isSystem ? "system" : "collection",
      partCount: spec.partCount,
      linkCount: spec.links.length,
      hasJob: spec.job !== "",
      phase: state.phase,
      sorted: state.sorted,
      right: state.right,
      streak: state.streak,
      best: state.best,
      accuracy: state.sorted > 0 ? state.right / state.sorted : 0,
      lastCorrect: state.lastCorrect,
      openedCount: state.openedCount,
      given: state.given,
    };
  },
};

/* ---------------- specimen artwork ---------------- */

function drawBicycle(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const steel = theme.sci["mass"];
  const paint = theme.accent;
  const flow = theme.sci["current"];
  const spin = t * (mode === "shake" ? 3.4 : 1.1);
  for (const wx of [-34, 34]) {
    const wy = -24;
    ctx.save();
    ctx.strokeStyle = mixHex(steel, "#000000", 0.6);
    ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.arc(wx, wy, 23, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = mixHex(steel, "#ffffff", 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, wy, 19.6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hexA(steel, 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = spin + (i * Math.PI * 2) / 9;
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * 19, wy + Math.sin(a) * 19);
    }
    ctx.stroke();
    ctx.restore();
    sphere(ctx, wx, wy, 3.6, steel);
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-34, -24); ctx.lineTo(-8, -54); ctx.lineTo(19, -54); ctx.lineTo(34, -24);
  ctx.moveTo(-8, -54); ctx.lineTo(0, -24); ctx.lineTo(34, -24);
  ctx.moveTo(0, -24); ctx.lineTo(-34, -24);
  ctx.moveTo(19, -54); ctx.lineTo(27, -63);
  ctx.strokeStyle = mixHex(paint, "#000000", 0.25);
  ctx.lineWidth = 5.5;
  ctx.stroke();
  ctx.strokeStyle = hexA(mixHex(paint, "#ffffff", 0.7), 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // Saddle and bars.
  ctx.strokeStyle = mixHex(steel, "#000000", 0.4);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(20, -68); ctx.lineTo(34, -66);
  ctx.stroke();
  ctx.restore();
  material(ctx, -18, -62, 22, 6, mixHex(steel, "#000000", 0.3), 3);

  // Chainring, cassette and a chain that visibly runs.
  ctx.save();
  ctx.strokeStyle = mixHex(steel, "#ffffff", 0.2);
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(0, -24, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(34, -24, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  dashFlow(ctx, [{ x: 0, y: -33 }, { x: 34, y: -29 }], flow, t * 34, { width: 2.6, dash: 4, gap: 4, glow: 3 });
  dashFlow(ctx, [{ x: 34, y: -19 }, { x: 0, y: -15 }], flow, t * 34, { width: 2.6, dash: 4, gap: 4, glow: 3 });
  const ca = spin * 0.9;
  ctx.save();
  ctx.strokeStyle = mixHex(steel, "#ffffff", 0.3);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0 - Math.cos(ca) * 11, -24 - Math.sin(ca) * 11);
  ctx.lineTo(0 + Math.cos(ca) * 11, -24 + Math.sin(ca) * 11);
  ctx.stroke();
  ctx.restore();
}

function drawCrate(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const wood = theme.sci["decomposer"];
  const steel = theme.sci["mass"];
  const rattle = mode === "shake" ? 1 : 0;
  const open = mode === "open";

  // Loose parts, each with its own rattle phase: nothing here moves together.
  const loose: [number, number, number][] = [[-30, -30, 0.0], [2, -24, 1.7], [30, -34, 3.1], [-6, -44, 4.4]];
  ctx.save();
  ctx.beginPath();
  ctx.rect(-56, -76, 112, 74);
  if (!open) ctx.clip();
  for (let i = 0; i < loose.length; i++) {
    const [lx, ly, ph] = loose[i];
    const jx = rattle * Math.sin(t * 13 + ph) * 2.6;
    const jy = rattle * Math.cos(t * 11 + ph * 1.3) * 1.8;
    ctx.save();
    ctx.translate(lx + jx, ly + jy + (open ? -14 : 0));
    if (i === 0) {
      ctx.strokeStyle = mixHex(steel, "#000000", 0.55);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = hexA(steel, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + ph;
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
      }
      ctx.stroke();
    } else if (i === 1) {
      ctx.strokeStyle = mixHex(theme.sci["current"], "#000000", 0.15);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k <= 22; k++) {
        const a = (k / 22) * Math.PI * 2;
        const rr = 9 + Math.sin(a * 3 + ph) * 2.4;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.5;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (i === 2) {
      material(ctx, -12, -4, 24, 7, mixHex(steel, "#000000", 0.35), 3);
    } else {
      ctx.strokeStyle = mixHex(theme.accent, "#000000", 0.2);
      ctx.lineWidth = 4.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-16, 8); ctx.lineTo(-2, -10); ctx.lineTo(14, -10); ctx.lineTo(18, 8);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  // The crate itself, drawn over the parts so they sit inside it.
  const wobble = rattle * Math.sin(t * 12) * 1.4;
  ctx.save();
  ctx.translate(wobble, 0);
  material(ctx, -56, -46, 112, 44, wood, 3);
  ctx.strokeStyle = hexA(mixHex(wood, "#000000", 0.45), 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) { ctx.moveTo(-56, -46 + i * 11); ctx.lineTo(56, -46 + i * 11); }
  ctx.moveTo(-30, -46); ctx.lineTo(-30, -2);
  ctx.moveTo(30, -46); ctx.lineTo(30, -2);
  ctx.stroke();
  ctx.restore();
  // Lid: on when closed, tipped against the crate when opened.
  ctx.save();
  if (open) { ctx.translate(-62, -48); ctx.rotate(-0.9); } else { ctx.translate(0, -50); }
  material(ctx, open ? -28 : -58, -6, open ? 56 : 116, 8, mixHex(wood, "#ffffff", 0.16), 3);
  ctx.restore();
}

function drawTorch(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const steel = theme.sci["mass"];
  const lightC = theme.sci["light"];
  const open = mode === "open";
  const jig = mode === "shake" ? Math.sin(t * 10) * 2.2 : 0;
  ctx.save();
  ctx.translate(jig, 0);

  if (open) {
    // Two cells, a spring and the lamp, laid out inside the case.
    metal(ctx, -46, -36, 30, 15, steel, { radius: 4, angle: 90 });
    metal(ctx, -14, -36, 30, 15, steel, { radius: 4, angle: 90 });
    caption(ctx, -31, -28, "1.5 V", theme, { align: "center", size: 8, color: theme.ink });
    caption(ctx, 1, -28, "1.5 V", theme, { align: "center", size: 8, color: theme.ink });
    ctx.strokeStyle = hexA(theme.sci["current"], 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const px = -50 + i * 0.6;
      const py = -28 + Math.sin(i * 1.4) * 4;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Case body, then the head, then the lens.
  const bodyAlpha = open ? 0.42 : 1;
  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  plastic(ctx, -52, -42, 74, 28, mixHex(theme.accent, "#000000", 0.2), { radius: 8 });
  ctx.beginPath();
  ctx.moveTo(20, -46); ctx.lineTo(46, -54); ctx.lineTo(46, -6); ctx.lineTo(20, -14);
  ctx.closePath();
  ctx.fillStyle = mixHex(steel, "#ffffff", 0.12);
  ctx.fill();
  ctx.strokeStyle = mixHex(steel, "#000000", 0.45);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Switch on top, pressed when the torch is open and working.
  plastic(ctx, -6, -48 + (open ? 2 : 0), 16, 8, theme.sci["force"], { radius: 3 });

  // Reflector and lamp.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(45, -30, 5, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = hexA(mixHex(lightC, "#ffffff", 0.4), open ? 0.95 : 0.5);
  ctx.fill();
  ctx.restore();
  if (open) {
    glow(ctx, 47, -30, 42, lightC, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.24 + 0.06 * pulse(t, 0.7);
    ctx.fillStyle = lightC;
    ctx.beginPath();
    ctx.moveTo(46, -46); ctx.lineTo(128, -74); ctx.lineTo(128, 14); ctx.lineTo(46, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    sphere(ctx, 26, -30, 5, lightC, { glow: 1.1 });
  } else {
    sphere(ctx, 26, -30, 4, mixHex(lightC, "#000000", 0.45));
  }
  ctx.restore();
}

function drawWatch(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const steel = theme.sci["mass"];
  const brass = theme.sci["current"];
  const open = mode === "open";
  const jig = mode === "shake" ? Math.sin(t * 11) * 1.8 : 0;
  ctx.save();
  ctx.translate(jig, -42);

  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fillStyle = mixHex(steel, "#000000", 0.35);
  ctx.fill();
  ctx.restore();
  metal(ctx, -36, -36, 72, 72, steel, { radius: 36, angle: 115 });
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = mixHex(theme.surface, theme.ink, isDarkTheme(theme) ? 0.1 : 0.04);
  ctx.fillRect(-32, -32, 64, 64);

  if (open) {
    // The movement: three wheels turning at three rates, plus the spring.
    const wheels: [number, number, number, number][] = [[-14, -6, 13, 0.7], [8, -10, 10, -1.6], [22, 4, 7, 3.1]];
    for (const [wx, wy, wr, rate] of wheels) {
      const a = t * rate;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(a);
      ctx.strokeStyle = mixHex(brass, "#000000", 0.1);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const ta = (i * Math.PI) / 6;
        ctx.moveTo(Math.cos(ta) * wr, Math.sin(ta) * wr);
        ctx.lineTo(Math.cos(ta) * (wr + 2.6), Math.sin(ta) * (wr + 2.6));
      }
      ctx.stroke();
      ctx.restore();
      sphere(ctx, wx, wy, 2.4, brass);
    }
    ctx.strokeStyle = hexA(mixHex(steel, "#ffffff", 0.35), 0.95);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 5;
      const rr = 3 + i * 0.14;
      const px = -18 + Math.cos(a) * rr, py = -6 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a) * 27, Math.sin(a) * 27);
    }
    ctx.stroke();
  }
  // Hands: one full turn a minute for the long hand, so the tick is visible.
  const secA = -Math.PI / 2 + (t % 60) * (Math.PI / 30);
  const minA = -Math.PI / 2 + (t % 3600) * (Math.PI / 1800);
  ctx.strokeStyle = theme.ink;
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(minA) * 15, Math.sin(minA) * 15); ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = theme.sci["force"];
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(secA) * 23, Math.sin(secA) * 23); ctx.stroke();
  sphere(ctx, 0, 0, 2.6, theme.sci["force"]);
  ctx.restore();
  glass(ctx, -30, -30, 60, 60, 30, theme, { alpha: isDarkTheme(theme) ? 0.1 : 0.2 });
  metal(ctx, 34, -6, 8, 12, steel, { radius: 3 });
  ctx.restore();
}

function drawBricks(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const brick = mixHex(theme.sci["force"], "#000000", 0.34);
  const wood = theme.sci["decomposer"];
  const rattle = mode === "shake" ? 1 : 0;
  material(ctx, -50, -8, 100, 8, wood, 2);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col;
      const jx = rattle * Math.sin(t * 14 + i * 1.9) * 2.2;
      const jy = rattle * Math.abs(Math.sin(t * 7 + i)) * -1.6;
      const x = -44 + col * 30 + (row % 2 ? 4 : 0) + jx;
      const y = -8 - (row + 1) * 15 + jy;
      material(ctx, x, y, 27, 13, mixHex(brick, "#ffffff", (i % 3) * 0.05), 2);
    }
  }
}

function drawBasket(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const steel = theme.sci["mass"];
  const rattle = mode === "shake" ? 1 : 0;
  const items: [number, number, number, string][] = [
    [-24, -34, 0.4, theme.sci["force"]],
    [0, -44, 2.1, theme.sci["cold"]],
    [24, -36, 3.6, theme.sci["decomposer"]],
    [8, -20, 5.0, theme.sci["producer"]],
  ];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-46, -50); ctx.lineTo(46, -50); ctx.lineTo(36, -2); ctx.lineTo(-36, -2);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < items.length; i++) {
    const [ix, iy, ph, col] = items[i];
    const jx = rattle * Math.sin(t * 13 + ph) * 2.8;
    const jy = rattle * Math.cos(t * 10 + ph) * 2.0;
    if (i === 0) sphere(ctx, ix + jx, iy + jy, 11, col);
    else if (i === 1) material(ctx, ix + jx - 10, iy + jy - 12, 20, 26, col, 3);
    else if (i === 2) {
      ctx.save();
      ctx.translate(ix + jx, iy + jy);
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 9, -0.18, 0, Math.PI * 2);
      ctx.fillStyle = mixHex(col, "#ffffff", 0.25);
      ctx.fill();
      ctx.restore();
    } else metal(ctx, ix + jx - 8, iy + jy - 11, 16, 22, col, { radius: 3 });
  }
  ctx.restore();
  // Wire basket over the contents.
  ctx.save();
  ctx.strokeStyle = hexA(mixHex(steel, "#ffffff", 0.3), 0.95);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-46, -50); ctx.lineTo(-36, -2); ctx.lineTo(36, -2); ctx.lineTo(46, -50);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexA(steel, 0.75);
  ctx.beginPath();
  for (let i = 1; i < 7; i++) {
    const f = i / 7;
    ctx.moveTo(lerp(-46, -36, f), lerp(-50, -2, f));
    ctx.lineTo(lerp(46, 36, f), lerp(-50, -2, f));
  }
  for (let i = 1; i < 8; i++) {
    const f = i / 8;
    ctx.moveTo(lerp(-46, 46, f), -50);
    ctx.lineTo(lerp(-36, 36, f), -2);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSapling(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const wood = theme.sci["decomposer"];
  const leaf = theme.sci["producer"];
  const water = theme.sci["liquid"];
  const sugar = theme.sci["current"];
  const open = mode === "open";
  const sway = (mode === "shake" ? 0.06 : 0.018) * Math.sin(t * (mode === "shake" ? 6 : 1.1));

  // Soil in a clear pot, so the roots are part of the picture.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-34, -30); ctx.lineTo(34, -30); ctx.lineTo(27, -2); ctx.lineTo(-27, -2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = mixHex(wood, "#000000", 0.3);
  ctx.fillRect(-40, -30, 80, 30);
  noiseWash(ctx, -40, -30, 80, 30, { alpha: 0.08, seed: 12, count: 70, color: "#ffffff" });
  ctx.strokeStyle = hexA(mixHex(wood, "#ffffff", 0.35), 0.9);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(Math.cos(a) * 12, -18, Math.cos(a) * 24, -4);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-34, -30); ctx.lineTo(34, -30); ctx.lineTo(27, -2); ctx.lineTo(-27, -2);
  ctx.closePath();
  ctx.strokeStyle = hexA(theme.sci["cold"], 0.8);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, -30);
  ctx.rotate(sway);
  ctx.strokeStyle = mixHex(wood, "#ffffff", 0.1);
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -26, 0, -46);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1, -22); ctx.lineTo(-18, -36);
  ctx.moveTo(1, -32); ctx.lineTo(20, -44);
  ctx.stroke();
  for (const [lx, ly, lr] of [[-22, -44, 15], [22, -50, 13], [0, -58, 16]] as [number, number, number][]) {
    sphere(ctx, lx, ly, lr, mixHex(leaf, "#000000", 0.05), { glow: 0.12 });
  }
  if (open) {
    dashFlow(ctx, [{ x: 0, y: -2 }, { x: 2, y: -24 }, { x: -6, y: -40 }], water, t * 26, { width: 2.4, dash: 4, gap: 6, glow: 4 });
    dashFlow(ctx, [{ x: 6, y: -44 }, { x: 4, y: -22 }, { x: 2, y: -2 }], sugar, t * 22, { width: 2.2, dash: 3, gap: 7, glow: 4 });
  }
  ctx.restore();
  if (open) {
    for (let i = 0; i < 3; i++) {
      const yy = -96 + ((t * 22 + i * 20) % 34);
      arrow(ctx, 40 + i * 12, yy, 32 + i * 12, yy + 16, theme.sci["light"], { width: 1.6 });
    }
  }
}

function drawHive(ctx: CanvasRenderingContext2D, theme: ThemeColors, t: number, mode: InspectMode) {
  const wood = theme.sci["decomposer"];
  const honey = theme.sci["current"];
  const heat = theme.sci["hot"];
  const open = mode === "open";
  const jig = mode === "shake" ? Math.sin(t * 12) * 2 : 0;
  ctx.save();
  ctx.translate(jig, 0);

  if (open) {
    // A comb of real hexagons, warm in the middle where the brood sits.
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        const hx = -46 + col * 16 + (row % 2 ? 8 : 0);
        const hy = -66 + row * 14;
        const d = Math.hypot(hx - 4, hy + 40) / 46;
        const fill = mixHex(honey, heat, clamp01(1 - d) * 0.55);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 + Math.PI / 6;
          const px = hx + Math.cos(a) * 8, py = hy + Math.sin(a) * 8;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = hexA(fill, 0.85);
        ctx.fill();
        ctx.strokeStyle = hexA(mixHex(honey, "#000000", 0.45), 0.8);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    // Workers on the comb, and one larger queen.
    for (let i = 0; i < 16; i++) {
      const ph = i * 1.31;
      const bx = 4 + Math.cos(t * (0.7 + (i % 4) * 0.2) + ph) * (18 + (i % 5) * 6);
      const by = -44 + Math.sin(t * (0.6 + (i % 3) * 0.25) + ph * 1.7) * (14 + (i % 4) * 5);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(t * 2 + ph) * 0.6);
      ctx.fillStyle = mixHex(honey, "#000000", 0.25);
      ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 2.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hexA(theme.surface, 0.7);
      ctx.beginPath(); ctx.ellipse(0, -2.6, 3.2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    sphere(ctx, -2, -46, 5, mixHex(honey, "#ffffff", 0.3), { glow: 0.8 });
  }

  // The hive box, translucent once opened so the comb reads through it.
  ctx.save();
  ctx.globalAlpha = open ? 0.3 : 1;
  material(ctx, -52, -76, 104, 74, wood, 4);
  ctx.strokeStyle = hexA(mixHex(wood, "#000000", 0.45), 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) { ctx.moveTo(-52, -76 + i * 18); ctx.lineTo(52, -76 + i * 18); }
  ctx.stroke();
  ctx.restore();
  material(ctx, -58, -84, 116, 10, mixHex(wood, "#ffffff", 0.18), 3);
  // The entrance slot, with bees coming and going.
  ctx.fillStyle = mixHex(wood, "#000000", 0.6);
  roundRect(ctx, -20, -12, 40, 6, 3);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const f = ((t * 0.35 + i * 0.2) % 1);
    const bx = lerp(0, -70 + i * 30, f);
    const by = lerp(-9, -44 - i * 6, f) + Math.sin(t * 6 + i) * 3;
    ctx.fillStyle = hexA(mixHex(honey, "#000000", 0.2), 1 - f * 0.6);
    ctx.beginPath(); ctx.ellipse(bx, by, 2.6, 1.7, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawSpecimen(
  ctx: CanvasRenderingContext2D, spec: Specimen, theme: ThemeColors, t: number, mode: InspectMode,
) {
  switch (spec.shape) {
    case "bicycle": drawBicycle(ctx, theme, t, mode); break;
    case "crate": drawCrate(ctx, theme, t, mode); break;
    case "torch": drawTorch(ctx, theme, t, mode); break;
    case "watch": drawWatch(ctx, theme, t, mode); break;
    case "bricks": drawBricks(ctx, theme, t, mode); break;
    case "basket": drawBasket(ctx, theme, t, mode); break;
    case "sapling": drawSapling(ctx, theme, t, mode); break;
    case "hive": drawHive(ctx, theme, t, mode); break;
  }
}

/* ---------------- the workshop ---------------- */

const MOTES: Particle[] = [];

function renderSort(rc: RenderContext<SortState>) {
  const { ctx, state: s, params, theme, width: W, height: H, band, overlays, time: t } = rc;
  const spec = SPECIMENS[s.order[s.cursor]];
  const mode = params.inspect as InspectMode;
  const steel = theme.sci["mass"];
  const wood = theme.sci["decomposer"];
  const lightC = theme.sci["light"];
  const flow = theme.sci["current"];
  const good = theme.sci["energy-kinetic"];
  const bad = theme.sci["force"];
  const dark = isDarkTheme(theme);

  const beltY = Math.round(H * 0.56);
  const inspectX = Math.round(W * 0.42);
  const binW = Math.min(140, W * 0.15);
  const binTop = H - 92;
  const binSysX = W * 0.58;
  const binColX = binSysX + binW + 26;

  /* ---- the room ---- */
  sky(ctx, W, H, theme, "indoor");
  gradientFill(ctx, 0, 0, W, beltY, [
    { at: 0, color: hexA(mixHex(theme.surfaceAlt, theme.ink, dark ? 0.16 : 0.1), 1) },
    { at: 0.7, color: hexA(mixHex(theme.surfaceAlt, theme.ink, dark ? 0.06 : 0.03), 1) },
    { at: 1, color: hexA(theme.surfaceAlt, 0) },
  ], 90);
  // Pegboard with a few hung tools, far enough left to stay out of the way.
  const pegX = 26, pegY = 122, pegW = Math.min(180, W * 0.21);
  const pegH = Math.max(70, Math.min(122, beltY - pegY - 40));
  material(ctx, pegX, pegY, pegW, pegH, mixHex(wood, "#000000", 0.25), 4);
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, 0.18);
  ctx.beginPath();
  for (let x = pegX + 10; x < pegX + pegW - 6; x += 13) {
    for (let y = pegY + 10; y < pegY + pegH - 6; y += 13) { ctx.moveTo(x + 1.4, y); ctx.arc(x, y, 1.4, 0, Math.PI * 2); }
  }
  ctx.fill();
  ctx.strokeStyle = hexA(mixHex(steel, "#ffffff", 0.2), 0.8);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pegX + 28, pegY + 22); ctx.lineTo(pegX + 34, pegY + 74);
  ctx.moveTo(pegX + 64, pegY + 20); ctx.lineTo(pegX + 58, pegY + 66);
  ctx.moveTo(pegX + 96, pegY + 24); ctx.lineTo(pegX + 102, pegY + 80);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(pegX + 28, pegY + 74); ctx.lineTo(pegX + 34, pegY + 82);
  ctx.moveTo(pegX + 96, pegY + 80); ctx.lineTo(pegX + 108, pegY + 86);
  ctx.stroke();
  ctx.restore();
  noiseWash(ctx, 0, 0, W, beltY, { alpha: 0.05, seed: 91, count: 320, color: dark ? "#ffffff" : "#000000" });

  /* ---- inspection lamp and its cone of light ---- */
  const lampY = Math.round(H * 0.1);
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(inspectX, 0); ctx.lineTo(inspectX, lampY); ctx.stroke();
  ctx.restore();
  const coneH = beltY - lampY - 8;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(inspectX - 22, lampY + 16);
  ctx.lineTo(inspectX + 22, lampY + 16);
  ctx.lineTo(inspectX + 118, beltY - 4);
  ctx.lineTo(inspectX - 118, beltY - 4);
  ctx.closePath();
  ctx.fillStyle = gradientFillStops(ctx, inspectX, lampY, coneH, lightC);
  ctx.fill();
  ctx.restore();
  MOTES.length = 0;
  for (let i = 0; i < 44; i++) {
    const seed = i * 0.6180339887;
    const f = ((seed * 13.7 + t * (0.05 + (i % 5) * 0.02)) % 1);
    const yy = lampY + 16 + f * coneH;
    const spread = lerp(20, 112, f);
    const xx = inspectX + Math.sin(seed * 41.3 + t * 0.5 + i) * spread * 0.86;
    MOTES.push({ x: xx, y: yy, r: 0.7 + (i % 3) * 0.5, a: 0.25 + 0.45 * (1 - f) });
  }
  particleField(ctx, MOTES, mixHex(lightC, "#ffffff", 0.4), { size: 1, alpha: 0.7, glow: 3 });
  metal(ctx, inspectX - 30, lampY, 60, 8, steel, { radius: 3 });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(inspectX - 30, lampY + 6);
  ctx.lineTo(inspectX + 30, lampY + 6);
  ctx.lineTo(inspectX + 22, lampY + 20);
  ctx.lineTo(inspectX - 22, lampY + 20);
  ctx.closePath();
  ctx.fillStyle = mixHex(steel, "#000000", 0.25);
  ctx.fill();
  ctx.restore();
  glow(ctx, inspectX, lampY + 20, 46, lightC, 0.55);

  /* ---- bench, belt and rollers ---- */
  material(ctx, 0, beltY, W, 26, mixHex(steel, "#000000", 0.35), 0);
  gradientFill(ctx, 0, beltY + 26, W, H - beltY - 26, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.1 : 0.07),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.02 : 0.02),
  ], 90);
  const beltSpeedPx = (params.beltSpeed as number) * 320;
  const phase = (t * beltSpeedPx) % 26;
  material(ctx, 0, beltY - 12, W, 14, mixHex(steel, "#000000", 0.5), 0);
  ctx.save();
  ctx.strokeStyle = hexA(mixHex(steel, "#ffffff", 0.45), 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -26 + phase; x < W + 26; x += 26) { ctx.moveTo(x, beltY - 12); ctx.lineTo(x - 6, beltY + 2); }
  ctx.stroke();
  ctx.restore();
  for (let x = 13; x < W; x += 26) {
    sphere(ctx, x, beltY + 12, 7, mixHex(steel, "#000000", 0.15));
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.35);
    ctx.lineWidth = 1;
    const a = (t * beltSpeedPx) / 7;
    ctx.beginPath();
    ctx.moveTo(x, beltY + 12);
    ctx.lineTo(x + Math.cos(a) * 5, beltY + 12 + Math.sin(a) * 5);
    ctx.stroke();
    ctx.restore();
  }

  /* ---- the two bins ---- */
  for (const bin of [
    { x: binSysX, label: "SYSTEM", col: good, key: "system" as Verdict },
    { x: binColX, label: "COLLECTION", col: theme.sci["mass"], key: "collection" as Verdict },
  ]) {
    const hot = s.given === bin.key ? s.binFlash : 0;
    ctx.save();
    if (hot > 0.01) glow(ctx, bin.x + binW / 2, binTop + 20, 70 * hot, bin.col, 0.4 * hot);
    ctx.restore();
    material(ctx, bin.x, binTop, binW, 66, mixHex(bin.col, "#000000", 0.55), 5);
    innerGlow(ctx, (c) => roundRect(c, bin.x, binTop, binW, 66, 5), bin.col, { inset: 10, alpha: 0.3 + hot * 0.4 });
    material(ctx, bin.x - 5, binTop - 7, binW + 10, 9, mixHex(bin.col, "#000000", 0.3), 3);
    caption(ctx, bin.x + binW / 2, binTop + 40, bin.label, theme, {
      align: "center", size: 11, color: mixHex(bin.col, "#ffffff", 0.35), weight: 800,
    });
  }

  /* ---- where the specimen is right now ---- */
  const travelIn = easeInOut(clamp01(s.phaseT / (1.6 * (0.18 / Math.max(0.05, params.beltSpeed as number)))));
  let sx = inspectX;
  let sy = beltY - 12;
  let opacity = 1;
  if (s.phase === "arrive") {
    sx = lerp(-90, inspectX, travelIn);
  } else if (s.phase === "exit") {
    const f = easeInOut(clamp01(s.phaseT / (1.36 * (0.18 / Math.max(0.05, params.beltSpeed as number)))));
    const target = (s.given === "system" ? binSysX : binColX) + binW / 2;
    sx = lerp(inspectX, target, f);
    sy = beltY - 12 + Math.max(0, f - 0.55) * (binTop - beltY + 40) * 2.3;
    opacity = 1 - Math.max(0, f - 0.7) * 2.6;
  }

  /* ---- the specimen ---- */
  const k = Math.min(1.15, Math.max(0.78, H / 520));
  ctx.save();
  ctx.globalAlpha = clamp01(opacity);
  spriteShadowEllipse(ctx, sx, sy + 2, 62 * k, 9 * k, { alpha: 0.32 });
  contactShadow(ctx, sx, sy + 2, 26 * k, 0);
  ctx.translate(sx, sy);
  ctx.scale(k, k);
  drawSpecimen(ctx, spec, theme, t, s.phase === "inspect" ? mode : "look");
  ctx.restore();

  /* ---- interactions between the parts, once it is open ---- */
  const anchorScreen = spec.anchors.map((a) => ({ x: sx + a.x * k, y: sy + a.y * k, label: a.label }));
  if (mode === "open" && s.phase === "inspect" && overlays.links !== false) {
    for (let i = 0; i < spec.links.length; i++) {
      const [a, b] = spec.links[i];
      const p = anchorScreen[a], qq = anchorScreen[b];
      if (!p || !qq) continue;
      const wob = 0.55 + 0.45 * pulse(t + i * 0.22, 0.5);
      ctx.save();
      ctx.globalAlpha = wob;
      arrow(ctx, p.x, p.y, qq.x, qq.y, flow, { width: 1.8, head: 8 });
      ctx.restore();
    }
    if (spec.links.length === 0) {
      caption(ctx, sx, sy - 108 * k, "no connections found", theme, {
        align: "center", size: 12, color: theme.inkSoft, weight: 700,
      });
    }
  }

  /* ---- part labels, parked in the clear margin ---- */
  if (overlays.labels !== false && s.phase === "inspect" && mode === "open" && band !== "3-5") {
    const leftCol = 26, rightCol = W - 24;
    let li = 0, ri = 0;
    for (const a of anchorScreen) {
      const toLeft = a.x < sx;
      const ty = (toLeft ? 176 + li * 34 : 176 + ri * 34);
      if (ty > H - 120) continue;
      labelLeader(ctx, a.x, a.y, toLeft ? leftCol + 128 : rightCol - 128, ty, a.label, theme, {
        color: theme.accent, size: 11, align: toLeft ? "left" : "right",
      });
      if (toLeft) li++; else ri++;
    }
  }

  /* ---- the verdict press ---- */
  const pivotX = inspectX + 148, pivotY = beltY - 148;
  metal(ctx, pivotX - 9, pivotY - 6, 18, beltY - pivotY + 4, steel, { radius: 3 });
  const armA = 0.22 * spring(clamp01(s.stamp));
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(armA);
  metal(ctx, -148, -7, 152, 14, steel, { radius: 5, angle: 90 });
  const headCol = (params.verdict as Verdict) === "system" ? good : theme.sci["mass"];
  metal(ctx, -150, 6, 54, 12, mixHex(steel, "#ffffff", 0.1), { radius: 3 });
  plastic(ctx, -152, 17, 58, 26, headCol, { radius: 5 });
  caption(ctx, -123, 30, (params.verdict as Verdict) === "system" ? "SYSTEM" : "COLLECT.", theme, {
    align: "center", size: 9.5, color: mixHex(headCol, "#ffffff", 0.85), weight: 800,
  });
  ctx.restore();
  sphere(ctx, pivotX, pivotY, 7, mixHex(steel, "#ffffff", 0.25));

  /* ---- inspection log ---- */
  const acc = s.sorted > 0 ? s.right / s.sorted : 0;
  panelCard(ctx, 18, 16, 214, 92, theme, "INSPECTION LOG");
  caption(ctx, 30, 44, `${s.sorted} stamped`, theme, { size: 14, color: theme.ink, weight: 700 });
  caption(ctx, 30, 64, `${s.right} correct`, theme, { size: 12, color: good });
  caption(ctx, 30, 82, `streak ${s.streak}  ·  best ${s.best}`, theme, { size: 11, color: theme.inkSoft });
  arcGauge(ctx, 190, 62, 27, acc, theme.accent, theme, pctText(acc), { sub: "right", width: 6, ticks: 5 });

  /* ---- the three tests ---- */
  if (overlays.tests !== false) {
    const tw = 224, tx = W - tw - 18, ty = 16;
    panelCard(ctx, tx, ty, tw, 108, theme, "THE THREE TESTS");
    const unlocked = mode === "look" ? 1 : mode === "shake" ? 2 : 3;
    const rows: [string, string, boolean][] = [
      ["Distinct parts?", `${spec.partCount} parts`, spec.partCount >= 2],
      ["Parts act on each other?", spec.links.length > 0 ? `${spec.links.length} connections` : "none found", spec.links.length > 0],
      ["A job of its own?", spec.job !== "" ? "yes" : "no", spec.job !== ""],
    ];
    for (let i = 0; i < rows.length; i++) {
      const [q1, detail, pass] = rows[i];
      const ry = ty + 36 + i * 24;
      const known = i < unlocked;
      lamp(ctx, tx + 20, ry, 6, known ? (pass ? good : bad) : theme.inkSoft, known, t + i * 0.4);
      caption(ctx, tx + 36, ry, q1, theme, { size: 11, color: known ? theme.ink : theme.inkSoft });
      caption(ctx, tx + tw - 14, ry, known ? detail : "locked", theme, {
        align: "right", size: 10.5, color: known ? (pass ? good : bad) : theme.inkSoft, weight: 700,
      });
    }
    caption(ctx, tx + 12, ty + 100, mode === "look" ? "Shake it to test the connections."
      : mode === "shake" ? "Open it to test for a job of its own." : "All three tests are available.",
      theme, { size: 10, color: theme.inkSoft });
  }

  /* ---- name plate and live counts beside the specimen ---- */
  if (s.phase !== "exit") {
    badge(ctx, sx, sy + 44, spec.name, theme, { align: "center", color: theme.accent, sub: "specimen" });
  }
  if (s.phase === "inspect" && mode !== "look" && band !== "3-5") {
    badge(ctx, sx - 118 * k, sy - 74 * k, `${spec.partCount}`, theme, { align: "center", color: theme.sci["mass"], sub: "parts" });
    if (mode === "open") {
      badge(ctx, sx + 118 * k, sy - 74 * k, `${spec.links.length}`, theme, { align: "center", color: flow, sub: "links" });
    }
  }

  /* ---- verdict ---- */
  if (s.phase === "verdict" || s.phase === "exit") {
    const col = s.lastCorrect ? good : bad;
    const rise = spring(clamp01(s.phaseT * 2.6));
    caption(ctx, inspectX, beltY - 176 - rise * 8, s.lastCorrect ? "CORRECT" : "NOT QUITE", theme, {
      align: "center", size: 22, color: col, weight: 800,
    });
    if (params.feedback as boolean) {
      const truth = spec.isSystem ? "It is a system." : "It is just a collection.";
      caption(ctx, inspectX, beltY - 154, truth, theme, { align: "center", size: 12, color: theme.ink, weight: 700 });
      // Kept in the clear strip left of the bins so no text lands on the artwork.
      wrapCaption(ctx, spec.reveal, (26 + binSysX - 34) / 2, H - 44,
        Math.max(240, binSysX - 90), theme, 11.5);
    }
  } else if (s.phase === "inspect") {
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.35 * pulse(t, 0.5);
    caption(ctx, inspectX, beltY - 176, "click the bench to press the stamp", theme, {
      align: "center", size: 12, color: theme.accent, weight: 700,
    });
    ctx.restore();
  }

  vignette(ctx, W, H, 0.2);
}

/** A soft top-lit cone fill, kept out of the render body for readability. */
function gradientFillStops(
  ctx: CanvasRenderingContext2D, x: number, topY: number, h: number, color: string,
): CanvasGradient {
  const g = ctx.createLinearGradient(x, topY, x, topY + h);
  g.addColorStop(0, hexA(color, 0.34));
  g.addColorStop(0.55, hexA(color, 0.12));
  g.addColorStop(1, hexA(color, 0.02));
  return g;
}

/** Centre-aligned wrapped caption, so reveal text never runs off the stage. */
function wrapCaption(
  ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number,
  theme: ThemeColors, size = 12,
) {
  ctx.save();
  ctx.font = `500 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  ctx.restore();
  const start = y - (lines.length - 1) * (size + 4);
  for (let i = 0; i < lines.length; i++) {
    caption(ctx, cx, start + i * (size + 4), lines[i], theme, {
      align: "center", size, color: theme.inkSoft, weight: 500,
    });
  }
}

export const g6a1SystemOrHeap: SimManifest<SortState> = {
  id: "g6a1-system-or-heap",
  title: "System or Heap?",
  tagline: "Inspect each specimen on the line three ways, then stamp your verdict.",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [4, 5, 6, 7],
  standards: { ngss: ["MS-ETS1-1", "MS-LS1-3"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Apply three tests to decide whether something is a system: parts, connections, and a job of its own.",
    "Explain why the same parts can make a system in one arrangement and a heap in another.",
    "Recognise that living things and colonies are systems, not only machines.",
  ],
  misconceptions: [
    "Any group of things counts as a system",
    "A system is just a set of parts",
    "Only machines are systems",
    "If you can see lots of pieces, it must be a system",
  ],
  interactionHint: "Choose a stamp and an inspection, then click the bench to press it.",
  params: {
    verdict: {
      type: "option", label: "Stamp loaded in the press",
      options: [
        { value: "system", label: "SYSTEM" },
        { value: "collection", label: "Just a collection" },
      ],
      default: "system",
      help: "Load the stamp you believe in, then click the bench to press it.",
    },
    inspect: {
      type: "option", label: "Inspection",
      options: [
        { value: "look", label: "Look at the outside" },
        { value: "shake", label: "Shake it" },
        { value: "open", label: "Open it up" },
      ],
      default: "look",
      help: "Shaking shows whether the parts move together. Opening shows the connections.",
    },
    feedback: {
      type: "boolean", label: "Explain the answer after each stamp", default: true,
    },
    beltSpeed: {
      type: "number", label: "Belt speed", kind: "velocity", unit: "m/s",
      min: 0.08, max: 0.5, step: 0.02, default: 0.18, bands: ["6-8"],
      help: "A real inspection conveyor runs at roughly 0.2 m/s.",
    },
  },
  overlays: [
    { key: "tests", label: "The three tests", default: true },
    { key: "links", label: "Connection arrows", default: true },
    { key: "labels", label: "Part labels", default: true, bands: ["6-8"] },
  ],
  model: sortModel,
  render: renderSort,
  labs: [
    {
      id: "same-parts",
      title: "Same parts, different answer",
      question: "A crate holds every part of a bicycle. Is the crate a system?",
      bands: ["3-5", "6-8"],
      minutes: 20,
      standards: ["MS-ETS1-1"],
      setup: { verdict: "system", inspect: "look", feedback: true, beltSpeed: 0.18 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit before you inspect",
          instruction: "A crate holds a frame, two wheels, a chain, cranks, brakes and handlebars.",
          predict: {
            prompt: "Is that crate of bicycle parts a system?",
            options: [
              "Yes - it has all the parts a bicycle has",
              "No - the parts are not connected and do no job together",
              "Yes - anything with more than one part is a system",
            ],
            correct: 1,
            reveal:
              "A system needs parts that act on each other and a job the whole does. The crate has the parts "
              + "and neither of the other two.",
          },
        },
        {
          id: "open-both",
          phase: "measure",
          title: "Open something up",
          instruction: "Set Inspection to Open it up and watch the connection arrows appear, or fail to.",
          check: {
            describe: "Inspection is set to Open it up",
            test: (v) => v.params.inspect === "open",
          },
          hints: [
            "Looking at the outside can never show you a connection.",
            "Count the arrows. A heap has none.",
          ],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Stamp four specimens",
          instruction: "Inspect and stamp four specimens. Record the parts and connections for each.",
          requireData: 4,
          hints: ["Record after the verdict appears, while the counts are still on the stage."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Look at your table",
          instruction: "Compare the connection counts for the things you called systems and the things you did not.",
          write: {
            prompt: "What number in your table separates the systems from the collections?",
            placeholder: "Every system I stamped had ... connections, and every collection had ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Write a test someone else could apply to a new object.",
          write: {
            prompt: "Write your three-part test for deciding whether something is a system.",
            placeholder: "First I would check ... then ... and finally ...",
          },
        },
      ],
    },
    {
      id: "which-test",
      title: "Which test does the work?",
      question: "Can you sort correctly without ever opening a specimen?",
      bands: ["6-8"],
      minutes: 25,
      setup: { verdict: "system", inspect: "look", feedback: true, beltSpeed: 0.18 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the weakest test",
          instruction: "Three tests: parts, connections, a job of its own.",
          predict: {
            prompt: "Which test on its own decides the fewest specimens correctly?",
            options: ["Counting the parts", "Finding the connections", "Finding a job of its own"],
            correct: 0,
            reveal:
              "Counting parts settles almost nothing - a heap of bricks has twelve parts. Connections and a "
              + "job of its own are what separate a system from a pile.",
          },
        },
        {
          id: "look-only",
          phase: "measure",
          title: "Round one: look only",
          instruction: "Keep Inspection on Look at the outside and stamp four specimens. Record your accuracy.",
          requireData: 2,
          check: {
            describe: "At least four specimens stamped",
            test: (v) => (v.facts.sorted as number) >= 4,
          },
        },
        {
          id: "shake-round",
          phase: "measure",
          title: "Round two: shake them",
          instruction: "Switch to Shake it and stamp four more. Record accuracy again.",
          check: {
            describe: "Inspection is set to Shake it and eight specimens are stamped",
            test: (v) => v.params.inspect === "shake" && (v.facts.sorted as number) >= 8,
          },
          requireData: 4,
          hints: ["A shaken system moves as one piece. A shaken heap rattles."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the rounds",
          instruction: "Which inspection made you more accurate, and why?",
          write: {
            prompt: "Compare your accuracy for looking and for shaking. What did shaking reveal?",
            placeholder: "Looking gave me ... percent and shaking gave me ... because shaking shows ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Defend one test",
          instruction: "Argue for the single most useful test.",
          write: {
            prompt: "If you were allowed only one test, which would you keep and what would you still get wrong?",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "clean-line",
      title: "Run a clean line",
      brief: "Stamp six specimens in a row without a mistake.",
      bands: ["3-5", "6-8"],
      setup: { verdict: "system", inspect: "open", feedback: true },
      goal: { describe: "A streak of 4 correct", test: (v) => (v.facts.streak as number) >= 4 },
      stars: {
        two: { describe: "A streak of 6 correct", test: (v) => (v.facts.streak as number) >= 6 },
        three: { describe: "A streak of 8 correct", test: (v) => (v.facts.streak as number) >= 8 },
      },
      hints: [
        "Open the specimen before you stamp it: connections are invisible from the outside.",
        "A living colony is still a system, even though nobody built it.",
      ],
    },
    {
      id: "sealed-box",
      title: "The sealed box",
      brief: "Sort six specimens correctly without ever opening one.",
      bands: ["6-8"],
      setup: { verdict: "system", inspect: "shake", feedback: false },
      goal: {
        describe: "Six or more stamped, all correct, never opened",
        test: (v) => (v.facts.sorted as number) >= 6 && (v.facts.right as number) === (v.facts.sorted as number)
          && (v.facts.openedCount as number) === 0,
      },
      stars: {
        two: {
          describe: "Eight or more, all correct, never opened",
          test: (v) => (v.facts.sorted as number) >= 8 && (v.facts.right as number) === (v.facts.sorted as number)
            && (v.facts.openedCount as number) === 0,
        },
      },
      hints: [
        "Shake it. Parts that are joined move together; parts that are loose rattle on their own.",
        "Ask what job the whole thing does. A basket of shopping does no job its contents cannot.",
      ],
    },
  ],
};

/* ================================================================== *
 * A1.2 — Build the Machine
 *
 * A repair bay. Fit parts into subsystems, subsystems into a machine,
 * and put the machine into the street it belongs to. One dial walks
 * the whole nesting ladder: World, Machine, Subsystem, Part.
 * ================================================================== */

type IconKind = "ring" | "disc" | "rod" | "bar" | "chain" | "block" | "torus" | "fork" | "coil";

interface PartSpec {
  id: string;
  name: string;
  /** Mass in kg, from a real 8 kg road bicycle. */
  mass: number;
  icon: IconKind;
}

interface Subsystem {
  id: string;
  name: string;
  job: string;
  colorKey: string;
  parts: PartSpec[];
  /** Which part acts on which, by index into parts. */
  links: [number, number][];
  /** The one part opened up at the deepest level. */
  detail: { name: string; pieces: { name: string; icon: IconKind }[]; note: string };
}

const FRAME_MASS = 2.4; // frame, seatpost and saddle, already in the stand

const SUBSYSTEMS: Subsystem[] = [
  {
    id: "drivetrain", name: "Drivetrain", colorKey: "current",
    job: "turns the rider's push into a turning back wheel",
    parts: [
      { id: "pedals", name: "Pedals", mass: 0.32, icon: "block" },
      { id: "cranks", name: "Cranks", mass: 0.62, icon: "rod" },
      { id: "chainring", name: "Chainring", mass: 0.18, icon: "ring" },
      { id: "chain", name: "Chain", mass: 0.26, icon: "chain" },
      { id: "cassette", name: "Cassette", mass: 0.24, icon: "ring" },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
    detail: {
      name: "Chain",
      pieces: [
        { name: "outer plates", icon: "disc" },
        { name: "inner plates", icon: "disc" },
        { name: "pins", icon: "rod" },
        { name: "rollers", icon: "torus" },
        { name: "bushings", icon: "ring" },
      ],
      note: "A 116-link chain holds over 500 separate pieces, and every one of them can wear out.",
    },
  },
  {
    id: "braking", name: "Braking", colorKey: "force",
    job: "turns the bicycle's motion into heat and slows it down",
    parts: [
      { id: "levers", name: "Levers", mass: 0.22, icon: "bar" },
      { id: "cables", name: "Cables", mass: 0.09, icon: "rod" },
      { id: "calipers", name: "Calipers", mass: 0.32, icon: "block" },
      { id: "pads", name: "Pads", mass: 0.03, icon: "disc" },
    ],
    links: [[0, 1], [1, 2], [2, 3]],
    detail: {
      name: "Caliper",
      pieces: [
        { name: "arms", icon: "bar" },
        { name: "pivot bolt", icon: "rod" },
        { name: "return spring", icon: "coil" },
        { name: "pad holders", icon: "block" },
      ],
      note: "Squeeze the lever and the pads rub the rim. The kinetic energy leaves as heat, not as nothing.",
    },
  },
  {
    id: "wheels", name: "Wheels", colorKey: "velocity",
    job: "carries the load and rolls it along the road",
    parts: [
      { id: "hubs", name: "Hubs", mass: 0.42, icon: "block" },
      { id: "spokes", name: "Spokes", mass: 0.28, icon: "rod" },
      { id: "rims", name: "Rims", mass: 0.90, icon: "ring" },
      { id: "tubes", name: "Inner tubes", mass: 0.19, icon: "torus" },
      { id: "tyres", name: "Tyres", mass: 0.62, icon: "torus" },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
    detail: {
      name: "Hub",
      pieces: [
        { name: "axle", icon: "rod" },
        { name: "bearings", icon: "disc" },
        { name: "cones", icon: "ring" },
        { name: "shell", icon: "block" },
        { name: "freehub", icon: "ring" },
      ],
      note: "Each wheel hangs from its upper spokes. A 32-spoke wheel shares one rider between 32 wires.",
    },
  },
  {
    id: "steering", name: "Steering", colorKey: "momentum",
    job: "points the bicycle where the rider is looking",
    parts: [
      { id: "bars", name: "Handlebars", mass: 0.28, icon: "bar" },
      { id: "stem", name: "Stem", mass: 0.13, icon: "block" },
      { id: "fork", name: "Fork", mass: 0.42, icon: "fork" },
      { id: "headset", name: "Headset", mass: 0.09, icon: "ring" },
    ],
    links: [[0, 1], [1, 2], [3, 2]],
    detail: {
      name: "Headset",
      pieces: [
        { name: "upper cup", icon: "ring" },
        { name: "lower cup", icon: "ring" },
        { name: "bearings", icon: "disc" },
        { name: "crown race", icon: "ring" },
        { name: "compression ring", icon: "torus" },
      ],
      note: "Two rings of ball bearings let the fork turn freely while carrying the rider's weight.",
    },
  },
];

const ALL_PARTS = SUBSYSTEMS.flatMap((sub) => sub.parts);

function subsystemById(id: string): Subsystem {
  return SUBSYSTEMS.find((s) => s.id === id) ?? SUBSYSTEMS[0];
}

interface BuildState {
  fitted: string[];
  lastFitted: string;
  fitT: number;
  viewT: number;
  ride: number;
  wheel: number;
  rides: boolean;
  attempts: number;
  message: string;
}

const buildModel: SimModel<BuildState> = {
  init() {
    return {
      fitted: [], lastFitted: "", fitT: 0, viewT: 1, ride: 0, wheel: 0,
      rides: false, attempts: 0, message: "Click to fit the next part.",
    };
  },

  applyParams(state, params, prev) {
    if (params.view !== prev.view || params.subsystem !== prev.subsystem) {
      return { ...state, viewT: 0 };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const sub = subsystemById(params.subsystem as string);

    for (const input of inputs) {
      if (input.type !== "pointerdown") continue;
      const next = sub.parts.find((p) => !s.fitted.includes(p.id));
      if (next) {
        s = {
          ...s,
          fitted: [...s.fitted, next.id],
          lastFitted: next.id,
          fitT: 1,
          message: `${next.name} fitted.`,
        };
      } else {
        s = { ...s, message: `${sub.name} is complete. Choose another subsystem.` };
      }
    }

    if (dt <= 0) return s;

    const complete = ALL_PARTS.every((p) => s.fitted.includes(p.id));
    const testing = params.testRide as boolean;
    let ride = s.ride;
    let rides = s.rides;
    let attempts = s.attempts;
    let message = s.message;

    if (testing && complete) {
      rides = true;
      ride = Math.min(1, ride + dt * 0.5);
      message = "Rolling. Every subsystem is doing its job.";
    } else if (testing && !complete) {
      if (s.rides || s.ride > 0) { ride = 0; rides = false; }
      if (!s.rides && s.attempts === 0) attempts = 1;
      const missing = SUBSYSTEMS.find((sb) => sb.parts.some((p) => !s.fitted.includes(p.id)));
      rides = false;
      message = missing ? `It will not ride: ${missing.name.toLowerCase()} is unfinished.` : message;
    } else {
      ride = Math.max(0, ride - dt * 0.9);
      rides = false;
      attempts = 0;
    }

    return {
      ...s,
      fitT: Math.max(0, s.fitT - dt * 1.6),
      viewT: Math.min(1, s.viewT + dt * 2.4),
      wheel: s.wheel + dt * (rides ? 9 : 0.5),
      ride, rides, attempts, message,
    };
  },

  readouts(state) {
    const mass = FRAME_MASS + ALL_PARTS.reduce((m, p) => m + (state.fitted.includes(p.id) ? p.mass : 0), 0);
    const done = SUBSYSTEMS.filter((sb) => sb.parts.every((p) => state.fitted.includes(p.id))).length;
    return [
      { key: "fitted", label: "Parts fitted", quantity: q(state.fitted.length, "count"), semantic: "mass", graphable: true },
      { key: "subsystems", label: "Subsystems complete", quantity: q(done, "count"), semantic: "current", graphable: true },
      { key: "mass", label: "Mass of the build", quantity: q(mass, "mass"), unit: "kg", semantic: "mass", graphable: true },
      {
        key: "speed", label: "Test-ride speed", quantity: q(state.rides ? 5.5 * state.ride : 0, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8"],
      },
      { key: "levels", label: "Levels of nesting", quantity: q(4, "count"), semantic: "distance", graphable: false },
    ];
  },

  facts(state) {
    const done: Record<string, boolean> = {};
    for (const sb of SUBSYSTEMS) done[`${sb.id}Complete`] = sb.parts.every((p) => state.fitted.includes(p.id));
    return {
      ...done,
      fittedCount: state.fitted.length,
      totalParts: ALL_PARTS.length,
      complete: ALL_PARTS.every((p) => state.fitted.includes(p.id)),
      rides: state.rides,
      failedRide: state.attempts > 0 && !state.rides,
      mass: FRAME_MASS + ALL_PARTS.reduce((m, p) => m + (state.fitted.includes(p.id) ? p.mass : 0), 0),
    };
  },
};

/* ---------------- generic part icons ---------------- */

function partIcon(
  ctx: CanvasRenderingContext2D, kind: IconKind, r: number, color: string,
  theme: ThemeColors, t: number, lit: boolean,
) {
  const c = lit ? color : mixHex(color, theme.surface, 0.62);
  ctx.save();
  if (!lit) ctx.globalAlpha = 0.55;
  switch (kind) {
    case "ring": {
      ctx.rotate(t * 0.5);
      ctx.strokeStyle = mixHex(c, "#000000", 0.15);
      ctx.lineWidth = Math.max(2, r * 0.24);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = Math.max(1.2, r * 0.12);
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI) / 7;
        ctx.moveTo(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      break;
    }
    case "disc":
      sphere(ctx, 0, 0, r * 0.72, c);
      break;
    case "rod":
      metal(ctx, -r * 0.9, -r * 0.2, r * 1.8, r * 0.4, c, { radius: r * 0.2, angle: 90 });
      break;
    case "bar":
      ctx.strokeStyle = mixHex(c, "#ffffff", 0.1);
      ctx.lineWidth = Math.max(3, r * 0.3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.4);
      ctx.quadraticCurveTo(0, -r * 0.8, r * 0.9, r * 0.4);
      ctx.stroke();
      break;
    case "chain":
      dashFlow(ctx, [{ x: -r, y: r * 0.3 }, { x: 0, y: -r * 0.35 }, { x: r, y: r * 0.3 }], c, t * 26,
        { width: Math.max(2.4, r * 0.26), dash: 4, gap: 4, glow: 4 });
      break;
    case "block":
      material(ctx, -r * 0.72, -r * 0.56, r * 1.44, r * 1.12, c, r * 0.24);
      break;
    case "torus":
      ctx.strokeStyle = mixHex(c, "#000000", 0.2);
      ctx.lineWidth = Math.max(3, r * 0.38);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = hexA(mixHex(c, "#ffffff", 0.5), 0.6);
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
      break;
    case "fork":
      ctx.strokeStyle = mixHex(c, "#ffffff", 0.08);
      ctx.lineWidth = Math.max(3, r * 0.26);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(0, -r * 0.2);
      ctx.moveTo(0, -r * 0.2); ctx.quadraticCurveTo(-r * 0.6, r * 0.4, -r * 0.62, r);
      ctx.moveTo(0, -r * 0.2); ctx.quadraticCurveTo(r * 0.6, r * 0.4, r * 0.62, r);
      ctx.stroke();
      break;
    case "coil":
      ctx.strokeStyle = mixHex(c, "#ffffff", 0.15);
      ctx.lineWidth = Math.max(1.6, r * 0.16);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        const px = lerp(-r * 0.85, r * 0.85, f);
        const py = Math.sin(f * Math.PI * 6) * r * 0.42;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
  }
  ctx.restore();
}

/** The nesting ladder: four rungs, the current one lit. */
function nestingLadder(
  ctx: CanvasRenderingContext2D, x: number, y: number, theme: ThemeColors,
  rungs: { title: string; sub: string }[], active: number, t: number,
) {
  const rowH = 42, w = 186;
  panelCard(ctx, x, y, w, rungs.length * rowH + 26, theme, "NESTING LADDER");
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 34);
  ctx.lineTo(x + 22, y + 12 + rungs.length * rowH - 8);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < rungs.length; i++) {
    const ry = y + 34 + i * rowH;
    const on = i === active;
    if (on) glow(ctx, x + 22, ry, 20, theme.accent, 0.35 + 0.15 * pulse(t, 0.6));
    sphere(ctx, x + 22, ry, on ? 7 : 4.5, on ? theme.accent : mixHex(theme.inkSoft, theme.surface, 0.35));
    caption(ctx, x + 40, ry - 5, rungs[i].title, theme, {
      size: 11, color: on ? theme.ink : theme.inkSoft, weight: on ? 800 : 600,
    });
    caption(ctx, x + 40, ry + 9, rungs[i].sub, theme, { size: 10, color: theme.inkSoft, weight: 500 });
  }
}

/** The same three questions from A1.1, asked again at this level. */
function systemTestCard(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, theme: ThemeColors,
  parts: number, links: number, job: string, t: number,
) {
  const good = theme.sci["energy-kinetic"];
  const bad = theme.sci["force"];
  panelCard(ctx, x, y, w, 92, theme, "IS THIS LEVEL A SYSTEM?");
  const rows: [string, string, boolean][] = [
    ["parts", `${parts}`, parts >= 2],
    ["connections", `${links}`, links > 0],
    ["a job of its own", job ? "yes" : "no", job !== ""],
  ];
  for (let i = 0; i < rows.length; i++) {
    const ry = y + 36 + i * 19;
    lamp(ctx, x + 18, ry, 5, rows[i][2] ? good : bad, true, t + i * 0.3);
    caption(ctx, x + 32, ry, rows[i][0], theme, { size: 10.5, color: theme.ink });
    caption(ctx, x + w - 12, ry, rows[i][1], theme, {
      align: "right", size: 10.5, color: rows[i][2] ? good : bad, weight: 700,
    });
  }
}

/* ---------------- the bicycle, drawn from its subsystems ---------------- */

function drawBikeAssembly(
  ctx: CanvasRenderingContext2D, theme: ThemeColors, fitted: string[], t: number,
  wheelAngle: number, ghosts: boolean, focus: string,
) {
  const has = (id: string) => fitted.includes(id);
  const steel = theme.sci["mass"];
  const paint = theme.accent;
  const dimStroke = (color: string, on: boolean) => {
    ctx.strokeStyle = on ? color : hexA(color, 0.22);
    ctx.setLineDash(on || !ghosts ? [] : [5, 5]);
  };
  const rear = { x: -84, y: -58 }, front = { x: 84, y: -58 };

  // Wheels.
  for (const [i, wc] of [rear, front].entries()) {
    const rimOn = has("rims");
    ctx.save();
    ctx.lineCap = "round";
    if (has("tyres")) {
      ctx.strokeStyle = mixHex(steel, "#000000", 0.62);
      ctx.lineWidth = 9;
      ctx.setLineDash([]);
    } else {
      dimStroke(steel, false);
      ctx.lineWidth = 8;
    }
    ctx.beginPath(); ctx.arc(wc.x, wc.y, 52, 0, Math.PI * 2); ctx.stroke();
    dimStroke(mixHex(steel, "#ffffff", 0.4), rimOn);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(wc.x, wc.y, 45, 0, Math.PI * 2); ctx.stroke();
    dimStroke(steel, has("spokes"));
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = wheelAngle * (i === 0 ? 1 : 1) + (k * Math.PI * 2) / 16;
      ctx.moveTo(wc.x, wc.y);
      ctx.lineTo(wc.x + Math.cos(a) * 44, wc.y + Math.sin(a) * 44);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (has("hubs")) sphere(ctx, wc.x, wc.y, 7, mixHex(steel, "#ffffff", 0.2));
  }

  // Frame: always there, since the stand is holding it.
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(rear.x, rear.y); ctx.lineTo(-18, -128); ctx.lineTo(56, -128);
  ctx.lineTo(0, -58); ctx.lineTo(rear.x, rear.y);
  ctx.moveTo(-18, -128); ctx.lineTo(0, -58);
  ctx.strokeStyle = mixHex(paint, "#000000", 0.2);
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = hexA(mixHex(paint, "#ffffff", 0.72), 0.5);
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
  material(ctx, -34, -146, 30, 8, mixHex(steel, "#000000", 0.3), 4);
  ctx.save();
  ctx.strokeStyle = mixHex(paint, "#000000", 0.3);
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-19, -128); ctx.lineTo(-24, -142); ctx.stroke();
  ctx.restore();

  // Steering.
  ctx.save();
  ctx.lineCap = "round";
  dimStroke(mixHex(steel, "#ffffff", 0.1), has("fork"));
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(56, -128); ctx.lineTo(front.x, front.y); ctx.stroke();
  dimStroke(mixHex(steel, "#ffffff", 0.2), has("bars"));
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(56, -128); ctx.lineTo(52, -146);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  if (has("stem")) material(ctx, 48, -146, 20, 7, mixHex(steel, "#000000", 0.15), 3);
  if (has("bars")) {
    ctx.save();
    ctx.strokeStyle = mixHex(steel, "#ffffff", 0.2);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(44, -146); ctx.lineTo(74, -146); ctx.lineTo(80, -132);
    ctx.stroke();
    ctx.restore();
  }
  if (has("headset")) sphere(ctx, 56, -128, 5, theme.sci["momentum"]);

  // Drivetrain.
  if (has("chainring")) {
    ctx.save();
    ctx.translate(0, -58);
    partIcon(ctx, "ring", 22, theme.sci["current"], theme, wheelAngle * 0.5, true);
    ctx.restore();
  }
  if (has("cassette")) {
    ctx.save();
    ctx.translate(rear.x, rear.y);
    partIcon(ctx, "ring", 12, theme.sci["current"], theme, wheelAngle, true);
    ctx.restore();
  }
  if (has("chain")) {
    dashFlow(ctx, [{ x: 0, y: -80 }, { x: rear.x, y: -70 }], theme.sci["current"], t * 40,
      { width: 3, dash: 5, gap: 5, glow: 4 });
    dashFlow(ctx, [{ x: rear.x, y: -46 }, { x: 0, y: -36 }], theme.sci["current"], t * 40,
      { width: 3, dash: 5, gap: 5, glow: 4 });
  }
  if (has("cranks")) {
    ctx.save();
    ctx.strokeStyle = mixHex(steel, "#ffffff", 0.28);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const a = wheelAngle * 0.5;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * 26, -58 - Math.sin(a) * 26);
    ctx.lineTo(Math.cos(a) * 26, -58 + Math.sin(a) * 26);
    ctx.stroke();
    ctx.restore();
    if (has("pedals")) {
      const a2 = wheelAngle * 0.5;
      material(ctx, Math.cos(a2) * 26 - 9, -58 + Math.sin(a2) * 26 - 3, 18, 6, mixHex(steel, "#000000", 0.2), 2);
    }
  }

  // Braking.
  if (has("calipers")) {
    material(ctx, front.x - 8, -110, 16, 12, mixHex(theme.sci["force"], "#000000", 0.15), 3);
    material(ctx, rear.x - 8, -110, 16, 12, mixHex(theme.sci["force"], "#000000", 0.15), 3);
  }
  if (has("cables")) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["force"], 0.85);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(66, -148); ctx.quadraticCurveTo(90, -132, front.x, -110);
    ctx.moveTo(48, -146); ctx.quadraticCurveTo(-20, -160, rear.x, -110);
    ctx.stroke();
    ctx.restore();
  }
  if (has("levers")) {
    ctx.save();
    ctx.strokeStyle = mixHex(theme.sci["force"], "#000000", 0.1);
    ctx.lineWidth = 3.6;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(70, -146); ctx.lineTo(80, -138); ctx.stroke();
    ctx.restore();
  }
  if (has("pads")) {
    sphere(ctx, front.x, -104, 3.2, theme.sci["force"]);
    sphere(ctx, rear.x, -104, 3.2, theme.sci["force"]);
  }

  // A ring of light around whichever subsystem the student is working on.
  const focusAt: Record<string, [number, number, number]> = {
    drivetrain: [-30, -58, 74],
    braking: [front.x, -108, 40],
    wheels: [rear.x, -58, 62],
    steering: [58, -140, 44],
  };
  const fa = focusAt[focus];
  if (fa) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.35 + 0.25 * pulse(t, 0.55));
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.arc(fa[0], fa[1], fa[2], 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function renderBuild(rc: RenderContext<BuildState>) {
  const { ctx, state: s, params, theme, width: W, height: H, band, overlays, time: t } = rc;
  const view = params.view as string;
  const sub = subsystemById(params.subsystem as string);
  const steel = theme.sci["mass"];
  const dark = isDarkTheme(theme);
  const ease = easeInOut(clamp01(s.viewT));
  const has = (id: string) => s.fitted.includes(id);

  /* ---- the repair bay ---- */
  const floorY = Math.round(H * 0.78);
  sky(ctx, W, H, theme, "indoor", floorY);
  gradientFill(ctx, 0, 0, W, floorY, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.14 : 0.09),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.03 : 0.02),
  ], 90);
  // A strip light across the ceiling, and its pool on the floor.
  gradientFill(ctx, W * 0.18, 12, W * 0.64, 12, [
    hexA(theme.sci["light"], 0.1), hexA(theme.sci["light"], 0.85), hexA(theme.sci["light"], 0.1),
  ], 0);
  glow(ctx, W * 0.5, 18, Math.min(W * 0.6, 520), theme.sci["light"], 0.16);
  gradientFill(ctx, 0, floorY, W, H - floorY, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.2 : 0.12),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.34 : 0.2),
  ], 90);
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const f = i / 8;
    ctx.moveTo(lerp(W * 0.5, -W * 0.7, f), H);
    ctx.lineTo(lerp(W * 0.5, W * 0.1 + f * W * 0.8, f), floorY);
  }
  ctx.stroke();
  ctx.restore();
  noiseWash(ctx, 0, 0, W, H, { alpha: 0.045, seed: 33, count: 300, color: dark ? "#ffffff" : "#000000" });

  const cx = Math.round(W * 0.52);
  const cy = Math.round(H * 0.58);

  if (view === "world") {
    /* ---- the street the bicycle is one part of ---- */
    const roadY = Math.round(H * 0.7);
    for (let i = 0; i < 7; i++) {
      const bw = 60 + ((i * 37) % 70);
      const bh = 90 + ((i * 53) % 130);
      const bx = 20 + i * (W - 60) / 7;
      material(ctx, bx, roadY - 92 - bh, bw, bh, mixHex(theme.surfaceAlt, theme.ink, dark ? 0.24 : 0.16), 3);
      ctx.save();
      ctx.fillStyle = hexA(theme.sci["light"], 0.35 + 0.3 * pulse(t + i, 0.15));
      for (let wq = 0; wq < 8; wq++) {
        const wx = bx + 9 + (wq % 3) * 18;
        const wy = roadY - 92 - bh + 12 + Math.floor(wq / 3) * 22;
        if ((i + wq) % 3 !== 0) ctx.fillRect(wx, wy, 9, 12);
      }
      ctx.restore();
    }
    gradientFill(ctx, 0, roadY - 92, W, 92, [
      hexA(mixHex(theme.surfaceAlt, theme.ink, 0.06), 0), hexA(mixHex(theme.surfaceAlt, theme.ink, 0.1), 1),
    ], 90);
    material(ctx, 0, roadY, W, H - roadY, mixHex(steel, "#000000", 0.55), 0);
    dashFlow(ctx, [{ x: -20, y: roadY + 44 }, { x: W + 20, y: roadY + 44 }], hexA(theme.sci["light"], 1), t * 60,
      { width: 4, dash: 26, gap: 22, alpha: 0.8 });
    // A car, a traffic light, and the cyclist between them.
    const carX = ((t * 46) % (W + 320)) - 160;
    material(ctx, carX, roadY - 6, 118, 26, mixHex(theme.sci["velocity"], "#000000", 0.25), 6);
    material(ctx, carX + 24, roadY - 24, 62, 20, mixHex(theme.sci["velocity"], "#000000", 0.1), 5);
    sphere(ctx, carX + 24, roadY + 20, 9, mixHex(steel, "#000000", 0.5));
    sphere(ctx, carX + 92, roadY + 20, 9, mixHex(steel, "#000000", 0.5));
    const lightX = W - 96, lightY = roadY - 150;
    metal(ctx, lightX - 4, lightY, 8, 150, steel, { radius: 2 });
    material(ctx, lightX - 17, lightY - 74, 34, 78, mixHex(steel, "#000000", 0.45), 6);
    const phaseIdx = Math.floor((t / 4) % 3);
    for (let i = 0; i < 3; i++) {
      const col = i === 0 ? theme.sci["force"] : i === 1 ? theme.sci["light"] : theme.sci["energy-kinetic"];
      lamp(ctx, lightX, lightY - 58 + i * 24, 8, col, i === phaseIdx, t);
    }
    const bikeX = Math.round(W * 0.4);
    ctx.save();
    ctx.translate(bikeX, roadY + 24);
    ctx.scale(0.42, 0.42);
    drawBikeAssembly(ctx, theme, ALL_PARTS.map((p) => p.id), t, s.wheel, false, "");
    ctx.restore();
    // The rider, drawn simply so the eye reads a person, not a mannequin.
    ctx.save();
    ctx.translate(bikeX, roadY + 24);
    ctx.scale(0.42, 0.42);
    ctx.strokeStyle = mixHex(theme.sci["primary-consumer"], "#000000", 0.1);
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-6, -150); ctx.lineTo(20, -196); ctx.lineTo(56, -152);
    ctx.moveTo(20, -196); ctx.lineTo(-2, -110); ctx.lineTo(4, -58);
    ctx.stroke();
    ctx.restore();
    sphere(ctx, bikeX + 8, roadY - 66, 11, theme.sci["primary-consumer"]);

    if (overlays.links !== false) {
      arrow(ctx, lightX - 20, lightY - 34, bikeX + 60, roadY - 60, theme.sci["field"], { width: 1.8, dashed: true });
      arrow(ctx, bikeX + 4, roadY + 22, bikeX + 4, roadY + 2, theme.sci["force"], { width: 1.8 });
      arrow(ctx, bikeX + 8, roadY - 54, bikeX + 2, roadY - 20, theme.sci["current"], { width: 1.8 });
    }
    if (overlays.labels !== false) {
      labelLeader(ctx, lightX - 16, lightY - 34, W - 40, 140, "traffic signal", theme,
        { color: theme.sci["field"], size: 11, sub: "tells riders when to go", align: "left" });
      labelLeader(ctx, bikeX, roadY - 30, 252, 250, "the bicycle", theme,
        { color: theme.accent, size: 11, sub: "one part of the street", align: "left" });
      labelLeader(ctx, bikeX + 4, roadY + 22, 252, 302, "the road", theme,
        { color: theme.sci["force"], size: 11, sub: "pushes back on the tyres", align: "left" });
    }
    caption(ctx, W * 0.5, 44, "Zoom out and the whole machine is only a part", theme, {
      align: "center", size: 15, color: theme.ink, weight: 800,
    });
  } else if (view === "machine") {
    /* ---- the bicycle in the repair stand ---- */
    const k = Math.min(1.35, Math.min(W / 470, H / 380)) * lerp(0.94, 1, ease);
    const standY = cy + 92 * k;
    metal(ctx, cx + 96 * k - 7, cy - 40 * k, 14, standY - cy + 40 * k, steel, { radius: 4 });
    ctx.save();
    ctx.strokeStyle = mixHex(steel, "#000000", 0.3);
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 96 * k, standY); ctx.lineTo(cx + 40 * k, standY + 28);
    ctx.moveTo(cx + 96 * k, standY); ctx.lineTo(cx + 152 * k, standY + 28);
    ctx.stroke();
    ctx.restore();
    spriteShadowEllipse(ctx, cx + 20 * k, standY + 34, 190 * k, 16 * k, { alpha: 0.3 });

    ctx.save();
    ctx.globalAlpha = lerp(0.4, 1, ease);
    ctx.translate(cx + (s.rides ? Math.sin(t * 2) * 3 : 0), cy);
    ctx.scale(k, k);
    drawBikeAssembly(ctx, theme, s.fitted, t, s.wheel, overlays.ghosts !== false, sub.id);
    ctx.restore();

    // A clamp holding the seat tube: it is a stand, not a floating drawing.
    metal(ctx, cx + 62 * k, cy - 74 * k, 40 * k, 14, mixHex(steel, "#ffffff", 0.1), { radius: 4 });

    // Live count badges beside each subsystem.
    const spots: Record<string, [number, number]> = {
      drivetrain: [cx - 30 * k, cy + 18 * k],
      braking: [cx + 84 * k, cy - 128 * k],
      wheels: [cx - 84 * k, cy - 128 * k],
      steering: [cx + 58 * k, cy - 186 * k],
    };
    for (const sb of SUBSYSTEMS) {
      const done = sb.parts.filter((p) => has(p.id)).length;
      const spot = spots[sb.id];
      if (!spot) continue;
      badge(ctx, spot[0], spot[1], `${done}/${sb.parts.length}`, theme, {
        align: "center", color: theme.sci[sb.colorKey], sub: sb.name.toLowerCase(),
      });
    }

    if (s.rides) {
      caption(ctx, cx, Math.max(54, cy - 182 * k), `rolling at ${num(5.5 * s.ride, 1)} m/s`, theme, {
        align: "center", size: 14, color: theme.sci["velocity"], weight: 800,
      });
      for (let i = 0; i < 5; i++) {
        const f = ((t * 1.4 + i * 0.2) % 1);
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - f);
        arrow(ctx, cx - 148 * k - f * 30, cy - 40 * k + i * 12, cx - 182 * k - f * 30, cy - 40 * k + i * 12,
          theme.sci["velocity"], { width: 2 });
        ctx.restore();
      }
    }
  } else if (view === "subsystem") {
    /* ---- one subsystem, laid out on the bench ---- */
    const color = theme.sci[sub.colorKey];
    const n = sub.parts.length;
    const trayW = Math.max(62, Math.min(126, (W - 330) / n));
    const startX = cx - ((n - 1) * (trayW + 16)) / 2;
    const trayY = cy + 10;
    material(ctx, 30, trayY + 62, W - 60, 16, mixHex(theme.sci["decomposer"], "#000000", 0.3), 4);
    caption(ctx, cx, cy - 150, sub.name, theme, { align: "center", size: 20, color: theme.ink, weight: 800 });
    caption(ctx, cx, cy - 126, sub.job, theme, { align: "center", size: 12.5, color: theme.inkSoft });

    // Interaction arrows first, so the parts sit on top of them.
    if (overlays.links !== false) {
      for (const [a, b] of sub.links) {
        const ax = startX + a * (trayW + 16), bx = startX + b * (trayW + 16);
        const lit = has(sub.parts[a].id) && has(sub.parts[b].id);
        ctx.save();
        ctx.globalAlpha = lit ? 0.55 + 0.4 * pulse(t + a * 0.3, 0.5) : 0.2;
        arrow(ctx, ax + trayW * 0.34, trayY - 6, bx - trayW * 0.34, trayY - 6, color, { width: 2.2, head: 9 });
        ctx.restore();
      }
    }
    for (let i = 0; i < n; i++) {
      const p = sub.parts[i];
      const x = startX + i * (trayW + 16);
      const on = has(p.id);
      const pop = p.id === s.lastFitted ? spring(clamp01(1 - s.fitT)) : 1;
      softShadow(ctx, () => {
        bevelRect(ctx, x - trayW / 2, trayY - 44, trayW, 88, 10,
          mixHex(theme.surfaceAlt, theme.ink, dark ? 0.08 : 0.05), { depth: on ? 1 : -1 });
      }, { blur: 12, dy: 4, alpha: 0.22 });
      if (on) {
        rimLight(ctx, (c2) => roundRect(c2, x - trayW / 2 + 0.5, trayY - 43.5, trayW - 1, 87, 10), color,
          { width: 1.4, alpha: 0.75, bounds: { x: x - trayW / 2, y: trayY - 44, w: trayW, h: 88 } });
      } else {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
        ctx.lineWidth = 1.2;
        roundRect(ctx, x - trayW / 2 + 2, trayY - 42, trayW - 4, 84, 9);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(x, trayY - 12);
      ctx.scale(pop, pop);
      partIcon(ctx, p.icon, 24, color, theme, t, on);
      ctx.restore();
      caption(ctx, x, trayY + 22, p.name, theme, {
        align: "center", size: 11, color: on ? theme.ink : theme.inkSoft, weight: 700,
      });
      if (band !== "3-5") {
        caption(ctx, x, trayY + 38, `${num(p.mass, 2)} kg`, theme, {
          align: "center", size: 10, color: theme.inkSoft, weight: 500,
        });
      }
    }
    systemTestCard(ctx, W - 236, H - 120, 218, theme, n, sub.links.length, sub.job, t);
  } else {
    /* ---- one part, opened up ---- */
    const color = theme.sci[sub.colorKey];
    const det = sub.detail;
    const pieces = det.pieces;
    caption(ctx, cx, cy - 172, det.name, theme, { align: "center", size: 20, color: theme.ink, weight: 800 });
    caption(ctx, cx, cy - 148, `one part of the ${sub.name.toLowerCase()} subsystem`, theme, {
      align: "center", size: 12, color: theme.inkSoft,
    });
    const rr = Math.min(120, H * 0.2);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(cx, cy - 20, rr + 34, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.lineDashOffset = -t * 12;
    ctx.stroke();
    ctx.restore();
    glow(ctx, cx, cy - 20, rr + 40, color, 0.13);
    for (let i = 0; i < pieces.length; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / pieces.length;
      const burst = lerp(0.55, 1, ease) * (1 + 0.03 * pulse(t + i * 0.4, 0.35));
      const px = cx + Math.cos(a) * rr * burst;
      const py = cy - 20 + Math.sin(a) * rr * burst * 0.78;
      spriteShadowEllipse(ctx, px, py + 26, 26, 7, { alpha: 0.22 });
      ctx.save();
      ctx.translate(px, py);
      partIcon(ctx, pieces[i].icon, 22, color, theme, t + i, true);
      ctx.restore();
      if (overlays.labels !== false) {
        const toRight = px >= cx;
        labelLeader(ctx, px, py, toRight ? Math.min(W - 260, px + 54) : Math.max(268, px - 54), py,
          pieces[i].name, theme, { color, size: 11, align: toRight ? "right" : "left" });
      }
    }
    ctx.save();
    ctx.translate(cx, cy - 20);
    partIcon(ctx, sub.parts.find((p) => p.name === det.name)?.icon ?? "block", 34, color, theme, t, true);
    ctx.restore();
    wrapCaption(ctx, det.note, cx, H - 46, Math.max(220, Math.min(W - 560, 470)), theme, 11.5);
    systemTestCard(ctx, W - 236, 150, 218, theme, pieces.length, pieces.length - 1,
      `holds the ${sub.name.toLowerCase()} together`, t);
  }

  /* ---- the nesting ladder, always ---- */
  const levelIndex = view === "world" ? 0 : view === "machine" ? 1 : view === "subsystem" ? 2 : 3;
  nestingLadder(ctx, 18, 16, theme, [
    { title: "The street", sub: "traffic system" },
    { title: "The bicycle", sub: "one machine" },
    { title: sub.name, sub: "a subsystem" },
    { title: sub.detail.name, sub: "one part" },
  ], levelIndex, t);

  /* ---- build console ---- */
  const mass = FRAME_MASS + ALL_PARTS.reduce((m, p) => m + (has(p.id) ? p.mass : 0), 0);
  const doneCount = SUBSYSTEMS.filter((sb) => sb.parts.every((p) => has(p.id))).length;
  panelCard(ctx, 18, H - 108, 232, 90, theme, "BUILD");
  caption(ctx, 30, H - 76, `${s.fitted.length} of ${ALL_PARTS.length} parts fitted`, theme,
    { size: 12.5, color: theme.ink, weight: 700 });
  caption(ctx, 30, H - 58, `${doneCount} of 4 subsystems complete`, theme, { size: 11.5, color: theme.inkSoft });
  badge(ctx, 226, H - 40, `${num(mass, 2)} kg`, theme, { align: "right", color: theme.sci["mass"], sub: "mass" });

  if (view !== "world") {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.3 * pulse(t, 0.5);
    caption(ctx, cx, H - 26, s.message, theme, {
      align: "center", size: 12.5, color: s.rides ? theme.sci["energy-kinetic"] : theme.accent, weight: 700,
    });
    ctx.restore();
  }

  vignette(ctx, W, H, 0.2);
}

export const g6a1NestedMachine: SimManifest<BuildState> = {
  id: "g6a1-nested-machine",
  title: "Build the Machine",
  tagline: "Fit parts into subsystems, subsystems into a bicycle, and the bicycle into a street.",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [4, 5, 6, 7],
  standards: { ngss: ["MS-ETS1-1", "MS-LS1-3"] },
  learningGoals: [
    "Describe a system as a set of subsystems, each of which is a system in its own right.",
    "Explain that the same object is a whole at one level and a part at the level above.",
    "Show that a machine only does its job when every subsystem is complete.",
  ],
  misconceptions: [
    "A subsystem is just a smaller, less important piece",
    "Something is either a system or a part, never both",
    "A system has only one level of parts",
    "A machine with most of its parts will still mostly work",
  ],
  interactionHint: "Pick a subsystem, then click the stage to fit its next part.",
  params: {
    view: {
      type: "option", label: "Zoom level",
      options: [
        { value: "world", label: "The street" },
        { value: "machine", label: "The bicycle" },
        { value: "subsystem", label: "One subsystem" },
        { value: "part", label: "Inside one part" },
      ],
      default: "machine",
      help: "Every step down the list is one level deeper into the same machine.",
    },
    subsystem: {
      type: "option", label: "Subsystem",
      options: SUBSYSTEMS.map((s) => ({ value: s.id, label: s.name })),
      default: "drivetrain",
    },
    testRide: {
      type: "boolean", label: "Try to ride it", default: false,
      help: "A bicycle only rolls when every one of its subsystems is finished.",
    },
  },
  overlays: [
    { key: "ghosts", label: "Show missing parts", default: true },
    { key: "links", label: "Interaction arrows", default: true },
    { key: "labels", label: "Labels", default: true },
  ],
  model: buildModel,
  render: renderBuild,
  labs: [
    {
      id: "subsystem-is-a-system",
      title: "Is a subsystem a system?",
      question: "The drivetrain is a part of a bicycle. Is it also a system of its own?",
      bands: ["3-5", "6-8"],
      minutes: 20,
      setup: { view: "machine", subsystem: "drivetrain", testRide: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Decide first",
          instruction: "The drivetrain is the pedals, cranks, chainring, chain and cassette.",
          predict: {
            prompt: "Is the drivetrain a system, a part, or both?",
            options: ["Only a part of the bicycle", "Only a system of its own", "Both at once"],
            correct: 2,
            reveal:
              "It is both. Looked at from above it is one part of a bicycle; looked at from inside it is five "
              + "parts acting on each other to do a job. That double life is what nesting means.",
          },
        },
        {
          id: "build",
          phase: "setup",
          title: "Fit the drivetrain",
          instruction: "Click the stage until all five drivetrain parts are fitted.",
          check: {
            describe: "Drivetrain complete",
            test: (v) => v.facts.drivetrainComplete === true,
          },
          hints: ["Each click fits the next part of whichever subsystem is selected."],
        },
        {
          id: "zoom",
          phase: "measure",
          title: "Zoom into it",
          instruction: "Set the zoom level to One subsystem and read the three tests in the corner.",
          check: {
            describe: "Zoom level is One subsystem",
            test: (v) => v.params.view === "subsystem",
          },
        },
        {
          id: "deeper",
          phase: "measure",
          title: "Go one level deeper",
          instruction: "Now open the chain itself. Record the build mass at each of two zoom levels.",
          requireData: 2,
          check: {
            describe: "Zoom level is Inside one part",
            test: (v) => v.params.view === "part",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the ladder down",
          instruction: "List the four levels you have just walked through, from widest to narrowest.",
          write: {
            prompt: "Write the four levels, and say what the chain is a part of and what it is made of.",
            placeholder: "Street, ... , ... , ... . The chain is part of ... and is made of ...",
          },
        },
      ],
    },
    {
      id: "missing-subsystem",
      title: "One subsystem short",
      question: "How much of a bicycle do you need before it will carry a rider?",
      bands: ["6-8"],
      minutes: 20,
      setup: { view: "machine", subsystem: "drivetrain", testRide: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the outcome",
          instruction: "Imagine a bicycle with a perfect drivetrain, brakes and steering, but no wheels.",
          predict: {
            prompt: "How well will three complete subsystems out of four carry a rider?",
            options: ["About three quarters as well", "A little worse than usual", "Not at all"],
            correct: 2,
            reveal:
              "Systems are not scored out of four. Every subsystem has to do its job, so missing one usually "
              + "means the whole job fails, not that it half-works.",
          },
        },
        {
          id: "three-of-four",
          phase: "setup",
          title: "Build three subsystems",
          instruction: "Complete the drivetrain, braking and steering, and leave the wheels alone.",
          check: {
            describe: "Three subsystems complete, wheels unfinished",
            test: (v) => v.facts.drivetrainComplete === true && v.facts.brakingComplete === true
              && v.facts.steeringComplete === true && v.facts.wheelsComplete === false,
          },
        },
        {
          id: "test",
          phase: "measure",
          title: "Try to ride it",
          instruction: "Switch on Try to ride it and read what the bay tells you.",
          check: { describe: "Test ride attempted", test: (v) => v.params.testRide === true },
        },
        {
          id: "finish",
          phase: "measure",
          title: "Finish the wheels",
          instruction: "Fit the last subsystem and watch the machine come alive. Record the mass.",
          requireData: 1,
          check: { describe: "The bicycle rides", test: (v) => v.facts.rides === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the jump",
          instruction: "The last part changed the machine from useless to useful.",
          write: {
            prompt: "Why did fitting one more part change the whole machine's behaviour so suddenly?",
            placeholder: "The bicycle could not do its job until ... because every subsystem ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "roadworthy",
      title: "Roadworthy",
      brief: "Assemble a complete bicycle and take it for a test ride.",
      bands: ["3-5", "6-8"],
      setup: { view: "machine", subsystem: "drivetrain", testRide: false },
      goal: { describe: "All 18 parts fitted", test: (v) => v.facts.complete === true },
      stars: {
        two: { describe: "The bicycle rides", test: (v) => v.facts.rides === true },
        three: {
          describe: "It rides and weighs under 8.1 kg",
          test: (v) => v.facts.rides === true && (v.facts.mass as number) < 8.1,
        },
      },
      hints: [
        "Switch subsystems with the control; each click fits the next part of the one you have chosen.",
        "Turn on Try to ride it only when all four subsystems are showing complete.",
      ],
    },
    {
      id: "three-quarters",
      title: "Three quarters of a bicycle",
      brief: "Prove that three complete subsystems still carry nobody.",
      bands: ["6-8"],
      setup: { view: "machine", subsystem: "drivetrain", testRide: false },
      goal: {
        describe: "Three subsystems complete, wheels unfinished, test ride failing",
        test: (v) => v.facts.drivetrainComplete === true && v.facts.brakingComplete === true
          && v.facts.steeringComplete === true && v.facts.wheelsComplete === false
          && v.params.testRide === true && v.facts.rides === false,
      },
      hints: ["Leave the wheels subsystem completely untouched, then switch on the test ride."],
    },
  ],
};

/* ================================================================== *
 * A1.3 — Life Support: interactions among a system's parts
 *
 * A classroom aquarium in its cabinet. Switch one component off and
 * watch the consequences travel around the loop for hours. Every
 * number here comes from real aquarium physics: 100 L of water, a
 * 300 W heater, oxygen saturation from the standard temperature
 * formula, and nitrifying bacteria with saturating kinetics.
 * ================================================================== */

const TANK_VOLUME = 100;          // litres
const TANK_MASS = 100;            // kg of water
const WATER_C = 4186;             // J per kg per K
const HEATER_W = 300;             // watts
const LOSS_W_PER_K = 25;          // watts lost per kelvin above the room
const SETPOINT_K = 298.15;        // 25 degrees C

/** Oxygen saturation in mg/L for fresh water at 1 atm, standard fit. */
function oxygenSaturation(celsius: number): number {
  const c = Math.max(0, Math.min(40, celsius));
  return 14.652 - 0.41022 * c + 0.0079910 * c * c - 0.000077774 * c * c * c;
}

/** Biological rates roughly double for every 10 K, the usual Q10 of 2. */
function q10(kelvin: number): number {
  return Math.pow(2, (kelvin - SETPOINT_K) / 10);
}

interface FishAgent { x: number; y: number; vx: number; vy: number; ph: number; kind: number }
interface Bubble { x: number; y: number; v: number; r: number }

interface TankState {
  t: number;            // seconds of aquarium time
  T: number;            // water temperature, K
  heaterOn: boolean;
  o2: number;           // mg per litre
  nh: number;           // total ammonia, mg per litre
  comfort: number;      // 0-1, set by the worst of the three conditions
  limiter: string;
  minO2: number;
  maxNH: number;
  minComfort: number;
  lightOn: boolean;
  fish: FishAgent[];
  bubbles: Bubble[];
}

function makeFish(n: number, pick: () => number): FishAgent[] {
  const out: FishAgent[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: 0.15 + pick() * 0.7,
      y: 0.25 + pick() * 0.5,
      vx: (pick() - 0.5) * 0.06,
      vy: (pick() - 0.5) * 0.02,
      ph: pick() * 6.28,
      kind: i % 3,
    });
  }
  return out;
}

const tankModel: SimModel<TankState> = {
  init(params, ctx) {
    return {
      t: 0,
      T: SETPOINT_K,
      heaterOn: false,
      o2: oxygenSaturation(SETPOINT_K - 273.15),
      nh: 0.05,
      comfort: 1,
      limiter: "nothing",
      minO2: 99,
      maxNH: 0,
      minComfort: 1,
      lightOn: true,
      fish: makeFish(Math.round(params.fish as number), () => ctx.rng.next()),
      bubbles: [],
    };
  },

  applyParams(state, params, prev, ctx) {
    if (params.fish !== prev.fish) {
      const want = Math.round(params.fish as number);
      let fish = state.fish;
      if (want < fish.length) fish = fish.slice(0, want);
      else if (want > fish.length) {
        fish = [...fish, ...makeFish(want - fish.length, () => ctx.rng.next())];
      }
      return { ...state, fish };
    }
    return state;
  },

  step(state, dt, params, ctx, _inputs) {
    if (dt <= 0) return state;
    const broken = params.broken as string;
    const room = params.roomTemp as number;
    const feedKg = params.feed as number;
    const feedG = feedKg * 1000;
    const nFish = state.fish.length;

    const t = state.t + dt;
    const hourOfDay = (t / 3600) % 24;
    const timerOn = params.dayNight as boolean;
    const lightWorks = broken !== "light";
    const lightOn = lightWorks && (timerOn ? hourOfDay >= 8 && hourOfDay < 16 : true);
    const plantsAlive = broken !== "plants";
    const pumpOn = broken !== "pump";
    const bacteriaAlive = broken !== "bacteria";

    /* --- temperature: a 300 W heater against 25 W/K of losses --- */
    const thermostatWorks = broken !== "thermostat";
    const heaterWorks = broken !== "heater";
    let heaterOn = state.heaterOn;
    if (!heaterWorks) heaterOn = false;
    else if (!thermostatWorks) heaterOn = true;
    else if (state.T < SETPOINT_K - 0.3) heaterOn = true;
    else if (state.T > SETPOINT_K + 0.3) heaterOn = false;
    const power = heaterOn ? HEATER_W : 0;
    const loss = LOSS_W_PER_K * (state.T - room);
    let T = state.T + ((power - loss) * dt) / (TANK_MASS * WATER_C);
    T = Math.max(275, Math.min(320, T));
    const celsius = T - 273.15;
    const rate = q10(T);

    /* --- dissolved oxygen --- */
    const dtH = dt / 3600;
    const sat = oxygenSaturation(celsius);
    const ka = pumpOn ? 0.9 : 0.18;                       // per hour
    const photo = plantsAlive ? (lightOn ? 0.9 : -0.2) : 0;
    const fishUse = nFish * 0.09 * rate;
    const bactUse = bacteriaAlive && pumpOn ? 0.1 * rate : 0.02;
    let o2 = state.o2 + (ka * (sat - state.o2) + photo - fishUse - bactUse) * dtH;
    o2 = Math.max(0, Math.min(16, o2));

    /* --- ammonia: fish and food in, nitrifying bacteria out --- */
    const produced = (nFish * 0.012 + feedG * 0.02) * rate;
    const oxygenOk = o2 > 2 ? 1 : 0.2;
    const vmax = bacteriaAlive ? 0.3 * rate * oxygenOk * (pumpOn ? 1 : 0.25) : 0;
    const removed = (vmax * state.nh) / (0.1 + state.nh);
    let nh = state.nh + (produced - removed) * dtH;
    nh = Math.max(0, Math.min(12, nh));

    /* --- comfort is set by the worst condition, not the average --- */
    const fT = clamp01(1 - Math.abs(celsius - 25) / 7);
    const fO = clamp01((o2 - 2.5) / 3.5);
    const fA = clamp01(1 - (nh - 0.15) / 1.0);
    const comfort = Math.min(fT, fO, fA);
    const limiter = comfort === fO && fO <= fT && fO <= fA ? "oxygen"
      : comfort === fA && fA <= fT ? "ammonia"
        : comfort === fT && fT < 0.999 ? "temperature" : "nothing";

    /* --- the fish themselves --- */
    const gasping = o2 < 4;
    const sick = nh > 0.8;
    const swim = 0.55 + comfort * 0.8;
    const fish = state.fish.map((f) => {
      const targetY = gasping ? 0.9 : sick ? 0.14 : 0.3 + 0.4 * ((f.ph % 1));
      let vx = f.vx + (ctx.rng.next() - 0.5) * 0.02 * swim;
      let vy = f.vy + (targetY - f.y) * 0.02 + (ctx.rng.next() - 0.5) * 0.006;
      vx = Math.max(-0.09, Math.min(0.09, vx)) * (0.92 + 0.06 * swim);
      vy = Math.max(-0.05, Math.min(0.05, vy));
      let x = f.x + vx * dt * 0.02 * swim;
      let y = f.y + vy * dt * 0.02;
      if (x < 0.07) { x = 0.07; vx = Math.abs(vx); }
      if (x > 0.93) { x = 0.93; vx = -Math.abs(vx); }
      y = Math.max(0.08, Math.min(0.94, y));
      return { ...f, x, y, vx, vy };
    });

    /* --- bubbles from the filter outflow --- */
    let bubbles = state.bubbles
      .map((b) => ({ ...b, y: b.y + b.v * dt * 0.01, x: b.x + Math.sin(b.y * 18 + b.r) * 0.0015 }))
      .filter((b) => b.y < 0.98);
    if (pumpOn && bubbles.length < 34 && ctx.rng.chance(Math.min(1, dt * 0.6))) {
      bubbles = [...bubbles, { x: 0.86 + ctx.rng.next() * 0.06, y: 0.1, v: 1.4 + ctx.rng.next() * 1.4, r: 1 + ctx.rng.next() * 1.6 }];
    }

    return {
      t, T, heaterOn, o2, nh, comfort, limiter, lightOn, fish, bubbles,
      minO2: Math.min(state.minO2, o2),
      maxNH: Math.max(state.maxNH, nh),
      minComfort: Math.min(state.minComfort, comfort),
    };
  },

  readouts(state) {
    return [
      {
        key: "temp", label: "Water temperature", quantity: q(state.T, "temperature"), unit: "°C",
        semantic: "energy-thermal", graphable: true,
      },
      {
        key: "oxygen", label: "Dissolved oxygen (mg/L)", quantity: q(state.o2, "ratio"),
        semantic: "gas", graphable: true,
      },
      {
        key: "ammonia", label: "Ammonia (mg/L)", quantity: q(state.nh, "ratio"),
        semantic: "acid", graphable: true,
      },
      {
        key: "comfort", label: "Fish comfort", quantity: q(state.comfort, "percent"), unit: "%",
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "hours", label: "Time in the tank", quantity: q(state.t, "time"), unit: "h",
        semantic: "time", graphable: false,
      },
      {
        key: "saturation", label: "Oxygen the water can hold (mg/L)",
        quantity: q(oxygenSaturation(state.T - 273.15), "ratio"),
        semantic: "gas", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    return {
      broken: params.broken as string,
      celsius: state.T - 273.15,
      oxygen: state.o2,
      ammonia: state.nh,
      comfort: state.comfort,
      limiter: state.limiter,
      hours: state.t / 3600,
      minOxygen: state.minO2,
      maxAmmonia: state.maxNH,
      minComfort: state.minComfort,
      heaterOn: state.heaterOn,
      lightOn: state.lightOn,
      fishCount: state.fish.length,
    };
  },
};

/* ---------------- the cabinet ---------------- */

const TANK_BUBBLES: Particle[] = [];

function drawFish(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string,
  heading: number, wag: number, dim: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(heading >= 0 ? 1 : -1, 1);
  ctx.globalAlpha = dim;
  // Tail first, so the body overlaps it.
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, 0);
  ctx.lineTo(-size * 1.5, -size * 0.55 + wag * size * 0.4);
  ctx.lineTo(-size * 1.5, size * 0.55 + wag * size * 0.4);
  ctx.closePath();
  ctx.fillStyle = mixHex(color, "#000000", 0.25);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -size * 0.7, 0, size * 0.7);
  g.addColorStop(0, mixHex(color, "#ffffff", 0.5));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mixHex(color, "#000000", 0.35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA(color, 0.55);
  ctx.beginPath();
  ctx.ellipse(-size * 0.1, size * 0.25, size * 0.4, size * 0.3, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(size * 0.52, -size * 0.12, size * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.beginPath(); ctx.arc(size * 0.56, -size * 0.12, size * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function renderTank(rc: RenderContext<TankState>) {
  const { ctx, state: s, params, theme, width: W, height: H, band, overlays, time: t } = rc;
  const dark = isDarkTheme(theme);
  const broken = params.broken as string;
  const water = theme.sci["liquid"];
  const leaf = theme.sci["producer"];
  const hot = theme.sci["hot"];
  const cold = theme.sci["cold"];
  const gas = theme.sci["gas"];
  const acid = theme.sci["acid"];
  const steel = theme.sci["mass"];
  const wood = theme.sci["decomposer"];
  const good = theme.sci["energy-kinetic"];
  const celsius = s.T - 273.15;

  /* ---- the room and the cabinet ---- */
  const consoleW = Math.min(268, W * 0.3);
  const tankX = 26;
  const tankW = Math.max(220, W - consoleW - 66);
  const tankY = Math.round(H * 0.15);
  const tankH = Math.round(H * 0.5);
  const standY = tankY + tankH + 14;

  sky(ctx, W, H, theme, "indoor");
  gradientFill(ctx, 0, 0, W, H, [
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.15 : 0.08),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.05 : 0.02),
    mixHex(theme.surfaceAlt, theme.ink, dark ? 0.22 : 0.12),
  ], 90);
  noiseWash(ctx, 0, 0, W, H, { alpha: 0.04, seed: 5, count: 280, color: dark ? "#ffffff" : "#000000" });
  material(ctx, tankX - 16, standY, tankW + 32, H - standY - 8, mixHex(wood, "#000000", 0.25), 4);
  ctx.save();
  ctx.strokeStyle = hexA(mixHex(wood, "#000000", 0.5), 0.9);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tankX - 16, standY + 16); ctx.lineTo(tankX + tankW + 16, standY + 16);
  ctx.moveTo(tankX + tankW * 0.5, standY + 16); ctx.lineTo(tankX + tankW * 0.5, H - 8);
  ctx.stroke();
  ctx.restore();

  /* ---- the light bar over the tank ---- */
  const litNow = s.lightOn;
  metal(ctx, tankX + 10, tankY - 26, tankW - 20, 14, steel, { radius: 4 });
  if (litNow) {
    gradientFill(ctx, tankX + 14, tankY - 13, tankW - 28, 8, [
      hexA(theme.sci["light"], 0.2), hexA(theme.sci["light"], 0.95), hexA(theme.sci["light"], 0.2),
    ], 0);
    glow(ctx, tankX + tankW / 2, tankY - 10, tankW * 0.55, theme.sci["light"], 0.2);
  } else {
    material(ctx, tankX + 14, tankY - 13, tankW - 28, 8, mixHex(steel, "#000000", 0.4), 2);
  }

  /* ---- the water ---- */
  const waterTop = tankY + 16;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, tankX, tankY, tankW, tankH, 6);
  ctx.clip();
  gradientFill(ctx, tankX, waterTop, tankW, tankH - 16, [
    { at: 0, color: hexA(mixHex(water, "#ffffff", litNow ? 0.35 : 0.05), 0.95) },
    { at: 0.6, color: hexA(water, 0.9) },
    { at: 1, color: hexA(mixHex(water, "#000000", 0.45), 0.95) },
  ], 90);
  // Light shafts, only while the lamp is on.
  if (litNow) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = theme.sci["light"];
    for (let i = 0; i < 6; i++) {
      const bx = tankX + 30 + i * (tankW - 60) / 5 + Math.sin(t * 0.4 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(bx - 8, waterTop);
      ctx.lineTo(bx + 8, waterTop);
      ctx.lineTo(bx + 36, tankY + tankH);
      ctx.lineTo(bx + 4, tankY + tankH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // The gravel bed.
  const gravelY = tankY + tankH - 26;
  gradientFill(ctx, tankX, gravelY, tankW, 30, [
    mixHex(wood, "#ffffff", 0.15), mixHex(wood, "#000000", 0.4),
  ], 90);
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const gx = tankX + ((i * 137) % (tankW - 8)) + 4;
    const gy = gravelY + 2 + ((i * 53) % 20);
    ctx.fillStyle = hexA(mixHex(wood, i % 2 ? "#ffffff" : "#000000", 0.3), 0.7);
    ctx.beginPath(); ctx.ellipse(gx, gy, 3.4, 2.2, i, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Plants: living stems that sway, or a dashed gap where they were.
  const plantsAlive = broken !== "plants";
  for (let i = 0; i < 5; i++) {
    const px = tankX + 26 + i * 26;
    const hgt = 70 + (i % 3) * 26;
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k <= 8; k++) {
      const f = k / 8;
      pts.push({
        x: px + Math.sin(t * 0.8 + i + f * 2.4) * 7 * f,
        y: gravelY + 4 - f * hgt,
      });
    }
    if (plantsAlive) {
      ribbon(ctx, pts, 9, hexA(mixHex(leaf, "#000000", 0.2), 0.95), hexA(mixHex(leaf, "#ffffff", 0.3), 0.9),
        { taper: 0.8, core: true });
      for (let k = 2; k < pts.length; k += 2) {
        ctx.save();
        ctx.fillStyle = hexA(mixHex(leaf, "#ffffff", 0.12), 0.9);
        ctx.beginPath();
        ctx.ellipse(pts[k].x + (k % 4 ? 8 : -8), pts[k].y, 9, 4.4, k % 4 ? 0.5 : -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Oxygen pearling off the leaves while the light is on.
      if (litNow) {
        for (let k = 0; k < 2; k++) {
          const f = ((t * 0.5 + i * 0.3 + k * 0.5) % 1);
          ctx.save();
          ctx.globalAlpha = 0.6 * (1 - f);
          sphere(ctx, px + 8, gravelY - hgt * 0.7 - f * 60, 1.8, mixHex(gas, "#ffffff", 0.5));
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = hexA(theme.inkSoft, 0.45);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // The heater tube, glowing when it is actually drawing power.
  const heatX = tankX + tankW - 42;
  glass(ctx, heatX - 9, waterTop + 22, 18, tankH * 0.5, 9, theme, { alpha: dark ? 0.16 : 0.3 });
  ctx.save();
  ctx.strokeStyle = s.heaterOn ? mixHex(hot, "#ffffff", 0.25) : mixHex(steel, "#000000", 0.2);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const f = i / 30;
    const py = waterTop + 34 + f * (tankH * 0.5 - 26);
    const px = heatX + Math.sin(f * Math.PI * 7) * 5;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  if (s.heaterOn) {
    glow(ctx, heatX, waterTop + 22 + tankH * 0.25, 40, hot, 0.3 + 0.1 * pulse(t, 0.8));
    for (let i = 0; i < 5; i++) {
      const f = ((t * 0.35 + i * 0.2) % 1);
      ctx.save();
      ctx.globalAlpha = 0.32 * (1 - f);
      ctx.strokeStyle = hot;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const sy = waterTop + 22 + tankH * 0.45 - f * tankH * 0.4;
      ctx.moveTo(heatX - 6, sy);
      ctx.quadraticCurveTo(heatX + Math.sin(f * 8 + i) * 8, sy - 10, heatX + 6, sy - 20);
      ctx.stroke();
      ctx.restore();
    }
  }
  lamp(ctx, heatX, waterTop + 14, 4, s.heaterOn ? hot : theme.inkSoft, s.heaterOn, t);

  // Bubbles from the filter outflow.
  TANK_BUBBLES.length = 0;
  for (const b of s.bubbles) {
    TANK_BUBBLES.push({
      x: tankX + b.x * tankW,
      y: tankY + tankH - b.y * (tankH - 20),
      r: b.r,
      a: 0.7,
    });
  }
  particleField(ctx, TANK_BUBBLES, mixHex(gas, "#ffffff", 0.6), { size: 2, alpha: 0.75, glow: 3 });

  // The fish.
  for (const f of s.fish) {
    const fx = tankX + f.x * tankW;
    const fy = tankY + tankH - f.y * (tankH - 30) - 8;
    const col = f.kind === 0 ? theme.sci["acceleration"] : f.kind === 1 ? theme.sci["light"] : theme.sci["velocity"];
    const wag = Math.sin(t * (4 + s.comfort * 6) + f.ph);
    drawFish(ctx, fx, fy, 11, col, f.vx >= 0 ? 1 : -1, wag, 0.55 + s.comfort * 0.45);
  }
  // Gasping at the surface is the visible symptom of low oxygen.
  if (s.o2 < 4) {
    for (let i = 0; i < 6; i++) {
      const f = ((t * 0.8 + i * 0.17) % 1);
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - f);
      sphere(ctx, tankX + 60 + i * 40, waterTop + 8 - f * 8, 2.2, mixHex(gas, "#ffffff", 0.4));
      ctx.restore();
    }
  }

  // A surface line with a moving ripple.
  ctx.save();
  ctx.strokeStyle = hexA(mixHex(water, "#ffffff", 0.75), 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = tankX; x <= tankX + tankW; x += 6) {
    const yy = waterTop + Math.sin(x * 0.05 + t * 1.4) * 1.8;
    if (x === tankX) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  /* ---- glass, then the hardware hanging on it ---- */
  glass(ctx, tankX, tankY, tankW, tankH, 6, theme, { alpha: dark ? 0.1 : 0.16 });
  metal(ctx, tankX - 5, tankY - 6, tankW + 10, 12, steel, { radius: 3 });
  metal(ctx, tankX - 5, tankY + tankH - 4, tankW + 10, 12, steel, { radius: 3 });

  // The filter box on the back wall, with its outflow.
  const filtX = tankX + tankW - 66, filtY = tankY - 4;
  const pumpOn = broken !== "pump";
  material(ctx, filtX, filtY, 62, 48, mixHex(steel, "#000000", 0.15), 5);
  bevelRect(ctx, filtX + 6, filtY + 8, 50, 22, 4, mixHex(theme.surfaceAlt, theme.ink, 0.14), { depth: -1 });
  lamp(ctx, filtX + 14, filtY + 38, 4.5, pumpOn ? good : theme.sci["force"], true, t);
  caption(ctx, filtX + 24, filtY + 38, pumpOn ? "400 L/h" : "off", theme, {
    size: 9.5, color: pumpOn ? theme.inkSoft : theme.sci["force"], weight: 700,
  });
  if (pumpOn) {
    const spout: { x: number; y: number }[] = [];
    for (let i = 0; i <= 6; i++) {
      const f = i / 6;
      spout.push({ x: filtX + 8 - f * 12, y: filtY + 48 + f * 26 + Math.sin(t * 3 + f * 4) * 1.5 });
    }
    ribbon(ctx, spout, 9, hexA(mixHex(water, "#ffffff", 0.6), 0.85), hexA(water, 0.2), { taper: 0.9, core: true });
  }
  if (broken === "bacteria") {
    caption(ctx, filtX + 31, filtY + 20, "no bacteria", theme, {
      align: "center", size: 9.5, color: theme.sci["force"], weight: 800,
    });
  }

  /* ---- the interaction web, drawn on the real objects ---- */
  if (overlays.web !== false) {
    const nodes: Record<string, [number, number]> = {
      light: [tankX + tankW / 2, tankY - 18],
      plants: [tankX + 74, gravelY - 60],
      fish: [tankX + tankW * 0.45, tankY + tankH * 0.45],
      heater: [heatX, waterTop + 22 + tankH * 0.2],
      filter: [filtX + 8, filtY + 62],
      water: [tankX + tankW * 0.28, tankY + tankH * 0.7],
    };
    const web: [string, string, string, boolean][] = [
      ["light", "plants", theme.sci["light"], litNow && plantsAlive],
      ["plants", "water", gas, litNow && plantsAlive],
      ["fish", "water", acid, true],
      ["water", "fish", gas, s.o2 > 3],
      ["heater", "water", hot, s.heaterOn],
      ["filter", "water", cold, pumpOn],
    ];
    for (let i = 0; i < web.length; i++) {
      const [a, b, col, live] = web[i];
      const p = nodes[a], qq = nodes[b];
      ctx.save();
      ctx.globalAlpha = live ? 0.5 + 0.35 * pulse(t + i * 0.3, 0.45) : 0.18;
      if (live) {
        dashFlow(ctx, [{ x: p[0], y: p[1] }, { x: qq[0], y: qq[1] }], col, t * 24 + i * 9,
          { width: 2.4, dash: 5, gap: 7, glow: 4 });
        arrow(ctx, lerp(p[0], qq[0], 0.72), lerp(p[1], qq[1], 0.72), qq[0], qq[1], col, { width: 1.6, head: 8 });
      } else {
        ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
        ctx.setLineDash([3, 6]);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(qq[0], qq[1]); ctx.stroke();
        // A cut mark where the interaction has been broken.
        const mx = (p[0] + qq[0]) / 2, my = (p[1] + qq[1]) / 2;
        ctx.setLineDash([]);
        ctx.strokeStyle = theme.sci["force"];
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(mx - 6, my - 6); ctx.lineTo(mx + 6, my + 6);
        ctx.moveTo(mx + 6, my - 6); ctx.lineTo(mx - 6, my + 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---- instrument console ---- */
  const cx0 = W - consoleW - 18;
  panelCard(ctx, cx0, 16, consoleW, 214, theme, "WATER CHEMISTRY");
  const gaugeY = 84;
  const gw = consoleW / 3;
  arcGauge(ctx, cx0 + gw * 0.5, gaugeY, Math.min(34, gw * 0.42), clamp01((celsius - 15) / 20), hot, theme,
    `${num(celsius, 1)}`, { sub: "deg C", width: 7, ticks: 5 });
  arcGauge(ctx, cx0 + gw * 1.5, gaugeY, Math.min(34, gw * 0.42), clamp01(s.o2 / 12), gas, theme,
    `${num(s.o2, 1)}`, { sub: "mg/L O2", width: 7, ticks: 5 });
  arcGauge(ctx, cx0 + gw * 2.5, gaugeY, Math.min(34, gw * 0.42), clamp01(s.nh / 2), acid, theme,
    `${num(s.nh, 2)}`, { sub: "mg/L NH3", width: 7, ticks: 5 });

  // Comfort, and the one condition that is holding it down.
  const barY = 148;
  caption(ctx, cx0 + 14, barY - 12, "fish comfort", theme, { size: 10.5, color: theme.inkSoft, weight: 700 });
  const barW = consoleW - 28;
  bevelRect(ctx, cx0 + 14, barY, barW, 14, 7, mixHex(theme.surfaceAlt, theme.ink, 0.1), { depth: -1 });
  const comfortCol = s.comfort > 0.7 ? good : s.comfort > 0.4 ? theme.sci["light"] : theme.sci["force"];
  ctx.save();
  roundRect(ctx, cx0 + 14, barY, Math.max(3, barW * s.comfort), 14, 7);
  ctx.fillStyle = comfortCol;
  ctx.fill();
  ctx.restore();
  caption(ctx, cx0 + 14 + barW, barY + 7, pctText(s.comfort), theme, {
    align: "right", size: 10.5, color: theme.surface, weight: 800,
  });
  caption(ctx, cx0 + 14, barY + 32, s.limiter === "nothing"
    ? "Nothing is limiting them right now."
    : `Limited by ${s.limiter}.`, theme, { size: 11, color: s.limiter === "nothing" ? good : comfortCol, weight: 700 });
  const dayNo = Math.floor(s.t / 86400) + 1;
  const hourOfDay = (s.t / 3600) % 24;
  caption(ctx, cx0 + 14, barY + 52,
    `day ${dayNo}, hour ${num(hourOfDay, 1)}  ·  ${litNow ? "lights on" : "lights off"}`, theme,
    { size: 10.5, color: theme.inkSoft });
  caption(ctx, cx0 + 14, barY + 70, `saturation at this temperature: ${num(oxygenSaturation(celsius), 1)} mg/L`,
    theme, { size: 10, color: theme.inkSoft });

  /* ---- the fault strip ---- */
  if (broken !== "none") {
    const names: Record<string, string> = {
      heater: "heater", thermostat: "thermostat", pump: "pump and filter flow",
      bacteria: "filter bacteria", light: "lamp", plants: "plants",
    };
    panelCard(ctx, cx0, 244, consoleW, 62, theme, "FAULT", theme.sci["force"]);
    lamp(ctx, cx0 + 20, 282, 6, theme.sci["force"], true, t);
    caption(ctx, cx0 + 36, 276, `${names[broken] ?? broken} switched off`, theme,
      { size: 11.5, color: theme.ink, weight: 700 });
    caption(ctx, cx0 + 36, 292, "watch what else changes", theme, { size: 10, color: theme.inkSoft });
  }

  /* ---- the equipment rail on the cabinet front, where the labels live ---- */
  if (overlays.labels !== false && band !== "3-5" && H - standY > 74) {
    const railY = standY + 22;
    bevelRect(ctx, tankX - 8, railY - 20, tankW + 16, 46, 8,
      mixHex(wood, "#000000", 0.42), { depth: -1 });
    const stops: [number, number, string, string, string][] = [
      [tankX + 74, gravelY - 50, leaf, "plants", "oxygen in light"],
      [filtX + 4, filtY + 60, cold, "filter", "flow and bacteria"],
      [heatX, waterTop + 44, hot, "heater 300 W", "25 C setpoint"],
    ];
    for (let i = 0; i < stops.length; i++) {
      const [fx, fy, col, name, sub2] = stops[i];
      labelLeader(ctx, fx, fy, tankX + 8 + i * (tankW - 24) / 3, railY, name, theme,
        { color: col, size: 10.5, align: "right", sub: sub2 });
    }
  }

  badge(ctx, tankX + 12, tankY + tankH - 12, `${TANK_VOLUME} L`, theme, { align: "left", color: water });
  badge(ctx, tankX + tankW - 12, tankY + 36, `${s.fish.length}`, theme, {
    align: "right", color: theme.sci["primary-consumer"], sub: "fish",
  });

  vignette(ctx, W, H, 0.2);
}

export const g6a1InteractionWeb: SimManifest<TankState> = {
  id: "g6a1-interaction-web",
  title: "Life Support",
  tagline: "Switch one part of the aquarium off and follow the trouble around the loop.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9],
  standards: { ngss: ["MS-ETS1-4", "MS-LS1-3", "MS-LS2-3"] },
  learningGoals: [
    "Trace how breaking one part of a system changes parts that were never touched.",
    "Use measurements over time to identify which interaction has been lost.",
    "Explain that a system's condition is set by its worst-off requirement, not the average.",
  ],
  misconceptions: [
    "Breaking one part only affects that part",
    "Warmer water holds more oxygen",
    "The filter is only there to catch dirt",
    "If most readings are fine, the system is fine",
  ],
  interactionHint: "Press play. One aquarium hour passes every couple of seconds.",
  tickRate: 1,
  timeScale: 1800,
  params: {
    broken: {
      type: "option", label: "Switch off",
      options: [
        { value: "none", label: "Nothing - all working" },
        { value: "heater", label: "Heater" },
        { value: "thermostat", label: "Thermostat" },
        { value: "pump", label: "Pump and flow" },
        { value: "bacteria", label: "Filter bacteria" },
        { value: "light", label: "Lamp" },
        { value: "plants", label: "Plants" },
      ],
      default: "none",
      help: "Break exactly one thing, then watch which readings move.",
    },
    fish: {
      type: "number", label: "Fish in the tank", kind: "count",
      min: 0, max: 12, step: 1, default: 6,
      help: "A 100 L tank comfortably holds about eight small fish.",
    },
    feed: {
      type: "number", label: "Food per day", kind: "mass", unit: "g",
      min: 0, max: 0.006, step: 0.0005, default: 0.002,
      help: "Uneaten food rots into ammonia just as fish waste does.",
    },
    roomTemp: {
      type: "number", label: "Room temperature", kind: "temperature", unit: "°C",
      min: 288.15, max: 301.15, step: 0.5, default: 294.15, bands: ["6-8", "9-12"],
      marks: [
        { value: 288.15, label: "15" },
        { value: 294.15, label: "21" },
        { value: 301.15, label: "28" },
      ],
    },
    dayNight: {
      type: "boolean", label: "Lamp on a timer", default: true,
      help: "Eight hours of light, sixteen hours of dark, like a real classroom tank.",
    },
  },
  overlays: [
    { key: "web", label: "Interaction arrows", default: true },
    { key: "labels", label: "Equipment labels", default: true, bands: ["6-8", "9-12"] },
  ],
  model: tankModel,
  render: renderTank,
  labs: [
    {
      id: "pump-matters",
      title: "What is the pump really for?",
      question: "The pump moves water. What else does it move?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      setup: { broken: "none", fish: 8, feed: 0.002, roomTemp: 294.15, dayNight: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you break it",
          instruction: "You are about to switch the pump off and leave everything else alone.",
          predict: {
            prompt: "Which readings will change within a day?",
            options: [
              "Only the water flow, nothing measurable",
              "Oxygen only",
              "Oxygen and ammonia, because both depend on flow",
            ],
            correct: 2,
            reveal:
              "The pump stirs the surface, which is where oxygen enters, and it feeds oxygen-hungry bacteria "
              + "that strip out ammonia. Stopping it breaks two interactions at once.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Record a healthy baseline",
          instruction: "Run for about six hours with nothing broken, recording data as you go.",
          requireData: 3,
          check: {
            describe: "Six aquarium hours with nothing broken",
            test: (v) => (v.facts.hours as number) >= 6 && v.params.broken === "none",
          },
        },
        {
          id: "break-pump",
          phase: "measure",
          title: "Stop the pump",
          instruction: "Switch the pump off and keep recording until oxygen falls below 5 mg/L.",
          requireData: 6,
          check: {
            describe: "Pump off and oxygen below 5 mg/L",
            test: (v) => v.params.broken === "pump" && (v.facts.oxygen as number) < 5,
          },
          hints: [
            "Night is the hard part: the plants stop making oxygen and everything keeps breathing.",
            "Watch the fish. They rise to the surface long before the gauge reaches zero.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Read your table",
          instruction: "Compare oxygen and ammonia before and after the pump stopped.",
          write: {
            prompt: "Which two readings moved, and which interaction does each one belong to?",
            placeholder: "Oxygen fell because ... and ammonia rose because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the hidden jobs",
          instruction: "The pump has more than one job in this system.",
          write: {
            prompt: "List everything the pump was doing that nobody would guess from watching the water move.",
          },
        },
      ],
    },
    {
      id: "cold-water-oxygen",
      title: "Does warm water hold more oxygen?",
      question: "Cold drinks go flat slowly. What does temperature do to oxygen in the tank?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      setup: { broken: "none", fish: 8, feed: 0.002, roomTemp: 294.15, dayNight: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Think about a fizzy drink left in the sun.",
          predict: {
            prompt: "As water gets warmer, the oxygen it can hold ...",
            options: ["goes up", "goes down", "stays the same"],
            correct: 1,
            reveal:
              "Warm water holds less dissolved gas. Saturation falls from about 9.1 mg/L at 20 degrees C to "
              + "8.2 at 25 and 7.6 at 30, while the fish need more oxygen at every step up.",
          },
        },
        {
          id: "cool",
          phase: "measure",
          title: "Run it cool",
          instruction: "Switch off the heater, let the tank settle toward the room, and record.",
          requireData: 3,
          check: {
            describe: "Heater off and water below 23 degrees C",
            test: (v) => v.params.broken === "heater" && (v.facts.celsius as number) < 23,
          },
        },
        {
          id: "hot",
          phase: "measure",
          title: "Now run it hot",
          instruction: "Break the thermostat instead, so the heater never switches off, and record again.",
          requireData: 6,
          check: {
            describe: "Thermostat broken and water above 29 degrees C",
            test: (v) => v.params.broken === "thermostat" && (v.facts.celsius as number) > 29,
          },
          hints: ["A 300 W heater against 25 W per kelvin of loss settles about 12 K above the room."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Plot the pattern",
          instruction: "Compare the saturation reading at your two temperatures.",
          write: {
            prompt: "Write the saturation you measured at each temperature and the difference between them.",
            placeholder: "At ... degrees C the water could hold ... mg/L, and at ... degrees C only ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Two effects, one direction",
          instruction: "Warming does two separate things to the oxygen supply.",
          write: {
            prompt: "Explain why warming is doubly hard on the fish, using both the supply and the demand.",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hold-the-line",
      title: "Hold the line",
      brief: "Keep fish comfort above 80 percent for a full day with ten fish.",
      bands: ["6-8", "9-12"],
      setup: { broken: "none", fish: 10, feed: 0.002, roomTemp: 294.15, dayNight: true },
      goal: {
        describe: "Ten fish, 24 hours, comfort never below 0.8",
        test: (v) => (v.facts.fishCount as number) >= 10 && (v.facts.hours as number) >= 24
          && (v.facts.minComfort as number) >= 0.8,
      },
      stars: {
        two: {
          describe: "48 hours above 0.8",
          test: (v) => (v.facts.fishCount as number) >= 10 && (v.facts.hours as number) >= 48
            && (v.facts.minComfort as number) >= 0.8,
        },
        three: {
          describe: "48 hours above 0.9",
          test: (v) => (v.facts.fishCount as number) >= 10 && (v.facts.hours as number) >= 48
            && (v.facts.minComfort as number) >= 0.9,
        },
      },
      hints: [
        "Overfeeding puts ammonia in faster than the bacteria can take it out.",
        "The night is the dangerous half of the day, because the plants stop giving oxygen.",
      ],
    },
    {
      id: "ammonia-spike",
      title: "Find the ammonia",
      brief: "Push ammonia past 1.0 mg/L without adding a single fish.",
      bands: ["6-8", "9-12"],
      setup: { broken: "none", fish: 6, feed: 0.002, roomTemp: 294.15, dayNight: true },
      goal: {
        describe: "Ammonia above 1.0 mg/L with six fish or fewer",
        test: (v) => (v.facts.maxAmmonia as number) > 1 && (v.facts.fishCount as number) <= 6,
      },
      stars: {
        two: {
          describe: "Above 1.0 mg/L within 18 aquarium hours",
          test: (v) => (v.facts.maxAmmonia as number) > 1 && (v.facts.fishCount as number) <= 6
            && (v.facts.hours as number) <= 18,
        },
      },
      hints: [
        "Ammonia has one way out of this tank, and it is alive.",
        "Food that nobody eats rots. Try the feeding control as well as the fault switch.",
      ],
    },
  ],
};

/* ================================================================== *
 * A1.4 — Murmuration Rig: emergent properties
 *
 * Two flight cages at dusk, side by side, holding the same number of
 * identical birds. In the left cage every bird flies alone. In the
 * right one each bird watches a handful of neighbours - and a flock
 * appears that no bird was ever told to make.
 *
 * The order parameter, the seven-neighbour rule and the alarm wave
 * all come from real starling research.
 * ================================================================== */

const BIRD_SPEED = 11;      // m/s, a starling's cruising speed
const ARENA_W = 44;         // metres across one cage
const ARENA_H = 26;         // metres tall
const NEIGHBOUR_CUT = 9;    // m, birds further away are ignored
const LINK_R = 3.2;         // m, two birds this close count as one group
const MAX_K = 12;

interface Bird { x: number; y: number; vx: number; vy: number; a: number }

interface FlockState {
  free: Bird[];
  flock: Bird[];
  orderFree: number;
  orderFlock: number;
  spacing: number;
  groups: number;
  alarmed: number;
  maxAlarmed: number;
  alarmX: number;
  alarmY: number;
  hawkX: number;
  hawkY: number;
  hawkVX: number;
  hawkVY: number;
  minOrder: number;
  maxOrder: number;
}

function makeBirds(n: number, pick: () => number): Bird[] {
  const out: Bird[] = [];
  for (let i = 0; i < n; i++) {
    const a = pick() * Math.PI * 2;
    out.push({
      x: ARENA_W * (0.2 + pick() * 0.6),
      y: ARENA_H * (0.2 + pick() * 0.6),
      vx: Math.cos(a) * BIRD_SPEED,
      vy: Math.sin(a) * BIRD_SPEED,
      a: 0,
    });
  }
  return out;
}

function orderParameter(birds: Bird[]): number {
  if (birds.length === 0) return 0;
  let sx = 0, sy = 0;
  for (const b of birds) {
    const sp = Math.hypot(b.vx, b.vy) || 1;
    sx += b.vx / sp;
    sy += b.vy / sp;
  }
  return Math.hypot(sx, sy) / birds.length;
}

interface FlockOpts {
  rules: boolean;
  k: number;
  align: number;
  cohere: number;
  separate: number;
  noise: number;
  hawk: { x: number; y: number } | null;
  alarm: { x: number; y: number; live: boolean };
}

interface FlockResult { birds: Bird[]; spacing: number; groups: number; alarmed: number }

/**
 * One flock step. Each bird looks at its k nearest neighbours inside a
 * 9 m circle, blends three simple urges into a desired heading, and turns
 * toward it at a bounded rate. Nothing in here knows the word "flock".
 */
function stepFlock(birds: Bird[], dt: number, o: FlockOpts, rand: () => number): FlockResult {
  const n = birds.length;
  if (n === 0) return { birds, spacing: 0, groups: 0, alarmed: 0 };
  const k = Math.max(1, Math.min(MAX_K, Math.round(o.k)));
  const nd = new Array<number>(n * k).fill(Infinity);
  const ni = new Array<number>(n * k).fill(-1);
  const parent = new Array<number>(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (i: number): number => {
    let r = i;
    while (parent[r] !== r) r = parent[r];
    while (parent[i] !== r) { const nx = parent[i]; parent[i] = r; i = nx; }
    return r;
  };

  const insert = (i: number, j: number, d: number) => {
    const base = i * k;
    if (d >= nd[base + k - 1]) return;
    let slot = k - 1;
    while (slot > 0 && nd[base + slot - 1] > d) {
      nd[base + slot] = nd[base + slot - 1];
      ni[base + slot] = ni[base + slot - 1];
      slot--;
    }
    nd[base + slot] = d;
    ni[base + slot] = j;
  };

  const cut2 = NEIGHBOUR_CUT * NEIGHBOUR_CUT;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = birds[j].x - birds[i].x;
      const dy = birds[j].y - birds[i].y;
      const d2 = dx * dx + dy * dy;
      if (d2 > cut2) continue;
      const d = Math.sqrt(d2);
      insert(i, j, d);
      insert(j, i, d);
      if (d < LINK_R) {
        const ri = find(i), rj = find(j);
        if (ri !== rj) parent[ri] = rj;
      }
    }
  }

  const out: Bird[] = new Array(n);
  let spacingSum = 0;
  let alarmedCount = 0;
  const turnRate = 4.2;

  for (let i = 0; i < n; i++) {
    const b = birds[i];
    const base = i * k;
    let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, cnt = 0, maxAlarm = 0;
    for (let m = 0; m < k; m++) {
      const j = ni[base + m];
      if (j < 0) break;
      const nb = birds[j];
      const d = Math.max(0.2, nd[base + m]);
      const sp = Math.hypot(nb.vx, nb.vy) || 1;
      ax += nb.vx / sp; ay += nb.vy / sp;
      cx += nb.x; cy += nb.y;
      if (d < 2.2) { sx += (b.x - nb.x) / (d * d); sy += (b.y - nb.y) / (d * d); }
      if (nb.a > maxAlarm) maxAlarm = nb.a;
      cnt++;
    }
    spacingSum += cnt > 0 ? nd[base] : NEIGHBOUR_CUT;

    const sp0 = Math.hypot(b.vx, b.vy) || 1;
    let dx = b.vx / sp0, dy = b.vy / sp0;

    if (o.rules && cnt > 0) {
      const inv = 1 / cnt;
      const alen = Math.hypot(ax, ay) || 1;
      dx += o.align * 2.2 * (ax / alen);
      dy += o.align * 2.2 * (ay / alen);
      const tox = cx * inv - b.x, toy = cy * inv - b.y;
      const tlen = Math.hypot(tox, toy) || 1;
      dx += o.cohere * 1.6 * (tox / tlen);
      dy += o.cohere * 1.6 * (toy / tlen);
      const slen = Math.hypot(sx, sy);
      if (slen > 0) {
        dx += o.separate * 2.4 * (sx / slen);
        dy += o.separate * 2.4 * (sy / slen);
      }
    }

    // Alarm spreads bird to bird. That is why the wave outruns the birds.
    let alarm = Math.max(b.a - dt * 0.55, o.rules ? maxAlarm - dt * 0.9 : 0);
    if (o.alarm.live) {
      const adx = b.x - o.alarm.x, ady = b.y - o.alarm.y;
      if (adx * adx + ady * ady < 16) alarm = 1;
    }
    if (o.hawk) {
      const hdx = b.x - o.hawk.x, hdy = b.y - o.hawk.y;
      const hd = Math.hypot(hdx, hdy);
      if (hd < 7) {
        alarm = 1;
        dx += (hdx / (hd || 1)) * 3.4;
        dy += (hdy / (hd || 1)) * 3.4;
      }
    }
    alarm = clamp01(alarm);
    if (alarm > 0.25) alarmedCount++;
    if (alarm > 0.25 && o.alarm.live) {
      const adx = b.x - o.alarm.x, ady = b.y - o.alarm.y;
      const ad = Math.hypot(adx, ady) || 1;
      dx += (adx / ad) * alarm * 1.6;
      dy += (ady / ad) * alarm * 1.6;
    }

    // Soft walls: birds wheel away from the edge rather than bouncing off it.
    const margin = 4;
    if (b.x < margin) dx += (margin - b.x) * 0.5;
    if (b.x > ARENA_W - margin) dx -= (b.x - (ARENA_W - margin)) * 0.5;
    if (b.y < margin) dy += (margin - b.y) * 0.5;
    if (b.y > ARENA_H - margin) dy -= (b.y - (ARENA_H - margin)) * 0.5;

    const jitter = (rand() - 0.5) * o.noise * (o.rules ? 2.4 : 7.5);
    let want = Math.atan2(dy, dx) + jitter;
    const have = Math.atan2(b.vy, b.vx);
    let diff = want - have;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = turnRate * dt * (1 + alarm);
    want = have + Math.max(-maxTurn, Math.min(maxTurn, diff));

    const vx = Math.cos(want) * BIRD_SPEED;
    const vy = Math.sin(want) * BIRD_SPEED;
    out[i] = {
      x: Math.max(0.4, Math.min(ARENA_W - 0.4, b.x + vx * dt)),
      y: Math.max(0.4, Math.min(ARENA_H - 0.4, b.y + vy * dt)),
      vx, vy, a: alarm,
    };
  }

  let groups = 0;
  for (let i = 0; i < n; i++) if (find(i) === i) groups++;
  return { birds: out, spacing: spacingSum / n, groups, alarmed: alarmedCount / n };
}

const flockModel: SimModel<FlockState> = {
  init(params, ctx) {
    const n = Math.round(params.birds as number);
    return {
      free: makeBirds(n, () => ctx.rng.next()),
      flock: makeBirds(n, () => ctx.rng.next()),
      orderFree: 0, orderFlock: 0, spacing: 0, groups: n, alarmed: 0, maxAlarmed: 0,
      alarmX: 0, alarmY: 0,
      hawkX: ARENA_W * 0.5, hawkY: -6, hawkVX: 0, hawkVY: 0,
      minOrder: 1, maxOrder: 0,
    };
  },

  applyParams(state, params, prev, ctx) {
    if (params.birds === prev.birds) return state;
    const want = Math.round(params.birds as number);
    const fit = (arr: Bird[]) => want < arr.length
      ? arr.slice(0, want)
      : [...arr, ...makeBirds(want - arr.length, () => ctx.rng.next())];
    return { ...state, free: fit(state.free), flock: fit(state.flock) };
  },

  step(state, dt, params, ctx, inputs) {
    let alarmX = state.alarmX, alarmY = state.alarmY;
    let live = false;
    for (const input of inputs) {
      if (input.type === "pointerdown") {
        // A startle from a random edge, so a click always shows the wave.
        const side = ctx.rng.int(0, 3);
        alarmX = side === 0 ? 1 : side === 1 ? ARENA_W - 1 : ctx.rng.range(2, ARENA_W - 2);
        alarmY = side === 2 ? 1 : side === 3 ? ARENA_H - 1 : ctx.rng.range(2, ARENA_H - 2);
        live = true;
      }
    }
    if (dt <= 0) return live ? { ...state, alarmX, alarmY } : state;

    const hawkOn = params.predator as boolean;
    let hawkX = state.hawkX, hawkY = state.hawkY, hawkVX = state.hawkVX, hawkVY = state.hawkVY;
    if (hawkOn) {
      let cx = ARENA_W / 2, cy = ARENA_H / 2;
      if (state.flock.length > 0) {
        cx = state.flock.reduce((sum, b) => sum + b.x, 0) / state.flock.length;
        cy = state.flock.reduce((sum, b) => sum + b.y, 0) / state.flock.length;
      }
      const dx = cx - hawkX, dy = cy - hawkY;
      const d = Math.hypot(dx, dy) || 1;
      hawkVX += (dx / d) * 34 * dt;
      hawkVY += (dy / d) * 34 * dt;
      const hs = Math.hypot(hawkVX, hawkVY) || 1;
      const cap = 19;
      hawkVX = (hawkVX / hs) * Math.min(hs, cap);
      hawkVY = (hawkVY / hs) * Math.min(hs, cap);
      hawkX += hawkVX * dt;
      hawkY += hawkVY * dt;
      if (hawkX < -10 || hawkX > ARENA_W + 10 || hawkY < -10 || hawkY > ARENA_H + 10) {
        hawkX = ctx.rng.range(0, ARENA_W); hawkY = -8; hawkVX = 0; hawkVY = 0;
      }
    } else {
      hawkY = -8;
    }

    const common = {
      k: params.neighbours as number,
      align: params.align as number,
      cohere: params.cohere as number,
      separate: params.separate as number,
      noise: params.noise as number,
      alarm: { x: alarmX, y: alarmY, live },
    };
    const freeRes = stepFlock(state.free, dt, { ...common, rules: false, hawk: null }, () => ctx.rng.next());
    const flockRes = stepFlock(state.flock, dt, {
      ...common, rules: true, hawk: hawkOn ? { x: hawkX, y: hawkY } : null,
    }, () => ctx.rng.next());

    const orderFlock = orderParameter(flockRes.birds);
    return {
      free: freeRes.birds,
      flock: flockRes.birds,
      orderFree: orderParameter(freeRes.birds),
      orderFlock,
      spacing: flockRes.spacing,
      groups: flockRes.groups,
      alarmed: flockRes.alarmed,
      maxAlarmed: Math.max(state.maxAlarmed, flockRes.alarmed),
      alarmX, alarmY,
      hawkX, hawkY, hawkVX, hawkVY,
      minOrder: Math.min(state.minOrder, orderFlock),
      maxOrder: Math.max(state.maxOrder, orderFlock),
    };
  },

  readouts(state) {
    const n = Math.max(1, state.flock.length);
    return [
      {
        key: "orderFlock", label: "Order, rules on", quantity: q(state.orderFlock, "percent"), unit: "%",
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "orderFree", label: "Order, rules off", quantity: q(state.orderFree, "percent"), unit: "%",
        semantic: "mass", graphable: true,
      },
      {
        key: "expected", label: "Order expected by chance", quantity: q(1 / Math.sqrt(n), "percent"), unit: "%",
        semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "spacing", label: "Nearest neighbour", quantity: q(state.spacing, "length"), unit: "m",
        semantic: "distance", graphable: true,
      },
      { key: "groups", label: "Separate groups", quantity: q(state.groups, "count"), semantic: "mass", graphable: true },
      {
        key: "alarmed", label: "Birds alarmed", quantity: q(state.alarmed, "percent"), unit: "%",
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state) {
    const n = Math.max(1, state.flock.length);
    return {
      orderFlock: state.orderFlock,
      orderFree: state.orderFree,
      expected: 1 / Math.sqrt(n),
      ratio: state.orderFlock / Math.max(0.02, state.orderFree),
      spacing: state.spacing,
      groups: state.groups,
      birds: state.flock.length,
      alarmed: state.alarmed,
      maxAlarmed: state.maxAlarmed,
      minOrder: state.minOrder,
      maxOrder: state.maxOrder,
    };
  },
};

/* ---------------- dusk, and the birds in it ---------------- */

function drawBird(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number,
  flap: number, color: string, alarm: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = alarm > 0.25 ? mixHex(color, "#ffffff", 0.35) : color;
  ctx.lineWidth = Math.max(1, size * 0.34);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const sweep = 0.5 + 0.5 * flap;
  ctx.beginPath();
  ctx.moveTo(-size * 1.5 * sweep, -size * 1.15 * (1 - sweep * 0.4));
  ctx.quadraticCurveTo(-size * 0.2, -size * 0.15, size * 0.9, 0);
  ctx.quadraticCurveTo(-size * 0.2, size * 0.15, -size * 1.5 * sweep, size * 1.15 * (1 - sweep * 0.4));
  ctx.stroke();
  ctx.restore();
}

function renderFlock(rc: RenderContext<FlockState>) {
  const { ctx, state: s, params, theme, width: W, height: H, band, overlays, time: t } = rc;
  const dark = isDarkTheme(theme);
  const good = theme.sci["energy-kinetic"];
  const alarmC = theme.sci["force"];
  const inkBird = mixHex(theme.ink, dark ? "#ffffff" : "#000000", 0.18);

  /* ---- one evening sky over both cages ---- */
  const horizon = Math.round(H * 0.82);
  sky(ctx, W, H, theme, "dusk", horizon);
  glow(ctx, W * 0.18, horizon - 10, Math.min(W * 0.5, 420), theme.sci["light"], dark ? 0.28 : 0.4);
  ctx.save();
  ctx.globalAlpha = dark ? 0.7 : 0.25;
  for (let i = 0; i < 60; i++) {
    const sxp = ((i * 197) % 1000) / 1000 * W;
    const syp = ((i * 89) % 400) / 400 * (H * 0.4);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = (dark ? 0.55 : 0.2) * (0.3 + 0.7 * pulse(t + i, 0.12));
    ctx.beginPath(); ctx.arc(sxp, syp, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // A skyline of roofs and poplars along the horizon.
  ctx.save();
  ctx.fillStyle = mixHex(theme.ink, "#000000", dark ? 0.35 : 0.1);
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, horizon - 14);
  for (let i = 0; i < 26; i++) {
    const bx = (i / 26) * W;
    const bh = 8 + ((i * 37) % 34);
    ctx.lineTo(bx, horizon - bh);
    ctx.lineTo(bx + W / 26, horizon - bh);
  }
  ctx.lineTo(W, horizon - 10);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const px = 40 + i * (W - 80) / 6;
    ctx.beginPath();
    ctx.ellipse(px, horizon - 34, 11, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 2, horizon - 34, 4, 34);
  }
  ctx.restore();

  /* ---- two cages ---- */
  const gutter = 16;
  const cageY = 124;
  const cageH = Math.max(140, horizon - cageY - 92);
  const cageW = (W - gutter * 3) / 2;
  const cages: { x: number; birds: Bird[]; rules: boolean; order: number; title: string; sub: string }[] = [
    {
      x: gutter, birds: s.free, rules: false, order: s.orderFree,
      title: "RULES OFF", sub: "every bird flies alone",
    },
    {
      x: gutter * 2 + cageW, birds: s.flock, rules: true, order: s.orderFlock,
      title: "RULES ON", sub: `each bird watches ${Math.round(params.neighbours as number)} neighbours`,
    },
  ];

  for (const cage of cages) {
    const sxm = cageW / ARENA_W;
    const sym = cageH / ARENA_H;

    // The cage interior is a slightly deeper slice of the same evening.
    ctx.save();
    roundRect(ctx, cage.x, cageY, cageW, cageH, 8);
    ctx.clip();
    gradientFill(ctx, cage.x, cageY, cageW, cageH, [
      hexA(mixHex(theme.surface, theme.ink, dark ? 0.28 : 0.1), 0.5),
      hexA(mixHex(theme.surface, theme.ink, dark ? 0.5 : 0.2), 0.55),
    ], 90);
    noiseWash(ctx, cage.x, cageY, cageW, cageH, { alpha: 0.05, seed: 17, count: 160, color: "#ffffff" });

    // Motion smears first, then the birds over them.
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = inkBird;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const b of cage.birds) {
      const bx = cage.x + b.x * sxm, by = cageY + cageH - b.y * sym;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - b.vx * 0.05 * sxm, by + b.vy * 0.05 * sym);
    }
    ctx.stroke();
    ctx.restore();

    for (const b of cage.birds) {
      const bx = cage.x + b.x * sxm, by = cageY + cageH - b.y * sym;
      const ang = Math.atan2(-b.vy * sym, b.vx * sxm);
      const flap = Math.sin(t * 9 + b.x * 0.7 + b.y * 0.4);
      drawBird(ctx, bx, by, 4.4, ang, flap, b.a > 0.25 ? alarmC : inkBird, b.a);
    }

    // The hawk only hunts the flock that has rules.
    if ((params.predator as boolean) && cage.rules && s.hawkY > -6) {
      const hx = cage.x + s.hawkX * sxm, hy = cageY + cageH - s.hawkY * sym;
      const hang = Math.atan2(-s.hawkVY * sym, s.hawkVX * sxm);
      ctx.save();
      ctx.globalAlpha = 0.35;
      dashFlow(ctx, [{ x: hx - s.hawkVX * sxm, y: hy + s.hawkVY * sym }, { x: hx, y: hy }],
        alarmC, t * 30, { width: 2, dash: 4, gap: 6 });
      ctx.restore();
      drawBird(ctx, hx, hy, 12, hang, Math.sin(t * 4) * 0.5, mixHex(alarmC, "#000000", 0.25), 1);
    }

    // The flock's own heading: a property of the group, not of any bird.
    if (overlays.heading !== false && cage.birds.length > 0) {
      let mx = 0, my = 0, cxm = 0, cym = 0;
      for (const b of cage.birds) {
        const sp = Math.hypot(b.vx, b.vy) || 1;
        mx += b.vx / sp; my += b.vy / sp; cxm += b.x; cym += b.y;
      }
      const n = cage.birds.length;
      mx /= n; my /= n; cxm /= n; cym /= n;
      const ox = cage.x + cxm * sxm, oy = cageY + cageH - cym * sym;
      const len = Math.hypot(mx, my) * 96;
      if (len > 3) {
        arrow(ctx, ox, oy, ox + (mx / (Math.hypot(mx, my) || 1)) * len,
          oy - (my / (Math.hypot(mx, my) || 1)) * len, cage.rules ? good : theme.sci["mass"],
          { width: 3, head: 12 });
      }
      sphere(ctx, ox, oy, 3.4, cage.rules ? good : theme.sci["mass"]);
    }
    ctx.restore();

    // Glass and frame over the top, so the birds are inside something.
    glass(ctx, cage.x, cageY, cageW, cageH, 8, theme, { alpha: dark ? 0.06 : 0.1 });
    metal(ctx, cage.x - 5, cageY - 10, cageW + 10, 12, theme.sci["mass"], { radius: 4 });
    metal(ctx, cage.x - 5, cageY + cageH - 2, cageW + 10, 12, theme.sci["mass"], { radius: 4 });
    metal(ctx, cage.x - 6, cageY - 6, 8, cageH + 14, theme.sci["mass"], { radius: 3 });
    metal(ctx, cage.x + cageW - 2, cageY - 6, 8, cageH + 14, theme.sci["mass"], { radius: 3 });

    // Header and instruments.
    const accent = cage.rules ? good : theme.sci["mass"];
    panelCard(ctx, cage.x, cageY - 74, cageW, 58, theme, undefined, accent);
    caption(ctx, cage.x + 16, cageY - 50, cage.title, theme, { size: 14, color: theme.ink, weight: 800 });
    caption(ctx, cage.x + 16, cageY - 31, cage.sub, theme, { size: 11, color: theme.inkSoft });
    arcGauge(ctx, cage.x + cageW - 42, cageY - 45, 24, cage.order, accent, theme,
      num(cage.order, 2), { sub: "order", width: 6, ticks: 5 });

    if (band !== "3-5") {
      badge(ctx, cage.x + 14, cageY + cageH + 26, `${cage.birds.length}`, theme,
        { align: "left", color: theme.inkSoft, sub: "birds" });
      if (cage.rules) {
        badge(ctx, cage.x + cageW * 0.42, cageY + cageH + 26, `${num(s.spacing, 1)} m`, theme,
          { align: "center", color: theme.sci["distance"], sub: "nearest bird" });
        badge(ctx, cage.x + cageW - 14, cageY + cageH + 26, `${s.groups}`, theme,
          { align: "right", color: s.groups <= 2 ? good : theme.sci["light"], sub: "groups" });
      } else {
        badge(ctx, cage.x + cageW - 14, cageY + cageH + 26, num(1 / Math.sqrt(Math.max(1, cage.birds.length)), 2),
          theme, { align: "right", color: theme.sci["time"], sub: "chance level" });
      }
    }
  }

  /* ---- the comparison, spelled out ---- */
  const strip = H - 54;
  caption(ctx, W / 2, 22, "Same birds. Same speed. One rule book.", theme, {
    align: "center", size: 16, color: theme.ink, weight: 800,
  });
  caption(ctx, W / 2, 40, "The flock is a property of the group, not of any bird in it.", theme, {
    align: "center", size: 11.5, color: theme.inkSoft,
  });
  const barW = Math.min(W - 120, 520);
  const barX = (W - barW) / 2;
  bevelRect(ctx, barX, strip, barW, 16, 8, mixHex(theme.surfaceAlt, theme.ink, 0.12), { depth: -1 });
  ctx.save();
  roundRect(ctx, barX, strip, Math.max(4, barW * clamp01(s.orderFree)), 16, 8);
  ctx.fillStyle = hexA(theme.sci["mass"], 0.85);
  ctx.fill();
  roundRect(ctx, barX, strip, Math.max(4, barW * clamp01(s.orderFlock)), 8, 5);
  ctx.fillStyle = good;
  ctx.fill();
  ctx.restore();
  const chance = 1 / Math.sqrt(Math.max(1, s.flock.length));
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.7);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(barX + barW * chance, strip - 6);
  ctx.lineTo(barX + barW * chance, strip + 22);
  ctx.stroke();
  ctx.restore();
  caption(ctx, barX + barW * chance, strip + 32, `chance ${num(chance, 2)}`, theme,
    { align: "center", size: 10, color: theme.inkSoft });
  caption(ctx, barX - 10, strip + 8, "0", theme, { align: "right", size: 10, color: theme.inkSoft });
  caption(ctx, barX + barW + 10, strip + 8, "1", theme, { size: 10, color: theme.inkSoft });

  if (s.alarmed > 0.02) {
    badge(ctx, W / 2, strip - 26, pctText(s.alarmed), theme,
      { align: "center", color: alarmC, sub: "alarm has reached" });
  }

  vignette(ctx, W, H, 0.22);
}

export const g6a1Murmuration: SimManifest<FlockState> = {
  id: "g6a1-murmuration",
  title: "Murmuration Rig",
  tagline: "Two cages of identical birds: switch on three simple rules and watch a flock appear.",
  subject: "engineering",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9],
  standards: { ngss: ["MS-LS2-2", "MS-ETS1-4"] },
  learningGoals: [
    "Describe an emergent property as one the whole system has and no part has.",
    "Measure order in a group and compare it with what independent motion would give.",
    "Explain how a signal can cross a flock faster than any single bird travels.",
  ],
  misconceptions: [
    "A flock needs a leader deciding where to go",
    "Complicated group behaviour needs complicated rules",
    "Emergent properties belong to the individuals as well as the group",
    "Any group of animals moving together is a flock",
  ],
  interactionHint: "Click the stage to startle the birds and watch the alarm spread.",
  tickRate: 45,
  params: {
    birds: {
      type: "number", label: "Birds in each cage", kind: "count",
      min: 10, max: 120, step: 5, default: 60,
      help: "Both cages always hold the same number.",
    },
    neighbours: {
      type: "number", label: "Neighbours each bird watches", kind: "count",
      min: 1, max: 12, step: 1, default: 7,
      marks: [{ value: 7, label: "real starlings" }],
      help: "Real starlings track about six or seven neighbours, however far away they are.",
    },
    align: {
      type: "number", label: "Match their heading", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.6,
    },
    cohere: {
      type: "number", label: "Move toward them", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.35,
    },
    separate: {
      type: "number", label: "Do not crowd them", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.8,
    },
    noise: {
      type: "number", label: "Wind and wobble", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.15, bands: ["6-8", "9-12"],
    },
    predator: {
      type: "boolean", label: "Release a falcon", default: false,
      help: "It hunts the right-hand cage only.",
    },
  },
  overlays: [
    { key: "heading", label: "Average heading", default: true },
  ],
  model: flockModel,
  render: renderFlock,
  labs: [
    {
      id: "where-is-the-flock",
      title: "Where does the flock come from?",
      question: "No bird can see the flock. So who decides its shape?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      setup: { birds: 60, neighbours: 7, align: 0, cohere: 0, separate: 0.8, noise: 0.15, predator: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the source",
          instruction: "Sixty identical birds, no leader, no plan.",
          predict: {
            prompt: "What is needed before a flock appears?",
            options: [
              "One bird has to lead and the rest follow",
              "Each bird only has to react to a few neighbours",
              "The birds need to see the whole flock at once",
            ],
            correct: 1,
            reveal:
              "Local rules are enough. Each starling tracks about seven neighbours and nothing else, and the "
              + "flock shape is what those thousands of small decisions add up to.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Measure disorder first",
          instruction: "With Match their heading at zero, record the order in both cages.",
          requireData: 2,
          check: {
            describe: "Alignment turned right down",
            test: (v) => (v.params.align as number) <= 0.05,
          },
          hints: ["Compare the two order readings with the chance level marked on the bar."],
        },
        {
          id: "switch-on",
          phase: "measure",
          title: "Switch the rules on",
          instruction: "Raise Match their heading to 0.6 and record again once the picture settles.",
          requireData: 5,
          check: {
            describe: "Order in the right cage above 0.7",
            test: (v) => (v.facts.orderFlock as number) > 0.7,
          },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare with chance",
          instruction: "Independent birds should give an order of about one over the square root of the number of birds.",
          write: {
            prompt: "What order did the rules-off cage give, and how close is it to the chance value?",
            placeholder: "With 60 birds, chance predicts ... and I measured ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what emerged",
          instruction: "Name one property the flock has that no single bird has.",
          write: {
            prompt: "Which properties belong to the flock and not to any bird in it?",
            placeholder: "The flock has ... but no single bird has ...",
          },
        },
      ],
    },
    {
      id: "seven-neighbours",
      title: "How many neighbours is enough?",
      question: "Would a starling do better watching everybody?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      setup: { birds: 80, neighbours: 1, align: 0.6, cohere: 0.35, separate: 0.8, noise: 0.15, predator: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the shape of the curve",
          instruction: "You will raise the number of neighbours from one to twelve.",
          predict: {
            prompt: "How will the order change as each bird watches more neighbours?",
            options: [
              "It climbs steadily all the way to twelve",
              "It climbs steeply at first, then flattens off",
              "It hardly changes at all",
            ],
            correct: 1,
            reveal:
              "Order rises fast for the first few neighbours and then saturates. Real starlings settle at "
              + "six or seven, which buys almost all of the benefit for a fraction of the attention.",
          },
        },
        {
          id: "sweep",
          phase: "measure",
          title: "Sweep the control",
          instruction: "Record the order at 1, 2, 4, 7 and 12 neighbours, waiting for it to settle each time.",
          requireData: 5,
          hints: [
            "Give each setting a few seconds. The order takes time to build.",
            "Watch the groups readout too: too few neighbours and the flock splits.",
          ],
        },
        {
          id: "knee",
          phase: "analyze",
          title: "Find the knee",
          instruction: "Look for the point where extra neighbours stop paying.",
          write: {
            prompt: "At which number of neighbours did the order stop improving much?",
            placeholder: "Going from 1 to 4 changed the order by ... but going from 7 to 12 only ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the choice",
          instruction: "Watching neighbours costs a bird attention.",
          write: {
            prompt: "Why might evolution settle on about seven neighbours rather than one or fifty?",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "one-flock",
      title: "One flock, not five",
      brief: "Get eighty birds into a single group with an order above 0.9.",
      bands: ["6-8", "9-12"],
      setup: { birds: 80, neighbours: 7, align: 0.3, cohere: 0.2, separate: 0.8, noise: 0.3, predator: false },
      goal: {
        describe: "Order above 0.8 with at most two groups",
        test: (v) => (v.facts.orderFlock as number) > 0.8 && (v.facts.groups as number) <= 2
          && (v.facts.birds as number) >= 80,
      },
      stars: {
        two: {
          describe: "Order above 0.9 in a single group",
          test: (v) => (v.facts.orderFlock as number) > 0.9 && (v.facts.groups as number) <= 1
            && (v.facts.birds as number) >= 80,
        },
        three: {
          describe: "Order above 0.95 in a single group with wind at 0.3 or more",
          test: (v) => (v.facts.orderFlock as number) > 0.95 && (v.facts.groups as number) <= 1
            && (v.facts.birds as number) >= 80 && (v.params.noise as number) >= 0.3,
        },
      },
      hints: [
        "Alignment makes them point the same way; cohesion is what keeps them in one group.",
        "Too much separation and the flock blows apart into clumps.",
      ],
    },
    {
      id: "the-wave",
      title: "Send a wave",
      brief: "Startle one edge of the flock and get the alarm to more than seventy percent of the birds.",
      bands: ["6-8", "9-12"],
      setup: { birds: 100, neighbours: 7, align: 0.7, cohere: 0.45, separate: 0.8, noise: 0.1, predator: false },
      goal: {
        describe: "Alarm reached over 70 percent of the flock",
        test: (v) => (v.facts.maxAlarmed as number) > 0.7,
      },
      stars: {
        two: {
          describe: "Over 90 percent alarmed",
          test: (v) => (v.facts.maxAlarmed as number) > 0.9,
        },
      },
      hints: [
        "Alarm only passes from bird to neighbour, so the flock has to be joined up.",
        "Raise cohesion first: a scattered flock cannot carry a wave.",
      ],
    },
  ],
};

/* ================================================================== *
 * A1.5 — The Scale Ladder
 *
 * Eight real systems, from a mitochondrion at one micrometre to the
 * Earth at 12 700 kilometres. Step the ladder and the same three
 * questions get the same answer every time: parts, interactions,
 * a job of its own. Thirteen powers of ten apart, and all of them
 * are systems.
 * ================================================================== */

interface RungPart { name: string; x: number; y: number; note: string }

interface Rung {
  id: string;
  name: string;
  /** Characteristic size in metres. */
  size: number;
  sizeLabel: string;
  partOf: string;
  madeOf: string;
  job: string;
  interactions: number;
  parts: RungPart[];
  fact: string;
}

const RUNGS: Rung[] = [
  {
    id: "mitochondrion", name: "Mitochondrion", size: 1e-6, sizeLabel: "1 micrometre",
    partOf: "a living cell", madeOf: "membranes, enzymes and its own loop of DNA",
    job: "turns food and oxygen into the ATP the cell spends",
    interactions: 5,
    parts: [
      { name: "outer membrane", x: 0, y: -66, note: "lets small molecules through" },
      { name: "cristae", x: -44, y: -6, note: "folds that carry the enzymes" },
      { name: "matrix", x: 52, y: 26, note: "where the reactions happen" },
      { name: "its own DNA", x: -74, y: 24, note: "a loop, like a bacterium's" },
    ],
    fact: "One liver cell runs between 1 000 and 2 000 of these at once.",
  },
  {
    id: "cell", name: "Plant cell", size: 5e-5, sizeLabel: "50 micrometres",
    partOf: "a leaf", madeOf: "a wall, a nucleus, chloroplasts, a vacuole and mitochondria",
    job: "keeps itself alive and builds sugar from light",
    interactions: 7,
    parts: [
      { name: "cell wall", x: -112, y: -70, note: "stiff cellulose, holds the shape" },
      { name: "vacuole", x: 26, y: 6, note: "water store that keeps the cell firm" },
      { name: "nucleus", x: -66, y: 30, note: "holds the instructions" },
      { name: "chloroplast", x: 70, y: -52, note: "makes sugar from light" },
      { name: "mitochondrion", x: -20, y: 62, note: "the whole of the rung below" },
    ],
    fact: "A single leaf cell can hold 50 chloroplasts and hundreds of mitochondria.",
  },
  {
    id: "leaf", name: "Leaf", size: 0.1, sizeLabel: "10 centimetres",
    partOf: "a tree", madeOf: "veins, packed cells, a waxy skin and thousands of stomata",
    job: "catches light and trades gases with the air",
    interactions: 6,
    parts: [
      { name: "midrib", x: 0, y: 4, note: "the plumbing trunk line" },
      { name: "veins", x: 54, y: -34, note: "water in, sugar out" },
      { name: "blade", x: -66, y: -50, note: "the light-catching surface" },
      { name: "stoma", x: 62, y: 62, note: "a pore that opens and closes" },
    ],
    fact: "A leaf carries roughly 100 to 300 stomata on every square millimetre of its underside.",
  },
  {
    id: "tree", name: "Tree", size: 25, sizeLabel: "25 metres",
    partOf: "a forest", madeOf: "roots, trunk, branches and about 200 000 leaves",
    job: "lifts water from the soil and builds wood out of air",
    interactions: 6,
    parts: [
      { name: "roots", x: -30, y: 92, note: "draw water and hold the soil" },
      { name: "trunk", x: 6, y: 34, note: "carries water up, sugar down" },
      { name: "branches", x: 60, y: -26, note: "spread the leaves into the light" },
      { name: "canopy", x: -46, y: -74, note: "the tree's solar array" },
    ],
    fact: "A mature oak moves over 150 litres of water a day from soil to sky.",
  },
  {
    id: "forest", name: "Forest", size: 3e3, sizeLabel: "3 kilometres",
    partOf: "a river basin", madeOf: "thousands of trees, soil, fungi, animals and streams",
    job: "cycles water and carbon and shelters everything living in it",
    interactions: 8,
    parts: [
      { name: "canopy", x: -60, y: -58, note: "the top layer that takes the light" },
      { name: "understorey", x: 62, y: -14, note: "shade-tolerant young trees" },
      { name: "soil and fungi", x: -20, y: 74, note: "roots trade sugar for minerals" },
      { name: "stream", x: 74, y: 62, note: "carries the water out" },
    ],
    fact: "Fungal threads link tree roots across a whole forest, trading sugar for phosphorus.",
  },
  {
    id: "watershed", name: "River basin", size: 6e4, sizeLabel: "60 kilometres",
    partOf: "a continent", madeOf: "ridges, tributaries, a main river, lakes and forests",
    job: "collects every drop that falls on it and delivers it to the sea",
    interactions: 7,
    parts: [
      { name: "ridge line", x: -84, y: -66, note: "the edge of the basin" },
      { name: "tributaries", x: 30, y: -34, note: "small streams joining up" },
      { name: "main river", x: 8, y: 52, note: "the one way out" },
      { name: "lake", x: -62, y: 30, note: "stores water and slows it down" },
    ],
    fact: "Every point on land belongs to exactly one river basin. The boundary is a ridge, not a fence.",
  },
  {
    id: "continent", name: "Continent", size: 5e6, sizeLabel: "5 000 kilometres",
    partOf: "the planet Earth", madeOf: "mountain belts, plains, ice, rivers and coastlines",
    job: "carries the weather, the rivers and everything that lives on land",
    interactions: 6,
    parts: [
      { name: "mountain belt", x: -46, y: -40, note: "where plates collide" },
      { name: "river systems", x: 44, y: 18, note: "basins draining to the coast" },
      { name: "ice sheet", x: -6, y: -88, note: "fresh water locked up as solid" },
      { name: "coastline", x: 82, y: 62, note: "the land and ocean boundary" },
    ],
    fact: "Continental crust is about 35 km thick, roughly five times thicker than ocean crust.",
  },
  {
    id: "earth", name: "Earth", size: 1.27e7, sizeLabel: "12 700 kilometres",
    partOf: "the Solar System", madeOf: "geosphere, hydrosphere, atmosphere and biosphere",
    job: "cycles matter round and round while energy passes through",
    interactions: 8,
    parts: [
      { name: "geosphere", x: -40, y: 52, note: "rock, from crust to core" },
      { name: "hydrosphere", x: 62, y: 10, note: "ocean, ice and rivers" },
      { name: "atmosphere", x: 4, y: -104, note: "a shell of gas 100 km deep" },
      { name: "biosphere", x: -70, y: -34, note: "every living thing, in a thin skin" },
    ],
    fact: "Earth is 12 700 km across and its breathable air is only about 10 km deep.",
  },
];

interface LadderState {
  pos: number;
  target: number;
  focus: number;
  seen: boolean[];
}

const ladderModel: SimModel<LadderState> = {
  init(params) {
    const seen = RUNGS.map(() => false);
    const start = Math.round(params.rung as number);
    seen[start] = true;
    return { pos: start, target: start, focus: -1, seen };
  },

  applyParams(state, params, prev) {
    if (params.rung !== prev.rung) {
      const target = Math.round(params.rung as number);
      const seen = state.seen.slice();
      seen[target] = true;
      return { ...state, target, seen, focus: -1 };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let focus = state.focus;
    const here = RUNGS[Math.round(state.target)];
    for (const input of inputs) {
      if (input.type === "pointerdown") focus = (focus + 2) % (here.parts.length + 1) - 1;
    }
    if (dt <= 0) return focus === state.focus ? state : { ...state, focus };
    const target = Math.round(params.rung as number);
    const seen = state.seen[target] ? state.seen : state.seen.map((v, i) => v || i === target);
    const pos = state.pos + (target - state.pos) * Math.min(1, dt * 3.2);
    return { ...state, pos, target, seen, focus };
  },

  readouts(state) {
    const here = RUNGS[Math.round(state.target)];
    const below = RUNGS[Math.max(0, Math.round(state.target) - 1)];
    const earth = RUNGS[RUNGS.length - 1];
    return [
      {
        key: "size", label: "Size of this system", quantity: q(here.size, "length"), unit: "m",
        semantic: "distance", graphable: true,
      },
      {
        key: "exponent", label: "Powers of ten (log of the size in metres)",
        quantity: q(Math.log10(here.size), "ratio"), semantic: "time", graphable: true,
        bands: ["6-8", "9-12"],
      },
      {
        key: "stepsToEarth", label: "Steps of ten up to Earth",
        quantity: q(Math.log10(earth.size / here.size), "ratio"), semantic: "distance", graphable: true,
      },
      { key: "parts", label: "Named parts at this level", quantity: q(here.parts.length, "count"), semantic: "mass", graphable: false },
      {
        key: "timesBigger", label: "Times bigger than the level below",
        quantity: q(here.size / below.size, "ratio"), semantic: "distance", graphable: false,
        bands: ["6-8", "9-12"],
      },
      {
        key: "visited", label: "Rungs visited", quantity: q(state.seen.filter(Boolean).length, "count"),
        semantic: "energy-kinetic", graphable: false,
      },
    ];
  },

  facts(state) {
    const here = RUNGS[Math.round(state.target)];
    return {
      rung: here.id,
      name: here.name,
      partOf: here.partOf,
      size: here.size,
      exponent: Math.log10(here.size),
      parts: here.parts.length,
      interactions: here.interactions,
      visited: state.seen.filter(Boolean).length,
      allSeen: state.seen.every(Boolean),
      focus: state.focus,
    };
  },
};

/* ---------------- artwork for each rung ---------------- */

function drawTreeShape(
  ctx: CanvasRenderingContext2D, theme: ThemeColors, x: number, y: number, h: number,
  t: number, sway: number, tint: number,
) {
  const wood = mixHex(theme.sci["decomposer"], theme.surface, tint);
  const leaf = mixHex(theme.sci["producer"], theme.surface, tint);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = wood;
  ctx.lineWidth = Math.max(1.5, h * 0.07);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.04, -h * 0.4, 0, -h * 0.66);
  ctx.stroke();
  const s = Math.sin(t * 0.7 + x * 0.05) * sway;
  for (const [dx, dy, r] of [[-h * 0.22, -h * 0.7, h * 0.24], [h * 0.2, -h * 0.76, h * 0.21],
    [0, -h * 0.9, h * 0.26]] as [number, number, number][]) {
    sphere(ctx, dx + s, dy, r, leaf, { glow: 0.06 });
  }
  ctx.restore();
}

function drawRungArt(
  ctx: CanvasRenderingContext2D, rung: Rung, theme: ThemeColors, t: number,
  flows: boolean, focus: number,
) {
  const dark = isDarkTheme(theme);
  const leafC = theme.sci["producer"];
  const water = theme.sci["liquid"];
  const rock = theme.sci["mass"];
  const air = theme.sci["gas"];
  const gold = theme.sci["current"];
  const purple = theme.sci["momentum"];

  switch (rung.id) {
    case "mitochondrion": {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 132, 68, 0, 0, Math.PI * 2);
      ctx.fillStyle = hexA(mixHex(purple, theme.surface, 0.6), 0.9);
      ctx.fill();
      innerGlow(ctx, (c) => { c.beginPath(); c.ellipse(0, 0, 132, 68, 0, 0, Math.PI * 2); }, purple,
        { inset: 16, alpha: 0.4 });
      ctx.strokeStyle = mixHex(purple, "#000000", 0.15);
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = hexA(mixHex(purple, "#ffffff", 0.5), 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 122, 58, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Cristae: the folds that carry the enzyme chains.
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 120, 56, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = hexA(mixHex(purple, "#ffffff", 0.35), 0.95);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      for (let i = 0; i < 7; i++) {
        const cxp = -100 + i * 33;
        ctx.beginPath();
        ctx.moveTo(cxp, -58);
        ctx.quadraticCurveTo(cxp + 26, 0, cxp, 58);
        ctx.stroke();
      }
      ctx.restore();
      // The proton gradient, running along the folds.
      if (flows) {
        for (let i = 0; i < 7; i++) {
          const cxp = -100 + i * 33;
          dashFlow(ctx, [{ x: cxp, y: 50 }, { x: cxp + 22, y: 0 }, { x: cxp, y: -50 }], gold,
            t * 30 + i * 8, { width: 2, dash: 3, gap: 8, alpha: 0.85, glow: 3 });
        }
        for (let i = 0; i < 5; i++) {
          const f = ((t * 0.4 + i * 0.2) % 1);
          ctx.save();
          ctx.globalAlpha = 0.85 * (1 - f);
          sphere(ctx, 90 + f * 70, -20 + i * 14 - f * 24, 4.5, gold, { glow: 0.9 });
          ctx.restore();
        }
        caption(ctx, 168, -46, "ATP out", theme, { size: 11, color: gold, weight: 700 });
      }
      sphere(ctx, -74, 24, 9, mixHex(gold, "#ffffff", 0.2), { glow: 0.4 });
      ctx.restore();
      break;
    }

    case "cell": {
      const w = 250, h = 172;
      ctx.save();
      material(ctx, -w / 2, -h / 2, w, h, mixHex(leafC, "#000000", 0.35), 16);
      material(ctx, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, mixHex(leafC, theme.surface, dark ? 0.62 : 0.72), 12);
      glass(ctx, -66, -50, 150, 104, 22, theme, { alpha: dark ? 0.16 : 0.3, tint: water });
      caption(ctx, 10, 2, "vacuole", theme, { align: "center", size: 10.5, color: theme.inkSoft });
      sphere(ctx, -66, 30, 26, mixHex(purple, "#000000", 0.05), { glow: 0.2 });
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = mixHex(purple, "#ffffff", 0.4);
      for (let i = 0; i < 8; i++) {
        const a = i * 0.9 + t * 0.2;
        ctx.beginPath();
        ctx.arc(-66 + Math.cos(a) * 13, 30 + Math.sin(a) * 13, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Chloroplasts stream round the inside of the wall.
      for (let i = 0; i < 9; i++) {
        const u = ((t * 0.05 + i / 9) % 1) * 4;
        const seg = Math.floor(u), fr = u - seg;
        const corners: [number, number][] = [[-100, -62], [100, -62], [100, 62], [-100, 62]];
        const a = corners[seg % 4], b = corners[(seg + 1) % 4];
        const px = lerp(a[0], b[0], fr), py = lerp(a[1], b[1], fr);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(seg * Math.PI / 2 + 0.2);
        ctx.fillStyle = mixHex(leafC, "#000000", 0.08);
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = hexA(mixHex(leafC, "#ffffff", 0.45), 0.8);
        ctx.beginPath(); ctx.ellipse(-3, -2.4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // Mitochondria: the rung below, sitting inside this one.
      for (const [mx, my] of [[-20, 62], [64, 58], [-4, -66]] as [number, number][]) {
        ctx.save();
        ctx.translate(mx, my);
        ctx.fillStyle = mixHex(purple, theme.surface, 0.3);
        ctx.beginPath(); ctx.ellipse(0, 0, 17, 8.5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = hexA(mixHex(purple, "#ffffff", 0.4), 0.9);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) { ctx.moveTo(-9 + i * 6, -6); ctx.lineTo(-6 + i * 6, 6); }
        ctx.stroke();
        ctx.restore();
      }
      if (flows) {
        dashFlow(ctx, [{ x: -104, y: 40 }, { x: -40, y: 20 }, { x: 40, y: -10 }], water, t * 22,
          { width: 2, dash: 4, gap: 8, alpha: 0.7, glow: 3 });
      }
      ctx.restore();
      break;
    }

    case "leaf": {
      ctx.save();
      // Blade.
      ctx.beginPath();
      ctx.moveTo(-140, 6);
      ctx.quadraticCurveTo(-40, -104, 132, -30);
      ctx.quadraticCurveTo(-10, 76, -140, 6);
      ctx.closePath();
      ctx.fillStyle = gradient(ctx, -140, -104, 280, 180, [
        mixHex(leafC, "#ffffff", 0.32), leafC, mixHex(leafC, "#000000", 0.28),
      ], 115);
      ctx.fill();
      rimLight(ctx, (c) => {
        c.beginPath();
        c.moveTo(-140, 6);
        c.quadraticCurveTo(-40, -104, 132, -30);
        c.quadraticCurveTo(-10, 76, -140, 6);
        c.closePath();
      }, mixHex(leafC, "#ffffff", 0.75), { width: 2, alpha: 0.8, bounds: { x: -140, y: -104, w: 280, h: 180 } });
      // Midrib and veins.
      ctx.strokeStyle = hexA(mixHex(leafC, "#ffffff", 0.55), 0.95);
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-134, 4);
      ctx.quadraticCurveTo(-10, -12, 128, -30);
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 1; i < 8; i++) {
        const f = i / 8;
        const bx = lerp(-134, 128, f), by = lerp(4, -30, f) - Math.sin(f * 3) * 6;
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 14, by - 34 * (1 - f * 0.5), bx + 26, by - 46 * (1 - f * 0.6));
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 10, by + 26 * (1 - f * 0.4), bx + 22, by + 36 * (1 - f * 0.5));
      }
      ctx.stroke();
      if (flows) {
        dashFlow(ctx, [{ x: -134, y: 4 }, { x: 0, y: -14 }, { x: 128, y: -30 }], water, t * 26,
          { width: 2.4, dash: 4, gap: 7, glow: 3 });
      }
      // A magnified stoma, because the pore is what makes it a gas exchanger.
      ctx.save();
      ctx.translate(66, 66);
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fillStyle = hexA(mixHex(leafC, theme.surface, 0.55), 0.96);
      ctx.fill();
      ctx.strokeStyle = hexA(theme.ink, 0.35);
      ctx.lineWidth = 2;
      ctx.stroke();
      const gape = 5 + 3 * pulse(t, 0.3);
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(0, sgn * (gape + 5), 20, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = mixHex(leafC, "#000000", 0.2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, gape, 0, 0, Math.PI * 2);
      ctx.fillStyle = mixHex(theme.ink, theme.surface, 0.35);
      ctx.fill();
      if (flows) {
        arrow(ctx, -22, -26, -6, -6, air, { width: 1.6, head: 7 });
        arrow(ctx, 8, -6, 24, -28, theme.sci["gas"], { width: 1.6, head: 7 });
      }
      ctx.restore();
      ctx.strokeStyle = hexA(theme.ink, 0.3);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(40, 40); ctx.lineTo(8, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      break;
    }

    case "tree": {
      ctx.save();
      const groundY = 96;
      gradientFill(ctx, -170, groundY, 340, 90, [
        mixHex(theme.sci["decomposer"], "#ffffff", 0.1), mixHex(theme.sci["decomposer"], "#000000", 0.45),
      ], 90);
      ctx.strokeStyle = mixHex(theme.sci["decomposer"], "#ffffff", 0.25);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.42;
        ctx.moveTo(0, groundY);
        ctx.quadraticCurveTo(Math.cos(a) * 40, groundY + 26, Math.cos(a) * 78, groundY + 62);
      }
      ctx.stroke();
      ctx.strokeStyle = gradient(ctx, -20, -60, 40, 160,
        [mixHex(theme.sci["decomposer"], "#ffffff", 0.28), mixHex(theme.sci["decomposer"], "#000000", 0.3)], 0);
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(8, 10, 2, -46);
      ctx.stroke();
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(2, -20); ctx.quadraticCurveTo(-40, -46, -62, -74);
      ctx.moveTo(2, -34); ctx.quadraticCurveTo(44, -52, 66, -30);
      ctx.moveTo(2, -46); ctx.quadraticCurveTo(10, -76, 26, -92);
      ctx.stroke();
      const sway = Math.sin(t * 0.8) * 4;
      for (const [bx, by, br] of [[-56, -84, 46], [56, -46, 38], [16, -104, 52], [-16, -60, 40]] as
        [number, number, number][]) {
        sphere(ctx, bx + sway * 0.5, by, br, mixHex(leafC, "#000000", 0.06), { glow: 0.1 });
      }
      if (flows) {
        dashFlow(ctx, [{ x: -4, y: groundY }, { x: 4, y: 10 }, { x: 0, y: -50 }], water, t * 24,
          { width: 3, dash: 4, gap: 8, glow: 4 });
        dashFlow(ctx, [{ x: 10, y: -50 }, { x: 12, y: 10 }, { x: 6, y: groundY }], gold, t * 20,
          { width: 2.4, dash: 3, gap: 9, glow: 4 });
        for (let i = 0; i < 4; i++) {
          const f = ((t * 0.3 + i * 0.25) % 1);
          arrow(ctx, 120, -120 + f * 30 + i * 8, 96, -104 + f * 30 + i * 8, theme.sci["light"], { width: 1.5 });
        }
      }
      ctx.restore();
      break;
    }

    case "forest": {
      ctx.save();
      const horizonY = 30;
      gradientFill(ctx, -190, -140, 380, 300, [
        hexA(mixHex(air, theme.surface, 0.5), 0.7), hexA(mixHex(leafC, theme.surface, 0.65), 0.6),
      ], 90);
      // Three depth layers, each paler and smaller than the one in front.
      for (let layer = 0; layer < 3; layer++) {
        const tint = 0.55 - layer * 0.22;
        const yy = horizonY - 30 + layer * 34;
        const hh = 52 + layer * 30;
        for (let i = 0; i < 9 - layer; i++) {
          const x = -170 + i * (340 / (8 - layer)) + (layer % 2 ? 16 : 0);
          drawTreeShape(ctx, theme, x, yy + hh * 0.5, hh, t, layer === 2 ? 3 : 1, tint);
        }
        if (layer < 2) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          gradientFill(ctx, -190, yy + hh * 0.3, 380, 40, [
            hexA(theme.surface, 0), hexA(theme.surface, 0.9),
          ], 90);
          ctx.restore();
        }
      }
      gradientFill(ctx, -190, 96, 380, 70, [
        mixHex(theme.sci["decomposer"], "#000000", 0.15), mixHex(theme.sci["decomposer"], "#000000", 0.55),
      ], 90);
      // The stream that carries the water out of the forest.
      const stream: { x: number; y: number }[] = [];
      for (let i = 0; i <= 10; i++) {
        const f = i / 10;
        stream.push({ x: lerp(-186, 186, f), y: 122 + Math.sin(f * 6 + 1) * 16 });
      }
      ribbon(ctx, stream, 20, hexA(mixHex(water, "#ffffff", 0.35), 0.95), hexA(water, 0.85),
        { taper: 0.3, core: true });
      if (flows) {
        dashFlow(ctx, stream, mixHex(water, "#ffffff", 0.6), t * 34, { width: 2.4, dash: 6, gap: 10, glow: 3 });
        for (let i = 0; i < 5; i++) {
          const f = ((t * 0.16 + i * 0.2) % 1);
          ctx.save();
          ctx.globalAlpha = 0.3 * Math.sin(f * Math.PI);
          ctx.fillStyle = air;
          ctx.beginPath();
          ctx.ellipse(-150 + f * 300, -80 - i * 8, 54, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
      break;
    }

    case "watershed": {
      ctx.save();
      gradientFill(ctx, -190, -140, 380, 300, [
        mixHex(leafC, theme.surface, 0.55), mixHex(theme.sci["decomposer"], theme.surface, 0.4),
      ], 110);
      // Ridge lines that fence the basin in.
      ctx.strokeStyle = hexA(mixHex(rock, "#000000", 0.2), 0.9);
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-186, -30);
      ctx.lineTo(-120, -92); ctx.lineTo(-52, -50); ctx.lineTo(10, -104);
      ctx.lineTo(86, -46); ctx.lineTo(150, -96); ctx.lineTo(186, -34);
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = hexA(rock, 0.8);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-186, -18 + i * 16);
        ctx.quadraticCurveTo(0, -60 + i * 18, 186, -22 + i * 16);
        ctx.stroke();
      }
      ctx.restore();
      // A branching river: tributaries joining into one way out.
      const trunkPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 12; i++) {
        const f = i / 12;
        trunkPts.push({ x: lerp(-30, 120, f) + Math.sin(f * 5) * 18, y: lerp(-40, 132, f) });
      }
      ribbon(ctx, trunkPts, 16, hexA(mixHex(water, "#ffffff", 0.4), 0.95), hexA(water, 0.9),
        { taper: 0.25, core: true });
      for (const [sx, sy, ex, ey] of [[-150, -60, -32, -34], [-96, -20, -20, -12], [96, -34, 34, 22],
        [150, -50, 62, 50], [-140, 40, 10, 62]] as [number, number, number, number][]) {
        const br: { x: number; y: number }[] = [];
        for (let i = 0; i <= 8; i++) {
          const f = i / 8;
          br.push({ x: lerp(sx, ex, f) + Math.sin(f * 4 + sx) * 7, y: lerp(sy, ey, f) });
        }
        ribbon(ctx, br, 8, hexA(mixHex(water, "#ffffff", 0.3), 0.9), hexA(water, 0.8), { taper: 0.5 });
        if (flows) dashFlow(ctx, br, mixHex(water, "#ffffff", 0.7), t * 26, { width: 1.8, dash: 4, gap: 8 });
      }
      ctx.save();
      ctx.fillStyle = hexA(mixHex(water, "#000000", 0.1), 0.95);
      ctx.beginPath();
      ctx.ellipse(-66, 30, 40, 20, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexA(mixHex(water, "#ffffff", 0.5), 0.7);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 7; i++) drawTreeShape(ctx, theme, -170 + i * 26, 96 + (i % 2) * 8, 28, t, 1, 0.25);
      if (flows) {
        dashFlow(ctx, trunkPts, mixHex(water, "#ffffff", 0.75), t * 30, { width: 3, dash: 6, gap: 9, glow: 4 });
        for (let i = 0; i < 12; i++) {
          const f = ((t * 0.5 + i * 0.13) % 1);
          ctx.save();
          ctx.globalAlpha = 0.5 * (1 - f);
          ctx.strokeStyle = water;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const rx = -170 + i * 30;
          ctx.moveTo(rx, -130 + f * 40);
          ctx.lineTo(rx - 3, -118 + f * 40);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
      break;
    }

    case "continent": {
      ctx.save();
      gradientFill(ctx, -190, -140, 380, 300, [hexA(water, 0.85), hexA(mixHex(water, "#000000", 0.35), 0.9)], 110);
      ctx.beginPath();
      ctx.moveTo(-150, -70);
      ctx.bezierCurveTo(-60, -128, 70, -112, 128, -56);
      ctx.bezierCurveTo(168, -8, 116, 76, 34, 96);
      ctx.bezierCurveTo(-42, 116, -142, 60, -150, -70);
      ctx.closePath();
      ctx.fillStyle = gradient(ctx, -160, -130, 340, 240, [
        mixHex(leafC, "#ffffff", 0.2), mixHex(theme.sci["decomposer"], theme.surface, 0.25),
        mixHex(leafC, "#000000", 0.15),
      ], 115);
      ctx.fill();
      ctx.save();
      ctx.clip();
      // Mountain belt.
      ctx.strokeStyle = hexA(mixHex(rock, "#ffffff", 0.25), 0.95);
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      for (let row = 0; row < 3; row++) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const mx = -110 + i * 20;
          const my = -46 + row * 15 + (i % 2) * 6;
          ctx.moveTo(mx - 9, my + 7); ctx.lineTo(mx, my - 8); ctx.lineTo(mx + 9, my + 7);
        }
        ctx.stroke();
      }
      // Ice at the top, rivers running to the sea.
      ctx.fillStyle = hexA(mixHex(theme.sci["cold"], "#ffffff", 0.7), 0.85);
      ctx.beginPath();
      ctx.ellipse(-6, -104, 92, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexA(water, 0.9);
      ctx.lineWidth = 2.4;
      for (const [sx, sy] of [[-70, -20], [10, -14], [72, -30]] as [number, number][]) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + 20, sy + 50, sx + 6, sy + 108);
        ctx.stroke();
      }
      if (flows) {
        for (let i = 0; i < 4; i++) {
          const f = ((t * 0.08 + i * 0.25) % 1);
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.ellipse(-190 + f * 380, -80 + i * 46, 60, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.strokeStyle = hexA(mixHex(theme.ink, theme.surface, 0.4), 0.6);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "earth":
    default: {
      const R = 118;
      ctx.save();
      glow(ctx, 0, 0, R * 1.7, mixHex(air, "#ffffff", 0.3), 0.34);
      sphere(ctx, 0, 0, R, mixHex(water, "#000000", 0.12), { glow: 0.14 });
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2); ctx.clip();
      // Land masses, drifting slowly so the planet reads as turning.
      const spin = t * 0.08;
      for (let i = 0; i < 5; i++) {
        const cxp = ((i * 96 + spin * 160) % (R * 3)) - R * 1.5;
        const cyp = -70 + i * 34;
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.fillStyle = mixHex(leafC, "#000000", 0.06 + (i % 3) * 0.05);
        ctx.beginPath();
        ctx.moveTo(-44, 0);
        ctx.bezierCurveTo(-24, -30, 26, -34, 46, -6);
        ctx.bezierCurveTo(56, 16, 10, 36, -18, 26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = hexA(mixHex(theme.sci["cold"], "#ffffff", 0.75), 0.85);
      ctx.beginPath(); ctx.ellipse(0, -R + 12, R * 0.7, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, R - 12, R * 0.6, 18, 0, 0, Math.PI * 2); ctx.fill();
      // Cloud bands.
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 6; i++) {
        const cy2 = -88 + i * 34;
        const off = ((t * 12 + i * 60) % (R * 2.6)) - R * 1.3;
        ctx.beginPath();
        ctx.ellipse(off, cy2, 46, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Night side.
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = gradient(ctx, -R, -R, R * 2, R * 2, [
        hexA("#000000", 0), hexA("#000000", 0.15), hexA("#000000", 0.85),
      ], 0);
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();
      ctx.restore();
      // The atmosphere, drawn to scale: a thin shell, not a halo.
      ctx.strokeStyle = hexA(mixHex(air, "#ffffff", 0.45), 0.85);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, R + 5, 0, Math.PI * 2); ctx.stroke();
      if (flows) {
        for (let i = 0; i < 3; i++) {
          const a0 = t * 0.3 + i * 2.1;
          dashFlow(ctx, [
            { x: Math.cos(a0) * (R + 24), y: Math.sin(a0) * (R + 24) },
            { x: Math.cos(a0 + 0.8) * (R + 30), y: Math.sin(a0 + 0.8) * (R + 30) },
            { x: Math.cos(a0 + 1.6) * (R + 24), y: Math.sin(a0 + 1.6) * (R + 24) },
          ], air, t * 20, { width: 2, dash: 4, gap: 8, alpha: 0.7 });
        }
        for (let i = 0; i < 5; i++) {
          const yy = -80 + i * 40;
          arrow(ctx, -R - 84, yy, -R - 26, yy, theme.sci["light"], { width: 1.8 });
        }
        caption(ctx, -R - 60, -110, "sunlight in", theme, { align: "center", size: 10.5, color: theme.sci["light"], weight: 700 });
      }
      ctx.restore();
      break;
    }
  }

  // The part the student has clicked through to.
  if (focus >= 0 && focus < rung.parts.length) {
    const p = rung.parts[focus];
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.5 + 0.4 * pulse(t, 0.8));
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -t * 22;
    ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function renderLadder(rc: RenderContext<LadderState>) {
  const { ctx, state: s, params, theme, width: W, height: H, band, overlays, time: t } = rc;
  const dark = isDarkTheme(theme);
  const flows = params.flows as boolean;
  const idx = Math.round(s.target);
  const here = RUNGS[idx];
  const lo = Math.max(0, Math.min(RUNGS.length - 1, Math.floor(s.pos)));
  const hi = Math.max(0, Math.min(RUNGS.length - 1, lo + 1));
  const f = clamp01(s.pos - lo);

  /* ---- the observatory ---- */
  sky(ctx, W, H, theme, idx >= 6 ? "space" : idx <= 1 ? "microscope" : "indoor");
  if (idx >= 6) {
    ctx.save();
    for (let i = 0; i < 120; i++) {
      const sxp = ((i * 271) % 1000) / 1000 * W;
      const syp = ((i * 613) % 1000) / 1000 * H;
      ctx.globalAlpha = 0.2 + 0.5 * ((i % 7) / 7) * (0.5 + 0.5 * pulse(t + i, 0.1));
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(sxp, syp, 0.5 + (i % 3) * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  gradientFill(ctx, 0, 0, W, H, [
    hexA(mixHex(theme.surfaceAlt, theme.ink, dark ? 0.1 : 0.04), 0.5),
    hexA(theme.surface, 0),
    hexA(mixHex(theme.surfaceAlt, theme.ink, dark ? 0.18 : 0.08), 0.6),
  ], 90);
  noiseWash(ctx, 0, 0, W, H, { alpha: 0.04, seed: 77, count: 260, color: dark ? "#ffffff" : "#000000" });

  /* ---- the logarithmic rule down the left edge ---- */
  const rulX = 54;
  const rulTop = 74, rulBot = H - 76;
  const EXP_MIN = -6.4, EXP_MAX = 7.4;
  const expToY = (e: number) => lerp(rulBot, rulTop, (e - EXP_MIN) / (EXP_MAX - EXP_MIN));
  metal(ctx, rulX - 11, rulTop - 18, 22, rulBot - rulTop + 36, theme.sci["mass"], { radius: 8, angle: 0 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let e = -6; e <= 7; e++) {
    const y = expToY(e);
    ctx.moveTo(rulX - 9, y); ctx.lineTo(rulX + 9, y);
  }
  ctx.stroke();
  ctx.restore();
  const tickLabels: [number, string][] = [
    [-6, "1 µm"], [-3, "1 mm"], [0, "1 m"], [3, "1 km"], [6, "1000 km"],
  ];
  for (const [e, txt] of tickLabels) {
    caption(ctx, rulX + 16, expToY(e), txt, theme, { size: 10, color: theme.inkSoft, weight: 600 });
  }
  for (let i = 0; i < RUNGS.length; i++) {
    const y = expToY(Math.log10(RUNGS[i].size));
    const on = i === idx;
    sphere(ctx, rulX, y, on ? 7 : 4, on ? theme.accent : (s.seen[i] ? theme.sci["energy-kinetic"] : theme.inkSoft));
  }
  const sliderY = expToY(lerp(Math.log10(RUNGS[lo].size), Math.log10(RUNGS[hi].size), f));
  softShadow(ctx, () => {
    metal(ctx, rulX - 20, sliderY - 11, 40, 22, theme.sci["current"], { radius: 5, angle: 100 });
  }, { blur: 10, dy: 3, alpha: 0.3 });
  caption(ctx, rulX, sliderY, num(Math.log10(here.size), 1), theme, {
    align: "center", size: 10.5, color: theme.ink, weight: 800,
  });
  caption(ctx, rulX, rulTop - 34, "metres", theme, { align: "center", size: 10, color: theme.inkSoft });
  caption(ctx, rulX, rulTop - 48, "powers of ten", theme, { align: "center", size: 10.5, color: theme.ink, weight: 700 });

  /* ---- the stage: the current rung, cross-fading with its neighbour ---- */
  const stageX = (rulX + 40 + (W - 260)) / 2;
  const stageY = H * 0.48;
  const base = Math.min((W - rulX - 300) / 340, (H - 190) / 300);
  const k = Math.max(0.42, base);
  const pairs: [number, number, number][] = lo === hi
    ? [[lo, 1, 1]]
    : [[lo, 1 - f, lerp(1, 0.32, f)], [hi, f, lerp(2.6, 1, f)]];
  for (const [ri, alpha, scale] of pairs) {
    if (alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = clamp01(alpha);
    ctx.translate(stageX, stageY);
    ctx.scale(k * scale, k * scale);
    drawRungArt(ctx, RUNGS[ri], theme, t, flows, alpha > 0.55 ? s.focus : -1);
    ctx.restore();
  }

  /* ---- labels, parked well clear of the artwork ---- */
  if (overlays.labels !== false && f < 0.25) {
    let li = 0, ri = 0;
    for (let i = 0; i < here.parts.length; i++) {
      const p = here.parts[i];
      const px = stageX + p.x * k, py = stageY + p.y * k;
      const toLeft = px < stageX;
      const ty = 132 + (toLeft ? li : ri) * 40;
      if (ty > H - 150) continue;
      labelLeader(ctx, px, py, toLeft ? rulX + 74 : W - 264, ty, p.name, theme, {
        color: i === s.focus ? theme.accent : theme.inkSoft,
        size: 11, align: toLeft ? "left" : "right",
        sub: band === "3-5" ? undefined : p.note,
      });
      if (toLeft) li++; else ri++;
    }
  }

  /* ---- the nesting statement ---- */
  const cardW = Math.min(238, W * 0.27);
  const cardX = W - cardW - 16;
  panelCard(ctx, cardX, 16, cardW, 96, theme, "THIS RUNG");
  caption(ctx, cardX + 14, 46, here.name, theme, { size: 17, color: theme.ink, weight: 800 });
  caption(ctx, cardX + 14, 68, here.sizeLabel, theme, { size: 12, color: theme.accent, weight: 700 });
  caption(ctx, cardX + 14, 88, `about ${here.size.toExponential(1)} m across`, theme,
    { size: 10.5, color: theme.inkSoft });

  panelCard(ctx, cardX, 124, cardW, 92, theme, "NESTED BOTH WAYS");
  caption(ctx, cardX + 14, 152, "it is a part of", theme, { size: 10, color: theme.inkSoft });
  wrapLeft(ctx, here.partOf, cardX + 14, 168, cardW - 28, theme, 11.5, theme.ink);
  caption(ctx, cardX + 14, 190, "and it is made of", theme, { size: 10, color: theme.inkSoft });
  wrapLeft(ctx, here.madeOf, cardX + 14, 206, cardW - 28, theme, 11, theme.inkSoft);

  if (overlays.tests !== false) {
    systemTestCard(ctx, cardX, 228, cardW, theme, here.parts.length, here.interactions, here.job, t);
  }

  /* ---- the job, and the fact worth keeping ---- */
  panelCard(ctx, cardX, 330, cardW, 88, theme, "ITS JOB");
  wrapLeft(ctx, here.job, cardX + 14, 358, cardW - 28, theme, 11.5, theme.ink);

  /* ---- how far this rung is from the two ends ---- */
  const earth = RUNGS[RUNGS.length - 1];
  const cellRung = RUNGS[1];
  const stepsUp = Math.log10(earth.size / here.size);
  const stepsDown = Math.log10(here.size / cellRung.size);
  badge(ctx, stageX, H - 96, `${num(stepsUp, 1)}`, theme, {
    align: "center", color: theme.sci["distance"], sub: "steps of ten up to Earth",
  });
  if (band !== "3-5") {
    badge(ctx, stageX - 168, H - 96, `${num(stepsDown, 1)}`, theme, {
      align: "center", color: theme.sci["time"], sub: "steps up from a cell",
    });
    const below = RUNGS[Math.max(0, idx - 1)];
    badge(ctx, stageX + 168, H - 96, idx === 0 ? "-" : `x${num(here.size / below.size, 0)}`, theme, {
      align: "center", color: theme.sci["mass"], sub: "bigger than the rung below",
    });
  }

  /* ---- the scale bar, and the fact ---- */
  wrapCaption(ctx, here.fact, stageX, H - 34, Math.min(W - rulX - 300, 520), theme, 11.5);
  caption(ctx, stageX, 44, "Every rung is a system. Only the size changes.", theme, {
    align: "center", size: 14, color: theme.ink, weight: 800,
  });
  ctx.save();
  ctx.globalAlpha = 0.4 + 0.35 * pulse(t, 0.45);
  caption(ctx, stageX, 66, "click the stage to point at one part", theme, {
    align: "center", size: 10.5, color: theme.accent, weight: 700,
  });
  ctx.restore();

  vignette(ctx, W, H, 0.2);
}

/** Left-aligned wrapped text, for the narrow cards in this sim. */
function wrapLeft(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number,
  theme: ThemeColors, size: number, color: string,
) {
  ctx.save();
  ctx.font = `600 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  ctx.restore();
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    caption(ctx, x, y + i * (size + 3), lines[i], theme, { size, color, weight: 600 });
  }
}

export const g6a1ScaleLadder: SimManifest<LadderState> = {
  id: "g6a1-scale-ladder",
  title: "The Scale Ladder",
  tagline: "Climb from a mitochondrion to the whole planet and ask the same three questions at every rung.",
  subject: "engineering",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8],
  standards: { ngss: ["MS-LS1-1", "MS-LS1-3", "MS-ESS2-1"], ccssMath: ["8.EE.A.3"] },
  learningGoals: [
    "Recognise the same system pattern at scales thirteen powers of ten apart.",
    "State what a given system is a part of and what it is made of.",
    "Compare sizes using powers of ten rather than raw numbers.",
  ],
  misconceptions: [
    "Only small things like cells are systems",
    "Only huge things like the Earth are systems",
    "Systems at different sizes work by different rules",
    "A thing stops being a system once you find what it is made of",
  ],
  interactionHint: "Move the ladder control, then click the stage to point at one part at a time.",
  params: {
    rung: {
      type: "number", label: "Rung of the ladder", kind: "count",
      min: 0, max: 7, step: 1, default: 2,
      marks: [
        { value: 0, label: "mitochondrion" },
        { value: 2, label: "leaf" },
        { value: 4, label: "forest" },
        { value: 7, label: "Earth" },
      ],
      help: "Each step is a bigger system that the one before it belongs to.",
    },
    flows: {
      type: "boolean", label: "Show what moves between the parts", default: true,
      help: "Matter and energy move at every scale, from protons to whole ocean currents.",
    },
  },
  overlays: [
    { key: "labels", label: "Part labels", default: true },
    { key: "tests", label: "The three questions", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model: ladderModel,
  render: renderLadder,
  labs: [
    {
      id: "same-questions",
      title: "The same three questions",
      question: "Does the word system mean the same thing at every size?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      setup: { rung: 0, flows: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you climb",
          instruction: "You will look at a mitochondrion, a forest and the Earth.",
          predict: {
            prompt: "Will all three pass the three system tests - parts, interactions, a job of its own?",
            options: [
              "Only the mitochondrion, because it is built to do something",
              "Only the Earth, because it is the biggest",
              "All three, because the tests do not care about size",
            ],
            correct: 2,
            reveal:
              "Systems thinking is scale free. The same three questions get a yes at one micrometre and at "
              + "twelve thousand seven hundred kilometres.",
          },
        },
        {
          id: "small",
          phase: "measure",
          title: "Start at the bottom",
          instruction: "Sit on rung 0 and record the size and the number of parts.",
          requireData: 1,
          check: { describe: "On the mitochondrion rung", test: (v) => v.facts.rung === "mitochondrion" },
        },
        {
          id: "middle",
          phase: "measure",
          title: "Climb to the forest",
          instruction: "Move to rung 4 and record again.",
          requireData: 2,
          check: { describe: "On the forest rung", test: (v) => v.facts.rung === "forest" },
        },
        {
          id: "top",
          phase: "measure",
          title: "All the way to the planet",
          instruction: "Move to rung 7 and record a third row.",
          requireData: 3,
          check: { describe: "On the Earth rung", test: (v) => v.facts.rung === "earth" },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the pattern",
          instruction: "Compare the three rows in your table.",
          write: {
            prompt: "What stayed the same across all three rungs, and what changed?",
            placeholder: "At every rung there were ... The only thing that really changed was ...",
          },
        },
      ],
    },
    {
      id: "powers-of-ten",
      title: "How far is a cell from a planet?",
      question: "How many steps of ten separate a plant cell from the Earth?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      setup: { rung: 1, flows: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Guess the gap",
          instruction: "A plant cell is 50 micrometres across. Earth is 12 700 kilometres across.",
          predict: {
            prompt: "How many times of ten do you multiply a cell by to reach the Earth?",
            options: ["About 4", "About 8", "About 11", "About 20"],
            correct: 2,
            reveal:
              "Fifty micrometres is 5 times ten to the minus five metres, and Earth is 1.27 times ten to the "
              + "seventh. That is a gap of about 11.4 powers of ten.",
          },
        },
        {
          id: "read-cell",
          phase: "measure",
          title: "Read the small end",
          instruction: "On rung 1, record the size and the power of ten.",
          requireData: 1,
          check: { describe: "On the plant cell rung", test: (v) => v.facts.rung === "cell" },
        },
        {
          id: "climb",
          phase: "measure",
          title: "Climb one rung at a time",
          instruction: "Record a row at every rung from 2 up to 7, watching the slider on the rule.",
          requireData: 7,
          hints: [
            "The rule is logarithmic, so equal steps on it mean equal multiplications.",
            "Notice how uneven the real rungs are: cell to leaf is a bigger jump than tree to forest.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Do the subtraction",
          instruction: "Subtract the power of ten at the cell from the one at the Earth.",
          write: {
            prompt: "Write the two exponents and their difference, and say what that difference means.",
            placeholder: "The cell is 10 to the ... and Earth is 10 to the ..., so the gap is ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the ladder",
          instruction: "The ladder has only eight rungs but spans thirteen powers of ten.",
          write: {
            prompt: "Why is a logarithmic scale the only sensible way to draw this ladder?",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "climb-it-all",
      title: "Climb the whole ladder",
      brief: "Visit every rung from the mitochondrion to the Earth.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { rung: 0, flows: true },
      goal: { describe: "Four or more rungs visited", test: (v) => (v.facts.visited as number) >= 4 },
      stars: {
        two: { describe: "Six rungs visited", test: (v) => (v.facts.visited as number) >= 6 },
        three: { describe: "Every rung visited", test: (v) => v.facts.allSeen === true },
      },
      hints: ["Take them in order. Each rung is a part of the one above it."],
    },
    {
      id: "find-the-scale",
      title: "Find the sixty kilometre system",
      brief: "Stop on the rung whose system is about ten to the power of five metres across.",
      bands: ["6-8", "9-12"],
      setup: { rung: 0, flows: true },
      goal: {
        describe: "On a rung between 10 kilometres and 1000 kilometres across",
        test: (v) => Math.abs((v.facts.exponent as number) - 4.8) < 0.6,
      },
      stars: {
        two: {
          describe: "On that rung with every smaller rung already visited",
          test: (v) => Math.abs((v.facts.exponent as number) - 4.8) < 0.6 && (v.facts.visited as number) >= 6,
        },
      },
      hints: [
        "Ten to the fifth metres is a hundred thousand metres, which is a hundred kilometres.",
        "Read the number on the brass slider: it is the power of ten you are standing on.",
      ],
    },
  ],
};
