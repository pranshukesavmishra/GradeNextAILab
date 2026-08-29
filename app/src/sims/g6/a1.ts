import type { RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex, roundRect } from "@ui/draw";
import {
  arcGauge, badge, bevelRect, caption, clamp01, contactShadow, dashFlow, easeInOut,
  glass, glow, gradientFill, hexA, innerGlow, isDarkTheme, labelLeader, lerp, material,
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
  const pegX = Math.round(W * 0.06), pegY = Math.round(H * 0.14), pegW = Math.min(170, W * 0.2), pegH = 118;
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
      wrapCaption(ctx, spec.reveal, inspectX, H - 66, Math.min(W - 60, 560), theme, 11.5);
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
      labelLeader(ctx, lightX - 16, lightY - 34, W - 300, 120, "traffic signal", theme,
        { color: theme.sci["field"], size: 11, sub: "tells riders when to go", align: "left" });
      labelLeader(ctx, bikeX, roadY - 30, 210, 190, "the bicycle", theme,
        { color: theme.accent, size: 11, sub: "one part of the street", align: "left" });
      labelLeader(ctx, bikeX + 4, roadY + 22, 190, 260, "the road", theme,
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
      caption(ctx, cx, cy - 234 * k, `rolling at ${num(5.5 * s.ride, 1)} m/s`, theme, {
        align: "center", size: 14, color: theme.sci["velocity"], weight: 800,
      });
      for (let i = 0; i < 5; i++) {
        const f = ((t * 1.4 + i * 0.2) % 1);
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - f);
        arrow(ctx, cx - 150 * k - f * 60, cy - 40 * k + i * 12, cx - 200 * k - f * 60, cy - 40 * k + i * 12,
          theme.sci["velocity"], { width: 2 });
        ctx.restore();
      }
    }
  } else if (view === "subsystem") {
    /* ---- one subsystem, laid out on the bench ---- */
    const color = theme.sci[sub.colorKey];
    const n = sub.parts.length;
    const trayW = Math.min(126, (W - 320) / n);
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
        labelLeader(ctx, px, py, toRight ? Math.min(W - 150, px + 62) : Math.max(120, px - 62), py,
          pieces[i].name, theme, { color, size: 11, align: toRight ? "left" : "right" });
      }
    }
    ctx.save();
    ctx.translate(cx, cy - 20);
    partIcon(ctx, sub.parts.find((p) => p.name === det.name)?.icon ?? "block", 34, color, theme, t, true);
    ctx.restore();
    wrapCaption(ctx, det.note, cx, H - 52, Math.min(W - 120, 520), theme, 11.5);
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
